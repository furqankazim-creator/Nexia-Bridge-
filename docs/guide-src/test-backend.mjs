// A throwaway backend for checks: its own in-memory MongoDB, port 4100. Does not touch server/.data.
import { MongoMemoryServer } from '../../node_modules/mongodb-memory-server/index.js';
import { spawn } from 'node:child_process';
process.env.MONGOMS_DOWNLOAD_DIR ||= '/Users/imac/Desktop/Autism 4/Nexus-Bridge-/server/.mongodb-binaries';
const m = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
const child = spawn('node', ['server/index.js'], { cwd: '/Users/imac/Desktop/Autism 4/Nexus-Bridge-', stdio: 'inherit', env: { ...process.env, MONGODB_URI: m.getUri('e2e'), PORT: '4100', JWT_SECRET: 'e2e-secret-e2e-secret-e2e-secret-12', STAFF_INVITE_CODE: 'E2ESTAFF', ADMIN_INVITE_CODE: 'E2EADMIN' } });
process.on('SIGTERM', async () => { child.kill(); await m.stop(); process.exit(0); });
process.on('SIGINT', async () => { child.kill(); await m.stop(); process.exit(0); });
