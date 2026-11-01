import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition, MotionProvider, EASE_CINEMATIC } from './components/motion/MotionSystem';
import { installSharedElementCapture } from './components/motion/sharedElement';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { LivingThemeProvider, useLivingTheme } from './context/LivingThemeContext';
import BotanicalBackground from './components/common/BotanicalBackground';

import HomePage from './pages/HomePage';
import JobDetailPage from './pages/JobDetailPage';
import CandidateApplicationsPage from './pages/CandidateApplicationsPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import RecruiterProfilePage from './pages/RecruiterProfilePage';
import RecruiterJobManagementPage from './pages/RecruiterJobManagementPage';
import JobApplicantsRosterPage from './pages/JobApplicantsRosterPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import CandidateEvaluationPage from './pages/CandidateEvaluationPage';
import AiInterviewStudioPage from './pages/AiInterviewStudioPage';
import AiInterviewReportPage from './pages/AiInterviewReportPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import CareerInsightsPage from './pages/CareerInsightsPage';
import RecruiterPricingPage from './pages/RecruiterPricingPage';
import CandidatePricingPage from './pages/CandidatePricingPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterCompletePage from './pages/auth/RegisterCompletePage';

/**
 * ErrorBoundary to safeguard UI from breaking unexpectedly
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HireMate AI App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-red-400 p-8 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi giao diện:</h2>
          <pre className="bg-black/50 p-4 rounded-xl text-xs text-slate-300 max-w-xl overflow-auto border border-red-500/30">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold cursor-pointer"
          >
            Tải lại trang (F5)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const stored = localStorage.getItem('user') || localStorage.getItem('hiremate_user');
      if (stored) return JSON.parse(stored);
      const hrStored = localStorage.getItem('hiremate_hr_profile');
      if (hrStored) {
        return { ...JSON.parse(hrStored), role: 'RECRUITER' };
      }
      return null;
    } catch {
      return null;
    }
  });

  const getRoute = () => {
    return window.location.hash || '#/';
  };

  const [currentRoute, setCurrentRoute] = useState(getRoute());
  const { variant, luminosity, theme } = useLivingTheme();

  useEffect(() => {
    installSharedElementCapture();
    // 1. Intercept GitHub OAuth Callback if redirected to root URL
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    if (code) {
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'GITHUB_OAUTH_CODE', code }, window.location.origin);
          window.close();
          return;
        } catch (e) {
          console.warn('Cannot postMessage to opener:', e);
        }
      }
      // If direct navigation in same window (or popup couldn't reach opener), forward code to LoginPage
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.hash = `#/login?code=${code}`;
    }

    const handleHashChange = () => {
      setCurrentRoute(getRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Cross-tab / popup login sync & live profile synchronization
    const handleStorage = (e) => {
      if (!e || !e.key || e.key === 'token' || e.key === 'user') {
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            setUser(JSON.parse(stored));
          }
        } catch (err) {}
      }
    };

    const handleUserUpdate = (e) => {
      if (e?.detail) {
        setUser(e.detail);
      } else {
        try {
          const stored = localStorage.getItem('user');
          if (stored) setUser(JSON.parse(stored));
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('hiremate_user_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hiremate_user_updated', handleUserUpdate);
    };
  }, []);

  const handleNavigate = (route) => {
    if (route) {
      if (window.location.hash !== route) {
        window.location.hash = route;
      }
      setCurrentRoute(route);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('hiremate_user');
    localStorage.removeItem('hiremate_hr_profile');
    localStorage.removeItem('hiremate_recruiter_subscription');
    localStorage.removeItem('hiremate_interview_history');
    localStorage.removeItem('hiremate_candidate_subscription');
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('hiremate_company_') || key.startsWith('hiremate_recruiter_') || key.startsWith('hiremate_workplace_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {}
    setUser(null);
    window.location.hash = '#/';
  };

  const handleSwitchDemoRole = (role) => {
    if (!role) {
      localStorage.removeItem('user');
      localStorage.removeItem('hiremate_user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('hiremate_hr_profile');
      localStorage.removeItem('hiremate_recruiter_subscription');
      localStorage.removeItem('hiremate_interview_history');
      localStorage.removeItem('hiremate_candidate_subscription');
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('hiremate_company_') || key.startsWith('hiremate_recruiter_') || key.startsWith('hiremate_workplace_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (e) {}
      setUser(null);
      window.location.hash = '#/';
      return;
    }
    window.location.hash = '#/login';
  };

  const handleLoginSuccess = (authData) => {
    localStorage.setItem('token', authData.token);
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
    const userData = {
      userId: authData.userId,
      email: authData.email,
      fullName: authData.fullName,
      role: authData.role,
      avatarUrl: authData.avatarUrl,
      companyId: authData.companyId,
      companyName: authData.companyName,
      companyLogo: authData.companyLogo,
      phone: authData.phone,
      position: authData.position,
      department: authData.department,
      branchName: authData.branchName,
      isHeadRecruiter: authData.isHeadRecruiter,
      taxCode: authData.taxCode,
      bio: authData.bio,
      address: authData.address,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Redirection: Admin to admin-dashboard, Candidates and Recruiters to HomePage (#/)
    if (userData.role === 'ADMIN') {
      window.location.hash = '#/admin-dashboard';
    } else {
      window.location.hash = '#/';
    }
  };

  const renderContent = () => {
    const route = currentRoute.toLowerCase();

    if (route.includes('admin-dashboard') || route.includes('admin') || route.includes('quan-tri')) {
      return (
        <ProtectedRoute user={user} requiredRole="ADMIN">
          <AdminDashboardPage user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      );
    }

    if (route.includes('login')) {
      return (
        <LoginPage
          onNavigateRegister={() => { window.location.hash = '#/register'; }}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    if (route.includes('register-complete') || route.includes('complete-registration')) {
      return (
        <RegisterCompletePage
          onNavigateLogin={() => { window.location.hash = '#/login'; }}
          onRegisterSuccess={handleLoginSuccess}
        />
      );
    }

    if (route.includes('register')) {
      return (
        <RegisterPage
          onNavigateLogin={() => { window.location.hash = '#/login'; }}
          onRegisterSuccess={handleLoginSuccess}
        />
      );
    }

    if (route.includes('ai-interview-report') || route.includes('interview-report') || route.includes('bao-cao-phong-van')) {
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <AiInterviewReportPage user={user} onBack={() => { window.location.hash = '#/ai-interview'; }} />
        </ProtectedRoute>
      );
    }

    if (route.includes('ai-interview') || route.includes('luyen-phong-van') || route.includes('mock-interview')) {
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <AiInterviewStudioPage user={user} />
        </ProtectedRoute>
      );
    }

    if (route.includes('insights') || route.includes('career-insights')) {
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <CareerInsightsPage user={user} />
        </ProtectedRoute>
      );
    }

    if (route.includes('candidate-pricing') || route.includes('candidate-subscription') || route.includes('goi-ung-vien') || route.includes('mua-goi-candidate') || (route.includes('pricing') && user?.role === 'CANDIDATE')) {
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <CandidatePricingPage user={user} onNavigate={handleNavigate} />
        </ProtectedRoute>
      );
    }

    if (route.includes('recruiter-profile') || route.includes('company-profile') || route.includes('ho-so-doanh-nghiep')) {
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <RecruiterProfilePage user={user} onNavigate={handleNavigate} />
        </ProtectedRoute>
      );
    }

    if (route.includes('settings') || route.includes('cai-dat') || route.includes('account') || route.includes('thong-tin-ca-nhan')) {
      return (
        <ProtectedRoute user={user}>
          <AccountSettingsPage
            user={user}
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }}
          />
        </ProtectedRoute>
      );
    }

    // Recruiter viewing a specific Candidate Dossier, CV or Evaluation
    if (
      route.includes('candidate-evaluation') ||
      route.includes('candidate-dossier') ||
      route.includes('candidate-cv') ||
      route.includes('candidate-profile-view') ||
      route.includes('hm-9082')
    ) {
      const candIdMatch = route.match(/candidateid=(\d+)/i);
      const jobIdMatch = route.match(/jobid=(\d+)/i);
      const jobId = jobIdMatch ? Number(jobIdMatch[1]) : null;
      const cvIdMatch = route.match(/cvid=(\d+)/i);
      const cvId = cvIdMatch ? Number(cvIdMatch[1]) : null;
      const appIdMatch = route.match(/appid=(\d+)/i) || route.match(/applicationid=(\d+)/i);
      const appId = appIdMatch ? Number(appIdMatch[1]) : null;
      const candId = candIdMatch ? Number(candIdMatch[1]) : (appId ? null : 1);
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <CandidateEvaluationPage
            user={user}
            candidateId={candId}
            jobId={jobId}
            cvId={cvId}
            applicationId={appId}
            onBack={() => {
              window.location.hash = jobId ? `#/job-applicants-roster?jobId=${jobId}` : '#/job-dashboard';
            }}
          />
        </ProtectedRoute>
      );
    }

    if (route.includes('profile') || route.includes('quan-ly-ho-so') || route.includes('ho-so-cv') || route.includes('tab=cvs')) {
      if (route.includes('recruiter-profile') || route.includes('company-profile') || (user?.role === 'RECRUITER' && !route.includes('candidate'))) {
        return (
          <ProtectedRoute user={user} requiredRole="RECRUITER">
            <RecruiterProfilePage user={user} onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      }
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <CandidateProfilePage user={user} />
        </ProtectedRoute>
      );
    }

    if (route.includes('applications') || route.includes('don-ung-tuyen') || route.includes('tab=applications')) {
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <CandidateApplicationsPage user={user} />
        </ProtectedRoute>
      );
    }

    if (route.includes('candidate-dashboard')) {
      return (
        <ProtectedRoute user={user} requiredRole="CANDIDATE">
          <CandidateProfilePage user={user} />
        </ProtectedRoute>
      );
    }

    if (route.includes('job-dashboard') || route.includes('recruiter-jobs') || route.includes('quan-ly-tin') || route.includes('job-management')) {
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <RecruiterJobManagementPage
            user={user}
            onNavigateToPipeline={(jobId) => {
              window.location.hash = `#/job-applicants-roster?jobId=${jobId}`;
            }}
          />
        </ProtectedRoute>
      );
    }

    if (route.includes('applicants-management') || route.includes('job-applicants') || route.includes('recruiter-applicants') || route.includes('job-applicants-roster')) {
      const rawHash = window.location.hash;
      const urlJobIdMatch = rawHash.match(/jobid=(\d+)/i) || rawHash.match(/jobId=(\d+)/);
      const parsedJobId = urlJobIdMatch ? Number(urlJobIdMatch[1]) : 101;
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <JobApplicantsRosterPage
            user={user}
            jobId={parsedJobId}
            onBackToJobs={() => {
              window.location.hash = '#/job-dashboard';
            }}
          />
        </ProtectedRoute>
      );
    }

    if (route.includes('recruiter-pricing') || route.includes('pricing') || route.includes('subscription') || route.includes('goi-dich-vu') || route.includes('mua-goi')) {
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <RecruiterPricingPage user={user} onNavigate={handleNavigate} />
        </ProtectedRoute>
      );
    }


    if (route.includes('recruiter-dashboard')) {
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <RecruiterDashboardPage user={user} currentRoute={currentRoute} />
        </ProtectedRoute>
      );
    }

    // Public: Job Detail Page
    if (route.startsWith('#/jobs/') || route.startsWith('#/job/') || (route.includes('job') && route.includes('id='))) {
      const match = route.match(/job[s]?\/(\d+)/) || route.match(/jobid=(\d+)/i);
      const jobId = match ? match[1] : route.replace('#/jobs/', '').split('?')[0];
      return <JobDetailPage user={user} jobId={jobId} />;
    }

    // Public: Company Detail Page
    if (
      route.startsWith('#/companies/') ||
      route.startsWith('#/company/') ||
      (route.includes('company') && (route.includes('id=') || route.includes('companyid=')))
    ) {
      const match = route.match(/compan(?:y|ies)\/([a-zA-Z0-9_-]+)/i) ||
                    route.match(/companyid=([a-zA-Z0-9_-]+)/i) ||
                    route.match(/id=([a-zA-Z0-9_-]+)/i);
      const targetCompanyId = match ? match[1] : 1;
      return <CompanyDetailPage user={user} companyId={targetCompanyId} />;
    }

    // Public: Home Page & Job Search / Discovery / Company Profile & Jobs
    if (
      route === '#/' ||
      route === '' ||
      route === '#' ||
      route.includes('job-search') ||
      route.startsWith('#/jobs') ||
      route.startsWith('#/companies') ||
      route.startsWith('#/company') ||
      route.includes('tim-viec')
    ) {
      return <HomePage user={user} />;
    }

    // Fallback: If route starts with #/ but is not recognized, show 404
    if (route.startsWith('#/') && route.length > 2) {
      return <NotFoundPage onGoHome={() => { window.location.hash = '#/'; }} />;
    }

    // Default: HomePage (Job Discovery for Candidate & Guest)
    return <HomePage user={user} />;
  };

  const isAuthPage = currentRoute.toLowerCase().includes('login') || currentRoute.toLowerCase().includes('register');
  const isEvaluationPage = currentRoute.toLowerCase().includes('candidate-evaluation') ||
                           currentRoute.toLowerCase().includes('candidate-dossier') ||
                           currentRoute.toLowerCase().includes('candidate-cv') ||
                           currentRoute.toLowerCase().includes('hm-9082');
  const isStudioPage = currentRoute.toLowerCase().includes('ai-interview') ||
                       currentRoute.toLowerCase().includes('luyen-phong-van-ai') ||
                       currentRoute.toLowerCase().includes('phong-thu-phong-van') ||
                       currentRoute.toLowerCase().includes('che-do-luyen-tap');

  const isRecruiterRoute = currentRoute.toLowerCase().includes('recruiter') || 
                           currentRoute.toLowerCase().includes('job-dashboard') || 
                           currentRoute.toLowerCase().includes('applicants-management') || 
                           currentRoute.toLowerCase().includes('job-applicants') ||
                           currentRoute.toLowerCase().includes('company-profile') ||
                           isEvaluationPage;

  const isAdminPage = currentRoute.toLowerCase().includes('admin-dashboard') ||
                      currentRoute.toLowerCase().includes('admin') ||
                      currentRoute.toLowerCase().includes('quan-tri');

  const hideGlobalLayout = isAuthPage;

  return (
    <div className="min-h-screen relative font-sans text-[#1e1b4b] bg-[#f8f9fe] p-2 sm:p-4 md:p-6 flex flex-col justify-between overflow-x-hidden">
        
        {/* Living Ambient Background Mesh */}
        <div aria-hidden="true">
          <BotanicalBackground />
        </div>

        {/* Outer Mindskills Glass Canvas Container - Crisp, clean, luminous light surface */}
        <div className="relative z-10 flex flex-col min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] justify-between bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-[32px] shadow-[0_20px_50px_-10px_rgba(40,25,90,0.07)] overflow-hidden border border-purple-100/70">
          {!hideGlobalLayout && (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: EASE_CINEMATIC }}
              className="sticky top-0 z-50"
            >
              <Header
                user={user}
                currentRoute={currentRoute}
                onLogout={handleLogout}
                onNavigate={(r) => {
                  setCurrentRoute(r);
                  window.location.hash = r;
                }}
                onSwitchDemoRole={handleSwitchDemoRole}
              />
            </motion.div>
          )}

          <main className="flex-1 p-3 sm:p-6 relative">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={currentRoute.split('?')[0] || currentRoute} routeKey={currentRoute}>
                {renderContent()}
              </PageTransition>
            </AnimatePresence>
          </main>

          {!hideGlobalLayout && <Footer />}
        </div>
      </div>
  );

}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionProvider>
        <LivingThemeProvider>
          <AppContent />
        </LivingThemeProvider>
      </MotionProvider>
    </ErrorBoundary>
  );
}
