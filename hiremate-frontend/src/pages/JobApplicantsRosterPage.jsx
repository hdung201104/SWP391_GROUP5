import React, { useState, useMemo } from 'react';

const JOB_MAP = {
  101: {
    id: 101,
    title: 'Senior Backend Engineer',
    subtitle: '(Java / Distributed Systems)',
    code: 'JD-BNK-882',
    statusBadge: 'Đang Tuyển Gấp',
    totalApplicants: 24,
    newToday: 6,
    topGoldCount: 5,
    avgScore: '91.4%',
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
    avgScore: '87.2%',
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
    avgScore: '82.8%',
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
    avgScore: '94.0%',
  },
};

export default function JobApplicantsRosterPage({ user, jobId = 101, onBackToJobs }) {
  const jobDetails = JOB_MAP[jobId] || JOB_MAP[101];

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSortDescending, setIsAiSortDescending] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([1, 2]);

  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const [candidates, setCandidates] = useState([
    {
      id: 1,
      name: 'Trần Bảo Long',
      role: 'Senior Backend Engineer • Ex-FPT Software',
      experience: '6 năm KN',
      appliedTime: 'Nộp 25/09 14:30',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      matchScore: 94,
      matchCategory: 'XUẤT SẮC',
      skills: ['Java 21', 'Spring Boot 3', 'Kafka 50k RPS', 'PostgreSQL'],
      aiAnalysis: 'Khớp 100% kỹ năng bắt buộc. Đã có kinh nghiệm thực chiến với hệ thống ngân hàng chịu tải lớn.',
      stage: 'INTERVIEW',
      statusLabel: 'Mời Phỏng Vấn',
    },
    {
      id: 2,
      name: 'Lê Hoàng Nam',
      role: 'Lead Backend Engineer • VNG Corp',
      experience: '7.5 năm KN',
      appliedTime: 'Nộp 25/09 09:15',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      matchScore: 89,
      matchCategory: 'ƯU TÚ',
      skills: ['Java Core', 'Microservices', 'AWS Arch', 'Kafka'],
      aiAnalysis: 'Kinh nghiệm quản lý team 8 người. Khớp toàn bộ 70% tiêu chí bắt buộc và chứng chỉ AWS.',
      stage: 'REVIEWING',
      statusLabel: 'Đang Xem Xét',
    },
    {
      id: 3,
      name: 'Nguyễn Quốc Huy',
      role: 'Senior Java Dev • TMA Solutions',
      experience: '5 năm KN',
      appliedTime: 'Nộp 24/09 18:40',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      matchScore: 78,
      matchCategory: 'ĐẠT CHUẨN',
      skills: ['Java 17', 'Spring Boot', 'Docker', 'MySQL'],
      aiAnalysis: 'Đáp ứng tốt kiến thức Java Spring, cần kiểm tra sâu hơn về Kafka cluster trong vòng phỏng vấn.',
      stage: 'NEW',
      statusLabel: 'Mới Nhận',
    },
    {
      id: 4,
      name: 'Đỗ Minh Tuấn',
      role: 'Java Developer • CMC Global',
      experience: '3.5 năm KN',
      appliedTime: 'Nộp 23/09 11:20',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      matchScore: 65,
      matchCategory: 'TIỀM NĂNG',
      skills: ['Java Core', 'Spring Boot', 'MySQL'],
      aiAnalysis: 'Nền tảng cơ bản vững, cần bổ sung kinh nghiệm xử lý hệ thống phân tán chịu tải cao.',
      stage: 'REVIEWING',
      statusLabel: 'Đang Xem Xét',
    },
  ]);

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    triggerToast(
      bookmarkedIds.includes(id)
        ? 'Đã bỏ đánh dấu ứng viên'
        : 'Đã đánh dấu ứng viên tiềm năng'
    );
  };

  const handleStageChange = (candidateId, newLabel) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, statusLabel: newLabel } : c))
    );
    triggerToast(`Đã cập nhật trạng thái ứng viên sang: "${newLabel}"`);
  };

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    if (activeFilter === 'NEW') list = list.filter((c) => c.stage === 'NEW');
    if (activeFilter === 'REVIEWING') list = list.filter((c) => c.stage === 'REVIEWING');
    if (activeFilter === 'INTERVIEW') list = list.filter((c) => c.stage === 'INTERVIEW');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) =>
      isAiSortDescending ? b.matchScore - a.matchScore : a.matchScore - b.matchScore
    );

    return list;
  }, [candidates, activeFilter, searchQuery, isAiSortDescending]);

  return (
    <div className="w-full bg-[#FAF9F6] text-[#1F2933] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2933] text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-fade-in">
          <span className="material-symbols-outlined text-[#C27B66] text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
              <button
                onClick={() => {
                  if (onBackToJobs) onBackToJobs();
                  else window.location.hash = '#/recruiter-jobs';
                }}
                className="hover:text-[#C27B66] cursor-pointer font-semibold"
              >
                &larr; Quản lý tin tuyển dụng
              </button>
              <span>/</span>
              <span>{jobDetails.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2933]">
              Ứng viên
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              AI tự động phân tích mức độ phù hợp giữa ứng viên và yêu cầu tuyển dụng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiSortDescending(!isAiSortDescending)}
              className="bg-white hover:bg-[#FAF9F6] text-[#1F2933] border border-[#E5E1D8] text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-[#C27B66]">sort</span>
              <span>Sắp xếp AI Match: {isAiSortDescending ? 'Cao -> Thấp' : 'Thấp -> Cao'}</span>
            </button>
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
              className="w-full bg-[#FAF9F6] text-[#1F2933] placeholder-[#6B7280] text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] focus:outline-none focus:border-[#C27B66]"
              placeholder="Tìm theo tên ứng viên, vị trí, kỹ năng..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'Tất cả ứng viên' },
              { id: 'NEW', label: 'Mới nộp' },
              { id: 'REVIEWING', label: 'Đang xem xét' },
              { id: 'INTERVIEW', label: 'Lịch phỏng vấn' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#1F2933] text-white shadow-sm'
                    : 'bg-[#FAF9F6] text-[#6B7280] hover:text-[#1F2933] border border-[#E5E1D8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => {
            const isBookmarked = bookmarkedIds.includes(candidate.id);
            return (
              <div
                key={candidate.id}
                className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm hover:border-[#C27B66]/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={candidate.avatar}
                    alt={candidate.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#E5E1D8] shrink-0"
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-lg text-[#1F2933]">{candidate.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF0ED] text-[#C27B66] border border-[#C27B66]/30">
                        {candidate.matchScore}% AI Match
                      </span>
                      <span className="text-xs text-[#6B7280]">{candidate.experience}</span>
                    </div>

                    <p className="text-xs text-[#6B7280] font-medium">{candidate.role}</p>

                    {/* Matching Skills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {candidate.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF9F6] text-[#1F2933] border border-[#E5E1D8]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* AI Quick Insight */}
                    <p className="text-xs text-[#6B7280] pt-1 leading-relaxed">
                      <strong className="text-[#1F2933]">Phân tích AI:</strong> {candidate.aiAnalysis}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col items-end justify-between gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E1D8] shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBookmark(candidate.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-[#FAF0ED] text-[#C27B66] border-[#C27B66]/40'
                          : 'bg-[#FAF9F6] text-[#6B7280] border-[#E5E1D8] hover:text-[#1F2933]'
                      }`}
                      title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu ứng viên'}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isBookmarked ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        window.location.hash = `#/candidate-evaluation?candidateId=${candidate.id}&jobId=${jobDetails.id}`;
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1F2933] hover:bg-[#323D47] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Xem hồ sơ &rarr;
                    </button>

                    <button
                      onClick={() => {
                        handleStageChange(candidate.id, 'Mời Phỏng Vấn');
                        triggerToast(`Đã gửi lời mời phỏng vấn tới ứng viên ${candidate.name}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#C27B66] hover:bg-[#A86552] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Mời phỏng vấn
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCandidates.length === 0 && (
            <div className="py-16 text-center text-sm text-[#6B7280] bg-white border border-[#E5E1D8] rounded-2xl">
              Không tìm thấy ứng viên phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
