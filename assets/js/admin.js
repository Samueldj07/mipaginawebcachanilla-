/* La Cachanilla · Administración de cuentas */
const yo = sesionActual();
const PUB = window.CUENTAS;
const copia = o => JSON.parse(JSON.stringify(o));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hoyISO = () => new Date().toISOString().slice(0, 10);
const rolTxt = r => r === 'dueño' ? 'Administrador/a' : 'Cajero/a';
const telFmt = w => w ? '+' + w : '—';
const correoOk = c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

/* Normaliza al formato nuevo (listas de WhatsApp y correos) */
function normalizarCuentas(c) {
  const d = destinosSolicitud(c); const o = copia(c);
  delete o.whatsappDueno; delete o.correoDueno;
  o.whatsappDuenos = d.whatsapps; o.correosDuenos = d.correos;
  return o;
}

/* Borrador local: si lo publicado ya es igual, se descarta solo */
let cuentas = store.get('cuentas_borrador', null);
if (cuentas && igual(normalizarCuentas(cuentas), normalizarCuentas(PUB))) { store.del('cuentas_borrador'); store.del('cuentas_publicadas'); cuentas = null; }
cuentas = normalizarCuentas(cuentas || PUB);
const enviadas = () => store.get('cuentas_publicadas', null);
const pendiente = () => !igual(cuentas, normalizarCuentas(PUB)) && !igual(cuentas, enviadas());
const enCamino = () => !igual(cuentas, normalizarCuentas(PUB)) && igual(cuentas, enviadas());

function textoCuentasJS() {
  return `/* =====================================================================
   LA CACHANILLA · CUENTAS DEL ÁREA PRIVADA
   Actualizado desde Administración el ${new Date().toLocaleString('es-PR')}${yo ? ' por ' + yo.nombre : ''}.
   No editar a mano: usa admin.html. Las contraseñas NO se guardan, solo una huella (hash).
   rol "dueño" = Administrador/a · rol "cajero" = solo caja
   ===================================================================== */
window.CUENTAS = ${JSON.stringify(cuentas, null, 2)};
`;
}

/* Guarda en este equipo y publica si hay conexión con GitHub */
async function guardar(mensaje) {
  store.set('cuentas_borrador', cuentas);
  if (ghConectado()) {
    try {
      pintarEstado('publicando');
      await ghPublicar('assets/js/cuentas.js', textoCuentasJS(), mensaje || 'Actualizar cuentas');
      store.set('cuentas_publicadas', cuentas);
      toast('Publicado. Activo en 1 a 5 minutos');
    } catch (e) { toast('No se pudo publicar: ' + e.message, true); }
  }
  pintarTodo();
}
function publicarManual() {
  descargar('cuentas.js', textoCuentasJS(), 'text/javascript;charset=utf-8');
  toast('Súbelo a GitHub en assets/js/');
}

/* ---------- Estado de publicación ---------- */
function pintarEstado(fase) {
  const box = $('#estadoPub');
  if (fase === 'publicando') { box.innerHTML = '<div class="estado pend"><span>⏳</span><div><b>Publicando…</b></div></div>'; return; }
  if (pendiente()) {
    box.innerHTML = `<div class="estado pend"><span style="font-size:22px">⚠️</span><div><b>Hay cambios sin publicar</b>${ghConectado() ? 'Toca Publicar para activarlos.' : 'Este equipo no está conectado a GitHub. Conéctalo en “Conexión y avisos”, o descarga el archivo y súbelo a <code>assets/js/</code>.'}</div><span class="sp"></span>
      ${ghConectado() ? '<button class="b b-rosa" id="pubAhora">Publicar</button>' : '<button class="b b-rosa" id="pubBajar">Descargar cuentas.js</button>'}
      <button class="b b-rojo" id="pubDescartar">Descartar</button></div>`;
    const a = $('#pubAhora'); if (a) a.onclick = () => guardar('Publicar cambios de cuentas');
    const b = $('#pubBajar'); if (b) b.onclick = publicarManual;
    $('#pubDescartar').onclick = () => { if (!confirm('¿Descartar los cambios sin publicar?')) return; store.del('cuentas_borrador'); store.del('cuentas_publicadas'); cuentas = normalizarCuentas(PUB); pintarTodo(); };
  } else if (enCamino()) {
    box.innerHTML = '<div class="estado ok"><span style="font-size:22px">✅</span><div><b>Publicado</b>GitHub está actualizando el sitio. Los cambios quedan activos en 1 a 5 minutos.</div></div>';
  } else box.innerHTML = '';
}

/* ---------- Primeros pasos ---------- */
function pintarPasos() {
  const D = destinosSolicitud(cuentas);
  const adminsCorreo = cuentas.usuarios.filter(c => c.rol === 'dueño' && !c.inactiva && c.correo);
  const compartida = cuentas.usuarios.find(c => c.usuario === 'cachanilla');
  const pasos = [
    [ghConectado(), 'Conecta este equipo a GitHub (pestaña <b>Conexión y avisos</b>) para que aprobar active las cuentas al instante.'],
    [adminsCorreo.length >= 1, 'Crea tu cuenta de administrador con tu correo (pestaña <b>Invitar</b> → “Crear cuenta”, o envíate una invitación).'],
    [adminsCorreo.length >= 2, 'Invita al otro dueño como <b>Administrador/a</b> con su correo.'],
    [D.correos.length > 0, 'Revisa los correos y WhatsApp donde llegan las solicitudes.'],
    [!compartida || compartida.inactiva, 'Cuando los dueños ya entren con su correo, desactiva la cuenta compartida <code>cachanilla</code> en <b>Equipo</b>.'],
  ];
  $('#pasosIni').innerHTML = pasos.map(([ok, t]) => `<li class="${ok ? 'hecho' : ''}">${t}</li>`).join('');
  $('#primerosPasos').style.display = pasos.every(p => p[0]) ? 'none' : '';
}

/* ---------- Equipo ---------- */
const adminsActivos = () => cuentas.usuarios.filter(c => c.rol === 'dueño' && !c.inactiva).length;
function puedeQuitar(c) {
  if (yo && c.usuario === yo.u) { toast('No puedes quitarte el acceso a ti mismo', true); return false; }
  if (c.rol === 'dueño' && !c.inactiva && adminsActivos() <= 1) { toast('Debe quedar al menos un administrador activo', true); return false; }
  return true;
}
function pintarEquipo() {
  const pub = normalizarCuentas(PUB).usuarios;
  $('#cFilas').innerHTML = cuentas.usuarios.map((c, i) => {
    const p = pub.find(x => x.usuario === c.usuario);
    const nota = !p ? 'nueva · sin activar' : (!igual(p, c) ? 'cambio sin activar' : '');
    return `<tr style="${c.inactiva ? 'opacity:.5' : ''}">
      <td><b>${esc(c.nombre || '')}</b>${yo && c.usuario === yo.u ? ' <small>(tú)</small>' : ''}<br><small style="color:var(--gris)">${telFmt(esc(c.whatsapp))}</small></td>
      <td>${esc(c.usuario)}</td>
      <td><select data-rol="${i}" style="padding:6px;border-radius:8px;border:1.5px solid var(--linea)"><option value="cajero" ${c.rol !== 'dueño' ? 'selected' : ''}>Cajero/a</option><option value="dueño" ${c.rol === 'dueño' ? 'selected' : ''}>Administrador/a</option></select></td>
      <td>${c.inactiva ? 'Desactivada' : 'Activa'}${nota ? `<br><small style="color:var(--rosa)">${nota}</small>` : ''}</td>
      <td class="n" style="white-space:nowrap">
        <button class="b b-sec" style="padding:6px 10px" data-act="${i}">${c.inactiva ? 'Activar' : 'Desactivar'}</button>
        <button class="b b-rojo" style="padding:6px 10px" data-del="${i}" title="Eliminar">✕</button></td></tr>`;
  }).join('');
}
$('#cFilas').addEventListener('change', e => {
  const sel = e.target.closest('[data-rol]'); if (!sel) return;
  const c = cuentas.usuarios[sel.dataset.rol];
  if (sel.value === 'cajero' && !puedeQuitar(c)) { sel.value = 'dueño'; return; }
  c.rol = sel.value; guardar(`Cambiar acceso de ${c.usuario} a ${rolTxt(c.rol)}`);
});
$('#cFilas').addEventListener('click', e => {
  const a = e.target.closest('[data-act]'), d = e.target.closest('[data-del]');
  if (a) {
    const c = cuentas.usuarios[a.dataset.act];
    if (!c.inactiva && !puedeQuitar(c)) return;
    if (c.inactiva) delete c.inactiva; else c.inactiva = true;
    guardar(`${c.inactiva ? 'Desactivar' : 'Activar'} cuenta ${c.usuario}`);
  }
  if (d) {
    const c = cuentas.usuarios[d.dataset.del]; if (!puedeQuitar(c)) return;
    if (confirm('¿Eliminar la cuenta de ' + (c.nombre || c.usuario) + '?')) { cuentas.usuarios.splice(d.dataset.del, 1); guardar('Eliminar cuenta ' + c.usuario); }
  }
});

/* ---------- Aviso a la persona ---------- */
let avTexto = '';
function avisar(titulo, sub, persona, texto, asunto) {
  avTexto = texto;
  $('#avT').textContent = titulo; $('#avS').textContent = sub;
  const wa = $('#avWa'), ml = $('#avMail');
  wa.style.display = persona.w ? '' : 'none'; wa.href = 'https://wa.me/' + persona.w + '?text=' + encodeURIComponent(texto);
  ml.style.display = persona.c ? '' : 'none'; ml.href = 'mailto:' + persona.c + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(texto);
  $('#ovAviso').classList.add('on');
}
$('#avCerrar').onclick = () => $('#ovAviso').classList.remove('on');
$('#avCopiar').onclick = () => copiar(avTexto);
const subActivacion = () => ghConectado() ? 'Ya se publicó: queda activa en 1 a 5 minutos. Avísale:' : 'Falta publicarla (descarga cuentas.js y súbelo a GitHub). Luego avísale:';

/* ---------- Solicitudes ---------- */
function mostrarSolicitud(sol) {
  const box = $('#solCaja');
  $('#sinSol').style.display = sol ? 'none' : '';
  if (!sol) { box.style.display = 'none'; return; }
  const existe = cuentas.usuarios.find(c => normalizar(c.usuario) === normalizar(sol.c));
  const yaIgual = existe && existe.hash === sol.h;
  box.style.display = 'block';
  box.innerHTML = `<h3>📩 ${sol.inv ? 'Invitación aceptada' : 'Solicitud de cuenta'}</h3>
    <table><tr><td>Nombre</td><td><b>${esc(sol.n)}</b></td></tr>
    <tr><td>Correo</td><td>${esc(sol.c)}</td></tr><tr><td>WhatsApp</td><td>${telFmt(esc(sol.w))}</td></tr>
    <tr><td>Pidió</td><td>${rolTxt(sol.r)}</td></tr>
    ${sol.inv ? `<tr><td>Invitado por</td><td>${esc(sol.inv.por || 'un administrador')} ✓</td></tr>` : ''}
    ${sol.m ? `<tr><td>Mensaje</td><td>${esc(sol.m)}</td></tr>` : ''}
    <tr><td>Enviada</td><td>${new Date(sol.t).toLocaleString('es-PR')}</td></tr></table>
    ${yaIgual ? '<p class="estado ok" style="margin:12px 0 0">Esta solicitud ya fue aprobada.</p>' : existe ? '<p class="aviso" style="margin:12px 0 0">Ya existe una cuenta con este correo. Si apruebas, su contraseña cambia por la nueva.</p>' : ''}
    <div class="fila" style="margin-top:14px">
      <label class="campo" style="margin:0">Dar acceso como<select id="solRol"><option value="cajero" ${sol.r !== 'dueño' ? 'selected' : ''}>Cajero/a</option><option value="dueño" ${sol.r === 'dueño' ? 'selected' : ''}>Administrador/a</option></select></label>
      <span style="flex:1"></span>
      <button class="b b-rojo" id="solNo">Rechazar</button>
      <button class="b b-ok" id="solSi">${ghConectado() ? 'Aprobar y activar' : 'Aprobar'}</button>
    </div>`;
  $('#solSi').onclick = async () => {
    const rol = $('#solRol').value, c = normalizar(sol.c);
    const nueva = { usuario: c, nombre: sol.n, correo: c, whatsapp: sol.w, rol, alta: hoyISO(), hash: sol.h };
    const i = cuentas.usuarios.findIndex(x => normalizar(x.usuario) === c);
    if (i >= 0) { nueva.alta = cuentas.usuarios[i].alta || nueva.alta; cuentas.usuarios[i] = nueva; } else cuentas.usuarios.push(nueva);
    $('#solSi').disabled = true;
    await guardar(`Aprobar cuenta de ${sol.n} (${rolTxt(rol)})`);
    mostrarSolicitud(null); history.replaceState(null, '', 'admin.html');
    avisar('✅ Cuenta aprobada', subActivacion(), { w: sol.w, c },
      `¡Hola ${sol.n}! 🎉 Tu cuenta de La Cachanilla fue aprobada como ${rolTxt(rol)}.\n\nEntra aquí con tu correo (${c}) y la contraseña que creaste:\n${urlSitio()}acceso.html\n\nSi todavía no te deja entrar, espera unos minutos.`,
      'Tu cuenta de La Cachanilla fue aprobada');
  };
  $('#solNo').onclick = () => {
    mostrarSolicitud(null); history.replaceState(null, '', 'admin.html');
    avisar('Solicitud rechazada', 'No se creó ninguna cuenta. Si quieres, avísale:', { w: sol.w, c: sol.c },
      `Hola ${sol.n}. Por ahora no podemos aprobar tu solicitud de acceso a La Cachanilla. Si crees que es un error, escríbenos. ¡Gracias!`,
      'Tu solicitud de acceso a La Cachanilla');
  };
}
$('#cAbrir').onclick = () => { const s = decodificarSolicitud($('#cCodigo').value); if (!s) return toast('El enlace no es válido o está incompleto', true); mostrarSolicitud(s); };

/* ---------- Invitar ---------- */
$('#iCrear').onclick = () => {
  const n = $('#iN').value.trim(), c = normalizar($('#iC').value), w = soloDigitosTel($('#iW').value), r = $('#iR').value;
  if (!n) return toast('Escribe el nombre', true);
  if (!correoOk(c)) return toast('Correo no válido', true);
  if (cuentas.usuarios.some(x => normalizar(x.usuario) === c && !x.inactiva)) return toast('Ya existe una cuenta activa con ese correo', true);
  const inv = { inv: 1, n, c, w, r, por: yo ? yo.nombre : '', t: Date.now(), exp: Date.now() + 7 * 864e5 };
  const enlace = urlSitio() + 'registro.html#inv=' + codificarSolicitud(inv);
  avisar('✉️ Invitación lista', 'Envíasela. Cuando cree su contraseña, te llegará la confirmación para aprobarla.', { w, c },
    `¡Hola ${n}! Te invitamos a La Cachanilla como ${rolTxt(r)}.\n\nAbre este enlace y crea tu contraseña (vence en 7 días):\n${enlace}\n\nDespués envía la confirmación con los botones que aparecen.`,
    'Invitación a La Cachanilla');
  ['#iN', '#iC', '#iW'].forEach(x => $(x).value = '');
};
const generarClave = () => { const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'; return [...crypto.getRandomValues(new Uint32Array(12))].map(x => a[x % a.length]).join(''); };
$('#nGen').onclick = () => $('#nP').value = generarClave();
$('#nCrear').onclick = async () => {
  const n = $('#nN').value.trim(), c = normalizar($('#nC').value), w = soloDigitosTel($('#nW').value), r = $('#nR').value, p = $('#nP').value;
  if (!n) return toast('Escribe el nombre', true);
  if (!correoOk(c)) return toast('Correo no válido', true);
  if (cuentas.usuarios.some(x => normalizar(x.usuario) === c)) return toast('Ya existe una cuenta con ese correo', true);
  if (p.length < 10) return toast('La contraseña temporal debe tener al menos 10 caracteres', true);
  cuentas.usuarios.push({ usuario: c, nombre: n, correo: c, whatsapp: w, rol: r, alta: hoyISO(), hash: await hashCredencial(c, p) });
  await guardar(`Crear cuenta de ${n} (${rolTxt(r)})`);
  ['#nN', '#nC', '#nW', '#nP'].forEach(x => $(x).value = '');
  avisar('✅ Cuenta creada', subActivacion(), { w, c },
    `¡Hola ${n}! Te creamos una cuenta en La Cachanilla como ${rolTxt(r)}.\n\nEntra aquí: ${urlSitio()}acceso.html\nUsuario: ${c}\nContraseña temporal: ${p}\n\nCámbiala en “Mi cuenta” al entrar (si eres cajero/a, pídele a un administrador).`,
    'Tu cuenta de La Cachanilla');
};

/* ---------- Conexión y avisos ---------- */
function pintarAjustes() {
  $('#ghEstado').innerHTML = ghConectado()
    ? '<span class="pill" style="background:var(--ok-l);color:var(--verde)">● Este equipo está conectado</span>'
    : '<span class="pill" style="background:var(--rojo-l);color:var(--rojo)">● Este equipo no está conectado</span>';
  const D = destinosSolicitud(cuentas);
  $('#lWa').innerHTML = D.whatsapps.map((w, i) => `<span>+${esc(w)}<button data-qw="${i}" title="Quitar">×</button></span>`).join('') || '<small class="sub">Ninguno</small>';
  $('#lMail').innerHTML = D.correos.map((c, i) => `<span>${esc(c)}<button data-qm="${i}" title="Quitar">×</button></span>`).join('') || '<small class="sub">Ninguno</small>';
}
$('#ghConectar').onclick = async () => {
  const t = $('#ghTok').value.trim(); if (!t) return toast('Pega el token', true);
  $('#ghConectar').disabled = true;
  try { await ghProbar(t); ghGuardarToken(t); $('#ghTok').value = ''; toast('Conectado'); pintarTodo(); }
  catch (e) { toast(e.message, true); }
  $('#ghConectar').disabled = false;
};
$('#ghQuitar').onclick = () => { ghGuardarToken(''); toast('Este equipo ya no publica automáticamente'); pintarTodo(); };
$('#aWaAdd').onclick = () => {
  const w = soloDigitosTel($('#aWa').value); if (w.length < 11) return toast('Número incompleto', true);
  if (!cuentas.whatsappDuenos.includes(w)) cuentas.whatsappDuenos.push(w); $('#aWa').value = ''; guardar('Añadir WhatsApp de administradores');
};
$('#aMailAdd').onclick = () => {
  const c = normalizar($('#aMail').value); if (!correoOk(c)) return toast('Correo no válido', true);
  if (!cuentas.correosDuenos.includes(c)) cuentas.correosDuenos.push(c); $('#aMail').value = ''; guardar('Añadir correo de administradores');
};
document.addEventListener('click', e => {
  const qw = e.target.closest('[data-qw]'), qm = e.target.closest('[data-qm]');
  if (qw) { if (cuentas.whatsappDuenos.length <= 1) return toast('Deja al menos un WhatsApp', true); cuentas.whatsappDuenos.splice(qw.dataset.qw, 1); guardar('Quitar WhatsApp de administradores'); }
  if (qm) { cuentas.correosDuenos.splice(qm.dataset.qm, 1); guardar('Quitar correo de administradores'); }
  if (e.target.id === 'ovAviso') e.target.classList.remove('on');
});

/* ---------- Mi cuenta ---------- */
$('#sGen').onclick = async () => {
  const p1 = $('#sP1').value, p2 = $('#sP2').value;
  if (p1.length < 10) return toast('La contraseña debe tener al menos 10 caracteres', true);
  if (p1 !== p2) return toast('Las contraseñas no coinciden', true);
  const mia = cuentas.usuarios.find(c => c.usuario === yo.u); if (!mia) return toast('No encontré tu cuenta', true);
  mia.hash = await hashCredencial(mia.usuario, p1); $('#sP1').value = $('#sP2').value = '';
  await guardar('Cambiar contraseña de ' + mia.usuario);
  if (!ghConectado()) toast('Guardado. Descarga cuentas.js y súbelo a GitHub para activarla');
};

/* ---------- Navegación ---------- */
function pintarTodo() { pintarEstado(); pintarPasos(); pintarEquipo(); pintarAjustes(); $('#miCuenta').textContent = yo ? `${yo.nombre} · ${yo.u} · ${rolTxt(yo.rol)}` : ''; }
function ir(v) {
  $$('.tabs button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $$('.vista').forEach(x => x.classList.toggle('on', x.id === v));
  scrollTo(0, 0);
}
$$('.tabs button[data-v]').forEach(b => b.onclick = () => ir(b.dataset.v));
pintarTodo();
function abrirDesdeEnlace() {
  if (!location.hash.startsWith('#aprobar=')) return;
  const s = decodificarSolicitud(location.hash);
  ir('autorizar');
  if (s) mostrarSolicitud(s); else toast('El enlace de la solicitud está incompleto. Pídele que la envíe de nuevo.', true);
}
window.addEventListener('hashchange', abrirDesdeEnlace);
abrirDesdeEnlace();
