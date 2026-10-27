import React, { useState } from 'react';

export default function JobFilterSidebar({ 
  user,
  filters = {}, 
  onFilterChange, 
  onReset,
  jobCounts = {},
  availableSkills = []
}) {
  const isRecruiter = user?.role === 'RECRUITER';
  const isCandidate = user?.role === 'CANDIDATE' || user?.role === 'ROLE_CANDIDATE';
  const isGuest = !user;
  const matchScore = filters.matchScore ?? 0;
  const onlyHighMatch = filters.onlyHighMatch ?? false;
  const selectedSalaries = filters.selectedSalaries ?? [];
  const selectedTypes = filters.selectedTypes ?? [];
  const selectedLevels = filters.selectedLevels ?? [];
  const selectedSkills = filters.selectedSkills ?? [];

  const [skillSearch, setSkillSearch] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);

  const salaryCounts = jobCounts.salaryCounts || {};
  const typeCounts = jobCounts.typeCounts || {};
  const levelCounts = jobCounts.levelCounts || {};

  const handleClearAll = () => {
    if (onReset) onReset();
  };

  const handleMatchScoreChange = (val) => {
    if (onFilterChange) {
      const numVal = Number(val);
      onFilterChange({ 
        ...filters, 
        matchScore: numVal,
        onlyHighMatch: numVal >= 80 ? onlyHighMatch : false
      });
    }
  };

  const handleOnlyHighMatchToggle = (checked) => {
    if (onFilterChange) {
      onFilterChange({ 
        ...filters, 
        onlyHighMatch: checked, 
        matchScore: checked ? Math.max(matchScore, 80) : 0 
      });
    }
  };

  const toggleSalary = (val) => {
    const next = selectedSalaries.includes(val)
      ? selectedSalaries.filter(x => x !== val)
      : [...selectedSalaries, val];
    if (onFilterChange) {
      onFilterChange({ ...filters, selectedSalaries: next });
    }
  };

  const toggleType = (val) => {
    const next = selectedTypes.includes(val)
      ? selectedTypes.filter(x => x !== val)
      : [...selectedTypes, val];
    if (onFilterChange) {
      onFilterChange({ ...filters, selectedTypes: next });
    }
  };

  const toggleLevel = (val) => {
    const next = selectedLevels.includes(val)
      ? selectedLevels.filter(x => x !== val)
      : [...selectedLevels, val];
    if (onFilterChange) {
      onFilterChange({ ...filters, selectedLevels: next });
    }
  };

  const toggleSkill = (skill) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter(x => x !== skill)
      : [...selectedSkills, skill];
    if (onFilterChange) {
      onFilterChange({ ...filters, selectedSkills: next });
    }
  };

  const CATEGORY_LABELS = {
    'ALL': 'Tất Cả Ngành',
    'IT_SOFTWARE': 'IT & Phần Mềm',
    'MARKETING_SALES': 'Marketing & Sales',
    'FINANCE_ACCOUNTING': 'Tài Chính & Kế Toán',
    'DESIGN_CREATIVE': 'Thiết Kế & Sáng Tạo',
    'HR_ADMIN': 'Nhân Sự & Tuyển Dụng',
    'BUSINESS_MANAGEMENT': 'Quản Trị & Kinh Doanh',
    'ENGINEERING_MANUFACTURING': 'Kỹ Thuật & Xây Dựng',
    'CUSTOMER_SERVICE': 'Chăm Sóc Khách Hàng',
    'EDUCATION_TRAINING': 'Giáo Dục & Đào Tạo',
    'HEALTHCARE_PHARMA': 'Y Tế & Dược Phẩm',
    'SOFT_SKILLS': 'Kỹ Năng Mềm',
    'GENERAL': 'Chuyên Môn Chung'
  };

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const normalizedSkills = React.useMemo(() => {
    if (!availableSkills || availableSkills.length === 0) {
      return [
        { name: 'Java', category: 'IT_SOFTWARE' },
        { name: 'Spring Boot', category: 'IT_SOFTWARE' },
        { name: 'React', category: 'IT_SOFTWARE' },
        { name: 'Node.js', category: 'IT_SOFTWARE' },
        { name: 'PostgreSQL', category: 'IT_SOFTWARE' },
        { name: 'Digital Marketing', category: 'MARKETING_SALES' },
        { name: 'SEO & Content', category: 'MARKETING_SALES' },
        { name: 'Kế toán Thuế', category: 'FINANCE_ACCOUNTING' },
        { name: 'Figma UI/UX', category: 'DESIGN_CREATIVE' },
        { name: 'Giao tiếp & Đàm phán', category: 'SOFT_SKILLS' },
      ];
    }
    return availableSkills.map(s => {
      if (typeof s === 'string') {
        return { name: s, category: 'GENERAL' };
      }
      return {
        name: s.name || s.skillName || '',
        category: (s.category || 'GENERAL').toUpperCase()
      };
    }).filter(s => s.name);
  }, [availableSkills]);

  const availableCategories = React.useMemo(() => {
    const cats = new Set(['ALL']);
    normalizedSkills.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [normalizedSkills]);

  return (
    <aside className="space-y-5">
      <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm text-[#1e1b4b] font-sans transition-all">
        {/* Panel Title & Clear All */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5b48bd] text-xl">filter_alt</span>
            <h2 className="font-bold text-sm tracking-wide text-[#1e1b4b]">
              {isRecruiter ? 'Bộ Lọc Thị Trường' : 'Bộ Lọc Tuyển Dụng'}
            </h2>
          </div>
          <button 
            onClick={handleClearAll}
            className="text-xs font-semibold text-slate-400 hover:text-[#5b48bd] transition-colors cursor-pointer" 
            type="button"
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Guest AI Matching Callout */}
        {isGuest && (
          <div className="pt-4 pb-4 border-b border-purple-100">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/80 border border-purple-200/90 shadow-2xs text-[#1e1b4b]">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#5b48bd] mb-1.5">
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>So Khớp AI Cá Nhân Hóa</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Đăng nhập tài khoản Ứng viên và tải lên CV để AI tự động so khớp kỹ năng và chấm điểm % độ phù hợp với từng công việc.
              </p>
              <button
                type="button"
                onClick={() => { window.location.hash = '#/login'; }}
                className="w-full py-2 px-3 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-xs hover:shadow transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Đăng nhập để xem điểm</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Group: AI Match Score Slider / Threshold - Chỉ hiển thị cho Ứng viên đã đăng nhập */}
        {isCandidate && (
          <div className="pt-4 pb-4 border-b border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span> Điểm AI Match
              </span>
              <span className="text-xs font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                {matchScore > 0 ? `≥ ${matchScore}%` : 'Tất cả'}
              </span>
            </div>
            <input 
              className="w-full h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-[#5b48bd]" 
              max="100" 
              min="0" 
              step="5"
              type="range" 
              value={matchScore}
              onChange={(e) => handleMatchScoreChange(e.target.value)}
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-500 mt-1.5">
              <span>Tất cả (0%)</span>
              <span>≥ 50%</span>
              <span>≥ 80% (Khuyên dùng)</span>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#1e1b4b] cursor-pointer select-none">
              <input 
                checked={onlyHighMatch} 
                onChange={(e) => handleOnlyHighMatchToggle(e.target.checked)}
                className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-4 w-4 cursor-pointer" 
                type="checkbox"
              />
              <span>Chỉ hiện AI Match ≥ 80%</span>
            </label>
          </div>
        )}

        {/* Filter Group 1: Salary Range */}
        <div className="py-4 border-b border-purple-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] mb-3">Mức Lương (Tháng)</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: '< $1,000', countKey: '< $1,000' },
              { label: '$1,000 - $2,000', countKey: '$1,000 - $2,000' },
              { label: '$2,000 - $3,500', countKey: '$2,000 - $3,500' },
              { label: '> $3,500+', countKey: '> $3,500+' },
            ].map(sal => {
              const isChecked = selectedSalaries.includes(sal.label);
              const count = salaryCounts[sal.countKey] ?? 0;
              return (
                <label 
                  key={sal.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#5b48bd] font-bold' : 'text-slate-600 hover:text-[#1e1b4b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleSalary(sal.label)}
                      className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span>{sal.label}</span>
                  </div>
                  <span className={`text-[11px] font-medium ${isChecked ? 'text-[#5b48bd]' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 2: Job Type */}
        <div className="py-4 border-b border-purple-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] mb-3">Hình Thức Làm Việc</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: 'Full-time', countKey: 'Full-time' },
              { label: 'Remote / WFH', countKey: 'Remote / WFH' },
              { label: 'Hybrid', countKey: 'Hybrid' },
              { label: 'Part-time', countKey: 'Part-time' },
            ].map(type => {
              const isChecked = selectedTypes.includes(type.label);
              const count = typeCounts[type.countKey] ?? 0;
              return (
                <label 
                  key={type.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#5b48bd] font-bold' : 'text-slate-600 hover:text-[#1e1b4b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleType(type.label)}
                      className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span>{type.label}</span>
                  </div>
                  <span className={`text-[11px] font-medium ${isChecked ? 'text-[#5b48bd]' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 3: Experience Level */}
        <div className="py-4 border-b border-purple-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] mb-3">Cấp Bậc &amp; Kinh Nghiệm</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: 'Intern / Fresher', countKey: 'Intern / Fresher' },
              { label: 'Junior (1-2 yrs)', countKey: 'Junior (1-2 yrs)' },
              { label: 'Middle (2-4 yrs)', countKey: 'Middle (2-4 yrs)' },
              { label: 'Senior (4-7 yrs)', countKey: 'Senior (4-7 yrs)' },
              { label: 'Lead / Architect (7+ yrs)', countKey: 'Lead / Architect (7+ yrs)' },
            ].map(exp => {
              const isChecked = selectedLevels.includes(exp.label);
              const count = levelCounts[exp.countKey] ?? 0;
              return (
                <label 
                  key={exp.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#5b48bd] font-bold' : 'text-slate-600 hover:text-[#1e1b4b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleLevel(exp.label)}
                      className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span>{exp.label}</span>
                  </div>
                  <span className={`text-[11px] font-medium ${isChecked ? 'text-[#5b48bd]' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 4: Required Skills - NÂNG CẤP BỘ LỌC ĐA NGÀNH NGHỀ & TÌM KIẾM NHANH */}
        <div className="pt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#5b48bd] text-sm">psychology</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b]">Kỹ Năng &amp; Chuyên Môn</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#5b48bd] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              {normalizedSkills.length} kỹ năng
            </span>
          </div>

          {/* Quick Skill Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Tìm nhanh kỹ năng bất kỳ..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#5b48bd] focus:bg-white transition-colors"
            />
            {skillSearch && (
              <button
                type="button"
                onClick={() => setSkillSearch('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter Pills (Ngành nghề) */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nhóm ngành:</span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {availableCategories.map((cat) => {
                const isCatActive = selectedCategory === cat;
                const label = CATEGORY_LABELS[cat] || cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isCatActive
                        ? 'bg-[#5b48bd] text-white shadow-2xs'
                        : 'bg-purple-50/70 text-[#5b48bd] hover:bg-purple-100 border border-purple-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Skills Chips with Clear Button */}
          {selectedSkills.length > 0 && (
            <div className="p-2 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#5b48bd]">Đang lọc ({selectedSkills.length}):</span>
                <button
                  type="button"
                  onClick={() => onFilterChange && onFilterChange({ ...filters, selectedSkills: [] })}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedSkills.map(sk => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#5b48bd] text-white shadow-2xs"
                  >
                    <span>{sk}</span>
                    <button
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className="hover:text-rose-200 cursor-pointer text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills Checkbox Grid */}
          {(() => {
            let filteredSkills = normalizedSkills;
            
            // Lọc theo nhóm ngành nếu không phải ALL
            if (selectedCategory !== 'ALL') {
              filteredSkills = filteredSkills.filter(s => s.category === selectedCategory);
            }

            // Lọc theo từ khóa tìm kiếm
            if (skillSearch.trim()) {
              const kw = skillSearch.toLowerCase().trim();
              filteredSkills = filteredSkills.filter(s => s.name.toLowerCase().includes(kw));
            }

            const displayedSkills = skillSearch.trim() || showAllSkills
              ? filteredSkills
              : filteredSkills.slice(0, 12);

            if (displayedSkills.length === 0) {
              return (
                <div className="text-[11px] text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-slate-100">
                  {skillSearch.trim()
                    ? `Không tìm thấy kỹ năng "${skillSearch}"`
                    : `Chưa có kỹ năng trong nhóm "${CATEGORY_LABELS[selectedCategory] || selectedCategory}"`}
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className={`grid grid-cols-2 gap-1.5 text-xs font-normal ${showAllSkills ? 'max-h-56 overflow-y-auto pr-1 scrollbar-thin' : ''}`}>
                  {displayedSkills.map((skillItem) => {
                    const skillName = skillItem.name;
                    const isChecked = selectedSkills.includes(skillName);
                    return (
                      <label 
                        key={skillName} 
                        className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-purple-50 text-[#5b48bd] font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#1e1b4b]'
                        }`}
                        title={`${skillName} (${CATEGORY_LABELS[skillItem.category] || skillItem.category})`}
                      >
                        <input 
                          checked={isChecked} 
                          onChange={() => toggleSkill(skillName)}
                          className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-3.5 w-3.5 cursor-pointer shrink-0" 
                          type="checkbox"
                        />
                        <span className="truncate text-[11px]">{skillName}</span>
                      </label>
                    );
                  })}
                </div>

                {!skillSearch.trim() && filteredSkills.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="text-[11px] font-bold text-[#5b48bd] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{showAllSkills ? 'Thu gọn' : `Xem thêm (+${filteredSkills.length - 12} kỹ năng)`}</span>
                    <span className="material-symbols-outlined text-xs">
                      {showAllSkills ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </aside>
  );
}
