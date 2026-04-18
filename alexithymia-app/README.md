# Resensio — Emotional awareness app

A full-stack web app to help users understand and track alexithymia using the certified TAS-20 psychological scale.

## Features

- **Landing Page** — Full-screen hero with a 10-second delayed popup asking "Do you really feel your emotions?"
- **TAS-20 Test** — The Toronto Alexithymia Scale (20 questions, 3 subscales, validated by Bagby, Parker & Taylor, 1994)
- **Results Page** — Score breakdown with subscale bars and clinical interpretation
- **Feelings Journal** — Write about feelings and place them on an interactive XY emotion map (Y = intensity/size, X = color)

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite via `better-sqlite3`
- **Routing:** React Router v6

## Getting Started

### Prerequisites

Node.js v18+ and npm must be installed.

### Install dependencies

```bash
cd alexithymia-app  # repository folder (npm package name: resensio)
npm run install:all
```

### Run in development

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
cd frontend && npm run build
cd ../backend && npm run build
```

## Project Structure

```
alexithymia-app/   # Resensio (npm: resensio)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.tsx    ← Hero + 10s popup
│       │   ├── TestPage.tsx       ← TAS-20 test
│       │   ├── ResultsPage.tsx    ← Score + interpretation
│       │   └── JournalPage.tsx    ← Notes + XY emotion graph
│       ├── data/
│       │   └── questions.ts       ← TAS-20 questions & scoring
│       ├── App.tsx
│       └── main.tsx
├── backend/
│   └── src/ 
│       ├── routes/
│       │   ├── test.ts            ← POST/GET test results
│       │   └── journal.ts         ← POST/GET/DELETE journal entries
│       ├── db.ts                  ← SQLite setup & schema
│       └── index.ts               ← Express server
├── data/
│   └── alexithymia.db             ← SQLite database (auto-created)
└── README.md
```

## About the TAS-20

The Toronto Alexithymia Scale (TAS-20) is the most widely used self-report measure of alexithymia. It assesses three dimensions:
1. **Difficulty Identifying Feelings** (7 items)
2. **Difficulty Describing Feelings** (5 items)
3. **Externally-Oriented Thinking** (8 items)

Scoring: ≤51 = low alexithymia · 55-64 = possible · ≥65 = high

*This tool is for awareness only and is not a clinical diagnosis.*
*We suggest you to consult a certified expert on this argument.*

/*  Vedere quale è più utile. A/B Testing */
