/**
 * PROYECTO: Machine Learning · Componente Formativo SENA ADSO | GAES 6
 * ARCHIVO: js/confusion-matrix.js
 * DESCRIPCIÓN: Laboratorio de matriz de confusión. Recalcula Accuracy,
 *              Precision, Recall y F1 en vivo y explica qué significa el
 *              resultado (por ejemplo, cuándo el Accuracy engaña).
 */

document.addEventListener('DOMContentLoaded', () => {
  const lab = document.getElementById('cmLab');
  if (!lab) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const balanceEl = document.getElementById('cmBalance');
  const insightEl = document.getElementById('cmInsight');
  const presetButtons = lab.querySelectorAll('.cm-preset');

  // Cada celda de la matriz: su control deslizante y su número visible
  const cells = {};
  lab.querySelectorAll('.cm-cell').forEach(cell => {
    cells[cell.dataset.cell] = {
      element: cell,
      input: cell.querySelector('input'),
      output: cell.querySelector('output')
    };
  });

  const metrics = {};
  lab.querySelectorAll('.cm-metric').forEach(metric => {
    metrics[metric.dataset.metric] = {
      value: metric.querySelector('.cm-metric-value'),
      bar: metric.querySelector('.cm-bar > span'),
      shown: 0,
      frame: null
    };
  });

  // Escenarios pensados para la exposición (1000 casos cada uno)
  const PRESETS = {
    balanceado: { tp: 420, fn: 80, fp: 60, tn: 440 },
    fraude: { tp: 5, fn: 45, fp: 5, tn: 945 },
    alarmas: { tp: 48, fn: 2, fp: 300, tn: 650 }
  };

  // Evita dividir entre cero: si no hay casos, la métrica no está definida
  function safeDivide(numerator, denominator) {
    return denominator === 0 ? null : numerator / denominator;
  }

  function percent(value) {
    return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
  }

  function readMatrix() {
    return {
      tp: Number(cells.tp.input.value),
      fn: Number(cells.fn.input.value),
      fp: Number(cells.fp.input.value),
      tn: Number(cells.tn.input.value)
    };
  }

  function computeMetrics({ tp, fn, fp, tn }) {
    const precision = safeDivide(tp, tp + fp);
    const recall = safeDivide(tp, tp + fn);
    const f1 = (precision === null || recall === null || precision + recall === 0)
      ? null
      : (2 * precision * recall) / (precision + recall);

    return {
      accuracy: safeDivide(tp + tn, tp + fn + fp + tn),
      precision,
      recall,
      f1
    };
  }

  // El número cuenta desde el valor anterior hasta el nuevo
  function tweenMetric(metric, target) {
    cancelAnimationFrame(metric.frame);
    metric.bar.style.width = `${(target ?? 0) * 100}%`;

    if (target === null) {
      metric.value.textContent = '—';
      metric.shown = 0;
      return;
    }

    if (prefersReducedMotion) {
      metric.value.textContent = percent(target);
      metric.shown = target;
      return;
    }

    const from = metric.shown;
    const start = performance.now();
    const DURATION = 450;

    const frame = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      metric.shown = from + (target - from) * eased;
      metric.value.textContent = percent(metric.shown);
      if (t < 1) metric.frame = requestAnimationFrame(frame);
    };
    metric.frame = requestAnimationFrame(frame);
  }

  function buildInsight(m, total) {
    if (total === 0) {
      return { level: 'info', text: 'Mueve los controles para llenar la matriz.' };
    }
    if (m.accuracy >= 0.9 && m.recall !== null && m.recall < 0.5) {
      return {
        level: 'warning',
        text: `Accuracy engañoso: ${percent(m.accuracy)} suena excelente, pero el modelo solo detecta ${percent(m.recall)} de los positivos reales. Con clases desbalanceadas, el F1 (${percent(m.f1)}) muestra el problema.`
      };
    }
    if (m.recall !== null && m.recall >= 0.8 && m.precision !== null && m.precision < 0.5) {
      return {
        level: 'warning',
        text: `Demasiadas falsas alarmas: el modelo encuentra casi todos los positivos (Recall ${percent(m.recall)}), pero solo ${percent(m.precision)} de sus alertas son ciertas.`
      };
    }
    if (m.f1 !== null && m.f1 >= 0.85) {
      return {
        level: 'success',
        text: `Modelo equilibrado: Precision y Recall están altos, y el F1 (${percent(m.f1)}) lo confirma.`
      };
    }
    return {
      level: 'info',
      text: `Precision (${percent(m.precision)}) y Recall (${percent(m.recall)}) compiten entre sí. El F1 (${percent(m.f1)}) resume ese equilibrio en un solo número.`
    };
  }

  function render() {
    const matrix = readMatrix();
    const total = matrix.tp + matrix.fn + matrix.fp + matrix.tn;
    const maxValue = Math.max(matrix.tp, matrix.fn, matrix.fp, matrix.tn, 1);

    // Mapa de calor: la celda con más casos se ve más intensa
    Object.entries(cells).forEach(([key, cell]) => {
      cell.output.textContent = matrix[key];
      cell.element.style.setProperty('--heat', (matrix[key] / maxValue).toFixed(3));
    });

    const m = computeMetrics(matrix);
    Object.entries(metrics).forEach(([key, metric]) => tweenMetric(metric, m[key]));

    const positives = matrix.tp + matrix.fn;
    balanceEl.textContent = total === 0
      ? ''
      : `Positivos reales: ${positives} de ${total} casos (${((positives / total) * 100).toFixed(1)}% de los datos).`;

    const insight = buildInsight(m, total);
    insightEl.dataset.level = insight.level;
    insightEl.textContent = insight.text;
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    Object.entries(preset).forEach(([key, value]) => {
      cells[key].input.value = value;
    });
    presetButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.preset === name)));
    render();
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  // Al mover un control a mano, ya no aplica ningún escenario predefinido
  Object.values(cells).forEach(cell => {
    cell.input.addEventListener('input', () => {
      presetButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
      render();
    });
  });

  applyPreset('balanceado');
});
