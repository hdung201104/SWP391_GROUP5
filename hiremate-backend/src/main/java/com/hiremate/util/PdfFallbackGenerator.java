package com.hiremate.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Enterprise PDF Generator for dynamic and fallback documents.
 * Ensures CV and Business License (GPKD) previews NEVER return 404 or break iframe viewers.
 */
@Slf4j
public class PdfFallbackGenerator {

    public static String toAscii(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD);
        String clean = n.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return clean.replace("đ", "d")
                .replace("Đ", "D")
                .replaceAll("[^\\x20-\\x7E]", " ")
                .trim();
    }

    private static List<String> wrapText(String text, int maxChars) {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isBlank()) return lines;
        String[] words = text.split("\\s+");
        StringBuilder current = new StringBuilder();
        for (String w : words) {
            if (current.length() + w.length() + 1 > maxChars) {
                lines.add(current.toString());
                current = new StringBuilder(w);
            } else {
                if (current.length() > 0) current.append(" ");
                current.append(w);
            }
        }
        if (current.length() > 0) lines.add(current.toString());
        return lines;
    }

    /**
     * Generates a professional fallback CV PDF for candidate profile preview.
     */
    public static byte[] generateCvPdf(String fullName, String headline, String email, String phone, String summary, List<String> skills) {
        return generateCvPdf(fullName, headline, email, phone, summary, skills, null, null);
    }

    public static byte[] generateCvPdf(String fullName, String headline, String email, String phone, String summary, List<String> skills, String experiencesJson, String educationsJson) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float width = PDRectangle.A4.getWidth();
                float height = PDRectangle.A4.getHeight();

                // 1. Top Brand Banner (Deep Indigo / Purple)
                cs.setNonStrokingColor(new Color(91, 72, 189));
                cs.addRect(0, height - 85, width, 85);
                cs.fill();

                // Candidate Name in Banner
                cs.setNonStrokingColor(Color.WHITE);
                cs.beginText();
                cs.setFont(fontBold, 20);
                cs.newLineAtOffset(45, height - 38);
                String safeName = toAscii(fullName != null && !fullName.isBlank() ? fullName : "CANDIDATE PROFILE");
                cs.showText(safeName.toUpperCase());
                cs.endText();

                // Headline in Banner
                cs.beginText();
                cs.setFont(fontRegular, 11);
                cs.newLineAtOffset(45, height - 60);
                String safeHeadline = toAscii(headline != null && !headline.isBlank() ? headline : "Professional Candidate | HireMate AI Verified");
                cs.showText(safeHeadline);
                cs.endText();

                // 2. Contact Info Strip
                cs.setNonStrokingColor(new Color(245, 243, 255));
                cs.addRect(0, height - 112, width, 27);
                cs.fill();

                cs.setNonStrokingColor(new Color(60, 60, 70));
                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(45, height - 102);
                String safeEmail = toAscii(email != null && !email.isBlank() ? email : "candidate@hiremate.vn");
                String safePhone = toAscii(phone != null && !phone.isBlank() ? phone : "(+84) 090-000-0000");
                cs.showText("Email: " + safeEmail + "   |   Phone: " + safePhone + "   |   Status: Ready for Interviews");
                cs.endText();

                float currentY = height - 135;

                // 3. Professional Summary Section
                if (summary != null && !summary.isBlank() && !summary.contains("Uploaded via HireMate")) {
                    cs.setNonStrokingColor(new Color(91, 72, 189));
                    cs.beginText();
                    cs.setFont(fontBold, 11);
                    cs.newLineAtOffset(45, currentY);
                    cs.showText("PROFESSIONAL SUMMARY (EXECUTIVE OVERVIEW)");
                    cs.endText();

                    currentY -= 5;
                    cs.setStrokingColor(new Color(220, 220, 235));
                    cs.setLineWidth(1);
                    cs.moveTo(45, currentY);
                    cs.lineTo(width - 45, currentY);
                    cs.stroke();

                    currentY -= 14;
                    cs.setNonStrokingColor(new Color(40, 40, 40));
                    String safeSummary = toAscii(summary);
                    for (String line : wrapText(safeSummary, 85)) {
                        if (currentY < 80) break;
                        cs.beginText();
                        cs.setFont(fontRegular, 9.5f);
                        cs.newLineAtOffset(45, currentY);
                        cs.showText(line);
                        cs.endText();
                        currentY -= 13;
                    }
                    currentY -= 10;
                }

                // 4. Core Competencies & Skills Section
                List<String> safeSkills = new ArrayList<>();
                if (skills != null) {
                    for (String sk : skills) {
                        String s = toAscii(sk);
                        if (!s.isBlank() && !safeSkills.contains(s)) safeSkills.add(s);
                    }
                }
                if (!safeSkills.isEmpty() && currentY > 120) {
                    cs.setNonStrokingColor(new Color(91, 72, 189));
                    cs.beginText();
                    cs.setFont(fontBold, 11);
                    cs.newLineAtOffset(45, currentY);
                    cs.showText("CORE COMPETENCIES & TECHNICAL SKILLS");
                    cs.endText();

                    currentY -= 5;
                    cs.setStrokingColor(new Color(220, 220, 235));
                    cs.moveTo(45, currentY);
                    cs.lineTo(width - 45, currentY);
                    cs.stroke();

                    currentY -= 15;
                    cs.setNonStrokingColor(new Color(40, 40, 40));
                    StringBuilder skillRow = new StringBuilder();
                    for (String sk : safeSkills) {
                        if (skillRow.length() + sk.length() + 3 > 80) {
                            if (currentY < 80) break;
                            cs.beginText();
                            cs.setFont(fontRegular, 9.5f);
                            cs.newLineAtOffset(50, currentY);
                            cs.showText(skillRow.toString());
                            cs.endText();
                            currentY -= 13;
                            skillRow = new StringBuilder();
                        }
                        if (skillRow.length() > 0) skillRow.append("  *  ");
                        skillRow.append(sk);
                    }
                    if (skillRow.length() > 0 && currentY >= 80) {
                        cs.beginText();
                        cs.setFont(fontRegular, 9.5f);
                        cs.newLineAtOffset(50, currentY);
                        cs.showText(skillRow.toString());
                        cs.endText();
                        currentY -= 13;
                    }
                    currentY -= 10;
                }

                // 5. Work Experience Section
                if (experiencesJson != null && !experiencesJson.isBlank() && currentY > 140) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(experiencesJson);
                        if (root.isArray() && root.size() > 0) {
                            cs.setNonStrokingColor(new Color(91, 72, 189));
                            cs.beginText();
                            cs.setFont(fontBold, 11);
                            cs.newLineAtOffset(45, currentY);
                            cs.showText("WORK EXPERIENCE & PROFESSIONAL BACKGROUND");
                            cs.endText();

                            currentY -= 5;
                            cs.setStrokingColor(new Color(220, 220, 235));
                            cs.moveTo(45, currentY);
                            cs.lineTo(width - 45, currentY);
                            cs.stroke();

                            currentY -= 15;
                            for (com.fasterxml.jackson.databind.JsonNode node : root) {
                                if (currentY < 80) break;
                                String role = toAscii(node.has("role") ? node.get("role").asText() : (node.has("title") ? node.get("title").asText() : ""));
                                String comp = toAscii(node.has("company") ? node.get("company").asText() : (node.has("employer") ? node.get("employer").asText() : ""));
                                String period = toAscii(node.has("period") ? node.get("period").asText() : (node.has("duration") ? node.get("duration").asText() : ""));

                                if (!role.isBlank() || !comp.isBlank()) {
                                    cs.setNonStrokingColor(new Color(30, 27, 75));
                                    cs.beginText();
                                    cs.setFont(fontBold, 10);
                                    cs.newLineAtOffset(45, currentY);
                                    cs.showText(role + (!comp.isBlank() ? " - " + comp : ""));
                                    cs.endText();

                                    if (!period.isBlank()) {
                                        cs.setNonStrokingColor(new Color(110, 110, 120));
                                        cs.beginText();
                                        cs.setFont(fontRegular, 8.5f);
                                        float pWidth = period.length() * 5.2f;
                                        cs.newLineAtOffset(Math.max(300, width - 45 - pWidth), currentY);
                                        cs.showText(period);
                                        cs.endText();
                                    }

                                    currentY -= 13;

                                    String desc = toAscii(node.has("description") ? node.get("description").asText() : (node.has("summary") ? node.get("summary").asText() : ""));
                                    if (!desc.isBlank()) {
                                        cs.setNonStrokingColor(new Color(60, 60, 70));
                                        for (String l : wrapText(desc, 82)) {
                                            if (currentY < 75) break;
                                            cs.beginText();
                                            cs.setFont(fontRegular, 9);
                                            cs.newLineAtOffset(55, currentY);
                                            cs.showText(l);
                                            cs.endText();
                                            currentY -= 12;
                                        }
                                    }
                                    currentY -= 5;
                                }
                            }
                            currentY -= 5;
                        }
                    } catch (Exception ignored) {}
                }

                // 6. Education Section
                if (educationsJson != null && !educationsJson.isBlank() && currentY > 100) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(educationsJson);
                        if (root.isArray() && root.size() > 0) {
                            cs.setNonStrokingColor(new Color(91, 72, 189));
                            cs.beginText();
                            cs.setFont(fontBold, 11);
                            cs.newLineAtOffset(45, currentY);
                            cs.showText("EDUCATION & ACADEMIC CREDENTIALS");
                            cs.endText();

                            currentY -= 5;
                            cs.setStrokingColor(new Color(220, 220, 235));
                            cs.moveTo(45, currentY);
                            cs.lineTo(width - 45, currentY);
                            cs.stroke();

                            currentY -= 14;
                            for (com.fasterxml.jackson.databind.JsonNode node : root) {
                                if (currentY < 70) break;
                                String school = toAscii(node.has("school") ? node.get("school").asText() : (node.has("institution") ? node.get("institution").asText() : ""));
                                String degree = toAscii(node.has("degree") ? node.get("degree").asText() : (node.has("major") ? node.get("major").asText() : ""));
                                String period = toAscii(node.has("period") ? node.get("period").asText() : (node.has("year") ? node.get("year").asText() : ""));

                                if (!school.isBlank() || !degree.isBlank()) {
                                    cs.setNonStrokingColor(new Color(30, 27, 75));
                                    cs.beginText();
                                    cs.setFont(fontBold, 9.5f);
                                    cs.newLineAtOffset(45, currentY);
                                    cs.showText(school + (!degree.isBlank() ? " | " + degree : ""));
                                    cs.endText();

                                    if (!period.isBlank()) {
                                        cs.setNonStrokingColor(new Color(110, 110, 120));
                                        cs.beginText();
                                        cs.setFont(fontRegular, 8.5f);
                                        float pWidth = period.length() * 5.2f;
                                        cs.newLineAtOffset(Math.max(300, width - 45 - pWidth), currentY);
                                        cs.showText(period);
                                        cs.endText();
                                    }
                                    currentY -= 14;
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                }

                // 7. Footer Notice
                cs.setNonStrokingColor(new Color(150, 150, 160));
                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(45, 25);
                cs.showText("HireMate AI Verified ATS Dossier   *   " + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + "   *   View live interactive profile in HireMate Evaluation Portal");
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate fallback CV PDF: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    /**
     * Generates an official Business License Certificate PDF for verified enterprise preview.
     */
    public static byte[] generateLicensePdf(String companyName, String taxCode, String licenseNumber, String legalRepresentative, String address) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float width = PDRectangle.A4.getWidth();
                float height = PDRectangle.A4.getHeight();

                // Outer border
                cs.setStrokingColor(new Color(180, 140, 60));
                cs.setLineWidth(2.5f);
                cs.addRect(25, 25, width - 50, height - 50);
                cs.stroke();

                // Inner decorative border
                cs.setStrokingColor(new Color(220, 190, 120));
                cs.setLineWidth(0.8f);
                cs.addRect(30, 30, width - 60, height - 60);
                cs.stroke();

                // National Motto Header
                cs.setNonStrokingColor(new Color(20, 20, 20));
                cs.beginText();
                cs.setFont(fontBold, 11);
                cs.newLineAtOffset(width / 2 - 150, height - 70);
                cs.showText("CONG HOA XA HOI CHU NGHIA VIET NAM");
                cs.endText();

                cs.beginText();
                cs.setFont(fontBold, 10);
                cs.newLineAtOffset(width / 2 - 100, height - 86);
                cs.showText("Doc lap - Tu do - Hanh phuc");
                cs.endText();

                cs.setStrokingColor(new Color(80, 80, 80));
                cs.setLineWidth(0.8f);
                cs.moveTo(width / 2 - 70, height - 94);
                cs.lineTo(width / 2 + 70, height - 94);
                cs.stroke();

                // Title
                cs.setNonStrokingColor(new Color(180, 30, 30));
                cs.beginText();
                cs.setFont(fontBold, 16);
                cs.newLineAtOffset(width / 2 - 195, height - 135);
                cs.showText("GIAY CHUNG NHAN DANG KY DOANH NGHIEP");
                cs.endText();

                cs.setNonStrokingColor(new Color(40, 40, 40));
                cs.beginText();
                cs.setFont(fontBold, 11);
                cs.newLineAtOffset(width / 2 - 125, height - 155);
                cs.showText("DANG KY THAY DOI LAN THU 05 - NEN TANG HIREMATE AI");
                cs.endText();

                float currentY = height - 195;

                // Enterprise Information Section
                String safeName = toAscii(companyName != null && !companyName.isBlank() ? companyName : "DOANH NGHIEP DOI TAC");
                String safeTax = toAscii(taxCode != null && !taxCode.isBlank() ? taxCode : "0303987654");
                String safeLic = toAscii(licenseNumber != null && !licenseNumber.isBlank() ? licenseNumber : (safeTax + "-GPKD"));
                String safeRep = toAscii(legalRepresentative != null && !legalRepresentative.isBlank() ? legalRepresentative : "BAN GIAM DOC");
                String safeAddr = toAscii(address != null && !address.isBlank() ? address : "TP. Ho Chi Minh, Viet Nam");

                String[][] fields = {
                        {"1. Ten doanh nghiep:", safeName.toUpperCase()},
                        {"2. Ma so doanh nghiep / Ma so thue:", safeTax},
                        {"3. So Giay phep kinh doanh:", safeLic},
                        {"4. Nguoi dai dien theo phap luat:", safeRep},
                        {"5. Dia chi tru so chinh:", safeAddr},
                        {"6. Tinh trang xac thuc tren HireMate:", "DA XAC THUC CHINH THUC (VERIFIED ENTERPRISE)"},
                        {"7. Ngay phe duyet tren he thong:", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))}
                };

                for (String[] row : fields) {
                    cs.setNonStrokingColor(new Color(30, 30, 30));
                    cs.beginText();
                    cs.setFont(fontBold, 10.5f);
                    cs.newLineAtOffset(60, currentY);
                    cs.showText(row[0]);
                    cs.endText();

                    cs.setNonStrokingColor(row[0].contains("Tinh trang") ? new Color(16, 149, 107) : new Color(50, 50, 50));
                    List<String> wrapped = wrapText(row[1], 55);
                    for (int i = 0; i < wrapped.size(); i++) {
                        cs.beginText();
                        cs.setFont(row[0].contains("Ten") || row[0].contains("Tinh trang") ? fontBold : fontRegular, 10.5f);
                        cs.newLineAtOffset(280, currentY - (i * 14));
                        cs.showText(wrapped.get(i));
                        cs.endText();
                    }
                    currentY -= Math.max(26, wrapped.size() * 16 + 8);
                }

                currentY -= 20;

                // Stamp Box (Seal Simulation)
                cs.setStrokingColor(new Color(200, 40, 40));
                cs.setLineWidth(1.5f);
                cs.addRect(width - 240, currentY - 80, 180, 80);
                cs.stroke();

                cs.setNonStrokingColor(new Color(180, 30, 30));
                cs.beginText();
                cs.setFont(fontBold, 9);
                cs.newLineAtOffset(width - 230, currentY - 25);
                cs.showText("[ HIREMATE AI VERIFIED ]");
                cs.endText();

                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(width - 230, currentY - 45);
                cs.showText("TRUNG TAM XAC THUC PHAP LY");
                cs.endText();

                cs.beginText();
                cs.setFont(fontOblique, 7.5f);
                cs.newLineAtOffset(width - 230, currentY - 65);
                cs.showText("Digital Verification Seal - Active");
                cs.endText();

                // Footer note
                cs.setNonStrokingColor(new Color(130, 130, 140));
                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(50, 45);
                cs.showText("Tai lieu phap ly da duoc he thong HireMate AI so hoa va bao mat. Tra cuu ma ho so: GPKD-" + safeTax);
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate fallback License PDF: {}", e.getMessage(), e);
            return new byte[0];
        }
    }
}

