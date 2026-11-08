@echo off
chcp 65001 > nul
title Chay Automation Test - Exercise 6 (HireMate AI Web)
echo =====================================================================
echo    DANG CHAY AUTOMATION TEST EXERCISE 6: HIREMATE AI (LOGIN & REGISTER)
echo =====================================================================
echo.
cd /d "D:\FPT\HK V\SWT\Automation_Testing\Exercise 6"
call mvn test
echo.
echo =====================================================================
echo    DA CHAY XONG! Bam phim bat ky de dong cua so nay...
echo =====================================================================
pause > nul
