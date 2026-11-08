package com.hiremate.testng;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.AdminSettingsDTO;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.Skill;
import com.hiremate.entity.User;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.EmploymentType;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.NotificationType;
import com.hiremate.enums.SkillImportance;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.AiJobMatchRepository;
import com.hiremate.repository.ApplicationRepository;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.NotificationService;
import com.hiremate.service.SystemSettingsService;
import com.hiremate.service.impl.JobServiceImpl;
import org.springframework.test.util.ReflectionTestUtils;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * ==============================================================================
 * HIREMATE AI - MAXIMUM BRANCH COVERAGE SUITE (MINIMAL TEST CASES: 8 PER
 * FUNCTION)
 * Architecture Formula:
 * Branch Coverage Tối Đa = (3 Tests Exception Điểm Nóng) + (5 Tests Deep-Path
 * Đảo Cờ TRUE/FALSE Song Song)
 * Total: 24 Test Cases across 3 Core Methods:
 * 1. createJob(JobCreateRequest, User) -> 8 Cases (C01 - C08)
 * 2. updateJob(Long, JobCreateRequest, User) -> 8 Cases (U01 - U08)
 * 3. getPublishedJobs(String, String) -> 8 Cases (S01 - S08)
 * Framework: TestNG 7.9.0 + Mockito (Isolated, in-memory, no production DB)
 * ==============================================================================
 */
public class JobServiceDesignTestNGTest {

    private JobRepository jobRepository;
    private JobSkillRepository jobSkillRepository;
    private SkillRepository skillRepository;
    private RecruiterRepository recruiterRepository;
    private ApplicationRepository applicationRepository;
    private NotificationService notificationService;
    private CompanyRepository companyRepository;
    private SystemSettingsService systemSettingsService;
    private AiJobMatchRepository aiJobMatchRepository;

    private JobServiceImpl jobService;

    private User sampleRecruiterUser;
    private Recruiter sampleRecruiter;
    private Company sampleVerifiedCompany;

    @BeforeMethod
    public void setUp() {
        jobRepository = mock(JobRepository.class);
        jobSkillRepository = mock(JobSkillRepository.class);
        skillRepository = mock(SkillRepository.class);
        recruiterRepository = mock(RecruiterRepository.class);
        applicationRepository = mock(ApplicationRepository.class);
        notificationService = mock(NotificationService.class);
        companyRepository = mock(CompanyRepository.class);
        systemSettingsService = mock(SystemSettingsService.class);
        aiJobMatchRepository = mock(AiJobMatchRepository.class);

        jobService = new JobServiceImpl(
                jobRepository,
                jobSkillRepository,
                skillRepository,
                recruiterRepository,
                applicationRepository,
                notificationService);

        ReflectionTestUtils.setField(jobService, "companyRepository", companyRepository);
        ReflectionTestUtils.setField(jobService, "systemSettingsService", systemSettingsService);
        ReflectionTestUtils.setField(jobService, "aiJobMatchRepository", aiJobMatchRepository);

        sampleRecruiterUser = User.builder()
                .userId(301L)
                .email("recruiter@fpt.com")
                .fullName("Tran Van HR")
                .role(UserRole.RECRUITER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleVerifiedCompany = Company.builder()
                .companyId(10L)
                .companyName("FPT Software")
                .status(CompanyStatus.VERIFIED)
                .build();

        sampleRecruiter = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(sampleVerifiedCompany)
                .branchName("F-Complex Da Nang")
                .build();

        AdminSettingsDTO defaultSettings = new AdminSettingsDTO();
        defaultSettings.setRequireGpkdToPost(true);
        defaultSettings.setModerateNewJobs(false);
        defaultSettings.setAutoPublishVerified(true);
        when(systemSettingsService.getSettings()).thenReturn(defaultSettings);

        when(skillRepository.findBySkillNameIgnoreCase(anyString())).thenAnswer(inv -> {
            String name = inv.getArgument(0);
            return Optional.of(Skill.builder().skillId(101L).skillName(name).build());
        });
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
            Skill s = inv.getArgument(0);
            if (s.getSkillId() == null)
                s.setSkillId(101L);
            return s;
        });
    }

    private JobCreateRequest buildJobReq(String title, Integer vacancies, BigDecimal minSal, BigDecimal maxSal,
            LocalDate deadline) {
        JobCreateRequest req = new JobCreateRequest();
        req.setTitle(title);
        req.setDescription("Mô tả công việc mẫu chuẩn kỹ thuật");
        req.setRequirements("Yêu cầu ứng viên thành thạo Java và Spring Boot");
        req.setBenefits("Chế độ bảo hiểm và đãi ngộ hấp dẫn");
        req.setLocation("Da Nang");
        req.setEmploymentType(EmploymentType.FULL_TIME);
        req.setVacanciesCount(vacancies);
        req.setSalaryMin(minSal);
        req.setSalaryMax(maxSal);
        req.setDeadlineDate(deadline);
        req.setStatus(JobStatus.PUBLISHED);
        return req;
    }

    // ==========================================================================
    // FUNCTION 1: createJob(JobCreateRequest, User)
    // Formula: 3 Exception Tests + 5 Deep-Path Tests = 8 Tests
    // ==========================================================================

    @Test(description = "JOB-C01 [Exception 1]: Validation fault - vacanciesCount = 0 throws IllegalArgumentException")
    public void test_JOB_C01_createJob_VacanciesZero_ThrowsException() {
        JobCreateRequest req = buildJobReq("Java Dev", 0, BigDecimal.ZERO, new BigDecimal("20000000"),
                LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }


    @Test(description = "JOB-C02 [Exception 2]: Data integrity fault - Recruiter profile missing throws IllegalStateException")
    public void test_JOB_C02_createJob_RecruiterNotFound_ThrowsIllegalStateException() {
        when(recruiterRepository.findById(301L)).thenReturn(Optional.empty());
        JobCreateRequest req = buildJobReq("Backend Dev", 1, BigDecimal.ZERO, new BigDecimal("20000000"),
                LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalStateException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }


    @Test(description = "JOB-C03 [Exception 3]: Legal guard fault - Company status PENDING throws IllegalArgumentException")
    public void test_JOB_C03_createJob_CompanyPending_ThrowsIllegalArgumentException() {
        Company pendingComp = Company.builder().companyId(13L).companyName("Pending Corp").status(CompanyStatus.PENDING)
                .build();
        Recruiter rec = Recruiter.builder().recruiterId(301L).company(pendingComp).build();
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(rec));

        JobCreateRequest req = buildJobReq("Backend Dev", 2, BigDecimal.ZERO, new BigDecimal("20000000"),
                LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }


    @Test(description = "JOB-C04 [Deep-Path 1]: Full payload, auto publish, Company ACTIVE, all custom fields set (All TRUE branches)")
    public void test_JOB_C04_createJob_DeepPath_FullPayload_AutoPublish_CompanyActive() {
        Company activeComp = Company.builder().companyId(11L).companyName("Active Corp").status(CompanyStatus.ACTIVE)
                .build();
        Recruiter rec = Recruiter.builder().recruiterId(301L).user(sampleRecruiterUser).company(activeComp).build();
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(rec));

        AdminSettingsDTO settings = new AdminSettingsDTO();
        settings.setRequireGpkdToPost(true);
        settings.setModerateNewJobs(true);
        settings.setAutoPublishVerified(true);
        when(systemSettingsService.getSettings()).thenReturn(settings);

        JobCreateRequest req = buildJobReq("AI Lead", 5, new BigDecimal("25000000"), new BigDecimal("50000000"),
                LocalDate.now().plusDays(30));
        req.setBranchName("Chi nhánh Hà Nội");
        req.setSalaryCurrency("USD");
        req.setCategory("Artificial Intelligence");
        req.setMandatorySkills(List.of("Java"));
        req.setPreferredSkills(List.of("Docker"));
        req.setMandatorySkillIds(List.of(101L));

        Job savedJob = Job.builder()
                .jobId(704L)
                .title(req.getTitle())
                .recruiter(rec)
                .company(activeComp)
                .branchName("Chi nhánh Hà Nội")
                .salaryCurrency("USD")
                .jobCategory("Artificial Intelligence")
                .vacanciesCount(5)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();
        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        JobResponse res = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(res.getStatus(), JobStatus.PUBLISHED);
        Assert.assertEquals(res.getApprovalStatus(), JobApprovalStatus.APPROVED);
        verify(jobRepository).save(any(Job.class));
        verify(notificationService).createNotification(eq(301L), eq(NotificationType.SYSTEM_ALERT), anyString(),
                anyString(), eq(704L), eq("jobs"));
    }


    @Test(description = "JOB-C05 [Deep-Path 2]: Minimal payload, company fallback lookup, moderation disabled, recruiter branch fallback (All FALSE branches)")
    public void test_JOB_C05_createJob_DeepPath_MinimalPayload_FallbackCompany_TurnOffModeration() {
        Recruiter recWithoutCompany = Recruiter.builder().recruiterId(301L).user(sampleRecruiterUser).company(null)
                .branchName("Trụ sở chính").build();
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recWithoutCompany));
        when(companyRepository.findByRecruiterId(301L)).thenReturn(Optional.of(sampleVerifiedCompany));

        AdminSettingsDTO settings = new AdminSettingsDTO();
        settings.setRequireGpkdToPost(true);
        settings.setModerateNewJobs(false); // Moderation off
        when(systemSettingsService.getSettings()).thenReturn(settings);

        JobCreateRequest req = buildJobReq("Java Software Engineer", null, new BigDecimal("10000000"),
                new BigDecimal("25000000"), LocalDate.now().plusDays(10));
        req.setBranchName(null); // tests fallback to recruiter branch
        req.setSalaryCurrency(null); // tests default VND
        req.setCategory(null); // tests inferred category
        req.setVacanciesCount(null); // tests default 1

        Job savedJob = Job.builder()
                .jobId(705L)
                .title(req.getTitle())
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .vacanciesCount(1)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();
        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        JobResponse res = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(res.getStatus(), JobStatus.PUBLISHED);
        verify(recruiterRepository).save(recWithoutCompany);
        verify(jobRepository).save(any(Job.class));
    }


    @Test(description = "JOB-C06 [Deep-Path 3]: Admin role bypasses legal guard, Company VERIFIED, tertiary literal fallback for branch")
    public void test_JOB_C06_createJob_DeepPath_AdminBypass_CompanyVerified_TertiaryFallbacks() {
        User adminUser = User.builder().userId(1L).fullName("System Admin").role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE).build();
        Recruiter adminRec = Recruiter.builder().recruiterId(1L).user(adminUser).company(sampleVerifiedCompany)
                .branchName(null).build();
        when(recruiterRepository.findById(1L)).thenReturn(Optional.of(adminRec));

        JobCreateRequest req = buildJobReq("Tech Lead", 1, new BigDecimal("30000000"), new BigDecimal("60000000"),
                LocalDate.now().plusDays(30));
        req.setBranchName(null); // Both request & recruiter branch null -> falls back to "Trụ sở chính"
        req.setSalaryCurrency("   "); // Blank currency string
        req.setCategory("   "); // Blank category string

        Job savedJob = Job.builder()
                .jobId(706L)
                .title(req.getTitle())
                .recruiter(adminRec)
                .company(sampleVerifiedCompany)
                .branchName("Trụ sở chính")
                .salaryCurrency("VND")
                .jobCategory("Information Technology")
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();
        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        JobResponse res = jobService.createJob(req, adminUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(res.getStatus(), JobStatus.PUBLISHED);
        verify(jobRepository).save(any(Job.class));
    }

    @Test(description = "JOB-C07 [Deep-Path 4]: Manual admin approval flow (moderateOn, autoPublishOff) -> DRAFT+PENDING, notification exception caught")
    public void test_JOB_C07_createJob_DeepPath_ManualApproval_DraftPending_NotificationResilient() {
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));

        AdminSettingsDTO settings = new AdminSettingsDTO();
        settings.setRequireGpkdToPost(true);
        settings.setModerateNewJobs(true);
        settings.setAutoPublishVerified(false);
        when(systemSettingsService.getSettings()).thenReturn(settings);

        JobCreateRequest req = buildJobReq("AI Specialist", 3, new BigDecimal("20000000"), new BigDecimal("45000000"),
                LocalDate.now().plusDays(20));
        req.setBranchName("Chi nhánh Đà Nẵng");
        req.setSalaryCurrency("USD");
        req.setCategory("Data Science");

        Job pendingJob = Job.builder()
                .jobId(707L)
                .title(req.getTitle())
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .branchName("Chi nhánh Đà Nẵng")
                .salaryCurrency("USD")
                .jobCategory("Data Science")
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.PENDING)
                .build();
        when(jobRepository.save(any(Job.class))).thenReturn(pendingJob);
        doThrow(new RuntimeException("Notification Gateway Timeout")).when(notificationService).notifyAdmins(any(),
                anyString(), anyString(), anyLong(), anyString());

        JobResponse res = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(res.getStatus(), JobStatus.DRAFT);
        Assert.assertEquals(res.getApprovalStatus(), JobApprovalStatus.PENDING);
        verify(notificationService).notifyAdmins(eq(NotificationType.SYSTEM_ALERT), anyString(), anyString(), eq(707L),
                eq("jobs"));
    }

    @Test(description = "JOB-C08 [Deep-Path 5]: SystemSettings null guard defaults booleans, infer category null fallback")
    public void test_JOB_C08_createJob_DeepPath_SettingsNullGuard_InferFallback() {
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));
        when(systemSettingsService.getSettings()).thenReturn(null); // Settings null guard

        JobCreateRequest req = buildJobReq("Junior Developer", 2, new BigDecimal("8000000"), new BigDecimal("15000000"),
                LocalDate.now().plusDays(14));
        req.setBranchName("   ");
        req.setSalaryCurrency("VND");
        req.setCategory("Other");

        Job savedJob = Job.builder()
                .jobId(708L)
                .title(req.getTitle())
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();
        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        JobResponse res = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        verify(jobRepository).save(any(Job.class));
    }

    // ==========================================================================
    // FUNCTION 2: updateJob(Long, JobCreateRequest, User)
    // Formula: 3 Exception Tests + 5 Deep-Path Tests = 8 Tests
    // ==========================================================================

    @Test(description = "JOB-U01 [Exception 1]: Security fault - Unauthorized recruiter throws SecurityException")
    public void test_JOB_U01_updateJob_UnauthorizedRecruiter_ThrowsSecurityException() {
        User strangerUser = User.builder().userId(999L).role(UserRole.RECRUITER).build();
        Job existingJob = Job.builder().jobId(801L).recruiter(sampleRecruiter).company(sampleVerifiedCompany).build();
        when(jobRepository.findById(801L)).thenReturn(Optional.of(existingJob));

        JobCreateRequest req = buildJobReq("Updated Title", 2, BigDecimal.ZERO, new BigDecimal("20000000"),
                LocalDate.now().plusDays(10));
        Assert.assertThrows(SecurityException.class, () -> jobService.updateJob(801L, req, strangerUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-U02 [Exception 2]: 404 Missing resource fault - Job ID not found throws IllegalArgumentException")
    public void test_JOB_U02_updateJob_JobNotFound_ThrowsIllegalArgumentException() {
        when(jobRepository.findById(9999L)).thenReturn(Optional.empty());
        JobCreateRequest req = buildJobReq("Updated Title", 2, BigDecimal.ZERO, new BigDecimal("20000000"),
                LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class,
                () -> jobService.updateJob(9999L, req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-U03 [Exception 3]: Validation fault - vacanciesCount = 0 in update throws IllegalArgumentException")
    public void test_JOB_U03_updateJob_VacanciesZero_ThrowsIllegalArgumentException() {
        JobCreateRequest req = buildJobReq("Updated Title", 0, BigDecimal.ZERO, new BigDecimal("20000000"),
                LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.updateJob(801L, req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }


    @Test(description = "JOB-U04 [Deep-Path 1]: Previously REJECTED job resets to DRAFT+PENDING and initial skills creation")
    public void test_JOB_U04_updateJob_DeepPath_RejectedJobReset_AndInitialSkillsCreation() {
        Job rejectedJob = Job.builder()
                .jobId(804L)
                .title("Old Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.REJECTED)
                .build();
        when(jobRepository.findById(804L)).thenReturn(Optional.of(rejectedJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jobSkillRepository.findByJobId(804L)).thenReturn(Collections.emptyList()); // tests !hasExistingSkills
                                                                                        // branch

        JobCreateRequest req = buildJobReq("Fixed Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"),
                LocalDate.now().plusDays(10));
        JobResponse res = jobService.updateJob(804L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(rejectedJob.getApprovalStatus(), JobApprovalStatus.PENDING);
        Assert.assertEquals(rejectedJob.getStatus(), JobStatus.DRAFT);
    }


    @Test(description = "JOB-U05 [Deep-Path 2]: Expired job protected from PUBLISHED (forced to DRAFT), and explicit status CLOSED")
    public void test_JOB_U05_updateJob_DeepPath_ExpiredJobProtected_AndCustomStatusDirect() {
        Company activeComp = Company.builder().companyId(10L).companyName("Active Corp").status(CompanyStatus.ACTIVE)
                .build();
        Job existingJob = Job.builder()
                .jobId(805L)
                .title("Old Title")
                .recruiter(sampleRecruiter)
                .company(activeComp)
                .status(JobStatus.CLOSED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().minusDays(5)) // Expired
                .build();
        when(jobRepository.findById(805L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobCreateRequest req = buildJobReq("Updated Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"),
                null);
        req.setStatus(JobStatus.PUBLISHED); // Attempting to publish an expired job -> forces DRAFT!

        JobResponse res = jobService.updateJob(805L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.DRAFT);

        // Test explicit CLOSED status and hasSkillInput = false
        req.setStatus(JobStatus.CLOSED);
        req.setMandatorySkills(null);
        req.setPreferredSkills(null);
        req.setMandatorySkillIds(null);
        req.setPreferredSkillIds(null);
        jobService.updateJob(805L, req, sampleRecruiterUser);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.CLOSED);
    }


    @Test(description = "JOB-U06 [Deep-Path 3]: CLOSED job reopens to PUBLISHED with null deadline & null approvalStatus, quota checked")
    public void test_JOB_U06_updateJob_DeepPath_ReopenClosedJob_QuotaCheck_AndCustomFields() {
        Job closedJob = Job.builder()
                .jobId(806L)
                .title("Closed Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.CLOSED)
                .approvalStatus(null) // null approvalStatus branch
                .deadlineDate(null) // null deadlineDate branch
                .build();
        when(jobRepository.findById(806L)).thenReturn(Optional.of(closedJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobCreateRequest req = buildJobReq("Reopened Title", 3, new BigDecimal("12000000"), new BigDecimal("30000000"),
                LocalDate.now().plusDays(20));
        req.setBranchName("Chi nhánh 2");
        req.setSalaryCurrency("USD");
        req.setCategory("Software Engineering");
        req.setStatus(null); // Triggers auto reopen

        JobResponse res = jobService.updateJob(806L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(closedJob.getStatus(), JobStatus.PUBLISHED);
        Assert.assertEquals(closedJob.getBranchName(), "Chi nhánh 2");
        Assert.assertEquals(closedJob.getSalaryCurrency(), "USD");
        Assert.assertEquals(closedJob.getJobCategory(), "Software Engineering");
        verify(jobRepository, atLeastOnce()).save(closedJob);
    }


    @Test(description = "JOB-U07 [Deep-Path 4]: Full skills update with all 4 input formats, whitespace items, AI cache exception")
    public void test_JOB_U07_updateJob_DeepPath_FullSkillsShift_AllFourInputs_AiCacheException() {
        Job existingJob = Job.builder()
                .jobId(807L)
                .title("Java Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();
        when(jobRepository.findById(807L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobSkill oldSkill = JobSkill.builder().jobId(807L).skillId(101L).importance(SkillImportance.MANDATORY).build();
        when(jobSkillRepository.findByJobId(807L)).thenReturn(List.of(oldSkill));
        when(skillRepository.findAllById(List.of(101L)))
                .thenReturn(List.of(Skill.builder().skillId(101L).skillName("Java").build()));

        JobCreateRequest req = buildJobReq("Updated Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"),
                LocalDate.now().plusDays(10));
        req.setMandatorySkills(Arrays.asList("Java", "   ")); // has blank item to cover filter
        req.setPreferredSkills(Arrays.asList("Docker", "   ")); // has blank item to cover filter
        req.setMandatorySkillIds(List.of(101L, 102L));
        req.setPreferredSkillIds(List.of(103L));

        Skill skill101 = Skill.builder().skillId(101L).skillName("Java").build();
        Skill skill102 = Skill.builder().skillId(102L).skillName("Spring").build();
        Skill skill103 = Skill.builder().skillId(103L).skillName("Docker").build();
        when(skillRepository.findAllById(List.of(101L, 102L))).thenReturn(List.of(skill101, skill102));
        when(skillRepository.findAllById(List.of(103L))).thenReturn(List.of(skill103));

        doThrow(new RuntimeException("DB Connection Timeout on delete")).when(aiJobMatchRepository)
                .deleteByJob_JobId(807L);

        JobResponse res = jobService.updateJob(807L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        verify(jobSkillRepository).deleteByJobId(807L);
        verify(aiJobMatchRepository).deleteByJob_JobId(807L);
    }


    @Test(description = "JOB-U08 [Deep-Path 5]: Identical skills optimization skips DB updates, category inference fallback, null vacancies")
    public void test_JOB_U08_updateJob_DeepPath_IdenticalSkillsOptimization_AndInferredIndustry() {
        Job existingJob = Job.builder()
                .jobId(808L)
                .title("Java Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .jobCategory(null) // Tests inference
                .build();
        when(jobRepository.findById(808L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobSkill oldSkill = JobSkill.builder().jobId(808L).skillId(101L).importance(SkillImportance.MANDATORY).build();
        when(jobSkillRepository.findByJobId(808L)).thenReturn(List.of(oldSkill));
        when(skillRepository.findAllById(List.of(101L)))
                .thenReturn(List.of(Skill.builder().skillId(101L).skillName("Java").build()));

        JobCreateRequest req = buildJobReq("Updated Title", null, new BigDecimal("10000000"),
                new BigDecimal("25000000"), null);
        req.setVacanciesCount(null); // null vacanciesCount branch
        req.setDeadlineDate(null); // null deadlineDate branch
        req.setMandatorySkills(List.of("Java")); // Identical skill name
        req.setBranchName(null); // Keeps old branch name
        req.setSalaryCurrency(null); // Keeps old currency
        req.setCategory(null); // Inferred category fallback

        JobResponse res = jobService.updateJob(808L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        verify(jobSkillRepository, never()).deleteByJobId(808L);
        verify(aiJobMatchRepository, never()).deleteByJob_JobId(808L);
    }

    // ==========================================================================
    // FUNCTION 3: getPublishedJobs(String, String) — 8 TEST CASES
    // ==========================================================================

    @Test(description = "JOB-S01: Both null filters returns all PUBLISHED jobs via findByStatus")
    public void test_JOB_S01_getPublishedJobs_NoFilter_ReturnsPublished() {
        Job job = Job.builder().jobId(901L).title("Fullstack Dev").status(JobStatus.PUBLISHED).build();
        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs(null, null);

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        Assert.assertEquals(result.get(0).getJobId(), Long.valueOf(901L));
        verify(jobRepository).findByStatus(JobStatus.PUBLISHED);
        verify(jobRepository, never()).searchJobs(any(), any());
    }

    @Test(description = "JOB-S02: Keyword only filter invokes searchJobs with keyword and null location")
    public void test_JOB_S02_getPublishedJobs_KeywordOnly_ReturnsMatching() {
        Job job = Job.builder().jobId(902L).title("Java Backend").status(JobStatus.PUBLISHED).build();
        when(jobRepository.searchJobs("Java", null)).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs("Java", null);

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        verify(jobRepository).searchJobs("Java", null);
    }

    @Test(description = "JOB-S03: Location only filter invokes searchJobs with null keyword and location")
    public void test_JOB_S03_getPublishedJobs_LocationOnly_ReturnsMatching() {
        Job job = Job.builder().jobId(903L).title("NodeJS Dev").location("Da Nang").status(JobStatus.PUBLISHED).build();
        when(jobRepository.searchJobs(null, "Da Nang")).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs(null, "Da Nang");

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        verify(jobRepository).searchJobs(null, "Da Nang");
    }

    @Test(description = "JOB-S04: Both keyword and location filters invoke searchJobs with both parameters")
    public void test_JOB_S04_getPublishedJobs_BothFilters_ReturnsMatching() {
        Job job = Job.builder().jobId(904L).title("Java Dev").location("Da Nang").status(JobStatus.PUBLISHED).build();
        when(jobRepository.searchJobs("Java", "Da Nang")).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs("Java", "Da Nang");

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        verify(jobRepository).searchJobs("Java", "Da Nang");
    }

    @Test(description = "JOB-S05: Blank keyword and valid location treated as location only filter")
    public void test_JOB_S05_getPublishedJobs_BlankKeyword_ValidLocation() {
        Job job = Job.builder().jobId(905L).title("Go Dev").location("Ho Chi Minh").status(JobStatus.PUBLISHED).build();
        when(jobRepository.searchJobs(null, "Ho Chi Minh")).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs("   ", "Ho Chi Minh");

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        verify(jobRepository).searchJobs(null, "Ho Chi Minh");
    }

    @Test(description = "JOB-S06: Valid keyword and blank location treated as keyword only filter")
    public void test_JOB_S06_getPublishedJobs_ValidKeyword_BlankLocation() {
        Job job = Job.builder().jobId(906L).title("Frontend Dev").status(JobStatus.PUBLISHED).build();
        when(jobRepository.searchJobs("Frontend", null)).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs("Frontend", "   ");

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        verify(jobRepository).searchJobs("Frontend", null);
    }

    @Test(description = "JOB-S07: Both whitespace strings treated as no filter, invoking findByStatus")
    public void test_JOB_S07_getPublishedJobs_BothBlank_TreatedAsNoFilter() {
        Job job = Job.builder().jobId(907L).title("DevOps Engineer").status(JobStatus.PUBLISHED).build();
        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(List.of(job));

        List<JobResponse> result = jobService.getPublishedJobs("   ", "   ");

        Assert.assertNotNull(result);
        Assert.assertEquals(result.size(), 1);
        verify(jobRepository).findByStatus(JobStatus.PUBLISHED);
        verify(jobRepository, never()).searchJobs(any(), any());
    }

    @Test(description = "JOB-S08: Boundary check - Database returns empty list, returns empty response gracefully")
    public void test_JOB_S08_getPublishedJobs_EmptyResult_ReturnsEmptyList() {
        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(Collections.emptyList());

        List<JobResponse> result = jobService.getPublishedJobs(null, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isEmpty());
        verify(jobRepository).findByStatus(JobStatus.PUBLISHED);
    }
}
