import React, { useState, useEffect, useRef } from 'react';
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

  const isCandidatePricingActive = 
    isRoleCandidate && (
      activeRoute.includes('candidate-pricing') || 
      activeRoute.includes('candidate-subscription') || 
      activeRoute.includes('goi-ung-vien')
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

  const isRecruiterPricingActive = 
    isRoleRecruiter && (
      activeRoute.includes('recruiter-pricing') || 
      activeRoute.includes('pricing') || 
      activeRoute.includes('subscription') || 
      activeRoute.includes('goi-dich-vu') || 
      activeRoute.includes('mua-goi')
    );

  // Notification Center State (Connected to live Spring Boot API)
  const [notificationTab, setNotificationTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'RECRUITMENT' | 'AI_STUDIO'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch real notifications from backend
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await import('../../api/notificationApi').then(m => m.default.getNotifications());
      const data = res?.data || res || [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((n) => {
          let icon = 'notifications';
          let color = 'secondary';
          let targetRoute = '#/';
          let category = 'RECRUITMENT';

          if (n.type === 'INTERVIEW_RESULT' || n.type === 'INTERVIEW_FEEDBACK') {
            icon = 'psychology';
            color = 'primary';
            targetRoute = '#/ai-interview';
            category = 'AI_STUDIO';
          } else if (n.type === 'APPLICATION_STATUS') {
            icon = 'calendar_today';
            color = 'secondary';
            targetRoute = isRoleRecruiter ? '#/recruiter-jobs' : '#/applications';
            category = 'RECRUITMENT';
          } else if (n.type === 'AI_MATCH_DONE') {
            icon = 'auto_awesome';
            color = 'tertiary';
            targetRoute = n.refId ? `#/jobs/${n.refId}` : '#/';
            category = 'RECRUITMENT';
          }

          // Format relative time
          let timeStr = 'Vừa xong';
          if (n.createdAt) {
            const diffMs = new Date() - new Date(n.createdAt);
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays > 0) timeStr = `${diffDays} ngày trước`;
            else if (diffHours > 0) timeStr = `${diffHours} giờ trước`;
            else if (diffMins > 0) timeStr = `${diffMins} phút trước`;
            else timeStr = 'Vừa xong';
          }

          return {
            id: n.notificationId,
            type: category,
            rawType: n.type,
            title: n.title,
            body: n.body,
            time: timeStr,
            isRead: !!n.isRead,
            targetRoute,
            icon,
            color,
          };
        });
        setNotifications(mapped);
        const newUnread = mapped.filter(n => !n.isRead).length;
        if (prevUnreadCountRef.current !== -1 && newUnread > prevUnreadCountRef.current) {
          playNotificationChime();
        }
        prevUnreadCountRef.current = newUnread;
        setUnreadCount(newUnread);
      } else {
        // Default notifications matching mockup style
        setNotifications([
          {
            id: 101,
            type: 'RECRUITMENT',
            title: 'Đăng nhập thành công',
            body: 'Hệ thống ghi nhận phiên đăng nhập an toàn vào tài khoản của bạn.',
            time: '6 phút trước',
            isRead: false,
            targetRoute: '#/',
            icon: 'notifications',
            color: 'secondary',
          },
          {
            id: 102,
            type: 'RECRUITMENT',
            title: 'Đăng nhập thành công',
            body: 'Hệ thống ghi nhận phiên đăng nhập an toàn vào tài khoản của bạn.',
            time: '22 giờ trước',
            isRead: false,
            targetRoute: '#/',
            icon: 'notifications',
            color: 'secondary',
          }
        ]);
        setUnreadCount(2);
      }
    } catch (e) {
      console.warn('Could not fetch notifications from API, using cached view', e);
    }
  };

  const prevUnreadCountRef = useRef(-1);

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Ignored if autoplay policy blocks audio
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    const handleSync = () => fetchNotifications();
    window.addEventListener('hiremate-notification-sync', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hiremate-notification-sync', handleSync);
    };
  }, [user]);

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      const api = await import('../../api/notificationApi').then(m => m.default);
      await api.markAllAsRead();
    } catch (e) {
      console.warn('API markAllAsRead error', e);
    }
  };

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const api = await import('../../api/notificationApi').then(m => m.default);
      await api.markAsRead(id);
    } catch (e) {
      console.warn('API markAsRead error', e);
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const target = notifications.find(n => n.id === id);
      return (target && !target.isRead) ? Math.max(0, prev - 1) : prev;
    });
    try {
      const api = await import('../../api/notificationApi').then(m => m.default);
      await api.deleteNotification(id);
    } catch (e) {
      console.warn('API deleteNotification error', e);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo không?')) return;
    setNotifications([]);
    setUnreadCount(0);
    try {
      const api = await import('../../api/notificationApi').then(m => m.default);
      await api.clearAll();
    } catch (e) {
      console.warn('API clearAll error', e);
    }
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
    <header className="sticky top-0 z-50 w-full bg-[#32247b] text-white shadow-xl transition-all duration-500 rounded-t-2xl md:rounded-t-3xl border-b border-indigo-900/50">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Status Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={() => handleNav('#/')} 
            className="flex items-center gap-2 group cursor-pointer text-left bg-transparent border-none p-0 shrink-0"
            title="HireMate AI Mindskills Portal"
          >
            <div className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl bg-white text-[#32247b] flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px] font-bold text-[#5b48bd]">psychology</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  HireMate<span className="text-[#10b981]">.AI</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-purple-200 text-[9px] font-semibold border border-white/10">
                  v2.0
                </span>
              </div>
              <span className="hidden 2xl:block text-[9px] font-medium text-purple-200 tracking-wider leading-none mt-0.5 uppercase">
                Mindskills Matching Platform
              </span>
            </div>
          </button>
        </div>

        {/* Center: Synchronized Role-Based Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 font-sans text-[11px] xl:text-xs uppercase tracking-wider shrink-0">
          {/* =================================================== */}
          {/* 1. CANDIDATE NAVBAR LINKS                           */}
          {/* =================================================== */}
          {isRoleCandidate && (
            <>
              <button
                onClick={() => handleNav('#/')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold flex items-center gap-1.5 ${
                  isHomeActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span>VIỆC LÀM</span>
              </button>

              <button
                onClick={() => handleNav('#/applications')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold flex items-center gap-1.5 ${
                  isCandidateAppsActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                <span>ỨNG TUYỂN</span>
              </button>

              <button
                onClick={() => handleNav('#/ai-interview')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold flex items-center gap-1.5 ${
                  isInterviewActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>AI STUDIO</span>
              </button>

              <button
                onClick={() => handleNav('#/profile')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold flex items-center gap-1.5 ${
                  isCandidateProfileActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
                title="Tạo và quản lý các bản CV ứng tuyển việc làm"
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>QUẢN LÝ CV</span>
              </button>

              <button
                onClick={() => handleNav('#/candidate-pricing')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold flex items-center gap-1.5 ${
                  isCandidatePricingActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill text-amber-300 hover:text-amber-200'
                }`}
                title="Bảng giá các gói ứng viên &amp; lượt AI Voice Mock Interview"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">workspace_premium</span>
                <span>GÓI DỊCH VỤ</span>
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
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isHomeActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
                title="Cổng việc làm công khai trên thị trường"
              >
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span>VIỆC LÀM</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-jobs')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterJobsActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
                title="Quản lý tin đăng tuyển dụng & tỷ lệ 70/30"
              >
                <span className="material-symbols-outlined text-[16px]">post_add</span>
                <span>TIN ĐĂNG</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-dashboard?tab=overview')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterOverviewActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
                title="Báo cáo phân tích hiệu suất tuyển dụng & chỉ số Time-to-Hire"
              >
                <span className="material-symbols-outlined text-[16px]">analytics</span>
                <span>BÁO CÁO</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-profile')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterCompanyActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
                title="Hồ sơ công ty, quy mô & thương hiệu doanh nghiệp"
              >
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>HỒ SƠ CÔNG TY</span>
              </button>

              <button
                onClick={() => handleNav('#/recruiter-pricing')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isRecruiterPricingActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill text-amber-300 hover:text-amber-200'
                }`}
                title="Bảng giá các gói dịch vụ & mua thêm lượt AI Matching"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">workspace_premium</span>
                <span>GÓI DỊCH VỤ</span>
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
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isHomeActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span>VIỆC LÀM</span>
              </button>

              <button
                onClick={() => handleNav('#/ai-interview')}
                className={`px-2.5 py-1.5 xl:px-3.5 xl:py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isInterviewActive
                    ? 'mindskills-active-pill'
                    : 'mindskills-inactive-pill'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>AI STUDIO</span>
              </button>

              <button
                onClick={() => handleNav('#/login')}
                className="px-3 py-1.5 rounded-full text-emerald-300 hover:bg-emerald-500/20 border border-emerald-400/40 transition-all duration-300 cursor-pointer font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">business_center</span>
                <span>DOANH NGHIỆP</span>
              </button>
            </>
          )}
        </nav>


        {/* Right Actions: Quick Role Switcher, Alerts, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">


          {/* Quick Action Buttons for Recruiter: + Nâng Cấp Gói & Đăng Tin Tuyển Dụng */}
          {isRoleRecruiter && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={() => handleNav('#/recruiter-pricing')}
                className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-extrabold tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition-all hover:scale-105 border border-amber-300/40"
                title="Xem bảng giá và nâng cấp gói tuyển dụng VIP"
              >
                <span className="material-symbols-outlined text-xs font-bold animate-bounce">workspace_premium</span>
                <span>NÂNG CẤP GÓI</span>
              </button>

              <button
                onClick={() => {
                  const targetHash = `#/recruiter-jobs?action=new&t=${Date.now()}`;
                  handleNav(targetHash);
                }}
                className="px-2.5 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-xs font-bold">add_circle</span>
                <span>ĐĂNG TIN MỚI</span>
              </button>
            </div>
          )}

          {/* Saved Jobs (for Candidate) & Quick Upgrade Pro */}
          {isRoleCandidate && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNav('#/candidate-pricing')}
                className="hidden lg:flex px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-extrabold tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition-all hover:scale-105 border border-amber-300/40"
                title="Xem bảng giá và nâng cấp gói Candidate Pro AI"
              >
                <span className="material-symbols-outlined text-xs font-bold animate-bounce">workspace_premium</span>
                <span>NÂNG CẤP PRO</span>
              </button>

              <button
                onClick={() => handleNav('#/candidate-dashboard?tab=applications')}
                className="relative p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/20"
                title="Việc làm đã lưu"
              >
                <span className="material-symbols-outlined text-lg">bookmark</span>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#f97316] text-white text-[9px] font-bold">
                  5
                </span>
              </button>
            </div>
          )}

          {/* Notifications Center Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer flex items-center justify-center border border-white/20"
                title="Trung tâm thông báo hệ thống"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#C27B66] text-white text-[9px] font-bold shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationPopup && (
                <div className="absolute right-0 mt-3 w-88 sm:w-[410px] rounded-[28px] bg-white border border-indigo-100 shadow-[0_20px_50px_rgba(50,36,123,0.22)] p-5 z-50 font-body text-slate-900 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-[#32247b]">Trung Tâm Thông Báo</span>
                      {unreadCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#5b46e0] border border-indigo-100 shadow-xs">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#5b46e0] hover:text-[#32247b] transition-all cursor-pointer flex items-center gap-1 font-bold"
                          title="Đánh dấu tất cả là đã đọc"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">done_all</span>
                          <span>Đã đọc</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-slate-400 hover:text-red-500 transition-all cursor-pointer flex items-center gap-1 font-semibold ml-1"
                          title="Xóa sạch toàn bộ thông báo"
                        >
                          <span className="material-symbols-outlined text-sm">delete_sweep</span>
                          <span>Xóa hết</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-full border border-slate-200/70 text-xs mb-3.5">
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
                      { id: 'RECRUITMENT', label: 'Tuyển dụng' },
                      { id: 'AI_STUDIO', label: 'AI Studio' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setNotificationTab(tab.id)}
                        className={`flex-1 py-1.5 text-center rounded-full font-bold transition-all cursor-pointer text-xs ${
                          notificationTab === tab.id
                            ? 'bg-[#32247b] text-white shadow-md'
                            : 'text-slate-600 hover:text-[#32247b]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-84 overflow-y-auto space-y-3 pr-0.5">
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
                          className={`group p-3.5 rounded-[20px] transition-all cursor-pointer flex items-start gap-3.5 relative border ${
                            !item.isRead 
                              ? 'bg-indigo-50/80 border-indigo-200/80 hover:bg-indigo-50 shadow-xs' 
                              : 'bg-slate-50/70 border-slate-200/70 opacity-80 hover:opacity-100 hover:bg-slate-100'
                          }`}
                        >
                          {/* Indigo Circle Icon matching Homepage brand theme */}
                          <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-[#32247b] text-white shadow-md group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-lg">{item.icon || 'notifications'}</span>
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className={`text-xs sm:text-sm truncate ${!item.isRead ? 'text-[#32247b] font-bold' : 'text-slate-700 font-semibold'}`}>
                                {item.title}
                              </h4>
                              {!item.isRead && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#5b46e0] shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1 font-sans">
                              {item.body}
                            </p>
                            <span className="text-[11px] text-slate-400 font-mono block mt-1.5 font-medium">
                              {item.time}
                            </span>
                          </div>

                          {/* Delete Action Button */}
                          <button
                            type="button"
                            onClick={(e) => deleteNotification(item.id, e)}
                            title="Xóa thông báo này"
                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ))}

                    {notifications.filter((n) => notificationTab === 'UNREAD' ? !n.isRead : notificationTab === 'RECRUITMENT' ? n.type === 'RECRUITMENT' : notificationTab === 'AI_STUDIO' ? n.type === 'AI_STUDIO' : true).length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                        <span className="material-symbols-outlined text-2xl text-slate-300">notifications_off</span>
                        <p>Không có thông báo nào trong mục này</p>
                      </div>
                    )}
                  </div>

                  {/* Footer action */}
                  <div className="pt-3 mt-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setShowNotificationPopup(false);
                        handleNav(isRoleRecruiter ? '#/recruiter-dashboard?tab=overview' : '#/applications');
                      }}
                      className="text-xs font-bold text-[#5b46e0] hover:text-[#32247b] transition-colors cursor-pointer tracking-wide flex items-center justify-center gap-1 mx-auto"
                    >
                      <span>Xem lịch sử hoạt động chi tiết →</span>
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

                <div className="hidden xl:flex flex-col text-left shrink-0 max-w-[110px]">
                  <span className="font-serif font-bold text-xs text-[#2D3A31] flex items-center gap-0.5 group-hover:text-[#C27B66] transition-colors truncate">
                    <span className="truncate">{displayName}</span>
                    <span className="material-symbols-outlined text-sm text-[#8C9A84] shrink-0">expand_more</span>
                  </span>
                  <span className="hidden 2xl:block font-body text-[10px] font-semibold text-[#8C9A84] truncate">
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
                        onClick={() => { setShowProfileMenu(false); handleNav('#/candidate-pricing'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#d97706] font-bold hover:bg-[#fffbeb] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#f59e0b]">workspace_premium</span>
                        <span>Nâng Cấp Gói Pro AI &amp; Pass</span>
                      </button>
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
                        onClick={() => { setShowProfileMenu(false); handleNav('#/recruiter-pricing'); }}
                        className="w-full text-left px-4 py-2 text-xs text-[#d97706] font-bold hover:bg-[#fffbeb] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#f59e0b]">workspace_premium</span>
                        <span>Gói Dịch Vụ &amp; Nâng Cấp VIP</span>
                      </button>
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
                onClick={() => handleNav('#/candidate-pricing')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isCandidatePricingActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#d97706] hover:text-[#b45309] hover:bg-amber-50'
                }`}
              >
                <span className="material-symbols-outlined text-base text-amber-500">workspace_premium</span>
                <span>Gói Dịch Vụ Ứng Viên</span>
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

              <button
                onClick={() => handleNav('#/recruiter-pricing')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isRecruiterPricingActive
                    ? 'bg-[#FBBF24] text-[#1E293B] shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B] font-black'
                    : 'text-[#d97706] hover:text-[#b45309] hover:bg-amber-50'
                }`}
              >
                <span className="material-symbols-outlined text-base text-amber-500">workspace_premium</span>
                <span>Gói Dịch Vụ Tuyển Dụng</span>
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
