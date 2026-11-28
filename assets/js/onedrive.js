/* =====================================================================
   La Cachanilla · Conexión con OneDrive (almacenamiento de Outlook)
   ---------------------------------------------------------------------
   Inicio de sesión de Microsoft (OAuth 2.0 con PKCE, sin servidor) y
   subida de archivos a OneDrive con Microsoft Graph.
   · Necesita un "Application (client) ID" registrado una sola vez en
     entra.microsoft.com (ver Contabilidad → Documentos).
   · Los permisos se guardan solo en este equipo. Microsoft pide volver
     a entrar cerca de cada 24 horas (regla para páginas web).
   · Si no hay conexión, los archivos quedan en cola y se suben luego.
   ===================================================================== */
const OD = (() => {
  const CLIENT_ID_PUBLICADO = '';          // se llena al registrar la app (no es secreto)
  const AUTH = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
  const SCOPES = 'Files.ReadWrite User.Read offline_access';
  const CARPETA = 'La Cachanilla/Contabilidad';
  const k = n => 'cach_od_' + n;
  const lee = (n, d) => { try { const v = localStorage.getItem(k(n)); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const pon = (n, v) => { try { v == null ? localStorage.removeItem(k(n)) : localStorage.setItem(k(n), JSON.stringify(v)); } catch (e) {} };
  const clientId = () => lee('client', '') || CLIENT_ID_PUBLICADO;
  const redirect = () => location.origin + location.pathname.replace(/[^/]*$/, '') + 'contabilidad.html';

  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const azar = n => b64url(crypto.getRandomValues(new Uint8Array(n)));

  async function entrar(volverA) {
    if (!clientId()) throw new Error('Falta el Client ID de Microsoft');
    const verifier = azar(48), state = azar(16);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    sessionStorage.setItem('cach_od_pkce', JSON.stringify({ verifier, state, volver: volverA || location.href }));
    location.href = `${AUTH}/authorize?` + new URLSearchParams({ client_id: clientId(), response_type: 'code', redirect_uri: redirect(),
      response_mode: 'query', scope: SCOPES, state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' });
  }
  async function token(params) {
    const r = await fetch(`${AUTH}/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(Object.assign({ client_id: clientId(), scope: SCOPES, redirect_uri: redirect() }, params)) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description ? j.error_description.split('\r\n')[0] : 'Microsoft respondió ' + r.status);
    pon('tok', { acceso: j.access_token, refresco: j.refresh_token || (lee('tok', {}) || {}).refresco, vence: Date.now() + (j.expires_in - 120) * 1000 });
    return j.access_token;
  }
  /* Se llama al cargar contabilidad.html: termina el inicio de sesión */
  async function completarEntrada() {
    const q = new URLSearchParams(location.search);
    if (!q.get('code') && !q.get('error')) return null;
    const p = JSON.parse(sessionStorage.getItem('cach_od_pkce') || 'null'); sessionStorage.removeItem('cach_od_pkce');
    history.replaceState(null, '', location.pathname);
    if (q.get('error')) throw new Error(q.get('error_description') || q.get('error'));
    if (!p || p.state !== q.get('state')) throw new Error('La respuesta de Microsoft no coincide. Intenta de nuevo.');
    await token({ grant_type: 'authorization_code', code: q.get('code'), code_verifier: p.verifier });
    try { const yo = await graph('/me'); pon('cuenta', yo.userPrincipalName || yo.mail || yo.displayName); } catch (e) {}
    return p.volver;
  }
  async function acceso() {
    const t = lee('tok', null);
    if (!t) return null;
    if (t.acceso && t.vence > Date.now()) return t.acceso;
    if (!t.refresco) return null;
    try { return await token({ grant_type: 'refresh_token', refresh_token: t.refresco }); }
    catch (e) { pon('tok', null); return null; }
  }
  async function graph(ruta, opciones = {}) {
    const a = await acceso(); if (!a) { const e = new Error('Hay que entrar de nuevo a Microsoft'); e.sesion = true; throw e; }
    const r = await fetch('https://graph.microsoft.com/v1.0' + ruta, Object.assign({}, opciones, { headers: Object.assign({ Authorization: 'Bearer ' + a }, opciones.headers || {}) }));
    if (r.status === 401) { pon('tok', null); const e = new Error('Hay que entrar de nuevo a Microsoft'); e.sesion = true; throw e; }
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j.error && j.error.message) || 'OneDrive respondió ' + r.status); }
    return r.status === 204 ? null : r.json();
  }
  const rutaCodificada = r => r.split('/').map(encodeURIComponent).join('/');
  function subir(nombre, contenido, tipo) {
    return graph(`/me/drive/root:/${rutaCodificada(CARPETA + '/' + nombre)}:/content`, { method: 'PUT', headers: { 'Content-Type': tipo || 'text/plain; charset=utf-8' }, body: contenido });
  }

  /* Cola: un archivo por nombre (la versión más nueva gana) */
  const cola = () => lee('cola', {});
  function encolar(nombre, contenido, tipo) { const c = cola(); c[nombre] = { contenido, tipo, ts: Date.now() }; pon('cola', c); procesar(); }
  let ocupado = false, ultimoError = '';
  async function procesar() {
    if (ocupado || !navigator.onLine || !conectado()) return;
    ocupado = true; ultimoError = '';
    const c = cola();
    for (const [nombre, it] of Object.entries(c)) {
      try { await subir(nombre, it.contenido, it.tipo); const c2 = cola(); if (c2[nombre] && c2[nombre].ts === it.ts) delete c2[nombre]; pon('cola', c2); pon('ultima', Date.now()); }
      catch (e) { ultimoError = e.message; if (e.sesion) break; }
    }
    ocupado = false;
    document.dispatchEvent(new CustomEvent('onedrive'));
  }
  const conectado = () => !!lee('tok', null);
  window.addEventListener('online', procesar);
  return {
    clientId, ponerClientId: v => pon('client', v.trim()), redirect, entrar, completarEntrada, conectado,
    salir: () => { pon('tok', null); pon('cuenta', null); }, cuenta: () => lee('cuenta', ''),
    encolar, procesar, pendientes: () => Object.keys(cola()), ultima: () => lee('ultima', 0), error: () => ultimoError,
    carpeta: CARPETA, enlaceCarpeta: () => 'https://onedrive.live.com/?id=root&qt=search&q=' + encodeURIComponent('Contabilidad')
  };
})();
