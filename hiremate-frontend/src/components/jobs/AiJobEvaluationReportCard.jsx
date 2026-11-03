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
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900">
                Đánh Giá Độ Phù Hợp Hồ Sơ (ATS Match AI)
              </h3>
              
              {/* Candidate Subscription Tier Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                isUnlimited 
                  ? 'bg-amber-50 text-amber-900 border-amber-200 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
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
            
            <p className="text-xs text-slate-500 mt-1">
              Phân tích chuyên sâu mức độ tương thích giữa CV của bạn và yêu cầu vị trí <strong className="text-slate-700">{jobTitle || 'bài tuyển dụng'}</strong>
            </p>
          </div>
        </div>

        {/* Match Score Badge */}
        {currentScore != null && (
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Độ Phù Hợp ATS</div>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                <span className={`text-2xl font-black ${
                  currentScore >= 80 ? 'text-emerald-600' : currentScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {currentScore}%
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  currentScore >= 80 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : currentScore >= 50 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {currentScore >= 80 ? '● Rất phù hợp' : currentScore >= 50 ? '● Tiềm năng' : '● Cần trau dồi'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        
        {/* 2. EXPLANATION BANNER (Thân thiện, rõ ràng, không nặng nề) */}
        {!hasDetailedReport && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="material-symbols-outlined text-base text-indigo-600">psychology</span>
              <span>Cơ chế đối soát hồ sơ thông minh</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Hệ thống sử dụng mô hình AI tiên tiến để rà soát 13+ chỉ tiêu (kỹ năng bắt buộc 70%, ưu tiên 30%, kinh nghiệm, học vấn). Báo cáo chi tiết chỉ được khởi tạo khi bạn <strong>ấn yêu cầu</strong> và sẽ được <strong>lưu vĩnh viễn vào hệ thống</strong> để bạn xem lại bất cứ lúc nào với tốc độ tức thì.
            </p>
          </div>
        )}

        {/* 3. TOOLBAR CHỌN CV & NÚT HÀNH ĐỘNG */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-xs font-medium text-slate-600 shrink-0">Bản CV đối soát:</span>
            {candidateCvs.length > 0 ? (
              <select
                value={selectedCvId}
                onChange={(e) => onSelectCv(e.target.value)}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all max-w-[280px] truncate shadow-2xs"
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
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
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
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#5b48bd] hover:bg-[#4a39a6] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">
                  {isGenerating ? 'hourglass_top' : 'auto_awesome'}
                </span>
                <span>{isGenerating ? 'AI đang phân tích hồ sơ...' : '✨ Yêu Cầu AI Phân Tích & Viết Báo Cáo'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">cloud_done</span>
                  <span>Đã lưu vào CSDL</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-slate-500">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  <span>{isExpanded ? 'Thu Gọn Báo Cáo' : 'Xem Báo Cáo Chi Tiết'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Chấm lại và cập nhật báo cáo mới với bản CV được chọn"
                >
                  <span className="material-symbols-outlined text-[15px] text-slate-500">{isGenerating ? 'hourglass_top' : 'refresh'}</span>
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
            
            {/* OVERVIEW / VERDICT CARD - Light Executive Design (No dark purple box!) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">psychology</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Kết Luận Đánh Giá Tổng Thể Từ AI
                  </span>
                </div>
                {report.matchTier && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200/90 shadow-2xs">
                    {report.matchTier}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {report.overallVerdict || report.executiveRecommendation || initialReasoning || 'Hồ sơ đã được đối soát thành công.'}
              </p>

              {/* 4 Pillars Metric Cards with Mini Progress Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Pillar 1: Kỹ Năng */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">Kỹ Năng (70/30)</div>
                  <div className="text-xl font-bold text-slate-900">{Math.round(report.skillsScore || currentScore || 80)}%</div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.skillsScore || currentScore || 80)}%` }} 
                    />
                  </div>
                </div>

                {/* Pillar 2: Kinh Nghiệm */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">Kinh Nghiệm</div>
                  <div className="text-xl font-bold text-slate-900">{Math.round(report.experienceScore || 85)}%</div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.experienceScore || 85)}%` }} 
                    />
                  </div>
                </div>

                {/* Pillar 3: Học Vấn */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">Học Vấn / Bằng Cấp</div>
                  <div className="text-xl font-bold text-slate-900">{Math.round(report.educationScore || 90)}%</div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.educationScore || 90)}%` }} 
                    />
                  </div>
                </div>

                {/* Pillar 4: Ngữ Nghĩa Dự Án */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">Ngữ Nghĩa Dự Án</div>
                  <div className="text-xl font-bold text-slate-900">{Math.round(report.semanticScore || 80)}%</div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 rounded-full transition-all" 
                      style={{ width: `${Math.round(report.semanticScore || 80)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLLAPSED TEASER BANNER */}
            {hasDetailedReport && !isExpanded && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="material-symbols-outlined text-indigo-600 text-lg shrink-0">insights</span>
                  <span>
                    Báo cáo gồm <strong>{report.advantages?.length || 0} ưu điểm</strong>, <strong>{report.disadvantages?.length || 0} kỹ năng cần bổ sung</strong> và các gợi ý phỏng vấn chuyên sâu.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="px-4 py-2 rounded-lg bg-[#5b48bd] hover:bg-[#4a39a6] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Mở Xem Chi Tiết Báo Cáo</span>
                </button>
              </div>
            )}

            {/* EXPANDED DETAILED REPORT */}
            {hasDetailedReport && isExpanded && (
              <div className="space-y-5">
                {/* TAB SELECTOR - Clean enterprise segmented style */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ADVANTAGES')}
                    className={`px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 text-xs font-semibold ${
                      activeTab === 'ADVANTAGES'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Ưu Điểm Nổi Bật ({report.advantages?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('DISADVANTAGES')}
                    className={`px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 text-xs font-semibold ${
                      activeTab === 'DISADVANTAGES'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    <span>Kỹ Năng Cần Bổ Sung ({report.disadvantages?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ADVICE')}
                    className={`px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 text-xs font-semibold ${
                      activeTab === 'ADVICE'
                        ? 'bg-[#5b48bd] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">tips_and_updates</span>
                    <span>Chiến Lược Tối Ưu CV &amp; Phỏng Vấn</span>
                  </button>
                </div>

                {/* TAB 1: ADVANTAGES (ƯU ĐIỂM) */}
                {activeTab === 'ADVANTAGES' && (
                  <div className="space-y-3">
                    {report.advantages && report.advantages.length > 0 ? (
                      report.advantages.map((adv, idx) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-200 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[10px] uppercase">
                                {adv.category || 'Ưu điểm'}
                              </span>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                                {adv.title}
                              </h5>
                            </div>
                            {adv.assessment && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                ✓ {adv.assessment}
                              </span>
                            )}
                          </div>

                          {adv.cvEvidence && (
                            <div className="p-3 rounded-xl bg-slate-50 border-l-2 border-emerald-500 text-xs text-slate-700 leading-relaxed font-normal">
                              <strong className="text-slate-900 font-semibold">Minh chứng từ CV: </strong>
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
                      <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
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
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-200 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/60 font-semibold text-[10px] uppercase">
                                {dis.category || 'Điểm cần cải thiện'}
                              </span>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                                {dis.title}
                              </h5>
                            </div>
                            {dis.severity && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
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
                            <div className="p-3 rounded-xl bg-rose-50/50 border-l-2 border-rose-400 text-xs text-rose-900 leading-relaxed font-medium">
                              🔍 <strong>Khoảng trống trong CV của bạn:</strong> {dis.cvShortfall}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-semibold">
                        🎉 Tuyệt vời! CV của bạn không có khoảng trống kỹ năng nghiêm trọng nào so với vị trí này.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ACTIONABLE ADVICE & INTERVIEW TIPS */}
                {activeTab === 'ADVICE' && (
                  <div className="space-y-4">
                    {/* CV Improvement Suggestions */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-indigo-600">edit_document</span>
                        <span>Đề Xuất Chỉnh Sửa CV Chuẩn ATS Để Đạt Điểm Cao Hơn:</span>
                      </h5>
                      <ul className="space-y-2 text-xs text-slate-700 font-normal">
                        {report.cvImprovementSuggestions && report.cvImprovementSuggestions.length > 0 ? (
                          report.cvImprovementSuggestions.map((sug, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-sm text-indigo-600 shrink-0 mt-0.5">check_circle</span>
                              <span className="leading-relaxed">{sug}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-indigo-600 shrink-0 mt-0.5">check_circle</span>
                            <span>Bổ sung các từ khóa công nghệ còn thiếu vào phần Kỹ năng & Mục tiêu nghề nghiệp trong CV.</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Interview Preparation Tips */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-amber-600">psychology_alt</span>
                        <span>Chiến Lược Chuẩn Bị Phỏng Vấn (Dự Đoán Câu Hỏi Nhà Tuyển Dụng):</span>
                      </h5>
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
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Báo cáo phân tích chuyên sâu bởi HireMate AI ATS Engine
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-500">print</span>
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
