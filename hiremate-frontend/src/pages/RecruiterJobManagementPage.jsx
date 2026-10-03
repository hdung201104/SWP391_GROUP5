import React, { useState, useMemo, useEffect } from 'react';
import { jobApi } from '../api';

export default function RecruiterJobManagementPage({ user, onNavigateToPipeline }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

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

  const [jobsList, setJobsList] = useState([
    {
      id: 101,
      code: 'JD-BNK-882',
      badgeText: 'Ưu Tiên Tuyển Gấp',
      badgeType: 'high-priority',
      title: 'Senior Backend Engineer (Java / Distributed Systems)',
      status: 'ACTIVE',
      domain: 'Fintech Core Banking',
      domainIcon: 'account_balance',
      location: 'TP.HCM (Hybrid)',
      salary: '$2,500 - $3,500',
      totalApplicants: 24,
      aiMatchHighCount: 5,
      postedDate: '2025-05-18',
      mandatorySkills: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Microservices'],
      preferredSkills: ['Kafka', 'Redis Cluster', 'Docker', 'AWS'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
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
      postedDate: '2025-05-15',
      mandatorySkills: ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      preferredSkills: ['Redux Toolkit', 'GraphQL', 'Micro-frontends'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
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
      postedDate: '2025-05-12',
      mandatorySkills: ['AWS EKS', 'Kubernetes', 'Terraform', 'CI/CD GitLab'],
      preferredSkills: ['ArgoCD', 'Prometheus', 'Helm', 'Python scripting'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
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
      postedDate: '2025-05-10',
      mandatorySkills: ['Python', 'LangChain', 'PyTorch', 'RAG Architecture'],
      preferredSkills: ['FastAPI', 'Milvus / ChromaDB', 'LLM Fine-tuning'],
      topCandidateAvatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      ],
    },
  ]);

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

  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const matchCategory =
        selectedCategory === 'ALL' ? true : job.status === selectedCategory;
      const matchQuery =
        searchQuery.trim() === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((j, idx) => ({
            id: j.jobId || idx + 1,
            code: `JD-REQ-${j.jobId || (idx + 100)}`,
            badgeText: j.status === 'PUBLISHED' ? 'Đang Tuyển' : 'Bản Nháp',
            badgeType: j.status === 'PUBLISHED' ? 'high-priority' : 'frontend',
            title: j.title,
            status: j.status === 'PUBLISHED' ? 'ACTIVE' : j.status === 'CLOSED' ? 'CLOSED' : 'PAUSED',
            domain: j.company?.industry || 'Công Nghệ Thông Tin',
            domainIcon: 'work',
            location: j.location || 'Việt Nam',
            salary: j.salaryMin && j.salaryMax ? `$${j.salaryMin} - $${j.salaryMax}` : 'Thỏa thuận',
            totalApplicants: j.vacanciesCount || 0,
            aiMatchHighCount: 0,
            postedDate: '2025-05-18',
            mandatorySkills: j.requirements ? j.requirements.split(',').map((s) => s.trim()) : ['Java 21', 'Spring Boot'],
            preferredSkills: j.benefits ? j.benefits.split(',').map((s) => s.trim()) : ['Kafka', 'Docker'],
            topCandidateAvatars: [],
          }));
          setJobsList(mapped);
        }
      })
      .catch(() => { });
  }, []);

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
      domainIcon: 'work',
      location: createForm.location,
      salary: createForm.salary,
      totalApplicants: 0,
      aiMatchHighCount: 0,
      postedDate: 'Hôm nay',
      mandatorySkills: mandatory,
      preferredSkills: preferred,
      topCandidateAvatars: [],
    };

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
    }).catch(() => { });

    setJobsList([newJob, ...jobsList]);
    setShowCreateModal(false);
    triggerToast(`Đã tạo thành công tin tuyển dụng mới: ${newJob.title}`);
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
    triggerToast(`Đã cập nhật tin tuyển dụng: ${editingJob.title}`);
  };

  const handleToggleStatus = (jobId) => {
    setJobsList((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const next = j.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          triggerToast(`Đã chuyển trạng thái tin ${j.code} thành: ${next === 'ACTIVE' ? 'Đang tuyển' : 'Tạm dừng'}`);
          return { ...j, status: next };
        }
        return j;
      })
    );
  };

  return (
    <div className="w-full bg-[#FAF9F6] text-[#1F2933] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2933] text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-fade-in">
          <span className="material-symbols-outlined text-[#F58220] text-base">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2933]">
              Tin tuyển dụng
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Quản lý và đăng tin tuyển dụng thông minh với hệ thống phân tích AI.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#F58220] hover:bg-[#E07216] text-white text-sm py-2.5 px-5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Đăng tin tuyển dụng</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase">
              <span>Đang tuyển</span>
              <span className="material-symbols-outlined text-[#F58220]">work</span>
            </div>
            <div className="text-2xl font-bold text-[#1F2933]">{activeCount}</div>
            <p className="text-[11px] text-[#6B7280]">Tin đang hoạt động</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase">
              <span>Tạm dừng</span>
              <span className="material-symbols-outlined text-[#F58220]">pause_circle</span>
            </div>
            <div className="text-2xl font-bold text-[#1F2933]">{pausedCount}</div>
            <p className="text-[11px] text-[#6B7280]">Tạm ngưng tiếp nhận hồ sơ</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase">
              <span>Đã đóng</span>
              <span className="material-symbols-outlined text-[#6B7280]">check_circle</span>
            </div>
            <div className="text-2xl font-bold text-[#1F2933]">{closedCount}</div>
            <p className="text-[11px] text-[#6B7280]">Đã tuyển đủ chỉ tiêu</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] uppercase">
              <span>Tổng tin tuyển dụng</span>
              <span className="material-symbols-outlined text-[#1F2933]">format_list_bulleted</span>
            </div>
            <div className="text-2xl font-bold text-[#1F2933]">{jobsList.length}</div>
            <p className="text-[11px] text-[#6B7280]">Tổng bài đăng trên hệ thống</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-lg">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9F6] text-[#1F2933] placeholder-[#6B7280] text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] focus:outline-none focus:border-[#F58220]"
              placeholder="Tìm theo tên vị trí, mã công việc, kỹ năng..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: `Đang tuyển (${activeCount})` },
              { id: 'PAUSED', label: `Tạm dừng (${pausedCount})` },
              { id: 'CLOSED', label: `Đã đóng (${closedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${selectedCategory === tab.id
                    ? 'bg-[#1F2933] text-white shadow-sm'
                    : 'bg-[#FAF9F6] text-[#6B7280] hover:text-[#1F2933] border border-[#E5E1D8]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm hover:border-[#F58220]/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                        {job.badgeText}
                      </span>
                      <span className="text-[11px] text-[#6B7280] font-mono">{job.code}</span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-[#1F2933]">
                      {job.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(job.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${job.status === 'ACTIVE'
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#10B981]/30'
                        : 'bg-[#FAF9F6] text-[#6B7280] border-[#E5E1D8]'
                      }`}
                  >
                    {job.status === 'ACTIVE' ? 'Đang tuyển' : 'Tạm dừng'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#F58220]">location_on</span>
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-sm text-[#F58220]">payments</span>
                    {job.salary}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {job.postedDate}
                  </span>
                </div>

                {/* Skills */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#F58220]">Bắt buộc:</span>
                    {job.mandatorySkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                        {sk}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#6B7280]">Ưu tiên:</span>
                    {job.preferredSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF9F6] text-[#6B7280] border border-[#E5E1D8]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[#6B7280]">
                    Số ứng viên: <strong className="text-[#1F2933]">{job.totalApplicants}</strong>
                  </span>
                  <span className="text-[#F58220] font-semibold">
                    Match cao: {job.aiMatchHighCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onNavigateToPipeline) onNavigateToPipeline(job.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F58220] hover:bg-[#E07216] text-white font-semibold cursor-pointer shadow-sm transition-all"
                  >
                    Xem ứng viên &rarr;
                  </button>
                  <button
                    onClick={() => {
                      setEditingJob(job);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#E5E1D8] text-[#1F2933] border border-[#E5E1D8] cursor-pointer"
                    title="Chỉnh sửa tin"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-[#6B7280] bg-white border border-[#E5E1D8] rounded-2xl">
              Không tìm thấy tin tuyển dụng nào phù hợp với từ khóa.
            </div>
          )}
        </div>
      </div>

      {/* CREATE JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-xl bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#E5E1D8] text-[#1F2933] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-bold text-[#1F2933]">Đăng Tin Tuyển Dụng Mới</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Tiêu đề vị trí *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Senior Backend Engineer"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1F2933] uppercase mb-1">Mức lương</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: $2,500 - $3,500"
                    value={createForm.salary}
                    onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1F2933] uppercase mb-1">Địa điểm</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TP.HCM (Hybrid)"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#F58220]/30 space-y-1">
                <label className="block font-bold text-[#F58220] uppercase">Kỹ năng bắt buộc (70%) *</label>
                <input
                  type="text"
                  required
                  placeholder="Java 21, Spring Boot, PostgreSQL"
                  value={createForm.mandatorySkillsInput}
                  onChange={(e) => setCreateForm({ ...createForm, mandatorySkillsInput: e.target.value })}
                  className="w-full bg-white border border-[#F58220]/40 rounded-xl p-2.5 text-[#1F2933] focus:outline-none text-xs"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                <label className="block font-bold text-[#1F2933] uppercase">Kỹ năng ưu tiên (30%)</label>
                <input
                  type="text"
                  placeholder="Kafka, Redis, Docker, AWS"
                  value={createForm.preferredSkillsInput}
                  onChange={(e) => setCreateForm({ ...createForm, preferredSkillsInput: e.target.value })}
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 text-[#1F2933] focus:outline-none text-xs"
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

      {/* EDIT JOB MODAL */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-xl bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#E5E1D8] text-[#1F2933] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-bold text-[#1F2933]">Chỉnh Sửa Tin Tuyển Dụng</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Tiêu đề vị trí *</label>
                <input
                  type="text"
                  required
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1F2933] uppercase mb-1">Mức lương</label>
                  <input
                    type="text"
                    value={editingJob.salary}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1F2933] uppercase mb-1">Địa điểm</label>
                  <input
                    type="text"
                    value={editingJob.location}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933] focus:outline-none focus:border-[#F58220]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F2933] hover:bg-[#E5E1D8]/50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#F58220] hover:bg-[#E07216] shadow-sm transition-all cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
