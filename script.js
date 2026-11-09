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

  // Integración con YouTube IFrame Player API para desbloquear al finalizar
  function setupYouTubeTracker() {
    let timerCheck = null;

    try {
      new YT.Player('vslVideo', {
        events: {
          onStateChange: function (event) {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              revealLockedArea();
              if (timerCheck) clearInterval(timerCheck);
            } else if (event.data === 1 && CONFIG.autoRevealSeconds > 0) {
              // Video en reproducción: verificar si supera autoRevealSeconds
              timerCheck = setInterval(() => {
                if (event.target && typeof event.target.getCurrentTime === 'function') {
                  if (event.target.getCurrentTime() >= CONFIG.autoRevealSeconds) {
                    revealLockedArea();
                    clearInterval(timerCheck);
                  }
                }
              }, 1000);
            } else if (event.data === 2) {
              if (timerCheck) clearInterval(timerCheck);
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
