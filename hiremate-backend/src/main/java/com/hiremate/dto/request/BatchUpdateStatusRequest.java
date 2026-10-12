package com.hiremate.dto.request;

import com.hiremate.enums.ApplicationStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateStatusRequest {

    @NotEmpty(message = "Danh sách applicationId không được rỗng")
    private List<Long> applicationIds;

    @NotNull(message = "Trạng thái mới không được để trống")
    private ApplicationStatus status;

    private String notes;
}
