package com.hiremate.dto.response;

import com.hiremate.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private Long applicationId;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private Long cvId;
    private String cvUrl;
    private ApplicationStatus status;
    private String coverLetter;
    private Float matchingScore;
    private LocalDateTime createdAt;

    public static ApplicationResponseBuilder builder() {
        return new ApplicationResponseBuilder();
    }

    public static class ApplicationResponseBuilder {
        private Long applicationId;
        private Long jobId;
        private String jobTitle;
        private String companyName;
        private Long candidateId;
        private String candidateName;
        private String candidateEmail;
        private Long cvId;
        private String cvUrl;
        private ApplicationStatus status;
        private String coverLetter;
        private Float matchingScore;
        private LocalDateTime createdAt;

        public ApplicationResponseBuilder applicationId(Long applicationId) {
            this.applicationId = applicationId;
            return this;
        }

        public ApplicationResponseBuilder jobId(Long jobId) {
            this.jobId = jobId;
            return this;
        }

        public ApplicationResponseBuilder jobTitle(String jobTitle) {
            this.jobTitle = jobTitle;
            return this;
        }

        public ApplicationResponseBuilder companyName(String companyName) {
            this.companyName = companyName;
            return this;
        }

        public ApplicationResponseBuilder candidateId(Long candidateId) {
            this.candidateId = candidateId;
            return this;
        }

        public ApplicationResponseBuilder candidateName(String candidateName) {
            this.candidateName = candidateName;
            return this;
        }

        public ApplicationResponseBuilder candidateEmail(String candidateEmail) {
            this.candidateEmail = candidateEmail;
            return this;
        }

        public ApplicationResponseBuilder cvId(Long cvId) {
            this.cvId = cvId;
            return this;
        }

        public ApplicationResponseBuilder cvUrl(String cvUrl) {
            this.cvUrl = cvUrl;
            return this;
        }

        public ApplicationResponseBuilder status(ApplicationStatus status) {
            this.status = status;
            return this;
        }

        public ApplicationResponseBuilder coverLetter(String coverLetter) {
            this.coverLetter = coverLetter;
            return this;
        }

        public ApplicationResponseBuilder matchingScore(Float matchingScore) {
            this.matchingScore = matchingScore;
            return this;
        }

        public ApplicationResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ApplicationResponse build() {
            return new ApplicationResponse(
                    applicationId, jobId, jobTitle, companyName, candidateId,
                    candidateName, candidateEmail, cvId, cvUrl, status,
                    coverLetter, matchingScore, createdAt
            );
        }
    }
}
