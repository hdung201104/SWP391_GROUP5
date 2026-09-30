-- ============================================================
-- HIREMATE AI - REAL SEED DATA (16 TABLES 3NF)
-- Database: HireMateAI | PostgreSQL 18
-- ============================================================

-- 1. CLEANUP (IN REVERSE DEPENDENCY ORDER)
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE practice_progress_logs CASCADE;
TRUNCATE TABLE interview_details CASCADE;
TRUNCATE TABLE interview_sessions CASCADE;
TRUNCATE TABLE recruitment_pipeline_logs CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE ai_job_matches CASCADE;
TRUNCATE TABLE job_skills CASCADE;
TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE cvs CASCADE;
TRUNCATE TABLE candidate_skills CASCADE;
TRUNCATE TABLE candidate_profiles CASCADE;
TRUNCATE TABLE question_bank CASCADE;
TRUNCATE TABLE skills CASCADE;
TRUNCATE TABLE users CASCADE;

-- 2. SEED USERS
-- Password for all seed users is: Password123@ (or 123456)
-- Hash: $2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq
INSERT INTO users (user_id, email, password_hash, full_name, phone, avatar_url, role, status)
OVERRIDING SYSTEM VALUE VALUES
(1, 'longtran@candidate.hiremate.ai', '$2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq', 'Long Tran', '0909123456', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'CANDIDATE', 'ACTIVE'),
(2, 'minhanh.hr@fptsoftware.com', '$2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq', 'Nguyễn Minh Anh', '0912345678', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', 'RECRUITER', 'ACTIVE'),
(3, 'hoangphuc.talent@vng.com.vn', '$2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq', 'Hoàng Phúc', '0933456789', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 'RECRUITER', 'ACTIVE'),
(4, 'admin@hiremate.ai', '$2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq', 'System Administrator', '0900000000', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80', 'ADMIN', 'ACTIVE'),
(5, 'quocbao.dev@gmail.com', '$2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq', 'Trần Quốc Bảo', '0988111222', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', 'CANDIDATE', 'ACTIVE'),
(6, 'khanhvy.ai@gmail.com', '$2a$10$It527/3YHiEBF4dhfbSoOuHiitL6JET/amdzK56IB1P7k7/1Xw4Sq', 'Lê Khánh Vy', '0977333444', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80', 'CANDIDATE', 'ACTIVE');

-- 3. SEED SKILLS
INSERT INTO skills (skill_id, skill_name, category, aliases)
OVERRIDING SYSTEM VALUE VALUES
(1, 'Java', 'Backend', '["Java 21", "Core Java", "JVM", "Java EE"]'::jsonb),
(2, 'Spring Boot', 'Backend Framework', '["Spring Boot 3", "Spring MVC", "Spring Data JPA"]'::jsonb),
(3, 'PostgreSQL', 'Database', '["Postgres", "SQL", "RDBMS", "Relational Database"]'::jsonb),
(4, 'Apache Kafka', 'Messaging', '["Kafka", "Event Streaming", "PubSub", "KStream"]'::jsonb),
(5, 'Redis', 'Caching & In-Memory', '["Redis Cache", "Redis Cluster", "Distributed Cache"]'::jsonb),
(6, 'Kubernetes', 'DevOps & Orchestration', '["K8s", "Container Orchestration", "Helm"]'::jsonb),
(7, 'Docker', 'DevOps & Containers', '["Docker Compose", "Containers", "Dockerfiles"]'::jsonb),
(8, 'System Design', 'Architecture', '["Distributed Systems", "High Concurrency", "Microservices"]'::jsonb),
(9, 'React', 'Frontend', '["React.js", "React 18", "Hooks", "Redux Toolkit"]'::jsonb),
(10, 'TypeScript', 'Frontend & FullStack', '["TS", "JavaScript", "Node.js"]'::jsonb),
(11, 'AWS', 'Cloud Computing', '["Amazon Web Services", "EC2", "S3", "EKS", "RDS"]'::jsonb),
(12, 'Terraform', 'Infrastructure as Code', '["IaC", "Terraform Cloud", "HCL"]'::jsonb),
(13, 'Python', 'AI & Data Engineering', '["Python 3", "FastAPI", "Pandas", "PyTorch"]'::jsonb),
(14, 'Microservices Architecture', 'Architecture', '["gRPC", "Service Mesh", "API Gateway", "RESTful"]'::jsonb);

-- 4. SEED COMPANIES
INSERT INTO companies (company_id, recruiter_id, company_name, logo_url, website, address, company_size, status)
OVERRIDING SYSTEM VALUE VALUES
(1, 2, 'FPT Software', 'https://fptsoftware.com/assets/images/logo.svg', 'https://fptsoftware.com', 'F-Town 3, Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM', '10,000+ nhân viên', 'ACTIVE'),
(2, 3, 'VNG Corporation', 'https://vng.com.vn/assets/images/logo-vng.png', 'https://vng.com.vn', 'VNG Campus, Đường 13, Tân Thuận Đông, Quận 7, TP.HCM', '5,000+ nhân viên', 'ACTIVE');

-- 5. SEED CANDIDATE PROFILES
INSERT INTO candidate_profiles (profile_id, user_id, headline, location, bio, experience_years, desired_salary_min, desired_salary_max, educations_json, experiences_json, projects_json, career_goals)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Senior Backend Engineer | High-Concurrency Distributed Systems | Java 21 & Spring Boot 3', 'TP. Hồ Chí Minh, VN', '5+ năm kinh nghiệm chuyên sâu thiết kế backend vi dịch vụ, xử lý streaming dữ liệu hàng triệu giao dịch mỗi ngày với Apache Kafka, Redis Cluster và cơ sở dữ liệu PostgreSQL.', 5, 2500.00, 3500.00,
 '[{"school":"Đại học FPT TP.HCM","degree":"Kỹ sư Phần mềm (Software Engineering)","graduation_year":2021,"gpa":"3.6/4.0"}]'::jsonb,
 '[{"company":"FPT Software","role":"Senior Backend Developer","period":"2023 - Nay","description":"Thiết kế kiến trúc Core Payment Gateway xử lý 45,000 req/s, giảm độ trễ P99 từ 140ms xuống 25ms bằng Redis caching & connection pooling."},{"company":"VNG Games Studio","role":"Software Engineer","period":"2021 - 2023","description":"Xây dựng hệ thống Leaderboard & Matchmaking thời gian thực qua WebSocket & gRPC."}]'::jsonb,
 '[{"name":"HireMate AI Platform","tech":["Java 21","Spring Boot 3","PostgreSQL","Kafka","Three.js"],"description":"Hệ thống phỏng vấn AI và xếp hạng ứng viên tự động."}]'::jsonb,
 'Mục tiêu trở thành Principal Distributed Systems Architect trong 2 năm tới, dẫn dắt các dự án quy mô toàn cầu.');

-- 6. SEED CANDIDATE SKILLS
INSERT INTO candidate_skills (candidate_skill_id, profile_id, skill_id, proficiency_level, years_of_experience, ai_detected)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'ADVANCED', 5.0, true),
(2, 1, 2, 'ADVANCED', 5.0, true),
(3, 1, 3, 'ADVANCED', 4.5, true),
(4, 1, 4, 'INTERMEDIATE', 3.0, true),
(5, 1, 5, 'ADVANCED', 4.0, true),
(6, 1, 8, 'INTERMEDIATE', 3.5, true);

-- 7. SEED CVS
INSERT INTO cvs (cv_id, candidate_id, file_name, file_url, file_type, file_size_bytes, summary, parse_status, is_default)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'CV_LongTran_Senior_Backend_Engineer_2026.pdf', 'https://hiremate.ai/uploads/cv_longtran.pdf', 'PDF', 425600, 
 'Chuyên gia Backend 5 năm kinh nghiệm thực chiến Java 21, Spring Boot 3, Kafka, Redis, PostgreSQL. Kỹ năng tối ưu hóa truy vấn SQL, thiết kế hệ thống phân tán chịu tải lớn và microservices.', 'DONE', true);

-- 8. SEED JOBS
INSERT INTO jobs (job_id, recruiter_id, company_id, title, description, requirements, benefits, salary_min, salary_max, location, employment_type, status, vacancies_count, total_views, deadline_date)
OVERRIDING SYSTEM VALUE VALUES
(1, 2, 1, 'Senior Backend Engineer (High Concurrency & Kafka)', 
 'Thiết kế kiến trúc vi dịch vụ quy mô 50k+ QPS trên nền tảng Kafka, Java 21, Spring Boot và bệnh viện phân tán Redis Cluster. Tham gia giải quyết các bài toán về transaction ACID trên dữ liệu phân tán.',
 'Tối thiểu 4 năm kinh nghiệm với Java/Spring Boot. Hiểu sâu concurrency, multi-threading, và event streaming Kafka. Kinh nghiệm thực chiến PostgreSQL query tuning & indexing.',
 'Thưởng hiệu suất 3-5 tháng lương, gói bảo hiểm chăm sóc sức khỏe quốc tế cao cấp, làm việc hybrid 2 ngày/tuần, tài trợ 100% chứng chỉ AWS Certified Solutions Architect.',
 2500.00, 3500.00, 'TP.HCM - Hybrid', 'FULL_TIME', 'PUBLISHED', 3, 1420, '2026-12-31'),

(2, 3, 2, 'Lead Distributed Systems Architect (Game & Social)',
 'Kiến trúc tầng mạng backend game multiplayer thời gian thực với gRPC, Golang/Java và đồng bộ dữ liệu siêu trễ thấp. Xây dựng nền tảng match-making và payment xử lý hàng triệu active users.',
 'Có kinh nghiệm lead team 5-10 kỹ sư, am hiểu sâu sắc distributed tracing, Paxos/Raft consensus và CAP theorem. Tối thiểu 6 năm kinh nghiệm backend.',
 'Stock options (ESOP) hàng năm, làm việc tại VNG Campus chuẩn 5 sao (hồ bơi, gym, cafe miễn phí), tài trợ chứng chỉ công nghệ quốc tế.',
 3500.00, 5000.00, 'TP.HCM - VNG Campus', 'FULL_TIME', 'PUBLISHED', 2, 980, '2026-11-30'),

(3, 2, 1, 'Senior DevOps / SRE Architect',
 'Quản trị cụm hạ tầng Kubernetes đa vùng trên AWS, tối ưu hệ thống auto-scale ngày siêu sale flash sale và CI/CD zero-downtime.',
 'Thành thạo Kubernetes, Terraform, Prometheus, CI/CD pipelines trên AWS/GCP. Kinh nghiệm xử lý sự cố P1/P0 trong môi trường Production 24/7.',
 'Bonus 3-5 tháng, làm việc remote linh hoạt 100%, cấp mới MacBook Pro M3 Max 36GB RAM, hỗ trợ kinh phí setup phòng làm việc tại gia.',
 3200.00, 4800.00, 'Remote Worldwide', 'REMOTE', 'PUBLISHED', 2, 850, '2026-10-31');

-- 9. SEED JOB SKILLS (70% MANDATORY, 30% PREFERRED)
INSERT INTO job_skills (job_skill_id, job_id, skill_id, importance, min_years_experience, weight)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'MANDATORY', 4, 1.0), -- Java
(2, 1, 2, 'MANDATORY', 4, 1.0), -- Spring Boot
(3, 1, 3, 'MANDATORY', 3, 1.0), -- PostgreSQL
(4, 1, 4, 'PREFERRED', 2, 0.5), -- Kafka
(5, 1, 5, 'PREFERRED', 2, 0.5), -- Redis
(6, 2, 8, 'MANDATORY', 6, 1.0), -- System Design
(7, 2, 1, 'MANDATORY', 5, 1.0), -- Java
(8, 2, 14, 'PREFERRED', 4, 0.5), -- Microservices
(9, 3, 6, 'MANDATORY', 4, 1.0), -- Kubernetes
(10, 3, 12, 'MANDATORY', 3, 1.0), -- Terraform
(11, 3, 11, 'PREFERRED', 3, 0.5); -- AWS

-- 10. SEED AI JOB MATCHES (CACHED 3NF)
INSERT INTO ai_job_matches (match_id, candidate_id, job_id, cv_id, matching_score, skill_gap_json, ai_reasoning, status)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 96.0, 
 '{"matched_mandatory":["Java","Spring Boot","PostgreSQL"],"matched_preferred":["Apache Kafka","Redis"],"missing_mandatory":[],"missing_preferred":[]}'::jsonb,
 'Ứng viên Long Tran hoàn toàn đáp ứng trọn vẹn 100% kỹ năng bắt buộc (Java 21, Spring Boot 3, PostgreSQL) với 5 năm kinh nghiệm thực chiến. Kỹ năng bổ sung Kafka và Redis đạt mức độ đánh giá cao.', 'COMPLETED'),

(2, 1, 2, 1, 94.0,
 '{"matched_mandatory":["Java","System Design"],"matched_preferred":["Microservices Architecture"],"missing_mandatory":[],"missing_preferred":[]}'::jsonb,
 'Ứng viên có nền tảng kiến trúc phân tán vững chắc, kinh nghiệm làm việc tại VNG trước đây là một điểm cộng văn hóa đặc biệt lớn.', 'COMPLETED'),

(3, 1, 3, 1, 91.0,
 '{"matched_mandatory":["Kubernetes"],"matched_preferred":["AWS"],"missing_mandatory":["Terraform"],"missing_preferred":[]}'::jsonb,
 'Ứng viên có kiến thức tốt về container hóa và Kubernetes, chỉ cần bổ sung thêm kinh nghiệm triển khai hạ tầng với Terraform.', 'COMPLETED');

-- 11. SEED APPLICATIONS
INSERT INTO applications (application_id, job_id, candidate_id, cv_id, cover_letter, status)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Kính gửi HR Lead Nguyễn Minh Anh, tôi có 5 năm kinh nghiệm chuyên sâu về Java Concurrency và Kafka tại các hệ thống lớn. Rất mong muốn được đóng góp cho dự án High Concurrency tại FPT Software.', 'INTERVIEWING'),
(2, 2, 1, 1, 'Chào anh Hoàng Phúc, tôi từng có 2 năm gắn bó tại VNG và mong muốn quay trở lại để đảm nhận vai trò Lead Distributed Systems Architect.', 'SHORTLISTED');

-- 12. SEED RECRUITMENT PIPELINE LOGS
INSERT INTO recruitment_pipeline_logs (log_id, application_id, from_stage, to_stage, notes, changed_by)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'APPLIED', 'SCREENING', 'Hồ sơ đạt 96% AI Match Score, chuyển sang lọc kỹ thuật ban đầu.', 2),
(2, 1, 'SCREENING', 'SHORTLISTED', 'CV thể hiện kinh nghiệm thực chiến xuất sắc về tối ưu hóa SQL và xử lý Kafka.', 2),
(3, 1, 'SHORTLISTED', 'INTERVIEWING', 'Mời phỏng vấn kỹ thuật vòng 1 với Tech Lead qua Google Meet.', 2),
(4, 2, 'APPLIED', 'SHORTLISTED', 'Ứng viên cũ của VNG với điểm kỹ thuật 94%, đưa vào danh sách ứng viên sáng giá.', 3);

-- 13. SEED QUESTION BANK
INSERT INTO question_bank (question_id, created_by, skill_id, question_text, category, difficulty, sample_answer, is_active)
OVERRIDING SYSTEM VALUE VALUES
(1, 4, 8, 'Làm thế nào để đảm bảo tính Idempotency (bất biến) cho một API thanh toán trong hệ thống Microservices khi mạng gặp sự cố timeout?', 'System Design', 'HARD',
 'Sử dụng Idempotency Key duy nhất sinh từ client, lưu trữ trạng thái giao dịch trong Redis với Distributed Mutex Lock (Redlock) và thiết lập cơ chế kiểm tra trạng thái trước khi thực thi xử lý nghiệp vụ thanh toán.', true),
(2, 4, 1, 'Giải thích cơ chế hoạt động của Virtual Threads trong Java 21 (Project Loom) và sự khác biệt với Platform Threads thông thường?', 'Java Concurrency', 'HARD',
 'Virtual Threads được quản lý bởi JVM thay vì hệ điều hành (1:1 OS Thread mapping). Chúng nhẹ (vài KB so với 1MB của Platform Thread), cho phép hàng triệu thread chạy đồng thời mà không làm kiệt quệ tài nguyên bộ nhớ.', true),
(3, 4, 3, 'Khi một câu truy vấn SELECT trên bảng 50 triệu dòng bị chậm (P99 > 2s), bạn sẽ thực hiện các bước điều tra và tối ưu như thế nào?', 'Database Optimization', 'MEDIUM',
 'Chạy EXPLAIN (ANALYZE, BUFFERS), kiểm tra Seq Scan vs Index Scan, tạo Composite Index phù hợp với mệnh đề WHERE/ORDER BY, cân nhắc Partitioning theo thời gian và tuning work_mem trong PostgreSQL.', true);

-- 14. SEED INTERVIEW SESSIONS
INSERT INTO interview_sessions (session_id, candidate_id, job_id, target_position, session_type, overall_score, overall_feedback, weakness_summary, recommended_tasks)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'Senior Backend Engineer', 'MOCK', 72.0,
 'Ứng viên thể hiện hiểu biết tốt về Java Concurrency nhưng còn lúng túng khi trình bày thuật toán Distributed Lock và cơ chế bù trừ giao dịch SAGA.',
 'Cần đào sâu thêm về Redis Redlock, Quorum consensus và Distributed Transactions.',
 '[{"task":"Luyện tập System Design: SAGA Pattern","duration":"30 phút"},{"task":"Đọc tài liệu Java 21 Loom Virtual Threads","duration":"45 phút"}]'::jsonb),

(2, 1, 1, 'Senior Backend Engineer', 'PRACTICE_RETRY', 86.0,
 'Ứng viên có sự tiến bộ vượt bậc (+14 điểm). Nắm rất chắc cơ chế Idempotency Key và giải quyết triệt để bài toán bù trừ giao dịch SAGA.',
 'Tốc độ diễn đạt (WPM) đã ổn định ở mức chuẩn 135 từ/phút.',
 '[{"task":"Sẵn sàng tham gia phỏng vấn chính thức","status":"PASSED"}]'::jsonb);

-- 15. SEED PRACTICE PROGRESS LOGS
INSERT INTO practice_progress_logs (log_id, candidate_id, original_session_id, retry_session_id, skill_targeted, score_before, score_after, improvement_delta)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 2, 8, 72.0, 86.0, 14.0);

-- 16. SEED NOTIFICATIONS
INSERT INTO notifications (notification_id, user_id, type, title, body, ref_id, ref_table, is_read)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'APPLICATION_STATUS', 'Đơn ứng tuyển chuyển sang vòng Phỏng Vấn!', 'FPT Software đã chuyển đơn ứng tuyển vị trí Senior Backend Engineer sang vòng Phỏng Vấn Kỹ Thuật.', 1, 'applications', false),
(2, 1, 'INTERVIEW_RESULT', 'Tiến bộ luyện tập AI đạt +14 điểm!', 'Bạn vừa hoàn thành phiên luyện tập Sát hạch Kỹ thuật với điểm số tăng từ 72 lên 86 điểm.', 2, 'interview_sessions', false),
(3, 1, 'AI_MATCH_DONE', 'Phát hiện vị trí mới phù hợp 94% với bạn', 'VNG Games Studio vừa mở tuyển Lead Distributed Systems Architect tại TP.HCM.', 2, 'jobs', true),
(4, 2, 'APPLICATION_STATUS', 'Ứng viên mới đạt 96% AI Match Score', 'Long Tran vừa nộp đơn ứng tuyển cho vị trí Senior Backend Engineer (High Concurrency & Kafka).', 1, 'applications', false),
(5, 2, 'AI_MATCH_DONE', 'Báo cáo xếp hạng ứng viên đã sẵn sàng', 'Hệ thống AI đã hoàn tất chấm điểm và xếp hạng danh sách 42 ứng viên cho đợt tuyển dụng Q4.', 1, 'jobs', false);

-- Reset auto-increment sequences for identity columns
SELECT setval(pg_get_serial_sequence('users', 'user_id'), coalesce(max(user_id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('skills', 'skill_id'), coalesce(max(skill_id), 1)) FROM skills;
SELECT setval(pg_get_serial_sequence('companies', 'company_id'), coalesce(max(company_id), 1)) FROM companies;
SELECT setval(pg_get_serial_sequence('candidate_profiles', 'profile_id'), coalesce(max(profile_id), 1)) FROM candidate_profiles;
SELECT setval(pg_get_serial_sequence('candidate_skills', 'candidate_skill_id'), coalesce(max(candidate_skill_id), 1)) FROM candidate_skills;
SELECT setval(pg_get_serial_sequence('cvs', 'cv_id'), coalesce(max(cv_id), 1)) FROM cvs;
SELECT setval(pg_get_serial_sequence('jobs', 'job_id'), coalesce(max(job_id), 1)) FROM jobs;
SELECT setval(pg_get_serial_sequence('job_skills', 'job_skill_id'), coalesce(max(job_skill_id), 1)) FROM job_skills;
SELECT setval(pg_get_serial_sequence('ai_job_matches', 'match_id'), coalesce(max(match_id), 1)) FROM ai_job_matches;
SELECT setval(pg_get_serial_sequence('applications', 'application_id'), coalesce(max(application_id), 1)) FROM applications;
SELECT setval(pg_get_serial_sequence('recruitment_pipeline_logs', 'log_id'), coalesce(max(log_id), 1)) FROM recruitment_pipeline_logs;
SELECT setval(pg_get_serial_sequence('question_bank', 'question_id'), coalesce(max(question_id), 1)) FROM question_bank;
SELECT setval(pg_get_serial_sequence('interview_sessions', 'session_id'), coalesce(max(session_id), 1)) FROM interview_sessions;
SELECT setval(pg_get_serial_sequence('practice_progress_logs', 'log_id'), coalesce(max(log_id), 1)) FROM practice_progress_logs;
SELECT setval(pg_get_serial_sequence('notifications', 'notification_id'), coalesce(max(notification_id), 1)) FROM notifications;
