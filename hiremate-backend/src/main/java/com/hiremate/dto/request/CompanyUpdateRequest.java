package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyUpdateRequest {

    @NotBlank(message = "Tên công ty không được để trống")
    private String companyName;

    private String logoUrl;
    private String website;
    private String address;
    private String companySize;
    private String description;
    private String industry;
}
