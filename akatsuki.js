/* ══════════════════════════════════════════════════════════════
   AKATSUKI SKY — 暁
   Ambiance de l'organisation Akatsuki (Naruto) :
   • Ciel nocturne pourpre/charbon avec brume
   • Lune rouge sang style anime (cratères + halo + scintillement)
   • Nuages rouges « Akatsuki » (forme cumulus stylisée signature)
   • Corbeaux d'Itachi (vol naturel, dispersion en plumes occasionnelle)
   • Particules de cendres rouges qui montent lentement

   API publique : window.AkatsukiSky.{ destroy, rebuild, pause, resume }
   ══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  if (window.AkatsukiSky?.__mounted) return; // garde anti double-init

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // SVG namespace
  const SVG_NS = 'http://www.w3.org/2000/svg';

  let sky = null;
  let moonLayer = null, fogLayer = null, cloudsLayer = null, crowsLayer = null, embersLayer = null;
  let crows = [], embers = [], resizeTimer = null;
  let isPaused = document.hidden;
  let parallaxRAF = null;
  let mounted = false;

  const rand  = (min, max) => Math.random() * (max - min) + min;
  const randI = (min, max) => Math.floor(rand(min, max + 1));
  const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ── Profil viewport (densités adaptatives) ──────────── */
  const vp = () => {
    const w = window.innerWidth || doc.clientWidth || 1280;
    if (w <= 560)  return { clouds: 3,  crowGroups: 2, groupSize: [1, 1], embers: 14, moonScale: 0.72 };
    if (w <= 960)  return { clouds: 5,  crowGroups: 3, groupSize: [1, 2], embers: 22, moonScale: 0.85 };
    if (w <= 1400) return { clouds: 7,  crowGroups: 4, groupSize: [1, 2], embers: 32, moonScale: 1.00 };
    return            { clouds: 10, crowGroups: 6, groupSize: [1, 3], embers: 46, moonScale: 1.10 };
  };

  /* ─────────────────────────────────────────────────────
     PRÉPARATION DU CIEL
     ───────────────────────────────────────────────────── */
  const ensureSky = () => {
    sky = document.querySelector('.akatsuki-sky');
    if (!sky) {
      sky = document.createElement('div');
      sky.className = 'akatsuki-sky';
      sky.setAttribute('aria-hidden', 'true');
      const bg = document.querySelector('.cyber-background');
      if (bg?.parentNode) bg.insertAdjacentElement('afterend', sky);
      else document.body.prepend(sky);
    }

    const ensureLayer = (cls) => {
      let el = sky.querySelector('.' + cls);
      if (!el) { el = document.createElement('div'); el.className = cls; sky.appendChild(el); }
      return el;
    };
    // Ordre = z-index naturel
    moonLayer   = ensureLayer('akatsuki-moon-layer');
    fogLayer    = ensureLayer('akatsuki-fog');
    cloudsLayer = ensureLayer('akatsuki-clouds');
    crowsLayer  = ensureLayer('akatsuki-crows');
    embersLayer = ensureLayer('akatsuki-embers');
  };

  /* ─────────────────────────────────────────────────────
     LUNE ROUGE — style anime (Akatsuki / Tsukuyomi)
     SVG avec : disque, cratères, halo bicolore, scintillement
     ───────────────────────────────────────────────────── */
  const buildMoon = () => {
    if (!moonLayer) return;
    moonLayer.innerHTML = '';

    const { moonScale } = vp();
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'akatsuki-moon');
    svg.setAttribute('viewBox', '-100 -100 200 200');
    svg.setAttribute('xmlns', SVG_NS);
    svg.style.setProperty('--moon-scale', moonScale.toFixed(2));

    // defs : dégradés et filtres
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <radialGradient id="moonBody" cx="42%" cy="38%" r="75%">
        <stop offset="0%"  stop-color="#ffb199" stop-opacity="1"/>
        <stop offset="35%" stop-color="#ff5a3c" stop-opacity="1"/>
        <stop offset="78%" stop-color="#a8170d" stop-opacity="1"/>
        <stop offset="100%" stop-color="#5a0a08" stop-opacity="1"/>
      </radialGradient>
      <radialGradient id="moonHaloInner" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stop-color="#ff3a1f" stop-opacity="0.55"/>
        <stop offset="55%" stop-color="#c4150a" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#3a0604" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="moonHaloOuter" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stop-color="#ff2a14" stop-opacity="0.22"/>
        <stop offset="60%" stop-color="#6e0a06" stop-opacity="0.07"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4"/>
      </filter>
    `;
    svg.appendChild(defs);

    // Halos
    const haloOuter = document.createElementNS(SVG_NS, 'circle');
    haloOuter.setAttribute('r', '95'); haloOuter.setAttribute('cx', '0'); haloOuter.setAttribute('cy', '0');
    haloOuter.setAttribute('fill', 'url(#moonHaloOuter)');
    haloOuter.setAttribute('class', 'akatsuki-moon__halo-outer');
    svg.appendChild(haloOuter);

    const haloInner = document.createElementNS(SVG_NS, 'circle');
    haloInner.setAttribute('r', '72'); haloInner.setAttribute('cx', '0'); haloInner.setAttribute('cy', '0');
    haloInner.setAttribute('fill', 'url(#moonHaloInner)');
    haloInner.setAttribute('class', 'akatsuki-moon__halo-inner');
    svg.appendChild(haloInner);

    // Corps de la lune
    const body = document.createElementNS(SVG_NS, 'circle');
    body.setAttribute('r', '48'); body.setAttribute('cx', '0'); body.setAttribute('cy', '0');
    body.setAttribute('fill', 'url(#moonBody)');
    body.setAttribute('class', 'akatsuki-moon__body');
    svg.appendChild(body);

    // Cratères (mares lunaires) — taches sombres semi-transparentes
    const craters = [
      { cx: -14, cy: -10, r: 7.5, o: 0.28 },
      { cx:  18, cy:   6, r: 5.5, o: 0.24 },
      { cx:  -6, cy:  18, r: 4.2, o: 0.22 },
      { cx:  22, cy: -16, r: 3.4, o: 0.20 },
      { cx: -22, cy:   8, r: 3.0, o: 0.18 },
      { cx:   8, cy:  22, r: 2.6, o: 0.20 },
      { cx:  -2, cy:  -2, r: 2.0, o: 0.18 },
      { cx:  14, cy: -22, r: 2.2, o: 0.18 }
    ];
    craters.forEach(c => {
      const cr = document.createElementNS(SVG_NS, 'circle');
      cr.setAttribute('cx', c.cx); cr.setAttribute('cy', c.cy); cr.setAttribute('r', c.r);
      cr.setAttribute('fill', '#3a0604');
      cr.setAttribute('opacity', c.o);
      cr.setAttribute('filter', 'url(#moonGlow)');
      svg.appendChild(cr);
    });

    // Liseré bord (terminator subtil)
    const rim = document.createElementNS(SVG_NS, 'circle');
    rim.setAttribute('r', '48'); rim.setAttribute('cx', '0'); rim.setAttribute('cy', '0');
    rim.setAttribute('fill', 'none');
    rim.setAttribute('stroke', '#ff8a6a');
    rim.setAttribute('stroke-opacity', '0.35');
    rim.setAttribute('stroke-width', '0.6');
    svg.appendChild(rim);

    moonLayer.appendChild(svg);
  };

  /* ─────────────────────────────────────────────────────
     NUAGES ROUGES AKATSUKI — la signature visuelle
     Forme : cumulus stylisé (plusieurs cercles soudés)
     comme sur les manteaux de l'organisation
     ───────────────────────────────────────────────────── */
  const buildCloudSVG = () => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 120');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('class', 'akatsuki-cloud__svg');

    const defs = document.createElementNS(SVG_NS, 'defs');
    const gradId = 'cloudGrad_' + Math.random().toString(36).slice(2, 8);
    defs.innerHTML = `
      <radialGradient id="${gradId}" cx="45%" cy="40%" r="65%">
        <stop offset="0%"  stop-color="#ff6b52" stop-opacity="0.95"/>
        <stop offset="55%" stop-color="#c41e1e" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#6e0a06" stop-opacity="0.85"/>
      </radialGradient>
    `;
    svg.appendChild(defs);

    // Forme cumulus signature Akatsuki : 5-7 cercles soudés + base plate légère
    // Variantes pour éviter la monotonie
    const variants = [
      'M30,75 Q22,55 40,48 Q42,28 65,32 Q72,14 95,22 Q108,8 130,22 Q150,16 158,38 Q176,42 170,62 Q182,80 162,86 Q150,98 130,90 Q108,102 92,90 Q72,100 58,88 Q38,92 30,75 Z',
      'M28,78 Q18,58 38,50 Q40,30 60,34 Q70,16 92,24 Q108,10 128,24 Q148,18 158,40 Q178,46 168,66 Q180,84 158,88 Q146,98 126,92 Q108,104 90,92 Q74,102 56,90 Q38,94 28,78 Z',
      'M32,72 Q20,52 42,46 Q44,26 68,30 Q76,12 96,22 Q112,6 134,22 Q154,16 160,40 Q180,48 168,66 Q180,82 156,88 Q142,100 122,92 Q104,104 86,92 Q68,100 54,86 Q36,88 32,72 Z'
    ];
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pick(variants));
    path.setAttribute('fill', `url(#${gradId})`);
    path.setAttribute('stroke', '#3a0604');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-opacity', '0.55');
    svg.appendChild(path);

    return svg;
  };

  const buildCloud = (i, total) => {
    const el = document.createElement('span');
    el.className = 'akatsuki-cloud';

    const sector = (i / total) * 100;
    const left   = Math.min(92, Math.max(-10, sector + rand(-12, 12)));
    const top    = rand(4, 72);

    const depth  = rand(0, 1);
    const scale  = 0.55 + depth * 0.95;        /* 0.55 → 1.50 */
    const opac   = 0.55 + depth * 0.40;        /* 0.55 → 0.95 */
    const dur    = 78 - depth * 38;            /* nuages Akatsuki = lents et menaçants */
    const flip   = Math.random() > 0.5 ? -1 : 1;

    el.style.setProperty('--cloud-top',      `${top.toFixed(1)}%`);
    el.style.setProperty('--cloud-left',     `${left.toFixed(1)}%`);
    el.style.setProperty('--cloud-scale',    scale.toFixed(2));
    el.style.setProperty('--cloud-flip',     String(flip));
    el.style.setProperty('--cloud-opacity',  opac.toFixed(2));
    el.style.setProperty('--cloud-duration', `${dur.toFixed(1)}s`);
    el.style.setProperty('--cloud-delay',    `${(-rand(0, dur * 0.9)).toFixed(1)}s`);
    el.style.setProperty('--cloud-drift-y',  `${rand(6, 18).toFixed(0)}px`);
    el.dataset.depth = depth.toFixed(2);

    el.appendChild(buildCloudSVG());
    return el;
  };

  const buildClouds = () => {
    ensureSky();
    const { clouds } = vp();
    cloudsLayer.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < clouds; i++) frag.appendChild(buildCloud(i, clouds));
    cloudsLayer.appendChild(frag);
  };

  /* ─────────────────────────────────────────────────────
     CORBEAUX D'ITACHI — vol naturel
     ───────────────────────────────────────────────────── */
  const flightProfile = (offsetPct = 0) => {
    const ltr = Math.random() > 0.42;
    const dur  = rand(20, 38);
    return {
      top:       rand(8, 78) + offsetPct,
      duration:  dur,
      delay:     rand(-dur, 0),
      drift:     rand(-12, 12),
      scale:     rand(0.65, 1.25),
      opacity:   rand(0.82, 1.0),
      wingSpeed: Math.max(0.55, dur / rand(11, 17)),
      startX:    ltr ? '-12vw' : '112vw',
      endX:      ltr ? '112vw' : '-12vw',
      direction: ltr ? 1 : -1
    };
  };

  const applyProfile = (el, p) => {
    el.style.setProperty('--top',        `${p.top.toFixed(1)}%`);
    el.style.setProperty('--duration',   `${p.duration.toFixed(1)}s`);
    el.style.setProperty('--delay',      `${p.delay.toFixed(1)}s`);
    el.style.setProperty('--drift',      `${p.drift.toFixed(1)}vh`);
    el.style.setProperty('--scale',       p.scale.toFixed(2));
    el.style.setProperty('--opacity',     p.opacity.toFixed(2));
    el.style.setProperty('--wing-speed', `${p.wingSpeed.toFixed(2)}s`);
    el.style.setProperty('--start-x',    p.startX);
    el.style.setProperty('--end-x',      p.endX);
    el.style.setProperty('--direction',   String(p.direction));
  };

  const buildCrow = (baseTop = null, baseProfile = null) => {
    const el = document.createElement('span');
    el.className = 'akatsuki-crow';
    const p = baseProfile ? { ...baseProfile } : flightProfile();
    if (baseTop !== null) p.top = baseTop;
    applyProfile(el, p);
    // Silhouette : 2 ailes via pseudo-elements + corps central
    el.innerHTML = `
      <span class="akatsuki-crow__body"></span>
      <span class="akatsuki-crow__wing akatsuki-crow__wing--l"></span>
      <span class="akatsuki-crow__wing akatsuki-crow__wing--r"></span>
    `;
    el.addEventListener('animationiteration', (e) => {
      // Renouvelle uniquement quand c'est l'anim de vol (pas les ailes)
      if (e.animationName && e.animationName.indexOf('crow-fly') === -1) return;
      if (!isPaused) applyProfile(el, flightProfile());
    });
    return el;
  };

  const buildCrows = () => {
    ensureSky();
    crows.forEach(c => c.remove());
    crows = [];
    if (reduceMotion.matches) return;

    const { crowGroups, groupSize: [gMin, gMax] } = vp();
    const frag = document.createDocumentFragment();

    for (let g = 0; g < crowGroups; g++) {
      const n = randI(gMin, gMax);
      const formation = n > 1 && Math.random() < 0.4;
      const baseProfile = formation ? flightProfile() : null;
      const baseTop = rand(8, 78);

      for (let k = 0; k < n; k++) {
        const offset = n > 1 ? rand(-2.4, 2.4) * k : 0;
        const crow = buildCrow(baseTop + offset, formation ? baseProfile : null);
        const curDelay = parseFloat(crow.style.getPropertyValue('--delay')) || 0;
        crow.style.setProperty('--delay', `${(curDelay + k * rand(0.5, 1.4)).toFixed(2)}s`);
        crows.push(crow);
        frag.appendChild(crow);
      }
    }

    crowsLayer.appendChild(frag);
    setPaused(isPaused);
  };

  /* ─────────────────────────────────────────────────────
     CENDRES ROUGES — particules qui montent doucement
     (remplace pétales/étoiles, beaucoup plus thématique)
     ───────────────────────────────────────────────────── */
  const buildEmber = () => {
    const el = document.createElement('span');
    el.className = 'akatsuki-ember';

    const left    = rand(-2, 102);
    const drift   = rand(-22, 22);
    const dur     = rand(11, 22);
    const delay   = rand(-dur, 0);
    const scale   = rand(0.4, 1.1);
    const opacity = rand(0.35, 0.85);
    const hue     = rand(-8, 12); // variations sur le rouge

    el.style.setProperty('--ember-left',     `${left.toFixed(1)}vw`);
    el.style.setProperty('--ember-drift',    `${drift.toFixed(1)}vw`);
    el.style.setProperty('--ember-duration', `${dur.toFixed(1)}s`);
    el.style.setProperty('--ember-delay',    `${delay.toFixed(1)}s`);
    el.style.setProperty('--ember-scale',    scale.toFixed(2));
    el.style.setProperty('--ember-opacity',  opacity.toFixed(2));
    el.style.setProperty('--ember-hue',      `${hue.toFixed(0)}deg`);
    return el;
  };

  const buildEmbers = () => {
    ensureSky();
    embers.forEach(p => p.remove());
    embers = [];
    if (reduceMotion.matches) return;

    const { embers: count } = vp();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = buildEmber();
      embers.push(p);
      frag.appendChild(p);
    }
    embersLayer.appendChild(frag);
    setPaused(isPaused);
  };

  /* ─────────────────────────────────────────────────────
     PARALLAXE LÉGÈRE — nuages, lune, cendres
     ───────────────────────────────────────────────────── */
  const updateParallax = () => {
    parallaxRAF = null;
    if (reduceMotion.matches) return;
    const y = window.scrollY;
    if (moonLayer)   moonLayer.style.transform   = `translate3d(0, ${(-y * 0.08).toFixed(1)}px, 0)`;
    if (cloudsLayer) cloudsLayer.style.transform = `translate3d(0, ${(-y * 0.04).toFixed(1)}px, 0)`;
    if (embersLayer) embersLayer.style.transform = `translate3d(0, ${(-y * 0.02).toFixed(1)}px, 0)`;
    if (fogLayer)    fogLayer.style.transform    = `translate3d(0, ${(-y * 0.015).toFixed(1)}px, 0)`;
  };
  const onScroll = () => {
    if (parallaxRAF) return;
    parallaxRAF = requestAnimationFrame(updateParallax);
  };

  /* ─────────────────────────────────────────────────────
     ÉTATS / RECONSTRUCTION
     ───────────────────────────────────────────────────── */
  const setPaused = (p) => {
    isPaused = p;
    if (!sky) return;
    sky.dataset.paused = p ? 'true' : 'false';
    const state = p ? 'paused' : 'running';
    sky.querySelectorAll(
      '.akatsuki-cloud, .akatsuki-crow, .akatsuki-crow__wing, .akatsuki-ember, .akatsuki-moon, .akatsuki-moon__halo-inner, .akatsuki-moon__halo-outer, .akatsuki-fog'
    ).forEach(el => { el.style.animationPlayState = state; });
  };

  const rebuild = () => {
    buildMoon();
    buildClouds();
    buildCrows();
    buildEmbers();
  };

  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(rebuild, 180); };

  const destroy = () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    if (reduceMotion.removeEventListener) reduceMotion.removeEventListener('change', rebuild);
    else if (reduceMotion.removeListener) reduceMotion.removeListener(rebuild);
    if (sky) sky.remove();
    sky = moonLayer = fogLayer = cloudsLayer = crowsLayer = embersLayer = null;
    crows = []; embers = [];
    mounted = false;
    window.AkatsukiSky.__mounted = false;
  };

  const onVisibility = () => setPaused(document.hidden);

  /* ── Démarrage ────────────────────────────────────────── */
  ensureSky();
  rebuild();
  setPaused(document.hidden);
  mounted = true;

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  const onMQ = reduceMotion.addEventListener
    ? reduceMotion.addEventListener.bind(reduceMotion)
    : reduceMotion.addListener.bind(reduceMotion);
  onMQ('change', rebuild);

  // API publique
  window.AkatsukiSky = {
    __mounted: true,
    rebuild,
    destroy,
    pause:  () => setPaused(true),
    resume: () => setPaused(false)
  };
})();
