# Haul Command — App Store Submission Checklist

## Prerequisites

### Apple App Store
- [ ] **Apple Developer Account** — https://developer.apple.com/account (Annual $99 enrollment)
- [ ] **App Store Connect** — https://appstoreconnect.apple.com
- [ ] **Bundle ID registered**: `com.haulcommand.app`
- [ ] **Certificates & Provisioning Profiles** created in Apple Developer Portal
- [ ] **Push Notification entitlement** added to App ID

### Google Play
- [ ] **Google Play Console** — https://play.google.com/console ($25 one-time registration)
- [ ] **App signing key** generated
- [ ] **Keystore file** created and secured
- [ ] **Firebase project** linked (for FCM push notifications)

---

## Build Prerequisites

### Code Readiness
- [ ] `npx next build` completes with **zero errors**
- [ ] `npx cap sync` completes successfully
- [ ] All native plugins (`@capacitor/geolocation`, `@capacitor/push-notifications`, etc.) are synced
- [ ] `capacitor.config.ts` verified:
  - `appId`: `com.haulcommand.app`
  - `appName`: `Haul Command`
  - `webDir`: `dist-capacitor`
- [ ] Remove hardcoded dev server URL from `capacitor.config.ts` for production build
- [ ] Production API endpoints configured (no localhost references)

### iOS Specific
- [ ] Xcode 15+ installed
- [ ] iOS deployment target set (iOS 14.0 minimum)
- [ ] `ios/App/App/Info.plist` updated:
  - `NSLocationWhenInUseUsageDescription`: "Haul Command needs your location to show brokers you're available on nearby corridors."
  - `NSLocationAlwaysAndWhenInUseUsageDescription`: "Background location allows continuous availability updates while on active jobs."
  - `NSCameraUsageDescription`: "Camera is used for evidence capture and document scanning."
- [ ] `ios/App/App/App.entitlements` includes:
  - `aps-environment` = `production`
  - Push notification capability
  - Background modes: location, fetch, remote-notification
- [ ] App icons added (`ios/App/App/Assets.xcassets/AppIcon.appiconset/`)

### Android Specific
- [ ] Android Studio installed
- [ ] `android/app/build.gradle` → `minSdkVersion: 24`, `targetSdkVersion: 34`
- [ ] `android/app/src/main/AndroidManifest.xml` includes:
  - `ACCESS_FINE_LOCATION`
  - `ACCESS_COARSE_LOCATION`
  - `ACCESS_BACKGROUND_LOCATION`
  - `CAMERA`
  - `INTERNET`
  - `RECEIVE_BOOT_COMPLETED`
  - `FOREGROUND_SERVICE`
- [ ] `google-services.json` placed in `android/app/`
- [ ] ProGuard rules configured for release build
- [ ] App icons in all densities (`mipmap-*` folders)

---

## Required Assets

### App Icons
| Platform | Size | Format |
|----------|------|--------|
| iOS | 1024x1024 | PNG, no alpha |
| Android | 512x512 | PNG |
| Android adaptive | 108x108 foreground + background | XML/PNG |

### Screenshots (Required)
| Device | Size (px) | Min Count |
|--------|-----------|-----------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | 3 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | 3 |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | 2 |
| Android Phone | 1080 x 1920 | 3 |
| Android 7" Tablet | 1200 x 1920 | 2 (optional) |
| Android 10" Tablet | 1600 x 2560 | 2 (optional) |

### Recommended Screenshots (3 per device):
1. **Dashboard/Home** — Operator command center with freshness score and stats
2. **Directory/Map** — Live operator map with ELD verified badges
3. **Compliance Calculator** — State requirements lookup showing escort regulations

---

## App Store Metadata

### Apple App Store
```
App Name (30 chars): Haul Command
Subtitle (30 chars): Oversize Load Escort Network
Category: Business
Secondary Category: Navigation

Description (4000 chars max):
Haul Command is the industry-standard platform for oversize and heavy haul transport coordination. Connect with verified pilot car operators, escort services, and heavy haul carriers across 57 countries.

FOR OPERATORS:
• Claim your professional profile and get found by brokers
• ELD-verified availability through Motive integration
• Real-time GPS tracking and live location broadcasting
• HOS compliance monitoring with automated availability
• Offline-capable — works in remote areas with no signal
• Load alerts and demand intelligence for your corridors
• Training programs and industry certifications
• Reputation scoring and freshness-based ranking

FOR BROKERS & CARRIERS:
• Search 12,000+ verified escort operators by state and corridor
• Filter by ELD-verified operators for real-time availability
• View HOS compatibility — know who can complete your load
• Live operator positions on interactive maps
• Rate benchmarks and compliance requirements by state
• Instant booking and coordination tools

COMPLIANCE:
• Escort requirements for all 50 US states + 7 Canadian provinces
• Height, width, length, and weight regulations
• Permit requirements and state-specific rules
• HMIS mileage intelligence and route optimization

Keywords (100 chars):
pilot car,escort,oversize,heavy haul,trucking,ELD,GPS,compliance,loads,transport,freight,carrier

Support URL: https://haulcommand.com/support
Privacy Policy URL: https://haulcommand.com/legal/privacy
```

### Google Play
```
App Title: Haul Command - Oversize Load Escort
Short Description (80 chars): Find verified pilot car operators & heavy haul escort services. ELD verified GPS.
Full Description: [Same as Apple, adapted for Play Store format]
Category: Business
Content Rating: Everyone
```

---

## Review Guidelines Checklist

### Apple Review (https://developer.apple.com/app-store/review/guidelines/)
- [ ] **1.1** No objectionable content
- [ ] **2.1** App completeness — all features functional
- [ ] **2.3** Accurate metadata and screenshots
- [ ] **3.1.1** In-app purchases use StoreKit (Stripe for web subscriptions is OK)
- [ ] **4.0** Design follows HIG
- [ ] **5.1.1** Privacy policy accessible and accurate
- [ ] **5.1.2** Data use disclosure in App Privacy section on App Store Connect
- [ ] Location usage descriptions in Info.plist
- [ ] Login/demo account credentials provided for review team

### Google Play (https://developer.android.com/distribute/best-practices)
- [ ] **Target API level** 34+
- [ ] **Data Safety** section completed in Play Console
- [ ] **Content rating** questionnaire completed
- [ ] Privacy policy linked
- [ ] No deceptive behavior
- [ ] **App signing by Google Play** enabled

---

## Pricing Configuration

### Both Platforms
- [ ] App is **FREE** to download
- [ ] Revenue model: Stripe-based subscriptions (web checkout, not IAP)
- [ ] No in-app purchases needed at launch
- [ ] Boost purchases handled via Stripe web checkout

---

## Pre-Submission Testing
- [ ] Full app flow tested on physical iOS device
- [ ] Full app flow tested on physical Android device
- [ ] GPS permission flow works correctly
- [ ] Push notifications received
- [ ] Offline mode tested (airplane mode)
- [ ] Deep links working (`haulcommand://`)
- [ ] SmartAppBanner meta tags in place
- [ ] No console errors or crashes
- [ ] Memory usage acceptable
- [ ] Battery usage acceptable with GPS tracking

---

## Submission Workflow

### iOS
1. Archive build in Xcode (Product → Archive)
2. Upload to App Store Connect via Xcode Organizer
3. Complete App Store Connect listing (screenshots, metadata, pricing)
4. Submit for review
5. Expected review time: 24-48 hours

### Android
1. Generate signed AAB: `./gradlew bundleRelease`
2. Upload AAB to Google Play Console → Production track
3. Complete store listing (screenshots, metadata, content rating)
4. Submit for review
5. Expected review time: 24-72 hours (first submission may take longer)

---

## Post-Launch
- [ ] Monitor crash reports (Sentry)
- [ ] Respond to user reviews within 24 hours
- [ ] Monitor analytics (PostHog)
- [ ] Set up TestFlight for beta testing (iOS)
- [ ] Set up internal/open testing track (Android)
- [ ] Configure automatic version numbering for CI/CD
