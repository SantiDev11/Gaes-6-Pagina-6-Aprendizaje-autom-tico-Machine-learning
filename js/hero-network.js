/**
 * PROYECTO: Machine Learning · Componente Formativo SENA ADSO | GAES 6
 * ARCHIVO: js/hero-network.js
 * DESCRIPCIÓN: Fondo animado del hero. Los nodos se conectan por cercanía y
 *              transmiten señales de nodo en nodo, como la propagación hacia
 *              adelante en una red neuronal. Un clic dispara una ráfaga de señales.
 */

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('portada');
  const canvas = document.getElementById('heroCanvas');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINK_DISTANCE = 130;   // distancia máxima (px) para dibujar una conexión
  const POINTER_RADIUS = 170;  // alcance del cursor sobre los nodos
  const MAX_SIGNALS = 24;      // límite de señales simultáneas
  const MAX_HOPS = 4;          // saltos que puede dar una señal antes de apagarse

  let width = 0;
  let height = 0;
  let nodes = [];
  let signals = [];
  let running = false;
  let heroVisible = true;
  let frameId = null;
  const pointer = { x: 0, y: 0, active: false };

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function createNodes() {
    const count = Math.max(24, Math.min(90, Math.round((width * height) / 9000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.6 + 1.2,
      glow: 0
    }));
    signals = [];
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const oldWidth = width;
    const oldHeight = height;

    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!nodes.length || !oldWidth || !oldHeight) {
      createNodes();
    } else {
      // Al cambiar el tamaño (ej. modo presentación) se reescalan las posiciones
      nodes.forEach(node => {
        node.x *= width / oldWidth;
        node.y *= height / oldHeight;
      });
    }

    if (!running) draw();
  }

  function neighborsOf(index) {
    const origin = nodes[index];
    const result = [];
    nodes.forEach((node, j) => {
      if (j !== index && distance(origin, node) < LINK_DISTANCE) result.push(j);
    });
    return result;
  }

  function spawnSignal(fromIndex, hops = 0) {
    if (signals.length >= MAX_SIGNALS || !nodes.length) return;
    const from = fromIndex ?? Math.floor(Math.random() * nodes.length);
    const options = neighborsOf(from);
    if (!options.length) return;
    const to = options[Math.floor(Math.random() * options.length)];
    signals.push({ from, to, t: 0, speed: 0.014 + Math.random() * 0.012, hops });
  }

  function update() {
    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      node.glow = Math.max(0, node.glow - 0.02);
    });

    // Cuando una señal llega, ilumina el nodo y puede seguir propagándose
    const arrivals = [];
    signals = signals.filter(signal => {
      signal.t += signal.speed;
      if (signal.t < 1) return true;
      nodes[signal.to].glow = 1;
      if (signal.hops < MAX_HOPS && Math.random() < 0.75) arrivals.push(signal);
      return false;
    });
    arrivals.forEach(signal => spawnSignal(signal.to, signal.hops + 1));

    if (Math.random() < 0.04) spawnSignal();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Conexiones entre nodos cercanos: más cerca = más visibles
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = distance(nodes[i], nodes[j]);
        if (d < LINK_DISTANCE) {
          ctx.strokeStyle = `rgba(154, 230, 180, ${(1 - d / LINK_DISTANCE) * 0.28})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Conexiones hacia el cursor
    if (pointer.active) {
      ctx.lineWidth = 1.2;
      nodes.forEach(node => {
        const d = distance(node, pointer);
        if (d < POINTER_RADIUS) {
          ctx.strokeStyle = `rgba(57, 169, 0, ${(1 - d / POINTER_RADIUS) * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      });
    }

    // Nodos (los que reciben una señal brillan unos instantes)
    nodes.forEach(node => {
      if (node.glow > 0) {
        ctx.fillStyle = `rgba(57, 169, 0, ${node.glow * 0.35})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 7 * node.glow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = node.glow > 0.2 ? '#B9F6A0' : 'rgba(226, 232, 240, 0.75)';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Señales viajando por las conexiones
    signals.forEach(signal => {
      const a = nodes[signal.from];
      const b = nodes[signal.to];
      const x = a.x + (b.x - a.x) * signal.t;
      const y = a.y + (b.y - a.y) * signal.t;

      ctx.fillStyle = 'rgba(57, 169, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D9FFC7';
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    frameId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  // Interacción: el cursor atrae conexiones; el clic lanza una ráfaga desde el nodo más cercano
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  hero.addEventListener('click', (event) => {
    if (event.target.closest('a, button') || !nodes.length) return;
    const rect = hero.getBoundingClientRect();
    const clickPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    let nearest = 0;
    nodes.forEach((node, i) => {
      if (distance(node, clickPoint) < distance(nodes[nearest], clickPoint)) nearest = i;
    });

    nodes[nearest].glow = 1;
    for (let i = 0; i < 6; i++) spawnSignal(nearest);
  });

  // Solo se anima cuando el hero se ve y la pestaña está activa: ahorra batería y CPU
  const visibilityObserver = new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
    if (heroVisible && !document.hidden) start();
    else stop();
  });
  visibilityObserver.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (heroVisible) start();
  });

  let resizeFrame = null;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  }).observe(hero);

  resize();
});
