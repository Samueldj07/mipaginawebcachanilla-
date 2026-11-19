/* =====================================================================
   La Cachanilla · Acceso de dueños
   ---------------------------------------------------------------------
   ⚠️ IMPORTANTE: este sitio es estático (GitHub Pages). Este acceso
   esconde el panel a clientes y curiosos, pero NO es seguridad de
   banco: alguien con conocimientos técnicos puede leer el código.
   No guardes aquí datos sensibles (números de tarjeta, cuentas, etc.).
   Las ventas del POS se guardan solo en el equipo donde se hacen.

   Para cambiar usuario/contraseña: Panel → "Seguridad" genera la línea
   nueva para pegar aquí abajo.
   ===================================================================== */
const USUARIOS = [
  // usuario: cachanilla · contraseña temporal: Talavera#2026  (¡cámbiala!)
  { usuario: 'cachanilla', hash: '923b8ad1f573fb1aa1cf1b1464eacaa41b94738f6e89d7acdebb3d206d401d5a' },
];

const SESION_KEY = 'cach_sesion';
const SESION_HORAS = 12;

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const hashCredencial = (u, p) => sha256(u.trim().toLowerCase() + '::' + p);

async function iniciarSesion(usuario, clave) {
  const h = await hashCredencial(usuario, clave);
  const ok = USUARIOS.find(x => x.usuario === usuario.trim().toLowerCase() && x.hash === h);
  if (!ok) return false;
  const s = { u: ok.usuario, exp: Date.now() + SESION_HORAS * 36e5 };
  try { sessionStorage.setItem(SESION_KEY, JSON.stringify(s)); localStorage.setItem(SESION_KEY, JSON.stringify(s)); } catch (e) {}
  return true;
}
function sesionActual() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESION_KEY) || localStorage.getItem(SESION_KEY) || 'null');
    if (s && s.exp > Date.now() && USUARIOS.some(x => x.usuario === s.u)) return s;
  } catch (e) {}
  return null;
}
function cerrarSesion() {
  try { sessionStorage.removeItem(SESION_KEY); localStorage.removeItem(SESION_KEY); } catch (e) {}
  location.replace('acceso.html');
}
function requerirSesion() {
  if (!sesionActual()) location.replace('acceso.html?volver=' + encodeURIComponent(location.pathname.split('/').pop()));
}
