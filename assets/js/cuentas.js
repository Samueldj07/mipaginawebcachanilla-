/* =====================================================================
   LA CACHANILLA · CUENTAS DEL ÁREA PRIVADA
   ---------------------------------------------------------------------
   No edites este archivo a mano: entra a Panel → "Cuentas", aprueba o
   crea cuentas y pulsa "Descargar cuentas.js". Luego súbelo a GitHub en
   assets/js/ (reemplazando este). En 1–2 minutos las cuentas quedan activas.

   Las contraseñas NO se guardan: solo una huella (hash) imposible de leer.
   rol "dueño"  → Administrador: Panel, Administración (autoriza cuentas) y Caja
   rol "cajero" → solo Caja (POS)
   ===================================================================== */
window.CUENTAS = {
  // Aquí llegan las solicitudes de cuenta nuevas (cualquier administrador puede aprobarlas)
  whatsappDuenos: ["19392540736"],
  correosDuenos: ["lacachanillamx@outlook.com", "spm.biokinet@gmail.com"],

  usuarios: [
    { usuario: "cachanilla", nombre: "Dueños La Cachanilla", correo: "", whatsapp: "19392540736", rol: "dueño", alta: "2026-11-19",
      hash: "923b8ad1f573fb1aa1cf1b1464eacaa41b94738f6e89d7acdebb3d206d401d5a" },
    { usuario: "hnosamueldjsfm@gmail.com", nombre: "Samuel", correo: "hnosamueldjsfm@gmail.com", whatsapp: "", rol: "dueño", alta: "2026-11-20",
      hash: "e1f51a79132e6b3ecf271bdc6054fffc8863b3f15cc762c6c85b1a15639d3057" },
    { usuario: "lacachanillamx@outlook.com", nombre: "La Cachanilla", correo: "lacachanillamx@outlook.com", whatsapp: "19392540736", rol: "dueño", alta: "2026-11-20",
      hash: "c69cd99a952066bdb93957bd72eff523aacdc65ce614297b707d55866a6426fa" }
  ]
};
