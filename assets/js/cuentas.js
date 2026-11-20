/* =====================================================================
   LA CACHANILLA · CUENTAS DEL ÁREA PRIVADA
   ---------------------------------------------------------------------
   No edites este archivo a mano: entra a Panel → "Cuentas", aprueba o
   crea cuentas y pulsa "Descargar cuentas.js". Luego súbelo a GitHub en
   assets/js/ (reemplazando este). En 1–2 minutos las cuentas quedan activas.

   Las contraseñas NO se guardan: solo una huella (hash) imposible de leer.
   rol "dueño"  → Panel completo + Caja
   rol "cajero" → solo Caja (POS)
   ===================================================================== */
window.CUENTAS = {
  // Aquí llegan las solicitudes de cuenta nuevas
  whatsappDueno: "19392540736",
  correoDueno: "",            // ⚠️ Correo principal de los dueños (para recibir solicitudes)

  usuarios: [
    { usuario: "cachanilla", nombre: "Dueños La Cachanilla", correo: "", whatsapp: "19392540736", rol: "dueño", alta: "2026-11-19",
      hash: "923b8ad1f573fb1aa1cf1b1464eacaa41b94738f6e89d7acdebb3d206d401d5a" }
  ]
};
