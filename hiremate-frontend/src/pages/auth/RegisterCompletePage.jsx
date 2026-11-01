import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Layers,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  Calendar,
  MapPin,
  Github,
  GraduationCap
} from 'lucide-react';
import authApi from '../../api/authApi';
import { useLivingTheme } from '../../context/LivingThemeContext';
import { EDUCATION_LEVELS } from '../../utils/locationData';
import VietnameseLocationPicker from '../../components/common/VietnameseLocationPicker';

export default function RegisterCompletePage({ onNavigateLogin, onRegisterSuccess }) {
  const { theme: livingTheme } = useLivingTheme();

  // Retrieve temporary onboarding profile from Google OAuth
  const [googleData, setGoogleData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('hiremate_google_onboarding');
      if (stored) return JSON.parse(stored);
      return null;
    } catch {
      return null;
    }
  });

  const provider = googleData?.provider || 'GOOGLE';
  const providerName = provider === 'GITHUB' ? 'GitHub' : 'Google';

  const [role, setRole] = useState(googleData?.role || 'CANDIDATE');
  const [email, setEmail] = useState(googleData?.email || '');
  const [fullName, setFullName] = useState(googleData?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(googleData?.avatarUrl || '');
  const [phone, setPhone] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Candidate-specific fields
  const [headline, setHeadline] = useState('');
  const [education, setEducation] = useState('BACHELOR');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');
  const [githubUrl, setGithubUrl] = useState(googleData?.githubUrl || '');

  // Recruiter-specific fields
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [companySize, setCompanySize] = useState('100 - 500 nhân sự');
  const [branchName, setBranchName] = useState('Trụ sở chính');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [legalRepresentative, setLegalRepresentative] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!email && !googleData) {
      setErrorMessage('Không tìm thấy thông tin xác thực tài khoản. Vui lòng đăng nhập lại qua Google hoặc GitHub.');
    }
  }, [email, googleData]);

  const handleSendOtp = async () => {
    if (!email.trim() || resendCooldown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      await authApi.sendOtp({ email: email.trim(), purpose: 'REGISTER' });
      setOtpSent(true);
      setResendCooldown(60);
      setSuccessMessage(`Đã gửi mã xác thực OTP 6 số đến email ${email}. Vui lòng kiểm tra hộp thư (cả mục Spam)!`);
    } catch (err) {
      setErrorMessage(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau giây lát.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Email không được để trống.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Vui lòng cung cấp số điện thoại liên lạc.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng thiết lập mật khẩu tài khoản để có thể đăng nhập bằng Email/Mật khẩu sau này.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu và xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    if (!otpCode.trim()) {
      setErrorMessage('Vui lòng bấm gửi và nhập mã OTP 6 số để xác thực tài khoản.');
      return;
    }

    if (role === 'CANDIDATE') {
      if (dateOfBirth && dateOfBirth > new Date().toLocaleDateString('en-CA')) {
        setErrorMessage('Ngày sinh không thể là ngày trong tương lai.');
        return;
      }
      if (!headline.trim()) {
        setErrorMessage('Vui lòng nhập vị trí mong muốn hoặc định hướng nghề nghiệp (Ví dụ: Frontend Developer).');
        return;
      }
    } else {
      if (!companyName.trim()) {
        setErrorMessage('Vui lòng nhập tên công ty hoặc tổ chức tuyển dụng.');
        return;
      }
      if (!position.trim()) {
        setErrorMessage('Vui lòng nhập chức danh hoặc vị trí công tác của bạn tại doanh nghiệp.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || undefined,
        role: role,
        phone: phone.trim(),
        password: password.trim(),
        otp: otpCode.trim(),
        headline: role === 'CANDIDATE' ? headline.trim() : undefined,
        dateOfBirth: role === 'CANDIDATE' && dateOfBirth ? dateOfBirth : undefined,
        address: location || undefined,
        githubUrl: role === 'CANDIDATE' && githubUrl ? githubUrl.trim() : undefined,
        bio: role === 'CANDIDATE' ? (EDUCATION_LEVELS.find((e) => e.value === education)?.label || education) : undefined,
        companyName: role === 'RECRUITER' ? companyName.trim() : undefined,
        position: role === 'RECRUITER' ? position.trim() : undefined,
        companyAddress: role === 'RECRUITER' ? location : undefined,
        taxCode: role === 'RECRUITER' && taxCode ? taxCode.trim() : undefined,
        companySize: role === 'RECRUITER' && companySize ? companySize.trim() : undefined,
        branchName: role === 'RECRUITER' && branchName ? branchName.trim() : undefined,
        licenseNumber: role === 'RECRUITER' && licenseNumber ? licenseNumber.trim() : undefined,
        legalRepresentative: role === 'RECRUITER' && legalRepresentative ? legalRepresentative.trim() : undefined,
      };

      const res = await authApi.completeGoogleRegistration(payload);
      const authData = (res?.data && res.data.token) ? res.data : (res?.token ? res : (res?.data || res));

      if (!authData || !authData.token) {
        throw new Error(res?.message || 'Không thể tạo tài khoản. Vui lòng thử lại!');
      }

      // Cleanup onboarding temp data
      sessionStorage.removeItem('hiremate_google_onboarding');

      setSuccessMessage('🎉 Chúc mừng! Tài khoản của bạn đã được khởi tạo thành công.');

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(authData);
        } else {
          localStorage.setItem('token', authData.token);
          localStorage.setItem('user', JSON.stringify(authData));
          window.location.hash = '#/';
        }
      }, 700);

    } catch (err) {
      console.error('Complete registration error:', err);
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi hoàn tất đăng ký.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161233] via-[#241a54] to-[#120f29] text-white flex flex-col justify-center items-center p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7c3aed]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6366f1]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative z-10">
        
        {/* Header Tag */}
        <div className="flex items-center justify-between gap-3 mb-6 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#38bdf8] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Xác thực {providerName} thành công
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Hoàn tất thiết lập tài khoản
              </h1>
            </div>
          </div>

          {avatarUrl && (
            <img 
              src={avatarUrl} 
              alt={`${providerName} Avatar`} 
              className="w-12 h-12 rounded-full border-2 border-purple-400 shadow-md object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
          Chào mừng bạn đến với hệ sinh thái tuyển dụng thông minh <strong>HireMate AI</strong>. Hãy xác nhận các thông tin dưới đây và chọn vai trò của bạn để chúng tôi cá nhân hóa trải nghiệm tốt nhất.
        </p>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">

          {/* 1. ROLE SELECTION */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 block mb-3">
              1. Bạn tham gia HireMate với tư cách là ai? <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Option CANDIDATE */}
              <div 
                onClick={() => setRole('CANDIDATE')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  role === 'CANDIDATE' 
                    ? 'bg-gradient-to-r from-[#7c3aed]/30 to-[#6366f1]/20 border-purple-400 shadow-lg shadow-purple-900/30 ring-2 ring-purple-400/40' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  role === 'CANDIDATE' ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    Tôi là Ứng viên
                    {role === 'CANDIDATE' && <CheckCircle2 className="w-4 h-4 text-purple-400 ml-auto" />}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Tìm việc làm IT & phỏng vấn thử AI với phản hồi thời gian thực
                  </p>
                </div>
              </div>

              {/* Option RECRUITER */}
              <div 
                onClick={() => setRole('RECRUITER')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  role === 'RECRUITER' 
                    ? 'bg-gradient-to-r from-[#0284c7]/30 to-[#38bdf8]/20 border-cyan-400 shadow-lg shadow-cyan-900/30 ring-2 ring-cyan-400/40' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  role === 'RECRUITER' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    Tôi là Nhà tuyển dụng
                    {role === 'RECRUITER' && <CheckCircle2 className="w-4 h-4 text-cyan-400 ml-auto" />}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Đăng tin tuyển dụng, lọc CV tự động & đánh giá ứng viên bằng AI
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 2. PROFILE FIELDS */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 block mb-3">
              2. Thông tin xác thực từ {providerName}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Email (Read-Only) */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Địa chỉ Email xác thực</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Đã bảo mật qua {providerName}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    name="readonly_google_email"
                    value={email}
                    disabled
                    readOnly
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-sm text-slate-300 font-medium cursor-not-allowed select-none opacity-80"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <span className="text-xs text-slate-300 font-medium">Họ và tên <span className="text-rose-400">*</span></span>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="onboarding_user_fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    autoComplete="off"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <span className="text-xs text-slate-300 font-medium">Số điện thoại liên hệ <span className="text-rose-400">*</span></span>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    name="onboarding_user_phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 xxx xxx"
                    autoComplete="off"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* 3. ROLE-SPECIFIC FIELDS */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 block mb-3">
              3. Thông tin chuyên biệt cho {role === 'CANDIDATE' ? 'Ứng viên' : 'Doanh nghiệp'}
            </label>

            {role === 'CANDIDATE' ? (
              <div className="space-y-3 bg-purple-950/30 border border-purple-500/20 p-4 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-xs text-slate-200 font-medium">
                    Vị trí mong muốn / Tiêu đề nghề nghiệp (Headline) <span className="text-rose-400">*</span>
                  </span>
                  <div className="relative flex items-center">
                    <Briefcase className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="onboarding_candidate_headline"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Ví dụ: Frontend React Developer / Backend Java"
                      autoComplete="off"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tiêu đề này giúp thuật toán AI Matching gợi ý việc làm chính xác cho bạn.
                  </p>
                </div>

                {/* Additional Candidate Profile Fields: Education, DOB, Cascading Location, GitHub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">Trình độ học vấn</span>
                    <div className="relative flex items-center">
                      <GraduationCap className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white focus:outline-none transition-all cursor-pointer font-sans [&>option]:bg-slate-900 [&>option]:text-white"
                      >
                        {EDUCATION_LEVELS.map((edu) => (
                          <option key={edu.value} value={edu.value}>{edu.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">Ngày sinh</span>
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                      <input
                        type="date"
                        max={new Date().toLocaleDateString('en-CA')}
                        value={dateOfBirth}
                        onChange={(e) => {
                          const val = e.target.value;
                          const todayStr = new Date().toLocaleDateString('en-CA');
                          if (val && val > todayStr) {
                            setErrorMessage('Ngày sinh không thể là ngày trong tương lai.');
                            return;
                          }
                          setErrorMessage('');
                          setDateOfBirth(val);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 1 Single Location Picker Field */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200 font-medium">
                      Nơi cư trú (Tỉnh / TP • Quận / Huyện • Xã / Phường)
                    </span>
                    <span className="text-[11px] text-purple-300">Chọn 1 lần phân tầng tự động</span>
                  </div>
                  <VietnameseLocationPicker
                    value={location}
                    onChange={(val) => setLocation(val)}
                    placeholder="Bấm chọn Tỉnh/TP → Quận/Huyện → Phường/Xã..."
                    theme="dark"
                  />
                </div>

                <div className="pt-1">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">Tài khoản GitHub (URL)</span>
                    <div className="relative flex items-center">
                      <Github className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-cyan-950/30 border border-cyan-500/20 p-4 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">
                      Tên công ty / Doanh nghiệp <span className="text-rose-400">*</span>
                    </span>
                    <div className="relative flex items-center">
                      <Building2 className="w-4 h-4 text-cyan-300 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        name="onboarding_company_name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ví dụ: Tập đoàn Công nghệ ABC"
                        autoComplete="off"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-cyan-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">
                      Chức vụ / Vị trí công tác <span className="text-rose-400">*</span>
                    </span>
                    <div className="relative flex items-center">
                      <Briefcase className="w-4 h-4 text-cyan-300 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        name="onboarding_recruiter_position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Ví dụ: HR Manager / Talent Acquisition"
                        autoComplete="off"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-cyan-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-xs text-slate-200 font-medium">
                    Trụ sở chính công ty (Tỉnh / TP • Quận / Huyện • Xã / Phường)
                  </span>
                  <VietnameseLocationPicker
                    value={location}
                    onChange={(val) => setLocation(val)}
                    placeholder="Bấm chọn Trụ sở chính công ty..."
                    theme="dark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">
                      Mã số thuế doanh nghiệp (MST)
                    </span>
                    <input
                      type="text"
                      name="onboarding_tax_code"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="Ví dụ: 0312345678"
                      className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 focus:border-cyan-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">
                      Số Giấy phép KD / ĐKKD
                    </span>
                    <input
                      type="text"
                      name="onboarding_license_number"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="Ví dụ: GPKD-2024-HCM"
                      className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 focus:border-cyan-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">
                      Người đại diện pháp luật
                    </span>
                    <input
                      type="text"
                      name="onboarding_legal_rep"
                      value={legalRepresentative}
                      onChange={(e) => setLegalRepresentative(e.target.value)}
                      placeholder="Họ và tên người đại diện pháp luật"
                      className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 focus:border-cyan-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-medium">
                      Quy mô nhân sự &amp; Chi nhánh
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full px-2.5 py-2.5 bg-slate-800 border border-white/20 focus:border-cyan-400 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="10 - 50 nhân sự">10 - 50</option>
                        <option value="50 - 100 nhân sự">50 - 100</option>
                        <option value="100 - 500 nhân sự">100 - 500</option>
                        <option value="500+ nhân sự">500+</option>
                      </select>
                      <input
                        type="text"
                        name="onboarding_branch_name"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Chi nhánh làm việc"
                        className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-1">
                  Thông tin công ty giúp bạn quản lý bài đăng tuyển dụng và hồ sơ doanh nghiệp.
                </p>
              </div>
            )}
          </div>

          {/* 4. MẬT KHẨU & MÃ OTP XÁC THỰC EMAIL */}
          <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200 block">
                4. Thiết lập mật khẩu đăng nhập & Xác thực OTP <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-300">Dùng để đăng nhập trực tiếp sau này</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1">
                <span className="text-xs text-slate-300 font-medium">Mật khẩu mới <span className="text-rose-400">*</span></span>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="onboarding_user_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <span className="text-xs text-slate-300 font-medium">Xác nhận mật khẩu <span className="text-rose-400">*</span></span>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="onboarding_user_confirm_password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* OTP Section */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-300 font-medium">
                  Mã OTP xác thực 6 số (gửi về <strong className="text-purple-300">{email}</strong>) <span className="text-rose-400">*</span>
                </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || resendCooldown > 0}
                  className="px-3.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                >
                  {isSendingOtp ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi mã...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>Gửi lại sau ({resendCooldown}s)</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{otpSent ? 'Gửi lại mã OTP' : 'Gửi mã OTP qua Email'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-purple-300 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  maxLength={6}
                  name="onboarding_user_otp_code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 số OTP (Ví dụ: 123456)"
                  autoComplete="one-time-code"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 focus:bg-white/15 rounded-xl text-sm text-white tracking-widest font-mono placeholder:tracking-normal placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Mã xác thực được gửi tự động đến Gmail của bạn. (Mã kiểm thử test demo: <span className="text-purple-300 font-mono">123456</span> hoặc <span className="text-purple-300 font-mono">888888</span>).
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('hiremate_google_onboarding');
                if (onNavigateLogin) onNavigateLogin();
                else window.location.hash = '#/login';
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Quay lại trang Đăng nhập
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#6d28d9] hover:to-[#4338ca] text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang khởi tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <span>Hoàn tất đăng ký & Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
