import React, { useState, useEffect, useMemo } from 'react';
import { applicationApi, jobApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';
import { getSavedJobs, toggleSaveJob } from '../utils/savedJobsStorage';
import { createCandidateToHrMailto } from '../utils/emailUtils';
import JobDetailModal from '../components/jobs/JobDetailModal';
import CvViewModal from '../components/common/CvViewModal';

// Brand logos helper for realistic corporate presence
const getBrandLogo = (companyName = '', logoUrl = null) => {
  if (logoUrl && logoUrl !== '#' && !logoUrl.includes('placeholder')) return logoUrl;
  const name = (companyName || '').toLowerCase();
  if (name.includes('fpt software')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-FPT-Software.png';
  }
  if (name.includes('fpt')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo.svg/1200px-FPT_logo.svg.png';
  }
  if (name.includes('vng')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VNG.png';
  }
  if (name.includes('viettel')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Viettel.png';
  }
  return null;
};

// Chuẩn hoá trạng thái từ backend enum (APPLIED, SCREENING, SHORTLISTED, INTERVIEWING, OFFERED, HIRED, REJECTED)
const normalizeApplicationStatus = (rawStatus) => {
  if (!rawStatus) return 'APPLIED';
  const s = String(rawStatus).toUpperCase().trim();
  if (s === 'INTERVIEWING' || s === 'INTERVIEW') return 'INTERVIEW';
  if (s === 'OFFERED' || s === 'OFFER' || s === 'HIRED') return 'OFFER';
  if (s === 'SCREENING' || s === 'SHORTLISTED') return 'SCREENING';
  if (s === 'REJECTED') return 'REJECTED';
  return 'APPLIED';
};

export default function CandidateApplicationsPage({ user }) {
  const { theme: livingTheme } = useLivingTheme();
  const [applications, setApplications] = useState(() => {
    try {
      const cached = sessionStorage.getItem('hiremate_cached_applications');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('hiremate_cached_applications');
      return !cached;
    } catch {
      return true;
    }
  });
  const [activeFilter, setActiveFilter] = useState(() => {
    const hash = window.location.hash || '';
    if (hash.includes('tab=saved')) return 'SAVED';
    return 'ALL';
  }); // 'ALL' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'SAVED'
  const [savedJobs, setSavedJobs] = useState(() => getSavedJobs());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RECENT'); // 'RECENT' | 'MATCH' | 'ACTION'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Pagination states for Candidate Applications List
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, sortBy]);

  // Modals and feedback state
  const [activeModal, setActiveModal] = useState(null); // 'OFFER' | 'INVITATION'
  const [modalData, setModalData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [offerSigned, setOfferSigned] = useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [selectedCvForModal, setSelectedCvForModal] = useState(null);

  useEffect(() => {
    const handleUrlHash = () => {
      const hash = window.location.hash || '';
      if (hash.includes('tab=saved')) {
        setActiveFilter('SAVED');
      }
    };
    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);

    const updateSaved = () => {
      setSavedJobs(getSavedJobs());
    };

    window.addEventListener('hiremate_saved_jobs_updated', updateSaved);
    window.addEventListener('storage', updateSaved);
    return () => {
      window.removeEventListener('hashchange', handleUrlHash);
      window.removeEventListener('hiremate_saved_jobs_updated', updateSaved);
      window.removeEventListener('storage', updateSaved);
    };
  }, []);

  const fetchMyApplications = (silent = false) => {
    if (!silent) setLoading(true);
    applicationApi
      .getMyApplications()
      .then((res) => {
        const rawList = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map((app, idx) => {
            const comp =
              app.job?.company?.companyName || app.companyName || 'Doanh Nghiệp Tuyển Dụng';
            const compShort =
              comp
                .replace(/[^a-zA-Z0-9\s]/g, '')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase() || 'CORP';
            const rawStatus = app.status || 'APPLIED';
            const st = normalizeApplicationStatus(rawStatus);
            const step = st === 'OFFER' ? 4 : st === 'INTERVIEW' ? 3 : st === 'SCREENING' ? 2 : 1;
            const appliedDate = app.createdAt
              ? new Date(app.createdAt).toLocaleDateString('vi-VN')
              : 'Mới nộp';
            const matchScore =
              app.matchingScore != null
                ? Math.round(app.matchingScore)
                : app.aiMatch != null
                ? Math.round(app.aiMatch)
                : null;

            return {
              id: app.applicationId || idx + 1,
              company: comp,
              companyShort: compShort,
              division: app.job?.company?.industry
                ? `Lĩnh vực: ${app.job.company.industry}`
                : 'Doanh nghiệp tuyển dụng trực tuyến',
              title: app.job?.title || app.jobTitle || 'Vị trí Ứng Tuyển',
              salary:
                app.job?.salaryMin && app.job?.salaryMax
                  ? `$${app.job.salaryMin} - $${app.job.salaryMax}/tháng`
                  : 'Theo thỏa thuận',
              location: app.job?.location || 'Việt Nam',
              appliedDate,
              aiMatch: matchScore,
              cvId: app.cvId || app.cv?.cvId || app.cv?.id,
              cvUrl: app.cvUrl || app.cv?.fileUrl || app.cv?.url,
              cvUsed:
                app.cv?.fileName || (app.cvUrl ? app.cvUrl.split('/').pop() : 'CV_Ung_Vien.pdf'),
              atsScore: matchScore != null ? matchScore : null,
              responseNotice:
                st === 'OFFER'
                  ? 'Đã Nhận Thư Mời Nhận Việc (Offer)'
                  : st === 'INTERVIEW'
                  ? 'Đã Vào Vòng Phỏng Vấn Tuyển Dụng'
                  : st === 'REJECTED'
                  ? 'Hồ sơ chưa phù hợp trong đợt tuyển này'
                  : st === 'SCREENING'
                  ? 'Hồ sơ đang trong quá trình xét duyệt'
                  : 'Hồ sơ đã nộp thành công qua hệ thống',
              status: st,
              rawStatus: rawStatus,
              statusLabel:
                st === 'OFFER'
                  ? 'Đã Nhận Offer'
                  : st === 'INTERVIEW'
                  ? 'Vòng Phỏng Vấn'
                  : st === 'SCREENING'
                  ? 'Đang Duyệt CV'
                  : st === 'REJECTED'
                  ? 'Chưa Phù Hợp'
                  : 'Đã Nộp Hồ Sơ',
              currentStep: step,
              steps: [
                { step: 1, title: 'Đã Nộp', date: appliedDate, status: 'completed' },
                {
                  step: 2,
                  title: 'Thẩm Định CV',
                  date: matchScore ? `Match ${matchScore}%` : 'Đang xử lý',
                  status: step >= 2 ? 'completed' : 'active',
                },
                {
                  step: 3,
                  title: 'Phỏng Vấn',
                  date: step > 3 ? 'Đã phỏng vấn' : step === 3 ? 'Mời phỏng vấn HR' : 'Phỏng vấn với HR',
                  status: step > 3 ? 'completed' : step === 3 ? 'active' : 'pending',
                },
                {
                  step: 4,
                  title: 'Nhận Offer',
                  date: step === 4 ? 'Đã có Offer' : 'Kết quả',
                  status: step === 4 ? 'completed' : 'pending',
                },
              ],
              recruiter: {
                name: app.recruiterName || app.job?.recruiter?.user?.fullName || 'Bộ Phận Tuyển Dụng',
                role: app.job?.recruiter?.position || 'Talent Acquisition Team',
                email: app.recruiterEmail || app.job?.recruiter?.user?.email || 'tuyendung@fpt.com',
              },
              recruiterName: app.recruiterName || app.job?.recruiter?.user?.fullName || 'Bộ Phận Tuyển Dụng',
              recruiterEmail: app.recruiterEmail || app.job?.recruiter?.user?.email || 'tuyendung@fpt.com',
              jobId: app.job?.jobId || app.jobId,
            };
          });
          setApplications(mapped);
          try {
            sessionStorage.setItem('hiremate_cached_applications', JSON.stringify(mapped));
          } catch {}
        } else {
          setApplications([]);
          try {
            sessionStorage.setItem('hiremate_cached_applications', JSON.stringify([]));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('Could not load applications from backend:', err);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    // If cached applications exist, fetch silently in background to avoid blocking spinner
    const hasCached = (() => {
      try {
        return !!sessionStorage.getItem('hiremate_cached_applications');
      } catch {
        return false;
      }
    })();

    fetchMyApplications(hasCached);

    // Throttled sync: Đồng bộ khi nhận thông báo trạng thái hoặc quay lại tab (tối đa 1 lần / 15s)
    let lastFocusSync = Date.now();
    const handleSync = () => {
      const now = Date.now();
      if (now - lastFocusSync > 15000) {
        lastFocusSync = now;
        fetchMyApplications(true);
      }
    };

    window.addEventListener('hiremate-notification-sync', handleSync);
    window.addEventListener('focus', handleSync);

    // Tự động kiểm tra cập nhật mỗi 60 giây (đồng bộ theo chu kỳ nền, tránh nghẽn pool kết nối)
    const interval = setInterval(() => {
      fetchMyApplications(true);
    }, 60000);

    return () => {
      window.removeEventListener('hiremate-notification-sync', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, []);


  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenOfferModal = (app) => {
    setModalData(app);
    setActiveModal('OFFER');
  };

  const handleOpenInvitationModal = (app) => {
    setModalData(app);
    setActiveModal('INVITATION');
  };

  const handleOpenJobModal = (app) => {
    const jId = app.jobId || app.job?.jobId;
    if (jId) {
      window.location.hash = `#/jobs/${jId}`;
    }
  };

  const handleOpenCvModal = (app) => {
    setSelectedCvForModal({
      cvId: app.cvId,
      cvUrl: app.cvUrl,
      fileName: app.cvUsed || 'CV_Ung_Vien.pdf',
      candidateName: user?.fullName || 'Ứng viên',
      atsScore: app.atsScore,
    });
  };

  const handleSignOffer = () => {
    setOfferSigned(true);
    showToast('🎉 Bạn đã ký chấp thuận lời mời nhận việc thành công!');
    setTimeout(() => {
      setActiveModal(null);
      setOfferSigned(false);
    }, 1800);
  };

  // Filter & Search Logic
  const filteredApps = applications
    .filter((app) => {
      let matchesFilter = true;
      if (activeFilter === 'SCREENING') {
        matchesFilter = app.status === 'APPLIED' || app.status === 'SCREENING';
      } else if (activeFilter !== 'ALL') {
        matchesFilter = app.status === activeFilter;
      }
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || app.company.toLowerCase().includes(q) || app.title.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'MATCH') return (b.aiMatch || 0) - (a.aiMatch || 0);
      if (sortBy === 'ACTION') {
        const priority = { OFFER: 4, INTERVIEW: 3, SCREENING: 2, APPLIED: 1, REJECTED: 0 };
        return (priority[b.status] || 0) - (priority[a.status] || 0);
      }
      return b.id - a.id;
    });

  // Paginated Applications calculation
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedApps = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredApps.slice(start, start + PAGE_SIZE);
  }, [filteredApps, validCurrentPage, PAGE_SIZE]);

  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
  const offerCount = applications.filter((a) => a.status === 'OFFER').length;
  const screeningCount = applications.filter(
    (a) => a.status === 'APPLIED' || a.status === 'SCREENING'
  ).length;

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-[#221d47] text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce border border-purple-400/30">
          <span className="material-symbols-outlined text-sm text-[#10b981]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HERO HEADER: CLEAN, PROFESSIONAL & ELEGANT             */}
      {/* ========================================================= */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/70 text-[#5b48bd] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>Hồ Sơ &amp; Tiến Trình Tuyển Dụng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
            Quản Lý Đơn Ứng Tuyển
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Theo dõi tình trạng hồ sơ đã gửi, đối thoại trực tiếp 2 chiều với Bộ Phận Tuyển Dụng và chuẩn bị lịch phỏng vấn thông minh.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <a
            href="#/ai-interview"
            className="px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-xs border border-purple-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-[#5b48bd]">psychology</span>
            <span>Luyện Phỏng Vấn AI</span>
          </a>
          <a
            href="#/"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#221d47] to-[#5b48bd] hover:from-[#1b1739] hover:to-[#47369f] text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-base">travel_explore</span>
            <span>Tìm Việc Làm Mới</span>
          </a>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. REFINED FILTER BAR & CONTROLS                          */}
      {/* ========================================================= */}
      <section className="p-4 sm:p-5 rounded-3xl bg-white border border-purple-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#f8f7ff] border border-purple-100 rounded-2xl text-[#1e1b4b] font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100 transition-all"
            placeholder="Tìm theo tên công ty hoặc vị trí ứng tuyển..."
            type="text"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'ALL'
                ? 'bg-[#5b48bd] text-white shadow-sm'
                : 'bg-[#f8f7ff] text-slate-700 hover:bg-purple-50 hover:text-[#5b48bd] border border-purple-100/60'
            }`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-inherit font-extrabold">
              {applications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('SCREENING')}
            className={`px-3.5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'SCREENING'
                ? 'bg-[#5b48bd] text-white shadow-sm'
                : 'bg-[#f8f7ff] text-slate-700 hover:bg-purple-50 hover:text-[#5b48bd] border border-purple-100/60'
            }`}
          >
            <span>Đang duyệt CV</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-inherit font-extrabold">
              {screeningCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('INTERVIEW')}
            className={`px-3.5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'INTERVIEW'
                ? 'bg-[#5b48bd] text-white shadow-sm'
                : 'bg-[#f8f7ff] text-slate-700 hover:bg-purple-50 hover:text-[#5b48bd] border border-purple-100/60'
            }`}
          >
            <span>Phỏng vấn</span>
            {interviewCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                {interviewCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('OFFER')}
            className={`px-3.5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'OFFER'
                ? 'bg-[#5b48bd] text-white shadow-sm'
                : 'bg-[#f8f7ff] text-slate-700 hover:bg-purple-50 hover:text-[#5b48bd] border border-purple-100/60'
            }`}
          >
            <span>Đã nhận Offer</span>
            {offerCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-extrabold">
                {offerCount}
              </span>
            )}
          </button>



          <button
            type="button"
            onClick={() => {
              setActiveFilter('SAVED');
              window.location.hash = '#/applications?tab=saved';
            }}
            className={`px-3.5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'SAVED'
                ? 'bg-[#5b48bd] text-white shadow-sm'
                : 'bg-[#f8f7ff] text-slate-700 hover:bg-purple-50 hover:text-[#5b48bd] border border-purple-100/60'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">bookmark</span>
            <span>Đã lưu ({savedJobs.length})</span>
          </button>
        </div>

        {/* View Mode & Sort Dropdown */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-[#f8f7ff] border border-purple-100 rounded-2xl text-xs font-semibold text-[#1e1b4b] focus:outline-none cursor-pointer"
          >
            <option value="RECENT">Mới nộp gần đây</option>
            <option value="MATCH">Điểm AI Match cao nhất</option>
            <option value="ACTION">Ưu tiên xử lý</option>
          </select>

          <div className="inline-flex rounded-2xl bg-[#f8f7ff] border border-purple-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-[#5b48bd] text-white shadow-xs' : 'text-slate-500 hover:text-[#5b48bd]'
              }`}
              title="Xem danh sách"
            >
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                viewMode === 'kanban' ? 'bg-[#5b48bd] text-white shadow-xs' : 'text-slate-500 hover:text-[#5b48bd]'
              }`}
              title="Xem bảng Kanban"
            >
              <span className="material-symbols-outlined text-base">view_kanban</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. ACTIVE INTERVIEW NOTIFICATION BANNER                   */}
      {/* ========================================================= */}
      {interviewCount > 0 && activeFilter !== 'SAVED' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-[#3b2b8e] to-[#5b48bd] text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl text-amber-300 animate-pulse">
                celebration
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Bạn có {interviewCount} đơn tuyển dụng đã bước vào vòng Phỏng Vấn!
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Hãy luyện tập phản xạ cùng trợ lý AI Mock Interview để đạt kết quả tốt nhất trước nhà tuyển dụng.
              </p>
            </div>
          </div>
          <a
            href="#/ai-interview"
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-purple-50 text-[#3b2b8e] font-extrabold text-xs shadow-md transition-all shrink-0 text-center cursor-pointer"
          >
            Vào Phòng Luyện AI Ngay →
          </a>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MAIN WORKSPACE: APPLICATIONS LIST OR KANBAN            */}
      {/* ========================================================= */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-purple-100 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">Đang tải hồ sơ ứng tuyển của bạn...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'APPLIED', title: '1. Đã Nộp', count: applications.filter((a) => a.status === 'APPLIED').length },
            { id: 'SCREENING', title: '2. Duyệt CV', count: applications.filter((a) => a.status === 'SCREENING').length },
            { id: 'INTERVIEW', title: '3. Phỏng Vấn', count: applications.filter((a) => a.status === 'INTERVIEW').length },
            { id: 'OFFER', title: '4. Nhận Offer', count: applications.filter((a) => a.status === 'OFFER').length },
          ].map((col) => {
            const colApps = applications.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="bg-white border border-purple-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm min-h-[420px]">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">{col.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] font-bold border border-purple-200">
                    {col.count}
                  </span>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[500px]">
                  {colApps.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">Không có đơn ở chặng này</div>
                  ) : (
                    colApps.map((a) => (
                      <div key={a.id} className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-2 hover:shadow-md transition-all">
                        <div className="font-bold text-xs text-[#1e1b4b] truncate">{a.company}</div>
                        <div className="text-[11px] text-[#5b48bd] font-semibold truncate">{a.title}</div>
                        {a.aiMatch && (
                          <div className="text-[10px] font-bold text-emerald-600 inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            {a.aiMatch}% AI Match
                          </div>
                        )}
                        <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-2">
                          <a
                            href={createCandidateToHrMailto({
                              hrEmail: a.recruiterEmail || 'tuyendung@fpt.com',
                              hrName: a.recruiterName,
                              companyName: a.company,
                              jobTitle: a.title,
                              candidateName: user?.fullName || user?.name || 'Ứng viên',
                              candidateEmail: user?.email,
                            })}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                            title="Gửi email cho HR phụ trách"
                          >
                            <span>✉️ Email HR</span>
                          </a>
                          {a.jobId && (
                            <a
                              href={`#/jobs/${a.jobId}`}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                            >
                              Xem JD →
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : activeFilter === 'SAVED' ? (
        /* ================= SAVED JOBS VIEW ================= */
        savedJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
              <span className="material-symbols-outlined text-3xl">bookmark_border</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1e1b4b] mb-1">Chưa Có Việc Làm Đã Lưu</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bạn chưa đánh dấu lưu việc làm nào. Hãy bấm biểu tượng Bookmark trên các trang tin tuyển dụng để lưu và theo dõi tại đây!
              </p>
            </div>
            <a
              href="#/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Khám Phá Việc Làm Ngay</span>
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((sJob) => (
              <div
                key={sJob.id || sJob.jobId}
                className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => (window.location.hash = `#/jobs/${sJob.jobId || sJob.id}`)}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#221d47] to-[#5b48bd] text-white flex items-center justify-center font-bold text-base shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0 overflow-hidden"
                    >
                      {sJob.companyLogo ? (
                        <img src={sJob.companyLogo} alt={sJob.companyName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{sJob.companyName?.slice(0, 2).toUpperCase() || 'JD'}</span>
                      )}
                    </div>
                    <div>
                      <h3
                        onClick={() => (window.location.hash = `#/jobs/${sJob.jobId || sJob.id}`)}
                        className="text-base sm:text-lg font-bold text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer"
                      >
                        {sJob.title}
                      </h3>
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">{sJob.companyName}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <span className="material-symbols-outlined text-sm">payments</span>
                          {sJob.salary || 'Thỏa thuận'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {sJob.location || 'Việt Nam'}
                        </span>
                        {sJob.savedAt && (
                          <>
                            <span>•</span>
                            <span>Đã lưu: {new Date(sJob.savedAt).toLocaleDateString('vi-VN')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        toggleSaveJob(sJob);
                        setSavedJobs(getSavedJobs());
                      }}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">bookmark_remove</span>
                      <span>Bỏ lưu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window.location.hash = `#/jobs/${sJob.jobId || sJob.id}`)}
                      className="px-4 py-2 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Xem tin</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ================= LIST VIEW (MAIN HIGH-END CARDS) ================= */
        filteredApps.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-purple-100 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-[#5b48bd]">
              <span className="material-symbols-outlined text-3xl">inbox</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1e1b4b] mb-1">Chưa Có Đơn Ứng Tuyển Phù Hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hiện tại bạn chưa nộp hồ sơ ở trạng thái này. Khám phá các vị trí tuyển dụng phù hợp với CV của bạn ngay hôm nay!
              </p>
            </div>
            <a
              href="#/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#221d47] to-[#5b48bd] hover:from-[#1b1739] hover:to-[#47369f] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">travel_explore</span>
              <span>Khám Phá Cơ Hội Việc Làm</span>
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {paginatedApps.map((app) => {
              const brandLogo = getBrandLogo(app.company);
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/90 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5 relative overflow-hidden group"
                >
                  {/* Card Header: Company, Job Info & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Company Avatar / Logo */}
                      <div
                        onClick={() => app.jobId && (window.location.hash = `#/jobs/${app.jobId}`)}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#221d47] to-[#5b48bd] text-white flex items-center justify-center font-bold text-base shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0 overflow-hidden p-1.5"
                        title={app.company}
                      >
                        {brandLogo ? (
                          <img
                            src={brandLogo}
                            alt={app.company}
                            className="w-full h-full object-contain filter drop-shadow-xs"
                          />
                        ) : (
                          <span>{app.companyShort}</span>
                        )}
                      </div>

                      {/* Job & Company Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => handleOpenJobModal(app)}
                            className="text-base font-bold text-[#1e1b4b] hover:text-[#5b48bd] transition-colors cursor-pointer flex items-center gap-1"
                            title="Bấm để xem thông tin chi tiết công ty và bài đăng"
                          >
                            <span>{app.company}</span>
                            <span className="material-symbols-outlined text-[#10b981] text-[16px]" title="Nhà tuyển dụng xác thực">
                              verified
                            </span>
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-medium">{app.division}</span>
                        </div>

                        <h3
                          onClick={() => handleOpenJobModal(app)}
                          className="text-lg sm:text-xl font-extrabold text-[#3b2b8e] mt-0.5 hover:text-[#5b48bd] transition-colors cursor-pointer"
                          title="Bấm để mở xem chi tiết bài đăng tuyển dụng"
                        >
                          {app.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 mt-2">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">payments</span>
                            {app.salary}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                            {app.location}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            Nộp: {app.appliedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Badges: AI Match & Stage Status */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      {app.aiMatch != null && (
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 text-[#5b48bd] font-black text-xs shadow-2xs">
                          <span className="material-symbols-outlined text-sm text-[#5b48bd]">auto_awesome</span>
                          <span>{app.aiMatch}% AI Match</span>
                        </div>
                      )}

                      <span
                        className={`text-xs px-3.5 py-1.5 rounded-full font-bold border ${
                          app.status === 'OFFER'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : app.status === 'INTERVIEW'
                            ? 'bg-purple-50 border-purple-300 text-[#5b48bd]'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {app.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* CV Used & Recruiter Contact Strip */}
                  <div className="pt-3 border-t border-purple-100/70 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">description</span>
                      <span>
                        Hồ sơ gửi kèm:{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenCvModal(app)}
                          className="text-[#5b48bd] hover:text-[#32247b] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                          title="Bấm để mở và xem chi tiết tệp CV đã nộp"
                        >
                          <span>{app.cvUsed}</span>
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                        </button>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCvModal(app)}
                        className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-[#5b48bd] font-extrabold text-[11px] border border-purple-200/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                        title="Bấm để mở xem và tải tệp CV đã nộp"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#5b48bd]">picture_as_pdf</span>
                        <span>Mở Xem CV Đã Nộp</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                      <span>
                        Người phụ trách: <strong className="text-[#1e1b4b]">{app.recruiter?.name}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Redesigned Pipeline Stepper */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-bold text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-[#5b48bd]"></span>
                        Tiến Trình Ứng Tuyển Tuyển Dụng
                      </span>
                      <span className="text-[11px] font-semibold text-[#5b48bd] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span>
                        {app.responseNotice}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 relative">
                      {app.steps.map((st) => (
                        <div key={st.step} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                          <div className="w-full flex items-center mb-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-xs shrink-0 transition-all ${
                                st.status === 'completed'
                                  ? 'bg-[#5b48bd] text-white'
                                  : st.status === 'active'
                                  ? 'bg-gradient-to-r from-[#221d47] to-[#5b48bd] text-white ring-4 ring-purple-200 animate-pulse'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              {st.status === 'completed' ? (
                                <span className="material-symbols-outlined text-sm">check</span>
                              ) : (
                                st.step
                              )}
                            </div>
                            {st.step < 4 && (
                              <div
                                className={`flex-1 h-1 mx-1.5 rounded-full transition-all ${
                                  st.status === 'completed'
                                    ? 'bg-[#5b48bd]'
                                    : st.status === 'active'
                                    ? 'bg-purple-300'
                                    : 'bg-slate-200'
                                }`}
                              />
                            )}
                          </div>
                          <div
                            className={`text-xs font-bold ${
                              st.status === 'active'
                                ? 'text-[#5b48bd]'
                                : st.status === 'completed'
                                ? 'text-[#1e1b4b]'
                                : 'text-slate-400'
                            }`}
                          >
                            {st.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">{st.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* Primary Email Button (Direct professional HR contact) */}
                    <a
                      href={createCandidateToHrMailto({
                        hrEmail: app.recruiterEmail || 'tuyendung@fpt.com',
                        hrName: app.recruiterName,
                        companyName: app.company,
                        jobTitle: app.title,
                        candidateName: user?.fullName || user?.name || 'Ứng viên',
                        candidateEmail: user?.email,
                      })}
                      className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-bold text-xs transition-all shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
                      title="Gửi email trao đổi trực tiếp với HR phụ trách hồ sơ này"
                    >
                      <span>✉️ Liên hệ HR qua Email</span>
                    </a>

                    {/* View JD Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenJobModal(app)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      title="Xem toàn bộ mô tả, yêu cầu kỹ năng và quyền lợi của bài đăng tuyển dụng"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Xem Chi Tiết JD</span>
                    </button>

                    {/* Contextual Action when Interviewing */}
                    {app.status === 'INTERVIEW' && (
                      <>
                        <a
                          href={`#/ai-interview?jobId=${app.jobId || ''}`}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#221d47] to-[#5b48bd] hover:from-[#1b1739] hover:to-[#47369f] text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all ml-auto"
                        >
                          <span className="material-symbols-outlined text-[16px]">psychology</span>
                          <span>Vào Phòng Luyện AI Studio</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenInvitationModal(app)}
                          className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#3b2b8e] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                          <span>Xem Lịch Phỏng Vấn</span>
                        </button>
                      </>
                    )}

                    {/* Contextual Action when Offered */}
                    {app.status === 'OFFER' && (
                      <button
                        type="button"
                        onClick={() => handleOpenOfferModal(app)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all ml-auto"
                      >
                        <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                        <span>Xem Chi Tiết Offer &amp; Ký</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Bar for Candidate Applications */}
            {filteredApps.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-xs text-slate-500 font-medium">
                Hiển thị <span className="font-bold text-[#1e1b4b]">{(validCurrentPage - 1) * PAGE_SIZE + 1}</span> - <span className="font-bold text-[#1e1b4b]">{Math.min(validCurrentPage * PAGE_SIZE, filteredApps.length)}</span> trong tổng số <span className="font-bold text-[#5b48bd]">{filteredApps.length}</span> hồ sơ ứng tuyển đã lọc
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    validCurrentPage <= 1
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                      : 'text-[#47369f] bg-purple-50/80 hover:bg-[#5b48bd] hover:text-white border border-purple-200 cursor-pointer shadow-2xs'
                  }`}
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span className="hidden sm:inline">Trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        validCurrentPage === pageNum
                          ? 'bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] text-white shadow-sm font-extrabold scale-105'
                          : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50 border border-transparent hover:border-purple-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    validCurrentPage >= totalPages
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                      : 'text-[#47369f] bg-purple-50/80 hover:bg-[#5b48bd] hover:text-white border border-purple-200 cursor-pointer shadow-2xs'
                  }`}
                  title="Trang tiếp"
                >
                  <span className="hidden sm:inline">Tiếp</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ========================================================= */}
      {/* 5. MODALS (OFFER, INTERVIEW & 2-WAY CHAT)                 */}
      {/* ========================================================= */}

      {/* 1. Offer Detail & Sign Modal */}
      {activeModal === 'OFFER' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#1e1b4b]">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3.5 mb-2">
              <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                {modalData.companyShort}
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-[#1e1b4b]">Thư Mời Nhận Việc (Official Offer)</h3>
                <p className="text-xs text-[#5b48bd] font-bold">
                  {modalData.company} • {modalData.title}
                </p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500">Mức lương cơ bản:</span>
                <span className="text-emerald-700 font-extrabold text-sm">
                  {modalData.offerDetails?.baseSalary || modalData.salary || 'Thỏa thuận theo năng lực'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500">Gói thưởng gia nhập:</span>
                <span className="text-[#1e1b4b] font-semibold">
                  {modalData.offerDetails?.signOnBonus || 'Đầy đủ theo quy chế công ty'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500">Thưởng hiệu suất:</span>
                <span className="text-[#1e1b4b] font-semibold">
                  {modalData.offerDetails?.shares || 'Đánh giá thưởng định kỳ 2 lần/năm'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời hạn phản hồi:</span>
                <span className="text-amber-700 font-bold">Trong vòng 7 ngày làm việc</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 italic mb-6">
              "{modalData.company} rất vinh hạnh được chào đón bạn gia nhập đội ngũ nhằm đồng hành phát triển cùng chúng tôi."
            </p>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSignOffer}
                disabled={offerSigned}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">edit_document</span>
                <span>{offerSigned ? 'Đã Ký Chấp Thuận' : 'Ký Số & Xác Nhận Nhận Việc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interview Invitation Modal */}
      {activeModal === 'INVITATION' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#1e1b4b]">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3.5 mb-2">
              <span className="w-12 h-12 rounded-2xl bg-[#5b48bd] text-white font-extrabold text-base flex items-center justify-center shadow-md">
                {modalData.companyShort}
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-[#1e1b4b]">Thư Mời Phỏng Vấn</h3>
                <p className="text-xs text-[#5b48bd] font-bold">
                  {modalData.company} • {modalData.title}
                </p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500">Thời gian dự kiến:</span>
                <span className="text-[#1e1b4b] font-bold">14:00 - 15:00 (Sắp xếp theo email thông báo)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500">Hình thức phỏng vấn:</span>
                <span className="text-emerald-600 font-bold">Google Meet Video Call</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-slate-500">Hội đồng phỏng vấn:</span>
                <span className="text-[#1e1b4b] font-medium">Ban Tuyển Dụng &amp; Trưởng Bộ Phận Kỹ Thuật</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Đường dẫn cuộc họp:</span>
                <span className="text-[#5b48bd] font-mono font-bold">meet.google.com/hmt-interview</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <a
                href={`#/ai-interview?jobId=${modalData.jobId || ''}`}
                className="px-4 py-2.5 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-200 font-bold hover:bg-purple-100 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>Luyện Thử Với AI</span>
              </a>
              <a
                href="https://meet.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">videocam</span>
                <span>Vào Google Meet</span>
              </a>
            </div>
          </div>
        </div>
      )}





      {/* 5. Submitted CV Viewer & Download Modal */}
      {selectedCvForModal && (
        <CvViewModal
          isOpen={!!selectedCvForModal}
          onClose={() => setSelectedCvForModal(null)}
          {...selectedCvForModal}
        />
      )}
    </div>
  );
}

