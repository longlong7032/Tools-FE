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
  if (logged) loadCustomers();
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

async function loadCustomers() {
  customers = await api('/api/v1/zalosend/customers');
  renderCustomers();
}

function renderCustomers() {
  const list = $('#customerList');
  list.innerHTML = '';
  customers.forEach((c) => {
    const li = el('li');
    li.innerHTML = `
      <input type="checkbox" class="pick" data-id="${c.id}" />
      <div class="ci-main">
        <div class="ci-name">${escapeHtml(c.name)}</div>
        <div class="ci-sub">${escapeHtml(c.threadId)}</div>
      </div>
      ${c.isGroup ? '<span class="ci-badge">Nhóm</span>' : ''}
      ${c.tag ? `<span class="ci-tag">${escapeHtml(c.tag)}</span>` : ''}
      <button class="del" data-id="${c.id}" title="Xoá">✕</button>`;
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
  document.querySelectorAll('.pick').forEach((c) => (c.checked = e.target.checked));
};

function selectedIds() {
  return [...document.querySelectorAll('.pick:checked')].map((c) => c.dataset.id);
}

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('tab--active'));
    t.classList.add('tab--active');
    $('#tab-single').hidden = t.dataset.tab !== 'single';
    $('#tab-broadcast').hidden = t.dataset.tab !== 'broadcast';
  };
});

// ---------- Gửi đơn lẻ ----------
$('#btnSendSingle').onclick = async () => {
  const id = $('#singleTarget').value;
  const cust = customers.find((c) => c.id === id);
  if (!cust) return alert('Chọn khách hàng trước.');
  const content = $('#singleContent').value.trim();
  if (!content) return alert('Nhập nội dung.');

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
      return `<li class="irow ${sel}" data-id="${id}">
        ${r.avatar ? `<img class="avatar" src="${r.avatar}" alt="" />` : '<div class="avatar"></div>'}
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
  const items = src
    .filter((r) => importPicked.has(r.userId || r.groupId))
    .map((r) => ({
      name: r.name,
      threadId: r.userId || r.groupId,
      isGroup,
      tag: isGroup ? 'nhóm' : 'bạn bè',
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
