import React, { useState, useEffect } from 'react';
import { cvApi, applicationApi, interviewApi, paymentApi } from '../../api';

export default function ApplyJobModal({ job, user, onClose, onSuccess }) {
  const [cvList, setCvList] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [onlineTemplate, setOnlineTemplate] = useState('executive'); // 'executive' | 'harvard' | 'modern'
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [upgradeNotice, setUpgradeNotice] = useState('');

  useEffect(() => {
    if (user && (user.role === 'CANDIDATE' || user.role === 'ROLE_CANDIDATE')) {
      cvApi.getMyCvs()
        .then((res) => {
          const list = res.data || [];
          setCvList(list);
          const defaultCv = list.find((c) => c.isDefault) || list[0];
          if (defaultCv) {
            setSelectedCvId(defaultCv.cvId);
          }
        })
        .catch(() => {});

      if (paymentApi?.getMySubscription) {
        paymentApi.getMySubscription()
          .then((res) => {
            const sub = res?.data?.data || res?.data;
            if (sub) setQuotaInfo(sub);
          })
          .catch(() => {});
      }
      if (interviewApi?.getQuotaStatus) {
        interviewApi.getQuotaStatus()
          .then((res) => {
            const q = res?.data?.data || res?.data;
            if (q) setQuotaInfo((prev) => ({ ...prev, ...q }));
          })
          .catch(() => {});
      }
    }
  }, [user]);

  const isAdmin = user?.role === 'ADMIN';
  const planPrice = Number(quotaInfo?.price || quotaInfo?.plan?.price) || 0;
  const planName = (quotaInfo?.planName || quotaInfo?.plan?.name || quotaInfo?.planId || '').toLowerCase();
  let isPaidPlan = Boolean(quotaInfo?.isPaidPlan || planPrice > 0 || planName.includes('plus') || planName.includes('pro') || planName.includes('vip'));
  try {
    const cachedSub = localStorage.getItem('hiremate_candidate_subscription');
    if (cachedSub) {
      const parsed = JSON.parse(cachedSub);
      if (parsed?.planId && parsed.planId !== 'FREE') isPaidPlan = true;
    }
  } catch {}

  const ONLINE_TEMPLATES = [
    {
      id: 'executive',
      name: '2 Cột Chuẩn',
      subtitle: 'Executive Balanced',
      desc: 'Bố cục 2 cột hài hòa, avatar chuyên nghiệp, cân đối kinh nghiệm & kỹ năng.',
      badge: 'Khuyên Dùng',
      icon: 'view_column',
      accentColor: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'harvard',
      name: 'Harvard ATS',
      subtitle: '1-Column Classic',
      desc: 'Bố cục đơn cột chuẩn Ivy League, tối ưu quét máy AI 100%, chuẩn quốc tế.',
      badge: 'ATS 100%',
      icon: 'menu_book',
      accentColor: 'from-slate-700 to-slate-900',
    },
    {
      id: 'modern',
      name: 'Hiện Đại (VIP)',
      subtitle: 'Modern Editorial',
      desc: 'Header banner phong cách, nổi bật dấu ấn cá nhân, thu hút nhà tuyển dụng.',
      badge: 'VIP',
      icon: 'style',
      accentColor: 'from-[#1e1548] to-[#5b48bd]',
    },
  ];

  const handleSelectTemplate = (tplId) => {
    if (tplId === 'modern' && !isAdmin && !isPaidPlan) {
      setUpgradeNotice('Mẫu bố cục "Hiện Đại (VIP)" là đặc quyền dành riêng cho gói Practice Plus và Practice Pro. Vui lòng nâng cấp gói tại mục Bảng Giá để mở khóa mẫu này!');
      return;
    }
    setUpgradeNotice('');
    setOnlineTemplate(tplId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.hash = '#/login';
      return;
    }

    if (!selectedCvId || cvList.length === 0) {
      setError('Vui lòng tải lên hoặc tạo ít nhất 1 bản CV trong Hồ sơ cá nhân trước khi ứng tuyển!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedTplObj = ONLINE_TEMPLATES.find((t) => t.id === onlineTemplate);
      const templateTag = `[CV_TEMPLATE:${onlineTemplate}][Định dạng nộp: CV Online - Mẫu ${selectedTplObj?.name || '2 Cột Chuẩn'}]`;

      try {
        localStorage.setItem(`candidate_applied_template_${job.jobId}`, onlineTemplate);
        if (user?.userId) localStorage.setItem(`candidate_applied_template_candidate_${user.userId}`, onlineTemplate);
        localStorage.setItem('candidate_latest_applied_template', onlineTemplate);
      } catch (cacheErr) {}

      const finalCoverLetter = coverLetter.trim()
        ? `${templateTag}\n\n${coverLetter.trim()}`
        : templateTag;

      await applicationApi.applyJob({
        jobId: job.jobId,
        cvId: selectedCvId,
        coverLetter: finalCoverLetter,
      });
      try {
        sessionStorage.removeItem('hiremate_cached_applications');
      } catch (cacheErr) {}
      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Không thể nộp đơn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-xl bg-white border border-purple-100 rounded-[32px] p-6 sm:p-7 shadow-2xl text-[#221d47] max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-sans font-extrabold text-[#221d47] mb-1">
          Nộp hồ sơ ứng tuyển
        </h2>
        <p className="text-xs text-slate-500 mb-5 font-sans">
          Vị trí: <span className="text-[#5b48bd] font-bold">{job.title}</span> ({job.companyName || 'HireMate Partner'})
        </p>

        {submitted ? (
          <div className="py-8 text-center font-sans">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-[#10b981] border border-emerald-200 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-sans font-bold text-[#221d47] mb-1">Nộp hồ sơ thành công!</h3>
            <p className="text-xs text-slate-500 font-sans">Nhà tuyển dụng sẽ nhận được hồ sơ của bạn ngay lập tức.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            {/* BƯỚC 1: CHỌN TỆP CV NGUỒN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#221d47] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#5b48bd] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Chọn tệp CV của bạn</span>
                </label>
                {cvList.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Đã tìm thấy {cvList.length} tệp
                  </span>
                )}
              </div>

              {cvList.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {cvList.map((cv) => (
                    <label
                      key={cv.cvId}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                        selectedCvId === cv.cvId
                          ? 'bg-[#edeafd] border-[#5b48bd] text-[#5b48bd] font-bold shadow-2xs'
                          : 'bg-[#f8f7ff] border-purple-100 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="radio"
                          name="cvSelect"
                          checked={selectedCvId === cv.cvId}
                          onChange={() => setSelectedCvId(cv.cvId)}
                          className="accent-[#5b48bd]"
                        />
                        <span className="material-symbols-outlined text-base text-[#5b48bd]">description</span>
                        <span className="truncate">{cv.fileName}</span>
                      </div>
                      {cv.isDefault && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans font-bold shrink-0">
                          Mặc định
                        </span>
                      )}
                    </label>
                  ))}
                  {cvList.length >= 2 && !isPaidPlan && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-[15px] text-amber-600 shrink-0">info</span>
                        <span className="truncate">Lưu trữ: 2/2 bản CV (Gói Free). Xóa bớt hoặc nâng cấp để lưu thêm.</span>
                      </div>
                      <a
                        href="#/pricing"
                        className="text-[#5b48bd] hover:text-[#47369f] font-bold underline shrink-0 cursor-pointer"
                      >
                        Nâng gói
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 text-center text-xs text-slate-500 font-sans">
                  <p className="mb-2">Bạn chưa có CV nào trong hồ sơ.</p>
                  <a
                    href="#/candidate-profile"
                    className="text-[#5b48bd] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Tải lên hoặc tạo CV tại Hồ sơ cá nhân
                  </a>
                </div>
              )}
            </div>

            {/* BƯỚC 2: CHỌN KIỂU DẠNG CV ONLINE */}
            <div className="pt-1">
              <label className="text-xs font-bold text-[#221d47] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#5b48bd] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                <span>Chọn kiểu dạng file CV Online (3 Mẫu Bố Cục)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ONLINE_TEMPLATES.map((tpl) => {
                  const isSelected = onlineTemplate === tpl.id;
                  const isLocked = tpl.id === 'modern' && !isAdmin && !isPaidPlan;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                        isSelected
                          ? 'bg-purple-50/70 border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-xs'
                          : isLocked
                          ? 'bg-slate-50/80 border-slate-200 opacity-85 hover:border-purple-200'
                          : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-[#faf9ff]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tpl.accentColor} text-white flex items-center justify-center text-xs shadow-2xs`}>
                            <span className="material-symbols-outlined text-[15px]">{tpl.icon}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            tpl.id === 'modern'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isSelected
                              ? 'bg-[#5b48bd] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tpl.id === 'modern' ? '👑 VIP' : tpl.badge}
                          </span>
                        </div>
                        <strong className="text-xs font-extrabold text-[#1e1b4b] block">
                          {tpl.name}
                        </strong>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {tpl.desc}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#5b48bd]">
                        <span className="material-symbols-outlined text-sm">
                          {isLocked ? 'lock' : isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <span>{isLocked ? 'Yêu cầu VIP' : isSelected ? 'Đang chọn' : 'Chọn mẫu'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {upgradeNotice && (
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-base text-amber-600 shrink-0">workspace_premium</span>
                    <span>{upgradeNotice}</span>
                  </div>
                  <a
                    href="#/candidate-pricing"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shrink-0 text-[11px] transition-colors"
                  >
                    Nâng cấp
                  </a>
                </div>
              )}
            </div>

            {/* Cover letter */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-[#221d47] uppercase tracking-wider mb-1.5">
                Thư giới thiệu (Cover Letter)
              </label>
              <textarea
                rows={3}
                placeholder="Nêu bật lý do bạn phù hợp với vị trí này và những kinh nghiệm tương đồng..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full bg-[#f8f7ff] border border-purple-200 rounded-2xl p-3 text-xs text-[#221d47] placeholder-slate-400 focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 transition-all font-sans"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || cvList.length === 0 || !selectedCvId}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#5b48bd] hover:bg-[#47369f] shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-2"
                title={cvList.length === 0 || !selectedCvId ? 'Vui lòng chọn 1 bản CV để nộp' : ''}
              >
                {loading ? 'Đang gửi...' : 'Xác nhận nộp hồ sơ'}
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
