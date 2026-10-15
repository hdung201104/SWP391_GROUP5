package com.hiremate.dto.response;

import com.hiremate.enums.CvParseStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CvResponse {
    private Long cvId;
    private Long candidateId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Integer fileSizeBytes;
    private CvParseStatus parseStatus;
    private Boolean isDefault;
    private String summary;
    private LocalDateTime createdAt;
    private String headline;
    private Integer experienceYears;
    private String educationsJson;
    private String experiencesJson;
    private String projectsJson;
    private String certificationsJson;
    private String languagesJson;
    private List<String> detectedSkills;
    private String fullName;
    private String phone;
    private String email;
    private String address;
    private String parsedJson;
    private CvParsedDTO parsedData;
    private String parsedText;

    public static CvResponseBuilder builder() {
        return new CvResponseBuilder();
    }

    public static class CvResponseBuilder {
        private Long cvId;
        private Long candidateId;
        private String fileName;
        private String fileUrl;
        private String fileType;
        private Integer fileSizeBytes;
        private CvParseStatus parseStatus;
        private Boolean isDefault;
        private String summary;
        private LocalDateTime createdAt;
        private String headline;
        private Integer experienceYears;
        private String educationsJson;
        private String experiencesJson;
        private String projectsJson;
        private String certificationsJson;
        private String languagesJson;
        private List<String> detectedSkills;
        private String fullName;
        private String phone;
        private String email;
        private String address;
        private String parsedJson;
        private CvParsedDTO parsedData;
        private String parsedText;

        public CvResponseBuilder cvId(Long cvId) { this.cvId = cvId; return this; }
        public CvResponseBuilder candidateId(Long candidateId) { this.candidateId = candidateId; return this; }
        public CvResponseBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public CvResponseBuilder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public CvResponseBuilder fileType(String fileType) { this.fileType = fileType; return this; }
        public CvResponseBuilder fileSizeBytes(Integer fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; return this; }
        public CvResponseBuilder parseStatus(CvParseStatus parseStatus) { this.parseStatus = parseStatus; return this; }
        public CvResponseBuilder isDefault(Boolean isDefault) { this.isDefault = isDefault; return this; }
        public CvResponseBuilder summary(String summary) { this.summary = summary; return this; }
        public CvResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CvResponseBuilder headline(String headline) { this.headline = headline; return this; }
        public CvResponseBuilder experienceYears(Integer experienceYears) { this.experienceYears = experienceYears; return this; }
        public CvResponseBuilder educationsJson(String educationsJson) { this.educationsJson = educationsJson; return this; }
        public CvResponseBuilder experiencesJson(String experiencesJson) { this.experiencesJson = experiencesJson; return this; }
        public CvResponseBuilder projectsJson(String projectsJson) { this.projectsJson = projectsJson; return this; }
        public CvResponseBuilder certificationsJson(String certificationsJson) { this.certificationsJson = certificationsJson; return this; }
        public CvResponseBuilder languagesJson(String languagesJson) { this.languagesJson = languagesJson; return this; }
        public CvResponseBuilder detectedSkills(List<String> detectedSkills) { this.detectedSkills = detectedSkills; return this; }
        public CvResponseBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public CvResponseBuilder phone(String phone) { this.phone = phone; return this; }
        public CvResponseBuilder email(String email) { this.email = email; return this; }
        public CvResponseBuilder address(String address) { this.address = address; return this; }
        public CvResponseBuilder parsedJson(String parsedJson) { this.parsedJson = parsedJson; return this; }
        public CvResponseBuilder parsedData(CvParsedDTO parsedData) { this.parsedData = parsedData; return this; }
        public CvResponseBuilder parsedText(String parsedText) { this.parsedText = parsedText; return this; }

        public CvResponse build() {
            return new CvResponse(
                    cvId, candidateId, fileName, fileUrl, fileType, fileSizeBytes, parseStatus,
                    isDefault, summary, createdAt, headline, experienceYears, educationsJson,
                    experiencesJson, projectsJson, certificationsJson, languagesJson,
                    detectedSkills, fullName, phone, email, address, parsedJson, parsedData, parsedText
            );
        }
    }
}
