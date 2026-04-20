(() => {
  'use strict';

  const doc = document.documentElement;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let sky = null;
  let cloudsLayer = null;
  let crowsLayer = null;
  let crows = [];
  let resizeTimer = null;
  let isPaused = document.hidden;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;
  const randomInt = (min, max) => Math.floor(randomBetween(min, max + 1));

  const getViewportProfile = () => {
    const width = window.innerWidth || doc.clientWidth || 1280;

    if (width <= 560) {
      return { cloudCount: 2, crowCount: 3 };
    }

    if (width <= 960) {
      return { cloudCount: 3, crowCount: 5 };
    }

    return { cloudCount: 4, crowCount: 8 };
  };

  const ensureSky = () => {
    sky = document.querySelector('.akatsuki-sky');
    if (!sky) {
      sky = document.createElement('div');
      sky.className = 'akatsuki-sky';
      sky.setAttribute('aria-hidden', 'true');

      const background = document.querySelector('.cyber-background');
      if (background && background.parentNode) {
        background.insertAdjacentElement('afterend', sky);
      } else {
        document.body.prepend(sky);
      }
    }

    cloudsLayer = sky.querySelector('.akatsuki-clouds');
    if (!cloudsLayer) {
      cloudsLayer = document.createElement('div');
      cloudsLayer.className = 'akatsuki-clouds';
      sky.appendChild(cloudsLayer);
    }

    crowsLayer = sky.querySelector('.akatsuki-crows');
    if (!crowsLayer) {
      crowsLayer = document.createElement('div');
      crowsLayer.className = 'akatsuki-crows';
      sky.appendChild(crowsLayer);
    }
  };

  const buildCloud = (index) => {
    const cloud = document.createElement('span');
    cloud.className = 'akatsuki-cloud';
    cloud.style.setProperty('--cloud-top', `${randomBetween(6, 84).toFixed(1)}%`);
    cloud.style.setProperty('--cloud-left', `${randomBetween(-8, 82).toFixed(1)}%`);
    cloud.style.setProperty('--cloud-scale', randomBetween(0.78, 1.18).toFixed(2));
    cloud.style.setProperty('--cloud-opacity', randomBetween(0.16, 0.34).toFixed(2));
    cloud.style.setProperty('--cloud-duration', `${randomBetween(26, 42).toFixed(1)}s`);
    cloud.style.setProperty('--cloud-delay', `${(-randomBetween(0, 18)).toFixed(1)}s`);
    cloud.dataset.index = String(index + 1);
    return cloud;
  };

  const buildClouds = () => {
    ensureSky();
    const { cloudCount } = getViewportProfile();
    cloudsLayer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < cloudCount; index += 1) {
      fragment.appendChild(buildCloud(index));
    }
    cloudsLayer.appendChild(fragment);
  };

  const createFlightProfile = () => {
    const leftToRight = Math.random() > 0.45;
    const duration = randomBetween(20, 34);
    return {
      top: randomBetween(4, 92),
      duration,
      delay: randomBetween(-duration, 0),
      drift: randomBetween(-12, 12),
      scale: randomBetween(0.42, 0.92),
      opacity: randomBetween(0.12, 0.24),
      wingSpeed: Math.max(0.7, duration / randomBetween(11, 16)),
      startX: leftToRight ? '-10vw' : '110vw',
      midX: `${randomBetween(26, 74).toFixed(1)}vw`,
      endX: leftToRight ? '110vw' : '-10vw',
      direction: leftToRight ? 1 : -1
    };
  };

  const applyFlightProfile = (crow, profile) => {
    crow.style.setProperty('--top', `${profile.top.toFixed(1)}%`);
    crow.style.setProperty('--duration', `${profile.duration.toFixed(1)}s`);
    crow.style.setProperty('--delay', `${profile.delay.toFixed(1)}s`);
    crow.style.setProperty('--drift', `${profile.drift.toFixed(1)}vh`);
    crow.style.setProperty('--scale', profile.scale.toFixed(2));
    crow.style.setProperty('--opacity', profile.opacity.toFixed(2));
    crow.style.setProperty('--wing-speed', `${profile.wingSpeed.toFixed(2)}s`);
    crow.style.setProperty('--start-x', profile.startX);
    crow.style.setProperty('--mid-x', profile.midX);
    crow.style.setProperty('--end-x', profile.endX);
    crow.style.setProperty('--direction', String(profile.direction));
  };

  const buildCrow = () => {
    const crow = document.createElement('span');
    crow.className = 'akatsuki-crow';
    crow.innerHTML = '<span class="akatsuki-crow__wing"></span><span class="akatsuki-crow__wing"></span>';
    applyFlightProfile(crow, createFlightProfile());
    crow.addEventListener('animationiteration', () => {
      if (!isPaused) {
        applyFlightProfile(crow, createFlightProfile());
      }
    });
    return crow;
  };

  const clearCrows = () => {
    crows.forEach((crow) => crow.remove());
    crows = [];
  };

  const buildCrows = () => {
    ensureSky();
    clearCrows();

    if (reduceMotionQuery.matches) {
      return;
    }

    const { crowCount } = getViewportProfile();
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < crowCount; index += 1) {
      const crow = buildCrow();
      crows.push(crow);
      fragment.appendChild(crow);
    }

    crowsLayer.appendChild(fragment);
    setPausedState(isPaused);
  };

  const setPausedState = (paused) => {
    isPaused = paused;
    if (!sky) return;

    sky.dataset.paused = paused ? 'true' : 'false';
    const state = paused ? 'paused' : 'running';
    [...sky.querySelectorAll('.akatsuki-cloud, .akatsuki-crow, .akatsuki-crow__wing')]
      .forEach((element) => {
        element.style.animationPlayState = state;
      });
  };

  const rebuild = () => {
    buildClouds();
    buildCrows();
  };

  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(rebuild, 140);
  };

  const handleVisibilityChange = () => {
    setPausedState(document.hidden);
  };

  ensureSky();
  rebuild();
  handleVisibilityChange();

  window.addEventListener('resize', handleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', rebuild);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(rebuild);
  }
})();
