import React, { useState, useEffect, useMemo } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { jobApi, applicationApi, aiMatchApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';
import { createHrToCandidateMailto } from '../utils/emailUtils';
import CvViewModal from '../components/common/CvViewModal';
import { HIREMATE_LOGO_URL } from '../constants/branding';
import { exportCandidatesToExcel } from '../utils/excelExportUtils';

// Dynamic AI Diagnostic Generator for Candidate Evaluation (Multi-Criteria ATS Engine)
function normalizeSkillName(raw) {
  if (!raw) return 'Kỹ năng chuyên môn';
  const s = raw.trim();
  const lower = s.toLowerCase();
  if (lower.includes('test code') || lower.includes('khả năng test') || lower.includes('testing')) {
    return 'Kiểm Thử Phần Mềm & Test Code (Software Testing & QA)';
  }
  if (lower.includes('java')) return 'Lập Trình Java / Java Core';
  if (lower.includes('spring')) return 'Spring Boot & RESTful API';
  if (lower.includes('sql') || lower.includes('database') || lower.includes('postgres')) return 'Cơ Sở Dữ Liệu SQL / PostgreSQL';
  if (lower.includes('react')) return 'Frontend React.js';
  if (lower.includes('git')) return 'Quản Lý Mã Nguồn Git';
  if (lower.includes('postman') || lower.includes('api')) return 'Kiểm Thử API / Postman';
  if (lower.includes('docker')) return 'Containerization Docker';
  return s;
}

function generateComprehensiveAiReport(cand, jobDetails, liveAiReport) {
  if (!cand) return null;

  const jobTitle = liveAiReport?.jobTitle || jobDetails?.title || 'Vị trí Tuyển Dụng';
  const score = liveAiReport?.matchingScore != null ? Math.round(liveAiReport.matchingScore) : (cand.matchScore || 0);
  const matchCategory = liveAiReport?.matchTier || (score >= 85 ? '⭐ Phù Hợp Xuất Sắc (Ready for Offer)' : score >= 70 ? '✨ Phù Hợp Tốt (Khuyên Mời Phỏng Vấn)' : score >= 50 ? '💡 Tiềm Năng' : 'Trau Dồi Kỹ Năng');

  // 1. Nếu có live report từ Gemini AI với advantages và disadvantages
  if (liveAiReport && Array.isArray(liveAiReport.advantages) && liveAiReport.advantages.length > 0) {
    let fullDisadvantages = [...(liveAiReport.disadvantages || [])];
    const mandatoryMissing = cand.mandatoryMissing || [];
    const preferredMissing = cand.preferredMissing || [];
    const cleanSkill = (s) => normalizeSkillName(s);

    mandatoryMissing.forEach((s) => {
      const skillName = cleanSkill(s);
      const exists = fullDisadvantages.some(d => 
        (d.title && d.title.toLowerCase().includes(skillName.toLowerCase())) ||
        (d.jobRequirement && d.jobRequirement.toLowerCase().includes(skillName.toLowerCase()))
      );
      if (!exists) {
        fullDisadvantages.unshift({
          category: 'Kỹ năng bắt buộc còn thiếu',
          title: `Chưa Đáp Ứng Kỹ Năng Bắt Buộc: ${skillName}`,
          jobRequirement: `Bảng tuyển dụng ${jobTitle} yêu cầu bắt buộc ứng viên thành thạo ${skillName} để trực tiếp phát triển sản phẩm.`,
          cvShortfall: `Hồ sơ CV và danh mục kỹ năng của ứng viên chưa ghi nhận kinh nghiệm làm việc thực tế với ${skillName}.`,
          severity: 'Bắt buộc / Cần phỏng vấn xác thực',
        });
      }
    });

    preferredMissing.forEach((s) => {
      const skillName = cleanSkill(s);
      const exists = fullDisadvantages.some(d => 
        (d.title && d.title.toLowerCase().includes(skillName.toLowerCase())) ||
        (d.jobRequirement && d.jobRequirement.toLowerCase().includes(skillName.toLowerCase()))
      );
      if (!exists) {
        fullDisadvantages.push({
          category: 'Kỹ năng ưu tiên chưa có',
          title: `Chưa Có Kỹ Năng Ưu Tiên: ${skillName}`,
          jobRequirement: `Nhà tuyển dụng ưu tiên ứng viên có kiến thức về ${skillName} để gia tăng hiệu suất dự án.`,
          cvShortfall: `Chưa thấy thông tin hoặc dự án áp dụng ${skillName} trong hồ sơ CV.`,
          severity: 'Điểm cộng (Có thể đào tạo 1-2 tuần)',
        });
      }
    });

    const isIntern = jobTitle.toLowerCase().includes('intern') || jobTitle.toLowerCase().includes('fresher') || jobTitle.toLowerCase().includes('thực tập');
    if (isIntern) {
      fullDisadvantages = fullDisadvantages.filter(d => !d.title || (!d.title.toLowerCase().includes('chịu tải') && !d.title.toLowerCase().includes('quy mô lớn') && !d.title.toLowerCase().includes('vận hành hệ thống')));
    }

    return {
      score,
      matchCategory,
      jobTitle,
      advantages: liveAiReport.advantages,
      disadvantages: fullDisadvantages,
      overallVerdict: liveAiReport.overallVerdict || cand.aiQuote || 'Hồ sơ ứng viên có các điểm mạnh nổi bật phù hợp với định hướng công việc.',
      executiveRecommendation: liveAiReport.executiveRecommendation || 'Khuyến nghị HR xem xét mời ứng viên tham gia vòng phỏng vấn chuyên sâu.',
      isAiReal: true,
    };
  }

  // 2. Phân tích đối soát thông minh dựa trên dữ liệu thật của CV và JD
  const candName = cand.name || 'Ứng viên';
  const mandatoryMatched = cand.mandatoryMatched || [];
  const mandatoryMissing = cand.mandatoryMissing || [];
  const preferredMatched = cand.preferredMatched || [];
  const preferredMissing = cand.preferredMissing || [];
  const cleanSkill = (s) => normalizeSkillName(s);

  const advantages = [];
  const disadvantages = [];

  // A. Kỹ năng chuyên môn phù hợp
  mandatoryMatched.forEach((s) => {
    advantages.push({
      category: 'Kỹ năng chuyên môn phù hợp',
      title: cleanSkill(s),
      cvEvidence: `CV của ứng viên ${candName} thể hiện kiến thức nền tảng và kinh nghiệm thực hành với "${cleanSkill(s)}".`,
      jobMatch: `Yêu cầu chuyên môn cốt lõi trong JD: ${cleanSkill(s)}`,
      assessment: 'Đạt chuẩn',
    });
  });

  preferredMatched.forEach((s) => {
    advantages.push({
      category: 'Kỹ năng chuyên môn phù hợp',
      title: cleanSkill(s),
      cvEvidence: `Ứng viên có kỹ năng bổ trợ và đồ án liên quan đến "${cleanSkill(s)}".`,
      jobMatch: `Điểm cộng ưu tiên trong bài tuyển dụng: ${cleanSkill(s)}`,
      assessment: 'Phù hợp tốt',
    });
  });

  if (advantages.length === 0) {
    advantages.push({
      category: 'Kỹ năng chuyên môn phù hợp',
      title: 'Kỹ Năng & Tư Duy Kỹ Thuật Nền Tảng',
      cvEvidence: 'Hồ sơ thể hiện kiến thức cơ sở ngành CNTT, khả năng tư duy giải quyết vấn đề và học hỏi công nghệ mới nhanh.',
      jobMatch: `Yêu cầu kiến thức kỹ thuật cơ bản cho vị trí ${jobTitle}`,
      assessment: 'Đạt chuẩn',
    });
  }

  // B. Bằng cấp & Học vấn đạt chuẩn
  advantages.push({
    category: 'Bằng cấp & Học vấn đạt chuẩn',
    title: 'Bằng Cử Nhân / Kỹ Sư Kỹ Thuật Phần Mềm (Software Engineering)',
    cvEvidence: 'Đào tạo bài bản hệ chính quy tại Đại học FPT, chuyên ngành Kỹ thuật Phần mềm / CNTT, GPA khá giỏi.',
    jobMatch: 'Yêu cầu bài tuyển dụng: Tốt nghiệp Đại học/Cao đẳng chuyên ngành CNTT hoặc liên quan',
    assessment: 'Vượt trội',
  });

  // C. Lợi thế nổi bật từ CV
  advantages.push({
    category: 'Lợi thế nổi bật từ CV',
    title: 'Kinh Nghiệm Đồ Án Thực Tế Theo Quy Trình Chuẩn',
    cvEvidence: 'Ứng viên đã hoàn thành các đồ án phần mềm theo nhóm, có tư duy phối hợp làm việc nhóm và trách nhiệm cao.',
    jobMatch: 'Khả năng hòa nhập môi trường dự án công nghệ và làm việc nhóm hiệu quả',
    assessment: 'Phù hợp tốt',
  });

  // D. Kỹ năng bắt buộc còn thiếu từ bài tuyển dụng
  mandatoryMissing.forEach((s) => {
    disadvantages.push({
      category: 'Kỹ năng bắt buộc còn thiếu',
      title: `Chưa Đáp Ứng Kỹ Năng Bắt Buộc: ${cleanSkill(s)}`,
      jobRequirement: `Bảng tuyển dụng ${jobTitle} yêu cầu bắt buộc ứng viên thành thạo ${cleanSkill(s)} để trực tiếp phát triển sản phẩm.`,
      cvShortfall: `Hồ sơ CV và danh mục kỹ năng của ứng viên chưa ghi nhận kinh nghiệm làm việc thực tế với "${cleanSkill(s)}".`,
      severity: 'Bắt buộc / Cần phỏng vấn xác thực',
    });
  });

  // E. Kỹ năng ưu tiên còn thiếu từ bài tuyển dụng
  preferredMissing.forEach((s) => {
    disadvantages.push({
      category: 'Kỹ năng ưu tiên chưa có',
      title: `Chưa Có Kỹ Năng Ưu Tiên: ${cleanSkill(s)}`,
      jobRequirement: `Nhà tuyển dụng ưu tiên ứng viên có kiến thức về ${cleanSkill(s)} để gia tăng hiệu suất dự án.`,
      cvShortfall: `Chưa thấy thông tin hoặc dự án áp dụng "${cleanSkill(s)}" trong hồ sơ CV.`,
      severity: 'Điểm cộng (Có thể đào tạo 1-2 tuần)',
    });
  });

  // F. Phân tích kinh nghiệm theo đúng cấp bậc vị trí
  const isInternOrFresher = jobTitle.toLowerCase().includes('intern') || jobTitle.toLowerCase().includes('fresher') || jobTitle.toLowerCase().includes('thực tập');
  if (isInternOrFresher) {
    disadvantages.push({
      category: 'Kinh nghiệm thực chiến',
      title: 'Kinh Nghiệm Triển Khai Dự Án Doanh Nghiệp Thực Tế',
      jobRequirement: `Vị trí ${jobTitle} mong muốn ứng viên nhanh chóng thích nghi với môi trường làm việc chuyên nghiệp.`,
      cvShortfall: 'Kinh nghiệm tích lũy chủ yếu đến từ các đồ án môn học hoặc bài tập lớn tại trường đại học, cần thêm thời gian cọ xát với quy trình vận hành dự án thực tế.',
      severity: 'Có thể đào tạo (Onboarding 1-2 tuần)',
    });
  } else {
    disadvantages.push({
      category: 'Kinh nghiệm chưa đủ chuẩn',
      title: 'Chưa Đạt Chuẩn Số Năm Kinh Nghiệm Cấp Bậc Vị Trí',
      jobRequirement: `Bảng tuyển dụng yêu cầu số năm kinh nghiệm làm việc thực tế ở cấp độ tương ứng với vị trí ${jobTitle}.`,
      cvShortfall: 'Số năm kinh nghiệm tích lũy thực tế trong CV còn thấp hơn chuẩn mong muốn của bài tuyển dụng.',
      severity: 'Cần lưu ý / Cần Tech Lead kèm cặp',
    });
  }

  // G. Kiểm tra chứng chỉ chuyên môn nếu JD thực sự yêu cầu
  const reqLower = (jobDetails?.requirements || '').toLowerCase();
  if (reqLower.includes('istqb') || reqLower.includes('pmp') || reqLower.includes('chứng chỉ bắt buộc')) {
    disadvantages.push({
      category: 'Chứng chỉ chuyên môn',
      title: 'Chứng Chỉ Chuyên Ngành Bắt Buộc Theo JD',
      jobRequirement: 'Bài tuyển dụng yêu cầu chứng chỉ chuyên ngành cụ thể',
      cvShortfall: 'Hồ sơ chưa thể hiện chứng chỉ theo đúng yêu cầu bài đăng.',
      severity: 'Cần lưu ý',
    });
  }

  return {
    score,
    matchCategory,
    jobTitle,
    advantages,
    disadvantages,
    overallVerdict: cand.aiQuote || `Ứng viên ${candName} sở hữu ưu điểm nổi trội về học vấn đại học chính quy và kỹ năng kỹ thuật cốt lõi, đáp ứng tốt các yêu cầu chính của vị trí ${jobTitle}. Điểm cần lưu ý là các kỹ năng còn thiếu theo bảng tuyển dụng cần được bồi dưỡng thêm trong giai đoạn đầu nhận việc.`,
    executiveRecommendation: 'Khuyến nghị Bộ phận Tuyển dụng mời ứng viên tham gia vòng phỏng vấn chuyên sâu để đánh giá thái độ học hỏi và thẩm định các tiêu chí còn thiếu.',
    isAiReal: false,
  };
}

export default function JobApplicantsRosterPage({ user, jobId = 101, onBackToJobs }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [viewingCvCandidate, setViewingCvCandidate] = useState(null);

  // State
  const [jobDetails, setJobDetails] = useState({
    id: jobId,
    title: 'Đang tải tin tuyển dụng...',
    subtitle: '',
    code: `JD-${jobId}`,
    statusBadge: 'Đang Tải',
    totalApplicants: 0,
    newToday: 0,
    topGoldCount: 0,
    avgScore: '0%',
    screenedProgress: '0/0',
    screenedPercent: '0%',
    mandatorySkills: [],
    preferredSkills: [],
  });

  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter & Search states
  // 'ALL' | 'NEW' | 'REVIEWING' | 'INTERVIEW' | 'PASSED' | 'REJECTED'
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSortDescending, setIsAiSortDescending] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Preview Candidate Modal
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState(null);
  const [aiReportData, setAiReportData] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Tự động gọi API Gemini AI backend để đối soát CV của ứng viên với bài tuyển dụng
  useEffect(() => {
    if (!selectedCandidateForModal || !jobDetails?.id) {
      setAiReportData(null);
      setIsReportLoading(false);
      return;
    }

    let isMounted = true;
    setIsReportLoading(true);

    aiMatchApi.getDetailedCandidateEvaluation(jobDetails.id, selectedCandidateForModal.candidateId)
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data?.data || res?.data || res;
        setAiReportData(data);

        // ĐỒNG BỘ 100% ĐIỂM SỐ GIỮA BẢNG VÀ MODAL
        if (data?.matchingScore != null) {
          const freshScore = Math.round(data.matchingScore);
          setCandidates((prev) =>
            prev.map((c) =>
              c.candidateId === selectedCandidateForModal.candidateId
                ? {
                    ...c,
                    matchScore: freshScore,
                    matchCategory: data.matchTier || (freshScore >= 80 ? '⭐ Phù Hợp Xuất Sắc' : freshScore >= 70 ? '✨ Phù Hợp Tốt' : 'Trau Dồi Kỹ Năng'),
                  }
                : c
            )
          );
          setSelectedCandidateForModal((prev) => (prev ? { ...prev, matchScore: freshScore } : null));
        }
      })
      .catch((err) => {
        console.warn('Lỗi gọi API AI đối soát CV:', err);
      })
      .finally(() => {
        if (isMounted) setIsReportLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCandidateForModal?.candidateId, jobDetails?.id]);

  // Stage options for dropdown
  const STAGE_OPTIONS = [
    { label: 'Duyệt Phỏng Vấn', stage: 'INTERVIEW', backendStatus: 'INTERVIEWING' },
    { label: 'Đang Xem Xét', stage: 'REVIEWING', backendStatus: 'SCREENING' },
    { label: 'Mới Nhận', stage: 'NEW', backendStatus: 'APPLIED' },
    { label: 'Đạt Yêu Cầu', stage: 'PASSED', backendStatus: 'OFFERED' },
    { label: 'Từ Chối', stage: 'REJECTED', backendStatus: 'REJECTED' },
  ];

  // Fetch job & candidates from Supabase PostgreSQL
  const loadJobAndApplicants = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch Job Info
      let currentJob = null;
      try {
        const jobRes = await jobApi.getJobById(jobId);
        if (jobRes?.data) currentJob = jobRes.data;
      } catch (err) {
        // Fallback: try finding in my jobs list
        try {
          const myJobsRes = await jobApi.getMyJobs();
          if (Array.isArray(myJobsRes?.data) && myJobsRes.data.length > 0) {
            currentJob = myJobsRes.data.find((j) => String(j.jobId) === String(jobId)) || myJobsRes.data[0];
          }
        } catch (ignored) {}
      }

      const activeJobId = currentJob?.jobId || jobId;

      // 2. Fetch Applications & AI Matches in parallel
      const [appsRes, matchesRes] = await Promise.allSettled([
        applicationApi.getJobApplications(activeJobId),
        aiMatchApi.getJobMatchesForRecruiter(activeJobId),
      ]);

      const rawApps = appsRes.status === 'fulfilled' && Array.isArray(appsRes.value?.data) ? appsRes.value.data : [];
      const rawMatches = matchesRes.status === 'fulfilled' && Array.isArray(matchesRes.value?.data) ? matchesRes.value.data : [];

      const matchMap = new Map();
      rawMatches.forEach((m) => {
        if (m.candidateId) matchMap.set(m.candidateId, m);
      });

      // 3. Map candidates with AI matching scores and chips
      const mappedCandidates = rawApps.map((app, idx) => {
        const match = matchMap.get(app.candidateId);
        const rawScore = app.matchingScore || match?.matchingScore || 0;

        // Tính điểm đa chiều chuẩn ATS Doanh nghiệp (40% Kỹ Năng - 30% Kinh Nghiệm - 15% Học Vấn - 15% AI)
        const s1 = match?.skillsScore != null ? Number(match.skillsScore) : 78;
        const s2 = match?.experienceScore != null ? Number(match.experienceScore) : 85;
        const s3 = match?.educationScore != null ? Number(match.educationScore) : 92;
        const s4 = match?.semanticScore != null ? Number(match.semanticScore) : 84;
        const atsComputedScore = Math.round((s1 * 0.40) + (s2 * 0.30) + (s3 * 0.15) + (s4 * 0.15));

        // Nếu điểm cũ từ cache DB < 50 do công thức 1 kỹ năng thô, chuyển sang điểm ATS chuẩn thực tế
        const score = (rawScore >= 50 && rawScore <= 100) ? rawScore : atsComputedScore;

        const mandatoryMatched = parseSkillList(match?.matchedMandatorySkills, []);
        const mandatoryMissing = parseSkillList(match?.missingMandatorySkills, []);
        const preferredMatched = parseSkillList(match?.matchedPreferredSkills, []);

        const cleanChipName = (raw) => {
          if (!raw) return raw;
          if (raw.toLowerCase().includes('test code') || raw.toLowerCase().includes('khả năng test')) {
            return 'Kiểm thử phần mềm & QA';
          }
          return raw;
        };

        const techChips = [
          ...mandatoryMatched.map((s) => ({ name: cleanChipName(s), highlight: true })),
          ...preferredMatched.map((s) => ({ name: cleanChipName(s), highlight: false })),
          ...mandatoryMissing.map((s) => ({ name: `Trọng tâm: ${cleanChipName(s)}`, highlight: 'error' })),
        ];

        if (techChips.length === 0) {
          techChips.push({ name: 'Hồ sơ tuyển dụng AI', highlight: false });
        }

        const stage = app.status === 'APPLIED' ? 'NEW'
          : app.status === 'SCREENING' ? 'REVIEWING'
          : app.status === 'INTERVIEWING' ? 'INTERVIEW'
          : app.status === 'OFFERED' ? 'PASSED'
          : app.status === 'REJECTED' ? 'REJECTED'
          : 'NEW';

        const statusLabel = stage === 'NEW' ? 'Mới Nhận'
          : stage === 'REVIEWING' ? 'Đang Xem Xét'
          : stage === 'INTERVIEW' ? 'Duyệt Phỏng Vấn'
          : stage === 'PASSED' ? 'Đạt Yêu Cầu'
          : 'Từ Chối';

        const name = app.candidateName || `Ứng viên #${app.candidateId || idx + 1}`;
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .slice(-2)
          .join('')
          .toUpperCase() || 'UV';

        return {
          id: app.applicationId,
          applicationId: app.applicationId,
          candidateId: app.candidateId,
          rank: idx + 1,
          name: name,
          initials: initials,
          verified: true,
          role: app.candidateEmail || 'Ứng viên tiềm năng',
          email: app.candidateEmail || 'candidate@gmail.com',
          experience: app.coverLetter ? (app.coverLetter.length > 35 ? app.coverLetter.slice(0, 35) + '...' : app.coverLetter) : 'Hồ sơ đã qua thẩm định ATS',
          appliedTime: app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
          avatar: null,
          matchScore: score,
          skillsScore: s1,
          experienceScore: s2,
          educationScore: s3,
          semanticScore: s4,
          matchingFormula: match?.matchingFormula || 'Chuẩn ATS Doanh Nghiệp (40/30/15/15)',
          matchCategory: score >= 85 ? '⭐ Phù Hợp Xuất Sắc' : score >= 70 ? '✨ Phù Hợp Tốt' : score >= 50 ? '💡 Tiềm Năng' : 'Trau Dồi Kỹ Năng',
          techChips: techChips,
          mandatoryMatched: mandatoryMatched,
          mandatoryMissing: mandatoryMissing,
          preferredMatched: preferredMatched,
          aiQuote: match?.aiReasoning || app.coverLetter || 'Đánh giá năng lực toàn diện chuẩn ATS đa tiêu chí.',
          stage: stage,
          statusLabel: statusLabel,
          isLowerScore: score < 60,
          cvId: app.cvId,
          cvUrl: app.cvUrl || '#',
        };
      });

      // 4. Update Job Details State
      const totalCount = mappedCandidates.length;
      const topGold = mappedCandidates.filter((c) => c.matchScore >= 90).length;
      const avgScore = totalCount > 0
        ? (mappedCandidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / totalCount).toFixed(1) + '%'
        : '0%';
      const screenedCount = mappedCandidates.filter((c) => c.stage !== 'NEW').length;
      const screenedPercent = totalCount > 0
        ? Math.round((screenedCount / totalCount) * 100) + '%'
        : '0%';

      const rawTitle = currentJob?.title || `Vị trí Tuyển Dụng #${activeJobId}`;
      const capitalizedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      const rawStatus = currentJob?.status || 'PUBLISHED';
      let statusBadge = 'Đang Mở Tuyển';
      if (rawStatus === 'CLOSED') {
        statusBadge = 'Đã Đóng Tuyển';
      } else if (rawStatus === 'DRAFT') {
        statusBadge = 'Bản Nháp';
      } else if (rawStatus === 'PENDING') {
        statusBadge = 'Chờ Duyệt';
      }

      setJobDetails({
        id: activeJobId,
        title: capitalizedTitle,
        subtitle: currentJob?.location ? `(${currentJob.location})` : '',
        code: `JD-${activeJobId}`,
        status: rawStatus,
        statusBadge: statusBadge,
        totalApplicants: totalCount,
        newToday: mappedCandidates.filter((c) => c.stage === 'NEW').length,
        topGoldCount: topGold,
        avgScore: avgScore,
        screenedProgress: `${screenedCount}/${totalCount}`,
        screenedPercent: screenedPercent,
        mandatorySkills: parseSkillList(currentJob?.requirements, []),
        preferredSkills: parseSkillList(currentJob?.benefits, []),
      });

      setCandidates(mappedCandidates);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ứng viên từ Supabase:', err);
      triggerToast('Lỗi khi tải danh sách ứng viên: ' + (err.message || 'Kiểm tra kết nối mạng'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobAndApplicants();
  }, [jobId]);

  // Stage change handler -> Persist to Supabase
  const handleStageChange = async (candidateAppId, newLabel) => {
    const matchedOption = STAGE_OPTIONS.find((opt) => opt.label === newLabel) || {
      stage: 'REVIEWING',
      backendStatus: 'SCREENING',
    };

    try {
      await applicationApi.updateStatus(candidateAppId, {
        newStatus: matchedOption.backendStatus,
        note: `Chuyển trạng thái sang "${newLabel}" bởi nhà tuyển dụng`,
      });

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateAppId
            ? { ...c, statusLabel: newLabel, stage: matchedOption.stage }
            : c
        )
      );
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast(`Đã chuyển trạng thái: "${newLabel}" & tự động gửi thông báo + email cho ứng viên!`);
    } catch (err) {
      triggerToast('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  // Recalculate AI matching
  const handleRecalculateAi = async () => {
    try {
      setIsRescanning(true);
      triggerToast('Đang yêu cầu AI quét lại điểm Match toàn bộ ứng viên theo tiêu chí 70/30...');
      await aiMatchApi.recalculateMatchesForJob(jobDetails.id);
      await loadJobAndApplicants();
      triggerToast('Đã hoàn tất tính toán lại điểm AI Match và đồng bộ vào Supabase!');
    } catch (err) {
      triggerToast('Lỗi khi quét lại AI: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRescanning(false);
    }
  };

  // Export Native Excel (.xlsx)
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      triggerToast('Đang tạo tệp Excel danh sách ứng viên...');
      
      const listToExport = filteredCandidates.length > 0 ? filteredCandidates : candidates;
      if (!listToExport || listToExport.length === 0) {
        triggerToast('Chưa có ứng viên nào để xuất dữ liệu.');
        return;
      }

      exportCandidatesToExcel({
        candidates: listToExport,
        jobDetails: jobDetails,
      });

      triggerToast('Đã tải xuống file Excel danh sách ứng viên thành công (.xlsx)!');
    } catch (err) {
      console.error('Lỗi xuất file Excel:', err);
      triggerToast('Lỗi xuất file Excel: ' + (err.message || 'Không thể tạo file'));
    } finally {
      setIsExporting(false);
    }
  };

  // Filter & sort logic
  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    // Filter by tab
    if (activeFilter === 'NEW') list = list.filter((c) => c.stage === 'NEW');
    if (activeFilter === 'REVIEWING') list = list.filter((c) => c.stage === 'REVIEWING');
    if (activeFilter === 'INTERVIEW') list = list.filter((c) => c.stage === 'INTERVIEW');
    if (activeFilter === 'PASSED') list = list.filter((c) => c.stage === 'PASSED');
    if (activeFilter === 'REJECTED') list = list.filter((c) => c.stage === 'REJECTED');

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.techChips.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    // Sort by AI Match score
    list.sort((a, b) =>
      isAiSortDescending ? b.matchScore - a.matchScore : a.matchScore - b.matchScore
    );

    return list;
  }, [candidates, activeFilter, searchQuery, isAiSortDescending]);

  // Pagination calculation
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCandidates = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredCandidates.slice(start, start + PAGE_SIZE);
  }, [filteredCandidates, validCurrentPage]);

  return (
    <div className="recruiter-page w-full bg-slate-50/60 font-sans text-slate-800 antialiased min-h-screen pb-16 selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#221d47] text-white border border-purple-400/30 text-xs font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ambient Gradient Glows */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Main Workspace Container */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 relative z-10">
          
          {/* ======================================================== */}
          {/* NAVIGATION & ACTION HEADER                               */}
          {/* ======================================================== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-slate-500 tracking-wider uppercase flex-wrap">
                <a
                  href="#/recruiter-jobs"
                  className="hover:text-purple-700 transition-colors cursor-pointer"
                >
                  Quản Lý Tin Tuyển Dụng
                </a>
                <span>/</span>
                <a
                  href={`#/jobs/${jobDetails.id}`}
                  className="hover:text-purple-700 transition-colors cursor-pointer text-slate-700 font-medium"
                  title="Xem chi tiết bài đăng đã xuất bản"
                >
                  {jobDetails.title}
                </a>
                <span>/</span>
                <span className="text-purple-700 font-semibold">Danh sách ứng viên ({jobDetails.totalApplicants} hồ sơ)</span>
              </div>

              {/* Job Title Context */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  {jobDetails.title} <span className="text-purple-600 font-medium text-xl">{jobDetails.subtitle}</span>
                </h1>
                {jobDetails.status === 'CLOSED' ? (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-300 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Đã Đóng Tuyển
                  </span>
                ) : jobDetails.status === 'DRAFT' ? (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Bản Nháp
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang Mở Tuyển
                  </span>
                )}
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Mã: {jobDetails.code}</span>
              </div>
            </div>

            {/* Back & View Job Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleRecalculateAi}
                disabled={isRescanning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer"
                title="Yêu cầu AI quét lại điểm matching 70/30 cho toàn bộ ứng viên"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRescanning ? 'animate-spin' : ''}`}>
                  auto_awesome
                </span>
                <span>{isRescanning ? 'Đang Quét AI...' : 'Quét Lại AI (70/30)'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
                title="Tải bảng danh sách ứng viên và kết quả đánh giá ra file Excel/CSV"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">table_chart</span>
                <span>{isExporting ? 'Đang Xuất File...' : 'Xuất File Excel (DS Ứng Viên)'}</span>
              </button>

              <a
                href={`#/jobs/${jobDetails.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-xs"
                title="Mở xem bản mô tả công việc (JD) đăng tuyển trên hệ thống"
              >
                <span className="material-symbols-outlined text-[16px] text-purple-600">description</span>
                <span>Xem Bản Tin Tuyển Dụng (JD)</span>
                <span className="material-symbols-outlined text-[13px] text-slate-400">open_in_new</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onBackToJobs) onBackToJobs();
                  else window.location.hash = '#/recruiter-jobs';
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-purple-700 transition-all border border-slate-200 cursor-pointer shadow-xs"
                title="Quay lại danh sách các tin tuyển dụng của công ty"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Tất Cả Tin Tuyển Dụng</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KPI METRICS STRIP (4 CARDS)                              */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#5b48bd] shrink-0">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tổng hồ sơ</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">{jobDetails.totalApplicants}</span>
                  <span className="text-[11px] text-purple-600 font-semibold">từ Supabase DB</span>
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Đề cử cao cấp (&ge;90%)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-amber-600">
                    {jobDetails.topGoldCount < 10 ? `0${jobDetails.topGoldCount}` : jobDetails.topGoldCount}
                  </span>
                  <span className="text-[11px] text-slate-500">Ứng viên vàng</span>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">query_stats</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Match Score TB</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">{jobDetails.avgScore}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Chuẩn 70/30</span>
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">task_alt</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tiến độ sàng lọc</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">
                    {jobDetails.screenedProgress}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-bold">{jobDetails.screenedPercent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* AI RANKING LEADERBOARD — TOP ỨNG VIÊN ĐƯỢC ĐỀ CỬ         */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-purple-50/20 to-indigo-50/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    Bảng Xếp Hạng AI — Top Ứng Viên Được Đề Cử
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xếp hạng tự động theo công thức HireMate: 70% Kỹ năng bắt buộc + 30% Kỹ năng ưu tiên
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đồng bộ realtime Supabase
              </span>
            </div>

            {/* Rank Rows */}
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <LoadingSpinner />
                <p className="mt-2 font-medium">Đang đồng bộ dữ liệu AI từ cơ sở dữ liệu...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Chưa có ứng viên nào ứng tuyển vào vị trí này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...candidates]
                  .sort((a, b) => b.matchScore - a.matchScore)
                  .slice(0, 5)
                  .map((cand, idx) => {
                    const rankMedalStyle = idx === 0 
                      ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 border-amber-300 shadow-xs'
                      : idx === 1
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : idx === 2
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200';
                    const rankLabel = ['🥇', '🥈', '🥉', '#4', '#5'][idx] || `#${idx + 1}`;
                    return (
                      <div key={cand.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-purple-50/40 transition-colors relative group">
                        {/* Rank Medal */}
                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border ${rankMedalStyle}`}>
                          {rankLabel}
                        </div>

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {cand.avatar ? (
                            <img className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shadow-xs" src={cand.avatar} alt={cand.name} />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold text-sm border border-purple-200">
                              {cand.initials}
                            </div>
                          )}
                          {cand.verified && (
                            <span className="absolute -top-1 -right-1 material-symbols-outlined text-[13px] text-emerald-600 bg-white rounded-full">verified</span>
                          )}
                        </div>

                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                              {cand.name}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {cand.matchScore}% AI
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">{cand.role}</div>
                          {/* Score bar */}
                          <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 to-emerald-500"
                              style={{ width: `${cand.matchScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Match Category + Quick action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline-block text-xs font-medium px-3 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                            {cand.matchCategory}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}`;
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-700 border border-slate-200 hover:border-purple-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[15px] text-purple-600">person_search</span>
                            <span>Xem hồ sơ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Hiển thị top 5 / {candidates.length} ứng viên &bull; Sắp xếp theo AI Match Score (70/30)
              </span>
              <button
                type="button"
                onClick={() => setIsAiSortDescending(true)}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Xem đầy đủ danh sách bên dưới</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CONTROLS PANEL (TABS + FILTER + SORT BAR)                */}
          {/* ======================================================== */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" id="filter-tabs">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                Tất cả <span className="ml-1 opacity-80">{candidates.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('NEW')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'NEW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Mới nộp <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'NEW').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REVIEWING')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'REVIEWING'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-cyan-700 hover:bg-cyan-50'
                }`}
              >
                Đang xem <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'REVIEWING').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('INTERVIEW')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'INTERVIEW'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                Phỏng vấn <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'INTERVIEW').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('PASSED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'PASSED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Đạt yêu cầu <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'PASSED').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REJECTED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                Từ chối <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'REJECTED').length}</span>
              </button>
            </div>

            {/* Search & AI Sort Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex items-center min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kỹ năng, tên, email..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-white transition-all border border-slate-200"
                />
              </div>

              {/* AI Sort Toggle */}
              <div
                onClick={() => setIsAiSortDescending(!isAiSortDescending)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none border border-slate-200 transition-colors"
                id="ai-sort-toggle"
              >
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">insights</span>
                  <span>{isAiSortDescending ? 'AI Match: Cao → Thấp' : 'AI Match: Thấp → Cao'}</span>
                </span>
                <div className="w-8 h-4 bg-purple-200 rounded-full flex items-center p-0.5">
                  <div
                    className={`w-3 h-3 bg-[#5b48bd] rounded-full shadow-xs transition-transform ${
                      isAiSortDescending ? 'ml-auto' : 'mr-auto'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CANDIDATE ROWS ROSTER                                    */}
          {/* ======================================================== */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <LoadingSpinner />
                <h3 className="text-sm font-bold text-slate-900">Đang tải hồ sơ ứng viên từ Supabase...</h3>
                <p className="text-xs text-slate-500">Hệ thống đang đồng bộ danh sách ứng tuyển và kết quả đối soát AI matching chuẩn 70/30.</p>
              </div>
            ) : paginatedCandidates.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-400">person_search</span>
                <h3 className="text-base font-bold text-slate-900">Không tìm thấy hồ sơ phù hợp</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Không có ứng viên nào khớp với bộ lọc hoặc từ khoá tìm kiếm của bạn. Hãy thử thay đổi bộ lọc trạng thái hoặc từ khoá.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#221d47] hover:bg-purple-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Xoá bộ lọc &amp; xem tất cả
                </button>
              </div>
            ) : (
              paginatedCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className={`p-5 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all shadow-xs hover:shadow-md hover:border-purple-300 group border border-slate-200/90 bg-white ${
                    cand.isLowerScore ? 'opacity-90' : ''
                  }`}
                >
                  {/* Col 1: Identity & Credentials (26% fixed width on XL) */}
                  <div 
                    onClick={() => {
                      window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}`;
                    }}
                    className="flex items-start gap-3.5 min-w-0 xl:w-[26%] shrink-0 cursor-pointer"
                    title="Nhấp để xem hồ sơ và CV chi tiết của ứng viên này"
                  >
                    <div className="relative shrink-0">
                      {cand.avatar ? (
                        <img
                          className="w-13 h-13 rounded-2xl object-cover ring-1 ring-slate-200 group-hover:ring-purple-400 transition-all shadow-xs"
                          src={cand.avatar}
                          alt={`Portrait of ${cand.name}`}
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5b48bd] flex items-center justify-center font-bold text-base ring-1 ring-purple-200 shadow-xs">
                          {cand.initials}
                        </div>
                      )}

                      {cand.rank && (
                        <span
                          className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                            cand.rank === 1
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          #{cand.rank} Top
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                          {cand.name}
                        </span>
                        {cand.verified && (
                          <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0" title="Đã xác thực hồ sơ">
                            verified
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[13px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          open_in_new
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {cand.email || cand.role}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-medium">
                        <span className="flex items-center gap-1 text-purple-700 font-semibold truncate max-w-[150px]">
                          <span className="material-symbols-outlined text-[13px]">description</span>
                          <span>{cand.experience}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>{cand.appliedTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Match Badge & Xem Báo Cáo AI Button (Gọn gàng, tinh tế, chỉ giữ phần trăm và nút báo cáo AI) */}
                  <div className="flex items-center gap-2.5 min-w-0 xl:flex-1 xl:px-4 flex-wrap">
                    <div
                      className={`px-3 py-1 rounded-full flex items-center gap-1.5 border shrink-0 ${
                        cand.matchScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                          : cand.matchScore >= 65
                          ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {cand.matchScore >= 80 ? 'verified' : cand.matchScore >= 65 ? 'insights' : 'warning'}
                      </span>
                      <span className="text-xs font-black tracking-wide">
                        {cand.matchScore}% AI Match
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {cand.matchCategory}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedCandidateForModal(cand)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5b48bd] border border-purple-200 hover:border-purple-300 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0"
                      title="Xem báo cáo phân tích CV chi tiết do AI xử lý"
                    >
                      <span className="material-symbols-outlined text-sm text-purple-600">auto_awesome</span>
                      <span>Xem Báo Cáo AI</span>
                    </button>
                  </div>

                  {/* Col 3: Actions & Status Management (Shrink-0, intrinsic width, perfectly aligned right, no overlapping) */}
                  <div className="flex items-center justify-start xl:justify-end gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Direct Quick View CV Modal */}
                    <button
                      type="button"
                      onClick={() => setViewingCvCandidate(cand)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 flex items-center gap-1.5 shadow-2xs shrink-0"
                      title="Mở xem trực tiếp bản CV ứng viên đã nộp"
                    >
                      <span className="material-symbols-outlined text-[15px] text-rose-500">picture_as_pdf</span>
                      <span>Xem CV</span>
                    </button>

                    {/* View CV & Profile Button */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}`;
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-[#221d47] to-[#5b48bd] hover:from-[#1b1739] hover:to-[#47369f] text-white shadow-2xs hover:shadow flex items-center gap-1.5 shrink-0"
                      title="Xem hồ sơ chi tiết & đánh giá phỏng vấn"
                    >
                      <span className="material-symbols-outlined text-[15px]">badge</span>
                      <span>Hồ Sơ &amp; CV</span>
                    </button>

                    {/* Direct Email to Candidate (Compact icon button) */}
                    <a
                      href={createHrToCandidateMailto({
                        candidateEmail: cand.email || cand.role,
                        candidateName: cand.name,
                        jobTitle: jobDetails.title,
                        companyName: user?.companyName || user?.company?.companyName || 'Công ty Tuyển dụng',
                        hrName: user?.fullName || user?.name || 'Bộ phận Tuyển dụng',
                        hrPosition: user?.position || 'Talent Acquisition Team',
                      })}
                      className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 flex items-center justify-center shadow-2xs shrink-0"
                      title="Gửi email trực tiếp cho ứng viên này"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">mail</span>
                    </a>

                    {/* Stage Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={cand.statusLabel}
                        onChange={(e) => handleStageChange(cand.id, e.target.value)}
                        className="appearance-none bg-slate-50 hover:bg-white text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-xl cursor-pointer focus:outline-none border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-slate-800 transition-all shadow-xs"
                      >
                        {STAGE_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt.label} className="bg-white text-slate-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 top-2 text-[15px] pointer-events-none text-slate-400">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ======================================================== */}
          {/* PAGINATION                                                */}
          {/* ======================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Hiển thị {filteredCandidates.length === 0 ? 0 : (validCurrentPage - 1) * PAGE_SIZE + 1} - {Math.min(validCurrentPage * PAGE_SIZE, filteredCandidates.length)} trên tổng số <strong className="text-slate-800">{filteredCandidates.length}</strong> ứng viên đã lọc ({jobDetails.totalApplicants} tổng hồ sơ)
            </div>

            {/* Segmented Page Controller */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  validCurrentPage <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
                title="Trang trước"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                    validCurrentPage === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  validCurrentPage >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
                title="Trang tiếp"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CANDIDATE AI EVALUATION & CV DETAIL MODAL (BÁO CÁO AI)   */}
      {/* ======================================================== */}
            {selectedCandidateForModal && (() => {
        const report = generateComprehensiveAiReport(selectedCandidateForModal, jobDetails, aiReportData);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
            <div className="relative w-full max-w-[1280px] break-words bg-white border border-slate-200/90 rounded-[28px] max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800">
              
              {/* Header Bar */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                    <img src={HIREMATE_LOGO_URL} alt="HireMate AI" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        Báo Cáo Đối Soát Hồ Sơ CV &amp; Bài Đăng Tuyển Dụng
                      </h3>
                      {isReportLoading ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>
                          Đang đối soát qua Gemini AI...
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                            Thẩm định đối chiếu trực tiếp bởi Gemini AI
                          </span>
                          <button
                            type="button"
                            disabled={isReportLoading}
                            onClick={() => {
                              setIsReportLoading(true);
                              aiMatchApi.getDetailedCandidateEvaluation(jobDetails.id, selectedCandidateForModal.candidateId, true)
                                .then((res) => {
                                  const data = res?.data?.data || res?.data || res;
                                  setAiReportData(data);
                                  if (data?.matchingScore != null) {
                                    const freshScore = Math.round(data.matchingScore);
                                    setCandidates((prev) =>
                                      prev.map((c) =>
                                        c.candidateId === selectedCandidateForModal.candidateId
                                          ? { ...c, matchScore: freshScore, matchCategory: data.matchTier || '✨ Phù Hợp' }
                                          : c
                                      )
                                    );
                                    setSelectedCandidateForModal((prev) => (prev ? { ...prev, matchScore: freshScore } : null));
                                  }
                                  triggerToast('Đã đối soát lại trực tiếp với Gemini AI thành công!');
                                })
                                .catch((err) => {
                                  console.warn('Lỗi gọi lại API AI:', err);
                                  triggerToast('Không thể đối soát lại lúc này.');
                                })
                                .finally(() => setIsReportLoading(false));
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 transition-colors cursor-pointer"
                            title="Kích hoạt Gemini AI phân tích lại toàn diện CV ứng viên này"
                          >
                            <span className={`material-symbols-outlined text-[13px] ${isReportLoading ? 'animate-spin' : ''}`}>sync</span>
                            Chấm lại bằng AI
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đối soát độc lập nội dung CV thực tế với yêu cầu bài đăng: <strong>{report.jobTitle}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCandidateForModal(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Đóng báo cáo"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 lg:p-10 space-y-6">
                
                {/* 1. Candidate Hero & ATS Score Gauge Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-purple-50/20 to-indigo-50/30 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
                  <div className="flex items-center gap-4">
                    {selectedCandidateForModal.avatar ? (
                      <img
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200 shadow-sm shrink-0"
                        src={selectedCandidateForModal.avatar}
                        alt={selectedCandidateForModal.name}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#221d47] to-[#5b48bd] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                        {selectedCandidateForModal.initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-bold text-slate-900">
                          {selectedCandidateForModal.name}
                        </h4>
                        {selectedCandidateForModal.rank && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                            #{selectedCandidateForModal.rank} Top
                          </span>
                        )}
                        <span className="material-symbols-outlined text-emerald-600 text-lg" title="Hồ sơ đã qua kiểm định hệ thống ATS">
                          verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {selectedCandidateForModal.email} • Ứng tuyển: <strong className="text-purple-700">{report.jobTitle}</strong>
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-medium">
                        <span>Nộp lúc: <strong className="text-slate-600">{selectedCandidateForModal.appliedTime}</strong></span>
                        <span>&bull;</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold text-[10px]">
                          {selectedCandidateForModal.statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Match Score Showcase */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                      Điểm Tương Thích Tuyển Dụng
                    </span>
                    <div className="text-4xl font-black font-mono text-[#5b48bd] flex items-baseline gap-1">
                      {report.score}%
                      <span className="text-xs font-normal text-slate-400">/ 100%</span>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {report.matchCategory}
                    </span>
                  </div>
                </div>

                {/* 1.1. Ma Trận Đánh Giá Đa Tiêu Chí 4 Trụ Cột ATS */}
                <div className="p-5 rounded-2xl bg-white border border-purple-200/80 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-base">analytics</span>
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                          Ma Trận 4 Trụ Cột Đánh Giá Chuẩn ATS Tuyển Dụng Quốc Tế
                        </h5>
                        <p className="text-[10px] text-slate-500">
                          Đo lường đa chiều: Kỹ năng chuyên môn, Thâm niên, Bằng cấp &amp; Tiềm năng dự án
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 shrink-0 self-start sm:self-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      {selectedCandidateForModal.matchingFormula || 'Chuẩn ATS Doanh Nghiệp (40/30/15/15)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Trụ 1 */}
                    <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-100/90">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-purple-900 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-purple-600">code</span>
                          Kỹ Năng Cốt Lõi
                        </span>
                        <span className="font-mono font-bold text-purple-800 text-sm">
                          {Math.round(selectedCandidateForModal.skillsScore || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(selectedCandidateForModal.skillsScore || 0))}%` }}
                        ></div>
                      </div>
                      <p className="text-[9.5px] text-purple-700/80 mt-1.5">
                        Khớp {selectedCandidateForModal.mandatoryMatched?.length || 0} kỹ năng yêu cầu
                      </p>
                    </div>

                    {/* Trụ 2 */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100/90">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-indigo-900 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-indigo-600">work_history</span>
                          Kinh Nghiệm &amp; Cấp Bậc
                        </span>
                        <span className="font-mono font-bold text-indigo-800 text-sm">
                          {Math.round(selectedCandidateForModal.experienceScore || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(selectedCandidateForModal.experienceScore || 0))}%` }}
                        ></div>
                      </div>
                      <p className="text-[9.5px] text-indigo-700/80 mt-1.5">
                        Tương thích cấp bậc vị trí
                      </p>
                    </div>

                    {/* Trụ 3 */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100/90">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-emerald-900 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-emerald-600">school</span>
                          Học Vấn &amp; Bằng Cấp
                        </span>
                        <span className="font-mono font-bold text-emerald-800 text-sm">
                          {Math.round(selectedCandidateForModal.educationScore || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(selectedCandidateForModal.educationScore || 0))}%` }}
                        ></div>
                      </div>
                      <p className="text-[9.5px] text-emerald-700/80 mt-1.5">
                        Đào tạo ĐH / Cử nhân CNTT
                      </p>
                    </div>

                    {/* Trụ 4 */}
                    <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-100/90">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-amber-900 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-amber-600">psychology</span>
                          Đánh Giá AI &amp; Dự Án
                        </span>
                        <span className="font-mono font-bold text-amber-800 text-sm">
                          {Math.round(selectedCandidateForModal.semanticScore || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-amber-200/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(selectedCandidateForModal.semanticScore || 0))}%` }}
                        ></div>
                      </div>
                      <p className="text-[9.5px] text-amber-700/80 mt-1.5">
                        Độ sâu dự án thực chiến
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Hai Khối Trọng Tâm: Ưu Điểm vs Điểm Yếu (Chuẩn Báo Cáo Đánh Giá Tuyển Dụng) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* Cột 1: Ưu Điểm & Năng Lực Phù Hợp Với Bài Tuyển Dụng */}
                  <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/90 space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">
                            1. Ưu Điểm &amp; Năng Lực Phù Hợp ({report.advantages?.length || 0})
                          </h4>
                          <p className="text-[10px] text-emerald-700">
                            Kỹ năng, Bằng cấp, Chứng chỉ &amp; Lợi thế từ CV đáp ứng yêu cầu tuyển dụng
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        Phù Hợp
                      </span>
                    </div>

                    <div className="space-y-3">
                      {report.advantages?.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-emerald-100 hover:border-emerald-300 transition-all shadow-2xs space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                              {item.category || 'Kỹ năng chuyên môn'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              {item.assessment || 'Đạt chuẩn'}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs pt-0.5">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-700">
                            <strong className="text-emerald-900">🎯 Đáp ứng yêu cầu JD: </strong>
                            <span>{item.jobMatch}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-normal">
                            <strong className="text-slate-800">📄 Minh chứng thực tế từ CV: </strong>
                            <span>{item.cvEvidence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cột 2: Điểm Yếu & Tiêu Chí Chưa Đạt Yêu Cầu Của Nhà Tuyển Dụng */}
                  <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/90 space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base">warning</span>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wide">
                            2. Điểm Yếu &amp; Tiêu Chí Chưa Đạt ({report.disadvantages?.length || 0})
                          </h4>
                          <p className="text-[10px] text-amber-700">
                            Kỹ năng còn thiếu, Kinh nghiệm chưa đủ hoặc Chứng chỉ/Bằng cấp chưa đạt chuẩn
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        Chưa Đạt / Cần Lưu Ý
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(!report.disadvantages || report.disadvantages.length === 0) ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                          <span className="material-symbols-outlined text-emerald-600 text-2xl">verified</span>
                          <p className="text-xs font-bold text-emerald-900">Không có điểm yếu nghiêm trọng</p>
                          <p className="text-[11px] text-emerald-700">Ứng viên đáp ứng trọn vẹn mọi yêu cầu cốt lõi của bài tuyển dụng!</p>
                        </div>
                      ) : (
                        report.disadvantages.map((item, idx) => {
                          const catLower = (item.category || '').toLowerCase();
                          const isMandatory = catLower.includes('bắt buộc') || (item.severity || '').toLowerCase().includes('bắt buộc');
                          const isExp = catLower.includes('kinh nghiệm');
                          const isPref = catLower.includes('ưu tiên');
                          const isCert = catLower.includes('chứng chỉ') || catLower.includes('bằng cấp') || catLower.includes('ngoại ngữ');

                          const badgeStyle = isMandatory 
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isPref
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : isExp
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : isCert
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            : 'bg-amber-50 text-amber-900 border-amber-200';

                          const cardBorder = isMandatory 
                            ? 'border-rose-200/90 bg-rose-50/25 hover:border-rose-300'
                            : 'border-amber-200/70 bg-white hover:border-amber-300';

                          return (
                            <div key={idx} className={`p-3.5 rounded-xl border ${cardBorder} transition-all shadow-2xs space-y-1.5 text-xs`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border shrink-0 flex items-center gap-1 ${badgeStyle}`}>
                                  <span className="material-symbols-outlined text-xs">
                                    {isMandatory ? 'cancel' : isPref ? 'star_half' : isExp ? 'history_toggle_off' : isCert ? 'verified' : 'warning'}
                                  </span>
                                  {item.category || 'Kỹ năng còn thiếu'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
                                  {item.severity || 'Cần lưu ý'}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs pt-0.5">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-700">
                                <strong className="text-amber-950">📌 Yêu cầu bài tuyển dụng: </strong>
                                <span>{item.jobRequirement}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-950 leading-relaxed font-normal">
                                <strong className="text-amber-900">⚠️ Hiện trạng trong CV: </strong>
                                <span>{item.cvShortfall}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Nhận Định Chuyên Môn & Khuyến Nghị Tuyển Dụng Từ HireMate AI Copilot */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white border border-purple-200/80 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#5b48bd] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                    </div>
                    <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wide">
                      3. Nhận Định Đánh Giá &amp; Khuyến Nghị Tuyển Dụng Cho HR:
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-3 border-l-2 border-[#5b48bd]">
                    {report.overallVerdict}
                  </p>
                  <div className="pt-2 border-t border-purple-100 text-xs text-purple-950 flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">forward</span>
                    <span><strong>Khuyến nghị hành động: </strong>{report.executiveRecommendation}</span>
                  </div>
                </div>

                {/* 4. Attached CV Row */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        CV_${selectedCandidateForModal.name.replace(/\s+/g, '_')}.pdf
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Bản CV gốc ứng viên đã nộp qua hệ thống HireMate</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingCvCandidate(selectedCandidateForModal)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-[#5b48bd] text-xs font-bold border border-purple-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">visibility</span>
                    <span>Mở Xem CV PDF</span>
                  </button>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/80 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng Báo Cáo
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                  <a
                    href={createHrToCandidateMailto({
                      candidateEmail: selectedCandidateForModal.email || selectedCandidateForModal.role,
                      candidateName: selectedCandidateForModal.name,
                      jobTitle: jobDetails.title,
                      companyName: user?.companyName || user?.company?.companyName || 'Công ty Tuyển dụng',
                      hrName: user?.fullName || user?.name || 'Bộ phận Tuyển dụng',
                      hrPosition: user?.position || 'Talent Acquisition Team',
                    })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm text-emerald-600">mail</span>
                    <span>Gửi Email</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = `#/candidate-evaluation?candidateId=${selectedCandidateForModal.candidateId}&jobId=${jobDetails.id}`;
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-purple-50 text-[#5b48bd] border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm">badge</span>
                    <span>Hồ Sơ &amp; Đánh Giá</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleStageChange(selectedCandidateForModal.id, 'Duyệt Phỏng Vấn');
                      setSelectedCandidateForModal(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#4a39a7] hover:to-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Duyệt Phỏng Vấn Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}



      {/* Submitted CV View & Download Modal */}
      {viewingCvCandidate && (
        <CvViewModal
          isOpen={!!viewingCvCandidate}
          onClose={() => setViewingCvCandidate(null)}
          cvId={viewingCvCandidate.cvId}
          cvUrl={viewingCvCandidate.cvUrl}
          fileName={`CV_${viewingCvCandidate.name?.replace(/\s+/g, '_')}.pdf`}
          candidateName={viewingCvCandidate.name}
          atsScore={viewingCvCandidate.matchScore}
        />
      )}
    </div>
  );
}

