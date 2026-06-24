/* buscador.js — Buscador de avistamientos sobre el mapa
   ──────────────────────────────────────────────────────
   INTEGRACIÓN en index.html, antes de </body> y DESPUÉS de app.js:
     <script src="buscador.js"></script>

   INTEGRACIÓN en app.js:
     Tras recibir los datos del fetch, exponerlos:
       window.todosLosAvistamientos = data;
     Y si quieres que al pulsar un resultado abra el mismo modal
     que al clicar el marcador en el mapa, expón también:
       window.abrirModal = abrirModal;   // la función que ya tienes
*/

(function () {

  /* ══════════════════════════════════════════════════
     CSS
  ══════════════════════════════════════════════════ */
  const CSS = `
    /* Botón de lupa en el mapa */
    #buscador-btn {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 1100;
      width: 42px;
      height: 42px;
      background: rgba(6,6,20,0.92);
      border: 1px solid #00ff8866;
      border-radius: 4px;
      color: #00ff88;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      font-family: sans-serif;
    }
    #buscador-btn:hover {
      background: rgba(0,255,136,0.12);
      border-color: #00ff88;
    }

    /* Panel de búsqueda desplegable */
    #buscador-panel {
      position: fixed;
      top: 18px;
      right: 68px;
      z-index: 1100;
      width: 320px;
      background: rgba(6,6,20,0.96);
      border: 1px solid #00ff8866;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      overflow: hidden;
      transform: scaleX(0);
      transform-origin: right center;
      opacity: 0;
      transition: transform 0.22s cubic-bezier(.4,0,.2,1), opacity 0.22s;
      pointer-events: none;
    }
    #buscador-panel.open {
      transform: scaleX(1);
      opacity: 1;
      pointer-events: auto;
    }

    #buscador-input-wrap {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      gap: 8px;
      border-bottom: 1px solid #00ff8822;
    }
    #buscador-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #00ff88;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 0.05em;
      caret-color: #00ff88;
    }
    #buscador-input::placeholder { color: #00ff8855; }
    #buscador-clear {
      background: none;
      border: none;
      color: #00ff8866;
      font-size: 16px;
      cursor: pointer;
      padding: 0 2px;
      line-height: 1;
      transition: color 0.15s;
      display: none;
    }
    #buscador-clear.visible { display: block; }
    #buscador-clear:hover { color: #00ff88; }

    #buscador-count {
      padding: 4px 12px;
      font-size: 10px;
      letter-spacing: 0.2em;
      color: #4af7a8;
      min-height: 22px;
    }

    #buscador-results {
      max-height: 320px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #00ff8844 transparent;
    }
    #buscador-results::-webkit-scrollbar { width: 4px; }
    #buscador-results::-webkit-scrollbar-thumb { background: #00ff8844; border-radius: 2px; }

    .buscador-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 9px 12px;
      cursor: pointer;
      border-bottom: 1px solid #00ff8811;
      transition: background 0.12s;
    }
    .buscador-item:hover { background: rgba(0,255,136,0.07); }
    .buscador-item:last-child { border-bottom: none; }

    .buscador-item-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      margin-top: 1px;
      object-fit: contain;
      opacity: 0.85;
    }

    .buscador-item-info {
      flex: 1;
      min-width: 0;
    }
    .buscador-item-nombre {
      font-size: 12px;
      color: #00ff88;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.04em;
    }
    .buscador-item-meta {
      font-size: 10px;
      color: #4af7a8;
      letter-spacing: 0.1em;
      margin-top: 2px;
      opacity: 0.7;
    }

    /* Highlight del texto buscado */
    .buscador-hl {
      color: #fff;
      background: #00ff8833;
      border-radius: 2px;
      padding: 0 1px;
    }

    .buscador-empty {
      padding: 18px 12px;
      font-size: 11px;
      color: #4af7a8;
      letter-spacing: 0.15em;
      text-align: center;
      opacity: 0.6;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ══════════════════════════════════════════════════
     HTML
  ══════════════════════════════════════════════════ */
  const btnEl = document.createElement('button');
  btnEl.id = 'buscador-btn';
  btnEl.title = 'Buscar avistamiento';
  btnEl.innerHTML = '🔍';

  const panelEl = document.createElement('div');
  panelEl.id = 'buscador-panel';
  panelEl.innerHTML = `
    <div id="buscador-input-wrap">
      <input id="buscador-input" type="text" placeholder="Buscar por nombre, ciudad, país…" autocomplete="off" spellcheck="false"/>
      <button id="buscador-clear" title="Limpiar">✕</button>
    </div>
    <div id="buscador-count"></div>
    <div id="buscador-results"></div>
  `;

  document.body.appendChild(btnEl);
  document.body.appendChild(panelEl);

  /* ══════════════════════════════════════════════════
     Referencias DOM
  ══════════════════════════════════════════════════ */
  const inputEl   = document.getElementById('buscador-input');
  const clearBtn  = document.getElementById('buscador-clear');
  const countEl   = document.getElementById('buscador-count');
  const resultsEl = document.getElementById('buscador-results');

  /* Colores por tipo (igual que app.js) */
  const TIPO_COLOR = {
    platillo : '#39ff14',
    orbe     : '#00cfff',
    triangulo: '#ff6600',
    cigarro  : '#ff2266',
    luces    : '#ffe600'
  };

  /* ══════════════════════════════════════════════════
     Toggle del panel
  ══════════════════════════════════════════════════ */
  let panelOpen = false;

  btnEl.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panelEl.classList.toggle('open', panelOpen);
    if (panelOpen) {
      inputEl.focus();
      renderResults('');
    }
  });

  // Cerrar al clicar fuera
  document.addEventListener('click', e => {
    if (panelOpen && !panelEl.contains(e.target) && e.target !== btnEl) {
      panelOpen = false;
      panelEl.classList.remove('open');
    }
  });

  /* ══════════════════════════════════════════════════
     Búsqueda
  ══════════════════════════════════════════════════ */
  inputEl.addEventListener('input', () => {
    const q = inputEl.value.trim();
    clearBtn.classList.toggle('visible', q.length > 0);
    renderResults(q);
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    clearBtn.classList.remove('visible');
    inputEl.focus();
    renderResults('');
  });

  function normalizar(str) {
    return (str || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function highlight(texto, query) {
    if (!query) return escapeHTML(texto);
    const escaped = escapeHTML(texto);
    const re = new RegExp('(' + escapeRegex(escapeHTML(query)) + ')', 'gi');
    return escaped.replace(re, '<span class="buscador-hl">$1</span>');
  }

  function escapeHTML(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderResults(query) {
    const data = window.todosLosAvistamientos || [];
    const q    = normalizar(query);

    let filtrados = data;
    if (q.length >= 1) {
      filtrados = data.filter(a =>
        normalizar(a.nombre).includes(q)      ||
        normalizar(a.ciudad).includes(q)      ||
        normalizar(a.pais).includes(q)        ||
        normalizar(a.descripcion).includes(q) ||
        String(a.año).includes(q)
      );
    }

    // Mostrar máximo 40 resultados para no sobrecargar el DOM
    const mostrar = filtrados.slice(0, 40);

    if (q.length === 0) {
      countEl.textContent = `${data.length} avistamientos registrados`;
    } else {
      countEl.textContent = `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`;
    }

    if (filtrados.length === 0) {
      resultsEl.innerHTML = `<div class="buscador-empty">SIN RESULTADOS PARA "${escapeHTML(query)}"</div>`;
      return;
    }

    resultsEl.innerHTML = mostrar.map(a => {
      const color   = TIPO_COLOR[a.tipo] || '#00ff88';
      const icono   = `img/${a.tipo || 'platillo'}.svg`;
      const nombre  = highlight(a.nombre || '—', query);
      const meta    = [a.año, a.ciudad, a.pais].filter(Boolean).join(' · ');
      return `
        <div class="buscador-item" data-id="${a.id}" style="border-left: 3px solid ${color}">
          <img class="buscador-item-icon" src="${icono}" alt="${escapeHTML(a.tipo)}" onerror="this.style.display='none'"/>
          <div class="buscador-item-info">
            <div class="buscador-item-nombre">${nombre}</div>
            <div class="buscador-item-meta">${escapeHTML(meta)}</div>
          </div>
        </div>`;
    }).join('');

    // Click en resultado → centrar mapa y abrir modal
    resultsEl.querySelectorAll('.buscador-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id, 10);
        const av = data.find(a => a.id == id);
        if (!av) return;

        // Cerrar buscador
        panelOpen = false;
        panelEl.classList.remove('open');

        // Centrar el mapa en el avistamiento (si el mapa Leaflet está expuesto)
        if (window.mapa && av.lat && av.lng) {
          window.mapa.setView([parseFloat(av.lat), parseFloat(av.lng)], 6, { animate: true });
        }

        // Abrir el modal de detalle (si app.js lo expone)
        if (typeof window.abrirModal === 'function') {
          window.abrirModal(av);
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════
     Acceso por teclado: Escape cierra el panel
  ══════════════════════════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panelOpen) {
      panelOpen = false;
      panelEl.classList.remove('open');
    }
  });

})();