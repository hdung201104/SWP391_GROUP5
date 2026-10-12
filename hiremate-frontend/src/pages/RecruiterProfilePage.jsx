import React, { useState } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';

export default function RecruiterProfilePage({ user, onNavigate }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();

  // Active Main Tab: 'overview' (Tổng Quan & Môi Trường) | 'jobs' (Vị Trí Tuyển Dụng) | 'locations' (Địa Điểm & Chi Nhánh)
  const [activeTab, setActiveTab] = useState('overview');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    name: 'FPT Software Co., Ltd',
    badge: 'Doanh Nghiệp Đã Xác Thực',
    tagline: 'Tập đoàn công nghệ & dịch vụ chuyển đổi số hàng đầu Đông Nam Á • 32,000+ Kỹ Sư Toàn Cầu',
    website: 'https://fpt-software.com',
    industry: 'Công Nghệ Thông Tin & Phần Mềm',
    industrySub: 'AI Solutions, Cloud Architecture, Fintech & Automotive',
    headcount: '32,000+ Kỹ sư & Chuyên gia',
    establishedYear: '1999 (27 năm phát triển)',
    headquarters: 'Tòa nhà F-Ville, Khu CNC Hòa Lạc, Hà Nội',
    markets: '30 Quốc gia (Nhật Bản, Mỹ, Châu Âu, APAC, ASEAN)',
    overviewText:
      'Thành lập từ năm 1999, FPT Software là doanh nghiệp phần mềm và dịch vụ chuyển đổi số hàng đầu khu vực. Đồng hành cùng hơn 1,000 khách hàng toàn cầu trong đó có hơn 100 tập đoàn thuộc Fortune Global 500, FPT Software tiên phong ứng dụng các công nghệ cốt lõi như Generative AI, Big Data, Cloud Computing và Kiến trúc phân tán quy mô lớn.\n\nTại FPT Software, con người luôn là trung tâm của mọi sự phát triển. Chúng tôi xây dựng môi trường làm việc chuẩn quốc tế, văn hóa tôn trọng sự tự chủ, trao quyền tối đa cho kỹ sư công nghệ, đồng thời cung cấp lộ trình phát triển sự nghiệp không giới hạn từ kỹ sư chuyên môn đến kiến trúc sư giải pháp và chuyên gia cấp cao.',
  });

  // HR Representative (Người Đại Diện Tuyển Dụng)
  const [hrRepresentative, setHrRepresentative] = useState({
    name: user?.fullName || 'Nguyễn Minh Anh',
    title: 'Lead Talent Acquisition Partner • Senior Tech Recruiter',
    division: 'Ban Tuyển Dụng Khối Sản Xuất Phần Mềm Toàn Cầu (FPT Global Delivery)',
    email: user?.email || 'minhanh.hr@fptsoftware.com',
    hotline: '0988 777 666',
    responseTime: 'Phản hồi trong vòng 30 phút (Giờ hành chính)',
    avatar:
      user?.avatarUrl ||
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    bio:
      'Phụ trách kết nối và tư vấn lộ trình sự nghiệp công nghệ cho các kỹ sư cấp cao (Senior Backend, Cloud DevOps, AI Architect). Sẵn sàng đồng hành cùng ứng viên từ vòng thẩm định hồ sơ tới phỏng vấn kỹ thuật và gia nhập dự án cốt lõi.',
  });

  // Active Job Openings List
  const [jobsList] = useState([
    {
      id: 101,
      title: 'Senior Backend Engineer (Java / Distributed Systems)',
      salary: '$2,500 – $3,500 USD / tháng',
      location: 'Hà Nội (F-Ville) • Hybrid 2 ngày WFH',
      level: 'Senior • 4+ năm KN',
      tags: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Kafka'],
      postedTime: 'Đăng 2 giờ trước',
      applicantCount: 24,
      isHot: true,
    },
    {
      id: 102,
      title: 'Lead AI & LLM Solution Architect (GenAI Core)',
      salary: '$4,000 – $6,000 USD / tháng',
      location: 'TP. Hồ Chí Minh (F-Town 3) • Remote linh hoạt',
      level: 'Lead / Principal • 6+ năm KN',
      tags: ['Python', 'LangChain', 'PyTorch', 'RAG Architecture'],
      postedTime: 'Đăng hôm qua',
      applicantCount: 9,
      isHot: true,
    },
    {
      id: 103,
      title: 'Senior DevOps & Platform Engineer (AWS / Kubernetes / ArgoCD)',
      salary: '$2,200 – $3,200 USD / tháng',
      location: 'Đà Nẵng (FPT Complex) • Hybrid',
      level: 'Senior • 3+ năm KN',
      tags: ['AWS EKS', 'Kubernetes', 'Terraform', 'CI/CD GitLab'],
      postedTime: 'Đăng 3 ngày trước',
      applicantCount: 15,
      isHot: false,
    },
  ]);

  // Workplace Gallery
  const workplacePhotos = [
    {
      title: 'Khuôn viên xanh Campus sinh thái F-Ville Hòa Lạc',
      desc: 'Môi trường làm việc mở, hài hòa thiên nhiên với hồ cảnh quan và vườn sinh thái.',
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

  // Employee Benefits
  const companyBenefits = [
    {
      icon: 'savings',
      title: 'Thưởng hiệu suất & Tháng 13, 14, 15',
      desc: 'Chính sách đãi ngộ cạnh tranh, xét tăng lương 2 lần/năm, gói thưởng theo kết quả kinh doanh dự án lên tới 3-5 tháng lương.',
    },
    {
      icon: 'health_and_safety',
      title: 'Bảo hiểm FPT Care cao cấp',
      desc: 'Gói chăm sóc sức khỏe toàn diện hạn mức cao (nội trú, ngoại trú, nha khoa) cho nhân viên và bảo lãnh người thân tại các bệnh viện quốc tế.',
    },
    {
      icon: 'laptop_mac',
      title: 'Chế độ Hybrid & Thiết bị xịn',
      desc: 'Linh hoạt làm việc tại nhà 2 ngày/tuần. Trang bị MacBook Pro M3/M4 hoặc laptop cấu hình cao, màn hình 4K cho kỹ sư.',
    },
    {
      icon: 'workspace_premium',
      title: 'Tài trợ 100% chứng chỉ quốc tế',
      desc: 'Hỗ trợ toàn bộ chi phí thi các chứng chỉ AWS, GCP, Azure, CKA, PMP và thưởng nóng cho nhân sự đạt thành tích xuất sắc.',
    },
    {
      icon: 'directions_bus',
      title: 'Tuyến xe đưa đón nội thành',
      desc: 'Hơn 150 chuyến xe đưa đón nhân viên miễn phí từ các điểm nội thành đến Campus F-Ville (Hà Nội) và F-Town (TP.HCM).',
    },
    {
      icon: 'fitness_center',
      title: 'Tiện ích thể thao & Thư giãn nội khu',
      desc: 'Phòng Gym, bể bơi vô cực, sân bóng đá cỏ nhân tạo, sân tennis và khu vực nghỉ ngơi tiện nghi ngay trong khuôn viên công ty.',
    },
  ];

  // Offices & Campuses
  const officeLocations = [
    {
      name: 'Trụ sở chính: Campus F-Ville Hòa Lạc',
      badge: 'Trụ Sở Chính (Hà Nội)',
      address: 'Tòa nhà F-Ville 1, 2, 3, Khu Công nghệ cao Hòa Lạc, Km 29 Đại lộ Thăng Long, Thạch Thất, Hà Nội.',
      scale: 'Quy mô 9,000 kỹ sư • Khu phức hợp sinh thái 6.4 ha',
      hotline: '(024) 7300 7373',
      icon: 'corporate_fare',
    },
    {
      name: 'Chi nhánh miền Nam: Campus F-Town 3',
      badge: 'Campus TP. Hồ Chí Minh',
      address: 'Đường D1, Khu Công nghệ cao Quận 9, Phường Tân Phú, TP. Thủ Đức, TP. Hồ Chí Minh.',
      scale: 'Quy mô 7,500 kỹ sư • Bể bơi vô cực & Campus hiện đại',
      hotline: '(028) 7300 7373',
      icon: 'apartment',
    },
    {
      name: 'Chi nhánh miền Trung: FPT Complex Đà Nẵng',
      badge: 'Campus Đà Nẵng',
      address: 'Khu đô thị công nghệ FPT City, Phường Hòa Hải, Quận Ngũ Hành Sơn, Đà Nẵng.',
      scale: 'Quy mô 10,000 kỹ sư • Công trình xanh tiêu chuẩn quốc tế',
      hotline: '(0236) 730 0999',
      icon: 'domain',
    },
    {
      name: 'Mạng lưới văn phòng quốc tế',
      badge: 'Global Branches',
      address: 'Tokyo, Osaka (Nhật Bản) • Silicon Valley, Texas (Mỹ) • Frankfurt (Đức) • Singapore • Sydney (Úc).',
      scale: 'Cơ hội Onsite toàn cầu và làm việc trực tiếp cùng khách hàng Fortune 500',
      hotline: '+81 3 6634 6700',
      icon: 'public',
    },
  ];

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: companyInfo.name,
    tagline: companyInfo.tagline,
    website: companyInfo.website,
    headquarters: companyInfo.headquarters,
    overviewText: companyInfo.overviewText,
    hrName: hrRepresentative.name,
    hrTitle: hrRepresentative.title,
    hrEmail: hrRepresentative.email,
    hrHotline: hrRepresentative.hotline,
  });

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setCompanyInfo((prev) => ({
      ...prev,
      name: editForm.companyName,
      tagline: editForm.tagline,
      website: editForm.website,
      headquarters: editForm.headquarters,
      overviewText: editForm.overviewText,
    }));
    setHrRepresentative((prev) => ({
      ...prev,
      name: editForm.hrName,
      title: editForm.hrTitle,
      email: editForm.hrEmail,
      hotline: editForm.hrHotline,
    }));
    setShowEditModal(false);
    triggerToast('Đã lưu thành công các cập nhật hồ sơ doanh nghiệp!');
  };

  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Đã sao chép link trang hồ sơ doanh nghiệp!');
    } else {
      triggerToast('Đã sao chép đường dẫn hồ sơ công ty.');
    }
  };

  return (
    <div className="recruiter-page w-full flex-1 bg-transparent text-slate-800 antialiased font-sans pb-20 selection:bg-purple-200 selection:text-purple-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-[#221d47] text-white text-xs font-semibold shadow-xl flex items-center gap-2.5 animate-fade-in border border-purple-200">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* =================================================================== */}
        {/* 1. HERO COMPANY COVER & BRAND IDENTITY HEADER                       */}
        {/* =================================================================== */}
        <div className="relative rounded-[32px] overflow-hidden bg-white border border-purple-100 shadow-sm">
          {/* Cover Landscape */}
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80"
              alt="FPT Software Campus Cover"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#221d47]/70 via-[#221d47]/20 to-transparent" />

            {/* Quick Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between flex-wrap gap-2 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-100 text-xs text-[#221d47] font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực thuộc Tập đoàn FPT &bull; Top 1 Doanh Nghiệp Công Nghệ Việt Nam</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#221d47] text-xs font-bold border border-purple-100 shadow-sm">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">verified</span>
                <span>Doanh Nghiệp Đã Xác Thực Pháp Nhân</span>
              </div>
            </div>
          </div>

          {/* Company Brand Strip */}
          <div className="relative px-6 sm:px-8 pb-6 sm:pb-8 pt-4 bg-white">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                {/* Logo Box */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-white shadow-lg p-1.5 flex items-center justify-center shrink-0 -mt-16 sm:-mt-20 z-10">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#5b48bd] to-[#3b2b8e] flex flex-col items-center justify-center text-center p-2 text-white shadow-inner">
                    <span className="text-xl sm:text-2xl font-bold tracking-wider font-display">
                      FPT<span className="text-orange-400">.</span>
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-200">
                      Software
                    </span>
                  </div>
                </div>

                {/* Company Title & Slogan */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#221d47] tracking-tight">
                      {companyInfo.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-[#5b48bd] text-xs font-bold border border-purple-200">
                      <span className="material-symbols-outlined text-[15px] text-[#5b48bd]">verified</span>
                      <span>{companyInfo.badge}</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                    {companyInfo.tagline}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Edit, Pricing & Share */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => { window.location.hash = '#/recruiter-pricing'; }}
                  className="px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105 border border-amber-300/40"
                  title="Nâng cấp gói cước dịch vụ tuyển dụng"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold animate-bounce">workspace_premium</span>
                  <span>Nâng Cấp Gói VIP</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-purple-50 text-xs font-semibold text-slate-700 transition-all flex items-center gap-2 border border-purple-200 cursor-pointer shadow-sm hover:border-purple-300"
                  title="Sao chép liên kết trang công ty"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#5b48bd]">share</span>
                  <span>Chia sẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditForm({
                      companyName: companyInfo.name,
                      tagline: companyInfo.tagline,
                      website: companyInfo.website,
                      headquarters: companyInfo.headquarters,
                      overviewText: companyInfo.overviewText,
                      hrName: hrRepresentative.name,
                      hrTitle: hrRepresentative.title,
                      hrEmail: hrRepresentative.email,
                      hrHotline: hrRepresentative.hotline,
                    });
                    setShowEditModal(true);
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-purple-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Chỉnh sửa thông tin</span>
                </button>
              </div>
            </div>

            {/* Quick Meta Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Lĩnh vực chính</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.industry}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Quy mô nhân sự</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.headcount}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Năm thành lập</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.establishedYear}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Website chính thức</div>
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#5b48bd] hover:underline transition-colors mt-1 flex items-center gap-1 truncate"
                >
                  <span>fpt-software.com</span>
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Thị trường hoạt động</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.markets}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. MAIN WORKSPACE: LEFT (HR REPRESENTATIVE) + RIGHT (OVERVIEW TABS) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================================================================= */}
          {/* CỘT TRÁI (4 CỘT): ĐẠI DIỆN TUYỂN DỤNG CHÍNH (HR REPRESENTATIVE)    */}
          {/* ================================================================= */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-[28px] p-6 bg-white border border-purple-100 shadow-sm space-y-5">
              {/* Title & Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs uppercase tracking-widest text-[#221d47] font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#5b48bd]">badge</span>
                  Đại Diện Tuyển Dụng
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang nhận hồ sơ
                </span>
              </div>

              {/* Portrait & HR Info */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="relative">
                  <img
                    src={hrRepresentative.avatar}
                    alt={hrRepresentative.name}
                    className="w-24 h-24 rounded-3xl object-cover ring-4 ring-purple-100 shadow-md"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5b48bd] flex items-center justify-center text-white shadow-md text-[14px] font-bold"
                    title="Đã xác thực ủy quyền tuyển dụng chính thức"
                  >
                    ✓
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#221d47]">
                    {hrRepresentative.name}
                  </h3>
                  <p className="text-xs text-[#5b48bd] font-bold mt-0.5">
                    {hrRepresentative.title}
                  </p>
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    {hrRepresentative.division}
                  </p>
                </div>
              </div>

              {/* HR Bio Quote */}
              <p className="text-xs text-slate-600 italic leading-relaxed bg-purple-50/50 p-4 rounded-2xl border border-purple-100/80">
                "{hrRepresentative.bio}"
              </p>

              {/* Direct Contact List */}
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#5b48bd] text-lg mt-0.5">mail</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Email tiếp nhận hồ sơ</span>
                    <a
                      href={`mailto:${hrRepresentative.email}`}
                      className="text-xs font-bold text-[#221d47] hover:text-[#5b48bd] transition-colors block truncate mt-0.5"
                    >
                      {hrRepresentative.email}
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-orange-500 text-lg mt-0.5">call</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Hotline / Zalo Tuyển Dụng</span>
                    <p className="text-xs font-extrabold text-[#221d47] mt-0.5">
                      {hrRepresentative.hotline}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#5b48bd] text-lg mt-0.5">schedule</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Thời gian phản hồi</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {hrRepresentative.responseTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button: Send Email */}
              <div className="pt-2">
                <a
                  href={`mailto:${hrRepresentative.email}?subject=Ứng tuyển vị trí tại ${companyInfo.name}`}
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Gửi thư trao đổi với {hrRepresentative.name}</span>
                </a>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-6 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-3">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Kênh Tuyển Dụng Nhanh
              </span>
              <div className="space-y-2 text-xs">
                <a
                  href="#/recruiter-jobs"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 transition-colors flex items-center justify-between text-[#221d47] font-bold border border-slate-200/60 hover:border-purple-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">view_agenda</span>
                    <span>Quản lý tin tuyển dụng công ty</span>
                  </span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
                <a
                  href="#/applicants-management"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 transition-colors flex items-center justify-between text-[#221d47] font-bold border border-slate-200/60 hover:border-purple-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-orange-500">groups</span>
                    <span>Phễu ứng viên &amp; hồ sơ đã nộp</span>
                  </span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
            </div>
          </aside>

          {/* ================================================================= */}
          {/* CỘT PHẢI (8 CỘT): TỔNG QUAN, MÔI TRƯỜNG LÀM VIỆC & VỊ TRÍ MỞ      */}
          {/* ================================================================= */}
          <main className="lg:col-span-8 space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-white border border-purple-100 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">info</span>
                <span>Tổng Quan &amp; Môi Trường Làm Việc</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'jobs'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">work</span>
                <span>Vị Trí Đang Tuyển Dụng ({jobsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('locations')}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'locations'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">apartment</span>
                <span>Địa Điểm &amp; Chi Nhánh</span>
              </button>
            </div>

            {/* =============================================================== */}
            {/* TAB 1: TỔNG QUAN, VĂN HÓA & MÔI TRƯỜNG LÀM VIỆC                 */}
            {/* =============================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 1. About Company */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">auto_stories</span>
                    <h2 className="text-lg font-bold text-[#221d47]">
                      Về FPT Software
                    </h2>
                  </div>
                  <div className="text-sm font-sans text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                    {companyInfo.overviewText}
                  </div>
                </div>

                {/* 2. Core Cultural Values (4 Cards) */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">psychology</span>
                    <h2 className="text-lg font-bold text-[#221d47]">
                      Văn Hóa &amp; Giá Trị Cốt Lõi
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                      <div className="flex items-center gap-2 text-[#5b48bd] font-bold text-xs uppercase">
                        <span className="material-symbols-outlined text-base text-[#5b48bd]">lightbulb</span>
                        <span>Đổi Mới Sáng Tạo (Innovation First)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Không ngừng thử nghiệm các công nghệ mới nhất: GenAI, RAG, Microservices, Cloud Architecture và khuyến khích mọi ý tưởng đột phá từ kỹ sư.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                      <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase">
                        <span className="material-symbols-outlined text-base text-orange-500">diversity_3</span>
                        <span>Đồng Đội &amp; Trao Quyền (Team Empowerment)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Xây dựng môi trường bình đẳng, không khoảng cách cấp bậc, trao quyền tự chủ kỹ thuật tối đa cho các squad công nghệ.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase">
                        <span className="material-symbols-outlined text-base text-emerald-600">verified_user</span>
                        <span>Cam Kết Chất Lượng (Customer Centricity)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Đảm bảo độ tin cậy và an toàn bảo mật ở mức cao nhất cho các hệ thống phần mềm lõi phục vụ hàng triệu người dùng trên toàn cầu.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                        <span className="material-symbols-outlined text-base text-indigo-600">school</span>
                        <span>Phát Triển Không Giới Hạn (Continuous Growth)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Hỗ trợ 100% học phí chứng chỉ quốc tế (AWS, GCP, CKA) và các chương trình đào tạo kỹ năng lãnh đạo chuyên sâu.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Employee Benefits & Perks */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">card_giftcard</span>
                    <h2 className="text-lg font-bold text-[#221d47]">
                      Chế Độ Đãi Ngộ &amp; Phúc Lợi Đặc Quyền
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                    {companyBenefits.map((b, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-200 transition-all space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#5b48bd] shadow-sm">
                          <span className="material-symbols-outlined text-xl text-[#5b48bd]">{b.icon}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#221d47]">{b.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Workplace Photos Gallery */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">photo_library</span>
                    <h2 className="text-lg font-bold text-[#221d47]">
                      Không Gian Làm Việc &amp; Trải Nghiệm Thực Tế
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {workplacePhotos.map((p, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-white group shadow-sm hover:shadow-md transition-all">
                        <div className="h-44 sm:h-48 overflow-hidden relative">
                          <img
                            src={p.url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4 space-y-1">
                          <h4 className="text-xs font-bold text-[#221d47]">{p.title}</h4>
                          <p className="text-xs text-slate-500">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2: VỊ TRÍ ĐANG TUYỂN DỤNG                                    */}
            {/* =============================================================== */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-lg font-bold text-[#221d47]">
                    Các Vị Trí Công Nghệ Đang Mở Tuyển ({jobsList.length})
                  </h3>
                  <a
                    href="#/recruiter-jobs"
                    className="text-xs text-[#5b48bd] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Quản lý tin tuyển dụng</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </a>
                </div>

                <div className="space-y-4">
                  {jobsList.map((job) => (
                    <div
                      key={job.id}
                      className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {job.isHot && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wider">
                              Hot Opening
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-sans">{job.level}</span>
                          <span className="text-xs text-slate-300">&bull;</span>
                          <span className="text-xs text-slate-400">{job.postedTime}</span>
                        </div>

                        <h4
                          onClick={() => (window.location.hash = `#/jobs/${job.id}`)}
                          className="text-base sm:text-lg font-bold text-[#221d47] group-hover:text-[#5b48bd] transition-colors cursor-pointer"
                        >
                          {job.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-600 font-sans flex-wrap">
                          <span className="font-extrabold text-orange-600">{job.salary}</span>
                          <span>&bull;</span>
                          <span>{job.location}</span>
                          <span>&bull;</span>
                          <span className="text-[#5b48bd] font-bold">{job.applicantCount} hồ sơ đã nộp</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-100"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`#/jobs/${job.id}`}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-purple-50 text-xs font-semibold text-slate-700 border border-slate-200 transition-all shadow-sm hover:border-purple-300"
                        >
                          Xem bài JD
                        </a>
                        <a
                          href={`#/applicants-management?jobId=${job.id}`}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-xs font-bold text-white shadow-sm transition-all"
                        >
                          Quản lý hồ sơ
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 3: ĐỊA ĐIỂM & CHI NHÁNH                                     */}
            {/* =============================================================== */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-lg font-bold text-[#221d47]">
                    Hệ Thống Trụ Sở &amp; Campus Sinh Thái Toàn Cầu
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {officeLocations.map((loc, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                          {loc.badge}
                        </span>
                        <span className="material-symbols-outlined text-xl text-[#5b48bd]">{loc.icon}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#221d47]">{loc.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{loc.address}</p>
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                        <div>&bull; {loc.scale}</div>
                        <div>&bull; Hotline: <span className="text-[#221d47] font-bold">{loc.hotline}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: CHỈNH SỬA THÔNG TIN DOANH NGHIỆP                             */}
      {/* =================================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-purple-100 rounded-[32px] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[#5b48bd]">edit</span>
                <h3 className="font-bold text-xl text-[#221d47]">Chỉnh Sửa Hồ Sơ Doanh Nghiệp</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Tên doanh nghiệp</label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Khẩu hiệu / Tagline</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase">Website</label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase">Hotline HR</label>
                  <input
                    type="text"
                    value={editForm.hrHotline}
                    onChange={(e) => setEditForm({ ...editForm, hrHotline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Người đại diện tuyển dụng</label>
                <input
                  type="text"
                  value={editForm.hrName}
                  onChange={(e) => setEditForm({ ...editForm, hrName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Email liên hệ HR</label>
                <input
                  type="email"
                  value={editForm.hrEmail}
                  onChange={(e) => setEditForm({ ...editForm, hrEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Giới thiệu tổng quan</label>
                <textarea
                  rows={4}
                  value={editForm.overviewText}
                  onChange={(e) => setEditForm({ ...editForm, overviewText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#221d47] leading-relaxed focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-white text-xs font-bold tracking-wider uppercase shadow-md cursor-pointer transition-all"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
