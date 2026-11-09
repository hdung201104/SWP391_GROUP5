@echo off
chcp 65001 > nul
title HireMate AI - Demo B: Job Application Happy Path
echo ============================================================================
echo    DEMO B: UNG VIEN NOP DON UNG TUYEN THANH CONG (JOB APPLICATION HAPPY PATH)
echo    Kich ban: Ung vien dang nhap -> Chon Job -> Chon CV -> Nop don thanh cong
echo ============================================================================
echo.
if exist "%~dp0Exercise6_HireMate_Automation\pom.xml" (
    cd /d "%~dp0Exercise6_HireMate_Automation"
) else (
    cd /d "%~dp0"
)
call mvn test -Dtest=JobApplicationTest#testJobApplication_HappyPath
echo.
echo ============================================================================
echo    HOAN THANH DEMO B! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul

