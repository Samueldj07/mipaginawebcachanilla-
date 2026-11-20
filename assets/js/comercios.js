/* =====================================================================
   La Cachanilla · Pedidos de comercios, facturas, recibos y cobros
   ---------------------------------------------------------------------
   Los datos NO van al sitio público. Se guardan en este equipo y, si se
   conecta, en un repositorio PRIVADO de GitHub para compartirlos entre
   administradores (comercios.json).
   ===================================================================== */
(() => {
  const KEY = 'b2b', REPO_KEY = 'b2b_repo', ARCHIVO = 'comercios.json';
  const hoyISO = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  const sumarDias = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + Number(n || 0)); return d.toISOString().slice(0, 10); };
  const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
  const fLarga = iso => iso ? new Date(iso + 'T12:00').toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fCorta = iso => iso ? new Date(iso + 'T12:00').toLocaleDateString('es-PR', { day: '2-digit', month: 'short' }) : '—';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ahora = () => Date.now();
  const yoNombre = () => (sesionActual() || {}).nombre || '';

  const BASE = {
    clientes: [], pedidos: [], seq: { F: 0, R: 0 },
    factura: {
      nombre: 'La Cachanilla Repostería Mexicana', dir: 'Edificio 1109, Santa Rita, Río Piedras, PR 00925',
      tel: '939-254-0736', correo: 'lacachanillamx@outlook.com', registro: '', ivu: 11.5,
      pago: 'ATH Móvil 939-254-0736, efectivo o transferencia', pie: '¡Gracias por su preferencia! Un antojo mexicano, donde quiera que vayamos.'
    }
  };
  let D = Object.assign({}, JSON.parse(JSON.stringify(BASE)), store.get(KEY, {}));
  D.factura = Object.assign({}, BASE.factura, D.factura || {});
  D.seq = Object.assign({ F: 0, R: 0 }, D.seq || {});
  // IVU regular 11.5% (10.5% estatal + 1% municipal), sin exención
  if (!D.factura.mod || D.factura.ivu === 7) D.factura.ivu = 11.5;

  /* ---------- Cálculos ---------- */
  const totales = p => {
    const subtotal = r2(p.lineas.reduce((s, l) => s + Number(l.precio) * Number(l.q), 0));
    const ivu = p.exento ? 0 : r2(subtotal * Number(p.tasa) / 100);
    const total = r2(subtotal + ivu);
    const pagado = r2((p.pagos || []).filter(x => !x.anulado).reduce((s, x) => s + Number(x.monto), 0));
    return { subtotal, ivu, total, pagado, saldo: r2(total - pagado) };
  };
  function estado(p) {
    if (p.anulada) return 'anulada';
    const t = totales(p);
    if (t.saldo <= 0.004) return 'pagada';
    if (p.vence && p.vence < hoyISO()) return 'vencida';
    return t.pagado > 0 ? 'parcial' : 'pendiente';
  }
  const EST_TXT = { pendiente: 'Pendiente', vencida: 'Vencida', parcial: 'Pago parcial', pagada: 'Pagada', anulada: 'Anulada' };
  const porCobrar = () => D.pedidos.filter(p => !p.anulada && totales(p).saldo > 0.004);
  function cuandoVence(p) {
    if (!p.vence) return { txt: 'Sin fecha', cls: '' };
    const d = diasEntre(hoyISO(), p.vence);
    if (d < 0) return { txt: `Vencida hace ${-d} día${d === -1 ? '' : 's'}`, cls: 'vencida' };
    if (d === 0) return { txt: 'Vence hoy', cls: 'hoy' };
    return { txt: `Vence en ${d} día${d === 1 ? '' : 's'} (${fCorta(p.vence)})`, cls: d <= 3 ? 'pronto' : '' };
  }

  /* ---------- Guardar y sincronizar (repo privado) ---------- */
  const repoDatos = () => store.get(REPO_KEY, '');
  const b64dec = s => decodeURIComponent(escape(atob(String(s).replace(/\n/g, ''))));
  function combinar(a, b) {            // une dos copias por id, gana la modificación más reciente
    const une = (x = [], y = []) => { const m = new Map(); [...x, ...y].forEach(o => { const v = m.get(o.id); if (!v || (o.mod || 0) >= (v.mod || 0)) m.set(o.id, o); }); return [...m.values()]; };
    return {
      clientes: une(a.clientes, b.clientes), pedidos: une(a.pedidos, b.pedidos).sort((x, y) => (x.creado || 0) - (y.creado || 0)),
      seq: { F: Math.max(a.seq?.F || 0, b.seq?.F || 0), R: Math.max(a.seq?.R || 0, b.seq?.R || 0) },
      factura: (b.factura?.mod || 0) > (a.factura?.mod || 0) ? b.factura : a.factura
    };
  }
  async function leerRemoto() {
    const r = await ghPedir(`/repos/${repoDatos()}/contents/${ARCHIVO}`).catch(e => { if (e.status === 404) return null; throw e; });
    return r ? { datos: JSON.parse(b64dec(r.content)), sha: r.sha } : { datos: null, sha: undefined };
  }
  let sincronizando = false, pendienteSync = false, ultimaSync = store.get('b2b_sync', 0), errorSync = '';
  async function sincronizar() {
    if (!repoDatos() || !ghConectado()) { pintarSync(); return; }
    if (sincronizando) { pendienteSync = true; return; }
    sincronizando = true; errorSync = ''; pintarSync();
    try {
      for (let intento = 0; intento < 2; intento++) {
        const { datos, sha } = await leerRemoto();
        const unido = datos ? combinar(D, datos) : D;
        D = Object.assign(D, unido); store.set(KEY, D);
        if (datos && JSON.stringify(unido) === JSON.stringify(datos)) break;
        try {
          await ghPedir(`/repos/${repoDatos()}/contents/${ARCHIVO}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Pedidos de comercios · ' + yoNombre(), content: b64utf8(JSON.stringify(D, null, 1)), sha }) });
          break;
        } catch (e) { if (e.status !== 409 || intento) throw e; }
      }
      ultimaSync = ahora(); store.set('b2b_sync', ultimaSync);
    } catch (e) { errorSync = e.message; }
    sincronizando = false; pintarTodoB2B();
    if (pendienteSync) { pendienteSync = false; sincronizar(); }
  }
  function guardar() { store.set(KEY, D); pintarTodoB2B(); sincronizar(); }
  function pintarSync() {
    const box = $('#syncEstado'); if (!box) return;
    if (!repoDatos()) { box.innerHTML = '<div class="aviso">Los pedidos se guardan solo en este equipo. Para compartirlos con los otros administradores, conéctalos en <b>Datos de factura → Compartir los datos</b>.</div>'; return; }
    if (!ghConectado()) { box.innerHTML = '<div class="aviso">Este equipo no está conectado a GitHub (pestaña <b>Conexión y avisos</b>), así que los pedidos no se comparten.</div>'; return; }
    box.innerHTML = sincronizando ? '<p class="sub" style="font-size:13px">⏳ Sincronizando…</p>'
      : errorSync ? `<div class="aviso" style="border-color:var(--rojo)">No se pudo sincronizar: ${esc(errorSync)} Tus cambios siguen guardados en este equipo.</div>`
      : `<p class="sub" style="font-size:13px">✓ Compartido con los administradores · última sincronización ${ultimaSync ? new Date(ultimaSync).toLocaleTimeString('es-PR', { hour: 'numeric', minute: '2-digit' }) : '—'}</p>`;
  }

  /* ---------- Navegación interna ---------- */
  function sub(v) {
    $$('.chips-b2b button').forEach(b => b.classList.toggle('on', b.dataset.sub === v));
    $$('.sub-b2b').forEach(x => x.classList.toggle('on', x.id === 'b-' + v));
    if (v === 'nuevo' && !editando) nuevoPedido();
    if (v === 'config') pintarConfig();
  }
  $$('.chips-b2b button').forEach(b => b.onclick = () => { if (b.dataset.sub === 'nuevo') editando = null; sub(b.dataset.sub); });

  /* ---------- Lista de pedidos ---------- */
  function pintarLista() {
    const f = $('#bFiltro').value, q = $('#bBuscar').value.trim().toLowerCase();
    const lista = D.pedidos.filter(p => {
      const e = estado(p);
      if (f === 'pendientes' && !['pendiente', 'vencida', 'parcial'].includes(e)) return false;
      if (f === 'pagados' && e !== 'pagada') return false;
      if (f === 'anulados' && e !== 'anulada') return false;
      if (f !== 'anulados' && f !== 'todos' && e === 'anulada') return false;
      return !q || (p.cliente.nombre + ' ' + p.num).toLowerCase().includes(q);
    }).slice().reverse();
    const pc = porCobrar(), mes = hoyISO().slice(0, 7);
    const vendidoMes = D.pedidos.filter(p => !p.anulada && (p.fecha || '').startsWith(mes)).reduce((s, p) => s + totales(p).total, 0);
    $('#b2bKpis').innerHTML = `
      <div class="kpi"><span>Por cobrar</span><b>${money(pc.reduce((s, p) => s + totales(p).saldo, 0))}</b></div>
      <div class="kpi"><span>Facturas abiertas</span><b>${pc.length}</b></div>
      <div class="kpi"><span>Vencidas</span><b>${pc.filter(p => estado(p) === 'vencida').length}</b></div>
      <div class="kpi"><span>Vendido este mes</span><b>${money(vendidoMes)}</b></div>`;
    $('#bLista').innerHTML = lista.length ? lista.map(p => {
      const e = estado(p), t = totales(p);
      return `<div class="ped ${e}" data-ver="${p.id}">
        <div class="num">${esc(p.num)}<small>${fCorta(p.fecha)}</small></div>
        <div class="info"><b>${esc(p.cliente.nombre)}</b><small>${p.lineas.reduce((s, l) => s + Number(l.q), 0)} productos · entrega ${fCorta(p.entrega)}${e !== 'pagada' && e !== 'anulada' ? ' · ' + cuandoVence(p).txt.toLowerCase() : ''}</small></div>
        <span class="est ${e}">${EST_TXT[e]}</span>
        <div class="monto">${money(t.total)}${t.saldo > 0.004 && e !== 'anulada' && t.pagado > 0 ? `<small style="color:var(--rojo)">debe ${money(t.saldo)}</small>` : ''}</div>
      </div>`;
    }).join('') : '<p class="vacio">No hay pedidos en esta lista. Toca <b>+ Nuevo pedido</b>.</p>';
  }
  $('#bFiltro').onchange = pintarLista; $('#bBuscar').oninput = pintarLista;
  document.addEventListener('click', e => {
    const v = e.target.closest('[data-ver]'); if (v) verDocumento(v.dataset.ver);
  });

  /* ---------- Nuevo / editar pedido ---------- */
  let editando = null, borrador = null;
  const productosCatalogo = () => (window.CACHANILLA ? window.CACHANILLA.productos : []);
  function opcionesProducto() {
    const ps = productosCatalogo();
    const filas = [];
    ps.forEach(p => (p.opciones && p.opciones.length ? p.opciones.map(o => ({ nombre: `${p.nombre} (${o})`, precio: p.precio })) : [{ nombre: p.nombre, precio: p.precio }])
      .forEach(x => filas.push(x)));
    $('#pProducto').innerHTML = '<option value="">Elige un producto del menú…</option>' + filas.map((x, i) => `<option value="${i}">${esc(x.nombre)} · ${money(x.precio)}</option>`).join('');
    $('#pProducto')._filas = filas;
  }
  function nuevoPedido(p) {
    editando = p ? p.id : null;
    borrador = p ? JSON.parse(JSON.stringify(p)) : { lineas: [], exento: false, tasa: D.factura.ivu };
    const c = borrador.cliente || {};
    $('#pTitulo').textContent = p ? `Editar ${p.num}` : 'Nuevo pedido de comercio';
    $('#pCliente').value = c.nombre || ''; $('#pContacto').value = c.contacto || ''; $('#pTel').value = c.tel || '';
    $('#pCorreo').value = c.correo || ''; $('#pDir').value = c.dir || '';
    $('#pFecha').value = borrador.fecha || hoyISO(); $('#pEntrega').value = borrador.entrega || hoyISO();
    $('#pTerminos').value = String(borrador.terminos ?? 15); $('#pNotas').value = borrador.notas || '';
    $('#pGuardarPagado').style.display = p ? 'none' : '';
    $('#pGuardar').textContent = p ? 'Guardar cambios' : 'Guardar y crear factura';
    $('#dlClientes').innerHTML = D.clientes.filter(x => !x.inactivo).map(x => `<option value="${esc(x.nombre)}">`).join('');
    opcionesProducto(); pintarLineas();
  }
  function pintarLineas() {
    $('#pLineas').innerHTML = borrador.lineas.map((l, i) => `<tr data-l="${i}">
      <td><input data-k="nombre" value="${esc(l.nombre)}"></td>
      <td class="n"><input class="num" data-k="q" type="number" min="0" step="1" value="${l.q}"></td>
      <td class="n"><input class="num" data-k="precio" type="number" min="0" step="0.05" value="${l.precio}"></td>
      <td class="n"><b>${money(Number(l.q) * Number(l.precio))}</b></td>
      <td><button class="b b-rojo" style="padding:5px 9px" data-ql="${i}" type="button">✕</button></td></tr>`).join('')
      || '<tr><td colspan="5" class="vacio">Añade productos del menú o una línea libre.</td></tr>';
    pintarTotalesForm();
  }
  function pintarTotalesForm() {
    borrador.exento = false; borrador.tasa = D.factura.ivu;
    const t = totales({ ...borrador, pagos: [] });
    $('#pTotales').innerHTML = `<div class="r"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      <div class="r"><span>IVU (${D.factura.ivu}%)</span><span>${money(t.ivu)}</span></div>
      <div class="r big"><span>Total</span><span>${money(t.total)}</span></div>`;
  }
  $('#pLineas').addEventListener('input', e => {
    const tr = e.target.closest('[data-l]'); if (!tr) return;
    const l = borrador.lineas[tr.dataset.l], k = e.target.dataset.k;
    l[k] = k === 'nombre' ? e.target.value : Number(e.target.value) || 0;
    tr.children[3].innerHTML = `<b>${money(Number(l.q) * Number(l.precio))}</b>`; pintarTotalesForm();
  });
  $('#pLineas').addEventListener('click', e => { const q = e.target.closest('[data-ql]'); if (q) { borrador.lineas.splice(q.dataset.ql, 1); pintarLineas(); } });
  $('#pAgregar').onclick = () => {
    const sel = $('#pProducto'), x = (sel._filas || [])[sel.value]; if (!x) return toast('Elige un producto', true);
    const ya = borrador.lineas.find(l => l.nombre === x.nombre);
    if (ya) ya.q = Number(ya.q) + 1; else borrador.lineas.push({ nombre: x.nombre, precio: x.precio, q: 12 });
    sel.value = ''; pintarLineas();
  };
  $('#pLibre').onclick = () => { borrador.lineas.push({ nombre: '', precio: 0, q: 1 }); pintarLineas(); $$('#pLineas [data-k=nombre]').pop().focus(); };
  $('#pCliente').onchange = () => {
    const c = D.clientes.find(x => x.nombre.toLowerCase() === $('#pCliente').value.trim().toLowerCase()); if (!c) return;
    $('#pContacto').value = c.contacto || ''; $('#pTel').value = c.tel || ''; $('#pCorreo').value = c.correo || ''; $('#pDir').value = c.dir || '';
    if (c.terminos != null) $('#pTerminos').value = String(c.terminos); pintarTotalesForm();
  };
  $('#pCancelar').onclick = () => { editando = null; sub('pedidos'); };

  function leerFormulario() {
    const nombre = $('#pCliente').value.trim();
    if (!nombre) { toast('Escribe el nombre del comercio', true); return null; }
    const lineas = borrador.lineas.filter(l => String(l.nombre).trim() && Number(l.q) > 0);
    if (!lineas.length) { toast('Añade al menos un producto con cantidad', true); return null; }
    if (lineas.some(l => !(Number(l.precio) >= 0))) { toast('Revisa los precios', true); return null; }
    const correo = $('#pCorreo').value.trim();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { toast('Correo no válido', true); return null; }
    const terminos = Number($('#pTerminos').value), fecha = $('#pFecha').value || hoyISO(), entrega = $('#pEntrega').value || fecha;
    return {
      cliente: { nombre, contacto: $('#pContacto').value.trim(), tel: soloDigitosTel($('#pTel').value), correo: normalizar(correo), dir: $('#pDir').value.trim() },
      fecha, entrega, terminos, vence: sumarDias(entrega, terminos), exento: false, tasa: Number(D.factura.ivu),
      lineas: lineas.map(l => ({ nombre: String(l.nombre).trim(), q: Number(l.q), precio: r2(Number(l.precio)) })), notas: $('#pNotas').value.trim()
    };
  }
  function recordarCliente(c, extra) {
    let x = D.clientes.find(y => y.nombre.toLowerCase() === c.nombre.toLowerCase());
    if (!x) { x = { id: uid(), creado: ahora() }; D.clientes.push(x); }
    Object.assign(x, c, extra, { mod: ahora() }); delete x.inactivo;
    return x.id;
  }
  function guardarPedido(yaPago) {
    const f = leerFormulario(); if (!f) return;
    let p;
    if (editando) {
      p = D.pedidos.find(x => x.id === editando);
      Object.assign(p, f, { mod: ahora() });
      if (totales(p).total < totales(p).pagado - 0.004) toast('Ojo: lo pagado es mayor que el nuevo total', true);
    } else {
      D.seq.F += 1;
      p = Object.assign({ id: uid(), num: 'F-' + String(D.seq.F).padStart(4, '0'), creado: ahora(), mod: ahora(), por: yoNombre(), pagos: [], recordatorios: [] }, f);
      D.pedidos.push(p);
    }
    p.clienteId = recordarCliente(f.cliente, { terminos: f.terminos });
    editando = null; guardar(); sub('pedidos');
    toast('Pedido guardado · factura ' + p.num);
    verDocumento(p.id);
    if (yaPago) abrirPago(p.id);      // escoge método y se crea el recibo
  }
  $('#pGuardar').onclick = () => guardarPedido(false);
  $('#pGuardarPagado').onclick = () => guardarPedido(true);

  /* ---------- Documentos ---------- */
  let docActual = null;
  const emisorHTML = () => { const F = D.factura; return `<div class="emisor"><b>${esc(F.nombre)}</b><br>${esc(F.dir)}<br>${esc(F.tel)}${F.correo ? ' · ' + esc(F.correo) : ''}${F.registro ? '<br>Reg. Comerciante: ' + esc(F.registro) : ''}</div>`; };
  const clienteHTML = c => `<b>${esc(c.nombre)}</b>${c.contacto ? '<br>Atención: ' + esc(c.contacto) : ''}${c.dir ? '<br>' + esc(c.dir) : ''}${c.tel ? '<br>+' + esc(c.tel) : ''}${c.correo ? '<br>' + esc(c.correo) : ''}`;
  function facturaHTML(p) {
    const t = totales(p), e = estado(p), F = D.factura;
    return `<div class="doc">
      <div class="cab"><img src="assets/img/marca/logo-horizontal.webp" alt="La Cachanilla">${emisorHTML()}</div>
      <div class="sello ${e}">${EST_TXT[e].toUpperCase()}</div>
      <div class="tit"><h1>FACTURA</h1><div class="meta"><b>Número</b>${esc(p.num)}<br><b>Fecha</b>${fLarga(p.fecha)}<br><b>Entrega</b>${fLarga(p.entrega)}<br><b>Vence</b>${p.terminos ? fLarga(p.vence) : 'Al entregar (contado)'}</div></div>
      <div class="partes"><div><small>Facturar a</small>${clienteHTML(p.cliente)}</div>
        <div><small>Condiciones</small>${p.terminos ? `Pago a ${p.terminos} días` : 'Contado'}<br>${p.exento ? 'Exento de IVU (revendedor)' : 'IVU ' + p.tasa + '%'}<br><small style="margin-top:6px">Formas de pago</small>${esc(F.pago)}</div></div>
      <table><thead><tr><th>Descripción</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Importe</th></tr></thead>
        <tbody>${p.lineas.map(l => `<tr><td>${esc(l.nombre)}</td><td class="n">${l.q}</td><td class="n">${money(l.precio)}</td><td class="n">${money(l.q * l.precio)}</td></tr>`).join('')}</tbody></table>
      <div class="tots">
        <div class="r"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div class="r"><span>IVU ${p.exento ? '(exento)' : p.tasa + '%'}</span><span>${money(t.ivu)}</span></div>
        <div class="r big"><span>Total</span><span>${money(t.total)}</span></div>
        ${t.pagado > 0 ? `<div class="r"><span>Pagado</span><span>− ${money(t.pagado)}</span></div>` : ''}
        ${e !== 'anulada' ? `<div class="r ${t.saldo > 0.004 ? 'saldo' : ''}"><span>Saldo</span><span>${money(Math.max(0, t.saldo))}</span></div>` : ''}
      </div>
      ${p.notas ? `<p style="margin:14px 0 0"><b>Notas:</b> ${esc(p.notas)}</p>` : ''}
      ${(p.pagos || []).filter(x => !x.anulado).length ? `<p style="margin:10px 0 0;font-size:12px;color:#555"><b>Pagos recibidos:</b> ${(p.pagos || []).filter(x => !x.anulado).map(x => `${esc(x.num)} · ${fCorta(x.fecha)} · ${money(x.monto)} (${esc(x.metodo)})`).join(' — ')}</p>` : ''}
      <div class="pie">${esc(F.pie)}</div>
    </div>`;
  }
  function reciboHTML(p, pg) {
    const t = totales(p), F = D.factura;
    const saldoTrasPago = r2(t.total - (p.pagos || []).filter(x => !x.anulado && (x.fecha < pg.fecha || (x.fecha === pg.fecha && p.pagos.indexOf(x) <= p.pagos.indexOf(pg)))).reduce((s, x) => s + Number(x.monto), 0));
    return `<div class="doc">
      <div class="cab"><img src="assets/img/marca/logo-horizontal.webp" alt="La Cachanilla">${emisorHTML()}</div>
      <div class="sello ${pg.anulado ? 'anulada' : 'pagada'}">${pg.anulado ? 'ANULADO' : 'PAGADO'}</div>
      <div class="tit"><h1>RECIBO DE PAGO</h1><div class="meta"><b>Número</b>${esc(pg.num)}<br><b>Fecha</b>${fLarga(pg.fecha)}<br><b>Factura</b>${esc(p.num)}</div></div>
      <div class="recibi">Recibimos de <b>${esc(p.cliente.nombre)}</b>${p.cliente.contacto ? ' (' + esc(p.cliente.contacto) + ')' : ''} la cantidad de<br>
        <span class="monto-grande">${money(pg.monto)}</span><br>
        por concepto de pago ${saldoTrasPago <= 0.004 ? 'total' : 'parcial'} de la factura <b>${esc(p.num)}</b> del ${fLarga(p.fecha)}.</div>
      <table><tbody>
        <tr><td>Método de pago</td><td class="n"><b>${esc(pg.metodo)}</b>${pg.ref ? ' · ' + esc(pg.ref) : ''}</td></tr>
        <tr><td>Total de la factura</td><td class="n">${money(t.total)}</td></tr>
        <tr><td>Saldo después de este pago</td><td class="n"><b>${money(Math.max(0, saldoTrasPago))}</b></td></tr>
      </tbody></table>
      <div class="firma"><div>Recibido por ${esc(pg.por || F.nombre)}</div></div>
      <div class="pie">${esc(F.pie)}</div>
    </div>`;
  }
  function textoFactura(p) {
    const t = totales(p), F = D.factura;
    return [`🧾 ${F.nombre}`, `Factura ${p.num} · ${fLarga(p.fecha)}`, `Para: ${p.cliente.nombre}`, '',
      ...p.lineas.map(l => `${l.q} × ${l.nombre} — ${money(l.q * l.precio)}`), '',
      `Subtotal: ${money(t.subtotal)}`, `IVU: ${money(t.ivu)}${p.exento ? ' (exento)' : ''}`, `TOTAL: ${money(t.total)}`,
      t.pagado > 0 ? `Pagado: ${money(t.pagado)}` : '', t.saldo > 0.004 ? `Saldo pendiente: ${money(t.saldo)}` : '✅ PAGADA',
      t.saldo > 0.004 ? (p.terminos ? `Vence: ${fLarga(p.vence)}` : 'Pago al entregar') : '', t.saldo > 0.004 ? `Formas de pago: ${F.pago}` : '', '', F.pie]
      .filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  }
  function textoRecibo(p, pg) {
    const t = totales(p), F = D.factura;
    return [`✅ ${F.nombre} — Recibo ${pg.num}`, `Recibimos de ${p.cliente.nombre} ${money(pg.monto)} (${pg.metodo}${pg.ref ? ' · ' + pg.ref : ''}) el ${fLarga(pg.fecha)}.`,
      `Aplicado a la factura ${p.num} (total ${money(t.total)}).`, t.saldo > 0.004 ? `Saldo pendiente: ${money(t.saldo)}` : 'Factura pagada en su totalidad. ¡Gracias!', '', F.pie].join('\n');
  }

  function verDocumento(id, pagoId) {
    const p = D.pedidos.find(x => x.id === id); if (!p) return;
    const pagos = (p.pagos || []);
    docActual = { id, pagoId: pagoId || null };
    // Si pagó: se muestran recibo(s) y factura. Si no ha pagado: solo factura.
    $('#docTabs').innerHTML = `<button data-doc="" class="${!pagoId ? 'on' : ''}">Factura ${esc(p.num)}</button>` +
      pagos.map(x => `<button data-doc="${x.id}" class="${pagoId === x.id ? 'on' : ''}">Recibo ${esc(x.num)}${x.anulado ? ' (anulado)' : ''}</button>`).join('');
    const pg = pagos.find(x => x.id === pagoId);
    $('#docArea').innerHTML = pg ? reciboHTML(p, pg) : facturaHTML(p);
    const e = estado(p), t = totales(p), c = p.cliente;
    const texto = pg ? textoRecibo(p, pg) : textoFactura(p);
    const asunto = pg ? `Recibo ${pg.num} · ${D.factura.nombre}` : `Factura ${p.num} · ${D.factura.nombre}`;
    $('#docAcciones').innerHTML = `
      <button class="b b-pri" id="dImprimir">Imprimir / PDF</button>
      ${c.tel ? `<a class="b b-ok" target="_blank" rel="noopener" href="https://wa.me/${c.tel}?text=${encodeURIComponent(texto)}">WhatsApp</a>` : ''}
      ${c.correo ? `<a class="b b-sec" href="mailto:${c.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto + '\n\n(Se adjunta el documento en PDF.)')}">Correo</a>` : ''}
      <button class="b b-sec" id="dCopiar">Copiar texto</button>
      <span style="flex:1"></span>
      ${!pg && e !== 'anulada' && t.saldo > 0.004 ? '<button class="b b-ok" id="dPagar">Registrar pago</button>' : ''}
      ${!pg && e !== 'anulada' ? '<button class="b b-sec" id="dEditar">Editar</button><button class="b b-rojo" id="dAnular">Anular</button>' : ''}
      ${pg && !pg.anulado ? '<button class="b b-rojo" id="dAnularPago">Anular recibo</button>' : ''}`;
    $('#dImprimir').onclick = () => { const t0 = document.title; document.title = (pg ? pg.num : p.num) + ' ' + p.cliente.nombre; window.print(); document.title = t0; };
    $('#dCopiar').onclick = () => copiar(texto);
    const dp = $('#dPagar'); if (dp) dp.onclick = () => abrirPago(p.id);
    const de = $('#dEditar'); if (de) de.onclick = () => { cerrarDoc(); ir('comercios'); nuevoPedido(p); $$('.chips-b2b button').forEach(b => b.classList.toggle('on', b.dataset.sub === 'nuevo')); $$('.sub-b2b').forEach(x => x.classList.toggle('on', x.id === 'b-nuevo')); };
    const da = $('#dAnular'); if (da) da.onclick = () => {
      if (!confirm(`¿Anular la factura ${p.num}? Seguirá en el historial marcada como anulada.`)) return;
      p.anulada = true; p.mod = ahora(); guardar(); verDocumento(p.id);
    };
    const dap = $('#dAnularPago'); if (dap) dap.onclick = () => {
      if (!confirm(`¿Anular el recibo ${pg.num}? El saldo de la factura volverá a subir.`)) return;
      pg.anulado = true; p.mod = ahora(); guardar(); verDocumento(p.id, pg.id);
    };
    $('#ovDoc').classList.add('on');
  }
  const cerrarDoc = () => $('#ovDoc').classList.remove('on');
  $('#docTabs').addEventListener('click', e => { const b = e.target.closest('[data-doc]'); if (b && docActual) verDocumento(docActual.id, b.dataset.doc || null); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cerrardoc]') || e.target.id === 'ovDoc') cerrarDoc();
    if (e.target.id === 'ovPago') $('#ovPago').classList.remove('on');
  });

  /* ---------- Pagos ---------- */
  let pagoDe = null;
  function abrirPago(id) {
    const p = D.pedidos.find(x => x.id === id); if (!p) return;
    const t = totales(p);
    pagoDe = id;
    $('#pgTitulo').textContent = `Registrar pago · ${p.num}`;
    $('#pgSaldo').textContent = `${p.cliente.nombre} · Total ${money(t.total)} · Saldo ${money(t.saldo)}`;
    $('#pgMonto').value = t.saldo.toFixed(2); $('#pgMetodo').value = 'Efectivo'; $('#pgRef').value = ''; $('#pgFecha').value = hoyISO();
    $('#ovPago').classList.add('on'); setTimeout(() => $('#pgMonto').select(), 50);
  }
  $('#pgCancelar').onclick = () => $('#ovPago').classList.remove('on');
  $('#pgOk').onclick = () => {
    const p = D.pedidos.find(x => x.id === pagoDe); if (!p) return;
    const monto = r2(Number($('#pgMonto').value));
    if (!(monto > 0)) return toast('Escribe el monto', true);
    if (monto > totales(p).saldo + 0.004 && !confirm('El monto es mayor que el saldo. ¿Registrarlo de todos modos?')) return;
    D.seq.R += 1;
    const pg = { id: uid(), num: 'R-' + String(D.seq.R).padStart(4, '0'), fecha: $('#pgFecha').value || hoyISO(), monto, metodo: $('#pgMetodo').value, ref: $('#pgRef').value.trim(), por: yoNombre() };
    p.pagos = p.pagos || []; p.pagos.push(pg); p.mod = ahora();
    $('#ovPago').classList.remove('on'); guardar(); verDocumento(p.id, pg.id);
    toast('Pago registrado · recibo ' + pg.num);
  };

  /* ---------- Recordatorios ---------- */
  function textoRecordatorio(p) {
    const t = totales(p), c = cuandoVence(p), F = D.factura;
    const vencida = estado(p) === 'vencida';
    return [`Hola${p.cliente.contacto ? ' ' + p.cliente.contacto : ''} 👋, le saluda ${F.nombre}.`, '',
      vencida ? `Le recordamos que la factura ${p.num} (${fLarga(p.fecha)}) tiene un saldo pendiente de ${money(t.saldo)} que venció el ${fLarga(p.vence)}.`
              : `Le recordamos que la factura ${p.num} (${fLarga(p.fecha)}) por ${money(t.saldo)} ${c.cls === 'hoy' ? 'vence hoy' : 'vence el ' + fLarga(p.vence)}.`,
      `Formas de pago: ${F.pago}.`, '', 'Si ya realizó el pago, por favor ignore este mensaje y envíenos la confirmación. ¡Muchas gracias!'].join('\n');
  }
  function pintarRecordatorios() {
    const lista = porCobrar().sort((a, b) => (a.vence || '9999').localeCompare(b.vence || '9999'));
    const urgentes = lista.filter(p => { const d = p.vence ? diasEntre(hoyISO(), p.vence) : 99; return d <= 3; }).length;
    $('#badgeRec').innerHTML = urgentes ? `<span class="badge">${urgentes}</span>` : '';
    const tab = $('#badgeTab'); if (tab) tab.innerHTML = urgentes ? `<span class="badge">${urgentes}</span>` : '';
    $('#recLista').innerHTML = lista.length ? lista.map(p => {
      const t = totales(p), c = cuandoVence(p), ult = (p.recordatorios || []).slice(-1)[0], txt = textoRecordatorio(p);
      return `<div class="rec ${c.cls === 'vencida' ? 'vencida' : ''}">
        <div class="info"><b>${esc(p.cliente.nombre)} · ${esc(p.num)}</b>
          <span class="cuando ${c.cls}">${c.txt}</span> · saldo <b style="display:inline">${money(t.saldo)}</b>
          <br><small>${ult ? `Último recordatorio: ${new Date(ult.ts).toLocaleDateString('es-PR', { day: 'numeric', month: 'short' })} por ${esc(ult.via)}` : 'Sin recordatorios enviados'}</small></div>
        <div class="acc">
          ${p.cliente.tel ? `<a class="b b-ok" data-rec="${p.id}" data-via="WhatsApp" target="_blank" rel="noopener" href="https://wa.me/${p.cliente.tel}?text=${encodeURIComponent(txt)}">WhatsApp</a>` : ''}
          ${p.cliente.correo ? `<a class="b b-sec" data-rec="${p.id}" data-via="correo" href="mailto:${p.cliente.correo}?subject=${encodeURIComponent('Recordatorio de pago · ' + p.num)}&body=${encodeURIComponent(txt)}">Correo</a>` : ''}
          ${!p.cliente.tel && !p.cliente.correo ? '<small class="sub">Sin teléfono ni correo</small>' : ''}
          <button class="b b-sec" data-ver="${p.id}">Ver factura</button>
          <button class="b b-pri" data-cobrar="${p.id}">Registrar pago</button>
        </div></div>`;
    }).join('') : '<p class="vacio">🎉 No hay facturas por cobrar.</p>';
  }
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-rec]');
    if (r) { const p = D.pedidos.find(x => x.id === r.dataset.rec); if (p) { (p.recordatorios = p.recordatorios || []).push({ ts: ahora(), via: r.dataset.via, por: yoNombre() }); p.mod = ahora(); setTimeout(guardar, 300); } }
    const c = e.target.closest('[data-cobrar]'); if (c) abrirPago(c.dataset.cobrar);
  });

  /* ---------- Comercios ---------- */
  function pintarClientes() {
    const filas = D.clientes.filter(c => !c.inactivo).map(c => {
      const ps = D.pedidos.filter(p => !p.anulada && (p.clienteId === c.id || p.cliente.nombre.toLowerCase() === c.nombre.toLowerCase()));
      return { c, n: ps.length, comprado: ps.reduce((s, p) => s + totales(p).total, 0), debe: ps.reduce((s, p) => s + Math.max(0, totales(p).saldo), 0) };
    }).sort((a, b) => b.debe - a.debe || b.comprado - a.comprado);
    $('#cliLista').innerHTML = filas.length ? `<div class="tabla"><table><thead><tr><th>Comercio</th><th>Contacto</th><th class="n">Pedidos</th><th class="n">Comprado</th><th class="n">Debe</th><th></th></tr></thead><tbody>${
      filas.map(({ c, n, comprado, debe }) => `<tr><td><b>${esc(c.nombre)}</b><br><small style="color:var(--gris)">${esc(c.dir || '')}</small></td>
        <td>${esc(c.contacto || '')}<br><small>${c.tel ? '+' + esc(c.tel) : ''} ${esc(c.correo || '')}</small></td>
        <td class="n">${n}</td><td class="n">${money(comprado)}</td><td class="n" style="${debe > 0.004 ? 'color:var(--rojo);font-weight:800' : ''}">${money(debe)}</td>
        <td class="n"><button class="b b-sec" style="padding:6px 10px" data-pedirpara="${c.id}">Nuevo pedido</button> <button class="b b-rojo" style="padding:6px 10px" data-ocultar="${c.id}" title="Quitar de la lista">✕</button></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="vacio">Aún no hay comercios. Se añaden solos al crear el primer pedido.</p>';
  }
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-pedirpara]');
    if (n) { const c = D.clientes.find(x => x.id === n.dataset.pedirpara); editando = null; sub('nuevo'); $('#pCliente').value = c.nombre; $('#pCliente').onchange(); }
    const o = e.target.closest('[data-ocultar]');
    if (o) { const c = D.clientes.find(x => x.id === o.dataset.ocultar); if (c && confirm(`¿Quitar "${c.nombre}" de la lista? Sus facturas se conservan.`)) { c.inactivo = true; c.mod = ahora(); guardar(); } }
  });

  /* ---------- Configuración ---------- */
  function pintarConfig() {
    const F = D.factura;
    $('#fNombre').value = F.nombre; $('#fDir').value = F.dir; $('#fTel').value = F.tel; $('#fCorreo').value = F.correo;
    $('#fRegistro').value = F.registro; $('#fIvu').value = F.ivu; $('#fPago').value = F.pago; $('#fPie').value = F.pie;
    $('#sRepo').value = repoDatos() || 'Samueldj07/cachanilla-datos';
  }
  $('#fGuardar').onclick = () => {
    const ivu = Number($('#fIvu').value);
    if (!(ivu >= 0 && ivu < 30)) return toast('IVU no válido', true);
    D.factura = { nombre: $('#fNombre').value.trim() || BASE.factura.nombre, dir: $('#fDir').value.trim(), tel: $('#fTel').value.trim(), correo: $('#fCorreo').value.trim(),
      registro: $('#fRegistro').value.trim(), ivu, pago: $('#fPago').value.trim(), pie: $('#fPie').value.trim(), mod: ahora() };
    guardar(); toast('Datos de factura guardados');
  };
  $('#sConectar').onclick = async () => {
    const r = $('#sRepo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(r)) return toast('Escribe usuario/repositorio, ej. Samueldj07/cachanilla-datos', true);
    if (r.toLowerCase() === GH_REPO.toLowerCase()) return toast('Ese es el repositorio público del sitio. Usa uno privado aparte.', true);
    if (!ghConectado()) return toast('Primero conecta este equipo a GitHub en “Conexión y avisos”', true);
    try {
      const info = await ghPedir('/repos/' + r);
      if (!info.private) return toast('Ese repositorio es público. Márcalo como Private en GitHub para proteger los datos.', true);
      if (!info.permissions || !info.permissions.push) return toast('El token no puede escribir en ese repositorio. Añádelo al token.', true);
      store.set(REPO_KEY, r); toast('Conectado. Sincronizando…'); sincronizar();
    } catch (e) { toast(e.message, true); }
  };
  $('#sAhora').onclick = () => { if (!repoDatos()) return toast('Primero conecta el repositorio privado', true); sincronizar(); };
  $('#sQuitar').onclick = () => { store.del(REPO_KEY); pintarSync(); toast('Este equipo ya no comparte los pedidos'); };
  $('#bExp').onclick = () => descargar(`cachanilla-comercios-${hoyISO()}.json`, JSON.stringify(D, null, 1), 'application/json');
  $('#bImp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.pedidos)) throw 0;
      if (!confirm(`Combinar ${d.pedidos.length} pedidos del respaldo con los de este equipo?`)) return;
      D = Object.assign(D, combinar(D, d)); guardar(); toast('Respaldo combinado');
    } catch (x) { toast('Archivo no válido', true); }
    e.target.value = '';
  };

  /* ---------- Inicio ---------- */
  function pintarTodoB2B() { pintarSync(); pintarLista(); pintarRecordatorios(); pintarClientes(); }
  document.addEventListener('vista', e => { if (e.detail === 'comercios') { pintarTodoB2B(); sincronizar(); } });
  pintarTodoB2B();
  if (repoDatos()) sincronizar();
})();
