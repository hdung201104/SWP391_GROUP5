package com.hiremate.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CvParsedDTO {

    @JsonProperty("full_name")
    @JsonAlias({"fullName", "candidate_name", "candidateName"})
    private String fullName;

    @JsonProperty("headline")
    @JsonAlias({"title", "target_title", "targetTitle"})
    private String headline;

    @JsonProperty("phone")
    @JsonAlias({"phoneNumber", "phone_number"})
    private String phone;

    @JsonProperty("email")
    private String email;

    @JsonProperty("address")
    @JsonAlias({"location", "city"})
    private String address;

    @JsonProperty("summary")
    @JsonAlias({"bio", "objective", "about"})
    private String summary;

    @JsonProperty("skills")
    @JsonAlias({"top_skills", "topSkills", "detected_skills", "detectedSkills"})
    private List<String> skills;

    @JsonProperty("experiences")
    @JsonAlias({"work_experience", "experience", "work_experiences"})
    private List<ExperienceItem> experiences;

    @JsonProperty("educations")
    @JsonAlias({"education", "degrees"})
    private List<EducationItem> educations;

    @JsonProperty("projects")
    @JsonAlias({"key_projects", "project_list"})
    private List<ProjectItem> projects;

    @JsonProperty("certifications")
    @JsonAlias({"certificates", "certs"})
    private List<CertificationItem> certifications;

    @JsonProperty("languages")
    @JsonAlias({"language_skills", "foreign_languages"})
    private List<LanguageItem> languages;

    @JsonProperty("skill_categories")
    @JsonAlias({"skillCategories", "skills_matrix", "skillsMatrix", "skills_by_category"})
    private List<SkillCategoryItem> skillCategories;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SkillCategoryItem {
        private String category;
        private List<String> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExperienceItem {
        private Object id;
        private String company;
        private String role;
        @JsonAlias({"period", "time"})
        private String duration;
        private String location;
        private String description;
        @JsonAlias({"bullets", "achievements"})
        private List<String> highlights;
        private List<String> tags;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EducationItem {
        private Object id;
        private String school;
        @JsonAlias({"degree"})
        private String major;
        @JsonAlias({"period"})
        private String year;
        private String grade;
        private String highlight;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProjectItem {
        private Object id;
        @JsonProperty("project_name")
        @JsonAlias({"name", "projectName", "title"})
        private String projectName;
        private String role;
        private String period;
        @JsonAlias({"tools", "tags"})
        private String technologies;
        @JsonAlias({"summary"})
        private String description;
        private List<String> tags;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CertificationItem {
        private Object id;
        private String name;
        private String issuer;
        private String year;
        private String code;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LanguageItem {
        private Object id;
        private String name;
        private String level;
        private String score;
    }
}
