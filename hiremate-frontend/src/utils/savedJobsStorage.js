import { candidateApi } from '../api/candidateApi';

// Dynamic storage key for bookmarked / saved jobs isolated by logged-in user
const getStorageKey = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user?.userId) return `hiremate_saved_jobs_${user.userId}`;
    }
  } catch {}
  return 'hiremate_saved_jobs_guest';
};

const isCandidateLoggedIn = () => {
  try {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    if (!token || !rawUser) return false;
    const user = JSON.parse(rawUser);
    return user?.role === 'CANDIDATE';
  } catch {
    return false;
  }
};

let syncDebounceTimer = null;
const persistToServer = (list) => {
  if (!isCandidateLoggedIn()) return;
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    candidateApi.saveSavedJobs(JSON.stringify(list)).catch((err) => {
      console.warn('Could not sync saved jobs to server:', err);
    });
  }, 300);
};

export const syncSavedJobsWithServer = async () => {
  if (!isCandidateLoggedIn()) return getSavedJobs();
  try {
    const res = await candidateApi.getSavedJobs();
    const serverData = res?.data?.data || res?.data;
    if (serverData && typeof serverData === 'string' && serverData.trim().startsWith('[')) {
      const serverList = JSON.parse(serverData);
      if (Array.isArray(serverList)) {
        const localList = getSavedJobs();
        const map = new Map();
        // Server jobs
        serverList.forEach((j) => {
          const jId = String(j.id || j.jobId);
          if (jId) map.set(jId, j);
        });
        // Local jobs take precedence if newer
        localList.forEach((j) => {
          const jId = String(j.id || j.jobId);
          if (jId) map.set(jId, j);
        });
        const merged = Array.from(map.values());
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(merged));
        window.dispatchEvent(new Event('hiremate_saved_jobs_updated'));
        persistToServer(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not pull saved jobs from server:', err);
  }
  return getSavedJobs();
};

export const getSavedJobs = () => {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isJobSaved = (jobId) => {
  if (!jobId) return false;
  const list = getSavedJobs();
  return list.some(j => String(j.id || j.jobId) === String(jobId));
};

export const removeSavedJob = (jobId) => {
  if (!jobId) return;
  const key = getStorageKey();
  const list = getSavedJobs().filter(j => String(j.id || j.jobId) !== String(jobId));
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event('hiremate_saved_jobs_updated'));
    persistToServer(list);
  } catch (err) {
    console.warn('Could not update saved jobs:', err);
  }
};

export const toggleSaveJob = (job) => {
  if (!job) return false;
  const jobId = job.jobId || job.id;
  if (!jobId) return false;

  const key = getStorageKey();
  const list = getSavedJobs();
  const existingIdx = list.findIndex(j => String(j.id || j.jobId) === String(jobId));
  let isSaved = false;

  if (existingIdx >= 0) {
    list.splice(existingIdx, 1);
    isSaved = false;
  } else {
    list.unshift({
      id: jobId,
      jobId: jobId,
      title: job.title || 'Vị trí Tuyển dụng',
      companyName: job.companyName || job.company?.companyName || 'Doanh Nghiệp Tuyển Dụng',
      companyLogo: job.companyLogo || job.company?.logoUrl || '',
      location: job.location || 'Việt Nam',
      salary: job.salary || job.salaryText || 'Thỏa thuận',
      savedAt: new Date().toISOString()
    });
    isSaved = true;
  }

  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event('hiremate_saved_jobs_updated'));
    persistToServer(list);
  } catch (err) {
    console.warn('Could not save job to localStorage:', err);
  }

  return isSaved;
};
