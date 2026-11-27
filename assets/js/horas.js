/* =====================================================================
   La Cachanilla · Registro de horas (ponchador)
   ---------------------------------------------------------------------
   Cada empleado entra con su cuenta y marca entrada y salida.
   Los registros se guardan en este equipo y, si el equipo está
   conectado (token de GitHub + repositorio privado de datos, el mismo
   de Comercios), se comparten en horas.json para que los dueños los
   vean desde cualquier equipo.
   ===================================================================== */
(() => {
  const S = sesionActual(); if (!S) return;
  const esDueno = S.rol === 'dueño';
  const KEY = 'horas', ARCHIVO = 'horas.json', TARIFA_BASE = 20;
  const ahora = () => Date.now();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let D = Object.assign({ registros: [], tarifas: {} }, store.get(KEY, {}));

  $$('.solo-duenos').forEach(x => x.hidden = !esDueno);
  $$('.solo-caja').forEach(x => x.hidden = !['dueño', 'cajero'].includes(S.rol));

  /* ---------- utilidades ---------- */
  const vivos = () => D.registros.filter(r => !r.borrado);
  const horasDe = r => r.salida ? Math.max(0, (r.salida - r.entrada) / 36e5) : 0;
  const h2 = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
  const dec = h => (Math.round(h * 100) / 100).toFixed(2);
  const diaTxt = ts => new Date(ts).toLocaleDateString('es-PR', { weekday: 'short', day: 'numeric', month: 'short' });
  const aLocal = ts => { if (!ts) return ''; const d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const deLocal = v => v ? new Date(v).getTime() : null;
  const abiertoDe = u => vivos().filter(r => r.u === u && !r.salida).sort((a, b) => b.entrada - a.entrada)[0];
  const OLVIDO_H = 16;   // un turno abierto por más de 16 h se considera olvidado
  const tarifa = u => Number(D.tarifas[u] ?? TARIFA_BASE);
  const empleados = () => {
    const m = new Map(cuentasActivas().map(c => [c.usuario, c.nombre || c.usuario]));
    vivos().forEach(r => { if (!m.has(r.u)) m.set(r.u, r.nombre || r.u); });
    return [...m.entries()].map(([u, nombre]) => ({ u, nombre }));
  };

  let semana = 0;
  const inicioSemana = off => { const d = new Date(); d.setHours(0, 0, 0, 0); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow + off * 7); return d.getTime(); };
  const rangoSemana = () => { const a = inicioSemana(semana); return [a, a + 7 * 864e5]; };
  const txtSemana = () => { const [a, b] = rangoSemana(); return `${new Date(a).toLocaleDateString('es-PR', { day: 'numeric', month: 'short' })} – ${new Date(b - 1).toLocaleDateString('es-PR', { day: 'numeric', month: 'short', year: 'numeric' })}`; };

  /* Cálculo de una persona en la semana: regular + extra (8 h/día, 40 h/semana) */
  function calcular(u) {
    const [a, b] = rangoSemana();
    const regs = vivos().filter(r => r.u === u && r.entrada >= a && r.entrada < b).sort((x, y) => x.entrada - y.entrada);
    const porDia = {};
    regs.forEach(r => { const k = diaKey(r.entrada); porDia[k] = (porDia[k] || 0) + horasDe(r); });
    const total = Object.values(porDia).reduce((s, h) => s + h, 0);
    const extraDia = Object.values(porDia).reduce((s, h) => s + Math.max(0, h - 8), 0);
    const regularTope = total - extraDia;
    const extra = extraDia + Math.max(0, regularTope - 40);
    const t = tarifa(u), pago = (total - extra) * t + extra * t * 1.5;
    return { regs, total, extra, regular: total - extra, tarifa: t, pago: r2(pago), abiertos: regs.filter(r => !r.salida).length };
  }

  /* ---------- guardar y sincronizar ---------- */
  const repoDatos = () => store.get('b2b_repo', '');
  const b64dec = s => decodeURIComponent(escape(atob(String(s).replace(/\n/g, ''))));
  function combinar(a, b) {
    const m = new Map(); [...(a.registros || []), ...(b.registros || [])].forEach(o => { const v = m.get(o.id); if (!v || (o.mod || 0) >= (v.mod || 0)) m.set(o.id, o); });
    const tm = Object.assign({}, b.tarifasMod || {}, a.tarifasMod || {}), tarifas = Object.assign({}, b.tarifas || {});
    Object.keys(a.tarifas || {}).forEach(u => { if ((a.tarifasMod?.[u] || 0) >= (b.tarifasMod?.[u] || 0)) { tarifas[u] = a.tarifas[u]; tm[u] = a.tarifasMod?.[u] || 0; } });
    return { registros: [...m.values()].sort((x, y) => x.entrada - y.entrada), tarifas, tarifasMod: tm };
  }
  let sincronizando = false, pendiente = false, error = '', ultima = store.get('horas_sync', 0);
  async function sincronizar() {
    if (!repoDatos() || !ghConectado()) { pintarSync(); return; }
    if (sincronizando) { pendiente = true; return; }
    sincronizando = true; error = ''; pintarSync();
    try {
      for (let i = 0; i < 2; i++) {
        const r = await ghPedir(`/repos/${repoDatos()}/contents/${ARCHIVO}`).catch(e => { if (e.status === 404) return null; throw e; });
        const remoto = r ? JSON.parse(b64dec(r.content)) : null;
        const unido = remoto ? combinar(D, remoto) : D;
        D = Object.assign(D, unido); store.set(KEY, D);
        if (remoto && JSON.stringify(unido) === JSON.stringify(combinar(remoto, {}))) break;
        try {
          await ghPedir(`/repos/${repoDatos()}/contents/${ARCHIVO}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Horas · ' + S.nombre, content: b64utf8(JSON.stringify(D, null, 1)), sha: r ? r.sha : undefined }) });
          break;
        } catch (e) { if (e.status !== 409 || i) throw e; }
      }
      ultima = ahora(); store.set('horas_sync', ultima);
    } catch (e) { error = e.message; }
    sincronizando = false; pintarTodo();
    if (pendiente) { pendiente = false; sincronizar(); }
  }
  function guardar() { store.set(KEY, D); pintarTodo(); sincronizar(); }
  function pintarSync() {
    const el = $('#sync');
    if (!repoDatos() || !ghConectado()) {
      el.innerHTML = `<span style="color:var(--rojo);font-weight:700">⚠ Este equipo no está conectado:</span> las horas se guardan solo aquí. ` +
        (esDueno ? 'Conéctalo en Administración → Conexión y avisos y en Comercios → repositorio privado.' : 'Usa el equipo del negocio para ponchar o pide a un dueño que conecte este.');
    } else el.textContent = sincronizando ? 'Sincronizando…' : error ? 'No se pudo sincronizar: ' + error + ' (las horas siguen guardadas en este equipo)' :
      '✓ Conectado · última sincronización ' + (ultima ? hora(ultima) : '—');
  }

  /* ---------- Ponchar ---------- */
  function tic() {
    const d = new Date();
    $('#hora').textContent = d.toLocaleTimeString('es-PR', { hour: 'numeric', minute: '2-digit' });
    $('#fecha').textContent = d.toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function pintarPonchar() {
    $('#quien').textContent = S.nombre;
    const ab = abiertoDe(S.u), olvidado = ab && ahora() - ab.entrada > OLVIDO_H * 36e5;
    const dentro = ab && !olvidado;
    $('#estado').className = 'estado ' + (dentro ? 'dentro' : 'fuera');
    $('#estado').textContent = dentro ? `Trabajando desde las ${hora(ab.entrada)} · ${h2((ahora() - ab.entrada) / 36e5)}`
      : olvidado ? `Turno del ${diaTxt(ab.entrada)} sin salida: avisa a un dueño` : 'Fuera de turno';
    const b = $('#btnPonchar');
    b.className = 'ponchar ' + (dentro ? 'salir' : 'entrar');
    b.textContent = dentro ? 'Registrar SALIDA' : 'Registrar ENTRADA';
    const hoy = vivos().filter(r => r.u === S.u && diaKey(r.entrada) === hoyKey());
    $('#hoyTabla').innerHTML = hoy.length ? tablaRegs(hoy, false) : '<p class="vacio">Aún no hay registros hoy.</p>';
  }
  $('#btnPonchar').onclick = () => {
    const nota = $('#notaPonche').value.trim();
    const ab = abiertoDe(S.u), olvidado = ab && ahora() - ab.entrada > OLVIDO_H * 36e5;
    if (ab && !olvidado) {
      Object.assign(ab, { salida: ahora(), mod: ahora(), notaSalida: nota || undefined });
      toast(`Salida registrada · ${h2(horasDe(ab))} trabajadas`);
    } else {
      D.registros.push({ id: uid(), u: S.u, nombre: S.nombre, entrada: ahora(), salida: null, nota: nota || undefined, mod: ahora(), por: S.u });
      toast('Entrada registrada a las ' + hora(ahora()));
    }
    $('#notaPonche').value = ''; guardar();
  };

  function tablaRegs(regs, editable) {
    return `<table class="marcas"><thead><tr><th>Día</th><th>Entrada</th><th>Salida</th><th class="num">Horas</th><th>Nota</th>${editable ? '<th></th>' : ''}</tr></thead><tbody>` +
      regs.map(r => `<tr class="${r.salida ? '' : 'abierto'}" data-id="${r.id}">
        <td>${esc(diaTxt(r.entrada))}</td>
        <td>${editable ? `<input type="datetime-local" data-c="entrada" value="${aLocal(r.entrada)}">` : hora(r.entrada)}</td>
        <td>${editable ? `<input type="datetime-local" data-c="salida" value="${aLocal(r.salida)}">` : (r.salida ? hora(r.salida) : '<b>abierto</b>')}</td>
        <td class="num">${r.salida ? dec(horasDe(r)) : '—'}</td>
        <td style="white-space:normal;font-size:12px">${esc([r.nota, r.notaSalida].filter(Boolean).join(' · '))}${r.editado ? `<br><i style="color:var(--gris)">Corregido por ${esc(r.editado)}</i>` : ''}</td>
        ${editable ? `<td><button class="b b-sec mini" data-g="${r.id}">Guardar</button> <button class="b b-rojo mini" data-x="${r.id}">Borrar</button></td>` : ''}
      </tr>`).join('') + '</tbody></table>';
  }

  /* ---------- Mis horas ---------- */
  function pintarMias() {
    const c = calcular(S.u);
    $('#misHoras').innerHTML = `<div class="kpis" style="margin-bottom:14px">
        <div class="kpi"><span>Horas de la semana</span><b>${dec(c.total)}</b></div>
        <div class="kpi"><span>Horas extra</span><b>${dec(c.extra)}</b></div>
        ${esDueno ? `<div class="kpi"><span>Estimado a $${c.tarifa}/h</span><b>${money(c.pago)}</b></div>` : ''}
      </div>
      <div class="caja"><div class="tabla">${c.regs.length ? tablaRegs(c.regs, false) : '<p class="vacio">Sin registros esta semana.</p>'}</div></div>`;
  }

  /* ---------- Equipo (dueños) ---------- */
  function pintarEquipo() {
    if (!esDueno) return;
    const emps = empleados();
    $('#mEmp').innerHTML = emps.map(e => `<option value="${esc(e.u)}">${esc(e.nombre)}</option>`).join('');
    const con = emps.map(e => ({ e, c: calcular(e.u) }));
    const tot = con.reduce((s, x) => ({ h: s.h + x.c.total, p: s.p + x.c.pago }), { h: 0, p: 0 });
    $('#eqLista').innerHTML = `<div class="kpis" style="margin-bottom:16px">
        <div class="kpi"><span>Horas del equipo</span><b>${dec(tot.h)}</b></div>
        <div class="kpi"><span>Nómina estimada (bruta)</span><b>${money(tot.p)}</b></div>
      </div>` + con.map(({ e, c }) => `
      <div class="caja emp">
        <h3>${esc(e.nombre)} <small>@${esc(e.u)}</small>
          <small>Tarifa $<input type="number" min="0" step="0.25" value="${c.tarifa}" data-tarifa="${esc(e.u)}" style="width:80px;padding:4px 6px;border:1.5px solid var(--linea);border-radius:8px">/h</small></h3>
        <div class="tabla">${c.regs.length ? tablaRegs(c.regs, true) : '<p class="sub" style="margin:0">Sin registros esta semana.</p>'}</div>
        <div class="totales-emp">
          <span>Total: <b>${dec(c.total)} h</b></span><span>Regulares: <b>${dec(c.regular)} h</b></span><span>Extra (×1.5): <b>${dec(c.extra)} h</b></span>
          <span>Pago bruto: <b>${money(c.pago)}</b></span>${c.abiertos ? `<span style="color:var(--rojo);font-weight:700">⚠ ${c.abiertos} turno(s) sin salida</span>` : ''}
        </div>
      </div>`).join('');
  }
  $('#eqLista').addEventListener('change', e => {
    const t = e.target.closest('[data-tarifa]'); if (!t) return;
    const u = t.dataset.tarifa, v = Number(t.value); if (!(v >= 0)) return toast('Tarifa no válida', true);
    D.tarifas[u] = v; D.tarifasMod = Object.assign(D.tarifasMod || {}, { [u]: ahora() }); guardar(); toast('Tarifa guardada');
  });
  $('#eqLista').addEventListener('click', e => {
    const g = e.target.closest('[data-g]'), x = e.target.closest('[data-x]');
    if (g) {
      const r = D.registros.find(z => z.id === g.dataset.g), tr = g.closest('tr');
      const ent = deLocal($('[data-c=entrada]', tr).value), sal = deLocal($('[data-c=salida]', tr).value);
      if (!ent) return toast('Falta la hora de entrada', true);
      if (sal && sal <= ent) return toast('La salida debe ser después de la entrada', true);
      Object.assign(r, { entrada: ent, salida: sal, mod: ahora(), editado: S.nombre }); guardar(); toast('Corregido');
    }
    if (x) {
      if (!confirm('¿Borrar este turno?')) return;
      const r = D.registros.find(z => z.id === x.dataset.x); Object.assign(r, { borrado: true, mod: ahora(), editado: S.nombre }); guardar(); toast('Turno borrado');
    }
  });
  $('#mAdd').onclick = () => {
    const u = $('#mEmp').value, ent = deLocal($('#mEnt').value), sal = deLocal($('#mSal').value);
    if (!u || !ent || !sal) return toast('Elige empleado, entrada y salida', true);
    if (sal <= ent) return toast('La salida debe ser después de la entrada', true);
    const emp = empleados().find(z => z.u === u);
    D.registros.push({ id: uid(), u, nombre: emp ? emp.nombre : u, entrada: ent, salida: sal, nota: $('#mNota').value.trim() || 'Añadido a mano', mod: ahora(), por: S.u, editado: S.nombre });
    $('#mEnt').value = $('#mSal').value = $('#mNota').value = ''; guardar(); toast('Turno añadido');
  };
  function resumen() {
    const lineas = empleados().map(e => ({ e, c: calcular(e.u) })).filter(x => x.c.regs.length);
    const tot = lineas.reduce((s, x) => s + x.c.pago, 0);
    return [`La Cachanilla · Horas trabajadas`, `Semana ${txtSemana()}`, '',
      ...lineas.map(({ e, c }) => `• ${e.nombre}: ${dec(c.total)} h (${dec(c.extra)} extra) × $${c.tarifa}/h = ${money(c.pago)}${c.abiertos ? ' ⚠ turno sin salida' : ''}`),
      '', `Nómina bruta estimada: ${money(tot)}`].join('\n');
  }
  $('#eqCopiar').onclick = () => copiar(resumen());
  $('#eqWa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(resumen()), '_blank', 'noopener');
  $('#eqCsv').onclick = () => {
    const [a] = rangoSemana(), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = [['Empleado', 'Usuario', 'Día', 'Entrada', 'Salida', 'Horas', 'Nota', 'Corregido por']];
    empleados().forEach(e => calcular(e.u).regs.forEach(r => filas.push([e.nombre, e.u, fecha(r.entrada), hora(r.entrada), r.salida ? hora(r.salida) : '', r.salida ? dec(horasDe(r)) : '', [r.nota, r.notaSalida].filter(Boolean).join(' · '), r.editado || ''])));
    filas.push([]); filas.push(['Empleado', 'Horas', 'Extra', 'Tarifa', 'Pago bruto']);
    empleados().forEach(e => { const c = calcular(e.u); if (c.regs.length) filas.push([e.nombre, dec(c.total), dec(c.extra), c.tarifa, c.pago.toFixed(2)]); });
    descargar(`horas-${diaKey(a)}.csv`, '﻿' + filas.map(f => f.map(q).join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  /* ---------- navegación ---------- */
  $$('[data-sem]').forEach(b => b.onclick = () => { semana += Number(b.dataset.sem); pintarTodo(); });
  function pintarTodo() {
    $$('[data-sem-txt]').forEach(x => x.textContent = txtSemana() + (semana === 0 ? ' (esta semana)' : ''));
    pintarSync(); pintarPonchar(); pintarMias(); pintarEquipo();
  }
  function ir(v) {
    $$('.tabs button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $$('.vista').forEach(x => x.classList.toggle('on', x.id === v));
    pintarTodo(); if (v === 'equipo') sincronizar();
  }
  $$('.tabs button[data-v]').forEach(b => b.onclick = () => ir(b.dataset.v));
  tic(); setInterval(() => { tic(); if (abiertoDe(S.u)) pintarPonchar(); }, 30000);
  pintarTodo(); sincronizar();
})();
