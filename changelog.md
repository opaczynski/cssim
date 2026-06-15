
# Changelog

Information about updates will appear here.

---

## 🐞 Known Issues
- Browser's anti-aliasing meses up monochrome filers.
- When scaling a window, if fractions occur, the window has random dimensions.

  👉 Do not set, for example, 1283px at 50% scaling.
- The algorithm that calculates the available viewport IDs sometimes gives wrong IDs.

  👉 Ignore it, or use free mode. 
- On the first application startup, the **Render** function may not work.

  👉 Simply run app again. 

---

## ⚠️ Potential Limitations

-   The application is designed for **plain CSS** only.
    Framework-based projects (React, Angular, Vue, etc.) or more advanced HTML structures may cause unexpected behavior.
-   Color-blindness filters are for illustrative purposes only.
-   Currently, there is no support for **Safari- or Firefox-exclusive media queries**.  
    (Planned in future releases.)
- Grid mode does not simulate terminals correctly. However, the media query itself will be activated.
- **Potential** differences between simulated high-contrast and real behavior.
- User scripts may conflict with my hooks. I would advise against testing scripts that dynamically modify styles.

---

## [2.1.0] - 15.06.2026
- Now CSSim is standalone! The app now uses Express, so XAMPP is no longer required.
- Some packages have been updated to ensure better compatibility.
- One value in the technical demo contained a typo. It has been corrected.

---

## [2.0.0] - 06.06.2026

### 🚀 New Features & Improvements
- **API Hooking:** - Added a robust hook for `window.matchMedia`.
- Added hooks for `navigator.userAgent` and `navigator.userAgentData` to mimic real devices.
- **Tech Demo:** Added an interactive tech demo to showcase the emulator's capabilities.
- **URL Preview:** Introduced the ability to launch and preview live websites via URL (features limited to applying filters and custom window sizes).
- **Color Blindness Simulation:** Integrated SVG filters to roughly simulate various types of color blindness.
- **Fractional Scaling:** Added support for fractional window scaling to enlarge the window (e.g., 0.5 to double the size of the window).
- **Touch Simulation:** Implemented a finger-press/touch interaction simulation. The default presets simulate the precision required when designing pages tailored to a specific audience, rather than the actual size of a finger.
- **Device Skins:** Added support for realistic device frames and skins.
- **Scripting Control:** Added a toggle to enable or entirely disable scripting (`enabled` / `none`). Previously, this property only hooked CSS.
- **Performance Optimization:** Optimized the update intervals within `media-query.js` for smoother performance.
- **Real-Time Preferences:** Added broader support for changing preferences-related media features in real-time.
- **Presettable Configurations:** Introduced presets to quickly switch between pre-defined device profiles.
- **Dynamic Range Update:** Improved `dynamic-range` logic; it now fallback-accepts `standard` even when set to `high`.
- **New Media Query Support:** Added native simulation for the `scan` media query.
- Implemented an `env()` variables hook, extending support to include 4 additional custom environment variables.
- **Fold Screen API:** Reworked the Fold Screen API simulation, which can now be dynamically toggled on/off in real-time.

### 🧹 Refactoring & Cleanups
- **Forced Colors Simulation Reworked:** The built-in high-contrast simulation was reworked. Now the styles are applied reliably, and only `!important` overrides forced-colors' styles (just like in real mode). However, JavaScript running in the background may override styles—be sure to include `forceClasses()` in your intervals before rendering.

### 🐞 Bug Fixes
- Fixed a bug where the `filter-only` parameter for monochrome mode failed to apply the visual color filter, even though the page received the correct media query data.

### 📝 Side Note
- I know a few things might be confusing at first, and I’m already working on simple guides to cover them. In the meantime, here is a quick breakdown of the less obvious points:
  - **Skins:** A skin is a transparent image—preferably in `PNG`, `WEBP`, or `AVIF` format (more formats will be supported soon)—with a cutout for the screen. To set it up, match the screen width to the skin's dimensions, then position the sidebar so that it aligns perfectly with the cutout. Note: the notch does not block user interactions yet (this is planned for future updates). Since the skin stretches to `100vw` and `100vh`, minor pixel adjustments for scaling won't break it, but keep this behavior in mind when designing sidebars.
  - **Presets:** The key values required to create presets map directly to the variables inside `emulator/preset.json`. Review that file to find what you need. You can also explore other supported values in `emulator/index.js` under the `preset.addEventListener("change", ...)` listener.
  - **SVG Filters:** While SVG filters aren't flawless right now, I am working on two smaller side-projects that will unlock capabilities beyond what standard JS can achieve. My upcoming tools will be fully tested for compatibility with CSSim.

---

## [1.1.8] - 13.05.2026

- A critical bug that prevented the program from processing files on Windows has been fixed.

Get ready—a major update is coming!

---

## [1.1.7] - 01.01.2026

- Sometimes, complex tags were rendered incorrectly. A fix has been implemented to address this issue.

---

## [1.1.6] - 24.09.2025

- Files have been optimized. Now the project takes up 440kB less disk space!
- Fixed bugs with selectors starting with ::. They caused QSA function errors, and the CSS file conversion itself was broken.
- Unnecessary console.log() statements have been removed, and the remaining ones have been translated into English.
- Iframes used to have a transparent background, so the background of the page was identical to the background of the application. Now, iframe in screen_viewport.html have a white background, so if the user has not defined a background color in CSS, the page will have a default white background.

---

## [1.1.5] - 20.09.2025

- JS used to load faster than the emulator's iframe, which caused errors with innerHeight and innerWidth. Now the page is loaded after the dimensions of window are set.

---

## [1.1.4] - 15.09.2025

- Monochrome filters has been improved. Anti-aliasing still messes up filters, but it works a little better.

---

## [1.1.3] - 09.09.2025

- Fixed bugs related to :root.
- Better comments in the code.

---

## [1.1.2] - 30.08.2025

- The “Rotate” function, which caused errors with media queries, has been removed. You must change the dimensions yourself before running the test.
- Fixed bugs related to pseudoclasses.

---

## [1.1.1] - 21.08.2025

- media-query.js has been improved to avoid conflicts with the user's page. The code has also been shortened.
- Fixed bugs related to some env().

---

## [1.1.0] - 20.08.2025

- Forced colors has been improved - CSS code is injected into the page to simulate the selected high contrast mode (based on the default filters in Windows 11 - Aquatic, Desert, Dusk and Night sky).
- Missing support for `spanning` media query has been added.

---

## [1.0.1] - 19.08.2025

- Device visualization has been improved.
- Browser selection has been locked on Chromium.

---

## [1.0.0] - 18.08.2025

- Renders CSS files and `<style>` tags.
- Supported media queries : `aspect-ratio`, `color`, `color-gamut`, `color-index`, `device-aspect-ratio`, `device-height`, `device-posture`, `device-width`, `display-mode`, `dynamic-range`, `forced-colors`, `grid`, `height`, `hover`, `inverted-colors`, `monochrome`, `orientation`, `overflow-block`, `overflow-inline`, `pointer`, `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion`, `prefers-reduced-transparency`, `resolution`, `scripting`, `update`, `width`, `-webkit-transform-3d`.
  
  The `any`, `min`, and `max` variants are also included.
- Monochrome mode activates a color filter that helps with UI design. You can choose from white, green, amber, and blue colors. In addition, you can choose 1, 2, or 4 bits, and thanks to the “filter only” mode, you can also simulate devices that do not send the appropriate information to the browser despite being monochrome, such as Kindle.
- The filter also works with inverted colors (can be combined with monochrome).
