document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('document');
    const data = loadFormData();

    if (!data) {
        container.innerHTML = '<p class="text-center text-gray-500 italic p-8">Chưa có dữ liệu. Vui lòng quay lại <a href="index.html" class="text-blue-600 underline">form nhập liệu</a>.</p>';
        ['printBtn', 'copyBtn', 'pdfBtn'].forEach((id) => {
            document.getElementById(id).disabled = true;
        });
        return;
    }

    const totals = computeTotals(data);
    container.innerHTML = buildContractHTML(data, totals);
});

document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const container = document.getElementById('document');
    const htmlContent = '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Hợp Đồng</title>\n<script src="https://cdn.tailwindcss.com"></script>\n<style>body { font-family: "Times New Roman", serif; margin: 20px; line-height: 1.5; }</style>\n</head>\n<body>\n' + container.innerHTML + '\n</body>\n</html>';
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hop-dong.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
});

document.getElementById('pdfBtn').addEventListener('click', () => {
    const number = loadFormData()?.contractNumber?.trim() || 'hop-dong';
    window.html2pdf().set({
        margin: 10,
        filename: `${number.replace(/[^a-zA-Z0-9_-]+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(document.getElementById('document')).save();
});
