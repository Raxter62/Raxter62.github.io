import { createIntroSky, createHomeSky, DURATION, progress } from './sky.js';
import { initProjects } from './projects.js';
import { initMobileMenu } from './menu.js';

const root = document.documentElement;
const intro = document.querySelector('#intro');
const shell = document.querySelector('#site-shell');
const status = document.querySelector('#intro-status');
const skip = document.querySelector('#skip-intro');
const themeButton = document.querySelector('#theme-toggle');
const themeLabel = document.querySelector('#theme-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let homeSky;
let openingSky;
let timeline;
let finished = !intro;
const state = {
  time: 0,
  greeting: { textContent: 'Hello World', innerHTML: '' },
  words: ['LEARN', 'CREATE', 'EXPLORE', 'REPEAT'].map(text => ({ textContent: text, innerHTML: '' })),
};

function setTheme(theme) {
  const dark = theme === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', dark ? '切換為淺色模式' : '切換為深色模式');
  themeLabel.textContent = dark ? '淺色模式' : '深色模式';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#161819' : '#F5F1E8';
  try { localStorage.setItem('raxter-theme', root.dataset.theme); } catch { /* Storage is optional. */ }
  homeSky?.render();
  openingSky?.refreshPalette();
}
let savedTheme = 'light';
try { savedTheme = localStorage.getItem('raxter-theme') || 'light'; } catch { /* Use light mode. */ }
setTheme(savedTheme);
themeButton.hidden = false;
themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
initProjects();
initMobileMenu();

const sectionLinks = [...document.querySelectorAll('.navigation a[href^="#"]')];
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    sectionLinks.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-15% 0px -50% 0px' });
sectionLinks.forEach(link => sectionObserver.observe(document.querySelector(link.hash)));

function finishIntro() {
  if (finished) return;
  finished = true;
  timeline?.pause();
  openingSky?.disconnect();
  const moveFocus = intro.contains(document.activeElement);
  intro.hidden = true;
  intro.dataset.phase = 'complete';
  shell.inert = false;
  shell.removeAttribute('aria-hidden');
  document.body.dataset.view = 'home';
  if (moveFocus) document.querySelector('#home-link').focus({ preventScroll: true });
}
skip?.addEventListener('click', finishIntro);

try {
  homeSky = createHomeSky(document.querySelector('#home-stars'));
  // Direct section links go straight to the requested content.
  if (!intro || reducedMotion.matches || ['#home', '#about', '#projects'].includes(location.hash)) {
    finishIntro();
  } else {
    const { createTimeline, scrambleText } = await import('./vendor/anime.esm.min.js');
    // Motion preferences may change while the optional module loads.
    if (reducedMotion.matches || finished) {
      finishIntro();
    } else {
      intro.hidden = false;
      shell.inert = true;
      shell.setAttribute('aria-hidden', 'true');
      document.body.dataset.view = 'intro';
      openingSky = createIntroSky(document.querySelector('#intro-sky'), state);
      let lastPhase = '';
      timeline = createTimeline({
        autoplay: false,
        onUpdate() {
          openingSky.render();
          intro.style.opacity = String(1 - progress(state.time, 10800, DURATION));
          const phase = state.time < 2600 ? 'hello' : state.time < 4900 ? 'ascent'
            : state.time < 7900 ? 'words' : state.time < 10800 ? 'clouds' : 'fade';
          if (phase !== lastPhase) {
            intro.dataset.phase = phase;
            status.textContent = {
              hello: 'Hello World。', ascent: '鏡頭向上，經過像素雲。',
              words: 'Learn. Create. Explore. Repeat.', clouds: '繼續上升，穿過雲層。',
              fade: '進入主頁。',
            }[phase];
            lastPhase = phase;
          }
        },
        onComplete: finishIntro,
      });
      timeline.add(state, { time: [0, DURATION], duration: DURATION, ease: 'linear' }, 0);
      timeline.add(state.greeting, {
        innerHTML: scrambleText({ text: 'Hello World', override: ' ', chars: '01_+░▒▓', from: 'center', duration: 1100 }),
      }, 250);
      state.words.forEach((word, index) => timeline.add(word, {
        innerHTML: scrambleText({ text: word.textContent, override: ' ', chars: '01_+░▒▓', from: 'center', duration: 850 }),
      }, 4350 + index * 340));
      if (!document.hidden) timeline.play();
    }
  }
} catch (error) {
  // The main page is visible by default, including when modules cannot load.
  console.warn('Opening animation unavailable; showing the main page.', error);
  finishIntro();
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) finishIntro();
});
document.addEventListener('visibilitychange', () => {
  if (finished) return;
  if (document.hidden) timeline?.pause();
  else timeline?.play();
});
