'use strict';

/**
 * Kho dữ liệu ZaloSend CRM — toàn bộ nằm trong IndexedDB của trình duyệt.
 * Server chỉ lo đăng nhập/đăng xuất Zalo và lấy dữ liệu (bạn bè, nhóm, hội thoại).
 *
 * Sau `await ZsDb.init()`, mọi lần đọc là đồng bộ (đọc từ cache trong RAM);
 * ghi cập nhật cache ngay rồi ghi xuống IndexedDB.
 *  - customers: object store riêng (keyPath `id`)
 *  - kv: mẫu tin nhắn tuỳ chỉnh, gia hạn, chiến dịch (keyPath `key`)
 */
const ZsDb = (() => {
  const DB_NAME = 'zalosend';
  const DB_VERSION = 1;
  const LEGACY_KV_KEYS = ['zs:customTemplates', 'zs:renew', 'zs:campaigns']; // trước đây ở localStorage

  let db = null;
  const customerCache = new Map(); // id -> customer
  const kvCache = new Map();       // key -> value

  const reqP = (req) => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const txDone = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Giao dịch IndexedDB bị huỷ'));
  });

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('customers')) d.createObjectStore('customers', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const newId = () => (crypto.randomUUID
    ? crypto.randomUUID()
    : 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

  // 'male' | 'female' | '' (chưa rõ) — dùng để đổi xưng hô anh/chị
  const normalizeGender = (g) => (g === 'male' || g === 'female' ? g : '');

  function normalize(input, id) {
    const threadId = String(input.threadId ?? '').trim();
    if (!threadId) throw new Error('Thiếu SĐT/UserId (threadId)');
    return {
      id,
      name: String(input.name ?? '').trim() || 'Khách hàng',
      threadId,
      tag: String(input.tag ?? '').trim(),
      isGroup: !!input.isGroup,
      gender: normalizeGender(input.gender),
    };
  }

  // Ghi xuống IndexedDB; nếu DB không dùng được (chế độ riêng tư...) thì chỉ giữ trong RAM.
  async function putAll(store, records) {
    if (!db) return;
    const tx = db.transaction(store, 'readwrite');
    records.forEach((r) => tx.objectStore(store).put(r));
    await txDone(tx);
  }

  async function migrateLegacyLocalStorage() {
    const moved = [];
    for (const key of LEGACY_KV_KEYS) {
      if (kvCache.has(key)) continue; // đã có trong IndexedDB thì không ghi đè
      let raw = null;
      try { raw = localStorage.getItem(key); } catch (e) { /* bỏ qua */ }
      if (raw == null) continue;
      try {
        const value = JSON.parse(raw);
        kvCache.set(key, value);
        moved.push({ key, value });
      } catch (e) { /* dữ liệu hỏng — bỏ qua */ }
    }
    if (!moved.length) return;
    await putAll('kv', moved);
    moved.forEach(({ key }) => { try { localStorage.removeItem(key); } catch (e) { /* bỏ qua */ } });
  }

  async function init() {
    try {
      db = await open();
      const [customers, kvRows] = await Promise.all([
        reqP(db.transaction('customers').objectStore('customers').getAll()),
        reqP(db.transaction('kv').objectStore('kv').getAll()),
      ]);
      customers.forEach((c) => customerCache.set(c.id, c));
      kvRows.forEach((r) => kvCache.set(r.key, r.value));
      await migrateLegacyLocalStorage();
      // Xin trình duyệt không tự dọn dữ liệu này khi thiếu bộ nhớ.
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    } catch (err) {
      db = null;
      console.warn('[ZsDb] IndexedDB không dùng được, dữ liệu chỉ giữ tạm trong phiên này:', err);
    }
  }

  const customers = {
    list: () => [...customerCache.values()],

    async add(input) {
      const c = normalize(input, newId());
      await putAll('customers', [c]);
      customerCache.set(c.id, c);
      return c;
    },

    /**
     * Thêm nhiều khách cùng lúc, bỏ qua threadId đã tồn tại.
     * Khách đã có mà chưa rõ giới tính thì được bổ sung giới tính từ dữ liệu import.
     */
    async addMany(inputs) {
      const byThread = new Map([...customerCache.values()].map((c) => [c.threadId, c]));
      const created = [];
      const enriched = [];
      for (const item of inputs) {
        const threadId = String(item.threadId ?? '').trim();
        if (!threadId) continue;
        const cur = byThread.get(threadId);
        if (cur) {
          const g = normalizeGender(item.gender);
          if (g && !cur.gender) enriched.push({ ...cur, gender: g });
          continue;
        }
        const c = normalize(item, newId());
        byThread.set(threadId, c);
        created.push(c);
      }
      await putAll('customers', [...created, ...enriched]);
      created.forEach((c) => customerCache.set(c.id, c));
      enriched.forEach((c) => customerCache.set(c.id, c));
      return {
        added: created.length,
        updated: enriched.length,
        skipped: inputs.length - created.length - enriched.length,
        total: customerCache.size,
      };
    },

    async update(id, patch) {
      const cur = customerCache.get(id);
      if (!cur) throw new Error('Không tìm thấy khách hàng');
      const next = normalize({ ...cur, ...patch }, id);
      await putAll('customers', [next]);
      customerCache.set(id, next);
      return next;
    },

    async remove(id) {
      if (db) {
        const tx = db.transaction('customers', 'readwrite');
        tx.objectStore('customers').delete(id);
        await txDone(tx);
      }
      return customerCache.delete(id);
    },
  };

  /** Đọc đồng bộ từ cache. */
  function getKV(key, fallback) {
    return kvCache.has(key) ? kvCache.get(key) : fallback;
  }

  /** Cập nhật cache ngay (đọc lại thấy liền), ghi IndexedDB ở nền. */
  function setKV(key, value) {
    kvCache.set(key, value);
    putAll('kv', [{ key, value }]).catch((err) => console.warn('[ZsDb] Không lưu được', key, err));
  }

  return { init, customers, getKV, setKV };
})();
