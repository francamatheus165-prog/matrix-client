(function () {
  "use strict";
  if (window.__matrixTranslationInstalled) return;
  window.__matrixTranslationInstalled = true;

  const state = window.__matrixTranslation = {
    enabled: false,
    lang: "pt",
    observer: null,
    cache: new Map(),
    pending: new Map(),
    originalByElement: new WeakMap(),
    failures: 0,
    scanTimer: null,
  };

  const LANGS = new Set([
    "en","pt","es","fr","de","it","ru","ja","ko","zh","ar","hi","tr","pl","nl","sv","no","da","fi","cs","ro","hu","th","vi","id"
  ]);

  function normalize(v) { return String(v || "").trim().replace(/\s+/g, " "); }

  function looksLikeChat(el) {
    if (!el || el.nodeType !== 1) return false;
    const cls = String(el.className || "").toLowerCase();
    const id = String(el.id || "").toLowerCase();
    if (el.matches && (el.matches('.messages') || el.matches('[class*="chat-message"]') || el.matches('[data-chat-message]'))) return true;
    return /chat|message|conversation|whisper|direct/.test(cls + " " + id);
  }

  function findChatMessages(root) {
    const out = [];
    if (!root || !root.querySelectorAll) return out;
    const selectors = [
      '.messages[data-v-]',
      '[class*="messages"]',
      '[class*="chat"] [class*="message"]',
      '[id*="chat"] [class*="message"]',
      '[data-chat-message]',
      '.chat-message'
    ];
    const seen = new Set();
    for (const sel of selectors) {
      let els = [];
      try { els = root.querySelectorAll(sel); } catch (_) {}
      for (const el of els) {
        if (!seen.has(el)) { seen.add(el); out.push(el); }
      }
    }
    return out;
  }

  function extractMessage(el) {
    if (!el) return null;
    const clone = el.cloneNode(true);
    clone.querySelectorAll('button,input,textarea,select,svg,img,[aria-hidden="true"],.minefun-translator-badge,.matrix-translated-line').forEach(n => n.remove());
    const text = normalize(clone.textContent || "");
    if (!text || text.length < 2 || text.length > 300) return null;

    const idx = text.indexOf(":");
    if (idx > 0 && idx < 40) {
      const sender = normalize(text.slice(0, idx));
      const body = normalize(text.slice(idx + 1));
      if (body.length >= 2) return { sender, body };
    }
    return { sender: "", body: text };
  }

  function detectLocal(text) {
    if (/[\u3040-\u30ff]/.test(text)) return "ja";
    if (/[\uac00-\ud7af]/.test(text)) return "ko";
    if (/[\u4e00-\u9fff]/.test(text)) return "zh";
    if (/[\u0400-\u04ff]/.test(text)) return "ru";
    if (/[\u0600-\u06ff]/.test(text)) return "ar";
    if (/[\u0e00-\u0e7f]/.test(text)) return "th";
    if (/[\u0900-\u097f]/.test(text)) return "hi";
    return null;
  }

  async function requestJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  async function translateText(text) {
    const target = LANGS.has(state.lang) ? state.lang : "pt";
    const key = target + "\n" + text;
    if (state.cache.has(key)) return state.cache.get(key);
    if (state.pending.has(key)) return state.pending.get(key);

    const p = (async () => {
      const endpoints = [
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(text),
        "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=autodetect|" + encodeURIComponent(target)
      ];

      for (const url of endpoints) {
        try {
          const data = await requestJson(url);
          let translated = null;
          if (Array.isArray(data) && Array.isArray(data[0])) {
            translated = data[0].map(x => Array.isArray(x) ? x[0] : "").filter(Boolean).join("");
          }
          if (!translated && data && data.responseData) translated = data.responseData.translatedText;
          translated = normalize(translated);
          if (translated && translated.toLowerCase() !== text.toLowerCase()) {
            state.cache.set(key, translated);
            return translated;
          }
        } catch (_) {}
      }
      throw new Error("No translation provider responded");
    })();

    state.pending.set(key, p);
    try { return await p; }
    finally { state.pending.delete(key); }
  }

  function ensureStyle() {
    if (document.getElementById("matrix-translation-style")) return;
    const s = document.createElement("style");
    s.id = "matrix-translation-style";
    s.textContent = `
      .minefun-translator-badge { display:inline-flex!important; align-items:center!important; margin-left:6px!important; padding:1px 5px!important; border:1px solid rgba(96,165,250,.35)!important; border-radius:5px!important; background:rgba(59,130,246,.13)!important; color:#93c5fd!important; font:700 10px/1.4 Arial,sans-serif!important; cursor:pointer!important; vertical-align:middle!important; user-select:none!important; }
      .minefun-translator-badge:hover { background:rgba(59,130,246,.25)!important; }
      .matrix-translated-line { display:block!important; margin-top:2px!important; font-weight:600!important; }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function renderTranslated(el, translated, source) {
    if (!el || !el.isConnected) return;

    const originalHTML = el.dataset.matrixOriginalHTML;
    if (!originalHTML) el.dataset.matrixOriginalHTML = el.innerHTML;
    el.dataset.matrixTranslatedText = translated;
    el.dataset.matrixSourceLang = source || "auto";

    function paint(showOriginal) {
      const badge = document.createElement("span");
      badge.className = "minefun-translator-badge";
      badge.textContent = String(source || "auto").toUpperCase().slice(0, 2);
      badge.title = showOriginal ? "Click to show translation" : "Click to show original";

      const body = document.createElement("span");
      body.className = "matrix-translated-line";
      body.textContent = showOriginal ? "" : translated;

      if (showOriginal) {
        el.innerHTML = el.dataset.matrixOriginalHTML;
      } else {
        const original = document.createElement("div");
        original.style.cssText = "display:none!important;";
        original.innerHTML = el.dataset.matrixOriginalHTML;
        // Keep the existing player-name/role structure and only append the translation line.
        el.innerHTML = el.dataset.matrixOriginalHTML;
        el.appendChild(body);
      }

      badge.addEventListener("click", function (ev) {
        ev.stopPropagation();
        paint(!showOriginal);
      });
      el.appendChild(document.createTextNode(" "));
      el.appendChild(badge);
      el.dataset.matrixShowingOriginal = showOriginal ? "1" : "0";
    }

    paint(false);
  }

  async function process(el) {
    if (!state.enabled || !looksLikeChat(el) || el.dataset.matrixTranslationDone === "1" || el.dataset.matrixTranslationBusy === "1") return;
    const info = extractMessage(el);
    if (!info || !info.body) return;
    if (/^https?:\/\//i.test(info.body) || info.body.length > 280) return;

    const local = detectLocal(info.body);
    // Do not waste requests when the message is already in the target language by obvious-script detection.
    if (local && local === state.lang) return;

    el.dataset.matrixTranslationBusy = "1";
    try {
      const translated = await translateText(info.body);
      if (translated && translated.toLowerCase() !== info.body.toLowerCase()) {
        renderTranslated(el, translated, local || "auto");
        el.dataset.matrixTranslationDone = "1";
      }
      state.failures = 0;
    } catch (e) {
      state.failures++;
      if (state.failures > 12) state.failures = 0;
    } finally {
      delete el.dataset.matrixTranslationBusy;
    }
  }

  function scan(root) {
    if (!state.enabled) return;
    ensureStyle();
    for (const el of findChatMessages(root || document)) process(el);
  }

  function stopObserver() {
    if (state.observer) { try { state.observer.disconnect(); } catch (_) {} state.observer = null; }
  }

  window.__matrixSetTranslation = function (enabled, lang) {
    state.enabled = !!enabled;
    state.lang = LANGS.has(String(lang || "").toLowerCase()) ? String(lang).toLowerCase() : "pt";
    state.failures = 0;
    state.cache.clear();
    stopObserver();
    if (!state.enabled) return;
    ensureStyle();
    setTimeout(() => scan(document), 150);
    if (document.body) {
      state.observer = new MutationObserver(records => {
        if (!state.enabled) return;
        for (const rec of records) {
          for (const n of rec.addedNodes) {
            if (n.nodeType === 1) scan(n);
          }
        }
      });
      state.observer.observe(document.body, { childList: true, subtree: true });
    }
    clearInterval(state.scanTimer);
    state.scanTimer = setInterval(() => scan(document), 2200);
  };

  window.__matrixSetTranslation(false, "pt");
})();
