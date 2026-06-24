(function () {

  const CSS = `
    #timeline-container {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 110px;
      background: linear-gradient(to top, rgba(6,6,20,0.97) 80%, transparent);
      z-index: 900;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 16px 10px;
      padding-left: 50px;
      box-sizing: border-box;
      pointer-events: none;
    }

    #tl-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 12px;
      width: 100%;
      pointer-events: auto;
    }
    #tl-title {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: 0.25em;
      color: #4af7a8;
      text-transform: uppercase;
      text-align: center;
    }
    #tl-reset {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: 0.15em;
      color: #00ff88;
      background: transparent;
      border: 1px solid #00ff8855;
      padding: 2px 10px;
      border-radius: 2px;
      cursor: pointer;
      display: none;
      transition: background 0.2s;
    }
    #tl-reset:hover { background: #00ff8822; }
    #tl-reset.visible { display: inline-block; }

    #tl-scroll {
      flex: 1;
      width: 100%;
      display: flex;
      justify-content: center;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
      scrollbar-color: #00ff8844 transparent;
      pointer-events: auto;
    }
    #tl-scroll::-webkit-scrollbar { height: 3px; }
    #tl-scroll::-webkit-scrollbar-thumb { background: #00ff8844; border-radius: 2px; }

    #tl-chart {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 72px;
      min-width: max-content;
      padding: 0 4px;
    }

    .tl-bar-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .tl-bar-wrap:hover .tl-bar { filter: brightness(1.5); }
    .tl-bar-wrap.dimmed { opacity: 0.25; }
    .tl-bar-wrap.active .tl-bar {
      background: #00ff88 !important;
      box-shadow: 0 0 10px #00ff8899;
    }

    .tl-bar {
      width: 18px;
      background: #1a6640;
      border-radius: 2px 2px 0 0;
      min-height: 3px;
      transition: height 0.4s cubic-bezier(.4,0,.2,1), background 0.2s;
    }

    .tl-label {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      color: #4af7a8;
      white-space: nowrap;
      writing-mode: vertical-lr;
      transform: rotate(180deg);
      height: 28px;
      line-height: 1;
      overflow: hidden;
    }
    .tl-bar-wrap.active .tl-label { color: #00ff88; font-weight: bold; }

    #tl-tooltip {
      position: fixed;
      background: rgba(0,10,5,0.94);
      border: 1px solid #00ff8866;
      color: #00ff88;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 3px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 9999;
      white-space: nowrap;
    }
    #tl-tooltip.show { opacity: 1; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  if (!document.getElementById('timeline-container')) {
    const wrap = document.createElement('div');
    wrap.id = 'timeline-container';
    document.body.appendChild(wrap);
  }

  const container = document.getElementById('timeline-container');
  container.innerHTML = `
    <div id="tl-header">
      <span id="tl-title">— avistamientos por año —</span>
      <button id="tl-reset">✕ quitar filtro de año</button>
    </div>
    <div id="tl-scroll">
      <div id="tl-chart"></div>
    </div>
    <div id="tl-tooltip"></div>
  `;

  let añoSeleccionado = null;

  function buildTimeline(avistamientos) {
    const chart = document.getElementById('tl-chart');
    chart.innerHTML = '';

    const conteo = {};
    avistamientos.forEach(a => {
      const y = parseInt(a.año, 10);
      if (!isNaN(y)) conteo[y] = (conteo[y] || 0) + 1;
    });

    const años = Object.keys(conteo).map(Number).sort((a, b) => a - b);
    if (!años.length) return;

    const maxCount = Math.max(...Object.values(conteo));
    const BAR_H    = 56;
    const tooltip  = document.getElementById('tl-tooltip');

    años.forEach(año => {
      const count    = conteo[año];
      const barH     = Math.max(3, Math.round((count / maxCount) * BAR_H));
      const isActive = año === añoSeleccionado;

      const wrap = document.createElement('div');
      wrap.className = 'tl-bar-wrap' + (isActive ? ' active' : '');
      wrap.dataset.año = año;
      wrap.innerHTML = `
        <div class="tl-bar" style="height:${barH}px"></div>
        <div class="tl-label">${año}</div>
      `;

      wrap.addEventListener('mouseenter', () => {
        tooltip.textContent = `${año}  ·  ${count} avistamiento${count !== 1 ? 's' : ''}`;
        tooltip.classList.add('show');
      });
      wrap.addEventListener('mousemove', e => {
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top  = (e.clientY - 36) + 'px';
      });
      wrap.addEventListener('mouseleave', () => tooltip.classList.remove('show'));

      wrap.addEventListener('click', () => {
        if (añoSeleccionado === año) clearFilter();
        else setFilter(año);
      });

      chart.appendChild(wrap);
    });

    updateBarStyles();

    if (añoSeleccionado) {
      const activeEl = chart.querySelector('.tl-bar-wrap.active');
      if (activeEl) activeEl.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  function setFilter(año) {
    añoSeleccionado = año;
    updateBarStyles();
    document.getElementById('tl-reset').classList.add('visible');
    const sel = document.getElementById('filtro-año') || document.getElementById('filter-year');
    if (sel) {
      sel.value = String(año);
      sel.dispatchEvent(new Event('change'));
    } else if (typeof window.aplicarFiltros === 'function') {
      window._timelineAñoFiltro = año;
      window.aplicarFiltros();
    }
  }

  function clearFilter() {
    añoSeleccionado = null;
    updateBarStyles();
    document.getElementById('tl-reset').classList.remove('visible');
    const sel = document.getElementById('filtro-año') || document.getElementById('filter-year');
    if (sel) {
      sel.value = '';
      sel.dispatchEvent(new Event('change'));
    } else if (typeof window.aplicarFiltros === 'function') {
      window._timelineAñoFiltro = null;
      window.aplicarFiltros();
    }
  }

  function updateBarStyles() {
    document.querySelectorAll('.tl-bar-wrap').forEach(el => {
      const esteAño = parseInt(el.dataset.año, 10);
      el.classList.remove('active', 'dimmed');
      if (añoSeleccionado === null) return;
      if (esteAño === añoSeleccionado) el.classList.add('active');
      else el.classList.add('dimmed');
    });
    document.getElementById('tl-reset').classList.toggle('visible', añoSeleccionado !== null);
  }

  document.getElementById('tl-reset').addEventListener('click', clearFilter);

  window.timeline = {
    init:          function (data) { buildTimeline(data); },
    update:        function (data) { buildTimeline(data); },
    getAño:        function ()     { return añoSeleccionado; },
    setAñoExterno: function (año)  {
      añoSeleccionado = año ? parseInt(año, 10) : null;
      updateBarStyles();
    }
  };

  if (Array.isArray(window.todosLosAvistamientos) && window.todosLosAvistamientos.length) {
    buildTimeline(window.todosLosAvistamientos);
  }

})();