# BiLU ERP
## Smart Business Management & GST Accounting Software
**A Product by Pravara Infotech Pvt. Ltd.**  
*— Everything Your Business Needs — (Billing • Inventory • Accounting • Growth)*

---

## १. प्रोजेक्टचा परिचय (Project Overview)

**BiLU ERP** हे भारतीय छोट्या व मध्यम व्यावसायिकांसाठी (व्यापारी, दुकानदार, घाऊक विक्रेते, वितरक) बनवलेले एक आधुनिक, सोपे आणि शक्तिशाली **GST Billing, Inventory व Accounting Software** आहे. 

हे सॉफ्टवेअर **मोबाइल (Android / iOS)** तसेच **डेस्कटॉप (Windows .exe / Web)** या सर्व प्लॅटफॉर्मवर सुरळीत चालते.

---

## २. सिस्टीम आर्किटेक्चर (System Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BiLU ERP CLIENT LAYER                           │
│                                                                        │
│   📱 Mobile (React Native / Expo)         💻 Desktop / Web (React-DOM)  │
│   • Dynamic Island / Notch Safe Area      • 240px Sidebar Navigation   │
│   • Android Soft-Nav Bar Protection       • Full-width Data Tables     │
│   • One-Tap WhatsApp Share                • Keyboard Fast Invoicing    │
│   • Electron Windows Desktop .exe         • Offline-Ready Local Cache  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         HTTP / REST API (Axios)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        FASTAPI BACKEND SERVICE                         │
│                                                                        │
│   • Routers: Auth, Businesses, Invoices, Parties, Items, Payments,     │
│              Dashboard, Reports, Admin                                 │
│   • GST Service: Odd-paise split, Half-up line rounding, CGST/SGST/IGST│
│   • Stock Engine: Integer thousandths precision (1.750 kg = 1750)     │
│   • PDF Service: ReportLab A4 GST Tax Invoice + Indian words           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         SQLAlchemy 2.0 ORM
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        DATABASE LAYER (SQLite / PostgreSQL)            │
│                                                                        │
│   • Strict Tenant Isolation (All tables scoped by business_id)         │
│   • Money as INTEGER PAISE (₹1.00 = 100 paise; ZERO float error)       │
│   • Atomic Transactions for Stock Movements & Invoices                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ३. प्रमुख मॉड्यूल्स आणि कार्यपद्धती (Modules & How They Work)

### १. लॉगिन व सुरक्षितता (Authentication & Security)
- **लॉगिन प्रकार**: मोबाइल नंबर + OTP किंवा ईमेल + पासवर्ड.
- **सध्याचा मोड (Dev/Demo)**: कोणताही १०-अंकी नंबर टाका, **Mock OTP: `123456`**.
- **Real SMS OTP (Production)**: Fast2SMS किंवा MSG91 API जोडून थेट ग्राहकाच्या फोनवर खरा SMS OTP पाठवता येतो.
- **सुरक्षितता**: Passlib BCrypt पासवर्ड हॅशिंग + JWT (JSON Web Tokens). एका व्यवसायाचा डेटा दुसऱ्या व्यवसायाला कधीही दिसत नाही (Strict Tenant Scoping).

### २. डॅशबोर्ड व बिझनेस ॲनालिटिक्स (Dashboard & KPIs)
- **Today's Sale**: आज झालेली एकूण विक्री (रुपये व पैशांमध्ये अचूक).
- **To Collect (येणे बाकी)**: ग्राहकांकडून जमा करायची एकूण उधारी (हिरवा रंग).
- **To Pay (देणे बाकी)**: सप्लायर्सना द्यायची बाकी रक्कम (लाल रंग).
- **Low Stock Alert**: संपत आलेल्या मालाची त्वरित माहिती.
- **Recent Transactions**: थेट पार्टीच्या नावासह अलीकडच्या पावत्या; त्यावर टॅप केल्यावर WhatsApp वर बिल शेअर करणे किंवा प्रिंट करणे शक्य.

### ३. जीएसटी बिलिंग व विक्री (GST Billing & Invoicing)
- **विविध इनव्हॉइस प्रकार**: Tax Invoice, Quotation, Proforma Estimate, Bill of Supply, Composition Scheme, Credit Note, Delivery Challan.
- **अचूक GST गणित**: 
  - **Intra-State (राज्यातल्या राज्यात)**: CGST (50%) + SGST (50%). जर विषम पैसे असतील (उदा. 15 पैसे), तर CGST 7 पैसे आणि SGST 8 पैसे देऊन एकूण कर तंतोतंत जुळवला जातो.
  - **Inter-State (दुसऱ्या राज्यातून/राज्यात)**: संपूर्ण कर IGST म्हणून लागू होतो.
- **Auto Round-Off**: बिलाची एकूण रक्कम जवळच्या रुपयामध्ये round-off केली जाते.
- **WhatsApp शेअरिंग**: बिलाचा संपूर्ण तपशील (बिल नंबर, माल, कर, एकूण रक्कम, बाकी) एका क्लिकवर ग्राहकाच्या WhatsApp वर जातो.
- **A4 PDF Tax Invoice**: ReportLab द्वारे कायदेशीर GST Tax Invoice जनरेट होते, ज्यावर रकमेचे इंग्रजी अक्षरी रूपांतर ("Rupees Two Thousand...") छापले जाते.

### ४. ग्राहक व सप्लायर व्यवस्थापन (Parties & Khata)
- **Customers & Suppliers स्वतंत्र टॅब**: कोणाकडून किती उधारी येणे आहे किंवा देणे आहे याची स्वतंत्र यादी.
- **पार्टी लेजर (Party Statement)**: ग्राहकावर क्लिक करताच त्याचा पूर्ण व्यवहार इतिहास, फोन, GSTIN आणि बाकी दिसते.
- **WhatsApp पेमेंट रिमाइंडर**: उधारीची आठवण करून देणारा नम्र मेसेज एका क्लिकवर ग्राहकाला पाठवता येतो.

### ५. इन्व्हेंटरी आणि बारकोडिंग (Inventory & Stock)
- **वजन व परिमाण अचूकता**: डाळ, साखर, तेल यांसारख्या वस्तूंचे वजन हजारो ग्रॅम/मिलीमध्ये मोजले जाते (Milli-unit precision: 1.500 kg = 1500 milli-units). त्यामुळे अपूर्णांकातील त्रुटी येत नाहीत.
- **बारकोड लेबल जनरेटर**: प्रत्येक वस्तूचे Code-128 फॉरमॅटमधील बारकोड लेबल (नाव, HSN, MRP सहित) दिसते.
- **स्टॉक ॲडजस्टमेंट**: तुटफूट, नुकसान किंवा अचानक आलेला माल एका क्लिकवर (+ Add / - Deduct) करून स्टॉक अपडेट करता येतो.

### ६. पेमेंट्स व हिशोब (Payments & Khata Allocation)
- **पेमेंट इन (Payment-In)**: ग्राहकाकडून रोख, UPI, चेक किंवा बँक ट्रान्सफरने आलेली रक्कम नोंदवणे.
- **पेमेंट आउट (Payment-Out)**: सप्लायरला दिलेली रक्कम नोंदवणे.
- जुन्या बिलांशी पेमेंटची FIFO (First-In, First-Out) पद्धतीने आपोआप सांगड घातली जाते.

### ७. रिपोर्ट्स व ताळेबंद (Reports & Ledger)
- **६ मुख्य रिपोर्ट्स**:
  1. **Sales Report**: तारीख आणि बिलांनुसार विक्रीचा तपशील.
  2. **Purchase Report**: सप्लायरनुसार खरेदी व खर्च.
  3. **Party Statement**: प्रत्येक ग्राहकाचे वैयक्तिक खाते.
  4. **Stock Summary**: गोदामातील शिल्लक मालाचे सध्याचे बाजारमूल्य.
  5. **GST Summary (GSTR-1 / GSTR-3B)**: सरकारला भरण्यासाठी लागणारा कर सारांश.
  6. **Bill-wise Profit**: प्रत्येक बिलावर किती नफा झाला याचे विश्लेषण.
- **Export to CSV & JSON**: एक्सेलमध्ये उघडण्यासाठी सर्व रिपोर्ट्स CSV स्वरूपात आणि GSTN पोर्टलसाठी थेट JSON स्वरूपात डाउनलोड करता येतात.

### ८. खर्च व्यवस्थापन (Expenses Tracker)
- दुकानाचे विविध खर्च जसे की: दुकानाचे भाडे (Shop Rent), वीज बिल (Electricity), कर्मचाऱ्यांचे पगार (Staff Salary), चहा-नाश्ता (Tea & Refreshments) आणि वाहतूक खर्च (Logistics).
- खर्च नोंदवल्यामुळे व्यवसायाचा खरा नफा (Net Profit) त्वरित समजतो.

### ९. गल्ला आणि बँक खाती (Cash & Bank Management)
- **Cash In-Hand**: दुकानाच्या गल्ल्यात सध्या प्रत्यक्ष किती रोख रक्कम शिल्लक आहे याची अचूक नोंद.
- **Bank Accounts**: HDFC, SBI किंवा इतर बँकेतील खात्यांची शिल्लक आणि थेट ताळेबंद.

### १०. विक्री आलेख आणि ट्रेंड (Monthly Sales Trend Chart)
- डॅशबोर्डवर मागील ३ महिन्यांचा (उदा. सप्टेंबर, ऑक्टोबर, नोव्हेंबर) ग्राफिकल ट्रेंड.
- किती टक्के विक्री वाढली किंवा घटली (+18.4% Growth) याचा त्वरित अंदाज.

### ११. डेटा बॅकअप व सुरक्षा (Data Backup & Cloud Sync)
- **१-क्लिक लोकल बॅकअप**: एका क्लिकवर संपूर्ण डेटा (बिलांचा इतिहास, साठा, ग्राहक, खर्च) एन्क्रिप्टेड स्वरूपात फोन/पीसीमध्ये सेव्ह.
- **मल्टि-डिव्हाइस क्लाउड सिंक**: मोबाईल आणि संगणक (Desktop) यांच्यात डेटा आपोआप समक्रमित (Sync) होतो.

### १२. विविध स्क्रीन आकारांचे रक्षण (Safe Area Insets Fix)
- **iPhone / Dynamic Island**: वरील मजकूर (Reports, Invoices, Parties) कॅमेरा किंवा Dynamic Island खाली जात नाही; त्याला सुरक्षित अंतर (`insets.top`) दिले आहे.
- **Android Soft Navigation Bar**: मोबाईलमधील खालील ३ बटणे (Back, Home, Recents) आपल्या ॲपच्या टॅब बारला झाकत नाहीत; टॅब बारला सुरक्षित अंतर (`insets.bottom`) देऊन वर उचलले आहे.

---

## ४. पैसे आणि कर हाताळण्याचे मूलभूत नियम (Core Financial Rules)

1. **कधीही Float वापरू नका**: पैशांची गणना करताना IEEE Floating Point एरर (उदा. `0.1 + 0.2 = 0.30000000000000004`) होऊ नये म्हणून सर्व रक्कम **INTEGER PAISE** (पूर्णांक पैसे) मध्ये साठवली जाते (उदा. ₹ 150.50 = 15050 पैसे).
2. **Half-Up Rounding**: प्रत्येक वस्तूच्या कराची गणना करताना Half-Up Rounding वापरले जाते.
3. **Odd-Paise Splitting**: विषम कराची विभागणी करताना १ पैशाचाही फरक पडू दिला जात नाही (`cgst = total // 2`, `sgst = total - cgst`).

---

## ५. प्रोजेक्ट कसा चालवायचा? (How to Run on Windows)

### पायरी १: Backend चालू करणे (FastAPI)
नवीन Terminal उघडा आणि खालील कमांड्स रन करा:
```powershell
cd "D:\Pravara Infotech\BiLU\backend"
.\.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Backend API**: `http://127.0.0.1:8000`
- **Swagger API Docs**: `http://127.0.0.1:8000/docs` (येथे सर्व Endpoints थेट टेस्ट करता येतात)

### पायरी २: चाचणी टेस्ट्स चालवणे (Pytest)
सर्व फायनान्शियल लॉजिक तपासण्यासाठी:
```powershell
cd "D:\Pravara Infotech\BiLU\backend"
.\.venv\Scripts\python -m pytest
```
*(सर्व चाचण्या यशस्वीरीत्या पास होतात)*

### पायरी ३: Frontend मोबाइल व वेब चालू करणे (Expo)
दुसरा Terminal उघडा आणि खालील कमांड्स रन करा:
```powershell
cd "D:\Pravara Infotech\BiLU\app"
npx expo start
```
- **Android / iPhone वर पाहण्यासाठी**: स्क्रीनवरील QR कोड तुमच्या **Expo Go** ॲपमधून स्कॅन करा.
- **वेब ब्राऊजरवर उघडण्यासाठी**: कीबोर्डवर `w` दाबा.
- **TypeScript तपासणी**: `npx tsc --noEmit` (0 एरर्स).

### पायरी ४: Windows Desktop (.exe) सॉफ्टवेअर बनवणे
```powershell
cd "D:\Pravara Infotech\BiLU\app"
npm run build:web
npm run dist:win
```
- तयार झालेली `BiLU ERP Setup 1.0.0.exe` फाईल **`app/release/`** फोल्डरमध्ये मिळेल.

---

## ६. डिफॉल्ट लॉगिन खाती (Default Test Accounts)

| वापरकर्ता | ईमेल / युझरनेम | पासवर्ड / OTP | रोल |
|---|---|---|---|
| **Business Owner** | `owner@biluerp.com` किंवा कोणताही मोबाइल | `Owner@123` किंवा `123456` | Owner (Gupta Traders) |
| **Platform Admin** | `admin@biluerp.com` | `Admin@123` | Platform Admin |

---
*BiLU ERP • Powered by Pravara Infotech Pvt. Ltd. • Everything Your Business Needs*

