/**
 * Utility helper to parse and enforce subscription permissions
 * Supports both [PERMS:k1=v1;k2=v2] and [PERMS:{"k1":v1,...}] format
 */

export const parseSubscriptionPermissions = (subscription, targetRole = 'RECRUITER') => {
  if (!subscription) {
    return getDefaultPermissions(targetRole, 'Starter (Free)', 3, 0);
  }

  const desc = subscription.planDescription || subscription.description || '';
  const planName = subscription.planName || subscription.name || '';
  const price = Number(subscription.price || 0);
  const quotaLimit = Number(subscription.quotaLimit || subscription.jobPostingQuota || 3);

  const role = String(targetRole || subscription.targetRole || 'RECRUITER').toUpperCase();
  const isCandidate = role === 'CANDIDATE';

  const defaultPerms = getDefaultPermissions(role, planName, quotaLimit, price);

  if (!desc || !desc.includes('[PERMS:')) {
    return defaultPerms;
  }

  try {
    const start = desc.indexOf('[PERMS:') + 7;
    const end = desc.indexOf(']', start);
    if (end > start) {
      const permsStr = desc.substring(start, end).trim();

      // Check if JSON format: [PERMS:{"aiMatching":true,...}]
      if (permsStr.startsWith('{') && permsStr.endsWith('}')) {
        const jsonPerms = JSON.parse(permsStr);
        return {
          ...defaultPerms,
          ...jsonPerms,
          jobPostingQuota: jsonPerms.jobPostingQuota || jsonPerms.jobQuota || defaultPerms.jobPostingQuota,
          aiMatching: jsonPerms.aiMatching !== undefined ? Boolean(jsonPerms.aiMatching) : defaultPerms.aiMatching,
          unlockDirectContact: jsonPerms.unlockDirectContact !== undefined ? Boolean(jsonPerms.unlockDirectContact) : defaultPerms.unlockDirectContact,
          featuredJobBadge: jsonPerms.featuredJobBadge !== undefined ? Boolean(jsonPerms.featuredJobBadge) : defaultPerms.featuredJobBadge,
          exportReport: jsonPerms.exportReport !== undefined ? Boolean(jsonPerms.exportReport) : defaultPerms.exportReport,
          autoEmail: jsonPerms.autoEmail !== undefined ? Boolean(jsonPerms.autoEmail) : defaultPerms.autoEmail,
          batchAction: jsonPerms.batchAction !== undefined ? Boolean(jsonPerms.batchAction) : defaultPerms.batchAction,
          aiMockInterview: jsonPerms.aiMockInterview !== undefined ? Boolean(jsonPerms.aiMockInterview) : defaultPerms.aiMockInterview,
        };
      }

      // Semicolon-delimited format: [PERMS:key=value;key2=value2]
      const dict = {};
      permsStr.split(';').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k && v !== undefined) dict[k.trim()] = v.trim();
      });

      if (isCandidate) {
        return {
          maxQuestions: dict.maxQ ? parseInt(dict.maxQ, 10) : defaultPerms.maxQuestions,
          maxDurationMinutes: dict.maxDur ? Math.round(parseInt(dict.maxDur, 10) / 60) : defaultPerms.maxDurationMinutes,
          allowedPersonas: dict.personas ? dict.personas.split(',').map((s) => s.trim()).filter(Boolean) : defaultPerms.allowedPersonas,
          allowedVoices: dict.voices ? dict.voices.split(',').map((s) => s.trim()).filter(Boolean) : defaultPerms.allowedVoices,
          coachHints: dict.coachHints !== undefined ? parseInt(dict.coachHints, 10) : defaultPerms.coachHints,
          unlockFullStar: dict.fullStar !== undefined ? dict.fullStar === 'true' : defaultPerms.unlockFullStar,
          unlockRoadmap: dict.roadmap !== undefined ? dict.roadmap === 'true' : defaultPerms.unlockRoadmap,
          atsCvAnalysis: true,
        };
      } else {
        const recruiterDefault = getRecruiterPerms(planName, quotaLimit, price);
        return {
          ...recruiterDefault,
          jobPostingQuota: dict.jobQuota ? parseInt(dict.jobQuota, 10) : recruiterDefault.jobPostingQuota,
          jobQuota: dict.jobQuota ? parseInt(dict.jobQuota, 10) : recruiterDefault.jobPostingQuota,
          aiMatching: dict.aiMatch !== undefined ? dict.aiMatch === 'true' : recruiterDefault.aiMatching,
          unlockDirectContact: dict.directCv !== undefined ? dict.directCv === 'true' : recruiterDefault.unlockDirectContact,
          featuredJobBadge: dict.verifiedBadge !== undefined ? dict.verifiedBadge === 'true' : recruiterDefault.featuredJobBadge,
          exportReport: dict.analytics !== undefined ? dict.analytics === 'true' : recruiterDefault.exportReport,
          autoEmail: dict.bulkEmail !== undefined ? dict.bulkEmail === 'true' : recruiterDefault.autoEmail,
          batchAction: dict.batchAction !== undefined ? dict.batchAction === 'true' : recruiterDefault.batchAction,
          aiMockInterview: dict.aiMockInterview !== undefined ? dict.aiMockInterview === 'true' : recruiterDefault.aiMockInterview,
          viewSalaryRange: dict.viewSalaryRange !== undefined ? dict.viewSalaryRange === 'true' : recruiterDefault.viewSalaryRange,
        };
      }
    }
  } catch (err) {
    console.warn('Error parsing subscription permissions:', err);
  }

  return defaultPerms;
};

export const getRecruiterPerms = (planName = '', quotaLimit = 3, price = 0) => {
  const name = String(planName || '').toLowerCase();
  const numPrice = Number(price || 0);
  const numQuota = Number(quotaLimit || 0);
  const isEnterprise = name.includes('elite') || name.includes('enterprise') || name.includes('vip') || numPrice >= 1100000 || numQuota >= 999;
  const isPro = !isEnterprise && (name.includes('pro') || name.includes('professional') || numPrice >= 400000 || (numQuota >= 30 && numQuota < 999));
  const isStarter = !isEnterprise && !isPro && (name.includes('starter') || numPrice >= 150000 || (numQuota >= 10 && numQuota < 30));
  // Tuyệt đối không coi là free nếu price > 0 (ví dụ Hiring Starter 199.000đ)
  const isFree = numPrice <= 0 && (!isEnterprise && !isPro && !isStarter || name.includes('free') || name.includes('hiring basic'));

  const jobPostingQuota = isEnterprise ? 999 : isPro ? 30 : isStarter ? 10 : 3;
  const cvViewLimit = isEnterprise ? 9999 : isPro ? 100 : isStarter ? 25 : 5;
  const durationDays = isEnterprise ? 90 : 30;

  return {
    tier: isEnterprise ? 'ENTERPRISE' : isPro ? 'PROFESSIONAL' : isStarter ? 'STARTER' : 'BASIC',
    jobPostingQuota: quotaLimit && quotaLimit > 3 ? quotaLimit : jobPostingQuota,
    jobQuota: quotaLimit && quotaLimit > 3 ? quotaLimit : jobPostingQuota,
    cvViewLimit,
    durationDays,
    aiMatching: true,
    canSeeAiAnalysis: !isFree,
    canDownloadCv: !isFree,
    unlockDirectContact: !isFree,
    featuredJobBadge: isEnterprise,
    exportReport: !isFree,
    autoEmail: isPro || isEnterprise,
    batchAction: isPro || isEnterprise,
    aiMockInterview: isPro || isEnterprise,
    viewSalaryRange: true,
  };
};

export const getDefaultPermissions = (role, planName = '', quotaLimit = 3, price = 0) => {
  const isCand = String(role || '').toUpperCase() === 'CANDIDATE';
  const name = String(planName || '').toLowerCase();
  const isFree = price === 0 || name.includes('free') || (name.includes('basic') && price === 0);

  if (isCand) {
    return {
      maxQuestions: isFree ? 3 : 7,
      maxDurationMinutes: isFree ? 5 : 15,
      allowedPersonas: isFree ? ['HR_MANAGER'] : ['HR_MANAGER', 'TECH_LEAD', 'STRICT_DIRECTOR'],
      allowedVoices: isFree ? ['vi-native'] : ['vi-native', 'eleven-alice', 'eleven-george'],
      coachHints: isFree ? 1 : 999,
      unlockFullStar: !isFree,
      unlockRoadmap: !isFree,
      atsCvAnalysis: true,
    };
  }

  return getRecruiterPerms(planName, quotaLimit, price);
};

export const hasActivePackage = (user) => {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  const planCode = String(user.activePlanCode || user.activePlan || user.planCode || '').toLowerCase();
  
  if (role === 'RECRUITER') {
    if (['hiring_growth', 'hiring_pro', 'hiring_elite', 'enterprise', 'vip'].includes(planCode)) {
      return true;
    }
    const cached = localStorage.getItem('hiremate_recruiter_subscription');
    if (cached) {
      try {
        const sub = JSON.parse(cached);
        const code = String(sub.planCode || sub.code || sub.planName || '').toLowerCase();
        return ['hiring_growth', 'hiring_pro', 'hiring_elite', 'enterprise', 'vip', 'professional'].some(p => code.includes(p));
      } catch (e) {}
    }
    return false;
  }

  if (role === 'CANDIDATE') {
    if (['candidate_pro', 'candidate_elite', 'pro', 'elite'].includes(planCode)) {
      return true;
    }
    const cached = localStorage.getItem('hiremate_candidate_subscription');
    if (cached) {
      try {
        const sub = JSON.parse(cached);
        const code = String(sub.planCode || sub.code || sub.planName || '').toLowerCase();
        return ['candidate_pro', 'candidate_elite', 'pro', 'elite'].some(p => code.includes(p));
      } catch (e) {}
    }
    return false;
  }

  return false;
};

export const findCompanySubscription = (user) => {
  if (!user) return null;
  if (user.activePlanCode || user.activePlan) {
    const code = user.activePlanCode || user.activePlan;
    return {
      planCode: code,
      planName: user.activePlanName || code,
      quotaLimit: user.jobPostingQuota || 30,
      active: true,
    };
  }
  const cached = localStorage.getItem('hiremate_recruiter_subscription');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return null;
};

export const getPostedJobsCount = (user, jobsList = null) => {
  if (Array.isArray(jobsList)) {
    return jobsList.length;
  }
  if (user?.postedJobsCount !== undefined) {
    return Number(user.postedJobsCount);
  }
  const cached = localStorage.getItem('hiremate_company_jobs');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed.length;
    } catch (e) {}
  }
  return 0;
};

