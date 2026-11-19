/* La Cachanilla · videos de Instagram y video propio */
(function () {
  const N = window.CACHANILLA.negocio;

  const espacio = (titulo, texto) => `
    <div class="reel-ph rev"><div><b>${titulo}</b>${texto}</div></div>`;

  window.videoFallo = el => {
    const box = el.closest('.video-box');
    if (box) box.outerHTML = espacio('Video de La Cachanilla',
      'Espacio para tu video: sube <code>cachanilla.mp4</code> a la carpeta <code>assets/video/</code>.');
  };

  window.pintarReels = (sel, max, conVideoLocal) => {
    const cont = document.querySelector(sel);
    if (!cont) return;
    const reels = (N.reels || []).slice(0, max || 99);
    let html = '';

    if (conVideoLocal && N.videoLocal) {
      html += `
        <div class="video-box rev">
          <video controls playsinline preload="metadata" poster="assets/img/video-portada.jpg">
            <source src="${esc(N.videoLocal)}" type="video/mp4" onerror="videoFallo(this)">
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
    } else {
      const faltan = Math.max(1, (max || 3) - (conVideoLocal ? 1 : 0));
      for (let i = 0; i < faltan; i++) {
        html += espacio('Reel de @' + esc(N.instagram),
          'Espacio para un video de Instagram. Pega el enlace del reel en <code>assets/js/catalogo.js</code> → <code>reels</code>.');
      }
    }
    cont.innerHTML = html;
    if (window.revelar) revelar();
  };
})();
