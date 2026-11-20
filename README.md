# La Cachanilla · Panadería Mexicana

Sitio web de La Cachanilla con diseño inspirado en la talavera poblana, página de pedidos y área privada para los dueños con caja (POS).

## Páginas

| Página | Archivo | Para quién |
|---|---|---|
| Inicio | `index.html` | Clientes |
| Menú | `menu.html` | Clientes |
| Haz tu pedido (catálogo de la semana) | `pedidos.html` | Clientes — el pedido llega por WhatsApp |
| Noticias y eventos | `noticias.html` | Clientes |
| Nosotros + galería | `nosotros.html` | Clientes |
| Videos de Instagram | `instagram.html` | Clientes |
| Acceso dueños y equipo | `acceso.html` | Dueños y cajeros |
| Acceso de administradores | `acceso-admin.html` | Administradores de cuentas y dueños: van directo a Administración |
| Solicitar acceso | `registro.html` | Personal nuevo: la solicitud llega al WhatsApp y correo de los dueños |
| Panel de dueños | `panel.html` | Administradores: resumen de ventas y catálogo de la semana |
| Administración | `admin.html` | Administradores: autorizar, invitar, equipo, conexión con GitHub |
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

En Panel → Cuentas: **cambiar la contraseña temporal** y poner el correo principal de los dueños.

El usuario y la contraseña temporales se entregaron a los dueños por privado (no se escriben aquí porque el repositorio es público).

## Cuentas del equipo · `admin.html` (Administración)
Solo los **Administradores/as** (dueños) entran. Cualquiera de ellos puede autorizar.

- **Solicitud:** la persona entra a `registro.html`, crea su contraseña y envía la solicitud con un toque al WhatsApp y a los correos de los administradores (`lacachanillamx@outlook.com` y `spm.biokinet@gmail.com`). El mensaje trae un enlace: el administrador lo abre → **Aprobar**.
- **Invitación:** Administración → *Invitar* → se envía un enlace por WhatsApp/correo; la persona crea su contraseña y devuelve la confirmación para aprobar.
- **Publicación automática:** si el equipo del administrador está conectado a GitHub (Administración → *Conexión y avisos*, con un token que solo puede escribir en este repositorio), al aprobar la cuenta queda activa en 1–5 minutos sin subir archivos. Lo mismo para *Publicar en el sitio* del catálogo.
- Sin conexión: descarga `cuentas.js` y súbelo a GitHub en `assets/js/`.
- Tipos de cuenta: **Dueño/a** (panel, menú, caja y cuentas), **Administrador/a de cuentas** (solo cuentas y correos) y **Cajero/a** (solo caja). Las contraseñas no se guardan, solo una huella (hash).

## Menú, días de recogido y noticias
Todo se edita en el **Panel** y se publica con *Publicar en el sitio*:
- **Catálogo de la semana:** productos, precios, sabores (separados por coma), qué está disponible y qué sale en portada, y los **días para recoger pedidos**.
- **Noticias:** noticias y novedades (las 3 más recientes salen en la portada) y los eventos de “¿Dónde encontrarnos?”.
La caja (POS) muestra solo el menú de la semana y pide el sabor cuando el producto lo tiene.

## Instagram en la portada
Las últimas publicaciones salen solas en la portada y en Videos usando **Behold** (behold.so, plan gratis: 6 publicaciones, se actualiza 1 vez al día, 1,200 vistas/mes).
Configúralo en **Panel → Instagram**: crea el feed JSON en Behold, añade `samueldj07.github.io` a la *Domain whitelist*, pega la Feed URL y pulsa *Guardar y publicar*.
Si no hay feed, la portada muestra los reels fijados o los espacios de video.

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
