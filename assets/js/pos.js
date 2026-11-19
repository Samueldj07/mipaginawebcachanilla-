/* La Cachanilla · Caja (POS) */
let productos = catalogoActivo();
let cfg = ajustes();
let orden = {};                 // id -> cantidad
let cat = 'Todo', filtro = '';
let pago = { metodo: 'Efectivo', recibido: '' };

const porId = id => productos.find(p => p.id === id);
const esBebida = p => /bebida/i.test(p.cat);

/* ---------- Cálculo ---------- */
function calcular(lineas) {
  const tasa = (Number(cfg.estatal) + Number(cfg.municipal)) / 100;
  const suma = r2(lineas.reduce((s, l) => s + l.precio * l.q, 0));
  const art = lineas.reduce((s, l) => s + l.q, 0);
  let subtotal, ivu, total;
  if (cfg.incluido) { total = suma; subtotal = r2(suma / (1 + tasa)); ivu = r2(total - subtotal); }
  else { subtotal = suma; ivu = r2(suma * tasa); total = r2(subtotal + ivu); }
  return { art, subtotal, ivu, total };
}
const lineasOrden = () => Object.entries(orden).map(([id, q]) => { const p = porId(id); return { id, nombre: p.nombre, precio: p.precio, q }; });

/* ---------- Catálogo ---------- */
function pintarCatalogo() {
  const cats = ['Todo', ...new Set(productos.map(p => p.cat))];
  $('#chips').innerHTML = cats.map(c => `<button class="${c === cat ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  const f = filtro.trim().toLowerCase();
  const lista = productos.filter(p => (cat === 'Todo' || p.cat === cat) && (!f || p.nombre.toLowerCase().includes(f)));
  $('#tiles').innerHTML = lista.map(p => {
    const q = orden[p.id] || 0;
    return `<div class="tile-w">
      <button class="tile ${esBebida(p) ? 'bebida' : ''} ${q ? 'sel' : ''}" data-add="${p.id}">
        ${q ? `<span class="q">${q}</span>` : ''}
        <span class="n">${esc(p.nombre)}</span><span class="p">${money(p.precio)}</span>
      </button>
      ${q ? `<button class="menos" data-menos="${p.id}" aria-label="Quitar uno">−</button>` : ''}
    </div>`;
  }).join('') || '<p class="vacio">Sin resultados.</p>';
}

/* ---------- Orden ---------- */
function htmlLineas() {
  const ls = lineasOrden();
  if (!ls.length) return '<p class="vacio">Toca un producto para agregarlo.</p>';
  return ls.map(l => `<div class="linea">
    <div class="nm">${esc(l.nombre)}<small>${money(l.precio)} c/u</small></div>
    <div class="st"><button data-d="-1" data-id="${l.id}">−</button><span>${l.q}</span><button data-d="1" data-id="${l.id}">+</button></div>
    <div class="t">${money(l.precio * l.q)}</div></div>`).join('');
}
function htmlTotales() {
  const c = calcular(lineasOrden());
  return `<div class="r"><span>Subtotal</span><span>${money(c.subtotal)}</span></div>
    <div class="r"><span>IVU (${r2(Number(cfg.estatal) + Number(cfg.municipal))}%)</span><span>${money(c.ivu)}</span></div>
    <div class="r big"><span>Total</span><span>${money(c.total)}</span></div>
    ${cfg.incluido ? '<div class="r" style="font-size:12px">Precios con IVU incluido</div>' : ''}
    <button class="cobrar" data-cobrar ${c.art ? '' : 'disabled'}>Cobrar ${money(c.total)}</button>`;
}
function pintarOrden() {
  $('#lineas').innerHTML = htmlLineas(); $('#totales').innerHTML = htmlTotales();
  if ($('#ovOrden').classList.contains('on')) { $('#lineasM').innerHTML = htmlLineas(); $('#totalesM').innerHTML = htmlTotales(); }
  const c = calcular(lineasOrden());
  $('#mCant').textContent = c.art + (c.art === 1 ? ' artículo' : ' artículos') + ' · ver orden ›';
  $('#mTot').textContent = money(c.total);
  $('#mCobrar').disabled = !c.art; $('#mCobrar').style.opacity = c.art ? 1 : .4;
}
function cambiar(id, d) {
  orden[id] = (orden[id] || 0) + d;
  if (orden[id] <= 0) delete orden[id];
  pintarCatalogo(); pintarOrden();
}
function limpiar() { orden = {}; pintarCatalogo(); pintarOrden(); cerrar('ovOrden'); }

/* ---------- Cobro ---------- */
function abrirPago() {
  const c = calcular(lineasOrden()); if (!c.art) return;
  pago = { metodo: 'Efectivo', recibido: '' };
  cerrar('ovOrden'); pintarPago(); abrir('ovPago');
}
function pintarPago() {
  const c = calcular(lineasOrden());
  const efectivo = pago.metodo === 'Efectivo';
  const rapidos = [...new Set([c.total, Math.ceil(c.total), Math.ceil(c.total / 5) * 5, Math.ceil(c.total / 10) * 10, Math.ceil(c.total / 20) * 20, 50, 100])]
    .filter(v => v >= c.total).sort((a, b) => a - b).slice(0, 4);
  $('#pagoHoja').innerHTML = `
    <h3>Cobrar</h3>
    <div class="sub" style="margin:0">${c.art} artículos · Subtotal ${money(c.subtotal)} · IVU ${money(c.ivu)}</div>
    <div class="debe">${money(c.total)}</div>
    <div class="metodos">${['Efectivo', 'ATH Móvil', 'Tarjeta'].map(m => `<button data-m="${m}" class="${pago.metodo === m ? 'on' : ''}">${m}</button>`).join('')}</div>
    ${efectivo ? `
      <label class="campo">Cliente entrega<input type="number" inputmode="decimal" step="0.01" id="recibido" placeholder="0.00" value="${esc(pago.recibido)}"></label>
      <div class="billetes">${rapidos.map(v => `<button data-bill="${v}">${v === c.total && v % 1 ? 'Exacto' : '$' + v}</button>`).join('')}</div>
      <div class="cambio" id="cambio">Cambio: —</div>`
    : `<p class="aviso" style="margin:0">Confirma que entró el pago de <b>${money(c.total)}</b> por ${pago.metodo} antes de completar.</p>`}
    <label class="campo" style="margin-top:12px">Cliente (opcional)<input id="cliente" placeholder="Nombre"></label>
    <div class="acciones">
      <button class="b b-sec" data-cerrar="ovPago">Atrás</button>
      <button class="b b-ok" id="completar">Completar venta</button>
    </div>`;
  const inp = $('#recibido');
  if (inp) { inp.addEventListener('input', e => { pago.recibido = e.target.value; actualizarCambio(); }); actualizarCambio(); setTimeout(() => inp.focus(), 50); }
}
function actualizarCambio() {
  const c = calcular(lineasOrden()), box = $('#cambio'), btn = $('#completar');
  if (!box) { btn.disabled = false; return; }
  const t = parseFloat(pago.recibido);
  if (isNaN(t)) { box.textContent = 'Cambio: —'; box.classList.remove('mal'); btn.disabled = true; return; }
  const ch = r2(t - c.total);
  box.textContent = ch < 0 ? 'Faltan ' + money(-ch) : 'Cambio: ' + money(ch);
  box.classList.toggle('mal', ch < 0); btn.disabled = ch < 0;
}
function completar() {
  const ls = lineasOrden(), c = calcular(ls);
  const lista = ventas();
  const num = (store.get('pos_consecutivo', 0) || 0) + 1;
  const recibido = pago.metodo === 'Efectivo' ? r2(parseFloat(pago.recibido)) : c.total;
  const v = {
    id: Date.now().toString(36), num, ts: Date.now(), lineas: ls,
    subtotal: c.subtotal, ivu: c.ivu, total: c.total, tasa: r2(Number(cfg.estatal) + Number(cfg.municipal)),
    metodo: pago.metodo, recibido, cambio: r2(recibido - c.total),
    cliente: ($('#cliente').value || '').trim(), lugar: cfg.lugar || ''
  };
  lista.push(v);
  if (!store.set('pos_ventas', lista)) return;
  store.set('pos_consecutivo', num);
  orden = {}; cerrar('ovPago'); pintarCatalogo(); pintarOrden();
  verRecibo(v.id, true);
  toast('Venta #' + num + ' guardada');
}

/* ---------- Recibo ---------- */
function textoRecibo(v) {
  return [
    `🧾 ${cfg.negocio} — Recibo #${v.num}`, `${fecha(v.ts)} ${hora(v.ts)}${v.lugar ? ' · ' + v.lugar : ''}`, '',
    ...v.lineas.map(l => `${l.q} × ${l.nombre}  ${money(l.precio * l.q)}`), '',
    `Subtotal: ${money(v.subtotal)}`, `IVU: ${money(v.ivu)}`, `TOTAL: ${money(v.total)}`,
    `Pago: ${v.metodo}${v.metodo === 'Efectivo' ? ` (recibido ${money(v.recibido)}, cambio ${money(v.cambio)})` : ''}`,
    v.anulada ? '*** VENTA ANULADA ***' : '✅ PAGADO', '', cfg.gracias
  ].join('\n');
}
function verRecibo(id, nueva) {
  const v = ventas().find(x => x.id === id); if (!v) return;
  $('#reciboHoja').innerHTML = `
    <div class="recibo ${v.anulada ? 'anulada' : ''}" id="reciboImp">
      <div class="cab"><b>${esc(cfg.negocio)}</b>${cfg.telefono ? esc(cfg.telefono) + '<br>' : ''}Recibo #${v.num} · ${fecha(v.ts)} ${hora(v.ts)}${v.lugar ? '<br>' + esc(v.lugar) : ''}${v.cliente ? '<br>Cliente: ' + esc(v.cliente) : ''}</div>
      <div class="pagado">${v.anulada ? 'ANULADA' : 'PAGADO'}</div>
      ${v.lineas.map(l => `<div class="r"><span>${l.q} × ${esc(l.nombre)}</span><span>${money(l.precio * l.q)}</span></div>`).join('')}
      <div class="r" style="margin-top:8px"><span>Subtotal</span><span>${money(v.subtotal)}</span></div>
      <div class="r"><span>IVU (${v.tasa}%)</span><span>${money(v.ivu)}</span></div>
      <div class="r tot"><span>Total</span><span>${money(v.total)}</span></div>
      <div class="r"><span>${esc(v.metodo)}</span><span>${money(v.recibido)}</span></div>
      ${v.metodo === 'Efectivo' ? `<div class="r"><span>Cambio</span><span>${money(v.cambio)}</span></div>` : ''}
      <p style="text-align:center;margin:10px 0 0;font-size:13px">${esc(cfg.gracias)}</p>
    </div>
    <label class="campo" style="margin-top:12px">WhatsApp del cliente (opcional)<input id="waCli" type="tel" placeholder="787-000-0000"></label>
    <div class="acciones">
      <button class="b b-sec" id="rWa">WhatsApp</button>
      <button class="b b-sec" id="rImp">Imprimir</button>
      ${!nueva && !v.anulada && diaKey(v.ts) === hoyKey() ? '<button class="b b-rojo" id="rAnular">Anular</button>' : ''}
    </div>
    <button class="b b-ok" style="width:100%;justify-content:center;margin-top:8px;padding:15px" data-cerrar="ovRecibo">${nueva ? 'Nueva venta' : 'Cerrar'}</button>`;
  $('#rWa').onclick = () => {
    let n = ($('#waCli').value || '').replace(/\D/g, '');
    if (n.length === 10) n = '1' + n;
    window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(textoRecibo(v)), '_blank');
  };
  $('#rImp').onclick = () => window.print();
  const an = $('#rAnular');
  if (an) an.onclick = () => {
    if (!confirm('¿Anular la venta #' + v.num + '? No contará en el cierre.')) return;
    const lista = ventas(); const x = lista.find(y => y.id === v.id); x.anulada = true; x.anuladaTs = Date.now();
    store.set('pos_ventas', lista); toast('Venta anulada'); verRecibo(v.id); pintarHoy();
  };
  abrir('ovRecibo');
}

/* ---------- Ventas de hoy ---------- */
function pintarHoy() {
  const hoy = ventas().filter(v => diaKey(v.ts) === hoyKey()).reverse();
  const r = resumirVentas(hoy);
  $('#hoyRes').textContent = `${r.n} ventas · ${r.art} artículos · ${money(r.total)}`;
  $('#hoyLista').innerHTML = hoy.length ? hoy.map(v => `
    <div class="venta ${v.anulada ? 'x' : ''}" data-recibo="${v.id}">
      <div class="h">#${v.num}<br><small style="font-weight:400;color:var(--gris)">${hora(v.ts)}</small></div>
      <div class="d"><b>${v.lineas.map(l => l.q + '× ' + esc(l.nombre)).join(', ')}</b>${v.cliente ? '<br>' + esc(v.cliente) : ''}</div>
      <span class="m">${v.anulada ? 'Anulada' : esc(v.metodo)}</span><div class="t">${money(v.total)}</div>
    </div>`).join('') : '<p class="vacio">Todavía no hay ventas hoy.</p>';
}

/* ---------- Cierre ---------- */
function ventasDe(dia) { return ventas().filter(v => diaKey(v.ts) === dia); }
function pintarCierre() {
  const dia = $('#cDia').value || hoyKey();
  const r = resumirVentas(ventasDe(dia));
  const anuladas = ventasDe(dia).filter(v => v.anulada).length;
  const prods = Object.entries(r.productos).sort((a, b) => b[1].q - a[1].q);
  $('#cierreBox').innerHTML = `
    <div class="kpis">
      <div class="kpi"><span>Total cobrado</span><b>${money(r.total)}</b></div>
      <div class="kpi"><span>Ventas</span><b>${r.n}</b></div>
      <div class="kpi"><span>Artículos</span><b>${r.art}</b></div>
      <div class="kpi"><span>IVU cobrado</span><b>${money(r.ivu)}</b></div>
    </div>
    <div class="caja"><h3>Por método de pago</h3>
      ${['Efectivo', 'ATH Móvil', 'Tarjeta'].map(m => `<div class="fila" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--linea)"><span>${m}</span><b>${money(r.metodos[m] || 0)}</b></div>`).join('')}
      <div class="fila" style="justify-content:space-between;padding:6px 0"><span>Subtotal (sin IVU)</span><b>${money(r.subtotal)}</b></div>
      ${anuladas ? `<p class="sub" style="margin:6px 0 0">${anuladas} venta(s) anulada(s) no incluidas.</p>` : ''}
    </div>
    <div class="caja"><h3>Por producto</h3>
      ${prods.length ? `<div class="tabla"><table><thead><tr><th>Producto</th><th class="n">Cant.</th><th class="n">Venta</th></tr></thead><tbody>
      ${prods.map(([n, p]) => `<tr><td>${esc(n)}</td><td class="n">${p.q}</td><td class="n">${money(p.total)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vacio">Sin ventas este día.</p>'}
    </div>`;
}
function textoCierre() {
  const dia = $('#cDia').value || hoyKey();
  const r = resumirVentas(ventasDe(dia));
  return [
    `📊 ${cfg.negocio} — Cierre ${dia}${cfg.lugar ? ' · ' + cfg.lugar : ''}`,
    `Ventas: ${r.n} · Artículos: ${r.art}`,
    `Subtotal: ${money(r.subtotal)} · IVU: ${money(r.ivu)}`,
    `TOTAL: ${money(r.total)}`, '',
    ...['Efectivo', 'ATH Móvil', 'Tarjeta'].map(m => `${m}: ${money(r.metodos[m] || 0)}`), '',
    ...Object.entries(r.productos).sort((a, b) => b[1].q - a[1].q).map(([n, p]) => `${p.q} × ${n} = ${money(p.total)}`)
  ].join('\n');
}
function csvCierre() {
  const dia = $('#cDia').value || hoyKey();
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const filas = [['Fecha', 'Hora', 'Recibo', 'Producto', 'Cantidad', 'Precio', 'Importe', 'Subtotal venta', 'IVU venta', 'Total venta', 'Método', 'Cliente', 'Lugar', 'Estado']];
  ventasDe(dia).forEach(v => v.lineas.forEach((l, i) => filas.push([
    fecha(v.ts), hora(v.ts), v.num, l.nombre, l.q, l.precio.toFixed(2), (l.precio * l.q).toFixed(2),
    i ? '' : v.subtotal.toFixed(2), i ? '' : v.ivu.toFixed(2), i ? '' : v.total.toFixed(2),
    v.metodo, v.cliente || '', v.lugar || '', v.anulada ? 'Anulada' : 'Pagada'])));
  descargar(`cachanilla-ventas-${dia}.csv`, '﻿' + filas.map(f => f.map(q).join(',')).join('\n'), 'text/csv;charset=utf-8');
}

/* ---------- Ajustes ---------- */
function pintarAjustes() {
  $('#aEst').value = cfg.estatal; $('#aMun').value = cfg.municipal; $('#aInc').checked = !!cfg.incluido;
  $('#aNeg').value = cfg.negocio; $('#aTel').value = cfg.telefono; $('#aLug').value = cfg.lugar; $('#aGra').value = cfg.gracias;
}
$('#aGuardar').onclick = () => {
  cfg = Object.assign(cfg, {
    estatal: Number($('#aEst').value) || 0, municipal: Number($('#aMun').value) || 0, incluido: $('#aInc').checked,
    negocio: $('#aNeg').value.trim() || 'La Cachanilla', telefono: $('#aTel').value.trim(), lugar: $('#aLug').value.trim(), gracias: $('#aGra').value.trim()
  });
  if (store.set('pos_ajustes', cfg)) { toast('Ajustes guardados'); pintarOrden(); }
};
$('#rExp').onclick = () => descargar(`cachanilla-respaldo-${hoyKey()}.json`,
  JSON.stringify({ ventas: ventas(), ajustes: cfg, consecutivo: store.get('pos_consecutivo', 0) }, null, 1), 'application/json');
$('#rImp').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.ventas)) throw 0;
    if (!confirm(`Restaurar ${d.ventas.length} ventas? Se combinarán con las de este equipo.`)) return;
    const actuales = ventas(), ids = new Set(actuales.map(v => v.id));
    const todas = actuales.concat(d.ventas.filter(v => !ids.has(v.id))).sort((a, b) => a.ts - b.ts);
    store.set('pos_ventas', todas);
    store.set('pos_consecutivo', Math.max(store.get('pos_consecutivo', 0), d.consecutivo || 0));
    toast('Respaldo restaurado'); pintarHoy();
  } catch (err) { toast('Archivo no válido', true); }
  e.target.value = '';
};

/* ---------- Navegación y eventos ---------- */
function abrir(id) { $('#' + id).classList.add('on'); }
function cerrar(id) { $('#' + id).classList.remove('on'); }
function ir(v) {
  $$('.tabs button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $$('.vista').forEach(s => s.classList.toggle('on', s.id === v));
  $('#barra').style.display = v === 'vender' ? '' : 'none';
  if (v === 'hoy') pintarHoy();
  if (v === 'cierre') { if (!$('#cDia').value) $('#cDia').value = hoyKey(); pintarCierre(); }
  if (v === 'ajustes') pintarAjustes();
}
$$('.tabs button[data-v]').forEach(b => b.onclick = () => ir(b.dataset.v));
$('#chips').onclick = e => { const b = e.target.closest('button'); if (b) { cat = b.dataset.c; pintarCatalogo(); } };
$('#buscar').oninput = e => { filtro = e.target.value; pintarCatalogo(); };
$('#tiles').onclick = e => {
  const m = e.target.closest('[data-menos]'); if (m) return cambiar(m.dataset.menos, -1);
  const a = e.target.closest('[data-add]'); if (a) cambiar(a.dataset.add, 1);
};
document.addEventListener('click', e => {
  const d = e.target.closest('[data-d]'); if (d) return cambiar(d.dataset.id, Number(d.dataset.d));
  if (e.target.closest('[data-cobrar]')) return abrirPago();
  const c = e.target.closest('[data-cerrar]'); if (c) return cerrar(c.dataset.cerrar);
  const m = e.target.closest('[data-m]'); if (m) { pago.metodo = m.dataset.m; return pintarPago(); }
  const bl = e.target.closest('[data-bill]'); if (bl) { pago.recibido = bl.dataset.bill; $('#recibido').value = pago.recibido; return actualizarCambio(); }
  if (e.target.id === 'completar') return completar();
  const r = e.target.closest('[data-recibo]'); if (r) return verRecibo(r.dataset.recibo);
  if (e.target.classList.contains('ov')) e.target.classList.remove('on');
});
$('#limpiar').onclick = limpiar; $('#limpiarM').onclick = limpiar;
$('#mCobrar').onclick = abrirPago;
$('.barra .info').onclick = () => { $('#lineasM').innerHTML = htmlLineas(); $('#totalesM').innerHTML = htmlTotales(); abrir('ovOrden'); };
$('#cDia').onchange = pintarCierre;
$('#cCopiar').onclick = () => copiar(textoCierre());
$('#cWa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(textoCierre()), '_blank');
$('#cCsv').onclick = csvCierre;
window.addEventListener('storage', e => { if (e.key === 'cach_catalogo_borrador') { productos = catalogoActivo(); pintarCatalogo(); } });

pintarCatalogo(); pintarOrden();
