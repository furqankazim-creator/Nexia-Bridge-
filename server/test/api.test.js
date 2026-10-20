import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { Child } from '../models.js';

let mongod, server, base;
const STAFF = 'STAFF-TEST-CODE';
const codes = {};

before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ||= path.resolve('server/.mongodb-binaries');
  fs.mkdirSync(process.env.MONGOMS_DOWNLOAD_DIR, { recursive: true });
  mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  await mongoose.connect(mongod.getUri('t'));
  for (const [id, name] of [['child-a', 'Child A'], ['child-b', 'Child B']]) {
    const c = await Child.create({ _id: id, name, inviteCode: id === 'child-a' ? 'AAAA1111' : 'BBBB2222' });
    codes[id] = c.inviteCode;
  }
  server = createApp({ jwtSecret: 'test-secret-test-secret-123', staffInviteCode: STAFF, adminInviteCode: 'ADMIN-TEST-CODE', authLimit: 10000 }).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server?.close();
  await mongoose.disconnect();
  await mongod?.stop();
});

const call = async (method, url, body, token) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const register = (o) => call('POST', '/api/auth/register', { password: 'password123', ...o });

let therapist, parent, otherParent;

test('registration: codes are enforced and passwords hashed', async () => {
  assert.equal((await register({ name: 'Dr T', email: 't@x.com', role: 'behavior', code: 'WRONG' })).status, 403);
  assert.equal((await register({ name: 'Pat', email: 'p@x.com', role: 'parent', code: 'NOPE0000' })).status, 403);
  assert.equal((await register({ name: 'Dr T', email: 'bad-email', role: 'behavior', code: STAFF })).status, 400);
  assert.equal((await register({ name: 'Dr T', email: 't@x.com', role: 'behavior', code: STAFF, password: 'short' })).status, 400);

  therapist = await register({ name: 'Dr Tareq', email: 'T@x.com', role: 'behavior', code: STAFF });
  assert.equal(therapist.status, 201);
  assert.deepEqual(therapist.body.user.childIds.sort(), ['child-a', 'child-b']);
  assert.ok(!JSON.stringify(therapist.body).includes('passwordHash'));

  parent = await register({ name: 'Sarah', email: 'sarah@x.com', role: 'parent', code: 'aaaa1111' }); // case-insensitive code
  assert.equal(parent.status, 201);
  assert.deepEqual(parent.body.user.childIds, ['child-a']);
  otherParent = await register({ name: 'Omar', email: 'omar@x.com', role: 'parent', code: codes['child-b'] });

  assert.equal((await register({ name: 'Dup', email: 't@x.com', role: 'behavior', code: STAFF })).status, 409); // email is case-insensitive
});

test('login: right password works, wrong one and unknown email give the same error', async () => {
  const ok = await call('POST', '/api/auth/login', { email: 'sarah@x.com', password: 'password123' });
  assert.equal(ok.status, 200);
  const bad = await call('POST', '/api/auth/login', { email: 'sarah@x.com', password: 'nope-nope' });
  const unknown = await call('POST', '/api/auth/login', { email: 'ghost@x.com', password: 'password123' });
  assert.equal(bad.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(bad.body.error, unknown.body.error);
});

test('auth is required and tokens are verified', async () => {
  assert.equal((await call('GET', '/api/sync')).status, 401);
  assert.equal((await call('GET', '/api/sync', null, 'garbage')).status, 401);
});

test('invite codes are visible to staff only', async () => {
  const t = await call('GET', '/api/me', null, therapist.body.token);
  assert.ok(t.body.children.every((c) => c.inviteCode));
  const p = await call('GET', '/api/me', null, parent.body.token);
  assert.equal(p.body.children.length, 1);
  assert.ok(!('inviteCode' in p.body.children[0]));
});

const put = (token, col, rid, childId, data) => call('PUT', `/api/records/${col}/${rid}`, { childId, data }, token);
const sync = async (token, since = 0) => (await call('GET', `/api/sync?since=${since}`, null, token)).body;

test('therapist writes reach the parent; ABC events never do', async () => {
  const T = therapist.body.token, P = parent.body.token;
  assert.equal((await put(T, 'homeTasks', 'ht1', 'child-a', { id: 'ht1', title: 'Practice break card', done: false })).status, 200);
  assert.equal((await put(T, 'abcRecords', 'abc1', 'child-a', { id: 'abc1', behavior: 'raw clinical note' })).status, 200);
  assert.equal((await put(T, 'reinforcers', 'rf1', 'child-a', { id: 'rf1', name: 'Bubbles' })).status, 200);

  const t = await sync(T);
  assert.ok(t.records.some((r) => r.col === 'abcRecords'));
  const p = await sync(P);
  assert.ok(p.records.some((r) => r.col === 'homeTasks' && r.data.title === 'Practice break card'));
  assert.ok(p.records.some((r) => r.col === 'reinforcers'));
  assert.ok(!p.records.some((r) => r.col === 'abcRecords'), 'parent must not receive ABC events');
});

test('parents cannot write clinical data and cannot reach other children', async () => {
  const P = parent.body.token, O = otherParent.body.token, T = therapist.body.token;
  assert.equal((await put(P, 'bips', 'child-a', 'child-a', { status: 'active' })).status, 403);
  assert.equal((await put(P, 'abcRecords', 'x', 'child-a', {})).status, 403);
  assert.equal((await put(P, 'reinforcers', 'x', 'child-a', { name: 'hack' })).status, 403);
  assert.equal((await put(P, 'homeTasks', 'brand-new', 'child-a', { title: 'invented' })).status, 403, 'parents cannot create tasks');
  assert.equal((await put(P, 'homeTasks', 'ht1', 'child-b', { done: true })).status, 403, 'wrong child');
  assert.equal((await put(O, 'homeTasks', 'ht1', 'child-a', { done: true })).status, 403, 'other family');
  assert.equal((await call('DELETE', '/api/records/homeTasks/ht1', null, P)).status, 403);
  assert.equal((await put(T, 'nonsense', 'x', 'child-a', {})).status, 400);
  const o = await sync(O);
  assert.ok(!o.records.some((r) => r.childId === 'child-a'), 'other family sees nothing of child-a');
});

test('parent can tick a task but only the allowed fields change', async () => {
  const P = parent.body.token, T = therapist.body.token;
  const before = (await sync(T)).latest;
  const r = await put(P, 'homeTasks', 'ht1', 'child-a', { done: true, doneAt: '2026-10-16T08:00:00Z', parentNote: 'He did it', title: 'HACKED TITLE', instructions: 'x' });
  assert.equal(r.status, 200);
  const t = await sync(T, before);
  const task = t.records.find((x) => x.col === 'homeTasks' && x.rid === 'ht1').data;
  assert.equal(task.done, true);
  assert.equal(task.parentNote, 'He did it');
  assert.equal(task.title, 'Practice break card', 'title must not be changed by a parent');
});

test('sync is incremental: only newer changes are returned', async () => {
  const T = therapist.body.token;
  const first = await sync(T);
  const none = await sync(T, first.latest);
  assert.equal(none.records.length, 0);
  await put(T, 'reinforcers', 'rf2', 'child-a', { id: 'rf2', name: 'Trampoline' });
  const delta = await sync(T, first.latest);
  assert.deepEqual(delta.records.map((r) => r.rid), ['rf2']);
});

test('deletes are tombstones that reach every device', async () => {
  const T = therapist.body.token, P = parent.body.token;
  const mark = (await sync(P)).latest;
  assert.equal((await call('DELETE', '/api/records/reinforcers/rf2', null, T)).status, 200);
  const p = await sync(P, mark);
  const gone = p.records.find((r) => r.rid === 'rf2');
  assert.equal(gone.deleted, true);
  assert.equal(gone.data, null);
});

test('a plan moved back to draft disappears from the parent', async () => {
  const T = therapist.body.token, P = parent.body.token;
  assert.equal((await sync(P)).records.some((r) => r.col === 'bips'), false, 'drafts are hidden');
  await put(T, 'bips', 'child-a', 'child-a', { childId: 'child-a', status: 'active', targetBehavior: 'Hitting' });
  let p = await sync(P);
  assert.equal(p.records.find((r) => r.col === 'bips').deleted, false);
  const mark = p.latest;
  await put(T, 'bips', 'child-a', 'child-a', { childId: 'child-a', status: 'draft', targetBehavior: 'Hitting' });
  p = await sync(P, mark);
  assert.equal(p.records.find((r) => r.col === 'bips').deleted, true);
});

test('messages: sender cannot be forged, staff-only messages stay hidden from parents, retries are safe', async () => {
  const T = therapist.body.token, P = parent.body.token;
  const msg = { id: 'msg-1', contactId: 'contact-bcba', contentEn: 'hello', senderRole: 'admin', senderName: 'Impostor', audience: 'staff' };
  assert.equal((await put(P, 'messages', 'msg-1', 'child-a', msg)).status, 200);
  const t = (await sync(T)).records.find((r) => r.rid === 'msg-1').data;
  assert.equal(t.senderRole, 'parent');
  assert.equal(t.senderName, 'Sarah');
  assert.equal(t.audience, 'family', 'a parent cannot mark a message staff-only');
  assert.equal((await put(P, 'messages', 'msg-1', 'child-a', { ...msg, contentEn: 'edited' })).body.duplicate, true);
  assert.equal((await sync(T)).records.find((r) => r.rid === 'msg-1').data.contentEn, 'hello', 'messages are immutable');

  await put(T, 'messages', 'msg-2', 'child-a', { id: 'msg-2', contactId: 'contact-slp', contentEn: 'internal', audience: 'staff' });
  await put(T, 'messages', 'msg-3', 'child-a', { id: 'msg-3', contactId: 'contact-bcba', contentEn: 'for parent', audience: 'family' });
  const p = await sync(P);
  assert.ok(!p.records.some((r) => r.rid === 'msg-2'), 'staff-only message hidden from parent');
  assert.ok(p.records.some((r) => r.rid === 'msg-3'));
  assert.ok((await sync(T)).records.some((r) => r.rid === 'msg-2'));
});

test('oversized records are rejected', async () => {
  const r = await put(therapist.body.token, 'reinforcers', 'big', 'child-a', { blob: 'x'.repeat(300 * 1024) });
  assert.equal(r.status, 413);
});

test('parent can join a second child with its code, nobody else can', async () => {
  assert.equal((await call('POST', '/api/me/children', { code: 'WRONG000' }, parent.body.token)).status, 403);
  const j = await call('POST', '/api/me/children', { code: codes['child-b'] }, parent.body.token);
  assert.deepEqual(j.body.user.childIds.sort(), ['child-a', 'child-b']);
  assert.equal((await call('POST', '/api/me/children', { code: codes['child-b'] }, therapist.body.token)).status, 403);
});

test('speech records: parents can read weekly questions and sentence tasks, never change them', async () => {
  const T = therapist.body.token, P = parent.body.token;
  assert.equal((await put(T, 'weeklyQuestions', 'wq-1', 'child-a', { id: 'wq-1', childId: 'child-a', weekStart: '2026-10-12', questions: [{ id: 'q1', type: 'what', text: 'What do you drink with?', answer: 'cup', result: null }] })).status, 200);
  assert.equal((await put(T, 'sentenceTasks', 'st-1', 'child-a', { id: 'st-1', childId: 'child-a', target: 'dog on bed', attempts: [] })).status, 200);
  const p = await sync(P);
  assert.ok(p.records.some((r) => r.col === 'weeklyQuestions' && r.data.questions[0].text === 'What do you drink with?'));
  assert.ok(p.records.some((r) => r.col === 'sentenceTasks' && r.data.target === 'dog on bed'));
  assert.equal((await put(P, 'weeklyQuestions', 'wq-1', 'child-a', { questions: [] })).status, 403);
  assert.equal((await put(P, 'sentenceTasks', 'st-1', 'child-a', { target: 'hacked' })).status, 403);
  assert.equal((await call('DELETE', '/api/records/sentenceTasks/st-1', null, P)).status, 403);
  const o = await sync(otherParent.body.token);
  assert.ok(!o.records.some((r) => r.col === 'weeklyQuestions' || r.col === 'sentenceTasks'), 'another family sees none of it');
});

test('articulation, audio and OT checklist: parents read, never write; audio has a size cap', async () => {
  const T = therapist.body.token, P = parent.body.token;
  assert.equal((await put(T, 'articulationLogs', 'ar1', 'child-a', { id: 'ar1', childId: 'child-a', sound: 's', position: 'initial', correct: 6, approximated: 2, incorrect: 2 })).status, 200);
  assert.equal((await put(T, 'otChecklist', 'ck1', 'child-a', { id: 'ck1', childId: 'child-a', name: 'Buttons a shirt', score: 'Independent', history: [] })).status, 200);
  // ~150 KB of audio is fine (the app records at most about 130 KB)
  assert.equal((await put(T, 'audioClips', 'au1', 'child-a', { id: 'au1', childId: 'child-a', kind: 'tip', note: 'Practise in the mirror', label: 'dog on bed', data: 'data:audio/webm;base64,' + 'A'.repeat(150 * 1024) })).status, 200);
  assert.equal((await put(T, 'audioClips', 'au2', 'child-a', { id: 'au2', childId: 'child-a', label: 'too long', data: 'data:audio/webm;base64,' + 'A'.repeat(300 * 1024) })).status, 413);

  const p = await sync(P);
  for (const col of ['articulationLogs', 'otChecklist', 'audioClips']) assert.ok(p.records.some((r) => r.col === col), `parent can read ${col}`);
  for (const col of ['articulationLogs', 'otChecklist', 'audioClips']) {
    assert.equal((await put(P, col, `${col}-x`, 'child-a', { hacked: true })).status, 403, `parent cannot write ${col}`);
  }
  assert.equal((await call('DELETE', '/api/records/audioClips/au1', null, P)).status, 403);
  const o = await sync(otherParent.body.token);
  assert.ok(!o.records.some((r) => ['articulationLogs', 'otChecklist', 'audioClips'].includes(r.col)), 'another family sees none of it');
});

test('audio: child samples stay with the clinical team; spoken tips reach parents', async () => {
  const T = therapist.body.token, P = parent.body.token;
  assert.equal((await put(T, 'audioClips', 'sample1', 'child-a', { id: 'sample1', childId: 'child-a', kind: 'sample', label: 'sun', data: 'data:audio/webm;base64,AAAA' })).status, 200);
  assert.equal((await put(T, 'audioClips', 'oldstyle', 'child-a', { id: 'oldstyle', childId: 'child-a', label: 'no kind field', data: 'data:audio/webm;base64,AAAA' })).status, 200);
  assert.equal((await put(T, 'audioClips', 'tip1', 'child-a', { id: 'tip1', childId: 'child-a', kind: 'tip', note: 'Smile and make the snake sound', label: 'Tip', data: 'data:audio/webm;base64,AAAA' })).status, 200);
  const staff = (await sync(T)).records.filter((r) => r.col === 'audioClips').map((r) => r.rid);
  assert.ok(['sample1', 'oldstyle', 'tip1'].every((id) => staff.includes(id)), 'staff see every clip');
  const parentSees = (await sync(P)).records.filter((r) => r.col === 'audioClips' && !r.deleted).map((r) => r.rid);
  assert.ok(parentSees.includes('tip1'), 'parent receives the tip');
  assert.ok(!parentSees.includes('sample1'), 'parent never receives the child sample');
  assert.ok(!parentSees.includes('oldstyle'), 'a clip with no kind is treated as a private sample');
});

test('OT task analyses and sensory log: parents read, never write', async () => {
  const T = therapist.body.token, P = parent.body.token;
  const task = { id: 'task1', childId: 'child-a', title: 'Buttoning Standard Shirt', domain: 'Self-Care', chaining: 'forward', steps: [{ id: 's1', text: 'Grasp edge' }], levels: { s1: 'Independent' }, history: [] };
  assert.equal((await put(T, 'otTasks', 'task1', 'child-a', task)).status, 200);
  assert.equal((await put(T, 'otSensory', 'sen1', 'child-a', { id: 'sen1', childId: 'child-a', activity: 'proprioceptive', pre: 'elevated', post: 'regulated', strategies: [], note: '' })).status, 200);
  const p = await sync(P);
  assert.ok(p.records.some((r) => r.col === 'otTasks' && r.data.title === 'Buttoning Standard Shirt'));
  assert.ok(p.records.some((r) => r.col === 'otSensory'));
  for (const col of ['otTasks', 'otSensory']) assert.equal((await put(P, col, col + '-x', 'child-a', { hacked: true })).status, 403, 'parent cannot write ' + col);
  assert.equal((await call('DELETE', '/api/records/otTasks/task1', null, P)).status, 403);
  const o = await sync(otherParent.body.token);
  assert.ok(!o.records.some((r) => ['otTasks', 'otSensory'].includes(r.col)), 'another family sees none of it');
});

/* ---------------- administration ---------------- */
let admin, supervisor;
const patch = (token, url, body) => call('PATCH', url, body, token);

test('admin accounts need their own code: the staff code is not enough', async () => {
  assert.equal((await register({ name: 'Sneaky', email: 'sneak@x.com', role: 'admin', code: STAFF })).status, 403, 'staff code must not make an admin');
  assert.equal((await register({ name: 'Sneaky', email: 'sneak@x.com', role: 'admin', code: 'admin-test-code' })).status, 403, 'codes are case-sensitive');
  admin = await register({ name: 'Admin Amal', email: 'amal@x.com', role: 'admin', code: 'ADMIN-TEST-CODE' });
  assert.equal(admin.status, 201);
  assert.deepEqual(admin.body.user.childIds.sort(), ['child-a', 'child-b']);
  supervisor = await register({ name: 'Dr Rebecca', email: 'rebecca@x.com', role: 'supervisor', code: STAFF });
  assert.equal(supervisor.status, 201);
});

test('admin endpoints are for administrators only', async () => {
  for (const [method, url] of [['GET', '/api/admin/users'], ['GET', '/api/admin/children'], ['GET', '/api/admin/audit'], ['GET', '/api/admin/access']]) {
    assert.equal((await call(method, url, null, therapist.body.token)).status, 403, 'therapist ' + url);
    assert.equal((await call(method, url, null, parent.body.token)).status, 403, 'parent ' + url);
    assert.equal((await call(method, url, null, supervisor.body.token)).status, 403, 'supervisor ' + url);
    assert.equal((await call(method, url)).status, 401, 'anonymous ' + url);
  }
  assert.equal((await patch(therapist.body.token, '/api/admin/users/' + parent.body.user.id, { disabled: true })).status, 403);
});

test('an administrator sees figures and status, never clinical text, chats or practice data', async () => {
  const T = therapist.body.token, A = admin.body.token;
  await put(T, 'targets', 'tg1', 'child-a', { id: 'tg1', childId: 'child-a', name: 'Requesting help', approvalStatus: 'awaiting_approval' });
  await put(T, 'savedSessions', 'ss1', 'child-a', { id: 'ss1', childId: 'child-a', role: 'speech', therapistName: 'Dr T', targetId: 'tg1', targetName: 'Requesting help', savedAt: '2026-10-15T10:00:00Z', summary: { percentIndependent: 80 }, notes: 'CONFIDENTIAL SOAP TEXT', data: { trials: [] } });
  await put(T, 'bips', 'child-a', 'child-a', { childId: 'child-a', status: 'active', version: 2, targetBehavior: 'PRIVATE BEHAVIOUR', crisisPlan: 'PRIVATE PLAN' });
  await put(T, 'abcRecords', 'abcx', 'child-a', { id: 'abcx', behavior: 'PRIVATE ABC' });
  await put(T, 'messages', 'msg-admin-test', 'child-a', { id: 'msg-admin-test', contactId: 'contact-bcba', contentEn: 'PRIVATE CHAT', audience: 'family' });
  await put(T, 'audioClips', 'aud-admin', 'child-a', { id: 'aud-admin', kind: 'sample', data: 'data:audio/webm;base64,AAAA' });

  const a = await sync(A);
  const cols = new Set(a.records.map((r) => r.col));
  assert.ok(cols.has('targets') && cols.has('savedSessions') && cols.has('bips'), 'admin gets goals, session summaries, plan status');
  for (const hidden of ['messages', 'abcRecords', 'audioClips', 'weeklyQuestions', 'sentenceTasks', 'articulationLogs', 'otSensory', 'reinforcers']) assert.ok(!cols.has(hidden), 'admin must not receive ' + hidden);
  const text = JSON.stringify(a.records);
  for (const secret of ['CONFIDENTIAL SOAP TEXT', 'PRIVATE BEHAVIOUR', 'PRIVATE PLAN', 'PRIVATE ABC', 'PRIVATE CHAT']) assert.ok(!text.includes(secret), 'leaked: ' + secret);
  const session = a.records.find((r) => r.rid === 'ss1').data;
  assert.equal(session.summary.percentIndependent, 80, 'figures are kept');
  assert.ok(!('notes' in session) && !('data' in session));
  assert.deepEqual(Object.keys(a.records.find((r) => r.col === 'bips').data).sort(), ['childId', 'reviewDate', 'status', 'updatedAt', 'version'].filter((k) => k in a.records.find((r) => r.col === 'bips').data).sort());
});

test('an administrator cannot write or delete records', async () => {
  const A = admin.body.token;
  assert.equal((await put(A, 'targets', 'tg-admin', 'child-a', { name: 'x' })).status, 403);
  assert.equal((await put(A, 'messages', 'msg-by-admin', 'child-a', { contentEn: 'x' })).status, 403);
  assert.equal((await call('DELETE', '/api/records/targets/tg1', null, A)).status, 403);
});

test('a supervisor is clinical staff: can approve goals and sign off sessions', async () => {
  const S = supervisor.body.token, T = therapist.body.token;
  const mark = (await sync(T)).latest;
  assert.equal((await put(S, 'targets', 'tg1', 'child-a', { id: 'tg1', childId: 'child-a', name: 'Requesting help', approvalStatus: 'approved' })).status, 200);
  assert.equal((await put(S, 'savedSessions', 'ss1', 'child-a', { id: 'ss1', childId: 'child-a', role: 'speech', summary: { percentIndependent: 80 }, notes: 'x', review: { status: 'signed', by: 'Dr Rebecca', at: '2026-10-16T09:00:00Z' } })).status, 200);
  const t = await sync(T, mark);
  assert.equal(t.records.find((r) => r.col === 'targets' && r.rid === 'tg1').data.approvalStatus, 'approved');
  assert.equal(t.records.find((r) => r.col === 'savedSessions' && r.rid === 'ss1').data.review.status, 'signed');
});

test('admin can list accounts, and limit which children a staff member can reach', async () => {
  const A = admin.body.token;
  const list = await call('GET', '/api/admin/users', null, A);
  assert.equal(list.status, 200);
  assert.ok(list.body.users.length >= 5);
  assert.ok(!JSON.stringify(list.body).includes('passwordHash'));
  const me = list.body.users.find((u) => u.email === 'amal@x.com');
  assert.equal(me.role, 'admin');

  // restrict the therapist to child-a only
  const r = await patch(A, '/api/admin/users/' + therapist.body.user.id, { childIds: ['child-a'] });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.user.childIds, ['child-a']);
  const T = therapist.body.token;
  assert.equal((await put(T, 'reinforcers', 'rf-b', 'child-b', { id: 'rf-b', name: 'x' })).status, 403, 'child-b is no longer reachable');
  assert.ok(!(await sync(T)).records.some((x) => x.childId === 'child-b'), 'no child-b records are sent any more');
  assert.equal((await put(T, 'reinforcers', 'rf-a', 'child-a', { id: 'rf-a', name: 'x' })).status, 200);
  // restore for the other tests
  await patch(A, '/api/admin/users/' + therapist.body.user.id, { childIds: ['child-a', 'child-b'] });
});

test('admin account controls are validated', async () => {
  const A = admin.body.token;
  const parentId = parent.body.user.id;
  assert.equal((await patch(A, '/api/admin/users/' + parentId, { childIds: [] })).status, 400, 'a parent keeps at least one child');
  assert.equal((await patch(A, '/api/admin/users/' + parentId, { childIds: ['child-zzz'] })).status, 400, 'unknown child');
  assert.equal((await patch(A, '/api/admin/users/' + parentId, { childIds: 'child-a' })).status, 400, 'must be a list');
  assert.equal((await patch(A, '/api/admin/users/' + admin.body.user.id, { disabled: true })).status, 400, 'cannot switch off yourself');
  assert.equal((await patch(A, '/api/admin/users/' + parentId, { disabled: 'yes' })).status, 400);
  assert.equal((await patch(A, '/api/admin/users/000000000000000000000000', { disabled: true })).status, 404);
});

test('switching an account off stops sign-in and kills existing sessions', async () => {
  const A = admin.body.token;
  const spare = await register({ name: 'Spare Parent', email: 'spare@x.com', role: 'parent', code: codes['child-b'] });
  assert.equal((await call('GET', '/api/sync', null, spare.body.token)).status, 200);
  assert.equal((await patch(A, '/api/admin/users/' + spare.body.user.id, { disabled: true })).status, 200);
  assert.equal((await call('GET', '/api/sync', null, spare.body.token)).status, 401, 'old token stops working');
  assert.equal((await call('POST', '/api/auth/login', { email: 'spare@x.com', password: 'password123' })).status, 403, 'cannot sign in');
  assert.equal((await patch(A, '/api/admin/users/' + spare.body.user.id, { disabled: false })).status, 200);
  assert.equal((await call('POST', '/api/auth/login', { email: 'spare@x.com', password: 'password123' })).status, 200, 'works again once switched on');
});

test('family codes can be rotated: the old code stops working', async () => {
  const A = admin.body.token;
  const list = await call('GET', '/api/admin/children', null, A);
  const old = list.body.children.find((c) => c.id === 'child-b').inviteCode;
  const rot = await call('POST', '/api/admin/children/child-b/regenerate-code', null, A);
  assert.equal(rot.status, 200);
  assert.notEqual(rot.body.child.inviteCode, old);
  assert.equal((await register({ name: 'Late Parent', email: 'late@x.com', role: 'parent', code: old })).status, 403, 'old code rejected');
  assert.equal((await register({ name: 'Late Parent', email: 'late@x.com', role: 'parent', code: rot.body.child.inviteCode })).status, 201, 'new code accepted');
  assert.equal((await call('POST', '/api/admin/children/child-zzz/regenerate-code', null, A)).status, 404);
});

test('audit trail records sign-ins, goal and session changes and admin actions, without clinical content', async () => {
  const A = admin.body.token;
  await call('POST', '/api/auth/login', { email: 'sarah@x.com', password: 'wrong-password' }); // a failed attempt
  const r = await call('GET', '/api/admin/audit?limit=300', null, A);
  assert.equal(r.status, 200);
  const actions = r.body.events.map((e) => e.action);
  for (const a of ['account.register', 'auth.login', 'auth.login_failed', 'record.write', 'admin.update_account', 'admin.regenerate_family_code']) assert.ok(actions.includes(a), 'missing ' + a);
  assert.ok(r.body.events.some((e) => e.action === 'record.write' && e.details.col === 'savedSessions' && e.userName === 'Dr Rebecca'), 'the session sign-off is attributed to the supervisor');
  const text = JSON.stringify(r.body);
  assert.ok(!text.includes('CONFIDENTIAL SOAP TEXT') && !text.includes('password'), 'no clinical text or passwords in the trail');
  assert.ok(!actions.includes('record.write') || r.body.events.every((e) => e.action !== 'record.write' || ['targets', 'savedSessions', 'bips'].includes(e.details.col)), 'routine chat/practice sync is not logged');
  assert.equal((await call('GET', '/api/admin/audit?limit=2', null, A)).body.events.length, 2, 'limit is honoured');
  const first = r.body.events[0].at, last = r.body.events[r.body.events.length - 1].at;
  assert.ok(new Date(first) >= new Date(last), 'newest first');
});

test('the access matrix tells administrators who can see what', async () => {
  const m = (await call('GET', '/api/admin/access', null, admin.body.token)).body.matrix;
  const row = (c) => m.find((x) => x.col === c);
  assert.equal(row('abcRecords').parentRead, 'no');
  assert.equal(row('abcRecords').adminRead, 'no');
  assert.equal(row('homeTasks').parentWrite, 'limited');
  assert.equal(row('savedSessions').adminRead, 'summary');
  assert.equal(row('messages').adminRead, 'no');
  assert.equal(row('audioClips').parentRead, 'some');
  assert.ok(m.filter((x) => x.col !== 'teamRequests').every((x) => x.adminWrite === 'no'));
  assert.equal(row('teamRequests').adminWrite, 'limited', 'the administrator may only answer team requests');
  assert.equal(row('observations').parentRead, 'no');
  assert.equal(row('observations').adminRead, 'no');
});

/* ---------------- centres, accounts, cases, billing ---------------- */
let cA, cB, scoped;
const post = (tok, url, body) => call('POST', url, body, tok);

test('admin creates centres by type; names and types are validated', async () => {
  const A = admin.body.token;
  assert.equal((await post(A, '/api/admin/centers', { name: 'X', type: 'clinic' })).status, 400);
  assert.equal((await post(A, '/api/admin/centers', { name: 'Hospital', type: 'hospital' })).status, 400);
  cA = (await post(A, '/api/admin/centers', { name: 'Riyadh Speech Center', type: 'speech_therapy' })).body.center;
  cB = (await post(A, '/api/admin/centers', { name: 'Jeddah Clinic', type: 'clinic' })).body.center;
  assert.equal(cA.type, 'speech_therapy');
  assert.equal((await call('GET', '/api/admin/centers', null, A)).body.centers.length, 2);
  assert.equal((await call('GET', '/api/admin/centers', null, therapist.body.token)).status, 403, 'staff cannot manage centres');
});

test('admin creates accounts with a role, centre and linked children', async () => {
  const A = admin.body.token;
  const a = await post(A, '/api/admin/children', { name: 'Noor Test', centerId: cA.id });
  assert.equal(a.status, 201);
  assert.equal(a.body.child.centerId, cA.id);
  const kid = a.body.child.id;
  assert.equal((await post(A, '/api/admin/users', { name: 'Slp One', email: 'slp@x.com', password: 'short', role: 'speech' })).status, 400);
  const u = await post(A, '/api/admin/users', { name: 'Slp One', email: 'SLP@x.com', password: 'password123', role: 'speech', centerId: cA.id, childIds: [kid] });
  assert.equal(u.status, 201);
  assert.equal(u.body.user.centerId, cA.id);
  assert.ok(!JSON.stringify(u.body).includes('passwordHash'));
  assert.equal((await post(A, '/api/admin/users', { name: 'Dup', email: 'slp@x.com', password: 'password123', role: 'speech' })).status, 409);
  // the new account can sign in and reaches exactly its child
  const login = await call('POST', '/api/auth/login', { email: 'slp@x.com', password: 'password123' });
  assert.equal(login.status, 200);
  assert.deepEqual(login.body.user.childIds, [kid]);
  // a parent needs a child; staff cannot be linked to a child of another centre
  assert.equal((await post(A, '/api/admin/users', { name: 'Par', email: 'par@x.com', password: 'password123', role: 'parent' })).status, 400);
  assert.equal((await post(A, '/api/admin/users', { name: 'Slp Two', email: 'slp2@x.com', password: 'password123', role: 'speech', centerId: cB.id, childIds: [kid] })).status, 400, 'cross-centre link refused');
  const p = await post(A, '/api/admin/users', { name: 'Par Ent', email: 'par@x.com', password: 'password123', role: 'parent', childIds: [kid] });
  assert.equal(p.status, 201);
  // edit: rename, change role, deactivate
  const id = u.body.user.id;
  const e = await patch(A, '/api/admin/users/' + id, { name: 'Slp Renamed', role: 'ot' });
  assert.equal(e.body.user.role, 'ot');
  assert.equal(e.body.user.name, 'Slp Renamed');
  assert.equal((await patch(A, '/api/admin/users/' + p.body.user.id, { role: 'speech' })).status, 400, 'parent cannot become staff');
  assert.equal((await patch(A, '/api/admin/users/' + admin.body.user.id, { role: 'parent' })).status, 400, 'cannot change own role');
});

test('centre-wide visibility follows the centre; transfer removes the old centre’s staff', async () => {
  const A = admin.body.token;
  const kids = (await call('GET', '/api/admin/children', null, A)).body.children;
  const noor = kids.find((k) => k.name === 'Noor Test');
  const sup = await post(A, '/api/admin/users', { name: 'Senior One', email: 'senior@x.com', password: 'password123', role: 'supervisor', centerId: cA.id, scope: 'center' });
  assert.equal(sup.status, 201);
  assert.deepEqual(sup.body.user.childIds, [noor.id], 'sees every child of the centre');
  assert.equal((await post(A, '/api/admin/users', { name: 'Bad', email: 'bad@x.com', password: 'password123', role: 'supervisor', scope: 'center' })).status, 400, 'centre-wide needs a centre');
  const second = await post(A, '/api/admin/children', { name: 'Second Kid', centerId: cA.id });
  const after = (await call('GET', '/api/admin/users', null, A)).body.users.find((x) => x.email === 'senior@x.com');
  assert.ok(after.childIds.includes(second.body.child.id), 'new child appears automatically');
  // transfer Noor to centre B: the centre-A staff lose access, the parent keeps it
  const t = await patch(A, '/api/admin/children/' + noor.id, { centerId: cB.id });
  assert.equal(t.status, 200);
  const users = (await call('GET', '/api/admin/users', null, A)).body.users;
  assert.ok(!users.find((x) => x.email === 'senior@x.com').childIds.includes(noor.id));
  assert.ok(!users.find((x) => x.email === 'slp@x.com').childIds.includes(noor.id));
  assert.ok(users.find((x) => x.email === 'par@x.com').childIds.includes(noor.id), 'parent keeps their child');
});

test('reassign therapists on a case, and archive / restore it', async () => {
  const A = admin.body.token;
  const noor = (await call('GET', '/api/admin/children', null, A)).body.children.find((k) => k.name === 'Noor Test');
  const users = (await call('GET', '/api/admin/users', null, A)).body.users;
  const slp = users.find((x) => x.email === 'slp@x.com');
  const t2 = await post(A, '/api/admin/users', { name: 'Jed Therapist', email: 'jed@x.com', password: 'password123', role: 'behavior', centerId: cB.id });
  assert.equal((await call('PUT', '/api/admin/children/' + noor.id + '/staff', { userIds: [slp.id] }, A)).status, 400, 'slp works in another centre');
  assert.equal((await call('PUT', '/api/admin/children/' + noor.id + '/staff', { userIds: [t2.body.user.id] }, A)).status, 200);
  const T = await call('POST', '/api/auth/login', { email: 'jed@x.com', password: 'password123' });
  assert.deepEqual(T.body.user.childIds, [noor.id]);
  assert.equal((await put(T.body.token, 'reinforcers', 'rf-n', noor.id, { id: 'rf-n', name: 'x' })).status, 200);
  // archive: staff can no longer write or see it in their list; parent still can read
  assert.equal((await patch(A, '/api/admin/children/' + noor.id, { archived: true })).status, 200);
  assert.equal((await put(T.body.token, 'reinforcers', 'rf-n2', noor.id, { id: 'rf-n2', name: 'y' })).status, 409);
  assert.ok(!(await call('GET', '/api/me', null, T.body.token)).body.children.some((c) => c.id === noor.id), 'hidden from the clinical team');
  assert.equal((await patch(A, '/api/admin/children/' + noor.id, { archived: false })).status, 200);
  assert.equal((await put(T.body.token, 'reinforcers', 'rf-n3', noor.id, { id: 'rf-n3', name: 'z' })).status, 200);
});

test('a centre administrator is limited to their own centre', async () => {
  const A = admin.body.token;
  const sa = await post(A, '/api/admin/users', { name: 'Centre Admin', email: 'cadmin@x.com', password: 'password123', role: 'admin', centerId: cB.id });
  assert.equal(sa.status, 201);
  scoped = (await call('POST', '/api/auth/login', { email: 'cadmin@x.com', password: 'password123' })).body.token;
  const kids = (await call('GET', '/api/admin/children', null, scoped)).body.children;
  assert.ok(kids.length >= 1 && kids.every((k) => k.centerId === cB.id), 'only own-centre children');
  const users = (await call('GET', '/api/admin/users', null, scoped)).body.users;
  assert.ok(!users.some((u) => u.email === 'senior@x.com'), 'other centre’s staff are invisible');
  assert.deepEqual((await call('GET', '/api/admin/centers', null, scoped)).body.centers.map((c) => c.id), [cB.id]);
  assert.equal((await post(scoped, '/api/admin/centers', { name: 'New', type: 'clinic' })).status, 403);
  assert.equal((await post(scoped, '/api/admin/users', { name: 'Evil', email: 'evil@x.com', password: 'password123', role: 'admin' })).status, 403, 'cannot mint admins');
  const mine = await post(scoped, '/api/admin/users', { name: 'Local Staff', email: 'local@x.com', password: 'password123', role: 'teacher', centerId: cA.id });
  assert.equal(mine.body.user.centerId, cB.id, 'forced into own centre');
  const other = (await call('GET', '/api/admin/children', null, A)).body.children.find((k) => k.centerId === cA.id);
  assert.equal((await patch(scoped, '/api/admin/children/' + other.id, { archived: true })).status, 403, 'cannot touch another centre’s child');
  assert.equal((await patch(scoped, '/api/admin/children/' + kids[0].id, { centerId: cA.id })).status, 403, 'cannot transfer');
  const senior = (await call('GET', '/api/admin/users', null, A)).body.users.find((u) => u.email === 'senior@x.com');
  assert.equal((await patch(scoped, '/api/admin/users/' + senior.id, { disabled: true })).status, 403);
});

test('billing: invoices move draft → issued → paid, totals add up, paid is final', async () => {
  const A = admin.body.token;
  assert.equal((await post(A, '/api/admin/invoices', { description: 'x', amount: 0 })).status, 400);
  const kid = (await call('GET', '/api/admin/children', null, A)).body.children.find((k) => k.name === 'Noor Test');
  const i1 = (await post(A, '/api/admin/invoices', { description: 'May sessions', amount: 1200.5, childId: kid.id, dueDate: '2026-12-01' })).body.invoice;
  const i2 = (await post(A, '/api/admin/invoices', { description: 'Assessment', amount: 300 , centerId: cA.id })).body.invoice;
  assert.match(i1.number, /^INV-\d{4}$/);
  assert.equal(i1.centerId, cB.id, 'centre follows the child');
  assert.equal((await patch(A, '/api/admin/invoices/' + i1.id, { status: 'paid' })).status, 400, 'cannot skip issuing');
  assert.equal((await patch(A, '/api/admin/invoices/' + i1.id, { amount: 1500 })).status, 200, 'draft is editable');
  assert.equal((await patch(A, '/api/admin/invoices/' + i1.id, { status: 'issued' })).status, 200);
  assert.equal((await patch(A, '/api/admin/invoices/' + i1.id, { amount: 1 })).status, 400, 'issued is locked');
  let list = (await call('GET', '/api/admin/invoices', null, A)).body;
  assert.deepEqual(list.totals, { draft: 300, outstanding: 1500, paid: 0 });
  assert.equal((await patch(A, '/api/admin/invoices/' + i1.id, { status: 'paid' })).status, 200);
  assert.equal((await patch(A, '/api/admin/invoices/' + i1.id, { status: 'void' })).status, 400, 'paid is final');
  assert.equal((await patch(A, '/api/admin/invoices/' + i2.id, { status: 'void' })).status, 200);
  list = (await call('GET', '/api/admin/invoices', null, A)).body;
  assert.deepEqual(list.totals, { draft: 0, outstanding: 0, paid: 1500 });
  // staff and parents cannot touch billing; a centre admin sees only its own centre
  assert.equal((await call('GET', '/api/admin/invoices', null, therapist.body.token)).status, 403);
  assert.equal((await call('GET', '/api/admin/invoices', null, parent.body.token)).status, 403);
  assert.deepEqual((await call('GET', '/api/admin/invoices', null, scoped)).body.invoices.map((i) => i.number), [i1.number]);
  assert.equal((await patch(scoped, '/api/admin/invoices/' + i2.id, { status: 'issued' })).status, 404);
});

test('new staff registering with the shared code do not reach children placed in a centre', async () => {
  const r = await register({ name: 'Late Staff', email: 'latestaff@x.com', role: 'speech', code: STAFF });
  assert.equal(r.status, 201);
  assert.ok(r.body.user.childIds.every((id) => ['child-a', 'child-b'].includes(id)), 'only unassigned children');
});

test('profile details, password reset and removing an account', async () => {
  const A = admin.body.token;
  const c = await post(A, '/api/admin/users', { name: 'Dr Profile', email: 'profile@x.com', password: 'password123', role: 'behavior', title: 'Board Certified Behavior Analyst', phone: '+966500000000' });
  assert.equal(c.status, 201);
  assert.equal(c.body.user.title, 'Board Certified Behavior Analyst');
  const login = await call('POST', '/api/auth/login', { email: 'profile@x.com', password: 'password123' });
  assert.equal(login.body.user.title, 'Board Certified Behavior Analyst');
  const me = await call('GET', '/api/me', null, login.body.token);
  assert.equal(me.body.user.phone, '+966500000000');
  // password reset: old password stops working, new works
  assert.equal((await patch(A, '/api/admin/users/' + c.body.user.id, { password: 'short' })).status, 400);
  assert.equal((await patch(A, '/api/admin/users/' + c.body.user.id, { password: 'brand-new-pass', title: 'Senior BCBA' })).status, 200);
  assert.equal((await call('POST', '/api/auth/login', { email: 'profile@x.com', password: 'password123' })).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { email: 'profile@x.com', password: 'brand-new-pass' })).status, 200);
  // staff cannot reset passwords or remove accounts
  assert.equal((await patch(therapist.body.token, '/api/admin/users/' + c.body.user.id, { password: 'hacked-pass-1' })).status, 403);
  assert.equal((await call('DELETE', '/api/admin/users/' + c.body.user.id, null, therapist.body.token)).status, 403);
  // remove: login disappears, cannot remove yourself, unknown id is a 404
  assert.equal((await call('DELETE', '/api/admin/users/' + admin.body.user.id, null, A)).status, 400);
  assert.equal((await call('DELETE', '/api/admin/users/' + c.body.user.id, null, A)).status, 200);
  assert.equal((await call('POST', '/api/auth/login', { email: 'profile@x.com', password: 'brand-new-pass' })).status, 401);
  assert.equal((await call('DELETE', '/api/admin/users/' + c.body.user.id, null, A)).status, 404);
  assert.equal((await call('DELETE', '/api/admin/users/' + parent.body.user.id, null, scoped)).status, 403, 'a centre admin cannot remove people outside its centre');
  const events = (await call('GET', '/api/admin/audit?limit=100', null, A)).body.events;
  assert.ok(events.some((e) => e.action === 'admin.remove_account'));
  assert.ok(!JSON.stringify(events).includes('brand-new-pass'));
});

test('organisation settings: plan and seats are enforced, sign-up switches and staff code rotation work', async () => {
  const A = admin.body.token;
  const g = await call('GET', '/api/admin/settings', null, A);
  assert.equal(g.status, 200);
  assert.equal(g.body.settings.plan.name, 'Clinic Multidisciplinary Pro');
  assert.equal(g.body.settings.staffCode, STAFF, 'the administrator can read the staff code');
  assert.equal(g.body.canEdit, true);
  assert.equal((await call('GET', '/api/admin/settings', null, therapist.body.token)).status, 403);
  assert.equal((await call('GET', '/api/admin/settings', null, scoped)).body.settings.staffCode, null, 'a centre admin does not see the code');
  assert.equal((await patch(scoped, '/api/admin/settings', { name: 'Hacked' })).status, 403);
  assert.equal((await patch(A, '/api/admin/settings', { plan: { seats: 0 } })).status, 400);
  assert.equal((await patch(A, '/api/admin/settings', { plan: { renewalDate: 'soon' } })).status, 400);
  assert.equal((await call('GET', '/api/me', null, parent.body.token)).body.org.name, 'Al-Amal Development Center');

  // seats: cannot go below what is in use; at the limit new staff are refused
  const used = g.body.seatsUsed;
  assert.equal((await patch(A, '/api/admin/settings', { plan: { seats: used - 1 } })).status, 400);
  assert.equal((await patch(A, '/api/admin/settings', { plan: { seats: used } })).status, 200);
  assert.equal((await post(A, '/api/admin/users', { name: 'One Too Many', email: 'toomany@x.com', password: 'password123', role: 'ot' })).status, 409);
  assert.equal((await register({ name: 'Self Reg', email: 'selfreg@x.com', role: 'ot', code: STAFF })).status, 409);
  assert.equal((await post(A, '/api/admin/users', { name: 'Parent Ok', email: 'parentok@x.com', password: 'password123', role: 'parent', childIds: ['child-a'] })).status, 201, 'parents do not use seats');
  assert.equal((await patch(A, '/api/admin/settings', { plan: { seats: used + 2, name: 'Plus', billingCycle: 'monthly' } })).body.settings.plan.billingCycle, 'monthly');
  assert.equal((await post(A, '/api/admin/users', { name: 'Seat Fits', email: 'seatfits@x.com', password: 'password123', role: 'ot' })).status, 201);

  // sign-up switches
  await patch(A, '/api/admin/settings', { access: { staffSelfRegistration: false } });
  assert.equal((await register({ name: 'Nope', email: 'nope@x.com', role: 'speech', code: STAFF })).status, 403);
  await patch(A, '/api/admin/settings', { access: { staffSelfRegistration: true, familySignup: false } });
  assert.equal((await register({ name: 'Nope P', email: 'nopep@x.com', role: 'parent', code: 'AAAA1111' })).status, 403);
  await patch(A, '/api/admin/settings', { access: { familySignup: true } });

  // messaging for families
  await patch(A, '/api/admin/settings', { policy: { parentMessaging: false } });
  assert.equal((await put(parent.body.token, 'messages', 'm-off', 'child-a', { id: 'm-off', text: 'hi' })).status, 403);
  assert.equal((await put(therapist.body.token, 'messages', 'm-staff', 'child-a', { id: 'm-staff', text: 'hello' })).status, 200, 'staff can still write');
  await patch(A, '/api/admin/settings', { policy: { parentMessaging: true } });
  assert.equal((await put(parent.body.token, 'messages', 'm-on', 'child-a', { id: 'm-on', text: 'hi' })).status, 200);

  // staff code rotation
  const rot = await post(A, '/api/admin/settings/staff-code');
  assert.equal(rot.status, 200);
  assert.notEqual(rot.body.staffCode, STAFF);
  await patch(A, '/api/admin/settings', { plan: { seats: 50 } });
  assert.equal((await register({ name: 'Old Code', email: 'oldcode@x.com', role: 'speech', code: STAFF })).status, 403, 'the old code stops working');
  assert.equal((await register({ name: 'New Code', email: 'newcode@x.com', role: 'speech', code: rot.body.staffCode })).status, 201);
  assert.equal((await post(scoped, '/api/admin/settings/staff-code')).status, 403);
  const events = (await call('GET', '/api/admin/audit?limit=200', null, A)).body.events.map((e) => e.action);
  assert.ok(events.includes('admin.update_settings') && events.includes('admin.rotate_staff_code'));
});


test('supervision records: privacy, org-wide libraries and the administrator’s answer to a team request', async () => {
  const A = admin.body.token, T = therapist.body.token, P = parent.body.token;
  // observations and case notes are clinical-team only
  assert.equal((await put(T, 'observations', 'ob1', 'child-a', { id: 'ob1', childId: 'child-a', therapistName: 'Dr Tareq', fidelity: 90 })).status, 200);
  assert.equal((await put(T, 'caseNotes', 'cn1', 'child-a', { id: 'cn1', childId: 'child-a', text: 'IEP review set' })).status, 200);
  const pSync = await sync(P);
  assert.ok(!pSync.records.some((r) => ['observations', 'caseNotes', 'teamRequests'].includes(r.col)), 'parents never receive supervision records');
  assert.equal((await put(P, 'observations', 'ob2', 'child-a', { id: 'ob2' })).status, 403);
  const aSync = await sync(A);
  assert.ok(!aSync.records.some((r) => ['observations', 'caseNotes'].includes(r.col)), 'the administrator does not receive them either');

  // templates / reports are organisation-wide (childId "org") and reach every clinician, not parents
  assert.equal((await put(T, 'templates', 'tp1', 'child-a', { id: 'tp1', title: 'x' })).status, 403, 'needs childId org');
  assert.equal((await put(T, 'templates', 'tp1', 'org', { id: 'tp1', childId: 'org', title: 'SOAP v1', status: 'draft' })).status, 200);
  assert.equal((await put(P, 'templates', 'tp2', 'org', { id: 'tp2' })).status, 403);
  const sup = await call('POST', '/api/auth/login', { email: 'rebecca@x.com', password: 'password123' });
  assert.ok((await sync(sup.body.token)).records.some((r) => r.col === 'templates' && r.rid === 'tp1'), 'another clinician sees the template');
  assert.ok(!(await sync(P)).records.some((r) => r.col === 'templates'), 'parents do not');
  assert.equal((await call('DELETE', '/api/records/templates/tp1', null, T)).status, 200);
  assert.equal((await put(A, 'templates', 'tp9', 'org', { id: 'tp9' })).status, 403, 'administrators cannot write templates');

  // team requests: the supervisor asks, the administrator may only answer
  assert.equal((await put(sup.body.token, 'teamRequests', 'tr1', 'child-a', { id: 'tr1', childId: 'child-a', kind: 'add', role: 'speech', note: 'Need an SLP', status: 'open', requestedBy: 'Dr Rebecca' })).status, 200);
  const seen = (await sync(A)).records.find((r) => r.col === 'teamRequests' && r.rid === 'tr1');
  assert.ok(seen, 'the administrator receives the request');
  assert.equal((await put(A, 'teamRequests', 'tr1', 'child-a', { note: 'rewritten by admin', status: 'done', adminNote: 'Assigned Nora' })).status, 200);
  const after = (await sync(sup.body.token)).records.find((r) => r.col === 'teamRequests' && r.rid === 'tr1').data;
  assert.equal(after.status, 'done');
  assert.equal(after.adminNote, 'Assigned Nora');
  assert.equal(after.note, 'Need an SLP', 'the administrator cannot rewrite the supervisor’s text');
  assert.equal(after.resolvedBy, 'Admin Amal');
  assert.equal((await put(A, 'teamRequests', 'tr1', 'child-a', { status: 'bogus' })).status, 400);
  assert.equal((await put(A, 'teamRequests', 'nope', 'child-a', { status: 'done' })).status, 404);
  assert.equal((await put(A, 'caseNotes', 'cn1', 'child-a', { text: 'x' })).status, 403, 'only teamRequests is open to the administrator');
  assert.equal((await call('DELETE', '/api/records/teamRequests/tr1', null, A)).status, 403);

  // thresholds are organisation settings, visible to every signed-in person
  assert.equal((await patch(A, '/api/admin/settings', { policy: { integrityMin: 85, ioaMin: 90, observationDays: 14, stalledDays: 10 } })).status, 200);
  const org = (await call('GET', '/api/me', null, T)).body.org;
  assert.deepEqual([org.integrityMin, org.ioaMin, org.observationDays, org.stalledDays], [85, 90, 14, 10]);
  assert.equal((await patch(A, '/api/admin/settings', { policy: { integrityMin: 150 } })).status, 400);
  assert.equal((await patch(A, '/api/admin/settings', { policy: { observationDays: 0 } })).status, 400);
  await patch(A, '/api/admin/settings', { policy: { integrityMin: 80, ioaMin: 80, observationDays: 30, stalledDays: 14 } });
});

test('messages may carry a small photo or voice note, nothing else', async () => {
  const T = therapist.body.token, P = parent.body.token;
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from('tiny image').toString('base64');
  const voice = 'data:audio/webm;codecs=opus;base64,' + Buffer.from('tiny voice').toString('base64');
  assert.equal((await put(P, 'messages', 'm-img', 'child-a', { id: 'm-img', contactId: 'contact-slp', contentEn: '', attachment: { kind: 'image', src: jpeg } })).status, 200);
  assert.equal((await put(T, 'messages', 'm-voice', 'child-a', { id: 'm-voice', contactId: 'contact-slp', contentEn: '', attachment: { kind: 'audio', src: voice, seconds: 12.4 } })).status, 200);
  const got = (await sync(P)).records.find((r) => r.col === 'messages' && r.rid === 'm-voice').data;
  assert.equal(got.attachment.kind, 'audio');
  assert.equal(got.attachment.seconds, 12);
  assert.equal((await put(P, 'messages', 'm-bad1', 'child-a', { id: 'm-bad1', attachment: { kind: 'script', src: jpeg } })).status, 400, 'unknown kind');
  assert.equal((await put(P, 'messages', 'm-bad2', 'child-a', { id: 'm-bad2', attachment: { kind: 'image', src: 'https://evil.example/x.jpg' } })).status, 400, 'only inline data');
  assert.equal((await put(P, 'messages', 'm-bad3', 'child-a', { id: 'm-bad3', attachment: { kind: 'image', src: 'data:text/html;base64,PGI+' } })).status, 400, 'wrong media type');
  assert.equal((await put(P, 'messages', 'm-bad4', 'child-a', { id: 'm-bad4', attachment: { kind: 'image', src: 'data:image/jpeg;base64,' + 'A'.repeat(240_000) } })).status, 400, 'too big');
});

test('medical records: parent saves, shares by role; staff read only what is shared; admin never', async () => {
  const T = therapist.body.token, P = parent.body.token, O = otherParent.body.token;
  const pdf = Buffer.from('%PDF-1.4 tiny report body');
  const up = (tok, id, buf, type = 'application/pdf', child = 'child-a') =>
    fetch(`${base}/api/medical-files/${id}?childId=${child}&name=${encodeURIComponent('EEG 2022.pdf')}`, { method: 'PUT', headers: { 'content-type': type, authorization: `Bearer ${tok}` }, body: buf });
  const open = (tok, id) => fetch(`${base}/api/medical-files/${id}`, { headers: { authorization: `Bearer ${tok}` } });

  // upload rules
  assert.equal((await up(T, 'file-001', pdf)).status, 403, 'staff cannot upload');
  assert.equal((await up(O, 'file-001', pdf)).status, 403, 'other family cannot upload to child-a');
  assert.equal((await up(P, 'file-001', Buffer.from('not a pdf at all, sorry'))).status, 415, 'content must match type');
  assert.equal((await up(P, 'file-001', Buffer.from('<script>alert(1)</script>'), 'text/html')).status, 415, 'type allow-list');
  assert.equal((await up(P, 'file-001', pdf)).status, 200);

  const rec = { id: 'med-1', category: 'neuro', title: 'EEG report', date: '2022-03-14', provider: 'Dr. Noor', notes: 'Normal', files: [{ id: 'file-001' }], sharing: { mode: 'private' } };
  assert.equal((await put(T, 'medicalRecords', 'med-1', 'child-a', rec)).status, 403, 'staff cannot write');
  assert.equal((await put(O, 'medicalRecords', 'med-1', 'child-a', rec)).status, 403, 'other family');
  assert.equal((await put(P, 'medicalRecords', 'med-1', 'child-a', { ...rec, category: 'bogus' })).status, 400);
  assert.equal((await put(P, 'medicalRecords', 'med-1', 'child-a', { ...rec, files: [{ id: 'file-missing' }] })).status, 400, 'file must exist');
  assert.equal((await put(P, 'medicalRecords', 'med-1', 'child-a', rec)).status, 200);

  // private: staff see nothing and cannot open the file
  assert.ok(!(await sync(T)).records.some((r) => r.col === 'medicalRecords' && !r.deleted && r.data), 'private record is hidden from staff');
  assert.equal((await open(T, 'file-001')).status, 404);
  assert.equal((await open(P, 'file-001')).status, 200);
  assert.equal((await open(O, 'file-001')).status, 404);

  // share with the supervisor role only: the supervisor sees it, the behavior therapist does not
  const S = supervisor.body.token, A = admin.body.token;
  assert.equal((await put(P, 'medicalRecords', 'med-1', 'child-a', { ...rec, sharing: { mode: 'roles', roles: ['supervisor', 'admin'] } })).status, 200);
  const seen = (tok) => sync(tok).then((x) => x.records.find((r) => r.col === 'medicalRecords' && r.rid === 'med-1' && !r.deleted));
  assert.equal((await seen(S)).data.title, 'EEG report');
  assert.equal(await seen(T), undefined);
  assert.deepEqual((await seen(S)).data.sharing.roles, ['supervisor'], 'unknown roles are dropped');
  const r1 = await open(S, 'file-001');
  assert.equal(r1.status, 200);
  assert.equal(r1.headers.get('content-type'), 'application/pdf');
  assert.equal((await open(T, 'file-001')).status, 404);

  // staff opening a file is logged; administrators never get records or files
  assert.equal((await open(A, 'file-001')).status, 403, 'admin cannot open medical files');
  assert.ok(!(await sync(A)).records.some((r) => r.col === 'medicalRecords'), 'admin sync has no medical records');
  assert.ok(JSON.stringify((await call('GET', '/api/admin/audit', null, A)).body).includes('medical.view'));

  // going private again removes it from staff devices; deleting removes the file
  const before = (await sync(S)).latest;
  assert.equal((await put(P, 'medicalRecords', 'med-1', 'child-a', { ...rec, sharing: { mode: 'private' } })).status, 200);
  const gone = (await sync(S, before)).records.find((r) => r.rid === 'med-1');
  assert.equal(gone.deleted, true);
  assert.equal((await open(S, 'file-001')).status, 404);
  assert.equal((await call('DELETE', '/api/records/medicalRecords/med-1', null, T)).status, 403, 'staff cannot delete');
  assert.equal((await call('DELETE', '/api/records/medicalRecords/med-1', null, P)).status, 200);
  assert.equal((await open(P, 'file-001')).status, 404, 'file is removed with its record');
});
