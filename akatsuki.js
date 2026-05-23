/* ══════════════════════════════════════════════════════════════
   AKATSUKI SKY — Nuages, corbeaux, pétales de sakura, étoiles filantes
   Ambiance japonaise « Akatsuki » (暁 = aube) pour le portfolio.
   ══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let sky = null;
  let cloudsLayer = null, crowsLayer = null, petalsLayer = null, starsLayer = null;
  let crows = [], petals = [], resizeTimer = null;
  let isPaused = document.hidden;
  let starInterval = null;
  let parallaxRAF = null, lastScrollY = window.scrollY;

  const rand  = (min, max) => Math.random() * (max - min) + min;
  const randI = (min, max) => Math.floor(rand(min, max + 1));

  /* ── Profil viewport (densités adaptatives) ──────────── */
  const vp = () => {
    const w = window.innerWidth || doc.clientWidth || 1280;
    if (w <= 560)  return { clouds: 2, crowGroups: 2, groupSize: [1,1], petals: 6,  starEvery: 22000 };
    if (w <= 960)  return { clouds: 4, crowGroups: 3, groupSize: [1,2], petals: 10, starEvery: 16000 };
    if (w <= 1400) return { clouds: 6, crowGroups: 5, groupSize: [1,2], petals: 14, starEvery: 12000 };
    return            { clouds: 8, crowGroups: 7, groupSize: [1,3], petals: 20, starEvery: 9000  };
  };

  /* ── Préparation du ciel ─────────────────────────────── */
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
    cloudsLayer = ensureLayer('akatsuki-clouds');
    crowsLayer  = ensureLayer('akatsuki-crows');
    petalsLayer = ensureLayer('akatsuki-petals');
    starsLayer  = ensureLayer('akatsuki-stars');
  };

  /* ─────────────────────────────────────────────────────
     NUAGES — variété de profondeur & dérive multi-axes
     ───────────────────────────────────────────────────── */
  const buildCloud = (i, total) => {
    const el = document.createElement('span');
    el.className = 'akatsuki-cloud';

    const sector = (i / total) * 100;
    const left   = Math.min(85, Math.max(-8, sector + rand(-14, 14)));
    const top    = rand(4, 86);

    const depth  = rand(0, 1);
    const scale  = 0.72 + depth * 0.78;        /* 0.72 → 1.50 */
    const opac   = 0.65 + depth * 0.30;        /* 0.65 → 0.95 (vraiment visibles) */
    const dur    = 54 - depth * 28;

    el.style.setProperty('--cloud-top',      `${top.toFixed(1)}%`);
    el.style.setProperty('--cloud-left',     `${left.toFixed(1)}%`);
    el.style.setProperty('--cloud-scale',    scale.toFixed(2));
    el.style.setProperty('--cloud-opacity',  opac.toFixed(2));
    el.style.setProperty('--cloud-duration', `${dur.toFixed(1)}s`);
    el.style.setProperty('--cloud-delay',    `${(-rand(0, dur * 0.9)).toFixed(1)}s`);
    el.style.setProperty('--cloud-drift-x',  `${rand(10, 40).toFixed(0)}px`);
    el.style.setProperty('--cloud-drift-y',  `${rand(4, 16).toFixed(0)}px`);
    el.style.setProperty('--cloud-parallax', depth.toFixed(2));
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

  /* ─────────────────────────────────────────────────────
     CORBEAUX — vol naturel, formation en V occasionnelle
     ───────────────────────────────────────────────────── */
  const flightProfile = (offsetPct = 0) => {
    const ltr = Math.random() > 0.42;
    const dur  = rand(18, 36);
    return {
      top:       rand(4, 90) + offsetPct,
      duration:  dur,
      delay:     rand(-dur, 0),
      drift:     rand(-14, 14),
      scale:     rand(0.65, 1.20),
      opacity:   rand(0.78, 1.0),
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

  const buildCrow = (baseTop = null, baseProfile = null) => {
    const el = document.createElement('span');
    el.className = 'akatsuki-crow';
    const p = baseProfile ? { ...baseProfile } : flightProfile();
    if (baseTop !== null) p.top = baseTop;
    applyProfile(el, p);
    el.innerHTML = '<span class="akatsuki-crow__wing"></span><span class="akatsuki-crow__wing"></span>';
    el.addEventListener('animationiteration', () => {
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
      const formation = n > 1 && Math.random() < 0.35; /* 35% des groupes en formation */
      const baseProfile = formation ? flightProfile() : null;
      const baseTop = rand(4, 90);

      for (let k = 0; k < n; k++) {
        const offset = n > 1 ? rand(-2.2, 2.2) * k : 0;
        const crow = buildCrow(baseTop + offset, formation ? baseProfile : null);
        const curDelay = parseFloat(crow.style.getPropertyValue('--delay')) || 0;
        crow.style.setProperty('--delay', `${(curDelay + k * rand(0.4, 1.2)).toFixed(2)}s`);
        crows.push(crow);
        frag.appendChild(crow);
      }
    }

    crowsLayer.appendChild(frag);
    setPaused(isPaused);
  };

  /* ─────────────────────────────────────────────────────
     PÉTALES DE SAKURA — touche japonaise
     ───────────────────────────────────────────────────── */
  const buildPetal = () => {
    const el = document.createElement('span');
    el.className = 'akatsuki-petal';

    const startLeft = rand(-5, 110);
    const drift     = rand(-30, 30);
    const dur       = rand(14, 26);
    const delay     = rand(-dur, 0);
    const scale     = rand(0.65, 1.15);
    const opacity   = rand(0.45, 0.78);
    const spin      = rand(2.4, 5.2);
    const tilt      = rand(-30, 30);

    el.style.setProperty('--petal-left',    `${startLeft.toFixed(1)}vw`);
    el.style.setProperty('--petal-drift',   `${drift.toFixed(1)}vw`);
    el.style.setProperty('--petal-duration', `${dur.toFixed(1)}s`);
    el.style.setProperty('--petal-delay',    `${delay.toFixed(1)}s`);
    el.style.setProperty('--petal-scale',    scale.toFixed(2));
    el.style.setProperty('--petal-opacity',  opacity.toFixed(2));
    el.style.setProperty('--petal-spin',     `${spin.toFixed(2)}s`);
    el.style.setProperty('--petal-tilt',     `${tilt.toFixed(1)}deg`);
    return el;
  };

  const buildPetals = () => {
    ensureSky();
    petals.forEach(p => p.remove());
    petals = [];
    if (reduceMotion.matches) return;

    const { petals: count } = vp();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = buildPetal();
      petals.push(p);
      frag.appendChild(p);
    }
    petalsLayer.appendChild(frag);
    setPaused(isPaused);
  };

  /* ─────────────────────────────────────────────────────
     ÉTOILES FILANTES — flash diagonal occasionnel
     ───────────────────────────────────────────────────── */
  const spawnShootingStar = () => {
    if (!starsLayer || isPaused || reduceMotion.matches) return;

    const star = document.createElement('span');
    star.className = 'akatsuki-shooting-star';

    /* Apparait dans la moitié haute, diagonale ↘ */
    const top  = rand(2, 45);
    const left = rand(-5, 60);
    const len  = rand(120, 280);
    const dur  = rand(0.9, 1.6);
    const ang  = rand(18, 32);

    star.style.setProperty('--star-top',  `${top.toFixed(1)}%`);
    star.style.setProperty('--star-left', `${left.toFixed(1)}vw`);
    star.style.setProperty('--star-len',  `${len.toFixed(0)}px`);
    star.style.setProperty('--star-duration', `${dur.toFixed(2)}s`);
    star.style.setProperty('--star-angle', `${ang.toFixed(1)}deg`);

    starsLayer.appendChild(star);
    setTimeout(() => star.remove(), (dur + 0.2) * 1000);
  };

  const scheduleStars = () => {
    if (starInterval) { clearInterval(starInterval); starInterval = null; }
    if (reduceMotion.matches) return;
    const { starEvery } = vp();
    /* Premier décalé, puis cadence aléatoire ±40% */
    setTimeout(spawnShootingStar, rand(2000, 6000));
    starInterval = setInterval(() => {
      if (!isPaused && Math.random() > 0.25) spawnShootingStar();
    }, starEvery);
  };

  /* ─────────────────────────────────────────────────────
     PARALLAXE LÉGÈRE SUR LE SCROLL (nuages uniquement)
     ───────────────────────────────────────────────────── */
  const updateParallax = () => {
    parallaxRAF = null;
    if (!cloudsLayer || reduceMotion.matches) return;
    const dy = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    if (Math.abs(dy) < 0.5) return;
    /* Mouvement contrarié, chaque nuage selon sa profondeur */
    cloudsLayer.style.transform = `translate3d(0, ${(-window.scrollY * 0.04).toFixed(1)}px, 0)`;
    petalsLayer.style.transform = `translate3d(0, ${(-window.scrollY * 0.02).toFixed(1)}px, 0)`;
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
    sky.querySelectorAll('.akatsuki-cloud,.akatsuki-crow,.akatsuki-crow__wing,.akatsuki-petal,.akatsuki-shooting-star')
       .forEach(el => { el.style.animationPlayState = state; });
  };

  const rebuild = () => {
    buildClouds();
    buildCrows();
    buildPetals();
    scheduleStars();
  };

  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(rebuild, 150); };

  /* ── Démarrage ────────────────────────────────────────── */
  ensureSky();
  rebuild();
  setPaused(document.hidden);

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));
  const on = reduceMotion.addEventListener ? reduceMotion.addEventListener.bind(reduceMotion) : reduceMotion.addListener.bind(reduceMotion);
  on('change', rebuild);
})();
