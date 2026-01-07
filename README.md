
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Peutic | AI Mental Wellness Companion

A premium, 24/7 virtual companion platform providing tailored human-like connection and support via video and voice.

## 🚀 Easy Start Guide

### 1. Initial Setup (Run this first)
This single command installs all dependencies and generates your backend code automatically.

```bash
npm run setup
```

### 2. Connect to Cloud
Now, push your backend code to Supabase.

```bash
# Login to Supabase
npm run backend:login

# Link your local project to your remote Supabase project
# (Get your Reference ID from https://supabase.com/dashboard/project/_/settings/general)
npx supabase link --project-ref YOUR_PROJECT_REF_ID

# Set your Production Secrets (Replace values with your actual keys)
npx supabase secrets set GEMINI_API_KEY=your_key STRIPE_SECRET_KEY=your_key TAVUS_API_KEY=your_key ADMIN_MASTER_KEY=PEUTIC-MASTER-2025-SECURE

# Deploy the functions
npm run backend:deploy
```

### 3. Run the App
Start the website locally.

```bash
npm run dev
```

### 4. Build for Mobile (Android)
To build the Android APK:

```bash
# Build web assets
npm run build

# Sync to native android project
npm run cap:sync

# Open Android Studio to compile APK
npm run cap:open
```

## 🔐 Environment Variables (.env.local)
Create a `.env.local` file in the root for local development:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_STRIPE_KEY=pk_test_...
```

## 🛠 Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Supabase Edge Functions (Deno)
- **AI:** Google Gemini 2.5/3 (Text & TTS)
- **Video:** Tavus API (Digital Avatar)
- **Payments:** Stripe
- **Mobile:** Capacitor (Android/iOS)
