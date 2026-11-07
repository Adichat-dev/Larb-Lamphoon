// Frontend: all text is inserted with textContent/createTextNode (no innerHTML) to prevent XSS.
const root = document.getElementById('root');
let user = null, last = null;
const ST = { 'Pending': ['รอดำเนินการ', 'pend', 'รับเรื่องแจ้งแล้ว'], 'In progress': ['กำลังดำเนินการ', 'prog', 'เจ้าหน้าที่รับเรื่องแล้ว'], 'Collected': ['เก็บขยะแล้ว', 'done', 'เก็บขยะเรียบร้อย'] };
const UR = { high: 'เร่งด่วนสูง', medium: 'เร่งด่วนปานกลาง', low: 'เร่งด่วนต่ำ' };
const TYPES = ['ขยะทั่วไป', 'ขยะชิ้นใหญ่', 'ขยะอันตราย', 'ขยะรีไซเคิล'];

const h = (t, a = {}, ...c) => {
  const e = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const x of c.flat(Infinity)) if (x != null && x !== false) e.append(x.nodeType ? x : document.createTextNode(x));
  return e;
};
const api = async (p, { body, json } = {}) => {
  const r = await fetch('/api' + p, {
    method: body || json ? 'POST' : 'GET', body: json ? JSON.stringify(json) : body,
    headers: { 'X-Requested-With': 'fetch', ...(json ? { 'Content-Type': 'application/json' } : {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'เกิดข้อผิดพลาด');
  return d;
};
const fmt = s => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.';
const badge = s => h('span', { class: 'badge ' + ST[s][1] }, '● ' + ST[s][0]);
const urg = u => h('span', { class: u === 'high' ? 'badge high' : u }, '● ' + UR[u]);
const field = (label, input) => h('div', {}, h('label', {}, label), input);
const sel = (name, opts) => h('select', { name }, opts.map(([v, t]) => h('option', { value: v }, t)));
const go = hash => { location.hash === '#' + hash ? render() : (location.hash = hash); };
const head = (eyebrow, title, sub) => [h('div', { class: 'eyebrow' }, eyebrow), h('h1', {}, title), h('p', { class: 'sub' }, sub)];

// ---------- shell ----------
function shell(route, ...content) {
  const nav = { citizen: [['report', 'แจ้งขยะ'], ['track', 'ติดตามเรื่อง']], officer: [['jobs', 'รายการงาน'], ['track', 'ตรวจสอบเลขติดตาม']], admin: [['dash', 'ภาพรวม'], ['track', 'ตรวจสอบเลขติดตาม']] }[user?.role] || [['track', 'ติดตามเรื่อง']];
  return [
    h('header', {}, h('div', { class: 'bar' },
      h('div', { class: 'logo' }, '♻'), h('div', { class: 'brand' }, h('b', {}, 'ชุมชนสะอาด'), h('small', {}, 'ระบบแจ้งและติดตามการเก็บขยะ')),
      h('nav', {}, nav.map(([r, t]) => h('a', { href: '#' + r, class: r === route || (r === 'jobs' && route === 'job') ? 'on' : '' }, t))),
      h('div', { class: 'who' }, user ? [user.name, h('button', { class: 'btn ghost', onclick: async () => { await api('/auth/logout', { json: {} }); user = null; go('login'); } }, 'ออกจากระบบ')]
        : h('a', { class: 'btn ghost', href: '#login' }, 'เข้าสู่ระบบ')))),
    h('main', {}, content),
    h('footer', {}, 'ข้อมูลของคุณถูกเก็บในฐานข้อมูลของระบบ โปรดไม่ใส่ข้อมูลส่วนบุคคลในรายละเอียดเรื่อง'),
  ];
}

// ---------- auth ----------
function authView(mode) {
  const signup = mode === 'signup', err = h('div', { class: 'err', role: 'alert' });
  const pw = h('input', { type: 'password', name: 'password', required: true, maxlength: 72, autocomplete: signup ? 'new-password' : 'current-password', placeholder: signup ? 'ตั้งรหัสผ่าน' : 'รหัสผ่านของคุณ' });
  const eye = h('button', { type: 'button', 'aria-label': 'แสดงหรือซ่อนรหัสผ่าน', onclick: () => { const s = pw.type === 'password'; pw.type = s ? 'text' : 'password'; eye.textContent = s ? 'ซ่อน' : 'แสดง'; } }, 'แสดง');
  const terms = h('input', { type: 'checkbox', id: 'terms' });
  const submit = h('button', { class: 'btn full', type: 'submit' }, signup ? 'สร้างบัญชี →' : 'เข้าสู่ระบบ →');
  const form = h('form', { novalidate: true, onsubmit: async e => {
      e.preventDefault(); err.textContent = '';
      const f = Object.fromEntries(new FormData(form));
      if (signup && (!f.name || f.name.trim().length < 2)) return (err.textContent = 'กรุณากรอกชื่อ-นามสกุล');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email || '')) return (err.textContent = 'รูปแบบอีเมลไม่ถูกต้อง');
      if (signup && (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) return (err.textContent = 'รหัสผ่านต้องยาว 8+ ตัว มีทั้งตัวอักษรและตัวเลข');
      if (signup && !terms.checked) return (err.textContent = 'กรุณายอมรับเงื่อนไขการใช้งาน');
      submit.disabled = true;
      try { user = await api(signup ? '/auth/signup' : '/auth/login', { json: { name: f.name, email: f.email, password: f.password } }); go(''); }
      catch (x) { err.textContent = x.message; } finally { submit.disabled = false; }
    } },
    signup && field('ชื่อ-นามสกุล', h('input', { name: 'name', required: true, maxlength: 80, autocomplete: 'name', placeholder: 'ชื่อของคุณ' })),
    field('อีเมล', h('input', { name: 'email', type: 'email', required: true, maxlength: 120, autocomplete: 'email', placeholder: 'you@example.com' })),
    h('label', {}, 'รหัสผ่าน'), h('div', { class: 'pw' }, pw, eye),
    signup && h('div', { class: 'hint' }, 'อย่างน้อย 8 ตัวอักษร ต้องมีตัวอักษรและตัวเลข'),
    signup && [h('label', {}, 'ประเภทบัญชี'),
      h('div', { class: 'seg' }, h('button', { type: 'button', 'aria-pressed': 'true' }, 'ประชาชน'),
        h('button', { type: 'button', disabled: true, title: 'สร้างโดยผู้ดูแลระบบเท่านั้น' }, 'เจ้าหน้าที่'),
        h('button', { type: 'button', disabled: true, title: 'สร้างโดยผู้ดูแลระบบเท่านั้น' }, 'ผู้ดูแล')),
      h('div', { class: 'hint' }, 'บัญชีเจ้าหน้าที่และผู้ดูแลสร้างโดยผู้ดูแลระบบเท่านั้น เพื่อความปลอดภัย')],
    signup && h('label', { class: 'check', for: 'terms' }, terms, h('span', {}, 'ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว')),
    err, submit);
  return h('div', { class: 'auth-page' },
    h('div', { class: 'auth-top' }, h('div', { class: 'brand' }, h('b', {}, 'ชุมชนสะอาด')),
      h('span', {}, signup ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? ', h('a', { href: signup ? '#login' : '#signup' }, signup ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'))),
    h('div', { class: 'auth' }, h('h1', {}, signup ? 'ยินดีต้อนรับสู่ชุมชน' : 'ยินดีต้อนรับกลับ'),
      h('p', { class: 'sub' }, signup ? 'สร้างบัญชีเพื่อแจ้งและติดตามเรื่องขยะในชุมชน' : 'เข้าสู่ระบบ (ประชาชน / เจ้าหน้าที่ / ผู้ดูแล ใช้หน้านี้เหมือนกัน)'),
      h('button', { type: 'button', class: 'btn google', disabled: true, title: 'ยังไม่เปิดใช้งาน' }, 'G  ดำเนินการต่อด้วย Google'),
      h('div', { class: 'or' }, 'หรือใช้อีเมล'), form,
      h('p', { class: 'hint' }, h('a', { href: '#track' }, 'ติดตามเรื่องด้วยหมายเลขโดยไม่ต้องเข้าสู่ระบบ'))));
}

// ---------- citizen ----------
function reportView() {
  const err = h('div', { class: 'err', role: 'alert' }), gps = h('div', { class: 'hint' }, 'ระบุจุดสังเกตเพิ่มเติมได้ หากไม่ใช้ตำแหน่งปัจจุบัน ให้กรอกสถานที่ด้วยตนเอง');
  const lat = h('input', { type: 'hidden', name: 'lat' }), lng = h('input', { type: 'hidden', name: 'lng' });
  const form = h('form', { novalidate: true, onsubmit: async e => {
      e.preventDefault(); err.textContent = '';
      const fd = new FormData(form), f = Object.fromEntries(fd), file = fd.get('photo');
      if (!f.description.trim() || !f.location.trim()) return (err.textContent = 'กรุณากรอกรายละเอียดและสถานที่ที่พบขยะ');
      if (file && file.size && (file.size > 5e6 || !/^image\/(jpeg|png|webp)$/.test(file.type))) return (err.textContent = 'รองรับเฉพาะรูป JPG/PNG/WebP ไม่เกิน 5 MB');
      if (!file.size) fd.delete('photo');
      try { const r = await api('/reports', { body: fd }); last = { ...r, f, at: new Date().toISOString().replace('T', ' ') }; go('done'); } catch (x) { err.textContent = x.message; }
    } },
    h('div', { class: 'two' }, field('ประเภทขยะ *', sel('waste_type', TYPES.map(t => [t, t]))),
      field('ความเร่งด่วน *', sel('urgency', [['high', 'สูง — ส่งกลิ่น / กีดขวาง'], ['medium', 'ปานกลาง'], ['low', 'ต่ำ']]))),
    field('รายละเอียด *', h('textarea', { name: 'description', maxlength: 1000, placeholder: 'อธิบายขยะและปัญหาที่พบ' })),
    field('สถานที่พบขยะ *', h('input', { name: 'location', maxlength: 200, placeholder: 'ระบุสถานที่หรือจุดสังเกต' })),
    h('button', { type: 'button', class: 'btn ghost', onclick: () => navigator.geolocation?.getCurrentPosition(p => { lat.value = p.coords.latitude.toFixed(5); lng.value = p.coords.longitude.toFixed(5); gps.textContent = `พิกัด ${lat.value}, ${lng.value}`; }, () => (gps.textContent = 'ไม่สามารถอ่านตำแหน่งได้ กรุณากรอกสถานที่เอง')) }, '⌖ ใช้ตำแหน่งปัจจุบัน'),
    gps, lat, lng, field('รูปประกอบ (ไม่บังคับ)', h('input', { type: 'file', name: 'photo', accept: 'image/jpeg,image/png,image/webp' })),
    h('p', { class: 'hint' }, 'ไม่ต้องระบุชื่อ เบอร์โทร หรือข้อมูลส่วนบุคคล และหลีกเลี่ยงภาพที่ระบุตัวบุคคลได้'), err,
    h('button', { class: 'btn full', type: 'submit' }, '→ ส่งเรื่องแจ้งขยะ'));
  return [head('สำหรับประชาชน', 'แจ้งขยะในชุมชน', 'บอกจุดที่พบขยะ เพื่อให้เจ้าหน้าที่รับเรื่องและดำเนินการ'),
    h('div', { class: 'cols' }, h('div', { class: 'card' }, h('h3', {}, 'รายละเอียดการแจ้ง'), form),
      h('div', {}, h('div', { class: 'tint' }, h('h3', {}, 'แจ้งง่าย ติดตามได้'), h('ol', {}, h('li', {}, 'ระบุรายละเอียดและสถานที่'), h('li', {}, 'รับหมายเลขติดตามหลังส่งเรื่อง'), h('li', {}, 'ใช้หมายเลขตรวจสอบสถานะ'))),
        h('p', { class: 'tint' }, 'จะได้รับเลขรูปแบบ WS-0001 หลังส่งเรื่อง โปรดเก็บหมายเลขไว้')))];
}
function doneView() {
  if (!last) return go('report');
  return h('div', { class: 'card center' }, h('h1', {}, '✓ ส่งเรื่องเรียบร้อยแล้ว'), h('p', { class: 'sub' }, 'ระบบรับเรื่องของคุณแล้ว เจ้าหน้าที่จะตรวจสอบและดำเนินการต่อไป'),
    h('div', { class: 'tint' }, 'หมายเลขติดตามของคุณ', h('div', { class: 'big' }, last.tracking),
      h('button', { class: 'btn ghost', onclick: e => { navigator.clipboard?.writeText(last.tracking); e.target.textContent = 'คัดลอกแล้ว'; } }, 'คัดลอกหมายเลข'), h('p', {}, badge('Pending'))),
    h('p', { class: 'hint' }, 'โปรดเก็บหมายเลขนี้ไว้ ระบบไม่แสดงรายการแจ้งของประชาชนคนอื่น'),
    h('h3', {}, 'สรุปเรื่องที่แจ้ง'), h('p', {}, last.f.waste_type, ' ', urg(last.f.urgency)), h('p', {}, last.f.location),
    h('div', { class: 'two' }, h('a', { class: 'btn', href: '#track/' + last.tracking }, 'ติดตามเรื่องนี้'), h('a', { class: 'btn ghost', href: '#report' }, 'แจ้งเรื่องใหม่')));
}

// ---------- track (public, exact code only) ----------
function reportCard(r, extra) {
  const hist = Object.fromEntries(r.history.map(x => [x.status, x.changed_at]));
  const tl = h('ul', { class: 'tl' }, Object.keys(ST).map(s => h('li', { class: hist[s] ? 'ok' : '' }, h('b', {}, ST[s][0]), h('small', {}, hist[s] ? fmt(hist[s]) + ' • ' + ST[s][2] : 'ยังไม่ถึงสถานะนี้'))));
  return h('div', { class: 'card' }, h('div', { class: 'cols' },
    h('div', {}, h('h2', {}, r.tracking, ' ', badge(r.status), ' ', urg(r.urgency)), h('p', { class: 'hint' }, 'แจ้งเมื่อ ' + fmt(r.created_at)),
      h('label', {}, 'ประเภทขยะ'), h('div', {}, r.waste_type), h('label', {}, 'รายละเอียด'), h('div', {}, r.description), h('label', {}, 'สถานที่'), h('div', {}, r.location),
      r.lat != null && h('p', { class: 'hint' }, `พิกัด ${r.lat}, ${r.lng}`),
      r.photo && h('img', { class: 'photo', src: '/uploads/' + encodeURIComponent(r.photo), alt: 'รูปที่แนบมากับเรื่อง' }),
      r.after_photo && h('img', { class: 'photo', src: '/uploads/' + encodeURIComponent(r.after_photo), alt: 'รูปหลังเก็บขยะ' }), extra),
    h('div', { class: 'tint' }, h('h3', {}, 'ประวัติสถานะ'), tl)));
}
async function trackView(arg) {
  const out = h('div'), input = h('input', { value: arg || '', placeholder: 'เช่น WS-0001', maxlength: 12 });
  const search = async () => {
    out.replaceChildren(); const c = input.value.trim().toUpperCase(); if (!c) return;
    try { out.append(reportCard(await api('/track/' + encodeURIComponent(c)))); }
    catch (x) { out.append(h('div', { class: 'card center' }, h('h3', {}, 'ไม่พบเรื่อง ' + c), h('p', { class: 'hint' }, 'ตรวจสอบหมายเลขให้ตรงกับที่ได้รับ เช่น WS-0001'))); }
  };
  const box = h('div');
  if (user?.role === 'citizen') api('/notifications').then(async n => {
    const u = n.filter(x => !x.is_read); if (!u.length) return;
    box.append(h('div', { class: 'tint' }, h('b', {}, '🔔 การแจ้งเตือนใหม่'), u.map(x => h('div', {}, x.message, ' (' + fmt(x.created_at) + ')'))));
    api('/notifications/read', { json: {} });
  }).catch(() => {});
  if (arg) search();
  return [head('ติดตามเรื่อง', 'ติดตามเรื่องแจ้งขยะ', 'กรอกหมายเลขติดตามให้ตรงกับที่ได้รับ'), box, label('หมายเลขติดตาม'),
    h('div', { class: 'two' }, input, h('button', { class: 'btn', onclick: search }, '🔍 ค้นหาเรื่อง')), out];
}
const label = t => h('label', {}, t);

// ---------- officer ----------
async function jobsView() {
  const jobs = await api('/jobs'), list = h('div', { class: 'card' });
  const fs = h('select', {}, [['', 'งานเปิดทั้งหมด'], ['Pending', 'รอดำเนินการ'], ['In progress', 'กำลังดำเนินการ']].map(([v, t]) => h('option', { value: v }, t)));
  const fu = h('select', {}, [['', 'ทุกระดับ'], ['high', 'สูง'], ['medium', 'ปานกลาง'], ['low', 'ต่ำ']].map(([v, t]) => h('option', { value: v }, t)));
  const ft = h('select', {}, [['', 'ทุกประเภท'], ...TYPES.map(t => [t, t])].map(([v, t]) => h('option', { value: v }, t)));
  const draw = () => {
    const rows = jobs.filter(j => (!fs.value || j.status === fs.value) && (!fu.value || j.urgency === fu.value) && (!ft.value || j.waste_type === ft.value));
    list.replaceChildren(h('h3', {}, `งานเปิด ${rows.length} เรื่อง`), !rows.length && h('p', { class: 'sub' }, 'ไม่มีงานที่ต้องดำเนินการ'),
      rows.map(j => h('div', { class: 'row' }, h('div', {}, h('b', {}, j.tracking), h('div', {}, urg(j.urgency))),
        h('div', {}, h('b', {}, j.location), h('div', { class: 'hint' }, j.waste_type + ' • ' + fmt(j.created_at))), badge(j.status),
        h('div', { class: 'acts' }, h('a', { class: 'btn ghost', href: '#job/' + j.tracking }, 'ดูรายละเอียด'),
          j.status === 'Pending' && h('button', { class: 'btn', onclick: async () => { await api(`/jobs/${j.id}/status`, { json: { status: 'In progress' } }); render(); } }, 'รับเรื่อง')))));
  };
  [fs, fu, ft].forEach(s => s.addEventListener('change', draw)); draw();
  const n = s => jobs.filter(j => j.status === s).length;
  return [...head('สำหรับเจ้าหน้าที่เก็บขยะ', 'รายการงานที่ต้องดำเนินการ', 'แสดงเฉพาะเรื่องรอดำเนินการและกำลังดำเนินการ'),
    h('div', { class: 'stats' }, [['งานเปิดทั้งหมด', jobs.length], ['รอดำเนินการ', n('Pending')], ['กำลังดำเนินการ', n('In progress')]].map(([t, v]) => h('div', { class: 'card' }, h('strong', {}, v), t))),
    h('div', { class: 'stats' }, field('สถานะ', fs), field('ความเร่งด่วน', fu), field('ประเภทขยะ', ft)), list];
}
async function jobView(code) {
  const r = await api('/track/' + encodeURIComponent(code)), id = parseInt(code.slice(3), 10), err = h('div', { class: 'err' });
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
  const act = async (status, fd) => { try { fd.append('status', status); await api(`/jobs/${id}/status`, { body: fd }); render(); } catch (x) { err.textContent = x.message; } };
  const panel = h('div', { class: 'card' }, h('h3', {}, 'อัปเดตงาน'),
    r.status === 'Pending' ? [h('p', {}, 'รับเรื่องเพื่อเริ่มดำเนินการ'), h('button', { class: 'btn full', onclick: () => act('In progress', new FormData()) }, 'รับเรื่อง')]
      : r.status === 'In progress' ? [h('p', {}, 'เมื่อเก็บขยะเรียบร้อยแล้ว ยืนยันเพื่อเปลี่ยนสถานะ'), label('รูปหลังเก็บขยะ (ไม่บังคับ)'), file,
        h('button', { class: 'btn full', onclick: () => { const fd = new FormData(); if (file.files[0]) fd.append('after_photo', file.files[0]); act('Collected', fd); } }, '✓ ยืนยันเก็บขยะแล้ว')]
      : h('p', {}, 'งานนี้เก็บเรียบร้อยแล้ว'), err);
  return [h('a', { href: '#jobs' }, '← กลับรายการงาน'), ...head('สำหรับเจ้าหน้าที่เก็บขยะ', 'รายละเอียดงาน ' + r.tracking, 'ตรวจสอบข้อมูลและอัปเดตสถานะเมื่อเก็บขยะเสร็จ'), reportCard(r, panel)];
}

// ---------- admin ----------
async function dashView() {
  const [d, rows] = await Promise.all([api('/dashboard'), api('/admin/reports')]), n = s => d.byStatus.find(x => x.status === s)?.c || 0;
  const COL = { 'Pending': '#8a5a12', 'In progress': '#2f6078', 'Collected': '#245f46' };
  return [h('div', { class: 'two' }, h('div', {}, head('สำหรับผู้ดูแลเทศบาล', 'ภาพรวมการแจ้งขยะ', 'รวมทุกเรื่องในระบบ')), h('div', {}, h('a', { class: 'btn', href: '/api/export.csv' }, '⬇ ส่งออก CSV'))),
    h('div', { class: 'stats' }, [['เรื่องทั้งหมด', d.total], ...Object.keys(ST).map(s => [ST[s][0], n(s)])].map(([t, v]) => h('div', { class: 'card' }, t, h('div', {}, h('strong', {}, v), 'เรื่อง')))),
    h('div', { class: 'two' }, h('div', { class: 'card' }, h('h3', {}, 'สัดส่วนสถานะ'), h('div', { class: 'bar2' }, Object.keys(ST).map(s => { const i = h('i', { title: ST[s][0] }); i.style.flex = n(s); i.style.background = COL[s]; return i; })),
        Object.keys(ST).map(s => h('p', {}, ST[s][0] + ' ' + n(s) + ' จาก ' + d.total + ' เรื่อง'))),
      h('div', { class: 'card' }, h('h3', {}, 'พื้นที่ที่มีการแจ้งซ้ำ'), !d.repeated.length && h('p', { class: 'sub' }, 'ยังไม่มีพื้นที่ที่ถูกแจ้งซ้ำ'),
        d.repeated.map(x => h('div', { class: 'row' }, h('b', {}, x.location), h('span'), h('b', {}, x.c + ' เรื่อง'))))),
    h('div', { class: 'card tw' }, h('h3', {}, 'รายงานทั้งหมด'), h('table', {}, h('thead', {}, h('tr', {}, ['หมายเลข', 'พื้นที่', 'ประเภท', 'เร่งด่วน', 'รายละเอียด', 'สถานะ', 'เวลาที่แจ้ง'].map(t => h('th', {}, t)))),
      h('tbody', {}, rows.map(r => h('tr', {}, h('td', {}, h('a', { href: '#track/' + r.tracking }, r.tracking)), h('td', {}, r.location), h('td', {}, r.waste_type), h('td', {}, UR[r.urgency]), h('td', {}, r.description), h('td', {}, badge(r.status)), h('td', {}, fmt(r.created_at)))))))];
}

// ---------- router ----------
async function render() {
  const [route, arg] = location.hash.slice(1).split('/');
  const home = { citizen: 'report', officer: 'jobs', admin: 'dash' }[user?.role];
  const ok = { citizen: ['report', 'done', 'track'], officer: ['jobs', 'job', 'track'], admin: ['dash', 'track'] }[user?.role] || [];
  root.replaceChildren();
  if (!user && route !== 'track') return root.append(authView(route === 'signup' ? 'signup' : 'login'));
  const r = ok.includes(route) || (!user && route === 'track') ? route : home;
  if (r !== route && home) return go(home);
  try {
    const views = { report: reportView, done: doneView, track: () => trackView(arg), jobs: jobsView, job: () => jobView(arg), dash: dashView };
    let c = await views[r]();
    root.append(...shell(r, c));
  } catch (x) { root.append(...shell(r, h('p', { class: 'err' }, x.message))); }
}
window.addEventListener('hashchange', render);
api('/me').then(u => { user = u; render(); }).catch(render);
