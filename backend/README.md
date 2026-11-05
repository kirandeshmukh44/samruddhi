# BiLU ERP GST Billing Backend
### Powered by Pravara Infotech Pvt. Ltd.

A complete, production-ready FastAPI backend for **BiLU ERP**, a GST billing, accounting, and inventory management solution for Indian businesses.

---

## Features & Architecture

- **Integer Paise Money**: All currency and balances are stored as integers (100 paise = ₹1.00). Floating-point errors are completely eliminated.
- **Strict Tenant Isolation**: Every business endpoint validates ownership via `require_business_access`. Users can never view or modify another business's records.
- **GST Tax Engine (`services/gst.py`)**:
  - Intra-state (CGST + SGST equal split) with odd-paise balancing.
  - Inter-state (IGST full rate).
  - Discount applied before tax.
  - Line-level rounding and invoice-level round-off to the nearest rupee.
- **Atomicity & Real-time Stock**:
  - Invoices validate party, calculate live taxes, verify stock sufficiency, deduct/add stock, generate financial-year sequential invoice numbers (`{prefix}-{YYYY-YY}-{XXXX}`), and record payments in a single transaction.
  - Invoices can be deleted to cleanly reverse stock movements with audit records (`delete_reversal`).
- **FIFO Payment Allocations**: Unallocated payments automatically clear the party's oldest unpaid invoices first.
- **Plan Enforcement**: Free plan limits users to 1 business and 50 invoices per calendar month.
- **PDF Generation (`ReportLab`)**: Generates clean, ready-to-print A4 GST Tax Invoices with numbers-to-words in Indian system format.
- **WhatsApp Share Link**: Generates pre-filled `wa.me` links with invoice summary.
- **Platform Admin**: Role-based access control to inspect users, businesses, and aggregate statistics.

---

## Setup & Running on Windows

### 1. Create and Activate Virtual Environment
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure Environment
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```

### 4. Seed the Database
Seeds the database with an Admin (`admin@biluerp.com`), Demo Owner (`owner@biluerp.com`), Gupta Traders, 6 parties, 10 grocery items, and sample invoices:
```powershell
python seed.py
```

### 5. Run the Server
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open **Interactive API Documentation (Swagger)** at:
- **`http://localhost:8000/docs`**
- Alternative Redoc: `http://localhost:8000/redoc`

### 6. Run the Test Suite
```powershell
python -m pytest -v
```

---

## Default Login Credentials (from Seed)

| Role | Email / Phone | Password | Plan |
|---|---|---|---|
| **Platform Admin** | `admin@biluerp.com` / `9000000000` | `Admin@123` | Premium |
| **Demo Business Owner** | `owner@biluerp.com` / `9876543210` | `Owner@123` | Free |
| **Mobile OTP Login** | Any 10-digit phone | `123456` (Mock OTP) | Free |

---

## Complete API Endpoints Summary

### Health
- `GET /health` - System health status

### Authentication (`/auth`)
- `POST /auth/register` - Register a new owner
- `POST /auth/login` - Login with email or phone + password
- `POST /auth/otp/request` - Request mock OTP (`123456`)
- `POST /auth/otp/verify` - Verify OTP and login
- `GET /auth/me` - Get profile of current user
- `PUT /auth/me` - Update profile name or language (`en`, `hi`, `mr`)

### Businesses (`/businesses`)
- `POST /businesses` - Create a new business (enforces 1 business limit on free plan)
- `GET /businesses` - List my businesses
- `GET /businesses/{business_id}` - Retrieve business details
- `PUT /businesses/{business_id}` - Update business info (name, GSTIN, address, state, phone, prefix)

### Parties (`/businesses/{business_id}/parties`)
- `POST /businesses/{business_id}/parties` - Create a customer or supplier
- `GET /businesses/{business_id}/parties` - List parties with search, type filter, pagination, and live computed `outstanding_balance`
- `GET /businesses/{business_id}/parties/{party_id}` - Get party with linked invoices and payment ledger
- `PUT /businesses/{business_id}/parties/{party_id}` - Update party details
- `DELETE /businesses/{business_id}/parties/{party_id}` - Soft delete party

### Items & Stock (`/businesses/{business_id}/items`)
- `POST /businesses/{business_id}/items` - Create item with HSN, unit, prices, GST rate, stock
- `GET /businesses/{business_id}/items` - List items with search (`q`), `low_stock=true` filter, pagination
- `GET /businesses/{business_id}/items/{item_id}` - Retrieve item details
- `PUT /businesses/{business_id}/items/{item_id}` - Update item details
- `POST /businesses/{business_id}/items/{item_id}/adjust-stock` - Adjust stock with audit movement entry
- `DELETE /businesses/{business_id}/items/{item_id}` - Soft delete item

### Invoices (`/businesses/{business_id}/invoices`)
- `POST /businesses/{business_id}/invoices` - Create Sale/Purchase invoice (atomic GST calculation, stock check/deduction, financial year sequence generation, free plan quota check)
- `GET /businesses/{business_id}/invoices` - List invoices with filters (`type`, `status`, `party_id`, date range, search)
- `GET /businesses/{business_id}/invoices/{invoice_id}` - Retrieve full invoice with line items
- `DELETE /businesses/{business_id}/invoices/{invoice_id}` - Delete invoice and reverse stock movements with audit trail
- `GET /businesses/{business_id}/invoices/{invoice_id}/pdf` - Download clean A4 GST Tax Invoice PDF
- `GET /businesses/{business_id}/invoices/{invoice_id}/share-link` - Get WhatsApp sharing link with message

### Payments (`/businesses/{business_id}/payments`)
- `POST /businesses/{business_id}/payments` - Record payment (applied directly to invoice, or FIFO allocated across oldest unpaid invoices)
- `GET /businesses/{business_id}/payments` - List payments with filters (`direction`, `party_id`, dates)
- `DELETE /businesses/{business_id}/payments/{payment_id}` - Delete payment and reverse invoice allocation

### Dashboard (`/businesses/{business_id}/dashboard`)
- `GET /businesses/{business_id}/dashboard` - Real-time metrics: today's sale, to collect, to pay, low stock alert count and top 5 items, recent transactions, monthly sales and purchases

### Reports (`/businesses/{business_id}/reports`)
- `GET /businesses/{business_id}/reports/sales` (JSON or `?format=csv`) - Detailed sales invoices report
- `GET /businesses/{business_id}/reports/purchases` (JSON or `?format=csv`) - Purchase bills report
- `GET /businesses/{business_id}/reports/party-statement/{party_id}` (JSON or `?format=csv`) - Party ledger with running balance
- `GET /businesses/{business_id}/reports/stock-summary` (JSON or `?format=csv`) - Stock quantities and valuation
- `GET /businesses/{business_id}/reports/gst-summary` (JSON or `?format=csv`) - Output GST vs Input tax credit breakdown & net payable
- `GET /businesses/{business_id}/reports/bill-wise-profit` (JSON or `?format=csv`) - Gross margin per sale invoice

### Platform Admin (`/admin`)
- `GET /admin/users` - List all registered users with business count and plan
- `PATCH /admin/users/{user_id}` - Update user status (`is_active`) and subscription plan (`free` / `premium`)
- `GET /admin/businesses` - List all businesses across the platform
- `GET /admin/stats` - High-level metrics (total users, businesses, invoices this month, premium users)

---

## Out of Scope (Phase 2 Roadmap)
- Offline SQLite sync with client
- Razorpay / UPI payment gateway integration
- Official NIC e-invoice and e-way bill generation
- Multi-staff roles and fine-grained permissions
- Expense tracking and credit notes / debit notes (sales returns)
