(function () {
  "use strict";
  if (window.__matrixAdvancedModsLoaded) return;
  window.__matrixAdvancedModsLoaded = true;

  const PREFIX = "matrix.celestar.";
  function readValue(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }
  function writeValue(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) {}
  }

  // Tampermonkey-compatible persistence bridge for the bundled Celestar menu.
  window.GM_getValue = window.GM_getValue || readValue;
  window.GM_setValue = window.GM_setValue || writeValue;

  let running = false;
  function open() {
    if (window.__matrixCelestarMenu) window.__matrixCelestarMenu.open();
  }
  function close() {
    if (window.__matrixCelestarMenu) window.__matrixCelestarMenu.close();
  }
  function toggle() {
    if (window.__matrixCelestarMenu) window.__matrixCelestarMenu.toggle();
  }

  window.__matrixAdvancedMods = {
    enable() { running = true; open(); return { ok: true, enabled: true }; },
    disable() { running = false; close(); return { ok: true, enabled: false }; },
    open,
    close,
    toggle,
    isEnabled: () => running,
  };
})();
