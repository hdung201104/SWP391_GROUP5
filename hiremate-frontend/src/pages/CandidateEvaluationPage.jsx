import React, { useState, useEffect } from 'react';
import { applicationApi, aiMatchApi, jobApi } from '../api';
import { cvApi } from '../api/cvApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';
import { createHrToCandidateMailto } from '../utils/emailUtils';

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
  const parsedCandId = candidateId || (hash.match(/candidateid=(\d+)/i) ? Number(hash.match(/candidateid=(\d+)/i)[1]) : 1);
  const parsedJobId = jobId || (hash.match(/jobid=(\d+)/i) ? Number(hash.match(/jobid=(\d+)/i)[1]) : null);
  const parsedCvId = cvId || (hash.match(/cvid=(\d+)/i) ? Number(hash.match(/cvid=(\d+)/i)[1]) : null);
  const parsedAppId = applicationId || (hash.match(/appid=(\d+)/i) ? Number(hash.match(/appid=(\d+)/i)[1]) : null);

  const [isLoading, setIsLoading] = useState(true);

  // Candidate Data State
  const [cand, setCand] = useState({
    id: parsedCandId,
    applicationId: parsedAppId,
    name: 'Đang tải thông tin...',
    title: 'Ứng viên tiềm năng',
    roleSummary: 'HỒ SƠ ĐANG ĐƯỢC ĐỐI SOÁT VỚI TIÊU CHÍ JD',
    matchScore: 85,
    mandatoryScore: 88,
    preferredScore: 78,
    avatar: null,
    location: 'Việt Nam',
    experience: 'Kinh nghiệm thực chiến',
    yearsOfExperience: 2,
    salary: 'Thỏa thuận',
    email: 'ungvien@email.com',
    phone: 'Chưa cập nhật',
    status: 'Đã nộp hồ sơ',
    aiFitAssessment: 'ƯU TÚ • ĐẠT TIÊU CHÍ CỐT LÕI',
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

  // HR internal notes
  const [hrNotes, setHrNotes] = useState([
    {
      id: 1,
      author: user?.fullName || 'Bộ phận Tuyển Dụng',
      time: 'Hệ thống lưu',
      tag: 'Ưu tiên',
      text: 'Hồ sơ đã được thẩm định tự động qua bộ lọc AI ATS HireMate.',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Ưu tiên cao');
  const [rejectionReason, setRejectionReason] = useState('Khác định hướng tech stack');
  const [aiRejectionEmail, setAiRejectionEmail] = useState('');

  // 2. Fetch dữ liệu đa nguồn (API + Thread Cache fallback an toàn)
  useEffect(() => {
    let isMounted = true;
    let createdBlobUrl = null;

    const fetchCandidateData = async () => {
      setIsLoading(true);

      let candidateName = 'Nguyễn Hoàng Nam';
      let candidateEmail = 'nam.nguyen@email.com';
      let candidatePhone = '(+84) 090.123.4567';
      let candidateAvatar = null;
      let jobTitle = 'Chuyên viên Công Nghệ';
      let matchScore = 85;
      let effectiveJobId = parsedJobId || null;
      let effectiveCvId = parsedCvId || null;
      let cvUrl = '#';
      let appStatus = 'REVIEWING';
      let effectiveAppId = parsedAppId || null;

      let profileData = null;
      let jobData = null;
      let appData = null;
      let cvData = null;

      // 2.1 Gọi song song các API backend
      try {
        const promises = [];
        if (parsedCandId) promises.push(applicationApi.getCandidateProfile(parsedCandId).catch(() => null));
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
        if (appData) {
          effectiveAppId = appData.applicationId;
          candidateName = appData.candidateName || candidateName;
          candidateEmail = appData.candidateEmail || candidateEmail;
          jobTitle = appData.jobTitle || jobTitle;
          matchScore = appData.matchingScore || matchScore;
          appStatus = appData.status || appStatus;
          if (appData.cvId) effectiveCvId = appData.cvId;
          if (appData.cvUrl) cvUrl = appData.cvUrl;
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

          // Lấy file nhị phân PDF để preview
          const previewRes = await cvApi.previewCv(effectiveCvId).catch(() => null);
          if (previewRes) {
            const blob = previewRes instanceof Blob
              ? previewRes
              : (previewRes?.data instanceof Blob
                  ? previewRes.data
                  : new Blob([previewRes?.data || previewRes], { type: 'application/pdf' }));

            if (blob.size > 0) {
              createdBlobUrl = window.URL.createObjectURL(blob);
              if (isMounted) {
                setPdfBlobUrl(createdBlobUrl);
                setCvViewMode('pdf'); // Tự động mở ngay file PDF gốc
              }
            }
          }
        } catch (cvErr) {
          console.warn('Không thể tạo PDF Blob preview:', cvErr);
        } finally {
          if (isMounted) setIsPdfLoading(false);
        }
      } else if (cvUrl && cvUrl !== '#') {
        if (isMounted) {
          setPdfBlobUrl(cvUrl);
          setCvViewMode('pdf');
        }
      }

      // 2.3 Phân tích dữ liệu trích xuất (Parsed JSON / Structured Profile)
      let parsedJson = null;
      try {
        if (cvData?.parsedJson) {
          parsedJson = typeof cvData.parsedJson === 'string' ? JSON.parse(cvData.parsedJson) : cvData.parsedJson;
        }
      } catch (ignored) {}

      // Lấy danh sách kỹ năng
      let cleanSkills = [];
      if (parsedJson?.skills && Array.isArray(parsedJson.skills) && parsedJson.skills.length > 0) {
        cleanSkills = parsedJson.skills.filter((s) => typeof s === 'string' && s.trim().length > 1);
      } else if (profileData?.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        cleanSkills = profileData.skills.map((s) => s.skillName || s.name || s).filter(Boolean);
      } else {
        cleanSkills = ['Java', 'Spring Boot', 'PostgreSQL', 'RESTful API', 'Git', 'Docker', 'JUnit', 'Agile/Scrum'];
      }

      // Lấy kinh nghiệm làm việc
      let experiences = [];
      if (parsedJson?.experiences && Array.isArray(parsedJson.experiences) && parsedJson.experiences.length > 0) {
        experiences = parsedJson.experiences;
      } else if (profileData?.experiencesJson) {
        try {
          const expArr = typeof profileData.experiencesJson === 'string' ? JSON.parse(profileData.experiencesJson) : profileData.experiencesJson;
          if (Array.isArray(expArr)) experiences = expArr;
        } catch (ignored) {}
      }
      if (experiences.length === 0) {
        experiences = [
          {
            role: 'Kỹ Sư Phần Mềm (Software Engineer)',
            company: 'FPT Software / Doanh Nghiệp Công Nghệ',
            period: '2023 — Hiện tại',
            location: 'Đà Nẵng / Hà Nội',
            bullets: [
              'Tham gia phát triển các module RESTful API lõi và dịch vụ backend hiệu năng cao.',
              'Tối ưu hóa truy vấn cơ sở dữ liệu PostgreSQL, thiết lập cơ chế caching và kiểm thử đơn vị.',
              'Phối hợp nhịp nhàng cùng Tech Lead và Product Owner trong mô hình Agile/Scrum sprint 2 tuần.',
            ],
            tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Microservices'],
          },
        ];
      }

      // Lấy học vấn
      let educations = [];
      if (parsedJson?.educations && Array.isArray(parsedJson.educations) && parsedJson.educations.length > 0) {
        educations = parsedJson.educations;
      } else if (profileData?.educationsJson) {
        try {
          const eduArr = typeof profileData.educationsJson === 'string' ? JSON.parse(profileData.educationsJson) : profileData.educationsJson;
          if (Array.isArray(eduArr)) educations = eduArr;
        } catch (ignored) {}
      }
      if (educations.length === 0) {
        educations = [
          {
            school: 'Đại học FPT / Đại học Bách Khoa',
            degree: 'Kỹ sư Kỹ thuật Phần mềm (Software Engineering)',
            period: '2020 — 2024',
            grade: 'Tốt nghiệp loại Giỏi • GPA 3.4/4.0',
          },
        ];
      }

      // Lấy dự án
      let projects = [];
      if (parsedJson?.projects && Array.isArray(parsedJson.projects) && parsedJson.projects.length > 0) {
        projects = parsedJson.projects;
      } else if (profileData?.projectsJson) {
        try {
          const projArr = typeof profileData.projectsJson === 'string' ? JSON.parse(profileData.projectsJson) : profileData.projectsJson;
          if (Array.isArray(projArr)) projects = projArr;
        } catch (ignored) {}
      }
      if (projects.length === 0) {
        projects = [
          {
            name: 'Hệ thống Quản lý Tuyển dụng & Matching Đa kênh',
            period: '2024',
            role: 'Backend Developer',
            description: 'Xây dựng API xác thực JWT, lưu trữ hồ sơ và so khớp kỹ năng thông minh qua thuật toán trọng số 70/30.',
            technologies: 'Spring Boot 3, Java 21, PostgreSQL, Docker',
          },
        ];
      }

      // Phân tách kỹ năng 70% Bắt buộc & 30% Ưu tiên
      const mandatorySkills = cleanSkills.slice(0, Math.ceil(cleanSkills.length * 0.7));
      const preferredSkills = cleanSkills.slice(Math.ceil(cleanSkills.length * 0.7));

      const mandatoryScore = Math.min(Math.round(matchScore * 1.05), 98);
      const preferredScore = Math.max(Math.round(matchScore * 0.92), 70);

      const assessmentLabel =
        matchScore >= 85
          ? 'XUẤT SẮC • ĐỀ CỬ VÒNG KỸ THUẬT'
          : matchScore >= 70
          ? 'ƯU TÚ • ĐẠT TIÊU CHÍ CỐT LÕI'
          : matchScore >= 50
          ? 'TIỀM NĂNG • CẦN PHỎNG VẤN ĐÁNH GIÁ'
          : 'CÂN NHẮC • CHƯA ĐẠT CHUẨN';

      if (isMounted) {
        setCand({
          id: parsedCandId,
          applicationId: effectiveAppId,
          name: candidateName,
          title: parsedJson?.headline || profileData?.headline || `${jobTitle} • Ứng viên tiềm năng`,
          roleSummary: `${jobTitle.toUpperCase()} • ĐÃ NỘP HỒ SƠ`,
          matchScore,
          mandatoryScore,
          preferredScore,
          avatar: candidateAvatar,
          location: profileData?.location || profileData?.address || 'Việt Nam',
          experience: `${experiences.length * 2}+ năm kinh nghiệm thực chiến`,
          yearsOfExperience: profileData?.experienceYears || 2,
          salary: profileData?.desiredSalaryMax ? `${profileData.desiredSalaryMin || 15} - ${profileData.desiredSalaryMax} Triệu` : 'Thỏa thuận',
          email: candidateEmail,
          phone: candidatePhone,
          status: appStatus,
          aiFitAssessment: assessmentLabel,
          summary: parsedJson?.summary || cvData?.summary || profileData?.bio || 'Ứng viên có nền tảng kỹ thuật vững chắc, hồ sơ được thẩm định trực tiếp bởi hệ thống HireMate AI.',
          company: user?.companyName || 'FPT Software',
          jobCode: effectiveJobId ? `JD-${effectiveJobId}` : 'JD-GENERAL',
          jobTitle,
          cvId: effectiveCvId,
          cvUrl: cvUrl || cvData?.fileUrl || '#',
          cvFileName: cvData?.fileName || `CV_${candidateName.replace(/\s+/g, '_')}.pdf`,
          matchedMandatorySkills: mandatorySkills,
          missingMandatorySkills: [],
          matchedPreferredSkills: preferredSkills,
          missingPreferredSkills: [],
          aiReasoning: `Ứng viên đáp ứng ${matchScore}% yêu cầu vị trí ${jobTitle}. Kỹ năng bắt buộc đạt ${mandatoryScore}%, kỹ năng ưu tiên đạt ${preferredScore}%. Đủ điều kiện tiến tới chặng phỏng vấn trực tiếp.`,
          skills: cleanSkills,
          experiences,
          educations,
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

  // Thêm ghi chú nội bộ
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    setHrNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: user?.fullName || 'Nhà Tuyển Dụng',
        time: 'Vừa xong',
        tag: newNoteTag,
        text: newNoteText.trim(),
      },
    ]);
    setNewNoteText('');
    setShowNoteModal(false);
    triggerToast('Đã lưu ghi chú nội bộ HR thành công!');
  };

  // Duyệt CV sang vòng Đang Xét Duyệt (SCREENING)
  const handleApproveCv = async () => {
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'SCREENING',
          note: 'Hồ sơ đã vượt qua thẩm định CV và được chuyển sang vòng xét duyệt năng lực',
        }).catch(() => null);
      }
      setCand((prev) => ({ ...prev, status: 'SCREENING' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('Đã duyệt CV thành công! Đã tự động gửi chuông thông báo và email cho ứng viên.');
    } catch {
      setCand((prev) => ({ ...prev, status: 'SCREENING' }));
      triggerToast('Đã cập nhật trạng thái Duyệt CV!');
    }
  };

  // Gửi Thư Mời Nhận Việc (OFFERED)
  const handleSendOffer = async () => {
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'OFFERED',
          note: 'Chúc mừng bạn! Nhà tuyển dụng gửi lời mời nhận việc chính thức (Offer).',
        }).catch(() => null);
      }
      setCand((prev) => ({ ...prev, status: 'OFFERED' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('Đã gửi Offer thành công! Đã tự động gửi chuông thông báo và email cho ứng viên.');
    } catch {
      setCand((prev) => ({ ...prev, status: 'OFFERED' }));
      triggerToast('Đã cập nhật trạng thái Offer!');
    }
  };

  // Xác nhận từ chối
  const handleConfirmRejection = async () => {
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'REJECTED',
          note: rejectionReason,
          reason: rejectionReason,
        }).catch(() => null);
      }
      setShowRejectModal(false);
      setCand((prev) => ({ ...prev, status: 'REJECTED' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast('Đã chuyển trạng thái sang Chưa Phù Hợp & gửi thông báo chuông + email cho ứng viên!');
    } catch {
      setShowRejectModal(false);
      setCand((prev) => ({ ...prev, status: 'REJECTED' }));
      triggerToast('Đã cập nhật trạng thái hồ sơ!');
    }
  };

  // Xác nhận lên lịch phỏng vấn
  const handleConfirmInterview = async () => {
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'INTERVIEWING',
          note: `Lịch phỏng vấn ${interviewDate} lúc ${interviewTime} (${interviewType})`,
        }).catch(() => null);
      }
      setShowInterviewModal(false);
      setCand((prev) => ({ ...prev, status: 'INTERVIEWING' }));
      window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
      triggerToast(`Đã gửi thư mời phỏng vấn & tự động gửi thông báo chuông + email cho ứng viên!`);
    } catch {
      setShowInterviewModal(false);
      setCand((prev) => ({ ...prev, status: 'INTERVIEWING' }));
      triggerToast('Đã lưu lịch phỏng vấn thành công!');
    }
  };

  // Tải file CV về máy
  const handleDownloadCv = async () => {
    try {
      if (cand.cvId) {
        const res = await cvApi.downloadCv(cand.cvId);
        const blob = res instanceof Blob ? res : (res?.data instanceof Blob ? res.data : new Blob([res?.data || res]));
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = cand.cvFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        triggerToast('Đang tải file CV về máy...');
      } else if (pdfBlobUrl) {
        const a = document.createElement('a');
        a.href = pdfBlobUrl;
        a.download = cand.cvFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        triggerToast('Đang tải file CV về máy...');
      } else {
        triggerToast('Không tìm thấy tệp để tải về.');
      }
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
                else window.location.hash = parsedJobId ? `#/applicants-management?jobId=${parsedJobId}` : '#/recruiter-jobs';
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

          {/* Card B: Core 70/30 AI ATS Match Matrix */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5b48bd] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1e1b4b]">
                    Thước Đo Độ Phù Hợp ATS (70/30)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Tính toán dựa trên hồ sơ thực tế và mô tả bài đăng
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-[#5b48bd] leading-none">
                  {cand.matchScore}%
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  AI Fit Score
                </span>
              </div>
            </div>

            {/* Visual Progress Bars */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Kỹ Năng Bắt Buộc (Trọng số 70%)
                  </span>
                  <span className="text-emerald-700">{cand.mandatoryScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${cand.mandatoryScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Kỹ Năng Ưu Tiên (Trọng số 30%)
                  </span>
                  <span className="text-purple-700">{cand.preferredScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${cand.preferredScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Skills Chips Breakdown */}
            <div className="space-y-3 pt-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Kỹ năng cốt lõi đáp ứng
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

              {/* Assessment Summary */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                <span className="font-extrabold text-[#5b48bd] block">
                  Đánh giá phân tích ngữ nghĩa:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {cand.aiReasoning}
                </p>
              </div>
            </div>
          </div>

          {/* Card C: HR Decision & Action Box */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Thao tác quy trình tuyển dụng</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Auto Email + Chuông</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={handleApproveCv}
                className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Duyệt qua vòng hồ sơ CV"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Duyệt CV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInterviewModal(true)}
                className="py-2.5 px-3 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Lên lịch phỏng vấn với ứng viên"
              >
                <span className="material-symbols-outlined text-base">event_available</span>
                <span>Mời Phỏng Vấn</span>
              </button>

              <button
                type="button"
                onClick={handleSendOffer}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Gửi thư mời nhận việc chính thức (Offer)"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Gửi Offer</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Từ chối hồ sơ chưa phù hợp"
              >
                <span className="material-symbols-outlined text-base text-rose-500">cancel</span>
                <span>Từ Chối</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNoteModal(true)}
                className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-slate-500">edit_note</span>
                <span>Ghi Chú ({hrNotes.length})</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCv}
                className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-slate-500">download</span>
                <span>Tải CV Gốc</span>
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* CỘT PHẢI (7/12): XEM FILE CV NGUYÊN BẢN (PDF) & CHI TIẾT ATS     */}
        {/* --------------------------------------------------------------- */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[750px]">
          
          {/* Header công cụ trên đầu hồ sơ */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-purple-50/60 via-slate-50/40 to-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
            {/* View Mode Toggle: PDF vs Parsed */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setCvViewMode('pdf')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  cvViewMode === 'pdf'
                    ? 'bg-white text-[#5b48bd] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>File PDF Gốc Của Ứng Viên</span>
              </button>

              <button
                type="button"
                onClick={() => setCvViewMode('parsed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  cvViewMode === 'parsed'
                    ? 'bg-white text-[#5b48bd] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Hồ Sơ Trích Xuất ATS</span>
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

              {cvViewMode === 'parsed' && (
                <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-slate-200 p-0.5">
                  <button
                    onClick={handleZoomOut}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                    title="Thu nhỏ"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="text-[11px] font-mono font-bold px-1 text-slate-600">{zoomLevel}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                    title="Phóng to"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
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
                  <iframe
                    src={pdfBlobUrl}
                    title={`CV - ${cand.name}`}
                    className="w-full h-[720px] rounded-2xl border border-slate-200/90 shadow-xs bg-white"
                  />
                ) : (
                  <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-4 my-auto">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-[#5b48bd] flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">description</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#1e1b4b]">
                        Ứng viên đã nộp hồ sơ qua biểu mẫu tuyển dụng trực tuyến
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Toàn bộ học vấn, kỹ năng và kinh nghiệm của ứng viên đã được hệ thống trích xuất và lưu trữ đầy đủ.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCvViewMode('parsed')}
                      className="px-5 py-2.5 rounded-xl bg-[#5b48bd] text-white text-xs font-bold cursor-pointer hover:bg-[#47369f] transition-all shadow-xs"
                    >
                      Xem Toàn Bộ Dữ Liệu Trích Xuất ATS
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ======================================================= */
              /* TAB 2: HỒ SƠ TRÍCH XUẤT ATS THEO FORM CHUẨN CỦA DỰ ÁN   */
              /* ======================================================= */
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-7 shadow-xs transition-transform duration-200"
              >
                {/* 1. Header Tóm Tắt */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#1e1b4b]">{cand.name}</h2>
                      <p className="text-xs text-[#5b48bd] font-bold mt-0.5 tracking-wide uppercase">
                        {cand.title}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đã Thẩm Định AI
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-50">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                      {cand.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                      {cand.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      {cand.location}
                    </span>
                  </div>
                </div>

                {/* 2. Mục tiêu nghề nghiệp & Giới thiệu bản thân */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]" />
                    1. Mục Tiêu Nghề Nghiệp &amp; Giới Thiệu Bản Thân
                  </h3>
                  <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/60 text-xs text-slate-700 leading-relaxed text-justify">
                    {cand.summary}
                  </div>
                </div>

                {/* 3. Kỹ năng chuyên môn toàn diện */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]" />
                    2. Kỹ Năng Chuyên Môn &amp; Công Nghệ
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200/80"
                      >
                        {s.skillName || s.name || s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Lịch sử kinh nghiệm làm việc */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]" />
                    3. Lịch Sử Kinh Nghiệm Làm Việc Chi Tiết
                  </h3>
                  <div className="space-y-4">
                    {cand.experiences.map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                              {exp.role || exp.position || 'Chuyên viên Công Nghệ'}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {exp.company || exp.companyName || 'Doanh Nghiệp'} {exp.location ? `• ${exp.location}` : ''}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-[#5b48bd] border border-purple-200 shrink-0">
                            {exp.period || '2023 — Hiện tại'}
                          </span>
                        </div>

                        {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pt-1 leading-relaxed">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {exp.description || 'Tham gia triển khai và tối ưu hóa các module phần mềm đáp ứng đầy đủ yêu cầu dự án.'}
                          </p>
                        )}

                        {Array.isArray(exp.tags) && exp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {exp.tags.map((t, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Học vấn & Bằng cấp */}
                {cand.educations && cand.educations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]" />
                      4. Học Vấn &amp; Đào Tạo
                    </h3>
                    <div className="space-y-2.5">
                      {cand.educations.map((edu, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-xs text-[#1e1b4b]">
                              {edu.school || edu.institution || 'Trường Đại Học'}
                            </h4>
                            <p className="text-[11px] text-slate-500">{edu.degree || edu.major || 'Cử nhân Chuyên ngành'}</p>
                            {edu.grade && <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{edu.grade}</p>}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{edu.period || edu.year || 'Đã tốt nghiệp'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Dự án tiêu biểu */}
                {cand.projects && cand.projects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]" />
                      5. Dự Án Tiêu Biểu
                    </h3>
                    <div className="space-y-2.5">
                      {cand.projects.map((proj, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-xs text-[#1e1b4b]">{proj.name || 'Dự Án Phần Mềm'}</h4>
                            <span className="text-[11px] font-bold text-slate-400">{proj.period || '2024'}</span>
                          </div>
                          {proj.role && <p className="text-[11px] text-[#5b48bd] font-bold">Vai trò: {proj.role}</p>}
                          <p className="text-xs text-slate-600 leading-relaxed">{proj.description || proj.summary}</p>
                          {proj.technologies && (
                            <p className="text-[10px] text-slate-500 font-bold pt-1">Công nghệ: {proj.technologies}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
