import { paintPixelText } from './pixels.js';

export const DURATION = 11800;
export const progress = (time, start, end) => Math.max(0, Math.min(1, (time - start) / (end - start)));
const smooth = t => t * t * (3 - 2 * t);

export function readPalette() {
  const css = getComputedStyle(document.documentElement);
  return Object.fromEntries(['background', 'surface', 'text', 'text-secondary', 'accent', 'accent-hover', 'border']
    .map(name => [name, css.getPropertyValue(`--${name}`).trim()]));
}

function createCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  let width = 0;
  let height = 0;
  let redraw = () => {};
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    redraw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  return {
    ctx,
    get width() { return width; },
    get height() { return height; },
    onResize(callback) { redraw = callback; resize(); },
    disconnect() { observer.disconnect(); },
  };
}

// A fixed seed makes the composition stable across reloads, resizes and themes.
let seed = 62;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const stars = Array.from({ length: 180 }, () => ({
  x: random(), y: random(), size: random(), alpha: .18 + random() * .47,
}));

function star(ctx, x, y, unit, color, alpha, cross = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  x = Math.round(x); y = Math.round(y);
  ctx.fillRect(x, y, unit, unit);
  if (cross) {
    ctx.fillRect(x - unit * 2, y, unit * 5, unit);
    ctx.fillRect(x, y - unit * 2, unit, unit * 5);
    ctx.globalAlpha *= .3;
    ctx.fillRect(x - unit, y - unit, unit * 3, unit * 3);
  }
  ctx.restore();
}

function starfield(ctx, width, height, palette, lift = 0, time = 0, quiet = false) {
  const count = width < 600 ? 65 : 125;
  stars.slice(0, count).forEach((point, index) => {
    const speed = .12 + point.size * .18;
    const y = ((point.y + lift * speed) % 1) * height;
    const twinkle = quiet ? 1 : .8 + .2 * Math.sin(time / 1800 + index * 2);
    star(ctx, point.x * width, y, point.size > .91 ? 2 : 1,
      point.size > .8 ? palette.accent : palette.text,
      point.alpha * twinkle * (quiet ? .48 : .85), point.size > .93);
  });
}

// Stepped silhouette; every edge stays aligned to the same pixel grid.
const cloudOutline = [
  [0,5],[3,5],[3,3],[6,3],[6,1],[10,1],[10,0],[14,0],
  [14,2],[18,2],[18,4],[21,4],[21,5],[24,5],[24,8],[22,8],
  [22,9],[3,9],[3,8],[0,8],
];
function cloud(ctx, x, y, unit, palette, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x - unit * 12), Math.round(y - unit * 4.5));
  const silhouette = (dy, fill) => {
    ctx.beginPath();
    cloudOutline.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px * unit, (py + dy) * unit);
      else ctx.lineTo(px * unit, (py + dy) * unit);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  silhouette(1, palette.border);
  silhouette(0, palette.surface);
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = alpha * .19;
  ctx.fillRect(3 * unit, 8 * unit, 19 * unit, unit);
  ctx.fillRect(17 * unit, 7 * unit, 5 * unit, unit);
  ctx.globalAlpha = alpha * .11;
  ctx.fillRect(5 * unit, 7 * unit, 4 * unit, unit);
  ctx.fillRect(4 * unit, 5 * unit, 2 * unit, unit);
  ctx.restore();
}

// y is world altitude: negative objects are above the initial camera position.
const clouds = [
  {x:.09,y:.9,s:1.1}, {x:.92,y:.82,s:1.35},
  {x:.13,y:-.12,s:1.2}, {x:.9,y:-.38,s:1.4},
  {x:-.03,y:-.69,s:1.05}, {x:1.02,y:-1.02,s:1.3},
  {x:.15,y:-1.4,s:1.65}, {x:.76,y:-1.6,s:1.6},
  {x:-.02,y:-1.93,s:2.4}, {x:.4,y:-2.02,s:2.45},
  {x:.83,y:-2.13,s:2.6}, {x:1.1,y:-2.25,s:2.25},
  {x:.08,y:-2.59,s:2.5}, {x:.57,y:-2.67,s:2.75}, {x:.95,y:-2.79,s:2.2},
];

export function createIntroSky(canvas, state) {
  const screen = createCanvas(canvas);
  let palette = readPalette();

  function render() {
    const {ctx, width: w, height: h} = screen;
    if (!w || !h) return;
    const time = state.time;
    const firstRise = smooth(progress(time, 2600, 5000));
    const secondRise = smooth(progress(time, 7900, 11100));
    const lift = firstRise * 1.12 + secondRise * 1.65;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, w, h);
    starfield(ctx, w, h, palette, lift, time);
    const baseUnit = Math.max(3, Math.min(10, Math.floor(w / 130)));

    clouds.forEach((item, index) => {
      const depth = index < 6 ? .96 : 1;
      const y = (item.y + lift * depth) * h;
      const unit = Math.round(baseUnit * item.s * (index > 7 ? 1 + secondRise * .3 : 1));
      if (y < -unit * 11 || y > h + unit * 11) return;
      cloud(ctx, item.x * w, y, unit, palette, index < 6 ? .9 : 1);
    });

    // Hello remains in the same world position while the camera leaves it below.
    if (time < 5000) {
      const unit = Math.max(2, Math.floor(Math.min(w * .8 / 65, h * .012)));
      paintPixelText(ctx, state.greeting.innerHTML, w / 2, (.49 + lift) * h,
        unit, palette.text, progress(time, 150, 500));
      star(ctx, w * .5, (.28 + lift * .85) * h, 3, palette.accent, .8, true);
      star(ctx, w * .5 - 43, (.28 + lift * .85) * h + 27, 2, palette.accent, .4);
      star(ctx, w * .5 + 56, (.28 + lift * .85) * h - 17, 2, palette.accent, .4);
    }

    const positions = [
      {x:.27,y:-.90,s:.8,color:palette['text-secondary']},
      {x:.66,y:-.75,s:1.15,color:palette.accent},
      {x:.33,y:-.53,s:1.05,color:palette.text},
      {x:.72,y:-.37,s:.8,color:palette.accent},
    ];
    const wordUnit = Math.max(3, Math.min(9, Math.floor(w / 135)));
    if (time >= 4100 && time < 10200) {
      const groupAlpha = progress(time, 4200, 4800) * (1 - progress(time, 8650, 9800));
      // Offset dotted links make a constellation without running through words.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      positions.forEach((p, i) => {
        const unit = Math.max(2, Math.round(wordUnit * p.s));
        const textWidth = (state.words[i].textContent.length * 6 - 1) * unit;
        ctx.rect(p.x * w - textWidth / 2 - 10,
          (p.y + lift) * h - unit * 3.5 - 10, textWidth + 20, unit * 7 + 20);
      });
      ctx.clip('evenodd');
      ctx.globalAlpha = groupAlpha * .28;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      positions.forEach((p, i) => {
        const x = p.x * w;
        const y = (p.y + lift) * h + wordUnit * 6;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
      positions.forEach((p, i) => {
        const alpha = groupAlpha * progress(time, 4350 + i * 340, 4650 + i * 340);
        paintPixelText(ctx, state.words[i].innerHTML, p.x * w, (p.y + lift) * h,
          Math.max(2, Math.round(wordUnit * p.s)), p.color, alpha);
        star(ctx, p.x * w, (p.y + lift) * h + wordUnit * 6, 2,
          palette.accent, alpha * .8, true);
      });
    }

    // The close cloud layer washes into the surface color before the sky fades.
    const veil = smooth(progress(time, 10300, 11500));
    ctx.fillStyle = palette.surface;
    ctx.globalAlpha = veil * .92;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  screen.onResize(render);
  return {
    render,
    refreshPalette() { palette = readPalette(); render(); },
    disconnect: screen.disconnect,
  };
}

export function createHomeSky(canvas) {
  const screen = createCanvas(canvas);
  function render() {
    const {ctx, width, height} = screen;
    ctx.clearRect(0, 0, width, height);
    starfield(ctx, width, height, readPalette(), .45, 0, true);
  }
  screen.onResize(render);
  return { render };
}
