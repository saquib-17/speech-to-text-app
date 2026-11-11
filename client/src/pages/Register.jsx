import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, Mail, Lock, User, ArrowRight } from "lucide-react";
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
      navigate("/dashboard");
    } catch (err) {
      const msg = err.message || "Registration failed. Please check your inputs.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory text-charcoal flex flex-col justify-center items-center p-4 selection:bg-amber-brand/15 selection:text-charcoal">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pure-white border border-warm-grey text-amber-brand mb-2 shadow-xs">
            <Radio className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">SpeechScribe AI</h1>
          <p className="text-xs text-stone-grey mt-0.5">Join the Speech Intelligence Workspace</p>
        </div>

        {/* Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-pure-white border border-warm-grey shadow-md">
          <h2 className="text-base font-semibold text-charcoal mb-0.5">Create Account</h2>
          <p className="text-xs text-stone-grey mb-4">Start transcribing with local open-source speech AI.</p>

          <form onSubmit={handleSubmit} className="space-y-2.5">
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
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="w-full justify-center mt-1"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-warm-grey/70 text-center">
            <p className="text-xs text-stone-grey">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-brand hover:text-amber-brand-hover font-semibold underline underline-offset-2">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
