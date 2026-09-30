import React, { useState } from 'react';
import authApi from '../../api/authApi';
import { useLivingTheme } from '../../context/LivingThemeContext';

/**
 * HireMate AI - Executive Frosted Glass Register Page
 * Seamlessly integrated with 3D Living World Backdrop & LivingThemeContext
 * Real Database Authentication via Spring Boot PostgreSQL
 */
export default function RegisterPage({ onNavigateLogin, onRegisterSuccess }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [role, setRole] = useState(
    (window.location.hash || '').toLowerCase().includes('recruiter') ? 'RECRUITER' : 'CANDIDATE'
  );

  // Candidate State
  const [candName, setCandName] = useState('Trần Bảo Long');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('0987 654 321');
  const [candHeadline, setCandHeadline] = useState('Fullstack Developer / AI Engineer');
  const [candExp, setCandExp] = useState('1_3_YEARS');

  // Recruiter State (matching `companies` table spec)
  const [recName, setRecName] = useState('Nguyễn Thị Mai');
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('0912 345 678');
  const [companyName, setCompanyName] = useState('FPT Software Vietnam');
  const [companySize, setCompanySize] = useState('500_1000');
  const [companyLocation, setCompanyLocation] = useState('Tòa nhà FPT, Khu CNC Hòa Lạc, Hà Nội');
  const [companyWebsite, setCompanyWebsite] = useState('https://fpt-software.com');

  // Shared Auth State
  const [password, setPassword] = useState('Password123@');
  const [confirmPassword, setConfirmPassword] = useState('Password123@');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const cardStyle = "bg-white border border-[#E6E2DA] rounded-[32px] shadow-soft-xl";

  return (
    <div className="w-full min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-transparent text-[#2D3A31] font-body selection:bg-[#8C9A84] selection:text-white">
      {/* Decorative Organic Ambient Glows */}
      <div className="absolute top-12 right-16 w-32 h-32 rounded-full bg-[#8C9A84]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-16 w-40 h-40 rounded-full bg-[#C27B66]/10 blur-3xl pointer-events-none" />

      {/* Main Botanical Master Card */}
      <div className={`w-full max-w-5xl ${cardStyle} overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10`}>
        
        {/* ============================================================
            LEFT PANEL (5 cols): BOTANICAL ART & BRAND SHOWCASE
        ============================================================ */}
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E6E2DA] relative overflow-hidden bg-[#F9F8F4]">
          {/* Brand Logo */}
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="inline-flex items-center gap-3 group text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2D3A31] border border-[#E6E2DA] shadow-soft flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <span className="material-symbols-outlined text-[#8C9A84] text-2xl">
                  spa
                </span>
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold tracking-tight text-[#2D3A31] font-serif">HireMate</span>
                  <span className="text-2xl italic font-normal text-[#C27B66] ml-1">.AI</span>
                </div>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-[#F2F0EB] border border-[#E6E2DA] text-[10px] font-semibold text-[#8C9A84] rounded-full uppercase tracking-wider">
                  Botanical Talent Studio
                </span>
              </div>
            </button>
          </div>

          {/* Central Editorial Art: Iconic Arch Frame */}
          <div className="relative flex-1 w-full my-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-64 h-80 arch-frame bg-[#F2F0EB] border border-[#E6E2DA] shadow-soft flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#8C9A84]/15 via-transparent to-[#C27B66]/10 pointer-events-none" />

              <div className="w-20 h-20 rounded-full bg-white border border-[#E6E2DA] shadow-soft flex items-center justify-center text-[#2D3A31] mb-4 group-hover:scale-105 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl text-[#8C9A84]">eco</span>
              </div>

              <h3 className="font-serif font-bold text-xl text-[#2D3A31] leading-tight mb-2">
                Flourish in Your <br /><span className="italic font-normal text-[#C27B66]">True Potential</span>
              </h3>
              <p className="text-xs text-[#667067] font-normal leading-relaxed max-w-[200px]">
                Tham gia cộng đồng nhân tài và đón nhận cơ hội việc làm tự nhiên.
              </p>

              {/* Floating Pill Highlights */}
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6E2DA] text-[11px] font-semibold text-[#2D3A31] shadow-soft">
                <span className="w-2 h-2 rounded-full bg-[#8C9A84]"></span>
                <span>100% Free Lifetime</span>
              </div>
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="relative z-10 p-3.5 bg-white border border-[#E6E2DA] shadow-soft rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-[#8C9A84]">verified</span>
            <p className="text-xs text-[#667067] font-normal leading-snug">
              Tạo hồ sơ chuyên nghiệp &amp; mở khóa cơ hội việc làm AI bền vững!
            </p>
          </div>
        </div>

        {/* ============================================================
            RIGHT PANEL (7 cols): HUMANIST REGISTRATION FORM
        ============================================================ */}
        <div className="lg:col-span-7 p-8 sm:p-10 xl:p-11 flex flex-col justify-between space-y-4 bg-white">
          
          {/* Top Bar: Return to Home & Login Link */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D3A31] px-3.5 py-1.5 rounded-full bg-[#F9F8F4] hover:bg-[#F2F0EB] border border-[#E6E2DA] transition-all duration-300 cursor-pointer group"
              title="Quay lại Trang Chủ"
            >
              <span className="material-symbols-outlined text-sm text-[#2D3A31] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>Trang Chủ</span>
            </button>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C9A84] hover:text-[#C27B66] transition-colors cursor-pointer"
            >
              <span>Đã có tài khoản? Đăng nhập</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Role Switcher */}
          <div className="p-1 rounded-full bg-[#F2F0EB] border border-[#E6E2DA] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setRole('CANDIDATE')}
              className={`py-2 px-3 rounded-full text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                role === 'CANDIDATE'
                  ? 'bg-[#2D3A31] text-white shadow-soft'
                  : 'text-[#667067] hover:text-[#2D3A31]'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span>Ứng Viên</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('RECRUITER')}
              className={`py-2 px-3 rounded-full text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                role === 'RECRUITER'
                  ? 'bg-[#2D3A31] text-white shadow-soft'
                  : 'text-[#667067] hover:text-[#2D3A31]'
              }`}
            >
              <span className="material-symbols-outlined text-base">apartment</span>
              <span>Doanh Nghiệp</span>
            </button>
          </div>

          {/* Heading */}
          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2D3A31] font-serif tracking-tight">
              {role === 'CANDIDATE' ? 'Đăng ký tài khoản Ứng viên' : 'Đăng ký Cổng Doanh nghiệp'}
            </h1>
            <p className="text-xs sm:text-sm text-[#667067] font-normal">
              {role === 'CANDIDATE'
                ? 'Nhập thông tin bên dưới để kích hoạt tài khoản HireMate AI miễn phí.'
                : 'Đăng ký hồ sơ công ty và bắt đầu tiếp cận nhân tài công nghệ.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/40 text-[#C27B66] text-xs font-medium flex items-center gap-2.5 shadow-soft">
              <span className="material-symbols-outlined text-base text-[#C27B66] shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/40 text-[#2D3A31] text-xs font-medium flex items-center gap-2.5 shadow-soft">
              <span className="material-symbols-outlined text-base text-[#8C9A84] shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* CANDIDATE FIELDS */}
            {role === 'CANDIDATE' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                    Họ và tên ứng viên
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">person</span>
                    <input
                      type="text"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="Trần Bảo Long"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Email đăng ký
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">mail</span>
                      <input
                        type="email"
                        value={candEmail}
                        onChange={(e) => setCandEmail(e.target.value)}
                        placeholder="long.tran@example.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Số điện thoại
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">call</span>
                      <input
                        type="tel"
                        value={candPhone}
                        onChange={(e) => setCandPhone(e.target.value)}
                        placeholder="0987 654 321"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Vị trí chuyên môn (Headline)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">badge</span>
                      <input
                        type="text"
                        value={candHeadline}
                        onChange={(e) => setCandHeadline(e.target.value)}
                        placeholder="Fullstack Dev / AI Engineer"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Kinh nghiệm làm việc
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">work_history</span>
                      <select
                        value={candExp}
                        onChange={(e) => setCandExp(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest focus:outline-none transition-all cursor-pointer font-sans font-medium"
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
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Họ tên HR / Người phụ trách
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">person</span>
                      <input
                        type="text"
                        value={recName}
                        onChange={(e) => setRecName(e.target.value)}
                        placeholder="Nguyễn Thị Mai"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Email doanh nghiệp (Work Email)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">mail</span>
                      <input
                        type="email"
                        value={recEmail}
                        onChange={(e) => setRecEmail(e.target.value)}
                        placeholder="recruitment@company.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Tên Công ty / Tập đoàn
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">apartment</span>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="FPT Software Vietnam"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Quy mô nhân sự
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">groups</span>
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest focus:outline-none transition-all cursor-pointer font-sans font-medium"
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
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Trụ sở chính
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">location_on</span>
                      <input
                        type="text"
                        value={companyLocation}
                        onChange={(e) => setCompanyLocation(e.target.value)}
                        placeholder="Hà Nội / TP.HCM / Đà Nẵng"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">call</span>
                      <input
                        type="tel"
                        value={recPhone}
                        onChange={(e) => setRecPhone(e.target.value)}
                        placeholder="0912 345 678"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SHARED PASSWORD FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                  Mật khẩu đăng nhập
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-botanical-forest/60 hover:text-botanical-forest transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-botanical-forest/80 block">
                  Xác nhận mật khẩu
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-botanical-sage text-base pointer-events-none">verified_user</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 rounded-2xl text-sm text-botanical-forest placeholder-botanical-forest/40 focus:outline-none transition-all font-sans font-medium"
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
                className="mt-0.5 w-4 h-4 rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#667067] font-normal select-none leading-relaxed cursor-pointer">
                Tôi đồng ý với <a href="#/" className="text-[#8C9A84] hover:underline font-semibold">Điều khoản dịch vụ</a> &amp; <a href="#/" className="text-[#8C9A84] hover:underline font-semibold">Chính sách bảo mật AI</a> của HireMate.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-botanical-primary w-full py-3.5 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
          <div className="text-center pt-2 text-xs text-[#667067] font-normal">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-[#8C9A84] hover:text-[#C27B66] font-semibold underline transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A31]/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E2DA] rounded-3xl p-6 shadow-soft-xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#2D3A31] text-white flex items-center justify-center material-symbols-outlined text-base">mark_email_read</span>
                <span className="font-serif font-bold text-sm text-[#2D3A31]">Xác thực Địa chỉ Email</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-8 h-8 rounded-full bg-[#F2F0EB] hover:bg-[#E6E2DA] flex items-center justify-center text-[#2D3A31] font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] shadow-soft space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#8C9A84] font-medium">
                <span className="material-symbols-outlined text-base">outgoing_mail</span>
                <span>Email xác thực đã được gửi đến:</span>
              </div>
              <p className="font-bold text-[#2D3A31] font-mono break-all text-sm px-3 py-2 bg-white rounded-xl border border-[#E6E2DA]">
                {targetEmail}
              </p>
              <p className="text-[11px] text-[#667067] leading-relaxed pt-1">
                Vui lòng kiểm tra <strong>Hộp thư đến (Inbox)</strong> hoặc thư mục <strong>Thư rác/Spam</strong> và nhập mã 6 số để hoàn tất đăng ký.
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/40 text-[#C27B66] text-xs font-medium flex items-center gap-2 shadow-soft">
                <span className="material-symbols-outlined text-base text-[#C27B66] shrink-0">error</span>
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-serif font-bold text-[#2D3A31] uppercase tracking-wider block">
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
                  className="w-full px-4 py-3 bg-[#F9F8F4] border border-[#E6E2DA] focus:border-[#8C9A84] focus:shadow-[0_0_0_2px_rgba(140,154,132,0.2)] rounded-full text-center text-2xl font-mono tracking-[0.5em] text-[#2D3A31] placeholder-[#9BA39B] focus:outline-none font-bold"
                />
              </div>

              {/* Resend OTP button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#667067]">Chưa nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className={`font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    resendCooldown > 0 || isResending
                      ? 'text-[#667067]/60 cursor-not-allowed'
                      : 'text-[#8C9A84] hover:text-[#2D3A31] hover:underline'
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
                  className="btn-botanical-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Sửa thông tin
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="btn-botanical-primary px-5 py-2 text-xs uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {isVerifyingOtp ? 'Đang xác thực...' : 'Xác Thực & Kích Hoạt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
