package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * SUBCLASS của Users – lưu thông tin hồ sơ riêng của Nhà tuyển dụng.
 * Shared Primary Key: recruiter_id = user_id (Table-per-Subclass / Joined Inheritance).
 * FK Mapping: jobs.recruiter_id và companies.recruiter_id ĐỀU trỏ về recruiters.recruiter_id
 */
@Entity
@Table(name = "recruiters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recruiter {

    /**
     * PK đồng thời là FK -> users.user_id (Shared PK / Joined pattern).
     * Không dùng @GeneratedValue vì giá trị lấy từ users.user_id.
     */
    @Id
    @Column(name = "recruiter_id")
    private Long recruiterId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "recruiter_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "position", length = 200)
    private String position;

    @Column(name = "department", length = 150)
    private String department;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
