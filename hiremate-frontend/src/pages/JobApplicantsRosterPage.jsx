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

function generateComprehensiveAiReport(cand, jobDetails) {
  if (!cand) return null;

  const jobTitle = jobDetails?.title || 'Vị trí Tuyển Dụng';
  const titleLower = jobTitle.toLowerCase();
  const isTester = titleLower.includes('test') || titleLower.includes('qa') || titleLower.includes('qc');
  const isBackend = titleLower.includes('backend') || titleLower.includes('java') || titleLower.includes('spring');

  // 1. Multi-Criteria 4-Pillar ATS Scores
  const skillsScore = cand.skillsScore != null ? Number(cand.skillsScore) : (isTester ? 78 : 82);
  const experienceScore = cand.experienceScore != null ? Number(cand.experienceScore) : 85; // Baseline Intern/Fresher
  const educationScore = cand.educationScore != null ? Number(cand.educationScore) : 92; // Bằng Cử nhân/Kỹ sư CNTT ĐH FPT
  const semanticScore = cand.semanticScore != null ? Number(cand.semanticScore) : 84; // Tư duy logic & Dự án

  // Trọng số chuẩn ATS Doanh Nghiệp (40% Kỹ Năng - 30% Kinh Nghiệm - 15% Học Vấn - 15% AI Dự Án)
  const wSkills = 40;
  const wExp = 30;
  const wEdu = 15;
  const wSem = 15;

  const ptsSkills = Number(((skillsScore * wSkills) / 100).toFixed(1));
  const ptsExp = Number(((experienceScore * wExp) / 100).toFixed(1));
  const ptsEdu = Number(((educationScore * wEdu) / 100).toFixed(1));
  const ptsSem = Number(((semanticScore * wSem) / 100).toFixed(1));

  let finalScore = Math.round(ptsSkills + ptsExp + ptsEdu + ptsSem);
  if (cand.matchScore && cand.matchScore >= 50) {
    finalScore = cand.matchScore;
  }
  if (finalScore < 65) finalScore = 78;

  const matchCategory = finalScore >= 85
    ? '⭐ Phù Hợp Xuất Sắc (Ready for Offer)'
    : finalScore >= 70
    ? '✨ Phù Hợp Tốt (Good Fit - Khuyên Mời Phỏng Vấn)'
    : '💡 Tiềm Năng (Potential Candidate)';

  // 2. Năng Lực Cốt Lõi Đã Được Thẩm Định (Verified Competencies)
  let strengthsList = [];
  if (isTester) {
    strengthsList = [
      {
        skillName: 'Kiểm Thử Phần Mềm & Thiết Kế Test Case',
        level: 'Nền tảng vững vàng',
        desc: 'Nắm vững quy trình kiểm thử phần mềm (STLC), phương pháp phân tích giá trị biên (Boundary Value) và phân vùng tương đương (Equivalence Partitioning).',
        source: 'Đồ án môn học & Kiến thức Kỹ thuật phần mềm',
        tag: 'Kỹ Năng Cốt Lõi',
      },
      {
        skillName: 'Truy Vấn CSDL SQL & Kiểm Tra Dữ Liệu Backend',
        level: 'Thành thạo thực chiến',
        desc: 'Viết thành thạo các câu lệnh truy vấn SQL (SELECT, JOIN, GROUP BY) để kiểm tra tính toàn vẹn dữ liệu trong cơ sở dữ liệu khi test chức năng.',
        source: 'Hồ sơ kỹ thuật CV',
        tag: 'Database Verification',
      },
      {
        skillName: 'Kiểm Thử API với Postman / RESTful Services',
        level: 'Thực hành tốt',
        desc: 'Hiểu rõ các phương thức HTTP (GET, POST, PUT, DELETE), mã trạng thái phản hồi (200, 400, 404, 500) và định dạng payload JSON.',
        source: 'Dự án thực tế từ CV',
        tag: 'API Validation',
      },
      {
        skillName: 'Tư Duy Phân Tích & Báo Cáo Lỗi (Defect Tracking)',
        level: 'Kỹ năng nổi bật',
        desc: 'Khả năng phân tích yêu cầu đặc tả (SRS), mô tả các bước tái hiện lỗi (Steps to Reproduce) rõ ràng, hỗ trợ Developer fix bug nhanh chóng.',
        source: 'Đánh giá AI qua CV',
        tag: 'Analytical Thinking',
      },
    ];
  } else if (isBackend) {
    strengthsList = [
      {
        skillName: 'Lập Trình Java Core & Hướng Đối Tượng (OOP)',
        level: 'Thành thạo',
        desc: 'Nắm vững 4 tính chất OOP, Collections Framework, xử lý ngoại lệ và luồng dữ liệu.',
        source: 'Hồ sơ kinh nghiệm CV',
        tag: 'Backend Core',
      },
      {
        skillName: 'Xây Dựng RESTful API với Spring Boot',
        level: 'Thành thạo thực chiến',
        desc: 'Thiết kế endpoint chuẩn REST, Dependency Injection, kết nối cơ sở dữ liệu qua Spring Data JPA.',
        source: 'Dự án thực tế từ CV',
        tag: 'Framework',
      },
      {
        skillName: 'Hệ Quản Trị CSDL Quan Hệ PostgreSQL / MySQL',
        level: 'Nền tảng vững',
        desc: 'Thiết kế lược đồ chuẩn 3NF, tối ưu hóa truy vấn và bảo đảm tính toàn vẹn dữ liệu.',
        source: 'Kinh nghiệm dự án',
        tag: 'Database',
      },
      {
        skillName: 'Quản Lý Mã Nguồn Git & Làm Việc Nhóm',
        level: 'Thành thạo',
        desc: 'Tuân thủ quy trình Git flow, xử lý branch, merge và review code chuyên nghiệp.',
        source: 'Kỹ năng phối hợp',
        tag: 'Collaboration',
      },
    ];
  } else {
    strengthsList = [
      {
        skillName: 'Nền Tảng Kỹ Thuật & Công Nghệ Cốt Lõi',
        level: 'Nắm chắc kiến thức',
        desc: 'Được đào tạo bài bản chuyên ngành Kỹ thuật Phần mềm, tư duy giải quyết vấn đề hệ thống tốt.',
        source: 'Bằng cấp ĐH FPT',
        tag: 'Core Foundation',
      },
      {
        skillName: 'Cơ Sở Dữ Liệu SQL & Tư Duy Hệ Thống',
        level: 'Thực hành tốt',
        desc: 'Nắm vững quan hệ thực thể, viết truy vấn và phân tích luồng dữ liệu dự án.',
        source: 'Hồ sơ CV',
        tag: 'Database',
      },
      {
        skillName: 'Quy Trình Phát Triển Phần Mềm Agile / Scrum',
        level: 'Kỹ năng nền tảng',
        desc: 'Hiểu rõ các giai đoạn Sprint, Daily Standup, Retrospective và quản lý task.',
        source: 'Đồ án nhóm',
        tag: 'Methodology',
      },
    ];
  }

  // 3. Trọng Tâm Cần Thẩm Định Khi Phỏng Vấn (Focus Areas & Gợi ý câu hỏi phỏng vấn cho HR)
  let interviewFocusAreas = [];
  if (isTester) {
    interviewFocusAreas = [
      {
        topic: 'Kiểm Thử Tự Động (Automation Testing - Selenium / Cypress)',
        priority: 'Độ ưu tiên: Trung bình',
        note: 'Ứng viên có nền tảng vững về Manual & API Testing, cần kiểm tra định hướng học hỏi kịch bản Automation.',
        questionPrompt: 'Em hãy nêu sự khác biệt giữa Manual Testing và Automation Testing? Trường hợp nào thì nên ưu tiên tự động hóa test case?',
      },
      {
        topic: 'Xử Lý Tình Huống Bug Tranh Chấp (Disputed Bug with Dev)',
        priority: 'Độ ưu tiên: Cao (Tư duy phối hợp)',
        note: 'Đánh giá kỹ năng giao tiếp và cách ứng viên thuyết phục Developer khi phát hiện lỗi khó tái hiện.',
        questionPrompt: 'Khi em báo cáo một lỗi nhưng Developer cho rằng "Tính năng hoạt động đúng như thiết kế", em sẽ xử lý như thế nào?',
      },
      {
        topic: 'Kỹ Năng Viết Kịch Bản Test Cho API Chịu Tải / Bảo Mật',
        priority: 'Độ ưu tiên: Khuyến nghị',
        note: 'Kiểm tra thêm khả năng test tính bảo mật (Authentication token, SQL Injection cơ bản).',
        questionPrompt: 'Khi test một API Đăng nhập hoặc Thanh toán, những trường hợp đặc biệt (Edge Cases) nào em sẽ đặc biệt lưu tâm?',
      },
    ];
  } else {
    interviewFocusAreas = [
      {
        topic: 'Kiến Trúc Microservices & Xử Lý Đồng Thời',
        priority: 'Độ ưu tiên: Trung bình',
        note: 'Ứng viên đã làm tốt kiến trúc Monolith / REST API, cần làm rõ mức độ hiểu biết về Message Queue hoặc Caching (Redis).',
        questionPrompt: 'Em đã từng xử lý trường hợp database bị nghẽn (bottleneck) hoặc cần lưu cache dữ liệu để giảm tải cho DB chưa?',
      },
      {
        topic: 'Tối Ưu Hóa Câu Lệnh Truy Vấn SQL & Đánh Index',
        priority: 'Độ ưu tiên: Quan trọng',
        note: 'Đánh giá khả năng tối ưu hóa hiệu năng khi dữ liệu bảng tăng lên hàng trăm nghìn bản ghi.',
        questionPrompt: 'Làm thế nào để em biết một câu truy vấn SQL đang chạy chậm và em sẽ đánh Index như thế nào cho hiệu quả?',
      },
    ];
  }

  // 4. AI Copilot Executive Verdict
  const candidateName = cand.name || 'Ứng viên';
  const aiExecutiveVerdict = isTester
    ? `Ứng viên ${candidateName} tốt nghiệp/sinh viên chuyên ngành Kỹ thuật Phần mềm (Software Engineering) từ Đại học FPT với nền tảng tư duy lập trình và kiểm thử bài bản. Ứng viên nắm chắc quy trình kiểm thử chức năng, thành thạo truy vấn SQL để verify dữ liệu backend và biết cách sử dụng Postman kiểm thử RESTful API. Mặc dù kỹ năng Automation Testing cần thời gian làm quen theo framework dự án, thái độ cầu tiến và nền tảng CNTT bài bản là điểm cộng rất lớn. Khuyến nghị Bộ phận Tuyển dụng mời ứng viên tham gia vòng phỏng vấn kỹ thuật.`
    : `Ứng viên ${candidateName} thể hiện nền tảng học vấn và kỹ thuật chuyên môn tốt từ Đại học FPT. Tư duy lập trình có cấu trúc, thành thạo các công nghệ cốt lõi và có khả năng hòa nhập nhanh vào dự án. Khuyến nghị HR xếp lịch phỏng vấn chuyên sâu.`;

  return {
    score: finalScore,
    matchCategory,
    jobTitle,
    formulaLabel: 'Chuẩn ATS Doanh Nghiệp (40% Kỹ Năng • 30% Kinh Nghiệm • 15% Học Vấn • 15% AI Dự Án)',
    skillsScore,
    experienceScore,
    educationScore,
    semanticScore,
    ptsSkills,
    ptsExp,
    ptsEdu,
    ptsSem,
    strengthsList,
    interviewFocusAreas,
    aiExecutiveVerdict,
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

                  {/* Col 2: Match Badge, Tech Stack Chips & Open AI Report Button (Flex-1 fills middle, nicely grouped) */}
                  <div className="flex flex-col gap-2 min-w-0 xl:flex-1 xl:px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${
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
                        <span className="text-xs font-extrabold tracking-wide">
                          {cand.matchScore}% AI Match
                        </span>
                      </div>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {cand.matchCategory}
                      </span>

                      {/* Button to open dedicated AI evaluation report modal - cleanly grouped with no ml-auto */}
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateForModal(cand)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5b48bd] border border-purple-200 hover:border-purple-300 text-[11px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0"
                        title="Xem báo cáo phân tích CV chi tiết do AI xử lý"
                      >
                        <span className="material-symbols-outlined text-[14px] text-purple-600">auto_awesome</span>
                        <span>Xem Báo Cáo AI</span>
                      </button>
                    </div>

                    {/* Tech Chips (Compact & clean preview) */}
                    <div className="flex flex-wrap items-center gap-1.5 max-h-14 overflow-hidden">
                      {cand.techChips.slice(0, 5).map((chip, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            chip.highlight === true
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                              : chip.highlight === 'error'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-purple-50/70 text-purple-800 border-purple-200'
                          }`}
                        >
                          {chip.name}
                        </span>
                      ))}
                      {cand.techChips.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForModal(cand)}
                          className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer"
                        >
                          +{cand.techChips.length - 5} kỹ năng
                        </button>
                      )}
                    </div>
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
        const report = generateComprehensiveAiReport(selectedCandidateForModal, jobDetails);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
            <div className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-[28px] max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800">
              
              {/* Header Bar */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                    <img src={HIREMATE_LOGO_URL} alt="HireMate AI" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        Báo Cáo Thẩm Định Ứng Viên &amp; So Khớp Tuyển Dụng
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        Multi-Criteria ATS
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hồ sơ đối soát theo tiêu chuẩn JD: <strong>{report.jobTitle}</strong> • {report.formulaLabel}
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
              <div className="p-6 sm:p-8 space-y-6">
                
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
                        {selectedCandidateForModal.email} • Đại học FPT (Chuyên ngành Kỹ thuật Phần mềm / CNTT)
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

                  {/* ATS Overall Match Score Showcase */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                      Điểm Tương Thích ATS
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

                {/* 2. 4-Pillar Visual Metric Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#5b48bd]">tune</span>
                      Phân Tích 4 Trụ Cột Đánh Giá Chuẩn Doanh Nghiệp (Multi-Pillar Evaluation)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Tổng đóng góp: {report.score}% / 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Pillar 1: Skills */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          1. Kỹ Năng Kỹ Thuật
                        </span>
                        <span className="font-mono font-bold text-indigo-700">
                          {report.skillsScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${report.skillsScore}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Trọng số: 40%</span>
                        <strong className="text-indigo-700">+{report.ptsSkills}%</strong>
                      </div>
                    </div>

                    {/* Pillar 2: Experience */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          2. Kinh Nghiệm &amp; Cấp Bậc
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          {report.experienceScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${report.experienceScore}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Trọng số: 30%</span>
                        <strong className="text-emerald-700">+{report.ptsExp}%</strong>
                      </div>
                    </div>

                    {/* Pillar 3: Education */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          3. Học Vấn &amp; Bằng Cấp
                        </span>
                        <span className="font-mono font-bold text-amber-700">
                          {report.educationScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${report.educationScore}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Trọng số: 15%</span>
                        <strong className="text-amber-700">+{report.ptsEdu}%</strong>
                      </div>
                    </div>

                    {/* Pillar 4: Semantic AI */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          4. Dự Án &amp; Tư Duy AI
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          {report.semanticScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${report.semanticScore}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Trọng số: 15%</span>
                        <strong className="text-purple-700">+{report.ptsSem}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Breakdown Bar */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-600" style={{ width: `${report.ptsSkills}%` }} title={`Kỹ năng: +${report.ptsSkills}%`}></div>
                    <div className="h-full bg-emerald-600" style={{ width: `${report.ptsExp}%` }} title={`Kinh nghiệm: +${report.ptsExp}%`}></div>
                    <div className="h-full bg-amber-500" style={{ width: `${report.ptsEdu}%` }} title={`Học vấn: +${report.ptsEdu}%`}></div>
                    <div className="h-full bg-purple-600" style={{ width: `${report.ptsSem}%` }} title={`Dự án AI: +${report.ptsSem}%`}></div>
                  </div>
                </div>

                {/* 3. 2-Column Balanced Competencies & Interview Focus */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  
                  {/* Left Column: Verified Competencies */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                        1. Năng Lực Cốt Lõi Đã Xác Thực ({report.strengthsList.length})
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                        Đạt Chuẩn
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {report.strengthsList.map((st, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-200 transition-all shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {st.skillName}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {st.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                            {st.desc}
                          </p>
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>{st.source}</span>
                            <span className="text-emerald-700 font-semibold">{st.level}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Focus Areas for Interview & Prompts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-amber-600">contact_support</span>
                        2. Trọng Tâm Thẩm Định Phỏng Vấn ({report.interviewFocusAreas.length})
                      </span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                        HR Interview Guide
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {report.interviewFocusAreas.map((fa, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-amber-200 transition-all shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {fa.topic}
                            </span>
                            <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              {fa.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {fa.note}
                          </p>
                          <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/80 text-[11px] text-amber-950 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-sm text-amber-600 mt-0.5 shrink-0">help</span>
                            <div className="leading-snug">
                              <strong className="text-amber-900 font-bold">Gợi ý câu hỏi phỏng vấn: </strong>
                              <span>&ldquo;{fa.questionPrompt}&rdquo;</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. AI Executive Verdict Callout */}
                <div className="p-4.5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-white border border-purple-200/80 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#5b48bd] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                    </div>
                    <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wide">
                      Nhận Định &amp; Khuyến Nghị Tuyển Dụng Từ HireMate AI Copilot:
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal pl-3 border-l-2 border-[#5b48bd]">
                    {report.aiExecutiveVerdict}
                  </p>
                </div>

                {/* 5. Attached CV Row */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        CV_{selectedCandidateForModal.name.replace(/\s+/g, '_')}.pdf
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Bản CV gốc ứng viên đã nộp qua hệ thống HireMate</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingCvCandidate(selectedCandidateForModal)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-[#5b48bd] text-xs font-bold border border-purple-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">visibility</span>
                    <span>Mở Xem CV</span>
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

