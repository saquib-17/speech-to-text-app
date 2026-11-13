import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Lock, LogIn } from "lucide-react";
import TranscriptEditor from "../components/editor/TranscriptEditor";
import Skeleton from "../components/common/Skeleton";
import Button from "../components/common/Button";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export const TranscriptEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();

  const [transcript, setTranscript] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchTranscript();
      } else {
        setIsLoading(false);
      }
    }
  }, [id, isAuthenticated, authLoading]);

  const fetchTranscript = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.transcripts.getById(id);
      if (res.success && res.data) {
        setTranscript(res.data);
      } else {
        throw new Error(res.message || "Transcript not found.");
      }
    } catch (err) {
      console.error("Fetch transcript error:", err);
      setError(err.message || "Could not retrieve transcript.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (updatedDoc) => {
    setTranscript(updatedDoc);
  };

  const handleDelete = () => {
    navigate("/transcripts");
  };

  if (authLoading) {
    return (
      <div className="space-y-3.5 max-w-5xl mx-auto">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-3.5 max-w-5xl mx-auto">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#686B7A] hover:text-[#191B2B] transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        <div className="p-6 sm:p-7 rounded-[14px] bg-white border border-[#EBE8F0] text-center shadow-2xs max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center mx-auto mb-3 text-[#F07800] shadow-2xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-[17px] font-semibold text-[#191B2B]">Sign In to Access This Transcript</h3>
          <p className="text-xs text-[#686B7A] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
            Transcripts in SpeechScribe AI are encrypted and bound to user accounts. Please sign in or create an account to view and edit this document.
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <Button
              size="sm"
              variant="primary"
              icon={LogIn}
              onClick={() =>
                openAuthModal({
                  mode: "login",
                  title: "Sign In to Open Transcript",
                  subtitle: "Enter your credentials to access your transcript.",
                  onSuccess: fetchTranscript,
                })
              }
            >
              Sign In to Open
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                openAuthModal({
                  mode: "register",
                  title: "Create an Account",
                  subtitle: "Create an account to start managing transcripts.",
                  onSuccess: fetchTranscript,
                })
              }
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#686B7A] hover:text-[#191B2B] transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-white border border-[#EBE8F0] text-center py-10 shadow-2xs">
          <AlertCircle className="w-7 h-7 text-[#DC4545] mx-auto mb-2" />
          <h3 className="text-sm sm:text-base font-semibold text-[#191B2B]">Transcript Not Found</h3>
          <p className="text-xs text-[#686B7A] max-w-sm mx-auto mt-1 mb-4">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      ) : (
        <TranscriptEditor
          transcript={transcript}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default TranscriptEditorPage;
