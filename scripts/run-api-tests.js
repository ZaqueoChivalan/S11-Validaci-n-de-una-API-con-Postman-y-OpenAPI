import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://localhost:3100';
let child;
const results = [];
function check(id, name, condition, detail) { results.push({ id, name, passed: Boolean(condition), detail }); if (!condition) throw new Error(`${id} ${name}: ${detail}`); }
async function request(method, path, options = {}) { const r = await fetch(base + path, { method, headers: { ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.body ? { 'content-type': 'application/json' } : {}) }, body: options.body ? JSON.stringify(options.body) : undefined }); return { status: r.status, json: await r.json() }; }
async function start() { child = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: '3100' }, stdio: 'ignore' }); for (let i = 0; i < 30; i++) { try { if ((await request('GET', '/health')).status === 200) return; } catch {} await new Promise(r => setTimeout(r, 100)); } throw new Error('API no inició'); }
async function stop() { child?.kill(); }

try {
  await start(); await request('POST', '/test/reset');
  let r = await request('GET', '/health'); check('TC-01', 'health', r.status === 200 && r.json.status === 'ok', JSON.stringify(r.json));
  r = await request('POST', '/auth/login', { body: { username: 'alice', password: 'Alice123!' } }); const alice = r.json.token; check('TC-02', 'login', r.status === 200 && typeof alice === 'string', JSON.stringify(r.json));
  r = await request('GET', '/orders?page=1&pageSize=1', { token: alice }); check('TC-03', 'paginación', r.status === 200 && r.json.data.length <= 1 && r.json.pagination.pageSize === 1, JSON.stringify(r.json.pagination));
  r = await request('POST', '/orders', { token: alice, body: { product: 'Audífonos S11', quantity: 2 } }); const id = r.json.id; check('TC-04', 'crear', r.status === 201 && /^ord-/.test(id), JSON.stringify(r.json));
  r = await request('GET', `/orders/${id}`, { token: alice }); check('TC-05', 'consultar', r.status === 200 && r.json.id === id, JSON.stringify(r.json));
  r = await request('PUT', `/orders/${id}/status`, { token: alice, body: { status: 'confirmed' } }); check('TC-06', 'cambiar estado', r.status === 200 && r.json.status === 'confirmed', JSON.stringify(r.json));
  const firstId = r.json.id; r = await request('PUT', `/orders/${id}/status`, { token: alice, body: { status: 'confirmed' } }); check('TC-07', 'idempotencia', r.status === 200 && r.json.id === firstId && r.json.status === 'confirmed', JSON.stringify(r.json));
  r = await request('POST', '/orders', { token: alice, body: { quantity: 1 } }); check('TC-08', 'obligatorio', r.status === 422 && r.json.error.code === 'VALIDATION_ERROR', JSON.stringify(r.json));
  r = await request('POST', '/orders', { token: alice, body: { product: 'X', quantity: 0 } }); check('TC-09', 'tipo/rango', r.status === 422 && r.json.error.code === 'VALIDATION_ERROR', JSON.stringify(r.json));
  r = await request('GET', '/orders'); check('TC-10', 'sin credenciales', r.status === 401 && r.json.error.code === 'UNAUTHORIZED', JSON.stringify(r.json));
  r = await request('GET', '/orders', { token: 'invalid-token' }); check('TC-11', 'token inválido', r.status === 401 && r.json.error.code === 'UNAUTHORIZED', JSON.stringify(r.json));
  r = await request('GET', '/orders/ord-seed-002', { token: alice }); check('TC-12', 'recurso ajeno', r.status === 403 && r.json.error.code === 'FORBIDDEN', JSON.stringify(r.json));
  r = await request('GET', '/orders/ord-no-existe', { token: alice }); check('TC-13', 'inexistente', r.status === 404 && r.json.error.code === 'NOT_FOUND', JSON.stringify(r.json));
  r = await request('GET', '/orders?page=abc&pageSize=1', { token: alice }); check('TC-14', 'paginación inválida', r.status === 400 && r.json.error.code === 'INVALID_PAGINATION', JSON.stringify(r.json));
  await mkdir('reports', { recursive: true }); await writeFile('reports/last-run.json', JSON.stringify({ executedAt: new Date().toISOString(), total: results.length, passed: results.filter(x => x.passed).length, failed: results.filter(x => !x.passed).length, results }, null, 2));
  console.log(`PASS ${results.length}/${results.length} casos: ${results.map(x => x.id).join(', ')}`);
} catch (e) { console.error(e.message); process.exitCode = 1; } finally { await stop(); }
