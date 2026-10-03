import React, { useState, useEffect } from 'react';
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
  const getInitialTab = () => {
    if (currentRoute?.includes('tab=jobs')) return 'JOBS';
    if (currentRoute?.includes('tab=pipeline')) return 'PIPELINE';
    if (currentRoute?.includes('tab=company')) return 'COMPANY';
    if (currentRoute?.includes('tab=reports')) return 'OVERVIEW';
    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [jobs, setJobs] = useState(MOCK_RECRUITER_JOBS);
  const [candidates, setCandidates] = useState(INITIAL_KANBAN_CANDIDATES);
  const [selectedJobId, setSelectedJobId] = useState(101);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState('');

  const [reportTimeframe, setReportTimeframe] = useState('30_DAYS');
  const [reportJobFilter, setReportJobFilter] = useState('ALL');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [companyProfile] = useState({
    name: user?.companyName || 'FPT Software & Cloud Solutions',
    tagline: 'Tập đoàn công nghệ & dịch vụ chuyển đổi số toàn cầu',
    bio: 'FPT Software là tập đoàn công nghệ tiên phong tại Việt Nam, cung cấp giải pháp phần mềm, cloud và AI cho doanh nghiệp Fortune 500.',
    website: 'https://fptsoftware.com',
    headquarters: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh & Hà Nội',
    size: '30,000+ Kỹ sư & Chuyên gia',
  });

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
    } else if (currentRoute?.includes('tab=overview') || currentRoute?.includes('tab=reports')) {
      setActiveTab('OVERVIEW');
    }
  }, [currentRoute]);

  const handleRefreshReport = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setNotification('Đã đồng bộ hóa 100% dữ liệu báo cáo thời gian thực từ AI Engine!');
    }, 600);
  };

  const handleDownloadReport = () => {
    setShowExportModal(false);
    setNotification(`Đang xuất file Báo Cáo Tuyển Dụng (${exportFormat}) tự động tải về...`);
  };

  const handleCreateJobSubmit = (e) => {
    e.preventDefault();
    const mandatory = newJobForm.mandatorySkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const preferred = newJobForm.preferredSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);

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
    setNotification(`Đã tạo thành công tin tuyển dụng mới: ${createdJob.title}`);
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
    setCandidates((prev) =>
      prev.map((c) => (c.candidateId === candidateId ? { ...c, stage: nextStage } : c))
    );
    setNotification(`Đã cập nhật trạng thái ứng viên sang chặng: ${nextStage}`);
  };

  const jobCandidates = candidates
    .filter((c) => c.appliedJobId === selectedJobId)
    .sort((a, b) => b.aiMatchScore - a.aiMatchScore);

  const recruiterName = user?.fullName || 'Minh Anh';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1F2933] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Section */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#F58220]/20 flex items-center justify-center font-bold text-xl text-[#F58220]">
              {companyProfile.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-2xl sm:text-3xl text-[#1F2933]">
                Chào buổi sáng, {recruiterName}
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                Quản lý hoạt động tuyển dụng và theo dõi ứng viên bằng AI.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#F58220] hover:bg-[#E07216] text-white text-sm py-2.5 px-5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Đăng tin tuyển dụng</span>
            </button>

            <button
              onClick={() => setActiveTab('PIPELINE')}
              className="bg-white hover:bg-[#FAF9F6] text-[#1F2933] border border-[#E5E1D8] text-sm py-2.5 px-5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-lg text-[#F58220]">view_kanban</span>
              <span>Phễu Ứng Viên</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 text-[#047857] text-sm flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#10B981]">check_circle</span>
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')} className="text-base cursor-pointer text-[#047857] font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E1D8] pb-3 text-sm">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'OVERVIEW'
              ? 'bg-[#1F2933] text-white shadow-sm'
              : 'bg-white text-[#6B7280] hover:text-[#1F2933] border border-[#E5E1D8]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span>Tổng quan &amp; Báo cáo</span>
          </button>

          <button
            onClick={() => setActiveTab('JOBS')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'JOBS'
              ? 'bg-[#1F2933] text-white shadow-sm'
              : 'bg-white text-[#6B7280] hover:text-[#1F2933] border border-[#E5E1D8]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">work</span>
            <span>Tin tuyển dụng ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'PIPELINE'
              ? 'bg-[#1F2933] text-white shadow-sm'
              : 'bg-white text-[#6B7280] hover:text-[#1F2933] border border-[#E5E1D8]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            <span>Ứng viên Kanban ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPANY')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'COMPANY'
              ? 'bg-[#1F2933] text-white shadow-sm'
              : 'bg-white text-[#6B7280] hover:text-[#1F2933] border border-[#E5E1D8]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            <span>Hồ sơ công ty</span>
          </button>
        </div>

        {/* OVERVIEW / DASHBOARD TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* KPI 1: Tin tuyển dụng đang mở */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <span>Tin tuyển dụng đang mở</span>
                  <span className="material-symbols-outlined text-[#F58220] text-xl">work</span>
                </div>
                <div className="text-3xl font-bold text-[#1F2933]">
                  {jobs.filter((j) => j.status === 'ACTIVE').length} <span className="text-sm font-normal text-[#6B7280]">tin</span>
                </div>
                <p className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  <span>+1 tin mới trong tuần</span>
                </p>
              </div>

              {/* KPI 2: Tổng hồ sơ ứng tuyển */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <span>Tổng hồ sơ ứng tuyển</span>
                  <span className="material-symbols-outlined text-[#F58220] text-xl">folder_shared</span>
                </div>
                <div className="text-3xl font-bold text-[#1F2933]">
                  41 <span className="text-sm font-normal text-[#6B7280]">hồ sơ</span>
                </div>
                <p className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  <span>+18.4% so với tháng trước</span>
                </p>
              </div>

              {/* KPI 3: Ứng viên AI Match cao */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <span>Ứng viên AI Match cao</span>
                  <span className="material-symbols-outlined text-[#F58220] text-xl">auto_awesome</span>
                </div>
                <div className="text-3xl font-bold text-[#1F2933]">
                  18 <span className="text-sm font-normal text-[#6B7280]">hồ sơ (&ge;90%)</span>
                </div>
              </div>

              {/* KPI 4: Tốc độ tuyển dụng */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <span>Tốc độ tuyển dụng</span>
                  <span className="material-symbols-outlined text-[#F58220] text-xl">speed</span>
                </div>
                <div className="text-3xl font-bold text-[#1F2933]">
                  12.5 <span className="text-sm font-normal text-[#6B7280]">ngày/vị trí</span>
                </div>
                <p className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">bolt</span>
                  <span>Nhanh hơn 4.2 ngày (-25%)</span>
                </p>
              </div>
            </div>

            {/* Performance Overview & Control Bar */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1F2933] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F58220]">query_stats</span>
                  Báo cáo &amp; Phân tích tuyển dụng AI
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Tỉ lệ chuyển đổi phễu, phân bổ kỹ năng 70/30 và tiến độ tuyển dụng thời gian thực.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] p-1 text-xs">
                  {[
                    { id: '7_DAYS', label: '7 Ngày' },
                    { id: '30_DAYS', label: '30 Ngày' },
                    { id: 'QUARTER_3', label: 'Quý III' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setReportTimeframe(t.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${reportTimeframe === t.id
                        ? 'bg-[#1F2933] text-white shadow-sm'
                        : 'text-[#6B7280] hover:text-[#1F2933]'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRefreshReport}
                  className="p-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#E5E1D8]/50 border border-[#E5E1D8] text-[#1F2933] transition-all cursor-pointer flex items-center justify-center"
                  title="Làm mới dữ liệu AI"
                >
                  <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin text-[#F58220]' : ''}`}>
                    sync
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#1F2933] hover:bg-[#323D47] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Xuất báo cáo</span>
                </button>
              </div>
            </div>

            {/* Recruitment Funnel Section */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E1D8]">
                <div>
                  <h3 className="font-bold text-base text-[#1F2933] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F58220]">filter_alt</span>
                    Phễu Tuyển Dụng &amp; Tỷ Lệ Chuyển Đổi
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Đối chiếu tỷ lệ lọt qua từng chặng tuyển dụng và tự động phân loại bởi AI.
                  </p>
                </div>
              </div>

              {/* 5 Funnel Stages */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Stage 1 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-2">
                  <div className="text-xs font-semibold text-[#6B7280]">CHẶNG 1</div>
                  <div className="text-sm font-bold text-[#1F2933]">Hồ Sơ Nộp Mới</div>
                  <div className="text-2xl font-bold text-[#1F2933]">41 CV</div>
                  <p className="text-[11px] text-[#6B7280]">100% tổng ứng viên</p>
                </div>

                {/* Stage 2 */}
                <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#F58220]/30 space-y-2">
                  <div className="text-xs font-semibold text-[#F58220]">CHẶNG 2</div>
                  <div className="text-sm font-bold text-[#1F2933]">Sàng Lọc AI 70/30</div>
                  <div className="text-2xl font-bold text-[#F58220]">22 Đạt</div>
                  <p className="text-[11px] text-[#6B7280]">Tỷ lệ đạt: 53.7%</p>
                </div>

                {/* Stage 3 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-2">
                  <div className="text-xs font-semibold text-[#6B7280]">CHẶNG 3</div>
                  <div className="text-sm font-bold text-[#1F2933]">Phỏng Vấn Kỹ Thuật</div>
                  <div className="text-2xl font-bold text-[#1F2933]">11 Ứng viên</div>
                  <p className="text-[11px] text-[#6B7280]">Tỷ lệ lọt: 26.8%</p>
                </div>

                {/* Stage 4 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-2">
                  <div className="text-xs font-semibold text-[#6B7280]">CHẶNG 4</div>
                  <div className="text-sm font-bold text-[#1F2933]">Thư Mời (Offer)</div>
                  <div className="text-2xl font-bold text-[#1F2933]">6 Gói offer</div>
                  <p className="text-[11px] text-[#6B7280]">Tỷ lệ offer: 14.6%</p>
                </div>

                {/* Stage 5 */}
                <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 space-y-2">
                  <div className="text-xs font-semibold text-[#10B981]">CHẶNG 5</div>
                  <div className="text-sm font-bold text-[#1F2933]">Hoàn Tất Tuyển</div>
                  <div className="text-2xl font-bold text-[#10B981]">5 Nhân sự</div>
                  <p className="text-[11px] text-[#047857]">100% Chấp nhận offer</p>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F58220]">table_chart</span>
                  <h3 className="font-bold text-base text-[#1F2933]">
                    Hiệu Quả Tuyển Dụng Theo Vị Trí
                  </h3>
                </div>
                <span className="text-xs text-[#6B7280] font-medium">{jobs.length} Vị trí đang tuyển</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E1D8] text-[#6B7280] uppercase text-[11px] font-semibold">
                      <th className="pb-3">Vị Trí Tuyển Dụng</th>
                      <th className="pb-3 text-center">Ứng Viên</th>
                      <th className="pb-3 text-center">AI Match TB</th>
                      <th className="pb-3 text-center">Phỏng Vấn</th>
                      <th className="pb-3 text-center">Đã Offer</th>
                      <th className="pb-3">Tiến Độ Tuyển</th>
                      <th className="pb-3 text-center">Trạng Thái</th>
                      <th className="pb-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    {jobs.map((j) => (
                      <tr key={j.jobId} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-[#1F2933] text-xs sm:text-sm">{j.title}</div>
                          <div className="text-[11px] text-[#6B7280] mt-0.5">{j.location} &bull; {j.salaryText}</div>
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#1F2933]">{j.totalApplicants}</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                            {j.avgMatch}%
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#1F2933]">{j.interviewCount}</td>
                        <td className="py-3.5 text-center font-bold text-[#10B981]">{j.offerCount}</td>
                        <td className="py-3.5 w-48">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-[#6B7280]">{j.hiredCount}/{j.targetHires} nhân sự</span>
                            <span className="text-[#1F2933] font-bold">{Math.round((j.hiredCount / j.targetHires) * 100)}%</span>
                          </div>
                          <div className="w-full bg-[#E5E1D8] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#F58220] rounded-full"
                              style={{ width: `${(j.hiredCount / j.targetHires) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          {j.hiredCount >= j.targetHires ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30">
                              Đạt chỉ tiêu
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                              Đang tuyển
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedJobId(j.jobId);
                              setActiveTab('PIPELINE');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#1F2933] hover:bg-[#323D47] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
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

            {/* Upcoming Interviews & AI Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Live Interviews */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F58220]">event_available</span>
                    <h3 className="font-bold text-base text-[#1F2933]">
                      Lịch Phỏng Vấn Sắp Diễn Ra
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#6B7280]">3 lịch trong 24h</span>
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
                    <div key={idx} className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F2933] text-xs sm:text-sm">{inv.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                            {inv.match}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280]">{inv.role} &bull; Hội đồng: {inv.interviewer}</p>
                        <p className="text-[10px] text-[#F58220] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span> {inv.time}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={inv.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#F58220] hover:bg-[#E07216] text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-sm">videocam</span>
                          <span>Vào Meet</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Strategic Recommendations */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F58220]">psychology</span>
                    <h3 className="font-bold text-base text-[#1F2933]">
                      AI Khuyến Nghị Chiến Lược Tuyển Dụng
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#F58220]">3 Gợi ý</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#1F2933]">
                      <span className="material-symbols-outlined text-[#F58220] text-base">timer</span>
                      <span>Duy trì tốc độ phản hồi hồ sơ dưới 4 giờ</span>
                    </div>
                    <p className="text-[#6B7280] text-[11px] leading-relaxed">
                      Phản hồi nhanh giúp tăng 42% tỷ lệ ứng viên Senior chấp nhận tham gia phỏng vấn kỹ thuật.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#1F2933]">
                      <span className="material-symbols-outlined text-[#F58220] text-base">work_history</span>
                      <span>Chính sách Hybrid 2 ngày WFH thu hút nhân sự Senior</span>
                    </div>
                    <p className="text-[#6B7280] text-[11px] leading-relaxed">
                      Vị trí Lead Systems đạt 14 hồ sơ chất lượng cao chủ yếu nhờ chế độ làm việc linh hoạt.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#1F2933]">
                      <span className="material-symbols-outlined text-[#10B981] text-base">task_alt</span>
                      <span>Sử dụng bài test chuẩn hóa kỹ năng bắt buộc</span>
                    </div>
                    <p className="text-[#6B7280] text-[11px] leading-relaxed">
                      Sàng lọc kỹ năng qua bài test tự động giúp rút ngắn 35% thời lượng phỏng vấn trực tiếp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOBS MANAGEMENT */}
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

        {/* TAB 3: KANBAN BOARD */}
        {activeTab === 'PIPELINE' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-xl text-[#1F2933] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F58220]">view_kanban</span>
                  Phễu Ứng Viên Kanban (Tự Động Xếp Hạng AI Match)
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Ứng viên được AI xếp hạng theo công thức 70% bắt buộc + 30% ưu tiên, sắp xếp giảm dần.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B7280] font-medium">Chọn vị trí:</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(Number(e.target.value))}
                  className="py-2 px-3 bg-[#FAF9F6] rounded-xl text-xs text-[#1F2933] border border-[#E5E1D8] focus:outline-none focus:border-[#F58220] cursor-pointer font-medium"
                >
                  {jobs.map((j) => (
                    <option key={j.jobId} value={j.jobId} className="bg-white text-[#1F2933]">
                      {j.title} ({j.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { stageId: 'APPLIED', title: '1. Hồ sơ mới (Applied)', color: 'text-[#1F2933]' },
                { stageId: 'REVIEWING', title: '2. Đang duyệt (Reviewing)', color: 'text-[#F58220]' },
                { stageId: 'INTERVIEW', title: '3. Phỏng vấn (Interview)', color: 'text-[#F58220]' },
                { stageId: 'OFFERED', title: '4. Đã Chốt / Offer', color: 'text-[#10B981]' },
              ].map((column) => {
                const columnCandidates = jobCandidates.filter((c) => c.stage === column.stageId);
                return (
                  <div key={column.stageId} className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E5E1D8] space-y-3 min-h-[420px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8] mb-3">
                        <span className={`font-bold text-xs uppercase tracking-wider ${column.color}`}>
                          {column.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#1F2933] border border-[#E5E1D8]">
                          {columnCandidates.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {columnCandidates.map((candidate) => (
                          <div
                            key={candidate.candidateId}
                            className="bg-white rounded-xl p-4 border border-[#E5E1D8] hover:border-[#F58220] shadow-sm space-y-2.5 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-[#1F2933]">{candidate.fullName}</h4>
                                <p className="text-[11px] text-[#6B7280]">{candidate.email}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30 shrink-0">
                                {candidate.aiMatchScore}% Match
                              </span>
                            </div>

                            <p className="text-[11px] text-[#6B7280] line-clamp-2">
                              {candidate.notes}
                            </p>

                            <div className="pt-2 border-t border-[#E5E1D8] flex items-center justify-between text-xs">
                              <button
                                onClick={() => alert(`Xem CV của ứng viên: ${candidate.fullName}`)}
                                className="text-[11px] text-[#F58220] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                              >
                                <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                                Xem CV
                              </button>

                              <select
                                value={candidate.stage}
                                onChange={(e) => handleMoveCandidateStage(candidate.candidateId, e.target.value)}
                                className="bg-[#FAF9F6] text-[11px] py-1 px-2 rounded-lg border border-[#E5E1D8] text-[#1F2933] cursor-pointer focus:outline-none"
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
                      <div className="text-center text-xs text-[#6B7280] py-12">
                        Chưa có ứng viên ở chặng này.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY PROFILE */}
        {activeTab === 'COMPANY' && (
          <div className="w-full">
            <RecruiterProfilePage user={user} onNavigate={(r) => { window.location.hash = r; }} />
          </div>
        )}
      </div>

      {/* CREATE JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#E5E1D8] text-[#1F2933] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-bold text-[#1F2933] mb-1">
              Đăng Tin Tuyển Dụng Mới
            </h2>
            <p className="text-xs text-[#6B7280] mb-6">
              Nhập yêu cầu công việc để AI so khớp điểm % Match với ứng viên.
            </p>

            <form onSubmit={handleCreateJobSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Tiêu đề vị trí tuyển dụng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Senior Backend Engineer"
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1F2933] uppercase mb-1">Mức lương dự kiến</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: $2,500 - $3,800/tháng"
                    value={newJobForm.salaryText}
                    onChange={(e) => setNewJobForm({ ...newJobForm, salaryText: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1F2933] uppercase mb-1">Địa điểm &amp; Hình thức</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TP.HCM • Hybrid"
                    value={newJobForm.location}
                    onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                  />
                </div>
              </div>

              {/* 70% MANDATORY SKILLS */}
              <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#F58220]/30 space-y-1.5">
                <label className="block font-bold text-[#F58220] uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Kỹ Năng Bắt Buộc (70% Trọng Số AI Match) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Phân tách bằng dấu phẩy: Java 21, Spring Boot, PostgreSQL"
                  value={newJobForm.mandatorySkillsInput}
                  onChange={(e) => setNewJobForm({ ...newJobForm, mandatorySkillsInput: e.target.value })}
                  className="w-full bg-white border border-[#F58220]/40 rounded-xl p-2.5 text-[#1F2933] focus:outline-none focus:border-[#F58220] text-xs"
                />
              </div>

              {/* 30% PREFERRED SKILLS */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1.5">
                <label className="block font-bold text-[#1F2933] uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#F58220]">star</span>
                  Kỹ Năng Ưu Tiên (30% Trọng Số AI Match)
                </label>
                <input
                  type="text"
                  placeholder="Phân tách bằng dấu phẩy: Kafka, Docker, Redis, AWS"
                  value={newJobForm.preferredSkillsInput}
                  onChange={(e) => setNewJobForm({ ...newJobForm, preferredSkillsInput: e.target.value })}
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 text-[#1F2933] focus:outline-none focus:border-[#F58220] text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Mô tả công việc (JD)</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả công việc..."
                  value={newJobForm.description}
                  onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F2933] hover:bg-[#E5E1D8]/50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#F58220] hover:bg-[#E07216] shadow-sm transition-all cursor-pointer"
                >
                  Đăng tin ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT REPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#E5E1D8] text-[#1F2933] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F58220]/30 text-[#F58220] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">download</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1F2933]">Xuất Báo Cáo Tuyển Dụng</h3>
                <p className="text-xs text-[#6B7280]">Chọn định dạng xuất file báo cáo phân tích</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <label className="block font-bold text-[#1F2933] uppercase">Định dạng file:</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'PDF', label: 'PDF Document', icon: 'picture_as_pdf' },
                  { id: 'EXCEL', label: 'Excel (XLSX)', icon: 'table_view' },
                  { id: 'CSV', label: 'CSV Format', icon: 'dataset' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setExportFormat(fmt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${exportFormat === fmt.id
                      ? 'bg-[#1F2933] border-[#1F2933] text-white shadow-sm'
                      : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#1F2933] hover:border-[#F58220]'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-lg mb-1 block ${exportFormat === fmt.id ? 'text-[#F58220]' : 'text-[#6B7280]'}`}>
                      {fmt.icon}
                    </span>
                    <div className="font-bold text-xs">{fmt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E1D8]">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F2933] hover:bg-[#E5E1D8]/50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#F58220] hover:bg-[#E07216] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
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
