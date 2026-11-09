@echo off
chcp 65001 > nul
title HireMate AI - Demo Chuc Nang 1: Dang Nhap & Xac Thuc (LoginTest)
echo ============================================================================
echo    DEMO CHUC NANG 1: KIEM THU DANG NHAP (AUTHENTICATION & RBAC)
echo    - Test 1: Dang nhap hop le -> Chuyen trang Dashboard
echo    - Test 2: Dang nhap that bai voi sai mat khau -> Bao loi
echo    - Test 3: Data-Driven testing doc tu file CSV
echo ============================================================================
echo.
cd /d "%~dp0Exercise6_HireMate_Automation"
call mvn test -Dtest=LoginTest
echo.
echo ============================================================================
echo    HOAN THANH TEST CHUC NANG 1! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul
