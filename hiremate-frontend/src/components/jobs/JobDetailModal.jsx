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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 overflow-y-auto shadow-2xl text-[#221d47]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-purple-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header Details */}
        <div className="flex items-start gap-4 mb-6 pr-10">
          <div className="w-16 h-16 rounded-2xl bg-[#edeafd] border border-purple-200 flex items-center justify-center font-sans font-extrabold text-[#5b48bd] text-2xl overflow-hidden shrink-0 shadow-sm">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
            ) : (
              <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C'}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#221d47] mb-1">
              {job.title}
            </h2>
            <p className="text-sm font-bold text-[#f97316]">
              {job.companyName || 'HireMate Partner'}
            </p>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 shadow-sm font-sans">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#f97316]">payments</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Mức lương</p>
              <p className="text-xs font-bold text-[#221d47]">{formatSalary(job.salaryMin, job.salaryMax)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#5b48bd]">location_on</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Địa điểm</p>
              <p className="text-xs font-bold text-[#221d47]">{job.location || 'Toàn quốc'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#10b981]">work</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Hình thức</p>
              <p className="text-xs font-bold text-[#221d47]">{job.employmentType || 'Toàn thời gian'}</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-sm text-[#221d47] font-sans">
          <div>
            <h3 className="text-xs font-bold text-[#5b48bd] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5b48bd]"></span>
              Mô tả công việc
            </h3>
            <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 whitespace-pre-line leading-relaxed text-slate-700 text-xs font-sans">
              {job.description ? String(job.description).replaceAll('\\n', '\n') : 'Chưa có thông tin mô tả chi tiết.'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
              Yêu cầu ứng viên
            </h3>
            <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 whitespace-pre-line leading-relaxed text-slate-700 text-xs font-sans">
              {job.requirements ? String(job.requirements).replaceAll('\\n', '\n') : 'Chưa có yêu cầu cụ thể.'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              Quyền lợi được hưởng
            </h3>
            <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 whitespace-pre-line leading-relaxed text-slate-700 text-xs font-sans">
              {job.benefits ? String(job.benefits).replaceAll('\\n', '\n') : 'Đãi ngộ hấp dẫn, bảo hiểm toàn diện, lộ trình thăng tiến rõ ràng.'}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-8 pt-6 border-t border-purple-100 flex items-center justify-end gap-3 font-sans">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              if (onApply) onApply(job);
            }}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#5b48bd] hover:bg-[#47369f] shadow-md hover:scale-[1.02] cursor-pointer transition-all flex items-center gap-2"
          >
            Ứng tuyển vị trí này
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
