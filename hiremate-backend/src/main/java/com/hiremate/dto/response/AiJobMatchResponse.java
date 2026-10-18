package com.hiremate.dto.response;

import com.hiremate.enums.EmploymentType;
import com.hiremate.enums.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiJobMatchResponse {
    private Long matchId;
    private Long candidateId;
    private String candidateName;
    private Long jobId;
    private String jobTitle;
    private Long cvId;
    private Float matchingScore;
    private List<String> matchedMandatorySkills;
    private List<String> missingMandatorySkills;
    private List<String> matchedPreferredSkills;
    private List<String> missingPreferredSkills;
    private String aiReasoning;
    private MatchStatus status;
    private String companyName;
    private String location;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private EmploymentType employmentType;
    private Float skillsScore;
    private Float experienceScore;
    private Float educationScore;
    private Float semanticScore;
    private String matchingFormula;

    public static AiJobMatchResponseBuilder builder() {
        return new AiJobMatchResponseBuilder();
    }

    public static class AiJobMatchResponseBuilder {
        private Long matchId;
        private Long candidateId;
        private String candidateName;
        private Long jobId;
        private String jobTitle;
        private Long cvId;
        private Float matchingScore;
        private List<String> matchedMandatorySkills;
        private List<String> missingMandatorySkills;
        private List<String> matchedPreferredSkills;
        private List<String> missingPreferredSkills;
        private String aiReasoning;
        private MatchStatus status;
        private String companyName;
        private String location;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private EmploymentType employmentType;

        public AiJobMatchResponseBuilder matchId(Long matchId) {
            this.matchId = matchId;
            return this;
        }

        public AiJobMatchResponseBuilder candidateId(Long candidateId) {
            this.candidateId = candidateId;
            return this;
        }

        public AiJobMatchResponseBuilder candidateName(String candidateName) {
            this.candidateName = candidateName;
            return this;
        }

        public AiJobMatchResponseBuilder jobId(Long jobId) {
            this.jobId = jobId;
            return this;
        }

        public AiJobMatchResponseBuilder jobTitle(String jobTitle) {
            this.jobTitle = jobTitle;
            return this;
        }

        public AiJobMatchResponseBuilder cvId(Long cvId) {
            this.cvId = cvId;
            return this;
        }

        public AiJobMatchResponseBuilder matchingScore(Float matchingScore) {
            this.matchingScore = matchingScore;
            return this;
        }

        public AiJobMatchResponseBuilder matchedMandatorySkills(List<String> matchedMandatorySkills) {
            this.matchedMandatorySkills = matchedMandatorySkills;
            return this;
        }

        public AiJobMatchResponseBuilder missingMandatorySkills(List<String> missingMandatorySkills) {
            this.missingMandatorySkills = missingMandatorySkills;
            return this;
        }

        public AiJobMatchResponseBuilder matchedPreferredSkills(List<String> matchedPreferredSkills) {
            this.matchedPreferredSkills = matchedPreferredSkills;
            return this;
        }

        public AiJobMatchResponseBuilder missingPreferredSkills(List<String> missingPreferredSkills) {
            this.missingPreferredSkills = missingPreferredSkills;
            return this;
        }

        public AiJobMatchResponseBuilder aiReasoning(String aiReasoning) {
            this.aiReasoning = aiReasoning;
            return this;
        }

        public AiJobMatchResponseBuilder status(MatchStatus status) {
            this.status = status;
            return this;
        }

        public AiJobMatchResponseBuilder companyName(String companyName) {
            this.companyName = companyName;
            return this;
        }

        public AiJobMatchResponseBuilder location(String location) {
            this.location = location;
            return this;
        }

        public AiJobMatchResponseBuilder salaryMin(BigDecimal salaryMin) {
            this.salaryMin = salaryMin;
            return this;
        }

        public AiJobMatchResponseBuilder salaryMax(BigDecimal salaryMax) {
            this.salaryMax = salaryMax;
            return this;
        }

        public AiJobMatchResponseBuilder employmentType(EmploymentType employmentType) {
            this.employmentType = employmentType;
            return this;
        }

        private Float skillsScore;
        private Float experienceScore;
        private Float educationScore;
        private Float semanticScore;
        private String matchingFormula;

        public AiJobMatchResponseBuilder skillsScore(Float skillsScore) {
            this.skillsScore = skillsScore;
            return this;
        }

        public AiJobMatchResponseBuilder experienceScore(Float experienceScore) {
            this.experienceScore = experienceScore;
            return this;
        }

        public AiJobMatchResponseBuilder educationScore(Float educationScore) {
            this.educationScore = educationScore;
            return this;
        }

        public AiJobMatchResponseBuilder semanticScore(Float semanticScore) {
            this.semanticScore = semanticScore;
            return this;
        }

        public AiJobMatchResponseBuilder matchingFormula(String matchingFormula) {
            this.matchingFormula = matchingFormula;
            return this;
        }

        public AiJobMatchResponse build() {
            return new AiJobMatchResponse(
                    matchId, candidateId, candidateName, jobId, jobTitle, cvId, matchingScore,
                    matchedMandatorySkills, missingMandatorySkills, matchedPreferredSkills, missingPreferredSkills,
                    aiReasoning, status, companyName, location, salaryMin, salaryMax, employmentType,
                    skillsScore, experienceScore, educationScore, semanticScore, matchingFormula
            );
        }
    }
}
