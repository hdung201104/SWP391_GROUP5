@echo off
chcp 65001 > nul
title HireMate AI - Demo Chuc Nang 2: Dang Ky Tai Khoan (RegisterTest)
echo ============================================================================
echo    DEMO CHUC NANG 2: KIEM THU DANG KY TAI KHOAN (USER REGISTRATION)
echo    - Test 1: Dang ky tai khoan ung vien moi -> Thanh cong
echo    - Test 2: Dang ky voi email da ton tai -> He thong chan va bao loi
echo    - Test 3: Dang ky voi mat khau khong khop -> Bao loi mismatch
echo ============================================================================
echo.
cd /d "%~dp0Exercise6_HireMate_Automation"
call mvn test -Dtest=RegisterTest
echo.
echo ============================================================================
echo    HOAN THANH TEST CHUC NANG 2! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul
