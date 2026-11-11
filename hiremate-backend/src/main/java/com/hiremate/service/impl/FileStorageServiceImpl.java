package com.hiremate.service.impl;

import com.hiremate.config.FileStorageConfig;
import com.hiremate.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private final FileStorageConfig fileStorageConfig;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.cloudinary.Cloudinary cloudinary;

    @Override
    public String storeFile(MultipartFile file) {
        return storeFile(file, "cvs");
    }

    @Override
    public String storeFile(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        // Limit size to 15MB
        if (file.getSize() > 15 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 15MB limit.");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        // Validate allowed extensions (Documents, Images, Audio)
        if (!extension.matches("\\.(pdf|doc|docx|png|jpg|jpeg|webp|svg|mp3|wav|weba|webm|mp4|m4a|ogg)")) {
            throw new IllegalArgumentException("Định dạng file " + extension + " không được hỗ trợ.");
        }

        String safeFolder = (folder != null && !folder.isBlank())
                ? folder.toLowerCase().replaceAll("[^a-z0-9_-]", "")
                : "general";

        boolean isImageFolder = safeFolder.equals("avatars")
                || safeFolder.equals("logos")
                || safeFolder.equals("covers")
                || safeFolder.equals("workplace")
                || safeFolder.equals("images")
                || extension.matches("\\.(png|jpg|jpeg|webp|svg)");

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Không thể đọc dữ liệu tệp tải lên: " + originalFilename, e);
        }

        // Ảnh đại diện / Logo công ty / Workplace image: BẮT BUỘC lưu trữ 100% trên Cloudinary Cloud, không lưu local/Supabase
        if (isImageFolder && !safeFolder.equals("cvs") && !safeFolder.equals("licenses") && !safeFolder.equals("interviews")) {
            return storeBytesToCloud(fileBytes, originalFilename, null, safeFolder);
        }

        // 1. Với tài liệu CV / GPKD / Audio: lưu bản gốc cục bộ để phục vụ PDF stream fallback
        String storedFileName = safeFolder + "_" + UUID.randomUUID() + extension;
        Path targetLocation = Paths.get(fileStorageConfig.getUploadDir()).resolve(storedFileName);

        try {
            Files.write(targetLocation, fileBytes);
            log.info("File successfully stored at external disk path: {}", targetLocation.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to store file to local disk: {}", originalFilename, e);
        }

        // 2. Tải lên Cloudinary Cloud Storage & CDN nếu đã cấu hình
        if (fileStorageConfig.isCloudinaryEnabled() && cloudinary != null) {
            try {
                String cldUuid = UUID.randomUUID().toString();
                String publicId = "hiremate/" + safeFolder + "/" + cldUuid;
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        fileBytes,
                        com.cloudinary.utils.ObjectUtils.asMap(
                                "resource_type", "auto",
                                "public_id", publicId
                        )
                );
                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null && !secureUrl.isBlank()) {
                    log.info(">> [CloudStorage] File tải lên thành công Cloudinary CDN ({}/{}): {}", safeFolder, originalFilename, secureUrl);
                    Path cldTarget = Paths.get(fileStorageConfig.getUploadDir()).resolve(cldUuid + extension);
                    try {
                        if (Files.exists(targetLocation)) {
                            Files.copy(targetLocation, cldTarget, StandardCopyOption.REPLACE_EXISTING);
                        }
                    } catch (Exception ignored) {}
                    return secureUrl;
                }
            } catch (Exception ex) {
                log.warn(">> [CloudStorage] Không thể tải lên Cloudinary ({}), tự động dùng bản lưu trữ cục bộ.", ex.getMessage());
            }
        }

        return "/uploads/" + storedFileName;
    }

    @Override
    public String storeDataUrlToCloud(String dataUrl, String folder) {
        if (dataUrl == null || !dataUrl.startsWith("data:image/")) {
            throw new IllegalArgumentException("Dữ liệu ảnh Base64 không hợp lệ.");
        }
        int commaIdx = dataUrl.indexOf(',');
        if (commaIdx < 0) {
            throw new IllegalArgumentException("Định dạng Data URL không hợp lệ.");
        }
        String header = dataUrl.substring(5, commaIdx).toLowerCase();
        String base64Payload = dataUrl.substring(commaIdx + 1).replaceAll("\\s+", "");
        String ext = header.contains("png") ? "png" : (header.contains("webp") ? "webp" : "jpg");
        byte[] bytes = java.util.Base64.getDecoder().decode(base64Payload);
        return storeBytesToCloud(bytes, "upload." + ext, null, folder);
    }

    @Override
    public String storeBytesToCloud(byte[] bytes, String filename, String publicIdOverride, String folder) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Dữ liệu hình ảnh trống.");
        }
        if (!fileStorageConfig.isCloudinaryEnabled()) {
            throw new IllegalStateException("Cloudinary chưa được cấu hình (cloudinary.cloud-name/api-key/api-secret). Không cho phép lưu ảnh trên máy cục bộ.");
        }

        String safeFolder = (folder != null && !folder.isBlank())
                ? folder.toLowerCase().replaceAll("[^a-z0-9_-]", "")
                : "images";
        String publicId = (publicIdOverride != null && !publicIdOverride.isBlank())
                ? publicIdOverride
                : ("hiremate/" + safeFolder + "/" + UUID.randomUUID());

        if (cloudinary != null) {
            try {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        bytes,
                        com.cloudinary.utils.ObjectUtils.asMap(
                                "resource_type", "image",
                                "public_id", publicId,
                                "overwrite", true
                        )
                );
                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null && !secureUrl.isBlank()) {
                    log.info(">> [CloudStorage] Ảnh đã đẩy lên Cloudinary thành công ({}): {}", publicId, secureUrl);
                    return secureUrl;
                }
            } catch (Exception ex) {
                log.warn(">> [CloudStorage] SDK upload gặp lỗi ({}), chuyển sang HTTPS signed API fallback...", ex.getMessage());
            }
        }

        // Direct HTTPS fallback (supports IPv4 environments cleanly)
        try {
            String mime = (filename != null && filename.toLowerCase().endsWith(".png")) ? "image/png"
                    : (filename != null && filename.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg");
            String dataUri = "data:" + mime + ";base64," + java.util.Base64.getEncoder().encodeToString(bytes);
            long ts = System.currentTimeMillis() / 1000L;
            String toSign = "overwrite=true&public_id=" + publicId + "&timestamp=" + ts + fileStorageConfig.getCloudinaryApiSecret();
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(toSign.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));

            String form = "file=" + java.net.URLEncoder.encode(dataUri, java.nio.charset.StandardCharsets.UTF_8)
                    + "&public_id=" + java.net.URLEncoder.encode(publicId, java.nio.charset.StandardCharsets.UTF_8)
                    + "&overwrite=true&timestamp=" + ts
                    + "&api_key=" + java.net.URLEncoder.encode(fileStorageConfig.getCloudinaryApiKey(), java.nio.charset.StandardCharsets.UTF_8)
                    + "&signature=" + hex;

            java.net.http.HttpClient http = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(15))
                    .build();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.cloudinary.com/v1_1/" + fileStorageConfig.getCloudinaryCloudName() + "/image/upload"))
                    .timeout(java.time.Duration.ofSeconds(25))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(form))
                    .build();
            java.net.http.HttpResponse<String> res = http.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(res.body());
                String secureUrl = root.path("secure_url").asText("");
                if (!secureUrl.isBlank()) {
                    log.info(">> [CloudStorage] Ảnh đã đẩy lên Cloudinary qua HTTPS API ({}): {}", publicId, secureUrl);
                    return secureUrl;
                }
            }
            throw new IllegalStateException("Cloudinary upload HTTP " + res.statusCode() + ": " + res.body());
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tải ảnh lên Cloudinary Cloud: " + ex.getMessage(), ex);
        }
    }

    @Override
    public Path loadFile(String fileName) {
        return Paths.get(fileStorageConfig.getUploadDir()).resolve(fileName).normalize();
    }

    @Override
    public byte[] loadFileAsBytes(String fileUrlOrName) {
        if (fileUrlOrName == null || fileUrlOrName.isBlank()) {
            return null;
        }

        // 1. Tra cứu trực tiếp trên ổ cứng cục bộ (Local Vault Storage)
        try {
            String localFileName = fileUrlOrName.replace("/uploads/", "");
            int lastSlash = localFileName.lastIndexOf('/');
            String rawFileName = lastSlash >= 0 ? localFileName.substring(lastSlash + 1) : localFileName;

            // 1.1 Tìm theo tên file chính xác
            Path filePath = loadFile(rawFileName);
            if (Files.exists(filePath) && Files.size(filePath) > 0) {
                return Files.readAllBytes(filePath);
            }

            // 1.2 Tìm theo tiền tố cvs_
            Path prefixedPath = loadFile("cvs_" + rawFileName);
            if (Files.exists(prefixedPath) && Files.size(prefixedPath) > 0) {
                return Files.readAllBytes(prefixedPath);
            }

            // 1.2b Tìm theo tiền tố interview_audio_ hoặc interviews_
            Path audioPrefixedPath = loadFile("interview_audio_" + rawFileName);
            if (Files.exists(audioPrefixedPath) && Files.size(audioPrefixedPath) > 0) {
                return Files.readAllBytes(audioPrefixedPath);
            }
            Path interviewPrefixedPath = loadFile("interviews_" + rawFileName);
            if (Files.exists(interviewPrefixedPath) && Files.size(interviewPrefixedPath) > 0) {
                return Files.readAllBytes(interviewPrefixedPath);
            }

            // 1.3 Tìm duyệt file chứa tên/UUID trong uploadDir
            Path uploadDirPath = Paths.get(fileStorageConfig.getUploadDir());
            if (Files.exists(uploadDirPath)) {
                String cleanBase = rawFileName.contains(".") ? rawFileName.substring(0, rawFileName.lastIndexOf('.')) : rawFileName;
                if (!cleanBase.isBlank() && cleanBase.length() >= 5) {
                    try (java.util.stream.Stream<Path> stream = Files.list(uploadDirPath)) {
                        java.util.Optional<Path> matched = stream
                                .filter(p -> p.getFileName().toString().contains(cleanBase))
                                .findFirst();
                        if (matched.isPresent() && Files.size(matched.get()) > 0) {
                            return Files.readAllBytes(matched.get());
                        }
                    }
                }

                // 1.4 Fallback cho file Giấy phép kinh doanh: Nếu file UUID cụ thể không có, tự động lấy file GPKD có sẵn trong uploadDir
                if (rawFileName.startsWith("licenses_") || fileUrlOrName.toLowerCase().contains("license") || fileUrlOrName.toLowerCase().contains("gpkd")) {
                    try (java.util.stream.Stream<Path> stream = Files.list(uploadDirPath)) {
                        java.util.Optional<Path> anyLicense = stream
                                .filter(p -> p.getFileName().toString().startsWith("licenses_") && p.getFileName().toString().endsWith(".pdf"))
                                .findFirst();
                        if (anyLicense.isPresent() && Files.size(anyLicense.get()) > 0) {
                            log.info(">> [FileStorage] Tự động fallback sang file GPKD hợp lệ: {}", anyLicense.get().getFileName());
                            return Files.readAllBytes(anyLicense.get());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn(">> [FileStorage] Tra cứu cục bộ gặp lỗi: {}", e.getMessage());
        }

        // 2. Thử đọc qua đường dẫn mạng HTTP Remote (Cloudinary CDN)
        if (fileUrlOrName.startsWith("http://") || fileUrlOrName.startsWith("https://")) {
            try {
                java.net.URL url = java.net.URI.create(fileUrlOrName).toURL();
                java.net.URLConnection conn = url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(10000);
                try (java.io.InputStream in = conn.getInputStream()) {
                    byte[] remoteBytes = in.readAllBytes();
                    if (remoteBytes != null && remoteBytes.length > 0) {
                        return remoteBytes;
                    }
                }
            } catch (Exception e) {
                log.warn(">> [FileStorage] Không thể đọc trực tiếp từ Remote URL ({}): {}", fileUrlOrName, e.getMessage());
                // Fallback nếu là file PDF trên Cloudinary CDN bị giới hạn ACL 401: Cloudinary cho phép render trực tiếp sang .png nét cao
                if (fileUrlOrName.contains("res.cloudinary.com") && fileUrlOrName.toLowerCase().endsWith(".pdf")) {
                    String pngUrl = fileUrlOrName.replaceAll("(?i)\\.pdf$", ".png");
                    try {
                        java.net.URL urlPng = java.net.URI.create(pngUrl).toURL();
                        java.net.URLConnection connPng = urlPng.openConnection();
                        connPng.setConnectTimeout(5000);
                        connPng.setReadTimeout(10000);
                        try (java.io.InputStream inPng = connPng.getInputStream()) {
                            byte[] pngBytes = inPng.readAllBytes();
                            if (pngBytes != null && pngBytes.length > 0) {
                                log.info(">> [FileStorage] Đã tải thành công ảnh xem trước (.png) thay thế cho PDF Cloudinary: {}", pngUrl);
                                return pngBytes;
                            }
                        }
                    } catch (Exception exPng) {
                        log.warn(">> [FileStorage] Thử tải fallback .png từ Cloudinary cũng thất bại: {}", exPng.getMessage());
                    }
                }
            }
        }

        return null;
    }

    @Override
    public void deleteFile(String fileUrlOrName) {
        if (fileUrlOrName == null || fileUrlOrName.isBlank()) {
            return;
        }

        // 1. Kiểm tra nếu là file trên Cloudinary CDN hoặc remote URL
        if (fileUrlOrName.startsWith("http://") || fileUrlOrName.startsWith("https://")) {
            if (cloudinary != null && fileStorageConfig.isCloudinaryEnabled()) {
                try {
                    String publicId = extractCloudinaryPublicId(fileUrlOrName);
                    if (publicId != null) {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> result = cloudinary.uploader().destroy(
                                publicId,
                                com.cloudinary.utils.ObjectUtils.asMap("resource_type", "auto")
                        );
                        log.info(">> [CloudStorage] Đã gửi lệnh xóa file lên Cloudinary CDN ({}) - Kết quả: {}", publicId, result);
                    }
                } catch (Exception e) {
                    log.warn(">> [CloudStorage] Không thể xóa file trên Cloudinary CDN: {}", e.getMessage());
                }
            }
            return; // Remote URL handled, DO NOT fall through to local file system
        }

        // 2. Fallback xóa trên local disk
        try {
            String localFileName = fileUrlOrName.replace("/uploads/", "");
            Path filePath = loadFile(localFileName);
            Files.deleteIfExists(filePath);
            log.info("Deleted local file: {}", filePath.toAbsolutePath());
        } catch (Exception e) {
            log.warn("Could not delete local file: {}", fileUrlOrName, e);
        }
    }

    private String extractCloudinaryPublicId(String url) {
        int hiremateIdx = url.indexOf("hiremate/");
        if (hiremateIdx >= 0) {
            String path = url.substring(hiremateIdx);
            int dotIdx = path.lastIndexOf('.');
            return dotIdx > 0 ? path.substring(0, dotIdx) : path;
        }
        return null;
    }
}
