/* global io */
'use strict';

// Tự nhận diện môi trường: mở trang từ localhost/127.0.0.1 (test local, chạy `npm run dev`
// ở BE) thì gọi thẳng BE local (mặc định cổng 8521) thay vì server production trên Render.
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const BASE_URL = IS_LOCAL ? 'http://localhost:8521' : 'https://tool-8s0g.onrender.com';
const socket = io(BASE_URL);

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

const LOG_LINE_COLOR = { ok: 'text-green-400', fail: 'text-rose-400', info: 'text-muted', wait: 'text-amber-400' };

function logLine(box, text, cls = 'info') {
  const line = el('div', `py-[3px] border-b border-[#12161c] last:border-b-0 ${LOG_LINE_COLOR[cls] || ''}`);
  const t = new Date().toLocaleTimeString('vi-VN');
  line.textContent = `[${t}] ${text}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

async function api(url, opts) {
  const res = await fetch(BASE_URL + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
}

// ---------- Connection pill ----------
const PILL_BASE = 'pill inline-flex items-center gap-[7px] px-2.5 py-1.5 rounded-full text-xs font-semibold border';
const PILL_VARIANT = {
  on: `${PILL_BASE} bg-green-500/10 border-green-500/25 text-green-300`,
  wait: `${PILL_BASE} bg-amber-500/10 border-amber-500/25 text-amber-300`,
  off: `${PILL_BASE} bg-rose-500/10 border-rose-500/25 text-rose-300`,
};
const DOT_BASE = 'dot w-[7px] h-[7px] rounded-full shrink-0';
const DOT_VARIANT = {
  on: `${DOT_BASE} bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,.18)]`,
  wait: `${DOT_BASE} bg-amber-500 animate-pulse`,
  off: `${DOT_BASE} bg-rose-500`,
};

function setPill(state) {
  const pill = $('#connPill');
  const dot = pill.querySelector('.dot');
  const txt = $('#connText');
  const key = state === 'on' || state === 'wait' ? state : 'off';
  pill.className = PILL_VARIANT[key];
  dot.className = DOT_VARIANT[key];
  txt.textContent = key === 'on' ? 'Đã đăng nhập' : key === 'wait' ? 'Đang chờ quét QR' : 'Chưa đăng nhập';
}

function setAccountInfo(status) {
  const el = $('#accountName');
  if (!el) return;
  el.textContent = status?.loggedIn ? (status.displayName || status.userId || '(không rõ)') : '—';
}

function showView(logged) {
  $('#loginView').hidden = logged;
  $('#dashView').hidden = !logged;
  if (logged) {
    loadCustomers();
    if (typeof checkCampaigns === 'function') checkCampaigns();
  }
}

// ---------- Login flow ----------
let qrReady = false;

function setQrBox(html) {
  $('#qrBox').innerHTML = html;
}

const QR_PLACEHOLDER_CLS = 'text-slate-500 text-[13px] px-4 text-center flex flex-col items-center gap-3';
const QR_PLACEHOLDER_FAIL_CLS = 'text-rose-500 text-[13px] px-4 text-center flex flex-col items-center gap-3';
const SPINNER_HTML = '<span class="w-6 h-6 rounded-full border-[3px] border-slate-300 border-t-indigo-500 animate-spin"></span>';
function qrPlaceholder(html, fail = false) {
  return `<div class="${fail ? QR_PLACEHOLDER_FAIL_CLS : QR_PLACEHOLDER_CLS}">${html}</div>`;
}

$('#btnLogin').onclick = () => {
  qrReady = false;
  $('#btnLogin').disabled = true;
  $('#btnCancel').hidden = false;
  $('#loginLog').innerHTML = '';
  setQrBox(qrPlaceholder(`${SPINNER_HTML}Đang khởi tạo phiên đăng nhập...`));
  socket.emit('login:start');
};

$('#btnLogout').onclick = async () => {
  if (!confirm('Đăng xuất tài khoản Zalo đang dùng? Cần quét QR lại để dùng tiếp.')) return;
  $('#btnLogout').disabled = true;
  try {
    const r = await api('/api/v1/zalosend/zalo/logout', { method: 'POST' });
    if (r.success === false) throw new Error(r.message || r.error || 'Lỗi không xác định');
    setPill('off');
    setAccountInfo({ loggedIn: false });
    setQrBox(qrPlaceholder('Mã QR sẽ hiện ở đây'));
    showView(false);
  } catch (err) {
    alert('Không đăng xuất được: ' + err.message);
  } finally {
    $('#btnLogout').disabled = false;
  }
};

$('#btnCancel').onclick = () => {
  socket.emit('login:cancel');
  $('#btnLogin').disabled = false;
  $('#btnCancel').hidden = true;
  setQrBox(qrPlaceholder('Mã QR sẽ hiện ở đây'));
};

socket.on('login:status', (s) => {
  setPill(s.loggedIn ? 'on' : 'off');
  setAccountInfo(s);
  showView(s.loggedIn);
});

socket.on('login:qr', ({ qr }) => {
  qrReady = true;
  setPill('wait');
  setQrBox(`<img src="${qr}" alt="QR đăng nhập Zalo" />`);
});

socket.on('login:log', ({ message }) => {
  logLine($('#loginLog'), message, 'info');
  // Trong lúc chưa có QR, phản chiếu trạng thái mới nhất ngay trong khung QR
  // để người dùng thấy đang xử lý chứ không phải bị treo im lặng.
  if (!qrReady) {
    setQrBox(qrPlaceholder(`${SPINNER_HTML}${escapeHtml(message)}`));
  }
});

socket.on('login:done', (status) => {
  $('#btnLogin').disabled = false;
  $('#btnCancel').hidden = true;
  if (status.loggedIn) {
    setPill('on');
    setAccountInfo(status);
    logLine($('#loginLog'), 'Đăng nhập thành công!', 'ok');
    showView(true);
  } else {
    setPill('off');
    setQrBox(qrPlaceholder('❌ Chưa đăng nhập được. Vui lòng thử lại.', true));
    logLine($('#loginLog'), 'Chưa đăng nhập được.', 'fail');
  }
});

socket.on('login:error', ({ message }) => {
  $('#btnLogin').disabled = false;
  $('#btnCancel').hidden = true;
  setPill('off');
  setQrBox(qrPlaceholder(`❌ Lỗi: ${escapeHtml(message)}<br />Vui lòng bấm "Đăng nhập Zalo" để thử lại.`, true));
  logLine($('#loginLog'), 'Lỗi: ' + message, 'fail');
});

// ---------- Customers ----------
let customers = [];
let activeTagFilter = null; // nhãn đang lọc trong sidebar (null = hiện tất cả)

// Khách hàng nằm trong IndexedDB của trình duyệt — server không lưu.
function loadCustomers() {
  customers = ZsDb.customers.list();
  renderCustomers();
}

function renderCustomers() {
  const list = $('#customerList');
  list.innerHTML = '';
  customers.forEach((c) => {
    const li = el('li', 'group flex items-center gap-2.5 px-2 py-2.5 rounded-[10px] hover:bg-panel2 transition');
    li.dataset.tag = c.tag || '';
    const initial = escapeHtml((c.name || '?').trim().charAt(0).toUpperCase() || '?');
    li.innerHTML = `
      <input type="checkbox" class="pick w-auto accent-indigo-500" data-id="${c.id}" />
      <div class="w-[30px] h-[30px] rounded-full shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[12.5px] font-bold">${initial}</div>
      <div class="ci-main flex-1 min-w-0">
        <div class="font-semibold text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(c.name)}</div>
        <div class="text-[11.5px] text-muted mt-px whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(c.threadId)}</div>
      </div>
      ${c.isGroup ? '<span class="text-[10.5px] bg-indigo-500/[.14] border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">Nhóm</span>' : ''}
      ${c.tag ? `<span class="text-[10.5px] bg-amber-500/[.12] border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-semibold">${escapeHtml(c.tag)}</span>` : ''}
      ${c.isGroup ? '' : genderBtnHtml(c)}
      ${renewBtnHtml(c)}
      <button class="row-action del h-6 w-0 shrink-0 overflow-hidden rounded-[7px] border-none bg-transparent text-muted2 opacity-0 transition group-hover:w-6 group-hover:opacity-100 hover:bg-rose-500/[.12] hover:text-rose-400" data-id="${c.id}" title="Xoá">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>`;
    list.appendChild(li);
  });
  $('#custCount').textContent = `${customers.length} khách`;

  // dropdown xuất hội thoại
  const expSel = $('#exportTarget');
  expSel.innerHTML = '<option value="">— Nhập threadId thủ công bên dưới —</option>' + customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.threadId)}${c.isGroup ? ' (nhóm)' : ''}</option>`)
    .join('');

  list.querySelectorAll('.del').forEach((b) => {
    b.onclick = async () => {
      await ZsDb.customers.remove(b.dataset.id);
      loadCustomers();
    };
  });

  list.querySelectorAll('.renew-btn').forEach((b) => {
    b.onclick = () => openRenew(b.dataset.id);
  });

  list.querySelectorAll('.gender-btn').forEach((b) => {
    b.onclick = async () => {
      const cur = customers.find((c) => c.id === b.dataset.id);
      if (!cur) return;
      const next = GENDER_ORDER[(GENDER_ORDER.indexOf(cur.gender || '') + 1) % GENDER_ORDER.length];
      await ZsDb.customers.update(cur.id, { gender: next });
      loadCustomers();
    };
  });

  // Bấm vào tên khách => chọn làm người nhận ở tab "Gửi đơn lẻ"
  list.querySelectorAll('.ci-main').forEach((m) => {
    m.style.cursor = 'pointer';
    m.onclick = () => {
      const id = m.closest('li').querySelector('.pick').dataset.id;
      showTab('single');
      selectSingle(id);
      $('#singleContent').focus();
    };
  });

  syncSinglePicker();
  updateBcPickedCount();
  renderBcChooser();

  renderTagFilters();
  applyTagFilter();
}

const GENDER_ORDER = ['', 'male', 'female'];
const GENDER_LABEL = { '': 'Anh/Chị', male: 'Anh', female: 'Chị' };
function genderBtnHtml(c) {
  const g = c.gender || '';
  const cls = g === 'male' ? 'bg-sky-500/[.14] border-sky-500/30 text-sky-300'
    : g === 'female' ? 'bg-pink-500/[.14] border-pink-500/30 text-pink-300'
    : 'bg-panel3 border-line text-muted2';
  return `<button type="button" class="gender-btn shrink-0 text-[10.5px] px-2 py-0.5 rounded-full font-semibold border transition ${cls}" data-id="${c.id}" title="Xưng hô khi gửi tin — bấm để đổi (Anh/Chị → Anh → Chị)">${GENDER_LABEL[g]}</button>`;
}

function renewBtnHtml(c) {
  const r = getRenewal(c.id);
  const dl = r ? daysLeftFrom(r.date) : null;
  let visibilityCls = 'w-0 opacity-0 group-hover:w-6 group-hover:opacity-100';
  let colorCls = 'text-muted2 hover:text-indigo-300 hover:bg-indigo-500/[.14]';
  let title = 'Thiết lập gia hạn (domain/hosting...)';
  if (dl !== null) {
    if (dl <= 7) { visibilityCls = 'w-6 opacity-100'; colorCls = 'text-rose-400 hover:text-indigo-300 hover:bg-indigo-500/[.14]'; }
    else if (dl <= 30) { visibilityCls = 'w-6 opacity-100'; colorCls = 'text-amber-400 hover:text-indigo-300 hover:bg-indigo-500/[.14]'; }
    title = `${r.item} — còn ${dl} ngày (${new Date(r.date + 'T00:00:00').toLocaleDateString('vi-VN')})`;
  }
  return `<button class="row-action renew-btn h-6 shrink-0 overflow-hidden rounded-[7px] border-none bg-transparent transition ${visibilityCls} ${colorCls}" data-id="${c.id}" title="${escapeHtml(title)}">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  </button>`;
}

// ---------- Tag nhóm: lọc sidebar + chọn nhanh khi gửi hàng loạt ----------
function uniqueTagCounts() {
  const map = new Map();
  customers.forEach((c) => {
    if (!c.tag) return;
    map.set(c.tag, (map.get(c.tag) || 0) + 1);
  });
  return [...map.entries()]; // [[tag, count], ...]
}

const TAG_CHIP_BASE = 'tag-chip inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full text-[11.5px] font-semibold border transition';
const TAG_CHIP_OFF = `${TAG_CHIP_BASE} bg-panel2 border-line text-muted hover:border-[#3a4353] hover:text-ink`;
const TAG_CHIP_ON = `${TAG_CHIP_BASE} bg-indigo-500/[.14] border-indigo-500/35 text-indigo-300`;
function tagChipHtml(tag, count, active) {
  return `<button type="button" class="${active ? TAG_CHIP_ON : TAG_CHIP_OFF}" data-tag="${escapeHtml(tag)}">
    ${escapeHtml(tag)} <span class="opacity-70 font-medium">${count}</span>
  </button>`;
}

function renderTagFilters() {
  const tags = uniqueTagCounts();
  const box = $('#tagFilters');
  if (!tags.length) {
    box.hidden = true;
    box.innerHTML = '';
  } else {
    box.hidden = false;
    box.innerHTML = tags.map(([tag, count]) => tagChipHtml(tag, count, tag === activeTagFilter)).join('');
    box.querySelectorAll('.tag-chip').forEach((chip) => {
      chip.onclick = () => {
        activeTagFilter = activeTagFilter === chip.dataset.tag ? null : chip.dataset.tag;
        renderTagFilters();
        applyTagFilter();
      };
    });
  }
}

function applyTagFilter() {
  const rows = $('#customerList').querySelectorAll('li');
  rows.forEach((li) => {
    li.hidden = !!(activeTagFilter && li.dataset.tag !== activeTagFilter);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

$('#customerForm').onsubmit = async (e) => {
  e.preventDefault();
  const body = {
    name: $('#cName').value,
    threadId: $('#cThread').value,
    tag: $('#cTag').value,
    gender: $('#cGender').value,
  };
  try {
    await ZsDb.customers.add(body);
  } catch (err) {
    return alert(err.message);
  }
  $('#cName').value = $('#cThread').value = $('#cTag').value = '';
  $('#cGender').value = '';
  loadCustomers();
};

$('#selectAll').onchange = (e) => {
  // Chỉ chọn các dòng đang hiển thị (tôn trọng bộ lọc nhãn đang bật)
  document.querySelectorAll('#customerList li:not([hidden]) .pick').forEach((c) => (c.checked = e.target.checked));
};

function selectedIds() {
  return [...document.querySelectorAll('.pick:checked')].map((c) => c.dataset.id);
}

// ---------- Tabs ----------
const TAB_BASE = 'tab px-3.5 py-[7px] text-[13px] font-semibold rounded-lg transition';
const TAB_ACTIVE = `${TAB_BASE} text-white bg-indigo-500 shadow-sm`;
const TAB_INACTIVE = `${TAB_BASE} text-muted hover:text-ink`;
function setActiveTab(tabs, active) {
  tabs.forEach((x) => { x.className = x === active ? TAB_ACTIVE : TAB_INACTIVE; });
}

function showTab(name) {
  const tabs = document.querySelectorAll('.chat__tabs > .tab');
  setActiveTab(tabs, [...tabs].find((t) => t.dataset.tab === name));
  ['single', 'broadcast', 'campaign', 'export'].forEach((n) => { $('#tab-' + n).hidden = n !== name; });
  if (name === 'campaign') renderCampaigns();
  if (name === 'broadcast') renderBcChooser();
}
document.querySelectorAll('.chat__tabs > .tab').forEach((t) => {
  t.onclick = () => showTab(t.dataset.tab);
});

// ---------- Xem trước / Spintax phía client ----------
function spinClient(text) {
  const re = /\{([^{}|]*\|[^{}]*)\}/;
  let out = text, guard = 0;
  while (re.test(out) && guard++ < 500) {
    out = out.replace(re, (_, body) => { const o = body.split('|'); return o[Math.floor(Math.random() * o.length)]; });
  }
  return out;
}
function renderMessagePreview(template, cust, perLine = false) {
  const named = pickVariant(template, perLine).replace(/\[Tên\]|\{\{\s*name\s*\}\}/gi, cust.name);
  return spinClient(applyClientVars(named, cust));
}
const fmtCount = (n) => `${n} ký tự`;

// ---------- Gửi đơn lẻ: chọn người nhận (tìm kiếm + bàn phím) ----------
let singleActive = 0;      // dòng đang được highlight trong dropdown
let singleShown = [];      // danh sách đang hiển thị

function singleMatches() {
  const q = $('#singleSearch').value.trim().toLowerCase();
  return customers
    .filter((c) => !q || `${c.name} ${c.threadId} ${c.tag || ''}`.toLowerCase().includes(q))
    .slice(0, 50);
}

function renderSingleOptions() {
  const box = $('#singleOptions');
  singleShown = singleMatches();
  singleActive = Math.min(singleActive, Math.max(0, singleShown.length - 1));
  if (!singleShown.length) {
    box.innerHTML = `<li class="px-3 py-3 text-[13px] text-muted">${customers.length ? 'Không tìm thấy khách phù hợp.' : 'Chưa có khách hàng — thêm hoặc Import từ Zalo ở cột bên trái.'}</li>`;
    return;
  }
  box.innerHTML = singleShown.map((c, i) => `
    <li data-id="${c.id}" class="opt flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer ${i === singleActive ? 'bg-indigo-500/[.16]' : 'hover:bg-panel2'}">
      <div class="w-[28px] h-[28px] rounded-full shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[12px] font-bold">${escapeHtml((c.name || '?').trim().charAt(0).toUpperCase() || '?')}</div>
      <div class="min-w-0 flex-1">
        <div class="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(c.name)}</div>
        <div class="text-[11.5px] text-muted whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(c.threadId)}</div>
      </div>
      ${c.isGroup ? '<span class="text-[10.5px] bg-indigo-500/[.14] border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">Nhóm</span>' : ''}
      ${c.tag ? `<span class="text-[10.5px] bg-amber-500/[.12] border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-semibold">${escapeHtml(c.tag)}</span>` : ''}
    </li>`).join('');
  box.querySelectorAll('.opt').forEach((li) => {
    // mousedown (không phải click) để chạy trước sự kiện blur của ô tìm kiếm
    li.onmousedown = (e) => { e.preventDefault(); selectSingle(li.dataset.id); };
  });
  box.querySelector('.opt.bg-indigo-500\\/\\[\\.16\\]')?.scrollIntoView({ block: 'nearest' });
}

function openSingleOptions() { $('#singleOptions').hidden = false; renderSingleOptions(); }
function closeSingleOptions() { $('#singleOptions').hidden = true; }

function selectedSingleCustomer() {
  return customers.find((c) => c.id === $('#singleTarget').value) || null;
}

function selectSingle(id) {
  const c = customers.find((x) => x.id === id);
  $('#singleTarget').value = c ? c.id : '';
  const sel = $('#singleSelected');
  if (!c) {
    sel.hidden = true;
    $('#singleSearchWrap').hidden = false;
    $('#mentionRow').hidden = true;
    updateSinglePreview();
    return;
  }
  sel.hidden = false;
  $('#singleSearchWrap').hidden = true;
  closeSingleOptions();
  sel.innerHTML = `
    <div class="w-[34px] h-[34px] rounded-full shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[13px] font-bold">${escapeHtml((c.name || '?').trim().charAt(0).toUpperCase() || '?')}</div>
    <div class="min-w-0 flex-1">
      <div class="text-[13.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(c.name)}</div>
      <div class="text-[11.5px] text-muted">${escapeHtml(c.threadId)}${c.isGroup ? ' · Nhóm' : ''}${c.tag ? ' · ' + escapeHtml(c.tag) : ''}</div>
    </div>
    <button type="button" id="singleChange" class="text-[12px] font-semibold text-indigo-300 hover:text-indigo-200">Đổi người</button>`;
  $('#singleChange').onclick = () => {
    selectSingle('');
    $('#singleSearch').value = '';
    $('#singleSearch').focus();
  };
  $('#mentionRow').hidden = !c.isGroup;
  updateSinglePreview();
}

// Giữ lựa chọn hợp lệ khi danh sách khách thay đổi (xoá/import...).
function syncSinglePicker() {
  const cur = $('#singleTarget').value;
  if (cur && !customers.some((c) => c.id === cur)) selectSingle('');
  if (!$('#singleOptions').hidden) renderSingleOptions();
}

$('#singleSearch').onfocus = () => { singleActive = 0; openSingleOptions(); };
$('#singleSearch').onblur = closeSingleOptions;
$('#singleSearch').oninput = () => { singleActive = 0; openSingleOptions(); };
$('#singleSearch').onkeydown = (e) => {
  if ($('#singleOptions').hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) openSingleOptions();
  if (e.key === 'ArrowDown') { e.preventDefault(); singleActive = Math.min(singleShown.length - 1, singleActive + 1); renderSingleOptions(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); singleActive = Math.max(0, singleActive - 1); renderSingleOptions(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (singleShown[singleActive]) { selectSingle(singleShown[singleActive].id); $('#singleContent').focus(); } }
  else if (e.key === 'Escape') { closeSingleOptions(); }
};

function updateSinglePreview() {
  const raw = $('#singleContent').value;
  $('#singleCount').textContent = fmtCount(raw.length);
  const cust = selectedSingleCustomer();
  const box = $('#singlePreviewBox');
  if (!cust || !raw.trim()) { box.hidden = true; return; }
  box.hidden = false;
  $('#singlePreview').textContent = renderMessagePreview(raw, cust, $('#singlePerLine').checked);
}
$('#singleContent').addEventListener('input', updateSinglePreview);
$('#singlePerLine').addEventListener('change', updateSinglePreview);
$('#singleReroll').onclick = updateSinglePreview;
document.querySelectorAll('.var-chips .chip-var').forEach((c) => c.addEventListener('click', () => setTimeout(() => { updateSinglePreview(); updateBcPreview(); }, 0)));

$('#singleContent').addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('#btnSendSingle').click(); }
});

$('#btnSendSingle').onclick = async () => {
  const cust = selectedSingleCustomer();
  if (!cust) { $('#singleSearch').focus(); return alert('Chọn người nhận trước.'); }
  const raw = $('#singleContent').value.trim();
  if (!raw) { $('#singleContent').focus(); return alert('Nhập nội dung.'); }
  const content = composeFor(raw, $('#singlePerLine').checked, cust);

  const box = $('#singleResult');
  logLine(box, `Đang gửi tới ${cust.name}...`, 'info');
  $('#btnSendSingle').disabled = true;

  try {
    const r = await api('/api/v1/zalosend/send', {
      method: 'POST',
      body: JSON.stringify({ threadId: cust.threadId, content, name: cust.name, group: !!cust.isGroup }),
    });
    if (r.ok) {
      logLine(box, `✅ Đã gửi tới ${cust.name}: "${r.text}"`, 'ok');
      $('#singleContent').value = '';   // gửi xong xoá ô soạn để tránh gửi trùng
      updateSinglePreview();
    } else {
      logLine(box, `❌ Lỗi: ${r.message || r.error}`, 'fail');   // giữ nội dung để thử lại
    }
  } catch (err) {
    logLine(box, `❌ Lỗi: ${err.message}`, 'fail');
  } finally {
    $('#btnSendSingle').disabled = false;
  }
};

// ---------- Tag (@mention) thành viên khi gửi vào nhóm ----------
const mentionModal = $('#mentionModal');
const groupMembersCache = new Map(); // groupId -> members[]
let mentionMembers = [];
const mentionPicked = new Set();

async function openMention() {
  const cust = selectedSingleCustomer();
  if (!cust || !cust.isGroup) return;
  mentionPicked.clear();
  $('#mentionSearch').value = '';
  $('#mentionSelectAll').checked = false;
  $('#mentionTitle').textContent = `Tag thành viên — ${cust.name}`;
  mentionModal.hidden = false;
  const list = $('#mentionList');
  if (!groupMembersCache.has(cust.threadId)) {
    list.innerHTML = `<div class="${IMPORT_EMPTY_CLS}">Đang tải thành viên nhóm...</div>`;
    try {
      const data = await api(`/api/v1/zalosend/zalo/groups/${encodeURIComponent(cust.threadId)}/members`);
      if (data.error || !Array.isArray(data)) throw new Error(data.message || data.error || 'không tải được');
      groupMembersCache.set(cust.threadId, data);
    } catch (err) {
      list.innerHTML = `<div class="${IMPORT_EMPTY_CLS}">Lỗi: ${escapeHtml(err.message)}</div>`;
      return;
    }
  }
  mentionMembers = groupMembersCache.get(cust.threadId);
  renderMention();
  $('#mentionSearch').focus();
}
function closeMention() { mentionModal.hidden = true; }

function filteredMembers() {
  const q = $('#mentionSearch').value.trim().toLowerCase();
  return q ? mentionMembers.filter((m) => m.name.toLowerCase().includes(q)) : mentionMembers;
}

function renderMention() {
  const rows = filteredMembers();
  $('#mentionInfo').textContent = `${rows.length} / ${mentionMembers.length}`;
  $('#mentionCount').textContent = `Đã chọn ${mentionPicked.size}`;
  const list = $('#mentionList');
  if (!rows.length) { list.innerHTML = `<div class="${IMPORT_EMPTY_CLS}">Không có thành viên nào.</div>`; return; }
  list.innerHTML = rows.slice(0, 500).map((m) => {
    const on = mentionPicked.has(m.userId);
    return `<li data-id="${m.userId}" class="flex items-center gap-3 px-2.5 py-[9px] rounded-[11px] cursor-pointer transition hover:bg-panel2 ${on ? 'bg-indigo-500/[.14]' : ''}">
      ${m.avatar ? `<img class="w-[32px] h-[32px] rounded-full object-cover bg-panel3 shrink-0" src="${m.avatar}" alt="" />` : `<div class="w-[32px] h-[32px] rounded-full shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[12px] font-bold">${escapeHtml((m.name || '?').trim().charAt(0).toUpperCase() || '?')}</div>`}
      <div class="flex-1 min-w-0 text-[13.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(m.name)}</div>
      <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[11px] font-bold ${on ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-[#3a4353] text-transparent'}">✓</span>
    </li>`;
  }).join('') + (rows.length > 500 ? `<div class="${IMPORT_EMPTY_CLS}">…và ${rows.length - 500} thành viên nữa — hãy tìm kiếm để thu hẹp.</div>` : '');
  list.querySelectorAll('li[data-id]').forEach((li) => {
    li.onclick = () => {
      const id = li.dataset.id;
      if (mentionPicked.has(id)) mentionPicked.delete(id); else mentionPicked.add(id);
      renderMention();
    };
  });
}

$('#btnMention').onclick = openMention;
$('#mentionClose').onclick = closeMention;
$('#mentionCancel').onclick = closeMention;
mentionModal.addEventListener('click', (e) => { if (e.target === mentionModal) closeMention(); });
$('#mentionSearch').oninput = renderMention;
$('#mentionSelectAll').onchange = (e) => {
  filteredMembers().forEach((m) => { if (e.target.checked) mentionPicked.add(m.userId); else mentionPicked.delete(m.userId); });
  renderMention();
};
$('#mentionInsert').onclick = () => {
  if (!mentionPicked.size) return alert('Chưa chọn thành viên nào.');
  // openzca chỉ nhận @Tên khi tên là duy nhất trong nhóm — trùng tên thì dùng @userId.
  const nameCount = new Map();
  mentionMembers.forEach((m) => nameCount.set(m.name, (nameCount.get(m.name) || 0) + 1));
  const tags = mentionMembers
    .filter((m) => mentionPicked.has(m.userId))
    .map((m) => (nameCount.get(m.name) > 1 ? `@${m.userId}` : `@${m.name}`));
  insertAtCursor($('#singleContent'), tags.join(' ') + ' ');
  updateSinglePreview();
  closeMention();
};

// ---------- Xuất hội thoại (JSON, N ngày gần nhất) ----------
let lastExportData = null; // dữ liệu lần fetch gần nhất — dùng để xuất .txt mà không phải gọi API lại

// Chuyển mảng messages (schema thô từ openzca: msg_type, content_text, sender_name,
// timestamp_ms...) thành text dễ đọc, chỉ giữ tin nhắn dạng text (bỏ ảnh/video/sticker...).
// msgType thô của Zalo cho tin nhắn media chứa các từ khoá này (tin nhắn text thường
// đi kèm msgType "webchat", không phải "text" — đã kiểm chứng qua tài liệu openzca).
const MEDIA_MSG_TYPE_RE = /photo|gif|sticker|video|voice|audio|share\.file|link|location/i;
function isMediaMessage(m) {
  if (typeof m.is_media === 'boolean') return m.is_media;
  return MEDIA_MSG_TYPE_RE.test(m.msg_type || '');
}

function messagesToPlainText(data) {
  const lines = (data.messages || [])
    .filter((m) => !isMediaMessage(m))
    .map((m) => {
      const ts = m.timestamp_ms ? new Date(Number(m.timestamp_ms)) : null;
      const time = ts ? ts.toLocaleString('vi-VN') : '(không rõ thời gian)';
      const sender = m.sender_name || m.sender_id || '(ẩn danh)';
      const content = (m.content_text || '').replace(/\s+/g, ' ').trim();
      return `[${time}] ${sender}: ${content}`;
    });
  const header = `Hội thoại: ${data.threadId}${data.group ? ' (nhóm)' : ''} — ${data.days} ngày gần nhất — ${lines.length}/${data.count} tin nhắn dạng text\n`;
  return header + '\n' + (lines.join('\n') || '(không có tin nhắn dạng text)');
}

$('#btnExportHistory').onclick = async () => {
  const box = $('#exportResult');
  box.innerHTML = '';
  lastExportData = null;
  $('#btnExportHistoryTxt').disabled = true;

  const custId = $('#exportTarget').value;
  const cust = custId ? customers.find((c) => c.id === custId) : null;
  const threadId = cust ? cust.threadId : $('#exportThreadManual').value.trim();
  const isGroup = cust ? !!cust.isGroup : $('#exportIsGroup').checked;
  const days = Number($('#exportDays').value);

  if (!threadId) return alert('Chọn khách hàng hoặc nhập threadId.');
  if (!Number.isFinite(days) || days <= 0) return alert('Số ngày phải là số dương.');

  logLine(box, `Đang lấy dữ liệu hội thoại "${threadId}" trong ${days} ngày gần nhất...`, 'info');
  $('#btnExportHistory').disabled = true;

  const url = new URL(BASE_URL + '/api/v1/zalosend/zalo/history');
  url.searchParams.set('threadId', threadId);
  url.searchParams.set('days', String(days));
  if (isGroup) url.searchParams.set('group', '1');

  // Chat 1-1 (DM) dùng cơ chế "best-effort" của openzca, thỉnh thoảng tự thất bại
  // không rõ nguyên nhân dù server đã tự retry — tự động thử lại thêm vài lần ở đây
  // cho đỡ phải bấm tay. Nhóm (group) đã ổn định sẵn nên chỉ thử 1 lần.
  const MAX_ATTEMPTS = isGroup ? 1 : 4;
  const RETRY_DELAY_MS = 6000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.message || data.error || 'Không lấy được dữ liệu hội thoại.');

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `zalo-history-${threadId}-${days}d.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      logLine(box, `✅ Đã tải về ${data.count} tin nhắn.`, data.count > 0 ? 'ok' : 'wait');
      if (data.count === 0 && data.sync) {
        logLine(box, 'ℹ️ 0 tin nhắn — xem field "sync" trong file JSON vừa tải để biết lý do (Zalo thường chỉ cho đọc lịch sử từ lúc tài khoản này tham gia nhóm/hội thoại, hoặc trong khoảng ngày này chưa có tin mới).', 'wait');
      }
      lastExportData = data;
      $('#btnExportHistoryTxt').disabled = false;
      $('#btnExportHistoryTxt').title = '';
      break; // thành công — dừng vòng lặp retry
    } catch (err) {
      const isRateLimit = /429|rate limit|giới hạn tần suất/i.test(err.message || '');
      if (isRateLimit || attempt >= MAX_ATTEMPTS) {
        logLine(box, `❌ Lỗi: ${err.message}`, 'fail');
        break;
      }
      logLine(box, `⚠️ Lỗi (lần ${attempt}/${MAX_ATTEMPTS}): ${err.message} — tự thử lại sau ${RETRY_DELAY_MS / 1000}s...`, 'wait');
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  $('#btnExportHistory').disabled = false;
};

$('#btnExportHistoryTxt').onclick = () => {
  if (!lastExportData) return;
  const text = messagesToPlainText(lastExportData);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `zalo-history-${lastExportData.threadId}-${lastExportData.days}d.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
};

// ---------- Gửi hàng loạt ----------
const bcLog = () => $('#bcLog');
let bcState = { total: 0, ok: 0, fail: 0 };
let bcFailed = [];            // threadId thất bại ở lần gửi gần nhất — để "Gửi lại tin thất bại"
let bcMode = 'all';           // 'all' | 'tag' | 'picked'
const bcTags = new Set();     // nhãn đang chọn ở chế độ 'tag'
let bcConfig = null;          // cấu hình chống spam của server (để ước tính thời gian)

const BC_MODE_ON = 'bc-mode px-3.5 py-[7px] text-[13px] font-semibold rounded-lg transition text-white bg-indigo-500 shadow-sm';
const BC_MODE_OFF = 'bc-mode px-3.5 py-[7px] text-[13px] font-semibold rounded-lg transition text-muted hover:text-ink';

api('/api/v1/zalosend/config').then((c) => { if (c && c.poolSize) { bcConfig = c; renderBcChooser(); } }).catch(() => {});

function pickedIdSet() { return new Set(selectedIds()); }

function bcRecipients() {
  if (bcMode === 'picked') { const ids = pickedIdSet(); return customers.filter((c) => ids.has(c.id)); }
  if (bcMode === 'tag') return customers.filter((c) => bcTags.has(c.tag));
  return customers;
}

function fmtDuration(ms) {
  const min = Math.round(ms / 60000);
  if (min < 1) return 'dưới 1 phút';
  if (min < 60) return `~${min} phút`;
  return `~${Math.floor(min / 60)} giờ ${min % 60} phút`;
}
function estimateMs(n) {
  if (!bcConfig || n < 2) return 0;
  const avgDelay = (bcConfig.minDelayMs + bcConfig.maxDelayMs) / 2;
  const avgRest = (bcConfig.poolRestMinMs + bcConfig.poolRestMaxMs) / 2;
  const pools = Math.ceil(n / bcConfig.poolSize);
  const inPoolGaps = n - pools;          // khoảng nghỉ giữa các khách trong cùng pool
  return inPoolGaps * avgDelay + (pools - 1) * avgRest;
}

function updateBcPickedCount() {
  const n = selectedIds().length;
  $('#bcPickedCount').textContent = `(${n})`;
}

function renderBcChooser() {
  document.querySelectorAll('#bcModes .bc-mode').forEach((b) => { b.className = b.dataset.mode === bcMode ? BC_MODE_ON : BC_MODE_OFF; });

  // Chip nhãn (chọn nhiều) — chỉ ở chế độ theo nhãn
  const tags = uniqueTagCounts();
  [...bcTags].forEach((t) => { if (!tags.some(([tag]) => tag === t)) bcTags.delete(t); });
  const chips = $('#bcTagChips');
  chips.hidden = bcMode !== 'tag' || !tags.length;
  $('#bcTagEmpty').hidden = !(bcMode === 'tag' && !tags.length);
  chips.innerHTML = tags.map(([tag, count]) => tagChipHtml(tag, count, bcTags.has(tag))).join('');
  chips.querySelectorAll('.tag-chip').forEach((chip) => {
    chip.onclick = () => {
      if (bcTags.has(chip.dataset.tag)) bcTags.delete(chip.dataset.tag); else bcTags.add(chip.dataset.tag);
      renderBcChooser();
    };
  });

  // Tóm tắt người nhận + ước tính thời gian
  const rec = bcRecipients();
  const groups = rec.filter((c) => c.isGroup).length;
  const names = rec.slice(0, 5).map((c) => escapeHtml(c.name)).join(', ') + (rec.length > 5 ? `, … +${rec.length - 5}` : '');
  let hint = '';
  if (bcMode === 'tag' && !bcTags.size) hint = 'Chọn ít nhất một nhãn ở trên.';
  else if (bcMode === 'picked' && !rec.length) hint = 'Chưa tick khách nào ở danh sách bên trái.';
  else if (!rec.length) hint = 'Chưa có khách hàng nào.';
  $('#bcSummary').innerHTML = rec.length
    ? `<div><b>${rec.length}</b> người nhận${groups ? ` (${rec.length - groups} cá nhân · ${groups} nhóm)` : ''}${bcConfig ? ` · thời gian ước tính <b>${fmtDuration(estimateMs(rec.length))}</b>` : ''}</div>
       <div class="text-muted mt-0.5">${names}</div>`
    : `<span class="text-amber-300">${hint}</span>`;
  updateBcPreview();
}

document.querySelectorAll('#bcModes .bc-mode').forEach((b) => {
  b.onclick = () => { bcMode = b.dataset.mode; renderBcChooser(); };
});

// Tick ở danh sách bên trái: tự chuyển sang "Đã tick" khi bắt đầu tick, quay về "Tất cả" khi bỏ hết
$('#customerList').addEventListener('change', (e) => {
  if (!e.target.classList.contains('pick')) return;
  const n = selectedIds().length;
  if (n > 0 && bcMode !== 'picked') bcMode = 'picked';
  else if (n === 0 && bcMode === 'picked') bcMode = 'all';
  updateBcPickedCount();
  renderBcChooser();
});
$('#selectAll').addEventListener('change', () => {
  const n = selectedIds().length;
  bcMode = n > 0 ? 'picked' : (bcMode === 'picked' ? 'all' : bcMode);
  updateBcPickedCount();
  renderBcChooser();
});

function updateBcPreview() {
  const raw = $('#bcContent').value;
  $('#bcCount').textContent = fmtCount(raw.length);
  const first = bcRecipients()[0];
  const box = $('#bcPreviewBox');
  if (!first || !raw.trim()) { box.hidden = true; return; }
  box.hidden = false;
  $('#bcPreviewFor').textContent = `Xem trước — như gửi cho ${first.name}`;
  $('#bcPreview').textContent = renderMessagePreview(raw, first, $('#bcPerLine').checked);
}
$('#bcContent').addEventListener('input', updateBcPreview);
$('#bcPerLine').addEventListener('change', updateBcPreview);
$('#bcReroll').onclick = updateBcPreview;
$('#bcContent').addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('#btnBroadcast').click(); }
});
$('#bcTemplatePicker').onchange = (e) => {
  const tpl = allTemplates().find((t) => t.id === e.target.value);
  if (!tpl) return;
  const box = $('#bcContent');
  if (box.value.trim() && !confirm('Nội dung hiện tại sẽ bị thay bằng mẫu đã chọn. Tiếp tục?')) { e.target.value = ''; return; }
  box.value = tpl.content;
  $('#bcPerLine').checked = !!tpl.perLine;
  e.target.value = '';
  updateBcPreview();
};

function startBroadcast(recipients, content, perLine) {
  bcState = { total: 0, ok: 0, fail: 0 };
  bcFailed = [];
  bcLog().innerHTML = '';
  $('#progressBar').style.width = '0%';
  $('#cOk').textContent = $('#cFail').textContent = $('#cLeft').textContent = '0';
  $('#btnRetryFailed').hidden = true;

  // Server không giữ danh sách khách — gửi kèm người nhận lấy từ IndexedDB.
  socket.emit('broadcast:start', {
    content,
    // `text` = nội dung đã chọn biến thể + thay biến riêng cho từng người (anh/chị, gia hạn...);
    // server chỉ còn thay [Tên] và resolve Spintax.
    recipients: recipients.map((c) => ({
      name: c.name, threadId: c.threadId, tag: c.tag, isGroup: c.isGroup,
      text: composeFor(content, perLine, c),
    })),
  });
  $('#btnBroadcast').disabled = true;
  $('#btnStop').hidden = false;
}

$('#btnBroadcast').onclick = () => {
  const content = $('#bcContent').value.trim();
  const rec = bcRecipients();
  if (!rec.length) return alert(bcMode === 'tag' ? 'Chọn ít nhất một nhãn có khách hàng.' : bcMode === 'picked' ? 'Chưa tick khách nào ở danh sách.' : 'Chưa có khách hàng nào.');
  if (!content) { $('#bcContent').focus(); return alert('Nhập nội dung.'); }
  const est = bcConfig ? `\nThời gian ước tính: ${fmtDuration(estimateMs(rec.length))} (giãn cách ngẫu nhiên để chống spam).` : '';
  if (!confirm(`Gửi tin tới ${rec.length} người nhận?${est}\n\nGiữ tab này mở trong suốt quá trình gửi.`)) return;
  startBroadcast(rec, content, $('#bcPerLine').checked);
};

$('#btnRetryFailed').onclick = () => {
  const content = $('#bcContent').value.trim();
  const failed = new Set(bcFailed);
  const rec = customers.filter((c) => failed.has(c.threadId));
  if (!rec.length || !content) return;
  if (!confirm(`Gửi lại cho ${rec.length} người bị lỗi ở lần trước?`)) return;
  startBroadcast(rec, content, $('#bcPerLine').checked);
};

$('#btnStop').onclick = () => {
  socket.emit('broadcast:stop');
  logLine(bcLog(), 'Đã yêu cầu dừng...', 'wait');
};

function bcFinish() {
  $('#btnBroadcast').disabled = false;
  $('#btnStop').hidden = true;
}

socket.on('broadcast:error', ({ message }) => {
  logLine(bcLog(), 'Lỗi: ' + message, 'fail');
  bcFinish();
});

socket.on('broadcast:start', ({ total, poolSize, pools }) => {
  bcState.total = total;
  $('#cLeft').textContent = total;
  $('#progressText').textContent = `Bắt đầu gửi ${total} tin...`;
  logLine(bcLog(), `Khởi động: ${total} người nhận · ${pools} pool × ${poolSize} user.`, 'info');
});

socket.on('broadcast:pool', ({ pool, pools, from, to, size }) => {
  logLine(bcLog(), `📦 Pool ${pool}/${pools} — gửi ${size} user (#${from}–#${to})`, 'info');
});

socket.on('broadcast:pool-rest', ({ pool, pools, delayMs, resumeAt }) => {
  const secs = Math.round(delayMs / 1000);
  logLine(bcLog(), `🛑 Hết pool ${pool}/${pools}. Nghỉ dài ${secs}s trước pool kế...`, 'wait');
  countdown(resumeAt, bcState.ok + bcState.fail, bcState.total);
});

socket.on('broadcast:sending', ({ index, total, customer }) => {
  $('#progressText').textContent = `Đang gửi ${index}/${total}: ${customer.name}`;
});

socket.on('broadcast:result', ({ index, total, customer, status, text, error }) => {
  if (status === 'success') {
    bcState.ok++;
    logLine(bcLog(), `✅ [${index}/${total}] ${customer.name}: "${text}"`, 'ok');
  } else {
    bcState.fail++;
    bcFailed.push(customer.threadId);
    logLine(bcLog(), `❌ [${index}/${total}] ${customer.name}: ${error}`, 'fail');
  }
  $('#cOk').textContent = bcState.ok;
  $('#cFail').textContent = bcState.fail;
  $('#cLeft').textContent = total - index;
  $('#progressBar').style.width = `${Math.round((index / total) * 100)}%`;
});

socket.on('broadcast:waiting', ({ index, total, delayMs, resumeAt }) => {
  const secs = Math.round(delayMs / 1000);
  logLine(bcLog(), `⏳ Nghỉ ${secs}s trước tin kế tiếp (chống spam)...`, 'wait');
  countdown(resumeAt, index, total);
});

function countdown(resumeAt, index, total) {
  const tick = () => {
    const left = Math.max(0, Math.round((resumeAt - Date.now()) / 1000));
    if (left <= 0) return;
    $('#progressText').textContent = `Đã gửi ${index}/${total} · chờ ${left}s...`;
    setTimeout(tick, 500);
  };
  tick();
}

socket.on('broadcast:done', ({ total, success, failed, stopped }) => {
  $('#progressBar').style.width = '100%';
  $('#progressText').textContent = stopped
    ? `Đã dừng. Thành công ${success}, thất bại ${failed}.`
    : `Hoàn tất! Thành công ${success}/${total}, thất bại ${failed}.`;
  logLine(bcLog(), stopped ? 'Đã dừng theo yêu cầu.' : 'Hoàn tất gửi hàng loạt.', stopped ? 'wait' : 'ok');
  $('#btnRetryFailed').hidden = !bcFailed.length;
  bcFinish();
});

// ---------- Import từ Zalo ----------
const importModal = $('#importModal');
let importSource = 'friends';         // 'friends' | 'groups'
let importData = { friends: null, groups: null };
const importPicked = new Set();       // threadId đã tick

function openImport() {
  importModal.hidden = false;
  importPicked.clear();
  $('#importSearch').value = '';
  $('#importTagOverride').value = '';
  loadImport(importSource, false);
}
function closeImport() { importModal.hidden = true; }

$('#btnImport').onclick = openImport;
$('#importClose').onclick = closeImport;
$('#importCancel').onclick = closeImport;
importModal.addEventListener('click', (e) => { if (e.target === importModal) closeImport(); });

importModal.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => {
    setActiveTab(importModal.querySelectorAll('.tab'), t);
    importSource = t.dataset.src;
    loadImport(importSource, false);
  };
});

$('#importRefresh').onclick = () => loadImport(importSource, true);
$('#importSearch').oninput = renderImport;

$('#importSelectAll').onchange = (e) => {
  const rows = filteredImport();
  rows.forEach((r) => {
    const id = r.userId || r.groupId;
    if (e.target.checked) importPicked.add(id);
    else importPicked.delete(id);
  });
  renderImport();
};

const IMPORT_EMPTY_CLS = 'px-4 py-7 text-center text-muted text-[13px]';

async function loadImport(source, refresh) {
  const list = $('#importList');
  if (refresh || !importData[source]) {
    list.innerHTML = `<div class="${IMPORT_EMPTY_CLS}">Đang tải từ Zalo...</div>`;
    $('#importInfo').textContent = '';
    try {
      importData[source] = await api(`/api/v1/zalosend/zalo/${source}${refresh ? '?refresh=1' : ''}`);
      if (importData[source].error) throw new Error(importData[source].error);
    } catch (err) {
      list.innerHTML = `<div class="${IMPORT_EMPTY_CLS}">Lỗi: ${escapeHtml(err.message || 'không tải được')}</div>`;
      return;
    }
  }
  renderImport();
}

function filteredImport() {
  const data = importData[importSource] || [];
  const q = $('#importSearch').value.trim().toLowerCase();
  if (!q) return data;
  return data.filter((r) => (r.name || '').toLowerCase().includes(q));
}

function renderImport() {
  const rows = filteredImport();
  const list = $('#importList');
  const isGroup = importSource === 'groups';

  $('#importInfo').textContent = `${rows.length} / ${(importData[importSource] || []).length}`;

  const IROW_BASE = 'irow flex items-center gap-3 px-2.5 py-[9px] rounded-[11px] cursor-pointer transition hover:bg-panel2';
  const IROW_SEL = `${IROW_BASE} bg-indigo-500/[.14]`;
  const CHECK_BASE = 'check w-5 h-5 rounded-full border-2 border-[#3a4353] flex items-center justify-center shrink-0 text-transparent text-[11px] font-bold transition';
  const CHECK_SEL = 'check w-5 h-5 rounded-full border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center shrink-0 text-white text-[11px] font-bold transition';

  if (!rows.length) {
    list.innerHTML = `<div class="${IMPORT_EMPTY_CLS}">Không có mục nào.</div>`;
  } else {
    // Giới hạn render 500 dòng để mượt (danh sách nhóm có thể rất lớn).
    const shown = rows.slice(0, 500);
    list.innerHTML = shown.map((r) => {
      const id = r.userId || r.groupId;
      const sub = isGroup ? `${r.members || 0} thành viên` : (r.phone || id);
      const sel = importPicked.has(id);
      const initial = escapeHtml((r.name || '?').trim().charAt(0).toUpperCase() || '?');
      return `<li class="${sel ? IROW_SEL : IROW_BASE}" data-id="${id}">
        ${r.avatar ? `<img class="w-[34px] h-[34px] rounded-full object-cover bg-panel3 shrink-0" src="${r.avatar}" alt="" />` : `<div class="w-[34px] h-[34px] rounded-full shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[12.5px] font-bold">${initial}</div>`}
        <div class="ci-main flex-1 min-w-0">
          <div class="whitespace-nowrap overflow-hidden text-ellipsis text-[13.5px] font-semibold">${escapeHtml(r.name)}</div>
          <div class="text-[11.5px] text-muted mt-px whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(String(sub))}</div>
        </div>
        <span class="${sel ? CHECK_SEL : CHECK_BASE}">✓</span>
      </li>`;
    }).join('') + (rows.length > 500 ? `<div class="${IMPORT_EMPTY_CLS}">…và ${rows.length - 500} mục nữa — hãy tìm kiếm để thu hẹp.</div>` : '');

    list.querySelectorAll('.irow').forEach((row) => {
      row.onclick = () => {
        const id = row.dataset.id;
        const check = row.querySelector('.check');
        if (importPicked.has(id)) {
          importPicked.delete(id);
          row.className = IROW_BASE;
          check.className = CHECK_BASE;
        } else {
          importPicked.add(id);
          row.className = IROW_SEL;
          check.className = CHECK_SEL;
        }
        $('#importCount').textContent = `Đã chọn ${importPicked.size}`;
      };
    });
  }
  $('#importCount').textContent = `Đã chọn ${importPicked.size}`;
}

$('#importAdd').onclick = async () => {
  if (!importPicked.size) return alert('Chưa chọn mục nào.');
  const isGroup = importSource === 'groups';
  const src = importData[importSource] || [];
  const tagOverride = $('#importTagOverride').value.trim();
  const items = src
    .filter((r) => importPicked.has(r.userId || r.groupId))
    .map((r) => ({
      name: r.name,
      threadId: r.userId || r.groupId,
      isGroup,
      gender: isGroup ? '' : (r.gender === 'male' || r.gender === 'female' ? r.gender : ''),
      tag: tagOverride || (isGroup ? 'nhóm' : 'bạn bè'),
    }));

  let r;
  try {
    r = await ZsDb.customers.addMany(items);
  } catch (err) {
    return alert(err.message);
  }
  closeImport();
  loadCustomers();
  alert(`Đã thêm ${r.added} mục${r.updated ? `, bổ sung giới tính cho ${r.updated} khách đã có` : ''} (bỏ qua ${r.skipped} trùng). Tổng: ${r.total}.`);
};

// ---------- Chèn biến vào nội dung tin nhắn ([Tên], Spintax {a|b}) ----------
function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
  const caret = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(caret, caret);
}

document.querySelectorAll('.var-chips').forEach((box) => {
  const textarea = document.getElementById(box.dataset.target);
  if (!textarea) return;
  box.querySelectorAll('.chip-var').forEach((chip) => {
    chip.onclick = () => insertAtCursor(textarea, chip.dataset.insert);
  });
});

// ============================================================
// MẪU TIN NHẮN (templates)
// ============================================================
const MESSAGE_TEMPLATES = [
  {
    id: 'renew-pay-check',
    label: '💬 Hỏi thăm thanh toán gia hạn (20 biến thể)',
    perLine: true, // mỗi dòng là một biến thể, chọn ngẫu nhiên cho từng người nhận
    content: [
      'Dạ [anh/chị] ơi, em hỏi thăm mình đã sắp xếp thanh toán phí gia hạn chưa ạ?',
      'Dạ [anh/chị] ơi, phần chi phí gia hạn hôm trước mình đã chuyển khoản chưa ạ?',
      'Dạ em hỏi thăm [anh/chị] chút ạ, không biết mình đã thanh toán phần gia hạn chưa ạ?',
      'Dạ [anh/chị] ơi, em xin phép hỏi lại phần gia hạn website của mình, [anh/chị] đã sắp xếp thanh toán chưa ạ?',
      'Dạ [anh/chị] ơi, phần gia hạn bên mình [anh/chị] đã xử lý giúp em chưa ạ?',
      'Dạ em hỏi thăm chút nha [anh/chị], phí gia hạn mình đã chuyển khoản chưa ạ?',
      'Dạ [anh/chị] ơi, không biết phần gia hạn website mình đã thanh toán được chưa ạ?',
      'Dạ [anh/chị] ơi, em nhắn hỏi thăm lại phần gia hạn hôm trước, mình đã sắp xếp chuyển khoản chưa ạ?',
      'Dạ [anh/chị] ơi, phần gia hạn hosting và tên miền mình đã thanh toán chưa ạ? Để em kiểm tra và xử lý gia hạn cho mình nha.',
      'Dạ em hỏi thăm [anh/chị] xíu ạ, khoản gia hạn website mình đã chuyển chưa ạ?',
      'Dạ [anh/chị] ơi, em xin phép nhắc nhẹ phần gia hạn website ạ, không biết mình đã sắp xếp thanh toán chưa?',
      'Dạ [anh/chị] ơi, phần gia hạn của mình [anh/chị] đã sắp xếp thanh toán chưa ạ? Nếu mình chuyển rồi thì báo em kiểm tra nha.',
      'Dạ [anh/chị] ơi, em hỏi lại chút về phí gia hạn ạ, mình đã thanh toán giúp em chưa ạ?',
      'Dạ em nhắn hỏi thăm phần gia hạn website của mình ạ, [anh/chị] đã chuyển khoản chưa để em kiểm tra nha.',
      'Dạ [anh/chị] ơi, không biết hôm nay mình đã sắp xếp được phần thanh toán gia hạn chưa ạ?',
      'Dạ [anh/chị] ơi, em xin phép hỏi thăm phần gia hạn một chút ạ. Nếu mình đã chuyển rồi thì báo em để em kiểm tra và xác nhận nha.',
      'Dạ [anh/chị] ơi, phí gia hạn website hôm trước em gửi mình đã thanh toán chưa ạ?',
      'Dạ [anh/chị] ơi, em nhắc nhẹ mình phần gia hạn website nha, không biết [anh/chị] đã chuyển khoản được chưa ạ?',
      'Dạ em hỏi thăm [anh/chị] chút nha, mình đã sắp xếp thanh toán phần gia hạn để bên em tiếp tục duy trì website chưa ạ?',
      'Dạ [anh/chị] ơi, em hỏi thăm lại phần gia hạn website nha. Không biết mình đã thanh toán chưa để em kiểm tra và tiến hành gia hạn cho mình luôn ạ?'
    ].join('\n'),
  },
  {
    id: 'track',
    label: '👋 Chăm sóc / Track khách',
    content: '{Chào|Xin chào} [Tên], bên em đang trong quá trình hỗ trợ và muốn hỏi thăm tình hình sử dụng dịch vụ của mình. {Anh/Chị} có cần hỗ trợ gì thêm không ạ?',
  },
  {
    id: 'renew-domain',
    label: '🌐 Nhắc gia hạn domain',
    content: '{Chào|Xin chào} [Tên], domain [SảnPhẩm] của {anh/chị} sẽ hết hạn vào [NgàyHếtHạn] (còn [SốNgàyCònLại] ngày). Bên em nhắc {anh/chị} gia hạn sớm để tránh gián đoạn dịch vụ ạ!',
  },
  {
    id: 'renew-hosting',
    label: '🖥️ Nhắc gia hạn hosting',
    content: '{Chào|Xin chào} [Tên], gói hosting [SảnPhẩm] của {anh/chị} sắp hết hạn vào [NgàyHếtHạn] (còn [SốNgàyCònLại] ngày). {Anh/Chị} vui lòng gia hạn trước hạn để website hoạt động liên tục nhé!',
  },
  {
    id: 'promo',
    label: '🎁 Ưu đãi / khuyến mãi',
    content: '{Chào|Hi} [Tên]! {Bên em|Shop} đang có ưu đãi {hấp dẫn|cực tốt} dành riêng cho {anh/chị}, {anh/chị} quan tâm để em tư vấn thêm nhé!',
  },
];

// Mẫu tuỳ chỉnh do người dùng tự thêm — lưu trong IndexedDB của trình duyệt
const CUSTOM_TPL_KEY = 'zs:customTemplates';
function getCustomTemplates() { return ZsDb.getKV(CUSTOM_TPL_KEY, []); }
function saveCustomTemplates(list) { ZsDb.setKV(CUSTOM_TPL_KEY, list); }
function allTemplates() { return [...MESSAGE_TEMPLATES, ...getCustomTemplates()]; }

function populateTemplateSelect(select, withPlaceholder) {
  const current = select.value;
  select.innerHTML =
    (withPlaceholder ? '<option value="">— Chọn mẫu có sẵn (tuỳ chọn) —</option>' : '') +
    allTemplates().map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join('');
  if ([...select.options].some((o) => o.value === current)) select.value = current;
}
populateTemplateSelect($('#templatePicker'), true);
populateTemplateSelect($('#bcTemplatePicker'), true);

$('#templatePicker').onchange = (e) => {
  const tpl = allTemplates().find((t) => t.id === e.target.value);
  if (!tpl) return;
  const box = $('#singleContent');
  if (box.value.trim() && !confirm('Nội dung hiện tại sẽ bị thay bằng mẫu đã chọn. Tiếp tục?')) {
    e.target.value = '';
    return;
  }
  box.value = tpl.content;
  $('#singlePerLine').checked = !!tpl.perLine;
  e.target.value = '';
  updateSinglePreview();
};

// ============================================================
// QUẢN LÝ MẪU TIN NHẮN (thêm / sửa / xoá / sao chép)
// ============================================================
const templateModal = $('#templateModal');
let editingTplId = null;

const CP_ICON_BTN = 'w-[30px] h-[30px] rounded-lg border border-line bg-panel3 text-muted cursor-pointer flex items-center justify-center hover:text-ink hover:border-[#3a4353] transition';
const CP_EMPTY_CLS = 'text-center py-10 px-5 text-muted text-[13px]';
const TPL_TAG_BUILTIN = 'text-[9.5px] font-bold uppercase tracking-[.04em] px-[7px] py-px rounded-full bg-zinc-500/[.18] text-muted';
const TPL_TAG_CUSTOM = 'text-[9.5px] font-bold uppercase tracking-[.04em] px-[7px] py-px rounded-full bg-indigo-500/[.14] text-indigo-300';

function renderTemplateManagerList() {
  const box = $('#templateManagerList');
  const rows = allTemplates().map((t) => {
    const isCustom = t.id.startsWith('custom_');
    return `
      <div class="tpl-row border border-line bg-panel2 rounded-xl px-3 py-2.5 flex items-start justify-between gap-2.5" data-id="${t.id}">
        <div class="min-w-0">
          <div class="font-bold text-[13px] flex items-center gap-[7px] flex-wrap">
            ${escapeHtml(t.label)}
            ${t.perLine ? `<span class="${TPL_TAG_CUSTOM}">Ngẫu nhiên theo dòng</span>` : ''}
            <span class="${isCustom ? TPL_TAG_CUSTOM : TPL_TAG_BUILTIN}">${isCustom ? 'Tuỳ chỉnh' : 'Có sẵn'}</span>
          </div>
          <div class="text-[11.5px] text-muted mt-[3px] leading-relaxed whitespace-pre-line max-h-[120px] overflow-y-auto">${escapeHtml(t.content)}</div>
        </div>
        <div class="flex gap-1.5 shrink-0">
          ${isCustom
            ? `<button class="${CP_ICON_BTN} tpl-edit" title="Sửa">✎</button>
               <button class="${CP_ICON_BTN} tpl-del text-rose-400" title="Xoá">🗑</button>`
            : `<button class="${CP_ICON_BTN} tpl-copy" title="Sao chép thành mẫu của bạn">⧉</button>`}
        </div>
      </div>`;
  }).join('');
  box.innerHTML = rows || `<div class="${CP_EMPTY_CLS}">Chưa có mẫu nào.</div>`;

  box.querySelectorAll('.tpl-edit').forEach((b) => {
    b.onclick = () => {
      const t = allTemplates().find((x) => x.id === b.closest('.tpl-row').dataset.id);
      startEditTemplate(t);
    };
  });
  box.querySelectorAll('.tpl-del').forEach((b) => {
    b.onclick = () => {
      const id = b.closest('.tpl-row').dataset.id;
      if (!confirm('Xoá mẫu này?')) return;
      saveCustomTemplates(getCustomTemplates().filter((t) => t.id !== id));
      refreshAllTemplateSelects();
      renderTemplateManagerList();
    };
  });
  box.querySelectorAll('.tpl-copy').forEach((b) => {
    b.onclick = () => {
      const t = allTemplates().find((x) => x.id === b.closest('.tpl-row').dataset.id);
      startEditTemplate(null, { label: t.label + ' (bản sao)', content: t.content, perLine: t.perLine });
    };
  });
}

function startEditTemplate(existing, prefill) {
  editingTplId = existing?.id || null;
  $('#tplFormTitle').textContent = existing ? 'Sửa mẫu' : 'Thêm mẫu mới';
  $('#tplName').value = existing?.label || prefill?.label || '';
  $('#tplContent').value = existing?.content || prefill?.content || '';
  $('#tplPerLine').checked = !!(existing?.perLine || prefill?.perLine);
  $('#tplCancelEdit').hidden = !existing;
  $('#tplName').focus();
}

function refreshAllTemplateSelects() {
  populateTemplateSelect($('#templatePicker'), true);
  populateTemplateSelect($('#bcTemplatePicker'), true);
  populateTemplateSelect($('#cpTemplate'), false);
}

$('#btnManageTemplates').onclick = () => {
  startEditTemplate(null);
  renderTemplateManagerList();
  templateModal.hidden = false;
};
$('#templateModalClose').onclick = () => { templateModal.hidden = true; };
templateModal.addEventListener('click', (e) => { if (e.target === templateModal) templateModal.hidden = true; });

$('#tplCancelEdit').onclick = () => startEditTemplate(null);

$('#tplSave').onclick = () => {
  const label = $('#tplName').value.trim();
  const content = $('#tplContent').value.trim();
  const perLine = $('#tplPerLine').checked;
  if (!label || !content) return alert('Nhập đủ tên mẫu và nội dung.');

  const list = getCustomTemplates();
  if (editingTplId) {
    const i = list.findIndex((t) => t.id === editingTplId);
    if (i !== -1) list[i] = { ...list[i], label, content, perLine };
  } else {
    list.push({ id: 'custom_' + Date.now().toString(36), label, content, perLine });
  }
  const wasNew = !editingTplId;
  saveCustomTemplates(list);
  refreshAllTemplateSelects();
  renderTemplateManagerList();
  startEditTemplate(null);
  if (wasNew) {
    const scroller = $('#templateManagerScroll');
    scroller.scrollTop = scroller.scrollHeight;
  }
};

// ============================================================
// GIA HẠN (domain/hosting...) — lưu trong IndexedDB của trình duyệt
// Lưu ý: Zalo API hiện chưa trả về nhãn (label) đã gắn sẵn trong app Zalo,
// nên tag/gia hạn chạy hoàn toàn phía FE, không đồng bộ lên server.
// ============================================================
const RENEW_KEY = 'zs:renew';

function getAllRenewals() { return ZsDb.getKV(RENEW_KEY, {}); }
function getRenewal(customerId) {
  return getAllRenewals()[customerId] || null;
}
function setRenewal(customerId, data) {
  const all = getAllRenewals();
  all[customerId] = data;
  ZsDb.setKV(RENEW_KEY, all);
}
function deleteRenewal(customerId) {
  const all = getAllRenewals();
  delete all[customerId];
  ZsDb.setKV(RENEW_KEY, all);
}
function daysLeftFrom(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

let renewTargetId = null;
const renewModal = $('#renewModal');

function openRenew(customerId) {
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return;
  renewTargetId = customerId;
  const r = getRenewal(customerId);
  $('#renewFor').textContent = `Khách hàng: ${cust.name}`;
  $('#renewItem').value = r?.item || '';
  $('#renewDate').value = r?.date || '';
  renewModal.hidden = false;
}
function closeRenew() { renewModal.hidden = true; renewTargetId = null; }

$('#renewClose').onclick = closeRenew;
$('#renewCancel').onclick = closeRenew;
renewModal.addEventListener('click', (e) => { if (e.target === renewModal) closeRenew(); });

$('#renewSave').onclick = () => {
  if (!renewTargetId) return;
  const item = $('#renewItem').value.trim();
  const date = $('#renewDate').value;
  if (!item || !date) return alert('Nhập đủ sản phẩm và ngày hết hạn.');
  setRenewal(renewTargetId, { item, date });
  closeRenew();
  renderCustomers();
};
$('#renewDelete').onclick = () => {
  if (!renewTargetId) return;
  deleteRenewal(renewTargetId);
  closeRenew();
  renderCustomers();
};

// Thay các biến gắn với dữ liệu gia hạn cục bộ (không đụng tới [Tên] — cái đó do server thay dựa trên field `name`)
function pronounVars(customer) {
  const g = customer.gender;
  return {
    '[anh/chị]': g === 'male' ? 'anh' : g === 'female' ? 'chị' : 'anh/chị',
    '[Anh/Chị]': g === 'male' ? 'Anh' : g === 'female' ? 'Chị' : 'Anh/Chị',
    '[Ông/Bà]': g === 'male' ? 'Ông' : g === 'female' ? 'Bà' : 'Ông/Bà',
  };
}

// Mẫu "mỗi dòng là một biến thể": chọn ngẫu nhiên một dòng cho mỗi người nhận.
function pickVariant(content, perLine) {
  if (!perLine) return content;
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[Math.floor(Math.random() * lines.length)] : content;
}

// Nội dung cuối cùng cho một khách: chọn biến thể + thay biến phía client
// ([Tên] và Spintax do server xử lý khi gửi).
function composeFor(content, perLine, customer) {
  return applyClientVars(pickVariant(content, perLine), customer);
}

function applyClientVars(content, customer) {
  const r = getRenewal(customer.id);
  const dl = r ? daysLeftFrom(r.date) : null;
  const vars = {
    ...pronounVars(customer),
    '[SĐT]': customer.threadId || '',
    '[SảnPhẩm]': r?.item || '(chưa thiết lập gia hạn)',
    '[NgàyHếtHạn]': r?.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('vi-VN') : '(chưa thiết lập)',
    '[SốNgàyCònLại]': dl === null ? '(chưa thiết lập)' : String(dl),
  };
  let out = content;
  Object.entries(vars).forEach(([k, v]) => { out = out.split(k).join(v); });
  return out;
}

// ============================================================
// CHIẾN DỊCH TỰ ĐỘNG (campaign) — chạy phía trình duyệt, lưu trong IndexedDB
// Giới hạn thật: chỉ hoạt động khi tab này đang mở + đã đăng nhập Zalo.
// Muốn chạy nền thật sự (kể cả tắt trình duyệt) cần thêm scheduler ở backend.
// ============================================================
const CAMPAIGN_KEY = 'zs:campaigns';
const campaignModal = $('#campaignModal');
let editingCampaignId = null;

function getCampaigns() { return ZsDb.getKV(CAMPAIGN_KEY, []); }
function saveCampaigns(list) { ZsDb.setKV(CAMPAIGN_KEY, list); }
function upsertCampaign(cp) {
  const list = getCampaigns();
  const i = list.findIndex((c) => c.id === cp.id);
  if (i === -1) list.push(cp); else list[i] = cp;
  saveCampaigns(list);
}
function deleteCampaign(id) {
  saveCampaigns(getCampaigns().filter((c) => c.id !== id));
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function triggerSummary(cp) {
  if (cp.triggerType === 'tag') return `Khách có nhãn "${cp.tag}"`;
  return `Khách sắp hết hạn trong ${cp.days} ngày`;
}

const CP_BADGE_ON = 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[.04em] bg-green-500/[.14] text-green-300 border border-green-500/30';
const CP_BADGE_OFF = 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[.04em] bg-zinc-500/[.18] text-muted border border-line';

function renderCampaigns() {
  const box = $('#campaignList');
  const list = getCampaigns();
  if (!list.length) {
    box.innerHTML = `<div class="${CP_EMPTY_CLS}">Chưa có chiến dịch nào. Bấm "+ Tạo chiến dịch" để bắt đầu.</div>`;
    return;
  }
  const tpl = (id) => allTemplates().find((t) => t.id === id)?.label || '(mẫu đã xoá)';
  box.innerHTML = list.map((cp) => `
    <div class="cp-card border border-line bg-panel2 rounded-2xl px-4 py-3.5 flex items-start justify-between gap-3" data-id="${cp.id}">
      <div class="min-w-0">
        <div class="font-bold text-sm flex items-center gap-2">
          ${escapeHtml(cp.name)}
          <span class="${cp.active ? CP_BADGE_ON : CP_BADGE_OFF}">${cp.active ? 'Đang bật' : 'Đã tắt'}</span>
        </div>
        <div class="text-xs text-muted mt-1 leading-relaxed">${triggerSummary(cp)} · Mẫu: ${escapeHtml(tpl(cp.templateId))} · Kiểm tra lúc ${cp.hour} mỗi ngày</div>
        <div class="text-[11px] text-muted2 mt-1.5">${cp.lastRunSummary ? escapeHtml(cp.lastRunSummary) : 'Chưa chạy lần nào'}</div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="${CP_ICON_BTN} cp-toggle" title="${cp.active ? 'Tắt' : 'Bật'}">${cp.active ? '⏸' : '▶'}</button>
        <button class="${CP_ICON_BTN} cp-run" title="Chạy thử ngay">⚡</button>
        <button class="${CP_ICON_BTN} cp-edit" title="Sửa">✎</button>
        <button class="${CP_ICON_BTN} cp-del text-rose-400" title="Xoá">🗑</button>
      </div>
    </div>`).join('');

  box.querySelectorAll('.cp-card').forEach((card) => {
    const id = card.dataset.id;
    card.querySelector('.cp-toggle').onclick = () => {
      const cp = getCampaigns().find((c) => c.id === id);
      cp.active = !cp.active;
      upsertCampaign(cp);
      renderCampaigns();
    };
    card.querySelector('.cp-run').onclick = () => runCampaignNow(id);
    card.querySelector('.cp-edit').onclick = () => openCampaignModal(getCampaigns().find((c) => c.id === id));
    card.querySelector('.cp-del').onclick = () => {
      if (confirm('Xoá chiến dịch này?')) { deleteCampaign(id); renderCampaigns(); }
    };
  });
}

// ---- Modal tạo/sửa chiến dịch ----
populateTemplateSelect($('#cpTemplate'), false);

$('#cpTriggerType').onchange = (e) => {
  $('#cpTagWrap').hidden = e.target.value !== 'tag';
  $('#cpRenewWrap').hidden = e.target.value !== 'renew';
};

function openCampaignModal(cp) {
  editingCampaignId = cp?.id || null;
  $('#campaignModalTitle').textContent = cp ? 'Sửa chiến dịch' : 'Tạo chiến dịch';
  $('#campaignDelete').hidden = !cp;

  const tags = uniqueTagCounts();
  $('#cpTag').innerHTML = tags.length
    ? tags.map(([tag]) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('')
    : '<option value="">(chưa có nhãn nào — thêm nhãn cho khách trước)</option>';

  $('#cpName').value = cp?.name || '';
  $('#cpTemplate').value = cp?.templateId || MESSAGE_TEMPLATES[0].id;
  $('#cpTriggerType').value = cp?.triggerType || 'tag';
  $('#cpTag').value = cp?.tag || (tags[0]?.[0] || '');
  $('#cpDays').value = cp?.days ?? 7;
  $('#cpCooldown').value = cp?.cooldownDays ?? 14;
  $('#cpHour').value = cp?.hour || '09:00';
  $('#cpTagWrap').hidden = $('#cpTriggerType').value !== 'tag';
  $('#cpRenewWrap').hidden = $('#cpTriggerType').value !== 'renew';

  campaignModal.hidden = false;
}
function closeCampaignModal() { campaignModal.hidden = true; editingCampaignId = null; }

$('#btnNewCampaign').onclick = () => openCampaignModal(null);
$('#campaignClose').onclick = closeCampaignModal;
$('#campaignCancel').onclick = closeCampaignModal;
campaignModal.addEventListener('click', (e) => { if (e.target === campaignModal) closeCampaignModal(); });

$('#campaignSave').onclick = () => {
  const name = $('#cpName').value.trim();
  if (!name) return alert('Đặt tên cho chiến dịch.');
  const triggerType = $('#cpTriggerType').value;
  if (triggerType === 'tag' && !$('#cpTag').value) return alert('Chưa có nhãn để chọn — hãy gắn nhãn cho khách hàng trước.');

  const existing = editingCampaignId ? getCampaigns().find((c) => c.id === editingCampaignId) : null;
  const cp = {
    id: editingCampaignId || ('cp_' + Date.now().toString(36)),
    name,
    templateId: $('#cpTemplate').value,
    triggerType,
    tag: $('#cpTag').value,
    days: Number($('#cpDays').value) || 7,
    cooldownDays: Number($('#cpCooldown').value) || 14,
    hour: $('#cpHour').value || '09:00',
    active: existing ? existing.active : true,
    lastRunDate: existing?.lastRunDate || null,
    lastRunSummary: existing?.lastRunSummary || '',
    sentLog: existing?.sentLog || {},
  };
  upsertCampaign(cp);
  closeCampaignModal();
  renderCampaigns();
};

$('#campaignDelete').onclick = () => {
  if (!editingCampaignId) return;
  if (confirm('Xoá chiến dịch này?')) {
    deleteCampaign(editingCampaignId);
    closeCampaignModal();
    renderCampaigns();
  }
};

// ---- Engine: xác định đối tượng + gửi tuần tự ----
function campaignTargets(cp) {
  if (cp.triggerType === 'tag') {
    return customers.filter((c) => c.tag === cp.tag);
  }
  // renew: khách có dữ liệu gia hạn cục bộ, còn <= N ngày (kể cả đã cận/quá hạn)
  return customers.filter((c) => {
    const r = getRenewal(c.id);
    if (!r) return false;
    const dl = daysLeftFrom(r.date);
    return dl !== null && dl <= cp.days;
  });
}

async function runCampaignNow(id) {
  const cp = getCampaigns().find((c) => c.id === id);
  if (!cp) return;
  const tpl = allTemplates().find((t) => t.id === cp.templateId);
  if (!tpl) { alert('Mẫu tin nhắn của chiến dịch này không còn tồn tại.'); return; }

  const now = Date.now();
  const cooldownMs = cp.cooldownDays * 86400000;
  const targets = campaignTargets(cp).filter((c) => {
    const last = cp.sentLog[c.id];
    return !last || (now - last) > cooldownMs;
  });

  if (!targets.length) {
    cp.lastRunDate = todayStr();
    cp.lastRunSummary = `Chạy lúc ${new Date().toLocaleString('vi-VN')} — không có khách phù hợp (hoặc đang trong thời gian chờ).`;
    upsertCampaign(cp);
    renderCampaigns();
    return;
  }

  let ok = 0, fail = 0;
  for (const cust of targets) {
    const content = composeFor(tpl.content, !!tpl.perLine, cust);
    try {
      const r = await api('/api/v1/zalosend/send', {
        method: 'POST',
        body: JSON.stringify({ threadId: cust.threadId, content, name: cust.name, group: !!cust.isGroup }),
      });
      if (r.ok) { ok++; cp.sentLog[cust.id] = Date.now(); } else fail++;
    } catch (e) { fail++; }
    await new Promise((res) => setTimeout(res, 1200)); // giãn cách chống spam
  }

  cp.lastRunDate = todayStr();
  cp.lastRunSummary = `Chạy lúc ${new Date().toLocaleString('vi-VN')} — đã gửi ${ok}/${targets.length}${fail ? `, lỗi ${fail}` : ''}.`;
  upsertCampaign(cp);
  renderCampaigns();
}

function checkCampaigns() {
  if ($('#dashView').hidden) return; // chưa đăng nhập thì không chạy
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  getCampaigns().forEach((cp) => {
    if (!cp.active) return;
    if (cp.lastRunDate === todayStr()) return; // đã chạy hôm nay rồi
    if (hh >= cp.hour) runCampaignNow(cp.id);
  });
}
setInterval(checkCampaigns, 60 * 1000);
