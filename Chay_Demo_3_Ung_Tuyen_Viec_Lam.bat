@echo off
chcp 65001 > nul
title HireMate AI - Demo Chuc Nang 3: Ung Tuyen Viec Lam & Chan Nop Trung (JobApplicationTest)
echo ============================================================================
echo    DEMO CHUC NANG 3: UNG TUYEN TOAN TRINH & BUSINESS RULE SINGLE APPLICATION
echo    - Test 1 (Happy Path): Dang nhap -> Chon Job -> Chon CV -> Nop don thanh cong
echo    - Test 2 (Negative Rule): Chan nop don lan 2 vao cung 1 cong viec
echo ============================================================================
echo.
cd /d "%~dp0Exercise6_HireMate_Automation"
call mvn test -Dtest=JobApplicationTest
echo.
echo ============================================================================
echo    HOAN THANH TEST CHUC NANG 3! Bam phim bat ky de dong cua so nay...
echo ============================================================================
pause > nul
