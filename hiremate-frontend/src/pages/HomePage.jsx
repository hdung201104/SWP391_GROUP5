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
    companyLogo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=120&auto=format&fit=crop&q=80',
    postedTime: '1h trước',
    updatedDate: '12/10/2026',
    deadline: '12/11/2026',
    location: 'Hà Nội • Hybrid',
    salaryText: '$2,200 - $3,500/tháng',
    aiMatchScore: 97,
    aiMatchDetail: 'Top 2% Financial Analysts',
    atsTag: 'Kinh Tế & Tài Chính',
    description: 'Chủ trì lập mô hình tài chính động (Financial Modeling), thẩm định danh mục đầu tư DCF/WACC và quản trị tối ưu hóa vốn lưu động toàn hàng.\n• Phụ trách theo mảng chuyên môn đối với tất cả dự án đầu tư của Ngân hàng\n• Lập, kiểm tra mô hình định giá, tư vấn chiến lược dòng tiền cho Ban Lãnh đạo\n• Đề xuất ý tưởng, tham gia các hoạt động nghiên cứu mở rộng danh mục tài chính',
    projectTasks: [
      'Chỉ đạo thẩm định kế hoạch giải ngân vốn và cấu trúc vốn lưu động cho các công ty thành viên.',
      'Phối hợp với kiểm toán độc lập và đối tác để tối ưu hóa chi phí vốn.'
    ],
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
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    postedTime: '2h trước',
    updatedDate: '12/10/2026',
    deadline: '12/11/2026',
    location: 'TP.HCM • Hybrid',
    salaryText: '$2,000 - $3,200/tháng',
    aiMatchScore: 95,
    aiMatchDetail: 'Growth & Omnichannel',
    atsTag: 'Marketing & Digital',
    description: 'Điều hành chiến lược tiếp thị số đa kênh (Omnichannel), tối ưu phễu chuyển đổi Full-funnel CAC/LTV và chỉ đạo các chiến dịch truyền thông lớn.\n• Phụ trách theo mảng chuyên môn Performance Ads, SEO và CRM toàn diện\n• Lập kế hoạch phân bổ ngân sách tiếp thị số và đánh giá hiệu quả chiến dịch\n• Đề xuất ý tưởng sáng tạo thông điệp thương hiệu trên các kênh số',
    projectTasks: [
      'Điều phối chiến dịch ra mắt sản phẩm mới cùng các đối tác truyền thông quốc tế.',
      'Quản lý tiến độ KPI chuyển đổi doanh số theo từng quý.'
    ],
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
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
    postedTime: '3h trước',
    updatedDate: '12/10/2026',
    deadline: '12/11/2026',
    location: 'Hà Nội & TP.HCM',
    salaryText: '$2,800 - $4,500/tháng',
    aiMatchScore: 93,
    aiMatchDetail: 'B2B Enterprise Closer',
    atsTag: 'Kinh Doanh & Sales',
    description: 'Dẫn dắt các thương vụ bán giải pháp chuyển đổi số quy mô lớn cho tập đoàn và khối chính phủ, trực tiếp đàm phán hợp đồng cấp C-level.\n• Phụ trách theo mảng chuyên môn tư vấn giải pháp CNTT doanh nghiệp lớn\n• Lập hồ sơ thầu, thẩm định giải pháp kỹ thuật và tư vấn thương mại\n• Đề xuất ý tưởng tiếp cận khách hàng chiến lược và mở rộng mạng lưới đối tác',
    projectTasks: [
      'Dẫn dắt đội ngũ kỹ sư giải pháp (Pre-sales) thương thảo hợp đồng trọng điểm.',
      'Quản lý hợp đồng dài hạn và duy trì mối quan hệ đối tác cấp cao.'
    ],
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
    companyLogo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&auto=format&fit=crop&q=80',
    postedTime: '4h trước',
    updatedDate: '12/10/2026',
    deadline: '12/11/2026',
    location: 'TP.HCM • Onsite Campus',
    salaryText: '$1,800 - $2,800/tháng',
    aiMatchScore: 94,
    aiMatchDetail: 'HRBP & Talent Advisory',
    atsTag: 'Nhân Sự & Quản Trị',
    description: 'Xây dựng chiến lược thu hút nhân tài cấp cao, đồng hành cùng lãnh đạo khối kinh doanh thiết kế cơ chế lương thưởng 3P và văn hóa gắn kết.\n• Phụ trách theo mảng chuyên môn tuyển dụng và hoạch định nguồn nhân lực\n• Thiết kế khung năng lực, tư vấn lộ trình phát triển nghề nghiệp cho từng phòng ban\n• Đề xuất ý tưởng cải tiến trải nghiệm ứng viên và nhân viên mới',
    projectTasks: [
      'Quản lý dự án chuyển đổi số công tác nhân sự và chuẩn hóa quy trình tuyển dụng.',
      'Tổ chức các chương trình đào tạo nội bộ và nâng cao năng lực đội ngũ.'
    ],
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
    companyLogo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    postedTime: '2h trước',
    updatedDate: '12/10/2026',
    deadline: '12/11/2026',
    location: 'TP.HCM • Hybrid',
    salaryText: '$2,500 - $3,500/tháng',
    aiMatchScore: 96,
    aiMatchDetail: 'Top 3% Profiles',
    atsTag: 'Công Nghệ Thông Tin',
    description: 'Thiết kế kiến trúc vi dịch vụ quy mô 50k+ QPS trên nền tảng Kafka, Java 21, Spring Boot và bộ nhớ đệm phân tán Redis Cluster.\n• Phụ trách theo mảng chuyên môn thiết kế hệ thống phân tán và cơ sở dữ liệu lớn\n• Lập, kiểm tra bản vẽ kiến trúc phần mềm, tư vấn tối ưu hóa truy vấn SQL\n• Đề xuất ý tưởng ứng dụng công nghệ mới và tự động hóa CI/CD',
    projectTasks: [
      'Phối hợp cùng đội ngũ DevOps và Security đảm bảo độ sẵn sàng 99.99% của dịch vụ.',
      'Mentor các kỹ sư trẻ và chuẩn hóa quy trình code review chuyên sâu.'
    ],
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
    companyLogo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=80',
    postedTime: '5h trước',
    updatedDate: '12/10/2026',
    deadline: '12/11/2026',
    location: 'TP.HCM • Hybrid',
    salaryText: '$1,800 - $2,700/tháng',
    aiMatchScore: 91,
    aiMatchDetail: 'Fulfillment & Lean SCM',
    atsTag: 'Logistics & Vận Hành',
    description: 'Quy hoạch mạng lưới điều phối kho bãi fulfillment, tối ưu hóa mức tồn kho an toàn (Safety Stock) và chi phí vận chuyển chặng cuối (Last-mile).\n• Phụ trách theo mảng chuyên môn vận hành chuỗi cung ứng và định tuyến giao vận\n• Lập báo cáo dự báo nhu cầu lưu kho, phân tích luồng hàng hóa định kỳ\n• Đề xuất ý tưởng tự động hóa quy trình phân loại và điều phối giao hàng',
    projectTasks: [
      'Quản lý tiến độ triển khai trung tâm phân loại thông minh cấp vùng.',
      'Đàm phán hợp đồng vận chuyển với các đối tác logistics chiến lược.'
    ],
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
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
            updatedDate: '12/10/2026',
            deadline: '12/11/2026',
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
    <div className="bg-transparent font-sans text-[#1e1b4b] antialiased min-h-screen flex flex-col">
      {/* ========================================================= */}
      {/* 2. HERO SEARCH SECTION (Mindskills Indigo Gamified Hero)   */}
      {/* ========================================================= */}
      <section className="relative w-full overflow-hidden bg-transparent py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-7xl text-[#1e1b4b] tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Discover Your Next Career with{" "}
            <span className="text-[#5b48bd]">
              Precision AI Matching
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed font-medium">
            HireMate AI — Hệ thống tuyển dụng &amp; luyện phỏng vấn thông minh, giúp kết nối ứng viên tài năng với nhà tuyển dụng phù hợp nhất dựa trên công nghệ AI vượt trội.
          </p>

          {/* Central Search Container - Mindskills White Card */}
          <div className="mt-8 max-w-5xl mx-auto bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-xl">
            <form className="grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={handleSearchSubmit}>
              {/* Input 1: Title, Skill, Company */}
              <div className="md:col-span-5 relative flex items-center bg-[#f4f2fd] rounded-full px-4 py-3 border border-purple-100 focus-within:border-[#5b48bd] focus-within:ring-2 focus-within:ring-[#5b48bd]/20 transition-all">
                <span className="material-symbols-outlined mr-2 text-xl text-[#5b48bd]">search</span>
                <input 
                  className="w-full bg-transparent text-sm text-[#1e1b4b] placeholder:text-purple-400 focus:outline-none font-sans font-medium" 
                  placeholder="Tìm vị trí, kỹ năng, tài chính, marketing, sales..." 
                  type="text" 
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>


              {/* Input 2: Location */}
              <div className="md:col-span-3 relative flex items-center bg-[#f4f2fd] rounded-full px-4 py-3 border border-purple-100 focus-within:border-[#5b48bd] focus-within:ring-2 focus-within:ring-[#5b48bd]/20 transition-all">
                <span className="material-symbols-outlined mr-2 text-xl text-[#5b48bd]">location_on</span>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#1e1b4b] focus:outline-none font-sans font-medium cursor-pointer"
                >
                  <option value="All Locations">Tất cả địa điểm</option>
                  <option value="Ho Chi Minh City, VN">TP. Hồ Chí Minh</option>
                  <option value="Hanoi, VN">Hà Nội</option>
                  <option value="Da Nang, VN">Đà Nẵng</option>
                  <option value="Remote Worldwide">Làm việc từ xa (Remote)</option>
                </select>
              </div>

              {/* Input 3: Salary Range */}
              <div className="md:col-span-2 relative flex items-center bg-[#f4f2fd] rounded-full px-4 py-3 border border-purple-100 focus-within:border-[#5b48bd] focus-within:ring-2 focus-within:ring-[#5b48bd]/20 transition-all">
                <span className="material-symbols-outlined text-[#10b981] mr-1.5 text-xl">payments</span>
                <select 
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#1e1b4b] focus:outline-none font-sans font-medium cursor-pointer"
                >
                  <option value="All Salaries">Mọi mức lương</option>
                  <option value="$1,500 - $3,500+">$1,500 - $3,500+</option>
                  <option value="$3,500 - $5,000+">$3,500 - $5,000+</option>
                  <option value="$5,000+">$5,000+ (Leader/Manager)</option>
                </select>
              </div>

              {/* CTA Button */}
              <div className="md:col-span-2">
                <button 
                  className="w-full h-full min-h-[48px] px-6 py-3 text-xs font-bold tracking-wide text-white bg-[#5b48bd] hover:bg-[#4a39a8] rounded-full shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  <span>Tìm Việc</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Trending Filter Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-body">
            <span className="text-slate-500 flex items-center gap-1 mr-1 font-medium">
              <span className="material-symbols-outlined text-sm text-[#5b48bd]">trending_up</span> Xu hướng:
            </span>
            {['#Java', '#ReactJS', '#Remote', '#Senior', '#FullStack'].map((chip) => (
              <button 
                key={chip}
                onClick={() => handleTrendingClick(chip)}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#1e1b4b] border border-purple-100 hover:border-[#5b48bd] hover:bg-purple-50 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                type="button"
              >
                {chip}
              </button>
            ))}
            <button 
              onClick={() => {
                setJobs(SHOWCASE_JOBS.filter(j => j.aiMatchScore >= 80));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 font-bold text-xs cursor-pointer shadow-sm hover:bg-emerald-100 transition-colors"
              type="button"
            >
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>AI Match ≥ 80%</span>
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
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              {/* Left Column: Result count & filter tags underneath */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  <span className="font-bold text-base text-[#1e1b4b]">
                    Tìm thấy <span className="text-[#5b48bd] font-extrabold">{jobs.length} việc làm</span> phù hợp
                  </span>
                </div>

                {(filterMatchPill || filterSkillPill) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {filterMatchPill && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-[#059669] border border-emerald-200 leading-none">
                        <span className="material-symbols-outlined text-[10px] text-[#059669]">auto_awesome</span>
                        <span>Match ≥ 80%</span>
                        <button 
                          onClick={() => setFilterMatchPill(false)} 
                          className="hover:text-red-500 ml-0.5 cursor-pointer font-bold text-[10px] leading-none" 
                          type="button"
                          title="Bỏ lọc Match ≥ 80%"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filterSkillPill && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#5b48bd] text-xs font-semibold border border-purple-200 shadow-2xs">
                        <span>Java, Spring</span>
                        <button 
                          onClick={() => setFilterSkillPill(false)} 
                          className="hover:text-red-500 ml-0.5 cursor-pointer font-bold text-xs leading-none" 
                          type="button"
                          title="Bỏ lọc Java, Spring"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: View mode toggle & Sort dropdown */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex items-center bg-purple-50 rounded-full p-1 border border-purple-100">
                  <button 
                    onClick={() => setViewMode('list')}
                    title="Bố cục ngang (List View)" 
                    className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-white text-[#5b48bd] shadow-sm font-bold' 
                        : 'text-slate-400 hover:text-[#5b48bd]'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">view_list</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    title="Bố cục ô vuông (Grid View)" 
                    className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-white text-[#5b48bd] shadow-sm font-bold' 
                        : 'text-slate-400 hover:text-[#5b48bd]'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">grid_view</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-medium text-slate-500">Sắp xếp:</span>
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="py-1.5 px-3 bg-purple-50 rounded-full text-xs font-sans font-semibold text-[#1e1b4b] border border-purple-200 focus:border-[#5b48bd] focus:outline-none cursor-pointer"
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
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 transition-all font-sans">
              <div className="text-xs sm:text-sm font-medium text-slate-500">
                Hiển thị <span className="font-bold text-[#1e1b4b]">1 - 6</span> trong <span className="font-bold text-[#5b48bd]">142</span> việc làm
              </div>
              <div className="flex items-center gap-1.5 text-xs font-sans">
                <button 
                  className="w-9 h-9 rounded-full bg-slate-50 text-slate-300 border border-purple-100 flex items-center justify-center cursor-not-allowed opacity-60" 
                  disabled
                  type="button"
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-[#5b48bd] text-white font-bold shadow-md flex items-center justify-center cursor-pointer transition-all hover:bg-[#4a39a8] hover:scale-105"
                  type="button"
                >
                  1
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-white hover:bg-purple-50 hover:border-purple-200 text-[#1e1b4b] font-semibold border border-purple-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  type="button"
                >
                  2
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-white hover:bg-purple-50 hover:border-purple-200 text-[#1e1b4b] font-semibold border border-purple-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  type="button"
                >
                  3
                </button>
                <span className="px-1.5 text-purple-300 font-bold select-none">...</span>
                <button 
                  className="w-9 h-9 rounded-full bg-white hover:bg-purple-50 hover:border-purple-200 text-[#1e1b4b] font-semibold border border-purple-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  type="button"
                >
                  12
                </button>
                <button 
                  className="px-4 py-2 rounded-full bg-[#5b48bd] hover:bg-[#4a39a8] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105"
                  type="button"
                >
                  <span>Trang kế</span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
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
