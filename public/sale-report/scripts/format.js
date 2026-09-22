function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + ' VNĐ';
}

function numberToVietnameseWords(amount) {
    const number = Math.abs(Math.round(amount || 0));
    if (number === 0) return 'Không đồng';

    const ONES = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const SCALE_LABELS = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ', ' tỷ tỷ'];

    function readThreeDigits(n, isFirstGroup) {
        const hundred = Math.floor(n / 100);
        const ten = Math.floor((n % 100) / 10);
        const unit = n % 10;
        const words = [];

        if (hundred > 0 || !isFirstGroup) {
            words.push(ONES[hundred] || 'không', 'trăm');
        }

        if (ten === 0) {
            if (unit > 0 && words.length > 0) words.push('linh');
            if (unit > 0) words.push(ONES[unit]);
        } else if (ten === 1) {
            words.push('mười');
            if (unit === 5) words.push('lăm');
            else if (unit > 0) words.push(ONES[unit]);
        } else {
            words.push(ONES[ten] + ' mươi');
            if (unit === 1) words.push('mốt');
            else if (unit === 5) words.push('lăm');
            else if (unit > 0) words.push(ONES[unit]);
        }

        return words.join(' ').trim();
    }

    const groups = [];
    let remaining = number;
    while (remaining > 0) {
        groups.push(remaining % 1000);
        remaining = Math.floor(remaining / 1000);
    }

    const parts = [];
    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] === 0) continue;
        const isFirstGroup = i === groups.length - 1;
        const scaleLabel = i < SCALE_LABELS.length ? SCALE_LABELS[i] : SCALE_LABELS[SCALE_LABELS.length - 1];
        parts.push(readThreeDigits(groups[i], isFirstGroup) + scaleLabel);
    }

    const sentence = parts.join(' ').replace(/\s+/g, ' ').trim();
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ' đồng';
}

function splitDate(dateStr) {
    if (!dateStr) return { day: '', month: '', year: '' };
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { day: '', month: '', year: '' };
    return {
        day: String(dateObj.getDate()).padStart(2, '0'),
        month: String(dateObj.getMonth() + 1).padStart(2, '0'),
        year: dateObj.getFullYear(),
    };
}
