@echo off
chcp 65001 > nul
title HireMate AI - Chay Tat Ca Automation Test (Full Test Suite)
echo ============================================================================
echo    CHAY TOAN BO KICH BAN AUTOMATION TEST HIREMATE AI (LOGIN, REGISTER, JOBS)
echo ============================================================================
echo.
if exist "%~dp0Exercise6_HireMate_Automation\pom.xml" (
    cd /d "%~dp0Exercise6_HireMate_Automation"
) else (
    cd /d "%~dp0"
)
call mvn test
echo.
echo ============================================================================
echo    HOAN THANH TOAN BO TEST SUITE! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul

