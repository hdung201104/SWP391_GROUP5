@echo off
chcp 65001 > nul
title HireMate AI - Demo A: Negative Authentication Test (Sai mat khau)
echo ============================================================================
echo    DEMO A: KIEM THU DANG NHAP THAT BAI VOI MAT KHAU SAI (NEGATIVE LOGIN)
echo    Kich ban: Nhap sai mat khau -> He thong tu choi dang nhap va bao loi do
echo ============================================================================
echo.
if exist "%~dp0Exercise6_HireMate_Automation\pom.xml" (
    cd /d "%~dp0Exercise6_HireMate_Automation"
) else (
    cd /d "%~dp0"
)
call mvn test -Dtest=LoginTest#testLoginFailedWithWrongPassword
echo.
echo ============================================================================
echo    HOAN THANH DEMO A! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul

