// Shared helpers for the guide: drive the demo app and put numbered markers on the screen.
import puppeteer from 'puppeteer-core';

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const w = (ms) => new Promise((r) => setTimeout(r, ms));

export async function open(base = 'http://127.0.0.1:3120/', { keepLaunch = false } = {}) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const p = await b.newPage();
  p.on('dialog', (d) => d.accept());
  await p.setViewport({ width: 390, height: 1000, deviceScaleFactor: 2 });
  await p.goto(base + (base.includes('?') ? '&' : '?') + 'portals=all'); // the quick portal switcher is for testers only
  await w(1200);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await w(1600);
  // The app now opens on the welcome screen: pick a portal so the header exists, unless the shot wants the welcome screen.
  if (!keepLaunch) {
    await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Parent')?.click());
    await w(900);
  }
  return { b, p };
}

export const setView = (p, device, height) =>
  p.setViewport(device === 'd' ? { width: 1280, height: height ?? 860, deviceScaleFactor: 1.5 } : { width: 390, height: height ?? 1000, deviceScaleFactor: 2 });

export async function setRole(p, name) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await p.keyboard.press('Escape');
    await p.evaluate(() => document.querySelector('header button[title="Switch role"]').click());
    await w(300);
    const ok = await p.evaluate((n) => { const b = [...document.querySelectorAll('header button')].find((x) => x.innerText.trim().startsWith(n) && x.closest('.absolute')); if (b) b.click(); return !!b; }, name);
    await w(900);
    if (ok) return;
  }
  throw new Error(`could not switch to ${name}`);
}
export async function tab(p, label) {
  await p.evaluate((l) => { [...document.querySelectorAll('nav button')].find((x) => x.innerText.trim().split('\n').map((t) => t.trim()).includes(l)).click(); }, label);
  await w(700);
  await p.evaluate(() => document.querySelectorAll('.app-scroll').forEach((e) => { e.scrollTop = 0; }));
  await w(200);
}
export async function press(p, text, { exact = false, last = true } = {}) {
  const ok = await p.evaluate((t, exact, last) => {
    const bs = [...document.querySelectorAll('button, [role=tab], [role=radio]')].filter((b) => b.offsetParent !== null);
    const hits = bs.filter((b) => { const x = b.innerText.replace(/\s+/g, ' ').trim(); return exact ? x === t : x.startsWith(t); });
    const e = last ? hits[hits.length - 1] : hits[0];
    if (e) e.click();
    return !!e;
  }, text, exact, last);
  if (!ok) console.log('   (could not press)', text);
  await w(500);
  return ok;
}
export const scrollTo = (p, y) => p.evaluate((y) => document.querySelectorAll('.app-scroll').forEach((e) => { e.scrollTop = y; }), y);
export async function fill(p, label, value) {
  await p.evaluate((l, v) => {
    const e = [...document.querySelectorAll(`[aria-label="${l}"]`)].filter((x) => x.offsetParent !== null).pop();
    const proto = e.tagName === 'SELECT' ? HTMLSelectElement.prototype : e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, v);
    e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }, label, value);
  await w(150);
}
export async function pick(p, label, text) {
  await p.evaluate((l, t) => {
    const e = [...document.querySelectorAll(`select[aria-label="${l}"]`)].filter((x) => x.offsetParent !== null).pop();
    const o = [...e.options].find((o) => o.text.startsWith(t));
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(e, o.value);
    e.dispatchEvent(new Event('change', { bubbles: true }));
  }, label, text);
  await w(200);
}

/**
 * Put numbered red markers on the things a page explains. `specs` are text to find (or {sel}).
 * Returns the numbers that were actually placed, in order, so the legend only lists what is on the picture.
 */
export async function mark(p, specs) {
  return p.evaluate((specs) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
    const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const find = (spec) => {
      if (typeof spec === 'object') { const all = [...document.querySelectorAll(spec.sel)].filter(vis); return all[spec.nth ?? 0] ?? null; }
      const t = norm(spec);
      const byAria = [...document.querySelectorAll('[aria-label],[title],[placeholder]')].filter((e) => vis(e) && [e.getAttribute('aria-label'), e.getAttribute('title'), e.getAttribute('placeholder')].some((a) => a && norm(a).startsWith(t)));
      if (byAria.length) return byAria[0];
      const cands = [...document.querySelectorAll('button, a, label, [role=tab], [role=radio], h1, h2, h3, h4, h5, summary, select, input, textarea, p, span, li, div')].filter((e) => vis(e) && norm(e.innerText ?? '').includes(t));
      if (!cands.length) return null;
      const btns = cands.filter((e) => /^(button|a|label|summary)$/i.test(e.tagName) || e.getAttribute('role') === 'tab' || e.getAttribute('role') === 'radio');
      const pool = btns.length ? btns : cands;
      pool.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
      return pool[0];
    };
    const placed = [];
    let n = 0;
    specs.forEach((spec, i) => {
      const el = find(spec);
      if (!el) return;
      const r = el.getBoundingClientRect();
      n += 1;
      const box = document.createElement('div');
      box.setAttribute('data-guide-mark', '1');
      Object.assign(box.style, { position: 'fixed', left: `${r.left - 2}px`, top: `${r.top - 2}px`, width: `${r.width + 4}px`, height: `${r.height + 4}px`, border: '2px solid #E11D48', borderRadius: '10px', pointerEvents: 'none', zIndex: 99998, boxSizing: 'border-box' });
      const dot = document.createElement('div');
      dot.setAttribute('data-guide-mark', '1');
      dot.textContent = String(n);
      const size = 22;
      Object.assign(dot.style, { position: 'fixed', left: `${Math.max(2, Math.min(innerWidth - size - 2, r.left - 8))}px`, top: `${Math.max(2, r.top - 10)}px`, width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: '#E11D48', color: '#fff', font: '700 12px/22px system-ui, sans-serif', textAlign: 'center', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,.35)', pointerEvents: 'none', zIndex: 99999 });
      document.body.appendChild(box);
      document.body.appendChild(dot);
      placed.push(i);
    });
    return placed;
  }, specs);
}
export const unmark = (p) => p.evaluate(() => document.querySelectorAll('[data-guide-mark]').forEach((e) => e.remove()));
