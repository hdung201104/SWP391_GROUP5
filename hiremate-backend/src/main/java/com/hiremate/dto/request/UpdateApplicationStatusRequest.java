package com.hiremate.dto.request;

import com.hiremate.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateApplicationStatusRequest {
    @NotNull(message = "Status is required")
    private ApplicationStatus status;

    private String notes;
}
