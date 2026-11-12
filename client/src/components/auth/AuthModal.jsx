import { useState } from "react";
import { X, Radio, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Input from "../common/Input";
import Button from "../common/Button";

export const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = "login", title = null, subtitle = null }) => {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, register } = useAuth();
  const toast = useToast();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-pure-white rounded-2xl border border-warm-grey shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-warm-grey/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warm-ivory border border-warm-grey flex items-center justify-center text-amber-brand">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal">
                {title || (mode === "login" ? "Sign In to Workspace" : "Create Your Account")}
              </h3>
              <p className="text-[11px] text-stone-grey">
                {subtitle || "Audio transcription & AI intelligence"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-grey hover:text-charcoal hover:bg-warm-ivory transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-warm-grey/60 bg-warm-ivory/50">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors cursor-pointer border-b-2 ${
              mode === "login"
                ? "border-amber-brand text-amber-brand bg-pure-white"
                : "border-transparent text-stone-grey hover:text-charcoal"
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
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors cursor-pointer border-b-2 ${
              mode === "register"
                ? "border-amber-brand text-amber-brand bg-pure-white"
                : "border-transparent text-stone-grey hover:text-charcoal"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5">
          {mode === "login" && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-amber-brand hover:text-amber-brand-hover font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3" />
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
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
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

