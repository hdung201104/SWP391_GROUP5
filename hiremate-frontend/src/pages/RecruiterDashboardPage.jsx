import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RecruiterProfilePage from './RecruiterProfilePage';
import RecruiterJobManagementPage from './RecruiterJobManagementPage';

const MOCK_RECRUITER_JOBS = [
  {
    jobId: 101,
    title: 'Senior Backend Engineer',
    department: 'Software Engineering',
    location: 'TP.HCM • Hybrid',
    salaryText: '$2,500 - $3,500/tháng',
    status: 'ACTIVE',
    targetHires: 3,
    hiredCount: 2,
    totalViews: 342,
    totalApplicants: 18,
    avgMatch: 91,
    interviewCount: 3,
    offerCount: 2,
    postedDate: '2025-05-18',
    mandatorySkills: ['Java 21', 'Spring Boot 3', 'PostgreSQL'],
    preferredSkills: ['Kafka', 'Redis Cluster', 'Docker'],
  },
  {
    jobId: 102,
    title: 'Lead Distributed Systems',
    department: 'Core Infrastructure',
    location: 'TP.HCM • Onsite Campus',
    salaryText: '$3,500 - $5,000/tháng',
    status: 'ACTIVE',
    targetHires: 2,
    hiredCount: 1,
    totalViews: 520,
    totalApplicants: 14,
    avgMatch: 87,
    interviewCount: 5,
    offerCount: 1,
    postedDate: '2025-05-15',
    mandatorySkills: ['Go / Java', 'Distributed Architecture', 'Kubernetes'],
    preferredSkills: ['gRPC', 'Low Latency', 'Terraform'],
  },
  {
    jobId: 103,
    title: 'Principal AI Engineer (LLM / RAG)',
    department: 'AI Innovation Lab',
    location: 'Hà Nội • Hybrid',
    salaryText: '$4,000 - $6,500/tháng',
    status: 'ACTIVE',
    targetHires: 2,
    hiredCount: 2,
    totalViews: 680,
    totalApplicants: 9,
    avgMatch: 94,
    interviewCount: 3,
    offerCount: 2,
    postedDate: '2025-05-14',
    mandatorySkills: ['PyTorch', 'Vector Embeddings', 'LLM Tuning'],
    preferredSkills: ['LangChain', 'Milvus', 'FastAPI'],
  },
];

const INITIAL_KANBAN_CANDIDATES = [
  {
    candidateId: 1,
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@gmail.com',
    appliedJobId: 101,
    aiMatchScore: 96,
    stage: 'APPLIED',
    appliedDate: '2h trước',
    cvUrl: '#',
    notes: 'Kinh nghiệm 5 năm Java Spring Boot và hệ thống phân tán ngân hàng.',
  },
  {
    candidateId: 2,
    fullName: 'Trần Minh Quang',
    email: 'quang.tran@tech.vn',
    appliedJobId: 101,
    aiMatchScore: 92,
    stage: 'REVIEWING',
    appliedDate: '1 ngày trước',
    cvUrl: '#',
    notes: 'Đã hoàn thành bài test thuật toán 95/100.',
  },
  {
    candidateId: 3,
    fullName: 'Vũ Đức Thịnh',
    email: 'thinh.vu@dev.io',
    appliedJobId: 101,
    aiMatchScore: 94,
    stage: 'INTERVIEW',
    appliedDate: '3 ngày trước',
    cvUrl: '#',
    notes: 'Hẹn phỏng vấn kỹ thuật vào 14:00 Thứ 5 với Technical Director.',
  },
  {
    candidateId: 4,
    fullName: 'Nguyễn Thị Thuỳ Trang',
    email: 'trang.nguyen@cloud.vn',
    appliedJobId: 101,
    aiMatchScore: 90,
    stage: 'OFFERED',
    appliedDate: '5 ngày trước',
    cvUrl: '#',
    notes: 'Đã gửi offer package $3,200/tháng kèm gói thưởng sign-on.',
  },
  {
    candidateId: 5,
    fullName: 'Phạm Tuấn Anh',
    email: 'anh.pham@distributed.net',
    appliedJobId: 102,
    aiMatchScore: 95,
    stage: 'REVIEWING',
    appliedDate: '4h trước',
    cvUrl: '#',
    notes: 'Kiến trúc sư hệ thống chịu tải cao, chuyên sâu Golang và Kubernetes.',
  },
  {
    candidateId: 6,
    fullName: 'Trần Bảo Long',
    email: 'long.tran@fintech.com',
    appliedJobId: 102,
    aiMatchScore: 94,
    stage: 'INTERVIEW',
    appliedDate: '2 ngày trước',
    cvUrl: '#',
    notes: 'Expert Java Concurrency, Kafka 50k RPS, đạt 9/10 tiêu chí kỹ thuật.',
  },
];

export default function RecruiterDashboardPage({ user, currentRoute }) {
  // Parse tab from currentRoute
  const getInitialTab = () => {
    if (currentRoute?.includes('tab=jobs')) return 'JOBS';
    if (currentRoute?.includes('tab=pipeline')) return 'PIPELINE';
    if (currentRoute?.includes('tab=company')) return 'COMPANY';
    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [jobs, setJobs] = useState(MOCK_RECRUITER_JOBS);
  const [candidates, setCandidates] = useState(INITIAL_KANBAN_CANDIDATES);
  const [selectedJobId, setSelectedJobId] = useState(101);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState('');

  // Analytics & Report State
  const [reportTimeframe, setReportTimeframe] = useState('30_DAYS');
  const [reportJobFilter, setReportJobFilter] = useState('ALL');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Company Profile state
  const [companyProfile] = useState({
    name: user?.companyName || 'FPT Software & Cloud Solutions',
    tagline: 'Leading Global IT Services & Digital Transformation Partner',
    bio: 'FPT Software là tập đoàn công nghệ tiên phong tại Việt Nam và Đông Nam Á, cung cấp các giải pháp phần mềm, điện toán đám mây và trí tuệ nhân tạo quy mô toàn cầu cho các doanh nghiệp Fortune 500.',
    website: 'https://fptsoftware.com',
    headquarters: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh & Cầu Giấy, Hà Nội',
    size: '30,000+ Kỹ sư & Chuyên gia công nghệ',
  });

  // Create Job Form with 70/30 skill weighting
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    department: 'Engineering',
    location: 'TP.HCM • Hybrid',
    salaryText: '$2,500 - $4,000/tháng',
    description: '',
    mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL',
    preferredSkillsInput: 'Kafka, Redis, Docker, AWS',
  });

  useEffect(() => {
    if (currentRoute?.includes('tab=jobs')) {
      setActiveTab('JOBS');
      if (currentRoute?.includes('action=new')) setShowCreateModal(true);
    } else if (currentRoute?.includes('tab=pipeline')) {
      setActiveTab('PIPELINE');
    } else if (currentRoute?.includes('tab=company')) {
      setActiveTab('COMPANY');
    } else if (currentRoute?.includes('tab=overview')) {
      setActiveTab('OVERVIEW');
    }
  }, [currentRoute]);

  const handleRefreshReport = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setNotification('Đã đồng bộ hóa 100% dữ liệu báo cáo thời gian thực từ AI Matching Engine 4.2!');
    }, 600);
  };

  const handleDownloadReport = () => {
    setShowExportModal(false);
    setNotification(`Đang xuất file Báo Cáo Tuyển Dụng (${exportFormat}) chất lượng cao... Tải về tự động!`);
  };

  const handleCreateJobSubmit = (e) => {
    e.preventDefault();
    const mandatory = newJobForm.mandatorySkillsInput.split(',').map(s => s.trim()).filter(Boolean);
    const preferred = newJobForm.preferredSkillsInput.split(',').map(s => s.trim()).filter(Boolean);

    const createdJob = {
      jobId: Date.now(),
      title: newJobForm.title,
      department: newJobForm.department,
      location: newJobForm.location,
      salaryText: newJobForm.salaryText,
      status: 'ACTIVE',
      targetHires: 2,
      hiredCount: 0,
      totalViews: 0,
      totalApplicants: 0,
      avgMatch: 0,
      interviewCount: 0,
      offerCount: 0,
      postedDate: 'Vừa xong',
      mandatorySkills: mandatory,
      preferredSkills: preferred,
    };

    setJobs([createdJob, ...jobs]);
    setShowCreateModal(false);
    setNotification(`Đã xuất bản thành công tin tuyển dụng mới: ${createdJob.title}`);
    setNewJobForm({
      title: '',
      department: 'Engineering',
      location: 'TP.HCM • Hybrid',
      salaryText: '$2,500 - $4,000/tháng',
      description: '',
      mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL',
      preferredSkillsInput: 'Kafka, Redis, Docker, AWS',
    });
  };

  const handleMoveCandidateStage = (candidateId, nextStage) => {
    setCandidates(prev => prev.map(c => 
      c.candidateId === candidateId ? { ...c, stage: nextStage } : c
    ));
    setNotification(`Đã cập nhật trạng thái ứng viên sang chặng: ${nextStage}`);
  };

  // Filter candidates for selected job and sort by AI Match score descending
  const jobCandidates = candidates
    .filter(c => c.appliedJobId === selectedJobId)
    .sort((a, b) => b.aiMatchScore - a.aiMatchScore);

  return (
    <div className="recruiter-page min-h-screen bg-[#F9F8F4] text-[#2D3A31] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Recruiter Portal Top Banner */}
        <div className="bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-8 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 shadow-soft shrink-0 flex items-center justify-center font-serif font-bold text-2xl text-[#2D3A31]">
              FPT
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D3A31]">
                  {user?.fullName || 'Nguyễn Minh Anh'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#C27B66] hover:bg-[#A86552] text-white text-xs py-2.5 px-5 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-soft transition-all"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Đăng Tin Mới</span>
            </button>

            <button
              onClick={() => setActiveTab('PIPELINE')}
              className="bg-white hover:bg-[#FAF6F0] text-[#2D3A31] border border-[#E6E2DA] text-xs py-2.5 px-5 rounded-full font-semibold flex items-center gap-1.5 cursor-pointer shadow-soft transition-all"
            >
              <span className="material-symbols-outlined text-base text-[#C27B66]">view_kanban</span>
              <span>Xem Phễu Kanban</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-4 rounded-2xl bg-[#FAF0ED] border border-[#C27B66]/30 text-[#2D3A31] text-xs flex items-center justify-between shadow-soft animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#C27B66]">check_circle</span>
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')} className="text-sm cursor-pointer hover:text-[#2D3A31]/70">&times;</button>
          </div>
        )}

        {/* Recruiter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E2DA] pb-3 text-xs font-sans">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#C27B66] text-white shadow-soft'
                : 'bg-white text-[#667067] hover:text-[#2D3A31] border border-[#E6E2DA]'
            }`}
          >
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>1. Báo Cáo &amp; Phân Tích Tuyển Dụng</span>
          </button>

          <button
            onClick={() => setActiveTab('JOBS')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'JOBS'
                ? 'bg-[#C27B66] text-white shadow-soft'
                : 'bg-white text-[#667067] hover:text-[#2D3A31] border border-[#E6E2DA]'
            }`}
          >
            <span className="material-symbols-outlined text-base">work_outline</span>
            <span>2. Quản Lý Tin Tuyển Dụng ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'PIPELINE'
                ? 'bg-[#C27B66] text-white shadow-soft'
                : 'bg-white text-[#667067] hover:text-[#2D3A31] border border-[#E6E2DA]'
            }`}
          >
            <span className="material-symbols-outlined text-base">view_kanban</span>
            <span>3. Phễu Ứng Viên Kanban ({candidates.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE RECRUITMENT ANALYTICS & REPORTS SUITE     */}
        {/* ========================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Control Bar: Filters, Date Picker, Refresh & Export */}
            <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-soft">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="material-symbols-outlined text-[#C27B66] text-xl">query_stats</span>
                  <h2 className="text-lg font-serif font-bold text-[#2D3A31] tracking-tight">
                    Trung Tâm Báo Cáo &amp; Hiệu Suất Tuyển Dụng AI
                  </h2>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap shrink-0 max-w-full">
                {/* Timeframe selector */}
                <div className="inline-flex rounded-full bg-[#FAF6F0] border border-[#E6E2DA] p-1 text-xs shrink-0">
                  {[
                    { id: '7_DAYS', label: '7 Ngày' },
                    { id: '30_DAYS', label: '30 Ngày' },
                    { id: 'QUARTER_3', label: 'Quý III' },
                    { id: 'YEAR_2025', label: 'Năm 2025' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setReportTimeframe(t.id)}
                      className={`px-2.5 py-1 rounded-full transition-all cursor-pointer font-bold whitespace-nowrap ${
                        reportTimeframe === t.id
                          ? 'bg-[#C27B66] text-white shadow-soft'
                          : 'text-[#667067] hover:text-[#2D3A31]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Job filter dropdown */}
                <select
                  value={reportJobFilter}
                  onChange={(e) => setReportJobFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-[#FAF6F0] border border-[#E6E2DA] text-xs font-semibold text-[#2D3A31] focus:outline-none focus:border-[#C27B66] cursor-pointer shrink-0"
                >
                  <option value="ALL">Tất cả vị trí (3 jobs)</option>
                  <option value="101">Senior Backend Engineer</option>
                  <option value="102">Lead Distributed Systems</option>
                  <option value="103">Principal AI Engineer</option>
                </select>

                {/* Refresh button */}
                <button
                  type="button"
                  onClick={handleRefreshReport}
                  className="p-1.5 rounded-full bg-[#FAF6F0] hover:bg-[#E6E2DA]/50 border border-[#E6E2DA] text-[#2D3A31] transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Làm mới dữ liệu AI"
                >
                  <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin text-[#C27B66]' : ''}`}>
                    sync
                  </span>
                </button>

                {/* Export Report CTA */}
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-1.5 rounded-full bg-[#C27B66] hover:bg-[#A86552] text-white font-bold text-xs uppercase tracking-wider shadow-soft transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Xuất Báo Cáo</span>
                </button>
              </div>
            </div>

            {/* 6 Core Executive KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
              {/* Metric 1: Total Applicants */}
              <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8C9A84] font-bold uppercase tracking-wider min-h-[28px]">
                    <span className="line-clamp-1">Tổng Hồ Sơ</span>
                    <span className="material-symbols-outlined text-[#8C9A84] text-lg shrink-0">folder_shared</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] pt-1">41</div>
                  <div className="flex items-center gap-1 text-[11px] text-[#8C9A84] font-semibold min-h-[22px]">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    <span>+18.4% vs tháng trước</span>
                  </div>
                </div>
                <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full mt-4 overflow-hidden shrink-0">
                  <div className="bg-[#2D3A31] h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              {/* Metric 2: Time to Hire */}
              <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#C27B66] font-bold uppercase tracking-wider min-h-[28px]">
                    <span className="line-clamp-1">Time-to-Hire</span>
                    <span className="material-symbols-outlined text-[#C27B66] text-lg shrink-0">speed</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C27B66] pt-1">
                    12.5 <span className="text-xs font-normal text-[#2D3A31]/60">ngày</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#8C9A84] font-semibold min-h-[22px]">
                    <span className="material-symbols-outlined text-xs">bolt</span>
                    <span>Nhanh hơn 4.2 ngày (-25%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full mt-4 overflow-hidden shrink-0">
                  <div className="bg-[#C27B66] h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              {/* Metric 3: Average AI Match Score */}
              <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8C9A84] font-bold uppercase tracking-wider min-h-[28px]">
                    <span className="line-clamp-1">AI Match TB</span>
                    <span className="material-symbols-outlined text-[#8C9A84] text-lg shrink-0">auto_awesome</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] pt-1">91.4%</div>
                  <div className="flex items-center gap-1 text-[11px] text-[#2D3A31]/70 font-semibold min-h-[22px]">
                    <span>70% Bắt buộc + 30% Ưu tiên</span>
                  </div>
                </div>
                <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full mt-4 overflow-hidden shrink-0">
                  <div className="bg-[#8C9A84] h-full rounded-full" style={{ width: '91.4%' }}></div>
                </div>
              </div>

              {/* Metric 4: Interview Pass Rate */}
              <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8C9A84] font-bold uppercase tracking-wider min-h-[28px]">
                    <span className="line-clamp-1">Pass Phỏng Vấn</span>
                    <span className="material-symbols-outlined text-[#8C9A84] text-lg shrink-0">how_to_reg</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] pt-1">45.5%</div>
                  <div className="flex items-center gap-1 text-[11px] text-[#2D3A31]/70 font-semibold min-h-[22px]">
                    <span>5 trúng tuyển / 11 phỏng vấn</span>
                  </div>
                </div>
                <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full mt-4 overflow-hidden shrink-0">
                  <div className="bg-[#2D3A31] h-full rounded-full" style={{ width: '45.5%' }}></div>
                </div>
              </div>

              {/* Metric 5: Cost per Hire */}
              <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8C9A84] font-bold uppercase tracking-wider min-h-[28px]">
                    <span className="line-clamp-1">Chi Phí / Tuyển Dụng</span>
                    <span className="material-symbols-outlined text-[#8C9A84] text-lg shrink-0">payments</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] pt-1">
                    $380 <span className="text-xs font-normal text-[#2D3A31]/60">USD</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#8C9A84] font-semibold min-h-[22px]">
                    <span className="material-symbols-outlined text-xs">savings</span>
                    <span>Tiết kiệm 72% chi phí</span>
                  </div>
                </div>
                <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full mt-4 overflow-hidden shrink-0">
                  <div className="bg-[#8C9A84] h-full rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>

              {/* Metric 6: Offer Acceptance */}
              <div className="p-5 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8C9A84] font-bold uppercase tracking-wider min-h-[28px]">
                    <span className="line-clamp-1">Tỷ Lệ Nhận Offer</span>
                    <span className="material-symbols-outlined text-[#8C9A84] text-lg shrink-0">verified</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] pt-1">100%</div>
                  <div className="flex items-center gap-1 text-[11px] text-[#2D3A31]/70 font-semibold min-h-[22px]">
                    <span>5/5 ứng viên chấp thuận</span>
                  </div>
                </div>
                <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full mt-4 overflow-hidden shrink-0">
                  <div className="bg-[#2D3A31] h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Deep Recruitment Funnel Visualizer (5 Stages with Drop-off & Conversion) */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2DA]">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D3A31] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8C9A84]">filter_alt</span>
                    Phễu Chuyển Đổi Tuyển Dụng Đa Tầng (Deep Recruitment Conversion Funnel)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse"></span>
                  AI 70/30 FILTER ACTIVE
                </span>
              </div>

              {/* 5 Funnel Stages Connected Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
                {/* Step 1: Applied */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] hover:border-[#8C9A84] transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#8C9A84]">
                      <span>CHẶNG 1</span>
                      <span className="text-[#2D3A31] font-bold">100%</span>
                    </div>
                    <div className="text-sm font-serif font-bold text-[#2D3A31] mt-1">Hồ Sơ Nộp Mới</div>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] mt-2">
                      41 <span className="text-xs font-normal text-[#2D3A31]/60">CV</span>
                    </div>
                    <p className="text-[11px] text-[#2D3A31]/70 mt-1">Nguồn: Cổng việc làm, LinkedIn &amp; FPT Portal.</p>
                  </div>
                  <div className="pt-2 border-t border-[#E6E2DA] text-[11px] font-medium text-[#8C9A84]">
                    Bắt đầu quy trình sàng lọc
                  </div>
                </div>

                {/* Step 2: AI Screening 70/30 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] hover:border-[#C27B66] transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#C27B66]">
                      <span>CHẶNG 2</span>
                      <span className="text-[#C27B66] font-bold">53.7%</span>
                    </div>
                    <div className="text-sm font-serif font-bold text-[#2D3A31] mt-1">Sàng Lọc AI 70/30</div>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C27B66] mt-2">
                      22 <span className="text-xs font-normal text-[#2D3A31]/60">đạt chuẩn</span>
                    </div>
                    <p className="text-[11px] text-[#2D3A31]/70 mt-1">Loại 19 hồ sơ (thiếu Java 21 / Microservices).</p>
                  </div>
                  <div className="pt-2 border-t border-[#E6E2DA] text-[11px] font-medium text-[#C27B66]">
                    &darr; Drop-off 46.3% (Loại hồ sơ rác)
                  </div>
                </div>

                {/* Step 3: Tech Interview */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] hover:border-[#8C9A84] transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#8C9A84]">
                      <span>CHẶNG 3</span>
                      <span className="text-[#2D3A31] font-bold">26.8%</span>
                    </div>
                    <div className="text-sm font-serif font-bold text-[#2D3A31] mt-1">Phỏng Vấn Kỹ Thuật</div>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] mt-2">
                      11 <span className="text-xs font-normal text-[#2D3A31]/60">ứng viên</span>
                    </div>
                    <p className="text-[11px] text-[#2D3A31]/70 mt-1">Vòng System Design, Concurrency &amp; Văn hóa.</p>
                  </div>
                  <div className="pt-2 border-t border-[#E6E2DA] text-[11px] font-medium text-[#8C9A84]">
                    &darr; 50% qua vòng thẩm định trực tiếp
                  </div>
                </div>

                {/* Step 4: Offer Package */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] hover:border-[#2D3A31] transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#2D3A31]/80">
                      <span>CHẶNG 4</span>
                      <span className="text-[#2D3A31] font-bold">14.6%</span>
                    </div>
                    <div className="text-sm font-serif font-bold text-[#2D3A31] mt-1">Gửi Thư Mời (Offer)</div>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] mt-2">
                      6 <span className="text-xs font-normal text-[#2D3A31]/60">gói offer</span>
                    </div>
                    <p className="text-[11px] text-[#2D3A31]/70 mt-1">Mức đãi ngộ $2,500 - $4,500 + Thưởng sign-on.</p>
                  </div>
                  <div className="pt-2 border-t border-[#E6E2DA] text-[11px] font-medium text-[#2D3A31]/70">
                    &darr; Đang đàm phán 1 ứng viên
                  </div>
                </div>

                {/* Step 5: Hired & Onboarded */}
                <div className="p-4 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/40 hover:border-[#8C9A84] transition-all flex flex-col justify-between space-y-3 shadow-soft">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#2D3A31]">
                      <span>CHẶNG 5</span>
                      <span className="text-[#2D3A31] font-bold">12.2%</span>
                    </div>
                    <div className="text-sm font-serif font-bold text-[#2D3A31] mt-1">Tuyển Dụng Hoàn Tất</div>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D3A31] mt-2">
                      5 <span className="text-xs font-normal text-[#2D3A31]/60">nhân sự</span>
                    </div>
                    <p className="text-[11px] text-[#2D3A31]/80 mt-1">100% ứng viên chấp nhận thư mời làm việc.</p>
                  </div>
                  <div className="pt-2 border-t border-[#8C9A84]/30 text-[11px] font-semibold text-[#2D3A31]">
                    ✓ Hoàn tất chỉ tiêu nhân sự Q3
                  </div>
                </div>
              </div>

              {/* Synthia AI Funnel Optimization Insight Callout */}
              <div className="p-4 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#8C9A84] text-2xl shrink-0 mt-0.5">smart_toy</span>
                <div className="text-xs text-[#2D3A31] leading-relaxed">
                  <span className="font-bold">Nhận định từ Synthia AI Hiring Copilot:</span> Bộ lọc kỹ năng trọng số 70/30 đã giúp tiết kiệm <strong className="font-bold text-[#2D3A31]">168 giờ</strong> thẩm định hồ sơ thủ công cho đội ngũ HR. Tỷ lệ ứng viên phỏng vấn thành công tăng vọt từ mức trung bình ngành 18% lên <strong className="font-bold text-[#2D3A31]">45.5%</strong> nhờ sàng lọc kỹ năng cứng chuẩn xác ngay từ vòng đầu.
                </div>
              </div>
            </div>

            {/* Dual Grid: Weekly Recruitment Velocity Chart & Job Performance Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left (7 cols): Weekly Recruitment Velocity Chart */}
              <div className="lg:col-span-7 p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8C9A84] text-xl">bar_chart</span>
                    <h3 className="font-serif font-bold text-base text-[#2D3A31]">
                      Khối Lượng Ứng Tuyển &amp; Tỷ Lệ Match Cao Theo Ngày
                    </h3>
                  </div>
                  <span className="text-xs text-[#2D3A31]/60 font-medium">Tuần này (T2 - CN)</span>
                </div>

                {/* CSS/SVG Bar Chart visualization */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#2D3A31]/70">
                    <span>Số lượng hồ sơ tiếp nhận và phân loại</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#2D3A31]"></span> Hồ sơ nộp</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#8C9A84]"></span> AI Match ≥ 90%</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#C27B66]"></span> Phỏng vấn</span>
                    </div>
                  </div>

                  {/* Day-by-day bars */}
                  <div className="space-y-2.5 pt-2">
                    {[
                      { day: 'Thứ Hai', total: 6, match: 4, interview: 1 },
                      { day: 'Thứ Ba', total: 9, match: 6, interview: 2 },
                      { day: 'Thứ Tư (Đỉnh Tải)', total: 12, match: 8, interview: 3, isPeak: true },
                      { day: 'Thứ Năm', total: 7, match: 5, interview: 2 },
                      { day: 'Thứ Sáu', total: 5, match: 4, interview: 2 },
                      { day: 'Thứ Bảy', total: 2, match: 1, interview: 1 },
                    ].map(d => (
                      <div key={d.day} className="flex items-center gap-3 text-xs">
                        <span className={`w-32 shrink-0 ${d.isPeak ? 'text-[#2D3A31] font-bold' : 'text-[#2D3A31]/70'}`}>
                          {d.day}
                        </span>
                        <div className="flex-1 flex items-center gap-1.5 h-6 bg-[#F9F8F4] rounded-lg p-1 border border-[#E6E2DA]">
                          {/* Dark bar (Total) */}
                          <div
                            className="h-full bg-[#2D3A31] rounded flex items-center justify-end px-1.5 text-[10px] font-bold text-white shadow-sm"
                            style={{ width: `${(d.total / 12) * 55}%` }}
                            title={`Tổng nộp: ${d.total}`}
                          >
                            {d.total}
                          </div>
                          {/* Sage bar (Match >= 90%) */}
                          <div
                            className="h-full bg-[#8C9A84] rounded flex items-center justify-end px-1 text-[10px] font-bold text-white shadow-sm"
                            style={{ width: `${(d.match / 12) * 35}%` }}
                            title={`AI Match >= 90%: ${d.match}`}
                          >
                            {d.match}
                          </div>
                          {/* Terracotta bar (Interviews) */}
                          <div
                            className="h-full bg-[#C27B66] rounded flex items-center justify-end px-1 text-[10px] font-bold text-white shadow-sm"
                            style={{ width: `${(d.interview / 12) * 20}%` }}
                            title={`Phỏng vấn: ${d.interview}`}
                          >
                            {d.interview}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#E6E2DA] flex items-center justify-between text-[11px] text-[#2D3A31]/70">
                    <span>* Ghi chú: Thứ Tư là ngày có lượng ứng tuyển lập đỉnh (12 CV), tỷ lệ match 66.7%.</span>
                    <span className="text-[#2D3A31] font-medium">Phản hồi trung bình: 1.8 giờ</span>
                  </div>
                </div>
              </div>

              {/* Right (5 cols): Skill Gap & Market Talent Radar */}
              <div className="lg:col-span-5 p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8C9A84] text-xl">radar</span>
                    <h3 className="font-serif font-bold text-base text-[#2D3A31]">
                      Phân Bố Kỹ Năng &amp; Khoảng Cách Thị Trường
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#8C9A84]">AI Talent Gap</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Abundant Skills */}
                  <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-2">
                    <span className="text-[11px] font-semibold text-[#8C9A84] uppercase tracking-wider block">
                      ✓ Kỹ Năng Đáp Ứng Dồi Dào (Top Supply)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31] text-[11px] font-medium">
                        Java 21 (96%)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31] text-[11px] font-medium">
                        Spring Boot 3 (94%)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31] text-[11px] font-medium">
                        PostgreSQL (92%)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31] text-[11px] font-medium">
                        Docker (88%)
                      </span>
                    </div>
                  </div>

                  {/* Deficit / Rare Skills */}
                  <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-2">
                    <span className="text-[11px] font-semibold text-[#C27B66] uppercase tracking-wider block">
                      ⚠ Kỹ Năng Khan Hiếm Cần Sàng Lọc Sâu (Talent Deficit)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#C27B66]/15 border border-[#C27B66]/30 text-[#C27B66] text-[11px] font-medium">
                        Kafka 50k RPS Concurrency (58%)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#C27B66]/15 border border-[#C27B66]/30 text-[#C27B66] text-[11px] font-medium">
                        Kubernetes CKA (48%)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#C27B66]/15 border border-[#C27B66]/30 text-[#C27B66] text-[11px] font-medium">
                        Distributed Locking (62%)
                      </span>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="p-3.5 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/25 text-[#2D3A31] text-[11px] leading-relaxed">
                    <strong className="font-bold">Chiến lược tối ưu:</strong> Kỹ năng Kubernetes CKA thiếu hụt 52% trên thị trường tuyển dụng. Doanh nghiệp nên kích hoạt bài test kỹ thuật tự động trước khi phỏng vấn hoặc hỗ trợ đào tạo nội bộ trong 2 tháng đầu.
                  </div>
                </div>
              </div>
            </div>

            {/* Job Performance Matrix Table */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C9A84] text-xl">table_chart</span>
                  <h3 className="font-serif font-bold text-base text-[#2D3A31]">
                    Ma Trận Hiệu Quả Tuyển Dụng Theo Vị Trí (Job Fulfillment Matrix)
                  </h3>
                </div>
                <span className="text-xs text-[#2D3A31]/60 font-medium">3 Vị trí đang mở tuyển</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2DA] text-[#8C9A84] uppercase text-[11px] font-semibold">
                      <th className="pb-3">Vị Trí Tuyển Dụng</th>
                      <th className="pb-3 text-center">Ứng Viên</th>
                      <th className="pb-3 text-center">AI Match TB</th>
                      <th className="pb-3 text-center">Phỏng Vấn</th>
                      <th className="pb-3 text-center">Đã Offer</th>
                      <th className="pb-3">Tiến Độ Tuyển</th>
                      <th className="pb-3 text-center">Tình Trạng</th>
                      <th className="pb-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA]">
                    {jobs.map(j => (
                      <tr key={j.jobId} className="hover:bg-[#F9F8F4] transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-serif font-bold text-[#2D3A31] text-xs sm:text-sm">{j.title}</div>
                          <div className="text-[11px] text-[#2D3A31]/60 font-sans mt-0.5">{j.location} &bull; {j.salaryText}</div>
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#2D3A31]">{j.totalApplicants}</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                            {j.avgMatch}%
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#2D3A31]">{j.interviewCount}</td>
                        <td className="py-3.5 text-center font-bold text-[#8C9A84]">{j.offerCount}</td>
                        <td className="py-3.5 w-48">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-[#2D3A31]/70">{j.hiredCount}/{j.targetHires} nhân sự</span>
                            <span className="text-[#2D3A31] font-bold">{Math.round((j.hiredCount / j.targetHires) * 100)}%</span>
                          </div>
                          <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2D3A31] rounded-full"
                              style={{ width: `${(j.hiredCount / j.targetHires) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          {j.hiredCount >= j.targetHires ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#8C9A84]/20 text-[#2D3A31] border border-[#8C9A84]/30">
                              ĐẠT CHỈ TIÊU
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#C27B66]/15 text-[#C27B66] border border-[#C27B66]/30">
                              ĐANG TIẾN TRIỂN
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedJobId(j.jobId);
                              setActiveTab('PIPELINE');
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-[#2D3A31] hover:bg-[#232e27] text-white text-xs font-medium transition-all cursor-pointer shadow-soft"
                          >
                            Xem Phễu →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Row: Upcoming Live Interviews & AI Strategic Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Live Interviews Hub */}
              <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8C9A84] text-xl">event_available</span>
                    <h3 className="font-serif font-bold text-base text-[#2D3A31]">
                      Lịch Phỏng Vấn Sắp Diễn Ra (Live Interview Radar)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#8C9A84]">3 lịch trong 24h</span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      name: 'Lê Hoàng Nam',
                      role: 'Senior Backend Engineer',
                      match: 96,
                      time: '14:00 Hôm nay',
                      interviewer: 'Technical Director',
                      meetLink: 'https://meet.google.com/hm-9082-eval',
                    },
                    {
                      name: 'Trần Bảo Long',
                      role: 'Lead Distributed Systems',
                      match: 94,
                      time: '09:30 Ngày mai',
                      interviewer: 'VP of Engineering',
                      meetLink: 'https://meet.google.com/hm-9082-eval',
                    },
                    {
                      name: 'Phạm Tuấn Anh',
                      role: 'Principal AI Engineer',
                      match: 95,
                      time: '15:30 Ngày mai',
                      interviewer: 'AI Lab Director',
                      meetLink: 'https://meet.google.com/hm-9082-eval',
                    },
                  ].map((inv, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] hover:border-[#8C9A84] transition-all flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-[#2D3A31] text-xs sm:text-sm">{inv.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                            {inv.match}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-[#2D3A31]/70 font-sans">{inv.role} &bull; Hội đồng: {inv.interviewer}</p>
                        <p className="text-[10px] text-[#8C9A84] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span> {inv.time}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={inv.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-full bg-[#2D3A31] hover:bg-[#232e27] text-white text-xs font-medium transition-all flex items-center gap-1 shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">videocam</span>
                          <span>Vào Meet</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthia AI Strategic Recommendations */}
              <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C27B66] text-xl">psychology</span>
                    <h3 className="font-serif font-bold text-base text-[#2D3A31]">
                      Synthia AI Khuyến Nghị Chiến Lược Tuyển Dụng
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#C27B66]">3 Gợi ý</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#2D3A31]">
                      <span className="material-symbols-outlined text-[#8C9A84] text-base">timer</span>
                      <span>Duy trì tốc độ phản hồi hồ sơ dưới 4 giờ</span>
                    </div>
                    <p className="text-[#2D3A31]/70 text-[11px] leading-relaxed font-sans">
                      Dữ liệu lịch sử cho thấy ứng viên cấp Senior có xu hướng nhận offer từ đối thủ trong vòng 5 ngày. Phản hồi nhanh giúp tăng 42% tỷ lệ ứng viên đồng ý vào vòng phỏng vấn kỹ thuật.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#2D3A31]">
                      <span className="material-symbols-outlined text-[#C27B66] text-base">work_history</span>
                      <span>Chính sách Hybrid 2 ngày WFH thu hút nhân sự Senior</span>
                    </div>
                    <p className="text-[#2D3A31]/70 text-[11px] leading-relaxed font-sans">
                      Vị trí Lead Systems đạt 14 hồ sơ chất lượng cao chủ yếu nhờ điều kiện làm việc linh hoạt. Nên nhân rộng mô hình này sang các đợt mở tuyển Cloud DevOps tiếp theo.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#2D3A31]">
                      <span className="material-symbols-outlined text-[#8C9A84] text-base">task_alt</span>
                      <span>Sử dụng bài test chuẩn hóa Java Concurrency</span>
                    </div>
                    <p className="text-[#2D3A31]/70 text-[11px] leading-relaxed font-sans">
                      Sàng lọc kỹ năng Kafka &amp; Multithreading qua bài test tự động trước buổi phỏng vấn giúp rút ngắn 35% thời lượng buổi phỏng vấn trực tiếp của Tech Lead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CREATE & MANAGE JOBS                               */}
        {/* ========================================================= */}
        {activeTab === 'JOBS' && (
          <div className="w-full">
            <RecruiterJobManagementPage
              user={user}
              onNavigateToPipeline={(jobId) => {
                setSelectedJobId(jobId);
                setActiveTab('PIPELINE');
                window.location.hash = `#/recruiter-dashboard?tab=pipeline&jobId=${jobId}`;
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: APPLICANT PIPELINE / KANBAN BOARD                  */}
        {/* ========================================================= */}
        {activeTab === 'PIPELINE' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-xl text-[#2D3A31] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C9A84]">view_kanban</span>
                  Phễu Ứng Viên Kanban (Tự Động Xếp Hạng AI Match)
                </h2>
                <p className="text-xs text-[#2D3A31]/70 font-sans mt-0.5">
                  Ứng viên được AI tự động tính điểm theo công thức 70% bắt buộc + 30% ưu tiên, sắp xếp giảm dần.
                </p>
              </div>

              {/* Job Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#2D3A31]/70 font-medium">Chọn vị trí:</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(Number(e.target.value))}
                  className="py-2 px-3 bg-[#F9F8F4] rounded-xl text-xs text-[#2D3A31] border border-[#E6E2DA] focus:outline-none focus:border-[#2D3A31] cursor-pointer"
                >
                  {jobs.map(j => (
                    <option key={j.jobId} value={j.jobId} className="bg-white text-[#2D3A31]">
                      {j.title} ({j.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kanban Columns (4 Stages) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { stageId: 'APPLIED', title: '1. Hồ sơ mới (Applied)', color: 'text-[#2D3A31]' },
                { stageId: 'REVIEWING', title: '2. Đang duyệt (Reviewing)', color: 'text-[#8C9A84]' },
                { stageId: 'INTERVIEW', title: '3. Phỏng vấn (Interview)', color: 'text-[#C27B66]' },
                { stageId: 'OFFERED', title: '4. Đã Chốt / Offer', color: 'text-[#2D3A31]' },
              ].map(column => {
                const columnCandidates = jobCandidates.filter(c => c.stage === column.stageId);
                return (
                  <div key={column.stageId} className="bg-[#F9F8F4] rounded-[24px] p-4 border border-[#E6E2DA] space-y-3 min-h-[420px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA] mb-3">
                        <span className={`font-serif font-bold text-xs uppercase tracking-wider ${column.color}`}>
                          {column.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2D3A31] border border-[#E6E2DA] shadow-soft">
                          {columnCandidates.length}
                        </span>
                      </div>

                      {/* Candidate Cards */}
                      <div className="space-y-3">
                        {columnCandidates.map(candidate => (
                          <div
                            key={candidate.candidateId}
                            className="bg-white rounded-2xl p-4 border border-[#E6E2DA] hover:border-[#8C9A84] shadow-soft space-y-2.5 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-serif font-bold text-sm text-[#2D3A31]">{candidate.fullName}</h4>
                                <p className="text-[11px] text-[#2D3A31]/60 font-sans">{candidate.email}</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30 shrink-0">
                                {candidate.aiMatchScore}% Match
                              </span>
                            </div>

                            <p className="text-[11px] text-[#2D3A31]/70 font-sans line-clamp-2">
                              {candidate.notes}
                            </p>

                            <div className="pt-2 border-t border-[#E6E2DA] flex items-center justify-between text-xs">
                              <button
                                onClick={() => alert(`Đang tải file CV của ứng viên: ${candidate.fullName}`)}
                                className="text-[11px] text-[#8C9A84] hover:text-[#2D3A31] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                              >
                                <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                                Xem CV
                              </button>

                              {/* Stage Mover Selector */}
                              <select
                                value={candidate.stage}
                                onChange={(e) => handleMoveCandidateStage(candidate.candidateId, e.target.value)}
                                className="bg-[#F9F8F4] text-[11px] py-1 px-2 rounded-lg border border-[#E6E2DA] text-[#2D3A31] cursor-pointer focus:outline-none"
                              >
                                <option value="APPLIED">1. Applied</option>
                                <option value="REVIEWING">2. Reviewing</option>
                                <option value="INTERVIEW">3. Interview</option>
                                <option value="OFFERED">4. Offered</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {columnCandidates.length === 0 && (
                      <div className="text-center text-xs text-[#2D3A31]/50 py-12 font-sans">
                        Chưa có ứng viên ở chặng này.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COMPANY PROFILE MANAGEMENT                         */}
        {/* ========================================================= */}
        {activeTab === 'COMPANY' && (
          <div className="w-full">
            <RecruiterProfilePage user={user} onNavigate={(r) => { window.location.hash = r; }} />
          </div>
        )}
      </div>

      {/* MODAL 1: Đăng Tin Tuyển Dụng Chuẩn 70/30 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A31]/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-serif font-bold text-[#2D3A31] mb-1">
              Đăng Tin Tuyển Dụng Mới
            </h2>
            <p className="text-xs text-[#2D3A31]/70 mb-6 font-sans">
              Điền thông tin và nhập trọng số kỹ năng để AI tự động so khớp điểm % Match với hồ sơ ứng viên.
            </p>

            <form onSubmit={handleCreateJobSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2D3A31] uppercase mb-1">Tiêu đề vị trí tuyển dụng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Senior Cloud Backend Engineer"
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] focus:outline-none focus:border-[#2D3A31]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A31] uppercase mb-1">Mức lương dự kiến</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: $2,500 - $3,800/tháng"
                    value={newJobForm.salaryText}
                    onChange={(e) => setNewJobForm({ ...newJobForm, salaryText: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] focus:outline-none focus:border-[#2D3A31]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D3A31] uppercase mb-1">Địa điểm &amp; Hình thức</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TP.HCM • Hybrid"
                    value={newJobForm.location}
                    onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] focus:outline-none focus:border-[#2D3A31]"
                  />
                </div>
              </div>

              {/* 70% MANDATORY SKILLS INPUT */}
              <div className="p-4 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/30 space-y-1.5">
                <label className="block font-bold text-[#2D3A31] uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#8C9A84]">verified</span>
                  Kỹ Năng Bắt Buộc (Chiếm 70% Trọng Số AI Match) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Phân tách bằng dấu phẩy, ví dụ: Java 21, Spring Boot, PostgreSQL"
                  value={newJobForm.mandatorySkillsInput}
                  onChange={(e) => setNewJobForm({ ...newJobForm, mandatorySkillsInput: e.target.value })}
                  className="w-full bg-white border border-[#8C9A84]/40 rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#2D3A31] text-xs"
                />
                <p className="text-[10px] text-[#2D3A31]/70">Ứng viên phải đạt các kỹ năng này để vượt qua ngưỡng 70% điểm lọc.</p>
              </div>

              {/* 30% PREFERRED SKILLS INPUT */}
              <div className="p-4 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/30 space-y-1.5">
                <label className="block font-bold text-[#C27B66] uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  Kỹ Năng Ưu Tiên (Chiếm 30% Trọng Số AI Match)
                </label>
                <input
                  type="text"
                  placeholder="Phân tách bằng dấu phẩy, ví dụ: Kafka, Docker, Redis, AWS"
                  value={newJobForm.preferredSkillsInput}
                  onChange={(e) => setNewJobForm({ ...newJobForm, preferredSkillsInput: e.target.value })}
                  className="w-full bg-white border border-[#C27B66]/40 rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#2D3A31] text-xs"
                />
                <p className="text-[10px] text-[#2D3A31]/70">Kỹ năng cộng điểm giúp ứng viên đạt từ 80% - 98% Match.</p>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A31] uppercase mb-1">Mô tả công việc (JD)</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả trách nhiệm cốt lõi, công nghệ sử dụng..."
                  value={newJobForm.description}
                  onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] focus:outline-none focus:border-[#2D3A31]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#2D3A31] hover:bg-[#E6E2DA]/50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#2D3A31] hover:bg-[#232e27] shadow-soft transition-all cursor-pointer"
                >
                  Xuất Bản Tin Tuyển Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Xuất Báo Cáo Tuyển Dụng Chuyên Nghiệp (PDF / Excel / CSV) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A31]/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#8C9A84] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">download_for_offline</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D3A31]">Xuất Báo Cáo Hiệu Suất Tuyển Dụng</h3>
                <p className="text-xs text-[#2D3A31]/70">Tùy chọn định dạng tài liệu và phạm vi dữ liệu phân tích</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#2D3A31] uppercase mb-1.5">1. Chọn định dạng xuất file:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'PDF', label: 'PDF Document', icon: 'picture_as_pdf', desc: 'Báo cáo quản trị tổng kết' },
                    { id: 'EXCEL', label: 'Excel (XLSX)', icon: 'table_view', desc: 'Dữ liệu số liệu thô' },
                    { id: 'CSV', label: 'CSV Format', icon: 'dataset', desc: 'Dành cho BI / ATS khác' },
                  ].map(fmt => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setExportFormat(fmt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        exportFormat === fmt.id
                          ? 'bg-[#2D3A31] border-[#2D3A31] text-white shadow-soft'
                          : 'bg-[#F9F8F4] border-[#E6E2DA] text-[#2D3A31] hover:border-[#8C9A84]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg mb-1 block ${exportFormat === fmt.id ? 'text-white' : 'text-[#8C9A84]'}`}>
                        {fmt.icon}
                      </span>
                      <div className="font-bold text-xs">{fmt.label}</div>
                      <div className={`text-[10px] mt-0.5 ${exportFormat === fmt.id ? 'text-white/80' : 'text-[#2D3A31]/60'}`}>
                        {fmt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A31] uppercase mb-1.5">2. Nội dung bao gồm trong báo cáo:</label>
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Chỉ số 6 KPI Cốt lõi &amp; Đánh giá Sức khỏe Tuyển dụng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Sơ đồ Phễu chuyển đổi 5 chặng &amp; Tỷ lệ Drop-off</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Bảng điểm kỹ năng trọng số 70/30 theo từng vị trí</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Danh sách chi tiết ứng viên &amp; Nhận định từ Synthia AI</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/30 text-[#2D3A31] text-[11px] leading-relaxed">
                Tài liệu được mã hóa chuẩn hóa dấu mộc điện tử từ FPT Software &amp; HireMate AI Studio, sẵn sàng trình Ban Giám Đốc.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#2D3A31] hover:bg-[#E6E2DA]/50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#2D3A31] hover:bg-[#232e27] shadow-soft transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Tải Báo Cáo ({exportFormat})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
