package com.hiremate.dto.response;

import com.hiremate.enums.CvParseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvResponse {
    private Long cvId;
    private Long candidateId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Integer fileSizeBytes;
    private CvParseStatus parseStatus;
    private Boolean isDefault;
    private String summary;
    private LocalDateTime createdAt;
}
