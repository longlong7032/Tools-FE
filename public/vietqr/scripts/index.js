const Notification = {
    el: document.getElementById('liveToast'),
    timeoutId: null,
    show(msg, type = 'danger') {
        const colors = {
            success: 'bg-emerald-600',
            warning: 'bg-amber-500',
            danger: 'bg-rose-600'
        };

        this.el.className = `pointer-events-none fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm translate-y-0 opacity-100 transition duration-300 ${colors[type] || colors.danger}`;
        this.el.querySelector('.toast-body').textContent = msg;
        this.el.querySelector('button').onclick = () => this.hide();
        window.clearTimeout(this.timeoutId);
        this.timeoutId = window.setTimeout(() => this.hide(), 3200);
    },
    hide() {
        this.el.classList.remove('translate-y-0', 'opacity-100');
        this.el.classList.add('-translate-y-5', 'opacity-0');
    }
};

const QRLoader = {
    async getBanks() {
        try {
            const res = await fetch("https://qr.sepay.vn/banks.json");
            const data = await res.json();
            return data.data;
        } catch { return null; }
    },

    async copyImageToClipboard(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
};

const App = {
    elements: {
        bank: document.getElementById('select-bank'),
        acc: document.getElementById('input-account'),
        name: document.getElementById('input-name'),
        amount: document.getElementById('input-amount'),
        desc: document.getElementById('input-desc'),
        btn: document.getElementById('btn-generate'),
        img: document.getElementById('qr-image'),
        wrapper: document.getElementById('qr-wrapper'),
        actions: document.getElementById('qr-actions'),
        status: document.getElementById('qr-status'),
        copyBtn: document.getElementById('btn-copy'),
        dlBtn: document.getElementById('btn-download')
    },

    async init() {
        const banks = await QRLoader.getBanks();
        if (banks) {
            this.elements.bank.innerHTML = '<option value="">-- Chọn ngân hàng --</option>';
            banks.forEach(b => this.elements.bank.add(new Option(b.short_name, b.code)));
        }

        this.elements.btn.onclick = () => this.generate();
        this.elements.copyBtn.onclick = () => this.copyQR();
    },

    generate() {
        const { bank, acc, name, amount, desc, img, status, wrapper, actions, dlBtn } = this.elements;

        if (!bank.value || !acc.value) {
            return Notification.show("Thiếu ngân hàng hoặc số tài khoản!", "warning");
        }

        const qrUrl = `https://img.vietqr.io/image/${bank.value}-${acc.value.trim()}-print.png?amount=${amount.value}&addInfo=${encodeURIComponent(desc.value.trim())}&accountName=${name.value}`
       
        status.classList.add('hidden');
        img.src = qrUrl;
        wrapper.classList.remove('hidden');
        actions.classList.remove('hidden');
        dlBtn.href = qrUrl; // Link download

        Notification.show("Mã QR đã được tạo!", "success");
    },

    async copyQR() {
        const success = await QRLoader.copyImageToClipboard(this.elements.img.src);
        if (success) {
            Notification.show("Đã sao chép ảnh QR vào bộ nhớ tạm!", "success");
        } else {
            Notification.show("Trình duyệt không hỗ trợ copy ảnh trực tiếp.", "danger");
        }
    }
};


document.addEventListener('DOMContentLoaded', () => App.init());
