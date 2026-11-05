# BiLU ERP — संपूर्ण बिल्ड मार्गदर्शक (Build Guide)
### Android (APK) · iPhone (iOS) · Windows Desktop (EXE)
**Powered by Pravara Infotech Pvt. Ltd.**

---

या मार्गदर्शकामध्ये BiLU ERP चे **Android APK**, **iPhone (iOS)**, आणि **Windows Desktop (.exe)** कसे तयार करायचे, आणि समोरच्या व्यक्तीला टेस्टिंगसाठी कसे पाठवायचे, याची सविस्तर सोपी पद्धत दिलेली आहे.

---

## १. Android APK (अँड्रॉइड फोनसाठी इन्स्टॉलर)

Android मोबाईलवर टेस्टिंगसाठी थेट इन्स्टॉल होणारी `.apk` फाईल बनवण्याचे २ सोपे मार्ग आहेत:

### पर्याय A: EAS Cloud Build (सर्वात सोपा आणि शिफारस केलेला मार्ग)
यासाठी तुमच्या कॉम्प्युटरमध्ये Android Studio ची गरज नसते. Expo चे मोफत क्लाउड सर्व्हर थेट `.apk` तयार करून देते.

1. **पायरी १**: [expo.dev](https://expo.dev) वर जाऊन मोफत अकाऊंट उघडा (जर नसेल तर).
2. **पायरी २**: टर्मिनलमध्ये `app` फोल्डरमध्ये जा:
   ```bash
   cd "d:\Pravara Infotech\Vyapar\app"
   ```
3. **पायरी ३**: Expo अकाऊंटने लॉगिन करा:
   ```bash
   npx eas login
   ```
4. **पायरी ४**: APK बिल्ड कमांड चालवा:
   ```bash
   npm run build:apk
   ```
   *(किंवा थेट: `npx eas build -p android --profile preview`)*
5. **पायरी ५**: बिल्ड पूर्ण झाल्यावर स्क्रीनवर एक **Direct Download Link आणि QR Code** दिसेल.
   - त्यावर क्लिक करून **`BiLU-ERP.apk`** डाऊनलोड करा.
   - ही `.apk` फाईल तुम्ही WhatsApp, Google Drive किंवा Pen Drive द्वारे कोणालाही पाठवू शकता, ते त्यांच्या Android मोबाईलमध्ये थेट इन्स्टॉल करू शकतात!

---

### पर्याय B: Expo Go द्वारे झटपट टेस्टिंग (१ मिनिटात लाईव्ह टेस्ट)
जर तुम्हाला कोडिंग करताना किंवा समोरच्याला ताबडतोब मोबाईलवर अ‍ॅप दाखवायचे असेल:
1. प्ले स्टोअरवरून मोबाईलमध्ये **Expo Go** अ‍ॅप इन्स्टॉल करा.
2. तुमच्या कॉम्प्युटरवर टर्मिनलमध्ये चालवा:
   ```bash
   cd app
   npx expo start
   ```
3. कॉम्प्युटरच्या स्क्रीनवर एक **QR Code** दिसेल.
4. **Expo Go** अ‍ॅप उघडून तो QR कोड स्कॅन करा — BiLU ERP अ‍ॅप तुमच्या मोबाईलवर त्वरित सुरू होईल!

---

## २. iPhone (iOS) वर टेस्टिंग व बिल्ड

Apple च्या नियमांनुसार iPhone वर अ‍ॅप टेस्ट करण्यासाठी खालील २ सर्वोत्तम पद्धती आहेत:

### पर्याय A: Expo Go द्वारे iPhone वर थेट टेस्टिंग (० खर्च, सर्वात वेगवान)
1. iPhone च्या App Store वरून **Expo Go** अ‍ॅप मोफत डाऊनलोड करा.
2. कॉम्प्युटरवर कमांड चालवा:
   ```bash
   cd app
   npx expo start
   ```
3. iPhone चा **कॅमेरा (Camera app)** उघडा आणि कॉम्प्युटरवरील QR कोड स्कॅन करा.
4. वर **"Open in Expo Go"** असा मेसेज येईल त्यावर टॅप करा — BiLU ERP लगेच iPhone वर मूळ अ‍ॅपप्रमाणे उघडेल!

### पर्याय B: EAS Build (Apple Developer / TestFlight / Simulator साठी)
1. तुमच्याकडे Apple Developer Account असल्यास:
   ```bash
   npm run build:ios
   ```
   *(किंवा: `npx eas build -p ios --profile preview`)*
2. हे तुमच्या iPhone साठी TestFlight द्वारे किंवा सिम्युलेटरसाठी बिल्ड तयार करून देईल.

---

## ३. Windows Desktop (.exe) फाईल तयार करणे

BiLU ERP चे Windows कॉम्प्युटरसाठी स्वतंत्र सॉफ्टवेअर (`.exe`) बनवणे:

1. **पायरी १**: वेब प्रॉडक्शन बंडल तयार करणे:
   ```bash
   cd app
   npm run build:web
   ```
   *(याने `app/dist` मध्ये ऑप्टिमाइझ्ड वेब कोड तयार होतो.)*

2. **पायरी २**: Windows `.exe` तयार करणे:
   ```bash
   npm run dist:win
   ```
3. **तयार फाईल्स कुठे मिळतील?**:
   - कमांड पूर्ण झाल्यावर **`app/release/`** फोल्डरमध्ये जा.
   - तिथे तुम्हाला खालील फाईल्स मिळतील:
     - **`BiLU ERP Setup 1.0.0.exe`** — हा संपूर्ण Windows इन्स्टॉलर सेटअप आहे (कोणाच्याही लॅपटॉप/पीसीवर इन्स्टॉल करण्यासाठी).
     - **`win-unpacked/BiLU ERP.exe`** — इन्स्टॉल न करता थेट डबल क्लिक करून चालणारी फाईल.

---

## ४. एका नजरेत सर्व कमांड्स (Quick Reference)

| प्लॅटफॉर्म | काय तयार होते | कमांड |
|---|---|---|
| **Android APK** | इन्स्टॉल होणारी `.apk` | `cd app; npm run build:apk` |
| **Android/iOS Quick** | लाईव्ह मोबाईलवर टेस्ट | `cd app; npx expo start` |
| **iPhone (iOS)** | iOS Preview / TestFlight | `cd app; npm run build:ios` |
| **Windows Desktop** | `BiLU ERP Setup 1.0.0.exe` | `cd app; npm run build:web; npm run dist:win` |

---

### महत्त्वाची टीप (Important Tips)
1. **नवीन फीचर्स ॲड केल्यावर**: आधी `npm run build:web` किंवा बदल सेव्ह करा, मगच नवीन बिल्ड काढा.
2. **सुरक्षितता**: `.apk` किंवा `.exe` कोणालाही टेस्ट करायला देताना तुमचा डेटा `safeStorage` मध्ये सुरक्षितपणे सेव्ह होतो.
3. **लोगो व ब्रँडिंग**: सर्व प्लॅटफॉर्मवर (Android, iOS, Windows) **BiLU ERP चा नवीन लोगो व ब्रँडिंग** आपोआप सेट केलेले आहे.
