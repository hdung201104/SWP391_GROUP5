import React, { useState, useRef, useEffect } from 'react';

export default function JobCard({ job, user, onSelectJob, onApplyJob, onPracticeInterview }) {
  const isRecruiter = user?.role === 'RECRUITER';
  const isMyJob = isRecruiter && user?.userId && job.recruiterId === user.userId;
  const [bookmarked, setBookmarked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 110);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Helper for company initials
  const getInitials = (name) => {
    if (!name) return 'JOB';
    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  };

  const initials = job.companyInitials || getInitials(job.companyName);

  const formatSalary = () => {
    if (job.salaryText) return job.salaryText;
    if (job.salary) return job.salary;
    if (job.salaryMin && job.salaryMax) {
      if (job.salaryMin >= 1000000) {
        return `${(job.salaryMin / 1000000).toFixed(0)} – ${(job.salaryMax / 1000000).toFixed(0)} triệu VNĐ`;
      }
      return `$${Number(job.salaryMin).toLocaleString()} – $${Number(job.salaryMax).toLocaleString()} USD`;
    }
    return 'Lương thỏa thuận';
  };

  const aiMatchScore = job.aiMatchScore != null ? job.aiMatchScore : (job.matchingScore != null ? Math.round(job.matchingScore) : null);
  const skillsList = job.skills || job.mandatorySkills || ['Java 17', 'Spring Boot', 'Apache Kafka', 'K8s'];

  // Parse or synthesize structured details for hover popup
  const getJobDetailsData = () => {
    const responsibilities = [];
    let projectTasks = job.projectTasks || [];

    if (job.description) {
      const rawLines = String(job.description)
        .replaceAll('\\n', '\n')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      rawLines.forEach((line) => {
        const cleaned = line.replace(/^[•\-\*]\s*/, '');
        if (cleaned) responsibilities.push(cleaned);
      });
    }

    if (responsibilities.length <= 1) {
      const baseDesc = responsibilities[0] || 'Phụ trách theo mảng chuyên môn đối với tất cả dự án/ công việc của Phòng.';
      responsibilities.length = 0;
      responsibilities.push(baseDesc);
      responsibilities.push('Lập, kiểm tra bản vẽ thiết kế, tư vấn, góp ý theo lĩnh vực chuyên môn');
      responsibilities.push('Đề xuất ý tưởng, tham gia các hoạt động nghiên cứu theo định hướng phát triển của Công ty');

      if (projectTasks.length === 0) {
        projectTasks = [
          'Chủ động phối hợp kiểm soát tiến độ, chi phí và chất lượng thực hiện dự án',
          'Báo cáo định kỳ và đề xuất phương án tối ưu hóa quy trình chuyên môn',
        ];
      }
    }

    return { responsibilities, projectTasks };
  };

  const { responsibilities, projectTasks } = getJobDetailsData();

  return (
    <article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`bg-white border border-purple-100/90 rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-5 font-sans text-[#221d47] relative group ${
        isHovered ? 'z-50' : 'z-10'
      }`}
    >
      {/* LEFT COLUMN: Main Info */}
      <div className="flex-1 space-y-2.5">
        {/* Row 1: Logo & Title + Company */}
        <div className="flex items-start gap-3.5">
          <div
            onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
            className="w-12 h-12 rounded-xl bg-[#f4f2fd] border border-purple-100 flex items-center justify-center font-extrabold text-base text-[#5b48bd] hover:scale-105 transition-transform shrink-0 cursor-pointer shadow-sm overflow-hidden"
            title="Xem chi tiết việc làm"
          >
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
                className="font-extrabold text-base sm:text-lg text-[#221d47] group-hover:text-[#5b48bd] transition-colors leading-snug cursor-pointer line-clamp-1"
                title="Xem chi tiết việc làm"
              >
                {job.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-[10px] tracking-wider uppercase shrink-0 shadow-2xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px] leading-none">local_fire_department</span>
                TOP
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
              <span className="font-semibold text-slate-700">{job.companyName || 'VNG Cloud Platform'}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="material-symbols-outlined text-xs text-[#10b981]">verified</span>
                Đối tác xác thực
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Salary Line */}
        <div 
          onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
          className="text-base sm:text-lg font-extrabold text-[#f97316] cursor-pointer pt-0.5"
        >
          {formatSalary()}
        </div>

        {/* Row 3: Location & Time */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
            <span>{job.location || 'Quận 7, TP. HCM (Mô hình Hybrid)'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
            <span>Đăng {job.postedTime || '2 giờ trước'}</span>
          </div>
        </div>

        {/* Row 4: Skill Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {skillsList.slice(0, 5).map((sk, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-md bg-[#f8f7ff] text-[#5b48bd] border border-purple-100 text-[11px] font-semibold"
            >
              {sk}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: AI Score & Buttons */}
      <div className="shrink-0 flex flex-row sm:flex-col justify-between items-end gap-3 min-w-[140px] pt-3 sm:pt-0 border-t sm:border-t-0 border-purple-100">
        {/* AI Match Score Header */}
        <div className="text-right flex items-center sm:block gap-2 sm:gap-0">
          {isRecruiter ? (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
              isMyJob 
                ? 'bg-purple-100 text-[#5b48bd] border border-purple-300' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className="material-symbols-outlined text-sm">{isMyJob ? 'storefront' : 'verified'}</span>
              <span>{isMyJob ? 'TIN CỦA BẠN' : 'ĐANG TUYỂN'}</span>
            </div>
          ) : aiMatchScore != null ? (
            <>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#f97316] leading-none" title={job.aiReasoning || 'Điểm tương thích AI'}>
                {aiMatchScore}%
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                AI MATCH
              </div>
            </>
          ) : (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-2xs">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>ĐANG TUYỂN</span>
            </div>
          )}
        </div>

        {/* Stacked Action Buttons */}
        <div className="space-y-2 w-full sm:w-36">
          {isRecruiter ? (
            <>
              {isMyJob && (
                <button
                  onClick={() => window.location.hash = '#/job-dashboard'}
                  className="w-full py-2 px-3 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer text-center whitespace-nowrap block"
                  type="button"
                >
                  Quản lý tin đăng
                </button>
              )}
              <button
                onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center whitespace-nowrap block ${
                  isMyJob
                    ? 'bg-[#f8f7ff] hover:bg-[#edeafd] text-[#5b48bd] border border-purple-200'
                    : 'bg-[#5b48bd] hover:bg-[#47369f] text-white shadow-sm hover:shadow'
                }`}
                type="button"
              >
                Xem chi tiết
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onApplyJob ? onApplyJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
                className="w-full py-2 px-4 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer text-center whitespace-nowrap block"
                type="button"
              >
                Ứng tuyển ngay
              </button>
              <button
                onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
                className="w-full py-2 px-4 rounded-xl bg-[#f8f7ff] hover:bg-[#edeafd] text-[#5b48bd] border border-purple-200 font-bold text-xs transition-all cursor-pointer text-center whitespace-nowrap block"
                type="button"
              >
                Xem chi tiết
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FLOATING HOVER DETAIL CARD (POPOVER - HOMEPAGE THEME)                */}
      {/* ==================================================================== */}
      {isHovered && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="hidden sm:block absolute -top-3 -left-3 w-[calc(100%+24px)] max-w-[540px] z-50 bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_22px_55px_rgba(59,43,142,0.18)] border border-purple-200/90 font-sans text-[#221d47] animate-popover-in"
        >
          {/* 1. Header: Logo, Company Name, Job Title & Match Pill */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div
              onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
              className="w-13 h-13 rounded-2xl bg-[#f4f2fd] border border-purple-100 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs cursor-pointer hover:scale-105 transition-transform"
            >
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-[#5b48bd] text-base">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-[#5b48bd] uppercase tracking-wider truncate mb-0.5">
                {job.companyName || 'HireMate Partner'}
              </p>
              <h4
                onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
                className="font-extrabold text-base sm:text-lg text-[#221d47] group-hover:text-[#5b48bd] hover:text-[#5b48bd] leading-snug line-clamp-2 cursor-pointer transition-colors"
              >
                {job.title}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-xs text-[#10b981]">verified</span>
                  Đối tác xác thực
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              {isRecruiter ? (
                <div className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-[#5b48bd] font-extrabold text-xs shadow-2xs">
                  {job.employmentType || 'FULL TIME'}
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-[#f97316] font-extrabold text-xs shadow-2xs">
                  {aiMatchScore != null ? `${aiMatchScore}% MATCH` : 'ĐANG TUYỂN'}
                </div>
              )}
            </div>
          </div>

          {/* 2. Info Box: Highlights Bar with HireMate Palette */}
          <div className="border border-purple-100 rounded-2xl p-3.5 mb-3.5 bg-[#f8f7ff] grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {/* Left Column: Salary & Location */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 font-extrabold text-[#f97316] text-[13px] truncate">
                <span className="material-symbols-outlined text-base text-[#f97316] leading-none shrink-0">payments</span>
                <span className="truncate">{formatSalary()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium truncate">
                <span className="material-symbols-outlined text-[15px] text-[#5b48bd] leading-none shrink-0">location_on</span>
                <span className="truncate">{job.location || 'Hồ Chí Minh'}</span>
              </div>
            </div>

            {/* Right Column: Updated date & Deadline */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px] truncate">
                <span className="material-symbols-outlined text-[15px] text-slate-400 leading-none shrink-0">schedule</span>
                <span className="truncate">Cập nhật: {job.updatedDate || '12/10/2026'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px] truncate">
                <span className="material-symbols-outlined text-[15px] text-slate-400 leading-none shrink-0">event</span>
                <span className="truncate">Hết hạn: {job.deadline || '12/11/2026'}</span>
              </div>
            </div>
          </div>

          {/* 3. Job Description ("Mô tả công việc" in HireMate style) */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#5b48bd] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5b48bd]"></span>
                Mô tả công việc
              </h4>
              <span className="text-[11px] font-medium text-slate-400">Chi tiết tuyển dụng</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f7ff] border border-purple-100 max-h-[155px] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-700 space-y-2.5">
              <div>
                <p className="font-bold text-[#221d47] text-xs mb-1.5">Công việc theo chuyên môn:</p>
                <ul className="space-y-1.5 pl-0.5">
                  {responsibilities.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]/60 mt-1.5 shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {projectTasks && projectTasks.length > 0 && (
                <div className="pt-2 border-t border-purple-100/70">
                  <p className="font-bold text-[#221d47] text-xs mb-1.5">
                    Công việc quản lý dự án (ưu tiên có kinh nghiệm):
                  </p>
                  <ul className="space-y-1.5 pl-0.5">
                    {projectTasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]/60 mt-1.5 shrink-0"></span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 4. Skill Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
            {skillsList.slice(0, 4).map((sk, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-[#f8f7ff] text-[#5b48bd] border border-purple-100 text-[11px] font-semibold"
              >
                {sk}
              </span>
            ))}
          </div>

          {/* 5. Bottom Action Bar (Unified with Homepage actions) */}
          <div className="pt-3.5 border-t border-purple-100 flex items-center justify-between gap-3 font-sans">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="material-symbols-outlined text-sm text-[#10b981]">verified_user</span>
              <span className="text-[11px] text-slate-600 font-semibold">Tuyển trực tiếp</span>
            </div>

            <div className="flex items-center gap-2">
              {isRecruiter && isMyJob && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = '#/job-dashboard';
                  }}
                  className="px-4 py-2 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  Quản lý tin
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectJob) onSelectJob(job);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs ${
                  isRecruiter && !isMyJob 
                    ? 'bg-[#5b48bd] hover:bg-[#47369f] text-white' 
                    : 'bg-[#f8f7ff] hover:bg-[#edeafd] text-[#5b48bd] border border-purple-200'
                }`}
              >
                Xem chi tiết
              </button>
              {!isRecruiter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onApplyJob) onApplyJob(job);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs transition-all cursor-pointer shadow-md hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <span>Ứng tuyển ngay</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}


