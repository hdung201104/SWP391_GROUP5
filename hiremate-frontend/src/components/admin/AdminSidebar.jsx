import React, { useState } from 'react';

// ─── Navigation items ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    hash: '#/admin-dashboard',
  },
  {
    id: 'users',
    label: 'Manage Users',
    icon: 'manage_accounts',
    hash: '#/admin-users',
  },
  {
    id: 'questions',
    label: 'Question Bank',
    icon: 'quiz',
    hash: '#/admin-questions',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'analytics',
    hash: '#/admin-analytics',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * AdminSidebar
 *
 * Props:
 *  activeSection {string}   — one of 'dashboard' | 'users' | 'questions' | 'analytics'
 *  onNavigate    {function} — called with (sectionId, hashPath) when a nav item is clicked
 */
export default function AdminSidebar({ activeSection = 'dashboard', onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (item) => {
    if (onNavigate) onNavigate(item.id, item.hash);
    // Navigate via hash so App.jsx can pick it up once wired
    window.location.hash = item.hash;
    setMobileOpen(false);
  };

  // ── Shared item renderer ──
  const renderNavItem = (item) => {
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item)}
        className={[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group',
          isActive
            ? 'bg-[#2D3A31] text-white shadow-soft'
            : 'text-[#2D3A31]/70 hover:bg-[#2D3A31]/8 hover:text-[#2D3A31]',
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
      >
        <span
          className={[
            'material-symbols-outlined text-[20px] shrink-0 transition-colors duration-200',
            isActive ? 'text-white' : 'text-[#8C9A84] group-hover:text-[#2D3A31]',
          ].join(' ')}
        >
          {item.icon}
        </span>
        <span className="text-[13.5px] font-sans font-semibold truncate">{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C27B66] shrink-0" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          DESKTOP SIDEBAR  (lg and up)
      ═══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen bg-[#F9F8F4] border-r border-[#E6E2DA] px-4 pt-6 pb-8 sticky top-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-1 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#2D3A31] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-white">eco</span>
          </div>
          <div>
            <p className="text-[14px] font-serif font-bold text-[#2D3A31] leading-tight">
              HireMate AI
            </p>
            <p className="text-[10px] font-sans font-semibold text-[#C27B66] uppercase tracking-widest">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E6E2DA] mb-4" />

        {/* Navigation label */}
        <p className="text-[10px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1" aria-label="Admin navigation">
          {NAV_ITEMS.map(renderNavItem)}
        </nav>

        {/* Divider */}
        <div className="border-t border-[#E6E2DA] my-4" />

        {/* Bottom info */}
        <div className="px-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#2D3A31] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[15px] text-white">
                admin_panel_settings
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-sans font-semibold text-[#2D3A31] truncate">
                System Admin
              </p>
              <p className="text-[11px] font-sans text-[#8C9A84] truncate">admin@hiremate.vn</p>
            </div>
          </div>
          <button
            onClick={() => { window.location.hash = '#/'; }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#2D3A31]/60 hover:text-[#2D3A31] hover:bg-[#2D3A31]/8 transition-all duration-200 text-left"
            aria-label="Back to main site"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="text-[12px] font-sans font-semibold">Back to Site</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════
          MOBILE TOP BAR  (below lg)
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {/* Mobile header bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#F9F8F4]/95 backdrop-blur-md border-b border-[#E6E2DA] h-14 flex items-center justify-between px-4 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2D3A31] flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px] text-white">eco</span>
            </div>
            <div>
              <p className="text-[13px] font-serif font-bold text-[#2D3A31] leading-tight">
                HireMate <span className="text-[#C27B66]">Admin</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2D3A31] hover:bg-[#2D3A31]/10 transition-all duration-200"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={[
            'fixed top-14 left-0 right-0 z-40 bg-[#F9F8F4] border-b border-[#E6E2DA] shadow-soft-md transition-all duration-300 overflow-hidden',
            mobileOpen ? 'max-h-96 py-3 px-4' : 'max-h-0',
          ].join(' ')}
        >
          <nav className="flex flex-col gap-1" aria-label="Admin mobile navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item)}
                  className={[
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left',
                    isActive
                      ? 'bg-[#2D3A31] text-white'
                      : 'text-[#2D3A31]/70 hover:bg-[#2D3A31]/8 hover:text-[#2D3A31]',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={[
                      'material-symbols-outlined text-[20px] shrink-0',
                      isActive ? 'text-white' : 'text-[#8C9A84]',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[14px] font-sans font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-[#2D3A31]/10"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Spacer so page content doesn't go under the mobile bar */}
        <div className="h-14" />
      </div>
    </>
  );
}
