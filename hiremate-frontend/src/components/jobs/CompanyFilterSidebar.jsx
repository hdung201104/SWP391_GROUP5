import React from 'react';

export default function CompanyFilterSidebar({
  filters = {},
  onFilterChange,
  onReset,
  counts = {},
}) {
  const selectedLocations = filters.selectedLocations || [];
  const selectedIndustries = filters.selectedIndustries || [];
  const selectedSizes = filters.selectedSizes || [];
  const selectedSalaries = filters.selectedSalaries || [];
  const selectedPerks = filters.selectedPerks || [];
  const onlyActiveHiring = filters.onlyActiveHiring || false;
  const onlyManyJobs = filters.onlyManyJobs || false;

  const locationCounts = counts.locations || {
    'Đà Nẵng': 4,
    'TP. Hồ Chí Minh': 1,
    'Hà Nội': 1,
    'Remote': 1,
  };

  const toggleLocation = (loc) => {
    const next = selectedLocations.includes(loc)
      ? selectedLocations.filter(x => x !== loc)
      : [...selectedLocations, loc];
    onFilterChange?.({ ...filters, selectedLocations: next });
  };

  const toggleIndustry = (ind) => {
    const next = selectedIndustries.includes(ind)
      ? selectedIndustries.filter(x => x !== ind)
      : [...selectedIndustries, ind];
    onFilterChange?.({ ...filters, selectedIndustries: next });
  };

  const toggleSize = (size) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter(x => x !== size)
      : [...selectedSizes, size];
    onFilterChange?.({ ...filters, selectedSizes: next });
  };

  const toggleSalary = (sal) => {
    const next = selectedSalaries.includes(sal)
      ? selectedSalaries.filter(x => x !== sal)
      : [...selectedSalaries, sal];
    onFilterChange?.({ ...filters, selectedSalaries: next });
  };

  const togglePerk = (perk) => {
    const next = selectedPerks.includes(perk)
      ? selectedPerks.filter(x => x !== perk)
      : [...selectedPerks, perk];
    onFilterChange?.({ ...filters, selectedPerks: next });
  };

  return (
    <aside className="space-y-5">
      <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm text-[#1e1b4b] font-sans transition-all">
        {/* Panel Title & Clear All */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5b48bd] text-xl">apartment</span>
            <h2 className="font-bold text-sm tracking-wide text-[#1e1b4b]">
              Bộ Lọc Doanh Nghiệp
            </h2>
          </div>
          <button 
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 hover:text-[#5b48bd] transition-colors cursor-pointer"
            type="button"
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Section 1: Hiring Status */}
        <div className="py-4 border-b border-purple-100/60 space-y-2.5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={onlyActiveHiring}
              onChange={(e) => onFilterChange?.({ ...filters, onlyActiveHiring: e.target.checked })}
              className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 group-hover:text-[#5b48bd] transition-colors">
              Đang mở đợt tuyển (&gt; 0 việc làm)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={onlyManyJobs}
              onChange={(e) => onFilterChange?.({ ...filters, onlyManyJobs: e.target.checked })}
              className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 group-hover:text-[#5b48bd] transition-colors">
              Nhiều vị trí tuyển (≥ 3 việc làm)
            </span>
          </label>
        </div>

        {/* Section 2: Locations / Branches */}
        <div className="py-4 border-b border-purple-100/60">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1e1b4b] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#5b48bd]">pin_drop</span>
            <span>Chi Nhánh Tuyển Dụng</span>
          </h3>
          <div className="space-y-2">
            {['Đà Nẵng', 'TP. Hồ Chí Minh', 'Hà Nội', 'Remote'].map((loc) => {
              const count = locationCounts[loc] ?? 0;
              const isChecked = selectedLocations.includes(loc);
              return (
                <label key={loc} className="flex items-center justify-between text-xs cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleLocation(loc)}
                      className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
                    />
                    <span className={`transition-colors ${isChecked ? 'font-bold text-[#5b48bd]' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>
                      {loc}
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs font-semibold">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 3: Industry */}
        <div className="py-4 border-b border-purple-100/60">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1e1b4b] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#5b48bd]">domain</span>
            <span>Lĩnh Vực Hoạt Động</span>
          </h3>
          <div className="space-y-2">
            {[
              { key: 'phần mềm', label: 'CNTT & Dịch vụ phần mềm' },
              { key: 'game', label: 'Internet & Game Online' },
              { key: 'chuyển đổi số', label: 'Chuyển Đổi Số & Cloud AI' },
              { key: 'đa quốc gia', label: 'Tập Đoàn Đa Quốc Gia' },
            ].map(({ key, label }) => {
              const isChecked = selectedIndustries.includes(key);
              return (
                <label key={key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleIndustry(key)}
                      className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
                    />
                    <span className={`transition-colors truncate max-w-[170px] ${isChecked ? 'font-bold text-[#5b48bd]' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>
                      {label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 4: Scale / Size */}
        <div className="py-4 border-b border-purple-100/60">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1e1b4b] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#5b48bd]">group</span>
            <span>Quy Mô Doanh Nghiệp</span>
          </h3>
          <div className="space-y-2">
            {[
              { key: '10000', label: '10,000+ nhân sự' },
              { key: '5000', label: '5,000+ nhân viên' },
              { key: '1000', label: '1,000 - 5,000 nhân sự' },
              { key: '500', label: '500 - 1,000 nhân viên' },
            ].map(({ key, label }) => {
              const isChecked = selectedSizes.includes(key);
              return (
                <label key={key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleSize(key)}
                      className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
                    />
                    <span className={`transition-colors truncate max-w-[170px] ${isChecked ? 'font-bold text-[#5b48bd]' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>
                      {label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 5: Salary Range Offered */}
        <div className="py-4 border-b border-purple-100/60">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1e1b4b] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#10b981]">payments</span>
            <span>Mức Thu Nhập Tuyển Dụng</span>
          </h3>
          <div className="space-y-2">
            {[
              { key: 'high', label: 'Mức lương cao (Up to 45tr+ / $4K)' },
              { key: 'mid', label: 'Từ 15 - 35 triệu/tháng' },
              { key: 'entry', label: 'Dưới 15 triệu / Intern' },
            ].map(({ key, label }) => {
              const isChecked = selectedSalaries.includes(key);
              return (
                <label key={key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleSalary(key)}
                      className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
                    />
                    <span className={`transition-colors truncate max-w-[170px] ${isChecked ? 'font-bold text-[#5b48bd]' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>
                      {label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 6: Key Culture & Perks */}
        <div className="pt-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1e1b4b] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#f59e0b]">verified</span>
            <span>Chế Độ &amp; Môi Trường</span>
          </h3>
          <div className="space-y-2">
            {[
              { key: 'device', label: 'Cấp Macbook / Thiết bị Pro' },
              { key: 'health', label: 'Bảo hiểm sức khỏe cao cấp' },
              { key: 'hybrid', label: 'Mô hình linh hoạt (Hybrid / WFH)' },
            ].map(({ key, label }) => {
              const isChecked = selectedPerks.includes(key);
              return (
                <label key={key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => togglePerk(key)}
                      className="w-4 h-4 rounded border-purple-200 text-[#5b48bd] focus:ring-[#5b48bd] cursor-pointer"
                    />
                    <span className={`transition-colors truncate max-w-[170px] ${isChecked ? 'font-bold text-[#5b48bd]' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>
                      {label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
