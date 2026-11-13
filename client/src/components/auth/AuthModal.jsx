import { useState, useEffect } from "react";
import { X, Radio, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Input from "../common/Input";
import Button from "../common/Button";

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
  title = null,
  subtitle = null,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, register } = useAuth();
  const toast = useToast();

  // Reset inputs & sync mode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialMode]);

  // Support closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFillDemo = () => {
    setMode("login");
    setEmail("alex.mercer@speechscribe.ai");
    setPassword("SpeechScribe2026!");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back to SpeechScribe!");
      } else {
        await register(name, email, password);
        toast.success("Account created successfully!");
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err.message || (mode === "login" ? "Invalid email or password." : "Registration failed.");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172341]/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[14px] border border-[#EBE8F0] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 pb-2.5 border-b border-[#EBE8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] rounded-lg bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] shrink-0 shadow-2xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#191B2B]">
                {title || (mode === "login" ? "Sign In to Workspace" : "Create Your Account")}
              </h3>
              <p className="text-[11px] text-[#686B7A]">
                {subtitle || "Modern speech intelligence & private audio"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#686B7A] hover:text-[#191B2B] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EBE8F0] bg-[#FAF9FC]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold text-center transition-colors cursor-pointer border-b-2 ${mode === "login"
              ? "border-[#F07800] text-[#F07800] bg-white"
              : "border-transparent text-[#686B7A] hover:text-[#191B2B]"
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold text-center transition-colors cursor-pointer border-b-2 ${mode === "register"
              ? "border-[#F07800] text-[#F07800] bg-white"
              : "border-transparent text-[#686B7A] hover:text-[#191B2B]"
              }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-3.5 sm:p-4 pt-3">
          {mode === "login" && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-[#F07800] hover:text-[#D96B00] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3 text-[#7138B8]" />
                <span>Fill Demo Credentials</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
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
            )}

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
              placeholder={mode === "register" ? "Minimum 8 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {mode === "register" && (
              <Input
                label="Confirm Password"
                type="password"
                icon={Lock}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-[#FDECEC] border border-[#F8BDBD] text-[#DC4545] text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center mt-2 font-semibold shadow-xs"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              {mode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
