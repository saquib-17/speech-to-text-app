import { ISpeechRecognitionProvider } from "./speechProvider.js";
import { HTTP_STATUS } from "../../config/constants.js";

/**
 * Lightweight async mutex to restrict concurrent CPU inference calls to 1.
 * Prevents CPU lockup and RAM exhaustion on low-power host CPUs (e.g. 15W Intel U-series).
 */
class AsyncSemaphore {
  constructor(maxConcurrency = 1) {
    this.maxConcurrency = maxConcurrency;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.maxConcurrency) {
      this.current++;
      return;
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release() {
    this.current--;
    if (this.queue.length > 0) {
      this.current++;
      const next = this.queue.shift();
      next();
    }
  }
}

const inferenceSemaphore = new AsyncSemaphore(1);

export class FasterWhisperProvider extends ISpeechRecognitionProvider {
  constructor(serviceUrl = process.env.WHISPER_SERVICE_URL || "http://127.0.0.1:5001") {
    super();
    this.serviceUrl = serviceUrl.replace(/\/+$/, "");
    this.providerName = "faster-whisper";
    this.modelName = "base";
  }

  getProviderName() {
    return this.providerName;
  }

  /**
   * Health check to test if local Python sidecar is reachable and ready.
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.serviceUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === "ready" || data.service === "faster-whisper";
    } catch {
      return false;
    }
  }

  /**
   * Transcribe an audio buffer using the local Faster-Whisper microservice.
   *
   * @param {Buffer} audioBuffer - Binary audio data in RAM
   * @param {string} mimeType - MIME type of the audio
   * @param {Object} [options] - Optional language code
   * @returns {Promise<import('./speechProvider.js').TranscriptionResult>}
   */
  async transcribe(audioBuffer, mimeType, options = {}) {
    if (!audioBuffer || audioBuffer.length === 0) {
      const err = new Error("Cannot transcribe empty audio buffer (0 bytes).");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Acquire CPU inference slot
    await inferenceSemaphore.acquire();

    let timeoutId = null;
    try {
      // Determine file extension from MIME type
      const extMap = {
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/wav": ".wav",
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
        "audio/x-m4a": ".m4a",
        "audio/aac": ".aac",
        "audio/mp4": ".mp4",
      };
      const ext = extMap[mimeType] || ".wav";
      const filename = `audio_payload${ext}`;

      // Build multipart/form-data
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, filename);

      if (options.language && options.language.toLowerCase() !== "auto") {
        formData.append("language", options.language.trim());
      }
      formData.append("word_timestamps", "true");
      formData.append("vad_filter", "true");

      // 60-second timeout for CPU inference
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 60000);

      let response;
      try {
        response = await fetch(`${this.serviceUrl}/transcribe`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (networkError) {
        if (networkError.name === "AbortError") {
          const timeoutErr = new Error(
            "Transcription timed out: Local Faster-Whisper CPU inference exceeded the 60s limit."
          );
          timeoutErr.statusCode = 504;
          throw timeoutErr;
        }

        // Connection refused / Python service not started
        const serviceErr = new Error(
          "Local Faster-Whisper speech service is unavailable on 127.0.0.1:5001. " +
          "Ensure the Python sidecar is running (run 'npm run python:start')."
        );
        serviceErr.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
        throw serviceErr;
      }

      if (!response.ok) {
        let errMessage = `Speech service returned status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.message || errData.error || errData.detail) {
            errMessage = errData.message || errData.error || errData.detail;
          }
        } catch {
          // ignore parsing error
        }
        const error = new Error(`Transcription failed: ${errMessage}`);
        error.statusCode = response.status >= 500 ? HTTP_STATUS.INTERNAL_SERVER_ERROR : response.status;
        throw error;
      }

      const result = await response.json();

      // Calculate average word confidence if words are present
      let avgConfidence = 0;
      if (Array.isArray(result.words) && result.words.length > 0) {
        const confidences = result.words
          .map((w) => w.confidence)
          .filter((c) => typeof c === "number");
        if (confidences.length > 0) {
          avgConfidence =
            confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        }
      }

      return {
        text: (result.text || "").trim(),
        words: Array.isArray(result.words) ? result.words : [],
        language: result.language || "en",
        languageProbability: typeof result.language_probability === "number" ? result.language_probability : 0,
        durationSeconds: typeof result.duration === "number" ? result.duration : 0,
        provider: this.providerName,
        model: this.modelName,
        confidence: Math.round(avgConfidence * 1000) / 1000,
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      // Release CPU inference slot
      inferenceSemaphore.release();
    }
  }
}

