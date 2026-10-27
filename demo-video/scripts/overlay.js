// Injected into every page the recorder opens. Draws the guidance layer on
// top of the real app; pointer-events are off so real clicks reach the app.
(() => {
  if (window.__demo) return;

  const INK = '#1d1712';
  const GLOW = '#ffb81c';
  const css = `
  #demo-layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font-family: Inter, system-ui, sans-serif; }
  #demo-layer * { box-sizing: border-box; }
  .demo-cursor { position: absolute; left: 0; top: 0; width: 34px; height: 34px; transform: translate(-200px, -200px);
    transition-property: transform; transition-timing-function: cubic-bezier(.45,.05,.25,1); filter: drop-shadow(0 3px 5px rgba(0,0,0,.35)); }
  .demo-ripple { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%;
    border: 4px solid ${GLOW}; animation: demo-ripple 0.9s ease-out forwards; }
  .demo-ripple.second { animation-delay: .16s; opacity: 0; }
  @keyframes demo-ripple { 0% { transform: scale(.4); opacity: 1; } 100% { transform: scale(4.2); opacity: 0; } }
  .demo-ring { position: absolute; border-radius: 14px; border: 4px solid ${GLOW}; animation: demo-ring 1.1s ease-out 3 forwards; }
  @keyframes demo-ring { 0% { box-shadow: 0 0 0 0 rgba(255,184,28,.75); opacity: 1; } 100% { box-shadow: 0 0 0 22px rgba(255,184,28,0); opacity: .2; } }
  .demo-pointer { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 12px; opacity: 0;
    transition: opacity .3s ease; }
  .demo-pointer.on { opacity: 1; }
  .demo-pointer.side-bottom { flex-direction: column; }
  .demo-pointer.side-top { flex-direction: column-reverse; }
  .demo-pointer.side-left { flex-direction: row-reverse; }
  .demo-pointer.side-right { flex-direction: row; }
  .demo-arrow { width: 64px; height: 64px; filter: drop-shadow(0 4px 8px rgba(0,0,0,.35)); }
  .side-bottom .demo-arrow { animation: demo-bob-up 1s ease-in-out infinite; }
  .side-top .demo-arrow { animation: demo-bob-down 1s ease-in-out infinite; transform: rotate(180deg); }
  .side-left .demo-arrow { animation: demo-bob-right 1s ease-in-out infinite; }
  .side-right .demo-arrow { animation: demo-bob-left 1s ease-in-out infinite; }
  @keyframes demo-bob-up { 0%,100% { transform: translateY(0); } 50% { transform: translateY(12px); } }
  @keyframes demo-bob-down { 0%,100% { transform: rotate(180deg) translateY(0); } 50% { transform: rotate(180deg) translateY(12px); } }
  @keyframes demo-bob-right { 0%,100% { transform: rotate(90deg) translateY(0); } 50% { transform: rotate(90deg) translateY(12px); } }
  @keyframes demo-bob-left { 0%,100% { transform: rotate(-90deg) translateY(0); } 50% { transform: rotate(-90deg) translateY(12px); } }
  .demo-tip { background: ${INK}; color: #fff; font-weight: 600; font-size: 22px; line-height: 1.2; padding: 12px 20px;
    border-radius: 999px; border: 3px solid ${GLOW}; white-space: nowrap; box-shadow: 0 10px 24px rgba(0,0,0,.25);
    animation: demo-pop .35s cubic-bezier(.2,1.4,.4,1) both; }
  @keyframes demo-pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .demo-big-arrow { position: absolute; right: 120px; top: 50%; width: 150px; height: 220px; margin-top: -110px;
    opacity: 0; transition: opacity .3s ease; filter: drop-shadow(0 8px 16px rgba(0,0,0,.35)); }
  .demo-big-arrow.on { opacity: 1; animation: demo-fall .7s ease-in-out infinite; }
  @keyframes demo-fall { 0%,100% { transform: translateY(-18px); } 50% { transform: translateY(18px); } }
  .demo-highlight { position: absolute; left: 0; top: 0; border: 5px solid ${GLOW}; border-radius: 18px; opacity: 0;
    box-shadow: 0 0 0 9999px rgba(29,23,18,.28), 0 0 34px 6px rgba(255,184,28,.85); transition: opacity .35s ease; }
  .demo-highlight.on { opacity: 1; animation: demo-flash .5s ease-in-out 3; }
  @keyframes demo-flash { 0%,100% { border-color: ${GLOW}; } 50% { border-color: #fff; box-shadow: 0 0 0 9999px rgba(29,23,18,.28), 0 0 60px 16px rgba(255,220,120,1); } }
  .demo-highlight .demo-tip { position: absolute; right: 18px; top: -30px; }
  .demo-outro { position: absolute; inset: 0; background: #f7f1e8; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 18px; opacity: 0; transition: opacity 1s ease; }
  .demo-outro.on { opacity: 1; }
  .demo-outro .mark { font-family: 'Dancing Script', cursive; font-weight: 700; font-size: 190px; line-height: 1; color: ${INK};
    transform: scale(.92); transition: transform 1.6s cubic-bezier(.2,.8,.2,1); }
  .demo-outro.on .mark { transform: scale(1); animation: demo-logo-pulse 2.2s ease-in-out 1.2s infinite; }
  @keyframes demo-logo-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
  .demo-frame { position: absolute; inset: 0; border: 4px solid ${GLOW}; opacity: 0; transition: opacity .3s ease;
    box-shadow: inset 0 0 36px 4px rgba(255,184,28,.55); }
  .demo-frame.on { opacity: 1; }
  .demo-cover { position: absolute; inset: 0; background: #f7f1e8; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .35s ease; }
  .demo-cover.on { opacity: 1; }
  .demo-cover span { font-family: Fraunces, Georgia, serif; font-size: 56px; color: ${INK}; padding: 18px 40px;
    border-bottom: 5px solid ${GLOW}; }
  .demo-outro .line { font-family: Fraunces, Georgia, serif; font-size: 40px; color: ${INK}; }
  .demo-outro .sub { font-size: 22px; color: #6b5d50; letter-spacing: .02em; }
  .demo-outro .cta { margin-top: 18px; font-weight: 700; font-size: 22px; color: #fff; background: ${INK};
    padding: 14px 30px; border-radius: 999px; border: 3px solid ${GLOW}; }
  `;

  const arrowSvg = `<svg class="demo-arrow" viewBox="0 0 64 64"><path d="M32 4 L58 34 H42 V60 H22 V34 H6 Z"
    fill="${GLOW}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const bigArrowSvg = `<svg viewBox="0 0 150 220" width="150" height="220"><path d="M50 6 H100 V128 H142 L75 214 L8 128 H50 Z"
    fill="${GLOW}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/></svg>`;
  const cursorSvg = `<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z"
    fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  let layer;
  let cursor;
  let pointer = null;
  let highlight = null;
  let bigArrow;
  let frame;
  let coverNode = null;
  let pos = { x: -200, y: -200 };
  const COVER_KEY = 'kin-demo-cover';

  const maskCss = (window.__demoMasked || [])
    .map(
      (sel) => `${sel} { position: relative; color: transparent !important; user-select: none; }
      ${sel}::after { content: 'hidden for the video'; position: absolute; inset: 0; display: flex; align-items: center;
        padding: 0 10px; border-radius: 6px; background: ${INK}; color: #fff; font: 600 14px Inter, sans-serif; }`,
    )
    .join('\n');

  function mount() {
    if (layer && document.body.contains(layer)) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    const hide = document.createElement('style');
    hide.textContent = `.reset-demo, [class*="reset-demo"] { display: none !important; }\n${maskCss}`;
    document.head.appendChild(hide);
    layer = document.createElement('div');
    layer.id = 'demo-layer';
    cursor = document.createElement('div');
    cursor.className = 'demo-cursor';
    cursor.innerHTML = cursorSvg;
    bigArrow = document.createElement('div');
    bigArrow.className = 'demo-big-arrow';
    bigArrow.innerHTML = bigArrowSvg;
    frame = document.createElement('div');
    frame.className = 'demo-frame';
    layer.append(frame, bigArrow, cursor);
    document.body.appendChild(layer);
    const carried = sessionStorage.getItem(COVER_KEY);
    if (carried) {
      sessionStorage.removeItem(COVER_KEY);
      showCover(carried, true);
    }
  }

  const find = (target) => {
    const el =
      typeof target === 'string'
        ? document.querySelector(target)
        : [...document.querySelectorAll(target.sel)].find((node) => node.textContent.includes(target.text));
    if (!el) throw new Error(`Overlay target not found: ${JSON.stringify(target)}`);
    return el;
  };

  function selectText(target) {
    const el = find(target);
    el.focus();
    el.select();
  }

  function showCover(label, instant = false) {
    mount();
    coverNode?.remove();
    coverNode = document.createElement('div');
    coverNode.className = 'demo-cover';
    coverNode.innerHTML = `<span>${label}</span>`;
    if (instant) coverNode.classList.add('on');
    layer.insertBefore(coverNode, cursor);
    if (!instant) requestAnimationFrame(() => requestAnimationFrame(() => coverNode.classList.add('on')));
  }

  // Keeps the cover up across the next page load, so the cut never flashes.
  function carryCover(label) {
    sessionStorage.setItem(COVER_KEY, label);
  }

  function hideCover() {
    if (!coverNode) return;
    const node = coverNode;
    coverNode = null;
    node.classList.remove('on');
    setTimeout(() => node.remove(), 400);
  }

  function center(sel) {
    const r = find(sel).getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }

  function setCursor(x, y, ms = 0) {
    mount();
    cursor.style.transitionDuration = `${ms}ms`;
    // The SVG tip sits at (4,2) of a 24-unit box drawn at 34px.
    cursor.style.transform = `translate(${x - 6}px, ${y - 3}px)`;
    pos = { x, y };
  }

  function ripple(x, y) {
    mount();
    for (const extra of ['', ' second']) {
      const r = document.createElement('div');
      r.className = `demo-ripple${extra}`;
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      layer.appendChild(r);
      setTimeout(() => r.remove(), 1400);
    }
  }

  function pulse(sel) {
    mount();
    const r = find(sel).getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = 'demo-ring';
    Object.assign(ring.style, {
      left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px`,
    });
    layer.appendChild(ring);
    setTimeout(() => ring.remove(), 3600);
  }

  // Keeps the arrow glued to its target while the page lays out or scrolls.
  function placePointer() {
    if (!pointer) return;
    const { el, node } = pointer;
    if (!document.body.contains(el)) return;
    const r = el.getBoundingClientRect();
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const gap = 10;
    const margin = 24;
    const room = {
      bottom: window.innerHeight - r.bottom - gap - margin >= h,
      top: r.top - gap - margin >= h,
      right: window.innerWidth - r.right - gap - margin >= w,
      left: r.left - gap - margin >= w,
    };
    const opposite = { bottom: 'top', top: 'bottom', left: 'right', right: 'left' };
    let side = pointer.wanted;
    if (!room[side] && room[opposite[side]]) side = opposite[side];
    if (side !== pointer.side) {
      node.classList.replace(`side-${pointer.side}`, `side-${side}`);
      pointer.side = side;
    }
    let x;
    let y;
    if (side === 'bottom') { x = r.left + r.width / 2 - w / 2; y = r.bottom + gap; }
    else if (side === 'top') { x = r.left + r.width / 2 - w / 2; y = r.top - h - gap; }
    else if (side === 'left') { x = r.left - w - gap; y = r.top + r.height / 2 - h / 2; }
    else { x = r.right + gap; y = r.top + r.height / 2 - h / 2; }
    x = Math.max(16, Math.min(window.innerWidth - w - 16, x));
    y = Math.max(16, Math.min(window.innerHeight - h - 16, y));
    node.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function arrow(sel, text, side = 'bottom') {
    mount();
    clearArrow(true);
    const node = document.createElement('div');
    node.className = `demo-pointer side-${side}`;
    node.innerHTML = `${arrowSvg}<div class="demo-tip">${text}</div>`;
    layer.appendChild(node);
    pointer = { el: find(sel), node, side, wanted: side };
    placePointer();
    requestAnimationFrame(() => node.classList.add('on'));
  }

  function clearArrow(now = false) {
    if (!pointer) return;
    const { node } = pointer;
    pointer = null;
    if (now) return node.remove();
    node.classList.remove('on');
    setTimeout(() => node.remove(), 350);
  }

  function placeHighlight() {
    if (!highlight) return;
    const r = highlight.el.getBoundingClientRect();
    const pad = 14;
    const left = Math.max(8, r.left - pad);
    const top = Math.max(8, r.top - pad);
    const right = Math.min(window.innerWidth - 8, r.right + pad);
    const bottom = Math.min(window.innerHeight - 8, r.bottom + pad);
    Object.assign(highlight.node.style, {
      transform: `translate(${left}px, ${top}px)`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
    });
  }

  function showHighlight(sel, text) {
    mount();
    clearHighlight(true);
    const node = document.createElement('div');
    node.className = 'demo-highlight';
    node.innerHTML = text ? `<div class="demo-tip">${text}</div>` : '';
    layer.insertBefore(node, cursor);
    highlight = { el: find(sel), node };
    placeHighlight();
    requestAnimationFrame(() => node.classList.add('on'));
  }

  function clearHighlight(now = false) {
    if (!highlight) return;
    const { node } = highlight;
    highlight = null;
    if (now) return node.remove();
    node.classList.remove('on');
    setTimeout(() => node.remove(), 400);
  }

  function showBigArrow(on) {
    mount();
    bigArrow.classList.toggle('on', on);
  }

  function smoothScroll(scrollerSel, { targetSel, offset = 0, top, ms = 1500 }) {
    mount();
    let scroller = scrollerSel === 'window' ? document.scrollingElement : find(scrollerSel);
    if (targetSel && scroller.scrollHeight <= scroller.clientHeight) {
      let node = find(targetSel).parentElement;
      while (node && !(node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY))) {
        node = node.parentElement;
      }
      if (node) scroller = node;
    }
    const isWindow = scroller === document.scrollingElement;
    const from = scroller.scrollTop;
    let to = top ?? 0;
    if (targetSel) {
      const s = isWindow ? { top: 0 } : scroller.getBoundingClientRect();
      const t = find(targetSel).getBoundingClientRect();
      to = from + (t.top - s.top) - offset;
    }
    to = Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, to));
    const start = performance.now();
    const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    frame.classList.add('on');
    return new Promise((resolve) => {
      const step = (now) => {
        const p = Math.min(1, (now - start) / ms);
        scroller.scrollTop = from + (to - from) * ease(p);
        if (p < 1) requestAnimationFrame(step);
        else {
          setTimeout(() => frame.classList.remove('on'), 250);
          resolve(Math.round(to - from));
        }
      };
      requestAnimationFrame(step);
    });
  }

  function outro() {
    mount();
    clearArrow(true);
    clearHighlight(true);
    cursor.style.opacity = '0';
    const node = document.createElement('div');
    node.className = 'demo-outro';
    node.innerHTML = `<div class="mark brand-mark">Kin</div>
      <div class="line">Giving and getting go together.</div>
      <div class="sub">Fundraising websites · campaigns · promoters · gifts</div>
      <div class="cta">Try Kin today</div>`;
    layer.appendChild(node);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('on')));
  }

  const tick = () => {
    placePointer();
    placeHighlight();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.__demo = {
    mount, find, center, setCursor, ripple, pulse, arrow, clearArrow, showHighlight, clearHighlight,
    showBigArrow, smoothScroll, outro, selectText, showCover, carryCover, hideCover, get pos() { return pos; },
  };
})();
