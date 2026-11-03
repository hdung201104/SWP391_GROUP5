import React, { useState, useEffect } from 'react';
import { cvApi } from '../../api/cvApi';
import { applicationApi } from '../../api/applicationApi';
import { extractBlob } from '../../utils/excelExportUtils';
import ModalPortal from './ModalPortal';

/**
 * CvViewModal.jsx
 * Hộp thoại xem hồ sơ & tệp CV gốc ứng viên theo chuẩn Split-View 2 cột (tương tự modal thẩm định GPKD của Admin).
 * - Cột trái ("Trang nhỏ"): Tóm tắt thông tin ứng viên, điểm AI Match 70/30, kỹ năng cốt lõi và các nút thao tác.
 * - Cột phải ("Trang hiển thị PDF"): Trình xem tài liệu PDF chuẩn tỷ lệ, có bộ công cụ Zoom (+, -, Fit) và tải về.
 */
export default function CvViewModal({
  isOpen,
  onClose,
  cvId,
  cvUrl,
  candidateId = null,
  fileName = 'CV_Ung_Vien.pdf',
  candidateName = 'Ứng viên',
  atsScore = null,
  candidateData = null,
  jobTitle = '',
  status = '',
}) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState(null);
  const [previewType, setPreviewType] = useState('pdf'); // 'pdf' | 'image' | 'word'
  const [cvDetail, setCvDetail] = useState(null);
  const [candProfile, setCandProfile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [errorMsg, setErrorMsg] = useState('');

  const getMimeType = (fName, respType) => {
    if (respType && typeof respType === 'string' && respType.includes('/')) {
      if (!respType.includes('json') && !respType.includes('octet-stream')) {
        return respType;
      }
    }
    const name = String(fName || '').toLowerCase();
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (name.endsWith('.doc')) return 'application/msword';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/pdf';
  };

  const getDocType = (fName) => {
    const name = String(fName || '').toLowerCase();
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'word';
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image';
    return 'pdf';
  };

  const isValidPdfBlob = async (blob) => {
    if (!blob || blob.size < 200) return false;
    if (blob.size < 2048) {
      try {
        const text = await blob.text();
        if (text.startsWith('{') && (text.includes('"error"') || text.includes('"success":false'))) {
          return false;
        }
      } catch (ignored) {}
    }
    return true;
  };

  useEffect(() => {
    let currentBlob = null;
    let isMounted = true;

    const loadCvData = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        let loaded = false;
        let resolvedCvId = cvId;
        let resolvedCvUrl = cvUrl;

        // 0. Nếu có candidateId, tải thông tin hồ sơ để bổ trợ cho cột bên trái
        if (candidateId) {
          try {
            const profRes = await applicationApi.getCandidateProfile(candidateId);
            const prof = profRes?.data?.data || profRes?.data || profRes;
            if (isMounted && prof) {
              setCandProfile(prof);
              if (!resolvedCvId && prof.cvs && Array.isArray(prof.cvs) && prof.cvs.length > 0) {
                const defCv = prof.cvs.find((c) => c.isDefault) || prof.cvs[0];
                if (defCv) {
                  resolvedCvId = defCv.cvId;
                  resolvedCvUrl = defCv.fileUrl || resolvedCvUrl;
                }
              }
            }
          } catch (candErr) {
            console.warn('Không thể tìm hồ sơ ứng viên:', candErr);
          }
        }

        // 1. Tải blob preview từ backend endpoint nếu có resolvedCvId
        if (resolvedCvId) {
          const expectedDocType = getDocType(fileName);
          try {
            const previewRes = await cvApi.previewCv(resolvedCvId);
            const mime = getMimeType(fileName, previewRes?.headers?.['content-type']);
            const blob = extractBlob(previewRes, mime);
            if (await isValidPdfBlob(blob)) {
              const url = window.URL.createObjectURL(blob);
              currentBlob = url;
              if (isMounted) {
                setBlobUrl(url);
                setPreviewType(expectedDocType);
              }
              loaded = true;
            }
          } catch (prevErr) {
            console.warn('Lỗi tải preview blob, chuyển sang download blob:', prevErr);
          }

          if (!loaded) {
            try {
              const dlRes = await cvApi.downloadCv(resolvedCvId);
              const mime = getMimeType(fileName, dlRes?.headers?.['content-type']);
              const dlBlob = extractBlob(dlRes, mime);
              if (await isValidPdfBlob(dlBlob)) {
                const url = window.URL.createObjectURL(dlBlob);
                currentBlob = url;
                if (isMounted) {
                  setBlobUrl(url);
                  setPreviewType(expectedDocType);
                }
                loaded = true;
              }
            } catch (dlErr) {
              console.warn('Không thể tải download blob:', dlErr);
            }
          }

          // 2. Tải thông tin trích xuất CV (kỹ năng, kinh nghiệm, tóm tắt)
          try {
            const detailRes = await cvApi.getCvById(resolvedCvId);
            const cvData = detailRes?.data?.data || detailRes?.data;
            if (isMounted && cvData) {
              setCvDetail(cvData);
            }
          } catch (detErr) {
            console.warn('Không thể lấy chi tiết parsed CV:', detErr);
          }
        }

        // 3. Fallback: nếu URL từ Cloudinary hoặc link web trực tiếp
        if (!loaded && resolvedCvUrl && resolvedCvUrl !== '#' && resolvedCvUrl.startsWith('http')) {
          if (resolvedCvUrl.includes('res.cloudinary.com') && resolvedCvUrl.toLowerCase().endsWith('.pdf')) {
            const imgUrl = resolvedCvUrl.replace(/\.pdf$/i, '.png');
            if (isMounted) {
              setBlobUrl(imgUrl);
              setPreviewType('image');
              loaded = true;
            }
          } else {
            if (isMounted) {
              setBlobUrl(resolvedCvUrl);
              setPreviewType('pdf');
              loaded = true;
            }
          }
        }
      } catch (err) {
        console.error('loadCvData error:', err);
        if (isMounted) setErrorMsg('Không thể tải bản xem trước CV. Vui lòng tải về máy để xem.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCvData();

    return () => {
      isMounted = false;
      if (currentBlob) {
        window.URL.revokeObjectURL(currentBlob);
      }
    };
  }, [cvId, cvUrl, candidateId]);

  // Xử lý tải CV về máy
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const rawName = (fileName || `CV_${candidateName || 'Ung_Vien'}`).replace(/[\s/\\?%*:|"<>]+/g, '_');
      const hasKnownExt = /\.(pdf|docx|doc|png|jpg|jpeg|webp)$/i.test(rawName);
      const safeDownloadName = hasKnownExt ? rawName : `${rawName}.pdf`;
      const targetCvId = cvId || cvDetail?.cvId;

      if (targetCvId) {
        try {
          const response = await cvApi.downloadCv(targetCvId);
          const mime = getMimeType(safeDownloadName, response?.headers?.['content-type']);
          const blob = extractBlob(response, mime);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', safeDownloadName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return;
        } catch (apiErr) {
          console.warn('downloadCv API error, falling back to direct link:', apiErr);
        }
      }

      if (blobUrl && blobUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', safeDownloadName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      if (cvUrl && cvUrl !== '#' && cvUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = cvUrl;
        link.setAttribute('download', safeDownloadName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      alert('Không tìm thấy tệp CV khả dụng để tải về.');
    } catch (e) {
      alert('Lỗi tải tệp: ' + (e.message || 'Kiểm tra đường truyền'));
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  // Điều khiển Zoom
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 180));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);

  // Trích xuất dữ liệu tổng hợp ứng viên
  const effectiveName = candidateName || candidateData?.name || candProfile?.fullName || 'Ứng viên';
  const effectiveEmail = candidateData?.email || candProfile?.email || 'Chưa cập nhật email';
  const effectivePhone = candidateData?.phone || candProfile?.phone || 'Chưa cập nhật SĐT';
  const effectiveScore = atsScore != null ? atsScore : (candidateData?.matchScore != null ? candidateData.matchScore : null);
  const effectiveJob = jobTitle || candidateData?.jobTitle || 'Vị trí tuyển dụng';
  const effectiveStatus = status || candidateData?.status || 'REVIEWING';
  const effectiveAvatar = candidateData?.avatar || candProfile?.avatarUrl || null;

  // Trích xuất parsed JSON nếu có
  let parsedJson = null;
  if (cvDetail?.parsedJson) {
    try {
      parsedJson = typeof cvDetail.parsedJson === 'string' ? JSON.parse(cvDetail.parsedJson) : cvDetail.parsedJson;
    } catch (e) {}
  }

  // Danh sách kỹ năng
  const extractedSkills = Array.isArray(parsedJson?.skills)
    ? parsedJson.skills
    : (Array.isArray(candidateData?.skills) ? candidateData.skills : (candProfile?.skills || []));

  // Tóm tắt nghề nghiệp
  const summaryText = parsedJson?.summary || cvDetail?.summary || candProfile?.bio || candidateData?.summary || 'Hồ sơ đã được đồng bộ hóa và thẩm định trên nền tảng HireMate AI.';

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-xs animate-fade-in font-sans">
        <div className="relative w-full max-w-6xl xl:max-w-7xl h-[92vh] max-h-[96vh] bg-white border border-slate-200 rounded-[28px] shadow-2xl flex flex-col overflow-hidden">
          
          {/* ============================================================= */}
          {/* TOP HEADER: Giống chuẩn Modal Thẩm định GPKD của Admin        */}
          {/* ============================================================= */}
          <div className="px-5 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 flex-wrap">
            {/* Cụm Tiêu Đề Bên Trái: Badge PDF + Tên File + Tên Ứng Viên + Điểm Match */}
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <div className="flex items-center justify-center px-2 py-0.5 rounded-lg border-2 border-red-500 text-red-600 font-extrabold text-xs tracking-wider shrink-0 bg-red-50/70">
                PDF
              </div>
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate tracking-tight max-w-[280px] sm:max-w-md" title={fileName}>
                  {fileName}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 shrink-0">
                  PDF
                </span>
                <span className="text-xs text-slate-500 font-medium truncate hidden md:inline">
                  • Ứng viên: <strong className="text-slate-800">{effectiveName}</strong>
                </span>
                {effectiveScore != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-200 shrink-0">
                    <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                    <span>{effectiveScore}% Match</span>
                  </span>
                )}
              </div>
            </div>

            {/* Cụm Thao Tác Bên Phải: Bộ Zoom Controls + Mở tab mới + Tải về + Đóng modal */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Bộ điều khiển Zoom PDF */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                  title="Thu nhỏ CV (-)"
                >
                  -
                </button>
                <span className="text-[11px] font-bold text-slate-700 min-w-[36px] text-center font-mono">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                  title="Phóng to CV (+)"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="ml-1 px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 cursor-pointer transition-colors"
                  title="Vừa trang (Fit Page)"
                >
                  Fit
                </button>
              </div>

              {blobUrl && (
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 border border-slate-200 transition-colors shadow-2xs"
                  title="Mở tài liệu PDF trong tab mới"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span className="hidden sm:inline">Mở tab</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="px-3.5 py-1.5 bg-[#5b48bd] hover:bg-[#4a39a7] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                title="Tải tệp PDF về máy tính"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>{downloading ? 'Đang tải...' : 'Tải về'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-1"
                title="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* ============================================================= */}
          {/* BODY: SPLIT-VIEW 2 CỘT (CỘT TRÁI: TRANG NHỎ | CỘT PHẢI: PDF)  */}
          {/* ============================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
            
            {/* ----------------------------------------------------------- */}
            {/* CỘT TRÁI (col-span-5 / col-span-4): "TRANG NHỎ" TÓM TẮT      */}
            {/* ----------------------------------------------------------- */}
            <div className="lg:col-span-5 xl:col-span-4 p-5 border-r border-slate-200 overflow-y-auto space-y-4 flex flex-col justify-between bg-slate-50/60">
              <div className="space-y-4">
                
                {/* 1. Thẻ Định Danh Ứng Viên */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b48bd] to-indigo-500 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 overflow-hidden">
                      {effectiveAvatar ? (
                        <img src={effectiveAvatar} alt={effectiveName} className="w-full h-full object-cover" />
                      ) : (
                        effectiveName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-base text-[#1e1b4b] truncate">{effectiveName}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{effectiveJob}</p>
                    </div>
                  </div>

                  {/* Trạng thái đơn tuyển dụng */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Trạng thái:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                      {effectiveStatus === 'APPLIED' ? 'Mới nộp hồ sơ' :
                       effectiveStatus === 'SCREENING' ? 'Đang xét duyệt' :
                       effectiveStatus === 'INTERVIEW' ? 'Vòng phỏng vấn' :
                       effectiveStatus === 'OFFERED' ? 'Đã gửi Offer' :
                       effectiveStatus === 'HIRED' ? 'Đã trúng tuyển' :
                       effectiveStatus === 'REJECTED' ? 'Đã từ chối' : 'Đang xem xét'}
                    </span>
                  </div>
                </div>

                {/* 2. Điểm Số Đánh Giá AI Match 70/30 */}
                {effectiveScore != null && (
                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">auto_awesome</span>
                        <span>Điểm Phù Hợp ATS 70/30</span>
                      </span>
                      <span className="text-sm font-extrabold text-[#5b48bd] font-mono">{effectiveScore}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5b48bd] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(effectiveScore, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      {effectiveScore >= 75
                        ? '🌟 Ứng viên xuất sắc: Đáp ứng vượt trội các kỹ năng bắt buộc và kinh nghiệm JD.'
                        : effectiveScore >= 50
                        ? '⚡ Ứng viên tiềm năng: Đáp ứng tốt yêu cầu cơ bản, cần trao đổi sâu khi phỏng vấn.'
                        : '📋 Cần xem xét thêm: Mức độ tương thích kỹ năng ở mức trung bình so với JD.'}
                    </p>
                  </div>
                )}

                {/* 3. Thông Tin Liên Hệ */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5 text-xs">
                  <h5 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#5b48bd]">contacts</span>
                    <span>Thông tin liên hệ</span>
                  </h5>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[200px]" title={effectiveEmail}>
                      {effectiveEmail}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Điện thoại:</span>
                    <span className="font-mono font-bold text-slate-700">{effectivePhone}</span>
                  </div>
                </div>

                {/* 4. Kỹ Năng Cốt Lõi (Core Skills) */}
                {Array.isArray(extractedSkills) && extractedSkills.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <h5 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#5b48bd]">psychology</span>
                      <span>Kỹ năng nhận diện ({extractedSkills.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {extractedSkills.slice(0, 10).map((skill, idx) => {
                        const skillName = typeof skill === 'string' ? skill : (skill?.skillName || skill?.name || '');
                        if (!skillName) return null;
                        return (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/70"
                          >
                            {skillName}
                          </span>
                        );
                      })}
                      {extractedSkills.length > 10 && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-purple-700 bg-purple-50">
                          +{extractedSkills.length - 10} kỹ năng khác
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Tóm Tắt Năng Lực (Summary) */}
                {summaryText && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                    <h5 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#5b48bd]">format_quote</span>
                      <span>Tóm tắt hồ sơ ứng viên</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-4">
                      "{summaryText}"
                    </p>
                  </div>
                )}
              </div>

              {/* 6. Nút Hành Động Ở Đáy Cột Trái */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                {candidateId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.hash = `#/candidate-evaluation?candidateId=${candidateId}${cvId ? `&cvId=${cvId}` : ''}`;
                    }}
                    className="w-full py-2.5 px-4 bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">analytics</span>
                    <span>Mở Bảng Đánh Giá Chi Tiết AI →</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Tải Bản Gốc ({fileName})</span>
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* CỘT PHẢI (col-span-7 / col-span-8): "TRANG HIỂN THỊ PDF"    */}
            {/* ----------------------------------------------------------- */}
            <div className="lg:col-span-7 xl:col-span-8 p-3 sm:p-4 bg-slate-900/5 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto flex items-center justify-center min-h-[500px] relative">
                {loading ? (
                  <div className="py-24 text-center space-y-3 m-auto">
                    <div className="w-10 h-10 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">Đang tải và đồng bộ tệp CV gốc từ kho lưu trữ bảo mật...</p>
                  </div>
                ) : blobUrl ? (
                  previewType === 'word' ? (
                    <div className="w-full h-full bg-white rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 text-center m-auto">
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                        <span className="material-symbols-outlined text-4xl">description</span>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                          Tài Liệu Microsoft Word (.docx)
                        </span>
                        <h4 className="font-bold text-base text-[#1e1b4b] mt-3">{fileName}</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                          Tệp CV gốc được ứng viên nộp dưới định dạng Word (.docx). Vui lòng nhấn nút bên dưới để tải tệp về máy tính hoặc mở qua phần mềm văn phòng.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>{downloading ? 'Đang tải...' : 'Tải File Word Về Máy'}</span>
                      </button>
                    </div>
                  ) : previewType === 'image' ? (
                    <div className="w-full h-full bg-slate-900/5 overflow-auto flex items-center justify-center p-4">
                      <img
                        src={blobUrl}
                        alt="CV Preview"
                        style={{
                          transform: `scale(${zoomLevel / 100})`,
                          transition: 'transform 0.15s ease-out',
                        }}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                      />
                    </div>
                  ) : (
                    /* Frame Hiển Thị File PDF Chuẩn Tỷ Lệ (Tương tự Admin GPKD) */
                    <div className="w-full h-full flex-1 overflow-auto flex items-center justify-center bg-white p-1">
                      <iframe
                        src={
                          blobUrl.includes('#')
                            ? blobUrl.replace(/#.*$/, '#page=1&view=Fit&toolbar=1&navpanes=0')
                            : `${blobUrl}#page=1&view=Fit&toolbar=1&navpanes=0`
                        }
                        title={fileName}
                        style={{
                          width: zoomLevel === 100 ? '100%' : `${zoomLevel}%`,
                          minWidth: '100%',
                          height: '100%',
                          minHeight: '650px',
                          border: 'none',
                          transition: 'width 0.15s ease-out',
                        }}
                        className="w-full h-full flex-1 rounded-2xl border-0 bg-white"
                      />
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm max-w-md mx-auto my-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#1e1b4b]">{fileName}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Tài liệu CV bản gốc đính kèm của ứng viên. Nhấn nút bên dưới để tải trực tiếp tệp về máy tính hoặc mở xem toàn màn hình.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#4a39a7] text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>{downloading ? 'Đang tải...' : 'Tải Tệp CV Về Máy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
