/**
 * DOCTORES PRO - Lógica de Interfaz y Reproductor VSL
 */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.DOCTORES_PRO_CONFIG || {
    whatsappNumber: "59175013150",
    whatsappMessage: "Hola Jorge, vi tu propuesta para cirujanos plásticos en Santa Cruz. Me gustaría agendar una llamada breve.",
    videoUrl: "",
    videoPoster: "",
    preventForwardSeeking: true,
    availableSpots: 1
  };

  // 1. Configurar enlaces de WhatsApp
  const waUrl = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}`;
  const waLinks = document.querySelectorAll('.js-wa-link');
  waLinks.forEach(link => {
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  // 2. Actualizar año y textos dinámicos
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const spotTextEl = document.getElementById('spotText');
  if (spotTextEl && typeof config.availableSpots === 'number') {
    spotTextEl.textContent = `${config.availableSpots} ${config.availableSpots === 1 ? 'cupo disponible' : 'cupos disponibles'}`;
  }

  // 3. Inicializar Reproductor VSL
  const video = document.getElementById('vslVideo');
  const videoContainer = document.getElementById('videoContainer');
  const videoFallback = document.getElementById('videoFallback');
  const playOverlay = document.getElementById('playOverlay');
  const customControls = document.getElementById('customControls');
  const ctrlPlayPause = document.getElementById('ctrlPlayPause');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const ctrlMute = document.getElementById('ctrlMute');
  const muteIcon = document.getElementById('muteIcon');
  const ctrlFullscreen = document.getElementById('ctrlFullscreen');
  const progressWrap = document.getElementById('progressWrap');
  const progressWatched = document.getElementById('progressWatched');
  const progressBuffered = document.getElementById('progressBuffered');
  const currentTimeEl = document.getElementById('currentTime');
  const durationTimeEl = document.getElementById('durationTime');

  let maxTimeWatched = 0;

  // Formato mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Verificar si hay video configurado
  if (!config.videoUrl || config.videoUrl.trim() === '') {
    // Estado sin video: mostrar mensaje honesto
    if (videoFallback) videoFallback.style.display = 'flex';
    if (playOverlay) playOverlay.style.display = 'none';
    if (customControls) customControls.style.display = 'none';
    if (video) video.style.display = 'none';
  } else {
    // Configurar y preparar video
    if (videoFallback) videoFallback.style.display = 'none';
    if (playOverlay) playOverlay.style.display = 'flex';
    if (customControls) customControls.style.display = 'flex';
    if (video) {
      video.style.display = 'block';
      video.src = config.videoUrl;
      if (config.videoPoster) {
        video.poster = config.videoPoster;
      }
    }

    // Toggle Play/Pause
    function togglePlay() {
      if (video.paused || video.ended) {
        video.play().then(() => {
          playOverlay.style.display = 'none';
          playPauseIcon.textContent = '⏸';
        }).catch(err => {
          console.warn('Error al reproducir video:', err);
        });
      } else {
        video.pause();
        playOverlay.style.display = 'flex';
        playPauseIcon.textContent = '▶';
      }
    }

    playOverlay.addEventListener('click', togglePlay);
    ctrlPlayPause.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    // Actualización de tiempo y barra de progreso
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > maxTimeWatched) {
        maxTimeWatched = video.currentTime;
      }

      if (video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        progressWatched.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(video.currentTime);
      }
    });

    // Duración cuando los metadatos cargan
    video.addEventListener('loadedmetadata', () => {
      durationTimeEl.textContent = formatTime(video.duration);
    });

    // Buffer visual
    video.addEventListener('progress', () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percent = (bufferedEnd / video.duration) * 100;
        progressBuffered.style.width = `${percent}%`;
      }
    });

    // Control Anti-Forward Seeking (impide avanzar sobre partes no vistas)
    if (config.preventForwardSeeking) {
      video.addEventListener('seeking', () => {
        // Si el usuario intenta adelantar más de lo ya visto
        if (video.currentTime > maxTimeWatched + 0.5) {
          video.currentTime = maxTimeWatched;
        }
      });
    }

    // Clic en la barra de progreso
    progressWrap.addEventListener('click', (e) => {
      if (!video.duration) return;
      const rect = progressWrap.getBoundingClientRect();
      const clickPos = (e.clientX - rect.left) / rect.width;
      const targetTime = clickPos * video.duration;

      if (config.preventForwardSeeking) {
        if (targetTime <= maxTimeWatched) {
          video.currentTime = targetTime;
        } else {
          // Si intenta saltar más adelante de lo visto, se ubica en el punto máximo permitido
          video.currentTime = maxTimeWatched;
        }
      } else {
        video.currentTime = targetTime;
      }
    });

    // Control de Mute / Volumen
    ctrlMute.addEventListener('click', () => {
      video.muted = !video.muted;
      muteIcon.textContent = video.muted ? '🔇' : '🔊';
    });

    // Control de Pantalla Completa
    ctrlFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });

    // Finalización del video
    video.addEventListener('ended', () => {
      playPauseIcon.textContent = '▶';
      playOverlay.style.display = 'flex';
    });

    // Manejo de error de carga del video
    video.addEventListener('error', () => {
      console.warn('No se pudo cargar el video desde la ruta indicada:', config.videoUrl);
      videoFallback.style.display = 'flex';
      playOverlay.style.display = 'none';
      customControls.style.display = 'none';
    });
  }
});

