import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Radio, Mail, Lock, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back to SpeechScribe!");
      const target = location.state?.from
        ? `${location.state.from.pathname || ""}${location.state.from.search || ""}`
        : "/dashboard";
      navigate(target || "/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Invalid credentials. Please verify your email and password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("alex.mercer@speechscribe.ai");
    setPassword("SpeechScribe2026!");
  };

  return (
    <div className="min-h-screen bg-warm-ivory text-charcoal flex flex-col justify-center items-center p-4 selection:bg-amber-brand/15 selection:text-charcoal">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pure-white border border-warm-grey text-amber-brand mb-2 shadow-xs">
            <Radio className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">SpeechScribe AI</h1>
          <p className="text-xs text-stone-grey mt-0.5">High-Precision Audio Transcription & Intelligence</p>
        </div>

        {/* Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-pure-white border border-warm-grey shadow-md">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-base font-semibold text-charcoal">Sign In</h2>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-amber-brand hover:text-amber-brand-hover font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Demo</span>
            </button>
          </div>
          <p className="text-xs text-stone-grey mb-4">Enter your credentials to access your audio workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center mt-1 font-semibold shadow-xs"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In to Workspace
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-warm-grey/70 space-y-2 text-center">
            <p className="text-xs text-stone-grey">
              Don't have an account?{" "}
              <Link
                to="/register"
                state={location.state}
                className="text-amber-brand hover:text-amber-brand-hover font-semibold underline underline-offset-2"
              >
                Create Account
              </Link>
            </p>

            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-stone-grey hover:text-charcoal transition-colors font-medium"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Public Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
