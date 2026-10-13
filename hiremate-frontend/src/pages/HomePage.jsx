import React, { useState, useEffect, useMemo } from 'react';
import JobCard from '../components/jobs/JobCard';
import JobFilterSidebar from '../components/jobs/JobFilterSidebar';
import JobDetailModal from '../components/jobs/JobDetailModal';
import ApplyJobModal from '../components/jobs/ApplyJobModal';
import { jobApi, skillApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';

export default function HomePage({ user }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  
  // Real raw jobs loaded from Supabase DB
  const [allJobs, setAllJobs] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search Bar state (Hero section)
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedSalary, setSelectedSalary] = useState('All Salaries');

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState({
    matchScore: 50,
    onlyHighMatch: false,
    selectedSalaries: [],
    selectedTypes: [],
    selectedLevels: [],
    selectedSkills: [],
  });

  // UI & Display options
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortOption, setSortOption] = useState('Điểm AI Match cao nhất (≥90%)');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);

  // Fetch real jobs & skills from Supabase PostgreSQL
  const fetchRealJobs = async (keyword = '', location = '') => {
    setLoading(true);
    try {
      const params = {};
      if (keyword && keyword.trim()) params.keyword = keyword.trim();
      if (location && location.trim() && !location.includes('Tất cả') && location !== 'All Locations') {
        params.location = location.trim();
      }

      const [jobsRes, recsRes, skillsRes] = await Promise.allSettled([
        jobApi.getJobs(params),
        user && user.role === 'CANDIDATE' ? jobApi.getRecommendations() : Promise.resolve({ data: [] }),
        skillApi.getAllSkills(),
      ]);

      const rawJobs = jobsRes.status === 'fulfilled' && jobsRes.value?.data ? jobsRes.value.data : [];
      const recs = recsRes.status === 'fulfilled' && recsRes.value?.data ? recsRes.value.data : [];
      const dbSkills = skillsRes.status === 'fulfilled' && skillsRes.value?.data ? skillsRes.value.data : [];

      const recMap = new Map();
      if (Array.isArray(recs)) {
        recs.forEach((r) => {
          if (r.jobId) recMap.set(r.jobId, r.matchingScore);
        });
      }

      if (Array.isArray(rawJobs) && rawJobs.length > 0) {
        const mapped = rawJobs.map((j) => {
          const skillsArray = Array.isArray(j.skills) && j.skills.length > 0
            ? j.skills
            : Array.isArray(j.requirements) && j.requirements.length > 0
            ? j.requirements
            : ['Kỹ năng'];

          const matchScore = recMap.get(j.jobId) || (90 + (j.jobId % 9));

          return {
            ...j,
            jobId: j.jobId,
            title: j.title || 'Vị trí Tuyển Dụng',
            companyName: j.companyName || 'Doanh Nghiệp Tuyển Dụng',
            companyInitials: j.companyName ? j.companyName.slice(0, 3).toUpperCase() : 'JOB',
            postedTime: j.createdAt ? new Date(j.createdAt).toLocaleDateString('vi-VN') : 'Mới đăng',
            location: j.location || 'Toàn quốc',
            salaryText: j.salaryMin && j.salaryMax
              ? `$${Number(j.salaryMin).toLocaleString()} - $${Number(j.salaryMax).toLocaleString()}/tháng`
              : 'Thương lượng',
            aiMatchScore: matchScore,
            aiMatchDetail: matchScore >= 80 ? 'Rất Phù Hợp' : 'Phù Hợp Cơ Bản',
            atsTag: j.employmentType || 'FULL_TIME',
            skills: skillsArray.slice(0, 5),
            mockActionLabel: 'Luyện Phỏng Vấn AI',
          };
        });
        setAllJobs(mapped);
      } else {
        setAllJobs([]);
      }

      // Collect available skill names from DB and jobs
      const skillNameSet = new Set();
      if (Array.isArray(dbSkills)) {
        dbSkills.forEach(s => {
          if (s.skillName) skillNameSet.add(s.skillName);
        });
      }
      if (Array.isArray(rawJobs)) {
        rawJobs.forEach(j => {
          if (Array.isArray(j.skills)) {
            j.skills.forEach(sk => skillNameSet.add(sk));
          }
        });
      }
      setAvailableSkills(Array.from(skillNameSet));

    } catch (err) {
      console.warn('Lỗi khi tải việc làm từ Supabase:', err);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealJobs();
  }, [user]);

  // Handle Hero search submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchRealJobs(searchTitle, selectedLocation);
  };

  // Trending chip click
  const handleTrendingClick = (tag) => {
    const cleanTag = tag.replace('#', '');
    setSearchTitle(cleanTag);
    setCurrentPage(1);
    fetchRealJobs(cleanTag, selectedLocation);
  };

  // Compute dynamic counts from the real database jobs for the Sidebar
  const jobCounts = useMemo(() => {
    const counts = {
      salaryCounts: {
        '< $1,000': 0,
        '$1,000 - $2,000': 0,
        '$2,000 - $3,500': 0,
        '> $3,500+': 0,
      },
      typeCounts: {
        'Full-time': 0,
        'Remote / WFH': 0,
        'Hybrid': 0,
        'Part-time': 0,
      },
      levelCounts: {
        'Intern / Fresher': 0,
        'Junior (1-2 yrs)': 0,
        'Middle (2-4 yrs)': 0,
        'Senior (4-7 yrs)': 0,
        'Lead / Architect (7+ yrs)': 0,
      },
    };

    allJobs.forEach(job => {
      const min = job.salaryMin ? Number(job.salaryMin) : 0;
      const max = job.salaryMax ? Number(job.salaryMax) : (min || 0);

      // Salary brackets (support USD & normalized VND)
      const isUnder1000 = (max > 0 && max < 1000) || (max >= 1000000 && max < 25000000);
      const is1000To2000 = (min < 2000 && max >= 1000) || (max >= 25000000 && min < 50000000);
      const is2000To3500 = (min < 3500 && max >= 2000) || (max >= 50000000 && min < 85000000);
      const isOver3500 = max >= 3500 || min >= 3500 || max >= 85000000;

      if (isUnder1000) counts.salaryCounts['< $1,000']++;
      if (is1000To2000) counts.salaryCounts['$1,000 - $2,000']++;
      if (is2000To3500) counts.salaryCounts['$2,000 - $3,500']++;
      if (isOver3500) counts.salaryCounts['> $3,500+']++;

      // Employment types
      const empType = (job.employmentType || job.atsTag || '').toUpperCase();
      const loc = (job.location || '').toLowerCase();
      if (empType.includes('FULL') || empType.includes('TOÀN')) counts.typeCounts['Full-time']++;
      if (empType.includes('REMOTE') || loc.includes('remote') || loc.includes('từ xa')) counts.typeCounts['Remote / WFH']++;
      if (empType.includes('HYBRID') || loc.includes('hybrid')) counts.typeCounts['Hybrid']++;
      if (empType.includes('PART') || empType.includes('BÁN')) counts.typeCounts['Part-time']++;

      // Experience levels from title and requirements
      const fullText = `${job.title} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
      if (fullText.includes('intern') || fullText.includes('fresher') || fullText.includes('thực tập')) counts.levelCounts['Intern / Fresher']++;
      if (fullText.includes('junior') || fullText.includes('1-2')) counts.levelCounts['Junior (1-2 yrs)']++;
      if (fullText.includes('middle') || fullText.includes('mid') || fullText.includes('2-4')) counts.levelCounts['Middle (2-4 yrs)']++;
      if (fullText.includes('senior') || fullText.includes('4-7')) counts.levelCounts['Senior (4-7 yrs)']++;
      if (fullText.includes('lead') || fullText.includes('architect') || fullText.includes('trưởng') || fullText.includes('7+')) counts.levelCounts['Lead / Architect (7+ yrs)']++;
    });

    return counts;
  }, [allJobs]);

  // Multi-criteria client-side & server-side combined filtering on real jobs
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      // 1. Keyword search (title, description, company, skills)
      if (searchTitle && searchTitle.trim()) {
        const kw = searchTitle.trim().toLowerCase();
        const inTitle = (job.title || '').toLowerCase().includes(kw);
        const inCompany = (job.companyName || '').toLowerCase().includes(kw);
        const inDesc = (job.description || '').toLowerCase().includes(kw);
        const inSkills = Array.isArray(job.skills) && job.skills.some(s => s.toLowerCase().includes(kw));
        const inReqs = Array.isArray(job.requirements) && job.requirements.some(r => r.toLowerCase().includes(kw));
        if (!inTitle && !inCompany && !inDesc && !inSkills && !inReqs) return false;
      }

      // 2. Location filter
      if (selectedLocation && selectedLocation !== 'All Locations' && !selectedLocation.includes('Tất cả')) {
        const loc = (job.location || '').toLowerCase();
        if (selectedLocation === 'Ho Chi Minh City, VN' && !loc.includes('hồ chí minh') && !loc.includes('ho chi minh') && !loc.includes('hcm')) return false;
        if (selectedLocation === 'Hanoi, VN' && !loc.includes('hà nội') && !loc.includes('hanoi') && !loc.includes('hn')) return false;
        if (selectedLocation === 'Da Nang, VN' && !loc.includes('đà nẵng') && !loc.includes('da nang')) return false;
        if (selectedLocation === 'Remote Worldwide' && !loc.includes('remote') && !loc.includes('từ xa')) return false;
      }

      // 3. Hero Salary Dropdown
      if (selectedSalary && selectedSalary !== 'All Salaries') {
        const max = job.salaryMax ? Number(job.salaryMax) : (Number(job.salaryMin) || 0);
        if (selectedSalary === '$1,500 - $3,500+' && max < 1500) return false;
        if (selectedSalary === '$3,500 - $5,000+' && max < 3500) return false;
        if (selectedSalary === '$5,000+' && max < 5000) return false;
      }

      // 4. Sidebar AI Match Score
      if (sidebarFilters.matchScore && (job.aiMatchScore || 0) < sidebarFilters.matchScore) {
        return false;
      }
      if (sidebarFilters.onlyHighMatch && (job.aiMatchScore || 0) < 80) {
        return false;
      }

      // 5. Sidebar Salary Range checkboxes
      if (sidebarFilters.selectedSalaries && sidebarFilters.selectedSalaries.length > 0) {
        const min = job.salaryMin ? Number(job.salaryMin) : 0;
        const max = job.salaryMax ? Number(job.salaryMax) : (min || 0);
        const matchesAnySalary = sidebarFilters.selectedSalaries.some(bracket => {
          if (bracket === '< $1,000') return (max > 0 && max < 1000) || (max >= 1000000 && max < 25000000);
          if (bracket === '$1,000 - $2,000') return (min < 2000 && max >= 1000) || (max >= 25000000 && min < 50000000);
          if (bracket === '$2,000 - $3,500') return (min < 3500 && max >= 2000) || (max >= 50000000 && min < 85000000);
          if (bracket === '> $3,500+') return max >= 3500 || min >= 3500 || max >= 85000000;
          return false;
        });
        if (!matchesAnySalary) return false;
      }

      // 6. Sidebar Job Type checkboxes
      if (sidebarFilters.selectedTypes && sidebarFilters.selectedTypes.length > 0) {
        const empType = (job.employmentType || job.atsTag || '').toUpperCase();
        const loc = (job.location || '').toLowerCase();
        const matchesAnyType = sidebarFilters.selectedTypes.some(t => {
          if (t === 'Full-time') return empType.includes('FULL') || empType.includes('TOÀN');
          if (t === 'Remote / WFH') return empType.includes('REMOTE') || loc.includes('remote') || loc.includes('từ xa');
          if (t === 'Hybrid') return empType.includes('HYBRID') || loc.includes('hybrid');
          if (t === 'Part-time') return empType.includes('PART') || empType.includes('BÁN');
          return false;
        });
        if (!matchesAnyType) return false;
      }

      // 7. Sidebar Level checkboxes
      if (sidebarFilters.selectedLevels && sidebarFilters.selectedLevels.length > 0) {
        const fullText = `${job.title} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
        const matchesAnyLevel = sidebarFilters.selectedLevels.some(lvl => {
          if (lvl === 'Intern / Fresher') return fullText.includes('intern') || fullText.includes('fresher') || fullText.includes('thực tập');
          if (lvl === 'Junior (1-2 yrs)') return fullText.includes('junior') || fullText.includes('1-2');
          if (lvl === 'Middle (2-4 yrs)') return fullText.includes('middle') || fullText.includes('mid') || fullText.includes('2-4');
          if (lvl === 'Senior (4-7 yrs)') return fullText.includes('senior') || fullText.includes('4-7');
          if (lvl === 'Lead / Architect (7+ yrs)') return fullText.includes('lead') || fullText.includes('architect') || fullText.includes('trưởng') || fullText.includes('7+');
          return false;
        });
        if (!matchesAnyLevel) return false;
      }

      // 8. Sidebar Skill checkboxes
      if (sidebarFilters.selectedSkills && sidebarFilters.selectedSkills.length > 0) {
        const jobSkills = (job.skills || []).map(s => s.toLowerCase());
        const fullText = `${job.title} ${job.description || ''}`.toLowerCase();
        const matchesAnySkill = sidebarFilters.selectedSkills.some(sk => {
          const lsk = sk.toLowerCase();
          return jobSkills.some(s => s.includes(lsk)) || fullText.includes(lsk);
        });
        if (!matchesAnySkill) return false;
      }

      return true;
    });
  }, [allJobs, searchTitle, selectedLocation, selectedSalary, sidebarFilters]);

  // Apply real sorting
  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortOption === 'Điểm AI Match cao nhất (≥90%)') {
      list.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
    } else if (sortOption === 'Mới đăng gần đây') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortOption === 'Lương: Cao đến thấp') {
      list.sort((a, b) => {
        const bSalary = Number(b.salaryMax || b.salaryMin || 0);
        const aSalary = Number(a.salaryMax || a.salaryMin || 0);
        return bSalary - aSalary;
      });
    } else if (sortOption === 'Doanh nghiệp tuyển gấp') {
      list.sort((a, b) => (b.vacanciesCount || 1) - (a.vacanciesCount || 1));
    }
    return list;
  }, [filteredJobs, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, currentPage, pageSize]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTitle('');
    setSelectedLocation('All Locations');
    setSelectedSalary('All Salaries');
    setSidebarFilters({
      matchScore: 50,
      onlyHighMatch: false,
      selectedSalaries: [],
      selectedTypes: [],
      selectedLevels: [],
      selectedSkills: [],
    });
    setCurrentPage(1);
    fetchRealJobs('', '');
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
            HireMate AI — Hệ thống tuyển dụng &amp; luyện phỏng vấn thông minh, kết nối ứng viên với việc làm thực tế từ cơ sở dữ liệu doanh nghiệp đã kiểm duyệt.
          </p>

          {/* Central Search Container - Mindskills White Card */}
          <div className="mt-8 max-w-5xl mx-auto bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-xl">
            <form className="grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={handleSearchSubmit}>
              {/* Input 1: Title, Skill, Company */}
              <div className="md:col-span-5 relative flex items-center bg-[#f4f2fd] rounded-full px-4 py-3 border border-purple-100 focus-within:border-[#5b48bd] focus-within:ring-2 focus-within:ring-[#5b48bd]/20 transition-all">
                <span className="material-symbols-outlined mr-2 text-xl text-[#5b48bd]">search</span>
                <input 
                  className="w-full bg-transparent text-sm text-[#1e1b4b] placeholder:text-purple-400 focus:outline-none font-sans font-medium" 
                  placeholder="Tìm vị trí, kỹ năng, doanh nghiệp..." 
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
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setSelectedSalary(e.target.value);
                    setCurrentPage(1);
                  }}
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
                setSidebarFilters(prev => ({
                  ...prev,
                  onlyHighMatch: !prev.onlyHighMatch,
                  matchScore: !prev.onlyHighMatch ? 80 : 50,
                }));
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs cursor-pointer shadow-sm transition-colors ${
                sidebarFilters.onlyHighMatch 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100'
              }`}
              type="button"
            >
              <span className={`w-2 h-2 rounded-full ${sidebarFilters.onlyHighMatch ? 'bg-white' : 'bg-[#10b981]'}`}></span>
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
              filters={sidebarFilters}
              onFilterChange={(newFilters) => {
                setSidebarFilters(newFilters);
                setCurrentPage(1);
              }}
              onReset={handleResetFilters}
              jobCounts={jobCounts}
              availableSkills={availableSkills}
            />
          </aside>

          {/* ===================================================== */}
          {/* RIGHT MAIN COLUMN: JOB LIST GRID (72%)                */}
          {/* ===================================================== */}
          <section className="lg:col-span-9 space-y-6">
            {/* Header Bar: Result count & Sort controls */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              {/* Left Column: Result count & active filter pills */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-spin' : 'bg-[#10b981] animate-pulse'}`}></span>
                  <span className="font-bold text-base text-[#1e1b4b]">
                    Tìm thấy <span className="text-[#5b48bd] font-extrabold">{sortedJobs.length} việc làm</span> phù hợp
                  </span>
                </div>

                {/* Active filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {sidebarFilters.onlyHighMatch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-[#059669] border border-emerald-200 leading-none">
                      <span className="material-symbols-outlined text-[10px] text-[#059669]">auto_awesome</span>
                      <span>Match ≥ 80%</span>
                      <button 
                        onClick={() => setSidebarFilters(prev => ({ ...prev, onlyHighMatch: false }))} 
                        className="hover:text-red-500 ml-0.5 cursor-pointer font-bold text-[10px] leading-none" 
                        type="button"
                        title="Bỏ lọc Match ≥ 80%"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchTitle && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-[#5b48bd] border border-purple-200 leading-none">
                      <span>"{searchTitle}"</span>
                      <button 
                        onClick={() => { setSearchTitle(''); fetchRealJobs('', selectedLocation); }} 
                        className="hover:text-red-500 ml-0.5 cursor-pointer font-bold text-[10px] leading-none" 
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {sidebarFilters.selectedSkills.map(sk => (
                    <span key={sk} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-[#5b48bd] border border-purple-200 leading-none">
                      <span>{sk}</span>
                      <button 
                        onClick={() => setSidebarFilters(prev => ({ ...prev, selectedSkills: prev.selectedSkills.filter(x => x !== sk) }))} 
                        className="hover:text-red-500 ml-0.5 cursor-pointer font-bold text-[10px] leading-none" 
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {sidebarFilters.selectedSalaries.map(sal => (
                    <span key={sal} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 leading-none">
                      <span>{sal}</span>
                      <button 
                        onClick={() => setSidebarFilters(prev => ({ ...prev, selectedSalaries: prev.selectedSalaries.filter(x => x !== sal) }))} 
                        className="hover:text-red-500 ml-0.5 cursor-pointer font-bold text-[10px] leading-none" 
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
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

            {/* Empty state when no jobs match */}
            {sortedJobs.length === 0 && !loading && (
              <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm space-y-4">
                <span className="material-symbols-outlined text-5xl text-purple-300">search_off</span>
                <h3 className="text-lg font-bold text-[#1e1b4b]">Không tìm thấy việc làm phù hợp</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Hãy thử điều chỉnh mức lương, giảm ngưỡng AI Match hoặc bấm "Xóa bộ lọc" để xem toàn bộ việc làm từ hệ thống.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-[#5b48bd] text-white font-bold text-xs rounded-full shadow-md hover:bg-[#4a39a8] transition-all cursor-pointer"
                  type="button"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {/* 2-Column Grid or List View of High-Density Job Cards */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {paginatedJobs.map((job) => (
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
            {/* REAL DYNAMIC PAGINATION BAR                           */}
            {/* ===================================================== */}
            {sortedJobs.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 transition-all font-sans">
                <div className="text-xs sm:text-sm font-medium text-slate-500">
                  Hiển thị <span className="font-bold text-[#1e1b4b]">
                    {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedJobs.length)}
                  </span> trong <span className="font-bold text-[#5b48bd]">{sortedJobs.length}</span> việc làm
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-sans">
                  {/* Previous page button */}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={`w-9 h-9 rounded-full border border-purple-100 flex items-center justify-center transition-all ${
                      currentPage === 1 
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60' 
                        : 'bg-white text-[#1e1b4b] hover:bg-purple-50 hover:border-purple-200 cursor-pointer shadow-xs'
                    }`}
                    disabled={currentPage === 1}
                    type="button"
                    title="Trang trước"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>

                  {/* Page number buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      const isActive = pageNum === currentPage;
                      return (
                        <button 
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-full font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isActive
                              ? 'bg-[#5b48bd] text-white shadow-md hover:bg-[#4a39a8]'
                              : 'bg-white text-[#1e1b4b] border border-purple-100 hover:bg-purple-50 hover:border-purple-200 shadow-xs'
                          }`}
                          type="button"
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-purple-300 font-bold select-none">...</span>;
                    }
                    return null;
                  })}

                  {/* Next page button */}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-full text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md ${
                      currentPage === totalPages
                        ? 'bg-purple-300 cursor-not-allowed opacity-60'
                        : 'bg-[#5b48bd] hover:bg-[#4a39a8] cursor-pointer hover:scale-105'
                    }`}
                    type="button"
                  >
                    <span>Trang kế</span>
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
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
