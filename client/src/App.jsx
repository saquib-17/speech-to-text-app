import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

// Protected Route Guard: captures intended destination and redirects unauthenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center text-charcoal">
        <div className="w-12 h-12 rounded-xl bg-pure-white border border-warm-grey flex items-center justify-center text-amber-brand mb-4 shadow-sm animate-pulse">
          <Radio className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-stone-grey">Restoring SpeechScribe Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Guard (Redirects to intended destination or dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (isAuthenticated) {
    const destination = location.state?.from
      ? `${location.state.from.pathname || ""}${location.state.from.search || ""}`
      : "/dashboard";
    return <Navigate to={destination || "/dashboard"} replace />;
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

            {/* Dashboard-First Workspace Layout */}
            <Route path="/" element={<AppLayout />}>
              {/* Dashboard is public: works seamlessly for both guests and authenticated users */}
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Protected Workspace Routes requiring authentication */}
              <Route
                path="studio"
                element={
                  <ProtectedRoute>
                    <AudioStudio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="editor/:id"
                element={
                  <ProtectedRoute>
                    <TranscriptEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="history"
                element={
                  <ProtectedRoute>
                    <HistoryLibrary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="insights"
                element={
                  <ProtectedRoute>
                    <AiWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
