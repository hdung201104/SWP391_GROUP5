# 🚀 HIREMATE AI - BÁO CÁO MASTER SYSTEM SPECIFICATION & NGUYÊN TẮC THỰC THI DỰ ÁN (PROJECT INSTRUCTION MANUAL FOR AI AGENTS & DEVELOPERS)

---

> [!IMPORTANT]
> **Tài liệu Báo cáo Master Specification này chứa TOÀN BỘ BỐ CỤC, THIẾT KẾ CSDL 16 BẢNG, 37 USE CASES VÀ QUY TRÌNH KỸ THUẬT CỦA DỰ ÁN HIREMATE AI.**
> Bất kỳ AI Agent hoặc Lập trình viên nào làm việc trên Repository này **BẮT BUỘC KHAI THÁC VÀ TUÂN THỦ** toàn bộ các thông số kỹ thuật được định nghĩa dưới đây.

---

## 📑 MỤC LỤC MASTER SPECIFICATION

1. [TỔNG QUAN DỰ ÁN & CẤU TRÚC KỸ THUẬT](#1-tổng-quan-dự-án--cấu-trúc-kỹ-thuật)
2. [CƠ SỞ DỮ LIỆU CHUẨN 3NF (16 BẢNG HOÀN CHỈNH)](#2-cơ-sở-dữ-liệu-chuẩn-3nf-16-bảng-hoàn-chỉnh)
3. [DANH SÁCH 37 USE CASES & QUY TRÌNH CHỨC NĂNG](#3-danh-sách-37-use-cases--quy-trình-chức-năng)
4. [BỘ SYSTEM PROMPTS & THUẬT TOÁN AI ENGINE INTEGRATION](#4-bộ-system-prompts--thuật-toán-ai-engine-integration)
5. [CẤU TRÚC CODE SPRING BOOT BACKEND & PHÂN LỚP ARCHITECTURE](#5-cấu-trúc-code-spring-boot-backend--phân-lớp-architecture)
6. [LỘ TRÌNH THỰC THI DỰ ÁN (DEVELOPMENT ROADMAP FOR AI AGENTS)](#6-lộ-trình-thực-thi-dự-án-development-roadmap-for-ai-agents)

---

## 1. TỔNG QUAN DỰ ÁN & CẤU TRÚC KỸ THUẬT

### 1.1 Thông tin Dự án
* **Tên dự án:** HireMate AI (Nền tảng Tuyển dụng Thông minh & Phỏng vấn Giả lập AI).
* **Mục tiêu:** Tự động hóa 90% quy trình lọc CV & xếp hạng ứng viên cho Nhà tuyển dụng, đồng thời cung cấp công cụ phỏng vấn thử giọng nói AI và đo lường sự tiến bộ cho Ứng viên.
* **Cơ chế Phân quyền (RBAC):** Quản lý 3 Role trong hệ thống: `CANDIDATE` (Ứng viên), `RECRUITER` (Nhà tuyển dụng), `ADMIN` (Quản trị viên).

### 1.2 Tech Stack Chuẩn
* **Language & Framework:** Java 17 (hoặc Java 8/21 target 17), Spring Boot 2.7.18 / 3.x.
* **Database:** PostgreSQL 16+ chuẩn hóa 3NF (Sử dụng native JSONB cho dữ liệu mảng phức tạp).
* **Security & Auth:** Spring Security, BCrypt Password Encoder, JWT Token Authentication.
* **AI Integration:** Google Gemini 1.5 Pro / Flash REST API.
* **Build Tool:** Maven (`pom.xml`).

---

## 2. CƠ SỞ DỮ LIỆU CHUẨN 3NF (16 BẢNG HOÀN CHỈNH)

### Danh sách 16 Bảng CSDL & Cấu trúc Thuộc tính Chi tiết:

#### 1. `users` (Tài khoản người dùng)
* `user_id` (BIGINT, PK, Auto) | `email` (VARCHAR 255, UNIQUE, NOT NULL) | `password_hash` (VARCHAR 255, NOT NULL) | `full_name` (VARCHAR 150, NOT NULL) | `phone` (VARCHAR 20) | `avatar_url` (VARCHAR 500) | `role` (user_role_enum: CANDIDATE, RECRUITER, ADMIN) | `status` (user_status_enum: ACTIVE, INACTIVE, BLOCKED).

#### 2. `skills` (Từ điển kỹ năng)
* `skill_id` (BIGINT, PK, Auto) | `skill_name` (VARCHAR 100, UNIQUE, NOT NULL) | `category` (VARCHAR 100) | `aliases` (JSONB - mảng từ đồng nghĩa).

#### 3. `question_bank` (Ngân hàng câu hỏi phỏng vấn)
* `question_id` (BIGINT, PK, Auto) | `created_by` (BIGINT, FK ➔ users) | `skill_id` (BIGINT, FK ➔ skills) | `question_text` (TEXT, NOT NULL) | `category` (VARCHAR 100) | `difficulty` (question_difficulty_enum: EASY, MEDIUM, HARD) | `sample_answer` (TEXT - Barem đáp án mẫu AI) | `is_active` (BOOLEAN, DEFAULT TRUE).

#### 4. `candidate_profiles` (Hồ sơ ứng viên chuyên sâu)
* `profile_id` (BIGINT, PK, Auto) | `user_id` (BIGINT, FK 1-1 ➔ users, UNIQUE) | `headline` (VARCHAR 300) | `location` (VARCHAR 200) | `bio` (TEXT) | `experience_years` (INT, DEFAULT 0) | `desired_salary_min/max` (NUMERIC 15,2) | `educations_json` (JSONB) | `experiences_json` (JSONB) | `projects_json` (JSONB) | `career_goals` (TEXT).

#### 5. `candidate_skills` (Danh mục kỹ năng ứng viên)
* `candidate_skill_id` (BIGINT, PK, Auto) | `profile_id` (BIGINT, FK ➔ candidate_profiles) | `skill_id` (BIGINT, FK ➔ skills) | `proficiency_level` (skill_proficiency_enum: BEGINNER, INTERMEDIATE, ADVANCED) | `years_of_experience` (REAL) | `ai_detected` (BOOLEAN).

#### 6. `cvs` (Quản lý file CV & AI Parser JSON)
* `cv_id` (BIGINT, PK, Auto) | `candidate_id` (BIGINT, FK ➔ users) | `file_name` (VARCHAR 255) | `file_url` (VARCHAR 500) | `file_type` (VARCHAR 10) | `file_size_bytes` (INT, <=10MB) | `parsed_text` (TEXT) | `parsed_json` (JSONB) | `summary` (TEXT) | `parse_status` (cv_parse_status_enum: PENDING, PROCESSING, DONE, FAILED) | `is_default` (BOOLEAN, UNIQUE PARTIAL INDEX per candidate).

#### 7. `companies` (Doanh nghiệp tuyển dụng)
* `company_id` (BIGINT, PK, Auto) | `recruiter_id` (BIGINT, FK 1-1 ➔ users, UNIQUE) | `company_name` (VARCHAR 200, NOT NULL) | `logo_url` (VARCHAR 500) | `website` (VARCHAR 300) | `address` (VARCHAR 300) | `company_size` (VARCHAR 50) | `status` (company_status_enum: ACTIVE, SUSPENDED, BANNED).

#### 8. `jobs` (Tin tuyển dụng)
* `job_id` (BIGINT, PK, Auto) | `recruiter_id` (BIGINT, FK ➔ users) | `company_id` (BIGINT, FK ➔ companies) | `title` (VARCHAR 200, NOT NULL) | `description` (TEXT) | `requirements` (TEXT) | `benefits` (TEXT) | `salary_min/max` (NUMERIC 15,2) | `location` (VARCHAR 200) | `employment_type` (employment_type_enum: FULL_TIME, PART_TIME, REMOTE, HYBRID) | `status` (job_status_enum: DRAFT, PUBLISHED, CLOSED) | `vacancies_count` (INT, DEFAULT 1) | `total_views` (INT, DEFAULT 0) | `deadline_date` (DATE).

#### 9. `job_skills` (Yêu cầu kỹ năng & Trọng số AI)
* `job_skill_id` (BIGINT, PK, Auto) | `job_id` (BIGINT, FK ➔ jobs) | `skill_id` (BIGINT, FK ➔ skills) | `importance` (skill_importance_enum: MANDATORY [70% weight], PREFERRED [30% weight]) | `min_years_experience` (INT) | `weight` (REAL, 0.1 - 5.0).

#### 10. `ai_job_matches` (Báo cáo kết quả so khớp AI)
* `match_id` (BIGINT, PK, Auto) | `candidate_id` (BIGINT, FK ➔ users) | `job_id` (BIGINT, FK ➔ jobs) | `cv_id` (BIGINT, FK ➔ cvs) | `matching_score` (REAL, 0.0% - 100.0%) | `skill_gap_json` (JSONB: matched/missing skills) | `ai_reasoning` (TEXT - Lời lập luận AI) | `status` (match_status_enum: PENDING, COMPLETED, FAILED).

#### 11. `applications` (Đơn ứng tuyển)
* `application_id` (BIGINT, PK, Auto) | `job_id` (BIGINT, FK ➔ jobs) | `candidate_id` (BIGINT, FK ➔ users) | `cv_id` (BIGINT, FK ➔ cvs) | `cover_letter` (TEXT) | `status` (application_status_enum: APPLIED, SCREENING, SHORTLISTED, INTERVIEWING, OFFERED, HIRED, REJECTED) | `rejection_reason` (TEXT) | UNIQUE (job_id, candidate_id).

#### 12. `recruitment_pipeline_logs` (Nhật ký chuyển chặng)
* `log_id` (BIGINT, PK, Auto) | `application_id` (BIGINT, FK ➔ applications) | `from_stage` (application_status_enum) | `to_stage` (application_status_enum) | `notes` (TEXT) | `changed_by` (BIGINT, FK ➔ users).

#### 13. `interview_sessions` (Phiên phỏng vấn AI)
* `session_id` (BIGINT, PK, Auto) | `candidate_id` (BIGINT, FK ➔ users) | `job_id` (BIGINT, FK ➔ jobs, Optional) | `target_position` (VARCHAR 200) | `session_type` (interview_session_type_enum: MOCK, PRACTICE_RETRY) | `parent_session_id` (BIGINT, FK ➔ interview_sessions) | `overall_score` (REAL, 0-100) | `overall_feedback` (TEXT) | `weakness_summary` (TEXT) | `recommended_tasks` (JSONB).

#### 14. `interview_details` (Chi tiết từng câu phỏng vấn)
* `detail_id` (BIGINT, PK, Auto) | `session_id` (BIGINT, FK ➔ interview_sessions) | `question_id` (BIGINT, FK ➔ question_bank) | `question_number` (INT) | `question_text` (TEXT) | `candidate_answer_text` (TEXT) | `audio_url` (VARCHAR 500) | `content_score` (REAL) | `delivery_score` (REAL) | `words_per_minute` (REAL) | `clarity_score` (REAL) | `ai_feedback` (TEXT) | `ai_suggested_answer` (TEXT).

#### 15. `practice_progress_logs` (Nhật ký tiến bộ)
* `log_id` (BIGINT, PK, Auto) | `candidate_id` (BIGINT, FK ➔ users) | `original_session_id` (BIGINT, FK ➔ interview_sessions) | `retry_session_id` (BIGINT, FK ➔ interview_sessions) | `skill_targeted` (BIGINT, FK ➔ skills) | `score_before` (REAL) | `score_after` (REAL) | `improvement_delta` (REAL = score_after - score_before).

#### 16. `notifications` (Thông báo hệ thống)
* `notification_id` (BIGINT, PK, Auto) | `user_id` (BIGINT, FK ➔ users) | `type` (notification_type_enum) | `title` (VARCHAR 200) | `body` (TEXT) | `ref_id` (BIGINT) | `ref_table` (VARCHAR 50) | `is_read` (BOOLEAN).

---

## 3. DANH SÁCH 37 USE CASES & QUY TRÌNH CHỨC NĂNG

* **UC-01 đến UC-10 (Auth & Candidate CV):** Login, Logout, Register, Profile View/Edit, Upload CV (Max 10MB), Parse CV via AI, Default CV Toggle.
* **UC-11 đến UC-15 (Job & AI Match):** View Job, Search/Filter Jobs, AI Match Calculation (0-100%), Job Recommendation, Skill Gap Report.
* **UC-16 đến UC-20 & UC-24 đến UC-27 (Application & Job Mgmt):** Apply Job (Single App Rule), Candidate View Applications, Create/Edit/Publish/Close Job Postings.
* **UC-28 đến UC-32 (Recruiter Pipeline & Ranking):** Bulk AI Matching, View Rank Candidates (Sorted matching_score DESC), Edit Pipeline Stage (`APPLIED` ➔ `SCREENING` ➔ `SHORTLISTED` ➔ `INTERVIEWING` ➔ `HIRED`/`REJECTED`), Audit Logging.
* **UC-21 đến UC-23 (AI Interview Studio & Coaching):** AI Voice Mock Interview (Audio + STT + WPM/Clarity Score), Personalized Practice Plan JSON, Practice Retry & Improvement Delta (+delta%).
* **UC-33 đến UC-37 (Admin Control Center):** Manage Users (Block/Activate), Question Bank Management, System Analytics Dashboard.

---

## 4. BỘ SYSTEM PROMPTS & THUẬT TOÁN AI ENGINE INTEGRATION

### 4.1 Quy tắc tính điểm AI Matching Algorithm
$$\text{Matching Score} = (\text{Score}_{\text{Mandatory}} \times 0.70) + (\text{Score}_{\text{Preferred}} \times 0.30)$$
* **Cache Rule:** Kết quả so khớp được lưu 1 lần vào `ai_job_matches`. Khi người dùng xem lại, Backend CHỈ đọc từ CSDL (tốc độ `<20ms`), tuyệt đối KHÔNG gọi lại AI API.

### 4.2 System Prompt 1: Gemini CV Parser
* Input: Raw text bóc tách từ file CV.
* Output: Cấu trúc JSON gồm `personal_info`, `skills`, `total_experience_years`, `educations`, `experiences`, `projects`, và `summary`.

### 4.3 System Prompt 2: Gemini Job Matcher & Skill Gap
* Input: Candidate CV JSON vs Job Requirements & Job Skills List.
* Output: JSON chứa `matching_score`, `skill_gap_json` (matched/missing mandatory & preferred skills), và `ai_reasoning` (chứa `candidate_perspective` & `recruiter_perspective`).

### 4.4 System Prompt 3: AI Voice Mock Interview Evaluator
* Input: `question_text`, `sample_answer_text`, `candidate_answer_text`, `words_per_minute`, `clarity_score`.
* Output: JSON chứa `content_score` (0-100), `delivery_score` (0-100), `ai_evaluation_score`, `ai_feedback`, và `ai_suggested_answer`.

---

## 5. CẤU TRÚC CODE SPRING BOOT BACKEND & PHÂN LỚP ARCHITECTURE

```
D:/FPT/HK V/SWP/hiremate/
├── pom.xml                                   # Spring Boot 2.7.18 / 3.x, Maven, PostgreSQL, JPA, Security, JWT, Lombok
├── src/main/resources/
│   └── application.yml                        # Server Port 8080, DataSource PostgreSQL, JWT Config, Gemini API Key
└── src/main/java/com/hiremate/
    ├── HireMateApplication.java               # Main Entry Class
    ├── config/                                # SecurityConfig (JWTFilter, RBAC), CorsConfig
    ├── enums/                                 # UserRole, UserStatus, JobStatus, ApplicationStatus, MatchStatus...
    ├── model/                                 # 16 JPA Entities (User, Skill, Job, Application, InterviewSession...)
    ├── repository/                            # 16 Spring Data JPA Repositories
    ├── service/                               # AuthService, JobService, ApplicationService, AiEngineService
    ├── controller/                            # AuthController, JobController, ApplicationController, InterviewController...
    └── dto/                                   # Request & Response Data Transfer Objects
```

---

## 6. LỘ TRÌNH THỰC THI DỰ ÁN (DEVELOPMENT ROADMAP FOR AI AGENTS)

Khi AI Agent nhận nhiệm vụ lập trình dự án này, thực hiện theo thứ tự 5 giai đoạn:

1. **Giai đoạn 1 (Database & Models):** Tạo 16 Enum class & 16 JPA Entity Model classes trong `com.hiremate.model` bám sát chính xác 100% tên bảng và thuộc tính ở Phần 2.
2. **Giai đoạn 2 (Auth & Repositories):** Viết 16 JPA Repository interfaces, cấu hình `SecurityConfig` JWT, hoàn thiện `AuthController` (UC-01, UC-03 Register Candidate/Recruiter).
3. **Giai đoạn 3 (Job & Application Pipeline):** Viết REST API CRUD cho `JobController` (UC-24 ➔ UC-27) và `ApplicationController` (UC-16, UC-28 ➔ UC-32 pipeline stage audit logs).
4. **Giai đoạn 4 (AI Integration Services):** Viết `AiEngineService` tích hợp Gemini API để bóc tách CV, tính toán `ai_job_matches` và chấm điểm phỏng vấn `interview_details`.
5. **Giai đoạn 5 (AI Mock Interview & Progress Tracking):** Viết `InterviewController` (UC-19 ➔ UC-23) xử lý phỏng vấn giả lập giọng nói & tính toán `improvement_delta` tiến bộ.

---
*Tài liệu Master Specification được ghi nhận và áp dụng cho toàn bộ dự án HireMate AI.*
