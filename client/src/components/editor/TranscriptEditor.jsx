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
  Globe,
  RotateCcw,
} from "lucide-react";
import SynchronizedPlayer from "./SynchronizedPlayer";
import ExportModal from "./ExportModal";
import AiDrawer from "./AiDrawer";
import TranslationModal from "./TranslationModal";
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
  const [showTranslateModal, setShowTranslateModal] = useState(false);
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

  const handleReplaceContent = async (newText, targetLang) => {
    setContent(newText);
    setSaveStatus("saving");
    try {
      const res = await api.transcripts.update(transcript._id, {
        title,
        transcriptionText: newText,
      });
      if (res.success && res.data) {
        setSaveStatus("saved");
        if (onUpdate) onUpdate(res.data);
      }
    } catch (err) {
      setSaveStatus("unsaved");
      throw err;
    }
  };

  const handleSaveCopy = async ({ title: newTitle, transcriptionText, originalText, targetLanguage }) => {
    const res = await api.transcripts.create({
      title: newTitle,
      transcriptionText,
      originalText,
      status: "completed",
      audioMetadata: transcript.audioMetadata || {
        originalName: `${newTitle}.wav`,
        mimeType: "audio/wav",
        sizeBytes: 0,
        durationSeconds: 0,
      },
      transcriptionMetadata: {
        ...(transcript.transcriptionMetadata || {}),
        language: targetLanguage.toLowerCase().slice(0, 5),
      },
    });
    return res;
  };

  const handleRestoreOriginal = async () => {
    if (!transcript.originalText) return;
    setContent(transcript.originalText);
    setSaveStatus("saving");
    try {
      const res = await api.transcripts.update(transcript._id, {
        title,
        transcriptionText: transcript.originalText,
      });
      if (res.success && res.data) {
        setSaveStatus("saved");
        if (onUpdate) onUpdate(res.data);
      }
      toast.success("Restored original speech transcription.");
    } catch (err) {
      setSaveStatus("unsaved");
      toast.error(err.message || "Failed to restore original transcript.");
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
      {/* Top Header Card */}
      <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Editable Title */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Transcript"
              className="w-full bg-transparent text-[20px] sm:text-[23px] font-semibold text-[#191B2B] placeholder:text-[#9598A8] focus:outline-none focus:border-b-2 focus:border-[#F07800] py-0.5"
            />

            <div className="flex flex-wrap items-center gap-3 mt-1 text-[12px] text-[#686B7A]">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#686B7A]" />
                {new Date(transcript.createdAt).toLocaleDateString()}
              </span>

              {/* Autosave status indicator */}
              <span className="flex items-center gap-1 font-mono text-[11px]">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="w-3 h-3 text-[#F07800] animate-spin" />
                    <span className="text-[#F07800] font-semibold">Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#269B62]" />
                    <span className="text-[#686B7A]">Saved</span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF9B24]" />
                    <span className="text-[#FF9B24] font-medium">Unsaved edits</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={isCopied ? Check : Copy}
              onClick={handleCopy}
              className={isCopied ? "text-[#F07800] border-[#F07800]" : ""}
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
              variant="secondary"
              size="sm"
              icon={Globe}
              onClick={() => setShowTranslateModal(true)}
            >
              Translate
            </Button>

            <Button
              variant="purple"
              size="sm"
              icon={Sparkles}
              onClick={() => setShowAiDrawer(true)}
              className="shadow-xs font-semibold"
            >
              AI Insights
            </Button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-[#686B7A] hover:text-[#DC4545] hover:bg-[#FDECEC] rounded-lg transition-colors ml-0.5 cursor-pointer"
              title="Delete Transcript"
              aria-label="Delete transcript"
            >
              <Trash2 className="w-4 h-4" />
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
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EBE8F0]">
          <Badge variant="neutral" size="sm" icon={Type}>
            <span className="font-mono">{wordCount}</span> words • <span className="font-mono">{charCount}</span> chars
          </Badge>

          <Badge variant="neutral" size="sm" icon={Clock}>
            ~<span className="font-mono">{readingTimeMinutes}</span> min read
          </Badge>

          <Badge variant="neutral" size="sm" icon={Languages}>
            Language: <span className="font-mono font-bold text-[#F07800]">{metadata.language?.toUpperCase() || "EN"}</span>
          </Badge>

          <Badge variant="neutral" size="sm">
            Engine: Faster-Whisper ({metadata.model || "base"})
          </Badge>

          {transcript.originalText && transcript.originalText !== content && (
            <button
              type="button"
              onClick={handleRestoreOriginal}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF1E2] border border-[#F07800]/30 text-[#F07800] text-[11px] font-semibold hover:bg-[#F07800] hover:text-white transition-all cursor-pointer shadow-2xs ml-auto"
              title="Click to restore original speech transcription"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Original</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Transcript Content Editor */}
      <div className="rounded-xl bg-white border border-[#EBE8F0] p-4 sm:p-5 shadow-2xs">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Transcription text..."
          rows={14}
          className="w-full bg-transparent text-[#191B2B] text-[13.5px] sm:text-[14px] leading-relaxed tracking-normal resize-y focus:outline-none placeholder:text-[#9598A8] font-sans"
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

      <TranslationModal
        isOpen={showTranslateModal}
        onClose={() => setShowTranslateModal(false)}
        transcript={transcript}
        currentContent={content}
        onReplaceContent={handleReplaceContent}
        onSaveCopy={handleSaveCopy}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Transcript"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#686B7A]">
            Are you sure you want to permanently delete &ldquo;
            <span className="font-bold text-[#191B2B]">{title}</span>
            &rdquo;? All text, word timestamps, and associated AI insights will be removed.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
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
