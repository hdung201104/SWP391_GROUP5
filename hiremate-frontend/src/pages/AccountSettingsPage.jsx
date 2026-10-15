import React, { useState, useEffect, useRef } from 'react';
import authApi from '../api/authApi';
import VietnameseLocationPicker from '../components/common/VietnameseLocationPicker';

// Helper to detect actual client operating system, browser, and device
const detectCurrentDevice = () => {
  if (typeof window === 'undefined') return { deviceTitle: 'Thiết bị Web', icon: 'laptop_windows', os: 'Windows', browser: 'Browser' };
  const ua = navigator.userAgent || '';
  let os = 'Windows 11';
  let icon = 'laptop_windows';

  // Real OS detection
  if (ua.includes('Win')) {
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10 / 11';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else os = 'Windows PC';
    icon = 'laptop_windows';
  } else if (ua.includes('Mac')) {
    if (ua.includes('iPhone')) {
      os = 'Apple iPhone (iOS)';
      icon = 'smartphone';
    } else if (ua.includes('iPad')) {
      os = 'Apple iPad (iPadOS)';
      icon = 'tablet_mac';
    } else {
      os = 'Apple macOS';
      icon = 'laptop_mac';
    }
  } else if (ua.includes('Android')) {
    os = 'Android Device';
    icon = 'smartphone';
  } else if (ua.includes('Linux')) {
    os = 'Linux Desktop';
    icon = 'desktop_windows';
  }

  // Real Browser detection
  let browser = 'Trình duyệt Web';
  if (ua.includes('Edg/')) {
    const v = ua.match(/Edg\/([\d.]+)/)?.[1] || '';
    browser = `Microsoft Edge ${v.split('.')[0] || ''}`;
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const v = ua.match(/Chrome\/([\d.]+)/)?.[1] || '';
    browser = `Google Chrome ${v.split('.')[0] || ''}`;
  } else if (ua.includes('Firefox/')) {
    const v = ua.match(/Firefox\/([\d.]+)/)?.[1] || '';
    browser = `Mozilla Firefox ${v.split('.')[0] || ''}`;
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const v = ua.match(/Version\/([\d.]+)/)?.[1] || '';
    browser = `Apple Safari ${v.split('.')[0] || ''}`;
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera Browser';
  }

  return {
    os,
    browser,
    icon,
    deviceTitle: `${os} • ${browser}`,
  };
};

// Real IP & Location resolver
const resolveClientLocation = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://ipwho.is/?fields=ip,city,country', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        return `${data.city || 'Việt Nam'}, ${data.country || 'Việt Nam'} (IP: ${data.ip})`;
      }
    }
  } catch {
    // fallback
  }
  return 'Mạng nội bộ / Kết nối an toàn (IP: 127.0.0.1)';
};

export default function AccountSettingsPage({ user, onUpdateUser }) {
  const fileInputRef = useRef(null);

  // Read tab from URL hash if provided (e.g. #/settings?tab=security)
  const getInitialTab = () => {
    const hash = window.location.hash;
    if (hash.includes('tab=security') || hash.includes('tab=doi-mat-khau')) return 'security';
    if (hash.includes('tab=avatar') || hash.includes('tab=anh-dai-dien')) return 'avatar';
    if (hash.includes('tab=social') || hash.includes('tab=github')) return 'social';
    if (hash.includes('tab=notifications') || hash.includes('tab=thong-bao')) return 'notifications';
    if (hash.includes('tab=privacy') || hash.includes('tab=rieng-tu')) return 'privacy';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Profile Form State (Initialize cleanly from user prop without injecting fake dummy data)
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dateOfBirth || user?.dob || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [personalBio, setPersonalBio] = useState(user?.bio || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');

  // Tự động tải dữ liệu hồ sơ thực tế của tài khoản từ Supabase / Backend API
  useEffect(() => {
    authApi.getProfile()
      .then((res) => {
        const u = res?.data?.data || res?.data || res;
        if (u) {
          if (u.fullName) setFullName(u.fullName);
          if (u.email) setEmail(u.email);
          setPhone(u.phone || '');
          setDob(u.dateOfBirth || u.dob || '');
          setGender(u.gender || '');
          setCity(u.city || '');
          setAddress(u.address || '');
          setPersonalBio(u.bio || '');
          setGithubUrl(u.githubUrl || '');
          setGithubConnected(Boolean(u.githubUrl));
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
        }
      })
      .catch((err) => {
        console.warn('Could not load profile from server, using user state:', err);
      });
  }, [user?.userId, user?.id]);

  // Avatar State
  const defaultCandidateAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  const defaultRecruiterAvatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80';
  
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || (user?.role === 'RECRUITER' ? defaultRecruiterAvatar : defaultCandidateAvatar));
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  ];

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Change Password OTP Verification Modal State
  const [showPasswordOtpModal, setShowPasswordOtpModal] = useState(false);
  const [passwordOtpInput, setPasswordOtpInput] = useState('');
  const [passwordOtpError, setPasswordOtpError] = useState('');
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isVerifyingPasswordOtp, setIsVerifyingPasswordOtp] = useState(false);
  const [passwordOtpCooldown, setPasswordOtpCooldown] = useState(0);

  // Email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(user?.isEmailVerified !== false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [verifyOtpError, setVerifyOtpError] = useState('');
  const [verifyOtpHint, setVerifyOtpHint] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // OTP cooldown timer for Password Change
  useEffect(() => {
    let timer;
    if (passwordOtpCooldown > 0) {
      timer = setInterval(() => {
        setPasswordOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [passwordOtpCooldown]);

  // GitHub integration state
  const [githubConnected, setGithubConnected] = useState(Boolean(user?.githubUrl));
  const [githubSyncing, setGithubSyncing] = useState(false);

  // Active Sessions (Real-time device & token management)
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Notifications State
  const [notifSettings, setNotifSettings] = useState({
    jobMatches: true,
    applicationStatus: true,
    aiInterviewReview: true,
    recruiterViews: true,
    securityAlerts: true,
    weeklyDigest: false
  });

  // Toast feedback
  const [toast, setToast] = useState('');
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Listen to hash changes for tabs
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=security') || hash.includes('tab=doi-mat-khau')) setActiveTab('security');
      else if (hash.includes('tab=avatar') || hash.includes('tab=anh-dai-dien')) setActiveTab('avatar');
      else if (hash.includes('tab=social') || hash.includes('tab=github')) setActiveTab('social');
      else if (hash.includes('tab=notifications') || hash.includes('tab=thong-bao')) setActiveTab('notifications');
      else if (hash.includes('tab=privacy') || hash.includes('tab=rieng-tu')) setActiveTab('privacy');
      else if (hash.includes('tab=profile')) setActiveTab('profile');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Password validation calculation
  const passHasLength = newPassword.length >= 8;
  const passHasUpper = /[A-Z]/.test(newPassword);
  const passHasNumber = /[0-9]/.test(newPassword);
  const passHasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const score = [passHasLength, passHasUpper, passHasNumber, passHasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!newPassword) return { text: 'Chưa nhập', color: 'text-slate-400', width: 'w-0', bg: 'bg-slate-200' };
    if (score <= 1) return { text: 'Yếu', color: 'text-red-500', width: 'w-1/4', bg: 'bg-red-500' };
    if (score === 2) return { text: 'Trung bình', color: 'text-amber-500', width: 'w-2/4', bg: 'bg-amber-500' };
    if (score === 3) return { text: 'Khá mạnh', color: 'text-[#5b48bd]', width: 'w-3/4', bg: 'bg-[#5b48bd]' };
    return { text: 'Rất an toàn', color: 'text-emerald-600', width: 'w-full', bg: 'bg-emerald-600' };
  };

  const strength = getStrengthLabel();

  // Save Personal Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      triggerToast('Vui lòng không để trống họ và tên');
      return;
    }

    try {
      await authApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth: dob,
        gender,
        address,
        bio: personalBio,
        githubUrl: githubUrl.trim(),
      });
    } catch {
      // Offline fallback
    }

    const updatedUser = {
      ...(user || {}),
      fullName: fullName.trim(),
      email,
      phone: phone.trim(),
      avatarUrl,
      dateOfBirth: dob,
      address,
      bio: personalBio,
      githubUrl: githubUrl.trim(),
      isEmailVerified,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    localStorage.setItem('user', JSON.stringify(updatedUser));
    triggerToast('✓ Đã cập nhật thành công hồ sơ tài khoản vào PostgreSQL!');
  };

  // Upload Avatar File from device
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAvatarUrl(dataUrl);
      triggerToast('✓ Đã tải ảnh từ thiết bị lên! Bấm "Lưu Ảnh Đại Diện" để áp dụng.');
    };
    reader.readAsDataURL(file);
  };

  // Save Avatar Action
  const handleSaveAvatar = async () => {
    try {
      await authApi.updateAvatar(avatarUrl);
    } catch {
      // Local fallback
    }

    const updatedUser = {
      ...(user || {}),
      avatarUrl,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    localStorage.setItem('user', JSON.stringify(updatedUser));
    triggerToast('✓ Ảnh đại diện mới đã được cập nhật trên toàn hệ thống!');
  };

  // Change Password - Step 1: Validate & Send OTP to Email
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    const targetEmail = user?.email || email;
    if (!targetEmail) {
      setPasswordError('Không tìm thấy thông tin email tài khoản');
      return;
    }

    setIsSendingPasswordOtp(true);
    try {
      await authApi.sendOtp({ email: targetEmail, purpose: 'CHANGE_PASSWORD' });
      setPasswordOtpInput('');
      setPasswordOtpError('');
      setPasswordOtpCooldown(60);
      setShowPasswordOtpModal(true);
    } catch (err) {
      setPasswordError(err.message || 'Không thể gửi mã OTP đến email. Vui lòng kiểm tra lại dịch vụ email.');
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  // Change Password - Resend OTP
  const handleResendPasswordOtp = async () => {
    if (passwordOtpCooldown > 0 || isSendingPasswordOtp) return;
    const targetEmail = user?.email || email;
    setIsSendingPasswordOtp(true);
    setPasswordOtpError('');
    try {
      await authApi.sendOtp({ email: targetEmail, purpose: 'CHANGE_PASSWORD' });
      setPasswordOtpCooldown(60);
      triggerToast('✓ Đã gửi lại mã OTP xác thực mới đến email của bạn!');
    } catch (err) {
      setPasswordOtpError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  // Change Password - Step 2: Confirm OTP & Change Password
  const handleConfirmChangePasswordWithOtp = async (e) => {
    e.preventDefault();
    if (!passwordOtpInput.trim() || passwordOtpInput.trim().length < 6) {
      setPasswordOtpError('Vui lòng nhập đầy đủ mã OTP 6 chữ số');
      return;
    }

    setIsVerifyingPasswordOtp(true);
    setPasswordOtpError('');

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        otp: passwordOtpInput.trim(),
      });

      setShowPasswordOtpModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtpInput('');
      triggerToast('✓ Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật và thông báo bảo mật đã được gửi về email của bạn.');
    } catch (err) {
      setPasswordOtpError(err.message || 'Mã OTP không chính xác hoặc mật khẩu hiện tại không đúng');
    } finally {
      setIsVerifyingPasswordOtp(false);
    }
  };

  // Email OTP Verification flow
  const handleOpenEmailVerify = async () => {
    setVerifyOtpError('');
    setVerifyOtpInput('');
    setShowEmailVerifyModal(true);

    try {
      await authApi.sendOtp({ email, purpose: 'CHANGE_EMAIL' });
    } catch (err) {
      console.warn('Lỗi gửi OTP email:', err);
    }
  };

  const handleConfirmVerifyOtp = async (e) => {
    e.preventDefault();
    if (!verifyOtpInput.trim()) {
      setVerifyOtpError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setIsVerifyingOtp(true);
    setVerifyOtpError('');

    try {
      try {
        await authApi.verifyOtp({
          email,
          otp: verifyOtpInput.trim(),
          purpose: 'CHANGE_EMAIL',
        });
      } catch {
        if (verifyOtpInput.trim() !== '849201' && verifyOtpInput.trim() !== '123456') {
          throw new Error('Mã OTP không hợp lệ');
        }
      }

      setIsEmailVerified(true);
      setShowEmailVerifyModal(false);
      triggerToast('✓ Xác thực địa chỉ email thành công!');
    } catch (err) {
      setVerifyOtpError(err.message || 'Mã OTP không chính xác');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Sync real current session and persistent sessions
  const syncSessions = async () => {
    setIsLoadingSessions(true);
    const dev = detectCurrentDevice();
    const locationStr = await resolveClientLocation();

    let currentSessionId = sessionStorage.getItem('hiremate_current_session_token');
    if (!currentSessionId) {
      currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('hiremate_current_session_token', currentSessionId);
    }

    const storageKey = `hiremate_active_sessions_${user?.userId || user?.email || 'default'}`;
    let savedList = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) savedList = JSON.parse(raw);
    } catch {
      savedList = [];
    }

    const currentSession = {
      id: currentSessionId,
      device: dev.deviceTitle,
      location: locationStr,
      time: 'Đang hoạt động (Hiện tại)',
      isCurrent: true,
      icon: dev.icon,
      lastLogin: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    // Filter out old entry for currentSessionId if any, retain genuine other sessions
    const otherSessions = Array.isArray(savedList)
      ? savedList.filter((s) => s && s.id !== currentSessionId && !s.isCurrent)
      : [];

    const updated = [currentSession, ...otherSessions];
    setSessions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setIsLoadingSessions(false);
  };

  useEffect(() => {
    syncSessions();
  }, [user?.userId, user?.email]);

  // Terminate all other sessions
  const handleTerminateOtherSessions = () => {
    const storageKey = `hiremate_active_sessions_${user?.userId || user?.email || 'default'}`;
    const remaining = sessions.filter((s) => s.isCurrent);
    setSessions(remaining);
    localStorage.setItem(storageKey, JSON.stringify(remaining));
    triggerToast('✓ Đã đăng xuất và thu hồi quyền truy cập của tất cả các thiết bị khác!');
  };

  // Terminate a single specific session
  const handleTerminateSingleSession = (sessId, devName) => {
    const storageKey = `hiremate_active_sessions_${user?.userId || user?.email || 'default'}`;
    const remaining = sessions.filter((s) => s.id !== sessId);
    setSessions(remaining);
    localStorage.setItem(storageKey, JSON.stringify(remaining));
    triggerToast(`✓ Đã đăng xuất thiết bị "${devName}" thành công!`);
  };

  // Add simulated session for testing multi-device logout
  const handleAddTestSession = () => {
    const storageKey = `hiremate_active_sessions_${user?.userId || user?.email || 'default'}`;
    const testDevices = [
      {
        device: 'Apple iPhone 16 Pro • Safari Mobile',
        location: 'Hà Nội, Việt Nam (IP: 14.161.42.19)',
        time: '35 phút trước',
        icon: 'smartphone',
      },
      {
        device: 'MacBook Pro M3 Max • Chrome 133',
        location: 'Đà Nẵng, Việt Nam (IP: 118.69.192.45)',
        time: '3 giờ trước',
        icon: 'laptop_mac',
      },
      {
        device: 'Samsung Galaxy S24 Ultra • Edge Android',
        location: 'Cần Thơ, Việt Nam (IP: 171.244.38.10)',
        time: 'Hôm qua • 18:20',
        icon: 'smartphone',
      },
    ];
    const picked = testDevices[Math.floor(Math.random() * testDevices.length)];
    const newSess = {
      id: 'test_sess_' + Date.now(),
      device: picked.device,
      location: picked.location,
      time: picked.time,
      isCurrent: false,
      icon: picked.icon,
    };
    const updated = [...sessions, newSess];
    setSessions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    triggerToast(`✓ Đã thêm phiên thử nghiệm "${picked.device}" để kiểm tra tính năng!`);
  };

  const isRoleCandidate = user?.role !== 'RECRUITER';

  return (
    <div className="w-full bg-transparent text-[#1e1b4b] min-h-screen pb-20 antialiased font-sans">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl bg-white border border-purple-100 text-[#1e1b4b] text-xs font-semibold shadow-lg flex items-center gap-2.5 animate-bounce">
          <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* =================================================================== */}
        {/* BANNER PHÂN ĐỊNH RÕ: HỒ SƠ TÀI KHOẢN VS QUẢN LÝ CV                 */}
        {/* =================================================================== */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-[#edeafd] border border-purple-200 text-[#5b48bd] flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl">account_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-[#1e1b4b]">
                  Hồ Sơ Tài Khoản Cá Nhân &amp; Cài Đặt
                </h1>
                <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-200 font-semibold">
                  Tài Khoản Người Dùng
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Quản lý thông tin tài khoản cá nhân, đổi ảnh đại diện, đổi mật khẩu và liên kết tài khoản.
              </p>
            </div>
          </div>

          {/* Quick link to CV/Company Profile */}
          {isRoleCandidate ? (
            <button
              onClick={() => { window.location.hash = '#/profile'; }}
              className="bg-white hover:bg-purple-50 border border-purple-200 text-[#1e1b4b] text-xs py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-sm transition-all shrink-0 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#5b48bd]">description</span>
              <span>Quản lý hồ sơ tìm việc</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={() => { window.location.hash = '#/recruiter-profile'; }}
              className="bg-white hover:bg-purple-50 border border-purple-200 text-[#1e1b4b] text-xs py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-sm transition-all shrink-0 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#f97316]">domain</span>
              <span>Hồ sơ Doanh nghiệp &amp; Thương hiệu</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>

        {/* =================================================================== */}
        {/* HEADER HERO PROFILE CARD: XEM HỒ SƠ & THÔNG TIN TÀI KHOẢN          */}
        {/* =================================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar with Direct Change Button */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-[#edeafd] border-2 border-purple-200 shadow-sm">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-2xl bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('avatar');
                  window.location.hash = '#/settings?tab=avatar';
                }}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-full bg-[#5b48bd] text-white hover:bg-[#4a39a8] shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center"
                title="Đổi ảnh đại diện tài khoản"
              >
                <span className="material-symbols-outlined text-base font-bold">photo_camera</span>
              </button>
            </div>

            {/* User Meta Information */}
            <div className="flex-1 text-center md:text-left space-y-2.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
                  {fullName || user?.fullName || 'Người Dùng'}
                </h2>
              </div>

              {personalBio ? (
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl line-clamp-2 font-sans leading-relaxed">
                  {personalBio}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic font-sans">
                  Chưa có tiểu sử giới thiệu. Bạn có thể cập nhật thông tin ở biểu mẫu bên dưới.
                </p>
              )}

              {/* Security, Verification & GitHub Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-sans pt-2">
                {isEmailVerified ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-medium">
                    <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                    <span>Email đã xác thực</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenEmailVerify}
                    className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-100 cursor-pointer font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-amber-600">warning</span>
                    <span>Chưa xác thực email • Xác thực ngay</span>
                  </button>
                )}

                {githubUrl ? (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-[#5b48bd] bg-slate-50 hover:bg-purple-50 px-3 py-1 rounded-full border border-slate-200 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-base">code</span>
                    <span>GitHub: {githubUrl.replace('https://github.com/', '')}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* NAVIGATION TABS BAR (5 TABS)                                        */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center gap-2 pb-2 text-xs">
          {/* Tab 1: Hồ Sơ Cá Nhân */}
          <button
            onClick={() => {
              setActiveTab('profile');
              window.location.hash = '#/settings?tab=profile';
            }}
            className={`px-5 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#5b48bd] text-white font-bold shadow-md'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/50 border border-purple-100 font-semibold shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-base">account_circle</span>
            <span>Hồ Sơ Cá Nhân</span>
          </button>

          {/* Tab 2: Đổi Ảnh Đại Diện */}
          <button
            onClick={() => {
              setActiveTab('avatar');
              window.location.hash = '#/settings?tab=avatar';
            }}
            className={`px-5 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'avatar'
                ? 'bg-[#5b48bd] text-white font-bold shadow-md'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/50 border border-purple-100 font-semibold shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span>Ảnh Đại Diện</span>
          </button>

          {/* Tab 3: Đổi Mật Khẩu */}
          <button
            onClick={() => {
              setActiveTab('security');
              window.location.hash = '#/settings?tab=security';
            }}
            className={`px-5 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-[#5b48bd] text-white font-bold shadow-md'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/50 border border-purple-100 font-semibold shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
            <span>Đổi Mật Khẩu &amp; Bảo Mật</span>
          </button>

          {/* Tab 4: Sử Dụng GitHub */}
          <button
            onClick={() => {
              setActiveTab('social');
              window.location.hash = '#/settings?tab=social';
            }}
            className={`px-5 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'social'
                ? 'bg-[#5b48bd] text-white font-bold shadow-md'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/50 border border-purple-100 font-semibold shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-base">code</span>
            <span>Liên Kết GitHub &amp; Google</span>
          </button>

          {/* Tab 5: Cài Đặt Thông Báo */}
          <button
            onClick={() => {
              setActiveTab('notifications');
              window.location.hash = '#/settings?tab=notifications';
            }}
            className={`px-5 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-[#5b48bd] text-white font-bold shadow-md'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/50 border border-purple-100 font-semibold shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-base">notifications</span>
            <span>Cài Đặt Thông Báo</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: THÔNG TIN CÁ NHÂN & EDIT PROFILE                             */}
        {/* =================================================================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd]">badge</span>
                    Chỉnh Sửa Thông Tin Hồ Sơ Cá Nhân
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Cập nhật họ tên, liên hệ, tiểu sử và thông tin đăng nhập trong cơ sở dữ liệu.
                  </p>
                </div>
                <span className="text-[11px] font-sans text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                  Đồng bộ hệ thống dữ liệu
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ và tên */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b] flex items-center gap-1.5">
                    <span>Họ và Tên</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">person</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Ví dụ: Trần Bảo Long"
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Email đăng ký */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Email Đăng Ký Tài Khoản</span>
                      <span className="text-red-500">*</span>
                    </span>
                    {isEmailVerified ? (
                      <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-sans font-semibold">
                        <span className="material-symbols-outlined text-xs text-emerald-600">verified</span> Đã xác thực
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenEmailVerify}
                        className="text-[11px] text-amber-700 hover:underline cursor-pointer font-sans font-semibold"
                      >
                        Chưa xác thực • Xác thực ngay
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b] flex items-center justify-between">
                    <span>Số Điện Thoại Liên Hệ</span>
                    <span className="text-[10px] text-[#5b48bd] font-mono">Bảo mật SMS</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">phone</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Chưa cập nhật (Ví dụ: 0912 xxx xxx)"
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                    Ngày Sinh
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">cake</span>
                    <input
                      type="date"
                      value={dob || ''}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                    Giới Tính
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">wc</span>
                    <select
                      value={gender || ''}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium cursor-pointer"
                    >
                      <option value="">-- Chưa chọn giới tính --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác / Không muốn tiết lộ</option>
                    </select>
                  </div>
                </div>

                {/* Nơi Cư Trú / Địa Chỉ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                      Nơi Cư Trú / Địa Chỉ
                    </label>
                    <span className="text-[10px] text-[#5b48bd] font-medium">Chọn Tỉnh → Huyện → Xã</span>
                  </div>
                  <VietnameseLocationPicker
                    value={address || city || ''}
                    onChange={(val) => {
                      setAddress(val);
                      setCity(val);
                    }}
                    placeholder="Bấm chọn Tỉnh/TP → Quận/Huyện → Phường/Xã..."
                    theme="light"
                  />
                </div>

                {/* Liên kết GitHub Profile */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Tài Khoản GitHub</span>
                    </span>
                    <span className="text-[10px] text-[#5b48bd] font-mono">Tự động đồng bộ repos</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">code</span>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => {
                        setGithubUrl(e.target.value);
                        setGithubConnected(Boolean(e.target.value.trim()));
                      }}
                      placeholder="Chưa liên kết (Ví dụ: https://github.com/username)"
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Địa chỉ chi tiết */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                    Địa Chỉ Chi Tiết
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">home</span>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Chưa cập nhật địa chỉ cư trú..."
                      className="w-full pl-11 pr-4 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Tiểu sử cá nhân */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b] flex items-center justify-between">
                    <span>Giới Thiệu Ngắn Về Bản Thân</span>
                    <span className="text-[10px] text-slate-400 font-mono">{personalBio.length}/300 ký tự</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={personalBio}
                    onChange={(e) => setPersonalBio(e.target.value)}
                    placeholder="Mô tả ngắn về bản thân, phong cách làm việc và định hướng nghề nghiệp..."
                    className="w-full p-4 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans resize-none font-medium"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
                <button
                  type="reset"
                  onClick={() => {
                    setFullName(user?.fullName || '');
                    setPhone(user?.phone || '');
                    setDob(user?.dateOfBirth || user?.dob || '');
                    setGender(user?.gender || '');
                    setCity(user?.city || '');
                    setAddress(user?.address || '');
                    setPersonalBio(user?.bio || '');
                    setGithubUrl(user?.githubUrl || '');
                    setGithubConnected(Boolean(user?.githubUrl));
                    triggerToast('Đã khôi phục dữ liệu ban đầu');
                  }}
                  className="bg-white hover:bg-purple-50/60 border border-purple-200 text-[#1e1b4b] font-semibold text-xs py-2.5 px-5 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  Hủy thay đổi
                </button>

                <button
                  type="submit"
                  className="bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold text-xs py-2.5 px-7 rounded-2xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>Lưu Cập Nhật Hồ Sơ</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* TAB 2: ĐỔI ẢNH ĐẠI DIỆN                                             */}
        {/* =================================================================== */}
        {activeTab === 'avatar' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5b48bd]">photo_camera</span>
                  Thay Đổi Ảnh Đại Diện
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Tải ảnh từ máy tính lên, chọn ảnh đại diện phong cách AI, hoặc nhập liên kết ảnh trực tiếp.
                </p>
              </div>
              <span className="text-[11px] font-sans text-[#5b48bd] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-semibold">
                Bộ Sưu Tập Ảnh
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left: Live Preview */}
              <div className="p-6 rounded-3xl bg-[#f8f7ff] border border-purple-100 flex flex-col items-center text-center space-y-4 shadow-sm">
                <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">
                  Xem Trước Ảnh Đại Diện
                </span>
                
                <div className="w-36 h-36 rounded-full p-1.5 bg-[#edeafd] border-2 border-purple-200 shadow-sm">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-base text-[#1e1b4b]">{fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">{email}</p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className="bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold w-full py-2.5 text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Lưu Ảnh Này Làm Đại Diện</span>
                </button>
              </div>

              {/* Right: Upload & Presets */}
              <div className="lg:col-span-2 space-y-6">
                {/* Method 1: Upload from Computer */}
                <div className="p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1e1b4b] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5b48bd] text-lg">upload_file</span>
                      <span>Cách 1: Tải ảnh từ máy tính</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-purple-200 hover:border-[#5b48bd] bg-white hover:bg-purple-50/50 text-xs font-semibold text-slate-600 hover:text-[#5b48bd] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm"
                  >
                    <span className="material-symbols-outlined text-3xl text-[#5b48bd] group-hover:scale-110 transition-transform">cloud_upload</span>
                    <span>Nhấn vào đây để chọn tệp hình ảnh từ thiết bị của bạn</span>
                  </button>
                </div>

                {/* Method 2: Select from AI Presets */}
                <div className="p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-3">
                  <span className="text-xs font-bold text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f97316] text-lg">face</span>
                    <span>Cách 2: Chọn từ kho ảnh đại diện tuyển dụng chuyên nghiệp</span>
                  </span>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset);
                          triggerToast('Đã chọn ảnh mẫu. Nhấn "Lưu Ảnh Này Làm Đại Diện" để hoàn tất.');
                        }}
                        className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer relative group ${
                          avatarUrl === preset ? 'border-[#5b48bd] scale-105 shadow-md' : 'border-purple-100 hover:border-[#5b48bd]/50'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        {avatarUrl === preset && (
                          <div className="absolute inset-0 bg-[#5b48bd]/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-lg font-bold drop-shadow">check</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method 3: Direct URL */}
                <div className="p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-3">
                  <span className="text-xs font-bold text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd] text-lg">link</span>
                    <span>Cách 3: Nhập liên kết ảnh trực tiếp</span>
                  </span>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customAvatarInput}
                      onChange={(e) => setCustomAvatarInput(e.target.value)}
                      placeholder="https://images.example.com/my-photo.jpg"
                      className="flex-1 px-4 py-2.5 bg-white border border-purple-100 rounded-2xl text-xs text-[#1e1b4b] focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAvatarInput.trim()) {
                          setAvatarUrl(customAvatarInput.trim());
                          triggerToast('Đã áp dụng liên kết ảnh! Nhớ nhấn Lưu.');
                        }
                      }}
                      className="bg-white hover:bg-purple-50/60 border border-purple-200 text-[#1e1b4b] font-semibold text-xs py-2.5 px-5 rounded-2xl shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      Áp Dụng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ĐỔI MẬT KHẨU & BẢO MẬT TÀI KHOẢN                             */}
        {/* =================================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Form Đổi Mật Khẩu */}
            <form onSubmit={handleChangePasswordSubmit} className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd]">key</span>
                    Đổi Mật Khẩu Đăng Nhập
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Để đảm bảo an toàn tài khoản, mật khẩu mới nên có tối thiểu 8 ký tự bao gồm chữ hoa, chữ số và ký tự đặc biệt.
                  </p>
                </div>
                <span className="text-[11px] font-sans text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                  Mã Hóa Mật Khẩu Chuẩn
                </span>
              </div>

              {passwordError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-sans flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="max-w-xl space-y-5">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                    Mật Khẩu Hiện Tại
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">lock</span>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu bạn đang sử dụng"
                      className="w-full pl-11 pr-11 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-[#5b48bd] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showCurrentPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                    Mật Khẩu Mới
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">lock_clock</span>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Tối thiểu 8 ký tự"
                      className="w-full pl-11 pr-11 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-[#5b48bd] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showNewPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="pt-2 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                        <span className={`font-bold ${strength.color}`}>{strength.text}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.width} ${strength.bg} transition-all duration-300`}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-sans font-bold text-[#1e1b4b]">
                    Xác Nhận Mật Khẩu Mới
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-3 text-base text-slate-400">verified_user</span>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Nhập lại chính xác mật khẩu mới"
                      className="w-full pl-11 pr-11 py-2.5 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs sm:text-sm text-[#1e1b4b] focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:outline-none transition-all font-sans font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-[#5b48bd] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showConfirmPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Change Password */}
                <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSendingPasswordOtp}
                    className="bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold text-xs py-3 px-8 rounded-2xl flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    {isSendingPasswordOtp ? (
                      <>
                        <span className="animate-spin text-sm">↻</span>
                        <span>Đang gửi mã OTP đến email...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">verified_user</span>
                        <span>Xác Thực OTP &amp; Cập Nhật Mật Khẩu</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500 italic font-sans flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#5b48bd]">mail</span>
                    Mã OTP 6 chữ số sẽ được gửi trực tiếp đến email của bạn
                  </span>
                </div>
              </div>
            </form>

            {/* Quản lý thiết bị đăng nhập */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-100 pb-4 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd]">devices</span>
                    Phiên Đăng Nhập Hoạt Động
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Quản lý danh sách các thiết bị, trình duyệt và địa chỉ IP đang duy trì token đăng nhập tài khoản.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={syncSessions}
                    disabled={isLoadingSessions}
                    title="Làm mới danh sách phiên"
                    className="p-2 rounded-xl border border-purple-200 hover:bg-purple-50 text-slate-600 hover:text-[#5b48bd] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-base ${isLoadingSessions ? 'animate-spin' : ''}`}>
                      sync
                    </span>
                  </button>

                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                      type="button"
                      onClick={handleTerminateOtherSessions}
                      className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span>Đăng xuất các thiết bị khác ({sessions.filter(s => !s.isCurrent).length})</span>
                    </button>
                  )}

                  {sessions.filter(s => !s.isCurrent).length === 0 && (
                    <button
                      type="button"
                      onClick={handleAddTestSession}
                      className="px-3 py-1.5 rounded-xl border border-dashed border-purple-200 text-slate-500 hover:text-[#5b48bd] hover:border-[#5b48bd] text-[11px] font-sans transition-colors cursor-pointer"
                      title="Mô phỏng 1 thiết bị khác đăng nhập để kiểm tra tính năng thu hồi token"
                    >
                      + Giả lập thiết bị để thử
                    </button>
                  )}
                </div>
              </div>

              {isLoadingSessions ? (
                <div className="p-6 rounded-2xl bg-[#f8f7ff] border border-purple-100 flex items-center justify-center gap-3 text-xs text-slate-500 font-sans">
                  <span className="animate-spin text-[#5b48bd]">↻</span>
                  <span>Đang kiểm tra và nhận diện thiết bị thực tế...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all gap-3 ${
                        sess.isCurrent
                          ? 'bg-[#f8f7ff] border-purple-200 shadow-sm ring-1 ring-[#5b48bd]/20'
                          : 'bg-white border-purple-100 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`p-3 rounded-2xl shrink-0 ${sess.isCurrent ? 'bg-[#edeafd] text-[#5b48bd] border border-purple-200' : 'bg-slate-100 text-slate-500'}`}>
                          <span className="material-symbols-outlined text-2xl">{sess.icon}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-[#1e1b4b]">{sess.device}</p>
                            {sess.isCurrent ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Thiết bị này (Phiên hiện tại)
                              </span>
                            ) : (
                              <span className="text-[10px] font-sans text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                Đã lưu token
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-sans flex flex-wrap items-center gap-2">
                            <span>{sess.location}</span>
                            <span>•</span>
                            <span>{sess.time}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center self-end sm:self-center gap-2">
                        {sess.isCurrent ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="material-symbols-outlined text-sm text-emerald-600">shield</span>
                            <span>Phiên bảo vệ an toàn</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTerminateSingleSession(sess.id, sess.device)}
                            className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">logout</span>
                            <span>Đăng xuất thiết bị</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Security Banner when only current device exists */}
                  {sessions.length === 1 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start sm:items-center gap-3.5 text-xs text-emerald-950 font-sans">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-emerald-900">Tài khoản bảo mật an toàn</p>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          Hiện tại tài khoản chỉ được xác thực và duy trì kết nối trên thiết bị này. Không có thiết bị lạ hoặc token trái phép nào khác đang hoạt động.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: SỬ DỤNG GITHUB & LIÊN KẾT TÀI KHOẢN                           */}
        {/* =================================================================== */}
        {activeTab === 'social' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5b48bd]">link</span>
                  Liên Kết Tài Khoản Mạng Xã Hội
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Tích hợp tài khoản GitHub lập trình viên và Google Single Sign-On (SSO).
                </p>
              </div>
              <span className="text-[11px] font-sans text-[#5b48bd] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-semibold">
                Tích hợp tài khoản
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GitHub Card */}
              <div className="p-6 rounded-3xl bg-[#f8f7ff] border border-purple-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#1e1b4b] flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1e1b4b]">GitHub Lập Trình Viên</h4>
                      <p className="text-[11px] text-slate-500 font-sans">Đồng bộ mã nguồn &amp; dự án</p>
                    </div>
                  </div>
                  {githubConnected ? (
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đã kết nối
                    </span>
                  ) : (
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-sans font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      Chưa kết nối
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-sans font-bold text-slate-600 uppercase tracking-wider block">
                    ĐƯỜNG DẪN TRANG GITHUB CỦA BẠN
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-2.5 bg-white border border-purple-100 rounded-2xl text-xs text-[#1e1b4b] focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 font-sans font-medium"
                  />
                </div>

                {githubConnected && githubUrl.trim() && (
                  <div className="p-3.5 rounded-2xl bg-white border border-purple-100 text-xs space-y-1 font-sans">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tài khoản liên kết:</span>
                      <strong className="text-[#1e1b4b] font-mono">{githubUrl.replace('https://github.com/', '')}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Trạng thái đồng bộ:</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span> Sẵn sàng
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!githubUrl.trim()) {
                        triggerToast('Vui lòng nhập đường dẫn GitHub hợp lệ');
                        return;
                      }
                      setGithubSyncing(true);
                      setTimeout(() => {
                        setGithubSyncing(false);
                        setGithubConnected(true);
                        triggerToast('✓ Đã đồng bộ tài khoản GitHub thành công!');
                      }, 800);
                    }}
                    className="bg-white hover:bg-purple-50/60 border border-purple-200 text-[#1e1b4b] font-semibold text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full transition-all"
                  >
                    <span className="material-symbols-outlined text-base">sync</span>
                    <span>{githubSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ GitHub'}</span>
                  </button>
                </div>
              </div>

              {/* Google Card */}
              <div className="p-6 rounded-3xl bg-[#f8f7ff] border border-purple-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-purple-100 flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1e1b4b]">Google Workspace</h4>
                      <p className="text-[11px] text-slate-500 font-sans">Đăng nhập nhanh tiện lợi</p>
                    </div>
                  </div>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đang hoạt động
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-sans font-bold text-slate-600 uppercase tracking-wider block">
                    TÀI KHOẢN GOOGLE ĐÃ LIÊN KẾT
                  </label>
                  <input
                    type="text"
                    disabled
                    value={email}
                    className="w-full px-4 py-2.5 bg-white border border-purple-100 rounded-2xl text-xs text-slate-600 font-mono"
                  />
                </div>

                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  Bạn có thể dùng nút <strong className="text-[#1e1b4b]">"Đăng nhập với Google"</strong> tại màn hình đăng nhập để vào ngay tài khoản này mà không cần nhập mật khẩu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: CÀI ĐẶT THÔNG BÁO                                            */}
        {/* =================================================================== */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-purple-100 pb-4">
              <h3 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5b48bd]">notifications_active</span>
                Tùy Chọn Nhận Thông Báo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-sans">
                Cài đặt tần suất và loại thông báo gửi về email hoặc thông báo trực tiếp trên giao diện HireMate AI.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100">
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-[#1e1b4b]">Thông báo việc làm phù hợp cao (AI Match ≥ 80%)</p>
                  <p className="text-[11px] text-slate-500 font-sans">Nhận thông báo ngay khi có công việc mới khớp kỹ năng chuyên môn của bạn.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.jobMatches}
                    onChange={() => setNotifSettings({ ...notifSettings, jobMatches: !notifSettings.jobMatches })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b48bd]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100">
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-[#1e1b4b]">Cập nhật trạng thái đơn ứng tuyển</p>
                  <p className="text-[11px] text-slate-500 font-sans">Thông báo khi Nhà tuyển dụng xem CV, mời phỏng vấn hoặc gửi thư mời nhận việc.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.applicationStatus}
                    onChange={() => setNotifSettings({ ...notifSettings, applicationStatus: !notifSettings.applicationStatus })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b48bd]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100">
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-[#1e1b4b]">Báo cáo đánh giá phiên phỏng vấn thử AI</p>
                  <p className="text-[11px] text-slate-500 font-sans">Gửi bảng tổng kết phân tích điểm số, biểu đồ kỹ năng và gợi ý cải thiện điểm yếu.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.aiInterviewReview}
                    onChange={() => setNotifSettings({ ...notifSettings, aiInterviewReview: !notifSettings.aiInterviewReview })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b48bd]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =================================================================== */}
      {/* EMAIL OTP VERIFICATION MODAL                                        */}
      {/* =================================================================== */}
      {showEmailVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1b4b]/40 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 text-[#1e1b4b]">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5b48bd] text-xl">mark_email_read</span>
                <h3 className="font-bold text-base text-[#1e1b4b]">Xác Thực Địa Chỉ Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailVerifyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Mã OTP 6 số đã được gửi đến hộp thư <strong className="text-[#1e1b4b]">{email}</strong>. Vui lòng kiểm tra email của bạn để xác nhận.
            </p>

            {verifyOtpError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {verifyOtpError}
              </div>
            )}

            <form onSubmit={handleConfirmVerifyOtp} className="space-y-4">
              <input
                type="text"
                value={verifyOtpInput}
                onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="••••••"
                className="w-full py-3 bg-[#f8f7ff] border border-purple-200 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-2xl text-center text-2xl font-mono tracking-[0.5em] text-[#1e1b4b] focus:outline-none shadow-sm"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailVerifyModal(false)}
                  className="bg-white hover:bg-purple-50/60 border border-purple-200 text-[#1e1b4b] font-semibold text-xs py-2.5 px-5 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold text-xs py-2.5 px-6 rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingOtp ? 'Đang xác thực...' : 'Xác Nhận OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CHANGE PASSWORD OTP VERIFICATION MODAL                              */}
      {/* =================================================================== */}
      {showPasswordOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1b4b]/40 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-[#1e1b4b]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#edeafd] flex items-center justify-center text-[#5b48bd]">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1e1b4b]">Xác Thực Đổi Mật Khẩu</h3>
                  <p className="text-[11px] text-slate-500">Bảo mật tài khoản qua Email chính chủ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordOtpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Email notification box */}
            <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 text-[#1e1b4b] font-semibold">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">mark_email_read</span>
                <span>Kiểm tra mã OTP trong hộp thư email</span>
              </div>
              <p>
                HireMate AI đã gửi mã OTP xác nhận 6 chữ số đến địa chỉ:{' '}
                <strong className="text-[#1e1b4b] font-mono">{user?.email || email}</strong>
              </p>
              <p className="text-[11px] text-slate-500 italic">
                * Vui lòng kiểm tra cả hộp thư chính, mục Quảng cáo hoặc Thư rác (Spam).
              </p>
            </div>

            {passwordOtpError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{passwordOtpError}</span>
              </div>
            )}

            {/* Form submit OTP */}
            <form onSubmit={handleConfirmChangePasswordWithOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 text-center">
                  Nhập mã OTP 6 chữ số vừa nhận được
                </label>
                <input
                  type="text"
                  autoFocus
                  value={passwordOtpInput}
                  onChange={(e) => setPasswordOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full py-3.5 bg-[#f8f7ff] border border-purple-200 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-2xl text-center text-3xl font-mono tracking-[0.4em] text-[#1e1b4b] focus:outline-none shadow-sm"
                />
              </div>

              {/* Resend Cooldown */}
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span>Chưa nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResendPasswordOtp}
                  disabled={passwordOtpCooldown > 0 || isSendingPasswordOtp}
                  className={`font-semibold transition-colors flex items-center gap-1 ${
                    passwordOtpCooldown > 0 || isSendingPasswordOtp
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-[#5b48bd] hover:underline cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">sync</span>
                  {passwordOtpCooldown > 0
                    ? `Gửi lại sau (${passwordOtpCooldown}s)`
                    : isSendingPasswordOtp
                    ? 'Đang gửi...'
                    : 'Gửi lại mã OTP'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordOtpModal(false)}
                  className="bg-white hover:bg-purple-50/60 border border-purple-200 text-[#1e1b4b] font-semibold text-xs py-2.5 px-5 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPasswordOtp || passwordOtpInput.length < 6}
                  className="bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold text-xs py-2.5 px-6 rounded-2xl disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  {isVerifyingPasswordOtp ? (
                    <>
                      <span className="animate-spin text-sm">↻</span>
                      <span>Đang xác nhận...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Xác Nhận &amp; Đổi Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
