(() => {
  'use strict';

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let sky = null, cloudsLayer = null, crowsLayer = null;
  let crows = [], resizeTimer = null, isPaused = document.hidden;

  const rand  = (min, max) => Math.random() * (max - min) + min;
  const randI = (min, max) => Math.floor(rand(min, max + 1));

  const vp = () => {
    const w = window.innerWidth || doc.clientWidth || 1280;
    if (w <= 560)  return { clouds: 2,  crowGroups: 2, groupSize: [1,1] };
    if (w <= 960)  return { clouds: 4,  crowGroups: 4, groupSize: [1,2] };
    if (w <= 1400) return { clouds: 6,  crowGroups: 6, groupSize: [1,2] };
    return              { clouds: 8,  crowGroups: 8, groupSize: [1,3] };
  };

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
    if (!sky.querySelector('.akatsuki-clouds')) {
      cloudsLayer = document.createElement('div');
      cloudsLayer.className = 'akatsuki-clouds';
      sky.appendChild(cloudsLayer);
    } else { cloudsLayer = sky.querySelector('.akatsuki-clouds'); }
    if (!sky.querySelector('.akatsuki-crows')) {
      crowsLayer = document.createElement('div');
      crowsLayer.className = 'akatsuki-crows';
      sky.appendChild(crowsLayer);
    } else { crowsLayer = sky.querySelector('.akatsuki-crows'); }
  };

  /* ── Nuages avec variété de profondeur ───────────────── */
  const buildCloud = (i, total) => {
    const el = document.createElement('span');
    el.className = 'akatsuki-cloud';

    /* Colonnes réparties + décalage aléatoire */
    const sector = (i / total) * 100;
    const left   = Math.min(85, Math.max(-8, sector + rand(-14, 14)));
    const top    = rand(4, 86);

    /* Nuages "proches" (grands) vs "lointains" (petits, plus lents) */
    const depth  = rand(0, 1);
    const scale  = 0.58 + depth * 0.72;          /* 0.58 → 1.30 */
    const opac   = 0.12 + depth * 0.22;           /* 0.12 → 0.34 */
    const dur    = 54 - depth * 28;               /* 26s (proche) → 54s (loin) */

    el.style.setProperty('--cloud-top',      `${top.toFixed(1)}%`);
    el.style.setProperty('--cloud-left',     `${left.toFixed(1)}%`);
    el.style.setProperty('--cloud-scale',    scale.toFixed(2));
    el.style.setProperty('--cloud-opacity',  opac.toFixed(2));
    el.style.setProperty('--cloud-duration', `${dur.toFixed(1)}s`);
    el.style.setProperty('--cloud-delay',    `${(-rand(0, dur * 0.9)).toFixed(1)}s`);
    el.style.setProperty('--cloud-drift-x',  `${rand(10, 40).toFixed(0)}px`);
    el.style.setProperty('--cloud-drift-y',  `${rand(4, 16).toFixed(0)}px`);
    el.dataset.depth = depth.toFixed(2);
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

  /* ── Profil de vol corvid ─────────────────────────────── */
  const flightProfile = (offsetPct = 0) => {
    const ltr = Math.random() > 0.42;
    const dur  = rand(18, 36);
    return {
      top:       rand(4, 90) + offsetPct,
      duration:  dur,
      delay:     rand(-dur, 0),
      drift:     rand(-14, 14),
      scale:     rand(0.38, 0.95),
      opacity:   rand(0.10, 0.26),
      wingSpeed: Math.max(0.6, dur / rand(10, 16)),
      startX:    ltr ? '-10vw' : '110vw',
      midX:      `${rand(24, 76).toFixed(1)}vw`,
      endX:      ltr ? '110vw' : '-10vw',
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
    el.style.setProperty('--mid-x',      p.midX);
    el.style.setProperty('--end-x',      p.endX);
    el.style.setProperty('--direction',   String(p.direction));
  };

  /* Corbeau simple */
  const buildCrow = (baseTop = null) => {
    const el = document.createElement('span');
    el.className = 'akatsuki-crow';
    const p = flightProfile();
    if (baseTop !== null) p.top = baseTop;
    applyProfile(el, p);
    el.innerHTML = '<span class="akatsuki-crow__wing"></span><span class="akatsuki-crow__wing"></span>';
    /* Re-randomise à chaque cycle */
    el.addEventListener('animationiteration', () => {
      if (!isPaused) applyProfile(el, flightProfile());
    });
    return el;
  };

  /* ── Construction groupes ───────────────────────────── */
  const buildCrows = () => {
    ensureSky();
    crows.forEach(c => c.remove());
    crows = [];
    if (reduceMotion.matches) return;

    const { crowGroups, groupSize: [gMin, gMax] } = vp();
    const frag = document.createDocumentFragment();

    for (let g = 0; g < crowGroups; g++) {
      const n = randI(gMin, gMax);
      const baseTop = rand(4, 90);
      for (let k = 0; k < n; k++) {
        /* Les corbeaux d'un même groupe volent proches */
        const offset = n > 1 ? rand(-3, 3) * k : 0;
        const crow = buildCrow(baseTop + offset);
        /* Petit décalage de délai dans le groupe */
        const curDelay = parseFloat(crow.style.getPropertyValue('--delay')) || 0;
        crow.style.setProperty('--delay', `${(curDelay + k * rand(0.4, 1.2)).toFixed(2)}s`);
        crows.push(crow);
        frag.appendChild(crow);
      }
    }

    crowsLayer.appendChild(frag);
    setPaused(isPaused);
  };

  const setPaused = (p) => {
    isPaused = p;
    if (!sky) return;
    sky.dataset.paused = p ? 'true' : 'false';
    const state = p ? 'paused' : 'running';
    sky.querySelectorAll('.akatsuki-cloud,.akatsuki-crow,.akatsuki-crow__wing')
       .forEach(el => { el.style.animationPlayState = state; });
  };

  const rebuild = () => { buildClouds(); buildCrows(); };
  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(rebuild, 150); };

  ensureSky();
  rebuild();
  setPaused(document.hidden);

  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));
  const on = reduceMotion.addEventListener ? reduceMotion.addEventListener.bind(reduceMotion) : reduceMotion.addListener.bind(reduceMotion);
  on('change', rebuild);
})();
