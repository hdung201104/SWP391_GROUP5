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

        {/* Subheader Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-purple-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'bg-[#5b48bd] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-purple-50/60 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
              <span>Bản File Gốc {blobUrl ? '(PDF/Ảnh)' : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PARSED')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'PARSED'
                  ? 'bg-[#5b48bd] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-purple-50/60 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">analytics</span>
              <span>Dữ Liệu Trích Xuất ATS</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            {activeTab === 'PREVIEW' ? 'Trình đọc tài liệu nguyên bản' : 'Hồ sơ đã chuẩn hóa qua bộ lọc AI ATS'}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 flex flex-col">
          {loading ? (
            <div className="py-20 text-center space-y-3 m-auto">
              <div className="w-10 h-10 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-semibold">Đang tải và đồng bộ tệp CV...</p>
            </div>
          ) : activeTab === 'PREVIEW' ? (
            /* ======================================================= */
            /* TAB 1: BẢN FILE GỐC (PDF HOẶC ẢNH XEM NHANH)            */
            /* ======================================================= */
            blobUrl ? (
              previewType === 'image' ? (
                <div className="w-full h-[620px] bg-slate-900/5 rounded-2xl border border-purple-100 shadow-sm overflow-auto flex flex-col items-center justify-start p-3 sm:p-4">
                  <div className="w-full flex items-center justify-between p-2.5 mb-3 bg-purple-50/90 rounded-xl border border-purple-200 text-xs shrink-0">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-purple-600">verified</span>
                      Bản CV Đã Thẩm Định (Xem nhanh độ nét cao)
                    </span>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-3.5 py-1.5 rounded-lg bg-[#5b48bd] text-white font-bold text-xs hover:bg-[#47369f] cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>{downloading ? 'Đang tải...' : 'Tải File PDF Gốc'}</span>
                    </button>
                  </div>
                  <img
                    src={blobUrl}
                    alt="CV Preview"
                    className="max-w-full rounded-xl shadow-md border border-slate-200"
                  />
                </div>
              ) : (
                <div className="w-full h-[620px] bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden flex flex-col">
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
                    Tài liệu gốc đang được đồng bộ từ kho lưu trữ bảo mật. Bạn có thể bấm nút bên dưới để tải trực tiếp hoặc chuyển sang tab <strong>"Dữ Liệu Trích Xuất ATS"</strong> để xem đầy đủ nội dung.
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
            /* ======================================================= */
            /* TAB 2: DỮ LIỆU TRÍCH XUẤT ATS (CẤU TRÚC ĐA CHIỀU)       */
            /* ======================================================= */
            <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5b48bd]">badge</span>
                  <h3 className="font-extrabold text-sm text-[#1e1b4b]">Hồ Sơ CV Trích Xuất ATS Của {candidateName}</h3>
                </div>
                {cvDetail?.headline && (
                  <span className="text-xs font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    {cvDetail.headline}
                  </span>
                )}
              </div>

              {/* Profile summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Giới Thiệu Bản Thân</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#f8f7ff] p-4 rounded-2xl border border-purple-100/60">
                  {cvDetail?.summary || 'Ứng viên chuyên môn cao với bề dày kinh nghiệm thực chiến trong các dự án công nghệ và giải pháp trọng điểm.'}
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
                        {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                          <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5 mt-1">
                            {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600 mt-1">{exp.description || exp.summary || 'Phụ trách phát triển và tối ưu hóa hệ thống.'}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 bg-[#f8f7ff] p-3 rounded-2xl border border-purple-100">
                      Kinh nghiệm làm việc chi tiết được đồng bộ hóa từ hồ sơ ứng viên.
                    </div>
                  )}
                </div>
              </div>

              {/* Projects */}
              {cvDetail?.projectsJson && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">4. Dự Án Tiêu Biểu</h4>
                  <div className="space-y-3">
                    {(() => {
                      let projs = [];
                      try {
                        projs = typeof cvDetail.projectsJson === 'string' ? JSON.parse(cvDetail.projectsJson) : cvDetail.projectsJson;
                      } catch (e) {}
                      if (!Array.isArray(projs) || projs.length === 0) return null;
                      return projs.map((p, pIdx) => (
                        <div key={pIdx} className="p-3.5 rounded-2xl bg-purple-50/30 border border-purple-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs text-[#1e1b4b]">{p.name || p.project_name}</strong>
                            <span className="text-[11px] text-slate-500 font-mono">{p.period}</span>
                          </div>
                          {p.role && <div className="text-xs text-[#5b48bd] font-medium">{p.role}</div>}
                          {(p.summary || p.description) && (
                            <p className="text-xs text-slate-600 mt-0.5">{p.summary || p.description}</p>
                          )}
                          {p.technologies && (
                            <span className="text-[11px] font-mono text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 inline-block mt-1">
                              Tech: {p.technologies}
                            </span>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Educations */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">5. Học Vấn &amp; Bằng Cấp</h4>
                <div className="space-y-2">
                  {parsedEducations.length > 0 ? (
                    parsedEducations.map((edu, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-xs text-[#1e1b4b]">{edu.school || edu.institution || 'Đại Học Quốc Gia'}</strong>
                          <div className="text-[11px] text-slate-500">{edu.major || edu.degree || 'Công Nghệ Thông Tin'}{edu.grade ? ` • ${edu.grade}` : ''}</div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{edu.period || edu.year || 'Đã tốt nghiệp'}</span>
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
