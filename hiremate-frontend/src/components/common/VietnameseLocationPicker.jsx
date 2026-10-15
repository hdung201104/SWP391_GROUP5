import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  X, 
  ChevronRight, 
  Check, 
  Building2, 
  Compass,
  ArrowLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  VIETNAM_PROVINCES, 
  getWardsForDistrict, 
  formatFullAddress 
} from '../../utils/locationData';

const BASE_API = 'https://provinces.open-api.vn/api';

/**
 * VietnameseLocationPicker
 * One-click Cascading Hierarchical Location Picker (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã)
 * Powered by provinces.open-api.vn (Official General Statistics Office data)
 * With instant sessionStorage caching and offline fallback.
 */
export default function VietnameseLocationPicker({
  value = '',
  onChange,
  placeholder = 'Bấm chọn Tỉnh/TP → Quận/Huyện → Phường/Xã...',
  theme = 'light', // 'light' | 'dark'
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Tỉnh, 2: Huyện, 3: Xã
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Data lists from provinces.open-api.vn
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Selected hierarchy objects: { code, name }
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const modalRef = useRef(null);

  // 1. Fetch all 63 provinces from provinces.open-api.vn
  useEffect(() => {
    let isMounted = true;

    const loadProvinces = async () => {
      // Check cache first
      try {
        const cached = sessionStorage.getItem('hiremate_vn_provinces');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProvinces(parsed);
            return;
          }
        }
      } catch {}

      setIsLoading(true);
      setLoadError('');
      try {
        const res = await fetch(`${BASE_API}/p/`);
        if (!res.ok) throw new Error('Không thể tải danh sách Tỉnh / Thành');
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setProvinces(data);
          try {
            sessionStorage.setItem('hiremate_vn_provinces', JSON.stringify(data));
          } catch {}
        }
      } catch (err) {
        console.warn('Fallback to local province dataset due to API error:', err);
        if (isMounted) {
          // Fallback to local data
          const fallbackData = VIETNAM_PROVINCES.map((p, idx) => ({
            code: idx + 1,
            name: p.name,
            codename: p.name
          }));
          setProvinces(fallbackData);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize display state if value is passed from outside
  useEffect(() => {
    if (value && typeof value === 'string' && !selectedProvince) {
      const parts = value.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        setSelectedWard({ name: parts[0] });
        setSelectedDistrict({ name: parts[1] });
        setSelectedProvince({ name: parts[2] });
      } else if (parts.length === 2) {
        setSelectedDistrict({ name: parts[0] });
        setSelectedProvince({ name: parts[1] });
      } else if (parts.length === 1) {
        setSelectedProvince({ name: parts[0] });
      }
    }
  }, [value, selectedProvince]);

  // Reset search when step changes
  useEffect(() => {
    setSearchTerm('');
  }, [activeStep]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 2. Fetch districts of a province
  const loadDistrictsForProvince = async (prov) => {
    const cacheKey = `hiremate_vn_districts_${prov.code}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDistricts(parsed);
          setActiveStep(2);
          return;
        }
      }
    } catch {}

    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`${BASE_API}/p/${prov.code}?depth=2`);
      if (!res.ok) throw new Error('Không thể tải danh sách Quận / Huyện');
      const data = await res.json();
      const distList = data.districts || [];
      setDistricts(distList);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(distList));
      } catch {}
      setActiveStep(2);
    } catch (err) {
      console.warn('Fallback to local districts due to API error:', err);
      const localProv = VIETNAM_PROVINCES.find((p) => p.name === prov.name || prov.name.includes(p.name));
      const distList = (localProv ? localProv.districts : []).map((dName, idx) => ({
        code: `${prov.code}_${idx}`,
        name: dName
      }));
      setDistricts(distList);
      setActiveStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fetch wards of a district
  const loadWardsForDistrict = async (dist) => {
    const cacheKey = `hiremate_vn_wards_${dist.code}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWards(parsed);
          setActiveStep(3);
          return;
        }
      }
    } catch {}

    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`${BASE_API}/d/${dist.code}?depth=2`);
      if (!res.ok) throw new Error('Không thể tải danh sách Phường / Xã');
      const data = await res.json();
      const wardList = data.wards || [];
      setWards(wardList);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(wardList));
      } catch {}
      setActiveStep(3);
    } catch (err) {
      console.warn('Fallback to local wards due to API error:', err);
      const wardList = getWardsForDistrict(dist.name).map((wName, idx) => ({
        code: `${dist.code}_${idx}`,
        name: wName
      }));
      setWards(wardList);
      setActiveStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Selection handlers
  const handleSelectProvince = (prov) => {
    setSelectedProvince(prov);
    setSelectedDistrict(null);
    setSelectedWard(null);
    loadDistrictsForProvince(prov);
  };

  const handleSelectDistrict = (dist) => {
    setSelectedDistrict(dist);
    setSelectedWard(null);
    loadWardsForDistrict(dist);
  };

  const handleSelectWard = (ward) => {
    setSelectedWard(ward);
    const full = formatFullAddress(ward.name, selectedDistrict?.name || '', selectedProvince?.name || '');
    if (onChange) {
      onChange(full, {
        province: selectedProvince?.name || '',
        district: selectedDistrict?.name || '',
        ward: ward.name,
        provinceCode: selectedProvince?.code,
        districtCode: selectedDistrict?.code,
        wardCode: ward.code
      });
    }
    setIsOpen(false);
  };

  const handleConfirmAtDistrict = () => {
    const full = formatFullAddress('', selectedDistrict?.name || '', selectedProvince?.name || '');
    if (onChange) {
      onChange(full, {
        province: selectedProvince?.name || '',
        district: selectedDistrict?.name || '',
        ward: '',
        provinceCode: selectedProvince?.code,
        districtCode: selectedDistrict?.code
      });
    }
    setIsOpen(false);
  };

  // Search filters
  const filteredProvinces = useMemo(() => {
    if (!searchTerm.trim()) return provinces;
    const lower = searchTerm.toLowerCase();
    return provinces.filter((p) => p.name.toLowerCase().includes(lower));
  }, [provinces, searchTerm]);

  const filteredDistricts = useMemo(() => {
    if (!searchTerm.trim()) return districts;
    const lower = searchTerm.toLowerCase();
    return districts.filter((d) => d.name.toLowerCase().includes(lower));
  }, [districts, searchTerm]);

  const filteredWards = useMemo(() => {
    if (!searchTerm.trim()) return wards;
    const lower = searchTerm.toLowerCase();
    return wards.filter((w) => w.name.toLowerCase().includes(lower));
  }, [wards, searchTerm]);

  const isDark = theme === 'dark';

  return (
    <div className="relative w-full">
      {/* 1. SINGLE TRIGGER INPUT / BUTTON */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setIsOpen(true);
          if (selectedProvince && !selectedDistrict) setActiveStep(2);
          else if (selectedDistrict && !selectedWard) setActiveStep(3);
          else setActiveStep(1);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full flex items-center justify-between cursor-pointer transition-all ${
          isDark
            ? 'pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-purple-400 rounded-xl text-sm text-white'
            : 'pl-10 pr-3 py-2.5 bg-purple-50/40 hover:bg-white border border-purple-100 hover:border-[#5b48bd] hover:ring-2 hover:ring-[#5b48bd]/20 rounded-full text-sm text-[#221d47]'
        }`}
      >
        <span
          className={`material-symbols-outlined absolute left-3.5 text-base pointer-events-none ${
            isDark ? 'text-purple-300' : 'text-[#5b48bd]'
          }`}
        >
          location_on
        </span>

        <span className={`truncate select-none ${!value ? (isDark ? 'text-slate-400' : 'text-slate-400') : 'font-medium'}`}>
          {value || placeholder}
        </span>

        <span
          className={`material-symbols-outlined text-sm shrink-0 ml-2 ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`}
        >
          unfold_more
        </span>
      </div>

      {/* 2. CASCADING SELECTOR MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            ref={modalRef}
            className={`w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] transition-all transform animate-scaleUp ${
              isDark
                ? 'bg-[#1b153b] border-purple-500/30 text-white'
                : 'bg-white border-purple-100 text-[#1e1b4b]'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 flex items-center justify-between border-b ${
                isDark ? 'border-white/10 bg-white/5' : 'border-purple-50 bg-[#faf9ff]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5b48bd] to-[#8b5cf6] flex items-center justify-center text-white shadow-md">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Chọn Nơi Cư Trú</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      API Tổng Cục Thống Kê
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-purple-200/70' : 'text-slate-500'}`}>
                    Tỉnh/Thành phố → Quận/Huyện → Phường/Xã
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-purple-100 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Breadcrumb Navigation */}
            <div
              className={`px-4 sm:px-5 py-2.5 flex items-center gap-1.5 text-xs font-semibold overflow-x-auto border-b ${
                isDark ? 'border-white/10 bg-white/5' : 'border-purple-50 bg-purple-50/30'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeStep === 1
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : selectedProvince
                    ? isDark ? 'text-purple-300 hover:bg-white/10' : 'text-[#5b48bd] hover:bg-purple-100'
                    : isDark ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                <span>1. {selectedProvince?.name || 'Tỉnh / TP'}</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

              <button
                type="button"
                disabled={!selectedProvince}
                onClick={() => selectedProvince && setActiveStep(2)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeStep === 2
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : selectedDistrict
                    ? isDark ? 'text-purple-300 hover:bg-white/10' : 'text-[#5b48bd] hover:bg-purple-100'
                    : 'opacity-50 cursor-not-allowed text-slate-400'
                }`}
              >
                <span>2. {selectedDistrict?.name || 'Quận / Huyện'}</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

              <button
                type="button"
                disabled={!selectedDistrict}
                onClick={() => selectedDistrict && setActiveStep(3)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeStep === 3
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : selectedWard
                    ? isDark ? 'text-purple-300 hover:bg-white/10' : 'text-[#5b48bd] hover:bg-purple-100'
                    : 'opacity-50 cursor-not-allowed text-slate-400'
                }`}
              >
                <span>3. {selectedWard?.name || 'Phường / Xã'}</span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="p-3.5 sm:p-4 pb-2">
              <div className="relative flex items-center">
                <Search className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-purple-300' : 'text-[#5b48bd]'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    activeStep === 1
                      ? 'Tìm Tỉnh / Thành phố...'
                      : activeStep === 2
                      ? `Tìm Quận / Huyện thuộc ${selectedProvince?.name || ''}...`
                      : `Tìm Phường / Xã thuộc ${selectedDistrict?.name || ''}...`
                  }
                  className={`w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/10 border border-white/15 text-white placeholder-slate-400 focus:border-purple-400 focus:bg-white/15'
                      : 'bg-purple-50/50 border border-purple-100 text-[#1e1b4b] placeholder-slate-400 focus:border-[#5b48bd] focus:bg-white'
                  }`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pt-1 space-y-1.5 max-h-[360px] custom-scrollbar relative min-h-[160px]">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-purple-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Đang tải dữ liệu Tổng cục Thống kê...</span>
                </div>
              ) : (
                <>
                  {/* STEP 1: PROVINCES */}
                  {activeStep === 1 && (
                    <>
                      {filteredProvinces.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Không tìm thấy Tỉnh / Thành phố phù hợp.
                        </div>
                      ) : (
                        filteredProvinces.map((prov) => {
                          const isSelected = selectedProvince?.code === prov.code || selectedProvince?.name === prov.name;
                          return (
                            <button
                              key={prov.code || prov.name}
                              type="button"
                              onClick={() => handleSelectProvince(prov)}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-[#5b48bd] text-white font-semibold shadow-sm'
                                  : isDark
                                  ? 'hover:bg-white/10 text-slate-200'
                                  : 'hover:bg-purple-50 text-[#1e1b4b]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                                <span>{prov.name}</span>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            </button>
                          );
                        })
                      )}
                    </>
                  )}

                  {/* STEP 2: DISTRICTS */}
                  {activeStep === 2 && (
                    <>
                      {filteredDistricts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Không tìm thấy Quận / Huyện phù hợp.
                        </div>
                      ) : (
                        filteredDistricts.map((dist) => {
                          const isSelected = selectedDistrict?.code === dist.code || selectedDistrict?.name === dist.name;
                          return (
                            <button
                              key={dist.code || dist.name}
                              type="button"
                              onClick={() => handleSelectDistrict(dist)}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-[#5b48bd] text-white font-semibold shadow-sm'
                                  : isDark
                                  ? 'hover:bg-white/10 text-slate-200'
                                  : 'hover:bg-purple-50 text-[#1e1b4b]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Compass className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                                <span>{dist.name}</span>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            </button>
                          );
                        })
                      )}
                    </>
                  )}

                  {/* STEP 3: WARDS */}
                  {activeStep === 3 && (
                    <>
                      {filteredWards.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Không tìm thấy Phường / Xã phù hợp.
                        </div>
                      ) : (
                        filteredWards.map((ward) => {
                          const isSelected = selectedWard?.code === ward.code || selectedWard?.name === ward.name;
                          return (
                            <button
                              key={ward.code || ward.name}
                              type="button"
                              onClick={() => handleSelectWard(ward)}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                                  : isDark
                                  ? 'hover:bg-white/10 text-slate-200'
                                  : 'hover:bg-purple-50 text-[#1e1b4b]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                                <span>{ward.name}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`p-3 sm:p-4 flex items-center justify-between border-t ${
                isDark ? 'border-white/10 bg-white/5' : 'border-purple-50 bg-[#faf9ff]'
              }`}
            >
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isDark ? 'hover:bg-white/10 text-purple-200' : 'hover:bg-purple-100 text-[#5b48bd]'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
              ) : (
                <div />
              )}

              {activeStep === 3 && selectedDistrict && (
                <button
                  type="button"
                  onClick={handleConfirmAtDistrict}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-purple-100 hover:bg-purple-200 text-[#5b48bd]'
                  }`}
                >
                  Dừng tại {selectedDistrict.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
