(() => {
  'use strict';

  const container = document.querySelector('.akatsuki-crows');
  if (!container) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const crows = [];

  const CONFIG = {
    count: 14,
    topMin: -6,
    topMax: 96,
    durationMin: 22,
    durationMax: 38,
    driftMin: -14,
    driftMax: 14,
    scaleMin: 0.35,
    scaleMax: 0.85,
    midXMin: 28,
    midXMax: 72,
    directionBias: 0.4,
    wingDivisorMin: 12,
    wingDivisorMax: 18
  };

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const createFlightProfile = () => {
    const duration = randomBetween(CONFIG.durationMin, CONFIG.durationMax);
    const leftToRight = Math.random() > CONFIG.directionBias;

    return {
      top: randomBetween(CONFIG.topMin, CONFIG.topMax),
      duration,
      delay: randomBetween(-duration, 0),
      drift: randomBetween(CONFIG.driftMin, CONFIG.driftMax),
      scale: randomBetween(CONFIG.scaleMin, CONFIG.scaleMax),
      direction: leftToRight ? 1 : -1,
      startX: leftToRight ? '-14vw' : '114vw',
      midX: `${randomBetween(CONFIG.midXMin, CONFIG.midXMax)}vw`,
      endX: leftToRight ? '114vw' : '-14vw',
      wingSpeed: Math.max(0.55, duration / randomBetween(CONFIG.wingDivisorMin, CONFIG.wingDivisorMax))
    };
  };

  const applyFlightProfile = (crow, profile) => {
    crow.style.setProperty('--top', `${profile.top.toFixed(1)}%`);
    crow.style.setProperty('--duration', `${profile.duration.toFixed(1)}s`);
    crow.style.setProperty('--delay', `${profile.delay.toFixed(1)}s`);
    crow.style.setProperty('--drift', `${profile.drift.toFixed(1)}vh`);
    crow.style.setProperty('--scale', profile.scale.toFixed(2));
    crow.style.setProperty('--direction', String(profile.direction));
    crow.style.setProperty('--start-x', profile.startX);
    crow.style.setProperty('--mid-x', profile.midX);
    crow.style.setProperty('--end-x', profile.endX);
    crow.style.setProperty('--wing-speed', `${profile.wingSpeed.toFixed(2)}s`);
  };

  const refreshCrowMotion = (crow) => {
    const profile = createFlightProfile();
    applyFlightProfile(crow, profile);
  };

  const buildCrow = () => {
    const crow = document.createElement('span');
    crow.className = 'akatsuki-crow';
    crow.setAttribute('aria-hidden', 'true');

    crow.innerHTML = `
      <span class="akatsuki-crow__wing"></span>
      <span class="akatsuki-crow__wing"></span>
    `;

    refreshCrowMotion(crow);
    crow.addEventListener('animationiteration', () => refreshCrowMotion(crow));

    return crow;
  };

  const clearCrows = () => {
    while (crows.length > 0) {
      const crow = crows.pop();
      if (crow) crow.remove();
    }
  };

  const renderCrows = () => {
    if (motionQuery.matches || crows.length > 0) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < CONFIG.count; i += 1) {
      const crow = buildCrow();
      crows.push(crow);
      fragment.appendChild(crow);
    }

    container.appendChild(fragment);
  };

  const handleMotionPreference = (event) => {
    if (event.matches) {
      clearCrows();
      return;
    }

    renderCrows();
  };

  renderCrows();

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionPreference);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(handleMotionPreference);
  }
})();
