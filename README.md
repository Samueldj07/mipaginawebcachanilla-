# La Cachanilla · Panadería Mexicana

Sitio web de La Cachanilla con diseño inspirado en la talavera poblana, página de pedidos y área privada para los dueños con caja (POS).

## Páginas

| Página | Archivo | Para quién |
|---|---|---|
| Inicio | `index.html` | Clientes |
| Menú | `menu.html` | Clientes |
| Haz tu pedido (catálogo de la semana) | `pedidos.html` | Clientes — el pedido llega por WhatsApp |
| Nosotros + galería | `nosotros.html` | Clientes |
| Videos de Instagram | `instagram.html` | Clientes |
| Acceso dueños | `acceso.html` | Dueños (usuario y contraseña) |
| Panel de dueños | `panel.html` | Dueños: resumen de ventas, catálogo de la semana, seguridad |
| Caja (POS) | `pos.html` | Dueños: cobrar, recibos, cierre del día, CSV |

## Publicar gratis con GitHub Pages
1. En GitHub: **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
3. En 1–2 minutos el sitio queda en `https://samueldj07.github.io/mipaginawebcachanilla-/`.

## Lo primero que hay que cambiar
En `assets/js/catalogo.js`:
- `whatsapp`: el número real que recibe pedidos (ej. `17875551234`).
- `instagram`: confirmar el usuario exacto.
- `reels`: pegar los enlaces de los reels de Instagram.

En `assets/js/auth.js`: **cambiar la contraseña temporal** (Panel → Seguridad te genera la línea).

El usuario y la contraseña temporales se entregaron a los dueños por privado (no se escriben aquí porque el repositorio es público).

## Fotos y video (espacios listos)
Sube las fotos con estos nombres y aparecen solas:
- `assets/img/portada.jpg` — foto grande del inicio (cuadrada)
- `assets/img/nosotros.jpg` — foto del equipo (vertical)
- `assets/img/galeria/1.jpg` … `8.jpg`
- `assets/img/productos/concha.jpg`, `marranito.jpg`, `bisquet.jpg`, `telera.jpg`, `telera-jalapeno.jpg`, `rebanada.jpg`, `picon.jpg`, `budin.jpg`, `piedra.jpg`, `beso.jpg`, `calvo.jpg`, `cubilete.jpg`, `pan-muerto.jpg`, `cortadillo.jpg`, `panque-chino.jpg`, `champurrado.jpg`, `jamaica.jpg`
- `assets/video/cachanilla.mp4` — video propio (opcional) y `assets/img/video-portada.jpg` como portada del video

Consejo: fotos en .jpg de menos de 400 KB (de 1200 px de ancho) para que el sitio cargue rápido.

## Límites importantes (léelos)
- **El acceso de dueños no es seguridad bancaria.** El sitio es estático: el login esconde el panel, pero alguien técnico puede leer el código. No guardes datos sensibles.
- **Las ventas del POS se guardan en el equipo donde se cobran** (navegador). Usa siempre el mismo equipo como caja y descarga el respaldo semanal (POS → Ajustes).
- **El catálogo de la semana se publica subiendo `catalogo.js` a GitHub** (el panel lo genera). Para que el panel publique solo, con pedidos guardados en línea y varios equipos compartiendo ventas, hace falta una base de datos (por ejemplo Firebase o Supabase): es la siguiente fase.
- El recibo del POS no sustituye el sistema fiscal oficial de Hacienda (IVU Loto / SURI). Confirma con tu contador la tasa de IVU que te aplica.
