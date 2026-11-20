/* =====================================================================
   La Cachanilla · Publicación automática en GitHub
   ---------------------------------------------------------------------
   Permite que un administrador publique cambios (cuentas, catálogo)
   con un toque, sin subir archivos a mano.

   Usa un "token" de GitHub con permiso SOLO sobre este repositorio.
   El token se guarda únicamente en el navegador del administrador que
   lo pegó (nunca en el sitio público). Si se pierde el celular,
   se borra el token en github.com → Settings → Developer settings.
   ===================================================================== */
const GH_REPO = 'Samueldj07/mipaginawebcachanilla-';
const GH_RAMA = 'main';
const GH_KEY = 'cach_gh_token';

const ghToken = () => { try { return localStorage.getItem(GH_KEY) || ''; } catch (e) { return ''; } };
const ghConectado = () => !!ghToken();
function ghGuardarToken(t) { try { t ? localStorage.setItem(GH_KEY, t.trim()) : localStorage.removeItem(GH_KEY); } catch (e) {} }

async function ghPedir(ruta, opciones = {}, token = ghToken()) {
  const r = await fetch('https://api.github.com' + ruta, Object.assign({}, opciones, {
    headers: Object.assign({ 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' }, opciones.headers || {})
  }));
  if (!r.ok) {
    let msg = 'GitHub respondió ' + r.status;
    if (r.status === 401) msg = 'El token no es válido o expiró.';
    if (r.status === 403 || r.status === 404) msg = 'El token no tiene permiso de escritura sobre el repositorio.';
    if (r.status === 409) msg = 'Otro cambio se publicó al mismo tiempo. Intenta de nuevo.';
    const e = new Error(msg); e.status = r.status; throw e;
  }
  return r.status === 204 ? null : r.json();
}

/* Verifica que el token puede escribir en el repositorio */
async function ghProbar(token) {
  const repo = await ghPedir('/repos/' + GH_REPO, {}, token);
  if (!repo.permissions || !repo.permissions.push) throw new Error('El token puede ver el repositorio pero no escribir. Dale permiso "Contents: Read and write".');
  return repo;
}

const b64utf8 = s => btoa(unescape(encodeURIComponent(s)));

/* Crea o reemplaza un archivo del sitio y lo publica en la rama principal */
async function ghPublicar(ruta, contenido, mensaje) {
  let sha;
  try { sha = (await ghPedir(`/repos/${GH_REPO}/contents/${ruta}?ref=${GH_RAMA}`)).sha; }
  catch (e) { if (e.status !== 404) throw e; }
  return ghPedir(`/repos/${GH_REPO}/contents/${ruta}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje, content: b64utf8(contenido), branch: GH_RAMA, sha })
  });
}
