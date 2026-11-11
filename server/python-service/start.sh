#!/bin/bash
# SpeechScribe AI v2 — Start Faster-Whisper Local Microservice
echo "Starting Faster-Whisper Local Transcription Service on 127.0.0.1:5001..."
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
if [ -f "venv/bin/python" ]; then
    venv/bin/python app.py
elif [ -f "venv/Scripts/python.exe" ]; then
    venv/Scripts/python.exe app.py
else
    python3 app.py
fi

