import React, { useState, useEffect } from 'react';

export default function RecruiterHeader({
  user,
  onLogout,
  onNavigate,
  currentRoute: propRoute,
}) {
  const [routeState, setRouteState] = useState(propRoute || window.location.hash || '#/recruiter-dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
      setRouteState(window.location.hash || '#/recruiter-dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const activeRoute = (propRoute || routeState || window.location.hash || '#/recruiter-dashboard').toLowerCase();

  const handleNav = (route) => {
    window.location.hash = route;
    setRouteState(route);
    if (onNavigate) onNavigate(route);
    setShowProfileMenu(false);
    setShowNotificationPopup(false);
    setMobileMenuOpen(false);
  };

  // Active link checkers
  const isOverviewActive =
    activeRoute.includes('recruiter-dashboard') &&
    !activeRoute.includes('tab=jobs') &&
    !activeRoute.includes('tab=pipeline') &&
    !activeRoute.includes('tab=company') &&
    !activeRoute.includes('tab=reports');

  const isJobsActive =
    activeRoute.includes('recruiter-jobs') ||
    activeRoute.includes('job-dashboard') ||
    activeRoute.includes('quan-ly-tin') ||
    (activeRoute.includes('recruiter-dashboard') && activeRoute.includes('tab=jobs'));

  const isApplicantsActive =
    activeRoute.includes('applicants-management') ||
    activeRoute.includes('job-applicants') ||
    activeRoute.includes('recruiter-applicants') ||
    activeRoute.includes('candidate-evaluation') ||
    (activeRoute.includes('recruiter-dashboard') && activeRoute.includes('tab=pipeline'));

  const isReportsActive =
    activeRoute.includes('tab=reports') ||
    activeRoute.includes('báo-cáo') ||
    activeRoute.includes('reports');

  const isCompanyActive =
    activeRoute.includes('recruiter-profile') ||
    activeRoute.includes('company-profile') ||
    (activeRoute.includes('recruiter-dashboard') && activeRoute.includes('tab=company'));

  // Notification State
  const [notificationTab, setNotificationTab] = useState('ALL');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'RECRUITMENT',
      title: 'Hồ sơ mới ứng tuyển',
      body: 'Ứng viên Trần Bảo Long đã nộp hồ sơ cho vị trí Senior Backend Engineer.',
      time: '10 phút trước',
      isRead: false,
      targetRoute: '#/applicants-management?jobId=101',
    },
    {
      id: 2,
      type: 'AI_MATCH',
      title: 'AI Match phát hiện hồ sơ xuất sắc 94%',
      body: 'Hệ thống đánh giá ứng viên Lê Hoàng Nam khớp 94% với yêu cầu công việc.',
      time: '25 phút trước',
      isRead: false,
      targetRoute: '#/applicants-management?jobId=101',
    },
    {
      id: 3,
      type: 'RECRUITMENT',
      title: 'Lịch phỏng vấn sắp tới',
      body: 'Phỏng vấn kỹ thuật với ứng viên Vũ Đức Thịnh lúc 14:00 hôm nay.',
      time: '1 giờ trước',
      isRead: true,
      targetRoute: '#/applicants-management?jobId=101',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const displayName = user?.fullName || 'Nguyễn Minh Anh';
  const companyName = user?.companyName || 'FPT Software';
  const avatarUrl =
    user?.avatarUrl ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5E1D8] shadow-sm transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left: HireMate.AI Logo & Recruiter Portal Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNav('#/recruiter-dashboard')}
            className="flex items-center gap-2.5 group cursor-pointer text-left bg-transparent border-none p-0 shrink-0"
            title="HireMate.AI Recruiter Dashboard"
          >
            <div className="h-9 w-9 rounded-xl bg-[#F58220] flex items-center justify-center shadow-sm group-hover:bg-[#E07216] transition-colors">
              <span className="material-symbols-outlined text-white text-[22px]">hub</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#1F2933] leading-none">
                HireMate<span className="text-[#F58220]">.AI</span>
              </span>
              <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider leading-none mt-0.5 uppercase">
                Recruiter Portal
              </span>
            </div>
          </button>
        </div>

        {/* Center: Recruiter Navigation */}
        <nav className="hidden lg:flex items-center gap-1 font-sans text-sm font-medium shrink-0">
          <button
            onClick={() => handleNav('#/recruiter-dashboard')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${isOverviewActive
              ? 'bg-[#1F2933] text-white shadow-sm font-semibold'
              : 'text-[#6B7280] hover:text-[#1F2933] hover:bg-[#FAF9F6]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => handleNav('#/recruiter-jobs')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${isJobsActive
              ? 'bg-[#1F2933] text-white shadow-sm font-semibold'
              : 'text-[#6B7280] hover:text-[#1F2933] hover:bg-[#FAF9F6]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">work</span>
            <span>Tin tuyển dụng</span>
          </button>

          <button
            onClick={() => handleNav('#/applicants-management')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${isApplicantsActive
              ? 'bg-[#1F2933] text-white shadow-sm font-semibold'
              : 'text-[#6B7280] hover:text-[#1F2933] hover:bg-[#FAF9F6]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            <span>Ứng viên</span>
          </button>

          <button
            onClick={() => handleNav('#/recruiter-dashboard?tab=reports')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${isReportsActive
              ? 'bg-[#1F2933] text-white shadow-sm font-semibold'
              : 'text-[#6B7280] hover:text-[#1F2933] hover:bg-[#FAF9F6]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span>Báo cáo</span>
          </button>

          <button
            onClick={() => handleNav('#/recruiter-profile')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${isCompanyActive
              ? 'bg-[#1F2933] text-white shadow-sm font-semibold'
              : 'text-[#6B7280] hover:text-[#1F2933] hover:bg-[#FAF9F6]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            <span>Hồ sơ công ty</span>
          </button>
        </nav>

        {/* Right: Actions, Notifications & Recruiter Profile */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Primary CTA: + Đăng tin mới */}
          <button
            onClick={() => handleNav('#/recruiter-jobs?action=new')}
            className="hidden sm:flex items-center gap-1.5 bg-[#F58220] hover:bg-[#E07216] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span>Đăng tin mới</span>
          </button>

          {/* Notifications Center Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="relative p-2 rounded-lg bg-white border border-[#E5E1D8] text-[#1F2933] hover:bg-[#FAF9F6] transition-all cursor-pointer flex items-center justify-center"
              title="Thông báo"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#F58220] text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white border border-[#E5E1D8] shadow-lg p-4 z-50 font-sans text-[#1F2933]">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1F2933]">Thông Báo</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#F58220] hover:underline cursor-pointer font-semibold"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markAsRead(item.id);
                        setShowNotificationPopup(false);
                        if (item.targetRoute) handleNav(item.targetRoute);
                      }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 hover:bg-[#FAF9F6] ${!item.isRead ? 'bg-[#FFFDF5] border border-[#F58220]/20' : 'opacity-80'
                        }`}
                    >
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-[#F58220]/15 text-[#F58220] mt-0.5">
                        <span className="material-symbols-outlined text-sm">notifications</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs truncate ${!item.isRead ? 'text-[#1F2933] font-bold' : 'text-[#6B7280] font-medium'}`}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed mt-0.5">
                          {item.body}
                        </p>
                        <span className="text-[10px] text-[#9CA3AF] block mt-1">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recruiter Profile Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-2.5 border-l border-[#E5E1D8] cursor-pointer select-none shrink-0 group hover:opacity-90 transition-opacity bg-transparent border-none text-left"
              type="button"
            >
              <div className="relative w-9 h-9 min-w-[36px] min-h-[36px] shrink-0 rounded-full bg-white border border-[#E5E1D8] shadow-sm p-0.5">
                {!avatarError ? (
                  <img
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover shrink-0 block bg-[#FAF9F6]"
                    src={avatarUrl}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1F2933] flex items-center justify-center font-bold text-xs text-white">
                    HR
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-[#10B981]"></span>
              </div>

              <div className="hidden xl:flex flex-col text-left shrink-0">
                <span className="font-bold text-xs text-[#1F2933] flex items-center gap-1 group-hover:text-[#F58220] transition-colors">
                  {displayName}
                  <span className="material-symbols-outlined text-sm text-[#6B7280]">expand_more</span>
                </span>
                <span className="text-[10px] font-medium text-[#6B7280]">
                  {companyName}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E5E1D8] shadow-lg py-2 z-50 font-sans text-[#1F2933]">
                <div className="px-4 py-3 border-b border-[#E5E1D8]">
                  <p className="text-xs font-bold text-[#1F2933] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{companyName} &bull; Nhà tuyển dụng</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleNav('#/recruiter-profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#1F2933] hover:bg-[#FAF9F6] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-[#6B7280]">domain</span>
                    <span>Hồ sơ công ty</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleNav('#/settings?tab=profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#1F2933] hover:bg-[#FAF9F6] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-[#6B7280]">settings</span>
                    <span>Cài đặt tài khoản</span>
                  </button>
                </div>

                <div className="border-t border-[#E5E1D8] pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#EF4444] font-semibold hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-white border border-[#E5E1D8] text-[#1F2933] hover:bg-[#FAF9F6] transition-all cursor-pointer flex items-center justify-center"
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
        <div className="lg:hidden border-t border-[#E5E1D8] bg-white px-4 py-3 space-y-1 font-sans">
          <button
            onClick={() => handleNav('#/recruiter-dashboard')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold ${isOverviewActive ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
              }`}
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Tổng quan</span>
          </button>
          <button
            onClick={() => handleNav('#/recruiter-jobs')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold ${isJobsActive ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
              }`}
          >
            <span className="material-symbols-outlined text-base">work</span>
            <span>Tin tuyển dụng</span>
          </button>
          <button
            onClick={() => handleNav('#/applicants-management')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold ${isApplicantsActive ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
              }`}
          >
            <span className="material-symbols-outlined text-base">group</span>
            <span>Ứng viên</span>
          </button>
          <button
            onClick={() => handleNav('#/recruiter-dashboard?tab=reports')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold ${isReportsActive ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
              }`}
          >
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>Báo cáo</span>
          </button>
          <button
            onClick={() => handleNav('#/recruiter-profile')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold ${isCompanyActive ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
              }`}
          >
            <span className="material-symbols-outlined text-base">domain</span>
            <span>Hồ sơ công ty</span>
          </button>

          <div className="pt-2 border-t border-[#E5E1D8]">
            <button
              onClick={() => handleNav('#/recruiter-jobs?action=new')}
              className="w-full bg-[#F58220] text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              <span>Đăng tin mới</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
