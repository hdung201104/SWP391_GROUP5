import React, { useState, useEffect } from 'react';
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
import AccountSettingsPage from './pages/AccountSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin pages — loaded separately so they don't affect other teammates' code
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import AdminQuestionBankPage from './pages/admin/AdminQuestionBankPage';
import AdminSystemAnalyticsPage from './pages/admin/AdminSystemAnalyticsPage';

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
      const stored = localStorage.getItem('user');
      if (token && stored) return JSON.parse(stored);
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
    const handleHashChange = () => {
      setCurrentRoute(getRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.hash = '#/';
  };

  const handleSwitchDemoRole = (role) => {
    if (!role) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      window.location.hash = '#/';
      return;
    }
    window.location.hash = '#/login';
  };

  const handleLoginSuccess = (authData) => {
    localStorage.setItem('token', authData.token);
    const userData = {
      userId: authData.userId,
      email: authData.email,
      fullName: authData.fullName,
      role: authData.role,
      avatarUrl: authData.avatarUrl,
      companyId: authData.companyId,
      companyName: authData.companyName,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Dynamic redirection based on role
    if (userData.role === 'RECRUITER') {
      window.location.hash = '#/recruiter-dashboard';
    } else {
      window.location.hash = '#/';
    }
  };

  const renderContent = () => {
    const route = currentRoute.toLowerCase();

    // ── Admin routes (checked first to avoid conflicts with other patterns) ──
    if (route.includes('admin-dashboard') || route === '#/admin') {
      return (
        <ProtectedRoute user={user} requiredRole="ADMIN">
          <AdminDashboardPage />
        </ProtectedRoute>
      );
    }

    if (route.includes('admin-users')) {
      return (
        <ProtectedRoute user={user} requiredRole="ADMIN">
          <AdminUserManagementPage />
        </ProtectedRoute>
      );
    }

    if (route.includes('admin-questions')) {
      return (
        <ProtectedRoute user={user} requiredRole="ADMIN">
          <AdminQuestionBankPage />
        </ProtectedRoute>
      );
    }

    if (route.includes('admin-analytics')) {
      return (
        <ProtectedRoute user={user} requiredRole="ADMIN">
          <AdminSystemAnalyticsPage />
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

    if (route.includes('register')) {
      return (
        <RegisterPage
          onNavigateLogin={() => { window.location.hash = '#/login'; }}
          onRegisterSuccess={handleLoginSuccess}
        />
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

    if (route.includes('recruiter-profile') || route.includes('company-profile') || route.includes('ho-so-doanh-nghiep')) {
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <RecruiterProfilePage user={user} onNavigate={(r) => setCurrentRoute(r)} />
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
      const candId = candIdMatch ? Number(candIdMatch[1]) : 1;
      const jobIdMatch = route.match(/jobid=(\d+)/i);
      const jobId = jobIdMatch ? Number(jobIdMatch[1]) : 101;
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <CandidateEvaluationPage
            user={user}
            candidateId={candId}
            jobId={jobId}
            onBack={() => {
              window.location.hash = `#/applicants-management?jobId=${jobId}`;
            }}
          />
        </ProtectedRoute>
      );
    }

    if (route.includes('profile') || route.includes('quan-ly-ho-so') || route.includes('ho-so-cv') || route.includes('tab=cvs')) {
      if (route.includes('recruiter-profile') || route.includes('company-profile') || (user?.role === 'RECRUITER' && !route.includes('candidate'))) {
        return (
          <ProtectedRoute user={user} requiredRole="RECRUITER">
            <RecruiterProfilePage user={user} onNavigate={(r) => setCurrentRoute(r)} />
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

    if (route.includes('job-dashboard') || route.includes('recruiter-jobs') || route.includes('quan-ly-tin')) {
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <RecruiterJobManagementPage
            user={user}
            onNavigateToPipeline={(jobId) => {
              window.location.hash = `#/applicants-management?jobId=${jobId}`;
            }}
          />
        </ProtectedRoute>
      );
    }

    if (route.includes('applicants-management') || route.includes('job-applicants') || route.includes('recruiter-applicants')) {
      const rawHash = window.location.hash;
      const urlJobIdMatch = rawHash.match(/jobid=(\d+)/i) || rawHash.match(/jobId=(\d+)/);
      const parsedJobId = urlJobIdMatch ? Number(urlJobIdMatch[1]) : 101;
      return (
        <ProtectedRoute user={user} requiredRole="RECRUITER">
          <JobApplicantsRosterPage
            user={user}
            jobId={parsedJobId}
            onBackToJobs={() => {
              window.location.hash = '#/recruiter-jobs';
            }}
          />
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
    if (route.startsWith('#/jobs/')) {
      const jobId = route.replace('#/jobs/', '').split('?')[0];
      return <JobDetailPage user={user} jobId={jobId} />;
    }

    // Public: Home Page
    if (route === '#/' || route === '' || route === '#') {
      return <HomePage user={user} />;
    }

    // Fallback: If route starts with #/ but is not recognized, show 404
    if (route.startsWith('#/') && route.length > 2) {
      return <NotFoundPage onGoHome={() => { window.location.hash = '#/'; }} />;
    }

    // Default: HomePage (Job Discovery for Candidate & Guest)
    return <HomePage user={user} />;
  };

  // Admin pages manage their own full layout (sidebar + content) — suppress global Header/Footer
  const isAdminPage = currentRoute.toLowerCase().includes('admin');

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

  const hideGlobalLayout = isAuthPage || isEvaluationPage || isAdminPage;

  return (
    <div className={`min-h-screen relative font-body text-[#2D3A31] bg-[#F9F8F4] flex flex-col justify-between ${isEvaluationPage ? 'h-screen overflow-hidden' : ''}`}>
        
        {/* =================================================================== */}
        {/* BOTANICAL / ORGANIC SERIF BACKGROUND (Paper Grain & Ambient Glow)   */}
        {/* =================================================================== */}
        <BotanicalBackground />

        {/* Content Container sitting atop the botanical organic canvas */}
        <div className="relative z-10 flex flex-col min-h-screen justify-between bg-transparent">
          {!hideGlobalLayout && (
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
          )}

          <main className={isEvaluationPage ? "h-screen overflow-hidden" : "flex-1"}>
            {renderContent()}
          </main>

          {!hideGlobalLayout && <Footer />}
        </div>
      </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LivingThemeProvider>
        <AppContent />
      </LivingThemeProvider>
    </ErrorBoundary>
  );
}
