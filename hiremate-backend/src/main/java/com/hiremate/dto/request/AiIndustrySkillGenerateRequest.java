package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;
import com.hiremate.dto.response.SkillItemDTO;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiIndustrySkillGenerateRequest {

    @NotBlank(message = "Tên ngành nghề không được để trống")
    private String industryName;

    // previewOnly: true = Chỉ yêu cầu AI sinh danh sách đề xuất & kiểm tra trùng lặp (CHƯA lưu vào DB)
    private Boolean previewOnly;

    // selectedSkills: Danh sách các kỹ năng quản trị viên ĐÃ TÍCH CHỌN sau khi xem xét preview
    private List<SkillItemDTO> selectedSkills;
}

