// Empty-state sweep: every portal and every tab for a brand-new child (no goals, sessions, tasks or records) must open without errors.
// Needs the test backend + dev server (see family-check.mjs). Usage: PC=<family code of any child> node sweep-check.mjs
import puppeteer from 'puppeteer-core';
import { CHROME, w } from './capture-lib.mjs';
const API='http://127.0.0.1:4100', WEB='http://127.0.0.1:3116/', SC='E2ESTAFF', AC='E2EADMIN';
const call=async(m,u,b,t)=>{const r=await fetch(API+u,{method:m,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json().catch(()=>({}))};};
const reg=(name,email,role,code)=>call('POST','/api/auth/register',{name,email,password:'password123',role,code});
const roles=[['behavior',SC],['speech',SC],['ot',SC],['remedial',SC],['teacher',SC],['supervisor',SC],['admin',AC],['parent',process.env.PC]];
for (const [r,c] of roles) await reg(`Test ${r}`,`${r}@sweep.com`,r,c);
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new'});
let bad=0;
for (const [role] of roles) {
  const tok=(await call('POST','/api/auth/login',{email:`${role}@sweep.com`,password:'password123'})).body.token;
  const p=await browser.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
  await p.setViewport(role==='supervisor'||role==='admin'?{width:1280,height:860}:{width:390,height:1000});
  await p.goto(WEB); await w(500); await p.evaluate((t)=>{localStorage.clear();localStorage.setItem('nexia.token',t);},tok); await p.reload(); await w(3000);
  if (role!=='parent'&&role!=='admin') { await p.evaluate(()=>[...document.querySelectorAll('header button')].find(b=>b.innerText.includes('Child:')||b.innerText.includes('children'))?.click()); await w(300); await p.evaluate(()=>[...document.querySelectorAll('header button, header [role=option], header li')].filter(b=>b.innerText.includes('Tariq')).pop()?.click()); await w(1200); }
  const labels=await p.evaluate(()=>[...document.querySelectorAll('nav button')].map(b=>b.innerText.trim().split('\n').pop().trim()).filter(Boolean));
  for (const l of labels) {
    await p.evaluate((l)=>{[...document.querySelectorAll('nav button')].find(b=>b.innerText.trim().split('\n').map(x=>x.trim()).includes(l))?.click();},l); await w(700);
    const len=(await p.evaluate(()=>document.body.innerText)).length;
    if (len<150) errs.push(`blank screen on ${l}`);
  }
  console.log(errs.length?'FAIL':'PASS', role.padEnd(10), labels.join(', '), errs.length?errs.join(' | '):''); if(errs.length) bad++;
  await p.close();
}
console.log(bad?`${bad} PORTALS BROKEN`:'ALL PORTALS OPEN CLEANLY'); await browser.close();
