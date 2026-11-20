/* La Cachanilla · utilidades compartidas del Panel y el POS */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const money = n => '$' + r2(n).toFixed(2);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const store = {
  get(k, d) { try { const v = localStorage.getItem('cach_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cach_' + k, JSON.stringify(v)); return true; } catch (e) { toast('No se pudo guardar en este equipo', true); return false; } },
  del(k) { try { localStorage.removeItem('cach_' + k); } catch (e) {} }
};

/* Catálogo activo: el borrador del panel (si existe) o el del archivo publicado */
function catalogoActivo() {
  const b = store.get('catalogo_borrador', null);
  // Si se publicó un catálogo más nuevo desde otro equipo, el borrador viejo se descarta
  if ((window.CACHANILLA.actualizado || '') > store.get('catalogo_base', '')) {
    store.del('catalogo_borrador'); store.del('catalogo_semana'); store.del('negocio_borrador'); store.del('noticias_borrador'); store.del('dias_borrador');
    return JSON.parse(JSON.stringify(window.CACHANILLA.productos));
  }
  return Array.isArray(b) && b.length ? b : JSON.parse(JSON.stringify(window.CACHANILLA.productos));
}
/* Marca los borradores como basados en el catálogo publicado actual */
function marcarBaseCatalogo(v) { store.set('catalogo_base', v || window.CACHANILLA.actualizado || ''); }

const AJUSTES_BASE = {
  estatal: 6.0, municipal: 1.0, incluido: false,
  negocio: 'La Cachanilla', telefono: '', lugar: '',
  gracias: '¡Gracias por tu compra! Un antojo mexicano, donde quiera que vayamos.'
};
const ajustes = () => Object.assign({}, AJUSTES_BASE, store.get('pos_ajustes', {}));
const ventas = () => store.get('pos_ventas', []);

const diaKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const hoyKey = () => diaKey(Date.now());
const hora = ts => new Date(ts).toLocaleTimeString('es-PR', { hour: 'numeric', minute: '2-digit' });
const fecha = ts => new Date(ts).toLocaleDateString('es-PR', { day: '2-digit', month: '2-digit', year: 'numeric' });

function toast(msg, err) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2400);
}
function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo || 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); toast('Copiado'); }
  catch (e) { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('Copiado'); }
}

/* Resumen de ventas de un conjunto */
function resumirVentas(lista) {
  const ok = lista.filter(v => !v.anulada);
  const r = { n: ok.length, art: 0, subtotal: 0, ivu: 0, total: 0, metodos: {}, productos: {} };
  ok.forEach(v => {
    r.subtotal += v.subtotal; r.ivu += v.ivu; r.total += v.total;
    r.metodos[v.metodo] = (r.metodos[v.metodo] || 0) + v.total;
    v.lineas.forEach(l => {
      r.art += l.q;
      const p = r.productos[l.nombre] || (r.productos[l.nombre] = { q: 0, total: 0 });
      p.q += l.q; p.total += l.precio * l.q;
    });
  });
  ['subtotal', 'ivu', 'total'].forEach(k => r[k] = r2(r[k]));
  return r;
}
