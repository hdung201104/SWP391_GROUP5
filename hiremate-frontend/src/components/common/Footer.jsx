import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#F9F8F4] mt-16 py-10 border-t border-[#E6E2DA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-base text-[#2D3A31] tracking-wide">
            HireMate<span className="italic font-normal text-[#C27B66]">.AI</span>
          </span>
          <span className="text-xs text-[#8C9A84]">•</span>
          <p className="font-body text-xs text-[#667067]">
            © 2025 HireMate.AI. Cổng Tìm Kiếm &amp; Khám Phá Tuyển Dụng AI Tự Nhiên &amp; Chính Xác.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <a className="flex items-center gap-1.5 text-xs font-body text-[#8C9A84] hover:text-[#2D3A31] transition-colors" href="#/">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>AI Ethics Protocol Compliant</span>
          </a>
          <a className="flex items-center gap-1.5 text-xs font-body text-[#8C9A84] hover:text-[#2D3A31] transition-colors" href="#/">
            <span className="material-symbols-outlined text-sm">eco</span>
            <span>Sustainable Talent Discovery</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
