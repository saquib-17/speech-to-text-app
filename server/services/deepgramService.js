import { DeepgramClient } from "@deepgram/sdk";
import fs from "fs";

/**
 * Transcribes audio using Deepgram Nova-2 via the official SDK
 * @param {string} filePath - Path to the audio file
 * @param {string} mimeType - MIME type of the audio file
 * @returns {Promise<string>} - Transcription text
 */
export const transcribeAudio = async (filePath, mimeType = "audio/mpeg") => {
  const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });

  const audioBuffer = fs.readFileSync(filePath);

  const response = await deepgram.listen.v1.media.transcribeFile(
    audioBuffer,
    {
      model: "nova-2",
      smart_format: true,
      punctuate: true,
      paragraphs: true,
    }
  );

  // The response structure in this SDK version is: { data, rawResponse }
  // We want data.results.channels[0].alternatives[0].transcript
  const transcript =
    response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

  return transcript;
};
