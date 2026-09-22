const SALE_REPORT_STORAGE_KEY = 'saleReportData';

function collectWorkItems() {
    const workItems = [];
    document.querySelectorAll('.work-item').forEach((item, index) => {
        const name = item.querySelector('.function-name').value;
        const role = item.querySelector('.function-role').value;
        const desc = item.querySelector('.function-desc').value;
        if (name) {
            workItems.push({ index: index + 1, name, role, desc: desc || '[Mô tả]' });
        }
    });
    return workItems;
}

function collectPaymentSchedule() {
    const schedule = [];
    document.querySelectorAll('.payment-item').forEach((item) => {
        const condition = item.querySelector('.payment-condition').value;
        const percentRaw = item.querySelector('.payment-percent').value;
        const amountRaw = item.querySelector('.payment-amount').value;
        if (!condition && percentRaw === '' && amountRaw === '') return;

        // The other field is auto-filled for display only (see syncPaymentRow in
        // form.js) — only the field the user actually typed into is authoritative,
        // so the exact typed value is kept instead of being overwritten by a
        // rounded round-trip through the other field.
        const isAmountDriven = item.dataset.paymentMode === 'amount';
        let percent = null;
        let amount = null;
        if (isAmountDriven && amountRaw !== '') {
            amount = parseMoney(amountRaw);
        } else if (percentRaw !== '') {
            percent = parseFloat(percentRaw);
        } else if (amountRaw !== '') {
            amount = parseMoney(amountRaw);
        }

        schedule.push({ condition: condition || 'Thanh toán', percent, amount });
    });
    return schedule;
}

function collectOtherServiceCosts() {
    const items = [];
    document.querySelectorAll('.other-cost-item').forEach((item, index) => {
        const name = item.querySelector('.other-cost-name').value;
        const desc = item.querySelector('.other-cost-desc').value;
        const billing = item.querySelector('.other-cost-billing').value;
        const unit = item.querySelector('.other-cost-unit').value;
        const qtyRaw = item.querySelector('.other-cost-qty').value;
        const priceRaw = item.querySelector('.other-cost-price').value;
        const note = item.querySelector('.other-cost-note').value;
        if (name) {
            items.push({
                index: index + 1,
                name,
                desc,
                billing,
                unit,
                quantity: qtyRaw !== '' ? parseMoney(qtyRaw) : null,
                unitPrice: priceRaw !== '' ? parseMoney(priceRaw) : null,
                note,
            });
        }
    });
    return items;
}

function collectFormData() {
    return {
        contractNumber: document.getElementById('contractNumber').value,
        contractDay: document.getElementById('contractDay').value,
        contractPlace: document.getElementById('contractPlace').value,
        customerName: document.getElementById('customerName').value,
        customerRep: document.getElementById('customerRep').value,
        customerPosition: document.getElementById('customerPosition').value,
        customerTaxCode: document.getElementById('customerTaxCode').value,
        customerPhone: document.getElementById('customerPhone').value,
        customerEmail: document.getElementById('customerEmail').value,
        customerAddress: document.getElementById('customerAddress').value,
        projectName: document.getElementById('projectName').value,
        productType: document.getElementById('productType').value,
        duration: document.getElementById('duration').value,
        systemCost: document.getElementById('systemCost').value,
        otherCost: document.getElementById('otherCost').value,
        vatPercent: document.getElementById('vatPercent').value,
        vatEnabled: document.getElementById('vatEnabled').checked,
        warrantyMonths: document.getElementById('warrantyMonths').value,
        maintenanceFee: document.getElementById('maintenanceFee').value,
        paymentAccount: document.getElementById('paymentAccount').value,
        paymentSchedule: collectPaymentSchedule(),
        workItems: collectWorkItems(),
        otherServiceCosts: collectOtherServiceCosts(),
    };
}

function saveFormData() {
    const data = collectFormData();
    localStorage.setItem(SALE_REPORT_STORAGE_KEY, JSON.stringify(data));
    return data;
}

function loadFormData() {
    const raw = localStorage.getItem(SALE_REPORT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

function clearFormData() {
    localStorage.removeItem(SALE_REPORT_STORAGE_KEY);
}

const DEFAULT_PAYMENT_SCHEDULE = [
    { condition: 'Thanh toán để bắt đầu dự án', percent: 50, amount: null },
    { condition: 'Khi sản phẩm hoàn thiện theo phạm vi Hợp đồng', percent: 50, amount: null },
];

function computePaymentRows(schedule, totalAmount) {
    const rows = schedule.map((item, index) => {
        let percent;
        let amount;
        if (item.percent != null) {
            percent = item.percent;
            amount = Math.round(totalAmount * percent / 100);
        } else if (item.amount != null) {
            amount = item.amount;
            percent = totalAmount > 0 ? (amount / totalAmount * 100) : 0;
        } else {
            percent = 0;
            amount = 0;
        }
        return { index: index + 1, condition: item.condition || 'Thanh toán', percent, amount };
    });

    const totalPaymentPercent = rows.reduce((sum, row) => sum + row.percent, 0);
    const totalPaymentAmount = rows.reduce((sum, row) => sum + row.amount, 0);

    return { rows, totalPaymentPercent, totalPaymentAmount };
}

// Tiền VNĐ có thể đến dưới dạng chuỗi có dấu chấm phân cách hàng nghìn
// (vd "7.600.000", gõ tay hoặc import từ snapshot cũ). parseInt() dừng lại
// ở ký tự '.' đầu tiên nên sẽ cắt cụt thành "7" — bóc dấu chấm trước khi parse.
function parseMoney(value) {
    if (typeof value === 'string') {
        return parseInt(value.replace(/\./g, ''), 10) || 0;
    }
    return parseInt(value, 10) || 0;
}

function computeTotals(data) {
    const systemCost = parseMoney(data.systemCost);
    const otherCost = parseMoney(data.otherCost);
    const vatEnabled = data.vatEnabled !== false;
    const parsedVat = parseInt(data.vatPercent);
    const vatPercent = vatEnabled ? (isNaN(parsedVat) ? 10 : parsedVat) : 0;

    const totalBeforeVat = systemCost + otherCost;
    const vatAmount = Math.round(totalBeforeVat * vatPercent / 100);
    const totalAmount = totalBeforeVat + vatAmount;

    const schedule = (data.paymentSchedule && data.paymentSchedule.length > 0)
        ? data.paymentSchedule
        : DEFAULT_PAYMENT_SCHEDULE;

    const { rows: paymentRows, totalPaymentPercent, totalPaymentAmount } = computePaymentRows(schedule, totalAmount);

    return {
        systemCost,
        otherCost,
        vatPercent,
        vatEnabled,
        totalBeforeVat,
        vatAmount,
        totalAmount,
        paymentRows,
        totalPaymentPercent,
        totalPaymentAmount,
    };
}
