# AGENTS.md - WORKSPACE CUSTOM INSTRUCTIONS FOR HIREMATE AI

## Overview
This repository contains the Spring Boot backend (`hiremate`) and design specifications for **HireMate AI** (FPT University - SWP391 Project).

All AI agents and developers working in this workspace MUST follow the authoritative specifications defined in:
📄 [PROJECT_MASTER_SPECIFICATION.md](file:///D:/FPT/HK%20V/SWP/hiremate/PROJECT_MASTER_SPECIFICATION.md)

## Core Technical Rules
1. **Database Standards:** 16 PostgreSQL tables in 3NF (`users`, `skills`, `question_bank`, `candidate_profiles`, `candidate_skills`, `cvs`, `companies`, `jobs`, `job_skills`, `ai_job_matches`, `applications`, `recruitment_pipeline_logs`, `interview_sessions`, `interview_details`, `practice_progress_logs`, `notifications`).
2. **Role-based Access Control (RBAC):** `users.role` contains `user_role_enum ('CANDIDATE', 'RECRUITER', 'ADMIN')`. Single User table pattern + Role extension tables (`candidate_profiles`, `companies`).
3. **AI Matching Calculation:** Mandatory skills carry 70% weight, Preferred skills carry 30% weight. Computed ONCE and cached in `ai_job_matches`. Read operations NEVER re-invoke Gemini API.
4. **Practice Improvement Calculation:** `practice_progress_logs.improvement_delta = score_after - score_before`. Connects two distinct sessions via `original_session_id` and `retry_session_id`.
5. **Code Style & Package Conventions:**
   - Package prefix: `com.hiremate`
   - Data Models: `com.hiremate.model` (16 JPA Entities)
   - Enums: `com.hiremate.enums`
   - Repositories: `com.hiremate.repository`
   - Business Services: `com.hiremate.service`
   - REST Controllers: `com.hiremate.controller` (`/api/v1/...`)
