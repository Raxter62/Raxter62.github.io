export function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const layer = document.querySelector('#mobile-menu');
  const mobile = matchMedia('(max-width: 720px)');
  const background = [...document.querySelectorAll('main, .site-footer, .home-link, .navigation > a')];
  let open = false;
  let previousInert = [];
  toggle.disabled = false;

  function close(restoreFocus = true) {
    if (!open) return;
    open = false;
    document.body.classList.remove('menu-open');
    layer.inert = true;
    layer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '開啟選單');
    background.forEach((element, index) => { element.inert = previousInert[index]; });
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => {
    if (open) return close();
    if (!mobile.matches) return;
    open = true;
    previousInert = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    document.body.classList.add('menu-open');
    layer.inert = false;
    layer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '關閉選單');
  });
  layer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    close();
    if (link.hash && link.origin === location.origin) {
      const section = document.querySelector(link.hash);
      section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
      // Native anchor navigation preserves history and the site's smooth scrolling.
    }
  }));
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const stops = [document.querySelector('#theme-toggle'), toggle, ...layer.querySelectorAll('a')];
      const current = stops.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) { event.preventDefault(); stops.at(-1).focus(); }
      else if (!event.shiftKey && (current === -1 || current === stops.length - 1)) { event.preventDefault(); stops[0].focus(); }
    }
  });
  mobile.addEventListener('change', () => {
    if (!mobile.matches) {
      const restore = open;
      close(false);
      if (restore) document.querySelector('.home-link').focus({ preventScroll: true });
    }
  });
  window.addEventListener('hashchange', () => close(false));
}
