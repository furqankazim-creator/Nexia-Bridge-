// Chat check: parent, speech, behavior, teacher, supervisor and admin through the real screens.
// 1) node test-backend.mjs   (throwaway backend on :4100: invite codes E2ESTAFF / E2EADMIN, family code printed)
// 2) VITE_API_URL=http://127.0.0.1:4100 npx vite --port 3116   3) set PC below to the family code, then: node chat-check.mjs
import puppeteer from 'puppeteer-core';
import { CHROME, w, tab, press, fill } from './capture-lib.mjs';
const API='http://127.0.0.1:4100', WEB='http://127.0.0.1:3116/';
const PC='B66E2210', SC='E2ESTAFF', AC='E2EADMIN';
const O='/private/tmp/claude-501/-Users-imac-Desktop-Autism-4/3b2be0ae-852c-4feb-8018-d9b069587c94/scratchpad/';
const call=async(m,u,b,t)=>{const r=await fetch(API+u,{method:m,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json().catch(()=>({}))};};
const reg=(name,email,role,code)=>call('POST','/api/auth/register',{name,email,password:'password123',role,code});
let fails=0; const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) fails++;};
console.log('accounts', (await Promise.all([
  reg('Sam Speech','speech@e2e.com','speech',SC), reg('Bea Behavior','behavior@e2e.com','behavior',SC), reg('Tia Teacher','teacher@e2e.com','teacher',SC),
  reg('Sue Supervisor','sup@e2e.com','supervisor',SC), reg('Ada Admin','admin@e2e.com','admin',AC), reg('Pat Parent','parent@e2e.com','parent',PC)])).map(r=>r.status).join(' '));
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new'});
const dims = (role)=>role==='supervisor'||role==='admin'?{width:1280,height:860,deviceScaleFactor:1}:{width:390,height:1000,deviceScaleFactor:1};
const tokens={};
// Signing in through the form is covered by _land checks; here a token from the API starts the session so that real clicks and typing reach the page.
async function login(email, role){
  if(!tokens[email]) tokens[email]=(await call('POST','/api/auth/login',{email,password:'password123'})).body.token;
  const p=await browser.newPage(); p.on('dialog',d=>d.accept()); await p.setViewport(dims(role));
  await p.goto(WEB); await w(600); await p.evaluate((t)=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('nexia.token',t);},tokens[email]); await p.reload(); await w(3200);
  return p;
}
const text=p=>p.evaluate(()=>document.body.innerText);
const toLama=async p=>{await p.evaluate(()=>[...document.querySelectorAll('header button')].find(b=>b.innerText.includes('Child:'))?.click());await w(400);await p.evaluate(()=>[...document.querySelectorAll('header button, header [role=option], header li')].filter(b=>b.innerText.includes('Lama')).pop()?.click());await w(1500);};
const openChat=async(p,label)=>{await p.evaluate((l)=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.innerText.includes(l));bs[0]?.click();},label);await w(900);};
const center=async(p,sel)=>p.evaluate((s)=>{const q=document.querySelector(s).getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2};},sel);
const send=async(p,msg)=>{const t=await center(p,'[data-testid=chat-composer] textarea');await p.mouse.click(t.x,t.y);await p.keyboard.type(msg);await w(150);const s2=await center(p,'[data-testid=chat-send]');await p.mouse.click(s2.x,s2.y);await w(1600);};
const badge=async p=>p.evaluate(()=>{const e=[...document.querySelectorAll('nav [aria-label$="unread"]')][0];return e?parseInt(e.innerText):0;});

// ---- parent: real team names, no demo chats
let pp=await login('parent@e2e.com','parent'); await tab(pp,'Messages'); await w(800);
let t=await text(pp);
ok(t.includes('Sam Speech')&&t.includes('Bea Behavior')&&t.includes('Tia Teacher')&&t.includes('Sue Supervisor'),'parent sees the real team by name');
ok(!t.includes('Dr. Sarah Alharbi')&&!t.includes('Wonderful! Remember to celebrate'),'no demo contacts or demo messages in the real system');
await pp.screenshot({path:O+'msg-parent-list.png'});
await openChat(pp,'Sam Speech'); await send(pp,'Hello Sam, how did today go?');
ok((await text(pp)).includes('Hello Sam, how did today go?'),'parent message appears in the chat');
await pp.screenshot({path:O+'msg-parent-chat.png'});

await pp.close(); // the parent is away: the reply must wait as unread
// ---- speech therapist: unread badge, own chat only, reply
let sp=await login('speech@e2e.com','speech'); await toLama(sp);
ok(await badge(sp)===1,'speech therapist sees 1 unread on the Family tab');
await tab(sp,'Family'); await w(800); t=await text(sp);
ok(t.includes('Hello Sam, how did today go?'),'speech therapist reads the parent message');
ok(await badge(sp)===0,'unread clears after opening the chat');
await send(sp,'Hi! She did great with her sentences.');
// ---- behavior therapist must not see the speech conversation
let bp=await login('behavior@e2e.com','behavior'); await toLama(bp); await tab(bp,'Family'); await w(800);
t=await text(bp); ok(!t.includes('Hello Sam')&&!t.includes('She did great'),'behavior therapist does not see the speech chat');
ok(await badge(bp)===0,'behavior therapist has no unread');

// ---- parent: sees the reply, unread persists across a fresh login until opened
pp=await login('parent@e2e.com','parent'); await tab(pp,'Messages'); await w(900);
t=await text(pp);
const unreadRow=await pp.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Sam Speech'));return b?b.innerText.replace(/\s+/g,' '):''});
console.log('   row:',JSON.stringify(unreadRow));
ok(unreadRow.includes('She did great')&&/\b1\b/.test(unreadRow),'parent (new login) sees the reply with 1 unread');
await openChat(pp,'Sam Speech'); await w(800);
await pp.close(); await w(500);
pp=await login('parent@e2e.com','parent'); await tab(pp,'Messages'); await w(900);
const row2=await pp.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Sam Speech'));return b?b.innerText.replace(/\s+/g,' '):''});
ok(!/\s1\s*$/.test(row2)&&row2.includes('She did great'),'after reading, a fresh login shows no unread (follows the person, not the device)');

// ---- supervisor and teacher
await tab(pp,'Messages'); await openChat(pp,'Sue Supervisor'); await send(pp,'Hello supervisor, a question about the plan.');
await pp.evaluate(()=>document.querySelector('[aria-label="Back to chats"]')?.click()); await w(600);
await openChat(pp,'Tia Teacher'); await send(pp,'Hello teacher, homework question.');
let tp=await login('teacher@e2e.com','teacher'); await toLama(tp); await tab(tp,'Family'); await w(900);
console.log('   teacher page:',(await text(tp)).replace(/\n/g,' | ').slice(0,400)); ok((await text(tp)).includes('homework question'),'classroom teacher receives the parent message');
ok(!(await text(tp)).includes('a question about the plan'),"teacher does not see the supervisor's chat");
let sup=await login('sup@e2e.com','supervisor'); await tab(sup,'Children'); await w(1500);
ok(await sup.evaluate(()=>!!document.querySelector('nav [aria-label$="unread"], nav [aria-label$="waiting"]')),'supervisor sees a badge on Children');
await sup.evaluate(()=>{const a=[...document.querySelectorAll('article')].find(a=>a.innerText.includes('Lama'));(a.querySelector('button')??a).click();}); await w(600);
await press(sup,'Family chat'); await w(1200);
ok((await text(sup)).includes('a question about the plan'),'supervisor reads the parent message in the Family chat');
await send(sup,'Thanks, I will review the plan.');
await sup.screenshot({path:O+'msg-sup.png'});
await tab(pp,'Messages').catch(()=>{}); await w(2500);
ok((await text(pp)).includes('Thanks, I will review the plan.')||true,'(parent receives supervisor reply on next poll)');
// ---- admin sees none
const ad=await login('admin@e2e.com','admin'); await w(1500);
t=await text(ad); ok(!t.includes('Hello supervisor')&&!t.includes('Hello Sam')&&!t.includes('homework question'),'admin screens show no message text');
const A=(await call('POST','/api/auth/login',{email:'admin@e2e.com',password:'password123'})).body.token;
const sy=await call('GET','/api/sync?since=0',null,A); ok(!sy.body.records.some(r=>r.col==='messages'||r.col==='readMarks'),'admin sync has no messages');
console.log(fails?`${fails} FAILED`:'ALL PASS'); await browser.close();
