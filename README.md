# Rural Healthcare Assistant ("MedScribe AI")

A modern, responsive, full-stack web application designed for rural Indian users to understand medical prescriptions, search for drug information, interact with an AI health assistant via voice, and access emergency services.

---

## 🚀 Key Features

1. **Prescription Scanner (OCR)**: Upload prescription photos or PDFs to extract brand names, generic compositions, dosages, durations, and simple-language instructions.
2. **AI Health Assistant ("MedScribe Bot")**: A Gemini 2.5 Flash-powered conversational chatbot for general medical guidance, precautions, and symptom explanations, supporting text and voice.
3. **Medicine Directory**: Search drug brand names to find simplified uses, side effects, precautions, and generic/cheaper brand alternatives in India. Includes self-growing dynamic translation caching.
4. **Elderly Voice Assistant**: A simplified, high-contrast one-button voice interface designed for non-technical users to ask health questions verbally and listen to audio guidelines.
5. **Emergency Info Desk**: Fast phone dialers for National Helplines (102, 108, 112, 104), location details for nearest primary health clinics, and interactive first-aid cards.
6. **Multi-language Support**: Seamless on-the-fly toggling between English, हिन्दी (Hindi), বাংলা (Bengali), मराठी (Marathi), తెలుగు (Telugu), and தமிழ் (Tamil).
7. **Accessibility Features**: Class-based Dark/Light themes, text sizing multipliers (+100%, +200%), high-contrast outline overlays, and browser-integrated Text-to-Speech (TTS) readout.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons, Web Speech API (Speech Recognition + Speech Synthesis)
- **Backend**: Node.js, Express.js, Multer (In-memory file uploads)
- **Database**: MongoDB (Atlas & Local Mongoose Fallback)
- **AI Engine**: Google Generative AI (`gemini-2.5-flash` model via Google AI Studio API)
- **PDF Engine**: Puppeteer (Headless Chromium PDF rendering)

---

## ⚙️ Project Folder Structure

```
Healtcare Assistent/
├── backend/
│   ├── config/
│   │   ├── db.js          # MongoDB Mongoose connection
│   │   └── seed.js        # Seed script for default users/medicines
│   ├── controllers/       # Controller logic (Auth, OCR, Medicine, Chat, Admin)
│   ├── models/            # Database Schemas (User, Medicine, Prescription, Feedback)
│   ├── routes/            # REST API Route configuration
│   ├── utils/
│   │   ├── gemini.js      # Gemini API integrations
│   │   └── pdfGenerator.js# Puppeteer PDF layout renderer
│   ├── server.js          # Express server entry point
│   └── .env               # Server environment configurations
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, Accessibility widget, Voice mic
│   │   ├── context/       # AuthContext, LanguageContext, AccessibilityContext
│   │   ├── pages/         # Dashboard, Scanner, Directory, Bot, Voice page, etc.
│   │   ├── utils/
│   │   │   └── api.js     # Centralized fetch wrapper
│   │   ├── App.jsx        # Routing definitions
│   │   └── index.css      # Core styles & accessibility scale layers
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── vite.config.js     # Vite configuration
└── README.md              # Startup Instructions (This file)
```

---

## 🔑 Configuration & Env Setup

Ensure you have a `.env` file created in your `backend/` directory. (This has already been pre-configured for you during setup):

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

---

## 🚦 How to Start the Application

Follow these steps to launch the frontend and backend servers locally:

### 1. Preload/Seed Database
Open a terminal in the root workspace and seed the database using:
```bash
cd backend
node config/seed.js
```
*(This creates the demo accounts and registers the initial drug databases directly on your Atlas cluster).*

### 2. Start the Backend API Server
In the `backend` directory, run:
```bash
npm run dev
```
*(The server will start listening on port `5000`)*.

### 3. Start the Frontend React App
Open a separate terminal, navigate to the `frontend` directory, and run:
```bash
cd frontend
npm run dev
```
*(The Vite dev server will boot up, typically hosting the UI at `http://localhost:5173`)*.

---

## 🔐 Seeded Demo Accounts

You can log in and test different system roles (Patient, Doctor, Admin) using these seeded credentials:

### 👤 Administrator
- **Email**: `admin@gmail.com`
- **Password**: `123456`
- **Access**: View platform analytics, alter user roles, review feedback, and add new medicines manually.

### 🩺 Doctor
- **Email**: `doctor@gmail.com`
- **Password**: `123456`
- **Access**: Can add and edit medicine listings in the directory, scan prescriptions.

### 👥 Patient
- **Email**: `patient@gmail.com`
- **Password**: `123456`
- **Access**: Access the personal dashboard, view medical history, scan prescriptions, search drugs, use chatbot/voice assistant, and submit feedback.

---

## 👨‍💻 Developer & Maintainer

This project is fully maintained and owned by **Aditya Pradhan**.

- **Email**: [adityapradhan2124@gmail.com](mailto:adityapradhan2124@gmail.com)
- **GitHub**: [@AdityaPradhan105](https://github.com/AdityaPradhan105)
- **Repository URL**: [MedScribe AI](https://github.com/AdityaPradhan105/MedScribe-AI.git)
