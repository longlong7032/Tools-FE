# CHECKLIST HOÀN THIỆN TEMPLATE BẢNG BÁO GIÁ

> Đã rà soát lại theo code hiện tại trong `public/modules/sale-report/` (index.html, scripts/quote-template.js, scripts/contract-template.js, scripts/form.js, scripts/storage.js, scripts/format.js) — cập nhật ngày 2026-09-16.
> `[x]` = đã có trong code. `[ ]` = chưa có / chưa đủ. Cột **Ghi chú rà soát** chỉ ghi khi có lưu ý (hardcode, thiếu liên kết dữ liệu, gộp chung với mục khác...).

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Số báo giá** | Mã/số định danh duy nhất cho từng báo giá. | Dùng chung field "Số hợp đồng" (`contractNumber`), chưa có số báo giá riêng biệt. |
| [x] | **Ngày báo giá** | Ngày phát hành báo giá. | Tự động lấy ngày hiện tại (`new Date()`) khi render, không lưu lại/không tuỳ chỉnh được. |
| [ ] | **Thời hạn hiệu lực** | Xác định báo giá có hiệu lực đến ngày nào hoặc trong bao nhiêu ngày. Mặc định là 30 ngày, có thể nhập tuỳ chỉnh | Chưa có field nhập và chưa xuất hiện trong template báo giá. |
| [x] | **Loại dự án** | Xác định loại sản phẩm: Website, Web App, Mobile App, Phần mềm,... | Trùng với mục "Loại sản phẩm" bên dưới, dùng chung field `productType`. |
| [x] | **Tên khách hàng / Đơn vị** | Tên cá nhân hoặc doanh nghiệp sử dụng dịch vụ. | |
| [x] | **Số điện thoại** | Thông tin liên hệ của khách hàng. | |
| [x] | **Email** | Email nhận báo giá và trao đổi công việc. | |
| [x] | **Địa chỉ** | Địa chỉ của khách hàng/doanh nghiệp. | |
| [x] | **Tên dự án** | Tên dự án được sử dụng xuyên suốt trong báo giá và hợp đồng. | |
| [x] | **Loại sản phẩm** | Website / Web App / Mobile App / Phần mềm hoặc loại sản phẩm tương ứng. | |
| [x] | **Thời gian thực hiện dự kiến** | Tổng thời gian dự kiến để hoàn thành dự án. | |

## PHẠM VI & KHỐI LƯỢNG CÔNG VIỆC

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Hạng mục / Chức năng** | Tên chức năng hoặc hạng mục cần triển khai. | |
| [x] | **Quyền / Đối tượng sử dụng** | Xác định chức năng dành cho Admin, Nhân viên, Khách hàng,... | |
| [x] | **Mô tả chi tiết** | Mô tả ngắn gọn nội dung và phạm vi của chức năng. | |
| [ ] | **Đơn vị** | Đơn vị tính của hạng mục, ví dụ: Chức năng, Module, Ngày công,... | Chưa có field cho từng hạng mục công việc. |
| [ ] | **Số lượng** | Số lượng của hạng mục cần thực hiện. | Chưa có. |
| [ ] | **Đơn giá** | Chi phí cho một đơn vị/hạng mục. | Chưa có — cột "Chi phí" của từng hạng mục trong bảng báo giá luôn hiển thị "-". |
| [ ] | **Thành tiền** | Tự động tính bằng Số lượng × Đơn giá. | Không tính theo dòng; chỉ có một số tổng nhập tay (xem "Tổng chi phí xây dựng"). |
| [x] | **Tổng chi phí xây dựng** | Tổng chi phí của toàn bộ hạng mục phát triển hệ thống. | Là số nhập tay (`systemCost`), không tự cộng từ các dòng hạng mục công việc. |
| [ ] | **Phạm vi thực hiện** | Xác định rõ các nội dung nằm trong phạm vi báo giá. | Chưa có mục riêng nêu rõ phạm vi trong phần này. |
| [x] | **Ngoài phạm vi** | Xác định các chức năng hoặc công việc chưa được bao gồm trong báo giá. | Có 1 câu ở mục IX "Ghi chú và điều kiện báo giá". |

## CHI PHÍ DỊCH VỤ KHÁC

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Tên miền** | Chi phí đăng ký/gia hạn tên miền nếu có. | Có sẵn dòng mặc định trong form. |
| [x] | **Server / Hosting** | Chi phí máy chủ, hosting hoặc hạ tầng vận hành hệ thống. | Có sẵn dòng mặc định trong form. |
| [x] | **SMS / OTP** | Chi phí gửi SMS, OTP hoặc dịch vụ xác thực. | Gộp chung 1 dòng mặc định với Google Play/Apple Developer, có thể tách nếu cần. |
| [x] | **Email Service** | Chi phí dịch vụ gửi email nếu sử dụng nhà cung cấp bên ngoài. | Không có dòng mặc định, nhưng có thể thêm qua field tự do "Thêm dịch vụ khác". |
| [x] | **Google Play** | Chi phí tài khoản hoặc dịch vụ liên quan đến Google Play nếu có. | Gộp chung dòng mặc định, xem ghi chú SMS/OTP. |
| [x] | **Apple Developer** | Chi phí tài khoản hoặc dịch vụ liên quan đến Apple Developer nếu có. | Gộp chung dòng mặc định, xem ghi chú SMS/OTP. |
| [x] | **Payment Gateway** | Chi phí dịch vụ cổng thanh toán nếu có. | Không có dòng mặc định, dùng field tự do. |
| [x] | **API / Dịch vụ bên thứ ba** | Các dịch vụ hoặc API do nhà cung cấp khác cung cấp. | Dùng field tự do. |
| [x] | **Đơn vị tính** | Đơn vị tính tương ứng với từng dịch vụ. | |
| [x] | **Số lượng** | Số lượng sử dụng hoặc thời gian sử dụng dịch vụ. | |
| [x] | **Đơn giá** | Giá của từng dịch vụ theo đơn vị tính. | |
| [x] | **Thành tiền** | Tổng chi phí của từng dịch vụ. | Tự tính `quantity × unitPrice` khi cả hai được nhập. |
| [x] | **Ghi chú dịch vụ** | Ghi rõ điều kiện sử dụng hoặc bên chịu chi phí. | |
| [x] | **Điều kiện giá dịch vụ bên thứ ba** | Nêu rõ chi phí có thể thay đổi theo chính sách/giá của nhà cung cấp. | Có câu chú thích cố định ngay dưới bảng. |

## TỔNG GIÁ TRỊ

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Chi phí xây dựng hệ thống** | Tổng chi phí các hạng mục phát triển. | |
| [x] | **Chi phí dịch vụ khác** | Tổng chi phí các dịch vụ bên ngoài nếu có. | ⚠ Là số nhập tay riêng (`otherCost`), KHÔNG tự cộng từ bảng "Chi phí dịch vụ khác" phía trên → dễ lệch số liệu nếu người dùng quên cập nhật. |
| [ ] | **Chiết khấu** | Khoản giảm giá dành cho khách hàng nếu có. | Chưa có field/tính năng chiết khấu. |
| [x] | **Tạm tính** | Tổng giá trị trước VAT. | |
| [x] | **VAT** | Thuế GTGT áp dụng theo quy định/chính sách tại thời điểm lập báo giá. Có thể tự nhập giá trị và có toggle có/không | Nhập % tuỳ chỉnh được (mặc định 10%, có thể set 0 để coi như không VAT), nhưng chưa có toggle bật/tắt riêng như mô tả. |
| [x] | **Tổng giá trị báo giá** | Tổng số tiền khách hàng cần thanh toán theo báo giá. | |
| [ ] | **Bằng chữ** | Hiển thị tổng giá trị báo giá bằng chữ. | Hàm `numberToVietnameseWords()` đã có sẵn (đang dùng trong `contract-template.js`) nhưng CHƯA được gọi trong `quote-template.js`. |

## TIẾN ĐỘ THỰC HIỆN

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Thời gian thực hiện** | Số ngày/thời gian dự kiến để triển khai dự án. | |
| [x] | **Điều kiện bắt đầu** | Xác định thời điểm bắt đầu tính tiến độ, ví dụ sau khi nhận thanh toán đợt đầu và đủ tài liệu. | |
| [ ] | **Ngày bắt đầu dự kiến** | Ngày dự kiến bắt đầu triển khai. | Chưa có field/hiển thị ngày cụ thể, chỉ có số ngày thực hiện. |
| [ ] | **Ngày hoàn thành dự kiến** | Ngày dự kiến hoàn thành dự án. | Chưa có field/hiển thị ngày cụ thể. |
| [x] | **Ngày nghỉ không tính tiến độ** | Xác định Thứ Bảy, Chủ Nhật và ngày nghỉ lễ có được tính vào thời gian thực hiện hay không. | Cố định là không tính, chưa cho tuỳ chọn. |
| [x] | **Ảnh hưởng do khách hàng chậm phản hồi** | Quy định thời gian thực hiện có thể thay đổi nếu khách hàng chậm cung cấp thông tin, tài liệu hoặc xác nhận. | |

## THANH TOÁN

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Đợt thanh toán** | Xác định số lượng và thứ tự các đợt thanh toán. | |
| [x] | **Điều kiện thanh toán** | Mô tả điều kiện để phát sinh từng đợt thanh toán. | |
| [x] | **Tỷ lệ thanh toán** | Tỷ lệ % của từng đợt. | |
| [x] | **Số tiền thanh toán** | Số tiền tương ứng với từng đợt. | |
| [x] | **Tổng tỷ lệ** | Đảm bảo tổng các đợt thanh toán bằng 100%. | Form cảnh báo (confirm) nếu tổng ≠ 100% trước khi xem báo giá/hợp đồng; bảng báo giá có dòng tổng cộng. |
| [x] | **Điều kiện triển khai** | Xác định việc triển khai bắt đầu sau khi khách hàng hoàn tất khoản thanh toán cần thiết. | Nội dung được gộp vào câu ở mục "Tiến độ thực hiện", không có dòng riêng trong mục Thanh toán. |

## THÔNG TIN THANH TOÁN

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [ ] | **Tên tài khoản** | Tên tài khoản ngân hàng của bên cung cấp dịch vụ. | Chỉ có trong template Hợp đồng (`contract-template.js`), CHƯA có trong template Báo giá. |
| [ ] | **Số tài khoản** | Số tài khoản nhận thanh toán. | Tương tự — chỉ có ở Hợp đồng. |
| [ ] | **Ngân hàng** | Tên ngân hàng nhận thanh toán. | Tương tự — chỉ có ở Hợp đồng. |
| [ ] | **Chi nhánh** | Chi nhánh ngân hàng nếu cần cung cấp. | Trong Hợp đồng đang gộp chung vào chuỗi "Ngân hàng" (không tách field riêng), và không xuất hiện trong Báo giá. |
| [ ] | **Nội dung chuyển khoản** | Quy định nội dung khách hàng sử dụng khi chuyển khoản. | Chưa có ở cả Hợp đồng lẫn Báo giá. |

## THAY ĐỔI & PHÁT SINH

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Thay đổi yêu cầu** | Quy định cách xử lý khi khách hàng thay đổi yêu cầu sau khi đã thống nhất phạm vi. | Gộp chung trong 1 câu ở mục IX "Ghi chú và điều kiện báo giá". |
| [ ] | **Yêu cầu phát sinh** | Các yêu cầu không có trong báo giá được xem là hạng mục phát sinh. | Chưa định nghĩa rõ khái niệm "phát sinh" trong template. |
| [x] | **Chi phí phát sinh** | Xác định việc phát sinh yêu cầu có thể làm tăng chi phí. | Gộp chung trong câu ở mục IX. |
| [x] | **Thời gian phát sinh** | Xác định việc thay đổi/phát sinh có thể làm thay đổi tiến độ. | Gộp chung trong câu ở mục IX. |
| [ ] | **Xác nhận trước khi thực hiện** | Chỉ triển khai phần phát sinh sau khi khách hàng xác nhận chi phí/phạm vi. | Chưa có câu yêu cầu xác nhận trước khi triển khai phần phát sinh. |

## BẢO HÀNH & HỖ TRỢ

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Thời gian bảo hành** | Xác định thời gian bảo hành, ví dụ 12 tháng. | ⚠ `quote-template.js` đang hardcode "12 tháng", KHÔNG dùng giá trị `warrantyMonths` người dùng nhập ở form (trong khi Hợp đồng dùng đúng giá trị này). |
| [x] | **Phạm vi bảo hành** | Chỉ áp dụng cho lỗi thuộc chức năng và phạm vi đã triển khai. | |
| [x] | **Lỗi không thuộc bảo hành** | Xác định các trường hợp không thuộc phạm vi bảo hành. | Mới nêu 2 trường hợp (đổi mã nguồn, chức năng mới), chưa liệt kê đầy đủ các case khác. |
| [ ] | **Lỗi do bên thứ ba** | Làm rõ các lỗi phát sinh từ API, server hoặc dịch vụ bên thứ ba. | Chưa có câu riêng nêu rõ trường hợp này. |
| [x] | **Lỗi do khách hàng thay đổi hệ thống** | Không áp dụng bảo hành đối với lỗi do tự ý thay đổi code, cấu hình hoặc môi trường. | |
| [x] | **Chức năng phát triển thêm** | Chức năng mới không thuộc phạm vi bảo hành. | |
| [x] | **Hỗ trợ sử dụng** | Hỗ trợ khách hàng trong quá trình sử dụng hệ thống. | |
| [ ] | **Tiếp nhận lỗi** | Quy định cách tiếp nhận và xử lý lỗi phát sinh. | Chưa nêu quy trình/kênh tiếp nhận lỗi. |
| [ ] | **Thời gian phản hồi** | Thời gian phản hồi dự kiến sau khi tiếp nhận yêu cầu. | Chưa có SLA thời gian phản hồi. |
| [x] | **Phí bảo trì** | Hiển thị phí bảo trì nếu có sau thời gian bảo hành. | |

## ĐIỀU KIỆN & GHI CHÚ

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Cơ sở lập báo giá** | Báo giá được lập dựa trên yêu cầu/phạm vi đã thống nhất. | |
| [ ] | **Hiệu lực báo giá** | Xác định thời hạn mà báo giá có giá trị áp dụng. | Liên quan tới mục "Thời hạn hiệu lực" còn thiếu ở phần đầu checklist. |
| [x] | **Chức năng chưa bao gồm** | Các chức năng không được liệt kê không thuộc phạm vi báo giá. | |
| [x] | **Thay đổi phạm vi** | Thay đổi yêu cầu có thể làm thay đổi chi phí và thời gian. | |
| [x] | **Chi phí bên thứ ba** | Chi phí được áp dụng theo giá thực tế/chính sách của nhà cung cấp. | |
| [x] | **Cơ sở ký hợp đồng** | Báo giá là cơ sở để hai bên thống nhất phạm vi và chi phí trước khi ký hợp đồng. | |

## XÁC NHẬN BÁO GIÁ

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Đại diện bên cung cấp** | Thông tin người đại diện ký/xác nhận báo giá. | Hardcode "NGUYỄN PHÚC NHÂN". |
| [x] | **Chức vụ bên cung cấp** | Chức vụ của người đại diện. | Hardcode "Giám đốc", gộp chung dòng với tên. |
| [ ] | **Đại diện khách hàng** | Thông tin người đại diện xác nhận báo giá. | Chỉ hiển thị placeholder tĩnh "[Ký tên và dấu]", CHƯA lấy tên người liên hệ (`customerRep`) đã nhập ở form. |
| [ ] | **Chức vụ khách hàng** | Chức vụ của người xác nhận nếu là doanh nghiệp. | Field `customerPosition` đã thu thập ở form nhưng CHƯA hiển thị trong template Báo giá. |
| [x] | **Chữ ký / xác nhận** | Khu vực ký, ghi rõ họ tên hoặc xác nhận của hai bên. | Có khoảng trống để ký ở cả hai bên. |

## GIAO DIỆN & IN ẤN

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Khổ giấy A4** | Đảm bảo template hiển thị chuẩn khi in hoặc xuất PDF. | `@page { size: A4; margin: 18mm 16mm; }`. |
| [x] | **Header** | Logo và thông tin doanh nghiệp được trình bày cân đối. | `buildLetterheadHTML()`. |
| [ ] | **Footer** | Có thể bổ sung thông tin liên hệ hoặc số trang nếu cần. | Chưa có footer (số trang, thông tin liên hệ lặp lại...). |
| [x] | **Font chữ** | Sử dụng font thống nhất và dễ đọc. | `font-serif` (Times New Roman) xuyên suốt. |
| [x] | **Tiêu đề section** | Các phần I, II, III,... có cấp độ hiển thị rõ ràng. | |
| [x] | **Bảng biểu** | Cột, hàng, padding và căn chỉnh được đồng nhất. | Dùng chung class `th`/`td`. |
| [x] | **Định dạng tiền** | Số tiền được định dạng thống nhất và dễ đọc. | `formatCurrency()` dùng `toLocaleString('vi-VN')`. |
| [x] | **Căn chỉnh số liệu** | Số lượng, đơn giá, thành tiền được căn chỉnh phù hợp. | Dùng class `text-right`/`text-center` cho cột số. |
| [x] | **Page Break** | Kiểm soát việc ngắt trang khi nội dung dài. | Dùng `break-inside-avoid` / `break-after-avoid`. |
| [x] | **Nội dung nhiều trang** | Header bảng có thể lặp lại khi bảng kéo dài sang trang mới. | Dùng `thead` với `table-header-group`. |
| [x] | **PDF Preview** | Kiểm tra giao diện trước khi xuất/in PDF. | Qua nút "In" (`window.print()`), tận dụng hộp thoại in của trình duyệt để xem trước / lưu PDF — chưa có nút "Xuất PDF" riêng. |
| [ ] | **Bản in thực tế** | Kiểm tra lại khoảng cách, kích thước chữ và vị trí chữ ký khi in. | Cần kiểm tra thủ công trên bản in thật, chưa xác nhận được qua code. |

## TOOL TẠO BÁO GIÁ

| Checkbox | Tên | Mô tả | Ghi chú rà soát |
|---|---|---|---|
| [x] | **Tạo báo giá** | Tạo một báo giá mới từ form. | `index.html` → "Xem Báo Giá" → `quote.html`. |
| [ ] | **Chọn khách hàng** | Cho phép chọn khách hàng đã có hoặc nhập khách hàng mới. | Chưa có danh sách khách hàng để chọn lại, chỉ nhập tay mỗi lần. |
| [x] | **Thêm chức năng** | Thêm các chức năng/hạng mục vào báo giá. | |
| [x] | **Sửa chức năng** | Chỉnh sửa thông tin của hạng mục đã thêm. | Sửa trực tiếp trên input/textarea. |
| [x] | **Xóa chức năng** | Xóa hạng mục khỏi báo giá. | |
| [ ] | **Sắp xếp chức năng** | Cho phép thay đổi thứ tự các hạng mục. | Chưa có tính năng kéo-thả/đổi thứ tự. |
| [x] | **Tự động tính tiền** | Tự động tính thành tiền, tạm tính, VAT và tổng giá trị. | |
| [ ] | **Tính tiền bằng chữ** | Tự động chuyển tổng tiền thành chữ tiếng Việt. | Hàm đã có (`numberToVietnameseWords`) nhưng chưa được gọi trong báo giá — trùng ghi chú ở mục "Bằng chữ" phía trên. |
| [x] | **Thêm dịch vụ khác** | Cho phép thêm tên miền, hosting, SMS, API,... | |
| [x] | **Quản lý thanh toán** | Thiết lập các đợt thanh toán và tỷ lệ tương ứng. | Có bảng tóm tắt kiểm tra tổng % / tổng tiền. |
| [x] | **Preview báo giá** | Xem trước báo giá trước khi xuất bản. | |
| [x] | **Xuất PDF** | Xuất báo giá thành file PDF chuẩn A4. | ⚠ Thông qua in trình duyệt (Ctrl+P → Save as PDF), chưa có nút "Xuất PDF" trực tiếp. |
| [x] | **In báo giá** | In trực tiếp báo giá. | |
| [x] | **Copy HTML** | Sao chép HTML của báo giá để sử dụng ở nơi khác. | |
| [x] | **Lưu báo giá** | Lưu lại dữ liệu báo giá để chỉnh sửa hoặc sử dụng sau. | Lưu vào `localStorage` trình duyệt (chỉ 1 bản duy nhất, không có lịch sử nhiều báo giá). |
| [ ] | **Nhân bản báo giá** | Tạo báo giá mới dựa trên một báo giá cũ. | Chưa có tính năng nhân bản — hiện chỉ lưu được 1 bản trong `localStorage`. |
| [x] | **Chuyển báo giá thành hợp đồng** | Tái sử dụng dữ liệu báo giá để tạo hợp đồng, hạn chế nhập lại dữ liệu. | Form dùng chung dữ liệu (`saveFormData`) để xuất cả Báo giá và Hợp đồng từ cùng 1 lần nhập. |
