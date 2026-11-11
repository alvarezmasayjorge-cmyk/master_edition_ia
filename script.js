// VSL & Formulario de Calificación — Cirujanos Plásticos SCZ
(function () {
  'use strict';

  var CONFIG = {
    autoRevealSeconds: 0,
    allowTestQueryParam: true,
    googleSheetWebhookUrl: 'https://script.google.com/macros/s/AKfycbwGlRii_fqk2aJ4WzkrjuSPu2UPpl0039DZhrzWjpS-9MiZ0urX6aIYdly2YM0DFxcS/exec',
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
  var playerLoading = false;
  var playerLoadTimeout = null;
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
      statusText.textContent = 'Ya puedes consultar disponibilidad';
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
      playRequested = false;
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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') exitFs();
  });

  // --- Thumbnail play ---
  function triggerPlay() {
    if (vslThumbnail) vslThumbnail.classList.add('is-hidden');
    enterFs();
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
    } else {
      playRequested = true;
      loadYT();
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
            clearTimeout(playerLoadTimeout);
            playerLoading = false;
            if (playRequested) { playRequested = false; ev.target.playVideo(); }
          },
          onError: playerLoadFailed,
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
      playerLoadFailed();
      console.warn('YT API error:', e);
    }
  }

  // Download the player only after an explicit play request.
  function playerLoadFailed() {
    clearTimeout(playerLoadTimeout);
    playerLoading = false;
    playRequested = false;
    exitFs();
    if (vslThumbnail) {
      vslThumbnail.classList.remove('is-hidden');
      vslThumbnail.querySelector('.thumbnail-heading').textContent = 'Volver a intentar';
    }
    if (statusText) statusText.textContent = 'No pudimos cargar el video. Inténtalo de nuevo.';
  }

  function loadYT() {
    if (!video || playerLoading) return;
    playerLoading = true;
    playerLoadTimeout = setTimeout(playerLoadFailed, 20000);
    if (!video.getAttribute('src')) video.src = video.getAttribute('data-src');
    if (window.YT && window.YT.Player) {
      setupYT();
      return;
    }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      setupYT();
    };
    var existing = document.getElementById('youtube-api');
    if (!existing) {
      var tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = function () { tag.remove(); playerLoadFailed(); };
      document.head.appendChild(tag);
    }
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
      var clear = function () { if (g) g.classList.remove('has-error'); el.removeAttribute('aria-invalid'); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (document.getElementById('submitBtn').disabled) return;
      var hasErr = false, firstBad = null, data = {};

      fields.forEach(function (f) {
        var el = document.getElementById(f.id);
        if (!el) return;
        var val = el.value.trim(), g = el.closest('.form-group');
        if (!val || (f.id === 'doctorPhone' && !/^[+\d\s().-]+$/.test(val)) || (f.id === 'doctorPhone' && !/^\d{8,15}$/.test(val.replace(/\D/g, '')))) {
          hasErr = true;
          if (g) g.classList.add('has-error');
          el.setAttribute('aria-invalid', 'true');
          if (!firstBad) firstBad = el;
        } else {
          data[f.id] = val;
          if (g) g.classList.remove('has-error');
          el.removeAttribute('aria-invalid');
        }
      });

      if (hasErr) { if (firstBad) firstBad.focus(); return; }

      var eventId = 'lead_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

      var leadPayload = {
        name: data.doctorName || '',
        procedures: data.procedures || '',
        capacity: data.capacity || '',
        budget: data.budget || '',
        phone: data.doctorPhone || '',
        submittedAt: new Date().toISOString(),
        eventId: eventId,
        sourceUrl: window.location.href,
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

      // Evento Lead de Meta Pixel con deduplicación (eventID)
      if (typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'Lead', {}, { eventID: eventId });
        } catch (e) {}
      }

      // Enviar datos a Google Sheets y Meta CAPI
      if (CONFIG.googleSheetWebhookUrl) {
        try {
          fetch(CONFIG.googleSheetWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadPayload),
          }).catch(function (err) {
            console.warn('Error enviando datos:', err);
          });
        } catch (err) {}
      }

      setTimeout(function () { window.location.href = 'gracias.html'; }, 500);
    });
  }
})();

