function buildContractHTML(data, totals) {
    const contractNumber = data.contractNumber || 'HDW.....';
    const projectName = data.projectName || '[Tên dự án]';
    const contractPlace = data.contractPlace || 'Thành phố Hồ Chí Minh';
    const customerName = data.customerName || '[Tên đơn vị/Cá nhân]';
    const customerRep = data.customerRep || '[Tên]';
    const customerPosition = data.customerPosition || '[Chức vụ]';
    const customerTaxCode = data.customerTaxCode || '[Mã số thuế]';
    const customerPhone = data.customerPhone || '[Số điện thoại]';
    const customerEmail = data.customerEmail || '[Email]';
    const customerAddress = data.customerAddress || '[Địa chỉ]';
    const productType = data.productType || 'Website';
    const duration = data.duration || '30';
    const warrantyMonths = data.warrantyMonths || '12';
    const workItems = data.workItems || [];
    const otherServiceCosts = data.otherServiceCosts || [];

    const { day, month, year } = splitDate(data.contractDay);
    const { systemCost, otherCost, vatPercent, vatEnabled, totalBeforeVat, vatAmount, totalAmount, paymentRows, totalPaymentPercent, totalPaymentAmount } = totals;

    const signerA = data.customerRep ? data.customerRep : '[Họ và tên]';
    const bankAccount = findBankAccount(data.paymentAccount);
    const vietQrUrl = buildVietQrUrl(bankAccount, totalAmount, `Thanh toan HDW${contractNumber}`.slice(0, 50));

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
        `<td class="${td}">${item.desc}</td></tr>`
    ).join('');

    const paymentRowsHTML = paymentRows.map(row =>
        `<tr class="break-inside-avoid"><td class="${td}">Đợt ${row.index}</td><td class="${td}">${row.condition}</td><td class="${td} text-center"> ${Number(row.percent).toFixed(1)}%</td><td class="${td} text-right">${formatCurrency(row.amount)}</td></tr>`
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

<div class="text-center border-black pb-3 mb-4">
<p class="font-bold  text-[14px] uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
<p class="font-semibold  text-[13px] inline-block border-b border-black pb-0.5 mt-1">Độc lập - Tự do - Hạnh phúc</p>
<h1 class="font-bold uppercase text-[14px] mt-3 mb-1 break-after-avoid">${projectName}</h1>
<p class="mt-1">Số: <strong>HDW${contractNumber}</strong></p>
</div>

<ul class="${ul}">
<li>Căn cứ Bộ luật Dân sự hiện hành;</li>
<li>Căn cứ các quy định pháp luật Việt Nam có liên quan đến hoạt động cung cấp dịch vụ, công nghệ thông tin và sở hữu trí tuệ;</li>
<li>Căn cứ nhu cầu sử dụng dịch vụ của Bên A và khả năng cung cấp dịch vụ của Bên B;</li>
<li>Căn cứ sự thỏa thuận và thống nhất của Hai Bên.</li>
</ul>

<p class="italic mb-3">Hôm nay, ngày <strong>${day}</strong> tháng <strong>${month}</strong> năm <strong>${year}</strong>, tại <strong>${contractPlace}</strong>, chúng tôi gồm:</p>

<h2 class="${h2}">Bên A: Khách hàng</h2>
<ul class="${ul}">
<li><strong>Tên đơn vị/Cá nhân:</strong> ${customerName}</li>
<li><strong>Người đại diện:</strong> ${customerRep}</li>
<li><strong>Chức vụ:</strong> ${customerPosition}</li>
<li><strong>Mã số thuế:</strong> ${customerTaxCode}</li>
<li><strong>Số điện thoại:</strong> ${customerPhone}</li>
<li><strong>Email:</strong> ${customerEmail}</li>
<li><strong>Địa chỉ:</strong> ${customerAddress}</li>
</ul>
<p class="${p}">Sau đây gọi là <strong>"Bên A"</strong>.</p>

<h2 class="${h2}">Bên B: Công ty TNHH Mevivu</h2>
<ul class="${ul}">
<li><strong>Người đại diện:</strong> Ông <strong>NGUYỄN PHÚC NHÂN</strong></li>
<li><strong>Chức vụ:</strong> Giám đốc</li>
<li><strong>Mã số thuế:</strong> 0315872565</li>
<li><strong>Địa chỉ:</strong> 39/20 Đường số 19, Phường Thông Tây Hội, Thành phố Hồ Chí Minh, Việt Nam</li>
<li><strong>Điện thoại:</strong> 0934 177 422</li>
<li><strong>Website:</strong> mevivu.com</li>
<li><strong>Email:</strong> contact@mevivu.com</li>
</ul>
<p class="${p}">Sau đây gọi là <strong>"Bên B"</strong>.</p>

<p class="${p}">Bên A và Bên B sau đây gọi riêng là <strong>"Bên"</strong>, gọi chung là <strong>"Hai Bên"</strong>.</p>
<p class="${p}">Hai Bên thống nhất ký kết Hợp đồng dịch vụ với các nội dung sau:</p>

<h2 class="${h2}">Điều 01: Nội dung và giá trị Hợp đồng</h2>

<h3 class="${h3}">1.1. Khối lượng công việc</h3>
<p class="${p}">Bên B nhận cung cấp dịch vụ xây dựng <strong>${productType}</strong> cho Bên A theo các nội dung Hai Bên đã thống nhất.</p>
<p class="${p}">Toàn bộ khối lượng công việc Bên B thực hiện được xác định tại bảng dưới đây:</p>

<table class="w-full border-collapse text-[12px] my-3">
<thead class="table-header-group">
<tr class="break-inside-avoid">
<th class="${th} w-[6%] text-center">STT</th>
<th class="${th}">Hạng mục / Chức năng</th>
<th class="${th} text-center">Quyền sử dụng</th>
<th class="${th}">Mô tả công việc</th>
</tr>
</thead>
<tbody>
${workItemsHTML}
</tbody>
</table>

<p class="font-bold mb-1">Ghi chú:</p>
<ul class="${ul}">
<li>Khối lượng công việc nêu trên là cơ sở để Bên B triển khai, kiểm tra, nghiệm thu và bàn giao sản phẩm cho Bên A.</li>
<li>Các chức năng, giao diện, nội dung hoặc yêu cầu không được thể hiện trong khối lượng công việc nêu trên được hiểu là <strong>chưa bao gồm trong phạm vi Hợp đồng</strong>, trừ trường hợp Hai Bên có thỏa thuận khác bằng văn bản hoặc thông qua hình thức xác nhận được Hai Bên thống nhất.</li>
<li>Bên B thực hiện sản phẩm theo phạm vi và yêu cầu đã thống nhất, đồng thời có quyền đề xuất phương án triển khai phù hợp về kỹ thuật nhằm đảm bảo tính ổn định, khả năng vận hành và khả năng bảo trì của hệ thống.</li>
<li>Đối với các nội dung phụ thuộc vào dịch vụ của bên thứ ba như Google, Apple, Firebase, bản đồ, SMS, Email, cổng thanh toán, máy chủ, tên miền, API hoặc các dịch vụ tương tự, khả năng vận hành còn phụ thuộc vào chính sách, giới hạn kỹ thuật và tình trạng hoạt động của bên cung cấp dịch vụ đó.</li>
</ul>

<h3 class="${h3}">1.2. Yêu cầu chung của sản phẩm</h3>
<p class="${p}">Trong phạm vi công việc nêu tại Khoản 1.1, Bên B thực hiện các nội dung cần thiết để sản phẩm có thể vận hành theo yêu cầu đã thống nhất, bao gồm:</p>
<ul class="${ul}">
<li>Thiết kế giao diện và trải nghiệm sử dụng theo phạm vi chức năng đã thống nhất.</li>
<li>Xây dựng và tích hợp các chức năng thuộc phạm vi Hợp đồng.</li>
<li>Xây dựng hệ thống quản trị/CMS nếu được liệt kê trong phạm vi công việc.</li>
<li>Xây dựng cơ sở dữ liệu và các thành phần cần thiết để hệ thống hoạt động.</li>
<li>Tích hợp các dịch vụ bên ngoài nếu được nêu rõ trong phạm vi công việc.</li>
<li>Kiểm tra và xử lý các lỗi phát sinh thuộc phạm vi chức năng trước khi nghiệm thu.</li>
<li>Bàn giao sản phẩm theo nội dung Hai Bên đã thống nhất sau khi hoàn tất nghĩa vụ thanh toán.</li>
</ul>

<h3 class="${h3}">1.3. Thời gian thực hiện</h3>
<ul class="${ul}">
<li><strong>Thời gian dự kiến:</strong> ${duration} ngày làm việc, không bao gồm Thứ Bảy, Chủ Nhật và ngày nghỉ lễ theo quy định.</li>
<li>Thời gian thực hiện được tính từ thời điểm Bên B đồng thời nhận được:
<ul class="list-[circle] pl-5 space-y-1 mt-1">
<li>Hợp đồng đã được Hai Bên ký kết;</li>
<li>Khoản thanh toán đầu tiên theo thỏa thuận;</li>
<li>Các thông tin, tài liệu, nội dung, hình ảnh, tài khoản và dữ liệu cần thiết từ Bên A để bắt đầu triển khai.</li>
</ul>
</li>
</ul>
<p class="${p}">Thời gian trên là <strong>thời gian dự kiến triển khai</strong>. Tiến độ thực tế có thể được điều chỉnh phù hợp với tình hình triển khai dự án.</p>
<p class="${p}">Trường hợp việc triển khai bị ảnh hưởng bởi việc Bên A chậm cung cấp thông tin, chậm phản hồi, chậm kiểm tra/nghiệm thu, thay đổi yêu cầu, chậm thanh toán hoặc do nguyên nhân từ bên thứ ba, hệ thống hạ tầng, dịch vụ tích hợp, quá trình xét duyệt của App Store/Google Play hoặc các trường hợp ngoài khả năng kiểm soát hợp lý của Bên B, thời gian thực hiện sẽ được điều chỉnh tương ứng.</p>

<h3 class="${h3}">1.4. Chi phí dịch vụ khác</h3>
<p class="${p}">Các chi phí dịch vụ bên thứ ba (nếu có) liên quan đến việc triển khai được xác định tại bảng dưới đây:</p>
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
<p class="${p}">Các chi phí trên do bên thứ ba cung cấp, không thuộc phạm vi Hợp đồng và có thể thay đổi theo chính sách của nhà cung cấp tại từng thời điểm.</p>

<h3 class="${h3}">1.5. Giá trị Hợp đồng</h3>
<table class="w-full border-collapse text-[12px] my-3">
<thead class="table-header-group">
<tr class="break-inside-avoid">
<th class="${th} w-[8%] text-center">STT</th>
<th class="${th}">Hạng mục</th>
<th class="${th} w-[30%] text-right">Giá trị</th>
</tr>
</thead>
<tbody>
<tr class="break-inside-avoid"><td class="${td} text-center">1</td><td class="${td}">${productType}</td><td class="${td} text-right">${formatCurrency(systemCost)}</td></tr>
<tr class="break-inside-avoid"><td class="${td} text-center">2</td><td class="${td}">Hạng mục khác nếu có</td><td class="${td} text-right">${formatCurrency(otherCost)}</td></tr>
<tr class="break-inside-avoid bg-gray-100"><td class="${td}" colspan="2"><strong>TẠM TÍNH</strong></td><td class="${td} text-right font-bold">${formatCurrency(totalBeforeVat)}</td></tr>
<tr class="break-inside-avoid"><td class="${td}" colspan="2"><strong>${vatEnabled ? `VAT ${vatPercent}%` : 'VAT'}</strong></td><td class="${td} text-right">${vatEnabled ? formatCurrency(vatAmount) : 'Không áp dụng'}</td></tr>
<tr class="break-inside-avoid bg-blue-50"><td class="${td}" colspan="2"><strong>TỔNG GIÁ TRỊ HỢP ĐỒNG</strong></td><td class="${td} text-right font-bold">${formatCurrency(totalAmount)}</td></tr>
</tbody>
</table>
<p class="${p}">Bằng chữ: <strong>${numberToVietnameseWords(totalAmount)} chẵn</strong>.</p>
<p class="${p}">Các chi phí dịch vụ bên thứ ba như tên miền, máy chủ, SMS, OTP, phí tài khoản Google Play, Apple Developer, bản quyền phần mềm, API trả phí, phí cổng thanh toán hoặc các chi phí tương tự chỉ được tính vào giá trị Hợp đồng khi được Hai Bên thống nhất và thể hiện rõ trong phạm vi công việc hoặc bảng giá trị Hợp đồng.</p>

<h2 class="${h2}">Điều 02: Thanh toán và nghiệm thu</h2>

<h3 class="${h3}">2.1. Phương thức thanh toán</h3>
<p class="${p}">Bên A thanh toán cho Bên B bằng hình thức chuyển khoản hoặc phương thức khác được Hai Bên thống nhất.</p>
<div class="flex items-start gap-4 break-inside-avoid">
<div class="flex-1">
<p class="mb-1"><strong>Thông tin nhận thanh toán:</strong></p>
<ul class="${ul}">
<li><strong>Tên tài khoản:</strong> ${bankAccount.accountName}</li>
<li><strong>Số tài khoản:</strong> ${bankAccount.account}</li>
<li><strong>Ngân hàng:</strong> ${bankAccount.bankLabel}</li>
</ul>
</div>
<div class="shrink-0 text-center">
<img src="${vietQrUrl}" alt="Mã VietQR" class="mx-auto h-[140px] w-[140px] object-contain">
<p class="mt-1 text-[10px] text-gray-500">Quét mã để thanh toán</p>
</div>
</div>

<h3 class="${h3}">2.2. Tiến độ thanh toán</h3>
<p class="${p}">Hai Bên thống nhất thanh toán theo ${paymentRows.length > 1 ? 'các đợt' : 'đợt'} sau:</p>
<table class="w-full border-collapse text-[12px] my-3">
<thead class="table-header-group">
<tr class="break-inside-avoid">
<th class="${th} w-[10%]">Đợt</th>
<th class="${th}">Thời điểm thanh toán</th>
<th class="${th} w-[12%] text-center">Tỷ lệ</th>
<th class="${th} w-[20%] text-right">Số tiền</th>
</tr>
</thead>
<tbody>
${paymentRowsHTML}
<tr class="break-inside-avoid bg-gray-100"><td class="${td} text-right font-bold" colspan="2">Tổng cộng</td><td class="${td} text-center font-bold">${totalPaymentPercent}%</td><td class="${td} text-right font-bold">${formatCurrency(totalPaymentAmount)}</td></tr>
</tbody>
</table>

<h3 class="${h3}">2.3. Nghiệm thu</h3>
<p class="${p}">Sau khi Bên B hoàn thành các nội dung thuộc phạm vi Hợp đồng, Bên B sẽ cung cấp sản phẩm để Bên A kiểm tra và nghiệm thu.</p>
<p class="${p}">Bên A có trách nhiệm kiểm tra sản phẩm trong thời gian hợp lý và phản hồi các nội dung chưa phù hợp với phạm vi công việc đã thống nhất.</p>
<p class="${p}">Các lỗi thuộc phạm vi Hợp đồng sẽ được Bên B kiểm tra và xử lý theo quy định bảo hành tại Điều 03.</p>
<p class="${p}">Các yêu cầu mới, thay đổi so với phạm vi công việc đã thống nhất hoặc phát sinh thêm chức năng không được xem là lỗi và sẽ được Hai Bên trao đổi, báo giá và thống nhất trước khi thực hiện.</p>
<p class="${p}">Trường hợp Bên A đã đưa sản phẩm vào sử dụng thực tế hoặc xác nhận sản phẩm đạt yêu cầu, sản phẩm được xem là đã được nghiệm thu.</p>

<h2 class="${h2}">Điều 03: Bảo hành và hỗ trợ</h2>

<h3 class="${h3}">3.1. Thời gian bảo hành</h3>
<p class="${p}">Bên B bảo hành miễn phí <strong>${warrantyMonths} tháng</strong> kể từ ngày sản phẩm được nghiệm thu, trừ khi Hai Bên có thỏa thuận khác.</p>

<h3 class="${h3}">3.2. Phạm vi bảo hành</h3>
<p class="${p}">Bên B có trách nhiệm kiểm tra và xử lý miễn phí các lỗi kỹ thuật hoặc lỗi chức năng thuộc phạm vi Hợp đồng và phát sinh trong quá trình vận hành bình thường của hệ thống.</p>
<p class="${p}">Đối với lỗi nghiêm trọng ảnh hưởng đến khả năng sử dụng chính của hệ thống, Bên B ưu tiên kiểm tra và xử lý trong thời gian sớm nhất có thể.</p>
<p class="${p}">Thời gian xử lý thực tế phụ thuộc vào mức độ lỗi, nguyên nhân, dữ liệu liên quan và sự phối hợp của Bên A.</p>

<h3 class="${h3}">3.3. Không thuộc phạm vi bảo hành</h3>
<p class="mb-1">Bảo hành không bao gồm:</p>
<ul class="${ul}">
<li>Chức năng mới hoặc yêu cầu mới phát sinh sau khi nghiệm thu.</li>
<li>Thay đổi giao diện hoặc thay đổi cách vận hành theo yêu cầu mới của Bên A.</li>
<li>Lỗi do Bên A hoặc bên thứ ba tự ý sửa đổi mã nguồn, cơ sở dữ liệu hoặc cấu hình hệ thống.</li>
<li>Lỗi do máy chủ, tên miền, đường truyền, thiết bị, hệ điều hành hoặc dịch vụ bên thứ ba.</li>
<li>Lỗi do việc sử dụng hệ thống không đúng hướng dẫn hoặc sai mục đích.</li>
<li>Các yêu cầu nhập liệu, cập nhật dữ liệu hoặc thay đổi nội dung không thuộc phạm vi bảo hành.</li>
</ul>
<p class="${p}">Các nội dung ngoài phạm vi bảo hành sẽ được Hai Bên trao đổi và thống nhất chi phí trước khi thực hiện.</p>

<h3 class="${h3}">3.4. Bảo trì</h3>
<p class="${p}">Sau thời gian bảo hành, Bên A có thể sử dụng dịch vụ hỗ trợ/bảo trì của Bên B theo chính sách hoặc báo giá được Hai Bên thống nhất tại từng thời điểm.</p>
<p class="${p}">Trường hợp Hai Bên có thỏa thuận phí bảo trì định kỳ, mức phí sẽ được ghi nhận tại Hợp đồng hoặc xác nhận riêng giữa Hai Bên.</p>

<h2 class="${h2}">Điều 04: Thay đổi và phát sinh yêu cầu</h2>
<p class="${p}">Trong quá trình triển khai, Bên A có thể đề xuất điều chỉnh hoặc bổ sung yêu cầu.</p>
<p class="${p}">Bên B sẽ tiếp nhận và đánh giá yêu cầu về phạm vi công việc, thời gian và chi phí.</p>
<p class="${p}">Đối với yêu cầu làm thay đổi khối lượng công việc đã thống nhất, Hai Bên sẽ thống nhất lại về chi phí và thời gian thực hiện trước khi Bên B triển khai.</p>
<p class="${p}">Việc Bên A yêu cầu thay đổi hoặc bổ sung chức năng có thể dẫn đến việc điều chỉnh tiến độ tương ứng.</p>
<p class="${p}">Bên B không có nghĩa vụ thực hiện các yêu cầu phát sinh ngoài phạm vi Hợp đồng nếu Hai Bên chưa thống nhất về chi phí và thời gian thực hiện.</p>

<h2 class="${h2}">Điều 05: Trách nhiệm của Bên A</h2>
<p class="mb-1">Bên A có trách nhiệm:</p>
<ol class="${ol}">
<li>Cung cấp đầy đủ và chính xác các thông tin, nội dung, hình ảnh, dữ liệu, tài khoản và tài liệu cần thiết cho dự án.</li>
<li>Phối hợp với Bên B trong quá trình thiết kế, phát triển, kiểm tra và nghiệm thu.</li>
<li>Phản hồi, xác nhận hoặc góp ý trong thời gian hợp lý để đảm bảo tiến độ chung của dự án.</li>
<li>Đảm bảo các nội dung, hình ảnh, dữ liệu, tài liệu và thông tin do Bên A cung cấp được phép sử dụng.</li>
<li>Chịu trách nhiệm về tính hợp pháp của nội dung do Bên A cung cấp và đưa lên hệ thống.</li>
<li>Thanh toán đầy đủ và đúng thời hạn theo thỏa thuận.</li>
<li>Không tự ý can thiệp vào mã nguồn, cơ sở dữ liệu hoặc hệ thống khi chưa có sự thống nhất với Bên B trong thời gian Bên B đang thực hiện nghĩa vụ bảo hành.</li>
<li>Kiểm tra và nghiệm thu sản phẩm theo phạm vi công việc đã thống nhất.</li>
<li>Chủ động phối hợp với các bên cung cấp dịch vụ bên thứ ba khi việc tích hợp hoặc vận hành yêu cầu sự xác nhận từ Bên A.</li>
</ol>

<h2 class="${h2}">Điều 06: Trách nhiệm của Bên B</h2>
<p class="mb-1">Bên B có trách nhiệm:</p>
<ol class="${ol}">
<li>Thực hiện sản phẩm theo phạm vi công việc đã thống nhất.</li>
<li>Bố trí nhân sự phù hợp để triển khai dự án.</li>
<li>Chủ động trao đổi với Bên A khi phát sinh vấn đề có thể ảnh hưởng đến việc triển khai.</li>
<li>Hướng dẫn Bên A kiểm tra và sử dụng các chức năng đã bàn giao.</li>
<li>Kiểm tra và xử lý các lỗi thuộc phạm vi bảo hành.</li>
<li>Bảo mật thông tin, tài liệu của Bên A mà Bên B tiếp nhận trong quá trình thực hiện Hợp đồng.</li>
<li>Bàn giao sản phẩm, tài liệu và mã nguồn thuộc phạm vi bàn giao sau khi Bên A hoàn tất toàn bộ nghĩa vụ thanh toán theo Hợp đồng.</li>
</ol>

<h2 class="${h2}">Điều 07: Sở hữu và bàn giao sản phẩm</h2>
<p class="${p}">Sau khi Bên A hoàn tất <strong>100% giá trị Hợp đồng</strong>, Bên B thực hiện bàn giao các thành phần thuộc phạm vi bàn giao, bao gồm mã nguồn và các tài liệu liên quan nếu có thỏa thuận bàn giao.</p>
<p class="${p}">Quyền sử dụng đối với sản phẩm được xây dựng riêng cho Bên A được chuyển giao theo phạm vi Hai Bên đã thống nhất sau khi Bên A hoàn tất nghĩa vụ thanh toán.</p>
<p class="${p}">Các thành phần có sẵn của Bên B hoặc bên thứ ba như framework, thư viện, công cụ, mã nguồn dùng chung, giải pháp kỹ thuật, tài nguyên có giấy phép sử dụng hoặc các thành phần không được xây dựng riêng cho Bên A không được hiểu là tài sản độc quyền của Bên A, trừ khi Hai Bên có thỏa thuận khác.</p>
<p class="${p}">Đối với các phần mềm, thư viện, dịch vụ hoặc tài nguyên của bên thứ ba, quyền sử dụng được thực hiện theo điều kiện và giấy phép của bên cung cấp tương ứng.</p>

<h2 class="${h2}">Điều 08: Bảo mật thông tin</h2>
<p class="${p}">Hai Bên có trách nhiệm bảo mật các thông tin, tài liệu, dữ liệu kinh doanh, tài khoản và thông tin liên quan đến dự án mà mình tiếp nhận trong quá trình thực hiện Hợp đồng.</p>
<p class="${p}">Thông tin có thể được cung cấp cho nhân sự, đơn vị phối hợp hoặc bên cung cấp dịch vụ có liên quan khi cần thiết để thực hiện Hợp đồng, với điều kiện các bên này có trách nhiệm bảo mật thông tin phù hợp.</p>
<p class="mb-1">Nghĩa vụ bảo mật không áp dụng đối với thông tin:</p>
<ul class="${ul}">
<li>Đã được công khai hợp pháp;</li>
<li>Được bên nhận thông tin biết trước một cách hợp pháp;</li>
<li>Được yêu cầu cung cấp theo quy định của cơ quan có thẩm quyền;</li>
<li>Hoặc được Hai Bên thống nhất cho phép công khai.</li>
</ul>

<h2 class="${h2}">Điều 09: Tiến độ và các trường hợp ảnh hưởng đến việc triển khai</h2>
<p class="${p}">Hai Bên thống nhất rằng tiến độ thực hiện dự án phụ thuộc vào sự phối hợp của cả Hai Bên và các yếu tố liên quan đến dự án.</p>
<p class="mb-1">Trường hợp tiến độ bị ảnh hưởng bởi một hoặc nhiều nguyên nhân sau:</p>
<ul class="${ul}">
<li>Bên A chậm cung cấp thông tin, nội dung, dữ liệu hoặc tài khoản;</li>
<li>Bên A chậm phản hồi, kiểm tra hoặc xác nhận;</li>
<li>Bên A thay đổi hoặc bổ sung yêu cầu;</li>
<li>Bên A chậm thực hiện nghĩa vụ thanh toán;</li>
<li>Dịch vụ của bên thứ ba thay đổi hoặc gặp sự cố;</li>
<li>App Store, Google Play hoặc nền tảng liên quan thay đổi chính sách hoặc kéo dài thời gian xét duyệt;</li>
<li>Máy chủ, tên miền, đường truyền hoặc hạ tầng do bên khác cung cấp gặp sự cố;</li>
<li>Sự kiện bất khả kháng hoặc nguyên nhân khách quan khác nằm ngoài khả năng kiểm soát hợp lý của Bên B;</li>
</ul>
<p class="${p}">thì thời gian thực hiện sẽ được điều chỉnh tương ứng với thời gian bị ảnh hưởng.</p>
<p class="${p}">Hai Bên ưu tiên phối hợp để xử lý và cập nhật lại tiến độ phù hợp với tình hình thực tế.</p>

<h2 class="${h2}">Điều 10: Tạm dừng và chấm dứt Hợp đồng</h2>
<p class="mb-1">Bên B có quyền tạm dừng việc triển khai trong trường hợp Bên A:</p>
<ul class="${ul}">
<li>Chậm thanh toán theo thỏa thuận;</li>
<li>Không cung cấp thông tin hoặc tài liệu cần thiết trong thời gian kéo dài;</li>
<li>Yêu cầu thực hiện nội dung có dấu hiệu vi phạm pháp luật;</li>
<li>Có hành vi gây ảnh hưởng nghiêm trọng đến việc triển khai dự án.</li>
</ul>
<p class="${p}">Việc tạm dừng do nguyên nhân từ Bên A sẽ làm thời gian thực hiện dự án được điều chỉnh tương ứng.</p>
<p class="${p}">Trong trường hợp một Bên muốn chấm dứt Hợp đồng trước thời hạn, Hai Bên có trách nhiệm trao đổi và đối soát phần công việc đã thực hiện, các khoản chi phí đã phát sinh và nghĩa vụ thanh toán trước khi chấm dứt.</p>
<p class="${p}">Các khoản thanh toán cho phần công việc Bên B đã thực hiện và các chi phí hợp lý đã phát sinh theo thỏa thuận sẽ không được hoàn lại nếu việc chấm dứt không xuất phát từ lỗi của Bên B.</p>

<h2 class="${h2}">Điều 11: Trường hợp bất khả kháng</h2>
<p class="${p}">Bất khả kháng bao gồm nhưng không giới hạn ở thiên tai, dịch bệnh, chiến tranh, bạo loạn, hỏa hoạn, sự cố diện rộng của hạ tầng Internet, trung tâm dữ liệu, nền tảng công nghệ, dịch vụ bên thứ ba, thay đổi chính sách của cơ quan nhà nước hoặc các sự kiện khách quan khác nằm ngoài khả năng kiểm soát hợp lý của một Bên.</p>
<p class="${p}">Bên bị ảnh hưởng bởi sự kiện bất khả kháng có trách nhiệm thông báo cho Bên còn lại trong thời gian hợp lý.</p>
<p class="${p}">Hai Bên sẽ phối hợp để đưa ra phương án xử lý phù hợp. Thời gian thực hiện Hợp đồng được điều chỉnh tương ứng với thời gian bị ảnh hưởng bởi sự kiện bất khả kháng.</p>

<h2 class="${h2}">Điều 12: Giải quyết tranh chấp</h2>
<p class="${p}">Hai Bên ưu tiên giải quyết mọi vấn đề phát sinh thông qua trao đổi, thương lượng và hợp tác.</p>
<p class="${p}">Trường hợp không thể giải quyết bằng thương lượng, tranh chấp sẽ được giải quyết tại <strong>Tòa án có thẩm quyền tại Thành phố Hồ Chí Minh</strong> theo quy định pháp luật Việt Nam.</p>

<h2 class="${h2}">Điều 13: Điều khoản chung</h2>
<ol class="${ol}">
<li>Hợp đồng có hiệu lực kể từ ngày Hai Bên ký kết hoặc từ thời điểm khác được Hai Bên thống nhất bằng văn bản.</li>
<li>Hai Bên cam kết thực hiện đúng các nội dung đã thỏa thuận trong Hợp đồng.</li>
<li>Mọi thông tin, tài liệu và nội dung trao đổi phục vụ việc triển khai dự án được Hai Bên xác nhận thông qua email, văn bản, hệ thống quản lý công việc hoặc phương thức trao đổi khác được Hai Bên thống nhất có thể được sử dụng làm cơ sở phối hợp thực hiện Hợp đồng.</li>
<li>Trường hợp có sự khác biệt giữa yêu cầu phát sinh trong quá trình trao đổi và phạm vi công việc đã được Hai Bên thống nhất trong Hợp đồng, phạm vi công việc trong Hợp đồng là cơ sở để xác định trách nhiệm thực hiện của Bên B, trừ khi Hai Bên có xác nhận thay đổi sau đó.</li>
<li>Hợp đồng này không tạo thành quan hệ lao động, đại lý hoặc liên doanh giữa Hai Bên.</li>
<li>Sau khi Hai Bên hoàn thành toàn bộ nghĩa vụ theo Hợp đồng, Hợp đồng được xem là đã hoàn tất.</li>
<li>Hợp đồng được lập thành <strong>02 (hai) bản</strong> có giá trị pháp lý như nhau, mỗi Bên giữ 01 (một) bản.</li>
</ol>

<p class="font-bold text-center mt-4 mb-6">Hai Bên đã đọc, hiểu rõ nội dung Hợp đồng và đồng ý ký kết.</p>

<div class="grid grid-cols-2 gap-6 mt-2 break-inside-avoid">
<div class="text-center border-r border-black pr-4">
<p class="font-bold uppercase">Đại diện Bên A</p>
<p class="italic text-[12px]">(Ký, ghi rõ họ tên và đóng dấu)</p>
<div class="h-24"></div>
<p class="font-bold">${signerA}</p>
</div>
<div class="text-center pl-4">
<p class="font-bold uppercase">Đại diện Bên B</p>
<p class="italic text-[12px]">(Ký, ghi rõ họ tên và đóng dấu)</p>
<div class="h-24"></div>
<p class="font-bold">NGUYỄN PHÚC NHÂN</p>
<p class="font-bold">Giám đốc</p>
</div>
</div>
</div>`;
}
