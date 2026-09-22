document.addEventListener('DOMContentLoaded', () => {
    const systemCostInput = document.getElementById('systemCost');
    const otherCostInput = document.getElementById('otherCost');
    const paymentAccountInput = document.getElementById('paymentAccount');
    const vatInput = document.getElementById('vatPercent');
    const vatEnabledInput = document.getElementById('vatEnabled');
    const totalValueInput = document.getElementById('totalValue');
    const addItemBtn = document.getElementById('addItem');
    const workItemsContainer = document.getElementById('workItems');
    const addPaymentItemBtn = document.getElementById('addPaymentItem');
    const paymentItemsContainer = document.getElementById('paymentItems');
    const addOtherCostItemBtn = document.getElementById('addOtherCostItem');
    const otherCostItemsContainer = document.getElementById('otherCostItems');
    const previewContractBtn = document.getElementById('previewContractBtn');
    const previewQuoteBtn = document.getElementById('previewQuoteBtn');
    const resetBtn = document.getElementById('resetBtn');
    const validationSummary = document.getElementById('validationSummary');
    const formattedNumberSelector = '[data-number-format="money"], .other-cost-price, .payment-amount';

    const requiredFields = [
        ['contractNumber', 'Số hợp đồng'],
        ['contractDay', 'Ngày ký hợp đồng'],
        ['contractPlace', 'Địa điểm ký kết'],
        ['customerName', 'Tên đơn vị / Cá nhân'],
        ['customerRep', 'Người đại diện'],
        ['customerPhone', 'Số điện thoại'],
        ['customerEmail', 'Email'],
        ['customerAddress', 'Địa chỉ'],
        ['projectName', 'Tên dự án'],
        ['productType', 'Loại sản phẩm'],
        ['duration', 'Thời gian thực hiện'],
        ['systemCost', 'Chi phí xây dựng'],
    ];

    function formatNumberInput(input) {
        if (!input || input.value.trim() === '') return;
        const value = parseMoney(input.value);
        input.value = value.toLocaleString('vi-VN');
    }

    function prepareNumberInputs() {
        document.querySelectorAll('input[type="number"]').forEach((input) => {
            input.min = '0';
        });
        document.querySelectorAll(formattedNumberSelector).forEach(formatNumberInput);
    }

    function clearValidation() {
        document.querySelectorAll('.field-invalid').forEach((input) => {
            input.classList.remove('field-invalid');
            input.removeAttribute('aria-invalid');
        });
        document.querySelectorAll('.section-invalid').forEach((section) => section.classList.remove('section-invalid'));
        validationSummary?.classList.add('hidden');
    }

    function markInvalid(input) {
        input.classList.add('field-invalid');
        input.setAttribute('aria-invalid', 'true');
        input.closest('section')?.classList.add('section-invalid');
    }

    function validateBeforePreview() {
        clearValidation();
        const missing = requiredFields
            .map(([id, label]) => ({ input: document.getElementById(id), label }))
            .filter(({ input }) => !input?.value.trim());

        document.querySelectorAll('.work-item').forEach((item, index) => {
            const name = item.querySelector('.function-name');
            const description = item.querySelector('.function-desc');
            if (!name?.value.trim()) missing.push({ input: name, label: `Tên chức năng #${index + 1}` });
            if (!description?.value.trim()) missing.push({ input: description, label: `Mô tả chức năng #${index + 1}` });
        });

        if (missing.length === 0) return true;

        missing.forEach(({ input }) => {
            if (!input) return;
            input.closest('details')?.setAttribute('open', '');
            markInvalid(input);
        });

        const firstMissing = missing[0].input;
        validationSummary.textContent = `Vui lòng bổ sung: ${missing.slice(0, 3).map(item => item.label).join(', ')}${missing.length > 3 ? ` và ${missing.length - 3} mục khác` : ''}.`;
        validationSummary.classList.remove('hidden');
        firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstMissing.focus({ preventScroll: true });
        return false;
    }

    function getCurrentTotalAmount() {
        const systemCost = parseMoney(systemCostInput.value);
        const otherCost = parseMoney(otherCostInput.value);
        const parsedVat = parseInt(vatInput.value);
        const vatPercent = vatEnabledInput.checked ? (isNaN(parsedVat) ? 10 : parsedVat) : 0;
        const totalBeforeVat = systemCost + otherCost;
        const vatAmount = Math.round(totalBeforeVat * vatPercent / 100);
        return totalBeforeVat + vatAmount;
    }

    function calculateTotal() {
        totalValueInput.value = getCurrentTotalAmount().toLocaleString('vi-VN');
        syncAllPaymentRows();
        updatePaymentSummary();
    }

    function syncPaymentRow(row) {
        const percentInput = row.querySelector('.payment-percent');
        const amountInput = row.querySelector('.payment-amount');
        const totalAmount = getCurrentTotalAmount();

        if (row.dataset.paymentMode === 'amount') {
            const amount = parseMoney(amountInput.value);
            if (isNaN(amount)) {
                percentInput.value = '';
            } else {
                percentInput.value = totalAmount > 0 ? Math.round((amount / totalAmount) * 10000) / 100 : '';
            }
        } else {
            const percent = parseFloat(percentInput.value);
            if (isNaN(percent)) {
                amountInput.value = '';
            } else {
                amountInput.value = totalAmount > 0 ? Math.round(totalAmount * percent / 100) : '';
            }
        }
    }

    function syncAllPaymentRows() {
        document.querySelectorAll('.payment-item').forEach(syncPaymentRow);
    }

    if (paymentAccountInput && typeof BANK_ACCOUNTS !== 'undefined') {
        paymentAccountInput.innerHTML = BANK_ACCOUNTS.map(acc =>
            `<option value="${acc.id}">${escapeHtml(acc.accountName)} — ${escapeHtml(acc.bankLabel)} — ${escapeHtml(acc.account)}</option>`
        ).join('');
        paymentAccountInput.value = typeof DEFAULT_BANK_ACCOUNT_ID !== 'undefined' ? DEFAULT_BANK_ACCOUNT_ID : BANK_ACCOUNTS[0].id;
    }

    systemCostInput.addEventListener('input', calculateTotal);
    otherCostInput.addEventListener('input', calculateTotal);
    systemCostInput.addEventListener('change', calculateTotal);
    otherCostInput.addEventListener('change', calculateTotal);
    vatInput.addEventListener('change', calculateTotal);
    vatEnabledInput.addEventListener('change', () => {
        vatInput.disabled = !vatEnabledInput.checked;
        calculateTotal();
    });

    function updatePaymentSummary() {
        const summaryEl = document.getElementById('paymentSummary');
        if (!summaryEl) return;

        const schedule = collectPaymentSchedule();
        if (schedule.length === 0) {
            summaryEl.className = 'p-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-500';
            summaryEl.textContent = 'Chưa nhập đợt thanh toán nào.';
            return;
        }

        const totalAmount = getCurrentTotalAmount();
        const { totalPaymentPercent, totalPaymentAmount } = computePaymentRows(schedule, totalAmount);
        const diff = totalAmount - totalPaymentAmount;

        if (Math.abs(diff) < 1) {
            summaryEl.className = 'p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200';
            summaryEl.textContent = `✓ Đã phân bổ đủ: ${totalPaymentPercent.toFixed(1)}% = ${totalPaymentAmount.toLocaleString('vi-VN')} VNĐ`;
        } else {
            const verb = diff > 0 ? 'còn thiếu' : 'dư';
            summaryEl.className = 'p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200';
            summaryEl.textContent = `⚠ Tổng các đợt: ${totalPaymentPercent.toFixed(1)}% = ${totalPaymentAmount.toLocaleString('vi-VN')} VNĐ — ${verb} ${Math.abs(diff).toLocaleString('vi-VN')} VNĐ so với tổng giá trị ${totalAmount.toLocaleString('vi-VN')} VNĐ`;
        }
    }

    function renumberItems(containerSelector, labelSelector, prefix) {
        document.querySelectorAll(containerSelector).forEach((item, idx) => {
            const label = item.querySelector(labelSelector);
            if (label) label.textContent = `${prefix} #${idx + 1}`;
        });
    }

    function renumberWorkItems() {
        renumberItems('.work-item', '.work-item-label', 'Chức năng');
    }

    function renumberPaymentItems() {
        renumberItems('.payment-item', '.payment-item-label', 'Đợt thanh toán');
    }

    function renumberOtherCostItems() {
        renumberItems('.other-cost-item', '.other-cost-item-label', 'Dịch vụ');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }

    function createWorkItem(item = {}) {
        const newItem = document.createElement('div');
        newItem.className = 'work-item rounded-lg border border-zinc-200 bg-zinc-50/70 p-4';
        newItem.innerHTML = `
            <div class="mb-3 flex items-center justify-between">
                <span class="work-item-label text-xs font-semibold uppercase tracking-wider text-zinc-500">Chức năng</span>
                <button type="button" class="remove-item rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950">Xóa</button>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Tên chức năng</span>
                    <input type="text" value="${escapeHtml(item.name)}" placeholder="Tên chức năng" class="function-name w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Quyền sử dụng</span>
                    <select class="function-role w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                        ${['User', 'Admin', 'System'].map(role => `<option ${role === item.role ? 'selected' : ''}>${role}</option>`).join('')}
                    </select>
                </label>
                <label class="block md:col-span-2">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Mô tả công việc đã chốt</span>
                    <textarea placeholder="Mô tả công việc đã chốt" rows="2" class="function-desc w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">${escapeHtml(item.desc)}</textarea>
                </label>
            </div>
        `;
        return newItem;
    }

    addItemBtn.addEventListener('click', () => {
        workItemsContainer.appendChild(createWorkItem());
        renumberWorkItems();
    });

    function createPaymentItem(item = {}) {
        const newItem = document.createElement('div');
        newItem.className = 'payment-item rounded-lg border border-zinc-200 bg-zinc-50/70 p-4';
        newItem.innerHTML = `
            <div class="mb-3 flex items-center justify-between">
                <span class="payment-item-label text-xs font-semibold uppercase tracking-wider text-zinc-500">Đợt thanh toán</span>
                <button type="button" class="remove-payment-item rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950">Xóa</button>
            </div>
            <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-zinc-600">Điều kiện thanh toán</span>
                <input type="text" value="${escapeHtml(item.condition)}" placeholder="Điều kiện thanh toán" class="payment-condition w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
            </label>
            <div class="mt-4 grid gap-4 md:grid-cols-2">
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Tỷ lệ (%)</span>
                    <input type="number" min="0" value="${item.percent ?? ''}" placeholder="Tỷ lệ (%)" class="payment-percent w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Hoặc số tiền (VNĐ)</span>
                    <input type="text" inputmode="numeric" min="0" data-number-format="money" value="${item.amount ?? ''}" placeholder="Hoặc số tiền (VNĐ)" class="payment-amount w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
            </div>
        `;
        if (item.amount != null && item.percent == null) newItem.dataset.paymentMode = 'amount';
        return newItem;
    }

    addPaymentItemBtn.addEventListener('click', () => {
        paymentItemsContainer.appendChild(createPaymentItem());
        renumberPaymentItems();
        updatePaymentSummary();
    });

    paymentItemsContainer.addEventListener('input', (e) => {
        const row = e.target.closest('.payment-item');
        if (!row) return;

        if (e.target.classList.contains('payment-percent')) {
            row.dataset.paymentMode = 'percent';
            syncPaymentRow(row);
            updatePaymentSummary();
        } else if (e.target.classList.contains('payment-amount')) {
            row.dataset.paymentMode = 'amount';
            syncPaymentRow(row);
            updatePaymentSummary();
        }
    });

    function createOtherCostItem(item = {}) {
        const newItem = document.createElement('div');
        newItem.className = 'other-cost-item rounded-lg border border-zinc-200 bg-zinc-50/70 p-4';
        newItem.innerHTML = `
            <div class="mb-3 flex items-center justify-between">
                <span class="other-cost-item-label text-xs font-semibold uppercase tracking-wider text-zinc-500">Dịch vụ</span>
                <button type="button" class="remove-other-cost-item rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950">Xóa</button>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Danh mục dịch vụ</span>
                    <input type="text" value="${escapeHtml(item.name)}" placeholder="Danh mục dịch vụ" class="other-cost-name w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Mô tả / Quy cách</span>
                    <input type="text" value="${escapeHtml(item.desc)}" placeholder="Mô tả / Quy cách" class="other-cost-desc w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Hình thức tính phí</span>
                    <input type="text" value="${escapeHtml(item.billing)}" placeholder="Hình thức tính phí" class="other-cost-billing w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Đơn vị tính</span>
                    <input type="text" value="${escapeHtml(item.unit)}" placeholder="Đơn vị tính" class="other-cost-unit w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Số lượng</span>
                    <input type="number" min="0" value="${item.quantity ?? ''}" placeholder="Số lượng" class="other-cost-qty w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Đơn giá (VNĐ)</span>
                    <input type="text" inputmode="numeric" min="0" data-number-format="money" value="${item.unitPrice ?? ''}" placeholder="Đơn giá (VNĐ)" class="other-cost-price w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
                <label class="block md:col-span-2">
                    <span class="mb-1.5 block text-xs font-medium text-zinc-600">Ghi chú</span>
                    <input type="text" value="${escapeHtml(item.note)}" placeholder="Ghi chú" class="other-cost-note w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200">
                </label>
            </div>
        `;
        return newItem;
    }

    addOtherCostItemBtn.addEventListener('click', () => {
        otherCostItemsContainer.appendChild(createOtherCostItem());
        renumberOtherCostItems();
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item')) {
            e.preventDefault();
            e.target.closest('.work-item').remove();
            renumberWorkItems();
        }
        if (e.target.classList.contains('remove-payment-item')) {
            e.preventDefault();
            e.target.closest('.payment-item').remove();
            renumberPaymentItems();
            updatePaymentSummary();
        }
        if (e.target.classList.contains('remove-other-cost-item')) {
            e.preventDefault();
            e.target.closest('.other-cost-item').remove();
            renumberOtherCostItems();
        }
    });

    function confirmPaymentScheduleIfNeeded() {
        const schedule = collectPaymentSchedule();
        if (schedule.length === 0) return true;

        const totalAmount = getCurrentTotalAmount();
        const { totalPaymentAmount } = computePaymentRows(schedule, totalAmount);
        const diff = totalAmount - totalPaymentAmount;
        if (Math.abs(diff) < 1) return true;

        const verb = diff > 0 ? 'còn thiếu' : 'dư';
        return confirm(
            `Tổng các đợt thanh toán ${verb} ${Math.abs(diff).toLocaleString('vi-VN')} VNĐ so với tổng giá trị hợp đồng (${totalAmount.toLocaleString('vi-VN')} VNĐ). Bạn có muốn tiếp tục không?`
        );
    }

    previewContractBtn.addEventListener('click', () => {
        if (!validateBeforePreview()) return;
        if (!confirmPaymentScheduleIfNeeded()) return;
        saveFormData();
        window.location.href = '/sale-report/contract.html';
    });

    previewQuoteBtn.addEventListener('click', () => {
        if (!validateBeforePreview()) return;
        if (!confirmPaymentScheduleIfNeeded()) return;
        saveFormData();
        window.location.href = '/sale-report/quote.html';
    });

    let saveTimer;
    const scheduleDraftSave = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveFormData(), 250);
    };

    document.addEventListener('input', (event) => {
        const input = event.target;
        if (input.matches?.(formattedNumberSelector)) {
            input.setCustomValidity(input.value && parseMoney(input.value) < 0 ? 'Giá trị không được âm.' : '');
        }
        input.classList?.remove('field-invalid');
        input.removeAttribute?.('aria-invalid');
        input.closest?.('section')?.classList.remove('section-invalid');
        scheduleDraftSave();
    });

    document.addEventListener('change', scheduleDraftSave);
    document.addEventListener('focusout', (event) => {
        if (event.target.matches?.(formattedNumberSelector)) formatNumberInput(event.target);
    });

    resetBtn.addEventListener('click', () => {
        if (!confirm('Bạn chắc chắn muốn xóa toàn bộ dữ liệu?')) {
            return;
        }
        document.querySelectorAll('input, select, textarea').forEach(el => {
            if (['vatPercent', 'warrantyMonths', 'vatEnabled'].includes(el.id)) {
                return;
            }
            el.value = '';
        });
        vatEnabledInput.checked = true;
        vatInput.disabled = false;
        totalValueInput.value = '';
        clearFormData();
        document.querySelectorAll('.payment-item').forEach(row => delete row.dataset.paymentMode);
        syncAllPaymentRows();
        updatePaymentSummary();
    });

    function restoreFormData() {
        const data = loadFormData();
        if (!data) return;

        const simpleFieldIds = [
            'contractNumber', 'contractDay', 'contractPlace',
            'customerName', 'customerRep', 'customerPosition', 'customerTaxCode', 'customerPhone', 'customerEmail', 'customerAddress',
            'projectName', 'productType', 'duration',
            'systemCost', 'otherCost', 'vatPercent',
            'warrantyMonths', 'maintenanceFee', 'paymentAccount',
        ];
        simpleFieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && data[id] != null) el.value = data[id];
        });

        if (data.vatEnabled != null) {
            vatEnabledInput.checked = !!data.vatEnabled;
            vatInput.disabled = !vatEnabledInput.checked;
        }

        if (Array.isArray(data.workItems) && data.workItems.length > 0) {
            workItemsContainer.innerHTML = '';
            data.workItems.forEach(item => workItemsContainer.appendChild(createWorkItem(item)));
            renumberWorkItems();
        }

        if (Array.isArray(data.otherServiceCosts) && data.otherServiceCosts.length > 0) {
            otherCostItemsContainer.innerHTML = '';
            data.otherServiceCosts.forEach(item => otherCostItemsContainer.appendChild(createOtherCostItem(item)));
            renumberOtherCostItems();
        }

        if (Array.isArray(data.paymentSchedule) && data.paymentSchedule.length > 0) {
            paymentItemsContainer.innerHTML = '';
            data.paymentSchedule.forEach(item => paymentItemsContainer.appendChild(createPaymentItem(item)));
            renumberPaymentItems();
        }
    }

    restoreFormData();
    prepareNumberInputs();
    calculateTotal();
});
