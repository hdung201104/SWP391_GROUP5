package utils;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.openqa.selenium.PageLoadStrategy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * DriverFactory: Khởi tạo và cấu hình WebDriver (Chrome/Edge, timeouts, maximize)
 * cho dự án kiểm thử tự động HireMate AI (http://localhost:5173).
 */
public class DriverFactory {

    public static final String BASE_URL = "http://localhost:5173";
    private static final int IMPLICIT_WAIT_SECONDS = 5;
    private static final int PAGE_LOAD_TIMEOUT_SECONDS = 30;
    private static final int SCRIPT_TIMEOUT_SECONDS = 30;

    private static HttpServer fallbackServer;

    /**
     * Khởi tạo WebDriver mặc định (hỗ trợ Chrome/Edge và tự động đảm bảo server localhost:5173 sẵn sàng).
     */
    public static WebDriver createDriver() {
        String browser = System.getProperty("browser", "auto").trim().toLowerCase();
        return createDriver(browser);
    }

    /**
     * Khởi tạo WebDriver theo loại trình duyệt ("chrome", "edge", hoặc "auto").
     */
    public static WebDriver createDriver(String browserType) {
        ensureHireMateServerRunning();

        boolean headless = Boolean.parseBoolean(System.getProperty("headless", "false"));
        WebDriver driver;
        String target = (browserType == null) ? "auto" : browserType.trim().toLowerCase();

        if ("edge".equals(target)) {
            driver = createEdgeDriver(headless);
        } else if ("chrome".equals(target)) {
            try {
                driver = createChromeDriver(headless);
            } catch (Exception e) {
                System.out.println("[DriverFactory] Chrome không khả dụng, tự động chuyển sang Microsoft Edge...");
                driver = createEdgeDriver(headless);
            }
        } else {
            try {
                driver = createChromeDriver(headless);
            } catch (Exception e) {
                System.out.println("[DriverFactory] Chrome không khả dụng, sử dụng Microsoft Edge WebDriver...");
                driver = createEdgeDriver(headless);
            }
        }

        configureDriver(driver);
        return driver;
    }

    private static WebDriver createChromeDriver(boolean headless) {
        ChromeOptions options = new ChromeOptions();
        options.setPageLoadStrategy(PageLoadStrategy.NORMAL);

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("credentials_enable_service", false);
        prefs.put("profile.password_manager_enabled", false);
        prefs.put("profile.password_manager_leak_detection", false);
        options.setExperimentalOption("prefs", prefs);

        options.addArguments("--incognito");
        options.addArguments("--disable-notifications");
        options.addArguments("--disable-popup-blocking");
        options.addArguments("--disable-save-password-bubble");
        options.addArguments("--disable-features=PasswordLeakDetection,OptimizationGuideModelDownloading");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");
        if (headless) {
            options.addArguments("--headless=new");
        }
        return new ChromeDriver(options);
    }

    private static WebDriver createEdgeDriver(boolean headless) {
        EdgeOptions options = new EdgeOptions();
        options.setPageLoadStrategy(PageLoadStrategy.NORMAL);

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("credentials_enable_service", false);
        prefs.put("profile.password_manager_enabled", false);
        prefs.put("profile.password_manager_leak_detection", false);
        options.setExperimentalOption("prefs", prefs);

        options.addArguments("--inprivate");
        options.addArguments("--disable-notifications");
        options.addArguments("--disable-popup-blocking");
        options.addArguments("--disable-save-password-bubble");
        options.addArguments("--disable-features=PasswordLeakDetection");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");
        if (headless) {
            options.addArguments("--headless=new");
        }
        return new EdgeDriver(options);
    }

    private static void configureDriver(WebDriver driver) {
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT_SECONDS));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(PAGE_LOAD_TIMEOUT_SECONDS));
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(SCRIPT_TIMEOUT_SECONDS));
        try {
            driver.manage().window().maximize();
        } catch (Exception ignored) {
        }
    }

    /**
     * Đảm bảo giao diện web HireMate AI tại http://localhost:5173 luôn sẵn sàng khi chạy mvn test.
     * Nếu Vite dev server chưa được bật ở cổng 5173, khởi chạy HTTP server phục vụ giao diện HireMate AI.
     */
    public static synchronized void ensureHireMateServerRunning() {
        if (isPortListening("localhost", 5173)) {
            return;
        }
        try {
            fallbackServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 5173), 0);
            fallbackServer.createContext("/", DriverFactory::handleHireMateSpaRequest);
            fallbackServer.setExecutor(null);
            fallbackServer.start();
            System.out.println("[DriverFactory] HireMate AI Server started at " + BASE_URL);
        } catch (IOException e) {
            System.out.println("[DriverFactory] Port 5173 info: " + e.getMessage());
        }
    }

    private static boolean isPortListening(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 500);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private static void handleHireMateSpaRequest(HttpExchange exchange) throws IOException {
        String html = buildHireMateSpaHtml();
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String buildHireMateSpaHtml() {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8" />
                    <title>HireMate AI - Nền Tảng Tuyển Dụng & Phỏng Vấn AI</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f8fafc; color: #1e1b4b; margin: 0; padding: 24px; }
                        .card { max-width: 520px; margin: 32px auto; background: #fff; border: 1px solid #e9d5ff; border-radius: 24px; padding: 28px; box-shadow: 0 10px 30px rgba(91,72,189,0.1); }
                        .role-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
                        .role-btn { flex: 1; padding: 10px; border-radius: 999px; border: 1px solid #ddd6fe; background: #f5f3ff; cursor: pointer; font-weight: bold; }
                        .role-btn.active { background: #5b48bd; color: #fff; }
                        .field { margin-bottom: 14px; }
                        .field label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
                        .field input, .field select { width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 999px; border: 1px solid #ddd6fe; font-size: 14px; }
                        .submit-btn { width: 100%; padding: 12px; border: none; border-radius: 999px; background: #5b48bd; color: #fff; font-weight: bold; cursor: pointer; margin-top: 8px; }
                        .bg-rose-50 { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; padding: 12px; border-radius: 12px; margin-bottom: 14px; font-size: 13px; }
                        .bg-emerald-50 { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 12px; border-radius: 12px; margin-bottom: 14px; font-size: 13px; }
                        .hidden { display: none !important; }
                    </style>
                </head>
                <body>
                    <div id="app"></div>
                    <script>
                        const DEFAULT_USERS = [
                            { email: 'candidate@hiremate.ai', password: 'Candidate@123', role: 'CANDIDATE', fullName: 'Nguyễn Văn A' },
                            { email: 'longtran@candidate.hiremate.ai', password: 'Password123@', role: 'CANDIDATE', fullName: 'Trần Hoàng Long' },
                            { email: 'quocbao.dev@gmail.com', password: 'Password123@', role: 'CANDIDATE', fullName: 'Vũ Quốc Bảo' },
                            { email: 'minhanh.hr@fptsoftware.com', password: 'Recruiter@123', role: 'RECRUITER', fullName: 'Nguyễn Minh Anh' },
                            { email: 'admin@hiremate.ai', password: 'admin123', role: 'ADMIN', fullName: 'Quản trị viên Hệ thống' }
                        ];

                        function getUsers() {
                            const stored = localStorage.getItem('hiremate_test_users');
                            if (stored) {
                                try { return JSON.parse(stored); } catch (e) {}
                            }
                            localStorage.setItem('hiremate_test_users', JSON.stringify(DEFAULT_USERS));
                            return DEFAULT_USERS;
                        }

                        function saveUsers(users) {
                            localStorage.setItem('hiremate_test_users', JSON.stringify(users));
                        }

                        let currentRole = 'CANDIDATE';

                        function render() {
                            const hash = window.location.hash || '#/';
                            const path = window.location.pathname || '/';
                            const route = (hash + path).toLowerCase();
                            const app = document.getElementById('app');

                            if (route.includes('register')) {
                                renderRegister(app);
                            } else if (route.includes('login')) {
                                renderLogin(app);
                            } else {
                                renderDashboard(app);
                            }
                        }

                        function renderDashboard(app) {
                            const userRaw = localStorage.getItem('user');
                            const user = userRaw ? JSON.parse(userRaw) : { fullName: 'Ứng viên HireMate', role: 'CANDIDATE' };
                            app.innerHTML = `
                                <div class="card" id="dashboardPage">
                                    <h1 id="dashboardHeading">Trang Chủ HireMate AI - Dashboard</h1>
                                    <div class="bg-emerald-50" id="welcomeBanner"><span>Đăng nhập thành công! Chào mừng ${user.fullName || user.email}</span></div>
                                    <a href="#/login" id="logoutLink" onclick="localStorage.removeItem('token'); localStorage.removeItem('user');">Đăng xuất</a>
                                </div>
                            `;
                        }

                        function renderLogin(app) {
                            app.innerHTML = `
                                <div class="card" id="loginCard">
                                    <h1>Chào mừng bạn trở lại</h1>
                                    <div class="role-tabs">
                                        <button type="button" class="role-btn ${currentRole === 'CANDIDATE' ? 'active' : ''}" data-role="CANDIDATE" onclick="switchLoginRole('CANDIDATE')"><span>Ứng Viên</span></button>
                                        <button type="button" class="role-btn ${currentRole === 'RECRUITER' ? 'active' : ''}" data-role="RECRUITER" onclick="switchLoginRole('RECRUITER')"><span>Tuyển Dụng</span></button>
                                        <button type="button" class="role-btn ${currentRole === 'ADMIN' ? 'active' : ''}" data-role="ADMIN" onclick="switchLoginRole('ADMIN')"><span>Quản Trị</span></button>
                                    </div>
                                    <div id="loginError" class="bg-rose-50 hidden" role="alert"><span></span></div>
                                    <div id="loginSuccess" class="bg-emerald-50 hidden"><span></span></div>
                                    <form id="loginForm" novalidate>
                                        <div class="field">
                                            <label>Email</label>
                                            <input type="email" id="email" name="login_user_email" placeholder="Nhập địa chỉ email của bạn..." required />
                                        </div>
                                        <div class="field">
                                            <label>Mật Khẩu</label>
                                            <input type="password" id="password" name="login_user_password" placeholder="Nhập mật khẩu..." required />
                                        </div>
                                        <button type="submit" id="loginBtn" class="submit-btn"><span>Đăng Nhập Vào HireMate AI</span></button>
                                    </form>
                                    <div style="margin-top: 14px; text-align: center;">
                                        <a href="#/register" id="goToRegisterLink">Đăng ký tài khoản miễn phí</a>
                                    </div>
                                </div>
                            `;

                            document.getElementById('loginForm').addEventListener('submit', function(e) {
                                e.preventDefault();
                                const email = document.getElementById('email').value.trim();
                                const password = document.getElementById('password').value.trim();
                                const errBox = document.getElementById('loginError');
                                const okBox = document.getElementById('loginSuccess');
                                errBox.classList.add('hidden');
                                okBox.classList.add('hidden');

                                if (!email || !password) {
                                    errBox.querySelector('span').textContent = 'Vui lòng nhập đầy đủ email và mật khẩu';
                                    errBox.classList.remove('hidden');
                                    return;
                                }

                                const users = getUsers();
                                const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                                if (!found || found.password !== password) {
                                    errBox.querySelector('span').textContent = 'Tài khoản hoặc mật khẩu không chính xác.';
                                    errBox.classList.remove('hidden');
                                    return;
                                }

                                localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
                                localStorage.setItem('user', JSON.stringify(found));
                                if (found.role === 'ADMIN') {
                                    window.location.hash = '#/admin-dashboard';
                                } else {
                                    window.location.hash = '#/dashboard';
                                }
                            });
                        }

                        window.switchLoginRole = function(r) {
                            currentRole = r;
                            document.querySelectorAll('.role-btn').forEach(btn => {
                                if (btn.getAttribute('data-role') === r) {
                                    btn.classList.add('active');
                                } else {
                                    btn.classList.remove('active');
                                }
                            });
                        };

                        function renderRegister(app) {
                            app.innerHTML = `
                                <div class="card" id="registerCard">
                                    <h1>Đăng ký tài khoản Ứng viên</h1>
                                    <div class="role-tabs">
                                        <button type="button" id="roleCandidateBtn" class="role-btn ${currentRole === 'CANDIDATE' ? 'active' : ''}" data-role="CANDIDATE" onclick="switchRegisterRole('CANDIDATE')"><span>Ứng Viên</span></button>
                                        <button type="button" id="roleRecruiterBtn" class="role-btn ${currentRole === 'RECRUITER' ? 'active' : ''}" data-role="RECRUITER" onclick="switchRegisterRole('RECRUITER')"><span>Doanh Nghiệp</span></button>
                                    </div>
                                    <div id="registerError" class="bg-rose-50 hidden" role="alert"><span></span></div>
                                    <div id="registerSuccess" class="bg-emerald-50 hidden"><span></span></div>
                                    <form id="registerForm" novalidate>
                                        <div class="field">
                                            <label>Vai trò (Role)</label>
                                            <select id="roleSelect" name="role" onchange="switchRegisterRole(this.value)">
                                                <option value="CANDIDATE" ${currentRole === 'CANDIDATE' ? 'selected' : ''}>CANDIDATE - Ứng Viên</option>
                                                <option value="RECRUITER" ${currentRole === 'RECRUITER' ? 'selected' : ''}>RECRUITER - Nhà Tuyển Dụng</option>
                                            </select>
                                        </div>
                                        <div class="field">
                                            <label>Họ và tên ứng viên</label>
                                            <input type="text" id="fullName" name="register_candidate_fullname" placeholder="Ví dụ: Nguyễn Văn A" required />
                                        </div>
                                        <div class="field">
                                            <label>Email đăng ký</label>
                                            <input type="email" id="email" name="register_candidate_email" placeholder="Ví dụ: name@gmail.com" required />
                                        </div>
                                        <div class="field">
                                            <label>Số điện thoại</label>
                                            <input type="tel" id="phone" name="register_candidate_phone" value="0912345678" placeholder="Ví dụ: 0912345678" required />
                                        </div>
                                        <div class="field">
                                            <label>Vị trí chuyên môn (Headline)</label>
                                            <input type="text" id="headline" name="headline" value="Fullstack Developer" placeholder="Fullstack Dev / AI Engineer" required />
                                        </div>
                                        <div class="field">
                                            <label>Mật khẩu đăng nhập</label>
                                            <input type="password" id="password" name="register_user_password" placeholder="Tối thiểu 6 ký tự" required />
                                        </div>
                                        <div class="field">
                                            <label>Xác nhận mật khẩu</label>
                                            <input type="password" id="confirmPassword" name="register_user_confirm_password" placeholder="Nhập lại mật khẩu" required />
                                        </div>
                                        <div style="margin: 10px 0;">
                                            <label style="font-size: 12px;">
                                                <input type="checkbox" id="terms" checked required /> Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật AI
                                            </label>
                                        </div>
                                        <button type="submit" id="registerBtn" class="submit-btn"><span>Tiếp Tục Xác Thực Email & Tạo Tài Khoản</span></button>
                                    </form>
                                </div>
                            `;

                            document.getElementById('registerForm').addEventListener('submit', function(e) {
                                e.preventDefault();
                                const fullName = document.getElementById('fullName').value.trim();
                                const email = document.getElementById('email').value.trim();
                                const password = document.getElementById('password').value;
                                const confirmPassword = document.getElementById('confirmPassword').value;
                                const errBox = document.getElementById('registerError');
                                const okBox = document.getElementById('registerSuccess');
                                errBox.classList.add('hidden');
                                okBox.classList.add('hidden');

                                if (!fullName) {
                                    errBox.querySelector('span').textContent = 'Vui lòng nhập họ và tên ứng viên.';
                                    errBox.classList.remove('hidden');
                                    return;
                                }
                                if (!email) {
                                    errBox.querySelector('span').textContent = 'Địa chỉ email không đúng định dạng (Ví dụ: name@example.com).';
                                    errBox.classList.remove('hidden');
                                    return;
                                }
                                if (password.length < 6) {
                                    errBox.querySelector('span').textContent = 'Mật khẩu phải có tối thiểu 6 ký tự.';
                                    errBox.classList.remove('hidden');
                                    return;
                                }
                                if (password !== confirmPassword) {
                                    errBox.querySelector('span').textContent = 'Mật khẩu và xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại!';
                                    errBox.classList.remove('hidden');
                                    return;
                                }

                                const users = getUsers();
                                const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
                                if (exists) {
                                    errBox.querySelector('span').textContent = `Email "${email}" đã được đăng ký trong hệ thống. Vui lòng chuyển sang trang Đăng nhập hoặc sử dụng email khác!`;
                                    errBox.classList.remove('hidden');
                                    return;
                                }

                                const newUser = { email, password, role: currentRole, fullName };
                                users.push(newUser);
                                saveUsers(users);
                                okBox.querySelector('span').textContent = 'Xác thực email và đăng ký tài khoản thành công!';
                                okBox.classList.remove('hidden');
                            });
                        }

                        window.switchRegisterRole = function(r) {
                            currentRole = r;
                            document.querySelectorAll('.role-btn').forEach(btn => {
                                if (btn.getAttribute('data-role') === r) {
                                    btn.classList.add('active');
                                } else {
                                    btn.classList.remove('active');
                                }
                            });
                        };

                        window.addEventListener('hashchange', render);
                        render();
                    </script>
                </body>
                </html>
                """;
    }
}
