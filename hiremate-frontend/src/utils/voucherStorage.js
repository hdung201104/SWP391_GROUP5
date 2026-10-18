/**
 * voucherStorage.js
 * Quản trị danh mục voucher ưu đãi tập trung cho HireMate AI
 * Hỗ trợ phân quyền vai trò (CANDIDATE, RECRUITER, ALL) và phạm vi gói áp dụng
 */

const STORAGE_KEY = 'hiremate_vouchers_master';
const UPDATE_EVENT = 'hiremate_vouchers_updated';

export const DEFAULT_VOUCHERS = [
  {
    id: 1,
    code: 'HIREMATE50',
    discountPercent: 50,
    maxDiscountAmount: 150000,
    minOrderAmount: 0,
    targetRole: 'ALL', // Áp dụng cả Ứng viên & HR
    applicableScope: 'ALL', // Áp dụng tất cả các gói
    applicablePlanIds: [],
    applicablePlans: ['Tất cả các gói dịch vụ'],
    description: 'Giảm 50% (tối đa 150.000đ) cho tất cả khách hàng mới gia nhập HireMate AI',
    status: 'ACTIVE',
    isActive: true,
    usage: '68/100 lượt',
    usageLimit: 100,
    usedCount: 68,
    validTo: '2026-12-31',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 2,
    code: 'CANDIDATE20',
    discountPercent: 20,
    maxDiscountAmount: 100000,
    minOrderAmount: 50000,
    targetRole: 'CANDIDATE', // Chỉ dành cho Ứng viên
    applicableScope: 'ALL', // Tất cả các gói Ứng viên
    applicablePlanIds: ['CANDIDATE_STARTER', 'CANDIDATE_PRO', 'CANDIDATE_VIP', 'AI_CV_REWRITE', 'MOCK_PASS_10', 'FEATURED_CANDIDATE', 'HR_CONSULTING'],
    applicablePlans: ['Mọi gói nâng cấp & Add-on Ứng viên'],
    description: 'Giảm 20% độc quyền cho Ứng viên nâng cấp tài khoản hoặc mua gói ôn luyện phỏng vấn',
    status: 'ACTIVE',
    isActive: true,
    usage: '42/150 lượt',
    usageLimit: 150,
    usedCount: 42,
    validTo: '2026-11-30',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 3,
    code: 'FPTTALENT',
    discountPercent: 30,
    maxDiscountAmount: 200000,
    minOrderAmount: 100000,
    targetRole: 'CANDIDATE', // Chỉ dành cho Ứng viên
    applicableScope: 'SPECIFIC', // Chỉ áp dụng gói phỏng vấn và CV
    applicablePlanIds: ['CANDIDATE_PRO', 'CANDIDATE_VIP', 'AI_CV_REWRITE'],
    applicablePlans: ['Phỏng Vấn Đột Phá (Pro)', 'Career Mastery VIP 👑', 'AI CV Rewrite & ATS Pass'],
    description: 'Ưu đãi 30% gói Luyện phỏng vấn AI và Tối ưu hóa CV dành cho Sinh viên & Tài năng trẻ FPT',
    status: 'ACTIVE',
    isActive: true,
    usage: '85/200 lượt',
    usageLimit: 200,
    usedCount: 85,
    validTo: '2026-12-31',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    id: 4,
    code: 'PROHR2026',
    discountPercent: 30,
    maxDiscountAmount: 300000,
    minOrderAmount: 200000,
    targetRole: 'RECRUITER', // Chỉ dành cho HR / Doanh nghiệp
    applicableScope: 'ALL', // Mọi gói tuyển dụng
    applicablePlanIds: ['Hiring Starter', 'Hiring Pro', 'Enterprise Unlimited', 'pkg-2', 'pkg-3', 'pkg-4'],
    applicablePlans: ['Mọi gói đăng tin & tuyển dụng HR'],
    description: 'Giảm ngay 30% (tối đa 300.000đ) cho Nhà tuyển dụng đăng ký gói Hiring Pro và Enterprise',
    status: 'ACTIVE',
    isActive: true,
    usage: '38/100 lượt',
    usageLimit: 100,
    usedCount: 38,
    validTo: '2026-12-15',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 5,
    code: 'HRBOOST',
    discountPercent: 40,
    maxDiscountAmount: 400000,
    minOrderAmount: 500000,
    targetRole: 'RECRUITER', // Chỉ dành cho HR
    applicableScope: 'SPECIFIC', // Chỉ gói Pro và Enterprise
    applicablePlanIds: ['Hiring Pro', 'Enterprise Unlimited', 'pkg-3', 'pkg-4'],
    applicablePlans: ['Hiring Pro (Tuyển Dụng Nhanh)', 'Enterprise Unlimited (Doanh Nghiệp Lớn)'],
    description: 'Ưu đãi 40% cho Doanh nghiệp mở rộng quy mô tuyển dụng nhân sự cấp cao',
    status: 'ACTIVE',
    isActive: true,
    usage: '19/50 lượt',
    usageLimit: 50,
    usedCount: 19,
    validTo: '2026-11-20',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    id: 6,
    code: 'WELCOME2026',
    discountPercent: 20,
    maxDiscountAmount: 50000,
    minOrderAmount: 0,
    targetRole: 'ALL',
    applicableScope: 'ALL',
    applicablePlanIds: [],
    applicablePlans: ['Tất cả các gói dịch vụ'],
    description: 'Mã chào mừng thành viên mới - Giảm trực tiếp 20% cho đơn hàng đầu tiên',
    status: 'ACTIVE',
    isActive: true,
    usage: '112/300 lượt',
    usageLimit: 300,
    usedCount: 112,
    validTo: '2026-12-31',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 7,
    code: 'SPRINGTECH',
    discountPercent: 15,
    maxDiscountAmount: 50000,
    minOrderAmount: 0,
    targetRole: 'ALL',
    applicableScope: 'ALL',
    applicablePlanIds: [],
    applicablePlans: ['Tất cả các gói dịch vụ'],
    description: 'Đợt ưu đãi đầu mùa tuyển dụng (Đã hết hạn)',
    status: 'EXPIRED',
    isActive: false,
    usage: '100/100 lượt',
    usageLimit: 100,
    usedCount: 100,
    validTo: '2026-03-01',
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
  },
];

/**
 * Lấy toàn bộ danh sách voucher trong hệ thống
 */
export function getStoredVouchers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc vouchers từ localStorage:', err);
  }
  // Mặc định lưu và trả về danh sách ban đầu
  saveStoredVouchers(DEFAULT_VOUCHERS);
  return DEFAULT_VOUCHERS;
}

/**
 * Lưu danh sách voucher
 */
export function saveStoredVouchers(vouchers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: vouchers }));
  } catch (err) {
    console.warn('Lỗi ghi vouchers vào localStorage:', err);
  }
}

/**
 * Thêm voucher mới (khi Admin tạo)
 */
export function addStoredVoucher(newVoucher) {
  const current = getStoredVouchers();
  const exists = current.some((v) => v.code.toUpperCase() === newVoucher.code.toUpperCase());
  if (exists) {
    throw new Error(`Mã voucher "${newVoucher.code}" đã tồn tại trên hệ thống!`);
  }
  const updated = [newVoucher, ...current];
  saveStoredVouchers(updated);
  return updated;
}

/**
 * Bật / tắt trạng thái kích hoạt của voucher
 */
export function toggleStoredVoucher(voucherId) {
  const current = getStoredVouchers();
  const updated = current.map((v) => {
    if (v.id === voucherId || String(v.id) === String(voucherId)) {
      const nextActive = !v.isActive;
      return {
        ...v,
        isActive: nextActive,
        status: nextActive ? 'ACTIVE' : 'INACTIVE',
        badgeBg: nextActive 
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
          : 'bg-slate-100 text-slate-600 border-slate-200',
      };
    }
    return v;
  });
  saveStoredVouchers(updated);
  return updated;
}

/**
 * Lấy danh sách voucher khả dụng theo vai trò và kiểm tra tính hợp lệ với gói cụ thể
 * @param {string} userRole 'CANDIDATE' | 'RECRUITER'
 * @param {string|number} currentPlanId ID của gói đang mua (VD: 'CANDIDATE_PRO', 'AI_CV_REWRITE', 'Hiring Starter')
 * @param {string} currentPlanName Tên hiển thị của gói đang mua
 * @param {number} currentAmount Giá tiền của gói đang mua
 */
export function getVouchersForCheckout(userRole, currentPlanId, currentPlanName = '', currentAmount = 0) {
  const allVouchers = getStoredVouchers();
  const role = (userRole || 'CANDIDATE').toUpperCase();
  const planIdStr = currentPlanId ? String(currentPlanId).toLowerCase() : '';
  const planNameStr = (currentPlanName || '').toLowerCase();

  return allVouchers
    .filter((v) => {
      // 1. Phải đang kích hoạt (ACTIVE)
      if (!v.isActive || v.status === 'EXPIRED') return false;
      // 2. Phải khớp vai trò: 'ALL' hoặc đúng role của user
      const vRole = (v.targetRole || 'ALL').toUpperCase();
      return vRole === 'ALL' || vRole === role;
    })
    .map((v) => {
      // 3. Kiểm tra xem voucher có áp dụng được cho gói hiện tại không
      let isPlanEligible = false;
      let ineligibilityReason = '';

      if (v.applicableScope === 'ALL' || !v.applicableScope) {
        // Áp dụng cho tất cả các gói
        isPlanEligible = true;
      } else if (v.applicableScope === 'SPECIFIC') {
        const allowedIds = (v.applicablePlanIds || []).map((id) => String(id).toLowerCase());
        const allowedNames = (v.applicablePlans || []).map((name) => String(name).toLowerCase());

        const idMatched = planIdStr && allowedIds.some((id) => id === planIdStr || planIdStr.includes(id) || id.includes(planIdStr));
        const nameMatched = planNameStr && allowedNames.some((name) => name.includes(planNameStr) || planNameStr.includes(name));

        if (idMatched || nameMatched) {
          isPlanEligible = true;
        } else {
          isPlanEligible = false;
          ineligibilityReason = `Chỉ áp dụng cho: ${(v.applicablePlans || []).join(', ') || 'các gói chỉ định'}`;
        }
      }

      // 4. Kiểm tra đơn hàng tối thiểu (nếu có)
      let isMinOrderMet = true;
      if (v.minOrderAmount && currentAmount > 0 && currentAmount < v.minOrderAmount) {
        isPlanEligible = false;
        isMinOrderMet = false;
        ineligibilityReason = `Đơn tối thiểu ${Number(v.minOrderAmount).toLocaleString('vi-VN')} đ (Đơn hiện tại: ${Number(currentAmount).toLocaleString('vi-VN')} đ)`;
      }

      // 5. Tính toán thử số tiền giảm giá nếu áp dụng
      let estimatedDiscount = 0;
      if (isPlanEligible && currentAmount > 0) {
        const rawDiscount = (currentAmount * (v.discountPercent || 0)) / 100;
        estimatedDiscount = v.maxDiscountAmount && rawDiscount > v.maxDiscountAmount
          ? v.maxDiscountAmount
          : rawDiscount;
      }

      return {
        ...v,
        isPlanEligible,
        ineligibilityReason,
        estimatedDiscount,
      };
    });
}
