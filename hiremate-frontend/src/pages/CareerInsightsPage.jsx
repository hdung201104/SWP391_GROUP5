import React, { useState } from 'react';

export default function CareerInsightsPage({ user }) {
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('SENIOR');
  const [currency, setCurrency] = useState('VND'); // 'VND' | 'USD'

  const salaryData = {
    FRONTEND: {
      title: 'Frontend Engineer (React / Next.js / TypeScript)',
      icon: 'code',
      fresher: { vnd: '12 - 18 triệu', usd: '$500 - $800' },
      junior: { vnd: '18 - 28 triệu', usd: '$800 - $1,200' },
      senior: { vnd: '45 - 80 triệu', usd: '$1,800 - $3,500' },
      lead: { vnd: '80 - 130 triệu', usd: '$3,500 - $5,500' },
      demandTrend: '+34.5%',
      topSkills: ['React 19 & Next.js 15', 'TypeScript Strict Mode', 'Web Vitals & Performance', 'Micro-frontends & Module Fed'],
      brief: 'Thị trường đòi hỏi Senior Frontend không chỉ xây dựng component mà còn làm chủ SSR Hydration, Fiber internals và tối ưu INP/CLS.',
    },
    BACKEND: {
      title: 'Backend Engineer (Java / Go / Distributed Systems)',
      icon: 'dns',
      fresher: { vnd: '14 - 20 triệu', usd: '$600 - $900' },
      junior: { vnd: '22 - 35 triệu', usd: '$900 - $1,500' },
      senior: { vnd: '50 - 90 triệu', usd: '$2,000 - $4,000' },
      lead: { vnd: '90 - 150 triệu', usd: '$4,000 - $6,500' },
      demandTrend: '+41.2%',
      topSkills: ['Java 21 Spring Boot 3', 'Golang Microservices', 'Kafka Event Streaming', 'PostgreSQL & Redis Caching'],
      brief: 'Làn sóng hiện đại hóa ngân hàng và Fintech đẩy mạnh nhu cầu kiến trúc Microservices chịu tải cao, High Availability 99.99%.',
    },
    AI_DATA: {
      title: 'AI & LLM Engineer (RAG / Agentic / PyTorch)',
      icon: 'psychology',
      fresher: { vnd: '18 - 25 triệu', usd: '$800 - $1,100' },
      junior: { vnd: '30 - 45 triệu', usd: '$1,300 - $2,000' },
      senior: { vnd: '65 - 120 triệu', usd: '$2,800 - $5,000' },
      lead: { vnd: '120 - 220 triệu', usd: '$5,000 - $9,000' },
      demandTrend: '+128.4%',
      topSkills: ['LangChain / LlamaIndex', 'Vector Databases (Milvus/Pinecone)', 'Fine-tuning & LoRA', 'AI Agent Orchestration'],
      brief: 'Lĩnh vực tăng trưởng bùng nổ nhất năm 2026. Doanh nghiệp sẵn sàng trả mức lương kỷ lục cho kỹ sư tích hợp GenAI thực chiến.',
    },
    DEVOPS: {
      title: 'DevOps & Cloud Platform Engineer (AWS / K8s)',
      icon: 'cloud_sync',
      fresher: { vnd: '15 - 22 triệu', usd: '$650 - $950' },
      junior: { vnd: '25 - 38 triệu', usd: '$1,100 - $1,600' },
      senior: { vnd: '55 - 95 triệu', usd: '$2,200 - $4,200' },
      lead: { vnd: '95 - 160 triệu', usd: '$4,200 - $7,000' },
      demandTrend: '+29.8%',
      topSkills: ['Kubernetes & EKS/GKE', 'Terraform (IaC)', 'CI/CD Pipelines (GitLab/ArgoCD)', 'Prometheus & Grafana Observability'],
      brief: 'Nhu cầu xây dựng nền tảng hạ tầng tự động hóa và quản trị chi phí Cloud FinOps đang được các tập đoàn ưu tiên hàng đầu.',
    },
  };

  const trendingSkills = [
    { name: 'AI Agents & LangChain', category: 'GenAI Core', growth: '+142%', demand: 'Rất Cao', badge: 'bg-botanical-terracotta/15 text-botanical-terracotta border-botanical-terracotta/30' },
    { name: 'React 19 & Next.js App Router', category: 'Frontend', growth: '+38%', demand: 'Cao', badge: 'bg-botanical-sage/20 text-botanical-forest border-botanical-sage/30' },
    { name: 'Golang Distributed Systems', category: 'Backend', growth: '+49%', demand: 'Cao', badge: 'bg-botanical-clay/25 text-botanical-forest border-botanical-stone' },
    { name: 'Kubernetes Platform Engineering', category: 'DevOps', growth: '+31%', demand: 'Ổn Định', badge: 'bg-botanical-sage/20 text-botanical-forest border-botanical-sage/30' },
    { name: 'Vector DB (Milvus, Qdrant)', category: 'Data & AI', growth: '+95%', demand: 'Rất Cao', badge: 'bg-botanical-terracotta/15 text-botanical-terracotta border-botanical-terracotta/30' },
    { name: 'Event-driven Kafka Architecture', category: 'Enterprise', growth: '+44%', demand: 'Cao', badge: 'bg-botanical-clay/25 text-botanical-forest border-botanical-stone' },
  ];

  const techLeadAdvice = [
    {
      title: 'Bí quyết deal lương Senior: Dẫn chứng số liệu kinh doanh định lượng',
      author: 'Synthia AI • Tech Lead Evaluator',
      tag: 'Chiến Lược Phỏng Vấn',
      summary: 'Thay vì chỉ nói "tôi đã tối ưu trang web", hãy nói "tôi áp dụng code-splitting và selective hydration giúp giảm INP từ 450ms xuống 80ms, tăng 14% conversion checkout".',
    },
    {
      title: 'Xu hướng Micro-frontends 2026: Tránh cạm bẫy Shared State',
      author: 'Synthia AI Playbook',
      tag: 'Kiến Trúc Hệ Thống',
      summary: 'Không lạm dụng window global state giữa các host/remote apps. Dùng Module Federation shared scope kết hợp typed contract event bus.',
    },
    {
      title: 'Chuẩn bị vòng phỏng vấn System Design cho ứng viên Backend',
      author: 'FPT Software & Fintech Benchmark',
      tag: 'System Design',
      summary: 'Nắm chắc mẫu hình Idempotent API, Distributed Lock qua Redis/Redlock và chiến lược Retry backoff với Dead Letter Queue.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-transparent text-botanical-forest font-sans pb-20">
      {/* Top Banner / Market Telemetry Header */}
      <div className="w-full py-10 px-4 sm:px-6 lg:px-8 border-b border-botanical-stone/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-sans font-medium bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/40 flex items-center gap-2 shadow-soft">
                <span className="w-2 h-2 rounded-full bg-botanical-sage animate-pulse"></span>
                LIVE MARKET TELEMETRY • Q3/2026
              </span>
              <span className="text-xs text-botanical-forest/60 font-sans">12,450 Verified Data Points</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-botanical-forest">
              Bảng Tin Nghề Nghiệp &amp; <span className="italic text-botanical-terracotta">Xu Hướng Thị Trường</span>
            </h1>
            <p className="text-xs sm:text-sm text-botanical-forest/75 max-w-2xl leading-relaxed font-sans">
              Dữ liệu mức lương thị trường, kỹ năng được săn đón nhất và phân tích độc quyền từ mô hình AI của HireMate Studio giúp bạn định vị sự nghiệp chuẩn xác.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-white/90 rounded-full border border-botanical-stone font-sans text-xs shadow-soft">
              <button
                onClick={() => setCurrency('VND')}
                className={`px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
                  currency === 'VND' 
                    ? 'bg-botanical-forest text-white shadow-soft font-bold' 
                    : 'text-botanical-forest/70 hover:text-botanical-forest'
                }`}
              >
                VNĐ (Triệu)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
                  currency === 'USD' 
                    ? 'bg-botanical-forest text-white shadow-soft font-bold' 
                    : 'text-botanical-forest/70 hover:text-botanical-forest'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* ======================================================== */}
        {/* SECTION 1: SALARY BENCHMARK MATRIX                       */}
        {/* ======================================================== */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-botanical-stone">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-botanical-sage/20 border border-botanical-stone text-botanical-forest flex items-center justify-center shrink-0 shadow-soft">
                <span className="material-symbols-outlined text-xl">payments</span>
              </span>
              <div>
                <h2 className="text-xl font-serif font-bold text-botanical-forest">Khảo Sát Mức Lương Theo Vị Trí &amp; Cấp Bậc</h2>
                <p className="text-xs text-botanical-forest/60 font-sans">Tổng hợp từ hơn 850 doanh nghiệp tuyển dụng công nghệ và tài chính tại Việt Nam</p>
              </div>
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-white/90 rounded-full border border-botanical-stone font-sans text-xs overflow-x-auto shadow-soft">
              {['FRESHER', 'JUNIOR', 'SENIOR', 'LEAD'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-botanical-forest text-white shadow-soft font-bold'
                      : 'text-botanical-forest/70 hover:text-botanical-forest'
                  }`}
                >
                  {lvl === 'FRESHER' ? 'Fresher (0-1 năm)' : lvl === 'JUNIOR' ? 'Junior / Mid (1-3 năm)' : lvl === 'SENIOR' ? 'Senior (3-6 năm)' : 'Principal / Lead (>6 năm)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(salaryData).map(([key, data]) => {
              const salaryVal = selectedLevel === 'FRESHER'
                ? (currency === 'VND' ? data.fresher.vnd : data.fresher.usd)
                : selectedLevel === 'JUNIOR'
                  ? (currency === 'VND' ? data.junior.vnd : data.junior.usd)
                  : selectedLevel === 'SENIOR'
                    ? (currency === 'VND' ? data.senior.vnd : data.senior.usd)
                    : (currency === 'VND' ? data.lead.vnd : data.lead.usd);

              return (
                <div
                  key={key}
                  className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-6 hover:shadow-soft-lg transition-all flex flex-col justify-between shadow-soft relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-botanical-sage/15 border border-botanical-stone flex items-center justify-center text-botanical-forest shadow-soft">
                        <span className="material-symbols-outlined text-xl">{data.icon}</span>
                      </div>
                      <span className="text-xs font-sans font-semibold text-botanical-forest bg-botanical-sage/20 px-3 py-1 rounded-full border border-botanical-sage/30 flex items-center gap-1 shadow-soft">
                        <span className="material-symbols-outlined text-xs text-botanical-sage">trending_up</span>
                        {data.demandTrend}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-botanical-forest leading-snug mb-2">{data.title}</h3>
                    <p className="text-xs text-botanical-forest/70 font-sans leading-relaxed mb-4">{data.brief}</p>

                    <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-botanical-stone mb-4">
                      <span className="text-[11px] font-sans font-bold uppercase text-botanical-forest/60 tracking-wider block mb-1">
                        Mức Lương Đề Xuất ({selectedLevel})
                      </span>
                      <span className="text-2xl font-serif font-bold text-botanical-terracotta">
                        {salaryVal}
                      </span>
                      <span className="text-[11px] text-botanical-forest/60 block mt-0.5">/ tháng net</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-sans font-bold uppercase text-botanical-forest tracking-wider block">Kỹ năng chìa khóa:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.topSkills.map((sk, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-botanical-cream text-botanical-forest border border-botanical-stone">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { window.location.hash = '#/'; }}
                    className="btn-botanical-secondary !text-xs !py-2.5 !w-full !rounded-full mt-6 flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
                  >
                    <span>Xem việc làm phù hợp</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: TOP TRENDING TECH & SKILLS RADAR             */}
        {/* ======================================================== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-botanical-stone">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-botanical-sage/20 border border-botanical-stone text-botanical-forest flex items-center justify-center shadow-soft">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </span>
              <div>
                <h2 className="text-xl font-serif font-bold text-botanical-forest">Top 6 Kỹ Năng Tăng Trưởng Nhanh Nhất (Q3/2026)</h2>
                <p className="text-xs text-botanical-forest/60 font-sans">Tỷ lệ tăng trưởng lượng tuyển dụng yêu cầu trong JD so với cùng kỳ</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trendingSkills.map((item, idx) => (
              <div
                key={idx}
                className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-5 hover:shadow-soft-lg transition-all flex items-center justify-between shadow-soft"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-botanical-cream border border-botanical-stone flex items-center justify-center font-serif font-bold text-base text-botanical-forest shadow-soft">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-botanical-forest">{item.name}</h4>
                    <span className="text-xs text-botanical-forest/60 font-sans">{item.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-serif font-bold text-botanical-terracotta block">
                    {item.growth}
                  </span>
                  <span className="text-[10px] font-sans uppercase text-botanical-forest/60 block">Nhu cầu: {item.demand}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: SYNTHIA AI TECH LEAD EDITORIAL PLAYBOOK       */}
        {/* ======================================================== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-botanical-stone">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-botanical-sage/20 border border-botanical-stone text-botanical-forest flex items-center justify-center shadow-soft">
                <span className="material-symbols-outlined text-xl">menu_book</span>
              </span>
              <div>
                <h2 className="text-xl font-serif font-bold text-botanical-forest">Cẩm Nang Phỏng Vấn &amp; Kiến Trúc từ HireMate AI</h2>
                <p className="text-xs text-botanical-forest/60 font-sans">Phân tích thực tế dựa trên hàng nghìn phiên phỏng vấn thử nghiệm</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {techLeadAdvice.map((item, idx) => (
              <div
                key={idx}
                className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-6 hover:shadow-soft-lg transition-all flex flex-col justify-between shadow-soft space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-sans font-medium bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30 uppercase">
                      {item.tag}
                    </span>
                    <span className="text-xs font-sans text-botanical-forest/60 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-botanical-sage">smart_toy</span>
                      AI Verified
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-botanical-forest leading-snug mb-2">{item.title}</h3>
                  <p className="text-xs text-botanical-forest/75 font-sans leading-relaxed">{item.summary}</p>
                </div>

                <div className="pt-3 border-t border-botanical-stone flex items-center justify-between text-xs font-sans">
                  <span className="text-[11px] text-botanical-forest/60 italic font-serif">{item.author}</span>
                  <button
                    onClick={() => { window.location.hash = '#/ai-interview'; }}
                    className="text-botanical-forest hover:text-botanical-terracotta font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Luyện tập ngay</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 4: CALL TO ACTION BANNER                        */}
        {/* ======================================================== */}
        <div className="card-botanical bg-white/95 border border-botanical-stone rounded-3xl p-8 sm:p-10 shadow-soft relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-botanical-forest">
              Muốn kiểm tra xem năng lực của bạn đang ở bậc nào trên thị trường?
            </h3>
            <p className="text-xs sm:text-sm text-botanical-forest/75 max-w-xl font-sans">
              Tham gia ngay phiên phỏng vấn giả lập AI trong 25 phút. AI Tech Lead sẽ chẩn đoán lỗ hổng kiến thức và định giá mức lương chính xác cho bạn.
            </p>
          </div>
          <button
            onClick={() => { window.location.hash = '#/ai-interview'; }}
            className="btn-botanical-primary !py-3 !px-8 !text-xs !rounded-full shadow-soft hover:shadow-soft-lg transition-all shrink-0 cursor-pointer font-medium"
          >
            Bắt Đầu Phỏng Vấn Thử Miễn Phí
          </button>
        </div>
      </div>
    </div>
  );
}
