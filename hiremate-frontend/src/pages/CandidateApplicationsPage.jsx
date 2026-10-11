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
    <div className="w-full bg-transparent font-sans text-slate-800 min-h-screen pb-16 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-white border border-purple-100 text-[#1e1b4b] text-xs shadow-xl flex items-center gap-2.5 animate-bounce">
          <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========================================================= */}
        {/* 1. HEADER & KPI QUICK METRICS                             */}
        {/* ========================================================= */}
        <section className="flex flex-col gap-6 font-sans">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping"></span>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-[#5b48bd] text-xs font-bold font-mono border border-purple-200 uppercase tracking-wider">
                  ACTIVE PIPELINE TRACKER
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e1b4b] tracking-tight">
                Đơn Ứng Tuyển Của Tôi
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
                Theo dõi tiến độ, lịch phỏng vấn và trạng thái phản hồi từ nhà tuyển dụng theo thời gian thực.
              </p>
            </div>

            {/* Quick Summary Action */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-white border border-purple-100 text-xs font-semibold text-slate-600 flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">sync</span>
                Cập nhật tự động: <strong className="text-[#1e1b4b] font-bold">10 phút trước</strong>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards (4 Cards Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
            {/* Card 1 */}
            <div 
              onClick={() => setActiveFilter('ALL')}
              className={`bg-white p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${
                activeFilter === 'ALL' ? 'border-[#5b48bd] ring-2 ring-purple-200' : 'border-purple-100 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Tổng Đơn Nộp</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">folder_open</span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#1e1b4b] font-mono tracking-tight">14</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5b48bd]">Đang hoạt động</span>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => setActiveFilter('APPLIED')}
              className={`bg-amber-50/40 p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${
                activeFilter === 'APPLIED' ? 'border-amber-400 ring-2 ring-amber-200' : 'border-amber-200/80 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
                <span>Đang Xét Duyệt</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">hourglass_top</span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-900 font-mono tracking-tight">5</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Chờ phản hồi</span>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => setActiveFilter('INTERVIEW')}
              className={`bg-emerald-50/40 p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${
                activeFilter === 'INTERVIEW' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-200/80 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span>Vòng Phỏng Vấn</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">videocam</span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-900 font-mono tracking-tight">4</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">2 lịch sắp diễn ra</span>
              </div>
            </div>

            {/* Card 4 */}
            <div 
              onClick={() => setActiveFilter('OFFER')}
              className={`bg-purple-50/40 p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${
                activeFilter === 'OFFER' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-purple-200/80 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 uppercase tracking-wider">
                <span>Đề Nghị Nhận Việc</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#1e1b4b] font-mono tracking-tight">2</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">Sẵn sàng ký</span>
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
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-purple-50/50 border border-purple-100 rounded-full text-[#1e1b4b] font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#5b48bd] transition-all font-sans" 
              placeholder="Tìm theo công ty, vị trí ứng tuyển..." 
              type="text"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Status Tabs (Segmented) */}
            <div className="flex items-center p-1 rounded-full bg-purple-50/60 border border-purple-100 overflow-x-auto text-xs font-sans">
              {[
                { id: 'ALL', label: 'Tất cả (14)' },
                { id: 'APPLIED', label: 'Chờ duyệt (5)' },
                { id: 'INTERVIEW', label: 'Phỏng vấn (4)' },
                { id: 'OFFER', label: 'Đã nhận Offer (2)' },
                { id: 'REJECTED', label: 'Từ chối (3)' },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-[#5b48bd] text-white shadow-md'
                      : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 text-xs font-sans font-bold bg-white border border-purple-100 rounded-full text-[#1e1b4b] focus:outline-none focus:border-[#5b48bd] cursor-pointer shadow-xs"
              >
                <option value="RECENT">Gần đây nhất</option>
                <option value="ACTION">Cần hành động ngay</option>
                <option value="MATCH">AI Match: Cao nhất</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[#1e1b4b]">expand_more</span>
            </div>

            {/* View Toggle (List vs Kanban) */}
            <div className="flex items-center rounded-full bg-purple-50/60 border border-purple-100 p-1 shadow-xs">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#5b48bd] text-white font-bold shadow-xs' : 'text-slate-400 hover:text-[#5b48bd]'
                }`}
                title="Chế độ Danh sách"
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-[#5b48bd] text-white font-bold shadow-xs' : 'text-slate-400 hover:text-[#5b48bd]'
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          {/* LEFT / CENTER: APPLICATIONS LIST (8 Columns) */}
          <main className="lg:col-span-8 flex flex-col gap-5">
            {viewMode === 'kanban' ? (
              /* KANBAN BOARD VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Column 1: Đã nộp */}
                <div className="bg-white border border-purple-100 rounded-3xl p-4 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="text-xs font-bold text-[#1e1b4b]">1. Đã Nộp Hồ Sơ</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] font-bold border border-purple-100">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-[#1e1b4b]">Techcombank Digital</div>
                    <div className="text-[11px] text-slate-500 font-medium">Core Banking Architect</div>
                    <div className="text-[10px] font-bold text-[#5b48bd]">88% AI Match</div>
                  </div>
                </div>

                {/* Column 2: Sàng lọc CV */}
                <div className="bg-white border border-purple-100 rounded-3xl p-4 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="text-xs font-bold text-[#1e1b4b]">2. Duyệt CV</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50/30 border border-amber-200 space-y-2 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-[#1e1b4b]">VNG Games Studio</div>
                    <div className="text-[11px] text-slate-500 font-medium">Lead Game Backend</div>
                    <div className="text-[10px] text-amber-700 font-bold">Cần làm Voice Test</div>
                  </div>
                </div>

                {/* Column 3: Phỏng vấn */}
                <div className="bg-white border border-purple-100 rounded-3xl p-4 flex flex-col gap-3 shadow-md ring-2 ring-emerald-200">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="text-xs font-bold text-emerald-800">3. Phỏng Vấn</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/30 border border-emerald-200 space-y-2 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-[#1e1b4b]">FPT Software</div>
                    <div className="text-[11px] text-slate-500 font-medium">Senior Backend Java</div>
                    <div className="text-[10px] text-emerald-700 font-bold">15/04 • 14:00 Meet</div>
                    <a href="#/ai-interview?jobId=101" className="block text-center text-[10px] py-1.5 px-3 rounded-full bg-[#5b48bd] text-white font-bold mt-1 shadow-xs hover:bg-[#4a39a8]">
                      Ôn luyện ngay
                    </a>
                  </div>
                </div>

                {/* Column 4: Đã nhận Offer */}
                <div className="bg-white border border-purple-100 rounded-3xl p-4 flex flex-col gap-3 shadow-md ring-2 ring-purple-200">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="text-xs font-bold text-[#5b48bd]">4. Nhận Offer</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5b48bd] font-bold">1</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-[#1e1b4b]">MoMo Payment</div>
                    <div className="text-[11px] text-slate-500 font-medium">Senior Distributed Systems</div>
                    <div className="text-[10px] text-[#10b981] font-mono font-extrabold">$3,200/tháng</div>
                    <button 
                      onClick={() => handleOpenOfferModal(DEFAULT_APPLICATIONS[1])}
                      className="w-full text-center text-[10px] py-1.5 rounded-full bg-[#10b981] text-white font-bold cursor-pointer mt-1 shadow-xs hover:bg-[#059669]"
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
                    <div key={app.id} className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300 space-y-5">
                      {/* Top Row: Company Info & AI Match */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-[#5b48bd] text-white flex items-center justify-center font-extrabold text-lg shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                            title="Xem chi tiết đơn tuyển dụng FPT"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 
                                onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                                className="text-lg font-bold text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer"
                              >
                                {app.company}
                              </h3>
                              <span className="text-xs text-slate-400 font-medium">• {app.division}</span>
                            </div>
                            <h4 className="text-sm font-bold text-[#f97316] mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium mt-1.5">
                              <span className="flex items-center gap-1 font-bold text-[#1e1b4b]">
                                <span className="material-symbols-outlined text-sm text-[#10b981]">payments</span>
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
                        <div className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-extrabold text-xs shadow-xs">
                          <span className="material-symbols-outlined text-sm text-[#10b981]">bolt</span>
                          {app.aiMatch}% AI Match
                        </div>
                      </div>

                      {/* CV Used & Metadata bar */}
                      <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-[#5b48bd]">description</span>
                          <span>CV: <strong className="text-[#1e1b4b] font-bold">{app.cvUsed}</strong></span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] font-bold border border-purple-100">ATS {app.atsScore}/100</span>
                        </div>
                        <span className="text-[11px] text-[#f97316] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse"></span>
                          {app.responseNotice}
                        </span>
                      </div>

                      {/* STEPPER PIPELINE TRACKER */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/40 border border-purple-100 shadow-xs">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e1b4b] mb-3.5 flex items-center gap-2">
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
                            <div className="text-xs font-extrabold text-[#1e1b4b]">1. Đã Nộp</div>
                            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">10/04/2026</div>
                          </div>

                          {/* Step 2 (Done) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-[#32247b] text-white flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
                                <span className="material-symbols-outlined text-sm font-extrabold">check</span>
                              </div>
                              <div className="flex-1 h-1 bg-[#f97316] mx-1 rounded-full"></div>
                            </div>
                            <div className="text-xs font-extrabold text-[#1e1b4b]">2. Duyệt CV</div>
                            <div className="text-[11px] text-[#10b981] font-bold mt-0.5">Đạt 94%</div>
                          </div>

                          {/* Step 3 (Active) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-[#f97316] text-white flex items-center justify-center text-xs font-extrabold shadow-md ring-4 ring-orange-500/20 animate-pulse shrink-0">
                                3
                              </div>
                              <div className="flex-1 h-1 bg-purple-100 mx-1 rounded-full"></div>
                            </div>
                            <div className="text-xs font-extrabold text-[#f97316]">3. Phỏng Vấn Tech</div>
                            <div className="text-[11px] text-[#1e1b4b] font-bold mt-0.5">15/04 • 14:00</div>
                          </div>

                          {/* Step 4 (Pending) */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-full flex items-center mb-2">
                              <div className="w-7 h-7 rounded-full bg-purple-50 text-slate-400 flex items-center justify-center text-xs font-extrabold border border-purple-100 shrink-0">
                                4
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500">4. Nhận Offer</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Chờ kết quả</div>
                          </div>
                        </div>
                      </div>

                      {/* Highlight Next Action Callout */}
                      <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-3.5">
                        <span className="material-symbols-outlined text-[#5b48bd] text-xl mt-0.5">event_upcoming</span>
                        <div className="text-xs">
                          <span className="font-bold text-[#1e1b4b]">Lịch phỏng vấn kỹ thuật trực tuyến:</span>
                          <span className="text-[#f97316] font-bold ml-1.5">14:00 - Thứ Tư, 15/04/2026</span>
                          <span className="text-slate-600 block mt-0.5">Hình thức: Trực tuyến qua Google Meet (Người phỏng vấn: Tech Lead &amp; Solution Architect).</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a 
                          href="#/ai-interview?jobId=101" 
                          className="px-5 py-2.5 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">smart_toy</span>
                          Vào Phòng Phỏng Vấn AI Ôn Luyện
                        </a>
                        <button 
                          onClick={() => handleOpenChatModal('Minh Anh', 'FPT Software')}
                          className="px-4 py-2.5 bg-white border border-purple-200 text-[#5b48bd] hover:bg-purple-50 text-xs font-bold rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-[#5b48bd]">chat</span>
                          Nhắn Recruiter Minh Anh
                        </button>
                        <button 
                          onClick={() => handleOpenInvitationModal(app)}
                          className="px-4 py-2.5 bg-purple-50 border border-purple-200 text-[#32247b] hover:bg-purple-100 text-xs font-bold rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">mark_email_read</span>
                          Xem Thư Mời
                        </button>
                      </div>
                    </div>
                  );
                }

                if (app.id === 2) {
                  /* CARD 2: MOMO (OFFER RECEIVED) */
                  return (
                    <div key={app.id} className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-[#10b981] text-white flex items-center justify-center font-extrabold text-lg shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 
                                onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                                className="text-lg font-bold text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer"
                              >
                                {app.company}
                              </h3>
                              <span className="text-xs text-emerald-800 font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">Vòng 4/4: Thành công</span>
                            </div>
                            <h4 className="text-sm font-bold text-[#1e1b4b] mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium mt-1.5">
                              <span className="flex items-center gap-1 text-[#10b981] font-mono font-extrabold">
                                <span className="material-symbols-outlined text-sm">monetization_on</span>
                                {app.salary}
                              </span>
                              <span>•</span>
                              <span>{app.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Offer Status Badge */}
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs shadow-xs">
                          🎉 {app.statusLabel}
                        </div>
                      </div>

                      {/* Progress Mini Tracker (4/4 Completed) */}
                      <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                          <span>Tiến trình hoàn tất: <strong className="text-[#1e1b4b] font-bold">{app.progress}</strong></span>
                          <span className="text-[#10b981] font-bold">{app.progressNote}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#10b981] w-full rounded-full"></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button 
                          onClick={() => handleOpenOfferModal(app)}
                          className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                          Xem Chi Tiết Offer &amp; Ký
                        </button>
                        <button 
                          onClick={() => handleOpenChatModal('Thảo Vy', 'MoMo Payment')}
                          className="px-4 py-2.5 bg-white border border-purple-200 text-[#5b48bd] hover:bg-purple-50 text-xs font-bold rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-[#5b48bd]">forum</span>
                          Trao đổi với HR MoMo
                        </button>
                      </div>
                    </div>
                  );
                }

                if (app.id === 3) {
                  /* CARD 3: VNG GAMES STUDIO (AI ASSESSMENT REQUIRED) */
                  return (
                    <div key={app.id} className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-[#f97316] text-white flex items-center justify-center font-extrabold text-lg shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 
                                onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                                className="text-lg font-bold text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer"
                              >
                                {app.company}
                              </h3>
                              <span className="text-xs text-slate-400 font-medium">• {app.division}</span>
                            </div>
                            <h4 className="text-sm font-bold text-[#1e1b4b] mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium mt-1.5">
                              <span className="font-bold text-[#1e1b4b]">
                                {app.salary}
                              </span>
                              <span>•</span>
                              <span>{app.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI Match */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-extrabold text-xs border border-emerald-200 shadow-xs">
                          <span className="material-symbols-outlined text-sm text-[#10b981]">auto_awesome</span>
                          {app.aiMatch}% AI Match
                        </div>
                      </div>

                      {/* Pending Task Alert */}
                      <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-amber-700 text-lg">mic</span>
                          <span className="text-amber-900 font-bold">{app.pendingAlert.text}</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider shrink-0 bg-amber-100 px-2.5 py-0.5 rounded-full">{app.pendingAlert.badge}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a 
                          href="#/ai-interview?jobId=102"
                          className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">play_circle</span>
                          Bắt Đầu Làm AI Assessment
                        </a>
                        <a 
                          href="#/jobs/102"
                          className="px-4 py-2.5 bg-white border border-purple-200 text-[#5b48bd] hover:bg-purple-50 text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer"
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
                    <div key={app.id} className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div 
                            onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                            className="w-14 h-14 rounded-2xl bg-[#06b6d4] text-white flex items-center justify-center font-extrabold text-lg shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            {app.companyShort}
                          </div>
                          <div>
                            <h3 
                              onClick={() => window.location.hash = `#/jobs/${app.jobId}`}
                              className="text-lg font-bold text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer"
                            >
                              {app.company}
                            </h3>
                            <h4 className="text-sm font-bold text-[#1e1b4b] mt-0.5">{app.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium mt-1.5">
                              <span>{app.location}</span>
                              <span>•</span>
                              <span>Nộp ngày {app.appliedDate} (2 ngày trước)</span>
                            </div>
                          </div>
                        </div>

                        {/* AI Match */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-[#5b48bd] font-mono font-bold text-xs border border-purple-100">
                          {app.aiMatch}% AI Match
                        </div>
                      </div>

                      {/* Under Review status indicator */}
                      <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                        <span className="material-symbols-outlined text-base text-[#5b48bd]">schedule</span>
                        <span>{app.reviewNotice}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button 
                          onClick={() => showToast('Đã gửi thông báo nhắc nhở đến bộ phận HR Techcombank.')}
                          className="px-4 py-2.5 bg-white border border-purple-200 text-[#5b48bd] hover:bg-purple-50 text-xs font-bold rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">notifications_active</span>
                          Nhắc nhở cập nhật
                        </button>
                        <a 
                          href="#/jobs/106"
                          className="px-4 py-2.5 bg-purple-50 text-[#5b48bd] border border-purple-100 hover:bg-purple-100 text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer"
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
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-purple-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#5b48bd] text-xl">calendar_month</span>
                  <h3 className="text-base font-bold text-[#1e1b4b]">Lịch Trình Sắp Tới</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-100">2 Sự Kiện</span>
              </div>
              <div className="space-y-3.5">
                {/* Event Item 1 */}
                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-200 transition-all space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#f97316] font-bold">14:00 - Thứ Tư (15/04)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Sau 2 ngày</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1e1b4b]">Phỏng vấn Kỹ thuật FPT Software</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Google Meet • 60 phút (System Architecture)</p>
                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-[11px] text-[#10b981] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">videocam</span> Sẵn sàng link họp
                    </span>
                    <button 
                      onClick={() => handleOpenInvitationModal(DEFAULT_APPLICATIONS[0])}
                      className="px-3 py-1 bg-[#5b48bd] text-white text-xs font-bold rounded-full hover:bg-[#4a39a8] cursor-pointer shadow-xs"
                    >
                      Vào sớm
                    </button>
                  </div>
                </div>

                {/* Event Item 2 */}
                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-200 transition-all space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1e1b4b] font-bold">23:59 - Thứ Ba (14/04)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-[#5b48bd] font-bold">Ngày mai</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1e1b4b]">Hạn chót AI Mock Assessment (VNG)</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Voice Assessment 15 câu hỏi trắc nghiệm &amp; tình huống</p>
                  <div className="pt-2 border-t border-purple-100">
                    <a 
                      href="#/ai-interview?jobId=102" 
                      className="block text-center text-xs text-[#f97316] font-bold hover:underline"
                    >
                      Làm bài ngay →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* SIDEBAR BLOCK 2: AI INTERVIEW MENTOR RADAR */}
            <div className="bg-gradient-to-br from-[#32247b] to-[#5b48bd] text-white rounded-3xl p-6 shadow-lg relative overflow-hidden space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/20">
                <span className="material-symbols-outlined text-emerald-400 text-xl">smart_toy</span>
                <h3 className="text-base font-bold">AI Mentor Đề Xuất Ôn Tập</h3>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-purple-100 leading-relaxed">
                  Dựa trên vị trí <strong className="text-white font-bold">Senior Backend FPT Software</strong> sắp phỏng vấn, nhà tuyển dụng sẽ xoay quanh 2 trọng điểm:
                </p>
                {/* Focus areas */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-emerald-400 mt-0.5">schema</span>
                    <div>
                      <div className="font-bold text-white">Distributed Transactions (Saga / 2PC)</div>
                      <div className="text-[11px] text-purple-200 mt-0.5">Xử lý consistency trong Microservices Fintech.</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-emerald-400 mt-0.5">reorder</span>
                    <div>
                      <div className="font-bold text-white">Apache Kafka High-Throughput</div>
                      <div className="text-[11px] text-purple-200 mt-0.5">Tối ưu Partitioning, Consumer Group Lag và Idempotency.</div>
                    </div>
                  </div>
                </div>
                {/* Copilot CTA */}
                <div className="pt-2">
                  <a 
                    href="#/ai-interview?jobId=101"
                    className="w-full py-2.5 px-4 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined text-base">chat_bubble</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#1e1b4b]">
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3.5 mb-2">
              <span className="w-12 h-12 rounded-2xl bg-[#10b981] text-white font-extrabold text-base flex items-center justify-center shadow-md">
                {modalData.companyShort}
              </span>
              <div>
                <h3 className="font-bold text-xl text-[#1e1b4b]">Thư Mời Nhận Việc (Official Offer Letter)</h3>
                <p className="text-xs text-[#5b48bd] font-bold">{modalData.company} • {modalData.title}</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Mức lương cơ bản:</span>
                <span className="text-[#10b981] font-mono font-extrabold text-base">{modalData.offerDetails?.baseSalary}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Gói thưởng gia nhập (Sign-on):</span>
                <span className="text-[#1e1b4b] font-bold">{modalData.offerDetails?.signOnBonus}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Cổ phần ESOP:</span>
                <span className="text-[#1e1b4b] font-bold">{modalData.offerDetails?.shares}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Hạn chót phản hồi:</span>
                <span className="text-[#f97316] font-bold">{modalData.offerDetails?.deadline}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 italic mb-6">
              "MoMo rất vinh hạnh được chào đón bạn gia nhập đội ngũ Core Distributed Systems nhằm nâng tầm trải nghiệm tài chính số cho hàng chục triệu người dùng."
            </p>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full cursor-pointer hover:bg-slate-200"
              >
                Đóng
              </button>
              <button 
                onClick={handleSignOffer}
                disabled={offerSigned}
                className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">edit_document</span>
                <span>{offerSigned ? 'Đã Ký Chấp Thuận' : 'Ký Số & Xác Nhận Nhận Việc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interview Invitation Modal */}
      {activeModal === 'INVITATION' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#1e1b4b]">
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3.5 mb-2">
              <span className="w-12 h-12 rounded-2xl bg-[#5b48bd] text-white font-extrabold text-base flex items-center justify-center shadow-md">
                {modalData.companyShort}
              </span>
              <div>
                <h3 className="font-bold text-xl text-[#1e1b4b]">Thư Mời Phỏng Vấn Kỹ Thuật</h3>
                <p className="text-xs text-[#5b48bd] font-bold">{modalData.company} • Vòng 3</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Thời gian:</span>
                <span className="text-[#f97316] font-bold">14:00 - 15:00 (Thứ Tư, 15/04/2026)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Hình thức:</span>
                <span className="text-[#10b981] font-bold">Google Meet Video Call</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Ban phỏng vấn:</span>
                <span className="text-[#1e1b4b] font-bold">Tech Lead &amp; Principal Solution Architect</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Đường dẫn cuộc họp:</span>
                <span className="text-[#5b48bd] font-mono font-bold">meet.google.com/hmt-fpt-9428</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <a 
                href="#/ai-interview?jobId=101"
                className="px-5 py-2.5 bg-purple-50 text-[#5b48bd] hover:bg-purple-100 text-xs font-bold rounded-full border border-purple-200 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">smart_toy</span>
                Luyện Thử Với AI
              </a>
              <a 
                href="https://meet.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-2.5 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">videocam</span>
                <span>Vào Google Meet</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. Direct Recruiter Chat Modal */}
      {activeModal === 'CHAT' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-purple-100 rounded-3xl p-6 shadow-2xl flex flex-col h-[520px] text-[#1e1b4b]">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#5b48bd] text-white font-bold text-sm flex items-center justify-center shadow-md">
                    {modalData.recruiterName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1e1b4b]">{modalData.recruiterName}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{modalData.company} • Trực tuyến</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
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
                    className={`max-w-[80%] p-3.5 rounded-2xl shadow-xs leading-relaxed ${
                      msg.sender === 'me'
                        ? 'bg-[#5b48bd] text-white rounded-br-none'
                        : 'bg-purple-50/60 border border-purple-100 text-[#1e1b4b] rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-purple-100 flex items-center gap-2">
              <input 
                type="text" 
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                placeholder="Nhập tin nhắn phản hồi..."
                className="flex-1 bg-purple-50/40 border border-purple-100 rounded-full px-4 py-2.5 text-xs text-[#1e1b4b] placeholder:text-slate-400 focus:outline-none focus:border-[#5b48bd] transition-all font-sans"
              />
              <button 
                type="submit"
                className="p-2.5 rounded-full bg-[#5b48bd] hover:bg-[#4a39a8] text-white flex items-center justify-center cursor-pointer shrink-0 shadow-md"
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
