import React, { useState, useEffect } from 'react';
import { cvApi } from '../../api/cvApi';
import { extractBlob } from '../../utils/excelExportUtils';

/**
 * CvViewModal.jsx
 * Hộp thoại mở và xem trực tiếp bản CV file gốc (PDF/Ảnh) của Ứng viên khi HR ấn "Xem CV".
 * Giữ nguyên file gốc đính kèm, hỗ trợ mở toàn màn hình và tải về máy.
 */
export default function CvViewModal({
  isOpen,
  onClose,
  cvId,
  cvUrl,
  fileName = 'CV_Ung_Vien.pdf',
  candidateName = 'Ứng viên',
  atsScore = null,
}) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState(null);
  const [previewType, setPreviewType] = useState('pdf'); // 'pdf' | 'image' | 'none'
  const [cvDetail, setCvDetail] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper kiểm tra blob có phải là dữ liệu PDF thực sự hay JSON báo lỗi
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

        // 1. Tải blob preview từ backend endpoint nếu có cvId
        if (cvId) {
          try {
            const previewRes = await cvApi.previewCv(cvId);
            const blob = extractBlob(previewRes, 'application/pdf');
            if (await isValidPdfBlob(blob)) {
              const url = window.URL.createObjectURL(blob);
              currentBlob = url;
              if (isMounted) {
                setBlobUrl(url);
                setPreviewType('pdf');
              }
              loaded = true;
            }
          } catch (prevErr) {
            console.warn('Lỗi tải preview blob, chuyển sang download blob:', prevErr);
          }

          if (!loaded) {
            try {
              const dlRes = await cvApi.downloadCv(cvId);
              const dlBlob = extractBlob(dlRes, 'application/pdf');
              if (await isValidPdfBlob(dlBlob)) {
                const url = window.URL.createObjectURL(dlBlob);
                currentBlob = url;
                if (isMounted) {
                  setBlobUrl(url);
                  setPreviewType('pdf');
                }
                loaded = true;
              }
            } catch (dlErr) {
              console.warn('Không thể tải download blob:', dlErr);
            }
          }

          // 2. Tải thông tin trích xuất CV
          try {
            const detailRes = await cvApi.getCvById(cvId);
            const cvData = detailRes?.data?.data || detailRes?.data;
            if (isMounted && cvData) {
              setCvDetail(cvData);
            }
          } catch (detErr) {
            console.warn('Không thể lấy chi tiết parsed CV:', detErr);
          }
        }

        // Fallback: nếu URL từ Cloudinary, dùng ảnh xem trước nét cao (.png) để không bị lỗi ACL Cloudinary 401
        if (!loaded && cvUrl && cvUrl !== '#' && cvUrl.startsWith('http')) {
          if (cvUrl.includes('res.cloudinary.com') && cvUrl.toLowerCase().endsWith('.pdf')) {
            const imgUrl = cvUrl.replace(/\.pdf$/i, '.png');
            if (isMounted) {
              setBlobUrl(imgUrl);
              setPreviewType('image');
              loaded = true;
            }
          } else {
            if (isMounted) {
              setBlobUrl(cvUrl);
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
  }, [cvId, cvUrl]);

  // Xử lý tải CV về máy
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const safeDownloadName = (fileName || `CV_${candidateName || 'Ung_Vien'}.pdf`).replace(/[\s/\\?%*:|"<>]+/g, '_');

      if (cvId) {
        try {
          const response = await cvApi.downloadCv(cvId);
          const blob = extractBlob(response, 'application/pdf');
          if (await isValidPdfBlob(blob)) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', safeDownloadName.endsWith('.pdf') ? safeDownloadName : `${safeDownloadName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return;
          }
        } catch (apiErr) {
          console.warn('downloadCv API error, falling back to direct link:', apiErr);
        }
      }

      if (blobUrl && blobUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', safeDownloadName.endsWith('.pdf') ? safeDownloadName : `${safeDownloadName}.pdf`);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-white border border-purple-100 rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50/70 via-indigo-50/30 to-white border-b border-purple-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#221d47] to-[#5b48bd] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              <span className="material-symbols-outlined text-xl">description</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#1e1b4b] truncate">
                  {fileName}
                </h3>
                {atsScore != null && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#5b48bd] border border-purple-200 inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                    {atsScore}% So Khớp AI
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                Ứng viên: <strong className="text-[#1e1b4b]">{candidateName}</strong> • Bản CV gốc nộp qua hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-xs border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tải tệp về máy"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">{downloading ? 'Đang tải...' : 'Tải Về'}</span>
            </button>

            {/* Open in New Tab Button */}
            {blobUrl && (
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Mở toàn màn hình trong tab mới"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span className="hidden sm:inline">Mở Tab Mới</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Content Body: Only Original CV Document */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 flex flex-col">
          {loading ? (
            <div className="py-20 text-center space-y-3 m-auto">
              <div className="w-10 h-10 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-semibold">Đang tải và đồng bộ tệp CV gốc...</p>
            </div>
          ) : blobUrl ? (
            previewType === 'image' ? (
              <div className="w-full h-[640px] bg-slate-900/5 rounded-2xl border border-purple-100 shadow-xs overflow-auto flex flex-col items-center justify-start p-3 sm:p-4">
                <div className="w-full flex items-center justify-between p-2.5 mb-3 bg-purple-50/90 rounded-xl border border-purple-200 text-xs shrink-0">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-purple-600">verified</span>
                    Bản CV File Gốc (Xem trước độ nét cao)
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-3.5 py-1.5 rounded-lg bg-[#5b48bd] text-white font-bold text-xs hover:bg-[#47369f] cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>{downloading ? 'Đang tải...' : 'Tải File Gốc'}</span>
                  </button>
                </div>
                <img
                  src={blobUrl}
                  alt="CV Preview"
                  className="max-w-full rounded-xl shadow-md border border-slate-200"
                />
              </div>
            ) : (
              <div className="w-full h-[640px] bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden flex flex-col">
                <div className="w-full flex items-center justify-between p-2.5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                      TÀI LIỆU PDF GỐC
                    </span>
                    <span className="text-slate-700 font-medium truncate max-w-xs">{fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenNewTab}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs cursor-pointer flex items-center gap-1"
                      title="Mở PDF toàn màn hình"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span className="hidden sm:inline">Toàn Màn Hình</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-3 py-1 rounded-lg bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>{downloading ? 'Đang tải...' : 'Tải PDF Về Máy'}</span>
                    </button>
                  </div>
                </div>
                <iframe
                  src={blobUrl}
                  title="CV Preview"
                  className="w-full flex-1 border-none"
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
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>{downloading ? 'Đang tải...' : 'Tải Tệp CV Về Máy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-purple-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>HireMate Secure CV Vault • PostgreSQL 3NF</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
}
