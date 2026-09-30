# CivicPulse AI 🇮🇳

> **Build with AI: Code for Communities** — Track 1: AI for Digital Public Infrastructure & Governance

A multilingual, AI-powered platform that aggregates citizen infrastructure requests across Indian states, uses Gemini to analyse demand hotspots, and recommends high-priority development projects to policymakers using real government data.

## 🌐 Live Demo
- **Citizen Portal:** https://civicpulse-ai.web.app
- **Policymaker Dashboard:** https://civicpulse-ai.web.app/dashboard

## 🏗️ Architecture
```
Citizen (voice/text) → Firebase Function → Gemini Classification → Firestore
                                                                        ↓
Policymaker Dashboard ← Gemini Recommendations ← Hotspot Engine ← BigQuery
```

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| AI / LLM | Gemini 2.0 Flash (Google AI) |
| Translation | Cloud Translation API |
| Backend | Firebase Cloud Functions (Node.js) |
| Database | Firestore |
| Frontend | Next.js 15 + Tailwind CSS |
| Hosting | Firebase Hosting |
| Charts | Recharts |
| Data | data.gov.in (Indian infrastructure datasets) |

## 🚀 Quick Setup

### 1. Clone & prerequisites
```bash
git clone https://github.com/YOUR_USERNAME/civicpulse-ai
npm install -g firebase-tools
firebase login
```

### 2. Firebase Database (Free Spark Plan)
- Create project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable **Firestore** in Production mode
- You do NOT need the Blaze plan (we bypassed Cloud Functions)
- Go to Firestore Rules and set:
  ```
  allow read, write: if true;
  ```
- Copy your Firebase config (Project Settings > Add Web App)

### 3. Get a Gemini API key
- Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key

### 4. Set up environment variables
```bash
# Frontend .env.local
cp frontend/.env.local.example frontend/.env.local
# Fill in all NEXT_PUBLIC_FIREBASE_* values + GEMINI_API_KEY
```

### 5. Load seed data
```bash
cd data/seed
python generate_seed.py
# Set up ADC: gcloud auth application-default login (or run upload from UI)
python upload_seed.py
```

### 6. Deploy to Vercel (Free)
1. Push this repo to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Import project (select the `frontend` folder as root)
4. Add your `.env.local` variables in Vercel settings
5. Deploy!

## 📊 Seed Data
1000 synthetic citizen feedback records across:
- **10 states:** UP, Maharashtra, Tamil Nadu, West Bengal, Rajasthan, Bihar, Karnataka, Gujarat, Odisha, MP
- **7 languages:** English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada  
- **7 categories:** Road, Water, Power, Health, Education, Sanitation, Digital

## 🔑 API Endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/submitFeedback` | POST | Submit citizen feedback |
| `/getHotspots` | GET | Get district-level hotspot aggregations |
| `/getRecommendations` | GET | Gemini AI policy recommendations |
| `/getStats` | GET | Dashboard summary statistics |

## 📦 Submission Checklist
- [x] End-to-end working prototype
- [x] Google AI (Gemini) integration
- [x] Real/realistic data (1000 records, data.gov.in structure)
- [x] Built for India — 10 states, multilingual
- [x] Multilingual support (7 Indian languages)
- [ ] Live deployed link (after Firebase deploy)
- [ ] Demo video (3-5 min)
- [ ] Pitch deck (10-12 slides)

## 🏆 Track
**Track 1 — AI for Digital Public Infrastructure & Governance**  
BRICS Theme: Innovation
