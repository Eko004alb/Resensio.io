import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TestPage from './pages/TestPage';
import ResultsPage from './pages/ResultsPage';
import JournalPage from './pages/JournalPage';
import PAQTestPage from './pages/PAQTestPage';
import PAQResultsPage from './pages/PAQResultsPage';
import DiarioEmotivoPage from './pages/DiarioEmotivoPage';
import EmotionDetailPage from './pages/EmotionDetailPage';
import MoodTrackerPage from './pages/MoodTrackerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const LOADER_DURATION = 1000;
const FADE_OUT_START = 780;

function TransitionLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [firstMount, setFirstMount] = useState(true);

  useEffect(() => {
    if (firstMount) {
      setFirstMount(false);
      return;
    }

    setLoading(true);
    setExiting(false);

    const exitTimer = setTimeout(() => setExiting(true), FADE_OUT_START);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setExiting(false);
    }, LOADER_DURATION);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {loading && <PageLoader exiting={exiting} />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TransitionLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
            <Route path="/test" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/mood" element={<ProtectedRoute><MoodTrackerPage /></ProtectedRoute>} />
            <Route path="/paq" element={<ProtectedRoute><PAQTestPage /></ProtectedRoute>} />
            <Route path="/paq-results" element={<ProtectedRoute><PAQResultsPage /></ProtectedRoute>} />
            <Route path="/diario" element={<ProtectedRoute><DiarioEmotivoPage /></ProtectedRoute>} />
            <Route path="/emotion-detail" element={<ProtectedRoute><EmotionDetailPage /></ProtectedRoute>} />
          </Routes>
        </TransitionLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
