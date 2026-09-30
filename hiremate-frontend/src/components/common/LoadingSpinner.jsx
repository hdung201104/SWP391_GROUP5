import React from 'react';

export default function LoadingSpinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        {/* Outer botanical forest ring */}
        <div className="absolute inset-0 rounded-full border-2 border-botanical-stone border-t-botanical-forest animate-spin"></div>
        {/* Inner terracotta & sage ring */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-botanical-terracotta border-b-botanical-sage animate-spin [animation-direction:reverse]"></div>
      </div>
      <p className="text-xs font-serif font-bold text-botanical-forest/75 tracking-wider uppercase animate-pulse">
        {text}
      </p>
    </div>
  );
}
