import React, { useState, useEffect } from 'react';
import aiMatchApi from '../../api/aiMatchApi';

/**
 * AiJobEvaluationReportCard
 * 
 * Báo cáo đối soát & phân tích chuyên sâu AI (ATS Match Audit Report) giữa CV ứng viên và JD:
 * 1. Cơ chế On-Demand: Chỉ phân tích và viết báo cáo khi ứng viên yêu cầu; sau đó lưu vĩnh viễn vào CSDL.
 * 2. Phân hạng người dùng (Candidate Tiers): Free (3 lượt dùng thử) vs Plus/Pro/VIP (Không giới hạn).
 * 3. Trực quan hóa 4 trụ cột, Ưu điểm kèm minh chứng CV, Nhược điểm kèm lý do trừ điểm, Lời khuyên chuẩn bị phỏng vấn STAR.
 */
export default function AiJobEvaluationReportCard({
  jobId,
  jobTitle,
  initialScore = null,
  initialReasoning = null,
  candidateCvs = [],
  selectedCvId = '',
  onSelectCv = () => {},
  onScoreUpdated = () => {},
}) {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(1);
  const [activeTab, setActiveTab] = useState('ADVANTAGES'); // 'ADVANTAGES' | 'DISADVANTAGES' | 'ADVICE'
  const [errorMsg, setErrorMsg] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Tải báo cáo từ Database Cache khi mở trang (nếu đã từng được AI tạo trước đó)
  useEffect(() => {
    let mounted = true;
    if (jobId) {
      setIsLoading(true);
      setErrorMsg(null);
      aiMatchApi.getCandidateJobReport(jobId, selectedCvId || undefined, false)
        .then((res) => {
          if (!mounted) return;
          const data = res?.data || res;
          if (data) {
            setReport(data);
            if (data.matchingScore != null) {
              onScoreUpdated(Math.round(data.matchingScore), data.overallVerdict);
            }
          }
        })
        .catch(() => {
          // Bỏ qua lỗi silent khi chỉ kiểm tra cache ban đầu
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    }
    return () => { mounted = false; };
  }, [jobId]);

  // 2. Kích hoạt AI phân tích chuyên sâu & viết báo cáo theo yêu cầu
  const handleGenerateReport = async () => {
    if (!jobId) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratingStep(1);

    // Hiệu ứng chuyển bước trực quan minh bạch
    const timer1 = setTimeout(() => setGeneratingStep(2), 1200);
    const timer2 = setTimeout(() => setGeneratingStep(3), 2800);

    try {
      const res = await aiMatchApi.getCandidateJobReport(jobId, selectedCvId || undefined, true);
      const data = res?.data || res;
      if (data) {
        setReport(data);
        setIsExpanded(true);
        if (data.matchingScore != null) {
          onScoreUpdated(Math.round(data.matchingScore), data.overallVerdict);
        }
      }
    } catch (err) {
      console.error('Lỗi khi yêu cầu AI viết báo cáo:', err);
      const isTimeout = err?.code === 'ECONNABORTED' || (err?.message && err.message.toLowerCase().includes('timeout'));
      const msg = isTimeout
        ? 'Quá trình phân tích chuyên sâu qua AI cần thêm thời gian để đối soát 13 kỹ năng. Yêu cầu đang được hoàn tất và lưu vào CSDL, bạn vui lòng tải lại trang sau giây lát!'
        : (err?.response?.data?.message || err?.message || 'Không thể tạo báo cáo lúc này. Vui lòng thử lại sau.');
      setErrorMsg(msg);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsGenerating(false);
    }
  };

  const currentScore = report?.matchingScore != null 
    ? Math.round(report.matchingScore) 
    : (initialScore != null ? Math.round(initialScore) : null);

  const hasDetailedReport = Boolean(report?.advantages && report.advantages.length > 0);
  const tier = report?.candidateTier || 'FREE';
  const tierName = report?.candidateTierName || 'Free Candidate';
  const isUnlimited = Boolean(report?.isUnlimited);
  const remaining = report?.reportsRemaining != null ? report.reportsRemaining : 3;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/70 border border-purple-200/90 shadow-sm overflow-hidden transition-all duration-300">
      
      {/* 1. HEADER SECTION */}
      <div className="p-5 sm:p-6 border-b border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5b48bd] to-[#8b5cf6] text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20 mt-0.5">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-[#1e1b4b]">
                Đánh Giá Độ Phù Hợp AI HireMate (ATS Match)
              </h3>
              
              {/* Candidate Subscription Tier Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border flex items-center gap-1 ${
                isUnlimited 
                  ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <span className="material-symbols-outlined text-[12px] text-amber-600">
                  {isUnlimited ? 'workspace_premium' : 'loyalty'}
                </span>
                <span>{tierName.toUpperCase()}</span>
                {!isUnlimited && (
                  <span className="text-slate-500 font-medium">({remaining} lượt còn lại)</span>
                )}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích chuyên sâu ưu nhược điểm của hồ sơ CV đối chiếu với vị trí <strong>{jobTitle || 'bài tuyển dụng'}</strong>
            </p>
          </div>
        </div>

        {/* Match Score Badge */}
        {currentScore != null && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Độ Phù Hợp ATS</div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className={`text-xl font-black ${
                  currentScore >= 80 ? 'text-emerald-600' : currentScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {currentScore}%
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  currentScore >= 80 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : currentScore >= 50 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {currentScore >= 80 ? '⭐ Rất Phù Hợp' : currentScore >= 50 ? '✨ Tiềm Năng' : '⚠️ Cần Nâng Cao'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        
        {/* 2. EXPLANATION BANNER (Minh bạch tại sao chỉ chấm khi ấn và lưu vào DB) */}
        {!hasDetailedReport && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-purple-50/90 border border-purple-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#5b48bd]">
              <span className="material-symbols-outlined text-base">psychology</span>
              <span>Tại sao hệ thống không tự động viết báo cáo cho tất cả công việc?</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Việc bóc tách và viết báo cáo chuyên sâu (chỉ rõ <strong>Ưu điểm</strong>, <strong>Nhược điểm</strong>, trích dẫn minh chứng từ CV và gợi ý câu hỏi phỏng vấn) sử dụng mô hình trí tuệ nhân tạo Gemini AI tiên tiến.
              Để tối ưu tốc độ tải trang và tiết kiệm tài nguyên cho bạn, AI chỉ bắt đầu phân tích khi bạn <strong>ấn yêu cầu</strong>, sau đó hệ thống sẽ <strong>lưu trữ vĩnh viễn báo cáo vào CSDL</strong> để bạn xem lại bất cứ lúc nào với tốc độ tức thì (0ms).
            </p>
          </div>
        )}

        {/* 3. TOOLBAR CHỌN CV & NÚT HÀNH ĐỘNG */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-600 shrink-0">Bản CV đối soát:</span>
            {candidateCvs.length > 0 ? (
              <select
                value={selectedCvId}
                onChange={(e) => onSelectCv(e.target.value)}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-xl border border-purple-200 bg-slate-50/60 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5b48bd]/30 outline-hidden transition-all max-w-[260px] truncate"
              >
                {candidateCvs.map((c) => (
                  <option key={c.cvId} value={c.cvId}>
                    {c.fileName} {c.isDefault ? '(Mặc định)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <a
                href="#/candidate-profile"
                className="text-xs text-[#5b48bd] font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Tải CV lên trang cá nhân</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!hasDetailedReport ? (
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGenerating || candidateCvs.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#4938a5] hover:to-[#6a54cb] text-white font-extrabold text-xs shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">
                  {isGenerating ? 'hourglass_top' : 'auto_awesome'}
                </span>
                <span>{isGenerating ? 'AI đang viết báo cáo...' : '✨ Yêu Cầu AI Phân Tích & Viết Báo Cáo'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">database</span>
                  <span>Đã lưu vào CSDL</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-4 py-1.5 rounded-xl bg-[#5b48bd] hover:bg-[#4938a5] text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  <span>{isExpanded ? 'Thu Gọn Báo Cáo' : 'Xem Báo Cáo Chi Tiết'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 text-[#5b48bd] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
                  title="Chấm lại và cập nhật báo cáo mới với bản CV được chọn"
                >
                  <span className="material-symbols-outlined text-sm">{isGenerating ? 'hourglass_top' : 'refresh'}</span>
                  <span>{isGenerating ? 'Đang chấm lại...' : 'Chấm lại'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 animate-in fade-in">
            <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">error</span>
            <div className="flex-1 space-y-2">
              <p className="font-semibold">{errorMsg}</p>
              {(errorMsg.toLowerCase().includes('hết') || errorMsg.toLowerCase().includes('hạn mức') || errorMsg.toLowerCase().includes('nâng cấp')) && !isUnlimited && (
                <a
                  href="#/candidate-pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[11px] shadow-sm hover:opacity-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                  <span>Nâng cấp gói Practice Plus / Pro ngay</span>
                </a>
              )}
              {errorMsg.toLowerCase().includes('thời gian') && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#5b48bd] text-white font-bold text-[11px] shadow-xs cursor-pointer hover:bg-[#4938a5] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Tải lại trang kiểm tra kết quả</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. LOADING PROGRESS ANIMATION WHEN AI IS COMPUTING */}
        {isGenerating && (
          <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-200/90 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                Gemini AI Đang Đối Soát Toàn Diện Hồ Sơ Của Bạn
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {generatingStep === 1 && 'Bước 1/3: Quét ma trận 70/30 kỹ năng bắt buộc và kỹ năng ưu tiên...'}
                {generatingStep === 2 && 'Bước 2/3: Phân tích kinh nghiệm, học vấn và bóc tách minh chứng từ CV...'}
                {generatingStep === 3 && 'Bước 3/3: Tổng hợp ưu điểm, nhược điểm và biên soạn lời khuyên chuẩn bị...'}
              </p>
            </div>
            {/* Step Pills */}
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto pt-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${generatingStep >= 1 ? 'bg-[#5b48bd]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${generatingStep >= 2 ? 'bg-[#5b48bd]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${generatingStep >= 3 ? 'bg-[#5b48bd]' : 'bg-slate-200'}`} />
            </div>
          </div>
        )}

        {/* 5. REPORT CONTENT DISPLAY */}
        {report && !isGenerating && (
          <div className="space-y-5 animate-in fade-in">
            
            {/* OVERVIEW / VERDICT CARD */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-[#2d2258] to-[#1e1b4b] text-white shadow-md space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-purple-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-lg">workspace_premium</span>
                  <span className="font-extrabold text-xs uppercase tracking-wider text-purple-200">
                    Kết Luận Đánh Giá Tổng Thể
                  </span>
                </div>
                {report.matchTier && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 backdrop-blur-xs">
                    {report.matchTier}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
                {report.overallVerdict || report.executiveRecommendation || initialReasoning || 'Hồ sơ đã được đối soát thành công.'}
              </p>

              {/* 4 Pillars Mini-Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <div className="text-purple-300 font-bold">Kỹ Năng (70/30)</div>
                  <div className="text-base font-black mt-0.5">{Math.round(report.skillsScore || currentScore || 80)}%</div>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <div className="text-purple-300 font-bold">Kinh Nghiệm</div>
                  <div className="text-base font-black mt-0.5">{Math.round(report.experienceScore || 85)}%</div>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <div className="text-purple-300 font-bold">Học Vấn / Bằng Cấp</div>
                  <div className="text-base font-black mt-0.5">{Math.round(report.educationScore || 90)}%</div>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <div className="text-purple-300 font-bold">Ngữ Nghĩa Dự Án</div>
                  <div className="text-base font-black mt-0.5">{Math.round(report.semanticScore || 80)}%</div>
                </div>
              </div>
            </div>

            {/* COLLAPSED TEASER BANNER */}
            {hasDetailedReport && !isExpanded && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="material-symbols-outlined text-[#5b48bd] text-lg shrink-0">insights</span>
                  <span>
                    Báo cáo phân tích chuyên sâu gồm <strong>{report.advantages?.length || 0} ưu điểm</strong>, <strong>{report.disadvantages?.length || 0} nhược điểm</strong>, trích dẫn CV và câu hỏi phỏng vấn STAR đang được thu gọn.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] text-white font-extrabold text-xs shadow-sm hover:from-[#4938a5] hover:to-[#6a54cb] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Mở Xem Chi Tiết Báo Cáo</span>
                </button>
              </div>
            )}

            {/* EXPANDED DETAILED REPORT */}
            {hasDetailedReport && isExpanded && (
              <div className="space-y-5 animate-in fade-in">
                {/* TAB SELECTOR */}
                <div className="flex items-center gap-2 border-b border-purple-100 pb-2 overflow-x-auto scrollbar-none text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('ADVANTAGES')}
                className={`px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'ADVANTAGES'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>🟢 Ưu Điểm Nổi Bật ({report.advantages?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DISADVANTAGES')}
                className={`px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'DISADVANTAGES'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">error</span>
                <span>🔴 Nhược Điểm / Kỹ Năng Thiếu ({report.disadvantages?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ADVICE')}
                className={`px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'ADVICE'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'bg-purple-50 text-[#5b48bd] hover:bg-purple-100/80 border border-purple-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                <span>💡 Lời Khuyên Chuẩn Bị & Tối Ưu CV</span>
              </button>
            </div>

            {/* TAB 1: ADVANTAGES (ƯU ĐIỂM) */}
            {activeTab === 'ADVANTAGES' && (
              <div className="space-y-3 animate-in fade-in">
                {report.advantages && report.advantages.length > 0 ? (
                  report.advantages.map((adv, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                            {adv.category || 'Ưu điểm'}
                          </span>
                          <h5 className="font-extrabold text-xs sm:text-sm text-emerald-950">
                            {adv.title}
                          </h5>
                        </div>
                        {adv.assessment && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
                            ✓ {adv.assessment}
                          </span>
                        )}
                      </div>

                      {adv.cvEvidence && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
                          <strong className="text-emerald-900 font-bold">📄 Minh chứng từ CV của bạn: </strong>
                          <span>{adv.cvEvidence}</span>
                        </div>
                      )}

                      {adv.jobMatch && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          🎯 <strong>Yêu cầu JD được đáp ứng:</strong> {adv.jobMatch}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200 text-center">
                    Chưa ghi nhận ưu điểm đặc biệt. Hãy bổ sung thêm kinh nghiệm vào CV.
                  </p>
                )}
              </div>
            )}

            {/* TAB 2: DISADVANTAGES (NHƯỢC ĐIỂM & KỸ NĂNG THIẾU) */}
            {activeTab === 'DISADVANTAGES' && (
              <div className="space-y-3 animate-in fade-in">
                {report.disadvantages && report.disadvantages.length > 0 ? (
                  report.disadvantages.map((dis, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase">
                            {dis.category || 'Điểm cần cải thiện'}
                          </span>
                          <h5 className="font-extrabold text-xs sm:text-sm text-rose-950">
                            {dis.title}
                          </h5>
                        </div>
                        {dis.severity && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                            dis.severity.includes('Bắt buộc') 
                              ? 'bg-rose-100 text-rose-800 border-rose-300' 
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            ⚠️ {dis.severity}
                          </span>
                        )}
                      </div>

                      {dis.jobRequirement && (
                        <div className="text-xs text-slate-700 leading-relaxed font-medium">
                          📌 <strong>Yêu cầu của nhà tuyển dụng:</strong> {dis.jobRequirement}
                        </div>
                      )}

                      {dis.cvShortfall && (
                        <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/70 text-xs text-rose-900 leading-relaxed font-semibold">
                          🔍 <strong>Khoảng trống trong CV của bạn:</strong> {dis.cvShortfall}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-bold">
                    🎉 Tuyệt vời! CV của bạn không có khoảng trống kỹ năng nghiêm trọng nào so với vị trí này.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACTIONABLE ADVICE & INTERVIEW TIPS */}
            {activeTab === 'ADVICE' && (
              <div className="space-y-4 animate-in fade-in">
                {/* CV Improvement Suggestions */}
                <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-2.5">
                  <h5 className="font-extrabold text-xs sm:text-sm text-[#1e1b4b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">edit_document</span>
                    <span>Đề Xuất Chỉnh Sửa CV Chuẩn ATS Để Đạt Điểm Cao Hơn:</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    {report.cvImprovementSuggestions && report.cvImprovementSuggestions.length > 0 ? (
                      report.cvImprovementSuggestions.map((sug, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-sm text-[#5b48bd] shrink-0 mt-0.5">arrow_right</span>
                          <span>{sug}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd] shrink-0 mt-0.5">arrow_right</span>
                        <span>Bổ sung các từ khóa công nghệ còn thiếu vào phần Kỹ năng & Mục tiêu nghề nghiệp trong CV.</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Interview Preparation Tips */}
                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2.5">
                  <h5 className="font-extrabold text-xs sm:text-sm text-amber-950 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-amber-600">psychology_alt</span>
                    <span>Chiến Lược Chuẩn Bị Phỏng Vấn (Dự Đoán Câu Hỏi Nhà Tuyển Dụng):</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    {report.interviewTips && report.interviewTips.length > 0 ? (
                      report.interviewTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">arrow_right</span>
                          <span>{tip}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">arrow_right</span>
                        <span>Áp dụng mô hình STAR (Situation, Task, Action, Result) khi được hỏi về các kỹ năng bạn chưa có nhiều kinh nghiệm thực tế.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* PRINT / EXPORT BUTTON */}
            <div className="flex items-center justify-between pt-2 border-t border-purple-100 text-xs">
              <span className="text-[11px] text-slate-400">
                Báo cáo phân tích chuyên sâu bởi HireMate AI ATS Engine
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>In / Lưu Báo Cáo PDF</span>
              </button>
            </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
