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
    // 1 + 787 + número.  ⚠️ CAMBIAR por el número real.
    whatsapp: "17870000000",
    instagram: "lacachanilla.mxdulce",          // ⚠️ Confirmar el usuario exacto de Instagram
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
      { fecha: "Sábados", lugar: "Mercados y pop-ups de San Juan", nota: "Síguenos en Instagram para la ubicación de cada semana" },
      { fecha: "19 de diciembre", lugar: "Verbena Navideña · Río Piedras", nota: "Plaza de la Convalecencia" }
    ]
  },

  // Texto que aparece arriba del catálogo de pedidos
  semana: "Catálogo de esta semana",
  pedidosNota: "Haz tu pedido con al menos 48 horas de anticipación. Confirmamos por WhatsApp.",

  // disponible: true = aparece en el catálogo de pedidos de la semana
  // destacado:  true = aparece en la portada
  // img: ruta de la foto (sube la foto con ese mismo nombre a assets/img/productos/)
  productos: [
    { id: "p1",  nombre: "Concha chocolate o vainilla", precio: 3.50, cat: "Pan dulce", disponible: true, destacado: true,  img: "assets/img/productos/concha.jpg",            desc: "El clásico: pan suave y esponjoso con su costra de azúcar en forma de concha." },
    { id: "p2",  nombre: "Marranito piloncillo",        precio: 2.50, cat: "Pan dulce", disponible: true, destacado: true,  img: "assets/img/productos/marranito.jpg",         desc: "Cochinito de piloncillo y especias, suave por dentro." },
    { id: "p3",  nombre: "Bisquet de mantequilla",      precio: 3.50, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/bisquet.jpg",           desc: "Esponjoso, dorado y con mucha mantequilla." },
    { id: "p4",  nombre: "Telera",                      precio: 2.50, cat: "Pan salado", disponible: true, destacado: false, img: "assets/img/productos/telera.jpg",           desc: "Pan salado tradicional, perfecto para tortas." },
    { id: "p5",  nombre: "Telera queso y jalapeño",     precio: 3.00, cat: "Pan salado", disponible: true, destacado: false, img: "assets/img/productos/telera-jalapeno.jpg",  desc: "Nuestra telera con queso y un toque de jalapeño." },
    { id: "p6",  nombre: "Rebanada de mantequilla",     precio: 3.50, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/rebanada.jpg",          desc: "Rebanada de pan con mantequilla y azúcar." },
    { id: "p7",  nombre: "Picón nuez y pasas",          precio: 5.00, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/picon.jpg",             desc: "Pan dulce con nuez y pasas." },
    { id: "p8",  nombre: "Budín",                       precio: 5.00, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/budin.jpg",             desc: "Budín de pan horneado, húmedo y dulce." },
    { id: "p9",  nombre: "Piedra",                      precio: 3.00, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/piedra.jpg",            desc: "Crujiente por fuera, con su cubierta de azúcar." },
    { id: "p10", nombre: "Beso",                        precio: 4.00, cat: "Pan dulce", disponible: true, destacado: true,  img: "assets/img/productos/beso.jpg",              desc: "Dos mitades unidas con mermelada y cubiertas de dulce." },
    { id: "p11", nombre: "Calvo",                       precio: 4.00, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/calvo.jpg",             desc: "Un clásico de la panadería mexicana." },
    { id: "p12", nombre: "Cubilete queso",              precio: 3.00, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/cubilete.jpg",          desc: "Cubilete relleno de queso." },
    { id: "p13", nombre: "Pan de muerto",               precio: 3.50, cat: "Temporada", disponible: false, destacado: false, img: "assets/img/productos/pan-muerto.jpg",       desc: "Tradición de Día de Muertos, con azahar y azúcar." },
    { id: "p14", nombre: "Cortadillo",                  precio: 3.00, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/cortadillo.jpg",        desc: "Cuadrito de bizcocho con su cubierta rosa." },
    { id: "p15", nombre: "Panqué chino",                precio: 3.50, cat: "Pan dulce", disponible: true, destacado: false, img: "assets/img/productos/panque-chino.jpg",      desc: "Panqué esponjoso en su capacillo." },
    { id: "d1",  nombre: "Champurrado 12 oz",           precio: 5.00, cat: "Bebidas",   disponible: true, destacado: false, img: "assets/img/productos/champurrado.jpg",       desc: "Bebida caliente de masa de maíz y chocolate." },
    { id: "d2",  nombre: "Agua de jamaica 16 oz",       precio: 5.00, cat: "Bebidas",   disponible: true, destacado: true,  img: "assets/img/productos/jamaica.jpg",           desc: "Agua fresca de flor de jamaica." },
    { id: "d3",  nombre: "Agua de jamaica 32 oz",       precio: 8.00, cat: "Bebidas",   disponible: true, destacado: false, img: "assets/img/productos/jamaica.jpg",           desc: "Agua fresca de flor de jamaica, tamaño grande." }
  ]
};
