import React, { useState } from 'react';

export default function JobCard({ job, onSelectJob, onApplyJob, onPracticeInterview }) {
  const [bookmarked, setBookmarked] = useState(false);

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
      return `${Number(job.salaryMin).toLocaleString()} – ${Number(job.salaryMax).toLocaleString()} USD`;
    }
    return '$2,200 – $3,500 USD';
  };

  const aiMatchScore = job.aiMatchScore || 95;
  const skillsList = job.skills || job.mandatorySkills || ['Java 17', 'Spring Boot', 'Apache Kafka', 'K8s'];

  return (
    <article className="bg-white border border-purple-100/90 rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-5 font-sans text-[#221d47] relative group">
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

          <div className="space-y-0.5">
            <h3
              onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
              className="font-extrabold text-base sm:text-lg text-[#221d47] group-hover:text-[#5b48bd] transition-colors leading-snug cursor-pointer line-clamp-1"
              title="Xem chi tiết việc làm"
            >
              {job.title}
            </h3>
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
          <div className="text-2xl sm:text-3xl font-extrabold text-[#f97316] leading-none">
            {aiMatchScore}%
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
            AI MATCH
          </div>
        </div>

        {/* Stacked Action Buttons */}
        <div className="space-y-2 w-full sm:w-36">
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
        </div>
      </div>
    </article>
  );
}
