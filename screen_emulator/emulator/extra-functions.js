function getParameter(value) {
    return getComputedStyle(document.documentElement).getPropertyValue("--emulator-" + value);
}
const nativeMatchMedia = window.matchMedia.bind(window);
const emulator = {
    viewport: {
        width: Number(getParameter("width")),
        height: Number(getParameter("height")),
    },
    orientation: getParameter("orientation"),
    resolution: getParameter("dpi"),
    color: getParameter("color"),
    color_gamut: getParameter("color-gamut"),
    color_index: getParameter("color-index"),
    forced_colors: getParameter("forced-colors"),
    forced_colors_type: getParameter("forced-colors-type"),
    inverted_colors: getParameter("inverted-colors"),
    monochrome: getParameter("monochrome"),
    dynamic_range: getParameter("dynamic-range"),
    color_scheme: getParameter("color-scheme"),
    contrast: getParameter("contrast"),
    reduced_motion: getParameter("reduced-motion"),
    reduced_transparency: getParameter("reduced-transparency"),
    update: getParameter("update"),
    scan: getParameter("scan"),
    grid: getParameter("grid"),
    display_mode: getParameter("display-mode"),
    overflow_block: getParameter("overflow-block"),
    overflow_inline: getParameter("overflow-inline"),
    webkit_transform_3d: getParameter("webkit-transform-3d"),
    scripting: getParameter("scripting"),
    pointer: getParameter("pointer"),
    hover: getParameter("hover"),
    device_width: getParameter("width"),
    device_height: getParameter("height"),
    device_posture: "continuous",
    screen_fold_posture: "flat",
    screen_fold_angle: 180,
    spanning: "",
    screen_fold_api: getParameter("screen-fold-api-max"),
    fakeUA: getParameter("fake-ua"),
    fakeUAMobile: getParameter("fake-ua-mobile"),
    fakeUAPlatform: getParameter("fake-ua-platform"),
    fakeUABrands: getParameter("fake-ua-brands"),
};
emulator.resolution = Number(emulator.resolution);
emulator.webkit_transform_3d = emulator.webkit_transform_3d === "true";
if (emulator.fakeUAMobile != "none") emulator.fakeUAMobile = emulator.fakeUAMobile === "true";
if (emulator.fakeUABrands != "none") emulator.fakeUABrands = eval("[" + emulator.fakeUABrands + "]");

//navigator.userAgent
if (emulator.fakeUA != "none")
    Object.defineProperty(navigator, "userAgent", {
        get: () => emulator.fakeUA,
        configurable: true,
    });

//navigator.userAgentData
function patchUserAgentData({ mobile = "none", platform = "none", brands = "none" } = {}) {
    const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgentData");
    if (!descriptor?.get) {
        throw new Error("navigator.userAgentData is not supported");
    }
    const originalGetter = descriptor.get;
    Object.defineProperty(Navigator.prototype, "userAgentData", {
        configurable: true,
        enumerable: true,
        get() {
            const original = originalGetter.call(this);
            return {
                ...original,
                mobile: mobile === "none" ? original.mobile : Boolean(mobile),
                platform: platform === "none" ? original.platform : String(platform),
                brands: brands === "none" ? original.brands : structuredClone(brands),

                async getHighEntropyValues(hints) {
                    const result = await original.getHighEntropyValues(hints);

                    return {
                        ...result,
                        mobile: mobile === "none" ? result.mobile : Boolean(mobile),
                        platform: platform === "none" ? result.platform : String(platform),
                        brands: brands === "none" ? original.brands : structuredClone(brands),
                        fullVersionList: brands === "none" ? result.fullVersionList : structuredClone(brands),
                    };
                },
                toJSON() {
                    return {
                        brands: brands === "none" ? original.brands : structuredClone(brands),
                        mobile: mobile === "none" ? original.mobile : Boolean(mobile),
                        platform: platform === "none" ? original.platform : String(platform),
                    };
                },
            };
        },
    });
}
patchUserAgentData({
    mobile: emulator.fakeUAMobile,
    platform: emulator.fakeUAPlatform,
    brands: emulator.fakeUABrands,
});
//matchMedia patch
window.addEventListener("resize", () => {
    emulator.width = window.innerWidth;
    emulator.device_width = window.innerWidth;
    emulator.height = window.innerHeight;
    emulator.device_height = window.innerHeight;
});
window.matchMedia = function (query) {
    try {
        const result = evaluate(query);
        if (result === null) {
            return nativeMatchMedia(query);
        }
        return createMQL(query, result);
    } catch (e) {
        return nativeMatchMedia(query);
    }
};
function evaluate(query) {
    query = query.trim().toLowerCase();
    let m;

    const dpi = Number(emulator.resolution || 96);
    const baseFontSize = 16;

    function toPx(value, unit) {
        const map = {
            px: 1,
            em: baseFontSize,
            rem: baseFontSize,
            in: dpi,
            cm: dpi / 2.54,
            mm: dpi / 25.4,
            pt: dpi / 72,
            pc: dpi / 6,
        };

        unit = unit.toLowerCase();
        if (!map[unit]) return null;

        return value * map[unit];
    }
    function resolutionToDpi(value, unit) {
        value = Number(value);

        switch (unit.toLowerCase()) {
            case "dpi":
                return value;

            case "dppx":
                return value * 96;

            case "dpcm":
                return value * 2.54;

            default:
                return null;
        }
    }
    function parseValue(raw) {
        const match = raw.match(/^([\d.]+)([a-z%]*)$/i);
        if (!match) return null;

        return {
            value: parseFloat(match[1]),
            unit: match[2] || "px",
        };
    }

    if ((m = query.match(/\(min-width:\s*([\d.]+)(\w+)?\)/))) {
        const v = parseValue(m[1] + (m[2] || "px"));
        return emulator.viewport.width >= toPx(v.value, v.unit);
    }
    if ((m = query.match(/\(max-width:\s*([\d.]+)(\w+)?\)/))) {
        const v = parseValue(m[1] + (m[2] || "px"));
        return emulator.viewport.width <= toPx(v.value, v.unit);
    }
    if ((m = query.match(/\(width:\s*([\d.]+)(\w+)?\)/))) {
        const v = parseValue(m[1] + (m[2] || "px"));
        return emulator.viewport.width === toPx(v.value, v.unit);
    }

    if ((m = query.match(/\(min-height:\s*([\d.]+)(\w+)?\)/))) {
        const v = parseValue(m[1] + (m[2] || "px"));
        return emulator.viewport.height >= toPx(v.value, v.unit);
    }
    if ((m = query.match(/\(max-height:\s*([\d.]+)(\w+)?\)/))) {
        const v = parseValue(m[1] + (m[2] || "px"));
        return emulator.viewport.height <= toPx(v.value, v.unit);
    }
    if ((m = query.match(/\(height:\s*([\d.]+)(\w+)?\)/))) {
        const v = parseValue(m[1] + (m[2] || "px"));
        return emulator.viewport.height === toPx(v.value, v.unit);
    }

    if ((m = query.match(/\(min-resolution:\s*([\d.]+)\s*(dpi|dppx|dpcm)\)/i))) {
        const requested = resolutionToDpi(m[1], m[2]);
        return Number(emulator.resolution) >= requested;
    }
    if ((m = query.match(/\(max-resolution:\s*([\d.]+)\s*(dpi|dppx|dpcm)\)/i))) {
        const requested = resolutionToDpi(m[1], m[2]);
        return Number(emulator.resolution) <= requested;
    }
    if ((m = query.match(/\(resolution:\s*([\d.]+)\s*(dpi|dppx|dpcm)\)/i))) {
        const requested = resolutionToDpi(m[1], m[2]);
        return Number(emulator.resolution) === requested;
    }

    if ((m = query.match(/\(orientation:\s*(portrait|landscape)\)/))) {
        return emulator.orientation === m[1];
    }

    if ((m = query.match(/\(pointer:\s*(none|coarse|fine)\)/))) {
        const firstParam = emulator.pointer.split("_")[0];
        return emulator.pointer === m[1] || firstParam === m[1];
    }
    if ((m = query.match(/\(hover:\s*(none|hover)\)/))) {
        const firstParam = emulator.hover.split("_")[0];
        return emulator.hover === m[1] || firstParam === m[1];
    }
    if ((m = query.match(/\(any-pointer:\s*(none|coarse|fine)\)/))) {
        return emulator.pointer.includes(m[1]);
    }
    if ((m = query.match(/\(any-hover:\s*(none|hover)\)/))) {
        return emulator.hover.includes(m[1]);
    }

    if ((m = query.match(/\(min-color:\s*(\d+)\)/))) {
        return Number(emulator.color) >= Number(m[1]);
    }
    if ((m = query.match(/\(max-color:\s*(\d+)\)/))) {
        return Number(emulator.color) <= Number(m[1]);
    }
    if ((m = query.match(/\(color:\s*(\d+)\)/))) {
        return Number(emulator.color) === Number(m[1]);
    }

    if ((m = query.match(/\(min-color-index:\s*(\d+)\)/))) {
        return Number(emulator.color_index) >= Number(m[1]);
    }
    if ((m = query.match(/\(max-color-index:\s*(\d+)\)/))) {
        return Number(emulator.color_index) <= Number(m[1]);
    }
    if ((m = query.match(/\(color-index:\s*(\d+)\)/))) {
        return Number(emulator.color_index) === Number(m[1]);
    }

    if ((m = query.match(/\(min-monochrome:\s*(\d+)\)/))) {
        return Number(emulator.monochrome) >= Number(m[1]);
    }
    if ((m = query.match(/\(max-monochrome:\s*(\d+)\)/))) {
        return Number(emulator.monochrome) <= Number(m[1]);
    }
    if ((m = query.match(/\(monochrome:\s*(\d+)\)/))) {
        return Number(emulator.monochrome) === Number(m[1]);
    }
    if ((m = query.match(/\(dynamic-range:\s*(high|standard)\)/))) {
        const actual = emulator.dynamic_range;
        const requested = m[1];
        return requested === "standard" || actual === "high";
    }

    const enumFeatures = {
        "color-gamut": emulator.color_gamut,
        "forced-colors": emulator.forced_colors,
        "inverted-colors": emulator.inverted_colors,
        "prefers-color-scheme": emulator.color_scheme,
        "prefers-contrast": emulator.contrast,
        "prefers-reduced-motion": emulator.reduced_motion,
        "prefers-reduced-transparency": emulator.reduced_transparency,
        update: emulator.update,
        scan: emulator.scan,
        "display-mode": emulator.display_mode,
        "overflow-block": emulator.overflow_block,
        "overflow-inline": emulator.overflow_inline,
        scripting: emulator.scripting,
    };

    for (const [feature, value] of Object.entries(enumFeatures)) {
        const regex = new RegExp(`\\(${feature}:\\s*([^\\)]+)\\)`);
        if ((m = query.match(regex))) {
            return value === m[1].trim();
        }
    }

    const vw = emulator.viewport.width;
    const vh = emulator.viewport.height;
    const aspect = vw / vh;
    const ratio = (a, b) => a / b;
    if ((m = query.match(/\(aspect-ratio:\s*(\d+)\/(\d+)\)/))) {
        return aspect === ratio(+m[1], +m[2]);
    }
    if ((m = query.match(/\(min-aspect-ratio:\s*(\d+)\/(\d+)\)/))) {
        return aspect >= ratio(+m[1], +m[2]);
    }
    if ((m = query.match(/\(max-aspect-ratio:\s*(\d+)\/(\d+)\)/))) {
        return aspect <= ratio(+m[1], +m[2]);
    }

    const dw = emulator.device_width;
    const dh = emulator.device_height;
    if ((m = query.match(/\(device-width:\s*(\d+)\)/))) {
        return dw === Number(m[1]);
    }

    if ((m = query.match(/\(min-device-width:\s*(\d+)\)/))) {
        return dw >= Number(m[1]);
    }
    if ((m = query.match(/\(max-device-width:\s*(\d+)\)/))) {
        return dw <= Number(m[1]);
    }
    if ((m = query.match(/\(device-height:\s*(\d+)\)/))) {
        return dh === Number(m[1]);
    }
    if ((m = query.match(/\(min-device-height:\s*(\d+)\)/))) {
        return dh >= Number(m[1]);
    }
    if ((m = query.match(/\(max-device-height:\s*(\d+)\)/))) {
        return dh <= Number(m[1]);
    }

    const deviceAspect = dw / dh;
    if ((m = query.match(/\(device-aspect-ratio:\s*(\d+)\/(\d+)\)/))) {
        return deviceAspect === ratio(+m[1], +m[2]);
    }

    if ((m = query.match(/\(min-device-aspect-ratio:\s*(\d+)\/(\d+)\)/))) {
        return deviceAspect >= ratio(+m[1], +m[2]);
    }
    if ((m = query.match(/\(max-device-aspect-ratio:\s*(\d+)\/(\d+)\)/))) {
        return deviceAspect <= ratio(+m[1], +m[2]);
    }
    if ((m = query.match(/\(device-posture:\s*(folded|continuous)\)/))) {
        return emulator.screen_fold_api !== 0 && emulator.device_posture === m[1];
    }

    if ((m = query.match(/\(screen-fold-posture:\s*(book|laptop|flat|tent|tablet)\)/))) {
        return emulator.screen_fold_api !== 0 && emulator.screen_fold_posture === m[1];
    }
    if ((m = query.match(/\(screen-fold-angle:\s*([\d.]+)(deg)?\)/))) {
        return emulator.screen_fold_api !== 0 && emulator.screen_fold_angle === Number(m[1]);
    }
    if ((m = query.match(/\(min-screen-fold-angle:\s*([\d.]+)(deg)?\)/))) {
        return emulator.screen_fold_api !== 0 && emulator.screen_fold_angle >= Number(m[1]);
    }
    if ((m = query.match(/\(max-screen-fold-angle:\s*([\d.]+)(deg)?\)/))) {
        return emulator.screen_fold_api !== 0 && emulator.screen_fold_angle <= Number(m[1]);
    }

    if (query === "(grid)") {
        return Number(emulator.grid) > 0;
    }
    if (query === "(-webkit-transform-3d)") {
        return !!emulator.webkit_transform_3d;
    }

    return null;
}
function createMQL(query, matches) {
    return {
        media: query,
        matches,
        onchange: null,

        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},

        dispatchEvent() {
            return false;
        },
    };
}

//scripting
if (getParameter("scripting") == "none") {
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = `script-src http://localhost:3000/emulator/media-query.js http://localhost:3000/emulator/extra-functions.js`;
    document.head.prepend(meta);
}

//Finger area
function emulator_get_elements_in_radius(x, y, radius) {
    return [...document.querySelectorAll("*")].filter((el) => {
        const rect = el.getBoundingClientRect();
        return emulator_intersects_circle(rect, x, y, radius);
    });
}
function emulator_intersects_circle(rect, cx, cy, radius) {
    const closestX = Math.max(rect.left, Math.min(cx, rect.right));
    const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
}

function emulator_create_finger_area(size) {
    document.querySelector("body").innerHTML += '<div id="emulator_finger_simulation"></div>';
    const emulator_finger_position = document.getElementById("emulator_finger_simulation");
    emulator_finger_position.style.setProperty("width", size + "px", "important");
    let blur = Math.round(0.02 * size);
    emulator_finger_position.style.setProperty("backdrop-filter", "blur(" + blur + "px)", "important");
    emulator_finger_position.style.setProperty("webkit-backdrop-filter", "blur(" + blur + "px)", "important");
    document.addEventListener("mousedown", (e) => {
        const el = emulator_finger_position;
        el.style.setProperty("left", e.clientX + "px", "important");
        el.style.setProperty("top", e.clientY + "px", "important");
        const size = el.offsetWidth;
        emulator_get_elements_in_radius(e.clientX, e.clientY, Math.round(size / 2)).forEach((el) => el.click());
        el.animate(
            [
                {
                    transform: "translate(-50%, -50%) scale(0)",
                    opacity: 0,
                },
                {
                    transform: "translate(-50%, -50%) scale(1)",
                    opacity: 1.0,
                    offset: 0.7,
                },
                {
                    transform: "translate(-50%, -50%) scale(0)",
                    opacity: 0,
                },
            ],
            {
                duration: 650,
                easing: "cubic-bezier(.2,.8,.2,1)",
                fill: "forwards",
            },
        );
    });
}
function forceClasses(type = emulator.forced_colors_type) {
    function applyOverrideStyle(element, property, value) {
        let hasImportant = false;
        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const sheet = document.styleSheets[i];
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) continue;
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    if (rule.selectorText && element.matches(rule.selectorText)) {
                        if (rule.style && rule.style.getPropertyPriority(property) === "important") {
                            hasImportant = true;
                            break;
                        }
                    }
                }
            } catch (e) {}
            if (hasImportant) break;
        }
        if (!hasImportant) {
            element.style.setProperty(property, value, "important");
        }
    }
    if (type === "aquatic") {
        document.querySelectorAll("*").forEach((el) => {
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgba(32, 32, 32, 0)");
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-left-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 255, 255)");
        });
        const mainGroup = "a, button, dialog, input, select, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(mainGroup).forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-left-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
        });
        const transparentBgGroup = "a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(transparentBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgba(32, 32, 32, 0)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "column-rule-color", "rgb(0, 0, 0)");
        });
        const interactiveGroup = "button, dialog, input, select";
        document.querySelectorAll(interactiveGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "column-rule-color", "rgb(255, 255, 255)");
        });
        const resetsGroup = "fieldset, mark";
        document.querySelectorAll(resetsGroup).forEach((el) => {
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
        });
        document.querySelectorAll("fieldset").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-left-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-right-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-top-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
        });
        document.querySelectorAll("mark").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgb(255, 255, 0)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-left-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-right-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-top-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "outline-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "column-rule-color", "rgb(0, 0, 0)");
        });
        if (document.body) {
            applyOverrideStyle(document.body, "background-color", "rgb(32, 32, 32)");
        }
    } else if (type === "desert") {
        document.querySelectorAll("*").forEach((el) => {
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgba(255, 250, 239, 0)");
            applyOverrideStyle(el, "color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "outline-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-left-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-right-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-top-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(61, 61, 61)");
        });
        const mainGroup = "a, button, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, mark, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr, dialog, input, select";
        document.querySelectorAll(mainGroup).forEach((el) => {
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
        });
        const darkGrayTextGroup = "a, input, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, fieldset, div, dl, dt, em, embed, select, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(darkGrayTextGroup).forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "outline-color", "rgb(61, 61, 61)");
        });
        const darkGrayBorderGroup = "a, dialog, select, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(darkGrayBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-right-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-top-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(61, 61, 61)");
        });
        const blackDecorationGroup = "a, mark, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(blackDecorationGroup).forEach((el) => {
            applyOverrideStyle(el, "text-decoration-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "column-rule-color", "rgb(0, 0, 0)");
        });
        const transparentSandBgGroup = "a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(transparentSandBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgba(255, 250, 239, 0)");
        });
        const solidSandBgGroup = "button, dialog, select";
        document.querySelectorAll(solidSandBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(255, 250, 239)");
        });
        const formDecorationGroup = "dialog, input, select";
        document.querySelectorAll(formDecorationGroup).forEach((el) => {
            applyOverrideStyle(el, "text-decoration-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(61, 61, 61)");
            applyOverrideStyle(el, "column-rule-color", "rgb(61, 61, 61)");
        });
        const darkBorderGroup = "button, input";
        document.querySelectorAll(darkBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-right-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-top-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(32, 32, 32)");
        });
        document.querySelectorAll("button").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "outline-color", "rgb(32, 32, 32)");
            applyOverrideStyle(el, "column-rule-color", "rgb(32, 32, 32)");
        });
        document.querySelectorAll("fieldset").forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 250, 239)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 250, 239)");
        });
        document.querySelectorAll("input").forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(255, 250, 239)");
        });
        document.querySelectorAll("mark").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgb(255, 255, 0)");
            applyOverrideStyle(el, "border-left-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-right-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-top-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "outline-color", "rgb(0, 0, 0)");
        });
        if (document.body) {
            applyOverrideStyle(document.body, "background-color", "rgb(255, 250, 239)");
        }
    } else if (type === "dusk") {
        document.querySelectorAll("*").forEach((el) => {
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgba(45, 50, 54, 0)");
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-left-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 255, 255)");
        });
        const mainGroup = "a, button, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, mark, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr, dialog, input, select";
        document.querySelectorAll(mainGroup).forEach((el) => {
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
        });
        const whiteTextGroup = "a, input, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, fieldset, div, dl, dt, em, embed, select, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(whiteTextGroup).forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
        });
        const whiteBorderGroup = "a, dialog, select, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(whiteBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 255, 255)");
        });
        const blackDecorationGroup = "a, mark, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(blackDecorationGroup).forEach((el) => {
            applyOverrideStyle(el, "text-decoration-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "column-rule-color", "rgb(0, 0, 0)");
        });
        const transparentBgGroup = "a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(transparentBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgba(45, 50, 54, 0)");
        });
        const solidBgGroup = "button, dialog, select";
        document.querySelectorAll(solidBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(45, 50, 54)");
        });
        const formDecorationGroup = "dialog, input, select";
        document.querySelectorAll(formDecorationGroup).forEach((el) => {
            applyOverrideStyle(el, "text-decoration-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "column-rule-color", "rgb(255, 255, 255)");
        });
        const cyanBorderGroup = "button, input";
        document.querySelectorAll(cyanBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-right-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-top-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(182, 246, 240)");
        });
        document.querySelectorAll("button").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "outline-color", "rgb(182, 246, 240)");
            applyOverrideStyle(el, "column-rule-color", "rgb(182, 246, 240)");
        });
        document.querySelectorAll("fieldset").forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-right-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-top-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(45, 50, 54)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(45, 50, 54)");
        });
        document.querySelectorAll("input").forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(45, 50, 54)");
        });
        document.querySelectorAll("mark").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgb(255, 255, 0)");
            applyOverrideStyle(el, "border-left-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-right-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-top-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "outline-color", "rgb(0, 0, 0)");
        });
        if (document.body) {
            applyOverrideStyle(document.body, "background-color", "rgb(45, 50, 54)");
        }
    } else if (type === "night_sky") {
        document.querySelectorAll("*").forEach((el) => {
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgba(0, 0, 0, 0)");
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-left-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 255, 255)");
        });
        const mainGroup = "a, button, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, mark, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr, dialog, input, select";
        document.querySelectorAll(mainGroup).forEach((el) => {
            applyOverrideStyle(el, "-webkit-tap-highlight-color", "rgba(0, 0, 0, 0.18)");
            applyOverrideStyle(el, "fill", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "stroke", "none");
            applyOverrideStyle(el, "box-shadow", "none");
            applyOverrideStyle(el, "text-shadow", "none");
            applyOverrideStyle(el, "background-image", "none");
            applyOverrideStyle(el, "scrollbar-color", "auto");
        });
        const whiteTextGroup = "a, input, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, fieldset, div, dl, dt, em, embed, select, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(whiteTextGroup).forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 255, 255)");
        });
        const whiteBorderGroup = "a, dialog, select, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(whiteBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 255, 255)");
        });
        const transparentBgGroup = "a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, ins, kbd, label, legend, li, link, main, map, math, menu, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, picture, pre, progress, q, rp, rt, ruby, s, samp, script, search, section, selectedcontent, slot, small, source, span, strong, style, sub, summary, sup, svg, table, tbody, track, wbr";
        document.querySelectorAll(transparentBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgba(0, 0, 0, 0)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "column-rule-color", "rgb(0, 0, 0)");
        });
        const solidBlackBgGroup = "button, dialog, select";
        document.querySelectorAll(solidBlackBgGroup).forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(0, 0, 0)");
        });
        const formDecorationGroup = "dialog, input, select";
        document.querySelectorAll(formDecorationGroup).forEach((el) => {
            applyOverrideStyle(el, "text-decoration-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(255, 255, 255)");
            applyOverrideStyle(el, "column-rule-color", "rgb(255, 255, 255)");
        });
        const yellowBorderGroup = "button, input";
        document.querySelectorAll(yellowBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-right-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-top-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(255, 238, 50)");
        });
        const blackBorderGroup = "fieldset, mark";
        document.querySelectorAll(blackBorderGroup).forEach((el) => {
            applyOverrideStyle(el, "border-left-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-right-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-top-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-bottom-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-inline-end-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-start-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "border-block-end-color", "rgb(0, 0, 0)");
        });
        document.querySelectorAll("button").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "outline-color", "rgb(255, 238, 50)");
            applyOverrideStyle(el, "column-rule-color", "rgb(255, 238, 50)");
        });
        document.querySelectorAll("input").forEach((el) => {
            applyOverrideStyle(el, "background-color", "rgb(0, 0, 0)");
        });
        document.querySelectorAll("mark").forEach((el) => {
            applyOverrideStyle(el, "color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "background-color", "rgb(255, 255, 0)");
            applyOverrideStyle(el, "text-decoration-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "text-emphasis-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "outline-color", "rgb(0, 0, 0)");
            applyOverrideStyle(el, "column-rule-color", "rgb(0, 0, 0)");
        });
        if (document.body) {
            applyOverrideStyle(document.body, "background-color", "rgb(0, 0, 0)");
        }
    }
}
