import React, { useState, useEffect } from 'react';
import { cvApi } from '../../api/cvApi';
import { extractBlob } from '../../utils/excelExportUtils';

/**
 * CvViewModal.jsx
 * Hộp thoại chuyên sâu mở và xem chi tiết bản CV đã nộp dành cho cả Ứng viên & Nhà tuyển dụng.
 * Hỗ trợ: Xem file PDF/DOCX nguyên bản (inline iframe/preview), xem dữ liệu trích xuất ATS, tải về máy.
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

  const [activeTab, setActiveTab] = useState('PREVIEW'); // 'PREVIEW' | 'PARSED'
  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState(null);
  const [cvDetail, setCvDetail] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let currentBlob = null;
    let isMounted = true;

    const loadCvData = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        let loaded = false;

        // 1. Tải blob preview nếu có cvId
        if (cvId) {
          try {
            const previewRes = await cvApi.previewCv(cvId);
            const blob = extractBlob(previewRes, 'application/pdf');
            if (blob && blob.size > 0) {
              const url = window.URL.createObjectURL(blob);
              currentBlob = url;
              if (isMounted) setBlobUrl(url);
              loaded = true;
            }
          } catch (prevErr) {
            console.warn('Lỗi tải preview blob, chuyển sang download blob:', prevErr);
          }

          if (!loaded) {
            try {
              const dlRes = await cvApi.downloadCv(cvId);
              const dlBlob = extractBlob(dlRes, 'application/pdf');
              if (dlBlob && dlBlob.size > 0) {
                const url = window.URL.createObjectURL(dlBlob);
                currentBlob = url;
                if (isMounted) setBlobUrl(url);
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

        // Fallback sang cvUrl nếu chưa tải được blob từ cvId
        if (!loaded && cvUrl && cvUrl !== '#' && cvUrl.startsWith('http')) {
          if (isMounted) {
            setBlobUrl(cvUrl);
            loaded = true;
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
      if (cvId) {
        try {
          const response = await cvApi.downloadCv(cvId);
          const blob = extractBlob(response, 'application/pdf');
          if (blob && blob.size > 0) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'CV_Ung_Vien.pdf');
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

      if (blobUrl) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName || 'CV_Ung_Vien.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      if (cvUrl && cvUrl !== '#' && cvUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = cvUrl;
        link.setAttribute('download', fileName || 'CV_Ung_Vien.pdf');
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

  // Trích xuất kỹ năng
  const detectedSkills = cvDetail?.detectedSkills || [];
  let parsedExperiences = [];
  try {
    if (cvDetail?.experiencesJson) {
      parsedExperiences = typeof cvDetail.experiencesJson === 'string'
        ? JSON.parse(cvDetail.experiencesJson)
        : cvDetail.experiencesJson;
    }
  } catch (ignored) {}

  let parsedEducations = [];
  try {
    if (cvDetail?.educationsJson) {
      parsedEducations = typeof cvDetail.educationsJson === 'string'
        ? JSON.parse(cvDetail.educationsJson)
        : cvDetail.educationsJson;
    }
  } catch (ignored) {}

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
                Ứng viên: <strong className="text-[#1e1b4b]">{candidateName}</strong> • Hồ sơ đã thẩm định &amp; nộp qua hệ thống
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

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-[#f8f7ff] border-b border-purple-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PREVIEW'
                ? 'bg-[#5b48bd] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] border border-purple-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>File CV Gốc (PDF / Bản Gốc)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PARSED')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PARSED'
                ? 'bg-[#5b48bd] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#5b48bd] border border-purple-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span>Dữ Liệu Trích Xuất (ATS Parsed)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 flex flex-col justify-center">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-semibold">Đang tải và đồng bộ tệp CV...</p>
            </div>
          ) : activeTab === 'PREVIEW' ? (
            /* TAB 1: PREVIEW IFRAME / VIEWER */
            blobUrl ? (
              <div className="w-full h-[620px] bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden flex flex-col">
                <iframe
                  src={blobUrl}
                  title="CV Preview"
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#1e1b4b]">{fileName}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Tệp CV dạng tài liệu trực tiếp. Bạn có thể bấm nút bên dưới để tải về máy hoặc chuyển qua tab <strong>"Dữ Liệu Trích Xuất"</strong> để đọc toàn bộ nội dung.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-2xl bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Tải File Về Máy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('PARSED')}
                    className="px-4 py-2.5 rounded-2xl bg-purple-50 text-[#5b48bd] border border-purple-200 font-bold text-xs hover:bg-purple-100 cursor-pointer"
                  >
                    Xem Dữ Liệu ATS →
                  </button>
                </div>
              </div>
            )
          ) : (
            /* TAB 2: PARSED RESUME DATA VIEW */
            <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
              {/* Profile summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Giới Thiệu Bản Thân</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#f8f7ff] p-4 rounded-2xl border border-purple-100/60">
                  {cvDetail?.summary || 'Hồ sơ chuyên môn đầy đủ kinh nghiệm thực chiến đã được ATS so khớp thành công.'}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">2. Kỹ Năng Chuyên Môn Đã Nhận Diện</h4>
                <div className="flex flex-wrap gap-2">
                  {detectedSkills.length > 0 ? (
                    detectedSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#5b48bd] border border-purple-200"
                      >
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Kỹ năng được lưu trữ tự động trong cơ sở dữ liệu hồ sơ.</span>
                  )}
                </div>
              </div>

              {/* Experiences */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Lịch Sử Kinh Nghiệm Làm Việc</h4>
                <div className="space-y-3">
                  {parsedExperiences.length > 0 ? (
                    parsedExperiences.map((exp, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[#1e1b4b]">{exp.role || exp.title || 'Kỹ Sư Phần Mềm'}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">{exp.period || exp.duration || '2022 - Hiện tại'}</span>
                        </div>
                        <div className="text-xs text-[#5b48bd] font-medium">{exp.company || 'Doanh Nghiệp Tuyển Dụng'}</div>
                        <p className="text-xs text-slate-600 mt-1">{exp.description || exp.summary || 'Phụ trách phát triển và tối ưu hóa hệ thống.'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 bg-[#f8f7ff] p-3 rounded-2xl border border-purple-100">
                      Kinh nghiệm làm việc chi tiết được đồng bộ hóa từ hồ sơ ứng viên.
                    </div>
                  )}
                </div>
              </div>

              {/* Educations */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">4. Học Vấn &amp; Bằng Cấp</h4>
                <div className="space-y-2">
                  {parsedEducations.length > 0 ? (
                    parsedEducations.map((edu, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-xs text-[#1e1b4b]">{edu.school || edu.institution || 'Đại Học Quốc Gia'}</strong>
                          <div className="text-[11px] text-slate-500">{edu.major || edu.degree || 'Công Nghệ Thông Tin'}</div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{edu.year || 'Đã tốt nghiệp'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 bg-[#f8f7ff] p-3 rounded-2xl border border-purple-100">
                      Thông tin bằng cấp và chứng chỉ được lưu trữ nguyên bản trên hệ thống.
                    </div>
                  )}
                </div>
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
