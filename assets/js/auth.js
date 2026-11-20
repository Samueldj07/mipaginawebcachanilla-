/* =====================================================================
   La Cachanilla · Acceso al área privada
   ---------------------------------------------------------------------
   ⚠️ IMPORTANTE: este sitio es estático (GitHub Pages). Este acceso
   esconde el panel a clientes y curiosos, pero NO es seguridad de
   banco: alguien con conocimientos técnicos puede leer el código.
   No guardes aquí datos sensibles (números de tarjeta, cuentas, etc.).

   Las cuentas viven en assets/js/cuentas.js (se manejan desde
   Panel → Cuentas). Este archivo debe cargarse DESPUÉS de cuentas.js.
   ===================================================================== */
const SESION_KEY = 'cach_sesion';
const SESION_HORAS = 12;
const cuentasActivas = () => ((window.CUENTAS && window.CUENTAS.usuarios) || []).filter(c => !c.inactiva);

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const normalizar = u => String(u || '').trim().toLowerCase();
const hashCredencial = (u, p) => sha256(normalizar(u) + '::' + p);

function buscarCuenta(id) {
  const x = normalizar(id);
  return cuentasActivas().find(c => normalizar(c.usuario) === x || (c.correo && normalizar(c.correo) === x));
}
async function iniciarSesion(id, clave) {
  const c = buscarCuenta(id);
  if (!c) return false;
  if ((await hashCredencial(c.usuario, clave)) !== c.hash) return false;
  const s = { u: c.usuario, nombre: c.nombre || c.usuario, rol: c.rol || 'cajero', exp: Date.now() + SESION_HORAS * 36e5 };
  try { sessionStorage.setItem(SESION_KEY, JSON.stringify(s)); localStorage.setItem(SESION_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function sesionActual() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESION_KEY) || localStorage.getItem(SESION_KEY) || 'null');
    if (!s || s.exp < Date.now()) return null;
    const c = cuentasActivas().find(x => x.usuario === s.u);
    if (!c) return null;                       // cuenta borrada o desactivada
    s.rol = c.rol || 'cajero'; s.nombre = c.nombre || c.usuario;
    return s;
  } catch (e) { return null; }
}
function cerrarSesion() {
  try { sessionStorage.removeItem(SESION_KEY); localStorage.removeItem(SESION_KEY); } catch (e) {}
  location.replace('acceso.html');
}
/* ---------- Tipos de cuenta ---------- */
const ROLES = {
  'dueño':  { txt: 'Dueño/a',                   desc: 'panel, caja, menú y cuentas', inicio: 'panel.html' },
  'admin':  { txt: 'Administrador/a de cuentas', desc: 'solo cuentas y correos',      inicio: 'admin.html' },
  'cajero': { txt: 'Cajero/a',                  desc: 'solo la caja',                inicio: 'pos.html' }
};
const rolTxt = r => (ROLES[r] || ROLES.cajero).txt;
const inicioDe = r => (ROLES[r] || ROLES.cajero).inicio;
const puedeAutorizar = r => r === 'dueño' || r === 'admin';
const opcionesRol = sel => Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v.txt} — ${v.desc}</option>`).join('');

/* permitidos: un rol o lista de roles; sin nada basta cualquier cuenta */
function requerirSesion(permitidos, paginaAcceso) {
  const s = sesionActual();
  if (!s) { location.replace((paginaAcceso || 'acceso.html') + '?volver=' + encodeURIComponent(location.pathname.split('/').pop() + location.hash)); return; }
  const lista = permitidos ? [].concat(permitidos) : null;
  if (lista && !lista.includes(s.rol)) location.replace(inicioDe(s.rol));
}

/* ---------- Solicitudes de cuenta (código que viaja por WhatsApp/correo) ---------- */
function codificarSolicitud(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodificarCodigo(code) {
  try {
    const b = String(code).trim().replace(/^.*#(aprobar|inv)=/, '').replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))));
  } catch (e) { return null; }
}
function decodificarSolicitud(code) {
  const o = decodificarCodigo(code);
  return o && o.c && o.n && /^[0-9a-f]{64}$/.test(o.h || '') ? o : null;
}
function decodificarInvitacion(code) {
  const o = decodificarCodigo(code);
  return o && o.c && o.n && o.inv ? o : null;
}
const urlSitio = () => location.href.replace(/[^/]*([?#].*)?$/, '');
const soloDigitosTel = t => { let n = String(t || '').replace(/\D/g, ''); if (n.length === 10) n = '1' + n; return n; };
/* Destinos donde llegan las solicitudes (admite el formato anterior de un solo número/correo) */
function destinosSolicitud(C = window.CUENTAS || {}) {
  const lista = (a, b) => [...new Set([].concat(a || [], b ? [b] : []).map(x => String(x).trim()).filter(Boolean))];
  return { whatsapps: lista(C.whatsappDuenos, C.whatsappDueno).map(soloDigitosTel), correos: lista(C.correosDuenos, C.correoDueno).map(normalizar) };
}
