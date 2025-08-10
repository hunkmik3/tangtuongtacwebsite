require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { EventEmitter } = require('events');

const prisma = new PrismaClient();
const app = express();
const bus = new EventEmitter();
bus.setMaxListeners(200);

// Config
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const BANK_BIN = process.env.BANK_BIN || '970422'; // Vietcombank demo
const BANK_ACCOUNT = process.env.BANK_ACCOUNT || '0000000001';
const BANK_NAME = process.env.BANK_NAME || 'VCB Demo';
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'dev-webhook-token';

// Middlewares
app.use(cors({
  origin: true, // Cho phép tất cả origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Cho phép trả lời preflight cho mọi đường dẫn (fix Failed to fetch do CORS ở PATCH/PUT/POST)
app.options('*', cors());

function createToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Activity helper to both persist and emit SSE
async function logActivity(userId, action, metadata) {
  try {
    const act = await prisma.activityLog.create({ data: { userId, action, metadata: metadata ?? null } });
    try { bus.emit('activity', { id: act.id, userId: act.userId, action: act.action }); } catch {}
    return act;
  } catch (e) {
    console.error('logActivity failed', e);
    return null;
  }
}

// Health
app.get('/api/health', (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  server: 'Tăng Tương Tác VIP API',
  version: '1.0.0'
}));

// Test endpoint cho mobile
app.get('/api/test', (req, res) => res.json({ 
  message: 'Kết nối thành công từ mobile! 🎉',
  timestamp: new Date().toISOString(),
  userAgent: req.headers['user-agent'] || 'Unknown'
}));

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Thiếu thông tin' });
    const exists = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (exists) return res.status(409).json({ error: 'Tài khoản đã tồn tại' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email, passwordHash } });
    await logActivity(user.id, 'REGISTER');
    // Create CRM contact automatically
    try {
      await prisma.cRMContact.create({ data: { userId: user.id, name: username, email } });
    } catch (_) {
      // non-blocking
    }
    const token = createToken({ id: user.id, role: user.role });
    res.json({ token, user: { id: user.id, username, email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Thiếu thông tin' });
    const user = await prisma.user.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
    if (!user) return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
    await logActivity(user.id, 'LOGIN');
    const token = createToken({ id: user.id, role: user.role });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/me', authMiddleware, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      balanceVnd: true,
      fullName: true,
      phone: true,
      birthday: true,
      address: true,
      city: true,
      country: true
    }
  });
  res.json(me);
});

// Update current user's profile
app.patch('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const { email, fullName, phone, birthday, address, city, country } = req.body || {};
    const data = {};
    if (email !== undefined) data.email = String(email);
    if (fullName !== undefined) data.fullName = fullName === '' ? null : String(fullName);
    if (phone !== undefined) data.phone = phone === '' ? null : String(phone);
    if (birthday !== undefined) {
      if (birthday) data.birthday = new Date(birthday);
      else data.birthday = null;
    }
    if (address !== undefined) data.address = address === '' ? null : String(address);
    if (city !== undefined) data.city = city === '' ? null : String(city);
    if (country !== undefined) data.country = country === '' ? null : String(country);

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    await logActivity(req.user.id, 'UPDATE_PROFILE');

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      fullName: user.fullName,
      phone: user.phone,
      birthday: user.birthday,
      address: user.address,
      city: user.city,
      country: user.country
    });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email đã tồn tại' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Fallback for clients that cannot use PATCH
app.put('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const { email, fullName, phone, birthday, address, city, country } = req.body || {};
    const data = {};
    if (email !== undefined) data.email = String(email);
    if (fullName !== undefined) data.fullName = fullName === '' ? null : String(fullName);
    if (phone !== undefined) data.phone = phone === '' ? null : String(phone);
    if (birthday !== undefined) {
      if (birthday) data.birthday = new Date(birthday);
      else data.birthday = null;
    }
    if (address !== undefined) data.address = address === '' ? null : String(address);
    if (city !== undefined) data.city = city === '' ? null : String(city);
    if (country !== undefined) data.country = country === '' ? null : String(country);

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    await prisma.activityLog.create({ data: { userId: req.user.id, action: 'UPDATE_PROFILE' } });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      fullName: user.fullName,
      phone: user.phone,
      birthday: user.birthday,
      address: user.address,
      city: user.city,
      country: user.country
    });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email đã tồn tại' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users/me', authMiddleware, async (req, res) => {
  // alias of PUT/PATCH for environments that block those verbs
  return app._router.handle(req, res, () => {}, 'PUT');
});

// Admin - Users management
app.get('/api/admin/users', authMiddleware, adminOnly, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, email: true, role: true, createdAt: true }
  });
  res.json(users);
});

app.patch('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, email, role } = req.body || {};
    const data = {};
    if (username !== undefined) data.username = String(username);
    if (email !== undefined) data.email = String(email);
    if (role !== undefined) {
      if (!['USER', 'ADMIN'].includes(String(role))) return res.status(400).json({ error: 'Vai trò không hợp lệ' });
      data.role = String(role);
    }
    const user = await prisma.user.update({ where: { id }, data });
  await logActivity(req.user.id, 'ADMIN_UPDATE_USER', { targetUserId: id });
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'Username hoặc email đã tồn tại' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
  await logActivity(req.user.id, 'ADMIN_DELETE_USER', { targetUserId: id });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Services
app.get('/api/services', async (_req, res) => {
  const items = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

app.post('/api/services', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, rateVnd = 0, active = true } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Thiếu tên dịch vụ' });
    const service = await prisma.service.create({ data: { name, description, rateVnd: Number(rateVnd) || 0, active: !!active } });
    res.status(201).json(service);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/services/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.rateVnd !== undefined) data.rateVnd = Number(req.body.rateVnd) || 0;
    if (req.body.active !== undefined) data.active = !!req.body.active;
    const service = await prisma.service.update({ where: { id }, data });
    res.json(service);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { service: true, user: { select: { username: true, email: true } } }
  });
  res.json(orders);
});

// Get specific order (own order unless admin)
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { service: true, user: { select: { id: true, username: true } } }
  });
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(order);
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { serviceId, quantity, note } = req.body || {};
    if (!serviceId || !quantity) return res.status(400).json({ error: 'Thiếu thông tin đơn hàng' });
    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
    if (!service || !service.active) return res.status(400).json({ error: 'Dịch vụ không khả dụng' });
    const amountVnd = (Number(quantity) || 0) * (service.rateVnd || 0);
    const order = await prisma.order.create({ data: { userId: req.user.id, serviceId: service.id, quantity: Number(quantity), amountVnd, note } });
    await logActivity(req.user.id, 'CREATE_ORDER', { orderId: order.id, serviceName: service.name, quantity: order.quantity });
    await logActivity(req.user.id, 'ORDER_STATUS', { orderId: order.id, status: 'PENDING', serviceName: service.name, quantity: order.quantity });
    try { bus.emit('order.created', { id: order.id }); } catch {}
    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update order status
app.patch('/api/admin/orders/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED'];
    const { status } = req.body || {};
    if (!allowed.includes(String(status))) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    const order = await prisma.order.update({ where: { id }, data: { status: String(status) }, include: { service: true } });
    await logActivity(order.userId, 'ORDER_STATUS', { orderId: order.id, status: order.status, serviceName: order.service?.name, quantity: order.quantity });
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// User activity recent
app.get('/api/activity/recent', authMiddleware, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const items = await prisma.activityLog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  res.json(items);
});

// User activity SSE stream
app.get('/api/activity/stream', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const queryToken = req.query.token || '';
  const token = headerToken || queryToken;
  if (!token) return res.status(401).end();
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');

  const onActivity = async (payload) => {
    if (!payload || payload.userId !== user.id) return;
    try {
      const act = await prisma.activityLog.findUnique({ where: { id: payload.id } });
      if (act) {
        res.write('event: activity\n');
        res.write('data: ' + JSON.stringify(act) + '\n\n');
      }
    } catch {}
  };
  bus.on('activity', onActivity);
  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
  req.on('close', () => {
    clearInterval(heartbeat);
    bus.off('activity', onActivity);
    try { res.end(); } catch {}
  });
});

// SSE stream gửi sự kiện đơn hàng mới cho admin
app.get('/api/admin/orders/stream', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const queryToken = req.query.token || '';
  const token = headerToken || queryToken;
  if (!token) return res.status(401).end();
  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user?.role !== 'ADMIN') return res.status(403).end();
  } catch {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');

  const onCreated = async (payload) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: payload.id },
        include: { service: true, user: { select: { username: true, email: true } } }
      });
      if (order) {
        res.write('event: order.created\n');
        res.write('data: ' + JSON.stringify(order) + '\n\n');
      }
    } catch {}
  };
  bus.on('order.created', onCreated);
  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
  req.on('close', () => {
    clearInterval(heartbeat);
    bus.off('order.created', onCreated);
    try { res.end(); } catch {}
  });
});

// CRM Contacts
app.get('/api/crm/contacts', authMiddleware, adminOnly, async (_req, res) => {
  const contacts = await prisma.cRMContact.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(contacts);
});

// Topups list
app.get('/api/topups', authMiddleware, async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const where = isAdmin ? {} : { userId: req.user.id };
  const items = await prisma.topup.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: isAdmin ? { user: { select: { id: true, username: true, email: true } } } : undefined
  });
  res.json(items);
});

// Admin: confirm topup manually
app.patch('/api/admin/topups/:id/confirm', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amountVnd, providerRef } = req.body || {};
    const topup = await prisma.topup.findUnique({ where: { id } });
    if (!topup) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    if (topup.status === 'COMPLETED') return res.json(topup);
    if (topup.status !== 'PENDING') return res.status(400).json({ error: `Trạng thái không hợp lệ: ${topup.status}` });

    const credit = Math.max(Number(amountVnd) || topup.amountVnd, 0);
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.topup.update({ where: { id }, data: { status: 'COMPLETED', providerRef: providerRef || topup.providerRef || `ADMIN-${Date.now()}` } });
      await tx.user.update({ where: { id: topup.userId }, data: { balanceVnd: { increment: credit } } });
      await tx.activityLog.create({ data: { userId: topup.userId, action: 'TOPUP_COMPLETED', metadata: { topupId: topup.id, amountVnd: credit, by: 'ADMIN' } } });
      return t;
    });
    try { bus.emit('activity', { id: 0, userId: topup.userId }); } catch {}
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: cancel/fail topup manually
app.patch('/api/admin/topups/:id/cancel', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason, status } = req.body || {};
    const targetStatus = ['FAILED', 'CANCELED'].includes(String(status)) ? String(status) : 'CANCELED';
    const topup = await prisma.topup.findUnique({ where: { id } });
    if (!topup) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    if (topup.status === 'COMPLETED') return res.status(400).json({ error: 'Giao dịch đã hoàn tất, không thể hủy' });
    if (topup.status === targetStatus) return res.json(topup);
    const updated = await prisma.topup.update({ where: { id }, data: { status: targetStatus, extra: { ...(topup.extra || {}), adminCancelReason: reason || null } } });
    await logActivity(topup.userId, 'TOPUP_CANCELED', { topupId: topup.id, reason: reason || null });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/crm/contacts', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userId, name, email, phone, tags, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Thiếu tên' });
    const contact = await prisma.cRMContact.create({ data: { userId, name, email, phone, tags: tags ?? null, notes } });
    res.status(201).json(contact);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// CRM Tasks
app.get('/api/crm/tasks', authMiddleware, adminOnly, async (_req, res) => {
  const tasks = await prisma.cRMTask.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(tasks);
});

app.post('/api/crm/tasks', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, status, assigneeId, dueDate } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Thiếu tiêu đề' });
    const task = await prisma.cRMTask.create({ data: { title, description, status, assigneeId, dueDate: dueDate ? new Date(dueDate) : null } });
    res.status(201).json(task);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stats
app.get('/api/stats/overview', authMiddleware, adminOnly, async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [users, orders, revenueAgg, todayOrders, newUsers7d, activeUserIds, services] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { amountVnd: true } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.activityLog.findMany({
      where: { createdAt: { gte: last7d }, userId: { not: null } },
      distinct: ['userId'],
      select: { userId: true }
    }),
    prisma.service.findMany({ include: { _count: { select: { orders: true } } } })
  ]);

  const activeUsers = activeUserIds.length;
  const revenueVnd = revenueAgg._sum.amountVnd || 0;
  res.json({
    users,
    orders,
    revenueVnd,
    todayOrders,
    newUsers7d,
    activeUsers,
    services
  });
});

// Topup: create request (generate VietQR link)
app.post('/api/topup/create', authMiddleware, async (req, res) => {
  try {
    const amountVnd = Math.max(Number(req.body?.amountVnd) || 0, 10000);
    const contentCode = `TTT-${req.user.id}-${Date.now().toString().slice(-6)}`;
    const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?amount=${amountVnd}&addInfo=${encodeURIComponent(contentCode)}&accountName=${encodeURIComponent(BANK_NAME)}`;
    const topup = await prisma.topup.create({ data: { userId: req.user.id, amountVnd, status: 'PENDING', contentCode, qrUrl, provider: 'VietQR' } });
    await logActivity(req.user.id, 'TOPUP_CREATE', { topupId: topup.id, amountVnd, contentCode });
    res.status(201).json({ id: topup.id, amountVnd, contentCode, qrUrl, bank: { bin: BANK_BIN, account: BANK_ACCOUNT, name: BANK_NAME } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Topup: webhook (bank side) - for demo we accept POST with contentCode
app.post('/api/topup/webhook', async (req, res) => {
  try {
    // Simple token auth for webhook
    const headerToken = req.headers['x-webhook-token'] || '';
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const token = String(headerToken || bearer);
    if (!token || token !== WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized webhook' });
    }

    let { contentCode, amountVnd, description, providerRef } = req.body || {};
    // Allow extracting contentCode from bank description if not provided directly
    if (!contentCode && description) {
      const match = String(description).match(/TTT-\d+-\d{4,}/i);
      if (match) contentCode = match[0];
    }
    if (!contentCode) return res.status(400).json({ error: 'Missing contentCode' });

    // Optional: idempotency by providerRef if given
    if (providerRef) {
      const dupe = await prisma.topup.findFirst({ where: { providerRef, status: 'COMPLETED' } });
      if (dupe) return res.json({ ok: true, topupId: dupe.id, idempotent: true });
    }

    // Find the latest pending topup with this contentCode
    let topup = await prisma.topup.findFirst({
      where: { contentCode },
      orderBy: { createdAt: 'desc' }
    });
    if (!topup) return res.status(404).json({ error: 'Topup not found' });
    if (topup.status === 'COMPLETED') {
      return res.json({ ok: true, topupId: topup.id, idempotent: true });
    }
    if (topup.status !== 'PENDING') {
      return res.status(400).json({ error: `Invalid state ${topup.status}` });
    }

    const paid = Number(amountVnd) || topup.amountVnd;
    if (paid < topup.amountVnd) return res.status(400).json({ error: 'Amount not match' });

    await prisma.$transaction([
      prisma.topup.update({ where: { id: topup.id }, data: { status: 'COMPLETED', providerRef: providerRef || `BANK-${Date.now()}` } }),
      prisma.user.update({ where: { id: topup.userId }, data: { balanceVnd: { increment: paid } } }),
      prisma.activityLog.create({ data: { userId: topup.userId, action: 'TOPUP_COMPLETED', metadata: { topupId: topup.id, amountVnd: paid, providerRef: providerRef || null } } })
    ]);
    try { bus.emit('activity', { id: 0, userId: topup.userId }); } catch {}
    res.json({ ok: true, topupId: topup.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin - Recent activities
app.get('/api/admin/activity/recent', authMiddleware, adminOnly, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const items = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { id: true, username: true, email: true } } }
  });
  res.json(items);
});

// Seed minimal data on start
async function seed() {
  // admin
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({ data: { username: 'admin', email: 'admin@example.com', passwordHash, role: 'ADMIN' } });
    console.log('Seeded admin user: admin / admin123');
  }
  // services
  const defaults = [
    { name: 'Tăng Like Facebook', description: 'Like FB', rateVnd: 26 },
    { name: 'Tăng Follow Facebook', description: 'Follow FB', rateVnd: 20 },
    { name: 'Tăng Comment Facebook', description: 'Comment FB', rateVnd: 500 },
    { name: 'Tăng Share Facebook', description: 'Share FB', rateVnd: 276 },
    { name: 'Tăng Like Instagram', description: 'Like IG', rateVnd: 28 },
    { name: 'Tăng Follow Instagram', description: 'Follow IG', rateVnd: 95 },
    { name: 'Tăng Comment Instagram', description: 'Comment IG', rateVnd: 720 },
    { name: 'Tăng View Reels Instagram', description: 'View Reels IG', rateVnd: 11 },
    { name: 'Like Threads', description: 'Like Threads', rateVnd: 65 },
    { name: 'View TikTok', description: 'View TT', rateVnd: 2 }
  ];
  for (const s of defaults) {
    try {
      await prisma.service.upsert({
        where: { name: s.name },
        update: {},
        create: { name: s.name, description: s.description, rateVnd: s.rateVnd, active: true }
      });
    } catch (e) {
      // ignore per-item errors
    }
  }
  console.log('Seeded/ensured default services');
}

async function start() {
  await seed();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server đang chạy:`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log(`📱 Mobile: http://[IP-MÁY-TÍNH]:${PORT}`);
    console.log(`💡 Để truy cập từ điện thoại, sử dụng IP của máy tính + port ${PORT}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});


