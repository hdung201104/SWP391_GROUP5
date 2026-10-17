package com.hiremate.entity;

import com.hiremate.enums.CompanyStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "recruiter_id")
    private Long recruiterId;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "website", length = 300)
    private String website;

    @Column(name = "address", length = 300)
    private String address;

    @Column(name = "company_size", length = 50)
    private String companySize;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "license_doc_url", columnDefinition = "TEXT")
    private String licenseDocUrl;

    @Column(name = "license_doc_name", length = 255)
    private String licenseDocName;

    @Column(name = "legal_representative", length = 150)
    private String legalRepresentative;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CompanyStatus status = CompanyStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
