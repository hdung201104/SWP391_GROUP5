// Storage key for bookmarked / saved jobs
const STORAGE_KEY = 'hiremate_saved_jobs';

export const getSavedJobs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

export const toggleSaveJob = (job) => {
  if (!job) return false;
  const jobId = job.jobId || job.id;
  if (!jobId) return false;

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('hiremate_saved_jobs_updated'));
  } catch (err) {
    console.warn('Could not save job to localStorage:', err);
  }

  return isSaved;
};
