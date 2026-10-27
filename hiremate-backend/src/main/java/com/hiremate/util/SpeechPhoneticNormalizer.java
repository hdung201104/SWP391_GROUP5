package com.hiremate.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bộ chuẩn hóa văn bản chuyên sâu cho AI Voice Agent (Text-to-Speech).
 * - Làm sạch hoàn toàn Markdown, HTML, ký tự đặc biệt, bullet points, numbering.
 * - Giữ nguyên 100% từ vựng tiếng Anh kỹ thuật và câu tiếng Việt tự nhiên
 *   (Không dùng bộ phiên âm thô sơ cứng nhắc, để các mô hình giọng đọc Neural
 *   tự động phát âm chuẩn xác ngữ âm đa ngôn ngữ như ChatGPT Voice, Gemini Live, ELSA).
 * - Mở rộng an toàn các ký hiệu lập trình phi chữ cái (C# -> C Sharp, C++ -> C Plus Plus).
 * - Chuẩn hóa ngắt nghỉ dấu câu để giọng đọc biểu cảm, tự nhiên, nhịp nhàng.
 */
public final class SpeechPhoneticNormalizer {

    private static final Map<Pattern, String> SAFE_SYMBOL_MAP = new LinkedHashMap<>();

    static {
        // Chỉ xử lý các ký tự phi chữ cái mà công cụ TTS không tự đọc được hoặc đọc sai
        addSymbolRule("\\bC#\\b", "C Sharp");
        addSymbolRule("\\bC\\+\\+\\b", "C Plus Plus");
        addSymbolRule("\\bCI/CD\\b", "CI CD");
        addSymbolRule("\\bUI/UX\\b", "UI UX");
        addSymbolRule("\\bQA/QC\\b", "QA QC");
        addSymbolRule("\\bv\\.v\\.\\.\\.|\\bv\\.v\\.\\b", "vân vân");
        addSymbolRule("\\be\\.g\\.\\b", "ví dụ");
        addSymbolRule("\\bi\\.e\\.\\b", "tức là");
        addSymbolRule("&", " và ");
    }

    private static void addSymbolRule(String regex, String replacement) {
        SAFE_SYMBOL_MAP.put(Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE), replacement);
    }

    private SpeechPhoneticNormalizer() {}

    /**
     * Làm sạch văn bản cho động cơ giọng đọc Neural TTS.
     * Giữ nguyên từ ngữ gốc tiếng Anh lẫn tiếng Việt, chuẩn hóa dấu câu để ngắt nghỉ biểu cảm.
     */
    public static String normalize(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        // 1. Tẩy sạch Markdown, HTML tags, bullet points, numbering
        String s = text
                .replaceAll("(?i)<[^>]*>", " ")
                .replaceAll("(?i)\\[(.*?)\\]\\(.*?\\)", "$1")
                .replaceAll("[#*_`~>\\[\\]{}()\"“”„‟«»]", " ")
                .replaceAll("^(\\d+[\\.\\)]|Câu\\s*\\d+[:\\.]|Q\\d+[:\\.])\\s*", "")
                .replaceAll("[-–—]{2,}", " - ")
                .trim();

        // 2. Chuyển đổi các ký hiệu phi chữ cái (C#, C++, CI/CD)
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
     * Tương thích ngược: Giữ nguyên văn bản tự nhiên, không áp đặt phiên âm thô.
     */
    public static String normalizeForVietnameseTts(String text) {
        return normalize(text);
    }

    /**
     * Nhận diện văn bản chủ yếu là tiếng Anh hay tiếng Việt
     * để chọn đúng ngôn ngữ đọc (tl=en vs tl=vi) cho TTS.
     */
    public static boolean isMostlyEnglish(String text) {
        if (text == null || text.isBlank()) return false;

        // Đếm số ký tự có dấu đặc trưng tiếng Việt
        long vnCharCount = text.chars().filter(c ->
                "àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ".indexOf(c) >= 0
        ).count();

        long letterCount = text.chars().filter(Character::isLetter).count();
        if (letterCount == 0) return false;

        // Nếu có trên 5% ký tự tiếng Việt có dấu -> xác định là tiếng Việt
        if ((double) vnCharCount / letterCount > 0.05) {
            return false;
        }

        // Nếu không có hoặc rất ít ký tự tiếng Việt, kiểm tra các từ khóa tiếng Anh thông dụng
        String lower = " " + text.toLowerCase().replaceAll("[^a-z\\s]", " ") + " ";
        String[] englishIndicators = {
                " the ", " is ", " are ", " you ", " your ", " what ", " how ", " why ",
                " when ", " can ", " could ", " tell ", " me ", " about ", " experience ",
                " with ", " project ", " have ", " been ", " would ", " which ", " please ",
                " in ", " for ", " and ", " to ", " of ", " that ", " this "
        };

        int matchCount = 0;
        for (String word : englishIndicators) {
            if (lower.contains(word)) {
                matchCount++;
            }
        }

        return matchCount >= 2;
    }
}
