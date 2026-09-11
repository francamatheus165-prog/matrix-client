(function () {
  "use strict";

  var api = window.electronAPI;

  if (!api) {
    console.error("[Matrix] electronAPI not found");
    return;
  }

  var MODS = {
    zoom: {
      label: "Zoom",
      renderOptions: function (s) {
        var level = s["zoom.level"] != null ? s["zoom.level"] : 0.35;
        var kb = s["zoom.keybind"] || "KeyV";
        var displayVal = parseFloat((1 / level).toFixed(1));

        return (
          '<div class="setting-row">' +
          "  <label>Zoom distance</label>" +
          '  <div class="setting-inline">' +
          '    <input type="range" id="copt-zoom-level" min="2" max="5" step="0.1" value="' +
          displayVal +
          '">' +
          '    <div class="range-val" id="copt-zoom-level-val">' +
          displayVal.toFixed(1) +
          "x</div>" +
          "  </div>" +
          "</div>" +
          '<div class="setting-row">' +
          "  <label>Keybind</label>" +
          '  <div class="keybind-box" id="copt-zoom-kb">' +
          fmtKey(kb) +
          "</div>" +
          "</div>"
        );
      },
      bindOptions: function (s) {
        var slider = document.getElementById("copt-zoom-level");
        var valEl = document.getElementById("copt-zoom-level-val");
        var kbEl = document.getElementById("copt-zoom-kb");

        if (slider && valEl) {
          slider.oninput = function () {
            var displayX = parseFloat(slider.value);
            var rawLevel = parseFloat((1 / displayX).toFixed(3));
            valEl.textContent = displayX.toFixed(1) + "x";
            settings["zoom.level"] = rawLevel;
            api.setSetting("zoom.level", rawLevel);
          };
        }

        if (kbEl) {
          var listening = false;
          kbEl.onclick = function () {
            listening = true;
            kbEl.classList.add("listening");
            kbEl.textContent = "Press a key…";
          };
          document.addEventListener("keydown", function (e) {
            if (!listening) return;
            e.preventDefault();
            listening = false;
            kbEl.classList.remove("listening");
            kbEl.textContent = fmtKey(e.code);
            settings["zoom.keybind"] = e.code;
            api.setSetting("zoom.keybind", e.code);
          });
        }
      },
    },

    adblocker: {
      label: "Ad Blocker",
      renderOptions: null,
      bindOptions: null,
    },

    rpc: {
      label: "Discord RPC",
      renderOptions: function (s) {
        var hideRoom = !!s["rpc.hideroom"];
        return (
          '<div class="setting-row">' +
          "  <label>Hide Room ID</label>" +
          '  <div class="opt-toggle">' +
          '    <input type="checkbox" id="copt-rpc-hideroom"' +
          (hideRoom ? " checked" : "") +
          ">" +
          '    <label for="copt-rpc-hideroom"></label>' +
          "  </div>" +
          "</div>"
        );
      },
      bindOptions: function (s) {
        var el = document.getElementById("copt-rpc-hideroom");
        if (!el) return;
        el.addEventListener("change", function () {
          s["rpc.hideroom"] = el.checked;
          api.setSetting("rpc.hideroom", el.checked);
        });
      },
    },
    crosshair: {
      label: "Crosshair",
      renderOptions: function (s) {
        var url = s["crosshair.url"] || "";
        var size = s["crosshair.size"] != null ? s["crosshair.size"] : 32;
        var opacity =
          s["crosshair.opacity"] != null ? s["crosshair.opacity"] : 1.0;

        return (
          '<div class="setting-row">' +
          "  <label>Image URL</label>" +
          '  <input class="text-box" type="text" id="copt-xhair-url"' +
          '    placeholder="Enter URL"' +
          '    value="' +
          url.replace(/"/g, "&quot;") +
          '">' +
          "</div>" +
          '<div class="setting-row">' +
          "  <label>Size</label>" +
          '  <div class="setting-inline">' +
          '    <input type="range" id="copt-xhair-size" min="8" max="80" step="1" value="' +
          size +
          '">' +
          '    <div class="range-val" id="copt-xhair-size-val">' +
          size +
          "px</div>" +
          "  </div>" +
          "</div>" +
          '<div class="setting-row">' +
          "  <label>Opacity</label>" +
          '  <div class="setting-inline">' +
          '    <input type="range" id="copt-xhair-opacity" min="0.1" max="1" step="0.05" value="' +
          opacity +
          '">' +
          '    <div class="range-val" id="copt-xhair-opacity-val">' +
          Math.round(opacity * 100) +
          "%</div>" +
          "  </div>" +
          "</div>" +
          '<div class="setting-row">' +
          "  <label>Preview</label>" +
          '  <div style="' +
          "    width:80px;height:80px;background:#0d0d0d;" +
          "    border:1px solid var(--border-1);border-radius:4px;" +
          "    display:flex;align-items:center;justify-content:center;" +
          '    position:relative;">' +
          '    <canvas id="copt-xhair-canvas" width="80" height="80" ' +
          '      style="position:absolute;top:0;left:0;"></canvas>' +
          "  </div>" +
          "</div>"
        );
      },
      bindOptions: function (s) {
        var urlEl = document.getElementById("copt-xhair-url");
        var sizeEl = document.getElementById("copt-xhair-size");
        var sizeVal = document.getElementById("copt-xhair-size-val");
        var opEl = document.getElementById("copt-xhair-opacity");
        var opVal = document.getElementById("copt-xhair-opacity-val");
        var canvas = document.getElementById("copt-xhair-canvas");
        var ctx = canvas ? canvas.getContext("2d") : null;

        function drawPreview() {
          if (!ctx) return;
          ctx.clearRect(0, 0, 80, 80);

          var url = urlEl ? urlEl.value.trim() : "";
          var size = sizeEl ? parseInt(sizeEl.value) : 32;
          var op = opEl ? parseFloat(opEl.value) : 1.0;
          var s2 = Math.min(size, 60);
          var cx = 40,
            cy = 40;

          ctx.save();
          ctx.globalAlpha = op;

          if (!url) {
            var arm = s2 / 2;
            var t = Math.max(1, s2 / 20);
            var gap = s2 / 8;

            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.lineWidth = t + 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(cx - arm, cy);
            ctx.lineTo(cx - gap, cy);
            ctx.moveTo(cx + gap, cy);
            ctx.lineTo(cx + arm, cy);
            ctx.moveTo(cx, cy - arm);
            ctx.lineTo(cx, cy - gap);
            ctx.moveTo(cx, cy + gap);
            ctx.lineTo(cx, cy + arm);
            ctx.stroke();

            ctx.strokeStyle = "rgba(255,255,255,0.95)";
            ctx.lineWidth = t;
            ctx.beginPath();
            ctx.moveTo(cx - arm, cy);
            ctx.lineTo(cx - gap, cy);
            ctx.moveTo(cx + gap, cy);
            ctx.lineTo(cx + arm, cy);
            ctx.moveTo(cx, cy - arm);
            ctx.lineTo(cx, cy - gap);
            ctx.moveTo(cx, cy + gap);
            ctx.lineTo(cx, cy + arm);
            ctx.stroke();
          } else {
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
              ctx.clearRect(0, 0, 80, 80);
              ctx.save();
              ctx.globalAlpha = op;
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, cx - s2 / 2, cy - s2 / 2, s2, s2);
              ctx.restore();
            };
            img.onerror = function () {
              ctx.clearRect(0, 0, 80, 80);
              ctx.restore();
              ctx.save();
              ctx.fillStyle = "#e05252";
              ctx.font = "10px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("Invalid URL", 40, 40);
              ctx.restore();
              return;
            };
            img.src = url;
          }

          ctx.restore();
        }

        if (urlEl) {
          urlEl.oninput = drawPreview;
          urlEl.onchange = function () {
            var v = urlEl.value.trim();
            settings["crosshair.url"] = v;
            api.setSetting("crosshair.url", v);
          };
        }

        if (sizeEl && sizeVal) {
          sizeEl.oninput = function () {
            var v = parseInt(sizeEl.value);
            sizeVal.textContent = v + "px";
            settings["crosshair.size"] = v;
            api.setSetting("crosshair.size", v);
            drawPreview();
          };
        }

        if (opEl && opVal) {
          opEl.oninput = function () {
            var v = parseFloat(opEl.value);
            opVal.textContent = Math.round(v * 100) + "%";
            settings["crosshair.opacity"] = v;
            api.setSetting("crosshair.opacity", v);
            drawPreview();
          };
        }

        drawPreview();
      },
    },
    translation: {
      label: "Matrix Translation",
      renderOptions: function (s) {
        var lang = s["translation.lang"] || "pt";
        var langs = {pt:"Portuguese",en:"English",es:"Spanish",fr:"French",de:"German",it:"Italian",ru:"Russian",ja:"Japanese",ko:"Korean",zh:"Chinese",ar:"Arabic",hi:"Hindi",tr:"Turkish",pl:"Polish",nl:"Dutch"};
        return '<div class="setting-row"><label>Translate chat to</label><select class="text-box" id="copt-translation-lang">' + Object.keys(langs).map(function(k){return '<option value="'+k+'" '+(k===lang?'selected':'')+'>'+langs[k]+'</option>';}).join('') + '</select></div>' +
               '<div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Auto-detects the sender language and translates chat messages. Click the language badge to view the original.</span></div>';
      },
      bindOptions: function (s) {
        var el = document.getElementById("copt-translation-lang");
        if (!el) return;
        el.addEventListener("change", function () {
          var v = (el.value || "pt").trim().toLowerCase();
          s["translation.lang"] = v;
          api.setSetting("translation.lang", v);
        });
      }
    },
    "clean-screen": {
      label: "Clear Screen",
      renderOptions: function () { return '<div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Clear the game HUD while keeping the Matrix Client menu visible.</span></div><div class="setting-row"><span style="color:var(--grey-1);font-size:11px"><b>H</b> toggles Clear Screen only while you are playing. The Matrix menu is never hidden.</span></div>'; },
      bindOptions: function () {}
    },
    "smooth-camera": {
      label: "Smooth Camera",
      renderOptions: function () { return '<div class="setting-row"><label>Smoothing</label><input class="text-box" type="range" min="0.01" max="0.10" step="0.01" id="copt-smooth-camera" value="0.02"><span id="copt-smooth-camera-v">0.02</span></div><div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Client-side camera smoothing. Use the Matrix Mod Menu.</span></div>'; },
      bindOptions: function () { var el=document.getElementById("copt-smooth-camera"),v=document.getElementById("copt-smooth-camera-v"); if(el) el.oninput=function(){ if(v)v.textContent=el.value; if(window.__matrixExtraMods && window.__matrixExtraMods.setSmoothness) window.__matrixExtraMods.setSmoothness(parseFloat(el.value)); }; }
    },
    "cinematic-fx": {
      label: "Cinematic FX",
      renderOptions: function () { return '<div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Uses the Matrix Client cinematic preset with film-style grading.</span></div>'; },
      bindOptions: function () {}
    },
    "mouse-trail": {
      label: "Mouse Trail",
      renderOptions: function (s) {
        return '<div class="setting-row"><label>Mode</label><select class="text-box" id="ct-mt-mode">'+['fade','trail','sparkle','ribbon','pulse','swirl'].map(function(x){return '<option value="'+x+'" '+((s['mouse-trail.mode']||'fade')===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>' +
          '<div class="setting-row"><label>Shape</label><select class="text-box" id="ct-mt-shape">'+['circle','square','triangle','star','heart','diamond','hexagon','cross'].map(function(x){return '<option value="'+x+'" '+((s['mouse-trail.shape']||'circle')===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>' +
          '<div class="setting-row"><label>Length</label><input type="range" min="5" max="80" id="ct-mt-length" value="'+(s['mouse-trail.length']||15)+'"><span id="ct-mt-length-v">'+(s['mouse-trail.length']||15)+'</span></div>' +
          '<div class="setting-row"><label>Size</label><input type="range" min="2" max="40" id="ct-mt-size" value="'+(s['mouse-trail.size']||6)+'"><span id="ct-mt-size-v">'+(s['mouse-trail.size']||6)+'</span></div>' +
          '<div class="setting-row"><label>Color</label><input type="color" id="ct-mt-color" value="'+(s['mouse-trail.color']||'#00ffff')+'"></div>' +
          '<div class="setting-row"><label>Click Effect</label><select class="text-box" id="ct-mt-fx">'+['ripple','blast','shockwave','orbital','confetti'].map(function(x){return '<option value="'+x+'" '+((s['mouse-trail.clickEffect']||'ripple')===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>' +
          '<div class="setting-row"><label>Effect Size</label><input type="range" min="30" max="180" id="ct-mt-fsize" value="'+(s['mouse-trail.clickSize']||80)+'"><span id="ct-mt-fsize-v">'+(s['mouse-trail.clickSize']||80)+'</span></div>' +
          '<div class="setting-row"><label>Emoji</label><select class="text-box" id="ct-mt-emoji"><option value="false">Off</option><option value="true">On</option></select></div>' +
          '<div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Adapted from Itz_Krishna AKA Everlasting. All controls are in Matrix Client; keyboard shortcuts are disabled.</span></div>' +
          '<div class="setting-row"><a href="https://discord.gg/sw5HCYZBy9" target="_blank" style="color:#0ff;font-size:11px">Community Discord</a></div>';
      },
      bindOptions: function (s) {
        var apiC=window.__matrixCommunityMods; if(!apiC)return;
        function bind(id,key,type,valId){var el=document.getElementById(id),v=valId?document.getElementById(valId):null;if(!el)return;el.addEventListener(type||'input',function(){var val=type==='change'?el.value:(el.type==='color'?el.value:parseFloat(el.value));if(el.id==='ct-mt-emoji')val=el.value==='true';s['mouse-trail.'+key]=val;api.setSetting('mouse-trail.'+key,val);apiC.setMouseTrailConfig(key,val);if(v)v.textContent=el.value;});}
        bind('ct-mt-mode','mode','change');bind('ct-mt-shape','shape','change');bind('ct-mt-length','length','input','ct-mt-length-v');bind('ct-mt-size','size','input','ct-mt-size-v');bind('ct-mt-color','color','input');bind('ct-mt-fx','clickEffect','change');bind('ct-mt-fsize','clickSize','input','ct-mt-fsize-v');var em=document.getElementById('ct-mt-emoji');if(em){em.value=String(!!s['mouse-trail.emoji']);em.onchange=function(){var val=em.value==='true';s['mouse-trail.emoji']=val;api.setSetting('mouse-trail.emoji',val);apiC.setMouseTrailConfig('emoji',val);};}
      }
    },
    stopwatch: {
      label: "Stopwatch",
      renderOptions: function (s) { return '<div class="setting-row"><label>Scale</label><input type="range" min="0.7" max="1.4" step="0.1" id="ct-sw-scale" value="'+(s['stopwatch.scale']||1)+'"><span id="ct-sw-scale-v">'+(s['stopwatch.scale']||1)+'x</span></div><div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Drag the stopwatch inside the game. No external shortcut.</span></div><div class="setting-row"><a href="https://discord.gg/sw5HCYZBy9" target="_blank" style="color:#0ff;font-size:11px">Community Discord • Itz_Krishna AKA Everlasting</a></div>'; },
      bindOptions: function(s){var el=document.getElementById('ct-sw-scale'),v=document.getElementById('ct-sw-scale-v');if(el)el.oninput=function(){var n=parseFloat(el.value);s['stopwatch.scale']=n;api.setSetting('stopwatch.scale',n);if(v)v.textContent=n+'x';window.__matrixCommunityMods?.setStopwatchConfig('scale',n);};}
    },
    "display-enhancer": {
      label: "Display Enhancer",
      renderOptions: function (s) { return '<div class="setting-row"><label>Brightness</label><input type="range" min="0" max="200" id="ct-dp-bright" value="'+(s['display-enhancer.brightness']||100)+'"><span id="ct-dp-bright-v">'+(s['display-enhancer.brightness']||100)+'%</span></div><div class="setting-row"><label>Contrast</label><input type="range" min="0" max="200" id="ct-dp-contrast" value="'+(s['display-enhancer.contrast']||100)+'"><span id="ct-dp-contrast-v">'+(s['display-enhancer.contrast']||100)+'%</span></div><div class="setting-row"><label>Saturation</label><input type="range" min="0" max="300" id="ct-dp-sat" value="'+(s['display-enhancer.saturation']||100)+'"><span id="ct-dp-sat-v">'+(s['display-enhancer.saturation']||100)+'%</span></div><div class="setting-row"><label>Hue</label><input type="range" min="0" max="360" id="ct-dp-hue" value="'+(s['display-enhancer.hue']||0)+'"><span id="ct-dp-hue-v">'+(s['display-enhancer.hue']||0)+'°</span></div><div class="setting-row"><label>Vignette</label><input type="range" min="0" max="100" id="ct-dp-vig" value="'+(s['display-enhancer.vignette']||0)+'"><span id="ct-dp-vig-v">'+(s['display-enhancer.vignette']||0)+'%</span></div><div class="setting-row"><label>Scanlines</label><input type="range" min="0" max="100" id="ct-dp-scan" value="'+(s['display-enhancer.scanlines']||0)+'"><span id="ct-dp-scan-v">'+(s['display-enhancer.scanlines']||0)+'%</span></div><div class="setting-row"><span style="color:var(--grey-1);font-size:11px">More controls are persisted by Matrix Client. No keyboard shortcut.</span></div><div class="setting-row"><a href="https://discord.gg/sw5HCYZBy9" target="_blank" style="color:#0ff;font-size:11px">Community Discord • Itz_Krishna AKA Everlasting</a></div>'; },
      bindOptions:function(s){var a=window.__matrixCommunityMods;if(!a)return;[['bright','brightness'],['contrast','contrast'],['sat','saturation'],['hue','hue'],['vig','vignette'],['scan','scanlines']].forEach(function(pair){var el=document.getElementById('ct-dp-'+pair[0]),v=document.getElementById('ct-dp-'+pair[0]+'-v');if(el)el.oninput=function(){var n=parseFloat(el.value);s['display-enhancer.'+pair[1]]=n;api.setSetting('display-enhancer.'+pair[1],n);a.setDisplayConfig(pair[1],n);if(v)v.textContent=n+(pair[1]==='hue'?'°':'%');};});}
    },
    "visual-keyboard": {
      label: "Visual Keyboard",
      renderOptions:function(s){return '<div class="setting-row"><label>Scale</label><input type="range" min="0.4" max="1.2" step="0.1" id="ct-vk-scale" value="'+(s['visual-keyboard.scale']||.6)+'"><span id="ct-vk-scale-v">'+(s['visual-keyboard.scale']||.6)+'x</span></div><div class="setting-row"><label>Opacity</label><input type="range" min="0.3" max="1" step="0.05" id="ct-vk-opacity" value="'+(s['visual-keyboard.opacity']||.9)+'"><span id="ct-vk-opacity-v">'+Math.round((s['visual-keyboard.opacity']||.9)*100)+'%</span></div><div class="setting-row"><label>Glow</label><select class="text-box" id="ct-vk-glow"><option value="true">On</option><option value="false">Off</option></select></div><div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Adapted from Itz_Krishna AKA Everlasting. Toggle only from Matrix Mod Menu.</span></div><div class="setting-row"><a href="https://discord.gg/sw5HCYZBy9" target="_blank" style="color:#0ff;font-size:11px">Community Discord</a></div>';},
      bindOptions:function(s){var a=window.__matrixCommunityMods; if(!a)return;var sc=document.getElementById('ct-vk-scale'),sv=document.getElementById('ct-vk-scale-v'),op=document.getElementById('ct-vk-opacity'),ov=document.getElementById('ct-vk-opacity-v'),gl=document.getElementById('ct-vk-glow');if(sc)sc.oninput=function(){var n=parseFloat(sc.value);s['visual-keyboard.scale']=n;api.setSetting('visual-keyboard.scale',n);a.setVisualKeyboardConfig('scale',n);sv.textContent=n+'x';};if(op)op.oninput=function(){var n=parseFloat(op.value);s['visual-keyboard.opacity']=n;api.setSetting('visual-keyboard.opacity',n);a.setVisualKeyboardConfig('opacity',n);ov.textContent=Math.round(n*100)+'%';};if(gl){gl.value=String(s['visual-keyboard.glow']!==false);gl.onchange=function(){var n=gl.value==='true';s['visual-keyboard.glow']=n;api.setSetting('visual-keyboard.glow',n);a.setVisualKeyboardConfig('glow',n);};}}
    },
    "fps-counter": {
      label: "FPS Counter",
      renderOptions:function(s){return '<div class="setting-row"><label>Scale</label><input type="range" min="0.7" max="1.5" step="0.1" id="ct-fps-scale" value="'+(s['fps-counter.scale']||1)+'"><span id="ct-fps-scale-v">'+(s['fps-counter.scale']||1)+'x</span></div><div class="setting-row"><label>Opacity</label><input type="range" min="0.3" max="1" step="0.05" id="ct-fps-opacity" value="'+(s['fps-counter.opacity']||.95)+'"><span id="ct-fps-opacity-v">'+Math.round((s['fps-counter.opacity']||.95)*100)+'%</span></div><div class="setting-row"><label>Graph</label><select class="text-box" id="ct-fps-graph"><option value="true">On</option><option value="false">Off</option></select></div><div class="setting-row"><label>Bar</label><select class="text-box" id="ct-fps-bar"><option value="true">On</option><option value="false">Off</option></select></div><div class="setting-row"><label>Min/Max</label><select class="text-box" id="ct-fps-minmax"><option value="true">On</option><option value="false">Off</option></select></div><div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Adapted from Itz_Krishna AKA Everlasting. Toggle only from Matrix Mod Menu.</span></div><div class="setting-row"><a href="https://discord.gg/sw5HCYZBy9" target="_blank" style="color:#0ff;font-size:11px">Community Discord</a></div>';},
      bindOptions:function(s){var a=window.__matrixCommunityMods;if(!a)return;var sc=document.getElementById('ct-fps-scale'),sv=document.getElementById('ct-fps-scale-v'),op=document.getElementById('ct-fps-opacity'),ov=document.getElementById('ct-fps-opacity-v');if(sc)sc.oninput=function(){var n=parseFloat(sc.value);s['fps-counter.scale']=n;api.setSetting('fps-counter.scale',n);a.setFPSConfig('scale',n);sv.textContent=n+'x';};if(op)op.oninput=function(){var n=parseFloat(op.value);s['fps-counter.opacity']=n;api.setSetting('fps-counter.opacity',n);a.setFPSConfig('opacity',n);ov.textContent=Math.round(n*100)+'%';};[['graph','ct-fps-graph'],['bar','ct-fps-bar'],['minmax','ct-fps-minmax']].forEach(function(pair){var el=document.getElementById(pair[1]);if(el){el.value=String(s['fps-counter.'+pair[0]]!==false);el.onchange=function(){var n=el.value==='true';s['fps-counter.'+pair[0]]=n;api.setSetting('fps-counter.'+pair[0],n);a.setFPSConfig(pair[0],n);};}});}
    },
    hub: {
      label: "Matrix Hub",
      renderOptions: function () {
        return '<div class="setting-row"><span style="color:var(--grey-1);font-size:11px">Built from your supplied Minefun Ultimate Hub userscript: crosshairs, effects, RGB keyboard styling and clack feedback.</span></div>';
      },
      bindOptions: function () {}
    },

    "visual-shader": {
      label: "Shaders",
      renderOptions: function () {
        return '<div class="setting-row"><label>Preset</label><select class="text-box" id="matrix-visual-shader-select">' +
          ['none','realistic-low','realistic-high','realistic-ultra','bloom','vibrant','cinematic','noir','thermal','retro','acid','cyberpunk','neon','dreamscape','matrix','underwater','sunset','frost','vintage'].map(function(x){return '<option value="'+x+'">'+x+'</option>';}).join('') +
          '</select></div>';
      },
      bindOptions: function () {
        var apiV = window.__matrixVisualMods; var el=document.getElementById('matrix-visual-shader-select');
        if(!apiV||!el)return; var c=apiV.getConfig(); el.value=c.shader||'none'; el.onchange=function(){apiV.setShaderMode(el.value);};
      }
    },
    "visual-dark": {
      label: "Dark Mode",
      renderOptions: function(){return '<div class="setting-row"><label>Dark level</label><input class="text-box" type="range" id="matrix-visual-dark-level" min="20" max="80" step="20"><span id="matrix-visual-dark-value"></span></div>';},
      bindOptions: function(){var apiV=window.__matrixVisualMods;var el=document.getElementById('matrix-visual-dark-level');var val=document.getElementById('matrix-visual-dark-value');if(!apiV||!el)return;el.value=apiV.getConfig().darkLevel||60;if(val)val.textContent=el.value+'%';el.oninput=function(){if(val)val.textContent=el.value+'%';apiV.setDarkMode(true,el.value);};}
    },
    "visual-weather": {
      label: "Weather FX",
      renderOptions: function(){return '<div class="setting-row"><label>Rain</label><button class="opt-btn" id="matrix-weather-rain">Toggle</button></div><div class="setting-row"><label>Lava Sky</label><button class="opt-btn" id="matrix-weather-lava">Toggle</button></div><div class="setting-row"><label>Lightning</label><button class="opt-btn" id="matrix-weather-lightning">Toggle</button></div>';},
      bindOptions:function(){var apiV=window.__matrixVisualMods;if(!apiV)return;[['rain','matrix-weather-rain'],['lava','matrix-weather-lava'],['lightning','matrix-weather-lightning']].forEach(function(a){var b=document.getElementById(a[1]);if(b)b.onclick=function(){apiV.toggleMod(a[0]);};});}
    },
    "visual-crosshair": {
      label: "Crosshair",
      renderOptions:function(){return '<div class="setting-row"><label>Enable</label><button class="opt-btn" id="mxh-toggle">Toggle</button></div><div class="setting-row"><label>Type</label><select class="text-box" id="matrix-cross-type"><option>dot</option><option>cross</option><option>plus</option><option>x</option><option>triangle</option><option>diamond</option><option>circle</option><option>brackets</option><option>star</option><option>heart</option></select></div><div class="setting-row"><label>Size</label><input class="text-box" type="range" id="matrix-cross-size" min="5" max="40"><span id="matrix-cross-size-v"></span></div><div class="setting-row"><label>RGB</label><button class="opt-btn" id="mxh-rgb">Toggle</button></div>';},
      bindOptions:function(){var v=window.__matrixVisualMods;if(!v)return;var c=v.getConfig();var t=document.getElementById('matrix-cross-type'),s=document.getElementById('matrix-cross-size'),sv=document.getElementById('matrix-cross-size-v'),en=document.getElementById('mxh-toggle'),rgb=document.getElementById('mxh-rgb');if(t){t.value=c.crosshairType||'dot';t.onchange=function(){v.setConfigValue('crosshairType',t.value);};}if(s){s.value=c.crosshairSize||10;if(sv)sv.textContent=s.value+'px';s.oninput=function(){if(sv)sv.textContent=s.value+'px';v.setConfigValue('crosshairSize',Number(s.value));};}if(en){en.textContent=c.crosshair?'Disable':'Enable';en.onclick=function(){v.toggleMod('crosshair');en.textContent=v.getConfig().crosshair?'Disable':'Enable';};}if(rgb){rgb.textContent=c.crosshairRGB?'Disable RGB':'Enable RGB';rgb.onclick=function(){v.toggleMod('crosshairRGB');rgb.textContent=v.getConfig().crosshairRGB?'Disable RGB':'Enable RGB';};}}
    },
    "visual-hud": {
      label: "Game HUD",
      renderOptions:function(){return '<div class="setting-row"><label>HUD</label><button class="opt-btn" id="m-hud-toggle">Toggle</button></div><div class="setting-row"><label>Position</label><select class="text-box" id="m-hud-pos"><option value="top-left">Top Left</option><option value="top-right">Top Right</option><option value="bottom-left">Bottom Left</option><option value="bottom-right">Bottom Right</option></select></div><div class="setting-row"><label>Font</label><select class="text-box" id="m-hud-font-local"></select></div><div class="setting-row"><label>Size</label><input class="text-box" type="range" id="m-hud-size-local" min="10" max="24"><span id="m-hud-size-v"></span></div><div class="setting-row"><label>RGB</label><button class="opt-btn" id="m-hud-rgb">Toggle</button></div>';},
      bindOptions:function(){var v=window.__matrixVisualMods;if(!v)return;var c=v.getConfig(),en=document.getElementById('m-hud-toggle'),pos=document.getElementById('m-hud-pos'),font=document.getElementById('m-hud-font-local'),size=document.getElementById('m-hud-size-local'),sv=document.getElementById('m-hud-size-v'),rgb=document.getElementById('m-hud-rgb');if(en){en.textContent=c.showHUD?'Disable':'Enable';en.onclick=function(){v.toggleMod('showHUD');en.textContent=v.getConfig().showHUD?'Disable':'Enable';};}if(pos){pos.value=c.hudPosition||'top-left';pos.onchange=function(){v.setConfigValue('hudPosition',pos.value);};}if(font){font.innerHTML=v.getFonts().map(function(f){return '<option value="'+f.name.replace(/"/g,'&quot;')+'">'+f.name+'</option>';}).join('');font.value=c.hudFont||'Arial';font.onchange=function(){v.setConfigValue('hudFont',font.value);};}if(size){size.value=c.hudFontSize||14;if(sv)sv.textContent=size.value+'px';size.oninput=function(){if(sv)sv.textContent=size.value+'px';v.setConfigValue('hudFontSize',Number(size.value));};}if(rgb){rgb.textContent=c.hudRGB?'Disable RGB':'Enable RGB';rgb.onclick=function(){v.setConfigValue('hudRGB',!v.getConfig().hudRGB);rgb.textContent=v.getConfig().hudRGB?'Disable RGB':'Enable RGB';};}}
    },
    "visual-fonts": {
      label: "Font Manager",
      renderOptions:function(){var fs=window.__matrixVisualMods&&window.__matrixVisualMods.getFonts?window.__matrixVisualMods.getFonts():[];return '<div class="setting-row"><label>Font</label><select class="text-box" id="matrix-font-select">'+fs.map(function(f){return '<option value="'+f.name.replace(/"/g,'&quot;')+'">'+f.name+'</option>';}).join('')+'</select></div><div class="setting-row"><label>Scope</label><select class="text-box" id="matrix-font-scope"><option value="matrix">Matrix UI only</option><option value="page">Game page UI</option></select></div><div class="setting-row" id="matrix-font-preview" style="font-size:22px;padding:10px">Matrix Client — Preview</div>';},
      bindOptions:function(){var apiV=window.__matrixVisualMods;if(!apiV)return;var c=apiV.getConfig(),f=document.getElementById('matrix-font-select'),s=document.getElementById('matrix-font-scope'),p=document.getElementById('matrix-font-preview');function update(){if(p){var a=apiV.getFonts().find(function(x){return x.name===(f?f.value:c.font);});p.style.fontFamily=a?a.family:'inherit';p.textContent=(f?f.value:c.font)+' — Matrix Client 123';}}if(f){f.value=c.font||'Arial';f.onchange=function(){apiV.setFont(f.value,s?s.value:undefined);update();};}if(s){s.value=c.fontScope||'matrix';s.onchange=function(){apiV.setFont(f?f.value:c.font,s.value);update();};}update();}
    },
    keystrokes: {
      label: "Keystrokes",
      renderOptions: function (s) {
        var showCPS =
          s["keystrokes.showCPS"] != null ? !!s["keystrokes.showCPS"] : true;
        var shadow =
          s["keystrokes.shadow"] != null ? !!s["keystrokes.shadow"] : true;
        var border =
          s["keystrokes.border"] != null ? !!s["keystrokes.border"] : false;
        var borderWidth =
          s["keystrokes.borderWidth"] != null ? s["keystrokes.borderWidth"] : 1;
        var borderColor = s["keystrokes.borderColor"] || "#ffffff";
        var scale = s["keystrokes.scale"] != null ? s["keystrokes.scale"] : 1.0;
        var bgColor = s["keystrokes.bgColor"] || "#00000088";
        var bgPress = s["keystrokes.bgPressColor"] || "#ffffff";
        var textColor = s["keystrokes.textColor"] || "#ffffff";
        var textPress = s["keystrokes.textPressColor"] || "#000000";

        function toggle(id, checked) {
          return (
            '<div class="opt-toggle">' +
            '  <input type="checkbox" id="' +
            id +
            '"' +
            (checked ? " checked" : "") +
            ">" +
            '  <label for="' +
            id +
            '"></label>' +
            "</div>"
          );
        }

        function colorInput(id, value) {
          return (
            '<input type="text" class="color-input" id="' +
            id +
            '" value="' +
            value +
            '">'
          );
        }

        return (
          '<div class="setting-row"><label>Show CPS</label>' +
          toggle("ks-showcps", showCPS) +
          "</div>" +
          '<div class="setting-row"><label>Box Shadow</label>' +
          toggle("ks-shadow", shadow) +
          "</div>" +
          '<div class="setting-row"><label>Border</label>' +
          toggle("ks-border", border) +
          "</div>" +
          '<div class="setting-row">' +
          "  <label>Border Width</label>" +
          '  <div class="setting-inline">' +
          '    <input type="range" id="ks-borderwidth" min="1" max="4" step="0.5" value="' +
          borderWidth +
          '">' +
          '    <div class="range-val" id="ks-borderwidth-val">' +
          borderWidth +
          "px</div>" +
          "  </div>" +
          "</div>" +
          '<div class="setting-row"><label>Border Colour</label>' +
          colorInput("ks-bordercolor", borderColor) +
          "</div>" +
          '<div class="setting-row">' +
          "  <label>Scale</label>" +
          '  <div class="setting-inline">' +
          '    <input type="range" id="ks-scale" min="0.5" max="2" step="0.05" value="' +
          scale +
          '">' +
          '    <div class="range-val" id="ks-scale-val">' +
          parseFloat(scale).toFixed(2) +
          "x</div>" +
          "  </div>" +
          "</div>" +
          '<div class="setting-row"><label>Background Colour</label>' +
          colorInput("ks-bg", bgColor) +
          "</div>" +
          '<div class="setting-row"><label>Background Colour (Pressed)</label>' +
          colorInput("ks-bgpress", bgPress) +
          "</div>" +
          '<div class="setting-row"><label>Text Colour</label>' +
          colorInput("ks-text", textColor) +
          "</div>" +
          '<div class="setting-row"><label>Text Colour (Pressed)</label>' +
          colorInput("ks-textpress", textPress) +
          "</div>" +
          '<div class="setting-row" style="margin-top:4px;">' +
          "  <label>Position</label>" +
          '  <div class="setting-inline">' +
          '    <button class="opt-btn" id="ks-editmode-btn">Edit Mode</button>' +
          '    <button class="opt-btn" id="ks-editmode-done" style="display:none;">Save</button>' +
          "  </div>" +
          "</div>"
        );
      },
      bindOptions: function (s) {
        function wire(id, key, transform) {
          var el = document.getElementById(id);
          if (!el) return;
          var event =
            el.type === "checkbox"
              ? "change"
              : el.type === "range"
                ? "input"
                : "change";
          el.addEventListener(event, function () {
            var v = transform ? transform(el) : el.value;
            s[key] = v;
            api.setSetting(key, v);
          });
        }
        wire("ks-showcps", "keystrokes.showCPS", function (el) {
          return el.checked;
        });
        wire("ks-shadow", "keystrokes.shadow", function (el) {
          return el.checked;
        });
        wire("ks-border", "keystrokes.border", function (el) {
          return el.checked;
        });

        var bwEl = document.getElementById("ks-borderwidth");
        var bwVal = document.getElementById("ks-borderwidth-val");
        if (bwEl && bwVal) {
          bwEl.addEventListener("input", function () {
            var v = parseFloat(bwEl.value);
            bwVal.textContent = v + "px";
            s["keystrokes.borderWidth"] = v;
            api.setSetting("keystrokes.borderWidth", v);
          });
        }

        var scEl = document.getElementById("ks-scale");
        var scVal = document.getElementById("ks-scale-val");
        if (scEl && scVal) {
          scEl.addEventListener("input", function () {
            var v = parseFloat(scEl.value);
            scVal.textContent = v.toFixed(2) + "x";
            s["keystrokes.scale"] = v;
            api.setSetting("keystrokes.scale", v);
          });
        }

        wire("ks-bordercolor", "keystrokes.borderColor", null);
        wire("ks-bg", "keystrokes.bgColor", null);
        wire("ks-bgpress", "keystrokes.bgPressColor", null);
        wire("ks-text", "keystrokes.textColor", null);
        wire("ks-textpress", "keystrokes.textPressColor", null);

        var editBtn = document.getElementById("ks-editmode-btn");
        var doneBtn = document.getElementById("ks-editmode-done");

        if (editBtn) {
          editBtn.addEventListener("click", function () {
            if (window.__matrixKsEditMode) window.__matrixKsEditMode(true);
            doneBtn.style.display = "";
            editBtn.style.display = "none";
          });
        }

        if (doneBtn) {
          doneBtn.addEventListener("click", function () {
            if (window.__matrixKsEditMode) window.__matrixKsEditMode(false);
            doneBtn.style.display = "none";
            editBtn.style.display = "";
          });
        }
      },
    },
    "minecraft-textures": {
      label: "Texture Pack",
      renderOptions: function () {
        return '<div class="setting-row"><label>Built-in packs</label><div id="matrix-texture-pack-list" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
          '<div class="setting-row"><button class="opt-btn" id="matrix-texture-reset">Disable Texture Pack</button><button class="opt-btn" id="matrix-texture-custom">Import TXT</button></div>' +
          '<div class="setting-row"><span style="font-size:11px;color:var(--grey-1)">Preview images are shown before you apply a pack. Applying a pack reloads MineFun for a clean restore.</span></div>';
      },
      bindOptions: function () {
        var list=document.getElementById('matrix-texture-pack-list');
        var reset=document.getElementById('matrix-texture-reset');
        var custom=document.getElementById('matrix-texture-custom');
        if(reset)reset.onclick=async function(){await window.electronAPI.resetTexturePack();};
        if(custom)custom.onclick=async function(){var p=await window.electronAPI.openFileDialog();if(p)await window.electronAPI.loadTexturePack(p);};
        if(!list||!window.electronAPI.getBuiltinTexturePacks)return;
        window.electronAPI.getBuiltinTexturePacks().then(function(items){
          list.innerHTML='';
          items.forEach(function(item){
            var card=document.createElement('div');
            card.style.cssText='display:flex;gap:9px;align-items:center;padding:8px;background:rgba(255,255,255,.03);border:1px solid var(--border-1);border-radius:8px';
            card.innerHTML='<img src="'+(item.previewDataUrl||'')+'" style="width:58px;height:58px;object-fit:cover;border-radius:5px;image-rendering:auto;background:#111"><div style="flex:1"><div style="font-weight:700;font-size:12px">'+String(item.name).replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:var(--grey-2)">'+String(item.creator||'Community').replace(/</g,'&lt;')+'</div></div><button class="opt-btn matrix-apply-pack">Apply</button>';
            card.querySelector('.matrix-apply-pack').onclick=async function(){var r=await window.electronAPI.loadBuiltinTexturePack(item.id);if(r&&!r.ok)alert(r.error||'Could not apply texture pack.');};
            list.appendChild(card);
          });
          if(!items.length)list.innerHTML='<span style="font-size:11px;color:var(--grey-2)">No built-in packs found.</span>';
        }).catch(function(){list.innerHTML='<span style="font-size:11px;color:#f88">Failed to load packs.</span>';});
      }
    },
    "advanced-mods": {
      label: "Advanced Mods",
      renderOptions: function () {
        return '<div class="setting-row"><label>Advanced mod system</label><span style="font-size:12px;color:var(--grey-1)">Online community mod bundle</span></div>' +
          '<div class="setting-row"><span style="font-size:11px;color:var(--grey-2)">Loads the latest available advanced bundle online when enabled.</span></div>';
      },
      bindOptions: function () {}
    },

  };

  function zoomLabel(v) {
    return (1 / parseFloat(v)).toFixed(1) + "x";
  }

  function fmtKey(code) {
    if (!code) return "?";
    return code
      .replace("Key", "")
      .replace("Digit", "")
      .replace(/Left$/, "")
      .replace(/Right$/, "");
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function esc(v) {
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function q(sel) {
    return document.querySelector(sel);
  }

  function qq(sel) {
    return document.querySelectorAll(sel);
  }

  var settings = {};

  var menuOpen = false;

  var root = document.getElementById("__matrix_root");
  var menuEl = document.getElementById("matrix-menu");
  var searchEl = document.getElementById("matrix-search");
  var closeBtn = document.getElementById("matrix-close");
  var optPanel = document.getElementById("matrix-options-panel");
  var optTitle = document.getElementById("matrix-options-title");
  var optBody = document.getElementById("matrix-options-body");
  var optBack = document.getElementById("matrix-options-back");

  if (!menuEl) {
    console.error("[Matrix] menu element not found");
    return;
  }

  // Prevent MineFun's global input/click handlers from swallowing Matrix UI input.
  // We intentionally do not call preventDefault(), so sliders/selects/buttons keep
  // their native browser behavior.
  ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick", "contextmenu"].forEach(function (type) {
    menuEl.addEventListener(type, function (e) {
      e.stopPropagation();
    });
  });
  menuEl.addEventListener("wheel", function (e) { e.stopPropagation(); });

  // Visual/community features are injected immediately after menu.js by Electron.
  // Listen for their ready events so the cards are wired as soon as their API exists.
  window.addEventListener("matrix-visual-ready", function () {
    try { refreshVisualCards(); } catch (e) { console.warn("[Matrix] visual card refresh failed:", e); }
  });
  window.addEventListener("matrix-community-ready", function () {
    try { initCards(); } catch (e) { console.warn("[Matrix] community card refresh failed:", e); }
  });

  api
    .getSettings()
    .then(function (s) {
      settings = s || {};
      initMatrixExpandedSuiteCards();
      initCards();
      initSearch();
      initTabs();
      initOptions();
      initCloseBtn();
      initMenuKey();
      initClientSettings();
      console.log("[Matrix] Menu ready");
    })
    .catch(function (err) {
      console.error("[Matrix] Failed to load settings:", err);
    });


  function initMatrixExpandedSuiteCards() {
    var suite = window.MatrixCelestarSuite;
    var panel = document.getElementById("matrix-mods-panel");
    if (!suite || !panel) return;
    if (document.getElementById("matrix-celestar-suite-section")) return;

    var section = document.createElement("div");
    section.id = "matrix-celestar-suite-section";
    section.className = "matrix-suite-section";
    section.innerHTML =
      '<div class="matrix-suite-heading"><span>Expanded Mods</span><span class="matrix-suite-badge">28 MODS</span></div>' +
      '<div class="matrix-suite-subtitle">Advanced gameplay, HUD and visual controls</div>';
    var grid = document.createElement("div");
    grid.className = "matrix-suite-grid";
    section.appendChild(grid);

    function labelize(k) {
      return String(k).replace(/([a-z])([A-Z])/g,"$1 $2").replace(/[-_]/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});
    }
    function escVal(v){ return esc(String(v == null ? "" : v)); }
    function isBool(v){ return typeof v === "boolean"; }
    function isNum(v){ return typeof v === "number" && isFinite(v); }

    function renderOptions(id) {
      var cfg = suite.config[id] || {};
      var html = '<div class="mod-description">Independent Matrix implementation of this expanded mod.</div>';
      Object.keys(cfg).forEach(function(key){
        var v = cfg[key];
        if (key === "enabled") return;
        var full = id + "." + key;
        if (isBool(v)) {
          html += '<div class="setting-row"><label>' + esc(labelize(key)) + '</label><div class="opt-toggle"><input type="checkbox" id="mxs-' + esc(id+'-'+key) + '" data-mxs-path="' + esc(full) + '"' + (v ? ' checked' : '') + '><label for="mxs-' + esc(id+'-'+key) + '"></label></div></div>';
        } else if (isNum(v)) {
          var min = key.toLowerCase().includes('opacity') ? 0.1 : (key === 'scale' ? 0.5 : 0);
          var max = key.toLowerCase().includes('opacity') ? 1 : (key.includes('size') ? 128 : (key === 'x' || key === 'y' ? 1000 : 10));
          if (v > max) max = Math.ceil(v * 1.5);
          var step = Number.isInteger(v) ? 1 : 0.05;
          html += '<div class="setting-row"><label>' + esc(labelize(key)) + '</label><div class="setting-inline"><input type="range" id="mxs-' + esc(id+'-'+key) + '" data-mxs-path="' + esc(full) + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"><div class="range-val" id="mxsv-' + esc(id+'-'+key) + '">' + escVal(v) + '</div></div></div>';
        } else if (typeof v === "string") {
          var isColor = /^#[0-9a-f]{6,8}$/i.test(v);
          if (isColor) {
            html += '<div class="setting-row"><label>' + esc(labelize(key)) + '</label><input type="color" id="mxs-' + esc(id+'-'+key) + '" data-mxs-path="' + esc(full) + '" value="' + esc(v.slice(0,7)) + '" style="width:54px;height:30px;background:transparent;border:0"></div>';
          } else if (key.toLowerCase().includes("keybind")) {
            html += '<div class="setting-row"><label>' + esc(labelize(key)) + '</label><div class="keybind-box" id="mxs-' + esc(id+'-'+key) + '" data-mxs-path="' + esc(full) + '">' + escVal(v) + '</div></div>';
          } else {
            html += '<div class="setting-row"><label>' + esc(labelize(key)) + '</label><input class="text-box" type="text" id="mxs-' + esc(id+'-'+key) + '" data-mxs-path="' + esc(full) + '" value="' + esc(v) + '"></div>';
          }
        }
      });
      return html;
    }

    function bindOptions(id) {
      if (!optBody) return;
      var cfg = suite.config[id] || {};
      qq('#matrix-options-body [data-mxs-path]').forEach(function(el){
        var path = el.getAttribute('data-mxs-path');
        var key = path.split('.').slice(1).join('.');
        var initial = cfg[key];
        if (el.type === 'checkbox') {
          el.onchange = function(){ suite.set(path, !!el.checked); };
        } else if (el.type === 'range') {
          var val = document.getElementById(el.id.replace(/^mxs-/,'mxsv-'));
          el.oninput = function(){ var n=parseFloat(el.value); if(val) val.textContent=String(n); suite.set(path,n); };
        } else if (el.type === 'color') {
          el.oninput = function(){ suite.set(path, el.value); };
        } else if (el.classList.contains('keybind-box')) {
          var listening=false;
          el.onclick=function(){ listening=true; el.classList.add('listening'); el.textContent='Press a key…'; };
          var handler=function(e){ if(!listening)return; e.preventDefault(); listening=false; el.classList.remove('listening'); el.textContent=fmtKey(e.code); suite.set(path,e.code); };
          document.addEventListener('keydown',handler);
        } else {
          el.onchange = function(){ suite.set(path, el.value); };
        }
      });
    }

    suite.listMods().forEach(function(mod){
      var id=mod.id, name=mod.name, category=mod.category;
      var card=document.createElement("div");
      card.className="card matrix-expanded-card";
      card.dataset.mod="celestar-"+id;
      card.innerHTML='<div class="name">'+esc(name)+'</div><div class="suite-category">'+esc(category)+'</div><div class="card-btn"><button class="options">Options</button><button class="toggle-btn">Disabled</button></div>';
      var toggle=card.querySelector('.toggle-btn');
      var options=card.querySelector('.options');
      function sync(){
        var on=!!suite.get(id+'.enabled');
        toggle.textContent=on?'Enabled':'Disabled';
        card.classList.toggle('enabled',on);
      }
      toggle.addEventListener('click',function(e){e.stopPropagation();suite.set(id+'.enabled',!suite.get(id+'.enabled'));sync();});
      options.addEventListener('click',function(e){
        e.stopPropagation();
        optTitle.textContent=name;
        optBody.innerHTML=renderOptions(id);
        optPanel.classList.add('open');
        bindOptions(id);
      });
      sync();
      grid.appendChild(card);
    });
    panel.appendChild(section);
  }

  var visualCardsWired = false;
  function refreshVisualCards() {
    if (!settings) return;
    qq('#matrix-menu .card.matrix-visual-mod').forEach(function(card){ card.dataset.visualRetry=''; });
    initCards();
  }

  function initCards() {
    qq("#matrix-menu .card").forEach(function (card) {
      var mod = card.dataset.mod;
      if (!mod) return;

      if (mod.indexOf("visual-") === 0 || mod === "minecraft-textures" || mod === "advanced-mods") {
        if (mod === "advanced-mods") {
          var advBtn = card.querySelector(".toggle-btn");
          var advOpt = card.querySelector(".options");
          var advEnabled = !!settings["advanced-mods.enabled"];
          function syncAdvanced(){
            if(advBtn) advBtn.textContent = advEnabled ? "Enabled" : "Disabled";
            card.classList.toggle("matrix-visual-on", advEnabled);
            card.classList.toggle("enabled", advEnabled);
          }
          syncAdvanced();
          if(advBtn && card.dataset.advancedWired !== "1"){
            card.dataset.advancedWired="1";
            advBtn.addEventListener("click", async function(){
              var r=await window.electronAPI.toggleAdvancedMods();
              if(r && r.ok){
                advEnabled=!!r.enabled;
                settings["advanced-mods.enabled"]=advEnabled;
                syncAdvanced();
              } else if(r && r.error) {
                advEnabled=false;
                settings["advanced-mods.enabled"]=false;
                api.setSetting("advanced-mods.enabled", false);
                syncAdvanced();
                alert(r.error);
              }
            });
          }
          if(advOpt) advOpt.addEventListener("click", function(){ openOptions(mod); });
          return;
        }
        if (mod === "minecraft-textures") {
          var packBtn = card.querySelector(".toggle-btn");
          var packOpts = card.querySelector(".options");
          var packEnabled = !!(settings["minecraft-pack.enabled"]);
          window.__matrixMinecraftPackEnabled = packEnabled;
          function syncPack(){ if(packBtn) packBtn.textContent = window.__matrixMinecraftPackEnabled ? "Enabled" : "Disabled"; card.classList.toggle("matrix-visual-on", !!window.__matrixMinecraftPackEnabled); card.classList.toggle("enabled", !!window.__matrixMinecraftPackEnabled); }
          syncPack();
          if(packBtn) packBtn.addEventListener("click", async function(){
            var r = await window.electronAPI.toggleMinecraftPack();
            if(r && r.ok){ window.__matrixMinecraftPackEnabled = !!r.enabled; settings["minecraft-pack.enabled"] = !!r.enabled; syncPack(); }
          });
          if(packOpts) packOpts.addEventListener("click", function(){ openOptions(mod); });
          return;
        }
        var v = window.__matrixVisualMods;
        if (!v) { setTimeout(function(){ if(window.__matrixVisualMods){ refreshVisualCards(); } }, 300); return; }
        var keyMap = {
          "visual-shader": "shader", "visual-dark": "dark", "visual-fullbright": "fullBright", "visual-galaxy": "galaxy",
          "visual-weather": "weather", "visual-screen": "screenEffects", "visual-flashlight": "flashlight", "visual-crosshair": "crosshair", "visual-hud": "showHUD"
        };
        var key = keyMap[mod];
        var btn = card.querySelector(".toggle-btn");
        if (card.dataset.visualWired === '1') return;
        card.dataset.visualWired = '1';
        function isOn(){ var c=v.getConfig(); if(key==="shader") return c.shader && c.shader!=="none"; if(key==="dark") return c.darkLevel>0; if(key==="weather") return !!(c.rain||c.lava||c.lightning); return !!c[key]; }
        function setText(){ if(btn) btn.textContent=isOn()?"Enabled":"Disabled"; card.classList.toggle("matrix-visual-on", isOn()); card.classList.toggle("enabled", isOn()); }
        setText();
        if(btn){ btn.addEventListener("click",function(){
          if(mod==="visual-shader"){ var c=v.getConfig(); v.setShaderMode(c.shader&&c.shader!=="none"?"none":"realistic-high"); }
          else if(mod==="visual-dark"){ var c=v.getConfig(); v.setDarkMode(c.darkLevel>0?false:true,60); }
          else if(mod==="visual-weather"){ var c=v.getConfig(); var on=!(c.rain||c.lava||c.lightning); v.setMod("rain",on); v.setMod("lava",on); v.setMod("lightning",on); }
          else { v.toggleMod(key); }
          setText();
        });}
        var opt=card.querySelector(".options"), def=MODS[mod];
        if(opt && def && typeof def.renderOptions === "function") opt.addEventListener("click",function(){openOptions(mod);}); else if(opt) opt.style.display="none";
        return;
      }
      setEnabled(mod, !!settings[mod + ".enabled"]);
      if (card.dataset.matrixWired === "1") return;
      card.dataset.matrixWired = "1";

      var toggleBtn = card.querySelector(".toggle-btn");

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var now = !settings[mod + ".enabled"];
          settings[mod + ".enabled"] = now;
          setEnabled(mod, now);
          api.setSetting(mod + ".enabled", now);
          if (mod === "clean-screen" && window.__matrixExtraMods) window.__matrixExtraMods.setCleanScreen(now);
          if (mod === "smooth-camera" && window.__matrixExtraMods) window.__matrixExtraMods.setSmoothCamera(now);
          if (mod === "cinematic-fx" && window.__matrixExtraMods) window.__matrixExtraMods.setCinematic(now);
          if (mod === "mouse-trail" && window.__matrixCommunityMods) window.__matrixCommunityMods.setMouseTrail(now);
          if (mod === "stopwatch" && window.__matrixCommunityMods) window.__matrixCommunityMods.setStopwatch(now);
          if (mod === "display-enhancer" && window.__matrixCommunityMods) window.__matrixCommunityMods.setDisplayEnhancer(now);
          if (mod === "visual-keyboard" && window.__matrixCommunityMods) window.__matrixCommunityMods.setVisualKeyboard(now);
          if (mod === "fps-counter" && window.__matrixCommunityMods) window.__matrixCommunityMods.setFPSCounter(now);
        });
      }

      var optBtn = card.querySelector(".options");

      if (optBtn) {
        var def = MODS[mod];

        if (!def || typeof def.renderOptions !== "function") {
          optBtn.style.display = "none";
        } else {
          optBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            openOptions(mod);
          });
        }
      }
    });
  }

  function initClientSettings() {
    (function addMatrixTools(){
      var panel = document.getElementById("matrix-settings-panel");
      if (!panel || panel.querySelector("#matrix-tools-row")) return;
      var wrap = document.createElement("div");
      wrap.id = "matrix-tools-row";
      wrap.style.cssText = "margin-top:12px;padding-top:10px;border-top:1px solid var(--border-1);display:flex;gap:8px;flex-wrap:wrap";
      wrap.innerHTML = '<button class="opt-btn" id="matrix-restart-btn">Restart Client</button><button class="opt-btn" id="matrix-update-btn">Check for Updates</button>';
      panel.appendChild(wrap);
      var restart = document.getElementById("matrix-restart-btn");
      var update = document.getElementById("matrix-update-btn");
      if (restart) restart.onclick = function(){ if(window.electronAPI) window.electronAPI.restartClient(); };
      if (update) update.onclick = function(){ if(window.electronAPI) window.electronAPI.launchUpdater(); };
    })();

    function initStartupOpening() {
      var modeEl = document.getElementById("startup-opening-mode");
      var useMatrix = document.getElementById("startup-use-matrix");
      var importBtn = document.getElementById("startup-import-video");
      var onlineBtn = document.getElementById("startup-online-opening");
      var resetBtn = document.getElementById("startup-reset-original");
      var statusEl = document.getElementById("startup-opening-status");
      if (!modeEl || !useMatrix || !importBtn || !resetBtn) return;

      function modeFromSettings() {
        if (!settings["startup.custom.enabled"]) return "original";
        if (settings["startup.custom.preset"] === "imported") return "imported";
        if (settings["startup.custom.preset"] === "remote") return "remote";
        return "matrix";
      }

      function refreshStatus() {
        var mode = modeFromSettings();
        modeEl.value = mode;
        if (!statusEl) return;
        if (mode === "original") statusEl.textContent = "Original opening is active.";
        else if (mode === "matrix") statusEl.textContent = "Matrix Custom opening is active. Restart the client to preview it.";
        else if (mode === "imported") statusEl.textContent = "Imported opening is active. Restart the client to preview it.";
        else statusEl.textContent = settings["startup.remote.id"] ? "Online custom opening is selected. Restart the client to preview it." : "Choose an online opening first.";
      }

      useMatrix.onclick = function () {
        settings["startup.custom.enabled"] = true;
        settings["startup.custom.preset"] = "matrix";
        settings["startup.custom.path"] = "";
        api.setSetting("startup.custom.enabled", true);
        api.setSetting("startup.custom.preset", "matrix");
        api.setSetting("startup.custom.path", "");
        refreshStatus();
      };

      importBtn.onclick = async function () {
        if (!api.importStartupVideo) return;
        var result = await api.importStartupVideo();
        if (result && result.ok) {
          settings["startup.custom.enabled"] = true;
          settings["startup.custom.preset"] = "imported";
          settings["startup.custom.path"] = result.path || "";
          api.setSetting("startup.custom.enabled", true);
          api.setSetting("startup.custom.preset", "imported");
          api.setSetting("startup.custom.path", result.path || "");
          refreshStatus();
        }
      };

      if (onlineBtn) onlineBtn.onclick = async function () {
        if (!api.getOnlineOpenings) return;
        var catalog = await api.getOnlineOpenings();
        var items = (catalog && catalog.openings) || [];
        if (!items.length) { if (statusEl) statusEl.textContent = "No online openings are available."; return; }
        var names = items.map(function(o, i){ return (i + 1) + ". " + (o.name || o.id || "Opening"); }).join("\n");
        var choice = prompt("Choose an online opening by number:\n\n" + names, "1");
        var index = parseInt(choice || "", 10) - 1;
        if (index < 0 || index >= items.length) return;
        var picked = items[index];
        settings["startup.custom.enabled"] = true;
        settings["startup.custom.preset"] = "remote";
        settings["startup.remote.enabled"] = true;
        settings["startup.remote.id"] = picked.id || "";
        api.setSetting("startup.custom.enabled", true);
        api.setSetting("startup.custom.preset", "remote");
        api.setSetting("startup.remote.enabled", true);
        api.setSetting("startup.remote.id", picked.id || "");
        refreshStatus();
      };

      resetBtn.onclick = async function () {
        settings["startup.custom.enabled"] = false;
        settings["startup.custom.path"] = "";
        settings["startup.custom.preset"] = "matrix";
        settings["startup.remote.enabled"] = false;
        settings["startup.remote.id"] = "";
        if (api.resetStartupVideo) await api.resetStartupVideo();
        api.setSetting("startup.custom.enabled", false);
        api.setSetting("startup.custom.path", "");
        api.setSetting("startup.custom.preset", "matrix");
        api.setSetting("startup.remote.enabled", false);
        api.setSetting("startup.remote.id", "");
        refreshStatus();
      };


      modeEl.onchange = async function () {
        if (modeEl.value === "original") await resetBtn.onclick();
        else if (modeEl.value === "matrix") useMatrix.onclick();
        else if (modeEl.value === "imported") importBtn.onclick();
        else if (modeEl.value === "remote" && onlineBtn) onlineBtn.onclick();
      };
      refreshStatus();
    }

    initStartupOpening();

    var kbBtn = document.getElementById("client-keybind-btn");
    var btnMain = document.getElementById("btn-main");
    var btnSandbox = document.getElementById("btn-sandbox");

    if (!kbBtn || !btnMain || !btnSandbox) return;

    function fmtKeybind(code) {
      if (!code) return "G";
      return code
        .replace("Key", "")
        .replace("Digit", "")
        .replace(/Left$/, "")
        .replace(/Right$/, "");
    }

    var currentKeybind = settings["client.keybind"] || "KeyG";
    kbBtn.textContent = fmtKeybind(currentKeybind);

    var listeningKb = false;
    kbBtn.addEventListener("click", function () {
      listeningKb = true;
      kbBtn.textContent = "Press a key…";
    });

    document.addEventListener("keydown", function (e) {
      if (!listeningKb) return;
      e.preventDefault();
      listeningKb = false;
      currentKeybind = e.code;
      kbBtn.textContent = fmtKeybind(e.code);
      kbBtn.style.borderColor = "";
      kbBtn.style.color = "";
      settings["client.keybind"] = e.code;
      api.setSetting("client.keybind", e.code);
      menuKeybind = e.code;
    });

    var isSandbox = !!settings["client.sandbox"];

    function updateSiteBtns() {
      btnMain.style.background = !isSandbox
        ? "var(--background-3)"
        : "var(--background-1)";
      btnMain.style.color = !isSandbox ? "var(--white)" : "var(--grey-2)";
      btnSandbox.style.background = isSandbox
        ? "var(--background-3)"
        : "var(--background-1)";
      btnSandbox.style.color = isSandbox ? "var(--white)" : "var(--grey-2)";
    }

    updateSiteBtns();
    var fsEl = document.getElementById("client-autofullscreen-btn");
    if (fsEl) {
      var fsOn =
        settings["client.autofullscreen"] != null
          ? !!settings["client.autofullscreen"]
          : true;
      fsEl.checked = fsOn;
      fsEl.addEventListener("change", function () {
        settings["client.autofullscreen"] = fsEl.checked;
        api.setSetting("client.autofullscreen", fsEl.checked);
      });
    }

    btnMain.addEventListener("click", function () {
      if (!isSandbox) return;
      isSandbox = false;
      updateSiteBtns();
      settings["client.sandbox"] = false;
      api.switchSite(false);
    });

    btnSandbox.addEventListener("click", function () {
      if (isSandbox) return;
      isSandbox = true;
      updateSiteBtns();
      settings["client.sandbox"] = true;
      api.switchSite(true);
    });
  }

  function setEnabled(mod, on) {
    var card = q("#matrix-menu .card[data-mod='" + mod + "']");
    var toggleBtn = card ? card.querySelector(".toggle-btn") : null;
    if (card) card.classList.toggle("enabled", on);
    if (toggleBtn) toggleBtn.textContent = on ? "Enabled" : "Disabled";
  }

  function initOptions() {
    if (optBack) {
      optBack.addEventListener("click", function () {
        closeOptions();
      });
    }
  }

  function openOptions(mod) {
    var def = MODS[mod];
    if (!def || !optPanel || !optTitle || !optBody) return;
    optTitle.textContent = def.label;
    optBody.innerHTML = def.renderOptions(settings);
    def.bindOptions(settings);
    optPanel.classList.add("open");
  }

  function closeOptions() {
    if (optPanel) optPanel.classList.remove("open");
    if (optBody) optBody.innerHTML = "";
  }

  function initSearch() {
    if (!searchEl) return;

    searchEl.addEventListener("input", function () {
      var q_ = searchEl.value.toLowerCase().trim();

      qq("#matrix-menu .card").forEach(function (card) {
        var nameEl = card.querySelector(".name");
        if (!nameEl) return;
        var match = !q_ || nameEl.textContent.toLowerCase().includes(q_);
        card.style.display = match ? "" : "none";
      });
    });
  }

  // Initialize the MMMD panel.
  // The panel is already rendered in menu.html; this function intentionally
  // keeps the initialization lightweight and must always exist so tab setup
  // can continue even when optional MMMD data is unavailable.
  function initMMMDPanel() {
    var panel = document.getElementById("matrix-mmmd-panel");
    if (!panel) return;

    // Keep the static values from menu.html unless a future data source
    // provides real player statistics.
    var playtime = document.getElementById("mmmd-playtime");
    var points = document.getElementById("mmmd-points");
    var rank = document.getElementById("mmmd-rank");
    var fan = document.getElementById("mmmd-fan");

    if (playtime && !playtime.textContent.trim()) playtime.textContent = "0h 0m";
    if (points && !points.textContent.trim()) points.textContent = "0";
    if (rank && !rank.textContent.trim()) rank.textContent = "New Player";
    if (fan && !fan.textContent.trim()) fan.textContent = "Not verified";
  }

  function initTabs() {
    var modsPanel = document.getElementById("matrix-mods-panel");
    var settingsPanel = document.getElementById("matrix-settings-panel");
    var mmmdPanel = document.getElementById("matrix-mmmd-panel");
    var toolbar = document.querySelector("#matrix-menu .toolbar");
    initMMMDPanel();

    qq("#matrix-menu .tab").forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.stopPropagation();
        qq("#matrix-menu .tab").forEach(function (t) {
          t.classList.remove("active");
        });
        tab.classList.add("active");

        var isSettings = tab.dataset.tab === "settings";
        var isMMMD = tab.dataset.tab === "mmmd";

        if (modsPanel) modsPanel.style.display = (isSettings || isMMMD) ? "none" : "";
        if (settingsPanel) settingsPanel.style.display = isSettings ? "flex" : "none";
        if (mmmdPanel) mmmdPanel.style.display = isMMMD ? "block" : "none";
        if (toolbar) toolbar.style.display = (isSettings || isMMMD) ? "none" : "";
      });
    });
  }

  function initCloseBtn() {
    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeMenu();
      });
    }
  }

  function openMenu() {
    menuOpen = true;
    menuEl.classList.add("open");
    window.__mfSettings.zoomHeld = false;
  }

  function closeMenu() {
    menuOpen = false;
    menuEl.classList.remove("open");
    closeOptions();
    if (searchEl) searchEl.value = "";
  }

  var menuKeybind = "KeyG";

  function initMenuKey() {
    menuKeybind = settings["client.keybind"] || "KeyG";

    // The Electron main process handles the hotkey before MineFun can consume it.
    // Keep a renderer fallback for browser/dev environments.
    document.addEventListener("keydown", function (e) {
      if (e.code !== menuKeybind) return;
      var active = document.activeElement;
      var isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
      if (isInput) return;
      e.preventDefault();
      if (e.__matrixHandled) return;
      e.__matrixHandled = true;
      if (menuOpen) closeMenu(); else openMenu();
    }, true);
  }
  window.__matrixMenuToggle = function(){ if(menuOpen) closeMenu(); else openMenu(); };
  setTimeout(function(){ try { initMatrixExpandedSuiteCards(); } catch (e) { console.warn("[Matrix] Expanded suite card init failed:", e); } }, 250);
})();
