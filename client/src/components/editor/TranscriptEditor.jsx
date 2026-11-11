import { useState, useEffect, useRef } from "react";
import {
  Copy,
  Check,
  Download,
  Sparkles,
  Trash2,
  Clock,
  Type,
  Languages,
  CheckCircle2,
  Loader2,
  Calendar,
} from "lucide-react";
import SynchronizedPlayer from "./SynchronizedPlayer";
import ExportModal from "./ExportModal";
import AiDrawer from "./AiDrawer";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Modal from "../common/Modal";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";

export const TranscriptEditor = ({ transcript, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(transcript?.title || "");
  const [content, setContent] = useState(transcript?.transcriptionText || "");
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | unsaved
  const [isCopied, setIsCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();
  const saveTimeoutRef = useRef(null);

  // Sync state if prop changes
  useEffect(() => {
    if (transcript) {
      setTitle(transcript.title || "");
      setContent(transcript.transcriptionText || "");
      setSaveStatus("saved");
    }
  }, [transcript]);

  // Debounced Auto-Save
  const triggerAutoSave = (newTitle, newContent) => {
    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await api.transcripts.update(transcript._id, {
          title: newTitle,
          transcriptionText: newContent,
        });
        if (res.success && res.data) {
          setSaveStatus("saved");
          if (onUpdate) onUpdate(res.data);
        }
      } catch (err) {
        setSaveStatus("unsaved");
        toast.error(err.message || "Failed to auto-save changes.");
      }
    }, 1200);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast.success("Transcript copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.transcripts.delete(transcript._id);
      toast.success("Transcript deleted successfully.");
      setShowDeleteModal(false);
      if (onDelete) onDelete(transcript._id);
    } catch (err) {
      toast.error(err.message || "Failed to delete transcript.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Text statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const metadata = transcript?.transcriptionMetadata || {};
  const audioMeta = transcript?.audioMetadata || {};

  return (
    <div className="space-y-3.5">
      {/* Top Header Card (Compact) */}
      <div className="p-3.5 sm:p-4.5 rounded-xl bg-pure-white border border-warm-grey space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Editable Title */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Transcript"
              className="w-full bg-transparent text-lg sm:text-xl font-bold text-charcoal placeholder:text-stone-grey-light focus:outline-none focus:border-b focus:border-amber-brand py-0.5"
            />

            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-stone-grey">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-stone-grey" />
                {new Date(transcript.createdAt).toLocaleDateString()}
              </span>

              {/* Autosave status indicator */}
              <span className="flex items-center gap-1 font-mono text-[10px]">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="w-2.5 h-2.5 text-amber-brand animate-spin" />
                    <span className="text-amber-brand">Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5 text-amber-brand" />
                    <span className="text-stone-grey">Saved</span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-soft" />
                    <span className="text-amber-soft">Unsaved edits</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon={isCopied ? Check : Copy}
              onClick={handleCopy}
              className={isCopied ? "text-amber-brand" : ""}
            >
              {isCopied ? "Copied" : "Copy"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => setShowExportModal(true)}
            >
              Export
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => setShowAiDrawer(true)}
            >
              AI Insights
            </Button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-stone-grey hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
              title="Delete Transcript"
              aria-label="Delete transcript"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Audio Player if URL available */}
        {audioMeta.storageUrl && (
          <SynchronizedPlayer
            audioUrl={audioMeta.storageUrl}
            durationSeconds={audioMeta.durationSeconds || metadata.durationSeconds}
          />
        )}

        {/* Telemetry Chips Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-warm-grey/60">
          <Badge variant="neutral" size="sm" icon={Type}>
            <span className="font-mono">{wordCount}</span> words • <span className="font-mono">{charCount}</span> chars
          </Badge>

          <Badge variant="neutral" size="sm" icon={Clock}>
            ~<span className="font-mono">{readingTimeMinutes}</span> min read
          </Badge>

          <Badge variant="neutral" size="sm" icon={Languages}>
            Language: <span className="font-mono font-medium">{metadata.language?.toUpperCase() || "EN"}</span>
          </Badge>

          <Badge variant="neutral" size="sm">
            Engine: Faster-Whisper ({metadata.model || "base"})
          </Badge>
        </div>
      </div>

      {/* Primary Transcript Content Editor */}
      <div className="rounded-xl bg-pure-white border border-warm-grey p-4 sm:p-5 shadow-2xs">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Transcription text..."
          rows={14}
          className="w-full bg-transparent text-charcoal text-sm sm:text-base leading-relaxed tracking-normal resize-y focus:outline-none placeholder:text-stone-grey-light font-sans"
        />
      </div>

      {/* Modals & Drawers */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        transcript={transcript}
      />

      <AiDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        transcript={transcript}
        onUpdateTranscript={onUpdate}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Transcript"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-stone-grey">
            Are you sure you want to permanently delete &ldquo;
            <span className="font-semibold text-charcoal">{title}</span>
            &rdquo;? All text, word timestamps, and associated AI insights will be removed.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TranscriptEditor;
