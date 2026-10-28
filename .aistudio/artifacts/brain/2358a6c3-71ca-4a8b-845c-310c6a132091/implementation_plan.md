# VAJRA Mobile — Stark-Level Complete Integration Master Plan

Upgrade VAJRA Mobile into a reliable, production-grade, Stark-inspired personal AI assistant with full Android runtime stability, app linking, multi-step command routing, auto-update management, controlled self-improvement workflows, live AR vision, knowledge tools, and tactical protocols.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 clarification:

- **Auto-Update Delivery Route**: Sideloaded APK download flow with Android package installer intent (`ACTION_VIEW` / `FileProvider`).
- **Stark AR Vision Default Filter**: Marvel-inspired Standard Optics with active target acquisition reticles, distance telemetry, and crosshairs.
- **Veronica Protocol Lockdown Confirmation**: High-risk actions during Veronica protocol run with an automated 3-second countdown and explicit cancel option.

---

## 1. Overview & Core Concept

**VAJRA Mobile** is a futuristic, Iron Man J.A.R.V.I.S.-inspired personal AI assistant engineered for Android devices. It combines real-time voice recognition, continuous "Hello Vajra" wake-word listening, 3D Arc Reactor canvas visualization, multi-step phone control automation (Wi-Fi/Bluetooth settings, camera, dialer, draft SMS, volume, notes), and multimodal Gemini AI intelligence.

This master upgrade resolves remaining Android runtime issues (hologram viewport sizing, speech recognition permission flows, wake phrase matching), integrates an editable **Stark App Link Hub**, establishes a **Central Command Center** for multi-step task execution, adds an **Auto-Update Manager**, builds a privacy-conscious **System Health Dashboard**, and connects **Stark AR Vision**, **Scientific Technical Database**, and **Tactical Protocol Matrix** into a cohesive system.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Hero Standby & Voice Engagement**:
   - The user opens VAJRA and sees a centered, high-density J.A.R.V.I.S. Living Energy Core that dynamically fills available screen height without letterboxing.
   - Tapping the sphere or saying *"Hello Vajra"* activates acoustic sensors, triggering a sub-bass Arc Reactor spin-up audio cue and pulsing cyan radar rings.

2. **App Linking & Universal Navigation**:
   - The user says *"Vajra, open YouTube"* or taps the **Stark App Link Hub**.
   - If installed, Android intents launch the native app directly. If unavailable, VAJRA seamlessly offers a validated web fallback.

3. **Multi-Step Command Execution**:
   - Complex directives (e.g. *"Search quantum physics, save note, and set volume to 80%"*) route through the Central Command Center.
   - Progress indicators display step-by-step execution status (`PENDING` -> `RUNNING` -> `COMPLETED`). Consequential or high-risk actions (e.g. file deletions) invoke security confirmations with 3-second countdowns.

4. **Stark AR Vision & Camera Scanning**:
   - Launching Stark Vision opens a live camera viewfinder with Marvel-inspired HUD reticles and target crosshairs.
   - Tapping **Snap & Analyze** feeds the frame to Gemini AI for real-time visual analysis with spoken feedback.

5. **Auto-Update & Health Monitoring**:
   - The **Stark System Health Dashboard** displays live status checks for permissions, microphone, WebGL, AI network connectivity, and app version.
   - The **Update Manager** verifies signed release metadata and initiates APK downloads with standard Android installation intents.

---

### Visual Identity & Theme

- **Aesthetic Direction**: Cinematic, Stark Industries J.A.R.V.I.S. HUD. Deep midnight canvas (`#020003` / `#080103`) paired with radiant crimson-gold (`#f59e0b`, `#dc2626`) and cyan arc (`#00f3ff`) energy accents.
- **Typography & Hierarchy**:
  - Display / HUD Headings: `font-hud` / `font-mono` with uppercase tracking (`tracking-widest`).
  - Body Prose & Input: `font-mono` / `Plus Jakarta Sans` for crisp legibility.
- **Layout & Spatial Math**:
  - Full-width responsive container scaling seamlessly from 375px mobile viewports up to 1440px desktop canvases.
  - Zero-pill metadata discipline: metadata presented as unboxed text with `·` or `/` separators.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Android Speech Recognition Dual-Layer Architecture**
  - *Chosen Approach*: `VajraNativeSpeechPlugin.java` on native Android builds with W3C `SpeechRecognition` fallback on browser/PWA.
  - *Why*: Guarantees zero-friction microphone capture without relying on external web view audio bridges.

- **Decision 2: Auto-Update Package Delivery**
  - *Chosen Approach*: Cryptographic release metadata verification (`version.json`) + Sideloaded APK download via `FileProvider` intent.
  - *Why*: Ensures safe sideloaded updating without requiring root privileges or violating Android OS security boundaries.

- **Decision 3: Controlled Self-Improvement Engine**
  - *Chosen Approach*: Isolated static analysis, test runner, and patch proposal generator.
  - *Why*: Prevents unverified self-modifying code execution in production while giving users a clear diagnostic and patch creation pipeline.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         VAJRA MOBILE ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌──────────────────────┐
│  MobilePresenceCore   │                           │ MobileConversation   │
│ (Arc Reactor Sphere)  │                           │   (Chat & Input)     │
└──────────┬────────────┘                           └──────────┬───────────┘
           │                                                   │
           └─────────────────────────┬─────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      CENTRAL INTELLIGENCE ENGINE                         │
│   (Intent Resolution, Context Orchestrator, Action Policy Engine)        │
└──────────┬─────────────────────────┬─────────────────────────┬───────────┘
           │                         │                         │
           ▼                         ▼                         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ Voice Controller   │    │ Mobile Control     │    │ Stark App Link Hub │
│ (Native & Web)     │    │ Engine (Phone OS)  │    │ (Intents & Deep)   │
└────────────────────┘    └────────────────────┘    └────────────────────┘
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   ANDROID NATIVE / CAPACITOR PLUGINS                     │
│  (VajraNativeSpeech, IntentBridge, Network, Camera, System Health)      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Roadmap

### Phase 1: Hologram Viewport & Speech Pipeline Fixes
- Add dynamic `ResizeObserver` container recalculation to eliminate tiny hologram rendering inside black boxes.
- Update `VajraNativeSpeechPlugin.java` permission callbacks to auto-start speech recognizer upon user permission grant.
- Refine regex wake-word matching (`parseWakePhrase`) for punctuation-tolerant "Hello Vajra" detection.

### Phase 2: Stark App Link Hub & Central Command Center
- Create `StarkAppLinkHub.tsx` with editable shortcuts for YouTube, Settings, Camera, Maps, and custom Web links.
- Expand `mobileControlEngine.ts` to coordinate multi-step task execution with progress states (`PENDING`, `RUNNING`, `COMPLETED`, `CANCELLED`).

### Phase 3: Auto-Update Manager & Controlled Self-Improvement
- Build `StarkUpdateManagerModal.tsx` to query trusted release metadata (`/version.json`), display download progress, and launch Android APK package installer intent.
- Add diagnostic patch analysis to `vajraSelfHeal.ts` for safe, reviewable change summaries.

### Phase 4: System Health Dashboard & Vision Refinements
- Expand `VoiceDiagnosticHUD.tsx` into `StarkHealthDashboardModal.tsx` showing live permission states, WebGL rendering status, battery, and AI network connectivity.
- Verify `StarkVisionModal.tsx` camera viewport and Gemini multimodal snapshot analysis.
