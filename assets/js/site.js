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
          <a href="acceso.html" style="opacity:.6">Acceso dueños</a>
        </div>
      </div>
    </footer>`;
  }

  /* Animación de entrada */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 }) : null;
  window.revelar = () => $$('.rev:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  document.addEventListener('DOMContentLoaded', revelar);
})();
