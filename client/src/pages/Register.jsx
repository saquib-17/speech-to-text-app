import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      toast.success("Account created successfully!");
      const target = location.state?.from
        ? `${location.state.from.pathname || ""}${location.state.from.search || ""}`
        : "/dashboard";
      navigate(target || "/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Registration failed. Please check your inputs.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#191B2B] flex flex-col justify-center items-center p-4 selection:bg-[#F07800]/15 selection:text-[#191B2B]">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F07800] text-white mb-2.5 shadow-2xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
              <path d="M4 10v4" />
              <path d="M8 7v10" />
              <path d="M12 4v16" />
              <path d="M16 8v8" />
              <path d="M20 11v2" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-[#191B2B]">SpeechScribe AI</h1>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3EBFC] text-[#7138B8]">v2</span>
          </div>
          <p className="text-[11.5px] text-[#686B7A] mt-0.5">Join the Speech Intelligence Workspace</p>
        </div>

        {/* Card */}
        <div className="p-5 sm:p-6 rounded-[14px] bg-white border border-[#EBE8F0] shadow-2xs">
          <h2 className="text-[17px] font-semibold text-[#191B2B] mb-1">Create Account</h2>
          <p className="text-[12px] text-[#686B7A] mb-4">Start transcribing with local open-source speech AI.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />

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
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={ArrowRight}
              isLoading={isLoading}
              className="w-full justify-center mt-3"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#EBE8F0] text-center">
            <p className="text-xs text-[#686B7A]">
              Already have an account?{" "}
              <Link
                to="/login"
                state={location.state}
                className="font-bold text-[#F07800] hover:text-[#D96B00] transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#686B7A] hover:text-[#191B2B] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue as Guest on Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
