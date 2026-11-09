@echo off
chcp 65001 > nul
title Chay Toan Bo Automation Test (Exercise 5 & Exercise 6)
echo =====================================================================
echo    BUOC 1: CHAY EXERCISE 5 (TEST FORM DEMOQA)
echo =====================================================================
cd /d "%~dp0Exercise5_DemoQA"
call mvn test

echo.
echo =====================================================================
echo    BUOC 2: CHAY EXERCISE 6 (TEST WEB HIREMATE AI - LOGIN, REGISTER, JOBS)
echo =====================================================================
cd /d "%~dp0Exercise6_HireMate_Automation"
call mvn test

echo.
echo =====================================================================
echo    HOAN THANH TOAN BO TEST CASES! Bam phim bat ky de thoat...
echo =====================================================================
pause > nul
