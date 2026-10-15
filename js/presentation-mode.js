/**
 * PROYECTO: Machine Learning · Componente Formativo SENA ADSO | GAES 6
 * ARCHIVO: js/presentation-mode.js
 * DESCRIPCIÓN: Modo presentación para exponer la página como diapositivas.
 *              Cada módulo es una diapositiva; se navega con el teclado y hay
 *              cronómetro, puntero láser y pantalla completa.
 *
 * ATAJOS:  P entrar/salir · → / Espacio / AvPág siguiente · ← / RePág anterior
 *          Inicio / Fin primera y última · L láser · F pantalla completa · Esc salir
 */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const slides = Array.from(document.querySelectorAll('#portada, section.edu-section'));
  const toggles = document.querySelectorAll('[data-present-toggle]');
  if (!slides.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  const slideTitles = slides.map(slide => {
    if (slide.id === 'portada') return 'Portada';
    const title = slide.querySelector('.section-title');
    return title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
  });

  let active = false;
  let laserOn = false;
  let timerId = null;
  let timerStart = 0;
  let pendingIndex = null;
  let pendingUntil = 0;
  let scrollTicking = false;

  /* ---------- Construcción de la interfaz (solo existe para este modo) ---------- */

  const hud = document.createElement('div');
  hud.className = 'present-hud';
  hud.hidden = true;
  hud.setAttribute('role', 'toolbar');
  hud.setAttribute('aria-label', 'Controles del modo presentación');
  hud.innerHTML = `
    <button type="button" class="hud-btn" data-action="prev" aria-label="Diapositiva anterior">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="hud-info">
      <span class="hud-counter" data-ref="counter"></span>
      <span class="hud-title" data-ref="title"></span>
    </div>
    <div class="hud-dots" data-ref="dots"></div>
    <span class="hud-timer" data-ref="timer" title="Tiempo de exposición">00:00</span>
    <button type="button" class="hud-btn hud-text" data-action="laser" aria-pressed="false" title="Puntero láser (L)">Láser</button>
    <button type="button" class="hud-btn" data-action="fullscreen" aria-label="Pantalla completa" title="Pantalla completa (F)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
    </button>
    <button type="button" class="hud-btn" data-action="next" aria-label="Diapositiva siguiente">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    <button type="button" class="hud-btn hud-text hud-exit" data-action="exit">Salir <kbd>Esc</kbd></button>`;
  document.body.appendChild(hud);

  const refs = {
    counter: hud.querySelector('[data-ref="counter"]'),
    title: hud.querySelector('[data-ref="title"]'),
    dots: hud.querySelector('[data-ref="dots"]'),
    timer: hud.querySelector('[data-ref="timer"]'),
    laserBtn: hud.querySelector('[data-action="laser"]')
  };

  // Un punto por diapositiva para saltar directo a cualquier módulo
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hud-dot';
    dot.setAttribute('aria-label', `Ir a: ${slideTitles[index]}`);
    dot.addEventListener('click', () => goTo(index));
    refs.dots.appendChild(dot);
  });

  const laserDot = document.createElement('div');
  laserDot.className = 'laser-dot';
  laserDot.hidden = true;
  laserDot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(laserDot);

  const toast = document.createElement('div');
  toast.className = 'present-toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);

  /* ---------- Navegación entre diapositivas ---------- */

  // La diapositiva actual es la última cuyo borde superior ya pasó el 35% de la pantalla
  function getCurrentIndex() {
    const marker = window.innerHeight * 0.35;
    let index = 0;
    slides.forEach((slide, i) => {
      if (slide.getBoundingClientRect().top <= marker) index = i;
    });
    return index;
  }

  // Mientras dura un desplazamiento suave, se usa el destino ya pedido (evita saltos dobles)
  function getBaseIndex() {
    return performance.now() < pendingUntil ? pendingIndex : null;
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    pendingIndex = target;
    pendingUntil = performance.now() + 700;
    slides[target].scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }

  // Si la diapositiva es más alta que la pantalla, primero se recorre; luego se pasa a la siguiente
  function next() {
    const pending = getBaseIndex();
    if (pending !== null) {
      goTo(pending + 1);
      return;
    }
    const index = getCurrentIndex();
    const rect = slides[index].getBoundingClientRect();
    if (rect.bottom > window.innerHeight + 40) {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: scrollBehavior });
    } else {
      goTo(index + 1);
    }
  }

  function prev() {
    const pending = getBaseIndex();
    if (pending !== null) {
      goTo(pending - 1);
      return;
    }
    const index = getCurrentIndex();
    const rect = slides[index].getBoundingClientRect();
    if (rect.top < -40) {
      // Estamos a mitad de una diapositiva larga: se sube hacia su inicio
      if (-rect.top > window.innerHeight * 0.8) {
        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: scrollBehavior });
      } else {
        goTo(index);
      }
    } else {
      goTo(index - 1);
    }
  }

  function updateHud() {
    const index = getCurrentIndex();
    slides.forEach((slide, i) => slide.classList.toggle('is-current', i === index));
    refs.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    refs.title.textContent = slideTitles[index];
    refs.dots.querySelectorAll('.hud-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', i === index ? 'step' : 'false');
    });
  }

  function onScroll() {
    if (!active || scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateHud();
      scrollTicking = false;
    });
  }

  /* ---------- Cronómetro, toast, láser y pantalla completa ---------- */

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function startTimer() {
    timerStart = Date.now();
    refs.timer.textContent = '00:00';
    timerId = setInterval(() => {
      refs.timer.textContent = formatTime(Date.now() - timerStart);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  let toastTimeout = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  function setLaser(on) {
    laserOn = on;
    root.classList.toggle('laser-on', on);
    laserDot.hidden = !on;
    refs.laserBtn.setAttribute('aria-pressed', String(on));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (root.requestFullscreen) {
      root.requestFullscreen().catch(() => showToast('El navegador no permitió la pantalla completa.'));
    }
  }

  document.addEventListener('pointermove', (event) => {
    if (!laserOn) return;
    laserDot.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }, { passive: true });

  // Con el láser activo, cada clic deja una onda para señalar algo al público
  document.addEventListener('pointerdown', (event) => {
    if (!laserOn || event.target.closest('.present-hud')) return;
    const ripple = document.createElement('span');
    ripple.className = 'laser-ripple';
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    ripple.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  /* ---------- Entrar y salir del modo ---------- */

  function setTogglesPressed(pressed) {
    toggles.forEach(btn => btn.setAttribute('aria-pressed', String(pressed)));
  }

  function enter() {
    const index = getCurrentIndex();
    active = true;
    root.classList.add('presenting');
    hud.hidden = false;
    setTogglesPressed(true);

    // Se espera un fotograma a que cambie el diseño antes de ubicar la diapositiva
    requestAnimationFrame(() => {
      slides[index].scrollIntoView({ behavior: 'instant', block: 'start' });
      updateHud();
    });

    startTimer();
    showToast('Modo presentación activo. Usa las flechas para navegar, L para el láser, F para pantalla completa y Esc para salir.');
  }

  function exit() {
    const index = getCurrentIndex();
    active = false;
    root.classList.remove('presenting');
    hud.hidden = true;
    setTogglesPressed(false);
    setLaser(false);
    stopTimer();
    slides.forEach(slide => slide.classList.remove('is-current'));
    toast.classList.remove('show');

    if (document.fullscreenElement) document.exitFullscreen();

    requestAnimationFrame(() => {
      slides[index].scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }

  toggles.forEach(btn => {
    btn.addEventListener('click', () => (active ? exit() : enter()));
  });

  hud.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const actions = {
      prev,
      next,
      exit,
      laser: () => setLaser(!laserOn),
      fullscreen: toggleFullscreen
    };
    actions[button.dataset.action]();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // No robar teclas mientras se escribe o se mueve un control deslizante
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

    const key = event.key;

    if (!active) {
      if (key === 'p' || key === 'P') {
        event.preventDefault();
        enter();
      }
      return;
    }

    switch (key) {
      case ' ':
        if (event.target.closest('button, a, label')) return;
        event.preventDefault();
        next();
        break;
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        prev();
        break;
      case 'Home':
        event.preventDefault();
        goTo(0);
        break;
      case 'End':
        event.preventDefault();
        goTo(slides.length - 1);
        break;
      case 'l':
      case 'L':
        setLaser(!laserOn);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'p':
      case 'P':
      case 'Escape':
        exit();
        break;
    }
  });
});
