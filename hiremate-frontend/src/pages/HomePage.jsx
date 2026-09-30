import React, { useState, useEffect } from 'react';
import JobCard from '../components/jobs/JobCard';
import JobFilterSidebar from '../components/jobs/JobFilterSidebar';
import JobDetailModal from '../components/jobs/JobDetailModal';
import ApplyJobModal from '../components/jobs/ApplyJobModal';
import { jobApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';

const SHOWCASE_JOBS = [
  {
    jobId: 101,
    title: 'Trưởng Phòng Phân Tích Tài Chính & Dòng Tiền (FP&A Lead)',
    companyName: 'MBBank Financial Group',
    companyInitials: 'MBB',
    postedTime: '1h trước',
    location: 'Hà Nội • Hybrid',
    salaryText: '$2,200 - $3,500/tháng',
    aiMatchScore: 97,
    aiMatchDetail: 'Top 2% Financial Analysts',
    atsTag: 'Kinh Tế & Tài Chính',
    description: 'Chủ trì lập mô hình tài chính động (Financial Modeling), thẩm định danh mục đầu tư DCF/WACC và quản trị tối ưu hóa vốn lưu động toàn hàng.',
    skills: ['Financial Modeling', 'DCF / Valuation', 'Working Capital', 'Power BI'],
    recruiter: {
      name: 'Minh Hạnh CFA',
      role: 'Head of Financial Talent',
      replyTime: 'Phản hồi trong 1h • Verified Recruiter',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    },
    mockActionLabel: 'Luyện PV Tài Chính',
  },
  {
    jobId: 102,
    title: 'Senior Digital Marketing & Growth Lead',
    companyName: 'Vinamilk Group',
    companyInitials: 'VNM',
    postedTime: '2h trước',
    location: 'TP.HCM • Hybrid',
    salaryText: '$2,000 - $3,200/tháng',
    aiMatchScore: 95,
    aiMatchDetail: 'Growth & Omnichannel',
    atsTag: 'Marketing & Digital',
    description: 'Điều hành chiến lược tiếp thị số đa kênh (Omnichannel), tối ưu phễu chuyển đổi Full-funnel CAC/LTV và chỉ đạo các chiến dịch truyền thông thương hiệu lớn.',
    skills: ['Omnichannel Growth', 'CAC / LTV Optimization', 'Brand Strategy', 'Performance Ads'],
    recruiter: {
      name: 'Hoàng Yến',
      role: 'Marketing Talent Partner',
      replyTime: 'Phản hồi trong 2h • Phỏng vấn ngay tuần này',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    },
    mockActionLabel: 'Luyện PV Marketing',
  },
  {
    jobId: 103,
    title: 'Giám Đốc Kinh Doanh B2B Doanh Nghiệp (Enterprise Sales Lead)',
    companyName: 'Viettel Solutions',
    companyInitials: 'VTS',
    postedTime: '3h trước',
    location: 'Hà Nội & TP.HCM',
    salaryText: '$2,800 - $4,500/tháng',
    aiMatchScore: 93,
    aiMatchDetail: 'B2B Enterprise Closer',
    atsTag: 'Kinh Doanh & Sales',
    description: 'Dẫn dắt các thương vụ bán giải pháp chuyển đổi số quy mô lớn cho tập đoàn và khối cơ quan chính phủ, trực tiếp đàm phán hợp đồng cấp C-level.',
    skills: ['B2B Enterprise Sales', 'Key Account Deal', 'Contract Negotiation', 'Solution Selling'],
    recruiter: {
      name: 'Quốc Bảo',
      role: 'Enterprise Talent Lead',
      replyTime: 'Phản hồi trong 1h • Hỗ trợ trực tiếp',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    mockActionLabel: 'Luyện PV B2B Sales',
  },
  {
    jobId: 104,
    title: 'Talent Acquisition & HR Business Partner (HRBP)',
    companyName: 'FPT Corporation',
    companyInitials: 'FPT',
    postedTime: '4h trước',
    location: 'TP.HCM • Onsite Campus',
    salaryText: '$1,800 - $2,800/tháng',
    aiMatchScore: 94,
    aiMatchDetail: 'HRBP & Talent Advisory',
    atsTag: 'Nhân Sự & Quản Trị',
    description: 'Xây dựng chiến lược thu hút nhân tài cấp cao, đồng hành cùng lãnh đạo khối kinh doanh thiết kế cơ chế lương thưởng 3P và văn hóa gắn kết.',
    skills: ['Talent Acquisition', 'HRBP Model', 'C&B Framework', 'Behavioral Interview'],
    recruiter: {
      name: 'Minh Anh HR',
      role: 'Talent Lead',
      replyTime: 'Phản hồi trong 2h • Verified Recruiter',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    },
    mockActionLabel: 'Luyện PV HR',
  },
  {
    jobId: 105,
    title: 'Senior Backend Engineer (Microservices & High QPS)',
    companyName: 'FPT Software',
    companyInitials: 'FSW',
    postedTime: '2h trước',
    location: 'TP.HCM • Hybrid',
    salaryText: '$2,500 - $3,500/tháng',
    aiMatchScore: 96,
    aiMatchDetail: 'Top 3% Profiles',
    atsTag: 'Công Nghệ Thông Tin',
    description: 'Thiết kế kiến trúc vi dịch vụ quy mô 50k+ QPS trên nền tảng Kafka, Java 21, Spring Boot và bộ nhớ đệm phân tán Redis Cluster.',
    skills: ['Java 21', 'Spring Boot', 'Kafka', 'PostgreSQL'],
    recruiter: {
      name: 'Thanh Phong',
      role: 'Tech Lead Recruiter',
      replyTime: 'Phản hồi trong 1h • Fast-track',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    mockActionLabel: 'Mock Tech Interview',
  },
  {
    jobId: 106,
    title: 'Chuyên Viên Tối Ưu Chuỗi Cung Ứng & Logistics (SCM)',
    companyName: 'Shopee Logistics VN',
    companyInitials: 'SPE',
    postedTime: '5h trước',
    location: 'TP.HCM • Hybrid',
    salaryText: '$1,800 - $2,700/tháng',
    aiMatchScore: 91,
    aiMatchDetail: 'Fulfillment & Lean SCM',
    atsTag: 'Logistics & Vận Hành',
    description: 'Quy hoạch mạng lưới điều phối kho bãi fulfillment, tối ưu hóa mức tồn kho an toàn (Safety Stock) và chi phí vận chuyển chặng cuối (Last-mile).',
    skills: ['Supply Chain (SCM)', 'Inventory EOQ', 'Warehouse Logistics', 'Lean Operations'],
    recruiter: {
      name: 'Hoàng Phúc',
      role: 'Operations Talent Partner',
      replyTime: 'Phản hồi trong 2h • Đãi ngộ cạnh tranh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
    mockActionLabel: 'Luyện PV Logistics',
  },
];

export default function HomePage({ user }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [jobs, setJobs] = useState(SHOWCASE_JOBS);
  const [searchTitle, setSearchTitle] = useState('Senior Backend Engineer');
  const [selectedLocation, setSelectedLocation] = useState('Ho Chi Minh City, VN');
  const [selectedSalary, setSelectedSalary] = useState('$1,500 - $3,500+');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortOption, setSortOption] = useState('Điểm AI Match cao nhất (≥90%)');

  // Filter chips in Header Bar
  const [filterMatchPill, setFilterMatchPill] = useState(true);
  const [filterSkillPill, setFilterSkillPill] = useState(true);

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [showLivingWorld, setShowLivingWorld] = useState(true);

  useEffect(() => {
    // Optionally fetch jobs from backend API if available
    jobApi.getJobs()
      .then(res => {
        if (res.data && res.data.length > 0) {
          // Merge API jobs or enrich them with showcase styling if needed
          const merged = res.data.map((j, idx) => ({
            ...j,
            jobId: j.jobId || idx + 200,
            companyInitials: j.companyName ? j.companyName.slice(0, 3).toUpperCase() : 'JOB',
            postedTime: 'Vừa đăng',
            salaryText: j.salaryMin && j.salaryMax ? `$${j.salaryMin} - $${j.salaryMax}/tháng` : '$2,000 - $4,000/tháng',
            aiMatchScore: 90 + (idx % 8),
            aiMatchDetail: 'ATS Benchmark',
            atsTag: 'Verified',
            skills: j.requirements ? j.requirements.split(',').slice(0, 4) : ['Java', 'Spring', 'Cloud', 'SQL'],
            mockActionLabel: 'Mock Interview',
          }));
          setJobs([...SHOWCASE_JOBS, ...merged]);
        }
      })
      .catch(() => {
        // Fallback gracefully to SHOWCASE_JOBS
        setJobs(SHOWCASE_JOBS);
      });
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchTitle.trim().toLowerCase();
    if (!query) {
      setJobs(SHOWCASE_JOBS);
      return;
    }
    const filtered = SHOWCASE_JOBS.filter(j => 
      j.title.toLowerCase().includes(query) ||
      j.companyName.toLowerCase().includes(query) ||
      j.skills.some(s => s.toLowerCase().includes(query))
    );
    setJobs(filtered.length > 0 ? filtered : SHOWCASE_JOBS);
  };

  const handleTrendingClick = (tag) => {
    const cleanTag = tag.replace('#', '');
    setSearchTitle(cleanTag);
    const filtered = SHOWCASE_JOBS.filter(j => 
      j.title.toLowerCase().includes(cleanTag.toLowerCase()) ||
      j.skills.some(s => s.toLowerCase().includes(cleanTag.toLowerCase()))
    );
    setJobs(filtered.length > 0 ? filtered : SHOWCASE_JOBS);
  };

  return (
    <div className="bg-transparent font-body text-[#2D3A31] antialiased min-h-screen flex flex-col">
      {/* ========================================================= */}
      {/* 2. HERO SEARCH SECTION (Botanical Organic Serif Hero)     */}
      {/* ========================================================= */}
      <section className="relative w-full overflow-hidden bg-transparent py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Botanical Tag badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F2F0EB] border border-[#E6E2DA] shadow-soft text-xs font-serif font-medium text-[#2D3A31] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse"></span>
            <span>AI Precision Career Matrix • Đa Ngành Nghề</span>
          </div>

          <h1 className="font-serif font-bold text-4xl sm:text-6xl lg:text-7xl text-[#2D3A31] tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Discover Your Next Career with{" "}
            <span className="italic font-normal text-[#C27B66]">
              Precision AI Matching
            </span>
          </h1>

          <p className="font-body text-base sm:text-lg text-[#667067] mt-5 max-w-2xl mx-auto leading-relaxed">
            Khám phá các vị trí tuyển dụng đa ngành (Kinh tế, Tài chính, Marketing, B2B Sales, HR, Logistics & IT) được đo lường chính xác bằng AI.
          </p>

          {/* Central Search Container - Botanical Soft Alabaster Box */}
          <div className="mt-10 max-w-5xl mx-auto bg-white p-4 sm:p-5 rounded-3xl border border-[#E6E2DA] shadow-soft-lg">
            <form className="grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={handleSearchSubmit}>
              {/* Input 1: Title, Skill, Company */}
              <div className="md:col-span-5 relative flex items-center bg-[#F9F8F4] rounded-full px-4 py-3 border border-[#E6E2DA] focus-within:border-[#8C9A84] focus-within:shadow-[0_0_0_2px_rgba(140,154,132,0.2)] transition-all">
                <span className="material-symbols-outlined mr-2 text-xl text-[#8C9A84]">search</span>
                <input 
                  className="w-full bg-transparent text-sm text-[#2D3A31] placeholder:text-[#9BA39B] focus:outline-none font-body font-normal" 
                  placeholder="Tìm vị trí, kỹ năng, tài chính, marketing, sales..." 
                  type="text" 
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>

              {/* Input 2: Location */}
              <div className="md:col-span-3 relative flex items-center bg-[#F9F8F4] rounded-full px-4 py-3 border border-[#E6E2DA] focus-within:border-[#8C9A84] focus-within:shadow-[0_0_0_2px_rgba(140,154,132,0.2)] transition-all">
                <span className="material-symbols-outlined mr-2 text-xl text-[#8C9A84]">location_on</span>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#2D3A31] focus:outline-none font-body font-normal cursor-pointer"
                >
                  <option value="All Locations">Tất cả địa điểm</option>
                  <option value="Ho Chi Minh City, VN">TP. Hồ Chí Minh</option>
                  <option value="Hanoi, VN">Hà Nội</option>
                  <option value="Da Nang, VN">Đà Nẵng</option>
                  <option value="Remote Worldwide">Làm việc từ xa (Remote)</option>
                </select>
              </div>

              {/* Input 3: Salary Range */}
              <div className="md:col-span-2 relative flex items-center bg-[#F9F8F4] rounded-full px-4 py-3 border border-[#E6E2DA] focus-within:border-[#8C9A84] focus-within:shadow-[0_0_0_2px_rgba(140,154,132,0.2)] transition-all">
                <span className="material-symbols-outlined text-[#C27B66] mr-1.5 text-xl">payments</span>
                <select 
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#2D3A31] focus:outline-none font-body font-normal cursor-pointer"
                >
                  <option value="All Salaries">Mọi mức lương</option>
                  <option value="$1,500 - $3,500+">$1,500 - $3,500+</option>
                  <option value="$3,500 - $5,000+">$3,500 - $5,000+</option>
                  <option value="$5,000+ (Staff/Lead)">$5,000+ (Leader/Manager)</option>
                </select>
              </div>

              {/* CTA Button */}
              <div className="md:col-span-2">
                <button 
                  className="btn-botanical-primary w-full h-full min-h-[48px] px-6 py-3 text-xs tracking-widest flex items-center justify-center gap-1.5 cursor-pointer" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-base">radar</span>
                  <span>Tìm Việc</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Trending Filter Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-body">
            <span className="text-[#667067] flex items-center gap-1 mr-1 font-medium">
              <span className="material-symbols-outlined text-sm text-[#8C9A84]">trending_up</span> Xu hướng:
            </span>
            {['#Java', '#ReactJS', '#Remote', '#Senior', '#FullStack'].map((chip) => (
              <button 
                key={chip}
                onClick={() => handleTrendingClick(chip)}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#2D3A31] border border-[#E6E2DA] hover:border-[#8C9A84] hover:bg-[#F2F0EB] text-xs font-medium transition-all cursor-pointer shadow-soft"
                type="button"
              >
                {chip}
              </button>
            ))}
            <button 
              onClick={() => {
                setJobs(SHOWCASE_JOBS.filter(j => j.aiMatchScore >= 80));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/40 font-semibold text-xs cursor-pointer shadow-soft hover:bg-[#8C9A84]/25 transition-colors"
              type="button"
            >
              <span className="w-2 h-2 rounded-full bg-[#8C9A84]"></span>
              <span>AI Match &gt; 80%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT AREA (2-Column Split)                      */}
      {/* ========================================================= */}
      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===================================================== */}
          {/* LEFT SIDEBAR: FILTERS PANEL (28%)                     */}
          {/* ===================================================== */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-5">
            <JobFilterSidebar 
              filters={{ keyword: searchTitle, location: selectedLocation }}
              onFilterChange={(newFilters) => {
                if (newFilters.keyword) setSearchTitle(newFilters.keyword);
              }}
              onReset={() => {
                setSearchTitle('');
                setJobs(SHOWCASE_JOBS);
              }}
            />
          </aside>

          {/* ===================================================== */}
          {/* RIGHT MAIN COLUMN: JOB LIST GRID (72%)                */}
          {/* ===================================================== */}
          <section className="lg:col-span-9 space-y-6">
            {/* Header Bar: Result count & Sort controls */}
            <div className="card-botanical bg-white rounded-3xl p-5 border border-[#E6E2DA] shadow-soft flex flex-wrap items-center justify-between gap-4 transition-all">
              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse"></span>
                  <span className="font-serif font-bold text-base text-[#2D3A31]">
                    Tìm thấy <span className="text-[#C27B66]">142 việc làm</span> phù hợp cao
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filterMatchPill && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/40">
                      <span className="material-symbols-outlined text-[13px] text-[#8C9A84]">auto_awesome</span>
                      Match ≥ 80% 
                      <button 
                        onClick={() => setFilterMatchPill(false)} 
                        className="hover:text-[#C27B66] ml-1 cursor-pointer font-bold" 
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filterSkillPill && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F2F0EB] text-[#2D3A31] text-xs font-medium border border-[#E6E2DA]">
                      Java, Spring 
                      <button 
                        onClick={() => setFilterSkillPill(false)} 
                        className="hover:text-[#C27B66] ml-1 cursor-pointer font-bold" 
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#F2F0EB] rounded-full p-1 border border-[#E6E2DA]">
                  <button 
                    onClick={() => setViewMode('grid')}
                    title="Grid View" 
                    className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-white text-[#2D3A31] shadow-soft font-bold' 
                        : 'text-[#667067] hover:text-[#2D3A31]'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">grid_view</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    title="List View" 
                    className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-white text-[#2D3A31] shadow-soft font-bold' 
                        : 'text-[#667067] hover:text-[#2D3A31]'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">view_list</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-body font-medium text-[#667067]">Sắp xếp:</span>
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="py-1.5 px-3 bg-[#F9F8F4] rounded-full text-xs font-body font-medium text-[#2D3A31] border border-[#E6E2DA] focus:border-[#8C9A84] focus:outline-none cursor-pointer"
                  >
                    <option value="Điểm AI Match cao nhất (≥90%)">Điểm AI Match cao nhất (≥90%)</option>
                    <option value="Mới đăng gần đây">Mới đăng gần đây</option>
                    <option value="Lương: Cao đến thấp">Lương: Cao đến thấp</option>
                    <option value="Doanh nghiệp tuyển gấp">Doanh nghiệp tuyển gấp</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2-Column Grid of High-Density Job Cards */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {jobs.map((job) => (
                <JobCard 
                  key={job.jobId} 
                  job={job}
                  onSelectJob={(j) => {
                    window.location.hash = `#/jobs/${j.jobId || 101}`;
                  }}
                  onApplyJob={(j) => {
                    if (!user) {
                      window.location.hash = '#/login';
                      return;
                    }
                    setApplyingJob(j);
                  }}
                  onPracticeInterview={(j) => {
                    if (!user) {
                      window.location.hash = '#/login';
                      return;
                    }
                    window.location.hash = `#/ai-interview?jobId=${j.jobId || 101}`;
                  }}
                />
              ))}
            </div>

            {/* ===================================================== */}
            {/* PAGINATION & LOAD MORE BAR                            */}
            {/* ===================================================== */}
            <div className="card-sticker bg-white rounded-2xl p-4 border-2 border-[#1E293B] shadow-pop flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div className="text-xs font-heading font-bold text-[#64748B]">
                Hiển thị <span className="font-black text-[#1E293B]">1 - 6</span> trong <span className="font-black text-[#1E293B]">142</span> việc làm
              </div>
              <div className="flex items-center gap-1.5 text-xs font-heading">
                <button 
                  className="p-2 rounded-xl bg-[#F1F5F9] text-[#64748B] border-2 border-[#CBD5E1] cursor-not-allowed opacity-50" 
                  disabled
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button 
                  className="w-8 h-8 rounded-xl bg-[#8B5CF6] text-white font-black border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] cursor-pointer"
                  type="button"
                >
                  1
                </button>
                <button 
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1E293B] font-bold border-2 border-[#1E293B] transition-colors cursor-pointer"
                  type="button"
                >
                  2
                </button>
                <button 
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1E293B] font-bold border-2 border-[#1E293B] transition-colors cursor-pointer"
                  type="button"
                >
                  3
                </button>
                <span className="px-1 text-[#64748B] font-bold">...</span>
                <button 
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1E293B] font-bold border-2 border-[#1E293B] transition-colors cursor-pointer"
                  type="button"
                >
                  12
                </button>
                <button 
                  className="btn-candy px-3.5 py-1.5 bg-[#FBBF24] text-[#1E293B] font-black transition-all flex items-center gap-1 cursor-pointer"
                  type="button"
                >
                  <span>Trang kế</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={(j) => setApplyingJob(j)}
        />
      )}

      {applyingJob && (
        <ApplyJobModal
          job={applyingJob}
          user={user}
          onClose={() => setApplyingJob(null)}
          onSuccess={() => {
            alert('Nộp hồ sơ ứng tuyển thành công!');
          }}
        />
      )}
    </div>
  );
}
