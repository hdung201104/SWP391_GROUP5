package com.hiremate.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
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
    @JsonAlias({"newStatus", "applicationStatus", "stage"})
    private ApplicationStatus status;

    @JsonAlias({"note", "comment", "reason"})
    private String notes;

    public void setNewStatus(ApplicationStatus newStatus) {
        if (this.status == null) {
            this.status = newStatus;
        }
    }

    public void setNote(String note) {
        if (this.notes == null) {
            this.notes = note;
        }
    }
}
