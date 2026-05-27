/* ══════════════════════════════════════════════════════════════
   ENHANCEMENTS — UX & interactions du portfolio BTS SIO SISR
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────
     Petits utilitaires
     ─────────────────────────────────────────────── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const supportsIO = 'IntersectionObserver' in window;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────────────────────────────────────────────
     1. Barre de progression de scroll
     ─────────────────────────────────────────────── */
  const progressBar = $('#scroll-progress');
  if (progressBar) {
    let rafScroll = null;
    const updateProgress = () => {
      rafScroll = null;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        progressBar.style.width = (scrollTop / docHeight * 100).toFixed(2) + '%';
      }
    };
    window.addEventListener('scroll', () => {
      if (!rafScroll) rafScroll = requestAnimationFrame(updateProgress);
    }, { passive: true });
    updateProgress();
  }

  /* ───────────────────────────────────────────────
     2. Reveal au scroll
     ─────────────────────────────────────────────── */
  const revealEls = $$('.reveal, .reveal-left');
  if (supportsIO && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ───────────────────────────────────────────────
     3. Compteurs animés (chiffres clés)
        Supporte les nombres décimaux + suffixe libre.
     ─────────────────────────────────────────────── */
  const counters = $$('[data-count]');
  if (supportsIO && counters.length) {
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const fmt = (val, target) =>
      Number.isInteger(target) ? Math.floor(val).toString()
                               : val.toFixed(1).replace('.', ',');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = reduceMotion ? 0 : 1400;
        if (!duration) { el.textContent = fmt(target, target) + suffix; return; }
        const start = performance.now();
        const tick = (now) => {
          const elapsed = Math.min((now - start) / duration, 1);
          const value = easeOut(elapsed) * target;
          el.textContent = fmt(value, target) + suffix;
          if (elapsed < 1) requestAnimationFrame(tick);
          else el.textContent = fmt(target, target) + suffix;
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  /* ───────────────────────────────────────────────
     4. Bouton « retour en haut »
     ─────────────────────────────────────────────── */
  const backBtn = $('.back-to-top');
  if (backBtn) {
    const toggle = () => backBtn.classList.toggle('visible', window.scrollY > 500);
    window.addEventListener('scroll', toggle, { passive: true });
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    toggle();
  }

  /* ───────────────────────────────────────────────
     5. Cartes projet : « Voir le détail / Réduire »
        + raccourci : « Tout ouvrir » / « Tout réduire »
     ─────────────────────────────────────────────── */
  const projectCards = $$('.project-audit-card');
  const projectToggles = [];

  projectCards.forEach(card => {
    const summary = $('.project-summary', card);
    if (!summary || $('.proj-toggle', card)) return;

    const btn = document.createElement('button');
    btn.className = 'proj-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.textContent = 'Voir le détail';
    const arrow = document.createElement('span');
    arrow.className = 'proj-toggle__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = ' ▾';
    btn.append(label, arrow);
    summary.after(btn);

    const setOpen = (open) => {
      card.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Réduire' : 'Voir le détail';
    };
    btn.addEventListener('click', () => setOpen(!card.classList.contains('is-open')));
    projectToggles.push(setOpen);
  });

  /* Bouton « Tout ouvrir / réduire » au-dessus du bloc projets */
  if (projectToggles.length) {
    const projectsSection = $('#projets');
    const audit = projectsSection?.querySelector('.project-audit');
    if (audit && !$('.projects-bulk-toggle', projectsSection)) {
      const wrap = document.createElement('div');
      wrap.className = 'projects-bulk-toggle';
      const bulkBtn = document.createElement('button');
      bulkBtn.type = 'button';
      bulkBtn.className = 'btn projects-bulk-toggle__btn';
      bulkBtn.textContent = '📂 Tout déplier';
      let allOpen = false;
      bulkBtn.addEventListener('click', () => {
        allOpen = !allOpen;
        projectToggles.forEach(fn => fn(allOpen));
        bulkBtn.textContent = allOpen ? '📁 Tout réduire' : '📂 Tout déplier';
      });
      wrap.appendChild(bulkBtn);
      audit.before(wrap);
    }
  }

  /* ───────────────────────────────────────────────
     6. Highlight de la nav-sidebar selon section visible
        (renfort de l'observer déjà présent dans index.html)
        + scroll fluide quand on clique sur un lien d'ancre.
     ─────────────────────────────────────────────── */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });

  /* ───────────────────────────────────────────────
     7. Lightbox d'images pour les captures projets
        Cible toutes les <img> dans assets/, screen/, Projet/
        et tout lien direct vers un .png/.jpg/.jpeg.
     ─────────────────────────────────────────────── */
  const lightbox = (() => {
    let overlay = null, imgEl = null, captionEl = null, currentTrigger = null;

    const ensureOverlay = () => {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Aperçu d\'image');
      overlay.innerHTML = `
        <button class="lightbox-close" type="button" aria-label="Fermer">×</button>
        <figure class="lightbox-figure">
          <img alt="" class="lightbox-img" />
          <figcaption class="lightbox-caption"></figcaption>
        </figure>
      `;
      document.body.appendChild(overlay);
      imgEl     = $('.lightbox-img', overlay);
      captionEl = $('.lightbox-caption', overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('lightbox-close')) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
      });
    };

    const open = (src, caption, trigger) => {
      ensureOverlay();
      currentTrigger = trigger || null;
      imgEl.src = src;
      imgEl.alt = caption || 'Aperçu';
      captionEl.textContent = caption || '';
      overlay.classList.add('is-open');
      document.body.classList.add('no-scroll');
    };

    const close = () => {
      if (!overlay) return;
      overlay.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      imgEl.removeAttribute('src');
      if (currentTrigger?.focus) currentTrigger.focus();
    };

    return { open, close };
  })();

  const isImageHref = (href) => /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(href || '');

  /* Liens directs vers une image (preuves DNS/DHCP, etc.) */
  $$('a[href]').forEach(a => {
    if (!isImageHref(a.getAttribute('href'))) return;
    if (a.closest('.lightbox-overlay')) return;
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      lightbox.open(a.href, a.textContent.trim() || 'Aperçu', a);
    });
    a.classList.add('has-lightbox');
  });

  /* Images contextuelles (hors avatars, sidebar) */
  $$('img').forEach(img => {
    if (img.closest('.sidebar, .avatar, .lightbox-overlay')) return;
    if (img.width && img.width < 80) return;
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      lightbox.open(img.src, img.alt || '', img);
    });
  });

  /* ───────────────────────────────────────────────
     8. Notifications « toast »
     ─────────────────────────────────────────────── */
  const toast = (msg, type = 'info') => {
    let host = $('#toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--show'));
    setTimeout(() => {
      el.classList.remove('toast--show');
      setTimeout(() => el.remove(), 320);
    }, 2400);
  };

  /* ───────────────────────────────────────────────
     9. Copier l'email au clic (sans casser le mailto:)
        Maj/Cmd+clic → ouvre le mailto, sinon → copie.
     ─────────────────────────────────────────────── */
  $$('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (e.shiftKey || e.metaKey || e.ctrlKey) return;
      const addr = link.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      if (!navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(addr).then(
        () => toast(`📋 ${addr} copié !`, 'success'),
        () => { window.location.href = link.href; }
      );
    });
  });

  /* ───────────────────────────────────────────────
    10. Raccourcis clavier (utiles devant le jury)
        ↑ / ↓ → section précédente / suivante
        H     → retour à l'accueil
        T     → bascule clair / sombre
        ?     → aide
     ─────────────────────────────────────────────── */
  const sections = $$('section[id]');
  const goToSection = (delta) => {
    if (!sections.length) return;
    const y = window.scrollY + 100;
    let idx = sections.findIndex(s => s.offsetTop > y);
    if (idx === -1) idx = sections.length;
    const target = sections[Math.max(0, Math.min(sections.length - 1, idx + (delta > 0 ? 0 : -2)))];
    if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  document.addEventListener('keydown', (e) => {
    /* Ne pas intercepter quand l'utilisateur tape dans un champ */
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'ArrowDown') { e.preventDefault(); goToSection(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); goToSection(-1); }
    else if (e.key.toLowerCase() === 'h') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    else if (e.key.toLowerCase() === 't') {
      const tgl = document.querySelector('[data-theme-toggle]');
      if (tgl) tgl.click();
    }
    else if (e.key === '?') {
      toast('↑/↓ navigation · H accueil · T thème · Échap fermer', 'info');
    }
  });

  /* ───────────────────────────────────────────────
    11. Lazy : ajoute loading="lazy" / decoding="async"
        aux images qui ne l'ont pas encore.
     ─────────────────────────────────────────────── */
  $$('img').forEach(img => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });

  /* ───────────────────────────────────────────────
    12. Année auto dans le footer
     ─────────────────────────────────────────────── */
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  /* ───────────────────────────────────────────────
    13. Barres de compétences (si jamais utilisées)
     ─────────────────────────────────────────────── */
  const skillBars = $$('.skill-bar-fill');
  if (supportsIO && skillBars.length) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    skillBars.forEach(bar => barObserver.observe(bar));
  } else {
    skillBars.forEach(bar => bar.classList.add('animated'));
  }

  /* ───────────────────────────────────────────────
    14. Évite que les liens externes ouvrent dans le même onglet
     ─────────────────────────────────────────────── */
  $$('a[href^="http"]').forEach(a => {
    try {
      const url = new URL(a.href, location.href);
      if (url.host !== location.host && !a.target) {
        a.target = '_blank';
        if (!/noopener/.test(a.rel || '')) a.rel = ((a.rel || '') + ' noopener noreferrer').trim();
      }
    } catch (_) { /* ignore */ }
  });

  /* ───────────────────────────────────────────────
    15. Curseur Tsukuyomi — lune de sang Akatsuki
     ─────────────────────────────────────────────── */
  if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    const moon = document.createElement('div');
    moon.className = 'tsukuyomi-cursor';
    moon.setAttribute('aria-hidden', 'true');

    const ring = document.createElement('div');
    ring.className = 'tsukuyomi-ring';
    ring.setAttribute('aria-hidden', 'true');

    document.body.appendChild(ring);
    document.body.appendChild(moon);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let visible = false;

    const interactiveSelector =
      'a, button, [role="button"], input[type="button"], input[type="submit"],' +
      ' input[type="checkbox"], input[type="radio"], summary, label, select,' +
      ' .theme-toggle, .back-to-top, .nav a';

    const show = () => {
      if (visible) return;
      moon.classList.add('is-visible');
      ring.classList.add('is-visible');
      visible = true;
    };
    const hide = () => {
      moon.classList.remove('is-visible');
      ring.classList.remove('is-visible');
      visible = false;
    };

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      moon.style.transform =
        'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
      show();
    }, { passive: true });

    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    window.addEventListener('blur', hide);

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest && e.target.closest(interactiveSelector)) {
        moon.classList.add('is-active');
        ring.classList.add('is-active');
      }
    });
    document.addEventListener('mouseout', (e) => {
      const from = e.target.closest && e.target.closest(interactiveSelector);
      const to = e.relatedTarget && e.relatedTarget.closest
        ? e.relatedTarget.closest(interactiveSelector) : null;
      if (from && !to) {
        moon.classList.remove('is-active');
        ring.classList.remove('is-active');
      }
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      const tick = () => {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform =
          'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

})();
