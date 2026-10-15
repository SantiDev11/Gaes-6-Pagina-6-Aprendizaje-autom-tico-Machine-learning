/**
 * PROYECTO: Machine Learning · Componente Formativo SENA ADSO | GAES 6
 * ARCHIVO: js/main.js
 * DESCRIPCIÓN: Interactividad modular: barra de lectura, menú dinámico, filtros,
 *              buscador en tiempo real, acordeón accesible, quiz formativo con
 *              resultado final, secuencia de entrada del hero y pipeline animado.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Respeta a quienes configuran su sistema para reducir el movimiento
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==================================================================
     1. BARRA DE PROGRESO DE LECTURA AL HACER SCROLL
     ================================================================== */
  const progressBar = document.getElementById('readingProgressBar');
  let progressTicking = false;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    progressTicking = false;
  }

  // requestAnimationFrame agrupa los eventos de scroll: máximo un cálculo por fotograma
  window.addEventListener('scroll', () => {
    if (!progressTicking) {
      progressTicking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });

  /* ==================================================================
     2. MENÚ MÓVIL TOGGLE
     ================================================================== */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  if (mobileMenuBtn && mainNav) {
    const closeMenu = () => {
      mainNav.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    };

    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Cerrar menú al hacer clic en un enlace (móviles)
    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Cerrar menú con la tecla Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNav.classList.contains('open')) {
        closeMenu();
        mobileMenuBtn.focus();
      }
    });
  }

  /* ==================================================================
     3. SCROLLSPY CON INTERSECTION OBSERVER PARA NAVEGACIÓN ACTIVA
        (menú superior + índice lateral)
     ================================================================== */
  const sections = document.querySelectorAll('section.edu-section, article.hero-banner');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"], .toc-item a');

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  /* ==================================================================
     4. FILTROS Y BUSCADOR DE ALGORITMOS
     ================================================================== */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const algoCards = document.querySelectorAll('.algorithm-card');
  const searchInput = document.getElementById('algoSearchInput');
  const noResultsMsg = document.getElementById('noResultsMsg');

  let currentFilter = 'all';

  // Un nombre único por tarjeta permite que la View Transitions API anime su recorrido
  algoCards.forEach((card, index) => {
    card.style.viewTransitionName = `algo-card-${index}`;
  });

  function applyFilterAndSearch() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    algoCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const title = card.querySelector('h4').textContent.toLowerCase();
      const desc = card.querySelector('p').textContent.toLowerCase();

      const matchesCategory = (currentFilter === 'all') || (category === currentFilter);
      const matchesQuery = (query === '') || (title.includes(query) || desc.includes(query));

      if (matchesCategory && matchesQuery) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResultsMsg) {
      noResultsMsg.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
  }

  // Si el navegador soporta View Transitions, las tarjetas se reacomodan con animación
  function runWithTransition(update) {
    if (!document.startViewTransition || prefersReducedMotion) {
      update();
      return;
    }
    document.startViewTransition(update);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      currentFilter = btn.getAttribute('data-filter');
      runWithTransition(applyFilterAndSearch);
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilterAndSearch);
  }

  /* ==================================================================
     5. ACORDEÓN INTERACTIVO DE MÉTRICAS DE EVALUACIÓN
     ================================================================== */
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Cierre sincronizado de otros elementos para efecto acordeón limpio
      accordionItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ==================================================================
     6. MÓDULO DE AUTOEVALUACIÓN (QUIZ INTERACTIVO CON FEEDBACK INMEDIATO)
     ================================================================== */
  const quizQuestions = document.querySelectorAll('.quiz-question-card');
  const scoreDisplay = document.getElementById('quizScoreDisplay');
  const answeredDisplay = document.getElementById('quizAnsweredCount');
  const btnReset = document.getElementById('btnResetQuiz');

  const quizResult = document.getElementById('quizResult');
  const quizRingFill = document.getElementById('quizRingFill');
  const quizResultScore = document.getElementById('quizResultScore');
  const quizResultTitle = document.getElementById('quizResultTitle');
  const quizResultMsg = document.getElementById('quizResultMsg');
  const RING_LENGTH = 2 * Math.PI * 52; // circunferencia del anillo (r = 52 en el SVG)

  // Retroalimentaciones formativas oficiales SENA
  const explanations = {
    q1: "¡Correcto! El SENA define Machine Learning como la subdisciplina de la IA que permite aprender a partir de datos e identificar patrones sin reglas fijas explícitas.",
    q2: "¡Correcto! La Generalización es la capacidad que asegura que el modelo funcione adecuadamente con datos nuevos y distintos al entrenamiento.",
    q3: "¡Correcto! DBSCAN se basa en densidad de puntos, permitiendo descubrir formas arbitrarias y aislar outliers/ruido.",
    q4: "¡Correcto! El F1-Score es la media armónica entre Precisión y Recall, clave frente al desbalance de clases donde el Accuracy puede resultar engañoso.",
    q5: "¡Correcto! La Validación Estratificada garantiza que cada fold o división mantenga la misma proporción de clases del conjunto original."
  };

  const errorExplanations = {
    q1: "Incorrecto. Machine Learning no utiliza reglas if-else fijas; aprende directamente de los datos identificando patrones sin programación explícita.",
    q2: "Incorrecto. La característica correcta es Generalización. La eficiencia atañe a la velocidad de cómputo y la escalabilidad al tamaño del problema.",
    q3: "Incorrecto. DBSCAN es el algoritmo por densidad idóneo para formas arbitrarias y ruido. K-means asume grupos esféricos basados en centroides.",
    q4: "Incorrecto. El F1-Score equilibra Precisión y Recall, siendo la métrica idónea para clases desbalanceadas.",
    q5: "Incorrecto. La Validación Estratificada preserva la proporción representativa de cada clase en cada partición para evitar sesgos."
  };

  // Mensaje final según la cantidad de aciertos
  function getQuizVerdict(correctCount, total) {
    if (correctCount === total) {
      return { level: 'high', title: '¡Dominio total!', message: 'Respondiste todo bien. Ya manejas los conceptos clave del componente.' };
    }
    if (correctCount >= total - 1) {
      return { level: 'high', title: '¡Muy bien!', message: 'Te faltó una. Revisa la retroalimentación de la pregunta que fallaste.' };
    }
    if (correctCount >= Math.ceil(total / 2)) {
      return { level: 'mid', title: 'Vas por buen camino', message: 'Repasa los módulos de las preguntas en rojo y vuelve a intentarlo.' };
    }
    return { level: 'low', title: 'Toca repasar', message: 'Vuelve a los módulos 1 a 5 y reinicia la autoevaluación cuando estés listo.' };
  }

  function showQuizResult(correctCount) {
    if (!quizResult) return;
    const total = quizQuestions.length;
    const score = (correctCount / total) * 5.0;
    const verdict = getQuizVerdict(correctCount, total);

    quizResult.hidden = false;
    quizResult.dataset.level = verdict.level;
    quizResultScore.textContent = score.toFixed(1);
    quizResultTitle.textContent = verdict.title;
    quizResultMsg.textContent = verdict.message;

    // Arranca vacío y en el siguiente fotograma se llena: así la transición CSS se ve
    quizRingFill.style.strokeDashoffset = RING_LENGTH;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        quizRingFill.style.strokeDashoffset = RING_LENGTH * (1 - score / 5);
      });
    });

    quizResult.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });

    if (correctCount >= total - 1) {
      launchConfetti();
    }
  }

  function updateQuizStatus() {
    let correctCount = 0;
    let answeredCount = 0;

    quizQuestions.forEach(qCard => {
      const selected = qCard.querySelector('input[type="radio"]:checked');
      if (selected) {
        answeredCount++;
        const label = selected.closest('.quiz-option-label');
        if (label && label.getAttribute('data-correct') === 'true') {
          correctCount++;
        }
      }
    });

    if (answeredDisplay) {
      answeredDisplay.textContent = answeredCount;
    }

    if (scoreDisplay) {
      const finalScore = ((correctCount / quizQuestions.length) * 5.0).toFixed(1);
      scoreDisplay.textContent = finalScore;
    }

    if (answeredCount === quizQuestions.length) {
      showQuizResult(correctCount);
    }
  }

  quizQuestions.forEach(qCard => {
    const qIndex = qCard.getAttribute('data-qindex');
    const qKey = `q${qIndex}`;
    const feedbackEl = document.getElementById(`feedback-${qKey}`);
    const radioInputs = qCard.querySelectorAll('input[type="radio"]');

    radioInputs.forEach(radio => {
      radio.addEventListener('change', () => {
        const label = radio.closest('.quiz-option-label');
        const isCorrect = label.getAttribute('data-correct') === 'true';

        // Deshabilitar las demás opciones de esta pregunta para evitar trampas
        radioInputs.forEach(r => {
          r.disabled = true;
          const parentLabel = r.closest('.quiz-option-label');
          if (parentLabel.getAttribute('data-correct') === 'true') {
            parentLabel.classList.add('is-correct');
          } else if (r.checked) {
            parentLabel.classList.add('is-incorrect');
          }
        });

        // Mostrar feedback explicativo (con nodos DOM en vez de innerHTML)
        if (feedbackEl) {
          feedbackEl.className = `quiz-feedback show ${isCorrect ? 'success' : 'error'}`;
          const heading = document.createElement('strong');
          heading.textContent = isCorrect ? '✓ Acierto: ' : '✗ Atención: ';
          const message = isCorrect ? explanations[qKey] : errorExplanations[qKey];
          feedbackEl.replaceChildren(heading, message);
        }

        updateQuizStatus();
      });
    });
  });

  // Botón para reiniciar Quiz
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      quizQuestions.forEach(qCard => {
        const qIndex = qCard.getAttribute('data-qindex');
        const feedbackEl = document.getElementById(`feedback-q${qIndex}`);

        if (feedbackEl) {
          feedbackEl.className = 'quiz-feedback';
          feedbackEl.textContent = '';
        }

        const radioInputs = qCard.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(r => {
          r.checked = false;
          r.disabled = false;
          const parentLabel = r.closest('.quiz-option-label');
          parentLabel.classList.remove('is-correct', 'is-incorrect');
        });
      });

      if (quizResult) {
        quizResult.hidden = true;
      }

      updateQuizStatus();
    });
  }

  // Confeti en canvas: dos "cañones" desde las esquinas inferiores, sin librerías
  function launchConfetti() {
    if (prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#39A900', '#9AE6B4', '#00324D', '#0284C7', '#FBBF24', '#7C3AED'];
    const DURATION = 3200;

    const pieces = Array.from({ length: 170 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? 0 : width,
        y: height,
        vx: (fromLeft ? 1 : -1) * (Math.random() * 11 + 5),
        vy: -(Math.random() * 13 + 13),
        size: Math.random() * 7 + 5,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });

    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);

      pieces.forEach(p => {
        p.vy += 0.4;        // gravedad
        p.vx *= 0.985;      // resistencia del aire
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (elapsed < DURATION) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(frame);
  }

  /* ==================================================================
     7. SECUENCIA DE ENTRADA DEL HERO
        (título que se "decodifica" + contadores que suben)
     ================================================================== */
  const scrambleEl = document.querySelector('[data-scramble]');
  const counters = document.querySelectorAll('[data-count]');

  // Cada letra pasa por símbolos al azar hasta "resolverse", como datos que se procesan
  function scrambleText(el) {
    const finalText = el.textContent;
    const glyphs = '01<>{}[]/#=+*ABCDEFGHKMNPRSTXZ';
    const DURATION = 1400;
    const start = performance.now();

    el.style.minWidth = `${el.offsetWidth}px`;

    function frame(now) {
      const progress = Math.min((now - start) / DURATION, 1);
      const revealed = Math.floor(progress * finalText.length);
      let output = '';

      for (let i = 0; i < finalText.length; i++) {
        const char = finalText[i];
        output += (i < revealed || char === ' ')
          ? char
          : glyphs[Math.floor(Math.random() * glyphs.length)];
      }

      el.textContent = output;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.style.minWidth = '';
      }
    }

    requestAnimationFrame(frame);
  }

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    const DURATION = 1600;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic: rápido al inicio, suave al final
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(frame);
    }

    el.textContent = '0';
    requestAnimationFrame(frame);
  }

  if (!prefersReducedMotion) {
    if (scrambleEl) {
      scrambleText(scrambleEl);
    }

    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  /* ==================================================================
     8. PIPELINE ANIMADO: EL DATO RECORRE LAS 5 ETAPAS EN ORDEN
     ================================================================== */
  const pipeline = document.querySelector('.pipeline-wrapper');

  if (pipeline) {
    const steps = pipeline.querySelectorAll('.pipeline-step');
    const STEP_DELAY = 450;

    if (prefersReducedMotion) {
      pipeline.classList.add('is-running');
      steps.forEach(step => step.classList.add('is-lit'));
    } else {
      pipeline.classList.add('is-armed');

      const pipelineObserver = new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        pipeline.classList.add('is-running');
        steps.forEach((step, index) => {
          setTimeout(() => step.classList.add('is-lit'), 300 + index * STEP_DELAY);
        });
      }, { threshold: 0.45 });

      pipelineObserver.observe(pipeline);
    }
  }
});
