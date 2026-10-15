package com.hiremate.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiCvAnalysis {
    private String candidateName;
    private String headline;
    private String phone;
    private String email;
    private String address;
    private Integer yearsOfExperience;
    private List<String> skills;
    private List<String> topSkills;
    private String educationsJson;
    private String experiencesJson;
    private String projectsJson;
    private String certificationsJson;
    private String languagesJson;
    private String summary;
    private List<String> suggestedRoles;
    private String improvementAdvice;
    private String rawJson;

    public static AiCvAnalysisBuilder builder() {
        return new AiCvAnalysisBuilder();
    }

    public static class AiCvAnalysisBuilder {
        private String candidateName;
        private String headline;
        private String phone;
        private String email;
        private String address;
        private Integer yearsOfExperience;
        private List<String> skills;
        private List<String> topSkills;
        private String educationsJson;
        private String experiencesJson;
        private String projectsJson;
        private String certificationsJson;
        private String languagesJson;
        private String summary;
        private List<String> suggestedRoles;
        private String improvementAdvice;
        private String rawJson;

        public AiCvAnalysisBuilder candidateName(String candidateName) {
            this.candidateName = candidateName;
            return this;
        }

        public AiCvAnalysisBuilder headline(String headline) {
            this.headline = headline;
            return this;
        }

        public AiCvAnalysisBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public AiCvAnalysisBuilder email(String email) {
            this.email = email;
            return this;
        }

        public AiCvAnalysisBuilder address(String address) {
            this.address = address;
            return this;
        }

        public AiCvAnalysisBuilder yearsOfExperience(Integer yearsOfExperience) {
            this.yearsOfExperience = yearsOfExperience;
            return this;
        }

        public AiCvAnalysisBuilder skills(List<String> skills) {
            this.skills = skills;
            return this;
        }

        public AiCvAnalysisBuilder topSkills(List<String> topSkills) {
            this.topSkills = topSkills;
            return this;
        }

        public AiCvAnalysisBuilder educationsJson(String educationsJson) {
            this.educationsJson = educationsJson;
            return this;
        }

        public AiCvAnalysisBuilder experiencesJson(String experiencesJson) {
            this.experiencesJson = experiencesJson;
            return this;
        }

        public AiCvAnalysisBuilder projectsJson(String projectsJson) {
            this.projectsJson = projectsJson;
            return this;
        }

        public AiCvAnalysisBuilder certificationsJson(String certificationsJson) {
            this.certificationsJson = certificationsJson;
            return this;
        }

        public AiCvAnalysisBuilder languagesJson(String languagesJson) {
            this.languagesJson = languagesJson;
            return this;
        }

        public AiCvAnalysisBuilder summary(String summary) {
            this.summary = summary;
            return this;
        }

        public AiCvAnalysisBuilder suggestedRoles(List<String> suggestedRoles) {
            this.suggestedRoles = suggestedRoles;
            return this;
        }

        public AiCvAnalysisBuilder improvementAdvice(String improvementAdvice) {
            this.improvementAdvice = improvementAdvice;
            return this;
        }

        public AiCvAnalysisBuilder rawJson(String rawJson) {
            this.rawJson = rawJson;
            return this;
        }

        public AiCvAnalysis build() {
            return new AiCvAnalysis(
                candidateName, headline, phone, email, address, yearsOfExperience,
                skills, topSkills, educationsJson, experiencesJson, projectsJson,
                certificationsJson, languagesJson, summary, suggestedRoles,
                improvementAdvice, rawJson
            );
        }
    }
}
