/* global io */
'use strict';

const BASE_URL = 'https://tool-8s0g.onrender.com';
const socket = io(BASE_URL);

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

function logLine(box, text, cls = 'info') {
  const line = el('div', `l ${cls}`);
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
function setPill(state) {
  const pill = $('#connPill');
  const txt = $('#connText');
  pill.className = 'pill';
  if (state === 'on') { pill.classList.add('pill--on'); txt.textContent = 'Đã đăng nhập'; }
  else if (state === 'wait') { pill.classList.add('pill--wait'); txt.textContent = 'Đang chờ quét QR'; }
  else { pill.classList.add('pill--off'); txt.textContent = 'Chưa đăng nhập'; }
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

$('#btnLogin').onclick = () => {
  qrReady = false;
  $('#btnLogin').disabled = true;
  $('#btnCancel').hidden = false;
  $('#loginLog').innerHTML = '';
  setQrBox('<div class="qr-placeholder"><span class="spinner"></span>Đang khởi tạo phiên đăng nhập...</div>');
  socket.emit('login:start');
};

$('#btnCancel').onclick = () => {
  socket.emit('login:cancel');
  $('#btnLogin').disabled = false;
  $('#btnCancel').hidden = true;
  setQrBox('<div class="qr-placeholder">Mã QR sẽ hiện ở đây</div>');
};

socket.on('login:status', (s) => {
  setPill(s.loggedIn ? 'on' : 'off');
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
    setQrBox(`<div class="qr-placeholder"><span class="spinner"></span>${escapeHtml(message)}</div>`);
  }
});

socket.on('login:done', (status) => {
  $('#btnLogin').disabled = false;
  $('#btnCancel').hidden = true;
  if (status.loggedIn) {
    setPill('on');
    logLine($('#loginLog'), 'Đăng nhập thành công!', 'ok');
    showView(true);
  } else {
    setPill('off');
    setQrBox('<div class="qr-placeholder qr-placeholder--fail">❌ Chưa đăng nhập được. Vui lòng thử lại.</div>');
    logLine($('#loginLog'), 'Chưa đăng nhập được.', 'fail');
  }
});

socket.on('login:error', ({ message }) => {
  $('#btnLogin').disabled = false;
  $('#btnCancel').hidden = true;
  setPill('off');
  setQrBox(`<div class="qr-placeholder qr-placeholder--fail">❌ Lỗi: ${escapeHtml(message)}<br />Vui lòng bấm "Đăng nhập Zalo" để thử lại.</div>`);
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
    const li = el('li');
    li.dataset.tag = c.tag || '';
    const initial = escapeHtml((c.name || '?').trim().charAt(0).toUpperCase() || '?');
    li.innerHTML = `
      <input type="checkbox" class="pick" data-id="${c.id}" />
      <div class="ci-avatar">${initial}</div>
      <div class="ci-main">
        <div class="ci-name">${escapeHtml(c.name)}</div>
        <div class="ci-sub">${escapeHtml(c.threadId)}</div>
      </div>
      ${c.isGroup ? '<span class="ci-badge">Nhóm</span>' : ''}
      ${c.tag ? `<span class="ci-tag">${escapeHtml(c.tag)}</span>` : ''}
      ${renewBtnHtml(c)}
      <button class="del" data-id="${c.id}" title="Xoá">
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
  let cls = '';
  let title = 'Thiết lập gia hạn (domain/hosting...)';
  if (dl !== null) {
    if (dl <= 7) cls = ' due-urgent';
    else if (dl <= 30) cls = ' due-soon';
    title = `${r.item} — còn ${dl} ngày (${new Date(r.date + 'T00:00:00').toLocaleDateString('vi-VN')})`;
  }
  return `<button class="renew-btn${cls}" data-id="${c.id}" title="${escapeHtml(title)}">
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

function renderTagFilters() {
  const tags = uniqueTagCounts();
  const box = $('#tagFilters');
  if (!tags.length) {
    box.hidden = true;
    box.innerHTML = '';
  } else {
    box.hidden = false;
    box.innerHTML = tags.map(([tag, count]) => `
      <button type="button" class="tag-chip${tag === activeTagFilter ? ' active' : ''}" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)} <span class="cnt">${count}</span>
      </button>`).join('');
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
    bcBox.innerHTML = tags.map(([tag, count]) => `
      <button type="button" class="tag-chip${$('#bcTag').value === tag ? ' active' : ''}" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)} <span class="cnt">${count}</span>
      </button>`).join('');
    bcBox.querySelectorAll('.tag-chip').forEach((chip) => {
      chip.onclick = () => {
        const isActive = chip.classList.contains('active');
        $('#bcTag').value = isActive ? '' : chip.dataset.tag;
        bcBox.querySelectorAll('.tag-chip').forEach((c) => c.classList.remove('active'));
        if (!isActive) chip.classList.add('active');
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
document.querySelectorAll('.chat__tabs > .tab').forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll('.chat__tabs > .tab').forEach((x) => x.classList.remove('tab--active'));
    t.classList.add('tab--active');
    $('#tab-single').hidden = t.dataset.tab !== 'single';
    $('#tab-broadcast').hidden = t.dataset.tab !== 'broadcast';
    $('#tab-campaign').hidden = t.dataset.tab !== 'campaign';
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
    importModal.querySelectorAll('.tab').forEach((x) => x.classList.remove('tab--active'));
    t.classList.add('tab--active');
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

async function loadImport(source, refresh) {
  const list = $('#importList');
  if (refresh || !importData[source]) {
    list.innerHTML = '<div class="import-empty">Đang tải từ Zalo...</div>';
    $('#importInfo').textContent = '';
    try {
      importData[source] = await api(`/api/v1/zalosend/zalo/${source}${refresh ? '?refresh=1' : ''}`);
      if (importData[source].error) throw new Error(importData[source].error);
    } catch (err) {
      list.innerHTML = `<div class="import-empty">Lỗi: ${escapeHtml(err.message || 'không tải được')}</div>`;
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

  if (!rows.length) {
    list.innerHTML = '<div class="import-empty">Không có mục nào.</div>';
  } else {
    // Giới hạn render 500 dòng để mượt (danh sách nhóm có thể rất lớn).
    const shown = rows.slice(0, 500);
    list.innerHTML = shown.map((r) => {
      const id = r.userId || r.groupId;
      const sub = isGroup ? `${r.members || 0} thành viên` : (r.phone || id);
      const sel = importPicked.has(id) ? 'sel' : '';
      const initial = escapeHtml((r.name || '?').trim().charAt(0).toUpperCase() || '?');
      return `<li class="irow ${sel}" data-id="${id}">
        ${r.avatar ? `<img class="avatar" src="${r.avatar}" alt="" />` : `<div class="avatar ci-avatar">${initial}</div>`}
        <div class="ci-main">
          <div class="ci-name">${escapeHtml(r.name)}</div>
          <div class="ci-sub">${escapeHtml(String(sub))}</div>
        </div>
        <span class="check">✓</span>
      </li>`;
    }).join('') + (rows.length > 500 ? `<div class="import-empty">…và ${rows.length - 500} mục nữa — hãy tìm kiếm để thu hẹp.</div>` : '');

    list.querySelectorAll('.irow').forEach((row) => {
      row.onclick = () => {
        const id = row.dataset.id;
        if (importPicked.has(id)) { importPicked.delete(id); row.classList.remove('sel'); }
        else { importPicked.add(id); row.classList.add('sel'); }
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

function populateTemplateSelect(select, withPlaceholder) {
  select.innerHTML =
    (withPlaceholder ? '<option value="">— Chọn mẫu có sẵn (tuỳ chọn) —</option>' : '') +
    MESSAGE_TEMPLATES.map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join('');
}
populateTemplateSelect($('#templatePicker'), true);

$('#templatePicker').onchange = (e) => {
  const tpl = MESSAGE_TEMPLATES.find((t) => t.id === e.target.value);
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

function renderCampaigns() {
  const box = $('#campaignList');
  const list = getCampaigns();
  if (!list.length) {
    box.innerHTML = '<div class="cp-empty">Chưa có chiến dịch nào. Bấm "+ Tạo chiến dịch" để bắt đầu.</div>';
    return;
  }
  const tpl = (id) => MESSAGE_TEMPLATES.find((t) => t.id === id)?.label || '(mẫu đã xoá)';
  box.innerHTML = list.map((cp) => `
    <div class="cp-card" data-id="${cp.id}">
      <div class="cp-card__main">
        <div class="cp-card__name">
          ${escapeHtml(cp.name)}
          <span class="cp-badge ${cp.active ? 'cp-badge--on' : 'cp-badge--off'}">${cp.active ? 'Đang bật' : 'Đã tắt'}</span>
        </div>
        <div class="cp-card__desc">${triggerSummary(cp)} · Mẫu: ${escapeHtml(tpl(cp.templateId))} · Kiểm tra lúc ${cp.hour} mỗi ngày</div>
        <div class="cp-card__meta">${cp.lastRunSummary ? escapeHtml(cp.lastRunSummary) : 'Chưa chạy lần nào'}</div>
      </div>
      <div class="cp-card__actions">
        <button class="cp-icon-btn cp-toggle" title="${cp.active ? 'Tắt' : 'Bật'}">${cp.active ? '⏸' : '▶'}</button>
        <button class="cp-icon-btn cp-run" title="Chạy thử ngay">⚡</button>
        <button class="cp-icon-btn cp-edit" title="Sửa">✎</button>
        <button class="cp-icon-btn cp-del" title="Xoá" style="color:var(--fail)">🗑</button>
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
  const tpl = MESSAGE_TEMPLATES.find((t) => t.id === cp.templateId);
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
