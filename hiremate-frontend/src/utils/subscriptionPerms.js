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
        if (isCandidate) {
          return {
            ...defaultPerms,
            ...jsonPerms,
            maxQuestions: jsonPerms.maxQ || jsonPerms.maxQuestions || defaultPerms.maxQuestions,
            maxDurationMinutes: jsonPerms.maxDur ? Math.round(Number(jsonPerms.maxDur) / 60) : (jsonPerms.maxDurationMinutes || defaultPerms.maxDurationMinutes),
            allowedPersonas: jsonPerms.personas ? (Array.isArray(jsonPerms.personas) ? jsonPerms.personas : jsonPerms.personas.split(',').map(s => s.trim())) : defaultPerms.allowedPersonas,
            allowedVoices: jsonPerms.voices ? (Array.isArray(jsonPerms.voices) ? jsonPerms.voices : jsonPerms.voices.split(',').map(s => s.trim())) : defaultPerms.allowedVoices,
            coachHints: jsonPerms.coachHints !== undefined ? Number(jsonPerms.coachHints) : defaultPerms.coachHints,
            unlockFullStar: jsonPerms.fullStar !== undefined ? Boolean(jsonPerms.fullStar) : (jsonPerms.unlockFullStar !== undefined ? Boolean(jsonPerms.unlockFullStar) : defaultPerms.unlockFullStar),
            unlockRoadmap: jsonPerms.roadmap !== undefined ? Boolean(jsonPerms.roadmap) : (jsonPerms.unlockRoadmap !== undefined ? Boolean(jsonPerms.unlockRoadmap) : defaultPerms.unlockRoadmap),
            maxCvLimit: jsonPerms.cvLimit !== undefined ? Number(jsonPerms.cvLimit) : (jsonPerms.maxCvLimit !== undefined ? Number(jsonPerms.maxCvLimit) : defaultPerms.maxCvLimit),
            aiSummaryLimit: jsonPerms.aiSummaryLimit !== undefined ? Number(jsonPerms.aiSummaryLimit) : defaultPerms.aiSummaryLimit,
            cvJdReportLimit: jsonPerms.cvJdReportLimit !== undefined ? Number(jsonPerms.cvJdReportLimit) : defaultPerms.cvJdReportLimit,
            modernCvTemplate: jsonPerms.modernCvTemplate !== undefined ? Boolean(jsonPerms.modernCvTemplate) : defaultPerms.modernCvTemplate,
            voiceBiometrics: jsonPerms.voiceBiometrics !== undefined ? Boolean(jsonPerms.voiceBiometrics) : defaultPerms.voiceBiometrics,
            webcamBiometrics: jsonPerms.webcamBiometrics !== undefined ? Boolean(jsonPerms.webcamBiometrics) : defaultPerms.webcamBiometrics,
          };
        } else {
          return {
            ...defaultPerms,
            ...jsonPerms,
            jobPostingQuota: jsonPerms.jobPostingQuota || jsonPerms.jobQuota || jsonPerms.jobLimit || defaultPerms.jobPostingQuota,
            jobQuota: jsonPerms.jobPostingQuota || jsonPerms.jobQuota || jsonPerms.jobLimit || defaultPerms.jobPostingQuota,
            cvViewLimit: jsonPerms.cvViewLimit !== undefined ? Number(jsonPerms.cvViewLimit) : defaultPerms.cvViewLimit,
            canSeeAiAnalysis: jsonPerms.canSeeAiAnalysis !== undefined ? Boolean(jsonPerms.canSeeAiAnalysis) : defaultPerms.canSeeAiAnalysis,
            batchAction: jsonPerms.batchAction !== undefined ? Boolean(jsonPerms.batchAction) : defaultPerms.batchAction,
            exportReport: jsonPerms.exportReport !== undefined ? Boolean(jsonPerms.exportReport) : defaultPerms.exportReport,
            recalculateAll: jsonPerms.recalculateAll !== undefined ? Boolean(jsonPerms.recalculateAll) : defaultPerms.recalculateAll,
            aiMatching: jsonPerms.aiMatching !== undefined ? Boolean(jsonPerms.aiMatching) : defaultPerms.aiMatching,
            unlockDirectContact: jsonPerms.unlockDirectContact !== undefined ? Boolean(jsonPerms.unlockDirectContact) : defaultPerms.unlockDirectContact,
            featuredJobBadge: jsonPerms.featuredJobBadge !== undefined ? Boolean(jsonPerms.featuredJobBadge) : defaultPerms.featuredJobBadge,
            autoEmail: jsonPerms.autoEmail !== undefined ? Boolean(jsonPerms.autoEmail) : defaultPerms.autoEmail,
            teamSeats: jsonPerms.teamSeats !== undefined ? Number(jsonPerms.teamSeats) : defaultPerms.teamSeats,
          };
        }
      }

      // Semicolon-delimited format: [PERMS:key=value;key2=value2]
      const dict = {};
      permsStr.split(';').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k && v !== undefined) dict[k.trim()] = v.trim();
      });

      if (isCandidate) {
        return {
          ...defaultPerms,
          interviewQuotaPerDay: dict.interviewLimit ? parseInt(dict.interviewLimit, 10) : defaultPerms.interviewQuotaPerDay,
          maxQuestions: dict.maxQ ? parseInt(dict.maxQ, 10) : defaultPerms.maxQuestions,
          maxDurationMinutes: dict.maxDur ? Math.round(parseInt(dict.maxDur, 10) / 60) : defaultPerms.maxDurationMinutes,
          allowedPersonas: dict.personas ? dict.personas.split(',').map((s) => s.trim()).filter(Boolean) : defaultPerms.allowedPersonas,
          allowedVoices: dict.voices ? dict.voices.split(',').map((s) => s.trim()).filter(Boolean) : defaultPerms.allowedVoices,
          coachHints: dict.coachHints !== undefined ? parseInt(dict.coachHints, 10) : defaultPerms.coachHints,
          unlockFullStar: dict.fullStar !== undefined ? dict.fullStar === 'true' : defaultPerms.unlockFullStar,
          unlockRoadmap: dict.roadmap !== undefined ? dict.roadmap === 'true' : defaultPerms.unlockRoadmap,
          maxCvLimit: dict.maxCvLimit ? parseInt(dict.maxCvLimit, 10) : (dict.cvLimit ? parseInt(dict.cvLimit, 10) : defaultPerms.maxCvLimit),
          aiSummaryLimit: dict.aiSummaryLimit !== undefined ? parseInt(dict.aiSummaryLimit, 10) : defaultPerms.aiSummaryLimit,
          cvJdReportLimit: dict.cvJdReportLimit ? parseInt(dict.cvJdReportLimit, 10) : defaultPerms.cvJdReportLimit,
          modernCvTemplate: dict.modernCvTemplate !== undefined ? dict.modernCvTemplate === 'true' : defaultPerms.modernCvTemplate,
          voiceBiometrics: dict.voiceBiometrics !== undefined ? dict.voiceBiometrics === 'true' : defaultPerms.voiceBiometrics,
          webcamBiometrics: dict.webcamBiometrics !== undefined ? dict.webcamBiometrics === 'true' : defaultPerms.webcamBiometrics,
          atsCvAnalysis: true,
        };
      } else {
        const recruiterDefault = getRecruiterPerms(planName, quotaLimit, price);
        return {
          ...recruiterDefault,
          jobPostingQuota: dict.jobQuota ? parseInt(dict.jobQuota, 10) : (dict.jobLimit ? parseInt(dict.jobLimit, 10) : recruiterDefault.jobPostingQuota),
          jobQuota: dict.jobQuota ? parseInt(dict.jobQuota, 10) : (dict.jobLimit ? parseInt(dict.jobLimit, 10) : recruiterDefault.jobPostingQuota),
          cvViewLimit: dict.cvViewLimit !== undefined ? parseInt(dict.cvViewLimit, 10) : (dict.cvQuota !== undefined ? parseInt(dict.cvQuota, 10) : recruiterDefault.cvViewLimit),
          canSeeAiAnalysis: dict.canSeeAiAnalysis !== undefined ? dict.canSeeAiAnalysis === 'true' : (dict.skillGap !== undefined ? dict.skillGap === 'true' : recruiterDefault.canSeeAiAnalysis),
          batchAction: dict.batchAction !== undefined ? dict.batchAction === 'true' : (dict.batchActions !== undefined ? dict.batchActions === 'true' : recruiterDefault.batchAction),
          exportReport: dict.analytics !== undefined ? dict.analytics === 'true' : (dict.exportReport !== undefined ? dict.exportReport === 'true' : recruiterDefault.exportReport),
          recalculateAll: dict.recalculateAll !== undefined ? dict.recalculateAll === 'true' : recruiterDefault.recalculateAll,
          aiMatching: dict.aiMatch !== undefined ? dict.aiMatch === 'true' : recruiterDefault.aiMatching,
          unlockDirectContact: dict.directCv !== undefined ? dict.directCv === 'true' : recruiterDefault.unlockDirectContact,
          featuredJobBadge: dict.verifiedBadge !== undefined ? dict.verifiedBadge === 'true' : (dict.featuredJobBadge !== undefined ? dict.featuredJobBadge === 'true' : recruiterDefault.featuredJobBadge),
          autoEmail: dict.bulkEmail !== undefined ? dict.bulkEmail === 'true' : (dict.autoEmail !== undefined ? dict.autoEmail === 'true' : recruiterDefault.autoEmail),
          teamSeats: dict.seats ? parseInt(dict.seats, 10) : (dict.teamSeats ? parseInt(dict.teamSeats, 10) : recruiterDefault.teamSeats),
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
  const cvViewLimit = isEnterprise ? 9999 : isPro ? 100 : isStarter ? 30 : 0;
  const durationDays = isEnterprise ? 90 : 30;

  return {
    tier: isEnterprise ? 'ENTERPRISE' : isPro ? 'PROFESSIONAL' : isStarter ? 'STARTER' : 'BASIC',
    jobPostingQuota: quotaLimit && quotaLimit > 3 ? quotaLimit : jobPostingQuota,
    jobQuota: quotaLimit && quotaLimit > 3 ? quotaLimit : jobPostingQuota,
    cvViewLimit,
    durationDays,
    aiMatching: true,
    canSeeAiAnalysis: isPro || isEnterprise,
    canDownloadCv: !isFree,
    unlockDirectContact: !isFree,
    featuredJobBadge: isEnterprise,
    exportReport: !isFree,
    autoEmail: isPro || isEnterprise,
    batchAction: isPro || isEnterprise,
    viewSalaryRange: true,
  };
};

export const getDefaultPermissions = (role, planName = '', quotaLimit = 3, price = 0) => {
  const isCand = String(role || '').toUpperCase() === 'CANDIDATE';
  const name = String(planName || '').toLowerCase();
  const numPrice = Number(price || 0);
  const isFree = numPrice === 0 || name.includes('free') || (name.includes('basic') && numPrice === 0);

  if (isCand) {
    const isAce = !isFree && (name.includes('ace') || name.includes('career') || numPrice >= 200000 || quotaLimit >= 999);
    const isPro = !isFree && !isAce && (name.includes('pro') || numPrice >= 100000 || (quotaLimit >= 15 && quotaLimit < 999));
    const isPlus = !isFree && !isAce && !isPro && (name.includes('plus') || numPrice > 0 || quotaLimit >= 5);

    return {
      maxQuestions: isFree ? 3 : isPlus ? 5 : isPro ? 7 : 8,
      maxDurationMinutes: isFree ? 5 : isPlus ? 10 : isPro ? 15 : 20,
      allowedPersonas: isFree ? ['HR_MANAGER'] : isPlus ? ['HR_MANAGER', 'TECH_LEAD'] : ['HR_MANAGER', 'TECH_LEAD', 'STRICT_DIRECTOR'],
      allowedVoices: isFree ? ['vi-native'] : isPlus ? ['vi-native', 'eleven-alice'] : ['vi-native', 'eleven-alice', 'eleven-george'],
      coachHints: isFree ? 1 : isPlus ? 3 : 999,
      unlockFullStar: !isFree,
      unlockRoadmap: !isFree,
      voiceBiometrics: isPro || isAce,
      webcamBiometrics: isAce,
      maxCvLimit: isFree ? 2 : isPlus ? 5 : 999,
      aiSummaryLimit: isFree ? 1 : isPlus ? 5 : 999,
      cvJdReportLimit: isFree ? 3 : isPlus ? 15 : 999,
      cvTemplate: (isPro || isAce) ? ['executive', 'harvard', 'modern'] : ['executive', 'harvard'],
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

