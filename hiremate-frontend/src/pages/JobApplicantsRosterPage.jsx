import React, { useState, useMemo } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';

// Job lookup map by ID
const JOB_MAP = {
  101: {
    id: 101,
    title: 'Senior Backend Engineer',
    subtitle: '(Java / Distributed Systems)',
    code: 'JD-BNK-882',
    statusBadge: 'Đang Tuyển Gấp',
    totalApplicants: 24,
    newToday: 6,
    topGoldCount: 2,
    avgScore: '74.5%',
    screenedProgress: '15/24',
    screenedPercent: '62.5%',
  },
  102: {
    id: 102,
    title: 'Frontend Lead Architect',
    subtitle: '(React / Next.js / TypeScript)',
    code: 'JD-WEB-641',
    statusBadge: 'Đang Tuyển',
    totalApplicants: 18,
    newToday: 3,
    topGoldCount: 4,
    avgScore: '81.2%',
    screenedProgress: '10/18',
    screenedPercent: '55.5%',
  },
  103: {
    id: 103,
    title: 'DevOps & Platform Engineer',
    subtitle: '(AWS / Kubernetes / ArgoCD)',
    code: 'JD-OPS-330',
    statusBadge: 'Đang Tuyển',
    totalApplicants: 15,
    newToday: 2,
    topGoldCount: 3,
    avgScore: '77.8%',
    screenedProgress: '9/15',
    screenedPercent: '60.0%',
  },
  104: {
    id: 104,
    title: 'Lead AI & LLM Solution Architect',
    subtitle: '(GenAI Core)',
    code: 'JD-AI-109',
    statusBadge: 'Hot ⚡',
    totalApplicants: 9,
    newToday: 4,
    topGoldCount: 6,
    avgScore: '88.3%',
    screenedProgress: '6/9',
    screenedPercent: '66.7%',
  },
};

export default function JobApplicantsRosterPage({ user, jobId = 101, onBackToJobs }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  // Job context details - resolved dynamically from jobId prop
  const jobDetails = JOB_MAP[jobId] || JOB_MAP[101];

  // Filter & Search states
  // 'ALL' | 'NEW' | 'REVIEWING' | 'INTERVIEW' | 'PASSED' | 'REJECTED'
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSortDescending, setIsAiSortDescending] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Preview Candidate Modal
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState(null);

  // Candidate Data matching user's HTML specification
  const [candidates, setCandidates] = useState([
    {
      id: 1,
      rank: 1,
      name: 'Trần Bảo Long',
      verified: true,
      role: 'Senior Backend Dev • FPT Software Alumni',
      experience: '6 năm KN',
      appliedTime: 'Nộp 25/09 14:30',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      matchScore: 94,
      matchCategory: 'Tối Ưu Tuyệt Đối',
      techChips: [
        { name: 'Java 21: 100%', highlight: false },
        { name: 'Spring Boot 3: 100%', highlight: false },
        { name: 'Kafka High-Load: 92%', highlight: true },
        { name: 'PostgreSQL: 95%', highlight: false },
      ],
      aiQuote: 'Hồ sơ kỹ thuật xuất sắc, khớp 100% kỹ năng bắt buộc và chứng minh năng lực chịu tải 50k RPS trên hệ thống ngân hàng.',
      stage: 'INTERVIEW',
      statusLabel: 'Duyệt Phỏng Vấn',
      isLowerScore: false,
    },
    {
      id: 2,
      rank: 2,
      name: 'Lê Hoàng Nam',
      verified: true,
      role: 'Lead Backend Engineer • VNG Corp',
      experience: '7.5 năm KN',
      appliedTime: 'Nộp 25/09 09:15',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      matchScore: 89,
      matchCategory: 'Đề Xuất Cao Cấp',
      techChips: [
        { name: 'Java Core: 95%', highlight: false },
        { name: 'Microservices: 90%', highlight: false },
        { name: 'AWS Arch: 85%', highlight: true },
        { name: 'Kafka: 80%', highlight: false },
      ],
      aiQuote: 'Kinh nghiệm Lead dày dặn tại VNG, kiến trúc Microservices vững chắc, bổ sung giá trị cao cho vị trí Tech Lead.',
      stage: 'REVIEWING',
      statusLabel: 'Đang Xem Xét',
      isLowerScore: false,
    },
    {
      id: 3,
      rank: 3,
      name: 'Nguyễn Quốc Huy',
      verified: false,
      initials: 'QH',
      role: 'Senior Java Dev • TMA Solutions',
      experience: '5 năm KN',
      appliedTime: 'Nộp 24/09 18:40',
      matchScore: 78,
      matchCategory: 'Phù Hợp Tiêu Chuẩn',
      techChips: [
        { name: 'Java 17: 85%', highlight: false },
        { name: 'Spring Boot: 88%', highlight: false },
        { name: 'Docker: 75%', highlight: false },
        { name: 'Thiếu Kafka Cluster', highlight: 'error' },
      ],
      aiQuote: 'Đáp ứng tốt các yêu cầu bắt buộc, cần đánh giá thêm năng lực triển khai Kafka và hệ thống phân tán phức tạp.',
      stage: 'NEW',
      statusLabel: 'Mới Nhận',
      isLowerScore: false,
    },
    {
      id: 4,
      rank: 4,
      name: 'Đỗ Minh Tuấn',
      verified: false,
      initials: 'MT',
      role: 'Java Backend Developer • CMC Global',
      experience: '3.5 năm KN',
      appliedTime: 'Nộp 23/09 11:20',
      matchScore: 65,
      matchCategory: 'Tiềm Năng Mid-Level',
      techChips: [
        { name: 'Java Core: 80%', highlight: false },
        { name: 'Spring Boot: 70%', highlight: false },
        { name: 'MySQL: 75%', highlight: false },
      ],
      aiQuote: 'Hồ sơ thiên về Mid-level, có nền tảng cơ bản tốt nhưng còn thiếu kinh nghiệm kiến trúc hệ thống quy mô lớn.',
      stage: 'REVIEWING',
      statusLabel: 'Đang Xem Xét',
      isLowerScore: false,
    },
    {
      id: 5,
      rank: null,
      name: 'Phạm Thành Đạt',
      verified: false,
      initials: 'TĐ',
      role: 'Junior Backend Dev',
      experience: '1.5 năm KN',
      appliedTime: 'Nộp 22/09',
      matchScore: 45,
      matchCategory: 'Dưới Chuẩn Senior',
      techChips: [
        { name: 'Java Cơ bản', highlight: false },
        { name: 'Thiếu Microservices', highlight: 'error' },
      ],
      aiQuote: 'Thiếu kinh nghiệm kiến trúc hệ thống lớn, phù hợp hơn với level Middle/Junior.',
      stage: 'REJECTED',
      statusLabel: 'Từ chối đề xuất',
      isLowerScore: true,
    },
    {
      id: 6,
      rank: null,
      name: 'Vũ Đức Anh',
      verified: false,
      initials: 'ĐA',
      role: 'Fullstack Dev',
      experience: '3 năm KN',
      appliedTime: 'Nộp 21/09',
      matchScore: 38,
      matchCategory: 'Sai Lệch Tech Stack',
      techChips: [
        { name: 'NodeJS / PHP', highlight: false },
        { name: 'Không có Java', highlight: 'error' },
      ],
      aiQuote: 'Hồ sơ chủ yếu lập trình PHP/NodeJS, không có kinh nghiệm Java Spring Boot theo yêu cầu bắt buộc.',
      stage: 'REJECTED',
      statusLabel: 'Từ Chối',
      isLowerScore: true,
    },
  ]);

  // Stage options for dropdown
  const STAGE_OPTIONS = [
    { label: 'Duyệt Phỏng Vấn', stage: 'INTERVIEW' },
    { label: 'Đang Xem Xét', stage: 'REVIEWING' },
    { label: 'Mới Nhận', stage: 'NEW' },
    { label: 'Đạt Yêu Cầu', stage: 'PASSED' },
    { label: 'Từ chối đề xuất', stage: 'REJECTED' },
    { label: 'Từ Chối', stage: 'REJECTED' },
  ];

  const handleStageChange = (candidateId, newLabel) => {
    const matchedOption = STAGE_OPTIONS.find((opt) => opt.label === newLabel) || {
      stage: 'REVIEWING',
    };
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, statusLabel: newLabel, stage: matchedOption.stage }
          : c
      )
    );
    triggerToast(`Đã chuyển trạng thái ứng viên sang: "${newLabel}"`);
  };

  // Filter & sort logic
  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    // Filter by tab
    if (activeFilter === 'NEW') list = list.filter((c) => c.stage === 'NEW');
    if (activeFilter === 'REVIEWING') list = list.filter((c) => c.stage === 'REVIEWING');
    if (activeFilter === 'INTERVIEW') list = list.filter((c) => c.stage === 'INTERVIEW');
    if (activeFilter === 'PASSED') list = list.filter((c) => c.stage === 'PASSED');
    if (activeFilter === 'REJECTED') list = list.filter((c) => c.stage === 'REJECTED');

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.techChips.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    // Sort by AI Match score
    list.sort((a, b) =>
      isAiSortDescending ? b.matchScore - a.matchScore : a.matchScore - b.matchScore
    );

    return list;
  }, [candidates, activeFilter, searchQuery, isAiSortDescending]);

  // Pagination calculation
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCandidates = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredCandidates.slice(start, start + PAGE_SIZE);
  }, [filteredCandidates, validCurrentPage]);

  return (
    <div className="w-full bg-transparent font-body text-[#2D3A31] antialiased min-h-screen pb-16 selection:bg-[#8C9A84] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D3A31] text-white border border-[#E6E2DA] text-xs font-medium px-5 py-3 rounded-2xl shadow-soft-xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in">
          <span className="material-symbols-outlined text-[#8C9A84] text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ambient Botanical Glows */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#8C9A84]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-[#C27B66]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Main Workspace Container */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 relative z-10">
          
          {/* ======================================================== */}
          {/* NAVIGATION & ACTION HEADER                               */}
          {/* ======================================================== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-[#2D3A31]/60 tracking-wider uppercase flex-wrap">
                <a
                  href="#/recruiter-jobs"
                  className="hover:text-[#2D3A31] transition-colors cursor-pointer"
                >
                  Quản Lý Tin Tuyển Dụng
                </a>
                <span>/</span>
                <a
                  href={`#/jobs/${jobDetails.id}`}
                  className="hover:text-[#2D3A31] transition-colors cursor-pointer text-[#2D3A31] font-medium"
                  title="Xem chi tiết bài đăng đã xuất bản"
                >
                  {jobDetails.title}
                </a>
                <span>/</span>
                <span className="text-[#8C9A84] font-semibold">Danh sách ứng viên ({jobDetails.totalApplicants} hồ sơ)</span>
              </div>

              {/* Job Title Context */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
                  {jobDetails.title} <span className="text-[#C27B66] font-normal text-xl font-body">{jobDetails.subtitle}</span>
                </h1>
                <span className="px-3 py-0.5 bg-[#8C9A84]/15 text-[#2D3A31] text-xs font-medium rounded-full border border-[#8C9A84]/30">
                  {jobDetails.statusBadge}
                </span>
                <span className="text-xs font-mono text-[#2D3A31]/60">Mã: {jobDetails.code}</span>
              </div>
            </div>

            {/* Back & View Job Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href={`#/jobs/${jobDetails.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F9F8F4] text-xs font-semibold text-[#2D3A31] border border-[#E6E2DA] transition-all cursor-pointer shadow-soft"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">visibility</span>
                <span>Xem bài đăng JD</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  if (onBackToJobs) onBackToJobs();
                  else window.location.hash = '#/recruiter-jobs';
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F9F8F4] text-xs font-semibold text-[#2D3A31] hover:text-[#C27B66] transition-all border border-[#E6E2DA] cursor-pointer shadow-soft"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>DS Tin Đăng</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KPI METRICS STRIP (4 CARDS)                              */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 flex items-center justify-center text-[#2D3A31] shrink-0">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Tổng hồ sơ</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#2D3A31]">{jobDetails.totalApplicants}</span>
                  <span className="text-[11px] text-[#8C9A84] font-semibold">+{jobDetails.newToday} hôm nay</span>
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#C27B66]/15 border border-[#C27B66]/30 flex items-center justify-center text-[#C27B66] shrink-0">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Đề cử cao cấp (&gt;90%)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#C27B66]">{jobDetails.topGoldCount < 10 ? `0${jobDetails.topGoldCount}` : jobDetails.topGoldCount}</span>
                  <span className="text-[11px] text-[#2D3A31]/60">Ứng viên vàng</span>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 flex items-center justify-center text-[#2D3A31] shrink-0">
                <span className="material-symbols-outlined text-[22px]">query_stats</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Match Score TB</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#2D3A31]">{jobDetails.avgScore}</span>
                  <span className="text-[11px] text-[#8C9A84] font-medium">JVM Benchmark</span>
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#2D3A31]/10 border border-[#2D3A31]/20 flex items-center justify-center text-[#2D3A31] shrink-0">
                <span className="material-symbols-outlined text-[22px]">task_alt</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Tiến độ sàng lọc</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#2D3A31]">
                    15<span className="text-sm font-normal text-[#2D3A31]/50">/24</span>
                  </span>
                  <span className="text-[11px] text-[#8C9A84] font-bold">{jobDetails.screenedPercent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* AI RANKING LEADERBOARD — TOP ỨNG VIÊN ĐƯỢC ĐỀ CỬ         */}
          {/* ======================================================== */}
          <div className="bg-white rounded-[28px] border border-[#E6E2DA] shadow-soft overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6E2DA] bg-[#F9F8F4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 flex items-center justify-center text-[#2D3A31]">
                  <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-[#2D3A31] flex items-center gap-2">
                    Bảng Xếp Hạng AI — Top Ứng Viên Được Đề Cử
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                      Chuẩn 70/30
                    </span>
                  </h2>
                  <p className="text-xs text-[#2D3A31]/60 mt-0.5">
                    Xếp hạng tự động theo công thức: 70% Kỹ năng bắt buộc + 30% Kỹ năng ưu tiên
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#8C9A84] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse" />
                Đồng bộ realtime
              </span>
            </div>

            {/* Rank Rows */}
            <div className="divide-y divide-[#E6E2DA]">
              {[...candidates]
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 5)
                .map((cand, idx) => {
                  const rankLabel = ['🥇', '🥈', '🥉', '#4', '#5'][idx];
                  return (
                    <div key={cand.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F9F8F4] transition-colors relative group">
                      {/* Rank Medal */}
                      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA]">
                        {rankLabel}
                      </div>

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {cand.avatar ? (
                          <img className="w-11 h-11 rounded-2xl object-cover ring-1 ring-[#E6E2DA] shadow-soft" src={cand.avatar} alt={cand.name} />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-[#8C9A84]/15 flex items-center justify-center font-serif font-bold text-sm text-[#2D3A31]">
                            {cand.initials}
                          </div>
                        )}
                        {cand.verified && (
                          <span className="absolute -top-1 -right-1 material-symbols-outlined text-[13px] text-[#8C9A84] bg-white rounded-full">verified</span>
                        )}
                      </div>

                      {/* Identity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[#2D3A31] truncate group-hover:text-[#C27B66] transition-colors">
                            {cand.name}
                          </span>
                          <span className="text-xs font-bold text-[#C27B66]">
                            {cand.matchScore}%
                          </span>
                        </div>
                        <div className="text-xs text-[#2D3A31]/70 truncate">{cand.role}</div>
                        {/* Score bar */}
                        <div className="mt-1.5 h-1.5 w-full bg-[#F2F0EB] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-[#8C9A84]"
                            style={{ width: `${cand.matchScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Match Category + Quick action */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:block text-xs font-medium px-3 py-0.5 rounded-full border bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30">
                          {cand.matchCategory}
                        </span>
                        <button
                          type="button"
                          onClick={() => { window.location.hash = `#/candidate-evaluation?candidateId=${cand.id}&jobId=${jobDetails.id}`; }}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#F9F8F4] text-[#2D3A31] border border-[#E6E2DA] hover:border-[#8C9A84] transition-all cursor-pointer flex items-center gap-1.5 shadow-soft"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#8C9A84]">person_search</span>
                          <span>Xem hồ sơ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#E6E2DA] bg-[#F9F8F4] flex items-center justify-between">
              <span className="text-xs text-[#2D3A31]/60">
                Hiển thị top 5 / {candidates.length} ứng viên &bull; Sắp xếp theo AI Match Score
              </span>
              <button
                type="button"
                onClick={() => setIsAiSortDescending(true)}
                className="text-xs text-[#C27B66] hover:underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Xem đầy đủ danh sách bên dưới</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CONTROLS PANEL (TABS + FILTER + SORT BAR)                */}
          {/* ======================================================== */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[28px] border border-[#E6E2DA] shadow-soft">
            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" id="filter-tabs">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31] hover:bg-[#F9F8F4]'
                }`}
              >
                Tất cả <span className="ml-1 opacity-70">24</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('NEW')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'NEW'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31] hover:bg-[#F9F8F4]'
                }`}
              >
                Mới nộp <span className="ml-1 opacity-70">10</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REVIEWING')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'REVIEWING'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31] hover:bg-[#F9F8F4]'
                }`}
              >
                Đang xem <span className="ml-1 opacity-70">5</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('INTERVIEW')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'INTERVIEW'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31] hover:bg-[#F9F8F4]'
                }`}
              >
                Phỏng vấn <span className="ml-1 opacity-70">4</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('PASSED')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'PASSED'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31] hover:bg-[#F9F8F4]'
                }`}
              >
                Đạt yêu cầu <span className="ml-1 opacity-70">2</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REJECTED')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'REJECTED'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31] hover:bg-[#F9F8F4]'
                }`}
              >
                Từ chối <span className="ml-1 opacity-70">3</span>
              </button>
            </div>

            {/* Search & AI Sort Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex items-center min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3.5 text-[#2D3A31]/50 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kỹ năng, tên, công ty..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-[#F9F8F4] text-[#2D3A31] placeholder-[#2D3A31]/40 rounded-full focus:outline-none focus:border-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84]/20 focus:bg-white transition-all border border-[#E6E2DA]"
                />
              </div>

              {/* AI Sort Toggle */}
              <div
                onClick={() => setIsAiSortDescending(!isAiSortDescending)}
                className="flex items-center gap-2.5 px-4 py-2 bg-[#F9F8F4] rounded-full cursor-pointer select-none border border-[#E6E2DA] hover:border-[#8C9A84] transition-colors"
                id="ai-sort-toggle"
              >
                <span className="text-xs font-semibold text-[#2D3A31] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">insights</span>
                  <span>{isAiSortDescending ? 'AI Match: Cao → Thấp' : 'AI Match: Thấp → Cao'}</span>
                </span>
                <div className="w-8 h-4 bg-[#8C9A84]/30 rounded-full flex items-center p-0.5">
                  <div
                    className={`w-3 h-3 bg-[#2D3A31] rounded-full shadow-sm transition-transform ${
                      isAiSortDescending ? 'ml-auto' : 'mr-auto'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CANDIDATE ROWS ROSTER                                    */}
          {/* ======================================================== */}
          <div className="flex flex-col gap-4">
            {paginatedCandidates.length === 0 ? (
              <div className="p-12 text-center rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#2D3A31]/40">person_search</span>
                <h3 className="text-base font-serif font-bold text-[#2D3A31]">Không tìm thấy hồ sơ phù hợp</h3>
                <p className="text-xs text-[#2D3A31]/60 max-w-md mx-auto">
                  Không có ứng viên nào khớp với bộ lọc hoặc từ khoá tìm kiếm của bạn. Hãy thử thay đổi bộ lọc trạng thái hoặc từ khoá.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 rounded-full bg-[#2D3A31] text-white text-xs font-semibold transition-all cursor-pointer shadow-soft"
                >
                  Xoá bộ lọc &amp; xem tất cả
                </button>
              </div>
            ) : (
              paginatedCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className={`p-6 rounded-[28px] flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-all shadow-soft hover:shadow-soft-md group border border-[#E6E2DA] bg-white ${
                    cand.isLowerScore ? 'opacity-85' : ''
                  }`}
                >
                  {/* Col 1: Identity & Credentials */}
                  <div 
                    onClick={() => {
                      window.location.hash = `#/candidate-evaluation?candidateId=${cand.id}&jobId=${jobDetails.id}`;
                    }}
                    className="flex items-start gap-4 min-w-0 xl:w-5/12 cursor-pointer"
                    title="Nhấp để xem hồ sơ và CV chi tiết của ứng viên này"
                  >
                    <div className="relative shrink-0">
                      {cand.avatar ? (
                        <img
                          className="w-14 h-14 rounded-2xl object-cover ring-1 ring-[#E6E2DA] group-hover:ring-[#8C9A84] transition-all shadow-soft"
                          src={cand.avatar}
                          alt={`Portrait of ${cand.name}`}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#8C9A84]/15 flex items-center justify-center font-serif font-bold text-lg text-[#2D3A31] ring-1 ring-[#E6E2DA]">
                          {cand.initials}
                        </div>
                      )}

                      {cand.rank && (
                        <span
                          className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cand.rank === 1
                              ? 'bg-[#C27B66] text-white shadow-soft'
                              : 'bg-[#2D3A31] text-white'
                          }`}
                        >
                          #{cand.rank} Top
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-serif font-bold text-[#2D3A31] group-hover:text-[#C27B66] transition-colors truncate">
                          {cand.name}
                        </span>
                        {cand.verified && (
                          <span className="material-symbols-outlined text-[16px] text-[#8C9A84]" title="Đã xác thực hồ sơ">
                            verified
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[14px] text-[#2D3A31]/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          open_in_new
                        </span>
                      </div>
                      <span className="text-xs text-[#2D3A31]/70 font-medium mt-0.5 truncate">
                        {cand.role}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-[#2D3A31]/60 mt-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#8C9A84]">find_replace</span>
                          <span>{cand.experience}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#2D3A31]/50">schedule</span>
                          <span>{cand.appliedTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Match Badge & Tech Stack Chips */}
                  <div className="flex flex-col gap-2 xl:w-4/12">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                          cand.matchScore >= 80
                            ? 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30'
                            : cand.matchScore >= 60
                            ? 'bg-[#F2F0EB] text-[#2D3A31] border-[#E6E2DA]'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {cand.matchScore >= 80 ? 'bolt' : cand.matchScore >= 60 ? 'speed' : 'warning'}
                        </span>
                        <span className="text-xs font-bold tracking-wide">
                          {cand.matchScore}% AI Match
                        </span>
                      </div>

                      <span className="text-xs font-medium text-[#2D3A31]/70">
                        {cand.matchCategory}
                      </span>
                    </div>

                    {/* Tech Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cand.techChips.map((chip, idx) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            chip.highlight === true
                              ? 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30 font-semibold'
                              : chip.highlight === 'error'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-[#F9F8F4] text-[#2D3A31] border-[#E6E2DA]'
                          }`}
                        >
                          {chip.name}
                        </span>
                      ))}
                    </div>

                    {/* AI Copilot Verdict Quote */}
                    <div className="text-xs text-[#2D3A31]/80 leading-relaxed bg-[#F9F8F4] p-3 rounded-2xl flex items-start gap-2 border border-[#E6E2DA]">
                      <span className="material-symbols-outlined text-[#8C9A84] text-[16px] shrink-0 mt-0.5">
                        psychology
                      </span>
                      <span className="italic">{cand.aiQuote}</span>
                    </div>
                  </div>

                  {/* Col 3: Actions & Status Management */}
                  <div className="flex items-center justify-between xl:justify-end gap-3 shrink-0 xl:w-3/12">
                    {/* View CV & Profile Button */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = `#/candidate-evaluation?candidateId=${cand.id}&jobId=${jobDetails.id}`;
                      }}
                      className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-[#2D3A31] text-white hover:bg-[#C27B66] shadow-soft flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      <span>Hồ Sơ &amp; CV</span>
                    </button>

                    {/* Stage Dropdown */}
                    <div className="relative">
                      <select
                        value={cand.statusLabel}
                        onChange={(e) => handleStageChange(cand.id, e.target.value)}
                        className="appearance-none bg-[#F9F8F4] text-xs font-semibold py-2 pl-3.5 pr-8 rounded-full cursor-pointer focus:outline-none border border-[#E6E2DA] focus:border-[#8C9A84] text-[#2D3A31]"
                      >
                        {STAGE_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt.label} className="bg-white text-[#2D3A31]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-2 text-[16px] pointer-events-none text-[#2D3A31]/50">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ======================================================== */}
          {/* PAGINATION                                                */}
          {/* ======================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-2 border-t border-[#E6E2DA]">
            <div className="text-xs text-[#2D3A31]/70">
              Hiển thị {filteredCandidates.length === 0 ? 0 : (validCurrentPage - 1) * PAGE_SIZE + 1} - {Math.min(validCurrentPage * PAGE_SIZE, filteredCandidates.length)} trên tổng số <strong className="text-[#2D3A31]">{filteredCandidates.length}</strong> ứng viên đã lọc ({jobDetails.totalApplicants} tổng hồ sơ)
            </div>

            {/* Segmented Page Controller */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#E6E2DA] shadow-soft">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  validCurrentPage <= 1 ? 'text-stone-300 cursor-not-allowed' : 'text-[#2D3A31] hover:bg-[#F9F8F4] cursor-pointer'
                }`}
                title="Trang trước"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                    validCurrentPage === pageNum
                      ? 'bg-[#2D3A31] text-white shadow-soft'
                      : 'text-[#2D3A31]/70 hover:bg-[#F9F8F4] hover:text-[#2D3A31]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  validCurrentPage >= totalPages ? 'text-stone-300 cursor-not-allowed' : 'text-[#2D3A31] hover:bg-[#F9F8F4] cursor-pointer'
                }`}
                title="Trang tiếp"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CANDIDATE PROFILE & CV DETAIL MODAL                     */}
      {/* ======================================================== */}
      {selectedCandidateForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-body">
          <div className="relative w-full max-w-2xl bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-soft-xl space-y-5 text-[#2D3A31]">
            <button
              onClick={() => setSelectedCandidateForModal(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            {/* Candidate Header */}
            <div className="flex items-center gap-4 border-b border-[#E6E2DA] pb-4">
              {selectedCandidateForModal.avatar ? (
                <img
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#8C9A84]/40 shadow-soft"
                  src={selectedCandidateForModal.avatar}
                  alt={selectedCandidateForModal.name}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#8C9A84]/15 flex items-center justify-center font-serif font-bold text-2xl text-[#2D3A31]">
                  {selectedCandidateForModal.initials}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-serif font-bold text-[#2D3A31]">
                    {selectedCandidateForModal.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] text-xs font-bold border border-[#8C9A84]/30">
                    {selectedCandidateForModal.matchScore}% AI Match
                  </span>
                </div>
                <p className="text-xs text-[#2D3A31]/70 mt-0.5">{selectedCandidateForModal.role}</p>
                <p className="text-[11px] text-[#C27B66] font-medium">{selectedCandidateForModal.experience} &bull; {selectedCandidateForModal.appliedTime}</p>
              </div>
            </div>

            {/* AI Copilot Breakdown */}
            <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2D3A31] uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-[#8C9A84]">psychology</span>
                Đánh Giá Tương Thích Tuyển Dụng AI
              </div>
              <p className="text-xs leading-relaxed text-[#2D3A31]/80 italic">
                {selectedCandidateForModal.aiQuote}
              </p>
            </div>

            {/* Skills & Experience */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#2D3A31] uppercase tracking-wider">
                Kỹ Năng Cốt Lõi Khớp Với JD
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedCandidateForModal.techChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      chip.highlight === true
                        ? 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30 font-semibold'
                        : chip.highlight === 'error'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-[#F9F8F4] text-[#2D3A31] border-[#E6E2DA]'
                    }`}
                  >
                    {chip.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Attached CV Preview Box */}
            <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#C27B66] text-2xl">picture_as_pdf</span>
                <div>
                  <div className="text-xs font-bold text-[#2D3A31]">CV_{selectedCandidateForModal.name.replace(/\s+/g, '_')}_2026.pdf</div>
                  <div className="text-[11px] text-[#2D3A31]/50 font-mono">1.8 MB &bull; Đã qua phân tích ATS</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerToast(`Đang mở tập tin CV của ứng viên ${selectedCandidateForModal.name}`)}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#F2F0EB] text-[#2D3A31] text-xs font-semibold border border-[#E6E2DA] transition-colors cursor-pointer shadow-soft"
              >
                Mở Xem CV
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setSelectedCandidateForModal(null)}
                className="px-5 py-2.5 rounded-full bg-[#F2F0EB] hover:bg-[#E6E2DA] text-[#2D3A31] text-xs font-semibold border border-[#E6E2DA] cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  handleStageChange(selectedCandidateForModal.id, 'Duyệt Phỏng Vấn');
                  setSelectedCandidateForModal(null);
                }}
                className="px-6 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white font-semibold text-xs shadow-soft transition-all cursor-pointer"
              >
                Xác Nhận Mời Phỏng Vấn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
