(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const splitStates = new WeakMap();
  let fontsReady = false;

  function clearSplit(element) {
    const state = splitStates.get(element);
    if (!state) return;
    if (state.trigger) state.trigger.kill();
    if (state.animation) state.animation.kill();
    if (state.instance) state.instance.revert();
    splitStates.delete(element);
  }

  function createSplit(element, type, immediate = false) {
    if (reducedMotion || !window.gsap || !window.SplitText || !window.ScrollTrigger) return;
    clearSplit(element);
    const state = {};
    const heading = type === 'heading';
    const label = type === 'label';
    state.instance = window.SplitText.create(element, {
      type: 'lines',
      linesClass: heading ? 'reveal-line' : label ? 'label-line' : 'appear-line',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        if (state.trigger) {
          state.trigger.kill();
          state.trigger = null;
        }
        if (state.animation) {
          state.animation.kill();
          state.animation = null;
        }
        if (heading) {
          state.animation = window.gsap.from(self.lines, {
            y: '100%', opacity: 0, duration: 1.2, stagger: 0.12,
            ease: 'expo.out', paused: true
          });
          if (immediate) {
            state.animation.play(0);
            return state.animation;
          }
          state.trigger = window.ScrollTrigger.create({
            trigger: element,
            start: 'top 75%',
            onEnter: () => state.animation && state.animation.play(0),
            onEnterBack: () => state.animation && state.animation.play(0),
            onLeaveBack: () => state.animation && state.animation.reverse()
          });
          return state.animation;
        }
        if (label) {
          state.animation = window.gsap.fromTo(self.lines,
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
              scrollTrigger: { trigger: element, start: 'top 78%', once: true } }
          );
          return state.animation;
        }
        window.gsap.set(self.lines, { yPercent: 100, force3D: true });
        state.animation = window.gsap.to(self.lines, {
          yPercent: 0, duration: 0.75, ease: 'power2.out', delay: 0,
          stagger: 0.06, force3D: true,
          scrollTrigger: { trigger: element, start: 'top 95%', once: true }
        });
        return state.animation;
      }
    });
    splitStates.set(element, state);
  }

  function animateChangedText(element, type) {
    if (!fontsReady || reducedMotion || !window.gsap || !window.SplitText) return;
    clearSplit(element);
    const state = {};
    state.instance = window.SplitText.create(element, {
      type: 'lines',
      linesClass: type === 'heading' ? 'reveal-line' : 'appear-line',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        if (type === 'heading') {
          state.animation = window.gsap.from(self.lines, {
            y: '100%', opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out'
          });
          return state.animation;
        }
        window.gsap.set(self.lines, { yPercent: 100, force3D: true });
        state.animation = window.gsap.to(self.lines, {
          yPercent: 0, duration: 0.75, ease: 'power2.out', delay: 0,
          stagger: 0.06, force3D: true
        });
        return state.animation;
      }
    });
    splitStates.set(element, state);
  }

  function initMotion(scope = document) {
    if (reducedMotion || !window.gsap || !window.ScrollTrigger || !window.SplitText) return;
    const selector = '[data-anim="heading"],[data-anim="text"],[data-anim="label"]';
    const nodes = [];
    if (scope.matches && scope.matches(selector)) nodes.push(scope);
    nodes.push(...scope.querySelectorAll(selector));
    nodes.forEach((element) => {
      if (element.closest('[hidden]') || splitStates.has(element)) return;
      const type = element.dataset.anim;
      createSplit(element, type, element.hasAttribute('data-hero-title'));
    });
  }

  function initEntranceMotion() {
    if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;
    const heroImage = document.querySelector('.hero>img');
    if (heroImage) window.gsap.fromTo(heroImage, { scale: 1.08 }, {
      scale: 1, duration: 1.6, ease: 'power2.out', clearProps: 'transform'
    });
    const features = document.querySelectorAll('.cecha');
    if (features.length) window.gsap.from(features, {
      y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.cechy', start: 'top 85%', once: true }
    });
  }

  function initSlider(slider) {
    const slides = [...slider.querySelectorAll('.slide-photo')];
    if (!slides.length) return;
    const imageBox = slider.querySelector('.big');
    const thumbs = [...slider.querySelectorAll('[data-thumb-index]')];
    const productTiles = slider.dataset.product === 'true'
      ? [...document.querySelectorAll('.product-tile[data-slide-to]')] : [];
    const titleNode = slider.querySelector('[data-slide-title]');
    const copyNode = slider.querySelector('[data-slide-copy]');
    const captionNode = slider.querySelector('[data-live-caption]');
    const countNode = slider.querySelector('[data-live-count]');
    const kolButton = slider.querySelector('[data-kol-open]');
    let current = 0;

    function go(requested, animate = true, force = false) {
      const next = (requested + slides.length) % slides.length;
      if (next === current && !force) return;
      current = next;
      slides.forEach((photo, index) => {
        const active = index === current;
        photo.classList.toggle('is-active', active);
        photo.setAttribute('aria-hidden', String(!active));
      });
      thumbs.forEach((button, index) => {
        const active = index === current;
        button.setAttribute('aria-pressed', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      productTiles.forEach((button, index) => button.setAttribute('aria-pressed', String(index === current)));

      const photo = slides[current];
      const nextTitle = photo.dataset.title || '';
      const nextCopy = photo.dataset.copy || '';
      if (titleNode && titleNode.textContent !== nextTitle) titleNode.textContent = nextTitle;
      if (copyNode && copyNode.textContent !== nextCopy) copyNode.textContent = nextCopy;
      if (captionNode) captionNode.textContent = photo.dataset.caption || '';
      if (countNode) countNode.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (kolButton) {
        const id = photo.dataset.kolekcja || '';
        kolButton.hidden = !id;
        kolButton.dataset.kolOpen = id;
      }
      if (animate) {
        if (titleNode && nextTitle) animateChangedText(titleNode, 'heading');
        if (copyNode && nextCopy) animateChangedText(copyNode, 'text');
      }
    }

    slider.querySelector('[data-slide-prev]').addEventListener('click', () => go(current - 1));
    slider.querySelector('[data-slide-next]').addEventListener('click', () => go(current + 1));
    thumbs.forEach((button) => button.addEventListener('click', () => go(Number(button.dataset.thumbIndex))));
    productTiles.forEach((button) => button.addEventListener('click', () => go(Number(button.dataset.slideTo))));

    slider.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(current - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(current + 1);
      }
    });

    let pointerX = null;
    imageBox.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointerX = event.clientX;
    });
    imageBox.addEventListener('pointerup', (event) => {
      if (pointerX === null) return;
      const delta = event.clientX - pointerX;
      pointerX = null;
      if (Math.abs(delta) > 40) go(current + (delta < 0 ? 1 : -1));
    });
    imageBox.addEventListener('pointercancel', () => { pointerX = null; });
    go(0, false, true);
    slider.goTo = go;
  }

  function initTabs() {
    document.querySelectorAll('[role="tablist"]').forEach(initTablist);
  }

  function initTablist(tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    let activeIndex = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));

    function activate(index, userAction = false) {
      if (index < 0 || index >= tabs.length) return;
      activeIndex = index;
      tabs.forEach((tab, i) => {
        const active = i === activeIndex;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
      });
      if (userAction) {
        const panel = panels[activeIndex];
        initMotion(panel);
        const slider = panel.querySelector('[data-slider]');
        if (slider) {
          const title = slider.querySelector('[data-slide-title]');
          const copy = slider.querySelector('[data-slide-copy]');
          if (title && title.textContent) animateChangedText(title, 'heading');
          if (copy && copy.textContent) animateChangedText(copy, 'text');
        }
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(index, true));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        activate(next, true);
        tabs[next].focus();
      });
    });
    activate(activeIndex, false);
  }

  function initCollections() {
    const modal = document.getElementById('kol-modal');
    if (!modal) return;
    const articles = [...modal.querySelectorAll('article.kol')];
    const scroller = modal.querySelector('.kol-scroll');
    const count = modal.querySelector('[data-kol-count]');
    const closeButton = modal.querySelector('[data-kol-close]');
    let current = -1;
    let opener = null;

    function show(index) {
      current = (index + articles.length) % articles.length;
      articles.forEach((article, i) => { article.hidden = i !== current; });
      const article = articles[current];
      modal.setAttribute('aria-labelledby', article.getAttribute('aria-labelledby'));
      modal.removeAttribute('aria-label');
      if (count) count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(articles.length).padStart(2, '0')}`;
      scroller.scrollTop = 0;
    }
    function open(id, trigger) {
      const index = articles.findIndex((article) => article.id === `kol-${id}`);
      if (index < 0) return;
      opener = trigger || document.activeElement;
      show(index);
      modal.hidden = false;
      document.body.classList.add('kol-open');
      closeButton.focus();
    }
    function close() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove('kol-open');
      if (opener && opener.focus) opener.focus();
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-kol-open]');
      if (trigger && trigger.dataset.kolOpen) open(trigger.dataset.kolOpen, trigger);
    });
    closeButton.addEventListener('click', close);
    modal.querySelector('[data-kol-prev]').addEventListener('click', () => show(current - 1));
    modal.querySelector('[data-kol-next]').addEventListener('click', () => show(current + 1));
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('button:not([hidden])')].filter((node) => node.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function initMenu() {
    const toggle = document.querySelector('.mbtn');
    const menu = document.querySelector('.mnav');
    if (!toggle || !menu) return;
    const closedLabel = toggle.dataset.labelClosed || toggle.textContent;
    const openLabel = toggle.dataset.labelOpen || closedLabel;

    function close(restoreFocus = true) {
      if (!menu.classList.contains('open')) return;
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = closedLabel;
      document.body.classList.remove('menu-open');
      if (restoreFocus) toggle.focus();
    }
    function open() {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = openLabel;
      document.body.classList.add('menu-open');
      const first = menu.querySelector('a[href]');
      if (first) first.focus();
    }

    toggle.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
    menu.querySelectorAll('a[href]').forEach((link) => link.addEventListener('click', () => close(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        event.preventDefault();
        close();
      }
    });
  }

  function initNavigation() {
    const links = [...document.querySelectorAll('.nav a[href^="#"], .mnav a[href^="#"]')];
    const byId = new Map();
    links.forEach((link) => {
      const id = link.hash.slice(1);
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(link);
    });
    const header = document.querySelector('.top');
    const syncHeader = () => header && header.classList.toggle('solid', window.scrollY > 40);
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        byId.forEach((group) => group.forEach((link) => link.classList.toggle('on', link.hash === `#${entry.target.id}`)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });
  }

  function start() {
    root.classList.add('js');
    if (window.gsap && window.ScrollTrigger && window.SplitText) {
      window.gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
    }
    document.querySelectorAll('[data-slider]').forEach(initSlider);
    initTabs();
    initCollections();
    initMenu();
    initNavigation();

    if (reducedMotion || !window.gsap || !window.ScrollTrigger || !window.SplitText) return;
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.resolve(ready).then(() => {
      fontsReady = true;
      initMotion(document);
      initEntranceMotion();
      window.ScrollTrigger.refresh();
    });
  }

  start();
})();
