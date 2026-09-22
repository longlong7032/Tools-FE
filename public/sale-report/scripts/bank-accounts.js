// Danh sách tài khoản nhận thanh toán — nguồn dữ liệu duy nhất cho cả dropdown
// chọn tài khoản trong form (index.html) lẫn khối "Thông tin nhận thanh toán" +
// mã VietQR trong hợp đồng (contract-template.js). Mã BIN ngân hàng theo chuẩn Napas/VietQR.
const BANK_ACCOUNTS = [
    {
        id: 'nhan-acb',
        accountName: 'NGUYEN PHUC NHAN',
        bankLabel: 'ACB - PGD An Đông',
        bankBin: '970416',
        account: '194500879',
    },
    {
        id: 'nhan-dongabank',
        accountName: 'NGUYEN PHUC NHAN',
        bankLabel: 'Dong A Bank - Q10',
        bankBin: '970406',
        account: '0109527645',
    },
    {
        id: 'nhan-vietcombank',
        accountName: 'NGUYEN PHUC NHAN',
        bankLabel: 'Vietcombank - CN Phú Thọ',
        bankBin: '970436',
        account: '0421000488622',
    },
    {
        id: 'nhan-sacombank',
        accountName: 'NGUYEN PHUC NHAN',
        bankLabel: 'Sacombank - PGD Hòa Hảo',
        bankBin: '970403',
        account: '060200565455',
    },
    {
        id: 'nhan-agribank',
        accountName: 'NGUYEN PHUC NHAN',
        bankLabel: 'Agribank - CN Lý Thường Kiệt',
        bankBin: '970405',
        account: '1603205538619',
    },
    {
        id: 'nhan-ocb',
        accountName: 'NGUYEN PHUC NHAN',
        bankLabel: 'OCB - CN Chợ Lớn',
        bankBin: '970448',
        account: '0017100006209007',
    },
    {
        id: 'mevivu-vietcombank',
        accountName: 'CT TNHH MEVIVU',
        bankLabel: 'Vietcombank - CN Tân Định (PGD Phạm Ngọc Thạch)',
        bankBin: '970436',
        account: '0371000513507',
    },
];

const DEFAULT_BANK_ACCOUNT_ID = 'mevivu-vietcombank';

function findBankAccount(id) {
    return BANK_ACCOUNTS.find(acc => acc.id === id)
        || BANK_ACCOUNTS.find(acc => acc.id === DEFAULT_BANK_ACCOUNT_ID)
        || BANK_ACCOUNTS[0];
}

// Template "compact2" của img.vietqr.io: chỉ hiện mã QR + logo ngân hàng, không kèm
// khung card lớn — phù hợp để nhúng cạnh khối thông tin thanh toán trên A4.
function buildVietQrUrl(bankAccount, amount, addInfo) {
    const params = new URLSearchParams();
    if (amount > 0) params.set('amount', String(Math.round(amount)));
    if (addInfo) params.set('addInfo', addInfo);
    params.set('accountName', bankAccount.accountName);
    return `https://img.vietqr.io/image/${bankAccount.bankBin}-${bankAccount.account}-compact2.png?${params.toString()}`;
}
