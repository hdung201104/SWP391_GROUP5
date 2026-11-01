const cleanCoverLetter = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/\[CV_TEMPLATE:[^\]]*\]/gi, '')
    .replace(/\[Định dạng nộp:[^\]]*\]/gi, '')
    .trim();
};
import React, { useState, useEffect, useMemo } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { jobApi, applicationApi, aiMatchApi, interviewApi, companyApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';
import { createHrToCandidateMailto } from '../utils/emailUtils';
import CvViewModal from '../components/common/CvViewModal';
import { HIREMATE_LOGO_URL } from '../constants/branding';
import { exportCandidatesToExcel } from '../utils/excelExportUtils';
import paymentApi from '../api/paymentApi';
import { parseSubscriptionPermissions } from '../utils/subscriptionPerms';

export const STAGE_CONFIG = {
  NEW: { label: 'Mới Nhận', backendStatus: 'APPLIED', color: 'emerald' },
  REVIEWING: { label: 'Đang Xem Xét', backendStatus: 'SCREENING', color: 'cyan' },
  INTERVIEW: { label: 'Duyệt Phỏng Vấn', backendStatus: 'INTERVIEWING', color: 'purple' },
  PASSED: { label: 'Đạt Yêu Cầu (Offer)', backendStatus: 'OFFERED', color: 'indigo' },
  HIRED: { label: 'Trúng Tuyển (Hired)', backendStatus: 'HIRED', color: 'teal' },
  REJECTED: { label: 'Từ Chối', backendStatus: 'REJECTED', color: 'rose' },
  WITHDRAWN: { label: 'Ứng Viên Đã Rút Đơn', backendStatus: 'REJECTED', color: 'amber' },
};

export const mapStatusToStage = (status, isWithdrawn = false) => {
  if (status === 'APPLIED') return 'NEW';
  if (status === 'SCREENING' || status === 'SHORTLISTED') return 'REVIEWING';
  if (status === 'INTERVIEWING') return 'INTERVIEW';
  if (status === 'OFFERED') return 'PASSED';
  if (status === 'HIRED') return 'HIRED';
  if (status === 'REJECTED') return isWithdrawn ? 'WITHDRAWN' : 'REJECTED';
  return 'NEW';
};

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
  const eduInfo = cand.education || cand.university || cand.headline || 'Đại học / Chuyên ngành liên quan';
  advantages.push({
    category: 'Bằng cấp & Học vấn đạt chuẩn',
    title: cand.education ? `Học Vấn: ${cand.education}` : 'Bằng Cử Nhân / Kỹ Sư Chuyên Ngành Phù Hợp',
    cvEvidence: cand.education || cand.university
      ? `Hồ sơ ứng viên thể hiện nền tảng học vấn từ: ${cand.education || cand.university}.`
      : 'Ứng viên có nền tảng học vấn và đào tạo phù hợp với tiêu chuẩn yêu cầu của vị trí công việc.',
    jobMatch: 'Yêu cầu bài tuyển dụng: Tốt nghiệp Đại học/Cao đẳng chuyên ngành liên quan hoặc tương đương',
    assessment: 'Đạt chuẩn',
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
  const [scoreFilter, setScoreFilter] = useState('ALL'); // 'ALL' | 'EXCELLENT' | 'GOOD' | 'LOW'
  const [expFilter, setExpFilter] = useState('ALL'); // 'ALL' | 'INTERN' | 'JUNIOR' | 'MIDDLE' | 'SENIOR'
  const [skillFilter, setSkillFilter] = useState('ALL'); // 'ALL' | skill
  const [isAiSortDescending, setIsAiSortDescending] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Recruiter Subscription & Feature Gating
  const [recruiterSubscription, setRecruiterSubscription] = useState(null);
  const [showRecruiterUpgradeModal, setShowRecruiterUpgradeModal] = useState(false);
  const [recruiterUpgradeContent, setRecruiterUpgradeContent] = useState({
    title: '',
    message: '',
    targetPlan: 'Hiring Starter'
  });

  useEffect(() => {
    paymentApi.getMySubscription()
      .then((res) => {
        const sub = res?.data?.data || res?.data;
        if (sub && sub.active) {
          setRecruiterSubscription(sub);
        }
      })
      .catch((e) => console.warn('Could not load recruiter subscription in roster', e));
  }, []);

  const currentUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('hiremate_user') || 'null');
    } catch {
      return null;
    }
  })();

  const canManageJob = useMemo(() => {
    if (!currentUser || currentUser?.role === 'ADMIN') return true;
    if (currentUser?.isHeadRecruiter) return true;
    const currentUserId = currentUser?.userId || currentUser?.id;
    const jobRecruiterId = jobDetails?.recruiterId || jobDetails?.raw?.recruiterId || jobDetails?.recruiter?.recruiterId;
    if (currentUserId && jobRecruiterId && String(currentUserId) === String(jobRecruiterId)) return true;

    const recruiterBranch = currentUser?.branchName || '';
    const jobBranch = jobDetails?.branchName || jobDetails?.raw?.branchName || '';
    if (recruiterBranch && jobBranch && recruiterBranch.trim().toLowerCase() === jobBranch.trim().toLowerCase()) {
      return true;
    }
    if (!recruiterBranch && !jobBranch) return true;
    return false;
  }, [currentUser, jobDetails]);

  const isAdmin = currentUser?.role === 'ADMIN';
  const subscriptionPerms = parseSubscriptionPermissions(recruiterSubscription, 'RECRUITER');
  const planPrice = Number(recruiterSubscription?.price || 0);
  const planName = recruiterSubscription?.planName || 'Free Recruiter';
  const quotaLimit = Number(recruiterSubscription?.quotaLimit || 0);
  const isPaidRecruiter = recruiterSubscription && recruiterSubscription.active && planPrice > 0;
  const pName = (recruiterSubscription?.planName || '').toLowerCase();

  // Normalized Recruiter Tier Order: ENTERPRISE -> PROFESSIONAL -> STARTER -> BASIC
  let recruiterTier = 'BASIC';
  if (pName.includes('elite') || pName.includes('enterprise') || pName.includes('vip') || (quotaLimit >= 999)) {
    recruiterTier = 'ENTERPRISE';
  } else if (pName.includes('pro') || pName.includes('professional')) {
    recruiterTier = 'PROFESSIONAL';
  } else if (pName.includes('starter') || (quotaLimit >= 10 && quotaLimit < 30)) {
    recruiterTier = 'STARTER';
  } else {
    recruiterTier = 'BASIC';
  }

  // Hiring Starter (199k) trở lên mở khóa: Xuất Excel, Xem Skill Gap Matrix chi tiết
  const isStarterOrHigher = isAdmin || ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(recruiterTier) || Boolean(subscriptionPerms.exportReport) || (isPaidRecruiter && (planPrice >= 199000 || quotaLimit >= 10));
  // Hiring Pro (499k) và Hiring Elite (1.199k) mở khóa toàn bộ Báo cáo AI Voice Mock Interview của ứng viên & Batch Action
  const isProOrHigher = isAdmin || ['PROFESSIONAL', 'ENTERPRISE'].includes(recruiterTier) || Boolean(subscriptionPerms.aiMockInterview) || Boolean(subscriptionPerms.unlockDirectContact) || (isPaidRecruiter && (planPrice > 250000 || quotaLimit >= 30));

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Company Legal Verification Status (VERIFIED/APPROVED/ACTIVE vs PENDING/REJECTED)
  const [companyStatus, setCompanyStatus] = useState('PENDING');
  const [showUnverifiedWarningModal, setShowUnverifiedWarningModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCompanyLegalStatus = async () => {
      let resolvedStatus = null;
      try {
        const res = await companyApi.getMyCompany();
        const comp = res?.data || res;
        if (comp?.status) {
          resolvedStatus = (comp.status === 'VERIFIED' || comp.status === 'ACTIVE' || comp.status === 'APPROVED') ? 'VERIFIED' : comp.status;
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra trạng thái doanh nghiệp từ backend:', err);
      }

      if (!resolvedStatus) {
        const companyKey = (currentUser?.companyName || user?.companyName || 'vng_corporation').toLowerCase().replace(/[^a-z0-9]/g, '_');
        try {
          const saved = localStorage.getItem(`hiremate_company_legal_${companyKey}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            resolvedStatus = (parsed.status === 'VERIFIED' || parsed.status === 'APPROVED' || parsed.status === 'ACTIVE') ? 'VERIFIED' : (parsed.status || 'PENDING');
          }
          if (!resolvedStatus) {
            const adminList = localStorage.getItem('hiremate_admin_companies_list');
            if (adminList) {
              const list = JSON.parse(adminList);
              const comp = list.find((c) =>
                (c.name || '').toLowerCase() === (currentUser?.companyName || user?.companyName || 'vng corporation').toLowerCase() ||
                (c.shortName || '').toLowerCase() === (currentUser?.companyName || user?.companyName || 'vng corporation').toLowerCase()
              );
              if (comp && (comp.status === 'VERIFIED' || comp.status === 'ACTIVE')) {
                resolvedStatus = 'VERIFIED';
              }
            }
          }
        } catch {}
      }

      if (isMounted && resolvedStatus) {
        setCompanyStatus(resolvedStatus);
      }
    };
    fetchCompanyLegalStatus();
    return () => { isMounted = false; };
  }, [currentUser, user]);

  const handleNewJobClick = () => {
    const isVerified = companyStatus === 'VERIFIED' || companyStatus === 'APPROVED' || companyStatus === 'ACTIVE' || currentUser?.role === 'ADMIN' || user?.role === 'ADMIN';
    if (!isVerified) {
      setShowUnverifiedWarningModal(true);
    } else {
      window.location.hash = '#/recruiter-jobs?action=new';
    }
  };

  // Preview Candidate Modal
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState(null);
  const [aiReportData, setAiReportData] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [candidateAiInterviewData, setCandidateAiInterviewData] = useState(null);
  const [isLoadingInterviewData, setIsLoadingInterviewData] = useState(false);

  // Schedule Interview State & Modal
  const [schedulingCandidate, setSchedulingCandidate] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '09:00',
    type: 'Google Meet',
    meetLink: 'https://meet.google.com/hiremate-interview',
    note: 'Kính mời bạn tham gia buổi phỏng vấn trao đổi chuyên môn với đội ngũ tuyển dụng.',
  });

  const handleScheduleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!schedulingCandidate) return;
    if (!canManageJob) {
      triggerToast('Tin tuyển dụng thuộc chi nhánh khác (Chỉ xem). Bạn không có quyền lên lịch phỏng vấn.');
      return;
    }
    if (schedulingCandidate.stage === 'WITHDRAWN' || schedulingCandidate.stage === 'HIRED' || schedulingCandidate.stage === 'REJECTED') {
      triggerToast('Hồ sơ ứng viên đã ở trạng thái đã chốt hoặc đã rút đơn, không thể xếp lịch phỏng vấn.');
      return;
    }

    const scheduledDateTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
    const minAllowedTime = new Date(Date.now() + 1800000); // Tối thiểu sau thời điểm hiện tại 30 phút
    if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime < minAllowedTime) {
      triggerToast('Thời gian phỏng vấn không hợp lệ! Vui lòng chọn lịch phỏng vấn sau thời điểm hiện tại ít nhất 30 phút.');
      return;
    }
    try {
      const interviewNote = `Lịch phỏng vấn ngày ${scheduleForm.date} lúc ${scheduleForm.time} (${scheduleForm.type}). Link: ${scheduleForm.meetLink}. Ghi chú: ${scheduleForm.note}`;
      await applicationApi.updateStatus(schedulingCandidate.applicationId || schedulingCandidate.id, {
        status: 'INTERVIEWING',
        newStatus: 'INTERVIEWING',
        notes: interviewNote,
        note: interviewNote,
      });

      setCandidates((prev) =>
        prev.map((c) =>
          (c.applicationId === schedulingCandidate.applicationId || c.id === schedulingCandidate.id)
            ? { ...c, stage: 'INTERVIEW', statusLabel: 'Duyệt Phỏng Vấn' }
            : c
        )
      );

      triggerToast(`🎉 Đã lên lịch phỏng vấn và gửi thông báo cho ứng viên ${schedulingCandidate.name}!`);
      setSchedulingCandidate(null);
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
    } catch (err) {
      triggerToast('Lỗi khi lên lịch phỏng vấn: ' + (err.response?.data?.message || err.message));
    }
  };

  // Unlock Candidate Contact Info State
  const [unlockedCandidateIds, setUnlockedCandidateIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hiremate_unlocked_candidates') || '[]');
    } catch {
      return [];
    }
  });

  const handleUnlockCandidate = (cand) => {
    if (!isStarterOrHigher && !isProOrHigher && !isAdmin) {
      setShowRecruiterUpgradeModal(true);
      setRecruiterUpgradeContent({
        title: 'Mở Khóa Thông Tin Liên Hệ Ứng Viên',
        message: 'Tài khoản miễn phí không thể xem trực tiếp số điện thoại và email cá nhân của ứng viên. Vui lòng nâng cấp gói Hiring Starter hoặc Pro để mở khóa.',
        targetPlan: 'Hiring Starter',
      });
      return;
    }

    if (!unlockedCandidateIds.includes(cand.candidateId)) {
      const next = [...unlockedCandidateIds, cand.candidateId];
      setUnlockedCandidateIds(next);
      try {
        localStorage.setItem('hiremate_unlocked_candidates', JSON.stringify(next));
      } catch {}
      triggerToast(`🎉 Đã mở khóa thông tin liên hệ của ứng viên ${cand.name}!`);
    }
  };

  // Batch Selection State
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const toggleSelectApplicant = (appId) => {
    if (!canManageJob) return;
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSelectAllVisible = () => {
    if (!canManageJob) return;
    const selectable = filteredCandidates
      .filter((c) => c.stage !== 'WITHDRAWN' && c.stage !== 'HIRED' && c.stage !== 'REJECTED')
      .map((c) => c.applicationId);
    if (selectedAppIds.length > 0 && selectable.every((id) => selectedAppIds.includes(id))) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(selectable);
    }
  };

  const handleExecuteBatchStatus = async (newStatus) => {
    if (!canManageJob) {
      triggerToast('Bạn không thể thao tác trên bài đăng thuộc chi nhánh khác (Chỉ xem).');
      return;
    }
    if (!isProOrHigher) {
      setRecruiterUpgradeContent({
        title: 'Mở Khóa Chuyển Trạng Thái Ứng Viên Hàng Loạt (Batch Action)',
        message: 'Tính năng Duyệt & Chuyển trạng thái ứng viên hàng loạt (Batch Action) yêu cầu gói Hiring Pro (499.000đ) hoặc Hiring Elite trở lên. Vui lòng nâng cấp gói để sử dụng!',
        targetPlan: 'Hiring Pro / Hiring Elite'
      });
      setShowRecruiterUpgradeModal(true);
      return;
    }
    if (selectedAppIds.length === 0) return;
    try {
      setIsBatchUpdating(true);
      await applicationApi.batchUpdateStatus({
        applicationIds: selectedAppIds,
        status: newStatus,
        newStatus: newStatus,
        stage: newStatus,
        notes: `Chuyển trạng thái hàng loạt sang ${newStatus} bởi Nhà tuyển dụng`,
        note: `Chuyển trạng thái hàng loạt sang ${newStatus} bởi Nhà tuyển dụng`,
      });
      triggerToast(`🎉 Đã cập nhật thành công ${selectedAppIds.length} ứng viên sang trạng thái "${newStatus}"!`);
      setSelectedAppIds([]);
      await loadJobAndApplicants();
    } catch (err) {
      triggerToast('Lỗi cập nhật hàng loạt: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Tự động gọi API Gemini AI backend để đối soát CV của ứng viên với bài tuyển dụng
  useEffect(() => {
    if (!selectedCandidateForModal || !jobDetails?.id) {
      setAiReportData(null);
      setIsReportLoading(false);
      setCandidateAiInterviewData(null);
      setIsLoadingInterviewData(false);
      return;
    }

    let isMounted = true;
    setIsReportLoading(true);
    setIsLoadingInterviewData(true);

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
    { label: 'Đạt Yêu Cầu (Offer)', stage: 'PASSED', backendStatus: 'OFFERED' },
    { label: 'Trúng Tuyển (Hired)', stage: 'HIRED', backendStatus: 'HIRED' },
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
        const rawScore = app.matchingScore != null ? Number(app.matchingScore) : (match?.matchingScore != null ? Number(match.matchingScore) : null);

        const score = rawScore != null ? Math.round(rawScore) : 0;

        // Lấy đúng điểm 4 trụ cột từ appData hoặc match, kiểm tra != null để không bị mất điểm 0
        const s1 = app.skillsScore != null ? Math.round(Number(app.skillsScore)) : (match?.skillsScore != null ? Math.round(Number(match.skillsScore)) : score);
        const s2 = app.experienceScore != null ? Math.round(Number(app.experienceScore)) : (match?.experienceScore != null ? Math.round(Number(match.experienceScore)) : score);
        const s3 = app.educationScore != null ? Math.round(Number(app.educationScore)) : (match?.educationScore != null ? Math.round(Number(match.educationScore)) : score);
        const s4 = app.semanticScore != null ? Math.round(Number(app.semanticScore)) : (match?.semanticScore != null ? Math.round(Number(match.semanticScore)) : score);

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

        const isWithdrawn = Boolean(app.withdrawnByCandidate);
        const stage = mapStatusToStage(app.status, isWithdrawn);

        const statusLabel = stage === 'NEW' ? 'Mới Nhận'
          : stage === 'REVIEWING' ? 'Đang Xem Xét'
          : stage === 'INTERVIEW' ? 'Duyệt Phỏng Vấn'
          : stage === 'PASSED' ? 'Đạt Yêu Cầu (Offer)'
          : stage === 'HIRED' ? 'Trúng Tuyển (Hired)'
          : stage === 'WITHDRAWN' ? 'Ứng Viên Đã Rút Đơn'
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
          phone: app.candidatePhone || 'Chưa cập nhật',
          avatar: app.candidateAvatar || null,
          withdrawnByCandidate: isWithdrawn,
          experience: (() => {
            const cleanLetter = cleanCoverLetter(app.coverLetter);
            if (app.candidateExperienceSummary) return app.candidateExperienceSummary;
            if (cleanLetter) return cleanLetter.length > 50 ? cleanLetter.slice(0, 50) + '...' : cleanLetter;
            return 'Hồ sơ đã qua thẩm định ATS';
          })(),
          appliedTime: app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
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
          cvId: app.cvId || match?.cvId || null,
          cvUrl: app.cvUrl || match?.cvUrl || '#',
        };
      });

      // Sắp xếp danh sách ứng viên mặc định theo điểm matchScore giảm dần và tính động thứ hạng Rank
      mappedCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      mappedCandidates.forEach((c, i) => {
        c.rank = i + 1;
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
        branchName: currentJob?.branchName || currentJob?.raw?.branchName || '',
        recruiterId: currentJob?.recruiterId || currentJob?.raw?.recruiterId || currentJob?.recruiter?.recruiterId,
        recruiterEmail: currentJob?.recruiterEmail || currentJob?.raw?.recruiterEmail || currentJob?.recruiter?.user?.email,
        recruiterName: currentJob?.recruiterName || currentJob?.raw?.recruiterName || currentJob?.recruiter?.user?.fullName,
        raw: currentJob,
        totalApplicants: totalCount,
        newToday: mappedCandidates.filter((c) => c.stage === 'NEW').length,
        topGoldCount: topGold,
        avgScore: avgScore,
        screenedProgress: `${screenedCount}/${totalCount}`,
        screenedPercent: screenedPercent,
        mandatorySkills: Array.isArray(currentJob?.mandatorySkills) && currentJob.mandatorySkills.length > 0
          ? currentJob.mandatorySkills
          : parseSkillList(currentJob?.mandatorySkills || currentJob?.requirements, []),
        preferredSkills: Array.isArray(currentJob?.preferredSkills) && currentJob.preferredSkills.length > 0
          ? currentJob.preferredSkills
          : parseSkillList(currentJob?.preferredSkills, []),
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
    if (!canManageJob) {
      triggerToast('Tin tuyển dụng thuộc chi nhánh khác (Chỉ xem). Bạn không có quyền đổi trạng thái.');
      return;
    }
    const cand = candidates.find((c) => c.id === candidateAppId || c.applicationId === candidateAppId);
    if (cand && (cand.stage === 'WITHDRAWN' || cand.stage === 'HIRED' || cand.stage === 'REJECTED')) {
      triggerToast('Hồ sơ ứng viên đã ở trạng thái đã chốt hoặc đã rút đơn, không thể chuyển trạng thái.');
      return;
    }
    const matchedOption = STAGE_OPTIONS.find((opt) => opt.label === newLabel) || {
      stage: 'REVIEWING',
      backendStatus: 'SCREENING',
    };

    try {
      await applicationApi.updateStatus(candidateAppId, {
        status: matchedOption.backendStatus,
        newStatus: matchedOption.backendStatus,
        notes: `Chuyển trạng thái sang "${newLabel}" bởi nhà tuyển dụng`,
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

  // State track candidate đang được AI chấm lại chuyên sâu
  const [evaluatingCandId, setEvaluatingCandId] = useState(null);

  // Chấm lại chuyên sâu bằng AI cho một ứng viên cụ thể
  const handleDeepEvaluateCandidate = async (cand) => {
    if (!cand || !jobDetails?.id) return;
    try {
      setEvaluatingCandId(cand.candidateId);
      triggerToast(`Đang yêu cầu AI đối soát chuyên sâu & chấm lại kỹ hơn cho ứng viên "${cand.name}"...`);
      const res = await aiMatchApi.getDetailedCandidateEvaluation(jobDetails.id, cand.candidateId, true);
      const data = res?.data?.data || res?.data || res;
      if (data?.matchingScore != null) {
        const freshScore = Math.round(data.matchingScore);
        const freshTier = data.matchTier || (freshScore >= 85 ? '⭐ Phù Hợp Xuất Sắc' : freshScore >= 70 ? '✨ Phù Hợp Tốt' : freshScore >= 50 ? '💡 Tiềm Năng' : 'Trau Dồi Kỹ Năng');
        
        const freshSkillsScore = data.skillsScore != null ? Math.round(data.skillsScore) : freshScore;
        const freshExpScore = data.experienceScore != null ? Math.round(data.experienceScore) : freshScore;
        const freshEduScore = data.educationScore != null ? Math.round(data.educationScore) : freshScore;
        const freshSemScore = data.semanticScore != null ? Math.round(data.semanticScore) : freshScore;

        const mandMatched = Array.isArray(data.matchedMandatorySkills) ? data.matchedMandatorySkills : (cand.mandatoryMatched || []);
        const mandMissing = Array.isArray(data.missingMandatorySkills) ? data.missingMandatorySkills : (cand.mandatoryMissing || []);
        const prefMatched = Array.isArray(data.matchedPreferredSkills) ? data.matchedPreferredSkills : (cand.preferredMatched || []);

        const freshTechChips = [
          ...mandMatched.map((s) => ({ name: s, highlight: true })),
          ...prefMatched.map((s) => ({ name: s, highlight: false })),
          ...mandMissing.map((s) => ({ name: `Trọng tâm: ${s}`, highlight: 'error' })),
        ];
        if (freshTechChips.length === 0) freshTechChips.push({ name: 'Hồ sơ tuyển dụng AI', highlight: false });

        setCandidates((prev) => {
          const updated = prev.map((c) =>
            c.candidateId === cand.candidateId
              ? {
                  ...c,
                  matchScore: freshScore,
                  matchCategory: freshTier,
                  skillsScore: freshSkillsScore,
                  experienceScore: freshExpScore,
                  educationScore: freshEduScore,
                  semanticScore: freshSemScore,
                  mandatoryMatched: mandMatched,
                  mandatoryMissing: mandMissing,
                  preferredMatched: prefMatched,
                  techChips: freshTechChips,
                  aiQuote: data.overallVerdict || c.aiQuote,
                  isLowerScore: freshScore < 60,
                }
              : c
          );
          updated.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          updated.forEach((c, idx) => {
            c.rank = idx + 1;
          });
          return updated;
        });
        triggerToast(`Đã hoàn tất chấm lại bằng AI cho ứng viên "${cand.name}": ${freshScore}% AI Match (Hạng #${candidates.findIndex(c => c.candidateId === cand.candidateId) + 1 || 1})!`);
      } else {
        triggerToast(`Đã đối soát xong hồ sơ của ứng viên "${cand.name}".`);
      }
    } catch (err) {
      console.error('Lỗi khi chấm lại bằng AI:', err);
      triggerToast('Lỗi khi chấm lại bằng AI: ' + (err.response?.data?.message || err.message));
    } finally {
      setEvaluatingCandId(null);
    }
  };

  // Chấm lại toàn bộ danh sách CV của cả bài đăng tuyển dụng bằng AI
  const handleRecalculateAi = async () => {
    try {
      setIsRescanning(true);
      triggerToast('Đang yêu cầu AI chấm lại toàn bộ danh sách CV của bài đăng tuyển dụng này...');
      await aiMatchApi.recalculateMatchesForJob(jobDetails.id);
      await loadJobAndApplicants();
      triggerToast('Đã hoàn tất chấm lại toàn bộ danh sách CV bằng AI và đồng bộ vào hệ thống!');
    } catch (err) {
      triggerToast('Lỗi khi chấm lại AI toàn bộ: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRescanning(false);
    }
  };

  // Export Native Excel (.xlsx)
  const handleExportCsv = async () => {
    if (!isStarterOrHigher) {
      setRecruiterUpgradeContent({
        title: 'Khóa Tính Năng Xuất Dữ Liệu Excel Chuẩn Doanh Nghiệp',
        message: 'Tính năng xuất báo cáo danh sách ứng viên và bảng điểm ATS ra định dạng Excel (.xlsx) chuẩn tuyển dụng chỉ khả dụng cho gói Hiring Starter (199.000đ) hoặc Hiring Pro trở lên. Vui lòng nâng cấp gói để tải toàn bộ bảng điểm và thông tin ứng viên.',
        targetPlan: 'Hiring Starter / Hiring Pro'
      });
      setShowRecruiterUpgradeModal(true);
      return;
    }

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

    // Dynamic Skill options for filter
  const availableSkillOptions = useMemo(() => {
    const s = new Set();
    if (Array.isArray(jobDetails.mandatorySkills)) jobDetails.mandatorySkills.forEach(x => s.add(x));
    if (Array.isArray(jobDetails.preferredSkills)) jobDetails.preferredSkills.forEach(x => s.add(x));
    candidates.forEach(c => {
      if (Array.isArray(c.techChips)) c.techChips.forEach(t => s.add(t.name));
    });
    return Array.from(s).filter(Boolean).slice(0, 20);
  }, [jobDetails, candidates]);

  const hasActiveMultiFilters = Boolean(
    activeFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    scoreFilter !== 'ALL' ||
    expFilter !== 'ALL' ||
    skillFilter !== 'ALL'
  );

  const handleResetAllFilters = () => {
    setActiveFilter('ALL');
    setSearchQuery('');
    setScoreFilter('ALL');
    setExpFilter('ALL');
    setSkillFilter('ALL');
    setIsAiSortDescending(true);
    setCurrentPage(1);
  };

  // Filter & sort logic
  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    // Filter by tab
    if (activeFilter === 'NEW') list = list.filter((c) => c.stage === 'NEW');
    if (activeFilter === 'REVIEWING') list = list.filter((c) => c.stage === 'REVIEWING');
    if (activeFilter === 'INTERVIEW') list = list.filter((c) => c.stage === 'INTERVIEW');
    if (activeFilter === 'PASSED') list = list.filter((c) => c.stage === 'PASSED');
    if (activeFilter === 'HIRED') list = list.filter((c) => c.stage === 'HIRED');
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

    // Filter by AI Score
    if (scoreFilter === 'EXCELLENT') {
      list = list.filter((c) => (c.matchScore ?? 0) >= 80);
    } else if (scoreFilter === 'GOOD') {
      list = list.filter((c) => (c.matchScore ?? 0) >= 60 && (c.matchScore ?? 0) < 80);
    } else if (scoreFilter === 'LOW') {
      list = list.filter((c) => (c.matchScore ?? 0) < 60);
    }

    // Filter by Experience level
    if (expFilter !== 'ALL') {
      list = list.filter((c) => {
        const text = `${c.experience || ''} ${c.role || ''}`.toLowerCase();
        const numMatch = text.match(/(\d+)\s*(năm|year)/);
        const yrs = numMatch ? parseInt(numMatch[1], 10) : 0;
        if (expFilter === 'INTERN') return yrs < 1 || text.includes('intern') || text.includes('fresher') || text.includes('thực tập');
        if (expFilter === 'JUNIOR') return (yrs >= 1 && yrs <= 2) || text.includes('junior');
        if (expFilter === 'MIDDLE') return (yrs >= 3 && yrs <= 5) || text.includes('middle') || text.includes('mid');
        if (expFilter === 'SENIOR') return yrs > 5 || text.includes('senior') || text.includes('lead') || text.includes('trưởng');
        return true;
      });
    }

    // Filter by Skill
    if (skillFilter !== 'ALL') {
      const qSkill = skillFilter.toLowerCase();
      list = list.filter((c) => {
        const inChips = Array.isArray(c.techChips) && c.techChips.some(t => t.name.toLowerCase().includes(qSkill));
        const inRole = (c.role || '').toLowerCase().includes(qSkill);
        return inChips || inRole;
      });
    }

    // Sort by AI Match score
    list.sort((a, b) =>
      isAiSortDescending ? b.matchScore - a.matchScore : a.matchScore - b.matchScore
    );

    return list;
  }, [candidates, activeFilter, searchQuery, isAiSortDescending, scoreFilter, expFilter, skillFilter]);

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
                {!canManageJob && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1.5 shadow-xs" title={`Tin thuộc ${jobDetails.branchName || 'chi nhánh khác'} • Phụ trách: ${jobDetails.recruiterName || 'Đồng nghiệp'}`}>
                    <span className="material-symbols-outlined text-[14px] text-amber-600">visibility</span>
                    {jobDetails.branchName ? `${jobDetails.branchName} (Chỉ xem)` : 'Chi nhánh khác (Chỉ xem)'}
                  </span>
                )}
              </div>
            </div>

            {/* Back & View Job Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleNewJobClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all cursor-pointer shadow-xs hover:scale-105"
                title="Tạo bài đăng tuyển dụng mới cho doanh nghiệp"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Đăng Tin Mới</span>
              </button>

              <button
                type="button"
                onClick={handleRecalculateAi}
                disabled={isRescanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs font-extrabold text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                title="Chấm lại toàn bộ danh sách CV của bài đăng tuyển dụng này bằng AI"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRescanning ? 'animate-spin' : ''}`}>
                  {isRescanning ? 'sync' : 'auto_awesome'}
                </span>
                <span>{isRescanning ? 'Đang Chấm Lại Toàn Bộ...' : 'Chấm Lại Toàn Bộ CV Bằng AI'}</span>
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
                              window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}&appId=${cand.applicationId}&cvId=${cand.cvId || ''}`;
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
                Gửi Offer <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'PASSED').length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('HIRED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'HIRED'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
                }`}
              >
                Trúng tuyển <span className="ml-1 opacity-80">{candidates.filter((c) => c.stage === 'HIRED').length}</span>
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

          {/* ADVANCED MULTI-CRITERIA FILTER TOOLBAR */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-purple-600">tune</span>
                <span>Bộ lọc đa chiều:</span>
              </span>

              {/* AI Score Filter */}
              <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {[
                  { id: 'ALL', label: 'Tất cả AI' },
                  { id: 'EXCELLENT', label: '🌟 Xuất sắc (≥80%)' },
                  { id: 'GOOD', label: '⚡ Tiềm năng (60-79%)' },
                  { id: 'LOW', label: '🔻 Cần xem xét (<60%)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setScoreFilter(item.id); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      scoreFilter === item.id
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Experience Level Filter */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <span className="material-symbols-outlined text-slate-400 text-sm">work_history</span>
                <select
                  value={expFilter}
                  onChange={(e) => { setExpFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">Mọi cấp độ kinh nghiệm</option>
                  <option value="INTERN">Intern / Mới tốt nghiệp (&lt;1 năm)</option>
                  <option value="JUNIOR">Junior (1 - 2 năm)</option>
                  <option value="MIDDLE">Middle (3 - 5 năm)</option>
                  <option value="SENIOR">Senior / Leader (&gt;5 năm)</option>
                </select>
              </div>

              {/* Skill Match Filter */}
              {availableSkillOptions.length > 0 && (
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="material-symbols-outlined text-purple-500 text-sm">psychology</span>
                  <select
                    value={skillFilter}
                    onChange={(e) => { setSkillFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs max-w-[160px] truncate"
                  >
                    <option value="ALL">Mọi kỹ năng cốt lõi</option>
                    {availableSkillOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Match Counter & Reset button */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">
                Tìm thấy <strong className="text-purple-700 font-bold">{filteredCandidates.length}</strong> ứng viên
              </span>
              {hasActiveMultiFilters && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">restart_alt</span>
                  <span>Đặt lại</span>
                </button>
              )}
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
              <>
                <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-slate-700 shadow-2xs">
                  <label className={`flex items-center gap-2 font-bold select-none ${!canManageJob ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={!canManageJob}
                      checked={
                        canManageJob &&
                        paginatedCandidates.filter((c) => c.stage !== 'WITHDRAWN' && c.stage !== 'HIRED' && c.stage !== 'REJECTED').length > 0 &&
                        paginatedCandidates.filter((c) => c.stage !== 'WITHDRAWN' && c.stage !== 'HIRED' && c.stage !== 'REJECTED').every((c) => selectedAppIds.includes(c.applicationId))
                      }
                      onChange={handleSelectAllVisible}
                      className="w-4 h-4 rounded text-[#5b48bd] focus:ring-purple-400 border-slate-300 cursor-pointer"
                    />
                    <span>Chọn tất cả ứng viên khả dụng trên trang ({selectedAppIds.length} đã chọn)</span>
                  </label>
                  {selectedAppIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAppIds([])}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Bỏ chọn ({selectedAppIds.length})
                    </button>
                  )}
                </div>

                {paginatedCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className={`p-5 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all shadow-xs hover:shadow-md hover:border-purple-300 group border border-slate-200/90 bg-white ${
                      cand.isLowerScore ? 'opacity-90' : ''
                    }`}
                  >
                    {/* Checkbox for item */}
                    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedAppIds.includes(cand.applicationId)}
                        disabled={cand.stage === 'WITHDRAWN' || cand.stage === 'HIRED' || cand.stage === 'REJECTED' || !canManageJob}
                        onChange={() => toggleSelectApplicant(cand.applicationId)}
                        className={`w-4 h-4 rounded text-[#5b48bd] focus:ring-purple-400 border-slate-300 ${
                          cand.stage === 'WITHDRAWN' || cand.stage === 'HIRED' || cand.stage === 'REJECTED' || !canManageJob ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                        }`}
                        title={
                          !canManageJob
                            ? 'Tin thuộc chi nhánh khác (Chỉ xem)'
                            : cand.stage === 'WITHDRAWN'
                            ? 'Ứng viên đã rút đơn, không thể chọn'
                            : cand.stage === 'HIRED' || cand.stage === 'REJECTED'
                            ? 'Hồ sơ đã chốt kết quả, không thể thao tác hàng loạt'
                            : 'Chọn ứng viên này'
                        }
                      />
                    </div>

                    {/* Col 1: Identity & Credentials (26% fixed width on XL) */}
                  <div 
                    onClick={() => {
                      window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}&appId=${cand.applicationId}&cvId=${cand.cvId || ''}`;
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

                    <button
                      type="button"
                      disabled={evaluatingCandId === cand.candidateId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeepEvaluateCandidate(cand);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0"
                      title="Kích hoạt AI đối soát chuyên sâu & chấm lại kỹ hơn hồ sơ CV này"
                    >
                      <span className={`material-symbols-outlined text-sm text-indigo-600 ${evaluatingCandId === cand.candidateId ? 'animate-spin' : ''}`}>
                        {evaluatingCandId === cand.candidateId ? 'sync' : 'psychology'}
                      </span>
                      <span>{evaluatingCandId === cand.candidateId ? 'Đang Chấm AI...' : 'AI Chấm Lại CV'}</span>
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
                        window.location.hash = `#/candidate-evaluation?candidateId=${cand.candidateId}&jobId=${jobDetails.id}&appId=${cand.applicationId}&cvId=${cand.cvId || ''}`;
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

                    <button
                      type="button"
                      disabled={cand.stage === 'WITHDRAWN' || cand.stage === 'HIRED' || cand.stage === 'REJECTED' || !canManageJob}
                      onClick={() => setSchedulingCandidate(cand)}
                      className={`p-1.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center shadow-2xs shrink-0 ${
                        cand.stage === 'WITHDRAWN' || cand.stage === 'HIRED' || cand.stage === 'REJECTED' || !canManageJob
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                          : 'cursor-pointer bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-200 hover:border-purple-300'
                      }`}
                      title={
                        !canManageJob
                          ? 'Tin thuộc chi nhánh khác (Chỉ xem)'
                          : cand.stage === 'WITHDRAWN'
                          ? 'Ứng viên đã rút đơn, không thể xếp lịch phỏng vấn'
                          : cand.stage === 'HIRED' || cand.stage === 'REJECTED'
                          ? 'Hồ sơ đã chốt kết quả, không thể xếp lịch phỏng vấn'
                          : 'Lên lịch phỏng vấn với ứng viên này'
                      }
                    >
                      <span className="material-symbols-outlined text-[16px] text-purple-600">event_available</span>
                    </button>

                    {/* Stage Dropdown or Badges */}
                    {cand.withdrawnByCandidate || cand.stage === 'WITHDRAWN' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-2xs shrink-0" title="Ứng viên đã chủ động rút đơn ứng tuyển">
                        <span className="material-symbols-outlined text-[15px] text-amber-600">undo</span>
                        <span>Ứng viên đã rút đơn</span>
                      </span>
                    ) : cand.stage === 'HIRED' || cand.stage === 'REJECTED' || !canManageJob ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs shrink-0 ${
                        cand.stage === 'HIRED'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : cand.stage === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`} title={!canManageJob ? 'Tin thuộc chi nhánh khác (Chỉ xem)' : 'Trạng thái đã chốt, không thể thay đổi'}>
                        <span>{cand.statusLabel || (cand.stage === 'HIRED' ? 'Trúng Tuyển' : cand.stage === 'REJECTED' ? 'Từ Chối' : 'Chỉ xem')}</span>
                        <span className="material-symbols-outlined text-[14px] text-slate-400">lock</span>
                      </span>
                    ) : (
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
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          </div>

          {/* Floating Batch Action Bar */}
          {selectedAppIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700 flex items-center gap-4 animate-fade-in font-sans flex-wrap justify-center">
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-[11px]">
                  {selectedAppIds.length}
                </span>
                <span>Ứng viên đã chọn</span>
              </div>

              <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Chuyển sang:</span>
                {[
                  { status: 'SCREENING', label: 'Đang Xem Xét', color: 'hover:bg-cyan-600' },
                  { status: 'INTERVIEWING', label: 'Duyệt Phỏng Vấn', color: 'hover:bg-purple-600' },
                  { status: 'OFFERED', label: 'Gửi Offer', color: 'hover:bg-indigo-600' },
                  { status: 'HIRED', label: 'Trúng Tuyển (Hired)', color: 'hover:bg-emerald-600' },
                  { status: 'REJECTED', label: 'Từ Chối', color: 'hover:bg-rose-600' },
                ].map((b) => (
                  <button
                    key={b.status}
                    type="button"
                    disabled={isBatchUpdating}
                    onClick={() => handleExecuteBatchStatus(b.status)}
                    className={`px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold ${b.color} transition-all cursor-pointer border border-slate-700 flex items-center gap-1 shadow-sm`}
                  >
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppIds([])}
                className="text-slate-400 hover:text-white text-xs underline cursor-pointer ml-1"
              >
                Hủy chọn
              </button>
            </div>
          )}

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
                          <span className="material-symbols-outlined text-[15px] text-amber-600">developer_mode</span>
                          Dự Án &amp; Công Nghệ Thực Chiến
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
                        Độ phức tạp &amp; quy mô dự án thực tế
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2 & 3. Hai Khối Trọng Tâm: Ưu Điểm vs Điểm Yếu & Khuyến Nghị Tuyển Dụng AI */}
                {!isStarterOrHigher ? (
                  <div className="relative rounded-2xl overflow-hidden border border-purple-200/90 p-8 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/50 text-center space-y-4 shadow-sm my-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5b48bd] to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <span className="material-symbols-outlined text-2xl">lock</span>
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-base font-bold text-[#1e1b4b]">
                        Mở Khóa Báo Cáo Phân Tích Skill Gap &amp; Khuyến Nghị Tuyển Dụng AI
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Tài khoản <strong>Free Recruiter</strong> chỉ xem được Điểm % Phù hợp tổng thể. Báo cáo phân tích chuyên sâu Ưu/Nhược điểm bám sát JD và khuyến nghị tuyển dụng chuẩn ATS chỉ dành riêng cho gói <strong>Hiring Starter (199.000đ)</strong> hoặc <strong>Hiring Pro / Elite</strong>.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = '#/recruiter-pricing';
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#4a39a7] hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">workspace_premium</span>
                        <span>Nâng Cấp Gói Tuyển Dụng Ngay</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

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
                      window.location.hash = `#/candidate-evaluation?candidateId=${selectedCandidateForModal.candidateId}&jobId=${jobDetails.id}&appId=${selectedCandidateForModal.applicationId || selectedCandidateForModal.id}&cvId=${selectedCandidateForModal.cvId || ''}`;
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-purple-50 text-[#5b48bd] border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm">badge</span>
                    <span>Hồ Sơ &amp; Đánh Giá</span>
                  </button>

                  {canManageJob && selectedCandidateForModal.stage !== 'WITHDRAWN' && selectedCandidateForModal.stage !== 'HIRED' && selectedCandidateForModal.stage !== 'REJECTED' && (
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
                  )}
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
          candidateId={viewingCvCandidate.candidateId}
          fileName={`CV_${viewingCvCandidate.name?.replace(/\s+/g, '_')}.pdf`}
          candidateName={viewingCvCandidate.name}
          atsScore={viewingCvCandidate.matchScore}
        />
      )}

      {/* Modal Lên Lịch Phỏng Vấn Trực Tiếp */}
      {schedulingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-purple-100 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5 text-slate-800">
            <button
              onClick={() => setSchedulingCandidate(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">calendar_month</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  Lên Lịch Phỏng Vấn Trực Tiếp
                </h3>
                <p className="text-xs text-slate-500">
                  Ứng viên: <strong className="text-purple-700">{schedulingCandidate.name}</strong> • Vị trí: {jobDetails?.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Ngày phỏng vấn</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Giờ phỏng vấn</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Hình thức phỏng vấn</label>
                <select
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="Google Meet">Trực tuyến (Google Meet)</option>
                  <option value="Zoom Meeting">Trực tuyến (Zoom Meeting)</option>
                  <option value="Microsoft Teams">Trực tuyến (Microsoft Teams)</option>
                  <option value="Phỏng vấn trực tiếp tại văn phòng">Trực tiếp tại văn phòng công ty</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Đường dẫn cuộc họp / Địa điểm</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.meetLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Lời nhắn / Hướng dẫn ứng viên</label>
                <textarea
                  rows={3}
                  value={scheduleForm.note}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSchedulingCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Xác Nhận &amp; Gửi Lời Mời</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unverified Company Legal GPKD Warning Modal */}
      {showUnverifiedWarningModal && companyStatus !== 'VERIFIED' && companyStatus !== 'ACTIVE' && currentUser?.role !== 'ADMIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl shadow-2xl text-slate-800 overflow-hidden">
            <div className={`h-2.5 w-full bg-gradient-to-r ${
              companyStatus === 'REJECTED' ? 'from-rose-500 via-red-500 to-amber-500' : 'from-amber-500 via-orange-500 to-yellow-400'
            }`} />

            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    companyStatus === 'REJECTED' ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {companyStatus === 'REJECTED' ? 'cancel' : 'verified_user'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      Yêu Cầu Xác Minh GPKD Doanh Nghiệp
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        companyStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : companyStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {companyStatus === 'PENDING' ? 'Chờ Duyệt GPKD (PENDING)' : companyStatus === 'REJECTED' ? 'Bị Từ Chối GPKD (REJECTED)' : 'Chưa Xác Minh GPKD'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUnverifiedWarningModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed mb-6">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 font-medium">
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">policy</span>
                    <span>
                      Theo Nghị định 23/2021/NĐ-CP và chính sách kiểm duyệt của <strong>HireMate AI</strong>, Nhà tuyển dụng phải được phê duyệt Giấy phép kinh doanh (GPKD) hợp pháp trước khi đăng tin tuyển dụng mới.
                    </span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                  {companyStatus === 'PENDING' && (
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-sm">schedule</span>
                      <span>Hồ sơ GPKD của bạn đang trong hàng đợi phê duyệt của Ban Quản Trị (dự kiến 1 - 4 giờ làm việc). Vui lòng kiên nhẫn chờ đợi!</span>
                    </p>
                  )}
                  {companyStatus === 'REJECTED' && (
                    <p className="flex items-center gap-2 text-rose-700">
                      <span className="material-symbols-outlined text-rose-600 text-sm">error</span>
                      <span>Hồ sơ GPKD trước đó bị Admin từ chối do hình ảnh mờ hoặc thông tin MST chưa khớp. Vui lòng cập nhật lại hồ sơ mới.</span>
                    </p>
                  )}
                  {companyStatus !== 'PENDING' && companyStatus !== 'REJECTED' && (
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500 text-sm">info</span>
                      <span>Vui lòng tải lên ảnh chụp/bản scan Giấy phép đăng ký kinh doanh chính thức tại mục Hồ sơ doanh nghiệp để kích hoạt tính năng đăng tin.</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnverifiedWarningModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Để Sau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnverifiedWarningModal(false);
                    window.location.hash = '#/company-profile';
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#4a39a7] hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>Cập Nhật GPKD Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Tier Upgrade Modal */}
      {showRecruiterUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5b48bd] flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                {recruiterUpgradeContent.title || 'Nâng Cấp Gói Tuyển Dụng Doanh Nghiệp'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {recruiterUpgradeContent.message || 'Tính năng này yêu cầu gói tài khoản tuyển dụng trả phí cao hơn để sử dụng.'}
              </p>
            </div>
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-950 font-medium">
              💡 Gói đề xuất: <strong>{recruiterUpgradeContent.targetPlan}</strong> • Mở khóa đầy đủ tính năng xuất dữ liệu Excel, xem Skill Gap chuyên sâu và mở rộng hạn mức tin đăng!
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRecruiterUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Để Sau
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRecruiterUpgradeModal(false);
                  window.location.hash = '#/recruiter-pricing';
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#4a39a7] hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">upgrade</span>
                <span>Xem Bảng Giá Gói</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

