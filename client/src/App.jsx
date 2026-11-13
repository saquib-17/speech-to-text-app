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
            {/* Standalone Auth Routes (Fallback / direct links) */}
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

            {/* Seamless Universal Workspace Layout (All sections navigable in Guest Mode) */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="studio" element={<AudioStudio />} />
              <Route path="editor/:id" element={<TranscriptEditorPage />} />
              <Route path="transcripts" element={<HistoryLibrary mode="transcripts" />} />
              <Route path="history" element={<HistoryLibrary mode="history" />} />
              <Route path="insights" element={<AiWorkspacePage />} />
              <Route path="settings" element={<Settings />} />
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
