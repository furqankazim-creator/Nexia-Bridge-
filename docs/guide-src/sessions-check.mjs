// Session flow check (run after goals-check on the same backend): each therapist saves a datasheet -> parent Sessions, supervisor Review.
import puppeteer from 'puppeteer-core';
import { CHROME, w, tab } from './capture-lib.mjs';
const API='http://127.0.0.1:4100', WEB='http://127.0.0.1:3116/';
const call=async(m,u,b,t)=>{const r=await fetch(API+u,{method:m,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json().catch(()=>({}))};};
let fails=0; const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) fails++;};
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new'}); const tokens={};
async function login(email,role){
  if(!tokens[email]) tokens[email]=(await call('POST','/api/auth/login',{email,password:'password123'})).body.token;
  const p=await browser.newPage(); p.on('dialog',d=>d.accept()); p.on('pageerror',e=>console.log('   PAGEERROR',e.message.slice(0,140)));
  await p.setViewport(role==='supervisor'?{width:1280,height:900}:{width:390,height:1400});
  await p.goto(WEB); await w(600); await p.evaluate((t)=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('nexia.token',t);},tokens[email]); await p.reload(); await w(3200); return p;
}
const text=p=>p.evaluate(()=>document.body.innerText);
const toLama=async p=>{await p.evaluate(()=>[...document.querySelectorAll('header button')].find(b=>b.innerText.includes('Child:'))?.click());await w(400);await p.evaluate(()=>[...document.querySelectorAll('header button, header [role=option], header li')].filter(b=>b.innerText.includes('Lama')).pop()?.click());await w(1500);};
const click=async(p,label,{exact=false}={})=>{const r=await p.evaluate((l,ex)=>{const e=[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&(ex?b.innerText.trim()===l:b.innerText.includes(l))).pop();if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2};},label,exact);if(!r){console.log('   (no button)',label);return false;}await p.mouse.click(r.x,r.y);await w(900);return true;};
const names={behavior:'T behavior',speech:'Sam Speech',ot:'T ot',remedial:'T remedial'};
for (const role of Object.keys(names)) {
  const tp=await login(`${role}@e2e.com`,role); await toLama(tp); await tab(tp,'Today'); await w(600);
  // record at least one trial if the datasheet offers a + button
  await tp.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='+'||x.getAttribute('aria-label')==='Independent'||/^\+ ?independent/i.test(x.innerText));b?.click();});
  const saved=await click(tp,'Save session');
  ok(saved,`${role}: "Save session" is on the Today screen`);
  await w(1500); await tp.close();
}
const pp=await login('parent@e2e.com','parent'); await tab(pp,'Sessions'); await w(800);
let t=await text(pp);
for (const role of Object.keys(names)) ok(t.includes(names[role]),`parent Sessions lists the ${role} session`);
await pp.screenshot({path:'/private/tmp/claude-501/-Users-imac-Desktop-Autism-4/3b2be0ae-852c-4feb-8018-d9b069587c94/scratchpad/sessions-parent.png'});
await tab(pp,'Home'); t=await text(pp); ok(/session/i.test(t)&&t.includes('Recent updates'),'parent Home Recent updates mention the sessions');
const sup=await login('sup@e2e.com','supervisor'); await tab(sup,'Review'); await w(1200); t=await text(sup);
ok(/session/i.test(t),'supervisor Review lists the saved sessions');
console.log(fails?`${fails} FAILED`:'ALL PASS'); await browser.close();
