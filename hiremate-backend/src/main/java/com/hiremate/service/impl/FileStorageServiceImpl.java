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

    @Override
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        // Limit size to 10MB
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 10MB limit.");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        // Validate allowed extensions
        if (!extension.matches("\\.(pdf|doc|docx|png|jpg|jpeg|mp3|wav|weba)")) {
            throw new IllegalArgumentException("File extension " + extension + " is not permitted.");
        }

        String storedFileName = UUID.randomUUID() + extension;
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
    public void deleteFile(String fileName) {
        try {
            Path filePath = loadFile(fileName);
            Files.deleteIfExists(filePath);
            log.info("Deleted file: {}", filePath.toAbsolutePath());
        } catch (IOException e) {
            log.warn("Could not delete file: {}", fileName, e);
        }
    }
}
