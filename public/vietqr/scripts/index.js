const Notification = {
    el: document.getElementById('liveToast'),
    show(msg, type = 'danger') {
        this.el.className = `toast align-items-center text-white bg-${type} border-0 shadow`;
        this.el.querySelector('.toast-body').textContent = msg;
        bootstrap.Toast.getOrCreateInstance(this.el).show();
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
        const { bank, acc, name, amount, desc, img, status, actions, dlBtn } = this.elements;

        if (!bank.value || !acc.value) {
            return Notification.show("Thiếu ngân hàng hoặc số tài khoản!", "warning");
        }

        const qrUrl = `https://img.vietqr.io/image/${bank.value}-${acc.value.trim()}-print.png?amount=${amount.value}&addInfo=${encodeURIComponent(desc.value.trim())}&accountName=${name.value}`
       
        status.classList.add('d-none');
        img.src = qrUrl;
        img.classList.add('qr-card__image--active');
        actions.classList.add('qr-card__actions--visible');
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
