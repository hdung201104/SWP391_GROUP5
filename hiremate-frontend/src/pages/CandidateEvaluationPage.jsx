import React, { useState } from 'react';

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
    summary: '6+ năm kinh nghiệm kỹ thuật tại các hệ sinh thái tài chính và ngân hàng số chịu tải lớn. Chuyên gia giải quyết các bài toán tối ưu JVM, độ trễ mạng và phân vùng dữ liệu Kafka 50k RPS.',
    company: 'FPT Software Alumni',
    jobCode: 'JD-BNK-882',
    strengths: [
      'Khả năng thực chiến xử lý nghẽn cổ chai hệ thống quy mô lớn (50,000 req/s).',
      'Thành thạo Java 21 Virtual Threads và Transactional Outbox Pattern.',
      'Tối ưu độ trễ P99 API từ 120ms xuống 14ms.',
    ],
    skillGaps: [
      'Chứng chỉ Kubernetes CKA đang trong quá trình học.',
      'Chủ yếu kinh nghiệm AWS hơn là GCP đa đám mây.',
    ],
    interviewQuestions: [
      'Chiến lược Distributed Lock với Redis Redlock để chống double-spending?',
      'Cách phòng tránh Rebalance Cascade trong Kafka Consumer Group?',
      'Kinh nghiệm tuning Garbage Collector ZGC trên Java 21?',
    ],
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
    aiFitAssessment: 'ƯU TÚ • KHỚP 100% CORE JAVA & AWS',
    summary: 'Lead Engineer giàu kinh nghiệm tại VNG Corp với nền tảng vững chắc về Microservices, Kafka clustering và chứng chỉ AWS Solutions Architect Professional.',
    company: 'VNG Corp',
    jobCode: 'JD-BNK-882',
    strengths: [
      'Kinh nghiệm quản lý team 8-10 kỹ sư phần mềm.',
      'Sở hữu chứng chỉ AWS Solutions Architect Professional.',
      'Am hiểu sâu sắc về Microservices & Event-Driven Architecture.',
    ],
    skillGaps: [
      'Cần kiểm tra kỹ năng thực hành với PostgreSQL Sharding.',
    ],
    interviewQuestions: [
      'Kinh nghiệm triển khai Saga Orchestration pattern trong microservices?',
      'Cách thiết kế hạ tầng Multi-region trên AWS để đảm bảo High Availability?',
    ],
  },
};

export default function CandidateEvaluationPage({ user, candidateId = 1, jobId = 101, onBack }) {
  const targetCandId = Number(candidateId) || 1;
  const cand = CANDIDATES_DATA[targetCandId] || CANDIDATES_DATA[1];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = `#/applicants-management?jobId=${jobId || 101}`;
    }
  };

  const [zoomLevel, setZoomLevel] = useState(100);
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70));

  const [cvViewMode, setCvViewMode] = useState('parsed');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const [interviewDate, setInterviewDate] = useState('2025-05-20');
  const [interviewTime, setInterviewTime] = useState('09:30');
  const [interviewType, setInterviewType] = useState('Technical Deep-dive');

  const [hrNotes, setHrNotes] = useState([
    {
      id: 1,
      author: user?.fullName || 'Nguyễn Minh Anh (TA Lead)',
      time: 'Hôm nay 10:15',
      text: 'Ứng viên tiềm năng cao, kỹ năng xử lý hệ thống 50k RPS tốt. Sẵn sàng thỏa thuận lương $3,500.',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    setHrNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: user?.fullName || 'Nguyễn Minh Anh',
        time: 'Vừa xong',
        text: newNoteText.trim(),
      },
    ]);
    setNewNoteText('');
    setShowNoteModal(false);
    triggerToast('Đã lưu ghi chú nội bộ thành công!');
  };

  const handleConfirmInterview = () => {
    setShowInterviewModal(false);
    triggerToast(`Đã xếp lịch phỏng vấn ngày ${interviewDate} lúc ${interviewTime} & gửi thư mời tới ứng viên!`);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1F2933] font-sans flex flex-col h-screen overflow-hidden">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl bg-[#1F2933] text-white text-xs font-semibold shadow-lg flex items-center gap-2.5 animate-fade-in">
          <span className="material-symbols-outlined text-[#F58220] text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-16 w-full shrink-0 z-40 bg-white border-b border-[#E5E1D8] px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#E5E1D8] border border-[#E5E1D8] text-xs font-semibold text-[#1F2933] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Quay lại</span>
          </button>
          <div className="h-4 w-px bg-[#E5E1D8]" />
          <div>
            <h1 className="font-bold text-base text-[#1F2933]">
              Hồ sơ ứng viên: {cand.name}
            </h1>
            <p className="text-[11px] text-[#6B7280]">{cand.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNoteModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#E5E1D8] border border-[#E5E1D8] text-xs font-semibold text-[#1F2933] cursor-pointer"
          >
            + Ghi chú HR
          </button>
          <button
            onClick={() => setShowInterviewModal(true)}
            className="px-4 py-1.5 rounded-xl bg-[#F58220] hover:bg-[#E07216] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            Mời phỏng vấn
          </button>
        </div>
      </header>

      {/* Main Content Split Pane */}
      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row">

        {/* Left Column: AI Matching Analysis & Candidate Details */}
        <section className="w-full lg:w-[48%] h-full flex flex-col border-r border-[#E5E1D8] bg-[#FAF9F6] overflow-y-auto p-6 space-y-6">

          {/* Candidate Profile Summary */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={cand.avatar}
                  alt={cand.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E5E1D8]"
                />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2933]">{cand.name}</h2>
                  <p className="text-xs text-[#6B7280] font-medium">{cand.title}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{cand.experience} &bull; {cand.location}</p>
                </div>
              </div>

              {/* AI Match Score Badge */}
              <div className="text-right shrink-0">
                <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#F58220]/30 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#F58220] block">AI Match</span>
                  <span className="text-2xl font-bold text-[#F58220]">{cand.matchScore}%</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-3 border-t border-[#E5E1D8] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Email liên hệ:</span>
                <span className="font-semibold text-[#1F2933]">{cand.email}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Số điện thoại:</span>
                <span className="font-semibold text-[#1F2933]">{cand.phone}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Mức lương mong muốn:</span>
                <span className="font-semibold text-[#1F2933]">{cand.salary}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Trạng thái:</span>
                <span className="font-semibold text-[#10B981]">{cand.status}</span>
              </div>
            </div>
          </div>

          {/* AI MATCHING ANALYSIS SECTION (Visually Separated) */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#F58220]/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F58220]">auto_awesome</span>
                <h3 className="font-bold text-base text-[#1F2933]">Phân Tích AI Matching</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/30">
                Độ phù hợp: {cand.matchScore}%
              </span>
            </div>

            {/* Overview / Summary */}
            <div className="text-xs text-[#1F2933] leading-relaxed">
              <strong className="text-[#F58220] block mb-1">Đánh giá chung:</strong>
              <p className="text-[#6B7280]">{cand.summary}</p>
            </div>

            {/* Strengths (Điểm mạnh) */}
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 space-y-1.5 text-xs">
              <div className="font-bold text-[#047857] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">thumb_up</span>
                <span>Điểm Mạnh Nổi Trội</span>
              </div>
              <ul className="list-disc pl-4 text-[#047857] space-y-1">
                {cand.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Skill Gaps (Kỹ năng còn thiếu) */}
            <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#F58220]/30 space-y-1.5 text-xs">
              <div className="font-bold text-[#F58220] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Kỹ Năng Cần Lưu Ý / Còn Thiếu</span>
              </div>
              <ul className="list-disc pl-4 text-[#F58220] space-y-1">
                {cand.skillGaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>

            {/* Interview Suggestions (Gợi ý phỏng vấn) */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1.5 text-xs">
              <div className="font-bold text-[#1F2933] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#F58220]">quiz</span>
                <span>Gợi Ý Câu Hỏi Phỏng Vấn AI</span>
              </div>
              <ol className="list-decimal pl-4 text-[#6B7280] space-y-1">
                {cand.interviewQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Internal HR Notes */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#1F2933] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6B7280]">sticky_note_2</span>
              Ghi chú nội bộ HR ({hrNotes.length})
            </h3>
            <div className="space-y-2">
              {hrNotes.map((note) => (
                <div key={note.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] text-xs">
                  <div className="flex items-center justify-between font-bold text-[#1F2933]">
                    <span>{note.author}</span>
                    <span className="text-[10px] text-[#6B7280]">{note.time}</span>
                  </div>
                  <p className="text-[#6B7280] mt-1">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: CV Viewer (Parsed vs Original PDF) */}
        <section className="w-full lg:w-[52%] h-full flex flex-col bg-white">
          <div className="h-14 px-6 bg-[#FAF9F6] border-b border-[#E5E1D8] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E1D8]">
              <button
                onClick={() => setCvViewMode('parsed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${cvViewMode === 'parsed' ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
                  }`}
              >
                Trích xuất dữ liệu CV
              </button>
              <button
                onClick={() => setCvViewMode('pdf')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${cvViewMode === 'pdf' ? 'bg-[#1F2933] text-white' : 'text-[#6B7280]'
                  }`}
              >
                File PDF gốc
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button onClick={handleZoomOut} className="p-1 text-[#6B7280] hover:text-[#1F2933] cursor-pointer">
                -
              </button>
              <span className="font-mono text-[#1F2933]">{zoomLevel}%</span>
              <button onClick={handleZoomIn} className="p-1 text-[#6B7280] hover:text-[#1F2933] cursor-pointer">
                +
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#FAF9F6] flex justify-center">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[800px] bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-8 space-y-6 transition-transform"
            >
              <div className="border-b border-[#E5E1D8] pb-4">
                <h2 className="text-2xl font-bold text-[#1F2933]">{cand.name}</h2>
                <p className="text-xs text-[#F58220] font-semibold mt-1">{cand.roleSummary}</p>
                <p className="text-xs text-[#6B7280] mt-1">{cand.email} &bull; {cand.phone} &bull; {cand.location}</p>
              </div>

              <div className="space-y-4 text-xs text-[#1F2933]">
                <div>
                  <h4 className="font-bold uppercase text-[#1F2933] mb-1">Tóm tắt kinh nghiệm</h4>
                  <p className="text-[#6B7280] leading-relaxed">{cand.summary}</p>
                </div>

                <div>
                  <h4 className="font-bold uppercase text-[#1F2933] mb-1">Kỹ năng chuyên môn</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cand.strengths.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E1D8] text-[#1F2933]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* INTERVIEW SCHEDULING MODAL */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-[#1F2933]">Đặt Lịch Phỏng Vấn AI</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1F2933] mb-1">Ngày phỏng vấn</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-2.5 text-[#1F2933]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1F2933] mb-1">Giờ phỏng vấn</label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-2.5 text-[#1F2933]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F2933] hover:bg-[#E5E1D8]/50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmInterview}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#F58220] hover:bg-[#E07216]"
              >
                Xác nhận đặt lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HR NOTE MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-[#1F2933]">Thêm Ghi Chú Nội Bộ</h3>
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Nhập nội dung ghi chú..."
              className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-xs text-[#1F2933]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F2933] hover:bg-[#E5E1D8]/50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddNote}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#F58220] hover:bg-[#E07216]"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
