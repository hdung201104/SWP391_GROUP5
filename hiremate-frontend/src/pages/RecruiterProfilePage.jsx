import React, { useState } from 'react';

export default function RecruiterProfilePage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const [companyInfo, setCompanyInfo] = useState({
    name: user?.companyName || 'FPT Software Co., Ltd',
    badge: 'Doanh Nghiệp Đã Xác Thực',
    tagline: 'Tập đoàn công nghệ & dịch vụ chuyển đổi số hàng đầu Đông Nam Á',
    website: 'https://fptsoftware.com',
    industry: 'Công Nghệ Thông Tin & Phần Mềm',
    headcount: '32,000+ Kỹ sư & Chuyên gia',
    establishedYear: '1999 (27 năm phát triển)',
    headquarters: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh & Cầu Giấy, Hà Nội',
    overviewText:
      'Thành lập từ năm 1999, FPT Software là doanh nghiệp phần mềm và dịch vụ chuyển đổi số hàng đầu khu vực. Đồng hành cùng hơn 1,000 khách hàng toàn cầu trong đó có hơn 100 tập đoàn thuộc Fortune Global 500, FPT Software tiên phong ứng dụng Generative AI, Cloud Computing và Kiến trúc phân tán quy mô lớn.\n\nTại FPT Software, con người luôn là trung tâm của mọi sự phát triển. Chúng tôi xây dựng môi trường làm việc chuẩn quốc tế, văn hóa tôn trọng sự tự chủ, trao quyền tối đa cho kỹ sư công nghệ.',
  });

  const [hrRepresentative, setHrRepresentative] = useState({
    name: user?.fullName || 'Nguyễn Minh Anh',
    title: 'Lead Talent Acquisition Partner',
    email: user?.email || 'minhanh.hr@fptsoftware.com',
    hotline: '0988 777 666',
    avatar:
      user?.avatarUrl ||
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    bio: 'Phụ trách tư vấn và tuyển dụng nhân sự công nghệ cấp cao (Backend, DevOps, AI Engineer).',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: companyInfo.name,
    tagline: companyInfo.tagline,
    website: companyInfo.website,
    headquarters: companyInfo.headquarters,
    overviewText: companyInfo.overviewText,
    hrName: hrRepresentative.name,
    hrTitle: hrRepresentative.title,
    hrEmail: hrRepresentative.email,
    hrHotline: hrRepresentative.hotline,
  });

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setCompanyInfo((prev) => ({
      ...prev,
      name: editForm.companyName,
      tagline: editForm.tagline,
      website: editForm.website,
      headquarters: editForm.headquarters,
      overviewText: editForm.overviewText,
    }));
    setHrRepresentative((prev) => ({
      ...prev,
      name: editForm.hrName,
      title: editForm.hrTitle,
      email: editForm.hrEmail,
      hotline: editForm.hrHotline,
    }));
    setShowEditModal(false);
    triggerToast('Đã lưu thành công cập nhật hồ sơ công ty!');
  };

  return (
    <div className="w-full bg-[#FAF9F6] text-[#1F2933] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2933] text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-fade-in">
          <span className="material-symbols-outlined text-[#F58220] text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Company Banner & Profile Header */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl overflow-hidden shadow-sm">
          {/* Cover photo */}
          <div className="h-48 sm:h-64 bg-gradient-to-r from-[#1F2933] to-[#323D47] relative p-6 flex items-end">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                {companyInfo.badge}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              <div className="flex items-end gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 border-2 border-[#E5E1D8] shadow-md shrink-0 flex items-center justify-center font-bold text-3xl text-[#F58220]">
                  {companyInfo.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2933]">
                    {companyInfo.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                    {companyInfo.tagline}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditForm({
                    companyName: companyInfo.name,
                    tagline: companyInfo.tagline,
                    website: companyInfo.website,
                    headquarters: companyInfo.headquarters,
                    overviewText: companyInfo.overviewText,
                    hrName: hrRepresentative.name,
                    hrTitle: hrRepresentative.title,
                    hrEmail: hrRepresentative.email,
                    hrHotline: hrRepresentative.hotline,
                  });
                  setShowEditModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#F58220] hover:bg-[#E07216] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Chỉnh sửa thông tin</span>
              </button>
            </div>

            {/* Overview Metadata Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#E5E1D8] text-xs">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                <span className="text-[#6B7280] block text-[11px]">Lĩnh vực</span>
                <span className="font-semibold text-[#1F2933] block">{companyInfo.industry}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                <span className="text-[#6B7280] block text-[11px]">Quy mô nhân sự</span>
                <span className="font-semibold text-[#1F2933] block">{companyInfo.headcount}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                <span className="text-[#6B7280] block text-[11px]">Thành lập</span>
                <span className="font-semibold text-[#1F2933] block">{companyInfo.establishedYear}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
                <span className="text-[#6B7280] block text-[11px]">Website chính thức</span>
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#F58220] hover:underline block truncate"
                >
                  {companyInfo.website}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#1F2933] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F58220]">info</span>
                Giới thiệu công ty
              </h2>
              <div className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-line">
                {companyInfo.overviewText}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#1F2933] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F58220]">location_on</span>
                Địa điểm &amp; Chi nhánh
              </h2>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] text-xs text-[#1F2933] space-y-1">
                <strong className="block">Trụ sở chính:</strong>
                <p className="text-[#6B7280]">{companyInfo.headquarters}</p>
              </div>
            </div>
          </div>

          {/* HR Representative Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4 text-center">
              <h3 className="font-bold text-sm text-[#1F2933] uppercase">Đại diện tuyển dụng</h3>
              <img
                src={hrRepresentative.avatar}
                alt={hrRepresentative.name}
                className="w-20 h-20 rounded-2xl object-cover border border-[#E5E1D8] mx-auto"
              />
              <div>
                <h4 className="font-bold text-base text-[#1F2933]">{hrRepresentative.name}</h4>
                <p className="text-xs text-[#F58220] font-semibold">{hrRepresentative.title}</p>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">{hrRepresentative.bio}</p>

              <div className="pt-3 border-t border-[#E5E1D8] text-xs text-left space-y-2">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Email:</span>
                  <span className="font-semibold text-[#1F2933]">{hrRepresentative.email}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Hotline:</span>
                  <span className="font-semibold text-[#1F2933]">{hrRepresentative.hotline}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT COMPANY MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-xl bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#E5E1D8] text-[#1F2933] flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-bold text-[#1F2933]">Chỉnh Sửa Hồ Sơ Công Ty</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Tên công ty</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Khẩu hiệu / Tagline</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2933] uppercase mb-1">Giới thiệu công ty</label>
                <textarea
                  rows={4}
                  value={editForm.overviewText}
                  onChange={(e) => setEditForm({ ...editForm, overviewText: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3 text-[#1F2933]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F2933] hover:bg-[#E5E1D8]/50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#F58220] hover:bg-[#E07216] shadow-sm"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
