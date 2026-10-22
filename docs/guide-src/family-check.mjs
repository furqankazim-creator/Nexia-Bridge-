// Family check: home tasks, parent Home/Progress/Sessions from real data, and medical-record sharing, through the real screens.
// Start the test backend first (node test-backend.mjs), then: VITE_API_URL=http://127.0.0.1:4100 npx vite --port 3116
// and run: PC=<family code printed by the backend> node family-check.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { CHROME, w, tab, press } from './capture-lib.mjs';
const API='http://127.0.0.1:4100', WEB='http://127.0.0.1:3116/';
const PC=process.env.PC, SC='E2ESTAFF', AC='E2EADMIN';
const O='/private/tmp/claude-501/-Users-imac-Desktop-Autism-4/3b2be0ae-852c-4feb-8018-d9b069587c94/scratchpad/';
const call=async(m,u,b,t)=>{const r=await fetch(API+u,{method:m,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json().catch(()=>({}))};};
const reg=(name,email,role,code)=>call('POST','/api/auth/register',{name,email,password:'password123',role,code});
let fails=0; const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) fails++;};
await Promise.all([reg('Sam Speech','speech@e2e.com','speech',SC),reg('Sue Supervisor','sup@e2e.com','supervisor',SC),reg('Bea Behavior','behavior@e2e.com','behavior',SC),reg('Pat Parent','parent@e2e.com','parent',PC),reg('Ada Admin','admin@e2e.com','admin',AC)]);
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new'});
const tokens={};
async function login(email,role){
  if(!tokens[email]) tokens[email]=(await call('POST','/api/auth/login',{email,password:'password123'})).body.token;
  const p=await browser.newPage(); p.on('dialog',d=>d.accept());
  await p.setViewport(role==='supervisor'?{width:1280,height:860}:{width:390,height:1000});
  await p.goto(WEB); await w(600); await p.evaluate((t)=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('nexia.token',t);},tokens[email]); await p.reload(); await w(3200); return p;
}
const text=p=>p.evaluate(()=>document.body.innerText);
const toLama=async p=>{await p.evaluate(()=>[...document.querySelectorAll('header button')].find(b=>b.innerText.includes('Child:'))?.click());await w(400);await p.evaluate(()=>[...document.querySelectorAll('header button, header [role=option], header li')].filter(b=>b.innerText.includes('Lama')).pop()?.click());await w(1500);};
const setVal=(p,ph,v)=>p.evaluate((ph,v)=>{const e=[...document.querySelectorAll('input,textarea')].filter(x=>x.offsetParent&&(x.placeholder||'').includes(ph)).pop();const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},ph,v);
const click=async(p,label,{exact=false}={})=>{const r=await p.evaluate((l,ex)=>{const e=[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&(ex?b.innerText.trim()===l:b.innerText.includes(l))).pop();if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2};},label,exact);if(!r){console.log('   (no button)',label);return false;}await p.mouse.click(r.x,r.y);await w(700);return true;};

// ---- the team saves real data (goal approved + a session) so the parent's screens have something to show
const S=(await call('POST','/api/auth/login',{email:'speech@e2e.com',password:'password123'})).body.token;
const put=(tok,col,rid,data)=>call('PUT',`/api/records/${col}/${rid}`,{childId:'child-lama',data:{id:rid,childId:'child-lama',...data}},tok);
await put(S,'targets','tg-1',{discipline:'speech',name:'Requests help with a full sentence',domain:'Communication',operationalDefinition:'x',materials:[],procedureSteps:[],masteryCriterion:'90% across 3 sessions',criterionThreshold:90,currentPerformance:70,status:'teaching',suggestedAction:'',suggestedNextStep:'',approvalStatus:'approved',lastThreeSessions:[55,62,70],therapistName:'Sam Speech'});
await put(S,'savedSessions','ss-1',{role:'speech',therapistName:'Sam Speech',targetId:'tg-1',targetName:'Requests help with a full sentence',savedAt:new Date().toISOString(),procedureIds:[],measureIds:[],data:{},notes:'',summary:{percentIndependent:70,scoredTrials:10,frequency:null,ratePerMinute:null,meanDurationSec:null,meanLatencySec:null,meanIrtSec:null,partialPercent:null,wholePercent:null,mtsPercent:null,ioaPercent:null,integrityPercent:null}});

// ---- before any task: parent Home shows real empty/real states, no demo content
let pp=await login('parent@e2e.com','parent'); let t=await text(pp);
ok(!t.includes('Fine motor')&&!t.includes('Goal ready for review')&&!t.includes('82%'),'parent Home has no demo content');
ok(t.includes('Speech')&&t.includes('1 goal')&&t.includes('Requests help with a full sentence')&&!t.includes('OT')&&!t.includes('Classroom'),'parent Home shows only the real goal, no demo goals');
ok(t.includes('Speech session')&&t.includes('70% independent'),'parent Home shows the real session in Recent updates');
await pp.screenshot({path:O+'real-home.png'});
await tab(pp,'Progress'); await w(500); t=await text(pp); ok(t.includes('Requests help with a full sentence')&&t.includes('55%, 62%, 70%'),'Progress lists the goal with its last sessions');
await tab(pp,'Sessions'); await w(500); t=await text(pp); ok(t.includes('70% independent')&&t.includes('Sam Speech'),'Sessions lists the real session');
await pp.close();

// ---- therapist assigns a home task through the screen
let sp=await login('speech@e2e.com','speech'); await toLama(sp); await tab(sp,'Family'); await click(sp,'Home tasks');
await setVal(sp,'Practice asking for a break','Practice asking for a break'); await click(sp,'Assign to family'); await w(1500);
ok((await text(sp)).includes('Practice asking for a break'),'therapist sees the task in Family progress');
// ---- parent sees it, gets a notification, ticks it
pp=await login('parent@e2e.com','parent'); t=await text(pp);
ok(t.includes('Home practice from your therapist')&&t.includes('Practice asking for a break'),'parent sees the task on Home');
ok(await pp.evaluate(()=>!!document.querySelector('header [class*="bg-"] ,header button')&& /\b[1-9]\b/.test([...document.querySelectorAll('header button')].map(b=>b.innerText).join(' '))),'parent has a notification badge');
await click(pp,'Practice asking for a break'); await setVal(pp,'How did it go','He did it twice!'); await click(pp,'Done',{exact:true}); await w(2200);
ok((await text(pp)).includes('He did it twice!'),'parent ticked the task with a note');
// ---- therapist sees it done with the note
await sp.close(); sp=await login('speech@e2e.com','speech'); await toLama(sp); await tab(sp,'Family'); await click(sp,'Home tasks'); await w(800);
t=await text(sp); ok(t.includes('Done')&&t.includes('He did it twice!'),'therapist sees the task done with the parent’s note');
ok(await sp.evaluate(()=>/\b[1-9]\b/.test([...document.querySelectorAll('header button')].map(b=>b.innerText).join(' '))),'therapist has a notification badge');
await sp.screenshot({path:O+'real-task-therapist.png'});

// ---- medical records: parent shares with speech only
await tab(pp,'Records'); await click(pp,'Add',{exact:true}); await w(400);
await pp.evaluate(()=>{const set=(l,v)=>{const e=document.querySelector(`[aria-label="${l}"]`);const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};set('Title','Hearing test 2022');set('Category','lab');set('Date of report','2022-05-04');});
const pdf=O+'hearing.pdf'; fs.writeFileSync(pdf,'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
await (await pp.$('[data-testid=file-input]')).uploadFile(pdf); await w(300);
await click(pp,'Choose people'); await click(pp,'Speech therapist'); await click(pp,'Save record'); await w(2500);
ok((await text(pp)).includes('Hearing test 2022'),'parent saved the medical record');
await sp.close(); sp=await login('speech@e2e.com','speech'); await toLama(sp); await tab(sp,'Family'); await click(sp,'Medical'); await w(1200);
ok((await text(sp)).includes('Hearing test 2022'),'speech therapist sees the shared record');
const bp=await login('behavior@e2e.com','behavior'); await toLama(bp); await tab(bp,'Family'); await click(bp,'Medical'); await w(1200);
ok(!(await text(bp)).includes('Hearing test 2022'),'behavior therapist does not');
const ap=await login('admin@e2e.com','admin'); ok(!(await text(ap)).includes('Hearing test 2022'),'admin does not');
console.log(fails?`${fails} FAILED`:'ALL PASS'); await browser.close();
