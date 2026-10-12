# AGENTS.md - WORKSPACE CUSTOM INSTRUCTIONS FOR HIREMATE AI

## Overview
This repository contains the Spring Boot backend (`hiremate`) and design specifications for **HireMate AI** (FPT University - SWP391 Project).

All AI agents and developers working in this workspace MUST follow the authoritative specifications defined in:
📄 [PROJECT_MASTER_SPECIFICATION.md](file:///D:/FPT/HK%20V/SWP/hiremate/PROJECT_MASTER_SPECIFICATION.md)

## Core Technical Rules
1. **Database Standards:** 19 PostgreSQL tables in 3NF (`users`, `skills`, `candidates`, `recruiters`, `candidate_skills`, `cvs`, `companies`, `jobs`, `job_skills`, `ai_job_matches`, `applications`, `recruitment_pipeline_logs`, `interview_sessions`, `interview_details`, `practice_progress_logs`, `notifications`, `subscription_plans`, `payment_orders`, `subscriptions`).
   - Architectural Note: `question_bank` is removed in favor of dynamic generative AI questions saved directly into `interview_details.question_text`.
   - Table-per-Subclass (Joined Inheritance): `candidates` and `recruiters` extend `users` with shared PK (`user_id`).
   - Job Moderation: `jobs.approval_status` (`PENDING`, `APPROVED`, `REJECTED`) for Admin job approval.
   - Payment & Subscriptions: VietQR tracking via `payment_orders` (`PENDING`, `APPROVED`, `REJECTED`) and active subscriptions via `subscriptions` (`ACTIVE`, `EXPIRED`).
2. **Role-based Access Control (RBAC):** `users.role` contains `user_role_enum ('CANDIDATE', 'RECRUITER', 'ADMIN')`. Single User table pattern + Subclass extension tables (`candidates`, `recruiters`, `companies`).
3. **AI Matching Calculation:** Mandatory skills carry 70% weight, Preferred skills carry 30% weight. Computed ONCE and cached in `ai_job_matches`. Read operations NEVER re-invoke Gemini API.
4. **Practice Improvement Calculation:** `practice_progress_logs.improvement_delta = score_after - score_before`. Connects two distinct sessions via `original_session_id` and `retry_session_id`.
5. **Code Style & Package Conventions:**
   - Package prefix: `com.hiremate`
   - Data Models / Entities: `com.hiremate.entity` (19 JPA Entities)
   - Enums: `com.hiremate.enums`
   - Repositories: `com.hiremate.repository`
   - Business Services: `com.hiremate.service`
   - REST Controllers: `com.hiremate.controller` (`/api/v1/...`)

