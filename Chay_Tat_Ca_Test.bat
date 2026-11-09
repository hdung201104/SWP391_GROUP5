@echo off
chcp 65001 > nul
title Chay Toan Bo Automation Test (Exercise 5 & Exercise 6)
echo =====================================================================
echo    BƯỚC 1: CHẠY EXERCISE 5 (TEST FORM DEMOQA)
echo =====================================================================
cd /d "D:\FPT\HK V\SWT\Automation_Testing\Exercise 5"
call mvn test

echo.
echo =====================================================================
echo    BƯỚC 2: CHẠY EXERCISE 6 (TEST WEB HIREMATE AI - LOGIN & REGISTER)
echo =====================================================================
cd /d "D:\FPT\HK V\SWT\Automation_Testing\Exercise 6"
call mvn test

echo.
echo =====================================================================
echo    HOÀN THÀNH TOÀN BỘ TEST CASES! Bấm phím bất kỳ để thoát...
echo =====================================================================
pause > nul
