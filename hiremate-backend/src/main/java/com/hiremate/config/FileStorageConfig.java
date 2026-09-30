package com.hiremate.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
@Getter
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${hiremate.upload.dir:D:/hiremate_uploads/}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Path path = Paths.get(uploadDir);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                log.info("Created upload directory at: {}", path.toAbsolutePath());
            } else {
                log.info("Using existing upload directory: {}", path.toAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("Could not create preferred directory {}. Falling back to ./uploads/ in working directory.", uploadDir, e);
            uploadDir = "./uploads/";
            new File(uploadDir).mkdirs();
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose uploaded files safely outside classpath
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(absolutePath);
    }
}
