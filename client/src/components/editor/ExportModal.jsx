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
      doc.setTextColor(25, 27, 43);
      doc.text(title, margin, y);
      y += 22;

      // Metadata subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(104, 107, 122);
      const meta = `Recorded on ${dateStr} • Engine: ${transcript.transcriptionMetadata?.provider || "Faster-Whisper"} (${transcript.transcriptionMetadata?.model || "base"}) • Lang: ${transcript.transcriptionMetadata?.language || "en"}`;
      doc.text(meta, margin, y);
      y += 14;

      // Divider line
      doc.setDrawColor(235, 232, 240);
      doc.line(margin, y, margin + contentWidth, y);
      y += 22;

      // Body text with automatic line-wrapping
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(25, 27, 43);
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
      <div className="space-y-2.5 pt-0.5">
        {/* PDF Option */}
        <div
          onClick={exportPdf}
          className="p-3 rounded-xl bg-[#FAF9FC] hover:bg-[#FFF1E2] border border-[#EBE8F0] cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF1E2] text-[#F07800] flex items-center justify-center shrink-0 border border-[#F07800]/20">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-[13px] font-semibold text-[#191B2B] group-hover:text-[#F07800] transition-colors">PDF Document (.pdf)</h4>
              <p className="text-[11px] text-[#686B7A]">Formatted document with headers and pagination</p>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-[#686B7A] group-hover:text-[#F07800] transition-colors" />
        </div>

        {/* Markdown Option */}
        <div
          onClick={exportMd}
          className="p-3 rounded-xl bg-[#FAF9FC] hover:bg-[#F3EBFC] border border-[#EBE8F0] cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F3EBFC] text-[#7138B8] flex items-center justify-center shrink-0 border border-[#7138B8]/20">
              <FileCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-[13px] font-semibold text-[#191B2B] group-hover:text-[#7138B8] transition-colors">Markdown Document (.md)</h4>
              <p className="text-[11px] text-[#686B7A]">Clean plain markdown with frontmatter metadata</p>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-[#686B7A] group-hover:text-[#7138B8] transition-colors" />
        </div>

        {/* Plain Text Option */}
        <div
          onClick={exportTxt}
          className="p-3 rounded-xl bg-[#FAF9FC] hover:bg-[#FAF9FC]/80 border border-[#EBE8F0] cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-[#191B2B] flex items-center justify-center shrink-0 border border-[#EBE8F0]">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-[13px] font-semibold text-[#191B2B]">Plain Text (.txt)</h4>
              <p className="text-[11px] text-[#686B7A]">Standard unformatted text file</p>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-[#686B7A] group-hover:text-[#191B2B] transition-colors" />
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
