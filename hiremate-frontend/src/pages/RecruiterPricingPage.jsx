import React, { useState, useEffect } from 'react';
import { jobApi, paymentApi } from '../api';
import VoucherSelector from '../components/common/VoucherSelector';


const RECRUITER_SUBSCRIPTION_PLANS = [
  {
    id: 'BASIC',
    name: 'Free Recruiter',
    tagline: 'Dành cho doanh nghiệp nhỏ trải nghiệm tính năng bóc tách CV & Matching AI cơ bản.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badgeText: 'MIỄN PHÍ VĨNH VIỄN',
    badgeColor: 'bg-[#64748b]/15 text-[#475569] border-[#cbd5e1]',
    buttonText: 'Gói Mặc Định Hiện Tại',
    isPopular: false,
    isCurrent: true,
    features: [
      { text: 'Đăng tối đa 3 tin tuyển dụng hoạt động cùng lúc', highlight: true },
      { text: 'Xem danh sách ứng viên & Điểm % AI Match tổng quan', highlight: false },
      { text: '2 Lượt / ngày dùng AI Phân tích JD & Đề xuất kỹ năng', highlight: false },
      { text: 'Bảng quản lý quy trình ứng tuyển Kanban tiêu chuẩn', highlight: false },
      { text: 'Tự động gửi Email & Thông báo khi duyệt hồ sơ', highlight: false },
    ],
    missingFeatures: [
      'Mở khóa Báo cáo phân tích khoảng trống kỹ năng (Skill Gap)',
      'Xem chi tiết Báo cáo Phỏng vấn AI Voice của ứng viên',
      'Xuất dữ liệu báo cáo ứng viên ra file Excel (.xlsx)',
    ]
  },
  {
    id: 'STARTER',
    name: 'Hiring Starter',
    tagline: 'Gói khởi động tối ưu chi phí dành cho SME, mở khóa toàn bộ công cụ trích xuất JD & Excel.',
    monthlyPrice: 199000,
    yearlyPrice: 159000, // ~20% off
    badgeText: 'TIẾT KIỆM ⭐',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    buttonText: 'Nâng Cấp Hiring Starter',
    isPopular: false,
    isCurrent: false,
    features: [
      { text: 'Đăng tối đa 10 tin tuyển dụng hoạt động cùng lúc', highlight: true },
      { text: 'KHÔNG GIỚI HẠN dùng AI Phân tích JD & Trích xuất kỹ năng', highlight: true },
      { text: 'Mở khóa Báo cáo phân tích khoảng trống kỹ năng (Skill Gap)', highlight: true },
      { text: 'Lọc & Xếp hạng ứng viên thông minh theo chuẩn AI 70/30', highlight: true },
      { text: 'Mở khóa tính năng Xuất danh sách ứng viên ra file Excel', highlight: true },
    ],
    missingFeatures: [
      'Xem chi tiết Báo cáo Phỏng vấn AI Voice của ứng viên',
      'Duyệt chuyển trạng thái ứng viên hàng loạt (Batch Action)',
    ]
  },
  {
    id: 'PROFESSIONAL',
    name: 'Hiring Pro',
    tagline: 'Giải pháp hoàn hảo cho doanh nghiệp đang tăng tốc tuyển dụng IT & Tech Talent.',
    monthlyPrice: 499000,
    yearlyPrice: 399000, // 20% off
    badgeText: 'PHỔ BIẾN NHẤT 🔥',
    badgeColor: 'bg-[#10b981]/15 text-[#047857] border-[#6ee7b7]',
    buttonText: 'Nâng Cấp Hiring Pro',
    isPopular: true,
    isCurrent: false,
    features: [
      { text: 'Đăng tối đa 30 tin tuyển dụng hoạt động cùng lúc', highlight: true },
      { text: 'Toàn bộ tính năng AI JD Extractor & Phân tích Skill Gap Matrix', highlight: true },
      { text: 'Mở khóa xem Báo cáo kết quả Phỏng vấn AI Voice của ứng viên', highlight: true },
      { text: 'Mở khóa Duyệt & Chuyển trạng thái ứng viên hàng loạt (Batch)', highlight: true },
      { text: 'Xuất báo cáo đánh giá ứng viên ra file Excel chuyên nghiệp', highlight: true },
    ],
    missingFeatures: [
      'Đăng tin tuyển dụng KHÔNG GIỚI HẠN số lượng',
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Hiring Elite',
    tagline: 'Dành cho tập đoàn & công ty tuyển dụng quy mô lớn với tính năng AI phỏng vấn độc quyền.',
    monthlyPrice: 1199000,
    yearlyPrice: 959000, // 20% off
    badgeText: 'TOÀN DIỆN & VIP 👑',
    badgeColor: 'bg-[#8b5cf6]/15 text-[#6d28d9] border-[#c4b5fd]',
    buttonText: 'Mua Gói Hiring Elite VIP',
    isPopular: false,
    isCurrent: false,
    features: [
      { text: 'KHÔNG GIỚI HẠN số lượng tin đăng tuyển dụng hoạt động', highlight: true },
      { text: 'Xem trọn vẹn 100% Báo cáo Phỏng vấn AI Voice & Chẩn đoán sâu', highlight: true },
      { text: 'Không giới hạn AI Phân tích JD, Skill Gap & Sắp xếp AI 70/30', highlight: true },
      { text: 'Quản lý Kanban nâng cao, Duyệt hàng loạt & Xuất file Excel', highlight: true },
      { text: 'Ưu tiên gắn nhãn Tin tuyển dụng Nổi bật (HOT / TOP)', highlight: true },
    ],
    missingFeatures: []
  }
];

const RECRUITER_ADDONS = [
  {
    id: 'CREDITS_100',
    name: '+100 AI Matching Credits',
    desc: 'Thêm 100 lượt bóc tách CV và tính toán điểm AI Matching.',
    price: 300000,
    badge: 'Tiết kiệm',
    icon: 'auto_awesome',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'CREDITS_500',
    name: '+500 AI Matching Credits',
    desc: 'Thêm 500 lượt bóc tách CV và tính toán điểm AI Matching.',
    price: 1200000,
    badge: 'Bán chạy 🔥',
    icon: 'psychology',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'FEATURED_JOB',
    name: 'Đẩy Tin Nổi Bật (Featured Job)',
    desc: 'Đưa tin đăng lên vị trí TOP ĐẦU Cổng việc làm trong 7 ngày kèm huy hiệu HOT.',
    price: 500000,
    badge: 'Tăng lượt xem',
    icon: 'rocket_launch',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'VERIFIED_BADGE',
    name: 'Huy Hiệu Doanh Nghiệp Uy Tín',
    desc: 'Xác thực thông tin doanh nghiệp chính chủ trên hệ thống HireMate.',
    price: 990000,
    badge: '1 Năm',
    icon: 'verified',
    color: 'from-purple-500 to-pink-600'
  }
];

const COMPARISON_ROWS = [
  { feature: 'Số tin đăng tuyển dụng hoạt động cùng lúc', free: 'Tối đa 3 tin', starter: 'Tối đa 10 tin', pro: 'Tối đa 30 tin', elite: 'Không giới hạn' },
  { feature: 'Xem danh sách ứng viên & Điểm AI Match', free: '% Match tổng quan', starter: 'Xếp hạng chuẩn AI 70/30', pro: 'Xếp hạng chuẩn AI 70/30', elite: 'Xếp hạng chuẩn AI 70/30' },
  { feature: 'AI Phân tích JD & Trích xuất kỹ năng', free: '2 Lượt / ngày', starter: 'Không giới hạn', pro: 'Không giới hạn', elite: 'Không giới hạn' },
  { feature: 'Báo cáo khoảng trống kỹ năng (Skill Gap)', free: '❌', starter: '✅ Mở khóa', pro: '✅ Skill Gap Matrix', elite: '✅ Skill Gap Matrix sâu' },
  { feature: 'Xuất báo cáo danh sách ứng viên (Excel .xlsx)', free: '❌', starter: '✅ Mở khóa', pro: '✅ Chuyên nghiệp', elite: '✅ Toàn bộ' },
  { feature: 'Xem Báo cáo Phỏng vấn AI Voice của ứng viên', free: '❌', starter: '❌', pro: '✅ Báo cáo Voice', elite: '✅ 100% Chẩn đoán sâu' },
  { feature: 'Duyệt chuyển trạng thái hàng loạt (Batch Action)', free: '❌', starter: '❌', pro: '✅ Duyệt hàng loạt', elite: '✅ Duyệt hàng loạt & Gắn nhãn HOT' },
];

const FAQS = [
  {
    q: 'Tôi có thể đổi từ Gói Tiêu Chuẩn lên Gói Doanh Nghiệp bất kỳ lúc nào được không?',
    a: 'Hoàn toàn được! Hệ thống tự động quy đổi giá trị thời hạn còn lại của gói hiện tại và khấu trừ trực tiếp vào đơn hàng nâng cấp mới của bạn.'
  },
  {
    q: 'Phương thức thanh toán nào được chấp nhận?',
    a: 'Chúng tôi hỗ trợ Chuyển khoản ngân hàng qua Mã VietQR / Napas247 kích hoạt tự động trong 30 giây, Ví điện tử MoMo, ZaloPay và thẻ thanh toán Visa/Mastercard.'
  },
  {
    q: 'Các lượt AI Matching Credits có bị hết hạn khi chuyển đổi gói không?',
    a: 'Tất cả Credits mua bổ sung từ gói Add-on được tích lũy cộng dồn vĩnh viễn và không bao giờ mất đi ngay cả khi bạn đổi gói cước.'
  },
  {
    q: 'Tôi có nhận được Hóa đơn GTGT (VAT) sau khi mua gói không?',
    a: 'Có. Sau khi giao dịch thành công, bộ phận kế toán HireMate AI sẽ tự động gửi Hóa đơn điện tử e-Invoice vào email đăng ký của công ty bạn.'
  }
];

const getRecruiterEnrichedFeatures = (planName, monthlyPrice, quotaLimit, description) => {
  const name = (planName || '').toLowerCase();
  const price = Number(monthlyPrice) || 0;
  const quota = Number(quotaLimit) || 0;

  // Cấp độ 3: HIRING ELITE / ENTERPRISE (Giá >= 1.000.000đ hoặc tên chứa elite/enterprise)
  if (price >= 1000000 || name.includes('elite') || name.includes('enterprise')) {
    return {
      tagline: 'Giải pháp tuyển dụng toàn diện và cao cấp nhất cho Tập đoàn & Headhunt chuyên nghiệp.',
      features: [
        { text: 'KHÔNG GIỚI HẠN số lượng tin đăng tuyển dụng hoạt động', highlight: true },
        { text: 'Xem trọn vẹn 100% Báo cáo Phỏng vấn AI Voice & Chẩn đoán sâu', highlight: true },
        { text: 'Không giới hạn AI Phân tích JD, Skill Gap & Sắp xếp AI 70/30', highlight: true },
        { text: 'Quản lý Kanban nâng cao, Duyệt hàng loạt & Xuất file Excel', highlight: true },
        { text: 'Ưu tiên gắn nhãn Tin tuyển dụng Nổi bật (HOT / TOP)', highlight: true },
      ],
      missingFeatures: []
    };
  }

  // Cấp độ 2: HIRING PRO (Giá từ > 250.000đ đến dưới 1.000.000đ, hoặc tên chứa pro)
  if ((price > 250000 && price < 1000000) || name.includes('pro')) {
    return {
      tagline: 'Giải pháp hoàn hảo cho doanh nghiệp đang tăng tốc tuyển dụng IT & Tech Talent.',
      features: [
        { text: `Đăng tối đa ${quota > 0 ? quota : 30} tin tuyển dụng hoạt động cùng lúc`, highlight: true },
        { text: 'Toàn bộ tính năng AI JD Extractor & Phân tích Skill Gap Matrix', highlight: true },
        { text: 'Mở khóa xem Báo cáo kết quả Phỏng vấn AI Voice của ứng viên', highlight: true },
        { text: 'Mở khóa Duyệt & Chuyển trạng thái ứng viên hàng loạt (Batch)', highlight: true },
        { text: 'Xuất báo cáo đánh giá ứng viên ra file Excel chuyên nghiệp', highlight: true },
      ],
      missingFeatures: [
        'Đăng tin tuyển dụng KHÔNG GIỚI HẠN số lượng',
      ]
    };
  }

  // Cấp độ 1: HIRING STARTER (Giá > 0 và <= 250.000đ, hoặc tên chứa starter)
  if ((price > 0 && price <= 250000) || name.includes('starter')) {
    return {
      tagline: 'Gói khởi động tối ưu chi phí dành cho SME, mở khóa toàn bộ công cụ trích xuất JD & Excel.',
      features: [
        { text: `Đăng tối đa ${quota > 0 ? quota : 10} tin tuyển dụng hoạt động cùng lúc`, highlight: true },
        { text: 'KHÔNG GIỚI HẠN dùng AI Phân tích JD & Trích xuất kỹ năng', highlight: true },
        { text: 'Mở khóa Báo cáo phân tích khoảng trống kỹ năng (Skill Gap)', highlight: true },
        { text: 'Lọc & Xếp hạng ứng viên thông minh theo chuẩn AI 70/30', highlight: true },
        { text: 'Mở khóa tính năng Xuất danh sách ứng viên ra file Excel', highlight: true },
      ],
      missingFeatures: [
        'Xem chi tiết Báo cáo Phỏng vấn AI Voice của ứng viên',
        'Duyệt chuyển trạng thái ứng viên hàng loạt (Batch Action)',
      ]
    };
  }

  // Cấp độ 0: FREE RECRUITER (Mặc định khi price === 0 hoặc tên chứa free)
  return {
    tagline: 'Dành cho doanh nghiệp nhỏ trải nghiệm tính năng bóc tách CV & Matching AI cơ bản.',
    features: [
      { text: `Đăng tối đa ${quota > 0 ? quota : 3} tin tuyển dụng hoạt động cùng lúc`, highlight: true },
      { text: 'Xem danh sách ứng viên & Điểm % AI Match tổng quan', highlight: false },
      { text: '2 Lượt / ngày dùng AI Phân tích JD & Đề xuất kỹ năng', highlight: false },
      { text: 'Bảng quản lý quy trình ứng tuyển Kanban tiêu chuẩn', highlight: false },
      { text: 'Tự động gửi Email & Thông báo khi duyệt hồ sơ', highlight: false },
    ],
    missingFeatures: [
      'Mở khóa Báo cáo phân tích khoảng trống kỹ năng (Skill Gap)',
      'Xem chi tiết Báo cáo Phỏng vấn AI Voice của ứng viên',
      'Xuất dữ liệu báo cáo ứng viên ra file Excel (.xlsx)',
    ]
  };
};

const getRecruiterPlanTier = (planNameOrId, monthlyPrice) => {
  const price = Number(monthlyPrice);
  if (!isNaN(price) && price > 0) {
    if (price >= 1000000) return 3;
    if (price > 250000) return 2;
    return 1;
  }
  const id = String(planNameOrId || '').toUpperCase();
  if (id.includes('ELITE') || id.includes('ENTERPRISE') || id.includes('VIP') || id.includes('PKG-4') || id === '4') return 3;
  if (id.includes('PRO') || id.includes('PROFESSIONAL') || id.includes('PKG-3') || id === '3') return 2;
  if (id.includes('STARTER') || id.includes('HIRING_STARTER') || id.includes('PKG-2') || id === '2') return 1;
  return 0; // FREE / BASIC / PKG-1
};

export default function RecruiterPricingPage({ user, onNavigate }) {
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // 'MONTHLY' | 'YEARLY'
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);
  const [selectedAddonForPurchase, setSelectedAddonForPurchase] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in percentage
  const [voucherDiscountAmount, setVoucherDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('VIETQR'); // 'VIETQR' | 'MOMO' | 'CARD'
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [dbPlans, setDbPlans] = useState([]);
  
  // Current active plan state (Đồng bộ từ database Supabase)
  const [activePlan, setActivePlan] = useState('BASIC');
  const [userCredits, setUserCredits] = useState(42);
  const [userActiveJobsCount, setUserActiveJobsCount] = useState(0);
  const [activeSubscriptionInfo, setActiveSubscriptionInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_recruiter_subscription');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [orderFilterTab, setOrderFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'CANCELLED'
  const [selectedDurationMonths, setSelectedDurationMonths] = useState(1); // 1, 3, 6, 12

  // VAT Invoice Modal States
  const [showVatModal, setShowVatModal] = useState(false);
  const [vatTargetOrder, setVatTargetOrder] = useState(null);
  const [vatForm, setVatForm] = useState({
    companyName: '',
    taxCode: '',
    address: '',
    email: '',
    contactPerson: '',
    phone: '',
    notes: ''
  });
  const [vatErrors, setVatErrors] = useState({});
  const [vatSuccessOrderCodes, setVatSuccessOrderCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('hiremate_vat_requested_codes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchActiveJobsCount = async () => {
      try {
        const res = await jobApi.getMyJobs();
        if (Array.isArray(res?.data)) {
          const activeJobs = res.data.filter(
            (j) => j.status === 'PUBLISHED' || j.status === 'ACTIVE'
          );
          setUserActiveJobsCount(activeJobs.length);
        }
      } catch (err) {
        console.error('Không thể tải số lượng tin đang mở từ Supabase:', err);
      }
    };
    fetchActiveJobsCount();
  }, []);

  const syncSubscriptionState = (sub, ordersList = allOrders) => {
    if (!sub || !sub.active) {
      setActiveSubscriptionInfo(null);
      localStorage.removeItem('hiremate_recruiter_subscription');
      setActivePlan('BASIC');
      setUserCredits(50);
      return;
    }

    setActiveSubscriptionInfo(sub);
    try {
      localStorage.setItem('hiremate_recruiter_subscription', JSON.stringify(sub));
    } catch (e) {
      console.warn('Could not cache recruiter subscription', e);
    }

    const pName = (sub.planName || '').toLowerCase();
    const pId = sub.planId ? `PLAN_${sub.planId}` : '';

    let baseCredits = 50;
    if (pName.includes('elite') || pName.includes('enterprise') || pName.includes('vip') || (sub.quotaLimit && sub.quotaLimit >= 999)) {
      setActivePlan('ENTERPRISE');
      baseCredits = 3000;
    } else if (pName.includes('pro') || pName.includes('professional')) {
      setActivePlan('PROFESSIONAL');
      baseCredits = 500;
    } else if (pName.includes('starter') || (sub.quotaLimit && sub.quotaLimit >= 10 && sub.quotaLimit < 30)) {
      setActivePlan('STARTER');
      baseCredits = 150;
    } else {
      setActivePlan(pId || 'BASIC');
      baseCredits = 50;
    }

    let addonCredits = 0;
    try {
      (ordersList || []).forEach((o) => {
        if (o.status === 'APPROVED') {
          const note = `${o.adminNote || ''} ${o.pkg || ''} ${o.planName || ''}`.toLowerCase();
          if (note.includes('500') && (note.includes('credit') || note.includes('addon'))) {
            addonCredits += 500;
          } else if (note.includes('100') && (note.includes('credit') || note.includes('addon'))) {
            addonCredits += 100;
          }
        }
      });
    } catch {}

    setUserCredits(baseCredits + addonCredits);
  };

  const fetchMySubscription = () => {
    paymentApi.getMySubscription()
      .then(res => {
        const sub = res.data?.data || res.data;
        syncSubscriptionState(sub);
      })
      .catch(err => {
        console.warn('Could not load recruiter active subscription, using fallback', err);
        try {
          const cached = localStorage.getItem('hiremate_recruiter_subscription');
          if (cached) syncSubscriptionState(JSON.parse(cached));
        } catch (e) {}
      });
  };

  const fetchMyPendingOrders = () => {
    paymentApi.getMyOrders()
      .then(res => {
        const orders = res.data?.data || res.data || [];
        if (Array.isArray(orders)) {
          setAllOrders(orders);
          const pendings = orders.filter(o => o.status === 'PENDING');
          setPendingOrders(pendings);
          if (activeSubscriptionInfo) {
            syncSubscriptionState(activeSubscriptionInfo, orders);
          }
        }
      })
      .catch(err => console.warn('Could not load recruiter orders', err));
  };

  const triggerToast = (msg) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(''), 4000);
  };

  const handleOpenVatModal = (order) => {
    setVatTargetOrder(order);
    let cachedLegal = null;
    const companyKey = (user?.companyName || 'vng_corporation').toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      const savedLegal = localStorage.getItem(`hiremate_company_legal_${companyKey}`) || localStorage.getItem('company_legal_dossier_' + companyKey);
      if (savedLegal) cachedLegal = JSON.parse(savedLegal);
    } catch {}

    setVatForm({
      companyName: cachedLegal?.registeredName || cachedLegal?.companyName || user?.companyName || '',
      taxCode: cachedLegal?.taxCode || '',
      address: cachedLegal?.registeredAddress || cachedLegal?.address || user?.address || 'Việt Nam',
      email: user?.email || '',
      contactPerson: user?.fullName || 'Đại diện tuyển dụng',
      phone: user?.phone || '',
      notes: `Yêu cầu xuất hóa đơn điện tử cho đơn hàng #${order.orderCode} - ${order.planName || 'Gói Dịch Vụ HireMate AI'}`
    });
    setVatErrors({});
    setShowVatModal(true);
  };

  const handleSubmitVatRequest = (e) => {
    e.preventDefault();
    if (!vatTargetOrder) return;

    const errors = {};
    const cleanTax = (vatForm.taxCode || '').trim();
    const taxRegex = /^(\d{10}|\d{10}-\d{3}|\d{13})$/;
    if (!cleanTax) {
      errors.taxCode = 'Vui lòng nhập mã số thuế';
    } else if (!taxRegex.test(cleanTax)) {
      errors.taxCode = 'MST Việt Nam không đúng định dạng (phải gồm 10 hoặc 13 chữ số, VD: 0101234567 hoặc 0101234567-001)';
    }

    const cleanPhone = (vatForm.phone || '').trim();
    const phoneRegex = /^0\d{9}$/;
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không đúng định dạng (phải gồm 10 chữ số bắt đầu bằng số 0, VD: 0912345678)';
    }

    if (Object.keys(errors).length > 0) {
      setVatErrors(errors);
      triggerToast('Vui lòng kiểm tra lại định dạng Mã số thuế hoặc Số điện thoại!');
      return;
    }
    setVatErrors({});

    try {
      const code = vatTargetOrder.orderCode;
      const updatedCodes = Array.from(new Set([...vatSuccessOrderCodes, code]));
      setVatSuccessOrderCodes(updatedCodes);
      localStorage.setItem('hiremate_vat_requested_codes', JSON.stringify(updatedCodes));
      localStorage.setItem('hiremate_vat_request_detail_' + code, JSON.stringify({
        ...vatForm,
        taxCode: cleanTax,
        phone: cleanPhone,
        orderCode: code,
        requestedAt: new Date().toISOString()
      }));
      setShowVatModal(false);
      triggerToast(`Đã gửi yêu cầu xuất hóa đơn VAT cho đơn hàng #${code} thành công! Kế toán sẽ xử lý trong 24h làm việc.`);
    } catch (err) {
      triggerToast('Lỗi lưu yêu cầu VAT: ' + err.message);
    }
  };

  // Fetch real plans from Supabase if available
  useEffect(() => {
    paymentApi.getPlans('RECRUITER')
      .then(res => {
        const plans = res.data?.data || res.data || [];
        setDbPlans(plans);
      })
      .catch(err => console.warn('Could not load recruiter DB plans', err));

    fetchMySubscription();
    fetchMyPendingOrders();
  }, []);

  const handleCopy = (text, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopyFeedback(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setAppliedDiscount(0);
      setVoucherDiscountAmount(0);
      setPromoMessage('');
      return;
    }

    setValidatingVoucher(true);
    let basePrice = 0;
    if (selectedPlanForPurchase) {
      basePrice = billingCycle === 'YEARLY' 
        ? (selectedPlanForPurchase.yearlyTotal || selectedPlanForPurchase.yearlyPrice * 12) 
        : selectedPlanForPurchase.monthlyPrice;
    } else if (selectedAddonForPurchase) {
      basePrice = selectedAddonForPurchase.price;
    }

    try {
      const res = await paymentApi.validateVoucher(promoCode.trim().toUpperCase(), basePrice);
      const data = res.data?.data || res.data;
      if (data && data.valid) {
        setAppliedDiscount(data.discountPercent || 0);
        setVoucherDiscountAmount(data.discountAmount || 0);
        setPromoMessage(data.message || `Đã áp dụng mã giảm giá ${data.discountPercent}%! 🎉`);
      } else {
        setAppliedDiscount(0);
        setVoucherDiscountAmount(0);
        setPromoMessage(data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      setAppliedDiscount(0);
      setVoucherDiscountAmount(0);
      setPromoMessage(err.response?.data?.message || 'Mã giảm giá không tồn tại trên hệ thống.');
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleOpenPlanModal = (plan) => {
    if (plan.id === activePlan) return;
    if (getRecruiterPlanTier(plan.id) < getRecruiterPlanTier(activePlan)) return;
    setSelectedPlanForPurchase(plan);
    setSelectedAddonForPurchase(null);
    setPromoCode('');
    setAppliedVoucher(null);
    setAppliedDiscount(0);
    setVoucherDiscountAmount(0);
    setPromoMessage('');
    setPurchaseSuccess(false);
    setCreatedOrder(null);
  };

  const handleOpenAddonModal = (addon) => {
    setSelectedAddonForPurchase(addon);
    setSelectedPlanForPurchase(null);
    setPromoCode('');
    setAppliedVoucher(null);
    setAppliedDiscount(0);
    setVoucherDiscountAmount(0);
    setPromoMessage('');
    setPurchaseSuccess(false);
    setCreatedOrder(null);
  };

  const applyPlanBenefits = () => {
    if (selectedPlanForPurchase) {
      setActivePlan(selectedPlanForPurchase.id);
      if (selectedPlanForPurchase.id === 'PROFESSIONAL') setUserCredits(500);
      if (selectedPlanForPurchase.id === 'ENTERPRISE') setUserCredits(3000);
    } else if (selectedAddonForPurchase) {
      if (selectedAddonForPurchase.id === 'CREDITS_100') setUserCredits(prev => prev + 100);
      if (selectedAddonForPurchase.id === 'CREDITS_500') setUserCredits(prev => prev + 500);
    }
    fetchMySubscription();
    window.dispatchEvent(new CustomEvent('hiremate-notification-sync'));
  };

  const handleConfirmPurchase = async () => {
    setIsProcessingCheckout(true);
    let basePrice = 0;
    let planName = '';

    if (selectedPlanForPurchase) {
      basePrice = billingCycle === 'YEARLY' 
        ? (selectedPlanForPurchase.yearlyTotal || selectedPlanForPurchase.yearlyPrice * 12) 
        : selectedPlanForPurchase.monthlyPrice;
      planName = selectedPlanForPurchase.name;
    } else if (selectedAddonForPurchase) {
      basePrice = selectedAddonForPurchase.price;
      planName = selectedAddonForPurchase.name;
    }

    const finalPrice = calculateFinalPrice();

    const isPurchasingAddon = Boolean(selectedAddonForPurchase);
    const matchedPlan = isPurchasingAddon ? null : dbPlans.find(p => 
      p.planId === selectedPlanForPurchase?.dbPlanId ||
      p.planName.toLowerCase().includes(planName.toLowerCase()) || 
      planName.toLowerCase().includes(p.planName.toLowerCase())
    );

    const payload = {
      userId: user?.id || user?.userId || null,
      userEmail: user?.email || null,
      planId: isPurchasingAddon ? null : (selectedPlanForPurchase?.dbPlanId || matchedPlan?.planId || null),
      planName: planName,
      isAddon: isPurchasingAddon,
      targetRole: 'RECRUITER',
      billingCycle: billingCycle,
      paymentMethod: paymentMethod,
      voucherCode: appliedDiscount > 0 ? promoCode.trim().toUpperCase() : null,
      originalAmount: basePrice,
      discountAmount: voucherDiscountAmount,
      amount: finalPrice,
      orderNote: isPurchasingAddon 
        ? `[ADDON] Doanh nghiệp mua Add-on: ${planName} - ${paymentMethod}`
        : `Doanh nghiệp đăng ký ${planName} (${billingCycle === 'YEARLY' ? '12 Tháng' : '1 Tháng'}) - ${paymentMethod}`
    };

    try {
      const res = await paymentApi.createOrder(payload);
      const order = res?.data || res;
      if (!order || !order.orderCode) {
        throw new Error('Dữ liệu đơn hàng trả về từ máy chủ không hợp lệ.');
      }
      setCreatedOrder(order);

      if (order.status === 'APPROVED' || finalPrice === 0) {
        setPurchaseSuccess(true);
        applyPlanBenefits();
      }
    } catch (err) {
      console.error('Lỗi khởi tạo đơn hàng thanh toán Recruiter trên Supabase:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Không thể kết nối đến máy chủ backend (Port 8080).';
      alert(`⚠️ Lỗi tạo đơn hàng thực tế trên CSDL:\n${errorMsg}\n\nVui lòng đảm bảo backend Spring Boot đang chạy và thử lại.`);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Tự động kiểm tra đối soát PayOS 24/7 (polling mỗi 1.5s khi đang mở mã QR)
  useEffect(() => {
    if (!createdOrder?.orderCode || purchaseSuccess || createdOrder.status === 'APPROVED') {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const res = await paymentApi.getOrderStatus(createdOrder.orderCode);
        const order = res.data?.data || res.data;
        if (order && order.status === 'APPROVED') {
          clearInterval(interval);
          setCreatedOrder(order);
          setPurchaseSuccess(true);
          applyPlanBenefits();
          fetchMySubscription();
          fetchMyPendingOrders();

          // Tự động thoát cửa sổ sau 2 giây
          setTimeout(() => {
            setSelectedPlanForPurchase(null);
            setSelectedAddonForPurchase(null);
            setCreatedOrder(null);
            setPurchaseSuccess(false);
          }, 2000);
        }
      } catch (e) {
        // bỏ qua lỗi polling mạng
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [createdOrder?.orderCode, purchaseSuccess]);

  const handleConfirmPaidNow = async () => {
    if (!createdOrder?.orderCode) return;
    setCheckingStatus(true);
    try {
      // Kiểm tra đối soát thực tế từ cổng PayOS / Ngân hàng
      const res = await paymentApi.getOrderStatus(createdOrder.orderCode);
      const order = res.data?.data || res.data;
      if (order && order.status === 'APPROVED') {
        setCreatedOrder(order);
        setPurchaseSuccess(true);
        applyPlanBenefits();
        fetchMySubscription();
        fetchMyPendingOrders();
        return;
      }

      alert(`⏳ Hệ thống ngân hàng chưa ghi nhận tiền về cho đơn hàng #${createdOrder.orderCode}.\n\nNếu quý công ty vừa quét mã chuyển khoản, vui lòng đợi 10 - 30 giây để hệ thống tự động đối soát rồi kiểm tra lại nhé!`);
    } catch (err) {
      alert('Không thể xác nhận: ' + (err.response?.data?.message || err.message || 'Vui lòng thử lại'));
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleActivateSpecificOrder = async (orderCode) => {
    setCheckingStatus(true);
    try {
      // Kiểm tra trạng thái thực tế từ PayOS, KHÔNG tự động duyệt nếu chưa thanh toán
      const res = await paymentApi.getOrderStatus(orderCode);
      const order = res.data?.data || res.data;
      if (order && order.status === 'APPROVED') {
        alert(`🎉 Chúc mừng! Đơn hàng doanh nghiệp #${orderCode} đã đối soát thành công và gói dịch vụ đã được kích hoạt!`);
        fetchMySubscription();
        fetchMyPendingOrders();
      } else {
        alert(`⏳ Đơn hàng #${orderCode} hiện vẫn đang chờ thanh toán.\n\nNếu quý công ty chưa chuyển khoản, vui lòng bấm "Xem Mã QR" để quét mã. Nếu đã chuyển, vui lòng đợi trong giây lát để ngân hàng xử lý nhé!`);
      }
    } catch (err) {
      alert('Lỗi kiểm tra đơn hàng: ' + (err.response?.data?.message || err.message || 'Vui lòng thử lại'));
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCancelSpecificOrder = async (orderCode) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderCode} không?`)) {
      return;
    }
    setCheckingStatus(true);
    try {
      await paymentApi.cancelOrder(orderCode);
      alert(`Đã hủy đơn hàng #${orderCode} thành công.`);
      fetchMyPendingOrders();
      if (createdOrder?.orderCode === orderCode) {
        setCreatedOrder(null);
      }
    } catch (err) {
      alert('Lỗi khi hủy đơn hàng: ' + (err.response?.data?.message || err.message || 'Vui lòng thử lại'));
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleOpenPendingOrderQr = (order) => {
    if (!order) return;
    try {
      const allPlans = [...(RECRUITER_SUBSCRIPTION_PLANS || []), ...(dbPlans || [])];
      const matchedPlan = allPlans.find(p => 
        (p.id && order.planId && p.id === order.planId) ||
        (p.planId && order.planId && p.planId === order.planId) ||
        (p.name && order.planName && p.name.toLowerCase() === order.planName.toLowerCase()) ||
        (p.planName && order.planName && p.planName.toLowerCase() === order.planName.toLowerCase())
      );
      if (matchedPlan) {
        setSelectedPlanForPurchase(matchedPlan);
      }
    } catch (e) {
      console.warn('Could not match plan details:', e);
    }
    setCreatedOrder(order);
    setPurchaseSuccess(false);
  };

  const handleCheckOrderStatus = async () => {
    if (!createdOrder?.orderCode) return;
    setCheckingStatus(true);
    try {
      const res = await paymentApi.getOrderStatus(createdOrder.orderCode);
      const order = res.data?.data || res.data;
      if (order && order.status === 'APPROVED') {
        setCreatedOrder(order);
        setPurchaseSuccess(true);
        applyPlanBenefits();
      } else if (order && order.status === 'REJECTED') {
        alert('Đơn hàng đã bị từ chối duyệt. Vui lòng liên hệ bộ phận kế toán HireMate.');
      } else {
        setCopyFeedback('Đang chờ hệ thống ngân hàng ghi nhận chuyển khoản...');
        setTimeout(() => setCopyFeedback(''), 3500);
      }
    } catch (err) {
      setCopyFeedback('Chưa thể kết nối kiểm tra đơn, vui lòng thử lại.');
      setTimeout(() => setCopyFeedback(''), 3000);
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatVND = (amount) => {
    if (!amount || amount === 0) return '0 VNĐ';
    return Math.round(amount).toLocaleString('vi-VN') + ' VNĐ';
  };

  const calculateFinalPrice = () => {
    let basePrice = 0;
    if (selectedPlanForPurchase) {
      basePrice = billingCycle === 'YEARLY' 
        ? (selectedPlanForPurchase.yearlyTotal || selectedPlanForPurchase.yearlyPrice * 12) 
        : selectedPlanForPurchase.monthlyPrice;
    } else if (selectedAddonForPurchase) {
      basePrice = selectedAddonForPurchase.price;
    }

    if (voucherDiscountAmount > 0) {
      return Math.max(0, basePrice - voucherDiscountAmount);
    }
    if (appliedDiscount > 0) {
      return Math.max(0, basePrice * (1 - appliedDiscount / 100));
    }
    return basePrice;
  };

  // Đồng bộ động các gói và giá từ CSDL Supabase (khi Admin chỉnh sửa giá / hạn mức / thêm gói mới)
  const plansToDisplay = React.useMemo(() => {
    const rawList = (!dbPlans || dbPlans.length === 0) ? RECRUITER_SUBSCRIPTION_PLANS : dbPlans;

    return rawList.map((db, idx) => {
      const dbMonthly = Number(db.price !== undefined ? db.price : db.monthlyPrice) || 0;
      const dbYearlyTotal = Math.round(dbMonthly * 12 * 0.8); // 20% discount on yearly
      const dbMonthlyEquivalent = Math.round(dbMonthly * 0.8);
      const dbName = db.planName || db.name || `Gói Tuyển Dụng #${idx + 1}`;
      const quota = db.quotaLimit !== undefined ? db.quotaLimit : (dbMonthly === 0 ? 3 : dbMonthly < 1000000 ? 15 : 999);
      const planId = db.planId ? `PLAN_${db.planId}` : (db.id || `PLAN_${idx}`);

      // Sinh toàn bộ quyền lợi chi tiết và hạn quyền phân quyền rõ ràng bằng hàm getRecruiterEnrichedFeatures
      const enriched = getRecruiterEnrichedFeatures(dbName, dbMonthly, quota, db.description);

      const isFree = dbMonthly === 0;
      const isElite = dbName.toLowerCase().includes('elite') || dbName.toLowerCase().includes('enterprise') || dbMonthly >= 1000000;
      const isPro = (dbMonthly > 250000 && dbMonthly < 1000000) || dbName.toLowerCase().includes('pro');

      return {
        id: db.id || planId,
        dbPlanId: db.planId || null,
        name: dbName,
        tagline: enriched.tagline,
        monthlyPrice: dbMonthly,
        yearlyPrice: dbMonthlyEquivalent,
        yearlyTotal: dbYearlyTotal,
        badgeText: isFree ? 'MIỄN PHÍ VĨNH VIỄN' : isElite ? 'TOÀN DIỆN & VIP 👑' : isPro ? 'PHỔ BIẾN NHẤT 🔥' : 'TIẾT KIỆM ⭐',
        badgeColor: isFree ? 'bg-slate-100 text-slate-600 border-slate-200' : isElite ? 'bg-purple-100 text-purple-800 border-purple-300' : isPro ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300',
        buttonText: isFree ? 'Gói Mặc Định' : isElite ? 'Mua Gói Hiring Elite VIP' : isPro ? 'Nâng Cấp Hiring Pro' : 'Nâng Cấp Hiring Starter',
        isPopular: isPro,
        quotaLimit: quota,
        durationDays: db.durationDays || (isFree ? 365 : 30),
        features: enriched.features,
        missingFeatures: enriched.missingFeatures,
      };
    });
  }, [dbPlans]);

  return (
    <div className="min-h-screen bg-transparent text-[#1e1b4b] py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* TOP HERO HEADER */}
        <div className="bg-gradient-to-r from-[#32247b] via-[#4331a6] to-[#5b46e0] text-white rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-indigo-400/30 text-center">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto space-y-4 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-base text-emerald-400">verified</span>
              <span>Gói Dịch Vụ Dành Cho Nhà Tuyển Dụng</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Bứt Phá Tốc Độ Tuyển Dụng Với <span className="text-emerald-400">AI Matching</span>
            </h1>

            <p className="text-purple-100 text-sm sm:text-base leading-relaxed font-sans max-w-2xl mx-auto">
              Lọc CV chuẩn xác 99%, tự động xếp hạng ứng viên hàng đầu và truy cập báo cáo phỏng vấn giả lập AI độc quyền. Chọn gói phù hợp với doanh nghiệp của bạn!
            </p>

            {/* Current Recruiter Status Card */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium">
              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Gói Hiện Tại:</span>
                <span className="font-bold text-white uppercase tracking-wide">
                  {activeSubscriptionInfo?.planName || (activePlan === 'STARTER' ? 'Hiring Starter' : activePlan === 'PROFESSIONAL' ? 'Hiring Pro' : activePlan === 'ENTERPRISE' ? 'Hiring Elite' : 'Gói Cơ Bản (Miễn phí)')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                  ACTIVE {activeSubscriptionInfo?.daysRemaining ? `(${activeSubscriptionInfo.daysRemaining} ngày)` : ''}
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Credits AI Soi CV:</span>
                <span className="font-extrabold text-amber-300 text-sm">{userCredits} Lượt</span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Tin Đang Đăng:</span>
                <span className="font-extrabold text-white">
                  {userActiveJobsCount} / {(activeSubscriptionInfo?.quotaLimit && activeSubscriptionInfo.quotaLimit >= 999) ? '∞' : (activeSubscriptionInfo?.quotaLimit || (activePlan === 'ENTERPRISE' ? '∞' : activePlan === 'PROFESSIONAL' ? '30' : activePlan === 'STARTER' ? '10' : '3'))} Tin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PENDING ORDERS BANNER (IF ANY) */}
        {pendingOrders.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <span className="material-symbols-outlined text-amber-600">notifications_active</span>
              <span>Doanh nghiệp của bạn có {pendingOrders.length} đơn hàng chuyển khoản đang chờ kích hoạt:</span>
            </div>
            <div className="space-y-2">
              {pendingOrders.map((ord) => (
                <div key={ord.orderCode} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="text-xs">
                    <span className="font-mono font-bold text-[#32247b]">Mã đơn: #{ord.orderCode}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="font-bold text-slate-800">{ord.planName || 'Gói Dịch Vụ'}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="font-black text-emerald-600">{formatVND(ord.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenPendingOrderQr(ord)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">qr_code</span>
                      <span>Xem Mã QR</span>
                    </button>
                    <button
                      onClick={() => handleActivateSpecificOrder(ord.orderCode)}
                      disabled={checkingStatus}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      <span>Kiểm Tra Đã Chuyển Tiền</span>
                    </button>
                    <button
                      onClick={() => handleCancelSpecificOrder(ord.orderCode)}
                      disabled={checkingStatus}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all border border-rose-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      <span>Hủy Đơn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BILLING TOGGLE (MONTHLY VS YEARLY) */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-white p-1.5 rounded-full border border-purple-100 shadow-md inline-flex items-center gap-2">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-[#32247b] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#32247b]'
              }`}
            >
              Thanh Toán Theo Tháng
            </button>

            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                billingCycle === 'YEARLY'
                  ? 'bg-[#32247b] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#32247b]'
              }`}
            >
              <span>Thanh Toán Theo Năm</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase animate-pulse">
                Tiết Kiệm 20%
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {billingCycle === 'YEARLY' 
              ? '🎉 Gói Trọn Năm: Thanh toán 1 lần cho cả 12 tháng - Tiết kiệm ngay 20% ngân sách tuyển dụng!' 
              : '💡 Đổi sang Thanh Toán Theo Năm để tiết kiệm lên đến hàng triệu đồng mỗi năm!'}
          </p>
        </div>

        {/* PRICING CARDS GRID: 4 CỘT HIỂN THỊ ĐẦY ĐỦ CẢ 4 GÓI TỪ SUPABASE */}
        {(() => {
          const getRecruiterPlanTier = (planNameOrId, price) => {
            const s = String(planNameOrId || '').toLowerCase();
            if (s.includes('elite') || s.includes('enterprise') || s.includes('vip') || (price && price >= 1000000)) return 4;
            if (s.includes('pro') || s.includes('professional') || (price && price >= 400000)) return 3;
            if (s.includes('starter') || (price && price >= 100000)) return 2;
            return 1;
          };

          const getTierFromKey = (tierKey) => {
            const k = String(tierKey || '').toUpperCase();
            if (k.includes('ELITE') || k.includes('ENTERPRISE')) return 4;
            if (k.includes('PRO')) return 3;
            if (k.includes('STARTER')) return 2;
            return 1;
          };

          const currentTier = getTierFromKey(activePlan);
          const hasActivePaidPlan = Boolean(activePlan && activePlan !== 'BASIC' && activeSubscriptionInfo && activeSubscriptionInfo.status === 'ACTIVE');
          const isThisPlanActive = (plan) => {
            return getRecruiterPlanTier(plan.name || plan.id, plan.monthlyPrice) === currentTier;
          };

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {plansToDisplay.map((plan) => {
                const planTier = getRecruiterPlanTier(plan.name || plan.id, plan.monthlyPrice);
                const isSelected = hasActivePaidPlan ? isThisPlanActive(plan) : (plan.monthlyPrice === 0 || plan.id === 'BASIC');
                const isLowerTier = hasActivePaidPlan && !isSelected && planTier < currentTier;

            return (
              <div
                key={plan.id}
                className={`relative rounded-[32px] bg-white p-8 flex flex-col justify-between transition-all duration-300 border ${
                  isSelected
                    ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                    : isLowerTier
                    ? 'border-slate-200/60 bg-slate-50/40 opacity-75'
                    : plan.isPopular
                    ? 'border-[#5b46e0] shadow-[0_20px_50px_rgba(91,70,224,0.18)] ring-2 ring-[#5b46e0]/20 scale-102'
                    : 'border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200'
                }`}
              >
                {/* Popular or Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${plan.badgeColor}`}>
                    {plan.badgeText}
                  </span>

                  {isSelected ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold border border-emerald-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                      <span>ĐANG SỬ DỤNG</span>
                    </span>
                  ) : isLowerTier ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      <span>ĐÃ BAO GỒM</span>
                    </span>
                  ) : null}
                </div>

                {/* Card Title & Pricing */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#1e1b4b]">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.tagline}</p>
                  </div>

                  <div className="py-3 border-y border-slate-100">
                    {plan.monthlyPrice === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-[#1e1b4b]">0 VNĐ</span>
                        <span className="text-xs text-slate-400 font-medium">/ Vĩnh viễn</span>
                      </div>
                    ) : billingCycle === 'YEARLY' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-[#32247b]">
                            {formatVND(plan.yearlyTotal).replace(' VNĐ', '')}
                          </span>
                          <span className="text-xs font-bold text-[#32247b]">VNĐ</span>
                          <span className="text-xs text-slate-500 font-bold">/ năm (12 tháng)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">
                            {formatVND(plan.monthlyPrice * 12)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-extrabold">
                            Tiết kiệm 20% (~{formatVND(plan.yearlyPrice)}/tháng)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-[#32247b]">
                            {formatVND(plan.monthlyPrice).replace(' VNĐ', '')}
                          </span>
                          <span className="text-xs font-bold text-[#32247b]">VNĐ</span>
                          <span className="text-xs text-slate-400 font-medium">/ 30 ngày</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          Thanh toán linh hoạt từng chu kỳ 30 ngày
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Đặc Quyền Gói:</p>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-emerald-500 text-base shrink-0 font-bold">check_circle</span>
                          <span className={feat.highlight ? 'font-bold text-[#1e1b4b]' : ''}>
                            {feat.text}
                          </span>
                        </li>
                      ))}

                      {plan.missingFeatures.map((mFeat, idx) => (
                        <li key={`missing-${idx}`} className="flex items-start gap-2.5 opacity-40">
                          <span className="material-symbols-outlined text-slate-400 text-base shrink-0">cancel</span>
                          <span className="line-through">{mFeat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-8">
                  <button
                    onClick={() => handleOpenPlanModal(plan)}
                    disabled={isSelected || isLowerTier}
                    className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                      isSelected || isLowerTier
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                        : plan.isPopular
                        ? 'bg-[#10b981] hover:bg-[#059669] text-white hover:scale-102 shadow-emerald-500/25 cursor-pointer'
                        : 'bg-[#32247b] hover:bg-[#4331a6] text-white hover:scale-102 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSelected || isLowerTier ? 'check_circle' : 'shopping_cart'}
                    </span>
                    <span>
                      {isSelected
                        ? 'Gói Bạn Đang Dùng'
                        : isLowerTier
                        ? 'Đã Bao Gồm Trong Gói Hiện Tại'
                        : plan.buttonText}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    })()}

        {/* ADD-ON CREDITS & FEATURED JOBS SECTION */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#32247b] text-2xl">add_shopping_cart</span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b4b]">
                  Gói Mua Lẻ Credits &amp; Đẩy Tin Nổi Bật (Add-ons)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mua thêm hạn ngạch tạm thời cho nhà tuyển dụng mà không cần thay đổi gói cước định kỳ.
              </p>
            </div>
            
            <span className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm font-bold">all_inclusive</span>
              <span>Cộng dồn vĩnh viễn</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RECRUITER_ADDONS.map((addon) => (
              <div
                key={addon.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-white transition-all flex flex-col justify-between space-y-4 group shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${addon.color} text-white flex items-center justify-center shadow-sm`}>
                      <span className="material-symbols-outlined text-xl">{addon.icon}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-[#32247b] text-[10px] font-bold">
                      {addon.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#1e1b4b] group-hover:text-[#32247b] transition-colors">
                      {addon.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-sans">
                      {addon.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="font-extrabold text-base text-[#32247b]">
                    {formatVND(addon.price)}
                  </span>

                  <button
                    onClick={() => handleOpenAddonModal(addon)}
                    className="px-3 py-1.5 rounded-xl bg-[#32247b] hover:bg-[#10b981] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Mua Ngay</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPARISON MATRIX TABLE */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b4b]">
              Bảng So Sánh Chi Tiết Quyền Lợi Gói
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Đối chiếu trực quan toàn bộ tính năng vượt trội giữa các hạng gói dịch vụ HireMate AI.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs text-slate-600 uppercase font-extrabold bg-slate-50/80">
                  <th className="py-4 px-4">Tính Năng / Đặc Quyền</th>
                  <th className="py-4 px-4 text-center">Free Recruiter</th>
                  <th className="py-4 px-4 text-center text-blue-700">Hiring Starter (199K)</th>
                  <th className="py-4 px-4 text-center text-[#32247b]">Hiring Pro (499K)</th>
                  <th className="py-4 px-4 text-center text-purple-700">Hiring Elite (1.199K)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1e1b4b]">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600">{row.free}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-800 bg-blue-50/20">{row.starter}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#32247b] bg-indigo-50/20">{row.pro}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/20">{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ENTERPRISE TRANSACTION HISTORY & VAT E-INVOICE SECTION */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-[#32247b] material-symbols-outlined text-xl">
                  receipt_long
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e1b4b]">
                  Lịch Sử Giao Dịch &amp; Hóa Đơn Doanh Nghiệp
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi tất cả các giao dịch thanh toán gói dịch vụ tuyển dụng và yêu cầu xuất hóa đơn điện tử VAT.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PENDING', label: 'Chờ thanh toán' },
                { id: 'APPROVED', label: 'Đã kích hoạt' },
                { id: 'CANCELLED', label: 'Đã hủy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    orderFilterTab === tab.id
                      ? 'bg-white text-[#32247b] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          {(() => {
            const displayOrders = (allOrders.length > 0 ? allOrders : pendingOrders).filter((ord) => {
              if (orderFilterTab === 'PENDING') return ord.status === 'PENDING';
              if (orderFilterTab === 'APPROVED') return ord.status === 'APPROVED' || ord.status === 'COMPLETED';
              if (orderFilterTab === 'CANCELLED') return ord.status === 'CANCELLED' || ord.status === 'REJECTED';
              return true;
            });

            if (displayOrders.length === 0) {
              return (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                  <p className="text-xs font-bold text-slate-500">
                    Chưa có giao dịch nào trong phân mục này
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Chọn nâng cấp gói dịch vụ ở trên để mở rộng hạn ngạch và tính năng tuyển dụng cao cấp.
                  </p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase font-black bg-slate-50">
                      <th className="py-3 px-4">Mã Đơn Hàng</th>
                      <th className="py-3 px-4">Gói Dịch Vụ</th>
                      <th className="py-3 px-4">Số Tiền</th>
                      <th className="py-3 px-4">Phương Thức</th>
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {displayOrders.map((ord) => {
                      const isVatRequested = vatSuccessOrderCodes.includes(ord.orderCode);
                      const isApproved = ord.status === 'APPROVED' || ord.status === 'COMPLETED';
                      const isPending = ord.status === 'PENDING';
                      const isCancelled = ord.status === 'CANCELLED' || ord.status === 'REJECTED';

                      return (
                        <tr key={ord.orderCode} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#32247b]">
                            #{ord.orderCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {ord.planName || 'Gói Tuyển Dụng'}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-600">
                            {formatVND(ord.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700">
                              <span className="material-symbols-outlined text-xs">qr_code_2</span>
                              <span>VietQR Napas247</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                          </td>
                          <td className="py-3.5 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold">
                                <span className="material-symbols-outlined text-xs font-bold">check_circle</span>
                                <span>Đã Kích Hoạt</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold animate-pulse">
                                <span className="material-symbols-outlined text-xs">hourglass_top</span>
                                <span>Chờ Thanh Toán</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">
                                <span className="material-symbols-outlined text-xs">cancel</span>
                                <span>Đã Hủy</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleOpenPendingOrderQr(ord)}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#32247b] text-[11px] font-bold transition-all border border-indigo-200 cursor-pointer"
                                  >
                                    Mã QR
                                  </button>
                                  <button
                                    onClick={() => handleActivateSpecificOrder(ord.orderCode)}
                                    disabled={checkingStatus}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    Kiểm Tra
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                isVatRequested ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                                    <span className="material-symbols-outlined text-xs">verified</span>
                                    <span>Đã Yêu Cầu VAT</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleOpenVatModal(ord)}
                                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#32247b] text-[11px] font-bold transition-all border border-purple-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-xs">description</span>
                                    <span>Xuất HĐ VAT</span>
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* VAT E-INVOICE REQUEST MODAL */}
        {showVatModal && vatTargetOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#32247b]">receipt</span>
                  <h3 className="text-lg font-black text-[#1e1b4b]">
                    Yêu Cầu Xuất Hóa Đơn Điện Tử VAT
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVatModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-[#32247b] space-y-1">
                <p><strong>Mã đơn hàng:</strong> #{vatTargetOrder.orderCode}</p>
                <p><strong>Dịch vụ:</strong> {vatTargetOrder.planName || 'Gói Dịch Vụ Tuyển Dụng'}</p>
                <p><strong>Tổng tiền thanh toán (đã gồm VAT):</strong> {formatVND(vatTargetOrder.amount)}</p>
              </div>

              <form onSubmit={handleSubmitVatRequest} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                    Tên Doanh Nghiệp Trên Giấy Phép GPKD <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vatForm.companyName}
                    onChange={(e) => setVatForm({ ...vatForm, companyName: e.target.value })}
                    placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-[#32247b]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                      Mã Số Thuế (MST) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vatForm.taxCode}
                      maxLength={14}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9-]/g, '').slice(0, 14);
                        setVatForm({ ...vatForm, taxCode: val });
                        if (vatErrors.taxCode) setVatErrors((prev) => ({ ...prev, taxCode: null }));
                      }}
                      placeholder="VD: 0101234567 hoặc 0101234567-001"
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-800 focus:outline-none transition-all ${
                        vatErrors.taxCode
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 focus:border-[#32247b]'
                      }`}
                    />
                    {vatErrors.taxCode && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        <span>{vatErrors.taxCode}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                      Email Nhận Hóa Đơn Điện Tử <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={vatForm.email}
                      onChange={(e) => setVatForm({ ...vatForm, email: e.target.value })}
                      placeholder="ketoan@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#32247b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                    Địa Chỉ Đăng Ký Kinh Doanh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vatForm.address}
                    onChange={(e) => setVatForm({ ...vatForm, address: e.target.value })}
                    placeholder="VD: Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#32247b]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                      Người Liên Hệ Nhận HĐ
                    </label>
                    <input
                      type="text"
                      value={vatForm.contactPerson}
                      onChange={(e) => setVatForm({ ...vatForm, contactPerson: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#32247b]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                      Số Điện Thoại Liên Hệ
                    </label>
                    <input
                      type="tel"
                      value={vatForm.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setVatForm({ ...vatForm, phone: val });
                        if (vatErrors.phone) setVatErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      placeholder="VD: 0912345678 (10 số)"
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 font-medium text-slate-800 focus:outline-none transition-all ${
                        vatErrors.phone
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 focus:border-[#32247b]'
                      }`}
                    />
                    {vatErrors.phone && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        <span>{vatErrors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block mb-1 uppercase text-[10px]">
                    Ghi Chú Kèm Theo (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={vatForm.notes}
                    onChange={(e) => setVatForm({ ...vatForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:border-[#32247b]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowVatModal(false)}
                    className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#32247b] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#4331a6] shadow-md flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Xác Nhận Gửi Yêu Cầu HĐ VAT</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FAQ ACCORDION SECTION */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[#1e1b4b]">Câu Hỏi Thường Gặp (FAQs)</h2>
            <p className="text-xs text-slate-500">
              Giải đáp thắc mắc về quy trình mua gói, xuất hóa đơn VAT và chính sách thanh toán của HireMate AI.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left px-5 sm:px-6 py-4 bg-slate-50/60 hover:bg-slate-100 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#1e1b4b] cursor-pointer transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 py-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CHECKOUT / PURCHASE PREVIEW MODAL */}
      {(selectedPlanForPurchase || selectedAddonForPurchase || createdOrder) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl sm:max-w-3xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-indigo-100 relative space-y-6 max-h-[92vh] overflow-y-auto scrollbar-thin">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedPlanForPurchase(null);
                setSelectedAddonForPurchase(null);
                setCreatedOrder(null);
              }}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              &times;
            </button>

            {/* Feedback notification toast */}
            {copyFeedback && (
              <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-bounce flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{copyFeedback}</span>
              </div>
            )}

            {!createdOrder && !purchaseSuccess ? (
              <>
                {/* Modal Header */}
                <div className="space-y-1 pr-8">
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-[#32247b] text-[10px] font-extrabold uppercase tracking-wider">
                    Xác Nhận Đơn Hàng Doanh Nghiệp
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#1e1b4b]">
                    {selectedPlanForPurchase ? `Đăng Ký ${selectedPlanForPurchase.name}` : `Mua ${selectedAddonForPurchase?.name}`}
                  </h3>
                </div>

                {/* Item Details Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-[#1e1b4b]">
                    <span>Sản phẩm dịch vụ:</span>
                    <span>{selectedPlanForPurchase?.name || selectedAddonForPurchase?.name}</span>
                  </div>
                  {selectedPlanForPurchase && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Chu kỳ thanh toán:</span>
                      <span className="font-semibold text-emerald-600">
                        {billingCycle === 'YEARLY' ? '12 Tháng (Trọn Gói 1 Năm - Tiết Kiệm 20%)' : '1 Tháng (Linh Hoạt)'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-indigo-100">
                    <span>Đơn giá niêm yết:</span>
                    <span className="font-bold">
                      {formatVND(
                        selectedPlanForPurchase
                          ? (billingCycle === 'YEARLY' ? (selectedPlanForPurchase.yearlyTotal || selectedPlanForPurchase.yearlyPrice * 12) : selectedPlanForPurchase.monthlyPrice)
                          : (selectedAddonForPurchase?.price || 0)
                      )}
                    </span>
                  </div>
                  {billingCycle === 'YEARLY' && selectedPlanForPurchase && (
                    <div className="flex justify-between items-center text-emerald-700 text-xs font-semibold">
                      <span>Ưu đãi thanh toán trọn năm (-20%):</span>
                      <span>Đã tiết kiệm {formatVND(selectedPlanForPurchase.monthlyPrice * 12 * 0.2)}</span>
                    </div>
                  )}
                  {voucherDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-emerald-600">sell</span>
                        <span>Ưu đãi Doanh nghiệp ({promoCode} - {appliedDiscount}%):</span>
                      </span>
                      <span className="font-mono">-{formatVND(voucherDiscountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Voucher Selector Module */}
                <VoucherSelector
                  userRole="RECRUITER"
                  currentPlanId={selectedPlanForPurchase?.id || selectedAddonForPurchase?.id}
                  currentPlanName={selectedPlanForPurchase?.name || selectedAddonForPurchase?.name}
                  basePrice={
                    selectedPlanForPurchase
                      ? (billingCycle === 'YEARLY' ? (selectedPlanForPurchase.yearlyTotal || selectedPlanForPurchase.yearlyPrice * 12) : selectedPlanForPurchase.monthlyPrice)
                      : (selectedAddonForPurchase?.price || 0)
                  }
                  appliedVoucher={appliedVoucher}
                  onApplyVoucher={(voucher, discountAmount) => {
                    setAppliedVoucher(voucher);
                    setPromoCode(voucher.code);
                    setAppliedDiscount(voucher.discountPercent || 0);
                    setVoucherDiscountAmount(discountAmount);
                    setPromoMessage(`Đã áp dụng mã "${voucher.code}" - Giảm ${voucher.discountPercent}% 🎉`);
                  }}
                  onRemoveVoucher={() => {
                    setAppliedVoucher(null);
                    setPromoCode('');
                    setAppliedDiscount(0);
                    setVoucherDiscountAmount(0);
                    setPromoMessage('');
                  }}
                />

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Lựa chọn Phương thức Thanh toán:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'VIETQR', label: 'Mã QR VietQR', icon: 'qr_code_scanner' },
                      { id: 'MOMO', label: 'Ví MoMo', icon: 'account_balance_wallet' },
                      { id: 'CARD', label: 'Thẻ Quốc Tế', icon: 'credit_card' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === method.id
                            ? 'border-[#32247b] bg-indigo-50/80 text-[#32247b] font-bold ring-2 ring-[#32247b]/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{method.icon}</span>
                        <span className="text-[11px]">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Billing & Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Tổng tiền thanh toán:</span>
                    <span className="text-2xl font-black text-[#32247b]">
                      {formatVND(calculateFinalPrice())}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isProcessingCheckout}
                    className={`px-6 py-3.5 rounded-2xl text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg hover:scale-105 transition-all flex items-center gap-2 ${
                      calculateFinalPrice() === 0
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                        : 'bg-[#10b981] hover:bg-[#059669]'
                    }`}
                  >
                    {isProcessingCheckout ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        <span>Đang Tạo Đơn Hàng...</span>
                      </>
                    ) : calculateFinalPrice() === 0 ? (
                      <>
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Kích Hoạt Gói 0 VNĐ Ngay</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                        <span>Tiếp Tục &amp; Lấy Mã QR</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : createdOrder && !purchaseSuccess ? (
              /* VIETQR PAYMENT SCREEN FOR RECRUITER */
              <div className="space-y-5 animate-fadeIn text-center">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                    Đơn Hàng Tuyển Dụng: #{createdOrder.orderCode} (Chờ Thanh Toán)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1e1b4b]">
                    Quét Mã VietQR Chuyển Khoản
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sử dụng Mobile Banking quét mã QR để chuyển khoản chính xác nội dung.
                  </p>
                </div>

                {/* Real VietQR Image */}
                <div className="p-3 bg-gradient-to-b from-indigo-50 to-white rounded-3xl border border-indigo-100 inline-block shadow-md">
                  <img
                    src={createdOrder.qrCodeUrl || `https://img.vietqr.io/image/970422-VQRQAMWSJ4104-compact2.png?amount=${createdOrder.amount}&addInfo=${createdOrder.orderCode}&accountName=HOANG%20NGOC%20DUNG`}
                    alt="Mã QR Chuyển khoản"
                    className="w-56 h-56 mx-auto object-contain rounded-2xl bg-white shadow-inner"
                  />
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-indigo-700">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    <span>VietQR Napas247 Chuẩn Ngân Hàng</span>
                  </div>
                </div>

                {/* Transfer Info Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5 font-medium">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{createdOrder.bankName || 'MBBank - Ngân hàng TMCP Quân Đội'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#32247b]">{createdOrder.bankAccount || 'VQRQAMWSJ4104'}</span>
                      <button
                        onClick={() => handleCopy(createdOrder.bankAccount || 'VQRQAMWSJ4104', 'Số tài khoản')}
                        className="px-2 py-0.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-[#32247b] text-[10px] font-bold cursor-pointer"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">{createdOrder.accountHolder || 'HOANG NGOC DUNG'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Số tiền:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-emerald-600">{formatVND(createdOrder.amount)}</span>
                      <button
                        onClick={() => handleCopy(createdOrder.amount?.toString() || '0', 'Số tiền')}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold cursor-pointer"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
                    <div>
                      <span className="text-amber-800 font-bold block">Nội dung chuyển khoản:</span>
                      <span className="text-[10px] text-amber-600">Vui lòng nhập chính xác mã này</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-amber-900">{createdOrder.orderCode}</span>
                      <button
                        onClick={() => handleCopy(createdOrder.orderCode, 'Nội dung chuyển khoản')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer shadow-xs"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto Status & Intelligent Bank Sync */}
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-center gap-2.5 text-xs text-emerald-800 font-bold shadow-xs">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span>Đang tự động nhận diện giao dịch từ Ngân hàng...</span>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center leading-relaxed px-2">
                    💡 Sau khi quý khách chuyển khoản trên app ngân hàng, hệ thống sẽ <strong>tự động đối soát</strong>, <strong>tự động đóng cửa sổ</strong> và <strong>nâng cấp gói ngay lập tức</strong> mà không cần phải thao tác gì thêm.
                  </p>

                  <button
                    onClick={handleCheckOrderStatus}
                    disabled={checkingStatus}
                    className="w-full py-3 rounded-2xl bg-[#32247b] hover:bg-[#4331a6] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {checkingStatus ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        <span>Đang kiểm tra từ ngân hàng...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Tôi Đã Chuyển Khoản - Kiểm Tra Ngay</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPlanForPurchase(null);
                      setSelectedAddonForPurchase(null);
                      setCreatedOrder(null);
                    }}
                    className="w-full py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              /* SUCCESS VIEW */
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
                  <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-[#1e1b4b]">
                    Đã Nhận Tiền &amp; Kích Hoạt Thành Công! 🎉
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Giao dịch đã được ngân hàng xác nhận. Hạn ngạch và đặc quyền mới của tài khoản đã được kích hoạt!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Đang tự động thoát cửa sổ và áp dụng gói...</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left space-y-1 font-medium">
                  <p><strong>Mã giao dịch:</strong> {createdOrder?.orderCode || 'HM-PAY-SUCCESS'}</p>
                  <p><strong>Gói dịch vụ:</strong> {selectedPlanForPurchase?.name || selectedAddonForPurchase?.name || createdOrder?.planName || 'Gói Dịch Vụ'}</p>
                  <p><strong>Số tiền:</strong> {formatVND(createdOrder?.amount || calculateFinalPrice())}</p>
                  <p><strong>Trạng thái:</strong> ĐÃ KÍCH HOẠT (ACTIVE)</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanForPurchase(null);
                    setSelectedAddonForPurchase(null);
                    setCreatedOrder(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#32247b] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#4331a6] transition-all shadow-lg"
                >
                  Hoàn Tất &amp; Trở Về Bảng Điều Khiển
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
