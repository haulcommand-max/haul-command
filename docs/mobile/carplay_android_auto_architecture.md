# Haul Command: Native Cab Integration Architecture

**Target:** Migrate mobile OS tracking functions to vehicle head units to eliminate dashboard mobile mounting restrictions while retaining telemetry superiority.

## 1. CarPlay / Android Auto Interface (Mapbox Nav SDK)
Using the Mapbox Navigation SDK's native integration modules for Android Auto and Apple CarPlay.

### The Head-Unit Render
The mobile OS operates in "background mode" (screen off, cup holder) while projecting the following UI to the vehicle's 10-inch embedded console:

*   **Geospatial Layer:** A hyper-minimalist dark mode rendering of the Custom OS Route (not Mapbox defaults).
*   **Tripwires Layer:** Boundary indicators clearly marked (e.g., solid red line at the State Border).
*   **Action Row:** Only critical, massive touch-targets designed for driving mechanics:
    1.  **[DROP HAZARD]** - Giant button that instantly captures lat/lng and prompts voice-annotation or default "obstacle".
    2.  **[MUTE COMMS]** - Toggle digital CB relay.
    3.  **[SOS]** - Heavy Haul emergency dispatcher ping.

### Hardware Bridge Advantage
By rendering on the vehicle's screen, Haul Command becomes perceived as indigenous truck software, deeply increasing perceived Moat Value and user retention.

## 2. Voice-Actuated Hazard Drops (Background Mode)
The app leverages OS-level Voice Recognition while sleeping:
1.  **Hotword Activation:** `[Triggers OS Background Loop]` "Haul Command, log hazard."
2.  **Telemetry Capture:** App instantly pulls current Traccar coordinate point.
3.  **Database Payload:** Submits silently to `/api/v1/mobile/hazards` via Auth Token.
4.  **Haptic/Audio Confirmation:** "Hazard recorded at mile marker 412." (Keeps eyes on road).

## 3. The Motive / Samsara AI Vacuum Loop
Because operators refuse to mount phones for Vision SDK, we hijacked their existing dashcams.
*   **Implementation:** `/api/telemetry/hardware/motive`
*   **Execution:** The Motive camera detects a rapid deceleration or standstill traffic using its own AI.
*   **Data Flow:** Motive sends a webhook to Haul Command -> We translate it into a Heavy Haul Hazard -> We plot it on the Global Command Map -> All other operators get warned instantly.

*No driver interaction required.* The cab naturally mines data for the Haul Command monopoly based purely on its physical inertia.
