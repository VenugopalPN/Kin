// Plays the scene timeline against the running Kin app in a headless
// Chromium browser with a throwaway profile, and saves the screencast frames
// with their capture times. DRY=1 runs the timeline without saving frames.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES, VIDEO } from './scenes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, '..');
const FRAMES = join(ROOT, 'work', 'frames');
const DRY = process.env.DRY === '1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BROWSERS = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xc2) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return { w: 0, h: 0 };
}

async function reachable(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

async function ensureApp() {
  if (await reachable(VIDEO.baseUrl)) return null;
  console.log(`Starting the app on ${VIDEO.baseUrl} ...`);
  const vite = spawn('npx', ['vite', '--port', '4322', '--strictPort'], { cwd: APP, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 60; i += 1) {
    if (await reachable(VIDEO.baseUrl)) return vite;
    await sleep(500);
  }
  throw new Error(`The app did not start on ${VIDEO.baseUrl}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} ${msg.error.data ?? ''}`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) ?? []), fn]);
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve({ send, on, close: () => ws.close() }));
    ws.addEventListener('error', reject);
  });
}

async function main() {
  const browserPath = BROWSERS.find((p) => existsSync(p));
  if (!browserPath) throw new Error('No Chrome or Edge found. Set CHROME to a Chromium browser executable.');
  const vite = await ensureApp();

  const profile = mkdtempSync(join(tmpdir(), 'kin-demo-profile-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const browser = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    // Screencast frames show the real window's drawable area, whatever the
    // emulated metrics say; the window is resized to fit exactly below.
    `--window-size=${VIDEO.viewport.width},${VIDEO.viewport.height}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--mute-audio',
    'about:blank',
  ]);

  const failures = [];
  try {
    let target = null;
    for (let i = 0; i < 40 && !target; i += 1) {
      await sleep(250);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
        if (res.ok) target = await res.json();
      } catch {}
    }
    if (!target) throw new Error('Browser did not open a debugging port');
    const cdp = await connect(target.webSocketDebuggerUrl);
    const evaluate = async (expression, awaitPromise = false) => {
      const res = await cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
      return res.result.value;
    };

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    const origin = new URL(VIDEO.baseUrl).origin;
    const session = Object.entries(VIDEO.session)
      .map(([k, v]) => `sessionStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
      .join('');
    cdp.on('Page.javascriptDialogOpening', () => {
      cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `if (location.origin === ${JSON.stringify(origin)}) { ${session} }
        window.__demoMasked = ${JSON.stringify(VIDEO.masked ?? [])};
        ${readFileSync(join(ROOT, 'scripts', 'overlay.js'), 'utf8')}
        document.addEventListener('DOMContentLoaded', () => window.__demo.mount());`,
    });
    await cdp.send('Page.navigate', { url: `${VIDEO.baseUrl}/` });
    for (let i = 0; i < 60; i += 1) {
      await sleep(250);
      const ready = await evaluate(`!!document.querySelector('.landing-card') && !!window.__demo`).catch(() => false);
      if (ready) break;
    }
    await evaluate('document.fonts.ready.then(() => true)', true);
    await sleep(600);

    const frames = [];
    if (!DRY) {
      rmSync(FRAMES, { recursive: true, force: true });
      mkdirSync(FRAMES, { recursive: true });
    }
    let t0 = null;
    const badSizes = new Set();
    let surface = null;
    cdp.on('Page.screencastFrame', ({ data, sessionId, metadata }) => {
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      surface = { w: metadata.deviceWidth, h: metadata.deviceHeight };
      if (t0 === null) return;
      const jpeg = Buffer.from(data, 'base64');
      const size = jpegSize(jpeg);
      if (size.w !== VIDEO.viewport.width || size.h !== VIDEO.viewport.height) badSizes.add(`${size.w}x${size.h}`);
      if (DRY) return;
      const file = `${String(frames.length).padStart(5, '0')}.jpg`;
      writeFileSync(join(FRAMES, file), jpeg);
      frames.push({ file, t: (performance.now() - t0) / 1000 });
    });
    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 92,
      maxWidth: VIDEO.width,
      maxHeight: VIDEO.height,
      everyNthFrame: 1,
    });
    const repaint = () => evaluate('document.body.style.outline = document.body.style.outline ? "" : "1px solid transparent"');
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    for (let attempt = 0; attempt < 6; attempt += 1) {
      surface = null;
      await repaint();
      for (let i = 0; i < 20 && !surface; i += 1) await sleep(50);
      if (!surface) continue;
      const dw = VIDEO.viewport.width - surface.w;
      const dh = VIDEO.viewport.height - surface.h;
      if (!dw && !dh) break;
      const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: bounds.width + dw, height: bounds.height + dh } });
      await sleep(400);
    }
    await sleep(300);

    const mouse = (type, x, y) =>
      cdp.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
    const centerOf = (sel) => evaluate(`window.__demo.center(${JSON.stringify(sel)})`);
    const vars = {};
    const fill = (text) => text.replace(/\{(\w+)\}/g, (_, name) => {
      if (!(name in vars)) throw new Error(`{${name}} was never captured`);
      return encodeURIComponent(vars[name]);
    });
    let cursorAt = { x: 800, y: 820 };

    const actions = {
      cursor: (s) => {
        cursorAt = { x: s.x, y: s.y };
        return evaluate(`window.__demo.setCursor(${s.x}, ${s.y}, 0)`);
      },
      async navigate(s) {
        await evaluate(`window.__demo.clearArrow(true); window.__demo.clearHighlight(true); window.__demo.showCover(${JSON.stringify(s.label)})`);
        await sleep(420);
        // Route inside the running app (React Router listens to popstate);
        // a full reload through the dev server takes seconds and breaks sync.
        const path = fill(s.path);
        await evaluate(`history.pushState({}, '', ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent('popstate'))`);
        await sleep(100);
        if ((await evaluate('location.pathname + location.search')) !== path) {
          await evaluate(`window.__demo.carryCover(${JSON.stringify(s.label)})`);
          await cdp.send('Page.navigate', { url: `${VIDEO.baseUrl}${path}` });
        }
        let ready = false;
        for (let i = 0; i < 40 && !ready; i += 1) {
          await sleep(100);
          ready = await evaluate(`!!window.__demo && !!document.querySelector(${JSON.stringify(s.waitFor)})`).catch(() => false);
        }
        if (!ready) throw new Error(`${s.waitFor} did not appear after navigating to ${s.path}`);
        await evaluate(`window.__demo.mount(); window.__demo.setCursor(${cursorAt.x}, ${cursorAt.y}, 0)`);
        await sleep(450);
        await evaluate('window.__demo.hideCover()');
      },
      selectText: (s) => evaluate(`window.__demo.selectText(${JSON.stringify(s.target)})`),
      async captureVar(s) {
        vars[s.name] = await evaluate(s.expression);
        if (!vars[s.name]) throw new Error(`could not capture {${s.name}}`);
      },
      async expectChecked(s) {
        const checked = await evaluate(`!!window.__demo.find(${JSON.stringify(s.target)}).checked`);
        if (!checked) throw new Error(`expected ${JSON.stringify(s.target)} to be checked`);
      },
      arrow: (s) => evaluate(`window.__demo.arrow(${JSON.stringify(s.target)}, ${JSON.stringify(s.text)}, ${JSON.stringify(s.side)})`),
      clearArrow: () => evaluate('window.__demo.clearArrow()'),
      async moveTo(s) {
        const { x, y } = await centerOf(s.target);
        cursorAt = { x, y };
        await evaluate(`window.__demo.setCursor(${x}, ${y}, ${s.ms})`);
        sleep(s.ms).then(() => mouse('mouseMoved', x, y)).catch(() => {});
      },
      async click(s) {
        const { x, y } = await centerOf(s.target);
        cursorAt = { x, y };
        await evaluate(`window.__demo.setCursor(${x}, ${y}, 120); window.__demo.ripple(${x}, ${y});${s.clear ? ' window.__demo.clearArrow(true);' : ''}`);
        await mouse('mouseMoved', x, y);
        await mouse('mousePressed', x, y);
        await sleep(70);
        await mouse('mouseReleased', x, y);
      },
      pulse: (s) => evaluate(`window.__demo.pulse(${JSON.stringify(s.target)})`),
      async type(s) {
        for (const ch of s.text) {
          await cdp.send('Input.insertText', { text: ch });
          await sleep(s.perChar);
        }
      },
      bigArrow: (s) => evaluate(`window.__demo.showBigArrow(${s.show})`),
      scrollTo: (s) =>
        evaluate(
          `window.__demo.smoothScroll(${JSON.stringify(s.scroller)}, ${JSON.stringify({ targetSel: s.target, offset: s.offset, top: s.top, ms: s.ms })}); true`,
        ),
      highlight: (s) => evaluate(`window.__demo.showHighlight(${JSON.stringify(s.target)}, ${JSON.stringify(s.text)})`),
      clearHighlight: () => evaluate('window.__demo.clearHighlight()'),
      outro: () => evaluate('window.__demo.outro()'),
      async expectPath(s) {
        const path = await evaluate('location.pathname');
        if (path !== s.path) throw new Error(`expected path ${s.path}, got ${path}`);
      },
      async expectText(s) {
        const text = await evaluate(`document.querySelector(${JSON.stringify(s.target)})?.textContent ?? ''`);
        if (!text.includes(s.text)) throw new Error(`expected "${s.text}" in ${s.target}, got "${text}"`);
      },
      async expectValue(s) {
        const value = await evaluate(`document.querySelector(${JSON.stringify(s.target)})?.value ?? ''`);
        if (!value.includes(s.contains)) throw new Error(`expected ${s.target} to contain "${s.contains}", got "${value}"`);
      },
    };

    const steps = SCENES.flatMap((scene) => scene.steps.map((step) => ({ ...step, scene: scene.id })));
    t0 = performance.now();
    for (const step of steps) {
      const wait = t0 + step.at * 1000 - performance.now();
      if (wait > 0) await sleep(wait);
      else if (wait < -150) console.warn(`  late by ${(-wait).toFixed(0)}ms: ${step.scene} ${step.do} @${step.at}s`);
      try {
        await actions[step.do](step);
      } catch (err) {
        failures.push(`${step.scene} @${step.at}s ${step.do}: ${err.message}`);
        console.error(`  FAIL ${step.scene} @${step.at}s ${step.do}: ${err.message}`);
      }
    }
    const end = t0 + (VIDEO.duration + 0.4) * 1000 - performance.now();
    if (end > 0) await sleep(end);
    await cdp.send('Page.stopScreencast');
    t0 = null;
    if (badSizes.size) {
      const msg = `captured ${[...badSizes].join(', ')} instead of full 16:9 ${VIDEO.viewport.width}x${VIDEO.viewport.height} frames`;
      failures.push(msg);
      console.error(`  FAIL ${msg}`);
    }

    if (!DRY) {
      writeFileSync(join(ROOT, 'work', 'frames.json'), JSON.stringify(frames));
      console.log(`Saved ${frames.length} frames over ${frames.at(-1)?.t.toFixed(2)}s to work/frames.`);
    }
    cdp.close();
  } finally {
    browser.kill();
    if (vite) spawn('taskkill', ['/pid', String(vite.pid), '/t', '/f'], { stdio: 'ignore' });
    await sleep(1500);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }

  if (failures.length) {
    console.error(`${failures.length} step(s) failed; the recording does not match the expected results.`);
    process.exit(1);
  }
  console.log(DRY ? 'Dry run passed: every step found its target and every expected result matched.' : 'Recording passed all checks.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
