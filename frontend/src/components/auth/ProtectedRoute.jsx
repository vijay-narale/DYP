import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="shimmer" style={{ width: 40, height: 40, borderRadius: '50%' }} />
    </div>
  );

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If onboarding is NOT complete, force to onboarding
  if (profile && !profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding IS complete, don't allow /onboarding
  if (profile?.onboarding_complete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
