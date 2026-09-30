import React, { useState } from 'react';
import { useLivingTheme } from '../../context/LivingThemeContext';

export default function JobFilterSidebar({ filters, onFilterChange, onReset }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [matchScore, setMatchScore] = useState(80);
  const [onlyHighMatch, setOnlyHighMatch] = useState(true);
  const [selectedSalaries, setSelectedSalaries] = useState(['$2,000 - $3,500']);
  const [selectedTypes, setSelectedTypes] = useState(['Full-time', 'Remote / WFH', 'Hybrid']);
  const [selectedLevels, setSelectedLevels] = useState(['Senior (4-7 yrs)', 'Lead / Architect (7+ yrs)']);
  const [selectedSkills, setSelectedSkills] = useState(['Java 21', 'Spring Boot', 'Kafka', 'PostgreSQL']);

  const handleClearAll = () => {
    setMatchScore(50);
    setOnlyHighMatch(false);
    setSelectedSalaries([]);
    setSelectedTypes([]);
    setSelectedLevels([]);
    setSelectedSkills([]);
    if (onReset) onReset();
  };

  const toggleSalary = (val) => {
    setSelectedSalaries(prev => 
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const toggleType = (val) => {
    setSelectedTypes(prev => {
      const next = prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val];
      if (onFilterChange) {
        onFilterChange({ ...filters, employmentType: next.join(',') });
      }
      return next;
    });
  };

  const toggleLevel = (val) => {
    setSelectedLevels(prev => 
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      const next = prev.includes(skill) ? prev.filter(x => x !== skill) : [...prev, skill];
      if (onFilterChange) {
        onFilterChange({ ...filters, keyword: next.join(' ') });
      }
      return next;
    });
  };

  return (
    <aside className="space-y-5">
      <div className="card-botanical bg-white border border-[#E6E2DA] rounded-3xl p-6 shadow-soft text-[#2D3A31] font-body transition-all">
        {/* Panel Title & Clear All */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E2DA]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8C9A84] text-xl">filter_alt</span>
            <h2 className="font-serif font-bold text-sm tracking-wide text-[#2D3A31]">Bộ Lọc Tuyển Dụng</h2>
          </div>
          <button 
            onClick={handleClearAll}
            className="text-xs font-semibold text-[#8C9A84] hover:text-[#C27B66] transition-colors cursor-pointer" 
            type="button"
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Filter Group: AI Match Score Slider / Threshold */}
        <div className="pt-4 pb-4 border-b border-[#E6E2DA]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif text-xs font-semibold uppercase tracking-wider text-[#2D3A31] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#8C9A84]">psychology</span> Điểm AI Match
            </span>
            <span className="text-xs font-semibold text-[#2D3A31] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full border border-[#8C9A84]/40">
              ≥ {matchScore}%
            </span>
          </div>
          <input 
            className="w-full h-1.5 bg-[#F2F0EB] rounded-lg appearance-none cursor-pointer accent-[#8C9A84]" 
            max="100" 
            min="50" 
            type="range" 
            value={matchScore}
            onChange={(e) => setMatchScore(Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] font-medium text-[#667067] mt-1.5 font-body">
            <span>50% (Rộng)</span>
            <span>80% (Khuyên dùng)</span>
            <span>95% (Chính xác)</span>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#2D3A31] cursor-pointer select-none">
            <input 
              checked={onlyHighMatch} 
              onChange={(e) => setOnlyHighMatch(e.target.checked)}
              className="rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-[#8C9A84] h-4 w-4 cursor-pointer" 
              type="checkbox"
            />
            <span>Chỉ hiện AI Match ≥ 80%</span>
          </label>
        </div>

        {/* Filter Group 1: Salary Range */}
        <div className="py-4 border-b border-[#E6E2DA]">
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2D3A31] mb-3">Mức Lương (Tháng)</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: '< $1,000', count: 18, highlight: false },
              { label: '$1,000 - $2,000', count: 54, highlight: false },
              { label: '$2,000 - $3,500', count: 82, highlight: true },
              { label: '> $3,500+', count: 35, highlight: false },
            ].map(sal => {
              const isChecked = selectedSalaries.includes(sal.label);
              return (
                <label 
                  key={sal.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#2D3A31] font-semibold' : 'text-[#667067] hover:text-[#2D3A31]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleSalary(sal.label)}
                      className="rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-[#8C9A84] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span>{sal.label}</span>
                  </div>
                  <span className={`text-[11px] font-medium ${isChecked ? 'text-[#8C9A84]' : 'text-[#9BA39B]'}`}>
                    {sal.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 2: Job Type */}
        <div className="py-4 border-b border-[#E6E2DA]">
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2D3A31] mb-3">Hình Thức Làm Việc</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: 'Full-time', count: 112 },
              { label: 'Remote / WFH', count: 64 },
              { label: 'Hybrid', count: 48 },
              { label: 'Contract / Freelance', count: 16 },
            ].map(type => {
              const isChecked = selectedTypes.includes(type.label);
              return (
                <label 
                  key={type.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#2D3A31] font-semibold' : 'text-[#667067] hover:text-[#2D3A31]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleType(type.label)}
                      className="rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-[#8C9A84] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span>{type.label}</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#9BA39B]">{type.count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 3: Experience Level */}
        <div className="py-4 border-b border-[#E6E2DA]">
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2D3A31] mb-3">Cấp Bậc &amp; Kinh Nghiệm</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: 'Intern / Fresher', count: 12 },
              { label: 'Junior (1-2 yrs)', count: 28 },
              { label: 'Middle (2-4 yrs)', count: 55 },
              { label: 'Senior (4-7 yrs)', count: 72 },
              { label: 'Lead / Architect (7+ yrs)', count: 23 },
            ].map(exp => {
              const isChecked = selectedLevels.includes(exp.label);
              return (
                <label 
                  key={exp.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#2D3A31] font-semibold' : 'text-[#667067] hover:text-[#2D3A31]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleLevel(exp.label)}
                      className="rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-[#8C9A84] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span>{exp.label}</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#9BA39B]">{exp.count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group: Ngành Nghề & Lĩnh Vực */}
        <div className="py-4 border-b border-[#E6E2DA]">
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2D3A31] mb-3 flex items-center justify-between">
            <span>Ngành Nghề / Lĩnh Vực</span>
            <span className="text-[10px] text-[#8C9A84] font-medium">Đa Ngành</span>
          </h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: 'Kinh tế & Tài chính', count: 42, icon: 'payments', color: 'text-[#C27B66]' },
              { label: 'Marketing & Truyền thông', count: 38, icon: 'campaign', color: 'text-[#8C9A84]' },
              { label: 'Kinh doanh & B2B Sales', count: 35, icon: 'handshake', color: 'text-[#C27B66]' },
              { label: 'Nhân sự & Quản trị (HR)', count: 24, icon: 'group', color: 'text-[#8C9A84]' },
              { label: 'Logistics & Chuỗi cung ứng', count: 29, icon: 'local_shipping', color: 'text-[#8C9A84]' },
              { label: 'Công nghệ thông tin & Phần mềm', count: 86, icon: 'terminal', color: 'text-[#2D3A31]' },
            ].map(ind => {
              const isChecked = selectedTypes.includes(ind.label);
              return (
                <label 
                  key={ind.label} 
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    isChecked ? 'text-[#2D3A31] font-semibold' : 'text-[#667067] hover:text-[#2D3A31]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      checked={isChecked} 
                      onChange={() => toggleType(ind.label)}
                      className="rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-[#8C9A84] h-3.5 w-3.5 cursor-pointer" 
                      type="checkbox"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[15px] ${ind.color}`}>{ind.icon}</span>
                      <span>{ind.label}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#9BA39B]">{ind.count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 4: Required Skills */}
        <div className="pt-4">
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2D3A31] mb-3">Kỹ Năng &amp; Chuyên Môn</h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-normal">
            {[
              'Financial Modeling', 'DCF / Valuation', 
              'Omnichannel Growth', 'CAC / LTV', 
              'B2B Sales', 'HRBP Model', 
              'Supply Chain', 'Java 21 / Spring', 
              'ReactJS / UI', 'Python / AI'
            ].map(skill => {
              const isChecked = selectedSkills.includes(skill);
              return (
                <label 
                  key={skill} 
                  className={`flex items-center gap-1.5 cursor-pointer select-none ${
                    isChecked ? 'text-[#2D3A31] font-semibold' : 'text-[#667067] hover:text-[#2D3A31]'
                  }`}
                >
                  <input 
                    checked={isChecked} 
                    onChange={() => toggleSkill(skill)}
                    className="rounded border-[#E6E2DA] text-[#8C9A84] focus:ring-[#8C9A84] h-3.5 w-3.5 cursor-pointer" 
                    type="checkbox"
                  />
                  <span className="truncate">{skill}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
