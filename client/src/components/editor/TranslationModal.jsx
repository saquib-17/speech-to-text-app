import { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Languages,
  Check,
  Copy,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileText,
  FilePlus2,
  CheckCircle2,
  Search,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Badge from "../common/Badge";
import AiQuotaBanner from "../common/AiQuotaBanner";
import TranslationLoader from "./TranslationLoader";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  getQuotaCooldown,
  recordQuotaCooldown,
  QUOTA_EVENT_NAME,
} from "../../utils/aiQuota";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
];

const POPULAR_LANGUAGES = [
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "English",
  "Spanish",
  "French",
  "Arabic",
];

export const TranslationModal = ({
  isOpen,
  onClose,
  transcript,
  currentContent,
  onReplaceContent,
  onSaveCopy,
}) => {
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("Kannada");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Translation execution states
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Replace Confirmation Step
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isSavingCopy, setIsSavingCopy] = useState(false);

  // Quota tracking
  const [quotaState, setQuotaState] = useState(getQuotaCooldown());
  const toast = useToast();

  const textToTranslate = currentContent || transcript?.transcriptionText || "";

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuotaState(getQuotaCooldown());
      setErrorMessage(null);
      setShowReplaceConfirm(false);
      setIsDropdownOpen(false);

      // Pre-set target language based on detected transcript language
      const detectedLang = transcript?.transcriptionMetadata?.language?.toLowerCase();
      if (detectedLang === "en") {
        setTargetLanguage("Kannada");
      } else if (detectedLang === "kn" || detectedLang === "hi") {
        setTargetLanguage("English");
      }
    } else {
      setTranslationResult(null);
      setErrorMessage(null);
      setShowReplaceConfirm(false);
    }
  }, [isOpen, transcript]);

  // Quota event listener
  useEffect(() => {
    const handleQuotaEvent = (e) => {
      setQuotaState(e.detail || getQuotaCooldown());
    };
    window.addEventListener(QUOTA_EVENT_NAME, handleQuotaEvent);
    return () => window.removeEventListener(QUOTA_EVENT_NAME, handleQuotaEvent);
  }, []);

  // Filter languages by search query
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle Translate API call
  const handleTranslate = async () => {
    if (!textToTranslate.trim()) {
      toast.error("Transcript text is empty. Nothing to translate.");
      return;
    }

    if (quotaState.isCooldownActive) {
      toast.error(
        quotaState.message ||
          "Daily Gemini AI request limit reached. Please wait for the quota reset."
      );
      return;
    }

    setIsTranslating(true);
    setErrorMessage(null);

    try {
      const res = await api.ai.translate(transcript._id, {
        targetLanguage,
        sourceLanguage: sourceLanguage === "auto" ? "auto" : sourceLanguage,
      });

      if (res.success && res.data) {
        setTranslationResult(res.data);
        toast.success(`Translated to ${res.data.targetLanguage} successfully.`);
      } else {
        throw new Error(res.message || "Failed to translate transcript.");
      }
    } catch (err) {
      console.error("Translation error:", err);
      const msg =
        err.message ||
        err.data?.message ||
        "An unexpected error occurred during translation.";

      if (err.status === 429 || err.statusCode === 429) {
        recordQuotaCooldown({
          retryAfter: err.retryAfter || 60,
          retryAt: err.retryAt,
          message: msg,
        });
        setQuotaState(getQuotaCooldown());
      }

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsTranslating(false);
    }
  };

  // Copy Translated Text to clipboard
  const handleCopyTranslated = () => {
    if (!translationResult?.translatedText) return;
    navigator.clipboard.writeText(translationResult.translatedText);
    setIsCopied(true);
    toast.success("Translated text copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Option A: Replace Original
  const handleConfirmReplace = async () => {
    if (!translationResult?.translatedText) return;
    setIsReplacing(true);
    try {
      if (onReplaceContent) {
        await onReplaceContent(translationResult.translatedText, translationResult.targetLanguage);
      }
      toast.success("Editor text replaced with translated content.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to replace editor content.");
    } finally {
      setIsReplacing(false);
      setShowReplaceConfirm(false);
    }
  };

  // Option B: Save as New Copy
  const handleSaveAsCopy = async () => {
    if (!translationResult?.translatedText) return;
    setIsSavingCopy(true);
    try {
      const baseTitle = transcript?.title || "Voice Recording";
      const newTitle = `${baseTitle} — ${translationResult.targetLanguage} Translation`;

      if (onSaveCopy) {
        await onSaveCopy({
          title: newTitle,
          transcriptionText: translationResult.translatedText,
          originalText: transcript?.originalText || transcript?.transcriptionText || textToTranslate,
          targetLanguage: translationResult.targetLanguage,
        });
      } else {
        // Fallback direct creation
        await api.transcripts.create({
          title: newTitle,
          transcriptionText: translationResult.translatedText,
          originalText: transcript?.originalText || transcript?.transcriptionText || textToTranslate,
          status: "completed",
          audioMetadata: transcript?.audioMetadata || {
            originalName: `${baseTitle}.wav`,
            mimeType: "audio/wav",
            sizeBytes: 0,
            durationSeconds: 0,
          },
          transcriptionMetadata: {
            ...(transcript?.transcriptionMetadata || {}),
            language: translationResult.targetLanguage.toLowerCase().slice(0, 5),
          },
        });
      }

      toast.success(`Saved new copy: "${newTitle}"`);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save translated copy.");
    } finally {
      setIsSavingCopy(false);
    }
  };

  const wordCountOriginal = textToTranslate.trim() ? textToTranslate.trim().split(/\s+/).length : 0;
  const wordCountTranslated = translationResult?.translatedText?.trim()
    ? translationResult.translatedText.trim().split(/\s+/).length
    : 0;

  const isProcessingOrFailed = isTranslating || Boolean(errorMessage && !translationResult);
  const detectedLanguageName =
    SUPPORTED_LANGUAGES.find(
      (l) => l.code === transcript?.transcriptionMetadata?.language?.toLowerCase()
    )?.name || "English";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isTranslating && !isReplacing && !isSavingCopy) {
          onClose();
        }
      }}
      title={
        isProcessingOrFailed ? null : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] flex items-center justify-center text-[#7138B8] shadow-2xs">
              <Globe className="w-4 h-4" />
            </div>
            <span>Translate Transcript</span>
          </div>
        )
      }
      subtitle={
        isProcessingOrFailed
          ? null
          : "High-fidelity multilingual translation powered by Gemini AI"
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Active Quota Cooldown Banner */}
        {quotaState.isCooldownActive && (
          <AiQuotaBanner
            retryAt={quotaState.retryAt}
            customMessage={quotaState.message}
          />
        )}

        {/* State 1: In-Flight Translation Loader or Failed Retry View */}
        {isProcessingOrFailed ? (
          <TranslationLoader
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            detectedLanguage={detectedLanguageName}
            error={errorMessage}
            onRetry={handleTranslate}
            onCancel={() => {
              setErrorMessage(null);
              setIsTranslating(false);
            }}
          />
        ) : !translationResult ? (
          /* State 2: Configuration Form */
          <div className="space-y-4">
            {/* Language Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Source Language */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#191B2B] flex items-center gap-1.5">
                  <span>Source Language</span>
                  <span className="text-[11px] text-[#686B7A] font-normal">(Input)</span>
                </label>
                <div className="relative">
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full h-[38px] px-3 pr-8 rounded-xl bg-[#FAF9FC] border border-[#EBE8F0] text-[13px] text-[#191B2B] font-medium focus:outline-none focus:border-[#7138B8] focus:ring-2 focus:ring-[#7138B8]/15 appearance-none cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="auto">Auto-detect Language (Recommended)</option>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.name}>
                        {l.name} ({l.nativeName})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#686B7A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Target Language with Searchable Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#191B2B] flex items-center gap-1.5">
                  <span>Target Language</span>
                  <span className="text-[11px] text-[#F07800] font-semibold">(Output)</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-[38px] px-3 pr-8 rounded-xl bg-[#FAF9FC] border border-[#EBE8F0] text-[13px] text-[#191B2B] font-semibold flex items-center justify-between focus:outline-none focus:border-[#F07800] focus:ring-2 focus:ring-[#F07800]/15 cursor-pointer transition-all shadow-2xs text-left"
                  >
                    <span className="truncate">
                      {targetLanguage}
                      <span className="text-[#686B7A] font-normal text-xs ml-1.5">
                        ({SUPPORTED_LANGUAGES.find((l) => l.name === targetLanguage)?.nativeName || ""})
                      </span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#686B7A] shrink-0 ml-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EBE8F0] rounded-xl shadow-lg z-20 overflow-hidden max-h-60 flex flex-col">
                      <div className="p-2 border-b border-[#EBE8F0] bg-[#FAF9FC]">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#686B7A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search languages..."
                            className="w-full h-[32px] pl-8 pr-2.5 text-xs bg-white border border-[#EBE8F0] rounded-lg focus:outline-none focus:border-[#F07800]"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto flex-1 divide-y divide-[#EBE8F0]/50">
                        {filteredLanguages.length === 0 ? (
                          <div className="p-3 text-center text-xs text-[#686B7A]">
                            No matching language found.
                          </div>
                        ) : (
                          filteredLanguages.map((l) => {
                            const isSelected = targetLanguage === l.name;
                            return (
                              <button
                                key={l.code}
                                type="button"
                                onClick={() => {
                                  setTargetLanguage(l.name);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#FFF9F3] transition-colors cursor-pointer ${
                                  isSelected ? "bg-[#FFF1E2] text-[#F07800] font-semibold" : "text-[#191B2B]"
                                }`}
                              >
                                <div>
                                  <span className="font-medium">{l.name}</span>
                                  <span className="text-[#686B7A] ml-1.5">({l.nativeName})</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#F07800]" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Popular Quick-Select Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#686B7A] uppercase tracking-wider">
                Common Languages:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LANGUAGES.map((langName) => {
                  const isSelected = targetLanguage === langName;
                  return (
                    <button
                      key={langName}
                      type="button"
                      onClick={() => {
                        setTargetLanguage(langName);
                        setIsDropdownOpen(false);
                      }}
                      className={`h-[28px] px-2.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#7138B8] text-white shadow-2xs font-semibold"
                          : "bg-[#FAF9FC] hover:bg-[#FFF1E2] text-[#686B7A] hover:text-[#F07800] border border-[#EBE8F0]"
                      }`}
                    >
                      {langName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Text Summary Box */}
            <div className="p-3 rounded-xl bg-[#FAF9FC] border border-[#EBE8F0] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#686B7A]">
                <span className="font-semibold text-[#191B2B] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#7138B8]" />
                  Original Content Preview
                </span>
                <span className="font-mono text-[11px]">{wordCountOriginal} words</span>
              </div>
              <p className="text-xs text-[#686B7A] line-clamp-3 leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#EBE8F0]/70">
                &ldquo;{textToTranslate.slice(0, 300)}{textToTranslate.length > 300 ? "..." : ""}&rdquo;
              </p>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#DC4545]/30 text-[#DC4545] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Translation failed</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EBE8F0]">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isTranslating}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={isTranslating ? RefreshCw : Globe}
                isLoading={isTranslating}
                disabled={quotaState.isCooldownActive || isTranslating || !textToTranslate.trim()}
                onClick={handleTranslate}
                className="font-semibold shadow-xs"
              >
                {isTranslating ? "Translating Transcript..." : `Translate to ${targetLanguage}`}
              </Button>
            </div>
          </div>
        ) : (
          /* State 2: Translation Preview & Actions */
          <div className="space-y-4">
            {/* Header info badge */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EBE8F0]">
              <div className="flex items-center gap-2">
                <Badge variant="completed" size="sm" icon={CheckCircle2}>
                  {translationResult.targetLanguage} Translation Ready
                </Badge>
                <span className="text-xs text-[#686B7A]">
                  <span className="font-mono">{wordCountTranslated}</span> words
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTranslated}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7138B8] hover:text-[#5B2C96] font-semibold transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#269B62]" />
                      <span className="text-[#269B62]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranslationResult(null);
                    setShowReplaceConfirm(false);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#686B7A] hover:text-[#191B2B] font-medium transition-colors cursor-pointer ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>New Language</span>
                </button>
              </div>
            </div>

            {/* Translated Content Preview Box */}
            <div className="rounded-xl border border-[#EBE8F0] bg-[#FAF9FC] p-3.5 max-h-72 overflow-y-auto">
              <p className="text-[13.5px] text-[#191B2B] leading-relaxed whitespace-pre-wrap font-sans">
                {translationResult.translatedText}
              </p>
            </div>

            {/* Replace Confirmation Prompt (Inline Guard) */}
            {showReplaceConfirm ? (
              <div className="p-3.5 rounded-xl bg-[#FFF1E2] border border-[#F07800]/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#F07800] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#191B2B]">
                      Confirm Replacing Editor Content?
                    </h4>
                    <p className="text-xs text-[#686B7A] mt-0.5 leading-relaxed">
                      This will update the active editor with the {translationResult.targetLanguage} translation. Your original speech transcript remains securely archived and recoverable at any time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowReplaceConfirm(false)}
                    disabled={isReplacing}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isReplacing}
                    onClick={handleConfirmReplace}
                    className="font-semibold shadow-xs"
                  >
                    Confirm & Replace
                  </Button>
                </div>
              </div>
            ) : (
              /* Action Options */
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-semibold text-[#686B7A] uppercase tracking-wider">
                  Select How to Apply Translation:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Replace Original */}
                  <button
                    type="button"
                    onClick={() => setShowReplaceConfirm(true)}
                    disabled={isReplacing || isSavingCopy}
                    className="p-3.5 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#F07800]/50 hover:bg-[#FFF9F3] text-left transition-all shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF1E2] text-[#F07800] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[13px] font-semibold text-[#191B2B] group-hover:text-[#F07800] transition-colors">
                        Replace Original
                      </span>
                    </div>
                    <p className="text-[11px] text-[#686B7A] leading-relaxed">
                      Update the current editor with the translated text. Original audio & archive can be restored.
                    </p>
                  </button>

                  {/* Option B: Save as New Copy */}
                  <button
                    type="button"
                    onClick={handleSaveAsCopy}
                    disabled={isReplacing || isSavingCopy}
                    className="p-3.5 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#7138B8]/50 hover:bg-[#FAF9FC] text-left transition-all shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-[#F0EBF8] text-[#7138B8] flex items-center justify-center shrink-0">
                        <FilePlus2 className="w-4 h-4" />
                      </div>
                      <span className="text-[13px] font-semibold text-[#191B2B] group-hover:text-[#7138B8] transition-colors">
                        Save as New Copy
                      </span>
                    </div>
                    <p className="text-[11px] text-[#686B7A] leading-relaxed">
                      Create a dedicated transcript file titled &ldquo;{transcript?.title || "Voice Recording"} — {translationResult.targetLanguage} Translation&rdquo;.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EBE8F0]">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isReplacing || isSavingCopy}
              >
                Close
              </Button>

              <span className="text-[11px] text-[#686B7A]">
                Original speech audio remains 100% unaltered.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TranslationModal;
