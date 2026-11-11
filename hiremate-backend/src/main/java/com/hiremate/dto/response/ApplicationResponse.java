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
    private Long companyId;
    private String companyName;
    private String companyLogo;
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
    private Float skillsScore;
    private Float experienceScore;
    private Float educationScore;
    private Float semanticScore;
    private String evaluationNotes;
    private String notes;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private String jobStatus;
    private String companyStatus;
    private Boolean companyVerified;
    private Boolean companyBlocked;
    private String companyRejectionReason;
    private Boolean jobClosed;

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
        private Long companyId;
        private String companyName;
        private String companyLogo;
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
        private Float skillsScore;
        private Float experienceScore;
        private Float educationScore;
        private Float semanticScore;
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

        public ApplicationResponseBuilder companyId(Long companyId) {
            this.companyId = companyId;
            return this;
        }

        public ApplicationResponseBuilder companyName(String companyName) {
            this.companyName = companyName;
            return this;
        }

        public ApplicationResponseBuilder companyLogo(String companyLogo) {
            this.companyLogo = companyLogo;
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

        public ApplicationResponseBuilder skillsScore(Float skillsScore) {
            this.skillsScore = skillsScore;
            return this;
        }

        public ApplicationResponseBuilder experienceScore(Float experienceScore) {
            this.experienceScore = experienceScore;
            return this;
        }

        public ApplicationResponseBuilder educationScore(Float educationScore) {
            this.educationScore = educationScore;
            return this;
        }

        public ApplicationResponseBuilder semanticScore(Float semanticScore) {
            this.semanticScore = semanticScore;
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

        private String jobStatus;
        private String companyStatus;
        private Boolean companyVerified;
        private Boolean companyBlocked;
        private String companyRejectionReason;
        private Boolean jobClosed;

        public ApplicationResponseBuilder jobStatus(String jobStatus) {
            this.jobStatus = jobStatus;
            return this;
        }

        public ApplicationResponseBuilder companyStatus(String companyStatus) {
            this.companyStatus = companyStatus;
            return this;
        }

        public ApplicationResponseBuilder companyVerified(Boolean companyVerified) {
            this.companyVerified = companyVerified;
            return this;
        }

        public ApplicationResponseBuilder companyBlocked(Boolean companyBlocked) {
            this.companyBlocked = companyBlocked;
            return this;
        }

        public ApplicationResponseBuilder companyRejectionReason(String companyRejectionReason) {
            this.companyRejectionReason = companyRejectionReason;
            return this;
        }

        public ApplicationResponseBuilder jobClosed(Boolean jobClosed) {
            this.jobClosed = jobClosed;
            return this;
        }

        public ApplicationResponse build() {
            return new ApplicationResponse(
                    applicationId, jobId, jobTitle, companyId, companyName, companyLogo, candidateId,
                    candidateName, candidateEmail, candidatePhone, candidateAvatar, withdrawnByCandidate, offerDeclinedByCandidate,
                    recruiterId, recruiterName, recruiterEmail,
                    cvId, cvUrl, status, coverLetter, matchingScore,
                    skillsScore, experienceScore, educationScore, semanticScore,
                    evaluationNotes, notes, rejectionReason, createdAt,
                    jobStatus, companyStatus, companyVerified, companyBlocked, companyRejectionReason, jobClosed
            );
        }
    }
}
