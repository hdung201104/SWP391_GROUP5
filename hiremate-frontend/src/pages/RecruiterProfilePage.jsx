import React, { useState, useEffect } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { companyApi, jobApi, applicationApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseSkillList } from '../utils/helpers';

export default function RecruiterProfilePage({ user, onNavigate }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();

  // Active Main Tab: 'overview' (Tổng Quan & Môi Trường) | 'jobs' (Vị Trí Tuyển Dụng) | 'locations' (Địa Điểm & Chi Nhánh)
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Company Information State
  // Company Information State
  const [companyInfo, setCompanyInfo] = useState(() => {
    let extra = {};
    try {
      const saved = localStorage.getItem('hiremate_company_info_extra');
      if (saved) extra = JSON.parse(saved);
    } catch {}
    return {
      name: user?.companyName || 'Doanh Nghiệp Tuyển Dụng',
      badge: 'Doanh Nghiệp Đã Xác Thực',
      tagline: extra.tagline || 'Doanh nghiệp tuyển dụng kết nối tài năng công nghệ thông minh với HireMate AI.',
      website: 'https://hiremate.ai',
      industry: 'Công Nghệ Thông Tin & Phần Mềm',
      industrySub: 'AI Solutions, Cloud Architecture, Digital Transformation',
      headcount: '100 - 500 nhân sự',
      establishedYear: extra.establishedYear || '2020',
      headquarters: 'Hà Nội & TP. Hồ Chí Minh',
      markets: extra.markets || 'Việt Nam & Quốc tế',
      overviewText:
        `${user?.companyName || 'Doanh nghiệp'} là đơn vị uy tín tiên phong chuyển đổi số và phát triển giải pháp công nghệ cao. Đồng hành cùng hệ sinh thái HireMate AI, chúng tôi không ngừng mở rộng đội ngũ kỹ sư chất lượng, xây dựng môi trường làm việc cởi mở, sáng tạo và trao quyền tối đa cho nhân sự.`,
      logoUrl: null,
      coverUrl: extra.coverUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80',
    };
  });

  // HR Representative (Người Đại Diện Tuyển Dụng)
  const [hrRepresentative, setHrRepresentative] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_hr_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: user?.fullName || 'Lê Hoàng Nam',
      title: 'Lead Talent Acquisition Partner • Senior Tech Recruiter',
      division: `Ban Tuyển Dụng & Thu Hút Nhân Tài • ${user?.companyName || 'Doanh Nghiệp'}`,
      email: user?.email || 'recruiter@hiremate.ai',
      hotline: user?.phone || '0988 777 666',
      responseTime: 'Phản hồi trong vòng 30 phút (Giờ hành chính)',
      avatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      bio:
        `Phụ trách kết nối và tư vấn lộ trình sự nghiệp công nghệ cho các kỹ sư tài năng gia nhập ${user?.companyName || 'doanh nghiệp'}. Sẵn sàng đồng hành cùng ứng viên từ vòng thẩm định hồ sơ tới phỏng vấn chuyên sâu.`,
    };
  });

  // Active Job Openings List
  const [jobsList, setJobsList] = useState([]);

  // Fetch real company info & active jobs from Supabase
  const fetchCompanyAndJobs = async () => {
    try {
      setIsLoading(true);
      const [compRes, jobsRes] = await Promise.allSettled([
        companyApi.getMyCompany(),
        jobApi.getMyJobs(),
      ]);

      if (compRes.status === 'fulfilled' && compRes.value?.data) {
        const c = compRes.value.data;
        const compName = c.companyName || user?.companyName || 'Doanh Nghiệp Tuyển Dụng';
        setCompanyInfo((prev) => ({
          ...prev,
          name: compName,
          tagline: c.description || prev.tagline,
          website: c.website || prev.website,
          industry: c.industry || prev.industry,
          headcount: c.companySize || prev.headcount,
          headquarters: c.address || prev.headquarters,
          overviewText: c.description || `${compName} là doanh nghiệp tiên phong phát triển các giải pháp số và thu hút nhân tài công nghệ. Chúng tôi tạo dựng môi trường làm việc chuẩn quốc tế và lộ trình thăng tiến rộng mở cho mọi ứng viên.`,
          logoUrl: c.logoUrl || prev.logoUrl,
        }));

        setHrRepresentative((prev) => ({
          ...prev,
          name: user?.fullName || prev.name,
          email: user?.email || prev.email,
          hotline: user?.phone || prev.hotline,
          division: `Ban Tuyển Dụng & Thu Hút Nhân Tài • ${compName}`,
          bio: `Phụ trách kết nối và tư vấn lộ trình sự nghiệp công nghệ cho các ứng viên gia nhập ${compName}. Sẵn sàng đồng hành cùng bạn suốt quy trình phỏng vấn.`,
        }));
      }

      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data)) {
        const rawJobs = jobsRes.value.data;
        const mapped = await Promise.all(
          rawJobs.map(async (j) => {
            let appCount = 0;
            try {
              const appsRes = await applicationApi.getJobApplications(j.jobId);
              if (Array.isArray(appsRes?.data)) appCount = appsRes.data.length;
            } catch (ignored) {}

            return {
              id: j.jobId,
              title: j.title || 'Vị trí tuyển dụng',
              salary: j.salaryMin && j.salaryMax ? `$${j.salaryMin} – $${j.salaryMax} USD / tháng` : 'Thỏa thuận',
              location: j.location || 'Việt Nam',
              level: j.employmentType || 'Toàn thời gian',
              tags: parseSkillList(j.requirements, ['Kỹ năng chuyên môn']).slice(0, 4),
              postedTime: j.createdAt ? new Date(j.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
              applicantCount: appCount,
              isHot: j.status === 'PUBLISHED',
            };
          })
        );
        setJobsList(mapped);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin công ty:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyAndJobs();
  }, []);

  // Workplace Gallery Default & Dynamic State
  const defaultWorkplacePhotos = [
    {
      title: 'Khuôn viên xanh & Không gian làm việc sinh thái',
      desc: 'Môi trường làm việc mở, hài hòa thiên nhiên với cảnh quan cây xanh và không gian thư giãn sinh thái.',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Không gian làm việc sáng tạo Open Workspace',
      desc: 'Trang bị bàn làm việc công thái học, ánh sáng tự nhiên và thiết bị máy trạm hiệu năng cao.',
      url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Pantry, Coffee Lounge & Không gian trao đổi ý tưởng',
      desc: 'Khu vực giải lao tiện nghi với đồ uống miễn phí, trà, cà phê và quầy ăn nhẹ.',
      url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Khu thể thao, Bể bơi vô cực & Tiện ích nội khu',
      desc: 'Sân bóng đá cỏ nhân tạo, phòng gym đa năng, bể bơi giải tỏa căng thẳng sau giờ làm việc.',
      url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const [workplacePhotos, setWorkplacePhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_workplace_photos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultWorkplacePhotos;
  });

  // Presets gợi ý ảnh cơ sở vật chất chất lượng cao
  const PHOTO_PRESETS = [
    {
      title: 'Campus sinh thái & Không gian xanh',
      desc: 'Môi trường làm việc mở, thân thiện thiên nhiên với cảnh quan cây xanh và hồ sinh thái.',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Không gian mở Open Workspace hiện đại',
      desc: 'Bàn ghế công thái học cao cấp, màn hình 4K và hệ thống máy trạm hiệu năng cao.',
      url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Khu vực Pantry, Trà & Coffee Lounge',
      desc: 'Quầy giải lao tiện nghi với đồ uống miễn phí, cà phê rang xay và thức ăn nhẹ.',
      url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Tổ hợp thể thao, Gym & Hồ bơi thư giãn',
      desc: 'Phòng gym đa năng, bể bơi vô cực và sân bóng giải tỏa năng lượng sau giờ làm.',
      url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Phòng hội nghị & Phòng họp công nghệ cao',
      desc: 'Trang bị hệ thống họp trực tuyến Telepresence, bảng tương tác thông minh và cách âm tiêu chuẩn.',
      url: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Khu vực sáng tạo & Brainstorming Hub',
      desc: 'Không gian trao đổi ý tưởng linh hoạt, kích thích sáng tạo và làm việc nhóm hiệu quả.',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // Presets gợi ý ảnh bìa cover
  const COVER_PRESETS = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1600&auto=format&fit=crop&q=80',
  ];

  // Presets Avatar HR
  const HR_AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://api.dicebear.com/7.x/bottts/svg?seed=hr_recruiter',
  ];

  // Default Culture & Values (Generic, clean, customizable for any enterprise)
  const defaultCompanyCulture = [
    {
      id: 'culture_1',
      icon: 'lightbulb',
      title: 'Đổi Mới Sáng Tạo (Innovation First)',
      desc: 'Không ngừng thử nghiệm các công nghệ mới nhất: GenAI, Cloud, Microservices và khuyến khích mọi ý tưởng đột phá từ kỹ sư.',
    },
    {
      id: 'culture_2',
      icon: 'diversity_3',
      title: 'Đồng Đội & Trao Quyền (Team Empowerment)',
      desc: 'Xây dựng môi trường bình đẳng, không khoảng cách cấp bậc, trao quyền tự chủ kỹ thuật tối đa cho các squad công nghệ.',
    },
    {
      id: 'culture_3',
      icon: 'verified_user',
      title: 'Cam Kết Chất Lượng (Customer Centricity)',
      desc: 'Đảm bảo độ tin cậy và an toàn bảo mật ở mức cao nhất cho các hệ thống phần mềm lõi phục vụ hàng triệu người dùng.',
    },
    {
      id: 'culture_4',
      icon: 'school',
      title: 'Phát Triển Không Giới Hạn (Continuous Growth)',
      desc: 'Hỗ trợ 100% học phí chứng chỉ quốc tế (AWS, GCP, CKA) và các chương trình đào tạo kỹ năng chuyên sâu.',
    },
  ];

  // Default Employee Benefits (Generic, customizable for any enterprise)
  const defaultCompanyBenefits = [
    {
      id: 'benefit_1',
      icon: 'savings',
      title: 'Thưởng hiệu suất & Tháng 13, 14, 15',
      desc: 'Chính sách đãi ngộ cạnh tranh, xét tăng lương 2 lần/năm, gói thưởng theo kết quả kinh doanh dự án hấp dẫn.',
    },
    {
      id: 'benefit_2',
      icon: 'health_and_safety',
      title: 'Bảo hiểm sức khỏe cao cấp & Bảo lãnh người thân',
      desc: 'Gói chăm sóc sức khỏe toàn diện hạn mức cao (nội trú, ngoại trú, nha khoa) cho nhân viên và bảo lãnh người thân tại các bệnh viện quốc tế.',
    },
    {
      id: 'benefit_3',
      icon: 'laptop_mac',
      title: 'Chế độ Hybrid & Thiết bị xịn',
      desc: 'Linh hoạt làm việc tại nhà 2 ngày/tuần. Trang bị MacBook Pro hoặc laptop cấu hình cao, màn hình chuyên dụng cho kỹ sư.',
    },
    {
      id: 'benefit_4',
      icon: 'workspace_premium',
      title: 'Tài trợ 100% chứng chỉ quốc tế',
      desc: 'Hỗ trợ toàn bộ chi phí thi các chứng chỉ AWS, GCP, Azure, CKA, PMP và thưởng nóng cho nhân sự đạt thành tích xuất sắc.',
    },
    {
      id: 'benefit_5',
      icon: 'directions_bus',
      title: 'Tuyến xe đưa đón & Trợ cấp di chuyển',
      desc: 'Hỗ trợ các chuyến xe đưa đón nhân viên thuận tiện tại các điểm chính hoặc trợ cấp chi phí đi lại.',
    },
    {
      id: 'benefit_6',
      icon: 'fitness_center',
      title: 'Tiện ích thể thao & Thư giãn nội khu',
      desc: 'Khu vực Pantry giải lao tiện nghi với đồ uống miễn phí, phòng Gym, câu lạc bộ thể thao và teambuilding định kỳ.',
    },
  ];

  const [companyCulture, setCompanyCulture] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_company_culture');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultCompanyCulture;
  });

  const [companyBenefits, setCompanyBenefits] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_company_benefits');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultCompanyBenefits;
  });

  // Default Offices & Campuses (Dynamically adapts to the current company)
  const defaultOfficeLocations = [
    {
      id: 'loc_1',
      name: `Trụ sở chính: ${companyInfo.name || 'Văn phòng chính'}`,
      badge: 'Trụ Sở Chính',
      address: companyInfo.headquarters || 'Hà Nội & TP. Hồ Chí Minh',
      scale: `Quy mô ${companyInfo.headcount || '100 - 500 nhân sự'} • Môi trường làm việc chuẩn quốc tế`,
      hotline: companyInfo.website ? companyInfo.website.replace(/^https?:\/\//, '') : 'hiremate.ai',
      icon: 'corporate_fare',
    },
    {
      id: 'loc_2',
      name: 'Chi nhánh công nghệ & Trung tâm Đổi mới Sáng tạo',
      badge: 'Chi Nhánh Kỹ Thuật',
      address: 'Khu Công nghệ cao & Các trung tâm phát triển phần mềm trọng điểm.',
      scale: 'Không gian làm việc mở, phòng họp thông minh & tiện ích nội khu đầy đủ',
      hotline: 'Hotline tuyển dụng & hỗ trợ đối tác',
      icon: 'domain',
    },
    {
      id: 'loc_3',
      name: 'Mạng lưới đối tác & Chi nhánh quốc tế',
      badge: 'Global Network',
      address: 'Việt Nam & các thị trường công nghệ trọng điểm khu vực.',
      scale: 'Cơ hội Onsite, làm việc cùng chuyên gia công nghệ và khách hàng toàn cầu',
      hotline: companyInfo.website || 'https://hiremate.ai',
      icon: 'public',
    },
  ];

  const [companyLocations, setCompanyLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_company_locations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultOfficeLocations;
  });

  // =====================================================================
  // MODAL 1: CHỈNH SỬA HỒ SƠ DOANH NGHIỆP & CƠ SỞ VẬT CHẤT
  // =====================================================================
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyModalTab, setCompanyModalTab] = useState('basic'); // 'basic' | 'media' | 'locations' | 'culture' | 'benefits' | 'about'
  const [companyEditForm, setCompanyEditForm] = useState({
    companyName: companyInfo.name,
    tagline: companyInfo.tagline,
    website: companyInfo.website,
    headquarters: companyInfo.headquarters,
    industry: companyInfo.industry,
    headcount: companyInfo.headcount,
    establishedYear: companyInfo.establishedYear,
    markets: companyInfo.markets,
    overviewText: companyInfo.overviewText,
    logoUrl: companyInfo.logoUrl || '',
    coverUrl: companyInfo.coverUrl || '',
    photos: [],
    culture: [],
    benefits: [],
    locations: [],
  });

  const openCompanyModal = (tab = 'basic') => {
    setCompanyEditForm({
      companyName: companyInfo.name,
      tagline: companyInfo.tagline,
      website: companyInfo.website,
      headquarters: companyInfo.headquarters,
      industry: companyInfo.industry,
      headcount: companyInfo.headcount,
      establishedYear: companyInfo.establishedYear,
      markets: companyInfo.markets,
      overviewText: companyInfo.overviewText,
      logoUrl: companyInfo.logoUrl || '',
      coverUrl: companyInfo.coverUrl || '',
      photos: [...workplacePhotos],
      culture: [...companyCulture],
      benefits: [...companyBenefits],
      locations: [...companyLocations],
    });
    setCompanyModalTab(tab);
    setShowCompanyModal(true);
  };


  // Form thêm ảnh cơ sở vật chất mới
  const [newPhotoForm, setNewPhotoForm] = useState({
    title: '',
    desc: '',
    url: '',
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleUploadFileToCloud = async (file, folder = 'workplace') => {
    if (!file) return null;
    try {
      setIsUploadingImage(true);
      triggerToast('Đang tải ảnh lên Cloudinary CDN...');
      const formData = new FormData();
      formData.append('file', file);
      const res = await companyApi.uploadImage(formData, folder);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        triggerToast('Tải ảnh lên Cloudinary thành công!');
        return url;
      }
      throw new Error('Không nhận được URL từ máy chủ');
    } catch (err) {
      triggerToast('Lỗi tải ảnh lên Cloud: ' + (err.response?.data?.message || err.message));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddNewPhoto = () => {
    if (!newPhotoForm.url || !newPhotoForm.title) {
      triggerToast('Vui lòng nhập đường dẫn URL ảnh và tiêu đề ảnh!');
      return;
    }
    const updated = [...companyEditForm.photos, { ...newPhotoForm }];
    setCompanyEditForm({ ...companyEditForm, photos: updated });
    setNewPhotoForm({ title: '', desc: '', url: '' });
    triggerToast('Đã thêm hình ảnh mới vào danh sách cơ sở vật chất!');
  };

  const handleDeletePhoto = (index) => {
    const updated = companyEditForm.photos.filter((_, i) => i !== index);
    setCompanyEditForm({ ...companyEditForm, photos: updated });
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        companyName: companyEditForm.companyName,
        website: companyEditForm.website,
        address: companyEditForm.headquarters,
        description: companyEditForm.overviewText,
        industry: companyEditForm.industry,
        companySize: companyEditForm.headcount,
        logoUrl: companyEditForm.logoUrl || null,
      };

      await companyApi.updateMyCompany(payload);

      setCompanyInfo((prev) => ({
        ...prev,
        name: companyEditForm.companyName,
        tagline: companyEditForm.tagline,
        website: companyEditForm.website,
        industry: companyEditForm.industry,
        headcount: companyEditForm.headcount,
        establishedYear: companyEditForm.establishedYear,
        headquarters: companyEditForm.headquarters,
        markets: companyEditForm.markets,
        overviewText: companyEditForm.overviewText,
        logoUrl: companyEditForm.logoUrl,
        coverUrl: companyEditForm.coverUrl,
      }));

      // Lưu danh sách cơ sở vật chất, văn hóa, phúc lợi & chi nhánh
      setWorkplacePhotos(companyEditForm.photos);
      if (companyEditForm.culture && companyEditForm.culture.length > 0) {
        setCompanyCulture(companyEditForm.culture);
      }
      if (companyEditForm.benefits && companyEditForm.benefits.length > 0) {
        setCompanyBenefits(companyEditForm.benefits);
      }
      if (companyEditForm.locations && companyEditForm.locations.length > 0) {
        setCompanyLocations(companyEditForm.locations);
      }
      try {
        localStorage.setItem('hiremate_workplace_photos', JSON.stringify(companyEditForm.photos));
        localStorage.setItem('hiremate_company_culture', JSON.stringify(companyEditForm.culture || companyCulture));
        localStorage.setItem('hiremate_company_benefits', JSON.stringify(companyEditForm.benefits || companyBenefits));
        localStorage.setItem('hiremate_company_locations', JSON.stringify(companyEditForm.locations || companyLocations));
        localStorage.setItem('hiremate_company_cover_url', companyEditForm.coverUrl);
        localStorage.setItem('hiremate_company_info_extra', JSON.stringify({
          tagline: companyEditForm.tagline,
          establishedYear: companyEditForm.establishedYear,
          markets: companyEditForm.markets,
          coverUrl: companyEditForm.coverUrl,
        }));
      } catch {}

      setShowCompanyModal(false);
      triggerToast('Đã lưu thành công thông tin doanh nghiệp, văn hóa & chế độ đãi ngộ!');
    } catch (err) {
      triggerToast('Lỗi cập nhật hồ sơ công ty: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================================
  // MODAL 2: CHỈNH SỬA THÔNG TIN ĐẠI DIỆN TUYỂN DỤNG (HR)
  // =====================================================================
  const [showHrModal, setShowHrModal] = useState(false);
  const [hrEditForm, setHrEditForm] = useState({
    name: hrRepresentative.name,
    title: hrRepresentative.title,
    division: hrRepresentative.division,
    email: hrRepresentative.email,
    hotline: hrRepresentative.hotline,
    avatar: hrRepresentative.avatar,
    responseTime: hrRepresentative.responseTime,
    bio: hrRepresentative.bio,
  });

  const handleSaveHr = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        fullName: hrEditForm.name,
        phone: hrEditForm.hotline,
        bio: hrEditForm.bio,
        headline: hrEditForm.title,
      };

      try {
        await authApi.updateProfile(payload);
        if (hrEditForm.avatar && hrEditForm.avatar !== hrRepresentative.avatar) {
          await authApi.updateAvatar(hrEditForm.avatar);
        }
      } catch (apiErr) {
        console.warn('Backend update profile notice:', apiErr);
      }

      setHrRepresentative({
        name: hrEditForm.name,
        title: hrEditForm.title,
        division: hrEditForm.division,
        email: hrEditForm.email,
        hotline: hrEditForm.hotline,
        avatar: hrEditForm.avatar,
        responseTime: hrEditForm.responseTime,
        bio: hrEditForm.bio,
      });

      try {
        localStorage.setItem('hiremate_hr_profile', JSON.stringify(hrEditForm));
      } catch {}

      setShowHrModal(false);
      triggerToast('Đã cập nhật thông tin đại diện tuyển dụng HR thành công!');
    } catch (err) {
      triggerToast('Lỗi cập nhật thông tin HR: ' + (err.message || 'Thử lại sau'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Đã sao chép link trang hồ sơ doanh nghiệp!');
    } else {
      triggerToast('Đã sao chép đường dẫn hồ sơ công ty.');
    }
  };

  return (
    <div className="recruiter-page w-full flex-1 bg-transparent text-slate-800 antialiased font-sans pb-20 selection:bg-purple-200 selection:text-purple-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-[#221d47] text-white text-xs font-semibold shadow-xl flex items-center gap-2.5 animate-fade-in border border-purple-200">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* =================================================================== */}
        {/* 1. HERO COMPANY COVER & BRAND IDENTITY HEADER                       */}
        {/* =================================================================== */}
        <div className="relative rounded-[32px] overflow-hidden bg-white border border-purple-100 shadow-sm">
          {/* Cover Landscape */}
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-slate-100">
            <img
              src={companyInfo.coverUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80"}
              alt="Company Campus Cover"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#221d47]/70 via-[#221d47]/20 to-transparent" />

            {/* Quick Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between flex-wrap gap-2 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-100 text-xs text-[#221d47] font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{companyInfo.name || 'Doanh Nghiệp'} &bull; {companyInfo.industry || 'Đơn Vị Tuyển Dụng Hàng Đầu'}</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#221d47] text-xs font-bold border border-purple-100 shadow-sm">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">verified</span>
                <span>Doanh Nghiệp Đã Xác Thực Pháp Nhân</span>
              </div>
            </div>
          </div>

          {/* Company Brand Strip */}
          <div className="relative px-6 sm:px-8 pb-6 sm:pb-8 pt-4 bg-white">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                {/* Logo Box */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-white shadow-lg p-1.5 flex items-center justify-center shrink-0 -mt-16 sm:-mt-20 z-10 overflow-hidden">
                  {companyInfo.logoUrl ? (
                    <img src={companyInfo.logoUrl} alt={companyInfo.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#5b48bd] to-[#3b2b8e] flex flex-col items-center justify-center text-center p-2 text-white shadow-inner">
                      <span className="text-xl sm:text-2xl font-bold tracking-wider font-display">
                        {companyInfo.name ? companyInfo.name.substring(0, 3).toUpperCase() : 'REC'}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-200 truncate max-w-[90px]">
                        {companyInfo.name && companyInfo.name.split(' ').length > 1 ? companyInfo.name.split(' ').slice(1).join(' ') : 'Company'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Company Title & Slogan */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#221d47] tracking-tight">
                      {companyInfo.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-[#5b48bd] text-xs font-bold border border-purple-200">
                      <span className="material-symbols-outlined text-[15px] text-[#5b48bd]">verified</span>
                      <span>{companyInfo.badge}</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                    {companyInfo.tagline}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Edit, Pricing & Share */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => { window.location.hash = '#/recruiter-pricing'; }}
                  className="px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105 border border-amber-300/40"
                  title="Nâng cấp gói cước dịch vụ tuyển dụng"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold animate-bounce">workspace_premium</span>
                  <span>Nâng Cấp Gói VIP</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-purple-50 text-xs font-semibold text-slate-700 transition-all flex items-center gap-2 border border-purple-200 cursor-pointer shadow-sm hover:border-purple-300"
                  title="Sao chép liên kết trang công ty"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#5b48bd]">share</span>
                  <span>Chia sẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCompanyModal('basic')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-purple-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">domain</span>
                  <span>Chỉnh sửa hồ sơ công ty</span>
                </button>
              </div>
            </div>

            {/* Quick Meta Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Lĩnh vực chính</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.industry}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Quy mô nhân sự</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.headcount}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Năm thành lập</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.establishedYear}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Website chính thức</div>
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#5b48bd] hover:underline transition-colors mt-1 flex items-center gap-1 truncate"
                >
                  <span>{companyInfo.website ? companyInfo.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'hiremate.ai'}</span>
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Thị trường hoạt động</div>
                <div className="text-xs font-bold text-[#221d47] mt-1 truncate">
                  {companyInfo.markets}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. MAIN WORKSPACE: LEFT (HR REPRESENTATIVE) + RIGHT (OVERVIEW TABS) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================================================================= */}
          {/* CỘT TRÁI (4 CỘT): ĐẠI DIỆN TUYỂN DỤNG CHÍNH (HR REPRESENTATIVE)    */}
          {/* ================================================================= */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-[28px] p-6 bg-white border border-purple-100 shadow-sm space-y-5">
              {/* Title & Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs uppercase tracking-widest text-[#221d47] font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#5b48bd]">badge</span>
                  Đại Diện Tuyển Dụng
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang nhận hồ sơ
                </span>
              </div>

              {/* Portrait & HR Info */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="relative">
                  <img
                    src={hrRepresentative.avatar}
                    alt={hrRepresentative.name}
                    className="w-24 h-24 rounded-3xl object-cover ring-4 ring-purple-100 shadow-md"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5b48bd] flex items-center justify-center text-white shadow-md text-[14px] font-bold"
                    title="Đã xác thực ủy quyền tuyển dụng chính thức"
                  >
                    ✓
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#221d47]">
                    {hrRepresentative.name}
                  </h3>
                  <p className="text-xs text-[#5b48bd] font-bold mt-0.5">
                    {hrRepresentative.title}
                  </p>
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    {hrRepresentative.division}
                  </p>
                </div>
              </div>

              {/* HR Bio Quote */}
              <p className="text-xs text-slate-600 italic leading-relaxed bg-purple-50/50 p-4 rounded-2xl border border-purple-100/80">
                "{hrRepresentative.bio}"
              </p>

              {/* Direct Contact List */}
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#5b48bd] text-lg mt-0.5">mail</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Email tiếp nhận hồ sơ</span>
                    <a
                      href={`mailto:${hrRepresentative.email}`}
                      className="text-xs font-bold text-[#221d47] hover:text-[#5b48bd] transition-colors block truncate mt-0.5"
                    >
                      {hrRepresentative.email}
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-orange-500 text-lg mt-0.5">call</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Hotline / Zalo Tuyển Dụng</span>
                    <p className="text-xs font-extrabold text-[#221d47] mt-0.5">
                      {hrRepresentative.hotline}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#5b48bd] text-lg mt-0.5">schedule</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Thời gian phản hồi</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {hrRepresentative.responseTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button: Edit HR Profile */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHrEditForm({
                      name: hrRepresentative.name,
                      title: hrRepresentative.title,
                      division: hrRepresentative.division,
                      email: hrRepresentative.email,
                      hotline: hrRepresentative.hotline,
                      avatar: hrRepresentative.avatar,
                      responseTime: hrRepresentative.responseTime,
                      bio: hrRepresentative.bio,
                    });
                    setShowHrModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Chỉnh sửa thông tin HR</span>
                </button>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-6 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-3">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Kênh Tuyển Dụng Nhanh
              </span>
              <div className="space-y-2 text-xs">
                <a
                  href="#/recruiter-jobs"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 transition-colors flex items-center justify-between text-[#221d47] font-bold border border-slate-200/60 hover:border-purple-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">view_agenda</span>
                    <span>Quản lý tin tuyển dụng công ty</span>
                  </span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
                <a
                  href="#/applicants-management"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 transition-colors flex items-center justify-between text-[#221d47] font-bold border border-slate-200/60 hover:border-purple-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-orange-500">groups</span>
                    <span>Phễu ứng viên &amp; hồ sơ đã nộp</span>
                  </span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
            </div>
          </aside>

          {/* ================================================================= */}
          {/* CỘT PHẢI (8 CỘT): TỔNG QUAN, MÔI TRƯỜNG LÀM VIỆC & VỊ TRÍ MỞ      */}
          {/* ================================================================= */}
          <main className="lg:col-span-8 space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-white border border-purple-100 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">info</span>
                <span>Tổng Quan &amp; Môi Trường Làm Việc</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'jobs'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">work</span>
                <span>Vị Trí Đang Tuyển Dụng ({jobsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('locations')}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'locations'
                    ? 'bg-[#5b48bd] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">apartment</span>
                <span>Địa Điểm &amp; Chi Nhánh</span>
              </button>
            </div>

            {/* =============================================================== */}
            {/* TAB 1: TỔNG QUAN, VĂN HÓA & MÔI TRƯỜNG LÀM VIỆC                 */}
            {/* =============================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 1. About Company */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#5b48bd] text-xl">auto_stories</span>
                      <h2 className="text-lg font-bold text-[#221d47]">
                        Về {companyInfo.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCompanyModal('about')}
                      className="text-xs text-[#5b48bd] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Chỉnh sửa giới thiệu</span>
                    </button>
                  </div>
                  <div className="text-sm font-sans text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                    {companyInfo.overviewText}
                  </div>
                </div>

                {/* 2. Core Values & Culture */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#5b48bd] text-xl">psychology</span>
                      <h2 className="text-lg font-bold text-[#221d47]">
                        Văn Hóa &amp; Giá Trị Cốt Lõi
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCompanyModal('culture')}
                      className="text-xs text-[#5b48bd] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Chỉnh sửa văn hóa</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {companyCulture.map((c, i) => {
                      const bgClasses = [
                        'bg-purple-50/50 border-purple-100 text-[#5b48bd]',
                        'bg-orange-50/50 border-orange-100 text-orange-600',
                        'bg-emerald-50/50 border-emerald-100 text-emerald-700',
                        'bg-indigo-50/50 border-indigo-100 text-indigo-700',
                      ];
                      const style = bgClasses[i % bgClasses.length];
                      return (
                        <div key={i} className={`p-5 rounded-2xl border space-y-2 ${style}`}>
                          <div className="flex items-center gap-2 font-bold text-xs uppercase">
                            <span className="material-symbols-outlined text-base">{c.icon || 'lightbulb'}</span>
                            <span>{c.title}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {c.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Employee Benefits & Perks */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#5b48bd] text-xl">card_giftcard</span>
                      <h2 className="text-lg font-bold text-[#221d47]">
                        Chế Độ Đãi Ngộ &amp; Phúc Lợi Đặc Quyền
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCompanyModal('benefits')}
                      className="text-xs text-[#5b48bd] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Chỉnh sửa phúc lợi</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                    {companyBenefits.map((b, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-200 transition-all space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#5b48bd] shadow-sm">
                          <span className="material-symbols-outlined text-xl text-[#5b48bd]">{b.icon || 'card_giftcard'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#221d47]">{b.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Workplace Photos Gallery */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                    <span className="material-symbols-outlined text-[#5b48bd] text-xl">photo_library</span>
                    <h2 className="text-lg font-bold text-[#221d47]">
                      Không Gian Làm Việc &amp; Trải Nghiệm Thực Tế
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {workplacePhotos.map((p, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-white group shadow-sm hover:shadow-md transition-all">
                        <div className="h-44 sm:h-48 overflow-hidden relative">
                          <img
                            src={p.url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4 space-y-1">
                          <h4 className="text-xs font-bold text-[#221d47]">{p.title}</h4>
                          <p className="text-xs text-slate-500">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2: VỊ TRÍ ĐANG TUYỂN DỤNG                                    */}
            {/* =============================================================== */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-lg font-bold text-[#221d47]">
                    Các Vị Trí Công Nghệ Đang Mở Tuyển ({jobsList.length})
                  </h3>
                  <a
                    href="#/recruiter-jobs"
                    className="text-xs text-[#5b48bd] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Quản lý tin tuyển dụng</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </a>
                </div>

                <div className="space-y-4">
                  {jobsList.map((job) => (
                    <div
                      key={job.id}
                      className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {job.isHot && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wider">
                              Hot Opening
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-sans">{job.level}</span>
                          <span className="text-xs text-slate-300">&bull;</span>
                          <span className="text-xs text-slate-400">{job.postedTime}</span>
                        </div>

                        <h4
                          onClick={() => (window.location.hash = `#/jobs/${job.id}`)}
                          className="text-base sm:text-lg font-bold text-[#221d47] group-hover:text-[#5b48bd] transition-colors cursor-pointer"
                        >
                          {job.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-600 font-sans flex-wrap">
                          <span className="font-extrabold text-orange-600">{job.salary}</span>
                          <span>&bull;</span>
                          <span>{job.location}</span>
                          <span>&bull;</span>
                          <span className="text-[#5b48bd] font-bold">{job.applicantCount} hồ sơ đã nộp</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-100"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`#/jobs/${job.id}`}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-purple-50 text-xs font-semibold text-slate-700 border border-slate-200 transition-all shadow-sm hover:border-purple-300"
                        >
                          Xem bài JD
                        </a>
                        <a
                          href={`#/applicants-management?jobId=${job.id}`}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-xs font-bold text-white shadow-sm transition-all"
                        >
                          Quản lý hồ sơ
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 3: ĐỊA ĐIỂM & CHI NHÁNH                                     */}
            {/* =============================================================== */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-[#221d47]">
                    Hệ Thống Trụ Sở &amp; Chi Nhánh
                  </h3>
                  <button
                    type="button"
                    onClick={() => openCompanyModal('locations')}
                    className="text-xs text-[#5b48bd] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit_location</span>
                    <span>Chỉnh sửa trụ sở &amp; chi nhánh</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {companyLocations.map((loc, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-[28px] bg-white border border-purple-100 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5b48bd] border border-purple-200">
                          {loc.badge}
                        </span>
                        <span className="material-symbols-outlined text-xl text-[#5b48bd]">{loc.icon}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#221d47]">{loc.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{loc.address}</p>
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                        <div>&bull; {loc.scale}</div>
                        <div>&bull; Hotline: <span className="text-[#221d47] font-bold">{loc.hotline}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: CHỈNH SỬA THÔNG TIN DOANH NGHIỆP                             */}
      {/* =================================================================== */}
      {/* =================================================================== */}
      {/* MODAL 1: CHỈNH SỬA HỒ SƠ DOANH NGHIỆP TOÀN DIỆN & CƠ SỞ VẬT CHẤT     */}
      {/* =================================================================== */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white border border-purple-100 rounded-[32px] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b48bd] flex items-center justify-center border border-purple-100">
                  <span className="material-symbols-outlined text-xl">domain</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-[#221d47]">Quản Lý Hồ Sơ Doanh Nghiệp</h3>
                  <p className="text-xs text-slate-500">Tùy chỉnh thông tin công ty, nhận diện thương hiệu & ảnh cơ sở vật chất</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setCompanyModalTab('basic')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  companyModalTab === 'basic' ? 'bg-white text-[#5b48bd] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">info</span>
                <span>Thông Tin Chung</span>
              </button>
              <button
                type="button"
                onClick={() => setCompanyModalTab('media')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  companyModalTab === 'media' ? 'bg-white text-[#5b48bd] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">photo_library</span>
                <span>Ảnh &amp; Cơ Sở Vật Chất ({companyEditForm.photos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCompanyModalTab('locations')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  companyModalTab === 'locations' ? 'bg-white text-[#5b48bd] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">apartment</span>
                <span>Trụ Sở &amp; Chi Nhánh ({companyEditForm.locations?.length || companyLocations.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCompanyModalTab('culture')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  companyModalTab === 'culture' ? 'bg-white text-[#5b48bd] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>Văn Hóa Cốt Lõi ({companyEditForm.culture?.length || 4})</span>
              </button>
              <button
                type="button"
                onClick={() => setCompanyModalTab('benefits')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  companyModalTab === 'benefits' ? 'bg-white text-[#5b48bd] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">card_giftcard</span>
                <span>Chế Độ &amp; Phúc Lợi ({companyEditForm.benefits?.length || 6})</span>
              </button>
              <button
                type="button"
                onClick={() => setCompanyModalTab('about')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  companyModalTab === 'about' ? 'bg-white text-[#5b48bd] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span>Giới Thiệu &amp; Mô Tả</span>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveCompany} className="space-y-5 text-xs">
              {/* TAB 1: THÔNG TIN CƠ BẢN */}
              {companyModalTab === 'basic' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold uppercase">Tên doanh nghiệp *</label>
                    <input
                      type="text"
                      required
                      value={companyEditForm.companyName}
                      onChange={(e) => setCompanyEditForm({ ...companyEditForm, companyName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-semibold focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 font-bold uppercase">Khẩu hiệu / Slogan / Tagline</label>
                    <input
                      type="text"
                      value={companyEditForm.tagline}
                      onChange={(e) => setCompanyEditForm({ ...companyEditForm, tagline: e.target.value })}
                      placeholder="VD: Doanh nghiệp công nghệ tiên phong chuyển đổi số"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold uppercase">Website chính thức</label>
                      <input
                        type="url"
                        value={companyEditForm.website}
                        onChange={(e) => setCompanyEditForm({ ...companyEditForm, website: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold uppercase">Lĩnh vực / Ngành nghề</label>
                      <input
                        type="text"
                        value={companyEditForm.industry}
                        onChange={(e) => setCompanyEditForm({ ...companyEditForm, industry: e.target.value })}
                        placeholder="VD: Công Nghệ Thông Tin & Phần Mềm"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold uppercase">Quy mô nhân sự</label>
                      <select
                        value={companyEditForm.headcount}
                        onChange={(e) => setCompanyEditForm({ ...companyEditForm, headcount: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                      >
                        <option value="1 - 50 nhân sự">1 - 50 nhân sự</option>
                        <option value="50 - 100 nhân sự">50 - 100 nhân sự</option>
                        <option value="100 - 500 nhân sự">100 - 500 nhân sự</option>
                        <option value="500 - 1,000 nhân sự">500 - 1,000 nhân sự</option>
                        <option value="1,000+ nhân sự">1,000+ nhân sự</option>
                        <option value="5,000+ nhân sự">5,000+ nhân sự</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold uppercase">Năm thành lập</label>
                      <input
                        type="text"
                        value={companyEditForm.establishedYear}
                        onChange={(e) => setCompanyEditForm({ ...companyEditForm, establishedYear: e.target.value })}
                        placeholder="VD: 2020"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold uppercase">Thị trường hoạt động</label>
                      <input
                        type="text"
                        value={companyEditForm.markets}
                        onChange={(e) => setCompanyEditForm({ ...companyEditForm, markets: e.target.value })}
                        placeholder="VD: Việt Nam & Quốc tế"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 font-bold uppercase">Trụ sở chính / Địa chỉ văn phòng</label>
                    <input
                      type="text"
                      value={companyEditForm.headquarters}
                      onChange={(e) => setCompanyEditForm({ ...companyEditForm, headquarters: e.target.value })}
                      placeholder="VD: Khu Công nghệ cao Hòa Lạc, Km 29 Đại lộ Thăng Long, Hà Nội"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HÌNH ẢNH & CƠ SỞ VẬT CHẤT (TỰ ĐỘNG LƯU TRÊN CLOUDINARY CDN) */}
              {companyModalTab === 'media' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Banner hướng dẫn Cloud */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-white border border-purple-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#5b48bd] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-base">cloud_sync</span>
                      </div>
                      <div>
                        <div className="font-bold text-[#221d47]">Lưu trữ tự động trên Cloudinary Cloud &amp; CDN</div>
                        <div className="text-[11px] text-slate-500">
                          Bất kỳ ảnh nào bạn chọn từ máy tính sẽ được tự động tải lên đám mây Cloudinary, không lưu ở máy cục bộ.
                        </div>
                      </div>
                    </div>
                    {isUploadingImage && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#5b48bd] font-bold text-xs animate-pulse shrink-0">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        <span>Đang đẩy lên Cloud...</span>
                      </div>
                    )}
                  </div>

                  {/* Logo & Banner Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logo Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                          Logo Thương Hiệu
                        </span>
                        <div className="flex items-center gap-3.5">
                          <div className="w-16 h-16 rounded-2xl border-2 border-purple-200 overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center">
                            {companyEditForm.logoUrl ? (
                              <img src={companyEditForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-2xl">corporate_fare</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#221d47] truncate">
                              {companyEditForm.logoUrl ? 'Đã lưu trên Cloudinary' : 'Chưa có logo'}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Khuyến nghị tỉ lệ 1:1, ảnh vuông định dạng PNG hoặc JPG.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <input
                          type="file"
                          id="company-logo-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const cloudUrl = await handleUploadFileToCloud(file, 'logos');
                            if (cloudUrl) {
                              setCompanyEditForm((prev) => ({ ...prev, logoUrl: cloudUrl }));
                            }
                          }}
                        />
                        <label
                          htmlFor="company-logo-file-input"
                          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-purple-50 text-[#5b48bd] font-bold text-xs border border-purple-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">cloud_upload</span>
                          <span>Bấm để chọn Logo từ máy (Tự động lưu Cloud)</span>
                        </label>
                      </div>
                    </div>

                    {/* Cover Banner Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                          Ảnh Bìa Cover Banner
                        </span>
                        <div className="h-16 w-full rounded-2xl border-2 border-purple-200 overflow-hidden bg-white shadow-sm relative">
                          <img
                            src={companyEditForm.coverUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <span className="text-[11px] text-white font-bold tracking-wider bg-black/40 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                              Xem trước ảnh bìa
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <input
                          type="file"
                          id="company-cover-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const cloudUrl = await handleUploadFileToCloud(file, 'covers');
                            if (cloudUrl) {
                              setCompanyEditForm((prev) => ({ ...prev, coverUrl: cloudUrl }));
                            }
                          }}
                        />
                        <label
                          htmlFor="company-cover-file-input"
                          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-purple-50 text-[#5b48bd] font-bold text-xs border border-purple-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">cloud_upload</span>
                          <span>Bấm để chọn Ảnh Bìa từ máy (Tự động lưu Cloud)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Workplace Photos List & Upload Dropzone */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-bold uppercase flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-[#5b48bd] text-base">photo_library</span>
                        <span>Album Cơ Sở Vật Chất &amp; Không Gian Làm Việc ({companyEditForm.photos.length} ảnh)</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Hiển thị thực tế với ứng viên trên trang công ty
                      </span>
                    </div>

                    {/* Vùng tải ảnh từ máy tính (Tự động đẩy lên Cloudinary) */}
                    <div>
                      <input
                        type="file"
                        id="workplace-auto-upload-input"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          for (const file of files) {
                            const cloudUrl = await handleUploadFileToCloud(file, 'workplace');
                            if (cloudUrl) {
                              const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                              const formattedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
                              setCompanyEditForm((prev) => ({
                                ...prev,
                                photos: [
                                  ...prev.photos,
                                  {
                                    title: formattedTitle,
                                    desc: 'Không gian làm việc & cơ sở vật chất hiện đại của doanh nghiệp.',
                                    url: cloudUrl,
                                  },
                                ],
                              }));
                            }
                          }
                          triggerToast(`Đã tự động tải lên và lưu vào Cloudinary thành công!`);
                        }}
                      />
                      <label
                        htmlFor="workplace-auto-upload-input"
                        className="w-full p-5 rounded-2xl border-2 border-dashed border-purple-300 hover:border-[#5b48bd] bg-purple-50/40 hover:bg-purple-50/80 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group text-center"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white text-[#5b48bd] border border-purple-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-[#221d47] block">
                            Bấm vào đây để chọn ảnh cơ sở vật chất từ máy tính
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Hỗ trợ chọn nhiều ảnh cùng lúc. Toàn bộ ảnh sẽ được tự động lưu thẳng lên Cloudinary CDN.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Danh sách ảnh trong album */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {companyEditForm.photos.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl border border-slate-200 bg-white flex items-start gap-3 shadow-sm hover:border-purple-200 transition-all group"
                        >
                          <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                            <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              type="text"
                              value={p.title}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                setCompanyEditForm((prev) => {
                                  const updated = [...prev.photos];
                                  updated[idx] = { ...updated[idx], title: newTitle };
                                  return { ...prev, photos: updated };
                                });
                              }}
                              placeholder="Tiêu đề ảnh..."
                              className="font-bold text-[#221d47] text-xs w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#5b48bd] focus:outline-none"
                            />
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{p.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(idx)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                            title="Xóa ảnh này khỏi album"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Mẫu ảnh gợi ý thêm nhanh nếu cần */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Gợi ý mẫu ảnh đẹp:</span>
                      {PHOTO_PRESETS.slice(0, 4).map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              photos: [...prev.photos, { ...preset }],
                            }));
                            triggerToast(`Đã thêm ảnh ${preset.title} vào danh sách!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5b48bd] text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                        >
                          + {preset.title.split('&')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ĐỊA ĐIỂM & CHI NHÁNH */}
              {companyModalTab === 'locations' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      Danh sách các trụ sở chính, chi nhánh kỹ thuật &amp; văn phòng đại diện ({companyEditForm.locations?.length || companyLocations.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newLocation = {
                          id: 'loc_' + Date.now(),
                          name: 'Chi nhánh / Văn phòng mới',
                          badge: 'Văn Phòng Đại Diện',
                          address: 'Nhập địa chỉ chi nhánh tại đây...',
                          scale: 'Quy mô 50 - 100 nhân sự',
                          hotline: 'Hotline liên hệ',
                          icon: 'apartment',
                        };
                        const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                        setCompanyEditForm((prev) => ({
                          ...prev,
                          locations: [...current, newLocation],
                        }));
                        triggerToast('Đã thêm 1 địa điểm chi nhánh mới!');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-[#5b48bd] hover:bg-purple-100 font-bold text-xs flex items-center gap-1.5 border border-purple-200 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">add_location_alt</span>
                      <span>Thêm địa điểm / chi nhánh mới</span>
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {(companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations).map((loc, lIdx) => (
                      <div key={lIdx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-7 h-7 rounded-lg bg-purple-50 text-[#5b48bd] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-sm">{loc.icon || 'location_on'}</span>
                            </span>
                            <input
                              type="text"
                              value={loc.name}
                              onChange={(e) => {
                                const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                                const updated = [...current];
                                updated[lIdx] = { ...updated[lIdx], name: e.target.value };
                                setCompanyEditForm({ ...companyEditForm, locations: updated });
                              }}
                              placeholder="Tên trụ sở / chi nhánh (VD: Trụ sở chính, Chi nhánh Hà Nội...)"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#221d47] focus:outline-none focus:border-[#5b48bd]"
                            />
                          </div>

                          <select
                            value={loc.badge}
                            onChange={(e) => {
                              const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                              const updated = [...current];
                              updated[lIdx] = { ...updated[lIdx], badge: e.target.value };
                              setCompanyEditForm({ ...companyEditForm, locations: updated });
                            }}
                            className="bg-purple-50 border border-purple-200 text-[#5b48bd] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none"
                          >
                            <option value="Trụ Sở Chính">Trụ Sở Chính</option>
                            <option value="Chi Nhánh Kỹ Thuật">Chi Nhánh Kỹ Thuật</option>
                            <option value="Văn Phòng Đại Diện">Văn Phòng Đại Diện</option>
                            <option value="Campus Công Nghệ">Campus Công Nghệ</option>
                            <option value="Global Network">Global Network</option>
                          </select>

                          {(companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                                const updated = current.filter((_, idx) => idx !== lIdx);
                                setCompanyEditForm({ ...companyEditForm, locations: updated });
                                triggerToast('Đã xóa chi nhánh này!');
                              }}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                              title="Xóa địa điểm này"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                            Địa chỉ chi tiết {loc.badge === 'Trụ Sở Chính' ? '(Đồng bộ với Trụ sở chính công ty)' : ''}
                          </label>
                          <input
                            type="text"
                            value={loc.address}
                            onChange={(e) => {
                              const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                              const updated = [...current];
                              updated[lIdx] = { ...updated[lIdx], address: e.target.value };
                              const nextForm = { ...companyEditForm, locations: updated };
                              if (loc.badge === 'Trụ Sở Chính' || lIdx === 0) {
                                nextForm.headquarters = e.target.value;
                              }
                              setCompanyEditForm(nextForm);
                            }}
                            placeholder="Địa chỉ số nhà, tòa nhà, đường, quận, thành phố..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5b48bd]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quy mô &amp; Tiện ích</label>
                            <input
                              type="text"
                              value={loc.scale}
                              onChange={(e) => {
                                const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                                const updated = [...current];
                                updated[lIdx] = { ...updated[lIdx], scale: e.target.value };
                                setCompanyEditForm({ ...companyEditForm, locations: updated });
                              }}
                              placeholder="VD: Quy mô 200 nhân sự • Phòng lab..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-[#5b48bd]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hotline / Website liên hệ</label>
                            <input
                              type="text"
                              value={loc.hotline}
                              onChange={(e) => {
                                const current = companyEditForm.locations && companyEditForm.locations.length > 0 ? companyEditForm.locations : companyLocations;
                                const updated = [...current];
                                updated[lIdx] = { ...updated[lIdx], hotline: e.target.value };
                                setCompanyEditForm({ ...companyEditForm, locations: updated });
                              }}
                              placeholder="VD: 028 1234 5678 hoặc email/website..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-[#5b48bd]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: VĂN HÓA & GIÁ TRỊ CỐT LÕI */}
              {companyModalTab === 'culture' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5b48bd]">psychology</span>
                      <span className="text-slate-700 font-medium">
                        Tùy chỉnh các giá trị văn hóa cốt lõi để truyền cảm hứng và thu hút ứng viên phù hợp.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {(companyEditForm.culture && companyEditForm.culture.length > 0 ? companyEditForm.culture : companyCulture).map((cItem, cIdx) => (
                      <div key={cIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-bold uppercase text-[#5b48bd] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">{cItem.icon || 'lightbulb'}</span>
                            <span>Giá trị cốt lõi #{cIdx + 1}</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={cItem.title}
                          onChange={(e) => {
                            const updated = [...(companyEditForm.culture && companyEditForm.culture.length > 0 ? companyEditForm.culture : companyCulture)];
                            updated[cIdx] = { ...updated[cIdx], title: e.target.value };
                            setCompanyEditForm({ ...companyEditForm, culture: updated });
                          }}
                          placeholder="Tiêu đề giá trị (VD: Đổi Mới Sáng Tạo, Tinh Thần Đồng Đội...)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[#221d47] font-bold text-xs focus:outline-none focus:border-[#5b48bd]"
                        />
                        <textarea
                          rows={2}
                          value={cItem.desc}
                          onChange={(e) => {
                            const updated = [...(companyEditForm.culture && companyEditForm.culture.length > 0 ? companyEditForm.culture : companyCulture)];
                            updated[cIdx] = { ...updated[cIdx], desc: e.target.value };
                            setCompanyEditForm({ ...companyEditForm, culture: updated });
                          }}
                          placeholder="Mô tả cụ thể về tinh thần và văn hóa này..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:outline-none focus:border-[#5b48bd]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CHẾ ĐỘ ĐÃI NGỘ & PHÚC LỢI ĐẶC QUYỀN */}
              {companyModalTab === 'benefits' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      Danh sách các chế độ đãi ngộ, bảo hiểm, thưởng và phúc lợi cho nhân viên ({companyEditForm.benefits?.length || companyBenefits.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newBenefit = {
                          icon: 'card_giftcard',
                          title: 'Chế độ phúc lợi mới',
                          desc: 'Mô tả chi tiết về chế độ đãi ngộ đặc quyền dành cho nhân viên.',
                        };
                        const current = companyEditForm.benefits && companyEditForm.benefits.length > 0 ? companyEditForm.benefits : companyBenefits;
                        setCompanyEditForm((prev) => ({
                          ...prev,
                          benefits: [...current, newBenefit],
                        }));
                        triggerToast('Đã thêm 1 mục phúc lợi mới!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#5b48bd] hover:bg-purple-100 font-bold text-xs flex items-center gap-1 border border-purple-200 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Thêm phúc lợi mới</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {(companyEditForm.benefits && companyEditForm.benefits.length > 0 ? companyEditForm.benefits : companyBenefits).map((bItem, bIdx) => (
                      <div key={bIdx} className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 relative group">
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={bItem.title}
                            onChange={(e) => {
                              const current = companyEditForm.benefits && companyEditForm.benefits.length > 0 ? companyEditForm.benefits : companyBenefits;
                              const updated = [...current];
                              updated[bIdx] = { ...updated[bIdx], title: e.target.value };
                              setCompanyEditForm({ ...companyEditForm, benefits: updated });
                            }}
                            placeholder="Tiêu đề phúc lợi (VD: Thưởng hiệu suất, Bảo hiểm cao cấp...)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#221d47] focus:outline-none focus:border-[#5b48bd]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = companyEditForm.benefits && companyEditForm.benefits.length > 0 ? companyEditForm.benefits : companyBenefits;
                              const updated = current.filter((_, idx) => idx !== bIdx);
                              setCompanyEditForm({ ...companyEditForm, benefits: updated });
                              triggerToast('Đã xóa phúc lợi này!');
                            }}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                            title="Xóa phúc lợi này"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={bItem.desc}
                          onChange={(e) => {
                            const current = companyEditForm.benefits && companyEditForm.benefits.length > 0 ? companyEditForm.benefits : companyBenefits;
                            const updated = [...current];
                            updated[bIdx] = { ...updated[bIdx], desc: e.target.value };
                            setCompanyEditForm({ ...companyEditForm, benefits: updated });
                          }}
                          placeholder="Mô tả cụ thể quyền lợi nhân sự được hưởng..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 focus:outline-none focus:border-[#5b48bd]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: GIỚI THIỆU & MÔ TẢ */}
              {companyModalTab === 'about' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold uppercase">Giới thiệu tổng quan về doanh nghiệp</label>
                    <textarea
                      rows={7}
                      value={companyEditForm.overviewText}
                      onChange={(e) => setCompanyEditForm({ ...companyEditForm, overviewText: e.target.value })}
                      placeholder="Mô tả lịch sử phát triển, sứ mệnh, văn hóa làm việc và lý do ứng viên nên gia nhập công ty..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[#221d47] leading-relaxed focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-white text-xs font-bold tracking-wider uppercase shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Đang Lưu...' : 'Lưu Toàn Bộ Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CHỈNH SỬA THÔNG TIN ĐẠI DIỆN TUYỂN DỤNG (HR PROFILE)          */}
      {/* =================================================================== */}
      {showHrModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white border border-purple-100 rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b48bd] flex items-center justify-center border border-purple-100">
                  <span className="material-symbols-outlined text-xl">badge</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-[#221d47]">Thông Tin Người Đại Diện HR</h3>
                  <p className="text-xs text-slate-500">Thông tin này sẽ hiển thị trực tiếp với ứng viên khi nộp hồ sơ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveHr} className="space-y-4 text-xs">
              {/* Họ tên HR */}
              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Họ và tên HR *</label>
                <input
                  type="text"
                  required
                  value={hrEditForm.name}
                  onChange={(e) => setHrEditForm({ ...hrEditForm, name: e.target.value })}
                  placeholder="VD: Lê Hoàng Nam"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-semibold focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* Avatar HR with Cloudinary Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 font-bold uppercase text-xs">Ảnh đại diện HR</label>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                    <span>Cloudinary CDN</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl border-2 border-purple-200 overflow-hidden shrink-0 shadow-sm bg-purple-50 flex items-center justify-center">
                    <img
                      src={hrEditForm.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=hr'}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="url"
                    value={hrEditForm.avatar}
                    onChange={(e) => setHrEditForm({ ...hrEditForm, avatar: e.target.value })}
                    placeholder="https://res.cloudinary.com/..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd]"
                  />
                  {/* Nút Upload Avatar HR */}
                  <input
                    type="file"
                    id="hr-avatar-file-upload-input"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const cloudUrl = await handleUploadFileToCloud(file, 'avatars');
                      if (cloudUrl) {
                        setHrEditForm((prev) => ({ ...prev, avatar: cloudUrl }));
                      }
                    }}
                  />
                  <label
                    htmlFor="hr-avatar-file-upload-input"
                    className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b48bd] font-bold text-xs border border-purple-200 transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    <span>Tải từ máy</span>
                  </label>
                </div>
                {/* Avatar Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Gợi ý avatar:</span>
                  {HR_AVATAR_PRESETS.map((avatarUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHrEditForm({ ...hrEditForm, avatar: avatarUrl })}
                      className="w-7 h-7 rounded-full overflow-hidden border border-purple-200 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <img src={avatarUrl} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Chức danh & Phòng ban */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase">Chức danh / Vị trí</label>
                  <input
                    type="text"
                    value={hrEditForm.title}
                    onChange={(e) => setHrEditForm({ ...hrEditForm, title: e.target.value })}
                    placeholder="VD: Senior Tech Recruiter"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase">Phòng ban phụ trách</label>
                  <input
                    type="text"
                    value={hrEditForm.division}
                    onChange={(e) => setHrEditForm({ ...hrEditForm, division: e.target.value })}
                    placeholder="VD: Ban Tuyển Dụng & Thu Hút Nhân Tài"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
              </div>

              {/* Email & Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase">Email tiếp nhận hồ sơ</label>
                  <input
                    type="email"
                    value={hrEditForm.email}
                    onChange={(e) => setHrEditForm({ ...hrEditForm, email: e.target.value })}
                    placeholder="recruiter@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold uppercase">Hotline / Zalo Tuyển Dụng</label>
                  <input
                    type="text"
                    value={hrEditForm.hotline}
                    onChange={(e) => setHrEditForm({ ...hrEditForm, hotline: e.target.value })}
                    placeholder="0988 777 666"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
              </div>

              {/* Thời gian cam kết phản hồi */}
              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Thời gian cam kết phản hồi</label>
                <input
                  type="text"
                  value={hrEditForm.responseTime}
                  onChange={(e) => setHrEditForm({ ...hrEditForm, responseTime: e.target.value })}
                  placeholder="VD: Phản hồi trong vòng 30 phút (Giờ hành chính)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#221d47] font-medium focus:outline-none focus:border-[#5b48bd]"
                />
              </div>

              {/* Lời giới thiệu / Bio của HR */}
              <div>
                <label className="text-slate-500 block mb-1 font-bold uppercase">Lời nhắn tới ứng viên / Giới thiệu bản thân</label>
                <textarea
                  rows={3}
                  value={hrEditForm.bio}
                  onChange={(e) => setHrEditForm({ ...hrEditForm, bio: e.target.value })}
                  placeholder="Lời chào và thông điệp động viên ứng viên nộp hồ sơ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#221d47] leading-relaxed focus:outline-none focus:border-[#5b48bd]"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHrModal(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] text-white text-xs font-bold tracking-wider uppercase shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Đang Lưu...' : 'Lưu Thông Tin HR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
