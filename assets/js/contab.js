/* =====================================================================
   La Cachanilla · Contabilidad (lógica compartida con la Caja)
   ---------------------------------------------------------------------
   · Junta las ventas de todas las cajas (repositorio privado de datos,
     archivos ventas-AAAA-MM.json), los cobros de Comercios y los gastos.
   · Genera los documentos (ventas del día, cierre del día, libro y
     resumen del mes) y los manda a OneDrive (OD, onedrive.js).
   Necesita: admin-comun.js, github.js y onedrive.js.
   ===================================================================== */
const CONTA = (() => {
  const repo = () => store.get('b2b_repo', '');
  const listo = () => !!(repo() && typeof ghConectado === 'function' && ghConectado());
  const equipo = () => { let e = store.get('equipo_id', ''); if (!e) { e = 'eq-' + Math.random().toString(36).slice(2, 7); store.set('equipo_id', e); } return e; };
  const b64dec = s => decodeURIComponent(escape(atob(String(s).replace(/\n/g, ''))));
  const mesDe = ts => diaKey(ts).slice(0, 7);
  const vers = o => (o.anulada ? 1e15 : 0) + (o.mod || o.ts || 0);

  /* Une dos listas por id; gana la versión más nueva (o la anulada) */
  function unir(a = [], b = [], v = x => x.mod || 0) {
    const m = new Map(); [...a, ...b].forEach(o => { const p = m.get(o.id); if (!p || v(o) >= v(p)) m.set(o.id, o); }); return [...m.values()];
  }
  /* Lee, une y escribe un archivo JSON del repositorio privado */
  async function sincronizarArchivo(archivo, local, combinar, mensaje) {
    for (let i = 0; i < 2; i++) {
      const r = await ghPedir(`/repos/${repo()}/contents/${archivo}`).catch(e => { if (e.status === 404) return null; throw e; });
      const remoto = r ? JSON.parse(b64dec(r.content)) : null;
      const unido = remoto ? combinar(local, remoto) : local;
      if (remoto && JSON.stringify(unido) === JSON.stringify(combinar(remoto, remoto))) return unido;
      try {
        await ghPedir(`/repos/${repo()}/contents/${archivo}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: mensaje, content: b64utf8(JSON.stringify(unido)), sha: r ? r.sha : undefined }) });
        return unido;
      } catch (e) { if (e.status !== 409 || i) throw e; }
    }
  }

  /* ---------- Ventas de todas las cajas ---------- */
  const locales = () => ventas().map(v => Object.assign({ eq: equipo() }, v));
  function ventasTodas() { return unir(locales(), store.get('ventas_remotas', []), vers).sort((a, b) => a.ts - b.ts); }
  async function sincronizarVentas(meses) {
    if (!listo()) return false;
    const lista = meses || [...new Set([mesDe(Date.now()), mesDe(Date.now() - 32 * 864e5)])];
    let remotas = store.get('ventas_remotas', []);
    for (const mes of lista) {
      const mias = locales().filter(v => mesDe(v.ts) === mes);
      const r = await sincronizarArchivo(`ventas-${mes}.json`, { ventas: mias }, (a, b) => ({ ventas: unir(a.ventas, b.ventas, vers).sort((x, y) => x.ts - y.ts) }), 'Ventas de caja ' + mes);
      remotas = unir(remotas.filter(v => mesDe(v.ts) !== mes), r ? r.ventas : [], vers);
    }
    store.set('ventas_remotas', remotas);
    return true;
  }

  /* ---------- Gastos ---------- */
  const CATEGORIAS = ['Ingredientes', 'Empaques y desechables', 'Gas y electricidad', 'Agua', 'Renta', 'Equipo y utensilios', 'Nómina', 'Transporte y gasolina',
    'Permisos y licencias', 'Comisiones (ATH, Stripe, PayPal)', 'Mercados y eventos (espacio)', 'Publicidad', 'Mantenimiento', 'Préstamo (pago)', 'Otros'];
  const datos = () => Object.assign({ gastos: [] }, store.get('conta', {}));
  const gastos = () => datos().gastos.filter(g => !g.borrado).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  function guardarGastos(g) { const d = datos(); d.gastos = g; store.set('conta', d); }
  async function sincronizarGastos() {
    if (!listo()) return false;
    const r = await sincronizarArchivo('contabilidad.json', datos(), (a, b) => ({ gastos: unir(a.gastos, b.gastos) }), 'Contabilidad: gastos');
    if (r) store.set('conta', Object.assign(datos(), r));
    return true;
  }

  /* ---------- Cobros de Comercios (pagos registrados en facturas) ---------- */
  function cobrosComercios() {
    const B = store.get('b2b', { pedidos: [] }), out = [];
    (B.pedidos || []).forEach(p => {
      if (p.anulada) return;
      const sub = (p.lineas || []).reduce((s, l) => s + Number(l.precio) * Number(l.q), 0);
      const ivu = p.exento ? 0 : sub * Number(p.tasa || 0) / 100, total = sub + ivu;
      (p.pagos || []).filter(x => !x.anulado).forEach(pg => {
        const parte = total ? Number(pg.monto) / total : 0;
        out.push({ fecha: pg.fecha, cliente: p.cliente && p.cliente.nombre, factura: p.num, recibo: pg.num, metodo: pg.metodo, total: r2(Number(pg.monto)), ivu: r2(ivu * parte), subtotal: r2(Number(pg.monto) - ivu * parte) });
      });
    });
    return out;
  }

  /* ---------- Nómina estimada (Registro de horas) ---------- */
  function nominaDe(desde, hasta) {
    const H = store.get('horas', { registros: [], tarifas: {} });
    return r2((H.registros || []).filter(r => !r.borrado && r.salida && r.entrada >= desde && r.entrada < hasta)
      .reduce((s, r) => s + (r.salida - r.entrada) / 36e5 * Number((H.tarifas || {})[r.u] ?? 20), 0));
  }

  /* ---------- Cálculos ---------- */
  const rangoDia = dia => { const a = new Date(dia + 'T00:00').getTime(); return [a, a + 864e5]; };
  const rangoMes = mes => { const a = new Date(mes + '-01T00:00'); const b = new Date(a); b.setMonth(b.getMonth() + 1); return [a.getTime(), b.getTime()]; };
  function dia(d) {
    const vs = ventasTodas().filter(v => diaKey(v.ts) === d);
    const r = resumirVentas(vs);
    const cc = cobrosComercios().filter(c => c.fecha === d);
    const gs = gastos().filter(g => g.fecha === d);
    const ingresos = r2(r.subtotal + cc.reduce((s, c) => s + c.subtotal, 0));
    const ivu = r2(r.ivu + cc.reduce((s, c) => s + c.ivu, 0));
    const gastoT = r2(gs.reduce((s, g) => s + Number(g.monto), 0));
    return { d, ventas: vs, r, cc, gs, ingresos, ivu, cobrado: r2(r.total + cc.reduce((s, c) => s + c.total, 0)), gastos: gastoT, neto: r2(ingresos - gastoT), anuladas: vs.filter(v => v.anulada).length };
  }
  function mes(m) {
    const [a, b] = rangoMes(m), dias = [];
    for (let t = a; t < b; t += 864e5) { const x = dia(diaKey(t + 3 * 36e5)); if (x.ventas.length || x.cc.length || x.gs.length) dias.push(x); }
    const suma = k => r2(dias.reduce((s, x) => s + x[k], 0));
    const porCat = {}; dias.forEach(x => x.gs.forEach(g => porCat[g.categoria] = r2((porCat[g.categoria] || 0) + Number(g.monto))));
    const porMet = {}; dias.forEach(x => Object.entries(x.r.metodos).forEach(([k, v]) => porMet[k] = r2((porMet[k] || 0) + v)));
    const nomina = nominaDe(a, b), nominaRegistrada = porCat['Nómina'] || 0;
    return { m, dias, ingresos: suma('ingresos'), ivu: suma('ivu'), cobrado: suma('cobrado'), gastos: suma('gastos'), neto: suma('neto'), porCat, porMet, nomina, nominaRegistrada };
  }

  /* ---------- Documentos ---------- */
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = filas => '﻿' + filas.map(f => f.map(q).join(',')).join('\r\n');
  const n2 = n => (Math.round(n * 100) / 100).toFixed(2);
  const fLarga = d => new Date(d + 'T12:00').toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const nomMes = m => new Date(m + '-15T12:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' });

  function csvVentasDia(d) {
    const x = dia(d), filas = [['Recibo', 'Fecha', 'Hora', 'Caja', 'Productos', 'Subtotal', 'IVU', 'Total', 'Método', 'Estado', 'Cliente', 'Lugar']];
    x.ventas.forEach(v => filas.push([v.num, fecha(v.ts), hora(v.ts), v.eq || '', v.lineas.map(l => `${l.q} x ${l.nombre}`).join('; '), n2(v.subtotal), n2(v.ivu), n2(v.total), v.metodo, v.anulada ? 'ANULADA' : 'Pagada', v.cliente || '', v.lugar || '']));
    x.cc.forEach(c => filas.push([c.recibo, c.fecha, '', 'Comercios', `Pago factura ${c.factura} · ${c.cliente || ''}`, n2(c.subtotal), n2(c.ivu), n2(c.total), c.metodo || '', 'Cobrado', c.cliente || '', '']));
    return csv(filas);
  }
  const estilo = `<style>body{font-family:Arial,Helvetica,sans-serif;color:#1d2433;max-width:780px;margin:24px auto;padding:0 16px}h1{color:#006b50;margin:0}h2{color:#12286b;font-size:17px;margin:22px 0 6px;border-bottom:2px solid #ee5876;padding-bottom:4px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:5px 6px;border-bottom:1px solid #ddd;text-align:left}td.n,th.n{text-align:right}.tot td{font-weight:bold;border-top:2px solid #333}.k{display:flex;flex-wrap:wrap;gap:10px}.k div{flex:1;min-width:140px;border:1px solid #ddd;border-radius:8px;padding:10px}.k b{display:block;font-size:20px}small{color:#666}</style>`;
  const fila = (a, b, cls) => `<tr class="${cls || ''}"><td>${esc(a)}</td><td class="n">${b}</td></tr>`;
  function htmlCierre(d) {
    const x = dia(d), r = x.r;
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Cierre ${d} · La Cachanilla</title>${estilo}</head><body>
<h1>La Cachanilla · Cierre del día</h1><p><b>${esc(fLarga(d))}</b><br><small>Generado ${fecha(Date.now())} ${hora(Date.now())}. Incluye todas las cajas sincronizadas.</small></p>
<div class="k"><div><small>Ventas (sin IVU)</small><b>${money(x.ingresos)}</b></div><div><small>IVU cobrado</small><b>${money(x.ivu)}</b></div><div><small>Gastos</small><b>${money(x.gastos)}</b></div><div><small>Resultado del día</small><b>${money(x.neto)}</b></div></div>
<h2>Cobrado por método</h2><table>${Object.entries(r.metodos).map(([k, v]) => fila(k, money(v))).join('')}${x.cc.length ? fila('Comercios (facturas cobradas)', money(x.cc.reduce((s, c) => s + c.total, 0))) : ''}${fila('Total cobrado', money(x.cobrado), 'tot')}</table>
<h2>Productos vendidos</h2><table><tr><th>Producto</th><th class="n">Cant.</th><th class="n">Venta</th></tr>${Object.entries(r.productos).sort((a, b) => b[1].total - a[1].total).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${v.q}</td><td class="n">${money(v.total)}</td></tr>`).join('')}</table>
<h2>Gastos del día</h2>${x.gs.length ? `<table>${x.gs.map(g => fila(`${g.categoria} · ${g.descripcion || ''}`, money(Number(g.monto)))).join('')}${fila('Total gastos', money(x.gastos), 'tot')}</table>` : '<p><small>Sin gastos registrados.</small></p>'}
<h2>Ventas</h2><table><tr><th>Recibo</th><th>Hora</th><th>Método</th><th class="n">Total</th></tr>${x.ventas.map(v => `<tr><td>#${v.num}${v.anulada ? ' (ANULADA)' : ''}</td><td>${hora(v.ts)}</td><td>${esc(v.metodo)}</td><td class="n">${money(v.total)}</td></tr>`).join('')}</table>
<p><small>${r.n} ventas válidas · ${x.anuladas} anuladas · ${r.art} artículos.</small></p></body></html>`;
  }
  function csvLibroMes(m) {
    const M = mes(m), filas = [['Fecha', 'Tipo', 'Categoría / método', 'Detalle', 'Ingreso (sin IVU)', 'IVU', 'Gasto', 'Documento']];
    M.dias.forEach(x => {
      Object.entries(x.ventas.filter(v => !v.anulada).reduce((o, v) => { const k = v.metodo; o[k] = o[k] || { s: 0, i: 0, n: 0 }; o[k].s += v.subtotal; o[k].i += v.ivu; o[k].n++; return o; }, {}))
        .forEach(([met, o]) => filas.push([x.d, 'Venta caja', met, `${o.n} ventas`, n2(o.s), n2(o.i), '', `cierre-${x.d}.html`]));
      x.cc.forEach(c => filas.push([x.d, 'Cobro comercio', c.metodo || '', `${c.cliente || ''} · factura ${c.factura}`, n2(c.subtotal), n2(c.ivu), '', c.recibo]));
      x.gs.forEach(g => filas.push([x.d, 'Gasto', g.categoria, `${g.descripcion || ''}${g.suplidor ? ' · ' + g.suplidor : ''}`, '', '', n2(Number(g.monto)), g.factura || '']));
    });
    filas.push([]); filas.push(['', 'TOTALES', '', '', n2(M.ingresos), n2(M.ivu), n2(M.gastos), '']);
    return csv(filas);
  }
  function htmlResumenMes(m) {
    const M = mes(m);
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Resumen ${m} · La Cachanilla</title>${estilo}</head><body>
<h1>La Cachanilla · Resumen de ${esc(nomMes(m))}</h1><p><small>Generado ${fecha(Date.now())} ${hora(Date.now())}. Base de efectivo: ventas de caja + cobros de comercios − gastos registrados.</small></p>
<div class="k"><div><small>Ingresos (sin IVU)</small><b>${money(M.ingresos)}</b></div><div><small>Gastos</small><b>${money(M.gastos)}</b></div><div><small>Resultado</small><b>${money(M.neto)}</b></div><div><small>IVU a remitir a Hacienda</small><b>${money(M.ivu)}</b></div></div>
<h2>Estado de resultados</h2><table>${fila('Ventas e ingresos (sin IVU)', money(M.ingresos))}${Object.entries(M.porCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => fila('− ' + k, money(v))).join('')}${fila('Resultado del mes', money(M.neto), 'tot')}</table>
${M.nomina && !M.nominaRegistrada ? `<p><small>Nómina estimada según el Registro de horas: <b>${money(M.nomina)}</b> (bruta). No está restada arriba hasta que la registres como gasto “Nómina”. Resultado si se paga: <b>${money(M.neto - M.nomina)}</b>.</small></p>` : ''}
<h2>Cobrado por método (caja)</h2><table>${Object.entries(M.porMet).map(([k, v]) => fila(k, money(v))).join('')}</table>
<h2>Por día</h2><table><tr><th>Día</th><th class="n">Ingresos</th><th class="n">IVU</th><th class="n">Gastos</th><th class="n">Resultado</th></tr>${M.dias.map(x => `<tr><td>${esc(x.d)}</td><td class="n">${money(x.ingresos)}</td><td class="n">${money(x.ivu)}</td><td class="n">${money(x.gastos)}</td><td class="n">${money(x.neto)}</td></tr>`).join('')}
<tr class="tot"><td>Total</td><td class="n">${money(M.ingresos)}</td><td class="n">${money(M.ivu)}</td><td class="n">${money(M.gastos)}</td><td class="n">${money(M.neto)}</td></tr></table>
<p><small>El IVU a remitir es el cobrado a clientes; la planilla mensual de IVU se radica en SURI. Revisa con tu contador antes de radicar.</small></p></body></html>`;
  }

  /* Manda a OneDrive los documentos de un día y de su mes */
  function documentosDe(d) {
    const m = d.slice(0, 7);
    OD.encolar(`${m}/ventas-${d}.csv`, csvVentasDia(d), 'text/csv; charset=utf-8');
    OD.encolar(`${m}/cierre-${d}.html`, htmlCierre(d), 'text/html; charset=utf-8');
    OD.encolar(`${m}/libro-${m}.csv`, csvLibroMes(m), 'text/csv; charset=utf-8');
    OD.encolar(`${m}/resumen-${m}.html`, htmlResumenMes(m), 'text/html; charset=utf-8');
  }

  /* Llamado por la Caja después de cada venta o anulación */
  async function trasVenta(v) {
    try { await sincronizarVentas([mesDe(v.ts)]); } catch (e) {}
    if (store.get('conta_auto', true)) documentosDe(diaKey(v.ts));
  }
  return { equipo, ventasTodas, sincronizarVentas, sincronizarGastos, gastos, guardarGastos, datos, CATEGORIAS, cobrosComercios, dia, mes, nominaDe,
    csvVentasDia, htmlCierre, csvLibroMes, htmlResumenMes, documentosDe, trasVenta, listo, nomMes, fLarga };
})();
