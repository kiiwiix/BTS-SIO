(() => {
  'use strict';

  const canvas = document.getElementById('code-rain');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const TOKENS = [
    'IP', 'VLAN', 'DNS', 'DHCP', 'AD', 'SSH', 'GPO', 'RDP', 'RAID', 'NAT',
    'HTTP', 'TLS', 'VM', 'AWS', 'DOCKER', 'CISCO', 'ESXI', 'VEEAM', 'PING', 'ACL'
  ];

  const CONFIG = {
    minFontSize: 13,
    maxFontSize: 18,
    minSpeed: 0.42,
    maxSpeed: 1.12,
    minTrail: 3,
    maxTrail: 7,
    baseGapFactor: 1.95,
    resetChance: 0.012,
    staticDensity: 0.34,
    maxDelta: 64,
    maxDevicePixelRatio: 1.6
  };

  let width = 0;
  let height = 0;
  let fontSize = 15;
  let columns = [];
  let animationId = null;
  let lastTimestamp = 0;
  let resizeTimeout = null;
  let resizeObserver = null;

  const getThemeStyles = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      color: (styles.getPropertyValue('--code-rain-color') || 'rgba(211, 43, 43, 0.34)').trim(),
      head: (styles.getPropertyValue('--code-rain-head') || 'rgba(255, 210, 220, 0.72)').trim(),
      trail: (styles.getPropertyValue('--code-rain-trail') || 'rgba(5, 5, 5, 0.06)').trim()
    };
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const randomBetween = (min, max) => Math.random() * (max - min) + min;
  const pickToken = () => TOKENS[Math.floor(Math.random() * TOKENS.length)];

  const createColumn = (index) => ({
    x: index * fontSize * CONFIG.baseGapFactor,
    y: randomBetween(-height, 0),
    speed: randomBetween(CONFIG.minSpeed, CONFIG.maxSpeed),
    trail: Math.round(randomBetween(CONFIG.minTrail, CONFIG.maxTrail)),
    token: pickToken()
  });

  const setupCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));

    const ratio = clamp(window.devicePixelRatio || 1, 1, CONFIG.maxDevicePixelRatio);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    fontSize = clamp(Math.round(width / 92), CONFIG.minFontSize, CONFIG.maxFontSize);
    const count = Math.max(6, Math.floor(width / (fontSize * CONFIG.baseGapFactor)));
    columns = Array.from({ length: count }, (_, index) => createColumn(index));
    context.clearRect(0, 0, width, height);
  };

  const applyTrail = () => {
    const { trail } = getThemeStyles();
    context.fillStyle = trail;
    context.fillRect(0, 0, width, height);
  };

  const configureText = () => {
    context.font = `600 ${fontSize}px "Fira Code", "Source Code Pro", monospace`;
    context.textBaseline = 'top';
    context.textAlign = 'left';
  };

  const drawToken = (token, x, y, alpha, fillStyle, glow = false) => {
    context.globalAlpha = alpha;
    context.fillStyle = fillStyle;
    context.shadowBlur = glow ? 10 : 0;
    context.shadowColor = fillStyle;
    context.fillText(token, x, y);
  };

  const drawAnimatedFrame = () => {
    const { color, head } = getThemeStyles();
    applyTrail();
    configureText();

    columns.forEach((column, index) => {
      for (let trailStep = 0; trailStep < column.trail; trailStep += 1) {
        const y = column.y - trailStep * (fontSize * 1.12);
        if (y < -fontSize || y > height + fontSize) continue;

        const isHead = trailStep === 0;
        const alpha = isHead ? 0.9 : Math.max(0.1, 0.42 - trailStep * 0.07);
        const fillStyle = isHead ? head : color;
        const token = isHead ? column.token : TOKENS[(index + trailStep) % TOKENS.length];
        drawToken(token, column.x, y, alpha, fillStyle, isHead);
      }

      column.y += fontSize * column.speed;

      if (column.y > height + fontSize * (column.trail + 2) || Math.random() < CONFIG.resetChance) {
        column.y = randomBetween(-height * 0.45, -fontSize * 3);
        column.speed = randomBetween(CONFIG.minSpeed, CONFIG.maxSpeed);
        column.trail = Math.round(randomBetween(CONFIG.minTrail, CONFIG.maxTrail));
        column.token = pickToken();
      }
    });

    context.globalAlpha = 1;
    context.shadowBlur = 0;
  };

  const drawStaticFrame = () => {
    const { color, head } = getThemeStyles();
    stopAnimation();
    applyTrail();
    configureText();

    columns.forEach((column, index) => {
      if (Math.random() > CONFIG.staticDensity) return;
      const token = TOKENS[index % TOKENS.length];
      const y = randomBetween(0, Math.max(fontSize, height - fontSize * 1.3));
      drawToken(token, column.x, y, 0.48, color, false);
      drawToken(token, column.x, Math.max(0, y - fontSize * 1.08), 0.16, head, false);
    });

    context.globalAlpha = 1;
    context.shadowBlur = 0;
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
    resizeTimeout = window.setTimeout(refresh, 120);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  };

  refresh();

  window.addEventListener('resize', handleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
  }

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', refresh);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(refresh);
  }
})();
