// Integration check: runs all four roles through the real UI against a running backend.
// Needs 'npm run server' (port 4000) and 'VITE_API_URL=http://127.0.0.1:4000 npx vite --port 3115';
// pass the invite codes the server prints: PC=<family code> SC=<staff code> AC=<admin code> node connect-check.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { CHROME, w, tab, press, fill } from '/Users/imac/Desktop/Autism 4/Nexus-Bridge-/docs/guide-src/capture-lib.mjs';
const API = 'http://127.0.0.1:4000', WEB = 'http://127.0.0.1:3115/';
const CODES = { parent: process.env.PC, staff: process.env.SC, admin: process.env.AC };
const O = '/private/tmp/claude-501/-Users-imac-Desktop-Autism-4/3b2be0ae-852c-4feb-8018-d9b069587c94/scratchpad/';
const sfx = Date.now().toString(36);
const call = async (m, u, body, tok) => { const r = await fetch(API + u, { method: m, headers: { 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const reg = (name, role, code) => call('POST', '/api/auth/register', { name, email: `${role}-${sfx}@t.com`, password: 'password123', role, code });
let fails = 0; const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };

const T = await reg('Dr Connect', 'behavior', CODES.staff), S = await reg('Sup Connect', 'supervisor', CODES.staff), A = await reg('Admin Connect', 'admin', CODES.admin), P = await reg('Parent Connect', 'parent', CODES.parent);
ok([T, S, A, P].every((x) => x.status === 201), 'four accounts created on the backend');
const tt = T.body.token;
await call('PUT', '/api/records/homeTasks/ht-connect/', { childId: 'child-lama', data: { id: 'ht-connect', childId: 'child-lama', title: 'Connect-test home task', instructions: 'x', frequency: 'daily', dueDate: '', assignedBy: 'Dr Connect', done: false, doneAt: null, parentNote: '' } }, tt);
await call('PUT', '/api/records/homeTasks/ht-connect', { childId: 'child-lama', data: { id: 'ht-connect', childId: 'child-lama', title: 'Connect-test home task', instructions: 'Practise the break card', frequency: 'daily', dueDate: '', assignedBy: 'Dr Connect', done: false, doneAt: null, parentNote: '' } }, tt);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
async function login(email, role) {
  const p = await browser.newPage();
  p.on('dialog', (d) => d.accept());
  await p.setViewport({ width: role === 'supervisor' || role === 'admin' ? 1280 : 390, height: role === 'supervisor' || role === 'admin' ? 860 : 1000, deviceScaleFactor: 1 });
  await p.goto(WEB); await w(1500);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await w(1500);
  await fill(p, 'Email', email); await fill(p, 'Password', 'password123');
  await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Sign in').pop().click());
  await w(3500);
  return p;
}
const toLama = async (p) => {
  await p.evaluate(() => [...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Child:'))?.click()); await w(500);
  await p.evaluate(() => [...document.querySelectorAll('header button, header [role=option], header li')].filter((b) => b.innerText.includes('Lama')).pop()?.click()); await w(1200);
};
const text = (p) => p.evaluate(() => document.body.innerText);

// parent
const pp = await login(`parent-${sfx}@t.com`, 'parent');
let t = await text(pp);
ok(!t.includes('Sign in') || t.includes('Sarah') || t.includes('Lama'), 'parent signed in to the backend');
await tab(pp, 'Home'); await w(1500);
ok((await text(pp)).includes('Connect-test home task'), "parent sees the therapist's home task (therapist → backend → parent)");
await tab(pp, 'Records');
await press(pp, 'Add', { exact: true });
await fill(pp, 'Title', 'EEG connect test'); await fill(pp, 'Category', 'neuro'); await fill(pp, 'Date of report', '2022-03-14');
const pdf = O + 'eeg.pdf';
fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
await (await pp.$('[data-testid=file-input]')).uploadFile(pdf);
await press(pp, 'Choose people'); await press(pp, 'Supervisor');
await press(pp, 'Save record'); await w(3500);
ok((await text(pp)).includes('EEG connect test'), 'parent saved a record with a file to the backend');

// supervisor
const sp = await login(`supervisor-${sfx}@t.com`, 'supervisor');
await tab(sp, 'Children'); await w(2500);
const opened = await sp.evaluate(() => { const b = [...document.querySelectorAll('article')].find((a) => a.innerText.includes('Lama')); if (b) (b.querySelector('button') ?? b).click(); return !!b; });
await w(700);
await press(sp, 'Medical records');
await w(1500);
t = await text(sp);
ok(t.includes('EEG connect test'), 'supervisor sees the record the parent shared (parent → backend → supervisor)');
await sp.evaluate(() => [...document.querySelectorAll('[data-testid=record-card]')].find((x) => x.innerText.includes('EEG connect')).click()); await w(500);
await sp.evaluate(() => [...document.querySelectorAll('[data-testid=record-detail] button')].find((x) => /pdf/.test(x.innerText)).click()); await w(1800);
ok(await sp.evaluate(() => !!document.querySelector('[data-testid=file-viewer] iframe')) && !(await text(sp)).includes('not found'), 'supervisor opens the PDF from the backend');
await sp.screenshot({ path: O + 'connect-sup.png' });

// therapist (record NOT shared with behavior)
const tp = await login(`behavior-${sfx}@t.com`, 'behavior');
await toLama(tp);
await tab(tp, 'Family'); await press(tp, 'Medical'); await w(1500);
t = await text(tp);
ok(!t.includes('EEG connect test'), 'behavior therapist does not see a record shared only with the supervisor');
await press(tp, 'Home tasks'); await w(800); console.log('   therapist child line:', (await text(tp)).match(/Child:[^\n]*|Lama[^\n]*/)?.[0], '| has task:', (await text(tp)).includes('Connect-test'));
ok((await text(tp)).includes('Connect-test home task'), 'therapist sees own home task after reload');

// parent ticks task -> therapist sees done
await tab(pp, 'Home');
const ticked = await pp.evaluate(() => { const el = [...document.querySelectorAll('button')].find((b) => b.closest('div')?.innerText.includes('Connect-test home task') && /done|mark|complete/i.test(b.innerText + b.getAttribute('aria-label'))); if (el) el.click(); return !!el; });
console.log('   (parent tick button found:', ticked, ')');

// admin
const ap = await login(`admin-${sfx}@t.com`, 'admin');
await w(1500);
t = await text(ap);
ok(/Lama|Maya|Tariq/.test(t) || t.includes('Home'), 'admin signed in to the backend');
ok(!t.includes('EEG connect test'), 'admin never sees the medical record');
const aud = await call('GET', '/api/admin/audit', null, A.body.token);
ok(JSON.stringify(aud.body).includes('medical.view'), 'admin audit log shows the supervisor opening the file');
await ap.screenshot({ path: O + 'connect-admin.png' });
console.log(fails ? `${fails} FAILED` : 'ALL CONNECTED');
await browser.close();
