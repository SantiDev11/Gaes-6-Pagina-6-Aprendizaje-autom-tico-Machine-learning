/**
 * PROYECTO: Machine Learning · Componente Formativo SENA ADSO | GAES 6
 * ARCHIVO: js/kmeans-demo.js
 * DESCRIPCIÓN: Laboratorio de K-means. Separa las dos fases del algoritmo
 *              (asignar y mover centroides) para verlas una por una, y dibuja
 *              el recorrido de cada centroide hasta que converge.
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('kmeansCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const kInput = document.getElementById('kmK');
  const kOutput = document.getElementById('kmKValue');
  const btnStep = document.getElementById('kmStep');
  const btnRun = document.getElementById('kmRun');
  const btnReset = document.getElementById('kmReset');
  const btnNewData = document.getElementById('kmNewData');
  const iterEl = document.getElementById('kmIter');
  const inertiaEl = document.getElementById('kmInertia');
  const phaseEl = document.getElementById('kmPhase');

  const CLUSTER_COLORS = ['#39A900', '#0284C7', '#7C3AED', '#D97706', '#DB2777', '#0D9488'];
  const UNASSIGNED_COLOR = '#94A3B8';
  const STEP_INTERVAL = 700;

  // Coordenadas normalizadas (0 a 1): el dibujo se adapta a cualquier tamaño de lienzo
  const state = {
    points: [],       // { x, y, cluster }
    centroids: [],    // { x, y, drawX, drawY, trail: [{ x, y }] }
    k: Number(kInput.value),
    iteration: 0,
    phase: 'assign',  // 'assign' = toca asignar puntos | 'update' = toca mover centroides
    converged: false
  };

  let width = 0;
  let height = 0;
  let runTimer = null;
  let frameId = null;

  /* ---------- Datos ---------- */

  // Box-Muller: convierte dos números uniformes en uno con distribución normal
  function gaussian() {
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function generateData() {
    const blobs = 3 + Math.floor(Math.random() * 3);
    state.points = [];

    for (let b = 0; b < blobs; b++) {
      const cx = 0.15 + Math.random() * 0.7;
      const cy = 0.15 + Math.random() * 0.7;
      const spread = 0.05 + Math.random() * 0.04;
      const amount = 22 + Math.floor(Math.random() * 18);

      for (let i = 0; i < amount; i++) {
        state.points.push({
          x: clamp(cx + gaussian() * spread, 0.02, 0.98),
          y: clamp(cy + gaussian() * spread, 0.03, 0.97),
          cluster: -1
        });
      }
    }
  }

  /* ---------- Algoritmo ---------- */

  function squaredDistance(a, b) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  }

  // Inicialización de Forgy: K puntos al azar del dataset se vuelven centroides
  function initCentroids() {
    stopRun();
    const shuffled = [...state.points].sort(() => Math.random() - 0.5);
    state.centroids = shuffled.slice(0, state.k).map(p => ({
      x: p.x, y: p.y, drawX: p.x, drawY: p.y, trail: [{ x: p.x, y: p.y }]
    }));
    state.points.forEach(p => { p.cluster = -1; });
    state.iteration = 0;
    state.phase = 'assign';
    state.converged = false;
    setPhaseText('Los centroides empiezan en puntos al azar. Pulsa «Siguiente paso» para asignar los puntos.');
    updateUI();
    requestRender();
  }

  // Fase 1: cada punto toma el color del centroide más cercano
  function assignPoints() {
    let changed = false;
    state.points.forEach(point => {
      let best = 0;
      state.centroids.forEach((centroid, i) => {
        if (squaredDistance(point, centroid) < squaredDistance(point, state.centroids[best])) best = i;
      });
      if (point.cluster !== best) {
        point.cluster = best;
        changed = true;
      }
    });
    return changed;
  }

  // Fase 2: cada centroide se mueve al promedio de sus puntos
  function moveCentroids() {
    state.centroids.forEach((centroid, i) => {
      const members = state.points.filter(p => p.cluster === i);
      if (!members.length) return; // un centroide sin puntos se queda quieto
      centroid.x = members.reduce((sum, p) => sum + p.x, 0) / members.length;
      centroid.y = members.reduce((sum, p) => sum + p.y, 0) / members.length;
      centroid.trail.push({ x: centroid.x, y: centroid.y });
    });
  }

  // Inercia: suma de distancias al cuadrado de cada punto a su centroide (menor = grupos más compactos)
  function computeInertia() {
    const assigned = state.points.filter(p => p.cluster >= 0);
    if (!assigned.length) return null;
    return assigned.reduce((sum, p) => sum + squaredDistance(p, state.centroids[p.cluster]), 0) * 100;
  }

  function step() {
    if (state.converged) return;

    if (state.phase === 'assign') {
      const changed = assignPoints();
      if (!changed && state.iteration > 0) {
        state.converged = true;
        stopRun();
        setPhaseText(`Ningún punto cambió de grupo: el algoritmo convergió en ${state.iteration} iteraciones.`);
      } else {
        state.phase = 'update';
        setPhaseText('Asignar: cada punto tomó el color de su centroide más cercano.');
      }
    } else {
      moveCentroids();
      state.iteration++;
      state.phase = 'assign';
      setPhaseText('Mover: cada centroide saltó al promedio de sus puntos. La línea punteada muestra su recorrido.');
    }

    updateUI();
    requestRender();
  }

  /* ---------- Ejecución automática ---------- */

  function startRun() {
    if (state.converged) initCentroids();
    btnRun.textContent = 'Pausar';
    btnRun.setAttribute('aria-pressed', 'true');
    step();
    runTimer = setInterval(step, STEP_INTERVAL);
  }

  function stopRun() {
    clearInterval(runTimer);
    runTimer = null;
    btnRun.textContent = 'Ejecutar hasta converger';
    btnRun.setAttribute('aria-pressed', 'false');
  }

  /* ---------- Interfaz ---------- */

  function setPhaseText(text) {
    phaseEl.textContent = text;
  }

  function updateUI() {
    iterEl.textContent = state.iteration;
    const inertia = computeInertia();
    inertiaEl.textContent = inertia === null ? '—' : inertia.toFixed(2);
    iterEl.classList.toggle('is-success', state.converged);
    btnStep.disabled = state.converged;
  }

  /* ---------- Dibujo ---------- */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  // Los centroides se deslizan hacia su nueva posición en lugar de saltar
  function animateCentroids() {
    let moving = false;
    state.centroids.forEach(c => {
      if (prefersReducedMotion) {
        c.drawX = c.x;
        c.drawY = c.y;
        return;
      }
      c.drawX += (c.x - c.drawX) * 0.14;
      c.drawY += (c.y - c.drawY) * 0.14;
      if (Math.abs(c.x - c.drawX) > 0.0005 || Math.abs(c.y - c.drawY) > 0.0005) moving = true;
    });
    return moving;
  }

  function requestRender() {
    if (frameId) return;
    const tick = () => {
      const moving = animateCentroids();
      draw();
      frameId = moving ? requestAnimationFrame(tick) : null;
    };
    frameId = requestAnimationFrame(tick);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Cuadrícula de referencia
    ctx.strokeStyle = 'rgba(0, 50, 77, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo((width * i) / 10, 0);
      ctx.lineTo((width * i) / 10, height);
      ctx.moveTo(0, (height * i) / 10);
      ctx.lineTo(width, (height * i) / 10);
      ctx.stroke();
    }

    // Líneas punto → centroide asignado
    ctx.lineWidth = 1;
    state.points.forEach(p => {
      if (p.cluster < 0) return;
      const c = state.centroids[p.cluster];
      ctx.strokeStyle = `${CLUSTER_COLORS[p.cluster]}26`;
      ctx.beginPath();
      ctx.moveTo(p.x * width, p.y * height);
      ctx.lineTo(c.drawX * width, c.drawY * height);
      ctx.stroke();
    });

    // Puntos
    state.points.forEach(p => {
      ctx.fillStyle = p.cluster < 0 ? UNASSIGNED_COLOR : CLUSTER_COLORS[p.cluster];
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Recorrido histórico de cada centroide
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.6;
    state.centroids.forEach((c, i) => {
      if (c.trail.length < 2) return;
      ctx.strokeStyle = CLUSTER_COLORS[i];
      ctx.beginPath();
      c.trail.forEach((pos, j) => {
        const x = pos.x * width;
        const y = pos.y * height;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Centroides: anillo blanco + núcleo de color + cruz
    state.centroids.forEach((c, i) => {
      const x = c.drawX * width;
      const y = c.drawY * height;

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#00324D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = CLUSTER_COLORS[i];
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 3.5, y);
      ctx.lineTo(x + 3.5, y);
      ctx.moveTo(x, y - 3.5);
      ctx.lineTo(x, y + 3.5);
      ctx.stroke();
    });
  }

  /* ---------- Eventos ---------- */

  btnStep.addEventListener('click', () => {
    stopRun();
    step();
  });

  btnRun.addEventListener('click', () => {
    if (runTimer) stopRun();
    else startRun();
  });

  btnReset.addEventListener('click', initCentroids);

  btnNewData.addEventListener('click', () => {
    generateData();
    initCentroids();
  });

  kInput.addEventListener('input', () => {
    state.k = Number(kInput.value);
    kOutput.textContent = state.k;
    initCentroids();
  });

  // Clic en el lienzo: agrega un pequeño grupo de puntos nuevos sin asignar
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const cx = (event.clientX - rect.left) / rect.width;
    const cy = (event.clientY - rect.top) / rect.height;

    for (let i = 0; i < 6; i++) {
      state.points.push({
        x: clamp(cx + gaussian() * 0.025, 0.02, 0.98),
        y: clamp(cy + gaussian() * 0.025, 0.03, 0.97),
        cluster: -1
      });
    }

    state.converged = false;
    state.phase = 'assign';
    setPhaseText('Agregaste datos nuevos (en gris). El siguiente paso los asigna a un grupo.');
    updateUI();
    requestRender();
  });

  new ResizeObserver(resize).observe(canvas);

  generateData();
  initCentroids();
});
