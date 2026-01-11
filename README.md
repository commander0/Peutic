
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Peutic | AI Mental Wellness Companion

A premium, 24/7 virtual companion platform providing tailored human-like connection and support via video and voice.

## 🚀 Quick Start (Local Development)

### 1. Initial Setup
This command installs dependencies and generates the backend function files locally.

```bash
npm run setup
```

### 2. Connect to Supabase
Link your local project to your remote Supabase project.

```bash
npm run backend:login
npx supabase link --project-ref YOUR_PROJECT_REF_ID
```

### 3. Setup Database Tables (CRITICAL)
**You must do this for the app to work.**
1.  Go to your **Supabase Dashboard** > **SQL Editor**.
2.  Open the file `supabase/schema.sql` from this project.
3.  Copy the content and paste it into the Supabase SQL Editor.
4.  Click **Run**.

### 4. Deploy Backend (Do this once)
This pushes your server-side logic (`api-gateway`) to the cloud.

```bash
# Set Production Secrets first
npx supabase secrets set GEMINI_API_KEY=your_key STRIPE_SECRET_KEY=your_key TAVUS_API_KEY=your_key ADMIN_MASTER_KEY=PEUTIC-MASTER-2025-SECURE

# Deploy functions
npm run backend:deploy
```

### 5. Run Frontend
Start the website locally.

```bash
npm run dev
```

---

## ☁️ Deployment Guide

### Part A: The Backend (Supabase)
Your backend logic (AI, Payments, User Creation) lives on Supabase Edge Functions.
*   **Where to run:** Local Terminal.
*   **Command:** `npm run backend:deploy`
*   **When:** Run this whenever you edit files in `supabase/functions`.

### Part B: The Frontend (Vercel / Netlify)
Your visual website (React) lives here.
*   **Where to run:** Vercel Dashboard.
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **Environment Variables (Required on Vercel):**
    *   `VITE_SUPABASE_URL`: Found in Supabase Dashboard > Settings > API.
    *   `VITE_SUPABASE_ANON_KEY`: Found in Supabase Dashboard > Settings > API.
    *   `VITE_STRIPE_KEY`: Your Stripe Publishable Key.

---

## 📱 Mobile Build (Android)

To build the Android APK:

```bash
# Build web assets
npm run build

# Sync to native android project
npm run cap:sync

# Open Android Studio to compile APK
npm run cap:open
```

## 🛠 Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Supabase Edge Functions (Deno)
- **AI:** Google Gemini 2.5/3 (Text & TTS)
- **Video:** Tavus API (Digital Avatar)
- **Payments:** Stripe
- **Mobile:** Capacitor (Android/iOS)
