import React, { useState, useMemo } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import UserTableRow from '../../components/admin/UserTableRow';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const INITIAL_MOCK_USERS = [
  {
    userId: 1,
    fullName: 'Nguyễn Thị Lan',
    email: 'lan.nguyen@gmail.com',
    phone: '0912 345 678',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '12 Jan 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop',
  },
  {
    userId: 2,
    fullName: 'Trần Văn Minh',
    email: 'minh.tran@fpt.com.vn',
    phone: '0987 654 321',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '05 Feb 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&auto=format&fit=crop',
  },
  {
    userId: 3,
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@techcorp.vn',
    phone: '0903 111 222',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '18 Feb 2025',
    avatarUrl: '',
  },
  {
    userId: 4,
    fullName: 'Phạm Thị Thu',
    email: 'thu.pham@viettel.vn',
    phone: '0901 888 999',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '22 Feb 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop',
  },
  {
    userId: 5,
    fullName: 'Đỗ Quang Huy',
    email: 'huy.do@gmail.com',
    phone: '0933 456 789',
    role: 'CANDIDATE',
    status: 'BLOCKED',
    createdAt: '01 Mar 2025',
    avatarUrl: '',
  },
  {
    userId: 6,
    fullName: 'Vũ Thanh Hà',
    email: 'ha.vu@momo.vn',
    phone: '0978 222 333',
    role: 'RECRUITER',
    status: 'INACTIVE',
    createdAt: '10 Mar 2025',
    avatarUrl: '',
  },
  {
    userId: 7,
    fullName: 'Hoàng Đức Long',
    email: 'long.hoang@gmail.com',
    phone: '0945 777 111',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '15 Mar 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop',
  },
  {
    userId: 8,
    fullName: 'Bùi Thị Ngọc',
    email: 'ngoc.bui@zalopay.vn',
    phone: '0911 555 666',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '20 Mar 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop',
  },
  {
    userId: 9,
    fullName: 'Ngô Minh Tuấn',
    email: 'tuan.ngo@spam.xyz',
    phone: '',
    role: 'CANDIDATE',
    status: 'BLOCKED',
    createdAt: '25 Mar 2025',
    avatarUrl: '',
  },
  {
    userId: 10,
    fullName: 'Lý Thị Mai Anh',
    email: 'maianh.ly@gmail.com',
    phone: '0966 123 456',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '02 Apr 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&auto=format&fit=crop',
  },
  {
    userId: 11,
    fullName: 'Đinh Văn Phúc',
    email: 'phuc.dinh@hdbank.com.vn',
    phone: '0921 789 012',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '08 Apr 2025',
    avatarUrl: '',
  },
  {
    userId: 12,
    fullName: 'Tô Thị Hương',
    email: 'huong.to@gmail.com',
    phone: '0955 444 888',
    role: 'CANDIDATE',
    status: 'INACTIVE',
    createdAt: '14 Apr 2025',
    avatarUrl: '',
  },
  {
    userId: 13,
    fullName: 'Trương Quốc Bảo',
    email: 'bao.truong@vingroup.net',
    phone: '0908 321 654',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '20 Apr 2025',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop',
  },
  {
    userId: 14,
    fullName: 'Admin HireMate',
    email: 'admin@hiremate.vn',
    phone: '1900 xxxx',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '01 Jan 2025',
    avatarUrl: '',
  },
  {
    userId: 15,
    fullName: 'Mai Xuân Thịnh',
    email: 'thinh.mai@shopee.vn',
    phone: '0939 567 890',
    role: 'RECRUITER',
    status: 'BLOCKED',
    createdAt: '28 Apr 2025',
    avatarUrl: '',
  },
];

const ROLE_OPTIONS = ['ALL', 'CANDIDATE', 'RECRUITER', 'ADMIN'];
const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'];

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmBlockModal({ user, onConfirm, onCancel }) {
  if (!user) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-block-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3A31]/25 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Modal card */}
      <div className="relative card-botanical max-w-md w-full p-7 flex flex-col items-center text-center gap-4 animate-fade-in z-10">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#C27B66]/15 border border-[#C27B66]/25 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px] text-[#C27B66]">block</span>
        </div>

        <div>
          <h2
            id="confirm-block-title"
            className="text-[20px] font-serif font-bold text-[#2D3A31] mb-1"
          >
            Block This User?
          </h2>
          <p className="text-[13.5px] font-sans text-[#2D3A31]/65 leading-relaxed">
            You are about to block{' '}
            <strong className="text-[#2D3A31] font-semibold">{user.fullName}</strong>{' '}
            ({user.email}). They will lose access to the platform immediately.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onCancel}
            className="btn-botanical-secondary flex-1 py-2.5 text-xs rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user)}
            className="flex-1 py-2.5 text-xs font-sans font-bold rounded-full bg-[#C27B66] text-white hover:bg-[#b06b59] transition-all duration-300 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C27B66]/50"
          >
            Yes, Block User
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────
function UserDetailModal({ user, onClose }) {
  if (!user) return null;

  const statusColors = {
    ACTIVE: 'badge-sage',
    INACTIVE: 'bg-[#DCCFC2]/50 text-[#2D3A31]/55 border border-[#DCCFC2] rounded-full',
    BLOCKED: 'badge-terracotta',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        className="absolute inset-0 bg-[#2D3A31]/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative card-botanical max-w-sm w-full p-7 z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9A84] hover:bg-[#2D3A31]/8 hover:text-[#2D3A31] transition-all duration-150"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#2D3A31]/10 border-2 border-[#E6E2DA] overflow-hidden flex items-center justify-center mb-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[32px] text-[#8C9A84]">person</span>
            )}
          </div>
          <h2 id="detail-modal-title" className="text-[18px] font-serif font-bold text-[#2D3A31]">
            {user.fullName}
          </h2>
          <span className={`text-[11px] font-sans font-semibold px-3 py-1 rounded-full border mt-1.5 ${statusColors[user.status] || ''}`}>
            {user.status}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {[
            { icon: 'mail', label: 'Email', value: user.email },
            { icon: 'phone', label: 'Phone', value: user.phone || '—' },
            { icon: 'badge', label: 'Role', value: user.role },
            { icon: 'calendar_today', label: 'Joined', value: user.createdAt },
            { icon: 'fingerprint', label: 'User ID', value: `#${user.userId}` },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[17px] text-[#8C9A84] shrink-0">
                {row.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-wide">
                  {row.label}
                </p>
                <p className="text-[13px] font-sans text-[#2D3A31] truncate">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-botanical-secondary w-full mt-6 py-2.5 text-xs rounded-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUserManagementPage() {
  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [blockTarget, setBlockTarget] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ── Filtered list ──
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q));
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ── Actions ──
  const handleBlock = (user) => setBlockTarget(user);

  const handleConfirmBlock = (user) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === user.userId ? { ...u, status: 'BLOCKED' } : u))
    );
    setBlockTarget(null);
    showSuccess(`${user.fullName} has been blocked.`);
  };

  const handleActivate = (user) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === user.userId ? { ...u, status: 'ACTIVE' } : u))
    );
    showSuccess(`${user.fullName} is now active.`);
  };

  // ── Stats summary ──
  const totalActive = users.filter((u) => u.status === 'ACTIVE').length;
  const totalBlocked = users.filter((u) => u.status === 'BLOCKED').length;
  const totalInactive = users.filter((u) => u.status === 'INACTIVE').length;

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      <AdminSidebar
        activeSection="users"
        onNavigate={(_, hash) => { window.location.hash = hash; }}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10">

          {/* ── Page header ── */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-sans font-bold text-[#8C9A84] uppercase tracking-widest mb-1">
                  User Control · UC-33
                </p>
                <h1 className="text-[28px] lg:text-[34px] font-serif font-bold text-[#2D3A31] leading-tight tracking-tight">
                  Manage Users
                </h1>
                <p className="text-[14px] font-sans text-[#2D3A31]/60 mt-1.5">
                  View, search, and manage user accounts across all roles.
                </p>
              </div>

              {/* Summary pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C9A84]" />
                  {totalActive} Active
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full bg-[#DCCFC2]/50 text-[#2D3A31]/60 border border-[#DCCFC2]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DCCFC2]" />
                  {totalInactive} Inactive
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full bg-[#C27B66]/15 text-[#C27B66] border border-[#C27B66]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C27B66]" />
                  {totalBlocked} Blocked
                </span>
              </div>
            </div>
          </header>

          {/* ── Success toast ── */}
          {successMessage && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31]">
              <span className="material-symbols-outlined text-[18px] text-[#8C9A84]">
                check_circle
              </span>
              <p className="text-[13px] font-sans font-semibold">{successMessage}</p>
            </div>
          )}

          {/* ── Search + Filters ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#8C9A84]">
                search
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="input-botanical w-full pl-10 pr-4 py-2.5 text-[13px] font-sans focus:outline-none"
                aria-label="Search users"
              />
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={[
                    'text-[11px] font-sans font-semibold px-3 py-2 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
                    roleFilter === r
                      ? 'bg-[#2D3A31] text-white border-[#2D3A31]'
                      : 'bg-transparent text-[#2D3A31]/60 border-[#E6E2DA] hover:border-[#8C9A84] hover:text-[#2D3A31]',
                  ].join(' ')}
                  aria-pressed={roleFilter === r}
                >
                  {r === 'ALL' ? 'All Roles' : r}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={[
                    'text-[11px] font-sans font-semibold px-3 py-2 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
                    statusFilter === s
                      ? 'bg-[#2D3A31] text-white border-[#2D3A31]'
                      : 'bg-transparent text-[#2D3A31]/60 border-[#E6E2DA] hover:border-[#8C9A84] hover:text-[#2D3A31]',
                  ].join(' ')}
                  aria-pressed={statusFilter === s}
                >
                  {s === 'ALL' ? 'All Statuses' : s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Results info ── */}
          <p className="text-[12px] font-sans text-[#2D3A31]/45 mb-3">
            Showing {filteredUsers.length} of {users.length} users
          </p>

          {/* ── Table ── */}
          <div className="card-botanical overflow-hidden">
            {filteredUsers.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#8C9A84]/12 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[28px] text-[#8C9A84]">
                    search_off
                  </span>
                </div>
                <h3 className="text-[16px] font-serif font-bold text-[#2D3A31] mb-1">
                  No users found
                </h3>
                <p className="text-[13px] font-sans text-[#2D3A31]/55">
                  Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                  className="btn-botanical-secondary mt-4 py-2 px-5 text-xs rounded-full"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Scrollable table wrapper */
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]" aria-label="User management table">
                  <thead>
                    <tr className="border-b border-[#E6E2DA] bg-[#F9F8F4]">
                      {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-4 py-3 text-left text-[10px] font-sans font-bold text-[#2D3A31]/45 uppercase tracking-widest"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <UserTableRow
                        key={user.userId}
                        user={user}
                        onBlock={handleBlock}
                        onActivate={handleActivate}
                        onViewDetail={setDetailUser}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Modals ── */}
      <ConfirmBlockModal
        user={blockTarget}
        onConfirm={handleConfirmBlock}
        onCancel={() => setBlockTarget(null)}
      />
      <UserDetailModal
        user={detailUser}
        onClose={() => setDetailUser(null)}
      />
    </div>
  );
}
