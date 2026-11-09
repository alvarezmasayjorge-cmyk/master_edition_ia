/**
 * Configuración global de Doctores Pro
 * Edita este archivo para actualizar números, enlaces de video y parámetros de campaña.
 */
window.DOCTORES_PRO_CONFIG = {
  // Número de WhatsApp para coordinar reuniones comerciales (formato internacional sin signos: 591 + número)
  whatsappNumber: "59175013150",

  // Mensaje inicial que se abre en WhatsApp al pulsar los botones de contacto
  whatsappMessage: "Hola Jorge, vi tu propuesta para cirujanos plásticos en Santa Cruz. Me gustaría coordinar una reunión breve para revisar si aplica a mi consultorio.",

  // URL del video VSL: ruta relativa como 'assets/vsl.mp4' o enlace HTTPS directo a archivo MP4.
  // Déjalo vacío ("") mientras se prepara el video final; la página mostrará un mensaje honesto y permitirá explorar la propuesta.
  videoUrl: "",

  // Imagen de portada opcional antes de reproducir el video (URL o ruta en assets)
  videoPoster: "",

  // Impide que el usuario avance en el reproductor sobre partes aún no vistas (anti-forward seeking).
  // No es DRM ni protección absoluta; previene saltos hacia adelante en los controles de la interfaz.
  preventForwardSeeking: true,

  // Cupos disponibles en Santa Cruz de la Sierra (actualizar cuando se ocupe)
  availableSpots: 1,

  // Ciudad de cobertura
  city: "Santa Cruz de la Sierra, Bolivia"
};

