# Speech-to-Text Project

## 1. Introduction
Hi! This is a project I’ve been working on to make audio transcription super easy. It’s a full-stack web application that allows you to either upload an audio file or record your voice live, and it converts everything into text in just a few seconds. I built this to explore how we can use modern APIs to solve everyday problems like manual typing.

## 2. Objective
The main goal of this project was to create a reliable and user-friendly tool that automates the transcription process. I wanted to build something that isn't just a simple script but a complete application where users can manage their transcription history and even export their results as documents.

## 3. Problem Statement
Transcribing audio is incredibly tedious. Whether you're a student recording a lecture or a professional in a meeting, spending hours re-listening and typing out every word is a waste of time. Most free tools are either inaccurate or don't let you save your work easily. This project solves that by providing a fast, accurate, and persistent way to handle speech-to-text.

## 4. Tech Stack
For this project, I used a modern stack to ensure performance and scalability:
- **Frontend:** React, Vite, Tailwind CSS (for styling), Framer Motion (for animations).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (using Mongoose).
- **APIs:** Deepgram SDK (for high-accuracy transcription).
- **Persistence:** **Browser LocalStorage** (to uniquely identify users and track history without a login).
- **Others:** Multer (for file uploads), jsPDF (for exporting transcripts), Lucide React (icons).

## 5. System Architecture
The application follows a standard client-server architecture:
1. **Client (Frontend):** A React app that handles user interactions and recording. It uses **LocalStorage** to store a unique anonymous ID, which ensures you see your own transcription history even if you refresh the page.
2. **Server (Backend):** An Express API that manages routes, file processing, and communication with external services.
3. **Transcription Engine:** The server sends audio data to the Deepgram API, which returns the transcribed text.
4. **Data Flow:** Transcripts are saved in MongoDB and linked to the unique ID stored in the user's browser.

## 6. Features
- 🎤 **Live Recording:** Record audio directly from your microphone in the browser.
- 📁 **File Upload:** Upload existing MP3 or WAV files for transcription.
- 📜 **History Management:** View all your past transcriptions in a neat dashboard (tracked via LocalStorage).
- 📄 **PDF Export:** Download your transcribed text as a professional PDF file.
- ✨ **Clean UI:** A modern, responsive interface built with Tailwind CSS and smooth animations.

## 7. Working of the Project
Here is the step-by-step process of how it works:
1. **User Action:** The user either clicks "Record" or uploads an audio file through the dashboard.
2. **Identification:** The app checks **LocalStorage** for a unique user ID (or creates one) to keep track of the session.
3. **File Handling:** The frontend sends the audio data along with the user ID to the backend.
4. **Transcription:** The backend receives the file and forwards it to the Deepgram API for processing.
5. **Storage:** Once the text is received, the server saves the transcript into MongoDB, indexed by the user's ID.
6. **Output:** The final transcript is sent back to the frontend and displayed to the user instantly.

## 8. Advantages
- **Fast and Accurate:** Deepgram provides near-instant results with very high accuracy.
- **No Login Required:** Uses LocalStorage to provide a personalized experience without forcing users to create an account.
- **Persistent History:** Unlike many online tools, you can come back later and see your old transcripts.
- **Easy Export:** One-click PDF generation makes it easy to share or save your work.

## 9. Limitations
- **Internet Dependency:** Since it relies on external APIs (Deepgram/MongoDB), it won't work offline.
- **File Size:** There are currently limits on the size of the audio files you can upload based on server configuration.
- **Browser Specific:** Since history is linked to LocalStorage, clearing your browser data or switching devices will make your old transcripts inaccessible.

## 10. Future Enhancements
- **User Authentication:** Adding a full login system for cross-device history sync.
- **Multi-language Support:** Enabling transcription for languages other than English.
- **AI Summarization:** Using LLMs to automatically summarize long transcripts into key bullet points.
- **Speaker Identification:** Detecting different speakers in a single recording.

## 11. Installation and Setup

### Prerequisites
- Node.js installed on your machine.
- A MongoDB cluster (Atlas) or local instance.
- A Deepgram API key.

### Backend Setup
1. Navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   DEEPGRAM_API_KEY=your_api_key
   ```
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Create a `.env` file and add:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend: `npm run dev`
