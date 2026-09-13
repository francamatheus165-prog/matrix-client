(function () {
  "use strict";
  if (window.__matrixExtraModsLoaded) return;
  window.__matrixExtraModsLoaded = true;

  const state = {
    clean: false,
    smooth: false,
    smoothness: 0.02,
    hidden: [],
    observer: null,
    tx: 0,
    ty: 0,
    inputHandler: null,
  };

  let lastGamePointer = false;

  function getGameCanvas() {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    return canvases.find(c => c.id === "game") || canvases.find(c => c.width > 100 && c.height > 100) || canvases[0] || null;
  }

  function isMatrixMenuOpen() {
    const menu = document.getElementById("matrix-menu");
    return !!(menu && (menu.classList.contains("open") || getComputedStyle(menu).display !== "none"));
  }

  function isTyping() {
    const el = document.activeElement;
    return !!(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
  }

  function isGameContext() {
    if (isMatrixMenuOpen() || isTyping()) return false;
    const canvas = getGameCanvas();
    if (!canvas) return false;
    if (document.pointerLockElement === canvas) return true;
    if (document.activeElement === canvas) return true;
    return lastGamePointer;
  }

  function addStyle() {
    if (document.getElementById("matrix-extra-mods-style")) return;
    const s = document.createElement("style");
    s.id = "matrix-extra-mods-style";
    s.textContent = `.matrix-clean-hidden{display:none!important;visibility:hidden!important;opacity:0!important}`;
    (document.head || document.documentElement).appendChild(s);
  }

  function cleanTargets() {
    const out = [];
    if (!document.body) return out;
    const nodes = document.body.querySelectorAll("body > *, body [class], body [id]");
    for (const el of nodes) {
      if (!(el instanceof Element)) continue;
      if (el.closest("#matrix-menu,#matrix-root,#__matrix_root,#matrix-options-panel,#matrix-mmmd-panel,#matrix-settings-panel")) continue;
      if (el.id === "minefun-fps-counter" || el.tagName === "CANVAS" || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      const st = getComputedStyle(el);
      if ((st.position === "fixed" || st.position === "absolute" || Number(st.zIndex) > 0) && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0) {
        if (!el.querySelector("canvas")) out.push(el);
      }
    }
    return Array.from(new Set(out));
  }

  function applyClean(on) {
    addStyle();
    state.clean = !!on;
    if (on) {
      state.hidden = cleanTargets();
      state.hidden.forEach(el => el.classList.add("matrix-clean-hidden"));
      if (!state.observer) {
        state.observer = new MutationObserver(() => {
          if (!state.clean) return;
          cleanTargets().forEach(el => { el.classList.add("matrix-clean-hidden"); if (!state.hidden.includes(el)) state.hidden.push(el); });
        });
        state.observer.observe(document.body, { childList: true, subtree: true });
      }
    } else {
      if (state.observer) { state.observer.disconnect(); state.observer = null; }
      state.hidden.forEach(el => el.classList.remove("matrix-clean-hidden"));
      state.hidden = [];
    }
  }

  function patchSmooth(on) {
    state.smooth = !!on;
    if (state.smooth && !state.inputHandler) {
      state.inputHandler = e => {
        if (!state.smooth || !e.isTrusted) return;
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
        state.tx += Number(e.movementX || 0);
        state.ty += Number(e.movementY || 0);
        try {
          Object.defineProperty(e, "movementX", { value: 0, configurable: true });
          Object.defineProperty(e, "movementY", { value: 0, configurable: true });
        } catch (_) {}
      };
      window.addEventListener("mousemove", state.inputHandler, true);
      window.addEventListener("pointermove", state.inputHandler, true);
    }
    if (!state.smooth && state.inputHandler) {
      window.removeEventListener("mousemove", state.inputHandler, true);
      window.removeEventListener("pointermove", state.inputHandler, true);
      state.inputHandler = null;
      state.tx = state.ty = 0;
    }
  }

  function smoothFrame() {
    if (state.smooth && (Math.abs(state.tx) > 0.01 || Math.abs(state.ty) > 0.01)) {
      const dx = state.tx * state.smoothness;
      const dy = state.ty * state.smoothness;
      state.tx -= dx; state.ty -= dy;
      const canvas = document.querySelector("canvas");
      const targets = [window, document, canvas].filter(Boolean);
      const props = { bubbles: true, cancelable: true, composed: true, view: window };
      for (const target of targets) {
        try {
          const p = new PointerEvent("pointermove", props);
          Object.defineProperty(p, "movementX", { value: dx, configurable: true });
          Object.defineProperty(p, "movementY", { value: dy, configurable: true });
          target.dispatchEvent(p);
          const m = new MouseEvent("mousemove", props);
          Object.defineProperty(m, "movementX", { value: dx, configurable: true });
          Object.defineProperty(m, "movementY", { value: dy, configurable: true });
          target.dispatchEvent(m);
        } catch (_) {}
      }
    }
    requestAnimationFrame(smoothFrame);
  }

  function toggleCinematic(on) {
    // Reuse the Matrix Visual Lab's stable cinematic preset when available.
    const v = window.__matrixVisualMods;
    if (!v) return false;
    v.setShaderMode(on ? "cinematic" : "none");
    return true;
  }

  document.addEventListener("pointermove", function (e) {
    const canvas = getGameCanvas();
    if (!canvas) { lastGamePointer = false; return; }
    const r = canvas.getBoundingClientRect();
    lastGamePointer = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }, true);

  document.addEventListener("pointerdown", function (e) {
    const canvas = getGameCanvas();
    if (canvas && (e.target === canvas || canvas.contains(e.target))) lastGamePointer = true;
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (String(e.key).toLowerCase() !== "h") return;
    if (!isGameContext()) return;
    e.preventDefault();
    e.stopPropagation();
    applyClean(!state.clean);
  }, true);

  window.__matrixExtraMods = {
    setCleanScreen: applyClean,
    setSmoothCamera: patchSmooth,
    setCinematic: toggleCinematic,
    getState: () => ({ clean: state.clean, smooth: state.smooth, smoothness: state.smoothness }),
    setSmoothness: value => { state.smoothness = Math.max(0.001, Math.min(0.2, Number(value) || 0.02)); }
  };

  addStyle();
  requestAnimationFrame(smoothFrame);
})();
