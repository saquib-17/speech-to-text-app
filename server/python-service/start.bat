@echo off
REM SpeechScribe AI v2 — Start Faster-Whisper Local Microservice
echo Starting Faster-Whisper Local Transcription Service on 127.0.0.1:5001...
cd /d "%~dp0"
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe app.py
) else (
    echo [ERROR] Virtual environment not found. Run pip install -r requirements.txt first.
    pause
)

