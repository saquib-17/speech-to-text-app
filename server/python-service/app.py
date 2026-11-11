"""
SpeechScribe AI v2 — Faster-Whisper Local Transcription Service
FastAPI microservice executing local speech inference via CTranslate2 INT8.

Mandatory Constraints:
- Strict ₹0 budget: 100% local CPU inference, zero cloud APIs.
- Binds strictly to 127.0.0.1:5001 (localhost isolation).
- Base model INT8 quantization loaded once and reused.
- Word timestamps and language probability extraction.
- Automatic temporary file cleanup in try/finally blocks.
"""

import os
import sys
import tempfile
import logging
from typing import Optional
from contextlib import asynccontextmanager

# PyAV 14+ compatibility patch for faster-whisper
import av
_orig_av_open = av.open
def _safe_av_open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(*args, **kwargs)
av.open = _safe_av_open

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
import uvicorn
from faster_whisper import WhisperModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("speechscribe.whisper")

# Configuration constants
MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
DEVICE = "cpu"
COMPUTE_TYPE = "int8"
HOST = "127.0.0.1"
PORT = int(os.getenv("WHISPER_PORT", "5001"))

# Global model instance (singleton)
_model_instance: Optional[WhisperModel] = None


def get_model() -> WhisperModel:
    """Retrieve or initialize the singleton WhisperModel instance."""
    global _model_instance
    if _model_instance is None:
        logger.info(
            f"Loading Faster-Whisper model '{MODEL_SIZE}' (device={DEVICE}, compute_type={COMPUTE_TYPE})..."
        )
        _model_instance = WhisperModel(
            model_size_or_path=MODEL_SIZE,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            cpu_threads=4,
            num_workers=1
        )
        logger.info(f"Faster-Whisper model '{MODEL_SIZE}' loaded successfully.")
    return _model_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the model on startup so first request has zero cold start penalty."""
    logger.info("Initializing SpeechScribe AI Faster-Whisper sidecar...")
    try:
        get_model()
        logger.info("Whisper model pre-warmed and ready for inference.")
    except Exception as e:
        logger.error(f"Failed to pre-warm Whisper model: {e}", exc_info=True)
    yield
    logger.info("Shutting down Faster-Whisper sidecar.")


app = FastAPI(
    title="SpeechScribe AI — Local Speech Service",
    description="Faster-Whisper local speech recognition engine running on 127.0.0.1:5001",
    version="2.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Health check endpoint for Node.js backend monitoring."""
    model_loaded = _model_instance is not None
    return {
        "status": "ready" if model_loaded else "starting",
        "service": "faster-whisper",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE,
        "model_loaded": model_loaded
    }


@app.get("/")
async def root():
    return {
        "service": "SpeechScribe AI Local Speech Engine",
        "version": "2.0.0",
        "status": "active"
    }


@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file payload"),
    language: Optional[str] = Form(None, description="Optional ISO language code, e.g. 'en', or 'auto'"),
    word_timestamps: bool = Form(True, description="Whether to extract word-level timestamps"),
    vad_filter: bool = Form(True, description="Enable Silero VAD silence filtering")
):
    """
    Transcribe an audio file using Faster-Whisper.
    Processes audio through a temporary file with guaranteed cleanup.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload payload."
        )

    # Determine file extension safely
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".tmp"

    temp_file_path = None
    try:
        # Write incoming audio bytes to a temporary file on disk for PyAV / ffmpeg decoding
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_audio:
            temp_file_path = temp_audio.name
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Audio file payload is empty (0 bytes)."
                )
            temp_audio.write(content)

        logger.info(
            f"Transcribing audio '{file.filename}' ({len(content)} bytes) | Language: {language or 'auto'}"
        )

        model = get_model()

        # Normalize language parameter: None or "auto" triggers Whisper auto-detection
        target_lang = None if (not language or language.lower() == "auto") else language.strip()

        # Run transcription with Faster-Whisper
        segments_gen, info = model.transcribe(
            temp_file_path,
            language=target_lang,
            word_timestamps=word_timestamps,
            vad_filter=vad_filter,
            vad_parameters=dict(min_silence_duration_ms=500),
            beam_size=5
        )

        # Collect segment texts and word-level timestamps
        full_text_parts = []
        words_list = []

        for segment in segments_gen:
            full_text_parts.append(segment.text.strip())

            if word_timestamps and hasattr(segment, "words") and segment.words:
                for w in segment.words:
                    word_entry = {
                        "word": w.word.strip(),
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                    }
                    # Include confidence if probability is available
                    if hasattr(w, "probability") and w.probability is not None:
                        word_entry["confidence"] = round(float(w.probability), 3)
                    words_list.append(word_entry)

        transcription_text = " ".join(part for part in full_text_parts if part)

        logger.info(
            f"Transcription complete: {len(transcription_text)} chars, "
            f"detected_lang={info.language} (prob={round(info.language_probability, 3)}), "
            f"duration={round(info.duration, 2)}s"
        )

        return {
            "success": True,
            "text": transcription_text,
            "language": info.language,
            "language_probability": round(float(info.language_probability), 3),
            "duration": round(float(info.duration), 2),
            "words": words_list
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error during transcription: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Transcription Inference Failed",
                "message": str(e)
            }
        )
    finally:
        # Mandatory temporary file cleanup on both success and failure
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except OSError as err:
                logger.warning(f"Failed to remove temporary audio file {temp_file_path}: {err}")


if __name__ == "__main__":
    uvicorn.run("app:app", host=HOST, port=PORT, log_level="info")
