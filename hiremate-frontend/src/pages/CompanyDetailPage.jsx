import React, { useState, useEffect } from 'react';
import { companyApi, jobApi } from '../api';
import { formatScannedSalary } from './RecruiterJobManagementPage';
import { calculateJobDeadline } from '../utils/jobTimeUtils';
import { AvatarImg, CompanyLogoImg } from '../components/common/SmartImage';
import {
  normalizeCompanyProfile,
  saveCompanyPreviewCache,
  FALLBACK_COVER_IMAGE,
  FALLBACK_WORKPLACE_IMAGE,
} from '../utils/companyProfileUtils';

function readCachedCompanySnapshot(targetKey, numericCompanyId) {
  const candidates = [...new Set([String(numericCompanyId || ''), String(targetKey || '')].filter(Boolean))];
  for (const key of candidates) {
    try {
      const rawPreview = sessionStorage.getItem(`hiremate_company_preview_${key}`);
      if (rawPreview) {
        const parsed = JSON.parse(rawPreview);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
  }

  try {
    const adminList = JSON.parse(localStorage.getItem('hiremate_admin_companies_list') || '[]');
    if (Array.isArray(adminList)) {
      const found = adminList.find(
        (c) =>
          (numericCompanyId && String(c.rawId || '') === String(numericCompanyId)) ||
          (numericCompanyId && String(c.companyId || '') === String(numericCompanyId)) ||
          (targetKey && (String(c.companyId || '') === String(targetKey) || String(c.id || '') === String(targetKey)))
      );
      if (found) return found;
    }
  } catch {}

  return null;
}

function BranchesSectionContent({ branches = [], locations = [] }) {
  return (
    <div className="space-y-4">
      {branches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {branches.map((b, idx) => (
            <div
              key={b.branchId || b.id || idx}
              className="p-4 rounded-2xl bg-[#fcfbfe] border border-purple-100 hover:border-purple-200 transition-all space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#1e1b4b] min-w-0">
                  <span className="material-symbols-outlined text-base text-[#5b48bd] shrink-0">apartment</span>
                  <span className="truncate">{b.branchName || b.name || `Cơ sở #${idx + 1}`}</span>
                </div>
                {(b.isHeadquarters || b.isMain || idx === 0) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#5b48bd] shrink-0">
                    ⭐ Trụ sở chính
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-sm text-slate-400 shrink-0 mt-0.5">place</span>
                <span>{b.address || 'Đang cập nhật địa chỉ'}</span>
              </p>
              {(b.hotline || b.phone || b.scale || b.size) && (
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                  {(b.hotline || b.phone) && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">call</span>
                      <span>{b.hotline || b.phone}</span>
                    </span>
                  )}
                  {(b.scale || b.size) && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">groups</span>
                      <span>Quy mô: {b.scale || b.size}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {locations.map((loc, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-[#f8f7ff] text-[#5b48bd] border border-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#5b48bd]" />
              <span>{loc}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkplaceGalleryGrid({ photos = [], onPreview }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {photos.map((photo, idx) => (
        <div
          key={idx}
          onClick={() => onPreview?.(photo)}
          className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-2xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
            <img
              src={photo.url}
              alt={photo.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_WORKPLACE_IMAGE;
              }}
            />
            <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-base">zoom_in</span>
            </div>
          </div>
          <div className="p-3.5 space-y-1">
            <h5 className="font-bold text-xs text-[#1e1b4b] line-clamp-1 group-hover:text-[#5b48bd] transition-colors">
              {photo.title}
            </h5>
            {photo.desc && (
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {photo.desc}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BenefitsSectionGrid({ benefits = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {benefits.map((b, idx) => (
        <div
          key={idx}
          className="p-4 bg-[#fcfbfe] rounded-2xl border border-purple-100 hover:border-purple-200 shadow-2xs hover:shadow-sm transition-all flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-[#f4f2fd] border border-purple-100 flex items-center justify-center text-[#5b48bd] shrink-0">
            <span className="material-symbols-outlined text-lg">{b.icon || 'star'}</span>
          </div>
          <div className="min-w-0">
            <h5 className="font-bold text-xs text-[#1e1b4b] leading-snug">{b.title || b}</h5>
            {b.desc && <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{b.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CultureSectionGrid({ culture = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {culture.map((item, idx) => (
        <div
          key={idx}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/60 to-indigo-50/30 border border-purple-100 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-[#5b48bd] shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-lg">{item.icon || 'auto_awesome'}</span>
          </div>
          <div className="min-w-0">
            <h5 className="font-bold text-xs text-[#1e1b4b]">{item.title || item.label || item}</h5>
            {item.desc && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function JobSummaryCard({ job }) {
  const deadlineInfo = calculateJobDeadline(job.deadlineDate);
  const mandSkills = Array.isArray(job.mandatorySkills) ? job.mandatorySkills : (job.skills || []);

  return (
    <div
      onClick={() => { window.location.hash = `#/jobs/${job.jobId || job.id}`; }}
      className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100 hover:border-[#5b48bd] hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm sm:text-base font-bold text-[#1e1b4b] group-hover:text-[#5b48bd] transition-colors">
              {job.title}
            </h4>
            {job.jobLevel && (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] uppercase border border-purple-200">
                {job.jobLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-600 flex-wrap">
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">payments</span>
              <span>{formatScannedSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salary)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
              <span>{job.location || 'Toàn quốc'}</span>
            </span>
            <span>•</span>
            <span className="text-[11px] text-slate-400">{deadlineInfo.text}</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-50 group-hover:bg-[#5b48bd] text-[#5b48bd] group-hover:text-white text-xs font-bold transition-all shrink-0">
          <span>Ứng Tuyển Ngay</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </span>
      </div>

      {mandSkills.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kỹ năng:</span>
          {mandSkills.slice(0, 5).map((skill, sIdx) => (
            <span key={sIdx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
              {skill}
            </span>
          ))}
          {mandSkills.length > 5 && (
            <span className="text-[10px] text-slate-400 font-bold">+{mandSkills.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompanyDetailPage({ companyId, user }) {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW | JOBS | BRANCHES | BENEFITS
  const [jobSearch, setJobSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const numericCompanyId = companyId ? Number(String(companyId).replace(/[^0-9]/g, '')) : null;
  const targetId = numericCompanyId || companyId;

  useEffect(() => {
    let isMounted = true;

    const loadCompanyData = async () => {
      if (!targetId) {
        setError('Mã doanh nghiệp không hợp lệ.');
        setIsLoading(false);
        setJobsLoading(false);
        return;
      }

      setError(null);
      setActiveTab('OVERVIEW');

      // 1. Show cached snapshot immediately if available (eliminates blocking wait screen on navigation)
      const cachedRaw = readCachedCompanySnapshot(companyId, numericCompanyId);
      const cachedNormalized = normalizeCompanyProfile(cachedRaw);
      if (cachedNormalized) {
        setCompany(cachedNormalized);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      setJobsLoading(true);

      try {
        // 2. Fetch company details & active jobs in PARALLEL instead of waterfall
        const [compResult, jobsResult] = await Promise.allSettled([
          companyApi.getCompanyById(targetId),
          numericCompanyId ? jobApi.getJobsByCompany(numericCompanyId) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        let fetchedRawComp = null;
        if (compResult.status === 'fulfilled') {
          const candidate = compResult.value?.data || compResult.value;
          if (candidate && (candidate.companyId || candidate.companyName || candidate.id)) {
            fetchedRawComp = candidate;
          }
        }

        // Fallback to getAllCompanies ONLY if getCompanyById failed AND no snapshot existed
        if (!fetchedRawComp && !cachedNormalized) {
          try {
            const allRes = await companyApi.getAllCompanies();
            const rawList = allRes?.data?.content || allRes?.data || allRes;
            if (Array.isArray(rawList)) {
              const targetStr = String(targetId);
              fetchedRawComp = rawList.find((c) => String(c.companyId || c.id) === targetStr) || null;
            }
          } catch (listErr) {
            console.warn('Không thể tải danh sách công ty fallback:', listErr);
          }
        }

        const effectiveRaw = fetchedRawComp || cachedRaw;
        const normalizedComp = normalizeCompanyProfile(effectiveRaw);

        if (!normalizedComp) {
          setError('Không tìm thấy thông tin doanh nghiệp này trên hệ thống.');
          setCompany(null);
          setJobs([]);
          setIsLoading(false);
          setJobsLoading(false);
          return;
        }

        setCompany(normalizedComp);
        setIsLoading(false);

        if (fetchedRawComp) {
          saveCompanyPreviewCache(normalizedComp.companyId || targetId, fetchedRawComp, { authoritative: true });
        }

        // 3. Process parallel jobs result (fallback to getJobs ONLY if direct company endpoint failed)
        let jobList = [];
        if (jobsResult.status === 'fulfilled' && jobsResult.value) {
          const rawJobs = jobsResult.value?.data || jobsResult.value;
          jobList = Array.isArray(rawJobs) ? rawJobs : (Array.isArray(rawJobs?.data) ? rawJobs.data : []);
        } else if (jobsResult.status === 'rejected') {
          try {
            const allJobsRes = await jobApi.getJobs({ page: 0, size: 50 });
            const allRaw = allJobsRes?.data?.content || allJobsRes?.data || allJobsRes;
            if (Array.isArray(allRaw)) {
              jobList = allRaw.filter(
                (j) =>
                  Number(j.companyId) === Number(numericCompanyId) ||
                  (j.companyName &&
                    normalizedComp.companyName &&
                    j.companyName.toLowerCase().includes(normalizedComp.companyName.toLowerCase()))
              );
            }
          } catch (fallbackJobErr) {
            console.warn('Lỗi lấy danh sách việc làm fallback:', fallbackJobErr);
          }
        }

        if (isMounted) {
          setJobs(jobList);
          setJobsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Không thể tải thông tin doanh nghiệp.');
          setIsLoading(false);
          setJobsLoading(false);
        }
      }
    };

    loadCompanyData();
    return () => {
      isMounted = false;
    };
  }, [companyId, numericCompanyId, targetId]);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/companies/${company?.companyId || targetId}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const filteredJobs = jobs.filter((j) => {
    if (!jobSearch.trim()) return true;
    const q = jobSearch.toLowerCase();
    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.employmentType || '').toLowerCase().includes(q) ||
      (Array.isArray(j.mandatorySkills) && j.mandatorySkills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  if (isLoading && !company) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9fd] font-sans pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-pulse">
          <div className="h-5 w-56 bg-purple-100 rounded-full" />
          <div className="rounded-3xl overflow-hidden bg-white border border-purple-100 shadow-sm">
            <div className="h-48 sm:h-56 bg-slate-200" />
            <div className="p-6 sm:p-8 flex items-end gap-5 -mt-12">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border-4 border-white shadow-md shrink-0" />
              <div className="space-y-2 flex-1 pt-8">
                <div className="h-7 w-64 bg-slate-200 rounded-xl" />
                <div className="h-4 w-96 max-w-full bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-white rounded-3xl border border-purple-100" />
            <div className="h-80 bg-white rounded-3xl border border-purple-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#f8f9fd] text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-[#1e1b4b]">Không Tìm Thấy Doanh Nghiệp</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          {error || 'Hồ sơ doanh nghiệp này hiện không khả dụng hoặc chưa được kích hoạt công khai.'}
        </p>
        <button
          type="button"
          onClick={() => { window.location.hash = '#/'; }}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Quay lại trang chủ</span>
        </button>
      </div>
    );
  }

  const rawStatus = String(company.status || '').toUpperCase();
  const isVerified = rawStatus === 'VERIFIED' || rawStatus === 'APPROVED' || rawStatus === 'ACTIVE';
  const isBlocked = rawStatus === 'REJECTED' || rawStatus === 'BANNED' || rawStatus === 'SUSPENDED';
  const hasKnownStatus = Boolean(rawStatus);
  const legalBadgeText = isVerified
    ? 'HỒ SƠ DOANH NGHIỆP XÁC THỰC'
    : isBlocked
    ? 'ĐÃ ĐÌNH CHỈ GPKD'
    : hasKnownStatus
    ? 'ĐANG CHỜ DUYỆT GPKD'
    : 'HỒ SƠ DOANH NGHIỆP';
  const activeJobsDisplay = jobsLoading && company.activeJobsCount != null ? company.activeJobsCount : jobs.length;

  return (
    <div className="w-full min-h-screen bg-[#f8f9fd] font-sans pb-24 selection:bg-[#5b48bd] selection:text-white">
      {/* Toast Copied Link */}
      {copiedLink && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1e1b4b] text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>Đã sao chép đường dẫn hồ sơ doanh nghiệp!</span>
        </div>
      )}

      {/* Photo Lightbox Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-[420px] bg-slate-900">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_WORKPLACE_IMAGE;
                }}
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-base text-[#1e1b4b]">{previewPhoto.title}</h4>
              {previewPhoto.desc && <p className="text-xs text-slate-600 mt-1">{previewPhoto.desc}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
          <a href="#/" className="hover:text-[#5b48bd] flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[17px]">home</span>
            <span>Trang chủ</span>
          </a>
          <span className="text-slate-300">&gt;</span>
          <a href="#/?tab=companies" className="hover:text-[#5b48bd] transition-colors">
            Mạng lưới doanh nghiệp
          </a>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-800 font-bold truncate max-w-xs">{company.displayName}</span>
        </nav>
      </div>

      {/* 2. HERO COVER BANNER & IDENTITY HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white shadow-sm border border-purple-100 overflow-hidden">
          {/* Cover Photo Banner */}
          <div className="relative h-48 sm:h-60 md:h-64 w-full bg-slate-800 overflow-hidden">
            <img
              src={company.coverUrl}
              alt={`${company.displayName} Cover`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_COVER_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/35 to-black/35" />

            {/* Top Overlay Pills */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between flex-wrap gap-2 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                {isVerified ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/65 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300 shadow-sm"
                    title="Doanh nghiệp đã hoàn tất xác thực giấy phép kinh doanh (GPKD)"
                  >
                    <span className="material-symbols-outlined text-sm text-emerald-400">verified</span>
                    <span>HỒ SƠ DOANH NGHIỆP XÁC THỰC</span>
                  </span>
                ) : isBlocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/75 backdrop-blur-md border border-rose-300/40 text-xs font-bold text-rose-200">
                    <span className="material-symbols-outlined text-sm">block</span>
                    <span>ĐÃ ĐÌNH CHỈ GPKD</span>
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-xs font-bold ${
                    hasKnownStatus
                      ? 'bg-amber-950/70 border-amber-300/30 text-amber-200'
                      : 'bg-slate-900/65 border-white/20 text-slate-200'
                  }`}>
                    <span className="material-symbols-outlined text-sm">{hasKnownStatus ? 'hourglass_top' : 'domain'}</span>
                    <span>{legalBadgeText}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#1e1b4b] text-xs font-bold backdrop-blur-md shadow-sm cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">share</span>
                <span>{copiedLink ? 'Đã sao chép' : 'Chia sẻ hồ sơ'}</span>
              </button>
            </div>
          </div>

          {/* Identity Strip overlapping Cover Banner */}
          <div className="px-6 sm:px-8 pb-6 pt-3 relative bg-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5 -mt-14 sm:-mt-16 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5 min-w-0 flex-1">
                {/* White-framed Company Logo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center p-2 overflow-hidden shrink-0">
                  <CompanyLogoImg
                    src={company.logoUrl}
                    companyName={company.displayName}
                    alt={company.displayName}
                    className="w-full h-full object-contain"
                    fallbackClassName="w-full h-full font-black text-2xl text-[#5b48bd] flex items-center justify-center bg-purple-50 rounded-xl"
                    maxInitials={3}
                  />
                </div>

                {/* Company Name, Badges, Tagline, Meta */}
                <div className="space-y-1.5 min-w-0 flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] tracking-tight leading-tight">
                      {company.displayName}
                    </h1>
                    {isVerified && (
                      <span className="material-symbols-outlined text-emerald-600 text-xl" title="Doanh nghiệp xác thực">
                        verified
                      </span>
                    )}
                    {isVerified && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-2xs">
                        TOP ĐỐI TÁC
                      </span>
                    )}
                  </div>

                  {company.tagline && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                      {company.tagline}
                    </p>
                  )}

                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium flex-wrap pt-0.5">
                    <span className="px-3 py-0.5 rounded-full bg-[#f4f2fd] text-[#5b48bd] font-bold border border-purple-100">
                      {company.industry}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{activeJobsDisplay} vị trí đang tuyển</span>
                    </span>
                    {company.address && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                          <span>{company.address}</span>
                        </span>
                      </>
                    )}
                    {company.taxCode && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                          <span>MST: {company.taxCode}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f4f2fd] hover:bg-purple-100 text-[#5b48bd] text-xs font-bold transition-all shadow-2xs border border-purple-100"
                  >
                    <span>Website chính thức</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('JOBS')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  <span>Xem {activeJobsDisplay} việc làm đang tuyển</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 border-b border-purple-100 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">info</span>
            <span>Tổng Quan Doanh Nghiệp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('JOBS')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'JOBS'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">work</span>
            <span>Việc Làm Tuyển Dụng ({activeJobsDisplay})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BRANCHES')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'BRANCHES'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">apartment</span>
            <span>Trụ Sở &amp; Chi Nhánh ({company.branches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BENEFITS')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'BENEFITS'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">photo_library</span>
            <span>Không Gian &amp; Phúc Lợi</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (Col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                {/* Intro & Stats Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
                  {/* 4 Quick Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
                      <span className="material-symbols-outlined text-[#5b48bd] text-2xl mb-1">groups</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quy mô</p>
                      <h4 className="text-xs sm:text-sm font-black text-[#1e1b4b] mt-0.5 truncate">
                        {company.companySize}
                      </h4>
                    </div>

                    <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1">domain_add</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi nhánh</p>
                      <h4 className="text-xs sm:text-sm font-black text-[#1e1b4b] mt-0.5">
                        {Math.max(company.branches.length, company.locations.length)} cơ sở
                      </h4>
                    </div>

                    <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
                      <span className="material-symbols-outlined text-amber-500 text-2xl mb-1">verified_user</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pháp nhân</p>
                      <h4 className={`text-xs sm:text-sm font-black mt-0.5 ${
                        isVerified ? 'text-emerald-700' : isBlocked ? 'text-rose-600' : hasKnownStatus ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        {isVerified ? '100% Xác thực' : isBlocked ? 'Đã đình chỉ' : hasKnownStatus ? 'Đang chờ duyệt' : 'Đang xác minh'}
                      </h4>
                    </div>

                    <div className="bg-[#f8f7fe] rounded-2xl p-4 border border-purple-100/70 shadow-2xs">
                      <span className="material-symbols-outlined text-[#f97316] text-2xl mb-1">local_fire_department</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Việc làm</p>
                      <h4 className="text-xs sm:text-sm font-black text-[#f97316] mt-0.5">
                        {activeJobsDisplay} vị trí
                      </h4>
                    </div>
                  </div>

                  {/* About Us */}
                  <div>
                    <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-[#5b48bd]">article</span>
                      <span>Giới Thiệu Doanh Nghiệp</span>
                    </h3>
                    <div className="mt-3 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal bg-[#fcfbfe] rounded-2xl p-4 border border-purple-100/60">
                      {company.description}
                    </div>
                    {(company.establishedYear || company.markets) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {company.establishedYear && (
                          <span className="px-3 py-1 rounded-xl bg-purple-50 text-[#5b48bd] border border-purple-100 text-xs font-semibold">
                            Năm thành lập: {company.establishedYear}
                          </span>
                        )}
                        {company.markets && (
                          <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                            Thị trường: {company.markets}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Latest Jobs Preview */}
                  <div className="pt-4 border-t border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-sm text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-[#5b48bd]">bolt</span>
                        <span>Tin Tuyển Dụng Mới Nhất</span>
                      </h4>
                      {jobs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('JOBS')}
                          className="text-xs font-bold text-[#5b48bd] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Xem tất cả ({jobs.length})</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      )}
                    </div>

                    {jobsLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="h-20 rounded-2xl bg-slate-100 border border-purple-50" />
                        ))}
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-purple-100 text-center text-xs text-slate-500">
                        Hiện chưa có tin tuyển dụng công khai đang mở. Hãy theo dõi doanh nghiệp để nhận thông báo mới nhất.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {jobs.slice(0, 4).map((job) => (
                          <JobSummaryCard key={job.id || job.jobId} job={job} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Workplace Gallery Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-[#5b48bd]">photo_library</span>
                      <span>Không Gian Làm Việc &amp; Trải Nghiệm Thực Tế</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">
                      {company.workplacePhotos.length} góc chụp
                    </span>
                  </div>
                  <WorkplaceGalleryGrid photos={company.workplacePhotos} onPreview={setPreviewPhoto} />
                </div>

                {/* Benefits & Culture Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-[#5b48bd]">featured_seasonal_and_gifts</span>
                      <span>Chế Độ Đãi Ngộ &amp; Phúc Lợi Đặc Quyền</span>
                    </h3>
                    <BenefitsSectionGrid benefits={company.benefits} />
                  </div>

                  {company.culture.length > 0 && (
                    <div className="space-y-4 pt-5 border-t border-purple-100">
                      <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-[#5b48bd]">diversity_3</span>
                        <span>Văn Hóa &amp; Giá Trị Cốt Lõi</span>
                      </h3>
                      <CultureSectionGrid culture={company.culture} />
                    </div>
                  )}
                </div>

                {/* Branches Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-[#5b48bd]">pin_drop</span>
                      <span>Trụ Sở &amp; Chi Nhánh Tuyển Dụng</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">
                      {company.branches.length} cơ sở
                    </span>
                  </div>
                  <BranchesSectionContent branches={company.branches} locations={company.locations} />
                </div>

                {/* HR Recruitment Team Card */}
                {company.hrTeam.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-[#5b48bd]">badge</span>
                        <span>Đội Ngũ Tuyển Dụng</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold">
                        {company.hrTeam.length} thành viên
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {company.hrTeam.map((member, mIdx) => (
                        <div
                          key={member.recruiterId || mIdx}
                          className="p-4 rounded-2xl bg-[#fcfbfe] border border-purple-100 flex items-center gap-3.5"
                        >
                          <AvatarImg
                            src={member.avatarUrl || member.avatar}
                            name={member.fullName || member.name}
                            alt={member.fullName || member.name}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-100 shrink-0"
                            fallbackClassName="w-12 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center ring-2 ring-purple-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-bold text-xs text-[#1e1b4b] truncate">
                                {member.fullName || member.name || 'Chuyên viên HR'}
                              </h5>
                              {(member.isRepresentative || member.representative) && (
                                <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-[#5b48bd] text-[9px] font-extrabold shrink-0">
                                  Đại diện
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 truncate">
                              {member.position || 'Talent Acquisition Specialist'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 flex-wrap">
                              <span>{member.branchName || 'Trụ sở chính'}</span>
                              {member.activeJobsCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-bold">
                                    {member.activeJobsCount} tin đang mở
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: JOBS */}
            {activeTab === 'JOBS' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Tìm theo chức danh, địa điểm làm việc hoặc kỹ năng..."
                    className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {jobSearch && (
                    <button
                      type="button"
                      onClick={() => setJobSearch('')}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {jobsLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-24 rounded-3xl bg-white border border-purple-100" />
                      ))}
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="p-10 rounded-3xl bg-white border border-purple-100 text-center shadow-sm">
                      <span className="material-symbols-outlined text-4xl text-slate-300">work_outline</span>
                      <h4 className="font-bold text-sm text-[#1e1b4b] mt-2">Chưa có vị trí tuyển dụng phù hợp</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Hãy thử điều chỉnh từ khóa tìm kiếm hoặc quay lại sau.
                      </p>
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <JobSummaryCard key={job.id || job.jobId} job={job} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: BRANCHES */}
            {activeTab === 'BRANCHES' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-xl text-[#5b48bd]">apartment</span>
                  <span>Mạng Lưới Chi Nhánh &amp; Trụ Sở Tuyển Dụng</span>
                </h3>
                <BranchesSectionContent branches={company.branches} locations={company.locations} />
              </div>
            )}

            {/* TAB: BENEFITS & WORKSPACE */}
            {activeTab === 'BENEFITS' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#5b48bd]">photo_library</span>
                    <span>Không Gian Làm Việc &amp; Trải Nghiệm Thực Tế</span>
                  </h3>
                  <WorkplaceGalleryGrid photos={company.workplacePhotos} onPreview={setPreviewPhoto} />
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-5">
                  <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#5b48bd]">redeem</span>
                    <span>Chế Độ Đãi Ngộ &amp; Phúc Lợi Đặc Quyền</span>
                  </h3>
                  <BenefitsSectionGrid benefits={company.benefits} />

                  {company.culture.length > 0 && (
                    <div className="pt-5 border-t border-purple-100 space-y-4">
                      <h4 className="text-sm font-black text-[#1e1b4b] flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-[#5b48bd]">diversity_3</span>
                        <span>Văn Hóa &amp; Giá Trị Doanh Nghiệp</span>
                      </h4>
                      <CultureSectionGrid culture={company.culture} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Box 1: Thông tin pháp lý & Liên hệ */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2 border-b border-purple-100 pb-3">
                <span className="material-symbols-outlined text-lg text-[#5b48bd]">verified_user</span>
                <span>Hồ Sơ Xác Thực Doanh Nghiệp</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-700 block">Tên Pháp Nhân:</span>
                  <p className="mt-0.5 text-slate-800 font-medium">{company.companyName}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block">Mã Số Thuế (MST):</span>
                  <p className="mt-0.5 font-mono font-bold text-slate-900">{company.taxCode || 'Đã kiểm tra'}</p>
                </div>

                {company.licenseNumber && (
                  <div>
                    <span className="font-bold text-slate-700 block">Số Giấy Phép Kinh Doanh:</span>
                    <p className="mt-0.5 font-mono font-semibold text-slate-800">{company.licenseNumber}</p>
                  </div>
                )}

                {company.legalRepresentative && (
                  <div>
                    <span className="font-bold text-slate-700 block">Người Đại Diện Pháp Luật:</span>
                    <p className="mt-0.5 text-slate-800 font-medium">{company.legalRepresentative}</p>
                  </div>
                )}

                <div>
                  <span className="font-bold text-slate-700 block">Trạng Thái Xác Thực:</span>
                  <div className="mt-1">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                        <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                        <span>GPKD Đã Được Phê Duyệt</span>
                      </span>
                    ) : isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                        <span className="material-symbols-outlined text-sm text-rose-600">block</span>
                        <span>Đã Đình Chỉ / Thu Hồi GPKD</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-bold text-[11px] ${
                        hasKnownStatus ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`material-symbols-outlined text-sm ${hasKnownStatus ? 'text-amber-600' : 'text-slate-500'}`}>
                          {hasKnownStatus ? 'hourglass_top' : 'sync'}
                        </span>
                        <span>{hasKnownStatus ? 'Đang Chờ Quản Trị Duyệt' : 'Đang cập nhật trạng thái'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {company.address && (
                  <div>
                    <span className="font-bold text-slate-700 block">Trụ Sở Chính:</span>
                    <p className="mt-0.5 text-slate-700 leading-relaxed">{company.address}</p>
                  </div>
                )}

                {(company.totalJobs != null || company.totalHires != null) && (
                  <div className="pt-2 border-t border-purple-50 grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng tin đăng</div>
                      <div className="text-sm font-black text-[#1e1b4b] mt-0.5">{company.totalJobs ?? activeJobsDisplay}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Đang tuyển</div>
                      <div className="text-sm font-black text-emerald-700 mt-0.5">{activeJobsDisplay} vị trí</div>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div>
                    <span className="font-bold text-slate-700 block">Website Chính Thức:</span>
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 text-[#5b48bd] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Truy cập trang web</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Đảm bảo quyền lợi từ HireMate AI */}
            <div className="bg-gradient-to-br from-[#20184e] to-[#402a8b] rounded-3xl p-6 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-amber-400">shield</span>
                <span className="font-bold text-xs uppercase tracking-wider text-amber-300">Cam Kết Tin Cậy</span>
              </div>
              <p className="text-xs text-purple-100 leading-relaxed">
                Tất cả các tin tuyển dụng của doanh nghiệp này được kiểm duyệt và áp dụng thuật toán AI Matching 70/30 chuẩn mực để bảo vệ tối đa quyền lợi ứng viên.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
