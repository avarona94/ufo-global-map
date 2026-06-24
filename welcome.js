/* welcome.js — Animación de bienvenida OVNI
   Añadir en index.html justo antes de </body>:
   <script src="welcome.js"></script>

   PERSONALIZA EL TÍTULO aquí abajo:
   - .sector   → línea pequeña superior
   - .titulo   → título grande central
   - .subtitulo → línea pequeña inferior
*/

(function () {
  const CSS = `
    #ovni-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', monospace;
      overflow: hidden;
      transition: opacity 1.4s ease;
    }
    #ovni-overlay.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    .star {
      position: absolute;
      background: #fff;
      border-radius: 50%;
      animation: twinkle var(--d) infinite alternate;
    }
    @keyframes twinkle {
      from { opacity: 0.2; transform: scale(1); }
      to   { opacity: 1;   transform: scale(1.4); }
    }

    #ovni-ship {
      position: absolute;
      top: 18%;
      left: -220px;
      width: 160px;
      animation: fly 3.2s cubic-bezier(.4,0,.2,1) forwards;
      filter: drop-shadow(0 0 18px #00ff88aa);
    }
    @keyframes fly {
      0%   { left: -220px; top: 18%; }
      35%  { left: 42%;    top: 14%; }
      60%  { left: 42%;    top: 14%; transform: scaleY(1); }
      75%  { left: 42%;    top: 14%; transform: scaleY(0.88); }
      100% { left: 110%;   top: 8%;  }
    }

    #ovni-beam {
      position: absolute;
      top: 18%;
      left: 42%;
      width: 60px;
      height: 120px;
      margin-left: 50px;
      background: linear-gradient(to bottom, rgba(0,255,136,0.35), transparent);
      clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
      opacity: 0;
      animation: beam-appear 0.4s 2.0s forwards, beam-hide 0.3s 2.9s forwards;
      pointer-events: none;
    }
    @keyframes beam-appear { to { opacity: 1; } }
    @keyframes beam-hide   { to { opacity: 0; } }

    #ovni-text {
      text-align: center;
      color: #00ff88;
      z-index: 2;
      margin-top: 52vh;
      animation: text-in 0.8s 1.4s both;
    }
    @keyframes text-in {
      from { opacity: 0; letter-spacing: 0.6em; }
      to   { opacity: 1; letter-spacing: 0.18em; }
    }
    #ovni-text .sector {
      font-size: clamp(11px, 2.2vw, 17px);
      letter-spacing: 0.5em;
      color: #4af7a8;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    #ovni-text .titulo {
      font-size: clamp(22px, 5vw, 48px);
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #00ff88;
      text-shadow: 0 0 28px #00ff88;
      text-transform: uppercase;
    }
    #ovni-text .subtitulo {
      font-size: clamp(10px, 1.8vw, 14px);
      letter-spacing: 0.32em;
      color: #aaa;
      margin-top: 10px;
    }

    #ovni-scanline {
      position: absolute;
      width: 100%;
      height: 2px;
      background: rgba(0,255,136,0.12);
      animation: scan 4s linear infinite;
      pointer-events: none;
    }
    @keyframes scan {
      0%   { top: 0; }
      100% { top: 100%; }
    }

    /* Efecto glitch en el título */
    @keyframes glitch {
      0%   { text-shadow: 0 0 28px #00ff88; transform: translate(0); }
      20%  { text-shadow: -2px 0 #ff0055, 2px 0 #00aaff; transform: translate(-1px, 1px); }
      21%  { text-shadow: 0 0 28px #00ff88; transform: translate(0); }
      80%  { text-shadow: 0 0 28px #00ff88; transform: translate(0); }
      81%  { text-shadow: 2px 0 #ff0055, -2px 0 #00aaff; transform: translate(1px, -1px); }
      82%  { text-shadow: 0 0 28px #00ff88; transform: translate(0); }
      100% { text-shadow: 0 0 28px #00ff88; transform: translate(0); }
    }
    #ovni-text .titulo {
      animation: glitch 4s 2.5s infinite;
    }

    #ovni-bar-wrap {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: min(320px, 70vw);
      text-align: center;
      z-index: 3;
    }
    #ovni-bar-label {
      font-size: 11px;
      color: #4af7a8;
      letter-spacing: 0.25em;
      margin-bottom: 8px;
    }
    #ovni-bar-track {
      width: 100%;
      height: 3px;
      background: #0a2a18;
      border-radius: 2px;
      overflow: hidden;
    }
    #ovni-bar-fill {
      height: 100%;
      width: 0%;
      background: #00ff88;
      border-radius: 2px;
      transition: width 0.12s linear;
    }

    #ovni-skip {
      position: absolute;
      bottom: 22px;
      right: 28px;
      background: transparent;
      border: 1px solid #00ff8866;
      color: #00ff88;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 0.15em;
      padding: 6px 18px;
      cursor: pointer;
      border-radius: 2px;
      z-index: 4;
      transition: background 0.2s, border-color 0.2s;
    }
    #ovni-skip:hover {
      background: #00ff8822;
      border-color: #00ff88;
    }

    /* Coordenadas decorativas en las esquinas */
    .ovni-coord {
      position: absolute;
      font-size: 10px;
      color: #00ff8833;
      letter-spacing: 0.15em;
    }
    .ovni-coord.tl { top: 18px; left: 22px; }
    .ovni-coord.tr { top: 18px; right: 22px; text-align: right; }
    .ovni-coord.bl { bottom: 18px; left: 22px; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  const overlay = document.createElement('div');
  overlay.id = 'ovni-overlay';

  const starHTML = Array.from({ length: 140 }, () => {
    const size  = (Math.random() * 2.4 + 0.5).toFixed(1);
    const left  = (Math.random() * 100).toFixed(1);
    const top   = (Math.random() * 100).toFixed(1);
    const delay = (Math.random() * 4).toFixed(2);
    const dur   = (1.0 + Math.random() * 2.5).toFixed(2);
    return `<div class="star" style="width:${size}px;height:${size}px;left:${left}%;top:${top}%;--d:${dur}s;animation-delay:${delay}s"></div>`;
  }).join('');

  const ovniSVG = `
  <svg id="ovni-ship" viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="50" rx="72" ry="14" fill="#1a1a2e" stroke="#00ff88" stroke-width="1.5"/>
    <ellipse cx="80" cy="38" rx="34" ry="20" fill="#0d1f12" stroke="#00ff88" stroke-width="1.2"/>
    <ellipse cx="80" cy="34" rx="22" ry="12" fill="#001a0a" stroke="#00ff8866" stroke-width="0.8"/>
    <circle cx="68" cy="33" r="4" fill="#00ff8844" stroke="#00ff88" stroke-width="0.8"/>
    <circle cx="80" cy="30" r="4.5" fill="#00ff8866" stroke="#00ff88" stroke-width="0.8"/>
    <circle cx="92" cy="33" r="4" fill="#00ff8844" stroke="#00ff88" stroke-width="0.8"/>
    <circle cx="26" cy="50" r="3" fill="#ff0055">
      <animate attributeName="opacity" values="1;0.1;1" dur="0.7s" repeatCount="indefinite"/>
    </circle>
    <circle cx="52" cy="58" r="3" fill="#00ff88">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" repeatCount="indefinite"/>
    </circle>
    <circle cx="80" cy="62" r="3" fill="#ffcc00">
      <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="108" cy="58" r="3" fill="#00ff88">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite"/>
    </circle>
    <circle cx="134" cy="50" r="3" fill="#ff0055">
      <animate attributeName="opacity" values="1;0.1;1" dur="0.8s" repeatCount="indefinite"/>
    </circle>
    <ellipse cx="72" cy="28" rx="8" ry="4" fill="#00ff8818" transform="rotate(-20 72 28)"/>
  </svg>`;

  // ── AQUÍ CAMBIAS EL TEXTO DE LA ANIMACIÓN ──────────────────────────
  // .sector   = línea pequeña de arriba  (ej: nombre del proyecto / asignatura)
  // .titulo   = título grande            (ej: el nombre real de tu app)
  // .subtitulo = línea pequeña de abajo  (ej: descripción breve o tu nombre)
  // ────────────────────────────────────────────────────────────────────
  overlay.innerHTML = `
    ${starHTML}
    <div id="ovni-scanline"></div>
    ${ovniSVG}
    <div id="ovni-beam"></div>
    <div class="ovni-coord tl">LAT 0.000 / LNG 0.000</div>
    <div class="ovni-coord tr">FENÓMENOS: 101<br>CLASIFICACIÓN: TOP SECRET</div>
    <div class="ovni-coord bl">TFG · 2025-2026</div>
    <div id="ovni-text">
      <div class="sector">— classified information —</div>
      <div class="titulo">UFO<br>Global Map</div>
      <div class="subtitulo">Unidentified Aerial Phenomena · Worldwide Registry</div>
    </div>
    <div id="ovni-bar-wrap">
      <div id="ovni-bar-label">INICIANDO CONEXIÓN…</div>
      <div id="ovni-bar-track"><div id="ovni-bar-fill"></div></div>
    </div>
    <button id="ovni-skip">[ SALTAR ]</button>
  `;

  document.body.prepend(overlay);

  const TOTAL_MS  = 9000;
  const FADE_MS   = 1400;
  const bar       = document.getElementById('ovni-bar-fill');
  const labels    = ['INICIANDO CONEXIÓN…', 'AUTENTICANDO ACCESO…', 'DESENCRIPTANDO ARCHIVOS…', 'ACCESO CONCEDIDO ✓'];
  const labelEl   = document.getElementById('ovni-bar-label');
  const start     = performance.now();
  let   dismissed = false;

  function tick(now) {
    if (dismissed) return;
    const elapsed = now - start;
    const pct     = Math.min(100, (elapsed / TOTAL_MS) * 100);
    bar.style.width = pct + '%';
    const idx = Math.min(labels.length - 1, Math.floor(pct / 26));
    labelEl.textContent = labels[idx];
    if (elapsed < TOTAL_MS) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), FADE_MS);
  }

  setTimeout(dismiss, TOTAL_MS);
  document.getElementById('ovni-skip').addEventListener('click', dismiss);
})();