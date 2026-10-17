// Takes the screenshots for the client guide from the running demo app.  Usage: node capture.mjs [id,id,...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open, setView, setRole, tab, mark, unmark, w } from './capture-lib.mjs';
import { SHOTS } from './shots.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2]?.split(',');
const manifestFile = path.join(here, 'manifest.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};

const { b, p } = await open(process.env.GUIDE_BASE || 'http://127.0.0.1:3120/');
let currentRole = 'Parent portal';
for (const s of SHOTS) {
  if (only && !only.includes(s.id)) continue;
  if (s.server) continue; // those need the real server and are taken by capture-server.mjs
  process.stdout.write(`${s.id} ... `);
  try {
    await setView(p, s.device ?? 'm', s.height);
    await w(300);
    if (s.role && s.role !== currentRole) { await setRole(p, s.role); currentRole = s.role; }
    if (s.tab) await tab(p, s.tab);
    if (s.setup) await s.setup(p);
    await w(300);
    const placed = s.marks?.length ? await mark(p, s.marks.map((m) => m[0])) : [];
    await w(200);
    await p.screenshot({ path: path.join(OUT, `${s.id}.png`) });
    await unmark(p);
    if (s.after) await s.after(p);
    manifest[s.id] = { placed };
    console.log(`ok (${placed.length}/${s.marks?.length ?? 0} markers)`);
  } catch (e) {
    console.log('FAILED', e.stack.split('\n').slice(0,4).join(' | '));
  }
}
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
await b.close();
