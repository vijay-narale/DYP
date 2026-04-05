import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Navbar from './components/layout/Navbar';

const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const LiveInterviewSession = lazy(() => import('./pages/LiveInterviewSession'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } }
});

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <div className="shimmer" style={{ width: 200, height: 20, borderRadius: 10 }} />
  </div>
);

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 14,
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Public routes — Navbar only, no auth */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/analyze" element={<AnalyzePage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/interview" element={<InterviewPage />} />
                  <Route path="/interview/live/:id" element={<LiveInterviewSession />} />
                  <Route path="/admin" element={<AdminPanelPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
