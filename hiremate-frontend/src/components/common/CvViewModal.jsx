import React, { useState, useEffect } from 'react';
import { cvApi } from '../../api/cvApi';
import { applicationApi } from '../../api/applicationApi';
import { extractBlob } from '../../utils/excelExportUtils';
import ModalPortal from './ModalPortal';

/**
 * CvViewModal.jsx
 * Hộp thoại phóng to xem toàn diện bản CV gốc của ứng viên.
 * Thiết kế tối ưu không gian rộng rãi (tương tự modal GPKD toàn màn hình):
 * - Toàn bộ diện tích dành trọn cho bản PDF với 2 phân vùng native:
 *   + Bên trái: "Trang nhỏ" (Thumbnail thu nhỏ các trang tài liệu)
 *   + Bên phải: "Trang hiển thị PDF" (Bản hiển thị nội dung tài liệu tỷ lệ chuẩn A4 sắc nét)
 * - Tích hợp đầy đủ thanh công cụ PDF (Zoom, xoay, in, tải về).
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
  canDownload = true,
}) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState(null);
  const [previewType, setPreviewType] = useState('pdf'); // 'pdf' | 'image' | 'word'
  const [downloading, setDownloading] = useState(false);
  const [scanZoom, setScanZoom] = useState(100);
  const [scanRotate, setScanRotate] = useState(0);

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

      try {
        let loaded = false;
        let resolvedCvId = cvId;
        let resolvedCvUrl = cvUrl;

        // 0. Nếu chưa có cvId nhưng có candidateId, lấy CV từ profile
        if (!resolvedCvId && candidateId) {
          try {
            const profRes = await applicationApi.getCandidateProfile(candidateId);
            const prof = profRes?.data?.data || profRes?.data || profRes;
            if (prof?.cvs && Array.isArray(prof.cvs) && prof.cvs.length > 0) {
              const defCv = prof.cvs.find((c) => c.isDefault) || prof.cvs[0];
              if (defCv) {
                resolvedCvId = defCv.cvId;
                resolvedCvUrl = defCv.fileUrl || resolvedCvUrl;
              }
            }
          } catch (candErr) {
            console.warn('Không thể tìm CV từ candidate profile:', candErr);
          }
        }

        // 1. Tải blob preview từ backend endpoint
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
        }

        // 2. Fallback: Cloudinary hoặc link trực tiếp
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

  // Xử lý tải CV về máy tính
  const handleDownload = async () => {
    if (!canDownload) {
      alert('Tài khoản Free không hỗ trợ tải trực tiếp CV gốc. Vui lòng nâng cấp gói Hiring Starter (199.000đ) hoặc Pro để tải hồ sơ!');
      return;
    }
    try {
      setDownloading(true);
      const rawName = (fileName || `CV_${candidateName || 'Ung_Vien'}`).replace(/[\s/\\?%*:|"<>]+/g, '_');
      const hasKnownExt = /\.(pdf|docx|doc|png|jpg|jpeg|webp)$/i.test(rawName);
      const safeDownloadName = hasKnownExt ? rawName : `${rawName}.pdf`;

      if (cvId) {
        try {
          const response = await cvApi.downloadCv(cvId);
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
    if (!canDownload) {
      alert('Tài khoản Free không hỗ trợ tải trực tiếp CV gốc. Vui lòng nâng cấp gói Hiring Starter (199.000đ) hoặc Pro để tải hồ sơ!');
      return;
    }
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const effectiveName = candidateName || candidateData?.name || 'Ứng viên';
  const effectiveScore = atsScore != null ? atsScore : candidateData?.matchScore;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
        <div className="relative w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1500px] h-[94vh] max-h-[96vh] bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
          
          {/* ============================================================= */}
          {/* 1. TOP HEADER: Đầy Đủ Tên File, Ứng Viên & Nút Thao Tác      */}
          {/* ============================================================= */}
          <div className="px-5 sm:px-7 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex items-center justify-center px-2.5 py-1 rounded-xl border-2 border-red-500 text-red-600 font-extrabold text-xs tracking-wider shrink-0 bg-red-50/80 shadow-2xs">
                PDF
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate max-w-[320px] sm:max-w-lg" title={fileName}>
                    {fileName}
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 shrink-0">
                    Bản Gốc PDF
                  </span>
                  {effectiveScore != null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-200 shrink-0">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>{effectiveScore}% Match</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Ứng viên: <strong className="text-slate-800">{effectiveName}</strong></span>
                  <span>•</span>
                  <span>Lưu trữ bảo mật đám mây</span>
                </p>
              </div>
            </div>

            {/* Cụm Nút Thao Tác Góc Phải */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Zoom controls for Image format */}
              {previewType === 'image' && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setScanZoom((z) => Math.max(50, z - 20))}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer"
                    title="Thu nhỏ (-)"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_out</span>
                  </button>
                  <span className="px-1.5 font-mono text-[11px] font-bold text-slate-600 min-w-[40px] text-center">
                    {scanZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setScanZoom((z) => Math.min(250, z + 20))}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer"
                    title="Phóng to (+)"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanRotate((r) => (r + 90) % 360)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer"
                    title="Xoay 90 độ"
                  >
                    <span className="material-symbols-outlined text-sm">rotate_right</span>
                  </button>
                </div>
              )}

              {blobUrl && (
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-300 transition-colors shadow-2xs"
                  title="Mở tệp PDF toàn màn hình trong tab mới"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Mở tab</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-[#5b48bd] hover:bg-[#4a39a7] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                title="Tải tệp PDF về máy tính"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>{downloading ? 'Đang tải...' : 'Tải về'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-1"
                title="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* ============================================================= */}
          {/* 2. BODY KHUNG XEM TÀI LIỆU TOÀN DIỆN (100% DIỆN TÍCH RỘNG RÃI) */}
          {/* ============================================================= */}
          <div className="flex-1 p-3 sm:p-5 bg-slate-900/5 flex flex-col min-h-0 overflow-hidden">
            <div className="w-full h-full flex-1 rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex items-center justify-center bg-white relative">
              {loading ? (
                <div className="py-24 text-center space-y-3 m-auto">
                  <div className="w-12 h-12 border-4 border-[#5b48bd]/20 border-t-[#5b48bd] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">Đang tải và đồng bộ tệp CV gốc từ kho lưu trữ đám mây...</p>
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
                        Tệp CV gốc được ứng viên nộp dưới định dạng Word. Nhấn nút bên dưới để tải tệp về máy tính và xem nội dung chi tiết.
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
                        transform: `scale(${scanZoom / 100}) rotate(${scanRotate}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease',
                      }}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-300 bg-white"
                    />
                  </div>
                ) : (
                  /* 
                    KHUNG PDF NATIVE: Tự động chia 2 phân vùng chuẩn mực:
                    - Bên trái: "Trang nhỏ" (Sidebar thumbnail các trang)
                    - Bên phải: "Trang hiển thị PDF" (Bản hiển thị tài liệu rõ nét)
                    - Phía trên: Thanh công cụ native (Zoom, in ấn, xoay, tìm kiếm)
                  */
                  <iframe
                    src={
                      blobUrl.includes('#')
                        ? blobUrl.replace(/#.*$/, '#page=1&toolbar=1&navpanes=1')
                        : `${blobUrl}#page=1&toolbar=1&navpanes=1`
                    }
                    title={fileName}
                    className="w-full h-full flex-1 rounded-xl border-0 bg-white"
                  />
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
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#4a39a7] text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>{downloading ? 'Đang tải...' : 'Tải Tệp CV Về Máy'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================= */}
          {/* 3. BOTTOM FOOTER BAR (TƯƠNG TỰ MODAL GPKD DOANH NGHIỆP)       */}
          {/* ============================================================= */}
          <div className="px-5 sm:px-7 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-base text-emerald-600">verified_user</span>
              <span>Tài liệu hồ sơ ứng viên được bảo mật trên nền tảng HireMate AI.</span>
            </div>

            <div className="flex items-center gap-2.5">
              {candidateId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.hash = `#/candidate-evaluation?candidateId=${candidateId}${cvId ? `&cvId=${cvId}` : ''}`;
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] border border-purple-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  <span>Mở Bảng Đánh Giá Chi Tiết AI →</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Tải Xuống File Gốc</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span>Mở Tab Mới</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
