import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AudioStudio from "./pages/AudioStudio";
import TranscriptEditorPage from "./pages/TranscriptEditorPage";
import HistoryLibrary from "./pages/HistoryLibrary";
import AiWorkspacePage from "./pages/AiWorkspacePage";
import Settings from "./pages/Settings";
import { Radio } from "lucide-react";

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center text-charcoal">
        <div className="w-12 h-12 rounded-xl bg-pure-white border border-warm-grey flex items-center justify-center text-amber-brand mb-4 shadow-sm animate-pulse">
          <Radio className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-stone-grey">Loading SpeechScribe...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard (Redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="studio" element={<AudioStudio />} />
              <Route path="editor/:id" element={<TranscriptEditorPage />} />
              <Route path="history" element={<HistoryLibrary />} />
              <Route path="insights" element={<AiWorkspacePage />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
