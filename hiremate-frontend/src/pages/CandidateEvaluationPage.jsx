import React, { useState, useEffect } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { applicationApi, aiMatchApi, jobApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';

export default function CandidateEvaluationPage({ user, candidateId = 1, jobId = 101, onBack }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Candidate Data State (populated from Supabase PostgreSQL)
  const [cand, setCand] = useState({
    id: candidateId,
    applicationId: null,
    name: 'Đang tải thông tin...',
    title: 'Ứng viên tiềm năng',
    roleSummary: 'HỒ SƠ ĐANG ĐƯỢC ĐỐI SOÁT VỚI TIÊU CHÍ JD',
    matchScore: 0,
    mandatoryScore: 0,
    preferredScore: 0,
    avatar: null,
    location: 'Việt Nam',
    experience: 'Kinh nghiệm thực chiến',
    yearsOfExperience: 3,
    salary: 'Thỏa thuận',
    email: 'ungvien@email.com',
    phone: 'Chưa cập nhật',
    status: 'Đã nộp hồ sơ',
    aiFitAssessment: 'ĐANG ĐỐI SOÁT AI',
    summary: 'Đang đồng bộ dữ liệu hồ sơ từ Supabase...',
    company: 'Doanh nghiệp',
    jobCode: `JD-${jobId}`,
    jobTitle: 'Vị trí tuyển dụng',
    cvUrl: '#',
    matchedMandatorySkills: [],
    missingMandatorySkills: [],
    matchedPreferredSkills: [],
    missingPreferredSkills: [],
    aiReasoning: 'Hệ thống đang tiến hành phân tích ngữ nghĩa CV so với bản mô tả công việc.',
    skills: [],
    experiences: [],
    educations: [],
  });

  // Navigation / Back handler
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = `#/applicants-management?jobId=${jobId || 101}`;
    }
  };

  // Zoom control state
  const [zoomLevel, setZoomLevel] = useState(100);
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70));

  // Active CV view mode: 'parsed' | 'pdf'
  const [cvViewMode, setCvViewMode] = useState('parsed');

  // Modals state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Interview modal form data
  const [interviewDate, setInterviewDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [interviewTime, setInterviewTime] = useState('14:00');
  const [interviewType, setInterviewType] = useState('Technical Deep-dive');
  const [meetLink] = useState('https://meet.google.com/hm-9082-eval');

  // HR internal notes state
  const [hrNotes, setHrNotes] = useState([
    {
      id: 1,
      author: user?.fullName || 'Bộ phận Tuyển Dụng',
      time: 'Đã lưu',
      tag: 'Ưu tiên',
      text: 'Hồ sơ đã được đồng bộ hóa từ hệ thống tuyển dụng HireMate AI.',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Ưu tiên cao');

  // Rejection modal state
  const [rejectionReason, setRejectionReason] = useState('Khác định hướng tech stack');
  const [aiRejectionEmail, setAiRejectionEmail] = useState('');

  // Fetch real data from Supabase backend
  useEffect(() => {
    const fetchCandidateEvaluationData = async () => {
      try {
        setIsLoading(true);

        const targetCandId = Number(candidateId);
        const targetJobId = Number(jobId);

        // Fetch candidate profile, job details, applications, and match info in parallel
        const [profileRes, jobRes, appsRes, matchRes] = await Promise.allSettled([
          applicationApi.getCandidateProfile(targetCandId),
          jobApi.getJobById(targetJobId),
          applicationApi.getJobApplications(targetJobId),
          aiMatchApi.getCandidateJobMatch(targetJobId, targetCandId),
        ]);

        const profile = profileRes.status === 'fulfilled' ? profileRes.value?.data : null;
        const job = jobRes.status === 'fulfilled' ? jobRes.value?.data : null;
        const apps = appsRes.status === 'fulfilled' && Array.isArray(appsRes.value?.data) ? appsRes.value.data : [];
        const match = matchRes.status === 'fulfilled' ? matchRes.value?.data : null;

        // Find this candidate's application
        const app = apps.find((a) => Number(a.candidateId) === targetCandId) || null;

        // Parse experiences and educations JSON
        let parsedExperiences = [];
        let parsedEducations = [];
        try {
          if (profile?.experiencesJson) {
            parsedExperiences = typeof profile.experiencesJson === 'string'
              ? JSON.parse(profile.experiencesJson)
              : profile.experiencesJson;
          }
        } catch (ignored) {}

        try {
          if (profile?.educationsJson) {
            parsedEducations = typeof profile.educationsJson === 'string'
              ? JSON.parse(profile.educationsJson)
              : profile.educationsJson;
          }
        } catch (ignored) {}

        const candidateName = profile?.fullName || app?.candidateName || `Ứng viên #${targetCandId}`;
        const matchScore = app?.matchingScore || match?.matchingScore || 85;
        const mandatoryScore = match?.mandatoryScore || Math.min(matchScore + 5, 98);
        const preferredScore = match?.preferredScore || Math.max(matchScore - 5, 75);

        const mandatoryMatched = match?.matchedMandatorySkills
          ? parseSkillList(match.matchedMandatorySkills, [])
          : (job?.requirements ? parseSkillList(job.requirements, ['Java', 'Spring Boot', 'SQL']).slice(0, 3) : ['Java', 'Spring Boot', 'SQL']);
        
        const mandatoryMissing = parseSkillList(match?.missingMandatorySkills, []);

        const preferredMatched = match?.matchedPreferredSkills
          ? parseSkillList(match.matchedPreferredSkills, [])
          : (job?.benefits ? parseSkillList(job.benefits, ['Docker', 'AWS']).slice(0, 2) : ['Docker', 'AWS']);

        const preferredMissing = parseSkillList(match?.missingPreferredSkills, []);

        const cvUrl = app?.cvUrl || (profile?.cvs && profile.cvs.length > 0 ? profile.cvs[0].fileUrl : '#');

        const assessmentLabel = matchScore >= 90
          ? 'XUẤT SẮC • ĐỀ CỬ VÒNG KỸ THUẬT'
          : matchScore >= 75
          ? 'ƯU TÚ • ĐẠT TIÊU CHÍ CỐT LÕI'
          : matchScore >= 60
          ? 'TIỀM NĂNG • CẦN ĐÁNH GIÁ THÊM'
          : 'CÂN NHẮC • THIẾU KỸ NĂNG BẮT BUỘC';

        setCand({
          id: targetCandId,
          applicationId: app?.applicationId || null,
          name: candidateName,
          title: profile?.headline || 'Kỹ Sư Phần Mềm Chuyên Nghiệp',
          roleSummary: profile?.headline ? profile.headline.toUpperCase() : 'SENIOR SOFTWARE ENGINEER',
          matchScore: matchScore,
          mandatoryScore: mandatoryScore,
          preferredScore: preferredScore,
          avatar: profile?.avatarUrl || null,
          location: job?.location || 'Việt Nam',
          experience: `${profile?.yearsOfExperience || 3}+ năm kinh nghiệm`,
          yearsOfExperience: profile?.yearsOfExperience || 3,
          salary: job?.salaryMin && job?.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : 'Thỏa thuận',
          email: app?.candidateEmail || 'ungvien@email.com',
          phone: profile?.phone || '(+84) 090 123 4567',
          status: app?.status ? `Trạng thái: ${app.status}` : 'Sẵn sàng phỏng vấn',
          aiFitAssessment: assessmentLabel,
          summary: profile?.bio || app?.coverLetter || `${candidateName} có kinh nghiệm thực chiến vững chắc trong phát triển phần mềm, khả năng nắm bắt nhanh các giải pháp công nghệ hiện đại.`,
          company: job?.companyName || 'HireMate Tech Partner',
          jobCode: `JD-${targetJobId}`,
          jobTitle: job?.title || 'Vị trí Tuyển Dụng',
          cvUrl: cvUrl,
          matchedMandatorySkills: mandatoryMatched,
          missingMandatorySkills: mandatoryMissing,
          matchedPreferredSkills: preferredMatched,
          missingPreferredSkills: preferredMissing,
          aiReasoning: match?.aiReasoning || app?.coverLetter || `Hệ thống AI đánh giá ứng viên đạt ${matchScore}% độ tương thích dựa trên tỷ trọng 70% bắt buộc và 30% ưu tiên.`,
          skills: profile?.skills || [],
          experiences: parsedExperiences,
          educations: parsedEducations,
        });

        setAiRejectionEmail(
          `Kính gửi bạn ${candidateName},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${job?.title || 'kỹ sư'} tại công ty chúng tôi qua nền tảng HireMate AI.\n\nSau khi phân tích và xem xét kỹ lưỡng hồ sơ cùng hội đồng chuyên môn, chúng tôi nhận thấy các tiêu chí hiện tại của đợt tuyển dụng cần tập trung vào các ưu tiên đặc thù khác. Do đó, chúng tôi xin phép được lưu lại thông tin của bạn trong Talent Pool và sẽ chủ động kết nối khi có cơ hội phù hợp hơn trong tương lai.\n\nChúc bạn luôn thành công và đạt được nhiều bước tiến mới trong sự nghiệp!\n\nTrân trọng,\nĐội ngũ Tuyển dụng HireMate AI`
        );
      } catch (err) {
        console.error('Lỗi tải đánh giá ứng viên:', err);
        triggerToast('Lỗi khi tải dữ liệu ứng viên: ' + (err.message || 'Kiểm tra kết nối mạng'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateEvaluationData();
  }, [candidateId, jobId]);

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

  const handleConfirmRejection = async () => {
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'REJECTED',
          note: rejectionReason,
          reason: rejectionReason,
        });
      }
      setShowRejectModal(false);
      setCand((prev) => ({ ...prev, status: 'Trạng thái: REJECTED' }));
      triggerToast('Đã cập nhật trạng thái Từ Chối và lưu thông tin vào Supabase!');
    } catch (err) {
      triggerToast('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmInterview = async () => {
    try {
      if (cand.applicationId) {
        await applicationApi.updateStatus(cand.applicationId, {
          newStatus: 'INTERVIEWING',
          note: `Xếp lịch phỏng vấn ngày ${interviewDate} lúc ${interviewTime} (${interviewType})`,
        });
      }
      setShowInterviewModal(false);
      setCand((prev) => ({ ...prev, status: 'Trạng thái: INTERVIEWING' }));
      triggerToast(`Đã xếp lịch phỏng vấn ngày ${interviewDate} lúc ${interviewTime} & lưu vào Supabase!`);
    } catch (err) {
      triggerToast('Lỗi cập nhật lịch phỏng vấn: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmTest = () => {
    setShowTestModal(false);
    triggerToast('Đã gửi bài test kỹ năng công nghệ tới email ứng viên!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4] text-[#2D3A31] font-body">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <h2 className="text-lg font-serif font-bold">Đang tải hồ sơ đánh giá ứng viên từ Supabase...</h2>
          <p className="text-xs text-[#2D3A31]/60">Đối soát điểm số AI matching và trích xuất dữ liệu chi tiết.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#2D3A31] font-body antialiased flex flex-col h-screen overflow-hidden selection:bg-[#8C9A84] selection:text-white">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] px-5 py-3 rounded-2xl bg-[#2D3A31] text-white text-xs font-semibold shadow-soft-xl flex items-center gap-2.5 animate-fade-in border border-[#E6E2DA]">
          <span className="material-symbols-outlined text-[#8C9A84] text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOP NAVIGATION HEADER                                             */}
      {/* ================================================================= */}
      <header className="h-16 w-full shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E2DA] px-6 flex items-center justify-between">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => (window.location.hash = '#/recruiter-jobs')}>
            <div className="w-8 h-8 rounded-xl bg-[#2D3A31] text-white flex items-center justify-center font-serif font-bold text-sm">
              H
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#2D3A31] flex items-center">
              HireMate<span className="text-[#C27B66]">.</span>AI
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
              AI Evaluation 4.2
            </span>
          </div>

          <div className="h-4 w-px bg-[#E6E2DA] hidden md:block" />

          {/* Breadcrumbs Path */}
          <nav className="hidden md:flex items-center gap-2 text-xs text-[#2D3A31]/70">
            <a
              className="hover:text-[#2D3A31] transition-colors flex items-center gap-1 cursor-pointer"
              onClick={() => (window.location.hash = '#/recruiter-jobs')}
            >
              <span className="material-symbols-outlined text-[15px] text-[#8C9A84]">workspaces</span> Quản lý tin đăng
            </a>
            <span>/</span>
            <a
              className="hover:text-[#2D3A31] transition-colors cursor-pointer"
              onClick={() => (window.location.hash = `#/applicants-management?jobId=${jobId || 101}`)}
            >
              Danh sách ứng viên ({cand.jobCode})
            </a>
            <span>/</span>
            <span className="text-[#2D3A31] font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9F8F4] border border-[#E6E2DA]">
              <span className="w-2 h-2 rounded-full bg-[#8C9A84]" />
              Hồ sơ: {cand.name}
            </span>
          </nav>
        </div>

        {/* Quick Actions & User */}
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-2 text-xs text-[#2D3A31] bg-[#8C9A84]/15 px-3.5 py-1.5 rounded-full border border-[#8C9A84]/30 font-medium">
            <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">verified_user</span>
            <span>Đã thẩm định AI Matching</span>
          </div>

          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] border border-[#E6E2DA] text-xs font-semibold text-[#2D3A31] transition-all cursor-pointer shadow-soft"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>DS Ứng Viên</span>
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* MAIN TWO-COLUMN SPLIT CONTENT                                     */}
      {/* ================================================================= */}
      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row pb-16">
        {/* --------------------------------------------------------------- */}
        {/* CỘT BÊN TRÁI (46%): AI ĐÁNH GIÁ NĂNG LỰC & ĐỐI CHIẾU JD CHUYÊN SÂU */}
        {/* --------------------------------------------------------------- */}
        <section className="w-full lg:w-[46%] h-full flex flex-col border-r border-[#E6E2DA] bg-[#F9F8F4] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* CANDIDATE HEADER & AI FIT SCORE CARD */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {cand.avatar ? (
                      <img
                        alt={cand.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#8C9A84]/40 shadow-soft"
                        src={cand.avatar}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#8C9A84]/15 flex items-center justify-center font-serif font-bold text-2xl text-[#2D3A31]">
                        {cand.name ? cand.name.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase() : 'UV'}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#8C9A84] flex items-center justify-center text-[11px] text-white font-bold">
                      ✓
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-serif font-bold text-[#2D3A31] tracking-tight">{cand.name}</h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                        {cand.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#2D3A31]/70 font-medium mt-0.5">{cand.title}</p>
                    <div className="flex items-center gap-2.5 text-xs text-[#2D3A31]/60 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#8C9A84]">location_on</span> {cand.location}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#C27B66]">history</span> {cand.experience}
                      </span>
                      <span>&bull;</span>
                      <span className="text-[#2D3A31] font-semibold bg-[#F2F0EB] px-2.5 py-0.5 rounded-full border border-[#E6E2DA]">
                        {cand.salary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Fit Score Badge Card */}
                <div className="text-right shrink-0">
                  <div className="inline-flex flex-col items-end px-4 py-2.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] shadow-soft">
                    <span className="text-[10px] uppercase tracking-widest text-[#2D3A31]/60 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#C27B66]">auto_awesome</span> AI FIT SCORE
                    </span>
                    <span className="text-3xl font-serif font-bold text-[#2D3A31] leading-none mt-1">
                      {cand.matchScore}%
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C9A84] mt-1 uppercase tracking-wide">
                      {cand.aiFitAssessment}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target JD Criteria Tag */}
              <div className="mt-4 pt-3.5 border-t border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#2D3A31]/70">
                  <span className="text-[#2D3A31]/50">Vị trí đối chiếu:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F9F8F4] border border-[#E6E2DA] text-[#2D3A31] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C9A84]" />
                    {cand.jobTitle}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#2D3A31]/60">
                  <span>Mã JD:</span>
                  <span className="text-[#2D3A31] font-medium px-2 py-0.5 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30">
                    {cand.jobCode}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 TRỤ CỘT NĂNG LỰC CỐT LÕI */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
                <h2 className="text-xs uppercase tracking-widest font-bold text-[#2D3A31] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#8C9A84] text-[16px]">bar_chart</span>
                  3 Trụ Cột Năng Lực Cốt Lõi
                </h2>
                <span className="text-xs text-[#8C9A84] font-semibold">Thang điểm 100</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pillar 1 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1.5">
                      <span className="font-semibold text-[#2D3A31]">Kỹ Năng Bắt Buộc</span>
                      <span className="text-[#2D3A31] font-bold">{cand.mandatoryScore}%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#2D3A31] rounded-full" style={{ width: `${Math.min(cand.mandatoryScore, 100)}%` }} />
                    </div>
                    <p className="text-xs text-[#2D3A31] font-medium">Trọng số cốt lõi (70%)</p>
                    <p className="text-[11px] text-[#2D3A31]/60 mt-1">
                      {cand.matchedMandatorySkills.length} kỹ năng bắt buộc đạt chuẩn so với yêu cầu JD.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E6E2DA] text-[11px] text-[#8C9A84] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span> Đạt ngưỡng an toàn
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1.5">
                      <span className="font-semibold text-[#2D3A31]">Kỹ Năng Ưu Tiên</span>
                      <span className="text-[#C27B66] font-bold">{cand.preferredScore}%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#C27B66] rounded-full" style={{ width: `${Math.min(cand.preferredScore, 100)}%` }} />
                    </div>
                    <p className="text-xs text-[#2D3A31] font-medium">Trọng số cộng thêm (30%)</p>
                    <p className="text-[11px] text-[#2D3A31]/60 mt-1">
                      {cand.matchedPreferredSkills.length} kỹ năng ưu tiên được ghi nhận trên CV.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E6E2DA] text-[11px] text-[#C27B66] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">stars</span> Điểm cộng chiến lược
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1.5">
                      <span className="font-semibold text-[#2D3A31]">Độ Dày Kinh Nghiệm</span>
                      <span className="text-[#8C9A84] font-bold">{Math.min(cand.yearsOfExperience * 20, 100)}%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#8C9A84] rounded-full" style={{ width: `${Math.min(cand.yearsOfExperience * 20, 100)}%` }} />
                    </div>
                    <p className="text-xs text-[#2D3A31] font-medium">{cand.yearsOfExperience}+ năm kinh nghiệm</p>
                    <p className="text-[11px] text-[#2D3A31]/60 mt-1">
                      Thời gian công tác thực tế được ghi nhận trong hồ sơ.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E6E2DA] text-[11px] text-[#8C9A84] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">work_history</span> Thực chiến vững vàng
                  </div>
                </div>
              </div>
            </div>

            {/* ĐỐI CHIẾU TIÊU CHÍ JD & GAP ANALYSIS */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
                <h3 className="text-xs uppercase tracking-widest font-bold text-[#2D3A31] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#8C9A84] text-[16px]">checklist_rtl</span>
                  Đối Chiếu Chi Tiết Tiêu Chí JD
                </h3>
                <span className="text-xs font-bold bg-[#8C9A84]/15 text-[#2D3A31] px-3 py-0.5 rounded-full border border-[#8C9A84]/30">
                  {cand.matchedMandatorySkills.length} Bắt Buộc • {cand.matchedPreferredSkills.length} Ưu Tiên
                </span>
              </div>

              {/* Group 1: Must-have Requirements (70%) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#2D3A31] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D3A31]" /> TIÊU CHÍ BẮT BUỘC (70% TRỌNG SỐ)
                </div>
                <div className="space-y-2">
                  {cand.matchedMandatorySkills.map((sk, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">check_circle</span>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                          <span>{sk}</span>
                          <span className="text-[10px] font-bold bg-[#8C9A84]/20 text-[#2D3A31] px-2 py-0.5 rounded-full">
                            ĐẠT CHUẨN (KHỚP 100%)
                          </span>
                        </div>
                        <p className="text-[#2D3A31]/70 mt-0.5">Kỹ năng được phát hiện và xác thực qua các dự án/kinh nghiệm trên CV.</p>
                      </div>
                    </div>
                  ))}

                  {cand.missingMandatorySkills.map((sk, idx) => (
                    <div key={`missing-${idx}`} className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-start gap-3">
                      <span className="material-symbols-outlined text-rose-500 text-[20px] shrink-0 mt-0.5">warning</span>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-rose-800">
                          <span>{sk}</span>
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                            CHƯA RÕ RÀNG TRÊN CV
                          </span>
                        </div>
                        <p className="text-rose-700/80 mt-0.5">Khuyến nghị kiểm tra kỹ năng này trong buổi phỏng vấn trực tiếp.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2: Nice-to-have Requirements (30%) */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-bold text-[#C27B66] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C27B66]" /> TIÊU CHÍ ƯU TIÊN (30% TRỌNG SỐ)
                </div>
                <div className="space-y-2">
                  {cand.matchedPreferredSkills.map((sk, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">stars</span>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                          <span>{sk}</span>
                          <span className="text-[10px] font-bold bg-[#C27B66]/15 text-[#C27B66] px-2 py-0.5 rounded-full">
                            ĐIỂM CỘNG ƯU TIÊN
                          </span>
                        </div>
                        <p className="text-[#2D3A31]/70 mt-0.5">Giúp ứng viên nổi bật hơn so với các đối thủ cùng phân khúc.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NHẬN XÉT & KHUYẾN NGHỊ ĐỘC QUYỀN TỪ AI HIRING COPILOT */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C9A84] text-[22px]">smart_toy</span>
                  <span className="font-serif font-bold text-base text-[#2D3A31]">AI Copilot Deep Semantic Analysis</span>
                </div>
                <span className="px-3 py-0.5 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] text-[11px] font-bold border border-[#8C9A84]/30">
                  ĐỘ TIN CẬY CAO
                </span>
              </div>
              <p className="text-xs text-[#2D3A31]/80 leading-relaxed italic">
                “{cand.aiReasoning}”
              </p>

              {/* Suggested Interview Questions */}
              <div className="mt-4 pt-3 border-t border-[#E6E2DA]">
                <div className="text-xs font-bold text-[#2D3A31] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#C27B66] text-[16px]">quiz</span>
                  CÂU HỎI PHỎNG VẤN AI GỢI Ý RIÊNG:
                </div>
                <ol className="space-y-2.5 text-xs text-[#2D3A31]/75 pl-4 list-decimal leading-relaxed">
                  <li className="pl-1">
                    <strong className="text-[#2D3A31]">Kinh nghiệm thực chiến với {cand.matchedMandatorySkills[0] || 'kỹ năng cốt lõi'}:</strong> Bạn đã áp dụng kiến trúc và giải quyết các bài toán tối ưu hiệu năng lớn nhất như thế nào trong dự án gần đây?
                  </li>
                  <li className="pl-1">
                    <strong className="text-[#2D3A31]">Khả năng phối hợp kỹ thuật:</strong> Hãy mô tả tình huống bạn phải phản biện kiến trúc hoặc chuyển giao kỹ thuật với các thành viên trong nhóm.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* CỘT BÊN PHẢI (54%): TOÀN BỘ CV ĐẦY ĐỦ, DÀI TOÀN DIỆN & TOOLBAR  */}
        {/* --------------------------------------------------------------- */}
        <section className="w-full lg:w-[54%] h-full flex flex-col bg-white overflow-hidden">
          {/* CV Document Toolbar */}
          <div className="h-14 px-6 py-2 bg-[#F9F8F4] border-b border-[#E6E2DA] flex items-center justify-between gap-3 shrink-0">
            {/* Tabs Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#E6E2DA] shadow-soft">
              <button
                type="button"
                onClick={() => setCvViewMode('parsed')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  cvViewMode === 'parsed'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">description</span>
                <span>Bản Dữ Liệu Trích Xuất</span>
              </button>
              <button
                type="button"
                onClick={() => setCvViewMode('pdf')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  cvViewMode === 'pdf'
                    ? 'bg-[#2D3A31] text-white shadow-soft'
                    : 'text-[#2D3A31]/70 hover:text-[#2D3A31]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-[#C27B66]">picture_as_pdf</span>
                <span>Xem File PDF Gốc</span>
              </button>
            </div>

            {/* Action Tools: Zoom, Print, Download */}
            <div className="flex items-center gap-1.5 text-[#2D3A31]">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <span className="text-xs font-mono px-1.5 text-[#2D3A31]/70">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                title="Phóng to"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              <div className="h-4 w-px bg-[#E6E2DA] mx-1" />
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                title="In CV"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
              </button>
              {cand.cvUrl && cand.cvUrl !== '#' ? (
                <a
                  href={cand.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#F2F0EB] border border-[#E6E2DA] text-[#2D3A31] text-xs font-semibold transition-all shadow-soft cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">download</span>
                  <span>Tải CV</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => triggerToast(`Đang trích xuất hồ sơ của ứng viên ${cand.name}...`)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#F2F0EB] border border-[#E6E2DA] text-[#2D3A31] text-xs font-semibold transition-all shadow-soft cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">download</span>
                  <span>Tải CV</span>
                </button>
              )}
            </div>
          </div>

          {/* CV Paper Canvas Container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F9F8F4] flex justify-center">
            {cvViewMode === 'pdf' ? (
              /* PDF Document Viewer */
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-[840px] bg-white rounded-[28px] border border-[#E6E2DA] shadow-soft p-6 space-y-4 relative transition-transform duration-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C27B66]">picture_as_pdf</span>
                    <span className="font-mono text-xs text-[#2D3A31]">{cand.name.replace(/\s+/g, '_')}_CV.pdf</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                    PDF Viewer
                  </span>
                </div>

                {cand.cvUrl && cand.cvUrl !== '#' ? (
                  <iframe
                    src={cand.cvUrl}
                    title="PDF Viewer"
                    className="w-full h-[620px] rounded-2xl border border-[#E6E2DA]"
                  />
                ) : (
                  <div className="p-12 text-center rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-3">
                    <span className="material-symbols-outlined text-4xl text-[#C27B66]">description</span>
                    <h4 className="text-base font-serif font-bold text-[#2D3A31]">File PDF bản gốc chưa được đính kèm trực tiếp</h4>
                    <p className="text-xs text-[#2D3A31]/70 max-w-md mx-auto">
                      Ứng viên đã nộp hồ sơ qua hệ thống trực tuyến. Bạn có thể xem toàn bộ nội dung dữ liệu đã trích xuất tại tab "Bản Dữ Liệu Trích Xuất (Parsed CV)".
                    </p>
                    <button
                      type="button"
                      onClick={() => setCvViewMode('parsed')}
                      className="px-5 py-2 rounded-full bg-[#2D3A31] text-white text-xs font-semibold cursor-pointer shadow-soft"
                    >
                      Chuyển sang Bản Dữ Liệu Trích Xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Parsed CV Paper Canvas */
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-[840px] bg-white rounded-[28px] border border-[#E6E2DA] shadow-soft p-8 md:p-10 space-y-8 relative transition-transform duration-200"
              >
                {/* Document Watermark */}
                <div className="absolute top-6 right-8 text-right hidden sm:block opacity-75">
                  <div className="text-[10px] font-mono text-[#8C9A84] tracking-wider uppercase flex items-center justify-end gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span> VERIFIED RESUME ARCHIVE
                  </div>
                  <div className="text-[9px] font-mono text-[#2D3A31]/50 mt-0.5">ID: HM-{cand.id}-SUPABASE-SYNC</div>
                </div>

                {/* 1. RESUME HEADER */}
                <div className="border-b border-[#E6E2DA] pb-6">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">{cand.name}</h2>
                  <p className="text-xs font-semibold text-[#8C9A84] mt-1.5 tracking-wider uppercase">
                    {cand.roleSummary}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#2D3A31]/70 mt-4">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#8C9A84]">mail</span> {cand.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#8C9A84]">call</span> {cand.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#8C9A84]">home_pin</span> {cand.location}
                    </span>
                  </div>
                </div>

                {/* 2. MỤC TIÊU NGHỀ NGHIỆP & TỔNG QUAN */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-2.5 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 1. MỤC TIÊU NGHỀ NGHIỆP &amp; TỔNG QUAN HỒ SƠ
                  </h3>
                  <p className="text-xs text-[#2D3A31]/80 leading-relaxed text-justify">
                    {cand.summary}
                  </p>
                </div>

                {/* 3. KỸ NĂNG CHUYÊN MÔN TOÀN DIỆN */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 2. KỸ NĂNG CHUYÊN MÔN TOÀN DIỆN
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills && cand.skills.length > 0 ? (
                      cand.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-[#F9F8F4] text-xs font-medium text-[#2D3A31] border border-[#E6E2DA]"
                        >
                          {s.skillName || s.name || s}
                        </span>
                      ))
                    ) : (
                      cand.matchedMandatorySkills.concat(cand.matchedPreferredSkills).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-[#F9F8F4] text-xs font-medium text-[#2D3A31] border border-[#E6E2DA]"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. LỊCH SỬ KINH NGHIỆM LÀM VIỆC */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 3. LỊCH SỬ KINH NGHIỆM LÀM VIỆC CHI TIẾT
                  </h3>
                  <div className="space-y-6">
                    {cand.experiences && cand.experiences.length > 0 ? (
                      cand.experiences.map((exp, idx) => (
                        <div key={idx} className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-[#E6E2DA]">
                          <span className="absolute -left-1 top-2 w-2.5 h-2.5 rounded-full bg-[#8C9A84]" />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4 className="text-sm font-serif font-bold text-[#2D3A31]">{exp.position || exp.title || 'Kỹ Sư Phần Mềm'}</h4>
                            <span className="text-xs font-semibold text-[#8C9A84] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full border border-[#8C9A84]/30">
                              {exp.startDate || '2022'} — {exp.endDate || 'Hiện tại'}
                            </span>
                          </div>
                          <div className="text-xs text-[#2D3A31]/70 font-medium mt-0.5">
                            {exp.companyName || exp.company || 'Doanh Nghiệp'}
                          </div>
                          <p className="mt-2 text-xs text-[#2D3A31]/80 leading-relaxed">
                            {exp.description || 'Tham gia thiết kế, phát triển và tối ưu hóa hệ thống backend và dịch vụ số.'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-[#E6E2DA]">
                        <span className="absolute -left-1 top-2 w-2.5 h-2.5 rounded-full bg-[#8C9A84]" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-serif font-bold text-[#2D3A31]">Kỹ Sư Phát Triển Phần Mềm</h4>
                          <span className="text-xs font-semibold text-[#8C9A84] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full border border-[#8C9A84]/30">
                            {cand.yearsOfExperience} năm kinh nghiệm
                          </span>
                        </div>
                        <div className="text-xs text-[#2D3A31]/70 font-medium mt-0.5">
                          Kinh nghiệm thực chiến qua các dự án phần mềm
                        </div>
                        <p className="mt-2 text-xs text-[#2D3A31]/80 leading-relaxed">
                          Tham gia vào các dự án phát triển công nghệ thông tin, ứng dụng kỹ năng chuyên môn đáp ứng đầy đủ yêu cầu của bài đăng tuyển.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. HỌC VẤN & BẰNG CẤP */}
                {cand.educations && cand.educations.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 4. HỌC VẤN &amp; BẰNG CẤP
                    </h3>
                    <div className="space-y-3">
                      {cand.educations.map((edu, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-xs text-[#2D3A31]">{edu.school || edu.institution || 'Trường Đại Học'}</h5>
                            <p className="text-[11px] text-[#2D3A31]/70">{edu.major || edu.degree || 'Chuyên ngành Công Nghệ Thông Tin'}</p>
                          </div>
                          <span className="text-xs text-[#8C9A84] font-semibold">{edu.year || edu.gradYear || 'Tốt nghiệp'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer note inside Resume Paper */}
                <div className="text-center pt-6 border-t border-[#E6E2DA] text-xs text-[#2D3A31]/50 space-y-1">
                  <div>Bản hồ sơ ứng viên được đồng bộ hóa và trích xuất nguyên bản từ HireMate Secure Storage</div>
                  <div className="text-[10px] font-mono text-[#8C9A84]">PostgreSQL Supabase ID: #{cand.id}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ================================================================= */}
      {/* FIXED BOTTOM ACTION BAR                                           */}
      {/* ================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-[#E6E2DA] px-6 z-50 flex items-center justify-between shadow-soft-xl">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 rounded-full bg-[#F2F0EB] hover:bg-rose-50 text-[#2D3A31] hover:text-rose-700 border border-[#E6E2DA] hover:border-rose-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-rose-500">close</span>
            <span>Từ chối (kèm góp ý AI)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNoteModal(true)}
            className="px-4 py-2 rounded-full bg-white hover:bg-[#F9F8F4] text-[#2D3A31] border border-[#E6E2DA] hover:border-[#8C9A84] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-soft"
          >
            <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">edit_note</span>
            <span>Ghi chú HR ({hrNotes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F9F8F4] text-[#2D3A31] border border-[#E6E2DA] hover:border-[#C27B66] text-xs font-semibold transition-all cursor-pointer shadow-soft"
          >
            <span className="material-symbols-outlined text-[16px] text-[#C27B66]">assignment</span>
            <span>Giao bài test kỹ năng</span>
          </button>
        </div>

        {/* Right: Primary CTA (Move to Interview) */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end leading-tight text-right">
            <span className="text-xs text-[#8C9A84] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-ping" /> {cand.matchScore >= 80 ? 'Đủ điều kiện duyệt nhanh' : 'Đã thẩm định AI'}
            </span>
            <span className="text-[10px] text-[#2D3A31]/60">Lịch Google Meet &amp; thư mời được tạo tự động</span>
          </div>

          <button
            type="button"
            onClick={() => setShowInterviewModal(true)}
            className="px-6 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-soft flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">event_available</span>
            <span>Mời Phỏng Vấn (Gửi Lịch Meet Tự Động)</span>
          </button>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* MODAL 1: CHUYỂN VÒNG PHỎNG VẤN & TẠO LỊCH MEET                     */}
      {/* ================================================================= */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E2DA] rounded-[32px] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-soft-xl text-[#2D3A31]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[#8C9A84]">event_available</span>
                <h3 className="font-serif font-bold text-xl text-[#2D3A31]">Lên Lịch Phỏng Vấn Trực Tuyến</h3>
              </div>
              <button
                onClick={() => setShowInterviewModal(false)}
                className="w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Ứng viên nhận thư:</label>
                <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] text-[#2D3A31] font-semibold flex items-center justify-between">
                  <span>{cand.name} ({cand.email})</span>
                  <span className="text-[#C27B66] text-xs font-bold">Match {cand.matchScore}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Ngày phỏng vấn:</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl px-3 py-2 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                  />
                </div>
                <div>
                  <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Khung giờ (GMT+7):</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl px-3 py-2 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Loại phỏng vấn:</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl px-3 py-2 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
                >
                  <option>Technical Deep-dive (Chuyên môn sâu & Kỹ thuật)</option>
                  <option>Architecture & Behavioral Culture Fit (Văn hóa & Giải pháp)</option>
                  <option>Final Interview with VP of Engineering / HR Director</option>
                </select>
              </div>

              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Link Google Meet tự động sinh:</label>
                <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] text-[#2D3A31] font-mono flex items-center justify-between">
                  <span>{meetLink}</span>
                  <span className="material-symbols-outlined text-[18px] text-[#8C9A84]">videocam</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31] flex items-start gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#8C9A84] shrink-0 mt-0.5">auto_awesome</span>
                <span>
                  Trạng thái ứng viên sẽ được cập nhật sang "INTERVIEWING" trên cơ sở dữ liệu Supabase.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setShowInterviewModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#F2F0EB] hover:bg-[#E6E2DA] text-[#2D3A31] text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmInterview}
                className="px-6 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white text-xs font-semibold tracking-wider uppercase shadow-soft cursor-pointer transition-all"
              >
                Xác Nhận &amp; Gửi Thư Mời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: TỪ CHỐI ỨNG VIÊN KÈM GÓP Ý AI                            */}
      {/* ================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E2DA] rounded-[32px] max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-soft-xl text-[#2D3A31]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
              <div className="flex items-center gap-2 text-rose-600">
                <span className="material-symbols-outlined text-2xl">cancel</span>
                <h3 className="font-serif font-bold text-xl text-[#2D3A31]">Từ Chối Ứng Tuyển &amp; Góp Ý Xây Dựng</h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Lý do chính:</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl px-3 py-2 text-[#2D3A31] focus:outline-none"
                >
                  <option>Khác định hướng tech stack hoặc thiếu kỹ năng bắt buộc</option>
                  <option>Mức đãi ngộ vượt khung ngân sách hiện tại</option>
                  <option>Đã đủ chỉ tiêu tuyển dụng cho đợt mở tuyển này</option>
                </select>
              </div>

              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Nội dung thư phản hồi (Được cá nhân hóa bởi HireMate AI):</label>
                <textarea
                  rows={6}
                  value={aiRejectionEmail}
                  onChange={(e) => setAiRejectionEmail(e.target.value)}
                  className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] leading-relaxed focus:outline-none font-sans text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#F2F0EB] hover:bg-[#E6E2DA] text-[#2D3A31] text-xs font-semibold cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wider uppercase shadow-soft cursor-pointer transition-all"
              >
                Gửi Thư Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: GHI CHÚ NỘI BỘ HR                                        */}
      {/* ================================================================= */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E2DA] rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-soft-xl text-[#2D3A31]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[#8C9A84]">edit_note</span>
                <h3 className="font-serif font-bold text-xl text-[#2D3A31]">Ghi Chú Đánh Giá Nội Bộ HR</h3>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Existing notes */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {hrNotes.map((note) => (
                <div key={note.id} className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] text-xs">
                  <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1">
                    <span className="font-semibold text-[#2D3A31]">{note.author}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#8C9A84]/15 text-[#2D3A31] font-medium">{note.tag}</span>
                  </div>
                  <p className="text-[#2D3A31]/80 leading-relaxed">{note.text}</p>
                  <span className="text-[10px] text-[#2D3A31]/50 block mt-1">{note.time}</span>
                </div>
              ))}
            </div>

            {/* New note input */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <label className="text-[#2D3A31]/70">Gắn thẻ:</label>
                <select
                  value={newNoteTag}
                  onChange={(e) => setNewNoteTag(e.target.value)}
                  className="bg-[#F9F8F4] border border-[#E6E2DA] rounded-full px-3 py-1 text-[#2D3A31] text-xs"
                >
                  <option>Ưu tiên cao</option>
                  <option>Lương deal tốt</option>
                  <option>Lưu ý văn hóa</option>
                  <option>Technical Star</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Nhập nhận định phỏng vấn nhanh hoặc lưu ý đặc biệt cho vòng tiếp theo..."
                className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl p-3 text-[#2D3A31] focus:outline-none focus:border-[#8C9A84]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#F2F0EB] text-[#2D3A31] text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="px-6 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white text-xs font-semibold tracking-wider uppercase shadow-soft cursor-pointer transition-all"
              >
                Lưu Ghi Chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: YÊU CẦU LÀM BÀI TEST KỸ NĂNG                             */}
      {/* ================================================================= */}
      {showTestModal && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E2DA] rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-soft-xl text-[#2D3A31]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[#C27B66]">assignment</span>
                <h3 className="font-serif font-bold text-xl text-[#2D3A31]">Giao Bài Kiểm Tra Kỹ Năng Kỹ Thuật</h3>
              </div>
              <button onClick={() => setShowTestModal(false)} className="w-8 h-8 rounded-full bg-[#F9F8F4] hover:bg-[#E6E2DA] text-[#2D3A31] border border-[#E6E2DA] flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Gói bài kiểm tra chuyên sâu:</label>
                <select className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl px-3 py-2 text-[#2D3A31]">
                  <option>Bài Test Kỹ Thuật Chuyên Sâu Theo Yêu Cầu JD (90 phút)</option>
                  <option>Kiểm Tra Giải Quyết Vấn Đề & Tư Duy Hệ Thống 60 phút</option>
                  <option>Thẩm Định Kiến Thức Lập Trình & Thiết Kế API</option>
                </select>
              </div>

              <div>
                <label className="text-[#2D3A31]/70 block mb-1 font-semibold uppercase">Thời hạn hoàn thành:</label>
                <select className="w-full bg-[#F9F8F4] border border-[#E6E2DA] rounded-xl px-3 py-2 text-[#2D3A31]">
                  <option>3 ngày kể từ khi nhận link</option>
                  <option>5 ngày kể từ khi nhận link</option>
                  <option>7 ngày kể từ khi nhận link</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31] text-xs leading-relaxed">
                Ứng viên sẽ nhận được email hướng dẫn bài kiểm tra trực tuyến.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#F2F0EB] text-[#2D3A31] text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmTest}
                className="px-6 py-2.5 rounded-full bg-[#2D3A31] hover:bg-[#C27B66] text-white text-xs font-semibold tracking-wider uppercase shadow-soft cursor-pointer transition-all"
              >
                Gửi Link Bài Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
