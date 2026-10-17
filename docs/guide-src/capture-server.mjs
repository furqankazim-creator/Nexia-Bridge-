// Screens that only exist when the app is connected to a server (sign-in and sign-up). Needs the app running with VITE_API_URL set.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open, setView, mark, unmark, press, fill, pick, w } from './capture-lib.mjs';
import { SHOTS } from './shots.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'screenshots');
const manifestFile = path.join(here, 'manifest.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const { b, p } = await open(process.env.GUIDE_BASE || 'http://127.0.0.1:3115/');
const steps = {
  signin: async () => {},
  register: async () => { await press(p, 'Create account', { exact: true, last: false }); await w(400); await fill(p, 'Full name', 'Hind Al-Mutairi'); await pick(p, 'I am a', 'Parent'); await fill(p, 'Email', 'hind@example.com'); await fill(p, 'Password', 'password123'); await fill(p, 'Invite code', '0AA50F5F'); await w(300); },
};
for (const s of SHOTS.filter((x) => x.server)) {
  process.stdout.write(`${s.id} ... `);
  await setView(p, 'm', s.height);
  await steps[s.id]();
  const placed = await mark(p, s.marks.map((m) => m[0]));
  await p.screenshot({ path: path.join(OUT, `${s.id}.png`) });
  await unmark(p);
  manifest[s.id] = { placed };
  console.log(`ok (${placed.length}/${s.marks.length} markers)`);
}
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
await b.close();
