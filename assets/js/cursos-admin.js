/* La Cachanilla · Administración de cursos (se publican dentro de catalogo.js) */
(() => {
  const C0 = window.CACHANILLA;
  const KEY = 'cursos_borrador';
  if (JSON.stringify(store.get(KEY, null)) === JSON.stringify(C0.cursos || [])) store.del(KEY);   // ya publicado
  let cursos = store.get(KEY, null) || JSON.parse(JSON.stringify(C0.cursos || []));
  const nuevoId = () => 'c' + Date.now().toString(36);
  const inp = (k, v, ph, extra = '') => `<input data-k="${k}" value="${esc(v ?? '')}" placeholder="${ph}" ${extra} style="width:100%;padding:9px 10px;border:1.5px solid var(--linea);border-radius:8px">`;

  function pintar() {
    $('#crLista').innerHTML = cursos.length ? cursos.map((c, i) => `
      <div class="caja" data-c="${i}" style="border-left:6px solid ${c.publicado ? 'var(--hoja)' : 'var(--linea)'}">
        <div class="fila" style="justify-content:space-between;margin-bottom:10px">
          <label class="chk" style="font-weight:700"><input type="checkbox" data-k="publicado" ${c.publicado ? 'checked' : ''}> Publicado</label>
          <div class="fila"><button class="b b-sec" style="padding:6px 10px" data-sube="${i}" title="Subir">↑</button><button class="b b-sec" style="padding:6px 10px" data-baja="${i}" title="Bajar">↓</button><button class="b b-rojo" style="padding:6px 10px" data-borra="${i}">Eliminar</button></div>
        </div>
        <div class="dos">
          <div>
            <label class="campo">Título${inp('titulo', c.titulo, 'Ej. Conchas como en México')}</label>
            <label class="campo">Descripción<textarea data-k="desc" rows="3" style="width:100%;padding:9px 10px;border:1.5px solid var(--linea);border-radius:8px">${esc(c.desc || '')}</textarea></label>
            <label class="campo">Qué incluye (una cosa por línea)<textarea data-k="incluye" rows="4" placeholder="5 videos paso a paso&#10;Receta en PDF&#10;Lista de ingredientes" style="width:100%;padding:9px 10px;border:1.5px solid var(--linea);border-radius:8px">${esc((c.incluye || []).join('\n'))}</textarea></label>
          </div>
          <div>
            <div class="dos" style="gap:10px">
              <label class="campo">Precio (US$)${inp('precio', c.precio, '0 = gratis', 'type="number" min="0" step="0.01"')}</label>
              <label class="campo">Nivel${inp('nivel', c.nivel, 'Principiante')}</label>
            </div>
            <div class="dos" style="gap:10px">
              <label class="campo">Duración${inp('duracion', c.duracion, 'Ej. 2 horas')}</label>
              <label class="campo">Modalidad${inp('modalidad', c.modalidad, 'En línea / Presencial')}</label>
            </div>
            <label class="campo">Enlace de compra (Hotmart, Teachable, Payhip, Stripe…)${inp('enlace', c.enlace, 'https://…')}</label>
            <label class="campo">Texto del botón${inp('boton', c.boton, 'Comprar curso')}</label>
            <label class="campo">Video de muestra (YouTube o reel de Instagram, opcional)${inp('video', c.video, 'https://youtube.com/…')}</label>
            <label class="campo">Foto de portada (ruta)${inp('img', c.img, 'assets/img/cursos/conchas.jpg')}</label>
          </div>
        </div>
      </div>`).join('') : '<p class="vacio">Aún no hay cursos. Toca <b>+ Nuevo curso</b>.</p>';
  }
  const guardar = () => store.set(KEY, cursos);
  $('#crLista').addEventListener('input', e => {
    const box = e.target.closest('[data-c]'), k = e.target.dataset.k; if (!box || !k) return;
    const c = cursos[box.dataset.c];
    if (k === 'publicado') { c.publicado = e.target.checked; box.style.borderLeftColor = c.publicado ? 'var(--hoja)' : 'var(--linea)'; }
    else if (k === 'precio') c.precio = r2(Number(e.target.value) || 0);
    else if (k === 'incluye') c.incluye = e.target.value.split('\n').map(x => x.trim()).filter(Boolean);
    else c[k] = e.target.value.trim();
    guardar();
  });
  $('#crLista').addEventListener('click', e => {
    const s = e.target.closest('[data-sube]'), b = e.target.closest('[data-baja]'), d = e.target.closest('[data-borra]');
    const mover = (i, j) => { if (j < 0 || j >= cursos.length) return; [cursos[i], cursos[j]] = [cursos[j], cursos[i]]; guardar(); pintar(); };
    if (s) mover(+s.dataset.sube, +s.dataset.sube - 1);
    if (b) mover(+b.dataset.baja, +b.dataset.baja + 1);
    if (d && confirm('¿Eliminar el curso "' + (cursos[d.dataset.borra].titulo || 'sin título') + '"?')) { cursos.splice(d.dataset.borra, 1); guardar(); pintar(); }
  });
  $('#crNuevo').onclick = () => {
    cursos.push({ id: nuevoId(), titulo: '', desc: '', nivel: 'Principiante', duracion: '', modalidad: 'En línea', precio: 0, enlace: '', boton: 'Comprar curso', video: '', img: '', incluye: [], publicado: false });
    guardar(); pintar(); $$('#crLista [data-k=titulo]').pop().focus();
  };

  function validar() {
    for (const c of cursos) {
      if (!c.titulo) { toast('Cada curso necesita título', true); return false; }
      if (c.enlace && !/^https:\/\//.test(c.enlace)) { toast('El enlace de compra de "' + c.titulo + '" debe empezar con https://', true); return false; }
      if (c.video && !/^https:\/\//.test(c.video)) { toast('El video de "' + c.titulo + '" debe ser un enlace https://', true); return false; }
    }
    return true;
  }
  function version() { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; }
  $('#crPublicar').onclick = async () => {
    if (!validar()) return;
    if (!ghConectado()) return toast('Conecta este equipo a GitHub en “Conexión y avisos” para publicar', true);
    const btn = $('#crPublicar'); btn.disabled = true; btn.textContent = 'Publicando…';
    try {
      // Parte del catálogo publicado actual (lo más reciente en GitHub) y solo cambia los cursos
      let base = C0;
      try {
        const r = await ghPedir(`/repos/${GH_REPO}/contents/assets/js/catalogo.js?ref=${GH_RAMA}`);
        const txt = decodeURIComponent(escape(atob(r.content.replace(/\n/g, ''))));
        const w = {}; new Function('window', txt)(w); if (w.CACHANILLA) base = w.CACHANILLA;
      } catch (e) {}
      const v = version();
      const datos = Object.assign({}, base, { actualizado: v, cursos });
      const texto = `/* =====================================================================
   LA CACHANILLA · DATOS DEL NEGOCIO, MENÚ, NOTICIAS, EVENTOS Y CURSOS
   Actualizado el ${new Date().toLocaleString('es-PR')}${(sesionActual() || {}).nombre ? ' por ' + sesionActual().nombre : ''}.
   Para cambiarlo usa el Panel (menú, noticias, Instagram) o Administración (cursos).
   ===================================================================== */
window.CACHANILLA = ${JSON.stringify(datos, null, 2)};
`;
      await ghPublicar('assets/js/catalogo.js', texto, 'Actualizar cursos');
      if (typeof marcarBaseCatalogo === 'function') marcarBaseCatalogo(v);
      toast('Cursos publicados. Se ven en la página en 1 a 5 minutos');
    } catch (e) { toast('No se pudo publicar: ' + e.message, true); }
    btn.disabled = false; btn.textContent = 'Publicar en el sitio';
  };

  document.addEventListener('vista', e => { if (e.detail === 'cursos') pintar(); });
  pintar();
})();
