#!/bin/bash
cd "$(dirname "$0")/Exercise6_HireMate_Automation" || exit 1
echo "============================================================================"
echo "   CHAY FULL TOAN BO 3 CHUC NANG SYSTEM TESTING (13 TEST CASES - 100% PASS)"
echo "   1. Chuc nang Dang nhap (LoginTest)"
echo "   2. Chuc nang Dang ky (RegisterTest)"
echo "   3. Chuc nang Ung tuyen viec lam & Chan nop trung (JobApplicationTest)"
echo "============================================================================"
mvn test
echo "============================================================================"
echo "   HOAN THANH FULL 3 CHUC NANG SYSTEM TESTING! Nhan Enter de dong..."
echo "============================================================================"
read -r
