import React, { useState, useEffect } from 'react';
import { applicationApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';

const DEFAULT_APPLICATIONS = [
  {
    id: 1,
    company: 'FPT Software',
    companyShort: 'FPT',
    division: '// Fintech Division',
    title: 'Senior Backend Engineer (Java / Distributed Systems)',
    salary: '$2,500 - $3,500/tháng',
    location: 'TP.HCM (Hybrid)',
    appliedDate: '10/04/2026',
    aiMatch: 94,
    cvUsed: 'Java_Developer_CV_2026.pdf',
    atsScore: 98,
    responseNotice: 'Phản hồi nhanh (Thường < 24h)',
    status: 'INTERVIEW', // 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED'
    statusLabel: 'Vòng Phỏng Vấn',
    themeColor: 'primary',
    currentStep: 3, // 1 to 4
    steps: [
      { step: 1, title: '1. Đã Nộp', date: '10/04/2026', status: 'completed' },
      { step: 2, title: '2. Duyệt CV', date: 'Đạt 94%', status: 'completed' },
      { step: 3, title: '3. Phỏng Vấn Tech', date: '15/04 • 14:00', status: 'active' },
      { step: 4, title: '4. Nhận Offer', date: 'Chờ kết quả', status: 'pending' },
    ],
    nextAction: {
      title: 'Lịch phỏng vấn kỹ thuật trực tuyến: 14:00 - Thứ Tư, 15/04/2026',
      description: 'Hình thức: Trực tuyến qua Google Meet (Người phỏng vấn: Tech Lead & Solution Architect).',
      type: 'meet',
    },
    recruiter: {
      name: 'Minh Anh',
      role: 'Lead Tech Recruiter',
    },
    jobId: 101,
  },
  {
    id: 2,
    company: 'MoMo Payment',
    companyShort: 'MoMo',
    division: '// Payment Platform',
    title: 'Senior Distributed Systems Engineer',
    salary: '$3,200/tháng + Performance Bonus',
    location: 'TP.HCM (Quận 7)',
    appliedDate: '02/04/2026',
    aiMatch: 92,
    cvUsed: 'Java_Developer_CV_2026.pdf',
    atsScore: 95,
    responseNotice: 'Đã hoàn tất các vòng tuyển dụng',
    status: 'OFFER',
    statusLabel: 'Đã Nhận Offer (Hạn: 20/04)',
    themeColor: 'secondary',
    progress: '4 / 4 Vòng',
    progressNote: 'Sẵn sàng đàm phán hợp đồng',
    offerDetails: {
      baseSalary: '$3,200 USD/tháng',
      signOnBonus: '$1,000 USD',
      shares: '1,200 ESOP cổ phần',
      startDate: '02/05/2026',
      deadline: '20/04/2026',
    },
    recruiter: {
      name: 'Thảo Vy',
      role: 'HR Manager MoMo',
    },
    jobId: 104,
  },
  {
    id: 3,
    company: 'VNG Games Studio',
    companyShort: 'VNG',
    division: '// Game Infrastructure',
    title: 'Lead Game Backend Engineer',
    salary: '$3,000 - $4,200/tháng',
    location: 'Campus VNG, TP.HCM',
    appliedDate: '08/04/2026',
    aiMatch: 91,
    cvUsed: 'Tran_Hoang_Long_Backend.pdf',
    atsScore: 92,
    responseNotice: 'Yêu cầu kiểm tra kỹ thuật AI',
    status: 'SCREENING',
    statusLabel: 'Chờ Làm AI Assessment',
    themeColor: 'tertiary',
    pendingAlert: {
      text: 'Cần làm bài AI Voice Assessment trước ngày 14/04 (Khoảng 20 phút).',
      badge: 'Hạn 48 giờ',
    },
    jobId: 102,
  },
  {
    id: 4,
    company: 'Techcombank Digital',
    companyShort: 'TCB',
    division: '// Core Banking Team',
    title: 'Core Banking Solution Architect',
    salary: '$3,800 - $5,500/tháng',
    location: 'Hà Nội / TP.HCM',
    appliedDate: '10/04/2026',
    aiMatch: 88,
    cvUsed: 'Java_Developer_CV_2026.pdf',
    atsScore: 90,
    responseNotice: 'Đang sàng lọc hồ sơ',
    status: 'APPLIED',
    statusLabel: 'Đang Sàng Lọc CV',
    themeColor: 'outline',
    reviewNotice: 'HR đang thẩm định hồ sơ kỹ thuật (Vòng Sàng Lọc CV).',
    jobId: 106,
  },
];

export default function CandidateApplicationsPage({ user }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [applications, setApplications] = useState(DEFAULT_APPLICATIONS);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RECENT'); // 'RECENT' | 'ACTION' | 'MATCH'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Modals and feedback state
  const [activeModal, setActiveModal] = useState(null); // 'OFFER' | 'INVITATION' | 'CHAT'
  const [modalData, setModalData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [offerSigned, setOfferSigned] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Fetch real applications from API
    applicationApi.getMyApplications()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((app, idx) => ({
            id: app.applicationId || idx + 1,
            company: app.job?.company?.companyName || 'Doanh Nghiệp Tuyển Dụng',
            companyShort: app.job?.company?.companyName?.slice(0, 4)?.toUpperCase() || 'CORP',
            division: app.job?.company?.industry ? `// ${app.job.company.industry}` : '// Tuyển Dụng',
            title: app.job?.title || 'Vị trí Ứng Tuyển',
            salary: app.job?.salaryMin && app.job?.salaryMax ? `$${app.job.salaryMin} - $${app.job.salaryMax}/tháng` : 'Thương lượng',
            location: app.job?.location || 'Việt Nam',
            appliedDate: app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Mới nộp',
            aiMatch: 95,
            cvUsed: app.cv?.fileName || 'CV_Ung_Vien.pdf',
            atsScore: 96,
            responseNotice: 'Đang trong quy trình xử lý',
            status: app.status || 'APPLIED',
            statusLabel: app.status === 'OFFER' ? 'Đã Nhận Offer' : app.status === 'INTERVIEW' ? 'Vòng Phỏng Vấn' : app.status === 'SCREENING' ? 'Đang Duyệt CV' : app.status === 'REJECTED' ? 'Chưa Phù Hợp' : 'Đã Nộp Hồ Sơ',
            themeColor: app.status === 'OFFER' ? 'secondary' : 'primary',
            currentStep: app.status === 'OFFER' ? 4 : app.status === 'INTERVIEW' ? 3 : app.status === 'SCREENING' ? 2 : 1,
            steps: [
              { step: 1, title: '1. Đã Nộp', date: app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Hoàn tất', status: 'completed' },
              { step: 2, title: '2. Duyệt CV', date: 'Đạt ATS', status: app.status !== 'APPLIED' ? 'completed' : 'active' },
              { step: 3, title: '3. Phỏng Vấn', date: 'Vòng Đánh Giá', status: (app.status === 'INTERVIEW' || app.status === 'OFFER') ? 'completed' : 'pending' },
              { step: 4, title: '4. Nhận Offer', date: 'Kết quả', status: app.status === 'OFFER' ? 'completed' : 'pending' },
            ],
            recruiter: {
              name: app.job?.recruiter?.user?.fullName || 'Bộ Phận Tuyển Dụng',
              role: app.job?.recruiter?.position || 'Talent Acquisition',
            },
            jobId: app.job?.jobId,
          }));
          setApplications(mapped);
        }
      })
      .catch(() => {
        // Fallback to default rich showcase
      });
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenOfferModal = (app) => {
    setModalData(app);
    setActiveModal('OFFER');
  };

  const handleOpenInvitationModal = (app) => {
    setModalData(app);
    setActiveModal('INVITATION');
  };

  const handleOpenChatModal = (recruiterName, company) => {
    setModalData({ recruiterName, company });
    setChatHistory([
      { sender: 'recruiter', text: `Chào bạn! Tôi là ${recruiterName} từ ${company}. Rất vui được trao đổi về hồ sơ của bạn.` }
    ]);
    setActiveModal('CHAT');
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessageInput.trim()) return;
    const newMsg = { sender: 'me', text: chatMessageInput.trim() };
    setChatHistory(prev => [...prev, newMsg]);
    setChatMessageInput('');

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { sender: 'recruiter', text: 'Cảm ơn phản hồi của bạn! Tôi đã ghi nhận và sẽ cập nhật thông tin sớm nhất.' }
      ]);
    }, 1000);
  };

  const handleSignOffer = () => {
    setOfferSigned(true);
    showToast('🎉 Chúc mừng! Bạn đã ký chấp thuận Offer thành công.');
    setTimeout(() => {
      setActiveModal(null);
    }, 1500);
  };

  // Filter and sort applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'APPLIED') return app.status === 'APPLIED' || app.status === 'SCREENING';
    if (activeFilter === 'INTERVIEW') return app.status === 'INTERVIEW';
    if (activeFilter === 'OFFER') return app.status === 'OFFER';
    if (activeFilter === 'REJECTED') return app.status === 'REJECTED';
    return true; // 'ALL'
  }).sort((a, b) => {
    if (sortBy === 'MATCH') return b.aiMatch - a.aiMatch;
    if (sortBy === 'ACTION') {
      const priority = { INTERVIEW: 3, OFFER: 2, SCREENING: 1, APPLIED: 0, REJECTED: -1 };
      return (priority[b.status] || 0) - (priority[a.status] || 0);
    }
    return a.id - b.id; // Default / Recent priority order (FPT, MoMo, VNG, TCB)
  });

  return (
    <div className="w-full bg-transparent font-sans text-botanical-forest min-h-screen pb-16 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-white border border-botanical-stone text-botanical-forest text-xs shadow-soft-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base text-botanical-sage">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* ========================================================= */}
        {/* 1. HEADER & KPI QUICK METRICS                             */}
        {/* ========================================================= */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-botanical-sage animate-pulse"></span>
                <span className="text-xs uppercase tracking-widest text-botanical-forest/70 font-semibold font-sans">
                  Active Pipeline Tracker
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-botanical-forest tracking-tight">
                Đơn Ứng Tuyển Của Tôi
              </h1>
              <p className="text-xs sm:text-sm text-botanical-forest/70 mt-1.5 max-w-2xl font-sans">
                Theo dõi tiến độ, lịch phỏng vấn và trạng thái phản hồi từ nhà tuyển dụng theo thời gian thực.
              </p>
            </div>

            {/* Quick Summary Action */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-white border border-botanical-stone text-xs text-botanical-forest/80 flex items-center gap-2 shadow-soft">
                <span className="material-symbols-outlined text-sm text-botanical-sage">sync</span>
                Cập nhật tự động: <span className="text-botanical-forest font-semibold">10 phút trước</span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards (4 Cards Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1 */}
            <div 
              onClick={() => setActiveFilter('ALL')}
              className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
                activeFilter === 'ALL' ? 'bg-white border-botanical-forest ring-1 ring-botanical-forest/40' : 'bg-white/90 border-botanical-stone hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-botanical-forest/70 uppercase tracking-wider">Tổng Đơn Nộp</span>
                <span className="material-symbols-outlined text-lg text-botanical-forest">folder_open</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-botanical-forest">14</span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30">Đang hoạt động</span>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => setActiveFilter('APPLIED')}
              className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
                activeFilter === 'APPLIED' ? 'bg-white border-botanical-terracotta ring-1 ring-botanical-terracotta/40' : 'bg-white/90 border-botanical-stone hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-botanical-forest/70 uppercase tracking-wider">Đang Xét Duyệt</span>
                <span className="material-symbols-outlined text-lg text-botanical-terracotta">hourglass_top</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-botanical-forest">5</span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-botanical-clay/30 text-botanical-forest border border-botanical-stone">Chờ phản hồi</span>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => setActiveFilter('INTERVIEW')}
              className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
                activeFilter === 'INTERVIEW' ? 'bg-white border-botanical-forest ring-1 ring-botanical-forest/40' : 'bg-white/90 border-botanical-stone hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-botanical-terracotta">Vòng Phỏng Vấn</span>
                <span className="material-symbols-outlined text-lg text-botanical-terracotta">videocam</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-botanical-terracotta">4</span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta border border-botanical-terracotta/30">2 lịch sắp diễn ra</span>
              </div>
            </div>

            {/* Card 4 */}
            <div 
              onClick={() => setActiveFilter('OFFER')}
              className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
                activeFilter === 'OFFER' ? 'bg-white border-botanical-sage ring-1 ring-botanical-sage/50' : 'bg-white/90 border-botanical-stone hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-botanical-forest/70 uppercase tracking-wider">Đề Nghị Nhận Việc</span>
                <span className="material-symbols-outlined text-lg text-botanical-sage">verified</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-botanical-forest">2</span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30">Sẵn sàng ký</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. FILTER & TOOLBAR SECTION                               */}
        {/* ========================================================= */}
        <section className="p-4 sm:p-5 rounded-3xl bg-white border border-purple-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 font-sans">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#f8f7ff] border border-purple-100 rounded-full text-[#1e1b4b] font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100 transition-all font-sans" 
              placeholder="Tìm theo công ty, vị trí ứng tuyển..." 
              type="text"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Status Tabs (Segmented) */}
            <div className="flex items-center p-1 rounded-full bg-[#f8f7ff] border border-purple-100 overflow-x-auto text-xs font-sans">
              <button 
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-[#32247b] text-white shadow-sm'
                    : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                Tất cả (14)
              </button>
              <button 
                onClick={() => setActiveFilter('APPLIED')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'APPLIED'
                    ? 'bg-[#32247b] text-white shadow-sm'
                    : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                Chờ duyệt (5)
              </button>
              <button 
                onClick={() => setActiveFilter('INTERVIEW')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'INTERVIEW'
                    ? 'bg-[#32247b] text-white shadow-sm'
                    : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                Phỏng vấn (4)
              </button>
              <button 
                onClick={() => setActiveFilter('OFFER')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'OFFER'
                    ? 'bg-[#32247b] text-white shadow-sm'
                    : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                Đã nhận Offer (2)
              </button>
              <button 
                onClick={() => setActiveFilter('REJECTED')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'REJECTED'
                    ? 'bg-[#32247b] text-white shadow-sm'
                    : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                Từ chối (3)
              </button>
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 text-xs font-sans font-bold bg-white border border-purple-100 rounded-full text-[#1e1b4b] focus:outline-none focus:border-[#5b48bd] cursor-pointer shadow-sm"
              >
                <option value="RECENT">Gần đây nhất</option>
                <option value="ACTION">Cần hành động ngay</option>
                <option value="MATCH">AI Match: Cao nhất</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[#1e1b4b]/70">expand_more</span>
            </div>

            {/* View Toggle (List vs Kanban) */}
            <div className="flex items-center rounded-full bg-[#f8f7ff] border border-purple-100 p-0.5 shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#32247b] text-white font-bold' : 'text-slate-400 hover:text-[#32247b]'
                }`}
                title="Chế độ Danh sách"
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-[#32247b] text-white font-bold' : 'text-slate-400 hover:text-[#32247b]'
                }`}
                title="Chế độ Kanban"
              >
                <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. MAIN WORKSPACE: APPLICATION LIST & RIGHT SIDEBAR       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT / CENTER: APPLICATIONS LIST (8 Columns) */}
          <main className="lg:col-span-8 flex flex-col gap-5">
            {viewMode === 'kanban' ? (
              /* KANBAN BOARD VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Column 1: Đã nộp */}
                <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft">
                  <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                    <span className="text-xs font-serif font-bold text-botanical-forest">1. Đã Nộp Hồ Sơ</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-cream text-botanical-forest font-sans border border-botanical-stone">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-2 hover:shadow-soft transition-all">
                    <div className="text-xs font-serif font-bold text-botanical-forest">Techcombank Digital</div>
                    <div className="text-[11px] text-botanical-forest/70 font-sans">Core Banking Architect</div>
                    <div className="text-[10px] font-sans font-semibold text-botanical-sage">88% AI Match</div>
                  </div>
                </div>

                {/* Column 2: Sàng lọc CV */}
                <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft">
                  <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                    <span className="text-xs font-serif font-bold text-botanical-forest">2. Duyệt CV</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest font-sans border border-botanical-sage/30">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-2 hover:shadow-soft transition-all">
                    <div className="text-xs font-serif font-bold text-botanical-forest">VNG Games Studio</div>
                    <div className="text-[11px] text-botanical-forest/70 font-sans">Lead Game Backend</div>
                    <div className="text-[10px] text-botanical-terracotta font-sans font-semibold">Cần làm Voice Test</div>
                  </div>
                </div>

                {/* Column 3: Phỏng vấn */}
                <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft ring-1 ring-botanical-terracotta/30">
                  <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                    <span className="text-xs font-serif font-bold text-botanical-terracotta">3. Phỏng Vấn</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta font-sans border border-botanical-terracotta/30">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-2 hover:shadow-soft transition-all">
                    <div className="text-xs font-serif font-bold text-botanical-forest">FPT Software</div>
                    <div className="text-[11px] text-botanical-forest/70 font-sans">Senior Backend Java</div>
                    <div className="text-[10px] text-botanical-terracotta font-sans font-semibold">15/04 • 14:00 Meet</div>
                    <a href="#/ai-interview?jobId=101" className="block text-center text-[10px] py-1.5 rounded-full btn-botanical-primary font-medium mt-1">
                      Ôn luyện ngay
                    </a>
                  </div>
                </div>

                {/* Column 4: Đã nhận Offer */}
                <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft ring-1 ring-botanical-sage/30">
                  <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                    <span className="text-xs font-serif font-bold text-botanical-forest">4. Nhận Offer</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest font-sans border border-botanical-sage/30">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-2 hover:shadow-soft transition-all">
                    <div className="text-xs font-serif font-bold text-botanical-forest">MoMo Payment</div>
                    <div className="text-[11px] text-botanical-forest/70 font-sans">Senior Distributed Systems</div>
                    <div className="text-[10px] text-botanical-terracotta font-serif font-bold">$3,200/tháng</div>
                    <button 
                      onClick={() => handleOpenOfferModal(DEFAULT_APPLICATIONS[1])}
                      className="w-full text-center text-[10px] py-1.5 rounded-full btn-botanical-secondary font-medium cursor-pointer mt-1"
                    >
                      Ký Offer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LIST VIEW MODE */
              filteredApps.map((app) => {
                if (app.id === 1) {
                  /* CARD 1: FPT SOFTWARE (CRITICAL PRIORITY - INTERVIEW) */
                  return (
                    <div key={app.id} className="card-botanical bg-white/95 rounded-3xl p-6 sm:p-7 border border-botanical-stone shadow-soft transition-all duration-300 hover:shadow-soft-lg space-y-5">
                      {/* Top Row: Company Info & AI Match */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-botanical-sage/15 text-botanical-forest border border-botanical-stone flex items-center justify-center font-serif font-bold text-lg shadow-soft cursor-pointer hover:scale-105 transition-transform shrink-0"
                            title="Xem chi tiết đơn tuyển dụng FPT"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 
                                onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                                className="text-lg font-serif font-bold text-botanical-forest hover:text-botanical-terracotta transition-colors cursor-pointer"
                              >
                                {app.company}
                              </h3>
                              <span className="text-xs font-sans text-botanical-forest/60">• {app.division}</span>
                            </div>
                            <h4 className="text-sm font-sans font-semibold text-botanical-terracotta mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-sans text-botanical-forest/70 mt-1.5">
                              <span className="flex items-center gap-1 font-medium text-botanical-forest">
                                <span className="material-symbols-outlined text-sm text-botanical-sage">payments</span>
                                {app.salary}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                {app.location}
                              </span>
                              <span>•</span>
                              <span>Nộp: {app.appliedDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI Match Badge */}
                        <div className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-botanical-sage/20 border border-botanical-sage/40 text-botanical-forest font-serif font-bold text-xs shadow-soft">
                          <span className="material-symbols-outlined text-sm text-botanical-sage">bolt</span>
                          {app.aiMatch}% AI Match
                        </div>
                      </div>

                      {/* CV Used & Metadata bar */}
                      <div className="pt-3 border-t border-botanical-stone/80 flex flex-wrap items-center justify-between text-xs font-sans text-botanical-forest/70 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-botanical-sage">description</span>
                          <span>CV: <strong className="text-botanical-forest font-medium">{app.cvUsed}</strong></span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-botanical-cream text-botanical-forest border border-botanical-stone">ATS {app.atsScore}/100</span>
                        </div>
                        <span className="text-[11px] text-botanical-terracotta font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-botanical-terracotta animate-pulse"></span>
                          {app.responseNotice}
                        </span>
                      </div>

                      {/* STEPPER PIPELINE TRACKER */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100 shadow-sm font-sans">
                        <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-[#1e1b4b] mb-3.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                          Tiến Trình Ứng Tuyển
                        </div>
                        <div className="grid grid-cols-4 gap-2 relative">
                          {/* Step 1 (Done) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-[#32247b] text-white flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
                                <span className="material-symbols-outlined text-sm font-extrabold">check</span>
                              </div>
                              <div className="flex-1 h-1 bg-[#32247b] mx-1 rounded-full"></div>
                            </div>
                            <div className="text-xs font-sans font-extrabold text-[#1e1b4b]">1. Đã Nộp</div>
                            <div className="text-[11px] font-sans text-slate-500 font-semibold mt-0.5">10/04/2026</div>
                          </div>

                          {/* Step 2 (Done) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-[#32247b] text-white flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
                                <span className="material-symbols-outlined text-sm font-extrabold">check</span>
                              </div>
                              <div className="flex-1 h-1 bg-[#f97316] mx-1 rounded-full"></div>
                            </div>
                            <div className="text-xs font-sans font-extrabold text-[#1e1b4b]">2. Duyệt CV</div>
                            <div className="text-[11px] font-sans text-[#10b981] font-bold mt-0.5">Đạt 94%</div>
                          </div>

                          {/* Step 3 (Active) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-[#f97316] text-white flex items-center justify-center text-xs font-extrabold shadow-md ring-4 ring-orange-500/20 animate-pulse shrink-0">
                                3
                              </div>
                              <div className="flex-1 h-1 bg-purple-100 mx-1 rounded-full"></div>
                            </div>
                            <div className="text-xs font-sans font-extrabold text-[#f97316]">3. Phỏng Vấn Tech</div>
                            <div className="text-[11px] font-sans text-[#1e1b4b] font-bold mt-0.5">15/04 • 14:00</div>
                          </div>

                          {/* Step 4 (Pending) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-extrabold border border-purple-100 shrink-0">
                                4
                              </div>
                            </div>
                            <div className="text-xs font-sans font-bold text-slate-500">4. Nhận Offer</div>
                            <div className="text-[11px] font-sans text-slate-400 font-medium mt-0.5">Chờ kết quả</div>
                          </div>
                        </div>
                      </div>

                      {/* Highlight Next Action Callout */}
                      <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-3.5 font-sans">
                        <span className="material-symbols-outlined text-[#5b48bd] text-xl mt-0.5">event_upcoming</span>
                        <div className="text-xs font-sans">
                          <span className="font-sans font-bold text-[#1e1b4b]">Lịch phỏng vấn kỹ thuật trực tuyến:</span>
                          <span className="text-[#f97316] font-bold ml-1.5">14:00 - Thứ Tư, 15/04/2026</span>
                          <span className="text-slate-600 block mt-0.5">Hình thức: Trực tuyến qua Google Meet (Người phỏng vấn: Tech Lead &amp; Solution Architect).</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a 
                          href="#/ai-interview?jobId=101" 
                          className="btn-botanical-primary !text-xs !py-2.5 !px-5 flex items-center gap-2 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">smart_toy</span>
                          Vào Phòng Phỏng Vấn AI Ôn Luyện
                        </a>
                        <button 
                          onClick={() => handleOpenChatModal('Minh Anh', 'FPT Software')}
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm text-botanical-sage">chat</span>
                          Nhắn Recruiter Minh Anh
                        </button>
                        <button 
                          onClick={() => handleOpenInvitationModal(app)}
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">mark_email_read</span>
                          Xem Thư Mời
                        </button>
                      </div>
                    </div>
                  );
                }

                if (app.id === 2) {
                  /* CARD 2: MOMO (OFFER RECEIVED) */
                  return (
                    <div key={app.id} className="card-botanical bg-white/95 rounded-3xl p-6 sm:p-7 border border-botanical-stone shadow-soft transition-all duration-300 hover:shadow-soft-lg space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-botanical-sage/15 text-botanical-forest border border-botanical-stone flex items-center justify-center font-serif font-bold text-lg shadow-soft cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 
                                onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                                className="text-lg font-serif font-bold text-botanical-forest hover:text-botanical-terracotta transition-colors cursor-pointer"
                              >
                                {app.company}
                              </h3>
                              <span className="text-xs font-sans text-botanical-forest px-2.5 py-0.5 rounded-full bg-botanical-sage/20 border border-botanical-sage/30">Vòng 4/4: Thành công</span>
                            </div>
                            <h4 className="text-sm font-sans font-semibold text-botanical-forest mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-sans text-botanical-forest/70 mt-1.5">
                              <span className="flex items-center gap-1 text-botanical-terracotta font-serif font-bold">
                                <span className="material-symbols-outlined text-sm">monetization_on</span>
                                {app.salary}
                              </span>
                              <span>•</span>
                              <span>{app.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Offer Status Badge */}
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-botanical-terracotta/15 border border-botanical-terracotta/30 text-botanical-terracotta font-serif font-bold text-xs shadow-soft">
                          🎉 {app.statusLabel}
                        </div>
                      </div>

                      {/* Progress Mini Tracker (4/4 Completed) */}
                      <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-2">
                        <div className="flex items-center justify-between text-xs font-sans text-botanical-forest/70">
                          <span>Tiến trình hoàn tất: <strong className="text-botanical-forest font-bold">{app.progress}</strong></span>
                          <span className="text-botanical-sage font-medium">{app.progressNote}</span>
                        </div>
                        <div className="w-full h-2 bg-botanical-stone rounded-full overflow-hidden">
                          <div className="h-full bg-botanical-forest w-full rounded-full"></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button 
                          onClick={() => handleOpenOfferModal(app)}
                          className="btn-botanical-primary !text-xs !py-2.5 !px-5 flex items-center gap-2 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                          Xem Chi Tiết Offer &amp; Ký
                        </button>
                        <button 
                          onClick={() => handleOpenChatModal('Thảo Vy', 'MoMo Payment')}
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm text-botanical-sage">forum</span>
                          Trao đổi với HR MoMo
                        </button>
                      </div>
                    </div>
                  );
                }

                if (app.id === 3) {
                  /* CARD 3: VNG GAMES STUDIO (AI ASSESSMENT REQUIRED) */
                  return (
                    <div key={app.id} className="card-botanical bg-white/95 rounded-3xl p-6 sm:p-7 border border-botanical-stone shadow-soft transition-all duration-300 hover:shadow-soft-lg space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-botanical-sage/15 text-botanical-forest border border-botanical-stone flex items-center justify-center font-serif font-bold text-lg shadow-soft cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 
                                onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                                className="text-lg font-serif font-bold text-botanical-forest hover:text-botanical-terracotta transition-colors cursor-pointer"
                              >
                                {app.company}
                              </h3>
                              <span className="text-xs font-sans text-botanical-forest/60">• {app.division}</span>
                            </div>
                            <h4 className="text-sm font-sans font-semibold text-botanical-forest mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-sans text-botanical-forest/70 mt-1.5">
                              <span className="flex items-center gap-1 text-botanical-forest font-medium">
                                {app.salary}
                              </span>
                              <span>•</span>
                              <span>{app.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI Match */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-botanical-sage/20 text-botanical-forest font-serif font-bold text-xs border border-botanical-sage/40 shadow-soft">
                          <span className="material-symbols-outlined text-sm text-botanical-sage">auto_awesome</span>
                          {app.aiMatch}% AI Match
                        </div>
                      </div>

                      {/* Pending Task Alert */}
                      <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-botanical-terracotta text-lg">mic</span>
                          <span className="text-botanical-forest font-sans">{app.pendingAlert.text}</span>
                        </div>
                        <span className="text-[11px] font-serif font-bold text-botanical-terracotta uppercase tracking-wider shrink-0">{app.pendingAlert.badge}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a 
                          href="#/ai-interview?jobId=102"
                          className="btn-botanical-primary !text-xs !py-2.5 !px-5 flex items-center gap-2 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">play_circle</span>
                          Bắt Đầu Làm AI Assessment
                        </a>
                        <a 
                          href="#/jobs/102"
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 cursor-pointer shadow-soft"
                        >
                          Xem JD &amp; Yêu cầu
                        </a>
                      </div>
                    </div>
                  );
                }

                if (app.id === 4) {
                  /* CARD 4: TECHCOMBANK DIGITAL (CV UNDER REVIEW) */
                  return (
                    <div key={app.id} className="card-botanical bg-white/95 rounded-3xl p-6 sm:p-7 border border-botanical-stone shadow-soft transition-all duration-300 hover:shadow-soft-lg space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-botanical-sage/15 text-botanical-forest border border-botanical-stone flex items-center justify-center font-serif font-bold text-lg shadow-soft cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <h3 
                              onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                              className="text-lg font-serif font-bold text-botanical-forest hover:text-botanical-terracotta transition-colors cursor-pointer"
                            >
                              {app.company}
                            </h3>
                            <h4 className="text-sm font-sans font-semibold text-botanical-forest mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-sans text-botanical-forest/70 mt-1.5">
                              <span>{app.location}</span>
                              <span>•</span>
                              <span>Nộp ngày {app.appliedDate} (2 ngày trước)</span>
                            </div>
                          </div>
                        </div>

                        {/* AI Match */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-botanical-cream text-botanical-forest font-serif font-medium text-xs border border-botanical-stone">
                          {app.aiMatch}% AI Match
                        </div>
                      </div>

                      {/* Under Review status indicator */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone flex items-center gap-2.5 text-xs text-botanical-forest/80 font-sans">
                        <span className="material-symbols-outlined text-base text-botanical-sage">schedule</span>
                        <span>{app.reviewNotice}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button 
                          onClick={() => showToast('Đã gửi thông báo nhắc nhở đến bộ phận HR Techcombank.')}
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">notifications_active</span>
                          Nhắc nhở cập nhật
                        </button>
                        <a 
                          href="#/jobs/106"
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 cursor-pointer shadow-soft"
                        >
                          Xem chi tiết hồ sơ nộp
                        </a>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </main>

          {/* RIGHT SIDEBAR: UPCOMING EVENTS & AI MENTOR COPILOT (4 Columns) */}
          <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
            {/* SIDEBAR BLOCK 1: UPCOMING SCHEDULE */}
            <div className="card-botanical bg-white/95 rounded-3xl p-6 border border-botanical-stone shadow-soft">
              <div className="flex items-center justify-between pb-3.5 border-b border-botanical-stone">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-botanical-forest text-xl">calendar_month</span>
                  <h3 className="text-base font-serif font-bold text-botanical-forest">Lịch Trình Sắp Tới</h3>
                </div>
                <span className="text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30">2 Sự Kiện</span>
              </div>
              <div className="mt-4 space-y-3.5">
                {/* Event Item 1 */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone hover:border-botanical-sage/50 transition-all space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-botanical-terracotta font-serif font-bold">14:00 - Thứ Tư (15/04)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta font-bold">Sau 2 ngày</span>
                  </div>
                  <h4 className="text-xs font-serif font-bold text-botanical-forest">Phỏng vấn Kỹ thuật FPT Software</h4>
                  <p className="text-[11px] text-botanical-forest/70 font-sans">Google Meet • 60 phút (System Architecture)</p>
                  <div className="pt-2 border-t border-botanical-stone flex items-center justify-between">
                    <span className="text-[11px] text-botanical-sage font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">videocam</span> Sẵn sàng link họp
                    </span>
                    <button 
                      onClick={() => handleOpenInvitationModal(DEFAULT_APPLICATIONS[0])}
                      className="text-xs text-botanical-forest font-bold hover:underline cursor-pointer"
                    >
                      Vào sớm
                    </button>
                  </div>
                </div>

                {/* Event Item 2 */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone hover:border-botanical-sage/50 transition-all space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-botanical-forest font-serif font-bold">23:59 - Thứ Ba (14/04)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-botanical-cream text-botanical-forest border border-botanical-stone">Ngày mai</span>
                  </div>
                  <h4 className="text-xs font-serif font-bold text-botanical-forest">Hạn chót AI Mock Assessment (VNG)</h4>
                  <p className="text-[11px] text-botanical-forest/70 font-sans">Voice Assessment 15 câu hỏi trắc nghiệm &amp; tình huống</p>
                  <div className="pt-2 border-t border-botanical-stone">
                    <a 
                      href="#/ai-interview?jobId=102" 
                      className="block text-center text-xs text-botanical-terracotta font-bold hover:underline"
                    >
                      Làm bài ngay →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* SIDEBAR BLOCK 2: AI INTERVIEW MENTOR RADAR */}
            <div className="card-botanical bg-white/95 rounded-3xl p-6 border border-botanical-stone shadow-soft relative overflow-hidden">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-botanical-stone">
                <span className="material-symbols-outlined text-botanical-sage text-xl">smart_toy</span>
                <h3 className="text-base font-serif font-bold text-botanical-forest">AI Mentor Đề Xuất Ôn Tập</h3>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-xs text-botanical-forest/70 leading-relaxed font-sans">
                  Dựa trên vị trí <strong className="text-botanical-forest">Senior Backend FPT Software</strong> sắp phỏng vấn, nhà tuyển dụng sẽ xoay quanh 2 trọng điểm:
                </p>
                {/* Focus areas */}
                <div className="space-y-2 font-sans">
                  <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-botanical-stone flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-botanical-sage mt-0.5">schema</span>
                    <div>
                      <div className="text-xs font-serif font-bold text-botanical-forest">Distributed Transactions (Saga / 2PC)</div>
                      <div className="text-[11px] text-botanical-forest/70 mt-0.5">Xử lý consistency trong Microservices Fintech.</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-botanical-stone flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-botanical-sage mt-0.5">reorder</span>
                    <div>
                      <div className="text-xs font-serif font-bold text-botanical-forest">Apache Kafka High-Throughput</div>
                      <div className="text-[11px] text-botanical-forest/70 mt-0.5">Tối ưu Partitioning, Consumer Group Lag và Idempotency.</div>
                    </div>
                  </div>
                </div>
                {/* Copilot CTA */}
                <div className="pt-2">
                  <a 
                    href="#/ai-interview?jobId=101"
                    className="btn-botanical-secondary w-full !py-2.5 !text-xs !rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-soft"
                  >
                    <span className="material-symbols-outlined text-sm">chat_bubble</span>
                    Thực Hành Mock Phỏng Vấn Với AI (15p)
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Offer Detail & Sign Modal */}
      {activeModal === 'OFFER' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-botanical-forest/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-botanical-stone rounded-3xl p-6 sm:p-8 shadow-soft-xl text-botanical-forest">
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 hover:bg-white border border-botanical-stone text-botanical-forest/60 hover:text-botanical-forest flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-2xl bg-botanical-sage/20 border border-botanical-stone flex items-center justify-center text-botanical-forest font-serif font-bold text-sm shadow-soft">
                {modalData.companyShort}
              </span>
              <div>
                <h3 className="font-serif font-bold text-xl text-botanical-forest">Thư Mời Nhận Việc (Official Offer Letter)</h3>
                <p className="text-xs text-botanical-terracotta font-medium">{modalData.company} • {modalData.title}</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-white border border-botanical-stone space-y-3 text-xs shadow-soft">
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Mức lương cơ bản:</span>
                <span className="text-botanical-terracotta font-serif font-bold text-base">{modalData.offerDetails?.baseSalary}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Gói thưởng gia nhập (Sign-on):</span>
                <span className="text-botanical-forest font-semibold">{modalData.offerDetails?.signOnBonus}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Cổ phần ESOP:</span>
                <span className="text-botanical-forest font-semibold">{modalData.offerDetails?.shares}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-botanical-forest/70">Hạn chót phản hồi:</span>
                <span className="text-botanical-terracotta font-bold">{modalData.offerDetails?.deadline}</span>
              </div>
            </div>

            <p className="text-xs text-botanical-forest/80 italic mb-6 font-serif">
              "MoMo rất vinh hạnh được chào đón bạn gia nhập đội ngũ Core Distributed Systems nhằm nâng tầm trải nghiệm tài chính số cho hàng chục triệu người dùng."
            </p>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button 
                onClick={() => setActiveModal(null)} 
                className="btn-botanical-secondary !text-xs !py-2.5 !px-5 cursor-pointer"
              >
                Đóng
              </button>
              <button 
                onClick={handleSignOffer}
                disabled={offerSigned}
                className="btn-botanical-primary !text-xs !py-2.5 !px-6 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">edit_document</span>
                <span>{offerSigned ? 'Đã Ký Chấp Thuận' : 'Ký Số & Xác Nhận Nhận Việc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interview Invitation Modal */}
      {activeModal === 'INVITATION' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-botanical-forest/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-botanical-stone rounded-3xl p-6 sm:p-8 shadow-soft-xl text-botanical-forest">
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 hover:bg-white border border-botanical-stone text-botanical-forest/60 hover:text-botanical-forest flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-2xl bg-botanical-sage/20 border border-botanical-stone flex items-center justify-center text-botanical-forest font-serif font-bold text-sm shadow-soft">
                {modalData.companyShort}
              </span>
              <div>
                <h3 className="font-serif font-bold text-xl text-botanical-forest">Thư Mời Phỏng Vấn Kỹ Thuật</h3>
                <p className="text-xs text-botanical-terracotta font-medium">{modalData.company} • Vòng 3</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-white border border-botanical-stone space-y-3 text-xs shadow-soft">
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Thời gian:</span>
                <span className="text-botanical-forest font-bold">14:00 - 15:00 (Thứ Tư, 15/04/2026)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Hình thức:</span>
                <span className="text-botanical-sage font-semibold">Google Meet Video Call</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Ban phỏng vấn:</span>
                <span className="text-botanical-forest">Tech Lead &amp; Principal Solution Architect</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-botanical-forest/70">Đường dẫn cuộc họp:</span>
                <span className="text-botanical-terracotta font-mono font-medium">meet.google.com/hmt-fpt-9428</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <a 
                href="#/ai-interview?jobId=101"
                className="btn-botanical-secondary !text-xs !py-2.5 !px-5 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-botanical-sage">smart_toy</span>
                Luyện Thử Với AI
              </a>
              <a 
                href="https://meet.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="btn-botanical-primary !text-xs !py-2.5 !px-6 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">videocam</span>
                <span>Vào Google Meet</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. Direct Recruiter Chat Modal */}
      {activeModal === 'CHAT' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-botanical-forest/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-botanical-stone rounded-3xl p-6 shadow-soft-xl flex flex-col h-[520px] text-botanical-forest">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-4 border-b border-botanical-stone">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-botanical-sage/20 border border-botanical-stone flex items-center justify-center text-botanical-forest font-serif font-bold text-sm shadow-soft">
                    {modalData.recruiterName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-botanical-forest">{modalData.recruiterName}</h3>
                  <p className="text-[11px] text-botanical-terracotta font-medium">{modalData.company} • Trực tuyến</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="w-8 h-8 rounded-full bg-white/60 hover:bg-white border border-botanical-stone text-botanical-forest/60 hover:text-botanical-forest flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs font-sans">
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3.5 rounded-2xl shadow-soft leading-relaxed ${
                      msg.sender === 'me'
                        ? 'bg-botanical-forest text-white rounded-br-none'
                        : 'bg-white border border-botanical-stone text-botanical-forest rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-botanical-stone flex items-center gap-2">
              <input 
                type="text" 
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                placeholder="Nhập tin nhắn phản hồi..."
                className="flex-1 bg-white border border-botanical-stone rounded-full px-4 py-2.5 text-xs text-botanical-forest placeholder:text-botanical-forest/40 focus:outline-none focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 transition-all font-sans"
              />
              <button 
                type="submit"
                className="btn-botanical-primary !p-2.5 !rounded-full flex items-center justify-center cursor-pointer shrink-0"
                title="Gửi tin nhắn"
              >
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
