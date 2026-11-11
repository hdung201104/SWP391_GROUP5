package com.hiremate.service;

import com.hiremate.entity.Company;
import com.hiremate.entity.User;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;

/**
 * Service dong bo va chuan hoa toan bo media/logo doanh nghiep & avatar nguoi dung len Cloudinary Cloud CDN.
 * Khong luu tru va khong tra ve duong dan cuc bo (/uploads/...) hay Supabase Storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BrandMediaSyncService {

    public static final String CLOUD_LOGO_FPT_SOFTWARE = "https://res.cloudinary.com/mezrtcb7/image/upload/v1794385931/hiremate/logos/fpt-software.png";
    public static final String CLOUD_LOGO_FPT_DX       = "https://res.cloudinary.com/mezrtcb7/image/upload/v1794385931/hiremate/logos/fpt-dx.png";
    public static final String CLOUD_LOGO_VNG          = "https://res.cloudinary.com/mezrtcb7/image/upload/v1794385932/hiremate/logos/vng-corporation.png";
    public static final String CLOUD_LOGO_VIETTEL      = "https://res.cloudinary.com/mezrtcb7/image/upload/v1794385933/hiremate/logos/viettel-group.png";
    public static final String CLOUD_LOGO_MBBANK       = "https://res.cloudinary.com/mezrtcb7/image/upload/v1794385934/hiremate/logos/mbbank.png";
    public static final String CLOUD_LOGO_KMS          = "https://res.cloudinary.com/mezrtcb7/image/upload/v1794385934/hiremate/logos/kms-technology.png";

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final UserCacheService userCacheService;

    /**
     * Kiem tra va lam sach image URL: tu choi duong dan local (/uploads/...), blob:, data:, cdn.haitrieu.com, supabase.co/storage.
     */
    public static String sanitizeImageUrl(String rawUrl) {
        if (rawUrl == null) return null;
        String url = rawUrl.trim();
        if (url.isEmpty() || url.equals("#") || url.equalsIgnoreCase("null") || url.equalsIgnoreCase("undefined")) {
            return null;
        }
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.startsWith("blob:")
                || lower.startsWith("data:")
                || lower.startsWith("/uploads/")
                || lower.startsWith("uploads/")
                || lower.contains("localhost:")
                || lower.contains("127.0.0.1")
                || lower.contains("cdn.haitrieu.com")
                || lower.contains("supabase.co/storage")
                || lower.contains("placeholder")) {
            return null;
        }
        if (lower.startsWith("http://res.cloudinary.com/")) {
            return "https://" + url.substring("http://".length());
        }
        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return url;
        }
        return null;
    }

    /**
     * Tra ve Cloudinary logo chinh thuc dua tren ten doanh nghiep neu logo hien tai thieu hoac bi hong.
     */
    public static String resolveCompanyLogo(String companyName, String existingLogoUrl) {
        String cleanExisting = sanitizeImageUrl(existingLogoUrl);
        if (cleanExisting != null && cleanExisting.contains("res.cloudinary.com")) {
            return cleanExisting;
        }

        String matchedBrand = matchOfficialBrandLogo(companyName);
        if (matchedBrand != null) {
            return matchedBrand;
        }

        if (cleanExisting != null && !cleanExisting.contains("images.unsplash.com")) {
            return cleanExisting;
        }
        return cleanExisting;
    }

    public static String matchOfficialBrandLogo(String companyName) {
        if (companyName == null || companyName.isBlank()) return null;
        String norm = companyName.toLowerCase(Locale.ROOT);
        if (norm.contains("digital transformation") || norm.contains("fpt dx") || norm.contains("fpt digital")) {
            return CLOUD_LOGO_FPT_DX;
        }
        if (norm.contains("fpt software") || norm.contains("fsoft") || norm.contains("fpt")) {
            return CLOUD_LOGO_FPT_SOFTWARE;
        }
        if (norm.contains("vng")) {
            return CLOUD_LOGO_VNG;
        }
        if (norm.contains("viettel")) {
            return CLOUD_LOGO_VIETTEL;
        }
        if (norm.contains("mbbank") || norm.contains("mb bank") || norm.contains("quân đội")) {
            return CLOUD_LOGO_MBBANK;
        }
        if (norm.contains("kms")) {
            return CLOUD_LOGO_KMS;
        }
        return null;
    }

    /**
     * Dam bao moi Company luon so huu 1 logo chinh thuc tren Cloudinary CDN (tu dong tao monogram va day len Cloud neu la cty moi).
     */
    public String ensureCompanyLogo(Company company) {
        if (company == null) return null;
        String current = sanitizeImageUrl(company.getLogoUrl());
        if (current != null && current.contains("res.cloudinary.com")) {
            return current;
        }

        String officialUrl = matchOfficialBrandLogo(company.getCompanyName());
        if (officialUrl != null) {
            company.setLogoUrl(officialUrl);
            return officialUrl;
        }

        if (current != null && !current.contains("images.unsplash.com")) {
            return current;
        }

        // Neu chua co logo hop le & khong nam trong bo nhan dien co san -> render logo 512x512 sach se & day len Cloudinary
        try {
            byte[] png = renderCompanyMonogramPng(company.getCompanyName(), company.getCompanyId());
            String slug = (company.getCompanyName() != null ? company.getCompanyName() : "company")
                    .toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("(^-|-$)", "");
            if (slug.isEmpty()) slug = "enterprise";
            String publicId = "hiremate/logos/company-" + (company.getCompanyId() != null ? company.getCompanyId() + "-" : "") + slug;
            String cloudUrl = fileStorageService.storeBytesToCloud(png, slug + ".png", publicId, "logos");
            company.setLogoUrl(cloudUrl);
            log.info(">> [BrandMediaSync] Da tao va tai logo Cloudinary cho doanh nghiep '{}': {}", company.getCompanyName(), cloudUrl);
            return cloudUrl;
        } catch (Exception ex) {
            log.warn(">> [BrandMediaSync] Khong the upload logo tu dong len Cloudinary cho '{}': {}", company.getCompanyName(), ex.getMessage());
            return current;
        }
    }

    /**
     * Dong bo toan bo du lieu media trong CSDL khi he thong khoi dong:
     * - Nang cap tat ca logo cong ty thieu/hong len Cloudinary Cloud.
     * - Chuyen doi avatar Data-URI hoac /uploads/ cu (neu file ton tai) len Cloudinary; loai bo duong dan cuc bo chet.
     */
    @Transactional
    public void syncAllMediaOnStartup() {
        try {
            List<Company> companies = companyRepository.findAll();
            int updatedCompanies = 0;
            for (Company c : companies) {
                String before = c.getLogoUrl();
                String cleanBefore = sanitizeImageUrl(before);
                boolean needsSync = cleanBefore == null
                        || !cleanBefore.contains("res.cloudinary.com")
                        || cleanBefore.contains("images.unsplash.com");
                if (needsSync) {
                    String resolved = ensureCompanyLogo(c);
                    if (resolved != null && !resolved.equals(before)) {
                        companyRepository.save(c);
                        updatedCompanies++;
                    }
                }
            }
            if (updatedCompanies > 0) {
                log.info(">> [BrandMediaSync] Da dong bo & luu Cloud logo cho {} doanh nghiep.", updatedCompanies);
            }

            List<User> users = userRepository.findAll();
            int updatedUsers = 0;
            for (User u : users) {
                String raw = u.getAvatarUrl();
                if (raw == null || raw.isBlank()) continue;
                String trimmed = raw.trim();

                if (trimmed.startsWith("data:image/")) {
                    try {
                        String cloudUrl = fileStorageService.storeDataUrlToCloud(trimmed, "avatars");
                        u.setAvatarUrl(cloudUrl);
                        userRepository.save(u);
                        userCacheService.evict(u.getEmail(), u.getUserId());
                        updatedUsers++;
                    } catch (Exception ex) {
                        log.warn(">> [BrandMediaSync] Khong the migrate avatar data-URI userId={}: {}", u.getUserId(), ex.getMessage());
                    }
                } else if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
                    byte[] localBytes = fileStorageService.loadFileAsBytes(trimmed);
                    if (localBytes != null && localBytes.length > 0) {
                        try {
                            String filename = trimmed.toLowerCase(Locale.ROOT).endsWith(".png") ? "avatar.png" : "avatar.jpg";
                            String cloudUrl = fileStorageService.storeBytesToCloud(
                                    localBytes, filename, "hiremate/avatars/user-" + u.getUserId(), "avatars"
                            );
                            u.setAvatarUrl(cloudUrl);
                            userRepository.save(u);
                            userCacheService.evict(u.getEmail(), u.getUserId());
                            updatedUsers++;
                        } catch (Exception ex) {
                            log.warn(">> [BrandMediaSync] Loi migrate avatar local len Cloud cho userId={}: {}", u.getUserId(), ex.getMessage());
                        }
                    } else {
                        u.setAvatarUrl(null);
                        userRepository.save(u);
                        userCacheService.evict(u.getEmail(), u.getUserId());
                        updatedUsers++;
                    }
                } else if (sanitizeImageUrl(trimmed) == null) {
                    u.setAvatarUrl(null);
                    userRepository.save(u);
                    userCacheService.evict(u.getEmail(), u.getUserId());
                    updatedUsers++;
                }
            }
            if (updatedUsers > 0) {
                log.info(">> [BrandMediaSync] Da don dep / dong bo {} avatar nguoi dung len Cloud.", updatedUsers);
            }
        } catch (Exception ex) {
            log.warn(">> [BrandMediaSync] Bo qua dong bo media khi khoi dong: {}", ex.getMessage());
        }
    }

    private byte[] renderCompanyMonogramPng(String companyName, Long companyId) throws Exception {
        final int size = 512;
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        g.setColor(Color.WHITE);
        g.fillRect(0, 0, size, size);

        Color[][] palettes = {
                {new Color(0x5B48BD), new Color(0x3B2B8E)},
                {new Color(0x2563EB), new Color(0x1D4ED8)},
                {new Color(0x059669), new Color(0x047857)},
                {new Color(0xEA580C), new Color(0xC2410C)},
                {new Color(0x7C3AED), new Color(0x5B21B6)}
        };
        int idx = (int) Math.abs((companyId != null ? companyId : (companyName != null ? companyName.hashCode() : 0)) % palettes.length);
        GradientPaint gp = new GradientPaint(48, 48, palettes[idx][0], 464, 464, palettes[idx][1]);
        g.setPaint(gp);
        g.fill(new RoundRectangle2D.Double(48, 48, 416, 416, 84, 84));

        String initials = extractInitials(companyName);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, initials.length() >= 3 ? 132 : 164));
        FontMetrics fm = g.getFontMetrics();
        int tx = (size - fm.stringWidth(initials)) / 2;
        int ty = (size - fm.getHeight()) / 2 + fm.getAscent() - 10;
        g.drawString(initials, tx, ty);

        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    private String extractInitials(String name) {
        if (name == null || name.isBlank()) return "HM";
        String[] parts = name.trim().replaceAll("[^\\p{L}\\p{N}\\s]", " ").split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) sb.append(Character.toUpperCase(p.charAt(0)));
            if (sb.length() >= 3) break;
        }
        return sb.length() > 0 ? sb.toString() : "HM";
    }
}

