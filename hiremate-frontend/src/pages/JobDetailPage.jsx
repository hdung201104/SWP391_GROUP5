import React, { useState, useEffect } from 'react';
import ApplyJobModal from '../components/jobs/ApplyJobModal';
import { jobApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';

const JOBS_DATA = {
  101: {
    jobId: 101,
    code: 'FPT-VN-9428',
    division: 'FPT SOFTWARE // FINTECH DIVISION',
    industry: 'FinTech & Distributed Core',
    title: 'Senior Backend Engineer',
    subtitle: '(Java / Distributed Systems)',
    companyName: 'FPT Software',
    companyShort: 'FPT',
    companySub: 'SOFTWARE',
    postedTime: '2 giờ trước',
    deadline: '15/04/2026',
    applicantCount: 28,
    salaryText: '$2,500 – $3,500 USD / tháng',
    salarySub: '(Thoả thuận theo năng lực)',
    location: 'TP. Hồ Chí Minh (Quận 9 // Hybrid: 2 ngày WFH)',
    employmentType: 'Toàn thời gian (Full-time)',
    domainTag: 'Core Banking Transformation (50,000+ QPS)',
    aiMatchScore: 94,
    matchAssessment: 'Tương thích hồ sơ xuất sắc (Top 5%)',
    matchRank: 'Hồ sơ của bạn đáp ứng trọn vẹn 100% kỹ năng bắt buộc của vị trí này.',
    matchedSkills: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Docker'],
    missingFocus: [
      { topic: 'Kafka Partitioning', note: 'Nhấn mạnh chiến lược rebalancing và consumer groups trong CV.' },
      { topic: 'Redis Stampede', note: 'Chuẩn bị kiến trúc Mutex Lock hoặc probabilistic early expiration.' }
    ],
    recruiter: {
      name: 'Minh Anh Nguyễn',
      title: 'Lead Tech Recruiter @ FPT Software',
      responseTime: 'Phản hồi trong 30 phút',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      quote: 'Đội ngũ FPT Fintech đang ưu tiên đẩy nhanh quy trình phỏng vấn cho các kỹ sư Java Distributed Systems. Ứng viên đạt yêu cầu sẽ được hỗ trợ xếp lịch phỏng vấn chỉ trong 48 giờ làm việc!'
    },
    companyInfo: {
      size: '30,000+ nhân sự toàn cầu',
      headquarters: 'F-Town, TP. Thủ Đức, TP.HCM',
      markets: 'Nhật Bản, Mỹ, Châu Âu, APAC',
      desc: 'FPT Software là tập đoàn công nghệ thông tin hàng đầu khu vực, đồng hành cùng hơn 1,000 khách hàng toàn cầu trong đó có 100+ doanh nghiệp thuộc danh sách Fortune Global 500.',
      otherJobsCount: 42
    }
  },
  102: {
    jobId: 102,
    code: 'VNG-GMS-8114',
    division: 'VNG TECH // GAME PLATFORM DIVISION',
    industry: 'Real-time Distributed Gaming',
    title: 'Lead Distributed Systems',
    subtitle: '(Go / Java / gRPC)',
    companyName: 'VNG Games Studio',
    companyShort: 'VNG',
    companySub: 'GAMES',
    postedTime: '4 giờ trước',
    deadline: '20/04/2026',
    applicantCount: 14,
    salaryText: '$3,500 – $5,000 USD / tháng',
    salarySub: '(Kèm gói ESOP & Sign-on Bonus)',
    location: 'TP. Hồ Chí Minh (VNG Campus Onsite)',
    employmentType: 'Toàn thời gian (Full-time)',
    domainTag: 'Multiplayer Real-time Sync (< 5ms Latency)',
    aiMatchScore: 92,
    matchAssessment: 'Phù hợp xuất sắc với Senior Benchmark',
    matchRank: 'Hồ sơ của bạn phù hợp với cấp độ L6 Architecture của VNG Studio.',
    matchedSkills: ['Distributed Systems', 'Go / Java', 'Kubernetes', 'gRPC'],
    missingFocus: [
      { topic: 'UDP Packet Optimization', note: 'Cần bổ sung kinh nghiệm chống gián đoạn đường truyền mạng.' },
      { topic: 'Raft Consensus', note: 'Nắm vững thuật toán đồng thuận trạng thái nhiều node.' }
    ],
    recruiter: {
      name: 'Quốc Bảo',
      title: 'Senior Talent Acquisition Partner @ VNG',
      responseTime: 'Phản hồi trong 1 giờ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      quote: 'VNG chào đón các kỹ sư yêu thích giải quyết bài toán hàng triệu người dùng trực tuyến đồng thời (CCU). Môi trường làm việc chuẩn quốc tế và đãi ngộ hàng đầu ngành game.'
    },
    companyInfo: {
      size: '4,000+ nhân sự',
      headquarters: 'VNG Campus, Quận 7, TP.HCM',
      markets: 'Việt Nam, Đông Nam Á, Bắc Mỹ',
      desc: 'VNG là kỳ lân công nghệ đầu tiên tại Việt Nam, tiên phong trong mảng Games, Zalo, Thanh toán điện tử và Hạ tầng đám mây AI Cloud.',
      otherJobsCount: 18
    }
  },
  103: {
    jobId: 103,
    code: 'TCB-DS-2091',
    division: 'TECHCOMBANK // DIGITAL BANKING DIVISION',
    industry: 'High-Concurrency Banking Platform',
    title: 'Senior Java Microservices',
    subtitle: '(Cloud Native / Kafka)',
    companyName: 'Techcombank',
    companyShort: 'TCB',
    companySub: 'BANKING',
    postedTime: '1 ngày trước',
    deadline: '30/04/2026',
    applicantCount: 39,
    salaryText: '$2,200 – $3,200 USD / tháng',
    salarySub: '(Lương tháng 13 + Performance Bonus 4-6 tháng)',
    location: 'Hà Nội & TP. Hồ Chí Minh (Hybrid)',
    employmentType: 'Toàn thời gian (Full-time)',
    domainTag: 'Omnichannel Banking Core (24/7 Availability)',
    aiMatchScore: 89,
    matchAssessment: 'Đạt chuẩn năng lực Senior Banking',
    matchRank: 'Hồ sơ có điểm mạnh vượt trội về Spring Boot 3 và quản trị Transaction phân tán.',
    matchedSkills: ['Java', 'Spring Cloud', 'Kafka', 'PostgreSQL'],
    missingFocus: [
      { topic: 'Saga Pattern', note: 'Chuẩn bị câu trả lời về bù trừ giao dịch (Compensating Transactions).' },
      { topic: 'Zero Trust Security', note: 'Ôn tập mTLS và OAuth2 / Keycloak.' }
    ],
    recruiter: {
      name: 'Thanh Thảo HR',
      title: 'Talent Acquisition Manager @ Techcombank',
      responseTime: 'Phản hồi trong 2 giờ',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      quote: 'Techcombank cam kết cung cấp môi trường Agile chuyển đổi số thần tốc. Các kỹ sư có cơ hội trực tiếp kiến tạo giải pháp phục vụ hơn 12 triệu khách hàng cá nhân.'
    },
    companyInfo: {
      size: '12,000+ nhân sự',
      headquarters: 'Techcombank Tower, Hoàn Kiếm, Hà Nội',
      markets: 'Việt Nam',
      desc: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank) là định chế tài chính hàng đầu, liên tục tiên phong số hóa với nền tảng công nghệ tối tân.',
      otherJobsCount: 35
    }
  }
};

export default function JobDetailPage({ user, jobId }) {
  const currentId = Number(jobId) || 101;
  const [job, setJob] = useState(JOBS_DATA[currentId] || JOBS_DATA[101]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isApplying, setIsApplying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatToast, setChatToast] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let mounted = true;
    jobApi.getJobDetail(currentId)
      .then(res => {
        if (mounted && res.data) {
          const apiData = res.data;
          setJob(prev => ({
            ...prev,
            title: apiData.title || prev.title,
            companyName: apiData.companyName || prev.companyName,
            location: apiData.location || prev.location,
            salaryText: apiData.salaryMin && apiData.salaryMax 
              ? `${Number(apiData.salaryMin).toLocaleString('vi-VN')} - ${Number(apiData.salaryMax).toLocaleString('vi-VN')} đ/tháng`
              : prev.salaryText,
            domainTag: apiData.employmentType || prev.domainTag,
          }));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [currentId]);

  const isRecruiter = user?.role === 'RECRUITER';

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartChat = () => {
    setChatToast(true);
    setTimeout(() => setChatToast(false), 3500);
  };

  return (
    <div className="w-full flex-1 bg-transparent antialiased font-sans pb-28">
      {/* Toast Notification: Copied Link */}
      {copiedLink && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-botanical-stone text-botanical-forest text-xs font-semibold shadow-soft-xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base text-botanical-sage">check_circle</span>
          <span>Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!</span>
        </div>
      )}

      {/* Toast Notification: Encrypted Chat Simulation */}
      {chatToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone text-xs font-medium shadow-soft-xl flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-terracotta animate-ping"></span>
          <div className="text-left">
            <p className="font-bold text-botanical-forest font-serif">Đang kết nối phiên trao đổi trực tiếp...</p>
            <p className="text-[11px] text-botanical-forest/70 font-sans">Tin nhắn được định tuyến đến Talent Partner {job.recruiter.name}</p>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Status Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <a 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-botanical-forest/70 hover:text-botanical-forest transition-colors cursor-pointer" 
            href={isRecruiter ? "#/recruiter-jobs" : "#/"}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>{isRecruiter ? "Quay lại Quản lý tin tuyển dụng" : "Quay lại Danh sách việc làm"}</span>
          </a>
          <div className="flex items-center gap-2 text-xs font-sans">
            <span className="px-3 py-1 rounded-full bg-[#FAF9F5] border border-botanical-stone text-botanical-forest font-semibold">
              MÃ JD: {job.code}
            </span>
            <span className="text-botanical-stone">•</span>
            <span className="text-botanical-forest/75 font-medium">{job.industry}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* RECRUITER EXECUTIVE COMMAND BAR BANNER */}
        {isRecruiter && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-[#FAF9F5] border border-botanical-stone card-botanical flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-botanical-forest shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-botanical-clay/30 text-botanical-forest border border-botanical-stone flex items-center justify-center shrink-0 shadow-soft">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-botanical-forest font-serif">
                    CHẾ ĐỘ XEM TRƯỚC BÀI ĐĂNG (RECRUITER PREVIEW)
                  </span>
                  <span className="badge-sage text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Đang mở tuyển dụng
                  </span>
                </div>
                <p className="text-xs text-botanical-forest/70 mt-1 font-sans">
                  Bài đăng đang hiển thị công khai trên hệ thống HireMate AI. Đã thu hút <strong className="text-botanical-forest">{job.applicantCount || 24} ứng viên</strong> nộp hồ sơ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { window.location.hash = `#/applicants-management?jobId=${currentId}`; }}
                className="btn-botanical-primary px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span>Xem {job.applicantCount || 24} ứng viên</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="btn-botanical-secondary p-2.5 rounded-full text-botanical-forest hover:text-botanical-forest cursor-pointer"
                title="Sao chép liên kết bài đăng"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
            </div>
          </div>
        )}

        {/* HERO SECTION: MODERN BOTANICAL HEADER */}
        <section className="mb-8 rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 sm:p-8 relative overflow-hidden shadow-soft">
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Company Logo & Job Header Info */}
            <div className="flex items-start gap-5">
              {/* Botanical Company Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-botanical-stone p-3 flex-shrink-0 flex items-center justify-center shadow-soft relative group">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="font-serif font-bold text-lg sm:text-xl tracking-wider text-botanical-forest">{job.companyShort}</span>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-botanical-terracotta">{job.companySub}</span>
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-botanical-sage border-2 border-white shadow-soft" title="Đang tuyển trực tiếp"></span>
              </div>

              {/* Title, Division, and Verified Tag */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-botanical-forest/65 font-sans">{job.division}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-botanical-forest px-3 py-0.5 rounded-full bg-botanical-sage/15 border border-botanical-sage/30">
                    <span className="material-symbols-outlined text-xs text-botanical-sage">verified</span>
                    Doanh nghiệp xác thực
                  </span>
                  <span className="text-xs text-botanical-forest/60 flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-botanical-sage"></span>
                    Đăng {job.postedTime} • Hạn nộp: {job.deadline}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-botanical-forest tracking-tight leading-tight">
                  {job.title}
                  <span className="block sm:inline italic font-normal text-botanical-terracotta sm:ml-2">
                    {job.subtitle}
                  </span>
                </h1>

                {/* Key Attributes Pills Bar */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 text-xs font-semibold">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-botanical-clay/30 text-botanical-forest border border-botanical-stone shadow-soft">
                    <span className="material-symbols-outlined text-base text-botanical-terracotta">payments</span>
                    <span>{job.salaryText}</span>
                    <span className="text-botanical-forest/60 font-normal">{job.salarySub}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-botanical-stone text-botanical-forest">
                    <span className="material-symbols-outlined text-base text-botanical-sage">location_on</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-botanical-stone text-botanical-forest">
                    <span className="material-symbols-outlined text-base text-amber-700">schedule</span>
                    <span>{job.employmentType}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-botanical-stone text-botanical-forest">
                    <span className="material-symbols-outlined text-base text-botanical-forest">lan</span>
                    <span>{job.domainTag}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Primary Hero Actions */}
            <div className="flex lg:flex-col items-center lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <button 
                  type="button"
                  onClick={() => {
                    if (!user) {
                      window.location.hash = '#/login';
                      return;
                    }
                    setIsBookmarked(!isBookmarked);
                  }}
                  aria-label="Lưu công việc" 
                  className={`p-3 rounded-full border transition-all cursor-pointer ${
                    isBookmarked 
                      ? 'border-botanical-terracotta text-botanical-terracotta bg-botanical-terracotta/10 shadow-soft' 
                      : 'border-botanical-stone bg-white text-botanical-forest hover:bg-botanical-cream'
                  }`} 
                  title={isBookmarked ? "Đã lưu việc làm" : "Lưu việc làm này"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isBookmarked ? 'bookmark' : 'bookmark_add'}
                  </span>
                </button>
                <button 
                  type="button"
                  onClick={handleShare}
                  aria-label="Chia sẻ" 
                  className="p-3 rounded-full bg-white border border-botanical-stone text-botanical-forest hover:bg-botanical-cream transition-all cursor-pointer" 
                  title="Sao chép liên kết chia sẻ"
                >
                  <span className="material-symbols-outlined text-xl">share</span>
                </button>

                {isRecruiter ? (
                  <button 
                    type="button"
                    onClick={() => { window.location.hash = `#/applicants-management?jobId=${currentId}`; }}
                    className="btn-botanical-primary flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">groups</span>
                    <span>Quản lý hồ sơ ứng viên</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      if (!user) {
                        window.location.hash = '#/login';
                        return;
                      }
                      setIsApplying(true);
                    }}
                    className="btn-botanical-primary flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">bolt</span>
                    <span>Ứng tuyển ngay bằng AI CV</span>
                  </button>
                )}
              </div>

              {!isRecruiter && (
                <button 
                  type="button"
                  onClick={() => {
                    if (!user) {
                      window.location.hash = '#/login';
                      return;
                    }
                    window.location.hash = `#/ai-interview?jobId=${job.jobId || currentId}`;
                  }}
                  className="btn-botanical-secondary w-full lg:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer" 
                >
                  <span className="material-symbols-outlined text-base text-botanical-sage">mic</span>
                  <span>Luyện phỏng vấn AI với Job này</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2-COLUMN BALANCED ARCHITECTURE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: STRUCTURED CONTENT (8 cols) ================= */}
          <main className="lg:col-span-8 space-y-6">
            {/* SEGMENTED TAB SELECTOR: Logical navigation with rounded-full pills */}
            <div className="p-1.5 rounded-full bg-[#FAF9F5] border border-botanical-stone card-botanical flex items-center gap-1 overflow-x-auto no-scrollbar shadow-soft">
              {[
                { id: 'ALL', label: 'Tất cả nội dung', icon: 'view_agenda' },
                { id: 'RESPONSIBILITIES', label: 'Dự án & Trách nhiệm', icon: 'hub' },
                { id: 'REQUIREMENTS', label: 'Yêu cầu (70/30)', icon: 'fact_check' },
                { id: 'BENEFITS', label: 'Đãi ngộ & Phúc lợi', icon: 'card_giftcard' },
                { id: 'PROCESS', label: 'Lộ trình phỏng vấn', icon: 'route' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-botanical-forest text-white shadow-soft'
                      : 'text-botanical-forest/70 hover:text-botanical-forest hover:bg-botanical-cream'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* SECTION 1: Tổng quan dự án & Trách nhiệm công việc */}
            {(activeTab === 'ALL' || activeTab === 'RESPONSIBILITIES') && (
              <section className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 sm:p-7 space-y-5 shadow-soft">
                <div className="flex items-center gap-3 border-b border-botanical-stone pb-4">
                  <div className="w-9 h-9 rounded-xl bg-botanical-clay/30 text-botanical-forest flex items-center justify-center border border-botanical-stone">
                    <span className="material-symbols-outlined text-lg">hub</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-botanical-forest uppercase tracking-wide">
                      Bối cảnh Dự án &amp; Hạ tầng Mục tiêu
                    </h2>
                    <p className="text-xs text-botanical-forest/65 font-sans">Kiến trúc quy mô lớn phục vụ các định chế tài chính quốc tế</p>
                  </div>
                </div>

                <p className="text-sm text-botanical-forest/80 leading-relaxed font-sans">
                  Khối Công nghệ Tài chính ({job.companyName} Engineering) đang mở rộng dự án hiện đại hoá hạ tầng Core Banking đa quốc gia cho các định chế tài chính hàng đầu khu vực Châu Á - Thái Bình Dương. Vị trí <strong className="text-botanical-forest font-semibold">{job.title} {job.subtitle}</strong> sẽ đóng vai trò hạt nhân thiết kế kiến trúc kiến trúc hướng sự kiện (Event-Driven Architecture) với khả năng chịu tải vượt mức <strong className="text-botanical-terracotta font-bold">50,000+ QPS</strong> và cam kết thời gian phản hồi (latency) &lt; 15ms.
                </p>

                {/* 3 Infrastructure Highlight Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex flex-col justify-between shadow-soft">
                    <span className="text-[11px] font-bold uppercase text-botanical-forest/60 tracking-wider font-sans">Hạ tầng mục tiêu</span>
                    <div className="text-sm font-bold text-botanical-forest font-serif mt-2">Multi-Region Active-Active</div>
                    <span className="text-[11px] text-botanical-forest/65 mt-1 font-sans">AWS &amp; On-prem hybrid cluster</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex flex-col justify-between shadow-soft">
                    <span className="text-[11px] font-bold uppercase text-botanical-forest/60 tracking-wider font-sans">Tiêu chuẩn Uptime</span>
                    <div className="text-sm font-bold text-botanical-forest font-serif mt-2">99.99% SLO Availability</div>
                    <span className="text-[11px] text-botanical-forest/65 mt-1 font-sans">Zero-downtime Blue/Green</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex flex-col justify-between shadow-soft">
                    <span className="text-[11px] font-bold uppercase text-botanical-forest/60 tracking-wider font-sans">Mô hình làm việc</span>
                    <div className="text-sm font-bold text-botanical-forest font-serif mt-2">Hybrid Linh Hoạt</div>
                    <span className="text-[11px] text-botanical-forest/65 mt-1 font-sans">2 ngày WFH/tuần + trang cấp thiết bị</span>
                  </div>
                </div>

                {/* Core Responsibilities Cards */}
                <div className="pt-3 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-botanical-forest flex items-center gap-1.5 font-serif">
                    <span className="material-symbols-outlined text-sm text-botanical-sage">terminal</span>
                    Trách nhiệm công việc cốt lõi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone hover:border-botanical-sage transition-all shadow-soft">
                      <div className="flex items-center gap-2 text-botanical-forest font-bold text-xs mb-1.5 font-serif">
                        <span className="material-symbols-outlined text-botanical-sage text-base">developer_board</span>
                        <span>Kiến trúc Microservices Hiện Đại</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 leading-relaxed font-sans">
                        Thiết kế, xây dựng và tối ưu hoá hệ thống dịch vụ độc lập với <strong className="text-botanical-forest">Spring Boot 3</strong> và tận dụng luồng ảo (<strong className="text-botanical-forest">Java 21 Virtual Threads</strong>) để giảm thiểu tài nguyên dưới áp lực tải lớn.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone hover:border-botanical-sage transition-all shadow-soft">
                      <div className="flex items-center gap-2 text-botanical-forest font-bold text-xs mb-1.5 font-serif">
                        <span className="material-symbols-outlined text-botanical-sage text-base">database</span>
                        <span>Tối ưu hóa Database &amp; Event Stream</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 leading-relaxed font-sans">
                        Tối ưu hóa Database <strong className="text-botanical-forest">PostgreSQL</strong> (table partitioning, indexing) và xử lý hàng đợi sự kiện qua <strong className="text-botanical-forest">Apache Kafka</strong> đảm bảo strictly ordered và exactly-once semantics.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone hover:border-botanical-sage transition-all shadow-soft">
                      <div className="flex items-center gap-2 text-botanical-forest font-bold text-xs mb-1.5 font-serif">
                        <span className="material-symbols-outlined text-botanical-sage text-base">layers</span>
                        <span>Caching Phân tán Đa tầng</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 leading-relaxed font-sans">
                        Xây dựng giải pháp caching phân tán nhiều tầng với <strong className="text-botanical-forest">Redis Cluster</strong>; xử lý bài toán Cache Stampede và đồng bộ dữ liệu thời gian thực giữa read/write replicas.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone hover:border-botanical-sage transition-all shadow-soft">
                      <div className="flex items-center gap-2 text-botanical-forest font-bold text-xs mb-1.5 font-serif">
                        <span className="material-symbols-outlined text-botanical-sage text-base">monitoring</span>
                        <span>CI/CD &amp; Toàn diện Observability</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 leading-relaxed font-sans">
                        Thiết lập luồng tự động hoá CI/CD, thu thập phân tích số liệu thời gian thực với <strong className="text-botanical-forest">Prometheus &amp; Grafana</strong> và Distributed Tracing nhằm chẩn đoán điểm nghẽn tức thời.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 2: Yêu cầu ứng viên (Chuẩn 70% Bắt buộc + 30% Ưu tiên) */}
            {(activeTab === 'ALL' || activeTab === 'REQUIREMENTS') && (
              <section className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 sm:p-7 space-y-6 shadow-soft">
                <div className="flex items-center justify-between border-b border-botanical-stone pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-botanical-clay/30 text-botanical-forest flex items-center justify-center border border-botanical-stone">
                      <span className="material-symbols-outlined text-lg">fact_check</span>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-serif font-bold text-botanical-forest uppercase tracking-wide">
                        Tiêu Chuển Năng Lực Ứng Viên
                      </h2>
                      <p className="text-xs text-botanical-forest/65 font-sans">Được phân bổ theo trọng số 70% Bắt buộc &amp; 30% Ưu tiên</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-white border border-botanical-stone text-botanical-forest">
                    HireMate AI Matching Engine
                  </span>
                </div>

                {/* 70% Hard Requirements */}
                <div className="space-y-3 p-5 rounded-2xl bg-white border border-botanical-stone shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-botanical-forest"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-botanical-forest font-serif">
                        1. Yêu cầu bắt buộc (Core Requirements — Trọng số 70%)
                      </span>
                    </div>
                    <span className="badge-sage text-[11px] font-bold px-2.5 py-0.5 rounded-full">Must Have</span>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-botanical-forest/80 font-sans">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-forest text-base mt-0.5 flex-shrink-0">check_circle</span>
                      <span><strong className="text-botanical-forest">5+ năm kinh nghiệm</strong> thực chiến phát triển với <strong className="text-botanical-forest">Java</strong> và hệ sinh thái <strong className="text-botanical-forest">Spring Boot 3 / Spring Cloud</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-forest text-base mt-0.5 flex-shrink-0">check_circle</span>
                      <span>Hiểu sâu nguyên lý đa luồng (Concurrency), cơ chế Garbage Collection, khả năng phân tích Thread Dumps để giải quyết triệt để sự cố bộ nhớ.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-forest text-base mt-0.5 flex-shrink-0">check_circle</span>
                      <span>Thành thạo tối ưu hóa câu truy vấn phức tạp trên cơ sở dữ liệu quan hệ (PostgreSQL) và thiết kế hệ thống dữ liệu hiệu năng cao.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-forest text-base mt-0.5 flex-shrink-0">check_circle</span>
                      <span>Kinh nghiệm triển khai ứng dụng dạng container hóa với <strong className="text-botanical-forest">Docker</strong> và cụm <strong className="text-botanical-forest">Kubernetes</strong>.</span>
                    </li>
                  </ul>
                </div>

                {/* 30% Nice-to-have Requirements */}
                <div className="space-y-3 p-5 rounded-2xl bg-white border border-botanical-stone shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-botanical-terracotta"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-botanical-forest font-serif">
                        2. Yêu cầu ưu tiên (Preferred Qualifications — Trọng số 30%)
                      </span>
                    </div>
                    <span className="badge-terracotta text-[11px] font-bold px-2.5 py-0.5 rounded-full">Nice to Have</span>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-botanical-forest/80 font-sans">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-terracotta text-base mt-0.5 flex-shrink-0">star</span>
                      <span>Đã từng tham gia xây dựng hoặc tái cấu trúc các hệ thống chịu tải lớn trong mảng Fintech, Ngân hàng hoặc E-commerce.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-terracotta text-base mt-0.5 flex-shrink-0">star</span>
                      <span>Kiến thức thực tiễn về Kafka Streams hoặc kiến trúc CQRS &amp; Event Sourcing.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-botanical-terracotta text-base mt-0.5 flex-shrink-0">star</span>
                      <span>Sở hữu chứng chỉ quốc tế: AWS Certified Solutions Architect hoặc CKA là điểm cộng lớn.</span>
                    </li>
                  </ul>
                </div>
              </section>
            )}

            {/* SECTION 3: Đãi ngộ & Phúc lợi cạnh tranh */}
            {(activeTab === 'ALL' || activeTab === 'BENEFITS') && (
              <section className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 sm:p-7 space-y-5 shadow-soft">
                <div className="flex items-center gap-3 border-b border-botanical-stone pb-4">
                  <div className="w-9 h-9 rounded-xl bg-botanical-clay/30 text-botanical-forest flex items-center justify-center border border-botanical-stone">
                    <span className="material-symbols-outlined text-lg">card_giftcard</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-botanical-forest uppercase tracking-wide">
                      Chế Độ Đãi Ngộ &amp; Phúc Lợi Cạnh Tranh
                    </h2>
                    <p className="text-xs text-botanical-forest/65 font-sans">Gói quyền lợi cao cấp dành riêng cho cấp độ Kỹ sư Cấp cao (Senior)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex items-start gap-3.5 hover:border-botanical-sage transition-all shadow-soft">
                    <div className="p-2.5 rounded-xl bg-botanical-clay/20 border border-botanical-stone text-botanical-forest shrink-0">
                      <span className="material-symbols-outlined text-xl">monetization_on</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-serif font-bold text-botanical-forest">Thưởng hiệu suất vượt trội</h3>
                      <p className="text-xs text-botanical-forest/75 mt-1 leading-relaxed font-sans">
                        Thưởng dự án và hiệu suất cuối năm lên đến <strong className="text-botanical-forest font-semibold">4 tháng lương</strong> dựa trên KPI và kết quả kinh doanh.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex items-start gap-3.5 hover:border-botanical-sage transition-all shadow-soft">
                    <div className="p-2.5 rounded-xl bg-botanical-clay/20 border border-botanical-stone text-botanical-forest shrink-0">
                      <span className="material-symbols-outlined text-xl">health_and_safety</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-serif font-bold text-botanical-forest">Bảo hiểm Sức khỏe Toàn diện</h3>
                      <p className="text-xs text-botanical-forest/75 mt-1 leading-relaxed font-sans">
                        Gói bảo hiểm chăm sóc sức khỏe cao cấp toàn diện cho bản thân và <strong className="text-botanical-forest font-semibold">bảo trợ phụ thuộc gia đình</strong> tại các bệnh viện quốc tế hàng đầu.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex items-start gap-3.5 hover:border-botanical-sage transition-all shadow-soft">
                    <div className="p-2.5 rounded-xl bg-botanical-clay/20 border border-botanical-stone text-botanical-forest shrink-0">
                      <span className="material-symbols-outlined text-xl">school</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-serif font-bold text-botanical-forest">Quỹ đào tạo 20,000,000 VNĐ / năm</h3>
                      <p className="text-xs text-botanical-forest/75 mt-1 leading-relaxed font-sans">
                        Tài trợ 100% chi phí thi chứng chỉ quốc tế (AWS, GCP, CKA) &amp; định kỳ trang cấp thiết bị công nghệ hiện đại hàng năm.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-botanical-stone flex items-start gap-3.5 hover:border-botanical-sage transition-all shadow-soft">
                    <div className="p-2.5 rounded-xl bg-botanical-clay/20 border border-botanical-stone text-botanical-forest shrink-0">
                      <span className="material-symbols-outlined text-xl">flight_takeoff</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-serif font-bold text-botanical-forest">Nghỉ dưỡng &amp; Teambuilding Hàng năm</h3>
                      <p className="text-xs text-botanical-forest/75 mt-1 leading-relaxed font-sans">
                        Chuyến du lịch hàng năm chuẩn cao cấp; môi trường Open Workspace tràn ngập cảm hứng đậm chất Agile sáng tạo.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 4: Quy trình phỏng vấn chuẩn 3 vòng */}
            {(activeTab === 'ALL' || activeTab === 'PROCESS') && (
              <section className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 sm:p-7 space-y-5 shadow-soft">
                <div className="flex items-center gap-3 border-b border-botanical-stone pb-4">
                  <div className="w-9 h-9 rounded-xl bg-botanical-clay/30 text-botanical-forest flex items-center justify-center border border-botanical-stone">
                    <span className="material-symbols-outlined text-lg">route</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-botanical-forest uppercase tracking-wide">
                      Quy Trình Tuyển Dụng Tinh Gọn (3 Vòng)
                    </h2>
                    <p className="text-xs text-botanical-forest/65 font-sans">Quy trình phỏng vấn nhanh gọn, trả kết quả chỉ trong 48 giờ làm việc</p>
                  </div>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-botanical-stone">
                  {/* Round 1 */}
                  <div className="relative">
                    <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-botanical-forest text-white flex items-center justify-center text-[11px] font-serif font-bold shadow-soft">1</div>
                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone shadow-soft">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs sm:text-sm font-serif font-bold text-botanical-forest">Vòng 1: CV Screening &amp; AI Voice Mock Assessment</h3>
                        <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-botanical-sage/15 text-botanical-forest border border-botanical-sage/30 font-semibold">20 phút</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 mt-1.5 leading-relaxed font-sans">
                        Đánh giá độ tương thích kinh nghiệm hồ sơ tự động qua HireMate ATS kết hợp bài kiểm tra ngắn phản xạ kỹ thuật.
                      </p>
                    </div>
                  </div>

                  {/* Round 2 */}
                  <div className="relative">
                    <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-botanical-forest text-white flex items-center justify-center text-[11px] font-serif font-bold shadow-soft">2</div>
                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone shadow-soft">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs sm:text-sm font-serif font-bold text-botanical-forest">Vòng 2: Phỏng vấn Kỹ thuật chuyên sâu &amp; System Design</h3>
                        <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta border border-botanical-terracotta/30 font-semibold">60 phút</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 mt-1.5 leading-relaxed font-sans">
                        Trao đổi trực tiếp với Tech Lead &amp; Principal Architect về kiến trúc phân tán, bài toán đồng thời và xử lý sự cố thực tế.
                      </p>
                    </div>
                  </div>

                  {/* Round 3 */}
                  <div className="relative">
                    <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-botanical-forest text-white flex items-center justify-center text-[11px] font-serif font-bold shadow-soft">3</div>
                    <div className="p-4 rounded-2xl bg-white border border-botanical-stone shadow-soft">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs sm:text-sm font-serif font-bold text-botanical-forest">Vòng 3: Phỏng vấn Văn hóa &amp; Thỏa thuận Đãi ngộ (Offer)</h3>
                        <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 font-semibold">30 phút</span>
                      </div>
                      <p className="text-xs text-botanical-forest/75 mt-1.5 leading-relaxed font-sans">
                        Gặp gỡ Giám đốc Khối Công nghệ và Lead HR để thống nhất lộ trình phát triển và gói quyền lợi chi tiết.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* ================= RIGHT COLUMN: AI INTELLIGENCE & RECRUITER (4 cols) ================= */}
          <aside className="lg:col-span-4 space-y-6">
            {/* CARD 1: HireMate AI Match Radar & ATS Check */}
            <div className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 space-y-5 shadow-soft relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-botanical-stone pb-3">
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-botanical-forest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-botanical-terracotta">psychology</span>
                  HireMate AI Match Radar
                </span>
                <span className="badge-sage text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ATS LIVE
                </span>
              </div>

              {/* Circular Gauge & Score Summary */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-botanical-stone shadow-soft">
                <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle className="text-botanical-stone" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                    <circle 
                      className="text-botanical-forest" 
                      cx="50" 
                      cy="50" 
                      fill="transparent" 
                      r="40" 
                      stroke="currentColor" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={`${251.2 * (1 - job.aiMatchScore / 100)}`} 
                      strokeLinecap="round" 
                      strokeWidth="8" 
                    ></circle>
                  </svg>
                  <span className="absolute font-serif font-bold text-base text-botanical-forest">{job.aiMatchScore}%</span>
                </div>
                <div>
                  <div className="text-xs font-serif font-bold text-botanical-forest">{job.matchAssessment}</div>
                  <p className="text-[11px] text-botanical-forest/75 mt-1 leading-snug font-sans">{job.matchRank}</p>
                </div>
              </div>

              {/* Matched Skills Chips */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-botanical-forest font-semibold flex items-center gap-1 font-serif">
                      <span className="material-symbols-outlined text-botanical-sage text-sm">check_circle</span>
                      Kỹ năng khớp 100%
                    </span>
                    <span className="text-[10px] font-sans font-semibold text-botanical-forest/65">{job.matchedSkills.length}/{job.matchedSkills.length} Khớp</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.matchedSkills.map((sk, idx) => (
                      <span key={idx} className="badge-sage text-[11px] font-medium px-2.5 py-1 rounded-full">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-botanical-stone">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-botanical-terracotta font-serif font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-botanical-terracotta text-sm">tips_and_updates</span>
                      Gợi ý chú ý trước phỏng vấn
                    </span>
                    <span className="text-[10px] font-sans text-botanical-forest/60 font-semibold">{job.missingFocus.length} Điểm</span>
                  </div>
                  <div className="space-y-2">
                    {job.missingFocus.map((mf, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-botanical-stone flex items-start gap-2 shadow-soft">
                        <span className="material-symbols-outlined text-botanical-terracotta text-xs mt-0.5 shrink-0">arrow_forward</span>
                        <span className="text-[11px] text-botanical-forest/80 leading-snug font-sans">
                          <strong className="text-botanical-forest font-semibold">{mf.topic}:</strong> {mf.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Call to Action Button */}
              {isRecruiter ? (
                <button 
                  type="button"
                  onClick={() => { 
                    if (!user) {
                      window.location.hash = '#/login';
                      return;
                    }
                    window.location.hash = `#/applicants-management?jobId=${currentId}`; 
                  }}
                  className="btn-botanical-primary w-full py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">groups</span>
                  <span>Xem {job.applicantCount || 24} ứng viên</span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    if (!user) {
                      window.location.hash = '#/login';
                      return;
                    }
                    window.location.hash = `#/ai-interview?jobId=${job.jobId || currentId}`;
                  }}
                  className="btn-botanical-secondary w-full py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-botanical-sage">mic</span>
                  <span>Luyện phỏng vấn AI với bài đăng này</span>
                </button>
              )}
            </div>

            {/* CARD 2: Nhà tuyển dụng phụ trách (Talent Partner Profile) */}
            <div className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 space-y-4 shadow-soft relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-botanical-stone pb-3">
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-botanical-forest">
                  Nhà tuyển dụng phụ trách
                </span>
                <span className="text-[11px] font-semibold text-botanical-forest flex items-center gap-1.5 font-sans">
                  <span className="w-2 h-2 rounded-full bg-botanical-sage"></span>
                  Trực tuyến
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-botanical-stone shrink-0 shadow-soft">
                  <img alt={job.recruiter.name} className="w-full h-full object-cover" src={job.recruiter.avatar} />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-botanical-forest">{job.recruiter.name}</h3>
                  <p className="text-xs text-botanical-forest/65 font-sans">{job.recruiter.title}</p>
                  <div className="flex items-center gap-1 text-[11px] text-botanical-forest/75 mt-1 font-sans">
                    <span className="material-symbols-outlined text-xs text-botanical-sage">timer</span>
                    <span>{job.recruiter.responseTime}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-botanical-forest/80 italic leading-relaxed bg-white p-3.5 rounded-2xl border border-botanical-stone font-serif shadow-soft">
                "{job.recruiter.quote}"
              </p>

              <button 
                type="button"
                onClick={() => {
                  if (!user) {
                    window.location.hash = '#/login';
                    return;
                  }
                  handleStartChat();
                }}
                className="btn-botanical-secondary w-full py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-botanical-sage">chat</span>
                <span>Nhắn tin với Recruiter</span>
              </button>
            </div>

            {/* CARD 3: Về công ty & Hệ sinh thái (About Enterprise) */}
            <div className="rounded-3xl card-botanical bg-[#FAF9F5] border border-botanical-stone p-6 space-y-4 shadow-soft relative overflow-hidden">
              <div className="text-xs font-serif font-bold uppercase tracking-wider text-botanical-forest border-b border-botanical-stone pb-3">
                Về {job.companyName}
              </div>

              <div className="space-y-2.5 text-xs text-botanical-forest/80 font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone/60">
                  <span className="text-botanical-forest/60">Quy mô nhân sự:</span>
                  <span className="font-bold text-botanical-forest font-serif">{job.companyInfo.size}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone/60">
                  <span className="text-botanical-forest/60">Trụ sở chính:</span>
                  <span className="font-bold text-botanical-forest font-serif">{job.companyInfo.headquarters}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone/60">
                  <span className="text-botanical-forest/60">Thị trường chính:</span>
                  <span className="font-bold text-botanical-forest font-serif">{job.companyInfo.markets}</span>
                </div>
              </div>

              <p className="text-xs text-botanical-forest/75 leading-relaxed font-sans">
                {job.companyInfo.desc}
              </p>

              <a 
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-botanical-terracotta hover:underline pt-1 cursor-pointer font-sans" 
                href="#/"
              >
                <span>Xem thêm {job.companyInfo.otherJobsCount} vị trí khác của {job.companyShort}</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* MODERN BOTANICAL STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-[#FAF9F5]/95 backdrop-blur-md border-t border-botanical-stone py-3.5 px-4 sm:px-6 lg:px-8 shadow-soft-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-botanical-stone flex items-center justify-center font-serif font-bold text-xs text-botanical-forest shadow-soft">
              {job.companyShort}
            </div>
            <div>
              <div className="text-xs font-serif font-bold text-botanical-forest">{job.title} {job.subtitle}</div>
              <div className="text-[11px] text-botanical-forest/70 flex items-center gap-2 mt-0.5 font-sans">
                <span className="font-semibold text-botanical-terracotta">{job.salaryText}</span>
                <span className="text-botanical-stone">•</span>
                <span className="text-botanical-forest/60 font-normal">Độ tương thích AI: <strong className="text-botanical-forest font-semibold">{job.aiMatchScore}%</strong></span>
              </div>
            </div>
          </div>

          {isRecruiter ? (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                type="button"
                onClick={handleShare}
                className="btn-botanical-secondary px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">share</span>
                <span>Chia sẻ link</span>
              </button>
              <button 
                type="button"
                onClick={() => { window.location.hash = `#/applicants-management?jobId=${currentId}`; }}
                className="btn-botanical-primary flex-1 sm:flex-initial px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">groups</span>
                <span>Quản lý {job.applicantCount || 24} ứng viên</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2.5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                  isBookmarked 
                    ? 'border-botanical-terracotta text-botanical-terracotta bg-botanical-terracotta/10 shadow-soft' 
                    : 'border-botanical-stone bg-white text-botanical-forest hover:bg-botanical-cream'
                }`} 
                title="Lưu vị trí này"
              >
                <span className="material-symbols-outlined text-lg">
                  {isBookmarked ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (!user) {
                    window.location.hash = '#/login';
                    return;
                  }
                  window.location.hash = `#/ai-interview?jobId=${job.jobId || currentId}`;
                }}
                className="btn-botanical-secondary flex-1 sm:flex-initial px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-botanical-sage">mic</span>
                <span>Luyện AI Mock</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (!user) {
                    window.location.hash = '#/login';
                    return;
                  }
                  setIsApplying(true);
                }}
                className="btn-botanical-primary flex-1 sm:flex-initial px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">bolt</span>
                <span>Ứng tuyển ngay bằng AI CV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Apply Modal */}
      {isApplying && (
        <ApplyJobModal
          job={job}
          user={user}
          onClose={() => setIsApplying(false)}
          onSuccess={() => {
            setIsApplying(false);
            alert('Nộp hồ sơ ứng tuyển bằng AI CV thành công!');
          }}
        />
      )}
    </div>
  );
}
