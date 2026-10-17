import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Child } from './models.js';
import { createApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 4000);

// The children the app ships with. Their ids match src/data/seedData.ts.
const CHILDREN = [
  { _id: 'child-lama', name: 'Lama Alharbi' },
  { _id: 'child-2', name: 'Maya Al-Rashid' },
  { _id: 'child-3', name: 'Tariq Al-Otaibi' },
];

function secret(name, devFile, bytes) {
  if (process.env[name]) return process.env[name];
  if (PROD) throw new Error(`${name} must be set when NODE_ENV=production`);
  // Development only: generate once and keep it, so sessions survive restarts.
  const f = path.join(here, '.data', devFile);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(bytes).toString('hex'), { mode: 0o600 });
  return fs.readFileSync(f, 'utf8').trim();
}

async function connect() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB: connected to MONGODB_URI');
    return null;
  }
  if (PROD) throw new Error('MONGODB_URI must be set when NODE_ENV=production');
  // Development: a real MongoDB 7 process with data kept in server/.data/db.
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.join(here, '.data', 'db');
  fs.mkdirSync(dbPath, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(here, '.mongodb-binaries');
  const mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' }, instance: { dbPath, port: 27018, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongod.getUri('nexia'));
  console.log('MongoDB: development database at server/.data/db (set MONGODB_URI to use your own)');
  return mongod;
}

async function seedChildren() {
  for (const c of CHILDREN) {
    if (!(await Child.exists({ _id: c._id }))) {
      await Child.create({ ...c, inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase() });
    }
  }
  const all = await Child.find();
  console.log('\nFamily invite codes (give each family the code for their child):');
  for (const c of all) console.log(`  ${c.name.padEnd(18)} ${c.inviteCode}`);
}

const mongod = await connect();
await seedChildren();

const jwtSecret = secret('JWT_SECRET', 'jwt-secret', 32);
const staffInviteCode = process.env.STAFF_INVITE_CODE || (PROD ? null : secret('STAFF_INVITE_CODE', 'staff-code', 4).toUpperCase());
if (!staffInviteCode) throw new Error('STAFF_INVITE_CODE must be set when NODE_ENV=production');
console.log(`\nStaff invite code (therapists, teachers, supervisors): ${staffInviteCode}`);

const adminInviteCode = process.env.ADMIN_INVITE_CODE || (PROD ? null : secret('ADMIN_INVITE_CODE', 'admin-code', 4).toUpperCase());
if (!adminInviteCode) throw new Error('ADMIN_INVITE_CODE must be set when NODE_ENV=production');
console.log(`Administrator invite code (organisation administrators only): ${adminInviteCode}`);

const app = createApp({ jwtSecret, staffInviteCode, adminInviteCode, corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true });
const server = app.listen(PORT, '0.0.0.0', () => console.log(`\nNexia Bridge API listening on http://0.0.0.0:${PORT}`));

const shutdown = async () => {
  server.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
