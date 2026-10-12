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

        // 1. Thử tải lên Cloudinary Cloud Storage & CDN nếu đã cấu hình
        if (fileStorageConfig.isCloudinaryEnabled() && cloudinary != null) {
            try {
                String publicId = "hiremate/" + safeFolder + "/" + UUID.randomUUID();
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
                    return secureUrl;
                }
            } catch (Exception ex) {
                log.warn(">> [CloudStorage] Không thể tải lên Cloudinary ({}), tự động fallback sang lưu trữ cục bộ.", ex.getMessage());
            }
        }

        // 2. Fallback sang lưu trữ ổ cứng cục bộ (Local Disk Storage)
        String storedFileName = safeFolder + "_" + UUID.randomUUID() + extension;
        Path targetLocation = Paths.get(fileStorageConfig.getUploadDir()).resolve(storedFileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("File successfully stored at external disk path: {}", targetLocation.toAbsolutePath());
            return "/uploads/" + storedFileName;
        } catch (IOException e) {
            log.error("Failed to store file: {}", originalFilename, e);
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", e);
        }
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
        try {
            if (fileUrlOrName.startsWith("http://") || fileUrlOrName.startsWith("https://")) {
                try (java.io.InputStream in = java.net.URI.create(fileUrlOrName).toURL().openStream()) {
                    return in.readAllBytes();
                }
            }
            String localFileName = fileUrlOrName.replace("/uploads/", "");
            Path filePath = loadFile(localFileName);
            if (Files.exists(filePath)) {
                return Files.readAllBytes(filePath);
            }
        } catch (Exception e) {
            log.warn(">> [FileStorage] Không thể đọc dữ liệu nhị phân file {}: {}", fileUrlOrName, e.getMessage());
        }
        return new byte[0];
    }

    @Override
    public void deleteFile(String fileUrlOrName) {
        if (fileUrlOrName == null || fileUrlOrName.isBlank()) {
            return;
        }

        // 1. Kiểm tra nếu là file trên Cloudinary CDN
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
                        return;
                    }
                } catch (Exception e) {
                    log.warn(">> [CloudStorage] Không thể xóa file trên Cloudinary CDN: {}", e.getMessage());
                }
            }
        }

        // 2. Fallback xóa trên local disk
        String localFileName = fileUrlOrName.replace("/uploads/", "");
        try {
            Path filePath = loadFile(localFileName);
            Files.deleteIfExists(filePath);
            log.info("Deleted local file: {}", filePath.toAbsolutePath());
        } catch (IOException e) {
            log.warn("Could not delete local file: {}", localFileName, e);
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
