export function initProjects() {
  const track = document.querySelector('#project-carousel');
  if (!track) return;
  const cards = [...track.querySelectorAll('.project-card')];
  const dots = [...document.querySelectorAll('[data-project]')];
  const status = document.querySelector('.carousel-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wrap = index => (index % cards.length + cards.length) % cards.length;
  let active = 0;
  let drag;
  let moved = false;
  let wheelTotal = 0;
  let wheelTime = 0;
  let width = 0;
  let height = 0;
  track.classList.add('is-enhanced');
  document.querySelector('.carousel-controls').hidden = false;

  function render() {
    const compact = track.clientWidth < 720;
    const sideScale = compact ? .42 : .8;
    cards.forEach((card, index) => {
      const side = index === active ? 0 : index === wrap(active - 1) ? -1 : index === wrap(active + 1) ? 1 : 2;
      const visible = side !== 2;
      // Fit complete neighboring cards, including perspective and shadow, inside the viewport.
      const spacing = Math.min(width * 1.02 + 24, (track.clientWidth - width * sideScale) / 2 - 24);
      const x = compact ? side * track.clientWidth * .25 : side * spacing;
      const y = compact && side !== 0 ? height + 38 : 24 + (side === 0 ? 0 : height * .1);
      card.dataset.position = side === 0 ? 'center' : side === -1 ? 'left' : side === 1 ? 'right' : 'hidden';
      card.style.setProperty('--x', `${visible ? x : 0}px`);
      card.style.setProperty('--y', `${visible ? y : 24}px`);
      card.style.setProperty('--scale', String(side === 0 ? 1 : sideScale));
      card.style.setProperty('--turn', `${reduced.matches ? 0 : -side * 18}deg`);
      card.setAttribute('aria-hidden', String(!visible));
      card.inert = !visible;
      card.tabIndex = visible && side !== 0 ? 0 : -1;
      card.querySelectorAll('a').forEach(link => link.tabIndex = side === 0 ? 0 : -1);
    });
    dots.forEach((dot, index) => {
      if (index === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    status.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')} — ${cards[active].querySelector('h3').textContent}`;
    track.style.height = `${compact ? height * 1.42 + 78 : height + 72}px`;
  }
  function goTo(index) {
    active = wrap(index);
    // A departing slide must not keep keyboard focus while hidden.
    if (cards.some(card => card.contains(document.activeElement))) track.focus({ preventScroll: true });
    render();
  }
  function layout() {
    track.classList.add('is-layout');
    const maximum = matchMedia('(min-width: 1100px)').matches ? 440 : 380;
    width = track.clientWidth < 720 ? Math.min(360, track.clientWidth - 24) : Math.min(maximum, (track.clientWidth - 96) / 2.72);
    cards.forEach(card => { card.style.width = `${width}px`; card.style.height = 'auto'; });
    height = Math.max(...cards.map(card => card.offsetHeight));
    cards.forEach(card => card.style.height = `${height}px`);
    render();
    // Apply the new viewport geometry immediately, without animating from old off-screen coordinates.
    track.getBoundingClientRect();
    track.classList.remove('is-layout');
  }
  document.querySelector('#project-prev').addEventListener('click', () => goTo(active - 1));
  document.querySelector('#project-next').addEventListener('click', () => goTo(active + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
  track.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && cards.includes(event.target)) {
      event.preventDefault(); goTo(cards.indexOf(event.target)); return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('pointerdown', event => {
    moved = false;
    if (event.button !== 0 || event.target.closest('a, button')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  track.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.abs(event.clientY - drag.y) > Math.abs(event.clientX - drag.x) && !moved) { drag = undefined; return; }
    if (!moved && Math.abs(event.clientX - drag.x) > 8) {
      moved = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
  });
  function release(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    drag = undefined;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (event.type === 'pointerup' && moved && Math.abs(delta) > 35) goTo(active + (delta < 0 ? 1 : -1));
  }
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);
  track.addEventListener('lostpointercapture', event => {
    // Touch starts with implicit capture on the child; transferring it to the stage
    // must not cancel the gesture when that child's lost-capture event bubbles up.
    if (event.target === track) release(event);
  });
  track.addEventListener('click', event => {
    if (moved) { event.preventDefault(); moved = false; return; }
    const index = cards.indexOf(event.target.closest('.project-card'));
    if (index !== -1 && index !== active) { event.preventDefault(); goTo(index); }
  });
  track.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelTime < 400) return;
    wheelTotal += event.deltaX;
    if (Math.abs(wheelTotal) > 40) {
      goTo(active + Math.sign(wheelTotal)); wheelTotal = 0; wheelTime = now;
    }
  }, { passive: false });
  new ResizeObserver(layout).observe(track);
  reduced.addEventListener('change', render);
  layout();
}
