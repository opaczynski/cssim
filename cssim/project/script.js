function bold(element, media) {
  el = document.getElementById(element);
  if (matchMedia("(" + media + ")").matches) {
    el.style.fontWeight = "bold";
  }
}
document.getElementById("scripts").innerHTML = "Scripts are enabled.";
document.getElementById("width").innerHTML = window.innerWidth + "px";
document.getElementById("height").innerHTML = window.innerHeight + "px";
bold("dpi", "resolution: 2dppx");
bold("color", "color: 1");
bold("color-gamut", "color-gamut: rec2020");
bold("color-index", "color-index: 1500");
bold("forced-colors", "forced-colors: active");
bold("inverted-colors", "inverted-colors: inverted");
bold("dynamic-range", "dynamic-range: high");
bold("color-scheme", "prefers-color-scheme: dark");
bold("contrast", "prefers-contrast: more");
bold("reduced-motion", "prefers-reduced-motion: reduce");
bold("reduced-transparency", "prefers-reduced-transparency: reduce");
bold("update", "update: slow");
bold("scan", "scan: interlace");
bold("grid", "grid: 1");
bold("display-mode", "display-mode: standalone");
bold("overflow-block", "overflow-block: scroll");
bold("overflow-inline", "overflow-inline: none");
bold("transform-3d", "-webkit-transform-3d");
bold("scripting", "scripting: initial-only");
bold("pointer", "pointer: coarse");
bold("hover", "hover: hover");

safe_area = document.getElementById("safe-area-visual");
titlebar = document.getElementById("titlebar-visual");
keyboard = document.getElementById("keyboard-visual");
display = 0;
function showEnvSims() {
  if (display == 1) {
    display = 0;
    safe_area.style.display = "none";
    titlebar.style.display = "none";
    keyboard.style.display = "none";
  } else {
    display = 1;
    safe_area.style.display = "flex";
    titlebar.style.display = "flex";
    keyboard.style.display = "flex";
  }
}

setInterval(() => {
  document.getElementById("ua").innerHTML = navigator.userAgent;
  if (navigator.userAgentData.mobile) {
    document.getElementById("ua_mobile").innerHTML = "true";
  }
  document.getElementById("ua_platform").innerHTML =
    navigator.userAgentData.platform;
  const brandsList = navigator.userAgentData.brands.map((el) => {
    return `brand: ${el.brand}, version: ${el.version}`;
  });
  document.getElementById("ua_brands").innerHTML = brandsList.join("<br>");
}, 100);
