# SAMRUDDHI – समृद्धी
### Smart GST Billing, Inventory & Business Management Software
**A Product Concept by Pravara Infotech**  
*व्यवसायाची प्रगती, आता अधिक सोपी! (Billing • Inventory • Accounting • Growth)*

---

## 🌟 Overview
**SAMRUDDHI (समृद्धी)** is a modern, enterprise-grade business management and GST billing solution tailored for Indian retail, wholesale, distribution, and small/medium enterprise (SME) merchants.

Designed to mirror and enhance the best features of Indian business software like Vyapar:
- **Mobile First & Desktop Ready**: Native feel on mobile (iOS/Android with safe area and gesture navigation) and productive widescreen dashboard on desktop/web.
- **High-Precision Integer Arithmetic**: All monetary calculations are performed in Integer Paise (`₹1.00 = 100 paise`), eliminating floating-point rounding discrepancies.
- **Multi-Tenant Architecture**: Strict row-level tenant isolation ensuring data privacy and zero cross-business leakage.
- **Full GST Lifecycle**: Intra-state (CGST + SGST) and Inter-state (IGST) split, odd-paise division, and half-up rounding.
- **Instant Sharing & Printing**: One-tap WhatsApp invoice reminders and PDF billing format.

---

## 🏗️ Architecture & Tech Stack

```
SAMRUDDHI System Architecture
├── app/                  # React Native / Expo Frontend (Mobile & Web)
│   ├── src/screens/      # Dashboard, Invoices, Items, Parties, Payments, Reports, Settings
│   ├── src/context/      # Multi-tenant Auth & Business state
│   ├── src/i18n/         # Multi-language support (English, Hindi, Marathi)
│   └── app/              # Expo Router filesystem navigation
│
└── backend/              # FastAPI Python Backend
    ├── app/routers/      # Auth, Invoices, Items, Parties, Payments, Reports, Dashboard
    ├── app/models.py     # SQLAlchemy 2.0 ORM schemas
    ├── app/services/gst.py # GST compliance & calculation engine
    └── app/security.py   # JWT & BCrypt password hashing
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (React Native / Expo)
```bash
cd app
npm install
npx expo start
```
- Press `a` for Android Emulator / Device
- Press `w` for Web Browser
- Scan QR code with Expo Go on your mobile device

---

## 🛡️ License
Proprietary · Created by **Pravara Infotech**
