import React from 'react';

/**
 * BotanicalBackground
 * Implements the Botanical / Organic Serif design system background:
 * 1. Warm Alabaster canvas (#F9F8F4)
 * 2. Mandatory Full-Screen SVG Fractal Noise Paper Grain Overlay (opacity-[0.015])
 * 3. Soft organic ambient lights (Sage Green & Terracotta warm glows)
 */
export default function BotanicalBackground() {
  return (
    <>
      {/* 1. Base Canvas */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[#F9F8F4]" 
        aria-hidden="true" 
      />

      {/* 2. Mandatory Paper Grain Texture Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      {/* 3. Organic Ambient Radiance (Soft Sage & Terracotta light wells) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Soft Sage radiance in upper-right */}
        <div 
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25"
          style={{ background: 'radial-gradient(circle, #8C9A84 0%, transparent 70%)' }}
        />

        {/* Terracotta sun-warmed accent in lower-left */}
        <div 
          className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full blur-[140px] opacity-15"
          style={{ background: 'radial-gradient(circle, #C27B66 0%, transparent 70%)' }}
        />

        {/* Soft Clay / Mushroom warmth at bottom-right */}
        <div 
          className="absolute -bottom-40 right-1/4 w-[700px] h-[500px] rounded-full blur-[130px] opacity-20"
          style={{ background: 'radial-gradient(circle, #DCCFC2 0%, transparent 70%)' }}
        />
      </div>
    </>
  );
}
