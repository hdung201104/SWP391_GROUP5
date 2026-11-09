#!/bin/bash
cd "$(dirname "$0")/Exercise6_HireMate_Automation" || exit 1
echo "============================================================================"
echo "   DEMO CHUC NANG 3: UNG TUYEN TOAN TRINH & BUSINESS RULE SINGLE APPLICATION"
echo "   - Test 1 (Happy Path): Dang nhap -> Chon Job -> Chon CV -> Nop don thanh cong"
echo "   - Test 2 (Negative Rule): Chan nop don lan 2 vao cung 1 cong viec"
echo "============================================================================"
mvn test -Dtest=JobApplicationTest
echo "============================================================================"
echo "   HOAN THANH TEST CHUC NANG 3! Nhan Enter de dong cua so nay..."
echo "============================================================================"
read -r
