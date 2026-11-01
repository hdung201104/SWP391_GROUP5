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
    private String candidatePhone;
    private String candidateAvatar;
    private Boolean withdrawnByCandidate;
    private Boolean offerDeclinedByCandidate;
    private Long recruiterId;
    private String recruiterName;
    private String recruiterEmail;
    private Long cvId;
    private String cvUrl;
    private ApplicationStatus status;
    private String coverLetter;
    private Float matchingScore;
    private String evaluationNotes;
    private String notes;
    private String rejectionReason;
    private LocalDateTime createdAt;

    public String getNotes() {
        return notes != null ? notes : evaluationNotes;
    }

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
        private String candidatePhone;
        private String candidateAvatar;
        private Boolean withdrawnByCandidate;
        private Boolean offerDeclinedByCandidate;
        private Long recruiterId;
        private String recruiterName;
        private String recruiterEmail;
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

        public ApplicationResponseBuilder candidatePhone(String candidatePhone) {
            this.candidatePhone = candidatePhone;
            return this;
        }

        public ApplicationResponseBuilder candidateAvatar(String candidateAvatar) {
            this.candidateAvatar = candidateAvatar;
            return this;
        }

        public ApplicationResponseBuilder withdrawnByCandidate(Boolean withdrawnByCandidate) {
            this.withdrawnByCandidate = withdrawnByCandidate;
            return this;
        }

        public ApplicationResponseBuilder offerDeclinedByCandidate(Boolean offerDeclinedByCandidate) {
            this.offerDeclinedByCandidate = offerDeclinedByCandidate;
            return this;
        }

        public ApplicationResponseBuilder recruiterId(Long recruiterId) {
            this.recruiterId = recruiterId;
            return this;
        }

        public ApplicationResponseBuilder recruiterName(String recruiterName) {
            this.recruiterName = recruiterName;
            return this;
        }

        public ApplicationResponseBuilder recruiterEmail(String recruiterEmail) {
            this.recruiterEmail = recruiterEmail;
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

        private String evaluationNotes;
        private String notes;
        private String rejectionReason;

        public ApplicationResponseBuilder evaluationNotes(String evaluationNotes) {
            this.evaluationNotes = evaluationNotes;
            this.notes = evaluationNotes;
            return this;
        }

        public ApplicationResponseBuilder notes(String notes) {
            this.notes = notes;
            this.evaluationNotes = notes;
            return this;
        }

        public ApplicationResponseBuilder rejectionReason(String rejectionReason) {
            this.rejectionReason = rejectionReason;
            return this;
        }

        public ApplicationResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ApplicationResponse build() {
            return new ApplicationResponse(
                    applicationId, jobId, jobTitle, companyName, candidateId,
                    candidateName, candidateEmail, candidatePhone, candidateAvatar, withdrawnByCandidate, offerDeclinedByCandidate,
                    recruiterId, recruiterName, recruiterEmail,
                    cvId, cvUrl, status, coverLetter, matchingScore,
                    evaluationNotes, notes, rejectionReason, createdAt
            );
        }
    }
}
