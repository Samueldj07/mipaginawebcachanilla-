/* La Cachanilla · utilidades comunes del sitio público */
(function () {
  const D = window.CACHANILLA;
  const N = D.negocio;
  const pagina = document.body.dataset.page || '';

  window.$ = (s, r = document) => r.querySelector(s);
  window.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  window.money = n => '$' + (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
  window.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Foto del producto con espacio de reemplazo si aún no existe */
  const ph = n => `<div class="ph"><img src="assets/img/marca/logo-horizontal.webp" alt="" width="520" height="292"><b>${esc(n)}</b>📷 Foto próximamente</div>`;
  window.phFoto = img => { if (!img.isConnected) return; const d = document.createElement('div'); d.innerHTML = ph(img.dataset.n); img.replaceWith(d.firstElementChild); };
  (window._phq || []).forEach(phFoto); window._phq = [];
  window.fotoProducto = p => p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy" data-n="${esc(p.nombre)}" onerror="phFoto(this)">`
    : ph(p.nombre);

  window.toast = (msg, err) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  };

  const papel = '<div class="papel" aria-hidden="true">' + '<span></span>'.repeat(40) + '</div>';
  const links = [
    ['index.html', 'Inicio', 'inicio'],
    ['menu.html', 'Menú', 'menu'],
    ['noticias.html', 'Noticias', 'noticias'],
    ['nosotros.html', 'Nosotros', 'nosotros'],
    ['instagram.html', 'Videos', 'instagram'],
    ['pedidos.html', 'Haz tu pedido', 'pedidos', 'cta'],
  ];

  const head = $('#site-header');
  if (head) {
    head.outerHTML = `
    <header class="top">
      ${papel}
      <nav class="wrap nav" aria-label="Principal">
        <a class="logo" href="index.html" aria-label="La Cachanilla, inicio"><img src="assets/img/marca/logo-nombre.webp" alt="La Cachanilla" width="480" height="146"></a>
        <button class="burger" aria-label="Abrir menú" aria-expanded="false">☰</button>
        <ul class="menu">
          ${links.map(([h, t, k, c]) => `<li><a href="${h}" class="${pagina === k ? 'on' : ''} ${c || ''}">${t}</a></li>`).join('')}
        </ul>
      </nav>
    </header>`;
    const b = $('.burger'), m = $('.menu');
    b.addEventListener('click', () => { m.classList.toggle('open'); b.setAttribute('aria-expanded', m.classList.contains('open')); });
  }

  const foot = $('#site-footer');
  if (foot) {
    const wa = N.whatsapp ? `https://wa.me/${N.whatsapp}` : '#';
    foot.outerHTML = `
    <footer>
      <div class="wrap">
        <div class="cols">
          <div>
            <a class="logo-pie" href="index.html"><img src="assets/img/marca/logo-completo.webp" alt="La Cachanilla" width="640" height="545" loading="lazy"></a>
            <p style="max-width:380px">${esc(N.lema)}. Pan dulce, pan salado y aguas frescas con recetas de México, horneados en ${esc(N.zona)}.</p>
          </div>
          <div>
            <h4>Visítanos</h4>
            <ul>
              <li><a href="menu.html">Menú</a></li>
              <li><a href="pedidos.html">Pedidos</a></li>
              <li><a href="noticias.html">Noticias</a></li>
              <li><a href="nosotros.html">Nosotros</a></li>
              <li><a href="instagram.html">Videos</a></li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li><a href="${wa}" target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a href="https://instagram.com/${esc(N.instagram)}" target="_blank" rel="noopener">@${esc(N.instagram)}</a></li>
              <li>${esc(N.zona)}</li>
            </ul>
          </div>
        </div>
        <div class="copy">
          <span>© ${new Date().getFullYear()} ${esc(N.nombre)} · Hecho con cariño mexicano en Puerto Rico</span>
          <span><a href="acceso.html" style="opacity:.6">Acceso dueños</a> · <a href="acceso-admin.html" style="opacity:.6">Administradores</a></span>
        </div>
      </div>
    </footer>`;
  }

  /* Noticias y novedades */
  window.fechaLarga = f => { try { return new Date(f + 'T12:00').toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return f; } };
  window.tarjetasNoticias = max => (D.noticias || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, max || 99).map(n => `
    <article class="noticia rev">
      ${n.img ? `<div class="n-img"><img src="${esc(n.img)}" alt="" loading="lazy" data-n="${esc(n.titulo)}" onerror="this.parentNode.remove()"></div>` : ''}
      <div class="n-body">
        <time datetime="${esc(n.fecha)}">${esc(fechaLarga(n.fecha))}</time>
        <h3>${esc(n.titulo)}</h3>
        <p>${esc(n.texto).replace(/\n/g, '<br>')}</p>
        ${n.enlace ? `<a class="btn btn-azul" href="${esc(n.enlace)}" ${/^https?:/.test(n.enlace) ? 'target="_blank" rel="noopener"' : ''}>${esc(n.boton || 'Ver más')}</a>` : ''}
      </div>
    </article>`).join('');

  /* Animación de entrada */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 }) : null;
  window.revelar = () => $$('.rev:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  document.addEventListener('DOMContentLoaded', revelar);
})();
