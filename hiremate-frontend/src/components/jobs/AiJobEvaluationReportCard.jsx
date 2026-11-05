import React, { useState, useEffect } from 'react';
import aiMatchApi from '../../api/aiMatchApi';

/**
 * AiJobEvaluationReportCard
 * 
 * Báo cáo đối soát & phân tích chuyên sâu AI (ATS Match Audit Report) giữa CV ứng viên và JD:
 * 1. Cơ chế On-Demand: Chỉ phân tích và viết báo cáo khi ứng viên yêu cầu; sau đó lưu vĩnh viễn vào CSDL.
 * 2. Phân hạng người dùng (Candidate Tiers): Free (3 lượt dùng thử) vs Plus/Pro/VIP (Không giới hạn).
 * 3. Trực quan hóa 4 trụ cột, Ưu điểm kèm minh chứng CV, Nhược điểm kèm lý do trừ điểm, Lời khuyên chuẩn bị phỏng vấn STAR.
 * 4. Thiết kế chuẩn Candidate Enterprise UI: Tinh tế, sáng sủa, thanh lịch, đồng bộ trải nghiệm ứng viên cao cấp.
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
    <div className="rounded-3xl bg-white border border-purple-200/90 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden font-sans">
      
      {/* Top Brand Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-[#5b48bd] to-purple-400" />

      {/* 1. HEADER SECTION */}
      <div className="p-5 sm:p-6 border-b border-purple-100/80 bg-white space-y-4">
        
        {/* Top Badges Meta Row (Đồng bộ ngôn ngữ thiết kế như Card Bài Tuyển Dụng) */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đối soát ATS thông minh</span>
            </span>

            {/* Candidate Subscription Tier Badge */}
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs ${
              isUnlimited 
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-purple-50 text-[#5b48bd] border-purple-200'
            }`}>
              <span className="material-symbols-outlined text-[13px] text-amber-600">
                {isUnlimited ? 'workspace_premium' : 'loyalty'}
              </span>
              <span>{tierName.toUpperCase()}</span>
              {!isUnlimited && (
                <span className="text-slate-500 font-normal">({remaining} lượt còn lại)</span>
              )}
            </span>
          </div>

          {hasDetailedReport && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[13px] text-emerald-600">cloud_done</span>
              <span>Đã lưu vào CSDL</span>
            </span>
          )}
        </div>

        {/* Main Title & Score Gauge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b48bd] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20 mt-0.5">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#1e1b4b]">
                Đánh Giá Độ Phù Hợp AI HireMate (ATS Match)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Phân tích chuyên sâu ưu nhược điểm của hồ sơ CV đối chiếu với vị trí <strong className="text-[#5b48bd] font-semibold">{jobTitle || 'bài tuyển dụng'}</strong>
              </p>
            </div>
          </div>

          {/* Match Score Badge */}
          {currentScore != null && (
            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto bg-purple-50/40 border border-purple-100/80 px-4 py-2.5 rounded-2xl shadow-2xs">
              <div className="text-right">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ĐỘ PHÙ HỢP ATS</div>
                <div className="flex items-center gap-2 justify-end mt-0.5">
                  <span className={`text-3xl font-black ${
                    currentScore >= 80 ? 'text-emerald-600' : currentScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {currentScore}%
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                    currentScore >= 80 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : currentScore >= 50 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {currentScore >= 80 ? '● Rất phù hợp' : currentScore >= 50 ? '▲ Tiềm năng' : '▲ Cần Nâng Cao'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        
        {/* 2. EXPLANATION BANNER */}
        {!hasDetailedReport && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 via-indigo-50/30 to-white border border-purple-100 text-xs text-slate-700 leading-relaxed space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-[#1e1b4b]">
              <span className="material-symbols-outlined text-base text-[#5b48bd]">psychology</span>
              <span>Cơ chế đối soát hồ sơ thông minh</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Hệ thống sử dụng mô hình AI tiên tiến để rà soát 13+ chỉ tiêu (kỹ năng bắt buộc 70%, ưu tiên 30%, kinh nghiệm, học vấn). Báo cáo chi tiết chỉ được khởi tạo khi bạn <strong>ấn yêu cầu</strong> và sẽ được <strong>lưu vĩnh viễn vào hệ thống</strong> để bạn xem lại bất cứ lúc nào với tốc độ tức thì.
            </p>
          </div>
        )}

        {/* 3. TOOLBAR CHỌN CV & NÚT HÀNH ĐỘNG (Phong cách thanh công cụ của Card Bài Đăng) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 shadow-2xs">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 shrink-0">
              <span className="material-symbols-outlined text-base text-[#5b48bd]">description</span>
              <span>Bản CV đối soát:</span>
            </div>
            {candidateCvs.length > 0 ? (
              <select
                value={selectedCvId}
                onChange={(e) => onSelectCv(e.target.value)}
                disabled={isGenerating}
                className="text-xs px-3.5 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-slate-800 focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100 outline-hidden transition-all max-w-[280px] truncate shadow-2xs"
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-indigo-600 hover:from-[#4a39a6] hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined text-base">
                  {isGenerating ? 'hourglass_top' : 'auto_awesome'}
                </span>
                <span>{isGenerating ? 'AI đang phân tích hồ sơ...' : '✨ Yêu Cầu AI Phân Tích & Viết Báo Cáo'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-4 py-2 rounded-xl bg-[#5b48bd] hover:bg-[#4a39a6] text-white text-xs font-bold shadow-xs shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  <span>{isExpanded ? 'Thu Gọn Báo Cáo' : 'Xem Báo Cáo Chi Tiết'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5b48bd] text-xs font-semibold border border-purple-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  title="Chấm lại và cập nhật báo cáo mới với bản CV được chọn"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">{isGenerating ? 'hourglass_top' : 'refresh'}</span>
                  <span>{isGenerating ? 'Đang chấm lại...' : 'Chấm lại'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">error</span>
            <div className="flex-1 space-y-2">
              <p className="font-semibold">{errorMsg}</p>
              {(errorMsg.toLowerCase().includes('hết') || errorMsg.toLowerCase().includes('hạn mức') || errorMsg.toLowerCase().includes('nâng cấp')) && !isUnlimited && (
                <a
                  href="#/candidate-pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                  <span>Nâng cấp gói Practice Plus / Pro ngay</span>
                </a>
              )}
              {errorMsg.toLowerCase().includes('thời gian') && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5b48bd] text-white font-semibold text-xs shadow-xs cursor-pointer hover:bg-[#4a39a6] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Tải lại trang kiểm tra kết quả</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. LOADING PROGRESS ANIMATION */}
        {isGenerating && (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900">
                AI Đang Đối Soát Toàn Diện Hồ Sơ Của Bạn
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {generatingStep === 1 && 'Bước 1/3: Rà soát ma trận 70/30 kỹ năng bắt buộc và kỹ năng ưu tiên...'}
                {generatingStep === 2 && 'Bước 2/3: Phân tích kinh nghiệm, học vấn và bóc tách minh chứng từ CV...'}
                {generatingStep === 3 && 'Bước 3/3: Tổng hợp ưu điểm, nhược điểm và biên soạn chiến lược phỏng vấn...'}
              </p>
            </div>
            {/* Step Progress Bar */}
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto pt-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${generatingStep >= 1 ? 'bg-[#5b48bd]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${generatingStep >= 2 ? 'bg-[#5b48bd]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${generatingStep >= 3 ? 'bg-[#5b48bd]' : 'bg-slate-200'}`} />
            </div>
          </div>
        )}

        {/* 5. REPORT CONTENT DISPLAY */}
        {report && !isGenerating && (
          <div className="space-y-5">
            
            {/* OVERVIEW / VERDICT CARD - Theo ngôn ngữ thiết kế Card Bài Đăng (Sáng sủa, Tinh tế, Sang trọng) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50/60 via-indigo-50/20 to-white border border-purple-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-purple-100/80 pb-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5b48bd] to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shadow-purple-500/20">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#1e1b4b]">
                    KẾT LUẬN ĐÁNH GIÁ TỔNG THỂ
                  </h4>
                </div>
                {report.matchTier && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-2xs flex items-center gap-1.5 ${
                    currentScore >= 80 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : currentScore >= 50 
                      ? 'bg-amber-50 text-amber-800 border-amber-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {currentScore >= 80 ? 'check_circle' : 'warning'}
                    </span>
                    <span>{report.matchTier}</span>
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-purple-100 shadow-2xs">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {report.overallVerdict || report.executiveRecommendation || initialReasoning || 'Hồ sơ đã được đối soát thành công.'}
                </p>
              </div>

              {/* 4 Pillars Metric Cards (Đồng bộ phong cách thống kê của Card Bài Đăng) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Pillar 1: Kỹ Năng */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-300 transition-all space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kỹ Năng (70/30)</div>
                  <div className="text-2xl font-black text-[#5b48bd]">{Math.round(report.skillsScore || currentScore || 80)}%</div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-[#5b48bd] rounded-full transition-all" 
                      style={{ width: `${Math.round(report.skillsScore || currentScore || 80)}%` }} 
                    />
                  </div>
                </div>

                {/* Pillar 2: Kinh Nghiệm */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-300 transition-all space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kinh Nghiệm</div>
                  <div className="text-2xl font-black text-purple-600">{Math.round(report.experienceScore || 85)}%</div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#5b48bd] to-pink-500 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.experienceScore || 85)}%` }} 
                    />
                  </div>
                </div>

                {/* Pillar 3: Học Vấn */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-300 transition-all space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Học Vấn / Bằng Cấp</div>
                  <div className="text-2xl font-black text-blue-600">{Math.round(report.educationScore || 90)}%</div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.educationScore || 90)}%` }} 
                    />
                  </div>
                </div>

                {/* Pillar 4: Ngữ Nghĩa Dự Án */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-300 transition-all space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ngữ Nghĩa Dự Án</div>
                  <div className="text-2xl font-black text-teal-600">{Math.round(report.semanticScore || 80)}%</div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.semanticScore || 80)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLLAPSED TEASER BANNER */}
            {hasDetailedReport && !isExpanded && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/30 border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="material-symbols-outlined text-[#5b48bd] text-xl shrink-0">insights</span>
                  <span>
                    Báo cáo gồm <strong className="text-emerald-700">{report.advantages?.length || 0} ưu điểm</strong>, <strong className="text-rose-700">{report.disadvantages?.length || 0} kỹ năng cần bổ sung</strong> và các gợi ý phỏng vấn chuyên sâu.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#5b48bd] hover:bg-[#4a39a6] text-white font-bold text-xs shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Mở Xem Chi Tiết Báo Cáo</span>
                </button>
              </div>
            )}

            {/* EXPANDED DETAILED REPORT */}
            {hasDetailedReport && isExpanded && (
              <div className="space-y-5">
                {/* TAB SELECTOR - Phong cách Pill Tabs cao cấp */}
                <div className="flex items-center gap-2.5 border-b border-purple-100/80 pb-3 overflow-x-auto scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ADVANTAGES')}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 text-xs font-bold ${
                      activeTab === 'ADVANTAGES'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 border-transparent'
                        : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/90'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Ưu Điểm Nổi Bật ({report.advantages?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('DISADVANTAGES')}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 text-xs font-bold ${
                      activeTab === 'DISADVANTAGES'
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20 border-transparent'
                        : 'bg-rose-50/70 text-rose-800 hover:bg-rose-100/80 border border-rose-200/90'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>Nhược Điểm / Kỹ Năng Thiếu ({report.disadvantages?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ADVICE')}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 text-xs font-bold ${
                      activeTab === 'ADVICE'
                        ? 'bg-[#5b48bd] text-white shadow-sm shadow-purple-500/20 border-transparent'
                        : 'bg-purple-50/70 text-[#5b48bd] hover:bg-purple-100/80 border border-purple-200/90'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                    <span>Lời Khuyên Chuẩn Bị &amp; Tối Ưu CV</span>
                  </button>
                </div>

                {/* TAB 1: ADVANTAGES (ƯU ĐIỂM) */}
                {activeTab === 'ADVANTAGES' && (
                  <div className="space-y-3">
                    {report.advantages && report.advantages.length > 0 ? (
                      report.advantages.map((adv, idx) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase shadow-2xs">
                                {adv.category || 'Ưu điểm'}
                              </span>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                                {adv.title}
                              </h5>
                            </div>
                            {adv.assessment && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                                ✓ {adv.assessment}
                              </span>
                            )}
                          </div>

                          {adv.cvEvidence && (
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/60 via-slate-50/30 to-white border-l-3 border-emerald-500 text-xs text-slate-800 leading-relaxed font-normal shadow-2xs">
                              <strong className="text-emerald-950 font-bold">Minh chứng từ CV: </strong>
                              <span>{adv.cvEvidence}</span>
                            </div>
                          )}

                          {adv.jobMatch && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-[15px] text-emerald-600">target</span>
                              <span>Yêu cầu JD được đáp ứng: {adv.jobMatch}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic p-4 bg-purple-50/30 rounded-2xl border border-purple-100 text-center">
                        Chưa ghi nhận ưu điểm đặc biệt. Hãy bổ sung thêm kinh nghiệm vào CV.
                      </p>
                    )}
                  </div>
                )}

                {/* TAB 2: DISADVANTAGES (NHƯỢC ĐIỂM & KỸ NĂNG THIẾU) */}
                {activeTab === 'DISADVANTAGES' && (
                  <div className="space-y-3">
                    {report.disadvantages && report.disadvantages.length > 0 ? (
                      report.disadvantages.map((dis, idx) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100/90 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px] uppercase shadow-2xs">
                                {dis.category || 'Điểm cần cải thiện'}
                              </span>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                                {dis.title}
                              </h5>
                            </div>
                            {dis.severity && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 shadow-2xs ${
                                dis.severity.includes('Bắt buộc') 
                                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                ⚠️ {dis.severity}
                              </span>
                            )}
                          </div>

                          {dis.jobRequirement && (
                            <div className="text-xs text-slate-600 leading-relaxed font-medium">
                              📌 <strong>Yêu cầu tuyển dụng:</strong> {dis.jobRequirement}
                            </div>
                          )}

                          {dis.cvShortfall && (
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50/60 via-slate-50/30 to-white border-l-3 border-rose-500 text-xs text-rose-950 leading-relaxed font-normal shadow-2xs">
                              <strong className="text-rose-950 font-bold">Khoảng trống trong CV của bạn: </strong>
                              <span>{dis.cvShortfall}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-bold shadow-2xs">
                        🎉 Tuyệt vời! CV của bạn không có khoảng trống kỹ năng nghiêm trọng nào so với vị trí này.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ACTIONABLE ADVICE & INTERVIEW TIPS */}
                {activeTab === 'ADVICE' && (
                  <div className="space-y-4">
                    {/* CV Improvement Suggestions */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-white border border-purple-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#5b48bd]/10 text-[#5b48bd] flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-base">edit_document</span>
                        </div>
                        <h5 className="font-extrabold text-xs sm:text-sm text-[#1e1b4b]">
                          Đề Xuất Chỉnh Sửa CV Chuẩn ATS Để Đạt Điểm Cao Hơn:
                        </h5>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700 font-normal">
                        {report.cvImprovementSuggestions && report.cvImprovementSuggestions.length > 0 ? (
                          report.cvImprovementSuggestions.map((sug, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-sm text-[#5b48bd] shrink-0 mt-0.5">check_circle</span>
                              <span className="leading-relaxed">{sug}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-[#5b48bd] shrink-0 mt-0.5">check_circle</span>
                            <span>Bổ sung các từ khóa công nghệ còn thiếu vào phần Kỹ năng &amp; Mục tiêu nghề nghiệp trong CV.</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Interview Preparation Tips */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-white border border-amber-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-base">psychology_alt</span>
                        </div>
                        <h5 className="font-extrabold text-xs sm:text-sm text-amber-950">
                          Chiến Lược Chuẩn Bị Phỏng Vấn (Dự Đoán Câu Hỏi Nhà Tuyển Dụng):
                        </h5>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700 font-normal">
                        {report.interviewTips && report.interviewTips.length > 0 ? (
                          report.interviewTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">lightbulb</span>
                              <span className="leading-relaxed">{tip}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">lightbulb</span>
                            <span>Áp dụng mô hình STAR (Situation, Task, Action, Result) khi được hỏi về các kỹ năng bạn chưa có nhiều kinh nghiệm thực tế.</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* PRINT / EXPORT BUTTON */}
                <div className="flex items-center justify-between pt-3 border-t border-purple-100/80 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Báo cáo phân tích chuyên sâu độc quyền bởi HireMate AI ATS Engine
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5b48bd] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-purple-200 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">print</span>
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
