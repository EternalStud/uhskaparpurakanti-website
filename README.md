# 🌐 UHS Kaparpura - Public School Website (`uhskaparpurakanti-website`)

Official public web portal for **U.H.S. Kaparpura, Kanti, Muzaffarpur** (UDISE Code: `10140616812`).

Hosted on GitHub Pages with custom domain: **[`https://uhskaparpurakanti.in`](https://uhskaparpurakanti.in)**

---

## 📱 Pages & User Portals

| File | Portal | Description |
| :--- | :--- | :--- |
| `index.html` | **School Home Page** | Main public website featuring hero section, principal's message, live notice board with canonical URL sharing (`#notices`), dynamic multi-media gallery with video player, faculty roster, and patriotic celebration ribbons. |
| `registration.html` | **BSEB Student Registration** | Self-service registration portal for Class 9 and Class 11 students. Supports dual search (Student Code or Roll No + DOB + Stream), automatic bio-data pre-filling, dynamic BSEB subject combination dropdowns, photo/signature uploads, and anti-resubmission locks. |
| `registration-receipt.html` | **Registration Receipt** | Official BSEB printable receipt formatted for A4. Features centered BSEB emblem, tiled Hindi school watermark, student photo & signature boxes, and generous 52px signature spacing. |
| `admission.html` | **Online Admission Application** | Multi-step online admission form for incoming students across Class 1–11 with 12-digit Aadhaar **Verhoeff Checksum Validation**. |
| `admission-receipt.html` | **Admission Receipt** | Printable admission confirmation slip with student details and school seal boundaries. |
| `result.html` | **Public Results Portal** | Student result checker allowing pupils and parents to query marks and divisions using Roll Code & Roll Number. |
| `guide.html` | **Student User Guide** | Step-by-step pictorial instructions guiding students on how to fill online registration and admission forms. |

---

## 🎨 Design System & Core Features

* **Glassmorphism & Clean Typography**: Styled using pure CSS3 with HSL tokens, backdrop blur effects, and Google Fonts (`Plus Jakarta Sans` & `Inter`).
* **Dynamic Multi-Media Gallery**: Automatically loads media categories from the Google Apps Script backend (`GalleryService.js`), recognizing both photos and video streams (`.mp4`, `.webm`, `.mov`).
* **Mobile-First Lightbox**: Full-screen lightbox optimized for mobile (`calc(100vh - 130px)`) to display portrait and landscape videos unobstructed, with native swipe navigation.
* **Uniform `DD/MM/YYYY` Date Formatting**: Replaces native browser date inputs with masked text formatting to eliminate browser/device-specific date display bugs (such as `mm/dd/yyyy` on Chromebooks).
* **Strict Anti-Resubmission Locks**: Prevents duplicate submissions while maintaining stream isolation for Senior classes (Science, Arts, Commerce).

---

## 🔌 API Integration

All dynamic forms and data endpoints communicate with the backend REST API hosted on Google Apps Script:
* **Production API Base**:
  ```javascript
  const ADMIN_API_URL = 'https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec';
  ```

---

## 🚀 Local Development

Run any static HTTP server from the root of this folder:

```bash
cd uhskaparpurakanti-website
python3 -m http.server 8081
```

Access `http://localhost:8081` in your browser.
