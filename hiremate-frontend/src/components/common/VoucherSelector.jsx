import React, { useState, useEffect, useMemo } from 'react';
import { getVouchersForCheckout, getStoredVouchers } from '../../utils/voucherStorage';

/**
 * VoucherSelector.jsx - Enterprise High-End Coupon & Voucher Selection Component
 * Redesigned with spacious, luxury e-commerce digital ticket aesthetics (Shopee/Grab/Stripe style)
 * Features:
 * - Ultra-modern search & apply bar with 1-click popular suggestion chips
 * - VIP Perforated Digital Ticket card for applied voucher state
 * - Spacious, non-cramped voucher discovery drawer with search & filter tabs
 * - Automatic eligibility calculation & real-time VND savings preview
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'BIG_DISCOUNT'
  const [copiedCode, setCopiedCode] = useState('');

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
        setManualError(`Mã "${clean}" chỉ áp dụng cho: ${(matched.applicablePlans || []).join(', ')}`);
        return;
      }
    }

    // Kiểm tra đơn hàng tối thiểu
    if (matched.minOrderAmount && basePrice < matched.minOrderAmount) {
      setManualError(`Mã "${clean}" yêu cầu đơn hàng tối thiểu từ ${formatVND(matched.minOrderAmount)}.`);
      return;
    }

    // Áp dụng thành công
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
    setShowVoucherList(false);
  };

  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    }
  };

  // Lọc và tìm kiếm voucher trong danh sách
  const filteredVouchers = useMemo(() => {
    return availableVouchers.filter((v) => {
      // Tìm kiếm theo code hoặc mô tả
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (v.code || '').toLowerCase().includes(q);
        const matchDesc = (v.description || '').toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      // Lọc theo tab
      if (activeFilterTab === 'ELIGIBLE') {
        return v.isPlanEligible;
      }
      if (activeFilterTab === 'BIG_DISCOUNT') {
        return (v.discountPercent || 0) >= 30;
      }
      return true;
    });
  }, [availableVouchers, searchQuery, activeFilterTab]);

  const eligibleCount = availableVouchers.filter((v) => v.isPlanEligible).length;

  return (
    <div className="space-y-3 font-sans">
      {/* 1. HEADER SECTION VỚI NÚT MỞ RỘNG / THU GỌN */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b48bd] to-[#3a2d7d] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-lg">local_activity</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#1e1b4b] tracking-tight">
                Mã Giảm Giá &amp; Voucher Ưu Đãi
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#5b48bd] border border-purple-200">
                {availableVouchers.length} khả dụng
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Chọn voucher có sẵn hoặc nhập mã khuyến mãi để được trừ trực tiếp vào đơn hàng.
            </p>
          </div>
        </div>

        {availableVouchers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowVoucherList(!showVoucherList)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs shrink-0 ${
              showVoucherList
                ? 'bg-purple-50 text-[#5b48bd] border-[#5b48bd]/40'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-[#5b48bd]/30'
            }`}
          >
            <span className="material-symbols-outlined text-sm text-[#5b48bd]">
              {showVoucherList ? 'expand_less' : 'confirmation_number'}
            </span>
            <span>{showVoucherList ? 'Thu gọn' : `Kho voucher (${availableVouchers.length})`}</span>
          </button>
        )}
      </div>

      {/* 2. THẺ VOUCHER ĐÃ ÁP DỤNG THÀNH CÔNG (VIP PERFORATED TICKET CARD) */}
      {appliedVoucher ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/80 border-2 border-dashed border-emerald-300 p-4 shadow-sm animate-fade-in">
          {/* Lỗ khuyết vé 2 bên mép (Cutout Notches) */}
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-r border-emerald-300 shadow-inner"></div>
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-l border-emerald-300 shadow-inner"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-base text-emerald-950 tracking-wider bg-white/90 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                    {appliedVoucher.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-2xs">
                    GIẢM {appliedVoucher.discountPercent}%
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    Đã áp dụng
                  </span>
                </div>
                <p className="text-xs text-emerald-800 line-clamp-1 pt-0.5">
                  {appliedVoucher.description || 'Đã áp dụng ưu đãi giảm giá vào tổng tiền thanh toán'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowVoucherList(true)}
                className="text-xs font-bold text-[#5b48bd] hover:bg-purple-100/70 px-3 py-1.5 rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center gap-1 bg-white/80"
              >
                <span className="material-symbols-outlined text-xs">sync_alt</span>
                <span>Đổi mã khác</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onRemoveVoucher) onRemoveVoucher();
                  setManualCode('');
                  setManualError('');
                }}
                className="text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 bg-white/80"
                title="Gỡ bỏ voucher này khỏi đơn hàng"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
                <span>Gỡ mã</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Ô NHẬP MÃ VOUCHER THỦ CÔNG & CHIPS GỢI Ý */
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                local_offer
              </span>
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
                placeholder="Nhập mã voucher (VD: HIREMATE50, CANDIDATE20)..."
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-purple-200 focus:border-[#5b48bd] focus:ring-3 focus:ring-[#5b48bd]/15 uppercase font-mono font-bold bg-white text-[#1e1b4b] placeholder:text-slate-400 transition-all shadow-xs"
              />
              {manualCode && (
                <button
                  type="button"
                  onClick={() => {
                    setManualCode('');
                    setManualError('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs flex items-center justify-center cursor-pointer transition-colors"
                  title="Xóa mã đang nhập"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleManualApply}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#5b48bd] to-[#4338ca] hover:from-[#4a39a7] hover:to-[#3730a3] text-white text-xs sm:text-sm font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <span className="material-symbols-outlined text-base">redeem</span>
              <span>Áp Dụng</span>
            </button>
          </div>

          {/* Quick chips gợi ý voucher phổ biến */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] text-slate-500 font-medium">Gợi ý nhanh:</span>
            {availableVouchers.slice(0, 3).map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => {
                  setManualCode(v.code);
                  setManualError('');
                }}
                className="px-2.5 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#5b48bd] text-[11px] font-mono font-bold border border-purple-200 transition-all cursor-pointer flex items-center gap-1"
                title={`Bấm để điền mã ${v.code}`}
              >
                <span>{v.code}</span>
                <span className="text-[10px] font-sans font-semibold text-purple-700">(-{v.discountPercent}%)</span>
              </button>
            ))}
          </div>

          {manualError && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 animate-fade-in pt-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{manualError}</span>
            </p>
          )}
        </div>
      )}

      {/* 4. KHO VOUCHER KHẢ DỤNG (EXPANDABLE LUXURY TICKET DRAWER) */}
      {showVoucherList && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-purple-50/50 via-slate-50 to-purple-50/30 border border-purple-100 shadow-sm space-y-4 animate-fade-in">
          {/* Thanh tìm kiếm & bộ lọc */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-purple-100">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc nội dung ưu đãi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:border-[#5b48bd] font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: `Tất cả (${availableVouchers.length})` },
                { id: 'ELIGIBLE', label: `Hợp lệ (${eligibleCount})` },
                { id: 'BIG_DISCOUNT', label: 'Giảm ≥ 30%' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilterTab === tab.id
                      ? 'bg-[#5b48bd] text-white shadow-xs'
                      : 'bg-white hover:bg-purple-100/60 text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách thẻ Voucher (Ticket Style Cards) */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
            {filteredVouchers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
                <p className="text-xs font-semibold">Không tìm thấy voucher phù hợp với bộ lọc hiện tại.</p>
              </div>
            ) : (
              filteredVouchers.map((voucher) => {
                const isCurrentApplied = appliedVoucher && appliedVoucher.code === voucher.code;
                const isEligible = voucher.isPlanEligible;

                return (
                  <div
                    key={voucher.id || voucher.code}
                    className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col md:flex-row items-stretch shadow-2xs hover:shadow-md ${
                      isCurrentApplied
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/20'
                        : isEligible
                        ? 'bg-white border-purple-200/80 hover:border-[#5b48bd]'
                        : 'bg-slate-50/80 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* LEFT STUB: CUỐNG VÉ GIẢM GIÁ (TICKET STUB) */}
                    <div
                      className={`w-full md:w-32 shrink-0 p-3.5 flex md:flex-col items-center justify-between md:justify-center text-center relative ${
                        isEligible
                          ? 'bg-gradient-to-br from-[#5b48bd] via-[#4a39a7] to-[#32247b] text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase opacity-80 block">
                          GIẢM GIÁ
                        </span>
                        <div className="text-2xl sm:text-3xl font-black font-sans leading-none tracking-tight">
                          {voucher.discountPercent}%
                        </div>
                      </div>

                      {voucher.maxDiscountAmount && (
                        <span className="text-[10px] font-medium opacity-90 block mt-1">
                          Tối đa {formatVND(voucher.maxDiscountAmount).replace(' VNĐ', 'đ')}
                        </span>
                      )}

                      {/* Rãnh cắt vé (Ticket notch on dividing line) */}
                      <div className="hidden md:block absolute -right-2 top-0 w-4 h-4 rounded-full bg-slate-50 border-b border-purple-200"></div>
                      <div className="hidden md:block absolute -right-2 bottom-0 w-4 h-4 rounded-full bg-slate-50 border-t border-purple-200"></div>
                    </div>

                    {/* RIGHT BODY: NỘI DUNG VOUCHER & NÚT ÁP DỤNG */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3 min-w-0">
                      <div className="space-y-1.5">
                        {/* Row 1: Code pill, copy button, role tag, eligibility tag */}
                        <div className="flex items-center gap-2 flex-wrap justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs sm:text-sm text-[#1e1b4b] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 tracking-wider">
                              {voucher.code}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(voucher.code, e)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-[#5b48bd] flex items-center justify-center text-xs transition-colors cursor-pointer"
                              title="Sao chép mã voucher"
                            >
                              <span className="material-symbols-outlined text-xs">
                                {copiedCode === voucher.code ? 'check' : 'content_copy'}
                              </span>
                            </button>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {voucher.targetRole === 'RECRUITER'
                                ? 'Nhà Tuyển Dụng'
                                : voucher.targetRole === 'CANDIDATE'
                                ? 'Ứng Viên'
                                : 'Mọi khách hàng'}
                            </span>
                          </div>

                          {isEligible ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Hợp lệ với gói này</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">block</span>
                              <span>Không áp dụng</span>
                            </span>
                          )}
                        </div>

                        {/* Row 2: Description */}
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {voucher.description}
                        </p>

                        {/* Row 3: Metadata condition pills */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-purple-600">inventory_2</span>
                            <span className="line-clamp-1">
                              {voucher.applicableScope === 'ALL'
                                ? 'Áp dụng mọi gói dịch vụ'
                                : `Gói: ${(voucher.applicablePlans || []).join(', ')}`}
                            </span>
                          </span>

                          {voucher.validTo && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              <span>HSD: {voucher.validTo}</span>
                            </span>
                          )}
                        </div>

                        {/* Lý do không áp dụng */}
                        {!isEligible && voucher.ineligibilityReason && (
                          <div className="text-[11px] font-bold text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/80 flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-xs shrink-0">info</span>
                            <span>{voucher.ineligibilityReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Row 4: Bottom Action & Savings preview */}
                      <div className="flex items-center justify-between pt-2 border-t border-purple-100/80 flex-wrap gap-2">
                        <div>
                          {isEligible && voucher.estimatedDiscount > 0 ? (
                            <div className="text-xs font-black text-emerald-700 flex items-center gap-1">
                              <span>Ước tính tiết kiệm:</span>
                              <span className="text-sm font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg">
                                -{formatVND(voucher.estimatedDiscount)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Giảm {voucher.discountPercent}% giá trị đơn hàng
                            </span>
                          )}
                        </div>

                        <div>
                          {isCurrentApplied ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onRemoveVoucher) onRemoveVoucher();
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm group"
                              title="Bấm để gỡ bỏ voucher này"
                            >
                              <span className="group-hover:hidden flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                <span>Đang Áp Dụng</span>
                              </span>
                              <span className="hidden group-hover:flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">close</span>
                                <span>Gỡ Mã</span>
                              </span>
                            </button>
                          ) : isEligible ? (
                            <button
                              type="button"
                              onClick={() => handleApplySingleVoucher(voucher)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#4338ca] hover:from-[#4a39a7] hover:to-[#3730a3] text-white text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">add_task</span>
                              <span>Áp Dụng Ngay</span>
                            </button>
                          ) : (
                            <span className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">lock</span>
                              <span>Không Khả Dụng</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
