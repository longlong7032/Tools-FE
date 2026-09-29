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

async function loadCustomers() {
  customers = await api('/api/v1/zalosend/customers');
  renderCustomers();
}

function renderCustomers() {
  const list = $('#customerList');
  list.innerHTML = '';
  customers.forEach((c) => {
    const li = el('li', 'flex items-center gap-2.5 px-2 py-2.5 rounded-[10px] hover:bg-panel2 transition');
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
      ${renewBtnHtml(c)}
      <button class="row-action del bg-transparent border-none text-muted2 cursor-pointer h-6 rounded-[7px] flex items-center justify-center shrink-0 hover:text-rose-400 hover:bg-rose-500/[.12] transition" data-id="${c.id}" title="Xoá">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>`;
    list.appendChild(li);
  });
  $('#custCount').textContent = `${customers.length} khách`;

  // dropdown gửi đơn lẻ
  const sel = $('#singleTarget');
  sel.innerHTML = customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.threadId)}</option>`)
    .join('');

  // dropdown xuất hội thoại
  const expSel = $('#exportTarget');
  expSel.innerHTML = '<option value="">— Nhập threadId thủ công bên dưới —</option>' + customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.threadId)}${c.isGroup ? ' (nhóm)' : ''}</option>`)
    .join('');

  list.querySelectorAll('.del').forEach((b) => {
    b.onclick = async () => {
      await api('/api/v1/zalosend/customers/' + b.dataset.id, { method: 'DELETE' });
      loadCustomers();
    };
  });

  list.querySelectorAll('.renew-btn').forEach((b) => {
    b.onclick = () => openRenew(b.dataset.id);
  });

  renderTagFilters();
  applyTagFilter();
}

function renewBtnHtml(c) {
  const r = getRenewal(c.id);
  const dl = r ? daysLeftFrom(r.date) : null;
  let dueCls = '';
  let colorCls = 'text-muted2 hover:text-indigo-300 hover:bg-indigo-500/[.14]';
  let title = 'Thiết lập gia hạn (domain/hosting...)';
  if (dl !== null) {
    if (dl <= 7) { dueCls = ' due-urgent'; colorCls = 'text-rose-400 hover:text-indigo-300 hover:bg-indigo-500/[.14]'; }
    else if (dl <= 30) { dueCls = ' due-soon'; colorCls = 'text-amber-400 hover:text-indigo-300 hover:bg-indigo-500/[.14]'; }
    title = `${r.item} — còn ${dl} ngày (${new Date(r.date + 'T00:00:00').toLocaleDateString('vi-VN')})`;
  }
  return `<button class="row-action renew-btn${dueCls} bg-transparent border-none cursor-pointer h-6 rounded-[7px] flex items-center justify-center shrink-0 transition ${colorCls}" data-id="${c.id}" title="${escapeHtml(title)}">
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

  // Chọn nhanh nhãn khi gửi hàng loạt (điền vào ô #bcTag)
  const bcBox = $('#bcTagChips');
  if (!tags.length) {
    bcBox.hidden = true;
    bcBox.innerHTML = '';
  } else {
    bcBox.hidden = false;
    bcBox.innerHTML = tags.map(([tag, count]) => tagChipHtml(tag, count, $('#bcTag').value === tag)).join('');
    bcBox.querySelectorAll('.tag-chip').forEach((chip) => {
      chip.onclick = () => {
        const isActive = chip.className === TAG_CHIP_ON;
        $('#bcTag').value = isActive ? '' : chip.dataset.tag;
        bcBox.querySelectorAll('.tag-chip').forEach((c) => { c.className = TAG_CHIP_OFF; });
        if (!isActive) chip.className = TAG_CHIP_ON;
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
  };
  const r = await api('/api/v1/zalosend/customers', { method: 'POST', body: JSON.stringify(body) });
  if (r.error) return alert(r.error);
  $('#cName').value = $('#cThread').value = $('#cTag').value = '';
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

document.querySelectorAll('.chat__tabs > .tab').forEach((t) => {
  t.onclick = () => {
    setActiveTab(document.querySelectorAll('.chat__tabs > .tab'), t);
    $('#tab-single').hidden = t.dataset.tab !== 'single';
    $('#tab-broadcast').hidden = t.dataset.tab !== 'broadcast';
    $('#tab-campaign').hidden = t.dataset.tab !== 'campaign';
    $('#tab-export').hidden = t.dataset.tab !== 'export';
    if (t.dataset.tab === 'campaign') renderCampaigns();
  };
});

// ---------- Gửi đơn lẻ ----------
$('#btnSendSingle').onclick = async () => {
  const id = $('#singleTarget').value;
  const cust = customers.find((c) => c.id === id);
  if (!cust) return alert('Chọn khách hàng trước.');
  const raw = $('#singleContent').value.trim();
  if (!raw) return alert('Nhập nội dung.');
  const content = applyClientVars(raw, cust);

  const box = $('#singleResult');
  logLine(box, `Đang gửi tới ${cust.name}...`, 'info');
  $('#btnSendSingle').disabled = true;

  const r = await api('/api/v1/zalosend/send', {
    method: 'POST',
    body: JSON.stringify({
      threadId: cust.threadId,
      content,
      name: cust.name,
      group: !!cust.isGroup,
    }),
  });
  $('#btnSendSingle').disabled = false;

  if (r.ok) logLine(box, `✅ Đã gửi: "${r.text}"`, 'ok');
  else logLine(box, `❌ Lỗi: ${r.error}`, 'fail');
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

$('#btnBroadcast').onclick = () => {
  const content = $('#bcContent').value.trim();
  if (!content) return alert('Nhập nội dung.');

  const ids = selectedIds();
  bcState = { total: 0, ok: 0, fail: 0 };
  bcLog().innerHTML = '';
  $('#progressBar').style.width = '0%';
  $('#cOk').textContent = $('#cFail').textContent = $('#cLeft').textContent = '0';

  socket.emit('broadcast:start', { ids, content, tag: $('#bcTag').value.trim() });
  $('#btnBroadcast').disabled = true;
  $('#btnStop').hidden = false;
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
      tag: tagOverride || (isGroup ? 'nhóm' : 'bạn bè'),
    }));

  const r = await api('/api/v1/zalosend/customers/bulk', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  if (r.error) return alert(r.error);
  closeImport();
  await loadCustomers();
  alert(`Đã thêm ${r.added} mục (bỏ qua ${r.skipped} trùng). Tổng: ${r.total}.`);
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

// Mẫu tuỳ chỉnh do người dùng tự thêm — lưu trên trình duyệt (localStorage)
const CUSTOM_TPL_KEY = 'zs:customTemplates';
function getCustomTemplates() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TPL_KEY) || '[]'); } catch (e) { return []; }
}
function saveCustomTemplates(list) { localStorage.setItem(CUSTOM_TPL_KEY, JSON.stringify(list)); }
function allTemplates() { return [...MESSAGE_TEMPLATES, ...getCustomTemplates()]; }

function populateTemplateSelect(select, withPlaceholder) {
  const current = select.value;
  select.innerHTML =
    (withPlaceholder ? '<option value="">— Chọn mẫu có sẵn (tuỳ chọn) —</option>' : '') +
    allTemplates().map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join('');
  if ([...select.options].some((o) => o.value === current)) select.value = current;
}
populateTemplateSelect($('#templatePicker'), true);

$('#templatePicker').onchange = (e) => {
  const tpl = allTemplates().find((t) => t.id === e.target.value);
  if (!tpl) return;
  const box = $('#singleContent');
  if (box.value.trim() && !confirm('Nội dung hiện tại sẽ bị thay bằng mẫu đã chọn. Tiếp tục?')) {
    e.target.value = '';
    return;
  }
  box.value = tpl.content;
  e.target.value = '';
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
          <div class="font-bold text-[13px] flex items-center gap-[7px]">
            ${escapeHtml(t.label)}
            <span class="${isCustom ? TPL_TAG_CUSTOM : TPL_TAG_BUILTIN}">${isCustom ? 'Tuỳ chỉnh' : 'Có sẵn'}</span>
          </div>
          <div class="text-[11.5px] text-muted mt-[3px] leading-relaxed">${escapeHtml(t.content)}</div>
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
      startEditTemplate(null, { label: t.label + ' (bản sao)', content: t.content });
    };
  });
}

function startEditTemplate(existing, prefill) {
  editingTplId = existing?.id || null;
  $('#tplFormTitle').textContent = existing ? 'Sửa mẫu' : 'Thêm mẫu mới';
  $('#tplName').value = existing?.label || prefill?.label || '';
  $('#tplContent').value = existing?.content || prefill?.content || '';
  $('#tplCancelEdit').hidden = !existing;
  $('#tplName').focus();
}

function refreshAllTemplateSelects() {
  populateTemplateSelect($('#templatePicker'), true);
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
  if (!label || !content) return alert('Nhập đủ tên mẫu và nội dung.');

  const list = getCustomTemplates();
  if (editingTplId) {
    const i = list.findIndex((t) => t.id === editingTplId);
    if (i !== -1) list[i] = { ...list[i], label, content };
  } else {
    list.push({ id: 'custom_' + Date.now().toString(36), label, content });
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
// GIA HẠN (domain/hosting...) — lưu cục bộ trên trình duyệt
// Lưu ý: Zalo API hiện chưa trả về nhãn (label) đã gắn sẵn trong app Zalo,
// nên phần "đồng bộ tag/gia hạn" này chạy hoàn toàn phía FE (localStorage),
// chưa đồng bộ với server chung — cần backend hỗ trợ nếu muốn dùng thật.
// ============================================================
const RENEW_KEY = 'zs:renew';

function getAllRenewals() {
  try { return JSON.parse(localStorage.getItem(RENEW_KEY) || '{}'); } catch (e) { return {}; }
}
function getRenewal(customerId) {
  return getAllRenewals()[customerId] || null;
}
function setRenewal(customerId, data) {
  const all = getAllRenewals();
  all[customerId] = data;
  localStorage.setItem(RENEW_KEY, JSON.stringify(all));
}
function deleteRenewal(customerId) {
  const all = getAllRenewals();
  delete all[customerId];
  localStorage.setItem(RENEW_KEY, JSON.stringify(all));
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
function applyClientVars(content, customer) {
  const r = getRenewal(customer.id);
  const dl = r ? daysLeftFrom(r.date) : null;
  const vars = {
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
// CHIẾN DỊCH TỰ ĐỘNG (campaign) — chạy phía trình duyệt (localStorage)
// Giới hạn thật: chỉ hoạt động khi tab này đang mở + đã đăng nhập Zalo.
// Muốn chạy nền thật sự (kể cả tắt trình duyệt) cần thêm scheduler ở backend.
// ============================================================
const CAMPAIGN_KEY = 'zs:campaigns';
const campaignModal = $('#campaignModal');
let editingCampaignId = null;

function getCampaigns() {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || '[]'); } catch (e) { return []; }
}
function saveCampaigns(list) { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(list)); }
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
    const content = applyClientVars(tpl.content, cust);
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
