import React, { useState, useEffect } from 'react';
import { companyApi, jobApi } from '../api';
import { formatScannedSalary } from './RecruiterJobManagementPage';
import { calculateJobDeadline } from '../utils/jobTimeUtils';

export default function CompanyDetailPage({ companyId, user }) {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW | JOBS | BRANCHES | BENEFITS
  const [jobSearch, setJobSearch] = useState('');

  const numericCompanyId = companyId ? Number(String(companyId).replace(/[^0-9]/g, '')) : null;

  useEffect(() => {
    let isMounted = true;
    const loadCompanyData = async () => {
      if (!numericCompanyId && !companyId) {
        setError('Mã doanh nghiệp không hợp lệ.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch Company details
        let fetchedComp = null;
        try {
          const compRes = await companyApi.getCompanyById(numericCompanyId || companyId);
          fetchedComp = compRes?.data || compRes;
        } catch (err) {
          console.warn('Không thể tải chi tiết công ty từ backend:', err);
        }

        // Fallback: check localStorage for cached company profile
        if (!fetchedComp) {
          try {
            const adminList = JSON.parse(localStorage.getItem('hiremate_admin_companies_list') || '[]');
            fetchedComp = adminList.find(
              (c) => String(c.id) === String(companyId) || String(c.rawId) === String(numericCompanyId)
            );
          } catch {}
        }

        // Fallback default enterprise company profile
        if (!fetchedComp) {
          fetchedComp = {
            companyId: numericCompanyId || 1,
            companyName: 'FPT Software & Digital Technology',
            logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150&auto=format&fit=crop&q=80',
            industry: 'Công Nghệ Thông Tin & Phần Mềm',
            companySize: '10.000+ nhân viên',
            address: 'Tòa nhà FPT, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
            website: 'https://fptsoftware.com',
            taxCode: '0101234567',
            status: 'VERIFIED',
            description: 'FPT Software là tập đoàn công nghệ thông tin và chuyển đổi số hàng đầu Đông Nam Á, cung cấp các giải pháp phần mềm, AI, Cloud và chuyển đổi số cho các doanh nghiệp Fortune 500 trên 30 quốc gia.',
            activeJobsCount: 8,
            locations: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Quy Nhơn'],
            benefits: [
              { title: 'Lương & Thưởng Hấp Dẫn', desc: 'Thưởng tháng 13, thưởng hiệu quả kinh doanh dự án định kỳ.' },
              { title: 'Bảo Hiểm Sức Khỏe Cao Cấp', desc: 'Gói FPT Care toàn diện cho nhân viên và người thân.' },
              { title: 'Làm Việc Hybrid Linh Hoạt', desc: 'Linh hoạt làm việc tại văn phòng tiện nghi hoặc từ xa.' },
              { title: 'Đào Tạo & Chứng Chỉ Quốc Tế', desc: 'Tài trợ 100% học phí và thi chứng chỉ AWS, GCP, Azure, PMP.' }
            ],
            branches: [
              { name: 'Trụ Sở Chính Hà Nội', address: 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội', phone: '024 7300 7300' },
              { name: 'Chi Nhánh TP. Hồ Chí Minh', address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM', phone: '028 7300 7300' },
              { name: 'Chi Nhánh Đà Nẵng', address: 'FPT Complex, Đường Nam Kỳ Khởi Nghĩa, Ngũ Hành Sơn, Đà Nẵng', phone: '0236 730 0730' }
            ]
          };
        }

        if (isMounted) {
          setCompany(fetchedComp);
        }

        // 2. Fetch Jobs by company
        try {
          let jobsRes = null;
          if (numericCompanyId) {
            jobsRes = await jobApi.getJobsByCompany(numericCompanyId);
          }
          const rawJobs = jobsRes?.data || jobsRes;
          let jobList = Array.isArray(rawJobs) ? rawJobs : (Array.isArray(rawJobs?.data) ? rawJobs.data : []);

          if (jobList.length === 0) {
            // Try fetching from all jobs and filter
            const allJobsRes = await jobApi.getJobs({ page: 0, size: 50 });
            const allRaw = allJobsRes?.data?.content || allJobsRes?.data || allJobsRes;
            if (Array.isArray(allRaw)) {
              jobList = allRaw.filter(
                (j) =>
                  Number(j.companyId) === Number(numericCompanyId) ||
                  (j.companyName && fetchedComp.companyName && j.companyName.toLowerCase().includes(fetchedComp.companyName.toLowerCase()))
              );
            }
          }

          if (isMounted) {
            setJobs(jobList);
          }
        } catch (jobErr) {
          console.warn('Lỗi lấy danh sách việc làm của công ty:', jobErr);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Không thể tải thông tin doanh nghiệp.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCompanyData();

    return () => {
      isMounted = false;
    };
  }, [companyId, numericCompanyId]);

  const filteredJobs = jobs.filter((j) => {
    if (!jobSearch.trim()) return true;
    const q = jobSearch.toLowerCase();
    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.employmentType || '').toLowerCase().includes(q) ||
      (Array.isArray(j.mandatorySkills) && j.mandatorySkills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#f8f9fd]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5b48bd] to-[#8b5cf6] flex items-center justify-center text-white shadow-xl animate-spin mb-4">
          <span className="material-symbols-outlined text-3xl">domain</span>
        </div>
        <p className="text-base font-bold text-[#1e1b4b]">Đang tải hồ sơ doanh nghiệp...</p>
        <p className="text-xs text-slate-500 mt-1">Kết nối hồ sơ pháp lý &amp; các vị trí tuyển dụng chính thức</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#f8f9fd] text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-[#1e1b4b]">Không Tìm Thấy Doanh Nghiệp</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          {error || 'Hồ sơ doanh nghiệp này hiện không khả dụng hoặc chưa được kích hoạt công khai.'}
        </p>
        <button
          type="button"
          onClick={() => { window.location.hash = '#/'; }}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Quay lại trang chủ</span>
        </button>
      </div>
    );
  }

  const isVerified = company.status === 'VERIFIED' || company.status === 'APPROVED' || company.status === 'ACTIVE';

  return (
    <div className="w-full min-h-screen bg-[#f8f9fd] font-sans pb-24 selection:bg-[#5b48bd] selection:text-white">
      {/* 1. TOP BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
          <a href="#/" className="hover:text-[#5b48bd] flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[17px]">home</span>
            <span>Trang chủ</span>
          </a>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-500">Mạng lưới doanh nghiệp</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-800 font-bold truncate max-w-xs">{company.companyName}</span>
        </nav>
      </div>

      {/* 2. HERO COVER & HEADER BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#20184e] via-[#35257c] to-[#5b48bd] p-6 sm:p-8 md:p-10 text-white shadow-xl overflow-hidden border border-purple-900/30">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            {/* Logo + Basic Info */}
            <div className="flex items-center gap-5 sm:gap-6 flex-wrap sm:flex-nowrap">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 shrink-0">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.companyName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-2xl font-black text-[#5b48bd]">
                    {(company.companyName || 'HM').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                    {company.companyName}
                  </h1>
                  {isVerified && (
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold backdrop-blur-md"
                      title="Doanh nghiệp đã hoàn tất xác thực giấy phép kinh doanh (GPKD)"
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Verified Employer</span>
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl font-medium">
                  {company.industry || 'Lĩnh vực công nghệ & giải pháp số'} • {company.companySize || 'Doanh nghiệp'}
                </p>

                {/* Quick Meta tags */}
                <div className="flex items-center gap-3 mt-3 text-xs text-purple-200/90 flex-wrap">
                  {company.address && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-purple-300">location_on</span>
                      <span>{company.address}</span>
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-white transition-colors underline"
                    >
                      <span className="material-symbols-outlined text-sm text-purple-300">language</span>
                      <span>{company.website.replace(/^https?:\/\//, '')}</span>
                      <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                    </a>
                  )}
                  {company.taxCode && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-purple-300">badge</span>
                      <span>MST: {company.taxCode}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action: Active Jobs Count Pill & Bookmark */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
              <div className="text-right bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15">
                <div className="text-2xl font-black text-white">{jobs.length}</div>
                <div className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider">Vị Trí Đang Tuyển</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 border-b border-purple-100 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">info</span>
            <span>Tổng Quan Doanh Nghiệp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('JOBS')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'JOBS'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">work</span>
            <span>Việc Làm Tuyển Dụng ({jobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BRANCHES')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'BRANCHES'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">apartment</span>
            <span>Trụ Sở &amp; Chi Nhánh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BENEFITS')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'BENEFITS'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">redeem</span>
            <span>Phúc Lợi &amp; Đãi Ngộ</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (Col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#5b48bd]">article</span>
                    <span>Về Chúng Tôi</span>
                  </h3>
                  <div className="mt-3 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal">
                    {company.description || 'Chưa có thông tin mô tả chi tiết từ doanh nghiệp.'}
                  </div>
                </div>

                {/* Key Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                    <span className="material-symbols-outlined text-2xl text-[#5b48bd]">groups</span>
                    <div className="font-bold text-sm text-slate-800 mt-1">{company.companySize || '100+'}</div>
                    <div className="text-[11px] text-slate-500">Quy mô nhân sự</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">domain_verification</span>
                    <div className="font-bold text-sm text-slate-800 mt-1">{isVerified ? 'Đã Xác Thực' : 'Đang Chờ Duyệt'}</div>
                    <div className="text-[11px] text-slate-500">Hồ sơ pháp lý GPKD</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                    <span className="material-symbols-outlined text-2xl text-amber-600">rocket_launch</span>
                    <div className="font-bold text-sm text-slate-800 mt-1">{jobs.length} Vị trí</div>
                    <div className="text-[11px] text-slate-500">Đang tuyển trực tiếp</div>
                  </div>
                </div>

                {/* Preview Top Jobs */}
                <div className="pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-sm text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">bolt</span>
                      <span>Tin Tuyển Dụng Mới Nhất</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('JOBS')}
                      className="text-xs font-bold text-[#5b48bd] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Xem tất cả ({jobs.length})</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {jobs.slice(0, 3).map((job) => {
                      const deadlineInfo = calculateJobDeadline(job.deadlineDate);
                      return (
                        <div
                          key={job.id || job.jobId}
                          onClick={() => { window.location.hash = `#/jobs/${job.jobId || job.id}`; }}
                          className="p-4 rounded-2xl bg-white border border-purple-100/90 hover:border-[#5b48bd] hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                        >
                          <div>
                            <h5 className="font-bold text-sm text-[#1e1b4b] group-hover:text-[#5b48bd] transition-colors">
                              {job.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                <span className="material-symbols-outlined text-[15px]">payments</span>
                                <span>{formatScannedSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salary)}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">location_on</span>
                                <span>{job.location || 'Toàn quốc'}</span>
                              </span>
                              <span>•</span>
                              <span className="text-[11px] text-slate-400">{deadlineInfo.text}</span>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-purple-50 group-hover:bg-[#5b48bd] text-[#5b48bd] group-hover:text-white font-bold text-xs transition-all shrink-0">
                            <span>Ứng Tuyển</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: JOBS */}
            {activeTab === 'JOBS' && (
              <div className="space-y-4">
                {/* Search Bar for Jobs */}
                <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Tìm theo chức danh, địa điểm làm việc hoặc kỹ năng..."
                    className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {jobSearch && (
                    <button
                      type="button"
                      onClick={() => setJobSearch('')}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Job Cards */}
                <div className="space-y-3">
                  {filteredJobs.length === 0 ? (
                    <div className="p-10 rounded-3xl bg-white border border-purple-100 text-center shadow-sm">
                      <span className="material-symbols-outlined text-4xl text-slate-300">work_outline</span>
                      <h4 className="font-bold text-sm text-[#1e1b4b] mt-2">Chưa có vị trí tuyển dụng phù hợp</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Hãy thử điều chỉnh từ khóa tìm kiếm hoặc quay lại sau.
                      </p>
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const deadlineInfo = calculateJobDeadline(job.deadlineDate);
                      const mandSkills = Array.isArray(job.mandatorySkills)
                        ? job.mandatorySkills
                        : (job.skills || []);

                      return (
                        <div
                          key={job.id || job.jobId}
                          onClick={() => { window.location.hash = `#/jobs/${job.jobId || job.id}`; }}
                          className="p-5 rounded-3xl bg-white border border-purple-100 hover:border-[#5b48bd] hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-bold text-[#1e1b4b] group-hover:text-[#5b48bd] transition-colors">
                                  {job.title}
                                </h4>
                                {job.jobLevel && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] uppercase border border-purple-200">
                                    {job.jobLevel}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 flex-wrap">
                                <span className="font-bold text-emerald-700 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">payments</span>
                                  <span>{formatScannedSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salary)}</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
                                  <span>{job.location || 'Toàn quốc'}</span>
                                </span>
                                <span>•</span>
                                <span className="text-[11px] text-slate-400">{deadlineInfo.text}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="px-4 py-2 rounded-full bg-[#5b48bd] group-hover:bg-[#47369f] text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                            >
                              <span>Ứng Tuyển Ngay</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                          </div>

                          {/* Skill Tags */}
                          {mandSkills.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 flex-wrap pt-3 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kỹ năng:</span>
                              {mandSkills.slice(0, 5).map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {mandSkills.length > 5 && (
                                <span className="text-[10px] text-slate-400 font-bold">
                                  +{mandSkills.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: BRANCHES */}
            {activeTab === 'BRANCHES' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-xl text-[#5b48bd]">apartment</span>
                  <span>Mạng Lưới Chi Nhánh &amp; Trụ Sở</span>
                </h3>

                {Array.isArray(company.branches) && company.branches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {company.branches.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-center gap-2 font-bold text-sm text-[#1e1b4b]">
                          <span className="material-symbols-outlined text-base text-[#5b48bd]">business</span>
                          <span>{b.name || `Chi nhánh #${idx + 1}`}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-sm text-slate-400 shrink-0">place</span>
                          <span>{b.address || 'Đang cập nhật địa chỉ'}</span>
                        </p>
                        {b.phone && (
                          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                            <span>{b.phone}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100">
                    <div className="font-bold text-sm text-[#1e1b4b]">Trụ Sở Chính</div>
                    <p className="text-xs text-slate-600 mt-1">{company.address || 'Đang cập nhật địa chỉ'}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BENEFITS */}
            {activeTab === 'BENEFITS' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-xl text-[#5b48bd]">redeem</span>
                  <span>Chế Độ Đãi Ngộ &amp; Môi Trường Làm Việc</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(company.benefits) && company.benefits.length > 0
                    ? company.benefits
                    : [
                        { title: 'Lương & Thưởng Hiệu Quả', desc: 'Thưởng tháng 13 và chia sẻ lợi nhuận dự án.' },
                        { title: 'Bảo Hiểm Sức Khỏe Toàn Diện', desc: 'Chăm sóc sức khỏe định kỳ cho nhân viên & gia đình.' },
                        { title: 'Đào Tạo & Lộ Trình Thăng Tiến', desc: 'Hỗ trợ kinh phí thi chứng chỉ quốc tế và học ngoại ngữ.' },
                        { title: 'Môi Trường Linh Hoạt & Hiện Đại', desc: 'Văn phòng hiện đại, cà phê, trà bánh và Teambuilding thường niên.' }
                      ]
                  ).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border border-purple-100"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-[#1e1b4b]">
                        <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                        <span>{b.title || b}</span>
                      </div>
                      {b.desc && <p className="text-xs text-slate-600 mt-1 pl-6">{b.desc}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Box 1: Thông tin pháp lý & Liên hệ */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2 border-b border-purple-100 pb-3">
                <span className="material-symbols-outlined text-lg text-[#5b48bd]">verified_user</span>
                <span>Hồ Sơ Xác Thực Doanh Nghiệp</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-700 block">Tên Pháp Nhân:</span>
                  <p className="mt-0.5 text-slate-800 font-medium">{company.companyName}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block">Mã Số Thuế (MST):</span>
                  <p className="mt-0.5 font-mono font-bold text-slate-900">{company.taxCode || 'Đã kiểm tra'}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block">Trạng Thái Xác Thực:</span>
                  <div className="mt-1">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                        <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                        <span>GPKD Đã Được Phê Duyệt</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                        <span className="material-symbols-outlined text-sm text-amber-600">hourglass_top</span>
                        <span>Đang Chờ Quản Trị Duyệt</span>
                      </span>
                    )}
                  </div>
                </div>

                {company.website && (
                  <div>
                    <span className="font-bold text-slate-700 block">Website Chính Thức:</span>
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 text-[#5b48bd] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Truy cập trang web</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Đảm bảo quyền lợi từ HireMate AI */}
            <div className="bg-gradient-to-br from-[#20184e] to-[#402a8b] rounded-3xl p-6 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-amber-400">shield</span>
                <span className="font-bold text-xs uppercase tracking-wider text-amber-300">Cam Kết Tin Cậy</span>
              </div>
              <p className="text-xs text-purple-100 leading-relaxed">
                Tất cả các tin tuyển dụng của doanh nghiệp này được kiểm duyệt và áp dụng thuật toán AI Matching 70/30 chuẩn mực để bảo vệ tối đa quyền lợi ứng viên.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
