import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardShell } from '../layouts/DashboardShell';
import { PublicLayout } from './PublicLayout';
import { Outlet, useLocation } from 'react-router-dom';

export function AuthLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const isLeaderboardPath = location.pathname.startsWith('/leaderboard');
  const isCurriculumPath = location.pathname.startsWith('/curriculum');
  const isTopicalsPath = location.pathname.startsWith('/topicals');
  const isLockInPath = location.pathname.startsWith('/lock_in');
  const isPastpapersPath = location.pathname.startsWith('/pastpapers');
  const isAiPath = location.pathname.startsWith('/ai');
  const shouldUseDashboardShell = isDashboardPath || (isLeaderboardPath && user) || isLockInPath || (user && (isCurriculumPath || isTopicalsPath || isPastpapersPath || isAiPath));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (shouldUseDashboardShell) {
    return (
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    );
  }

  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}