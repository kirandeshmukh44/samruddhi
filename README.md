# BiLU ERP – Everything Your Business Needs
### Smart GST Billing, Inventory, Accounting & ERP Platform
**A Flagship Product by Pravara Infotech Pvt. Ltd.**  
*— Everything Your Business Needs — (Billing • Inventory • Accounting • GST Compliance • Growth)*

---

## 🌟 Overview
**BiLU ERP** is a modern, enterprise-grade business management and GST billing solution tailored for Indian retail, wholesale, distribution, and small/medium enterprise (SME) merchants.

- **Brand Colors:** Vibrant Electric Blue (`#1D4ED8`), Royal Purple (`#7C3AED`), Deep Navy (`#0B132B`).
- **Complete System Documentation:** Please see [`BILU_ERP_SYSTEM_DOCUMENTATION.md`](./BILU_ERP_SYSTEM_DOCUMENTATION.md) for full architecture, installation, and user lifecycle details from setup to logout.
- **Mobile First & Desktop Ready**: Native feel on mobile (iOS/Android with safe area and gesture navigation) and productive widescreen dashboard on desktop/web.
- **High-Precision Integer Arithmetic**: All monetary calculations are performed in Integer Paise (`₹1.00 = 100 paise`), eliminating floating-point rounding discrepancies.
- **Multi-Tenant Architecture**: Strict row-level tenant isolation ensuring data privacy and zero cross-business leakage.
- **Full GST Compliance Lifecycle**: Line-by-line HSN/SAC computation, Intra-state (CGST + SGST) and Inter-state (IGST) split, and government GST portal JSON export for GSTR-1, GSTR-3B, and GSTR-2B.
- **Instant Sharing & Printing**: One-tap WhatsApp invoice reminders, payment links, and PDF billing format.

---

## 🏗️ Architecture & Tech Stack

```
BiLU ERP Architecture
├── app/                  # React Native / Expo Frontend (Mobile & Web)
│   ├── src/screens/      # Dashboard, Invoices, Items, Parties, Payments, Reports, Settings, GstReturns
│   ├── src/context/      # Multi-tenant Auth & Business state
│   ├── src/services/     # Invoices, Items, Parties, Payments, Dashboard services with auto-sync
│   ├── src/i18n/         # Multi-language support (English, Hindi, Marathi)
│   └── app/              # Expo Router filesystem navigation
│
└── backend/              # FastAPI Python Backend
    ├── app/routers/      # Auth, Invoices, Items, Parties, Payments, Reports, Dashboard, GST
    ├── app/models.py     # SQLAlchemy 2.0 ORM schemas
    ├── app/services/     # GST compliance, PDF generation, Stock audit log
    └── app/security.py   # JWT & BCrypt password hashing, Rate limiting, Security headers
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
python seed.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (Expo Web & Mobile)
```bash
cd app
npm install

# Run Web Browser (Chrome / Edge)
npx expo start --web

# Run Mobile (Expo Go on Android / iOS)
npx expo start
```
- Web Application: `http://localhost:8081`

---

## 🔑 Default Demo Accounts

| Role | Mobile / Email | Password / OTP | Default Business |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `9876543210` / `owner@biluerp.com` | `123456` / `Owner@123` | **Gupta Traders** |
| **Kiran Deshmukh** | `9422000159` | `123456` | **Gupta Traders** |
| **Platform Admin** | `9000000000` / `admin@biluerp.com` | `123456` / `Admin@123` | **Platform Admin** |

---

*BiLU ERP • A Product by Pravara Infotech Pvt. Ltd. • Everything Your Business Needs*
