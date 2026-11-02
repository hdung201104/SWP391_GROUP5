import React from 'react';

/**
 * BotanicalBackground - Clean Luminous Ambient Mesh
 * Provides a bright, crystal-clear background that guarantees 100% contrast and readability:
 * - Clean light canvas (#f8f9fe)
 * - Extremely soft, subtle pastel light wells (delicate lavender, soft mint, gentle cyan)
 * - Preserves complete typography legibility without any dark purple overlays.
 */
export default function BotanicalBackground() {
  return (
    <>
      {/* 1. Base Shell Canvas - Clean luminous background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[#f8f9fe]" 
        aria-hidden="true" 
      />

      {/* 2. Soft Ambient Radiance (Very subtle, soft pastel accents) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Upper-left Soft Lavender Glow */}
        <div 
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40"
          style={{ background: 'radial-gradient(circle, #e0e7ff 0%, transparent 70%)' }}
        />

        {/* Upper-right Soft Purple Mist */}
        <div 
          className="absolute -top-40 -right-40 w-[550px] h-[550px] rounded-full blur-[130px] opacity-35"
          style={{ background: 'radial-gradient(circle, #ede9fe 0%, transparent 70%)' }}
        />

        {/* Mid-right Gentle Mint Glow */}
        <div 
          className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full blur-[130px] opacity-25"
          style={{ background: 'radial-gradient(circle, #d1fae5 0%, transparent 70%)' }}
        />

        {/* Lower-left Soft Sky / Cyan Accent */}
        <div 
          className="absolute bottom-10 -left-40 w-[500px] h-[500px] rounded-full blur-[150px] opacity-30"
          style={{ background: 'radial-gradient(circle, #e0f2fe 0%, transparent 70%)' }}
        />
      </div>
    </>
  );
}

