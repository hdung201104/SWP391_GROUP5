/**
 * HireMate AI - Job Time & Deadline Utilities
 * Computes exact countdown, overdue days, and visual status badges for job deadlines.
 */

export const calculateJobDeadline = (deadlineDate) => {
  if (!deadlineDate) {
    return {
      hasDeadline: false,
      isExpired: false,
      isExpiringSoon: false,
      daysLeft: null,
      daysOverdue: 0,
      label: 'Không thời hạn',
      badgeText: 'Đang mở tuyển',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      statusType: 'ACTIVE',
      formattedDate: 'Không thời hạn',
      alertMessage: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = deadline.toLocaleDateString('vi-VN');

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      hasDeadline: true,
      isExpired: true,
      isExpiringSoon: false,
      daysLeft: diffDays,
      daysOverdue: overdue,
      label: `Đã quá hạn ${overdue} ngày`,
      badgeText: `Đã quá hạn ${overdue} ngày`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
      alertClass: 'bg-rose-50 border-rose-200 text-rose-800',
      statusType: 'EXPIRED',
      formattedDate,
      alertMessage: `Tin tuyển dụng này đã hết hạn nộp hồ sơ vào ngày ${formattedDate} (Quá hạn ${overdue} ngày).`,
    };
  }

  if (diffDays === 0) {
    return {
      hasDeadline: true,
      isExpired: false,
      isExpiringSoon: true,
      daysLeft: 0,
      daysOverdue: 0,
      label: 'Hết hạn hôm nay!',
      badgeText: 'Hết hạn hôm nay',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse',
      alertClass: 'bg-amber-50 border-amber-200 text-amber-800',
      statusType: 'EXPIRING_SOON',
      formattedDate,
      alertMessage: `Tin tuyển dụng sẽ đóng nhận hồ sơ vào cuối ngày hôm nay (${formattedDate})!`,
    };
  }

  if (diffDays <= 7) {
    return {
      hasDeadline: true,
      isExpired: false,
      isExpiringSoon: true,
      daysLeft: diffDays,
      daysOverdue: 0,
      label: `Sắp hết hạn (Còn ${diffDays} ngày)`,
      badgeText: `Còn ${diffDays} ngày`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
      alertClass: 'bg-amber-50 border-amber-200 text-amber-800',
      statusType: 'EXPIRING_SOON',
      formattedDate,
      alertMessage: `Tin tuyển dụng sắp hết hạn! Chỉ còn ${diffDays} ngày để nộp hồ sơ (Hạn chót: ${formattedDate}).`,
    };
  }

  return {
    hasDeadline: true,
    isExpired: false,
    isExpiringSoon: false,
    daysLeft: diffDays,
    daysOverdue: 0,
    label: `Còn ${diffDays} ngày`,
    badgeText: `Còn ${diffDays} ngày`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    alertClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    statusType: 'ACTIVE',
    formattedDate,
    alertMessage: null,
  };
};
