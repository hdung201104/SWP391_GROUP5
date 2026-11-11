@echo off
chcp 65001 > nul
title HireMate AI - Mo Bao Cao Ket Qua Kiem Thu Tu Dong (HTML Dashboard)
echo ============================================================================
echo    DANG MO BANG DANH SACH BAO CAO KIEM THU TU DONG (TEST REPORT HTML)...
echo ============================================================================
echo.

if exist "%~dp0Test_Execution_Report.html" (
    start "" "%~dp0Test_Execution_Report.html"
) else if exist "%~dp0target\Test_Execution_Report.html" (
    start "" "%~dp0target\Test_Execution_Report.html"
) else (
    echo [THONG BAO] Chua tim thay file bao cao HTML!
    echo Vui long chay kiem thu truoc bang cach chay file Chay_Tat_Ca_Demo.bat
    pause
    exit /b
)

echo [THANH CONG] Da mo trang Dashboard Bao cao kiem thu tren trinh duyet!
