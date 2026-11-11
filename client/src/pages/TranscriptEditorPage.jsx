import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import TranscriptEditor from "../components/editor/TranscriptEditor";
import Skeleton from "../components/common/Skeleton";
import Button from "../components/common/Button";
import api from "../api/client";

export const TranscriptEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTranscript();
  }, [id]);

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
    navigate("/history");
  };

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-grey hover:text-charcoal transition-colors cursor-pointer py-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-pure-white border border-warm-grey text-center py-12 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm sm:text-base font-semibold text-charcoal">Transcript Not Found</h3>
          <p className="text-xs text-stone-grey max-w-sm mx-auto mt-1 mb-4">{error}</p>
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
