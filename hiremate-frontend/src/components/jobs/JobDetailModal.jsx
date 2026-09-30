import React from 'react';

export default function JobDetailModal({ job, onClose, onApply }) {
  if (!job) return null;

  const formatSalary = (min, max) => {
    if (job.salaryText) return job.salaryText;
    if (!min && !max) return 'Thỏa thuận theo năng lực';
    if (min && !max) return `Từ ${Number(min).toLocaleString('vi-VN')} đ / tháng`;
    if (!min && max) return `Lên tới ${Number(max).toLocaleString('vi-VN')} đ / tháng`;
    return `${Number(min).toLocaleString('vi-VN')} - ${Number(max).toLocaleString('vi-VN')} đ / tháng`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-botanical-forest/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#FAF9F5] border border-botanical-stone rounded-3xl p-6 sm:p-8 overflow-y-auto shadow-soft-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 hover:bg-white border border-botanical-stone text-botanical-forest/60 hover:text-botanical-forest flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header Details */}
        <div className="flex items-start gap-4 mb-6 pr-10">
          <div className="w-16 h-16 rounded-2xl bg-botanical-sage/20 border border-botanical-stone flex items-center justify-center font-serif font-bold text-botanical-forest text-2xl overflow-hidden shrink-0 shadow-soft">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
            ) : (
              <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C'}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-botanical-forest mb-1">
              {job.title}
            </h2>
            <p className="text-sm font-medium text-botanical-terracotta">
              {job.companyName || 'HireMate Partner'}
            </p>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-white border border-botanical-stone shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-botanical-terracotta">payments</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-botanical-forest/60">Mức lương</p>
              <p className="text-xs font-bold text-botanical-forest">{formatSalary(job.salaryMin, job.salaryMax)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-botanical-sage">location_on</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-botanical-forest/60">Địa điểm</p>
              <p className="text-xs font-bold text-botanical-forest">{job.location || 'Toàn quốc'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-botanical-forest">work</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-botanical-forest/60">Hình thức</p>
              <p className="text-xs font-bold text-botanical-forest">{job.employmentType || 'Toàn thời gian'}</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-sm text-botanical-forest">
          <div>
            <h3 className="text-xs font-bold text-botanical-forest uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-botanical-sage"></span>
              Mô tả công việc
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-botanical-stone whitespace-pre-line leading-relaxed text-botanical-forest/80 text-xs">
              {job.description || 'Chưa có thông tin mô tả chi tiết.'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-botanical-forest uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-botanical-terracotta"></span>
              Yêu cầu ứng viên
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-botanical-stone whitespace-pre-line leading-relaxed text-botanical-forest/80 text-xs">
              {job.requirements || 'Chưa có yêu cầu cụ thể.'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-botanical-forest uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-botanical-forest"></span>
              Quyền lợi được hưởng
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-botanical-stone whitespace-pre-line leading-relaxed text-botanical-forest/80 text-xs">
              {job.benefits || 'Đãi ngộ hấp dẫn, bảo hiểm toàn diện, lộ trình thăng tiến rõ ràng.'}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-8 pt-6 border-t border-botanical-stone flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-botanical-secondary !text-xs !py-2.5 !px-5 cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              if (onApply) onApply(job);
            }}
            className="btn-botanical-primary !text-xs !py-2.5 !px-6 cursor-pointer flex items-center gap-2"
          >
            Ứng tuyển vị trí này
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
