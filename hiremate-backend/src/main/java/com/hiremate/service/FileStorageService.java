package com.hiremate.service;

import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

public interface FileStorageService {
    String storeFile(MultipartFile file);
    String storeFile(MultipartFile file, String folder);
    String storeDataUrlToCloud(String dataUrl, String folder);
    String storeBytesToCloud(byte[] bytes, String filename, String publicIdOverride, String folder);
    Path loadFile(String fileName);
    byte[] loadFileAsBytes(String fileUrlOrName);
    void deleteFile(String fileName);
}
