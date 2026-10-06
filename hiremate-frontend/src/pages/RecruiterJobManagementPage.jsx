import React, { useState, useMemo, useEffect } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { jobApi } from '../api';

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

  useEffect(() => {
    jobApi.getMyJobs()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((j, idx) => ({
            id: j.jobId || idx + 1,
            code: `JD-REQ-${j.jobId || (idx + 100)}`,
            badgeText: j.status === 'PUBLISHED' ? 'Đang Đăng Tuyển' : 'Bản Nháp',
            badgeType: j.status === 'PUBLISHED' ? 'high-priority' : 'frontend',
            title: j.title,
            status: j.status === 'PUBLISHED' ? 'ACTIVE' : j.status === 'CLOSED' ? 'CLOSED' : 'PAUSED',
            domain: j.company?.industry || 'Công Nghệ & Kỹ Thuật',
            domainIcon: 'work',
            location: j.location || 'Việt Nam',
            salary: j.salaryMin && j.salaryMax ? `$${j.salaryMin} - $${j.salaryMax}` : 'Thỏa thuận',
            totalApplicants: j.vacanciesCount || 0,
            aiMatchHighCount: 0,
            mandatorySkills: j.requirements ? j.requirements.split(',').map(s => s.trim()) : ['Yêu cầu chuyên môn'],
            preferredSkills: j.benefits ? j.benefits.split(',').map(s => s.trim()) : ['Chế độ đãi ngộ tốt'],
            topCandidateAvatars: [],
          }));
          setJobsList(mapped);
        }
      })
      .catch(() => {
        // Fallback to default list
      });
  }, []);

  useEffect(() => {
    const handleCheckHash = () => {
      if (window.location.hash.includes('action=new')) {
        setShowCreateModal(true);
      }
    };
    handleCheckHash();
    window.addEventListener('hashchange', handleCheckHash);
    return () => window.removeEventListener('hashchange', handleCheckHash);
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const mandatory = createForm.mandatorySkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const preferred = createForm.preferredSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    // Call API to persist in Supabase DB
    jobApi.createJob({
      title: createForm.title,
      description: createForm.description || createForm.title,
      requirements: createForm.mandatorySkillsInput,
      benefits: createForm.preferredSkillsInput,
      salaryMin: 2000,
      salaryMax: 3500,
      location: createForm.location,
      employmentType: 'FULL_TIME',
      vacanciesCount: 1,
      status: 'PUBLISHED',
    }).then(res => {
      if (res.data && res.data.jobId) {
        newJob.id = res.data.jobId;
      }
    }).catch(err => console.log('API create job notice:', err));

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
    triggerToast(`Đã xuất bản thành công tin tuyển dụng mới lên Supabase: ${newJob.title}`);
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
    <div className="recruiter-job-page recruiter-page w-full bg-transparent font-sans text-[#221d47] antialiased min-h-screen pb-16 selection:bg-[#5b48bd] selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#221d47] text-white border border-purple-300/30 text-xs font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in">
          <span className="material-symbols-outlined text-[#10b981] text-base">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Ambient Purple Halos */}
      <div className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-10 py-8 space-y-8 max-w-7xl mx-auto">
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#5b48bd]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-10 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Page Title & Quick Pulse Banner */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#edeafd] text-[#5b48bd] border border-[#d6cefa] uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Hệ Thống Quản Trị Tuyển Dụng AI</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47] tracking-tight">
              Quản Lý Tin Tuyển Dụng
            </h1>
          </div>

          {/* Live Activity Ticker Chip */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/90 border border-purple-100 shadow-sm text-xs backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
            <div className="text-xs">
              <span className="text-slate-500">Đồng bộ AI Engine:</span>
              <span className="text-[#221d47] font-semibold ml-1">2 phút trước</span>
            </div>
          </div>
        </div>

        {/* 4 Clean Metric Cards (Mindskills Palette) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Metric 1 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Vị Trí Đang Mở</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47]">12</span>
                  <span className="text-xs text-[#10b981] font-semibold">+2 tuần này</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#edeafd] border border-purple-200 flex items-center justify-center text-[#5b48bd] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">work_outline</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" /> 8 Đang tuyển &bull; 2 Tạm dừng
              </span>
              <span className="text-[#5b48bd] font-bold">66.7% Active</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Tổng Hồ Sơ Đã Nộp</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47]">156</span>
                  <span className="text-xs text-[#0284c7] font-semibold">+28% MoM</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0284c7] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">folder_shared</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <span>Trung bình 13 hồ sơ/job</span>
              <span className="text-[#10b981] font-bold">Tăng Trưởng Tốt</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">AI Match &gt; 80%</p>
                <div className="flex items-baseline gap-2 mt-2 flex-nowrap">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47] shrink-0">38</span>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ứng viên tiềm năng</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#5b48bd] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <div className="w-2/3 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#5b48bd] h-full rounded-full" style={{ width: '72%' }} />
              </div>
              <span className="text-[#5b48bd] font-bold">24.3% Tỷ lệ</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Tốc Độ Tuyển Dụng</p>
                <div className="flex items-baseline gap-2 mt-2 flex-nowrap">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47] shrink-0">14</span>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ngày / offer</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f97316] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">speed</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <span>Nhanh hơn 42% benchmark</span>
              <span className="text-[#10b981] font-bold">-3.5d vs Q3</span>
            </div>
          </div>
        </div>

        {/* Filter, Search & Action Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[28px] bg-white border border-purple-100/80 shadow-sm overflow-hidden">
          {/* Search Box & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f7ff] text-[#221d47] placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-full focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:bg-white transition-all border border-purple-100 font-sans"
                placeholder="Tìm theo chức danh, tech stack (Java, React...)"
                type="text"
              />
            </div>

            {/* Segmented Category Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#f4f2fd] rounded-full overflow-x-auto text-xs border border-purple-100 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'ALL'
                  ? 'bg-[#5b48bd] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Tất cả</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">12</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('ACTIVE')}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'ACTIVE'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Đang bật tuyển</span>
                <span className="text-[10px] opacity-90">({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('PAUSED')}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'PAUSED'
                  ? 'bg-[#f97316] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Tạm dừng</span>
                <span className="text-[10px] opacity-90">({pausedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('CLOSED')}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'CLOSED'
                  ? 'bg-[#64748b] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Đã đóng</span>
                <span className="text-[10px] opacity-90">({closedCount})</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-purple-50 text-[#5b48bd] text-xs font-bold transition-all border border-purple-200 cursor-pointer shadow-sm whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-[#5b48bd]">ios_share</span>
              <span>Xuất Báo Cáo</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap hover:scale-105"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Đăng Tin Mới</span>
            </button>
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col justify-between p-6 sm:p-7 rounded-[24px] bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300 group gap-5 font-sans"
            >
              <div className="space-y-4">
                {/* 1. Header Row: Priority Badge, Code & Status Toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${job.badgeType === 'high-priority'
                        ? 'bg-orange-50 text-orange-600 border-orange-200/80'
                        : job.badgeType === 'executive'
                          ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                          : 'bg-cyan-50 text-cyan-700 border-cyan-200/80'
                        }`}
                    >
                      {job.badgeText}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">Mã: {job.code}</span>
                  </div>

                  {/* Status Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(job.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${job.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    title="Nhấp để chuyển trạng thái Đang tuyển / Tạm dừng"
                  >
                    <span className={`w-2 h-2 rounded-full ${job.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span>{job.status === 'ACTIVE' ? 'Đang tuyển' : 'Tạm dừng'}</span>
                  </button>
                </div>

                {/* 2. Job Title */}
                <div>
                  <h2
                    onClick={() => {
                      window.location.hash = `#/jobs/${job.id}`;
                    }}
                    className="text-lg lg:text-xl font-bold text-slate-900 group-hover:text-[#5b48bd] transition-colors cursor-pointer flex items-center gap-2 leading-snug"
                    title="Nhấp để xem chi tiết bài đăng tuyển dụng"
                  >
                    <span>{job.title}</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-[#5b48bd] transition-colors shrink-0">open_in_new</span>
                  </h2>
                </div>

                {/* 3. Primary Meta Row: High Priority Info (Lương, Địa điểm, Ngành) */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {/* Salary Highlight - Highest Priority */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">payments</span>
                    <span>{job.salary}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 font-medium text-xs">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">location_on</span>
                    <span>{job.location}</span>
                  </div>

                  {/* Domain */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 font-medium text-xs">
                    <span className="material-symbols-outlined text-[16px] text-[#5b48bd]">{job.domainIcon}</span>
                    <span>{job.domain}</span>
                  </div>
                </div>

                {/* 4. Skills 70/30 Matrix Preview */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#5b48bd] tracking-wider shrink-0 w-24">Bắt buộc (70%):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.mandatorySkills.map((sk) => (
                        <span key={sk} className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200/60">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider shrink-0 w-24">Ưu tiên (30%):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.preferredSkills.map((sk) => (
                        <span key={sk} className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/60">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Highlight Stats Box: Hồ sơ & AI Match metrics */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-slate-50 to-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-100/80">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Hồ sơ đã nộp</div>
                      <div className="text-2xl font-extrabold text-slate-900 mt-0.5 flex items-baseline gap-1">
                        {job.totalApplicants} <span className="text-xs font-normal text-slate-500">CVs</span>
                      </div>
                    </div>

                    <div className="h-9 w-px bg-purple-200/60" />

                    <div>
                      <div className="text-[11px] font-bold text-[#5b48bd] uppercase tracking-wide flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#5b48bd]">auto_awesome</span>
                        AI Match &gt; 80%
                      </div>
                      <div className="text-2xl font-extrabold text-[#5b48bd] mt-0.5 flex items-baseline gap-1">
                        {job.aiMatchHighCount} <span className="text-xs font-semibold text-[#5b48bd]/80">ứng viên</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Candidates Avatars */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-100">
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">Top ứng viên:</span>
                    <div className="flex -space-x-2 overflow-hidden">
                      {job.topCandidateAvatars.length > 0 ? (
                        job.topCandidateAvatars.map((av, idx) => (
                          <img
                            key={idx}
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm inline-block"
                            src={av}
                            alt="Candidate avatar"
                          />
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chờ ứng viên...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Action Bar */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-3.5 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => {
                    window.location.hash = `#/jobs/${job.id}`;
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5b48bd] text-xs font-semibold transition-all flex items-center gap-1 border border-slate-200 cursor-pointer shadow-sm shrink-0"
                  type="button"
                  title="Xem chi tiết bài đăng tuyển dụng"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#5b48bd]">visibility</span>
                  <span>Xem bài đăng</span>
                </button>

                <button
                  onClick={() => {
                    setEditingJob({ ...job });
                    setShowEditModal(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-purple-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 border border-slate-200 cursor-pointer shadow-sm shrink-0"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px] text-slate-500">edit</span>
                  <span>Chỉnh sửa</span>
                </button>

                <button
                  onClick={() => handleCopyLink(job.code)}
                  className="p-1.5 rounded-lg bg-white hover:bg-purple-50 text-slate-500 hover:text-[#5b48bd] transition-all border border-slate-200 cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                  title="Sao chép link ứng tuyển"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                </button>

                <button
                  onClick={() => {
                    window.location.hash = `#/applicants-management?jobId=${job.id}`;
                  }}
                  className="px-3.5 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">group</span>
                  <span>Quản lý {job.totalApplicants} ứng viên</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: TẠO TIN TUYỂN DỤNG MỚI (CHUẨN AI 70/30)        */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-[#221d47]">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-2xl font-sans font-extrabold text-[#221d47] flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[#5b48bd]">add_circle</span>
              Tạo Tin Tuyển Dụng Mới
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#221d47] mb-1 font-bold uppercase tracking-wider">
                  Tiêu Đề Vị Trí Tuyển Dụng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Senior Backend Engineer (Java / Distributed Systems)"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-3 text-[#221d47] placeholder-slate-400 focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:bg-white font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase tracking-wider">Mã Vị Trí (JD Code)</label>
                  <input
                    type="text"
                    required
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase tracking-wider">Lĩnh Vực / Domain</label>
                  <input
                    type="text"
                    required
                    value={createForm.domain}
                    onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase tracking-wider">Mức Lương Dự Kiến</label>
                  <input
                    type="text"
                    required
                    placeholder="$2,500 - $3,500"
                    value={createForm.salary}
                    onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#f97316] focus:outline-none focus:border-[#5b48bd] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#221d47] mb-1 font-bold uppercase tracking-wider">Địa Điểm &amp; Hình Thức Làm Việc</label>
                <input
                  type="text"
                  required
                  placeholder="TP.HCM (Hybrid) hoặc Hà Nội / Remote"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                />
              </div>

              {/* AI SKILLS MATRIX BUILDER */}
              <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd] text-base">psychology</span>
                    <span className="font-sans font-bold text-sm text-[#221d47]">
                      Cấu Hình Trọng Số AI Job Matcher
                    </span>
                  </div>
                </div>

                {/* 70% MANDATORY SKILLS */}
                <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#5b48bd] uppercase flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-sm text-[#5b48bd]">verified</span>
                      Kỹ Năng Bắt Buộc (Mandatory - 70% Trọng Số) *
                    </label>
                    <span className="text-[10px] font-mono font-bold text-white bg-[#5b48bd] px-2 py-0.5 rounded-full">
                      Weight: 70%
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Java 21, Spring Boot 3, PostgreSQL, Microservices"
                    value={createForm.mandatorySkillsInput}
                    onChange={(e) => setCreateForm({ ...createForm, mandatorySkillsInput: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] placeholder-slate-400 focus:outline-none focus:border-[#5b48bd] text-xs font-sans"
                  />

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Gợi ý nhanh:</span>
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
                        className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#edeafd] text-[#5b48bd] hover:bg-[#d6cefa] border border-[#d6cefa] transition-colors cursor-pointer font-medium"
                      >
                        + {sk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 30% PREFERRED SKILLS */}
                <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-600 uppercase flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-sm">stars</span>
                      Kỹ Năng Ưu Tiên (Preferred - 30% Trọng Số)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-white bg-[#10b981] px-2 py-0.5 rounded-full">
                      Weight: 30%
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kafka, Redis Cluster, AWS, Kubernetes"
                    value={createForm.preferredSkillsInput}
                    onChange={(e) => setCreateForm({ ...createForm, preferredSkillsInput: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] placeholder-slate-400 focus:outline-none focus:border-[#10b981] text-xs font-sans"
                  />

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Gợi ý nhanh:</span>
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
                        className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer font-medium"
                      >
                        + {sk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase text-white bg-[#5b48bd] hover:bg-[#47369f] shadow-md hover:shadow-lg transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-xl bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-[#221d47]">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-sans font-extrabold text-[#221d47] flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#5b48bd]">edit</span>
              Chỉnh Sửa Tin Tuyển Dụng ({editingJob.code})
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-[#221d47] mb-1 font-bold uppercase">Tiêu đề vị trí</label>
                <input
                  type="text"
                  required
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase">Mức lương</label>
                  <input
                    type="text"
                    value={editingJob.salary}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#f97316] font-bold focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase">Địa điểm</label>
                  <input
                    type="text"
                    value={editingJob.location}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#221d47] mb-1 font-bold uppercase">Trạng thái tin</label>
                <select
                  value={editingJob.status}
                  onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                  className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] cursor-pointer font-sans"
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
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase text-white bg-[#5b48bd] hover:bg-[#47369f] transition-all shadow-md cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-white border border-purple-100 rounded-[32px] p-6 shadow-2xl space-y-4 text-[#221d47]">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h3 className="text-xl font-sans font-extrabold text-[#221d47] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5b48bd]">ios_share</span>
              Xuất Báo Cáo Tuyển Dụng Tổng Hợp
            </h3>
            <p className="text-xs text-slate-500">
              Tải xuống tập tin thống kê dữ liệu 12 vị trí tuyển dụng, 156 hồ sơ ứng viên và điểm AI Match thời gian thực.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Đã tải xuống báo cáo tổng quan định dạng Excel (.xlsx)');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#f8f7ff] hover:bg-white border border-purple-100 hover:border-[#5b48bd] flex items-center justify-between transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 text-[#221d47]">
                  <span className="material-symbols-outlined text-[#10b981]">table_chart</span>
                  <span className="font-bold">Bảng tính Excel (.xlsx)</span>
                </div>
                <span className="text-[11px] font-bold text-[#10b981]">Tải Về</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Đã xuất báo cáo phân tích hiệu suất tuyển dụng PDF');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#f8f7ff] hover:bg-white border border-purple-100 hover:border-[#5b48bd] flex items-center justify-between transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 text-[#221d47]">
                  <span className="material-symbols-outlined text-[#f97316]">picture_as_pdf</span>
                  <span className="font-bold">Tài liệu PDF Executive (.pdf)</span>
                </div>
                <span className="text-[11px] font-bold text-[#f97316]">Tải Về</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
