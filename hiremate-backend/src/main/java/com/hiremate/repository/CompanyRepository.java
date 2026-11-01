package com.hiremate.repository;

import com.hiremate.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByRecruiterId(Long recruiterId);
    Optional<Company> findFirstByTaxCodeIgnoreCase(String taxCode);
    Optional<Company> findFirstByCompanyNameIgnoreCase(String companyName);
    java.util.List<Company> findAllByOrderByCreatedAtDesc();
    long countByStatus(com.hiremate.enums.CompanyStatus status);
    long countByStatusIn(java.util.Collection<com.hiremate.enums.CompanyStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Company c WHERE " +
            "(:taxCode IS NOT NULL AND :taxCode != '' AND LOWER(c.taxCode) = LOWER(:taxCode)) OR " +
            "(:keyword IS NOT NULL AND :keyword != '' AND (LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "ORDER BY c.createdAt DESC")
    java.util.List<Company> lookupCompanies(@org.springframework.data.repository.query.Param("keyword") String keyword,
                                           @org.springframework.data.repository.query.Param("taxCode") String taxCode);
}
