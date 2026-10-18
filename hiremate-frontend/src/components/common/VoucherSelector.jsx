import React, { useState, useEffect } from 'react';
import { getVouchersForCheckout, getStoredVouchers } from '../../utils/voucherStorage';

/**
 * VoucherSelector.jsx
 * Component chọn và áp dụng mã giảm giá / voucher chuyên nghiệp
 * Tự động phân quyền theo vai trò (CANDIDATE/RECRUITER) và kiểm tra tính hợp lệ với gói dịch vụ đang mua
 */
export default function VoucherSelector({
  userRole = 'CANDIDATE',
  currentPlanId,
  currentPlanName = '',
  basePrice = 0,
  appliedVoucher = null,
  onApplyVoucher,
  onRemoveVoucher,
}) {
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState([]);

  const formatVND = (amount) => {
    if (!amount || amount === 0) return '0 VNĐ';
    return Math.round(amount).toLocaleString('vi-VN') + ' VNĐ';
  };

  const loadVouchers = () => {
    const list = getVouchersForCheckout(userRole, currentPlanId, currentPlanName, basePrice);
    setAvailableVouchers(list);
  };

  useEffect(() => {
    loadVouchers();
    const handleUpdate = () => loadVouchers();
    window.addEventListener('hiremate_vouchers_updated', handleUpdate);
    return () => window.removeEventListener('hiremate_vouchers_updated', handleUpdate);
  }, [userRole, currentPlanId, currentPlanName, basePrice]);

  const handleApplySingleVoucher = (voucher) => {
    if (!voucher.isPlanEligible) {
      alert(`Voucher "${voucher.code}" không áp dụng cho gói "${currentPlanName}".\nLý do: ${voucher.ineligibilityReason}`);
      return;
    }

    const discountVal = voucher.discountPercent || 0;
    let discountAmount = 0;
    if (basePrice > 0) {
      const raw = (basePrice * discountVal) / 100;
      discountAmount = voucher.maxDiscountAmount && raw > voucher.maxDiscountAmount
        ? voucher.maxDiscountAmount
        : raw;
    }

    if (onApplyVoucher) {
      onApplyVoucher(voucher, discountAmount);
    }
    setManualCode(voucher.code);
    setManualError('');
    setShowVoucherList(false);
  };

  const handleManualApply = () => {
    const clean = manualCode.trim().toUpperCase();
    if (!clean) {
      setManualError('Vui lòng nhập mã voucher!');
      return;
    }

    const all = getStoredVouchers();
    const matched = all.find((v) => v.code.toUpperCase() === clean);

    if (!matched) {
      setManualError(`Mã voucher "${clean}" không tồn tại trên hệ thống.`);
      return;
    }

    if (!matched.isActive || matched.status === 'EXPIRED') {
      setManualError(`Mã voucher "${clean}" đã hết hạn hoặc đang tạm khóa.`);
      return;
    }

    // Kiểm tra vai trò
    const vRole = (matched.targetRole || 'ALL').toUpperCase();
    const myRole = (userRole || 'CANDIDATE').toUpperCase();
    if (vRole !== 'ALL' && vRole !== myRole) {
      const roleText = vRole === 'RECRUITER' ? 'Nhà Tuyển Dụng' : 'Ứng Viên';
      setManualError(`Mã "${clean}" chỉ dành riêng cho tài khoản ${roleText}.`);
      return;
    }

    // Kiểm tra phạm vi gói
    if (matched.applicableScope === 'SPECIFIC') {
      const planIdStr = currentPlanId ? String(currentPlanId).toLowerCase() : '';
      const planNameStr = (currentPlanName || '').toLowerCase();
      const allowedIds = (matched.applicablePlanIds || []).map((id) => String(id).toLowerCase());
      const allowedNames = (matched.applicablePlans || []).map((name) => String(name).toLowerCase());

      const idMatched = planIdStr && allowedIds.some((id) => id === planIdStr || planIdStr.includes(id) || id.includes(planIdStr));
      const nameMatched = planNameStr && allowedNames.some((name) => name.includes(planNameStr) || planNameStr.includes(name));

      if (!idMatched && !nameMatched) {
        setManualError(`Mã "${clean}" không áp dụng cho gói "${currentPlanName}". Chỉ áp dụng cho: ${(matched.applicablePlans || []).join(', ')}`);
        return;
      }
    }

    // Đơn hàng tối thiểu
    if (matched.minOrderAmount && basePrice > 0 && basePrice < matched.minOrderAmount) {
      setManualError(`Đơn hàng tối thiểu để áp dụng mã này là ${formatVND(matched.minOrderAmount)}.`);
      return;
    }

    // Hợp lệ!
    const discountVal = matched.discountPercent || 0;
    let discountAmount = 0;
    if (basePrice > 0) {
      const raw = (basePrice * discountVal) / 100;
      discountAmount = matched.maxDiscountAmount && raw > matched.maxDiscountAmount
        ? matched.maxDiscountAmount
        : raw;
    }

    if (onApplyVoucher) {
      onApplyVoucher(matched, discountAmount);
    }
    setManualError('');
  };

  const eligibleCount = availableVouchers.filter((v) => v.isPlanEligible).length;

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#5b48bd] text-base">sell</span>
          <span>Mã Giảm Giá &amp; Voucher Ưu Đãi:</span>
        </label>

        {availableVouchers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowVoucherList(!showVoucherList)}
            className="text-[11px] font-bold text-[#5b48bd] hover:underline flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100/70 px-2.5 py-1 rounded-full border border-purple-200 transition-all"
          >
            <span className="material-symbols-outlined text-xs">local_activity</span>
            <span>
              {showVoucherList ? 'Thu gọn danh sách' : `Xem mã ưu đãi (${eligibleCount} khả dụng)`}
            </span>
            <span className="material-symbols-outlined text-xs">
              {showVoucherList ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        )}
      </div>

      {/* Thẻ voucher ĐÃ ĐƯỢC ÁP DỤNG */}
      {appliedVoucher ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-800 text-sm tracking-wider">
                  {appliedVoucher.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                  Giảm {appliedVoucher.discountPercent}%
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5 line-clamp-1">
                {appliedVoucher.description || 'Đã áp dụng thành công mã ưu đãi cho gói dịch vụ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onRemoveVoucher) onRemoveVoucher();
              setManualCode('');
              setManualError('');
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-100/70 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-2"
            title="Gỡ bỏ voucher này"
          >
            <span className="material-symbols-outlined text-xs">close</span>
            <span>Gỡ mã</span>
          </button>
        </div>
      ) : (
        /* Ô NHẬP MÃ THỦ CÔNG */
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase().replace(/\s/g, ''));
                  setManualError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualApply();
                  }
                }}
                placeholder="Nhập mã voucher (VD: HIREMATE50, CANDIDATE20)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 uppercase font-mono font-bold bg-white"
              />
              {manualCode && (
                <button
                  type="button"
                  onClick={() => {
                    setManualCode('');
                    setManualError('');
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleManualApply}
              className="px-4 py-2.5 rounded-xl bg-[#5b48bd] hover:bg-[#4a39a7] text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">redeem</span>
              <span>Áp Dụng</span>
            </button>
          </div>

          {manualError && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 animate-fade-in pt-0.5">
              <span className="material-symbols-outlined text-xs">error</span>
              <span>{manualError}</span>
            </p>
          )}
        </div>
      )}

      {/* DANH SÁCH VOUCHER ĐƯỢC CHỌN (ACCORDION / DRAWER) */}
      {showVoucherList && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-purple-100 space-y-2.5 max-h-60 overflow-y-auto scrollbar-thin animate-fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1 border-b border-purple-100 pb-1.5">
            <span>Mã voucher dành cho {userRole === 'RECRUITER' ? 'Nhà Tuyển Dụng' : 'Ứng Viên'}:</span>
            <span className="text-[#5b48bd]">{availableVouchers.length} mã khả dụng</span>
          </div>

          <div className="space-y-2">
            {availableVouchers.map((voucher) => {
              const isCurrentApplied = appliedVoucher && appliedVoucher.code === voucher.code;
              const isEligible = voucher.isPlanEligible;

              return (
                <div
                  key={voucher.id || voucher.code}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isCurrentApplied
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-2xs'
                      : isEligible
                      ? 'bg-white border-purple-200 hover:border-[#5b48bd] shadow-2xs'
                      : 'bg-slate-100/70 border-slate-200 opacity-65'
                  }`}
                >
                  {/* Left: Code, Discount, Scope Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-[#1e1b4b] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                        {voucher.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5b48bd] text-white">
                        Giảm {voucher.discountPercent}%
                      </span>
                      {voucher.maxDiscountAmount && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          (Tối đa {formatVND(voucher.maxDiscountAmount)})
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-tight">
                      {voucher.description}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5 flex-wrap">
                      <span className="flex items-center gap-0.5 text-slate-600 font-medium">
                        <span className="material-symbols-outlined text-[11px]">inventory_2</span>
                        <span>
                          {voucher.applicableScope === 'ALL'
                            ? 'Mọi gói dịch vụ'
                            : `Áp dụng: ${(voucher.applicablePlans || []).join(', ')}`}
                        </span>
                      </span>

                      {voucher.validTo && (
                        <span className="text-slate-400">• HSD: {voucher.validTo}</span>
                      )}
                    </div>

                    {/* Lý do không áp dụng nếu không hợp lệ */}
                    {!isEligible && voucher.ineligibilityReason && (
                      <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 pt-0.5">
                        <span className="material-symbols-outlined text-xs">info</span>
                        <span>{voucher.ineligibilityReason}</span>
                      </p>
                    )}
                  </div>

                  {/* Right: Action Button & Discount preview */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    {isEligible && voucher.estimatedDiscount > 0 && (
                      <span className="text-[11px] font-black text-emerald-700">
                        Tiết kiệm: -{formatVND(voucher.estimatedDiscount)}
                      </span>
                    )}

                    {isCurrentApplied ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRemoveVoucher) onRemoveVoucher();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-rose-600 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 group"
                        title="Bấm để gỡ bỏ voucher này"
                      >
                        <span className="group-hover:hidden flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check</span>
                          <span>Đang Áp Dụng</span>
                        </span>
                        <span className="hidden group-hover:flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">close</span>
                          <span>Gỡ Mã</span>
                        </span>
                      </button>
                    ) : isEligible ? (
                      <button
                        type="button"
                        onClick={() => handleApplySingleVoucher(voucher)}
                        className="px-3 py-1.5 rounded-lg bg-[#5b48bd] hover:bg-[#4a39a7] text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">add_task</span>
                        <span>Áp Dụng Ngay</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-500 text-[10px] font-bold cursor-not-allowed">
                        Không Khả Dụng
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
