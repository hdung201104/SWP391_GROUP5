@echo off
chcp 65001 > nul
cls
echo ===============================================================================
echo      HIREMATE AI - CHẠY TOÀN BỘ 27 TEST CASES AUTOMATION TESTING (SELENIUM)
echo ===============================================================================
echo.
echo [1/3] Đang khởi chạy toàn bộ 27 kịch bản kiểm thử tự động...
echo       - Đăng ký (Register): 10 Test Cases (Candidate, Recruiter, Negative Rules)
echo       - Đăng nhập (Login): 12 Test Cases (Positive, Demo A, Empty Fields, CSV)
echo       - Ứng tuyển (Application): 5 Test Cases (Demo B, Demo C, Frontend, AI, Cancel)
echo.
echo Vui lòng quan sát trình duyệt Chrome đang thao tác tự động...
echo.

call mvn test

echo.
echo ===============================================================================
echo [2/3] Kiểm thử hoàn tất! Đang tự động mở Báo cáo Kết quả (HTML Report)...
echo ===============================================================================
timeout /t 2 > nul
start "" "Test_Execution_Report.html"

echo.
echo [3/3] Báo cáo chi tiết đã được mở trên trình duyệt của bạn!
echo File CSV tổng hợp: Test_Execution_Results.csv
echo.
pause
