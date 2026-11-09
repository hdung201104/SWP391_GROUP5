#!/bin/bash
cd "$(dirname "$0")/Exercise6_HireMate_Automation" || exit 1
echo "============================================================================"
echo "   DEMO CHUC NANG 1: KIEM THU DANG NHAP (AUTHENTICATION & RBAC)"
echo "   - Test 1: Dang nhap hop le -> Chuyen trang Dashboard"
echo "   - Test 2: Dang nhap that bai voi sai mat khau -> Bao loi"
echo "   - Test 3: Data-Driven testing doc tu file CSV"
echo "============================================================================"
mvn test -Dtest=LoginTest
echo "============================================================================"
echo "   HOAN THANH TEST CHUC NANG 1! Nhan Enter de dong cua so nay..."
echo "============================================================================"
read -r
