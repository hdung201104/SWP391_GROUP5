import React from 'react';
import { CompanyLogoImg } from '../common/SmartImage';
import {
  normalizeCompanyProfile,
  saveCompanyPreviewCache,
  FALLBACK_COVER_IMAGE,
  FALLBACK_WORKPLACE_IMAGE,
} from '../../utils/companyProfileUtils';

export default function CompanyProfileModal({
  company,
  isOpen,
  onClose,
  onViewJobs,
}) {
  if (!isOpen || !company) return null;

  const normalized = normalizeCompanyProfile(company);
  const {
    companyId: compId,
    displayName,
    logoUrl: logoSrc,
    coverUrl: coverSrc,
    locations,
    workplacePhotos,
    benefits: companyBenefits,
    branches: branchesList,
  } = normalized;
  const activeJobs = normalized.activeJobsCount || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-purple-100 transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. REAL COVER PHOTO BANNER                                 */}
        {/* ========================================================= */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden bg-slate-800">
          <img 
            src={coverSrc} 
            alt={`${displayName} Cover`} 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_COVER_IMAGE;
            }}
          />
          {/* Subtle gradient overlay to enhance legibility and badge clarity */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-black/40" />

          {/* Top Bar with Verified Badge and Close Button */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300 shadow-sm">
              <span className="material-symbols-outlined text-sm text-emerald-400">verified</span>
              <span>HỒ SƠ DOANH NGHIỆP XÁC THỰC</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-sm hover:scale-105"
              title="Đóng cửa sổ"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. OVERLAPPING IDENTITY & DETAILS BAR (Fix text contrast) */}
        {/* ========================================================= */}
        <div className="px-6 sm:px-8 pb-5 pt-3 relative bg-white border-b border-purple-100 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 relative z-10">
            {/* Logo + Titles */}
            <div className="flex items-end gap-4 min-w-0 flex-1">
              {/* White-framed Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center p-2 overflow-hidden shrink-0">
                <CompanyLogoImg
                  src={logoSrc}
                  companyName={displayName}
                  alt={displayName}
                  className="w-full h-full object-contain"
                  fallbackClassName="w-full h-full font-black text-2xl text-[#5b48bd] flex items-center justify-center tracking-wider bg-purple-50 rounded-xl"
                  maxInitials={3}
                />
              </div>

              {/* Company Name & Badges with 100% Crisp Contrast */}
              <div className="space-y-1.5 min-w-0 flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-[#1e1b4b] tracking-tight leading-tight">
                    {displayName}
                  </h2>
                  <span className="material-symbols-outlined text-emerald-600 text-xl" title="Doanh nghiệp xác thực">
                    verified
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-2xs">
                    TOP ĐỐI TÁC
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-[#f4f2fd] text-[#5b48bd] font-bold border border-purple-100">
                    {normalized.industry}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{activeJobs} vị trí đang tuyển</span>
                  </span>
                </div>
              </div>
            </div>

            {/* External Website Button */}
            {normalized.website && (
              <a
                href={normalized.website.startsWith('http') ? normalized.website : `https://${normalized.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f4f2fd] hover:bg-purple-100 text-[#5b48bd] text-xs font-bold transition-all shadow-2xs border border-purple-100 shrink-0"
              >
                <span>Website chính thức</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. SCROLLABLE BODY CONTENT (RICH SECTIONS)                */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-7 flex-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
              <span className="material-symbols-outlined text-[#5b48bd] text-2xl mb-1">groups</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quy mô</p>
              <h4 className="text-xs sm:text-sm font-black text-[#1e1b4b] mt-0.5 truncate">
                {normalized.companySize}
              </h4>
            </div>

            <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
              <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1">domain_add</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi nhánh</p>
              <h4 className="text-xs sm:text-sm font-black text-[#1e1b4b] mt-0.5">
                {Math.max(branchesList.length, locations.length)} cơ sở
              </h4>
            </div>

            <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
              <span className="material-symbols-outlined text-amber-500 text-2xl mb-1">verified_user</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pháp nhân</p>
              <h4 className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">
                100% Xác thực
              </h4>
            </div>

            <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
              <span className="material-symbols-outlined text-[#f97316] text-2xl mb-1">local_fire_department</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Việc làm</p>
              <h4 className="text-xs sm:text-sm font-black text-[#f97316] mt-0.5">
                {activeJobs} vị trí
              </h4>
            </div>
          </div>

          {/* Section: Giới thiệu doanh nghiệp */}
          <div className="space-y-2.5">
            <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#5b48bd] text-lg">info</span>
              <span>Giới Thiệu Doanh Nghiệp</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-[#fcfbfe] rounded-2xl p-4 border border-purple-100/60 shadow-2xs whitespace-pre-line">
              {normalized.description}
            </p>
          </div>

          {/* Section: Trụ sở & Chi nhánh tuyển dụng */}
          <div className="space-y-2.5">
            <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#5b48bd] text-lg">pin_drop</span>
              <span>Trụ Sở &amp; Chi Nhánh Tuyển Dụng</span>
            </h3>

            {branchesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {branchesList.map((branch, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-3.5 rounded-2xl bg-[#fcfbfe] border border-purple-100 hover:border-purple-200 transition-all space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-[#1e1b4b] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">apartment</span>
                        <span>{branch.branchName || branch.name || `Cơ sở #${bIdx + 1}`}</span>
                      </h4>
                      {(branch.isHeadquarters || branch.isMain || bIdx === 0) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#5b48bd] shrink-0">
                          ⭐ Trụ sở chính
                        </span>
                      )}
                    </div>
                    {branch.address && (
                      <p className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5 shrink-0">location_on</span>
                        <span>{branch.address}</span>
                      </p>
                    )}
                    {(branch.hotline || branch.phone || branch.scale || branch.size) && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        {(branch.hotline || branch.phone) && (
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">call</span>
                            {branch.hotline || branch.phone}
                          </span>
                        )}
                        {(branch.scale || branch.size) && (
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">group</span>
                            {branch.scale || branch.size}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {company.address && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">location_city</span>
                    <span>Trụ sở chính: {company.address}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {locations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-[#f8f7ff] text-[#5b48bd] border border-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#5b48bd]"></span>
                      <span>{loc}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION: KHÔNG GIAN LÀM VIỆC & TRẢI NGHIỆM THỰC TẾ (User requested) */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#5b48bd] text-lg">photo_library</span>
                <span>Không Gian Làm Việc &amp; Trải Nghiệm Thực Tế</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{workplacePhotos.length} góc chụp</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workplacePhotos.map((photo, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={photo.url} 
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_WORKPLACE_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h5 className="font-bold text-xs text-[#1e1b4b] line-clamp-1 group-hover:text-[#5b48bd] transition-colors">
                      {photo.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {photo.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION: CHẾ ĐỘ ĐÃI NGỘ & PHÚC LỢI ĐẶC QUYỀN (User requested) */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-2">
            <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#5b48bd] text-lg">featured_seasonal_and_gifts</span>
              <span>Chế Độ Đãi Ngộ &amp; Phúc Lợi Đặc Quyền</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {companyBenefits.map((benefit, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-white rounded-2xl border border-purple-100 hover:border-purple-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#f4f2fd] border border-purple-100 flex items-center justify-center text-[#5b48bd] shrink-0">
                      <span className="material-symbols-outlined text-lg">{benefit.icon || 'star'}</span>
                    </div>
                    <h5 className="font-bold text-xs text-[#1e1b4b] leading-snug">
                      {benefit.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. MODAL ACTION FOOTER                                    */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 bg-[#f8f7fe] border-t border-purple-100 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
            <span>Hồ sơ công ty được quản lý bởi bộ phận Tuyển dụng</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-purple-100 transition-all cursor-pointer shadow-2xs"
            >
              Đóng
            </button>

            {compId && (
              <button
                type="button"
                onClick={() => {
                  saveCompanyPreviewCache(compId, company, { authoritative: true });
                  onClose();
                  window.location.hash = `#/companies/${compId}`;
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-xs border border-purple-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">domain</span>
                <span>Mở trang hồ sơ</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onViewJobs?.(company);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
            >
              <span>Xem {activeJobs} việc làm đang tuyển</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
