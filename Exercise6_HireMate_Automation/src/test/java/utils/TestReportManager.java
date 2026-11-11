package utils;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * TestReportManager: Quản lý và tự động xuất Báo cáo Kết quả Kiểm thử (HTML + CSV)
 * sau khi bộ kiểm thử Selenium hoàn tất.
 * Tách biệt hoàn toàn Danh sách kịch bản kiểm thử ra khỏi mã nguồn Java.
 */
public class TestReportManager {

    public static class TestRecord {
        public String testCaseId;
        public String feature;
        public String scenario;
        public String inputData;
        public String expectedResult;
        public String actualResult;
        public long durationMs;
        public boolean passed;
        public String errorMessage;

        public TestRecord(String testCaseId, String feature, String scenario, String inputData,
                          String expectedResult, String actualResult, long durationMs,
                          boolean passed, String errorMessage) {
            this.testCaseId = testCaseId;
            this.feature = feature;
            this.scenario = scenario;
            this.inputData = inputData;
            this.expectedResult = expectedResult;
            this.actualResult = actualResult;
            this.durationMs = durationMs;
            this.passed = passed;
            this.errorMessage = errorMessage;
        }
    }

    private static final List<TestRecord> records = Collections.synchronizedList(new ArrayList<>());

    public static void record(String testCaseId, String feature, String scenario, String inputData,
                              String expectedResult, String actualResult, long durationMs,
                              boolean passed, String errorMessage) {
        records.add(new TestRecord(testCaseId, feature, scenario, inputData, expectedResult,
                actualResult, durationMs, passed, errorMessage));
    }

    public static synchronized void exportReports() {
        if (records.isEmpty()) {
            return;
        }

        int total = records.size();
        int passedCount = 0;
        long totalDurationMs = 0;
        for (TestRecord r : records) {
            if (r.passed) passedCount++;
            totalDurationMs += r.durationMs;
        }
        int failedCount = total - passedCount;
        double passRate = total > 0 ? ((double) passedCount / total) * 100.0 : 0.0;

        String formattedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

        // 1. Xuất file HTML Dashboard
        String html = buildHtmlReport(total, passedCount, failedCount, passRate, totalDurationMs, formattedTime);
        writeContentToFile("target/Test_Execution_Report.html", html);
        writeContentToFile("Test_Execution_Report.html", html);

        // 2. Xuất file CSV kết quả
        String csv = buildCsvReport();
        writeContentToFile("target/Test_Execution_Results.csv", csv);
        writeContentToFile("Test_Execution_Results.csv", csv);

        System.out.println("\n[TestReportManager] Đã xuất thành công Báo cáo Kết quả Kiểm thử:");
        System.out.println("  -> HTML Dashboard : Test_Execution_Report.html");
        System.out.println("  -> CSV Data List  : Test_Execution_Results.csv");
        System.out.println("  -> Tổng số test   : " + total + " | Pass: " + passedCount + " (" + String.format("%.1f", passRate) + "%) | Fail: " + failedCount);
    }

    private static String buildCsvReport() {
        StringBuilder sb = new StringBuilder();
        sb.append("TestCaseID,Feature,ScenarioName,InputData,ExpectedResult,ActualResult,Duration(s),Status\n");
        for (TestRecord r : records) {
            sb.append(escapeCsv(r.testCaseId)).append(",")
              .append(escapeCsv(r.feature)).append(",")
              .append(escapeCsv(r.scenario)).append(",")
              .append(escapeCsv(r.inputData)).append(",")
              .append(escapeCsv(r.expectedResult)).append(",")
              .append(escapeCsv(r.actualResult)).append(",")
              .append(String.format("%.2f", r.durationMs / 1000.0)).append(",")
              .append(r.passed ? "PASS" : "FAIL").append("\n");
        }
        return sb.toString();
    }

    private static String escapeCsv(String str) {
        if (str == null) return "";
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }

    private static String buildHtmlReport(int total, int passed, int failed, double passRate,
                                          long totalDurationMs, String timestamp) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n")
          .append("<html lang=\"vi\">\n")
          .append("<head>\n")
          .append("    <meta charset=\"UTF-8\">\n")
          .append("    <title>Báo Cáo Kiểm Thử Tự Động - HireMate AI</title>\n")
          .append("    <style>\n")
          .append("        :root { --primary: #4f46e5; --success: #10b981; --danger: #ef4444; --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --border: #e2e8f0; }\n")
          .append("        * { box-sizing: border-box; margin: 0; padding: 0; }\n")
          .append("        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 24px; }\n")
          .append("        .container { max-width: 1400px; margin: 0 auto; }\n")
          .append("        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.2); }\n")
          .append("        .header h1 { font-size: 24px; margin-bottom: 6px; }\n")
          .append("        .header p { opacity: 0.9; font-size: 13px; }\n")
          .append("        .badge-meta { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 10px; margin-right: 8px; }\n")
          .append("        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }\n")
          .append("        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }\n")
          .append("        .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }\n")
          .append("        .card-val { font-size: 30px; font-weight: 800; }\n")
          .append("        .val-pass { color: var(--success); }\n")
          .append("        .val-fail { color: var(--danger); }\n")
          .append("        .val-rate { color: var(--primary); }\n")
          .append("        .progress-box { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-bottom: 24px; }\n")
          .append("        .track { height: 12px; background: #fee2e2; border-radius: 9999px; overflow: hidden; margin-top: 8px; }\n")
          .append("        .fill { height: 100%; background: var(--success); border-radius: 9999px; width: ").append(String.format("%.1f", passRate)).append("%; }\n")
          .append("        .table-box { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }\n")
          .append("        .table-top { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fff; }\n")
          .append("        table { width: 100%; border-collapse: collapse; font-size: 13px; }\n")
          .append("        th { background: #f8fafc; padding: 12px 14px; font-weight: 700; color: #475569; border-bottom: 1px solid var(--border); text-transform: uppercase; font-size: 11px; }\n")
          .append("        td { padding: 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }\n")
          .append("        tr:hover { background: #f8fafc; }\n")
          .append("        .badge-pass { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; }\n")
          .append("        .badge-fail { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; }\n")
          .append("        .tag-id { font-family: monospace; font-weight: 700; color: #4f46e5; background: #eef2ff; padding: 3px 6px; border-radius: 4px; }\n")
          .append("        .tag-feat { background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }\n")
          .append("        .cell-data { font-family: monospace; font-size: 11px; max-width: 250px; word-break: break-all; }\n")
          .append("    </style>\n")
          .append("</head>\n")
          .append("<body>\n")
          .append("<div class=\"container\">\n")
          .append("    <div class=\"header\">\n")
          .append("        <h1>BÁO CÁO KIỂM THỬ TỰ ĐỘNG - HIREMATE AI</h1>\n")
          .append("        <p>Khung kiểm thử: Selenium WebDriver 4.x &bull; JUnit 5 &bull; Page Object Model (POM) &bull; Data-Driven Testing (DDT)</p>\n")
          .append("        <span class=\"badge-meta\">Thời gian xuất báo cáo: ").append(timestamp).append("</span>\n")
          .append("        <span class=\"badge-meta\">Tác giả: Hoàng Ngọc Dũng - DE191112</span>\n")
          .append("    </div>\n")
          .append("    <div class=\"stats\">\n")
          .append("        <div class=\"card\"><div class=\"card-title\">Tổng số kịch bản</div><div class=\"card-val\">").append(total).append("</div></div>\n")
          .append("        <div class=\"card\"><div class=\"card-title\">Số ca thành công</div><div class=\"card-val val-pass\">").append(passed).append("</div></div>\n")
          .append("        <div class=\"card\"><div class=\"card-title\">Số ca thất bại</div><div class=\"card-val val-fail\">").append(failed).append("</div></div>\n")
          .append("        <div class=\"card\"><div class=\"card-title\">Tỷ lệ Pass</div><div class=\"card-val val-rate\">").append(String.format("%.1f", passRate)).append("%</div></div>\n")
          .append("        <div class=\"card\"><div class=\"card-title\">Tổng thời gian</div><div class=\"card-val\">").append(String.format("%.1f", totalDurationMs / 1000.0)).append("s</div></div>\n")
          .append("    </div>\n")
          .append("    <div class=\"progress-box\">\n")
          .append("        <div style=\"display:flex; justify-content:space-between; font-weight:600;\"><span>Tiến độ thực thi:</span><span style=\"color:#10b981;\">").append(String.format("%.1f", passRate)).append("% HOÀN THÀNH</span></div>\n")
          .append("        <div class=\"track\"><div class=\"fill\"></div></div>\n")
          .append("    </div>\n")
          .append("    <div class=\"table-box\">\n")
          .append("        <div class=\"table-top\"><h2 style=\"font-size:16px;\">DANH SÁCH CHI TIẾT CÁC TEST CASES ĐÃ THỰC THI TỰ ĐỘNG</h2><span class=\"tag-feat\">Nguồn dữ liệu: External CSV Files</span></div>\n")
          .append("        <table>\n")
          .append("            <thead>\n")
          .append("                <tr><th style=\"width:35px;\">#</th><th>Test ID</th><th>Feature</th><th>Kịch bản kiểm thử</th><th>Dữ liệu nạp vào</th><th>Kết quả kỳ vọng</th><th>Kết quả thực tế</th><th>Thời gian</th><th>Trạng thái</th></tr>\n")
          .append("            </thead>\n")
          .append("            <tbody>\n");

        int idx = 1;
        for (TestRecord r : records) {
            String badge = r.passed ? "<span class=\"badge-pass\">PASSED</span>" : "<span class=\"badge-fail\">FAILED</span>";
            String duration = String.format("%.2fs", r.durationMs / 1000.0);

            sb.append("                <tr>\n")
              .append("                    <td><b>").append(idx++).append("</b></td>\n")
              .append("                    <td><span class=\"tag-id\">").append(r.testCaseId).append("</span></td>\n")
              .append("                    <td><span class=\"tag-feat\">").append(r.feature).append("</span></td>\n")
              .append("                    <td><b>").append(r.scenario).append("</b></td>\n")
              .append("                    <td class=\"cell-data\">").append(r.inputData).append("</td>\n")
              .append("                    <td>").append(r.expectedResult).append("</td>\n")
              .append("                    <td>").append(r.actualResult).append("</td>\n")
              .append("                    <td>").append(duration).append("</td>\n")
              .append("                    <td>").append(badge).append("</td>\n")
              .append("                </tr>\n");
        }

        sb.append("            </tbody>\n")
          .append("        </table>\n")
          .append("    </div>\n")
          .append("</div>\n")
          .append("</body>\n")
          .append("</html>\n");

        return sb.toString();
    }

    private static void writeContentToFile(String path, String content) {
        try {
            File file = new File(path);
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            try (FileWriter writer = new FileWriter(file, StandardCharsets.UTF_8)) {
                writer.write(content);
            }
        } catch (IOException e) {
            System.err.println("[TestReportManager] Lỗi ghi file: " + e.getMessage());
        }
    }
}
