import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatsCard from '../../components/admin/StatsCard';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_SYSTEM_STATS = {
  totalUsers: 1248,
  totalCandidates: 987,
  totalRecruiters: 254,
  totalAdmins: 7,
  activeJobs: 198,
  totalJobs: 342,
  totalApplications: 4821,
  interviewSessions: 2193,
  newUsersThisMonth: 147,
  cvsParsed: 831,
};

const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    icon: 'person_add',
    iconBg: 'bg-[#8C9A84]/15',
    iconColor: 'text-[#2D3A31]',
    text: 'New recruiter registered',
    detail: 'Nguyễn Văn Hưng • FPT Software',
    time: '3 min ago',
  },
  {
    id: 2,
    icon: 'mic',
    iconBg: 'bg-[#C27B66]/15',
    iconColor: 'text-[#C27B66]',
    text: 'Candidate completed AI interview',
    detail: 'Trần Thị Mai • Session #HM-2741 • Score 87/100',
    time: '18 min ago',
  },
  {
    id: 3,
    icon: 'quiz',
    iconBg: 'bg-[#2D3A31]/10',
    iconColor: 'text-[#2D3A31]',
    text: 'Question bank updated',
    detail: '3 new HARD questions added for category: Distributed Systems',
    time: '1 hr ago',
  },
  {
    id: 4,
    icon: 'work',
    iconBg: 'bg-[#8C9A84]/15',
    iconColor: 'text-[#2D3A31]',
    text: 'New job published',
    detail: 'Lead AI Engineer (LLM/RAG) • Viettel Digital',
    time: '2 hr ago',
  },
  {
    id: 5,
    icon: 'block',
    iconBg: 'bg-[#C27B66]/15',
    iconColor: 'text-[#C27B66]',
    text: 'User account status changed',
    detail: 'Lê Văn Spam → Status: BLOCKED (policy violation)',
    time: '4 hr ago',
  },
  {
    id: 6,
    icon: 'description',
    iconBg: 'bg-[#8C9A84]/15',
    iconColor: 'text-[#2D3A31]',
    text: 'CV parsed by AI engine',
    detail: '47 CVs processed in batch • Avg parse time 1.2s',
    time: '5 hr ago',
  },
  {
    id: 7,
    icon: 'group',
    iconBg: 'bg-[#2D3A31]/10',
    iconColor: 'text-[#2D3A31]',
    text: '12 new candidates registered',
    detail: 'Via organic sign-up flow',
    time: 'Yesterday',
  },
];

const QUICK_ACTIONS = [
  {
    id: 'users',
    label: 'Manage Users',
    description: 'View, block, or activate user accounts across all roles.',
    icon: 'manage_accounts',
    hash: '#/admin-users',
    accentColor: 'text-[#2D3A31]',
    accentBg: 'bg-[#2D3A31]/10',
  },
  {
    id: 'questions',
    label: 'Question Bank',
    description: 'Add, edit, and manage the AI interview question library.',
    icon: 'quiz',
    hash: '#/admin-questions',
    accentColor: 'text-[#C27B66]',
    accentBg: 'bg-[#C27B66]/12',
  },
  {
    id: 'analytics',
    label: 'System Analytics',
    description: 'Monitor platform growth, usage trends, and activity logs.',
    icon: 'analytics',
    hash: '#/admin-analytics',
    accentColor: 'text-[#8C9A84]',
    accentBg: 'bg-[#8C9A84]/15',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeSection] = useState('dashboard');

  const handleNavigate = (sectionId, hash) => {
    window.location.hash = hash;
  };

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10">

          {/* ── Page header ── */}
          <header className="mb-9">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-sans font-bold text-[#8C9A84] uppercase tracking-widest mb-1">
                  {today}
                </p>
                <h1 className="text-[30px] lg:text-[36px] font-serif font-bold text-[#2D3A31] leading-tight tracking-tight">
                  Admin Control Center
                </h1>
                <p className="text-[15px] font-sans text-[#2D3A31]/60 mt-1.5 leading-relaxed">
                  Monitor users, interview content, and system activity.
                </p>
              </div>

              {/* System status pill */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8C9A84]/12 border border-[#8C9A84]/25 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse" />
                <span className="text-[12px] font-sans font-semibold text-[#2D3A31]">
                  System Healthy
                </span>
              </div>
            </div>
          </header>

          {/* ── KPI Cards ── */}
          <section aria-label="Key metrics" className="mb-10">
            <p className="text-[11px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest mb-4">
              Platform Overview
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatsCard
                icon="group"
                iconBg="bg-[#2D3A31]/10"
                iconColor="text-[#2D3A31]"
                label="Total Users"
                value={MOCK_SYSTEM_STATS.totalUsers.toLocaleString()}
                trend="+147 this month"
                trendUp={true}
              />
              <StatsCard
                icon="person"
                iconBg="bg-[#8C9A84]/15"
                iconColor="text-[#2D3A31]"
                label="Candidates"
                value={MOCK_SYSTEM_STATS.totalCandidates.toLocaleString()}
                description="Registered job seekers"
              />
              <StatsCard
                icon="business_center"
                iconBg="bg-[#C27B66]/12"
                iconColor="text-[#C27B66]"
                label="Recruiters"
                value={MOCK_SYSTEM_STATS.totalRecruiters.toLocaleString()}
                description="Active company HR accounts"
              />
              <StatsCard
                icon="work"
                iconBg="bg-[#8C9A84]/15"
                iconColor="text-[#2D3A31]"
                label="Active Jobs"
                value={MOCK_SYSTEM_STATS.activeJobs.toLocaleString()}
                description={`of ${MOCK_SYSTEM_STATS.totalJobs} total`}
              />
              <StatsCard
                icon="send"
                iconBg="bg-[#2D3A31]/10"
                iconColor="text-[#2D3A31]"
                label="Applications"
                value={MOCK_SYSTEM_STATS.totalApplications.toLocaleString()}
                trend="+342 this week"
                trendUp={true}
              />
              <StatsCard
                icon="mic"
                iconBg="bg-[#C27B66]/12"
                iconColor="text-[#C27B66]"
                label="AI Interviews"
                value={MOCK_SYSTEM_STATS.interviewSessions.toLocaleString()}
                description="Mock sessions completed"
              />
            </div>
          </section>

          {/* ── Quick Actions ── */}
          <section aria-label="Quick actions" className="mb-10">
            <p className="text-[11px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest mb-4">
              Quick Actions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => { window.location.hash = action.hash; }}
                  className="card-botanical p-6 text-left group focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 hover:border-[#8C9A84]"
                  aria-label={`Go to ${action.label}`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${action.accentBg} ${action.accentColor} transition-transform duration-300 group-hover:scale-105`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
                  </div>
                  <h3 className="text-[16px] font-serif font-bold text-[#2D3A31] mb-1.5">
                    {action.label}
                  </h3>
                  <p className="text-[13px] font-sans text-[#2D3A31]/60 leading-relaxed">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4 text-[12px] font-sans font-semibold text-[#8C9A84] group-hover:text-[#2D3A31] transition-colors duration-200">
                    <span>Open</span>
                    <span className="material-symbols-outlined text-[15px] transition-transform duration-200 group-hover:translate-x-0.5">
                      arrow_forward
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent Activity ── */}
          <section aria-label="Recent system activity">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest">
                Recent Activity
              </p>
              <button
                onClick={() => { window.location.hash = '#/admin-analytics'; }}
                className="text-[12px] font-sans font-semibold text-[#8C9A84] hover:text-[#2D3A31] transition-colors duration-200 flex items-center gap-1"
              >
                View All
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="card-botanical divide-y divide-[#E6E2DA] overflow-hidden">
              {MOCK_RECENT_ACTIVITY.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-[#F2F0EB] transition-colors duration-150"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${item.iconBg} ${item.iconColor}`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-sans font-semibold text-[#2D3A31] leading-snug">
                      {item.text}
                    </p>
                    <p className="text-[12px] font-sans text-[#2D3A31]/55 mt-0.5 truncate">
                      {item.detail}
                    </p>
                  </div>

                  {/* Time */}
                  <p className="text-[11px] font-sans text-[#8C9A84] whitespace-nowrap shrink-0 mt-0.5">
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
