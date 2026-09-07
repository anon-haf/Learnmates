import { AuthProvider } from './context/AuthContext';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthLayout } from './components/AuthLayout';
import { PublicLayout } from './components/PublicLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contribute from './pages/Contribute';
import Donate from './pages/Donate';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Copyright from './pages/Copyright';
import Curriculum from './pages/Curriculum';
import CurriculumPage from './pages/CurriculumPage';
import TopicPage from './pages/TopicPage';
import CurriculumPdfViewerPage from './pages/CurriculumPdfViewerPage';
import TopicalPages from './pages/TopicalPages';
import Pastpapers from './pages/Pastpapers';
import PaperViewer from './pages/PaperViewer';
import { UserProvider } from './context/UserContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { EngagementProvider } from './context/EngagementContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import LockIn from './pages/LockIn';
import { DashboardShell } from './layouts/DashboardShell';
import { useXP } from './hooks/useXP';
import { LockInProvider } from './components/lock-in/LockInContext';
import { GlobalLockInManager } from './components/lock-in/GlobalLockInManager';

function AppContent() {
  // Global XP tracking
  useXP();
  return (
    <Routes>
        <Route element={<AuthLayout />}> 
        {/* Public routes - rendered inside AuthLayout's PublicLayout */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contribute" element={<Contribute />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/copyright" element={<Copyright />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected dashboard routes - use DashboardShell */}
        <Route element={<ProtectedRoute requireCompleteProfile />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/lock_in" element={<LockIn />} />
        </Route>

        {/* Conditional layout routes - DashboardShell if logged in, PublicLayout if not */}
        <Route element={<ConditionalLayout />}>
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/curriculum/:type" element={<CurriculumPage />} />
          <Route path="/curriculum/:type/:board" element={<CurriculumPage />} />
          <Route path="/curriculum/:type/:board/:subject" element={<CurriculumPage />} />
          <Route path="/curriculum/:type/:board/:subject/:title/:pdfFile" element={<CurriculumPdfViewerPage />} />
          <Route path="/curriculum/:type/:board/:subject/:title" element={<TopicPage />} />
          <Route path="/topicals" element={<TopicalPages />} />
          <Route path="/topicals/:level/:board/:subject" element={<TopicalPages />} />
          <Route path="/pastpapers" element={<Pastpapers />} />
          <Route path="/pastpapers/:level/:board/:subject" element={<Pastpapers />} />
          <Route path="/pastpapers/:level/:board/:subject/:year/:paperKey/:unit" element={<PaperViewer />} />
        </Route>
        </Route>
      </Routes>
  );
}

function ConditionalLayout() {
  return <Outlet />;
}

function App() {
  return (
    <DarkModeProvider>
      <UserProvider>
        <AuthProvider>
          <EngagementProvider>
            <Router>
              <LockInProvider>
                <GlobalLockInManager>
                  <AppContent />
                </GlobalLockInManager>
              </LockInProvider>
            </Router>
          </EngagementProvider>
        </AuthProvider>
      </UserProvider>
    </DarkModeProvider>
  );
}

export default App;