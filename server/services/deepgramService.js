import fs from "fs";
import fetch from "node-fetch";

/**
 * Transcribes audio using Deepgram Nova-2 model
 * @param {string} filePath - Path to the audio file
 * @param {string} mimeType - MIME type of the audio file
 * @returns {Promise<string>} - Transcription text
 */
export const transcribeAudio = async (filePath, mimeType = "audio/mpeg") => {
  try {
    const fileStream = fs.createReadStream(filePath);

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": mimeType,
        },
        body: fileStream,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.err_msg || "Deepgram API Error");
    }

    const data = await response.json();
    return data.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error("Deepgram Service Error:", error);
    throw error;
  }
};