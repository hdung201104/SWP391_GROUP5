import React from 'react';

// Brand logos helper
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
  return company?.logoUrl;
};

// Brand covers helper
const getBrandCover = (company) => {
  if (company?.coverUrl && company.coverUrl.trim()) return company.coverUrl;
  try {
    const savedCover = localStorage.getItem('hiremate_company_cover');
    if (savedCover) return savedCover;
  } catch {}

  const name = (company?.companyName || '').toLowerCase();
  if (name.includes('fpt')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80';
  }
  if (name.includes('vng')) {
    return 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&auto=format&fit=crop&q=80';
  }
  if (name.includes('digital') || name.includes('transformation')) {
    return 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80';
};

const formatCompanyName = (name) => {
  if (!name) return 'Doanh Nghiệp Tuyển Dụng';
  return name.trim().replace(/\b\w/g, l => l.toUpperCase());
};

// Default Authentic Workplace Photos (matching user's profile spec)
const DEFAULT_WORKPLACE_PHOTOS = [
  {
    title: 'Khuôn viên xanh & Không gian làm việc sinh thái',
    desc: 'Môi trường làm việc mở, hài hòa thiên nhiên với cảnh quan cây xanh và không gian thư giãn sinh thái.',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Không gian làm việc sáng tạo Open Workspace',
    desc: 'Trang bị bàn làm việc công thái học, ánh sáng tự nhiên và thiết bị máy trạm hiệu năng cao.',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Pantry, Coffee Lounge & Không gian trao đổi ý tưởng',
    desc: 'Khu vực giải lao tiện nghi với đồ uống miễn phí, trà, cà phê và quầy ăn nhẹ.',
    url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Khu thể thao, Bể bơi vô cực & Tiện ích nội khu',
    desc: 'Sân bóng đá cỏ nhân tạo, phòng gym đa năng, bể bơi giải tỏa căng thẳng sau giờ làm việc.',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
  },
];

// Default 6 Exclusive Benefits (matching user's profile spec)
const DEFAULT_COMPANY_BENEFITS = [
  {
    icon: 'savings',
    title: 'Thưởng hiệu suất & Tháng 13, 14, 15',
    desc: 'Chính sách đãi ngộ cạnh tranh, xét tăng lương 2 lần/năm, gói thưởng theo kết quả kinh doanh dự án hấp dẫn.',
  },
  {
    icon: 'health_and_safety',
    title: 'Bảo hiểm sức khỏe cao cấp & Bảo lãnh người thân',
    desc: 'Gói chăm sóc sức khỏe toàn diện hạn mức cao (nội trú, ngoại trú, nha khoa) cho nhân viên và bảo lãnh người thân tại các bệnh viện quốc tế.',
  },
  {
    icon: 'laptop_mac',
    title: 'Chế độ Hybrid & Thiết bị xịn',
    desc: 'Linh hoạt làm việc tại nhà 2 ngày/tuần. Trang bị MacBook Pro hoặc laptop cấu hình cao, màn hình chuyên dụng cho kỹ sư.',
  },
  {
    icon: 'workspace_premium',
    title: 'Tài trợ 100% chứng chỉ quốc tế',
    desc: 'Hỗ trợ toàn bộ chi phí thi các chứng chỉ AWS, GCP, Azure, CKA, PMP và thưởng nóng cho nhân sự đạt thành tích xuất sắc.',
  },
  {
    icon: 'directions_bus',
    title: 'Tuyến xe đưa đón & Trợ cấp di chuyển',
    desc: 'Hỗ trợ các chuyến xe đưa đón nhân viên thuận tiện tại các điểm chính hoặc trợ cấp chi phí đi lại.',
  },
  {
    icon: 'fitness_center',
    title: 'Tiện ích thể thao & Thư giãn nội khu',
    desc: 'Khu vực Pantry giải lao tiện nghi với đồ uống miễn phí, phòng Gym, câu lạc bộ thể thao và teambuilding định kỳ.',
  },
];

export default function CompanyProfileModal({
  company,
  isOpen,
  onClose,
  onViewJobs,
}) {
  if (!isOpen || !company) return null;

  const displayName = formatCompanyName(company.companyName);
  const logoSrc = getBrandLogo(company);
  const coverSrc = getBrandCover(company);
  const activeJobs = company.activeJobsCount || 0;
  const locations = Array.isArray(company.locations) && company.locations.length > 0
    ? company.locations
    : (company.address ? [company.address] : ['Toàn quốc']);

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    : 'ENT';

  // Get workplace photos: from company data, localStorage, or realistic default
  let workplacePhotos = DEFAULT_WORKPLACE_PHOTOS;
  if (Array.isArray(company.photos) && company.photos.length > 0) {
    workplacePhotos = company.photos;
  } else {
    try {
      const savedPhotos = localStorage.getItem('hiremate_workplace_photos');
      if (savedPhotos) workplacePhotos = JSON.parse(savedPhotos);
    } catch {}
  }

  // Get benefits: from company data, localStorage, or realistic default
  let companyBenefits = DEFAULT_COMPANY_BENEFITS;
  if (Array.isArray(company.benefits) && company.benefits.length > 0) {
    companyBenefits = company.benefits;
  } else {
    try {
      const savedBenefits = localStorage.getItem('hiremate_company_benefits');
      if (savedBenefits) companyBenefits = JSON.parse(savedBenefits);
    } catch {}
  }

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
              e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80';
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
                  className="w-full h-full font-black text-2xl text-[#5b48bd] items-center justify-center tracking-wider bg-purple-50 rounded-xl"
                >
                  {initials}
                </div>
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
                    {company.industry || 'Công nghệ thông tin & Dịch vụ phần mềm'}
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
            {company.website && (
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
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
                {company.companySize || '10,000+ nhân viên'}
              </h4>
            </div>

            <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
              <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1">domain_add</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi nhánh</p>
              <h4 className="text-xs sm:text-sm font-black text-[#1e1b4b] mt-0.5">
                {locations.length} cơ sở
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
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-[#fcfbfe] rounded-2xl p-4 border border-purple-100/60 shadow-2xs">
              {company.description || 'Tập đoàn phần mềm và công nghệ hàng đầu Việt Nam và Châu Á – Thái Bình Dương. Đối tác công nghệ chiến lược cung cấp các giải pháp chuyển đổi số toàn diện và cơ hội phát triển sự nghiệp chuẩn quốc tế.'}
            </p>
          </div>

          {/* Section: Trụ sở & Chi nhánh tuyển dụng */}
          <div className="space-y-2.5">
            <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#5b48bd] text-lg">pin_drop</span>
              <span>Trụ Sở &amp; Chi Nhánh Tuyển Dụng</span>
            </h3>
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
                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';
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

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-purple-100 transition-all cursor-pointer shadow-2xs"
            >
              Đóng
            </button>

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
