import React, { useState, useEffect, useMemo } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { jobApi, applicationApi, aiMatchApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';
import { createHrToCandidateMailto } from '../utils/emailUtils';
import CvViewModal from '../components/common/CvViewModal';

export default function JobApplicantsRosterPage({ user, jobId = 101, onBackToJobs }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [viewingCvCandidate, setViewingCvCandidate] = useState(null);

  // State
  const [jobDetails, setJobDetails] = useState({
    id: jobId,
    title: 'Đang tải tin tuyển dụng...',
    subtitle: '',
    code: `JD-${jobId}`,
    statusBadge: 'Đang Tải',
    totalApplicants: 0,
    newToday: 0,
    topGoldCount: 0,
    avgScore: '0%',
    screenedProgress: '0/0',
    screenedPercent: '0%',
    mandatorySkills: [],
    preferredSkills: [],
  });

  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Stage options for dropdown
  const STAGE_OPTIONS = [
    { label: 'Duyệt Phỏng Vấn', stage: 'INTERVIEW', backendStatus: 'INTERVIEWING' },
    { label: 'Đang Xem Xét', stage: 'REVIEWING', backendStatus: 'SCREENING' },
    { label: 'Mới Nhận', stage: 'NEW', backendStatus: 'APPLIED' },
    { label: 'Đạt Yêu Cầu', stage: 'PASSED', backendStatus: 'OFFERED' },
    { label: 'Từ Chối', stage: 'REJECTED', backendStatus: 'REJECTED' },
  ];

  // Fetch job & candidates from Supabase PostgreSQL
  const loadJobAndApplicants = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch Job Info
      let currentJob = null;
      try {
        const jobRes = await jobApi.getJobById(jobId);
        if (jobRes?.data) currentJob = jobRes.data;
      } catch (err) {
        // Fallback: try finding in my jobs list
        try {
          const myJobsRes = await jobApi.getMyJobs();
          if (Array.isArray(myJobsRes?.data) && myJobsRes.data.length > 0) {
            currentJob = myJobsRes.data.find((j) => String(j.jobId) === String(jobId)) || myJobsRes.data[0];
          }
        } catch (ignored) {}
      }

      const activeJobId = currentJob?.jobId || jobId;

      // 2. Fetch Applications & AI Matches in parallel
      const [appsRes, matchesRes] = await Promise.allSettled([
        applicationApi.getJobApplications(activeJobId),
        aiMatchApi.getJobMatchesForRecruiter(activeJobId),
      ]);

      const rawApps = appsRes.status === 'fulfilled' && Array.isArray(appsRes.value?.data) ? appsRes.value.data : [];
      const rawMatches = matchesRes.status === 'fulfilled' && Array.isArray(matchesRes.value?.data) ? matchesRes.value.data : [];

      const matchMap = new Map();
      rawMatches.forEach((m) => {
        if (m.candidateId) matchMap.set(m.candidateId, m);
      });

      // 3. Map candidates with AI matching scores and chips
      const mappedCandidates = rawApps.map((app, idx) => {
        const match = matchMap.get(app.candidateId);
        const score = app.matchingScore || match?.matchingScore || 0;

        const mandatoryMatched = parseSkillList(match?.matchedMandatorySkills, []);
        const mandatoryMissing = parseSkillList(match?.missingMandatorySkills, []);
        const preferredMatched = parseSkillList(match?.matchedPreferredSkills, []);

        const techChips = [
          ...mandatoryMatched.map((s) => ({ name: s, highlight: true })),
          ...preferredMatched.map((s) => ({ name: s, highlight: false })),
          ...mandatoryMissing.map((s) => ({ name: `Thiếu: ${s}`, highlight: 'error' })),
        ];

        if (techChips.length === 0) {
          techChips.push({ name: 'Hồ sơ tuyển dụng AI', highlight: false });
        }

        const stage = app.status === 'APPLIED' ? 'NEW'
          : app.status === 'SCREENING' ? 'REVIEWING'
          : app.status === 'INTERVIEWING' ? 'INTERVIEW'
          : app.status === 'OFFERED' ? 'PASSED'
          : app.status === 'REJECTED' ? 'REJECTED'
          : 'NEW';

        const statusLabel = stage === 'NEW' ? 'Mới Nhận'
          : stage === 'REVIEWING' ? 'Đang Xem Xét'
          : stage === 'INTERVIEW' ? 'Duyệt Phỏng Vấn'
          : stage === 'PASSED' ? 'Đạt Yêu Cầu'
          : 'Từ Chối';

        const name = app.candidateName || `Ứng viên #${app.candidateId || idx + 1}`;
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .slice(-2)
          .join('')
          .toUpperCase() || 'UV';

        return {
          id: app.applicationId,
          applicationId: app.applicationId,
          candidateId: app.candidateId,
          rank: idx + 1,
          name: name,
          initials: initials,
          verified: true,
          role: app.candidateEmail || 'Ứng viên tiềm năng',
          email: app.candidateEmail || 'candidate@gmail.com',
          experience: app.coverLetter ? (app.coverLetter.length > 35 ? app.coverLetter.slice(0, 35) + '...' : app.coverLetter) : 'Hồ sơ đã qua thẩm định ATS',
          appliedTime: app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
          avatar: null,
          matchScore: score,
          matchCategory: score >= 85 ? 'Tối Ưu Tuyệt Đối' : score >= 70 ? 'Phù Hợp Tốt' : score >= 50 ? 'Cân Nhắc Kỹ' : 'Sai Lệch Kỹ Năng',
          techChips: techChips,
          aiQuote: match?.aiReasoning || app.coverLetter || 'Dữ liệu so khớp kỹ năng thực tế tính toán từ Supabase PostgreSQL.',
          stage: stage,
          statusLabel: statusLabel,
          isLowerScore: score < 60,
          cvId: app.cvId,
          cvUrl: app.cvUrl || '#',
        };
      });

      // 4. Update Job Details State
      const totalCount = mappedCandidates.length;
      const topGold = mappedCandidates.filter((c) => c.matchScore >= 90).length;
      const avgScore = totalCount > 0
        ? (mappedCandidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / totalCount).toFixed(1) + '%'
        : '0%';
      const screenedCount = mappedCandidates.filter((c) => c.stage !== 'NEW').length;
      const screenedPercent = totalCount > 0
        ? Math.round((screenedCount / totalCount) * 100) + '%'
        : '0%';

      const rawTitle = currentJob?.title || `Vị trí Tuyển Dụng #${activeJobId}`;
      const capitalizedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      const rawStatus = currentJob?.status || 'PUBLISHED';
      let statusBadge = 'Đang Mở Tuyển';
      if (rawStatus === 'CLOSED') {
        statusBadge = 'Đã Đóng Tuyển';
      } else if (rawStatus === 'DRAFT') {
        statusBadge = 'Bản Nháp';
      } else if (rawStatus === 'PENDING') {
        statusBadge = 'Chờ Duyệt';
      }

      setJobDetails({
        id: activeJobId,
        title: capitalizedTitle,
        subtitle: currentJob?.location ? `(${currentJob.location})` : '',
        code: `JD-${activeJobId}`,
        status: rawStatus,
        statusBadge: statusBadge,
        totalApplicants: totalCount,
        newToday: mappedCandidates.filter((c) => c.stage === 'NEW').length,
        topGoldCount: topGold,
        avgScore: avgScore,
        screenedProgress: `${screenedCount}/${totalCount}`,
        screenedPercent: screenedPercent,
        mandatorySkills: parseSkillList(currentJob?.requirements, []),
        preferredSkills: parseSkillList(currentJob?.benefits, []),
      });

      setCandidates(mappedCandidates);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ứng viên từ Supabase:', err);
      triggerToast('Lỗi khi tải danh sách ứng viên: ' + (err.message || 'Kiểm tra kết nối mạng'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobAndApplicants();
  }, [jobId]);

  // Stage change handler -> Persist to Supabase
  const handleStageChange = async (candidateAppId, newLabel) => {
    const matchedOption = STAGE_OPTIONS.find((opt) => opt.label === newLabel) || {
      stage: 'REVIEWING',
      backendStatus: 'SCREENING',
    };

    try {
      await applicationApi.updateStatus(candidateAppId, {
        newStatus: matchedOption.backendStatus,
        note: `Chuyển trạng thái sang "${newLabel}" bởi nhà tuyển dụng`,
      });

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateAppId
            ? { ...c, statusLabel: newLabel, stage: matchedOption.stage }
            : c
        )
      );
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast(`Đã chuyển trạng thái: "${newLabel}" & tự động gửi thông báo + email cho ứng viên!`);
    } catch (err) {
      triggerToast('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  // Recalculate AI matching
  const handleRecalculateAi = async () => {
    try {
      setIsRescanning(true);
      triggerToast('Đang yêu cầu AI quét lại điểm Match toàn bộ ứng viên theo tiêu chí 70/30...');
      await aiMatchApi.recalculateMatchesForJob(jobDetails.id);
      await loadJobAndApplicants();
      triggerToast('Đã hoàn tất tính toán lại điểm AI Match và đồng bộ vào Supabase!');
    } catch (err) {
      triggerToast('Lỗi khi quét lại AI: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRescanning(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      triggerToast('Đang chuẩn bị xuất file Excel danh sách ứng viên...');
      const response = await applicationApi.exportJobApplicationsCsv(jobDetails.id);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DS_Ung_Vien_${jobDetails.code}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      triggerToast('Đã tải xuống file Excel danh sách ứng viên thành công!');
    } catch (err) {
      triggerToast('Lỗi xuất file Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsExporting(false);
    }
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
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCandidates = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredCandidates.slice(start, start + PAGE_SIZE);
  }, [filteredCandidates, validCurrentPage]);

  return (
    <div className="recruiter-page w-full bg-slate-50/60 font-sans text-slate-800 antialiased min-h-screen pb-16 selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#221d47] text-white border border-purple-400/30 text-xs font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ambient Gradient Glows */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Main Workspace Container */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 relative z-10">
          
          {/* ======================================================== */}
          {/* NAVIGATION & ACTION HEADER                               */}
          {/* ======================================================== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-slate-500 tracking-wider uppercase flex-wrap">
                <a
                  href="#/recruiter-jobs"
                  className="hover:text-purple-700 transition-colors cursor-pointer"
                >
                  Quản Lý Tin Tuyển Dụng
                </a>
                <span>/</span>
                <a
                  href={`#/jobs/${jobDetails.id}`}
                  className="hover:text-purple-700 transition-colors cursor-pointer text-slate-700 font-medium"
                  title="Xem chi tiết bài đăng đã xuất bản"
                >
                  {jobDetails.title}
                </a>
                <span>/</span>
                <span className="text-purple-700 font-semibold">Danh sách ứng viên ({jobDetails.totalApplicants} hồ sơ)</span>
              </div>

              {/* Job Title Context */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  {jobDetails.title} <span className="text-purple-600 font-medium text-xl">{jobDetails.subtitle}</span>
                </h1>
                {jobDetails.status === 'CLOSED' ? (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-300 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Đã Đóng Tuyển
                  </span>
                ) : jobDetails.status === 'DRAFT' ? (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Bản Nháp
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang Mở Tuyển
                  </span>
                )}
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Mã: {jobDetails.code}</span>
              </div>
            </div>

            {/* Back & View Job Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleRecalculateAi}
                disabled={isRescanning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer"
                title="Yêu cầu AI quét lại điểm matching 70/30 cho toàn bộ ứng viên"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRescanning ? 'animate-spin' : ''}`}>
                  auto_awesome
                </span>
                <span>{isRescanning ? 'Đang Quét AI...' : 'Quét Lại AI (70/30)'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
                title="Tải bảng danh sách ứng viên và kết quả đánh giá ra file Excel/CSV"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">table_chart</span>
                <span>{isExporting ? 'Đang Xuất File...' : 'Xuất File Excel (DS Ứng Viên)'}</span>
              </button>

              <a
                href={`#/jobs/${jobDetails.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-xs"
                title="Mở xem bản mô tả công việc (JD) đăng tuyển trên hệ thống"
              >
                <span className="material-symbols-outlined text-[16px] text-purple-600">description</span>
                <span>Xem Bản Tin Tuyển Dụng (JD)</span>
                <span className="material-symbols-outlined text-[13px] text-slate-400">open_in_new</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onBackToJobs) onBackToJobs();
                  else window.location.hash = '#/recruiter-jobs';
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-purple-700 transition-all border border-slate-200 cursor-pointer shadow-xs"
                title="Quay lại danh sách các tin tuyển dụng của công ty"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Tất Cả Tin Tuyển Dụng</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KPI METRICS STRIP (4 CARDS)                              */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#5b48bd] shrink-0">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tổng hồ sơ</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">{jobDetails.totalApplicants}</span>
                  <span className="text-[11px] text-purple-600 font-semibold">từ Supabase DB</span>
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Đề cử cao cấp (&ge;90%)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-amber-600">
                    {jobDetails.topGoldCount < 10 ? `0${jobDetails.topGoldCount}` : jobDetails.topGoldCount}
                  </span>
                  <span className="text-[11px] text-slate-500">Ứng viên vàng</span>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">query_stats</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Match Score TB</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">{jobDetails.avgScore}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Chuẩn 70/30</span>
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">task_alt</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tiến độ sàng lọc</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">
                    {jobDetails.screenedProgress}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-bold">{jobDetails.screenedPercent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* AI RANKING LEADERBOARD — TOP ỨNG VIÊN ĐƯỢC ĐỀ CỬ         */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-purple-50/20 to-indigo-50/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    Bảng Xếp Hạng AI — Top Ứng Viên Được Đề Cử
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xếp hạng tự động theo công thức HireMate: 70% Kỹ năng bắt buộc + 30% Kỹ năng ưu tiên
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đồng bộ realtime Supabase
              </span>
            </div>

            {/* Rank Rows */}
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <LoadingSpinner />
                <p className="mt-2 font-medium">Đang đồng bộ dữ liệu AI từ cơ sở dữ liệu...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Chưa có ứng viên nào ứng tuyển vào vị trí này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...candidates]
                  .sort((a, b) => b.matchScore - a.matchScore)
                  .slice(0, 5)
                  .map((cand, idx) => {
                    const rankMedalStyle = idx === 0 
                      ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 border-amber-300 shadow-xs'
                      : idx === 1
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : idx === 2
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200';
                    const rankLabel = ['🥇', '🥈', '🥉', '#4', '#5'][idx] || `#${idx + 1}`;
                    return (
                      <div key={cand.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-purple-50/40 transition-colors relative group">
                        {/* Rank Medal */}
                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border ${rankMedalStyle}`}>
                          {rankLabel}
                        </div>

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {cand.avatar ? (
                            <img className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shadow-xs" src={cand.avatar} alt={cand.name} />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold text-sm border border-purple-200">
                              {cand.initials}
                            </div>
                          )}
                          {cand.verified && (
                            <span className="absolute -top-1 -right-1 material-symbols-outlined text-[13px] text-emerald-600 bg-white rounded-full">verified</span>
                          )}
                        </div>

                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                              {cand.name}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {cand.matchScore}% AI
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">{cand.role}</div>
                          {/* Score bar */}
                          <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 to-emerald-500"
                              style={{ width: `${cand.matchScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Match Category + Quick action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline-block text-xs font-medium px-3 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                            {cand.matchCategory}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}`;
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-700 border border-slate-200 hover:border-purple-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[15px] text-purple-600">person_search</span>
                            <span>Xem hồ sơ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Hiển thị top 5 / {candidates.length} ứng viên &bull; Sắp xếp theo AI Match Score (70/30)
              </span>
              <button
                type="button"
                onClick={() => setIsAiSortDescending(true)}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Xem đầy đủ danh sách bên dưới</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CONTROLS PANEL (TABS + FILTER + SORT BAR)                */}
          {/* ======================================================== */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" id="filter-tabs">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                Tất cả <span className="ml-1 opacity-80">{candidates.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('NEW')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'NEW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Mới nộp <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'NEW').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REVIEWING')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'REVIEWING'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-cyan-700 hover:bg-cyan-50'
                }`}
              >
                Đang xem <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'REVIEWING').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('INTERVIEW')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'INTERVIEW'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                Phỏng vấn <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'INTERVIEW').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('PASSED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'PASSED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Đạt yêu cầu <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'PASSED').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REJECTED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                Từ chối <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'REJECTED').length}</span>
              </button>
            </div>

            {/* Search & AI Sort Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex items-center min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kỹ năng, tên, email..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-white transition-all border border-slate-200"
                />
              </div>

              {/* AI Sort Toggle */}
              <div
                onClick={() => setIsAiSortDescending(!isAiSortDescending)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none border border-slate-200 transition-colors"
                id="ai-sort-toggle"
              >
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">insights</span>
                  <span>{isAiSortDescending ? 'AI Match: Cao → Thấp' : 'AI Match: Thấp → Cao'}</span>
                </span>
                <div className="w-8 h-4 bg-purple-200 rounded-full flex items-center p-0.5">
                  <div
                    className={`w-3 h-3 bg-[#5b48bd] rounded-full shadow-xs transition-transform ${
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
            {isLoading ? (
              <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <LoadingSpinner />
                <h3 className="text-sm font-bold text-slate-900">Đang tải hồ sơ ứng viên từ Supabase...</h3>
                <p className="text-xs text-slate-500">Hệ thống đang đồng bộ danh sách ứng tuyển và kết quả đối soát AI matching chuẩn 70/30.</p>
              </div>
            ) : paginatedCandidates.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-400">person_search</span>
                <h3 className="text-base font-bold text-slate-900">Không tìm thấy hồ sơ phù hợp</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Không có ứng viên nào khớp với bộ lọc hoặc từ khoá tìm kiếm của bạn. Hãy thử thay đổi bộ lọc trạng thái hoặc từ khoá.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#221d47] hover:bg-purple-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Xoá bộ lọc &amp; xem tất cả
                </button>
              </div>
            ) : (
              paginatedCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className={`p-6 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-all shadow-sm hover:shadow-md hover:border-purple-300 group border border-slate-200/90 bg-white ${
                    cand.isLowerScore ? 'opacity-90' : ''
                  }`}
                >
                  {/* Col 1: Identity & Credentials */}
                  <div 
                    onClick={() => {
                      window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}`;
                    }}
                    className="flex items-start gap-4 min-w-0 xl:w-5/12 cursor-pointer"
                    title="Nhấp để xem hồ sơ và CV chi tiết của ứng viên này"
                  >
                    <div className="relative shrink-0">
                      {cand.avatar ? (
                        <img
                          className="w-14 h-14 rounded-2xl object-cover ring-1 ring-slate-200 group-hover:ring-purple-400 transition-all shadow-xs"
                          src={cand.avatar}
                          alt={`Portrait of ${cand.name}`}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold text-lg ring-1 ring-purple-200">
                          {cand.initials}
                        </div>
                      )}

                      {cand.rank && (
                        <span
                          className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cand.rank === 1
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          #{cand.rank} Top
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                          {cand.name}
                        </span>
                        {cand.verified && (
                          <span className="material-symbols-outlined text-[16px] text-emerald-600" title="Đã xác thực hồ sơ">
                            verified
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[14px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          open_in_new
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                        {cand.role}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-purple-600">description</span>
                          <span className="truncate max-w-[140px]">{cand.experience}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                          <span>{cand.appliedTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Match Badge & Tech Stack Chips */}
                  <div className="flex flex-col gap-2.5 xl:w-4/12">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                          cand.matchScore >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                            : cand.matchScore >= 65
                            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {cand.matchScore >= 80 ? 'verified' : cand.matchScore >= 65 ? 'insights' : 'warning'}
                        </span>
                        <span className="text-xs font-bold tracking-wide">
                          {cand.matchScore}% AI Match
                        </span>
                      </div>

                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
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
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                              : chip.highlight === 'error'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-purple-50/70 text-purple-800 border-purple-200'
                          }`}
                        >
                          {chip.name}
                        </span>
                      ))}
                    </div>

                    {/* AI Copilot Talent Assessment Box */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white border border-purple-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5b48bd] uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[15px] text-[#5b48bd]">auto_awesome</span>
                          Đánh Giá Tuyển Dụng AI (Chuẩn 70/30)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5b48bd]">
                          HireMate Copilot
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 line-clamp-3">
                        {cand.aiQuote}
                      </p>
                    </div>
                  </div>

                  {/* Col 3: Actions & Status Management */}
                  <div className="flex items-center justify-between xl:justify-end gap-2.5 shrink-0 xl:w-4/12 flex-wrap sm:flex-nowrap">
                    {/* Direct Email to Candidate */}
                    <a
                      href={createHrToCandidateMailto({
                        candidateEmail: cand.email || cand.role,
                        candidateName: cand.name,
                        jobTitle: jobDetails.title,
                        companyName: user?.companyName || user?.company?.companyName || 'Công ty Tuyển dụng',
                        hrName: user?.fullName || user?.name || 'Bộ phận Tuyển dụng',
                        hrPosition: user?.position || 'Talent Acquisition Team',
                      })}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 flex items-center gap-1.5 shadow-2xs shrink-0"
                      title="Gửi email trực tiếp cho ứng viên này"
                    >
                      <span>✉️ Gửi Email cho Ứng viên</span>
                    </a>

                    {/* Direct Quick View CV Modal */}
                    <button
                      type="button"
                      onClick={() => setViewingCvCandidate(cand)}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs shrink-0"
                      title="Mở xem trực tiếp bản CV ứng viên đã nộp"
                    >
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">picture_as_pdf</span>
                      <span>Xem CV</span>
                    </button>

                    {/* View CV & Profile Button */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}`;
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-gradient-to-r from-[#221d47] to-[#5b48bd] hover:from-[#1b1739] hover:to-[#47369f] text-white shadow-sm hover:shadow flex items-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      <span>Hồ Sơ &amp; CV</span>
                    </button>

                    {/* Stage Dropdown */}
                    <div className="relative">
                      <select
                        value={cand.statusLabel}
                        onChange={(e) => handleStageChange(cand.id, e.target.value)}
                        className="appearance-none bg-slate-50 hover:bg-white text-xs font-semibold py-2 pl-3.5 pr-8 rounded-xl cursor-pointer focus:outline-none border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-slate-800 transition-all shadow-xs"
                      >
                        {STAGE_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt.label} className="bg-white text-slate-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-2 text-[16px] pointer-events-none text-slate-400">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Hiển thị {filteredCandidates.length === 0 ? 0 : (validCurrentPage - 1) * PAGE_SIZE + 1} - {Math.min(validCurrentPage * PAGE_SIZE, filteredCandidates.length)} trên tổng số <strong className="text-slate-800">{filteredCandidates.length}</strong> ứng viên đã lọc ({jobDetails.totalApplicants} tổng hồ sơ)
            </div>

            {/* Segmented Page Controller */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  validCurrentPage <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
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
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                    validCurrentPage === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  validCurrentPage >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 text-slate-800">
            <button
              onClick={() => setSelectedCandidateForModal(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            {/* Candidate Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              {selectedCandidateForModal.avatar ? (
                <img
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200 shadow-sm"
                  src={selectedCandidateForModal.avatar}
                  alt={selectedCandidateForModal.name}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold text-2xl border border-purple-200">
                  {selectedCandidateForModal.initials}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedCandidateForModal.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    {selectedCandidateForModal.matchScore}% AI Match
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCandidateForModal.role}</p>
                <p className="text-[11px] text-purple-700 font-semibold">{selectedCandidateForModal.appliedTime}</p>
              </div>
            </div>

            {/* AI Copilot Breakdown */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5b48bd] uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-[#5b48bd]">auto_awesome</span>
                Đánh Giá Tương Thích Tuyển Dụng AI (Chuẩn 70/30)
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                {selectedCandidateForModal.aiQuote}
              </p>
            </div>

            {/* Skills & Experience */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kỹ Năng Cốt Lõi Khớp Với JD
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedCandidateForModal.techChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      chip.highlight === true
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                        : chip.highlight === 'error'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {chip.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Attached CV Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500 text-2xl">picture_as_pdf</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">CV_{selectedCandidateForModal.name.replace(/\s+/g, '_')}.pdf</div>
                  <div className="text-[11px] text-slate-500 font-mono">Đã qua phân tích ATS</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCvCandidate(selectedCandidateForModal)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>Mở Xem CV</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCandidateForModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  handleStageChange(selectedCandidateForModal.id, 'Duyệt Phỏng Vấn');
                  setSelectedCandidateForModal(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Xác Nhận Mời Phỏng Vấn
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Submitted CV View & Download Modal */}
      {viewingCvCandidate && (
        <CvViewModal
          isOpen={!!viewingCvCandidate}
          onClose={() => setViewingCvCandidate(null)}
          cvId={viewingCvCandidate.cvId}
          cvUrl={viewingCvCandidate.cvUrl}
          fileName={`CV_${viewingCvCandidate.name?.replace(/\s+/g, '_')}.pdf`}
          candidateName={viewingCvCandidate.name}
          atsScore={viewingCvCandidate.matchScore}
        />
      )}
    </div>
  );
}

