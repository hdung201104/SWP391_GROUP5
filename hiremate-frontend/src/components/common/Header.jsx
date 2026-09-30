import React, { useState, useEffect } from 'react';
import { useLivingTheme } from '../../context/LivingThemeContext';

export default function Header({ 
  user, 
  onLogout, 
  onNavigate, 
  onSwitchDemoRole, 
  currentRoute: propRoute,
}) {
  const { variant, setVariant, luminosity, setLuminosity, theme, enable3D, setEnable3D } = useLivingTheme();
  const [routeState, setRouteState] = useState(propRoute || window.location.hash || '#/');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (propRoute) {
      setRouteState(propRoute);
    }
  }, [propRoute]);

  useEffect(() => {
    const handleHash = () => {
      setRouteState(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const activeRoute = (propRoute || routeState || window.location.hash || '#/').toLowerCase();

  const handleNav = (route) => {
    window.location.hash = route;
    setRouteState(route);
    if (onNavigate) onNavigate(route);
    setShowProfileMenu(false);
    setShowRoleMenu(false);
    setShowNotificationPopup(false);
    setMobileMenuOpen(false);
  };

  const isRoleCandidate = user?.role === 'CANDIDATE';
  const isRoleRecruiter = user?.role === 'RECRUITER';
  const isGuest = !user;

  // Active state checkers (synchronized for Candidate, Recruiter & Guest)
  const isHomeActive = 
    activeRoute === '#/' || 
    activeRoute === '' || 
    activeRoute === '#' || 
    (activeRoute.startsWith('#/jobs') && !activeRoute.includes('recruiter-jobs')) || 
    activeRoute.includes('tim-viec');

  const isInterviewActive = 
    activeRoute.includes('ai-interview') || 
    activeRoute.includes('phong-van-ai') ||
    activeRoute.includes('luyen-phong-van') ||
    activeRoute.includes('mock-interview');

  const isCandidateAppsActive = 
    isRoleCandidate && (
      activeRoute.includes('applications') || 
      activeRoute.includes('don-ung-tuyen') ||
      (activeRoute.includes('candidate-dashboard') && activeRoute.includes('tab=applications'))
    );

  const isSettingsActive = 
    activeRoute.includes('settings') || 
    activeRoute.includes('cai-dat') || 
    activeRoute.includes('account');

  const isCandidateProfileActive = 
    isRoleCandidate && 
    !isCandidateAppsActive &&
    !isSettingsActive && (
      activeRoute.includes('candidate-profile') ||
      (activeRoute.includes('profile') && !activeRoute.includes('recruiter-profile')) || 
      activeRoute.includes('quan-ly-ho-so') || 
      activeRoute.includes('candidate-dashboard') || 
      activeRoute.includes('ho-so-cv') || 
      activeRoute.includes('cv-management')
    );

  // Recruiter checks (100% distinct from candidate)
  const isRecruiterJobsActive = 
    isRoleRecruiter && (
      activeRoute.includes('recruiter-jobs') || 
      activeRoute.includes('job-dashboard') || 
      activeRoute.includes('quan-ly-tin') ||
      activeRoute.includes('applicants-management') || 
      activeRoute.includes('job-applicants') || 
      activeRoute.includes('recruiter-applicants') || 
      (activeRoute.includes('recruiter-dashboard') && activeRoute.includes('tab=jobs'))
    );

  const isRecruiterEvaluationActive = 
    isRoleRecruiter && (
      activeRoute.includes('candidate-evaluation') || 
      activeRoute.includes('candidate-dossier') || 
      activeRoute.includes('candidate-cv') || 
      activeRoute.includes('hm-9082')
    );

  const isRecruiterOverviewActive = 
    isRoleRecruiter && (
      (activeRoute.includes('recruiter-dashboard') && 
       !activeRoute.includes('tab=jobs') && 
       !activeRoute.includes('tab=pipeline') && 
       !activeRoute.includes('tab=company')) ||
      activeRoute.includes('reports-analytics') ||
      activeRoute.includes('bao-cao')
    );

  const isRecruiterCompanyActive = 
    isRoleRecruiter && (
      activeRoute.includes('recruiter-profile') || 
      activeRoute.includes('company-profile') || 
      activeRoute.includes('ho-so-doanh-nghiep') || 
      (activeRoute.includes('recruiter-dashboard') && activeRoute.includes('tab=company'))
    );

  // Notification Center State (16 3NF schema)
  const [notificationTab, setNotificationTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'RECRUITMENT' | 'AI_STUDIO'
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'RECRUITMENT',
      title: 'Hồ sơ đã chuyển sang vòng Phỏng Vấn',
      body: 'FPT Software đã chuyển đơn ứng tuyển của bạn cho vị trí Senior Frontend sang chặng Phỏng Vấn Kỹ Thuật.',
      time: '10 phút trước',
      isRead: false,
      targetRoute: '#/applications',
      icon: 'calendar_today',
      color: 'secondary',
    },
    {
      id: 2,
      type: 'AI_STUDIO',
      title: 'Báo cáo chẩn đoán phiên #HM-9082 đã sẵn sàng',
      body: 'Synthia AI Tech Lead đã hoàn tất chấm điểm: 85/100 PTS (Top 8% Candidate Pool).',
      time: '25 phút trước',
      isRead: false,
      targetRoute: '#/ai-interview',
      icon: 'psychology',
      color: 'primary',
    },
    {
      id: 3,
      type: 'RECRUITMENT',
      title: 'AI Match phát hiện việc làm phù hợp 98%',
      body: 'Lead AI & LLM Solution Architect tại Viettel Digital đang tìm kiếm ứng viên có profile như bạn.',
      time: '2 giờ trước',
      isRead: false,
      targetRoute: '#/jobs/104',
      icon: 'auto_awesome',
      color: 'tertiary',
    },
    {
      id: 4,
      type: 'AI_STUDIO',
      title: 'Nhắc nhở luyện tập điểm yếu',
      body: 'Bạn có 2 lỗ hổng cần củng cố: React 18 Concurrency & useMemo memory leak. Luyện lại ngay để tăng +20đ.',
      time: '1 ngày trước',
      isRead: true,
      targetRoute: '#/ai-interview',
      icon: 'model_training',
      color: 'secondary',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Display details
  const displayName = user?.fullName || (isGuest ? 'Khách (Guest)' : 'Long Tran');
  const displaySubtitle = isRoleCandidate 
    ? 'ATS Match 98%' 
    : isRoleRecruiter 
      ? (user?.companyName ? `${user.companyName} • HR Lead` : 'FPT Software • HR Lead')
      : 'Tham quan hệ thống';

  const avatarUrl = user?.avatarUrl || (isRoleRecruiter 
    ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F9F8F4]/90 backdrop-blur-md border-b border-[#E6E2DA] shadow-[0_4px_20px_-2px_rgba(45,58,49,0.03)] transition-all duration-500">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Status Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => handleNav('#/')} 
            className="flex items-center gap-2.5 group cursor-pointer text-left bg-transparent border-none p-0 shrink-0"
            title="Về Cổng Việc Làm (Trang chủ)"
          >
            <div className="h-9 w-9 rounded-2xl bg-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center shadow-soft group-hover:scale-105 transition-all duration-500">
              <span className="material-symbols-outlined text-[#8C9A84] text-[20px]">spa</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold tracking-tight text-[#2D3A31] leading-none">
                HireMate<span className="italic font-normal text-[#C27B66]">.AI</span>
              </span>
              <span className="text-[10px] font-body font-semibold text-[#8C9A84] tracking-widest leading-none mt-0.5 uppercase">
                Botanical AI Match
              </span>
            </div>
          </button>

          <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F0EB] border border-[#E6E2DA] shadow-soft shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse"></span>
            <span className="text-[10px] font-body font-semibold text-[#2D3A31] tracking-wider uppercase">
              Organic Intelligence
            </span>
          </div>
        </div>

        {/* Center: Synchronized Role-Based Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 font-body text-xs uppercase tracking-wider shrink-0">
          {/* =================================================== */}
          {/* 1. CANDIDATE NAVBAR LINKS                           */}
          {/* =================================================== */}
          {isRoleCandidate && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`px-4 py-1.5 rounded-full transition-all duration-500 cursor-pointer font-semibold ${
                  isHomeActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
              >
                CỔNG VIỆC LÀM
              </button>

              <button
                onClick={() => handleNav('#/applications')}
                className={`px-4 py-1.5 rounded-full transition-all duration-500 cursor-pointer font-semibold ${
                  isCandidateAppsActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
              >
                ỨNG TUYỂN CỦA TÔI
              </button>

              <button
                onClick={() => handleNav('#/ai-interview')}
                className={`px-4 py-1.5 rounded-full transition-all duration-500 cursor-pointer font-semibold ${
                  isInterviewActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
              >
                AI PRACTICE STUDIO
              </button>

              <button
                onClick={() => handleNav('#/profile')}
                className={`px-4 py-1.5 rounded-full transition-all duration-500 cursor-pointer font-semibold ${
                  isCandidateProfileActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
                title="Tạo và quản lý các bản CV ứng tuyển việc làm"
              >
                QUẢN LÝ CV (CV BUILDER)
              </button>
            </>
          )}

          {/* =================================================== */}
          {/* 2. RECRUITER NAVBAR LINKS                           */}
          {/* =================================================== */}
          {isRoleRecruiter && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 cursor-pointer flex items-center gap-1.5 ${
                  isHomeActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
                title="Cổng việc làm công khai trên thị trường"
              >
                <span className="material-symbols-outlined text-[15px]">travel_explore</span>
                <span>CỔNG VIỆC LÀM</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-jobs')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterJobsActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
                title="Quản lý tin đăng tuyển dụng & tỷ lệ 70/30"
              >
                <span className="material-symbols-outlined text-[15px]">post_add</span>
                <span>TIN ĐĂNG</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-dashboard?tab=overview')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterOverviewActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
                title="Báo cáo phân tích hiệu suất tuyển dụng & chỉ số Time-to-Hire"
              >
                <span className="material-symbols-outlined text-[15px]">analytics</span>
                <span>BÁO CÁO</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-profile')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterCompanyActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
                title="Hồ sơ công ty, quy mô & thương hiệu doanh nghiệp"
              >
                <span className="material-symbols-outlined text-[15px]">domain</span>
                <span>HỒ SƠ CÔNG TY</span>
              </button>
            </>
          )}

          {/* =================================================== */}
          {/* 3. GUEST NAVBAR LINKS                               */}
          {/* =================================================== */}
          {isGuest && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`px-4 py-1.5 rounded-full transition-all duration-500 cursor-pointer font-semibold uppercase tracking-wider ${
                  isHomeActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
              >
                CỔNG VIỆC LÀM
              </button>

              <button
                onClick={() => handleNav('#/ai-interview')}
                className={`px-4 py-1.5 rounded-full transition-all duration-500 cursor-pointer font-semibold uppercase tracking-wider ${
                  isInterviewActive
                    ? 'bg-[#2D3A31] text-white shadow-soft border border-[#2D3A31]'
                    : 'border border-transparent text-[#667067] hover:text-[#2D3A31] hover:bg-[#F2F0EB]'
                }`}
              >
                AI PRACTICE STUDIO
              </button>

              <button
                onClick={() => handleNav('#/login')}
                className="px-4 py-1.5 rounded-full text-[#8C9A84] hover:bg-[#8C9A84]/10 border border-[#8C9A84] transition-all duration-500 cursor-pointer font-semibold uppercase tracking-wider"
              >
                DÀNH CHO DOANH NGHIỆP
              </button>
            </>
          )}
        </nav>

        {/* Right Actions: Quick Role Switcher, Alerts, Profile */}
        <div className="flex items-center gap-2.5 shrink-0">


          {/* Quick Action Button for Recruiter: + Đăng Tin Tuyển Dụng */}
          {isRoleRecruiter && (
            <button
              onClick={() => handleNav('#/recruiter-jobs?action=new')}
              className="hidden md:flex btn-botanical-primary px-4 py-1.5 text-xs tracking-wider items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
              <span>Đăng Tin Mới</span>
            </button>
          )}

          {/* Saved Jobs (for Candidate) */}
          {isRoleCandidate && (
            <button
              onClick={() => handleNav('#/candidate-dashboard?tab=applications')}
              className="relative p-2 rounded-full bg-white border border-[#E6E2DA] text-[#2D3A31] shadow-soft hover:bg-[#F2F0EB] transition-all duration-300 flex items-center justify-center cursor-pointer"
              title="Việc làm đã lưu (5)"
            >
              <span className="material-symbols-outlined text-xl">bookmark</span>
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#C27B66] text-white text-[10px] font-mono font-bold border border-[#E6E2DA]">
                5
              </span>
            </button>
          )}

          {/* Notifications Center Bell (chỉ hiện khi đã đăng nhập) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="relative p-2 rounded-full bg-white border border-[#E6E2DA] text-[#2D3A31] shadow-soft hover:bg-[#F2F0EB] transition-all duration-300 cursor-pointer flex items-center justify-center"
                title="Trung tâm thông báo hệ thống"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#C27B66] text-white text-[9px] font-mono font-bold border border-[#E6E2DA]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationPopup && (
                <div className="absolute right-0 mt-3 w-88 sm:w-96 rounded-3xl bg-white border border-[#E6E2DA] shadow-soft-lg p-5 z-50 font-body text-[#2D3A31]">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#2D3A31]">Trung Tâm Thông Báo</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/40">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-[#8B5CF6] hover:underline cursor-pointer flex items-center gap-1 font-bold"
                      >
                        <span className="material-symbols-outlined text-xs">done_all</span>
                        <span>Đánh dấu đã đọc</span>
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] text-[11px] mb-3">
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
                      { id: 'RECRUITMENT', label: 'Tuyển dụng' },
                      { id: 'AI_STUDIO', label: 'AI Studio' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setNotificationTab(tab.id)}
                        className={`flex-1 py-1 text-center rounded-lg font-bold transition-all cursor-pointer ${
                          notificationTab === tab.id
                            ? 'bg-white text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border border-[#1E293B]'
                            : 'text-[#64748B] hover:text-[#1E293B]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-[#E2E8F0]">
                    {notifications
                      .filter((n) => {
                        if (notificationTab === 'UNREAD') return !n.isRead;
                        if (notificationTab === 'RECRUITMENT') return n.type === 'RECRUITMENT';
                        if (notificationTab === 'AI_STUDIO') return n.type === 'AI_STUDIO';
                        return true;
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            markAsRead(item.id);
                            setShowNotificationPopup(false);
                            if (item.targetRoute) handleNav(item.targetRoute);
                          }}
                          className={`pt-2.5 pb-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 hover:bg-[#F8FAFC] ${
                            !item.isRead ? 'bg-[#FFFDF5] border border-[#CBD5E1]' : 'opacity-80'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border-2 border-[#1E293B] ${
                            item.color === 'secondary' ? 'bg-[#34D399] text-[#1E293B]' :
                            item.color === 'primary' ? 'bg-[#8B5CF6] text-white' :
                            'bg-[#FBBF24] text-[#1E293B]'
                          }`}>
                            <span className="material-symbols-outlined text-sm">{item.icon}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className={`text-xs truncate ${!item.isRead ? 'text-[#1E293B] font-extrabold' : 'text-[#64748B] font-medium'}`}>
                                {item.title}
                              </h4>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed mt-0.5">
                              {item.body}
                            </p>
                            <span className="text-[10px] text-[#94A3B8] font-mono block mt-1">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))}

                    {notifications.filter((n) => notificationTab === 'UNREAD' ? !n.isRead : notificationTab === 'RECRUITMENT' ? n.type === 'RECRUITMENT' : notificationTab === 'AI_STUDIO' ? n.type === 'AI_STUDIO' : true).length === 0 && (
                      <div className="py-8 text-center text-[#64748B] text-xs space-y-1">
                        <span className="material-symbols-outlined text-2xl text-[#94A3B8]">notifications_off</span>
                        <p>Không có thông báo nào trong mục này</p>
                      </div>
                    )}
                  </div>

                  {/* Footer action */}
                  <div className="pt-3 mt-2 border-t-2 border-[#E2E8F0] text-center">
                    <button
                      onClick={() => {
                        setShowNotificationPopup(false);
                        handleNav(isRoleRecruiter ? '#/recruiter-dashboard?tab=overview' : '#/applications');
                      }}
                      className="text-xs text-[#8B5CF6] hover:underline font-bold cursor-pointer"
                    >
                      Xem lịch sử hoạt động chi tiết →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Login/Register Button */}
          {user ? (
            <div className="relative shrink-0">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 pl-2.5 border-l border-[#E6E2DA] cursor-pointer select-none shrink-0 group hover:opacity-95 transition-opacity"
              >
                <div className="relative w-9 h-9 min-w-[36px] min-h-[36px] shrink-0 rounded-full bg-white border border-[#E6E2DA] shadow-soft p-0.5">
                  {!avatarError ? (
                    <img 
                      alt={displayName} 
                      className="w-full h-full rounded-full object-cover shrink-0 block bg-[#F2F0EB]" 
                      src={avatarUrl}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#2D3A31] flex items-center justify-center font-serif font-bold text-[11px] text-white select-none">
                      {displayName?.split(' ').map(n => n[0]).slice(-2).join('') || (isRoleCandidate ? 'LT' : 'HR')}
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    isRoleRecruiter ? 'bg-[#8C9A84]' : 'bg-[#C27B66]'
                  }`}></span>
                </div>

                <div className="hidden xl:flex flex-col text-left shrink-0">
                  <span className="font-serif font-bold text-xs text-[#2D3A31] flex items-center gap-1 group-hover:text-[#C27B66] transition-colors">
                    {displayName}
                    <span className="material-symbols-outlined text-sm text-[#8C9A84]">expand_more</span>
                  </span>
                  <span className="font-body text-[10px] font-semibold text-[#8C9A84]">
                    {displaySubtitle}
                  </span>
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-68 rounded-3xl bg-white border border-[#E6E2DA] shadow-soft-lg py-2 z-50 font-body text-[#2D3A31]">
                  <div className="px-4 py-3 border-b border-[#E6E2DA] flex items-center gap-3">
                    <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full p-0.5 bg-white border border-[#E6E2DA] shadow-soft shrink-0">
                      {!avatarError ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#2D3A31] flex items-center justify-center font-bold text-xs text-white">
                          {displayName?.split(' ').map(n => n[0]).slice(-2).join('') || 'HM'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-serif font-bold text-[#2D3A31] truncate">{displayName}</p>
                      <p className="text-[10px] text-[#667067] font-body truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border border-[#E6E2DA] ${
                          isRoleRecruiter ? 'bg-[#8C9A84]/15 text-[#2D3A31]' : 'bg-[#C27B66]/15 text-[#C27B66]'
                        }`}>
                          {isRoleRecruiter ? 'NHÀ TUYỂN DỤNG' : 'ỨNG VIÊN'}
                        </span>
                        <span className="text-[9px] text-[#667067] font-body">HM-{user?.userId || (isRoleCandidate ? '9082' : '2041')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Tài khoản cá nhân & Hồ sơ */}
                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfileMenu(false); handleNav('#/settings?tab=profile'); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-[#8B5CF6]">account_circle</span>
                      <span className="font-semibold">Xem &amp; Sửa Hồ sơ cá nhân</span>
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); handleNav('#/settings?tab=avatar'); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-[#8B5CF6]">add_a_photo</span>
                      <span>Đổi ảnh đại diện (Avatar)</span>
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); handleNav('#/settings?tab=security'); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-[#F472B6]">lock_reset</span>
                      <span>Đổi mật khẩu &amp; Bảo mật</span>
                    </button>
                  </div>

                  <div className="border-t border-[#E2E8F0] my-1"></div>

                  {/* Section 2: Role-specific Portals */}
                  {isRoleCandidate && (
                    <div className="py-1">
                      <button
                        onClick={() => { setShowProfileMenu(false); handleNav('#/profile'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#8B5CF6]">description</span>
                        <span>Hồ sơ CV &amp; Kỹ năng chuyên môn</span>
                      </button>
                      <button
                        onClick={() => { setShowProfileMenu(false); handleNav('#/applications'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#8B5CF6]">fact_check</span>
                        <span>Theo dõi Đơn ứng tuyển</span>
                      </button>
                      <button
                        onClick={() => { setShowProfileMenu(false); handleNav('#/ai-interview'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#F472B6]">psychology</span>
                        <span>AI Practice Studio</span>
                      </button>
                    </div>
                  )}

                  {isRoleRecruiter && (
                    <div className="py-1">
                      <button
                        onClick={() => { setShowProfileMenu(false); handleNav('#/recruiter-profile'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#34D399]">domain</span>
                        <span>Hồ sơ công ty &amp; Thương hiệu</span>
                      </button>
                      <button
                        onClick={() => { setShowProfileMenu(false); handleNav('#/recruiter-dashboard?tab=overview'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#34D399]">analytics</span>
                        <span>Báo cáo hiệu quả tuyển dụng</span>
                      </button>
                    </div>
                  )}

                  <div className="border-t border-[#E2E8F0] mt-1 pt-1">
                    <button
                      onClick={() => { setShowProfileMenu(false); onLogout(); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#EF4444] font-bold hover:bg-[#FEE2E2] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E6E2DA]">
              <button
                onClick={() => handleNav('#/login')}
                className="btn-botanical-secondary px-4 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => handleNav('#/register')}
                className="btn-botanical-primary px-4 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-white border-2 border-[#1E293B] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] hover:bg-[#F1F5F9] transition-all cursor-pointer flex items-center justify-center"
            aria-label="Toggle mobile menu"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-[#1E293B] bg-[#FFFDF5] px-4 py-4 space-y-1.5 shadow-pop-lg animate-fadeIn font-heading">
          {/* Current Role Indicator */}
          <div className="px-3.5 py-2 mb-2 rounded-xl bg-white border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-bold">Góc nhìn hiện tại:</span>
            <span className={`font-black uppercase tracking-wider ${isRoleRecruiter ? 'text-[#34D399]' : isRoleCandidate ? 'text-[#8B5CF6]' : 'text-[#64748B]'}`}>
              {isRoleRecruiter ? 'Nhà Tuyển Dụng' : isRoleCandidate ? 'Ứng Viên' : 'Khách vãng lai'}
            </span>
          </div>

          {/* 1. Candidate Mobile Links */}
          {isRoleCandidate && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isHomeActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">work</span>
                <span>Cổng Việc Làm</span>
              </button>

              <button
                onClick={() => handleNav('#/applications')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isCandidateAppsActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">fact_check</span>
                <span>Ứng Tuyển Của Tôi</span>
              </button>

              <button
                onClick={() => handleNav('#/ai-interview')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isInterviewActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>AI Practice Studio</span>
              </button>

              <button
                onClick={() => handleNav('#/profile')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isCandidateProfileActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span>Hồ Sơ CV &amp; Kỹ Năng</span>
              </button>

              <button
                onClick={() => handleNav('#/settings?tab=profile')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSettingsActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">manage_accounts</span>
                <span>Cài Đặt Tài Khoản &amp; Mật Khẩu</span>
              </button>
            </>
          )}

          {/* 2. Recruiter Mobile Links */}
          {isRoleRecruiter && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isHomeActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">travel_explore</span>
                <span>Cổng Việc Làm</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-jobs')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isRecruiterJobsActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">post_add</span>
                <span>Tin Tuyển Dụng</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-dashboard?tab=overview')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isRecruiterOverviewActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">analytics</span>
                <span>Báo Cáo Tuyển Dụng</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-profile')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isRecruiterCompanyActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">domain</span>
                <span>Hồ Sơ Doanh Nghiệp</span>
              </button>
            </>
          )}

          {/* 3. Guest Mobile Links */}
          {isGuest && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isHomeActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">work</span>
                <span>Cổng Việc Làm</span>
              </button>

              <button
                onClick={() => handleNav('#/ai-interview')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isInterviewActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>AI Practice Studio</span>
              </button>

              <button
                onClick={() => {
                  if (onSwitchDemoRole) onSwitchDemoRole('RECRUITER');
                  handleNav('#/recruiter-jobs');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[#8B5CF6] hover:bg-[#8B5CF6]/10 border-2 border-[#8B5CF6] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">business_center</span>
                <span>Dành Cho Doanh Nghiệp</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
