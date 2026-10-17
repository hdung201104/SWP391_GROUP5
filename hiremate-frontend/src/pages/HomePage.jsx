import React, { useState, useEffect, useMemo } from 'react';
import JobCard from '../components/jobs/JobCard';
import JobFilterSidebar from '../components/jobs/JobFilterSidebar';
import CompanyFilterSidebar from '../components/jobs/CompanyFilterSidebar';
import JobDetailModal from '../components/jobs/JobDetailModal';
import ApplyJobModal from '../components/jobs/ApplyJobModal';
import CompanyCard from '../components/jobs/CompanyCard';
import CompanyProfileModal from '../components/jobs/CompanyProfileModal';
import { jobApi, skillApi, companyApi } from '../api';
import { useLivingTheme } from '../context/LivingThemeContext';

export default function HomePage({ user }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  
  // Real raw jobs loaded from Supabase DB
  const [allJobs, setAllJobs] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Main View Switcher: 'companies' (Cô giáo yêu cầu) vs 'jobs'
  const [activeTab, setActiveTab] = useState('companies');

  // Selected company when user clicks a company card to view its full recruitment page
  const [activeCompanyShowcase, setActiveCompanyShowcase] = useState(null);
  const [companyBranchFilter, setCompanyBranchFilter] = useState('All');

  // Modal: View detailed company profile
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState(null);

  // Companies state
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState('');
  const [companyFilters, setCompanyFilters] = useState({
    selectedLocations: [],
    selectedIndustries: [],
    selectedSizes: [],
    selectedSalaries: [],
    selectedPerks: [],
    onlyActiveHiring: false,
    onlyManyJobs: false,
  });
  const [companySort, setCompanySort] = useState('Nhiều việc làm nhất');
  const [companyViewMode, setCompanyViewMode] = useState('grid');
  const [companyPage, setCompanyPage] = useState(1);
  const companyPageSize = 6;
  const [recruiterCompany, setRecruiterCompany] = useState(null);

  // Search Bar state (Hero section)
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedSalary, setSelectedSalary] = useState('All Salaries');

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState({
    matchScore: 0,
    onlyHighMatch: false,
    selectedSalaries: [],
    selectedTypes: [],
    selectedLevels: [],
    selectedSkills: [],
  });

  // UI & Display options for jobs
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortOption, setSortOption] = useState('Mới đăng gần đây');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [isRematching, setIsRematching] = useState(false);

  const isRecruiter = user?.role === 'RECRUITER';
  const isCandidate = user?.role === 'CANDIDATE' || user?.role === 'ROLE_CANDIDATE';

  // Fetch companies list
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const res = await companyApi.getAllCompanies();
      const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (raw.length > 0) {
        setCompanies(raw);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách doanh nghiệp, không dùng dữ liệu ảo:', err);
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Fetch real jobs & skills from Supabase PostgreSQL
  const fetchRealJobs = async (keyword = '', location = '') => {
    setLoading(true);
    try {
      const params = {};
      if (keyword && keyword.trim()) params.keyword = keyword.trim();
      if (location && location.trim() && !location.includes('Tất cả') && location !== 'All Locations') {
        params.location = location.trim();
      }

      const [jobsRes, skillsRes] = await Promise.allSettled([
        jobApi.getJobs(params),
        skillApi.getAllSkills(),
      ]);

      const rawJobs = jobsRes.status === 'fulfilled' 
        ? (Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : (Array.isArray(jobsRes.value) ? jobsRes.value : [])) 
        : [];
      const dbSkills = skillsRes.status === 'fulfilled' 
        ? (Array.isArray(skillsRes.value?.data) ? skillsRes.value.data : (Array.isArray(skillsRes.value) ? skillsRes.value : [])) 
        : [];

      // Chỉ hiển thị tin đã được Admin duyệt (APPROVED) lên Trang chủ, ẩn hoàn toàn tin PENDING hoặc REJECTED
      const approvedJobsOnly = Array.isArray(rawJobs)
        ? rawJobs.filter(j => !j.approvalStatus || j.approvalStatus === 'APPROVED')
        : [];

      if (approvedJobsOnly.length > 0) {
        const mapped = approvedJobsOnly.map((j) => {
          const skillsArray = Array.isArray(j.skills) && j.skills.length > 0
            ? j.skills
            : Array.isArray(j.requirements) && j.requirements.length > 0
            ? j.requirements
            : ['Kỹ năng'];

          const matchScore = j.matchingScore != null ? Math.round(j.matchingScore) : null;
          const aiReasoning = j.aiReasoning || '';

          return {
            ...j,
            jobId: j.jobId,
            title: j.title || 'Vị trí Tuyển Dụng',
            companyName: j.companyName || 'Doanh Nghiệp Tuyển Dụng',
            companyInitials: j.companyName ? j.companyName.slice(0, 3).toUpperCase() : 'JOB',
            postedTime: j.createdAt ? new Date(j.createdAt).toLocaleDateString('vi-VN') : 'Mới đăng',
            location: j.location || 'Toàn quốc',
            salaryText: j.salaryMin && j.salaryMax
              ? (Number(j.salaryMin) >= 1000000
                  ? `${Number(j.salaryMin).toLocaleString('vi-VN')} - ${Number(j.salaryMax).toLocaleString('vi-VN')} đ/tháng`
                  : `$${Number(j.salaryMin).toLocaleString()} - $${Number(j.salaryMax).toLocaleString()}/tháng`)
              : j.salaryMin
              ? (Number(j.salaryMin) >= 1000000
                  ? `Từ ${Number(j.salaryMin).toLocaleString('vi-VN')} đ/tháng`
                  : `Từ $${Number(j.salaryMin).toLocaleString()}/tháng`)
              : 'Thương lượng',
            aiMatchScore: matchScore,
            aiReasoning: aiReasoning,
            aiMatchDetail: matchScore && matchScore >= 80 ? 'Rất Phù Hợp' : (matchScore ? 'Phù Hợp Cơ Bản' : 'Đang Tuyển'),
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
      if (Array.isArray(approvedJobsOnly)) {
        approvedJobsOnly.forEach(j => {
          if (Array.isArray(j.skills)) {
            j.skills.forEach(sk => skillNameSet.add(sk));
          }
        });
      }
      setAvailableSkills(Array.from(skillNameSet));
      setLoading(false);

      // Background AI recommendations matching
      if (isCandidate) {
        jobApi.getRecommendations()
          .then(recsRes => {
            const recs = Array.isArray(recsRes?.data) ? recsRes.data : (Array.isArray(recsRes) ? recsRes : []);
            if (Array.isArray(recs) && recs.length > 0) {
              const recMap = new Map();
              const recReasoningMap = new Map();
              recs.forEach(r => {
                if (r.jobId && r.matchingScore != null) {
                  recMap.set(r.jobId, Math.round(r.matchingScore));
                  if (r.aiReasoning) recReasoningMap.set(r.jobId, r.aiReasoning);
                }
              });
              setAllJobs(prevJobs => prevJobs.map(j => {
                const score = recMap.get(j.jobId);
                const reasoning = recReasoningMap.get(j.jobId);
                if (score != null) {
                  return {
                    ...j,
                    aiMatchScore: score,
                    aiReasoning: reasoning || j.aiReasoning,
                    aiMatchDetail: score >= 80 ? 'Rất Phù Hợp' : 'Phù Hợp Cơ Bản',
                  };
                }
                return j;
              }));
            }
          })
          .catch(err => console.warn('Background recommendations fetch:', err));
      }

    } catch (err) {
      console.warn('Lỗi khi tải việc làm, không dùng dữ liệu ảo:', err);
      setAllJobs([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealJobs();
    fetchCompanies();
  }, [user]);

  // Lock recruiter to companies view and reset showcase when navigating home
  useEffect(() => {
    if (isRecruiter) {
      setActiveTab('companies');
    }
  }, [isRecruiter]);

  // Listen for tab switch events from Header or other components
  useEffect(() => {
    const handleSwitchTab = (e) => {
      if (isRecruiter) {
        setActiveTab('companies');
        setActiveCompanyShowcase(null);
        return;
      }
      if (e.detail === 'companies') {
        setActiveTab('companies');
        setActiveCompanyShowcase(null);
      } else if (e.detail === 'jobs') {
        setActiveTab('jobs');
        setActiveCompanyShowcase(null);
      }
    };
    window.addEventListener('hiremate_switch_home_tab', handleSwitchTab);

    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash === '#/' || hash === '' || hash === '#') {
        if (isRecruiter) {
          setActiveTab('companies');
          setActiveCompanyShowcase(null);
        }
      }
    };
    window.addEventListener('hashchange', handleHash);

    const hash = window.location.hash || '';
    if (hash.includes('tab=companies') || isRecruiter) {
      setActiveTab('companies');
    }

    return () => {
      window.removeEventListener('hiremate_switch_home_tab', handleSwitchTab);
      window.removeEventListener('hashchange', handleHash);
    };
  }, [isRecruiter]);

  // Load recruiter's own company profile if logged in
  useEffect(() => {
    if (isRecruiter) {
      companyApi.getMyCompany()
        .then(res => {
          const c = res?.data || res;
          if (c && c.companyId) {
            setRecruiterCompany(c);
          }
        })
        .catch(err => console.warn('getMyCompany:', err));
    }
  }, [isRecruiter]);

  // Handle Hero search submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (isRecruiter) {
      if (!activeCompanyShowcase) {
        setCompanySearch(searchTitle);
        if (selectedLocation !== 'All Locations') {
          let locName = selectedLocation;
          if (locName.includes('Ho Chi Minh')) locName = 'TP. Hồ Chí Minh';
          else if (locName.includes('Hanoi')) locName = 'Hà Nội';
          else if (locName.includes('Da Nang')) locName = 'Đà Nẵng';
          else if (locName.includes('Remote')) locName = 'Remote';
          setCompanyFilters(prev => ({
            ...prev,
            selectedLocations: [locName],
          }));
        } else {
          setCompanyFilters(prev => ({
            ...prev,
            selectedLocations: [],
          }));
        }
        setCompanyPage(1);
      } else {
        setCurrentPage(1);
        fetchRealJobs(searchTitle, selectedLocation);
      }
      return;
    }

    if (activeTab === 'companies' && !activeCompanyShowcase) {
      setCompanySearch(searchTitle);
      if (selectedLocation !== 'All Locations') {
        let locName = selectedLocation;
        if (locName.includes('Ho Chi Minh')) locName = 'TP. Hồ Chí Minh';
        else if (locName.includes('Hanoi')) locName = 'Hà Nội';
        else if (locName.includes('Da Nang')) locName = 'Đà Nẵng';
        else if (locName.includes('Remote')) locName = 'Remote';
        setCompanyFilters(prev => ({
          ...prev,
          selectedLocations: [locName],
        }));
      } else {
        setCompanyFilters(prev => ({
          ...prev,
          selectedLocations: [],
        }));
      }
      setCompanyPage(1);
    } else {
      setCurrentPage(1);
      fetchRealJobs(searchTitle, selectedLocation);
    }
  };

  // Trending chip click
  const handleTrendingClick = (tag) => {
    const cleanTag = tag.replace('#', '').replace('_', ' ');
    setSearchTitle(cleanTag);
    if (isRecruiter) {
      if (!activeCompanyShowcase) {
        setCompanySearch(cleanTag);
        setCompanyPage(1);
      } else {
        setCurrentPage(1);
        fetchRealJobs(cleanTag, selectedLocation);
      }
      return;
    }
    if (activeTab === 'companies' && !activeCompanyShowcase) {
      setCompanySearch(cleanTag);
      setCompanyPage(1);
    } else {
      setCurrentPage(1);
      fetchRealJobs(cleanTag, selectedLocation);
    }
  };

  const handleReMatch = async () => {
    if (!user) return;
    setIsRematching(true);
    try {
      await jobApi.reMatch();
      await fetchRealJobs(searchTitle, selectedLocation);
    } catch (err) {
      console.warn('Re-match error:', err);
    } finally {
      setIsRematching(false);
    }
  };

  // Dynamic location counts for company sidebar
  const companyLocationCounts = useMemo(() => {
    const counts = {
      'Đà Nẵng': 0,
      'TP. Hồ Chí Minh': 0,
      'Hà Nội': 0,
      'Remote': 0,
    };
    companies.forEach(comp => {
      const addr = (comp.address || '').toLowerCase();
      const locs = Array.isArray(comp.locations) ? comp.locations.map(l => l.toLowerCase()) : [];
      const matches = (term) => addr.includes(term) || locs.some(l => l.includes(term));
      if (matches('đà nẵng') || matches('da nang')) counts['Đà Nẵng']++;
      if (matches('hồ chí minh') || matches('ho chi minh') || matches('hcm')) counts['TP. Hồ Chí Minh']++;
      if (matches('hà nội') || matches('hanoi') || matches('ha noi')) counts['Hà Nội']++;
      if (matches('remote') || matches('từ xa')) counts['Remote']++;
    });
    return counts;
  }, [companies]);

  // =========================================================================
  // FILTERING & SORTING: COMPANIES
  // =========================================================================
  const filteredCompanies = useMemo(() => {
    return companies.filter(comp => {
      // 1. Keyword search (Name, Industry, Description, Address, Locations)
      if (companySearch && companySearch.trim()) {
        const q = companySearch.toLowerCase().trim();
        const inName = (comp.companyName || '').toLowerCase().includes(q);
        const inInd = (comp.industry || '').toLowerCase().includes(q);
        const inDesc = (comp.description || '').toLowerCase().includes(q);
        const inAddr = (comp.address || '').toLowerCase().includes(q);
        const inLocs = Array.isArray(comp.locations) && comp.locations.some(l => l.toLowerCase().includes(q));
        if (!inName && !inInd && !inDesc && !inAddr && !inLocs) return false;
      }

      // 2. Branch / Locations (Multi-select)
      if (companyFilters.selectedLocations && companyFilters.selectedLocations.length > 0) {
        const addr = (comp.address || '').toLowerCase();
        const locs = Array.isArray(comp.locations) ? comp.locations.map(l => l.toLowerCase()) : [];
        const matchesAnyLoc = companyFilters.selectedLocations.some(loc => {
          let needle = loc.toLowerCase();
          if (needle.includes('hồ chí minh') || needle.includes('ho chi minh')) needle = 'chí minh';
          else if (needle.includes('hà nội') || needle.includes('hanoi')) needle = 'nội';
          else if (needle.includes('đà nẵng') || needle.includes('da nang')) needle = 'nẵng';
          else if (needle.includes('remote')) needle = 'remote';
          return addr.includes(needle) || locs.some(l => l.includes(needle));
        });
        if (!matchesAnyLoc) return false;
      }

      // 3. Industry (Multi-select)
      if (companyFilters.selectedIndustries && companyFilters.selectedIndustries.length > 0) {
        const inName = (comp.companyName || '').toLowerCase();
        const inInd = (comp.industry || '').toLowerCase();
        const matchesAnyInd = companyFilters.selectedIndustries.some(indTarget => {
          const t = indTarget.toLowerCase();
          return inInd.includes(t) || inName.includes(t) ||
            (t === 'phần mềm' && (inName.includes('fpt') || inInd.includes('phần mềm'))) ||
            (t === 'game' && (inName.includes('vng') || inInd.includes('game') || inInd.includes('internet'))) ||
            (t === 'chuyển đổi số' && (inName.includes('digital') || inName.includes('cloud') || inInd.includes('chuyển đổi số'))) ||
            (t === 'đa quốc gia' && (inName.includes('đa quốc gia') || inName.includes('global') || inInd.includes('quốc gia')));
        });
        if (!matchesAnyInd) return false;
      }

      // 4. Hiring Status
      if (companyFilters.onlyActiveHiring && (comp.activeJobsCount || 0) <= 0) {
        return false;
      }
      if (companyFilters.onlyManyJobs && (comp.activeJobsCount || 0) < 3) {
        return false;
      }

      // 5. Size (Multi-select)
      if (companyFilters.selectedSizes && companyFilters.selectedSizes.length > 0) {
        const sizeStr = (comp.companySize || '').toLowerCase();
        const matchesAnySize = companyFilters.selectedSizes.some(sizeKey => {
          if (sizeKey === '10000') return sizeStr.includes('10,000') || sizeStr.includes('10000');
          if (sizeKey === '5000') return sizeStr.includes('5,000') || sizeStr.includes('5000');
          if (sizeKey === '1000') return sizeStr.includes('1,000') || sizeStr.includes('1000');
          if (sizeKey === '500') return sizeStr.includes('500');
          return false;
        });
        if (!matchesAnySize) return false;
      }

      // 6. Salary Tier Filter (Multi-select)
      if (companyFilters.selectedSalaries && companyFilters.selectedSalaries.length > 0) {
        const companyJobs = allJobs.filter(j => 
          (comp.companyId && String(j.companyId) === String(comp.companyId)) ||
          (comp.companyName && j.companyName && j.companyName.toLowerCase().trim() === comp.companyName.toLowerCase().trim())
        );
        const matchesAnySalary = companyFilters.selectedSalaries.some(salaryKey => {
          if (salaryKey === 'high') {
            return companyJobs.some(j => (Number(j.salaryMax) >= 35000000 || Number(j.salaryMax) >= 2000)) ||
              (comp.companyName || '').toLowerCase().includes('vng') || (comp.companyName || '').toLowerCase().includes('fpt');
          }
          if (salaryKey === 'mid') {
            return companyJobs.some(j => (Number(j.salaryMin) >= 15000000 && Number(j.salaryMax) <= 50000000)) ||
              companyJobs.length > 0;
          }
          if (salaryKey === 'entry') {
            return companyJobs.some(j => Number(j.salaryMin) < 15000000 || (j.title || '').toLowerCase().includes('intern') || (j.title || '').toLowerCase().includes('fresher'));
          }
          return false;
        });
        if (!matchesAnySalary) return false;
      }

      // 7. Perks Filter (Multi-select)
      if (companyFilters.selectedPerks && companyFilters.selectedPerks.length > 0) {
        const matchesAnyPerk = companyFilters.selectedPerks.some(perkKey => {
          if (perkKey === 'device') return true;
          if (perkKey === 'health') return true;
          if (perkKey === 'hybrid') {
            const locStr = (comp.address || '').toLowerCase() + (Array.isArray(comp.locations) ? comp.locations.join(' ') : '').toLowerCase();
            return locStr.includes('remote') || locStr.includes('hybrid') || locStr.includes('hồ chí minh') || locStr.includes('đà nẵng');
          }
          return false;
        });
        if (!matchesAnyPerk) return false;
      }

      return true;
    });
  }, [companies, companySearch, companyFilters, allJobs]);

  const sortedCompanies = useMemo(() => {
    const list = [...filteredCompanies];
    if (companySort === 'Nhiều việc làm nhất') {
      list.sort((a, b) => (b.activeJobsCount || 0) - (a.activeJobsCount || 0));
    } else if (companySort === 'Tên A - Z') {
      list.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
    } else if (companySort === 'Mới nhất') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [filteredCompanies, companySort]);

  const totalCompanyPages = Math.max(1, Math.ceil(sortedCompanies.length / companyPageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (companyPage - 1) * companyPageSize;
    return sortedCompanies.slice(start, start + companyPageSize);
  }, [sortedCompanies, companyPage, companyPageSize]);

  // =========================================================================
  // BASE JOBS POOL: (All Jobs OR Filtered by selected Company Showcase)
  // =========================================================================
  const sourceJobsPool = useMemo(() => {
    if (activeCompanyShowcase) {
      return allJobs.filter(j => {
        if (activeCompanyShowcase.companyId && j.companyId) {
          if (String(j.companyId) === String(activeCompanyShowcase.companyId)) return true;
        }
        if (activeCompanyShowcase.companyName && j.companyName) {
          return j.companyName.toLowerCase().trim() === activeCompanyShowcase.companyName.toLowerCase().trim();
        }
        return false;
      });
    }
    return allJobs;
  }, [allJobs, activeCompanyShowcase]);

  // Unique branches for the selected company showcase
  const activeCompanyBranches = useMemo(() => {
    if (!activeCompanyShowcase) return [];
    const set = new Set();
    sourceJobsPool.forEach(j => {
      if (j.location && j.location.trim()) set.add(j.location.trim());
    });
    if (Array.isArray(activeCompanyShowcase.locations)) {
      activeCompanyShowcase.locations.forEach(l => {
        if (l && l.trim()) set.add(l.trim());
      });
    }
    return Array.from(set);
  }, [activeCompanyShowcase, sourceJobsPool]);

  // Compute dynamic counts from the real jobs pool for the Sidebar
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

    sourceJobsPool.forEach(job => {
      const min = job.salaryMin ? Number(job.salaryMin) : 0;
      const max = job.salaryMax ? Number(job.salaryMax) : (min || 0);

      const isUnder1000 = (max > 0 && max < 1000) || (max >= 1000000 && max < 25000000);
      const is1000To2000 = (min < 2000 && max >= 1000) || (max >= 25000000 && min < 50000000);
      const is2000To3500 = (min < 3500 && max >= 2000) || (max >= 50000000 && min < 85000000);
      const isOver3500 = max >= 3500 || min >= 3500 || max >= 85000000;

      if (isUnder1000) counts.salaryCounts['< $1,000']++;
      if (is1000To2000) counts.salaryCounts['$1,000 - $2,000']++;
      if (is2000To3500) counts.salaryCounts['$2,000 - $3,500']++;
      if (isOver3500) counts.salaryCounts['> $3,500+']++;

      const empType = (job.employmentType || job.atsTag || '').toUpperCase();
      const loc = (job.location || '').toLowerCase();
      if (empType.includes('FULL') || empType.includes('TOÀN')) counts.typeCounts['Full-time']++;
      if (empType.includes('REMOTE') || loc.includes('remote') || loc.includes('từ xa')) counts.typeCounts['Remote / WFH']++;
      if (empType.includes('HYBRID') || loc.includes('hybrid')) counts.typeCounts['Hybrid']++;
      if (empType.includes('PART') || empType.includes('BÁN')) counts.typeCounts['Part-time']++;

      const fullText = `${job.title} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
      if (fullText.includes('intern') || fullText.includes('fresher') || fullText.includes('thực tập')) counts.levelCounts['Intern / Fresher']++;
      if (fullText.includes('junior') || fullText.includes('1-2')) counts.levelCounts['Junior (1-2 yrs)']++;
      if (fullText.includes('middle') || fullText.includes('mid') || fullText.includes('2-4')) counts.levelCounts['Middle (2-4 yrs)']++;
      if (fullText.includes('senior') || fullText.includes('4-7')) counts.levelCounts['Senior (4-7 yrs)']++;
      if (fullText.includes('lead') || fullText.includes('architect') || fullText.includes('trưởng') || fullText.includes('7+')) counts.levelCounts['Lead / Architect (7+ yrs)']++;
    });

    return counts;
  }, [sourceJobsPool]);

  // Multi-criteria filtering on the active jobs pool
  const filteredJobs = useMemo(() => {
    return sourceJobsPool.filter(job => {
      // If inside Company Showcase and branch filter is active
      if (activeCompanyShowcase && companyBranchFilter !== 'All') {
        if (job.location !== companyBranchFilter) return false;
      }

      if (searchTitle && searchTitle.trim()) {
        const kw = searchTitle.trim().toLowerCase();
        const inTitle = (job.title || '').toLowerCase().includes(kw);
        const inCompany = (job.companyName || '').toLowerCase().includes(kw);
        const inDesc = (job.description || '').toLowerCase().includes(kw);
        const inSkills = Array.isArray(job.skills) && job.skills.some(s => s.toLowerCase().includes(kw));
        const inReqs = Array.isArray(job.requirements) && job.requirements.some(r => r.toLowerCase().includes(kw));
        if (!inTitle && !inCompany && !inDesc && !inSkills && !inReqs) return false;
      }

      if (selectedLocation && selectedLocation !== 'All Locations' && !selectedLocation.includes('Tất cả')) {
        const loc = (job.location || '').toLowerCase();
        if (selectedLocation === 'Ho Chi Minh City, VN' && !loc.includes('hồ chí minh') && !loc.includes('ho chi minh') && !loc.includes('hcm')) return false;
        if (selectedLocation === 'Hanoi, VN' && !loc.includes('hà nội') && !loc.includes('hanoi') && !loc.includes('hn')) return false;
        if (selectedLocation === 'Da Nang, VN' && !loc.includes('đà nẵng') && !loc.includes('da nang')) return false;
        if (selectedLocation === 'Remote Worldwide' && !loc.includes('remote') && !loc.includes('từ xa')) return false;
      }

      if (selectedSalary && selectedSalary !== 'All Salaries') {
        const max = job.salaryMax ? Number(job.salaryMax) : (Number(job.salaryMin) || 0);
        if (selectedSalary === '$1,500 - $3,500+' && max < 1500) return false;
        if (selectedSalary === '$3,500 - $5,000+' && max < 3500) return false;
        if (selectedSalary === '$5,000+' && max < 5000) return false;
      }

      if (sidebarFilters.onlyHighMatch && (job.aiMatchScore || 0) < 80) return false;
      if (sidebarFilters.matchScore > 0 && (job.aiMatchScore || 0) < sidebarFilters.matchScore) return false;

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
  }, [sourceJobsPool, activeCompanyShowcase, companyBranchFilter, searchTitle, selectedLocation, selectedSalary, sidebarFilters]);

  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortOption === 'Điểm AI Match cao nhất (≥90%)') {
      list.sort((a, b) => {
        const scoreA = a.aiMatchScore != null ? a.aiMatchScore : -1;
        const scoreB = b.aiMatchScore != null ? b.aiMatchScore : -1;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
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

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTitle('');
    setSelectedLocation('All Locations');
    setSelectedSalary('All Salaries');
    setCompanyBranchFilter('All');
    setSidebarFilters({
      matchScore: 0,
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
      {/* 2. HERO SEARCH SECTION                                     */}
      {/* ========================================================= */}
      <section className="relative w-full overflow-hidden bg-transparent py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {isRecruiter ? (
            <>
              <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#1e1b4b] tracking-tight max-w-4xl mx-auto leading-[1.15]">
                {activeCompanyShowcase ? (
                  <>
                    Vị Trí Tuyển Dụng{" "}
                    <span className="text-[#5b48bd]">
                      {activeCompanyShowcase.companyName}
                    </span>
                  </>
                ) : (
                  <>
                    Mạng Lưới Doanh Nghiệp &amp; Đối Tác Tuyển Dụng{" "}
                    <span className="text-[#5b48bd]">
                      HireMate AI
                    </span>
                  </>
                )}
              </h1>
              <p className="font-sans text-sm sm:text-base text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed font-medium">
                {activeCompanyShowcase
                  ? `Khám phá các vị trí tuyển dụng công khai thuộc ${activeCompanyShowcase.companyName}. Bấm lọc theo chi nhánh và khảo sát tiêu chuẩn tuyển dụng.`
                  : "Khám phá danh bạ doanh nghiệp đối tác trong hệ sinh thái HireMate AI. Bấm vào từng doanh nghiệp để xem thông tin chi tiết và danh sách các bài đăng tuyển dụng của doanh nghiệp đó."}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#1e1b4b] tracking-tight max-w-4xl mx-auto leading-[1.15]">
                Khám Phá Doanh Nghiệp &amp; Cơ Hội Nghề Nghiệp{" "}
                <span className="text-[#5b48bd]">
                  Với AI Thông Minh
                </span>
              </h1>
              <p className="font-sans text-sm sm:text-base text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed font-medium">
                HireMate AI — Kết nối trực tiếp với các doanh nghiệp đang tuyển dụng theo chi nhánh, đối soát điểm phù hợp CV và luyện phỏng vấn AI chuẩn hóa.
              </p>
            </>
          )}

          {/* Central Search Container */}
          <div className="mt-7 max-w-5xl mx-auto bg-white p-3.5 sm:p-4 rounded-3xl border border-purple-100 shadow-xl">
            <form className="grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={handleSearchSubmit}>
              {/* Input 1: Title, Skill, Company */}
              <div className="md:col-span-5 relative flex items-center bg-[#f4f2fd] rounded-full px-4 py-3 border border-purple-100 focus-within:border-[#5b48bd] focus-within:ring-2 focus-within:ring-[#5b48bd]/20 transition-all">
                <span className="material-symbols-outlined mr-2 text-xl text-[#5b48bd]">search</span>
                <input 
                  className="w-full bg-transparent text-sm text-[#1e1b4b] placeholder:text-purple-400 focus:outline-none font-sans font-medium" 
                  placeholder={
                    activeCompanyShowcase
                      ? `Tìm vị trí tuyển dụng tại ${activeCompanyShowcase.companyName}...`
                      : (isRecruiter
                          ? "Tìm tên doanh nghiệp, ngành nghề, công nghệ đối tác..."
                          : (activeTab === 'companies'
                              ? "Tìm tên doanh nghiệp, ngành nghề, công nghệ..."
                              : "Tìm vị trí, kỹ năng, doanh nghiệp..."))
                  } 
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
                    if (activeTab === 'companies' && !activeCompanyShowcase) {
                      const val = e.target.value;
                      let locName = val;
                      if (locName.includes('Ho Chi Minh')) locName = 'TP. Hồ Chí Minh';
                      else if (locName.includes('Hanoi')) locName = 'Hà Nội';
                      else if (locName.includes('Da Nang')) locName = 'Đà Nẵng';
                      else if (locName.includes('Remote')) locName = 'Remote';
                      setCompanyFilters(prev => ({
                        ...prev,
                        selectedLocations: val !== 'All Locations' ? [locName] : [],
                      }));
                      setCompanyPage(1);
                    } else {
                      setCurrentPage(1);
                    }
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#1e1b4b] focus:outline-none font-sans font-medium cursor-pointer"
                >
                  <option value="All Locations">Tất cả chi nhánh &amp; địa điểm</option>
                  <option value="Ho Chi Minh City, VN">TP. Hồ Chí Minh</option>
                  <option value="Hanoi, VN">Hà Nội</option>
                  <option value="Da Nang, VN">Đà Nẵng</option>
                  <option value="Remote Worldwide">Làm việc từ xa (Remote)</option>
                </select>
              </div>

              {/* Input 3: Salary / Filter */}
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
                  <span>
                    {activeCompanyShowcase
                      ? 'Tìm Tuyển Dụng'
                      : (isRecruiter || activeTab === 'companies' ? 'Tìm Doanh Nghiệp' : 'Tìm Việc')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Trending / Action Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-body">
            <span className="text-slate-500 flex items-center gap-1 mr-1 font-medium">
              <span className="material-symbols-outlined text-sm text-[#5b48bd]">trending_up</span> Xu hướng:
            </span>
            {(isRecruiter
              ? ['#FPT_Software', '#VNG_Corporation', '#Viettel', '#VinAI', '#MoMo', '#Tiki', '#Hà Nội', '#Đà Nẵng', '#TP.HCM']
              : ['#FPT', '#VNG', '#Java', '#ReactJS', '#Remote', '#Hà Nội', '#Đà Nẵng']
            ).map((chip) => (
              <button 
                key={chip}
                onClick={() => handleTrendingClick(chip)}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#1e1b4b] border border-purple-100 hover:border-[#5b48bd] hover:bg-purple-50 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                type="button"
              >
                {chip}
              </button>
            ))}
            {isCandidate && (
              <button 
                onClick={() => {
                  setActiveTab('jobs');
                  setActiveCompanyShowcase(null);
                  setSidebarFilters(prev => ({
                    ...prev,
                    onlyHighMatch: !prev.onlyHighMatch,
                    matchScore: !prev.onlyHighMatch ? 80 : 0,
                  }));
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs cursor-pointer shadow-xs transition-colors ${
                  sidebarFilters.onlyHighMatch && activeTab === 'jobs'
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100'
                }`}
                type="button"
              >
                <span className={`w-2 h-2 rounded-full ${sidebarFilters.onlyHighMatch && activeTab === 'jobs' ? 'bg-white' : 'bg-[#10b981]'}`}></span>
                <span>AI Match ≥ 80%</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DUAL-VIEW TAB SELECTOR                                  */}
      {/* ========================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
        <div className="bg-white rounded-3xl p-2.5 sm:p-3 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Main Tab Switcher */}
          {isRecruiter ? (
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              {activeCompanyShowcase ? (
                <>
                  <button
                    onClick={() => {
                      setActiveCompanyShowcase(null);
                      setCompanyBranchFilter('All');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f4f2fd] hover:bg-purple-100 text-[#5b48bd] font-extrabold text-xs sm:text-sm border border-purple-200 transition-all cursor-pointer shadow-xs hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Quay Lại Danh Sách Doanh Nghiệp</span>
                  </button>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#5b48bd] text-white font-bold text-xs sm:text-sm shadow-md">
                    <span className="material-symbols-outlined text-base">business</span>
                    <span>Bài đăng tuyển dụng: {activeCompanyShowcase.companyName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white">
                      {sourceJobsPool.length}
                    </span>
                  </div>
                </>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5b48bd] text-white font-extrabold text-xs sm:text-sm shadow-md">
                  <span className="material-symbols-outlined text-base sm:text-lg">apartment</span>
                  <span>Mạng Lưới Doanh Nghiệp Đối Tác</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white">
                    {companies.length}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center p-1 bg-[#f4f2fd] rounded-2xl w-full sm:w-auto border border-purple-100">
              <button
                onClick={() => {
                  setActiveTab('companies');
                }}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'companies'
                    ? 'bg-[#5b48bd] text-white shadow-md'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-lg">apartment</span>
                <span>Doanh Nghiệp Tuyển Dụng</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'companies' ? 'bg-white/20 text-white' : 'bg-purple-100 text-[#5b48bd]'
                }`}>
                  {companies.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('jobs');
                  setActiveCompanyShowcase(null);
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'jobs'
                    ? 'bg-[#5b48bd] text-white shadow-md'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-lg">work</span>
                <span>
                  {isCandidate
                    ? 'Việc Làm & Gợi Ý AI'
                    : 'Khám Phá Việc Làm'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-purple-100 text-[#5b48bd]'
                }`}>
                  {allJobs.length}
                </span>
              </button>
            </div>
          )}

          {/* Quick Context Note */}
          <div className="text-xs text-slate-500 font-medium hidden md:flex items-center gap-1.5">
            {isRecruiter ? (
              activeCompanyShowcase ? (
                <span className="flex items-center gap-1 text-[#5b48bd] font-bold">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Đang xem các vị trí tuyển dụng công khai của {activeCompanyShowcase.companyName}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#5b48bd] font-bold">
                  <span className="material-symbols-outlined text-sm">touch_app</span>
                  <span>Bấm vào từng doanh nghiệp để xem thông tin chi tiết và danh sách bài đăng tuyển dụng</span>
                </span>
              )
            ) : activeTab === 'companies' && activeCompanyShowcase ? (
              <span className="flex items-center gap-1 text-[#5b48bd] font-bold">
                <span className="material-symbols-outlined text-sm">business</span>
                <span>Đang xem danh sách bài tuyển dụng của {activeCompanyShowcase.companyName}</span>
              </span>
            ) : activeTab === 'companies' ? (
              <>
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">touch_app</span>
                <span>Bấm vào một doanh nghiệp để mở trang danh sách tuyển dụng của công ty đó</span>
              </>
            ) : isCandidate ? (
              <>
                <span className="material-symbols-outlined text-sm text-emerald-600">auto_awesome</span>
                <span>AI cá nhân hóa so khớp kỹ năng từ CV và gợi ý việc làm tốt nhất cho bạn</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm text-purple-600">lightbulb</span>
                <span>Đăng nhập tài khoản Ứng viên để AI so khớp CV cá nhân với từng công việc</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. MAIN CONTENT AREA: TAB 1 (COMPANIES DIRECTORY)         */}
      {/* ========================================================= */}
      {(isRecruiter ? !activeCompanyShowcase : (activeTab === 'companies' && !activeCompanyShowcase)) && (
        <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* THE EXACT 2-COLUMN VIEW AS IMAGE 3 (SIDEBAR + CONTENT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Filter Sidebar (lg:col-span-3 / 28%) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-5">
              <CompanyFilterSidebar
                filters={companyFilters}
                onFilterChange={(newFilters) => {
                  setCompanyFilters(newFilters);
                  setCompanyPage(1);
                }}
                onReset={() => {
                  setCompanyFilters({
                    selectedLocations: [],
                    selectedIndustries: [],
                    selectedSizes: [],
                    selectedSalaries: [],
                    selectedPerks: [],
                    onlyActiveHiring: false,
                    onlyManyJobs: false,
                  });
                  setCompanySearch('');
                  setCompanyPage(1);
                }}
                counts={{
                  locations: companyLocationCounts,
                }}
              />
            </aside>

            {/* Right Company Grid (lg:col-span-9 / 72%) */}
            <section className="lg:col-span-9 space-y-6">
              {/* Header Bar matching Image 3 */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
                  <span className="font-bold text-base text-[#1e1b4b]">
                    Tìm thấy <span className="text-[#5b48bd] font-extrabold">{sortedCompanies.length} doanh nghiệp</span> đối tác
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Toggle: Grid / List */}
                  <div className="flex items-center bg-[#f4f2fd] rounded-xl p-1 border border-purple-100">
                    <button
                      onClick={() => setCompanyViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        companyViewMode === 'list' ? 'bg-white text-[#5b48bd] shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Dạng danh sách"
                    >
                      <span className="material-symbols-outlined text-lg leading-none">view_list</span>
                    </button>
                    <button
                      onClick={() => setCompanyViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        companyViewMode === 'grid' ? 'bg-white text-[#5b48bd] shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Dạng lưới"
                    >
                      <span className="material-symbols-outlined text-lg leading-none">grid_view</span>
                    </button>
                  </div>

                  {/* Sorter Dropdown */}
                  <div className="flex items-center bg-[#f4f2fd] rounded-xl px-3 py-2 border border-purple-100 text-xs shadow-2xs">
                    <select
                      value={companySort}
                      onChange={(e) => setCompanySort(e.target.value)}
                      className="bg-transparent font-bold text-[#1e1b4b] focus:outline-none cursor-pointer"
                    >
                      <option value="Nhiều việc làm nhất">Nhiều việc làm nhất</option>
                      <option value="Tên A - Z">Tên A - Z</option>
                      <option value="Mới nhất">Mới nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Cards Grid matching Image 3 */}
              {companiesLoading ? (
                <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-purple-100">
                  <div className="w-10 h-10 border-3 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-bold text-slate-500">Đang tải danh sách doanh nghiệp đối tác...</p>
                </div>
              ) : sortedCompanies.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm space-y-4">
                  <span className="material-symbols-outlined text-5xl text-purple-300">domain_disabled</span>
                  <h3 className="text-base font-bold text-[#1e1b4b]">Không tìm thấy doanh nghiệp phù hợp</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Hãy thử bỏ một số tiêu chí lọc hoặc xóa tìm kiếm để xem danh sách đầy đủ.
                  </p>
                  <button
                    onClick={() => {
                      setCompanySearch('');
                      setCompanyFilters({
                        selectedLocations: [],
                        selectedIndustries: [],
                        selectedSizes: [],
                        selectedSalaries: [],
                        selectedPerks: [],
                        onlyActiveHiring: false,
                        onlyManyJobs: false,
                      });
                      setCompanyPage(1);
                    }}
                    className="px-5 py-2 bg-[#5b48bd] text-white font-bold text-xs rounded-full shadow-md hover:bg-[#4a39a8] transition-all cursor-pointer"
                  >
                    Xem tất cả doanh nghiệp
                  </button>
                </div>
              ) : (
                <div className={companyViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
                  {paginatedCompanies.map((comp) => (
                    <CompanyCard
                      key={comp.companyId}
                      company={comp}
                      user={user}
                      onSelectCompany={(c) => {
                        setActiveCompanyShowcase(c);
                        setCompanyBranchFilter('All');
                        setCurrentPage(1);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      onViewProfile={(c) => {
                        setSelectedCompanyProfile(c);
                      }}
                      onEditCompany={(c) => {
                        window.location.hash = '#/company-profile';
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination for Companies if many */}
              {sortedCompanies.length > companyPageSize && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all font-sans">
                  <div className="text-xs sm:text-sm font-medium text-slate-500">
                    Hiển thị <span className="font-bold text-[#1e1b4b]">
                      {(companyPage - 1) * companyPageSize + 1} - {Math.min(companyPage * companyPageSize, sortedCompanies.length)}
                    </span> trong <span className="font-bold text-[#5b48bd]">{sortedCompanies.length}</span> doanh nghiệp
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-sans">
                    <button
                      onClick={() => setCompanyPage(prev => Math.max(1, prev - 1))}
                      disabled={companyPage === 1}
                      className={`w-9 h-9 rounded-full border border-purple-100 flex items-center justify-center transition-all ${
                        companyPage === 1
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'
                          : 'bg-white text-[#1e1b4b] hover:bg-purple-50 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>

                    {Array.from({ length: totalCompanyPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCompanyPage(pageNum)}
                        className={`w-9 h-9 rounded-full font-bold transition-all flex items-center justify-center cursor-pointer ${
                          pageNum === companyPage
                            ? 'bg-[#5b48bd] text-white shadow-md'
                            : 'bg-white text-[#1e1b4b] border border-purple-100 hover:bg-purple-50 shadow-2xs'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setCompanyPage(prev => Math.min(totalCompanyPages, prev + 1))}
                      disabled={companyPage === totalCompanyPages}
                      className={`px-4 py-2 rounded-full text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md ${
                        companyPage === totalCompanyPages
                          ? 'bg-purple-300 cursor-not-allowed opacity-60'
                          : 'bg-[#5b48bd] hover:bg-[#4a39a8] cursor-pointer'
                      }`}
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
      )}

      {/* ========================================================= */}
      {/* 5. FULL 2-COLUMN VIEW (FOR ALL JOBS OR COMPANY SHOWCASE)   */}
      {/* ========================================================= */}
      {((!isRecruiter && activeTab === 'jobs') || activeCompanyShowcase) && (
        <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* ===================================================== */}
          {/* IF INSIDE COMPANY SHOWCASE: DEDICATED COMPANY BANNER  */}
          {/* ===================================================== */}
          {activeCompanyShowcase && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm mb-8 transition-all relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-5">
                <button
                  onClick={() => {
                    setActiveCompanyShowcase(null);
                    setCompanyBranchFilter('All');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f4f2fd] hover:bg-purple-100 text-[#5b48bd] font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs hover:scale-105"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Quay lại danh sách doanh nghiệp</span>
                </button>

                {activeCompanyShowcase.website && (
                  <a
                    href={activeCompanyShowcase.website.startsWith('http') ? activeCompanyShowcase.website : `https://${activeCompanyShowcase.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b48bd] hover:text-[#4a39a8] hover:underline"
                  >
                    <span>Website công ty</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>

              {/* Company Info Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f4f2fd] to-[#ede9fe] border border-purple-100 flex items-center justify-center p-2.5 shadow-sm overflow-hidden shrink-0">
                  {activeCompanyShowcase.logoUrl ? (
                    <img
                      src={activeCompanyShowcase.logoUrl}
                      alt={activeCompanyShowcase.companyName}
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    style={{ display: activeCompanyShowcase.logoUrl ? 'none' : 'flex' }}
                    className="w-full h-full font-black text-2xl text-[#5b48bd] items-center justify-center"
                  >
                    {activeCompanyShowcase.companyName?.slice(0, 3).toUpperCase() || 'ENT'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] tracking-tight">
                      {activeCompanyShowcase.companyName}
                    </h2>
                    <span className="material-symbols-outlined text-emerald-600 text-xl" title="Doanh nghiệp xác thực">
                      verified
                    </span>
                    {activeCompanyShowcase.industry && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5b48bd] border border-purple-100">
                        {activeCompanyShowcase.industry}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                    {activeCompanyShowcase.companySize && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">group</span>
                        <span>{activeCompanyShowcase.companySize}</span>
                      </span>
                    )}
                    {activeCompanyShowcase.address && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">location_on</span>
                        <span>Trụ sở: {activeCompanyShowcase.address}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>{sourceJobsPool.length} vị trí đang mở tuyển</span>
                    </span>
                  </div>

                  {activeCompanyShowcase.description && (
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {activeCompanyShowcase.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Branch Filter Pills */}
              {activeCompanyBranches.length > 0 && (
                <div className="mt-5 pt-4 border-t border-purple-50 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#5b48bd]">pin_drop</span>
                    Lọc theo chi nhánh:
                  </span>
                  <button
                    onClick={() => {
                      setCompanyBranchFilter('All');
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      companyBranchFilter === 'All'
                        ? 'bg-[#5b48bd] text-white shadow-2xs'
                        : 'bg-[#f4f2fd] text-slate-600 hover:bg-purple-100'
                    }`}
                  >
                    Tất cả chi nhánh ({sourceJobsPool.length})
                  </button>
                  {activeCompanyBranches.map(branch => {
                    const count = sourceJobsPool.filter(j => j.location === branch).length;
                    return (
                      <button
                        key={branch}
                        onClick={() => {
                          setCompanyBranchFilter(branch);
                          setCurrentPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          companyBranchFilter === branch
                            ? 'bg-[#5b48bd] text-white shadow-2xs'
                            : 'bg-[#f4f2fd] text-slate-600 hover:bg-purple-100'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]"></span>
                        <span>{branch} ({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* THE EXACT 2-COLUMN VIEW AS IMAGE 2 (SIDEBAR + JOBS)   */}
          {/* ===================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Filter Sidebar (28%) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-5">
              <JobFilterSidebar 
                user={user}
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

            {/* Right Job Board (72%) */}
            <section className="lg:col-span-9 space-y-6">
              {/* Header Bar */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-spin' : 'bg-[#10b981] animate-pulse'}`}></span>
                    <span className="font-bold text-base text-[#1e1b4b]">
                      {activeCompanyShowcase ? (
                        <>
                          Vị trí tuyển dụng của <span className="text-[#5b48bd] font-black">{activeCompanyShowcase.companyName}</span> ({sortedJobs.length} vị trí)
                        </>
                      ) : (
                        <>
                          Tìm thấy <span className="text-[#5b48bd] font-extrabold">{sortedJobs.length} việc làm</span> phù hợp
                        </>
                      )}
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeCompanyShowcase && companyBranchFilter !== 'All' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                        <span>Chi nhánh: {companyBranchFilter}</span>
                        <button 
                          onClick={() => setCompanyBranchFilter('All')} 
                          className="hover:text-red-500 ml-0.5 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {sidebarFilters.onlyHighMatch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-[#059669] border border-emerald-200">
                        <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                        <span>Match ≥ 80%</span>
                        <button 
                          onClick={() => setSidebarFilters(prev => ({ ...prev, onlyHighMatch: false }))} 
                          className="hover:text-red-500 ml-0.5 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchTitle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-[#5b48bd] border border-purple-200">
                        <span>"{searchTitle}"</span>
                        <button 
                          onClick={() => { setSearchTitle(''); fetchRealJobs('', selectedLocation); }} 
                          className="hover:text-red-500 ml-0.5 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Layout Toggle & Sorter */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center bg-purple-50 rounded-full p-1 border border-purple-100">
                    <button 
                      onClick={() => setViewMode('list')}
                      title="Bố cục ngang" 
                      className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        viewMode === 'list' ? 'bg-white text-[#5b48bd] shadow-2xs font-bold' : 'text-slate-400 hover:text-[#5b48bd]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">view_list</span>
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      title="Bố cục ô vuông" 
                      className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white text-[#5b48bd] shadow-2xs font-bold' : 'text-slate-400 hover:text-[#5b48bd]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">grid_view</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isCandidate && (
                      <button
                        onClick={handleReMatch}
                        disabled={isRematching}
                        className="py-1.5 px-3 bg-white hover:bg-purple-50 text-[#5b48bd] rounded-full text-xs font-bold border border-purple-200 flex items-center gap-1 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                        title="Đối soát CV với AI"
                      >
                        <span className={`material-symbols-outlined text-sm ${isRematching ? 'animate-spin' : ''}`}>
                          {isRematching ? 'sync' : 'auto_awesome'}
                        </span>
                        <span>{isRematching ? 'Đang Quét...' : 'Làm mới gợi ý AI'}</span>
                      </button>
                    )}

                    <select 
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="py-1.5 px-3 bg-purple-50 rounded-full text-xs font-semibold text-[#1e1b4b] border border-purple-200 focus:border-[#5b48bd] focus:outline-none cursor-pointer"
                    >
                      <option value="Mới đăng gần đây">Mới đăng gần đây</option>
                      {isCandidate && <option value="Điểm AI Match cao nhất (≥90%)">Điểm AI Match cao nhất</option>}
                      <option value="Lương: Cao đến thấp">Lương: Cao đến thấp</option>
                      <option value="Doanh nghiệp tuyển gấp">Tuyển gấp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Empty state */}
              {sortedJobs.length === 0 && !loading && (
                <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm space-y-4">
                  <span className="material-symbols-outlined text-5xl text-purple-300">search_off</span>
                  <h3 className="text-lg font-bold text-[#1e1b4b]">
                    {activeCompanyShowcase 
                      ? `Không có tin tuyển dụng nào của ${activeCompanyShowcase.companyName} phù hợp với bộ lọc này` 
                      : 'Không tìm thấy việc làm phù hợp'}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Hãy thử điều chỉnh mức lương, giảm ngưỡng AI Match hoặc bấm "Xóa bộ lọc" để xem toàn bộ vị trí.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 bg-[#5b48bd] text-white font-bold text-xs rounded-full shadow-md hover:bg-[#4a39a8] transition-all cursor-pointer"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}

              {/* Grid / List of Job Cards */}
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {paginatedJobs.map((job) => (
                  <JobCard 
                    key={job.jobId} 
                    job={job}
                    user={user}
                    onSelectJob={(j) => {
                      window.location.hash = `#/jobs/${j.jobId || j.id || 101}`;
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

              {/* Pagination for Jobs */}
              {sortedJobs.length > 0 && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 transition-all font-sans">
                  <div className="text-xs sm:text-sm font-medium text-slate-500">
                    Hiển thị <span className="font-bold text-[#1e1b4b]">
                      {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedJobs.length)}
                    </span> trong <span className="font-bold text-[#5b48bd]">{sortedJobs.length}</span> việc làm
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-sans">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`w-9 h-9 rounded-full border border-purple-100 flex items-center justify-center transition-all ${
                        currentPage === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60' : 'bg-white text-[#1e1b4b] hover:bg-purple-50 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
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
                                ? 'bg-[#5b48bd] text-white shadow-md'
                                : 'bg-white text-[#1e1b4b] border border-purple-100 hover:bg-purple-50 shadow-2xs'
                            }`}
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

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-full text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md ${
                        currentPage === totalPages ? 'bg-purple-300 cursor-not-allowed opacity-60' : 'bg-[#5b48bd] hover:bg-[#4a39a8] cursor-pointer'
                      }`}
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
      )}

      {/* ========================================================= */}
      {/* 6. MODALS                                                 */}
      {/* ========================================================= */}

      {/* Apply Job Modal */}
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

      {/* Company Profile Modal */}
      {selectedCompanyProfile && (
        <CompanyProfileModal
          company={selectedCompanyProfile}
          isOpen={!!selectedCompanyProfile}
          onClose={() => setSelectedCompanyProfile(null)}
          onViewJobs={(comp) => {
            setSelectedCompanyProfile(null);
            setActiveCompanyShowcase(comp);
            setCompanyBranchFilter('All');
            setCurrentPage(1);
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

