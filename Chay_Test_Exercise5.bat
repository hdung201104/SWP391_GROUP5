@echo off
chcp 65001 > nul
title Chay Automation Test - Exercise 5 (DemoQA)
echo =====================================================================
echo    DANG CHAY AUTOMATION TEST EXERCISE 5: DEMOQA PRACTICE FORM
echo =====================================================================
echo.
cd /d "D:\FPT\HK V\SWT\Automation_Testing\Exercise 5"
call mvn test
echo.
echo =====================================================================
echo    DA CHAY XONG! Bam phim bat ky de dong cua so nay...
echo =====================================================================
pause > nul
