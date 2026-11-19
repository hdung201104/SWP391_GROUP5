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
    targetRole: 'ALL',
    applicableScope: 'ALL',
    applicablePlanIds: [],
    applicablePlans: ['Tất cả các gói nâng cấp'],
    description: 'Giảm 50% (tối đa 150.000đ) cho tất cả khách hàng mới nâng cấp dịch vụ HireMate AI',
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
    minOrderAmount: 40000,
    targetRole: 'CANDIDATE',
    applicableScope: 'ALL',
    applicablePlanIds: [6, 7, 8, '6', '7', '8', 'CANDIDATE_PLUS', 'CANDIDATE_PRO', 'CANDIDATE_ACE'],
    applicablePlans: ['Practice Plus', 'Practice Pro', 'Career Ace'],
    description: 'Giảm 20% độc quyền cho Ứng viên nâng cấp gói luyện phỏng vấn AI Voice',
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
    targetRole: 'CANDIDATE',
    applicableScope: 'SPECIFIC',
    applicablePlanIds: [7, 8, '7', '8', 'CANDIDATE_PRO', 'CANDIDATE_ACE'],
    applicablePlans: ['Practice Pro (149k)', 'Career Ace (249k)'],
    description: 'Ưu đãi 30% gói Luyện phỏng vấn AI chuyên sâu & Chẩn đoán STAR cho sinh viên FPT',
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
    minOrderAmount: 150000,
    targetRole: 'RECRUITER',
    applicableScope: 'ALL',
    applicablePlanIds: [2, 3, 4, '2', '3', '4', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
    applicablePlans: ['Hiring Starter', 'Hiring Pro', 'Hiring Elite'],
    description: 'Giảm ngay 30% (tối đa 300.000đ) cho Nhà tuyển dụng đăng ký gói tuyển dụng thông minh',
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
    minOrderAmount: 400000,
    targetRole: 'RECRUITER',
    applicableScope: 'SPECIFIC',
    applicablePlanIds: [3, 4, '3', '4', 'PROFESSIONAL', 'ENTERPRISE'],
    applicablePlans: ['Hiring Pro (499k)', 'Hiring Elite (1.199k)'],
    description: 'Ưu đãi 40% cho Doanh nghiệp nâng cấp gói Hiring Pro & Hiring Elite',
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
    applicablePlans: ['Tất cả các gói nâng cấp'],
    description: 'Mã chào mừng thành viên mới - Giảm trực tiếp 20% cho đơn hàng nâng cấp đầu tiên',
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
    applicablePlans: ['Tất cả các gói nâng cấp'],
    description: 'Đợt ưu đãi đầu mùa tuyển dụng (Đã hết hạn)',
    status: 'EXPIRED',
    isActive: false,
    usage: '100/100 lượt',
    usageLimit: 100,
    usedCount: 100,
    validTo: '2026-03-31',
    badgeBg: 'bg-slate-100 text-slate-500 border-slate-300',
  },
];

/**
 * Lấy toàn bộ danh sách voucher trong hệ thống
 */
export function getStoredVouchers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      if (raw.includes('AI_CV_REWRITE') || raw.includes('MOCK_PASS_10')) {
        saveStoredVouchers(DEFAULT_VOUCHERS);
        return DEFAULT_VOUCHERS;
      }
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
 * Chuẩn hóa đối tượng Voucher trả về từ API Supabase sang định dạng đồng nhất cho UI
 */
export function normalizeServerVoucher(v) {
  if (!v) return null;
  const code = String(v.code || '').trim().toUpperCase();
  if (!code) return null;
  const discountPercent = Number(v.discountPercent) || 0;
  const maxDiscountAmount = v.maxDiscountAmount != null ? Number(v.maxDiscountAmount) : 0;
  const minOrderAmount = v.minOrderAmount != null ? Number(v.minOrderAmount) : 0;
  const usageLimit = Number(v.usageLimit) || 100;
  const usedCount = Number(v.usedCount) || 0;
  const validToStr = v.validTo ? String(v.validTo).slice(0, 10) : '';
  const isExpired = validToStr ? new Date(validToStr + 'T23:59:59').getTime() < Date.now() : false;
  const isActive = v.isActive !== false && !isExpired && usedCount < usageLimit;
  const scope = (v.applicableScope || 'ALL').toUpperCase();
  const planIds = Array.isArray(v.applicablePlanIds) ? v.applicablePlanIds : [];

  return {
    id: v.voucherId || v.id || code,
    voucherId: v.voucherId || v.id || null,
    code,
    discount: discountPercent > 0 ? `Giảm ${discountPercent}%` : `Giảm ${maxDiscountAmount.toLocaleString('vi-VN')} đ`,
    discountPercent,
    maxDiscountAmount,
    minOrderAmount,
    targetRole: (v.targetRole || 'ALL').toUpperCase(),
    applicableScope: scope,
    applicablePlanIds: planIds,
    applicablePlans: Array.isArray(v.applicablePlans) && v.applicablePlans.length > 0
      ? v.applicablePlans
      : (scope === 'SPECIFIC' ? ['Các gói chỉ định'] : ['Tất cả các gói nâng cấp']),
    description: v.description || `Giảm ${discountPercent}%${maxDiscountAmount > 0 ? ` (tối đa ${maxDiscountAmount.toLocaleString('vi-VN')}đ)` : ''} khi nâng cấp gói dịch vụ`,
    status: isExpired ? 'EXPIRED' : (isActive ? 'ACTIVE' : 'INACTIVE'),
    isActive,
    usage: `${usedCount}/${usageLimit} lượt`,
    usageLimit,
    usedCount,
    validTo: validToStr || '2026-12-31',
    percent: usageLimit > 0 ? Math.min(100, Math.round((usedCount / usageLimit) * 100)) : 0,
    badgeBg: isActive
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : 'bg-slate-100 text-slate-600 border-slate-200',
  };
}

/**
 * Đồng bộ danh sách voucher thực tế từ Supabase vào localStorage (loại bỏ dữ liệu cũ/đã xóa)
 */
export function syncServerVouchersToStorage(serverList = []) {
  if (!Array.isArray(serverList)) return getStoredVouchers();
  const normalized = serverList.map(normalizeServerVoucher).filter(Boolean);
  if (normalized.length > 0) {
    saveStoredVouchers(normalized);
  }
  return normalized;
}

/**
 * Xóa voucher khỏi localStorage khi Admin xóa
 */
export function removeStoredVoucher(voucherIdOrCode) {
  const current = getStoredVouchers();
  const target = String(voucherIdOrCode || '').toUpperCase();
  const updated = current.filter(
    (v) => String(v.id) !== String(voucherIdOrCode) && String(v.voucherId) !== String(voucherIdOrCode) && String(v.code || '').toUpperCase() !== target
  );
  saveStoredVouchers(updated);
  return updated;
}

/**
 * Lấy danh sách voucher khả dụng theo vai trò và kiểm tra tính hợp lệ với gói cụ thể
 * @param {string} userRole 'CANDIDATE' | 'RECRUITER'
 * @param {string|number} currentPlanId ID của gói đang mua (VD: 6, 'PLAN_6', 'CANDIDATE_PRO')
 * @param {string} currentPlanName Tên hiển thị của gói đang mua
 * @param {number} currentAmount Giá tiền của gói đang mua
 * @param {Array|null} sourceVouchers Danh sách voucher trực tiếp từ backend (nếu có)
 */
export function getVouchersForCheckout(userRole, currentPlanId, currentPlanName = '', currentAmount = 0, sourceVouchers = null) {
  const allVouchers = Array.isArray(sourceVouchers) && sourceVouchers.length > 0
    ? sourceVouchers
    : getStoredVouchers();
  const role = (userRole || 'CANDIDATE').toUpperCase();
  const planIdStr = currentPlanId != null ? String(currentPlanId).trim().toLowerCase() : '';
  const numericPlanId = planIdStr ? planIdStr.replace(/^(plan_|pkg-)/i, '') : '';
  const planNameStr = (currentPlanName || '').trim().toLowerCase();

  return allVouchers
    .filter((v) => {
      // 1. Phải đang kích hoạt (ACTIVE) và chưa hết hạn
      if (!v.isActive || v.status === 'EXPIRED' || v.status === 'INACTIVE') return false;
      if (v.validTo && /^\d{4}-\d{2}-\d{2}/.test(String(v.validTo))) {
        const expMs = new Date(String(v.validTo).slice(0, 10) + 'T23:59:59').getTime();
        if (!isNaN(expMs) && expMs < Date.now()) return false;
      }
      if (v.usageLimit && v.usedCount != null && Number(v.usedCount) >= Number(v.usageLimit)) return false;
      // 2. Phải khớp vai trò: 'ALL' hoặc đúng role của user
      const vRole = (v.targetRole || 'ALL').toUpperCase();
      return vRole === 'ALL' || vRole === role;
    })
    .map((v) => {
      // 3. Kiểm tra xem voucher có áp dụng được cho gói hiện tại không
      let isPlanEligible = false;
      let ineligibilityReason = '';

      if (v.applicableScope === 'ALL' || !v.applicableScope) {
        isPlanEligible = true;
      } else if (v.applicableScope === 'SPECIFIC') {
        const allowedIds = (v.applicablePlanIds || []).map((id) => String(id).trim().toLowerCase().replace(/^(plan_|pkg-)/i, ''));
        const allowedNames = (v.applicablePlans || []).map((name) => String(name).trim().toLowerCase());

        // So khớp chính xác tuyệt đối theo ID (tránh lỗi substring kiểu "15" khớp nhầm "1" hay "5"!)
        const idMatched = Boolean(
          (numericPlanId && allowedIds.includes(numericPlanId)) ||
          (planIdStr && allowedIds.includes(planIdStr))
        );
        const nameMatched = Boolean(
          planNameStr && allowedNames.some((name) => name === planNameStr || name.startsWith(planNameStr + ' ('))
        );

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
