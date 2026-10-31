# AGRIVERSE (एग्रीवर्स)
### National Agricultural Safety & Regulatory Intelligence Platform
*Offline-First Progressive Web Application for Indian Farmers*

---

## 🌾 Overview & Institutional Purpose

**AGRIVERSE** is an offline-first agricultural safety platform designed for Indian farmers. It simplifies pesticide safety labels, decodes CIB&RC statutory toxicity triangles, provides verified regulatory status, outlines Pre-Harvest Interval (PHI) waiting periods, and grants immediate access to emergency toxicology assistance.

Built with an institutional, trustworthy public-service aesthetic adhering strictly to the official Indian agricultural standard color and typography system.

---

## 🔍 Product Scanning & Regulatory Verification Module

### 1. Camera Experience & Quality Detection
- **Permission Flow**: Checks browser permission status via `navigator.permissions.query({ name: 'camera' })`. Remembers previous permission state and skips redundant permission prompt screens once approved.
- **Mobile Alignment Reticle**: High-contrast alignment markers specifically guiding the farmer to frame the statutory CIB&RC toxicity diamond and the CIR registration number box.
- **Hardware Controls**: Large tactile capture shutter, retake action, hardware torch/flash toggle (where supported by camera track constraints), and gallery photo upload.
- **Computer Vision Quality Diagnostics** (`src/utils/imageQuality.ts`):
  - **Luminance Analysis**: Evaluates average Rec. 601 pixel brightness. Flags under-exposed (`POORLY_LIT_DARK`) or glare/over-exposed (`GLARE_DETECTED`) photos with actionable guidance.
  - **Laplacian Variance Edge Detection**: Computes second-order spatial derivatives across a downsampled grayscale grid. Warns if label is out of focus (`BLURRY`) and guides the farmer to hold steady 15-20cm from container.

### 2. Image Processing & Secure Gemini Vision
- **Secure Server-Side Endpoint**: Server endpoint `/api/extract-label` in `vite.config.ts` handles image payload and calls Gemini Vision API securely using `GEMINI_API_KEY` without exposing keys to client browsers.
- **Structured Field Extraction**:
  - `productName`
  - `manufacturer`
  - `activeIngredients`
  - `printedConcentration`
  - `formulation`
  - `registrationNumber` (CIBRC CIR-XXXX)
  - `batchNumber`
  - `manufacturingDate`
  - `expiryDate`
  - `warningStatements`
  - `hazardPictograms`
  - `printedFirstAid`
  - `toxicityTriangleColor`
- **Field Integrity**: Every field returns `extracted_value`, `confidence` (`HIGH` | `MEDIUM` | `LOW` | `UNREADABLE`), `region` (`TOP_HEADER` | `MAIN_BODY` | `CAUTION_BOX` | `BATCH_STRIP` | `FOOTER`), and `verification_status` (`VERIFIED` | `AMBIGUOUS` | `UNVERIFIED` | `MISSING`).
- **Strict Constraint**: Text is **never silently reconstructed**. Faded or damaged text is explicitly recorded as `null` with `UNREADABLE` confidence.

### 3. Authoritative Regulatory Verification Engine (`src/lib/regulatoryEngine.ts`)
Populated strictly from official Ministry of Agriculture & Farmers Welfare, Directorate of Plant Protection, Quarantine & Storage (DPPQS), and CIB&RC Gazette records:
- **Banned Ingredients**: e.g., *Endosulfan* (Supreme Court Order W.P. (C) No. 213 of 2011), *Aldicarb*, *BHC*, *Methyl Parathion*, *Phorate*.
- **Banned Formulations**: e.g., *Monocrotophos 36% SL* strictly banned on all vegetables, fruits, tea, and sugarcane under Gazette Notification S.O. 3922(E).
- **Restricted Ingredients**: e.g., *Chlorpyrifos* with mandatory 15-day Pre-Harvest Interval (PHI) and aquatic drift restrictions under S.O. 2486(E); *Paraquat Dichloride*.
- **State-Specific Restrictions**: e.g., Punjab seasonal prohibition on 10 insecticides on Basmati rice (*Acephate*, *Tricyclazole*, *Carbendazim*).
- **Approved Registrations**: Verified active records with matching CIR registration codes.
- **Uncertainty Principle**:
  - *Missing matches are never treated as approval.* (Returns `NOT_VERIFIED`).
  - *Ingredient similarity is never treated as proof of identity.*
  - Displays: Status, Matched Ingredient/Formulation, Government Source, Gazette Reference ID, Publication Date, Last Verification Date, and Dataset Version (`CIBRC-REG-2024.11-IN`).

### 4. Product Result Screen (`src/screens/ScanResultScreen.tsx`)
- **A. Product Identity**: Trade name, manufacturer, registration code, batch, and mfg/exp dates.
- **B. Extracted Label Information**: Field-by-field breakdown with confidence badges.
- **C. Regulatory Status**: Institutional banner with statutory gazette citations.
- **D. Hazard Warnings**: Extracted printed label warnings alongside CIB&RC directives.
- **E. Recognised Safety Symbols**: Indian statutory toxicity triangle diamond + PPE pictograms.
- **F. First-Aid Information**: AIIMS National Poison Information Centre (**1800-116-117**) guidance & medical antidotes.
- **G. Information Reliability**: Clarity score, lighting diagnostic, and unreadable field flags.
- **H. Source References**: Official gazette references.
- **Side-by-Side Original Text**: Tab toggle comparing raw OCR extracted text with regulatory explanation.

### 5. Safety Constraints
- **Zero Generation**:
  - No pesticide dosage recommendations (e.g. "use X ml/L").
  - No dilution calculations.
  - No tank-mixing instructions.
  - No application schedules or crop treatment predictions.
- **Expert Referral**: Prominent advisory routing farmers to the printed package leaflet, local **Krishi Vigyan Kendra (KVK)**, or **Kisan Call Center (1800-180-1551)**.

### 6. Prepared Demonstration Labels (`src/lib/demoLabels.ts`)
1. **Dursban 20 EC (Chlorpyrifos 20% EC)**: Approved CIBRC, Restricted 15-day PHI, Yellow Triangle.
2. **Nuvacron 36 SL (Monocrotophos 36% SL)**: Gazette S.O. 3922(E) Banned on Vegetables, Red Triangle.
3. **Endocel 35 EC (Endosulfan 35% EC)**: Supreme Court Total Ban, Red Triangle.
4. **NeemShield 10000 PPM (Azadirachtin 1% EC)**: Approved Botanical Bio-pesticide, Green Triangle, 3-day PHI.
5. **Damaged / Obscured Label**: Registration code scratched out; flags `NOT_VERIFIED` with `UNREADABLE` confidence.

---

## 🎨 Design System

- **Primary Green**: `#174B35`
- **Secondary Green**: `#246B45`
- **White**: `#FFFFFF`
- **Background Grey**: `#F4F6F4`
- **Text Charcoal**: `#202824`
- **Secondary Text**: `#747B76`
- **Critical Warning**: `#A52A2A`

---

## 🚀 Getting Started

### 1. Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
GEMINI_API_KEY=your-gemini-vision-api-key # Optional for live AI OCR; deterministic fallback included
```

### 2. Development Server
```bash
npm run dev
```

### 3. Production Build & PWA Precache
```bash
npm run build
```
