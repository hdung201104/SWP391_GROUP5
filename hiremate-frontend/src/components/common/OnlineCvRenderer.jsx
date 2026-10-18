import React, { useState, useEffect } from 'react';

/**
 * OnlineCvRenderer.jsx
 * Hiển thị hồ sơ CV Online theo 3 mẫu chuẩn mực quốc tế:
 * 1. 'executive': Mẫu 2 Cột Chuẩn Doanh Nghiệp (Executive 2-Column Balanced)
 * 2. 'harvard': Mẫu Harvard ATS 100% (Đơn cột chuẩn học thuật tối ưu máy quét)
 * 3. 'modern': Mẫu Hiện Đại Sang Trọng (Modern Editorial with Brand Banner)
 */
export default function OnlineCvRenderer({
  candidate = {},
  initialTemplate = 'executive',
  showSelector = false,
  onTemplateChange = null,
  matchScore = null,
  className = '',
}) {
  const targetTemplate = candidate.initialTemplate || initialTemplate || 'executive';
  const [template, setTemplate] = useState(targetTemplate);

  useEffect(() => {
    const nextTpl = candidate.initialTemplate || initialTemplate;
    if (nextTpl) {
      setTemplate(nextTpl);
    }
  }, [candidate.initialTemplate, initialTemplate]);

  const handleSelectTemplate = (tId) => {
    setTemplate(tId);
    if (onTemplateChange) onTemplateChange(tId);
  };

  // Chuẩn hóa dữ liệu ứng viên an toàn
  const name = candidate.name || candidate.accountName || candidate.fullName || 'Ứng Viên HireMate';
  const title = candidate.title || candidate.targetTitle || candidate.jobTitle || 'Chuyên Viên Công Nghệ';
  const email = candidate.email || 'ungvien@hiremate.vn';
  const phone = candidate.phone || '(+84) 090.123.4567';
  const location = candidate.location || 'Hà Nội, Việt Nam';
  const avatar = candidate.avatar || candidate.avatarUrl || null;
  const summary = candidate.summary || 'Chuyên viên kỹ thuật tận tâm với kinh nghiệm thực chiến trong phát triển các hệ thống chịu tải cao và kiến trúc hiện đại.';
  
  // Kỹ năng
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  
  // Kinh nghiệm làm việc
  const experiences = Array.isArray(candidate.experiences) ? candidate.experiences : [];
  
  // Học vấn
  const educations = Array.isArray(candidate.educations) ? candidate.educations : [];
  
  // Dự án
  const projects = Array.isArray(candidate.projects) ? candidate.projects : [];

  // Ngoại ngữ
  const languages = Array.isArray(candidate.languages) ? candidate.languages : [
    { name: 'Tiếng Việt', level: 'Bản ngữ' },
    { name: 'Tiếng Anh', level: 'Chuyên ngành (TOEIC 850+)' }
  ];

  // In ấn bản CV
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP TOOLBAR: Hiển thị mẫu CV ứng viên đã nộp & Tác vụ In     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showSelector ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-purple-100 rounded-2xl shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-[#5b48bd] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-sm">palette</span>
              <span>Định Dạng CV Online:</span>
            </span>

            <div className="flex items-center bg-[#f8f7ff] p-1 rounded-xl border border-purple-100">
              {[
                { id: 'executive', label: '2 Cột Chuẩn', icon: 'view_column', desc: 'Executive' },
                { id: 'harvard', label: 'Harvard ATS', icon: 'menu_book', desc: '1-Column' },
                { id: 'modern', label: 'Hiện Đại', icon: 'style', desc: 'Modern' },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
                    template === tpl.id
                      ? 'bg-[#5b48bd] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-[#1e1b4b] hover:bg-purple-50/60 font-medium'
                  }`}
                  title={tpl.desc}
                >
                  <span className="material-symbols-outlined text-[15px]">{tpl.icon}</span>
                  <span>{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {matchScore != null && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-[#5b48bd] border border-purple-200 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                {matchScore}% So Khớp AI
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="In bản CV này hoặc lưu dưới dạng PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>In CV / Lưu PDF</span>
            </button>
          </div>
        </div>
      ) : (
        /* THANH ĐỊNH DẠNG CỐ ĐỊNH THEO BẢN ỨNG VIÊN ĐÃ NỘP (Dành cho HR xem) */
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-purple-100 rounded-2xl shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#1e1b4b]">
              Định dạng CV Online ứng viên đã nộp:
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              {template === 'harvard' ? 'Harvard ATS (Tối giản 100%)' : template === 'modern' ? 'Hiện Đại Sang Trọng' : '2 Cột Chuẩn (Executive)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {matchScore != null && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-[#5b48bd] border border-purple-200 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                {matchScore}% So Khớp AI
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="In bản CV này hoặc lưu dưới dạng PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>In CV / Lưu PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* VÙNG HIỂN THỊ CV THEO 3 TEMPLATE                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800 print:border-none print:shadow-none">

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE 1: EXECUTIVE (2 CỘT CHUẨN DOANH NGHIỆP)            */}
        {/* ════════════════════════════════════════════════════════════ */}
        {template === 'executive' && (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[750px]">
            {/* CỘT TRÁI (4/12): AVATAR, LIÊN HỆ, KỸ NĂNG, HỌC VẤN */}
            <aside className="md:col-span-4 p-6 sm:p-7 bg-[#f8fafc] border-r border-slate-200 space-y-6">
              {/* Avatar & Tên */}
              <div className="text-center space-y-3 pb-2 border-b border-slate-200">
                <div className="relative inline-block">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-sm mx-auto border-2 border-purple-200 ring-4 ring-purple-50"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-[#1e1548] to-[#5b48bd] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm mx-auto">
                      {name.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase() || 'UV'}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow" title="Đang sẵn sàng nhận việc" />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1e1b4b] leading-tight">
                    {name}
                  </h2>
                  <p className="text-xs font-bold text-[#5b48bd] mt-0.5">
                    {title}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    SẴN SÀNG NHẬN VIỆC
                  </span>
                </div>
              </div>

              {/* Thông tin liên hệ */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">contact_phone</span>
                  <span>Thông Tin Liên Hệ</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5 shrink-0">mail</span>
                    <span className="break-all font-medium">{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 shrink-0">call</span>
                    <span className="font-medium">{phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5 shrink-0">location_on</span>
                    <span className="font-medium">{location}</span>
                  </div>
                </div>
              </div>

              {/* Kỹ năng chuyên môn */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span>
                  <span>Kỹ Năng Cốt Lõi</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.length > 0 ? (
                    skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-[#5b48bd] border border-purple-200 shadow-2xs"
                      >
                        {typeof s === 'string' ? s : s.skillName || s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Kỹ năng chuyên môn công nghệ</span>
                  )}
                </div>
              </div>

              {/* Học vấn chính quy */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">school</span>
                  <span>Học Vấn Chính Quy</span>
                </h3>
                {educations.length > 0 ? (
                  educations.map((edu, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <h4 className="font-bold text-slate-900 leading-snug">
                        {edu.school || edu.institution}
                      </h4>
                      <p className="text-slate-600">{edu.degree || edu.major}</p>
                      {edu.grade && <p className="text-[11px] font-mono font-bold text-emerald-700">{edu.grade}</p>}
                      <p className="text-[10px] font-mono text-slate-500">{edu.period || edu.year}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-600">Đại học / Học viện công nghệ</div>
                )}
              </div>

              {/* Ngoại ngữ */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">translate</span>
                  <span>Ngoại Ngữ</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  {languages.map((lang, lIdx) => (
                    <div key={lIdx} className="flex items-center justify-between border-b border-dashed border-slate-200 pb-1">
                      <span className="font-bold text-slate-800">{lang.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">{lang.level || lang.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* CỘT PHẢI (8/12): TIÊU ĐỀ, TÓM TẮT, KINH NGHIỆM, DỰ ÁN */}
            <main className="md:col-span-8 p-6 sm:p-9 space-y-7 bg-white">
              {/* Header Title */}
              <div className="space-y-2 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#1e1b4b]">
                    {name}
                  </h1>
                  <span className="px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-purple-50 text-[#5b48bd] border border-purple-200 shrink-0">
                    EXECUTIVE CV
                  </span>
                </div>
                <p className="text-base font-bold text-[#5b48bd]">
                  {title}
                </p>
                <div className="h-1 w-20 rounded-full bg-[#5b48bd]"></div>
              </div>

              {/* 1. Tóm tắt năng lực cốt lõi */}
              <section className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1e1b4b] flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="material-symbols-outlined text-base text-[#5b48bd]">badge</span>
                  <span>Tóm Tắt Năng Lực Cốt Lõi (Executive Summary)</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  {summary}
                </p>
              </section>

              {/* 2. Kinh nghiệm làm việc */}
              <section className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1e1b4b] flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="material-symbols-outlined text-base text-[#5b48bd]">work_history</span>
                  <span>Lịch Sử Kinh Nghiệm Làm Việc</span>
                </h3>
                <div className="space-y-4">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-[#5b48bd]/40 space-y-1.5">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#5b48bd]" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-xs sm:text-sm text-[#1e1b4b] font-bold">
                          {exp.role || exp.title}
                        </strong>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {exp.period || exp.duration}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#5b48bd]">
                        {exp.company} {exp.location ? `• ${exp.location}` : ''}
                      </p>
                      {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                        <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 mt-1">
                          {exp.bullets.map((b, bi) => (
                            <li key={bi} className="leading-relaxed">{b}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {exp.description || exp.summary}
                        </p>
                      )}
                      {Array.isArray(exp.tags) && exp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {exp.tags.map((t, ti) => (
                            <span key={ti} className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Dự án tiêu biểu */}
              {projects.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1e1b4b] flex items-center gap-2 pb-1 border-b border-slate-100">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">rocket_launch</span>
                    <span>Dự Án Tiêu Biểu &amp; Sản Phẩm</span>
                  </h3>
                  <div className="space-y-3">
                    {projects.map((proj, pIdx) => (
                      <div key={pIdx} className="p-3.5 rounded-2xl bg-purple-50/30 border border-purple-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[#1e1b4b] font-bold">{proj.name}</strong>
                          <span className="text-[11px] font-mono text-slate-500">{proj.period}</span>
                        </div>
                        {proj.role && <div className="text-xs text-[#5b48bd] font-medium">{proj.role}</div>}
                        {(proj.summary || proj.description) && (
                          <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{proj.summary || proj.description}</p>
                        )}
                        {proj.technologies && (
                          <span className="text-[10px] font-mono text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200 inline-block mt-1">
                            Tech Stack: {proj.technologies}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </main>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE 2: HARVARD ATS 100% (ĐƠN CỘT TỐI GIẢN CHUẨN MỸ)     */}
        {/* ════════════════════════════════════════════════════════════ */}
        {template === 'harvard' && (
          <div className="p-8 sm:p-12 space-y-7 bg-white text-slate-900 font-serif">
            {/* Harvard Header Centered */}
            <div className="text-center space-y-2 pb-4 border-b-2 border-slate-800 font-sans">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-950 font-serif">
                {name}
              </h1>
              <p className="text-sm font-bold tracking-wide text-[#5b48bd]">
                {title}
              </p>
              <div className="text-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 font-mono text-slate-700">
                <span>📞 {phone}</span>
                <span>•</span>
                <span>✉️ {email}</span>
                <span>•</span>
                <span>📍 {location}</span>
              </div>
            </div>

            {/* Harvard Section 1: Professional Summary */}
            <section className="space-y-2">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                TÓM TẮT NĂNG LỰC (PROFESSIONAL SUMMARY)
              </h2>
              <p className="text-xs leading-relaxed text-justify text-slate-800 font-medium">
                {summary}
              </p>
            </section>

            {/* Harvard Section 2: Technical Skills */}
            <section className="space-y-2">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                KỸ NĂNG CHUYÊN MÔN (TECHNICAL &amp; CORE COMPETENCIES)
              </h2>
              <div className="text-xs leading-relaxed text-slate-800 font-sans">
                <strong>Chuyên môn cốt lõi: </strong>
                {skills.map((s) => (typeof s === 'string' ? s : s.skillName || s.name)).join(' • ')}
              </div>
            </section>

            {/* Harvard Section 3: Professional Experience */}
            <section className="space-y-4">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                KINH NGHIỆM LÀM VIỆC (PROFESSIONAL EXPERIENCE)
              </h2>
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="space-y-1 font-sans">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-950">{exp.company}</span>
                      <span className="text-xs font-mono text-slate-600">{exp.period || exp.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs italic text-slate-700 font-serif">
                      <span>{exp.role || exp.title}</span>
                      {exp.location && <span>{exp.location}</span>}
                    </div>
                    {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                      <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 pt-1 font-sans">
                        {exp.bullets.map((b, bi) => (
                          <li key={bi} className="leading-relaxed">{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">{exp.description || exp.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Harvard Section 4: Projects */}
            {projects.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                  DỰ ÁN TRỌNG ĐIỂM (KEY PROJECTS)
                </h2>
                <div className="space-y-3 font-sans">
                  {projects.map((proj, pIdx) => (
                    <div key={pIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{proj.name} {proj.role ? `— ${proj.role}` : ''}</span>
                        <span className="font-mono text-slate-500 font-normal">{proj.period}</span>
                      </div>
                      {(proj.summary || proj.description) && (
                        <p className="text-xs text-slate-700 leading-relaxed">{proj.summary || proj.description}</p>
                      )}
                      {proj.technologies && (
                        <p className="text-[11px] text-slate-600 font-mono">Công nghệ: {proj.technologies}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Harvard Section 5: Education */}
            <section className="space-y-2">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                HỌC VẤN &amp; BẰNG CẤP (EDUCATION &amp; CREDENTIALS)
              </h2>
              <div className="space-y-2 font-sans">
                {educations.map((edu, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-800">
                    <div>
                      <strong className="text-slate-950">{edu.school || edu.institution}</strong> — {edu.degree || edu.major}
                      {edu.grade && <span className="text-emerald-700 font-bold"> ({edu.grade})</span>}
                    </div>
                    <span className="font-mono text-slate-500">{edu.period || edu.year}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE 3: MODERN EDITORIAL (HIỆN ĐẠI SANG TRỌNG)           */}
        {/* ════════════════════════════════════════════════════════════ */}
        {template === 'modern' && (
          <div className="p-6 sm:p-10 space-y-6 bg-white text-slate-800 font-sans">
            {/* Modern Header Banner with Deep Indigo Gradient */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#18113c] via-[#2d206e] to-[#5b48bd] text-white shadow-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 uppercase tracking-widest text-purple-200">
                    VERIFIED CANDIDATE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    SẴN SÀNG NHẬN VIỆC
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                  {name}
                </h1>
                <p className="text-base sm:text-lg font-bold text-purple-200">
                  {title}
                </p>
                <p className="text-xs text-white/80 max-w-xl leading-relaxed pt-1">
                  {summary}
                </p>
              </div>

              {avatar && (
                <div className="relative shrink-0">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Contact Ribbon */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-wrap items-center justify-around gap-3 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">mail</span>
                <span>{email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">call</span>
                <span>{phone}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">location_on</span>
                <span>{location}</span>
              </span>
            </div>

            {/* 2-Column Grid Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              {/* Left Column (8/12): Experience & Projects */}
              <div className="md:col-span-8 space-y-6">
                {/* Kinh nghiệm */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-base">work</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-[#1e1b4b] uppercase tracking-wider">
                      Kinh Nghiệm Thực Chiến
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {experiences.map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-xs sm:text-sm text-[#1e1b4b] font-bold">
                            {exp.role || exp.title}
                          </strong>
                          <span className="text-[11px] font-mono text-[#5b48bd] bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                            {exp.period || exp.duration}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#5b48bd]">
                          {exp.company}
                        </div>
                        {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                          <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                            {exp.bullets.map((b, bi) => (
                              <li key={bi} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {exp.description || exp.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Dự án */}
                {projects.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base">rocket</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-[#1e1b4b] uppercase tracking-wider">
                        Dự Án Nổi Bật
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {projects.map((proj, pIdx) => (
                        <div key={pIdx} className="p-3.5 rounded-2xl bg-[#faf9ff] border border-purple-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs text-[#1e1b4b] font-bold">{proj.name}</strong>
                            <span className="text-[11px] font-mono text-slate-500">{proj.period}</span>
                          </div>
                          {proj.role && <div className="text-xs text-[#5b48bd] font-medium">{proj.role}</div>}
                          {(proj.summary || proj.description) && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proj.summary || proj.description}</p>
                          )}
                          {proj.technologies && (
                            <span className="text-[10px] font-mono text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200 inline-block mt-1">
                              Stack: {proj.technologies}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column (4/12): Skills & Education */}
              <div className="md:col-span-4 space-y-6">
                {/* Kỹ năng */}
                <section className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">terminal</span>
                    <h3 className="font-extrabold text-xs text-[#1e1b4b] uppercase tracking-wider">
                      Bộ Kỹ Năng
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-[#5b48bd] border border-purple-200 shadow-2xs"
                      >
                        {typeof s === 'string' ? s : s.skillName || s.name}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Học vấn */}
                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">school</span>
                    <h3 className="font-extrabold text-xs text-[#1e1b4b] uppercase tracking-wider">
                      Học Vấn
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {educations.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs">
                        <strong className="text-slate-900 block">{edu.school || edu.institution}</strong>
                        <div className="text-slate-600">{edu.degree || edu.major}</div>
                        {edu.grade && <div className="text-emerald-700 font-bold">{edu.grade}</div>}
                        <div className="text-[10px] font-mono text-slate-500">{edu.period || edu.year}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
