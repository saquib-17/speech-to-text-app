import { FasterWhisperProvider } from "./fasterWhisperProvider.js";
import { MockSpeechProvider, mockSpeechProviderInstance } from "./mockProvider.js";

let defaultProvider = null;

/**
 * Resolves the active speech recognition provider.
 * Follows strict ₹0 budget and test isolation rules:
 * - In NODE_ENV=test: returns MockSpeechProvider
 * - In development / production: returns FasterWhisperProvider (127.0.0.1:5001)
 *
 * @returns {import('./speechProvider.js').ISpeechRecognitionProvider}
 */
export const getSpeechProvider = () => {
  if (process.env.NODE_ENV === "test") {
    return mockSpeechProviderInstance;
  }

  if (!defaultProvider) {
    defaultProvider = new FasterWhisperProvider(process.env.WHISPER_SERVICE_URL);
  }

  return defaultProvider;
};

/**
 * Allows switching provider at runtime (e.g. for testing specific adapters).
 */
export const setSpeechProvider = (provider) => {
  defaultProvider = provider;
};

export { FasterWhisperProvider, MockSpeechProvider };
export default getSpeechProvider;

