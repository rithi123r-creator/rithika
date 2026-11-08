# Implementation Plan: Live Turn-by-Turn Voice Navigation & Animated Doppler Weather Radar

## 1. Executive Summary & User Alignment
Based on your selections, we will integrate two critical flood-emergency capabilities into HydroNav:
1. **Turn-by-Turn Live Navigation Voice Prompts**: An in-vehicle audio navigation HUD powered by the browser's native `SpeechSynthesis` API. It speaks turn directions, warns of impending flooded underpasses in advance, and automatically plays safety advisories as the user traverses the route.
2. **Animated Live Weather Radar & Rain Storm Tracking**: An interactive Doppler radar layer overlaid on Google Maps and the Tactical Blueprint. Features animated precipitation cells, playback controls (Play, Pause, Scrub Timeline), and live reflectivity scaling connected to rainfall telemetry.

---

## 2. System Architecture & Component Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HydroNav Application Context                    │
│                                                                        │
│   ┌──────────────────────────┐         ┌───────────────────────────┐   │
│   │   NavigationVoiceEngine  │         │   WeatherRadarEngine      │   │
│   │  - Web SpeechSynthesis   │         │  - Animated Canvas Tile   │   │
│   │  - Audio Alert Queue     │         │  - Doppler Reflectivity   │   │
│   │  - Turn Distance Triggers│         │  - 60-min Storm Loop      │   │
│   └────────────┬─────────────┘         └─────────────┬─────────────┘   │
└────────────────┼─────────────────────────────────────┼─────────────────┘
                 │                                     │
                 ▼                                     ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│      Live Navigation HUD Modal     │ │     Interactive Map Overlays    │
│  - Active Turn Banner             │ │  - Google Maps Doppler Radar     │
│  - Distance to Next Junction      │ │  - Radar Loop Playback Scrub     │
│  - Voice Mute / Replay Controls   │ │  - Storm Vector Trajectory       │
│  - Simulated Driving Progress     │ │  - Dynamic Rain Cell Intensity   │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

---

## 3. Detailed Feature Breakdown

### A. Turn-by-Turn Live Navigation Voice Prompts
- **Speech Synthesis Audio Engine**:
  - Utilizes `window.speechSynthesis` and `SpeechSynthesisUtterance` for zero-latency, offline-capable spoken audio without external API costs or quotas.
  - Automatically selects natural English voices, tuning rate (`1.0x`) and pitch for clear emergency broadcast clarity.
  - Queue prioritization: Emergency hazard warnings (e.g. "Warning: 0.65m deep flood water reported ahead on Downtown Expressway") immediately interrupt or precede standard turn instructions.
- **Active Navigation HUD ("Drive Mode")**:
  - Full-screen or docked floating in-car navigation mode with high-contrast road instruction typography.
  - Big turn-indicator arrows (Left, Right, Straight, Elevated Ramp Entry, Airport Merge).
  - Distance countdown (e.g. "In 450 meters, veer right onto Skyline Elevated Flyover").
  - Audio controls:
    - Mute / Unmute voice toggle with glowing microphone/speaker indicator.
    - Replay Last Instruction button.
    - Test Voice Prompt button.
    - Simulated Drive / Auto-Advance mode so users can test and preview the live audio navigation progression step-by-step.

### B. Animated Live Weather Radar & Rain Storm Tracking
- **Doppler Radar Visualization Overlay**:
  - Rendered on Google Maps using custom synchronized canvas / SVG overlays with realistic meteorological Doppler dBZ color banding:
    - 20-30 dBZ (Light green): Light urban showers.
    - 35-45 dBZ (Yellow/Amber): Moderate downpour and curb accumulation.
    - 50-60+ dBZ (Red/Magenta): Extreme cloudburst cell with localized flash flooding.
  - Synchronized with the telemetry slider: Adjusting rainfall from `20 mm/h` to `90 mm/h` organically increases radar cloud density and storm cell reflectivity.
- **Timeline Playback & Storm Vector Tracking**:
  - 4-frame animated time-lapse cycle (e.g., `-45 min`, `-30 min`, `-15 min`, `NOW`, `+15 min Forecast`).
  - Play / Pause / Step Forward / Scrub timeline slider.
  - Wind vector arrow indicating the movement path of the cloudburst front toward the low-lying basin.
  - Dedicated Radar Toggle button in the map header toolbar for quick show/hide.

---

## 4. UI/UX & Design Guidelines Adherence
- **Zero-Pill Discipline**: Status and timestamps are rendered as clean, unboxed text separated with subtle bullets (`·`).
- **Tactical Navigation Clarity**: Large, high-contrast instruction text, crisp chevron directional icons, and clean segmented radar timeline buttons.
- **Accessibility**: Visual text subtitles always accompany audio speech for users with hearing impairments or muted devices.

---

## 5. Verification & Test Plan
- **Voice Synthesis Test**: Verify audio prompt playback on route step transitions, re-route triggers, and emergency alert escalations.
- **Radar Performance Test**: Verify smooth 60fps canvas animation and timeline scrubber across both Google Maps mode and Tactical Blueprint mode.
- **Cross-Browser Speech Fallback**: Ensure graceful fallbacks if speech synthesis is disabled or blocked by browser media policies.
- **TypeScript & Build Check**: Zero compile or lint errors via `lint_applet` and `compile_applet`.
