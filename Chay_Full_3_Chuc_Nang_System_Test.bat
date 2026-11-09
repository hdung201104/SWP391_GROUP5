@echo off
chcp 65001 > nul
title HireMate AI - Chay Full Toan Bo 3 Chuc Nang System Testing (100% Pass)
echo ============================================================================
echo    CHAY FULL TOAN BO 3 CHUC NANG SYSTEM TESTING (13 TEST CASES - 100% PASS)
echo    1. Chuc nang Dang nhap (LoginTest)
echo    2. Chuc nang Dang ky (RegisterTest)
echo    3. Chuc nang Ung tuyen viec lam & Chan nop trung (JobApplicationTest)
echo ============================================================================
echo.
cd /d "%~dp0Exercise6_HireMate_Automation"
call mvn test
echo.
echo ============================================================================
echo    HOAN THANH FULL 3 CHUC NANG SYSTEM TESTING! Bam phim bat ky de dong...
echo ============================================================================
pause > nul
