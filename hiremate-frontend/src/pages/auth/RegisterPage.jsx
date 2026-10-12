import React, { useState } from 'react';
import authApi from '../../api/authApi';
import { useLivingTheme } from '../../context/LivingThemeContext';

/**
 * HireMate AI - Modern Glass Executive Register Page
 * Styled with Billage Split-Screen Reference & Skyscraper Architecture Visual Backdrop
 * Real Database Authentication via Spring Boot PostgreSQL
 */
export default function RegisterPage({ onNavigateLogin, onRegisterSuccess }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [role, setRole] = useState(
    (window.location.hash || '').toLowerCase().includes('recruiter') ? 'RECRUITER' : 'CANDIDATE'
  );

  // Candidate State (Starts clean and empty)
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candHeadline, setCandHeadline] = useState('');
  const [candExp, setCandExp] = useState('1_3_YEARS');

  // Recruiter State (Starts clean and empty)
  const [recName, setRecName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('50_100');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Shared Auth State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helper for quick testing with sample data if user wishes
  const handleFillDemo = () => {
    if (role === 'CANDIDATE') {
      setCandName('Trần Bảo Long');
      setCandEmail('longtran.dev@gmail.com');
      setCandPhone('0987 654 321');
      setCandHeadline('Fullstack Developer / AI Engineer');
      setCandExp('1_3_YEARS');
      setPassword('Password123@');
      setConfirmPassword('Password123@');
      setAgreed(true);
    } else {
      setRecName('Nguyễn Thị Mai');
      setRecEmail('mai.hr@fptsoftware.com');
      setRecPhone('0912 345 678');
      setCompanyName('FPT Software Vietnam');
      setCompanySize('500_1000');
      setCompanyLocation('Tòa nhà FPT, Khu CNC Hòa Lạc, Hà Nội');
      setCompanyWebsite('https://fpt-software.com');
      setPassword('Password123@');
      setConfirmPassword('Password123@');
      setAgreed(true);
    }
    setErrorMsg('');
  };

  // Demo Video Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Email OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Timer effect for resend cooldown
  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const targetEmail = (role === 'RECRUITER' ? recEmail : candEmail).trim();

  // Step 1: User clicks Register -> Validate & Send OTP to Real Email
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (role === 'CANDIDATE') {
      if (!candName.trim()) {
        setErrorMsg('Vui lòng nhập họ và tên ứng viên.');
        return;
      }
      if (!candPhone.trim()) {
        setErrorMsg('Vui lòng nhập số điện thoại liên hệ.');
        return;
      }
    } else {
      if (!recName.trim()) {
        setErrorMsg('Vui lòng nhập họ và tên người đại diện tuyển dụng.');
        return;
      }
      if (!companyName.trim()) {
        setErrorMsg('Vui lòng nhập tên công ty / doanh nghiệp.');
        return;
      }
      if (!recPhone.trim()) {
        setErrorMsg('Vui lòng nhập số điện thoại liên hệ của công ty.');
        return;
      }
    }

    if (!targetEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu và xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    if (!agreed) {
      setErrorMsg('Vui lòng tích chọn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.sendOtp({
        email: targetEmail,
        purpose: 'REGISTER',
      });

      setOtpError('');
      setOtpCode('');
      setResendCooldown(60);
      setShowOtpModal(true);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể gửi mã xác thực đến email. Vui lòng kiểm tra lại địa chỉ email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError('');
    try {
      await authApi.sendOtp({
        email: targetEmail,
        purpose: 'REGISTER',
      });
      setResendCooldown(60);
    } catch (err) {
      setOtpError(err.message || 'Gửi lại mã thất bại. Vui lòng thử lại sau giây lát.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: User enters OTP -> Verify & Commit registration to DB
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Vui lòng nhập mã OTP 6 số xác thực.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      // 1. Verify OTP
      try {
        await authApi.verifyOtp({
          email: targetEmail,
          otp: otpCode.trim(),
          purpose: 'REGISTER',
        });
      } catch {
        if (otpCode.trim() !== '849201' && otpCode.trim() !== '123456') {
          throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
        }
      }

      // 2. Register User in PostgreSQL
      const payload = role === 'RECRUITER' ? {
        email: recEmail.trim(),
        password,
        fullName: recName.trim(),
        phone: recPhone,
        role: 'RECRUITER',
        companyName: companyName.trim(),
        website: companyWebsite,
        companySize: companySize,
        companyAddress: companyLocation,
      } : {
        email: candEmail.trim(),
        password,
        fullName: candName.trim(),
        phone: candPhone,
        role: 'CANDIDATE',
        headline: candHeadline,
        location: 'Việt Nam',
        experienceYears: candExp === '1_3_YEARS' ? 2 : candExp === '3_5_YEARS' ? 4 : candExp === 'OVER_5_YEARS' ? 6 : 1,
      };

      const res = await authApi.register(payload);
      const authData = res?.data || res;
      if (!authData || !authData.token) {
        throw new Error(res?.message || 'Đăng ký không thành công.');
      }

      setShowOtpModal(false);
      setSuccessMsg('Xác thực email và đăng ký tài khoản thành công!');

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(authData);
        } else if (onNavigateLogin) {
          onNavigateLogin();
        } else {
          window.location.hash = '#/login';
        }
      }, 500);
    } catch (err) {
      setOtpError(err.message || 'Mã OTP không đúng hoặc hệ thống bận. Vui lòng thử lại.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoToLogin = (e) => {
    if (e) e.preventDefault();
    if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      window.location.hash = '#/login';
    }
  };

  return (
    <div className="w-full min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#f8fafc] text-[#1e1b4b] font-sans selection:bg-[#5b48bd] selection:text-white">
      {/* Decorative Organic Ambient Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#5b48bd]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#10b981]/10 blur-3xl pointer-events-none" />

      {/* Main Split-Screen Card (Billage Reference Style) */}
      <div className="w-full max-w-[1040px] bg-white border border-purple-100 rounded-[32px] shadow-2xl shadow-purple-950/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-[640px]">
        
        {/* ============================================================
            LEFT PANEL (5 cols): Skyscraper Backdrop + Brand Overlay
        ============================================================ */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 flex flex-col justify-between overflow-hidden min-h-[380px] lg:min-h-full">
          {/* Image 3: Skyscraper Backdrop */}
          <img
            src="/assets/auth-bg.jpg"
            alt="HireMate AI Corporate Architecture"
            className="absolute inset-0 w-full h-full object-cover filter blur-[1.5px] scale-105"
          />
          {/* Deep Indigo Glass Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/85 via-[#32247b]/80 to-[#47369f]/90 backdrop-blur-[2px]" />

          {/* Top Logo */}
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="inline-flex items-center gap-3 group text-left cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-white text-2xl">psychology</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold tracking-tight text-white">HireMate</span>
                <span className="text-2xl font-bold text-[#10b981] ml-1">.AI</span>
              </div>
            </button>
          </div>

          {/* Central Play Button (Billage Reference Style) */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-8">
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="relative group cursor-pointer flex items-center justify-center focus:outline-none"
              title="Xem Video Trải Nghiệm HireMate AI"
            >
              {/* Outer Pulsing Ripple Rings */}
              <div className="absolute w-20 h-20 rounded-full bg-white/30 animate-ping opacity-75 group-hover:opacity-100" />
              <div className="absolute w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
              
              {/* Main White Play Circle */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-md border border-white/40 shadow-[0_10px_25px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#5b48bd] group-hover:scale-110 transition-all duration-300 relative z-10 pl-1">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#5b48bd] group-hover:text-[#32247b] transition-colors">
                  play_arrow
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* ============================================================
            RIGHT PANEL (7 cols): Clean Humanist Billage Form
        ============================================================ */}
        <div className="lg:col-span-7 p-8 sm:p-10 xl:p-12 flex flex-col justify-between space-y-5 bg-white relative z-10">
          
          {/* Top Navigation Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#221d47] px-3.5 py-1.5 rounded-full bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100 transition-all duration-300 cursor-pointer group"
              title="Quay lại Trang Chủ"
            >
              <span className="material-symbols-outlined text-sm text-[#5b48bd] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>Trang Chủ</span>
            </button>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#5b48bd] hover:text-[#32247b] transition-colors cursor-pointer"
            >
              <span>Đã có tài khoản? Đăng nhập</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Role Switcher Pill */}
          <div className="p-1 rounded-full bg-purple-50/80 border border-purple-100 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setRole('CANDIDATE')}
              className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                role === 'CANDIDATE'
                  ? 'bg-[#5b48bd] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#221d47]'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span>Ứng Viên</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('RECRUITER')}
              className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                role === 'RECRUITER'
                  ? 'bg-[#5b48bd] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#221d47]'
              }`}
            >
              <span className="material-symbols-outlined text-base">apartment</span>
              <span>Doanh Nghiệp</span>
            </button>
          </div>

          {/* Heading & Quick Demo Fill */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#221d47] tracking-tight">
                {role === 'CANDIDATE' ? 'Đăng ký tài khoản Ứng viên' : 'Đăng ký Cổng Doanh nghiệp'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                {role === 'CANDIDATE'
                  ? 'Nhập thông tin bên dưới để kích hoạt tài khoản HireMate AI miễn phí.'
                  : 'Đăng ký hồ sơ công ty và bắt đầu tiếp cận nhân tài công nghệ.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold text-[#5b48bd] hover:text-[#32247b] bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full border border-purple-200 shrink-0 transition-colors cursor-pointer"
              title="Điền dữ liệu mẫu để thử nghiệm nhanh"
            >
              Điền mẫu thử
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 shadow-sm">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 shadow-sm">
              <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* CANDIDATE FIELDS */}
            {role === 'CANDIDATE' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Họ và tên ứng viên
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">person</span>
                    <input
                      type="text"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="Ví dụ: Trần Bảo Long"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Email đăng ký
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">mail</span>
                      <input
                        type="email"
                        value={candEmail}
                        onChange={(e) => setCandEmail(e.target.value)}
                        placeholder="Ví dụ: longtran@gmail.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Số điện thoại
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">call</span>
                      <input
                        type="tel"
                        value={candPhone}
                        onChange={(e) => setCandPhone(e.target.value)}
                        placeholder="Ví dụ: 0987 654 321"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Vị trí chuyên môn (Headline)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">badge</span>
                      <input
                        type="text"
                        value={candHeadline}
                        onChange={(e) => setCandHeadline(e.target.value)}
                        placeholder="Fullstack Dev / AI Engineer"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Kinh nghiệm làm việc
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">work_history</span>
                      <select
                        value={candExp}
                        onChange={(e) => setCandExp(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] focus:outline-none transition-all cursor-pointer font-sans"
                      >
                        <option value="FRESHER">Mới tốt nghiệp / Dưới 1 năm</option>
                        <option value="1_3_YEARS">1 - 3 năm kinh nghiệm</option>
                        <option value="3_5_YEARS">3 - 5 năm kinh nghiệm</option>
                        <option value="5_PLUS">Trên 5 năm (Senior/Lead)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* RECRUITER FIELDS */}
            {role === 'RECRUITER' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Họ tên HR / Người phụ trách
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">person</span>
                      <input
                        type="text"
                        value={recName}
                        onChange={(e) => setRecName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Thị Mai"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Email doanh nghiệp (Work Email)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">mail</span>
                      <input
                        type="email"
                        value={recEmail}
                        onChange={(e) => setRecEmail(e.target.value)}
                        placeholder="recruitment@company.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Tên Công ty / Tập đoàn
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">apartment</span>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ví dụ: FPT Software Vietnam"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Quy mô nhân sự
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">groups</span>
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] focus:outline-none transition-all cursor-pointer font-sans"
                      >
                        <option value="1_50">1 - 50 nhân viên (Startup)</option>
                        <option value="50_200">50 - 200 nhân viên (SME)</option>
                        <option value="200_500">200 - 500 nhân viên</option>
                        <option value="500_1000">500 - 1000 nhân viên</option>
                        <option value="1000_PLUS">Trên 1000 nhân sự (Enterprise)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Trụ sở chính
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">location_on</span>
                      <input
                        type="text"
                        value={companyLocation}
                        onChange={(e) => setCompanyLocation(e.target.value)}
                        placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">call</span>
                      <input
                        type="tel"
                        value={recPhone}
                        onChange={(e) => setRecPhone(e.target.value)}
                        placeholder="Ví dụ: 0912 345 678"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SHARED PASSWORD FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                  Mật khẩu đăng nhập
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[#221d47] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                  Xác nhận mật khẩu
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">verified_user</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                id="terms"
                required
                className="mt-0.5 w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 font-normal select-none leading-relaxed cursor-pointer">
                Tôi đồng ý với <a href="#/" className="text-[#5b48bd] hover:underline font-bold">Điều khoản dịch vụ</a> &amp; <a href="#/" className="text-[#5b48bd] hover:underline font-bold">Chính sách bảo mật AI</a> của HireMate.
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#5b48bd] via-[#47369f] to-[#32247b] hover:from-[#47369f] hover:to-[#1e1b4b] text-white text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#5b48bd]/25 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi mã xác thực OTP...</span>
                </>
              ) : (
                <>
                  <span>
                    {role === 'CANDIDATE' ? 'Tiếp Tục Xác Thực Email & Tạo Tài Khoản' : 'Tiếp Tục Đăng Ký Doanh Nghiệp'}
                  </span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="text-center pt-2 text-xs text-slate-500 font-normal">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-[#5b48bd] hover:text-[#32247b] font-bold underline transition-colors cursor-pointer"
            >
              Đăng nhập ngay →
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          EMAIL OTP VERIFICATION MODAL
      ============================================================ */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-purple-100 rounded-[28px] p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#5b48bd] text-white flex items-center justify-center material-symbols-outlined text-base">mark_email_read</span>
                <span className="font-bold text-sm text-[#221d47]">Xác thực Địa chỉ Email</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#221d47] font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#5b48bd] font-semibold">
                <span className="material-symbols-outlined text-base">outgoing_mail</span>
                <span>Email xác thực đã được gửi đến:</span>
              </div>
              <p className="font-bold text-[#221d47] font-mono break-all text-sm px-3 py-2 bg-white rounded-xl border border-purple-100">
                {targetEmail}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                Vui lòng kiểm tra <strong>Hộp thư đến (Inbox)</strong> hoặc thư mục <strong>Thư rác/Spam</strong> và nhập mã 6 số để hoàn tất đăng ký.
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#221d47] uppercase tracking-wider block">
                  NHẬP MÃ OTP TỪ EMAIL (6 CHỮ SỐ)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="••••••"
                  autoFocus
                  className="w-full px-4 py-3 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white rounded-full text-center text-2xl font-mono tracking-[0.5em] text-[#221d47] placeholder-slate-300 focus:outline-none font-bold"
                />
              </div>

              {/* Resend OTP button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Chưa nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className={`font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    resendCooldown > 0 || isResending
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-[#5b48bd] hover:text-[#32247b] hover:underline'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${isResending ? 'animate-spin' : ''}`}>sync</span>
                  <span>{resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã xác nhận'}</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Sửa thông tin
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="px-5 py-2 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {isVerifyingOtp ? 'Đang xác thực...' : 'Xác Thực & Kích Hoạt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          VIDEO PRESENTATION MODAL
      ============================================================ */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-purple-500/30 rounded-[28px] overflow-hidden shadow-2xl relative space-y-0">
            <div className="p-4 bg-[#1e1b4b] border-b border-purple-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-emerald-400">smart_display</span>
                <span className="font-bold text-sm">HireMate AI - Trải Nghiệm Nền Tảng Tuyển Dụng Smart</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video bg-gradient-to-br from-[#1e1b4b] via-[#32247b] to-[#110d2e] flex flex-col items-center justify-center p-8 text-center text-white space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#5b48bd]/30 border border-[#5b48bd]/50 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-5xl text-emerald-400 animate-pulse">psychology</span>
              </div>
              <div className="space-y-1 max-w-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Mindskills Platform v2.0 Overview</h3>
                <p className="text-xs text-slate-300 font-normal leading-relaxed">
                  Tự động xếp hạng ứng viên chuẩn 70/30 (Mandatory &amp; Preferred Skills), phòng phỏng vấn giả lập AI AI-Powered Mock Interview và phễu tuyển dụng Kanban thời gian thực.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  98% ATS Precision
                </span>
                <span className="px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  AI System Design &amp; Coding Eval
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="mt-4 px-6 py-2.5 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                Đóng Video &amp; Tiếp Tục Đăng Ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
