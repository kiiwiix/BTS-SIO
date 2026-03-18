(() => {
  'use strict';

  const canvas = document.getElementById('code-rain');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CONFIG = {
    characters: '0123456789<>[]{}/*#=+-_%$ABCDEF',
    minFontSize: 14,
    maxFontSize: 20,
    columnSpacingFactor: 1,
    resetChance: 0.028,
    staticColumnStep: 3,
    staticTrailLength: 6,
    maxDelta: 80
  };

  let width = 0;
  let height = 0;
  let fontSize = 16;
  let columns = 0;
  let drops = [];
  let animationId = null;
  let lastTimestamp = 0;
  let resizeTimeout = null;

  const getThemeStyles = () => {
    const styles = getComputedStyle(document.documentElement);

    return {
      color: (styles.getPropertyValue('--code-rain-color') || 'rgba(211, 43, 43, 0.38)').trim(),
      trail: (styles.getPropertyValue('--code-rain-trail') || 'rgba(5, 5, 5, 0.06)').trim()
    };
  };

  const randomChar = () => {
    const { characters } = CONFIG;
    return characters.charAt(Math.floor(Math.random() * characters.length));
  };

  const setupCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * devicePixelRatio);
    canvas.height = Math.round(height * devicePixelRatio);

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    fontSize = Math.max(
      CONFIG.minFontSize,
      Math.min(CONFIG.maxFontSize, Math.round(width / 95))
    );

    columns = Math.max(1, Math.floor(width / (fontSize * CONFIG.columnSpacingFactor)));
    drops = Array.from({ length: columns }, () => Math.random() * -24);

    context.clearRect(0, 0, width, height);
  };

  const applyTrail = () => {
    const { trail } = getThemeStyles();
    context.fillStyle = trail;
    context.fillRect(0, 0, width, height);
  };

  const configureText = () => {
    const { color } = getThemeStyles();
    context.font = `${fontSize}px "Fira Code", "Source Code Pro", monospace`;
    context.textBaseline = 'top';
    context.fillStyle = color;
  };

  const drawAnimatedFrame = () => {
    applyTrail();
    configureText();

    for (let i = 0; i < columns; i += 1) {
      const x = i * fontSize * CONFIG.columnSpacingFactor;
      const y = drops[i] * fontSize;

      context.fillText(randomChar(), x, y);

      if (y > height && Math.random() < CONFIG.resetChance) {
        drops[i] = Math.random() * -10;
      } else {
        drops[i] += 1;
      }
    }
  };

  const drawStaticFrame = () => {
    stopAnimation();
    applyTrail();
    configureText();

    for (let i = 0; i < columns; i += CONFIG.staticColumnStep) {
      let y = Math.random() * height;

      for (let step = 0; step < CONFIG.staticTrailLength; step += 1) {
        context.globalAlpha = Math.max(0.08, 0.42 - step * 0.06);
        context.fillText(randomChar(), i * fontSize, y);
        y -= fontSize;
      }
    }

    context.globalAlpha = 1;
  };

  const render = (timestamp) => {
    if (reduceMotionQuery.matches) {
      drawStaticFrame();
      return;
    }

    const delta = timestamp - lastTimestamp;
    if (delta >= 16) {
      lastTimestamp = timestamp - Math.min(delta, CONFIG.maxDelta) * 0.08;
      drawAnimatedFrame();
    }

    animationId = window.requestAnimationFrame(render);
  };

  const stopAnimation = () => {
    if (animationId !== null) {
      window.cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const startAnimation = () => {
    stopAnimation();

    if (reduceMotionQuery.matches) {
      drawStaticFrame();
      return;
    }

    lastTimestamp = performance.now();
    animationId = window.requestAnimationFrame(render);
  };

  const refresh = () => {
    setupCanvas();
    startAnimation();
  };

  const handleResize = () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      refresh();
    }, 120);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  };

  const handleMotionPreferenceChange = () => {
    refresh();
  };

  setupCanvas();
  startAnimation();

  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleMotionPreferenceChange);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleMotionPreferenceChange);
  }
})();
