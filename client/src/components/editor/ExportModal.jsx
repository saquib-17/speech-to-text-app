import { useState } from "react";
import { Download, FileText, FileCode } from "lucide-react";
import { jsPDF } from "jspdf";
import Modal from "../common/Modal";

export const ExportModal = ({ isOpen, onClose, transcript }) => {
  const [downloading, setDownloading] = useState(false);

  if (!transcript) return null;

  const title = transcript.title || "Untitled Transcript";
  const text = transcript.transcriptionText || "";
  const dateStr = new Date(transcript.createdAt).toLocaleDateString();

  // Export as Plain Text (.txt)
  const exportTxt = () => {
    const content = `${title.toUpperCase()}\nDate: ${dateStr}\nProvider: ${transcript.transcriptionMetadata?.provider || "Faster-Whisper"}\nLanguage: ${transcript.transcriptionMetadata?.language || "en"}\n\n${text}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  // Export as Markdown (.md)
  const exportMd = () => {
    const content = `---
title: "${title}"
date: "${dateStr}"
provider: "${transcript.transcriptionMetadata?.provider || "faster-whisper"}"
model: "${transcript.transcriptionMetadata?.model || "base"}"
language: "${transcript.transcriptionMetadata?.language || "en"}"
durationSeconds: ${transcript.transcriptionMetadata?.durationSeconds || 0}
---

# ${title}

*Recorded on ${dateStr} • Transcribed via Faster-Whisper*

---

${text}
`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  // Export as PDF via jsPDF
  const exportPdf = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 45;
      const contentWidth = pageWidth - margin * 2;
      let y = 50;

      // Header title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(41, 41, 41);
      doc.text(title, margin, y);
      y += 22;

      // Metadata subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(119, 115, 109);
      const meta = `Recorded on ${dateStr} • Engine: ${transcript.transcriptionMetadata?.provider || "Faster-Whisper"} (${transcript.transcriptionMetadata?.model || "base"}) • Lang: ${transcript.transcriptionMetadata?.language || "en"}`;
      doc.text(meta, margin, y);
      y += 14;

      // Divider line
      doc.setDrawColor(231, 224, 214);
      doc.line(margin, y, margin + contentWidth, y);
      y += 22;

      // Body text with automatic line-wrapping
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(41, 41, 41);
      const splitText = doc.splitTextToSize(text, contentWidth);

      for (let i = 0; i < splitText.length; i++) {
        if (y > 780) {
          doc.addPage();
          y = 50;
        }
        doc.text(splitText[i], margin, y);
        y += 16;
      }

      doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
      onClose();
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Transcript" subtitle="Select your preferred download format">
      <div className="space-y-2.5 pt-1">
        {/* PDF Option */}
        <div
          onClick={exportPdf}
          className="p-3 rounded-lg bg-warm-ivory hover:bg-warm-ivory-dark border border-warm-grey cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-brand-light text-amber-brand flex items-center justify-center shrink-0 border border-amber-brand/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">PDF Document (.pdf)</h4>
              <p className="text-[11px] text-stone-grey">Formatted document with headers and pagination</p>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-stone-grey group-hover:text-amber-brand transition-colors" />
        </div>

        {/* Markdown Option */}
        <div
          onClick={exportMd}
          className="p-3 rounded-lg bg-warm-ivory hover:bg-warm-ivory-dark border border-warm-grey cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pure-white text-charcoal flex items-center justify-center shrink-0 border border-warm-grey">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">Markdown File (.md)</h4>
              <p className="text-[11px] text-stone-grey">Structured markdown with YAML frontmatter</p>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-stone-grey group-hover:text-amber-brand transition-colors" />
        </div>

        {/* Plain Text Option */}
        <div
          onClick={exportTxt}
          className="p-3 rounded-lg bg-warm-ivory hover:bg-warm-ivory-dark border border-warm-grey cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pure-white text-stone-grey flex items-center justify-center shrink-0 border border-warm-grey">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">Plain Text (.txt)</h4>
              <p className="text-[11px] text-stone-grey">Standard unformatted raw text</p>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-stone-grey group-hover:text-amber-brand transition-colors" />
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
