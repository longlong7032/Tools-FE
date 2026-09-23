(function () {
    'use strict';

    // ============================================================
    // PWA: service worker + install prompt + theme-color sync
    // ============================================================

    // ---- Service worker ----
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .catch((err) => console.error('[pwa] SW registration failed:', err));
        });
    }

    // ---- Install button (only shown when the app is installable) ----
    let deferredPrompt = null;
    const installBtn = document.getElementById('install-app');

    function showInstallToast(message, variant = 'info') {
        const toast = document.getElementById('toolhub-install-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.dataset.variant = variant;
        toast.classList.remove('translate-y-3', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        clearTimeout(showInstallToast._timer);
        showInstallToast._timer = setTimeout(() => {
            toast.classList.add('translate-y-3', 'opacity-0');
            toast.classList.remove('translate-y-0', 'opacity-100');
        }, 2800);
    }

    function ensureInstallToast() {
        if (document.getElementById('toolhub-install-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'toolhub-install-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.className = 'pointer-events-none fixed bottom-5 right-5 z-[60] max-w-xs rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 text-sm font-medium text-zinc-700 shadow-2xl shadow-zinc-900/15 backdrop-blur-sm transition-all duration-300 translate-y-3 opacity-0 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100';
        toast.dataset.variant = 'info';
        document.body.appendChild(toast);
    }

    function updateInstallButtonState(isInstallable) {
        if (!installBtn) return;

        installBtn.classList.toggle('hidden', !isInstallable);
        installBtn.classList.toggle('cursor-not-allowed', !isInstallable);
        installBtn.disabled = !isInstallable;

        if (isInstallable) {
            installBtn.classList.remove('opacity-70');
            installBtn.setAttribute('aria-label', 'Cài đặt Tool Hub');
        }
    }

    ensureInstallToast();
    updateInstallButtonState(false);

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        updateInstallButtonState(true);
        showInstallToast('Tool Hub sẵn sàng để cài đặt trên thiết bị này.', 'info');
    });

    installBtn?.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        installBtn.disabled = true;
        installBtn.classList.add('opacity-70');
        showInstallToast('Đang mở hộp thoại cài đặt...', 'info');

        try {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;

            if (choice.outcome === 'accepted') {
                showInstallToast('Cài đặt thành công! Tool Hub đã sẵn sàng để dùng.', 'success');
            } else {
                showInstallToast('Bạn có thể cài đặt sau khi muốn.', 'info');
            }
        } finally {
            deferredPrompt = null;
            updateInstallButtonState(false);
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        updateInstallButtonState(false);
        showInstallToast('Tool Hub đã được cài đặt thành công.', 'success');
    });

    // ---- Keep <meta name="theme-color"> in sync with light/dark theme ----
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function isDarkTheme() {
        const root = document.documentElement;
        if (root.classList.contains('dark')) return true;
        if (root.getAttribute('data-bs-theme') === 'dark') return true;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function syncThemeColor() {
        if (!themeMeta) return;
        themeMeta.setAttribute('content', isDarkTheme() ? '#09090b' : '#ffffff');
    }

    syncThemeColor();
    new MutationObserver(syncThemeColor).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-bs-theme'],
    });
})();
