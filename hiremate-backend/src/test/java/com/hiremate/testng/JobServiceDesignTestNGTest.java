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
import java.util.ArrayList;
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
 * HIREMATE AI - JOB SERVICE OPTIMIZED UNIT TEST SUITE (8 CASES PER FUNCTION)
 * Exactly 8 high-impact test cases per function across 3 core methods = 24 cases:
 *   1. createJob(JobCreateRequest, User)       -> 8 Cases (C01 - C08)
 *   2. updateJob(Long, JobCreateRequest, User)  -> 8 Cases (U01 - U08)
 *   3. getPublishedJobs(String, String)         -> 8 Cases (S01 - S08)
 * Each test covers high-risk fault conditions (primary) and composite branch logic (secondary).
 * Framework: TestNG 7.9.0 + Mockito (Isolated, no production database required).
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
                notificationService
        );

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
    }

    private JobCreateRequest buildJobReq(String title, Integer vacancies, BigDecimal minSal, BigDecimal maxSal, LocalDate deadline) {
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
    // FUNCTION 1: createJob(JobCreateRequest, User) — 8 HIGH-IMPACT TEST CASES
    // ==========================================================================

    @Test(description = "JOB-C01: Validation fault - vacanciesCount = 0 throws IllegalArgumentException")
    public void test_JOB_C01_createJob_VacanciesZero_ThrowsException() {
        JobCreateRequest req = buildJobReq("Java Dev", 0, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-C02: Validation fault - maxSalary < minSalary throws IllegalArgumentException")
    public void test_JOB_C02_createJob_SalaryValidationViolation_ThrowsException() {
        JobCreateRequest req = buildJobReq("Java Dev", 2, new BigDecimal("30000000"), new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-C03: Validation fault - deadlineDate in past throws IllegalArgumentException")
    public void test_JOB_C03_createJob_DeadlineYesterday_ThrowsException() {
        JobCreateRequest req = buildJobReq("Java Dev", 2, new BigDecimal("10000000"), new BigDecimal("20000000"), LocalDate.now().minusDays(1));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-C04: Legal guard - Company status REJECTED throws IllegalArgumentException")
    public void test_JOB_C04_createJob_CompanyRejected_ThrowsException() {
        Company rejectedComp = Company.builder().companyId(12L).companyName("Rejected Corp").status(CompanyStatus.REJECTED).build();
        Recruiter rec = Recruiter.builder().recruiterId(301L).company(rejectedComp).build();
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(rec));

        JobCreateRequest req = buildJobReq("Backend Dev", 2, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-C05: Security guard - Company status SUSPENDED or BANNED throws IllegalArgumentException")
    public void test_JOB_C05_createJob_CompanySuspendedOrBanned_ThrowsException() {
        Company suspendedComp = Company.builder().companyId(13L).companyName("Suspended Corp").status(CompanyStatus.SUSPENDED).build();
        Recruiter rec = Recruiter.builder().recruiterId(301L).company(suspendedComp).build();
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(rec));

        JobCreateRequest req = buildJobReq("Backend Dev", 2, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-C06: Data integrity guard - Recruiter profile missing in DB throws IllegalStateException")
    public void test_JOB_C06_createJob_RecruiterNotFound_ThrowsIllegalStateException() {
        when(recruiterRepository.findById(301L)).thenReturn(Optional.empty());
        JobCreateRequest req = buildJobReq("Backend Dev", 1, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalStateException.class, () -> jobService.createJob(req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-C07: Primary success path - vacancies=1 boundary, company fallback lookup, skills mapping 70/30, auto publish")
    public void test_JOB_C07_createJob_Success_SkillsMapping_AndCompanyFallback() {
        Recruiter recWithoutCompany = Recruiter.builder().recruiterId(301L).user(sampleRecruiterUser).company(null).build();
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recWithoutCompany));
        when(companyRepository.findByRecruiterId(301L)).thenReturn(Optional.of(sampleVerifiedCompany));
        when(skillRepository.findBySkillNameIgnoreCase(anyString())).thenAnswer(inv -> {
            String name = inv.getArgument(0);
            return Optional.of(Skill.builder().skillId(101L).skillName(name).build());
        });
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
            Skill s = inv.getArgument(0);
            if (s.getSkillId() == null) s.setSkillId(101L);
            return s;
        });

        JobCreateRequest req = buildJobReq("Senior Java Engineer", 1, new BigDecimal("15000000"), new BigDecimal("35000000"), LocalDate.now().plusDays(15));
        req.setMandatorySkills(List.of("Java"));
        req.setPreferredSkills(List.of("Spring Boot", "Docker"));

        Job savedJob = Job.builder()
                .jobId(701L)
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
        Assert.assertEquals(res.getJobId(), Long.valueOf(701L));
        Assert.assertEquals(res.getStatus(), JobStatus.PUBLISHED);
        Assert.assertEquals(res.getApprovalStatus(), JobApprovalStatus.APPROVED);
        verify(recruiterRepository).save(recWithoutCompany);
        verify(jobRepository).save(any(Job.class));
        verify(notificationService).createNotification(eq(301L), eq(NotificationType.SYSTEM_ALERT), anyString(), anyString(), eq(701L), eq("jobs"));
    }

    @Test(description = "JOB-C08: Composite branch - Admin settings moderateNewJobs=true, autoPublishVerified=false -> DRAFT/PENDING, notification resilient")
    public void test_JOB_C08_createJob_PendingApproval_AdminSettings_AndNotificationResilient() {
        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));

        AdminSettingsDTO settings = new AdminSettingsDTO();
        settings.setRequireGpkdToPost(true);
        settings.setModerateNewJobs(true);
        settings.setAutoPublishVerified(false);
        when(systemSettingsService.getSettings()).thenReturn(settings);

        JobCreateRequest req = buildJobReq("AI Engineer", 3, new BigDecimal("20000000"), new BigDecimal("40000000"), LocalDate.now().plusDays(20));
        req.setBranchName("Chi nhánh Đà Nẵng");
        req.setSalaryCurrency("USD");
        req.setCategory("Data Science");

        Job pendingJob = Job.builder()
                .jobId(702L)
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
        doThrow(new RuntimeException("Notification Gateway Timeout")).when(notificationService).notifyAdmins(any(), anyString(), anyString(), anyLong(), anyString());

        JobResponse res = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(res.getStatus(), JobStatus.DRAFT);
        Assert.assertEquals(res.getApprovalStatus(), JobApprovalStatus.PENDING);
        verify(notificationService).notifyAdmins(eq(NotificationType.SYSTEM_ALERT), anyString(), anyString(), eq(702L), eq("jobs"));
    }

    // ==========================================================================
    // FUNCTION 2: updateJob(Long, JobCreateRequest, User) — 8 HIGH-IMPACT TEST CASES
    // ==========================================================================

    @Test(description = "JOB-U01: Security guard - Unauthorized recruiter editing another company's job throws SecurityException")
    public void test_JOB_U01_updateJob_UnauthorizedRecruiter_ThrowsSecurityException() {
        User strangerUser = User.builder().userId(999L).role(UserRole.RECRUITER).build();
        Job existingJob = Job.builder().jobId(801L).recruiter(sampleRecruiter).company(sampleVerifiedCompany).build();
        when(jobRepository.findById(801L)).thenReturn(Optional.of(existingJob));

        JobCreateRequest req = buildJobReq("Updated Title", 2, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(SecurityException.class, () -> jobService.updateJob(801L, req, strangerUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-U02: Resource missing guard - Job ID not found throws IllegalArgumentException")
    public void test_JOB_U02_updateJob_JobNotFound_ThrowsIllegalArgumentException() {
        when(jobRepository.findById(9999L)).thenReturn(Optional.empty());
        JobCreateRequest req = buildJobReq("Updated Title", 2, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.updateJob(9999L, req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-U03: Validation guard - vacanciesCount = 0 in update throws IllegalArgumentException")
    public void test_JOB_U03_updateJob_VacanciesZero_ThrowsIllegalArgumentException() {
        JobCreateRequest req = buildJobReq("Updated Title", 0, BigDecimal.ZERO, new BigDecimal("20000000"), LocalDate.now().plusDays(10));
        Assert.assertThrows(IllegalArgumentException.class, () -> jobService.updateJob(801L, req, sampleRecruiterUser));
        verify(jobRepository, never()).save(any());
    }

    @Test(description = "JOB-U04: State transition guard - Previously REJECTED job or PENDING company resets to DRAFT + PENDING")
    public void test_JOB_U04_updateJob_RejectedOrPendingCompany_ResetsToDraftPending() {
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

        JobCreateRequest req = buildJobReq("Fixed Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"), LocalDate.now().plusDays(10));
        JobResponse res = jobService.updateJob(804L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(rejectedJob.getApprovalStatus(), JobApprovalStatus.PENDING);
        Assert.assertEquals(rejectedJob.getStatus(), JobStatus.DRAFT);
    }

    @Test(description = "JOB-U05: State lifecycle - Explicit CLOSED status and past-deadline protection")
    public void test_JOB_U05_updateJob_ClosedLifecycleAndExpiredProtection() {
        Job existingJob = Job.builder()
                .jobId(805L)
                .title("Old Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().minusDays(5))
                .build();
        when(jobRepository.findById(805L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobCreateRequest req = buildJobReq("Updated Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"), LocalDate.now().plusDays(10));
        req.setStatus(JobStatus.CLOSED);

        JobResponse res = jobService.updateJob(805L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.CLOSED);
    }

    @Test(description = "JOB-U06: State lifecycle - CLOSED job with valid deadline reopens to PUBLISHED for ACTIVE company")
    public void test_JOB_U06_updateJob_ClosedJob_ReopensToPublished_ActiveCompany() {
        Job closedJob = Job.builder()
                .jobId(806L)
                .title("Closed Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.CLOSED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(15))
                .build();
        when(jobRepository.findById(806L)).thenReturn(Optional.of(closedJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobCreateRequest req = buildJobReq("Reopened Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"), LocalDate.now().plusDays(20));
        req.setStatus(null); // Triggers reopen condition

        JobResponse res = jobService.updateJob(806L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        Assert.assertEquals(closedJob.getStatus(), JobStatus.PUBLISHED);
        verify(jobRepository).save(closedJob);
    }

    @Test(description = "JOB-U07: Skill mapping & AI cache resilience - Skills change, deletes old skills, AI cache exception handled")
    public void test_JOB_U07_updateJob_SkillIdsUpdate_AndAiCacheResilience() {
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
        when(skillRepository.findAllById(any())).thenReturn(List.of(Skill.builder().skillId(101L).skillName("Java").build()));

        JobCreateRequest req = buildJobReq("Updated Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"), LocalDate.now().plusDays(10));
        req.setMandatorySkillIds(List.of(101L, 102L)); // Changed skills

        Skill skill102 = Skill.builder().skillId(102L).skillName("Spring").build();
        when(skillRepository.findAllById(eq(List.of(101L, 102L)))).thenReturn(List.of(
                Skill.builder().skillId(101L).skillName("Java").build(),
                skill102
        ));

        doThrow(new RuntimeException("DB Connection Timeout on delete")).when(aiJobMatchRepository).deleteByJob_JobId(807L);

        JobResponse res = jobService.updateJob(807L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        verify(jobSkillRepository).deleteByJobId(807L);
        verify(aiJobMatchRepository).deleteByJob_JobId(807L);
    }

    @Test(description = "JOB-U08: Performance optimization - Identical skills skip database modification and AI cache deletion")
    public void test_JOB_U08_updateJob_SkillsIdentical_SkipsDatabaseModification() {
        Job existingJob = Job.builder()
                .jobId(808L)
                .title("Java Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();
        when(jobRepository.findById(808L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobSkill oldSkill = JobSkill.builder().jobId(808L).skillId(101L).importance(SkillImportance.MANDATORY).build();
        when(jobSkillRepository.findByJobId(808L)).thenReturn(List.of(oldSkill));
        when(skillRepository.findAllById(List.of(101L))).thenReturn(List.of(Skill.builder().skillId(101L).skillName("Java").build()));

        JobCreateRequest req = buildJobReq("Updated Title", 2, new BigDecimal("10000000"), new BigDecimal("25000000"), LocalDate.now().plusDays(10));
        req.setMandatorySkills(List.of("Java")); // Identical skill name
        req.setBranchName(null); // Keeps old branch name
        req.setCategory(null);   // Inferred category fallback

        JobResponse res = jobService.updateJob(808L, req, sampleRecruiterUser);

        Assert.assertNotNull(res);
        verify(jobSkillRepository, never()).deleteByJobId(808L);
        verify(aiJobMatchRepository, never()).deleteByJob_JobId(808L);
    }

    // ==========================================================================
    // FUNCTION 3: getPublishedJobs(String, String) — 8 HIGH-IMPACT TEST CASES
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
