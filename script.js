// ============================================================
// VSL & CALIFICACIÓN PARA CIRUJANOS PLÁSTICOS
// Lógica de desbloqueo al terminar video y validación de formulario
// ============================================================

(function () {
  'use strict';

  // Configuración
  const CONFIG = {
    // Si se establece en un número mayor a 0 (ej. 240 para 4 min),
    // desbloqueará automáticamente tras esos segundos de reproducción
    // o al terminar el video (lo que ocurra primero).
    autoRevealSeconds: 0,
    // Permite forzar el desbloqueo añadiendo ?reveal=1 en la URL para pruebas
    allowTestQueryParam: true,
  };

  const video = document.getElementById('vslVideo');
  const lockedArea = document.getElementById('lockedArea');
  const videoStatus = document.getElementById('videoStatus');
  const statusText = document.getElementById('statusText');
  const form = document.getElementById('qualifyForm');

  let isRevealed = false;

  // Función para desbloquear la zona de calificación
  function revealLockedArea() {
    if (isRevealed) return;
    isRevealed = true;

    if (lockedArea) {
      lockedArea.classList.remove('hidden');
      lockedArea.classList.add('revealed');

      // Scroll suave hacia el formulario en móvil
      setTimeout(() => {
        lockedArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }

    if (videoStatus && statusText) {
      videoStatus.classList.add('unlocked');
      statusText.textContent = '✓ Video finalizado. Por favor complete su postulación:';
    }
  }

  // 1. Detectar fin del video (HTML5 nativo o YouTube iframe)
  if (video && video.tagName === 'VIDEO') {
    video.addEventListener('ended', () => {
      revealLockedArea();
    });

    // Soporte para tiempo transcurrido si se configura autoRevealSeconds
    if (CONFIG.autoRevealSeconds > 0) {
      video.addEventListener('timeupdate', () => {
        if (video.currentTime >= CONFIG.autoRevealSeconds) {
          revealLockedArea();
        }
      });
    }
  }

  // 1. Manejo de portada / thumbnail VSL y YouTube Player API
  const vslThumbnail = document.getElementById('vslThumbnail');
  const videoCard = document.getElementById('videoCard') || document.querySelector('.video-card');
  const exitFsBtn = document.getElementById('exitFsBtn');

  let ytPlayer = null;
  let playRequested = false;
  let maxWatchedTime = 0;
  let antiScrubInterval = null;

  // Funciones de pantalla completa al reproducir y minimizar al pausar
  function enterVideoFullscreen() {
    if (!videoCard) return;
    videoCard.classList.add('vsl-expanded-fullscreen');
    document.body.classList.add('vsl-fs-active');

    try {
      if (videoCard.requestFullscreen && !document.fullscreenElement) {
        videoCard.requestFullscreen().catch(() => {});
      } else if (videoCard.webkitRequestFullscreen && !document.webkitFullscreenElement) {
        videoCard.webkitRequestFullscreen();
      }
    } catch (err) {
      // Modo CSS expandido ya activo como respaldo garantizado
    }
  }

  function exitVideoFullscreen() {
    if (videoCard) {
      videoCard.classList.remove('vsl-expanded-fullscreen');
    }
    document.body.classList.remove('vsl-fs-active');

    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      // Ignorar errores al salir de fullscreen
    }
  }

  if (exitFsBtn) {
    exitFsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      exitVideoFullscreen();
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
      }
    });
  }

  // Sincronizar salida nativa (ej. presionar tecla Esc en teclado)
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && videoCard) {
      videoCard.classList.remove('vsl-expanded-fullscreen');
      document.body.classList.remove('vsl-fs-active');
    }
  });

  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && videoCard) {
      videoCard.classList.remove('vsl-expanded-fullscreen');
      document.body.classList.remove('vsl-fs-active');
    }
  });

  function triggerPlayFromThumbnail() {
    if (vslThumbnail) {
      vslThumbnail.classList.add('is-hidden');
    }
    enterVideoFullscreen();
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
    } else {
      playRequested = true;
    }
  }

  if (vslThumbnail) {
    vslThumbnail.addEventListener('click', triggerPlayFromThumbnail);
    vslThumbnail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPlayFromThumbnail();
      }
    });
  }

  // Integración con YouTube IFrame Player API para control de VSL y anti-adelanto
  function setupYouTubeTracker() {
    try {
      ytPlayer = new YT.Player('vslVideo', {
        events: {
          onReady: function (event) {
            if (playRequested) {
              enterVideoFullscreen();
              event.target.playVideo();
            }
          },
          onStateChange: function (event) {
            // YT.PlayerState.PLAYING === 1 (Se agranda a pantalla completa)
            if (event.data === 1) {
              if (vslThumbnail) {
                vslThumbnail.classList.add('is-hidden');
              }
              enterVideoFullscreen();

              // Anti-adelanto estricto: evita que se pueda saltar hacia adelante
              if (!antiScrubInterval) {
                antiScrubInterval = setInterval(() => {
                  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
                  const currentTime = ytPlayer.getCurrentTime();

                  // Si el usuario intentó saltar más de 1.5s de lo que ha visto:
                  if (currentTime > maxWatchedTime + 1.5) {
                    ytPlayer.seekTo(maxWatchedTime, true);
                  } else if (currentTime > maxWatchedTime) {
                    maxWatchedTime = currentTime;
                  }

                  // Auto-revelar si se configuró un segundo específico
                  if (CONFIG.autoRevealSeconds > 0 && currentTime >= CONFIG.autoRevealSeconds) {
                    revealLockedArea();
                  }
                }, 250);
              }
            } else if (event.data === 2) {
              // YT.PlayerState.PAUSED === 2 (Se achica / sale de pantalla completa)
              exitVideoFullscreen();
            } else if (event.data === 0) {
              // YT.PlayerState.ENDED === 0 (Termina: sale de pantalla completa y desbloquea)
              exitVideoFullscreen();
              revealLockedArea();
              if (antiScrubInterval) {
                clearInterval(antiScrubInterval);
                antiScrubInterval = null;
              }
            }
          },
        },
      });
    } catch (e) {
      console.warn('YouTube IFrame API no pudo inicializar el reproductor:', e);
    }
  }

  if (video && video.tagName === 'IFRAME' && video.src.includes('youtube.com')) {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const previousYTReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousYTReady === 'function') previousYTReady();
      setupYouTubeTracker();
    };

    if (window.YT && window.YT.Player) {
      setupYouTubeTracker();
    }
  }

  // 2. Parámetro de prueba rápida en URL (?reveal=1 o ?test=1)
  if (CONFIG.allowTestQueryParam) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reveal') || urlParams.has('test')) {
      revealLockedArea();
    }
  }

  // 3. Manejo y validación del formulario de calificación
  if (form) {
    const inputs = [
      { id: 'doctorName', errorId: 'nameError' },
      { id: 'procedures', errorId: 'procError' },
      { id: 'capacity', errorId: 'capError' },
      { id: 'budget', errorId: 'budgetError' },
      { id: 'doctorPhone', errorId: 'phoneError' },
    ];

    // Limpiar errores mientras el usuario escribe o selecciona
    inputs.forEach((item) => {
      const el = document.getElementById(item.id);
      if (!el) return;

      const group = el.closest('.form-group');
      const clearError = () => {
        if (group) group.classList.remove('has-error');
      };

      el.addEventListener('input', clearError);
      el.addEventListener('change', clearError);
    });

    // Envío del formulario
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let hasErrors = false;
      let firstInvalidEl = null;

      const leadData = {};

      inputs.forEach((item) => {
        const el = document.getElementById(item.id);
        if (!el) return;

        const val = el.value.trim();
        const group = el.closest('.form-group');

        if (!val) {
          hasErrors = true;
          if (group) group.classList.add('has-error');
          if (!firstInvalidEl) firstInvalidEl = el;
        } else {
          leadData[item.id] = val;
          if (group) group.classList.remove('has-error');
        }
      });

      if (hasErrors) {
        if (firstInvalidEl) firstInvalidEl.focus();
        return;
      }

      // Guardar datos del lead localmente para la página de gracias y WhatsApp
      try {
        localStorage.setItem(
          'vsl_lead',
          JSON.stringify({
            name: leadData.doctorName || '',
            procedures: leadData.procedures || '',
            capacity: leadData.capacity || '',
            budget: leadData.budget || '',
            phone: leadData.doctorPhone || '',
            submittedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error('Error guardando lead en localStorage:', err);
      }

      // Deshabilitar botón durante la redirección
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.querySelector('span').textContent = 'Procesando postulación...';
      }

      // Redirigir a la página de gracias
      setTimeout(() => {
        window.location.href = 'gracias.html';
      }, 400);
    });
  }
})();
