import React, { useState, useEffect } from 'react';
import { applicationApi, aiMatchApi, jobApi, interviewApi, paymentApi } from '../api';
import { cvApi } from '../api/cvApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';
import { parseSubscriptionPermissions } from '../utils/subscriptionPerms';
import { createHrToCandidateMailto } from '../utils/emailUtils';
import { extractBlob } from '../utils/excelExportUtils';
import OnlineCvRenderer from '../components/common/OnlineCvRenderer';

/**
 * CandidateEvaluationPage.jsx
 * Trung tâm Đánh giá & Thẩm định Hồ sơ Ứng viên Chuẩn Executive ATS (HireMate AI).
 * Hiển thị chính xác CV bản gốc đã nộp (PDF viewer trực tiếp) kết hợp dữ liệu trích xuất ATS
 * và phân tích tương thích AI theo tỷ trọng 70% Bắt Buộc + 30% Ưu Tiên.
 */
export default function CandidateEvaluationPage({
  user,
  candidateId = 1,
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
    applicationId: parsedAppId,
    name: 'Đang tải hồ sơ...',
    title: 'Hồ sơ ứng viên',
    roleSummary: 'HỒ SƠ ĐANG ĐƯỢC ĐỐI SOÁT VỚI TIÊU CHÍ JD',
    matchScore: 0,
    mandatoryScore: 0,
    preferredScore: 0,
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
    const targetJobId = cand.jobId || parsedJobId;
    if (!cand.id || !targetJobId) {
      triggerToast('Thiếu thông tin vị trí tuyển dụng để chấm lại.');
      return;
    }
    try {
      setIsReScoring(true);
      triggerToast(`Đang yêu cầu AI đối soát chuyên sâu & chấm lại kỹ hơn cho hồ sơ ${cand.name}...`);
      const res = await aiMatchApi.getDetailedCandidateEvaluation(targetJobId, cand.id, true);
      const data = res?.data?.data || res?.data || res;
      if (data?.matchingScore != null) {
        const freshScore = Math.round(data.matchingScore);
        const freshTier = data.matchTier || (freshScore >= 85 ? '⭐ Phù Hợp Xuất Sắc' : freshScore >= 70 ? '✨ Phù Hợp Tốt' : freshScore >= 50 ? '💡 Tiềm Năng' : 'Trau Dồi Kỹ Năng');
        const freshSkillsScore = data.skillsScore != null ? Math.round(data.skillsScore) : freshScore;
        const freshExpScore = data.experienceScore != null ? Math.round(data.experienceScore) : freshScore;
        const freshEduScore = data.educationScore != null ? Math.round(data.educationScore) : freshScore;
        const freshSemScore = data.semanticScore != null ? Math.round(data.semanticScore) : freshScore;

        setCand((prev) => ({
          ...prev,
          matchScore: freshScore,
          skillsScore: freshSkillsScore,
          experienceScore: freshExpScore,
          educationScore: freshEduScore,
          semanticScore: freshSemScore,
          aiFitAssessment: freshTier,
          aiReasoning: data.overallVerdict || data.executiveRecommendation || prev.aiReasoning,
          matchedMandatorySkills: Array.isArray(data.matchedMandatorySkills) ? data.matchedMandatorySkills : prev.matchedMandatorySkills,
          missingMandatorySkills: Array.isArray(data.missingMandatorySkills) ? data.missingMandatorySkills : prev.missingMandatorySkills,
          matchedPreferredSkills: Array.isArray(data.matchedPreferredSkills) ? data.matchedPreferredSkills : prev.matchedPreferredSkills,
          missingPreferredSkills: Array.isArray(data.missingPreferredSkills) ? data.missingPreferredSkills : prev.missingPreferredSkills,
        }));
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

    const fetchCandidateData = async () => {
      setIsLoading(true);

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

      let profileData = null;
      let jobData = null;
      let appData = null;
      let cvData = null;
      let candMatch = null;

      // Khi có appId, tự động gọi API lấy chi tiết đơn để lấy jobId, cvId, candidateId chính xác
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

      // 2.1 Gọi song song các API backend
      try {
        const promises = [];
        if (resolvedCandId) promises.push(applicationApi.getCandidateProfile(resolvedCandId).catch(() => null));
        else promises.push(Promise.resolve(null));

        if (effectiveJobId) {
          promises.push(jobApi.getJobById(effectiveJobId).catch(() => null));
          promises.push(applicationApi.getJobApplications(effectiveJobId).catch(() => null));
          promises.push(aiMatchApi.getJobMatchesForRecruiter(effectiveJobId).catch(() => null));
        } else {
          promises.push(Promise.resolve(null));
          promises.push(Promise.resolve(null));
          promises.push(Promise.resolve(null));
        }

        const [profRes, jRes, appsRes, matchesRes] = await Promise.all(promises);

        profileData = profRes?.data || profRes;
        jobData = jRes?.data || jRes;
        const appsList = Array.isArray(appsRes?.data) ? appsRes.data : (Array.isArray(appsRes) ? appsRes : []);
        const matchesList = Array.isArray(matchesRes?.data) ? matchesRes.data : (Array.isArray(matchesRes) ? matchesRes : []);

        // Tìm candidate match từ AI Job Matches
        if (matchesList.length > 0) {
          candMatch = matchesList.find(
            (m) => parsedCandId && Number(m.candidateId) === Number(parsedCandId)
          ) || null;
        }

        // Tìm application
        if (appsList.length > 0) {
          appData = appsList.find(
            (a) =>
              (effectiveAppId && Number(a.applicationId) === Number(effectiveAppId)) ||
              (parsedCandId && Number(a.candidateId) === Number(parsedCandId))
          ) || appsList[0];
        }

        // Cập nhật từ profile API nếu có
        if (profileData) {
          candidateName = profileData.fullName || candidateName;
          candidateEmail = profileData.email || candidateEmail;
          candidatePhone = profileData.phone || candidatePhone;
          candidateAvatar = profileData.avatarUrl || candidateAvatar;
        }

        // Cập nhật từ job API nếu có
        if (jobData) {
          jobTitle = jobData.title || jobTitle;
        }

        // Cập nhật từ appData nếu có
        let isWithdrawn = false;
        if (appData) {
          effectiveAppId = appData.applicationId;
          candidateName = appData.candidateName || candidateName;
          candidateEmail = appData.candidateEmail || candidateEmail;
          jobTitle = appData.jobTitle || jobTitle;
          matchScore = appData.matchingScore != null ? Math.round(appData.matchingScore) : matchScore;
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
              if (rawNote) {
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

        // Xác định CV mục tiêu từ danh sách CV của ứng viên
        if (!effectiveCvId && profileData?.cvs && profileData.cvs.length > 0) {
          const defaultCv = profileData.cvs.find((c) => c.isDefault) || profileData.cvs[0];
          if (defaultCv) {
            effectiveCvId = defaultCv.cvId;
            cvUrl = defaultCv.fileUrl || cvUrl;
          }
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu ứng viên từ API, dùng dữ liệu thread/cache an toàn:', err);
      }

      // 2.2 Tải bản xem trước CV (PDF Blob) nếu có effectiveCvId
      if (effectiveCvId) {
        setIsPdfLoading(true);
        try {
          // Lấy chi tiết metadata của CV
          const detailRes = await cvApi.getCvById(effectiveCvId).catch(() => null);
          cvData = detailRes?.data?.data || detailRes?.data || null;

          // Lấy file nhị phân gốc (PDF, Ảnh hoặc Word) để preview
          const previewRes = await cvApi.previewCv(effectiveCvId).catch(() => null);
          const fn = cvData?.fileName?.toLowerCase() || '';
          let detectedMime = previewRes?.headers?.['content-type']
            || (fn.endsWith('.png') ? 'image/png'
            : fn.endsWith('.jpg') || fn.endsWith('.jpeg') ? 'image/jpeg'
            : fn.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : fn.endsWith('.doc') ? 'application/msword'
            : 'application/pdf');

          const blob = extractBlob(previewRes, detectedMime);
          if (blob && blob.size > 200) {
            createdBlobUrl = window.URL.createObjectURL(blob);
            if (isMounted) {
              setPdfBlobUrl(createdBlobUrl);
              setCvMimeType(detectedMime);
              setCvViewMode('pdf');
            }
          } else {
            // Fallback sang downloadCv
            const dlRes = await cvApi.downloadCv(effectiveCvId).catch(() => null);
            const dlBlob = extractBlob(dlRes, detectedMime);
            if (dlBlob && dlBlob.size > 200) {
              createdBlobUrl = window.URL.createObjectURL(dlBlob);
              if (isMounted) {
                setPdfBlobUrl(createdBlobUrl);
                setCvMimeType(detectedMime);
                setCvViewMode('pdf');
              }
            } else if (isMounted) {
              setCvViewMode('parsed');
            }
          }
        } catch (cvErr) {
          console.warn('Không thể tạo PDF Blob preview:', cvErr);
          if (isMounted) setCvViewMode('parsed');
        } finally {
          if (isMounted) setIsPdfLoading(false);
        }
      } else if (cvUrl && cvUrl !== '#') {
        if (isMounted) {
          setPdfBlobUrl(cvUrl);
          setCvViewMode('pdf');
        }
      } else if (isMounted) {
        setCvViewMode('parsed');
      }

      // 2.3 Phân tích dữ liệu trích xuất (Parsed JSON / Structured Profile)
      let parsedJson = null;
      try {
        if (cvData?.parsedJson) {
          parsedJson = typeof cvData.parsedJson === 'string' ? JSON.parse(cvData.parsedJson) : cvData.parsedJson;
        }
      } catch (ignored) {}

      // Lấy danh sách kỹ năng thực tế
      let cleanSkills = [];
      if (parsedJson?.skills && Array.isArray(parsedJson.skills) && parsedJson.skills.length > 0) {
        cleanSkills = parsedJson.skills.filter((s) => typeof s === 'string' && s.trim().length > 1);
      } else if (profileData?.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        cleanSkills = profileData.skills.map((s) => s.skillName || s.name || s).filter(Boolean);
      }

      // Lấy ma trận kỹ năng phân loại theo nhóm (Skills Matrix)
      let skillCategories = [];
      if (parsedJson?.skillCategories && Array.isArray(parsedJson.skillCategories) && parsedJson.skillCategories.length > 0) {
        skillCategories = parsedJson.skillCategories;
      } else if (parsedJson?.skill_categories && Array.isArray(parsedJson.skill_categories) && parsedJson.skill_categories.length > 0) {
        skillCategories = parsedJson.skill_categories;
      } else if (cleanSkills.length > 0) {
        skillCategories = [
          {
            category: 'Kỹ Năng Chuyên Môn Trích Xuất',
            items: cleanSkills
          }
        ];
      }

      // Lấy kinh nghiệm làm việc thực tế của ứng viên
      let experiences = [];
      if (parsedJson?.experiences && Array.isArray(parsedJson.experiences) && parsedJson.experiences.length > 0) {
        experiences = parsedJson.experiences;
      } else if (profileData?.experiencesJson) {
        try {
          const expArr = typeof profileData.experiencesJson === 'string' ? JSON.parse(profileData.experiencesJson) : profileData.experiencesJson;
          if (Array.isArray(expArr)) experiences = expArr;
        } catch (ignored) {}
      }

      // Lấy học vấn thực tế của ứng viên
      let educations = [];
      if (parsedJson?.educations && Array.isArray(parsedJson.educations) && parsedJson.educations.length > 0) {
        educations = parsedJson.educations;
      } else if (profileData?.educationsJson) {
        try {
          const eduArr = typeof profileData.educationsJson === 'string' ? JSON.parse(profileData.educationsJson) : profileData.educationsJson;
          if (Array.isArray(eduArr)) educations = eduArr;
        } catch (ignored) {}
      }

      // Lấy chứng chỉ quốc tế thực tế của ứng viên
      let certifications = [];
      if (parsedJson?.certifications && Array.isArray(parsedJson.certifications) && parsedJson.certifications.length > 0) {
        certifications = parsedJson.certifications;
      } else if (profileData?.certificationsJson) {
        try {
          const certArr = typeof profileData.certificationsJson === 'string' ? JSON.parse(profileData.certificationsJson) : profileData.certificationsJson;
          if (Array.isArray(certArr)) certifications = certArr;
        } catch (ignored) {}
      }

      // Lấy ngoại ngữ thành thạo thực tế của ứng viên
      let languages = [];
      if (parsedJson?.languages && Array.isArray(parsedJson.languages) && parsedJson.languages.length > 0) {
        languages = parsedJson.languages;
      } else if (profileData?.languagesJson) {
        try {
          const langArr = typeof profileData.languagesJson === 'string' ? JSON.parse(profileData.languagesJson) : profileData.languagesJson;
          if (Array.isArray(langArr)) languages = langArr;
        } catch (ignored) {}
      }

      // Lấy dự án trọng điểm thực tế của ứng viên
      let projects = [];
      if (parsedJson?.projects && Array.isArray(parsedJson.projects) && parsedJson.projects.length > 0) {
        projects = parsedJson.projects;
      } else if (profileData?.projectsJson) {
        try {
          const projArr = typeof profileData.projectsJson === 'string' ? JSON.parse(profileData.projectsJson) : profileData.projectsJson;
          if (Array.isArray(projArr)) projects = projArr;
        } catch (ignored) {}
      }

      // 4 Trụ cột ATS từ kết quả AI Match thực tế (tuyệt đối không biến 0 thành số giả)
      const skillsScore = appData?.skillsScore != null ? Number(appData.skillsScore) : (candMatch?.skillsScore != null ? Number(candMatch.skillsScore) : (parsedJson?.skillsScore ?? Math.round(matchScore)));
      const experienceScore = appData?.experienceScore != null ? Number(appData.experienceScore) : (candMatch?.experienceScore != null ? Number(candMatch.experienceScore) : (parsedJson?.experienceScore ?? Math.round(matchScore)));
      const educationScore = appData?.educationScore != null ? Number(appData.educationScore) : (candMatch?.educationScore != null ? Number(candMatch.educationScore) : (parsedJson?.educationScore ?? Math.round(matchScore)));
      const semanticScore = appData?.semanticScore != null ? Number(appData.semanticScore) : (candMatch?.semanticScore != null ? Number(candMatch.semanticScore) : (parsedJson?.semanticScore ?? Math.round(matchScore)));

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

      const mandatorySkills = candMatch?.matchedMandatorySkills 
        ? parseSkillList(candMatch.matchedMandatorySkills, [])
        : cleanSkills.slice(0, Math.ceil(cleanSkills.length * 0.6));
      const missingMandatorySkills = candMatch?.missingMandatorySkills
        ? parseSkillList(candMatch.missingMandatorySkills, [])
        : [];
      const preferredSkills = candMatch?.matchedPreferredSkills
        ? parseSkillList(candMatch.matchedPreferredSkills, [])
        : cleanSkills.slice(Math.ceil(cleanSkills.length * 0.6));
      const missingPreferredSkills = candMatch?.missingPreferredSkills
        ? parseSkillList(candMatch.missingPreferredSkills, [])
        : [];

      const assessmentLabel =
        matchScore >= 85
          ? 'XUẤT SẮC • ĐỀ CỬ VÒNG KỸ THUẬT'
          : matchScore >= 70
          ? 'ƯU TÚ • ĐẠT TIÊU CHÍ CỐT LÕI'
          : matchScore >= 50
          ? 'TIỀM NĂNG • CẦN PHỎNG VẤN ĐÁNH GIÁ'
          : 'CÂN NHẮC • CHƯA ĐẠT CHUẨN';

      let initialTpl = 'executive';
      if (appData?.coverLetter) {
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

      // Mẫu CV được đồng bộ chuẩn xác từ database (appData.coverLetter [CV_TEMPLATE:...]),
      // không đọc chéo localStorage của máy người duyệt để tránh sai lệch mẫu CV giữa Candidate và HR.

      if (isMounted) {
        setCand({
          id: parsedCandId,
          applicationId: effectiveAppId,
          isWithdrawn,
          initialTemplate: initialTpl,
          name: candidateName,
          title: parsedJson?.headline || profileData?.headline || (jobTitle ? `${jobTitle} • Ứng viên` : 'Chuyên viên'),
          roleSummary: `${jobTitle.toUpperCase()} • ĐÃ NỘP HỒ SƠ`,
          matchScore,
          skillsScore,
          experienceScore,
          educationScore,
          semanticScore,
          mandatoryScore: skillsScore,
          preferredScore: experienceScore,
          avatar: candidateAvatar,
          location: profileData?.location || profileData?.address || parsedJson?.address || 'Chưa cập nhật địa chỉ',
          dob: parsedJson?.dob || profileData?.dob || '',
          linkedin: parsedJson?.linkedin || profileData?.linkedin || '',
          portfolio: parsedJson?.portfolio || profileData?.portfolio || '',
          experience: profileData?.experienceYears ? `${profileData.experienceYears} năm kinh nghiệm` : (experiences.length > 0 ? `${experiences.length}+ năm kinh nghiệm` : 'Chưa cập nhật kinh nghiệm / Mới tốt nghiệp'),
          yearsOfExperience: profileData?.experienceYears || (experiences.length > 0 ? experiences.length : 0),
          salary: profileData?.desiredSalaryMax ? `${profileData.desiredSalaryMin || 15} - ${profileData.desiredSalaryMax} Triệu` : 'Thỏa thuận',
          email: candidateEmail,
          phone: candidatePhone,
          status: appStatus,
          aiFitAssessment: assessmentLabel,
          summary: parsedJson?.summary || cvData?.summary || profileData?.bio || 'Chưa có thông tin tóm tắt nghề nghiệp.',
          company: user?.companyName || 'Doanh nghiệp tuyển dụng',
          jobCode: effectiveJobId ? `JD-${effectiveJobId}` : 'JD-GENERAL',
          jobTitle,
          cvId: effectiveCvId,
          cvUrl: cvUrl || cvData?.fileUrl || '#',
          cvFileName: cvData?.fileName || `CV_${candidateName.replace(/\s+/g, '_')}.pdf`,
          matchedMandatorySkills: mandatorySkills,
          missingMandatorySkills: missingMandatorySkills,
          matchedPreferredSkills: preferredSkills,
          missingPreferredSkills: missingPreferredSkills,
          aiReasoning: candMatch?.aiReasoning || `Ứng viên đạt ${matchScore}% theo ma trận ATS đa chiều: Kỹ năng chuyên môn ${skillsScore}%, Kinh nghiệm thực chiến ${experienceScore}%, Học vấn & bằng cấp ${educationScore}%, Dự án & công nghệ thực chiến ${semanticScore}%.`,
          skills: cleanSkills,
          skillCategories,
          experiences,
          educations,
          certifications,
          languages,
          projects,
        });

        setAiRejectionEmail(
          `Kính gửi bạn ${candidateName},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${jobTitle} tại ${user?.companyName || 'công ty chúng tôi'} qua nền tảng HireMate AI.\n\nSau khi thẩm định kỹ lưỡng hồ sơ, hội đồng tuyển dụng nhận thấy định hướng đợt này cần ưu tiên các tiêu chí đặc thù khác. Do đó, chúng tôi xin phép lưu lại thông tin của bạn vào Talent Pool và sẽ chủ động kết nối khi có cơ hội phù hợp hơn.\n\nChúc bạn luôn thành công trên con đường sự nghiệp!\n\nTrân trọng,\n${user?.fullName || 'Bộ Phận Nhân Sự'}`
        );

        setIsLoading(false);
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
        {/* CỘT TRÁI (5/12): ĐÁNH GIÁ NĂNG LỰC, TIÊU CHÍ JD & QUYẾT ĐỊNH HR   */}
        {/* --------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Card A: Candidate Identification Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                {cand.avatar ? (
                  <img
                    src={cand.avatar}
                    alt={cand.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1e1548] to-[#5b48bd] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
                    {cand.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(-2)
                      .join('')
                      .toUpperCase() || 'UV'}
                  </div>
                )}
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
                  <span className="truncate">{cand.email}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số điện thoại</span>
                <span className="font-semibold text-slate-800 truncate block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                  <span>{cand.phone}</span>
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
                  {cand.aiReasoning}
                </p>
              </div>
            </div>
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
        {/* CỘT PHẢI (7/12): XEM FILE CV NGUYÊN BẢN (PDF) & CHI TIẾT ATS     */}
        {/* --------------------------------------------------------------- */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[750px]">
          
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

            {/* Quick Actions (Download, Open New Tab, Zoom) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCv}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Tải file CV gốc về máy tính"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span className="hidden sm:inline">Tải CV</span>
              </button>

              {pdfBlobUrl && (
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

          {/* Nội dung hồ sơ */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[820px] bg-[#fafafc]">
            {cvViewMode === 'pdf' ? (
              /* ======================================================= */
              /* TAB 1: XEM FILE PDF NGUYÊN BẢN CỦA ỨNG VIÊN             */
              /* ======================================================= */
              <div className="w-full h-full min-h-[700px] flex flex-col">
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
                    <iframe
                      src={pdfBlobUrl}
                      title={`CV - ${cand.name}`}
                      className="w-full h-[720px] rounded-2xl border border-slate-200/90 shadow-xs bg-white"
                    />
                  )
                ) : (
                  /* THÔNG BÁO KHI CHƯA CÓ PDF BLOB */
                  <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm max-w-md mx-auto my-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#1e1b4b]">{cand.cvFileName || 'Tài Liệu CV Ứng Viên'}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Tệp PDF gốc đang được đồng bộ bảo mật từ Vault Storage. Bạn có thể bấm nút bên dưới để tải trực tiếp hoặc chuyển sang tab <strong>"CV Online"</strong> để xem đầy đủ hồ sơ trực tuyến.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDownloadCv}
                        className="px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Tải CV Về Máy</span>
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
                showSelector={false}
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
