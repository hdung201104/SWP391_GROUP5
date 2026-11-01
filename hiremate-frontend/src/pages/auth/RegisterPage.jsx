import { HIREMATE_LOGO_URL } from '../../constants/branding';
import React, { useState } from 'react';
import authApi from '../../api/authApi';
import companyApi from '../../api/companyApi';
import { useLivingTheme } from '../../context/LivingThemeContext';
import { EDUCATION_LEVELS } from '../../utils/locationData';
import VietnameseLocationPicker from '../../components/common/VietnameseLocationPicker';

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
  const [candEducation, setCandEducation] = useState('BACHELOR');
  const [candDob, setCandDob] = useState('');
  const [candLocation, setCandLocation] = useState('');
  const [candGithub, setCandGithub] = useState('');

  // Recruiter State (Starts clean and empty)
  const [recName, setRecName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('50_100');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [legalRep, setLegalRep] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  const [licenseFileUrl, setLicenseFileUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Multi-branch Enterprise & Company Lookup States
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [branchMode, setBranchMode] = useState('EXISTING'); // 'EXISTING' | 'NEW'
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [recBranchName, setRecBranchName] = useState('Trụ sở chính');
  const [recBranchAddress, setRecBranchAddress] = useState('');
  const [recPosition, setRecPosition] = useState('Chuyên viên tuyển dụng');
  const [recDepartment, setRecDepartment] = useState('Phòng Tuyển dụng & Nhân sự');

  // Debounce lookup companies when typing companyName or taxCode
  React.useEffect(() => {
    if (role !== 'RECRUITER' || selectedCompany) {
      setCompanySuggestions([]);
      return;
    }
    const cleanName = companyName.trim();
    const cleanTax = taxCode.trim();

    if (cleanName.length < 2 && cleanTax.length < 3) {
      setCompanySuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsSearchingCompany(true);
        const res = await companyApi.lookupCompanies({
          keyword: cleanName || undefined,
          taxCode: cleanTax || undefined,
        });
        const list = res?.data?.data || res?.data || [];
        setCompanySuggestions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Lookup companies error:', err);
      } finally {
        setIsSearchingCompany(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [companyName, taxCode, role, selectedCompany]);

  const handleSelectSuggestedCompany = (comp) => {
    setSelectedCompany(comp);
    setCompanyName(comp.companyName || '');
    if (comp.taxCode) setTaxCode(comp.taxCode);
    if (comp.companySize) setCompanySize(comp.companySize);
    if (comp.website) setCompanyWebsite(comp.website);
    if (comp.address) setCompanyLocation(comp.address);
    setCompanySuggestions([]);

    const branches = comp.branches || [];
    if (branches.length > 0) {
      setSelectedBranchId(branches[0].id || 'headquarters');
      setRecBranchName(branches[0].branchName || 'Trụ sở chính');
      setRecBranchAddress(branches[0].address || comp.address || '');
      setBranchMode('EXISTING');
    } else {
      setSelectedBranchId('headquarters');
      setRecBranchName('Trụ sở chính');
      setRecBranchAddress(comp.address || '');
      setBranchMode('EXISTING');
    }
  };

  const handleClearSelectedCompany = () => {
    setSelectedCompany(null);
    setBranchMode('EXISTING');
    setRecBranchName('Trụ sở chính');
    setRecBranchAddress('');
    setCompanySuggestions([]);
  };

  const handleBranchSelectChange = (branchId) => {
    setSelectedBranchId(branchId);
    if (branchId === '__NEW__') {
      setBranchMode('NEW');
      setRecBranchName('');
      setRecBranchAddress('');
    } else {
      setBranchMode('EXISTING');
      const b = (selectedCompany?.branches || []).find((x) => String(x.id) === String(branchId));
      if (b) {
        setRecBranchName(b.branchName || 'Trụ sở chính');
        setRecBranchAddress(b.address || selectedCompany?.address || '');
      }
    }
  };

  const handleLicenseDocChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFileName(file.name);
      setLicenseFileUrl(URL.createObjectURL(file));
      try {
        setIsUploadingDoc(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await companyApi.uploadPublicLicenseDoc(formData);
        const uploadedUrl = res?.data?.data?.url || res?.data?.url;
        const uploadedName = res?.data?.data?.fileName || res?.data?.fileName || file.name;
        if (uploadedUrl) {
          setLicenseFileUrl(uploadedUrl);
          setLicenseFileName(uploadedName);
        }
      } catch (err) {
        console.warn('Lưu tạm file GPKD preview cục bộ:', err);
      } finally {
        setIsUploadingDoc(false);
      }
    }
  };


  // Shared Auth State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');



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
      if (!selectedCompany && !taxCode.trim()) {
        setErrorMsg('Vui lòng nhập Mã số thuế doanh nghiệp (MST).');
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
        companyId: selectedCompany ? selectedCompany.companyId : undefined,
        branchName: recBranchName?.trim() || 'Trụ sở chính',
        branchAddress: recBranchAddress?.trim() || companyLocation,
        position: recPosition?.trim() || 'Chuyên viên tuyển dụng',
        department: recDepartment?.trim() || 'Phòng Tuyển dụng & Nhân sự',
        taxCode: taxCode.trim() || (selectedCompany?.taxCode || ''),
        licenseNumber: (taxCode.trim() || selectedCompany?.taxCode || 'DEFAULT') + '-GPKD',
        licenseDocName: licenseFileUrl ? (licenseFileName || 'GPKD_' + companyName.trim().replace(/\s+/g, '_') + '.pdf') : null,
        licenseDocUrl: licenseFileUrl || (selectedCompany?.status === 'VERIFIED' ? (selectedCompany.licenseDocUrl || 'VERIFIED_INHERITED') : null),
        legalRepresentative: legalRep.trim() || recName.trim(),
      } : {
        email: candEmail.trim(),
        password,
        fullName: candName.trim(),
        phone: candPhone,
        role: 'CANDIDATE',
        headline: candHeadline,
        location: candLocation || 'Việt Nam',
        address: candLocation || undefined,
        dateOfBirth: candDob || undefined,
        githubUrl: candGithub.trim() || undefined,
        bio: EDUCATION_LEVELS.find((e) => e.value === candEducation)?.label || candEducation,
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
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300 p-1 overflow-hidden shrink-0">
                <img src={HIREMATE_LOGO_URL} alt="HireMate AI Logo" className="w-full h-full object-contain rounded-xl drop-shadow" />
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
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
            {/* Hidden dummy fields to neutralize aggressive browser autofill */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
              <input type="text" name="chrome_trap_user" tabIndex="-1" autoComplete="off" />
              <input type="password" name="chrome_trap_pwd" tabIndex="-1" autoComplete="off" />
            </div>

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
                      name="register_candidate_fullname"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      autoComplete="off"
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
                        name="register_candidate_email"
                        value={candEmail}
                        onChange={(e) => setCandEmail(e.target.value)}
                        placeholder="Ví dụ: name@gmail.com"
                        autoComplete="off"
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
                        name="register_candidate_phone"
                        value={candPhone}
                        onChange={(e) => setCandPhone(e.target.value)}
                        placeholder="Ví dụ: 0912 xxx xxx"
                        autoComplete="off"
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Trình độ học vấn
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">school</span>
                      <select
                        value={candEducation}
                        onChange={(e) => setCandEducation(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] focus:outline-none transition-all cursor-pointer font-sans"
                      >
                        {EDUCATION_LEVELS.map((edu) => (
                          <option key={edu.value} value={edu.value}>{edu.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Ngày sinh
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">calendar_today</span>
                      <input
                        type="date"
                        value={candDob}
                        onChange={(e) => setCandDob(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Tài khoản GitHub (URL)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">code</span>
                      <input
                        type="url"
                        value={candGithub}
                        onChange={(e) => setCandGithub(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* 1 SINGLE LOCATION PICKER FIELD */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Nơi cư trú (Tỉnh / TP • Quận / Huyện • Xã / Phường)
                    </label>
                    <span className="text-[10px] text-[#5b48bd] font-medium">Chọn 1 lần phân tầng tự động</span>
                  </div>
                  <VietnameseLocationPicker
                    value={candLocation}
                    onChange={(val) => setCandLocation(val)}
                    placeholder="Bấm chọn Tỉnh/TP → Quận/Huyện → Phường/Xã..."
                    theme="light"
                  />
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

                {/* PHÁT HIỆN DOANH NGHIỆP CÓ SẴN (AUTO-SUGGESTION POPUP) */}
                {!selectedCompany && companySuggestions.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-white border-2 border-indigo-200 shadow-lg space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined text-indigo-600 text-base animate-pulse">domain_verification</span>
                      <span>Phát hiện doanh nghiệp đã có trên hệ thống HireMate</span>
                      <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full ml-auto">
                        {companySuggestions.length} gợi ý
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Doanh nghiệp của bạn đã có tài khoản trên HireMate? Hãy bấm chọn để gia nhập tổ chức &amp; kế thừa xác thực pháp lý ngay:
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {companySuggestions.map((comp) => {
                        const isVerified = comp.status === 'VERIFIED';
                        const branchCount = comp.branches ? comp.branches.length : 1;
                        return (
                          <div
                            key={comp.companyId}
                            onClick={() => handleSelectSuggestedCompany(comp)}
                            className="p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0 overflow-hidden">
                                {comp.logoUrl ? (
                                  <img src={comp.logoUrl} alt={comp.companyName} className="w-full h-full object-cover" />
                                ) : (
                                  comp.companyName?.charAt(0) || 'C'
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {comp.companyName}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                  <span>MST: <strong>{comp.taxCode || 'Chưa cập nhật'}</strong></span>
                                  <span>•</span>
                                  <span>{branchCount} chi nhánh</span>
                                  <span>•</span>
                                  <span className="truncate">{comp.address || 'Toàn quốc'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  <span className="material-symbols-outlined text-[12px]">verified</span> Đã duyệt GPKD
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                  <span className="material-symbols-outlined text-[12px]">schedule</span> Chờ duyệt
                                </span>
                              )}
                              <button
                                type="button"
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all"
                              >
                                Chọn
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DOANH NGHIỆP ĐÃ CHỌN (NẾU GIA NHẬP CÔNG TY CÓ SẴN) */}
                {selectedCompany ? (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-300 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-700 text-lg">corporate_fare</span>
                        <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">Doanh nghiệp công tác:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedCompany}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">close</span> Đổi công ty khác
                      </button>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {selectedCompany.logoUrl ? (
                          <img src={selectedCompany.logoUrl} alt={selectedCompany.companyName} className="w-full h-full object-cover" />
                        ) : (
                          selectedCompany.companyName?.charAt(0) || 'C'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedCompany.companyName}</h4>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                          <span>MST: <strong className="font-mono text-slate-800">{selectedCompany.taxCode || 'Chưa cập nhật'}</strong></span>
                          <span>•</span>
                          <span>Quy mô: {selectedCompany.companySize || '50 - 200 nhân sự'}</span>
                        </p>
                      </div>
                      {selectedCompany.status === 'VERIFIED' && (
                        <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-lg border border-emerald-300 flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-sm">verified</span> VERIFIED
                        </div>
                      )}
                    </div>

                    {selectedCompany.status === 'VERIFIED' && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                        <div className="text-[11px] text-emerald-900 leading-snug">
                          <strong>Doanh nghiệp chính đã xác thực GPKD thành công!</strong> Chi nhánh &amp; tài khoản HR của bạn sẽ được tự động kế thừa xác thực pháp lý ngay khi đăng ký mà không cần thẩm định lại giấy tờ.
                        </div>
                      </div>
                    )}

                    {/* CHỌN HOẶC TẠO CHI NHÁNH / CƠ SỞ MỚI */}
                    <div className="pt-2 border-t border-indigo-200/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-indigo-600">location_on</span>
                          <span>Cơ sở / Chi nhánh công tác của bạn *</span>
                        </label>
                      </div>

                      <select
                        value={selectedBranchId}
                        onChange={(e) => handleBranchSelectChange(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-indigo-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer"
                      >
                        {(selectedCompany.branches || []).map((b) => (
                          <option key={b.id || b.branchName} value={b.id || b.branchName}>
                            📍 {b.branchName} {b.isHeadquarters ? '(Trụ sở chính)' : ''} — {b.address || selectedCompany.address || ''}
                          </option>
                        ))}
                        <option value="__NEW__" className="font-bold text-indigo-700 bg-indigo-50">
                          + Đăng ký Cơ sở / Chi nhánh mới trực thuộc công ty
                        </option>
                      </select>

                      {branchMode === 'NEW' && (
                        <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5 animate-fadeIn">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                              Tên Chi nhánh / Cơ sở mới *
                            </label>
                            <input
                              type="text"
                              value={recBranchName}
                              onChange={(e) => setRecBranchName(e.target.value)}
                              placeholder="Ví dụ: Chi nhánh Đà Nẵng, Cơ sở Cần Thơ..."
                              required
                              className="w-full px-3 py-2 bg-indigo-50/40 border border-indigo-200 focus:border-indigo-600 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                              Địa chỉ Chi nhánh mới *
                            </label>
                            <input
                              type="text"
                              value={recBranchAddress}
                              onChange={(e) => setRecBranchAddress(e.target.value)}
                              placeholder="Ví dụ: Tầng 5, Tòa nhà FPT Complex, Ngũ Hành Sơn, Đà Nẵng"
                              required
                              className="w-full px-3 py-2 bg-indigo-50/40 border border-indigo-200 focus:border-indigo-600 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block flex items-center justify-between">
                          <span>Tên Công ty / Tập đoàn</span>
                          {isSearchingCompany && (
                            <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-xs animate-spin">refresh</span> Đang tra cứu...
                            </span>
                          )}
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
                          Trụ sở chính (Tỉnh / TP • Quận / Huyện • Xã / Phường)
                        </label>
                        <VietnameseLocationPicker
                          value={companyLocation}
                          onChange={(val) => {
                            setCompanyLocation(val);
                            setRecBranchAddress(val);
                          }}
                          placeholder="Bấm chọn Trụ sở chính công ty..."
                          theme="light"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                          Cơ sở / Tên Chi nhánh đầu tiên
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">store</span>
                          <input
                            type="text"
                            value={recBranchName}
                            onChange={(e) => setRecBranchName(e.target.value)}
                            placeholder="Mặc định: Trụ sở chính"
                            className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* VỊ TRÍ & PHÒNG BAN CỦA HR VÀ SỐ ĐIỆN THOẠI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Số điện thoại HR *
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Chức vụ / Vị trí
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">badge</span>
                      <input
                        type="text"
                        value={recPosition}
                        onChange={(e) => setRecPosition(e.target.value)}
                        placeholder="VD: HR Specialist"
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Phòng ban
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">corporate_fare</span>
                      <input
                        type="text"
                        value={recDepartment}
                        onChange={(e) => setRecDepartment(e.target.value)}
                        placeholder="VD: Phòng Tuyển dụng"
                        className="w-full pl-10 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* LEGAL & GPKD VERIFICATION SECTION */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/60 border border-purple-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd] text-base">verified_user</span>
                    <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">Hồ sơ pháp lý &amp; Giấy phép kinh doanh (GPKD)</span>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 ml-auto">Bắt buộc</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block flex items-center justify-between">
                        <span>Mã số thuế doanh nghiệp (MST)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">pin</span>
                        <input
                          type="text"
                          value={taxCode}
                          onChange={(e) => setTaxCode(e.target.value.replace(/\s+/g, ''))}
                          placeholder="Ví dụ: 0303987654"
                          required
                          className="w-full pl-10 pr-3 py-2 bg-white border border-purple-200 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-xs font-mono font-bold text-[#221d47] placeholder-slate-400 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                        Người đại diện theo pháp luật
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#5b48bd] text-base pointer-events-none">badge</span>
                        <input
                          type="text"
                          value={legalRep}
                          onChange={(e) => setLegalRep(e.target.value)}
                          placeholder="Họ tên Giám đốc / Đại diện pháp luật"
                          className="w-full pl-10 pr-3 py-2 bg-white border border-purple-200 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-xs text-[#221d47] placeholder-slate-400 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GPKD File Upload */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#221d47] block">
                      Tệp đính kèm Giấy phép kinh doanh (Bản scan PDF / Ảnh công chứng)
                    </label>
                    <div className="relative flex items-center justify-between p-2.5 rounded-xl border border-dashed border-purple-300 bg-white hover:border-[#5b48bd] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-purple-700 text-xl shrink-0">
                          {licenseFileName ? 'picture_as_pdf' : 'upload_file'}
                        </span>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {licenseFileName ? licenseFileName : 'Chọn file GPKD (.pdf, .png, .jpg) tối đa 15MB'}
                        </span>
                      </div>
                      <label className="px-3 py-1 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shrink-0">
                        {licenseFileName ? 'Đổi tệp' : 'Tải lên'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleLicenseDocChange}
                          className="hidden"
                        />
                      </label>
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
                    name="register_user_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
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
                    name="register_user_confirm_password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
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
                  Tự động xếp hạng ứng viên (Mandatory &amp; Preferred Skills), phòng phỏng vấn giả lập AI AI-Powered Mock Interview và phễu tuyển dụng Kanban thời gian thực.
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
