(function () {
  "use strict";

  const { ipcRenderer } = require("electron");

  window.electronAPI = {
    getSettings: () => ipcRenderer.invoke("get-settings"),
    setSetting: (key, val) => ipcRenderer.invoke("set-setting", key, val),
    onSettingChanged: (cb) =>
      ipcRenderer.on("setting-changed", (_, k, v) => cb(k, v)),
    switchSite: (sandbox) => ipcRenderer.invoke("switch-site", sandbox),
    getCurrentURL: () => ipcRenderer.invoke("get-current-url"),
    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    importStartupVideo: () => ipcRenderer.invoke("import-startup-video"),
    resetStartupVideo: () => ipcRenderer.invoke("reset-startup-video"),
    getOnlineOpenings: () => ipcRenderer.invoke("get-online-openings"),
    loadTexturePack: (path) => ipcRenderer.invoke("load-texture-pack", path),
    resetTexturePack: () => ipcRenderer.invoke("reset-texture-pack"),
    restartClient: () => ipcRenderer.invoke("restart-client"),
    launchUpdater: () => ipcRenderer.invoke("launch-updater"),
    toggleMinecraftPack: () => ipcRenderer.invoke("toggle-minecraft-pack"),
    getBuiltinTexturePacks: () => ipcRenderer.invoke("get-builtin-texture-packs"),
    loadBuiltinTexturePack: (id) => ipcRenderer.invoke("load-builtin-texture-pack", id),
    toggleAdvancedMods: () => ipcRenderer.invoke("toggle-advanced-mods"),
  };

  window.__mfSettings = {
    zoom: false,
    zoomLevel: 0.35,
    zoomHeld: false,
    zoomKeybind: "KeyV",
    adblocker: false,
    crosshair: false,
    crosshairURL: "",
    crosshairSize: 32,
    crosshairOpacity: 1.0,
    textures: false,
    texturesPack: {},
    keystrokes: false,
    keystrokesShowCPS: true,
    keystrokesShadow: true,
    keystrokesBorder: false,
    keystrokesBorderWidth: 1,
    keystrokesBorderColor: "#ffffff",
    keystrokesScale: 1.0,
    keystrokesX: 20,
    keystrokesY: 40,
    keystrokesBg: "#00000088",
    keystrokesBgPress: "#ffffff",
    keystrokesText: "#ffffff",
    keystrokesTextPress: "#000000",
    translation: false,
    translationLang: "pt",
    hub: false,
    cleanScreen: false,
    smoothCamera: false,
    cinematicFX: false,
    mouseTrail: false,
    stopwatch: false,
    displayEnhancer: false,
    visualKeyboard: false,
    fpsCounter: false,
  };

  ipcRenderer.on("setting-changed", (_, key, value) => {
    if (key === "zoom.enabled") window.__mfSettings.zoom = !!value;
    if (key === "zoom.level") window.__mfSettings.zoomLevel = value;
    if (key === "zoom.keybind") window.__mfSettings.zoomKeybind = value;
    if (key === "adblocker.enabled") window.__mfSettings.adblocker = !!value;
    if (key === "crosshair.enabled") window.__mfSettings.crosshair = !!value;
    if (key === "crosshair.url") window.__mfSettings.crosshairURL = value;
    if (key === "crosshair.size") window.__mfSettings.crosshairSize = value;
    if (key === "crosshair.opacity")
      window.__mfSettings.crosshairOpacity = value;
    if (key === "textures.enabled") window.__mfSettings.textures = !!value;
    if (key === "textures.pack") {
      window.__mfSettings.texturesPack = value;
    }
    if (key === "keystrokes.enabled") {
      window.__mfSettings.keystrokes = !!value;
      applyKeystrokes();
    }
    if (key === "keystrokes.showCPS") {
      window.__mfSettings.keystrokesShowCPS = !!value;
      applyKeystrokes();
    }
    if (key === "keystrokes.shadow") {
      window.__mfSettings.keystrokesShadow = !!value;
      applyKeystrokes();
    }
    if (key === "keystrokes.border") {
      window.__mfSettings.keystrokesBorder = !!value;
      applyKeystrokes();
    }
    if (key === "keystrokes.borderWidth") {
      window.__mfSettings.keystrokesBorderWidth = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.borderColor") {
      window.__mfSettings.keystrokesBorderColor = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.scale") {
      window.__mfSettings.keystrokesScale = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.x") {
      window.__mfSettings.keystrokesX = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.y") {
      window.__mfSettings.keystrokesY = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.bgColor") {
      window.__mfSettings.keystrokesBg = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.bgPressColor") {
      window.__mfSettings.keystrokesBgPress = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.textColor") {
      window.__mfSettings.keystrokesText = value;
      applyKeystrokes();
    }
    if (key === "keystrokes.textPressColor") {
      window.__mfSettings.keystrokesTextPress = value;
      applyKeystrokes();
    }

    if (key === "mouse-trail.enabled") window.__mfSettings.mouseTrail = !!value;
    if (key === "stopwatch.enabled") window.__mfSettings.stopwatch = !!value;
    if (key === "display-enhancer.enabled") window.__mfSettings.displayEnhancer = !!value;
    if (key === "visual-keyboard.enabled") window.__mfSettings.visualKeyboard = !!value;
    if (key === "fps-counter.enabled") window.__mfSettings.fpsCounter = !!value;

    if (key === "translation.enabled") {
      window.__mfSettings.translation = !!value;
      if (window.__matrixSetTranslation) window.__matrixSetTranslation(!!value, window.__mfSettings.translationLang || "pt");
    }
    if (key === "translation.lang") {
      window.__mfSettings.translationLang = value || "pt";
      if (window.__matrixSetTranslation) window.__matrixSetTranslation(!!window.__mfSettings.translation, window.__mfSettings.translationLang);
    }
    if (key === "hub.enabled") {
      window.__mfSettings.hub = !!value;
      if (window.__matrixSetHub) window.__matrixSetHub(!!value);
    }
    if (key === "clean-screen.enabled") { window.__mfSettings.cleanScreen = !!value; if (window.__matrixExtraMods) window.__matrixExtraMods.setCleanScreen(!!value); }
    if (key === "smooth-camera.enabled") { window.__mfSettings.smoothCamera = !!value; if (window.__matrixExtraMods) window.__matrixExtraMods.setSmoothCamera(!!value); }
    if (key === "cinematic-fx.enabled") { window.__mfSettings.cinematicFX = !!value; if (window.__matrixExtraMods) window.__matrixExtraMods.setCinematic(!!value); }
    if (key.startsWith("crosshair.")) applyCrosshair();
  });

  const _getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attribs) {
    const ctx = _getContext.call(this, type, attribs);
    if ((type === "webgl2" || type === "webgl") && this.id === "game") {
      window.__mfGL = ctx;
      patchGL(ctx);
    }
    return ctx;
  };

  function patchGL(gl) {
    let currentProgram = null;
    const projectionState = new Map();

    const _useProgram = gl.useProgram.bind(gl);
    gl.useProgram = function (program) {
      currentProgram = program;
      return _useProgram(program);
    };

    const _u4fv = gl.uniformMatrix4fv.bind(gl);
    gl.uniformMatrix4fv = function (location, transpose, value) {
      if (
        value instanceof Float32Array &&
        value.length === 16 &&
        value[15] === 0 &&
        value[11] === -1 &&
        value[0] > 0.1 &&
        value[5] > 0.1 &&
        currentProgram
      ) {
        projectionState.set(currentProgram, {
          location,
          transpose,
          original: new Float32Array(value),
        });
        if (window.__mfSettings.zoom && window.__mfSettings.zoomHeld) {
          return _u4fv(location, transpose, zoomed(value));
        }
      }
      return _u4fv(location, transpose, value);
    };

    function zoomed(m) {
      const f = 1 / window.__mfSettings.zoomLevel;
      const out = new Float32Array(m);
      out[0] *= f;
      out[5] *= f;
      return out;
    }

    let lastActive = false;

    function loop() {
      const active = window.__mfSettings.zoom && window.__mfSettings.zoomHeld;
      if (active !== lastActive) {
        const saved = currentProgram;
        for (const [prog, state] of projectionState) {
          _useProgram(prog);
          _u4fv(
            state.location,
            state.transpose,
            active ? zoomed(state.original) : state.original,
          );
        }
        if (saved) _useProgram(saved);
        lastActive = active;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  (function () {
    function isGameActive() {
      return !document.querySelector(".home");
    }

    function overrideURL(url) {
      const pack = window.__mfSettings && window.__mfSettings.texturesPack;
      if (!pack || !window.__mfSettings.textures) return url;

      for (const key in pack) {
        if (url.includes(key)) {
          return pack[key];
        }
      }
      return url;
    }

    const imgSrcDesc = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );

    Object.defineProperty(HTMLImageElement.prototype, "src", {
      set(value) {
        if (isGameActive()) {
          value = overrideURL(value);
        }
        return imgSrcDesc.set.call(this, value);
      },
      get() {
        return imgSrcDesc.get.call(this);
      },
      configurable: true,
    });

    Object.defineProperty(HTMLImageElement.prototype, "src", {
    set(value) {
        if (typeof value === "string" && isGameActive()) {
            value = overrideURL(value);
        }
        return imgSrcDesc.set.call(this, value);
    },
    get() {
        return imgSrcDesc.get.call(this);
    },
    configurable: true,
});

    const _origSetProp = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (
      name,
      value,
      priority,
    ) {
      if (
        typeof value === "string" &&
        value &&
        value.includes("url(") &&
        isGameActive()
      ) {
        const pack = window.__mfSettings && window.__mfSettings.texturesPack;
        if (pack && window.__mfSettings.textures) {
          for (const key in pack) {
            if (value.includes(key)) {
              value = `url("${pack[key]}")`;
              break;
            }
          }
        }
      }
      return _origSetProp.call(this, name, value, priority);
    };
  })();

  document.addEventListener("keydown", (e) => {
    if (e.code === window.__mfSettings.zoomKeybind)
      window.__mfSettings.zoomHeld = true;
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === window.__mfSettings.zoomKeybind)
      window.__mfSettings.zoomHeld = false;
  });

  let _crosshairStyleEl = null;

  function applyCrosshair() {
    if (!_crosshairStyleEl) return;

    const s = window.__mfSettings;
    const enabled = s && s.crosshair;
    const url = s && s.crosshairURL ? s.crosshairURL.trim() : "";
    const size = s && s.crosshairSize ? s.crosshairSize : 32;
    const opacity = s && s.crosshairOpacity != null ? s.crosshairOpacity : 1.0;

    if (!enabled) {
      _crosshairStyleEl.textContent = "";
      return;
    }

    if (!url) {
      _crosshairStyleEl.textContent = `
                .aim {
                    visibility: hidden !important;
                }
                .aim::after {
                    content: "" !important;
                    display: block !important;
                    position: absolute !important;
                    top: 50% !important;
                    left: 50% !important;
                    visibility: visible !important;
                    transform: translate(-50%, -50%) !important;
                    width: ${size}px !important;
                    height: ${size}px !important;
                    opacity: ${opacity} !important;
                    pointer-events: none !important;
                    background:
                        linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95))
                            center / 1.5px ${Math.round(size * 0.55)}px no-repeat,
                        linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95))
                            center / ${Math.round(size * 0.55)}px 1.5px no-repeat !important;
                    filter: drop-shadow(0 0 1px rgba(0,0,0,0.9)) !important;
                }
            `;
      return;
    }

    _crosshairStyleEl.textContent = `
            .aim {
                visibility: hidden !important;
            }
            .aim::after {
                content: "" !important;
                display: block !important;
                position: absolute !important;
                visibility: visible !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: ${size}px !important;
                height: ${size}px !important;
                opacity: ${opacity} !important;
                border-radius: 0 !important;
                border: none !important;
                pointer-events: none !important;
                background-image: url('${url.replace(/'/g, "\\'")}') !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                image-rendering: pixelated !important;
            }
        `;
  }

  let _ksEl = null;
  let _ksEditMode = false;
  let _ksDragOff = {
    x: 0,
    y: 0,
  };

  const _ksKeys = {
    w: {
      code: "KeyW",
      label: "W",
      el: null,
    },
    a: {
      code: "KeyA",
      label: "A",
      el: null,
    },
    s: {
      code: "KeyS",
      label: "S",
      el: null,
    },
    d: {
      code: "KeyD",
      label: "D",
      el: null,
    },
    space: {
      code: "Space",
      label: "___",
      el: null,
    },
    shift: {
      code: "ShiftLeft",
      label: "SHIFT",
      el: null,
    },
    c: {
      code: "KeyC",
      label: "C",
      el: null,
    },
    lmb: {
      code: "LMB",
      label: "LMB",
      el: null,
      cpsEl: null,
    },
    rmb: {
      code: "RMB",
      label: "RMB",
      el: null,
      cpsEl: null,
    },
  };

  const _ksPressed = {};
  const _lmbClicks = [];
  const _rmbClicks = [];

  function applyKeystrokes() {
    if (!_ksEl) return false;

    const s = window.__mfSettings;
    if (!s || typeof s.keystrokes === "undefined") return false;

    _ksEl.style.display = s.keystrokes ? "block" : "none";

    const scale = s.keystrokesScale || 1.0;
    const x = s.keystrokesX ?? 20;
    const y = s.keystrokesY ?? 40;

    _ksEl.style.left = x + "px";
    _ksEl.style.top = y + "px";
    _ksEl.style.transform = `scale(${scale})`;

    Object.values(_ksKeys).forEach((k) => {
      if (!k.el) return;
      const pressed = !!_ksPressed[k.code];
      k.el.style.background = pressed ? s.keystrokesBgPress : s.keystrokesBg;
      k.el.style.color = pressed ? s.keystrokesTextPress : s.keystrokesText;
      k.el.style.boxShadow = s.keystrokesShadow
        ? "0 2px 6px rgba(0,0,0,0.5)"
        : "none";
      k.el.style.border = s.keystrokesBorder
        ? `${s.keystrokesBorderWidth}px solid ${s.keystrokesBorderColor}`
        : "1px solid rgba(255,255,255,0.08)";

      if (k.cpsEl) {
        k.cpsEl.style.display = s.keystrokesShowCPS ? "block" : "none";
      }
    });

    return true;
  }

  function setKeyPressed(code, pressed) {
    _ksPressed[code] = pressed;
    const s = window.__mfSettings;
    if (!s || !s.keystrokes) return;

    Object.values(_ksKeys).forEach((k) => {
      if (k.code !== code || !k.el) return;
      k.el.style.background = pressed ? s.keystrokesBgPress : s.keystrokesBg;
      k.el.style.color = pressed ? s.keystrokesTextPress : s.keystrokesText;
    });
  }

  function makeKey(label, width, isMouse) {
    const el = document.createElement("div");
    el.style.cssText = `
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        width:${width}px;
        height:44px;
        border-radius:6px;
        font-family:sans-serif;
        font-size:${isMouse ? "11px" : "13px"};
        font-weight:700;
        cursor:default;
        transition:background .05s,color .05s;
        user-select:none;
        line-height:1;
        gap:2px;
    `;

    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    el.appendChild(labelEl);

    let cpsEl = null;
    if (isMouse) {
      cpsEl = document.createElement("span");
      cpsEl.style.cssText = "font-size:9px;opacity:0.7;font-weight:500;";
      cpsEl.textContent = "0 CPS";
      el.appendChild(cpsEl);
    }

    return {
      el,
      cpsEl,
    };
  }

  function initKeystrokes() {
    if (!document.body) {
      setTimeout(initKeystrokes, 100);
      return;
    }

    if (document.getElementById("__matrix_ks")) return;

    const wrap = document.createElement("div");
    wrap.id = "__matrix_ks";
    wrap.style.cssText = `
        position: fixed;
        z-index: 99990;
        display: none;
        transform-origin: top left;
        user-select: none;
    `;

    const grid = document.createElement("div");
    grid.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    function row(...keys) {
      const r = document.createElement("div");
      r.style.cssText = "display:flex;gap:4px;justify-content:center;";
      keys.forEach((k) => r.appendChild(k));
      return r;
    }

    const built = {};
    Object.entries(_ksKeys).forEach(([id, def]) => {
      let width = 44;

      if (id === "space") width = 140;

      if (id === "lmb" || id === "rmb") width = 68;

      const { el, cpsEl } = makeKey(
        def.label,
        width,
        id === "lmb" || id === "rmb",
      );
      def.el = el;
      def.cpsEl = cpsEl;
      built[id] = el;
    });
    grid.appendChild(row(built.shift, built.w, built.c));
    grid.appendChild(row(built.a, built.s, built.d));
    grid.appendChild(row(built.space));
    grid.appendChild(row(built.lmb, built.rmb));

    wrap.appendChild(grid);
    document.body.appendChild(wrap);
    _ksEl = wrap;

    const applyInterval = setInterval(() => {
      if (applyKeystrokes()) {
        clearInterval(applyInterval);
      }
    }, 50);

    document.addEventListener("keydown", (e) => {
      Object.values(_ksKeys).forEach((k) => {
        if (k.code === e.code) setKeyPressed(k.code, true);
      });
    });
    document.addEventListener("keyup", (e) => {
      Object.values(_ksKeys).forEach((k) => {
        if (k.code === e.code) setKeyPressed(k.code, false);
      });
    });

    document.addEventListener("mousedown", (e) => {
      const now = performance.now();
      if (e.button === 0) {
        _lmbClicks.push(now);
        setKeyPressed("LMB", true);
      }
      if (e.button === 2) {
        _rmbClicks.push(now);
        setKeyPressed("RMB", true);
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (e.button === 0) setKeyPressed("LMB", false);
      if (e.button === 2) setKeyPressed("RMB", false);
    });

    function cpsLoop() {
      const now = performance.now();
      const win = 1000;

      while (_lmbClicks.length && _lmbClicks[0] < now - win) _lmbClicks.shift();
      while (_rmbClicks.length && _rmbClicks[0] < now - win) _rmbClicks.shift();

      const s = window.__mfSettings;
      if (s && s.keystrokes && s.keystrokesShowCPS) {
        if (_ksKeys.lmb.cpsEl)
          _ksKeys.lmb.cpsEl.textContent = _lmbClicks.length + " CPS";
        if (_ksKeys.rmb.cpsEl)
          _ksKeys.rmb.cpsEl.textContent = _rmbClicks.length + " CPS";
      }

      requestAnimationFrame(cpsLoop);
    }
    requestAnimationFrame(cpsLoop);

    let dragging = false;
    let dragStart = {
      mx: 0,
      my: 0,
      ex: 0,
      ey: 0,
    };

    wrap.addEventListener("mousedown", (e) => {
      if (!_ksEditMode) return;
      e.preventDefault();
      dragging = true;
      dragStart = {
        mx: e.clientX,
        my: e.clientY,
        ex: parseInt(wrap.style.left) || 0,
        ey: parseInt(wrap.style.top) || 0,
      };
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const nx = dragStart.ex + (e.clientX - dragStart.mx);
      const ny = dragStart.ey + (e.clientY - dragStart.my);
      wrap.style.left = nx + "px";
      wrap.style.top = ny + "px";
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      const nx = parseInt(wrap.style.left) || 0;
      const ny = parseInt(wrap.style.top) || 0;
      window.__mfSettings.keystrokesX = nx;
      window.__mfSettings.keystrokesY = ny;
      if (window.electronAPI) {
        window.electronAPI.setSetting("keystrokes.x", nx);
        window.electronAPI.setSetting("keystrokes.y", ny);
      }
    });

    console.log("[Matrix] Keystrokes ready");
  }

  window.__matrixKsEditMode = function (on) {
    _ksEditMode = on;
    if (!_ksEl) return;
    _ksEl.style.outline = on ? "2px dashed #517fe6" : "none";
    _ksEl.style.cursor = on ? "move" : "default";
  };

  initKeystrokes();

  function initCrosshair() {
    if (!document.body) {
      setTimeout(initCrosshair, 100);
      return;
    }

    _crosshairStyleEl = document.createElement("style");
    _crosshairStyleEl.id = "__matrix_crosshair_style";
    document.head.appendChild(_crosshairStyleEl);

    applyCrosshair();

    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (
            (node.classList && node.classList.contains("aim")) ||
            (node.querySelector && node.querySelector(".aim"))
          ) {
            applyCrosshair();
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  window.__mfSettings.translation = false;
  window.__mfSettings.translationLang = "pt";
  window.__mfSettings.hub = false;
  initCrosshair();
})();
