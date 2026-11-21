/* =====================================================================
   LA CACHANILLA · DATOS DEL NEGOCIO Y CATÁLOGO DE LA SEMANA
   ---------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para cambiar lo que ven
   los clientes: productos de la semana, precios, fotos, WhatsApp,
   Instagram y eventos.

   Forma fácil: entra al Panel de dueños → "Catálogo de la semana",
   haz los cambios, pulsa "Descargar catalogo.js" y súbelo a GitHub
   en la carpeta assets/js/ (reemplazando este archivo).
   ===================================================================== */
window.CACHANILLA = {
  negocio: {
    nombre: "La Cachanilla",
    lema: "Panadería mexicana · hecha a mano en Puerto Rico",
    // Número de WhatsApp para recibir pedidos: código de país + número, sin espacios ni guiones.
    // 1 + 939 + número.
    whatsapp: "19392540736",
    instagram: "lacachanilla.mxdulce",          // ⚠️ Confirmar el usuario exacto de Instagram
    // Publicaciones automáticas en la portada: URL del feed JSON de Behold (behold.so)
    // ej. "https://feeds.behold.so/AbCdEf123456". Se configura en Panel → Instagram.
    instagramFeed: "",
    correo: "",
    zona: "San Juan, Puerto Rico",
    // Videos/reels de Instagram: pega aquí los enlaces de las publicaciones
    // ej. "https://www.instagram.com/reel/ABC123xyz/"
    reels: [
      // "https://www.instagram.com/reel/XXXXXXXXXXX/",
    ],
    // Video propio (opcional): sube un .mp4 a assets/video/ con este nombre
    videoLocal: "assets/video/cachanilla.mp4",
    // Próximos eventos / dónde encontrarnos
    eventos: [
      { fecha: "Sáb 21 nov", lugar: "Panadería Mexicana La Cachanilla", nota: "12:00 p.m. a 5:00 p.m. · Edificio 1109, Santa Rita, Río Piedras, PR 00925" },
      { fecha: "Dom 22 nov", lugar: "Día de Mercado · Conservatorio de Música de Puerto Rico", nota: "Miramar, San Juan" },
      { fecha: "Sáb 19 dic", lugar: "Verbena Navideña · Río Piedras", nota: "Plaza de la Convalecencia" }
    ]
  },

  // Cambia cada vez que se publica desde el panel (sirve para que los equipos usen el catálogo nuevo)
  actualizado: "2026-11-20T22:15",

  // Texto que aparece arriba del catálogo de pedidos
  semana: "Menú del fin de semana · 21 y 22 de noviembre",
  pedidosNota: "Elige tu pan, el día y dónde lo recoges. Te confirmamos por WhatsApp.",

  // Días en que se pueden recoger pedidos (el cliente elige uno)
  diasPedido: [
    { fecha: "2026-11-21", etiqueta: "Sábado 21 de noviembre · 12 a 5 p.m. · Panadería, Edificio 1109 Santa Rita, Río Piedras" },
    { fecha: "2026-11-22", etiqueta: "Domingo 22 de noviembre · Día de Mercado, Conservatorio de Música de PR" }
  ],

  // Noticias y novedades (la más reciente primero). Se editan en Panel → Noticias.
  noticias: [
    { fecha: "2026-11-19", titulo: "Este fin de semana: sábado y domingo",
      texto: "El sábado 21 abrimos como Panadería Mexicana en el Edificio 1109 de Santa Rita, Río Piedras (PR 00925), de 12:00 p.m. a 5:00 p.m., y el domingo 22 nos vemos en el Día de Mercado del Conservatorio de Música de Puerto Rico. ¡Aparta tu pan desde ya!",
      img: "", enlace: "https://www.google.com/maps/search/?api=1&query=1109+Santa+Rita+R%C3%ADo+Piedras+PR+00925", boton: "Cómo llegar el sábado" },
    { fecha: "2026-11-19", titulo: "Nuevo menú con roles, donas y niño envuelto",
      texto: "Llegan los roles de canela, donas (glaseado clásico, azucaradas o chocolate), empanadas, pericos, elotitos y cuernitos de pan fino, niño envuelto y champurrado de galleta.",
      img: "", enlace: "menu.html", boton: "Ver el menú" }
  ],

  // disponible: true = aparece en el menú de pedidos de esta semana
  // destacado:  true = aparece en la portada
  // opciones:   sabores/variantes que el cliente elige al pedir
  // img: ruta de la foto (sube la foto con ese mismo nombre a assets/img/productos/)
  productos: [
    { id: "p2",  nombre: "Marranitos de piloncillo",  precio: 2.50, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/marranito.jpg",    desc: "Cochinitos de piloncillo y especias, suaves por dentro." },
    { id: "p14", nombre: "Cortadillo (pastel)",       precio: 3.50, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/cortadillo.jpg",   desc: "Cuadrito de pastel esponjoso con su cubierta." },
    { id: "e1",  nombre: "Elotito pan fino",          precio: 4.00, cat: "Pan fino",   disponible: true,  destacado: false, img: "assets/img/productos/elotito.jpg",      desc: "Pan fino en forma de elote." },
    { id: "e2",  nombre: "Cuernito pan fino",         precio: 4.00, cat: "Pan fino",   disponible: true,  destacado: false, img: "assets/img/productos/cuernito.jpg",     desc: "Cuernito de pan fino, dorado y suave." },
    { id: "e3",  nombre: "Pericos",                   precio: 4.00, cat: "Pan fino",   disponible: true,  destacado: false, img: "assets/img/productos/pericos.jpg",      desc: "Pan fino relleno de Nutella o de crema pastelera.", opciones: ["Nutella", "Crema pastelera"] },
    { id: "e4",  nombre: "Roles de canela",           precio: 5.00, cat: "Pan dulce",  disponible: true,  destacado: true,  img: "assets/img/productos/roles-canela.jpg", desc: "Rol suave de canela, perfecto con café o champurrado." },
    { id: "p1",  nombre: "Concha",                    precio: 3.50, cat: "Pan dulce",  disponible: true,  destacado: true,  img: "assets/img/productos/concha.jpg",       desc: "El clásico: pan suave con su costra de azúcar en chocolate o vainilla.", opciones: ["Chocolate", "Vainilla"] },
    { id: "p8",  nombre: "Budín de la casa",          precio: 5.00, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/budin.jpg",        desc: "Nuestro budín de pan, receta de la casa." },
    { id: "p9",  nombre: "Piedras con chocolate",     precio: 3.00, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/piedra.jpg",       desc: "Crujientes, con chocolate." },
    { id: "e5",  nombre: "Empanadas",                 precio: 3.50, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/empanadas.jpg",    desc: "Empanadas horneadas rellenas.", opciones: ["Cajeta", "Queso/piloncillo", "Crema pastelera"] },
    { id: "e6",  nombre: "Niño envuelto",             precio: 4.50, cat: "Pan dulce",  disponible: true,  destacado: true,  img: "assets/img/productos/nino-envuelto.jpg", desc: "Rollo de pastel esponjoso, un clásico mexicano." },
    { id: "e7",  nombre: "Donas",                     precio: 4.00, cat: "Pan dulce",  disponible: true,  destacado: true,  img: "assets/img/productos/donas.jpg",        desc: "Donas esponjosas en tres estilos.", opciones: ["Glaseado clásico", "Azucaradas", "Chocolate"] },
    { id: "p13", nombre: "Pan de muerto",             precio: 3.50, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/pan-muerto.jpg",   desc: "Tradición mexicana con azahar y azúcar." },
    { id: "p3",  nombre: "Bisquet mantequilla",       precio: 3.50, cat: "Pan dulce",  disponible: true,  destacado: false, img: "assets/img/productos/bisquet.jpg",      desc: "Esponjoso, dorado y con mucha mantequilla." },
    { id: "p4",  nombre: "Teleras sencillas",         precio: 2.50, cat: "Pan salado", disponible: true,  destacado: false, img: "assets/img/productos/telera.jpg",       desc: "Pan salado tradicional, perfecto para tortas." },
    { id: "e8",  nombre: "Bolillos",                  precio: 2.50, cat: "Pan salado", disponible: true,  destacado: false, img: "assets/img/productos/bolillo.jpg",      desc: "El pan blanco clásico de México: crujiente por fuera y suave por dentro." },
    { id: "p5",  nombre: "Mini telera",               precio: 2.50, cat: "Pan salado", disponible: true,  destacado: false, img: "assets/img/productos/telera-jalapeno.jpg", desc: "Mini telera rellena.", opciones: ["Queso y jalapeño", "Queso y pepperoni"] },
    { id: "d1",  nombre: "Champurrado de galleta 12 oz", precio: 5.00, cat: "Bebidas", disponible: true, destacado: false, img: "assets/img/productos/champurrado.jpg", desc: "Bebida caliente de masa y chocolate, con galleta." },

    // No están en el menú de esta semana (se pueden volver a activar en el panel)
    { id: "p6",  nombre: "Rebanada de mantequilla",   precio: 3.50, cat: "Pan dulce",  disponible: false, destacado: false, img: "assets/img/productos/rebanada.jpg",     desc: "Rebanada de pan con mantequilla y azúcar." },
    { id: "p7",  nombre: "Picón nuez y pasas",        precio: 5.00, cat: "Pan dulce",  disponible: false, destacado: false, img: "assets/img/productos/picon.jpg",        desc: "Pan dulce con nuez y pasas." },
    { id: "p10", nombre: "Beso",                      precio: 4.00, cat: "Pan dulce",  disponible: false, destacado: false, img: "assets/img/productos/beso.jpg",         desc: "Dos mitades unidas con mermelada y cubiertas de dulce." },
    { id: "p11", nombre: "Calvo",                     precio: 4.00, cat: "Pan dulce",  disponible: false, destacado: false, img: "assets/img/productos/calvo.jpg",        desc: "Un clásico de la panadería mexicana." },
    { id: "p12", nombre: "Cubilete queso",            precio: 3.00, cat: "Pan dulce",  disponible: false, destacado: false, img: "assets/img/productos/cubilete.jpg",     desc: "Cubilete relleno de queso." },
    { id: "p15", nombre: "Panqué chino",              precio: 3.50, cat: "Pan dulce",  disponible: false, destacado: false, img: "assets/img/productos/panque-chino.jpg", desc: "Panqué esponjoso en su capacillo." },
    { id: "d2",  nombre: "Agua de jamaica 16 oz",     precio: 5.00, cat: "Bebidas",    disponible: false, destacado: false, img: "assets/img/productos/jamaica.jpg",      desc: "Agua fresca de flor de jamaica." },
    { id: "d3",  nombre: "Agua de jamaica 32 oz",     precio: 8.00, cat: "Bebidas",    disponible: false, destacado: false, img: "assets/img/productos/jamaica.jpg",      desc: "Agua fresca de flor de jamaica, tamaño grande." }
  ]
};
