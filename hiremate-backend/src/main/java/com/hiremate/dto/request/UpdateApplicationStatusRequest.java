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

    public UpdateApplicationStatusRequest(ApplicationStatus status) {
        this.status = status;
    }

    public UpdateApplicationStatusRequest(ApplicationStatus status, String notes) {
        this.status = status;
        this.notes = notes;
    }

    @NotNull(message = "Status is required")
    @JsonAlias({"newStatus", "applicationStatus", "stage"})
    private ApplicationStatus status;

    @JsonAlias({"note", "comment", "reason"})
    private String notes;

    @JsonAlias({"custom_subject", "subject", "emailSubject"})
    private String customSubject;

    @JsonAlias({"custom_body", "body", "emailBody", "content"})
    private String customBody;

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
