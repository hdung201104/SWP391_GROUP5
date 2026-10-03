import React from 'react';

/**
 * StatsCard — Reusable KPI card for Admin UI
 * Follows Botanical Organic Serif design system.
 *
 * Props:
 *  icon        {string}  Material Symbol icon name
 *  iconBg      {string}  Tailwind bg class for icon backdrop (e.g. 'bg-[#8C9A84]/15')
 *  iconColor   {string}  Tailwind text color for icon (e.g. 'text-[#2D3A31]')
 *  label       {string}  Card label / metric name
 *  value       {string|number} Main KPI value displayed prominently
 *  description {string}  Optional small description below value
 *  trend       {string}  Optional trend label, e.g. '+12% this month'
 *  trendUp     {boolean} true = green trend, false = red trend, undefined = neutral
 *  onClick     {function} Optional click handler
 */
export default function StatsCard({
  icon = 'bar_chart',
  iconBg = 'bg-[#8C9A84]/15',
  iconColor = 'text-[#2D3A31]',
  label = 'Metric',
  value = '—',
  description,
  trend,
  trendUp,
  onClick,
}) {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
      onClick={isClickable ? onClick : undefined}
      className={[
        'card-botanical p-5 flex flex-col gap-4 group select-none',
        isClickable
          ? 'cursor-pointer hover:border-[#8C9A84] focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40'
          : '',
      ].join(' ')}
    >
      {/* Icon + Trend row */}
      <div className="flex items-start justify-between">
        {/* Icon bubble */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-105`}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>

        {/* Trend badge */}
        {trend && (
          <span
            className={[
              'text-[11px] font-semibold font-sans px-2 py-0.5 rounded-full border',
              trendUp === true
                ? 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30'
                : trendUp === false
                ? 'bg-[#C27B66]/15 text-[#C27B66] border-[#C27B66]/30'
                : 'bg-[#DCCFC2]/50 text-[#2D3A31]/60 border-[#DCCFC2]',
            ].join(' ')}
          >
            {trendUp === true ? '↑ ' : trendUp === false ? '↓ ' : ''}
            {trend}
          </span>
        )}
      </div>

      {/* Value + Label */}
      <div>
        <p className="text-[28px] font-serif font-bold text-[#2D3A31] leading-none tracking-tight">
          {value}
        </p>
        <p className="text-[13px] font-sans font-semibold text-[#2D3A31]/70 mt-1 uppercase tracking-wide">
          {label}
        </p>
        {description && (
          <p className="text-[12px] font-sans text-[#2D3A31]/50 mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
