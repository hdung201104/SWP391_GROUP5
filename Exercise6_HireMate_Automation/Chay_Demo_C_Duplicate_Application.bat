@echo off
chcp 65001 > nul
title HireMate AI - Demo C: Negative Business Rule (Duplicate Application)
echo ============================================================================
echo    DEMO C: CHAN NOP HO SO TRUNG LAP VAO CUNG 1 JOB (SINGLE APPLICATION RULE)
echo    Kich ban: Ung vien nop don lan 2 vao cung 1 cong viec -> He thong chan
echo ============================================================================
echo.
if exist "%~dp0Exercise6_HireMate_Automation\pom.xml" (
    cd /d "%~dp0Exercise6_HireMate_Automation"
) else (
    cd /d "%~dp0"
)
call mvn test -Dtest=JobApplicationTest#testJobApplication_DuplicateApply_Prevented
echo.
echo ============================================================================
echo    HOAN THANH DEMO C! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul

