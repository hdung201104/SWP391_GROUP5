import React from 'react';

export default function NotFoundPage({ onGoHome }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center font-body relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-md space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 border border-error/30 text-error font-mono text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
          ERR_404_NEURAL_ROUTE_UNRESOLVED
        </div>

        <h1 className="text-6xl sm:text-8xl font-headline font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-error to-secondary">
          404
        </h1>

        <h2 className="text-xl font-headline font-bold text-on-surface">
          Đường Dẫn Không Tồn Tại Hoặc Đã Bị Di Dời
        </h2>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Tọa độ điều hướng bạn đang cố truy cập không khớp với bất kỳ nút giao tiếp nào trên mạng lưới HireMate AI. Hãy kiểm tra lại URL hoặc quay về trang chủ.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              if (onGoHome) onGoHome();
              else window.location.hash = '#/';
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(255,45,120,0.5)] hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            <span>Về Trang Chủ</span>
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/60 text-on-surface font-label text-xs font-semibold hover:border-secondary/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay Lại Trang Trước</span>
          </button>
        </div>
      </div>
    </div>
  );
}
