function buildQuoteHTML(data, totals) {
    const quoteNumber = data.contractNumber || 'BG.....';
    const quoteDate = new Date().toLocaleDateString('vi-VN');
    const customerName = data.customerName || '[Tên khách hàng]';
    const contactPerson = data.customerRep || '[Người liên hệ]';
    const phone = data.customerPhone || '[Số điện thoại]';
    const email = data.customerEmail || '[Email]';
    const address = data.customerAddress || '[Địa chỉ]';
    const projectName = data.projectName || '[Tên dự án]';
    const productType = data.productType || 'Website';
    const duration = data.duration || '30';
    const maintenanceFee = data.maintenanceFee || '[Phí bảo trì]';
    const workItems = data.workItems || [];
    const otherServiceCosts = data.otherServiceCosts || [];

    const { systemCost, otherCost, vatPercent, vatEnabled, totalBeforeVat, vatAmount, totalAmount, paymentRows, totalPaymentPercent, totalPaymentAmount } = totals;

    const th = 'border border-black p-1.5 bg-gray-100 font-semibold';
    const td = 'border border-black p-1.5';
    const h2 = 'text-[13px] font-bold uppercase mt-4 mb-2 break-after-avoid';
    const h3 = 'text-[13px] font-bold mt-3 mb-1 break-after-avoid';
    const ul = 'list-disc pl-5 space-y-1 mb-2 text-justify';
    const ol = 'list-decimal pl-5 space-y-1 mb-2 text-justify';
    const p = 'mb-2 text-justify';

    const workItemsHTML = workItems.map(item =>
        `<tr class="break-inside-avoid">` +
        `<td class="${td} text-center">${item.index}</td>` +
        `<td class="${td}">${item.name}</td>` +
        `<td class="${td} text-center">${item.role}</td>` +
        `<td class="${td}">${item.desc}</td>` +
        `<td class="${td} text-right">-</td></tr>`
    ).join('');

    const paymentRowsHTML = paymentRows.map(row =>
        `<tr class="break-inside-avoid"><td class="${td}">Đợt ${row.index}</td><td class="${td}">${row.condition}</td><td class="${td} text-center">${Number(row.percent).toFixed(1)}%</td><td class="${td} text-right">${formatCurrency(row.amount)}</td></tr>`
    ).join('');

    const otherCostRowsHTML = otherServiceCosts.map(item => {
        const hasAmount = item.quantity != null && item.unitPrice != null;
        const lineTotal = hasAmount ? formatCurrency(item.quantity * item.unitPrice) : '-';
        return `<tr class="break-inside-avoid">` +
            `<td class="${td} text-center">${item.index}</td>` +
            `<td class="${td}">${item.name}</td>` +
            `<td class="${td}">${item.desc || '-'}</td>` +
            `<td class="${td}">${item.billing || '-'}</td>` +
            `<td class="${td} text-center">${item.unit || '-'}</td>` +
            `<td class="${td} text-center">${item.quantity != null ? item.quantity : '-'}</td>` +
            `<td class="${td} text-right">${item.unitPrice != null ? formatCurrency(item.unitPrice) : '-'}</td>` +
            `<td class="${td} text-right">${lineTotal}</td>` +
            `<td class="${td}">${item.note || ''}</td></tr>`;
    }).join('');

    return `<div class="font-serif text-black text-[13px] leading-relaxed">
${buildLetterheadHTML()}

<div class="text-center border-b-2 border-black pb-3 mb-4">
<p class="font-bold uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
<p class="font-semibold inline-block border-b border-black pb-0.5 mt-1">Độc lập - Tự do - Hạnh phúc</p>
<h1 class="font-bold uppercase text-[16px] mt-3 mb-1 break-after-avoid">Bảng báo giá dịch vụ</h1>
<p class="font-bold uppercase mt-1">Xây dựng ${productType}</p>
<p class="mt-1">Số báo giá: <strong>${quoteNumber}</strong> &nbsp;|&nbsp; Ngày báo giá: <strong>${quoteDate}</strong></p>
</div>

<h2 class="${h2}">I. Thông tin khách hàng</h2>
<table class="w-full border-collapse text-[12px] my-3">
<tbody>
<tr class="break-inside-avoid"><td class="${td} font-semibold w-[35%]">Tên khách hàng / Đơn vị</td><td class="${td}">${customerName}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Người liên hệ</td><td class="${td}">${contactPerson}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Số điện thoại</td><td class="${td}">${phone}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Email</td><td class="${td}">${email}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Địa chỉ</td><td class="${td}">${address}</td></tr>
</tbody>
</table>

<h2 class="${h2}">II. Thông tin dự án</h2>
<table class="w-full border-collapse text-[12px] my-3">
<tbody>
<tr class="break-inside-avoid"><td class="${td} font-semibold w-[35%]">Tên dự án</td><td class="${td}">${projectName}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Loại sản phẩm</td><td class="${td}">${productType}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Thời gian thực hiện dự kiến</td><td class="${td}">${duration} ngày làm việc</td></tr>
</tbody>
</table>

<h2 class="${h2}">III. Khối lượng công việc và chi phí</h2>
<table class="w-full border-collapse text-[12px] my-3">
<thead class="table-header-group">
<tr class="break-inside-avoid">
<th class="${th} w-[5%] text-center">STT</th>
<th class="${th}">Hạng mục / Chức năng</th>
<th class="${th} text-center">Quyền</th>
<th class="${th}">Mô tả chi tiết</th>
<th class="${th} w-[12%] text-right">Chi phí</th>
</tr>
</thead>
<tbody>
${workItemsHTML}
</tbody>
</table>

<h2 class="${h2}">IV. Chi phí dịch vụ khác</h2>
<table class="w-full border-collapse text-[12px] my-3">
<thead class="table-header-group">
<tr class="break-inside-avoid">
<th class="${th} w-[4%] text-center">STT</th>
<th class="${th}">Danh mục dịch vụ</th>
<th class="${th}">Mô tả / Quy cách</th>
<th class="${th}">Hình thức tính phí</th>
<th class="${th} text-center">Đơn vị tính</th>
<th class="${th} text-center">Số lượng</th>
<th class="${th} text-right">Đơn giá (VNĐ)</th>
<th class="${th} text-right">Thành tiền (VNĐ)</th>
<th class="${th}">Ghi chú</th>
</tr>
</thead>
<tbody>
${otherCostRowsHTML}
</tbody>
</table>
<p class="${p}">Các chi phí trên do bên thứ ba cung cấp, không thuộc phạm vi báo giá này và có thể thay đổi theo chính sách của nhà cung cấp tại từng thời điểm.</p>

<h2 class="${h2}">V. Tổng giá trị</h2>
<table class="w-full border-collapse text-[12px] my-3">
<tbody>
<tr class="break-inside-avoid"><td class="${td} font-semibold w-[50%]">Chi phí xây dựng hệ thống</td><td class="${td} text-right">${formatCurrency(systemCost)}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">Chi phí dịch vụ khác</td><td class="${td} text-right">${formatCurrency(otherCost)}</td></tr>
<tr class="break-inside-avoid bg-gray-100"><td class="${td} font-semibold">TẠM TÍNH</td><td class="${td} text-right font-bold">${formatCurrency(totalBeforeVat)}</td></tr>
<tr class="break-inside-avoid"><td class="${td} font-semibold">${vatEnabled ? `VAT ${vatPercent}%` : 'VAT'}</td><td class="${td} text-right">${vatEnabled ? formatCurrency(vatAmount) : 'Không áp dụng'}</td></tr>
<tr class="break-inside-avoid bg-blue-50"><td class="${td} font-semibold">TỔNG GIÁ TRỊ BÁO GIÁ</td><td class="${td} text-right font-bold">${formatCurrency(totalAmount)}</td></tr>
</tbody>
</table>

<h2 class="${h2}">VI. Tiến độ thực hiện</h2>
<ul class="${ul}">
<li><strong>Thời gian dự kiến:</strong> ${duration} ngày làm việc</li>
<li>Không bao gồm Thứ Bảy, Chủ Nhật và ngày nghỉ lễ</li>
<li>Thời gian được tính từ khi Bên B nhận đủ khoản thanh toán đầu tiên và thông tin cần thiết</li>
<li>Tiến độ có thể được điều chỉnh nếu khách hàng chậm cung cấp thông tin, chậm phản hồi, hoặc phát sinh yếu tố khác</li>
</ul>

<h2 class="${h2}">VII. Tiến độ thanh toán</h2>
<table class="w-full border-collapse text-[12px] my-3">
<thead class="table-header-group">
<tr class="break-inside-avoid">
<th class="${th} w-[15%]">Đợt</th>
<th class="${th}">Điều kiện thanh toán</th>
<th class="${th} w-[12%] text-center">Tỷ lệ</th>
<th class="${th} w-[20%] text-right">Số tiền</th>
</tr>
</thead>
<tbody>
${paymentRowsHTML}
<tr class="break-inside-avoid bg-gray-100"><td class="${td} text-right font-bold" colspan="2">Tổng cộng</td><td class="${td} text-center font-bold">${totalPaymentPercent.toFixed(1)}%</td><td class="${td} text-right font-bold">${formatCurrency(totalPaymentAmount)}</td></tr>
</tbody>
</table>

<h2 class="${h2}">VIII. Bảo hành và hỗ trợ</h2>

<h3 class="${h3}">Bảo hành</h3>
<ul class="${ul}">
<li>Bảo hành lỗi hệ thống và lỗi chức năng thuộc phạm vi công việc trong thời gian <strong>12 tháng</strong> kể từ ngày nghiệm thu</li>
<li>Các lỗi phát sinh do việc thay đổi mã nguồn bởi bên thứ ba không thuộc phạm vi bảo hành</li>
<li>Chức năng mới hoặc yêu cầu mới phát sinh sau khi nghiệm thu sẽ được báo giá riêng</li>
</ul>

<h3 class="${h3}">Hỗ trợ</h3>
<ul class="${ul}">
<li>Hỗ trợ tư vấn trong quá trình sử dụng</li>
<li>Hướng dẫn khách hàng sử dụng các chức năng đã bàn giao</li>
<li>Hỗ trợ xử lý các vấn đề thuộc phạm vi sản phẩm</li>
</ul>

<h3 class="${h3}">Bảo trì</h3>
<p class="${p}"><strong>Phí bảo trì:</strong> ${maintenanceFee} / năm</p>

<h2 class="${h2}">IX. Ghi chú và điều kiện báo giá</h2>
<ol class="${ol}">
<li>Báo giá được xây dựng dựa trên các yêu cầu được Hai Bên thống nhất</li>
<li>Các chức năng không được thể hiện trong bảng khối lượng công việc được xem là chưa bao gồm</li>
<li>Trường hợp khách hàng bổ sung hoặc thay đổi yêu cầu, chi phí và thời gian thực hiện có thể được điều chỉnh</li>
<li>Chi phí dịch vụ bên thứ ba (server, tên miền, SMS, OTP, Google Play, Apple App Store) có thể thay đổi theo chính sách của nhà cung cấp</li>
<li>Báo giá là cơ sở để Hai Bên thống nhất nội dung triển khai và ký kết Hợp đồng dịch vụ</li>
</ol>

<h2 class="${h2}">X. Xác nhận báo giá</h2>
<div class="grid grid-cols-2 gap-6 mt-2 break-inside-avoid">
<div class="text-center border-r border-black pr-4">
<p class="font-bold uppercase">Bên cung cấp dịch vụ</p>
<p class="font-bold uppercase">Công ty TNHH Mevivu</p>
<div class="h-24"></div>
<p class="font-bold">NGUYỄN PHÚC NHÂN - Giám đốc</p>
</div>
<div class="text-center pl-4">
<p class="font-bold uppercase">Khách hàng</p>
<div class="h-24"></div>
<p>[Ký tên và dấu]</p>
</div>
</div>
</div>`;
}
