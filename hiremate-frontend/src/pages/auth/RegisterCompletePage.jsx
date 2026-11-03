import { HIREMATE_LOGO_URL } from '../../constants/branding';
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
  GraduationCap,
  Search,
  Check,
  X,
  Building,
  UploadCloud,
  FileText
} from 'lucide-react';
import authApi from '../../api/authApi';
import companyApi from '../../api/companyApi';
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
  const [devOtpHint, setDevOtpHint] = useState('');

  // Candidate-specific fields
  const [headline, setHeadline] = useState('');
  const [education, setEducation] = useState('BACHELOR');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');
  const [githubUrl, setGithubUrl] = useState(googleData?.githubUrl || '');

  // Recruiter-specific fields & Company/Branch selection
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('Chuyên viên tuyển dụng');
  const [department, setDepartment] = useState('Phòng Tuyển dụng & Nhân sự');
  const [taxCode, setTaxCode] = useState('');
  const [companySize, setCompanySize] = useState('100 - 500 nhân sự');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [branchName, setBranchName] = useState('Trụ sở chính');
  const [branchAddress, setBranchAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [legalRepresentative, setLegalRepresentative] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  const [licenseFileUrl, setLicenseFileUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Company Lookup Autocomplete & Branch selection
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(false);
  const [branchMode, setBranchMode] = useState('EXISTING'); // 'EXISTING' | 'NEW'
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [companyHrPin, setCompanyHrPin] = useState('');
  const [bypassPinRequest, setBypassPinRequest] = useState(false);

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

  // Debounce lookup companies when typing companyName or taxCode
  useEffect(() => {
    if (role !== 'RECRUITER' || selectedCompany || dismissedSuggestions) {
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
        console.warn('Lookup companies error in RegisterComplete:', err);
      } finally {
        setIsSearchingCompany(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [companyName, taxCode, role, selectedCompany, dismissedSuggestions]);

  const handleSelectSuggestedCompany = (comp) => {
    setSelectedCompany(comp);
    setCompanyName(comp.companyName || '');
    if (comp.taxCode) setTaxCode(comp.taxCode);
    if (comp.companySize) setCompanySize(comp.companySize);
    if (comp.website) setCompanyWebsite(comp.website);
    if (comp.address) setCompanyLocation(comp.address);
    setCompanySuggestions([]);
    setDismissedSuggestions(false);

    const branches = comp.branches || [];
    if (branches.length > 0) {
      setSelectedBranchId(branches[0].id || 'headquarters');
      setBranchName(branches[0].branchName || 'Trụ sở chính');
      setBranchAddress(branches[0].address || comp.address || '');
      setBranchMode('EXISTING');
    } else {
      setSelectedBranchId('headquarters');
      setBranchName('Trụ sở chính');
      setBranchAddress(comp.address || '');
      setBranchMode('EXISTING');
    }
  };

  const handleDismissSuggestions = () => {
    setCompanySuggestions([]);
    setDismissedSuggestions(true);
  };

  const handleClearSelectedCompany = () => {
    setSelectedCompany(null);
    setCompanyName('');
    setTaxCode('');
    setCompanyWebsite('');
    setCompanyLocation('');
    setCompanyHrPin('');
    setBranchMode('EXISTING');
    setBranchName('Trụ sở chính');
    setBranchAddress('');
    setCompanySuggestions([]);
    setDismissedSuggestions(false);
  };

  const handleBranchSelectChange = (bId) => {
    setSelectedBranchId(bId);
    if (bId === '__NEW__') {
      setBranchMode('NEW');
      setBranchName('');
      setBranchAddress('');
    } else {
      setBranchMode('EXISTING');
      const b = (selectedCompany?.branches || []).find((x) => String(x.id) === String(bId));
      if (b) {
        setBranchName(b.branchName || 'Trụ sở chính');
        setBranchAddress(b.address || selectedCompany?.address || '');
      }
    }
  };

  const handleLicenseDocChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFileName(file.name);
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
      } catch (uploadErr) {
        console.warn('Doc upload fallback:', uploadErr);
        setLicenseFileUrl(URL.createObjectURL(file));
      } finally {
        setIsUploadingDoc(false);
      }
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim() || resendCooldown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      // 1. Kiểm tra xem email đã được đăng ký tài khoản chưa
      const checkRes = await authApi.checkEmail(email.trim());
      const isExisted = checkRes?.data?.data?.exists || checkRes?.data?.exists;
      if (isExisted) {
        setErrorMessage(`Email "${email.trim()}" đã được đăng ký tài khoản trong hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác!`);
        setIsSendingOtp(false);
        return;
      }

      const res = await authApi.sendOtp({ email: email.trim(), purpose: 'REGISTER' });
      setOtpSent(true);
      setResendCooldown(60);
      const hint = res?.data?.data?.otpDevHint || res?.data?.otpDevHint || res?.otpDevHint;
      if (hint) {
        setDevOtpHint(hint);
      }
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

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}$/;

    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Email không đúng định dạng hợp lệ (Ví dụ: name@example.com).');
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
    const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, ví dụ: 0912345678).');
      return;
    }
    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dobDate > today) {
        setErrorMessage('Ngày sinh không thể ở tương lai.');
        return;
      }
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 14);
      if (dobDate > minAgeDate) {
        setErrorMessage('Độ tuổi ứng viên phải từ 14 tuổi trở lên.');
        return;
      }
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
      if (!headline.trim()) {
        setErrorMessage('Vui lòng nhập vị trí mong muốn hoặc định hướng nghề nghiệp (Ví dụ: Frontend Developer).');
        return;
      }
    } else {
      if (!selectedCompany) {
        if (!companyName.trim()) {
          setErrorMessage('Vui lòng nhập tên công ty hoặc chọn từ danh sách công ty đã có.');
          return;
        }
        if (!taxCode.trim()) {
          setErrorMessage('Vui lòng nhập Mã số thuế doanh nghiệp (MST).');
          return;
        }
        if (!companyLocation.trim()) {
          setErrorMessage('Vui lòng chọn địa chỉ Trụ sở chính của công ty.');
          return;
        }
      } else {
        if (!companyHrPin.trim() && !bypassPinRequest) {
          setErrorMessage(`Vui lòng nhập Mã số xác nhận từ HR của ${selectedCompany.companyName} (hoặc chọn "Chưa có mã? Gửi duyệt") để liên kết vào tổ chức.`);
          return;
        }
      }
      if (!position.trim()) {
        setErrorMessage('Vui lòng nhập chức danh hoặc vị trí công tác của bạn tại doanh nghiệp.');
        return;
      }
      if (selectedCompany && branchMode === 'NEW') {
        if (!branchName.trim()) {
          setErrorMessage('Vui lòng nhập tên chi nhánh / cơ sở mới trực thuộc công ty.');
          return;
        }
        if (!branchAddress.trim()) {
          setErrorMessage('Vui lòng chọn địa chỉ chi nhánh mới.');
          return;
        }
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
        address: role === 'CANDIDATE' ? location : undefined,
        githubUrl: role === 'CANDIDATE' && githubUrl ? githubUrl.trim() : undefined,
        bio: role === 'CANDIDATE' ? (EDUCATION_LEVELS.find((e) => e.value === education)?.label || education) : undefined,
        companyId: role === 'RECRUITER' ? (selectedCompany?.companyId || selectedCompany?.id || undefined) : undefined,
        companyName: role === 'RECRUITER' ? (selectedCompany ? selectedCompany.companyName : companyName.trim()) : undefined,
        position: role === 'RECRUITER' ? position.trim() : undefined,
        department: role === 'RECRUITER' ? department.trim() : undefined,
        companyAddress: role === 'RECRUITER' ? (selectedCompany ? selectedCompany.address : (companyLocation || location)) : undefined,
        taxCode: role === 'RECRUITER' ? (selectedCompany ? selectedCompany.taxCode : taxCode.trim()) : undefined,
        companySize: role === 'RECRUITER' ? (selectedCompany ? selectedCompany.companySize : companySize.trim()) : undefined,
        branchName: role === 'RECRUITER' ? (branchName ? branchName.trim() : 'Trụ sở chính') : undefined,
        branchAddress: role === 'RECRUITER' ? (branchAddress ? branchAddress.trim() : (companyLocation || location)) : undefined,
        website: role === 'RECRUITER' ? (selectedCompany ? selectedCompany.website : (companyWebsite ? companyWebsite.trim() : undefined)) : undefined,
        licenseNumber: role === 'RECRUITER' && licenseNumber ? licenseNumber.trim() : undefined,
        licenseDocUrl: role === 'RECRUITER' && licenseFileUrl ? licenseFileUrl : undefined,
        licenseDocName: role === 'RECRUITER' && licenseFileName ? licenseFileName : undefined,
        legalRepresentative: role === 'RECRUITER' && legalRepresentative ? legalRepresentative.trim() : undefined,
        companyHrPin: role === 'RECRUITER' && companyHrPin ? companyHrPin.trim() : undefined,
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
    <div className="w-full min-h-screen relative flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#f8fafc] text-[#1e1b4b] font-sans selection:bg-[#5b48bd] selection:text-white">
      {/* Decorative Organic Ambient Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#5b48bd]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#10b981]/10 blur-3xl pointer-events-none" />

      {/* Main Split-Screen Card (Billage Reference Style) */}
      <div className="w-full max-w-[1120px] bg-white border border-purple-100 rounded-[32px] shadow-2xl shadow-purple-950/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-[700px] my-4">
        
        {/* ============================================================
            LEFT PANEL (5 cols): Skyscraper Backdrop + Profile Showcase
        ============================================================ */}
        <div className="lg:col-span-5 relative p-7 sm:p-9 flex flex-col justify-between overflow-hidden min-h-[360px] lg:min-h-full">
          {/* Skyscraper Backdrop */}
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80"
            onError={(e) => { e.currentTarget.src = '/assets/auth-bg.jpg'; }}
            alt="HireMate AI Corporate Architecture"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.88] contrast-[1.05] scale-105 transition-transform duration-1000"
          />
          {/* Deep Indigo Glass Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/75 via-[#32247b]/65 to-[#47369f]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/90 via-transparent to-black/20" />

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

          {/* Center User Showcase */}
          <div className="relative z-10 my-auto flex flex-col items-center text-center py-6">
            <div className="relative mb-3.5">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`${providerName} Avatar`} 
                  className="w-20 h-20 rounded-2xl border-2 border-white/40 shadow-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black shadow-xl">
                  {fullName?.charAt(0) || email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[#1e1b4b] shadow">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-white font-bold text-lg">{fullName || 'Người dùng mới'}</h3>
            <p className="text-purple-200 text-xs font-mono mt-0.5">{email}</p>
            
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xác thực {providerName} thành công</span>
            </div>

            {/* Feature Highlights */}
            <div className="w-full mt-6 space-y-2 text-left">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kế thừa định danh bảo mật từ {providerName}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
                <span>Đồng bộ hồ sơ thông minh cùng AI Matcher</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-200">
            <span>© 2026 HireMate AI</span>
            <span>v2.0 Executive Edition</span>
          </div>
        </div>

        {/* ============================================================
            RIGHT PANEL (7 cols): Clean Executive Humanist Form
        ============================================================ */}
        <div className="lg:col-span-7 p-6 sm:p-8 xl:p-10 flex flex-col justify-between space-y-5 bg-white relative z-10 max-h-[88vh] overflow-y-auto">
          
          {/* Top Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('hiremate_google_onboarding');
                if (onNavigateLogin) onNavigateLogin();
                else window.location.hash = '#/login';
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#221d47] px-3.5 py-1.5 rounded-full bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100 transition-all duration-300 cursor-pointer group"
              title="Quay lại Đăng nhập"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-[#5b48bd] group-hover:-translate-x-0.5 transition-transform" />
              <span>Đăng nhập</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã liên kết {providerName}</span>
            </span>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#221d47]">
              Hoàn tất thiết lập tài khoản
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Chào mừng bạn đến với hệ sinh thái <strong>HireMate AI</strong>. Hãy chọn vai trò và bổ sung thông tin dưới đây để kích hoạt tài khoản ngay.
            </p>
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
              <UserCheck className="w-4 h-4" />
              <span>Tôi là Ứng Viên</span>
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
              <Building2 className="w-4 h-4" />
              <span>Tôi là Nhà Tuyển Dụng</span>
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">

            {/* 1. GENERAL INFORMATION */}
            <div className="space-y-3 p-4 rounded-2xl bg-purple-50/30 border border-purple-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#5b48bd] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>1. Thông tin cá nhân &amp; Liên hệ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Readonly */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block flex items-center justify-between">
                    <span>Email đăng ký (Bảo mật qua {providerName})</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      readOnly
                      className="w-full pl-10 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-mono font-bold text-slate-600 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Họ và tên *
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Số điện thoại liên hệ *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0912 xxx xxx"
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ROLE-SPECIFIC INFORMATION */}
            {role === 'CANDIDATE' ? (
              <div className="space-y-3.5 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 animate-fadeIn">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5b48bd] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>2. Hồ sơ nghề nghiệp Ứng viên</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Vị trí mong muốn / Tiêu đề nghề nghiệp *
                  </label>
                  <div className="relative flex items-center">
                    <Briefcase className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Ví dụ: Frontend React Developer / Backend Java"
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Trình độ học vấn
                    </label>
                    <div className="relative flex items-center">
                      <GraduationCap className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] focus:outline-none transition-all cursor-pointer font-sans"
                      >
                        {EDUCATION_LEVELS.map((edu) => (
                          <option key={edu.value} value={edu.value}>{edu.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Ngày sinh
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        max={new Date().toISOString().split('T')[0]}
                        min="1920-01-01"
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Nơi cư trú (Tỉnh / TP • Quận / Huyện • Xã / Phường)
                  </label>
                  <VietnameseLocationPicker
                    value={location}
                    onChange={(val) => setLocation(val)}
                    placeholder="Bấm chọn Tỉnh/TP → Quận/Huyện → Phường/Xã..."
                    theme="light"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Tài khoản GitHub (URL)
                  </label>
                  <div className="relative flex items-center">
                    <Github className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 animate-fadeIn">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5b48bd] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>2. Thông tin Doanh nghiệp &amp; Nhân sự</span>
                </div>

                {/* Recruiter Position & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Chức vụ / Vị trí công tác *
                    </label>
                    <div className="relative flex items-center">
                      <Briefcase className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Ví dụ: HR Manager / Talent Acquisition"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                      Phòng ban làm việc
                    </label>
                    <div className="relative flex items-center">
                      <Building2 className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Ví dụ: Phòng Tuyển dụng &amp; Nhân sự"
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Search / Input */}
                <div className="space-y-2 pt-1 border-t border-purple-100">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block flex items-center justify-between">
                    <span>Doanh nghiệp / Tổ chức tuyển dụng *</span>
                    {isSearchingCompany && (
                      <span className="text-[10px] text-[#5b48bd] flex items-center gap-1 font-semibold">
                        <span className="w-3 h-3 border-2 border-[#5b48bd] border-t-transparent rounded-full animate-spin" />
                        Đang tra cứu...
                      </span>
                    )}
                  </label>

                  {!selectedCompany && (
                    <div className="relative">
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => {
                            setCompanyName(e.target.value);
                            setDismissedSuggestions(false);
                          }}
                          placeholder="Gõ tên công ty hoặc Mã số thuế để tra cứu..."
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                        />
                        {companyName && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyName('');
                              setCompanySuggestions([]);
                              setDismissedSuggestions(false);
                            }}
                            className="absolute right-3.5 text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                            title="Xóa tên công ty"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Suggestions Card */}
                      {!dismissedSuggestions && companySuggestions.length > 0 && (
                        <div className="mt-2 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-white border-2 border-indigo-200 shadow-lg space-y-2.5 animate-fadeIn">
                          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                            <span className="material-symbols-outlined text-indigo-600 text-base animate-pulse">domain_verification</span>
                            <span>Phát hiện doanh nghiệp đã có trên hệ thống</span>
                            <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                              {companySuggestions.length} gợi ý
                            </span>
                            <button
                              type="button"
                              onClick={handleDismissSuggestions}
                              className="p-1 rounded-lg bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer ml-auto shadow-xs"
                              title="Đóng / Bỏ qua gợi ý"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <p className="text-[11px] text-slate-600">
                            Bấm chọn để gia nhập tổ chức &amp; kế thừa pháp lý đã duyệt:
                          </p>

                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {companySuggestions.map((comp) => {
                              const isVerified = comp.status === 'VERIFIED';
                              const branchCount = comp.branches ? comp.branches.length : 1;
                              return (
                                <div
                                  key={comp.companyId || comp.id}
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
                                        <Check className="w-3 h-3" /> Đã duyệt
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                        Chờ duyệt
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className="px-2.5 py-1 bg-[#5b48bd] hover:bg-[#47369f] text-white text-[11px] font-bold rounded-lg transition-all"
                                    >
                                      Chọn
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Không phải công ty của bạn?</span>
                            <button
                              type="button"
                              onClick={handleDismissSuggestions}
                              className="text-indigo-600 hover:text-rose-600 font-bold hover:underline transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>Bỏ qua gợi ý &amp; Đăng ký mới</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Company Card */}
                  {selectedCompany ? (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-300 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-indigo-700" />
                          <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">Doanh nghiệp công tác:</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSelectedCompany}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Đổi công ty khác
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
                          <div className="text-xs font-extrabold text-slate-900 truncate">{selectedCompany.companyName}</div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                            <span>MST: <strong className="font-mono text-indigo-700">{selectedCompany.taxCode || 'Chưa cập nhật'}</strong></span>
                            <span>•</span>
                            <span>Quy mô: {selectedCompany.companySize || '50 - 200 nhân sự'}</span>
                          </div>
                        </div>
                        {selectedCompany.status === 'VERIFIED' && (
                          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" /> ĐÃ XÁC THỰC
                          </div>
                        )}
                      </div>

                      {/* Branch Selection */}
                      <div className="pt-2 border-t border-indigo-100 space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Chi nhánh / Cơ sở công tác *</span>
                        </label>
                        <select
                          value={selectedBranchId}
                          onChange={(e) => handleBranchSelectChange(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-indigo-200 focus:border-[#5b48bd] rounded-full text-xs font-semibold text-[#221d47] focus:outline-none cursor-pointer"
                        >
                          {(selectedCompany.branches || []).map((b) => (
                            <option key={b.id || b.branchName} value={b.id || b.branchName}>
                              📍 {b.branchName} {b.isHeadquarters ? '(Trụ sở chính)' : ''} — {b.address || selectedCompany.address || ''}
                            </option>
                          ))}
                          <option value="__NEW__" className="font-bold text-[#5b48bd]">
                            + Đăng ký Cơ sở / Chi nhánh mới trực thuộc công ty
                          </option>
                        </select>

                        {branchMode === 'NEW' && (
                          <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5 animate-fadeIn">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#221d47] block">
                                Tên Chi nhánh / Cơ sở mới *
                              </label>
                              <input
                                type="text"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                placeholder="Ví dụ: Chi nhánh Đà Nẵng, Cơ sở Cần Thơ..."
                                required
                                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-100 focus:border-[#5b48bd] rounded-lg text-xs font-semibold text-[#221d47] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#221d47] block">
                                Địa chỉ Chi nhánh mới *
                              </label>
                              <VietnameseLocationPicker
                                value={branchAddress}
                                onChange={(val) => setBranchAddress(val)}
                                placeholder="Bấm chọn địa chỉ Chi nhánh mới..."
                                theme="light"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* HR Verification PIN */}
                      <div className="pt-2 border-t border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Mã xác nhận HR Doanh nghiệp *</span>
                          </label>
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Bảo vệ pháp nhân
                          </span>
                        </div>

                        <input
                          type="text"
                          value={companyHrPin}
                          onChange={(e) => {
                            setCompanyHrPin(e.target.value.toUpperCase());
                            setBypassPinRequest(false);
                          }}
                          disabled={bypassPinRequest}
                          placeholder={`Nhập mã HR do ${selectedCompany.companyName} cấp (VD: HM-VNG-8899 hoặc MST)...`}
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-full text-xs font-mono font-bold text-[#221d47] placeholder-slate-400 focus:outline-none transition-all uppercase ${
                            bypassPinRequest 
                              ? 'opacity-50 border-slate-200' 
                              : 'border-indigo-200 focus:border-amber-500'
                          }`}
                        />

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span>💡 Nhập mã PIN do Head HR cấp hoặc nhập MST công ty.</span>
                          <button
                            type="button"
                            onClick={() => setBypassPinRequest(!bypassPinRequest)}
                            className="text-[#5b48bd] hover:underline font-bold cursor-pointer"
                          >
                            {bypassPinRequest ? 'Nhập mã trực tiếp' : 'Chưa có mã? Gửi duyệt'}
                          </button>
                        </div>

                        {bypassPinRequest && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Tài khoản sẽ được gửi vào danh sách chờ duyệt của Trụ sở chính công ty.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* NẾU LÀ CÔNG TY MỚI TOÀN BỘ */
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block flex items-center justify-between">
                            <span>Mã số thuế doanh nghiệp (MST) *</span>
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={taxCode}
                              onChange={(e) => setTaxCode(e.target.value.replace(/\s+/g, ''))}
                              placeholder="Ví dụ: 0303987654"
                              required
                              className="w-full px-3 py-2 bg-white border border-purple-100 focus:border-[#5b48bd] rounded-full text-xs font-mono font-bold text-[#221d47] placeholder-slate-400 focus:outline-none"
                            />
                            {taxCode && (
                              <button
                                type="button"
                                onClick={() => setTaxCode('')}
                                className="absolute right-3 text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Xóa mã số thuế"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                            Quy mô nhân sự
                          </label>
                          <select
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-purple-100 focus:border-[#5b48bd] rounded-full text-xs text-[#221d47] focus:outline-none cursor-pointer"
                          >
                            <option value="10 - 50 nhân sự">10 - 50 nhân sự (Startup)</option>
                            <option value="50 - 100 nhân sự">50 - 100 nhân sự (SME)</option>
                            <option value="100 - 500 nhân sự">100 - 500 nhân sự</option>
                            <option value="500+ nhân sự">500+ nhân sự (Enterprise)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                          Trụ sở chính công ty *
                        </label>
                        <VietnameseLocationPicker
                          value={companyLocation}
                          onChange={(val) => {
                            setCompanyLocation(val);
                            if (!branchAddress) setBranchAddress(val);
                          }}
                          placeholder="Bấm chọn Trụ sở chính công ty..."
                          theme="light"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                            Tên cơ sở / Chi nhánh làm việc
                          </label>
                          <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="Mặc định: Trụ sở chính"
                            className="w-full px-3 py-2 bg-white border border-purple-100 focus:border-[#5b48bd] rounded-full text-xs text-[#221d47] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                            Website doanh nghiệp
                          </label>
                          <input
                            type="url"
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            placeholder="https://company.com"
                            className="w-full px-3 py-2 bg-white border border-purple-100 focus:border-[#5b48bd] rounded-full text-xs text-[#221d47] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                            Số Giấy phép KD / ĐKKD
                          </label>
                          <input
                            type="text"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder="Ví dụ: GPKD-2024-HCM"
                            className="w-full px-3 py-2 bg-white border border-purple-100 focus:border-[#5b48bd] rounded-full text-xs text-[#221d47] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                            Người đại diện pháp luật
                          </label>
                          <input
                            type="text"
                            value={legalRepresentative}
                            onChange={(e) => setLegalRepresentative(e.target.value)}
                            placeholder="Họ và tên người đại diện"
                            className="w-full px-3 py-2 bg-white border border-purple-100 focus:border-[#5b48bd] rounded-full text-xs text-[#221d47] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Upload GPKD */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                          Tải lên bản scan Giấy phép kinh doanh (PDF / Ảnh)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#5b48bd] text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer transition-all">
                            <UploadCloud className="w-4 h-4" />
                            <span>{isUploadingDoc ? 'Đang tải file...' : 'Chọn file GPKD'}</span>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg"
                              onChange={handleLicenseDocChange}
                              className="hidden"
                            />
                          </label>
                          {licenseFileName && (
                            <span className="text-xs text-emerald-700 font-medium truncate flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> {licenseFileName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. PASSWORD & EMAIL OTP VERIFICATION */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5b48bd] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>3. Thiết lập mật khẩu &amp; Xác thực OTP</span>
                </div>
                <span className="text-[10px] text-slate-500">Dùng đăng nhập trực tiếp sau này</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Mật khẩu mới *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47] block">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu..."
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] placeholder-slate-400 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* OTP Input & Send Button */}
              <div className="pt-2 border-t border-purple-100 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#221d47]">
                    Mã OTP 6 số (gửi về <strong className="text-[#5b48bd] font-mono">{email}</strong>) *
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || resendCooldown > 0}
                    className="px-3.5 py-1.5 bg-[#5b48bd]/10 hover:bg-[#5b48bd]/20 border border-[#5b48bd]/30 text-[#5b48bd] text-xs font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {isSendingOtp ? (
                      <>
                        <div className="w-3 h-3 border-2 border-[#5b48bd] border-t-transparent rounded-full animate-spin" />
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
                  <KeyRound className="w-4 h-4 text-[#5b48bd] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập 6 số OTP (Ví dụ: 123456)"
                    autoComplete="one-time-code"
                    required
                    className="w-full pl-10 pr-24 py-2.5 bg-white border border-purple-100 focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47] tracking-widest font-mono placeholder:tracking-normal placeholder-slate-400 focus:outline-none transition-all"
                  />
                  {devOtpHint && (
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpHint)}
                      className="absolute right-2 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold rounded-full transition-all cursor-pointer"
                    >
                      Điền {devOtpHint}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                  <span>Mã OTP tự động gửi đến email của bạn. Mã test demo: <span className="text-[#5b48bd] font-mono font-bold">123456</span> hoặc <span className="text-[#5b48bd] font-mono font-bold">888888</span>.</span>
                  {devOtpHint && (
                    <span className="text-amber-700 font-medium">Mã vừa tạo: <strong className="font-mono">{devOtpHint}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('hiremate_google_onboarding');
                  if (onNavigateLogin) onNavigateLogin();
                  else window.location.hash = '#/login';
                }}
                className="text-xs text-slate-500 hover:text-[#221d47] transition-colors cursor-pointer"
              >
                ← Quay lại trang Đăng nhập
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-sm rounded-full shadow-lg shadow-[#5b48bd]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Hoàn tất thiết lập &amp; Đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
