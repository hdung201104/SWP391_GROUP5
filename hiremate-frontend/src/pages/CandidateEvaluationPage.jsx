import React, { useState } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';

const CANDIDATES_DATA = {
  1: {
    id: 1,
    name: 'Trần Bảo Long',
    title: 'Senior Solutions Engineer / Tech Lead',
    roleSummary: 'SENIOR TECH LEAD / HIGH-LOAD DISTRIBUTED SYSTEMS ARCHITECT',
    matchScore: 94,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    location: 'Hà Nội (Hybrid)',
    experience: '6+ năm kinh nghiệm',
    salary: '$3,200 - $3,500',
    email: 'long.tran@gmail.com',
    phone: '(+84) 912 345 678',
    status: 'Sẵn sàng nhận việc',
    aiFitAssessment: 'XUẤT SẮC • ĐỀ CỬ VÒNG KỸ THUẬT',
    summary: '6+ năm kinh nghiệm kỹ thuật tại các hệ sinh thái tài chính và ngân hàng số chịu tải cực lớn. Chuyên gia giải quyết các bài toán tối ưu JVM, độ trễ mạng và phân vùng dữ liệu Kafka 50k RPS.',
    company: 'FPT Software Alumni',
    jobCode: 'JD-BNK-882'
  },
  2: {
    id: 2,
    name: 'Lê Hoàng Nam',
    title: 'Lead Backend Engineer • VNG Corp',
    roleSummary: 'DISTRIBUTED ARCHITECTURE SPECIALIST & CLOUD NATIVE TECH LEAD',
    matchScore: 89,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    location: 'TP.HCM (Hybrid)',
    experience: '7.5 năm kinh nghiệm',
    salary: '$3,400 - $3,800',
    email: 'nam.lehoang@vng.com.vn',
    phone: '(+84) 903 888 912',
    status: 'Sẵn sàng nhận việc trong 30 ngày',
    aiFitAssessment: 'ƯU TÚ • KHỚP 100% CORE JAVA & AWS ARCH',
    summary: 'Lead Engineer giàu kinh nghiệm tại VNG Corp với nền tảng vững chắc về Microservices, Kafka clustering 85% và chứng chỉ AWS Solutions Architect Professional.',
    company: 'VNG Corp',
    jobCode: 'JD-BNK-882'
  },
  3: {
    id: 3,
    name: 'Nguyễn Quốc Huy',
    title: 'Senior Java Dev • TMA Solutions',
    roleSummary: 'SENIOR JAVA & MICROSERVICES ENTERPRISE SPECIALIST',
    matchScore: 78,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    location: 'Đà Nẵng / Remote',
    experience: '5 năm kinh nghiệm',
    salary: '$2,200 - $2,600',
    email: 'huy.nguyen@tmasolutions.com',
    phone: '(+84) 988 776 543',
    status: 'Đang cân nhắc cơ hội',
    aiFitAssessment: 'KHÁ TỐT • CẦN ĐÁNH GIÁ THÊM VỀ KAFKA',
    summary: 'Chuyên viên kỹ thuật 5 năm kinh nghiệm tại TMA Solutions. Nắm chắc Java Core, Spring Boot, Spring Cloud; cần kiểm tra sâu về Kafka clustering và khả năng chịu tải cao.',
    company: 'TMA Solutions',
    jobCode: 'JD-BNK-882'
  },
  4: {
    id: 4,
    name: 'Đỗ Minh Tuấn',
    title: 'Java Backend Developer • CMC Global',
    roleSummary: 'JAVA BACKEND & API INTEGRATION DEVELOPER',
    matchScore: 65,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    location: 'Hà Nội',
    experience: '3.5 năm kinh nghiệm',
    salary: '$1,600 - $2,000',
    email: 'tuan.do@cmcglobal.com.vn',
    phone: '(+84) 977 123 456',
    status: 'Sẵn sàng phỏng vấn',
    aiFitAssessment: 'TIỀM NĂNG • PHÙ HỢP CẤP ĐỘ MID-LEVEL',
    summary: 'Lập trình viên backend 3.5 năm kinh nghiệm, thế mạnh Java Spring, MySQL và Redis caching cơ bản. Cần bổ sung kiến thức về Event-Driven Architecture.',
    company: 'CMC Global',
    jobCode: 'JD-BNK-882'
  }
};

export default function CandidateEvaluationPage({ user, candidateId = 1, jobId = 101, onBack }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const targetCandId = Number(candidateId) || 1;
  const cand = CANDIDATES_DATA[targetCandId] || CANDIDATES_DATA[1];

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
  const [interviewDate, setInterviewDate] = useState('2025-09-29');
  const [interviewTime, setInterviewTime] = useState('09:30');
  const [interviewType, setInterviewType] = useState('Technical Deep-dive');
  const [meetLink] = useState('https://meet.google.com/hm-9082-eval');

  // HR internal notes state
  const [hrNotes, setHrNotes] = useState([
    {
      id: 1,
      author: 'Nguyễn Minh Anh (TA Lead)',
      time: '25/09 15:10',
      tag: 'Ưu tiên cao',
      text: 'Ứng viên cực kỳ tiềm năng, kỹ năng xử lý hệ thống 50k RPS rất hiếm trên thị trường. Sẵn sàng match mức lương $3,500.',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Ưu tiên cao');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    setHrNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: user?.fullName || 'Nguyễn Minh Anh (TA Lead)',
        time: 'Vừa xong',
        tag: newNoteTag,
        text: newNoteText.trim(),
      },
    ]);
    setNewNoteText('');
    setShowNoteModal(false);
    triggerToast('Đã lưu ghi chú nội bộ HR thành công!');
  };

  // Rejection modal state
  const [rejectionReason, setRejectionReason] = useState('Khác định hướng tech stack');
  const [aiRejectionEmail, setAiRejectionEmail] = useState(
    `Kính gửi anh ${cand.name},\n\nCảm ơn anh đã dành thời gian quan tâm và ứng tuyển vị trí Senior Lead Engineer tại công ty. Qua phân tích hồ sơ chuyên sâu từ hội đồng kỹ thuật và hệ thống HireMate AI, chúng tôi đánh giá rất cao năng lực và thành tựu xuất sắc của anh trong lĩnh vực hệ thống phân tán.\n\nTuy nhiên, ở giai đoạn hiện tại dự án cần ưu tiên ứng viên có chứng chỉ Kubernetes CKA thực chiến và kinh nghiệm GCP đa đám mây để triển khai ngay trong tháng tới. Chúng tôi xin phép lưu hồ sơ của anh vào Talent Pool ưu tiên cho các đợt tuyển dụng tiếp theo.\n\nChúc anh luôn gặt hái nhiều thành công rực rỡ!\n\nTrân trọng,\nĐội ngũ Tuyển dụng HireMate AI`
  );

  const handleConfirmRejection = () => {
    setShowRejectModal(false);
    triggerToast('Đã gửi phản hồi từ chối kèm góp ý AI tới ứng viên.');
  };

  const handleConfirmInterview = () => {
    setShowInterviewModal(false);
    triggerToast(`Đã xếp lịch phỏng vấn ngày ${interviewDate} lúc ${interviewTime} & gửi thư mời kèm link Meet!`);
  };

  const handleConfirmTest = () => {
    setShowTestModal(false);
    triggerToast('Đã gửi bài test kỹ năng Java Concurrency & Kafka tới email ứng viên!');
  };

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
            <span>Đã thẩm định chuẩn 70/30</span>
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
                    <img
                      alt={cand.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#8C9A84]/40 shadow-soft"
                      src={cand.avatar}
                    />
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
                    Senior Lead Engineer &amp; Microservices Architect
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#2D3A31]/60">
                  <span>Ngành:</span>
                  <span className="text-[#2D3A31] font-medium px-2 py-0.5 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30">
                    Fintech &amp; High-load Banking
                  </span>
                </div>
              </div>
            </div>

            {/* 3 TRỤ CỘT NĂNG LỰC CỐT LÕI */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
                <h2 className="text-xs uppercase tracking-widest font-bold text-[#2D3A31] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#8C9A84] text-[16px]">bar_chart</span>
                  3 Trụ Cột Năng Lực Cốt Lõi (Core Evaluation Pillars)
                </h2>
                <span className="text-xs text-[#8C9A84] font-semibold">Thang điểm 100</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pillar 1 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1.5">
                      <span className="font-semibold text-[#2D3A31]">Chuyên Môn Cốt Lõi</span>
                      <span className="text-[#2D3A31] font-bold">96%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#2D3A31] rounded-full" style={{ width: '96%' }} />
                    </div>
                    <p className="text-xs text-[#2D3A31] font-medium">Domain &amp; System Architecture</p>
                    <p className="text-[11px] text-[#2D3A31]/60 mt-1">
                      Nắm vững kiến trúc Microservices, Concurrency, Caching đa tầng, Database Sharding.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E6E2DA] text-[11px] text-[#8C9A84] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span> High-throughput &amp; Cache P99 14ms
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1.5">
                      <span className="font-semibold text-[#2D3A31]">Quy Mô Thực Tế</span>
                      <span className="text-[#C27B66] font-bold">92%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#C27B66] rounded-full" style={{ width: '92%' }} />
                    </div>
                    <p className="text-xs text-[#2D3A31] font-medium">Scope &amp; Scale Impact</p>
                    <p className="text-[11px] text-[#2D3A31]/60 mt-1">
                      Kinh nghiệm thực chiến 52,000 req/s, 5M+ DAU, hệ thống thanh toán quốc tế PCI-DSS.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E6E2DA] text-[11px] text-[#C27B66] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span> Quản lý hệ thống 50k+ RPS
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2D3A31]/70 mb-1.5">
                      <span className="font-semibold text-[#2D3A31]">Quản Trị &amp; Văn Hóa</span>
                      <span className="text-[#8C9A84] font-bold">89%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#8C9A84] rounded-full" style={{ width: '89%' }} />
                    </div>
                    <p className="text-xs text-[#2D3A31] font-medium">Leadership &amp; Culture Fit</p>
                    <p className="text-[11px] text-[#2D3A31]/60 mt-1">
                      Lead squad 10+ kỹ sư, kèm cặp mentoring tốt, phong cách sở hữu trách nhiệm cao.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E6E2DA] text-[11px] text-[#8C9A84] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">forum</span> Lead squad 10+ kỹ sư
                  </div>
                </div>
              </div>

              {/* AI Deep Insights: Thế Mạnh & Rủi Ro Tiềm Ẩn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#E6E2DA]">
                <div className="p-3.5 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D3A31] mb-1">
                    <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">thumb_up</span> THẾ MẠNH NỔI TRỘI
                  </div>
                  <p className="text-xs text-[#2D3A31]/80 leading-relaxed">
                    Khả năng thực chiến xử lý nghẽn cổ chai hệ thống quy mô lớn, kinh nghiệm sâu về Java Concurrency và Transactional Outbox Pattern.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#C27B66] mb-1">
                    <span className="material-symbols-outlined text-[16px]">warning</span> RỦI RO &amp; LƯU Ý PHỎNG VẤN
                  </div>
                  <p className="text-xs text-[#2D3A31]/80 leading-relaxed">
                    Kinh nghiệm Kubernetes CKA đang trong quá trình chuẩn bị thi, chủ yếu làm việc chuyên sâu AWS hơn là GCP đa đám mây.
                  </p>
                </div>
              </div>
            </div>

            {/* ĐỐI CHIẾU TIÊU CHÍ JD & GAP ANALYSIS */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E6E2DA] shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
                <h3 className="text-xs uppercase tracking-widest font-bold text-[#2D3A31] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#8C9A84] text-[16px]">checklist_rtl</span>
                  Đối Chiếu Chi Tiết Tiêu Chí JD (Requirements Mapping)
                </h3>
                <span className="text-xs font-bold bg-[#8C9A84]/15 text-[#2D3A31] px-3 py-0.5 rounded-full border border-[#8C9A84]/30">
                  9/10 Tiêu chí Đạt chuẩn
                </span>
              </div>

              {/* Group 1: Must-have Requirements (70%) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#2D3A31] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D3A31]" /> TIÊU CHÍ BẮT BUỘC (MANDATORY - 70% TRỌNG SỐ)
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                        <span>1. 5+ năm kinh nghiệm Java Core / Spring Boot &amp; Microservices</span>
                        <span className="text-[10px] font-bold bg-[#8C9A84]/20 text-[#2D3A31] px-2 py-0.5 rounded-full">
                          ĐẠT 100% (6+ NĂM)
                        </span>
                      </div>
                      <p className="text-[#2D3A31]/70 mt-1">
                        Dẫn dắt kiến trúc module Core Payment Gateway với 18 microservices độc lập, thông thạo Spring Boot 3 và Java Concurrency.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                        <span>2. Cơ sở dữ liệu phân tán &amp; Tải cao (PostgreSQL Sharding, Redis Sentinel)</span>
                        <span className="text-[10px] font-bold bg-[#8C9A84]/20 text-[#2D3A31] px-2 py-0.5 rounded-full">
                          ĐẠT 96%
                        </span>
                      </div>
                      <p className="text-[#2D3A31]/70 mt-1">
                        Thực hiện sharding DB với PostgreSQL, tối ưu caching đa tầng Redis &amp; Caffeine, hạ độ trễ P99 API từ 120ms xuống 14ms.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                        <span>3. Kiến trúc Event-Driven (Apache Kafka) &amp; Xử lý phân tán Saga</span>
                        <span className="text-[10px] font-bold bg-[#8C9A84]/20 text-[#2D3A31] px-2 py-0.5 rounded-full">
                          ĐẠT 94%
                        </span>
                      </div>
                      <p className="text-[#2D3A31]/70 mt-1">
                        Thiết kế pipeline realtime phục vụ 5M+ active users, ứng dụng Saga Orchestration &amp; Debezium CDC trong giao dịch tài chính.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Nice-to-have Requirements (30%) */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-bold text-[#C27B66] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C27B66]" /> TIÊU CHÍ ƯU TIÊN (PREFERRED - 30% TRỌNG SỐ)
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                        <span>Nền tảng Cloud AWS (ECS, EKS, RDS Aurora, SQS, S3)</span>
                        <span className="text-[10px] font-bold bg-[#C27B66]/15 text-[#C27B66] px-2 py-0.5 rounded-full">
                          AWS SA PROFESSIONAL
                        </span>
                      </div>
                      <p className="text-[#2D3A31]/70 mt-0.5">
                        Sở hữu chứng chỉ cấp cao nhất của AWS, thiết kế hạ tầng multi-region an toàn.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#8C9A84] text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#2D3A31]">
                        <span>Ngoại ngữ: Giao tiếp tiếng Anh làm việc với khách hàng quốc tế</span>
                        <span className="text-[10px] font-bold bg-[#8C9A84]/20 text-[#2D3A31] px-2 py-0.5 rounded-full">
                          IELTS 7.5 (C1 FLUENT)
                        </span>
                      </div>
                      <p className="text-[#2D3A31]/70 mt-0.5">
                        Làm việc trực tiếp hàng ngày với khách hàng ngân hàng khu vực Đông Nam Á &amp; Nhật Bản.
                      </p>
                    </div>
                  </div>
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
                  ĐỘ TIN CẬY CAO (98%)
                </span>
              </div>
              <p className="text-xs text-[#2D3A31]/80 leading-relaxed italic">
                “Ứng viên <strong className="text-[#2D3A31] font-bold">{cand.name}</strong> sở hữu năng lực vượt trội về xử lý hệ thống phân tán chịu tải siêu cao, kiểm soát chặt chẽ độ trễ (low latency) và tư duy kiến trúc Microservices hướng sự kiện mẫu mực. Ứng viên đáp ứng trọn vẹn 9/10 tiêu chí gắt gao nhất của vị trí Lead Architect cho hệ sinh thái Core Banking.”
              </p>

              {/* Suggested Interview Questions */}
              <div className="mt-4 pt-3 border-t border-[#E6E2DA]">
                <div className="text-xs font-bold text-[#2D3A31] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#C27B66] text-[16px]">quiz</span>
                  CÂU HỎI PHỎNG VẤN AI GỢI Ý RIÊNG CHO TECH LEAD:
                </div>
                <ol className="space-y-2.5 text-xs text-[#2D3A31]/75 pl-4 list-decimal leading-relaxed">
                  <li className="pl-1">
                    <strong className="text-[#2D3A31]">Race Condition &amp; Idempotency trong Payment:</strong> Khi xử lý các luồng thanh toán đồng thời cực lớn (50,000 req/s), ứng viên đã kết hợp Distributed Lock (Redis Redlock) với Optimistic Locking trên Database như thế nào để ngăn chặn tuyệt đối double-spending?
                  </li>
                  <li className="pl-1">
                    <strong className="text-[#2D3A31]">Kafka Lag &amp; Rebalancing Prevention:</strong> Trong các đợt flash sale phát sinh spike đột biến, chiến lược quản trị Consumer Group và tuning thông số max.poll.interval.ms để tránh rebalance cascade là gì?
                  </li>
                  <li className="pl-1">
                    <strong className="text-[#2D3A31]">Kinh nghiệm Tuning Garbage Collection ZGC:</strong> Để đạt độ trễ P99 14ms trên cụm Java 21, ứng viên đã cấu hình và đo lường GC Pause Time như thế nào?
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
                <span>Bản Dữ Liệu Trích Xuất (Parsed CV)</span>
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
                <span>Xem File PDF Gốc (2.1 MB)</span>
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
              <button
                type="button"
                onClick={() => triggerToast(`Đang tải file ${cand.name.replace(/\s+/g, '_')}_CV.pdf về máy...`)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#F2F0EB] border border-[#E6E2DA] text-[#2D3A31] text-xs font-semibold transition-all shadow-soft cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8C9A84]">download</span>
                <span>Tải CV</span>
              </button>
            </div>
          </div>

          {/* CV Paper Canvas Container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F9F8F4] flex justify-center">
            {cvViewMode === 'pdf' ? (
              /* Simulated PDF Document Viewer */
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-[840px] bg-white rounded-[28px] border border-[#E6E2DA] shadow-soft p-8 space-y-6 relative transition-transform duration-200"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C27B66]">picture_as_pdf</span>
                    <span className="font-mono text-xs text-[#2D3A31]">{cand.name.replace(/\s+/g, '_')}_Senior_Backend_Lead.pdf</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                    PDF 1.7 Encrypted
                  </span>
                </div>
                <div className="p-6 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] space-y-4">
                  <div className="text-center pb-4 border-b border-[#E6E2DA]">
                    <h3 className="text-2xl font-serif font-bold text-[#2D3A31]">{cand.name}</h3>
                    <p className="text-xs text-[#8C9A84] font-semibold mt-1 uppercase tracking-wider">{cand.roleSummary}</p>
                    <p className="text-xs text-[#2D3A31]/70 mt-1">{cand.location} &bull; {cand.phone} &bull; {cand.email}</p>
                  </div>
                  <div className="text-xs text-[#2D3A31]/80 leading-relaxed space-y-3">
                    <p>
                      <strong>PROFILE OVERVIEW:</strong> 6+ years of technical leadership in high-load financial transaction engines, event-driven microservices, and high-availability banking architectures.
                    </p>
                    <p>
                      <strong>CURRENT ROLE:</strong> Tech Lead at FPT Software Fintech Unit managing a squad of 10 senior engineers, scaling payment services to 52,000 req/s under 14ms P99 latency.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-between items-center text-xs text-[#2D3A31]/60">
                    <span>Trang 1 trên 3 - Tiếp tục xem tại bản trích xuất hoàn chỉnh</span>
                    <button
                      onClick={() => setCvViewMode('parsed')}
                      className="text-[#C27B66] underline font-semibold cursor-pointer"
                    >
                      Mở bản trích xuất hoàn chỉnh &rarr;
                    </button>
                  </div>
                </div>
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
                  <div className="text-[9px] font-mono text-[#2D3A31]/50 mt-0.5">SHA-256: #HM-9082-VN-2025-ARCHIVE-SECURE</div>
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
                    <span className="flex items-center gap-1.5 text-[#2D3A31]">
                      <span className="material-symbols-outlined text-[15px] text-[#C27B66]">link</span> linkedin.com/in/{cand.name.toLowerCase().replace(/\s+/g, '')}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#2D3A31]">
                      <span className="material-symbols-outlined text-[15px] text-[#C27B66]">code</span> github.com/{cand.name.toLowerCase().replace(/\s+/g, '')}-dev
                    </span>
                  </div>
                </div>

                {/* 2. MỤC TIÊU NGHỀ NGHIỆP */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-2.5 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 1. MỤC TIÊU NGHỀ NGHIỆP &amp; TỔNG QUAN HỒ SƠ
                  </h3>
                  <p className="text-xs text-[#2D3A31]/80 leading-relaxed text-justify">
                    {cand.summary} Mục tiêu đồng hành và phát triển bền vững cùng các dự án kiến trúc lõi quy mô lớn của doanh nghiệp đối tác, tối ưu hóa triệt để tài nguyên và tăng cường độ tin cậy dịch vụ (SRE).
                  </p>
                </div>

                {/* 3. KỸ NĂNG CHUYÊN MÔN TOÀN DIỆN */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 2. KỸ NĂNG CHUYÊN MÔN TOÀN DIỆN (TECHNICAL SKILL MATRIX)
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="w-40 text-[#2D3A31]/60 font-semibold shrink-0 pt-0.5">Backend &amp; Languages:</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Java 17/21 (Core, Concurrency, Virtual Threads)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Spring Boot 3.x
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Spring Cloud
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Golang (Microservices)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31]/70 border border-[#E6E2DA]">
                          gRPC / Protocol Buffers
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="w-40 text-[#2D3A31]/60 font-semibold shrink-0 pt-0.5">Database &amp; Caching:</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          PostgreSQL (Partitioning &amp; Citus Sharding)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Redis Cluster &amp; Sentinel
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Caffeine In-memory Cache
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          ClickHouse (OLAP Analytics)
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="w-40 text-[#2D3A31]/60 font-semibold shrink-0 pt-0.5">Message Queue &amp; Event:</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Apache Kafka (Cluster Tuning &amp; MirrorMaker)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Debezium CDC (Change Data Capture)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          RabbitMQ
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="w-40 text-[#2D3A31]/60 font-semibold shrink-0 pt-0.5">Cloud &amp; DevOps:</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          AWS (ECS, EKS, RDS Aurora, SQS, KMS, S3)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Docker &amp; Kubernetes (CKA Candidate)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31] border border-[#E6E2DA]">
                          Terraform (IaC)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#2D3A31]/70 border border-[#E6E2DA]">
                          Prometheus &amp; Grafana
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. LỊCH SỬ KINH NGHIỆM LÀM VIỆC CHI TIẾT */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#2D3A31] font-bold mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#2D3A31]" /> 3. LỊCH SỬ KINH NGHIỆM LÀM VIỆC CHI TIẾT
                  </h3>
                  <div className="space-y-6">
                    {/* Job 1 */}
                    <div className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-[#E6E2DA]">
                      <span className="absolute -left-1 top-2 w-2.5 h-2.5 rounded-full bg-[#8C9A84]" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-serif font-bold text-[#2D3A31]">Technical Lead / Senior Solutions Engineer</h4>
                        <span className="text-xs font-semibold text-[#8C9A84] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full border border-[#8C9A84]/30">
                          03/2021 — Hiện tại (Gần 4 năm)
                        </span>
                      </div>
                      <div className="text-xs text-[#2D3A31]/70 font-medium mt-0.5">
                        FPT Software • Fintech Global Delivery Unit (Khách hàng Ngân hàng Quốc tế Đông Nam Á)
                      </div>
                      <ul className="mt-2.5 space-y-2 text-xs text-[#2D3A31]/80 list-disc pl-4 leading-relaxed">
                        <li>
                          Chịu trách nhiệm kiến trúc kỹ thuật và lãnh đạo squad gồm 10 kỹ sư backend cao cấp phát triển phân hệ <strong className="text-[#2D3A31]">Core Payment Gateway &amp; Settlement System</strong> cho đối tác ngân hàng quốc tế.
                        </li>
                        <li>
                          Tái cấu trúc thành công hệ thống monolith sang <strong className="text-[#2D3A31]">18 Microservices độc lập</strong>, triển khai kiến trúc Saga Pattern để quản lý giao dịch phân tán đảm bảo toàn vẹn tài chính 100%.
                        </li>
                        <li>
                          Thiết kế giải pháp Caching đa tầng (L1 Caffeine in-memory, L2 Redis Sentinel), hạ độ trễ P99 API từ 120ms xuống chỉ còn <strong className="text-[#8C9A84]">14ms</strong>.
                        </li>
                        <li>
                          Bảo đảm hệ thống chịu tải an toàn trong các chiến dịch siêu khuyến mãi với đỉnh lưu lượng đạt <strong className="text-[#2D3A31]">52,000 requests/giây</strong>, duy trì cam kết SLO dịch vụ ở mức 99.99%.
                        </li>
                      </ul>
                    </div>

                    {/* Job 2 */}
                    <div className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-[#E6E2DA]">
                      <span className="absolute -left-1 top-2 w-2.5 h-2.5 rounded-full bg-[#2D3A31]/40" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-serif font-bold text-[#2D3A31]">Backend Software Engineer</h4>
                        <span className="text-xs text-[#2D3A31]/60">08/2018 — 02/2021 (2.5 năm)</span>
                      </div>
                      <div className="text-xs text-[#2D3A31]/70 font-medium mt-0.5">
                        VNG Corporation • Zalo Ecosystem (Hạ tầng dịch vụ tin nhắn &amp; thông báo thời gian thực)
                      </div>
                      <ul className="mt-2.5 space-y-2 text-xs text-[#2D3A31]/80 list-disc pl-4 leading-relaxed">
                        <li>
                          Nghiên cứu và triển khai hạ tầng <strong className="text-[#2D3A31]">Real-time Push Notification Gateway</strong> phục vụ trên 5,000,000 active users hàng ngày dựa trên Netty framework và Apache Kafka.
                        </li>
                        <li>
                          Giải quyết bài toán nghẽn DB qua cơ chế phân vùng tự động (Table Partitioning), giảm tải máy chủ và tiết kiệm 30% chi phí hạ tầng cloud.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer note inside Resume Paper */}
                <div className="text-center pt-6 border-t border-[#E6E2DA] text-xs text-[#2D3A31]/50 space-y-1">
                  <div>Bản hồ sơ ứng viên được đồng bộ hóa và trích xuất nguyên bản từ HireMate Secure Cloud Storage</div>
                  <div className="text-[10px] font-mono text-[#8C9A84]">Checksum Verification: e9b4c02f8319aa12d7c588e100cb92af</div>
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
              <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-ping" /> Đủ điều kiện duyệt nhanh
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
                <h3 className="font-serif font-bold text-xl text-[#2D3A31]">Lên Lịch Phỏng Vấn Kỹ Thuật (Vòng 2)</h3>
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
                  <option>Technical Deep-dive (System Design & Concurrency)</option>
                  <option>Architecture & Behavioral Culture Fit</option>
                  <option>Final Interview with VP of Engineering</option>
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
                  Hệ thống AI sẽ gửi kèm bộ 3 câu hỏi kỹ thuật chuyên sâu gợi ý vào lịch Google Calendar của hội đồng phỏng vấn.
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
                  <option>Khác định hướng tech stack (Ưu tiên GCP & CKA ngay)</option>
                  <option>Mức đãi ngộ vượt khung ngân sách hiện tại</option>
                  <option>Đã đủ chỉ tiêu cho đợt tuyển dụng này</option>
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
                  <option>Java Concurrency & Kafka High-throughput Test (90 phút)</option>
                  <option>System Design & Distributed Locking 60min</option>
                  <option>Spring Boot 3 DDD Assessment</option>
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
                Ứng viên sẽ nhận được email chứa link làm bài kiểm tra độc quyền kèm camera proctoring và trình biên dịch trực tuyến chống gian lận.
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
