import React, { useState, useEffect } from 'react';
import { applicationApi, aiMatchApi, jobApi, interviewApi, paymentApi } from '../api';
import { cvApi } from '../api/cvApi';
import { getApiBaseUrl } from '../api/axiosClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList, sanitizeEvidenceText } from '../utils/helpers';
import { parseSubscriptionPermissions } from '../utils/subscriptionPerms';
import { createHrToCandidateMailto } from '../utils/emailUtils';
import { extractBlob } from '../utils/excelExportUtils';
import OnlineCvRenderer from '../components/common/OnlineCvRenderer';
import { AvatarImg } from '../components/common/SmartImage';
import { resolveUserAvatar } from '../utils/mediaUtils';

/**
 * Xây dựng báo cáo đối soát chi tiết AI toàn diện giữa CV và JD
 */
function buildCandidateAiReport(cand, liveAiReport) {
  if (!cand) return null;
  const score = liveAiReport?.matchingScore != null ? Math.round(liveAiReport.matchingScore) : (cand.matchScore || 0);
  const matchCategory = liveAiReport?.matchTier || (score >= 85 ? '⭐ Phù Hợp Xuất Sắc (Ready for Offer)' : score >= 70 ? '✨ Phù Hợp Tốt (Khuyên Mời Phỏng Vấn)' : score >= 50 ? '💡 Tiềm Năng' : 'Trau Dồi Kỹ Năng');
  const jobTitle = liveAiReport?.jobTitle || cand.jobTitle || 'Vị trí Tuyển Dụng';

  let advantages = Array.isArray(liveAiReport?.advantages) ? [...liveAiReport.advantages] : [];
  let disadvantages = Array.isArray(liveAiReport?.disadvantages) ? [...liveAiReport.disadvantages] : [];

  const matchedMandatory = Array.isArray(cand.matchedMandatorySkills) ? cand.matchedMandatorySkills : [];
  const matchedPreferred = Array.isArray(cand.matchedPreferredSkills) ? cand.matchedPreferredSkills : [];
  const missingMandatory = Array.isArray(cand.missingMandatorySkills) ? cand.missingMandatorySkills : [];
  const missingPreferred = Array.isArray(cand.missingPreferredSkills) ? cand.missingPreferredSkills : [];

  if (advantages.length === 0) {
    matchedMandatory.forEach((s) => {
      advantages.push({
        category: 'Kỹ năng chuyên môn cốt lõi',
        title: s,
        cvEvidence: `CV của ứng viên thể hiện kiến thức nền tảng và kinh nghiệm thực hành với "${s}".`,
        jobMatch: `Yêu cầu chuyên môn bắt buộc trong JD: ${s}`,
        assessment: 'Đạt chuẩn',
      });
    });

    matchedPreferred.forEach((s) => {
      advantages.push({
        category: 'Kỹ năng bổ trợ & Ưu tiên',
        title: s,
        cvEvidence: `Ứng viên sở hữu kỹ năng điểm cộng và đồ án liên quan đến "${s}".`,
        jobMatch: `Tiêu chí ưu tiên của bài tuyển dụng: ${s}`,
        assessment: 'Vượt trội',
      });
    });

    if (cand.educationScore >= 80 || !cand.educationScore) {
      advantages.push({
        category: 'Bằng cấp & Học vấn',
        title: 'Đào Tạo Đại Học / Chuyên Ngành CNTT Chính Quy',
        cvEvidence: cand.experience ? `Hồ sơ ghi nhận: ${cand.experience}` : 'Nền tảng học vấn và đào tạo bài bản theo chuẩn yêu cầu.',
        jobMatch: 'Yêu cầu trình độ học vấn của bài tuyển dụng',
        assessment: 'Đạt chuẩn',
      });
    }

    if (advantages.length === 0) {
      advantages.push({
        category: 'Kỹ năng chuyên môn',
        title: 'Tư Duy Kỹ Thuật Nền Tảng',
        cvEvidence: 'Hồ sơ thể hiện kiến thức nền tảng ngành CNTT, tư duy giải quyết vấn đề và học hỏi nhanh.',
        jobMatch: `Yêu cầu kỹ thuật cơ bản cho vị trí ${jobTitle}`,
        assessment: 'Đạt chuẩn',
      });
    }
  }

  if (disadvantages.length === 0) {
    missingMandatory.forEach((s) => {
      disadvantages.push({
        category: 'Kỹ năng bắt buộc còn thiếu',
        title: `Chưa Thấy Kinh Nghiệm Thực Tế: ${s}`,
        jobRequirement: `Yêu cầu bắt buộc trong JD: ${s}`,
        cvShortfall: `Hồ sơ CV chưa thể hiện từ khóa hoặc minh chứng dự án cụ thể về "${s}".`,
        severity: 'Cần lưu ý kiểm tra vòng phỏng vấn',
      });
    });

    missingPreferred.forEach((s) => {
      disadvantages.push({
        category: 'Kỹ năng ưu tiên chưa có',
        title: `Chưa Có Kỹ Năng Ưu Tiên: ${s}`,
        jobRequirement: `Tiêu chí khuyến khích ưu tiên: ${s}`,
        cvShortfall: `Chưa ghi nhận trong danh mục kỹ năng của CV.`,
        severity: 'Có thể đào tạo nội bộ 1-2 tuần',
      });
    });
  }

  return {
    matchingScore: score,
    matchTier: matchCategory,
    jobTitle,
    overallVerdict: liveAiReport?.overallVerdict || cand.aiReasoning || `Hồ sơ ứng viên đạt ${score}% theo ma trận so khớp ATS đa tiêu chí.`,
    executiveRecommendation: liveAiReport?.executiveRecommendation || (
      score >= 70
        ? 'Khuyến nghị HR ưu tiên duyệt hồ sơ và sắp xếp lịch phỏng vấn chuyên môn với đội ngũ kỹ thuật.'
        : 'Hồ sơ có một số tiêu chí chưa đáp ứng trọn vẹn. Cân nhắc phỏng vấn sàng lọc hoặc kiểm tra bài test kỹ thuật đầu vào.'
    ),
    advantages,
    disadvantages,
  };
}

/**
 * Hàm phân tích động văn bản thô (raw text) bóc tách từ file CV (PDF / DOCX)
 * Giúp đảm bảo 100% hiển thị đúng ứng viên, tiêu đề, kinh nghiệm, học vấn của chính file đã nộp.
 */
function parseCvRawText(rawText, fileName) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 15) return null;
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};

  const phoneMatch = rawText.match(/(?:\+?84|0)[35789](?:[\s.-]?\d){8}/);
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
  if (emailMatch) result.email = emailMatch[0].trim();

  let foundName = null;
  let foundHeadline = null;
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    if (line.includes('@') || line.includes('http') || line.match(/\d{9,}/) || line.includes('•')) continue;
    if (/about\s+me|objective|summary|tóm\s+tắt|kỹ\s+năng|skills|education|học\s+vấn/i.test(line)) break;
    if (/^[A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,3}$/u.test(line) ||
        /^[A-ZÀ-Ỹ]{2,}(?:\s+[A-ZÀ-Ỹ]{2,}){1,3}$/u.test(line)) {
      foundName = line;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!nextLine.includes('@') && !nextLine.match(/\d{9,}/) && nextLine.length > 2 && nextLine.length < 60) {
          foundHeadline = nextLine;
        }
      }
      break;
    }
  }

  if (!foundName && fileName) {
    const cleanFn = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (cleanFn.length > 2) foundName = cleanFn;
  }

  result.fullName = foundName;
  result.headline = foundHeadline;

  for (const line of lines.slice(0, 15)) {
    if (/nghệ\s+an|hà\s+nội|hồ\s+chí\s+minh|đà\s+nẵng|vietnam|việt\s+nam/i.test(line)) {
      result.address = line.replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/[-•]\s*(?:Nam|Nữ).*/i, '').trim();
      break;
    }
  }

  let inSummary = false;
  let summaryParts = [];
  for (const line of lines) {
    if (/^(?:ABOUT\s+ME|MỤC\s+TIÊU|CAREER\s+OBJECTIVE|TÓM\s+TẮT|SUMMARY)/i.test(line)) {
      inSummary = true;
      continue;
    }
    if (inSummary) {
      if (/^(?:PROJECT|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATION|HỌC\s+VẤN|KINH\s+NGHIỆM)/i.test(line)) {
        inSummary = false;
        break;
      }
      summaryParts.push(line);
    }
  }
  if (summaryParts.length > 0) result.summary = summaryParts.join(' ').trim();

  // Experience / Projects
  const experiences = [];
  let inExp = false;
  let currentExp = null;
  for (const line of lines) {
    if (/^(?:PROJECT\s+EXPERIENCE|WORK\s+EXPERIENCE|EXPERIENCE|KINH\s+NGHIỆM|DỰ\s+ÁN)/i.test(line)) {
      inExp = true;
      continue;
    }
    if (inExp) {
      if (/^(?:EDUCATION|HỌC\s+VẤN|SKILLS|KỸ\s+NĂNG|CERTIFICATION|CHỨNG\s+CHỈ|LANGUAGE|NGOẠI\s+NGỮ|ACHIEVEMENTS)/i.test(line)) {
        if (currentExp) experiences.push(currentExp);
        inExp = false;
        break;
      }
      const yearMatch = line.match(/(?:(?:19|20)\d{2}\s*[-–—/]\s*(?:(?:19|20)\d{2}|hiện\s+tại|present|nay))|^(?:19|20)\d{2}\b/i);
      if (yearMatch) {
        if (currentExp) experiences.push(currentExp);
        const rest = line.replace(yearMatch[0], '').trim();
        currentExp = {
          role: rest || 'Chuyên viên kỹ thuật',
          company: '',
          duration: yearMatch[0],
          period: yearMatch[0],
          highlights: []
        };
      } else if (currentExp) {
        if (!currentExp.company && line.length < 60 && !line.startsWith('•') && !line.startsWith('-')) {
          currentExp.company = line;
        } else {
          currentExp.highlights.push(line.replace(/^[•*+–-]\s*/, ''));
        }
      }
    }
  }
  if (currentExp && !experiences.includes(currentExp)) experiences.push(currentExp);
  if (experiences.length > 0) result.experiences = experiences;

  // Education
  const educations = [];
  let inEdu = false;
  let currentEdu = null;
  for (const line of lines) {
    if (/^(?:EDUCATION|HỌC\s+VẤN)/i.test(line)) {
      inEdu = true;
      continue;
    }
    if (inEdu) {
      if (/^(?:SKILLS|KỸ\s+NĂNG|PROJECT|EXPERIENCE|CERTIFICATION|CHỨNG\s+CHỈ|LANGUAGE|NGOẠI\s+NGỮ)/i.test(line)) {
        if (currentEdu) educations.push(currentEdu);
        inEdu = false;
        break;
      }
      if (/đại\s+học|university|college|fpt|học\s+viện/i.test(line)) {
        if (currentEdu) {
          currentEdu.school = line;
        } else {
          currentEdu = { school: line, degree: '', major: '', year: '2023 - 2026', period: '2023 - 2026' };
        }
      } else if (line.match(/(?:19|20)\d{2}\s*[-–—/]\s*(?:19|20)\d{2}/)) {
        if (currentEdu) {
          currentEdu.year = line;
          currentEdu.period = line;
        }
      } else if (!currentEdu) {
        currentEdu = { degree: line, major: line, school: '', year: '2023 - 2026', period: '2023 - 2026' };
      } else if (!currentEdu.major) {
        currentEdu.degree = line;
        currentEdu.major = line;
      }
    }
  }
  if (currentEdu && !educations.includes(currentEdu)) educations.push(currentEdu);
  if (educations.length > 0) result.educations = educations;

  // Skills
  const skills = [];
  let inSkills = false;
  for (const line of lines) {
    if (/^(?:SKILLS|KỸ\s+NĂNG)/i.test(line)) {
      inSkills = true;
      continue;
    }
    if (inSkills) {
      if (/^(?:LANGUAGE|NGOẠI\s+NGỮ|CERTIFICATION|CHỨNG\s+CHỈ|PROJECT|EXPERIENCE|EDUCATION)/i.test(line)) {
        inSkills = false;
        break;
      }
      const parts = line.split(/[,;•|\t]+/).map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
      for (const p of parts) {
        if (p.length >= 2 && p.length <= 40 && !p.endsWith(':')) {
          skills.push(p);
        }
      }
    }
  }
  if (skills.length > 0) result.skills = skills;

  // Certifications
  const certs = [];
  let inCert = false;
  for (const line of lines) {
    if (/^(?:CERTIFICATIONS|CHỨNG\s+CHỈ)/i.test(line)) {
      inCert = true;
      continue;
    }
    if (inCert) {
      if (/^(?:ACHIEVEMENTS|LANGUAGE|NGOẠI\s+NGỮ|SKILLS|PROJECT)/i.test(line)) {
        inCert = false;
        break;
      }
      if (line.length > 3 && !line.startsWith('•')) {
        certs.push({ name: line.replace(/^[•*+–-]\s*/, ''), issuer: 'Tổ chức chuyên môn', year: 'Đã cấp' });
      }
    }
  }
  if (certs.length > 0) result.certifications = certs;

  // Languages
  const langs = [];
  let inLang = false;
  for (const line of lines) {
    if (/^(?:LANGUAGE|NGOẠI\s+NGỮ)/i.test(line)) {
      inLang = true;
      continue;
    }
    if (inLang) {
      if (/^(?:ACHIEVEMENTS|CERTIFICATION|SKILLS|PROJECT|EDUCATION)/i.test(line)) {
        inLang = false;
        break;
      }
      if (/japan|tiếng\s+nhật|english|tiếng\s+anh|tiếng\s+việt/i.test(line)) {
        langs.push({ name: line.replace(/^[•*+–-]\s*/, ''), level: 'Thành thạo' });
      }
    }
  }
  if (langs.length > 0) result.languages = langs;

  return result;
}

/**
 * CandidateEvaluationPage.jsx
 * Trung tâm Đánh giá & Thẩm định Hồ sơ Ứng viên Chuẩn Executive ATS (HireMate AI).
 * Hiển thị chính xác CV bản gốc đã nộp (PDF viewer trực tiếp) kết hợp dữ liệu trích xuất ATS
 * và phân tích tương thích AI theo tỷ trọng 70% Bắt Buộc + 30% Ưu Tiên.
 */
export default function CandidateEvaluationPage({
  user,
  candidateId = null,
  jobId = null,
  cvId = null,
  applicationId = null,
  onBack,
}) {
  // 1. Phân tích tham số từ props hoặc URL Hash
  const hash = window.location.hash || '';
  const parsedCandId = candidateId || (hash.match(/candidateid=(\d+)/i) ? Number(hash.match(/candidateid=(\d+)/i)[1]) : null);
  const parsedJobId = jobId || (hash.match(/jobid=(\d+)/i) ? Number(hash.match(/jobid=(\d+)/i)[1]) : null);
  const parsedCvId = cvId || (hash.match(/cvid=(\d+)/i) ? Number(hash.match(/cvid=(\d+)/i)[1]) : null);
  const parsedAppId = applicationId || (hash.match(/appid=(\d+)/i) ? Number(hash.match(/appid=(\d+)/i)[1]) : null);
  const parsedAtsScore = hash.match(/atsscore=(\d+)/i) ? Number(hash.match(/atsscore=(\d+)/i)[1]) : null;

  const [isLoading, setIsLoading] = useState(true);

  // Recruiter Subscription State for feature gating
  const [recruiterSubscription, setRecruiterSubscription] = useState(null);

  useEffect(() => {
    paymentApi.getMySubscription()
      .then((res) => {
        const sub = res?.data?.data || res?.data;
        if (sub && sub.active) {
          setRecruiterSubscription(sub);
        }
      })
      .catch((e) => console.warn('Could not load recruiter subscription in evaluation', e));
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const subscriptionPerms = parseSubscriptionPermissions(recruiterSubscription, 'RECRUITER');
  const planPrice = Number(recruiterSubscription?.price || 0);
  const quotaLimit = Number(recruiterSubscription?.quotaLimit || 0);
  const isPaidRecruiter = recruiterSubscription && recruiterSubscription.active && planPrice > 0;
  const pName = (recruiterSubscription?.planName || '').toLowerCase();

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

  const isProOrHigher = isAdmin || ['PROFESSIONAL', 'ENTERPRISE'].includes(recruiterTier) || (isPaidRecruiter && (planPrice > 250000 || quotaLimit >= 30));
  const canSeeAiAnalysis = isAdmin || Boolean(subscriptionPerms.canSeeAiAnalysis) || Boolean(subscriptionPerms.aiMatching);
  const canDownloadCv = isAdmin || Boolean(subscriptionPerms.canDownloadCv) || Boolean(subscriptionPerms.unlockDirectContact);

  const [cand, setCand] = useState({
    id: parsedCandId,
    jobId: parsedJobId,
    applicationId: parsedAppId,
    name: 'Đang tải hồ sơ...',
    title: 'Hồ sơ ứng viên',
    roleSummary: 'HỒ SƠ ĐANG ĐƯỢC ĐỐI SOÁT VỚI TIÊU CHÍ JD',
    matchScore: parsedAtsScore || 0,
    skillsScore: 0,
    experienceScore: 0,
    educationScore: 0,
    semanticScore: 0,
    mandatoryScore: 0,
    preferredScore: 0,
    hasPersistedAiReport: false,
    avatar: null,
    location: 'Việt Nam',
    experience: 'Đang tải kinh nghiệm...',
    yearsOfExperience: 0,
    salary: 'Thỏa thuận',
    email: '',
    phone: '',
    status: 'REVIEWING',
    isWithdrawn: false,
    aiFitAssessment: 'ĐANG ĐỐI SOÁT AI MATCH',
    summary: 'Hồ sơ đã được đồng bộ hóa và thẩm định trên nền tảng HireMate AI.',
    company: user?.companyName || 'Doanh Nghiệp Tuyển Dụng',
    jobCode: parsedJobId ? `JD-${parsedJobId}` : 'JD-GENERAL',
    jobTitle: 'Vị trí Tuyển Dụng',
    cvId: parsedCvId,
    cvUrl: '#',
    cvFileName: 'CV_Ung_Vien.pdf',
    matchedMandatorySkills: [],
    missingMandatorySkills: [],
    matchedPreferredSkills: [],
    missingPreferredSkills: [],
    aiReasoning: 'Hệ thống AI đang đánh giá độ tương thích dựa trên chuẩn 70% kỹ năng bắt buộc và 30% kỹ năng ưu tiên.',
    aiReport: null,
    skills: [],
    experiences: [],
    educations: [],
    projects: [],
  });

  // Chế độ xem CV: 'pdf' (Xem file gốc PDF/Word) | 'parsed' (Dữ liệu trích xuất ATS)
  const [cvViewMode, setCvViewMode] = useState('pdf');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [cvMimeType, setCvMimeType] = useState('application/pdf');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [layoutRatio, setLayoutRatio] = useState('balanced'); // 'wide-cv' (4:8) | 'balanced' (5:7)

  // Modals state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Interview modal form data
  const [interviewDate, setInterviewDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [interviewTime, setInterviewTime] = useState('14:00');
  const [interviewType, setInterviewType] = useState('Technical Deep-dive');
  const [meetLink] = useState(`https://meet.google.com/hm-${Math.floor(1000 + Math.random() * 9000)}-eval`);

  // HR internal notes (Được lưu bền vững vào localStorage theo đơn ứng tuyển)
  const getInitialHrNotes = () => {
    try {
      const candidatesKeys = [parsedAppId, parsedCandId].filter(Boolean);
      for (const k of candidatesKeys) {
        const saved = localStorage.getItem(`hiremate_hr_notes_${k}`) || localStorage.getItem(`hiremate_hr_notes_app_${k}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        id: 1,
        author: user?.fullName || 'Bộ phận Tuyển Dụng',
        time: 'Hệ thống lưu',
        tag: 'Ưu tiên',
        text: 'Hồ sơ đã được thẩm định tự động qua bộ lọc AI ATS HireMate.',
      },
    ];
  };

  const [hrNotes, setHrNotes] = useState(getInitialHrNotes);

  const saveHrNotes = async (newNotes) => {
    setHrNotes(newNotes);
    const targetKeys = [cand.applicationId, parsedAppId, cand.id, parsedCandId].filter(Boolean);
    try {
      targetKeys.forEach((k) => {
        localStorage.setItem(`hiremate_hr_notes_${k}`, JSON.stringify(newNotes));
        localStorage.setItem(`hiremate_hr_notes_app_${k}`, JSON.stringify(newNotes));
      });
    } catch (e) {
      console.warn('Lỗi lưu hrNotes vào localStorage', e);
    }

    // Ghi chú nội bộ HR được lưu trữ an toàn trong LocalStorage theo appId/candId để đảm bảo tính bảo mật và không kích hoạt thông báo trạng thái nhầm cho ứng viên
    const appId = cand.applicationId || parsedAppId;
    if (appId) {
      console.log(`>> [HR Note] Đã lưu an toàn ghi chú nội bộ cho đơn ứng tuyển #${appId}`);
    }
  };

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Ưu tiên cao');
  const [rejectionReason, setRejectionReason] = useState('Khác định hướng tech stack');
  const [aiRejectionEmail, setAiRejectionEmail] = useState('');

  // AI Re-Score State & Handler
  const [isReScoring, setIsReScoring] = useState(false);
  const handleReScoreCandidate = async () => {
    if (!isProOrHigher) {
      triggerToast('Tính năng yêu cầu AI thẩm định sâu và viết báo cáo đối soát chi tiết chỉ mở khóa từ gói Hiring Pro (499.000đ) trở lên!');
      window.location.hash = '#/recruiter-pricing';
      return;
    }
    const targetJobId = cand.jobId || parsedJobId;
    const targetCandId = cand.id || parsedCandId;
    if (!targetCandId || !targetJobId) {
      triggerToast('Thiếu thông tin vị trí tuyển dụng hoặc mã ứng viên để chấm lại.');
      return;
    }
    try {
      setIsReScoring(true);
      triggerToast(`Đang yêu cầu AI đối soát chuyên sâu & chấm lại kỹ hơn cho hồ sơ ${cand.name}...`);
      const res = await aiMatchApi.getDetailedCandidateEvaluation(targetJobId, targetCandId, true);
      const data = res?.data?.data || res?.data || res;
      if (data?.matchingScore != null) {
        const freshScore = Math.round(data.matchingScore);
        const freshTier = data.matchTier || (freshScore >= 85 ? '⭐ Phù Hợp Xuất Sắc' : freshScore >= 70 ? '✨ Phù Hợp Tốt' : freshScore >= 50 ? '💡 Tiềm Năng' : 'Trau Dồi Kỹ Năng');
        const freshSkillsScore = data.skillsScore != null ? Math.round(data.skillsScore) : freshScore;
        const freshExpScore = data.experienceScore != null ? Math.round(data.experienceScore) : freshScore;
        const freshEduScore = data.educationScore != null ? Math.round(data.educationScore) : freshScore;
        const freshSemScore = data.semanticScore != null ? Math.round(data.semanticScore) : freshScore;

        setCand((prev) => {
          const updatedMandatory = Array.isArray(data.matchedMandatorySkills) && data.matchedMandatorySkills.length > 0
            ? data.matchedMandatorySkills
            : prev.matchedMandatorySkills;
          const updatedMissingMandatory = Array.isArray(data.missingMandatorySkills)
            ? data.missingMandatorySkills
            : prev.missingMandatorySkills;
          const updatedPreferred = Array.isArray(data.matchedPreferredSkills) && data.matchedPreferredSkills.length > 0
            ? data.matchedPreferredSkills
            : prev.matchedPreferredSkills;
          const updatedMissingPreferred = Array.isArray(data.missingPreferredSkills)
            ? data.missingPreferredSkills
            : prev.missingPreferredSkills;

          const freshReport = (data.advantages && data.advantages.length > 0)
            ? data
            : buildCandidateAiReport({
                ...prev,
                matchScore: freshScore,
                skillsScore: freshSkillsScore,
                experienceScore: freshExpScore,
                educationScore: freshEduScore,
                semanticScore: freshSemScore,
                matchedMandatorySkills: updatedMandatory,
                missingMandatorySkills: updatedMissingMandatory,
                matchedPreferredSkills: updatedPreferred,
                missingPreferredSkills: updatedMissingPreferred,
                aiReasoning: data.overallVerdict || data.executiveRecommendation || prev.aiReasoning,
              }, data);

          return {
            ...prev,
            hasPersistedAiReport: true,
            matchScore: freshScore,
            skillsScore: freshSkillsScore,
            experienceScore: freshExpScore,
            educationScore: freshEduScore,
            semanticScore: freshSemScore,
            mandatoryScore: freshSkillsScore,
            preferredScore: freshExpScore,
            aiFitAssessment: freshTier,
            aiReasoning: data.overallVerdict || data.executiveRecommendation || prev.aiReasoning,
            aiReport: freshReport,
            matchedMandatorySkills: updatedMandatory,
            missingMandatorySkills: updatedMissingMandatory,
            matchedPreferredSkills: updatedPreferred,
            missingPreferredSkills: updatedMissingPreferred,
          };
        });
        triggerToast(`Đã hoàn tất chấm lại bằng AI cho ứng viên ${cand.name}: ${freshScore}% AI Match!`);
      } else {
        triggerToast('Đã đối soát xong hồ sơ CV.');
      }
    } catch (err) {
      console.error('Lỗi khi chấm lại bằng AI:', err);
      triggerToast('Lỗi khi chấm lại bằng AI: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsReScoring(false);
    }
  };

  // 2. Fetch dữ liệu đa nguồn (API + Thread Cache fallback an toàn)
  useEffect(() => {
    let isMounted = true;
    let createdBlobUrl = null;

    // Tải trước file PDF/Word bất đồng bộ, không khóa giao diện đánh giá
    const loadPdfPreview = async (targetCvId, targetCvUrl, targetCvMeta) => {
      if (!isMounted) return;
      if (createdBlobUrl) {
        try { window.URL.revokeObjectURL(createdBlobUrl); } catch (e) {}
        createdBlobUrl = null;
      }
      setPdfBlobUrl(null);
      setIsPdfLoading(true);

      const fn = targetCvMeta?.fileName?.toLowerCase() || '';
      const fUrl = (targetCvMeta?.fileUrl || targetCvUrl || '').toLowerCase();

      // Nếu là CV Trực Tuyến được tạo trên Profile (không có tệp PDF tải lên từ đĩa)
      if (fUrl.includes('/candidate/profile') || fn.includes('cv_truc_tuyen')) {
        if (isMounted) {
          setPdfBlobUrl(null);
          setCvViewMode('parsed'); // Tự động ưu tiên hiển thị tab CV Online chuẩn xác 100%
          setIsPdfLoading(false);
        }
        return;
      }

      const isWord = fn.endsWith('.docx') || fn.endsWith('.doc') || targetCvMeta?.fileType?.includes('word');
      if (isWord) {
        if (isMounted) {
          setCvMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          setCvViewMode('pdf');
          setIsPdfLoading(false);
        }
        return;
      }

      if (targetCvId) {
        try {
          const previewRes = await cvApi.previewCv(targetCvId).catch(() => null);
          const isFallback = previewRes?.headers?.['x-hiremate-is-fallback'] === 'true';
          let detectedMime = previewRes?.headers?.['content-type']
            || (fn.endsWith('.png') ? 'image/png'
            : fn.endsWith('.jpg') || fn.endsWith('.jpeg') ? 'image/jpeg'
            : 'application/pdf');

          const blob = extractBlob(previewRes, detectedMime);
          const isHtml = blob && (blob.type === 'text/html' || String(detectedMime).includes('text/html'));
          if (blob && blob.size > 200 && !isHtml) {
            createdBlobUrl = window.URL.createObjectURL(blob);
            if (isMounted) {
              setPdfBlobUrl(createdBlobUrl);
              setCvMimeType(detectedMime);
              // Nếu là bản PDF Fallback (tệp vật lý cũ không tồn tại hoặc CV trực tuyến), tự động chuyển sang tab "CV Online" để HR xem toàn bộ hồ sơ chuẩn xác
              if (isFallback) {
                setCvViewMode('parsed');
              } else {
                setCvViewMode('pdf');
              }
              setIsPdfLoading(false);
              return;
            }
          } else {
            const dlRes = await cvApi.downloadCv(targetCvId).catch(() => null);
            const dlBlob = extractBlob(dlRes, detectedMime);
            const isDlHtml = dlBlob && (dlBlob.type === 'text/html' || String(detectedMime).includes('text/html'));
            if (dlBlob && dlBlob.size > 200 && !isDlHtml) {
              createdBlobUrl = window.URL.createObjectURL(dlBlob);
              if (isMounted) {
                setPdfBlobUrl(createdBlobUrl);
                setCvMimeType(detectedMime);
                setCvViewMode('parsed');
                setIsPdfLoading(false);
                return;
              }
            }
          }
        } catch (cvErr) {
          console.warn('Lỗi tải preview blob:', cvErr);
        }

        // Fallback 1: Trực tiếp endpoint API có kèm JWT token xác thực nếu có file URL hợp lệ
        if (fUrl && !fUrl.includes('/candidate/profile')) {
          const token = localStorage.getItem('token') || '';
          const apiBase = getApiBaseUrl();
          const directApiUrl = `${apiBase}/api/v1/cvs/${targetCvId}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
          if (isMounted) {
            setPdfBlobUrl(directApiUrl);
            setCvMimeType('application/pdf');
            setCvViewMode('pdf');
            setIsPdfLoading(false);
            return;
          }
        }
      }

      // Fallback 2: Nếu targetCvUrl là đường dẫn tệp cụ thể
      if (targetCvUrl && targetCvUrl !== '#' && !targetCvUrl.includes('/candidate/profile')) {
        const apiBase = getApiBaseUrl();
        const fullUrl = targetCvUrl.startsWith('http') ? targetCvUrl : `${apiBase}${targetCvUrl.startsWith('/') ? '' : '/'}${targetCvUrl}`;
        if (isMounted) {
          setPdfBlobUrl(fullUrl);
          setCvMimeType('application/pdf');
          setCvViewMode('pdf');
          setIsPdfLoading(false);
          return;
        }
      }

      // Nếu chưa có file PDF hợp lệ, tự động hiển thị tab CV Online ngay tức thì
      if (isMounted) {
        setPdfBlobUrl(null);
        setCvViewMode('parsed');
        setIsPdfLoading(false);
      }
    };

    const fetchCandidateData = async () => {
      setIsLoading(true);
      setPdfBlobUrl(null);

      try {
        let candidateName = '';
        let candidateEmail = '';
        let candidatePhone = '';
        let candidateAvatar = null;
        let jobTitle = '';
        let matchScore = 0;
        let effectiveJobId = parsedJobId || null;
        let effectiveCvId = parsedCvId || null;
        let cvUrl = '#';
        let appStatus = 'REVIEWING';
        let effectiveAppId = parsedAppId || null;
        let resolvedCandId = parsedCandId || null;
        let isWithdrawn = false;

        let profileData = null;
        let jobData = null;
        let appData = null;
        let cvData = null;
        let candMatch = null;
        let directEvalReport = null;
        let hasPersistedReport = false;
        // 1. Nếu có appId, gọi API lấy chi tiết đơn để lấy jobId, cvId, candidateId chính xác
        if (effectiveAppId) {
          try {
            const singleAppRes = await applicationApi.getApplicationById(effectiveAppId);
            const singleApp = singleAppRes?.data?.data || singleAppRes?.data;
            if (singleApp) {
              appData = singleApp;
              if (singleApp.jobId) effectiveJobId = singleApp.jobId;
              if (singleApp.cvId) effectiveCvId = singleApp.cvId;
              if (singleApp.candidateId) resolvedCandId = singleApp.candidateId;
            }
          } catch (e) {
            console.warn('Could not load application by ID directly:', e);
          }

          if (!effectiveJobId || !resolvedCandId) {
            try {
              const myAppsRes = await applicationApi.getMyRecruiterApplications();
              const list = myAppsRes?.data?.data || myAppsRes?.data || [];
              if (Array.isArray(list)) {
                const found = list.find(a => Number(a.applicationId) === Number(effectiveAppId));
                if (found) {
                  appData = found;
                  if (found.jobId) effectiveJobId = found.jobId;
                  if (found.cvId) effectiveCvId = found.cvId;
                  if (found.candidateId) resolvedCandId = found.candidateId;
                }
              }
            } catch (err) {
              console.warn('Fallback getMyRecruiterApplications failed:', err);
            }
          }
        }

        // Tự động tìm hồ sơ đầu tiên của nhà tuyển dụng nếu URL không chứa bất kỳ ID nào
        if (!effectiveJobId && !resolvedCandId && !effectiveAppId) {
          try {
            const myAppsRes = await applicationApi.getMyRecruiterApplications();
            const list = myAppsRes?.data?.data || myAppsRes?.data || [];
            if (Array.isArray(list) && list.length > 0) {
              const firstApp = list[0];
              effectiveAppId = firstApp.applicationId;
              effectiveJobId = firstApp.jobId;
              effectiveCvId = firstApp.cvId;
              resolvedCandId = firstApp.candidateId;
              appData = firstApp;
            }
          } catch (err) {
            console.warn('Fallback finding any recruiter application failed:', err);
          }
        }

        // Nếu có CV ID nhưng chưa có candidateId
        if (effectiveCvId && !resolvedCandId) {
          try {
            const initialCvRes = await cvApi.getCvById(effectiveCvId).catch(() => null);
            const initCv = initialCvRes?.data?.data || initialCvRes?.data;
            if (initCv) {
              cvData = initCv;
              if (initCv.candidateId) resolvedCandId = initCv.candidateId;
            }
          } catch (e) {
            console.warn('Error fetching initial CV by ID:', e);
          }
        }

        // 2. Gọi song song các API backend để lấy thông tin hồ sơ & vị trí & báo cáo AI đã lưu
        try {
          const promises = [];
          if (resolvedCandId) {
            promises.push(applicationApi.getCandidateProfile(resolvedCandId).catch(() => null));
          } else {
            promises.push(Promise.resolve(null));
          }

          if (effectiveJobId) {
            promises.push(jobApi.getJobById(effectiveJobId).catch(() => null));
            promises.push(applicationApi.getJobApplications(effectiveJobId).catch(() => null));
            promises.push(aiMatchApi.getJobMatchesForRecruiter(effectiveJobId).catch(() => null));
          } else {
            promises.push(Promise.resolve(null));
            promises.push(Promise.resolve(null));
            promises.push(Promise.resolve(null));
          }

          if (effectiveCvId && !cvData) {
            promises.push(cvApi.getCvById(effectiveCvId).catch(() => null));
          } else {
            promises.push(Promise.resolve(null));
          }

          // 0ms, 0 Token: Luôn nạp sẵn báo cáo AI chuyên sâu đã lưu cứng trong CSDL từ trước
          if (effectiveJobId && resolvedCandId) {
            promises.push(aiMatchApi.getDetailedCandidateEvaluation(effectiveJobId, resolvedCandId, false).catch(() => null));
          } else {
            promises.push(Promise.resolve(null));
          }

          const [profRes, jRes, appsRes, matchesRes, cvDetailRes, evalReportRes] = await Promise.all(promises);

          profileData = profRes?.data?.data || profRes?.data || null;
          jobData = jRes?.data?.data || jRes?.data || null;
          if (cvDetailRes) {
            cvData = cvDetailRes?.data?.data || cvDetailRes?.data || cvData;
          }

          const rawEvalReport = evalReportRes?.data?.data || evalReportRes?.data || evalReportRes;
          if (rawEvalReport && (rawEvalReport.matchingScore != null || (Array.isArray(rawEvalReport.advantages) && rawEvalReport.advantages.length > 0))) {
            directEvalReport = rawEvalReport;
            hasPersistedReport = true;
          }

          const appsList = Array.isArray(appsRes?.data?.data)
            ? appsRes.data.data
            : Array.isArray(appsRes?.data)
            ? appsRes.data
            : Array.isArray(appsRes)
            ? appsRes
            : [];

          const matchesList = Array.isArray(matchesRes?.data?.data)
            ? matchesRes.data.data
            : Array.isArray(matchesRes?.data)
            ? matchesRes.data
            : Array.isArray(matchesRes)
            ? matchesRes
            : [];

          // Cập nhật candidateId nếu phát hiện từ CV
          if (!resolvedCandId && cvData?.candidateId) {
            resolvedCandId = cvData.candidateId;
          }

          // Tìm candidate match từ AI Job Matches
          if (matchesList.length > 0) {
            candMatch = matchesList.find(
              (m) => (resolvedCandId && Number(m.candidateId) === Number(resolvedCandId)) ||
                     (parsedCandId && Number(m.candidateId) === Number(parsedCandId))
            ) || null;
          }

          // Tìm application
          if (appsList.length > 0) {
            appData = appsList.find(
              (a) =>
                (effectiveAppId && Number(a.applicationId) === Number(effectiveAppId)) ||
                (resolvedCandId && Number(a.candidateId) === Number(resolvedCandId)) ||
                (parsedCandId && Number(a.candidateId) === Number(parsedCandId))
            ) || appData || null;
          }

          // Lấy jobId hoặc candidateId từ appData nếu chưa có
          if (appData) {
            if (!effectiveJobId && appData.jobId) effectiveJobId = appData.jobId;
            if (!resolvedCandId && appData.candidateId) resolvedCandId = appData.candidateId;
            if (!effectiveCvId && appData.cvId) effectiveCvId = appData.cvId;
          }

          // Fallback đọc báo cáo AI nếu chưa nạp được ở bước song song
          if (!hasPersistedReport && effectiveJobId && resolvedCandId) {
            try {
              const fallbackEvalRes = await aiMatchApi.getDetailedCandidateEvaluation(effectiveJobId, resolvedCandId, false).catch(() => null);
              const fallbackEval = fallbackEvalRes?.data?.data || fallbackEvalRes?.data || fallbackEvalRes;
              if (fallbackEval && (fallbackEval.matchingScore != null || (Array.isArray(fallbackEval.advantages) && fallbackEval.advantages.length > 0))) {
                directEvalReport = fallbackEval;
                hasPersistedReport = true;
              }
            } catch (e) {}
          }

          if (!hasPersistedReport && (appData?.evaluationNotes || appData?.notes)) {
            try {
              const rawStr = (appData.evaluationNotes || appData.notes || '').trim();
              if (rawStr.startsWith('{') && (rawStr.includes('advantages') || rawStr.includes('matchingScore'))) {
                const parsedEval = JSON.parse(rawStr);
                if (parsedEval && Array.isArray(parsedEval.advantages) && parsedEval.advantages.length > 0) {
                  directEvalReport = parsedEval;
                  hasPersistedReport = true;
                }
              }
            } catch (e) {}
          }

          if (directEvalReport && directEvalReport.matchingScore != null) {
            // Ưu tiên điểm chính thức từ candMatch (ai_job_matches) hoặc appData, tránh bị ghi đè bởi cache cũ
            const authoritativeScore = candMatch?.matchingScore != null
              ? candMatch.matchingScore
              : (appData?.matchingScore != null ? appData.matchingScore : (parsedAtsScore != null ? parsedAtsScore : directEvalReport.matchingScore));

            candMatch = {
              ...candMatch,
              ...directEvalReport,
              matchingScore: authoritativeScore,
              skillsScore: candMatch?.skillsScore != null ? candMatch.skillsScore : (directEvalReport.skillsScore ?? authoritativeScore),
              experienceScore: candMatch?.experienceScore != null ? candMatch.experienceScore : (directEvalReport.experienceScore ?? authoritativeScore),
              educationScore: candMatch?.educationScore != null ? candMatch.educationScore : (directEvalReport.educationScore ?? authoritativeScore),
              semanticScore: candMatch?.semanticScore != null ? candMatch.semanticScore : (directEvalReport.semanticScore ?? authoritativeScore),
            };
            matchScore = Math.round(authoritativeScore);
          }

          // Nếu trước đó chưa load được profileData mà giờ đã có resolvedCandId
          if (!profileData && resolvedCandId) {
            try {
              const extraProfRes = await applicationApi.getCandidateProfile(resolvedCandId).catch(() => null);
              profileData = extraProfRes?.data?.data || extraProfRes?.data || null;
            } catch (e) {}
          }

          // Cập nhật từ profile API nếu có
          if (profileData) {
            candidateName = profileData.fullName || candidateName;
            candidateEmail = profileData.email || candidateEmail;
            candidatePhone = profileData.phone || candidatePhone;
            candidateAvatar = resolveUserAvatar(profileData.avatarUrl) || resolveUserAvatar(candidateAvatar);
          }

          // Cập nhật từ job API nếu có
          if (jobData) {
            jobTitle = jobData.title || jobTitle;
          }

          // Cập nhật từ appData nếu có
          isWithdrawn = false;
          if (appData) {
            effectiveAppId = appData.applicationId;
            candidateName = appData.candidateName || candidateName;
            candidateEmail = appData.candidateEmail || candidateEmail;
            jobTitle = appData.jobTitle || jobTitle;
            if (candMatch?.matchingScore != null) {
              matchScore = Math.round(candMatch.matchingScore);
            } else if (appData.matchingScore != null) {
              matchScore = Math.round(appData.matchingScore);
            }
            appStatus = appData.status || appStatus;

            // Khôi phục ghi chú đánh giá từ Backend nếu có
            if (appData.evaluationNotes || appData.notes) {
              try {
                const parsedNotes = JSON.parse(appData.evaluationNotes || appData.notes);
                if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
                  setHrNotes(parsedNotes);
                }
              } catch {
                const rawNote = appData.evaluationNotes || appData.notes;
                if (rawNote && !rawNote.startsWith('{')) {
                  setHrNotes([{
                    id: 1,
                    author: user?.fullName || 'Bộ phận Tuyển Dụng',
                    time: 'Hệ thống lưu',
                    tag: 'Đánh giá HR',
                    text: rawNote,
                  }]);
                }
              }
            }
            if (appData.cvId) effectiveCvId = appData.cvId;
            if (appData.cvUrl) cvUrl = appData.cvUrl;
            isWithdrawn = Boolean(
              appData.withdrawnByCandidate ||
              (appData.status === 'REJECTED' && (
                (appData.rejectionReason && appData.rejectionReason.includes('WITHDRAWN_BY_CANDIDATE')) ||
                (appData.rejectReason && appData.rejectReason.includes('WITHDRAWN_BY_CANDIDATE')) ||
                (appData.rejectionReason && appData.rejectionReason.toLowerCase().includes('rút đơn')) ||
                (appData.rejectReason && appData.rejectReason.toLowerCase().includes('rút đơn'))
              ))
            );
          }

          // Xác định CV mục tiêu từ danh sách CV của ứng viên nếu chưa có
          if (!effectiveCvId && profileData?.cvs && profileData.cvs.length > 0) {
            const defaultCv = profileData.cvs.find((c) => c.isDefault) || profileData.cvs[0];
            if (defaultCv) {
              effectiveCvId = defaultCv.cvId;
              cvUrl = defaultCv.fileUrl || cvUrl;
            }
          }

          // Đảm bảo luôn nạp đúng cvData của effectiveCvId (nếu chưa có hoặc ID không khớp)
          if (effectiveCvId && (!cvData || Number(cvData.cvId) !== Number(effectiveCvId))) {
            const extraCvRes = await cvApi.getCvById(effectiveCvId).catch(() => null);
            cvData = extraCvRes?.data?.data || extraCvRes?.data || cvData;
          }
          if (cvData?.fileUrl) {
            cvUrl = cvData.fileUrl;
          }
        } catch (err) {
          console.warn('Lỗi tải dữ liệu ứng viên từ API:', err);
        }

        // 3. Kích hoạt tải PDF Blob bất đồng bộ (HOÀN TOÀN KHÔNG CHẶN HIỂN THỊ HỒ SƠ ỨNG VIÊN)
        loadPdfPreview(effectiveCvId, cvUrl, cvData);

        // 4. Phân tích dữ liệu trích xuất từ chính bản CV ứng viên đã nộp (Ưu tiên tuyệt đối CV cụ thể)
        const rawParsed = parseCvRawText(cvData?.parsedText, cvData?.fileName) || {};

        let parsedJson = null;
        try {
          if (cvData?.parsedJson) {
            parsedJson = typeof cvData.parsedJson === 'string' ? JSON.parse(cvData.parsedJson) : cvData.parsedJson;
          }
        } catch (ignored) {}

        const pData = cvData?.parsedData || parsedJson || {};

        // 1. Trích xuất kinh nghiệm làm việc thực tế của chính bản CV đã nộp trước tiên
        let experiences = [];
        if (Array.isArray(rawParsed?.experiences) && rawParsed.experiences.length > 0) {
          experiences = rawParsed.experiences;
        } else if (pData?.experiences && Array.isArray(pData.experiences) && pData.experiences.length > 0) {
          experiences = pData.experiences;
        } else if (parsedJson?.experiences && Array.isArray(parsedJson.experiences) && parsedJson.experiences.length > 0) {
          experiences = parsedJson.experiences;
        } else if (parsedJson?.experience && Array.isArray(parsedJson.experience) && parsedJson.experience.length > 0) {
          experiences = parsedJson.experience;
        } else if (cvData?.parsedData?.experiences && Array.isArray(cvData.parsedData.experiences) && cvData.parsedData.experiences.length > 0) {
          experiences = cvData.parsedData.experiences;
        } else if (cvData?.experiencesJson) {
          try {
            const expArr = typeof cvData.experiencesJson === 'string' ? JSON.parse(cvData.experiencesJson) : cvData.experiencesJson;
            if (Array.isArray(expArr) && expArr.length > 0) experiences = expArr;
          } catch (ignored) {}
        }
        // Fallback an toàn: nếu bản CV thiếu hoặc không bóc tách được kinh nghiệm, sử dụng kinh nghiệm thực tế từ hồ sơ ứng viên
        if (experiences.length === 0 && profileData?.experiencesJson) {
          try {
            const expArr = typeof profileData.experiencesJson === 'string' ? JSON.parse(profileData.experiencesJson) : profileData.experiencesJson;
            if (Array.isArray(expArr) && expArr.length > 0) experiences = expArr;
          } catch (ignored) {}
        }

        // 2. Trích xuất họ tên thật của CV cụ thể (Lọc bỏ triệt để tên file như "Japanese Communication", "Resume.pdf")
        const isNameLikeFileName = (nameStr) => {
          if (!nameStr || typeof nameStr !== 'string') return true;
          const clean = nameStr.trim().toLowerCase();
          if (clean === 'ứng viên' || clean === 'ung vien' || clean.includes('đang tải') || clean.length < 2) return true;
          if (cvData?.fileName && clean === cvData.fileName.toLowerCase().replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()) return true;
          if (clean.endsWith('.pdf') || clean.endsWith('.docx') || clean.endsWith('.doc')) return true;
          if (clean.includes('japanese communication') || clean.includes('resume') || clean.includes('curriculum vitae') || clean.includes('technical stack')) return true;
          return false;
        };

        const cvCandidateName = rawParsed?.fullName || pData?.fullName || pData?.full_name || pData?.candidateName || pData?.candidate_name ||
          parsedJson?.fullName || parsedJson?.full_name || parsedJson?.candidateName || parsedJson?.candidate_name || parsedJson?.name ||
          cvData?.fullName;

        if (cvCandidateName && !isNameLikeFileName(cvCandidateName)) {
          candidateName = cvCandidateName.trim();
        } else if (appData?.candidateName && !isNameLikeFileName(appData.candidateName)) {
          candidateName = appData.candidateName.trim();
        } else if (profileData?.fullName && !isNameLikeFileName(profileData.fullName)) {
          candidateName = profileData.fullName.trim();
        } else if (appData?.candidateEmail) {
          candidateName = appData.candidateEmail.split('@')[0];
        } else {
          candidateName = 'Ứng viên';
        }

        const cvCandidateEmail = rawParsed?.email || pData?.email || parsedJson?.email || cvData?.email;
        if (cvCandidateEmail && typeof cvCandidateEmail === 'string' && cvCandidateEmail.trim().length > 3) {
          candidateEmail = cvCandidateEmail.trim();
        } else if (profileData?.email) {
          candidateEmail = profileData.email;
        } else if (appData?.candidateEmail) {
          candidateEmail = appData.candidateEmail;
        }

        const cvCandidatePhone = rawParsed?.phone || pData?.phone || pData?.phoneNumber || pData?.phone_number ||
          parsedJson?.phone || parsedJson?.phoneNumber || parsedJson?.phone_number || cvData?.phone;
        if (cvCandidatePhone && typeof cvCandidatePhone === 'string' && cvCandidatePhone.trim().length > 5) {
          candidatePhone = cvCandidatePhone.trim();
        } else if (profileData?.phone) {
          candidatePhone = profileData.phone;
        } else if (appData?.candidatePhone) {
          candidatePhone = appData.candidatePhone;
        }

        const cvCandidateAddress = rawParsed?.address || pData?.address || pData?.location || parsedJson?.address || parsedJson?.location || cvData?.address;
        const candidateLocation = (cvCandidateAddress && typeof cvCandidateAddress === 'string' && cvCandidateAddress.trim().length > 1)
          ? cvCandidateAddress.trim()
          : (profileData?.location || profileData?.address || 'Chưa cập nhật địa chỉ');

        // 3. Tiêu đề nghề nghiệp (Headline / Role): Ưu tiên tuyệt đối từ bản CV này
        let candidateTitle = '';
        if (rawParsed?.headline && rawParsed.headline.length > 2 && !rawParsed.headline.includes('|')) {
          candidateTitle = rawParsed.headline.trim();
        } else if (pData?.headline && typeof pData.headline === 'string' && !pData.headline.includes('|')) {
          candidateTitle = pData.headline.trim();
        } else if (pData?.title && typeof pData.title === 'string' && !pData.title.includes('|')) {
          candidateTitle = pData.title.trim();
        } else if (parsedJson?.headline && typeof parsedJson.headline === 'string' && !parsedJson.headline.includes('|')) {
          candidateTitle = parsedJson.headline.trim();
        } else if (cvData?.headline && typeof cvData.headline === 'string' && !cvData.headline.includes('|')) {
          candidateTitle = cvData.headline.trim();
        } else if (experiences.length > 0 && experiences[0]?.role) {
          // Lấy ngay chức danh công việc thực tế gần nhất của chính bản CV này!
          candidateTitle = experiences[0].role.trim();
        } else if (profileData?.headline && !profileData.headline.includes('|')) {
          candidateTitle = profileData.headline.trim();
        } else {
          candidateTitle = jobTitle ? `${jobTitle} • Ứng viên` : 'Chuyên viên';
        }
        if (candidateTitle) {
          candidateTitle = candidateTitle.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
        }

        // 4. Lấy danh sách kỹ năng thực tế (Ưu tiên CV đã nộp: rawParsed, pData, parsedJson, detectedSkills, profileData)
        let cleanSkills = [];
        if (Array.isArray(rawParsed?.skills) && rawParsed.skills.length > 0) {
          cleanSkills = rawParsed.skills;
        } else if (pData?.skills && Array.isArray(pData.skills) && pData.skills.length > 0) {
          cleanSkills = pData.skills.filter((s) => typeof s === 'string' && s.trim().length > 1);
        } else if (parsedJson?.skills && Array.isArray(parsedJson.skills) && parsedJson.skills.length > 0) {
          cleanSkills = parsedJson.skills.filter((s) => typeof s === 'string' && s.trim().length > 1);
        } else if (cvData?.detectedSkills && Array.isArray(cvData.detectedSkills) && cvData.detectedSkills.length > 0) {
          cleanSkills = cvData.detectedSkills.filter(Boolean);
        } else if (cvData?.parsedData?.skills && Array.isArray(cvData.parsedData.skills) && cvData.parsedData.skills.length > 0) {
          cleanSkills = cvData.parsedData.skills.filter(Boolean);
        }
        if (cleanSkills.length === 0 && profileData?.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) {
          cleanSkills = profileData.skills.map((s) => s.skillName || s.name || s).filter(Boolean);
        }

        // Bổ sung kỹ năng ngôn ngữ từ text nếu là hồ sơ ngoại ngữ / dịch thuật
        if (cvData?.parsedText) {
          const ptLower = cvData.parsedText.toLowerCase();
          if ((ptLower.contains ? ptLower.contains('tiếng nhật') : ptLower.includes('tiếng nhật')) || ptLower.includes('japanese')) {
            if (!cleanSkills.includes('Tiếng Nhật')) cleanSkills.unshift('Tiếng Nhật');
          }
          if (ptLower.includes('translation') || ptLower.includes('dịch thuật')) {
            if (!cleanSkills.includes('Biên Phiên Dịch')) cleanSkills.push('Biên Phiên Dịch');
          }
          if (ptLower.includes('tutor') || ptLower.includes('giảng dạy')) {
            if (!cleanSkills.includes('Giảng Dạy / Tutor')) cleanSkills.push('Giảng Dạy / Tutor');
          }
        }

        // Lọc sạch các mảnh text vụn từ OCR / 2-column mashing
        cleanSkills = cleanSkills.filter((s) => {
          if (!s || typeof s !== 'string') return false;
          const clean = s.trim();
          if (clean.length < 2 || clean.length > 30) return false;
          if (/^(?:and|in|between|with|or|to|for|of|the|a|an)\s+/i.test(clean)) return false;
          if (clean.split(/\s+/).length > 3) return false;
          return true;
        });

        // 5. Tóm tắt nghề nghiệp / About Me: Ưu tiên bóc tách từ file CV gốc đã nộp
        let candidateSummary = '';
        if (rawParsed?.summary && rawParsed.summary.length > 15 && !rawParsed.summary.includes('Uploaded via HireMate')) {
          candidateSummary = rawParsed.summary.trim();
        } else if (pData?.summary && typeof pData.summary === 'string' && pData.summary.length > 15 && !pData.summary.includes('Uploaded via HireMate')) {
          candidateSummary = pData.summary.trim();
        } else if (parsedJson?.summary && typeof parsedJson.summary === 'string' && parsedJson.summary.length > 15 && !parsedJson.summary.includes('Uploaded via HireMate')) {
          candidateSummary = parsedJson.summary.trim();
        } else if (cvData?.summary && typeof cvData.summary === 'string' && cvData.summary.length > 15 && !cvData.summary.includes('Uploaded via HireMate')) {
          candidateSummary = cvData.summary.trim();
        } else if (experiences.length > 0) {
          const topRoles = experiences.slice(0, 2).map(e => e.role || e.company).filter(Boolean).join(' • ');
          candidateSummary = `Ứng viên có bề dày năng lực và kinh nghiệm thực chiến với vai trò ${topRoles || candidateTitle}. Hồ sơ được đối soát và chuẩn hóa tự động theo đúng bản CV nộp ứng tuyển.`;
        } else if (profileData?.bio && typeof profileData.bio === 'string' && profileData.bio.length > 10) {
          candidateSummary = profileData.bio.trim();
        } else {
          candidateSummary = 'Hồ sơ đã được đồng bộ hóa và thẩm định trên nền tảng HireMate AI.';
        }

        candidateAvatar = resolveUserAvatar(profileData?.avatarUrl) || resolveUserAvatar(appData?.candidateAvatar) || resolveUserAvatar(candidateAvatar);
        jobTitle = jobData?.title || appData?.jobTitle || jobTitle || (effectiveJobId ? `Vị trí Tuyển Dụng #${effectiveJobId}` : 'Vị trí Tuyển Dụng');

        if (cleanSkills.length === 0 && directEvalReport?.advantages) {
          directEvalReport.advantages.forEach((adv) => {
            if (adv.title && !adv.title.toLowerCase().includes('đại học') && !adv.title.toLowerCase().includes('chứng chỉ')) {
              cleanSkills.push(adv.title);
            }
          });
        }

        // Lấy ma trận kỹ năng phân loại theo nhóm (Skills Matrix)
        let skillCategories = [];
        if (pData?.skillCategories && Array.isArray(pData.skillCategories) && pData.skillCategories.length > 0) {
          skillCategories = pData.skillCategories;
        } else if (pData?.skill_categories && Array.isArray(pData.skill_categories) && pData.skill_categories.length > 0) {
          skillCategories = pData.skill_categories;
        } else if (parsedJson?.skillCategories && Array.isArray(parsedJson.skillCategories) && parsedJson.skillCategories.length > 0) {
          skillCategories = parsedJson.skillCategories;
        } else if (parsedJson?.skill_categories && Array.isArray(parsedJson.skill_categories) && parsedJson.skill_categories.length > 0) {
          skillCategories = parsedJson.skill_categories;
        } else if (cleanSkills.length > 0) {
          skillCategories = [
            {
              category: 'Kỹ Năng Chuyên Môn Trích Xuất',
              items: cleanSkills,
            },
          ];
        }

        // Fallback mô tả kinh nghiệm từ coverLetter / summary nếu mảng rỗng
        if (experiences.length === 0 && (appData?.candidateExperienceSummary || appData?.coverLetter)) {
          const textSummary = appData.candidateExperienceSummary || appData.coverLetter;
          if (textSummary && textSummary.length > 15 && !textSummary.includes('[CV_TEMPLATE')) {
            experiences = [{
              role: candidateTitle || profileData?.headline || jobTitle || 'Chuyên viên kỹ thuật',
              company: 'Kinh nghiệm thực tế ghi nhận từ hồ sơ',
              period: 'Gần đây',
              description: textSummary.replace(/\[CV_TEMPLATE:[^\]]+\]/g, '').trim(),
            }];
          }
        }

        // Lấy học vấn thực tế của ứng viên (Ưu tiên CV đã nộp)
        let educations = [];
        if (Array.isArray(rawParsed?.educations) && rawParsed.educations.length > 0) {
          educations = rawParsed.educations;
        } else if (pData?.educations && Array.isArray(pData.educations) && pData.educations.length > 0) {
          educations = pData.educations;
        } else if (parsedJson?.educations && Array.isArray(parsedJson.educations) && parsedJson.educations.length > 0) {
          educations = parsedJson.educations;
        } else if (parsedJson?.education && Array.isArray(parsedJson.education) && parsedJson.education.length > 0) {
          educations = parsedJson.education;
        } else if (cvData?.parsedData?.educations && Array.isArray(cvData.parsedData.educations) && cvData.parsedData.educations.length > 0) {
          educations = cvData.parsedData.educations;
        } else if (cvData?.educationsJson) {
          try {
            const eduArr = typeof cvData.educationsJson === 'string' ? JSON.parse(cvData.educationsJson) : cvData.educationsJson;
            if (Array.isArray(eduArr) && eduArr.length > 0) educations = eduArr;
          } catch (ignored) {}
        }
        if (educations.length === 0 && profileData?.educationsJson) {
          try {
            const eduArr = typeof profileData.educationsJson === 'string' ? JSON.parse(profileData.educationsJson) : profileData.educationsJson;
            if (Array.isArray(eduArr) && eduArr.length > 0) educations = eduArr;
          } catch (ignored) {}
        }

        // Lấy chứng chỉ quốc tế thực tế của ứng viên
        let certifications = [];
        if (pData?.certifications && Array.isArray(pData.certifications) && pData.certifications.length > 0) {
          certifications = pData.certifications;
        } else if (parsedJson?.certifications && Array.isArray(parsedJson.certifications) && parsedJson.certifications.length > 0) {
          certifications = parsedJson.certifications;
        } else if (cvData?.parsedData?.certifications && Array.isArray(cvData.parsedData.certifications) && cvData.parsedData.certifications.length > 0) {
          certifications = cvData.parsedData.certifications;
        } else if (Array.isArray(rawParsed.certifications) && rawParsed.certifications.length > 0) {
          certifications = rawParsed.certifications;
        } else if (cvData?.certificationsJson) {
          try {
            const certArr = typeof cvData.certificationsJson === 'string' ? JSON.parse(cvData.certificationsJson) : cvData.certificationsJson;
            if (Array.isArray(certArr) && certArr.length > 0) certifications = certArr;
          } catch (ignored) {}
        }
        if (certifications.length === 0 && profileData?.certificationsJson) {
          try {
            const certArr = typeof profileData.certificationsJson === 'string' ? JSON.parse(profileData.certificationsJson) : profileData.certificationsJson;
            if (Array.isArray(certArr) && certArr.length > 0) certifications = certArr;
          } catch (ignored) {}
        }

        // Lấy ngoại ngữ thành thạo thực tế của ứng viên
        let languages = [];
        if (pData?.languages && Array.isArray(pData.languages) && pData.languages.length > 0) {
          languages = pData.languages;
        } else if (parsedJson?.languages && Array.isArray(parsedJson.languages) && parsedJson.languages.length > 0) {
          languages = parsedJson.languages;
        } else if (cvData?.parsedData?.languages && Array.isArray(cvData.parsedData.languages) && cvData.parsedData.languages.length > 0) {
          languages = cvData.parsedData.languages;
        } else if (Array.isArray(rawParsed.languages) && rawParsed.languages.length > 0) {
          languages = rawParsed.languages;
        } else if (cvData?.languagesJson) {
          try {
            const langArr = typeof cvData.languagesJson === 'string' ? JSON.parse(cvData.languagesJson) : cvData.languagesJson;
            if (Array.isArray(langArr) && langArr.length > 0) languages = langArr;
          } catch (ignored) {}
        }
        if (languages.length === 0 && profileData?.languagesJson) {
          try {
            const langArr = typeof profileData.languagesJson === 'string' ? JSON.parse(profileData.languagesJson) : profileData.languagesJson;
            if (Array.isArray(langArr) && langArr.length > 0) languages = langArr;
          } catch (ignored) {}
        }

        // Lấy dự án trọng điểm thực tế của ứng viên
        let projects = [];
        if (pData?.projects && Array.isArray(pData.projects) && pData.projects.length > 0) {
          projects = pData.projects;
        } else if (parsedJson?.projects && Array.isArray(parsedJson.projects) && parsedJson.projects.length > 0) {
          projects = parsedJson.projects;
        } else if (cvData?.parsedData?.projects && Array.isArray(cvData.parsedData.projects) && cvData.parsedData.projects.length > 0) {
          projects = cvData.parsedData.projects;
        } else if (Array.isArray(rawParsed.projects) && rawParsed.projects.length > 0) {
          projects = rawParsed.projects;
        } else if (cvData?.projectsJson) {
          try {
            const projArr = typeof cvData.projectsJson === 'string' ? JSON.parse(cvData.projectsJson) : cvData.projectsJson;
            if (Array.isArray(projArr) && projArr.length > 0) projects = projArr;
          } catch (ignored) {}
        }
        if (projects.length === 0 && profileData?.projectsJson) {
          try {
            const projArr = typeof profileData.projectsJson === 'string' ? JSON.parse(profileData.projectsJson) : profileData.projectsJson;
            if (Array.isArray(projArr) && projArr.length > 0) projects = projArr;
          } catch (ignored) {}
        }

        // Đồng bộ dự án từ experiences nếu projects rỗng mà experiences có nội dung dự án
        if (projects.length === 0 && experiences.length > 0) {
          projects = experiences.map((exp, idx) => ({
            id: idx + 1,
            name: exp.company || exp.role || `Dự án thực tế #${idx + 1}`,
            role: exp.role || 'Thành viên dự án',
            period: exp.period || exp.duration || '2026',
            summary: Array.isArray(exp.highlights) ? exp.highlights.join('. ') : (exp.description || 'Thực hiện các mục tiêu kỹ thuật theo dự án.'),
            tags: Array.isArray(exp.tags) ? exp.tags : (cleanSkills.slice(0, 4)),
          }));
        }

        // 4 Trụ cột ATS từ kết quả AI Match thực tế (Đồng bộ chuẩn xác từ DB, ưu tiên nguồn uy tín ai_job_matches)
        const resolvedMatchScore = candMatch?.matchingScore != null
          ? Math.round(Number(candMatch.matchingScore))
          : (appData?.matchingScore != null
            ? Math.round(Number(appData.matchingScore))
            : (parsedAtsScore != null
              ? Math.round(Number(parsedAtsScore))
              : (directEvalReport?.matchingScore != null
                ? Math.round(Number(directEvalReport.matchingScore))
                : (matchScore > 0 ? matchScore : 0))));

        const skillsScore = candMatch?.skillsScore != null
          ? Math.round(Number(candMatch.skillsScore))
          : (directEvalReport?.skillsScore != null
            ? Math.round(directEvalReport.skillsScore)
            : (appData?.skillsScore != null ? Math.round(Number(appData.skillsScore)) : (parsedJson?.skillsScore ?? resolvedMatchScore)));

        const experienceScore = candMatch?.experienceScore != null
          ? Math.round(Number(candMatch.experienceScore))
          : (directEvalReport?.experienceScore != null
            ? Math.round(directEvalReport.experienceScore)
            : (appData?.experienceScore != null ? Math.round(Number(appData.experienceScore)) : (parsedJson?.experienceScore ?? resolvedMatchScore)));

        const educationScore = candMatch?.educationScore != null
          ? Math.round(Number(candMatch.educationScore))
          : (directEvalReport?.educationScore != null
            ? Math.round(directEvalReport.educationScore)
            : (appData?.educationScore != null ? Math.round(Number(appData.educationScore)) : (parsedJson?.educationScore ?? resolvedMatchScore)));

        const semanticScore = candMatch?.semanticScore != null
          ? Math.round(Number(candMatch.semanticScore))
          : (directEvalReport?.semanticScore != null
            ? Math.round(directEvalReport.semanticScore)
            : (appData?.semanticScore != null ? Math.round(Number(appData.semanticScore)) : (parsedJson?.semanticScore ?? resolvedMatchScore)));

        // Đồng bộ ghi chú HR bền vững theo applicationId thực tế
        if (effectiveAppId) {
          try {
            const savedNotes = localStorage.getItem(`hiremate_hr_notes_${effectiveAppId}`) || localStorage.getItem(`hiremate_hr_notes_app_${effectiveAppId}`);
            if (savedNotes) {
              const parsed = JSON.parse(savedNotes);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setHrNotes(parsed);
              }
            }
          } catch (e) {}
        }

        const mandatorySkills = (Array.isArray(directEvalReport?.matchedMandatorySkills) && directEvalReport.matchedMandatorySkills.length > 0)
          ? directEvalReport.matchedMandatorySkills
          : (candMatch?.matchedMandatorySkills ? parseSkillList(candMatch.matchedMandatorySkills, []) : cleanSkills.slice(0, Math.ceil(cleanSkills.length * 0.6)));

        const missingMandatorySkills = (Array.isArray(directEvalReport?.missingMandatorySkills) && directEvalReport.missingMandatorySkills.length > 0)
          ? directEvalReport.missingMandatorySkills
          : (candMatch?.missingMandatorySkills ? parseSkillList(candMatch.missingMandatorySkills, []) : []);

        const preferredSkills = (Array.isArray(directEvalReport?.matchedPreferredSkills) && directEvalReport.matchedPreferredSkills.length > 0)
          ? directEvalReport.matchedPreferredSkills
          : (candMatch?.matchedPreferredSkills ? parseSkillList(candMatch.matchedPreferredSkills, []) : cleanSkills.slice(Math.ceil(cleanSkills.length * 0.6)));

        const missingPreferredSkills = (Array.isArray(directEvalReport?.missingPreferredSkills) && directEvalReport.missingPreferredSkills.length > 0)
          ? directEvalReport.missingPreferredSkills
          : (candMatch?.missingPreferredSkills ? parseSkillList(candMatch.missingPreferredSkills, []) : []);

        const assessmentLabel =
          resolvedMatchScore >= 85
            ? 'XUẤT SẮC • ĐỀ CỬ VÒNG KỸ THUẬT'
            : resolvedMatchScore >= 70
            ? 'ƯU TÚ • ĐẠT TIÊU CHÍ CỐT LÕI'
            : resolvedMatchScore >= 50
            ? 'TIỀM NĂNG • CẦN PHỎNG VẤN ĐÁNH GIÁ'
            : 'CÂN NHẮC • CHƯA ĐẠT CHUẨN';

        let initialTpl = 'executive';
        if (appData?.coverLetter && typeof appData.coverLetter === 'string') {
          const match = appData.coverLetter.match(/\[CV_TEMPLATE:([a-zA-Z0-9_-]+)\]/i);
          if (match && match[1]) {
            initialTpl = match[1].toLowerCase();
          } else if (/harvard/i.test(appData.coverLetter)) {
            initialTpl = 'harvard';
          } else if (/modern|hiện đại/i.test(appData.coverLetter)) {
            initialTpl = 'modern';
          } else if (/executive|2 cột/i.test(appData.coverLetter)) {
            initialTpl = 'executive';
          }
        }

        const finalReport = (directEvalReport && Array.isArray(directEvalReport.advantages) && directEvalReport.advantages.length > 0)
          ? { ...directEvalReport, matchingScore: resolvedMatchScore, matchTier: assessmentLabel }
          : buildCandidateAiReport({
              matchScore: resolvedMatchScore,
              skillsScore,
              experienceScore,
              educationScore,
              semanticScore,
              matchedMandatorySkills: mandatorySkills,
              missingMandatorySkills: missingMandatorySkills,
              matchedPreferredSkills: preferredSkills,
              missingPreferredSkills: missingPreferredSkills,
              aiReasoning: candMatch?.aiReasoning || `Ứng viên đạt ${resolvedMatchScore}% theo ma trận ATS đa chiều: Kỹ năng chuyên môn ${skillsScore}%, Kinh nghiệm thực chiến ${experienceScore}%, Học vấn & bằng cấp ${educationScore}%, Dự án & công nghệ thực chiến ${semanticScore}%.`,
              experience: profileData?.experienceYears ? `${profileData.experienceYears} năm kinh nghiệm` : (experiences.length > 0 ? `${experiences.length}+ năm kinh nghiệm` : ''),
              jobTitle,
            }, directEvalReport);

        if (isMounted) {
          setCand({
            id: resolvedCandId || parsedCandId,
            jobId: effectiveJobId || parsedJobId,
            applicationId: effectiveAppId,
            isWithdrawn,
            hasPersistedAiReport: hasPersistedReport,
            initialTemplate: initialTpl,
            name: candidateName,
            title: candidateTitle,
            roleSummary: `${(jobTitle || 'VỊ TRÍ TUYỂN DỤNG').toUpperCase()} • ĐÃ NỘP HỒ SƠ`,
            matchScore: resolvedMatchScore,
            skillsScore,
            experienceScore,
            educationScore,
            semanticScore,
            mandatoryScore: skillsScore,
            preferredScore: experienceScore,
            avatar: candidateAvatar,
            location: candidateLocation,
            dob: pData?.dob || parsedJson?.dob || profileData?.dob || '',
            linkedin: pData?.linkedin || parsedJson?.linkedin || profileData?.linkedin || '',
            portfolio: pData?.portfolio || parsedJson?.portfolio || profileData?.portfolio || '',
            experience: profileData?.experienceYears ? `${profileData.experienceYears} năm kinh nghiệm` : (experiences.length > 0 ? `${experiences.length}+ năm kinh nghiệm` : 'Chưa cập nhật kinh nghiệm / Mới tốt nghiệp'),
            yearsOfExperience: pData?.yearsOfExperience || pData?.years_of_experience || profileData?.experienceYears || (experiences.length > 0 ? experiences.length : 0),
            salary: profileData?.desiredSalaryMax ? `${profileData.desiredSalaryMin || 15} - ${profileData.desiredSalaryMax} Triệu` : 'Thỏa thuận',
            email: candidateEmail,
            phone: candidatePhone,
            status: appStatus,
            aiFitAssessment: directEvalReport?.matchTier || assessmentLabel,
            summary: candidateSummary,
            company: user?.companyName || 'Doanh nghiệp tuyển dụng',
            jobCode: effectiveJobId ? `JD-${effectiveJobId}` : 'JD-GENERAL',
            jobTitle,
            cvId: effectiveCvId,
            cvUrl: cvUrl || cvData?.fileUrl || '#',
            cvFileName: cvData?.fileName || `CV_${(candidateName || 'Ung_Vien').replace(/\s+/g, '_')}.pdf`,
            matchedMandatorySkills: mandatorySkills,
            missingMandatorySkills: missingMandatorySkills,
            matchedPreferredSkills: preferredSkills,
            missingPreferredSkills: missingPreferredSkills,
            aiReasoning: candMatch?.aiReasoning || `Ứng viên đạt ${resolvedMatchScore}% theo ma trận ATS đa chiều: Kỹ năng chuyên môn ${skillsScore}%, Kinh nghiệm thực chiến ${experienceScore}%, Học vấn & bằng cấp ${educationScore}%, Dự án & công nghệ thực chiến ${semanticScore}%.`,
            aiReport: finalReport,
            skills: cleanSkills,
            skillCategories,
            experiences,
            educations,
            certifications,
            languages,
            projects,
          });

          setAiRejectionEmail(
            `Kính gửi bạn ${candidateName || 'Ứng viên'},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${jobTitle || 'công việc'} tại ${user?.companyName || 'công ty chúng tôi'} qua nền tảng HireMate AI.\n\nSau khi thẩm định kỹ lưỡng hồ sơ, hội đồng tuyển dụng nhận thấy định hướng đợt này cần ưu tiên các tiêu chí đặc thù khác. Do đó, chúng tôi xin phép lưu lại thông tin của bạn vào Talent Pool và sẽ chủ động kết nối khi có cơ hội phù hợp hơn.\n\nChúc bạn luôn thành công trên con đường sự nghiệp!\n\nTrân trọng,\n${user?.fullName || 'Bộ Phận Nhân Sự'}`
          );
        }
      } catch (masterErr) {
        console.error('Lỗi khi tải thông tin ứng viên:', masterErr);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCandidateData();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        window.URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [parsedCandId, parsedJobId, parsedCvId, parsedAppId]);

  // Điều khiển Zoom
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 75));

  // Thêm ghi chú nội bộ (Lưu vào localStorage và state)
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const updatedNotes = [
      ...hrNotes,
      {
        id: Date.now(),
        author: user?.fullName || 'Nhà Tuyển Dụng',
        time: 'Vừa xong',
        tag: newNoteTag,
        text: newNoteText.trim(),
      },
    ];
    saveHrNotes(updatedNotes);
    setNewNoteText('');
    setShowNoteModal(false);
    triggerToast('Đã lưu ghi chú nội bộ HR thành công!');
  };

  // Duyệt CV sang vòng Đang Xét Duyệt (SCREENING)
  const handleApproveCv = async () => {
    if (cand.isWithdrawn) {
      triggerToast('⚠️ Ứng viên đã chủ động rút hồ sơ ứng tuyển này, không thể thay đổi trạng thái!');
      return;
    }
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'SCREENING',
          note: 'Hồ sơ đã vượt qua thẩm định CV và được chuyển sang vòng xét duyệt năng lực',
        });
      }
      setCand((prev) => ({ ...prev, status: 'SCREENING' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('Đã duyệt CV thành công! Đã tự động gửi chuông thông báo và email cho ứng viên.');
    } catch (err) {
      triggerToast('Lỗi khi duyệt CV: ' + (err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái hồ sơ'));
    }
  };

  // Gửi Thư Mời Nhận Việc (OFFERED)
  const handleSendOffer = async () => {
    if (cand.isWithdrawn) {
      triggerToast('⚠️ Ứng viên đã chủ động rút hồ sơ ứng tuyển này, không thể thay đổi trạng thái!');
      return;
    }
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'OFFERED',
          note: 'Chúc mừng bạn! Nhà tuyển dụng gửi lời mời nhận việc chính thức (Offer).',
        });
      }
      setCand((prev) => ({ ...prev, status: 'OFFERED' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('Đã gửi Offer thành công! Đã tự động gửi chuông thông báo và email cho ứng viên.');
    } catch (err) {
      triggerToast('Lỗi khi gửi Offer: ' + (err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái hồ sơ'));
    }
  };

  // Xác Nhận Nhận Việc (HIRED)
  const handleConfirmHired = async () => {
    if (cand.isWithdrawn) {
      triggerToast('⚠️ Ứng viên đã chủ động rút hồ sơ ứng tuyển này, không thể thay đổi trạng thái!');
      return;
    }
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'HIRED',
          note: 'Chúc mừng! Ứng viên đã chính thức trúng tuyển và nhận việc (HIRED).',
        });
      }
      setCand((prev) => ({ ...prev, status: 'HIRED' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('🎉 Chúc mừng! Đã chuyển trạng thái ứng viên sang TRÚNG TUYỂN (HIRED) thành công!');
    } catch (err) {
      triggerToast('Lỗi cập nhật trạng thái Trúng Tuyển: ' + (err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái hồ sơ'));
    }
  };

  // Xác nhận từ chối (Bảo toàn nội dung email AI viết vào note)
  const handleConfirmRejection = async () => {
    if (cand.isWithdrawn) {
      triggerToast('⚠️ Ứng viên đã chủ động rút hồ sơ ứng tuyển này, không thể thay đổi trạng thái!');
      return;
    }
    try {
      if (cand.applicationId) {
        const fullRejectNote = aiRejectionEmail ? `${rejectionReason}\n\n[Nội dung thư phản hồi]:\n${aiRejectionEmail}` : rejectionReason;
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'REJECTED',
          note: fullRejectNote,
          reason: rejectionReason,
        });
      }
      setShowRejectModal(false);
      setCand((prev) => ({ ...prev, status: 'REJECTED' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('Đã chuyển trạng thái sang Chưa Phù Hợp & gửi thông báo chuông + email cho ứng viên!');
    } catch (err) {
      setShowRejectModal(false);
      triggerToast('Lỗi khi từ chối hồ sơ: ' + (err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái hồ sơ'));
    }
  };

  // Xác nhận lên lịch phỏng vấn (Bảo toàn Link Google Meet vào note)
  const handleConfirmInterview = async () => {
    if (cand.isWithdrawn) {
      triggerToast('⚠️ Ứng viên đã chủ động rút hồ sơ ứng tuyển này, không thể thay đổi trạng thái!');
      return;
    }
    try {
      if (cand.applicationId) {
        const interviewNote = `Lịch phỏng vấn ngày ${interviewDate} lúc ${interviewTime} (${interviewType}). Link Google Meet: ${meetLink}`;
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'INTERVIEWING',
          note: interviewNote,
        });
      }
      setShowInterviewModal(false);
      setCand((prev) => ({ ...prev, status: 'INTERVIEWING' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast(`Đã gửi thư mời phỏng vấn & tự động gửi thông báo chuông + email cho ứng viên!`);
    } catch (err) {
      setShowInterviewModal(false);
      triggerToast('Lỗi khi gửi lịch phỏng vấn: ' + (err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái hồ sơ'));
    }
  };

  // Tải file CV về máy
  const handleDownloadCv = async () => {
    if (!canDownloadCv) {
      triggerToast('Gói dịch vụ hiện tại không hỗ trợ tải trực tiếp CV gốc. Vui lòng nâng cấp lên gói Hiring Starter hoặc Pro!');
      return;
    }
    try {
      if (cand.cvId) {
        try {
          const res = await cvApi.downloadCv(cand.cvId);
          const blob = extractBlob(res, 'application/pdf');
          if (blob && blob.size > 0) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = cand.cvFileName || 'CV_Ung_Vien.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            triggerToast('Đang tải file CV về máy...');
            return;
          }
        } catch (apiErr) {
          console.warn('downloadCv API error, falling back to direct URL:', apiErr);
        }
      }
      
      if (pdfBlobUrl) {
        const a = document.createElement('a');
        a.href = pdfBlobUrl;
        a.download = cand.cvFileName || 'CV_Ung_Vien.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        triggerToast('Đang tải file CV về máy...');
        return;
      }

      if (cand.cvUrl && cand.cvUrl !== '#' && cand.cvUrl.startsWith('http')) {
        const a = document.createElement('a');
        a.href = cand.cvUrl;
        a.download = cand.cvFileName || 'CV_Ung_Vien.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        triggerToast('Đang tải file CV về máy...');
        return;
      }

      triggerToast('Không tìm thấy tệp để tải về.');
    } catch (e) {
      console.warn('Lỗi tải file CV:', e);
      triggerToast('Lỗi khi tải file. Vui lòng thử lại sau.');
    }
  };

  const getStageBadge = (st) => {
    switch (st) {
      case 'APPLIED':
      case 'Đã nộp hồ sơ':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Mới Ứng Tuyển</span>;
      case 'REVIEWING':
      case 'SCREENING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Đang Xét Duyệt</span>;
      case 'INTERVIEWING':
      case 'INTERVIEW':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Vòng Phỏng Vấn</span>;
      case 'OFFERED':
      case 'PASSED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã Gửi Offer</span>;
      case 'HIRED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
            <span className="material-symbols-outlined text-sm text-emerald-700">task_alt</span>
            <span>Đã Trúng Tuyển Chính Thức</span>
          </span>
        );
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Chưa Phù Hợp</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">Đã Thẩm Định</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center font-sans text-slate-700">
        <div className="text-center space-y-3">
          <LoadingSpinner />
          <h3 className="text-base font-bold text-[#1e1b4b]">Đang tải hồ sơ &amp; đối soát CV ứng viên...</h3>
          <p className="text-xs text-slate-500">Đồng bộ dữ liệu file PDF và thẩm định điểm so khớp AI 70/30.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-[#1e1b4b] space-y-5 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] px-5 py-3 rounded-2xl bg-[#1e1548] text-white text-xs font-bold shadow-xl border border-purple-300/30 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. TOP EXECUTIVE BREADCRUMB & CONTROL BAR                         */}
      {/* ================================================================= */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
            <button
              onClick={() => {
                if (onBack) onBack();
                else {
                  const targetJobId = parsedJobId || cand.jobId;
                  window.location.hash = targetJobId ? `#/job-applicants-roster?jobId=${targetJobId}` : '#/job-dashboard';
                }
              }}
              className="hover:text-[#5b48bd] transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Quay Lại Danh Sách</span>
            </button>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{cand.jobTitle} ({cand.jobCode})</span>
            <span>/</span>
            <span className="text-[#5b48bd] font-bold">Hồ sơ ứng viên: {cand.name}</span>
          </div>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b4b] tracking-tight">
              Hồ Sơ Đánh Giá &amp; Thẩm Định CV
            </h1>
            {getStageBadge(cand.status)}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-200 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Chuẩn AI 70/30 ATS</span>
          </div>

          <a
            href={createHrToCandidateMailto({
              candidateEmail: cand.email,
              candidateName: cand.name,
              jobTitle: cand.jobTitle || 'Vị trí Tuyển Dụng',
              companyName: user?.companyName || cand.company || 'Công ty Tuyển dụng',
              hrName: user?.fullName || user?.name || 'Bộ phận Tuyển dụng',
              hrPosition: user?.position || 'Talent Acquisition Specialist',
            })}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Mở trình soạn email mặc định để gửi mail trực tiếp cho ứng viên"
          >
            <span>✉️ Gửi Email cho Ứng viên</span>
          </a>

          <button
            type="button"
            onClick={() => setShowInterviewModal(true)}
            className="px-4 py-2 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>Mời Phỏng Vấn (Meet)</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. MAIN 2-COLUMN SPLIT STUDIO LAYOUT                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* --------------------------------------------------------------- */}
        {/* CỘT TRÁI: ĐÁNH GIÁ NĂNG LỰC, TIÊU CHÍ JD & QUYẾT ĐỊNH HR        */}
        {/* --------------------------------------------------------------- */}
        <div className={`${layoutRatio === 'wide-cv' ? 'lg:col-span-5 xl:col-span-4' : 'lg:col-span-5'} space-y-5 transition-all`}>
          
          {/* Card A: Candidate Identification Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <AvatarImg
                  src={cand.avatar}
                  name={cand.name}
                  alt={cand.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200 shadow-xs"
                  fallbackClassName="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-extrabold text-2xl shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Trực tuyến" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1e1b4b] truncate">
                  {cand.name}
                </h2>
                <p className="text-xs text-[#5b48bd] font-bold mt-0.5 truncate">
                  {cand.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">domain</span>
                  <span>Ứng tuyển: <strong>{cand.jobTitle}</strong></span>
                </p>
              </div>
            </div>

            {/* Quick Contact & Details Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email liên hệ</span>
                <span className="font-semibold text-slate-800 truncate block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                  <span className="truncate">
                    {canDownloadCv ? (
                      cand.email
                    ) : (
                      <span className="text-slate-400 italic font-normal flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>••••••@••••• (Nâng cấp)</span>
                      </span>
                    )}
                  </span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số điện thoại</span>
                <span className="font-semibold text-slate-800 truncate block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                  <span>
                    {canDownloadCv ? (
                      cand.phone
                    ) : (
                      <span className="text-slate-400 italic font-normal flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>•••••••••• (Nâng cấp)</span>
                      </span>
                    )}
                  </span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Khu vực làm việc</span>
                <span className="font-semibold text-slate-800 truncate block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                  <span>{cand.location}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mức lương mong muốn</span>
                <span className="font-semibold text-slate-800 truncate block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">payments</span>
                  <span>{cand.salary}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Ma Trận So Khớp ATS Đa Tiêu Chí */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5b48bd] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1e1b4b]">
                    Ma Trận So Khớp Chuẩn ATS Quốc Tế
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Đánh giá toàn diện 4 trụ cột: Kỹ năng, Kinh nghiệm, Học vấn, Đồ án
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-[#5b48bd] leading-none">
                  {cand.matchScore}%
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  ATS Standard Score
                </span>
                <button
                  type="button"
                  disabled={isReScoring}
                  onClick={handleReScoreCandidate}
                  className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#5b48bd] border border-purple-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title="Kích hoạt AI đối soát chuyên sâu & chấm lại kỹ hơn hồ sơ CV này"
                >
                  <span className={`material-symbols-outlined text-[12px] ${isReScoring ? 'animate-spin' : ''}`}>
                    {isReScoring ? 'sync' : 'psychology'}
                  </span>
                  <span>{isReScoring ? 'Đang chấm...' : 'AI Chấm Lại CV'}</span>
                </button>
              </div>
            </div>

            {/* 4 Trụ Cột Đánh Giá ATS Tiêu Chuẩn */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Kỹ Năng Chuyên Môn (40% trọng số)
                  </span>
                  <span className="text-emerald-700">{cand.skillsScore ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${cand.skillsScore ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Kinh Nghiệm Thực Chiến (30% trọng số)
                  </span>
                  <span className="text-indigo-700">{cand.experienceScore ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${cand.experienceScore ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Học Vấn &amp; Bằng Cấp (15% trọng số)
                  </span>
                  <span className="text-amber-700">{cand.educationScore ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${cand.educationScore ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Dự Án &amp; Công Nghệ Thực Chiến (15% trọng số)
                  </span>
                  <span className="text-purple-700">{cand.semanticScore ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                    style={{ width: `${cand.semanticScore ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Skills Chips Breakdown */}
            <div className="space-y-3 pt-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Kỹ năng cốt lõi đáp ứng JD ({cand.matchedMandatorySkills.length + cand.matchedPreferredSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cand.matchedMandatorySkills.concat(cand.matchedPreferredSkills).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing mandatory skills */}
              {cand.missingMandatorySkills && cand.missingMandatorySkills.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-2">
                    Kỹ năng JD yêu cầu nhưng CV còn thiếu ({cand.missingMandatorySkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cand.missingMandatorySkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px] text-amber-600">warning</span>
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Summary */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                <span className="font-extrabold text-[#5b48bd] block">
                  Đánh giá phân tích ngữ nghĩa AI:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {sanitizeEvidenceText(cand.aiReasoning)}
                </p>
              </div>
            </div>
          </div>

          {/* Card B.2: Báo Cáo Đánh Giá & Thẩm Định Chi Tiết Từ AI Copilot (2 Trạng Thái: Chưa Có Báo Cáo / Đã Lưu CSDL) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            {!isProOrHigher ? (
              <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white border-2 border-dashed border-purple-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5b48bd] to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-extrabold text-base text-[#1e1b4b]">
                    Mở Khóa Báo Cáo Phân Tích Chuyên Sâu AI (Copilot Đọc Hộ CV)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Trọn bộ <strong>Báo Cáo Phân Tích Chuyên Sâu AI</strong> (Ưu điểm, Điểm yếu/Tiêu chí chưa đạt, Minh chứng trích xuất từ CV, Skill Gap và Khuyến nghị tuyển dụng) chỉ mở khóa độc quyền từ gói <strong>Hiring Pro (499.000đ)</strong> trở lên. Gói Free và Hiring Starter cần tự đọc và đánh giá CV ứng viên.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = '#/recruiter-pricing';
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#4a39a7] hover:to-indigo-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    <span>Nâng Cấp Lên Hiring Pro (499.000đ) Ngay</span>
                  </button>
                </div>
              </div>
            ) : !cand.hasPersistedAiReport ? (
              /* ========================================================================= */
              /* TRẠNG THÁI 1: CHƯA CÓ BÁO CÁO TRONG CSDL (Chi phí: 0 Token, 0ms khi tải trang) */
              /* ========================================================================= */
              <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white border-2 border-dashed border-purple-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5b48bd] flex items-center justify-center mx-auto shadow-2xs">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-extrabold text-base text-[#1e1b4b]">
                    Báo Cáo Phân Tích Chuyên Sâu (Gemini AI)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hệ thống áp dụng kiến trúc <strong>Lưu Cứng Vào CSDL (Write Once, Read Many)</strong>.
                    Bấm nút bên dưới để yêu cầu AI thẩm định sâu đa chiều (Ưu/Nhược điểm, Skill Gap, Gợi ý phỏng vấn). Sau khi thẩm định, báo cáo sẽ được lưu vĩnh viễn (0ms, 0 Token cho các lần truy cập sau).
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={isReScoring}
                    onClick={handleReScoreCandidate}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#47369f] hover:to-indigo-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  >
                    <span className={"material-symbols-outlined text-base " + (isReScoring ? "animate-spin" : "")}>
                      {isReScoring ? 'sync' : 'auto_awesome'}
                    </span>
                    <span>{isReScoring ? 'AI Đang Thẩm Định Chuyên Sâu...' : '🤖 Yêu Cầu AI Phân Tích Sâu (Lưu Vào CSDL)'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* TRẠNG THÁI 2: ĐÃ CÓ BÁO CÁO LƯU TRONG CSDL (Hiển thị ngay lập tức, 0ms)    */
              /* ========================================================================= */
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5b48bd] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-lg">psychology</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1e1b4b] flex items-center gap-2">
                        <span>Báo Cáo Đánh Giá Chi Tiết AI Copilot</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                          {cand.aiFitAssessment || cand.aiReport?.matchTier || 'Chuẩn ATS'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <span className="material-symbols-outlined text-[12px] text-emerald-600">database</span>
                          <span>✓ Đã lưu CSDL (0 Token)</span>
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Phân tích đa chiều: Ưu điểm, Tiêu chí chưa đạt &amp; Khuyến nghị tuyển dụng
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isReScoring}
                    onClick={handleReScoreCandidate}
                    className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    title="Kích hoạt AI đối soát chuyên sâu & chấm lại kỹ hơn hồ sơ CV này"
                  >
                    <span className={"material-symbols-outlined text-[13px] " + (isReScoring ? "animate-spin" : "")}>
                      {isReScoring ? 'sync' : 'auto_awesome'}
                    </span>
                    <span>{isReScoring ? 'Đang chấm...' : '🔄 Thẩm định lại bằng AI'}</span>
                  </button>
                </div>

                {/* 1. Ưu Điểm & Năng Lực Phù Hợp */}
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        1. Ưu Điểm &amp; Năng Lực Phù Hợp ({cand.aiReport?.advantages?.length || 0})
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Phù Hợp
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(cand.aiReport?.advantages || []).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.category || 'Kỹ năng chuyên môn'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.assessment || 'Đạt chuẩn'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs pt-0.5">{item.title}</div>
                        {item.jobMatch && (
                          <div className="text-[11px] text-slate-700">
                            <strong className="text-emerald-900">🎯 Đáp ứng yêu cầu JD: </strong>
                            <span>{sanitizeEvidenceText(item.jobMatch)}</span>
                          </div>
                        )}
                        {item.cvEvidence && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-normal">
                            <strong className="text-slate-800">📄 Minh chứng thực tế từ CV: </strong>
                            <span>{sanitizeEvidenceText(item.cvEvidence)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Điểm Yếu & Tiêu Chí Chưa Đạt */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        2. Điểm Yếu &amp; Tiêu Chí Chưa Đạt ({cand.aiReport?.disadvantages?.length || 0})
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Cần Lưu Ý
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(!cand.aiReport?.disadvantages || cand.aiReport.disadvantages.length === 0) ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                        <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                        <p className="text-xs font-bold text-emerald-900">Không có điểm yếu nghiêm trọng</p>
                        <p className="text-[11px] text-emerald-700">Ứng viên đáp ứng trọn vẹn mọi yêu cầu cốt lõi của bài tuyển dụng!</p>
                      </div>
                    ) : (
                      cand.aiReport.disadvantages.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-amber-200/70 shadow-2xs space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              {item.category || 'Kỹ năng còn thiếu'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              {item.severity || 'Cần lưu ý'}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs pt-0.5">{item.title}</div>
                          {item.jobRequirement && (
                            <div className="text-[11px] text-slate-700">
                              <strong className="text-amber-950">📌 Yêu cầu bài tuyển dụng: </strong>
                              <span>{sanitizeEvidenceText(item.jobRequirement)}</span>
                            </div>
                          )}
                          {item.cvShortfall && (
                            <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-950 leading-relaxed font-normal">
                              <strong className="text-amber-900">⚠️ Hiện trạng trong CV: </strong>
                              <span>{sanitizeEvidenceText(item.cvShortfall)}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Nhận Định Chuyên Môn & Khuyến Nghị Tuyển Dụng */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white border border-purple-200/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#5b48bd]">
                    <span className="material-symbols-outlined text-base">psychology</span>
                    <span>Khuyến Nghị Tuyển Dụng Từ AI Copilot</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {sanitizeEvidenceText(cand.aiReport?.executiveRecommendation || 'Khuyến nghị HR mời ứng viên tham gia phỏng vấn chuyên sâu để đánh giá thái độ học hỏi và thẩm định năng lực thực tế.')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Card C: HR Decision & Action Box */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Quyết định tuyển dụng</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Auto Email + Chuông</span>
            </h4>

            {(cand.isWithdrawn || cand.status === 'WITHDRAWN') ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <span>Ứng viên đã chủ động rút hồ sơ ứng tuyển này</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Ứng viên đã hủy đơn ứng tuyển cho vị trí này. Toàn bộ các thao tác thay đổi trạng thái (Duyệt nhanh CV, Duyệt &amp; Mời phỏng vấn, Gửi Offer, Từ chối) đã bị vô hiệu hóa để bảo vệ tính toàn vẹn dữ liệu.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                    className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
                    title="Xem hoặc viết ghi chú đánh giá nội bộ của HR"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-500">edit_note</span>
                    <span>Ghi Chú HR ({hrNotes.length})</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 2 Nút Hành Động Quyết Định Cốt Lõi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(true)}
                    className="py-3 px-4 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer group"
                    title="Duyệt hồ sơ và gửi email lên lịch phỏng vấn cho ứng viên"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">event_available</span>
                    <span className="font-extrabold">Duyệt &amp; Mời Phỏng Vấn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                    title="Từ chối hồ sơ chưa phù hợp và gửi email phản hồi lịch sự"
                  >
                    <span className="material-symbols-outlined text-lg text-rose-500 group-hover:scale-110 transition-transform">cancel</span>
                    <span>Từ Chối Hồ Sơ</span>
                  </button>
                </div>

                {/* Thao tác phụ tinh gọn: Duyệt Nhanh / Gửi Offer / Ghi Chú HR */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleApproveCv}
                    className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Duyệt nhanh hồ sơ (Chuyển trạng thái Đã Duyệt nếu chưa cần xếp lịch phỏng vấn ngay)"
                  >
                    <span className="material-symbols-outlined text-sm text-blue-600">check_circle</span>
                    <span>Duyệt nhanh CV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                    className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Xem hoặc viết ghi chú đánh giá nội bộ của HR"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-500">edit_note</span>
                    <span>Ghi Chú ({hrNotes.length})</span>
                  </button>

                  {cand.status === 'INTERVIEWING' && (
                    <button
                      type="button"
                      onClick={handleSendOffer}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Gửi thư mời nhận việc chính thức (Offer) sau khi phỏng vấn đạt"
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Gửi Offer</span>
                    </button>
                  )}

                  {(cand.status === 'OFFERED' || cand.status === 'INTERVIEWING') && (
                    <button
                      type="button"
                      onClick={handleConfirmHired}
                      className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Xác nhận ứng viên đã trúng tuyển &amp; nhận việc chính thức (HIRED)"
                    >
                      <span className="material-symbols-outlined text-sm">celebration</span>
                      <span>Xác Nhận Nhận Việc (HIRED)</span>
                    </button>
                  )}

                  {cand.status === 'HIRED' && (
                    <span className="py-1.5 px-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600">task_alt</span>
                      <span>Đã Trúng Tuyển (HIRED)</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* CỘT PHẢI: XEM FILE CV NGUYÊN BẢN (PDF) & CHI TIẾT ATS           */}
        {/* --------------------------------------------------------------- */}
        <div className={`${layoutRatio === 'wide-cv' ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-7'} bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[750px] transition-all`}>
          
          {/* Header công cụ trên đầu hồ sơ */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-purple-50/60 via-slate-50/40 to-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCvViewMode('pdf')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  cvViewMode === 'pdf'
                    ? 'bg-[#5b48bd] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-purple-50/60 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                <span>File CV Gốc {pdfBlobUrl ? '(PDF)' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => setCvViewMode('parsed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  cvViewMode === 'parsed'
                    ? 'bg-[#5b48bd] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-purple-50/60 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">web</span>
                <span>CV Online</span>
              </button>
            </div>

            {/* Quick Actions (Layout toggle, Zoom controls, Download, Open New Tab) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLayoutRatio(layoutRatio === 'wide-cv' ? 'balanced' : 'wide-cv')}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                title={layoutRatio === 'wide-cv' ? 'Chuyển về tỷ lệ cân đối (5:7)' : 'Mở rộng khung xem CV (4:8)'}
              >
                <span className="material-symbols-outlined text-sm text-purple-600">
                  {layoutRatio === 'wide-cv' ? 'view_sidebar' : 'fullscreen'}
                </span>
                <span>{layoutRatio === 'wide-cv' ? 'Cân Đối (5:7)' : 'Mở Rộng CV (4:8)'}</span>
              </button>
              {cvViewMode === 'pdf' && (pdfBlobUrl || (cand.cvId || effectiveCvId || (cand.cvUrl && cand.cvUrl !== '#'))) && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 50))}
                    className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                    title="Thu nhỏ CV (-)"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 min-w-[36px] text-center">
                    {zoomLevel === 100 ? 'Vừa' : `${zoomLevel}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 160))}
                    className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                    title="Phóng to CV (+)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="ml-1 px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-[#5b48bd] text-[10px] font-bold cursor-pointer transition-colors"
                    title="Vừa vặn chiều ngang tài liệu (Fit to Page Width - Không bị tràn mép)"
                  >
                    Fit
                  </button>
                </div>
              )}

              {canDownloadCv && (
                <button
                  type="button"
                  onClick={handleDownloadCv}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title="Tải file CV gốc về máy tính"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span className="hidden sm:inline">Tải CV</span>
                </button>
              )}

              {pdfBlobUrl && canDownloadCv && (
                <a
                  href={pdfBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title="Mở tab mới toàn màn hình"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span className="hidden sm:inline">Mở Tab Mới</span>
                </a>
              )}
            </div>
          </div>

          {/* Nội dung hồ sơ (PDF mode: overflow-hidden triệt tiêu hoàn toàn thanh cuộn kép) */}
          <div className={`flex-1 flex flex-col ${
            cvViewMode === 'pdf'
              ? 'p-0 overflow-hidden h-[840px] bg-slate-100/60'
              : 'p-4 sm:p-5 overflow-y-auto max-h-[840px] bg-[#fafafc]'
          }`}>
            {cvViewMode === 'pdf' ? (
              /* ======================================================= */
              /* TAB 1: XEM FILE PDF NGUYÊN BẢN CỦA ỨNG VIÊN             */
              /* ======================================================= */
              <div className="w-full h-full flex flex-col overflow-hidden">
                {isPdfLoading ? (
                  <div className="h-[650px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
                    <div className="text-center space-y-2">
                      <LoadingSpinner />
                      <p className="text-xs text-slate-500 font-bold">Đang nạp file PDF gốc từ kho lưu trữ...</p>
                    </div>
                  </div>
                ) : pdfBlobUrl ? (
                  cvMimeType.startsWith('image/') ? (
                    <div className="w-full min-h-[500px] max-h-[760px] overflow-auto p-4 flex items-center justify-center bg-slate-100 rounded-2xl border border-slate-200">
                      <img
                        src={pdfBlobUrl}
                        alt={`CV - ${cand.name}`}
                        className="max-w-full h-auto rounded-xl shadow-md border border-slate-200 object-contain"
                      />
                    </div>
                  ) : (cvMimeType.includes('word') || cvMimeType.includes('document') || cand.cvFileName?.toLowerCase().endsWith('.docx') || cand.cvFileName?.toLowerCase().endsWith('.doc')) ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm max-w-lg mx-auto my-auto space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-3xl">article</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#1e1b4b]">{cand.cvFileName || 'File CV Word (.docx)'}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Định dạng tài liệu là file Word (.docx / .doc). Trình duyệt không hỗ trợ hiển thị trực tiếp file Word trong iframe. Bạn có thể tải file về máy hoặc xem trực tiếp qua tab <strong>"Xem CV Online"</strong>.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleDownloadCv}
                          className="px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          <span>Tải File Word (.docx) Về Máy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCvViewMode('parsed')}
                          className="px-4 py-2.5 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-200 font-bold text-xs hover:bg-purple-100 cursor-pointer"
                        >
                          Xem CV Online →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-[840px] min-h-[840px] flex flex-col overflow-x-auto overflow-y-hidden bg-slate-100/60 p-0">
                      <div
                        style={{
                          width: zoomLevel === 100 ? '100%' : `${zoomLevel}%`,
                          minWidth: '100%',
                          height: '100%',
                          transition: 'width 0.15s ease-out',
                        }}
                        className="h-full flex flex-col bg-white border-0 shadow-none overflow-hidden mx-auto"
                      >
                        <iframe
                          key={`${pdfBlobUrl}-${zoomLevel}`}
                          src={
                            pdfBlobUrl.includes('#')
                              ? pdfBlobUrl.replace(/#.*$/, `#page=1&view=FitH&zoom=${zoomLevel === 100 ? 'page-width' : zoomLevel}&toolbar=1&navpanes=0`)
                              : `${pdfBlobUrl}#page=1&view=FitH&zoom=${zoomLevel === 100 ? 'page-width' : zoomLevel}&toolbar=1&navpanes=0`
                          }
                          title={`CV - ${cand.name}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                          }}
                          className="w-full h-full block border-0 bg-white"
                        />
                      </div>
                    </div>
                  )
                ) : (cand.cvId || effectiveCvId || (cand.cvUrl && cand.cvUrl !== '#')) && cand.cvUrl && !cand.cvUrl.includes('/candidate/profile') ? (
                  <div className="w-full h-[840px] min-h-[840px] flex flex-col overflow-x-auto overflow-y-hidden bg-slate-100/60 p-0">
                    <div
                      style={{
                        width: zoomLevel === 100 ? '100%' : `${zoomLevel}%`,
                        minWidth: '100%',
                        height: '100%',
                        transition: 'width 0.15s ease-out',
                      }}
                      className="h-full flex flex-col bg-white border-0 shadow-none overflow-hidden mx-auto"
                    >
                      <iframe
                        key={`direct-iframe-${cand.cvId || effectiveCvId}-${zoomLevel}`}
                        src={
                          (cand.cvId || effectiveCvId)
                            ? `${getApiBaseUrl()}/api/v1/cvs/${cand.cvId || effectiveCvId}/preview?token=${encodeURIComponent(localStorage.getItem('token') || '')}#page=1&view=FitH&zoom=${zoomLevel === 100 ? 'page-width' : zoomLevel}&toolbar=1&navpanes=0`
                            : cand.cvUrl.startsWith('http')
                              ? `${cand.cvUrl}#page=1&view=FitH&zoom=${zoomLevel === 100 ? 'page-width' : zoomLevel}&toolbar=1&navpanes=0`
                              : `${getApiBaseUrl()}/${cand.cvUrl.replace(/^\//, '')}#page=1&view=FitH&zoom=${zoomLevel === 100 ? 'page-width' : zoomLevel}&toolbar=1&navpanes=0`
                        }
                        title={`CV - ${cand.name}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                        className="w-full h-full block border-0 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  /* THÔNG BÁO KHI LÀ BẢN CV TRỰC TUYẾN HOẶC CHƯA CÓ BẢN GỐC */
                  <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm max-w-md mx-auto my-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">badge</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#1e1b4b]">{cand.cvFileName || 'Hồ Sơ CV Trực Tuyến'}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Ứng viên này nộp hồ sơ theo định dạng CV Trực Tuyến của nền tảng (không qua tải tệp PDF). Bạn có thể xem toàn bộ hồ sơ trực tuyến hoàn chỉnh tại tab <strong>"CV Online"</strong>.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCvViewMode('parsed')}
                        className="px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Chuyển Sang Xem CV Online</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ======================================================= */
              /* TAB 2: HỒ SƠ CV ONLINE (THEO ĐÚNG MẪU ỨNG VIÊN ĐÃ NỘP)    */
              /* ======================================================= */
              <OnlineCvRenderer
                candidate={cand}
                matchScore={cand.matchScore}
                initialTemplate={cand.initialTemplate || 'executive'}
                showSelector={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: LÊN LỊCH PHỎNG VẤN TRỰC TUYẾN (GOOGLE MEET)               */}
      {/* ================================================================= */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl text-[#1e1b4b]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5b48bd] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <h3 className="font-extrabold text-lg text-[#1e1b4b]">Lên Lịch Phỏng Vấn Trực Tuyến</h3>
              </div>
              <button
                onClick={() => setShowInterviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-slate-700 font-bold flex items-center justify-between">
                <span>Ứng viên: <strong>{cand.name}</strong> ({cand.email})</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#5b48bd] text-[10px] font-black border border-purple-200">
                  {cand.matchScore}% Match
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase tracking-wider">Ngày phỏng vấn:</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase tracking-wider">Giờ (GMT+7):</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase tracking-wider">Phòng họp Google Meet:</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 flex items-center justify-between">
                  <span className="truncate">{meetLink}</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">Tự Động Tạo</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInterviewModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmInterview}
                className="px-5 py-2.5 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xác Nhận &amp; Gửi Thư Mời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: TỪ CHỐI KÈM GỢI Ý EMAIL AI                              */}
      {/* ================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl text-[#1e1b4b]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <span className="material-symbols-outlined text-xl">cancel</span>
                <h3 className="font-extrabold text-lg text-[#1e1b4b]">Từ Chối Hồ Sơ Ứng Tuyển</h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase tracking-wider">Lý do từ chối chính:</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                >
                  <option value="Khác định hướng tech stack">Khác định hướng tech stack cốt lõi</option>
                  <option value="Chưa đủ năm kinh nghiệm yêu cầu">Chưa đủ năm kinh nghiệm yêu cầu</option>
                  <option value="Thiếu kỹ năng bắt buộc 70%">Thiếu kỹ năng bắt buộc theo trọng số 70%</option>
                  <option value="Đã tuyển đủ chỉ tiêu đợt này">Đã tuyển đủ số lượng chỉ tiêu đợt này</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase tracking-wider">Email phản hồi lịch sự:</label>
                <textarea
                  rows={6}
                  value={aiRejectionEmail}
                  onChange={(e) => setAiRejectionEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: GHI CHÚ NỘI BỘ HR                                       */}
      {/* ================================================================= */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl text-[#1e1b4b]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-[#5b48bd]">edit_note</span>
                <h3 className="font-extrabold text-lg text-[#1e1b4b]">Ghi Chú Đánh Giá Nội Bộ HR</h3>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-60 overflow-y-auto pr-1">
              {hrNotes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-[#1e1b4b]">{n.author}</span>
                    <span className="text-[10px]">{n.time}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-2 text-xs border-t border-slate-100">
              <label className="text-slate-500 block font-bold uppercase tracking-wider">Thêm ghi chú mới:</label>
              <textarea
                rows={3}
                placeholder="Nhập nhận xét về phong thái, kỹ năng hoặc câu hỏi phỏng vấn..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#5b48bd]"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-5 py-2.5 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Lưu Ghi Chú
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
