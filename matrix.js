(() => {
  'use strict';

  const canvas = document.getElementById('code-rain');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Tokens tech élargis ──────────────────────────────── */
  const TOKENS = [
    'IP','VLAN','DNS','DHCP','AD','SSH','GPO','RDP','RAID','NAT',
    'HTTP','TLS','VM','AWS','DOCKER','CISCO','ESXI','VEEAM','PING','ACL',
    'CVE','IOC','CERT','NMAP','KALI','NESSUS','FIREWALL','PATCH','SCP','VPN',
    'MITRE','SNMP','OSPF','BGP','802.1Q','LDAP','PKI','AES','ZERO','EDR'
  ];

  const CONFIG = {
    minFont: 13, maxFont: 17,
    minSpeed: 0.38, maxSpeed: 1.18,
    minTrail: 3, maxTrail: 8,
    gapFactor: 1.9,
    resetChance: 0.011,
    staticDensity: 0.32,
    maxDelta: 64,
    maxDPR: 1.6,
    glitchChance: 0.0006,   /* prob par frame par colonne de glitch */
    glitchDuration: 120     /* ms */
  };

  let W = 0, H = 0, fontSize = 15;
  let columns = [];
  let rafId = null, lastTs = 0;
  let resizeTimer = null;

  /* ── Couleurs de colonne variant légèrement ─────────── */
  const TINTS = [
    null,               /* rouge-rose principal */
    'rgba(180,100,160,VAL)',  /* légèrement violet */
    'rgba(100,160,220,VAL)',  /* légèrement bleu */
    null
  ];

  const getTheme = () => {
    const s = getComputedStyle(document.documentElement);
    return {
      color: (s.getPropertyValue('--code-rain-color') || 'rgba(211,43,43,0.34)').trim(),
      head:  (s.getPropertyValue('--code-rain-head')  || 'rgba(255,210,220,0.82)').trim(),
      trail: (s.getPropertyValue('--code-rain-trail') || 'rgba(5,5,5,0.06)').trim()
    };
  };

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = () => TOKENS[Math.floor(Math.random() * TOKENS.length)];

  const makeColumn = (i) => {
    const tintIdx = Math.floor(Math.random() * TINTS.length);
    return {
      x: i * fontSize * CONFIG.gapFactor,
      y: rand(-H, 0),
      speed: rand(CONFIG.minSpeed, CONFIG.maxSpeed),
      trail: Math.round(rand(CONFIG.minTrail, CONFIG.maxTrail)),
      token: pick(),
      tintIdx,
      glitching: false,
      glitchEnd: 0
    };
  };

  const setup = () => {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDPR);
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = Math.min(CONFIG.maxFont, Math.max(CONFIG.minFont, Math.round(W / 96)));
    const count = Math.max(6, Math.floor(W / (fontSize * CONFIG.gapFactor)));
    columns = Array.from({ length: count }, (_, i) => makeColumn(i));
    ctx.clearRect(0, 0, W, H);
  };

  /* ── Décroissance exponentielle du trail ─────────────── */
  const trailAlpha = (step, total) => {
    const t = step / Math.max(1, total - 1);
    return Math.max(0.04, 0.78 * Math.exp(-3.5 * t));
  };

  const getColumnColor = (col, isHead, theme, now) => {
    if (col.glitching && now < col.glitchEnd) {
      /* Glitch = flash quasi-blanc */
      return isHead ? 'rgba(255,255,240,0.95)' : 'rgba(200,240,255,0.5)';
    }
    if (col.tintIdx > 0 && TINTS[col.tintIdx]) {
      const alpha = isHead ? 0.82 : 0.28;
      return TINTS[col.tintIdx].replace('VAL', String(alpha));
    }
    return isHead ? theme.head : theme.color;
  };

  const drawFrame = (now) => {
    const theme = getTheme();
    /* Trail semi-transparent pour effet persistance */
    ctx.fillStyle = theme.trail;
    ctx.fillRect(0, 0, W, H);

    ctx.font = `600 ${fontSize}px "Fira Code","Source Code Pro",monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    columns.forEach((col, idx) => {
      /* Glitch aléatoire */
      if (!col.glitching && Math.random() < CONFIG.glitchChance) {
        col.glitching = true;
        col.glitchEnd = now + CONFIG.glitchDuration;
        col.token = pick();
      }
      if (col.glitching && now >= col.glitchEnd) {
        col.glitching = false;
      }

      for (let s = 0; s < col.trail; s++) {
        const y = col.y - s * fontSize * 1.1;
        if (y < -fontSize || y > H + fontSize) continue;

        const isHead = s === 0;
        const alpha  = isHead ? (col.glitching ? 1 : 0.92) : trailAlpha(s, col.trail);
        const color  = getColumnColor(col, isHead, theme, now);
        const token  = isHead ? col.token : TOKENS[(idx + s * 3) % TOKENS.length];

        ctx.globalAlpha = alpha;
        ctx.fillStyle   = color;
        ctx.shadowBlur  = isHead ? (col.glitching ? 18 : 12) : 0;
        ctx.shadowColor = isHead ? color : 'transparent';
        ctx.fillText(token, col.x, y);
      }

      col.y += fontSize * col.speed;

      if (col.y > H + fontSize * (col.trail + 2) || Math.random() < CONFIG.resetChance) {
        col.y     = rand(-H * 0.5, -fontSize * 2);
        col.speed = rand(CONFIG.minSpeed, CONFIG.maxSpeed);
        col.trail = Math.round(rand(CONFIG.minTrail, CONFIG.maxTrail));
        col.token = pick();
        col.tintIdx = Math.floor(Math.random() * TINTS.length);
      }
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.shadowColor = 'transparent';
  };

  const drawStatic = () => {
    stop();
    const theme = getTheme();
    ctx.fillStyle = theme.trail;
    ctx.fillRect(0, 0, W, H);
    ctx.font = `600 ${fontSize}px "Fira Code","Source Code Pro",monospace`;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    columns.forEach((col, i) => {
      if (Math.random() > CONFIG.staticDensity) return;
      const token = TOKENS[i % TOKENS.length];
      const y = rand(0, Math.max(fontSize, H - fontSize));
      ctx.globalAlpha = 0.44; ctx.fillStyle = theme.color; ctx.shadowBlur = 0;
      ctx.fillText(token, col.x, y);
    });
    ctx.globalAlpha = 1;
  };

  const loop = (ts) => {
    if (reduceMotion.matches) { drawStatic(); return; }
    const delta = ts - lastTs;
    if (delta >= 16) {
      lastTs = ts - Math.min(delta, CONFIG.maxDelta) * 0.08;
      drawFrame(ts);
    }
    rafId = requestAnimationFrame(loop);
  };

  const stop  = () => { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } };
  const start = () => { stop(); if (reduceMotion.matches) { drawStatic(); return; } lastTs = performance.now(); rafId = requestAnimationFrame(loop); };
  const refresh = () => { setup(); start(); };
  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(refresh, 120); };

  /* ── Gating par thème : la pluie est cachée en light mode (display:none).
       On stoppe carrément le rAF pour rendre cette CPU à la page. */
  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
  const sync = () => { isLight() ? stop() : refresh(); };

  sync();
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden || isLight()) ? stop() : start());
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(onResize); ro.observe(canvas); }
  const rml = reduceMotion.addEventListener ? reduceMotion.addEventListener.bind(reduceMotion) : reduceMotion.addListener.bind(reduceMotion);
  (rml)('change', sync);

  const themeObs = new MutationObserver(sync);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
