import React, { useState, useEffect } from 'react';
import { cvApi, applicationApi } from '../../api';

export default function ApplyJobModal({ job, user, onClose, onSuccess }) {
  const [cvList, setCvList] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.hash = '#/login';
      return;
    }

    setLoading(true);
    setError('');

    try {
      await applicationApi.applyJob({
        jobId: job.jobId,
        cvId: selectedCvId,
        coverLetter: coverLetter.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-botanical-forest/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-botanical-stone rounded-3xl p-6 sm:p-8 shadow-soft-xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 hover:bg-white border border-botanical-stone text-botanical-forest/60 hover:text-botanical-forest flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        <h2 className="text-2xl font-serif font-bold text-botanical-forest mb-1">
          Nộp hồ sơ ứng tuyển
        </h2>
        <p className="text-xs text-botanical-forest/70 mb-6 font-sans">
          Vị trí: <span className="text-botanical-terracotta font-semibold">{job.title}</span> ({job.companyName || 'HireMate Partner'})
        </p>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/40 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl text-botanical-sage">check_circle</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-botanical-forest mb-1">Nộp hồ sơ thành công!</h3>
            <p className="text-xs text-botanical-forest/70 font-sans">Nhà tuyển dụng sẽ nhận được hồ sơ của bạn ngay lập tức.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            {/* Select CV */}
            <div>
              <label className="block text-xs font-semibold text-botanical-forest uppercase tracking-wider mb-2">
                Chọn CV ứng tuyển
              </label>
              {cvList.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cvList.map((cv) => (
                    <label
                      key={cv.cvId}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                        selectedCvId === cv.cvId
                          ? 'bg-botanical-sage/15 border-botanical-sage text-botanical-forest font-medium'
                          : 'bg-white border-botanical-stone text-botanical-forest/70 hover:bg-[#F2F0EB]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="radio"
                          name="cvSelect"
                          checked={selectedCvId === cv.cvId}
                          onChange={() => setSelectedCvId(cv.cvId)}
                          className="accent-botanical-forest"
                        />
                        <span className="material-symbols-outlined text-base text-botanical-sage">description</span>
                        <span className="truncate">{cv.fileName}</span>
                      </div>
                      {cv.isDefault && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30 font-sans">
                          Mặc định
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-botanical-stone text-center text-xs text-botanical-forest/70">
                  <p className="mb-2">Bạn chưa có CV nào trong hồ sơ.</p>
                  <a
                    href="#/candidate-dashboard"
                    className="text-botanical-terracotta hover:underline font-semibold"
                  >
                    + Tải lên CV mới tại Dashboard
                  </a>
                </div>
              )}
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-xs font-semibold text-botanical-forest uppercase tracking-wider mb-2">
                Thư giới thiệu (Cover Letter)
              </label>
              <textarea
                rows={4}
                placeholder="Nêu bật lý do bạn phù hợp với vị trí này và những kinh nghiệm tương đồng..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full bg-white border border-botanical-stone rounded-2xl p-3 text-xs text-botanical-forest placeholder-botanical-forest/40 focus:outline-none focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-botanical-secondary !text-xs !py-2.5 !px-5 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-botanical-primary !text-xs !py-2.5 !px-6 disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
