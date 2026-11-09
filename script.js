// VSL & Formulario de Calificación — Cirujanos Plásticos SCZ
(function () {
  'use strict';

  var CONFIG = {
    autoRevealSeconds: 0,
    allowTestQueryParam: true,
    // Pega aquí la URL de la aplicación web de Google Apps Script:
    googleSheetWebhookUrl: '',
  };

  var video = document.getElementById('vslVideo');
  var lockedArea = document.getElementById('lockedArea');
  var videoStatus = document.getElementById('videoStatus');
  var statusText = document.getElementById('statusText');
  var form = document.getElementById('qualifyForm');
  var vslThumbnail = document.getElementById('vslThumbnail');
  var videoCard = document.getElementById('videoCard');
  var exitFsBtn = document.getElementById('exitFsBtn');

  var isRevealed = false;
  var ytPlayer = null;
  var playRequested = false;
  var maxWatchedTime = 0;
  var antiScrubInterval = null;

  // --- Desbloquear formulario ---
  function revealLockedArea() {
    if (isRevealed) return;
    isRevealed = true;
    if (lockedArea) {
      lockedArea.classList.remove('hidden');
      lockedArea.classList.add('revealed');
      setTimeout(function () {
        lockedArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
    if (videoStatus && statusText) {
      videoStatus.classList.add('unlocked');
      statusText.textContent = '✓ Formulario desbloqueado';
    }
  }

  // --- Pantalla completa ---
  function enterFs() {
    if (!videoCard) return;
    videoCard.classList.add('vsl-expanded-fullscreen');
    document.body.classList.add('vsl-fs-active');
    try {
      if (videoCard.requestFullscreen && !document.fullscreenElement) {
        videoCard.requestFullscreen().catch(function () {});
      } else if (videoCard.webkitRequestFullscreen && !document.webkitFullscreenElement) {
        videoCard.webkitRequestFullscreen();
      }
    } catch (e) {}
  }

  function exitFs() {
    if (videoCard) videoCard.classList.remove('vsl-expanded-fullscreen');
    document.body.classList.remove('vsl-fs-active');
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () {});
      } else if (document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
      }
    } catch (e) {}
  }

  if (exitFsBtn) {
    exitFsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      exitFs();
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
    });
  }

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && videoCard) {
      videoCard.classList.remove('vsl-expanded-fullscreen');
      document.body.classList.remove('vsl-fs-active');
    }
  });
  document.addEventListener('webkitfullscreenchange', function () {
    if (!document.webkitFullscreenElement && videoCard) {
      videoCard.classList.remove('vsl-expanded-fullscreen');
      document.body.classList.remove('vsl-fs-active');
    }
  });

  // --- Thumbnail play ---
  function triggerPlay() {
    if (vslThumbnail) vslThumbnail.classList.add('is-hidden');
    enterFs();
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
    } else {
      playRequested = true;
    }
  }

  if (vslThumbnail) {
    vslThumbnail.addEventListener('click', triggerPlay);
    vslThumbnail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerPlay(); }
    });
  }

  // --- YouTube IFrame API ---
  function setupYT() {
    try {
      ytPlayer = new YT.Player('vslVideo', {
        events: {
          onReady: function (ev) {
            if (playRequested) { enterFs(); ev.target.playVideo(); }
          },
          onStateChange: function (ev) {
            if (ev.data === 1) { // PLAYING
              if (vslThumbnail) vslThumbnail.classList.add('is-hidden');
              enterFs();
              if (!antiScrubInterval) {
                antiScrubInterval = setInterval(function () {
                  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
                  var t = ytPlayer.getCurrentTime();
                  if (t > maxWatchedTime + 1.5) {
                    ytPlayer.seekTo(maxWatchedTime, true);
                  } else if (t > maxWatchedTime) {
                    maxWatchedTime = t;
                  }
                  if (CONFIG.autoRevealSeconds > 0 && t >= CONFIG.autoRevealSeconds) revealLockedArea();
                }, 250);
              }
            } else if (ev.data === 2) { // PAUSED
              exitFs();
            } else if (ev.data === 0) { // ENDED
              exitFs();
              revealLockedArea();
              if (antiScrubInterval) { clearInterval(antiScrubInterval); antiScrubInterval = null; }
            }
          },
        },
      });
    } catch (e) {
      console.warn('YT API error:', e);
    }
  }

  if (video && video.tagName === 'IFRAME' && video.src.indexOf('youtube.com') !== -1) {
    if (!window.YT) {
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      var first = document.getElementsByTagName('script')[0];
      first.parentNode.insertBefore(tag, first);
    }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      setupYT();
    };
    if (window.YT && window.YT.Player) setupYT();
  }

  // --- Test param ---
  if (CONFIG.allowTestQueryParam) {
    var params = new URLSearchParams(window.location.search);
    if (params.has('reveal') || params.has('test')) revealLockedArea();
  }

  // --- Formulario ---
  if (form) {
    var fields = [
      { id: 'doctorName', err: 'nameError' },
      { id: 'procedures', err: 'procError' },
      { id: 'capacity', err: 'capError' },
      { id: 'budget', err: 'budgetError' },
      { id: 'doctorPhone', err: 'phoneError' },
    ];

    fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (!el) return;
      var g = el.closest('.form-group');
      var clear = function () { if (g) g.classList.remove('has-error'); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hasErr = false, firstBad = null, data = {};

      fields.forEach(function (f) {
        var el = document.getElementById(f.id);
        if (!el) return;
        var val = el.value.trim(), g = el.closest('.form-group');
        if (!val) {
          hasErr = true;
          if (g) g.classList.add('has-error');
          if (!firstBad) firstBad = el;
        } else {
          data[f.id] = val;
          if (g) g.classList.remove('has-error');
        }
      });

      if (hasErr) { if (firstBad) firstBad.focus(); return; }

      var leadPayload = {
        name: data.doctorName || '',
        procedures: data.procedures || '',
        capacity: data.capacity || '',
        budget: data.budget || '',
        phone: data.doctorPhone || '',
        submittedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('vsl_lead', JSON.stringify(leadPayload));
      } catch (err) {}

      var btn = document.getElementById('submitBtn');
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.querySelector('span').textContent = 'Enviando...';
      }

      // Enviar datos a Google Sheets si hay webhook configurado
      if (CONFIG.googleSheetWebhookUrl) {
        try {
          fetch(CONFIG.googleSheetWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadPayload),
          }).catch(function (err) {
            console.warn('Error enviando a Google Sheets:', err);
          });
        } catch (err) {}
      }

      setTimeout(function () { window.location.href = 'gracias.html'; }, 500);
    });
  }
})();
