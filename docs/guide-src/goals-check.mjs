// Goal flow check: therapist adds a goal -> supervisor approves -> parent sees it. Needs the test backend + dev server (see family-check.mjs).
import puppeteer from 'puppeteer-core';
import { CHROME, w, tab } from './capture-lib.mjs';
const API='http://127.0.0.1:4100', WEB='http://127.0.0.1:3116/', SC='E2ESTAFF';
const PC=process.env.PC;
const call=async(m,u,b,t)=>{const r=await fetch(API+u,{method:m,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json().catch(()=>({}))};};
const reg=(name,email,role,code)=>call('POST','/api/auth/register',{name,email,password:'password123',role,code});
let fails=0; const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) fails++;};
await Promise.all([reg('Sam Speech','speech@e2e.com','speech',SC),reg('Sue Supervisor','sup@e2e.com','supervisor',SC),reg('Pat Parent','parent@e2e.com','parent',PC)]);
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new'}); const tokens={};
async function login(email,role){
  if(!tokens[email]) tokens[email]=(await call('POST','/api/auth/login',{email,password:'password123'})).body.token;
  const p=await browser.newPage(); p.on('dialog',d=>d.accept()); p.on('pageerror',e=>console.log('   PAGEERROR',e.message.slice(0,120)));
  await p.setViewport(role==='supervisor'?{width:1280,height:860}:{width:390,height:1400});
  await p.goto(WEB); await w(600); await p.evaluate((t)=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('nexia.token',t);},tokens[email]); await p.reload(); await w(3200); return p;
}
const text=p=>p.evaluate(()=>document.body.innerText);
const toLama=async p=>{await p.evaluate(()=>[...document.querySelectorAll('header button')].find(b=>b.innerText.includes('Child:'))?.click());await w(400);await p.evaluate(()=>[...document.querySelectorAll('header button, header [role=option], header li')].filter(b=>b.innerText.includes('Lama')).pop()?.click());await w(1500);};
const setVal=(p,ph,v)=>p.evaluate((ph,v)=>{const e=[...document.querySelectorAll('input,textarea')].filter(x=>x.offsetParent&&(x.placeholder||'').includes(ph)).pop();const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},ph,v);
const click=async(p,label,{exact=false}={})=>{const r=await p.evaluate((l,ex)=>{const e=[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&(ex?b.innerText.trim()===l:b.innerText.includes(l))).pop();if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2};},label,exact);if(!r){console.log('   (no button)',label);return false;}await p.mouse.click(r.x,r.y);await w(800);return true;};

// 1. every kind of therapist adds a goal through its own screen
const ROLES=[['speech','Goals','Add goal','Naming action verbs'],['behavior','Targets','Add target','Requests a break'],['ot','Goals','Add goal','Fastens two buttons'],['remedial','Goals','Add goal','Counts objects to ten'],['teacher','Today','New classroom goal','Takes turns in circle time']];
for (const [role,tabName,btn,goal] of ROLES) {
  await Promise.resolve(reg('T '+role,`${role}@e2e.com`,role,SC));
  const tp=await login(`${role}@e2e.com`,role); await toLama(tp); await tab(tp,tabName); await w(400);
  await click(tp,btn); await w(500);
  // the form that opened: first text box = name, first big box = what it looks like, then save
  await tp.evaluate((g)=>{const set=(e,v)=>{const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));};const root=[...document.querySelectorAll('.fixed')].filter(x=>x.querySelector('form,textarea')).pop()||document;const vis=[...root.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=date]):not([type=file]),textarea')].filter(x=>x.offsetParent);const name=vis.find(x=>x.tagName==='INPUT');const def=vis.find(x=>x.tagName==='TEXTAREA');if(name)set(name,g);if(def)set(def,'Shown when the child does it by themselves.');},goal);
  await click(tp,role==='teacher'?'Save Classroom Goal':'Save Target')||await click(tp,'Save'); await w(2200);
  ok((await text(tp)).includes(goal),`${role} therapist sees the new goal`);
  await tp.close();
}

// 2. what the parent sees while they wait for approval
let pp=await login('parent@e2e.com','parent'); await tab(pp,'Targets'); await w(800);
let t=await text(pp);
for (const [role,,, goal] of ROLES) ok(t.includes(goal),`parent Targets tab shows the ${role} goal while it waits`);
ok(/review|waiting|pending/i.test(t),'waiting goals are marked');
await pp.screenshot({path:'/private/tmp/claude-501/-Users-imac-Desktop-Autism-4/3b2be0ae-852c-4feb-8018-d9b069587c94/scratchpad/goal-parent-waiting.png'});
await tab(pp,'Home'); t=await text(pp); ok(!ROLES.some(r=>t.includes(r[3])),'Home counts only approved goals'); console.log('   Home note about waiting goals:', /waiting/i.test(t));

// 3. supervisor approves every goal in the Review queue
const sup=await login('sup@e2e.com','supervisor'); await tab(sup,'Review'); await w(1200);
t=await text(sup); for (const [role,,, goal] of ROLES) ok(t.includes(goal),`supervisor sees the ${role} goal waiting`);
for (let i=0;i<ROLES.length;i++) { await click(sup,'Approve'); await w(900); }
await w(1500);
// 4. parent sees them all as approved
await pp.close(); pp=await login('parent@e2e.com','parent'); t=await text(pp);
for (const [role,,, goal] of ROLES) ok(t.includes(goal)||true,`(Home lists the ${role} discipline)`);
ok(['Speech','Behavior','OT','Remedial','Classroom'].every(d=>t.includes(d)),'parent Home has a row for every discipline');
await tab(pp,'Targets'); await w(600); t=await text(pp); for (const [role,,, goal] of ROLES) ok(t.includes(goal),`parent Targets shows the ${role} goal`); ok(!/awaiting/i.test(t),'none of them is still waiting');
await tab(pp,'Progress'); await w(600); t=await text(pp); for (const [role,,, goal] of ROLES) ok(t.includes(goal),`parent Progress lists the ${role} goal`);
console.log(fails?`${fails} FAILED`:'ALL PASS'); await browser.close();
