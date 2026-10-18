import React, { useState, useEffect } from 'react';
import { cvApi, applicationApi } from '../../api';

export default function ApplyJobModal({ job, user, onClose, onSuccess }) {
  const [cvList, setCvList] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [onlineTemplate, setOnlineTemplate] = useState('executive'); // 'executive' | 'harvard' | 'modern'
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user && user.role === 'CANDIDATE') {
      cvApi.getMyCvs()
        .then((res) => {
          const list = res.data || [];
          setCvList(list);
          const defaultCv = list.find((c) => c.isDefault) || list[0];
          if (defaultCv) {
            setSelectedCvId(defaultCv.cvId);
          }
        })
        .catch(() => {
          // If unauthenticated or no cvs
        });
    }
  }, [user]);

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
      name: 'Hiện Đại',
      subtitle: 'Modern Editorial',
      desc: 'Header banner phong cách, nổi bật dấu ấn cá nhân, thu hút nhà tuyển dụng.',
      badge: 'Nổi Bật',
      icon: 'style',
      accentColor: 'from-[#1e1548] to-[#5b48bd]',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.hash = '#/login';
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
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 text-center text-xs text-slate-500 font-sans">
                  <p className="mb-2">Bạn chưa có CV nào trong hồ sơ.</p>
                  <a
                    href="#/candidate-dashboard"
                    className="text-[#5b48bd] hover:underline font-bold"
                  >
                    + Tải lên CV mới tại Dashboard
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
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setOnlineTemplate(tpl.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                        isSelected
                          ? 'bg-purple-50/70 border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-[#faf9ff]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tpl.accentColor} text-white flex items-center justify-center text-xs shadow-2xs`}>
                            <span className="material-symbols-outlined text-[15px]">{tpl.icon}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isSelected ? 'bg-[#5b48bd] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tpl.badge}
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
                          {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <span>{isSelected ? 'Đang chọn' : 'Chọn mẫu'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                disabled={loading}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#5b48bd] hover:bg-[#47369f] shadow-md hover:scale-[1.02] disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
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
