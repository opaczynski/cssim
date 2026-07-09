# CSSim

**CSSim** is an advanced desktop application built with [Electron](https://www.electronjs.org/) that allows you to fully **simulate CSS media queries, environment variables, and modern web APIs** without needing to deploy your project to physical devices. 

It is designed specifically for front-end developers who need a robust, hardware-free environment to test highly responsive layouts, accessibility features, and experimental web standards.

---

## ✨ Core Features

CSSim goes far beyond simple window resizing. Through its control panel, you can simulate and manipulate:

* **Advanced Screen Properties:** Width, height, zoom/fractional scaling, screen diagonal, and custom DPI.
* **Navigation & System Bars:** Hardware layout simulation with safe-area styling control.
* **Color & Accessibility Diagnostics:**
    * Media queries: `color-gamut` (sRGB, P3, Rec2020), `color-index`, and `dynamic-range`.
    * Simulated High Contrast Modes (`forced-colors` types like Aquatic, Desert, Dusk, Night Sky).
    * Real-time `inverted-colors` and multi-bit `monochrome` mode options.
    * **SVG-powered Color Blindness filters** (Protanopia, Deuteranopia, Tritanopia, Achromatopsia).
* **User Preferences:** Native toggles for `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion`, and `prefers-reduced-transparency`.
* **Foldables & Dual-Screen Devices:** Native support for experimental Foldable Devices via the **Screen Fold API** (with degree tracking) and **Viewport Segments API**.
* **Inputs & Interactions:** Toggles for fine/coarse pointers, hover capabilities, and an on-screen **finger/touch interaction simulator** with customizable target sizes.
* **Environment Variables & Runtime Injection:** Real-time simulation of `safe-area-inset-*`, `titlebar-area-*`, and `keyboard-inset-*` custom CSS environments.
* **User-Agent Spoofing:** Complete control over `navigator.userAgent`, mobile status flags, platform strings, and client hints/brands.
* **Flexible Testing Inputs:** Test a local environment inside the `project` directory or hook up an external live testing environment via a custom **URL preview**.

---

## ⚙️ Requirements

- [Node.js & npm](https://nodejs.org/)
- [PHP CLI](https://www.php.net/downloads.php)

---

## 🚀 Installation and Use

1. Open a terminal inside `screen_emulator` directory.  
2. Install dependencies:
   ```bash
   npm install
3. Put your files in `screen_emulator/projects`.
4. Whenever you make changes to the files, click the Render button.
