-- ============================================================
-- HIREMATE AI - MASTER DATABASE SCHEMA (PostgreSQL 16+)
-- File: HireMate_AI_New.sql
-- Mô tả: Schema hoàn chỉnh 100% theo chuẩn Refactored Architecture
--       - Kiến trúc Table-per-Subclass (Joined Inheritance)
--       - Đã XÓA question_bank (AI Agent Generative động 100%)
--       - Đã TẠO bảng candidates và recruiters (Shared PK = user_id)
--       - Toàn bộ Khóa ngoại trỏ trực tiếp về candidates & recruiters
-- ============================================================

-- 1. XÓA BẢNG CŨ THEO THỨ TỰ PHỤ THUỘC (NẾU CÓ)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS practice_progress_logs CASCADE;
DROP TABLE IF EXISTS interview_details CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS recruitment_pipeline_logs CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS ai_job_matches CASCADE;
DROP TABLE IF EXISTS job_skills CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS candidate_skills CASCADE;
DROP TABLE IF EXISTS cvs CASCADE;
DROP TABLE IF EXISTS candidate_profiles CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS recruiters CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS question_bank CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. users (Superclass - Thông tin tài khoản xác thực dùng chung)
-- ============================================================
CREATE TABLE users (
    user_id             BIGSERIAL       PRIMARY KEY,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password_hash       VARCHAR(500)    NOT NULL,
    full_name           VARCHAR(200)    NOT NULL,
    phone               VARCHAR(20),
    avatar_url          VARCHAR(500),
    role                VARCHAR(20)     NOT NULL DEFAULT 'CANDIDATE',
    status              VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    is_email_verified   BOOLEAN         DEFAULT TRUE,
    date_of_birth       VARCHAR(20),
    address             VARCHAR(300),
    bio                 TEXT,
    github_url          VARCHAR(300),
    created_at          TIMESTAMPTZ     DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 2. skills (Danh mục kỹ năng chuẩn hóa)
-- ============================================================
CREATE TABLE skills (
    skill_id            BIGSERIAL       PRIMARY KEY,
    skill_name          VARCHAR(100)    NOT NULL UNIQUE,
    category            VARCHAR(100),
    aliases             TEXT,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 3. candidates (Subclass của users - Hồ sơ chuyên môn Ứng viên)
-- Shared PK: candidate_id = user_id
-- ============================================================
CREATE TABLE candidates (
    candidate_id        BIGINT          PRIMARY KEY,
    headline            VARCHAR(300),
    location            VARCHAR(200),
    bio                 TEXT,
    experience_years    INT             DEFAULT 0,
    desired_salary_min  NUMERIC(15,2),
    desired_salary_max  NUMERIC(15,2),
    educations_json     TEXT,
    experiences_json    TEXT,
    projects_json       TEXT,
    career_goals        TEXT,
    updated_at          TIMESTAMPTZ     DEFAULT NOW(),
    CONSTRAINT fk_candidates_user FOREIGN KEY (candidate_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. companies (Doanh nghiệp tuyển dụng)
-- ============================================================
CREATE TABLE companies (
    company_id          BIGSERIAL       PRIMARY KEY,
    recruiter_id        BIGINT,         -- FK được gắn sau khi tạo bảng recruiters
    company_name        VARCHAR(200)    NOT NULL,
    website             VARCHAR(300),
    logo_url            VARCHAR(500),
    description         TEXT,
    industry            VARCHAR(100),
    company_size        VARCHAR(50),
    address             VARCHAR(300),
    status              VARCHAR(20)     DEFAULT 'ACTIVE',
    founded_year        INT,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 5. recruiters (Subclass của users - Nhà tuyển dụng)
-- Shared PK: recruiter_id = user_id
-- ============================================================
CREATE TABLE recruiters (
    recruiter_id        BIGINT          PRIMARY KEY,
    company_id          BIGINT          REFERENCES companies(company_id) ON DELETE SET NULL,
    position            VARCHAR(200),
    department          VARCHAR(150),
    updated_at          TIMESTAMPTZ     DEFAULT NOW(),
    CONSTRAINT fk_recruiters_user FOREIGN KEY (recruiter_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Liên kết khóa ngoại từ companies trỏ về recruiters(recruiter_id)
ALTER TABLE companies
    ADD CONSTRAINT fk_companies_recruiter
        FOREIGN KEY (recruiter_id) REFERENCES recruiters(recruiter_id)
        ON DELETE SET NULL;

-- ============================================================
-- 6. candidate_skills (Kỹ năng của ứng viên - FK -> candidates)
-- ============================================================
CREATE TABLE candidate_skills (
    candidate_skill_id  BIGSERIAL       PRIMARY KEY,
    profile_id          BIGINT          NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    skill_id            BIGINT          NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level   VARCHAR(20)     DEFAULT 'INTERMEDIATE',
    years_of_experience REAL            DEFAULT 0,
    ai_detected         BOOLEAN         DEFAULT FALSE,
    CONSTRAINT uq_candidate_skill UNIQUE (profile_id, skill_id)
);

-- ============================================================
-- 7. cvs (Quản lý file CV & kết quả Parse ATS - FK -> candidates)
-- ============================================================
CREATE TABLE cvs (
    cv_id               BIGSERIAL       PRIMARY KEY,
    candidate_id        BIGINT          NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    file_name           VARCHAR(255),
    file_url            VARCHAR(500),
    file_type           VARCHAR(10)     DEFAULT 'pdf',
    file_size_bytes     INT,
    parsed_text         TEXT,
    parsed_json         TEXT,
    summary             TEXT,
    parse_status        VARCHAR(20)     DEFAULT 'PENDING',
    is_default          BOOLEAN         DEFAULT FALSE,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 8. jobs (Tin tuyển dụng - FK -> recruiters)
-- ============================================================
CREATE TABLE jobs (
    job_id              BIGSERIAL       PRIMARY KEY,
    recruiter_id        BIGINT          NOT NULL REFERENCES recruiters(recruiter_id) ON DELETE CASCADE,
    company_id          BIGINT          REFERENCES companies(company_id) ON DELETE SET NULL,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT,
    requirements        TEXT,
    benefits            TEXT,
    salary_min          NUMERIC(15,2),
    salary_max          NUMERIC(15,2),
    location            VARCHAR(200),
    employment_type     VARCHAR(20),
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    vacancies_count     INT             DEFAULT 1,
    total_views         INT             DEFAULT 0,
    deadline_date       DATE,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 9. job_skills (Kỹ năng yêu cầu cho Job)
-- ============================================================
CREATE TABLE job_skills (
    job_skill_id        BIGSERIAL       PRIMARY KEY,
    job_id              BIGINT          NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id            BIGINT          NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    importance          VARCHAR(20)     NOT NULL DEFAULT 'PREFERRED',
    min_years_experience INT            DEFAULT 0,
    weight              REAL            DEFAULT 1.0,
    CONSTRAINT uq_job_skill UNIQUE (job_id, skill_id)
);

-- ============================================================
-- 10. ai_job_matches (Kết quả AI Matching tính 1 lần - FK -> candidates)
-- ============================================================
CREATE TABLE ai_job_matches (
    match_id            BIGSERIAL       PRIMARY KEY,
    candidate_id        BIGINT          NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    job_id              BIGINT          NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    cv_id               BIGINT          REFERENCES cvs(cv_id) ON DELETE SET NULL,
    matching_score      REAL            NOT NULL CHECK (matching_score BETWEEN 0 AND 100),
    skill_gap_json      TEXT,
    ai_reasoning        TEXT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ     DEFAULT NOW(),
    CONSTRAINT uq_candidate_job_match UNIQUE (candidate_id, job_id)
);

-- ============================================================
-- 11. applications (Đơn ứng tuyển - FK -> candidates)
-- ============================================================
CREATE TABLE applications (
    application_id      BIGSERIAL       PRIMARY KEY,
    job_id              BIGINT          NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    candidate_id        BIGINT          NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    cv_id               BIGINT          REFERENCES cvs(cv_id) ON DELETE SET NULL,
    cover_letter        TEXT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'APPLIED',
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ     DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     DEFAULT NOW(),
    CONSTRAINT uq_application UNIQUE (job_id, candidate_id)
);

-- ============================================================
-- 12. recruitment_pipeline_logs (Nhật ký chuyển trạng thái ứng tuyển)
-- ============================================================
CREATE TABLE recruitment_pipeline_logs (
    log_id              BIGSERIAL       PRIMARY KEY,
    application_id      BIGINT          NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    from_stage          VARCHAR(20),
    to_stage            VARCHAR(20)     NOT NULL,
    notes               TEXT,
    changed_by          BIGINT          REFERENCES users(user_id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 13. interview_sessions (Phiên phỏng vấn AI - FK -> candidates)
-- ============================================================
CREATE TABLE interview_sessions (
    session_id          BIGSERIAL       PRIMARY KEY,
    candidate_id        BIGINT          NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    job_id              BIGINT          REFERENCES jobs(job_id) ON DELETE SET NULL,
    target_position     VARCHAR(200),
    session_type        VARCHAR(20)     NOT NULL DEFAULT 'MOCK',
    parent_session_id   BIGINT          REFERENCES interview_sessions(session_id) ON DELETE SET NULL,
    overall_score       REAL,
    overall_feedback    TEXT,
    weakness_summary    TEXT,
    recommended_tasks   TEXT,
    started_at          TIMESTAMPTZ     DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

-- ============================================================
-- 14. interview_details (Chi tiết hỏi đáp do AI Agent tự sinh động)
-- ============================================================
CREATE TABLE interview_details (
    detail_id           BIGSERIAL       PRIMARY KEY,
    session_id          BIGINT          NOT NULL REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    question_number     INT,
    question_text       TEXT,
    candidate_answer_text TEXT,
    audio_url           VARCHAR(500),
    ai_evaluation_score REAL,
    ai_feedback         TEXT,
    ai_suggested_answer TEXT,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 15. practice_progress_logs (Nhật ký tiến bộ luyện tập - FK -> candidates)
-- ============================================================
CREATE TABLE practice_progress_logs (
    log_id              BIGSERIAL       PRIMARY KEY,
    candidate_id        BIGINT          NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    original_session_id BIGINT          NOT NULL REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    retry_session_id    BIGINT          NOT NULL REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    skill_targeted      BIGINT          REFERENCES skills(skill_id) ON DELETE SET NULL,
    score_before        REAL,
    score_after         REAL,
    improvement_delta   REAL,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 16. notifications (Thông báo người dùng)
-- ============================================================
CREATE TABLE notifications (
    notification_id     BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type                VARCHAR(50)     NOT NULL,
    title               VARCHAR(200)    NOT NULL,
    body                TEXT,
    ref_id              BIGINT,
    ref_table           VARCHAR(50),
    is_read             BOOLEAN         DEFAULT FALSE,
    created_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- INDEXES TỐI ƯU HÓA TRUY VẤN
-- ============================================================
CREATE INDEX idx_users_email               ON users(email);
CREATE INDEX idx_users_role                ON users(role);
CREATE INDEX idx_candidates_id             ON candidates(candidate_id);
CREATE INDEX idx_recruiters_id             ON recruiters(recruiter_id);
CREATE INDEX idx_recruiters_company        ON recruiters(company_id);
CREATE INDEX idx_jobs_status               ON jobs(status);
CREATE INDEX idx_jobs_recruiter_id         ON jobs(recruiter_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_job_id       ON applications(job_id);
CREATE INDEX idx_interview_sessions_cand   ON interview_sessions(candidate_id);
CREATE INDEX idx_interview_details_session ON interview_details(session_id);
CREATE INDEX idx_ai_job_matches_cand_job   ON ai_job_matches(candidate_id, job_id);
CREATE INDEX idx_notifications_user_id     ON notifications(user_id);
CREATE INDEX idx_cvs_candidate_id          ON cvs(candidate_id);
CREATE INDEX idx_practice_candidate_id     ON practice_progress_logs(candidate_id);
