/**
 * Tool Hub — Workspace Launcher
 * Global app-switcher injected into every module (Shadow DOM isolated so it
 * never collides with a page's own Bootstrap/Tailwind/custom CSS).
 * Also tracks "recently used" modules in localStorage so the Dashboard
 * can surface them — the one bit of cross-module linkage that persists.
 */
(function () {
  "use strict";

  if (window.__wsLauncherInit) return;
  window.__wsLauncherInit = true;

  var MODULES = [
    {
      id: "hub",
      name: "Dashboard",
      desc: "Tổng quan workspace",
      href: "/",
      match: function (p) { return p === "/" || p === "/index.html"; },
      icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
    },
    {
      id: "zalosend",
      name: "ZaloSend CRM",
      desc: "Gửi tin nhắn Zalo hàng loạt",
      href: "/zalosend",
      match: function (p) { return p.indexOf("/zalosend") === 0; },
      icon: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4.2-1.1L4 20l1.1-4.3A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 1 1 21 11.5Z"/>'
    },
    {
      id: "screenshoot",
      name: "ScreenShoot",
      desc: "Chụp mockup thiết bị",
      href: "/screenshoot",
      match: function (p) { return p.indexOf("/screenshoot") === 0; },
      icon: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 5h6"/><circle cx="12" cy="18" r="1"/>'
    },
    {
      id: "vietqr",
      name: "VietQR",
      desc: "Tạo mã QR chuyển khoản",
      href: "/vietqr/vietqr.html",
      match: function (p) { return p.indexOf("/vietqr") === 0; },
      icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3"/>'
    },
    {
      id: "banner",
      name: "Auto Banner",
      desc: "Tạo banner quảng cáo",
      href: "/banner",
      match: function (p) { return p.indexOf("/banner") === 0; },
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m21 16-5-5-4 4-2-2-7 7"/>'
    },
    {
      id: "sale-report",
      name: "Hợp đồng & Báo giá",
      desc: "Soạn hợp đồng, báo giá bán hàng",
      href: "/sale-report",
      match: function (p) { return p.indexOf("/sale-report") === 0; },
      icon: '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>'
    }
  ];

  var RECENT_KEY = "wsnav:recent";

  function getCurrentModule() {
    var p = window.location.pathname;
    for (var i = 0; i < MODULES.length; i++) {
      if (MODULES[i].match(p)) return MODULES[i];
    }
    return null;
  }

  function recordVisit(mod) {
    if (!mod) return;
    try {
      var list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      list = list.filter(function (id) { return id !== mod.id; });
      list.unshift(mod.id);
      list = list.slice(0, 4);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (e) { /* localStorage unavailable — non-critical */ }
  }

  function getRecent(excludeId) {
    try {
      var ids = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return ids
        .filter(function (id) { return id !== excludeId; })
        .map(function (id) {
          for (var i = 0; i < MODULES.length; i++) {
            if (MODULES[i].id === id) return MODULES[i];
          }
          return null;
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function iconSvg(pathData, size) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      pathData + '</svg>';
  }

  function build() {
    var current = getCurrentModule();
    recordVisit(current);

    var host = document.createElement("div");
    host.id = "ws-launcher-root";
    var shadow = host.attachShadow({ mode: "open" });

    var style = document.createElement("style");
    style.textContent = [
      ":host{all:initial;}",
      "*{box-sizing:border-box;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;}",
      ".fab{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:50px;height:50px;border-radius:16px;",
      "background:linear-gradient(155deg,#1e293b,#0b1220);border:1px solid rgba(255,255,255,.08);",
      "box-shadow:0 8px 24px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.2);cursor:pointer;",
      "display:flex;align-items:center;justify-content:center;color:#e2e8f0;",
      "transition:transform .15s ease,box-shadow .15s ease;}",
      ".fab:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.42),0 3px 8px rgba(0,0,0,.25);}",
      ".fab:active{transform:translateY(0);}",
      ".fab .dot{position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:999px;",
      "background:#22c55e;border:2px solid #0b1220;}",
      ".panel{position:fixed;right:18px;bottom:78px;z-index:2147483000;width:308px;max-width:calc(100vw - 36px);",
      "background:#0b1220;border:1px solid rgba(255,255,255,.08);border-radius:18px;",
      "box-shadow:0 20px 50px rgba(0,0,0,.5);overflow:hidden;",
      "opacity:0;transform:translateY(8px) scale(.98);pointer-events:none;",
      "transition:opacity .15s ease,transform .15s ease;}",
      ".panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}",
      ".ph{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);}",
      ".ph .logo{width:28px;height:28px;border-radius:8px;background:#f4f4f5;color:#0b1220;",
      "display:flex;align-items:center;justify-content:center;flex-shrink:0;}",
      ".ph .t{flex:1;min-width:0;}",
      ".ph .t b{display:block;font-size:12.5px;font-weight:700;color:#f4f4f5;letter-spacing:-.01em;}",
      ".ph .t span{display:block;font-size:10px;color:#71717a;margin-top:1px;}",
      ".body{max-height:min(60vh,420px);overflow-y:auto;padding:8px;}",
      ".label{padding:8px 8px 4px;font-size:9.5px;font-weight:700;text-transform:uppercase;",
      "letter-spacing:.08em;color:#52525b;}",
      "a.item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;",
      "text-decoration:none;color:#e4e4e7;transition:background .12s ease;}",
      "a.item:hover{background:rgba(255,255,255,.06);}",
      "a.item.active{background:rgba(99,102,241,.14);}",
      "a.item .ic{flex-shrink:0;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.06);",
      "display:flex;align-items:center;justify-content:center;color:#c7d2fe;}",
      "a.item.active .ic{background:rgba(99,102,241,.25);color:#a5b4fc;}",
      "a.item .tx{min-width:0;flex:1;}",
      "a.item .tx b{display:block;font-size:12.5px;font-weight:600;white-space:nowrap;",
      "overflow:hidden;text-overflow:ellipsis;}",
      "a.item .tx small{display:block;font-size:10.5px;color:#71717a;white-space:nowrap;",
      "overflow:hidden;text-overflow:ellipsis;margin-top:1px;}",
      "a.item.active .tx small{color:#a5b4fc;}",
      ".chip{margin-left:auto;font-size:9px;font-weight:700;color:#a5b4fc;",
      "background:rgba(99,102,241,.18);padding:2px 6px;border-radius:999px;flex-shrink:0;}",
      ".sep{height:1px;background:rgba(255,255,255,.07);margin:6px 4px;}",
      ".ft{padding:9px 14px;font-size:10px;color:#52525b;border-top:1px solid rgba(255,255,255,.08);",
      "display:flex;align-items:center;justify-content:space-between;}",
      ".ft .st{display:inline-flex;align-items:center;gap:5px;}",
      ".ft .st i{width:6px;height:6px;border-radius:999px;background:#22c55e;display:inline-block;}",
      "@media (max-width:420px){.panel{right:12px;bottom:74px;} .fab{right:12px;bottom:12px;}}"
    ].join("");
    shadow.appendChild(style);

    var fab = document.createElement("button");
    fab.className = "fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Chuyển đổi module Tool Hub");
    fab.innerHTML = iconSvg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', 20) +
      '<span class="dot"></span>';
    shadow.appendChild(fab);

    var panel = document.createElement("div");
    panel.className = "panel";

    var recent = getRecent(current ? current.id : null);

    var html = '<div class="ph">' +
      '<div class="logo">' + iconSvg('<path d="M7 5v14M7 19h10"/>', 15) + '</div>' +
      '<div class="t"><b>Tool Hub</b><span>Internal Enterprise Workspace</span></div>' +
      '</div>' +
      '<div class="body">';

    if (recent.length) {
      html += '<div class="label">Gần đây</div>';
      recent.forEach(function (m) {
        html += itemHtml(m, false);
      });
      html += '<div class="sep"></div>';
    }

    html += '<div class="label">Tất cả module</div>';
    MODULES.forEach(function (m) {
      html += itemHtml(m, current && m.id === current.id);
    });

    html += '</div>' +
      '<div class="ft"><span class="st"><i></i>Operational</span><span>6 modules</span></div>';

    panel.innerHTML = html;
    shadow.appendChild(panel);

    function itemHtml(m, isActive) {
      return '<a class="item' + (isActive ? ' active' : '') + '" href="' + m.href + '">' +
        '<span class="ic">' + iconSvg(m.icon, 16) + '</span>' +
        '<span class="tx"><b>' + m.name + '</b><small>' + m.desc + '</small></span>' +
        (isActive ? '<span class="chip">HIỆN TẠI</span>' : '') +
        '</a>';
    }

    var open = false;
    function setOpen(v) {
      open = v;
      panel.classList.toggle("open", open);
    }

    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!open);
    });

    document.addEventListener("click", function (e) {
      if (!open) return;
      if (e.composedPath && e.composedPath().indexOf(host) !== -1) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    document.documentElement.appendChild(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
