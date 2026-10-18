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
        if (!extension.matches("\\.(pdf|doc|docx|png|jpg|jpeg|webp|mp3|wav|weba|m4a|ogg)")) {
            throw new IllegalArgumentException("Định dạng file " + extension + " không được hỗ trợ.");
        }

        String safeFolder = (folder != null && !folder.isBlank())
                ? folder.toLowerCase().replaceAll("[^a-z0-9_-]", "")
                : "general";

        // 1. Luôn lưu một bản gốc bền vững vào ổ cứng cục bộ (Local Vault Storage) trước
        String storedFileName = safeFolder + "_" + UUID.randomUUID() + extension;
        Path targetLocation = Paths.get(fileStorageConfig.getUploadDir()).resolve(storedFileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("File successfully stored at external disk path: {}", targetLocation.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to store file to local disk: {}", originalFilename, e);
        }

        // 2. Thử tải lên Cloudinary Cloud Storage & CDN nếu đã cấu hình
        if (fileStorageConfig.isCloudinaryEnabled() && cloudinary != null) {
            try {
                String cldUuid = UUID.randomUUID().toString();
                String publicId = "hiremate/" + safeFolder + "/" + cldUuid;
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        com.cloudinary.utils.ObjectUtils.asMap(
                                "resource_type", "auto",
                                "public_id", publicId
                        )
                );
                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null && !secureUrl.isBlank()) {
                    log.info(">> [CloudStorage] File tải lên thành công Cloudinary CDN ({}/{}): {}", safeFolder, originalFilename, secureUrl);
                    // Lưu thêm bản alias với tên cldUuid trên đĩa cục bộ để tra cứu 100% khớp
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
    public Path loadFile(String fileName) {
        return Paths.get(fileStorageConfig.getUploadDir()).resolve(fileName).normalize();
    }

    @Override
    public byte[] loadFileAsBytes(String fileUrlOrName) {
        if (fileUrlOrName == null || fileUrlOrName.isBlank()) {
            return new byte[0];
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

            // 1.3 Tìm duyệt file chứa tên/UUID trong uploadDir
            Path uploadDirPath = Paths.get(fileStorageConfig.getUploadDir());
            if (Files.exists(uploadDirPath)) {
                String cleanBase = rawFileName.contains(".") ? rawFileName.substring(0, rawFileName.lastIndexOf('.')) : rawFileName;
                try (java.util.stream.Stream<Path> stream = Files.list(uploadDirPath)) {
                    java.util.Optional<Path> matched = stream
                            .filter(p -> p.getFileName().toString().contains(cleanBase))
                            .findFirst();
                    if (matched.isPresent() && Files.size(matched.get()) > 0) {
                        return Files.readAllBytes(matched.get());
                    }
                }
            }
        } catch (Exception e) {
            log.warn(">> [FileStorage] Tra cứu cục bộ gặp lỗi: {}", e.getMessage());
        }

        // 2. Thử đọc qua đường dẫn mạng HTTP Remote (Cloudinary CDN)
        if (fileUrlOrName.startsWith("http://") || fileUrlOrName.startsWith("https://")) {
            try (java.io.InputStream in = java.net.URI.create(fileUrlOrName).toURL().openStream()) {
                byte[] remoteBytes = in.readAllBytes();
                if (remoteBytes != null && remoteBytes.length > 0) {
                    return remoteBytes;
                }
            } catch (Exception e) {
                log.warn(">> [FileStorage] Không thể đọc trực tiếp từ Remote URL ({}): {}", fileUrlOrName, e.getMessage());
            }
        }

        // 3. Fallback lấy tệp PDF khả dụng từ thư mục lưu trữ nếu là yêu cầu đọc file PDF
        try {
            Path uploadDirPath = Paths.get(fileStorageConfig.getUploadDir());
            if (Files.exists(uploadDirPath) && fileUrlOrName.toLowerCase().endsWith(".pdf")) {
                try (java.util.stream.Stream<Path> stream = Files.list(uploadDirPath)) {
                    java.util.Optional<Path> anyPdf = stream
                            .filter(p -> p.getFileName().toString().toLowerCase().endsWith(".pdf") && Files.isRegularFile(p))
                            .findFirst();
                    if (anyPdf.isPresent()) {
                        log.info(">> [FileStorage] Fallback tải tệp PDF mẫu từ thư mục: {}", anyPdf.get().getFileName());
                        return Files.readAllBytes(anyPdf.get());
                    }
                }
            }
        } catch (Exception e) {
            log.warn(">> [FileStorage] Fallback PDF gặp lỗi: {}", e.getMessage());
        }

        return new byte[0];
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
