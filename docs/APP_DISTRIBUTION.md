# Haul Command — App Distribution Guide
# Generated: 2026-03-24

## What Can Be Automated vs Manual

### ✅ Automated (Code Built)
- Next.js web app deployed to Vercel (live at haulcommand.com)
- Capacitor bridges for iOS/Android native wrapping
- PWA manifest.json + service worker
- Deep link configuration (universal links iOS, app links Android)

### ⚠️ Manual Steps Required (requires human action + accounts)
The following cannot be automated — they require verifying accounts, paying fees,
and navigating store UIs. Here is the exact sequence:

---

## STEP 1 — Create Store Accounts (One-time, ~2 hours)

| Store | URL | Cost | Priority |
|---|---|---|---|
| Google Play | play.google.com/console | $25 one-time | HIGH |
| Apple App Store | developer.apple.com | $99/year | HIGH |
| Samsung Galaxy Store | seller.samsungapps.com | Free | MED |
| Amazon Appstore | developer.amazon.com | Free | MED |
| Microsoft Partner Center | partner.microsoft.com | Free | MED |
| Huawei AppGallery | developer.huawei.com | Free | LOW |
| Xiaomi Developer | dev.mi.com | Free | LOW |
| OPPO Developer | open.oppomobile.com | Free | LOW |
| Aptoide | aptoide.com | Free | LOW |
| Uptodown | uptodown.com | Free | LOW |

---

## STEP 2 — Build Signed Android AAB (Google Play)

```bash
# Prerequisites: Android Studio installed, keystore created
# From project root:
npx cap sync android
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Create keystore (one-time):**
```bash
keytool -genkey -v -keystore haul-command-release.keystore \
  -alias haul-command -keyalg RSA -keysize 2048 -validity 10000
```

**Sign the AAB:**
```bash
# Configure in android/app/build.gradle:
# signingConfigs { release { storeFile, storePassword, keyAlias, keyPassword } }
```

## STEP 2b — Export APK from AAB (All other Android stores)

```bash
# Google provides bundletool to extract universal APK from AAB
java -jar bundletool.jar build-apks \
  --bundle=app-release.aab \
  --output=app-release.apks \
  --mode=universal \
  --ks=haul-command-release.keystore \
  --ks-key-alias=haul-command

# Extract the APK:
unzip app-release.apks -d apks
# universal APK at: apks/universal.apk
```

**This single APK submits to:** Samsung, Amazon, Xiaomi, OPPO, Vivo, Aptoide, Uptodown

---

## STEP 3 — Build Signed iOS IPA (Apple App Store)

```bash
# Prerequisites: Xcode installed, Apple Developer account, provisioning profile
npx cap sync ios
# Open Xcode:
open ios/App/App.xcworkspace
```

In Xcode:
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload (or export IPA manually)

---

## STEP 4 — Build Huawei-Specific APK (AppGallery)

Huawei devices don't have GMS (Google Mobile Services) — FCM does not work.

```bash
# Replace Firebase FCM with HMS Push Kit in capacitor.config.ts:
# 1. Register app at developer.huawei.com → AppGallery Connect
# 2. Download agconnect-services.json
# 3. Install: npm install @hmscore/capacitor-hms-push
# 4. Replace NEXT_PUBLIC_FIREBASE_* with HMS equivalents
# 5. Build: ./gradlew bundleRelease (separate flavor)
```

**HMS environment variables to add:**
```
HUAWEI_APP_ID=
HUAWEI_CLIENT_ID=
HUAWEI_CLIENT_SECRET=
HMS_PUSH_SENDER_ID=
```

---

## STEP 5 — PWA Submission to Microsoft Store

No build needed — submit the URL:
1. Go to partner.microsoft.com → New App → Add a progressive web app
2. Enter: https://haulcommand.com
3. Microsoft pulls manifest.json automatically
4. Fill in store listing metadata

---

## STEP 6 — Submit to Each Store

### Google Play
1. Play Console → Create app → Upload AAB
2. Core app quality checklist
3. Target API level: 34
4. Privacy policy URL: https://haulcommand.com/privacy
5. Submit for review (3-5 days)

### Apple App Store
1. App Store Connect → New App → iOS
2. Upload IPA via Xcode or Transporter
3. Fill metadata, screenshots (6.7", 6.5", 5.5" required)
4. Submit for review (1-3 days)

### Samsung Galaxy Store
1. Create listing → Upload APK
2. DPI screenshots required
3. Submit (3-5 days)

### Amazon Appstore
1. Upload APK → Fill metadata
2. No sandbox required for basic app
3. Submit (1-3 days)

### Aptoide / Uptodown
1. Create developer account
2. Upload APK directly
3. Goes live within hours — no review

---

## Metadata Shared Across All Stores

```
App Name: Haul Command
Tagline: Heavy Haul Escort — Nationwide
Category: Business / Transportation / Logistics

Short Description (80 chars):
Find certified pilot car escorts nationwide. Post loads in 47 minutes.

Long Description (4000 chars):
Haul Command is the professional platform for heavy haul escort operations.
Whether you're a broker posting an oversize load or an escort operator
looking for work, Haul Command connects you instantly.

KEY FEATURES:
• Post oversize loads — 47-minute median fill time
• Find AV-Ready certified escort operators nationwide
• Escrow-protected payments — no collections calls
• Oilfield specialist operators for Permian Basin, Eagle Ford, Bakken
• Real-time route intelligence — 57 countries
• HC Certified training — 3 certification tiers
• Live dispatch tracking

FOR ESCORT OPERATORS:
• Get hired on loads matching your corridor and availability
• Earn HC Certified, AV-Ready, or Elite certifications
• Standing orders — recurring load relationships
• Competitive bid or accept fixed-rate offers

FOR BROKERS & CARRIERS:
• Post loads instantly with dimension + route details
• Access 7,700+ verified escort operators nationwide
• Escrow protection — money held until escort confirmed
• Real-time GPS tracking during escort

Privacy Policy: https://haulcommand.com/privacy
Terms of Service: https://haulcommand.com/sla
Support Email: support@haulcommand.com
```

---

## Screenshot Requirements

| Store | Sizes Required |
|---|---|
| Google Play | 1080×1920 (phone), 1200×1920 (tablet) |
| Apple App Store | 1284×2778 (6.7"), 1242×2688 (6.5"), 1242×2208 (5.5") |
| Samsung Galaxy | 1080×1920 minimum |
| Amazon | 1024×500 (feature graphic) + 1080×1920 |

**Recommended screenshots (7 total):**
1. Load board (post a load in 2 minutes)
2. Find escort operators map view
3. AV-Ready certification screen
4. Escrow payment screen
5. Oilfield corridor map
6. HC Certified badge / operator profile
7. Live dispatch tracking screen

---

## Expected Timeline

| Milestone | Timeline |
|---|---|
| Google Play submission | Day 1 (after account + AAB ready) |
| Apple submission | Day 1-2 (requires Xcode + provisioning) |
| Google Play approved | Day 4-8 |
| Apple approved | Day 2-5 |
| Samsung / Amazon approved | Day 4-8 |
| Microsoft Store (PWA) | Day 1-3 |
| Aptoide / Uptodown | Day 1 (immediate) |

---

## What Was ALREADY Done in Previous Sprints

From app-store-submission-checklist.md and prior sessions:
- ✅ App.entitlements (iOS push, universal links, network)
- ✅ Info.plist (location, camera, background modes)
- ✅ SmartAppBanner component (deep link redirect)
- ✅ ServiceWorkerRegister component (PWA)
- ✅ PWA manifest.json at /public/manifest.json
- ✅ capacitor.config.ts with production URL

## What Still Requires Manual Action

- ⚠️ Create Google Play Console account ($25)
- ⚠️ Create Apple Developer account ($99/year)
- ⚠️ Create keystore for signing (run keytool command above)
- ⚠️ Run Xcode Archive on a Mac with Capacitor sync
- ⚠️ Take screenshots on real devices or simulators
- ⚠️ Submit each listing with metadata above
- ⚠️ Create 10 YouTube channels (one per language)
- ⚠️ Complete YouTube OAuth2 flow for each channel (get refresh tokens)
- ⚠️ Sign up for HeyGen (heygen.com) and pick avatar + voice
