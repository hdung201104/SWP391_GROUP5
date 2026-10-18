import * as XLSX from 'xlsx';

/**
 * Utility to extract Blob from an Axios response whether response.data is unwrapped or not
 */
export function extractBlob(res, defaultType = 'application/octet-stream') {
  if (!res) return null;
  if (res instanceof Blob) return res;
  if (res.data instanceof Blob) return res.data;
  if (res.data) {
    return new Blob([res.data], { type: defaultType });
  }
  return new Blob([res], { type: defaultType });
}

/**
 * Auto-fit column widths for SheetJS worksheets
 */
function autoFitColumns(data) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (const row of data) {
      const val = row[key];
      if (val !== null && val !== undefined) {
        const strVal = String(val);
        if (strVal.length > maxLen) {
          maxLen = Math.min(strVal.length, 50); // cap max width at 50
        }
      }
    }
    return { wch: Math.max(maxLen + 3, 12) };
  });
}

/**
 * 1. Export Candidates List for a Job to Native Excel (.xlsx)
 */
export function exportCandidatesToExcel({ candidates = [], jobDetails = {}, fileName = null }) {
  const exportData = candidates.map((c, idx) => ({
    'STT': idx + 1,
    'Mã Hồ Sơ': c.applicationId || c.id || `APP-${idx + 1}`,
    'Họ Và Tên': c.name || 'Ứng viên',
    'Email': c.email || c.role || 'N/A',
    'Chuyên Môn / Vai Trò': c.role || 'Ứng viên',
    'Điểm AI Match (%)': `${c.matchScore ?? 0}%`,
    'Xếp Loại Phù Hợp': c.matchCategory || 'Chưa xếp loại',
    'Kỹ Năng Đạt Chuẩn (70%)': Array.isArray(c.mandatoryMatched) && c.mandatoryMatched.length > 0
      ? c.mandatoryMatched.join(', ')
      : 'Chưa ghi nhận',
    'Kỹ Năng Ưu Tiên (30%)': Array.isArray(c.preferredMatched) && c.preferredMatched.length > 0
      ? c.preferredMatched.join(', ')
      : 'Không có',
    'Kỹ Năng Chưa Đáp Ứng': Array.isArray(c.mandatoryMissing) && c.mandatoryMissing.length > 0
      ? c.mandatoryMissing.join(', ')
      : 'Không',
    'Trạng Thái Tuyển Dụng': c.statusLabel || c.stage || 'Mới nộp',
    'Ngày Nộp': c.appliedTime || 'Gần đây',
    'Đánh Giá Từ AI Copilot': c.aiQuote || 'Đã đối soát qua hệ thống HireMate AI ATS',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);

  XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Ứng Viên');

  const finalName = fileName || `DS_Ung_Vien_${jobDetails?.code || 'JD'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

/**
 * 2. Export Recruiter Dashboard Report to Native Excel (.xlsx)
 */
export function exportRecruiterReportToExcel({ applications = [], stats = {}, companyName = 'Doanh Nghiệp' }) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Tổng quan chỉ số
  const summaryData = [
    { 'Chỉ Số Tuyển Dụng': 'Công Ty Tuyển Dụng', 'Giá Trị': companyName },
    { 'Chỉ Số Tuyển Dụng': 'Ngày Xuất Báo Cáo', 'Giá Trị': new Date().toLocaleDateString('vi-VN') },
    { 'Chỉ Số Tuyển Dụng': 'Tổng Đơn Ứng Tuyển', 'Giá Trị': stats.totalApplicants || applications.length },
    { 'Chỉ Số Tuyển Dụng': 'Điểm Phù Hợp AI Trung Bình', 'Giá Trị': stats.avgScore || 'N/A' },
    { 'Chỉ Số Tuyển Dụng': 'Ứng Viên Tiềm Năng Cao (>=85%)', 'Giá Trị': stats.topGoldCount || 0 },
    { 'Chỉ Số Tuyển Dụng': 'Tiến Độ Sàng Lọc', 'Giá Trị': stats.screenedPercent || 'N/A' },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = autoFitColumns(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Chỉ Số Tuyển Dụng');

  // Sheet 2: Danh sách đơn ứng tuyển
  const appsData = applications.map((a, idx) => ({
    'STT': idx + 1,
    'Mã Đơn': a.applicationId ? `APP-${a.applicationId}` : `APP-${idx + 1}`,
    'Tên Ứng Viên': a.candidateName || 'Ứng viên',
    'Email': a.candidateEmail || 'N/A',
    'Vị Trí Tuyển Dụng': a.jobTitle || 'N/A',
    'Điểm AI Match (%)': `${a.matchingScore ?? 0}%`,
    'Trạng Thái': a.status || 'APPLIED',
    'Ngày Nộp': a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
  }));
  const wsApps = XLSX.utils.json_to_sheet(appsData);
  wsApps['!cols'] = autoFitColumns(appsData);
  XLSX.utils.book_append_sheet(wb, wsApps, 'Chi Tiết Đơn Tuyển');

  const finalName = `Bao_Cao_Tuyen_Dung_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

/**
 * 3. Export Admin Companies List to Native Excel (.xlsx)
 */
export function exportAdminCompaniesToExcel(companies = []) {
  const exportData = companies.map((c, idx) => ({
    'STT': idx + 1,
    'Mã Doanh Nghiệp': c.id || `DN-${idx + 1}`,
    'Tên Doanh Nghiệp': c.name || c.companyName || 'N/A',
    'Mã Số Thuế': c.taxCode || c.tax_code || 'Chưa cung cấp',
    'Email Đại Diện': c.email || 'N/A',
    'Số Điện Thoại': c.phone || 'N/A',
    'Địa Chỉ': c.address || 'N/A',
    'Website': c.website || 'N/A',
    'Trạng Thái Xác Minh': c.status === 'APPROVED' ? 'Đã duyệt' : c.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt',
    'Ngày Nộp Hồ Sơ': c.submittedAt || c.createdAt || 'N/A',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Doanh Nghiệp');

  XLSX.writeFile(wb, `DS_Doanh_Nghiep_HireMate_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 4. Export Admin Users List to Native Excel (.xlsx)
 */
export function exportAdminUsersToExcel(users = []) {
  const exportData = users.map((u, idx) => ({
    'STT': idx + 1,
    'Mã Người Dùng': u.userId || u.id || `USR-${idx + 1}`,
    'Họ Và Tên': u.fullName || u.name || 'N/A',
    'Email': u.email || 'N/A',
    'Vai Trò (Role)': u.role || 'CANDIDATE',
    'Số Điện Thoại': u.phone || 'N/A',
    'Trạng Thái': u.status || 'ACTIVE',
    'Ngày Tạo': u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'N/A',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Người Dùng');

  XLSX.writeFile(wb, `DS_Nguoi_Dung_HireMate_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 5. Export Recruiter Job Postings to Native Excel (.xlsx)
 */
export function exportJobsToExcel(jobs = [], companyName = 'Doanh Nghiệp') {
  const exportData = jobs.map((j, idx) => ({
    'STT': idx + 1,
    'Mã Tin Tuyển Dụng': j.code || `JD-${j.id || idx + 1}`,
    'Chức Danh Công Việc': j.title || 'N/A',
    'Địa Điểm Làm Việc': j.location || 'N/A',
    'Mức Lương': j.salaryText || j.salary || 'Thương lượng',
    'Chỉ Tiêu Tuyển Dụng': j.vacanciesCount || 1,
    'Số Lượng Ứng Viên Nộp': j.applicantCount ?? j.applicantsCount ?? 0,
    'Trạng Thái Đăng Tuyển': j.statusBadge || j.status || 'Đang mở tuyển',
    'Trạng Thái Phê Duyệt': j.approvalStatus || 'APPROVED',
    'Hạn Nộp Hồ Sơ': j.deadlineDate || 'Không thời hạn',
    'Ngày Tạo': j.createdAt ? new Date(j.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Tin Tuyển Dụng');

  XLSX.writeFile(wb, `DS_Tin_Tuyen_Dung_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
