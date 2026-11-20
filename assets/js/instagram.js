/* La Cachanilla · videos de Instagram y video propio */
(function () {
  const N = window.CACHANILLA.negocio;

  const espacio = (titulo, texto) => `
    <div class="reel-ph rev"><div><b>${titulo}</b>${texto}</div></div>`;

  window.videoFallo = (el, quitar) => {
    const box = el.closest('.video-box');
    if (box && quitar) { box.remove(); return; }
    if (box) box.outerHTML = espacio('Video de La Cachanilla',
      'Espacio para tu video: sube <code>cachanilla.mp4</code> a la carpeta <code>assets/video/</code>.');
  };

  /* ---------- Publicaciones automáticas (feed JSON de Behold) ---------- */
  const CACHE_KEY = 'cach_igfeed', CACHE_HORAS = 6;   // ahorra "vistas" del plan gratis
  async function leerFeed(url) {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (c && c.url === url && Date.now() - c.ts < CACHE_HORAS * 36e5) return c.data;
    } catch (e) {}
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error('feed ' + r.status);
    const data = await r.json();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ url, ts: Date.now(), data })); } catch (e) {}
    return data;
  }
  const imgPost = p => {
    const z = p.sizes || {};
    return (z.medium && z.medium.mediaUrl) || (z.small && z.small.mediaUrl) || p.thumbnailUrl || (p.mediaType !== 'VIDEO' ? p.mediaUrl : '') || '';
  };
  const textoPost = p => String(p.prunedCaption || p.caption || '').replace(/\s+/g, ' ').trim();

  window.pintarFeed = async (sel, max, alFallar, alExito) => {
    const cont = document.querySelector(sel); if (!cont) return;
    const url = (N.instagramFeed || '').trim();
    if (!url) { alFallar && alFallar(); return; }
    cont.innerHTML = '<div class="ig-grid">' + '<div class="ig-post cargando"></div>'.repeat(max || 6) + '</div>';
    try {
      const data = await leerFeed(url);
      const posts = (Array.isArray(data) ? data : data.posts || []).filter(imgPost).slice(0, max || 6);
      if (!posts.length) throw new Error('sin publicaciones');
      const u = (data.username || N.instagram);
      cont.innerHTML = `
        <div class="ig-perfil rev">
          ${data.profilePictureUrl ? `<img src="${esc(data.profilePictureUrl)}" alt="" width="56" height="56">` : '<i></i>'}
          <div><b>@${esc(u)}</b>${data.followersCount ? `<small>${Number(data.followersCount).toLocaleString('es-PR')} seguidores</small>` : '<small>Instagram</small>'}</div>
          <a class="btn btn-rosa" href="https://instagram.com/${esc(u)}" target="_blank" rel="noopener">Seguir</a>
        </div>
        <div class="ig-grid">${posts.map(p => {
          const t = textoPost(p);
          const icono = p.mediaType === 'VIDEO' ? '▶' : p.mediaType === 'CAROUSEL_ALBUM' ? '❐' : '';
          return `<a class="ig-post rev" href="${esc(p.permalink)}" target="_blank" rel="noopener" aria-label="${esc(t.slice(0, 90) || 'Publicación de Instagram')}">
            <img src="${esc(imgPost(p))}" alt="${esc(t.slice(0, 120))}" loading="lazy">
            ${icono ? `<span class="ig-tipo">${icono}</span>` : ''}
            <span class="ig-capa"><span>${esc(t.slice(0, 140))}${t.length > 140 ? '…' : ''}</span></span>
          </a>`;
        }).join('')}</div>`;
      if (window.revelar) revelar();
      alExito && alExito();
    } catch (e) {
      try { localStorage.removeItem(CACHE_KEY); } catch (x) {}
      alFallar && alFallar();
    }
  };

  window.pintarReels = (sel, max, conVideoLocal, sinEspacios) => {
    const cont = document.querySelector(sel);
    if (!cont) return;
    const reels = (N.reels || []).slice(0, max || 99);
    let html = '';

    if (conVideoLocal && N.videoLocal) {
      html += `
        <div class="video-box rev">
          <video controls playsinline preload="metadata" poster="assets/img/video-portada.jpg">
            <source src="${esc(N.videoLocal)}" type="video/mp4" onerror="videoFallo(this${sinEspacios ? ', true' : ''})">
          </video>
        </div>`;
    }

    if (reels.length) {
      html += reels.map(url => `
        <blockquote class="instagram-media rev" data-instgrm-permalink="${esc(url)}" data-instgrm-version="14"
          style="background:#fff;border:0;border-radius:18px;box-shadow:0 10px 30px rgba(18,40,107,.12);max-width:540px;width:100%">
          <a href="${esc(url)}" target="_blank" rel="noopener">Ver este video en Instagram</a>
        </blockquote>`).join('');
      if (!document.getElementById('ig-embed')) {
        const s = document.createElement('script');
        s.id = 'ig-embed'; s.async = true; s.src = 'https://www.instagram.com/embed.js';
        document.body.appendChild(s);
      } else if (window.instgrm) { window.instgrm.Embeds.process(); }
    } else if (!sinEspacios) {
      const faltan = Math.max(1, (max || 3) - (conVideoLocal ? 1 : 0));
      for (let i = 0; i < faltan; i++) {
        html += espacio('Reel de @' + esc(N.instagram),
          'Espacio para tus publicaciones. Conecta tu Instagram en <b>Panel → Instagram</b>.');
      }
    }
    cont.innerHTML = html;
    if (window.revelar) revelar();
  };
})();
