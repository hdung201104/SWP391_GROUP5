package com.hiremate.testng;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiremate.config.GeminiAiConfig;
import com.hiremate.dto.request.AiIndustrySkillGenerateRequest;
import com.hiremate.dto.request.AiJdSkillExtractRequest;
import com.hiremate.dto.response.AiIndustrySkillGenerateResponse;
import com.hiremate.dto.response.AiJdSkillExtractResponse;
import com.hiremate.dto.response.SkillItemDTO;
import com.hiremate.repository.CandidateSkillRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.impl.GeminiAiServiceImpl;
import com.hiremate.service.impl.SkillServiceImpl;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SkillTaxonomyUpgradeTestNGTest {

    private GeminiAiConfig geminiAiConfig;
    private ObjectMapper objectMapper;
    private GeminiAiServiceImpl geminiAiService;
    private SkillServiceImpl skillService;
    private SkillRepository skillRepository;
    private CandidateSkillRepository candidateSkillRepository;
    private JobSkillRepository jobSkillRepository;

    @BeforeMethod
    public void setUp() {
        geminiAiConfig = mock(GeminiAiConfig.class);
        // Không cấp key thật để test fallback heuristic cao cấp hoạt động độc lập không phụ thuộc mạng
        when(geminiAiConfig.getApiKeys()).thenReturn(Collections.emptyList());
        when(geminiAiConfig.getApiKey()).thenReturn(null);
        when(geminiAiConfig.getModel()).thenReturn("gemini-3-flash-preview");
        when(geminiAiConfig.getBaseUrl()).thenReturn("https://generativelanguage.googleapis.com/v1beta");

        objectMapper = new ObjectMapper();

        geminiAiService = new GeminiAiServiceImpl(geminiAiConfig, objectMapper, null, null);

        skillRepository = mock(SkillRepository.class);
        when(skillRepository.save(org.mockito.ArgumentMatchers.any(com.hiremate.entity.Skill.class)))
                .thenAnswer(inv -> {
                    com.hiremate.entity.Skill s = inv.getArgument(0);
                    if (s.getSkillId() == null) s.setSkillId(999L);
                    return s;
                });
        when(skillRepository.findBySkillNameIgnoreCase(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());
        when(skillRepository.findAll()).thenReturn(java.util.Collections.emptyList());

        candidateSkillRepository = mock(CandidateSkillRepository.class);
        jobSkillRepository = mock(JobSkillRepository.class);

        skillService = new SkillServiceImpl(skillRepository, candidateSkillRepository, jobSkillRepository, geminiAiService);
    }

    @Test
    public void testIsValidSkillName_AllowsComprehensiveVietnameseTitles() {
        // Kiểm tra các kỹ năng chuyên môn dài, có ngoặc đơn hoặc nhiều hơn 4 từ
        Assert.assertTrue(skillService.isValidSkillName("Nghiên cứu Khoa học & Công bố Quốc tế (Scopus/ISI)"),
                "Kỹ năng giáo dục có ngoặc đơn và 54 ký tự phải hợp lệ");

        Assert.assertTrue(skillService.isValidSkillName("Phương pháp Sư phạm & Giảng dạy Đại học"),
                "Kỹ năng giáo dục 39 ký tự, 7 từ phải hợp lệ");

        Assert.assertTrue(skillService.isValidSkillName("Soạn thảo & Đàm phán Hợp đồng Thương mại"),
                "Kỹ năng pháp chế phải hợp lệ");

        Assert.assertTrue(skillService.isValidSkillName("Bóc tách Khối lượng & Lập Dự toán (G8/Acitt)"),
                "Kỹ năng xây dựng có ngoặc đơn phải hợp lệ");

        Assert.assertTrue(skillService.isValidSkillName("Khai báo Hải quan Điện tử (VNACCS / VCIS)"),
                "Kỹ năng logistics có ngoặc đơn phải hợp lệ");

        // Các từ rác, mô tả quá dài (>65 ký tự) hoặc câu miêu tả vẫn phải bị chặn
        Assert.assertFalse(skillService.isValidSkillName("Đây là một mô tả công việc rất dài dòng và không phải là tên của một kỹ năng chuyên môn chuẩn quốc tế"),
                "Chuỗi quá dài (>65 ký tự) phải bị từ chối");

        Assert.assertFalse(skillService.isValidSkillName("kinh nghiệm làm việc"),
                "Từ rác 'kinh nghiệm làm việc' phải bị từ chối");
    }

    @Test
    public void testDetectCategory_NoAiSubstringFalsePositives() {
        // LỖI CŨ: Substring 'ai' khiến các từ như 'đại', 'khai', 'hải', 'tài' bị gán sai thành IT_SOFTWARE
        String eduCat = skillService.detectCategory("Phương pháp Sư phạm & Giảng dạy Đại học", null);
        Assert.assertEquals(eduCat, "EDUCATION_TRAINING", "Giảng dạy Đại học KHÔNG được rơi vào IT_SOFTWARE");

        String financeCat = skillService.detectCategory("Báo cáo Tài chính Doanh nghiệp", null);
        Assert.assertEquals(financeCat, "FINANCE_ACCOUNTING", "Báo cáo Tài chính KHÔNG được rơi vào IT_SOFTWARE do chữ 'tài'");

        String logisticsCat = skillService.detectCategory("Khai báo Hải quan & Thủ tục Xuất nhập khẩu", null);
        Assert.assertNotEquals(logisticsCat, "IT_SOFTWARE", "Khai báo Hải quan KHÔNG được rơi vào IT_SOFTWARE do chữ 'khai'/'hải'");

        // Công nghệ AI thực sự vẫn phải được nhận diện IT_SOFTWARE
        String realAiCat = skillService.detectCategory("Generative AI & LLMs", null);
        Assert.assertEquals(realAiCat, "IT_SOFTWARE", "Generative AI thực sự phải là IT_SOFTWARE");
    }

    @Test
    public void testIndustrySkillGeneration_NonItDomainsHaveZeroItPollution() {
        // 1. Giáo dục
        AiIndustrySkillGenerateRequest eduReq = AiIndustrySkillGenerateRequest.builder()
                .industryName("Giáo dục / Đào tạo")
                .previewOnly(true)
                .build();
        AiIndustrySkillGenerateResponse eduResp = skillService.generateSkillsForIndustry(eduReq);
        Assert.assertNotNull(eduResp);
        Assert.assertNotNull(eduResp.getGeneratedSkills());
        Assert.assertFalse(eduResp.getGeneratedSkills().isEmpty());
        for (SkillItemDTO item : eduResp.getGeneratedSkills()) {
            Assert.assertFalse(item.getSkillName().equalsIgnoreCase("Java"), "Giáo dục không được chứa Java");
            Assert.assertFalse(item.getSkillName().equalsIgnoreCase("React"), "Giáo dục không được chứa React");
            Assert.assertFalse(item.getSkillName().equalsIgnoreCase("PostgreSQL"), "Giáo dục không được chứa PostgreSQL");
        }

        // 2. Y tế / Dược phẩm
        AiIndustrySkillGenerateRequest medReq = AiIndustrySkillGenerateRequest.builder()
                .industryName("Y tế / Dược phẩm")
                .previewOnly(true)
                .build();
        AiIndustrySkillGenerateResponse medResp = skillService.generateSkillsForIndustry(medReq);
        Assert.assertNotNull(medResp);
        Assert.assertNotNull(medResp.getGeneratedSkills());
        for (SkillItemDTO item : medResp.getGeneratedSkills()) {
            Assert.assertFalse(item.getSkillName().equalsIgnoreCase("Docker"), "Y tế không được chứa Docker");
            Assert.assertFalse(item.getSkillName().equalsIgnoreCase("Spring Boot"), "Y tế không được chứa Spring Boot");
        }
    }

    @Test
    public void testJdSkillExtraction_EducationRoleExtractsStandardAcademicSkills() {
        AiJdSkillExtractRequest req = AiJdSkillExtractRequest.builder()
                .title("Giảng viên Khoa Kinh tế Quốc tế")
                .description("Yêu cầu giảng dạy các học phần Kinh tế vĩ mô, biên soạn đề cương môn học, nghiên cứu khoa học và công bố bài báo quốc tế.")
                .industry("Giáo dục / Đào tạo")
                .build();

        AiJdSkillExtractResponse resp = skillService.extractSkillsFromJd(req);
        Assert.assertNotNull(resp);
        Assert.assertNotNull(resp.getMandatorySkills());
        Assert.assertFalse(resp.getMandatorySkills().isEmpty());

        List<String> mandatoryNames = resp.getMandatorySkills().stream().map(SkillItemDTO::getSkillName).toList();
        // Phải chứa kỹ năng giảng dạy đại học hoặc nghiên cứu khoa học
        boolean hasTeachingSkill = mandatoryNames.stream().anyMatch(n -> {
            String lower = n.toLowerCase();
            return lower.contains("giảng dạy") || lower.contains("sư phạm") || lower.contains("nghiên cứu");
        });
        Assert.assertTrue(hasTeachingSkill, "Vị trí Giảng viên phải trích xuất được kỹ năng Giảng dạy/Sư phạm/Nghiên cứu: " + mandatoryNames);

        // Tuyệt đối không được chứa kỹ năng IT ngoại lai
        Assert.assertFalse(mandatoryNames.contains("Java 21"), "Giảng viên kinh tế không được có kỹ năng Java 21");
        Assert.assertFalse(mandatoryNames.contains("Spring Boot 3"), "Giảng viên kinh tế không được có kỹ năng Spring Boot 3");
    }

    @Test
    public void testJdSkillExtraction_LegalRoleExtractsCommercialLawSkills() {
        AiJdSkillExtractRequest req = AiJdSkillExtractRequest.builder()
                .title("Chuyên viên Pháp chế Hợp đồng")
                .description("Soạn thảo, thẩm tra hợp đồng kinh tế, tư vấn pháp luật doanh nghiệp và thẩm định rủi ro pháp lý.")
                .industry("Pháp lý / Luật sư")
                .build();

        AiJdSkillExtractResponse resp = skillService.extractSkillsFromJd(req);
        Assert.assertNotNull(resp);
        List<String> mandatoryNames = resp.getMandatorySkills().stream().map(SkillItemDTO::getSkillName).toList();
        boolean hasLawSkill = mandatoryNames.stream().anyMatch(n -> {
            String lower = n.toLowerCase();
            return lower.contains("hợp đồng") || lower.contains("pháp lý") || lower.contains("luật");
        });
        Assert.assertTrue(hasLawSkill, "Vị trí Pháp chế phải trích xuất được kỹ năng Luật/Hợp đồng/Pháp lý: " + mandatoryNames);
    }
}
