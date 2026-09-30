import React, { useState, useMemo } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';

export default function RecruiterJobManagementPage({ user, onNavigateToPipeline }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  // Category tab: 'ALL' | 'ACTIVE' | 'PAUSED' | 'CLOSED'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3500);
  };

  // Jobs state matching user specifications
  const [jobsList, setJobsList] = useState([
    {
      id: 101,
      code: 'JD-BNK-882',
      badgeText: 'Ưu Tiên Tuyển Gấp',
      badgeType: 'high-priority',
      title: 'Senior Backend Engineer (Java / Distributed Systems)',
      status: 'ACTIVE', // ACTIVE, PAUSED, CLOSED
      domain: 'Fintech Core Banking',
      domainIcon: 'account_balance',
      location: 'TP.HCM (Hybrid)',
      salary: '$2,500 - $3,500',
      totalApplicants: 24,
      aiMatchHighCount: 5,
      mandatorySkills: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Microservices'],
      preferredSkills: ['Kafka', 'Redis Cluster', 'Docker', 'AWS'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 102,
      code: 'JD-WEB-641',
      badgeText: 'Core Frontend',
      badgeType: 'frontend',
      title: 'Frontend Lead Architect (React / Next.js / TypeScript)',
      status: 'ACTIVE',
      domain: 'Enterprise Web',
      domainIcon: 'web',
      location: 'Hà Nội / Remote',
      salary: '$2,800 - $4,000',
      totalApplicants: 18,
      aiMatchHighCount: 4,
      mandatorySkills: ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      preferredSkills: ['Redux Toolkit', 'GraphQL', 'Micro-frontends'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 103,
      code: 'JD-OPS-330',
      badgeText: 'DevOps / SRE',
      badgeType: 'devops',
      title: 'DevOps & Platform Engineer (AWS / Kubernetes / ArgoCD)',
      status: 'ACTIVE',
      domain: 'Infrastructure Core',
      domainIcon: 'dns',
      location: 'TP.HCM',
      salary: '$2,200 - $3,200',
      totalApplicants: 15,
      aiMatchHighCount: 3,
      mandatorySkills: ['AWS EKS', 'Kubernetes', 'Terraform', 'CI/CD GitLab'],
      preferredSkills: ['ArgoCD', 'Prometheus', 'Helm', 'Python scripting'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 104,
      code: 'JD-AI-109',
      badgeText: 'Hot Executive',
      badgeType: 'executive',
      title: 'Lead AI & LLM Solution Architect (GenAI Core)',
      status: 'ACTIVE',
      domain: 'AI Lab & R&D',
      domainIcon: 'psychology',
      location: 'Remote',
      salary: '$4,000 - $6,000',
      totalApplicants: 9,
      aiMatchHighCount: 6,
      mandatorySkills: ['Python', 'LangChain', 'PyTorch', 'RAG Architecture'],
      preferredSkills: ['FastAPI', 'Milvus / ChromaDB', 'LLM Fine-tuning'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      ],
    },
  ]);

  // Create Job Form
  const [createForm, setCreateForm] = useState({
    title: '',
    code: 'JD-' + Math.floor(100 + Math.random() * 900),
    domain: 'Engineering R&D',
    location: 'TP.HCM (Hybrid)',
    salary: '$2,500 - $4,000',
    mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL',
    preferredSkillsInput: 'Kafka, Redis Cluster, Docker',
    description: '',
  });

  // Filtered jobs calculation
  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const matchCategory =
        selectedCategory === 'ALL' ? true : job.status === selectedCategory;
      const matchQuery =
        searchQuery.trim() === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.mandatorySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.preferredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchQuery;
    });
  }, [jobsList, selectedCategory, searchQuery]);

  const activeCount = useMemo(() => jobsList.filter((j) => j.status === 'ACTIVE').length, [jobsList]);
  const pausedCount = useMemo(() => jobsList.filter((j) => j.status === 'PAUSED').length, [jobsList]);
  const closedCount = useMemo(() => jobsList.filter((j) => j.status === 'CLOSED').length, [jobsList]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const mandatory = createForm.mandatorySkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const preferred = createForm.preferredSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    const newJob = {
      id: Date.now(),
      code: createForm.code || `JD-DEV-${Math.floor(100 + Math.random() * 900)}`,
      badgeText: 'Tin Mới Đăng',
      badgeType: 'high-priority',
      title: createForm.title,
      status: 'ACTIVE',
      domain: createForm.domain,
      domainIcon: 'terminal',
      location: createForm.location,
      salary: createForm.salary,
      totalApplicants: 0,
      aiMatchHighCount: 0,
      mandatorySkills: mandatory,
      preferredSkills: preferred,
      topCandidateAvatars: [],
    };

    setJobsList([newJob, ...jobsList]);
    setShowCreateModal(false);
    triggerToast(`Đã xuất bản thành công tin tuyển dụng mới: ${newJob.title}`);
    setCreateForm({
      title: '',
      code: 'JD-' + Math.floor(100 + Math.random() * 900),
      domain: 'Engineering R&D',
      location: 'TP.HCM (Hybrid)',
      salary: '$2,500 - $4,000',
      mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL',
      preferredSkillsInput: 'Kafka, Redis Cluster, Docker',
      description: '',
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingJob) return;

    setJobsList((prev) =>
      prev.map((j) => (j.id === editingJob.id ? { ...editingJob } : j))
    );
    setShowEditModal(false);
    triggerToast(`Đã cập nhật thành công tin tuyển dụng ${editingJob.code}!`);
  };

  const handleToggleStatus = (jobId) => {
    setJobsList((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const next = j.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          triggerToast(`Trạng thái tin ${j.code} đã đổi thành: ${next === 'ACTIVE' ? 'Đang bật tuyển' : 'Tạm dừng'}`);
          return { ...j, status: next };
        }
        return j;
      })
    );
  };

  const handleCopyLink = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#/jobs/101?code=${code}`);
      triggerToast(`Đã sao chép link ứng tuyển vị trí ${code}!`);
    } else {
      triggerToast(`Link ứng tuyển: ${code}`);
    }
  };

  return (
    <div className="w-full bg-transparent font-body text-[#2D3A31] antialiased min-h-screen pb-16 selection:bg-[#8C9A84] selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D3A31] text-white border border-[#E6E2DA] text-xs font-medium px-5 py-3 rounded-2xl shadow-soft-xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in">
          <span className="material-symbols-outlined text-[#8C9A84] text-base">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Subtle Ambient Botanical Glows */}
      <div className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-10 py-8 space-y-8 max-w-7xl mx-auto">
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#8C9A84]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-10 w-96 h-96 bg-[#C27B66]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Page Title & Quick Pulse Banner */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30 uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse" />
              <span>Hệ Thống Quản Trị Tuyển Dụng AI 70/30</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#2D3A31] tracking-tight">
              Quản Lý Tin Tuyển Dụng
            </h1>
            <p className="text-sm text-[#2D3A31]/70 font-light max-w-2xl">
              Theo dõi, sàng lọc và điều phối ứng viên tự động bằng thuật toán AI matching chuẩn xác theo thời gian thực.
            </p>
          </div>

          {/* Live Activity Ticker Chip */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white border border-[#E6E2DA] shadow-soft text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C27B66] animate-ping" />
            <div className="text-xs">
              <span className="text-[#2D3A31]/60">Đồng bộ AI Engine:</span>
              <span className="text-[#2D3A31] font-semibold ml-1">2 phút trước</span>
            </div>
          </div>
        </div>

        {/* 4 Clean Metric Cards (Botanical Style) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Metric 1 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Vị Trí Đang Mở</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-serif font-bold text-[#2D3A31]">12</span>
                  <span className="text-xs text-[#8C9A84] font-medium">+2 tuần này</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 flex items-center justify-center text-[#2D3A31] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">work_outline</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#2D3A31]/70 border-t border-[#E6E2DA]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8C9A84]" /> 8 Đang tuyển &bull; 2 Tạm dừng
              </span>
              <span className="text-[#2D3A31] font-semibold">66.7% Active</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Tổng Hồ Sơ Đã Nộp</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-serif font-bold text-[#2D3A31]">156</span>
                  <span className="text-xs text-[#C27B66] font-medium">+28% MoM</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#C27B66]/15 border border-[#C27B66]/30 flex items-center justify-center text-[#C27B66] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">folder_shared</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#2D3A31]/70 border-t border-[#E6E2DA]">
              <span>Trung bình 13 hồ sơ/job</span>
              <span className="text-[#C27B66] font-semibold">Tăng Trưởng Tốt</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#2D3A31]/60 font-semibold">AI Match &gt; 80%</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-serif font-bold text-[#2D3A31]">38</span>
                  <span className="text-xs text-[#2D3A31]/60">ứng viên tiềm năng</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 flex items-center justify-center text-[#2D3A31] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#2D3A31]/70 border-t border-[#E6E2DA]">
              <div className="w-2/3 bg-[#F2F0EB] h-2 rounded-full overflow-hidden">
                <div className="bg-[#8C9A84] h-full rounded-full" style={{ width: '72%' }} />
              </div>
              <span className="text-[#2D3A31] font-semibold">24.3% Tỷ lệ</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#2D3A31]/60 font-semibold">Tốc Độ Tuyển Dụng</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-serif font-bold text-[#2D3A31]">14</span>
                  <span className="text-xs text-[#2D3A31]/60 font-medium">ngày / offer</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#C27B66]/15 border border-[#C27B66]/30 flex items-center justify-center text-[#C27B66] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">speed</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#2D3A31]/70 border-t border-[#E6E2DA]">
              <span>Nhanh hơn 42% benchmark</span>
              <span className="text-[#8C9A84] font-semibold">-3.5d vs Q3</span>
            </div>
          </div>
        </div>

        {/* Filter, Search & Action Bar */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft">
          {/* Search Box & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative min-w-[260px] lg:w-72">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D3A31]/50 text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F9F8F4] text-[#2D3A31] placeholder-[#2D3A31]/40 text-xs pl-10 pr-4 py-2.5 rounded-full focus:outline-none focus:border-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84]/20 focus:bg-white transition-all border border-[#E6E2DA]"
                placeholder="Tìm theo chức danh, tech stack (Java, React...)"
                type="text"
              />
            </div>

            {/* Segmented Category Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#F9F8F4] rounded-full overflow-x-auto text-xs border border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#2D3A31] text-white shadow-soft font-semibold'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31]'
                }`}
              >
                <span>Tất cả</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">12</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('ACTIVE')}
                className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === 'ACTIVE'
                    ? 'bg-[#2D3A31] text-white shadow-soft font-semibold'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31]'
                }`}
              >
                <span>Đang bật tuyển</span>
                <span className="text-[10px] opacity-80">({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('PAUSED')}
                className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === 'PAUSED'
                    ? 'bg-[#2D3A31] text-white shadow-soft font-semibold'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31]'
                }`}
              >
                <span>Tạm dừng</span>
                <span className="text-[10px] opacity-80">({pausedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('CLOSED')}
                className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === 'CLOSED'
                    ? 'bg-[#2D3A31] text-white shadow-soft font-semibold'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31]'
                }`}
              >
                <span>Đã đóng</span>
                <span className="text-[10px] opacity-80">({closedCount})</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F9F8F4] text-[#2D3A31] text-xs font-semibold transition-all border border-[#E6E2DA] cursor-pointer shadow-soft"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-[#8C9A84]">ios_share</span>
              <span>Xuất Báo Cáo</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white text-xs font-semibold tracking-wider uppercase shadow-soft hover:shadow-soft-md transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Đăng Tin Mới (Chuẩn 70/30)</span>
            </button>
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col justify-between p-6 sm:p-7 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft hover:shadow-soft-md transition-all group gap-5"
            >
              <div className="space-y-4">
                {/* Top Row: Title + Status Badge */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-medium border ${
                          job.badgeType === 'high-priority'
                            ? 'bg-[#C27B66]/15 text-[#C27B66] border-[#C27B66]/30'
                            : job.badgeType === 'executive'
                            ? 'bg-[#2D3A31]/10 text-[#2D3A31] border-[#2D3A31]/20'
                            : 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30'
                        }`}
                      >
                        {job.badgeText}
                      </span>
                      <span className="text-[11px] text-[#2D3A31]/60 font-mono">Mã: {job.code}</span>
                    </div>
                    <h2
                      onClick={() => {
                        window.location.hash = `#/jobs/${job.id}`;
                      }}
                      className="text-lg lg:text-xl font-serif font-bold text-[#2D3A31] group-hover:text-[#C27B66] transition-colors cursor-pointer flex items-center gap-2"
                      title="Nhấp để xem chi tiết bài đăng tuyển dụng"
                    >
                      <span>{job.title}</span>
                      <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 text-[#C27B66] transition-opacity">open_in_new</span>
                    </h2>
                  </div>

                  {/* Status Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(job.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      job.status === 'ACTIVE'
                        ? 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/40 hover:bg-[#8C9A84]/25'
                        : 'bg-[#F2F0EB] text-[#2D3A31]/60 border-[#E6E2DA] hover:bg-[#E6E2DA]'
                    }`}
                    title="Nhấp để chuyển trạng thái Đang bật / Tạm dừng"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'ACTIVE' ? 'bg-[#8C9A84]' : 'bg-stone-400'}`} />
                    <span>{job.status === 'ACTIVE' ? 'Đang tuyển' : 'Tạm dừng'}</span>
                  </button>
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#2D3A31]/70 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">{job.domainIcon}</span>
                    <span>{job.domain}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#2D3A31]/50">location_on</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#2D3A31]">
                    <span className="material-symbols-outlined text-[16px] text-[#C27B66]">payments</span>
                    <span>{job.salary}</span>
                  </div>
                </div>

                {/* Skills 70/30 Matrix Preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-[#2D3A31]/60">Bắt buộc (70%):</span>
                    {job.mandatorySkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#2D3A31]/10 text-[#2D3A31] border border-[#2D3A31]/15">
                        {sk}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-[#8C9A84]">Ưu tiên (30%):</span>
                    {job.preferredSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Highlight Stats Box */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#E6E2DA]">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-[#2D3A31]/60 font-sans">Hồ sơ đã nộp</div>
                      <div className="text-xl font-serif font-bold text-[#2D3A31] mt-0.5">
                        {job.totalApplicants} <span className="text-xs font-normal text-[#2D3A31]/50">CVs</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[#E6E2DA]" />
                    <div>
                      <div className="text-xs text-[#2D3A31] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-[#C27B66]">auto_awesome</span>
                        AI Match &gt; 80%
                      </div>
                      <div className="text-xl font-serif font-bold text-[#C27B66] mt-0.5">
                        {job.aiMatchHighCount} <span className="text-xs font-normal text-[#2D3A31]/50">ứng viên</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Candidates Avatar Stack */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#2D3A31]/60">Top ứng viên:</span>
                    <div className="flex -space-x-2">
                      {job.topCandidateAvatars.length > 0 ? (
                        job.topCandidateAvatars.map((av, idx) => (
                          <img
                            key={idx}
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-soft"
                            src={av}
                            alt="Candidate avatar"
                          />
                        ))
                      ) : (
                        <span className="text-[11px] text-[#2D3A31]/40">Chờ ứng viên...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E6E2DA] flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      window.location.hash = `#/jobs/${job.id}`;
                    }}
                    className="px-3.5 py-2 rounded-full bg-white hover:bg-[#F9F8F4] text-[#2D3A31] text-xs font-medium transition-colors flex items-center gap-1.5 border border-[#E6E2DA] cursor-pointer shadow-soft"
                    type="button"
                    title="Xem chi tiết bài đăng tuyển dụng"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">visibility</span>
                    <span>Xem bài đăng</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingJob({ ...job });
                      setShowEditModal(true);
                    }}
                    className="px-3.5 py-2 rounded-full bg-white hover:bg-[#F9F8F4] text-[#2D3A31] text-xs font-medium transition-colors flex items-center gap-1.5 border border-[#E6E2DA] cursor-pointer shadow-soft"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#2D3A31]/60">edit</span>
                    <span>Chỉnh sửa</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(job.code)}
                    className="p-2 rounded-full bg-white hover:bg-[#F9F8F4] text-[#2D3A31]/60 hover:text-[#2D3A31] transition-colors border border-[#E6E2DA] cursor-pointer shadow-soft"
                    title="Sao chép link ứng tuyển"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    window.location.hash = `#/applicants-management?jobId=${job.id}`;
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  <span>Quản lý {job.totalApplicants} ứng viên</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Footer Status Summary */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 rounded-2xl bg-white text-xs text-[#2D3A31]/70 border border-[#E6E2DA] shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#2D3A31] font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">psychology</span>
              Thuật toán AI Matching: HireMate 4.2
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Trọng số 70% Bắt buộc + 30% Ưu tiên tuân thủ chặt chẽ</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Hiển thị {filteredJobs.length} trong số 12 vị trí</span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-[#C27B66] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Xem tất cả tin</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: TẠO TIN TUYỂN DỤNG MỚI (CHUẨN AI 70/30)        */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-body">
          <div className="relative w-full max-w-2xl bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-soft-xl text-[#2D3A31]">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-2xl font-serif font-bold text-[#2D3A31] flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#C27B66]">add_circle</span>
              Tạo Tin Tuyển Dụng Mới (Chuẩn AI 70/30)
            </h2>
            <p className="text-xs text-[#2D3A31]/70 mb-6">
              Khai báo tiêu đề, mức lương và phân bổ trọng số kỹ năng (70% Bắt buộc / 30% Ưu tiên) để AI matching chính xác hồ sơ ứng viên.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#2D3A31] mb-1 font-semibold uppercase tracking-wider">
                  Tiêu Đề Vị Trí Tuyển Dụng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Senior Backend Engineer (Java / Distributed Systems)"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] placeholder-[#2D3A31]/40 focus:outline-none focus:border-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84]/20 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#2D3A31] mb-1 font-semibold uppercase tracking-wider">Mã Vị Trí (JD Code)</label>
                  <input
                    type="text"
                    required
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#2D3A31] mb-1 font-semibold uppercase tracking-wider">Lĩnh Vực / Domain</label>
                  <input
                    type="text"
                    required
                    value={createForm.domain}
                    onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                  />
                </div>
                <div>
                  <label className="block text-[#2D3A31] mb-1 font-semibold uppercase tracking-wider">Mức Lương Dự Kiến</label>
                  <input
                    type="text"
                    required
                    placeholder="$2,500 - $3,500"
                    value={createForm.salary}
                    onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#C27B66] focus:outline-none focus:border-[#8C9A84] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2D3A31] mb-1 font-semibold uppercase tracking-wider">Địa Điểm &amp; Hình Thức Làm Việc</label>
                <input
                  type="text"
                  required
                  placeholder="TP.HCM (Hybrid) hoặc Hà Nội / Remote"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                />
              </div>

              {/* AI SKILLS MATRIX BUILDER */}
              <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8C9A84] text-base">psychology</span>
                    <span className="font-serif font-bold text-sm text-[#2D3A31]">
                      Cấu Hình Trọng Số AI Job Matcher (Chuẩn 70/30)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-[#2D3A31] bg-white border border-[#E6E2DA]">
                    Formula: (M × 0.70) + (P × 0.30)
                  </span>
                </div>

                {/* 70% MANDATORY SKILLS */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E6E2DA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#2D3A31] uppercase flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-sm text-[#8C9A84]">verified</span>
                      Kỹ Năng Bắt Buộc (Mandatory - 70% Trọng Số) *
                    </label>
                    <span className="text-[10px] font-mono font-bold text-white bg-[#2D3A31] px-2 py-0.5 rounded-full">
                      Weight: 70%
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Java 21, Spring Boot 3, PostgreSQL, Microservices"
                    value={createForm.mandatorySkillsInput}
                    onChange={(e) => setCreateForm({ ...createForm, mandatorySkillsInput: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] placeholder-[#2D3A31]/40 focus:outline-none focus:border-[#8C9A84] text-xs"
                  />
                  
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#2D3A31]/60">Gợi ý nhanh:</span>
                    {['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Microservices', 'RESTful API', 'Docker'].map((sk) => (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => {
                          const current = createForm.mandatorySkillsInput ? createForm.mandatorySkillsInput.split(',').map(s => s.trim()) : [];
                          if (!current.includes(sk)) {
                            setCreateForm({
                              ...createForm,
                              mandatorySkillsInput: current.concat(sk).join(', ')
                            });
                          }
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#F2F0EB] text-[#2D3A31] hover:bg-[#E6E2DA] border border-[#E6E2DA] transition-colors cursor-pointer"
                      >
                        + {sk}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#2D3A31]/70 leading-relaxed">
                    Ứng viên bắt buộc phải có các kỹ năng này để đạt ngưỡng qua vòng hồ sơ (tối đa 70 điểm).
                  </p>
                </div>

                {/* 30% PREFERRED SKILLS */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E6E2DA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#C27B66] uppercase flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-sm">stars</span>
                      Kỹ Năng Ưu Tiên (Preferred - 30% Trọng Số)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-white bg-[#C27B66] px-2 py-0.5 rounded-full">
                      Weight: 30%
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kafka, Redis Cluster, AWS, Kubernetes"
                    value={createForm.preferredSkillsInput}
                    onChange={(e) => setCreateForm({ ...createForm, preferredSkillsInput: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] placeholder-[#2D3A31]/40 focus:outline-none focus:border-[#C27B66] text-xs"
                  />
                  
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#2D3A31]/60">Gợi ý nhanh:</span>
                    {['Kafka', 'Redis Cluster', 'AWS', 'Kubernetes', 'CI/CD', 'GraphQL'].map((sk) => (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => {
                          const current = createForm.preferredSkillsInput ? createForm.preferredSkillsInput.split(',').map(s => s.trim()) : [];
                          if (!current.includes(sk)) {
                            setCreateForm({
                              ...createForm,
                              preferredSkillsInput: current.concat(sk).join(', ')
                            });
                          }
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#C27B66]/10 text-[#C27B66] hover:bg-[#C27B66]/20 border border-[#C27B66]/30 transition-colors cursor-pointer"
                      >
                        + {sk}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#2D3A31]/70 leading-relaxed">
                    Kỹ năng cộng điểm giúp xếp hạng ứng viên xuất sắc từ 80% - 98% Match trong Talent Pipeline.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#2D3A31] bg-[#F2F0EB] hover:bg-[#E6E2DA] border border-[#E6E2DA] transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white bg-[#2D3A31] hover:bg-[#C27B66] shadow-soft hover:shadow-soft-md transition-all cursor-pointer"
                >
                  Xuất Bản Tin Tuyển Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CHỈNH SỬA TIN TUYỂN DỤNG (EDIT JD)             */}
      {/* ======================================================== */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-body">
          <div className="relative w-full max-w-xl bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-soft-xl text-[#2D3A31]">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-serif font-bold text-[#2D3A31] flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#8C9A84]">edit</span>
              Chỉnh Sửa Tin Tuyển Dụng ({editingJob.code})
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-[#2D3A31] mb-1 font-semibold uppercase">Tiêu đề vị trí</label>
                <input
                  type="text"
                  required
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3A31] mb-1 font-semibold uppercase">Mức lương</label>
                  <input
                    type="text"
                    value={editingJob.salary}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#C27B66] font-bold focus:outline-none focus:border-[#8C9A84]"
                  />
                </div>
                <div>
                  <label className="block text-[#2D3A31] mb-1 font-semibold uppercase">Địa điểm</label>
                  <input
                    type="text"
                    value={editingJob.location}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2D3A31] mb-1 font-semibold uppercase">Trạng thái tin</label>
                <select
                  value={editingJob.status}
                  onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-2.5 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84] cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE (Đang bật tuyển dụng)</option>
                  <option value="PAUSED">PAUSED (Tạm dừng)</option>
                  <option value="CLOSED">CLOSED (Đã đóng)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#2D3A31] bg-[#F2F0EB] hover:bg-[#E6E2DA] border border-[#E6E2DA] transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white bg-[#2D3A31] hover:bg-[#C27B66] transition-all shadow-soft cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XUẤT BÁO CÁO TUYỂN DỤNG                         */}
      {/* ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-body">
          <div className="relative w-full max-w-md bg-white border border-[#E6E2DA] rounded-[32px] p-6 shadow-soft-xl space-y-4 text-[#2D3A31]">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h3 className="text-xl font-serif font-bold text-[#2D3A31] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8C9A84]">ios_share</span>
              Xuất Báo Cáo Tuyển Dụng Tổng Hợp
            </h3>
            <p className="text-xs text-[#2D3A31]/70">
              Tải xuống tập tin thống kê dữ liệu 12 vị trí tuyển dụng, 156 hồ sơ ứng viên và điểm AI Match thời gian thực.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Đã tải xuống báo cáo tổng quan định dạng Excel (.xlsx)');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#F9F8F4] hover:bg-white border border-[#E6E2DA] hover:border-[#8C9A84] flex items-center justify-between transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 text-[#2D3A31]">
                  <span className="material-symbols-outlined text-[#8C9A84]">table_chart</span>
                  <span className="font-semibold">Bảng tính Excel (.xlsx)</span>
                </div>
                <span className="text-[11px] font-semibold text-[#8C9A84]">Tải Về</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Đã xuất báo cáo phân tích hiệu suất tuyển dụng PDF');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#F9F8F4] hover:bg-white border border-[#E6E2DA] hover:border-[#C27B66] flex items-center justify-between transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 text-[#2D3A31]">
                  <span className="material-symbols-outlined text-[#C27B66]">picture_as_pdf</span>
                  <span className="font-semibold">Tài liệu PDF Executive (.pdf)</span>
                </div>
                <span className="text-[11px] font-semibold text-[#C27B66]">Tải Về</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
