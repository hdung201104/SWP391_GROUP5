# 🌿 HireMate AI - Nền Tảng Tuyển Dụng & Phỏng Vấn AI Thông Minh

> **FPT University - SWP391 Capstone Project**  
> Kiến trúc Monorepo chuẩn doanh nghiệp: **Spring Boot 3 (Java 17)** + **React 18 (Vite)** + **PostgreSQL** + **Google Gemini AI**.

---

## 🏗️ 1. Cấu Trúc Dự Án (Monorepo Structure)

Dự án được phân bổ theo mô hình **Monorepo chuẩn công nghiệp**, phân tách rành mạch giữa Backend (REST API), Frontend (SPA Client), và tài liệu đặc tả kiến trúc:

```text
hiremate/
├── .github/                       # GitHub Actions CI/CD workflows (nếu có)
├── .gitignore                     # Git ignore chuẩn cho toàn bộ Root repository
├── .gitattributes                 # Chuẩn hóa end-of-line (LF/CRLF) đa nền tảng
├── AGENTS.md                      # Hướng dẫn quy tắc code & tiêu chuẩn cho AI/Dev
├── PROJECT_MASTER_SPECIFICATION.md# Đặc tả 16 bảng CSDL 3NF, API contract & Logic AI
├── README.md                      # Tài liệu tổng quan & Hướng dẫn phối hợp Team Git
├── pom.xml                        # Maven Root Aggregator quản lý module con
│
├── hiremate-backend/              # [BACKEND] Spring Boot 3.2.4 REST API Service
│   ├── src/main/java/com/hiremate/
│   │   ├── config/                # Cấu hình Security, CORS, Mail, Swagger
│   │   ├── controller/            # REST Controllers (/api/v1/...)
│   │   ├── dto/                   # Request/Response Data Transfer Objects
│   │   ├── entity/                # 16 JPA Entities chuẩn PostgreSQL 3NF
│   │   ├── enums/                 # Role, Status, Session Types
│   │   ├── exception/             # Global Exception Handler & Custom Errors
│   │   ├── repository/            # Spring Data JPA Repositories
│   │   ├── service/               # Interface & Service Implementations
│   │   └── util/                  # Helper utilities (JWT, Gemini, Parsing)
│   ├── src/main/resources/
│   │   ├── application.yml        # Cấu hình Database, SMTP, Gemini API
│   │   └── db/migration/          # SQL DDL 16 bảng & Dữ liệu Seed ban đầu
│   ├── .env.example               # Mẫu biến môi trường Backend
│   ├── .gitignore                 # Bỏ qua /target, .class, logs, uploads
│   └── pom.xml                    # Maven dependencies Backend
│
└── hiremate-frontend/             # [FRONTEND] React 18 Single Page Application (SPA)
    ├── src/
    │   ├── api/                   # Axios Client & API Services modularized
    │   ├── assets/                # Hình ảnh, font chữ tĩnh
    │   ├── components/            # UI Components tái sử dụng (Header, Footer, Modals)
    │   │   ├── common/            # BotanicalBackground, ProtectedRoute, Spinner...
    │   │   └── jobs/              # JobCard, ApplyJobModal, FilterSidebar...
    │   ├── context/               # AuthContext, NotificationContext
    │   ├── pages/                 # Các màn hình chính (Ứng viên, NTD, Admin)
    │   │   ├── auth/              # Đăng nhập, Đăng ký, Quên mật khẩu
    │   │   ├── HomePage.jsx
    │   │   ├── AiInterviewStudioPage.jsx
    │   │   ├── CandidateProfilePage.jsx
    │   │   ├── RecruiterDashboardPage.jsx
    │   │   └── AccountSettingsPage.jsx
    │   ├── App.jsx                # Router & Điều hướng phân quyền (RBAC)
    │   ├── index.css              # Design system Botanical Modern phong cách sang trọng
    │   └── main.jsx               # React DOM Entry
    ├── .env.example               # Mẫu biến môi trường Frontend
    ├── .gitignore                 # Bỏ qua node_modules, /dist, .env.local
    ├── package.json               # Frontend dependencies & scripts
    ├── tailwind.config.js         # Palette màu Botanical & Tokens giao diện
    └── vite.config.js             # Vite Dev Server & Proxy API /api -> :8080
```

---

## 🚀 2. Hướng Dẫn Cài Đặt & Khởi Chạy (Local Development)

### Yêu cầu tiên quyết (Prerequisites)
* **Java SDK:** 17+
* **Node.js:** 18+ & **npm:** 9+
* **PostgreSQL:** 14+ (Database tên: `HireMateAI` port 5432)
* **Apache Maven:** 3.8+ (hoặc dùng Maven tích hợp trong IDE)

---

### Khởi chạy Backend (Spring Boot)
1. Mở PostgreSQL và tạo cơ sở dữ liệu:
   ```sql
   CREATE DATABASE "HireMateAI";
   ```
2. Chạy migration tạo 16 bảng và nạp dữ liệu mẫu:
   Chạy file SQL tại `hiremate-backend/src/main/resources/db/migration/seed_real_data.sql`.
3. Khởi động Spring Boot service:
   ```bash
   cd hiremate-backend
   mvn spring-boot:run
   ```
   * Backend sẽ lắng nghe tại: `http://localhost:8080`
   * API prefix: `http://localhost:8080/api/v1/...`

---

### Khởi chạy Frontend (React + Vite)
1. Cài đặt thư viện dependencies:
   ```bash
   cd hiremate-frontend
   npm install
   ```
2. Khởi chạy máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
   * Mở trình duyệt tại: `http://localhost:3000`
   * Mọi request `/api/...` sẽ tự động được reverse proxy tới Backend `http://localhost:8080`.

---

## 👥 3. Quy Ước Phối Hợp Làm Việc Nhóm Bằng Git (Git Team Guidelines)

Để làm việc nhóm chuyên nghiệp theo chuẩn Software Engineer, cả nhóm cần tuân thủ các quy tắc sau:

### 3.1. Chiến Lược Nhánh (Branching Strategy - Git Flow)
* `main`: Nhánh ổn định cao nhất, chỉ merge code khi đã test hoàn chỉnh và sẵn sàng demo/nộp bài. **Không bao giờ commit code trực tiếp lên `main`!**
* `develop`: Nhánh tích hợp chung của cả nhóm. Mọi thành viên lấy code mới nhất từ nhánh này.
* `feature/<tên-tính-năng>`: Nhánh làm việc của từng cá nhân.
  * *Ví dụ:* `feature/auth-email-otp`, `feature/ai-interview-room`, `feature/job-crud`.
* `fix/<tên-lỗi>`: Dành cho việc sửa lỗi nhanh phát sinh trong quá trình ghép code.

### 3.2. Quy Trình Làm Việc Hằng Ngày Của Thành Viên
1. Cập nhật code mới nhất từ team trước khi bắt đầu code:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Tạo nhánh riêng để làm nhiệm vụ:
   ```bash
   git checkout -b feature/recruiter-candidate-evaluation
   ```
3. Commit thường xuyên với thông điệp rõ ràng theo chuẩn **Conventional Commits**:
   * `feat: ...` : Thêm tính năng mới (ví dụ: `feat: add OTP email verification modal`)
   * `fix: ...`  : Sửa lỗi (ví dụ: `fix: resolve CORS issue on job submission`)
   * `refactor: ...`: Tối ưu code mà không thay đổi chức năng
   * `docs: ...` : Cập nhật tài liệu README, spec
4. Đẩy nhánh lên Remote Repository & Tạo Pull Request (PR):
   ```bash
   git push origin feature/recruiter-candidate-evaluation
   ```
5. Yêu cầu ít nhất 1 thành viên trong nhóm Review Code trước khi Merge vào `develop`.

---

## 🔒 4. Nguyên Tắc Bảo Mật Cho Team
* **Không bao giờ commit mật khẩu nhạy cảm lên Git:**
  * File `.gitignore` đã được cấu hình tự động bỏ qua các thư mục tạm (`node_modules/`, `target/`, `.vscode/`, `.idea/`, file upload `*.pdf`, `*.mp3`).
  * Khóa bí mật (Google App Password, API Key) nên được lưu qua file `.env` cá nhân hoặc biến môi trường `SPRING_MAIL_PASSWORD`.

---

## 📌 5. Tài Liệu Kỹ Thuật Tham Khảo
* 📄 [PROJECT_MASTER_SPECIFICATION.md](./PROJECT_MASTER_SPECIFICATION.md): Đặc tả kiến trúc 16 bảng CSDL 3NF, API Endpoints, Quy tắc tính điểm AI Matching & Practice Progress.
* 🤖 [AGENTS.md](./AGENTS.md): Tiêu chuẩn quy tắc dành cho Agent lập trình và nhà phát triển.
