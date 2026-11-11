/**
 * SpeechScribe AI v2 — Abstract Speech Recognition Provider Interface
 *
 * Defines the contract that all speech recognition adapters must fulfill.
 * Enforces loose coupling and architectural modularity (Phase 02 Architecture).
 */

export class ISpeechRecognitionProvider {
  /**
   * Transcribe an in-memory audio buffer.
   *
   * @param {Buffer} audioBuffer - Raw audio data in memory
   * @param {string} mimeType - MIME type of the audio (e.g. 'audio/mpeg', 'audio/wav')
   * @param {Object} [options] - Additional provider-specific options
   * @param {string} [options.language] - Optional language hint or code
   * @returns {Promise<TranscriptionResult>} Normalized transcription output
   */
  async transcribe(audioBuffer, mimeType, options = {}) {
    throw new Error("transcribe() must be implemented by subclass.");
  }

  /**
   * Returns the provider identifier name.
   * @returns {string}
   */
  getProviderName() {
    throw new Error("getProviderName() must be implemented by subclass.");
  }
}

/**
 * @typedef {Object} TranscriptionWord
 * @property {string} word - The transcribed word
 * @property {number} start - Start time in seconds
 * @property {number} end - End time in seconds
 * @property {number} [confidence] - Optional confidence score (0.0 - 1.0)
 */

/**
 * @typedef {Object} TranscriptionResult
 * @property {string} text - Full transcribed text
 * @property {TranscriptionWord[]} words - Word-level timestamps
 * @property {string} language - Detected or transcribed language (e.g. 'en')
 * @property {number} languageProbability - Probability / confidence of the language
 * @property {number} durationSeconds - Audio duration in seconds
 * @property {string} provider - Provider identifier ('faster-whisper', 'mock', etc.)
 * @property {string} model - Model used ('base', 'int8', etc.)
 * @property {number} confidence - Average overall confidence
 */

