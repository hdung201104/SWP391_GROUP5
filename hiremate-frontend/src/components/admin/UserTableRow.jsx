import React from 'react';

// ─── Role badge config ───────────────────────────────────────────────────────
const ROLE_CONFIG = {
  CANDIDATE: {
    label: 'Candidate',
    icon: 'person',
    className: 'bg-[#8C9A84]/12 text-[#2D3A31] border-[#8C9A84]/30',
  },
  RECRUITER: {
    label: 'Recruiter',
    icon: 'business_center',
    className: 'bg-[#C27B66]/12 text-[#C27B66] border-[#C27B66]/30',
  },
  ADMIN: {
    label: 'Admin',
    icon: 'admin_panel_settings',
    className: 'bg-[#2D3A31]/12 text-[#2D3A31] border-[#2D3A31]/20',
  },
};

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    dot: 'bg-[#8C9A84]',
    className: 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/35',
  },
  INACTIVE: {
    label: 'Inactive',
    dot: 'bg-[#DCCFC2]',
    className: 'bg-[#DCCFC2]/50 text-[#2D3A31]/55 border-[#DCCFC2]',
  },
  BLOCKED: {
    label: 'Blocked',
    dot: 'bg-[#C27B66]',
    className: 'bg-[#C27B66]/15 text-[#C27B66] border-[#C27B66]/35',
  },
};

/**
 * UserTableRow — A single row in the Admin User Management table.
 *
 * Props:
 *  user         {object}   — user record (userId, email, fullName, phone, role, status, createdAt, avatarUrl)
 *  onBlock      {function} — called with (user) when Block action is chosen
 *  onActivate   {function} — called with (user) when Activate action is chosen
 *  onViewDetail {function} — called with (user) when the row is expanded
 */
export default function UserTableRow({ user, onBlock, onActivate, onViewDetail }) {
  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.CANDIDATE;
  const statusCfg = STATUS_CONFIG[user.status] || STATUS_CONFIG.INACTIVE;

  const canBlock = user.status === 'ACTIVE' || user.status === 'INACTIVE';
  const canActivate = user.status === 'BLOCKED' || user.status === 'INACTIVE';

  return (
    <tr className="group border-b border-[#E6E2DA] hover:bg-[#F2F0EB] transition-colors duration-150">
      {/* ── User identity ── */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#2D3A31]/10 border border-[#E6E2DA] overflow-hidden shrink-0 flex items-center justify-center">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="material-symbols-outlined text-[18px] text-[#8C9A84]">person</span>
            )}
          </div>
          {/* Name + phone */}
          <div className="min-w-0">
            <p className="text-[13.5px] font-sans font-semibold text-[#2D3A31] truncate max-w-[150px]">
              {user.fullName}
            </p>
            {user.phone && (
              <p className="text-[11px] font-sans text-[#8C9A84] truncate">{user.phone}</p>
            )}
          </div>
        </div>
      </td>

      {/* ── Email ── */}
      <td className="px-4 py-3.5">
        <p className="text-[13px] font-sans text-[#2D3A31]/80 truncate max-w-[200px]">
          {user.email}
        </p>
      </td>

      {/* ── Role ── */}
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full border ${roleCfg.className}`}
        >
          <span className="material-symbols-outlined text-[13px]">{roleCfg.icon}</span>
          {roleCfg.label}
        </span>
      </td>

      {/* ── Status ── */}
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full border ${statusCfg.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </td>

      {/* ── Created ── */}
      <td className="px-4 py-3.5">
        <p className="text-[12.5px] font-sans text-[#2D3A31]/55 whitespace-nowrap">
          {user.createdAt}
        </p>
      </td>

      {/* ── Actions ── */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          {/* View detail */}
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(user)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9A84] hover:bg-[#8C9A84]/15 hover:text-[#2D3A31] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
              title="View details"
              aria-label={`View details for ${user.fullName}`}
            >
              <span className="material-symbols-outlined text-[17px]">visibility</span>
            </button>
          )}

          {/* Activate */}
          {canActivate && onActivate && (
            <button
              onClick={() => onActivate(user)}
              className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2.5 py-1.5 rounded-lg bg-[#8C9A84]/15 text-[#2D3A31] hover:bg-[#8C9A84]/30 border border-[#8C9A84]/30 hover:border-[#8C9A84]/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
              aria-label={`Activate ${user.fullName}`}
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Activate
            </button>
          )}

          {/* Block */}
          {canBlock && onBlock && (
            <button
              onClick={() => onBlock(user)}
              className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2.5 py-1.5 rounded-lg bg-[#C27B66]/12 text-[#C27B66] hover:bg-[#C27B66]/25 border border-[#C27B66]/25 hover:border-[#C27B66]/45 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C27B66]/40"
              aria-label={`Block ${user.fullName}`}
            >
              <span className="material-symbols-outlined text-[14px]">block</span>
              Block
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
