import React, { useState } from 'react';
import { useLivingTheme } from '../../context/LivingThemeContext';

export default function JobCard({ job, onSelectJob, onApplyJob, onPracticeInterview }) {
  const [bookmarked, setBookmarked] = useState(false);
  const { theme: livingTheme, luminosity } = useLivingTheme();

  // Derive theme accents based on job id or company
  const getTheme = () => {
    const id = job.jobId || job.id || 1;
    if (id % 3 === 1) {
      return {
        accent: 'secondary',
        borderHover: 'hover:border-secondary/60',
        glow: 'bg-secondary/10 group-hover:bg-secondary/20',
        shadowHover: 'hover:shadow-[0_12px_44px_rgba(0,255,204,0.18)]',
        logoBorder: 'border-secondary/40 text-secondary shadow-[0_0_14px_rgba(0,255,204,0.25)]',
        titleHover: 'group-hover:text-secondary',
        timeColor: 'text-secondary',
        recruiterRing: 'ring-secondary/50',
        recruiterBadgeBg: 'bg-secondary/10 text-secondary border-secondary/30',
      };
    } else if (id % 3 === 2) {
      return {
        accent: 'primary',
        borderHover: 'hover:border-primary/60',
        glow: 'bg-primary/10 group-hover:bg-primary/20',
        shadowHover: 'hover:shadow-[0_12px_44px_rgba(255,45,120,0.18)]',
        logoBorder: 'border-primary/40 text-primary shadow-[0_0_14px_rgba(255,45,120,0.25)]',
        titleHover: 'group-hover:text-primary',
        timeColor: 'text-primary',
        recruiterRing: 'ring-primary/50',
        recruiterBadgeBg: 'bg-primary/10 text-primary border-primary/30',
      };
    } else {
      return {
        accent: 'tertiary',
        borderHover: 'hover:border-tertiary/60',
        glow: 'bg-tertiary/10 group-hover:bg-tertiary/20',
        shadowHover: 'hover:shadow-[0_12px_44px_rgba(255,224,74,0.18)]',
        logoBorder: 'border-tertiary/40 text-tertiary shadow-[0_0_14px_rgba(255,224,74,0.25)]',
        titleHover: 'group-hover:text-tertiary',
        timeColor: 'text-tertiary',
        recruiterRing: 'ring-tertiary/50',
        recruiterBadgeBg: 'bg-tertiary-container/30 text-tertiary border-tertiary/30',
      };
    }
  };

  const theme = getTheme();

  // Company initials fallback
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
    if (job.salaryMin && job.salaryMax) {
      if (job.salaryMin >= 1000000) {
        return `${(job.salaryMin / 1000000).toFixed(0)} - ${(job.salaryMax / 1000000).toFixed(0)} Triệu/tháng`;
      }
      return `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}/tháng`;
    }
    return '$2,500 - $3,500/tháng';
  };

  const aiMatchScore = job.aiMatchScore || 96;
  const aiMatchDetail = job.aiMatchDetail || 'Top 3% Profiles';
  const atsTag = job.atsTag || 'ATS Verified';
  const recruiter = job.recruiter || {
    name: 'Minh Anh HR',
    role: 'Talent Lead',
    replyTime: 'Phản hồi trong 2h • Verified Recruiter',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs1eElf3cSwfc9zkkj1RwECv2F6LtYSRphUPqOuMEceK_IAgnRg1Y54BUoRY9-rzoa2E-NSJSdY7UDfaejU2rwXZYxBpQ6oFdQH9vO5RF8Tw5y0EOMIUgHfq-oLHZyu8QEnWn5AR7IyqfOqT3YYclhcODsKPKTUSztHNfff3HwBoEIWP_IMGLN1ZnG_c4gmSJZZ_IReq8tYqp5rm6bPoSV0OhKM6kJlFJotmxh3LlQzKtPUhotnEud'
  };

  const skills = job.skills || ['Java 21', 'Spring Boot', 'Kafka', 'PostgreSQL'];
  const mockActionLabel = job.mockActionLabel || 'Mock Interview';

  return (
    <article className="card-botanical relative bg-white border border-[#E6E2DA] rounded-3xl p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between font-body text-[#2D3A31]">
      <div>
        {/* Top Row: Company & Title & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div 
              onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
              className="w-12 h-12 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] shadow-soft flex items-center justify-center font-serif font-bold text-base text-[#2D3A31] hover:scale-105 transition-transform duration-500 flex-shrink-0 cursor-pointer"
              title="Xem chi tiết đơn tuyển dụng"
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  onClick={() => onSelectJob ? onSelectJob(job) : (window.location.hash = `#/jobs/${job.jobId || 101}`)}
                  className="font-serif font-bold text-base text-[#2D3A31] hover:text-[#C27B66] transition-colors duration-300 leading-snug cursor-pointer"
                  title="Xem chi tiết đơn tuyển dụng"
                >
                  {job.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#667067] font-medium mt-0.5">
                <span className="text-[#2D3A31] font-semibold">{job.companyName}</span>
                <span className="material-symbols-outlined text-[#8C9A84] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <span>•</span>
                <span>{job.postedTime || '2h trước'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-full border border-[#E6E2DA] bg-white shadow-soft hover:bg-[#F2F0EB] transition-all duration-300 cursor-pointer ${
              bookmarked ? 'text-[#C27B66]' : 'text-[#8C9A84] hover:text-[#C27B66]'
            }`} 
            title="Lưu tin việc làm"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">
              {bookmarked ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>

        {/* Tags Row: Location & Salary */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3.5 py-1 rounded-full bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-[#8C9A84]">location_on</span>
            {job.location || 'TP.HCM • Hybrid'}
          </span>
          <span className="px-3.5 py-1 rounded-full bg-[#DCCFC2]/40 text-[#2D3A31] font-semibold border border-[#DCCFC2] flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-[#C27B66]">payments</span>
            {formatSalary()}
          </span>
        </div>

        {/* AI Advisory Match Badge */}
        <div className="mt-3.5 flex items-center justify-between px-4 py-2 rounded-2xl bg-[#8C9A84]/12 border border-[#8C9A84]/30 text-[#2D3A31] text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse"></span>
            <span>{aiMatchScore}% AI Match ({aiMatchDetail})</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-[#8C9A84]/30 text-[#2D3A31] uppercase">{atsTag}</span>
        </div>

        {/* Brief Description */}
        <p className="mt-3 text-xs text-[#667067] font-normal line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Skill Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {skills.map((skill, idx) => (
            <span 
              key={idx} 
              className="px-3 py-0.5 rounded-full bg-[#F9F8F4] text-[#2D3A31] border border-[#E6E2DA] hover:border-[#8C9A84] font-medium transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Recruiter Spotlight Section */}
        <div className="mt-4 p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] shadow-soft flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img 
                className="w-9 h-9 rounded-full object-cover border border-[#E6E2DA]" 
                src={recruiter.avatar} 
                alt={recruiter.name} 
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#8C9A84] border border-white" title="Đang trực tuyến"></span>
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-xs text-[#2D3A31] truncate">{recruiter.name}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold border border-[#8C9A84]/40 bg-[#8C9A84]/15 text-[#2D3A31]">
                  {recruiter.role}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#667067]">
                <span className="material-symbols-outlined text-[11px] text-[#8C9A84]">schedule</span>
                <span className="truncate">{recruiter.replyTime}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => alert(`Bắt đầu trò chuyện trực tiếp với ${recruiter.name} (${job.companyName})`)}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white hover:bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] shadow-soft transition-all duration-300 flex items-center justify-center cursor-pointer" 
            title="Chat nhanh với Recruiter"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-[#8C9A84]">chat</span>
          </button>
        </div>
      </div>

      {/* Card Footer & Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-[#E6E2DA] flex items-center justify-between gap-2">
        <button 
          onClick={() => {
            if (onPracticeInterview) {
              onPracticeInterview(job);
            } else {
              window.location.hash = '#/ai-interview';
            }
          }}
          className="btn-botanical-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer" 
          title="Luyện tập phỏng vấn ảo với AI"
          type="button"
        >
          <span className="material-symbols-outlined text-sm text-[#8C9A84]">psychology</span>
          <span>{mockActionLabel}</span>
        </button>
        <button 
          onClick={() => onApplyJob && onApplyJob(job)}
          className="btn-botanical-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          type="button"
        >
          <span>Ứng tuyển ngay</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </article>
  );
}
