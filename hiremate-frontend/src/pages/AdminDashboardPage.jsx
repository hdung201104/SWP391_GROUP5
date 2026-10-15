import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

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

const INITIAL_ORDERS = [];

const INITIAL_VOUCHERS = [];


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

const INITIAL_JOBS = [
  {
    jobId: 101,
    title: 'Senior Java Backend Engineer (Spring Boot / Microservices)',
    companyName: 'FPT Software',
    recruiterName: 'Nguyễn Minh Anh',
    recruiterEmail: 'minhanh.hr@fptsoftware.com',
    location: 'Hà Nội (Hybrid)',
    salaryMin: 30000000,
    salaryMax: 45000000,
    employmentType: 'FULL_TIME',
    approvalStatus: 'PENDING',
    status: 'DRAFT',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    deadline: '2026-11-30',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Kafka'],
    description: 'Tham gia thiết kế kiến trúc và phát triển hệ thống backend phân tán quy mô lớn cho khách hàng quốc tế. Tối ưu hóa hiệu năng và độ tin cậy của các dịch vụ microservices.',
    requirements: 'Tối thiểu 3 năm kinh nghiệm với Java Spring Boot. Nắm vững kiến trúc Microservices, RESTful API, PostgreSQL, Redis và Message Broker (Kafka/RabbitMQ).',
    benefits: 'Lương thưởng cạnh tranh, tháng 13 + thưởng hiệu quả kinh doanh. Gói bảo hiểm sức khỏe FPT Care cho bản thân và gia đình. Làm việc Hybrid linh hoạt.',
  },
  {
    jobId: 102,
    title: 'Frontend ReactJS / Next.js Developer',
    companyName: 'VNG Corporation',
    recruiterName: 'VNG Recruitment Team',
    recruiterEmail: 'recruitment@vng.com.vn',
    location: 'Hồ Chí Minh',
    salaryMin: 22000000,
    salaryMax: 35000000,
    employmentType: 'FULL_TIME',
    approvalStatus: 'PENDING',
    status: 'DRAFT',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    deadline: '2026-11-15',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
    description: 'Phát triển các tính năng giao diện người dùng hiện đại, tối ưu trải nghiệm và hiệu năng tải trang cho nền tảng giải trí và thanh toán điện tử của VNG.',
    requirements: 'Ít nhất 2 năm làm việc với ReactJS, Next.js, TypeScript. Hiểu biết sâu về State Management (Redux/Zustand), Responsive Web Design và Web Performance.',
    benefits: 'Môi trường công nghệ hàng đầu tại VNG Campus. Hỗ trợ cơm trưa, phòng gym, hồ bơi, xe đưa đón. Thưởng theo dự án hàng năm.',
  },
  {
    jobId: 103,
    title: 'AI / Machine Learning Engineer (LLM & NLP)',
    companyName: 'Viettel Telecom',
    recruiterName: 'Phạm Đức Long',
    recruiterEmail: 'longpd@viettel.com.vn',
    location: 'Hà Nội',
    salaryMin: 35000000,
    salaryMax: 60000000,
    employmentType: 'FULL_TIME',
    approvalStatus: 'APPROVED',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    deadline: '2026-12-01',
    skills: ['Python', 'PyTorch', 'NLP', 'LangChain', 'LLM'],
    description: 'Nghiên cứu ứng dụng các mô hình học sâu và AI tạo sinh (GenAI, Large Language Models) để xây dựng trợ lý ảo chăm sóc khách hàng tự động cho tập đoàn Viettel.',
    requirements: 'Thành thạo Python, PyTorch/TensorFlow. Có kinh nghiệm triển khai NLP, RAG, prompt engineering hoặc fine-tuning mô hình ngôn ngữ lớn.',
    benefits: 'Mức thu nhập hấp dẫn thuộc top đầu thị trường viễn thông. Cơ hội tham gia các dự án cấp quốc gia, tài trợ chứng chỉ công nghệ quốc tế.',
  },
  {
    jobId: 104,
    title: 'Chuyên Viên Tuyển Dụng & Đào Tạo (HR Executive)',
    companyName: 'MISA Joint Stock Company',
    recruiterName: 'Lê Hoàng Yến',
    recruiterEmail: 'hr@misa.com.vn',
    location: 'Đà Nẵng',
    salaryMin: 12000000,
    salaryMax: 18000000,
    employmentType: 'FULL_TIME',
    approvalStatus: 'APPROVED',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    deadline: '2026-11-20',
    skills: ['Tuyển dụng', 'HR', 'Giao tiếp', 'Phỏng vấn', 'Onboarding'],
    description: 'Chịu trách nhiệm toàn bộ quy trình thu hút nhân tài, đăng tin tuyển dụng, sàng lọc CV, phối hợp phỏng vấn và hỗ trợ nhân viên mới hòa nhập văn hóa MISA.',
    requirements: 'Tốt nghiệp Đại học khối ngành Quản trị nhân lực, Kinh tế, Ngoại ngữ. Tối thiểu 1 năm kinh nghiệm tuyển dụng khối kỹ thuật hoặc kinh doanh.',
    benefits: 'Chế độ phúc lợi đầy đủ theo luật Lao động. Thưởng KPI theo tháng, du lịch nghỉ dưỡng hàng năm, lộ trình thăng tiến rõ ràng.',
  },
  {
    jobId: 105,
    title: 'Cộng Tác Viên Đăng Bài & Nhập Liệu Online (Cảnh báo dấu hiệu lừa đảo)',
    companyName: 'Cá nhân tự do (Chưa xác minh)',
    recruiterName: 'Trương Văn X',
    recruiterEmail: 'fake.recruiter@spam.com',
    location: 'Toàn quốc (Remote)',
    salaryMin: 15000000,
    salaryMax: 20000000,
    employmentType: 'PART_TIME',
    approvalStatus: 'REJECTED',
    status: 'DRAFT',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    deadline: '2026-10-30',
    skills: ['Nhập liệu', 'Gõ văn bản'],
    description: 'Công việc nhẹ nhàng không cần kinh nghiệm, gõ văn bản tại nhà nhận tiền ngay. Ứng viên cần đặt cọc trước 300.000 đ phí bảo lãnh tài liệu.',
    requirements: 'Có điện thoại hoặc máy tính, rảnh 1-2 tiếng mỗi ngày.',
    benefits: 'Nhận tiền mặt qua ATM hàng ngày.',
  },
];

export default function AdminDashboardPage({ user, onLogout }) {
  // Parse initial tab from URL hash if present
  const getInitialTab = () => {
    const rawHash = window.location.hash || '';
    if (rawHash.includes('tab=jobs') || rawHash.includes('tab=job')) return 'jobs';
    if (rawHash.includes('tab=companies') || rawHash.includes('tab=company')) return 'companies';
    if (rawHash.includes('tab=orders')) return 'orders';
    if (rawHash.includes('tab=packages')) return 'packages';
    if (rawHash.includes('tab=promotions')) return 'promotions';
    if (rawHash.includes('tab=users')) return 'users';
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
      if (rawHash.includes('tab=jobs') || rawHash.includes('tab=job')) setActiveTab('jobs');
      else if (rawHash.includes('tab=companies') || rawHash.includes('tab=company')) setActiveTab('companies');
      else if (rawHash.includes('tab=orders')) setActiveTab('orders');
      else if (rawHash.includes('tab=packages')) setActiveTab('packages');
      else if (rawHash.includes('tab=promotions')) setActiveTab('promotions');
      else if (rawHash.includes('tab=users')) setActiveTab('users');
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
  const [jobsList, setJobsList] = useState(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobApprovalFilter, setJobApprovalFilter] = useState('ALL');
  const [userRoleFilterTab, setUserRoleFilterTab] = useState('ALL');
  const [userStatusFilterTab, setUserStatusFilterTab] = useState('ALL');
  const [realStats, setRealStats] = useState(null);
  const [loadingRealData, setLoadingRealData] = useState(false);

  // Fetch real data from Supabase backend
  const fetchRealData = async () => {
    try {
      setLoadingRealData(true);
      const [statsRes, usersRes, companiesRes, ordersRes, plansRes, vouchersRes, jobsRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getCompanies(),
        adminApi.getOrders(),
        adminApi.getPlans(),
        adminApi.getVouchers(),
        adminApi.getJobs(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setRealStats(statsRes.value.data);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.data && Array.isArray(usersRes.value.data) && usersRes.value.data.length > 0) {
        setUsersList(usersRes.value.data.map((u) => ({
          id: u.id,
          name: u.name || 'Người dùng',
          email: u.email,
          phone: u.phone || '-',
          role: u.role,
          company: u.company || '-',
          status: u.status === 'BLOCKED' ? 'LOCKED' : (u.status || 'ACTIVE'),
          joined: u.joined ? new Date(u.joined).toLocaleDateString('vi-VN') : 'Mới',
        })));
      }

      if (companiesRes.status === 'fulfilled' && companiesRes.value?.data && Array.isArray(companiesRes.value.data) && companiesRes.value.data.length > 0) {
        setCompanies(companiesRes.value.data.map((c) => ({
          id: 'CMP-' + c.id,
          rawId: c.id,
          name: c.name,
          shortName: c.shortName || c.name,
          taxCode: c.taxCode || ('MST-' + c.id),
          recruiterName: c.recruiterName || 'Chưa cập nhật',
          recruiterEmail: c.recruiterEmail || '-',
          recruiterPhone: c.recruiterPhone || '-',
          industry: c.industry || 'Công nghệ & Tuyển dụng',
          scale: c.scale || '50-100 nhân viên',
          headquarters: c.headquarters || 'Hồ Chí Minh',
          website: c.website || '',
          status: c.status === 'ACTIVE' ? 'VERIFIED' : (c.status === 'BANNED' ? 'REJECTED' : 'PENDING'),
          submittedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
          docUrl: c.docUrl || '',
          docName: c.docName || 'GPKD_Doanh_Nghiep.pdf',
          notes: c.notes || 'Hồ sơ doanh nghiệp thực tế từ Supabase PostgreSQL',
          logo: c.name?.slice(0, 3)?.toUpperCase() || 'CMP',
          logoBg: 'bg-[#5b48bd]',
        })));
      }

      if (ordersRes.status === 'fulfilled') {
        const oData = ordersRes.value?.data || ordersRes.value || [];
        const oList = Array.isArray(oData) ? oData : [];
        setOrders(oList.map((o) => ({
          id: o.orderCode || ('#ORD-' + o.orderId),
          rawId: o.orderId,
          user: o.userName || 'Khách hàng',
          role: o.userRole || 'Recruiter',
          email: o.userEmail || '-',
          pkg: o.planName || 'Gói dịch vụ',
          amount: o.amount || 0,
          amountText: (Number(o.amount) || 0).toLocaleString('vi-VN') + ' đ',
          status: o.status,
          timestamp: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : 'Mới',
          paymentMethod: 'VietQR - MBBank',
          txHash: o.orderCode,
          adminNote: o.adminNote,
          voucherCode: o.voucherCode,
          discountAmount: o.discountAmount,
        })));
      }

      if (plansRes.status === 'fulfilled' && plansRes.value?.data && Array.isArray(plansRes.value.data) && plansRes.value.data.length > 0) {
        setPackagesList(plansRes.value.data.map((p) => ({
          id: 'pkg-' + p.planId,
          rawId: p.planId,
          name: p.planName,
          targetRole: p.targetRole,
          price: Number(p.price) || 0,
          priceText: (Number(p.price) || 0).toLocaleString('vi-VN') + ' đ/' + (p.durationDays || 30) + ' ngày',
          duration: (p.durationDays || 30) + ' ngày',
          subscribersCount: p.quotaLimit || 0,
          sharePercent: '20%',
          status: p.isActive ? 'ACTIVE' : 'INACTIVE',
          color: '#5b48bd',
          features: p.description ? p.description.split(';') : ['Đăng tin & AI matching chuyên nghiệp'],
        })));
      }

      if (vouchersRes.status === 'fulfilled') {
        const vData = vouchersRes.value?.data || vouchersRes.value || [];
        const vList = Array.isArray(vData) ? vData : [];
        setVouchers(vList.map((v) => ({
          id: v.voucherId,
          code: v.code,
          discount: `Giảm ${v.discountPercent}%`,
          description: v.maxDiscountAmount ? `Giảm tối đa ${Number(v.maxDiscountAmount).toLocaleString('vi-VN')} đ` : 'Ưu đãi thành viên',
          status: v.isActive ? 'ACTIVE' : 'EXPIRED',
          usage: `${v.usedCount || 0}/${v.usageLimit || 100} lượt`,
          percent: v.usageLimit > 0 ? Math.round(((v.usedCount || 0) / v.usageLimit) * 100) : 0,
          badgeBg: v.isActive ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200',
        })));
      }

      if (jobsRes.status === 'fulfilled') {
        const jRaw = jobsRes.value?.data || jobsRes.value || [];
        const jList = Array.isArray(jRaw) ? jRaw : (jRaw?.data || []);
        if (Array.isArray(jList)) {
          setJobsList(jList);
        }
      }
    } catch (err) {
      console.warn('Lỗi kết nối Supabase:', err);
    } finally {
      setLoadingRealData(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

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

  // Computed Pending Sets & Dynamic Analytics from Supabase DB
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const pendingCompanies = companies.filter((c) => c.status === 'PENDING');
  const verifiedCompanies = companies.filter((c) => c.status === 'VERIFIED');
  const rejectedCompanies = companies.filter((c) => c.status === 'REJECTED');

  const pendingJobs = jobsList.filter((j) => j.approvalStatus === 'PENDING' || !j.approvalStatus);
  const approvedJobs = jobsList.filter((j) => j.approvalStatus === 'APPROVED');
  const rejectedJobs = jobsList.filter((j) => j.approvalStatus === 'REJECTED');

  const handleApproveJob = async (jobId) => {
    try {
      await adminApi.updateJobApproval(jobId, 'APPROVED');
      setJobsList((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, approvalStatus: 'APPROVED', status: 'PUBLISHED' } : j))
      );
      if (selectedJob && selectedJob.jobId === jobId) {
        setSelectedJob((prev) => ({ ...prev, approvalStatus: 'APPROVED', status: 'PUBLISHED' }));
      }
      triggerToast(`Đã phê duyệt tin tuyển dụng #${jobId} thành công! Tin đã xuất bản.`);
    } catch (err) {
      console.warn('Lỗi duyệt tin từ API, cập nhật cục bộ:', err);
      // Fallback update cho mock jobs hoặc khi offline
      setJobsList((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, approvalStatus: 'APPROVED', status: 'PUBLISHED' } : j))
      );
      if (selectedJob && selectedJob.jobId === jobId) {
        setSelectedJob((prev) => ({ ...prev, approvalStatus: 'APPROVED', status: 'PUBLISHED' }));
      }
      triggerToast(`Đã phê duyệt tin tuyển dụng #${jobId} thành công!`);
    }
  };

  const handleRejectJob = async (jobId) => {
    try {
      await adminApi.updateJobApproval(jobId, 'REJECTED');
      setJobsList((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, approvalStatus: 'REJECTED', status: 'CLOSED' } : j))
      );
      if (selectedJob && selectedJob.jobId === jobId) {
        setSelectedJob((prev) => ({ ...prev, approvalStatus: 'REJECTED', status: 'CLOSED' }));
      }
      triggerToast(`Đã từ chối tin tuyển dụng #${jobId}.`);
    } catch (err) {
      console.warn('Lỗi từ chối tin từ API, cập nhật cục bộ:', err);
      // Fallback update cho mock jobs hoặc khi offline
      setJobsList((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, approvalStatus: 'REJECTED', status: 'CLOSED' } : j))
      );
      if (selectedJob && selectedJob.jobId === jobId) {
        setSelectedJob((prev) => ({ ...prev, approvalStatus: 'REJECTED', status: 'CLOSED' }));
      }
      triggerToast(`Đã từ chối tin tuyển dụng #${jobId}.`);
    }
  };

  const totalApprovedRev = realStats?.totalRevenue != null 
    ? Number(realStats.totalRevenue) 
    : orders.filter((o) => o.status === 'APPROVED').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalUsersCount = realStats?.totalUsers || usersList.length || 1;
  const calculatedArpu = totalUsersCount > 0 ? Math.round(totalApprovedRev / totalUsersCount) : 0;

  // Trigger Toast Notification helper
  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Package editing state
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editDurationInput, setEditDurationInput] = useState('');

  // Voucher creation state
  const [newVoucherForm, setNewVoucherForm] = useState({
    code: '',
    discountPercent: 20,
    maxDiscountAmount: 100000,
    usageLimit: 100,
  });

  const handleCreateVoucher = async () => {
    if (!newVoucherForm.code.trim()) {
      triggerToast('Vui lòng nhập mã voucher!', 'warning');
      return;
    }
    try {
      const payload = {
        code: newVoucherForm.code.trim().toUpperCase(),
        discountPercent: Number(newVoucherForm.discountPercent) || 10,
        maxDiscountAmount: Number(newVoucherForm.maxDiscountAmount) || 100000,
        usageLimit: Number(newVoucherForm.usageLimit) || 100,
        usedCount: 0,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      };
      await adminApi.createVoucher(payload);
      triggerToast(`Đã tạo và kích hoạt voucher ${payload.code} trên Supabase!`);
      setShowCreateVoucherModal(false);
      setNewVoucherForm({ code: '', discountPercent: 20, maxDiscountAmount: 100000, usageLimit: 100 });
      await fetchRealData();
    } catch (err) {
      console.error('Lỗi tạo voucher:', err);
      triggerToast(`Lỗi tạo voucher: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  const handleSavePackage = async () => {
    if (!showEditPackageModal) return;
    const planId = showEditPackageModal.id;
    try {
      const rawId = showEditPackageModal.rawId || parseInt(String(planId).replace(/\D/g, ''), 10);
      const numericPrice = parseFloat(String(editPriceInput || showEditPackageModal.price).replace(/[^\d.]/g, '')) || 0;
      const durationDays = parseInt(String(editDurationInput || showEditPackageModal.duration).replace(/\D/g, ''), 10) || 30;

      if (rawId) {
        await adminApi.updatePlan(rawId, {
          planName: showEditPackageModal.name,
          targetRole: showEditPackageModal.targetRole,
          planType: 'COMBO',
          price: numericPrice,
          durationDays: durationDays,
          isActive: showEditPackageModal.status === 'ACTIVE',
        });
      }

      setPackagesList((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                price: numericPrice,
                priceText: `${numericPrice.toLocaleString('vi-VN')} đ/${durationDays} ngày`,
                duration: `${durationDays} ngày`,
              }
            : p
        )
      );
      triggerToast('Đã lưu cập nhật gói dịch vụ xuống Supabase PostgreSQL!');
      setShowEditPackageModal(null);
    } catch (err) {
      console.error('Lỗi khi cập nhật gói:', err);
      triggerToast(`Lỗi khi lưu gói: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  // Company Approval Action Handlers (Supabase integrated)
  const handleApproveCompany = async (companyId) => {
    try {
      const comp = companies.find((c) => c.id === companyId);
      const rawId = comp?.rawId || parseInt(String(companyId).replace(/\D/g, ''), 10);
      if (rawId) {
        await adminApi.updateCompanyStatus(rawId, 'ACTIVE');
      }
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: 'VERIFIED' } : c))
      );
      setSelectedCompanyIds((prev) => prev.filter((id) => id !== companyId));
      triggerToast(`Đã duyệt xác minh GPKD thành công cho công ty ${companyId} (Lưu Supabase)`);
    } catch (err) {
      console.error('Lỗi khi duyệt công ty:', err);
      triggerToast(`Lỗi khi duyệt công ty: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  const handleOpenRejectCompany = (companyObj) => {
    setRejectingCompanyModal(companyObj);
    setRejectionNote('Mã số thuế hoặc Giấy phép kinh doanh chưa khớp với Cổng DKKD quốc gia.');
  };

  const handleConfirmRejectCompany = async () => {
    if (!rejectingCompanyModal) return;
    const cid = rejectingCompanyModal.id;
    try {
      const rawId = rejectingCompanyModal.rawId || parseInt(String(cid).replace(/\D/g, ''), 10);
      if (rawId) {
        await adminApi.updateCompanyStatus(rawId, 'BANNED');
      }
      setCompanies((prev) =>
        prev.map((c) => (c.id === cid ? { ...c, status: 'REJECTED', notes: `Lý do từ chối: ${rejectionNote}` } : c))
      );
      setSelectedCompanyIds((prev) => prev.filter((id) => id !== cid));
      triggerToast(`Đã từ chối hồ sơ công ty ${cid} trên Supabase.`, 'warning');
    } catch (err) {
      console.error('Lỗi khi từ chối công ty:', err);
      triggerToast(`Lỗi từ chối công ty: ${err?.message || 'Thử lại'}`, 'warning');
    } finally {
      setRejectingCompanyModal(null);
      setRejectionNote('');
    }
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

  const handleBatchApproveCompanies = async () => {
    if (selectedCompanyIds.length === 0) return;
    try {
      for (const id of selectedCompanyIds) {
        const comp = companies.find((c) => c.id === id);
        const rawId = comp?.rawId || parseInt(String(id).replace(/\D/g, ''), 10);
        if (rawId) {
          await adminApi.updateCompanyStatus(rawId, 'ACTIVE');
        }
      }
      setCompanies((prev) =>
        prev.map((c) => (selectedCompanyIds.includes(c.id) ? { ...c, status: 'VERIFIED' } : c))
      );
      triggerToast(`Đã duyệt GPKD hàng loạt cho ${selectedCompanyIds.length} doanh nghiệp trên Supabase!`);
      setSelectedCompanyIds([]);
    } catch (err) {
      console.error('Lỗi duyệt hàng loạt:', err);
      triggerToast(`Lỗi duyệt hàng loạt: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  // Quick Action Handlers for VietQR Orders (Supabase integrated)
  const handleApproveOrder = async (orderId) => {
    try {
      const ord = orders.find((o) => o.id === orderId);
      const rawId = ord?.rawId || parseInt(String(orderId).replace(/\D/g, ''), 10);
      if (!rawId) {
        triggerToast(`Không tìm thấy ID đơn hàng thực tế trong CSDL Supabase`, 'warning');
        return;
      }
      await adminApi.approveOrder(rawId, 'Duyệt thanh toán VietQR qua Admin Portal');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'APPROVED' } : o))
      );
      triggerToast(`Đã duyệt thành công đơn mua ${orderId} & Kích hoạt gói Subscription trên Supabase`);
      await fetchRealData();
    } catch (err) {
      console.error('Lỗi khi duyệt đơn hàng:', err);
      triggerToast(`Lỗi khi duyệt đơn hàng: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      const ord = orders.find((o) => o.id === orderId);
      const rawId = ord?.rawId || parseInt(String(orderId).replace(/\D/g, ''), 10);
      if (!rawId) {
        triggerToast(`Không tìm thấy ID đơn hàng thực tế trong CSDL Supabase`, 'warning');
        return;
      }
      await adminApi.rejectOrder(rawId, 'Từ chối đơn hàng VietQR');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'REJECTED' } : o))
      );
      triggerToast(`Đã từ chối đơn mua ${orderId} trên Supabase`, 'warning');
      await fetchRealData();
    } catch (err) {
      console.error('Lỗi khi từ chối đơn hàng:', err);
      triggerToast(`Lỗi khi từ chối đơn: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  const handleRefundOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'REFUNDED' } : o))
    );
    triggerToast(`Đã ghi nhận hoàn tiền cho đơn mua ${orderId}`, 'info');
  };

  const handleToggleVoucher = async (id) => {
    try {
      if (typeof id === 'number' || !isNaN(Number(id))) {
        await adminApi.toggleVoucher(Number(id));
      }
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: v.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE' }
            : v
        )
      );
      triggerToast(`Cập nhật trạng thái voucher thành công (Lưu Supabase)`);
    } catch (err) {
      console.error('Lỗi khi toggle voucher:', err);
      triggerToast(`Lỗi khi cập nhật voucher: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  const handleToggleUserLock = async (userId) => {
    try {
      const targetUser = usersList.find((u) => u.id === userId);
      const nextStatus = targetUser?.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      await adminApi.updateUserStatus(userId, nextStatus);
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: nextStatus === 'BLOCKED' ? 'LOCKED' : 'ACTIVE' }
            : u
        )
      );
      triggerToast(`Cập nhật trạng thái người dùng #${userId} thành ${nextStatus} (Lưu Supabase)`);
    } catch (err) {
      console.error('Lỗi khóa/mở người dùng:', err);
      triggerToast(`Lỗi khi cập nhật trạng thái: ${err?.message || 'Thử lại'}`, 'warning');
    }
  };

  const handleExportPDF = () => {
    triggerToast('Đang khởi tạo và xuất báo cáo tổng quan PDF...', 'info');
  };

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#/admin-dashboard?tab=${tabId}`;
  };

  // Group activeTab into top-level navigation sections
  const getNavGroup = () => {
    if (['jobs', 'users', 'companies'].includes(activeTab)) return 'moderation';
    if (['orders', 'packages', 'promotions'].includes(activeTab)) return 'finance';
    if (activeTab === 'settings') return 'settings';
    return 'dashboard';
  };

  const currentNavGroup = getNavGroup();

  // Subtabs corresponding strictly to each group
  const groupTabsMap = {
    dashboard: [],
    moderation: [
      { id: 'jobs', label: `Duyệt Tin Đăng (${pendingJobs.length})`, icon: 'fact_check' },
      { id: 'users', label: `Quản Lý Tài Khoản (${usersList.length})`, icon: 'manage_accounts' },
      { id: 'companies', label: `Doanh Nghiệp (${pendingCompanies.length})`, icon: 'corporate_fare' },
    ],
    finance: [
      { id: 'orders', label: 'Lịch Sử Giao Dịch', icon: 'receipt_long' },
      { id: 'packages', label: 'Gói Dịch Vụ', icon: 'inventory_2' },
      { id: 'promotions', label: 'Khuyến Mãi', icon: 'sell' },
    ],
    settings: [],
  };

  const currentGroupTabs = groupTabsMap[currentNavGroup] || [];

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
        <div className="bg-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#5b48bd] text-white shadow-md shrink-0 flex items-center justify-center font-bold text-lg">
              ADM
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-bold text-2xl sm:text-3xl text-[#1e1b4b]">
                  {user?.fullName || 'Quản trị viên Hệ thống'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-purple-50 text-[#5b48bd] border border-purple-200">
                  {currentNavGroup === 'moderation' && 'Kiểm Duyệt & Quản Trị'}
                  {currentNavGroup === 'finance' && 'Tài Chính & Dịch Vụ'}
                  {currentNavGroup === 'settings' && 'Cấu Hình Hệ Thống'}
                  {currentNavGroup === 'dashboard' && 'Tổng Quan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentNavGroup === 'moderation' && 'Khu vực kiểm duyệt tin tuyển dụng, tài khoản người dùng và hồ sơ doanh nghiệp'}
                {currentNavGroup === 'finance' && 'Theo dõi thanh toán VietQR, quản trị gói dịch vụ và phát hành mã khuyến mãi'}
                {currentNavGroup === 'settings' && 'Cài đặt tham số thuật toán AI Matching 70/30 và vận hành nền tảng'}
                {currentNavGroup === 'dashboard' && 'Bảng điều khiển theo dõi tăng trưởng, người dùng và doanh thu thời gian thực'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchRealData}
            disabled={loadingRealData}
            className="px-4 py-2.5 rounded-2xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-[#5b48bd] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            title="Đồng bộ dữ liệu Supabase"
          >
            <span className={`material-symbols-outlined text-base ${loadingRealData ? 'animate-spin' : ''}`}>sync</span>
            <span>{loadingRealData ? 'Đang đồng bộ...' : 'Đồng bộ Supabase'}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ADMIN SUBNAV TAB BAR: CHỈ HIỂN THỊ CÁC TAB CỦA TRANG HIỆN TẠI */}
        {/* ========================================================= */}
        {currentGroupTabs.length > 0 && (
          <div className="bg-white p-2 rounded-3xl border border-purple-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
            {currentGroupTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#5b48bd] text-white shadow-md font-extrabold scale-[1.01]'
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
                  onClick={fetchRealData}
                  disabled={loadingRealData}
                  className="px-4 py-2 rounded-full border border-purple-200 bg-white hover:bg-purple-50 text-[#5b48bd] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Đồng bộ lại toàn bộ dữ liệu thực tế từ Supabase PostgreSQL"
                >
                  <span className={`material-symbols-outlined text-base ${loadingRealData ? 'animate-spin' : ''}`}>sync</span>
                  <span>{loadingRealData ? 'Đang đồng bộ...' : 'Đồng bộ Supabase'}</span>
                </button>

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
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight">
                    {realStats ? realStats.totalUsers.toLocaleString('vi-VN') : usersList.length}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                    <span className="inline-flex items-center text-emerald-600 font-bold gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-xs">trending_up</span>Supabase DB
                    </span>
                    <span className="text-slate-400">thực tế</span>
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
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight">
                    {realStats ? realStats.approvedOrders : orders.filter((o) => o.status === 'APPROVED').length}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                    <span className="inline-flex items-center text-emerald-600 font-bold gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-xs">trending_up</span>Đã duyệt
                    </span>
                    <span className="text-slate-400">hoạt động</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Doanh thu tháng này */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Doanh thu tích lũy</span>
                  <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#f97316] border border-orange-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight whitespace-nowrap">
                    {realStats && realStats.totalRevenue != null
                      ? Number(realStats.totalRevenue).toLocaleString('vi-VN') + ' đ'
                      : '0 đ'}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                    <span className="inline-flex items-center text-emerald-600 font-bold gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-xs">trending_up</span>VietQR
                    </span>
                    <span className="text-slate-400">xác nhận</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Công Ty Chờ Duyệt */}
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

              {/* Card 5: Tin tuyển dụng chờ duyệt */}
              <div 
                onClick={() => handleTabSelect('jobs')}
                className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group hover:border-[#5b48bd]"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Tin tuyển dụng chờ duyệt</span>
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">fact_check</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight flex items-center gap-2">
                    <span>{pendingJobs.length}</span>
                    {pendingJobs.length > 0 && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                        Cần duyệt
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[11px] text-[#5b48bd] font-bold flex items-center gap-1">
                    <span>Kiểm duyệt tin đăng →</span>
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
                    Tổng doanh thu tích lũy: <strong className="text-[#1e1b4b] font-bold">{totalApprovedRev.toLocaleString('vi-VN')} đ</strong>
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

            {/* BÁO CÁO DOANH THU & KÊNH THANH TOÁN VIETQR */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd]">payments</span>
                    Báo Cáo Doanh Thu & Kênh Thanh Toán VietQR
                  </h3>
                  <p className="text-xs text-slate-500">Phân tích dòng tiền trực tuyến, tăng trưởng ARPU và giao dịch VietQR</p>
                </div>
                <button
                  onClick={() => handleTabSelect('orders')}
                  className="px-3 py-1.5 rounded-full bg-purple-50 text-[#5b48bd] hover:bg-purple-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Chi tiết giao dịch</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng Doanh Thu Lũy Kế</span>
                  <div className="text-2xl font-black text-[#1e1b4b] mt-1">{totalApprovedRev.toLocaleString('vi-VN')} đ</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Đồng bộ thực từ Supabase
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">ARPU (Doanh Thu / User)</span>
                  <div className="text-2xl font-black text-[#1e1b4b] mt-1">{calculatedArpu.toLocaleString('vi-VN')} đ</div>
                  <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Trên {totalUsersCount} người dùng</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Cổng Thanh Toán VietQR</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">100% Tự Động</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Quét mã VietQR chuẩn MBBank</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">VietQR Direct Bank Transfer</span>
                  <span className="font-extrabold text-[#5b48bd]">{totalApprovedRev.toLocaleString('vi-VN')} đ (100%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#5b48bd] h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: DUYỆT TIN TUYỂN DỤNG CỦA DOANH NGHIỆP                */}
        {/* ========================================================= */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Header & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">
                  Kiểm Duyệt Tin Tuyển Dụng Doanh Nghiệp
                </h2>
                <p className="text-xs text-slate-500">
                  Kiểm duyệt nội dung bài đăng tuyển dụng, mức lương và yêu cầu kỹ năng trước khi xuất bản ra trang chủ cho ứng viên
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRealData}
                  disabled={loadingRealData}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-[#5b48bd] rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-purple-200 shadow-xs"
                >
                  <span className={`material-symbols-outlined text-base ${loadingRealData ? 'animate-spin' : ''}`}>sync</span>
                  <span>Làm mới danh sách</span>
                </button>
              </div>
            </div>

            {/* 4 STAT KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Chờ duyệt */}
              <button
                onClick={() => setJobApprovalFilter('PENDING')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  jobApprovalFilter === 'PENDING'
                    ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <span>Tin chờ duyệt</span>
                      {pendingJobs.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                    </div>
                    <div className="text-2xl font-extrabold text-amber-900 mt-1">{pendingJobs.length}</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Cần phê duyệt để xuất bản</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-900 border border-amber-300 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">pending_actions</span>
                  </div>
                </div>
              </button>

              {/* Card 2: Đã duyệt */}
              <button
                onClick={() => setJobApprovalFilter('APPROVED')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  jobApprovalFilter === 'APPROVED'
                    ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-300'
                    : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Tin đã phê duyệt</div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-1">{approvedJobs.length}</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Đang hiển thị trên trang chủ</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                </div>
              </button>

              {/* Card 3: Bị từ chối */}
              <button
                onClick={() => setJobApprovalFilter('REJECTED')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  jobApprovalFilter === 'REJECTED'
                    ? 'bg-rose-100/80 border-rose-400 ring-2 ring-rose-300'
                    : 'bg-rose-50/40 border-rose-200 hover:bg-rose-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-800">Tin bị từ chối</div>
                    <div className="text-2xl font-extrabold text-rose-900 mt-1">{rejectedJobs.length}</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">Chưa đạt tiêu chuẩn kiểm duyệt</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">cancel</span>
                  </div>
                </div>
              </button>

              {/* Card 4: Tất cả tin */}
              <button
                onClick={() => setJobApprovalFilter('ALL')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  jobApprovalFilter === 'ALL'
                    ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300'
                    : 'bg-white border-purple-100 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#5b48bd]">Tất cả tin đăng</div>
                    <div className="text-2xl font-extrabold text-[#1e1b4b] mt-1">{jobsList.length}</div>
                    <div className="text-[11px] text-purple-700 mt-0.5">Tổng bài đăng trên hệ thống</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5b48bd] border border-purple-200 flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">work</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-purple-50/50 px-3.5 py-2 rounded-full border border-purple-100">
                <span className="material-symbols-outlined text-[#5b48bd]">search</span>
                <input
                  type="text"
                  placeholder="Tìm theo Tiêu đề tin, Tên công ty, HR, Địa điểm, Kỹ năng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-full border border-purple-100">
                  {[
                    { id: 'PENDING', label: `Chờ duyệt (${pendingJobs.length})` },
                    { id: 'APPROVED', label: `Đã duyệt (${approvedJobs.length})` },
                    { id: 'REJECTED', label: `Từ chối (${rejectedJobs.length})` },
                    { id: 'ALL', label: `Tất cả (${jobsList.length})` },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setJobApprovalFilter(st.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        jobApprovalFilter === st.id
                          ? 'bg-[#5b48bd] text-white shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-[#5b48bd]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table or Empty State */}
            {(() => {
              const filteredJobs = jobsList.filter((job) => {
                const status = job.approvalStatus || 'PENDING';
                const matchStatus = jobApprovalFilter === 'ALL' || status === jobApprovalFilter;
                const q = searchQuery.toLowerCase();
                const matchQuery =
                  !searchQuery ||
                  (job.title && job.title.toLowerCase().includes(q)) ||
                  (job.companyName && job.companyName.toLowerCase().includes(q)) ||
                  (job.recruiterName && job.recruiterName.toLowerCase().includes(q)) ||
                  (job.location && job.location.toLowerCase().includes(q)) ||
                  (job.skills && job.skills.some((s) => s.toLowerCase().includes(q)));
                return matchStatus && matchQuery;
              });

              if (filteredJobs.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center space-y-3 shadow-md">
                    <div className="w-16 h-16 rounded-full bg-purple-50 text-[#5b48bd] mx-auto flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">fact_check</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1e1b4b]">Không có tin tuyển dụng nào phù hợp</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Hiện tại không có tin tuyển dụng nào theo bộ lọc đang chọn. Thử chọn "Tất cả" hoặc thay đổi từ khóa tìm kiếm.
                    </p>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#32247b] text-white text-[11px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3.5 px-4">Tin Tuyển Dụng / Vị Trí</th>
                        <th className="py-3.5 px-4">Doanh Nghiệp &amp; HR</th>
                        <th className="py-3.5 px-4">Mức Lương / Địa Điểm</th>
                        <th className="py-3.5 px-4">Kỹ Năng Yêu Cầu</th>
                        <th className="py-3.5 px-4">Ngày Đăng</th>
                        <th className="py-3.5 px-4 text-center">Trạng Thái Duyệt</th>
                        <th className="py-3.5 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {filteredJobs.map((job) => {
                        const status = job.approvalStatus || 'PENDING';
                        return (
                          <tr key={job.jobId} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-4 px-4 font-bold text-[#1e1b4b]">
                              <div
                                className="font-bold text-sm text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer"
                                onClick={() => setSelectedJob(job)}
                              >
                                {job.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-normal">
                                <span className="font-mono text-purple-700 font-semibold">#{job.jobId}</span>
                                <span>•</span>
                                <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md font-semibold">
                                  {job.employmentType === 'FULL_TIME' ? 'Toàn thời gian' : job.employmentType === 'PART_TIME' ? 'Bán thời gian' : job.employmentType === 'INTERNSHIP' ? 'Thực tập sinh' : (job.employmentType || 'Toàn thời gian')}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold text-xs shrink-0">
                                  {job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                  <div className="font-bold text-[#1e1b4b]">{job.companyName || 'HireMate Partner'}</div>
                                  <div className="text-[11px] text-slate-500">{job.recruiterName || 'HR Tuyển dụng'}</div>
                                  {job.recruiterEmail && (
                                    <div className="text-[10px] text-slate-400 font-mono">{job.recruiterEmail}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-bold text-[#5b48bd]">
                                {job.salaryMin && job.salaryMax
                                  ? `${Number(job.salaryMin).toLocaleString('vi-VN')} - ${Number(job.salaryMax).toLocaleString('vi-VN')} đ`
                                  : job.salaryMin
                                  ? `Từ ${Number(job.salaryMin).toLocaleString('vi-VN')} đ`
                                  : 'Thỏa thuận'}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                                <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                                <span>{job.location || 'Toàn quốc'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {job.skills && job.skills.length > 0 ? (
                                  job.skills.slice(0, 3).map((sk, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold">
                                      {sk}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">Không có kỹ năng cụ thể</span>
                                )}
                                {job.skills && job.skills.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                    +{job.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-slate-500">
                              {job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'Mới'}
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {status === 'APPROVED' ? 'check_circle' : status === 'REJECTED' ? 'cancel' : 'pending'}
                                </span>
                                <span>
                                  {status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                                </span>
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedJob(job)}
                                  className="p-1.5 rounded-xl border border-purple-200 text-[#5b48bd] hover:bg-purple-50 cursor-pointer"
                                  title="Xem chi tiết bài đăng"
                                >
                                  <span className="material-symbols-outlined text-base">visibility</span>
                                </button>
                                {status !== 'APPROVED' && (
                                  <button
                                    onClick={() => handleApproveJob(job.jobId)}
                                    className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                                    title="Phê duyệt tin này"
                                  >
                                    <span className="material-symbols-outlined text-xs">check</span>
                                    <span>Duyệt</span>
                                  </button>
                                )}
                                {status !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleRejectJob(job.jobId)}
                                    className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                    title="Từ chối duyệt tin này"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                    <span>Từ chối</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
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
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          <div>{o.pkg}</div>
                          {o.voucherCode && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                              Mã: {o.voucherCode} (-{(Number(o.discountAmount) || 0).toLocaleString('vi-VN')} đ)
                            </span>
                          )}
                        </td>
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b]">
                  Quản Lý Tài Khoản Người Dùng &amp; Phân Quyền
                </h2>
                <p className="text-xs text-slate-500">
                  Quản lý và phân quyền tài khoản Ứng viên (Candidate), Nhà tuyển dụng (Recruiter) và Quản trị viên (Admin)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRealData}
                  disabled={loadingRealData}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-[#5b48bd] rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-purple-200 shadow-xs"
                >
                  <span className={`material-symbols-outlined text-base ${loadingRealData ? 'animate-spin' : ''}`}>sync</span>
                  <span>Đồng bộ tài khoản</span>
                </button>
              </div>
            </div>

            {/* 4 KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Tổng người dùng */}
              <button
                onClick={() => setUserRoleFilterTab('ALL')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  userRoleFilterTab === 'ALL'
                    ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300'
                    : 'bg-white border-purple-100 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#5b48bd]">Tổng tài khoản</div>
                    <div className="text-2xl font-extrabold text-[#1e1b4b] mt-1">{usersList.length}</div>
                    <div className="text-[11px] text-purple-700 mt-0.5">Tất cả tài khoản trong hệ thống</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                </div>
              </button>

              {/* Card 2: Ứng viên (Candidate) */}
              <button
                onClick={() => setUserRoleFilterTab('CANDIDATE')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  userRoleFilterTab === 'CANDIDATE'
                    ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-300'
                    : 'bg-blue-50/40 border-blue-200 hover:bg-blue-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-800">Ứng viên (Candidate)</div>
                    <div className="text-2xl font-extrabold text-blue-900 mt-1">
                      {usersList.filter((u) => u.role === 'CANDIDATE').length}
                    </div>
                    <div className="text-[11px] text-blue-700 mt-0.5">Tài khoản tìm việc &amp; luyện tập</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                </div>
              </button>

              {/* Card 3: Nhà tuyển dụng (Recruiter) */}
              <button
                onClick={() => setUserRoleFilterTab('RECRUITER')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  userRoleFilterTab === 'RECRUITER'
                    ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-300'
                    : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Nhà tuyển dụng (Recruiter)</div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                      {usersList.filter((u) => u.role === 'RECRUITER').length}
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">HR &amp; Đại diện doanh nghiệp</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">badge</span>
                  </div>
                </div>
              </button>

              {/* Card 4: Quản trị viên (Admin) */}
              <button
                onClick={() => setUserRoleFilterTab('ADMIN')}
                className={`text-left rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
                  userRoleFilterTab === 'ADMIN'
                    ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-amber-50/40 border-amber-200 hover:bg-amber-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-800">Quản trị viên (Admin)</div>
                    <div className="text-2xl font-extrabold text-amber-900 mt-1">
                      {usersList.filter((u) => u.role === 'ADMIN').length}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Quyền kiểm duyệt toàn hệ thống</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-purple-50/50 px-3.5 py-2 rounded-full border border-purple-100">
                <span className="material-symbols-outlined text-[#5b48bd]">search</span>
                <input
                  type="text"
                  placeholder="Tìm theo Họ tên, Email, Số điện thoại, Công ty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Role Filter Pills */}
                <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-full border border-purple-100">
                  {[
                    { id: 'ALL', label: `Tất cả vai trò` },
                    { id: 'CANDIDATE', label: `Ứng viên` },
                    { id: 'RECRUITER', label: `Nhà tuyển dụng` },
                    { id: 'ADMIN', label: `Quản trị` },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setUserRoleFilterTab(r.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        userRoleFilterTab === r.id
                          ? 'bg-[#5b48bd] text-white shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-[#5b48bd]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                  {[
                    { id: 'ALL', label: 'Tất cả trạng thái' },
                    { id: 'ACTIVE', label: 'Hoạt động' },
                    { id: 'LOCKED', label: 'Bị khóa' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setUserStatusFilterTab(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        userStatusFilterTab === s.id
                          ? 'bg-white text-[#1e1b4b] shadow-xs'
                          : 'text-slate-500 hover:text-[#1e1b4b]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            {(() => {
              const filteredUsers = usersList.filter((u) => {
                const matchRole = userRoleFilterTab === 'ALL' || u.role === userRoleFilterTab;
                const matchStatus = userStatusFilterTab === 'ALL' || u.status === userStatusFilterTab;
                const q = searchQuery.toLowerCase();
                const matchQuery =
                  !searchQuery ||
                  (u.name && u.name.toLowerCase().includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q)) ||
                  (u.phone && u.phone.toLowerCase().includes(q)) ||
                  (u.company && u.company.toLowerCase().includes(q)) ||
                  (u.role && u.role.toLowerCase().includes(q));
                return matchRole && matchStatus && matchQuery;
              });

              if (filteredUsers.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center space-y-3 shadow-md">
                    <div className="w-16 h-16 rounded-full bg-purple-50 text-[#5b48bd] mx-auto flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">no_accounts</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1e1b4b]">Không tìm thấy tài khoản nào</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc vai trò, trạng thái.
                    </p>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#32247b] text-white text-[11px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3.5 px-4">Tài Khoản / Thành Viên</th>
                        <th className="py-3.5 px-4">Email &amp; Số Điện Thoại</th>
                        <th className="py-3.5 px-4">Vai Trò (Role)</th>
                        <th className="py-3.5 px-4">Tổ Chức / Doanh Nghiệp</th>
                        <th className="py-3.5 px-4">Ngày Tham Gia</th>
                        <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                        <th className="py-3.5 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#1e1b4b]">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-[#5b48bd] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-[#1e1b4b] text-sm">{u.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-600 font-mono">{u.email}</div>
                            {u.phone && u.phone !== '-' && (
                              <div className="text-[11px] text-slate-400">{u.phone}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : u.role === 'RECRUITER'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}
                            >
                              {u.role === 'ADMIN' ? 'Quản Trị Viên' : u.role === 'RECRUITER' ? 'Nhà Tuyển Dụng' : 'Ứng Viên'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-700">{u.company}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">{u.joined}</td>

                          <td className="py-3.5 px-4 text-center">
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

                          <td className="py-3.5 px-4 text-right">
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
              );
            })()}
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
              {selectedOrderDetails.voucherCode && (
                <div className="flex justify-between py-1 border-b border-purple-50 bg-amber-50/60 px-2 rounded-lg">
                  <span className="text-amber-800 font-semibold">Voucher giảm giá:</span>
                  <span className="font-mono font-bold text-amber-900">
                    {selectedOrderDetails.voucherCode} (-{(Number(selectedOrderDetails.discountAmount) || 0).toLocaleString('vi-VN')} đ)
                  </span>
                </div>
              )}
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
                  value={newVoucherForm.code}
                  onChange={(e) => setNewVoucherForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-mono font-bold uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Phần trăm giảm (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="20"
                    value={newVoucherForm.discountPercent}
                    onChange={(e) => setNewVoucherForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                    className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={newVoucherForm.maxDiscountAmount}
                    onChange={(e) => setNewVoucherForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                    className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Số lượt sử dụng tối đa</label>
                <input
                  type="number"
                  min="1"
                  value={newVoucherForm.usageLimit}
                  onChange={(e) => setNewVoucherForm(prev => ({ ...prev, usageLimit: e.target.value }))}
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
                onClick={handleCreateVoucher}
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
                  defaultValue={showEditPackageModal.price}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-full text-xs font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Thời hạn sử dụng (ngày)</label>
                <input
                  type="text"
                  defaultValue={showEditPackageModal.duration}
                  onChange={(e) => setEditDurationInput(e.target.value)}
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
                onClick={handleSavePackage}
                className="px-5 py-2 bg-[#5b48bd] text-white text-xs font-bold rounded-full shadow-md"
              >
                Lưu vào Supabase
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

      {/* MODAL: XEM CHI TIẾT & KIỂM DUYỆT BÀI ĐĂNG TUYỂN DỤNG */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-purple-100 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-purple-100 flex items-start justify-between bg-purple-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    Mã tin: #{selectedJob.jobId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedJob.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : selectedJob.approvalStatus === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedJob.approvalStatus === 'APPROVED'
                      ? 'Đã duyệt'
                      : selectedJob.approvalStatus === 'REJECTED'
                      ? 'Từ chối'
                      : 'Chờ duyệt'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#1e1b4b] mt-1">{selectedJob.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-[#5b48bd]">{selectedJob.companyName || 'HireMate Partner'}</span>
                  <span>•</span>
                  <span>HR: {selectedJob.recruiterName || 'Chưa cập nhật'}</span>
                  {selectedJob.recruiterEmail && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{selectedJob.recruiterEmail}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Highlight cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Mức lương</div>
                  <div className="font-extrabold text-[#5b48bd] text-sm mt-0.5">
                    {selectedJob.salaryMin && selectedJob.salaryMax
                      ? `${Number(selectedJob.salaryMin).toLocaleString('vi-VN')} - ${Number(selectedJob.salaryMax).toLocaleString('vi-VN')} đ`
                      : selectedJob.salaryMin
                      ? `Từ ${Number(selectedJob.salaryMin).toLocaleString('vi-VN')} đ`
                      : 'Thỏa thuận'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Địa điểm</div>
                  <div className="font-bold text-slate-700 mt-0.5">{selectedJob.location || 'Toàn quốc'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Hình thức</div>
                  <div className="font-bold text-slate-700 mt-0.5">
                    {selectedJob.employmentType === 'FULL_TIME'
                      ? 'Toàn thời gian'
                      : selectedJob.employmentType === 'PART_TIME'
                      ? 'Bán thời gian'
                      : selectedJob.employmentType === 'INTERNSHIP'
                      ? 'Thực tập sinh'
                      : (selectedJob.employmentType || 'Toàn thời gian')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Hạn nộp hồ sơ</div>
                  <div className="font-bold text-slate-700 mt-0.5">
                    {selectedJob.deadlineDate
                      ? new Date(selectedJob.deadlineDate).toLocaleDateString('vi-VN')
                      : selectedJob.deadline
                      ? new Date(selectedJob.deadline).toLocaleDateString('vi-VN')
                      : 'Không giới hạn'}
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Kỹ năng yêu cầu:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5">Mô tả công việc:</h4>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {selectedJob.description}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5">Yêu cầu ứng viên:</h4>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {Array.isArray(selectedJob.requirements)
                      ? selectedJob.requirements.join('\n• ')
                      : selectedJob.requirements}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5">Quyền lợi đãi ngộ:</h4>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {Array.isArray(selectedJob.benefits)
                      ? selectedJob.benefits.join('\n• ')
                      : selectedJob.benefits}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-purple-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {selectedJob.approvalStatus !== 'REJECTED' && (
                  <button
                    onClick={() => handleRejectJob(selectedJob.jobId)}
                    className="px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    <span>Từ chối duyệt</span>
                  </button>
                )}
                {selectedJob.approvalStatus !== 'APPROVED' && (
                  <button
                    onClick={() => handleApproveJob(selectedJob.jobId)}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Phê duyệt xuất bản</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
