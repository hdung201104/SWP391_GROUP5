import React, { useState, useEffect } from 'react';
import { applicationApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';

export default function CandidateApplicationsPage({ user }) {
  const { theme: livingTheme } = useLivingTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    applicationApi.getMyApplications()
      .then(res => {
        const rawList = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map((app, idx) => {
            const comp = app.job?.company?.companyName || app.companyName || 'Doanh Nghiệp Tuyển Dụng';
            const compShort = comp.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CORP';
            const st = app.status || 'APPLIED';
            const step = st === 'OFFER' ? 4 : st === 'INTERVIEW' ? 3 : st === 'SCREENING' ? 2 : 1;
            const appliedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Mới nộp';
            const matchScore = app.matchingScore != null ? Math.round(app.matchingScore) : 92;

            return {
              id: app.applicationId || idx + 1,
              company: comp,
              companyShort: compShort,
              division: app.job?.company?.industry ? `// ${app.job.company.industry}` : '// Tuyển Dụng Trực Tuyến',
              title: app.job?.title || app.jobTitle || 'Vị trí Ứng Tuyển',
              salary: (app.job?.salaryMin && app.job?.salaryMax) ? `$${app.job.salaryMin} - $${app.job.salaryMax}/tháng` : 'Theo thỏa thuận',
              location: app.job?.location || 'Việt Nam',
              appliedDate,
              aiMatch: matchScore,
              cvUsed: app.cv?.fileName || (app.cvUrl ? app.cvUrl.split('/').pop() : 'CV_Ung_Vien.pdf'),
              atsScore: matchScore >= 80 ? matchScore : 88,
              responseNotice: st === 'OFFER' ? 'Đã Nhận Offer Trúng Tuyển' : st === 'INTERVIEW' ? 'Đã Vào Vòng Phỏng Vấn' : 'Đang xử lý hồ sơ',
              status: st,
              statusLabel: st === 'OFFER' ? 'Đã Nhận Offer' : st === 'INTERVIEW' ? 'Vòng Phỏng Vấn' : st === 'SCREENING' ? 'Đang Duyệt CV' : st === 'REJECTED' ? 'Chưa Phù Hợp' : 'Đã Nộp Hồ Sơ',
              themeColor: st === 'OFFER' ? 'secondary' : 'primary',
              currentStep: step,
              steps: [
                { step: 1, title: '1. Đã Nộp', date: appliedDate, status: 'completed' },
                { step: 2, title: '2. Duyệt CV', date: `Đạt ${matchScore}%`, status: step >= 2 ? 'completed' : 'active' },
                { step: 3, title: '3. Phỏng Vấn', date: 'Vòng Đánh Giá', status: step >= 3 ? (step === 3 ? 'active' : 'completed') : 'pending' },
                { step: 4, title: '4. Nhận Offer', date: 'Kết quả', status: step === 4 ? 'completed' : 'pending' },
              ],
              recruiter: {
                name: app.job?.recruiter?.user?.fullName || 'Bộ Phận Tuyển Dụng',
                role: app.job?.recruiter?.position || 'Talent Acquisition Team',
              },
              jobId: app.job?.jobId || app.jobId,
            };
          });
          setApplications(mapped);
        } else {
          setApplications([]);
        }
      })
      .catch((err) => {
        console.warn('Could not load applications from Supabase backend:', err);
        setApplications([]);
      })
      .finally(() => {
        setLoading(false);
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
      { sender: 'recruiter', text: `Chào bạn! Tôi là ${recruiterName} từ ${company}. Rất vui được trao đổi về hồ sơ ứng tuyển của bạn.` }
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
        { sender: 'recruiter', text: 'Cảm ơn phản hồi của bạn! Bộ phận tuyển dụng đã ghi nhận và sẽ phản hồi sớm nhất.' }
      ]);
    }, 1000);
  };

  const handleSignOffer = () => {
    setOfferSigned(true);
    showToast('🎉 Bạn đã ký chấp thuận lời mời nhận việc thành công!');
    setTimeout(() => {
      setActiveModal(null);
      setOfferSigned(false);
    }, 1800);
  };

  // Filter & Search Logic
  const filteredApps = applications.filter(app => {
    const matchesFilter = activeFilter === 'ALL' || app.status === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      app.company.toLowerCase().includes(q) || 
      app.title.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'MATCH') return b.aiMatch - a.aiMatch;
    if (sortBy === 'ACTION') {
      const priority = { OFFER: 4, INTERVIEW: 3, SCREENING: 2, APPLIED: 1, REJECTED: 0 };
      return (priority[b.status] || 0) - (priority[a.status] || 0);
    }
    return b.id - a.id;
  });

  return (
    <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-botanical-forest text-white text-xs font-semibold shadow-soft-xl flex items-center gap-2.5 animate-bounce border border-botanical-sage/30">
          <span className="material-symbols-outlined text-sm text-botanical-terracotta">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

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
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-botanical-forest tracking-tight">
              Đơn Tuyển Dụng Đã Nộp
            </h1>
            <p className="text-xs sm:text-sm text-botanical-forest/75 mt-1 font-sans">
              Theo dõi tiến trình xét duyệt hồ sơ và lịch phỏng vấn kết nối trực tiếp với nhà tuyển dụng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="#/ai-interview" 
              className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 shadow-soft cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-sm text-botanical-sage">psychology</span>
              Luyện Phỏng Vấn AI
            </a>
            <a 
              href="#/" 
              className="btn-botanical-primary !text-xs !py-2.5 !px-5 flex items-center gap-2 shadow-soft cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Tìm Thêm Việc Làm
            </a>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div 
            onClick={() => setActiveFilter('ALL')}
            className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
              activeFilter === 'ALL' ? 'bg-white border-botanical-sage ring-1 ring-botanical-sage/50' : 'bg-white/90 border-botanical-stone hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-botanical-forest/70 uppercase tracking-wider">Tổng Đơn Nộp</span>
              <span className="material-symbols-outlined text-lg text-botanical-sage">layers</span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-botanical-forest">{applications.length}</span>
              <span className="text-[11px] font-medium text-botanical-forest/70">hồ sơ</span>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => setActiveFilter('SCREENING')}
            className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
              activeFilter === 'SCREENING' ? 'bg-white border-botanical-sage ring-1 ring-botanical-sage/50' : 'bg-white/90 border-botanical-stone hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-botanical-forest/70 uppercase tracking-wider">Đang Duyệt CV</span>
              <span className="material-symbols-outlined text-lg text-botanical-sage">pending_actions</span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-botanical-forest">
                {applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING').length}
              </span>
              <span className="text-[11px] font-medium text-botanical-forest/70">đang xử lý</span>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => setActiveFilter('INTERVIEW')}
            className={`card-botanical p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-soft hover:scale-[1.01] ${
              activeFilter === 'INTERVIEW' ? 'bg-white border-botanical-sage ring-1 ring-botanical-sage/50' : 'bg-white/90 border-botanical-stone hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-botanical-terracotta uppercase tracking-wider">Vòng Phỏng Vấn</span>
              <span className="material-symbols-outlined text-lg text-botanical-terracotta animate-pulse">videocam</span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-botanical-terracotta">
                {applications.filter(a => a.status === 'INTERVIEW').length}
              </span>
              <span className="text-[11px] font-medium text-botanical-terracotta">cần chuẩn bị</span>
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
              <span className="text-3xl font-serif font-bold text-botanical-forest">
                {applications.filter(a => a.status === 'OFFER').length}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30">Thành công</span>
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
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-full bg-[#f8f7ff] border border-purple-100 overflow-x-auto text-xs font-sans">
            <button 
              onClick={() => setActiveFilter('ALL')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#32247b] text-white shadow-sm'
                  : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
              }`}
            >
              Tất cả ({applications.length})
            </button>
            <button 
              onClick={() => setActiveFilter('APPLIED')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'APPLIED'
                  ? 'bg-[#32247b] text-white shadow-sm'
                  : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
              }`}
            >
              Chờ duyệt ({applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING').length})
            </button>
            <button 
              onClick={() => setActiveFilter('INTERVIEW')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'INTERVIEW'
                  ? 'bg-[#32247b] text-white shadow-sm'
                  : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
              }`}
            >
              Phỏng vấn ({applications.filter(a => a.status === 'INTERVIEW').length})
            </button>
            <button 
              onClick={() => setActiveFilter('OFFER')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'OFFER'
                  ? 'bg-[#32247b] text-white shadow-sm'
                  : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
              }`}
            >
              Đã nhận Offer ({applications.filter(a => a.status === 'OFFER').length})
            </button>
            <button 
              onClick={() => setActiveFilter('REJECTED')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'REJECTED'
                  ? 'bg-[#32247b] text-white shadow-sm'
                  : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
              }`}
            >
              Từ chối ({applications.filter(a => a.status === 'REJECTED').length})
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
          {loading ? (
            <div className="card-botanical bg-white/95 rounded-3xl p-16 text-center border border-botanical-stone shadow-soft">
              <div className="w-12 h-12 border-4 border-botanical-forest border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-botanical-forest/70 font-semibold">Đang tải hồ sơ ứng tuyển từ hệ thống...</p>
            </div>
          ) : viewMode === 'kanban' ? (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Column 1: Đã nộp */}
              <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft">
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                  <span className="text-xs font-serif font-bold text-botanical-forest">1. Đã Nộp Hồ Sơ</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-cream text-botanical-forest font-sans border border-botanical-stone">
                    {applications.filter(a => a.status === 'APPLIED').length}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {applications.filter(a => a.status === 'APPLIED').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có đơn ở giai đoạn này</div>
                  ) : (
                    applications.filter(a => a.status === 'APPLIED').map(a => (
                      <div key={a.id} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-1.5 hover:shadow-soft transition-all">
                        <div className="text-xs font-serif font-bold text-botanical-forest">{a.company}</div>
                        <div className="text-[11px] text-botanical-forest/70 font-sans">{a.title}</div>
                        <div className="text-[10px] font-sans font-semibold text-botanical-sage">{a.aiMatch}% AI Match</div>
                        {a.jobId && (
                          <a href={`#/jobs/${a.jobId}`} className="block text-center text-[10px] py-1 rounded-full btn-botanical-secondary font-medium mt-1">
                            Xem JD
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Duyệt CV */}
              <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft">
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                  <span className="text-xs font-serif font-bold text-botanical-forest">2. Duyệt CV</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest font-sans border border-botanical-sage/30">
                    {applications.filter(a => a.status === 'SCREENING').length}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {applications.filter(a => a.status === 'SCREENING').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có đơn ở giai đoạn này</div>
                  ) : (
                    applications.filter(a => a.status === 'SCREENING').map(a => (
                      <div key={a.id} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-1.5 hover:shadow-soft transition-all">
                        <div className="text-xs font-serif font-bold text-botanical-forest">{a.company}</div>
                        <div className="text-[11px] text-botanical-forest/70 font-sans">{a.title}</div>
                        <div className="text-[10px] text-botanical-terracotta font-sans font-semibold">Đang thẩm định hồ sơ</div>
                        {a.jobId && (
                          <a href={`#/ai-interview?jobId=${a.jobId}`} className="block text-center text-[10px] py-1 rounded-full btn-botanical-primary font-medium mt-1">
                            Luyện Phỏng Vấn
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Phỏng vấn */}
              <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft ring-1 ring-botanical-terracotta/30">
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                  <span className="text-xs font-serif font-bold text-botanical-terracotta">3. Phỏng Vấn</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta font-sans font-bold border border-botanical-terracotta/30">
                    {applications.filter(a => a.status === 'INTERVIEW').length}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {applications.filter(a => a.status === 'INTERVIEW').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có đơn ở giai đoạn này</div>
                  ) : (
                    applications.filter(a => a.status === 'INTERVIEW').map(a => (
                      <div key={a.id} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-1.5 hover:shadow-soft transition-all">
                        <div className="text-xs font-serif font-bold text-botanical-forest">{a.company}</div>
                        <div className="text-[11px] text-botanical-forest/70 font-sans">{a.title}</div>
                        <div className="text-[10px] text-botanical-terracotta font-sans font-semibold">Vòng Phỏng Vấn</div>
                        <a href={`#/ai-interview?jobId=${a.jobId || ''}`} className="block text-center text-[10px] py-1.5 rounded-full btn-botanical-primary font-medium mt-1">
                          Ôn luyện ngay
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 4: Đã nhận Offer */}
              <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-4 flex flex-col gap-3 shadow-soft ring-1 ring-botanical-sage/30">
                <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                  <span className="text-xs font-serif font-bold text-botanical-forest">4. Nhận Offer</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest font-sans border border-botanical-sage/30">
                    {applications.filter(a => a.status === 'OFFER').length}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {applications.filter(a => a.status === 'OFFER').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có thư mời nhận việc</div>
                  ) : (
                    applications.filter(a => a.status === 'OFFER').map(a => (
                      <div key={a.id} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-botanical-stone space-y-1.5 hover:shadow-soft transition-all">
                        <div className="text-xs font-serif font-bold text-botanical-forest">{a.company}</div>
                        <div className="text-[11px] text-botanical-forest/70 font-sans">{a.title}</div>
                        <div className="text-[10px] text-botanical-terracotta font-serif font-bold">{a.salary}</div>
                        <button 
                          onClick={() => handleOpenOfferModal(a)}
                          className="w-full text-center text-[10px] py-1.5 rounded-full btn-botanical-secondary font-medium cursor-pointer mt-1"
                        >
                          Xem Thư Offer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* LIST VIEW MODE (RENDER REAL SUPABASE DATA) */
            filteredApps.length === 0 ? (
              <div className="card-botanical bg-white/95 rounded-3xl p-12 text-center border border-botanical-stone shadow-soft space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-botanical-sage/15 border border-botanical-stone flex items-center justify-center mx-auto text-botanical-sage">
                  <span className="material-symbols-outlined text-3xl">work_outline</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-botanical-forest mb-1">Chưa Có Đơn Ứng Tuyển Nào</h3>
                  <p className="text-sm font-sans text-botanical-forest/70 max-w-md mx-auto">
                    Bạn chưa ứng tuyển vào vị trí nào phù hợp với bộ lọc này. Hãy tìm kiếm các cơ hội việc làm hấp dẫn và nộp hồ sơ ngay hôm nay!
                  </p>
                </div>
                <div>
                  <a href="#/" className="btn-botanical-primary inline-flex items-center gap-2 !px-6 !py-3 !text-xs shadow-soft">
                    <span className="material-symbols-outlined text-sm">search</span>
                    Khám Phá Cơ Hội Việc Làm
                  </a>
                </div>
              </div>
            ) : (
              filteredApps.map((app) => (
                <div key={app.id} className="card-botanical bg-white/95 rounded-3xl p-6 sm:p-7 border border-botanical-stone shadow-soft transition-all duration-300 hover:shadow-soft-lg space-y-5">
                  {/* Top Row: Company Info & AI Match */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div 
                        onClick={() => app.jobId && (window.location.hash = `#/jobs/${app.jobId}`)}
                        className="w-14 h-14 rounded-2xl bg-botanical-sage/15 text-botanical-forest border border-botanical-stone flex items-center justify-center font-serif font-bold text-lg shadow-soft cursor-pointer hover:scale-105 transition-transform shrink-0"
                        title={app.company}
                      >
                        {app.companyShort}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 
                            onClick={() => app.jobId && (window.location.hash = `#/jobs/${app.jobId}`)}
                            className="text-lg font-serif font-bold text-botanical-forest hover:text-botanical-terracotta transition-colors cursor-pointer"
                          >
                            {app.company}
                          </h3>
                          <span className="text-xs font-sans text-botanical-forest/60">• {app.division || 'Tuyển Dụng'}</span>
                        </div>
                        <h4 className="text-sm font-sans font-semibold text-botanical-terracotta mt-0.5">{app.title}</h4>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-sans text-botanical-forest/70 mt-1.5">
                          <span className="flex items-center gap-1 font-medium text-botanical-forest">
                            <span className="material-symbols-outlined text-sm text-botanical-sage">payments</span>
                            {app.salary || 'Thương lượng'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {app.location || 'Việt Nam'}
                          </span>
                          <span>•</span>
                          <span>Nộp: {app.appliedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges: AI Match & Status */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-botanical-sage/20 border border-botanical-sage/40 text-botanical-forest font-serif font-bold text-xs shadow-soft">
                        <span className="material-symbols-outlined text-sm text-botanical-sage">bolt</span>
                        {app.aiMatch}% AI Match
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-serif font-semibold border ${
                        app.status === 'OFFER' ? 'bg-botanical-terracotta/15 border-botanical-terracotta/30 text-botanical-terracotta' :
                        app.status === 'INTERVIEW' ? 'bg-botanical-sage/20 border-botanical-sage/30 text-botanical-forest' :
                        app.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                        'bg-botanical-cream border-botanical-stone text-botanical-forest/80'
                      }`}>
                        {app.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* CV Used & Metadata bar */}
                  <div className="pt-3 border-t border-botanical-stone/80 flex flex-wrap items-center justify-between text-xs font-sans text-botanical-forest/70 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-botanical-sage">description</span>
                      <span>CV: <strong className="text-botanical-forest font-medium">{app.cvUsed || 'Hồ sơ đã nộp'}</strong></span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-botanical-cream text-botanical-forest border border-botanical-stone">ATS {app.atsScore || 90}/100</span>
                    </div>
                    <span className="text-[11px] text-botanical-terracotta font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-botanical-terracotta animate-pulse"></span>
                      {app.responseNotice}
                    </span>
                  </div>

                  {/* Stepper Pipeline Tracker */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100 shadow-sm font-sans">
                    <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-[#1e1b4b] mb-3.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                      Tiến Trình Ứng Tuyển
                    </div>
                    <div className="grid grid-cols-4 gap-2 relative">
                      {(app.steps || [
                        { step: 1, title: '1. Đã Nộp', date: app.appliedDate, status: 'completed' },
                        { step: 2, title: '2. Duyệt CV', date: `Đạt ${app.aiMatch}%`, status: app.currentStep >= 2 ? 'completed' : 'active' },
                        { step: 3, title: '3. Phỏng Vấn', date: 'Đánh giá AI', status: app.currentStep >= 3 ? (app.currentStep === 3 ? 'active' : 'completed') : 'pending' },
                        { step: 4, title: '4. Nhận Offer', date: 'Kết quả', status: app.currentStep === 4 ? 'completed' : 'pending' },
                      ]).map((st) => (
                        <div key={st.step} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                          <div className="w-full flex items-center mb-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0 ${
                              st.status === 'completed' ? 'bg-[#32247b] text-white' :
                              st.status === 'active' ? 'bg-[#f97316] text-white ring-4 ring-orange-500/20 animate-pulse' :
                              'bg-slate-100 text-slate-400 border border-purple-100'
                            }`}>
                              {st.status === 'completed' ? (
                                <span className="material-symbols-outlined text-sm font-extrabold">check</span>
                              ) : (
                                st.step
                              )}
                            </div>
                            {st.step < 4 && (
                              <div className={`flex-1 h-1 mx-1 rounded-full ${
                                st.status === 'completed' ? 'bg-[#32247b]' :
                                st.status === 'active' ? 'bg-[#f97316]' : 'bg-purple-100'
                              }`} />
                            )}
                          </div>
                          <div className={`text-xs font-sans font-extrabold ${
                            st.status === 'active' ? 'text-[#f97316]' :
                            st.status === 'completed' ? 'text-[#1e1b4b]' : 'text-slate-400'
                          }`}>{st.title}</div>
                          <div className="text-[11px] font-sans text-slate-500 font-semibold mt-0.5">{st.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {app.status === 'INTERVIEW' && (
                      <>
                        <a 
                          href={`#/ai-interview?jobId=${app.jobId || ''}`}
                          className="btn-botanical-primary !text-xs !py-2.5 !px-5 flex items-center gap-2 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">smart_toy</span>
                          Vào Phòng Phỏng Vấn AI Ôn Luyện
                        </a>
                        <button 
                          onClick={() => handleOpenInvitationModal(app)}
                          className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 cursor-pointer shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">mark_email_read</span>
                          Xem Lịch Phỏng Vấn
                        </button>
                      </>
                    )}

                    {app.status === 'OFFER' && (
                      <button 
                        onClick={() => handleOpenOfferModal(app)}
                        className="btn-botanical-primary !text-xs !py-2.5 !px-5 flex items-center gap-2 cursor-pointer shadow-soft"
                      >
                        <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                        Xem Chi Tiết Offer & Ký
                      </button>
                    )}

                    <button 
                      onClick={() => handleOpenChatModal(app.recruiter?.name || 'Tuyển Dụng', app.company)}
                      className="btn-botanical-secondary !text-xs !py-2.5 !px-4 flex items-center gap-1.5 cursor-pointer shadow-soft"
                    >
                      <span className="material-symbols-outlined text-sm text-botanical-sage">chat</span>
                      Nhắn Tin Tuyển Dụng
                    </button>

                    {app.jobId && (
                      <a 
                        href={`#/jobs/${app.jobId}`}
                        className="btn-botanical-secondary !text-xs !py-2.5 !px-4 cursor-pointer shadow-soft"
                      >
                        Xem Chi Tiết JD
                      </a>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </main>

        {/* RIGHT SIDEBAR: UPCOMING EVENTS & AI MENTOR COPILOT */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
          {/* SIDEBAR BLOCK 1: UPCOMING SCHEDULE */}
          <div className="card-botanical bg-white/95 rounded-3xl p-6 border border-botanical-stone shadow-soft">
            <div className="flex items-center justify-between pb-3.5 border-b border-botanical-stone">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-botanical-forest text-xl">calendar_month</span>
                <h3 className="text-base font-serif font-bold text-botanical-forest">Lịch Trình Sắp Tới</h3>
              </div>
              <span className="text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30">
                {applications.filter(a => a.status === 'INTERVIEW').length} Phỏng Vấn
              </span>
            </div>
            <div className="mt-4 space-y-3.5">
              {applications.filter(a => a.status === 'INTERVIEW').length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone text-center text-xs font-sans text-botanical-forest/70 space-y-1.5">
                  <span className="material-symbols-outlined text-2xl text-botanical-sage mb-1 block">event_available</span>
                  <p className="font-medium text-botanical-forest">Chưa có lịch phỏng vấn sắp tới</p>
                  <p className="text-[11px] text-botanical-forest/60">Khi hồ sơ được thông qua vòng duyệt, thông báo lịch phỏng vấn sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                applications.filter(a => a.status === 'INTERVIEW').slice(0, 3).map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-[#FAF9F5] border border-botanical-stone hover:border-botanical-sage/50 transition-all space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-botanical-terracotta font-serif font-bold">{app.company}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta font-bold">Vòng Phỏng Vấn</span>
                    </div>
                    <h4 className="text-xs font-serif font-bold text-botanical-forest">{app.title}</h4>
                    <p className="text-[11px] text-botanical-forest/70 font-sans">Phỏng vấn đánh giá năng lực & kỹ năng thực chiến</p>
                    <div className="pt-2 border-t border-botanical-stone flex items-center justify-between">
                      <span className="text-[11px] text-botanical-sage font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">videocam</span> Trực tuyến
                      </span>
                      <a 
                        href={`#/ai-interview?jobId=${app.jobId || ''}`}
                        className="text-xs text-botanical-forest font-bold hover:underline cursor-pointer"
                      >
                        Ôn luyện AI →
                      </a>
                    </div>
                  </div>
                ))
              )}
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
                {applications.length > 0 
                  ? `Dựa trên các đơn ứng tuyển của bạn (${applications[0]?.title}), HireMate AI gợi ý ôn luyện các kỹ năng trọng tâm:`
                  : 'Hãy chuẩn bị kỹ năng phỏng vấn chuyên nghiệp cùng trợ lý AI của HireMate:'}
              </p>
              <div className="space-y-2 font-sans">
                <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-botanical-stone flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-sm text-botanical-sage mt-0.5">psychology</span>
                  <div>
                    <div className="text-xs font-serif font-bold text-botanical-forest">Kỹ năng Chuyên môn & Xử lý Vấn đề</div>
                    <div className="text-[11px] text-botanical-forest/70 mt-0.5">Luyện phản xạ tình huống và giải quyết bài toán nghiệp vụ.</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-botanical-stone flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-sm text-botanical-sage mt-0.5">record_voice_over</span>
                  <div>
                    <div className="text-xs font-serif font-bold text-botanical-forest">Giao tiếp & Phỏng vấn Hành vi (STAR)</div>
                    <div className="text-[11px] text-botanical-forest/70 mt-0.5">Tự tin trình bày kinh nghiệm theo mô hình Situation - Task - Action - Result.</div>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <a 
                  href="#/ai-interview"
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

            <div className="my-5 p-4 rounded-2xl bg-white border border-botanical-stone space-y-3 text-xs shadow-soft">
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Mức lương cơ bản:</span>
                <span className="text-botanical-terracotta font-serif font-bold text-base">{modalData.offerDetails?.baseSalary || modalData.salary || 'Thương lượng cạnh tranh'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Gói thưởng gia nhập (Sign-on):</span>
                <span className="text-botanical-forest font-semibold">{modalData.offerDetails?.signOnBonus || 'Gói đãi ngộ đầy đủ theo quy chế công ty'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Cổ phần ESOP / Thưởng:</span>
                <span className="text-botanical-forest font-semibold">{modalData.offerDetails?.shares || 'Thưởng hiệu suất theo kết quả kinh doanh'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-botanical-forest/70">Hạn chót phản hồi:</span>
                <span className="text-botanical-terracotta font-bold">{modalData.offerDetails?.deadline || 'Trong vòng 7 ngày làm việc kể từ ngày nhận thư'}</span>
              </div>
            </div>

            <p className="text-xs text-botanical-forest/80 italic mb-6 font-serif">
              "{modalData.company || 'Doanh nghiệp'} rất vinh hạnh được chào đón bạn gia nhập đội ngũ nhằm đồng hành phát triển cùng chúng tôi."
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
                <h3 className="font-serif font-bold text-xl text-botanical-forest">Thư Mời Phỏng Vấn Kỹ Thuật</h3>
                <p className="text-xs text-botanical-terracotta font-medium">{modalData.company} • Vòng Phỏng Vấn</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-white border border-botanical-stone space-y-3 text-xs shadow-soft">
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Thời gian:</span>
                <span className="text-botanical-forest font-bold">14:00 - 15:00 (Sắp xếp theo email thông báo)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500 font-semibold">Hình thức:</span>
                <span className="text-[#10b981] font-bold">Google Meet Video Call</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-botanical-stone">
                <span className="text-botanical-forest/70">Ban phỏng vấn:</span>
                <span className="text-botanical-forest">Hội đồng Tuyển Dụng & Trưởng Bộ Phận</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-botanical-forest/70">Đường dẫn cuộc họp:</span>
                <span className="text-botanical-terracotta font-mono font-medium">meet.google.com/hmt-interview</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <a 
                href={`#/ai-interview?jobId=${modalData.jobId || ''}`}
                className="btn-botanical-secondary !text-xs !py-2.5 !px-5 flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-botanical-forest/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-botanical-stone rounded-3xl p-6 sm:p-7 shadow-soft-xl flex flex-col h-[520px]">
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 hover:bg-white border border-botanical-stone text-botanical-forest/60 hover:text-botanical-forest flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-botanical-stone">
              <div className="w-10 h-10 rounded-full bg-botanical-forest text-white font-serif font-bold flex items-center justify-center text-sm shadow-soft">
                {modalData.recruiterName?.slice(0, 1)}
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-botanical-forest flex items-center gap-1.5">
                  {modalData.recruiterName}
                  <span className="w-2 h-2 rounded-full bg-botanical-sage inline-block"></span>
                </h3>
                <p className="text-[11px] text-botanical-forest/70 font-sans">{modalData.company} • Trực tuyến</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs font-sans">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-soft ${
                    msg.sender === 'me'
                      ? 'bg-botanical-forest text-white rounded-br-none'
                      : 'bg-white border border-botanical-stone text-botanical-forest rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-botanical-stone flex items-center gap-2">
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
