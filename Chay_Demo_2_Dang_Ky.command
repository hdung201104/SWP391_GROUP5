#!/bin/bash
cd "$(dirname "$0")/Exercise6_HireMate_Automation" || exit 1
echo "============================================================================"
echo "   DEMO CHUC NANG 2: KIEM THU DANG KY TAI KHOAN (USER REGISTRATION)"
echo "   - Test 1: Dang ky tai khoan ung vien moi -> Thanh cong"
echo "   - Test 2: Dang ky voi email da ton tai -> He thong chan va bao loi"
echo "   - Test 3: Dang ky voi mat khau khong khop -> Bao loi mismatch"
echo "============================================================================"
mvn test -Dtest=RegisterTest
echo "============================================================================"
echo "   HOAN THANH TEST CHUC NANG 2! Nhan Enter de dong cua so nay..."
echo "============================================================================"
read -r
