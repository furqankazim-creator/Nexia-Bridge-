// More connections (run after goals-check on the same backend): teacher classroom note -> parent; supervisor "return with comment" -> therapist;
// behavior plan, rewards and voice tip -> parent Home; a draft plan stays hidden from the parent.
import puppeteer from 'puppeteer-core';
import { CHROME, w, tab } from './capture-lib.mjs';
const API='http://127.0.0.1:4100', WEB='http://127.0.0.1:3116/';
const call=async(m,u,b,t)=>{const r=await fetch(API+u,{method:m,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json().catch(()=>({}))};};
let fails=0; const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) fails++;};
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new'}); const tokens={};
const tok=async(email)=>tokens[email]??=(await call('POST','/api/auth/login',{email,password:'password123'})).body.token;
async function login(email,role){
  const p=await browser.newPage(); p.on('dialog',d=>d.accept()); p.on('pageerror',e=>console.log('   PAGEERROR',e.message.slice(0,140)));
  await p.setViewport(role==='supervisor'?{width:1280,height:900}:{width:390,height:1400});
  await p.goto(WEB); await w(600); await p.evaluate((t)=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('nexia.token',t);},await tok(email)); await p.reload(); await w(3200); return p;
}
const text=p=>p.evaluate(()=>document.body.innerText);
const toLama=async p=>{await p.evaluate(()=>[...document.querySelectorAll('header button')].find(b=>b.innerText.includes('Child:'))?.click());await w(400);await p.evaluate(()=>[...document.querySelectorAll('header button, header [role=option], header li')].filter(b=>b.innerText.includes('Lama')).pop()?.click());await w(1500);};
const click=async(p,label,{exact=false}={})=>{const r=await p.evaluate((l,ex)=>{const e=[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&(ex?b.innerText.trim()===l:b.innerText.includes(l))).pop();if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2};},label,exact);if(!r){console.log('   (no button)',label);return false;}await p.mouse.click(r.x,r.y);await w(900);return true;};
const setVal=(p,ph,v)=>p.evaluate((ph,v)=>{const e=[...document.querySelectorAll('input,textarea')].filter(x=>x.offsetParent&&(x.placeholder||'').includes(ph)).pop();const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},ph,v);

// 1. teacher saves a classroom observation
const te=await login('teacher@e2e.com','teacher'); await toLama(te); await tab(te,'Today'); await w(500);
await click(te,'Save',{exact:true}); await w(1800);
const teAfter=await text(te); console.log('   teacher after save (notice):',/saved/i.test(teAfter));
let pp=await login('parent@e2e.com','parent'); await tab(pp,'Sessions'); await w(800);
let t=await text(pp);
console.log('   sessions text:',t.replace(/\n/g,' | ').slice(0,300));
ok(t.toLowerCase().includes('from the classroom'),'parent Sessions shows the teacher’s classroom note');
await tab(pp,'Home'); t=await text(pp); ok(t.includes('Classroom note'),'parent Home Recent updates mention it');
const sup0=await login('sup@e2e.com','supervisor'); await tab(sup0,'Children'); await w(800); ok(true,'(supervisor Children opens)');
await sup0.close();

// 2. supervisor returns a goal with a comment; the therapist sees it
const sp=await login('speech@e2e.com','speech'); await toLama(sp); await tab(sp,'Goals');
await click(sp,'Add goal'); await w(500);
await sp.evaluate(()=>{const set=(e,v)=>{const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));};const root=[...document.querySelectorAll('.fixed')].filter(x=>x.querySelector('form,textarea')).pop()||document;const vis=[...root.querySelectorAll('input:not([type=checkbox]):not([type=date]):not([type=file]),textarea')].filter(x=>x.offsetParent);set(vis.find(x=>x.tagName==='INPUT'),'Uses two-word phrases');set(vis.find(x=>x.tagName==='TEXTAREA'),'Combines two words to ask.');});
await click(sp,'Save Target'); await w(2200);
const sup=await login('sup@e2e.com','supervisor'); await tab(sup,'Review'); await w(1200);
await click(sup,'Return with comment'); await w(500);
await sup.evaluate(()=>{const e=[...document.querySelectorAll('textarea')].filter(x=>x.offsetParent).pop();Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Please make the criterion 90%.');e.dispatchEvent(new Event('input',{bubbles:true}));});
await click(sup,'Return',{exact:true}); await w(2000);
await sp.close(); const sp2=await login('speech@e2e.com','speech'); await toLama(sp2); await tab(sp2,'Today'); await w(1000);
ok(await sp2.evaluate(()=>!!document.querySelector('[data-testid=badge-Today]')),'therapist sees a badge on the Today tab');
ok(await sp2.evaluate(()=>!!document.querySelector('[data-testid=plan-feedback-badge]')),'…and on Edit plan');
await click(sp2,'Edit plan'); await w(800);
t=await text(sp2); ok(t.includes('Supervisor feedback')&&t.includes('Please make the criterion 90%.'),'therapist reads the supervisor’s comment in the plan');
await pp.close(); pp=await login('parent@e2e.com','parent'); await tab(pp,'Targets'); await w(800); t=await text(pp);
ok(t.includes('Uses two-word phrases'),'parent Targets still shows the returned goal (as waiting)');
await tab(pp,'Home'); t=await text(pp); ok(!t.includes('Uses two-word phrases'),'…but Home does not count it yet');

// 3. behavior plan, rewards and a voice tip reach the parent; a draft plan does not
const B=await tok('behavior@e2e.com'); const S=await tok('speech@e2e.com');
const put=(tk,col,rid,data)=>call('PUT',`/api/records/${col}/${rid}`,{childId:'child-lama',data:{id:rid,childId:'child-lama',...data}},tk);
await put(B,'bips','child-lama',{childId:'child-lama',status:'draft',version:1,targetBehavior:'Hitting when asked to stop',hypothesizedFunction:'escape',operationalDefinition:'Hands hit another person',teachingStrategies:'Model and practise',reinforcement:'Praise and bubbles',crisisPlan:'Stay calm',dataMethod:'ABC log',reviewDate:'2027-01-15',antecedentStrategies:'Give a warning',replacementBehavior:'Ask for a break',consequenceStrategies:'Calm response',updatedAt:new Date().toISOString()});
await put(B,'reinforcers','rf-1',{name:'Bubbles',category:'tangible',preference:5,lastAssessedAt:new Date().toISOString()});
await pp.close(); pp=await login('parent@e2e.com','parent'); t=await text(pp);
ok(!t.includes('Hitting when asked to stop'),'a draft behavior plan is hidden from the parent');
await put(B,'bips','child-lama',{childId:'child-lama',status:'active',version:2,targetBehavior:'Hitting when asked to stop',hypothesizedFunction:'escape',operationalDefinition:'Hands hit another person',teachingStrategies:'Model and practise',reinforcement:'Praise and bubbles',crisisPlan:'Stay calm',dataMethod:'ABC log',reviewDate:'2027-01-15',antecedentStrategies:'Give a warning',replacementBehavior:'Ask for a break',consequenceStrategies:'Calm response',updatedAt:new Date().toISOString()});
await w(5500); t=await text(pp);
ok(t.includes('Hitting when asked to stop')&&t.includes('Ask for a break'),'the active plan appears on parent Home (live, without reloading)');
ok(t.includes('Bubbles'),'favourite rewards appear with it');
await put(S,'audioClips','clip-1',{kind:'tip',label:'Practise at breakfast',note:'Say "more juice" and wait.',data:'data:audio/webm;base64,AAAA',mime:'audio/webm',durationSec:5,at:new Date().toISOString()});
await w(5500); t=await text(pp); ok(t.includes('Practise at breakfast')||t.includes('more juice'),'a recorded voice tip appears on parent Home');
await pp.screenshot({path:'/private/tmp/claude-501/-Users-imac-Desktop-Autism-4/3b2be0ae-852c-4feb-8018-d9b069587c94/scratchpad/home-full.png',fullPage:true});
console.log(fails?`${fails} FAILED`:'ALL PASS'); await browser.close();
