import React from 'react';

export default function ProtectedRoute({ user, requiredRole, children, onRedirectLogin }) {
  if (!user) {
    const roleText = requiredRole === 'RECRUITER' 
      ? 'Nhà tuyển dụng' 
      : requiredRole === 'CANDIDATE' 
        ? 'Ứng viên' 
        : 'người dùng';

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 relative">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#FAF9F5] border border-botanical-stone shadow-soft-xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-botanical-clay/30 border border-botanical-stone flex items-center justify-center mb-5 text-botanical-forest shadow-soft">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <h3 className="text-2xl font-serif font-bold text-botanical-forest mb-2">
            Yêu Cầu Đăng Nhập
          </h3>

          <p className="text-botanical-forest/70 text-sm leading-relaxed mb-6 font-sans">
            Bạn có thể tự do khám phá và tìm kiếm việc làm tại <strong className="text-botanical-forest font-semibold">Trang Chủ</strong>. Tuy nhiên, tính năng nâng cao này yêu cầu bạn đăng nhập tài khoản <strong className="text-botanical-terracotta font-semibold">{roleText}</strong> để tiếp tục.
          </p>

          <div className="w-full flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                window.location.hash = '#/login';
                if (onRedirectLogin) onRedirectLogin();
              }}
              className="btn-botanical-primary flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-soft"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Đăng nhập ngay</span>
            </button>

            <button
              onClick={() => { window.location.hash = '#/'; }}
              className="btn-botanical-secondary py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    const roleName = requiredRole === 'RECRUITER' ? 'Nhà tuyển dụng' : 'Ứng viên';
    const currentRoleName = user.role === 'RECRUITER' ? 'Nhà tuyển dụng' : 'Ứng viên';

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#FAF9F5] border border-botanical-stone shadow-soft-xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-700 shadow-soft">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>

          <h3 className="text-2xl font-serif font-bold text-botanical-forest mb-2">
            Không Đủ Quyền Truy Cập
          </h3>

          <p className="text-botanical-forest/70 text-sm leading-relaxed mb-6 font-sans">
            Khu vực này dành riêng cho tài khoản <strong className="text-botanical-terracotta font-semibold">{roleName}</strong>. Tài khoản hiện tại của bạn là <strong className="text-botanical-forest font-semibold">{currentRoleName}</strong>.
          </p>

          <div className="w-full flex gap-3">
            <button
              onClick={() => { window.location.hash = '#/'; }}
              className="btn-botanical-secondary flex-1 py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Về Trang Chủ
            </button>
            <button
              onClick={() => { window.location.hash = '#/login'; }}
              className="btn-botanical-primary flex-1 py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer shadow-soft"
            >
              Đổi tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
