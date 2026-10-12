import React from 'react';

/**
 * MindskillsBackground (formerly BotanicalBackground)
 * Implements the Mindskills Purple / Indigo UI Design System Background:
 * 1. Deep Royal Purple / Indigo Shell (#3b2b8e)
 * 2. Soft Ambient Radial Light Wells (Violet & Mint glowing halos)
 */
export default function BotanicalBackground() {
  return (
    <>
      {/* 1. Base Shell Canvas */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[#3b2b8e]" 
        aria-hidden="true" 
      />

      {/* 2. Soft Ambient Radiance (Violet & Mint Light Wells) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Upper-left Indigo Glow */}
        <div 
          className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-[140px] opacity-40"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />

        {/* Upper-right Violet Glow */}
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[130px] opacity-30"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />

        {/* Lower-left Mint Accent Glow */}
        <div 
          className="absolute bottom-10 -left-48 w-[500px] h-[500px] rounded-full blur-[150px] opacity-15"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        />

        {/* Lower-right Royal Purple Glow */}
        <div 
          className="absolute -bottom-40 right-10 w-[700px] h-[600px] rounded-full blur-[140px] opacity-35"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }}
        />
      </div>
    </>
  );
}

