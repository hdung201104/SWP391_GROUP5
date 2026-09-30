import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// BẢNG MÃ MÀU & HIỆU ỨNG DUY NHẤT: BOTANICAL ORGANIC SERIF (THẢO MỘC & ĐẤT ẤM)
// ============================================================================
export const THEME_PRESETS = {
  'botanical-organic': {
    id: 'botanical-organic',
    name: '🌿 Thảo Mộc & Đất Ấm (Botanical Organic)',
    shortName: '🌿 Botanical',
    ambientGlowTop: 'bg-gradient-to-b from-[#8C9A84]/15 via-[#C27B66]/8 to-transparent',
    ambientGlowBottom: 'bg-[#8C9A84]/10',
    ambientHue: 'from-[#8C9A84]/8 via-[#DCCFC2]/20 to-[#C27B66]/8',
    primary: '#2D3A31',
    secondary: '#8C9A84',
    accent: '#C27B66',
    border: 'border-[#E6E2DA]',
    borderHover: 'hover:border-[#8C9A84]',
    borderActive: 'border-[#2D3A31]',
    glow: 'shadow-soft',
    glowHover: 'hover:shadow-soft-lg',
    cardGlowEffect: 'bg-[#8C9A84]/10 group-hover:bg-[#8C9A84]/20',
    tagBg: 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30',
    headerBg: 'bg-[#F9F8F4]/85 backdrop-blur-md border-[#E6E2DA]',
    activeNavBg: 'bg-[#2D3A31] text-white shadow-soft rounded-full',
    glassCard: {
      crystal: 'bg-white/85 backdrop-blur-sm border-[#E6E2DA] shadow-soft',
      balanced: 'bg-[#FAF9F5] backdrop-blur-sm border-[#E6E2DA] shadow-soft-md',
      soft: 'bg-[#F2F0EB] border-[#E6E2DA] shadow-soft',
    },
    filterBg: {
      crystal: 'bg-white/90 border-[#E6E2DA]',
      balanced: 'bg-[#FAF9F5] border-[#E6E2DA]',
      soft: 'bg-[#F2F0EB] border-[#E6E2DA]',
    },
    inputBg: 'bg-white border-[#E6E2DA] focus:border-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84]/20 text-[#2D3A31]',
    textColor: 'text-[#2D3A31]',
    textMuted: 'text-[#2D3A31]/70',
    highlightBadge: 'bg-[#C27B66]/15 text-[#C27B66] border-[#C27B66]/30',
  },
};

const LivingThemeContext = createContext({
  variant: 'botanical-organic',
  setVariant: () => {},
  luminosity: 'crystal',
  setLuminosity: () => {},
  theme: THEME_PRESETS['botanical-organic'],
});

export function LivingThemeProvider({ children }) {
  const variant = 'botanical-organic';
  const [luminosity, setLuminosityState] = useState(() => {
    return localStorage.getItem('hiremate_glass_luminosity') || 'crystal';
  });

  const setVariant = () => {
    // Exclusively Botanical Organic
  };

  const setLuminosity = (l) => {
    setLuminosityState(l);
    localStorage.setItem('hiremate_glass_luminosity', l);
    document.documentElement.setAttribute('data-glass-luminosity', l);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-living-theme', 'botanical-organic');
    document.documentElement.setAttribute('data-glass-luminosity', luminosity);
  }, [luminosity]);

  const theme = THEME_PRESETS['botanical-organic'];

  return (
    <LivingThemeContext.Provider
      value={{
        variant,
        setVariant,
        luminosity,
        setLuminosity,
        theme,
      }}
    >
      {children}
    </LivingThemeContext.Provider>
  );
}

export function useLivingTheme() {
  return useContext(LivingThemeContext);
}
