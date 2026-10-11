import React, { useState, useEffect } from 'react';

/**
 * HireMate.AI - Enterprise Admin Dashboard Page (Mindskills UI Redesign)
 * Styled in 100% visual harmony with Homepage & Recruiter Dashboard
 * Features 8 Tab Sections:
 * 1. Overview (Dashboard Báo cáo & Phân tích)
 * 2. Companies Approval (Duyệt Hồ Sơ Doanh Nghiệp & GPKD)
 * 3. Orders (Đơn mua gói dịch vụ)
 * 4. Packages (Gói dịch vụ & Bảng giá)
 * 5. Combos & Promotions (Combo & Khuyến mãi)
 * 6. Users (Quản lý Người dùng)
 * 7. Revenue Analytics (Thống kê Doanh thu)
 * 8. System Settings (Cấu hình AI Matching 70/30 & Hệ thống)
 */

const INITIAL_COMPANIES = [
  {
    id: 'CMP-101',
    name: 'Công ty TNHH Phần Mềm FPT (FPT Software)',
    shortName: 'FPT Software',
    taxCode: '0101234567',
    recruiterName: 'Nguyễn Minh Anh',
    recruiterEmail: 'minhanh.hr@fptsoftware.com',
    recruiterPhone: '0988 123 456',
    industry: 'Công Nghệ Thông Tin & Phần Mềm',
    scale: '10.000+ nhân viên',
    headquarters: 'Tòa nhà FPT, Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
    website: 'https://fptsoftware.com',
    status: 'PENDING', // PENDING | VERIFIED | REJECTED
    submittedAt: '30 phút trước',
    docUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    docName: 'Giay_Phep_Kinh_Doanh_FPT_Software_2026.pdf',
    notes: 'Đã đính kèm GPKD cấp ngày 15/03/2024 tại Sở KH&ĐT TP.HCM',
    logo: 'FPT',
    logoBg: 'bg-[#5b48bd]',
  },
  {
    id: 'CMP-102',
    name: 'Công ty Cổ phần VNG (VNG Corporation)',
    shortName: 'VNG Group',
    taxCode: '0303987654',
    recruiterName: 'Hoàng Yến TA Lead',
    recruiterEmail: 'recruitment@vng.com.vn',
    recruiterPhone: '0912 345 678',
    industry: 'Internet, Game & Cloud Services',
    scale: '5.000+ nhân viên',
    headquarters: 'Z06 Đường số 13, Phường Tân Thuận Đông, Quận 7, TP.HCM',
    website: 'https://vng.com.vn',
    status: 'PENDING',
    submittedAt: '2 giờ trước',
    docUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    docName: 'VNG_Business_License_2026.pdf',
    notes: 'Yêu cầu xác thực tài khoản doanh nghiệp VIP',
    logo: 'VNG',
    logoBg: 'bg-[#10b981]',
  },
  {
    id: 'CMP-103',
    name: 'Ngân hàng TMCP Quân Đội (MBBank)',
    shortName: 'MBBank',
    taxCode: '0100112233',
    recruiterName: 'Quốc Bảo HR Manager',
    recruiterEmail: 'talent@mbbank.com.vn',
    recruiterPhone: '0903 888 999',
    industry: 'Tài Chính & Ngân Hàng',
    scale: '15.000+ nhân viên',
    headquarters: '63 Lê Văn Lương, Cầu Giấy, Hà Nội',
    website: 'https://mbbank.com.vn',
    status: 'VERIFIED',
    submittedAt: '1 ngày trước',
    docUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    docName: 'MBBank_Giay_Phep_Hoat_Dong.pdf',
    notes: 'Hồ sơ ngân hàng thương mại được xác thực hợp lệ',
    logo: 'MBB',
    logoBg: 'bg-[#f97316]',
  },
  {
    id: 'CMP-104',
    name: 'Công ty Cổ phần Công Nghệ KMS (KMS Technology)',
    shortName: 'KMS Tech',
    taxCode: '0310998877',
    recruiterName: 'Trần Đức Thịnh HRBP',
    recruiterEmail: 'careers@kms-technology.com',
    recruiterPhone: '0977 665 544',
    industry: 'Outsourcing & AI R&D',
    scale: '1.500+ nhân viên',
    headquarters: '123 Cộng Hòa, Quận Tân Bình, TP.HCM',
    website: 'https://kms-technology.com',
    status: 'VERIFIED',
    submittedAt: '3 ngày trước',
    docUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    docName: 'KMS_Tech_GPKD.pdf',
    notes: 'Đã xác minh MST và tư cách pháp nhân',
    logo: 'KMS',
    logoBg: 'bg-[#06b6d4]',
  },
  {
    id: 'CMP-105',
    name: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel Solutions)',
    shortName: 'Viettel Solutions',
    taxCode: '0100109106',
    recruiterName: 'Phạm Thu Hương TA Lead',
    recruiterEmail: 'huongpt@viettel.com.vn',
    recruiterPhone: '0989 999 111',
    industry: 'Telecom & Enterprise Solutions',
    scale: '20.000+ nhân viên',
    headquarters: 'Lô D26 Khu đô thị mới Cầu Giấy, Yên Hòa, Cầu Giấy, Hà Nội',
    website: 'https://viettelsolutions.com.vn',
    status: 'PENDING',
    submittedAt: '4 giờ trước',
    docUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    docName: 'Viettel_Enterprise_License.pdf',
    notes: 'Đơn đăng ký doanh nghiệp đối tác chiến lược',
    logo: 'VTS',
    logoBg: 'bg-[#8b5cf6]',
  },
  {
    id: 'CMP-106',
    name: 'Công ty TNHH Truyền Thông Đa Phương Tiện (Fake Media Ltd)',
    shortName: 'Fake Media',
    taxCode: '9999999999',
    recruiterName: 'Trương Văn X',
    recruiterEmail: 'fake.recruiter@spam.com',
    recruiterPhone: '0123 456 789',
    industry: 'Digital Marketing Unverified',
    scale: '5 nhân viên',
    headquarters: 'Địa chỉ không rõ ràng',
    website: 'http://spam-link.xyz',
    status: 'REJECTED',
    submittedAt: '5 ngày trước',
    docUrl: '',
    docName: 'File_Loi_Khong_Hop_Le.pdf',
    notes: 'Mã số thuế giả mạo, không tìm thấy trên cổng ĐKKD quốc gia',
    logo: 'FM',
    logoBg: 'bg-rose-600',
  },
];

const INITIAL_ORDERS = [
  {
    id: '#ORD-0421',
    user: 'Nguyễn Minh Anh',
    role: 'Recruiter',
    email: 'minhanh.hr@fptsoftware.com',
    pkg: 'Hiring Pro (Combo)',
    amount: 599000,
    amountText: '599.000 đ',
    status: 'PENDING',
    timestamp: '20 phút trước',
    voucherCode: null,
    paymentMethod: 'VietQR - MBBank (Stk: 0987654321)',
    txHash: 'MBB-84729103',
  },
  {
    id: '#ORD-0420',
    user: 'Trần Hoàng Nam',
    role: 'Candidate',
    email: 'nam.tran@gmail.com',
    pkg: 'Practice Pro · 30 ngày',
    amount: 149000,
    amountText: '149.000 đ',
    status: 'APPROVED',
    timestamp: '45 phút trước',
    voucherCode: null,
    paymentMethod: 'MoMo QR Auto',
    txHash: 'MM-99201482',
  },
  {
    id: '#ORD-0419',
    user: 'FPT Software',
    role: 'Recruiter',
    email: 'ta@fpt.com',
    pkg: 'Hiring Elite (Combo)',
    amount: 1199000,
    amountText: '1.199.000 đ',
    status: 'PENDING',
    timestamp: '1 giờ trước',
    voucherCode: null,
    paymentMethod: 'Chuyển khoản Techcombank',
    txHash: 'TCB-01928472',
  },
  {
    id: '#ORD-0418',
    user: 'Lê Thu Trang',
    role: 'Candidate',
    email: 'trang.le@fpt.edu.vn',
    pkg: 'Practice Pro · 30 ngày',
    amount: 89000,
    amountText: '89.000 đ',
    status: 'APPROVED',
    timestamp: '2 giờ trước',
    voucherCode: 'SV-FPT40',
    paymentMethod: 'VietQR - VPBank',
    txHash: 'VPB-77491029',
  },
  {
    id: '#ORD-0417',
    user: 'Vũ Quốc Bảo',
    role: 'Candidate',
    email: 'bao.vu@yahoo.com',
    pkg: 'Quick Prep (Combo)',
    amount: 79000,
    amountText: '79.000 đ',
    status: 'REJECTED',
    timestamp: '2.5 giờ trước',
    voucherCode: null,
    paymentMethod: 'VietQR - MBBank',
    txHash: 'MBB-00192837',
  },
  {
    id: '#ORD-0416',
    user: 'VNG Corporation',
    role: 'Recruiter',
    email: 'recruitment@vng.com.vn',
    pkg: 'Professional · Gói quý',
    amount: 1272000,
    amountText: '1.272.000 đ',
    status: 'APPROVED',
    timestamp: '3 giờ trước',
    voucherCode: null,
    paymentMethod: 'VNPay QR',
    txHash: 'VNP-88371920',
  },
  {
    id: '#ORD-0415',
    user: 'Phạm Gia Hân',
    role: 'Candidate',
    email: 'giahan.pham@outlook.com',
    pkg: 'Practice Unlimited',
    amount: 299000,
    amountText: '299.000 đ',
    status: 'REFUNDED',
    timestamp: '4 giờ trước',
    voucherCode: null,
    paymentMethod: 'VietQR - Vietcombank',
    txHash: 'VCB-55910294',
  },
  {
    id: '#ORD-0414',
    user: 'KMS Technology',
    role: 'Recruiter',
    email: 'careers@kms-technology.com',
    pkg: 'Team Starter (Bundle)',
    amount: 699000,
    amountText: '699.000 đ',
    status: 'PENDING',
    timestamp: '5 giờ trước',
    voucherCode: null,
    paymentMethod: 'Chuyển khoản ACB',
    txHash: 'ACB-88273910',
  },
  {
    id: '#ORD-0413',
    user: 'Đỗ Khánh Linh',
    role: 'Candidate',
    email: 'khanhlinh.do@gmail.com',
    pkg: 'Practice Plus · 7 ngày',
    amount: 49000,
    amountText: '49.000 đ',
    status: 'PENDING',
    timestamp: '5 giờ trước',
    voucherCode: null,
    paymentMethod: 'MoMo QR',
    txHash: 'MM-44910284',
  },
];

const INITIAL_VOUCHERS = [
  {
    id: 1,
    code: 'HIREMATE30',
    discount: 'Giảm 30%',
    description: 'Voucher launching ưu đãi thành viên mới',
    status: 'EXPIRED',
    usage: '200/200 lượt',
    percent: 100,
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  {
    id: 2,
    code: 'SV-FPT40',
    discount: 'Giảm 40% Practice cho sinh viên FPT',
    description: 'Áp dụng gói Practice Pro 30 ngày',
    status: 'ACTIVE',
    usage: '142/200 lượt',
    percent: 71,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 3,
    code: 'Ưu đãi gia hạn',
    discount: 'Giảm thêm 10% khi gia hạn trước 3 ngày',
    description: 'Áp dụng khi gia hạn tài khoản tự động',
    status: 'ACTIVE',
    usage: '89/100 lượt',
    percent: 89,
    badgeBg: 'bg-purple-50 text-[#5b48bd] border-purple-200',
  },
];

const INITIAL_PACKAGES = [
  {
    id: 'pkg-1',
    name: 'Practice Pro',
    targetRole: 'Candidate',
    price: 149000,
    priceText: '149.000 đ/tháng',
    duration: '30 ngày',
    subscribersCount: 71,
    sharePercent: '26%',
    status: 'ACTIVE',
    color: '#5b48bd',
    features: ['30 lượt AI Voice Interview', 'Phân tích điểm ATS chuyên sâu', 'Tải CV PDF không giới hạn'],
  },
  {
    id: 'pkg-2',
    name: 'Hiring Pro (Combo)',
    targetRole: 'Recruiter',
    price: 599000,
    priceText: '599.000 đ/tháng',
    duration: '30 ngày',
    subscribersCount: 62,
    sharePercent: '23%',
    status: 'ACTIVE',
    color: '#10b981',
    features: ['Đăng 10 tin tuyển dụng', 'Thuật toán Matching AI', 'Gợi ý top 5% ứng viên xuất sắc'],
  },
  {
    id: 'pkg-3',
    name: 'Career Ace (Combo)',
    targetRole: 'Candidate',
    price: 299000,
    priceText: '299.000 đ/quý',
    duration: '90 ngày',
    subscribersCount: 54,
    sharePercent: '20%',
    status: 'ACTIVE',
    color: '#f97316',
    features: ['Không giới hạn Luyện PV AI', 'Báo cáo Xu hướng Ngành', 'Fast-track CV tới Recruiter VIP'],
  },
  {
    id: 'pkg-4',
    name: 'Professional',
    targetRole: 'Recruiter',
    price: 1272000,
    priceText: '1.272.000 đ/quý',
    duration: '90 ngày',
    subscribersCount: 48,
    sharePercent: '17%',
    status: 'ACTIVE',
    color: '#06b6d4',
    features: ['Đăng tin không giới hạn', 'Dashboard Pipeline Kanban', 'Hỗ trợ phỏng vấn kỹ thuật AI'],
  },
  {
    id: 'pkg-5',
    name: 'Quick Prep (Combo)',
    targetRole: 'Candidate',
    price: 79000,
    priceText: '79.000 đ/tuần',
    duration: '7 ngày',
    subscribersCount: 40,
    sharePercent: '14%',
    status: 'ACTIVE',
    color: '#8b5cf6',
    features: ['10 lượt phỏng vấn gấp', 'Review CV cơ bản'],
  },
];

const INITIAL_USERS = [
  { id: 1001, name: 'Nguyễn Minh Anh', email: 'minhanh.hr@fptsoftware.com', role: 'RECRUITER', company: 'FPT Software', status: 'ACTIVE', joined: '12/01/2026' },
  { id: 1002, name: 'Trần Hoàng Nam', email: 'nam.tran@gmail.com', role: 'CANDIDATE', company: '-', status: 'ACTIVE', joined: '15/02/2026' },
  { id: 1003, name: 'Quản trị viên Hệ thống', email: 'admin@hiremate.ai', role: 'ADMIN', company: 'HireMate AI Core', status: 'ACTIVE', joined: '01/01/2026' },
  { id: 1004, name: 'Lê Thu Trang', email: 'trang.le@fpt.edu.vn', role: 'CANDIDATE', company: 'FPT University', status: 'ACTIVE', joined: '03/03/2026' },
  { id: 1005, name: 'VNG Recruitment Team', email: 'recruitment@vng.com.vn', role: 'RECRUITER', company: 'VNG Corporation', status: 'ACTIVE', joined: '20/03/2026' },
  { id: 1006, name: 'Vũ Quốc Bảo', email: 'bao.vu@yahoo.com', role: 'CANDIDATE', company: '-', status: 'LOCKED', joined: '10/04/2026' },
];

export default function AdminDashboardPage({ user, onLogout }) {
  // Parse initial tab from URL hash if present
  const getInitialTab = () => {
    const rawHash = window.location.hash || '';
    if (rawHash.includes('tab=companies') || rawHash.includes('tab=company')) return 'companies';
    if (rawHash.includes('tab=orders')) return 'orders';
    if (rawHash.includes('tab=packages')) return 'packages';
    if (rawHash.includes('tab=promotions')) return 'promotions';
    if (rawHash.includes('tab=users')) return 'users';
    if (rawHash.includes('tab=analytics')) return 'analytics';
    if (rawHash.includes('tab=settings')) return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync tab change when URL hash updates
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash || '';
      if (rawHash.includes('tab=companies') || rawHash.includes('tab=company')) setActiveTab('companies');
      else if (rawHash.includes('tab=orders')) setActiveTab('orders');
      else if (rawHash.includes('tab=packages')) setActiveTab('packages');
      else if (rawHash.includes('tab=promotions')) setActiveTab('promotions');
      else if (rawHash.includes('tab=users')) setActiveTab('users');
      else if (rawHash.includes('tab=analytics')) setActiveTab('analytics');
      else if (rawHash.includes('tab=settings')) setActiveTab('settings');
      else if (rawHash.includes('admin')) setActiveTab('dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Data states
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [packagesList, setPackagesList] = useState(INITIAL_PACKAGES);
  const [usersList, setUsersList] = useState(INITIAL_USERS);

  // Interactive UI Modals & Popups
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedCompanyDossier, setSelectedCompanyDossier] = useState(null);
  const [rejectingCompanyModal, setRejectingCompanyModal] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [companyViewMode, setCompanyViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [companyStatusFilter, setCompanyStatusFilter] = useState('PENDING'); // 'PENDING' | 'VERIFIED' | 'USERS' | 'ALL' | 'REJECTED'
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL' | 'CANDIDATE' | 'RECRUITER' | 'ADMIN'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateVoucherModal, setShowCreateVoucherModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // System Settings State (Master Spec 70/30)
  const [mandatoryWeight, setMandatoryWeight] = useState(70);
  const [preferredWeight, setPreferredWeight] = useState(30);
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(500000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Computed Pending Sets
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const pendingCompanies = companies.filter((c) => c.status === 'PENDING');
  const verifiedCompanies = companies.filter((c) => c.status === 'VERIFIED');
  const rejectedCompanies = companies.filter((c) => c.status === 'REJECTED');

  // Trigger Toast Notification helper
  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Company Approval Action Handlers
  const handleApproveCompany = (companyId) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, status: 'VERIFIED' } : c))
    );
    setSelectedCompanyIds((prev) => prev.filter((id) => id !== companyId));
    triggerToast(`Đã duyệt xác minh GPKD thành công cho công ty ${companyId}`);
  };

  const handleOpenRejectCompany = (companyObj) => {
    setRejectingCompanyModal(companyObj);
    setRejectionNote('Mã số thuế hoặc Giấy phép kinh doanh chưa khớp với Cổng DKKD quốc gia.');
  };

  const handleConfirmRejectCompany = () => {
    if (!rejectingCompanyModal) return;
    const cid = rejectingCompanyModal.id;
    setCompanies((prev) =>
      prev.map((c) => (c.id === cid ? { ...c, status: 'REJECTED', notes: `Lý do từ chối: ${rejectionNote}` } : c))
    );
    setSelectedCompanyIds((prev) => prev.filter((id) => id !== cid));
    triggerToast(`Đã từ chối hồ sơ công ty ${cid}. Email thông báo đã gửi tới Recruiter.`, 'warning');
    setRejectingCompanyModal(null);
    setRejectionNote('');
  };

  const handleToggleSelectCompany = (id) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllCompanies = (filteredList) => {
    const allFilteredIds = filteredList.map((c) => c.id);
    const allSelected = allFilteredIds.every((id) => selectedCompanyIds.includes(id));
    if (allSelected) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(allFilteredIds);
    }
  };

  const handleBatchApproveCompanies = () => {
    if (selectedCompanyIds.length === 0) return;
    setCompanies((prev) =>
      prev.map((c) => (selectedCompanyIds.includes(c.id) ? { ...c, status: 'VERIFIED' } : c))
    );
    triggerToast(`Đã duyệt GPKD hàng loạt cho ${selectedCompanyIds.length} doanh nghiệp!`);
    setSelectedCompanyIds([]);
  };

  // Quick Action Handlers for Orders
  const handleApproveOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'APPROVED' } : o))
    );
    triggerToast(`Đã duyệt thành công đơn mua ${orderId}`);
  };

  const handleRejectOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'REJECTED' } : o))
    );
    triggerToast(`Đã từ chối đơn mua ${orderId}`, 'warning');
  };

  const handleRefundOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'REFUNDED' } : o))
    );
    triggerToast(`Đã hoàn tiền cho đơn mua ${orderId}`, 'info');
  };

  const handleToggleVoucher = (id) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status: v.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE' }
          : v
      )
    );
    triggerToast(`Cập nhật trạng thái voucher thành công`);
  };

  const handleToggleUserLock = (userId) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' }
          : u
      )
    );
    triggerToast(`Cập nhật trạng thái người dùng thành công`);
  };

  const handleExportPDF = () => {
    triggerToast('Đang khởi tạo và xuất báo cáo tổng quan PDF...', 'info');
  };

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#/admin-dashboard?tab=${tabId}`;
  };

  return (
    <div className="admin-page min-h-screen bg-transparent text-[#1e1b4b] py-4 sm:py-6 px-2 sm:px-6 lg:px-8 font-sans animate-fade-in relative">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast Notification Floating Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#32247b] text-white shadow-2xl border border-indigo-300/40 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-[#10b981] text-xl">
              {toastMessage.type === 'warning' ? 'warning' : toastMessage.type === 'info' ? 'info' : 'check_circle'}
            </span>
            <span className="text-xs sm:text-sm font-semibold">{toastMessage.msg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* EXECUTIVE ADMIN PORTAL TOP BANNER CARD                   */}
        {/* ========================================================= */}
        <div className="bg-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-md flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#5b48bd] text-white shadow-md shrink-0 flex items-center justify-center font-bold text-lg">
            ADM
          </div>
          <div>
            <h1 className="font-bold text-2xl sm:text-3xl text-[#1e1b4b]">
              {user?.fullName || 'Quản trị viên Hệ thống'}
            </h1>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OVERVIEW SUB-NAVIGATION PILL BAR ("Nơi tổng quan")       */}
        {/* ========================================================= */}
        {(activeTab === 'dashboard' || activeTab === 'analytics') && (
          <div className="bg-white p-2.5 rounded-3xl border border-purple-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Báo Cáo Tổng Quan', icon: 'dashboard' },
              { id: 'analytics', label: 'Phân Tích Doanh Thu', icon: 'trending_up' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#5b48bd] text-white shadow-md font-extrabold'
                      : 'text-[#47369f] hover:bg-purple-50 hover:text-[#5b48bd] border border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW DASHBOARD                      */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Top Control Bar: Search & Time Filter Pills */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">query_stats</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#221d47] tracking-tight">
                    Tổng Quan Hoạt Động Toàn Hệ Thống
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium pl-11">
                  Cập nhật thời gian thực lúc 14:35 • Ngày 08/10/2026
                </p>
              </div>

              {/* Timeframe selector & Filter button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-purple-50/80 p-1 rounded-full border border-purple-100 text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setTimeFilter('7d')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      timeFilter === '7d' ? 'bg-[#5b48bd] text-white shadow-xs' : 'hover:text-[#5b48bd]'
                    }`}
                  >
                    7 ngày
                  </button>
                  <button
                    onClick={() => setTimeFilter('30d')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      timeFilter === '30d' ? 'bg-[#5b48bd] text-white shadow-xs' : 'hover:text-[#5b48bd]'
                    }`}
                  >
                    30 ngày
                  </button>
                  <button
                    onClick={() => setTimeFilter('6m')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      timeFilter === '6m' ? 'bg-[#5b48bd] text-white shadow-xs' : 'hover:text-[#5b48bd]'
                    }`}
                  >
                    6 tháng
                  </button>
                </div>

                <button
                  onClick={() => setShowFilterModal(true)}
                  className="px-4 py-2 rounded-full border border-purple-200 bg-white hover:bg-purple-50 text-[#5b48bd] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  <span>Lọc dữ liệu</span>
                </button>
              </div>
            </div>

            {/* 5 PRIMARY MINDSKILLS KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Tổng người dùng */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Tổng người dùng</span>
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">group</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight">3.750</div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                    <span className="inline-flex items-center text-emerald-600 font-bold gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-xs">trending_up</span>+8,2%
                    </span>
                    <span className="text-slate-400">so với kỳ trước</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Gói trả phí hoạt động */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Gói trả phí Active</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight">275</div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                    <span className="inline-flex items-center text-emerald-600 font-bold gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-xs">trending_up</span>+5,1%
                    </span>
                    <span className="text-slate-400">so với kỳ trước</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Doanh thu tháng này */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Doanh thu tháng này</span>
                  <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#f97316] border border-orange-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight whitespace-nowrap">
                    74,7tr đ
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                    <span className="inline-flex items-center text-emerald-600 font-bold gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-xs">trending_up</span>+12,4%
                    </span>
                    <span className="text-slate-400">tháng trước</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Công Ty Chờ Duyệt (NEW ITEM REQUIRED BY USER) */}
              <div 
                onClick={() => handleTabSelect('companies')}
                className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group hover:border-amber-300"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Công ty chờ duyệt</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">domain_verification</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight flex items-center gap-2">
                    <span>{pendingCompanies.length}</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">GPKD mới</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-amber-700 font-bold flex items-center gap-1">
                    <span>Duyệt sơ duyệt giấy phép →</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Đơn mua chờ duyệt */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Đơn mua chờ duyệt</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                    Cần xử lý
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight">
                    {pendingOrders.length}
                  </div>
                  <div className="mt-1.5 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>Trong 24h
                  </div>
                </div>
              </div>
            </div>

            {/* 2-COLUMN INTERACTIVE VISUAL CHARTS SUITE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left: 6-Month Revenue Line Chart (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-purple-100 p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-bold text-[#1e1b4b]">
                          Biểu Đồ Doanh Thu 6 Tháng Đầu
                        </h3>
                        <span className="px-2 py-0.5 bg-purple-50 text-[#5b48bd] border border-purple-100 rounded text-[11px] font-semibold">
                          Triệu VNĐ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Tăng trưởng liên tục từ T1 đến T6/2026</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-4 h-1 rounded bg-[#5b48bd]"></span>Thực tế
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-4 h-0.5 border-t border-dashed border-slate-400"></span>Mục tiêu
                      </span>
                    </div>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="w-full pt-2">
                    <svg className="w-full h-56 overflow-visible" preserveAspectRatio="none" viewBox="0 0 740 220">
                      <defs>
                        <linearGradient id="purpleGradientMindskills2" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#5b48bd" stopOpacity="0.25"></stop>
                          <stop offset="100%" stopColor="#5b48bd" stopOpacity="0.0"></stop>
                        </linearGradient>
                      </defs>
                      <line stroke="#F1F5F9" strokeDasharray="3 3" x1="45" x2="720" y1="20" y2="20"></line>
                      <text fill="#94A3B8" fontSize="11" textAnchor="end" x="36" y="24">80</text>
                      <line stroke="#F1F5F9" strokeDasharray="3 3" x1="45" x2="720" y1="65" y2="65"></line>
                      <text fill="#94A3B8" fontSize="11" textAnchor="end" x="36" y="69">60</text>
                      <line stroke="#F1F5F9" strokeDasharray="3 3" x1="45" x2="720" y1="110" y2="110"></line>
                      <text fill="#94A3B8" fontSize="11" textAnchor="end" x="36" y="114">40</text>
                      <line stroke="#F1F5F9" strokeDasharray="3 3" x1="45" x2="720" y1="155" y2="155"></line>
                      <text fill="#94A3B8" fontSize="11" textAnchor="end" x="36" y="159">20</text>
                      <line stroke="#E2E8F0" strokeWidth="1.2" x1="45" x2="720" y1="190" y2="190"></line>
                      <text fill="#94A3B8" fontSize="11" textAnchor="end" x="36" y="194">0</text>

                      <path
                        d="M 80 178 L 200 156 L 320 134 L 440 108 L 560 76 L 680 44"
                        fill="none"
                        stroke="#64748b"
                        strokeDasharray="4 4"
                        strokeOpacity="0.5"
                        strokeWidth="1.5"
                      ></path>

                      <path
                        d="M 80 177 L 200 161 L 320 139 L 440 108 L 560 71 L 680 22 L 680 190 L 80 190 Z"
                        fill="url(#purpleGradientMindskills2)"
                      ></path>

                      <path
                        d="M 80 177 L 200 161 L 320 139 L 440 108 L 560 71 L 680 22"
                        fill="none"
                        stroke="#5b48bd"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      ></path>

                      <circle cx="80" cy="177" fill="#FFFFFF" r="4" stroke="#5b48bd" strokeWidth="2.5"></circle>
                      <circle cx="200" cy="161" fill="#FFFFFF" r="4" stroke="#5b48bd" strokeWidth="2.5"></circle>
                      <circle cx="320" cy="139" fill="#FFFFFF" r="4" stroke="#5b48bd" strokeWidth="2.5"></circle>
                      <circle cx="440" cy="108" fill="#FFFFFF" r="4" stroke="#5b48bd" strokeWidth="2.5"></circle>
                      <circle cx="560" cy="71" fill="#FFFFFF" r="4" stroke="#5b48bd" strokeWidth="2.5"></circle>
                      <circle cx="680" cy="22" fill="#5b48bd" r="6" stroke="#FFFFFF" strokeWidth="3"></circle>

                      <g transform="translate(638, -6)">
                        <rect fill="#32247b" height="22" rx="4" width="68" x="0" y="0"></rect>
                        <text fill="#FFFFFF" fontSize="11" fontWeight="700" textAnchor="middle" x="34" y="15">
                          74,7tr
                        </text>
                      </g>

                      <text fill="#64748B" fontSize="12" fontWeight="600" textAnchor="middle" x="80" y="206">T1 (5,9)</text>
                      <text fill="#f97316" fontSize="10" fontWeight="500" textAnchor="middle" x="80" y="218">Promo -30%</text>
                      <text fill="#64748B" fontSize="12" fontWeight="600" textAnchor="middle" x="200" y="206">T2 (12,85)</text>
                      <text fill="#64748B" fontSize="12" fontWeight="600" textAnchor="middle" x="320" y="206">T3 (22,6)</text>
                      <text fill="#64748B" fontSize="12" fontWeight="600" textAnchor="middle" x="440" y="206">T4 (36,2)</text>
                      <text fill="#64748B" fontSize="12" fontWeight="600" textAnchor="middle" x="560" y="206">T5 (52,5)</text>
                      <text fill="#5b48bd" fontSize="12" fontWeight="700" textAnchor="middle" x="680" y="206">T6 (74,7)</text>
                    </svg>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-purple-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
                  <div>
                    Tổng doanh thu 6 tháng: <strong className="text-[#1e1b4b] font-bold">204,75 triệu đ</strong>
                  </div>
                  <div className="text-[#5b48bd] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">check_circle</span>Combo &amp; Referral đóng góp ~18% doanh thu
                  </div>
                </div>
              </div>

              {/* Right: Pending Company Approvals & Quick Verification (4 cols) */}
              <div className="lg:col-span-4 bg-white rounded-3xl border border-purple-100 p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#1e1b4b]">Doanh Nghiệp Chờ Duyệt</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-xs">
                        {pendingCompanies.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pendingCompanies.slice(0, 3).map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/30 hover:border-amber-300 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-xl bg-[#5b48bd] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {comp.logo}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-[#1e1b4b] truncate">{comp.shortName}</h4>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">MST: {comp.taxCode}</div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">HR: {comp.recruiterName}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                          <button
                            onClick={() => handleApproveCompany(comp.id)}
                            className="px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold rounded-full cursor-pointer shadow-xs"
                          >
                            Duyệt GPKD
                          </button>
                          <button
                            onClick={() => setSelectedCompanyDossier(comp)}
                            className="px-3 py-1 bg-white border border-amber-300 text-amber-800 text-[11px] font-bold rounded-full cursor-pointer hover:bg-amber-100/50 ml-auto"
                          >
                            Hồ sơ pháp lý →
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingCompanies.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Tất cả hồ sơ doanh nghiệp đã được xác thực hoàn tất!
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-purple-100">
                  <button
                    onClick={() => handleTabSelect('companies')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-100 text-[#5b48bd] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Xem danh sách doanh nghiệp ({companies.length} công ty)</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: QUẢN LÝ CÔNG TY & THÀNH VIÊN HỆ THỐNG             */}
        {/* ========================================================= */}
        {activeTab === 'companies' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Header & KPI Metrics Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">
                  Quản Lý Doanh Nghiệp &amp; Thành Viên System
                </h2>
                <p className="text-xs text-slate-500">
                  Xác minh GPKD doanh nghiệp, kiểm tra MST và quản lý danh sách tài khoản thành viên hệ thống
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-3.5 py-2 bg-[#32247b] hover:bg-[#251963] text-white rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-base">file_download</span>
                  <span>Xuất file Excel báo cáo</span>
                </button>
              </div>
            </div>

            {/* 4 STAT KPI CARDS - CLICKABLE TO FILTER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Pending Verification */}
              <button
                onClick={() => setCompanyStatusFilter('PENDING')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  companyStatusFilter === 'PENDING'
                    ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <span>Công ty chưa duyệt</span>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    </div>
                    <div className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCompanies.length}</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Cần duyệt khẩn cấp trong 24h</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-900 border border-amber-300 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">pending_actions</span>
                  </div>
                </div>
              </button>

              {/* Stat 2: Verified Companies */}
              <button
                onClick={() => setCompanyStatusFilter('VERIFIED')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  companyStatusFilter === 'VERIFIED'
                    ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-300'
                    : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Công ty đã duyệt</div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-1">{verifiedCompanies.length}</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Đã xác minh GPKD &amp; MST</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                </div>
              </button>

              {/* Stat 3: System Members */}
              <button
                onClick={() => setCompanyStatusFilter('USERS')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  companyStatusFilter === 'USERS'
                    ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300'
                    : 'bg-purple-50/50 border-purple-100 hover:bg-purple-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#5b48bd]">List thành viên system</div>
                    <div className="text-2xl font-extrabold text-[#1e1b4b] mt-1">{usersList.length}</div>
                    <div className="text-[11px] text-purple-700 mt-0.5">Candidate, Recruiter &amp; Admin</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5b48bd] border border-purple-200 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                </div>
              </button>

              {/* Stat 4: Total Companies */}
              <button
                onClick={() => setCompanyStatusFilter('ALL')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  companyStatusFilter === 'ALL'
                    ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300'
                    : 'bg-white border-purple-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Tất cả doanh nghiệp</div>
                    <div className="text-2xl font-extrabold text-[#1e1b4b] mt-1">{companies.length}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Tổ chức đăng ký trên hệ thống</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">corporate_fare</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Filtering Controls & View Switcher */}
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-purple-50/50 px-3.5 py-2 rounded-full border border-purple-100">
                <span className="material-symbols-outlined text-[#5b48bd]">search</span>
                <input
                  type="text"
                  placeholder={
                    companyStatusFilter === 'USERS'
                      ? 'Tìm theo Họ tên thành viên, Email, Vai trò, Công ty...'
                      : 'Tìm theo Tên công ty, Mã số thuế, HR đại diện, Email...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 5 Filter Pills: Pending, Verified, Users, All, Rejected */}
                <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-full border border-purple-100">
                  {[
                    { id: 'PENDING', label: `Công ty chưa duyệt (${pendingCompanies.length})` },
                    { id: 'VERIFIED', label: `Công ty đã duyệt (${verifiedCompanies.length})` },
                    { id: 'USERS', label: `List thành viên (${usersList.length})` },
                    { id: 'ALL', label: `Tất cả công ty (${companies.length})` },
                    { id: 'REJECTED', label: `Từ chối (${rejectedCompanies.length})` },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setCompanyStatusFilter(st.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        companyStatusFilter === st.id
                          ? 'bg-[#5b48bd] text-white shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-[#5b48bd]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle: Table vs Grid */}
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setCompanyViewMode('table')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      companyViewMode === 'table' ? 'bg-white text-[#5b48bd] shadow-xs' : 'text-slate-400'
                    }`}
                    title="Xem dạng Bảng"
                  >
                    <span className="material-symbols-outlined text-base block">table_rows</span>
                  </button>
                  <button
                    onClick={() => setCompanyViewMode('grid')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      companyViewMode === 'grid' ? 'bg-white text-[#5b48bd] shadow-xs' : 'text-slate-400'
                    }`}
                    title="Xem dạng Thẻ (Grid)"
                  >
                    <span className="material-symbols-outlined text-base block">grid_view</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Action Toolbar when company items are selected */}
            {companyStatusFilter !== 'USERS' && selectedCompanyIds.length > 0 && (
              <div className="bg-[#32247b] text-white p-3.5 rounded-2xl flex items-center justify-between animate-fade-in shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="material-symbols-outlined text-amber-400 text-lg">check_circle</span>
                  <span>Đã chọn {selectedCompanyIds.length} doanh nghiệp</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchApproveCompanies}
                    className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-full cursor-pointer shadow-xs"
                  >
                    Duyệt hàng loạt ({selectedCompanyIds.length})
                  </button>
                  <button
                    onClick={() => setSelectedCompanyIds([])}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {/* CONDITIONALLY RENDER: SYSTEM MEMBERS LIST OR COMPANY LIST */}
            {companyStatusFilter === 'USERS' ? (
              /* SYSTEM MEMBERS LIST VIEW (TABLE OR GRID) */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-purple-100 shadow-xs">
                    {['ALL', 'CANDIDATE', 'RECRUITER', 'ADMIN'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          userRoleFilter === r
                            ? 'bg-[#5b48bd] text-white'
                            : 'text-slate-600 hover:text-[#5b48bd]'
                        }`}
                      >
                        {r === 'ALL' ? 'Tất cả vai trò' : r}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Hiển thị {usersList.filter((u) => userRoleFilter === 'ALL' || u.role === userRoleFilter).length} thành viên
                  </span>
                </div>

                {companyViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usersList
                      .filter((u) => {
                        const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                        const matchQuery =
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.role.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchRole && matchQuery;
                      })
                      .map((u) => (
                        <div
                          key={u.id}
                          className="bg-white rounded-3xl border border-purple-100 p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#5b48bd] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-[#1e1b4b] text-sm leading-snug">{u.name}</h3>
                                  <div className="text-[11px] text-slate-400 font-mono">ID: #{u.id}</div>
                                </div>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${
                                  u.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : u.role === 'RECRUITER'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </div>

                            <div className="bg-purple-50/40 p-3 rounded-2xl border border-purple-100 text-xs space-y-1">
                              <div className="font-bold text-[#1e1b4b] font-mono">{u.email}</div>
                              <div className="text-slate-500"><strong className="text-slate-700">Tổ chức:</strong> {u.company}</div>
                              <div className="text-slate-400 text-[11px]">Tham gia: {u.joined}</div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Hoạt động' : 'Tài khoản bị khóa'}
                            </span>

                            <button
                              onClick={() => handleToggleUserLock(u.id)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                  : 'bg-[#10b981] text-white border-transparent hover:bg-[#059669]'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-md">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#32247b] text-white text-[11px] uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3.5 px-4">Thành Viên System</th>
                          <th className="py-3.5 px-4">Email Đăng Ký</th>
                          <th className="py-3.5 px-4">Vai Trò (Role)</th>
                          <th className="py-3.5 px-4">Tổ Chức / Doanh Nghiệp</th>
                          <th className="py-3.5 px-4">Ngày Tham Gia</th>
                          <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                          <th className="py-3.5 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {usersList
                          .filter((u) => {
                            const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                            const matchQuery =
                              u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.role.toLowerCase().includes(searchQuery.toLowerCase());
                            return matchRole && matchQuery;
                          })
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                              <td className="py-4 px-4 font-bold text-[#1e1b4b]">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-2xl bg-[#5b48bd] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                    {u.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#1e1b4b] text-sm">{u.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-600 font-mono">{u.email}</td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                                    u.role === 'ADMIN'
                                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                                      : u.role === 'RECRUITER'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : 'bg-slate-100 text-slate-800 border-slate-300'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-700">{u.company}</td>
                              <td className="py-4 px-4 text-slate-500 font-medium">{u.joined}</td>
                              <td className="py-4 px-4 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  {u.status === 'ACTIVE' ? 'Hoạt động' : 'Tài khoản bị khóa'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => handleToggleUserLock(u.id)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                      : 'bg-[#10b981] text-white border-transparent hover:bg-[#059669]'
                                  }`}
                                >
                                  {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* COMPANY APPROVAL LIST (TABLE OR GRID) */
              (() => {
                const filteredList = companies.filter((c) => {
                  const matchStatus = companyStatusFilter === 'ALL' || c.status === companyStatusFilter;
                  const matchQuery =
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.taxCode.includes(searchQuery) ||
                    c.recruiterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.recruiterEmail.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchStatus && matchQuery;
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center space-y-3 shadow-md">
                      <div className="w-16 h-16 rounded-full bg-purple-50 text-[#5b48bd] mx-auto flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">domain_disabled</span>
                      </div>
                      <h3 className="text-base font-bold text-[#1e1b4b]">Không tìm thấy hồ sơ doanh nghiệp nào</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái "Tất cả công ty" để kiểm tra.
                      </p>
                    </div>
                  );
                }

                if (companyViewMode === 'grid') {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredList.map((comp) => (
                        <div
                          key={comp.id}
                          className="bg-white rounded-3xl border border-purple-100 p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-12 h-12 rounded-2xl ${comp.logoBg} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                                >
                                  {comp.logo}
                                </div>
                                <div>
                                  <h3 className="font-bold text-[#1e1b4b] text-sm leading-snug">{comp.shortName}</h3>
                                  <div className="text-[11px] text-slate-500 font-mono">MST: {comp.taxCode}</div>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                                  comp.status === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : comp.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {comp.status === 'VERIFIED'
                                  ? 'Đã duyệt GPKD'
                                  : comp.status === 'PENDING'
                                  ? 'Chờ xác minh'
                                  : 'Từ chối'}
                              </span>
                            </div>

                            <div className="bg-purple-50/40 p-3 rounded-2xl border border-purple-100 text-xs space-y-1">
                              <div className="font-bold text-[#1e1b4b]">HR: {comp.recruiterName}</div>
                              <div className="text-slate-500 font-mono">{comp.recruiterEmail}</div>
                              <div className="text-slate-400 text-[11px]">{comp.recruiterPhone}</div>
                            </div>

                            <div className="text-xs text-slate-600 space-y-1">
                              <div><strong className="text-slate-700">Ngành:</strong> {comp.industry}</div>
                              <div><strong className="text-slate-700">Quy mô:</strong> {comp.scale}</div>
                              <div className="text-[11px] text-slate-400 truncate"><strong className="text-slate-700">Trụ sở:</strong> {comp.headquarters}</div>
                            </div>

                            {comp.docName && (
                              <button
                                onClick={() => setSelectedCompanyDossier(comp)}
                                className="w-full py-2 px-3 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-[#5b48bd] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                <span className="truncate max-w-[200px]">{comp.docName}</span>
                              </button>
                            )}
                          </div>

                          <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
                            {comp.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleApproveCompany(comp.id)}
                                  className="flex-1 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer text-center"
                                >
                                  Duyệt GPKD
                                </button>
                                <button
                                  onClick={() => handleOpenRejectCompany(comp)}
                                  className="px-3 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-full hover:bg-slate-100 cursor-pointer"
                                >
                                  Từ chối
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedCompanyDossier(comp)}
                                className="w-full py-2 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer text-center"
                              >
                                Xem chi tiết hồ sơ pháp lý →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-md">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#32247b] text-white text-[11px] uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3.5 px-4 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredList.length > 0 &&
                                filteredList.every((c) => selectedCompanyIds.includes(c.id))
                              }
                              onChange={() => handleSelectAllCompanies(filteredList)}
                              className="rounded border-purple-300 text-[#5b48bd] focus:ring-0 cursor-pointer"
                            />
                          </th>
                          <th className="py-3.5 px-4">Tên Công Ty / Mã Số Thuế</th>
                          <th className="py-3.5 px-4">Đại Diện HR / Email</th>
                          <th className="py-3.5 px-4">Ngành Nghề &amp; Quy Mô</th>
                          <th className="py-3.5 px-4">Giấy Phép KD (GPKD)</th>
                          <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                          <th className="py-3.5 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {filteredList.map((comp) => {
                          const isSelected = selectedCompanyIds.includes(comp.id);
                          return (
                            <tr
                              key={comp.id}
                              className={`transition-colors ${
                                isSelected ? 'bg-purple-50/80 font-medium' : 'hover:bg-purple-50/40'
                              }`}
                            >
                              <td className="py-4 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectCompany(comp.id)}
                                  className="rounded border-purple-300 text-[#5b48bd] focus:ring-0 cursor-pointer"
                                />
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-2xl ${comp.logoBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                                  >
                                    {comp.logo}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#1e1b4b] text-sm">{comp.shortName}</div>
                                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                      <span>MST: {comp.taxCode}</span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(comp.taxCode);
                                          triggerToast(`Đã copy mã số thuế ${comp.taxCode}`, 'info');
                                        }}
                                        className="text-slate-400 hover:text-[#5b48bd]"
                                        title="Copy MST"
                                      >
                                        <span className="material-symbols-outlined text-xs">content_copy</span>
                                      </button>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{comp.headquarters}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-bold text-[#1e1b4b]">{comp.recruiterName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{comp.recruiterEmail}</div>
                                <div className="text-[10px] text-slate-400">{comp.recruiterPhone}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-700">{comp.industry}</div>
                                <div className="text-[11px] text-slate-500">{comp.scale}</div>
                              </td>
                              <td className="py-4 px-4">
                                {comp.docName ? (
                                  <button
                                    onClick={() => setSelectedCompanyDossier(comp)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5b48bd] text-xs font-bold border border-purple-200 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                    <span className="truncate max-w-[120px]">{comp.docName}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Chưa đính kèm</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${
                                    comp.status === 'VERIFIED'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : comp.status === 'PENDING'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {comp.status === 'VERIFIED'
                                    ? 'Đã duyệt GPKD'
                                    : comp.status === 'PENDING'
                                    ? 'Chờ xác minh'
                                    : 'Từ chối'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right space-x-1.5">
                                {comp.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveCompany(comp.id)}
                                      className="px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectCompany(comp)}
                                      className="px-3 py-1 border border-slate-200 text-slate-600 text-xs font-bold rounded-full hover:bg-slate-100 cursor-pointer"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setSelectedCompanyDossier(comp)}
                                  className="px-3 py-1 bg-[#5b48bd] text-white text-xs font-bold rounded-full hover:bg-[#4a39a8] cursor-pointer shadow-xs"
                                >
                                  Xem hồ sơ
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ĐƠN MUA (ORDERS MANAGEMENT)                        */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">Quản Lý Đơn Mua Gói Dịch Vụ</h2>
                <p className="text-xs text-slate-500">Duyệt và kiểm tra hóa đơn thanh toán của ứng viên và nhà tuyển dụng</p>
              </div>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-[#5b48bd] hover:bg-[#4a39a8] text-white rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-base">file_download</span>
                <span>Xuất file Excel / PDF</span>
              </button>
            </div>

            {/* Filtering Controls */}
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-purple-50/50 px-3.5 py-2 rounded-full border border-purple-100">
                <span className="material-symbols-outlined text-[#5b48bd]">search</span>
                <input
                  type="text"
                  placeholder="Tìm theo Mã đơn, Tên người dùng, Gói dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 font-semibold mr-1">Trạng thái:</span>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSearchQuery(st === 'ALL' ? '' : st)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#47369f] hover:bg-[#5b48bd] hover:text-white border border-purple-100 transition-all cursor-pointer shadow-xs"
                  >
                    {st === 'ALL' ? 'Tất cả' : st === 'PENDING' ? 'Chờ duyệt' : st === 'APPROVED' ? 'Đã duyệt' : st === 'REJECTED' ? 'Từ chối' : 'Hoàn tiền'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#32247b] text-white text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Mã đơn / Thời gian</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Hình thức thanh toán</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {orders
                    .filter(
                      (o) =>
                        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.pkg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.status.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-[#1e1b4b]">{o.id}</div>
                          <div className="text-[11px] text-slate-400">{o.timestamp}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1e1b4b]">{o.user}</div>
                          <div className="text-[11px] text-slate-400">{o.email} ({o.role})</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{o.pkg}</td>
                        <td className="py-3.5 px-4 font-extrabold text-[#5b48bd]">{o.amountText}</td>
                        <td className="py-3.5 px-4 text-slate-500">{o.paymentMethod}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${
                              o.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : o.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : o.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {o.status === 'APPROVED'
                              ? 'Đã duyệt'
                              : o.status === 'PENDING'
                              ? 'Chờ duyệt'
                              : o.status === 'REJECTED'
                              ? 'Từ chối'
                              : 'Hoàn tiền'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {o.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveOrder(o.id)}
                                className="px-3 py-1 bg-[#5b48bd] text-white text-xs font-bold rounded-full hover:bg-[#4a39a8] cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleRejectOrder(o.id)}
                                className="px-3 py-1 border border-slate-200 text-xs font-bold rounded-full hover:bg-slate-100 cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-3 py-1 bg-purple-50 text-[#5b48bd] text-xs font-bold rounded-full hover:bg-purple-100 cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GÓI DỊCH VỤ (PACKAGES MANAGEMENT)                 */}
        {/* ========================================================= */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">Quản Lý Gói Dịch Vụ &amp; Bảng Giá</h2>
                <p className="text-xs text-slate-500">Cấu hình tính năng, mức giá và quyền lợi dành cho Ứng viên &amp; Nhà tuyển dụng</p>
              </div>
              <button
                onClick={() => triggerToast('Mở form tạo gói dịch vụ mới', 'info')}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Thêm gói dịch vụ mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packagesList.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-3xl border border-purple-100 p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5b48bd] border border-purple-100">
                        {pkg.targetRole === 'Candidate' ? 'Dành cho Ứng viên' : 'Dành cho Nhà tuyển dụng'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600">{pkg.sharePercent} thị phần</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1e1b4b]">{pkg.name}</h3>
                    <div className="text-2xl font-extrabold text-[#5b48bd] mt-1">{pkg.priceText}</div>

                    <div className="mt-4 space-y-2 border-t border-purple-100 pt-3">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quyền lợi nổi bật:</div>
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">{pkg.subscribersCount} tài khoản active</span>
                    <button
                      onClick={() => setShowEditPackageModal(pkg)}
                      className="px-4 py-1.5 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold rounded-full cursor-pointer transition-all shadow-xs"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: COMBO & KHUYẾN MÃI (PROMOTIONS & VOUCHERS)          */}
        {/* ========================================================= */}
        {activeTab === 'promotions' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">Quản Lý Combo &amp; Khuyến Mãi</h2>
                <p className="text-xs text-slate-500">Tạo voucher giảm giá và theo dõi hiệu quả các đợt phát hành ưu đãi</p>
              </div>
              <button
                onClick={() => setShowCreateVoucherModal(true)}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Tạo mã voucher mới</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-md space-y-4">
              <h3 className="text-base font-bold text-[#1e1b4b]">Danh Sách Mã Ưu Đãi Đang Kích Hoạt</h3>
              <div className="space-y-3">
                {vouchers.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-[#5b48bd] bg-purple-100/80 px-3 py-1 rounded-lg border border-purple-200">
                          {v.code}
                        </span>
                        <span className="text-sm font-bold text-[#1e1b4b]">{v.discount}</span>
                      </div>
                      <p className="text-xs text-slate-500">{v.description}</p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="w-40 shrink-0 text-right">
                        <div className="text-xs font-bold text-slate-700 whitespace-nowrap">Đã dùng: {v.usage}</div>
                        <div className="w-full h-2 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-[#5b48bd] rounded-full transition-all duration-300" style={{ width: `${v.percent}%` }}></div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleVoucher(v.id)}
                        className={`w-32 py-1.5 text-xs font-bold rounded-full cursor-pointer transition-all text-center whitespace-nowrap shrink-0 ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {v.status === 'ACTIVE' ? 'Đang kích hoạt' : 'Tắt mã'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: NGƯỜI DÙNG (USERS MANAGEMENT)                     */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div>
              <h2 className="text-xl font-bold text-[#1e1b4b]">Quản Lý Người Dùng &amp; Phân Quyền</h2>
              <p className="text-xs text-slate-500">Danh sách tài khoản Candidate, Recruiter và Admin trên hệ thống HireMate AI</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-purple-50/50 px-3.5 py-2 rounded-full border border-purple-100">
                <span className="material-symbols-outlined text-[#5b48bd]">search</span>
                <input
                  type="text"
                  placeholder="Tìm theo Họ tên, Email, Công ty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none font-sans"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#32247b] text-white text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">ID / Họ và Tên</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Vai trò (Role)</th>
                    <th className="py-3 px-4">Tổ chức / Công ty</th>
                    <th className="py-3 px-4">Ngày tham gia</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {usersList
                    .filter(
                      (u) =>
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.role.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#1e1b4b]">
                          #{u.id} - {u.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'RECRUITER'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{u.company}</td>
                        <td className="py-3.5 px-4 text-slate-400">{u.joined}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserLock(u.id)}
                            className="px-3 py-1 text-xs font-bold rounded-full border border-slate-200 hover:bg-slate-100 cursor-pointer"
                          >
                            {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: THỐNG KÊ DOANH THU (REVENUE ANALYTICS)              */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div>
              <h2 className="text-xl font-bold text-[#1e1b4b]">Báo Cáo Doanh Thu Chi Tiết</h2>
              <p className="text-xs text-slate-500">Phân tích dòng tiền, tăng trưởng ARPU và nguồn doanh thu gói</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng Doanh Thu Lũy Kế</span>
                <div className="text-3xl font-extrabold text-[#1e1b4b] mt-2">204,75 triệu đ</div>
                <div className="text-xs text-emerald-600 font-bold mt-1">+18,4% so với quý trước</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">ARPU (Doanh thu / User)</span>
                <div className="text-3xl font-extrabold text-[#1e1b4b] mt-2">1,25 triệu đ</div>
                <div className="text-xs text-emerald-600 font-bold mt-1">+8,6% so với tháng trước</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thanh Toán VietQR Tự Động</span>
                <div className="text-3xl font-extrabold text-[#1e1b4b] mt-2">84%</div>
                <div className="text-xs text-slate-400 mt-1">16% Chuyển khoản thủ công</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md space-y-4">
              <h3 className="text-base font-bold text-[#1e1b4b]">Doanh Thu Theo Kênh Thanh Toán</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>VietQR Direct Bank Transfer</span>
                  <span className="font-extrabold text-[#5b48bd]">142,50 triệu đ (69.5%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#5b48bd] h-full rounded-full" style={{ width: '69.5%' }}></div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold pt-2">
                  <span>MoMo QR Code</span>
                  <span className="font-extrabold text-[#f97316]">42,10 triệu đ (20.5%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f97316] h-full rounded-full" style={{ width: '20.5%' }}></div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold pt-2">
                  <span>VNPAY Gateway</span>
                  <span className="font-extrabold text-[#06b6d4]">20,15 triệu đ (10.0%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#06b6d4] h-full rounded-full" style={{ width: '10.0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: CÀI ĐẶT HỆ THỐNG (SYSTEM SETTINGS)                */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">Cấu Hình AI Matching 70/30 &amp; Vận Hành</h2>
                <p className="text-xs text-slate-500">Thiết lập tham số bài toán matching chuẩn Master Spec SWP391 HireMate AI</p>
              </div>
              <button
                onClick={() => triggerToast('Lưu cấu hình hệ thống thành công!')}
                className="px-5 py-2 bg-[#5b48bd] hover:bg-[#4a39a8] text-white rounded-full text-xs font-bold cursor-pointer shadow-md"
              >
                Lưu thay đổi
              </button>
            </div>

            {/* Master AI Matching Weight Settings - Master Spec 70/30 */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-purple-100 pb-3">
                <span className="material-symbols-outlined text-[#5b48bd]">psychology</span>
                <h3 className="text-base font-bold text-[#1e1b4b]">Trọng Số Khớp AI Job Matching (Chuẩn Master Spec 70/30)</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Theo quy chuẩn SWP391 HireMate AI: Kỹ năng bắt buộc (Mandatory skills) chiếm 70% trọng số, Kỹ năng ưu tiên (Preferred skills) chiếm 30% trọng số. Kết quả được tính toán và lưu cache tại bảng <code className="bg-purple-50 px-1.5 py-0.5 rounded text-[#5b48bd] font-mono font-bold">ai_job_matches</code>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <label className="text-xs font-bold text-[#1e1b4b] block">
                    Kỹ năng bắt buộc (Mandatory Weight): <span className="text-[#5b48bd] text-sm">{mandatoryWeight}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    value={mandatoryWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMandatoryWeight(val);
                      setPreferredWeight(100 - val);
                    }}
                    className="w-full accent-[#5b48bd] cursor-pointer"
                  />
                </div>

                <div className="space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <label className="text-xs font-bold text-[#1e1b4b] block">
                    Kỹ năng ưu tiên (Preferred Weight): <span className="text-[#10b981] text-sm">{preferredWeight}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={preferredWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPreferredWeight(val);
                      setMandatoryWeight(100 - val);
                    }}
                    className="w-full accent-[#10b981] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md space-y-4">
              <h3 className="text-base font-bold text-[#1e1b4b] border-b border-purple-100 pb-3">
                Ngưỡng Tự Động Phê Duyệt Đơn Mua
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-xs font-semibold text-slate-700">Hạn mức tự động duyệt đơn (VNĐ):</label>
                <input
                  type="number"
                  value={autoApprovalLimit}
                  onChange={(e) => setAutoApprovalLimit(Number(e.target.value))}
                  className="px-4 py-2 border border-purple-200 rounded-full text-xs w-52 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: XEM HỒ SƠ PHÁP LÝ DOANH NGHIỆP (COMPANY DOSSIER)   */}
      {/* ========================================================= */}
      {selectedCompanyDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-purple-100 p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCompanyDossier(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3.5 border-b border-purple-100 pb-4">
              <div className={`w-14 h-14 rounded-2xl ${selectedCompanyDossier.logoBg} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md`}>
                {selectedCompanyDossier.logo}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e1b4b] leading-tight">
                  {selectedCompanyDossier.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    MST: {selectedCompanyDossier.taxCode}
                  </span>
                  <span className="text-xs text-slate-400">{selectedCompanyDossier.industry}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100 space-y-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Đại diện pháp lý / HR:</span>
                <div className="font-bold text-[#1e1b4b] text-sm">{selectedCompanyDossier.recruiterName}</div>
                <div className="text-slate-600 font-mono">{selectedCompanyDossier.recruiterEmail}</div>
                <div className="text-slate-500 font-mono">{selectedCompanyDossier.recruiterPhone}</div>
              </div>

              <div className="bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100 space-y-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Quy mô &amp; Trụ sở:</span>
                <div className="font-bold text-[#1e1b4b]">{selectedCompanyDossier.scale}</div>
                <div className="text-slate-600 leading-snug">{selectedCompanyDossier.headquarters}</div>
                {selectedCompanyDossier.website && (
                  <a href={selectedCompanyDossier.website} target="_blank" rel="noreferrer" className="text-[#5b48bd] font-bold hover:underline block">
                    {selectedCompanyDossier.website} ↗
                  </a>
                )}
              </div>
            </div>

            {/* Verification document attached */}
            <div className="space-y-2 border-t border-purple-100 pt-3">
              <span className="text-xs font-bold text-[#1e1b4b]">Giấy phép Đăng ký kinh doanh (GPKD):</span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 text-3xl">picture_as_pdf</span>
                  <div>
                    <div className="font-bold text-xs text-[#1e1b4b]">{selectedCompanyDossier.docName || 'Hoso_Phaply_DoanhNghiep.pdf'}</div>
                    <div className="text-[11px] text-slate-400">{selectedCompanyDossier.notes}</div>
                  </div>
                </div>
                {selectedCompanyDossier.docUrl && (
                  <a
                    href={selectedCompanyDossier.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#5b48bd] text-white text-xs font-bold rounded-full hover:bg-[#4a39a8] cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    Xem văn bản →
                  </a>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-purple-100">
              {selectedCompanyDossier.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleApproveCompany(selectedCompanyDossier.id);
                      setSelectedCompanyDossier(null);
                    }}
                    className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-full cursor-pointer shadow-md"
                  >
                    Xác nhận Duyệt GPKD
                  </button>
                  <button
                    onClick={() => {
                      const compToReject = selectedCompanyDossier;
                      setSelectedCompanyDossier(null);
                      handleOpenRejectCompany(compToReject);
                    }}
                    className="px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-full cursor-pointer"
                  >
                    Từ chối hồ sơ...
                  </button>
                </>
              )}
              {selectedCompanyDossier.status !== 'PENDING' && (
                <button
                  onClick={() => setSelectedCompanyDossier(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full cursor-pointer hover:bg-slate-200"
                >
                  Đóng hồ sơ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TỪ CHỐI HỒ SƠ DOANH NGHIỆP & NHẬP LÝ DO           */}
      {/* ========================================================= */}
      {rejectingCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-rose-100 p-6 space-y-4 relative">
            <button
              onClick={() => setRejectingCompanyModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e1b4b]">Từ Chối Hồ Sơ Doanh Nghiệp</h3>
                <p className="text-xs text-slate-500">{rejectingCompanyModal.name} (MST: {rejectingCompanyModal.taxCode})</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">Chọn lý do phổ biến hoặc nhập nội dung tùy chỉnh:</label>
              
              <div className="space-y-2">
                {[
                  'Mã số thuế không tồn tại hoặc ngưng hoạt động trên Cổng DKKD quốc gia.',
                  'Giấy phép kinh doanh (GPKD) đính kèm bị mờ, rách hoặc không hợp lệ.',
                  'Email/SĐT người đại diện HR không thể liên hệ xác minh.',
                  'Hồ sơ vi phạm quy định điều khoản hoạt động của HireMate AI.'
                ].map((reasonText, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRejectionNote(reasonText)}
                    className="w-full text-left p-2.5 rounded-xl border border-purple-100 hover:bg-purple-50 text-slate-700 text-xs transition-colors cursor-pointer block font-medium"
                  >
                    • {reasonText}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chi tiết lý do từ chối (Gửi tới Recruiter):</label>
                <textarea
                  rows={3}
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="w-full p-3 border border-rose-200 rounded-2xl text-xs outline-none focus:border-rose-400 font-sans"
                  placeholder="Nhập chi tiết hướng dẫn sửa đổi hồ sơ..."
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-purple-100">
              <button
                onClick={() => setRejectingCompanyModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-full cursor-pointer hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRejectCompany}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full cursor-pointer shadow-md"
              >
                Xác nhận từ chối &amp; Gửi thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CHI TIẾT HÓA ĐƠN GIAO DỊCH (ORDER RECEIPT MODAL)   */}
      {/* ========================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-purple-100 p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 border-b border-purple-100 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e1b4b]">Chi Tiết Đơn Mua {selectedOrderDetails.id}</h3>
                <span className="text-xs text-slate-400">{selectedOrderDetails.timestamp}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#1e1b4b]">
              <div className="flex justify-between py-1 border-b border-purple-50">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold">{selectedOrderDetails.user} ({selectedOrderDetails.role})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-50">
                <span className="text-slate-500">Email đăng ký:</span>
                <span className="font-mono">{selectedOrderDetails.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-50">
                <span className="text-slate-500">Gói dịch vụ:</span>
                <span className="font-bold text-[#5b48bd]">{selectedOrderDetails.pkg}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-50">
                <span className="text-slate-500">Tổng số tiền:</span>
                <span className="font-extrabold text-[#5b48bd] text-sm">{selectedOrderDetails.amountText}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-50">
                <span className="text-slate-500">Phương thức:</span>
                <span>{selectedOrderDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-50">
                <span className="text-slate-500">Mã ngân hàng (TxHash):</span>
                <span className="font-mono bg-purple-50 px-2 py-0.5 rounded-md text-[#5b48bd] font-bold">{selectedOrderDetails.txHash}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-purple-100">
              {selectedOrderDetails.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleApproveOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="px-5 py-2 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold rounded-full cursor-pointer shadow-md"
                  >
                    Xác nhận duyệt
                  </button>
                  <button
                    onClick={() => {
                      handleRejectOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full cursor-pointer"
                  >
                    Từ chối
                  </button>
                </>
              )}
              {selectedOrderDetails.status === 'APPROVED' && (
                <button
                  onClick={() => {
                    handleRefundOrder(selectedOrderDetails.id);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-full cursor-pointer"
                >
                  Hoàn tiền đơn hàng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO MÃ VOUCHER KHUYẾN MÃI */}
      {showCreateVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-purple-100 p-6 space-y-4 relative">
            <button
              onClick={() => setShowCreateVoucherModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#1e1b4b]">Tạo Mã Khuyến Mãi Mới</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Mã Voucher (VD: HIREMATE50)</label>
                <input
                  type="text"
                  placeholder="HIREMATE50"
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Mức giảm giá / Mô tả</label>
                <input
                  type="text"
                  placeholder="Giảm 50% gói Practice Pro"
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Số lượt sử dụng tối đa</label>
                <input
                  type="number"
                  defaultValue={100}
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateVoucherModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-full"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowCreateVoucherModal(false);
                  triggerToast('Tạo voucher mới thành công!');
                }}
                className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-full shadow-md"
              >
                Kích hoạt Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA GÓI DỊCH VỤ */}
      {showEditPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-purple-100 p-6 space-y-4 relative">
            <button
              onClick={() => setShowEditPackageModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#1e1b4b]">Chỉnh Sửa Gói {showEditPackageModal.name}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Giá niêm yết (VNĐ)</label>
                <input
                  type="text"
                  defaultValue={showEditPackageModal.priceText}
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Thời hạn sử dụng</label>
                <input
                  type="text"
                  defaultValue={showEditPackageModal.duration}
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowEditPackageModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-full"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowEditPackageModal(null);
                  triggerToast('Cập nhật gói dịch vụ thành công!');
                }}
                className="px-5 py-2 bg-[#5b48bd] text-white text-xs font-bold rounded-full shadow-md"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LỌC DỮ LIỆU TỔNG QUAN */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-purple-100 p-6 space-y-4 relative">
            <button
              onClick={() => setShowFilterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#1e1b4b]">Bộ Lọc Dữ Liệu Báo Cáo</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Khoảng thời gian:</label>
                <select className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold bg-white">
                  <option>30 ngày gần đây</option>
                  <option>7 ngày gần đây</option>
                  <option>6 tháng gần đây</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Lọc theo vai trò:</label>
                <select className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold bg-white">
                  <option>Tất cả vai trò</option>
                  <option>Candidate (Ứng viên)</option>
                  <option>Recruiter (Nhà tuyển dụng)</option>
                </select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-full"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  triggerToast('Đã áp dụng bộ lọc dữ liệu');
                }}
                className="px-5 py-2 bg-[#5b48bd] text-white text-xs font-bold rounded-full shadow-md"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
