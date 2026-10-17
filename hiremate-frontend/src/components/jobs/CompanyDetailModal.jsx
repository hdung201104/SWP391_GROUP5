import React, { useState, useEffect } from 'react';
import { jobApi } from '../../api';

export default function CompanyDetailModal({
  company,
  user,
  onClose,
  onSelectJob,
  onApplyJob,
  onPracticeInterview,
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');

  const isRecruiter = user?.role === 'RECRUITER';
  const isCandidate = user?.role === 'CANDIDATE' || user?.role === 'ROLE_CANDIDATE';
  const isMyCompany = isRecruiter && (
    (user.companyId && String(user.companyId) === String(company?.companyId)) ||
    (user.companyName && company?.companyName && user.companyName.toLowerCase().trim() === company.companyName.toLowerCase().trim())
  );

  useEffect(() => {
    if (!company?.companyId) return;
    let isMounted = true;
    setLoading(true);

    jobApi.getJobsByCompany(company.companyId)
      .then((res) => {
        if (!isMounted) return;
        const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        // Map jobs into standardized display format
        const mapped = raw.map((j) => {
          const matchScore = j.matchingScore != null ? Math.round(j.matchingScore) : null;
          const salaryText = j.salaryMin && j.salaryMax
            ? (Number(j.salaryMin) >= 1000000
                ? `${Number(j.salaryMin).toLocaleString('vi-VN')} - ${Number(j.salaryMax).toLocaleString('vi-VN')} đ/tháng`
                : `$${Number(j.salaryMin).toLocaleString()} - $${Number(j.salaryMax).toLocaleString()}/tháng`)
            : j.salaryMin
            ? (Number(j.salaryMin) >= 1000000
                ? `Từ ${Number(j.salaryMin).toLocaleString('vi-VN')} đ/tháng`
                : `Từ $${Number(j.salaryMin).toLocaleString()}/tháng`)
            : 'Thương lượng';

          return {
            ...j,
            salaryText,
            aiMatchScore: matchScore,
            skills: Array.isArray(j.skills) ? j.skills : (Array.isArray(j.requirements) ? j.requirements : []),
          };
        });
        setJobs(mapped);
      })
      .catch((err) => {
        console.warn('Lỗi khi tải bài đăng của công ty:', err);
        setJobs([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [company?.companyId]);

  if (!company) return null;

  // Extract unique branches from active jobs
  const branchList = Array.from(new Set(
    jobs.map(j => j.location).filter(Boolean)
  ));

  // Filter jobs by search & branch
  const filteredJobs = jobs.filter((job) => {
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase().trim();
      const matchTitle = (job.title || '').toLowerCase().includes(q);
      const matchLoc = (job.location || '').toLowerCase().includes(q);
      const matchSkills = (job.skills || []).some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchLoc && !matchSkills) return false;
    }
    if (selectedBranch !== 'All' && job.location !== selectedBranch) {
      return false;
    }
    return true;
  });

  const initials = company.companyName
    ? company.companyName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    : 'ENT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Banner */}
        <div className="relative h-36 sm:h-44 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#5b48bd] p-6 flex items-end justify-between overflow-hidden">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl transform translate-x-20 -translate-y-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#7c3aed]/20 rounded-full blur-xl pointer-events-none"></div>

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Recruiter Badge if own company */}
          {isMyCompany && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#5b48bd] text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10">
              <span className="material-symbols-outlined text-sm text-[#7c3aed]">verified_user</span>
              <span>Doanh nghiệp của bạn</span>
            </div>
          )}

          {/* Quick Stats Pill inside Banner */}
          <div className="relative z-10 hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white text-xs font-semibold">
            <span className="material-symbols-outlined text-emerald-400 text-base">work</span>
            <span>{jobs.length} vị trí đang mở tuyển</span>
          </div>
        </div>

        {/* Company Profile Bar (Overlapping Logo) */}
        <div className="px-6 sm:px-8 pb-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
            {/* Logo */}
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center p-3 shrink-0 overflow-hidden">
                {company.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={company.companyName} 
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span 
                  style={{ display: company.logoUrl ? 'none' : 'flex' }}
                  className="w-full h-full font-black text-2xl text-[#5b48bd] items-center justify-center tracking-wider bg-purple-50 rounded-xl"
                >
                  {initials}
                </span>
              </div>

              {/* Title & Industry */}
              <div className="pt-2 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-[#1e1b4b]">
                    {company.companyName}
                  </h2>
                  <span className="material-symbols-outlined text-emerald-600 text-lg" title="Xác minh chính chủ">
                    verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                  {company.industry && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] font-semibold border border-purple-100">
                      <span className="material-symbols-outlined text-[13px]">domain</span>
                      <span>{company.industry}</span>
                    </span>
                  )}
                  {company.companySize && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">group</span>
                      <span>{company.companySize}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* External Links / Recruiter Action */}
            <div className="flex items-center gap-2 flex-wrap">
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-xs flex items-center gap-1.5 transition-colors border border-purple-200"
                >
                  <span className="material-symbols-outlined text-base">public</span>
                  <span>Website Công Ty</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              )}

              {isMyCompany && (
                <button
                  onClick={() => {
                    onClose();
                    window.location.hash = '#/company-profile';
                  }}
                  className="px-4 py-2 rounded-full bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  <span>Quản Lý Hồ Sơ</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#f4f2fd]/60 rounded-2xl border border-purple-100/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white text-[#5b48bd] flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-base">home_pin</span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Trụ sở chính</p>
                <p className="font-semibold text-[#1e1b4b] truncate">{company.address || 'Đang cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white text-[#5b48bd] flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-base">apartment</span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Chi nhánh hoạt động</p>
                <p className="font-semibold text-[#1e1b4b] truncate">
                  {branchList.length > 0 ? `${branchList.length} địa điểm` : (company.locations?.length ? `${company.locations.length} địa điểm` : 'Toàn quốc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-base">campaign</span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Tình trạng tuyển dụng</p>
                <p className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{jobs.length} tin tuyển dụng mở</span>
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Giới thiệu doanh nghiệp
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-h-24 overflow-y-auto pr-2">
                {company.description}
              </p>
            </div>
          )}
        </div>

        {/* Divider with Section Title */}
        <div className="px-6 sm:px-8 py-3 bg-[#f8f7fe] border-y border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5b48bd]"></span>
            <h3 className="font-extrabold text-sm sm:text-base text-[#1e1b4b]">
              Danh Sách Tin Tuyển Dụng Đang Mở ({jobs.length})
            </h3>
          </div>

          {/* Internal Filters: Search & Branch */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center bg-white rounded-full px-3 py-1.5 border border-purple-200 text-xs shadow-2xs">
              <span className="material-symbols-outlined text-sm text-purple-400 mr-1.5">search</span>
              <input 
                type="text"
                placeholder="Lọc vị trí, kỹ năng..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="bg-transparent focus:outline-none w-32 sm:w-44 text-[#1e1b4b]"
              />
            </div>

            {branchList.length > 1 && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white rounded-full px-3 py-1.5 border border-purple-200 text-xs font-semibold text-[#1e1b4b] focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="All">Tất cả chi nhánh</option>
                {branchList.map((branch, i) => (
                  <option key={i} value={branch}>{branch}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scrollable Job Postings List */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Đang tải các vị trí tuyển dụng của doanh nghiệp...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-12 text-center bg-[#fdfcfe] rounded-3xl border border-dashed border-purple-200 p-8 space-y-3">
              <span className="material-symbols-outlined text-4xl text-purple-300">work_off</span>
              <h4 className="font-extrabold text-[#1e1b4b] text-base">
                {jobs.length === 0 ? 'Hiện tại chưa có tin tuyển dụng nào' : 'Không có vị trí phù hợp với bộ lọc'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {jobs.length === 0 
                  ? 'Doanh nghiệp đang chuẩn bị các chiến dịch tuyển dụng mới. Hãy theo dõi và quay lại sau!' 
                  : 'Hãy thử xóa từ khóa tìm kiếm hoặc chọn lại chi nhánh để hiển thị đầy đủ tin tuyển dụng.'}
              </p>
              {isMyCompany && (
                <button
                  onClick={() => {
                    onClose();
                    window.location.hash = '#/job-dashboard';
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 mt-2"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Đăng tin tuyển dụng ngay</span>
                </button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div 
                key={job.jobId}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 hover:border-[#5b48bd] transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 
                      onClick={() => onSelectJob?.(job)}
                      className="font-extrabold text-base text-[#1e1b4b] hover:text-[#5b48bd] cursor-pointer transition-colors"
                    >
                      {job.title}
                    </h4>

                    {/* AI Match Badge if available */}
                    {job.aiMatchScore != null && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        job.aiMatchScore >= 80 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-purple-50 text-[#5b48bd] border-purple-200'
                      }`}>
                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                        <span>{job.aiMatchScore}% Match AI</span>
                      </span>
                    )}

                    {job.employmentType && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {job.employmentType}
                      </span>
                    )}
                  </div>

                  {/* Branch, Salary, Posted Time */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-medium mt-1.5">
                    <span className="flex items-center gap-1 text-[#1e1b4b] font-semibold">
                      <span className="material-symbols-outlined text-[14px] text-[#5b48bd]">location_on</span>
                      <span>{job.location || 'Toàn quốc'}</span>
                    </span>

                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="material-symbols-outlined text-[14px]">payments</span>
                      <span>{job.salaryText}</span>
                    </span>

                    {job.deadlineDate && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        <span>Hạn: {new Date(job.deadlineDate).toLocaleDateString('vi-VN')}</span>
                      </span>
                    )}
                  </div>

                  {/* Skills Pills */}
                  {Array.isArray(job.skills) && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {job.skills.slice(0, 4).map((sk, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f4f2fd] text-[#5b48bd] border border-purple-100"
                        >
                          {sk}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="text-[11px] text-slate-400 font-medium self-center">
                          +{job.skills.length - 4} kỹ năng
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Practice Interview Button (Candidate) */}
                  {isCandidate && (
                    <button
                      onClick={() => onPracticeInterview?.(job)}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-purple-50 text-[#5b48bd] border border-purple-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Luyện phỏng vấn AI cho vị trí này"
                    >
                      <span className="material-symbols-outlined text-sm">mic</span>
                      <span className="hidden sm:inline">Luyện AI</span>
                    </button>
                  )}

                  {/* Apply Job Button */}
                  <button
                    onClick={() => onApplyJob?.(job)}
                    className="px-4 py-2 rounded-full bg-[#5b48bd] hover:bg-[#4a39a8] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span>Ứng tuyển</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>

                  {/* View Details */}
                  <button
                    onClick={() => onSelectJob?.(job)}
                    className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#1e1b4b] transition-all cursor-pointer"
                    title="Xem chi tiết đầy đủ"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3.5 bg-white border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
          <span>HireMate AI Enterprise Recruitment</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
