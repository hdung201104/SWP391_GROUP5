import React, { useState, useEffect, useRef } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { interviewApi } from '../api/interviewApi';
import { jobApi } from '../api/jobApi';
import { cvApi } from '../api/cvApi';
import { aiMatchApi } from '../api/aiMatchApi';
import VoiceAiAssistantModal from '../components/voice/VoiceAiAssistantModal';
import { HIREMATE_LOGO_URL } from '../constants/branding';
import { getFaceLandmarker, analyzeFaceFrameWithMediaPipe } from '../utils/faceTracker';
import AiInterviewReportPage, { cleanTopicName } from './AiInterviewReportPage';

// ============================================================================
// HỆ THỐNG CẤP BẬC MỤC TIÊU PHỎNG VẤN THỰC CHIẾN
// ============================================================================
const LEVELS = [
  { id: 'intern', label: 'Intern / Fresher', sub: '0-1 năm' },
  { id: 'junior', label: 'Junior', sub: '1-2 năm' },
  { id: 'middle', label: 'Middle', sub: '2-4 năm' },
  { id: 'senior', label: 'Senior', sub: '4-7 năm' },
  { id: 'lead', label: 'Lead / Manager', sub: '7+ năm' },
];

const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

// ============================================================================
// HỆ THỐNG GIỌNG NÓI CHUẨN PHÒNG THU (STUDIO-QUALITY AI VOICES) PHÂN QUYỀN GÓI
// ============================================================================
const VOICE_PRESETS = [
  {
    id: 'vi-native',
    name: 'Giọng Nữ Chuẩn Mực',
    gender: 'Nữ',
    tone: 'Miền Bắc - Khuyên dùng',
    badge: 'Phản Hồi Tức Thì',
    minTier: 'FREE',
    tierLabel: 'Mọi Gói',
    color: 'from-emerald-500 to-teal-600',
    desc: 'Phát âm tiếng Việt rõ chữ, chuẩn từng thanh điệu, ngữ điệu tự nhiên và tốc độ phản hồi tức thì.',
    sampleText: 'Chào bạn, tôi là người phỏng vấn từ HireMate AI. Rất vui được đồng hành cùng bạn trong buổi phỏng vấn hôm nay.'
  },
  {
    id: 'eleven-alice',
    name: 'Giọng Nữ Truyền Cảm',
    gender: 'Nữ',
    tone: 'Song ngữ Việt - Anh',
    badge: 'Song Ngữ Chuẩn',
    minTier: 'PLUS',
    tierLabel: 'Practice Plus+',
    color: 'from-pink-500 to-rose-500',
    desc: 'Giọng nữ truyền cảm, ngữ điệu phong phú, phát âm mượt mà, phù hợp khi phỏng vấn có nhiều thuật ngữ tiếng Anh.',
    sampleText: 'Chào bạn, tôi là người phỏng vấn AI. Chúng ta sẽ cùng nhau thảo luận sâu về kiến thức chuyên môn và kinh nghiệm dự án nhé.'
  },
  {
    id: 'eleven-george',
    name: 'Giọng Nam Trầm Ấm',
    gender: 'Nam',
    tone: 'Phong thái điềm tĩnh',
    badge: 'Chuyên Nghiệp',
    minTier: 'PRO',
    tierLabel: 'Practice Pro VIP',
    color: 'from-blue-600 to-indigo-600',
    desc: 'Giọng nam trầm, đĩnh đạc, phát âm rõ ràng, phong thái phỏng vấn kỹ thuật và chuyên môn điềm tĩnh.',
    sampleText: 'Chào bạn, tôi là người phỏng vấn từ HireMate AI. Chúng ta hãy bắt đầu các câu hỏi chuyên môn trong buổi phỏng vấn nhé.'
  }
];

// ============================================================================
// HỆ THỐNG CHẾ ĐỘ & ÁP LỰC PHỎNG VẤN (INTERVIEW MODES) PHÂN QUYỀN THEO GÓI
// ============================================================================
const INTERVIEWER_PERSONAS = [
  {
    id: 'HR_MANAGER',
    title: 'Chuyên Gia Tuyển Dụng & Nhân Sự (HR Partner)',
    subtitle: 'Culture Fit, Teamwork & STAR Method',
    icon: 'assignment_turned_in',
    minTier: 'FREE',
    tierLabel: 'Mọi Gói',
    color: 'from-blue-500 to-indigo-600',
    desc: 'Phong cách lịch thiệp, khai thác sâu thái độ làm việc, sự phù hợp văn hóa doanh nghiệp, kỹ năng phối hợp đội nhóm và cấu trúc trả lời STAR.',
  },
  {
    id: 'TECH_LEAD',
    title: 'Trưởng Bộ Phận Chuyên Môn (Domain / Tech Lead)',
    subtitle: 'Core Knowledge & Troubleshooting',
    icon: 'psychology_alt',
    minTier: 'PLUS',
    tierLabel: 'Practice Plus+',
    color: 'from-purple-600 to-indigo-700',
    desc: 'Tập trung xoáy sâu vào kiến thức nghiệp vụ cốt lõi, kỹ năng thực chiến, tư duy xử lý sự cố và phương án tối ưu trong công việc.',
  },
  {
    id: 'STRICT_DIRECTOR',
    title: 'Giám Đốc Điều Hành Khắt Khe (Executive Director)',
    subtitle: 'High Pressure & Quantitative Challenge',
    icon: 'crisis_alert',
    minTier: 'PRO',
    tierLabel: 'Practice Pro VIP',
    color: 'from-amber-500 to-rose-600',
    desc: 'Phản biện trực diện và thực tế. Luôn chất vấn về số liệu chứng minh kết quả (KPIs, ROI, Metrics), khả năng chịu áp lực và bài học từ thất bại.',
  },
];

// Thuật toán Autocorrelation tính tần số cơ bản F0 (Pitch Hz) từ sóng âm micro
const autoCorrelatePitch = (buffer, sampleRate) => {
  const SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sumOfSquares += val * val;
  }
  const rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
  if (rootMeanSquare < 0.015) {
    return -1; // Âm lượng quá nhỏ / khoảng lặng
  }

  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }
  const trimmed = buffer.slice(r1, r2);
  const c = new Float32Array(trimmed.length);
  for (let i = 0; i < trimmed.length; i++) {
    for (let j = 0; j < trimmed.length - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (d < c.length - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < c.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  if (T0 > 0 && T0 < c.length - 1) {
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
  }

  const pitch = sampleRate / T0;
  if (pitch >= 75 && pitch <= 380) {
    return pitch;
  }
  return -1;
};

// Bộ lọc từ đệm (Filler Words Detector) đặc trưng trong tiếng Việt
const detectFillerWords = (text) => {
  if (!text) return { count: 0, lastWord: '' };
  const lower = text.toLowerCase();
  let count = 0;
  let lastWord = '';

  for (const phrase of ['kiểu như', 'thì là mà', 'dạng như', 'nói chung là', 'đại loại là', 'thì là']) {
    let idx = 0;
    while ((idx = lower.indexOf(phrase, idx)) !== -1) {
      count++;
      lastWord = phrase;
      idx += phrase.length;
    }
  }

  const words = lower.split(/[\s,.;:!?]+/);
  const singleFillers = new Set(['ờ', 'à', 'ừm', 'ừ', 'um', 'uh', 'er']);
  for (const w of words) {
    if (singleFillers.has(w)) {
      count++;
      lastWord = w;
    }
  }

  return { count, lastWord };
};

// Thời gian im lặng cơ bản (VAD) trước khi AI nhận biết ứng viên đã nói xong
const BASE_QUIET_MS = 1400; // 1.4 giây im lặng tự nhiên
const PATIENCE_QUIET_MS = 1800;
const MAX_PATIENCE_ROUNDS = 2;

const DANGLING_WORDS = new Set(['và', 'nhưng', 'thì', 'là', 'mà', 'vì', 'nên', 'để', 'của', 'với', 'như', 'các', 'những', 'một', 'ở', 'trong', 'khi', 'nếu', 'hoặc', 'cũng', 'ờ', 'à', 'ừm', 'kiểu', 'tức', 'thêm', 'rồi', 'sau', 'đó', 'bởi', 'do', 'tại', 'cho', 'and', 'or', 'but', 'so', 'because']);
const endsWithDanglingWord = (text) => {
  const words = (text || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return DANGLING_WORDS.has(words[words.length - 1]?.replace(/[.,;:!?]/g, '') || '');
};

// Ứng viên tự báo kết thúc lượt nói ("em xin hết phần trả lời", "vậy thôi ạ", "hết rồi ạ", "that's all", ...)
const hasExplicitEndPhrase = (text) =>
  /(xong rồi|hết rồi|hết ạ|vậy thôi|đấy ạ|xin hết|đó là câu trả lời|đó là toàn bộ|em trả lời xong|mình trả lời xong|tôi trả lời xong|that's all|thank you)[\s.!?]*$/i.test((text || '').trim());

// Nhận diện ngôn ngữ câu hỏi/phát biểu: Tiếng Anh hay Tiếng Việt
const isMostlyEnglishText = (text) => {
  if (!text) return false;
  const vnMarks = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const vnWordCount = words.filter((w) => vnMarks.test(w)).length;
  if (vnWordCount / words.length > 0.08) return false;
  const enWords = new Set(['the', 'is', 'are', 'you', 'your', 'what', 'how', 'why', 'can', 'could', 'tell', 'me', 'about', 'experience', 'with', 'project', 'have', 'been', 'which', 'and', 'for', 'in', 'to']);
  const enCount = words.filter((w) => enWords.has(w)).length;
  return enCount >= 2;
};

// Định dạng mức lương thực tế từ Database
const formatSalary = (min, max) => {
  if (!min && !max) return 'Thỏa thuận';
  if (min && max) {
    if (min >= 1000000) {
      return `${Math.round(min / 1000000)} - ${Math.round(max / 1000000)} Triệu VNĐ`;
    }
    if (min < 10000) {
      return `$${Number(min).toLocaleString()} - $${Number(max).toLocaleString()}`;
    }
    return `${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`;
  }
  if (min) {
    if (min >= 1000000) return `Từ ${Math.round(min / 1000000)} Triệu VNĐ`;
    return `Từ $${Number(min).toLocaleString()}`;
  }
  return 'Thỏa thuận';
};

// Chuẩn hóa văn bản cho AI Voice Agent (Text-to-Speech)
// Giữ nguyên 100% từ vựng tiếng Anh kỹ thuật và câu tiếng Việt tự nhiên
// Không dùng bảng phiên âm thô sơ, để các mô hình giọng đọc Neural (Microsoft NamMinh/HoaiMy Natural, Google tiếng Việt)
// tự động phát âm chuẩn xác ngữ âm đa ngôn ngữ như ChatGPT Voice, Gemini Live.
const cleanTextForSpeech = (text) => {
  if (!text) return '';
  let s = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[*_#`~>\[\]{}()\"“”„‟«»]/g, ' ')
    .replace(/^(\d+[\.\)]|Câu\s*\d+[:\.]|Q\d+[:\.])\s*/i, '')
    .replace(/[-–—]{2,}/g, ' - ');

  // Mở rộng an toàn các ký tự lập trình phi chữ cái (C#, C++, CI/CD, UI/UX)
  const safeMap = [
    [/\bC#\b/g, 'C Sharp'],
    [/\bC\+\+\b/g, 'C Plus Plus'],
    [/\bCI\/CD\b/gi, 'CI CD'],
    [/\bUI\/UX\b/gi, 'UI UX'],
    [/\bQA\/QC\b/gi, 'QA QC'],
    [/\bv\.v\.\.\.|\bv\.v\.\b/gi, 'vân vân'],
    [/\be\.g\.\b/gi, 'ví dụ'],
    [/\bi\.e\.\b/gi, 'tức là'],
    [/&/g, ' và '],
  ];

  for (const [regex, replacement] of safeMap) {
    s = s.replace(regex, replacement);
  }

  return s
    .replace(/\s*([,;:])\s*/g, '$1 ')
    .replace(/\s*([.!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Bộ sinh câu hỏi mở đầu thực chiến đặc thù theo từng vị trí (Đa dạng, tự nhiên, chuẩn phong thái phỏng vấn thực tế)
const generatePositionSpecificGreeting = (position = '', companyName = '', candidateName = 'bạn', cv = null, focusPrompt = '', level = 'Middle') => {
  const pos = position.toLowerCase();
  const lvl = (level || '').toLowerCase();
  const comp = companyName ? `tại ${companyName}` : '';
  const topSkill = cv?.skills && cv.skills.length > 0 ? cv.skills[0] : '';
  const isEarlyCareer = pos.includes('intern') || pos.includes('fresher') || pos.includes('thực tập') || lvl.includes('intern') || lvl.includes('fresher');

  // 1. Kế toán & Kiểm toán & Thuế (Accounting / Auditing / Tax)
  if (pos.includes('kế toán') || pos.includes('kiểm toán') || pos.includes('thuế') || pos.includes('accounting') || pos.includes('audit')) {
    if (isEarlyCareer) {
      const qList = [
        `Chào ${candidateName}! Rất vui được gặp bạn trong buổi trao đổi hôm nay cho vị trí ${position} ${comp}. Với nghề kế toán thì tính cẩn trọng và nền tảng chuẩn mực là rất quan trọng. Bạn có thể giới thiệu đôi nét về bản thân và những phần hành kế toán bạn cảm thấy nắm chắc nhất trong quá trình học tập không?`,
        `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Để bắt đầu thoải mái nhất, bạn hãy chia sẻ ngắn gọn về bản thân cùng lý do bạn lựa chọn theo đuổi lĩnh vực kế toán kiểm toán nhé?`
      ];
      return qList[Math.floor(Math.random() * qList.length)];
    }
    const qList = [
      `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Trong nghề kế toán, tính chuẩn xác và khả năng tuân thủ chuẩn mực VAS/IFRS là yếu tố sống còn. Bạn hãy chia sẻ về một tình huống thực tế khi đối chiếu số liệu phát hiện sai lệch công nợ hoặc hàng tồn kho trọng yếu, bạn đã xử lý và giải trình với ban giám đốc thế nào?`,
      `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Trong kỳ quyết toán thuế cuối năm, những khoản chi phí nào thường tiềm ẩn rủi ro bị cơ quan Thuế xuất toán nhiều nhất, và bạn đã có kinh nghiệm chuẩn bị hồ sơ giải trình ra sao?`,
      `Chào ${candidateName}! Rất vui được phỏng vấn bạn cho vị trí ${position} ${comp}. Khi ban giám đốc yêu cầu cung cấp Báo cáo Quản trị dòng tiền gấp để đưa ra quyết định kinh doanh quan trọng, bạn đã tổ chức trích xuất và phân tích số liệu như thế nào để đảm bảo tính kịp thời và chính xác?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 2. Kinh doanh, Bán hàng & Phát triển Thị trường (Sales / Business Development / B2B)
  if (pos.includes('kinh doanh') || pos.includes('bán hàng') || pos.includes('sales') || pos.includes('account executive') || pos.includes('phát triển thị trường')) {
    if (isEarlyCareer) {
      const qList = [
        `Chào ${candidateName}! Rất vui được gặp bạn hôm nay. Trong nghề kinh doanh thì sự tự tin, nhạy bén và năng lượng tích cực là yếu tố rất quý giá. Trước tiên, bạn có thể giới thiệu một chút về bản thân và điều gì truyền cảm hứng lớn nhất giúp bạn chọn theo đuổi nghề sales không?`,
        `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí ${position} ${comp}. Để bắt đầu tự nhiên nhất, bạn có thể chia sẻ về một trải nghiệm giao tiếp hoặc thuyết phục người khác mà bạn cảm thấy tâm đắc nhất không?`
      ];
      return qList[Math.floor(Math.random() * qList.length)];
    }
    const qList = [
      `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí ${position} ${comp}. Để bắt đầu, bạn hãy chia sẻ về một hợp đồng hoặc thương vụ bán hàng (deal) thử thách nhất mà bạn từng theo đuổi: khách hàng liên tục từ chối hoặc ép giá, và chiến lược đàm phán chốt deal thành công của bạn là gì?`,
      `Chào ${candidateName}! Rất vui được đồng hành cùng bạn phỏng vấn vị trí ${position} ${comp}. Khi thị trường gặp biến động hoặc rơi vào mùa thấp điểm, phương pháp quản lý phễu bán hàng (sales funnel) và cách bạn chủ động tạo ra nguồn khách hàng tiềm năng mới như thế nào?`,
      `Chào ${candidateName}! Chào bạn đến với buổi trao đổi ${position} ${comp}. Nếu một khách hàng VIP phàn nàn gay gắt về chất lượng sản phẩm và đe dọa chuyển sang đối thủ cạnh tranh, bạn dùng những bước cụ thể nào để xoa dịu và giữ chân họ?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 3. Tiếp thị, Truyền thông & Thương hiệu (Marketing / Digital Marketing / Branding / Content)
  if (pos.includes('marketing') || pos.includes('truyền thông') || pos.includes('brand') || pos.includes('seo') || pos.includes('content') || pos.includes('digital')) {
    if (isEarlyCareer) {
      const qList = [
        `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí Marketing hôm nay. Để bắt đầu thoải mái nhất, bạn có thể chia sẻ ngắn gọn về bản thân và một chiến dịch truyền thông hoặc xu hướng nội dung số mà bạn cảm thấy ấn tượng nhất gần đây không?`,
        `Chào ${candidateName}! Rất vui được gặp bạn. Với vị trí ${position} ${comp}, ban phỏng vấn rất trân trọng tư duy sáng tạo và khả năng bắt nhịp xu hướng mới. Bạn có thể giới thiệu đôi nét về hành trình học tập và sở thích tiếp thị của bạn không?`
      ];
      return qList[Math.floor(Math.random() * qList.length)];
    }
    const qList = [
      `Chào ${candidateName}! Rất vui được trao đổi cùng bạn về vị trí ${position} ${comp}. Hãy chia sẻ về một chiến dịch tiếp thị gần đây nhất mà bạn giữ vai trò then chốt: mục tiêu chiến dịch, cách bạn lựa chọn thông điệp cốt lõi và kết quả đo lường cụ thể qua các chỉ số như ROAS, CAC hay chuyển đổi (CVR)?`,
      `Chào ${candidateName}! Chào mừng bạn đến buổi phỏng vấn ${position} ${comp}. Khi một chiến dịch quảng cáo trọng điểm sau 3 ngày khởi chạy có chi phí trên mỗi lượt chuyển đổi tăng vọt gấp đôi mức cho phép, quy trình A/B testing và tối ưu lại của bạn sẽ như thế nào?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 4. Tài chính, Ngân hàng & Đầu tư (Finance / Banking / Investment)
  if (pos.includes('tài chính') || pos.includes('ngân hàng') || pos.includes('finance') || pos.includes('banking') || pos.includes('đầu tư')) {
    return `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp}. Trong quản trị tài chính doanh nghiệp, việc cân đối giữa khả năng thanh khoản ngắn hạn và tối ưu hóa lợi nhuận đầu tư là bài toán không dễ. Bạn có thể chia sẻ một kinh nghiệm thực tế về phân tích dòng tiền hoặc thẩm định hiệu quả dự án mà bạn từng trực tiếp thực hiện?`;
  }

  // 5. Quản trị Nhân sự & Tuyển dụng (Human Resources / HR / Talent Acquisition)
  if (pos.includes('nhân sự') || /\bhr\b/i.test(pos) || pos.includes('tuyển dụng') || pos.includes('talent')) {
    const qList = [
      `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí ${position} ${comp}. Trong bối cảnh cạnh tranh nhân tài gay gắt, bạn đã áp dụng những kênh tiếp cận và thông điệp tuyển dụng sáng tạo nào để thu hút thành công các nhân sự chất lượng cao?`,
      `Chào ${candidateName}! Rất vui được đồng hành cùng bạn phỏng vấn ${position} ${comp}. Khi xảy ra mâu thuẫn nội bộ giữa các phòng ban hoặc khi phải thương lượng chính sách đãi ngộ với nhân sự chủ chốt, cách bạn lắng nghe và dung hòa lợi ích của công ty với người lao động thế nào?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 6. Chuỗi cung ứng, Logistics & Xuất nhập khẩu (Supply Chain / Logistics / Import-Export)
  if (pos.includes('logistics') || pos.includes('chuỗi cung ứng') || pos.includes('xuất nhập khẩu') || pos.includes('supply chain')) {
    return `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn ${position} ${comp}. Khi chuỗi cung ứng bất ngờ bị đứt gãy hoặc đối tác vận chuyển thông báo trễ hàng sát deadline bàn giao cho khách hàng trọng điểm, giải pháp xử lý sự cố thay thế và kiểm soát chi phí phát sinh của bạn là gì?`;
  }

  // 7. Chăm sóc Khách hàng & Dịch vụ Khách hàng (Customer Care / Support)
  if (pos.includes('chăm sóc khách hàng') || pos.includes('customer care') || pos.includes('customer service') || pos.includes('cskh')) {
    return `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí ${position} ${comp}. Bạn có thể chia sẻ về một tình huống thực tế khi gặp phải khách hàng cực kỳ nóng tính và bức xúc, các bước lắng nghe và giải quyết vấn đề của bạn đã giúp chuyển hóa sự bất mãn thành sự hài lòng như thế nào?`;
  }

  // 8. Kỹ sư Cầu nối Nhật Bản (BrSE / Bridge Software Engineer / Japanese)
  if (pos.includes('brse') || pos.includes('cầu nối') || pos.includes('nhật') || pos.includes('japanese') || pos.includes('bridge')) {
    const qList = [
      `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Trong vai trò cầu nối với khách hàng Nhật Bản, việc làm rõ yêu cầu nghiệp vụ và truyền đạt chính xác cho team offshore là yếu tố sống còn. Bạn hãy chia sẻ về một tình huống thực tế khi đối tác Nhật thay đổi tài liệu Basic Design (Kihon Sekkei) sát ngày release, bạn đã đàm phán phạm vi và điều phối team offshore xử lý thế nào?`,
      `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí ${position} ${comp}. Trong quá trình Q&A spec với đối tác Nhật Bản, nếu nhận thấy giải pháp kỹ thuật khách hàng đưa ra không tối ưu hoặc có rủi ro bảo mật lớn, bạn dùng phương pháp gì để phản biện và thuyết phục họ mà vẫn đảm bảo tính lịch thiệp trong văn hóa Hou-Ren-So?`,
      `Chào ${candidateName}! Rất vui được đồng hành cùng bạn phỏng vấn vị trí ${position} ${comp}. Hãy chia sẻ kinh nghiệm thực tế của bạn trong việc quản lý tiến độ, rà soát tài liệu Detail Design và giải quyết mâu thuẫn cách hiểu spec giữa lập trình viên Việt Nam và Tech Lead phía Nhật?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 9. Chuyên viên Phân tích Nghiệp vụ (BA / Business Analyst)
  if (/\bba\b/i.test(pos) || pos.includes('business analyst') || pos.includes('nghiệp vụ') || pos.includes('product analyst')) {
    const qList = [
      `Chào ${candidateName}! Chào mừng bạn đến buổi phỏng vấn vị trí ${position} ${comp}. Trong quá trình khơi gợi yêu cầu, khi các bên liên quan từ các phòng ban đưa ra yêu cầu mâu thuẫn gay gắt, bạn đã sử dụng kỹ thuật gì để phân tích, hài hòa lợi ích và chốt bản đặc tả SRS cuối cùng?`,
      `Chào ${candidateName}! Rất vui được phỏng vấn bạn cho vị trí ${position} ${comp}. Khi phân tích một luồng nghiệp vụ phức tạp, bạn thường áp dụng các phương pháp mô hình hóa nào như BPMN hay Use Case để đảm bảo đội ngũ phát triển không bỏ sót các trường hợp ngoại lệ?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 10. Quản lý Dự án (PM / Scrum Master / Product Owner)
  if (/\bpm\b/i.test(pos) || pos.includes('project manager') || pos.includes('scrum') || pos.includes('quản lý dự án') || pos.includes('product owner')) {
    const qList = [
      `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp}. Khi một dự án trọng điểm bị trễ tiến độ do phát sinh lỗi kiến trúc và khách hàng liên tục phàn nàn, bạn sẽ tái phân bổ nguồn lực và kiểm soát rủi ro như thế nào để đưa dự án về đích đúng hạn?`,
      `Chào ${candidateName}! Chào mừng bạn đến buổi phỏng vấn ${position} ${comp}. Hãy chia sẻ về cách bạn xử lý khi đội ngũ phát triển và các bên kinh doanh bất đồng gay gắt về mức độ ưu tiên tính năng trong kỳ Sprint Planning?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 11. An toàn thông tin & Kỹ sư Bảo mật (Security / Pentest / Cybersecurity)
  if (pos.includes('security') || pos.includes('bảo mật') || pos.includes('an toàn') || pos.includes('pentest') || pos.includes('cyber')) {
    return `Chào ${candidateName}! Rất vui được trao đổi cùng bạn về vị trí ${position} ${comp}. Nếu một ứng dụng bất ngờ bị tấn công dò quét lỗ hổng hoặc nghi ngờ rò rỉ dữ liệu nhạy cảm qua API, quy trình ứng cứu sự cố (incident response) và biện pháp gia cố an ninh của bạn sẽ triển khai theo các bước cụ thể nào?`;
  }

  // 12. Kỹ sư Toàn diện (Full Stack / Fullstack)
  if (pos.includes('fullstack') || pos.includes('full-stack') || pos.includes('full stack')) {
    if (isEarlyCareer) {
      return `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Làm Full Stack đòi hỏi sự linh hoạt giữa cả Frontend và Backend. Để bắt đầu thoải mái nhất, bạn có thể giới thiệu đôi nét về bản thân và chia sẻ bạn cảm thấy tự tin hoặc hào hứng hơn với phần nào nhé?`;
    }
    return `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Hãy chia sẻ về một bài toán tối ưu hiệu năng toàn trình (end-to-end performance) mà bạn từng xử lý: từ lúc tối ưu truy vấn cơ sở dữ liệu, caching backend cho đến giảm thời gian render ở phía client?`;
  }

  // 13. Kiểm thử phần mềm (QA / QC / Tester)
  if (pos.includes('test') || pos.includes('qa') || pos.includes('qc') || pos.includes('kiểm thử')) {
    const qList = [
      `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Với vai trò kiểm thử chất lượng, việc phát hiện lỗi sớm và bao phủ kịch bản kiểm thử là cực kỳ quan trọng. Bạn có thể chia sẻ về một quy trình kiểm thử thực tế từ lúc nhận yêu cầu, thiết kế test case đến khi phát hiện một bug nghiêm trọng mà bạn từng thực hiện không?`,
      `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn vị trí ${position} ${comp}. Để bắt đầu, bạn hãy chia sẻ kinh nghiệm thực tế về cách bạn phân biệt và kết hợp giữa manual test và automation test trong các dự án gần đây của mình?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 14. Lập trình giao diện (Frontend / Web / Mobile UI)
  if (pos.includes('frontend') || pos.includes('front-end') || pos.includes('react') || pos.includes('vue') || pos.includes('ui/ux')) {
    if (isEarlyCareer) {
      const qList = [
        `Chào ${candidateName}! Rất vui được gặp bạn trong buổi trao đổi hôm nay cho vị trí ${position} ${comp}. Để bắt đầu một cách tự nhiên nhất, bạn có thể giới thiệu đôi nét về bản thân và một giao diện ứng dụng web bạn từng xây dựng khiến bạn cảm thấy tự hào nhất không?`,
        `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Bạn cứ thoải mái chia sẻ nhé. Cơ duyên nào đã đưa bạn đến với định hướng lập trình giao diện người dùng này?`
      ];
      return qList[Math.floor(Math.random() * qList.length)];
    }
    const qList = [
      `Chào ${candidateName}! Rất vui được phỏng vấn bạn cho vị trí ${position} ${comp}. Để mở đầu, bạn có thể chia sẻ về một giao diện hoặc tính năng phức tạp nhất mà bạn từng xây dựng, và cách bạn tối ưu hiệu năng render cũng như trải nghiệm người dùng trên các thiết bị?`,
      `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Bạn có thể phân tích ngắn gọn về cách bạn tổ chức kiến trúc component, quản lý trạng thái và xử lý gọi API bất đồng bộ trong dự án gần đây nhất?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 15. Kỹ sư hệ thống máy chủ (Backend / Database)
  if (pos.includes('backend') || pos.includes('back-end') || pos.includes('java') || pos.includes('node') || pos.includes('golang') || pos.includes('python') || pos.includes('c#')) {
    if (isEarlyCareer) {
      const qList = [
        `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Với các bạn mới bước vào ngành, ban phỏng vấn luôn đánh giá cao nền tảng tư duy và tinh thần chủ động tìm tòi. Để bắt đầu thoải mái nhất, bạn có thể chia sẻ đôi nét về quá trình học tập cũng như cơ duyên nào đưa bạn đến với định hướng lập trình backend này không?`,
        `Chào ${candidateName}! Chào mừng bạn đến với buổi phỏng vấn ${position} ${comp}. Bạn cứ thoải mái trao đổi nhé. Trước tiên, bạn có thể giới thiệu một chút về bản thân và một bài toán hoặc công nghệ backend bạn cảm thấy hào hứng tìm hiểu nhất gần đây không?`,
        `Chào ${candidateName}! Rất vui được đồng hành cùng bạn hôm nay. Trong quá trình học tập và làm đồ án về backend, bạn cảm thấy phần nào là thú vị và thử thách nhất đối với bạn?`
      ];
      return qList[Math.floor(Math.random() * qList.length)];
    }
    const qList = [
      `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn chuyên sâu cho vị trí ${position} ${comp}. Để bắt đầu, bạn hãy giới thiệu về kiến trúc hệ thống backend của dự án thực tế tiêu biểu nhất trong CV, và cách bạn thiết kế cơ sở dữ liệu để đáp ứng lưu lượng truy cập cao?`,
      `Chào ${candidateName}! Chào mừng bạn đến buổi phỏng vấn ${position} ${comp}. Khi xây dựng các dịch vụ backend, bạn thường áp dụng những giải pháp nào để tối ưu tốc độ truy vấn, kiểm soát transaction và xử lý lỗi hệ thống?`
    ];
    return qList[Math.floor(Math.random() * qList.length)];
  }

  // 16. Kỹ sư DevOps / Hạ tầng Cloud
  if (pos.includes('devops') || pos.includes('cloud') || pos.includes('sre') || pos.includes('system')) {
    return `Chào ${candidateName}! Rất vui được trao đổi cùng bạn về vị trí ${position} ${comp}. Để khởi động buổi phỏng vấn, bạn có thể chia sẻ về một đường ống CI/CD hoặc hạ tầng điện toán đám mây mà bạn từng trực tiếp thiết lập, giám sát và xử lý sự cố thực tế không?`;
  }

  // 17. Dữ liệu & Trí tuệ nhân tạo (Data / AI)
  if (pos.includes('data') || pos.includes('ai') || pos.includes('machine learning')) {
    return `Chào ${candidateName}! Chào mừng bạn đến buổi phỏng vấn vị trí ${position} ${comp}. Để bắt đầu, bạn có thể giới thiệu về một bài toán xử lý dữ liệu hoặc mô hình học máy mà bạn từng trực tiếp triển khai, và những thách thức về làm sạch dữ liệu bạn đã giải quyết?`;
  }

  // 18. Lập trình ứng dụng di động (Mobile)
  if (pos.includes('mobile') || pos.includes('android') || pos.includes('ios') || pos.includes('flutter')) {
    return `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp}. Để mở đầu, bạn hãy chia sẻ về một ứng dụng di động bạn từng phát triển, và bạn đã giải quyết bài toán quản lý bộ nhớ cũng như trải nghiệm mượt mà đa thiết bị như thế nào?`;
  }

  // 19. Có trọng tâm luyện tập riêng
  if (focusPrompt) {
    return `Chào ${candidateName}! Rất vui được đồng hành cùng bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Buổi phỏng vấn hôm nay chúng ta sẽ tập trung vào trọng tâm "${focusPrompt}". Bạn có thể chia sẻ một tình huống thực tế mà bạn đã áp dụng kỹ năng này để giải quyết thử thách lớn nhất trong công việc?`;
  }

  // 20. Kỹ năng nổi bật trong CV
  if (topSkill) {
    return `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Hồ sơ của bạn thể hiện thế mạnh về ${topSkill}. Bạn có thể chia sẻ cụ thể về một tình huống hoặc bài toán mà bạn đã giải quyết thành công bằng năng lực chuyên môn này không?`;
  }

  // 21. Mở đầu tổng quát linh hoạt (Không dùng từ "công nghệ" nếu không phải IT)
  const isBiz = pos.includes('kinh tế') || pos.includes('kinh doanh') || pos.includes('tài chính') || pos.includes('thương mại') || pos.includes('dịch vụ') || pos.includes('quản trị');
  if (isBiz) {
    if (isEarlyCareer) {
      return `Chào ${candidateName}! Rất vui được phỏng vấn bạn cho vị trí ${position} ${comp} hôm nay. Bạn cứ tự tin và thoải mái trao đổi nhé. Trước tiên, bạn có thể giới thiệu một chút về bản thân và những điều bạn đang kỳ vọng được học hỏi, cọ xát nhiều nhất ở vị trí này không?`;
    }
    return `Chào ${candidateName}! Rất vui được phỏng vấn bạn cho vị trí ${position} ${comp} hôm nay. Để bắt đầu một cách tự nhiên nhất, bạn hãy chia sẻ ngắn gọn về bản thân cùng một thử thách hoặc thành tựu công việc tiêu biểu nhất mà bạn từng phụ trách?`;
  }

  if (isEarlyCareer) {
    return `Chào ${candidateName}! Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${position} ${comp} hôm nay. Bạn cứ tự tin và thoải mái trao đổi nhé. Trước tiên, bạn có thể giới thiệu đôi nét về bản thân và những định hướng bạn đang theo đuổi trong công việc không?`;
  }

  return `Chào ${candidateName}! Rất vui được phỏng vấn bạn cho vị trí ${position} ${comp} hôm nay. Để bắt đầu một cách thoải mái nhất, bạn có thể chia sẻ đôi nét về bản thân và định hướng công việc mà bạn đang theo đuổi không?`;
};

// Thuật toán Echo Guard: Phát hiện nếu micro vô tình thu lại chính giọng nói của AI phát ra từ loa
const isEchoOfAi = (candidateText, recentAiTexts = []) => {
  if (!candidateText || candidateText.trim().length === 0) return false;
  const candNorm = candidateText.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  // Câu trả lời tự nhiên dưới 25 ký tự không bao giờ là tiếng vọng
  if (candNorm.length < 25) return false;

  for (const aiText of recentAiTexts) {
    if (!aiText) continue;
    const aiNorm = aiText.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    // Chỉ coi là tiếng vọng nếu chuỗi nhận diện trùng khớp nguyên văn một đoạn dài từ phát ngôn của AI
    if (candNorm.length >= 35 && aiNorm.includes(candNorm)) {
      return true;
    }
  }
  return false;
};

export default function AiInterviewStudioPage({ user, onNavigate }) {
  const { theme: livingTheme } = useLivingTheme();
  const [view, setView] = useState('setup'); // 'setup' | 'live' | 'result' | 'history'

  // Context Selection: 'job' | 'ai-recommend' | 'custom'
  const [contextMode, setContextMode] = useState('job');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [aiTailoredTracks, setAiTailoredTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('all');
  const [isAiLoadingRecommend, setIsAiLoadingRecommend] = useState(false);
  const [customPosition, setCustomPosition] = useState('Senior Full Stack Developer');
  const [myCvs, setMyCvs] = useState([]);
  const [selectedCv, setSelectedCv] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('middle');

  // Focus Skills & Custom Notes for AI (Điểm yếu cần xoáy sâu)
  const [selectedFocusSkills, setSelectedFocusSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customFocusNotes, setCustomFocusNotes] = useState('');
  const [retryParentSessionId, setRetryParentSessionId] = useState(null);

  const handleRetrySession = (sess) => {
    const parentId = sess?.sessionId || sess?.id;
    if (parentId) {
      setRetryParentSessionId(parentId);
      showToast('🔄 Đã kích hoạt chế độ luyện tập lại (PRACTICE_RETRY). Phiên mới sẽ so sánh độ tiến bộ với lần thi trước!');
    }
    setView('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Live Interview State
  const [interviewConfig, setInterviewConfig] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState('HR_MANAGER');
  const [coachUsageCount, setCoachUsageCount] = useState(0);
  const [quotaStatus, setQuotaStatus] = useState(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaExceededMessage, setQuotaExceededMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false); // Ngăn kéo nhắn tin phụ (Secondary Drawer)
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerOn, setTimerOn] = useState(false);


  // High-Quality Vietnamese Neural Voices & Presets
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedVoicePreset, setSelectedVoicePreset] = useState('vi-native');
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);

  // Acoustic & Tone Telemetry State (Tông giọng, Cao độ, Tốc độ WPM, Bộ lọc từ đệm)
  const [livePitchHz, setLivePitchHz] = useState(0);
  const [liveToneDesc, setLiveToneDesc] = useState('Chưa có âm thanh');
  const [liveVolumeDb, setLiveVolumeDb] = useState(-60);
  const [liveWpm, setLiveWpm] = useState(0);
  const [turnFillerCount, setTurnFillerCount] = useState(0);
  const [sessionFillerCount, setSessionFillerCount] = useState(0);
  const [lastFillerAlert, setLastFillerAlert] = useState('');

  // Facial Emotion & Camera Telemetry State (Biểu cảm, Ánh mắt, Tư thế)
  const [liveEyeContactPercent, setLiveEyeContactPercent] = useState(0);
  const [liveFacialEmotion, setLiveFacialEmotion] = useState('Chưa bật camera');
  const [livePostureStatus, setLivePostureStatus] = useState('Chưa bật camera');
  const [detectedFaceBox, setDetectedFaceBox] = useState({ x: 22, y: 14, w: 56, h: 68 });
  const prevFaceBoxRef = useRef({ x: 22, y: 14, w: 56, h: 68 });

  // Telemetry Aggregators for Assessment Report (Báo cáo tổng hợp đa chiều)
  const telemetryHistoryRef = useRef({
    pitchSamples: [],
    wpmSamples: [],
    eyeContactSamples: [],
    emotions: { confident: 0, smiling: 0, focused: 0, tense: 0 },
    postures: { good: 0, bowing: 0, profile: 0, lookingUp: 0 },
    totalFillers: 0,
    hasCameraEverBeenOn: false,
  });

  // Audio Processing Nodes
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micMediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioAnimFrameRef = useRef(null);
  const speechTurnStartTimeRef = useRef(0);

  // Vision Canvas Nodes, Orientation Tracking & MediaPipe AI Face Landmarker
  const visionCanvasRef = useRef(null);
  const visionIntervalRef = useRef(null);
  const faceOrientationRef = useRef({ asymmetry: 0, isProfile: false, centerRatioX: 0.5, centerRatioY: 0.4 });
  const mediaPipeLandmarkerRef = useRef(null);
  const isMediaPipeLoadingRef = useRef(false);
  const pendingAnswerSavesRef = useRef([]);

  // Result & History State
  const [result, setResult] = useState(null);
  const [resultTab, setResultTab] = useState('overview'); // 'overview' | 'questions' | 'telemetry'
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all' | 'high' | 'low'
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [toast, setToast] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Helper: Bóc tách nhận xét chuyên môn và telemetry phong thái
  const parseFeedbackSection = (text) => {
    if (!text) return { critique: 'Chưa có nhận xét.', telemetry: null };
    const splitPattern = /\[Phong thái &(?: Telemetry| Ngữ điệu)[^\]]*\]:\s*/i;
    const parts = text.split(splitPattern);
    const critique = parts[0]?.trim() || text;
    const telemetry = parts[1]?.trim() || null;
    return { critique, telemetry };
  };

  // Helper: Phân tích cấu trúc câu trả lời mẫu theo STAR
  const parseStarModelAnswer = (text) => {
    if (!text) return { raw: '', hasStar: false };
    const clean = text.split(/\[Phong thái &(?: Telemetry| Ngữ điệu)/i)[0].trim();

    const regexS = /(?:bối cảnh|tình huống|situation|\(s\))\s*[:\-\—]([\s\S]*?)(?=(?:nhiệm vụ|mục tiêu|task|\(t\)|hành động|triển khai|action|\(a\)|kết quả|hiệu quả|result|\(r\)|$))/i;
    const regexT = /(?:nhiệm vụ|mục tiêu|task|\(t\))\s*[:\-\—]([\s\S]*?)(?=(?:hành động|triển khai|action|\(a\)|kết quả|hiệu quả|result|\(r\)|$))/i;
    const regexA = /(?:hành động|triển khai|action|\(a\))\s*[:\-\—]([\s\S]*?)(?=(?:kết quả|hiệu quả|result|\(r\)|$))/i;
    const regexR = /(?:kết quả|hiệu quả|result|\(r\))\s*[:\-\—]([\s\S]*?)$/i;

    const matchS = clean.match(regexS);
    const matchT = clean.match(regexT);
    const matchA = clean.match(regexA);
    const matchR = clean.match(regexR);

    if (matchS || matchT || matchA || matchR) {
      return {
        raw: clean,
        hasStar: true,
        s: matchS ? matchS[1].trim() : '',
        t: matchT ? matchT[1].trim() : '',
        a: matchA ? matchA[1].trim() : '',
        r: matchR ? matchR[1].trim() : '',
      };
    }

    return {
      raw: clean,
      hasStar: false,
    };
  };

  // Audio & Hardware Refs
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const speechCooldownTimerRef = useRef(null);
  const greetingTimerRef = useRef(null);
  const lastAiFinishedTimeRef = useRef(0);
  const recentAiTurnsRef = useRef([]);
  const isLiveSessionRef = useRef(false);
  const isMicDesiredRef = useRef(false);
  const baseSpeechRef = useRef('');
  const currentAnswerRef = useRef('');
  currentAnswerRef.current = currentAnswer;
  const chatBottomRef = useRef(null);
  const isTurnProcessingRef = useRef(false);
  const patienceRoundsRef = useRef(0);
  const currentAudioRef = useRef(null);
  // Luôn giữ bản mới nhất của hội thoại để các callback của micro/timer không đọc phải state cũ (nguyên nhân AI hỏi lặp/“ngố”)
  const dialogueHistoryRef = useRef([]);
  dialogueHistoryRef.current = dialogueHistory;
  // Trạng thái nghe: idle | hearing | checking | waiting
  const [listenStatus, setListenStatus] = useState('idle');
  const [coaching, setCoaching] = useState(null);
  const [showCoach, setShowCoach] = useState(false);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  // Live Camera Video Stream State & Refs
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null); // null | 'permission_denied' | 'in_use' | 'not_found' | 'unsupported' | 'generic'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const simVisionIntervalRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Trích xuất thông tin CV cô đọng cho AI hiểu sâu hồ sơ ứng viên
  const getCvSnippet = (cv) => {
    if (!cv) return '';
    const parts = [];
    if (cv.candidateName || user?.fullName) parts.push(`Ứng viên: ${cv.candidateName || user?.fullName}`);
    if (cv.headline) parts.push(`Vị trí/Headline: ${cv.headline}`);
    if (cv.yearsOfExperience) parts.push(`Kinh nghiệm: ${cv.yearsOfExperience} năm`);
    if (cv.skills && Array.isArray(cv.skills) && cv.skills.length > 0) {
      parts.push(`Kỹ năng CV: ${cv.skills.slice(0, 12).join(', ')}`);
    } else if (cv.detectedSkills && Array.isArray(cv.detectedSkills) && cv.detectedSkills.length > 0) {
      parts.push(`Kỹ năng CV: ${cv.detectedSkills.slice(0, 12).join(', ')}`);
    }
    if (cv.summary) {
      parts.push(`Tóm tắt: ${cv.summary.slice(0, 300)}`);
    } else if (cv.parsedText) {
      parts.push(`Nội dung trích xuất CV: ${cv.parsedText.slice(0, 600)}`);
    }
    if (cv.projects) {
      const p = typeof cv.projects === 'string' ? cv.projects : JSON.stringify(cv.projects);
      parts.push(`Dự án thực tế: ${p.slice(0, 400)}`);
    }
    if (cv.experiences) {
      const exp = typeof cv.experiences === 'string' ? cv.experiences : JSON.stringify(cv.experiences);
      parts.push(`Kinh nghiệm làm việc: ${exp.slice(0, 300)}`);
    }
    return parts.join('\n');
  };

  // Trích xuất thông tin bài tuyển dụng (JD) cô đọng cho AI
  const getJobSnippet = (job) => {
    if (!job) return '';
    const parts = [];
    if (job.title) parts.push(`Vị trí tuyển dụng: ${job.title}`);
    if (job.companyName) parts.push(`Doanh nghiệp: ${job.companyName}`);
    if (job.mandatorySkills && job.mandatorySkills.length > 0) {
      parts.push(`Kỹ năng bắt buộc (Mandatory): ${job.mandatorySkills.join(', ')}`);
    }
    if (job.preferredSkills && job.preferredSkills.length > 0) {
      parts.push(`Kỹ năng ưu tiên (Preferred): ${job.preferredSkills.join(', ')}`);
    }
    if (job.description) {
      parts.push(`Mô tả công việc: ${job.description.slice(0, 350)}`);
    }
    if (job.requirements && Array.isArray(job.requirements)) {
      parts.push(`Yêu cầu: ${job.requirements.slice(0, 4).join('; ')}`);
    }
    return parts.join('\n');
  };

  // Chuẩn hóa và làm đẹp tên vị trí công việc (ví dụ "tester" -> "Tester", "intern backend" -> "Intern Backend")
  const formatJobTitle = (title = '') => {
    if (!title) return 'Vị Trí Kỹ Thuật';
    let cleaned = title.replace(/\[\s*(technical|be|fe|dev|it)\s*\]/gi, '').trim();
    return cleaned
      .split(/\s+/)
      .map((w) => {
        if (/^(and|of|in|for|on|with|to|at)$/i.test(w)) return w.toLowerCase();
        if (/^(ai|ba|qa|qc|ui|ux|fe|be|it|hr|c&b|sql|aws|gcp|crm|api|restful)$/i.test(w)) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  };

  // Bộ kỹ năng chuẩn suy luận theo vị trí công việc khi JD thiếu hoặc bị gắn nhầm
  const getStandardSkillsByTitle = (title = '') => {
    const t = (title || '').toLowerCase();
    if (/\bqa\b|\bqc\b|tester|kiểm thử|automation test|selenium/i.test(t)) {
      return ['Test Case Design', 'Manual & Automation Test', 'API Testing (Postman)', 'Jira & Bug Tracking'];
    }
    if (/frontend|front-end|react|vue|angular|ui\/ux|next\.js/i.test(t)) {
      return ['React.js / TypeScript', 'HTML5 & Tailwind CSS', 'State Management', 'RESTful API'];
    }
    if (/brse|cầu nối|bridge|nhật|japanese/i.test(t)) {
      return ['Japanese N2/N1', 'Basic/Detail Design', 'Q&A Spec', 'Project Coordination'];
    }
    if (/business analyst|\bba\b|phân tích nghiệp vụ|product owner|product manager|\bpm\b/i.test(t)) {
      return ['SRS / User Story', 'BPMN / UML', 'Requirement Elicitation', 'Agile / Scrum'];
    }
    if (/fullstack|full-stack/i.test(t)) {
      return ['Java Spring Boot', 'React.js', 'PostgreSQL', 'RESTful API & Docker'];
    }
    if (/backend|back-end|java|spring|golang|node/i.test(t)) {
      return ['Java / Spring Boot', 'RESTful API', 'PostgreSQL / SQL', 'Microservices'];
    }
    if (/\bdata\b|dữ liệu|machine learning|\bai\b|python|deep learning/i.test(t)) {
      return ['Python & SQL', 'ETL Pipeline', 'Machine Learning', 'Data Warehousing'];
    }
    if (/marketing|seo|growth|content|brand|truyền thông/i.test(t)) {
      return ['SEO Strategy', 'Google Analytics', 'A/B Testing', 'Performance Ads'];
    }
    if (/kế toán|kiểm toán|accounting|audit|thuế|finance|tài chính/i.test(t)) {
      return ['Báo Cáo Tài Chính', 'Chuẩn Mực VAS / IFRS', 'Thuế & Dòng Tiền', 'Kiểm Soát Nội Bộ'];
    }
    if (/sales|kinh doanh|bán hàng|account executive|\bbd\b/i.test(t)) {
      return ['Đàm Phán & Chốt Deal', 'B2B Sales Pipeline', 'CRM Management', 'Xử Lý Từ Chối'];
    }
    if (/nhân sự|\bhr\b|human resources|talent acquisition|c&b/i.test(t)) {
      return ['Quy Trình Tuyển Dụng', 'Headhunting Nhân Tài', 'C&B & KPI', 'Luật Lao Động'];
    }
    return ['Java / Spring Boot', 'RESTful API', 'PostgreSQL / SQL', 'Microservices'];
  };

  // Kiểm tra xem kỹ năng có bị gắn lệch ngành nghiêm trọng hay không (ví dụ Tester dính Java backend)
  const isSkillsMismatched = (jobTitle = '', skills = []) => {
    const t = (jobTitle || '').toLowerCase();
    const joined = skills.join(' ').toLowerCase();

    // Tester nhưng dính Backend
    if (/\bqa\b|\bqc\b|tester|kiểm thử/i.test(t)) {
      const hasTestKw = /test|kiểm thử|qa|qc|bug|jira|selenium|postman|automation/i.test(joined);
      const hasBackendKw = /spring|java\b|backend|microservice|hibernate/i.test(joined);
      if (!hasTestKw && hasBackendKw) return true;
    }
    // BrSE nhưng dính Backend
    if (/brse|cầu nối|bridge|nhật/i.test(t)) {
      const hasBrseKw = /brse|nhật|japanese|design|sekkei|spec|bridge|cầu nối/i.test(joined);
      const hasBackendKw = /spring|java\b|backend|microservice/i.test(joined);
      if (!hasBrseKw && hasBackendKw) return true;
    }
    // Frontend nhưng dính Backend
    if (/frontend|front-end|ui\/ux/i.test(t)) {
      const hasFeKw = /react|vue|angular|frontend|html|css|javascript|typescript|ui|tailwind/i.test(joined);
      const hasBeKw = /spring|java\b|microservice|hibernate/i.test(joined);
      if (!hasFeKw && hasBeKw) return true;
    }
    // BA nhưng dính Backend
    if (/business analyst|\bba\b|phân tích nghiệp vụ/i.test(t)) {
      const hasBaKw = /ba\b|srs|user story|bpmn|uml|agile|scrum|requirement|elicitation/i.test(joined);
      const hasBackendKw = /spring|java\b|microservice|hibernate/i.test(joined);
      if (!hasBaKw && hasBackendKw) return true;
    }
    return false;
  };

  // Hàm trích xuất và làm sạch tag kỹ năng thông minh (loại bỏ 100% phúc lợi / lương thưởng)
  const extractCleanSkillTags = (job) => {
    if (!job) return [];
    const BENEFIT_SALARY_REGEX = /lương|phúc\s*lợi|bảo\s*hiểm|bhxh|healthcare|vnđ|vnd|usd|\$|thưởng|macbook|laptop|teambuilding|du\s*lịch|đãi\s*ngộ|tháng\s*13|khám\s*sức\s*khỏe|nghỉ\s*phép/i;
    const DESCRIPTIVE_PREFIX_REGEX = /^(thành thạo|có khả năng|kinh nghiệm|am hiểu|hiểu biết|sử dụng tốt|ưu tiên|yêu cầu|tối thiểu|từ|có kiến thức về|nắm vững|kinh nghiệm làm việc với)\s+/i;

    const rawCandidates = [];

    // Ưu tiên lấy từ mandatorySkills, preferredSkills, skills (TUYỆT ĐỐI KHÔNG LẤY job.benefits)
    const collectRaw = (arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (typeof item === 'string') {
            const trimmed = item.trim();
            if (trimmed && !BENEFIT_SALARY_REGEX.test(trimmed)) {
              rawCandidates.push(trimmed);
            }
          }
        });
      }
    };

    collectRaw(job.mandatorySkills);
    collectRaw(job.preferredSkills);
    collectRaw(job.skills);

    // Nếu vẫn rỗng, mới xem xét requirements
    if (rawCandidates.length === 0) {
      collectRaw(job.requirements);
    }

    const cleanSet = new Set();

    rawCandidates.forEach((text) => {
      // Nếu chuỗi dài hoặc chứa dấu phẩy / dấu chấm phẩy / &, tách nhỏ
      const parts = text.includes(',')
        ? text.split(',')
        : text.includes(';')
        ? text.split(';')
        : text.includes('&')
        ? text.split('&')
        : [text];

      parts.forEach((part) => {
        let clean = part
          .trim()
          .replace(BENEFIT_SALARY_REGEX, '')
          .replace(DESCRIPTIVE_PREFIX_REGEX, '')
          .replace(/^[-•*+–]\s*/, '')
          .replace(/\s*\(\s*(ưu tiên|bắt buộc|cơ bản|nâng cao)\s*\)/gi, '')
          .replace(/\b\d+\+?\s*(years?|năm)\b.*$/gi, '')
          .trim();

        clean = clean.replace(/[.,:;]+$/, '').trim();

        if (clean.length >= 2 && clean.length <= 35 && !BENEFIT_SALARY_REGEX.test(clean)) {
          cleanSet.add(clean);
        }
      });
    });

    const standardSkills = getStandardSkillsByTitle(job.title);
    const extractedList = Array.from(cleanSet);

    // Kiểm tra nếu rỗng hoặc bị gán nhầm kỹ năng (ví dụ Tester dính backend)
    if (extractedList.length === 0 || isSkillsMismatched(job.title, extractedList)) {
      return standardSkills;
    }

    return extractedList;
  };

  // Trích xuất toàn bộ kỹ năng kỹ thuật từ JD tuyển dụng thực tế
  const getJobSkills = (job) => {
    return extractCleanSkillTags(job);
  };

  // Trả về 8 chủ đề phỏng vấn thử thách thường gặp và placeholder lời dặn động theo vị trí
  const getDynamicChallengeTopics = (targetPosition = '') => {
    const combined = (targetPosition || '').toLowerCase();

    // 1. Nhóm QA / Tester
    if (/\bqa\b|\bqc\b|tester|kiểm thử|automation test|selenium/i.test(combined)) {
      return {
        topics: [
          'Thiết kế Test Case (Boundary & Equivalence)',
          'Quy trình Bug Life Cycle & Mức độ Severity/Priority',
          'Kiểm thử API với Postman & SQL Check DB',
          'Chiến lược Regression Test khi sát giờ Release',
          'Phân biệt & Kết hợp Manual vs Automation Test',
          'Xử lý tình huống Developer không nhận Bug',
          'Kiểm thử Hiệu năng (JMeter / Load Test)',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng viết Test Case bao phủ Edge Case, kiểm thử API bảo mật và xử lý mâu thuẫn với Dev khi không nhận Bug...',
      };
    }

    // 2. Nhóm Frontend
    if (/frontend|front-end|react|vue|angular|ui\/ux|next\.js/i.test(combined)) {
      return {
        topics: [
          'Tối ưu Re-render & Hiệu năng React.js',
          'Quản lý State phức tạp (Redux / Zustand / Context)',
          'Tối ưu Core Web Vitals & Thời gian tải trang',
          'Xử lý Bất đồng bộ, Race Condition & Caching API',
          'Bảo mật Frontend (XSS, CSRF, JWT Storage)',
          'Thiết kế Component tái sử dụng & Clean Code',
          'Responsive UI & Tương thích đa trình duyệt',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng tối ưu Core Web Vitals, xử lý Re-render thừa trong React và quản lý Global State với Redux/Zustand...',
      };
    }

    // 3. Nhóm BA / Product / BrSE
    if (/business analyst|\bba\b|phân tích nghiệp vụ|product owner|product manager|\bpm\b|brse|cầu nối|bridge|nhật|japanese/i.test(combined)) {
      return {
        topics: [
          'Khơi gợi yêu cầu & Xử lý mâu thuẫn Stakeholder',
          'Đặc tả tài liệu SRS, User Story & Acceptance Criteria',
          'Mô hình hóa quy trình nghiệp vụ (BPMN / Use Case)',
          'Quản lý thay đổi yêu cầu sát ngày Release (Scope Creep)',
          'Phối hợp đội ngũ Dev/QA & Nghiệm thu UAT',
          'Phân tích dữ liệu & Đánh giá hiệu quả tính năng',
          'Giao tiếp Hou-Ren-So & Q&A Spec với khách hàng',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng xử lý Scope Creep sát ngày ra mắt, viết User Story chuẩn INVEST và đàm phán giải pháp với khách hàng...',
      };
    }

    // 4. Nhóm Marketing
    if (/marketing|seo|sem|content|brand|truyền thông|growth/i.test(combined)) {
      return {
        topics: [
          'Tối ưu tỷ lệ chuyển đổi (CRO) và giảm chi phí CAC',
          'Xử lý khủng hoảng truyền thông hoặc chiến dịch không đạt KPI',
          'Chiến lược phân bổ ngân sách Performance Marketing đa kênh',
          'A/B Testing thông điệp quảng cáo và Landing Page',
          'Chiến lược Inbound Marketing & Tăng trưởng tự nhiên (SEO)',
          'Đo lường Attribution Model (Phân bổ chuyển đổi đa điểm chạm)',
          'Giữ chân người dùng và tối ưu vòng đời khách hàng (LTV)',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng lập chiến dịch Performance Marketing, tối ưu chi phí CAC và xử lý khi tỷ lệ chuyển đổi sụt giảm...',
      };
    }

    // 5. Nhóm Sales / Kinh Doanh
    if (/sales|kinh doanh|bán hàng|account executive|\bbd\b/i.test(combined)) {
      return {
        topics: [
          'Xử lý tình huống khách hàng chê giá đắt so với đối thủ',
          'Chiến lược Cold Outreach tiếp cận khách hàng doanh nghiệp (B2B)',
          'Thương lượng và chốt hợp đồng trong tình huống bế tắc',
          'Khai thác nhu cầu khách hàng theo phương pháp SPIN Selling',
          'Khôi phục quan hệ với khách hàng lớn có nguy cơ rời bỏ',
          'Tối ưu tỷ lệ chuyển đổi qua các giai đoạn trong Sales Pipeline',
          'Đạt chỉ tiêu doanh số (Quota) trong bối cảnh thị trường khó khăn',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng thuyết phục khách hàng doanh nghiệp khó tính, xử lý từ chối về giá và kỹ thuật chốt deal B2B...',
      };
    }

    // 6. Nhóm HR / Nhân Sự
    if (/nhân sự|\bhr\b|human resources|talent acquisition|c&b/i.test(combined)) {
      return {
        topics: [
          'Xử lý xung đột nội bộ và giữ chân nhân sự cốt cán xin nghỉ',
          'Chiến lược săn đầu người (Headhunting) cho các vị trí khó tuyển',
          'Xây dựng khung năng lực và chính sách đãi ngộ cạnh tranh (C&B)',
          'Tối ưu chỉ số Time-to-hire mà vẫn đảm bảo chất lượng ứng viên',
          'Giải quyết khiếu nại kỷ luật lao động đúng quy định pháp luật',
          'Nâng cao chỉ số gắn kết nhân viên (eNPS) và văn hóa công ty',
          'Xây dựng chương trình Onboarding giảm tỷ lệ nghỉ việc thử việc',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng phỏng vấn hành vi BEI, xử lý nhân sự chủ chốt đòi nghỉ việc và đàm phán lương thưởng C&B...',
      };
    }

    // 7. Nhóm Kế Toán / Tài Chính
    if (/kế toán|kiểm toán|accounting|audit|thuế|finance|tài chính/i.test(combined)) {
      return {
        topics: [
          'Xử lý chênh lệch số dư sổ sách và giải trình quyết toán thuế',
          'Kiểm soát rủi ro dòng tiền và tối ưu vốn lưu động',
          'Đánh giá tính hợp lý của chi phí và hóa đơn chứng từ',
          'Phân tích biến động biên lợi nhuận và chi phí dở dang',
          'Thiết lập quy trình kiểm soát nội bộ phòng chống thất thoát',
          'Áp dụng chuẩn mực kế toán VAS/IFRS trong ghi nhận doanh thu',
          'Lập kế hoạch ngân sách và dự báo dòng tiền 12 tháng',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng giải trình quyết toán thuế doanh nghiệp, quản trị dòng tiền lưu động và phân tích báo cáo tài chính...',
      };
    }

    // 8. Nhóm Data / AI / Machine Learning
    if (/\bdata\b|dữ liệu|machine learning|\bai\b|python|deep learning/i.test(combined)) {
      return {
        topics: [
          'Khắc phục Overfitting và Data Leakage trong huấn luyện',
          'Xử lý Missing Data & Imbalanced Classes trong tập dữ liệu',
          'Tối ưu truy vấn SQL phân tích trên bảng hàng triệu bản ghi',
          'Xây dựng luồng ETL/ELT chịu lỗi và giám sát Data Drift',
          'Đánh giá Trade-off giữa Precision, Recall và F1-Score',
          'Triển khai Model Serving với độ trễ thấp (Low Latency)',
          'Kiến trúc Data Lakehouse (Bronze - Silver - Gold)',
          'Khung trả lời tình huống STAR Method',
        ],
        placeholder:
          'Ví dụ: Em muốn rèn luyện kỹ năng tối ưu truy vấn dữ liệu lớn SQL, xử lý Data Leakage trong mô hình học máy và thiết kế pipeline ETL...',
      };
    }

    // 9. Mặc định: Backend / Fullstack
    return {
      topics: [
        'Tối ưu SQL & Index CSDL',
        'Xử lý Concurrency & Deadlock',
        'Kiến trúc Microservices & API',
        'System Design & Chịu tải cao',
        'Khung trả lời STAR Method',
        'Xử lý sự cố Memory Leak trên Production',
        'Bảo mật JWT / OAuth2',
        'Kiểm thử TDD & CI/CD Pipeline',
      ],
      placeholder:
        'Ví dụ: Em muốn rèn luyện sâu về xử lý Concurrency và tối ưu câu truy vấn Database, hãy hỏi xoáy vào tình huống xử lý Deadlock và Performance Bottleneck...',
    };
  };

  // Helper alias cho tương thích ngược
  const getChallengeTopics = (job, topic) => {
    const combined = ((job?.title || '') + ' ' + (topic || '')).trim();
    return getDynamicChallengeTopics(combined).topics;
  };

  // Thêm kỹ năng tùy chỉnh mà ứng viên tự nhập
  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!selectedFocusSkills.includes(trimmed)) {
      setSelectedFocusSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  };

  // Xóa kỹ năng khỏi danh sách trọng tâm
  const handleRemoveSkill = (skillToRemove) => {
    setSelectedFocusSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Fetch real jobs, candidate CVs and history on mount
  useEffect(() => {
    // Đọc tham số jobId từ URL hash (ví dụ #/ai-interview?jobId=15)
    const getUrlJobId = () => {
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        let match = hash.match(/[?&]jobId=([^&#]+)/);
        if (!match && search) {
          match = search.match(/[?&]jobId=([^&#]+)/);
        }
        return match ? decodeURIComponent(match[1]) : null;
      } catch {
        return null;
      }
    };
    const targetJobId = getUrlJobId();

    // 1. Load real jobs from HireMate
    jobApi.getJobs({ page: 0, size: 50 })
      .then(async (res) => {
        const list = res?.data?.content || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((j) => ({
            ...j,
            salaryText: formatSalary(j.salaryMin, j.salaryMax),
          }));
          setAvailableJobs(mapped);

          if (targetJobId) {
            const foundJob = mapped.find(
              (j) => String(j.jobId || j.id) === String(targetJobId)
            );
            if (foundJob) {
              setSelectedJob(foundJob);
              return;
            }
            // Nếu chưa có trong danh sách 50 tin, fetch trực tiếp getJobById
            try {
              const singleRes = await jobApi.getJobById(targetJobId);
              const singleJob = singleRes?.data || singleRes;
              if (singleJob && (singleJob.id || singleJob.jobId)) {
                const formatted = {
                  ...singleJob,
                  salaryText: formatSalary(singleJob.salaryMin, singleJob.salaryMax),
                };
                setAvailableJobs((prev) => [formatted, ...prev]);
                setSelectedJob(formatted);
                return;
              }
            } catch (singleErr) {
              console.warn('Could not load target job from URL:', singleErr);
            }
          }
          setSelectedJob(mapped[0]);
        } else if (targetJobId) {
          try {
            const singleRes = await jobApi.getJobById(targetJobId);
            const singleJob = singleRes?.data || singleRes;
            if (singleJob && (singleJob.id || singleJob.jobId)) {
              const formatted = {
                ...singleJob,
                salaryText: formatSalary(singleJob.salaryMin, singleJob.salaryMax),
              };
              setAvailableJobs([formatted]);
              setSelectedJob(formatted);
            }
          } catch (singleErr) {
            console.warn('Could not load target job from URL:', singleErr);
          }
        }
      })
      .catch((err) => console.warn('Could not load jobs:', err));

    // 2. Load candidate CVs
    cvApi.getMyCvs()
      .then((res) => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setMyCvs(list);
          const defaultCv = list.find((c) => c.isDefault) || list[0];
          setSelectedCv(defaultCv);
        }
      })
      .catch((err) => console.warn('Could not load CVs:', err));

    // 3. Load interview history cô lập riêng biệt theo tài khoản đang đăng nhập
    const userHistoryCacheKey = user?.userId ? `hiremate_interview_history_${user.userId}` : 'hiremate_interview_history_guest';
    try {
      localStorage.removeItem('hiremate_interview_history'); // Dọn dẹp cache cũ dùng chung
      const cached = JSON.parse(localStorage.getItem(userHistoryCacheKey) || '[]');
      const sanitized = Array.isArray(cached) ? cached.map((item) => {
        const rawScore = item.totalScore != null ? Math.round(item.totalScore) : 0;
        const finalScore = rawScore;
        const grade = finalScore >= 85 ? 'Xuất Sắc' : finalScore >= 70 ? 'Đạt Yêu Cầu' : finalScore >= 50 ? 'Cần Rèn Luyện Thêm' : 'Chưa Hoàn Tất';
        return { ...item, totalScore: finalScore, grade };
      }) : [];
      setHistoryList(sanitized);
    } catch {
      setHistoryList([]);
    }
    fetchRealHistory();

    // 4. Load AI Interview Room Config (Persona & Difficulty)
    interviewApi.getConfig()
      .then((res) => {
        if (res?.data) {
          setInterviewConfig(res.data);
        }
      })
      .catch((err) => console.warn('Could not load interview room config:', err));

    // 5. Load Candidate Subscription Plan & Quota from Supabase
    fetchQuotaStatus();
  }, [user]);

  const fetchQuotaStatus = async () => {
    try {
      const res = await interviewApi.getQuotaStatus();
      const data = res?.data?.data || res?.data;
      if (data) {
        setQuotaStatus(data);
      }
    } catch (err) {
      console.warn('Could not load candidate quota status:', err);
    }
  };


  // Safety Guard: Ngăn chặn tuyệt đối việc vào 'live' (Phòng Phỏng Vấn) khi chưa bắt đầu phiên
  useEffect(() => {
    if (view === 'live' && !isLiveSessionRef.current) {
      setView('setup');
    }
  }, [view]);

  // Phân tích sâu CV bằng AI logic để may đo các vị trí phỏng vấn mục tiêu đa ngành nghề (AI Tailored Practice Tracks)
  const generateAiTracksFromCv = (cv) => {
    if (!cv) return [];

    const rawSkills = [];
    if (Array.isArray(cv.detectedSkills)) rawSkills.push(...cv.detectedSkills);
    if (Array.isArray(cv.skills)) rawSkills.push(...cv.skills);
    if (Array.isArray(cv.parsedData?.skills)) rawSkills.push(...cv.parsedData.skills);
    if (cv.parsedText) {
      const textLower = cv.parsedText.toLowerCase();
      const techPool = [
        'Java', 'Spring Boot', 'React', 'ReactJS', 'TypeScript', 'JavaScript', 'Node.js',
        'Python', 'FastAPI', 'Django', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker',
        'Kubernetes', 'AWS', 'Microservices', 'RESTful API', 'Git', 'CI/CD', 'Flutter',
        'Golang', 'Vue.js', 'Next.js', 'Tailwind CSS', 'Redis', 'Kafka', 'GraphQL'
      ];
      techPool.forEach((t) => {
        if (textLower.includes(t.toLowerCase()) && !rawSkills.includes(t)) {
          rawSkills.push(t);
        }
      });
    }

    const uniqueSkills = Array.from(new Set(rawSkills.map((s) => String(s).trim()))).filter(Boolean);
    const skillsLower = uniqueSkills.map((s) => s.toLowerCase());
    const fullCvText = [
      cv.parsedText || '',
      cv.headline || '',
      cv.title || '',
      cv.summary || '',
      cv.content || '',
      ...uniqueSkills,
    ].join(' ').toLowerCase();

    const tracks = [];

    // Nhận diện các ngành nghề kinh tế / phi kỹ thuật (Non-Tech Domains)
    const hasFinance = fullCvText.includes('kế toán') || fullCvText.includes('kiểm toán') || fullCvText.includes('tài chính') ||
      fullCvText.includes('bctc') || fullCvText.includes('thuế') || fullCvText.includes('vat') || fullCvText.includes('tndn') ||
      fullCvText.includes('vas') || fullCvText.includes('ifrs') || fullCvText.includes('misa') || fullCvText.includes('công nợ') ||
      fullCvText.includes('ngân hàng') || fullCvText.includes('accounting') || fullCvText.includes('finance') || fullCvText.includes('audit');

    const hasMarketing = fullCvText.includes('marketing') || fullCvText.includes('seo') || fullCvText.includes('sem') ||
      fullCvText.includes('content') || fullCvText.includes('truyền thông') || fullCvText.includes('digital marketing') ||
      fullCvText.includes('facebook ads') || fullCvText.includes('google ads') || fullCvText.includes('tiktok') ||
      fullCvText.includes('roas') || fullCvText.includes('brand') || fullCvText.includes('chiến dịch') || fullCvText.includes('quảng cáo');

    const hasSales = fullCvText.includes('sales') || fullCvText.includes('kinh doanh') || fullCvText.includes('bán hàng') ||
      fullCvText.includes('phát triển thị trường') || fullCvText.includes('business development') || fullCvText.includes('b2b') ||
      fullCvText.includes('b2c') || fullCvText.includes('crm') || fullCvText.includes('chốt đơn') || fullCvText.includes('đàm phán') ||
      fullCvText.includes('doanh số') || fullCvText.includes('kpi sales') || fullCvText.includes('khách hàng mục tiêu');

    const hasHr = fullCvText.includes('nhân sự') || fullCvText.includes('hr') || fullCvText.includes('tuyển dụng') ||
      fullCvText.includes('c&b') || fullCvText.includes('talent acquisition') || fullCvText.includes('headhunt') ||
      fullCvText.includes('tiền lương') || fullCvText.includes('phúc lợi') || fullCvText.includes('bhxh') ||
      fullCvText.includes('luật lao động') || fullCvText.includes('onboarding') || fullCvText.includes('văn hóa doanh nghiệp');

    const hasBA = fullCvText.includes('business analyst') || fullCvText.includes('product owner') || fullCvText.includes('product manager') ||
      fullCvText.includes('scrum master') || fullCvText.includes('brd') || fullCvText.includes('srs') || fullCvText.includes('user story') ||
      fullCvText.includes('use case') || fullCvText.includes('bpmn') || fullCvText.includes('phân tích nghiệp vụ') || fullCvText.includes('backlog');

    const hasQA = fullCvText.includes('tester') || fullCvText.includes('test case') || fullCvText.includes('test plan') ||
      fullCvText.includes('selenium') || fullCvText.includes('postman') || fullCvText.includes('jmeter') || fullCvText.includes('automation test') ||
      fullCvText.includes('manual test') || fullCvText.includes('kiểm thử') || fullCvText.includes('quality assurance') || fullCvText.includes('qa/qc');

    const hasLogistics = fullCvText.includes('logistics') || fullCvText.includes('chuỗi cung ứng') || fullCvText.includes('supply chain') ||
      fullCvText.includes('xuất nhập khẩu') || fullCvText.includes('hải quan') || fullCvText.includes('incoterms') || fullCvText.includes('tờ khai') ||
      fullCvText.includes('vnaccs') || fullCvText.includes('kho bãi') || fullCvText.includes('wms') || fullCvText.includes('forwarder');

    const isNonTechCv = (hasFinance || hasMarketing || hasSales || hasHr || hasLogistics) &&
      !skillsLower.some((s) => s.includes('java') || s.includes('python') || s.includes('react') || s.includes('docker') || s.includes('kubernetes'));

    // 1. Phân nhánh Kế toán / Kiểm toán / Tài chính
    if (hasFinance) {
      tracks.push({
        id: 'track-finance-accounting',
        title: 'Chuyên viên Kế toán & Quản trị Tài chính Doanh nghiệp',
        domain: 'Tài chính, Kế toán & Kiểm toán',
        matchScore: 95,
        focusSkills: ['Báo cáo tài chính (BCTC)', 'Chuẩn mực VAS / IFRS', 'Quyết toán thuế & Hóa đơn', 'Phần mềm MISA / SAP', 'Quản trị dòng tiền'],
        reasoning: 'Hồ sơ thể hiện nền tảng vững vàng về nghiệp vụ kế toán, đối chiếu chứng từ và tuân thủ thuế. AI sẽ đào sâu vào kiểm soát rủi ro tài chính, cân đối dòng tiền và lập báo cáo quản trị.',
        interviewFocus: 'Kiểm soát nội bộ, tối ưu thuế TNDN/GTGT, lập báo cáo lưu chuyển tiền tệ và phản biện số liệu chi phí.',
      });
    }

    // 2. Phân nhánh Marketing / Truyền thông / SEO
    if (hasMarketing) {
      tracks.push({
        id: 'track-digital-marketing',
        title: 'Digital Marketing & Performance Campaign Specialist',
        domain: 'Digital Marketing & Brand Growth',
        matchScore: 94,
        focusSkills: ['Chiến dịch Performance (Ads)', 'Chiến lược Content & SEO', 'Phễu chuyển đổi & CVR', 'Phân tích chỉ số ROAS/CAC', 'Quản trị thương hiệu'],
        reasoning: 'CV có thế mạnh nổi bật về truyền thông số và tối ưu chiến dịch đa kênh. AI sẽ tập trung vào tư duy phân tích tệp khách hàng mục tiêu, tối ưu chi phí quảng cáo và xử lý khủng hoảng truyền thông.',
        interviewFocus: 'Tối ưu chỉ số ROAS/CAC, lập kế hoạch chiến dịch ra mắt sản phẩm mới, xây dựng content viral và A/B testing.',
      });
    }

    // 3. Phân nhánh Kinh doanh / Sales / BD
    if (hasSales) {
      tracks.push({
        id: 'track-sales-bd',
        title: 'Chuyên viên Phát triển Kinh doanh & Bán hàng B2B/B2C (Sales / BD)',
        domain: 'Bán hàng, Đàm phán & Phát triển Đối tác',
        matchScore: 93,
        focusSkills: ['Quy trình Sales Pipeline & CRM', 'Kỹ năng Đàm phán & Thuyết phục', 'Xử lý từ chối (Objection Handling)', 'Chăm sóc & Mở rộng khách hàng', 'Vượt chỉ tiêu doanh số (KPI/Quota)'],
        reasoning: 'Hồ sơ nổi bật với năng lực khai phá thị trường và kỹ năng tương tác khách hàng. AI sẽ thử thách khả năng xử lý từ chối của khách hàng khó tính, nghệ thuật chốt hợp đồng và chiến lược quản lý phễu khách hàng.',
        interviewFocus: 'Chiến thuật SPIN selling, đàm phán hợp đồng giá trị cao, phục hồi khách hàng rời bỏ và vượt quota doanh số.',
      });
    }

    // 4. Phân nhánh Nhân sự (HR / C&B / Tuyển dụng)
    if (hasHr) {
      tracks.push({
        id: 'track-hr-talent',
        title: 'Chuyên viên Nhân sự Tổng hợp & Tuyển dụng (HR / Talent Acquisition)',
        domain: 'Quản trị Nguồn nhân lực & Văn hóa Doanh nghiệp',
        matchScore: 92,
        focusSkills: ['Tuyển dụng & Headhunting', 'Chế độ C&B & Luật Lao động', 'Đánh giá năng lực (KPI/OKR)', 'Đào tạo & Onboarding', 'Giữ chân nhân tài (Retention)'],
        reasoning: 'CV thể hiện kỹ năng toàn diện về quản trị nhân sự và quy trình tuyển chọn ứng viên. AI sẽ khảo sát khả năng phỏng vấn sàng lọc, xử lý tranh chấp lao động và xây dựng chính sách phúc lợi giữ chân nhân viên.',
        interviewFocus: 'Xây dựng thương hiệu nhà tuyển dụng, giải quyết xung đột nội bộ, tuân thủ Luật Lao động và tối ưu tỷ lệ turnover.',
      });
    }

    // 5. Phân nhánh BA / Product Manager
    if (hasBA) {
      tracks.push({
        id: 'track-business-analyst',
        title: 'Business Analyst & Product Specialist (Chuyên viên Phân tích Nghiệp vụ)',
        domain: 'Phân tích Nghiệp vụ & Quản lý Sản phẩm',
        matchScore: 94,
        focusSkills: ['Khảo sát & Đặc tả yêu cầu (BRD/SRS)', 'Vẽ luồng nghiệp vụ (BPMN/UML)', 'User Story & Acceptance Criteria', 'Quản trị Scope & Backlog', 'Phối hợp Stakeholders & UAT'],
        reasoning: 'Hồ sơ có năng lực cầu nối xuất sắc giữa nghiệp vụ kinh doanh và đội ngũ công nghệ. AI sẽ kiểm tra khả năng bóc tách yêu cầu phức tạp, giải quyết xung đột phạm vi dự án và tối ưu quy trình vận hành.',
        interviewFocus: 'Khai thác Requirement từ Stakeholders khó tính, xử lý Scope Creep, thiết kế Use Case và nghiệm thu UAT.',
      });
    }

    // 6. Phân nhánh QA / QC / Kiểm thử phần mềm
    if (hasQA) {
      tracks.push({
        id: 'track-qa-tester',
        title: 'Software Quality Assurance & Automation Test Engineer (QA/QC)',
        domain: 'Software Quality Assurance & Testing',
        matchScore: 95,
        focusSkills: ['Thiết kế Test Cases & Test Scenarios', 'Kiểm thử Hướng biên & Bảng quyết định', 'API Testing (Postman/RestAssured)', 'Automation Testing', 'Quản lý Bug & UAT'],
        reasoning: 'Hồ sơ có thế mạnh rõ nét về kiểm soát chất lượng phần mềm. AI sẽ tập trung khai thác tư duy tìm bắt lỗi tiềm ẩn, phương pháp thiết kế ca kiểm thử tối ưu và kinh nghiệm kiểm thử hồi quy/tải cao.',
        interviewFocus: 'Kỹ thuật phân vùng tương đương, kiểm thử biên, API testing, viết automation script và quản trị vòng đời bug.',
      });
    }

    // 7. Phân nhánh Logistics & Xuất nhập khẩu
    if (hasLogistics) {
      tracks.push({
        id: 'track-logistics-supplychain',
        title: 'Chuyên viên Logistics & Xuất Nhập Khẩu (Supply Chain Specialist)',
        domain: 'Chuỗi Cung Ứng & Thủ Tục Ngoại Thương',
        matchScore: 93,
        focusSkills: ['Thủ tục Hải quan & Tờ khai VNACCS', 'Quy chuẩn Incoterms', 'Quản trị Kho vận (WMS/Inventory)', 'Vận tải Quốc tế & Forwarder', 'Tối ưu hóa Chi phí Chuỗi cung ứng'],
        reasoning: 'CV thể hiện kiến thức chuyên sâu về nghiệp vụ xuất nhập khẩu và điều phối hàng hóa. AI sẽ đặt ra các bài toán giải quyết sự cố thông quan, lựa chọn điều kiện Incoterms và tối ưu tồn kho.',
        interviewFocus: 'Xử lý vướng mắc tờ khai hải quan, đàm phán cước tàu forwarder, áp dụng Incoterms 2020 và kiểm soát lead time.',
      });
    }

    // 8. Nhận diện các ngành Công nghệ Phần mềm (Tech Tracks)
    const hasJava = skillsLower.some((s) => s.includes('java') || s.includes('spring'));
    const hasReact = skillsLower.some((s) => s.includes('react') || s.includes('typescript') || s.includes('frontend') || s.includes('next'));
    const hasPython = skillsLower.some((s) => s.includes('python') || s.includes('django') || s.includes('fastapi') || s.includes('ai') || s.includes('machine learning'));
    const hasNode = skillsLower.some((s) => s.includes('node') || s.includes('express') || s.includes('nest'));
    const hasDevOps = skillsLower.some((s) => s.includes('docker') || s.includes('kubernetes') || s.includes('aws') || s.includes('ci/cd') || s.includes('cloud'));
    const hasMobile = skillsLower.some((s) => s.includes('flutter') || s.includes('dart') || s.includes('react native') || s.includes('mobile'));

    if (hasJava) {
      tracks.push({
        id: 'track-java-backend',
        title: 'Senior Java & Spring Boot Backend Engineer',
        domain: 'Backend & Enterprise Architecture',
        matchScore: 96,
        focusSkills: ['Java Core', 'Spring Boot', 'Microservices', 'RESTful API', 'PostgreSQL'],
        reasoning: 'CV của bạn có thế mạnh nổi trội về hệ sinh thái Java / Spring Boot. AI sẽ tập trung khai thác chuyên sâu kiến trúc Microservices, quản lý Transaction, tối ưu truy vấn Database và xử lý Concurrency.',
        interviewFocus: 'Kiến trúc hệ thống phân tán, xử lý tải cao, Spring Security và JPA Hibernate optimization.',
      });
    }

    if (hasReact) {
      tracks.push({
        id: 'track-react-frontend',
        title: 'Frontend React.js & TypeScript Specialist',
        domain: 'Web Performance & Modern UI',
        matchScore: 94,
        focusSkills: ['React.js', 'TypeScript', 'Next.js', 'Tailwind CSS', 'RESTful API'],
        reasoning: 'Hồ sơ thể hiện năng lực vững chắc về React và phát triển giao diện hiện đại. AI sẽ kiểm tra chuyên sâu tư duy Component Lifecycle, State Management (Redux/Zustand), Web Performance và SSR.',
        interviewFocus: 'Render lifecycle, Virtual DOM, Custom Hooks, Clean Code và trải nghiệm người dùng cao cấp.',
      });
    }

    if ((hasJava && hasReact) || (hasNode && hasReact)) {
      tracks.push({
        id: 'track-fullstack-engineer',
        title: 'Fullstack Software Engineer (Web & APIs)',
        domain: 'End-to-End Product Development',
        matchScore: 92,
        focusSkills: ['Java / Spring Boot', 'React.js', 'RESTful API', 'PostgreSQL', 'Docker'],
        reasoning: 'Hồ sơ có khả năng bao quát toàn diện từ tầng cơ sở dữ liệu, API Backend tới giao diện người dùng. AI sẽ đánh giá tư duy kết nối hệ thống, bảo mật JWT và triển khai container hóa.',
        interviewFocus: 'Tích hợp Frontend-Backend, thiết kế API chuẩn REST, bảo mật xác thực và tối ưu độ trễ mạng.',
      });
    }

    if (hasPython) {
      tracks.push({
        id: 'track-python-ai',
        title: 'Python Backend & AI Integration Engineer',
        domain: 'AI Applications & Microservices',
        matchScore: 90,
        focusSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AI / LLM Integration'],
        reasoning: 'CV thể hiện kỹ năng lập trình Python hiện đại. AI sẽ tập trung vào tư duy lập trình bất đồng bộ (asyncio), kiến trúc API RESTful hiệu năng cao và kinh nghiệm tích hợp mô hình GenAI / LLM.',
        interviewFocus: 'Async processing, ORM database, containerization và kiểm soát chi phí token API.',
      });
    }

    // TUYỆT ĐỐI CHỈ gợi ý DevOps khi có kỹ năng DevOps VÀ KHÔNG PHẢI ngành phi kỹ thuật
    if (hasDevOps && !isNonTechCv) {
      tracks.push({
        id: 'track-devops-cloud',
        title: 'Cloud DevOps & CI/CD Platform Engineer',
        domain: 'Infrastructure & Automation',
        matchScore: 88,
        focusSkills: ['Docker', 'Kubernetes', 'CI/CD Pipeline', 'AWS / Cloud', 'Linux'],
        reasoning: 'Hồ sơ có định hướng quản trị hạ tầng và tự động hóa triển khai. AI sẽ khảo sát khả năng thiết kế pipeline kiểm thử tự động, giám sát dịch vụ và tối ưu tính sẵn sàng của hệ thống.',
        interviewFocus: 'Container orchestration, monitoring & alerting, hạ tầng dự phòng và bảo mật hạ tầng mạng.',
      });
    }

    if (hasMobile) {
      tracks.push({
        id: 'track-mobile-flutter',
        title: 'Mobile Engineer (Flutter / Cross-Platform)',
        domain: 'Mobile Application Architecture',
        matchScore: 91,
        focusSkills: ['Flutter', 'Dart', 'State Management (BLoC/Provider)', 'RESTful API'],
        reasoning: 'Hồ sơ thể hiện kỹ năng phát triển ứng dụng di động đa nền tảng. AI sẽ kiểm tra kiến trúc ứng dụng di động, xử lý offline data và tối ưu hiệu năng render 60fps.',
        interviewFocus: 'App lifecycle, memory leak prevention, async networking và tối ưu hóa trải nghiệm di động.',
      });
    }

    // Fallback thông minh: nếu chưa nhận diện được track cụ thể nào
    if (tracks.length === 0) {
      if (isNonTechCv) {
        tracks.push({
          id: 'track-general-business',
          title: cv.headline || 'Chuyên viên Nghiệp vụ & Vận hành Doanh nghiệp',
          domain: 'Nghiệp vụ Doanh nghiệp & Vận hành',
          matchScore: 88,
          focusSkills: ['Kỹ năng giao tiếp & đàm phán', 'Giải quyết vấn đề nghiệp vụ', 'Lập kế hoạch & báo cáo', 'Quy trình vận hành'],
          reasoning: `Dựa trên hồ sơ CV ${cv.title || cv.fileName || ''}, AI đã may đo lộ trình phỏng vấn nghiệp vụ chuyên sâu bám sát kinh nghiệm thực tế của bạn.`,
          interviewFocus: 'Tư duy xử lý tình huống nghiệp vụ, phối hợp liên phòng ban và tối ưu hóa hiệu quả công việc.',
        });
      } else {
        const topSkills = uniqueSkills.slice(0, 4);
        tracks.push({
          id: 'track-general-tech',
          title: cv.headline || 'Software Engineer (Kỹ Sư Phần Mềm)',
          domain: 'Software Engineering & System Fundamentals',
          matchScore: 85,
          focusSkills: topSkills.length > 0 ? topSkills : ['OOP', 'Data Structures', 'RESTful API', 'SQL'],
          reasoning: `Dựa trên hồ sơ CV ${cv.title || cv.fileName || ''}, AI đã tổng hợp các kỹ năng cốt lõi để xây dựng kịch bản phỏng vấn bám sát kinh nghiệm thực tế của bạn.`,
          interviewFocus: 'Tư duy giải quyết vấn đề, thuật toán, thiết kế cơ sở dữ liệu và làm việc nhóm trong môi trường Agile.',
        });
      }
    }

    return tracks;
  };

  // So khớp và tính điểm độ tương thích tại chỗ giữa availableJobs với CV của ứng viên
  const scoreJobsLocallyWithCv = (jobs, cv) => {
    if (!Array.isArray(jobs) || jobs.length === 0) return [];
    if (!cv) return jobs;

    const cvSkills = [];
    if (Array.isArray(cv.detectedSkills)) cvSkills.push(...cv.detectedSkills);
    if (Array.isArray(cv.skills)) cvSkills.push(...cv.skills);
    if (Array.isArray(cv.parsedData?.skills)) cvSkills.push(...cv.parsedData.skills);
    if (cv.parsedText) {
      const textLower = cv.parsedText.toLowerCase();
      ['Java', 'Spring Boot', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'RESTful API', 'Microservices', 'SQL', 'Git']
        .forEach((t) => { if (textLower.includes(t.toLowerCase())) cvSkills.push(t); });
    }
    const cvSkillsLower = Array.from(new Set(cvSkills.map((s) => String(s).toLowerCase().trim()))).filter(Boolean);

    return jobs.map((job) => {
      const jobSkills = getJobSkills(job);
      const matched = [];
      const missing = [];

      jobSkills.forEach((js) => {
        const jsLower = js.toLowerCase();
        if (cvSkillsLower.some((cs) => cs.includes(jsLower) || jsLower.includes(cs))) {
          matched.push(js);
        } else {
          missing.push(js);
        }
      });

      let score = 70;
      if (jobSkills.length > 0) {
        score = Math.round(55 + ((matched.length / jobSkills.length) * 40));
      } else {
        score = 82;
      }
      score = Math.min(98, Math.max(62, score));

      const reasoning = matched.length > 0
        ? `CV của bạn đã khớp ${matched.length}/${jobSkills.length} kỹ năng trọng tâm: ${matched.slice(0, 3).join(', ')}. Đây là vị trí rất phù hợp để luyện tập phỏng vấn thực tế.`
        : `Vị trí bám sát định hướng của bạn. Phù hợp để thử thách mở rộng phạm vi kỹ thuật qua buổi phỏng vấn AI.`;

      return {
        ...job,
        matchingScore: score,
        matchScore: score,
        matchedMandatorySkills: matched,
        missingMandatorySkills: missing,
        aiReasoning: reasoning,
      };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  // Chọn một vị trí mục tiêu do AI may đo
  const handleSelectAiTrack = (track) => {
    setSelectedTrackId(track.id);
    const mockTrackJob = {
      jobId: track.id,
      title: track.title,
      companyName: 'HireMate AI Practice Track',
      location: 'Toàn quốc (Live Studio)',
      salaryText: 'Đề xuất AI cá nhân hóa',
      matchScore: track.matchScore,
      skills: track.focusSkills,
      mandatorySkills: track.focusSkills,
      requirements: [track.interviewFocus],
      description: track.reasoning,
      aiReasoning: track.reasoning,
      isAiTrack: true,
    };
    setSelectedJob(mockTrackJob);
    setSelectedFocusSkills(track.focusSkills);
    showToast(`✨ Đã chọn vị trí "${track.title}" do AI may đo!`);
  };

  // Tự động cập nhật AI Practice Tracks khi ứng viên đổi CV tại bước 2
  useEffect(() => {
    if (selectedCv) {
      const tracks = generateAiTracksFromCv(selectedCv);
      setAiTailoredTracks(tracks);
    }
  }, [selectedCv]);

  // Kích hoạt phân tích AI và tải danh sách việc làm gợi ý
  const handleLoadAiRecommendations = async (forceRefresh = false) => {
    setContextMode('ai-recommend');

    const activeCv = selectedCv || myCvs[0];
    if (activeCv) {
      const tracks = generateAiTracksFromCv(activeCv);
      setAiTailoredTracks(tracks);
      if ((!selectedJob || selectedJob.isAiTrack) && tracks.length > 0 && !selectedTrackId) {
        handleSelectAiTrack(tracks[0]);
      }
    }

    if (!forceRefresh && recommendedJobs.length > 0) return;

    setIsAiLoadingRecommend(true);
    try {
      let mapped = [];

      // 1. Gọi API gợi ý việc làm chuẩn ATS qua jobApi.getRecommendations
      try {
        const res = await jobApi.getRecommendations({ minMatch: 30, limit: 12 });
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          mapped = list.map((m) => ({
            jobId: m.jobId,
            title: m.title || m.jobTitle || 'Chuyên viên Kỹ thuật',
            companyName: m.companyName || 'Doanh nghiệp Tuyển dụng',
            location: m.location || 'Toàn quốc',
            salaryText: formatSalary(m.salaryMin, m.salaryMax),
            matchScore: Math.round(m.matchingScore || 75),
            matchedMandatorySkills: m.matchedSkills || m.matchedMandatorySkills || [],
            missingMandatorySkills: m.missingSkills || m.missingMandatorySkills || [],
            aiReasoning: m.aiReasoning || '',
            requirements: m.requirements || [],
            skills: m.skills || [],
            mandatorySkills: m.mandatorySkills || [],
            preferredSkills: m.preferredSkills || [],
          }));
        }
      } catch (err) {
        console.warn('jobApi.getRecommendations failed, trying fallback:', err);
      }

      // 2. Nếu chưa có, gọi POST /jobs/re-match để kích hoạt tính toán so khớp ngay lập tức
      if (mapped.length === 0) {
        try {
          const res = await jobApi.reMatch();
          const list = res?.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list) && list.length > 0) {
            mapped = list.map((m) => ({
              jobId: m.jobId,
              title: m.title || m.jobTitle || 'Chuyên viên Kỹ thuật',
              companyName: m.companyName || 'Doanh nghiệp Tuyển dụng',
              location: m.location || 'Toàn quốc',
              salaryText: formatSalary(m.salaryMin, m.salaryMax),
              matchScore: Math.round(m.matchingScore || 75),
              matchedMandatorySkills: m.matchedSkills || m.matchedMandatorySkills || [],
              missingMandatorySkills: m.missingSkills || m.missingMandatorySkills || [],
              aiReasoning: m.aiReasoning || '',
              requirements: m.requirements || [],
              skills: m.skills || [],
              mandatorySkills: m.mandatorySkills || [],
              preferredSkills: m.preferredSkills || [],
            }));
          }
        } catch (err) {
          console.warn('jobApi.reMatch failed, trying fallback:', err);
        }
      }

      // 3. Fallback: So khớp có sẵn từ danh sách việc làm trên hệ thống
      if (mapped.length === 0 && availableJobs.length > 0) {
        mapped = scoreJobsLocallyWithCv(availableJobs, activeCv);
      }

      setRecommendedJobs(mapped);
      if (mapped.length > 0 && (!selectedJob || selectedJob.isAiTrack === undefined)) {
        setSelectedJob(mapped[0]);
      }

      showToast(`🎯 AI đã phân tích CV và tìm thấy ${mapped.length} vị trí phù hợp!`);
    } catch (err) {
      console.warn('Could not load AI recommendations:', err);
      if (availableJobs.length > 0) {
        const scored = scoreJobsLocallyWithCv(availableJobs, activeCv);
        setRecommendedJobs(scored);
        if (scored.length > 0 && !selectedJob) setSelectedJob(scored[0]);
      }
    } finally {
      setIsAiLoadingRecommend(false);
    }
  };

  // Timer loop
  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerOn]);

  // Kiểm soát thời gian tối đa theo gói Supabase (Đồng hồ đếm ngược hết giờ)
  useEffect(() => {
    if (view === 'live' && isLiveSessionRef.current && timerSec > 0) {
      const maxDur = quotaStatus?.maxDurationSeconds || 300;
      if (timerSec >= maxDur) {
        showToast('⏱️ Buổi phỏng vấn đã kết thúc vì hết thời gian tối đa quy định của gói!');
        handleFinishInterview(true);
      }
    }
  }, [timerSec, view, quotaStatus]);


  // Auto-scroll chat feed
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueHistory, isAiThinking]);

  // Clean up speech, mic & camera on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources();
      stopCamera();
    };
  }, []);

  // WebCam Video Stream Management & Real-time Vision Telemetry
  const startCamera = async () => {
    try {
      if (simVisionIntervalRef.current) {
        clearInterval(simVisionIntervalRef.current);
        simVisionIntervalRef.current = null;
      }
      setIsSimulatedCamera(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('unsupported');
        setIsCameraOn(false);
        showToast('⚠️ Trình duyệt của bạn không hỗ trợ camera WebRTC.');
        return;
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
      } catch (constraintErr) {
        console.warn('Strict camera constraints failed, retrying with basic { video: true }:', constraintErr);
        // Fallback: Thử lại với cấu hình video cơ bản nếu facingMode hoặc 1280x720 bị từ chối
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch (e) {}
      }
      telemetryHistoryRef.current.hasCameraEverBeenOn = true;
      setIsCameraOn(true);
      setCameraError(null);
      startVisionAnalysis();
      showToast('📹 Camera phỏng vấn đã kích hoạt.');
    } catch (err) {
      console.warn('Không thể truy cập WebCam:', err);
      setIsCameraOn(false);
      let errType = 'generic';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errType = 'permission_denied';
        showToast('⚠️ Quyền camera đang bị chặn trên trình duyệt.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errType = 'in_use';
        showToast('⚠️ Camera đang bị ứng dụng khác (Zoom, Teams, Meet...) chiếm giữ.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errType = 'not_found';
        showToast('⚠️ Không tìm thấy thiết bị camera nào trên máy.');
      } else {
        showToast('⚠️ Không thể bật camera: ' + (err.message || 'Lỗi thiết bị'));
      }
      setCameraError(errType);
    }
  };

  const startSimulatedVision = () => {
    stopCamera();
    telemetryHistoryRef.current.hasCameraEverBeenOn = true;
    setIsSimulatedCamera(true);
    setIsCameraOn(true);
    setCameraError(null);
    showToast('✨ Đã bật Chế Độ Quét Khuôn Mặt Ảo AI (Simulated Vision).');

    if (simVisionIntervalRef.current) clearInterval(simVisionIntervalRef.current);
    simVisionIntervalRef.current = setInterval(() => {
      if (!isLiveSessionRef.current) return;
      const eyeContact = Math.round(85 + Math.random() * 9);
      const postures = ['Chuẩn mực • Thẳng lưng', 'Tự tin • Hướng về phía trước', 'Chuẩn mực'];
      const emotions = ['Tự tin & Thân thiện 😊', 'Tập trung suy nghĩ 🤔', 'Nghiêm túc • Chuyên nghiệp 💼'];
      const posture = postures[Math.floor(Math.random() * postures.length)];
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];

      setLiveEyeContactPercent(eyeContact);
      setLivePostureStatus(posture);
      setLiveFacialEmotion(emotion);
      setDetectedFaceBox({
        x: Math.round(33 + Math.sin(Date.now() / 2500) * 3),
        y: Math.round(18 + Math.cos(Date.now() / 2000) * 2),
        w: 34,
        h: 40,
      });

      telemetryHistoryRef.current.eyeContactSamples.push(eyeContact);
      telemetryHistoryRef.current.emotions.confident++;
      if (telemetryHistoryRef.current.postures) {
        telemetryHistoryRef.current.postures.good++;
      }
    }, 1200);
  };

  const stopCamera = () => {
    stopVisionAnalysis();
    if (simVisionIntervalRef.current) {
      clearInterval(simVisionIntervalRef.current);
      simVisionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setIsSimulatedCamera(false);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
      showToast('Đã tắt camera.');
    } else {
      startCamera();
    }
  };

  // Tự động gán stream vào video tag khi camera bật hoặc video tag mount
  useEffect(() => {
    if (isCameraOn && !isSimulatedCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOn, isSimulatedCamera, view]);

  // Lắng nghe thay đổi quyền camera của trình duyệt để tự động kết nối lại khi người dùng cấp quyền
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setCameraError('permission_denied');
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') {
              setCameraError(null);
              if (isLiveSessionRef.current && !isCameraOn) {
                startCamera();
              }
            } else if (permissionStatus.state === 'denied') {
              setCameraError('permission_denied');
            }
          };
        })
        .catch(() => {});
    }
  }, []);

  // Quản lý phòng phỏng vấn: Tự động khởi động WebCam & Micro khi vào phòng Live; Hủy ngay lập tức khi rời phòng
  useEffect(() => {
    if (view === 'live') {
      isLiveSessionRef.current = true;
      // Kích hoạt nạp trước mô hình Google MediaPipe Face Landmarker để tracking tức thì
      if (!mediaPipeLandmarkerRef.current && !isMediaPipeLoadingRef.current) {
        isMediaPipeLoadingRef.current = true;
        getFaceLandmarker().then((lm) => {
          mediaPipeLandmarkerRef.current = lm;
          isMediaPipeLoadingRef.current = false;
        }).catch(() => {
          isMediaPipeLoadingRef.current = false;
        });
      }
      startCamera();
      if (!isMicOn) {
        setIsMicOn(true);
        isMicDesiredRef.current = true;
        startAcousticAnalysis().then(() => {
          if (!isAiSpeakingRef.current && !isSpeakingRef.current && !currentAudioRef.current) {
            startSpeechRecognizer();
            startTurnAudioRecording();
          }
        });
      }
    } else {
      isLiveSessionRef.current = false;
      cleanupAudioResources();
      stopCamera();
    }
  }, [view]);

  // Tự động tải và đồng bộ giọng đọc tiếng Việt tự nhiên (Neural Voices) từ hệ điều hành và trình duyệt
  useEffect(() => {
    const initVoices = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const allVoices = window.speechSynthesis.getVoices() || [];
      if (allVoices.length === 0) return;

      const viVoices = allVoices.filter(
        (v) => (v.lang && (v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('viet'))) ||
               (v.name && /vietnamese|tiếng việt|namminh|hoaimy/i.test(v.name))
      );

      // Sắp xếp ưu tiên:
      // 1. Giọng Microsoft Natural Neural Online (NamMinh / HoaiMy - Đàm thoại cực chuẩn, tự nhiên nhất)
      // 2. Google tiếng Việt (Chrome online)
      // 3. Các giọng tiếng Việt khác không phải giọng offline cũ (An)
      // 4. Giọng An (chỉ dùng làm phương án cuối cùng)
      viVoices.sort((a, b) => {
        const getScore = (v) => {
          const n = (v.name || '').toLowerCase();
          if (n.includes('natural') || n.includes('online')) return 100;
          if (n.includes('namminh') || n.includes('hoaimy')) return 90;
          if (n.includes('google')) return 80;
          if (n.includes('an')) return 20;
          return 50;
        };
        return getScore(b) - getScore(a);
      });

      const best = viVoices[0]
        || allVoices.find((v) => v.lang.startsWith('vi'))
        || null;

      setAvailableVoices(viVoices.length > 0 ? viVoices : allVoices);
      if (best) setSelectedVoice(best);
    };

    initVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = initVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Theo dõi từ đệm và tốc độ nói WPM thời gian thực khi ứng viên phát biểu
  useEffect(() => {
    if (!currentAnswer) {
      setTurnFillerCount(0);
      return;
    }
    const words = currentAnswer.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (!speechTurnStartTimeRef.current) {
      speechTurnStartTimeRef.current = Date.now();
    }
    const durationMin = Math.max(0.04, (Date.now() - speechTurnStartTimeRef.current) / 60000);
    const wpm = Math.min(220, Math.max(60, Math.round(wordCount / durationMin)));
    setLiveWpm(wpm);

    // Bộ lọc từ đệm hiển thị trực tiếp trên giao diện
    const { count, lastWord } = detectFillerWords(currentAnswer);
    setTurnFillerCount(count);
    if (lastWord && lastWord !== lastFillerAlert) {
      setLastFillerAlert(lastWord);
    }
  }, [currentAnswer]);

  // Nghe thử giọng nói AI chuẩn phòng thu (Voice Preview - Microsoft Azure Neural Voice Stream)
  const handlePreviewVoice = (presetId) => {
    stopSpeaking();
    setIsPreviewingVoice(true);
    const preset = VOICE_PRESETS.find((p) => p.id === presetId) || VOICE_PRESETS[0];
    const sample = preset.sampleText;
    const voiceParam = presetId === 'eleven-george' ? 'male' : presetId === 'eleven-alice' ? 'eleven' : 'female';

    try {
      const audioUrl = `/api/v1/ai-interviews/tts?voice=${voiceParam}&text=${encodeURIComponent(cleanTextForSpeech(sample))}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onended = () => {
        currentAudioRef.current = null;
        setIsPreviewingVoice(false);
      };
      audio.onerror = () => {
        currentAudioRef.current = null;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(sample);
          utterance.lang = 'vi-VN';
          utterance.onend = () => setIsPreviewingVoice(false);
          utterance.onerror = () => setIsPreviewingVoice(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsPreviewingVoice(false);
        }
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPreviewingVoice(false);
        });
      }
    } catch (e) {
      setIsPreviewingVoice(false);
    }
  };

  // Khởi tạo AudioContext và AnalyserNode phân tích Tông giọng (Pitch F0 Hz) & Âm lượng RMS
  const startAcousticAnalysis = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      if (!micMediaStreamRef.current) {
        micMediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const source = ctx.createMediaStreamSource(micMediaStreamRef.current);
      source.connect(analyser);
      analyserRef.current = analyser;

      const buffer = new Float32Array(analyser.fftSize);

      const updateLoop = () => {
        if (!isLiveSessionRef.current || !isMicDesiredRef.current) return;
        analyser.getFloatTimeDomainData(buffer);

        // 1. Âm lượng RMS dB
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        const rms = Math.sqrt(sum / buffer.length);
        const db = rms > 0.001 ? Math.round(20 * Math.log10(rms)) : -60;
        setLiveVolumeDb(db);

        // 2. Tính Tần số cao độ F0 (Pitch Hz)
        const pitch = autoCorrelatePitch(buffer, ctx.sampleRate);
        if (pitch > 70 && pitch < 360) {
          const rounded = Math.round(pitch);
          setLivePitchHz(rounded);
          telemetryHistoryRef.current.pitchSamples.push(rounded);

          let desc = 'Tự tin, chuẩn mực';
          if (rounded < 165) desc = 'Trầm ấm, đĩnh đạc';
          else if (rounded <= 225) desc = 'Tự tin, chuẩn mực';
          else desc = 'Tông cao / Hồi hộp';
          setLiveToneDesc(desc);
        }

        audioAnimFrameRef.current = requestAnimationFrame(updateLoop);
      };

      if (audioAnimFrameRef.current) cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = requestAnimationFrame(updateLoop);
    } catch (err) {
      console.warn('Could not start acoustic analysis:', err);
    }
  };

  const stopAcousticAnalysis = () => {
    if (audioAnimFrameRef.current) {
      cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (micMediaStreamRef.current) {
      micMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      micMediaStreamRef.current = null;
    }
  };

  // Bắt đầu thu âm lượt nói của ứng viên (MediaRecorder WebM/MP4 chuẩn trình duyệt)
  const startTurnAudioRecording = () => {
    try {
      if (!micMediaStreamRef.current || typeof window === 'undefined' || !window.MediaRecorder) return;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }

      audioChunksRef.current = [];
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = supportedMime
        ? new MediaRecorder(micMediaStreamRef.current, { mimeType: supportedMime })
        : new MediaRecorder(micMediaStreamRef.current);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
    } catch (recErr) {
      console.warn('Cannot start MediaRecorder turn recording:', recErr);
    }
  };

  // Dừng thu âm và gom toàn bộ audio chunks thành một Blob hoàn chỉnh
  const stopAndCollectTurnAudioBlob = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: recorder?.mimeType || 'audio/webm' });
          audioChunksRef.current = [];
          resolve(blob);
        } else {
          resolve(null);
        }
        return;
      }

      recorder.onstop = () => {
        try {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
            audioChunksRef.current = [];
            resolve(blob);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.warn('Error packing audio blob:', err);
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        resolve(null);
      }
    });
  };

  // Phân tích hình ảnh camera bằng Google MediaPipe Face Landmarker thực tế (Theo dõi con ngươi, độ mở mắt, tư thế 3D & biểu cảm thật)
  const startVisionAnalysis = () => {
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);

    // Kích hoạt nạp mô hình MediaPipe nếu chưa có sẵn
    if (!mediaPipeLandmarkerRef.current && !isMediaPipeLoadingRef.current) {
      isMediaPipeLoadingRef.current = true;
      getFaceLandmarker().then((lm) => {
        mediaPipeLandmarkerRef.current = lm;
        isMediaPipeLoadingRef.current = false;
      }).catch(() => {
        isMediaPipeLoadingRef.current = false;
      });
    }

    visionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      // =========================================================================
      // PHƯƠNG ÁN 1 (ƯU TIÊN): GOOGLE MEDIAPIPE FACE LANDMARKER (478 Điểm 3D + Iris Gaze Tracking)
      // =========================================================================
      if (mediaPipeLandmarkerRef.current) {
        try {
          const mpResult = analyzeFaceFrameWithMediaPipe(mediaPipeLandmarkerRef.current, video, performance.now());
          if (mpResult && mpResult.faceDetected) {
            // Làm mượt chuyển động bounding box bằng Exponential Moving Average (EMA)
            const smoothX = Math.round(prevFaceBoxRef.current.x * 0.65 + mpResult.box.x * 0.35);
            const smoothY = Math.round(prevFaceBoxRef.current.y * 0.65 + mpResult.box.y * 0.35);
            const smoothW = Math.round(prevFaceBoxRef.current.w * 0.65 + mpResult.box.w * 0.35);
            const smoothH = Math.round(prevFaceBoxRef.current.h * 0.65 + mpResult.box.h * 0.35);

            prevFaceBoxRef.current = { x: smoothX, y: smoothY, w: smoothW, h: smoothH };
            setDetectedFaceBox(prevFaceBoxRef.current);

            setLivePostureStatus(mpResult.posture);
            setLiveEyeContactPercent(mpResult.eyeContact);
            setLiveFacialEmotion(mpResult.emotion);

            // Cập nhật telemetry gửi về Backend Gemini
            telemetryHistoryRef.current.eyeContactSamples.push(mpResult.eyeContact);
            if (mpResult.emotion.includes('Mỉm cười')) {
              telemetryHistoryRef.current.emotions.smiling++;
            } else if (mpResult.emotion.includes('Căng thẳng') || mpResult.isProfile) {
              telemetryHistoryRef.current.emotions.tense++;
            } else if (mpResult.emotion.includes('Tập trung') || mpResult.emotion.includes('suy nghĩ')) {
              telemetryHistoryRef.current.emotions.focused++;
            } else {
              telemetryHistoryRef.current.emotions.confident++;
            }

            if (telemetryHistoryRef.current.postures) {
              if (mpResult.posture?.includes('Cúi đầu') || mpResult.isBowing) {
                telemetryHistoryRef.current.postures.bowing++;
              } else if (mpResult.posture?.includes('Quay mặt') || mpResult.isProfile) {
                telemetryHistoryRef.current.postures.profile++;
              } else if (mpResult.posture?.includes('Ngửa đầu') || mpResult.isLookingUp) {
                telemetryHistoryRef.current.postures.lookingUp++;
              } else {
                telemetryHistoryRef.current.postures.good++;
              }
            }
            return;
          } else {
            // Không tìm thấy khuôn mặt trong khung hình
            setLivePostureStatus('Chưa vào khung hình');
            setLiveEyeContactPercent(15);
            setLiveFacialEmotion('Không nhận diện được khuôn mặt');
            return;
          }
        } catch (mpErr) {
          console.warn('>> [MediaPipe] Error processing frame, fallback to canvas:', mpErr);
        }
      }

      // =========================================================================
      // PHƯƠNG ÁN 2 (DỰ PHÒNG TẠM THỜI KHI ĐANG TẢI MODEL HOẶC MẤT MẠNG): Canvas Heuristic
      // =========================================================================
      let faceDetected = false;
      let targetX = 35, targetY = 12, targetW = 30, targetH = 34;
      let centerRatioX = 0.5, centerRatioY = 0.35;
      let smileRatio = 0.1;

      if (!visionCanvasRef.current) {
        visionCanvasRef.current = document.createElement('canvas');
        visionCanvasRef.current.width = 160;
        visionCanvasRef.current.height = 120;
      }
      const canvas = visionCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        const maxScanY = Math.floor(canvas.height * 0.58);
        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
        let skinPixelCount = 0;
        let sumX = 0, sumY = 0;

        for (let y = 6; y < maxScanY; y += 2) {
          for (let x = 4; x < canvas.width - 4; x += 2) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

            const isSkin = (yVal > 35 && cb >= 72 && cb <= 140 && cr >= 125 && cr <= 186) ||
                           (r > 55 && g > 35 && b > 20 && r > g && (r - g) >= 8 && (r - b) >= 12);

            if (isSkin) {
              skinPixelCount++;
              sumX += x;
              sumY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (skinPixelCount > 25 && maxY > minY) {
          faceDetected = true;
          const cx = sumX / skinPixelCount;
          const cy = sumY / skinPixelCount;

          const rawFaceW = maxX - minX;
          const rawFaceH = maxY - minY;
          const clampedFaceW = Math.max(26, Math.min(50, rawFaceW));
          const clampedFaceH = Math.max(28, Math.min(52, rawFaceH));

          targetX = Math.round(Math.max(4, Math.min(70, ((canvas.width - maxX) / canvas.width) * 100)));
          targetY = Math.round(Math.max(4, Math.min(50, (minY / canvas.height) * 100)));
          targetW = Math.round(Math.max(20, Math.min(36, (clampedFaceW / canvas.width) * 100)));
          targetH = Math.round(Math.max(24, Math.min(42, (clampedFaceH / canvas.height) * 100)));
          centerRatioX = cx / canvas.width;
          centerRatioY = cy / canvas.height;

          const midX = Math.floor((minX + maxX) / 2);
          let leftSkin = 0, rightSkin = 0;
          for (let y = minY; y <= maxY; y += 2) {
            for (let x = minX; x <= maxX; x += 2) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              const isSkin = (r > 55 && g > 35 && b > 20 && r > g && (r - g) >= 8);
              if (isSkin) {
                if (x < midX) leftSkin++;
                else rightSkin++;
              }
            }
          }
          const totalSkinLR = leftSkin + rightSkin;
          const skinAsymmetry = totalSkinLR > 10 ? Math.abs(leftSkin - rightSkin) / totalSkinLR : 0;

          faceOrientationRef.current = {
            asymmetry: skinAsymmetry,
            isProfile: skinAsymmetry > 0.26 || centerRatioX < 0.35 || centerRatioX > 0.65,
            centerRatioX,
            centerRatioY
          };
        }
      }

      if (faceDetected) {
        const smoothX = Math.round(prevFaceBoxRef.current.x * 0.72 + targetX * 0.28);
        const smoothY = Math.round(prevFaceBoxRef.current.y * 0.72 + targetY * 0.28);
        const smoothW = Math.round(prevFaceBoxRef.current.w * 0.72 + targetW * 0.28);
        const smoothH = Math.round(prevFaceBoxRef.current.h * 0.72 + targetH * 0.28);

        prevFaceBoxRef.current = { x: smoothX, y: smoothY, w: smoothW, h: smoothH };
        setDetectedFaceBox(prevFaceBoxRef.current);

        const orient = faceOrientationRef.current || {};
        const isProfile = orient.isProfile || orient.asymmetry > 0.26 || centerRatioX < 0.35 || centerRatioX > 0.65;
        const isBowing = centerRatioY > 0.52;
        const isLookingUp = centerRatioY < 0.18;

        let posture = 'Cân đối • Nhìn thẳng camera';
        let contact = 90;
        let emotion = 'Đang tải AI Face Tracker...';

        if (isProfile) {
          posture = 'Quay mặt sang bên • Không nhìn camera';
          contact = 25;
          emotion = 'Mất tập trung • Cần nhìn vào camera ⚠️';
          telemetryHistoryRef.current.emotions.tense++;
          if (telemetryHistoryRef.current.postures) telemetryHistoryRef.current.postures.profile++;
        } else if (isBowing) {
          posture = 'Cúi đầu • Chưa tự tin';
          contact = 40;
          emotion = 'Đang suy nghĩ 🤔';
          telemetryHistoryRef.current.emotions.tense++;
          if (telemetryHistoryRef.current.postures) telemetryHistoryRef.current.postures.bowing++;
        } else if (isLookingUp) {
          posture = 'Ngửa đầu lên cao';
          contact = 55;
          emotion = 'Hơi phân tâm';
          telemetryHistoryRef.current.emotions.confident++;
          if (telemetryHistoryRef.current.postures) telemetryHistoryRef.current.postures.lookingUp++;
        } else {
          posture = 'Cân đối • Nhìn thẳng camera';
          contact = 92;
          emotion = 'Tập trung cao độ 🧐';
          telemetryHistoryRef.current.emotions.focused++;
          if (telemetryHistoryRef.current.postures) telemetryHistoryRef.current.postures.good++;
        }

        setLivePostureStatus(posture);
        setLiveEyeContactPercent(contact);
        setLiveFacialEmotion(emotion);
        telemetryHistoryRef.current.eyeContactSamples.push(contact);
      } else {
        setLivePostureStatus('Chưa vào khung hình');
        setLiveEyeContactPercent(15);
        setLiveFacialEmotion('Không nhận diện được khuôn mặt');
      }
    }, 150);
  };

  const stopVisionAnalysis = () => {
    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
      visionIntervalRef.current = null;
    }
  };

  // Hủy toàn bộ tiến trình giọng nói, đệm âm thanh và micro ngay lập tức (Tuyệt đối không chạy ngầm sau khi thoát)
  const cleanupAudioResources = () => {
    isLiveSessionRef.current = false;
    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speechCooldownTimerRef.current) clearTimeout(speechCooldownTimerRef.current);
    stopSpeechRecognizer();
    stopSpeaking();
    stopAcousticAnalysis();
    stopVisionAnalysis();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    audioChunksRef.current = [];
  };

  const stopSpeaking = () => {
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    isAiSpeakingRef.current = false;
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsAiSpeaking(false);
  };

  // Chọn giọng đọc tiếng Việt truyền cảm, chuẩn Neural tự nhiên nhất của trình duyệt
  const getBestVietnameseVoice = (presetId = selectedVoicePreset) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    if (presetId === 'eleven-george') {
      const maleVoice = voices.find((v) => /namminh|nam minh/i.test(v.name)) ||
                        voices.find((v) => v.lang.startsWith('vi') && /male/i.test(v.name)) ||
                        voices.find((v) => v.lang.startsWith('vi') && !/an\b|female/i.test(v.name));
      if (maleVoice) return maleVoice;
    } else {
      const femaleVoice = voices.find((v) => /hoaimy|hoài my/i.test(v.name)) ||
                          voices.find((v) => v.lang.startsWith('vi') && /female/i.test(v.name)) ||
                          voices.find((v) => v.lang.startsWith('vi') && /google/i.test(v.name));
      if (femaleVoice) return femaleVoice;
    }

    const naturalNeural = voices.find((v) => v.lang.startsWith('vi') && /natural|online/i.test(v.name));
    if (naturalNeural) return naturalNeural;
    const anyVi = voices.find((v) => v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('viet'));
    return anyVi || null;
  };

  // Dừng nhận diện giọng nói và hủy toàn bộ đệm âm thanh đang chờ
  const stopSpeechRecognizer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort(); // abort() loại bỏ toàn bộ dữ liệu âm thanh đang đệm
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  // Tự động nhận biết ứng viên đã nói xong: đợi im lặng tự nhiên (1.4s) -> gửi ngay không delay
  const scheduleTurnEnd = (fullText) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    patienceRoundsRef.current = 0;
    setListenStatus('hearing');

    const canSend = () =>
      !isTurnProcessingRef.current && !isAiSpeakingRef.current && isLiveSessionRef.current;

    const wordCountOf = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

    const evaluate = async () => {
      if (!canSend()) return;
      const ans = (currentAnswerRef.current || '').trim();
      if (wordCountOf(ans) < 2) { setListenStatus('idle'); return; }

      // 1. Ứng viên tự báo đã nói xong ("em xin hết", "vậy thôi ạ", "that's all"...) -> gửi ngay lập tức
      if (hasExplicitEndPhrase(ans)) {
        handleSendCandidateTurn(ans);
        return;
      }

      // 2. Nếu câu nói kết thúc lửng bằng từ nối (và, nhưng, thì, là, mà, vì, or, but, so...) -> đợi thêm chút
      if (endsWithDanglingWord(ans)) {
        if (patienceRoundsRef.current < MAX_PATIENCE_ROUNDS) {
          patienceRoundsRef.current += 1;
          setListenStatus('waiting');
          silenceTimerRef.current = setTimeout(evaluate, PATIENCE_QUIET_MS);
          return;
        }
      }

      // 3. Đã có câu trả lời đầy đủ (>= 3 từ) -> Gửi ngay cho AI xử lý phản hồi tức thì
      if (wordCountOf(ans) >= 3) {
        handleSendCandidateTurn(ans);
      }
    };

    const quietMs = hasExplicitEndPhrase(fullText) ? 350 : BASE_QUIET_MS;
    silenceTimerRef.current = setTimeout(evaluate, quietMs);
  };

  // Khởi động nhận diện giọng nói có kiểm soát chặt chẽ trạng thái AI phát biểu
  const startSpeechRecognizer = () => {
    if (!isLiveSessionRef.current || !isMicDesiredRef.current || isAiSpeakingRef.current || isSpeakingRef.current || currentAudioRef.current) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopSpeechRecognizer();

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'vi-VN';

      recognizer.onend = () => {
        if (isMicDesiredRef.current && isLiveSessionRef.current && !isAiSpeakingRef.current && !isSpeakingRef.current && !currentAudioRef.current) {
          try { recognizer.start(); } catch (e) {}
        }
      };

      recognizer.onresult = (event) => {
        // TIER 1 & 2: Nếu AI đang nói hoặc vừa dứt lời trong vòng 400ms, bỏ qua hoàn toàn âm thanh dội lại
        if (isAiSpeakingRef.current || isSpeakingRef.current || currentAudioRef.current || !isLiveSessionRef.current) {
          return;
        }
        if (Date.now() - lastAiFinishedTimeRef.current < 400) {
          return;
        }

        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            baseSpeechRef.current = (baseSpeechRef.current ? baseSpeechRef.current + ' ' : '') + piece.trim();
          } else {
            interimTranscript += piece;
          }
        }

        const fullText = (baseSpeechRef.current + (interimTranscript ? ' ' + interimTranscript : '')).trim();
        if (fullText) {
          // BẢO VỆ PHẢN HỒI ECHO: Nếu vô tình nhận diện âm thanh phát ra từ loa của chính AI, hủy bỏ ngay!
          if (isEchoOfAi(fullText, recentAiTurnsRef.current)) {
            baseSpeechRef.current = '';
            currentAnswerRef.current = '';
            return;
          }

          setCurrentAnswer(fullText);
          currentAnswerRef.current = fullText;

          // Turn-taking tự nhiên rảnh tay
          scheduleTurnEnd(fullText);
        }
      };

      recognizer.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Speech recognition status:', e.error);
        }
      };

      recognizer.start();
      recognitionRef.current = recognizer;
    } catch (e) {
      console.warn('Could not start SpeechRecognition:', e);
    }
  };

  // Trình phát âm thanh dự phòng bằng Web Speech Synthesis (Hỗ trợ song ngữ Anh - Việt tự nhiên)
  const fallbackBrowserSpeech = (text, onDone) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isEn = isMostlyEnglishText(text);
      utterance.lang = isEn ? 'en-US' : 'vi-VN';

      const voices = window.speechSynthesis.getVoices() || [];
      const isMale = selectedVoicePreset === 'eleven-george';
      let voiceToUse = null;
      if (isEn) {
        voiceToUse = voices.find(v => v.lang.startsWith('en') && (isMale ? /male|david|guy|andrew/i.test(v.name) : /female|jenny|zira|aria/i.test(v.name))) || voices.find(v => v.lang.startsWith('en'));
      } else {
        // Tuyệt đối không để voice tiếng Anh (như David/Zira) đọc tiếng Việt gây bập bẹ!
        voiceToUse = getBestVietnameseVoice(selectedVoicePreset) || voices.find(v => (v.lang && v.lang.toLowerCase().startsWith('vi')) || /vietnamese|tiếng việt|namminh|hoaimy/i.test(v.name)) || null;
      }
      if (voiceToUse) {
        utterance.voice = voiceToUse;
        utterance.lang = voiceToUse.lang || (isEn ? 'en-US' : 'vi-VN');
      }
      if (isMale) {
        utterance.rate = 1.05;
        utterance.pitch = 0.98;
      } else {
        utterance.rate = 1.08;
        utterance.pitch = 1.02;
      }

      let doneCalled = false;
      const safeDone = () => {
        if (!doneCalled) {
          doneCalled = true;
          if (onDone) onDone();
        }
      };

      // Watchdog: Nếu trình duyệt bị nghẽn giọng đọc quá thời gian ước tính, tự động giải phóng mic
      const maxMs = Math.max(3500, Math.min(25000, (text.length * 85) + 1500));
      const safetyTimer = setTimeout(() => {
        safeDone();
      }, maxMs);

      utterance.onstart = () => {
        isAiSpeakingRef.current = true;
        isSpeakingRef.current = true;
        setIsAiSpeaking(true);
        stopSpeechRecognizer();
      };
      utterance.onend = () => {
        clearTimeout(safetyTimer);
        safeDone();
      };
      utterance.onerror = () => {
        clearTimeout(safetyTimer);
        safeDone();
      };
      try { window.speechSynthesis.resume(); } catch (e) {}
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (onDone) onDone();
    }
  };


  // Phát âm toàn vẹn mượt mà với Microsoft Azure / Edge Neural TTS (Tuyệt đối không chia nhỏ câu gây đứt quãng và nghẽn mic)
  const speakNeuralAudio = (text) => {
    if (!isLiveSessionRef.current) return;

    stopSpeaking();

    // VẬT LÝ HỌC: Ngay khi AI chuẩn bị phát âm, lập tức ABORT Micro để loa máy tính không dội ngược vào micro!
    setListenStatus('idle');
    stopSpeechRecognizer();
    baseSpeechRef.current = '';
    currentAnswerRef.current = '';
    setCurrentAnswer('');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    isAiSpeakingRef.current = true;
    isSpeakingRef.current = true;
    setIsAiSpeaking(true);

    try {
      const voiceParam = selectedVoicePreset === 'eleven-george' ? 'male' : selectedVoicePreset === 'eleven-alice' ? 'eleven' : 'female';
      const ttsUrl = `/api/v1/ai-interviews/tts?voice=${voiceParam}&text=${encodeURIComponent(clean)}`;
      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      let audioStarted = false;
      const handleAudioFinished = () => {
        currentAudioRef.current = null;
        lastAiFinishedTimeRef.current = Date.now();
        // Đệm trễ 500ms sau khi AI dứt câu để âm vang trong phòng tan hết trước khi mở lại micro
        if (speechCooldownTimerRef.current) clearTimeout(speechCooldownTimerRef.current);
        speechCooldownTimerRef.current = setTimeout(() => {
          if (!isLiveSessionRef.current) return;
          isAiSpeakingRef.current = false;
          isSpeakingRef.current = false;
          setIsAiSpeaking(false);
          baseSpeechRef.current = '';
          currentAnswerRef.current = '';
          setCurrentAnswer('');
          // Chỉ mở lại micro nếu ứng viên mong muốn bật mic và phiên vẫn đang diễn ra
          if (isMicDesiredRef.current && isLiveSessionRef.current) {
            startSpeechRecognizer();
            startTurnAudioRecording();
          }
        }, 500);
      };

      // Watchdog: Nếu stream backend bị trễ mạng > 3.5s, tự động chuyển sang Web Speech API của trình duyệt ngay
      const streamWatchdog = setTimeout(() => {
        if (!audioStarted && currentAudioRef.current === audio) {
          console.warn('Backend TTS stream latency > 3.5s, fallback sang Web Speech API');
          try { audio.pause(); } catch (e) {}
          currentAudioRef.current = null;
          fallbackBrowserSpeech(clean, handleAudioFinished);
        }
      }, 3500);

      audio.onplay = () => {
        audioStarted = true;
        clearTimeout(streamWatchdog);
        isAiSpeakingRef.current = true;
        isSpeakingRef.current = true;
        setIsAiSpeaking(true);
        stopSpeechRecognizer();
      };

      audio.onended = () => {
        clearTimeout(streamWatchdog);
        handleAudioFinished();
      };

      audio.onerror = (err) => {
        clearTimeout(streamWatchdog);
        console.warn('Backend TTS stream error, fallback to browser SpeechSynthesis:', err);
        fallbackBrowserSpeech(clean, handleAudioFinished);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          clearTimeout(streamWatchdog);
          console.warn('Audio auto-play prevented or stream delay, fallback to browser SpeechSynthesis:', err);
          fallbackBrowserSpeech(clean, handleAudioFinished);
        });
      }
    } catch (err) {
      fallbackBrowserSpeech(clean, () => {
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        if (isMicDesiredRef.current && isLiveSessionRef.current) {
          startSpeechRecognizer();
        }
      });
    }
  };

  // Alias để tương thích toàn bộ các nút bấm và gọi hàm hiện có
  const speakWithSentenceChunking = speakNeuralAudio;

  // Bật/Tắt Micro với Acoustic Echo Suppression & Real-time Pitch Detection
  const toggleMic = async () => {
    if (isMicOn) {
      setIsMicOn(false);
      isMicDesiredRef.current = false;
      stopSpeechRecognizer();
      stopAcousticAnalysis();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      showToast('Đã tắt micro.');
    } else {
      setIsMicOn(true);
      isMicDesiredRef.current = true;
      showToast('🎤 Micro đang lắng nghe... Bạn cứ nói tự nhiên.');
      await startAcousticAnalysis();
      startSpeechRecognizer();
      startTurnAudioRecording();
    }
  };

  // Fetch history from Supabase / Backend with user-scoped isolation
  const fetchRealHistory = () => {
    const userHistoryCacheKey = user?.userId ? `hiremate_interview_history_${user.userId}` : 'hiremate_interview_history_guest';

    // 1. Tải trước từ bộ nhớ đệm cục bộ của RIÊNG tài khoản này
    try {
      localStorage.removeItem('hiremate_interview_history'); // Xóa cache dùng chung cũ
      const cached = JSON.parse(localStorage.getItem(userHistoryCacheKey) || '[]');
      if (Array.isArray(cached)) {
        const sanitized = cached.map((item) => {
          const rawScore = item.totalScore != null ? Math.round(item.totalScore) : 0;
          const finalScore = rawScore;
          const qCount = item.questionsCount ?? item.questions?.length ?? 0;
          const grade = qCount === 0 ? 'Chưa Hoàn Tất' : finalScore >= 85 ? 'Xuất Sắc' : finalScore >= 70 ? 'Đạt Yêu Cầu' : finalScore >= 50 ? 'Cần Rèn Luyện Thêm' : 'Không Đạt Yêu Cầu';
          return { ...item, totalScore: finalScore, grade };
        });
        setHistoryList(sanitized);
      }
    } catch (e) {
      setHistoryList([]);
    }

    // 2. Đồng bộ lịch sử từ Backend API theo token của user hiện tại
    setIsHistoryLoading(true);
    interviewApi.getHistory()
      .then((res) => {
        const raw = res?.data || res;
        const data = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (Array.isArray(data)) {
          if (data.length > 0) {
            const mapped = data.map((item) => {
              const rawScore = item.overallScore != null ? Math.round(item.overallScore) : 0;
              const qCount = item.details?.length || item.questionCount || 0;
              const finalScore = rawScore;
              const grade = qCount === 0 ? 'Chưa Hoàn Tất' : finalScore >= 85 ? 'Xuất Sắc' : finalScore >= 70 ? 'Đạt Yêu Cầu' : finalScore >= 50 ? 'Cần Rèn Luyện Thêm' : 'Không Đạt Yêu Cầu';

              const rawTel = item.telemetryReport || item.telemetry || {};
              const sessionLevel = rawTel.level || item.level || 'Middle';

              let sessionDuration = rawTel.durationFormatted;
              if (!sessionDuration && item.startedAt && item.completedAt) {
                const start = new Date(item.startedAt).getTime();
                const end = new Date(item.completedAt).getTime();
                if (!isNaN(start) && !isNaN(end) && end > start) {
                  const diffSec = Math.round((end - start) / 1000);
                  sessionDuration = fmt(diffSec);
                }
              }
              if (!sessionDuration && rawTel.actualDurationSeconds) {
                sessionDuration = fmt(Number(rawTel.actualDurationSeconds));
              }
              if (!sessionDuration) {
                sessionDuration = '5 phút';
              }

              const mappedTelemetry = {
                isCameraUsed: Boolean(rawTel.isCameraUsed),
                isMicrophoneUsed: Boolean(rawTel.isMicrophoneUsed || (rawTel.avgWpm && Number(rawTel.avgWpm) > 0)),
                avgEyeContact: rawTel.avgEyeContact ?? null,
                avgPitchHz: rawTel.avgPitchHz ?? null,
                avgWpm: rawTel.avgWpm ?? null,
                totalFillers: rawTel.totalFillers ?? 0,
                emotionSummary: rawTel.emotionSummary || rawTel.dominantEmotion || 'Chưa bật camera',
                dominantEmotion: rawTel.dominantEmotion || rawTel.emotionSummary || 'Chưa bật camera',
                postureStatus: rawTel.postureStatus || rawTel.postureSummary || 'Chưa bật camera',
                postureSummary: rawTel.postureSummary || rawTel.postureStatus || 'Chưa bật camera',
                emotions: rawTel.emotions || { confident: 0, smiling: 0, focused: 0, tense: 0 },
                level: sessionLevel,
                durationSeconds: rawTel.actualDurationSeconds ?? rawTel.durationSeconds ?? null,
                durationFormatted: sessionDuration,
              };

              return {
                id: 'HM-' + item.sessionId,
                sessionId: item.sessionId,
                date: item.startedAt ? item.startedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                topic: cleanTopicName(item.targetPosition || 'Chuyên viên Công nghệ'),
                level: sessionLevel,
                duration: sessionDuration,
                planName: item.planName || 'Free Candidate',
                maxQuestions: item.maxQuestions || 3,
                maxDurationSeconds: item.maxDurationSeconds || 300,
                isIncomplete: qCount === 0 || qCount < (item.maxQuestions || 3),
                totalScore: finalScore,
                grade: grade,
                questionsCount: qCount,
                aiSummary: item.overallFeedback || 'Đã hoàn thành phiên phỏng vấn trên HireMate.',
                weaknessSummary: item.weaknessSummary || 'Cần bổ sung thêm các số liệu định lượng và đào sâu giải pháp công nghệ theo mô hình STAR.',
                competencies: {
                  domainKnowledge: Math.round(item.domainKnowledgeScore ?? finalScore ?? 0),
                  problemSolving: Math.round(item.problemSolvingScore ?? finalScore ?? 0),
                  structureSTAR: Math.round(item.starStructureScore ?? (finalScore > 0 ? Math.round(finalScore * 0.85) : 0)),
                  deliveryTone: Math.round(item.deliveryToneScore ?? item.communicationScore ?? (finalScore > 0 ? finalScore : 0)),
                },
                deliveryFeedback: item.deliveryFeedback || null,
                strengths: finalScore >= 70 ? [
                  'Phản xạ hội thoại tự nhiên, hiểu rõ giải pháp công nghệ và quy trình triển khai.',
                  'Tác phong phỏng vấn nghiêm túc, thẳng thắn và bám sát câu hỏi tuyển dụng.',
                ] : [
                  'Có tinh thần tham gia và hoàn thành phiên phỏng vấn thử thách.',
                  'Thái độ tiếp thu và sẵn sàng lắng nghe phản biện từ hội đồng tuyển dụng.',
                ],
                criticalFlaws: item.weaknessSummary ? [item.weaknessSummary] : [
                  'Cần đào sâu hơn vào số liệu định lượng (%, thời gian, KPIs) theo mô hình STAR.',
                  'Bổ sung thêm các thuật ngữ kỹ thuật chuyên môn và phân tích trade-offs trong thiết kế.',
                ],
                improvementPlan: item.recommendedTasks
                  ? (typeof item.recommendedTasks === 'string' ? JSON.parse(item.recommendedTasks || '[]') : item.recommendedTasks)
                  : [
                    'Luyện tập trả lời theo đúng 4 bước STAR: Bối cảnh, Nhiệm vụ, Hành động, Kết quả.',
                    'Đào sâu vào các kịch bản sự cố thực tế và các giải pháp tối ưu hệ thống.',
                    'Ôn tập thêm các thuật ngữ kỹ thuật cốt lõi trước khi phỏng vấn chính thức.',
                  ],
                telemetryReport: mappedTelemetry,
                questions: (item.details || []).map((d) => {
                  const ans = d.candidateAnswerText || '';
                  const words = ans.trim() ? ans.trim().split(/\s+/).filter(Boolean).length : 0;
                  const feedbackStr = d.aiFeedback || '';

                  let qWpm = mappedTelemetry.avgWpm;
                  let qPitch = mappedTelemetry.avgPitchHz;
                  let qEye = mappedTelemetry.avgEyeContact;

                  const wpmMatch = feedbackStr.match(/Tốc độ nói:\s*(\d+)\s*WPM/i) || feedbackStr.match(/WPM:\s*(\d+)/i);
                  if (wpmMatch) qWpm = Number(wpmMatch[1]);

                  const pitchMatch = feedbackStr.match(/Pitch\):\s*(\d+)\s*Hz/i) || feedbackStr.match(/(?:Tông giọng|Pitch):\s*(\d+)\s*Hz/i);
                  if (pitchMatch) qPitch = Number(pitchMatch[1]);

                  const eyeMatch = feedbackStr.match(/Eye Contact\):\s*(\d+)%/i) || feedbackStr.match(/(?:Giao tiếp mắt|Eye Contact):\s*(\d+)%/i);
                  if (eyeMatch) qEye = Number(eyeMatch[1]);

                  return {
                    q: d.questionText,
                    audioUrl: d.audioUrl || null,
                    score: Math.round(d.aiEvaluationScore || 0),
                    domainScore: Math.round(d.aiEvaluationScore || 0),
                    problemScore: Math.round(d.aiEvaluationScore || 0),
                    starScore: Math.round((d.aiEvaluationScore || 0) * 0.9),
                    deliveryScore: Math.round(item.deliveryToneScore ?? item.communicationScore ?? d.aiEvaluationScore ?? 20),
                    answer: ans || '(Ứng viên đã trả lời)',
                    words: words,
                    wpm: qWpm,
                    pitchHz: qPitch,
                    eyeContact: qEye,
                    criticalFeedback: {
                      flaws: d.aiFeedback || 'Cần bổ sung ví dụ thực tế.',
                      interviewerImpression: d.tone || 'Ứng viên nghiêm túc thực hiện phỏng vấn.'
                    },
                    modelAnswer: d.aiSuggestedAnswer || 'Gợi ý câu trả lời chuẩn theo mô hình STAR.',
                  };
                })
              };
            });
            setHistoryList(mapped);
            try {
              localStorage.setItem(userHistoryCacheKey, JSON.stringify(mapped));
            } catch (e) {}
          } else {
            // Người dùng này chưa có phiên phỏng vấn nào trong CSDL -> Xóa sạch lịch sử và cache
            setHistoryList([]);
            try {
              localStorage.setItem(userHistoryCacheKey, JSON.stringify([]));
            } catch (e) {}
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load history:', err);
      })
      .finally(() => {
        setIsHistoryLoading(false);
      });
  };

  // Toggle selection of a focus skill
  const toggleFocusSkill = (skill) => {
    setSelectedFocusSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Format full focus note for backend
  const getFullFocusPrompt = () => {
    const parts = [];
    if (selectedFocusSkills.length > 0) {
      parts.push(`Kỹ năng/Điểm yếu muốn xoáy sâu: ${selectedFocusSkills.join(', ')}`);
    }
    if (customFocusNotes.trim()) {
      parts.push(`Lời dặn riêng từ ứng viên: "${customFocusNotes.trim()}"`);
    }
    return parts.join('. ');
  };

  // ============================================================================
  // LOGIC PHÂN QUYỀN HẠNG MỨC GÓI SUPABASE CHO TỪNG TÍNH NĂNG
  // ============================================================================
  const isCandidateFree = !quotaStatus?.planName || quotaStatus?.planName?.toLowerCase().includes('free') || (quotaStatus?.maxQuestions && quotaStatus.maxQuestions <= 3);
  const isCandidatePlus = quotaStatus?.planName && quotaStatus?.planName?.toLowerCase().includes('plus');
  const isCandidateProOrAce = quotaStatus?.planName && (quotaStatus?.planName?.toLowerCase().includes('pro') || quotaStatus?.planName?.toLowerCase().includes('ace') || quotaStatus?.planName?.toLowerCase().includes('vip'));

  const checkTierPermission = (minTier) => {
    if (!minTier || minTier === 'FREE') return true;
    if (minTier === 'PLUS') return isCandidatePlus || isCandidateProOrAce;
    if (minTier === 'PRO') return isCandidateProOrAce;
    return true;
  };

  const checkPersonaPermission = (persona) => {
    if (quotaStatus?.allowedPersonas) {
      const allowed = quotaStatus.allowedPersonas.split(',').map((s) => s.trim().toUpperCase());
      return allowed.includes(String(persona.id).toUpperCase());
    }
    return checkTierPermission(persona.minTier);
  };

  const checkVoicePermission = (voice) => {
    if (quotaStatus?.allowedVoices) {
      const allowed = quotaStatus.allowedVoices.split(',').map((s) => s.trim().toLowerCase());
      return allowed.includes(String(voice.id).toLowerCase());
    }
    return checkTierPermission(voice.minTier);
  };

  const handleSelectPersona = (persona) => {
    if (!checkPersonaPermission(persona)) {
      setQuotaExceededMessage(`${persona.title} (${persona.tierLabel})`);
      setIsQuotaModalOpen(true);
      showToast(`🔒 Chế độ "${persona.title}" chưa được mở khóa trong gói hiện tại. Vui lòng nâng cấp gói dịch vụ!`);
      return;
    }
    setSelectedPersona(persona.id);
  };

  const handleSelectVoice = (voice) => {
    if (!checkVoicePermission(voice)) {
      setQuotaExceededMessage(`${voice.name} (${voice.tierLabel})`);
      setIsQuotaModalOpen(true);
      showToast(`🔒 Giọng đọc "${voice.name}" chưa được cấp quyền trong gói hiện tại. Vui lòng nâng cấp gói dịch vụ!`);
      return;
    }
    setSelectedVoicePreset(voice.id);
  };

  // Bắt đầu phiên phỏng vấn: Trực tiếp, không kịch bản câu hỏi soạn sẵn
  const handleStartInterview = async () => {
    // 0. Kiểm tra hạn ngạch gói Supabase trước khi khởi tạo
    if (quotaStatus?.isQuotaExceeded) {
      setQuotaExceededMessage(quotaStatus?.planName || 'Free Candidate');
      setIsQuotaModalOpen(true);
      showToast(`⚠️ Bạn đã hết hạn ngạch hôm nay (${quotaStatus.usedToday}/${quotaStatus.quotaLimit} lượt). Hãy nâng cấp gói!`);
      return;
    }

    // 1. Mở khóa âm thanh trình duyệt ngay trong cử chỉ click của người dùng (Tránh triệt để NotAllowedError Autoplay)
    if (typeof window !== 'undefined') {
      try {
        const dummyAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        dummyAudio.play().catch(() => {});
      } catch (e) {}
    }

    const isJob = contextMode === 'job' || contextMode === 'ai-recommend';
    const targetPos = isJob && selectedJob 
      ? selectedJob.title 
      : (customPosition.trim() || 'Chuyên viên Công nghệ');

    const levelObj = LEVELS.find((l) => l.id === selectedLevel);
    const levelLabel = levelObj?.label || 'Middle';
    const candidateName = user?.fullName || 'bạn';
    const focusPrompt = getFullFocusPrompt();

    // Câu chào dự phòng nếu mạng chập chờn
    const openingGreetingFallback = generatePositionSpecificGreeting(
      targetPos,
      selectedJob?.companyName,
      candidateName,
      selectedCv,
      focusPrompt,
      levelLabel
    );

    const validJobId = (isJob && selectedJob && typeof selectedJob.jobId === 'number') ? selectedJob.jobId : null;
    const isBiz = targetPos.toLowerCase().includes('kinh tế') || targetPos.toLowerCase().includes('kinh doanh') || targetPos.toLowerCase().includes('sales') || targetPos.toLowerCase().includes('marketing') || targetPos.toLowerCase().includes('kế toán') || targetPos.toLowerCase().includes('tài chính') || targetPos.toLowerCase().includes('nhân sự');

    // Khởi tạo phiên phỏng vấn thật trên Supabase (kiểm tra subscription và trừ lượt)
    let sid = null;
    try {
      const isRetry = Boolean(retryParentSessionId);
      const res = await interviewApi.startSession({
        targetPosition: targetPos,
        jobId: validJobId,
        level: levelLabel,
        interviewType: isBiz ? 'BEHAVIORAL' : 'TECHNICAL',
        sessionType: isRetry ? 'PRACTICE_RETRY' : 'MOCK',
        parentSessionId: isRetry ? retryParentSessionId : null,
      });
      sid = res?.data?.sessionId || res?.sessionId || res?.data?.data?.sessionId;
      if (sid) {
        setCurrentSessionId(sid);
      }
      setRetryParentSessionId(null);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || '';
      if (errMsg.includes('hạn ngạch') || errMsg.includes('miễn phí') || errMsg.includes('nâng cấp') || errMsg.includes('gói')) {
        setQuotaExceededMessage(quotaStatus?.planName || 'Free Candidate');
        setIsQuotaModalOpen(true);
        showToast('⚠️ ' + errMsg);
        return; // Dừng lại, không cho phép vào phòng phỏng vấn
      }
      console.warn('Backend startSession failed, continuing local session:', err);
    }

    // Cập nhật lại trạng thái quota sau khi tạo phiên thành công
    fetchQuotaStatus();

    // 2. Chuyển phòng Live ngay lập tức và bật trạng thái AI đang chuẩn bị phỏng vấn
    setCoachUsageCount(0);
    setCurrentAnswer('');
    setTimerSec(0);
    setTimerOn(true);
    setView('live');
    isLiveSessionRef.current = true;
    isMicDesiredRef.current = true;
    setIsAiThinking(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset toàn bộ Telemetry về giá trị thực tế cho phiên mới
    telemetryHistoryRef.current = {
      pitchSamples: [],
      wpmSamples: [],
      eyeContactSamples: [],
      emotions: { confident: 0, smiling: 0, focused: 0, tense: 0 },
      postures: { good: 0, bowing: 0, profile: 0, lookingUp: 0 },
      totalFillers: 0,
      hasCameraEverBeenOn: isCameraOn || isSimulatedCamera,
    };
    if (!(isCameraOn || isSimulatedCamera)) {
      setLiveEyeContactPercent(0);
      setLiveFacialEmotion('Chưa bật camera');
      setLivePostureStatus('Chưa bật camera');
    }

    // 3. Trích xuất ngữ cảnh chi tiết từ Bản tin tuyển dụng (JD) và CV ứng viên
    const jobSnippet = selectedJob ? getJobSnippet(selectedJob) : '';
    const cvSnippet = selectedCv ? getCvSnippet(selectedCv) : '';
    const computedDifficulty = (selectedLevel === 'intern' || selectedLevel === 'junior') ? 'EASY' : (selectedLevel === 'senior' || selectedLevel === 'lead') ? 'HARD' : 'STANDARD';
    const fullTargetPosition = `${levelLabel} - ${targetPos}`;

    // 4. Sinh câu hỏi mở đầu 100% ĐỘNG từ Gemini AI Agent dựa trên đúng bảng tin tuyển dụng và CV đã chọn
    let dynamicGreeting = openingGreetingFallback;
    try {
      const voiceTurnPromise = interviewApi.processVoiceTurnStandalone({
        targetPosition: fullTargetPosition,
        userSpeech: `Xin chào ban phỏng vấn, tôi là ${candidateName}, đã sẵn sàng cho buổi phỏng vấn vị trí ${fullTargetPosition}${selectedJob?.companyName ? ' tại ' + selectedJob.companyName : ''}.`,
        history: [],
        focusNotes: focusPrompt,
        cvSnippet,
        jobSnippet,
        persona: selectedPersona || interviewConfig?.interviewerPersona || 'HR_MANAGER',
        difficulty: computedDifficulty,
        maxQuestions: quotaStatus?.maxQuestions || 3,
        planName: quotaStatus?.planName || 'Free Candidate',
      });

      // Giới hạn thời gian chờ tối đa 3.5 giây để không làm trễ trải nghiệm
      const voiceRes = await Promise.race([
        voiceTurnPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 3500))
      ]);

      const aiReply = (voiceRes?.data?.reply || voiceRes?.reply || voiceRes?.data?.data?.reply || '')?.trim();
      if (aiReply && aiReply.length >= 15) {
        dynamicGreeting = aiReply;
      }
    } catch (apiErr) {
      console.warn('Lỗi gọi Gemini cho câu hỏi mở đầu, dùng fallback:', apiErr);
    }

    if (!isLiveSessionRef.current) return;

    setIsAiThinking(false);

    const initialTurn = {
      id: `ai-init-${Date.now()}`,
      sender: 'ai',
      speakerName: 'HireMate AI',
      text: dynamicGreeting,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogueHistory([initialTurn]);
    recentAiTurnsRef.current = [dynamicGreeting];

    // Phát âm câu mở đầu tự sinh độc nhất bằng giọng Neural AI chuẩn phòng thu
    speakNeuralAudio(dynamicGreeting);
  };

  // Trình tạo phản hồi thích ứng theo ngữ cảnh dự phòng (Domain-aware Adaptive Generator)
  // Đảm bảo AI KHÔNG BAO GIỜ IM LẶNG dù mạng chập chờn hay backend bận
  const getIntelligentTurnFallback = (targetPos, ansText, turnIndex) => {
    const t = (targetPos || '').toLowerCase();
    const a = (ansText || '').toLowerCase();

    // Lĩnh vực: Tester / QA / QC / Automation Test
    if (t.includes('test') || t.includes('qa') || t.includes('qc') || a.includes('test') || a.includes('auto') || a.includes('bug')) {
      if (a.includes('auto') || a.includes('selenium') || a.includes('playwright') || a.includes('script') || a.includes('file')) {
        return 'Tôi hiểu bạn đang sử dụng các file script và framework automation để phát triển kiểm thử. Bạn có thể nói rõ hơn về cách tổ chức Page Object Model (POM) hoặc cách bạn assert kiểm tra dữ liệu kết quả trong framework đó không?';
      }
      if (a.includes('manual') || a.includes('tay')) {
        return 'Rất tốt. Vậy với các tính năng nghiệp vụ phức tạp, bạn thiết kế Test Cases và áp dụng kỹ thuật phân vùng tương đương hay bảng quyết định như thế nào để đảm bảo độ bao phủ?';
      }
      const qaQuestions = [
        'Cảm ơn bạn. Khi gặp một lỗi ngắt quãng (intermittent bug) chỉ xuất hiện 1-2 lần trên môi trường production, quy trình bạn tái hiện và phối hợp với Dev team ra sao?',
        'Tôi ghi nhận câu trả lời của bạn. Trong dự án kiểm thử gần nhất, bạn đo lường hiệu quả bằng những chỉ số nào, ví dụ như Defect Density hay Test Coverage?',
        'Rất rõ ràng. Bạn có thể chia sẻ thêm về cách bạn phân biệt mức độ nghiêm trọng (Severity) và độ ưu tiên (Priority) của một lỗi khi báo cáo cho Product Owner không?',
      ];
      return qaQuestions[turnIndex % qaQuestions.length];
    }

    // Lĩnh vực: Lập trình viên / Developer / Kỹ sư phần mềm
    if (t.includes('developer') || t.includes('engineer') || t.includes('dev') || t.includes('software') || t.includes('lập trình') || t.includes('frontend') || t.includes('backend') || t.includes('fullstack')) {
      const devQuestions = [
        'Cảm ơn bạn. Bạn có thể giải thích sâu hơn về giải pháp kiến trúc và cách bạn tối ưu hiệu năng hoặc xử lý ngoại lệ phát sinh trong trường hợp đó không?',
        'Rất thú vị. Nếu hệ thống của bạn tăng tải đột biến gấp 10 lần, điểm nghẽn (bottleneck) lớn nhất sẽ nằm ở đâu và bạn giải quyết thế nào?',
        'Tôi hiểu ý của bạn. Bạn đã áp dụng Unit Test hoặc CI/CD pipeline để đảm bảo chất lượng code trong giai đoạn đó như thế nào?',
      ];
      return devQuestions[turnIndex % devQuestions.length];
    }

    // Lĩnh vực chung / Kỹ năng mềm / Nghiệp vụ
    const defaultQuestions = [
      'Cảm ơn bạn đã chia sẻ. Bạn có thể kể cụ thể hơn một thử thách khó khăn nhất bạn từng gặp trong quá trình đó và bài học rút ra là gì không?',
      'Rất thực tế. Kết quả cuối cùng của công việc đó được đo lường bằng con số hay phản hồi cụ thể nào từ người dùng hoặc cấp trên?',
      'Tôi đã nắm được thông tin. Nếu được làm lại dự án đó từ đầu, bạn sẽ cải tiến hoặc làm khác đi điều gì để tối ưu hơn?',
    ];
    return defaultQuestions[turnIndex % defaultQuestions.length];
  };

  // Gửi câu trả lời: Xử lý cả khi nói micro hoặc gõ phím nhắn tin với bộ lọc chống lặp lại âm thanh AI
  const handleSendCandidateTurn = async (customText = null) => {
    if (!isLiveSessionRef.current) return;
    if (isTurnProcessingRef.current) return;
    const ansText = (customText != null ? customText : currentAnswer).trim();
    if (!ansText) return;

    // TIER 3: ALGORITHMIC ECHO GUARD (Chặn đứng hiện tượng micro thu lại chính lời AI vừa nói)
    if (isEchoOfAi(ansText, recentAiTurnsRef.current)) {
      console.warn('Echo Guard: Bỏ qua tiếng vọng lặp lại của AI:', ansText);
      baseSpeechRef.current = '';
      currentAnswerRef.current = '';
      setCurrentAnswer('');
      showToast('🛡️ Đã lọc âm vọng từ loa để bạn trả lời chính xác.');
      return;
    }

    isTurnProcessingRef.current = true;
    patienceRoundsRef.current = 0;
    setListenStatus('idle');
    setCoaching(null);
    setShowCoach(false);
    stopSpeaking();
    stopSpeechRecognizer();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    baseSpeechRef.current = '';
    currentAnswerRef.current = '';
    setCurrentAnswer('');

    // Đo lường thống kê lời thoại cho lượt này
    const turnSpeechStart = speechTurnStartTimeRef.current;
    const turnWords = ansText.trim().split(/\s+/).filter(Boolean).length;
    const turnDurationMin = turnSpeechStart > 0
      ? Math.max(0.04, (Date.now() - turnSpeechStart) / 60000)
      : Math.max(0.04, turnWords / 130);
    const calculatedTurnWpm = Math.min(220, Math.max(60, Math.round(turnWords / turnDurationMin)));

    // Chỉ lưu sample WPM vào thống kê phiên nếu câu trả lời thực tế được nói qua micro (từ 4 từ trở lên)
    if (turnWords >= 4 && isMicOn && turnSpeechStart > 0) {
      telemetryHistoryRef.current.wpmSamples.push(calculatedTurnWpm);
    }

    // Đếm chính xác số từ đệm trong câu trả lời hoàn chỉnh của lượt này
    const { count: finalTurnFillers } = detectFillerWords(ansText);
    if (finalTurnFillers > 0) {
      telemetryHistoryRef.current.totalFillers += finalTurnFillers;
      setSessionFillerCount((prev) => prev + finalTurnFillers);
    }

    // Thu thập file ghi âm lượt nói của ứng viên nếu micro đang hoạt động
    let recordedBlob = null;
    let localBlobUrl = null;
    if (isMicOn) {
      try {
        recordedBlob = await stopAndCollectTurnAudioBlob();
        if (recordedBlob && recordedBlob.size > 500) {
          localBlobUrl = URL.createObjectURL(recordedBlob);
        }
      } catch (recErr) {
        console.warn('Collect audio blob error:', recErr);
      }
    }

    const userTurn = {
      id: `cand-${Date.now()}`,
      sender: 'candidate',
      speakerName: user?.fullName || 'Bạn',
      text: ansText,
      audioUrl: localBlobUrl || null,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setDialogueHistory((prev) => [...prev, userTurn]);
    setIsAiThinking(true);

    const isJob = contextMode === 'job' || contextMode === 'ai-recommend';
    const targetPos = isJob && selectedJob ? selectedJob.title : customPosition;
    const focusPrompt = getFullFocusPrompt();
    const cvSnippet = selectedCv ? getCvSnippet(selectedCv) : '';
    const jobSnippet = selectedJob ? getJobSnippet(selectedJob) : '';

    // Ảnh chụp hội thoại TRƯỚC lượt này (lấy từ ref để không bị state cũ trong closure của micro)
    const historySnapshot = dialogueHistoryRef.current.filter((d) => d.id !== 'ai-init-loading' && d.id !== userTurn.id);
    const lastAiTurnBefore = [...historySnapshot].reverse().find((d) => d.sender === 'ai');
    const questionTextBefore = lastAiTurnBefore?.text || 'Câu hỏi chuyên môn';
    const isAskToRepeat = /^(nhắc lại|lặp lại|nói lại|bạn có thể nhắc lại|cho mình nghe lại|mình chưa nghe rõ|xin nhắc lại|xin lặp lại|phiền bạn nói lại)/i.test(ansText.trim()) && ansText.trim().split(/\s+/).length < 18;

    const candidateTurnCount = historySnapshot.filter((d) => d.sender === 'candidate').length;
    const maxQ = quotaStatus?.maxQuestions || 3;
    const isFinalTurn = !isAskToRepeat && ((candidateTurnCount + 1) >= maxQ);

    try {
      // Gửi tối đa 16 dòng hội thoại gần nhất (câu trả lời hiện tại gửi riêng qua userSpeech, không lặp lại)
      const historyStrings = historySnapshot
        .slice(-16)
        .map((d) => `${d.sender === 'ai' ? 'HireMate AI' : 'Ứng viên'}: ${d.text}`);

      const endingDirective = isFinalTurn
        ? ` [LƯU Ý CUỐI PHIÊN: Đây là câu trả lời thứ ${candidateTurnCount + 1}/${maxQ} - câu hỏi cuối cùng của gói ${quotaStatus?.planName || 'Free Candidate'}. Bạn hãy đưa ra nhận xét ngắn gọn về câu trả lời vừa rồi, gửi lời cảm ơn và chào tạm biệt ứng viên để kết thúc buổi phỏng vấn. TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI MỚI NÀO NỮA!]`
        : '';

      const levelLabel = LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle';
      const computedDifficulty = (selectedLevel === 'intern' || selectedLevel === 'junior') ? 'EASY' : (selectedLevel === 'senior' || selectedLevel === 'lead') ? 'HARD' : 'STANDARD';
      const fullTargetPosition = `${levelLabel} - ${targetPos}`;

      const payload = {
        targetPosition: fullTargetPosition,
        userSpeech: ansText,
        history: historyStrings,
        focusNotes: (focusPrompt || '') + endingDirective,
        cvSnippet,
        jobSnippet,
        persona: selectedPersona || interviewConfig?.interviewerPersona || 'HR_MANAGER',
        difficulty: computedDifficulty,
        maxQuestions: maxQ,
        planName: quotaStatus?.planName || 'Free Candidate',
      };

      const callVoiceTurn = () => (currentSessionId
        ? interviewApi.processVoiceTurn(currentSessionId, payload)
        : interviewApi.processVoiceTurnStandalone(payload));

      // Đua thời gian (Race condition): Giới hạn tối đa 4.5s chờ API.
      // Nếu mạng hoặc AI phản hồi chậm quá 4.5s -> Kích hoạt ngay Intelligent Adaptive Fallback để trả lời tức thì, triệt tiêu hoàn toàn tình trạng đơ/chậm!
      let voiceRes = null;
      try {
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 4500));
        voiceRes = await Promise.race([callVoiceTurn(), timeoutPromise]);
      } catch (turnErr) {
        console.warn('Voice turn API gặp sự cố mạng, chuyển ngay sang Adaptive Fallback:', turnErr);
      }

      // Nếu người dùng đã bấm kết thúc trong lúc đang chờ API, hủy ngay không phát biểu!
      if (!isLiveSessionRef.current) return;

      let aiReply = (voiceRes?.data?.reply || voiceRes?.reply || voiceRes?.data?.data?.reply || '')?.trim();
      if (!aiReply || aiReply.length < 8) {
        aiReply = isFinalTurn
          ? `Cảm ơn bạn rất nhiều! Bạn đã hoàn thành tốt các câu hỏi trong buổi phỏng vấn hôm nay cho vị trí ${targetPos}. Chúng tôi sẽ tổng kết kết quả đánh giá chi tiết ngay bây giờ.`
          : getIntelligentTurnFallback(targetPos, ansText, candidateTurnCount);
      }

      // Lưu trữ phát biểu của AI vào bộ đệm chống echo
      recentAiTurnsRef.current.push(aiReply);
      if (recentAiTurnsRef.current.length > 5) recentAiTurnsRef.current.shift();

      const questionText = questionTextBefore;

      if (currentSessionId && !isAskToRepeat) {
        const hasSpokenAudio = Boolean(isMicOn && (turnSpeechStart > 0 || liveWpm > 0 || livePitchHz > 0));
        const hasCameraActive = Boolean(isCameraOn || isSimulatedCamera);

        const savePromise = (async () => {
          let cloudAudioUrl = null;
          if (recordedBlob && recordedBlob.size > 500) {
            try {
              const upRes = await interviewApi.uploadAudio(recordedBlob);
              cloudAudioUrl = upRes?.data?.audioUrl || upRes?.audioUrl || upRes?.data?.data?.audioUrl || null;
              if (cloudAudioUrl) {
                userTurn.audioUrl = cloudAudioUrl;
              }
            } catch (upErr) {
              console.warn('Upload candidate audio to Cloud CDN failed, using local fallback:', upErr);
            }
          }

          return interviewApi.submitAnswer(currentSessionId, {
            questionNumber: historySnapshot.filter((d) => d.sender === 'ai').length,
            questionText: questionText,
            candidateAnswerText: ansText,
            audioUrl: cloudAudioUrl || null,
            wordsPerMinute: hasSpokenAudio ? (calculatedTurnWpm || liveWpm) : null,
            clarityScore: Math.max(50, Math.min(98, 92 - finalTurnFillers * 4)),
            pitchHz: (hasSpokenAudio && livePitchHz > 0) ? livePitchHz : null,
            eyeContactPercent: hasCameraActive ? liveEyeContactPercent : null,
            facialEmotion: hasCameraActive ? liveFacialEmotion : null,
            fillerCount: finalTurnFillers,
          });
        })().catch((err) => console.warn('Submit answer background save:', err));

        pendingAnswerSavesRef.current.push(savePromise);
      }

      speechTurnStartTimeRef.current = 0;
      setTurnFillerCount(0);

      const aiNextTurn = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        speakerName: 'HireMate AI',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setIsAiThinking(false);
      setDialogueHistory((prev) => [...prev, aiNextTurn]);
      speakNeuralAudio(aiReply);

      // Nếu là câu cuối cùng của gói, tự động kết thúc buổi phỏng vấn sau khi AI chào
      if (isFinalTurn) {
        showToast(`🎉 Chúc mừng bạn đã hoàn thành đủ ${maxQ} câu hỏi của gói ${quotaStatus?.planName || 'Free Candidate'}!`);
        setTimeout(() => {
          if (isLiveSessionRef.current) {
            handleFinishInterview(true);
          }
        }, 4000);
      }

    } catch (err) {
      console.warn('Lỗi kết nối Voice Turn backend, tự động kích hoạt AI Adaptive Generator:', err);
      // HỒI PHỤC THÔNG MINH: Tuyệt đối KHÔNG BAO GIỜ để AI im lặng!
      if (isLiveSessionRef.current) {
        const localFallbackReply = isFinalTurn
          ? `Cảm ơn bạn đã tham gia buổi phỏng vấn vị trí ${targetPos}. Bạn đã trả lời đủ số câu hỏi quy định. Hệ thống đang tiến hành tổng kết kết quả đánh giá cho bạn!`
          : getIntelligentTurnFallback(targetPos, ansText, candidateTurnCount);

        recentAiTurnsRef.current.push(localFallbackReply);
        if (recentAiTurnsRef.current.length > 5) recentAiTurnsRef.current.shift();

        const aiNextTurn = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          speakerName: 'HireMate AI',
          text: localFallbackReply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };

        setIsAiThinking(false);
        setDialogueHistory((prev) => [...prev, aiNextTurn]);
        speakNeuralAudio(localFallbackReply);

        if (isFinalTurn) {
          setTimeout(() => {
            if (isLiveSessionRef.current) {
              handleFinishInterview(true);
            }
          }, 3500);
        }
      }
    } finally {
      isTurnProcessingRef.current = false;
    }

  };

  // Huấn luyện cách trả lời: phân tích câu hỏi hiện tại và chỉ khung/ý chính cần nói (không đọc sẵn đáp án)
  const handleRequestCoaching = async () => {
    if (showCoach) {
      setShowCoach(false);
      return;
    }

    const isFree = !quotaStatus?.planName || quotaStatus?.planName?.toLowerCase().includes('free') || (quotaStatus?.maxQuestions && quotaStatus.maxQuestions <= 3);
    const isPlus = quotaStatus?.planName && quotaStatus?.planName?.toLowerCase().includes('plus');
    const maxCoachUses = quotaStatus?.coachHintsPerSession != null ? quotaStatus.coachHintsPerSession : (isFree ? 1 : isPlus ? 3 : 999);

    if (coachUsageCount >= maxCoachUses) {
      setQuotaExceededMessage(`${quotaStatus?.planName || 'Free Candidate'} (Tối đa ${maxCoachUses} lượt gợi ý)`);
      setIsQuotaModalOpen(true);
      showToast(`🔒 Gói ${quotaStatus?.planName || 'Free Candidate'} chỉ hỗ trợ ${maxCoachUses} lượt gợi ý/buổi. Nâng cấp Practice Pro để nhận gợi ý không giới hạn!`);
      return;
    }

    setCoachUsageCount((prev) => prev + 1);
    setShowCoach(true);
    const lastAi = [...dialogueHistoryRef.current].reverse().find((d) => d.sender === 'ai');
    if (!lastAi?.text) {
      setCoaching(null);
      return;
    }
    if (coaching && coaching.forQuestionId === lastAi.id) return; // Đã có gợi ý cho đúng câu hỏi này
    setIsCoachLoading(true);
    try {
      const isJob = contextMode === 'job' || contextMode === 'ai-recommend';
      const targetPos = isJob && selectedJob ? selectedJob.title : customPosition;
      const res = await interviewApi.getAnswerCoaching({
        question: lastAi.text,
        targetPosition: targetPos,
        cvSnippet: selectedCv ? getCvSnippet(selectedCv) : '',
        level: LEVELS.find((l) => l.id === selectedLevel)?.label || '',
      });
      setCoaching(res?.data ? { ...res.data, forQuestionId: lastAi.id } : null);
    } catch (err) {
      console.warn('Không tải được gợi ý trả lời:', err);
      setCoaching(null);
      showToast('Chưa tải được gợi ý, bạn thử lại nhé.');
    } finally {
      setIsCoachLoading(false);
    }
  };

  // Hoàn thành phỏng vấn & Xem báo cáo STAR (Ngắt dứt khoát toàn bộ âm thanh)
  const handleFinishInterview = async (forceComplete = false) => {
    const candidateTurns = dialogueHistory.filter((d) => d.sender === 'candidate');
    const maxQ = quotaStatus?.maxQuestions || 3;
    if (!forceComplete && candidateTurns.length < maxQ) {
      if (!window.confirm(`Bạn mới trả lời ${candidateTurns.length}/${maxQ} câu hỏi của gói ${quotaStatus?.planName || 'Free Candidate'}. Bạn có chắc muốn dừng phiên sớm để xem kết quả đánh giá không?`)) {
        return;
      }
    }


    setIsFinishing(true);

    // Chờ tất cả lượt gửi câu trả lời hoàn tất để backend ghi nhận đầy đủ 100% dữ liệu trước khi kết thúc
    if (pendingAnswerSavesRef.current.length > 0) {
      try {
        await Promise.allSettled(pendingAnswerSavesRef.current);
      } catch (e) {
        console.warn('Wait for pending answer saves:', e);
      }
      pendingAnswerSavesRef.current = [];
    }

    isLiveSessionRef.current = false;
    cleanupAudioResources();
    setTimerOn(false);

    // Tổng hợp Telemetry thời gian thực (Camera + Audio) để gửi lên Backend đánh giá đa chiều
    const hasCamera = Boolean(
      (telemetryHistoryRef.current.hasCameraEverBeenOn || isCameraOn || isSimulatedCamera) &&
      telemetryHistoryRef.current.eyeContactSamples.length > 0
    );

    const avgEye = hasCamera
      ? Math.round(telemetryHistoryRef.current.eyeContactSamples.reduce((a, b) => a + b, 0) / telemetryHistoryRef.current.eyeContactSamples.length)
      : null;
    const hasAudio = telemetryHistoryRef.current.pitchSamples.length > 0 || telemetryHistoryRef.current.wpmSamples.length > 0;
    const avgPitch = telemetryHistoryRef.current.pitchSamples.length > 0
      ? Math.round(telemetryHistoryRef.current.pitchSamples.reduce((a, b) => a + b, 0) / telemetryHistoryRef.current.pitchSamples.length)
      : (livePitchHz > 0 ? livePitchHz : null);
    const avgWpm = telemetryHistoryRef.current.wpmSamples.length > 0
      ? Math.round(telemetryHistoryRef.current.wpmSamples.reduce((a, b) => a + b, 0) / telemetryHistoryRef.current.wpmSamples.length)
      : (liveWpm > 0 ? liveWpm : null);

    // Xác định dominantEmotion từ thống kê toàn phiên
    let sessionDominantEmotion = 'Chưa bật camera';
    if (hasCamera && telemetryHistoryRef.current.emotions) {
      const em = telemetryHistoryRef.current.emotions;
      const sortedEmotions = [
        { name: 'Tự tin & Thân thiện 😊', count: em.confident || 0 },
        { name: 'Mỉm cười tích cực 😄', count: em.smiling || 0 },
        { name: 'Tập trung cao độ 🧐', count: em.focused || 0 },
        { name: 'Căng thẳng • Hơi lo lắng 😟', count: em.tense || 0 },
      ].sort((a, b) => b.count - a.count);
      sessionDominantEmotion = (sortedEmotions[0]?.count > 0) ? sortedEmotions[0].name : (liveFacialEmotion || 'Tập trung cao độ 🧐');
    }

    // Xác định dominantPosture từ thống kê toàn phiên
    let sessionDominantPosture = 'Chưa bật camera';
    if (hasCamera && telemetryHistoryRef.current.postures) {
      const pos = telemetryHistoryRef.current.postures;
      const sortedPostures = [
        { name: 'Cân đối • Nhìn thẳng camera', count: pos.good || 0 },
        { name: 'Cúi đầu • Chưa tự tin', count: pos.bowing || 0 },
        { name: 'Quay mặt sang bên • Không nhìn camera', count: pos.profile || 0 },
        { name: 'Ngửa đầu lên cao', count: pos.lookingUp || 0 },
      ].sort((a, b) => b.count - a.count);
      sessionDominantPosture = (sortedPostures[0]?.count > 0) ? sortedPostures[0].name : (livePostureStatus || 'Cân đối • Nhìn thẳng camera');
    }

    const telemetryPayload = {
      isCameraUsed: hasCamera,
      isMicrophoneUsed: Boolean(hasAudio || (avgWpm && avgWpm > 0)),
      avgEyeContact: hasCamera ? avgEye : null,
      avgPitchHz: avgPitch,
      avgWpm: avgWpm,
      totalFillers: sessionFillerCount,
      emotionSummary: sessionDominantEmotion,
      dominantEmotion: sessionDominantEmotion,
      postureStatus: sessionDominantPosture,
      postureSummary: sessionDominantPosture,
      emotions: hasCamera ? telemetryHistoryRef.current.emotions : { confident: 0, smiling: 0, focused: 0, tense: 0 },
      durationSeconds: timerSec,
      durationFormatted: fmt(timerSec),
      level: LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle',
    };

    setIsFinishing(false);
    const isJob = contextMode === 'job' || contextMode === 'ai-recommend';
    const targetPos = cleanTopicName((isJob && selectedJob ? selectedJob.title : customPosition) || 'Chuyên viên Kỹ thuật Phần mềm');
    const compName = (isJob && selectedJob?.companyName) ? selectedJob.companyName : 'Doanh nghiệp Tuyển dụng';

    // Tiêu chuẩn đánh giá: Phải có ít nhất 1 câu trả lời từ ứng viên
    const isIncomplete = candidateTurns.length === 0;

    let backendResult = null;
    if (!isIncomplete && currentSessionId) {
      try {
        const compRes = await interviewApi.completeSession(currentSessionId, telemetryPayload);
        if (compRes?.data) {
          backendResult = compRes.data;
        }
      } catch (err) {
        console.warn('Backend completeSession failed, building evaluation summary:', err);
      }
    }

    if (isIncomplete) {
      const incompleteResult = {
        id: 'HM-' + (backendResult?.sessionId || Math.floor(1000 + Math.random() * 9000)),
        sessionId: backendResult?.sessionId,
        date: new Date().toISOString().split('T')[0],
        topic: targetPos,
        companyName: compName,
        level: LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle',
        duration: fmt(timerSec),
        isIncomplete: true,
        planName: backendResult?.planName || quotaStatus?.planName || 'Free Candidate',
        maxQuestions: backendResult?.maxQuestions || quotaStatus?.maxQuestions || 3,
        maxDurationSeconds: backendResult?.maxDurationSeconds || quotaStatus?.maxDurationSeconds || 300,
        unlockFullStar: backendResult?.unlockFullStar ?? quotaStatus?.unlockFullStar,
        unlockRoadmapStages: backendResult?.unlockRoadmapStages ?? quotaStatus?.unlockRoadmapStages,
        totalScore: 0,
        grade: 'Chưa Đạt Yêu Cầu Đánh Giá',
        questionsCount: 0,
        competencies: {
          domainKnowledge: 0,
          problemSolving: 0,
          structureSTAR: 0,
          deliveryTone: 0,
        },
        aiSummary: `Buổi phỏng vấn kết thúc mà chưa ghi nhận câu trả lời nào từ ứng viên. Vui lòng bấm "Luyện Tập Lại Ngay" và bật Micro hoặc gõ câu trả lời để AI phân tích năng lực chuyên môn và phong thái thực tế.`,
        weaknessSummary: 'Chưa có dữ liệu đàm thoại để phân tích điểm mạnh và lỗ hổng kỹ năng.',
        strengths: [],
        criticalFlaws: [
          'Chưa có câu trả lời nào được gửi đến người phỏng vấn AI.',
          'Hãy đảm bảo Micro hoặc bàn phím hoạt động bình thường khi phỏng vấn.',
        ],
        improvementPlan: [
          'Bấm "Luyện Tập Lại Ngay" để bắt đầu lại phiên phỏng vấn.',
          'Nói qua Micro hoặc mở khung Tin Nhắn (💬) để trả lời từng câu hỏi.',
        ],
        questions: [],
      };

      setResult(incompleteResult);
      setView('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Trường hợp có câu trả lời thực tế (candidateTurns.length >= 1)
    let scoredQuestions = [];
    const deliveryScoreVal = Math.round(
      backendResult?.deliveryToneScore ||
      backendResult?.communicationScore ||
      (hasCamera && avgEye >= 70 ? 80 : 65)
    );

    if (backendResult?.details && backendResult.details.length > 0) {
      scoredQuestions = backendResult.details.map((d, idx) => {
        const words = (d.candidateAnswerText || '').trim().split(/\s+/).filter(Boolean).length;
        return {
          q: d.questionText || dialogueHistory[idx * 2]?.text || `Câu hỏi số ${idx + 1}`,
          audioUrl: d.audioUrl || candidateTurns[idx]?.audioUrl || null,
          score: Math.round(d.aiEvaluationScore != null ? d.aiEvaluationScore : 20),
          domainScore: Math.round(d.aiEvaluationScore != null ? d.aiEvaluationScore : 20),
          problemScore: Math.round(d.aiEvaluationScore != null ? d.aiEvaluationScore : 15),
          starScore: Math.round((d.aiEvaluationScore != null ? d.aiEvaluationScore : 20) * 0.8),
          deliveryScore: deliveryScoreVal,
          wpm: d.wordsPerMinute || avgWpm,
          pitchHz: d.pitchHz || avgPitch,
          eyeContact: d.eyeContactPercent != null ? d.eyeContactPercent : (hasCamera ? avgEye : null),
          words: words,
          answer: d.candidateAnswerText || '(Ứng viên đã trả lời)',
          criticalFeedback: {
            flaws: d.aiFeedback || 'Cần bổ sung thêm ví dụ thực tế và số liệu định lượng theo mô hình STAR.',
            interviewerImpression: d.tone || (d.aiEvaluationScore >= 60 ? 'Ứng viên có phản xạ đối đáp chuyên môn.' : 'Chưa đáp ứng tiêu chuẩn tuyển dụng, câu trả lời còn sơ sài.')
          },
          modelAnswer: d.aiSuggestedAnswer || `Gợi ý câu trả lời mẫu chuẩn điểm 10 cho vị trí ${targetPos}`,
        };
      });
    } else {
      // Đánh giá NLP thời gian thực sâu sắc từng câu đối đáp
      const techTerms = [
        // QA, QC & Software Testing (Kiểm thử phần mềm)
        'test case', 'test plan', 'test suite', 'test scenario', 'bug', 'defect', 'severity', 'priority',
        'regression', 'smoke test', 'sanity test', 'boundary value', 'equivalence partitioning', 'phân vùng tương đương',
        'giá trị biên', 'decision table', 'bảng quyết định', 'selenium', 'postman', 'jmeter', 'playwright', 'cypress',
        'testng', 'junit', 'automation test', 'manual test', 'kiểm thử', 'uat', 'api test', 'integration test',
        'performance test', 'load test', 'stress test', 'security test', 'black-box', 'white-box', 'test report',
        'pom', 'page object model', 'assert', 'mock', 'stub', 'jira', 'ci/cd pipeline',
        // Backend & Database & Architecture
        'java', 'spring', 'boot', 'react', 'node', 'api', 'rest', 'sql', 'database', 'cơ sở dữ liệu',
        'redis', 'cache', 'docker', 'microservice', 'microservices', 'kafka', 'message queue', 'aws',
        'cloud', 'ci/cd', 'git', 'frontend', 'backend', 'fullstack', 'css', 'html', 'javascript',
        'typescript', 'component', 'hook', 'state', 'redux', 'controller', 'service', 'repository',
        'entity', 'jpa', 'hibernate', 'clean architecture', 'solid', 'design pattern', 'oop', 'unit test',
        'transaction', 'acid', 'concurrency', 'multithreading', 'deadlock', 'index', 'b-tree', 'postgresql', 'mysql',
        // Business Analyst & Project Management
        'srs', 'user story', 'acceptance criteria', 'bpmn', 'use case', 'stakeholder', 'scrum', 'sprint',
        'backlog', 'agile', 'product owner', 'retrospective', 'kpi', 'roi', 'nghiệp vụ', 'luồng nghiệp vụ',
        // Business, Sales & Marketing
        'kế toán', 'tài chính', 'thuế', 'doanh thu', 'lợi nhuận', 'sales', 'khách hàng', 'crm',
        'marketing', 'seo', 'chiến dịch', 'chốt sale', 'đàm phán', 'quản lý', 'nhân sự', 'tuyển dụng'
      ];
      const problemTerms = [
        'nguyên nhân', 'bản chất', 'lỗi', 'sự cố', 'phân tích', 'troubleshoot', 'debug', 'giải pháp',
        'khắc phục', 'tối ưu', 'xử lý', 'thay thế', 'cân nhắc', 'đánh đổi', 'trade-off', 'rủi ro',
        'ngoại lệ', 'rollback', 'giám sát', 'bottleneck', 'nghẽn', 'hiệu năng', 'thử thách', 'root cause'
      ];

      scoredQuestions = candidateTurns.map((turn, idx) => {
        const text = turn.text.trim();
        const lower = text.toLowerCase();
        const words = text.split(/\s+/).filter(Boolean).length;

        // Trụ cột Chuyên môn (35%): KHÔNG TÔ VẼ - Nếu thiếu từ khóa chuyên môn, phạt nặng!
        let techMatch = 0;
        techTerms.forEach((kw) => { if (lower.includes(kw)) techMatch++; });
        let qDomain = 0;
        if (techMatch === 0) {
          // Hoàn toàn không có thuật ngữ chuyên môn: tối đa 25 điểm
          qDomain = Math.min(25, Math.round(words * 0.8));
        } else if (techMatch === 1) {
          qDomain = Math.min(50, Math.round(25 + (words > 20 ? 15 : 8)));
        } else if (techMatch === 2) {
          qDomain = Math.min(72, Math.round(45 + (words > 25 ? 18 : 10)));
        } else {
          qDomain = Math.min(95, Math.round(60 + techMatch * 8 + (words > 30 ? 10 : 0)));
        }

        // Trụ cột Giải quyết vấn đề (20%): Phải có phân tích nguyên nhân và phương án
        let probMatch = 0;
        problemTerms.forEach((pk) => { if (lower.includes(pk)) probMatch++; });
        let qProblem = 0;
        if (probMatch === 0) {
          qProblem = Math.min(25, Math.round(words * 0.6));
        } else if (probMatch === 1) {
          qProblem = Math.min(55, Math.round(30 + (words > 20 ? 15 : 8)));
        } else {
          qProblem = Math.min(95, Math.round(55 + probMatch * 10 + (words > 25 ? 10 : 0)));
        }

        // Trụ cột STAR (15%): Đo lường cấu trúc lập luận có số liệu và kết quả
        const hasS = /dự án|hệ thống|khi|bối cảnh|tại|thời điểm|tình huống|khách hàng/i.test(lower);
        const hasT = /yêu cầu|nhiệm vụ|mục tiêu|cần|phải|trách nhiệm|bài toán/i.test(lower);
        const hasA = /tôi đã|chúng tôi|triển khai|xây dựng|viết|thiết kế|tối ưu|áp dụng|cấu hình/i.test(lower);
        const hasR = /\d+%|\d+ ms|\d+s|\d+ triệu|\d+ lỗi|tăng|giảm|tiết kiệm|thành công|hoàn thành|kết quả/i.test(lower);

        let qStar = 10;
        if (hasS) qStar += 18;
        if (hasT) qStar += 18;
        if (hasA) qStar += 24;
        if (hasR) qStar += 25;
        if (!hasS && !hasT && !hasA && !hasR) {
          qStar = Math.min(20, Math.round(words * 0.5));
        }
        qStar = Math.min(95, qStar);

        // Trụ cột 4: Kỹ Năng Diễn Đạt & Sự Mạch Lạc (Verbal Communication - 20%)
        let qVerbalComm = 70;
        if (words < 15) {
          qVerbalComm = Math.min(20, Math.max(10, Math.round(words * 1.2)));
        } else if (words < 30) {
          qVerbalComm = Math.min(50, Math.round(20 + words));
        } else {
          qVerbalComm = Math.min(95, Math.round(55 + (words > 50 ? 25 : 15)));
        }
        if (sessionFillerCount > 0) qVerbalComm = Math.max(10, qVerbalComm - sessionFillerCount * 4);

        // 4 Trụ cột mới: Chuyên môn 35%, Giải quyết vấn đề 25%, STAR 20%, Diễn đạt & Mạch lạc 20%
        const realScore = Math.round(qDomain * 0.35 + qProblem * 0.25 + qStar * 0.20 + qVerbalComm * 0.20);

        // BỚI MÓC KHUYẾT ĐIỂM THẲNG THẮN - KHÔNG TÔ VẼ
        let flawComment = '';
        if (techMatch === 0) {
          flawComment += 'LỖI CHÍ MẠNG: Câu trả lời hoàn toàn thiếu thuật ngữ và nguyên lý chuyên môn của vị trí ' + targetPos + '. Bạn chỉ nói chung chung hoặc suy đoán cảm tính mà không đưa ra được công cụ, tiêu chuẩn kỹ thuật nào. ';
        } else if (techMatch < 2) {
          flawComment += 'Kiến thức kỹ thuật còn nông, chưa đi vào chiều sâu nguyên lý vận hành hay chi tiết kiến trúc giải pháp. ';
        }
        if (probMatch === 0) {
          flawComment += 'THIẾU TƯ DUY GIẢI QUYẾT VẤN ĐỀ: Không phân tích nguyên nhân gốc rễ (Root Cause), thiếu phương án xử lý sự cố và không nêu được các đánh đổi (Trade-offs). ';
        }
        if (!hasR) {
          flawComment += 'THIẾU MINH CHỨNG ĐỊNH LƯỢNG: Không có số liệu đo lường cụ thể (Metrics, % cải thiện, thời gian, số lượng bug...) theo mô hình STAR. ';
        }
        if (words < 20) {
          flawComment += 'TRÌNH BÀY QUÁ SƠ SÀI: Câu trả lời quá ngắn (' + words + ' từ), hời hợt, chưa đủ dữ liệu để chứng minh năng lực thực tế. ';
        }
        if (!flawComment) {
          flawComment = 'Lập luận tương đối rõ ràng. Cần chú ý phân tích sâu hơn các kịch bản ngoại lệ khi hệ thống mở rộng quy mô.';
        }

        const modelAnswer = `[S] Bối cảnh: Khi đối mặt với thử thách cốt lõi này trong dự án thực tế về ${targetPos}, hệ thống đòi hỏi độ chính xác cao và áp lực tối ưu hóa.\n[T] Nhiệm vụ: Tôi được giao trọng trách phân tích nguyên nhân gốc rễ, thiết kế giải pháp và đảm bảo tính liên tục của quy trình.\n[A] Hành động: Tôi trực tiếp lựa chọn công cụ chuyên môn, tái cấu trúc các bước xử lý và kiểm soát chặt chẽ các rủi ro phát sinh.\n[R] Kết quả: Giải quyết triệt để vấn đề, nâng cao hơn 35% hiệu suất vận hành và đáp ứng các tiêu chuẩn khắt khe.`;

        return {
          q: dialogueHistory[idx * 2]?.text || `Câu hỏi trao đổi số ${idx + 1}`,
          audioUrl: candidateTurns[idx]?.audioUrl || null,
          score: realScore,
          domainScore: qDomain,
          problemScore: qProblem,
          starScore: qStar,
          deliveryScore: qVerbalComm,
          answer: text,
          words,
          wpm: avgWpm != null && avgWpm > 0 ? avgWpm : null,
          pitchHz: avgPitch != null && avgPitch > 0 ? avgPitch : null,
          eyeContact: hasCamera ? avgEye : null,
          criticalFeedback: {
            flaws: flawComment,
            interviewerImpression: techMatch >= 2
              ? 'Ứng viên có nắm một số khái niệm kỹ thuật nhưng cần phản biện sắc bén và chặt chẽ hơn.'
              : 'ẤN TƯỢNG YẾU: Trình bày mơ hồ, thiếu kiến thức chuyên môn cốt lõi, chưa đáp ứng tiêu chuẩn tuyển dụng.'
          },
          modelAnswer,
        };
      });
    }


    const totalWordsAllTurns = candidateTurns.reduce((sum, t) => sum + (t.text ? t.text.trim().split(/\s+/).filter(Boolean).length : 0), 0);
    const meaningfulTurnsCount = candidateTurns.filter(t => t.text && t.text.trim().split(/\s+/).filter(Boolean).length >= 5).length;
    const isVeryShortSession = totalWordsAllTurns < 30 || meaningfulTurnsCount < 2;

    const calculatedAvg = scoredQuestions.length > 0
      ? Math.round(scoredQuestions.reduce((s, q) => s + q.score, 0) / scoredQuestions.length)
      : 20;

    let total = (backendResult?.overallScore != null && backendResult.overallScore > 0)
      ? Math.round(backendResult.overallScore)
      : calculatedAvg;

    if (isVeryShortSession) {
      total = Math.min(25, Math.max(10, total));
    }

    const targetMaxQuestions = backendResult?.maxQuestions || maxQ;
    const isSessionIncomplete = scoredQuestions.length < targetMaxQuestions;

    const grade = total >= 85
      ? 'Xuất Sắc'
      : total >= 70
        ? 'Đạt Yêu Cầu'
        : total >= 50
          ? 'Cần Rèn Luyện Thêm'
          : 'Không Đạt Yêu Cầu';

    let domainAvg = scoredQuestions.length > 0
      ? Math.round(scoredQuestions.reduce((s, q) => s + (q.domainScore ?? q.score), 0) / scoredQuestions.length)
      : total;
    let problemAvg = scoredQuestions.length > 0
      ? Math.round(scoredQuestions.reduce((s, q) => s + (q.problemScore ?? q.score), 0) / scoredQuestions.length)
      : total;
    let starAvg = scoredQuestions.length > 0
      ? Math.round(scoredQuestions.reduce((s, q) => s + (q.starScore ?? 20), 0) / scoredQuestions.length)
      : 20;
    let deliveryAvg = scoredQuestions.length > 0
      ? Math.round(scoredQuestions.reduce((s, q) => s + (q.deliveryScore ?? 20), 0) / scoredQuestions.length)
      : 20;

    if (isVeryShortSession) {
      domainAvg = Math.min(25, Math.max(10, Math.round(totalWordsAllTurns * 0.7)));
      problemAvg = Math.min(25, Math.max(10, Math.round(totalWordsAllTurns * 0.6)));
      starAvg = Math.min(20, Math.max(8, Math.round(totalWordsAllTurns * 0.5)));
      deliveryAvg = Math.min(25, Math.max(10, Math.round(totalWordsAllTurns * 0.6)));
    }

    const finalDeliveryFeedback = backendResult?.deliveryFeedback || (
      !hasCamera
        ? `Camera không được kích hoạt trong suốt buổi phỏng vấn. Hệ thống chỉ ghi nhận dữ liệu âm thanh qua Micro: Tốc độ phát biểu ${avgWpm} WPM, số lần dùng từ đệm: ${sessionFillerCount} lần. AI không chấm điểm cử chỉ hay ánh mắt do không có dữ liệu camera.`
        : `Tác phong thực tế: Duy trì tiếp xúc mắt ở mức ${avgEye}%. Tốc độ phát biểu ${avgWpm} WPM, số lần dùng từ đệm: ${sessionFillerCount} lần.`
    );

    const newResult = {
      id: 'HM-' + (backendResult?.sessionId || Math.floor(1000 + Math.random() * 9000)),
      sessionId: backendResult?.sessionId,
      date: new Date().toISOString().split('T')[0],
      topic: targetPos,
      companyName: compName,
      level: LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle',
      duration: fmt(timerSec),
      planName: backendResult?.planName || quotaStatus?.planName || 'Free Candidate',
      maxQuestions: targetMaxQuestions,
      maxDurationSeconds: backendResult?.maxDurationSeconds || quotaStatus?.maxDurationSeconds || 300,
      unlockFullStar: backendResult?.unlockFullStar ?? quotaStatus?.unlockFullStar,
      unlockRoadmapStages: backendResult?.unlockRoadmapStages ?? quotaStatus?.unlockRoadmapStages,
      isIncomplete: isSessionIncomplete,
      totalScore: total,
      grade,
      questionsCount: scoredQuestions.length,
      competencies: {
        domainKnowledge: Math.max(0, Math.min(100, Math.round(backendResult?.domainKnowledgeScore ?? domainAvg))),
        problemSolving: Math.max(0, Math.min(100, Math.round(backendResult?.problemSolvingScore ?? problemAvg))),
        structureSTAR: Math.max(0, Math.min(100, Math.round(backendResult?.starStructureScore ?? starAvg))),
        deliveryTone: Math.max(0, Math.min(100, Math.round(backendResult?.deliveryToneScore ?? backendResult?.communicationScore ?? deliveryAvg))),
      },
      deliveryFeedback: finalDeliveryFeedback,
      aiSummary: backendResult?.overallFeedback || (
        isSessionIncomplete
          ? `Buổi phỏng vấn vị trí "${targetPos}" kết thúc sớm khi mới thực hiện ${scoredQuestions.length}/${targetMaxQuestions} câu hỏi. Điểm tổng kết: ${total}/100. Xếp loại: ${grade}. Bạn nên hoàn thành đầy đủ tất cả các câu hỏi để nhận báo cáo chuẩn hóa năng lực.`
          : `Buổi phỏng vấn vị trí "${targetPos}" hoàn thành với ${scoredQuestions.length} lượt đối đáp chuyên sâu. Điểm tổng kết: ${total}/100. Xếp loại: ${grade}.`
      ),
      weaknessSummary: backendResult?.weaknessSummary || (
        isSessionIncomplete
          ? `Phiên phỏng vấn dừng lại quá sớm (${scoredQuestions.length}/${targetMaxQuestions} câu), dữ liệu chưa đủ để đánh giá toàn diện các tình huống chuyên môn.`
          : (total < 70 ? 'Lỗ hổng kiến thức chuyên môn cốt lõi nghiêm trọng, thiếu hoàn toàn số liệu định lượng và tư duy giải quyết vấn đề theo chuẩn ngành.' : 'Cần bổ sung các số liệu định lượng (Metrics & KPIs) chứng minh kết quả giải pháp theo mô hình STAR.')
      ),
      strengths: (total < 40 || isVeryShortSession || (scoredQuestions.length <= 1 && isSessionIncomplete)) ? [
        'Chưa ghi nhận được ưu điểm chuyên môn rõ nét do phiên phỏng vấn kết thúc quá sớm hoặc câu trả lời quá ngắn.'
      ] : (total >= 70 && !isSessionIncomplete ? [
        'Phản xạ hội thoại tốt, trả lời đúng trọng tâm câu hỏi của người phỏng vấn.',
        'Có kiến thức chuyên môn và dẫn chứng giải pháp thực tế.',
      ] : [
        'Đã có nỗ lực phản hồi các câu hỏi phỏng vấn trong buổi đối thoại.',
      ]),
      criticalFlaws: [
        ...(isSessionIncomplete ? [`Phiên phỏng vấn kết thúc sớm: Ứng viên mới trả lời ${scoredQuestions.length}/${targetMaxQuestions} câu hỏi, chưa hoàn thành đầy đủ các vòng thử thách chuyên môn.`] : []),
        ...(total >= 70 ? [
          'Cần đào sâu hơn vào các giải pháp dự phòng và phân tích trade-offs khi hệ thống gặp sự cố.',
          'Bổ sung dẫn chứng về số liệu ngân sách hoặc chỉ số hiệu suất tối ưu (KPIs/Metrics).',
        ] : [
          'Hổng kiến thức chuyên môn cơ bản và thiếu các thuật ngữ cốt lõi của vị trí ' + targetPos + '.',
          'Trình bày mang tính suy đoán cảm tính, chưa áp dụng mô hình STAR và không có số liệu thực chứng.',
          'Chưa đạt chuẩn tuyển dụng của vị trí này. Cần ôn tập lại kiến thức nền tảng trước khi tham gia phỏng vấn thực tế.',
        ]),
        ...(!hasCamera ? ['Chưa bật camera: Cần bật webcam ở các phiên tới để AI đánh giá biểu cảm và cử chỉ giao tiếp.'] : [])
      ],
      improvementPlan: [
        'Đọc kỹ các gợi ý câu trả lời mẫu chuẩn điểm 10 bên dưới.',
        'Luyện tập thêm các câu hỏi tình huống xử lý sự cố thực tế.',
        ...(!hasCamera ? ['Bật camera trong phiên phỏng vấn tiếp theo để AI chấm điểm tác phong phong thái.'] : []),
      ],
      telemetryReport: {
        isCameraUsed: hasCamera,
        isMicrophoneUsed: Boolean(hasAudio || (avgWpm && avgWpm > 0)),
        avgEyeContact: hasCamera ? avgEye : null,
        avgPitchHz: avgPitch,
        avgWpm: avgWpm,
        totalFillers: sessionFillerCount,
        emotionSummary: sessionDominantEmotion,
        dominantEmotion: sessionDominantEmotion,
        postureStatus: sessionDominantPosture,
        postureSummary: sessionDominantPosture,
        emotions: hasCamera ? telemetryHistoryRef.current.emotions : { confident: 0, smiling: 0, focused: 0, tense: 0 },
        durationSeconds: timerSec,
        durationFormatted: fmt(timerSec),
        level: LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle',
      },
      questions: scoredQuestions,
    };

    setResult(newResult);
    const userHistoryCacheKey = user?.userId ? `hiremate_interview_history_${user.userId}` : 'hiremate_interview_history_guest';
    setHistoryList((prev) => {
      const updated = [newResult, ...prev];
      try {
        localStorage.setItem(userHistoryCacheKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchRealHistory();
    fetchQuotaStatus();
  };


  const JOB_CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'backend', label: 'Backend' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'fullstack', label: 'Fullstack' },
    { id: 'tester', label: 'QA / Tester' },
    { id: 'ba-brse', label: 'BA / BrSE' },
    { id: 'other', label: 'Khác' },
  ];

  // Filter jobs based on active tab, search query, and quick category pills
  const displayedJobs = (() => {
    const list = contextMode === 'ai-recommend' ? recommendedJobs : availableJobs;
    let filtered = list;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((j) =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.companyName && j.companyName.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q))
      );
    }

    if (jobCategoryFilter && jobCategoryFilter !== 'all') {
      filtered = filtered.filter((j) => {
        const t = (j.title || '').toLowerCase();
        if (jobCategoryFilter === 'backend') {
          return /backend|back-end|java|spring|node|golang|c#|\.net|python|php|ruby/i.test(t);
        }
        if (jobCategoryFilter === 'frontend') {
          return /frontend|front-end|react|vue|angular|ui\/ux|next\.js|web/i.test(t);
        }
        if (jobCategoryFilter === 'fullstack') {
          return /fullstack|full-stack/i.test(t);
        }
        if (jobCategoryFilter === 'tester') {
          return /\bqa\b|\bqc\b|tester|kiểm thử|automation test|selenium/i.test(t);
        }
        if (jobCategoryFilter === 'ba-brse') {
          return /business analyst|\bba\b|phân tích nghiệp vụ|brse|cầu nối|bridge|product owner|product manager|\bpm\b/i.test(t);
        }
        if (jobCategoryFilter === 'other') {
          const isStandardTech = /backend|back-end|java|spring|node|golang|frontend|react|vue|angular|fullstack|qa|qc|tester|kiểm thử|ba\b|brse/i.test(t);
          return !isStandardTech;
        }
        return true;
      });
    }

    return filtered;
  })();

  // Cảnh báo thông minh nếu CV lệch nhóm ngành với vị trí đang chọn
  const getCvDomainMismatchWarning = () => {
    if (!selectedCv) return null;
    const currentTarget = ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob)
      ? selectedJob.title
      : customPosition;

    const cvHeadline = selectedCv.headline || selectedCv.title || '';
    const cvSkills = Array.isArray(selectedCv.skills) ? selectedCv.skills.join(' ') : '';
    const cvText = `${cvHeadline} ${cvSkills}`.toLowerCase();
    const targetText = (currentTarget || '').toLowerCase();

    const isTargetTester = /\bqa\b|\bqc\b|tester|kiểm thử/i.test(targetText);
    const isCvTester = /\bqa\b|\bqc\b|tester|kiểm thử/i.test(cvText);

    const isTargetFe = /frontend|front-end|react|vue|angular/i.test(targetText);
    const isCvFe = /frontend|front-end|react|vue|angular/i.test(cvText);

    const isTargetBe = /backend|back-end|java|spring|golang|node/i.test(targetText);
    const isCvBe = /backend|back-end|java|spring|golang|node/i.test(cvText);

    const isTargetBa = /business analyst|\bba\b|product owner|product manager/i.test(targetText);
    const isCvBa = /business analyst|\bba\b|product owner|product manager/i.test(cvText);

    const isTargetBrse = /brse|cầu nối|bridge/i.test(targetText);
    const isCvBrse = /brse|cầu nối|bridge/i.test(cvText);

    let hasMismatch = false;
    if (isTargetTester && !isCvTester && (isCvBa || isCvBe || isCvFe)) hasMismatch = true;
    else if (isTargetBe && !isCvBe && (isCvBa || isCvTester || isCvFe)) hasMismatch = true;
    else if (isTargetFe && !isCvFe && (isCvBa || isCvTester || isCvBe)) hasMismatch = true;
    else if (isTargetBa && !isCvBa && (isCvTester || isCvBe || isCvFe)) hasMismatch = true;
    else if (isTargetBrse && !isCvBrse && (isCvTester || isCvBe || isCvFe)) hasMismatch = true;

    if (hasMismatch) {
      const headlineDisp = selectedCv.headline || selectedCv.title || 'chuyên môn khác';
      const targetDisp = formatJobTitle(currentTarget);
      return `💡 Lưu ý: CV đang chọn thiên về [${headlineDisp}], AI sẽ kết hợp hỏi kỹ năng của vị trí [${targetDisp}] và kinh nghiệm chuyển đổi từ CV của bạn.`;
    }
    return null;
  };

  // Cảnh báo thông minh nếu CV lệch nhóm ngành với vị trí đang chọn
  const getCvDomainMismatchWarning = () => {
    if (!selectedCv) return null;
    const currentTarget = ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob)
      ? selectedJob.title
      : customPosition;

    const cvHeadline = selectedCv.headline || selectedCv.title || '';
    const cvSkills = Array.isArray(selectedCv.skills) ? selectedCv.skills.join(' ') : '';
    const cvText = `${cvHeadline} ${cvSkills}`.toLowerCase();
    const targetText = (currentTarget || '').toLowerCase();

    const isTargetTester = /\bqa\b|\bqc\b|tester|kiểm thử/i.test(targetText);
    const isCvTester = /\bqa\b|\bqc\b|tester|kiểm thử/i.test(cvText);

    const isTargetFe = /frontend|front-end|react|vue|angular/i.test(targetText);
    const isCvFe = /frontend|front-end|react|vue|angular/i.test(cvText);

    const isTargetBe = /backend|back-end|java|spring|golang|node/i.test(targetText);
    const isCvBe = /backend|back-end|java|spring|golang|node/i.test(cvText);

    const isTargetBa = /business analyst|\bba\b|product owner|product manager/i.test(targetText);
    const isCvBa = /business analyst|\bba\b|product owner|product manager/i.test(cvText);

    const isTargetBrse = /brse|cầu nối|bridge/i.test(targetText);
    const isCvBrse = /brse|cầu nối|bridge/i.test(cvText);

    let hasMismatch = false;
    if (isTargetTester && !isCvTester && (isCvBa || isCvBe || isCvFe)) hasMismatch = true;
    else if (isTargetBe && !isCvBe && (isCvBa || isCvTester || isCvFe)) hasMismatch = true;
    else if (isTargetFe && !isCvFe && (isCvBa || isCvTester || isCvBe)) hasMismatch = true;
    else if (isTargetBa && !isCvBa && (isCvTester || isCvBe || isCvFe)) hasMismatch = true;
    else if (isTargetBrse && !isCvBrse && (isCvTester || isCvBe || isCvFe)) hasMismatch = true;

    if (hasMismatch) {
      const headlineDisp = selectedCv.headline || selectedCv.title || 'chuyên môn khác';
      const targetDisp = formatJobTitle(currentTarget);
      return `💡 Lưu ý: CV đang chọn thiên về [${headlineDisp}], AI sẽ kết hợp hỏi kỹ năng của vị trí [${targetDisp}] và kinh nghiệm chuyển đổi từ CV của bạn.`;
    }
    return null;
  };

  const navTabs = [
    { id: 'setup', icon: 'tune', label: '1. Chọn Bối Cảnh' },
    { id: 'live', icon: 'videocam', label: '2. Phòng Phỏng Vấn' },
    { id: 'result', icon: 'analytics', label: '3. Đánh Giá Năng Lực' },
    { id: 'history', icon: 'history', label: '4. Lịch Sử' },
  ];

  return (
    <div className={`w-full font-sans antialiased ${
      view === 'live'
        ? 'max-w-7xl mx-auto px-1 sm:px-4 py-1 sm:py-2 flex flex-col justify-between min-h-[calc(100vh-5rem)]'
        : 'bg-transparent text-[#1e1b4b] min-h-screen pb-16 space-y-6 sm:space-y-8 max-w-6xl mx-auto'
    }`}>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-2xl bg-[#32247b]/95 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-bounce border border-white/20">
          <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Floating Stage Navigator (Chỉ hiển thị khi đang thiết lập hoặc xem lịch sử) */}
      {view !== 'live' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white border border-purple-100 flex items-center justify-center shadow-md p-1.5 overflow-hidden shrink-0 ring-2 ring-purple-100">
              <img src={HIREMATE_LOGO_URL} alt="HireMate AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-[#1e1b4b] tracking-tight">HireMate AI Interview Studio</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Sẵn sàng
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Luyện tập phỏng vấn kỹ thuật trực tiếp theo mô tả công việc (JD) và CV của bạn</p>
            </div>
          </div>

          {/* Stage Navigator Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#f8f7ff] border border-purple-100 overflow-x-auto text-xs font-semibold self-stretch sm:self-auto justify-center sm:justify-start">
            {navTabs.map((tab) => {
              const isActive = view === tab.id;
              const isLiveActive = isLiveSessionRef.current;
              
              // 1. Phòng phỏng vấn (tab.id === 'live') CHỈ được vào khi phiên đang diễn ra
              // 2. Đánh giá năng lực (tab.id === 'result') CHỈ được vào khi đã có kết quả
              let locked = false;
              let lockReason = '';
              if (tab.id === 'live') {
                if (!isLiveActive) {
                  locked = true;
                  lockReason = '⚠️ Vui lòng chọn bối cảnh và bấm "Bắt Đầu Phỏng Vấn" để vào phòng thi!';
                }
              } else if (tab.id === 'result') {
                if (!result) {
                  locked = true;
                  lockReason = '⚠️ Bạn chưa có kết quả phỏng vấn của phiên hiện tại.';
                }
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (locked) {
                      showToast(lockReason);
                      return;
                    }
                    if (tab.id === 'history') {
                      setSelectedHistorySession(null);
                      fetchRealHistory();
                    }
                    setView(tab.id);
                  }}
                  className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-[#32247b] text-white shadow-md font-bold cursor-default'
                      : locked
                      ? 'text-slate-400 cursor-not-allowed opacity-40 bg-transparent hover:bg-transparent'
                      : 'text-[#1e1b4b] hover:text-[#32247b] hover:bg-purple-100/60 font-medium cursor-pointer'
                  }`}
                  title={locked ? lockReason : tab.label}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {locked && tab.id === 'live' && (
                    <span className="material-symbols-outlined text-xs text-slate-400">lock</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. VIEW SETUP (THIẾT LẬP BỐI CẢNH & PHÒNG THỰC CHIẾN CHUẨN MINDSKILLS)  */}
      {/* ===================================================================== */}
      {view === 'setup' && (
        <main className="space-y-6 sm:space-y-8 animate-fadeIn font-sans">
          {/* BANNER THÔNG TIN GÓI DỊCH VỤ THẬT TỪ SUPABASE */}
          <div className="rounded-3xl bg-gradient-to-r from-[#211652] via-[#2d1b69] to-[#1a1040] border border-purple-500/30 p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-2.5 flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
                <span className="material-symbols-outlined text-white text-2xl">workspace_premium</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-extrabold text-white">
                    Gói dịch vụ: {quotaStatus?.planName || 'Free Candidate'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    quotaStatus?.isPaidPlan
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}>
                    {quotaStatus?.isPaidPlan ? 'GÓI TRẢ PHÍ VIP' : 'MIỄN PHÍ VĨNH VIỄN'}
                  </span>
                  {quotaStatus?.subscriptionEndDate && (
                    <span className="text-xs text-purple-200/70 font-medium">
                      (Hết hạn: {quotaStatus.subscriptionEndDate})
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200/80 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    🎯 Hạn ngạch hôm nay: <strong className="text-white font-mono">{quotaStatus?.usedToday ?? 0} / {quotaStatus?.quotaLimit >= 999 ? '∞ (Không giới hạn)' : `${quotaStatus?.quotaLimit ?? 2} phiên`}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ❓ Cấu trúc buổi: <strong className="text-white font-mono">{quotaStatus?.maxQuestions ?? 3} câu / buổi</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ⏱️ Thời lượng tối đa: <strong className="text-white font-mono">{Math.round((quotaStatus?.maxDurationSeconds ?? 300) / 60)} phút</strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
              {quotaStatus?.isQuotaExceeded ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">block</span>
                    Hết lượt hôm nay
                  </span>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('candidate-pricing');
                      else window.location.href = '/candidate-pricing';
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Nâng Cấp Gói Ngay
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('candidate-pricing');
                    else window.location.href = '/candidate-pricing';
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                  Nâng Cấp / Đổi Gói
                </button>
              )}
            </div>
          </div>

          {/* BƯỚC 1: CHỌN VỊ TRÍ / VIỆC LÀM PHỎNG VẤN */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-6 font-sans">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1e1b4b] flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#32247b] to-[#5b48bd] text-white flex items-center justify-center text-xs font-extrabold shadow-md shadow-indigo-900/20 ring-2 ring-purple-100">
                    1
                  </span>
                  <span>Chọn Vị Trí / Việc Làm Phỏng Vấn</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn việc làm thực tế trên hệ thống HireMate, nhận đề xuất bám sát CV, hoặc nhập vị trí bạn muốn thử thách.
                </p>
              </div>

              {/* 3 Source Tabs (Mindskills Pills) */}
              <div className="flex items-center p-1.5 bg-[#f8f7ff] rounded-full text-xs font-semibold border border-purple-100 self-start sm:self-auto gap-1">
                <button
                  type="button"
                  onClick={() => { setContextMode('job'); setSelectedFocusSkills([]); }}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    contextMode === 'job'
                      ? 'bg-[#32247b] text-white shadow-xs font-bold'
                      : 'text-[#1e1b4b] hover:bg-purple-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">apartment</span>
                  <span>Việc Làm Tuyển Dụng</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadAiRecommendations}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    contextMode === 'ai-recommend'
                      ? 'bg-[#32247b] text-white shadow-xs font-bold'
                      : 'text-[#1e1b4b] hover:bg-purple-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm text-amber-500">auto_awesome</span>
                  <span>AI Đề Xuất Theo CV</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setContextMode('custom'); setSelectedFocusSkills([]); }}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    contextMode === 'custom'
                      ? 'bg-[#32247b] text-white shadow-xs font-bold'
                      : 'text-[#1e1b4b] hover:bg-purple-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Nhập Vị Trí Tự Do</span>
                </button>
              </div>
            </div>

            {/* Mode B: AI ĐỀ XUẤT THEO CV - FULL AI ANALYTICAL PROPOSAL PIPELINE */}
            {contextMode === 'ai-recommend' && (
              <div className="space-y-5">
                {/* AI Overview Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/90 via-[#32247b] to-indigo-900 text-white shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold tracking-wide text-white">AI Studio Matching &amp; Proposal Engine</h3>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[10px] font-extrabold uppercase tracking-wider">
                            AI Cá Nhân Hóa
                          </span>
                        </div>
                        <p className="text-xs text-purple-200 mt-0.5">
                          {selectedCv ? (
                            <span>Đang phân tích trực tiếp theo hồ sơ: <strong className="text-white underline">{selectedCv.title || selectedCv.fileName || `CV #${selectedCv.cvId}`}</strong></span>
                          ) : (
                            <span>Chưa chọn CV cụ thể. Đang dùng hồ sơ ứng viên tổng hợp để đề xuất.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLoadAiRecommendations(true)}
                      disabled={isAiLoadingRecommend}
                      className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shrink-0 shadow-sm disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${isAiLoadingRecommend ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                      <span>{isAiLoadingRecommend ? 'Đang phân tích...' : '✨ Phân Tích Lại Bằng AI'}</span>
                    </button>
                  </div>
                </div>

                {/* Nếu ứng viên chưa có CV */}
                {myCvs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-indigo-50 border border-purple-200 text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-[#32247b] text-white flex items-center justify-center mx-auto shadow-md">
                      <span className="material-symbols-outlined text-2xl">upload_file</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-[#1e1b4b]">Bạn Chưa Có Hồ Sơ CV Nào Trên Hệ Thống</h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        Tải lên CV để AI phân tích kỹ năng, kinh nghiệm và tự động may đo các vị trí phỏng vấn thực chiến chính xác nhất cho bạn.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2.5">
                      <a
                        href="#/candidate/profile"
                        className="px-5 py-2.5 rounded-xl bg-[#32247b] hover:bg-[#251b60] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>Tải Lên CV Ngay</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => { setContextMode('job'); setSelectedFocusSkills([]); }}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#32247b] border border-purple-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Xem Việc Làm Tuyển Dụng
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* KHU VỰC 1: VỊ TRÍ PHỎNG VẤN MỤC TIÊU DO AI MAY ĐO THEO CV */}
                    {aiTailoredTracks.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-[#5b48bd]">psychology</span>
                            <span>Vị Trí Phỏng Vấn Mục Tiêu Do AI May Đo Theo CV ({aiTailoredTracks.length})</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">Bấm để chọn làm đề bài phỏng vấn Live</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {aiTailoredTracks.map((track) => {
                            const isSel = selectedJob?.isAiTrack && selectedJob?.jobId === track.id;
                            return (
                              <div
                                key={track.id}
                                onClick={() => handleSelectAiTrack(track)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                                  isSel
                                    ? 'bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-2 border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-md'
                                    : 'bg-white border-purple-100 hover:border-[#5b48bd] hover:shadow-sm'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#32247b] text-[10px] font-extrabold uppercase tracking-wide">
                                      {track.domain}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                                      {track.matchScore}% Phù Hợp
                                    </span>
                                  </div>

                                  <h5 className="text-xs sm:text-sm font-bold text-[#1e1b4b] line-clamp-2 leading-snug">
                                    {track.title}
                                  </h5>

                                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                                    {track.reasoning}
                                  </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-purple-50">
                                  <div className="flex flex-wrap gap-1">
                                    {track.focusSkills.slice(0, 3).map((sk, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded bg-[#f8f7ff] text-[#32247b] text-[10px] font-semibold border border-purple-100">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>

                                  <button
                                    type="button"
                                    className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                      isSel
                                        ? 'bg-[#32247b] text-white shadow-xs'
                                        : 'bg-[#f8f7ff] text-[#32247b] hover:bg-purple-100'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-xs">
                                      {isSel ? 'check_circle' : 'play_arrow'}
                                    </span>
                                    <span>{isSel ? 'Đã Chọn Vị Trí Này' : 'Chọn Luyện Phỏng Vấn'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* KHU VỰC 2: VIỆC LÀM DOANH NGHIỆP THỰC TẾ KHỚP NHẤT TRÊN HỆ THỐNG */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-[#5b48bd]">apartment</span>
                          <span>Việc Làm Doanh Nghiệp Khớp Tuyển Dụng ({displayedJobs.length})</span>
                        </h4>
                      </div>

                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b48bd] text-xl">
                          search
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Tìm kiếm nhanh vị trí tuyển dụng thực tế (Java, React, VNG, FPT...)..."
                          className="w-full pl-11 pr-16 py-3.5 rounded-2xl bg-[#f8f7ff] border border-purple-100 focus:border-[#5b48bd] focus:bg-white text-xs sm:text-sm text-[#1e1b4b] outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-white px-2 py-1 rounded-lg border border-purple-100"
                          >
                            Xóa
                          </button>
                        )}
                      </div>

                      {isAiLoadingRecommend ? (
                        <div className="p-10 rounded-2xl bg-[#f8f7ff] border border-purple-100 text-center space-y-3">
                          <div className="w-7 h-7 border-3 border-[#5b48bd]/20 border-t-[#5b48bd] rounded-full animate-spin mx-auto" />
                          <p className="text-xs sm:text-sm font-semibold text-[#32247b]">
                            AI đang so khớp hồ sơ CV của bạn với danh sách việc làm trên hệ thống...
                          </p>
                        </div>
                      ) : displayedJobs.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-[#f8f7ff] border border-purple-100 text-center space-y-3">
                          <span className="material-symbols-outlined text-3xl text-purple-400 mx-auto">manage_search</span>
                          <p className="text-xs sm:text-sm font-bold text-[#1e1b4b]">
                            {searchQuery ? `Không tìm thấy việc làm phù hợp với từ khóa "${searchQuery}".` : 'Chưa có dữ liệu so khớp, bấm nút bên dưới để AI quét lại.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleLoadAiRecommendations(true)}
                            className="px-4 py-2 rounded-xl bg-[#32247b] text-white text-xs font-bold hover:bg-[#251b60] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            <span>✨ Quét Lại Bằng AI</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
                          {displayedJobs.map((job) => {
                            const isSel = !selectedJob?.isAiTrack && selectedJob?.jobId === job.jobId;
                            const skills = getJobSkills(job).slice(0, 4);
                            return (
                              <div
                                key={job.jobId}
                                onClick={() => { setSelectedJob(job); setSelectedFocusSkills([]); }}
                                className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                                  isSel
                                    ? 'bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/60 border-2 border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-lg shadow-purple-950/10'
                                    : 'bg-[#f8f7ff] border-purple-100/90 hover:border-[#5b48bd] hover:bg-white hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                                      isSel ? 'bg-[#32247b] text-white' : 'bg-white text-[#32247b] border border-purple-100'
                                    }`}>
                                      {job.companyName ? job.companyName.charAt(0).toUpperCase() : 'H'}
                                    </div>
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-bold text-[#1e1b4b] line-clamp-1">{formatJobTitle(job.title)}</h4>
                                      <p className="text-[11px] text-slate-500 font-medium">{job.companyName || 'Doanh nghiệp Tuyển dụng'}</p>
                                    </div>
                                  </div>

                                  {isSel ? (
                                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    </span>
                                  ) : job.matchScore ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shrink-0">
                                      {job.matchScore}% Phù Hợp
                                    </span>
                                  ) : null}
                                </div>

                                {skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {skills.map((sk, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white text-[#32247b] text-[10px] font-semibold border border-purple-100">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-100/60 text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs text-[#5b48bd]">location_on</span>
                                    <span className="truncate max-w-[140px]">{job.location || 'Toàn quốc'}</span>
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                    {job.salaryText || 'Thỏa thuận'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mode A: VIỆC LÀM TUYỂN DỤNG CÓ SẴN TRÊN HỆ THỐNG */}
            {contextMode === 'job' && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b48bd] text-xl">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm nhanh vị trí hoặc doanh nghiệp (Backend, Java, React, VNG, FPT, CMC, Viettel...)..."
                      className="w-full pl-11 pr-16 py-3.5 rounded-2xl bg-[#f8f7ff] border border-purple-100 focus:border-[#5b48bd] focus:bg-white text-xs sm:text-sm text-[#1e1b4b] outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-white px-2 py-1 rounded-lg border border-purple-100 cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Thanh Lọc Nhanh Theo Nhóm Ngành (Quick Category Filter Pills) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#5b48bd]">filter_alt</span>
                      Lọc nhóm:
                    </span>
                    {JOB_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setJobCategoryFilter(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          jobCategoryFilter === cat.id
                            ? 'bg-[#32247b] text-white border-[#32247b] shadow-xs font-bold'
                            : 'bg-white text-slate-600 border-purple-100 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedJobs.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-[#f8f7ff] border border-purple-100 text-center text-xs text-slate-500">
                    Không tìm thấy việc làm phù hợp với điều kiện tìm kiếm.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
                    {displayedJobs.map((job) => {
                      const isSel = selectedJob?.jobId === job.jobId;
                      const skills = getJobSkills(job).slice(0, 4);
                      return (
                        <div
                          key={job.jobId}
                          onClick={() => { setSelectedJob(job); setSelectedFocusSkills([]); }}
                          className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                            isSel
                              ? 'bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/60 border-2 border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-lg shadow-purple-950/10'
                              : 'bg-[#f8f7ff] border-purple-100/90 hover:border-[#5b48bd] hover:bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                                isSel ? 'bg-[#32247b] text-white' : 'bg-white text-[#32247b] border border-purple-100'
                              }`}>
                                {job.companyName ? job.companyName.charAt(0).toUpperCase() : 'H'}
                              </div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-[#1e1b4b] line-clamp-1">{formatJobTitle(job.title)}</h4>
                                <p className="text-[11px] text-slate-500 font-medium">{job.companyName || 'Doanh nghiệp Tuyển dụng'}</p>
                              </div>
                            </div>

                            {isSel && (
                              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <span className="material-symbols-outlined text-sm font-bold">check</span>
                              </span>
                            )}
                          </div>

                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {skills.map((sk, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-white text-[#32247b] text-[10px] font-semibold border border-purple-100">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-100/60 text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#5b48bd]">location_on</span>
                              <span className="truncate max-w-[140px]">{job.location || 'Toàn quốc'}</span>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {job.salaryText || 'Thỏa thuận'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mode C: Custom Position Input with Quick Stack Tags */}
            {contextMode === 'custom' && (
              <div className="space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b48bd] text-xl">
                    badge
                  </span>
                  <input
                    type="text"
                    value={customPosition}
                    onChange={(e) => setCustomPosition(e.target.value)}
                    placeholder="Nhập vị trí bạn muốn thử thách (ví dụ: Senior Java Backend Developer, Cloud DevOps, React Lead...)..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#f8f7ff] border border-purple-100 focus:border-[#5b48bd] focus:bg-white text-xs sm:text-sm text-[#1e1b4b] font-semibold outline-none transition-all placeholder:text-slate-400 shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">tune</span>
                    Gợi ý nhanh các vị trí công nghệ phổ biến:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      'Fullstack Java & React',
                      'DevOps & Cloud AWS',
                      'Golang Microservices',
                      'Data Engineer & Pipeline',
                      'Mobile Flutter Developer',
                      'QA / QC Automation Tester',
                      'AI & Machine Learning Engineer',
                      'Solution Architect',
                    ].map((sugg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomPosition(sugg)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          customPosition === sugg
                            ? 'bg-[#32247b] text-white border-[#32247b] shadow-xs font-bold'
                            : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-purple-100'
                        }`}
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Thanh Tóm Tắt Vị Trí Đang Chọn (Selected Target Summary Bar) */}
            {(() => {
              const currentTargetTitle = ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob)
                ? selectedJob.title
                : customPosition;
              const currentTargetCompany = ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob?.companyName)
                ? selectedJob.companyName
                : 'Thực chiến tự do';
              const currentTargetSkills = ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob)
                ? getJobSkills(selectedJob)
                : getStandardSkillsByTitle(customPosition);

              return (
                <div className="p-4.5 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/90 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#32247b] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-[#1e1b4b]">
                          Vị trí mục tiêu đang chọn: <strong className="text-[#32247b] underline">{formatJobTitle(currentTargetTitle)}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#32247b] text-[10px] font-bold">
                          {contextMode === 'job' ? 'Việc làm tuyển dụng' : contextMode === 'ai-recommend' ? 'AI Đề xuất' : 'Nhập tự do'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Doanh nghiệp: <strong className="text-slate-700">{currentTargetCompany}</strong></span>
                        <span>•</span>
                        <span>Kỹ năng trọng tâm AI sẽ hỏi: <strong className="text-[#5b48bd]">{currentTargetSkills.slice(0, 4).join(', ') || 'Theo tiêu chuẩn ngành'}</strong></span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 self-end sm:self-auto shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-sm font-bold">task_alt</span>
                    Đã Khóa Vị Trí Mục Tiêu
                  </span>
                </div>
              );
            })()}
          </section>

          {/* BƯỚC 2: HỒ SƠ CV CỦA BẠN & CẤP BẬC MONG MUỐN */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-6 font-sans">
            <div className="flex items-center gap-2.5 border-b border-purple-100 pb-5">
              <span className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#32247b] to-[#5b48bd] text-white flex items-center justify-center text-xs font-extrabold shadow-md shadow-indigo-900/20 ring-2 ring-purple-100">
                2
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1e1b4b]">Hồ Sơ CV Ứng Viên &amp; Cấp Bậc Mong Muốn</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hệ thống AI sẽ đối chiếu trực tiếp dự án và kỹ năng trong CV này để đặt câu hỏi kỹ thuật bám sát thực tế.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Cột Trái (5 cols): Thẻ chọn CV đồng nhất & Preview trong 1 khung duy nhất */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#32247b]">description</span>
                      <span>Hồ sơ CV Đang Áp Dụng:</span>
                    </span>
                    {selectedCv?.isDefault && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        CV Mặc Định
                      </span>
                    )}
                  </div>

                  {myCvs.length > 0 ? (
                    <div className="space-y-3">
                      <select
                        value={selectedCv?.cvId || ''}
                        onChange={(e) => {
                          const found = myCvs.find((c) => c.cvId === Number(e.target.value));
                          if (found) setSelectedCv(found);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs font-bold text-[#1e1b4b] outline-none focus:border-[#32247b] shadow-xs cursor-pointer"
                      >
                        {myCvs.map((c) => (
                          <option key={c.cvId} value={c.cvId}>
                            {c.title || c.fileName || `CV #${c.cvId}`} {c.isDefault ? '(Mặc định)' : ''}
                          </option>
                        ))}
                      </select>

                      {selectedCv && (
                        <div className="p-3.5 rounded-xl bg-white border border-purple-100 text-xs space-y-2 shadow-xs">
                          <div className="font-bold text-[#1e1b4b] line-clamp-1">
                            {selectedCv.candidateName || user?.fullName || 'Ứng viên'}
                            {selectedCv.headline ? ` • ${selectedCv.headline}` : ''}
                          </div>
                          {selectedCv.yearsOfExperience ? (
                            <p className="text-[11px] text-slate-500">
                              Kinh nghiệm thực chiến: <strong className="text-[#32247b]">{selectedCv.yearsOfExperience} năm</strong>
                            </p>
                          ) : null}
                          {selectedCv.skills && Array.isArray(selectedCv.skills) && selectedCv.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {selectedCv.skills.slice(0, 6).map((sk, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-[#32247b] text-[10px] font-semibold">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Badge Đối Chiếu Thông Minh */}
                      {getCvDomainMismatchWarning() && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2 shadow-xs">
                          <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">lightbulb</span>
                          <span className="leading-relaxed text-[11px]">{getCvDomainMismatchWarning()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-purple-100 text-xs text-slate-500 text-center space-y-1">
                      <p>Chưa có file CV tải lên.</p>
                      <p className="text-[11px] text-slate-400">AI sẽ phỏng vấn theo tiêu chuẩn vị trí bạn đã chọn.</p>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#32247b] bg-purple-100/70 p-3 rounded-xl border border-purple-200/60 flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-sm text-[#32247b]">verified</span>
                  <span>AI sẽ trích xuất dự án &amp; kỹ năng từ CV này để hỏi vặn.</span>
                </div>
              </div>

              {/* Cột Phải (7 cols): Seniority Level Matrix (5 Cấp Bậc) */}
              <div className="lg:col-span-7 space-y-3">
                <label className="text-xs font-bold text-[#1e1b4b] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-amber-500">signal_cellular_alt</span>
                    <span>Cấp bậc mục tiêu phỏng vấn:</span>
                  </span>
                  <span className="text-[11px] text-[#5b48bd] font-semibold">AI sẽ căn chỉnh độ khó câu hỏi theo cấp bậc</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {LEVELS.map((lvl) => {
                    const isSel = selectedLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setSelectedLevel(lvl.id)}
                        className={`p-3.5 rounded-2xl text-center border transition-all cursor-pointer flex flex-col justify-between items-center gap-2 ${
                          isSel
                            ? 'bg-gradient-to-br from-[#32247b] to-[#5b48bd] text-white border-[#32247b] shadow-xl shadow-indigo-900/25 scale-102 ring-2 ring-purple-300'
                            : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-white hover:border-[#5b48bd]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {lvl.id === 'intern' ? 'school' : lvl.id === 'junior' ? 'code' : lvl.id === 'middle' ? 'psychology' : lvl.id === 'senior' ? 'stars' : 'military_tech'}
                        </span>
                        <div>
                          <div className={`text-xs font-extrabold ${isSel ? 'text-white' : 'text-[#1e1b4b]'}`}>{lvl.label.split(' ')[0]}</div>
                          <div className={`text-[10px] ${isSel ? 'text-purple-200' : 'text-slate-500'}`}>{lvl.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* BƯỚC 3: KỸ NĂNG & ĐIỂM YẾU BẠN MUỐN AI XOÁY SÂU */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-purple-100 pb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#32247b] to-[#5b48bd] text-white flex items-center justify-center text-xs font-extrabold shadow-md shadow-indigo-900/20 ring-2 ring-purple-100">
                  3
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1e1b4b]">Kỹ Năng &amp; Điểm Yếu Bạn Muốn AI Xoáy Sâu</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chỉ định các chủ đề bạn còn yếu hoặc viết lời dặn riêng để AI tập trung thử thách bạn.
                  </p>
                </div>
              </div>
              {selectedFocusSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFocusSkills([])}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Xóa tất cả ({selectedFocusSkills.length})
                </button>
              )}
            </div>

            {/* A. Danh sách các kỹ năng/điểm yếu ĐÃ CHỌN */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/60 border border-purple-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#32247b] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">target</span>
                  <span>Trọng tâm kỹ thuật AI sẽ phỏng vấn bạn ({selectedFocusSkills.length}):</span>
                </span>
                {selectedFocusSkills.length === 0 && (
                  <span className="text-[11px] text-slate-400 italic">Chưa chọn riêng (AI sẽ phỏng vấn bao quát theo JD)</span>
                )}
              </div>
              {selectedFocusSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedFocusSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#32247b] text-white text-xs font-bold shadow-xs animate-fadeIn"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="hover:bg-white/20 rounded-full p-0.5 ml-0.5 cursor-pointer text-white/80 hover:text-white"
                        title="Bỏ chọn"
                      >
                        <span className="material-symbols-outlined text-xs leading-none">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  💡 Bạn có thể tự gõ kỹ năng bên dưới hoặc chọn từ yêu cầu của JD để AI tập trung hỏi sâu vào kỹ năng đó.
                </p>
              )}
            </div>

            {/* B. Ô tự nhập kỹ năng / công nghệ bất kỳ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#32247b]">add_circle</span>
                <span>Tự nhập kỹ năng hoặc chủ đề bạn muốn thử thách:</span>
              </label>
              <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Ví dụ: Concurrency, Deadlock, Redis Caching, Tối ưu SQL, React Re-render, Docker..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[#f8f7ff] border border-purple-100 focus:border-[#32247b] focus:bg-white text-xs text-[#1e1b4b] outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!customSkillInput.trim()}
                  className="px-5 py-3 rounded-xl bg-[#32247b] hover:bg-[#251963] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Thêm</span>
                </button>
              </form>
            </div>

            {/* C. Kỹ năng trích xuất từ JD việc làm đang chọn */}
            {selectedJob && getJobSkills(selectedJob).length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">work</span>
                  <span>Kỹ năng yêu cầu trong JD "{formatJobTitle(selectedJob.title)}": (Bấm để thêm vào trọng tâm)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {getJobSkills(selectedJob).map((sk, idx) => {
                    const isPicked = selectedFocusSkills.includes(sk);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleFocusSkill(sk)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isPicked
                            ? 'bg-[#32247b] text-white border-[#32247b] shadow-xs font-bold'
                            : 'bg-white text-[#1e1b4b] border-purple-100 hover:bg-purple-50'
                        }`}
                      >
                        {isPicked ? '✓ ' : '+ '}{sk}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D. Kỹ năng CV còn thiếu so với JD (nếu có từ kết quả Match) */}
            {selectedJob?.missingMandatorySkills && selectedJob.missingMandatorySkills.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                  Kỹ năng CV của bạn còn thiếu so với JD (Khuyên bạn nên luyện tập kỹ):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.missingMandatorySkills.map((sk, idx) => {
                    const isPicked = selectedFocusSkills.includes(sk);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleFocusSkill(sk)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isPicked
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isPicked ? '✓ ' : '+ '}{sk}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* E. Gợi ý nhanh các điểm yếu kỹ thuật hay bị hỏi vặn & Lời dặn theo vị trí */}
            {(() => {
              const currentTargetPos = ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob)
                ? selectedJob.title
                : (customPosition || 'Chuyên viên Kỹ thuật Phần mềm');
              const dynTopics = getDynamicChallengeTopics(currentTargetPos);

              return (
                <>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span>
                        <span>Chủ đề phỏng vấn thử thách thường gặp ({formatJobTitle(currentTargetPos)}):</span>
                      </label>
                      <span className="text-[11px] text-[#5b48bd] font-semibold">Tự động khớp theo vị trí</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dynTopics.topics.map((tag, idx) => {
                        const isPicked = selectedFocusSkills.includes(tag);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleFocusSkill(tag)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isPicked
                                ? 'bg-[#32247b] text-white border-[#32247b] shadow-xs font-bold'
                                : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-purple-100'
                            }`}
                          >
                            {isPicked ? '✓ ' : ''}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* F. Lời dặn / Ghi chú riêng cho buổi phỏng vấn */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1e1b4b] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#32247b]">edit_note</span>
                        <span>Ghi chú / Yêu cầu riêng cho buổi phỏng vấn:</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">AI sẽ đọc trực tiếp trước khi bắt đầu</span>
                    </label>
                    <textarea
                      rows={2}
                      value={customFocusNotes}
                      onChange={(e) => setCustomFocusNotes(e.target.value)}
                      placeholder={dynTopics.placeholder}
                      className="w-full px-4 py-3 rounded-2xl bg-[#f8f7ff] border border-purple-100 focus:border-[#32247b] focus:bg-white text-xs sm:text-sm text-[#1e1b4b] outline-none transition-all placeholder:text-slate-400 resize-none font-medium shadow-xs"
                    />
                  </div>
                </>
              );
            })()}

            {/* G. Live Prompter Preview (Xem trước lời dặn AI) */}
            {(selectedFocusSkills.length > 0 || customFocusNotes.trim()) && (
              <div className="p-4 rounded-2xl bg-[#1e144f] text-purple-100 text-xs space-y-1.5 shadow-md border border-purple-800/50 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>Hệ thống AI đã ghi nhận yêu cầu phỏng vấn:</span>
                </div>
                <p className="text-purple-200 text-[11px] leading-relaxed">
                  {selectedFocusSkills.length > 0 && (
                    <span>• <strong>Trọng tâm câu hỏi:</strong> {selectedFocusSkills.join(', ')}. </span>
                  )}
                  {customFocusNotes.trim() && (
                    <span>• <strong>Lời dặn:</strong> "{customFocusNotes.trim()}".</span>
                  )}
                </p>
              </div>
            )}
          </section>

          {/* BƯỚC 4: CHỌN HỘI ĐỒNG GIÁM KHẢO AI (PHONG CÁCH PHỎNG VẤN) */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-7 font-sans">
            <div className="flex items-center justify-between border-b border-purple-100 pb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#32247b] to-[#5b48bd] text-white flex items-center justify-center text-xs font-extrabold shadow-md shadow-indigo-900/20 ring-2 ring-purple-100">
                  4
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1e1b4b]">Hội Đồng Giám Khảo AI (Phong Cách Phỏng Vấn)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lựa chọn phong cách và hội đồng phỏng vấn phù hợp với mục tiêu rèn luyện. AI luôn đóng vai Hội đồng phỏng vấn chuyên nghiệp bám sát vị trí bạn ứng tuyển.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#32247b] border border-purple-200 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">groups</span>
                <span>Hội Đồng Giám Khảo AI</span>
              </div>
            </div>

            {/* Chọn Phong Cách Hội Đồng Phỏng Vấn (Interviewer Persona) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#1e1b4b] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#32247b]">tune</span>
                  <span>Phong cách hội đồng phỏng vấn (Interviewer Persona):</span>
                </span>
                <span className="text-[11px] text-[#5b48bd] font-semibold">AI luôn hỏi chuyên môn đúng theo Vị trí &amp; Kỹ năng bạn đã chọn</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INTERVIEWER_PERSONAS.map((p) => {
                  const isSelected = selectedPersona === p.id;
                  const isLocked = !checkPersonaPermission(p);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPersona(p)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#f8f7ff] to-purple-50/70 border-[#32247b] ring-2 ring-[#32247b]/20 shadow-lg shadow-purple-900/10'
                          : isLocked
                          ? 'bg-slate-50/80 border-slate-200 hover:border-amber-300'
                          : 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${p.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                            <span className="material-symbols-outlined text-xl">{p.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-extrabold text-[#1e1b4b]">{p.title}</h3>
                            </div>
                            <p className="text-xs font-semibold text-[#5b48bd] mt-0.5">{p.subtitle}</p>
                          </div>
                        </div>

                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-xs">
                            <span className="material-symbols-outlined text-xs">lock</span>
                            <span>{p.tierLabel}</span>
                          </span>
                        ) : isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#32247b] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                            ✓
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full border border-purple-200 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {p.desc}
                      </p>

                      <div className="pt-2 border-t border-purple-100/70 flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${isLocked ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {isLocked ? `🔒 Yêu cầu ${p.tierLabel}` : '✓ Đã mở khóa'}
                        </span>
                        <span className="text-xs font-semibold text-[#32247b]">
                          {isSelected ? 'Đang chọn' : 'Bấm để chọn'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chọn Giọng Đọc Người Phỏng Vấn AI (Voice Presets) */}
            <div className="space-y-3 pt-4 border-t border-purple-100">
              <label className="text-xs font-bold text-[#1e1b4b] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#32247b]">record_voice_over</span>
                  <span>Giọng đọc người phỏng vấn AI (Voice Preset):</span>
                </span>
                <span className="text-[11px] text-[#5b48bd] font-semibold">Giọng đọc phòng thu chất lượng cao, phản xạ tự nhiên</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {VOICE_PRESETS.map((v) => {
                  const isSelected = selectedVoicePreset === v.id;
                  const isLocked = !checkVoicePermission(v);

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVoice(v)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#f8f7ff] to-purple-50/70 border-[#32247b] ring-2 ring-[#32247b]/20 shadow-lg shadow-purple-900/10'
                          : isLocked
                          ? 'bg-slate-50/80 border-slate-200 hover:border-amber-300'
                          : 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${v.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                            <span className="material-symbols-outlined text-xl">
                              {v.gender === 'Nữ' ? 'female' : 'male'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-extrabold text-[#1e1b4b]">{v.name}</h3>
                            </div>
                            <p className="text-xs font-semibold text-[#5b48bd] mt-0.5">{v.tone}</p>
                          </div>
                        </div>

                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-xs">
                            <span className="material-symbols-outlined text-xs">lock</span>
                            <span>{v.tierLabel}</span>
                          </span>
                        ) : isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#32247b] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                            ✓
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full border border-purple-200 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {v.desc}
                      </p>

                      <div className="pt-2 border-t border-purple-100/70 flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(v.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#32247b] hover:bg-purple-100 font-bold flex items-center gap-1 border border-purple-200 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">volume_up</span>
                          <span>Nghe thử</span>
                        </button>
                        <span className={`font-bold ${isLocked ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {isLocked ? `🔒 ${v.tierLabel}` : isSelected ? 'Đang chọn' : 'Bấm để chọn'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* GRAND FLOATING LAUNCH CONSOLE (NÚT BẮT ĐẦU HOÀNH TRÁNG) */}
          <div className="sticky bottom-4 z-20 p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-purple-200/90 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ring-1 ring-purple-950/10">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-bold text-[#5b48bd] flex items-center justify-center sm:justify-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Sẵn sàng kết nối phòng phỏng vấn trực tiếp</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-[#1e1b4b]">
                {formatJobTitle(((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob) ? selectedJob.title : customPosition)}
                <span className="text-[#5b48bd] font-medium text-xs ml-2">
                  • {LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle'}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#32247b] via-[#432b96] to-[#6d44e4] hover:from-[#2d1b69] hover:to-[#5b48bd] text-white text-sm sm:text-base font-extrabold shadow-xl shadow-indigo-950/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-purple-300/40 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="material-symbols-outlined text-xl">play_circle</span>
              <span>Bắt Đầu Buổi Phỏng Vấn AI Ngay</span>
            </button>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 2. VIEW LIVE (PHÒNG PHỎNG VẤN TRỰC TIẾP SPLIT-SCREEN CHUẨN GOOGLE MEET / ZOOM) */}
      {/* ===================================================================== */}
      {view === 'live' && (
        <main className="w-full flex-1 flex flex-col justify-between min-h-[calc(100vh-6.5rem)] rounded-3xl bg-gradient-to-b from-[#0b0f19] via-[#070a12] to-[#04060a] border border-white/10 shadow-2xl relative overflow-hidden font-sans p-3 sm:p-5 text-white animate-fadeIn">
          
          {/* Ambient Lighting FX */}
          <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

          {/* TOP BAR: STUDIO EXECUTIVE HUD */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-3 sm:p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#32247b] to-indigo-600 p-2 flex items-center justify-center border border-white/20 shadow-md shrink-0">
                <img src={HIREMATE_LOGO_URL} alt="HireMate AI" className="w-full h-full object-contain brightness-110" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                    <span>HireMate AI Studio</span>
                    <span className="material-symbols-outlined text-xs text-emerald-400">verified</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE HD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                  {((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob) ? selectedJob.title : customPosition}
                  <span className="text-indigo-300 ml-1.5 font-semibold">• {LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle'}</span>
                </p>
              </div>
            </div>

            {/* Center / Right controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Plan Badge thật từ Supabase */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-semibold text-purple-200 shadow-sm">
                <span className="material-symbols-outlined text-sm text-purple-400">workspace_premium</span>
                <span className="font-bold text-white">{quotaStatus?.planName || 'Free Candidate'}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-900/80 text-[10px] text-purple-300 font-mono border border-purple-500/20">
                  Đã dùng {quotaStatus?.usedToday ?? 0}/{quotaStatus?.quotaLimit >= 999 ? '∞' : (quotaStatus?.quotaLimit ?? 2)} lượt
                </span>
              </div>

              {/* Question Progress Tracker */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-bold text-slate-200">
                <span className="text-indigo-400 hidden xs:inline">Tiến độ:</span>
                <span className="text-white font-mono">
                  Câu {Math.min(dialogueHistory.filter((d) => d.sender === 'candidate').length + 1, quotaStatus?.maxQuestions || 3)} / {quotaStatus?.maxQuestions || 3}
                </span>
                <div className="w-12 sm:w-16 h-2 rounded-full bg-slate-700/80 overflow-hidden ml-1 hidden sm:block">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((dialogueHistory.filter((d) => d.sender === 'candidate').length) /
                            (quotaStatus?.maxQuestions || 3)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Live Session Countdown Timer */}
              {(() => {
                const maxDur = quotaStatus?.maxDurationSeconds || 300;
                const countdown = Math.max(0, maxDur - timerSec);
                const isWarning = countdown <= 60;
                return (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shadow-inner transition-all ${
                      isWarning
                        ? 'bg-rose-950/90 border-rose-500/60 text-rose-300 animate-pulse'
                        : 'bg-slate-800/80 border-white/10 text-slate-200'
                    }`}
                    title={`Thời gian còn lại của phiên phỏng vấn (${fmt(countdown)} / ${fmt(maxDur)})`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                    <span>⏱️ {fmt(countdown)}</span>
                    <span className="text-[10px] text-slate-400 hidden lg:inline">/{fmt(maxDur)}</span>
                  </div>
                );
              })()}

              {/* End & View Result Button */}
              <button
                onClick={() => handleFinishInterview(false)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all cursor-pointer border border-emerald-400/30 text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-950/30"
                title="Chủ động kết thúc và tính điểm đánh giá ngay lập tức"
              >
                <span className="material-symbols-outlined text-sm">fact_check</span>
                <span className="hidden sm:inline">Kết Thúc & Xem Điểm</span>
              </button>


              {/* Latency & Video Info */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-white/10 text-[11px] font-mono text-slate-300">
                <span className="material-symbols-outlined text-xs text-emerald-400">speed</span>
                <span>60 FPS • 12ms</span>
              </div>

              {/* Quick Voice Switcher Pill */}
              <button
                type="button"
                onClick={() => {
                  const allowedVoices = VOICE_PRESETS.filter((v) => checkVoicePermission(v));
                  if (allowedVoices.length <= 1) {
                    showToast('🔒 Gói dịch vụ hiện tại chỉ hỗ trợ Giọng Nữ Chuẩn Mực. Vui lòng nâng cấp Practice Plus/Pro để mở khóa thêm giọng đọc!');
                    return;
                  }
                  const currentIndex = allowedVoices.findIndex((v) => v.id === selectedVoicePreset);
                  const nextIndex = (currentIndex + 1) % allowedVoices.length;
                  const nextPreset = allowedVoices[nextIndex];
                  setSelectedVoicePreset(nextPreset.id);
                  showToast(`🎙️ Đã chuyển sang giọng đọc: ${nextPreset.name} (${nextPreset.tone})`);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[11px] font-semibold text-indigo-200 transition-all cursor-pointer shadow-sm"
                title="Bấm để chuyển đổi giọng đọc AI"
              >
                <span className="material-symbols-outlined text-xs text-purple-400">record_voice_over</span>
                <span className="truncate max-w-[150px]">
                  {VOICE_PRESETS.find((v) => v.id === selectedVoicePreset)?.name || 'Giọng Đọc AI'}
                </span>
                <span className="material-symbols-outlined text-xs text-slate-400">swap_horiz</span>
              </button>

              {/* Leave button */}
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn rời phòng phỏng vấn không?')) {
                    cleanupAudioResources();
                    stopCamera();
                    setView('setup');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 text-xs font-semibold flex items-center gap-1"
                title="Rời phòng phỏng vấn"
              >
                <span className="material-symbols-outlined text-sm">exit_to_app</span>
                <span className="hidden sm:inline">Rời Phòng</span>
              </button>
            </div>
          </div>

          {/* MAIN STAGE: SPLIT-SCREEN 2-COLUMN VIEWPORT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-3 flex-1 min-h-[460px]">
            
            {/* TILE 1 (LEFT): CHUYÊN GIA PHỎNG VẤN HIREMATE AI */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#0f1424] via-[#090d18] to-[#160d31] border border-indigo-500/30 p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl ring-1 ring-white/10">
              
              {/* Atmospheric glow behind AI avatar */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-600/15 blur-[100px] pointer-events-none" />

              {/* Tile Header: AI Profile & Dynamic State */}
              <div className="flex items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#32247b] to-indigo-600 p-2 flex items-center justify-center border border-white/20 shadow-md">
                    <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white tracking-wide">
                        {INTERVIEWER_PERSONAS.find((p) => p.id === selectedPersona)?.title || 'Hội Đồng Phỏng Vấn Chuyên Môn AI'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-extrabold">AI</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                        {LEVELS.find((l) => l.id === selectedLevel)?.label || 'Tiêu Chuẩn'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {INTERVIEWER_PERSONAS.find((p) => p.id === selectedPersona)?.subtitle || 'Đánh Giá Năng Lực Chuyên Môn Thực Chiến'}
                    </span>
                  </div>
                </div>

                {/* AI Speech State Chip */}
                <div className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-2 shadow-sm ${
                  isAiSpeaking
                    ? 'bg-purple-900/60 border-purple-500/60 text-purple-200 ring-2 ring-purple-500/20'
                    : isAiThinking
                    ? 'bg-indigo-900/60 border-indigo-500/60 text-indigo-200 animate-pulse'
                    : isMicOn
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isAiSpeaking ? 'bg-purple-400 animate-ping' : isAiThinking ? 'bg-indigo-400 animate-spin' : isMicOn ? 'bg-emerald-400' : 'bg-slate-500'
                  }`} />
                  <span>
                    {isAiSpeaking
                      ? 'AI Đang Phỏng Vấn (Mic Tắt Tự Động)'
                      : isAiThinking
                      ? 'AI Đang Phân Tích...'
                      : isMicOn
                      ? (listenStatus === 'checking' ? 'AI Đang Kiểm Tra Bạn Đã Nói Xong Chưa...'
                        : listenStatus === 'waiting' ? 'AI Thấy Bạn Chưa Nói Hết - Đang Chờ...'
                        : listenStatus === 'hearing' ? 'Đang Ghi Âm Lời Bạn...'
                        : 'Đang Nghe Bạn Trả Lời...')
                      : 'Chờ Đối Thoại'}
                  </span>
                </div>
              </div>

              {/* Tile Center: Siri/Gemini Live High-Tech Kinetic Orb & Soundwave Spectrum */}
              <div className="flex flex-col items-center justify-center my-auto py-6 relative z-10">
                
                {/* Kinetic Harmonic Aura */}
                <div className={`absolute w-56 h-56 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
                  isAiSpeaking ? 'bg-purple-500/40 scale-125' : isAiThinking ? 'bg-indigo-500/30 scale-110' : 'bg-indigo-900/20 scale-90'
                }`} />

                {/* Multi-layered Glass Holographic Orb */}
                <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full relative flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${
                  isAiSpeaking
                    ? 'bg-gradient-to-tr from-[#2d1b69] via-indigo-600 to-pink-500 shadow-purple-500/50 ring-4 ring-purple-400/60 scale-105'
                    : isAiThinking
                    ? 'bg-gradient-to-tr from-indigo-900 via-purple-700 to-cyan-500 shadow-indigo-500/40 ring-4 ring-cyan-400/50 animate-pulse'
                    : 'bg-gradient-to-tr from-slate-900 via-[#1e1b4b] to-indigo-950 ring-2 ring-white/10 shadow-black/50'
                }`}>
                  {/* Center Brand Hologram */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-4xl sm:text-5xl text-white drop-shadow-md">
                      {isAiSpeaking ? 'graphic_eq' : isAiThinking ? 'psychology' : 'smart_toy'}
                    </span>
                    <span className="text-[10px] font-extrabold text-white/90 tracking-widest uppercase mt-1 drop-shadow-sm">
                      {isAiSpeaking ? 'Đang Nói' : isAiThinking ? 'Suy Luận' : 'HireMate AI'}
                    </span>
                  </div>
                </div>

                {/* Dynamic 20-Bar Audio Spectrum Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-10 mt-6 w-60">
                  {[35, 60, 90, 75, 100, 45, 80, 65, 95, 50, 85, 70, 90, 55, 75, 40, 65, 85, 50, 30].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isAiSpeaking
                          ? 'bg-gradient-to-t from-purple-500 via-indigo-300 to-pink-300 shadow-xs shadow-purple-400'
                          : isAiThinking
                          ? 'bg-indigo-400/30'
                          : 'bg-slate-700/40'
                      }`}
                      style={{
                        height: isAiSpeaking ? `${h}%` : isAiThinking ? '25%' : '12%',
                        animation: isAiSpeaking ? `bounce 1.1s infinite ${i * 55}ms` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Tile Footer: Live Subtitles Prompter Card */}
              <div className="z-10 p-3.5 sm:p-4 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 text-xs text-slate-200 space-y-1.5 shadow-xl">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-indigo-400">subtitles</span>
                    <span>Phụ Đề Trực Tiếp</span>
                  </span>
                  <span className="text-slate-400 text-[10px] font-normal">
                    {dialogueHistory[dialogueHistory.length - 1]?.sender === 'ai' ? 'HireMate AI đang phát biểu' : 'Lượt trao đổi'}
                  </span>
                </div>
                <p className="line-clamp-2 sm:line-clamp-3 text-slate-100 font-medium italic leading-relaxed text-xs sm:text-[13px]">
                  "{dialogueHistory[dialogueHistory.length - 1]?.text?.replace(/[*_#`~>]/g, '') || 'Chào bạn, chúng ta cùng bắt đầu buổi phỏng vấn chuyên môn nhé!'}"
                </p>
              </div>
            </div>

            {/* TILE 2 (RIGHT): ỨNG VIÊN - LIVE WEBCAM VIDEO STREAM & AI TELEMETRY HUD */}
            <div className="relative rounded-3xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl min-h-[380px] sm:min-h-[440px] flex items-center justify-center ring-1 ring-white/10">
              
              {/* Real-time WebCam Stream OR Simulated AI Biometric Vision */}
              {isCameraOn ? (
                isSimulatedCamera ? (
                  /* CHẾ ĐỘ QUÉT KHUÔN MẶT ẢO AI (SIMULATED BIOMETRIC VISION HUD) */
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/80 via-slate-950 to-slate-950 overflow-hidden select-none">
                    {/* Futuristic Grid Pattern Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf812_1px,transparent_1px),linear-gradient(to_bottom,#38bdf812_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

                    {/* Animated Scanning Laser Beam */}
                    <div
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-pulse pointer-events-none transition-all duration-700"
                      style={{ top: `${detectedFaceBox.y + detectedFaceBox.h * 0.45}%` }}
                    />

                    {/* 3D Biometric Avatar / Face Wireframe Icon */}
                    <div className="relative z-0 flex flex-col items-center justify-center space-y-3">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/30 to-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.25)]">
                        <span className="material-symbols-outlined text-6xl text-cyan-300 animate-pulse">face</span>
                        {/* Concentric Pulse Rings */}
                        <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-25" />
                        <div className="absolute -inset-3 rounded-full border border-indigo-500/20" />
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-xs font-mono font-bold text-cyan-300 tracking-wider flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>AI BIOMETRIC TELEMETRY ACTIVE</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Đang quét phong thái, ánh mắt và biểu cảm mô phỏng</p>
                      </div>
                    </div>

                    {/* Simulated Reticle Corner Box */}
                    <div
                      className="absolute border-2 rounded-2xl pointer-events-none transition-all duration-300 border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                      style={{
                        left: `${detectedFaceBox.x}%`,
                        top: `${detectedFaceBox.y}%`,
                        width: `${detectedFaceBox.w}%`,
                        height: `${detectedFaceBox.h}%`,
                      }}
                    >
                      <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-300" />
                      <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-300" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-300" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-300" />

                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-[9px] font-mono font-bold tracking-wider whitespace-nowrap shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>AI SIMULATED VISION • 89% GAZE</span>
                      </div>
                    </div>

                    {/* Bottom switcher: try real camera */}
                    <div className="absolute bottom-14 right-4 z-20">
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-[11px] font-semibold text-slate-300 hover:text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        title="Thử chuyển sang camera vật lý nếu đã cấp quyền"
                      >
                        <span className="material-symbols-outlined text-sm text-cyan-400">videocam</span>
                        <span>Đổi Sang Camera Thật</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* REAL WEBCAM VIDEO STREAM */
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* AI Face Landmark Bounding Box Overlay */}
                    <div
                      className={`absolute border-2 rounded-2xl pointer-events-none transition-all duration-300 ${
                        liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt')
                          ? 'border-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                          : 'border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                      }`}
                      style={{
                        left: `${detectedFaceBox.x}%`,
                        top: `${detectedFaceBox.y}%`,
                        width: `${detectedFaceBox.w}%`,
                        height: `${detectedFaceBox.h}%`,
                      }}
                    >
                      {/* Reticle Corner Brackets */}
                      <div className={`absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 ${
                        liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt') ? 'border-amber-300' : 'border-emerald-300'
                      }`} />
                      <div className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 ${
                        liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt') ? 'border-amber-300' : 'border-emerald-300'
                      }`} />
                      <div className={`absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 ${
                        liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt') ? 'border-amber-300' : 'border-emerald-300'
                      }`} />
                      <div className={`absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 ${
                        liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt') ? 'border-amber-300' : 'border-emerald-300'
                      }`} />

                      {/* HUD Bounding Badge */}
                      <div className={`absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border text-[9px] font-mono font-bold tracking-wider whitespace-nowrap shadow-md flex items-center gap-1 ${
                        liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt') || livePostureStatus.includes('Cúi đầu')
                          ? 'border-amber-500/50 text-amber-300'
                          : 'border-emerald-500/50 text-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          liveEyeContactPercent < 50 || livePostureStatus.includes('Quay mặt') || livePostureStatus.includes('Cúi đầu') ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'
                        }`} />
                        <span>{
                          livePostureStatus.includes('Quay mặt') ? '⚠️ QUAY MẶT SANG BÊN' :
                          livePostureStatus.includes('Cúi đầu') ? '⚠️ CÚI ĐẦU / NHÌN XUỐNG' :
                          liveEyeContactPercent < 50 ? '⚠️ ÁNH MẮT CHƯA TẬP TRUNG' :
                          'MEDIAPIPE AI FACE TRACKING'
                        }</span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* CAMERA OFF / PERMISSION DENIED UI */
                <div className="w-full h-full flex flex-col items-center justify-center p-5 sm:p-6 text-slate-300 bg-slate-900/95 space-y-3.5 max-w-md mx-auto text-center animate-fadeIn font-sans">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border ${
                    cameraError === 'permission_denied'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800/90 border-slate-700 text-slate-300'
                  }`}>
                    <span className="material-symbols-outlined text-3xl">
                      {cameraError === 'permission_denied' ? 'no_photography' : 'videocam_off'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      {cameraError === 'permission_denied'
                        ? 'Quyền Camera Đang Bị Chặn Trên Trình Duyệt'
                        : cameraError === 'in_use'
                        ? 'Camera Đang Bị Ứng Dụng Khác Chiếm Giữ'
                        : cameraError === 'not_found'
                        ? 'Không Tìm Thấy Thiết Bị Camera'
                        : 'Camera Của Bạn Đang Tắt'}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {cameraError === 'permission_denied'
                        ? 'Trình duyệt (Cốc Cốc / Chrome) đã chặn quyền camera của trang này.'
                        : cameraError === 'in_use'
                        ? 'Vui lòng đóng Zoom, Microsoft Teams, Google Meet hoặc Zalo rồi thử lại.'
                        : 'Bật camera để AI phân tích phong thái, ánh mắt và cảm xúc khuôn mặt theo thời gian thực.'}
                    </p>
                  </div>

                  {/* Step-by-step unblock instructions */}
                  {cameraError === 'permission_denied' && (
                    <div className="w-full p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200 text-left space-y-1.5 font-sans">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <span className="material-symbols-outlined text-sm">help</span>
                        <span>Cách Mở Lại Quyền Camera Nhanh (3 bước):</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px] pl-1">
                        <li>Bấm vào biểu tượng <strong>Ổ khóa 🔒</strong> hoặc <strong>📹 gạch chéo</strong> ở đầu thanh URL (<code className="text-cyan-300">localhost:3000</code>).</li>
                        <li>Chuyển mục <strong>Máy ảnh (Camera)</strong> sang <strong>"Cho phép" (Allow)</strong>.</li>
                        <li>Bấm nút <strong>"Thử Lại Camera"</strong> bên dưới (hoặc ấn <kbd className="px-1 bg-slate-800 rounded text-[10px]">F5</kbd>).</li>
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
                    <button
                      onClick={startCamera}
                      className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-[#32247b] hover:from-indigo-500 hover:to-[#251963] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">videocam</span>
                      <span>Thử Lại Camera</span>
                    </button>

                    <button
                      onClick={startSimulatedVision}
                      className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:border-cyan-400"
                      title="Không cần camera vật lý, AI vẫn quét và chấm điểm phong thái đầy đủ"
                    >
                      <span className="material-symbols-outlined text-base text-cyan-300">auto_fix_high</span>
                      <span>Bật Quét Khuôn Mặt Ảo AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* OVERLAY TOP-LEFT: REAL CAMERA STATUS & EYE CONTACT */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
                  {isCameraOn ? (
                    <>
                      <span className={`w-2 h-2 rounded-full ${liveEyeContactPercent < 50 ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                      <span>{isSimulatedCamera ? 'AI Biometric Ảo • Trực tiếp' : 'Camera HD • Trực tiếp'}</span>
                      <span className="text-slate-500">|</span>
                      <span className={`font-bold flex items-center gap-1 ${liveEyeContactPercent < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        <span>Ánh mắt: {liveEyeContactPercent}%</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Camera đang tắt</span>
                    </>
                  )}
                </div>

                {isCameraOn && (
                  <div className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300 flex items-center gap-1.5 shadow-sm">
                    <span className={`material-symbols-outlined text-xs ${livePostureStatus.includes('Quay mặt') ? 'text-amber-400' : 'text-emerald-400'}`}>accessibility_new</span>
                    <span>Tư thế: <strong className={livePostureStatus.includes('Quay mặt') ? 'text-amber-300' : 'text-white'}>{livePostureStatus}</strong></span>
                  </div>
                )}
              </div>

              {/* OVERLAY TOP-RIGHT: FACIAL EMOTION & RESOLUTION */}
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 text-[11px] font-bold text-indigo-200 flex items-center gap-1.5 shadow-lg">
                  <span className="material-symbols-outlined text-xs text-purple-400">mood</span>
                  <span>Biểu cảm: <span className="text-white font-extrabold">{liveFacialEmotion}</span></span>
                </div>
                <div className="px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono text-slate-300 border border-white/10">
                  HD 1080p • 60 FPS
                </div>
              </div>

              {/* OVERLAY BOTTOM-LEFT: CANDIDATE BADGE & ACOUSTIC TELEMETRY STRIP */}
              <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5">
                <div className="px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-bold text-white shadow-xl">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <span>{user?.fullName || 'Bạn'}</span>
                  {isMicOn ? (
                    <div className="flex items-center gap-0.5 h-3 ml-1">
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-full" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2/3" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-4/5" />
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-sm text-rose-400 ml-1">mic_off</span>
                  )}
                </div>

                {/* Acoustic Telemetry HUD Chip */}
                {isMicOn && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 shadow-md">
                    <span className="flex items-center gap-1 text-purple-300">
                      <span className="material-symbols-outlined text-xs">graphic_eq</span>
                      <span>{livePitchHz} Hz</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-300">{liveWpm} WPM</span>
                    <span className="text-slate-600">•</span>
                    <span className={turnFillerCount > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                      {turnFillerCount > 0 ? `Lọc: ${turnFillerCount} từ đệm` : 'Lọc: 0 từ đệm'}
                    </span>
                  </div>
                )}
              </div>

              {/* OVERLAY BOTTOM-RIGHT: CAMERA TOGGLE BUTTON */}
              <div className="absolute bottom-4 right-4 z-10">
                <button
                  onClick={toggleCamera}
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg ${
                    isCameraOn
                      ? 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-800'
                      : 'bg-rose-600/90 border-rose-500 text-white hover:bg-rose-700'
                  }`}
                  title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isCameraOn ? 'videocam' : 'videocam_off'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* REAL-TIME CANDIDATE SPEECH PREVIEW (KHI ĐANG NÓI) */}
          {currentAnswer && (
            <div className="max-w-3xl mx-auto w-full mb-3 px-4 py-3 rounded-2xl bg-indigo-950/95 border border-indigo-400/40 text-xs text-indigo-200 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl animate-fadeIn">
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="truncate">
                  <strong className="text-white">
                    {listenStatus === 'checking'
                      ? 'AI đang kiểm tra bạn đã nói xong chưa:'
                      : listenStatus === 'waiting'
                      ? 'AI thấy bạn chưa nói hết, đang chờ bạn nói tiếp:'
                      : 'Đang nhận diện giọng nói:'}
                  </strong> "{currentAnswer}"
                </span>
              </div>
              <button
                onClick={() => handleSendCandidateTurn()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer shadow-md flex items-center gap-1"
              >
                <span>Gửi Ngay</span>
                <span className="material-symbols-outlined text-xs">send</span>
              </button>
            </div>
          )}

          {/* BẢNG HƯỚNG DẪN: Cách trả lời câu hỏi hiện tại + mẹo ghi âm */}
          {showCoach && (
            <div className="max-w-3xl mx-auto w-full mb-3 p-4 rounded-2xl bg-slate-900/95 border border-amber-400/30 text-xs text-slate-200 shadow-2xl backdrop-blur-xl animate-fadeIn">
              <div className="flex items-center justify-between mb-2.5">
                <strong className="text-amber-300 flex items-center gap-1.5 text-[13px]">
                  <span className="material-symbols-outlined text-base">tips_and_updates</span>
                  Hướng dẫn trả lời câu hỏi này
                </strong>
                <button
                  type="button"
                  onClick={() => setShowCoach(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Đóng gợi ý"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {isCoachLoading ? (
                <div className="py-3 text-slate-400 animate-pulse">Đang phân tích câu hỏi để chỉ cách trả lời...</div>
              ) : coaching ? (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-bold border border-amber-400/30">
                      {coaching.questionType}
                    </span>
                    <span className="text-slate-300">{coaching.approach}</span>
                  </div>
                  {Array.isArray(coaching.keyPoints) && coaching.keyPoints.length > 0 && (
                    <div>
                      <div className="font-bold text-emerald-300 mb-1">Ý chính nên nói</div>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                        {coaching.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {coaching.sampleOpening && (
                    <div className="px-3 py-2 rounded-xl bg-indigo-950/70 border border-indigo-400/30 text-indigo-100 italic">
                      Câu mở đầu gợi ý: “{coaching.sampleOpening}”
                    </div>
                  )}
                  {Array.isArray(coaching.avoid) && coaching.avoid.length > 0 && (
                    <div>
                      <div className="font-bold text-rose-300 mb-1">Nên tránh</div>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                        {coaching.avoid.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {coaching.timeTip && <div className="text-slate-400">⏱ {coaching.timeTip}</div>}
                </div>
              ) : (
                <div className="py-2 text-slate-400">Chưa có câu hỏi nào để phân tích. Hãy đợi AI đặt câu hỏi rồi bấm lại nhé.</div>
              )}

              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">mic</span>
                  Mẹo ghi âm để AI hiểu đúng và biết khi nào bạn nói xong
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                  <li>Bật micro và nói tự nhiên như đang trò chuyện, không cần bấm nút khi trả lời.</li>
                  <li>Khi bạn dừng khoảng 2 giây, AI sẽ tự kiểm tra ý đã trọn vẹn chưa rồi mới trả lời. Nếu bạn đang suy nghĩ dở câu, AI sẽ chờ thêm.</li>
                  <li>Muốn AI trả lời ngay: nói “em xin hết” hoặc “vậy thôi ạ”, hoặc bấm Gửi Ngay.</li>
                  <li>Mic tự tắt khi AI đang nói để không thu lại tiếng loa. Đeo tai nghe sẽ nhận diện chính xác hơn.</li>
                  <li>Nói rõ từng ý, nên theo khung: bối cảnh, việc bạn làm, kết quả có con số. Bạn có thể hỏi lại AI nếu chưa hiểu câu hỏi.</li>
                </ul>
              </div>
            </div>
          )}

          {/* BOTTOM DOCK: THANH ĐIỀU KHIỂN CHUẨN GOOGLE MEET / APPLE FACETIME */}
          <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2 sm:gap-3 p-3 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
            
            {/* Control 1: Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isMicOn
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700'
              }`}
              title={isMicOn ? 'Tắt Micro' : 'Bật Micro để nói chuyện'}
            >
              <span className="material-symbols-outlined text-xl">
                {isMicOn ? 'mic' : 'mic_off'}
              </span>
            </button>

            {/* Control 2: Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isCameraOn
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white ring-4 ring-indigo-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
              title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
            >
              <span className="material-symbols-outlined text-xl">
                {isCameraOn ? 'videocam' : 'videocam_off'}
              </span>
            </button>

            {/* Control: Gợi ý cách trả lời STAR & Hạn ngạch theo gói */}
            <button
              type="button"
              onClick={handleRequestCoaching}
              className={`px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg text-xs font-bold ${
                showCoach
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white ring-4 ring-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
              }`}
              title="Gợi ý cách trả lời câu hỏi này theo mô hình STAR"
              aria-label="Chỉ cách trả lời"
            >
              <span className="material-symbols-outlined text-base">lightbulb</span>
              <span className="hidden sm:inline">Gợi Ý STAR</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-400/30">
                {isCandidateFree ? `${coachUsageCount}/1 lượt` : isCandidatePlus ? `${coachUsageCount}/3 lượt` : '∞ VIP'}
              </span>
            </button>

            {/* Control 3: Ngắt Lời AI (Chỉ hiện khi AI đang nói để chen ngang nếu cần) */}
            {isAiSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-pulse shadow-lg shadow-orange-500/20"
                title="Ngắt lời AI để trả lời ngay"
              >
                <span className="material-symbols-outlined text-base">pan_tool</span>
                <span className="hidden sm:inline">Ngắt Lời AI</span>
              </button>
            )}

            {/* Control 4: Gửi Lượt Nói Ngay (Enter) */}
            <button
              onClick={() => handleSendCandidateTurn()}
              disabled={!currentAnswer.trim() || isTurnProcessingRef.current}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#32247b] to-indigo-600 hover:from-[#251963] hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Gửi câu trả lời ngay lập tức"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span className="hidden sm:inline">Gửi Lượt Nói</span>
            </button>

            {/* Control 5: Mở Khung Biên Bản & Nhắn Tin (Drawer) */}
            <button
              onClick={() => setIsChatDrawerOpen(true)}
              className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 relative shadow-md"
              title="Mở biên bản đối thoại và gõ chữ"
            >
              <span className="material-symbols-outlined text-xl">forum</span>
              {dialogueHistory.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                  {dialogueHistory.length}
                </span>
              )}
            </button>

            {/* Control 6: Kết Thúc Cuộc Phỏng Vấn */}
            <button
              onClick={handleFinishInterview}
              disabled={isFinishing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              title="Kết thúc buổi phỏng vấn & Xem báo cáo STAR"
            >
              <span className="material-symbols-outlined text-base">call_end</span>
              <span className="hidden sm:inline">{isFinishing ? 'Đang chấm...' : 'Kết Thúc'}</span>
            </button>
          </div>

          {/* SLIDE-OVER DRAWER: KHUNG BIÊN BẢN PHỎNG VẤN & NHẮN TIN TRỰC TIẾP */}
          {isChatDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
              <div className="w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft">
                
                {/* Drawer Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#32247b] to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-900/10">
                      <span className="material-symbols-outlined text-lg">smart_toy</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">Biên Bản Phỏng Vấn AI</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Trực Tiếp
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Thời gian thực • Tự động ghi nhận đối đáp</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatDrawerOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer"
                    title="Đóng biên bản"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Voice Status & Switcher Bar */}
                <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-sm text-[#32247b]">record_voice_over</span>
                    <span className="text-[11px] font-medium truncate">
                      Giọng đọc: <strong className="text-slate-800">{selectedVoice?.name?.replace(/Microsoft |Online \(Natural\) - |Google /g, '') || 'Tự động (Tiếng Việt)'}</strong>
                    </span>
                  </div>
                  {availableVoices.length > 1 && (
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const v = availableVoices.find((x) => x.name === e.target.value);
                        if (v) setSelectedVoice(v);
                      }}
                      className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 outline-none cursor-pointer hover:border-slate-300"
                    >
                      {availableVoices.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name.replace(/Microsoft |Online \(Natural\) - |Google /g, '').slice(0, 24)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {dialogueHistory.map((turn) => {
                    const isAi = turn.sender === 'ai';
                    return (
                      <div
                        key={turn.id}
                        className={`flex gap-3 items-start ${isAi ? 'justify-start' : 'justify-end'}`}
                      >
                        {isAi && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#32247b] to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                          </div>
                        )}
                        <div className={`max-w-[85%] space-y-1.5 ${isAi ? 'items-start' : 'items-end'}`}>
                          <div className={`flex items-center gap-2 text-[11px] font-semibold ${isAi ? 'text-slate-500 justify-start' : 'text-slate-400 justify-end'}`}>
                            <span className="font-bold text-slate-700">{turn.speakerName}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isAi ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-200 text-slate-700'}`}>
                              {isAi ? 'Người Phỏng Vấn' : 'Ứng Viên'}
                            </span>
                            <span>{turn.timestamp}</span>
                          </div>
                          <div
                            className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                              isAi
                                ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                                : 'bg-gradient-to-r from-indigo-600 to-[#32247b] text-white rounded-tr-xs'
                            }`}
                          >
                            <p className="whitespace-pre-line font-normal">{turn.text}</p>
                            {isAi ? (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => speakWithSentenceChunking(turn.text)}
                                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                                  title="Nghe lại câu hỏi này"
                                >
                                  <span className="material-symbols-outlined text-sm">volume_up</span>
                                  <span>Nghe lại</span>
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 pt-2 border-t border-indigo-400/30 flex items-center justify-between text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (turn.audioUrl) {
                                      showToast('🎧 Đang phát lại bản ghi âm giọng nói của bạn...');
                                      const audio = new Audio(interviewApi.getAudioPlaybackUrl(turn.audioUrl));
                                      audio.play().catch(() => {
                                        speakWithSentenceChunking(turn.text);
                                      });
                                    } else {
                                      showToast('🔊 Đang đọc lại câu trả lời của bạn...');
                                      speakWithSentenceChunking(turn.text);
                                    }
                                  }}
                                  className="text-indigo-100 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                                  title="Nghe lại bài nói của bạn"
                                >
                                  <span className="material-symbols-outlined text-sm">headphones</span>
                                  <span>{turn.audioUrl ? '🎧 Nghe lại bài nói của bạn' : '🔊 Đọc lại câu trả lời'}</span>
                                </button>
                                {turn.audioUrl && (
                                  <span className="text-[9px] bg-indigo-500/40 text-indigo-100 px-1.5 py-0.2 rounded font-mono">
                                    Cloud Audio
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {!isAi && (
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 shadow-sm mt-0.5 text-xs">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'B'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isAiThinking && (
                    <div className="flex gap-3 items-center text-slate-500 text-xs italic bg-white p-3 rounded-2xl border border-slate-200 shadow-xs max-w-[80%]">
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                      <span>HireMate AI đang phân tích câu trả lời của bạn...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Gợi ý nhanh:</span>
                  <button
                    onClick={() => {
                      const lastAi = [...dialogueHistory].reverse().find((d) => d.sender === 'ai');
                      if (lastAi) speakWithSentenceChunking(lastAi.text);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">replay</span>
                    <span>Nhắc lại câu hỏi</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentAnswer('Theo kinh nghiệm của tôi trong dự án thực tế, để giải quyết vấn đề này tôi đã thực hiện theo các bước: ');
                      showToast('💡 Đã nạp khung mở đầu trả lời STAR vào ô nhập liệu!');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#32247b] text-[11px] font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1 border border-purple-200"
                  >
                    <span className="material-symbols-outlined text-xs">format_quote</span>
                    <span>Mở đầu STAR</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentAnswer((prev) => (prev ? prev + ' Ngoài ra, tôi muốn bổ sung thêm: ' : 'Tôi muốn bổ sung thêm: '));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add_circle</span>
                    <span>Bổ sung ý</span>
                  </button>
                </div>

                {/* Keyboard & Voice Input Composer */}
                <div className="p-3.5 border-t border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMic}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                        isMicOn
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title={isMicOn ? 'Tắt Micro' : 'Bật Micro để nói'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isMicOn ? 'mic' : 'mic_off'}
                      </span>
                    </button>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && currentAnswer.trim().length > 0) {
                          e.preventDefault();
                          handleSendCandidateTurn();
                        }
                      }}
                      placeholder="Gõ câu trả lời của bạn tại đây... (Nhấn Enter để gửi)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#32247b] focus:bg-white text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      onClick={() => handleSendCandidateTurn()}
                      disabled={currentAnswer.trim().length === 0 || isTurnProcessingRef.current}
                      className="px-4 py-2.5 rounded-xl bg-[#32247b] hover:bg-[#251963] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      <span>Gửi</span>
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      )}

      {/* ===================================================================== */}
      {/* 3. VIEW RESULT (BÁO CÁO NĂNG LỰC CHÂN THẬT - ZERO FAKE DATA)          */}
      {view === 'result' && result && (
        <AiInterviewReportPage
          user={user}
          sessionData={result}
          onBack={() => {
            setView('setup');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onRetry={handleRetrySession}
        />
      )}

      {/* ===================================================================== */}
      {/* 4. VIEW HISTORY                                                       */}
      {/* ===================================================================== */}
      {view === 'history' && !selectedHistorySession && (
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5 animate-fadeIn font-sans">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-bold text-slate-900">Lịch Sử Các Buổi Phỏng Vấn AI</h1>
            <p className="text-xs text-slate-500">Xem lại các buổi đối thoại trước đó và nhận xét từ AI.</p>
          </div>

          {isHistoryLoading && historyList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-8 h-8 border-3 border-[#32247b]/20 border-t-[#32247b] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Đang đồng bộ dữ liệu lịch sử phỏng vấn AI từ Supabase...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">history_toggle_off</span>
              <p className="text-xs text-slate-500">Chưa có lịch sử phỏng vấn.</p>
              <button
                onClick={() => setView('setup')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#32247b] hover:bg-[#251963] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">tune</span>
                <span>Bắt Đầu Buổi Phỏng Vấn Mới</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyList.map((hist) => (
                <div
                  key={hist.id}
                  onClick={() => setSelectedHistorySession(hist)}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3 hover:border-[#32247b] transition-all cursor-pointer shadow-xs"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{hist.topic}</h4>
                    <p className="text-[11px] text-slate-500">
                      {hist.date} • {hist.duration} • {hist.questionsCount} lượt đối đáp
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{hist.totalScore}/100</div>
                      <div className="text-[10px] font-semibold text-[#32247b]">{hist.grade}</div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* History Detail View: Executive AiInterviewReportPage */}
      {view === 'history' && selectedHistorySession && (
        <AiInterviewReportPage
          user={user}
          sessionData={selectedHistorySession}
          onBack={() => {
            setSelectedHistorySession(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onRetry={handleRetrySession}
        />
      )}

      {/* Voice Assistant Modal */}
      <VoiceAiAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        user={user}
        initialContext={{
          targetPosition: ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob) ? selectedJob.title : customPosition,
          level: LEVELS.find((l) => l.id === selectedLevel)?.label || 'Middle',
          jobId: ((contextMode === 'job' || contextMode === 'ai-recommend') && selectedJob && typeof selectedJob.jobId === 'number') ? selectedJob.jobId : null,
        }}
      />

      {/* QUOTA LIMIT UPGRADE MODAL (KIỂM SOÁT HẠN NGẠCH SUPABASE) */}
      {isQuotaModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#160d31] border border-purple-500/40 p-6 sm:p-8 text-white shadow-2xl ring-1 ring-white/10 animate-scaleUp">
            {/* Close button */}
            <button
              onClick={() => setIsQuotaModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {/* Modal Icon */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-3.5 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/25 ring-4 ring-orange-500/20">
              <span className="material-symbols-outlined text-white text-3xl">lock_clock</span>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {quotaStatus?.isQuotaExceeded ? 'Hôm Nay Bạn Đã Hết Lượt!' : 'Mở Khóa Tính Năng Cao Cấp'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                {quotaStatus?.isQuotaExceeded ? (
                  <>
                    Bạn đã sử dụng hết <span className="font-bold text-amber-400 font-mono">{quotaStatus?.usedToday ?? 0}/{quotaStatus?.quotaLimit ?? 2} lượt phỏng vấn</span> hôm nay của gói <strong className="text-purple-300 font-bold">{quotaStatus?.planName || 'Free Candidate'}</strong>.
                  </>
                ) : (
                  <>
                    Tính năng &quot;<span className="font-bold text-amber-400">{quotaExceededMessage}</span>&quot; thuộc đặc quyền của gói nâng cao. Hiện tại bạn đang sử dụng gói <strong className="text-purple-300 font-bold">{quotaStatus?.planName || 'Free Candidate'}</strong>. Hãy nâng cấp gói để trải nghiệm đầy đủ!
                  </>
                )}
              </p>
            </div>

            {/* Quick Benefits Comparison */}
            <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs text-slate-200">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                Nâng cấp gói để mở khóa đặc quyền phỏng vấn:
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span><strong>Practice Plus (49.000đ):</strong> 10 lượt/ngày, 5 câu hỏi chuẩn, 10 phút/buổi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span><strong>Practice Pro (149.000đ):</strong> 30 lượt/ngày, 7 câu đào sâu Follow-up, 15 phút/buổi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span><strong>Career Ace (249.000đ):</strong> Không giới hạn lượt, 8 câu Marathon Tech Lead, 20 phút</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsQuotaModalOpen(false);
                  if (onNavigate) onNavigate('candidate-pricing');
                  else window.location.href = '/candidate-pricing';
                }}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                <span>Nâng Cấp Gói Luyện Tập Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuotaModalOpen(false)}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                Quay Lại Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

