/* ══════════════════════════════════════════════════════════════
   PREMIUM JS — Portfolio BTS SIO · Noé Chami
   Cursor · Tilt 3D · Magnetic · Spotlight · Parallax · Preloader
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ───────────────────────────────────────────────
     1. AURORA BACKGROUND — Injection auto
     ─────────────────────────────────────────────── */
  if (!$('.aurora')) {
    const aurora = document.createElement('div');
    aurora.className = 'aurora';
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = `
      <div class="aurora__orb aurora__orb--1"></div>
      <div class="aurora__orb aurora__orb--2"></div>
      <div class="aurora__orb aurora__orb--3"></div>
      <div class="aurora__orb aurora__orb--4"></div>
      <div class="aurora__orb aurora__orb--5"></div>
    `;
    document.body.insertBefore(aurora, document.body.firstChild);
  }

  /* ───────────────────────────────────────────────
     2. PRELOADER — Petit écran de chargement
     ─────────────────────────────────────────────── */
  let preloader = $('.preloader');
  if (!preloader) {
    preloader = document.createElement('div');
    preloader.className = 'preloader';
    preloader.setAttribute('aria-hidden', 'true');
    preloader.innerHTML = `
      <div class="preloader__logo">NC</div>
      <div class="preloader__bar"></div>
      <div class="preloader__label">Chargement du portfolio</div>
    `;
    document.body.appendChild(preloader);
  }

  const hidePreloader = () => {
    if (!preloader) return;
    preloader.classList.add('is-hidden');
    setTimeout(() => preloader && preloader.remove(), 800);
    preloader = null;
  };

  if (document.readyState === 'complete') {
    setTimeout(hidePreloader, reduce ? 50 : 400);
  } else {
    window.addEventListener('load', () => setTimeout(hidePreloader, reduce ? 50 : 400));
  }
  /* Failsafe global : toujours masqué après 1.8s */
  setTimeout(hidePreloader, 1800);

  /* ───────────────────────────────────────────────
     3. CURSEUR CUSTOM — Ring + dot
     ─────────────────────────────────────────────── */
  if (!isTouch && !reduce) {
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    const dot  = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let dx = mx, dy = my;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const animate = () => {
      /* Lag léger sur le ring (smooth follow) */
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      dot.style.transform  = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    animate();

    /* Hover sur éléments cliquables → ring grossit */
    const hoverSel = 'a, button, .btn, .project-audit-card, .cert-card, .contact-item, .nav a, [data-tilt], [data-magnetic], summary, label, input, textarea';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) {
        ring.classList.add('is-hover');
        dot.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel) && !e.relatedTarget?.closest?.(hoverSel)) {
        ring.classList.remove('is-hover');
        dot.classList.remove('is-hover');
      }
    });

    document.addEventListener('mousedown', () => ring.classList.add('is-active'));
    document.addEventListener('mouseup',   () => ring.classList.remove('is-active'));

    /* Cache si sortie de fenêtre */
    document.addEventListener('mouseleave', () => {
      ring.style.opacity = '0';
      dot.style.opacity  = '0';
    });
    document.addEventListener('mouseenter', () => {
      ring.style.opacity = '';
      dot.style.opacity  = '';
    });
  }

  /* ───────────────────────────────────────────────
     4. SPOTLIGHT — Lumière qui suit le curseur sur cartes
     ─────────────────────────────────────────────── */
  if (!isTouch && !reduce) {
    const cards = $$('.project-audit-card, .cert-card, .hero-skill-card, .comp-card, .contact-item');
    cards.forEach(card => {
      /* Injecte la couche spotlight si absente */
      if (!$('.spotlight', card)) {
        const sp = document.createElement('div');
        sp.className = 'spotlight';
        sp.setAttribute('aria-hidden', 'true');
        card.prepend(sp);
      }
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width)  * 100;
        const my = ((e.clientY - r.top)  / r.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
    });
  }

  /* ───────────────────────────────────────────────
     5. TILT 3D — Cartes qui s'inclinent selon la souris
     ─────────────────────────────────────────────── */
  if (!isTouch && !reduce) {
    /* Auto-applique data-tilt aux cartes principales */
    $$('.project-audit-card, .cert-card, .hero-skill-card, .comp-card').forEach(el => {
      if (!el.hasAttribute('data-tilt')) el.setAttribute('data-tilt', '');
    });

    $$('[data-tilt]').forEach(el => {
      const maxTilt = parseFloat(el.dataset.tiltMax || '5');
      let rafId = null;

      const onMove = (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top  + r.height / 2;
          const dx = (e.clientX - cx) / (r.width / 2);
          const dy = (e.clientY - cy) / (r.height / 2);
          el.style.setProperty('--tilt-x', (-dy * maxTilt).toFixed(2) + 'deg');
          el.style.setProperty('--tilt-y', (dx * maxTilt).toFixed(2) + 'deg');
        });
      };
      const onLeave = () => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ───────────────────────────────────────────────
     6. MAGNETIC BUTTONS — Attire le bouton vers le curseur
     ─────────────────────────────────────────────── */
  if (!isTouch && !reduce) {
    /* Auto-applique data-magnetic aux boutons primary */
    $$('.btn.primary, .back-to-top').forEach(el => {
      if (!el.hasAttribute('data-magnetic')) el.setAttribute('data-magnetic', '');
    });

    $$('[data-magnetic]').forEach(el => {
      const strength = parseFloat(el.dataset.magnetStrength || '0.35');
      let rafId = null;

      const onMove = (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top  + r.height / 2;
          const dx = (e.clientX - cx) * strength;
          const dy = (e.clientY - cy) * strength;
          el.style.setProperty('--mag-x', dx.toFixed(1) + 'px');
          el.style.setProperty('--mag-y', dy.toFixed(1) + 'px');
        });
      };
      const onLeave = () => {
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ───────────────────────────────────────────────
     7. HERO PARALLAX — Mouvement souris sur le hero
     ─────────────────────────────────────────────── */
  const hero = $('#apercu');
  if (hero && !isTouch && !reduce) {
    let rafId = null;
    hero.addEventListener('mousemove', (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const r = hero.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const py = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        hero.style.setProperty('--px', px.toFixed(3));
        hero.style.setProperty('--py', py.toFixed(3));
      });
    });
    hero.addEventListener('mouseleave', () => {
      hero.style.setProperty('--px', '0');
      hero.style.setProperty('--py', '0');
    });
  }

  /* ───────────────────────────────────────────────
     8. SECTIONS REVEAL — Apparition au scroll
     ─────────────────────────────────────────────── */
  if ('IntersectionObserver' in window && !reduce) {
    const sections = $$('section');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });
    sections.forEach(s => obs.observe(s));

    /* Failsafe : si une section reste invisible après 3s, on l'affiche */
    setTimeout(() => sections.forEach(s => s.classList.add('is-in')), 3000);
  } else {
    $$('section').forEach(s => s.classList.add('is-in'));
  }

  /* ───────────────────────────────────────────────
     9. GLITCH H2 — Injecte data-text pour l'effet
     ─────────────────────────────────────────────── */
  $$('section h2').forEach(h => {
    if (!h.hasAttribute('data-text')) {
      h.setAttribute('data-text', h.textContent.trim());
    }
  });

  /* ───────────────────────────────────────────────
     10. FLOATING DECOS — Petits points décoratifs
     ─────────────────────────────────────────────── */
  if (!reduce) {
    const decoSection = $('#apercu');
    if (decoSection) {
      const positions = [
        { top: '12%', right: '8%',  delay: '0s'   },
        { top: '38%', right: '14%', delay: '1.5s' },
        { top: '64%', right: '6%',  delay: '3s'   },
      ];
      positions.forEach(p => {
        const dot = document.createElement('div');
        dot.className = 'deco-dot';
        dot.setAttribute('aria-hidden', 'true');
        Object.assign(dot.style, p, { position: 'absolute', animationDelay: p.delay });
        decoSection.appendChild(dot);
      });
    }
  }

})();
