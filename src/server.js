import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const healthStatus = process.env.CONTRACT_VARIANT === 'broken' ? 'degraded' : 'ok';
const users = [
  { id: 'usr-alice', username: 'alice', password: 'Alice123!', role: 'customer' },
  { id: 'usr-bob', username: 'bob', password: 'Bob123!', role: 'customer' }
];
const tokens = new Map([
  ['token-alice', users[0]],
  ['token-bob', users[1]]
]);
const orders = new Map();

function seed() {
  orders.clear();
  orders.set('ord-seed-001', { id: 'ord-seed-001', ownerId: 'usr-alice', product: 'Teclado', quantity: 1, status: 'pending', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
  orders.set('ord-seed-002', { id: 'ord-seed-002', ownerId: 'usr-bob', product: 'Mouse', quantity: 2, status: 'pending', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' });
}
seed();

const json = (res, status, body, extra = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(body));
};
const error = (res, status, code, message, details = []) => json(res, status, { error: { code, message, details } });
async function body(req) {
  let raw = ''; for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('JSON inválido'), { status: 400, code: 'INVALID_JSON' }); }
}
function auth(req) {
  const value = req.headers.authorization || '';
  const token = value.startsWith('Bearer ') ? value.slice(7) : '';
  return tokens.get(token);
}
function validateOrder(input) {
  const details = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) details.push('body debe ser un objeto');
  if (!input?.product || typeof input.product !== 'string') details.push('product es obligatorio y debe ser texto');
  if (input?.product?.length > 100) details.push('product no puede superar 100 caracteres');
  if (!Number.isInteger(input?.quantity) || input.quantity < 1 || input.quantity > 100) details.push('quantity debe ser entero entre 1 y 100');
  const extras = input && typeof input === 'object' ? Object.keys(input).filter(k => !['product', 'quantity'].includes(k)) : [];
  if (extras.length) details.push(`campos no permitidos: ${extras.join(', ')}`);
  return details;
}
function visible(order, user) { return { ...order, owner: user.id === order.ownerId ? 'me' : 'other' }; }

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;
  if (req.method === 'GET' && path === '/health') return json(res, 200, { status: healthStatus, service: 'orders-api', version: '1.0.0' });
  if (req.method === 'POST' && path === '/auth/login') {
    const input = await body(req);
    const user = users.find(u => u.username === input.username && u.password === input.password);
    if (!user) return error(res, 401, 'INVALID_CREDENTIALS', 'Usuario o contraseña inválidos');
    return json(res, 200, { token: user.username === 'alice' ? 'token-alice' : 'token-bob', user: { id: user.id, username: user.username, role: user.role } });
  }
  if (req.method === 'POST' && path === '/test/reset') { seed(); return json(res, 200, { reset: true, orders: orders.size }); }
  const user = auth(req);
  if (!user) return error(res, 401, 'UNAUTHORIZED', 'Se requiere un token Bearer válido');
  if (req.method === 'GET' && path === '/orders') {
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 10)));
    if (!Number.isInteger(page) || !Number.isInteger(pageSize)) return error(res, 400, 'INVALID_PAGINATION', 'page y pageSize deben ser enteros');
    const all = [...orders.values()].filter(o => o.ownerId === user.id);
    const data = all.slice((page - 1) * pageSize, page * pageSize).map(o => visible(o, user));
    return json(res, 200, { data, pagination: { page, pageSize, total: all.length, totalPages: Math.ceil(all.length / pageSize) } });
  }
  if (req.method === 'POST' && path === '/orders') {
    let input; try { input = await body(req); } catch (e) { return error(res, e.status || 400, e.code || 'BAD_REQUEST', e.message); }
    const details = validateOrder(input); if (details.length) return error(res, 422, 'VALIDATION_ERROR', 'Datos inválidos', details);
    const now = new Date().toISOString(); const order = { id: `ord-${randomUUID()}`, ownerId: user.id, product: input.product, quantity: input.quantity, status: 'pending', createdAt: now, updatedAt: now };
    orders.set(order.id, order); return json(res, 201, visible(order, user), { location: `/orders/${order.id}` });
  }
  const match = path.match(/^\/orders\/([^/]+)(?:\/status)?$/); const isStatus = /^\/orders\/([^/]+)\/status$/.test(path);
  if (match && req.method === 'GET') {
    const order = orders.get(match[1]); if (!order) return error(res, 404, 'NOT_FOUND', 'Pedido no encontrado');
    if (order.ownerId !== user.id) return error(res, 403, 'FORBIDDEN', 'No puede consultar un pedido ajeno');
    return json(res, 200, visible(order, user));
  }
  if (isStatus && (req.method === 'PUT' || req.method === 'PATCH')) {
    const id = path.match(/^\/orders\/([^/]+)\/status$/)[1]; const order = orders.get(id);
    if (!order) return error(res, 404, 'NOT_FOUND', 'Pedido no encontrado');
    if (order.ownerId !== user.id) return error(res, 403, 'FORBIDDEN', 'No puede modificar un pedido ajeno');
    let input; try { input = await body(req); } catch (e) { return error(res, 400, 'INVALID_JSON', e.message); }
    if (!['pending', 'confirmed', 'cancelled'].includes(input.status)) return error(res, 422, 'VALIDATION_ERROR', 'status inválido', ['status debe ser pending, confirmed o cancelled']);
    order.status = input.status; order.updatedAt = order.updatedAt; return json(res, 200, visible(order, user));
  }
  return error(res, 404, 'NOT_FOUND', 'Ruta no encontrada');
}

http.createServer((req, res) => handler(req, res).catch(e => error(res, 500, 'INTERNAL_ERROR', e.message))).listen(PORT, () => console.log(`orders-api listening on http://localhost:${PORT}`));
