package com.hiremate.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bộ chuẩn hóa văn bản chuyên sâu cho AI Voice Agent (Text-to-Speech).
 * - Làm sạch hoàn toàn Markdown, HTML, ký tự đặc biệt, bullet points, numbering.
 * - Chuẩn hóa tách từ an toàn cho Google TTS song ngữ Việt-Anh (Back end, My SQL, Mongo DB, Graph QL...)
 *   để giữ 100% ngữ âm tiếng Anh tự nhiên trong câu tiếng Việt.
 * - Cung cấp bộ chuyển ngữ âm chuyên sâu riêng cho giọng đọc đơn ngữ Microsoft Edge Tiếng Việt
 *   (vi-VN-NamMinhNeural / vi-VN-HoaiMyNeural) để không bị đọc sai từ tiếng Anh kỹ thuật.
 * - Nhận diện chính xác câu thuần tiếng Anh (kể cả câu ngắn) để định tuyến sang giọng bản xứ en-US.
 */
public final class SpeechPhoneticNormalizer {

    private static final Map<Pattern, String> SAFE_SYMBOL_MAP = new LinkedHashMap<>();
    private static final Map<Pattern, String> MONOLINGUAL_VI_PHONETIC_MAP = new LinkedHashMap<>();

    private static final Set<String> UNACCENTED_VI_STOPWORDS = Set.of(
            "chao", "xin", "ban", "toi", "minh", "anh", "chi", "em", "khong", "duoc",
            "nhu", "nao", "cua", "trong", "voi", "cho", "lam", "viec", "du", "an",
            "hay", "hoac", "nhung", "vi", "nen", "khi", "neu", "va", "la", "co", "da",
            "dang", "se", "ve", "tu", "den", "nay", "do", "rat", "vui", "cam", "on",
            "phong", "van", "ung", "vien", "kinh", "nghiem", "ky", "nang", "cong", "ty"
    );

    static {
        // 1. Ký hiệu phi chữ cái & từ ghép công nghệ để Google TTS song ngữ (tl=vi) đọc chuẩn 100%
        addSymbolRule("\\bC#", "C Sharp");
        addSymbolRule("\\bC\\+\\+", "C Plus Plus");
        addSymbolRule("\\bF#", "F Sharp");
        addSymbolRule("\\bCI/CD\\b", "CI CD");
        addSymbolRule("\\bUI/UX\\b", "UI UX");
        addSymbolRule("\\bUX/UI\\b", "UX UI");
        addSymbolRule("\\bQA/QC\\b", "QA QC");
        addSymbolRule("\\bB2B\\b", "B to B");
        addSymbolRule("\\bB2C\\b", "B to C");
        addSymbolRule("\\bC&B\\b", "C and B");
        addSymbolRule("\\bR&D\\b", "R and D");
        addSymbolRule("\\bBack[-]?end\\b", "Back end");
        addSymbolRule("\\bFront[-]?end\\b", "Front end");
        addSymbolRule("\\bFull[-]?stack\\b", "Full stack");
        addSymbolRule("\\bMySQL\\b", "My SQL");
        addSymbolRule("\\bMongoDB\\b", "Mongo DB");
        addSymbolRule("\\bGraphQL\\b", "Graph QL");
        addSymbolRule("\\bSpringBoot\\b", "Spring Boot");
        addSymbolRule("\\bNode\\.js\\b|\\bNodeJS\\b", "Node JS");
        addSymbolRule("\\bNext\\.js\\b|\\bNextJS\\b", "Next JS");
        addSymbolRule("\\bVue\\.js\\b|\\bVueJS\\b", "Vue JS");
        addSymbolRule("\\bReactJS\\b", "React JS");
        addSymbolRule("\\bExpress\\.js\\b|\\bExpressJS\\b", "Express JS");
        addSymbolRule("\\bNestJS\\b", "Nest JS");
        addSymbolRule("\\bOAuth2\\b", "OAuth 2");
        addSymbolRule("\\bDevOps\\b", "Dev Ops");
        addSymbolRule("\\bDevSecOps\\b", "Dev Sec Ops");
        addSymbolRule("\\bNoSQL\\b", "No SQL");
        addSymbolRule("\\bv\\.v\\.\\.\\.|\\bv\\.v\\.\\b", "vân vân");
        addSymbolRule("\\be\\.g\\.\\b", "ví dụ");
        addSymbolRule("\\bi\\.e\\.\\b", "tức là");
        addSymbolRule("&", " và ");

        // 2. Từ điển phiên âm chuyên sâu CHỈ dùng cho giọng đơn ngữ Edge Tiếng Việt (vi-VN-NamMinhNeural / HoaiMyNeural)
        addViPhonetic("\\bHireMate\\b", "Hai-ơ-mết");
        addViPhonetic("\\bSpring Boot\\b", "Sờ-pring Bút");
        addViPhonetic("\\bSpring\\b", "Sờ-pring");
        addViPhonetic("\\bMicroservices?\\b", "Mai-crô-sơ-vít");
        addViPhonetic("\\bPostgreSQL\\b", "Pốt-gre Ét-kiu-eo");
        addViPhonetic("\\bPostgres\\b", "Pốt-gre");
        addViPhonetic("\\bMy SQL\\b|\\bMySQL\\b", "Mai Ét-kiu-eo");
        addViPhonetic("\\bNo SQL\\b|\\bNoSQL\\b", "Nâu Ét-kiu-eo");
        addViPhonetic("\\bGraph QL\\b|\\bGraphQL\\b", "Gráp Kiu-eo");
        addViPhonetic("\\bMongo DB\\b|\\bMongoDB\\b", "Mông-gô Đi-bi");
        addViPhonetic("\\bSQL\\b", "Ét-kiu-eo");
        addViPhonetic("\\bDocker\\b", "Đóc-cơ");
        addViPhonetic("\\bKubernetes\\b|\\bK8s\\b", "Ku-bơ-ne-tít");
        addViPhonetic("\\bConcurrency\\b", "Con-cơ-rân-si");
        addViPhonetic("\\bMultithreading\\b", "Măn-ti-thờ-rét-đing");
        addViPhonetic("\\bDeadlock\\b", "Đét-lóc");
        addViPhonetic("\\bTransaction\\b", "Tran-sác-sần");
        addViPhonetic("\\bDatabase\\b", "Đa-ta-bây");
        addViPhonetic("\\bBack end\\b|\\bBackend\\b", "Bách-en");
        addViPhonetic("\\bFront end\\b|\\bFrontend\\b", "Phờ-răn-ten");
        addViPhonetic("\\bFull stack\\b|\\bFullstack\\b", "Phun-sờ-tách");
        addViPhonetic("\\bJavaScript\\b", "Gia-va-sờ-críp");
        addViPhonetic("\\bTypeScript\\b", "Tai-sờ-críp");
        addViPhonetic("\\bJava\\b", "Gia-va");
        addViPhonetic("\\bPython\\b", "Pai-thần");
        addViPhonetic("\\bGolang\\b", "Gâu-leng");
        addViPhonetic("\\bReact\\b", "Ri-ách");
        addViPhonetic("\\bAngular\\b", "An-giu-lơ");
        addViPhonetic("\\bNode JS\\b", "Nốt Giây-ét");
        addViPhonetic("\\bNext JS\\b", "Nếch Giây-ét");
        addViPhonetic("\\bRESTful\\b", "Rét-phun");
        addViPhonetic("\\bREST\\b", "Rét");
        addViPhonetic("\\bAPI\\b", "Ây-pi-ai");
        addViPhonetic("\\bJWT\\b", "Giây-đắp-liu-ti");
        addViPhonetic("\\bOAuth\\b", "Ô-ót");
        addViPhonetic("\\bRedis\\b", "Re-đít");
        addViPhonetic("\\bKafka\\b", "Cáp-ca");
        addViPhonetic("\\bRabbitMQ\\b", "Ra-bít Em-kiu");
        addViPhonetic("\\bHibernate\\b", "Hai-bơ-nết");
        addViPhonetic("\\bJPA\\b", "Giây-pi-ây");
        addViPhonetic("\\bWebSocket\\b", "Oép-sóc-két");
        addViPhonetic("\\bWebhook\\b", "Oép-húc");
        addViPhonetic("\\bGitHub\\b", "Gít-hắp");
        addViPhonetic("\\bGitLab\\b", "Gít-láp");
        addViPhonetic("\\bGit\\b", "Gít");
        addViPhonetic("\\bCloud\\b", "Cờ-lao");
        addViPhonetic("\\bAWS\\b", "Ây-đắp-liu-ét");
        addViPhonetic("\\bDev Ops\\b|\\bDevOps\\b", "Đép-óp");
        addViPhonetic("\\bCI CD\\b", "Xi-ai Xi-đi");
        addViPhonetic("\\bUI UX\\b", "Diu-ai Diu-ích");
        addViPhonetic("\\bQA QC\\b", "Kiu-ây Kiu-xi");
        addViPhonetic("\\bPipeline\\b", "Pai-lai");
        addViPhonetic("\\bDeployment\\b", "Đi-ploi-mần");
        addViPhonetic("\\bDeploy\\b", "Đi-ploi");
        addViPhonetic("\\bProduction\\b", "Prô-đắc-sần");
        addViPhonetic("\\bPerformance\\b", "Pơ-pho-mần");
        addViPhonetic("\\bScalable\\b", "Sờ-kêu-lơ-bồ");
        addViPhonetic("\\bScalability\\b", "Sờ-kêu-lơ-bi-li-ti");
        addViPhonetic("\\bLatency\\b", "Lây-tần-si");
        addViPhonetic("\\bThroughput\\b", "Thờ-ru-pút");
        addViPhonetic("\\bBottleneck\\b", "Bót-tồ-néch");
        addViPhonetic("\\bTrade[- ]?offs?\\b", "Chờ-rết-óp");
        addViPhonetic("\\bCaching\\b", "Két-sing");
        addViPhonetic("\\bCache\\b", "Két");
        addViPhonetic("\\bIndex\\b", "In-đếch");
        addViPhonetic("\\bQuery\\b", "Kue-ri");
        addViPhonetic("\\bFramework\\b", "Phờ-rêm-uốc");
        addViPhonetic("\\bArchitecture\\b", "A-ki-tếch-chơ");
        addViPhonetic("\\bDesign Pattern\\b", "Đi-dai Pát-tần");
        addViPhonetic("\\bComponent\\b", "Cơm-pô-nần");
        addViPhonetic("\\bState\\b", "Sờ-tết");
        addViPhonetic("\\bFresher\\b", "Phờ-rét-sơ");
        addViPhonetic("\\bIntern\\b", "In-tơn");
        addViPhonetic("\\bJunior\\b", "Giu-ni-ơ");
        addViPhonetic("\\bMiddle\\b", "Mít-đồ");
        addViPhonetic("\\bSenior\\b", "Si-ni-ơ");
        addViPhonetic("\\bTech Lead\\b", "Tếch Lít");
        addViPhonetic("\\bManager\\b", "Me-nơ-giơ");
        addViPhonetic("\\bEngineer\\b", "En-gi-nia");
        addViPhonetic("\\bDeveloper\\b", "Đi-ve-lớp-pơ");
        addViPhonetic("\\bSoftware\\b", "Sóp-oe");
        addViPhonetic("\\bSystem\\b", "Sít-tầm");
        addViPhonetic("\\bServer\\b", "Sơ-vơ");
        addViPhonetic("\\bClient\\b", "Cờ-lai-ần");
        addViPhonetic("\\bTesting\\b", "Tét-sting");
        addViPhonetic("\\bAutomation\\b", "Ô-tô-mây-sần");
        addViPhonetic("\\bManual\\b", "Me-niu-ồ");
        addViPhonetic("\\bSelenium\\b", "Sê-lê-ni-um");
        addViPhonetic("\\bPlaywright\\b", "Pờ-lây-rai");
        addViPhonetic("\\bAgile\\b", "Ơ-giai");
        addViPhonetic("\\bScrum\\b", "Sờ-crăm");
        addViPhonetic("\\bSprint\\b", "Sờ-prin");
        addViPhonetic("\\bDeadline\\b", "Đét-lai");
        addViPhonetic("\\bFeedback\\b", "Phít-bách");
        addViPhonetic("\\bStakeholders?\\b", "Sờ-tếch-hâu-đơ");
        addViPhonetic("\\bMarketing\\b", "Ma-két-ting");
        addViPhonetic("\\bDigital\\b", "Đi-gi-tồ");
        addViPhonetic("\\bConversion\\b", "Con-vơ-sần");
        addViPhonetic("\\bFunnel\\b", "Phăn-nồ");
        addViPhonetic("\\bSales\\b", "Sêu");
        addViPhonetic("\\bLogistics\\b", "Lô-gít-stích");
        addViPhonetic("\\bIncoterms\\b", "In-cô-tơm");
        addViPhonetic("\\bKPIs?\\b", "Kây-pi-ai");
        addViPhonetic("\\bOKRs?\\b", "Ô-kây-a");
        addViPhonetic("\\bROI\\b", "A-ô-ai");
        addViPhonetic("\\bSTAR\\b", "Sờ-ta");
        addViPhonetic("\\bCV\\b", "Xi-vi");
        addViPhonetic("\\bJD\\b", "Giây-đi");
        addViPhonetic("\\bAI\\b", "Ây-ai");
        addViPhonetic("\\bHR\\b", "Ếch-a");
        addViPhonetic("\\bIT\\b", "Ai-ti");
        addViPhonetic("\\bOOP\\b", "Ô-ô-pi");
        addViPhonetic("\\bSOLID\\b", "Sô-lít");
        addViPhonetic("\\bACID\\b", "A-xít");
        addViPhonetic("\\bSLA\\b", "Ét-eo-ây");
        addViPhonetic("\\bUAT\\b", "Diu-ây-ti");
    }

    private static void addSymbolRule(String regex, String replacement) {
        SAFE_SYMBOL_MAP.put(Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE), replacement);
    }

    private static void addViPhonetic(String regex, String replacement) {
        MONOLINGUAL_VI_PHONETIC_MAP.put(Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE), replacement);
    }

    private SpeechPhoneticNormalizer() {}

    /**
     * Làm sạch văn bản cho động cơ TTS song ngữ (Google TTS tl=vi, ElevenLabs, Edge en-US).
     * Giữ nguyên từ ngữ tiếng Anh tự nhiên và tách nhẹ các từ ghép công nghệ dễ đọc sai.
     */
    public static String normalize(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        // 1. Tẩy sạch Markdown, HTML tags, bullet points, numbering và nhãn chiến lược nội bộ
        String s = text
                .replaceAll("(?im)^\\[Chiến lược\\]:.*?(\\r?\\n|$)", " ")
                .replaceAll("(?i)<[^>]*>", " ")
                .replaceAll("(?i)\\[(.*?)\\]\\(.*?\\)", "$1")
                .replaceAll("[#*_`~>\\[\\]{}()\"“”„‟«»]", " ")
                .replaceAll("^(\\d+[\\.\\)]|Câu\\s*\\d+[:\\.]|Q\\d+[:\\.])\\s*", "")
                .replaceAll("[-–—]{2,}", " - ")
                .trim();

        // 2. Chuẩn hóa ký hiệu phi chữ cái & từ ghép công nghệ (C#, C++, Back end, My SQL...)
        for (Map.Entry<Pattern, String> entry : SAFE_SYMBOL_MAP.entrySet()) {
            Matcher m = entry.getKey().matcher(s);
            if (m.find()) {
                s = m.replaceAll(entry.getValue());
            }
        }

        // 3. Chuẩn hóa khoảng trắng và dấu câu để ngữ điệu ngắt nghỉ tự nhiên
        s = s.replaceAll("\\s*([,;:])\\s*", "$1 ")
                .replaceAll("\\s*([.!?])\\s*", "$1 ")
                .replaceAll("\\s+", " ")
                .trim();

        return s;
    }

    /**
     * Chuẩn hóa dành riêng cho giọng đọc đơn ngữ tiếng Việt của Microsoft Edge
     * (vi-VN-NamMinhNeural / vi-VN-HoaiMyNeural) vốn không có bộ phát âm tiếng Anh tích hợp.
     */
    public static String normalizeForMonolingualVietnameseEdgeTts(String text) {
        String s = normalize(text);
        if (s.isEmpty()) return s;
        for (Map.Entry<Pattern, String> entry : MONOLINGUAL_VI_PHONETIC_MAP.entrySet()) {
            Matcher m = entry.getKey().matcher(s);
            if (m.find()) {
                s = m.replaceAll(entry.getValue());
            }
        }
        return s.replaceAll("\\s+", " ").trim();
    }

    /**
     * Tương thích ngược cho Google Translate TTS (tl=vi): giữ nguyên tiếng Anh tự nhiên.
     */
    public static String normalizeForVietnameseTts(String text) {
        return normalize(text);
    }

    /**
     * Nhận diện văn bản chủ yếu là tiếng Anh hay tiếng Việt
     * để chọn đúng ngôn ngữ đọc (en-US Neural vs vi-VN) cho TTS.
     */
    public static boolean isMostlyEnglish(String text) {
        if (text == null || text.isBlank()) return false;

        // Đếm số ký tự có dấu đặc trưng tiếng Việt
        long vnCharCount = text.chars().filter(c ->
                "àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ".indexOf(c) >= 0
        ).count();

        long letterCount = text.chars().filter(Character::isLetter).count();
        if (letterCount == 0) return false;

        // Nếu có trên 4% ký tự tiếng Việt có dấu -> xác định là tiếng Việt (hoặc Việt pha thuật ngữ Anh)
        if ((double) vnCharCount / letterCount > 0.04) {
            return false;
        }

        // Nếu không có ký tự có dấu tiếng Việt: kiểm tra từ khóa tiếng Anh & loại trừ tiếng Việt không dấu
        String cleanAlpha = text.toLowerCase().replaceAll("[^a-z\\s]", " ").replaceAll("\\s+", " ").trim();
        if (cleanAlpha.isEmpty()) return false;
        String[] tokens = cleanAlpha.split(" ");

        int viUnaccentedHits = 0;
        for (String tok : tokens) {
            if (UNACCENTED_VI_STOPWORDS.contains(tok)) {
                viUnaccentedHits++;
            }
        }
        if (tokens.length > 0 && (double) viUnaccentedHits / tokens.length >= 0.35) {
            return false;
        }

        String lower = " " + cleanAlpha + " ";
        String[] englishIndicators = {
                " the ", " is ", " are ", " was ", " were ", " you ", " your ", " what ", " how ", " why ",
                " when ", " where ", " can ", " could ", " tell ", " me ", " about ", " experience ",
                " with ", " project ", " have ", " has ", " been ", " would ", " should ", " which ", " please ",
                " in ", " for ", " and ", " to ", " of ", " that ", " this ", " hello ", " hi ", " welcome ",
                " thank ", " thanks ", " explain ", " describe ", " design ", " system ", " interview ",
                " position ", " role ", " team ", " work ", " working ", " challenge ", " solution ", " good "
        };

        int matchCount = 0;
        for (String word : englishIndicators) {
            if (lower.contains(word)) {
                matchCount++;
            }
        }

        // Nếu hoàn toàn không có dấu tiếng Việt: chỉ cần >= 1 từ tiếng Anh chuẩn hoặc >= 2 từ ASCII không phải tiếng Việt không dấu
        if (vnCharCount == 0) {
            return matchCount >= 1 || tokens.length >= 2;
        }
        return matchCount >= 2;
    }
}
