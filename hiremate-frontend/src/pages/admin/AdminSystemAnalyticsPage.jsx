import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatsCard from '../../components/admin/StatsCard';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_STATS = {
  '7': {
    totalUsers: 1248,
    newUsers: 23,
    totalJobs: 342,
    activeJobs: 198,
    totalApplications: 4821,
    interviewSessions: 312,
    candidates: 987,
    recruiters: 254,
    admins: 7,
  },
  '30': {
    totalUsers: 1248,
    newUsers: 147,
    totalJobs: 342,
    activeJobs: 198,
    totalApplications: 4821,
    interviewSessions: 2193,
    candidates: 987,
    recruiters: 254,
    admins: 7,
  },
  '90': {
    totalUsers: 1248,
    newUsers: 389,
    totalJobs: 342,
    activeJobs: 198,
    totalApplications: 4821,
    interviewSessions: 5820,
    candidates: 987,
    recruiters: 254,
    admins: 7,
  },
};

// User growth per month (Jan–Jun 2025)
const USER_GROWTH = {
  '7':  [12, 8, 15, 10, 18, 23],
  '30': [48, 62, 75, 91, 118, 147],
  '90': [92, 115, 148, 201, 298, 389],
};

const GROWTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Applications per month
const APPLICATIONS_DATA = {
  '7':  [210, 185, 320, 290, 410, 380],
  '30': [580, 720, 810, 940, 1100, 980],
  '90': [1200, 1450, 1820, 2100, 2650, 2980],
};

// Interview sessions per month
const INTERVIEW_DATA = {
  '7':  [28, 35, 48, 42, 55, 60],
  '30': [180, 240, 310, 380, 420, 460],
  '90': [420, 580, 780, 940, 1120, 1280],
};

// ─── SVG Line / Area Chart ────────────────────────────────────────────────────
function LineAreaChart({
  data,
  labels,
  color = '#8C9A84',
  fillColor = 'rgba(140,154,132,0.1)',
  height = 120,
  width = 400,
}) {
  if (!data || data.length === 0) return null;

  const padding = { top: 10, right: 16, bottom: 24, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data) * 1.15 || 1;
  const minVal = 0;

  const toX = (i) => padding.left + (i / (data.length - 1)) * innerW;
  const toY = (v) => padding.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  // Build polyline points
  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  // Area path: down from last point, across bottom, back to first
  const areaPath =
    `M ${toX(0)},${toY(data[0])} ` +
    data.slice(1).map((v, i) => `L ${toX(i + 1)},${toY(v)}`).join(' ') +
    ` L ${toX(data.length - 1)},${padding.top + innerH}` +
    ` L ${toX(0)},${padding.top + innerH} Z`;

  // Y-axis ticks
  const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      aria-hidden="true"
      role="img"
    >
      {/* Y gridlines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={toY(tick)}
            x2={padding.left + innerW}
            y2={toY(tick)}
            stroke="#E6E2DA"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <text
            x={padding.left - 6}
            y={toY(tick) + 4}
            textAnchor="end"
            fontSize="9"
            fill="#8C9A84"
            fontFamily="Source Sans 3, sans-serif"
          >
            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={fillColor} />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {data.map((v, i) => (
        <circle
          key={i}
          cx={toX(i)}
          cy={toY(v)}
          r="3"
          fill="#F9F8F4"
          stroke={color}
          strokeWidth="2"
        />
      ))}

      {/* X labels */}
      {labels.map((lbl, i) => (
        <text
          key={i}
          x={toX(i)}
          y={padding.top + innerH + 16}
          textAnchor="middle"
          fontSize="9"
          fill="#8C9A84"
          fontFamily="Source Sans 3, sans-serif"
        >
          {lbl}
        </text>
      ))}
    </svg>
  );
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────
function BarChart({
  data,
  labels,
  color = '#2D3A31',
  height = 120,
  width = 400,
}) {
  if (!data || data.length === 0) return null;

  const padding = { top: 10, right: 10, bottom: 24, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data) * 1.15 || 1;
  const barGap = 6;
  const barWidth = (innerW - barGap * (data.length - 1)) / data.length;

  const toY = (v) => padding.top + innerH - (v / maxVal) * innerH;
  const barH = (v) => (v / maxVal) * innerH;

  const yTick = Math.round(maxVal / 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Y gridlines */}
      {[0, yTick, Math.round(maxVal)].map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={toY(tick)}
            x2={padding.left + innerW}
            y2={toY(tick)}
            stroke="#E6E2DA"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <text
            x={padding.left - 6}
            y={toY(tick) + 4}
            textAnchor="end"
            fontSize="9"
            fill="#8C9A84"
            fontFamily="Source Sans 3, sans-serif"
          >
            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((v, i) => {
        const x = padding.left + i * (barWidth + barGap);
        return (
          <g key={i}>
            {/* Bar shadow */}
            <rect
              x={x + 2}
              y={toY(v) + 2}
              width={barWidth}
              height={barH(v)}
              rx="3"
              fill="rgba(45,58,49,0.06)"
            />
            {/* Bar */}
            <rect
              x={x}
              y={toY(v)}
              width={barWidth}
              height={barH(v)}
              rx="3"
              fill={color}
              opacity="0.85"
            />
          </g>
        );
      })}

      {/* X labels */}
      {labels.map((lbl, i) => {
        const x = padding.left + i * (barWidth + barGap) + barWidth / 2;
        return (
          <text
            key={i}
            x={x}
            y={padding.top + innerH + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#8C9A84"
            fontFamily="Source Sans 3, sans-serif"
          >
            {lbl}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Role Distribution ────────────────────────────────────────────────────────
function RoleDistribution({ candidates, recruiters, admins }) {
  const total = candidates + recruiters + admins;
  const pct = (n) => Math.round((n / total) * 100);

  const segments = [
    {
      label: 'Candidates',
      value: candidates,
      pct: pct(candidates),
      color: 'bg-[#8C9A84]',
      textColor: 'text-[#2D3A31]',
      dotColor: 'bg-[#8C9A84]',
    },
    {
      label: 'Recruiters',
      value: recruiters,
      pct: pct(recruiters),
      color: 'bg-[#C27B66]',
      textColor: 'text-[#C27B66]',
      dotColor: 'bg-[#C27B66]',
    },
    {
      label: 'Admins',
      value: admins,
      pct: pct(admins) || 1,
      color: 'bg-[#2D3A31]',
      textColor: 'text-[#2D3A31]',
      dotColor: 'bg-[#2D3A31]',
    },
  ];

  return (
    <div className="space-y-3" aria-label="User role distribution">
      {segments.map((seg) => (
        <div key={seg.label}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.dotColor}`} />
              <span className="text-[12px] font-sans font-semibold text-[#2D3A31]">
                {seg.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-sans text-[#2D3A31]/55">
                {seg.value.toLocaleString()}
              </span>
              <span className="text-[11px] font-sans font-bold text-[#8C9A84]">{seg.pct}%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E6E2DA] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${seg.color}`}
              style={{ width: `${seg.pct}%` }}
              role="progressbar"
              aria-valuenow={seg.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${seg.label}: ${seg.pct}%`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Interview Horizontal Bars ────────────────────────────────────────────────
function InterviewActivity({ data, labels }) {
  const maxVal = Math.max(...data) || 1;
  return (
    <div className="space-y-3" aria-label="Interview activity">
      {data.map((val, i) => {
        const pct = Math.round((val / maxVal) * 100);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-sans font-semibold text-[#2D3A31]">
                {labels[i]}
              </span>
              <span className="text-[12px] font-sans font-bold text-[#2D3A31]/70">
                {val.toLocaleString()} sessions
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#E6E2DA] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C27B66] transition-all duration-700"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card-botanical p-6">
      <div className="mb-4">
        <h3 className="text-[15px] font-serif font-bold text-[#2D3A31]">{title}</h3>
        {subtitle && (
          <p className="text-[12px] font-sans text-[#2D3A31]/50 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Date Range Selector ──────────────────────────────────────────────────────
function DateRangeSelector({ selected, onChange }) {
  const options = [
    { label: '7 Days', value: '7' },
    { label: '30 Days', value: '30' },
    { label: '90 Days', value: '90' },
  ];
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-full bg-[#F2F0EB] border border-[#E6E2DA]"
      role="group"
      aria-label="Date range selector"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            'px-4 py-1.5 rounded-full text-[11px] font-sans font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
            selected === opt.value
              ? 'bg-[#2D3A31] text-white shadow-soft'
              : 'text-[#2D3A31]/55 hover:text-[#2D3A31]',
          ].join(' ')}
          aria-pressed={selected === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSystemAnalyticsPage() {
  const [range, setRange] = useState('30');
  const stats = MOCK_STATS[range];
  const growthData = USER_GROWTH[range];
  const appData = APPLICATIONS_DATA[range];
  const interviewData = INTERVIEW_DATA[range];

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      <AdminSidebar
        activeSection="analytics"
        onNavigate={(_, hash) => { window.location.hash = hash; }}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10">

          {/* ── Page header ── */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-sans font-bold text-[#8C9A84] uppercase tracking-widest mb-1">
                  System Analytics · UC-35 / UC-36 / UC-37
                </p>
                <h1 className="text-[28px] lg:text-[34px] font-serif font-bold text-[#2D3A31] leading-tight tracking-tight">
                  System Analytics
                </h1>
                <p className="text-[14px] font-sans text-[#2D3A31]/60 mt-1.5">
                  Monitor platform growth, engagement, and usage trends.
                </p>
              </div>

              {/* Date range selector */}
              <DateRangeSelector selected={range} onChange={setRange} />
            </div>
          </header>

          {/* ── KPI Cards ── */}
          <section aria-label="Key analytics metrics" className="mb-10">
            <p className="text-[11px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest mb-4">
              Key Metrics
              <span className="ml-2 normal-case text-[#8C9A84] font-normal">
                — Last {range} days
              </span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatsCard
                icon="group"
                iconBg="bg-[#2D3A31]/10"
                iconColor="text-[#2D3A31]"
                label="Total Users"
                value={stats.totalUsers.toLocaleString()}
              />
              <StatsCard
                icon="person_add"
                iconBg="bg-[#8C9A84]/15"
                iconColor="text-[#2D3A31]"
                label="New Users"
                value={`+${stats.newUsers}`}
                trend="this period"
                trendUp={true}
              />
              <StatsCard
                icon="work"
                iconBg="bg-[#C27B66]/12"
                iconColor="text-[#C27B66]"
                label="Total Jobs"
                value={stats.totalJobs.toLocaleString()}
                description={`${stats.activeJobs} active`}
              />
              <StatsCard
                icon="work_history"
                iconBg="bg-[#8C9A84]/15"
                iconColor="text-[#2D3A31]"
                label="Active Jobs"
                value={stats.activeJobs.toLocaleString()}
              />
              <StatsCard
                icon="send"
                iconBg="bg-[#2D3A31]/10"
                iconColor="text-[#2D3A31]"
                label="Applications"
                value={stats.totalApplications.toLocaleString()}
              />
              <StatsCard
                icon="mic"
                iconBg="bg-[#C27B66]/12"
                iconColor="text-[#C27B66]"
                label="AI Interviews"
                value={stats.interviewSessions.toLocaleString()}
                description="sessions completed"
              />
            </div>
          </section>

          {/* ── Charts grid ── */}
          <section aria-label="Analytics charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* User Growth Chart */}
            <ChartCard
              title="User Growth"
              subtitle={`New registrations — last ${range} days (monthly)`}
            >
              <LineAreaChart
                data={growthData}
                labels={GROWTH_LABELS}
                color="#8C9A84"
                fillColor="rgba(140,154,132,0.12)"
                height={140}
                width={480}
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#8C9A84] rounded-full" />
                <span className="text-[11px] font-sans text-[#2D3A31]/50">New users / month</span>
              </div>
            </ChartCard>

            {/* Applications Overview */}
            <ChartCard
              title="Applications Overview"
              subtitle={`Job applications submitted — last ${range} days`}
            >
              <BarChart
                data={appData}
                labels={GROWTH_LABELS}
                color="#2D3A31"
                height={140}
                width={480}
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#2D3A31]/85" />
                <span className="text-[11px] font-sans text-[#2D3A31]/50">Applications / month</span>
              </div>
            </ChartCard>

            {/* Role Distribution */}
            <ChartCard
              title="User Role Distribution"
              subtitle="Breakdown of all registered accounts by role"
            >
              <RoleDistribution
                candidates={stats.candidates}
                recruiters={stats.recruiters}
                admins={stats.admins}
              />

              {/* Summary */}
              <div className="mt-5 pt-4 border-t border-[#E6E2DA] grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Candidates', val: stats.candidates, color: 'text-[#2D3A31]' },
                  { label: 'Recruiters', val: stats.recruiters, color: 'text-[#C27B66]' },
                  { label: 'Admins', val: stats.admins, color: 'text-[#2D3A31]/50' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className={`text-[20px] font-serif font-bold ${item.color}`}>
                      {item.val.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-sans text-[#2D3A31]/45 uppercase tracking-wide">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Interview Activity */}
            <ChartCard
              title="Interview Activity"
              subtitle={`AI mock interview sessions — last ${range} days`}
            >
              {/* Line chart for sessions */}
              <LineAreaChart
                data={interviewData}
                labels={GROWTH_LABELS}
                color="#C27B66"
                fillColor="rgba(194,123,102,0.1)"
                height={120}
                width={480}
              />
              <div className="mt-3 flex items-center gap-2 mb-4">
                <span className="w-3 h-0.5 bg-[#C27B66] rounded-full" />
                <span className="text-[11px] font-sans text-[#2D3A31]/50">Sessions / month</span>
              </div>

              {/* Horizontal breakdown */}
              <InterviewActivity
                data={[
                  Math.round(stats.interviewSessions * 0.58),
                  Math.round(stats.interviewSessions * 0.31),
                  Math.round(stats.interviewSessions * 0.11),
                ]}
                labels={['MOCK Sessions', 'PRACTICE RETRY Sessions', 'Incomplete / Aborted']}
              />
            </ChartCard>
          </section>

          {/* ── Platform Health Summary ── */}
          <section aria-label="Platform health summary">
            <p className="text-[11px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest mb-4">
              Platform Health
            </p>
            <div className="card-botanical p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: 'speed',
                    iconBg: 'bg-[#8C9A84]/15',
                    label: 'API Response Time',
                    value: '< 20ms',
                    desc: 'AI match cache read',
                    status: 'Optimal',
                    statusColor: 'text-[#8C9A84]',
                  },
                  {
                    icon: 'storage',
                    iconBg: 'bg-[#2D3A31]/10',
                    label: 'Database',
                    value: 'Supabase Cloud',
                    desc: 'PostgreSQL 16+ • 3NF',
                    status: 'Connected',
                    statusColor: 'text-[#8C9A84]',
                  },
                  {
                    icon: 'psychology',
                    iconBg: 'bg-[#C27B66]/12',
                    label: 'Gemini AI Engine',
                    value: '99.8% uptime',
                    desc: '30-day rolling average',
                    status: 'Operational',
                    statusColor: 'text-[#8C9A84]',
                  },
                  {
                    icon: 'security',
                    iconBg: 'bg-[#2D3A31]/10',
                    label: 'Security',
                    value: 'JWT + BCrypt',
                    desc: 'Spring Security active',
                    status: 'Secure',
                    statusColor: 'text-[#8C9A84]',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#2D3A31]">
                        {item.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className="text-[14px] font-sans font-bold text-[#2D3A31] mt-0.5">
                        {item.value}
                      </p>
                      <p className="text-[11px] font-sans text-[#2D3A31]/50">{item.desc}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-sans font-bold mt-1 ${item.statusColor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
