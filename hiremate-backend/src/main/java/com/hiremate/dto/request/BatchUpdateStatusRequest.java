package com.hiremate.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.hiremate.enums.ApplicationStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateStatusRequest {

    @NotEmpty(message = "Danh sách applicationId không được rỗng")
    private List<Long> applicationIds;

    @NotNull(message = "Trạng thái mới không được để trống")
    @JsonAlias({"newStatus", "stage"})
    private ApplicationStatus status;

    @JsonAlias({"note", "reason"})
    private String notes;

    public void setStatus(Object val) {
        if (val == null) {
            this.status = null;
        } else if (val instanceof ApplicationStatus) {
            this.status = (ApplicationStatus) val;
        } else {
            String str = val.toString().trim().toUpperCase();
            if ("INTERVIEW".equals(str)) str = "INTERVIEWING";
            if ("PASSED".equals(str)) str = "OFFERED";
            if ("NEW".equals(str)) str = "APPLIED";
            if ("REVIEWING".equals(str)) str = "SCREENING";
            try {
                this.status = ApplicationStatus.valueOf(str);
            } catch (Exception ignored) {}
        }
    }

    public ApplicationStatus getNewStatus() {
        return this.status;
    }

    public void setNewStatus(Object val) {
        setStatus(val);
    }
}

