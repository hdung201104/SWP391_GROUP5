import React, { useState, useEffect } from 'react';
import { jobApi, paymentApi } from '../api';


const RECRUITER_SUBSCRIPTION_PLANS = [
  {
    id: 'BASIC',
    name: 'Gói Khởi Tạo (Starter)',
    tagline: 'Dành cho doanh nghiệp nhỏ trải nghiệm tính năng bóc tách CV & Matching AI cơ bản.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badgeText: 'MIỄN PHÍ VĨNH VIỄN',
    badgeColor: 'bg-[#64748b]/15 text-[#475569] border-[#cbd5e1]',
    buttonText: 'Gói Mặc Định Hiện Tại',
    isPopular: false,
    isCurrent: true,
    features: [
      { text: '3 Tin đăng tuyển dụng active', highlight: true },
      { text: '50 Lượt soi CV & Parse AI Gemini / tháng', highlight: false },
      { text: 'Báo cáo điểm Matching AI cơ bản', highlight: false },
      { text: 'Phễu quản lý ứng viên Kanban tiêu chuẩn', highlight: false },
      { text: 'Tạo & chỉnh sửa thông tin doanh nghiệp', highlight: false },
      { text: 'Hỗ trợ qua Email & Ticket trợ giúp', highlight: false },
    ],
    missingFeatures: [
      'Báo cáo Skill Gap breakdown matrix chi tiết',
      'Xem báo cáo AI Voice Mock Interview ứng viên',
      'Export báo cáo ứng viên PDF/Excel',
      'Badge Verified Enterprise chính chủ',
      'Account Manager hỗ trợ riêng 24/7',
    ]
  },
  {
    id: 'PROFESSIONAL',
    name: 'Gói Tiêu Chuẩn (Pro AI)',
    tagline: 'Giải pháp hoàn hảo cho doanh nghiệp đang tăng tốc tuyển dụng IT & Tech Talent.',
    monthlyPrice: 1990000,
    yearlyPrice: 1592000, // 20% off
    badgeText: 'PHỔ BIẾN NHẤT 🔥',
    badgeColor: 'bg-[#10b981]/15 text-[#047857] border-[#6ee7b7]',
    buttonText: 'Nâng Cấp Gói Pro AI',
    isPopular: true,
    isCurrent: false,
    features: [
      { text: '15 Tin đăng tuyển dụng active', highlight: true },
      { text: '500 Lượt soi CV & Parse AI Gemini / tháng', highlight: true },
      { text: 'Báo cáo Skill Gap Matrix chuẩn xác', highlight: true },
      { text: 'Tự động xếp hạng ứng viên theo AI Match Score', highlight: false },
      { text: 'Phễu Kanban kéo thả không giới hạn', highlight: false },
      { text: 'Tự động gửi mail hẹn phỏng vấn & thông báo', highlight: false },
      { text: 'Export báo cáo ứng viên dạng PDF/Excel', highlight: true },
      { text: 'Badge Doanh nghiệp Xác Thực (Verified Badge)', highlight: true },
      { text: 'Hỗ trợ ưu tiên 24/7 qua Live Chat & Hotline', highlight: false },
    ],
    missingFeatures: [
      'Xem báo cáo AI Voice Mock Interview ứng viên',
      'KHÔNG GIỚI HẠN số lượng tin đăng',
      'Account Manager hỗ trợ riêng 24/7',
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Gói Doanh Nghiệp (Enterprise AI)',
    tagline: 'Dành cho tập đoàn & công ty tuyển dụng quy mô lớn với tính năng AI phỏng vấn độc quyền.',
    monthlyPrice: 4990000,
    yearlyPrice: 3992000, // 20% off
    badgeText: 'TOÀN DIỆN & VIP 👑',
    badgeColor: 'bg-[#8b5cf6]/15 text-[#6d28d9] border-[#c4b5fd]',
    buttonText: 'Liên Hệ / Mua Gói VIP',
    isPopular: false,
    isCurrent: false,
    features: [
      { text: 'KHÔNG GIỚI HẠN tin đăng tuyển dụng active', highlight: true },
      { text: '3,000 Lượt soi CV & AI Deep Evaluation / tháng', highlight: true },
      { text: 'Báo cáo AI Voice Mock Interview của ứng viên', highlight: true },
      { text: 'Đo lường WPM, độ rõ chữ & điểm phỏng vấn AI', highlight: true },
      { text: 'Báo cáo Executive Analytics & Time-to-Hire', highlight: false },
      { text: 'Tự động hóa Pipeline & Chuyển chặng thông minh', highlight: false },
      { text: 'Badge Doanh nghiệp VIP & Ưu tiên đăng tin TOP 1', highlight: true },
      { text: 'Tích hợp ATS & Custom Webhook API', highlight: false },
      { text: 'Dedicated Account Manager hỗ trợ 1-on-1', highlight: true },
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
    desc: 'Thêm 500 lượt bóc tách CV (Giảm 20% so với mua gói lẻ 100).',
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
    badge: 'Tăng 300% lượt xem',
    icon: 'rocket_launch',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'VERIFIED_BADGE',
    name: 'Huy Hiệu Doanh Nghiệp Uy Tín',
    desc: 'Xác thực logo & thương hiệu chính chủ 1 năm, nâng cao uy tín với ứng viên xịn.',
    price: 990000,
    badge: '1 Năm',
    icon: 'verified',
    color: 'from-purple-500 to-pink-600'
  }
];

const COMPARISON_ROWS = [
  { feature: 'Số tin đăng tuyển dụng active', basic: '3 Tin', pro: '15 Tin', enterprise: 'Không giới hạn' },
  { feature: 'Lượt soi CV & Parse AI Gemini / tháng', basic: '50 Lượt', pro: '500 Lượt', enterprise: '3,000 Lượt' },
  { feature: 'Thuật toán AI Matching', basic: 'Cơ bản', pro: 'Nâng cao', enterprise: 'Chuyên sâu + Custom' },
  { feature: 'Báo cáo khoảng trống kỹ năng (Skill Gap)', basic: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Xem báo cáo AI Voice Mock Interview', basic: '❌', pro: '❌', enterprise: '✅' },
  { feature: 'Export Báo Cáo Ứng Viên (PDF / Excel)', basic: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Phễu quản lý Kanban kéo thả', basic: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Badge Doanh Nghiệp Xác Thực', basic: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Kênh Hỗ Trợ Kỹ Thuật SLA', basic: 'Email (48h)', pro: 'Hotline/Chat (24/7)', enterprise: 'Account Manager 1-on-1' },
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

const getRecruiterPlanTier = (planId) => {
  if (!planId) return 0;
  const id = planId.toUpperCase();
  if (id.includes('ENTERPRISE') || id.includes('VIP') || id.includes('ELITE')) return 2;
  if (id.includes('PROFESSIONAL') || id.includes('PRO') || id.includes('HIRING')) return 1;
  return 0; // BASIC / STARTER
};

export default function RecruiterPricingPage({ user, onNavigate }) {
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // 'MONTHLY' | 'YEARLY'
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);
  const [selectedAddonForPurchase, setSelectedAddonForPurchase] = useState(null);
  const [promoCode, setPromoCode] = useState('');
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
  
  // Current active plan simulation
  const [activePlan, setActivePlan] = useState('BASIC');
  const [userCredits, setUserCredits] = useState(42);
  const [userActiveJobsCount, setUserActiveJobsCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState([]);

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

  const fetchMySubscription = () => {
    paymentApi.getMySubscription()
      .then(res => {
        const sub = res.data?.data || res.data;
        if (sub && sub.active) {
          const pName = (sub.planName || '').toLowerCase();
          if (pName.includes('enterprise') || pName.includes('elite') || pName.includes('vip')) {
            setActivePlan('ENTERPRISE');
            setUserCredits(3000);
            setUserActiveJobsCount(99);
          } else if (pName.includes('pro') || pName.includes('professional') || pName.includes('hiring')) {
            setActivePlan('PROFESSIONAL');
            setUserCredits(sub.quotaLimit || 500);
            setUserActiveJobsCount(15);
          } else {
            setActivePlan('BASIC');
            setUserCredits(50);
            setUserActiveJobsCount(3);
          }
        }
      })
      .catch(err => console.warn('Could not load recruiter active subscription', err));
  };

  const fetchMyPendingOrders = () => {
    paymentApi.getMyOrders()
      .then(res => {
        const orders = res.data?.data || res.data || [];
        if (Array.isArray(orders)) {
          const pendings = orders.filter(o => o.status === 'PENDING');
          setPendingOrders(pendings);
        }
      })
      .catch(err => console.warn('Could not load recruiter orders', err));
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
        ? selectedPlanForPurchase.yearlyPrice * 12 
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
        ? selectedPlanForPurchase.yearlyPrice * 12 
        : selectedPlanForPurchase.monthlyPrice;
      planName = selectedPlanForPurchase.name;
    } else if (selectedAddonForPurchase) {
      basePrice = selectedAddonForPurchase.price;
      planName = selectedAddonForPurchase.name;
    }

    const finalPrice = calculateFinalPrice();

    const matchedPlan = dbPlans.find(p => 
      p.planName.toLowerCase().includes(planName.toLowerCase()) || 
      planName.toLowerCase().includes(p.planName.toLowerCase())
    );

    const payload = {
      userId: user?.id || user?.userId || null,
      userEmail: user?.email || null,
      planId: matchedPlan?.planId || null,
      planName: planName,
      targetRole: 'RECRUITER',
      billingCycle: billingCycle,
      paymentMethod: paymentMethod,
      voucherCode: appliedDiscount > 0 ? promoCode.trim().toUpperCase() : null,
      originalAmount: basePrice,
      discountAmount: voucherDiscountAmount,
      amount: finalPrice,
      orderNote: `Doanh nghiệp đăng ký ${planName} (${billingCycle === 'YEARLY' ? '12 Tháng' : '1 Tháng'}) - ${paymentMethod}`
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
        ? selectedPlanForPurchase.yearlyPrice * 12 
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

  // Đồng bộ động các gói và giá từ CSDL Supabase (khi Admin chỉnh sửa giá / hạn mức)
  const plansToDisplay = RECRUITER_SUBSCRIPTION_PLANS.map((plan) => {
    const matched = dbPlans.find((db) => {
      const pName = plan.name.toLowerCase();
      const dbName = (db.planName || '').toLowerCase();
      return (
        (dbName.includes('starter') && pName.includes('starter')) ||
        (dbName.includes('pro') && pName.includes('pro')) ||
        (dbName.includes('enterprise') && pName.includes('enterprise')) ||
        (dbName.includes('vip') && pName.includes('vip'))
      );
    });
    if (matched) {
      const dbMonthly = Number(matched.price) || 0;
      const dbYearly = Math.round(dbMonthly * 0.8); // 20% discount on yearly
      return {
        ...plan,
        dbPlanId: matched.planId,
        monthlyPrice: dbMonthly,
        yearlyPrice: dbYearly,
        quotaLimit: matched.quotaLimit,
        durationDays: matched.durationDays,
      };
    }
    return plan;
  });

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
                  {activePlan === 'BASIC' ? 'Basic (Starter)' : activePlan === 'PROFESSIONAL' ? 'Pro AI (Tiêu Chuẩn)' : 'Enterprise VIP'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                  ACTIVE
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Credits AI Soi CV:</span>
                <span className="font-extrabold text-amber-300 text-sm">{userCredits} Lượt</span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Tin Đang Đăng:</span>
                <span className="font-extrabold text-white">{userActiveJobsCount} / {activePlan === 'BASIC' ? '3' : activePlan === 'PROFESSIONAL' ? '15' : '∞'} Tin</span>
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
            {billingCycle === 'YEARLY' ? '🎉 Bạn đang được áp dụng ưu đãi Giảm 20% khi chọn chu kỳ 1 Năm!' : '💡 Đổi sang Thanh Toán Theo Năm để tiết kiệm lên đến 11,970,000 VNĐ!'}
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plansToDisplay.map((plan) => {
            const currentTier = getRecruiterPlanTier(activePlan);
            const planTier = getRecruiterPlanTier(plan.id);
            const isSelected = activePlan === plan.id;
            const isLowerTier = !isSelected && planTier < currentTier;
            const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

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

                  <div className="py-2 border-y border-slate-100">
                    {plan.monthlyPrice === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-[#1e1b4b]">0 VNĐ</span>
                        <span className="text-xs text-slate-400 font-medium">/ tháng</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-[#32247b]">
                            {formatVND(price).replace(' VNĐ', '')}
                          </span>
                          <span className="text-xs font-bold text-[#32247b]">VNĐ</span>
                          <span className="text-xs text-slate-400 font-medium">/ tháng</span>
                        </div>
                        {billingCycle === 'YEARLY' && (
                          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                            Thanh toán {formatVND(price * 12)} / năm
                          </span>
                        )}
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
                  <th className="py-4 px-4 text-center">Gói Basic (Free)</th>
                  <th className="py-4 px-4 text-center text-[#32247b]">Gói Pro AI (1.99M)</th>
                  <th className="py-4 px-4 text-center text-purple-700">Gói Enterprise (4.99M)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1e1b4b]">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center">{row.basic}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#32247b] bg-indigo-50/20">{row.pro}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/20">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
          <div className="bg-white w-full max-w-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-indigo-100 relative space-y-6 max-h-[90vh] overflow-y-auto">
            
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
                        {billingCycle === 'YEARLY' ? '12 Tháng (Giảm 20%)' : '1 Tháng'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-indigo-100">
                    <span>Đơn giá niêm yết:</span>
                    <span className="font-bold">
                      {selectedPlanForPurchase
                        ? formatVND(billingCycle === 'YEARLY' ? selectedPlanForPurchase.yearlyPrice * 12 : selectedPlanForPurchase.monthlyPrice)
                        : formatVND(selectedAddonForPurchase?.price || 0)}
                    </span>
                  </div>
                  {voucherDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-bold">
                      <span>Giảm giá Voucher ({appliedDiscount}%):</span>
                      <span>-{formatVND(voucherDiscountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mã Giảm Giá / Ưu Đãi Doanh Nghiệp (PostgreSQL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Nhập mã (VD: HIREMATE30, HIREMATE20)"
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#32247b] focus:ring-1 focus:ring-[#32247b] uppercase font-mono font-bold"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={validatingVoucher}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {validatingVoucher ? (
                        <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-xs">local_activity</span>
                      )}
                      <span>Áp Dụng</span>
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-[11px] font-semibold flex items-center gap-1 ${voucherDiscountAmount > 0 || appliedDiscount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-sm">
                        {voucherDiscountAmount > 0 || appliedDiscount > 0 ? 'check_circle' : 'error'}
                      </span>
                      <span>{promoMessage}</span>
                    </p>
                  )}
                </div>

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
                    className="px-6 py-3.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        <span>Đang Tạo Đơn Hàng...</span>
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
                    src={createdOrder.qrCodeUrl || `https://img.vietqr.io/image/mbbank-0987654321-compact2.png?amount=${createdOrder.amount}&addInfo=${createdOrder.orderCode}&accountName=HIREMATE%20AI`}
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
                    <span className="font-bold text-slate-800">{createdOrder.bankName || 'MBBank'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#32247b]">{createdOrder.bankAccount || '0987654321'}</span>
                      <button
                        onClick={() => handleCopy(createdOrder.bankAccount || '0987654321', 'Số tài khoản')}
                        className="px-2 py-0.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-[#32247b] text-[10px] font-bold cursor-pointer"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">{createdOrder.accountHolder || 'HIREMATE AI TECH'}</span>
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
