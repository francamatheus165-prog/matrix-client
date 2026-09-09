// ==UserScript==
// @name         Matrix Chat Translation
// @namespace    matrix.official
// @version      1.0
// @description  Translate in-game chat lines into your language
// @match        https://minefun.io/*
// @grant        none
// ==/UserScript==
(function () {
  "use strict";
  var LANG = "en"; // change to "pt", "es", "fr", ...
  var seen = new WeakSet();
  async function translate(node) {
    var text = node.textContent && node.textContent.trim();
    if (!text) return;
    try {
      var res = await fetch(
        "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=autodetect|" + LANG
      );
      var json = await res.json();
      var out = json && json.responseData && json.responseData.translatedText;
      if (out && out.toLowerCase() !== text.toLowerCase()) node.textContent = text + "  (" + out + ")";
    } catch (e) {
      /* offline or rate limited */
    }
  }
  new MutationObserver(function (records) {
    records.forEach(function (r) {
      r.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1 || seen.has(n)) return;
        seen.add(n);
        translate(n);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();