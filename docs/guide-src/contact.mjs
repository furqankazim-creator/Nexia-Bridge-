import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { CHROME } from './capture-lib.mjs';
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((f) => /^p\d+\.png$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const per = 12;
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 1500, height: 1100 });
for (let i = 0; i < files.length; i += per) {
  const chunk = files.slice(i, i + per);
  const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:6px">${chunk.map((f, k) => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(`${dir}/${f}`).toString('base64')}" style="width:100%;display:block"><span style="position:absolute;top:2px;left:2px;background:#000a;color:#fff;font:bold 12px sans-serif;padding:1px 4px">${i + k + 1}</span></div>`).join('')}</body>`;
  await p.setContent(html);
  await p.screenshot({ path: `${dir}/sheet${String(i / per + 1).padStart(2, '0')}.png`, fullPage: true });
}
await b.close();
console.log('sheets', Math.ceil(files.length / per));
