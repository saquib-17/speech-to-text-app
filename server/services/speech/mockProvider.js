import { ISpeechRecognitionProvider } from "./speechProvider.js";
import { HTTP_STATUS } from "../../config/constants.js";

/**
 * Mock Speech Recognition Provider
 * Used in test environments (NODE_ENV=test) to achieve instant execution,
 * 100% test reliability, and zero CPU/GPU overhead.
 */
export class MockSpeechProvider extends ISpeechRecognitionProvider {
  constructor() {
    super();
    this.providerName = "mock";
    this.modelName = "mock-v1";
    this.shouldFail = false;
    this.failStatus = HTTP_STATUS.SERVICE_UNAVAILABLE;
    this.failMessage = "Mock speech recognition failure";
    this.customResponse = null;
  }

  getProviderName() {
    return this.providerName;
  }

  /**
   * Helper for tests to simulate engine failures.
   */
  setFail(shouldFail = true, status = HTTP_STATUS.SERVICE_UNAVAILABLE, message = "Mock failure") {
    this.shouldFail = shouldFail;
    this.failStatus = status;
    this.failMessage = message;
  }

  /**
   * Helper for tests to supply a custom transcription result.
   */
  setResponse(response) {
    this.customResponse = response;
  }

  /**
   * Reset mock state back to default.
   */
  reset() {
    this.shouldFail = false;
    this.failStatus = HTTP_STATUS.SERVICE_UNAVAILABLE;
    this.failMessage = "Mock speech recognition failure";
    this.customResponse = null;
  }

  async transcribe(audioBuffer, mimeType, options = {}) {
    if (!audioBuffer || audioBuffer.length === 0) {
      const err = new Error("Cannot transcribe empty audio buffer (0 bytes).");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (this.shouldFail) {
      const err = new Error(this.failMessage);
      err.statusCode = this.failStatus;
      throw err;
    }

    if (this.customResponse) {
      return {
        provider: this.providerName,
        model: this.modelName,
        ...this.customResponse,
      };
    }

    // Default mock response
    return {
      text: "SpeechScribe AI mock transcription for testing.",
      words: [
        { word: "SpeechScribe", start: 0.0, end: 0.5, confidence: 0.99 },
        { word: "AI", start: 0.55, end: 0.8, confidence: 0.98 },
        { word: "mock", start: 0.85, end: 1.1, confidence: 0.97 },
        { word: "transcription", start: 1.15, end: 1.6, confidence: 0.96 },
        { word: "for", start: 1.65, end: 1.8, confidence: 0.98 },
        { word: "testing.", start: 1.85, end: 2.2, confidence: 0.99 },
      ],
      language: options.language || "en",
      languageProbability: 0.99,
      durationSeconds: 2.2,
      provider: this.providerName,
      model: this.modelName,
      confidence: 0.98,
    };
  }
}

export const mockSpeechProviderInstance = new MockSpeechProvider();

