# VAJRA MOBILE — Virtual Advanced Intelligence & Response Assistant

VAJRA is a futuristic personal AI control system featuring a Stark Holographic Reactor HUD, touch-optimized voice interface, and advanced system control capabilities.

## 🚀 Official Download
The official release build is generated via GitHub Actions.

### [Build Latest APK](.github/workflows/android-apk.yml)
*Status: Source Ready | Local Build Pending Remote*

---

## 💎 Key Features

### ⚛️ Stark Holographic Reactor HUD
- **Dynamic 2D Canvas Core:** Multi-layered gyroscopic rings with independent rotation.
- **Reactive Stators:** Sequential arc illumination synchronized with assistant state.
- **Energy Nodes:** Real-time flare logic and particle field dynamics.
- **Adaptive UI:** Smooth transitions between Standby Hero mode and Compact Active mode.

### 🎙️ Advanced Voice Intelligence
- **Real-Time Analysis:** `AnalyserNode` based microphone amplitude visualization.
- **Hinglish/Hindi Support:** Natural language intent parsing for multilingual commands.
- **Tap-to-Talk:** Ergonomic central core interaction with haptic feedback.
- **Native Performance:** Optimized mobile audio pipeline for low-latency response.

### 🛠️ Mobile-Native Cockpit
- **Thumb-Zone Navigation:** All controls anchored for one-handed mobile use.
- **Deep Linking:** Seamless integration with YouTube, Maps, Chrome, and local system tools.
- **Security Guardian:** Affirmative confirmation protocols for sensitive operations.

---

## 🛠️ Build & Development

This repository uses **GitHub Actions** for automated Android APK generation.

- **Workflow:** `.github/workflows/android-apk.yml`
- **Environment:** JDK 21, Android SDK 36, Gradle 8.13.
- **Verification:** Every build generates a SHA-256 checksum for integrity verification.

## 📜 Verification Status
The latest APK at the canonical path `release/VAJRA-Mobile-latest-debug.apk` is the single source of truth for the VAJRA Mobile release.

### How to Verify
1. Download both the `.apk` and the `.apk.sha256` files.
2. Run the following command in your terminal:
   ```bash
   sha256sum -c VAJRA-Mobile-latest-debug.apk.sha256
   ```
3. If the output is `VAJRA-Mobile-latest-debug.apk: OK`, the file is authentic.

Older debug files in `public/` or `android/` directories are redundant and should be ignored.
