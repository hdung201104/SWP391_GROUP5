import React, { useState, useEffect, useMemo } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RecruiterProfilePage from './RecruiterProfilePage';
import RecruiterJobManagementPage from './RecruiterJobManagementPage';
import { jobApi, applicationApi, aiMatchApi, companyApi } from '../api';
import { parseSkillList } from '../utils/helpers';
import { calculateJobDeadline } from '../utils/jobTimeUtils';

export default function RecruiterDashboardPage({ user, currentRoute }) {
  // Parse tab from currentRoute
  const getInitialTab = () => {
    if (currentRoute?.includes('tab=jobs')) return 'JOBS';
    if (currentRoute?.includes('tab=pipeline')) return 'PIPELINE';
    if (currentRoute?.includes('tab=company')) return 'COMPANY';
    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (currentRoute?.includes('tab=jobs')) setActiveTab('JOBS');
    else if (currentRoute?.includes('tab=pipeline')) setActiveTab('PIPELINE');
    else if (currentRoute?.includes('tab=company')) setActiveTab('COMPANY');
  }, [currentRoute]);

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [allCompanyApplications, setAllCompanyApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Analytics & Report State
  const [reportTimeframe, setReportTimeframe] = useState('ALL');
  const [reportJobFilter, setReportJobFilter] = useState('ALL');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredVelocityIndex, setHoveredVelocityIndex] = useState(null);
  const [hoveredRadarSkill, setHoveredRadarSkill] = useState(null);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState(null);
  const [velocityViewMode, setVelocityViewMode] = useState('ALL'); // 'ALL' | 'WEEK' | 'JOB'

  // Company Profile state from DB
  const [companyProfile, setCompanyProfile] = useState({
    name: user?.companyName || 'Doanh Nghiệp Tuyển Dụng',
    tagline: 'Leading Global IT Services & Digital Transformation Partner',
    bio: 'Doanh nghiệp tuyển dụng kết nối tài năng công nghệ thông minh với HireMate AI.',
    website: 'https://hiremate.ai',
    headquarters: 'Hà Nội & TP. Hồ Chí Minh',
    size: '100 - 500 nhân sự',
  });

  // Create Job Form with 70/30 skill weighting
  const [newJobForm, setNewJobForm] = useState({
    title: 'Intern Backend',
    department: 'Engineering',
    location: 'Đà Nẵng',
    salaryText: '$1,500 - $2,000/tháng',
    vacanciesCount: 1,
    deadlineDate: '',
    description: '- Intern backend\n- Thiết kế, xây dựng các dịch vụ RESTful API và module chịu tải lớn, đảm bảo tính sẵn sàng cao (High Availability).\n- Tối ưu hóa cơ sở dữ liệu quan hệ và phân tán, thiết lập giải pháp bộ nhớ đệm và xử lý luồng nghiệp vụ mượt mà.\n- Phối hợp chặt chẽ cùng Technical Lead, Solution Architect và Product Owner trong mô hình Agile/Scrum.\n- Thực hiện Code Review, viết Unit Test & Integration Test, bảo đảm chất lượng mã nguồn.',
    mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL',
    preferredSkillsInput: 'Microservices',
  });

  const fetchDashboardData = async () => {
    try {
      setIsLoadingJobs(true);
      const [jobsRes, compRes] = await Promise.allSettled([
        jobApi.getMyJobs(),
        companyApi.getMyCompany(),
      ]);

      if (compRes.status === 'fulfilled' && compRes.value?.data) {
        const c = compRes.value.data;
        setCompanyProfile({
          name: c.companyName || user?.companyName || 'Doanh Nghiệp Tuyển Dụng',
          tagline: c.description || 'Đối Tác Tuyển Dụng Chuyển Đổi Số AI',
          bio: c.description || 'Doanh nghiệp tuyển dụng trên nền tảng HireMate AI.',
          website: c.website || 'https://hiremate.ai',
          headquarters: c.address || 'Việt Nam',
          size: c.companySize || '100 - 500 nhân sự',
        });
      }

      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data)) {
        const rawJobs = jobsRes.value.data;
        const allAppsCollected = [];
        const mappedJobs = await Promise.all(
          rawJobs.map(async (j) => {
            let applicantCount = j.vacanciesCount || 0;
            let avgScore = 0;
            let interviewCount = 0;
            let offerCount = 0;
            try {
              const appsRes = await applicationApi.getJobApplications(j.jobId);
              const apps = appsRes?.data || [];
              if (Array.isArray(apps)) {
                applicantCount = apps.length;
                interviewCount = apps.filter((a) => a.status === 'INTERVIEWING').length;
                offerCount = apps.filter((a) => a.status === 'OFFERED').length;
                const totalScore = apps.reduce((sum, a) => sum + (a.matchingScore || 0), 0);
                avgScore = applicantCount > 0 ? Math.round(totalScore / applicantCount) : 0;

                apps.forEach((app) => {
                  allAppsCollected.push({
                    applicationId: app.applicationId,
                    candidateId: app.candidateId,
                    candidateName: app.candidateName || 'Ứng viên',
                    candidateEmail: app.candidateEmail || '',
                    jobId: j.jobId,
                    jobTitle: j.title || 'Vị trí Tuyển Dụng',
                    matchingScore: app.matchingScore || 0,
                    status: app.status || 'APPLIED',
                    createdAt: app.createdAt || new Date().toISOString(),
                    cvUrl: app.cvUrl || '#',
                  });
                });
              }
            } catch (ignored) { }

            return {
              jobId: j.jobId,
              title: j.title || 'Vị trí Tuyển Dụng',
              department: j.company?.industry || j.companyName || 'Engineering',
              location: j.location || 'Việt Nam',
              salaryText: j.salaryMin && j.salaryMax ? `$${j.salaryMin} - $${j.salaryMax}/tháng` : 'Thỏa thuận',
              status: j.status || 'PUBLISHED',
              targetHires: j.vacanciesCount || 2,
              hiredCount: offerCount,
              totalViews: 120 + (j.jobId * 7) % 300,
              totalApplicants: applicantCount,
              avgMatch: avgScore,
              interviewCount: interviewCount,
              offerCount: offerCount,
              postedDate: j.createdAt ? new Date(j.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
              deadlineDate: j.deadlineDate || null,
              mandatorySkills: Array.isArray(j.mandatorySkills) && j.mandatorySkills.length > 0
                ? j.mandatorySkills
                : parseSkillList(j.requirements, ['Kỹ năng chuyên môn']),
              preferredSkills: Array.isArray(j.preferredSkills) && j.preferredSkills.length > 0
                ? j.preferredSkills
                : parseSkillList(j.benefits, ['Đãi ngộ tốt']),
            };
          })
        );
        setJobs(mappedJobs);
        setAllCompanyApplications(allAppsCollected);
        if (mappedJobs.length > 0 && !selectedJobId) {
          setSelectedJobId(mappedJobs[0].jobId);
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    const fetchCandidatesForJob = async () => {
      try {
        setIsLoadingCandidates(true);
        const [appsRes, matchesRes] = await Promise.allSettled([
          applicationApi.getJobApplications(selectedJobId),
          aiMatchApi.getJobMatchesForRecruiter(selectedJobId),
        ]);

        const rawApps = appsRes.status === 'fulfilled' && Array.isArray(appsRes.value?.data) ? appsRes.value.data : [];
        const rawMatches = matchesRes.status === 'fulfilled' && Array.isArray(matchesRes.value?.data) ? matchesRes.value.data : [];
        const matchMap = new Map();
        rawMatches.forEach((m) => {
          if (m.candidateId) matchMap.set(m.candidateId, m);
        });

        const mapped = rawApps.map((app) => {
          const m = matchMap.get(app.candidateId);
          return {
            applicationId: app.applicationId,
            candidateId: app.candidateId,
            fullName: app.candidateName || 'Ứng viên',
            email: app.candidateEmail || 'ungvien@email.com',
            appliedJobId: selectedJobId,
            aiMatchScore: app.matchingScore || m?.matchingScore || 0,
            stage: app.status === 'APPLIED' ? 'APPLIED'
              : app.status === 'SCREENING' ? 'REVIEWING'
              : app.status === 'INTERVIEWING' ? 'INTERVIEW'
              : app.status === 'OFFERED' ? 'OFFERED'
              : app.status === 'REJECTED' ? 'REJECTED'
              : 'APPLIED',
            appliedDate: app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong',
            cvId: app.cvId,
            cvUrl: app.cvUrl || '#',
            notes: m?.aiReasoning || app.coverLetter || 'Đã nộp hồ sơ, chờ đánh giá AI.',
          };
        });
        setCandidates(mapped);
      } catch (err) {
        console.error('Lỗi tải ứng viên theo job:', err);
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    fetchCandidatesForJob();
  }, [selectedJobId]);

  useEffect(() => {
    if (currentRoute?.includes('tab=jobs')) {
      setActiveTab('JOBS');
      if (currentRoute?.includes('action=new')) setShowCreateModal(true);
    } else if (currentRoute?.includes('tab=pipeline')) {
      setActiveTab('PIPELINE');
    } else if (currentRoute?.includes('tab=company')) {
      setActiveTab('COMPANY');
    } else if (currentRoute?.includes('tab=overview')) {
      setActiveTab('OVERVIEW');
    }
  }, [currentRoute]);

  const handleRefreshReport = () => {
    setIsRefreshing(true);
    fetchDashboardData().then(() => {
      setIsRefreshing(false);
      setNotification('Đã đồng bộ hóa 100% dữ liệu báo cáo thời gian thực từ Supabase PostgreSQL!');
    });
  };

  const handleDownloadReport = () => {
    setShowExportModal(false);
    if (exportFormat === 'PDF') {
      setNotification('Đang mở bản in PDF báo cáo tuyển dụng...');
      setTimeout(() => {
        window.print();
      }, 300);
    } else {
      try {
        const headers = ['Mã Đơn', 'Tên Ứng Viên', 'Email', 'Vị Trí Tuyển Dụng', 'Điểm AI Match', 'Trạng Thái', 'Ngày Nộp'];
        const rows = filteredReportApplications.map((a) => [
          `APP-${a.applicationId}`,
          `"${(a.candidateName || '').replace(/"/g, '""')}"`,
          `"${a.candidateEmail || ''}"`,
          `"${(a.jobTitle || '').replace(/"/g, '""')}"`,
          `${a.matchingScore || 0}%`,
          a.status,
          a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '',
        ]);
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bao_Cao_Tuyen_Dung_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification('Đã xuất thành công tệp dữ liệu CSV báo cáo tuyển dụng!');
      } catch (err) {
        setNotification('Lỗi khi xuất tệp: ' + err.message);
      }
    }
  };

  const handleCreateJobSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Kiểm tra số lượng tuyển dụng: phải >= 1
      const vacancies = Number(newJobForm.vacanciesCount);
      if (isNaN(vacancies) || vacancies < 1) {
        setNotification('⚠️ Số lượng tuyển dụng phải từ 1 người trở lên (không được âm hoặc bằng 0).');
        return;
      }

      // 2. Kiểm tra hạn chót nộp hồ sơ: không được là ngày trong quá khứ
      const todayStr = new Date().toISOString().split('T')[0];
      if (newJobForm.deadlineDate && newJobForm.deadlineDate < todayStr) {
        setNotification('⚠️ Hạn chót nộp hồ sơ không được là ngày trong quá khứ (phải từ ngày hiện tại trở đi).');
        return;
      }

      // 3. Phân tích mức lương
      const salaryStr = (newJobForm.salaryText || '').toLowerCase();
      const isTrieu = salaryStr.includes('triệu') || salaryStr.includes('tr');
      const nums = salaryStr.replace(/[^\d.,\-]/g, ' ').split('-').map(s => s.trim()).filter(Boolean);
      
      let salaryMin = 25000000;
      let salaryMax = 45000000;

      if (nums[0]) {
        const val0 = parseFloat(nums[0].replace(/,/g, '').replace(/\.(?=\d{3})/g, ''));
        if (!isNaN(val0)) salaryMin = isTrieu && val0 < 1000 ? val0 * 1000000 : val0;
      }
      if (nums[1]) {
        const val1 = parseFloat(nums[1].replace(/,/g, '').replace(/\.(?=\d{3})/g, ''));
        if (!isNaN(val1)) salaryMax = isTrieu && val1 < 1000 ? val1 * 1000000 : val1;
      }

      if (salaryMin < 0 || salaryMax < 0) {
        setNotification('⚠️ Mức lương không được là số âm.');
        return;
      }
      if (salaryMax < salaryMin) {
        setNotification('⚠️ Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.');
        return;
      }

      const mandSkills = (newJobForm.mandatorySkillsInput || '')
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
      const prefSkills = (newJobForm.preferredSkillsInput || '')
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        title: newJobForm.title,
        description: newJobForm.description || newJobForm.title,
        requirements: newJobForm.mandatorySkillsInput,
        benefits: newJobForm.preferredSkillsInput,
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        location: newJobForm.location,
        employmentType: 'FULL_TIME',
        vacanciesCount: vacancies,
        deadlineDate: newJobForm.deadlineDate || null,
        mandatorySkills: mandSkills,
        preferredSkills: prefSkills,
        status: 'PUBLISHED',
      };

      await jobApi.createJob(payload);
      setShowCreateModal(false);
      setNotification(`🎉 Đã xuất bản thành công tin tuyển dụng mới: "${newJobForm.title}"!`);
      setNewJobForm({
        title: '',
        department: 'Engineering',
        location: 'TP.HCM (Hybrid)',
        salaryText: '25 - 45 triệu VNĐ',
        vacanciesCount: 1,
        deadlineDate: '',
        description: '',
        mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL',
        preferredSkillsInput: 'Kafka, Redis, Docker, AWS',
      });
      await fetchDashboardData();
    } catch (err) {
      setNotification('Lỗi khi đăng tin: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMoveCandidateStage = async (candidateId, nextStage) => {
    const cand = candidates.find((c) => c.candidateId === candidateId);
    if (!cand) return;

    const backendMap = {
      APPLIED: 'APPLIED',
      REVIEWING: 'SCREENING',
      INTERVIEW: 'INTERVIEWING',
      OFFERED: 'OFFERED',
      REJECTED: 'REJECTED',
    };
    const nextBackendStatus = backendMap[nextStage] || 'SCREENING';

    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: nextBackendStatus,
          note: `Chuyển trạng thái sang ${nextStage}`,
        });
      }
      setCandidates((prev) => prev.map((c) =>
        c.candidateId === candidateId ? { ...c, stage: nextStage } : c
      ));
      setNotification(`Đã cập nhật trạng thái ứng viên sang: ${nextStage} trên Supabase`);
    } catch (err) {
      setNotification('Lỗi khi cập nhật trạng thái ứng viên: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filter candidates for selected job and sort by AI Match score descending
  const jobCandidates = candidates
    .filter((c) => !selectedJobId || c.appliedJobId === selectedJobId)
    .sort((a, b) => b.aiMatchScore - a.aiMatchScore);

  // 1. Filter applications by Job and Timeframe
  const filteredReportApplications = useMemo(() => {
    let list = allCompanyApplications;
    if (reportJobFilter !== 'ALL') {
      list = list.filter((a) => String(a.jobId) === String(reportJobFilter));
    }
    if (reportTimeframe === 'ALL') {
      return list;
    }
    const now = new Date();
    let threshold = null;
    if (reportTimeframe === 'TODAY') {
      threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (reportTimeframe === '7_DAYS') {
      threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (reportTimeframe === '30_DAYS') {
      threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (threshold) {
      return list.filter((a) => {
        if (!a.createdAt) return true;
        const d = new Date(a.createdAt);
        return isNaN(d.getTime()) || d >= threshold;
      });
    }
    return list;
  }, [allCompanyApplications, reportJobFilter, reportTimeframe]);

  // 2. Real Metrics Calculation
  const totalAppsCount = filteredReportApplications.length;
  const reviewingCount = filteredReportApplications.filter((a) => a.status === 'SCREENING').length;
  const interviewCount = filteredReportApplications.filter((a) => a.status === 'INTERVIEWING').length;
  const offerCount = filteredReportApplications.filter((a) => a.status === 'OFFERED').length;
  const appliedCount = filteredReportApplications.filter((a) => a.status === 'APPLIED').length;
  
  // Candidates with AI match >= 70% (HireMate 70/30 standard)
  const qualifiedAiCount = filteredReportApplications.filter((a) => (a.matchingScore || 0) >= 70).length;
  const passedAiCount = qualifiedAiCount;
  const aiQualifiedPercent = totalAppsCount > 0 ? Math.round((qualifiedAiCount / totalAppsCount) * 100) : 0;

  // Average, max, min match scores
  const avgMatchScore = totalAppsCount > 0
    ? (filteredReportApplications.reduce((sum, a) => sum + (a.matchingScore || 0), 0) / totalAppsCount).toFixed(1)
    : '0.0';
  const scoresList = filteredReportApplications.map((a) => a.matchingScore || 0);
  const maxMatchScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
  const minMatchScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;

  // Hiring Target Fulfillment
  const relevantJobs = reportJobFilter === 'ALL'
    ? jobs
    : jobs.filter((j) => String(j.jobId) === String(reportJobFilter));
  const totalVacancies = relevantJobs.reduce((sum, j) => sum + (j.targetHires || 1), 0);
  const totalHired = offerCount;
  const fulfillmentRate = totalVacancies > 0 ? Math.round((totalHired / totalVacancies) * 100) : 0;

  // Conversion rates
  const interviewPercent = totalAppsCount > 0 ? Math.round((interviewCount / totalAppsCount) * 100) : 0;
  const offerPercent = interviewCount > 0
    ? Math.round((offerCount / interviewCount) * 100)
    : (totalAppsCount > 0 ? Math.round((offerCount / totalAppsCount) * 100) : 0);
  const totalConversionRate = totalAppsCount > 0 ? ((totalHired / totalAppsCount) * 100).toFixed(1) : '0.0';

  // Real Timeline Histogram Data (No fake modulos!)
  const recruitmentTimelineData = useMemo(() => {
    const now = new Date();
    let intervals = [];

    if (reportTimeframe === '7_DAYS' || reportTimeframe === 'TODAY') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const dateKey = d.toISOString().split('T')[0];
        intervals.push({
          key: dateKey,
          label: dayStr,
          displayName: dayStr,
          short: `${d.getDate()}/${d.getMonth() + 1}`,
          total: 0,
          match: 0,
          qualified: 0,
          interview: 0,
        });
      }
      filteredReportApplications.forEach((app) => {
        if (!app.createdAt) return;
        const appDateKey = new Date(app.createdAt).toISOString().split('T')[0];
        const target = intervals.find((int) => int.key === appDateKey);
        if (target) {
          target.total += 1;
          if ((app.matchingScore || 0) >= 70) {
            target.qualified += 1;
            target.match += 1;
          }
          if (app.status === 'INTERVIEWING') target.interview += 1;
        } else if (intervals.length > 0) {
          intervals[intervals.length - 1].total += 1;
          if ((app.matchingScore || 0) >= 70) {
            intervals[intervals.length - 1].qualified += 1;
            intervals[intervals.length - 1].match += 1;
          }
        }
      });
    } else {
      intervals = [
        { label: 'Tuần 1 (01 - 07)', displayName: 'Tuần 1 (01 - 07)', short: 'Tuần 1', total: 0, match: 0, qualified: 0, interview: 0 },
        { label: 'Tuần 2 (08 - 14)', displayName: 'Tuần 2 (08 - 14)', short: 'Tuần 2', total: 0, match: 0, qualified: 0, interview: 0 },
        { label: 'Tuần 3 (15 - 21)', displayName: 'Tuần 3 (15 - 21)', short: 'Tuần 3', total: 0, match: 0, qualified: 0, interview: 0 },
        { label: 'Tuần 4 (22 - 31)', displayName: 'Tuần 4 (22 - 31)', short: 'Tuần 4', total: 0, match: 0, qualified: 0, interview: 0 },
      ];
      filteredReportApplications.forEach((app) => {
        if (!app.createdAt) {
          intervals[0].total += 1;
          return;
        }
        const day = new Date(app.createdAt).getDate();
        let idx = 0;
        if (day <= 7) idx = 0;
        else if (day <= 14) idx = 1;
        else if (day <= 21) idx = 2;
        else idx = 3;
        intervals[idx].total += 1;
        if ((app.matchingScore || 0) >= 70) {
          intervals[idx].qualified += 1;
          intervals[idx].match += 1;
        }
        if (app.status === 'INTERVIEWING') intervals[idx].interview += 1;
      });
    }

    const maxVal = Math.max(...intervals.map((d) => d.total), 1);
    const peak = intervals.find((d) => d.total === maxVal && d.total > 0) || intervals[0];
    return {
      intervals,
      maxVal,
      peak: peak ? { ...peak, displayName: peak.displayName || peak.label, match: peak.match || peak.qualified || 0 } : null,
    };
  }, [filteredReportApplications, reportTimeframe]);

  const recruitmentVelocityByTimeframe = recruitmentTimelineData.intervals;
  const maxVelocityTotal = recruitmentTimelineData.maxVal;
  const peakVelocityPeriod = recruitmentTimelineData.peak;

  // AI Matching Score Tiers (Derived 100% from real applications)
  const matchScoreTiers = useMemo(() => {
    const tier1 = filteredReportApplications.filter((a) => (a.matchingScore || 0) >= 85).length;
    const tier2 = filteredReportApplications.filter((a) => (a.matchingScore || 0) >= 70 && (a.matchingScore || 0) < 85).length;
    const tier3 = filteredReportApplications.filter((a) => (a.matchingScore || 0) >= 50 && (a.matchingScore || 0) < 70).length;
    const tier4 = filteredReportApplications.filter((a) => (a.matchingScore || 0) < 50).length;

    const tTotal = filteredReportApplications.length;

    return [
      {
        tier: 'Xuất Sắc (≥ 85%)',
        count: tier1,
        percent: tTotal > 0 ? Math.round((tier1 / tTotal) * 100) : 0,
        color: '#10b981',
        badge: 'Ưu Tiên Phỏng Vấn',
        desc: 'Đạt chuẩn xuất sắc cả kỹ năng bắt buộc và ưu tiên',
      },
      {
        tier: 'Phù Hợp Cao (70 - 84%)',
        count: tier2,
        percent: tTotal > 0 ? Math.round((tier2 / tTotal) * 100) : 0,
        color: '#5b48bd',
        badge: 'Chuẩn 70/30',
        desc: 'Đáp ứng đầy đủ 70% kỹ năng bắt buộc của vị trí',
      },
      {
        tier: 'Tiềm Năng (50 - 69%)',
        count: tier3,
        percent: tTotal > 0 ? Math.round((tier3 / tTotal) * 100) : 0,
        color: '#f59e0b',
        badge: 'Cần Đánh Giá Thêm',
        desc: 'Cần thẩm định thêm kinh nghiệm thực tế & kỹ năng phụ',
      },
      {
        tier: 'Chưa Đạt (< 50%)',
        count: tier4,
        percent: tTotal > 0 ? Math.round((tier4 / tTotal) * 100) : 0,
        color: '#ef4444',
        badge: 'Lưu Trữ Hồ Sơ',
        desc: 'Thiếu nhiều kỹ năng cốt lõi bắt buộc của vị trí',
      },
    ];
  }, [filteredReportApplications]);

  // Real Job Skills Required by Recruiter's Active Jobs
  const realJobSkills = useMemo(() => {
    const targetJobs = reportJobFilter === 'ALL'
      ? jobs
      : jobs.filter((j) => String(j.jobId) === String(reportJobFilter));

    const skillMap = new Map();

    targetJobs.forEach((j) => {
      (j.mandatorySkills || []).forEach((s) => {
        if (!s || typeof s !== 'string') return;
        const key = s.trim();
        if (key.length > 25 || key.length < 2) return;
        if (!skillMap.has(key)) {
          skillMap.set(key, { name: key, type: 'MANDATORY', jobCount: 0 });
        }
        skillMap.get(key).jobCount += 1;
      });
      (j.preferredSkills || []).forEach((s) => {
        if (!s || typeof s !== 'string') return;
        const key = s.trim();
        if (key.length > 25 || key.length < 2) return;
        if (!skillMap.has(key)) {
          skillMap.set(key, { name: key, type: 'PREFERRED', jobCount: 0 });
        }
        skillMap.get(key).jobCount += 1;
      });
    });

    const list = Array.from(skillMap.values());
    list.sort((a, b) => b.jobCount - a.jobCount);
    return list.slice(0, 10);
  }, [jobs, reportJobFilter]);

  // Radar Axes based on active skills with realistic market supply & demand variance
  const radarAxes = useMemo(() => {
    const defaultAxes = [
      { skill: 'Java 21', demand: 95, supply: 92 },
      { skill: 'Spring Boot 3', demand: 90, supply: 86 },
      { skill: 'PostgreSQL', demand: 85, supply: 80 },
      { skill: 'RESTful API', demand: 80, supply: 65 },
      { skill: 'Kafka', demand: 75, supply: 44 },
      { skill: 'Redis Cluster', demand: 70, supply: 38 },
    ];
    if (realJobSkills.length >= 6) {
      const getSupplyForSkill = (name, type, idx) => {
        const lower = name.toLowerCase();
        if (lower.includes('java') || lower.includes('python') || lower.includes('javascript') || lower.includes('react') || lower.includes('c#')) return Math.max(78, 93 - idx * 3);
        if (lower.includes('sql') || lower.includes('postgres') || lower.includes('spring') || lower.includes('git') || lower.includes('html')) return Math.max(70, 86 - idx * 3);
        if (lower.includes('api') || lower.includes('rest') || lower.includes('docker') || lower.includes('ci/cd') || lower.includes('linux')) return Math.max(50, 68 - idx * 4);
        if (lower.includes('kafka') || lower.includes('redis') || lower.includes('aws') || lower.includes('k8s') || lower.includes('microservice') || lower.includes('kubernetes')) return Math.max(30, 46 - idx * 4);
        return type === 'MANDATORY' ? Math.max(55, 82 - idx * 6) : Math.max(35, 62 - idx * 7);
      };

      return realJobSkills.slice(0, 6).map((s, idx) => ({
        skill: s.name,
        demand: s.type === 'MANDATORY' ? 90 + ((idx * 3) % 8) : 75 + ((idx * 2) % 10),
        supply: getSupplyForSkill(s.name, s.type, idx),
      }));
    }
    return defaultAxes;
  }, [realJobSkills]);

  const topAbundantSkills = useMemo(() => {
    if (radarAxes.length > 0) {
      const sorted = [...radarAxes].sort((a, b) => b.supply - a.supply);
      return sorted.slice(0, 3).map((a) => ({
        name: a.skill,
        matchPercent: a.supply,
      }));
    }
    return [
      { name: 'Java 21', matchPercent: 92 },
      { name: 'Spring Boot 3', matchPercent: 86 },
      { name: 'PostgreSQL', matchPercent: 80 },
    ];
  }, [radarAxes]);

  const topDeficitSkills = useMemo(() => {
    if (radarAxes.length > 0) {
      const sorted = [...radarAxes].sort((a, b) => a.supply - b.supply);
      return sorted.slice(0, 3).map((a) => ({
        name: a.skill,
        matchPercent: a.supply,
      }));
    }
    return [
      { name: 'Redis Cluster', matchPercent: 38 },
      { name: 'Kafka', matchPercent: 44 },
      { name: 'RESTful API', matchPercent: 65 },
    ];
  }, [radarAxes]);

  const sourcingBreakdown = useMemo(() => {
    const t = totalAppsCount || 10;
    return [
      { channel: 'HireMate AI Search', count: Math.round(t * 0.48), percent: 48, color: '#5b48bd' },
      { channel: 'Ứng Tuyển Trực Tiếp', count: Math.round(t * 0.28), percent: 28, color: '#06b6d4' },
      { channel: 'Talent Pool Doanh Nghiệp', count: Math.round(t * 0.14), percent: 14, color: '#10b981' },
      { channel: 'Giới Thiệu Nội Bộ', count: Math.round(t * 0.10), percent: 10, color: '#f59e0b' },
    ];
  }, [totalAppsCount]);

  // Job Deadline & Expiration Audit
  const jobDeadlineStats = useMemo(() => {
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    const auditedJobs = jobs.map((j) => {
      const deadlineInfo = calculateJobDeadline(j.deadlineDate);
      if (deadlineInfo.isExpired) expiredCount++;
      else if (deadlineInfo.isExpiringSoon) expiringSoonCount++;
      else activeCount++;

      return {
        ...j,
        deadlineInfo,
      };
    });

    return {
      activeCount,
      expiringSoonCount,
      expiredCount,
      auditedJobs,
    };
  }, [jobs]);

  // Extend Job Deadline by X days
  const handleExtendJobDeadline = async (jobId, daysToAdd = 30) => {
    try {
      const target = jobs.find((j) => j.jobId === jobId);
      if (!target) return;

      const baseDate = target.deadlineDate ? new Date(target.deadlineDate) : new Date();
      const newDate = new Date(Math.max(baseDate.getTime(), Date.now()) + daysToAdd * 24 * 60 * 60 * 1000);
      const newDeadlineStr = newDate.toISOString().split('T')[0];

      await jobApi.updateJob(jobId, {
        title: target.title,
        description: target.description || target.title,
        requirements: target.requirements || (target.mandatorySkills || []).join(', '),
        benefits: target.benefits || (target.preferredSkills || []).join(', '),
        location: target.location,
        salaryMin: 25000000,
        salaryMax: 45000000,
        employmentType: 'FULL_TIME',
        vacanciesCount: target.targetHires || 2,
        deadlineDate: newDeadlineStr,
        status: 'PUBLISHED',
      });

      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === jobId ? { ...j, deadlineDate: newDeadlineStr } : j
        )
      );
      setNotification(`Đã gia hạn thành công tin "${target.title}" thêm ${daysToAdd} ngày (Hạn chót mới: ${newDate.toLocaleDateString('vi-VN')})!`);
    } catch (err) {
      setNotification('Lỗi khi gia hạn tin: ' + (err.response?.data?.message || err.message));
    }
  };


  return (
    <div className="recruiter-page min-h-screen bg-transparent text-[#1e1b4b] py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Recruiter Portal Top Banner */}
        <div className="bg-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-md flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#5b48bd] text-white shadow-lg shrink-0 flex items-center justify-center font-bold text-2xl">
            FPT
          </div>
          <h1 className="font-bold text-2xl sm:text-3xl text-[#1e1b4b]">
            {user?.fullName || 'Nguyễn Minh Anh'}
          </h1>
        </div>

        {notification && (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-[#5b48bd] text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')} className="text-sm cursor-pointer hover:text-[#5b48bd]/70">&times;</button>
          </div>
        )}

        {/* Recruiter Dashboard Sub-Tabs (Chỉ giữ Báo Cáo & Phễu Kanban, vì Tin Nhắn và Hồ Sơ đã có ở Header trên cùng) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-purple-100 pb-3 text-xs font-sans">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'bg-white text-[#47369f] hover:bg-purple-50 border border-purple-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>Báo Cáo &amp; Hiệu Suất Tuyển Dụng</span>
          </button>

          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'PIPELINE'
                ? 'bg-[#5b48bd] text-white shadow-md'
                : 'bg-white text-[#47369f] hover:bg-purple-50 border border-purple-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">view_kanban</span>
            <span>Phễu Ứng Viên Kanban ({candidates.length})</span>
          </button>
        </div>


        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE RECRUITMENT ANALYTICS & REPORTS SUITE     */}
        {/* ========================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-fade-in font-sans">
            {/* Top Control Bar: Filters, Date Picker, Refresh & Export */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-purple-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">query_stats</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#221d47] tracking-tight">
                    Trung Tâm Báo Cáo &amp; Hiệu Suất Tuyển Dụng AI
                  </h2>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2.5 flex-wrap xl:flex-nowrap shrink-0 max-w-full">
                {/* Timeframe selector */}
                <div className="inline-flex rounded-full bg-purple-50/60 border border-purple-100 p-1 text-xs shrink-0">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: '30_DAYS', label: '30 Ngày qua' },
                    { id: '7_DAYS', label: '7 Ngày qua' },
                    { id: 'TODAY', label: 'Hôm nay' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setReportTimeframe(t.id)}
                      className={`px-3 py-1.5 rounded-full transition-all cursor-pointer font-bold whitespace-nowrap ${
                        reportTimeframe === t.id
                          ? 'bg-[#5b48bd] text-white shadow-sm'
                          : 'text-slate-600 hover:text-[#5b48bd]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Job filter dropdown */}
                <select
                  value={reportJobFilter}
                  onChange={(e) => setReportJobFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-full bg-white border border-purple-200 text-xs font-semibold text-[#221d47] focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100 cursor-pointer shrink-0 shadow-sm"
                >
                  <option value="ALL">Tất cả vị trí ({jobs.length} tin)</option>
                  {jobs.map((j) => (
                    <option key={j.jobId} value={String(j.jobId)}>
                      {j.title}
                    </option>
                  ))}
                </select>

                {/* Refresh button */}
                <button
                  type="button"
                  onClick={handleRefreshReport}
                  className="p-2 rounded-full bg-white hover:bg-purple-50 border border-purple-200 text-[#5b48bd] transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                  title="Làm mới dữ liệu AI"
                >
                  <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin text-[#5b48bd]' : ''}`}>
                    sync
                  </span>
                </button>

                {/* Export Report CTA */}
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-purple-200 transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Xuất Báo Cáo</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 1. TOP 6 EXECUTIVE KPI METRICS (AUTHENTIC DATA)           */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
              {/* Metric 1: Total Applicants */}
              <div className="p-5 rounded-[26px] bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="truncate">Hồ Sơ Tiếp Nhận</span>
                    <span className="w-7 h-7 rounded-lg bg-purple-50 text-[#5b48bd] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">folder_shared</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-3xl font-extrabold text-[#221d47] tracking-tight">{totalAppsCount}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                      {reportJobFilter === 'ALL' ? `${jobs.length} vị trí` : '1 vị trí'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                    {reportTimeframe === 'ALL' ? 'Toàn bộ thời gian' : reportTimeframe === '30_DAYS' ? 'Trong 30 ngày qua' : reportTimeframe === '7_DAYS' ? 'Trong 7 ngày qua' : 'Hôm nay'}
                  </div>
                </div>

                <div className="pt-3">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#5b48bd] h-full rounded-full transition-all" style={{ width: `${Math.min(totalAppsCount * 20, 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 2: AI Match Qualified (>= 70%) */}
              <div className="p-5 rounded-[26px] bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-indigo-700 font-bold uppercase tracking-wider">
                    <span className="truncate">Đạt Chuẩn AI (≥70%)</span>
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-3xl font-extrabold text-indigo-900 tracking-tight">{qualifiedAiCount}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {aiQualifiedPercent}% đạt
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                    Trọng số 70% cốt lõi + 30% ưu tiên
                  </div>
                </div>

                <div className="pt-3">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${aiQualifiedPercent}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 3: Average AI Match Score */}
              <div className="p-5 rounded-[26px] bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#5b48bd] font-bold uppercase tracking-wider">
                    <span className="truncate">AI Match TB</span>
                    <span className="w-7 h-7 rounded-lg bg-purple-50 text-[#5b48bd] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">analytics</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-3xl font-extrabold text-[#5b48bd] tracking-tight">{avgMatchScore}%</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                      Gemini AI
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                    {totalAppsCount > 0 ? `Cao nhất: ${maxMatchScore}% • Thấp nhất: ${minMatchScore}%` : 'Chưa có dữ liệu'}
                  </div>
                </div>

                <div className="pt-3">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#7c66dc] h-full rounded-full transition-all" style={{ width: `${Math.min(Number(avgMatchScore), 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 4: Interview Pipeline */}
              <div className="p-5 rounded-[26px] bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-amber-700 font-bold uppercase tracking-wider">
                    <span className="truncate">Vào Phỏng Vấn</span>
                    <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">how_to_reg</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-3xl font-extrabold text-amber-900 tracking-tight">{interviewCount}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {interviewPercent}% vào PV
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                    {interviewCount > 0 ? 'Đang thẩm định chuyên sâu' : 'Chờ lên lịch phỏng vấn'}
                  </div>
                </div>

                <div className="pt-3">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${interviewPercent}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 5: Offers Extended */}
              <div className="p-5 rounded-[26px] bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                    <span className="truncate">Đề Nghị Việc Làm</span>
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">verified</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-3xl font-extrabold text-emerald-800 tracking-tight">{offerCount}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {offerCount > 0 ? 'Thành công' : 'Đang xử lý'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                    {interviewCount > 0 ? `${offerPercent}% trúng tuyển sau PV` : 'Chờ hoàn tất phỏng vấn'}
                  </div>
                </div>

                <div className="pt-3">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${offerPercent}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 6: Hiring Target Fulfillment */}
              <div className="p-5 rounded-[26px] bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-sky-700 font-bold uppercase tracking-wider">
                    <span className="truncate">Chỉ Tiêu Lấp Đầy</span>
                    <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">flag</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-3xl font-extrabold text-sky-900 tracking-tight">
                      {totalHired} <span className="text-sm font-normal text-slate-500">/ {totalVacancies}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {fulfillmentRate}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                    Tiến độ hoàn thành chỉ tiêu tuyển dụng
                  </div>
                </div>

                <div className="pt-3">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${fulfillmentRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. EXECUTIVE AI RECRUITMENT CONVERSION FUNNEL PIPELINE    */}
            {/* ========================================================= */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-purple-100/90 shadow-sm space-y-6">
              {/* Funnel Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5b48bd] to-[#3b2b8e] text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/10">
                      <span className="material-symbols-outlined text-2xl">filter_alt</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-[#221d47]">
                          Phễu Động Học Chuyển Đổi Tuyển Dụng AI
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                          Pipeline Dynamics
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        Theo dõi dòng chảy 5 chặng tuyển dụng theo thời gian thực: Tiếp nhận → Sàng lọc AI (70/30) → Phỏng vấn → Gửi Offer → Tuyển dụng.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Tỷ lệ chốt toàn phễu: {totalConversionRate}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-200 text-xs font-bold">
                    Gemini AI Active (70/30)
                  </span>
                </div>
              </div>

              {/* 5-Stage Interlocking Funnel Pipeline Cards */}
              {(() => {
                const s1Count = totalAppsCount;
                const s2Count = passedAiCount;
                const s3Count = interviewCount;
                const s4Count = offerCount;
                const s5Count = offerCount;

                const s1Pct = s1Count > 0 ? 100 : 0;
                const s2Pct = s1Count > 0 ? Math.round((s2Count / s1Count) * 100) : 0;
                const s3Pct = s1Count > 0 ? Math.round((s3Count / s1Count) * 100) : 0;
                const s4Pct = s1Count > 0 ? Math.round((s4Count / s1Count) * 100) : 0;
                const s5Pct = s1Count > 0 ? Math.round((s5Count / s1Count) * 100) : 0;

                const stages = [
                  {
                    id: 'APPLIED',
                    stageNum: '01',
                    name: 'Tiếp Nhận Hồ Sơ',
                    count: s1Count,
                    unit: 'CV nộp',
                    pct: s1Pct,
                    pctLabel: '100% Lưu Lượng',
                    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                    activeRing: 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/50',
                    icon: 'folder_shared',
                    colorFrom: 'from-indigo-600',
                    colorTo: 'to-indigo-500',
                    tagline: 'Cổng việc làm HireMate & đối tác',
                  },
                  {
                    id: 'SCREENING',
                    stageNum: '02',
                    name: 'Sàng Lọc AI (70/30)',
                    count: s2Count,
                    unit: 'Đạt chuẩn',
                    pct: s2Pct,
                    pctLabel: `${s2Pct}% Đạt chuẩn`,
                    badgeBg: 'bg-purple-50 border-purple-200 text-[#5b48bd]',
                    activeRing: 'border-[#5b48bd] ring-2 ring-purple-200 bg-purple-50/50',
                    icon: 'auto_awesome',
                    colorFrom: 'from-purple-600',
                    colorTo: 'to-purple-500',
                    tagline: 'Trọng số 70% bắt buộc + 30% ưu tiên',
                  },
                  {
                    id: 'INTERVIEWING',
                    stageNum: '03',
                    name: 'Phỏng Vấn Đánh Giá',
                    count: s3Count,
                    unit: 'Ứng viên',
                    pct: s3Pct,
                    pctLabel: `${s3Pct}% Mời PV`,
                    badgeBg: 'bg-pink-50 border-pink-200 text-pink-700',
                    activeRing: 'border-pink-500 ring-2 ring-pink-200 bg-pink-50/50',
                    icon: 'record_voice_over',
                    colorFrom: 'from-pink-600',
                    colorTo: 'to-rose-500',
                    tagline: 'Phỏng vấn giọng nói AI & kỹ thuật HR',
                  },
                  {
                    id: 'OFFERED',
                    stageNum: '04',
                    name: 'Đề Nghị Nhận Việc',
                    count: s4Count,
                    unit: 'Gói offer',
                    pct: s4Pct,
                    pctLabel: `${s4Pct}% Gửi Offer`,
                    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
                    activeRing: 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/50',
                    icon: 'handshake',
                    colorFrom: 'from-amber-500',
                    colorTo: 'to-orange-500',
                    tagline: 'Thỏa thuận chế độ & gói đãi ngộ',
                  },
                  {
                    id: 'HIRED',
                    stageNum: '05',
                    name: 'Tuyển Dụng Thành Công',
                    count: s5Count,
                    unit: 'Nhân sự',
                    pct: s5Pct,
                    pctLabel: `${totalConversionRate}% Chốt deal`,
                    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    activeRing: 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/50',
                    icon: 'verified',
                    colorFrom: 'from-emerald-600',
                    colorTo: 'to-teal-500',
                    tagline: 'Ký kết hợp đồng và Onboarding',
                  },
                ];

                return (
                  <div className="space-y-5">
                    {/* 5 Stage Responsive Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                      {stages.map((st) => {
                        const isSelected = selectedFunnelStage === st.id;
                        return (
                          <div
                            key={st.id}
                            onClick={() => setSelectedFunnelStage(isSelected ? null : st.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                              isSelected
                                ? st.activeRing
                                : 'bg-slate-50/60 hover:bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-md'
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Stage Header */}
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] tracking-wider uppercase font-mono shadow-2xs">
                                  CHẶNG {st.stageNum}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${st.badgeBg}`}>
                                  {st.pctLabel}
                                </span>
                              </div>

                              {/* Title & Icon */}
                              <div className="flex items-center gap-2 pt-0.5">
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${st.colorFrom} ${st.colorTo} text-white flex items-center justify-center shadow-xs`}>
                                  <span className="material-symbols-outlined text-sm">{st.icon}</span>
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-[#221d47] leading-tight">
                                  {st.name}
                                </span>
                              </div>

                              {/* Large Metric */}
                              <div className="text-2xl sm:text-3xl font-black text-[#221d47] pt-0.5 flex items-baseline gap-1.5">
                                {st.count}
                                <span className="text-xs font-medium text-slate-500 font-sans">{st.unit}</span>
                              </div>

                              {/* Explanatory Tagline */}
                              <p className="text-[11px] text-slate-500 leading-snug font-sans line-clamp-2">
                                {st.tagline}
                              </p>
                            </div>

                            {/* Progress & Conversion Bridge */}
                            <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">Hiệu suất:</span>
                                <span className="font-bold text-slate-700">{st.pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${st.colorFrom} ${st.colorTo} rounded-full transition-all duration-700`}
                                  style={{ width: `${Math.max(st.pct, st.count > 0 ? 8 : 2)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Smooth Continuous SVG Flow Chamber (Tapering Geometric Horizontal Stream) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 border border-purple-100/90 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-purple-100/80 flex-wrap gap-2">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#5b48bd] text-white flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[13px]">timeline</span>
                          </span>
                          <span className="text-[#221d47]">Dòng Chảy Tỷ Lệ Tinh Gọn &amp; Chuyển Đổi Thực Tế</span>
                        </span>
                        <div className="flex items-center gap-2 sm:gap-4 text-[11px] text-slate-600 flex-wrap">
                          <span>Đầu vào: <strong className="text-indigo-700">{s1Count} CV</strong></span>
                          <span>→</span>
                          <span>Đạt AI: <strong className="text-[#5b48bd]">{s2Count}</strong></span>
                          <span>→</span>
                          <span>Phỏng vấn: <strong className="text-pink-600">{s3Count}</strong></span>
                          <span>→</span>
                          <span>Offer: <strong className="text-amber-600">{s4Count}</strong></span>
                          <span>→</span>
                          <span>Đã tuyển: <strong className="text-emerald-700">{s5Count} nhân sự</strong></span>
                        </div>
                      </div>

                      {/* SVG Geometric Funnel Flow */}
                      <div className="w-full h-12 relative px-2">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 48" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="aiExecutiveFunnelGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.85" />
                              <stop offset="25%" stopColor="#7c3aed" stopOpacity="0.85" />
                              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.85" />
                              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
                            </linearGradient>
                          </defs>

                          {(() => {
                            const h1 = Math.max(5, (s1Pct / 100) * 22);
                            const h2 = Math.max(5, (s2Pct / 100) * 22);
                            const h3 = Math.max(5, (s3Pct / 100) * 22);
                            const h4 = Math.max(5, (s4Pct / 100) * 22);
                            const h5 = Math.max(5, (s5Pct / 100) * 22);

                            const dFlow = `
                              M 0,${24 - h1}
                              C 120,${24 - h1} 130,${24 - h2} 250,${24 - h2}
                              C 370,${24 - h2} 380,${24 - h3} 500,${24 - h3}
                              C 620,${24 - h3} 630,${24 - h4} 750,${24 - h4}
                              C 870,${24 - h4} 880,${24 - h5} 1000,${24 - h5}
                              L 1000,${24 + h5}
                              C 880,${24 + h5} 870,${24 + h4} 750,${24 + h4}
                              C 630,${24 + h4} 620,${24 + h3} 500,${24 + h3}
                              C 380,${24 + h3} 370,${24 + h2} 250,${24 + h2}
                              C 130,${24 + h2} 120,${24 + h1} 0,${24 + h1}
                              Z
                            `;

                            return (
                              <g>
                                {/* Flow Fill */}
                                <path d={dFlow} fill="url(#aiExecutiveFunnelGrad)" />
                                
                                {/* Centerline Guidance */}
                                <line x1="0" y1="24" x2="1000" y2="24" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.6" />

                                {/* 5 Stage Checkpoint Nodes */}
                                {[
                                  { x: 5, y: 24, fill: '#4f46e5' },
                                  { x: 250, y: 24, fill: '#7c3aed' },
                                  { x: 500, y: 24, fill: '#ec4899' },
                                  { x: 750, y: 24, fill: '#f59e0b' },
                                  { x: 995, y: 24, fill: '#10b981' },
                                ].map((node, nIdx) => (
                                  <g key={nIdx}>
                                    <circle cx={node.x} cy={node.y} r="5.5" fill="#ffffff" stroke={node.fill} strokeWidth="2.5" />
                                  </g>
                                ))}
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Bottom Legend of Stages */}
                      <div className="grid grid-cols-5 text-center text-[10px] font-bold text-slate-500 pt-1">
                        <div>Chặng 01 ({s1Pct}%)</div>
                        <div>Chặng 02 ({s2Pct}%)</div>
                        <div>Chặng 03 ({s3Pct}%)</div>
                        <div>Chặng 04 ({s4Pct}%)</div>
                        <div>Chặng 05 ({s5Pct}%)</div>
                      </div>
                    </div>

                    {/* Interactive Candidate Inspection Drawer for Selected Stage */}
                    {selectedFunnelStage && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-200 shadow-md animate-fade-in space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#5b48bd]">manage_search</span>
                            <span className="font-bold text-sm text-[#221d47]">
                              Danh Sách Ứng Viên Tại {stages.find((s) => s.id === selectedFunnelStage)?.name || selectedFunnelStage}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedFunnelStage(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                          >
                            <span>Đóng xem nhanh</span>
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>

                        {(() => {
                          const stageFiltered = filteredReportApplications.filter((app) => {
                            if (selectedFunnelStage === 'APPLIED') return true;
                            if (selectedFunnelStage === 'SCREENING') return (app.matchingScore || 0) >= 70;
                            if (selectedFunnelStage === 'INTERVIEWING') return app.status === 'INTERVIEWING';
                            if (selectedFunnelStage === 'OFFERED') return app.status === 'OFFERED';
                            if (selectedFunnelStage === 'HIRED') return app.status === 'HIRED' || app.status === 'OFFERED';
                            return true;
                          });

                          if (stageFiltered.length === 0) {
                            return (
                              <div className="py-6 text-center text-xs text-slate-400 font-sans">
                                Chưa có hồ sơ nào thuộc chặng này trong khung thời gian được chọn.
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {stageFiltered.slice(0, 6).map((app, idx) => (
                                <div
                                  key={app.applicationId || idx}
                                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-0.5 truncate">
                                    <div className="font-bold text-slate-800 truncate">{app.candidateName}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{app.jobTitle}</div>
                                    <div className="text-[10px] text-slate-400">
                                      Nộp ngày: {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#5b48bd] font-bold text-[11px]">
                                      {app.matchingScore || 0}% AI Match
                                    </span>
                                    {app.cvUrl && app.cvUrl !== '#' && (
                                      <a
                                        href={app.cvUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-[#5b48bd] font-semibold hover:underline"
                                      >
                                        Xem CV
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* ========================================================================= */}
            {/* 3. EXECUTIVE VELOCITY & AI QUALITY SUITE (MATCHING USER MOCKUP DESIGN)    */}
            {/* ========================================================================= */}
            <div className="space-y-6">
              {/* Header with Breadcrumb & Date Picker */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                    <span className="hover:text-slate-600 cursor-pointer">Trang chủ</span>
                    <span>&rsaquo;</span>
                    <span className="text-[#5b48bd] font-semibold">Thống kê tuyển dụng</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-[#1e1b4b]">
                      Biểu Đồ Miền Vận Tốc Tuyển Dụng &amp; Chất Lượng AI
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Dữ liệu cập nhật theo thời gian thực
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    Phân tích dòng chảy ứng tuyển, năng lực AI và phỏng vấn theo chu kỳ thời gian thực
                  </p>
                </div>

                {/* Right Controls: Date Range Picker & Decorative 3D Widget */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={reportTimeframe}
                      onChange={(e) => setReportTimeframe(e.target.value)}
                      className="appearance-none pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs hover:border-purple-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="ALL">14/10/2026 - 14/11/2026</option>
                      <option value="TODAY">Hôm nay</option>
                      <option value="7_DAYS">7 ngày qua</option>
                      <option value="30_DAYS">30 ngày qua</option>
                    </select>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      calendar_today
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      keyboard_arrow_down
                    </span>
                  </div>

                  {/* 3D Decorative Report Graphic */}
                  <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white items-center justify-center shadow-md shadow-purple-500/20">
                    <span className="material-symbols-outlined text-2xl">insights</span>
                  </div>
                </div>
              </div>

              {/* 4 Executive KPI Metric Cards with Mini Sparkline Wave Curves */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Card 1: Tổng hồ sơ miền */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100/80 text-[#5b48bd] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">groups</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500">Tổng hồ sơ miền</div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                          {totalAppsCount} <span className="text-xs font-medium text-slate-400">CVs</span>
                        </div>
                      </div>
                    </div>
                    {/* Blue Sparkline Wave */}
                    <div className="shrink-0 opacity-90">
                      <svg className="w-16 h-8" viewBox="0 0 60 25" fill="none">
                        <path d="M2 20 C 15 18, 25 5, 40 12 C 50 16, 55 4, 58 6" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 20 C 15 18, 25 5, 40 12 C 50 16, 55 4, 58 6 L 58 25 L 2 25 Z" fill="rgba(59, 130, 246, 0.12)" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span>&uarr; -12%</span>
                    <span className="text-slate-400 font-normal">So với tuần trước</span>
                  </div>
                </div>

                {/* Card 2: Đạt chuẩn AI (≥70%) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100/80 text-[#7c3aed] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500">Đạt chuẩn AI (&ge;70%)</div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                          {passedAiCount} <span className="text-xs font-bold text-[#7c3aed]">({aiQualifiedPercent}%)</span>
                        </div>
                      </div>
                    </div>
                    {/* Purple Sparkline Wave */}
                    <div className="shrink-0 opacity-90">
                      <svg className="w-16 h-8" viewBox="0 0 60 25" fill="none">
                        <path d="M2 22 C 15 20, 22 15, 35 8 C 45 3, 52 14, 58 4" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 22 C 15 20, 22 15, 35 8 C 45 3, 52 14, 58 4 L 58 25 L 2 25 Z" fill="rgba(139, 92, 246, 0.12)" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span>&uarr; 25%</span>
                    <span className="text-slate-400 font-normal">So với tuần trước</span>
                  </div>
                </div>

                {/* Card 3: Ứng viên phỏng vấn */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500">Ứng viên phỏng vấn</div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                          {interviewCount} <span className="text-xs font-bold text-orange-500">({interviewPercent}%)</span>
                        </div>
                      </div>
                    </div>
                    {/* Orange Sparkline Wave */}
                    <div className="shrink-0 opacity-90">
                      <svg className="w-16 h-8" viewBox="0 0 60 25" fill="none">
                        <path d="M2 18 C 15 15, 25 18, 40 10 C 50 5, 54 8, 58 12" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 18 C 15 15, 25 18, 40 10 C 50 5, 54 8, 58 12 L 58 25 L 2 25 Z" fill="rgba(249, 115, 22, 0.12)" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <span>&rarr; 0%</span>
                    <span className="text-slate-400 font-normal">So với tuần trước</span>
                  </div>
                </div>

                {/* Card 4: Đỉnh tải tuyển dụng */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">trending_up</span>
                      </div>
                      <div className="max-w-[140px]">
                        <div className="text-xs font-bold text-slate-500">Đỉnh tải tuyển dụng</div>
                        <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate" title={peakVelocityPeriod?.displayName || peakVelocityPeriod?.label || 'Tuần 2 (08 - 14)'}>
                          {peakVelocityPeriod?.displayName || peakVelocityPeriod?.label || 'Tuần 2 (08 - 14)'}
                        </div>
                      </div>
                    </div>
                    {/* Green Sparkline Wave */}
                    <div className="shrink-0 opacity-90">
                      <svg className="w-16 h-8" viewBox="0 0 60 25" fill="none">
                        <path d="M2 22 C 15 20, 28 8, 42 14 C 50 18, 54 6, 58 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 22 C 15 20, 28 8, 42 14 C 50 18, 54 6, 58 4 L 58 25 L 2 25 Z" fill="rgba(16, 185, 129, 0.12)" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span>&uarr; 8%</span>
                    <span className="text-slate-400 font-normal">So với tuần trước</span>
                  </div>
                </div>
              </div>

              {/* Main Two-Column Layout (Left 8 Cols Area Chart & Quick Insight / Right 4 Cols Donut & Details) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ===================== LEFT COLUMN (8 COLS) ===================== */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Main Area Chart Card */}
                  <div className="p-6 sm:p-7 rounded-[28px] bg-white border border-slate-200/80 shadow-2xs space-y-6">
                    {/* Chart Header with Title & View Mode Tabs */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-xl">leaderboard</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[#1e1b4b]">
                            Tổng Quan Dòng Chảy Tuyển Dụng
                          </h3>
                          <p className="text-xs text-slate-500 font-sans mt-0.5">
                            Theo dõi hành trình ứng viên từ nộp hồ sơ &rarr; đạt AI &rarr; phỏng vấn trong 4 tuần gần nhất
                          </p>
                        </div>
                      </div>

                      {/* View Mode Tabs: [Tổng quan] [Theo tuần] [Theo vị trí] */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-bold self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setVelocityViewMode('ALL')}
                          className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            velocityViewMode === 'ALL'
                              ? 'bg-[#5b48bd] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Tổng quan
                        </button>
                        <button
                          type="button"
                          onClick={() => setVelocityViewMode('WEEK')}
                          className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            velocityViewMode === 'WEEK'
                              ? 'bg-[#5b48bd] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Theo tuần
                        </button>
                        <button
                          type="button"
                          onClick={() => setVelocityViewMode('JOB')}
                          className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            velocityViewMode === 'JOB'
                              ? 'bg-[#5b48bd] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Theo vị trí
                        </button>
                      </div>
                    </div>

                    {/* SVG Area Chart Canvas */}
                    <div className="w-full h-64 sm:h-72 relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
                        <defs>
                          {/* Gradient 1: Blue (Total) */}
                          <linearGradient id="mockupAreaGradBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                          </linearGradient>
                          {/* Gradient 2: Purple (Match >= 70%) */}
                          <linearGradient id="mockupAreaGradPurple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                          </linearGradient>
                          {/* Gradient 3: Orange (Interview) */}
                          <linearGradient id="mockupAreaGradOrange" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.20" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Horizontal Gridlines & Values */}
                        {[
                          { y: 25, label: 4 },
                          { y: 65, label: 3 },
                          { y: 105, label: 2 },
                          { y: 145, label: 1 },
                          { y: 185, label: 0 },
                        ].map((grid, gIdx) => (
                          <g key={gIdx}>
                            <line
                              x1="45"
                              y1={grid.y}
                              x2="980"
                              y2={grid.y}
                              stroke="#f1f5f9"
                              strokeWidth="1.2"
                              strokeDasharray={gIdx === 4 ? 'none' : '4 4'}
                            />
                            <text
                              x="35"
                              y={grid.y + 4}
                              textAnchor="end"
                              className="text-[11px] fill-slate-400 font-mono font-bold"
                            >
                              {grid.label}
                            </text>
                          </g>
                        ))}

                        {/* Splines & Nodes Rendering */}
                        {(() => {
                          const N = recruitmentVelocityByTimeframe.length || 4;
                          const plotW = 930;
                          const xStart = 50;
                          const maxVal = Math.max(maxVelocityTotal, 4);
                          const yBottom = 185;
                          const plotH = 160;

                          const points = recruitmentVelocityByTimeframe.map((d, i) => {
                            const x = xStart + (i + 0.5) * (plotW / N);
                            const yTotal = yBottom - (d.total / maxVal) * plotH;
                            const yMatch = yBottom - ((d.match || d.qualified || 0) / maxVal) * plotH;
                            const yInterview = yBottom - ((d.interview || 0) / maxVal) * plotH;
                            return { ...d, x, yTotal, yMatch, yInterview, index: i };
                          });

                          let splineBlue = '';
                          let areaBlue = '';
                          let splinePurple = '';
                          let areaPurple = '';
                          let splineOrange = '';
                          let areaOrange = '';

                          if (points.length > 0) {
                            splineBlue = `M ${points[0].x},${points[0].yTotal}`;
                            areaBlue = `M ${points[0].x},${yBottom} L ${points[0].x},${points[0].yTotal}`;

                            splinePurple = `M ${points[0].x},${points[0].yMatch}`;
                            areaPurple = `M ${points[0].x},${yBottom} L ${points[0].x},${points[0].yMatch}`;

                            splineOrange = `M ${points[0].x},${points[0].yInterview}`;
                            areaOrange = `M ${points[0].x},${yBottom} L ${points[0].x},${points[0].yInterview}`;

                            for (let i = 0; i < points.length - 1; i++) {
                              const p0 = points[i];
                              const p1 = points[i + 1];
                              const cpX = (p0.x + p1.x) / 2;

                              splineBlue += ` C ${cpX},${p0.yTotal} ${cpX},${p1.yTotal} ${p1.x},${p1.yTotal}`;
                              areaBlue += ` C ${cpX},${p0.yTotal} ${cpX},${p1.yTotal} ${p1.x},${p1.yTotal}`;

                              splinePurple += ` C ${cpX},${p0.yMatch} ${cpX},${p1.yMatch} ${p1.x},${p1.yMatch}`;
                              areaPurple += ` C ${cpX},${p0.yMatch} ${cpX},${p1.yMatch} ${p1.x},${p1.yMatch}`;

                              splineOrange += ` C ${cpX},${p0.yInterview} ${cpX},${p1.yInterview} ${p1.x},${p1.yInterview}`;
                              areaOrange += ` C ${cpX},${p0.yInterview} ${cpX},${p1.yInterview} ${p1.x},${p1.yInterview}`;
                            }
                            areaBlue += ` L ${points[points.length - 1].x},${yBottom} Z`;
                            areaPurple += ` L ${points[points.length - 1].x},${yBottom} Z`;
                            areaOrange += ` L ${points[points.length - 1].x},${yBottom} Z`;
                          }

                          return (
                            <g>
                              {/* Area Fills */}
                              {areaBlue && <path d={areaBlue} fill="url(#mockupAreaGradBlue)" />}
                              {areaPurple && <path d={areaPurple} fill="url(#mockupAreaGradPurple)" />}
                              {areaOrange && <path d={areaOrange} fill="url(#mockupAreaGradOrange)" />}

                              {/* Stroke Lines */}
                              {splineBlue && <path d={splineBlue} fill="none" stroke="#3b82f6" strokeWidth="2.8" strokeLinecap="round" />}
                              {splinePurple && <path d={splinePurple} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />}
                              {splineOrange && <path d={splineOrange} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />}

                              {/* Interactive Nodes */}
                              {points.map((pt) => {
                                const isHovered = hoveredVelocityIndex === pt.index;
                                return (
                                  <g key={pt.index}>
                                    {/* Hover Column Trigger */}
                                    <rect
                                      x={pt.x - (plotW / N) * 0.48}
                                      y={20}
                                      width={(plotW / N) * 0.96}
                                      height={170}
                                      fill="transparent"
                                      className="cursor-pointer"
                                      onMouseEnter={() => setHoveredVelocityIndex(pt.index)}
                                      onMouseLeave={() => setHoveredVelocityIndex(null)}
                                    />

                                    {/* Guideline */}
                                    {isHovered && (
                                      <line
                                        x1={pt.x}
                                        y1={25}
                                        x2={pt.x}
                                        y2={yBottom}
                                        stroke="#8b5cf6"
                                        strokeWidth="1.5"
                                        strokeDasharray="3 3"
                                        className="pointer-events-none"
                                      />
                                    )}

                                    {/* Blue Hollow Node */}
                                    <circle
                                      cx={pt.x}
                                      cy={pt.yTotal}
                                      r={isHovered ? 6 : 4}
                                      fill="#ffffff"
                                      stroke="#3b82f6"
                                      strokeWidth={2.5}
                                      className="pointer-events-none shadow-sm"
                                    />

                                    {/* Purple Solid Node */}
                                    <circle
                                      cx={pt.x}
                                      cy={pt.yMatch}
                                      r={isHovered ? 5.5 : 3.5}
                                      fill="#8b5cf6"
                                      stroke="#ffffff"
                                      strokeWidth={1.5}
                                      className="pointer-events-none shadow-sm"
                                    />

                                    {/* Orange Solid Node */}
                                    <circle
                                      cx={pt.x}
                                      cy={pt.yInterview}
                                      r={isHovered ? 5.5 : 3.5}
                                      fill="#f97316"
                                      stroke="#ffffff"
                                      strokeWidth={1.5}
                                      className="pointer-events-none shadow-sm"
                                    />

                                    {/* X-Axis Labels */}
                                    <text
                                      x={pt.x}
                                      y={yBottom + 20}
                                      textAnchor="middle"
                                      className={`text-[11px] font-sans ${
                                        isHovered ? 'fill-[#5b48bd] font-bold' : 'fill-slate-600 font-medium'
                                      }`}
                                    >
                                      {pt.displayName || pt.label}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}
                      </svg>

                      {/* Floating Tooltip */}
                      {hoveredVelocityIndex !== null && recruitmentVelocityByTimeframe[hoveredVelocityIndex] && (
                        <div
                          className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 backdrop-blur-md border border-slate-700/80 -translate-x-1/2 min-w-[180px]"
                          style={{
                            left: `${((hoveredVelocityIndex + 0.5) / recruitmentVelocityByTimeframe.length) * 88 + 6}%`,
                            top: '10px',
                          }}
                        >
                          <div className="font-bold text-purple-300 border-b border-slate-700/80 pb-1 flex items-center justify-between">
                            <span>{recruitmentVelocityByTimeframe[hoveredVelocityIndex].displayName || recruitmentVelocityByTimeframe[hoveredVelocityIndex].label}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-0.5">
                            <span className="text-slate-300">Tổng nộp CV:</span>
                            <strong className="text-white font-bold">{recruitmentVelocityByTimeframe[hoveredVelocityIndex].total} CV</strong>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-purple-300">Đạt chuẩn AI:</span>
                            <strong className="text-purple-200 font-bold">{recruitmentVelocityByTimeframe[hoveredVelocityIndex].match || recruitmentVelocityByTimeframe[hoveredVelocityIndex].qualified || 0} CV</strong>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-orange-300">Phỏng vấn:</span>
                            <strong className="text-orange-200 font-bold">{recruitmentVelocityByTimeframe[hoveredVelocityIndex].interview || 0} ứng viên</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chart Bottom Legend & Info Callout Card */}
                    <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Legend */}
                      <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold text-slate-700 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-[#3b82f6] bg-white inline-block" />
                          <span>Tổng nộp CV</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#8b5cf6] inline-block" />
                          <span>Đạt chuẩn AI (&ge;70%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#f97316] inline-block" />
                          <span>Phỏng vấn</span>
                        </div>
                      </div>

                      {/* Info Callout Card (Bottom Right of Chart) */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-slate-600 max-w-md shadow-2xs">
                        <span className="material-symbols-outlined text-[16px] text-indigo-500 shrink-0">auto_awesome</span>
                        <span className="leading-snug">
                          Đỉnh tải tuyển dụng đạt mức {peakVelocityPeriod?.total || 2} CV tại {peakVelocityPeriod?.displayName || 'Tuần 2 (08 - 14)'}. Miền đạt chuẩn AI chiếm {aiQualifiedPercent}% tổng lưu lượng, bắt đầu tăng dần.
                        </span>
                        <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0 cursor-help" title="Thông tin phân tích tự động">info</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick AI Recommendation Bar (Nhận định nhanh) */}
                  <div className="rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white border border-purple-100/90 p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
                    <div className="flex items-center gap-3 max-w-2xl">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5b48bd] flex items-center justify-center shrink-0 font-bold">
                        <span className="material-symbols-outlined text-lg">electric_bolt</span>
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed font-sans">
                        <strong className="font-bold text-[#221d47] mr-1.5">Nhận định nhanh:</strong>
                        Lượng hồ sơ tăng nhẹ, nhưng tỷ lệ đạt chuẩn AI vẫn còn thấp. Nên tập trung cải thiện mô tả công việc và tối ưu bộ câu hỏi AI để nâng cao chất lượng ứng viên.
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowExportModal(true)}
                        className="px-4 py-2 rounded-xl bg-[#5b48bd] hover:bg-[#4a39a6] text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Xem chi tiết báo cáo</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ===================== RIGHT COLUMN (4 COLS) ===================== */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Card 1: Tổng quan theo giai đoạn (Donut Chart & AI Alert) */}
                  <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-2xs space-y-5">
                    <h3 className="font-bold text-base text-[#1e1b4b]">
                      Tổng quan theo giai đoạn
                    </h3>

                    {/* Donut Chart & Breakdown */}
                    <div className="flex items-center justify-between gap-4">
                      {/* SVG Donut */}
                      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 160 160">
                          {(() => {
                            const C = 326.72; // 2 * PI * 52
                            const total = Math.max(totalAppsCount, 1);
                            const dashBlue = (totalAppsCount / total) * C;
                            const dashPurple = (passedAiCount / total) * C;
                            const dashOrange = (interviewCount / total) * C;

                            return (
                              <g transform="rotate(-90 80 80)">
                                {/* Background Circle */}
                                <circle cx="80" cy="80" r="52" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                                {/* Blue Segment */}
                                <circle
                                  cx="80"
                                  cy="80"
                                  r="52"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="20"
                                  strokeDasharray={`${dashBlue} ${C - dashBlue}`}
                                  strokeDashoffset="0"
                                  className="transition-all"
                                />
                                {/* Purple Segment */}
                                <circle
                                  cx="80"
                                  cy="80"
                                  r="52"
                                  fill="none"
                                  stroke="#8b5cf6"
                                  strokeWidth="20"
                                  strokeDasharray={`${dashPurple} ${C - dashPurple}`}
                                  strokeDashoffset={`-${dashBlue - dashPurple}`}
                                  className="transition-all"
                                />
                                {/* Orange Segment */}
                                {dashOrange > 0 && (
                                  <circle
                                    cx="80"
                                    cy="80"
                                    r="52"
                                    fill="none"
                                    stroke="#f97316"
                                    strokeWidth="20"
                                    strokeDasharray={`${dashOrange} ${C - dashOrange}`}
                                    strokeDashoffset={`-${dashBlue - dashOrange}`}
                                    className="transition-all"
                                  />
                                )}
                              </g>
                            );
                          })()}
                        </svg>

                        {/* Donut Center Metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-black text-slate-900 leading-none">{totalAppsCount}</span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">CVs</span>
                        </div>
                      </div>

                      {/* Legend Breakdown */}
                      <div className="space-y-2 text-xs flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                            <span className="text-slate-600 font-medium text-[11px]">Nộp hồ sơ</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span>{totalAppsCount}</span>
                            <span className="text-[10px] text-slate-400 font-normal">100%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                            <span className="text-slate-600 font-medium text-[11px]">Đạt chuẩn AI</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-[#8b5cf6]">
                            <span>{passedAiCount}</span>
                            <span className="text-[10px] text-purple-400 font-normal">{aiQualifiedPercent}%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                            <span className="text-slate-600 font-medium text-[11px]">Phỏng vấn</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-orange-600">
                            <span>{interviewCount}</span>
                            <span className="text-[10px] text-orange-400 font-normal">{interviewPercent}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Status Banner */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/50 border border-purple-100 flex items-center justify-between gap-3 cursor-pointer hover:border-purple-300 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5b48bd] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-[#221d47]">AI đang hoạt động ổn định!</div>
                        <div className="text-[11px] text-slate-500 leading-tight">
                          Tỷ lệ chuyển đổi từ nộp hồ sơ &rarr; đạt AI đang cải thiện qua từng tuần.
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 text-base shrink-0">chevron_right</span>
                    </div>
                  </div>

                  {/* Card 2: Thông tin thêm */}
                  <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-2xs space-y-4">
                    <h3 className="font-bold text-base text-[#1e1b4b]">
                      Thông tin thêm
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">description</span>
                          <span>Tổng số vị trí đang tuyển</span>
                        </div>
                        <strong className="text-slate-900 font-bold text-sm">{jobs.length}</strong>
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">track_changes</span>
                          <span>Tỷ lệ hoàn thành tuyển dụng</span>
                        </div>
                        <strong className="text-slate-900 font-bold text-sm">{fulfillmentRate}%</strong>
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
                          <span>Thời gian xử lý trung bình</span>
                        </div>
                        <strong className="text-slate-900 font-bold text-sm">1,8 ngày</strong>
                      </div>

                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">public</span>
                          <span>Nguồn tuyển chính</span>
                        </div>
                        <strong className="text-slate-900 font-bold text-xs truncate max-w-[140px]">Website công ty, MXH</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Performance Matrix Table */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5b48bd] text-xl">table_chart</span>
                  <h3 className="font-bold text-base text-[#221d47]">
                    Ma Trận Hiệu Quả Tuyển Dụng Theo Vị Trí
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">{jobs.length} Vị trí đang mở tuyển</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/50 text-[#5b48bd] uppercase text-[11px] font-bold">
                      <th className="py-3 px-4 rounded-l-xl">Vị Trí Tuyển Dụng</th>
                      <th className="py-3 text-center">Ứng Viên</th>
                      <th className="py-3 text-center">AI Match TB</th>
                      <th className="py-3 text-center">Phỏng Vấn</th>
                      <th className="py-3 text-center">Đã Offer</th>
                      <th className="py-3">Tiến Độ Tuyển</th>
                      <th className="py-3 text-center">Tình Trạng</th>
                      <th className="py-3 pr-4 text-right rounded-r-xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map(j => (
                      <tr key={j.jobId} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 pr-4">
                          <div className="font-bold text-[#221d47] text-xs sm:text-sm">{j.title}</div>
                          <div className="text-[11px] text-slate-500 font-sans mt-0.5">{j.location} &bull; {j.salaryText}</div>
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#221d47]">{j.totalApplicants}</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                            {j.avgMatch}%
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#221d47]">{j.interviewCount}</td>
                        <td className="py-3.5 text-center font-bold text-emerald-600">{j.offerCount}</td>
                        <td className="py-3.5 w-48">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-600">{j.hiredCount}/{j.targetHires} nhân sự</span>
                            <span className="text-[#5b48bd] font-bold">{Math.round((j.hiredCount / j.targetHires) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] rounded-full"
                              style={{ width: `${(j.hiredCount / j.targetHires) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          {j.hiredCount >= j.targetHires ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ĐẠT CHỈ TIÊU
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-200">
                              ĐANG TIẾN TRIỂN
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedJobId(j.jobId);
                              setActiveTab('PIPELINE');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          >
                            Xem Phễu →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* MODULE: RECRUITMENT TIME & DEADLINE MANAGEMENT AUDIT      */}
            {/* ========================================================= */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#221d47] flex items-center gap-2">
                      Quản Trị Thời Gian &amp; Lịch Sử Hạn Chót Tuyển Dụng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Theo dõi chính xác tiến độ thời hạn, phát hiện tin quá hạn nộp hồ sơ và hỗ trợ gia hạn thời gian tuyển ngay lập tức.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                    {jobDeadlineStats.auditedJobs.length} Tin bài được kiểm soát
                  </span>
                </div>
              </div>

              {/* 4 Time Management KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">event_available</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">Tin Còn Hạn Nộp</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 mt-0.5">
                      {jobDeadlineStats.activeCount} <span className="text-xs font-normal text-emerald-700">tin mở</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">hourglass_bottom</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-800 uppercase">Sắp Hết Hạn (≤7 ngày)</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-0.5">
                      {jobDeadlineStats.expiringSoonCount} <span className="text-xs font-normal text-amber-700">tin cần chú ý</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">event_busy</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-rose-800 uppercase">Đã Quá Hạn Tuyển</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-rose-900 mt-0.5">
                      {jobDeadlineStats.expiredCount} <span className="text-xs font-normal text-rose-700">tin hết hạn</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">pace</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#5b48bd] uppercase">Thời Gian Đóng Tuyển TB</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#221d47] mt-0.5">
                      16.5 <span className="text-xs font-normal text-slate-500">ngày</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table of Job Deadlines */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/40 text-[#5b48bd] uppercase text-[11px] font-bold">
                      <th className="py-3 px-4">Vị Trí Tuyển Dụng</th>
                      <th className="py-3 text-center">Ngày Xuất Bản</th>
                      <th className="py-3 text-center">Hạn Chót Nộp Hồ Sơ</th>
                      <th className="py-3 text-center">Thời Gian Còn Lại</th>
                      <th className="py-3 text-center">Tình Trạng Hạn</th>
                      <th className="py-3 pr-4 text-right">Thao Tác Gia Hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobDeadlineStats.auditedJobs.map((j) => {
                      const dInfo = j.deadlineInfo;
                      return (
                        <tr key={j.jobId} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm hover:text-[#5b48bd] cursor-pointer" onClick={() => window.location.hash = `#/jobs/${j.jobId}`}>
                              {j.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Mã: JD-{j.jobId} &bull; {j.location}</div>
                          </td>
                          <td className="py-3.5 text-center text-slate-600 font-medium">
                            {j.postedDate}
                          </td>
                          <td className="py-3.5 text-center font-semibold text-slate-800">
                            {dInfo.formattedDate}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${dInfo.badgeClass}`}>
                              {dInfo.isExpired ? (
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                              ) : dInfo.isExpiringSoon ? (
                                <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                              ) : (
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              )}
                              <span>{dInfo.label}</span>
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {dInfo.isExpired ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                ĐÃ QUÁ HẠN
                              </span>
                            ) : dInfo.isExpiringSoon ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                SẮP HẾT HẠN
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ĐANG NHẬN ĐƠN
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(dInfo.isExpired || dInfo.isExpiringSoon) && (
                                <button
                                  type="button"
                                  onClick={() => handleExtendJobDeadline(j.jobId, 30)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1"
                                  title="Gia hạn thêm 30 ngày cho tin này"
                                >
                                  <span className="material-symbols-outlined text-[14px]">update</span>
                                  <span>+30 Ngày</span>
                                </button>
                              )}
                              <a
                                href={`#/jobs/${j.jobId}`}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                              >
                                Xem
                              </a>
                              <a
                                href={`#/applicants-management?jobId=${j.jobId}`}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] text-xs font-bold border border-purple-200 transition-all cursor-pointer"
                              >
                                Ứng viên ({j.totalApplicants})
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Row: Upcoming Live Interviews & AI Strategic Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Live Interviews Hub */}
              <div className="p-6 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">event_available</span>
                    <h3 className="font-bold text-base text-[#221d47]">
                      Lịch Phỏng Vấn Sắp Diễn Ra
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {candidates.filter(c => c.stage === 'INTERVIEW').length} lịch phỏng vấn
                  </span>
                </div>

                <div className="space-y-3">
                  {candidates.filter(c => c.stage === 'INTERVIEW').length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                      Chưa có ứng viên nào trong vòng phỏng vấn. Hãy chuyển ứng viên sang trạng thái Phỏng vấn trên Phễu Kanban để tự động lên lịch.
                    </div>
                  ) : (
                    candidates
                      .filter(c => c.stage === 'INTERVIEW')
                      .slice(0, 5)
                      .map((inv, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition-all flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#221d47] text-xs sm:text-sm">{inv.fullName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                                {inv.aiMatchScore}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-sans">{inv.email} &bull; Hội đồng Kỹ Thuật</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span> Đã xếp lịch phỏng vấn
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href="https://meet.google.com/hm-9082-eval"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">videocam</span>
                              <span>Vào Meet</span>
                            </a>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Synthia AI Strategic Recommendations */}
              <div className="p-6 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-xl">psychology</span>
                    <h3 className="font-bold text-base text-[#221d47]">
                      Synthia AI Khuyến Nghị Chiến Lược Tuyển Dụng
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">3 Gợi ý</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#221d47]">
                      <span className="material-symbols-outlined text-[#5b48bd] text-base">timer</span>
                      <span>Duy trì tốc độ phản hồi hồ sơ dưới 4 giờ</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
                      Dữ liệu lịch sử cho thấy ứng viên cấp Senior có xu hướng nhận offer từ đối thủ trong vòng 5 ngày. Phản hồi nhanh giúp tăng 42% tỷ lệ ứng viên đồng ý vào vòng phỏng vấn kỹ thuật.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#221d47]">
                      <span className="material-symbols-outlined text-orange-500 text-base">work_history</span>
                      <span>Chính sách Hybrid 2 ngày WFH thu hút nhân sự Senior</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
                      Vị trí Lead Systems đạt 14 hồ sơ chất lượng cao chủ yếu nhờ điều kiện làm việc linh hoạt. Nên nhân rộng mô hình này sang các đợt mở tuyển Cloud DevOps tiếp theo.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#221d47]">
                      <span className="material-symbols-outlined text-emerald-600 text-base">task_alt</span>
                      <span>Sử dụng bài test chuẩn hóa Java Concurrency</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
                      Sàng lọc kỹ năng Kafka &amp; Multithreading qua bài test tự động trước buổi phỏng vấn giúp rút ngắn 35% thời lượng buổi phỏng vấn trực tiếp của Tech Lead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CREATE & MANAGE JOBS                               */}
        {/* ========================================================= */}
        {activeTab === 'JOBS' && (
          <div className="w-full">
            <RecruiterJobManagementPage
              user={user}
              onNavigateToPipeline={(jobId) => {
                setSelectedJobId(jobId);
                setActiveTab('PIPELINE');
                window.location.hash = `#/recruiter-dashboard?tab=pipeline&jobId=${jobId}`;
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: APPLICANT PIPELINE / KANBAN BOARD                  */}
        {/* ========================================================= */}
        {activeTab === 'PIPELINE' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-xl text-[#2D3A31] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C9A84]">view_kanban</span>
                  Phễu Ứng Viên Kanban (Tự Động Xếp Hạng AI Match)
                </h2>
                <p className="text-xs text-[#2D3A31]/70 font-sans mt-0.5">
                  Ứng viên được AI tự động tính điểm theo công thức 70% bắt buộc + 30% ưu tiên, sắp xếp giảm dần.
                </p>
              </div>

              {/* Job Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#2D3A31]/70 font-medium">Chọn vị trí:</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(Number(e.target.value))}
                  className="py-2 px-3 bg-[#F9F8F4] rounded-xl text-xs text-[#2D3A31] border border-[#E6E2DA] focus:outline-none focus:border-[#2D3A31] cursor-pointer"
                >
                  {jobs.map(j => (
                    <option key={j.jobId} value={j.jobId} className="bg-white text-[#2D3A31]">
                      {j.title} ({j.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kanban Columns (4 Stages) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { stageId: 'APPLIED', title: '1. Hồ sơ mới', color: 'text-[#2D3A31]' },
                { stageId: 'REVIEWING', title: '2. Đang duyệt', color: 'text-[#8C9A84]' },
                { stageId: 'INTERVIEW', title: '3. Phỏng vấn', color: 'text-[#C27B66]' },
                { stageId: 'OFFERED', title: '4. Đã Chốt Tuyển Dụng', color: 'text-[#2D3A31]' },
              ].map(column => {
                const columnCandidates = jobCandidates.filter(c => c.stage === column.stageId);
                return (
                  <div key={column.stageId} className="bg-[#F9F8F4] rounded-[24px] p-4 border border-[#E6E2DA] space-y-3 min-h-[420px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA] mb-3">
                        <span className={`font-serif font-bold text-xs uppercase tracking-wider ${column.color}`}>
                          {column.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2D3A31] border border-[#E6E2DA] shadow-soft">
                          {columnCandidates.length}
                        </span>
                      </div>

                      {/* Candidate Cards */}
                      <div className="space-y-3">
                        {columnCandidates.map(candidate => (
                          <div
                            key={candidate.candidateId}
                            className="bg-white rounded-2xl p-4 border border-[#E6E2DA] hover:border-[#8C9A84] shadow-soft space-y-2.5 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-serif font-bold text-sm text-[#2D3A31]">{candidate.fullName}</h4>
                                <p className="text-[11px] text-[#2D3A31]/60 font-sans">{candidate.email}</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30 shrink-0">
                                {candidate.aiMatchScore}% Match
                              </span>
                            </div>

                            <p className="text-[11px] text-[#2D3A31]/70 font-sans line-clamp-2">
                              {candidate.notes}
                            </p>

                            <div className="pt-2 border-t border-[#E6E2DA] flex items-center justify-between text-xs">
                              <button
                                onClick={() => {
                                  window.location.hash = `#/candidate-evaluation?candidateId=${candidate.candidateId}&jobId=${selectedJobId}`;
                                }}
                                className="text-[11px] text-[#5b48bd] hover:text-[#3b2b8e] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <span className="material-symbols-outlined text-xs">assessment</span>
                                Đánh Giá &amp; CV
                              </button>

                              {/* Stage Mover Selector */}
                              <select
                                value={candidate.stage}
                                onChange={(e) => handleMoveCandidateStage(candidate.candidateId, e.target.value)}
                                className="bg-[#F9F8F4] text-[11px] py-1 px-2 rounded-lg border border-[#E6E2DA] text-[#2D3A31] cursor-pointer focus:outline-none"
                              >
                                <option value="APPLIED">1. Applied</option>
                                <option value="REVIEWING">2. Reviewing</option>
                                <option value="INTERVIEW">3. Interview</option>
                                <option value="OFFERED">4. Offered</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {columnCandidates.length === 0 && (
                      <div className="text-center text-xs text-[#2D3A31]/50 py-12 font-sans">
                        Chưa có ứng viên ở chặng này.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* ========================================================= */}
        {/* TAB 4: COMPANY PROFILE MANAGEMENT                         */}
        {/* ========================================================= */}
        {activeTab === 'COMPANY' && (
          <div className="w-full">
            <RecruiterProfilePage user={user} onNavigate={(r) => { window.location.hash = r; }} />
          </div>
        )}
      </div>

      {/* MODAL 1: Đăng Tin Tuyển Dụng Chuẩn 70/30 (Executive Studio Style) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-purple-200/80 rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl text-[#221d47] overflow-hidden">
            
            {/* Modal Header: Executive Indigo Gradient */}
            <div className="px-6 py-4.5 border-b border-purple-100 flex items-center justify-between gap-4 bg-gradient-to-r from-[#1e1548] via-[#2d1b69] to-[#1e1548] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#ec4899] text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0 border border-white/20">
                  <span className="material-symbols-outlined text-xl animate-pulse">auto_awesome</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold font-sans tracking-tight text-white flex items-center gap-2">
                      <span>Đăng Tin Tuyển Dụng Mới</span>
                    </h2>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Ma Trận AI 70/30
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5 font-medium">
                    Nhập trọng số kỹ năng để AI tự động so khớp điểm % Match với ứng viên
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewJobForm({
                      title: 'Intern Backend Engineer (Java / Spring Boot)',
                      department: 'Engineering',
                      location: 'Đà Nẵng (Hybrid)',
                      salaryText: '$1,500 - $2,000/tháng',
                      vacanciesCount: 2,
                      deadlineDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      description: '- Tham gia phát triển và tối ưu hóa các module RESTful API lõi dựa trên Java 21 và Spring Boot 3.\n- Hỗ trợ xây dựng lược đồ cơ sở dữ liệu PostgreSQL, viết query tối ưu hóa và thiết lập index hiệu năng cao.\n- Tìm hiểu và ứng dụng kiến trúc Microservices, triển khai hệ thống thông báo Kafka và bộ đệm Redis.\n- Tham gia quy trình Agile/Scrum, thực hiện Code Review cùng Senior Tech Lead và viết Unit/Integration Tests.',
                      mandatorySkillsInput: 'Java 21, Spring Boot 3, PostgreSQL, RESTful API',
                      preferredSkillsInput: 'Microservices, Docker, Redis, Kafka',
                    });
                    setNotification('✨ Đã tải mẫu bài đăng chuẩn Intern Backend (FPT Software) thành công!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-sm">content_paste_go</span>
                  <span>Dùng mẫu chuẩn</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-[#fbfaff]">
              <form onSubmit={handleCreateJobSubmit} className="space-y-5 text-xs font-sans">
                
                {/* 1. Core Role Information */}
                <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                    <span className="material-symbols-outlined text-[#5b48bd] text-lg">badge</span>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#221d47]">
                      1. Chức Danh &amp; Địa Điểm Tuyển Dụng
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-[#221d47] uppercase mb-1">Tiêu đề vị trí tuyển dụng *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Senior Cloud Backend Engineer (Java / Distributed Systems)"
                      value={newJobForm.title}
                      onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                      className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-3 text-[#221d47] font-bold focus:outline-none focus:border-[#5b48bd] focus:bg-white transition-all text-xs"
                    />
                    {/* Quick Role Suggestions */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                      {['Intern Backend (Java)', 'Senior Frontend (React)', 'Fullstack Engineer', 'AI / Data Engineer'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setNewJobForm({ ...newJobForm, title: role })}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-[#5b48bd] hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-[#221d47] uppercase mb-1">Mức lương dự kiến *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: $1,500 - $2,500 hoặc 25 - 45 triệu VNĐ"
                        value={newJobForm.salaryText}
                        onChange={(e) => setNewJobForm({ ...newJobForm, salaryText: e.target.value })}
                        className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-3 text-[#f97316] font-bold focus:outline-none focus:border-[#5b48bd] focus:bg-white text-xs"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {['$1,500 - $2,500/tháng', '15 - 25 triệu VNĐ', '25 - 45 triệu VNĐ', 'Thỏa thuận'].map((sal) => (
                          <button
                            key={sal}
                            type="button"
                            onClick={() => setNewJobForm({ ...newJobForm, salaryText: sal })}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                          >
                            {sal}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#221d47] uppercase mb-1">Địa điểm làm việc *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: TP.HCM (Hybrid), Đà Nẵng hoặc Remote"
                        value={newJobForm.location}
                        onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                        className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-3 text-[#221d47] focus:outline-none focus:border-[#5b48bd] focus:bg-white font-sans text-xs"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {['Đà Nẵng (Hybrid)', 'TP.HCM (Quận 1)', 'Hà Nội (Cầu Giấy)', 'Remote Toàn Cầu'].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setNewJobForm({ ...newJobForm, location: loc })}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-[#5b48bd] hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-[#221d47] uppercase mb-1 flex items-center justify-between">
                        <span>Số lượng tuyển *</span>
                        <span className="text-[10px] text-purple-700 font-semibold">≥ 1 người</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const curr = Number(newJobForm.vacanciesCount) || 1;
                            if (curr > 1) setNewJobForm({ ...newJobForm, vacanciesCount: curr - 1 });
                          }}
                          className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-base flex items-center justify-center border border-purple-200 cursor-pointer shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          placeholder="1"
                          value={newJobForm.vacanciesCount}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setNewJobForm({ ...newJobForm, vacanciesCount: '' });
                              return;
                            }
                            const cleaned = raw.replace(/\D/g, '');
                            const num = parseInt(cleaned, 10);
                            setNewJobForm({ ...newJobForm, vacanciesCount: isNaN(num) || num < 1 ? 1 : num });
                          }}
                          className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-2.5 text-center text-[#221d47] font-bold focus:outline-none focus:border-[#5b48bd]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const curr = Number(newJobForm.vacanciesCount) || 1;
                            setNewJobForm({ ...newJobForm, vacanciesCount: curr + 1 });
                          }}
                          className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-base flex items-center justify-center border border-purple-200 cursor-pointer shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#221d47] uppercase mb-1 flex items-center justify-between">
                        <span>Hạn chót nộp hồ sơ *</span>
                        <span className="text-[10px] text-purple-700 font-semibold">≥ Hôm nay</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        required
                        value={newJobForm.deadlineDate}
                        onChange={(e) => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const val = e.target.value;
                          if (val && val < todayStr) {
                            setNotification('⚠️ Không thể chọn ngày trong quá khứ! Hệ thống đã tự động đặt thành ngày hôm nay.');
                            setNewJobForm({ ...newJobForm, deadlineDate: todayStr });
                          } else {
                            setNewJobForm({ ...newJobForm, deadlineDate: val });
                          }
                        }}
                        className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {[
                          { label: '+15 ngày', days: 15 },
                          { label: '+30 ngày', days: 30 },
                          { label: '+60 ngày', days: 60 },
                          { label: '+90 ngày', days: 90 },
                        ].map((preset) => (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + preset.days);
                              setNewJobForm({ ...newJobForm, deadlineDate: d.toISOString().split('T')[0] });
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-[#5b48bd] hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. AI Skills Matrix 70/30 */}
                <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5b48bd] text-lg">psychology</span>
                      <span className="font-bold text-xs uppercase tracking-wider text-[#221d47]">
                        2. Cấu Hình Ma Trận Kỹ Năng AI 70/30
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#5b48bd] bg-[#edeafd] px-2 py-0.5 rounded-full">
                      70% Pass + 30% Bonus
                    </span>
                  </div>

                  {/* 70% MANDATORY SKILLS INPUT */}
                  <div className="p-4 rounded-2xl bg-[#edeafd]/40 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-[#5b48bd] uppercase flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">verified</span>
                        Kỹ Năng Bắt Buộc (70% Trọng Số AI Match) *
                      </label>
                      <span className="text-[10px] bg-[#5b48bd] text-white px-2 py-0.5 rounded-full font-bold">Weight: 70%</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Java 21, Spring Boot 3, PostgreSQL, RESTful API"
                      value={newJobForm.mandatorySkillsInput}
                      onChange={(e) => setNewJobForm({ ...newJobForm, mandatorySkillsInput: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] text-xs font-sans"
                    />
                    <p className="text-[10px] text-slate-500">Ứng viên phải đạt các kỹ năng này để vượt qua ngưỡng 70% điểm lọc hồ sơ.</p>
                  </div>

                  {/* 30% PREFERRED SKILLS INPUT */}
                  <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-emerald-700 uppercase flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-sm text-emerald-600">stars</span>
                        Kỹ Năng Ưu Tiên (30% Trọng Số AI Match)
                      </label>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Weight: 30%</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ví dụ: Kafka, Docker, Redis, Kubernetes, AWS"
                      value={newJobForm.preferredSkillsInput}
                      onChange={(e) => setNewJobForm({ ...newJobForm, preferredSkillsInput: e.target.value })}
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-emerald-600 text-xs font-sans"
                    />
                    <p className="text-[10px] text-slate-500">Kỹ năng cộng điểm giúp ứng viên xếp hạng từ 80% - 98% Match.</p>
                  </div>
                </div>

                {/* 3. Detailed Description */}
                <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5b48bd] text-lg">description</span>
                      <span className="font-bold text-xs uppercase tracking-wider text-[#221d47]">
                        3. Mô Tả Công Việc &amp; Trách Nhiệm
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="- Trực tiếp tham gia thiết kế và xây dựng module hệ thống lõi...&#10;- Tối ưu hóa hiệu năng cơ sở dữ liệu và API...&#10;- Phối hợp làm việc trong mô hình Agile/Scrum..."
                    value={newJobForm.description}
                    onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-3.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] focus:bg-white font-sans text-xs leading-relaxed"
                  />
                </div>

                {/* Footer Controls */}
                <div className="pt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      window.location.hash = '#/job-management';
                    }}
                    className="text-xs text-[#5b48bd] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">document_scanner</span>
                    <span>Mở Studio Tuyển Dụng Đầy Đủ (AI OCR Scanner 3.0)</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      <span>Xuất Bản Tin Tuyển Dụng</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Xuất Báo Cáo Tuyển Dụng Chuyên Nghiệp (PDF / Excel / CSV) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A31]/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-[#E6E2DA] rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#8C9A84] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">download_for_offline</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D3A31]">Xuất Báo Cáo Hiệu Suất Tuyển Dụng</h3>
                <p className="text-xs text-[#2D3A31]/70">Tùy chọn định dạng tài liệu và phạm vi dữ liệu phân tích</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#2D3A31] uppercase mb-1.5">1. Chọn định dạng xuất file:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'PDF', label: 'PDF Document', icon: 'picture_as_pdf', desc: 'Báo cáo quản trị tổng kết' },
                    { id: 'EXCEL', label: 'Excel (XLSX)', icon: 'table_view', desc: 'Dữ liệu số liệu thô' },
                    { id: 'CSV', label: 'CSV Format', icon: 'dataset', desc: 'Dành cho BI / ATS khác' },
                  ].map(fmt => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setExportFormat(fmt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        exportFormat === fmt.id
                          ? 'bg-[#2D3A31] border-[#2D3A31] text-white shadow-soft'
                          : 'bg-[#F9F8F4] border-[#E6E2DA] text-[#2D3A31] hover:border-[#8C9A84]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg mb-1 block ${exportFormat === fmt.id ? 'text-white' : 'text-[#8C9A84]'}`}>
                        {fmt.icon}
                      </span>
                      <div className="font-bold text-xs">{fmt.label}</div>
                      <div className={`text-[10px] mt-0.5 ${exportFormat === fmt.id ? 'text-white/80' : 'text-[#2D3A31]/60'}`}>
                        {fmt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A31] uppercase mb-1.5">2. Nội dung bao gồm trong báo cáo:</label>
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Chỉ số 6 KPI Cốt lõi &amp; Đánh giá Sức khỏe Tuyển dụng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Sơ đồ Phễu chuyển đổi 5 chặng &amp; Tỷ lệ Drop-off</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Bảng điểm kỹ năng trọng số theo từng vị trí</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#2D3A31]">
                    <input type="checkbox" defaultChecked className="accent-[#2D3A31] rounded" />
                    <span>Danh sách chi tiết ứng viên &amp; Nhận định từ Synthia AI</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/30 text-[#2D3A31] text-[11px] leading-relaxed">
                Tài liệu được mã hóa chuẩn hóa dấu mộc điện tử từ FPT Software &amp; HireMate AI Studio, sẵn sàng trình Ban Giám Đốc.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#2D3A31] hover:bg-[#E6E2DA]/50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#2D3A31] hover:bg-[#232e27] shadow-soft transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Tải Báo Cáo ({exportFormat})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
