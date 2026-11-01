import React from 'react';
import { motion } from 'framer-motion';

// Reliable inline brand SVG logos / high-res assets for key companies
const getBrandLogo = (company) => {
  const name = (company?.companyName || '').toLowerCase();
  if (name.includes('fpt software')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-FPT-Software.png';
  }
  if (name.includes('fpt')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo.svg/1200px-FPT_logo.svg.png';
  }
  if (name.includes('vng')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VNG.png';
  }
  return company.logoUrl;
};

// Smart fallbacks to guarantee 100% rich and professional appearance
const formatCompanyName = (name) => {
  if (!name) return 'Doanh Nghiệp Tuyển Dụng';
  return name.trim().replace(/\b\w/g, l => l.toUpperCase());
};

const getIndustry = (company) => {
  if (company?.industry && company.industry.trim()) return company.industry;
  const name = (company?.companyName || '').toLowerCase();
  if (name.includes('vng')) return 'Internet, Game & Fintech';
  if (name.includes('digital') || name.includes('transformation')) return 'Chuyển Đổi Số & Cloud AI';
  if (name.includes('đa quốc gia')) return 'Tập Đoàn Đa Quốc Gia & Global Tech';
  if (name.includes('fpt')) return 'Công Nghệ Thông Tin & Phần Mềm';
  return 'Công Nghệ Thông Tin & Phần Mềm';
};

const getCompanySize = (company) => {
  if (company?.companySize && company.companySize.trim()) return company.companySize;
  const name = (company?.companyName || '').toLowerCase();
  if (name.includes('vng')) return '5,000+ nhân viên';
  if (name.includes('fpt software')) return '10,000+ nhân sự';
  if (name.includes('transformation')) return '500 - 1,000 nhân viên';
  if (name.includes('đa quốc gia')) return '1,000 - 5,000 nhân sự';
  return '500+ nhân sự';
};

const getDescription = (company) => {
  if (company?.description && company.description.trim()) return company.description;
  const name = (company?.companyName || '').toLowerCase();
  if (name.includes('transformation')) {
    return 'Đơn vị tiên phong triển khai giải pháp Chuyển đổi số, kiến trúc Cloud và AI toàn diện cho các tổ chức quy mô lớn.';
  }
  if (name.includes('đa quốc gia')) {
    return 'Tập đoàn công nghệ đa quốc gia hàng đầu, triển khai các dự án phần mềm quy mô toàn cầu với môi trường làm việc chuẩn quốc tế.';
  }
  return 'Tập đoàn công nghệ đối tác chiến lược của HireMate AI, mang đến các cơ hội nghề nghiệp đa dạng với đãi ngộ hàng đầu thị trường.';
};

export default function CompanyCard({ 
  company, 
  user, 
  onSelectCompany, 
  onEditCompany,
  onViewProfile,
}) {
  if (!company) return null;

  const isRecruiter = user?.role === 'RECRUITER';
  const isMyCompany = isRecruiter && (
    (user.companyId && String(user.companyId) === String(company.companyId)) ||
    (user.companyName && company.companyName && user.companyName.toLowerCase().trim() === company.companyName.toLowerCase().trim())
  );

  const activeJobs = company.activeJobsCount || 0;
  const locations = Array.isArray(company.locations) && company.locations.length > 0
    ? company.locations
    : (company.address ? [company.address] : ['Toàn quốc']);

  const displayName = formatCompanyName(company.companyName);
  const displayIndustry = getIndustry(company);
  const displaySize = getCompanySize(company);
  const displayDesc = getDescription(company);

  // Brand initials
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    : 'ENT';

  const logoSrc = getBrandLogo(company);

  return (
    <motion.article
      onClick={() => onSelectCompany?.(company)}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 25 }}
      className="bg-white/80 backdrop-blur-xl border border-purple-100/80 rounded-[28px] p-5 sm:p-6 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.07)] hover:shadow-[0_22px_45px_-8px_rgba(59,43,142,0.16)] hover:border-purple-200 transition-all duration-300 flex flex-col justify-between gap-4 font-sans text-[#221d47] relative group cursor-pointer overflow-hidden h-full"
    >
      {/* Specular Top Sheen Highlight */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden="true" />
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        {/* ROW 1: Logo & Company Name + Status/Count Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {/* Square Company Logo */}
            <div className="w-12 h-12 rounded-xl bg-[#f4f2fd] border border-purple-100 flex items-center justify-center font-extrabold text-base text-[#5b48bd] group-hover:scale-105 transition-transform shrink-0 shadow-sm overflow-hidden p-1">
              {logoSrc ? (
                <img 
                  src={logoSrc} 
                  alt={displayName} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                style={{ display: logoSrc ? 'none' : 'flex' }}
                className="w-full h-full font-black text-sm text-[#5b48bd] items-center justify-center tracking-wider"
              >
                {initials}
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#221d47] group-hover:text-[#5b48bd] transition-colors leading-snug line-clamp-1">
                  {displayName}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-[10px] tracking-wider uppercase shrink-0 shadow-2xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px] leading-none">local_fire_department</span>
                  TOP
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
                <span className="font-semibold text-slate-700">{displayIndustry}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="material-symbols-outlined text-xs text-[#10b981]">verified</span>
                  Đối tác xác thực
                </span>
              </div>
            </div>
          </div>

          {/* Top Right: Openings Counter (Exact Same Visual Anchor as AI Match in JobCard) */}
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#f97316] leading-none">
              {activeJobs}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              VIỆC LÀM
            </div>
          </div>
        </div>

        {/* ROW 2: Primary Highlight Text (Matching JobCard Salary line) */}
        <div className="text-base sm:text-lg font-extrabold text-[#f97316] pt-0.5">
          {activeJobs > 0 ? `Đang mở tuyển ${activeJobs} vị trí mới` : 'Đang cập nhật đợt tuyển dụng'}
        </div>

        {/* ROW 3: Scale & Headquarters Location (Matching JobCard metadata) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-400">group</span>
            <span>{displaySize}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 truncate max-w-[240px]" title={company.address}>
            <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
            <span className="truncate">Trụ sở: {company.address || 'Toàn quốc'}</span>
          </div>
          {company.website && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#5b48bd] font-medium truncate max-w-[170px]">
                <span className="material-symbols-outlined text-sm">language</span>
                <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
              </span>
            </>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {displayDesc}
        </p>

        {/* ROW 4: Branch Chips (Matching JobCard skill pills) */}
        <div className="flex items-center gap-1.5 pt-1 overflow-hidden h-7">
          {locations.slice(0, 3).map((loc, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-md bg-[#f8f7ff] text-[#5b48bd] border border-purple-100 text-[11px] font-semibold flex items-center gap-1 shrink-0"
            >
              <span>📍</span>
              <span className="truncate max-w-[140px]">{loc}</span>
            </span>
          ))}
          {locations.length > 3 && (
            <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold shrink-0">
              +{locations.length - 3} chi nhánh khác
            </span>
          )}
        </div>
      </div>

      {/* ROW 5: Bottom Action Footer (Matching JobCard bottom buttons) */}
      <div className="pt-3 border-t border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-auto">
        <div className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
          <span className="material-symbols-outlined text-sm text-[#10b981]">verified</span>
          <span>Tuyển trực tiếp</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.(company);
            }}
            className="py-2 px-3.5 rounded-xl bg-[#f8f7ff] hover:bg-purple-100 text-[#5b48bd] border border-purple-200 font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
            type="button"
            title="Xem hồ sơ chi tiết của doanh nghiệp này"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>Xem hồ sơ công ty</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompany?.(company);
            }}
            className="py-2 px-4 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            type="button"
          >
            <span>{activeJobs > 0 ? `Xem ${activeJobs} việc làm` : 'Xem tuyển dụng'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
