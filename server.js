// Community Waste Reporting System - secure backend (Express + SQLite)
// Run: npm install && SESSION_SECRET=<long-random> node server.js
// Create staff: node server.js --create-staff officer|admin email password "Name"
const express = require('express'), helmet = require('helmet'), session = require('express-session');
const rateLimit = require('express-rate-limit'), bcrypt = require('bcryptjs'), multer = require('multer');
const Database = require('better-sqlite3'), path = require('path'), fs = require('fs'), crypto = require('crypto');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'citizen' CHECK(role IN('citizen','officer','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reports(
  id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id),
  waste_type TEXT NOT NULL, urgency TEXT NOT NULL CHECK(urgency IN('low','medium','high')),
  description TEXT NOT NULL, location TEXT NOT NULL, lat REAL, lng REAL, photo TEXT, after_photo TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','In progress','Collected')),
  officer_id INTEGER REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS status_history(
  id INTEGER PRIMARY KEY, report_id INTEGER NOT NULL REFERENCES reports(id),
  status TEXT NOT NULL, changed_by INTEGER REFERENCES users(id), changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
`);

const args = process.argv.slice(2);
if (args[0] === '--create-staff') {
  const [, role, email, pw, name] = args;
  if (!['officer', 'admin'].includes(role) || !email || !pw || pw.length < 8) { console.error('usage: --create-staff officer|admin email password(>=8) "Name"'); process.exit(1); }
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name || email, email.toLowerCase(), bcrypt.hashSync(pw, 12), role);
  console.log('created', role, email); process.exit(0);
}

const prod = process.env.NODE_ENV === 'production';
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  if (prod) { console.error('Set SESSION_SECRET (>=32 chars)'); process.exit(1); }
  process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex'); // dev only: random per start (logins reset on restart)
  console.warn('[dev] SESSION_SECRET not set, using a temporary random one');
}
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:'], scriptSrc: ["'self'"], styleSrc: ["'self'", 'https://fonts.googleapis.com'], fontSrc: ['https://fonts.gstatic.com'], objectSrc: ["'none'"], frameAncestors: ["'none'"], 'upgrade-insecure-requests': prod ? [] : null } } }));
app.use(express.json({ limit: '20kb' }));
app.use(session({ name: 'sid', secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: prod, maxAge: 2 * 3600e3 } }));

// CSRF: state-changing requests must carry a custom header (cross-site forms/fetches can't set it)
app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) && req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ error: 'forbidden' });
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60e3, limit: 10, standardHeaders: true, message: { error: 'พยายามหลายครั้งเกินไป กรุณารอ 15 นาที' } });
const trackLimiter = rateLimit({ windowMs: 60e3, limit: 20, message: { error: 'ค้นหาถี่เกินไป' } });
const apiLimiter = rateLimit({ windowMs: 60e3, limit: 120 });
app.use('/api', apiLimiter);

const need = (...roles) => (req, res, next) => {
  const u = req.session.user;
  if (!u) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  if (!roles.includes(u.role)) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  next();
};
const str = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null;
const code = id => 'WS-' + String(id).padStart(4, '0');
const DUMMY = bcrypt.hashSync('dummy-password', 12);

// ---------- Auth ----------
app.post('/api/auth/signup', authLimiter, (req, res) => {
  const name = str(req.body.name, 2, 80), email = str(req.body.email, 5, 120)?.toLowerCase(), pw = req.body.password;
  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  if (typeof pw !== 'string' || pw.length < 8 || pw.length > 72 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return res.status(400).json({ error: 'รหัสผ่านต้องยาว 8+ ตัว มีทั้งตัวอักษรและตัวเลข' });
  try {
    const r = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name, email, bcrypt.hashSync(pw, 12));
    req.session.regenerate(() => { req.session.user = { id: r.lastInsertRowid, name, role: 'citizen' }; res.json(req.session.user); });
  } catch { res.status(409).json({ error: 'อีเมลนี้ถูกใช้แล้ว' }); }
});
app.post('/api/auth/login', authLimiter, (req, res) => {
  const email = str(req.body.email, 3, 120)?.toLowerCase(), pw = req.body.password;
  const u = email && db.prepare('SELECT * FROM users WHERE email=?').get(email);
  const ok = bcrypt.compareSync(typeof pw === 'string' ? pw : '', u ? u.password_hash : DUMMY); // constant-ish time
  if (!u || !ok) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  req.session.regenerate(() => { req.session.user = { id: u.id, name: u.name, role: u.role }; res.json(req.session.user); });
});
app.post('/api/auth/logout', (req, res) => req.session.destroy(() => { res.clearCookie('sid'); res.json({ ok: true }); }));
app.get('/api/me', (req, res) => res.json(req.session.user || null));

// ---------- Uploads ----------
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({ destination: path.join(__dirname, 'uploads'), filename: (r, f, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[f.mimetype]) }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (r, f, cb) => cb(null, !!EXT[f.mimetype]),
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false, dotfiles: 'deny' }));

// ---------- FR-1 / FR-2 : citizen ----------
app.post('/api/reports', need('citizen'), upload.single('photo'), (req, res) => {
  const b = req.body, type = str(b.waste_type, 1, 40), desc = str(b.description, 3, 1000), loc = str(b.location, 3, 200);
  if (!type || !desc || !loc || !['low', 'medium', 'high'].includes(b.urgency)) return res.status(400).json({ error: 'กรุณากรอกรายละเอียดและตำแหน่งให้ครบ' });
  const lat = Number(b.lat), lng = Number(b.lng), hasGps = b.lat && b.lng && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const tx = db.transaction(() => {
    const r = db.prepare('INSERT INTO reports(user_id,waste_type,urgency,description,location,lat,lng,photo) VALUES(?,?,?,?,?,?,?,?)')
      .run(req.session.user.id, type, b.urgency, desc, loc, hasGps ? lat : null, hasGps ? lng : null, req.file?.filename || null);
    db.prepare('INSERT INTO status_history(report_id,status,changed_by) VALUES(?,?,?)').run(r.lastInsertRowid, 'Pending', req.session.user.id);
    return r.lastInsertRowid;
  });
  res.status(201).json({ tracking: code(tx()) });
});
app.get('/api/my-reports', need('citizen'), (req, res) => {
  const rows = db.prepare('SELECT id,waste_type,urgency,location,status,created_at FROM reports WHERE user_id=? ORDER BY id DESC LIMIT 100').all(req.session.user.id);
  res.json(rows.map(r => ({ ...r, tracking: code(r.id) })));
});
// NFR-4: exact tracking number only; no personal data, no listing
app.get('/api/track/:code', trackLimiter, (req, res) => {
  const m = /^WS-(\d{4,8})$/.exec(req.params.code.toUpperCase());
  const r = m && db.prepare('SELECT id,waste_type,urgency,description,location,lat,lng,photo,after_photo,status,created_at FROM reports WHERE id=?').get(Number(m[1]));
  if (!r) return res.status(404).json({ error: 'ไม่พบหมายเลขติดตามนี้' });
  const history = db.prepare('SELECT status,changed_at FROM status_history WHERE report_id=? ORDER BY id').all(r.id);
  res.json({ ...r, tracking: code(r.id), id: undefined, history });
});
app.get('/api/notifications', need('citizen'), (req, res) => {
  res.json(db.prepare('SELECT id,message,is_read,created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50').all(req.session.user.id));
});
app.post('/api/notifications/read', need('citizen'), (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.session.user.id); res.json({ ok: true });
});

// ---------- FR-3 / FR-4 : officer ----------
app.get('/api/jobs', need('officer', 'admin'), (req, res) => {
  const rows = db.prepare(`SELECT id,waste_type,urgency,description,location,lat,lng,photo,status,created_at FROM reports
    WHERE status IN('Pending','In progress')
    ORDER BY CASE urgency WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at ASC, id ASC`).all();
  res.json(rows.map(r => ({ ...r, tracking: code(r.id) })));
});
app.post('/api/jobs/:id/status', need('officer'), upload.single('after_photo'), (req, res) => {
  const id = Number(req.params.id), next = req.body.status;
  const r = Number.isInteger(id) && db.prepare('SELECT * FROM reports WHERE id=?').get(id);
  if (!r) return res.status(404).json({ error: 'ไม่พบงาน' });
  const allowed = { 'Pending': 'In progress', 'In progress': 'Collected' };
  if (allowed[r.status] !== next) return res.status(400).json({ error: 'เปลี่ยนสถานะไม่ถูกต้อง' });
  db.transaction(() => {
    db.prepare('UPDATE reports SET status=?, officer_id=?, after_photo=COALESCE(?,after_photo) WHERE id=?').run(next, req.session.user.id, req.file?.filename || null, id);
    db.prepare('INSERT INTO status_history(report_id,status,changed_by) VALUES(?,?,?)').run(id, next, req.session.user.id);
    if (r.user_id) db.prepare('INSERT INTO notifications(user_id,message) VALUES(?,?)').run(r.user_id, `รายงาน ${code(id)} เปลี่ยนสถานะเป็น ${next}`);
  })();
  res.json({ tracking: code(id), status: next });
});

// ---------- FR-5 : admin ----------
app.get('/api/dashboard', need('admin'), (req, res) => {
  res.json({
    total: db.prepare('SELECT COUNT(*) c FROM reports').get().c,
    byStatus: db.prepare('SELECT status, COUNT(*) c FROM reports GROUP BY status').all(),
    repeated: db.prepare('SELECT MIN(location) location, COUNT(*) c FROM reports GROUP BY lower(trim(location)) HAVING c>1 ORDER BY c DESC').all(),
  });
});
const csvCell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }; // block CSV formula injection
app.get('/api/export.csv', need('admin'), (req, res) => {
  const rows = db.prepare('SELECT id,location,waste_type,urgency,description,status,created_at FROM reports ORDER BY id').all();
  const out = ['tracking,area,waste_type,urgency,description,status,reported_at', ...rows.map(r => [code(r.id), r.location, r.waste_type, r.urgency, r.description, r.status, r.created_at].map(csvCell).join(','))];
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="reports.csv"' }).send('\ufeff' + out.join('\r\n'));
});

app.get('/api/admin/reports', need('admin'), (req, res) => {
  res.json(db.prepare('SELECT id,location,waste_type,urgency,description,status,created_at FROM reports ORDER BY id DESC LIMIT 500').all().map(r => ({ ...r, tracking: code(r.id) })));
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));
app.use((err, req, res, next) => { console.error(err.message); res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: 'เกิดข้อผิดพลาด' }); });
app.listen(process.env.PORT || 3000, () => console.log('running on :' + (process.env.PORT || 3000)));
