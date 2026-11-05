# BiLU ERP – Everything Your Business Needs
### Comprehensive End-to-End System & User Guide
*A Flagship Enterprise & SME ERP Product by Pravara Infotech Pvt. Ltd.*

---

## 1. Executive Summary & Brand Overview

**BiLU ERP** is a modern, enterprise-grade business management, GST billing, inventory, and accounting software designed specifically for Indian retail shops, distributors, wholesalers, traders, and SME enterprises.

- **Brand Name:** BiLU ERP
- **Tagline:** *— Everything Your Business Needs —*
- **Powered By:** Pravara Infotech Pvt. Ltd.
- **Brand Colors:**
  - **Electric / Vibrant Royal Blue:** `#1D4ED8` / `#0284FE` (Primary buttons, headers, action elements)
  - **Royal Purple / Violet:** `#7C3AED` / `#8B5CF6` (ERP Badge, peak performance charts, accents)
  - **Corporate Dark Navy:** `#0B132B` (Sidebar, desktop headers)
  - **Surface & Backgrounds:** `#F8FAFC`, `#FFFFFF`, `#EFF6FF` (High contrast, modern glassmorphism)
  - **Status Accents:** Emerald Green (`#047857` - Paid/In-Stock), Crimson Red (`#B91C1C` - Unpaid/To-Pay), Amber (`#B45309` - Partial/Low-Stock).

---

## 2. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BiLU ERP CLIENT LAYER                           │
│                                                                        │
│   Expo React Native 52 (Web, Android APK, iOS)                        │
│   ├── Expo Router (File-based navigation & deep linking)               │
│   ├── Lucide / Feather Vector Icons                                    │
│   ├── i18next (Multi-lingual: English, हिन्दी, मराठी)                   │
│   ├── Safe Hybrid Storage (AsyncStorage + localStorage + SQLite fallback)│
│   └── Cross-Platform Layouts (Responsive Desktop Split + Mobile View) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON REST APIs (Axios)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BiLU ERP BACKEND API                            │
│                                                                        │
│   FastAPI (Python 3.13 Async Architecture)                             │
│   ├── Security Middleware (Strict CSP, CORS, X-Frame, Nosniff)         │
│   ├── Sliding-Window Rate Limiter on sensitive auth endpoints          │
│   ├── JWT Token Authentication (HS256)                                 │
│   ├── Multi-Tenant Business & User Isolation                           │
│   ├── Automated FY Indian Sequence Numbering (e.g., INV-2026-27-0001)  │
│   ├── Indian GST Calculation Engine (Line-by-line, HSN, CGST/SGST/IGST)│
│   ├── FIFO Payments Allocation Engine                                  │
│   └── ReportLab PDF Generator (Professional Tax Invoice with BiLU logo)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.0 ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                  │
│                                                                        │
│   SQLite (Local / Embedded) / PostgreSQL Ready                         │
│   ├── Users & Businesses (Multi-business ownership)                    │
│   ├── Parties (Customers & Suppliers ledger)                           │
│   ├── Items & Stock Movements (Inventory audit trail)                  │
│   ├── Invoices & Invoice Items (Tax invoices, Bills of supply)         │
│   └── Payments (Cash, UPI, Bank Transfer, Cheque with allocation)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Quick Setup & Installation Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** v3.10 to v3.13
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/kirandeshmukh44/bilu-erp.git
cd bilu-erp
```

---

### Step 2: Backend Setup (FastAPI + SQLite)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Mac / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database with initial businesses, items, parties, and demo accounts:
   ```bash
   python seed.py
   ```
5. Start the backend development server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - **Interactive API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
   - **Alternative Docs (ReDoc):** `http://127.0.0.1:8000/redoc`

---

### Step 3: Frontend Setup (Expo React Native Web & Mobile)
1. Open a new terminal and navigate to the `app` directory:
   ```bash
   cd app
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the application:
   - **For Web Browser:**
     ```bash
     npx expo start --web
     ```
     Open `http://localhost:8081` in Chrome, Edge, or Brave.
   - **For Android / iOS Phone:**
     ```bash
     npx expo start
     ```
     Scan the QR code using the **Expo Go** app on your Android or iOS device.

---

## 4. Default Demo Accounts & Credentials

| Role | Email / Phone | Password / OTP | Default Business |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `owner@biluerp.com` किंवा कोणताही 10-अंकी मोबाइल | `Owner@123` किंवा `123456` | **Gupta Traders** |
| **Kiran Deshmukh** | `9422000159` / `9876543210` | `123456` | **Gupta Traders** |
| **Platform Admin** | `admin@biluerp.com` / `9000000000` | `Admin@123` | **Platform Administrator** |

---

## 5. End-to-End User Journey (From Login to Logout)

### Lifecycle 1: Login & Authentication
1. **Landing & Carousel:**
   - User lands on the modern BiLU ERP onboarding screen featuring the official circular 3D badge logo.
   - Auto-rotating interactive carousel demonstrates Dashboard, Inventory, Invoices, and Payment Reminders.
   - 3-Language quick switcher at the top right: **EN** (English), **हिं** (हिन्दी), **मरा** (मराठी).
2. **1-Tap Quick Login:**
   - Tap **"Use BiLU ERP For Free"** or **"Login / Switch"**.
   - Bottom sheet slides up with the official BiLU ERP logo and Pravara Infotech attribution.
   - Tap **"Use Demo: 9876543210"** for instant fill, or enter any mobile number.
   - Enter OTP `123456` and tap **Continue**.
   - User session is securely persisted in encrypted local storage.

---

### Lifecycle 2: Multi-Business Switcher
1. Located at the top of the Sidebar on Desktop, or in the Top Header on Mobile.
2. Displays the currently active business (e.g., *Gupta Traders*).
3. Clicking opens the **Business Selector Modal**:
   - Lists all registered businesses under the account with GSTIN and state.
   - Click any business to switch tenant context instantly.
   - Includes **"+ Add New Business"** button to register a new firm with legal name, GSTIN, billing address, and state.

---

### Lifecycle 3: Dashboard & KPI Analytics
1. **Header Block (Brand Electric Blue `#1D4ED8`):**
   - Displays **Today's Sale** in large typography.
   - Overlapping white cards show **To Collect** (green) and **To Pay** (red).
2. **Quick Action Grid:**
   - **Add Sale:** 1-tap shortcut to generate a customer invoice.
   - **Add Purchase:** 1-tap shortcut to enter a vendor bill.
   - **Add Item:** Quick modal to add a product into stock.
   - **Reports:** Instant jump to profit & loss and sales summaries.
3. **Interactive Monthly Trend Chart:**
   - Displays monthly revenue trend (Sept, Oct, Nov).
   - Tapping on any month bar (e.g. *Oct*) highlights the bar and interactively updates sales total, invoice count, and growth badge (+22.4% growth).
4. **Cash In-Hand & Expenses:**
   - Shows live cash balances and month-to-date business expenses.
5. **Recent Transactions:**
   - Interactive transaction list showing party name, invoice number, date, amount, and status pill.
   - Clicking any transaction opens the **Detail Modal**:
     - View invoice breakdown.
     - 1-tap **Share on WhatsApp** with formatted invoice text and payment link.
     - 1-tap **View / Print Invoice**.

---

### Lifecycle 4: Product & Stock Management (Items Screen)
1. **Search & Category Filters:**
   - Real-time search by product name, HSN code, or barcode.
   - Quick pills: *All Items*, *In Stock*, *Low Stock (< Limit)*.
2. **Stock Valuation Bar:**
   - Real-time total stock valuation and total inventory units.
3. **Item Operations:**
   - **Add Item:** Enter Item Name, HSN/SAC Code, Unit (pcs, bags, kg, ltr), Sale Price, Purchase Price, GST Rate (0%, 5%, 12%, 18%, 28%), and Opening Stock.
   - **Quick Stock Adjustment (+ / -):** 1-tap adjustment with reason (Purchase, Sale, Damage, Count Correction).
   - **Low Stock Alerts:** Automatically highlights items whose stock drops below their designated limit.

---

### Lifecycle 5: Party Management (Customers & Suppliers)
1. **Tabs:**
   - **Customers (`sale`):** Receivables, billing addresses, contact numbers, GSTIN.
   - **Suppliers (`purchase`):** Payables, vendor GSTIN, state.
2. **Party Profile & Statement:**
   - View opening balance and total net receivables/payables.
   - 1-tap **Quick Invoice** for the party.
   - 1-tap **WhatsApp Reminder** to send polite payment requests with account details.

---

### Lifecycle 6: Invoicing & Billing Engine (Invoices Screen)
1. **Document Types Supported:**
   - Tax Invoice
   - Quotation / Estimate
   - Proforma Invoice
   - Bill of Supply (Non-GST / Exempt)
   - Composition Bill of Supply
   - Credit Note
   - Delivery Challan
2. **Supply Categories:**
   - **Goods:** Uses HSN code, piece/kg unit.
   - **Services:** Uses SAC code, hour/service unit.
   - **Mixed:** Integrated composite supplies.
3. **Line Items Grid:**
   - Select Item from dropdown modal with auto-fill rate, HSN, and GST.
   - Set Quantity and Discount.
   - Auto-computes Line Taxable Amount, CGST, SGST, IGST.
4. **GST Logic (Intra-state vs Inter-state):**
   - Intra-state (Same State, e.g. Maharashtra to Maharashtra): **CGST (50%) + SGST (50%)**.
   - Inter-state (e.g. Maharashtra to Gujarat): **IGST (100%)**.
5. **Auto Round-Off:**
   - Automatic half-up round-off to the nearest integer rupee (`.50` round up, `.49` round down).
6. **Save & Export:**
   - **Save & Download:** Generates clean PDF invoice.
   - **Print:** Direct browser print preview.
   - **WhatsApp:** Direct link generation to WhatsApp with customer details.

---

### Lifecycle 7: GST Returns & Compliance Module (`gst-returns.tsx`)
1. **Tabs:**
   - **GSTR-1:** Monthly outward sales return.
   - **GSTR-3B:** Consolidated tax summary and net payable.
   - **GSTR-2B:** Purchase reconciliation.
   - **TDS / TCS Report:** Tax deducted/collected at source.
   - **Filing Guide:** Step-by-step government portal filing workflow.
2. **Government Portal JSON Export:**
   - 1-click **JSON Export** button formats all monthly invoices into the official GSTN schema ready for direct upload to `gst.gov.in`.
3. **Table Breakdowns:**
   - **Table 4A:** B2B Regular Sales with Customer GSTIN, Invoice No, POS, and Taxable Value.
   - **Table 7:** B2C Large & Small Sales.
   - **Table 12:** HSN Summary.
   - **Table 9B:** CDNR (Credit/Debit Notes Registered).
4. **Audit Validation:**
   - Highlights warnings for invalid GSTIN formats or items missing HSN/SAC codes.

---

### Lifecycle 8: Reports & CSV Export (Reports Screen)
1. **Period Selection:**
   - *This month*, *Last month*, *This quarter*, *This financial year*.
2. **KPI Overview:**
   - Total Sale
   - Total Purchase
   - Net Profit
   - GST Payable
3. **Detailed Reports:**
   - Sales Report
   - Purchase Report
   - Day Book
   - Profit & Loss Statement
   - Party Ledger Statement
4. **Export CSV:**
   - Generates compliant comma-separated spreadsheet data for Excel or Tally import.
   - Fully protected against mobile column collapse (`AMOUN T`, `STATU S` never wrap into vertical letters).

---

### Lifecycle 9: Settings, Business Profile & Security (Settings Screen)
1. **Business Profile Management:**
   - Edit Legal Firm Name, GSTIN, State, Phone, Address.
2. **Accounting Preferences:**
   - Toggle Multi-Device Cloud Sync.
   - Toggle GST Breakdown.
   - Toggle Auto Round-Off to nearest ₹.
   - Toggle WhatsApp automated alert triggers.
3. **Language Preferences:**
   - English, हिन्दी, मराठी (instantly translates UI strings).
4. **Cash & Bank Management:**
   - View cash in hand, bank accounts, and add bank balances.
5. **Expenses Tracker:**
   - Record Rent, Electricity, Tea/Snacks, Logistics, Miscellaneous expenses.
6. **Data Protection & Backup:**
   - 1-click local JSON backup of entire company database.

---

### Lifecycle 10: Sign Out & Session Teardown
1. Click **"Logout from BiLU ERP"** at the bottom of the Settings screen.
2. The session token is cleared from `safeStorage`.
3. The user is redirected to the `/login` screen.
4. Tenant data in memory is safely purged to prevent credential leaks across multi-user devices.

---

## 6. Security & Production Hardening Checklist

- [x] **Rate Limiting:** Sliding-window rate limit (60 requests/min) on auth endpoints prevents brute force attacks.
- [x] **HTTP Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [x] **Tenant Isolation:** Every invoice, item, party, and payment query is strictly bound by `business_id` and verified against the authenticated user's credentials.
- [x] **Data Persistence Fallback:** If the network is interrupted or the Python server is offline, the client continues functioning seamlessly using local encrypted persistent storage, syncing back when reconnected.

---

## 7. Developer & Maintenance Contacts

- **Lead Development Team:** Pravara Infotech Pvt. Ltd.
- **Repository:** `https://github.com/kirandeshmukh44/bilu-erp.git`
- **Product:** BiLU ERP – *Everything Your Business Needs*

