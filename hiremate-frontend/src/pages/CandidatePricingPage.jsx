import React, { useState } from 'react';

const CANDIDATE_SUBSCRIPTION_PLANS = [
  {
    id: 'CANDIDATE_FREE',
    name: 'Ứng Viên Khởi Tạo (Starter)',
    tagline: 'Trải nghiệm tính năng tìm việc, soi điểm ATS & phỏng vấn thử bằng AI cơ bản.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badgeText: 'MIỄN PHÍ VĨNH VIỄN',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    buttonText: 'Gói Mặc Định Hiện Tại',
    isPopular: false,
    isCurrent: true,
    features: [
      { text: 'Ứng tuyển không giới hạn vào tất cả việc làm', highlight: true },
      { text: '3 Lượt phỏng vấn giả lập AI Voice / tháng', highlight: false },
      { text: '3 Lượt bóc tách CV & Soi điểm ATS score', highlight: false },
      { text: 'Báo cáo điểm AI Matching 70/30 cho từng vị trí', highlight: false },
      { text: 'Lưu trữ tối đa 2 bản CV trên hệ thống', highlight: false },
    ],
    missingFeatures: [
      '30+ Lượt phỏng vấn thử AI Voice / tháng',
      'Báo cáo Lộ trình tiến bộ (Improvement Delta %)',
      'Barem đáp án mẫu & Gợi ý cải thiện từ AI',
      'Huy hiệu Ứng Viên Nổi Bật (Featured Candidate)',
      'Tự động gửi thông báo việc làm khớp 95%+ tức thì',
    ]
  },
  {
    id: 'CANDIDATE_PRO',
    name: 'Ứng Viên Pro AI',
    tagline: 'Luyện phỏng vấn AI tự tin, tối ưu CV chuẩn ATS & nổi bật trước Nhà tuyển dụng.',
    monthlyPrice: 199000,
    yearlyPrice: 132500, // ~33% off
    badgeText: 'KHUYÊN DÙNG 🔥',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    buttonText: 'Nâng Cấp Pro AI',
    isPopular: true,
    isCurrent: false,
    features: [
      { text: '30 Lượt phỏng vấn giả lập AI Voice / tháng', highlight: true },
      { text: 'Phân tích tốc độ nói WPM & Độ rõ chữ (Clarity)', highlight: true },
      { text: 'Barem đáp án mẫu AI & Gợi ý sửa câu trả lời', highlight: true },
      { text: 'KHÔNG GIỚI HẠN Tối ưu CV & Kiểm tra ATS Score', highlight: true },
      { text: 'Báo cáo Lộ Trình Tiến Bộ (Improvement Delta %)', highlight: false },
      { text: 'Huy hiệu Ứng Viên Nổi Bật (Featured Candidate)', highlight: true },
      { text: 'Gợi ý câu hỏi phỏng vấn bám sát 100% JD thực tế', highlight: false },
      { text: 'Lưu trữ không giới hạn bản CV', highlight: false },
    ],
    missingFeatures: [
      'KHÔNG GIỚI HẠN lượt phỏng vấn thử AI',
      'Huy hiệu Top 1% Qualified Candidate VIP',
      'Hỗ trợ Review CV 1-on-1 từ Chuyên gia HR',
    ]
  },
  {
    id: 'CANDIDATE_VIP',
    name: 'Career Mastery VIP 👑',
    tagline: 'Gói cao cấp nhất dành cho nhân sự muốn chinh phục công ty toàn cầu & lương Top 5%.',
    monthlyPrice: 499000,
    yearlyPrice: 332500, // ~33% off
    badgeText: 'CAHO CẤP & VIP 👑',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    buttonText: 'Mua Gói VIP Mastery',
    isPopular: false,
    isCurrent: false,
    features: [
      { text: 'KHÔNG GIỚI HẠN lượt AI Voice Mock Interview', highlight: true },
      { text: 'AI Career Coach tư vấn chiến lược trả lời phỏng vấn', highlight: true },
      { text: 'Huy hiệu Top 1% Qualified Candidate VIP Badge', highlight: true },
      { text: 'Tự động đề xuất CV tới Top 50 Doanh nghiệp lớn', highlight: true },
      { text: 'Thông báo việc làm khớp 95%+ qua Email/Zalo tức thì', highlight: false },
      { text: 'Hỗ trợ Review CV 1-on-1 với Chuyên gia HR HireMate', highlight: true },
      { text: 'Ưu tiên hỗ trợ kỹ thuật 24/7', highlight: false },
    ],
    missingFeatures: []
  }
];

const CANDIDATE_ADDONS = [
  {
    id: 'MOCK_PASS_10',
    name: '+10 Lượt AI Mock Interview',
    desc: 'Thêm 10 lượt phỏng vấn giả lập giọng nói trong AI Practice Studio.',
    price: 50000,
    badge: 'Phổ biến',
    icon: 'psychology',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'FEATURED_CANDIDATE',
    name: 'Huy Hiệu Ứng Viên Nổi Bật',
    desc: 'Gắn badge Featured Candidate 30 ngày, ưu tiên hiển thị TOP 1 cho HR.',
    price: 99000,
    badge: 'Tăng 400% tương tác',
    icon: 'workspace_premium',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'CV_REWRITE',
    name: 'AI CV Rewrite & ATS Pass',
    desc: 'AI tự động viết lại CV chuẩn thuật ngữ ngành & đảm bảo vượt ATS 95%+.',
    price: 149000,
    badge: 'Đảm bảo đậu ATS',
    icon: 'auto_fix_high',
    color: 'from-emerald-500 to-teal-600'
  }
];

const COMPARISON_ROWS = [
  { feature: 'Số lượt AI Voice Mock Interview / tháng', free: '3 Lượt', pro: '30 Lượt', vip: 'Không giới hạn' },
  { feature: 'Lượt soi CV & ATS Score Check', free: '3 Lượt', pro: 'Không giới hạn', vip: 'Không giới hạn' },
  { feature: 'Phân tích WPM & Độ rõ chữ giọng nói', free: 'Cơ bản', pro: 'Chi tiết', vip: 'Chuyên sâu Executive' },
  { feature: 'Barem đáp án mẫu & Gợi ý câu trả lời AI', free: '❌ KHÔNG', pro: '✅ CÓ', vip: '✅ CÓ (Chuyên sâu)' },
  { feature: 'Báo cáo Lộ Trình Tiến Bộ (Improvement Delta)', free: '❌ KHÔNG', pro: '✅ CÓ', vip: '✅ CÓ' },
  { feature: 'Huy hiệu Ứng Viên Nổi Bật cho HR', free: '❌ KHÔNG', pro: '✅ Pro Badge', vip: '✅ Top 1% VIP Badge' },
  { feature: 'Gợi ý JD phù hợp khớp 95%+', free: 'Hàng tuần', pro: 'Hàng ngày', vip: 'Tức thì (Real-time)' },
  { feature: 'Hỗ trợ Review CV 1-on-1 từ HR Expert', free: '❌ KHÔNG', pro: '❌ KHÔNG', vip: '✅ CÓ (1-on-1)' },
];

const CANDIDATE_FAQS = [
  {
    q: 'Tính năng AI Voice Mock Interview hoạt động như thế nào?',
    a: 'AI Studio phát âm câu hỏi bằng giọng đọc tự nhiên, ghi âm câu trả lời bằng giọng nói của bạn, chuyển sang văn bản (STT), phân tích tốc độ nói (WPM), độ rõ chữ và đối chiếu với barem đáp án chuyên môn để cho điểm và nhận xét chi tiết.'
  },
  {
    q: 'Huy hiệu Featured Candidate giúp ích gì cho tôi khi tìm việc?',
    a: 'Hồ sơ của bạn sẽ được gắn huy hiệu nổi bật màu vàng tím và ưu tiên đẩy lên vị trí trên cùng trong danh sách ứng viên mà Nhà tuyển dụng xem xét, tăng gấp 4 lần cơ hội được gọi phỏng vấn.'
  },
  {
    q: 'Tôi có thể hủy hoặc đổi gói cước bất kỳ lúc nào không?',
    a: 'Có. Bạn có thể tự do nâng cấp gói cước bất cứ lúc nào. Thời hạn còn lại của gói cũ sẽ được quy đổi và khấu trừ trực tiếp vào đơn hàng mới.'
  }
];

export default function CandidatePricingPage({ user, onNavigate }) {
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // 'MONTHLY' | 'YEARLY'
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);
  const [selectedAddonForPurchase, setSelectedAddonForPurchase] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Simulated Candidate active subscription state
  const [activePlan, setActivePlan] = useState('CANDIDATE_FREE');
  const [mockInterviewPasses, setMockInterviewPasses] = useState(3);
  const [atsCheckPasses, setAtsCheckPasses] = useState(3);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'CANDIDATE20' || promoCode.trim().toUpperCase() === 'SWP391') {
      setAppliedDiscount(20);
      setPromoMessage('Đã áp dụng mã giảm giá 20% dành cho Ứng viên! 🎉');
    } else if (promoCode.trim().toUpperCase() === 'STUDENT50') {
      setAppliedDiscount(30);
      setPromoMessage('Đã áp dụng ưu đãi Sinh viên giảm 30%! 🎓');
    } else {
      setAppliedDiscount(0);
      setPromoMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleOpenPlanModal = (plan) => {
    if (plan.id === activePlan) return;
    setSelectedPlanForPurchase(plan);
    setSelectedAddonForPurchase(null);
    setPromoCode('');
    setAppliedDiscount(0);
    setPromoMessage('');
    setPurchaseSuccess(false);
  };

  const handleOpenAddonModal = (addon) => {
    setSelectedAddonForPurchase(addon);
    setSelectedPlanForPurchase(null);
    setPromoCode('');
    setAppliedDiscount(0);
    setPromoMessage('');
    setPurchaseSuccess(false);
  };

  const handleConfirmPurchase = () => {
    setIsProcessingCheckout(true);
    setTimeout(() => {
      setIsProcessingCheckout(false);
      setPurchaseSuccess(true);
      if (selectedPlanForPurchase) {
        setActivePlan(selectedPlanForPurchase.id);
        if (selectedPlanForPurchase.id === 'CANDIDATE_PRO') {
          setMockInterviewPasses(30);
          setAtsCheckPasses(999);
        }
        if (selectedPlanForPurchase.id === 'CANDIDATE_VIP') {
          setMockInterviewPasses(9999);
          setAtsCheckPasses(9999);
        }
      } else if (selectedAddonForPurchase) {
        if (selectedAddonForPurchase.id === 'MOCK_PASS_10') {
          setMockInterviewPasses(prev => prev + 10);
        }
      }
    }, 1200);
  };

  const formatVND = (amount) => {
    if (amount === 0) return '0 VNĐ';
    return amount.toLocaleString('vi-VN') + ' VNĐ';
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

    if (appliedDiscount > 0) {
      basePrice = basePrice * (1 - appliedDiscount / 100);
    }
    return basePrice;
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1e1b4b] py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HERO BANNER FOR CANDIDATES */}
        <div className="bg-gradient-to-r from-[#2d1b69] via-[#432b96] to-[#6d44e4] text-white rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-purple-400/30">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-base text-amber-400">psychology</span>
              <span>Gói Dịch Vụ Dành Cho Ứng Viên</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Tự Tin Phỏng Vấn &amp; Chinh Phục Công Việc Mơ Ước Với <span className="text-amber-300">AI Coaching</span>
            </h1>

            <p className="text-purple-100 text-sm sm:text-base leading-relaxed font-sans">
              Luyện phỏng vấn thử bằng giọng nói AI, tối ưu hóa CV chuẩn ATS 95%+ và nổi bật nổi trội trong mắt Nhà tuyển dụng.
            </p>

            {/* Current Candidate Status Badge */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Gói Hiện Tại:</span>
                <span className="font-bold text-white uppercase tracking-wide">
                  {activePlan === 'CANDIDATE_FREE' ? 'Ứng Viên Starter (Free)' : activePlan === 'CANDIDATE_PRO' ? 'Ứng Viên Pro AI' : 'Career Mastery VIP'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                  ACTIVE
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Lượt AI Voice Mock:</span>
                <span className="font-extrabold text-amber-300 text-sm">
                  {mockInterviewPasses >= 999 ? 'KHÔNG GIỚI HẠN' : `${mockInterviewPasses} Lượt`}
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <span className="text-purple-200">Lượt Soi CV ATS:</span>
                <span className="font-extrabold text-emerald-300 text-sm">
                  {atsCheckPasses >= 999 ? 'KHÔNG GIỚI HẠN' : `${atsCheckPasses} Lượt`}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                Tiết Kiệm 33%
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {billingCycle === 'YEARLY' ? '🎉 Giảm ngay 33% chi phí khi đăng ký chu kỳ 1 Năm!' : '💡 Đổi sang Thanh Toán Theo Năm để tiết kiệm tới 1,998,000 VNĐ!'}
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {CANDIDATE_SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = activePlan === plan.id;
            const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-[32px] bg-white p-8 flex flex-col justify-between transition-all duration-300 border ${
                  plan.isPopular
                    ? 'border-[#5b46e0] shadow-[0_20px_50px_rgba(91,70,224,0.18)] ring-2 ring-[#5b46e0]/20 scale-102'
                    : isSelected
                    ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200'
                }`}
              >
                {/* Popular or Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${plan.badgeColor}`}>
                    {plan.badgeText}
                  </span>

                  {isSelected && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold border border-emerald-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                      <span>ĐANG SỬ DỤNG</span>
                    </span>
                  )}
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
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quyền Lợi Ứng Viên:</p>
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
                    disabled={isSelected}
                    className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : plan.isPopular
                        ? 'bg-[#10b981] hover:bg-[#059669] text-white hover:scale-102 shadow-emerald-500/25'
                        : 'bg-[#32247b] hover:bg-[#4331a6] text-white hover:scale-102'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">shopping_cart</span>
                    <span>{isSelected ? 'Gói Bạn Đang Dùng' : plan.buttonText}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD-ON PACKAGES SECTION FOR CANDIDATES */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#32247b] text-2xl">add_task</span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b4b]">
                  Gói Mua Lẻ Lượt Phỏng Vấn &amp; Nổi Bật CV (Add-ons)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mua thêm lượt phỏng vấn thử hoặc làm nổi bật hồ sơ ứng tuyển ngắn hạn.
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-purple-50 text-[#32247b] text-xs font-bold border border-purple-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm font-bold">bolt</span>
              <span>Kích hoạt tức thì</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {CANDIDATE_ADDONS.map((addon) => (
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
                    className="px-3.5 py-1.5 rounded-xl bg-[#32247b] hover:bg-[#10b981] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
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
              Bảng So Sánh Quyền Lợi Gói Ứng Viên
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Đối chiếu chi tiết quyền lợi luyện phỏng vấn AI và hỗ trợ xin việc.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs text-slate-600 uppercase font-extrabold bg-slate-50/80">
                  <th className="py-4 px-4">Tính Năng / Quyền Lợi</th>
                  <th className="py-4 px-4 text-center">Gói Starter (Free)</th>
                  <th className="py-4 px-4 text-center text-[#32247b]">Gói Pro AI (199K)</th>
                  <th className="py-4 px-4 text-center text-purple-700">Career VIP (499K)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1e1b4b]">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center">{row.free}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#32247b] bg-indigo-50/20">{row.pro}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/20">{row.vip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[#1e1b4b]">Câu Hỏi Thường Gặp (Candidate FAQs)</h2>
            <p className="text-xs text-slate-500">
              Giải đáp thắc mắc về tính năng phỏng vấn giả lập AI và huy hiệu nổi bật CV.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {CANDIDATE_FAQS.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4.5 bg-slate-50/60 hover:bg-slate-100 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#1e1b4b] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-4.5 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CHECKOUT MODAL FOR CANDIDATES */}
      {(selectedPlanForPurchase || selectedAddonForPurchase) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-indigo-100 relative space-y-6 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => {
                setSelectedPlanForPurchase(null);
                setSelectedAddonForPurchase(null);
              }}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              &times;
            </button>

            {!purchaseSuccess ? (
              <>
                <div className="space-y-1 pr-8">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-[#32247b] text-[10px] font-extrabold uppercase tracking-wider">
                    Xác Nhận Đơn Hàng Ứng Viên
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#1e1b4b]">
                    {selectedPlanForPurchase ? `Đăng Ký ${selectedPlanForPurchase.name}` : `Mua ${selectedAddonForPurchase?.name}`}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-[#1e1b4b]">
                    <span>Gói đăng ký:</span>
                    <span>{selectedPlanForPurchase?.name || selectedAddonForPurchase?.name}</span>
                  </div>
                  {selectedPlanForPurchase && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Chu kỳ thanh toán:</span>
                      <span className="font-semibold text-emerald-600">
                        {billingCycle === 'YEARLY' ? '12 Tháng (Giảm 33%)' : '1 Tháng'}
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
                </div>

                {/* Promo Code Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Mã Giảm Giá / Ưu Đãi Sinh Viên:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Nhập mã (VD: CANDIDATE20 hoặc STUDENT50)"
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#32247b] uppercase font-mono font-bold"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      Áp Dụng
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-[11px] font-semibold ${appliedDiscount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Phương thức thanh toán:</label>
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
                        <span>Đang Xử Lý...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">verified</span>
                        <span>Thanh Toán &amp; Kích Hoạt</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-[#1e1b4b]">
                    Kích Hoạt Gói Thành Công! 🎉
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Tài khoản Ứng viên của bạn đã được cộng thêm lượt phỏng vấn thử AI và kích hoạt đầy đủ đặc quyền mới.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
                  <p><strong>Mã giao dịch:</strong> CAND-PAY-#{Math.floor(100000 + Math.random() * 900000)}</p>
                  <p><strong>Gói dịch vụ:</strong> {selectedPlanForPurchase?.name || selectedAddonForPurchase?.name}</p>
                  <p><strong>Trạng thái:</strong> Đã kích hoạt (Active)</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanForPurchase(null);
                    setSelectedAddonForPurchase(null);
                    if (onNavigate) onNavigate('#/ai-interview');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#32247b] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#4331a6] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">psychology</span>
                  <span>Vào AI Practice Studio Luyện Tập Ngay</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
