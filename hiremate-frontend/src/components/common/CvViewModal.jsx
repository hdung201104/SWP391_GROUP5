import React, { useState, useEffect } from 'react';
import { cvApi } from '../../api/cvApi';
import { applicationApi } from '../../api/applicationApi';
import { extractBlob } from '../../utils/excelExportUtils';
import ModalPortal from './ModalPortal';

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
  candidateId = null,
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
        let resolvedCvId = cvId;
        let resolvedCvUrl = cvUrl;

        // 0. Nếu cvId bị thiếu nhưng có candidateId, tự động truy vấn CV từ hồ sơ ứng viên
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

          // 2. Tải thông tin trích xuất CV
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

        // 3. Fallback: nếu URL từ Cloudinary, dùng ảnh xem trước nét cao (.png) để không bị lỗi ACL Cloudinary 401
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

        // 4. Fallback tối hậu: Thử mở CV khác từ hồ sơ ứng viên nếu CV chính bị lỗi
        if (!loaded && candidateId) {
          try {
            const profRes = await applicationApi.getCandidateProfile(candidateId);
            const prof = profRes?.data?.data || profRes?.data || profRes;
            if (prof?.cvs && Array.isArray(prof.cvs)) {
              for (const altCv of prof.cvs) {
                if (loaded) break;
                if (altCv.cvId && altCv.cvId !== resolvedCvId) {
                  try {
                    const altRes = await cvApi.previewCv(altCv.cvId);
                    const altBlob = extractBlob(altRes, 'application/pdf');
                    if (await isValidPdfBlob(altBlob)) {
                      const url = window.URL.createObjectURL(altBlob);
                      currentBlob = url;
                      if (isMounted) {
                        setBlobUrl(url);
                        setPreviewType('pdf');
                      }
                      loaded = true;
                      break;
                    }
                  } catch (ignored) {}
                }
              }
            }
          } catch (ignored) {}
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
      const targetCvId = cvId || cvDetail?.cvId || (candidateId ? 1 : null);

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

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-xs animate-fade-in font-sans">
        <div className="relative w-full max-w-6xl xl:max-w-7xl h-[92vh] max-h-[96vh] bg-white border border-slate-200 rounded-[28px] shadow-2xl flex flex-col overflow-hidden">
          {/* Top Header: Matching Desired Layout (Red PDF Icon + File Name + Badges + Actions) */}
          <div className="px-5 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            {/* Left: Red PDF Icon + File name + Red PDF Badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center px-2 py-0.5 rounded-lg border-2 border-red-500 text-red-600 font-extrabold text-xs tracking-wider shrink-0 bg-red-50/70">
                PDF
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate tracking-tight" title={fileName}>
                  {fileName}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 shrink-0">
                  PDF
                </span>
                {candidateName && candidateName !== 'Ứng viên' && (
                  <span className="text-xs text-slate-500 font-medium truncate hidden md:inline">
                    • Ứng viên: <strong className="text-slate-800">{candidateName}</strong>
                  </span>
                )}
                {atsScore != null && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b48bd] border border-purple-200 shrink-0">
                    <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                    <span>{atsScore}% Match</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions (Mở tab + Tải về + Close) */}
            <div className="flex items-center gap-2.5 shrink-0">
              {blobUrl && (
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-300 transition-colors shadow-2xs"
                  title="Mở tài liệu PDF trong tab mới"
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
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Content Body: Full-height Dark Frame for Real PDF Experience */}
          <div className="flex-1 p-3 sm:p-4 bg-slate-100/90 flex flex-col min-h-0 overflow-hidden">
            {loading ? (
              <div className="py-24 text-center space-y-3 m-auto">
                <div className="w-10 h-10 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-semibold">Đang tải và đồng bộ tệp CV gốc...</p>
              </div>
            ) : blobUrl ? (
              previewType === 'word' ? (
                <div className="w-full h-full bg-white rounded-2xl border border-blue-200 shadow-xs flex flex-col items-center justify-center p-8 space-y-4 text-center">
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
                <div className="w-full h-full bg-[#323639] rounded-2xl border border-slate-700 shadow-inner overflow-auto flex items-center justify-center p-4">
                  <img
                    src={blobUrl}
                    alt="CV Preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : (
                /* Native PDF Document Frame (Optimal Zoom, Sidebar Navigation & Toolbar) */
                <div className="w-full h-full flex-1 rounded-2xl bg-[#323639] border border-slate-700 shadow-inner overflow-hidden flex flex-col relative">
                  <iframe
                    src={blobUrl?.includes('#') ? blobUrl : `${blobUrl}#page=1&view=Fit&toolbar=1&navpanes=0`}
                    title={fileName}
                    className="w-full h-full flex-1 border-0 rounded-2xl bg-[#323639]"
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
                  {candidateId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.hash = `#/candidate-evaluation?candidateId=${candidateId}`;
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] border border-purple-200 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">badge</span>
                      <span>Xem Hồ Sơ Ứng Viên</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
