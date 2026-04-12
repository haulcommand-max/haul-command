# Haul Command — App Store Submission Checklist

## ✅ Pre-Submission Requirements

### Apple App Store
- [ ] **Apple Developer Account** — https://developer.apple.com/account (requires $99/year enrollment)
- [ ] **App Store Connect access** — https://appstoreconnect.apple.com
- [ ] **Certificates & Provisioning Profiles** created in Apple Developer Portal
- [ ] **Distribution certificate** (p12) installed on build machine
- [ ] **App ID** registered: `com.haulcommand.app`
- [ ] **Push Notification capability** enabled (App.entitlements configured ✅)
- [ ] **Associated Domains** configured for `haulcommand.com` ✅

### Google Play Store
- [ ] **Google Play Console account** — https://play.google.com/console ($25 one-time)
- [ ] **App signing key** generated
- [ ] **SHA-256 fingerprint** added to Firebase project
- [ ] **Package name** registered: `com.haulcommand.app`

---

## 📱 Required Assets

### iOS Screenshots (required per device)
| Device | Resolution | Required | Status |
|--------|-----------|----------|--------|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | 3 minimum | ⏳ Generate via /dev/screenshots |
| iPhone 6.5" (14 Plus) | 1242 × 2688 | 3 minimum | ⏳ Generate via /dev/screenshots |
| iPad Pro 12.9" (6th gen) | 2048 × 2732 | 2 minimum | ⏳ Generate via /dev/screenshots |

### Android Screenshots
| Type | Resolution | Required | Status |
|------|-----------|----------|--------|
| Phone | 1080 × 1920 | 3 minimum | ⏳ Generate via /dev/screenshots |
| Tablet 7" | 1200 × 1920 | 1 minimum | ⏳ Optional |
| Tablet 10" | 1920 × 1200 | 1 minimum | ⏳ Optional |

### App Icons
- [ ] iOS: 1024 × 1024 PNG (no alpha, no rounded corners)
- [ ] Android: 512 × 512 PNG (adaptive icon)
- [ ] Feature Graphic (Android): 1024 × 500

---

## 📝 App Store Metadata

### English (Primary)
| Field | Value | Limit |
|-------|-------|-------|
| **App Name** | Haul Command | 30 chars |
| **Subtitle** | Heavy Haul Escort Marketplace | 30 chars |
| **Keywords** | pilot car,escort vehicle,oversize load,heavy haul,ELD,HOS,trucking,freight,dispatch,compliance | 100 chars |
| **Support URL** | https://haulcommand.com/support | — |
| **Privacy Policy URL** | https://haulcommand.com/privacy | — |
| **Marketing URL** | https://haulcommand.com | — |
| **Category** | Business / Navigation | — |
| **Price** | Free (IAP for subscriptions) | — |

### Description (4000 chars max)
```
Haul Command is the operating system for oversize and heavy haul transport. Find verified pilot car operators, post escort loads, and manage compliance across 120 countries — all from your phone.

FOR ESCORT OPERATORS:
• Get matched with loads near your location in real-time
• One-tap accept — start earning immediately
• ELD-verified availability via Motive integration
• Build your reputation with verified job history
• Track HOS compliance automatically
• GPS breadcrumb recording for route documentation

FOR BROKERS & DISPATCHERS:
• Find available escort operators by corridor
• See real-time operator positions on the map
• Filter by ELD verification, insurance, and equipment
• Escrow-protected payments via Stripe
• Post loads and get coverage in minutes

FEATURES:
• Live operator map with real-time GPS positions
• State-by-state escort requirement compliance checker
• Corridor intelligence — know where demand is highest
• Offline mode — works in dead zones and remote areas
• Push notifications for load matches and job updates
• Territory leaderboards and trust rankings
• QuickPay — get paid within 24 hours of job completion

SUBSCRIPTION PLANS:
• Starter: Free — get discovered by brokers
• Verified Pro: $29/mo — priority matching and leads
• Corridor Elite: $79/mo — dominate your corridors
• Broker Seat: $149/mo — post loads, find coverage

Subscriptions auto-renew monthly or annually. Manage or cancel anytime in Settings.
```

---

## 🔍 Apple App Review Guidelines Check

- [ ] **4.0 Design** — App follows iOS HIG, no placeholder content
- [ ] **4.2 Minimum Functionality** — App provides value beyond a website wrapper
- [ ] **3.1.1 In-App Purchase** — Subscriptions use Stripe (allowed for B2B service marketplaces)
- [ ] **5.1.1 Data Collection** — Privacy nutrition labels correctly declared
- [ ] **5.1.2 Data Use** — Location usage descriptions in Info.plist
- [ ] **2.1 App Completeness** — No crashes, all features functional
- [ ] **Login required** — Provide demo account credentials for reviewer

### iOS Info.plist Required Keys
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Haul Command needs your location to show brokers you're available on nearby corridors.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Haul Command uses background location to keep your availability status accurate while you drive.</string>
<key>NSCameraUsageDescription</key>
<string>Take photos of permits, insurance cards, and job evidence.</string>
```

---

## 🚀 Build & Submission Steps

### iOS
1. `npx next build` — verify zero errors
2. `npx cap sync ios` — sync web assets
3. Open `ios/App/App.xcworkspace` in Xcode
4. Set Team and Signing in Xcode
5. Product → Archive
6. Window → Organizer → Distribute App → App Store Connect
7. In App Store Connect: add screenshots, metadata, submit for review

### Android
1. `npx next build` — verify zero errors
2. `npx cap sync android` — sync web assets
3. Open `android/` in Android Studio
4. Build → Generate Signed Bundle/APK → Android App Bundle
5. Upload AAB to Google Play Console
6. Complete store listing, content rating, pricing
7. Submit for review

---

## ⏳ Remaining Items Before Submission

| Item | Status | Notes |
|------|--------|-------|
| Apple Developer enrollment | ⏳ | Need $99/year account |
| Google Play Console | ⏳ | Need $25 account |
| App icon (1024×1024) | ⏳ | Design needed |
| Screenshots generation | ⏳ | Use /dev/screenshots page |
| Privacy nutrition labels | ⏳ | Declare in App Store Connect |
| Demo reviewer account | ⏳ | Create test credentials |
| Production Capacitor config | ⏳ | Switch server.url to production |
| google-services.json | ⏳ | From Firebase Console |
| GoogleService-Info.plist | ⏳ | From Firebase Console |
| Stripe IAP configuration | ✅ | Already configured |
| Push entitlements | ✅ | App.entitlements created |
| Deep links | ✅ | Associated domains configured |
| capacitor.config.ts | ✅ | appId + appName correct |
