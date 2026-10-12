import React, { useState } from 'react';

export default function JobFilterSidebar({ filters, onFilterChange, onReset }) {
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
      <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm text-[#1e1b4b] font-sans transition-all">
        {/* Panel Title & Clear All */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5b48bd] text-xl">filter_alt</span>
            <h2 className="font-bold text-sm tracking-wide text-[#1e1b4b]">Bộ Lọc Tuyển Dụng</h2>
          </div>
          <button 
            onClick={handleClearAll}
            className="text-xs font-semibold text-slate-400 hover:text-[#5b48bd] transition-colors cursor-pointer" 
            type="button"
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Filter Group: AI Match Score Slider / Threshold */}
        <div className="pt-4 pb-4 border-b border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span> Điểm AI Match
            </span>
            <span className="text-xs font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              ≥ {matchScore}%
            </span>
          </div>
          <input 
            className="w-full h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-[#5b48bd]" 
            max="100" 
            min="50" 
            type="range" 
            value={matchScore}
            onChange={(e) => setMatchScore(Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] font-medium text-slate-500 mt-1.5">
            <span>50% (Rộng)</span>
            <span>80% (Khuyên dùng)</span>
            <span>95% (Chính xác)</span>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#1e1b4b] cursor-pointer select-none">
            <input 
              checked={onlyHighMatch} 
              onChange={(e) => setOnlyHighMatch(e.target.checked)}
              className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-4 w-4 cursor-pointer" 
              type="checkbox"
            />
            <span>Chỉ hiện AI Match ≥ 80%</span>
          </label>
        </div>

        {/* Filter Group 1: Salary Range */}
        <div className="py-4 border-b border-purple-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] mb-3">Mức Lương (Tháng)</h3>
          <div className="space-y-2 text-xs font-normal">
            {[
              { label: '< $1,000', count: 18 },
              { label: '$1,000 - $2,000', count: 54 },
              { label: '$2,000 - $3,500', count: 82 },
              { label: '> $3,500+', count: 35 },
            ].map(sal => {
              const isChecked = selectedSalaries.includes(sal.label);
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
                    {sal.count}
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
                  <span className="text-[11px] font-medium text-slate-400">{type.count}</span>
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
                  <span className="text-[11px] font-medium text-slate-400">{exp.count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter Group 4: Required Skills */}
        <div className="pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b4b] mb-3">Kỹ Năng &amp; Chuyên Môn</h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-normal">
            {[
              'Financial Modeling', 'Valuation', 
              'Omnichannel', 'CAC / LTV', 
              'B2B Sales', 'HRBP Model', 
              'Supply Chain', 'Java 21 / Spring', 
              'ReactJS / UI', 'Python / AI'
            ].map(skill => {
              const isChecked = selectedSkills.includes(skill);
              return (
                <label 
                  key={skill} 
                  className={`flex items-center gap-1.5 cursor-pointer select-none ${
                    isChecked ? 'text-[#5b48bd] font-bold' : 'text-slate-600 hover:text-[#1e1b4b]'
                  }`}
                >
                  <input 
                    checked={isChecked} 
                    onChange={() => toggleSkill(skill)}
                    className="rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] h-3.5 w-3.5 cursor-pointer" 
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

