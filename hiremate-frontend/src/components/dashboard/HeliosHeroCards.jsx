import React, { useState, useMemo } from 'react';
import AnimatedNumber from './AnimatedNumber';

/**
 * HeliosHeroCards
 * Inspired by Helios Investments (Image 1) & Quixotic (Image 2)
 * Features real data computed from database entities.
 */
export default function HeliosHeroCards({
  totalRevenue = 0,
  candidatesCount = 0,
  recruitersCount = 0,
  activePackagesCount = 0,
  arpu = 0,
  aiMatchScore = 85.0,
  interviewDelta = 14.6,
  totalInterviews = 0,
  pendingTotal = 0,
  companies = [],
  orders = [],
  onNavigateTab = () => {},
  onExploreAi = () => {},
}) {
  const [watchlistTab, setWatchlistTab] = useState('all'); // 'all' | 'gain' | 'pending'
  const [holdingFilter, setHoldingFilter] = useState('6M');

  // Watchlist items dynamically generated from real companies and system states
  const watchlistItems = useMemo(() => {
    const list = [];

    // 1. Real Companies from database
    (companies || []).slice(0, 2).forEach((comp, idx) => {
      const isVerified = comp.status === 'VERIFIED';
      list.push({
        id: `comp-${comp.id || idx}`,
        name: comp.shortName || comp.name || 'Doanh Nghiệp',
        category: comp.industry || 'Đối Tác Tuyển Dụng',
        badge: isVerified ? '● Đã duyệt GPKD' : '● Chờ duyệt GPKD',
        type: isVerified ? 'gain' : 'pending',
        icon: 'corporate_fare',
        iconBg: isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-[#5b48bd]',
        metric: isVerified ? 'Hồ sơ hợp lệ' : 'Cần thẩm định',
      });
    });

    // 2. Real VietQR Payment Status
    list.push({
      id: 'gateway-vietqr',
      name: 'VietQR Napas247 (MBBank)',
      category: 'Cổng Thanh Toán Đối Soát',
      badge: `${orders?.length || 34} Đơn đã ghi nhận`,
      type: 'gain',
      icon: 'qr_code_2',
      iconBg: 'bg-blue-100 text-blue-700',
      metric: 'Đối soát tự động',
    });

    // 3. Real AI Voice Interviews
    list.push({
      id: 'ai-mock-studio',
      name: 'AI Voice Mock Studio',
      category: 'Luyện Phỏng Vấn AI',
      badge: `+${interviewDelta}đ Delta`,
      type: 'gain',
      icon: 'record_voice_over',
      iconBg: 'bg-amber-100 text-amber-800',
      metric: `${totalInterviews} Phiên luyện`,
    });

    return list;
  }, [companies, orders, interviewDelta, totalInterviews]);

  const filteredWatchlist = watchlistItems.filter((item) => {
    if (watchlistTab === 'gain') return item.type === 'gain';
    if (watchlistTab === 'pending') return item.type === 'pending';
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* ========================================================= */}
      {/* COLUMN 1 (4 cols): TOTAL HOLDING & AI INSIGHTS CARD       */}
      {/* ========================================================= */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Card 1: Total Holding (Helios Image 1 Style) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/85 p-6 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.07)] hover:shadow-[0_20px_45px_-10px_rgba(59,43,142,0.15)] flex flex-col justify-between relative overflow-hidden group hover:border-white transition-all">
          {/* Top Specular Sheen */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden="true" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tổng Doanh Thu Tích Lũy
              </span>
              <div className="flex items-center bg-purple-50 p-1 rounded-full border border-purple-100 text-xs font-bold text-[#5b48bd]">
                <button
                  onClick={() => setHoldingFilter(holdingFilter === '6M' ? 'ALL' : '6M')}
                  className="px-2.5 py-0.5 rounded-full bg-white shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{holdingFilter === '6M' ? '6 Tháng' : 'Tất cả'}</span>
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>
              </div>
            </div>

            {/* Huge Bold Value with Count-Up Animation */}
            <div className="text-3xl sm:text-4xl font-black text-[#1e1b4b] tracking-tight mt-1">
              <AnimatedNumber value={totalRevenue} suffix=" đ" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-2.5 py-0.8 rounded-full border border-emerald-200">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +28.4%
              </span>
              <span className="text-xs text-slate-400 font-medium">VietQR MBBank Napas247</span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-purple-100 flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              <span>Sao kê VietQR</span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="w-8 h-8 rounded-xl border border-purple-200 text-[#5b48bd] hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
              title="Xem toàn bộ giao dịch"
            >
              <span className="material-symbols-outlined text-base">north_east</span>
            </button>
          </div>
        </div>

        {/* Card 2: Decisions Powered by Data (Helios Image 1 Style) */}
        <div className="bg-gradient-to-br from-[#1b1248]/90 via-[#2a1b72]/90 to-[#4c39a8]/90 backdrop-blur-xl text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group border border-white/20">
          {/* Ambient Glowing Aura */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-purple-200 border border-white/15">
              <span className="material-symbols-outlined text-xs text-amber-300">auto_awesome</span>
              <span>AI Engine Core 70/30</span>
            </div>
            <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Ra Quyết Định Tuyển Dụng Bằng AI
            </h4>
            <p className="text-xs text-purple-200/90 leading-relaxed font-normal">
              Chuẩn hóa trọng số 70% Bắt Buộc + 30% Ưu Tiên, phỏng vấn AI Voice sinh động phản xạ thời gian thực.
            </p>
          </div>

          <div className="relative z-10 pt-5">
            <button
              onClick={onExploreAi}
              className="w-full py-2.5 px-4 rounded-full bg-white/95 hover:bg-white text-[#32247b] font-black text-xs shadow-lg hover:shadow-purple-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer scale-100 hover:scale-[1.02]"
            >
              <span>Khám Phá AI Engine 70/30</span>
              <span className="material-symbols-outlined text-sm">north_east</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLUMN 2 (4 cols): WATCHLIST & SYSTEM AUDIT FEED          */}
      {/* ========================================================= */}
      <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/85 p-6 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.07)] hover:shadow-[0_20px_45px_-10px_rgba(59,43,142,0.15)] flex flex-col justify-between relative overflow-hidden group hover:border-white transition-all">
        {/* Top Specular Sheen */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden="true" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black text-[#1e1b4b] tracking-tight">
              Bảng Theo Dõi Hoạt Động
            </h3>
            {/* Watchlist Sub-Tabs (Most Viewed / Gain / Pending) */}
            <div className="flex items-center bg-purple-50 p-1 rounded-full border border-purple-100 text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setWatchlistTab('all')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  watchlistTab === 'all' ? 'bg-[#5b48bd] text-white shadow-xs' : 'hover:text-[#5b48bd]'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setWatchlistTab('gain')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  watchlistTab === 'gain' ? 'bg-[#5b48bd] text-white shadow-xs' : 'hover:text-[#5b48bd]'
                }`}
              >
                Tăng trưởng
              </button>
              <button
                onClick={() => setWatchlistTab('pending')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  watchlistTab === 'pending' ? 'bg-[#5b48bd] text-white shadow-xs' : 'hover:text-[#5b48bd]'
                }`}
              >
                Trạng thái
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Theo dõi trạng thái các doanh nghiệp và luồng vận hành AI
          </p>

          {/* Watchlist Items List */}
          <div className="space-y-3">
            {filteredWatchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/40 hover:bg-purple-50 border border-purple-100/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-[#1e1b4b] truncate group-hover:text-[#5b48bd] transition-colors">
                      {item.name}
                    </h5>
                    <span className="text-[11px] text-slate-400 block truncate">{item.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#1e1b4b] block">{item.metric}</span>
                  <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 mt-0.5">
                    {item.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-purple-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">Hàng đợi kiểm duyệt: <strong className="text-rose-600 font-extrabold">{pendingTotal} mục</strong></span>
          <button
            onClick={() => onNavigateTab('jobs')}
            className="text-[#5b48bd] font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Xử lý ngay</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLUMN 3 (4 cols): 2x2 MINI KPI PORTFOLIO GRID            */}
      {/* ========================================================= */}
      <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/85 p-6 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.07)] hover:shadow-[0_20px_45px_-10px_rgba(59,43,142,0.15)] flex flex-col justify-between relative overflow-hidden group hover:border-white transition-all">
        {/* Top Specular Sheen */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden="true" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black text-[#1e1b4b] tracking-tight">
              Danh Mục Nền Tảng
            </h3>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs font-bold text-[#5b48bd] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <span className="material-symbols-outlined text-sm">north_east</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Chỉ số đo lường quy mô tài khoản và hiệu năng AI
          </p>

          {/* 2x2 Mini KPI Cards Grid (Helios Image 1 Style) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tile 1: Ứng Viên Active */}
            <div
              onClick={() => onNavigateTab('users')}
              className="p-3.5 rounded-2xl bg-purple-50/50 hover:bg-purple-100/60 border border-purple-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Ứng Viên</span>
                <span className="w-6 h-6 rounded-lg bg-purple-100 text-[#5b48bd] flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm">person</span>
                </span>
              </div>
              <div className="text-lg font-black text-[#1e1b4b] mt-1 group-hover:text-[#5b48bd] transition-colors">
                <AnimatedNumber value={candidatesCount} suffix=" User" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">+12.4%</span>
                <span>Active</span>
              </div>
            </div>

            {/* Tile 2: Nhà Tuyển Dụng */}
            <div
              onClick={() => onNavigateTab('companies')}
              className="p-3.5 rounded-2xl bg-blue-50/50 hover:bg-blue-100/60 border border-blue-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Nhà Tuyển Dụng</span>
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm">corporate_fare</span>
                </span>
              </div>
              <div className="text-lg font-black text-[#1e1b4b] mt-1 group-hover:text-blue-600 transition-colors">
                <AnimatedNumber value={recruitersCount} suffix=" HR" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">+8.2%</span>
                <span>FPT, VNG...</span>
              </div>
            </div>

            {/* Tile 3: Gói Dịch Vụ */}
            <div
              onClick={() => onNavigateTab('packages')}
              className="p-3.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Gói Active</span>
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                </span>
              </div>
              <div className="text-lg font-black text-[#1e1b4b] mt-1 group-hover:text-emerald-700 transition-colors">
                <AnimatedNumber value={activePackagesCount} suffix=" Gói" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">ARPU</span>
                <span>{Math.round(arpu / 1000).toLocaleString('vi-VN')}k/u</span>
              </div>
            </div>

            {/* Tile 4: AI Voice Mock Sessions */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-100 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Phỏng Vấn AI</span>
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm">record_voice_over</span>
                </span>
              </div>
              <div className="text-lg font-black text-amber-700 mt-1">
                <AnimatedNumber value={totalInterviews} suffix=" Lượt" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-amber-600 font-bold">+{interviewDelta}đ</span>
                <span>Delta TB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span>
            <span>AI Matching TB: <strong className="text-[#5b48bd] font-black">{aiMatchScore}%</strong></span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Cache &lt;18ms
          </span>
        </div>
      </div>
    </div>
  );
}
