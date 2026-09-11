/*
 * Matrix Client — Expanded Mod Suite
 *
 * Independent implementation inspired by the feature set publicly visible in
 * the supplied Celestar Mod Menu reference. This file does not contain copied
 * Celestar source code.
 *
 * Integrates with the Matrix Client menu through:
 *   window.MatrixCelestarSuite
 *
 * All settings are stored in localStorage under "matrix-celestar-suite-v1".
 */
(() => {
  "use strict";

  const STORAGE = "matrix-celestar-suite-v1";
  const VERSION = 1;

  const DEFAULTS = {
    zoom: { enabled:false, level:3.0, smooth:true, scrollable:true, keybind:"KeyV" },
    crosshair: { enabled:false, url:"", size:32, opacity:1 },
    keystrokes: {
      enabled:true, leftCps:false, rightCps:false, onlyInGame:false,
      rainbow:false, pressAnimation:true, shadow:true, border:false,
      borderWidth:1, borderRadius:4, scale:1, keyColor:"#000000aa",
      pressedColor:"#ffffff", textColor:"#ffffff", pressedTextColor:"#000000",
      borderColor:"#ffffff", x:20, y:180
    },
    directionhud: { enabled:false, size:1 },
    autogg: { enabled:false },
    textures: { enabled:false, pack:{} },
    hidearm: { enabled:false },
    fps: {
      enabled:false, x:20, y:20, scale:1,
      backgroundColor:"#000000aa", border:true, borderColor:"#ffffff",
      borderWidth:1, borderRadius:6, shadow:true, labelColor:"#e6f1ff",
      highColor:"#39d98a", mediumColor:"#f0b429", lowColor:"#ff6b6b"
    },
    cps: {
      enabled:false, x:20, y:55, scale:1,
      backgroundColor:"#000000aa", border:true, borderColor:"#ffffff",
      borderWidth:1, borderRadius:6, shadow:true, labelColor:"#e6f1ff",
      numberColor:"#ffffff", showBothMouses:false
    },
    clearscreen: { enabled:false, keybind:"KeyH" },
    translator: { enabled:false, language:"en" },
    kdrindicator: { enabled:false },
    damagevignette: { enabled:false, color:"#ff0000" },
    armorhud: { enabled:false },
    blockoutline: { enabled:false, color:"#81e1ff" },
    nofog: { enabled:false },
    hidenametag: { enabled:false },
    hurtcam: { enabled:false },
    togglecrouch: { enabled:false, keybind:"KeyC" },
    hideparticles: {
      enabled:false, blood:false, smoke:false, blocks:false, hit:false,
      arrow:false, brokenHeart:false, death:false, brokenShield:false,
      energy:false, flame:false, gem:false, goldCoin:false, heart:false,
      impactBurst:false, medCross:false, poison:false, shield:false,
      slashCross:false, star:false, waterBubbles:false, waterDrop:false,
      slowness:false, strength:false, weakness:false, jumpBoost:false,
      miningSpeed:false, miningFatigue:false, invisibility:false,
      nightVision:false, skull:false
    },
    hideclouds: { enabled:false },
    bedwarsnotif: { enabled:false, bedDestroy:true, teamEliminated:true },
    armoffset: { enabled:false, y:0 },
    scoreboard: { enabled:false, x:92, y:20, backgroundColor:"#000000dd", borderColor:"#121212" },
    chatemojis: { enabled:false },
    guiscale: { enabled:false, hotbar:100, inventory:100 },
    actionbar: { enabled:false, x:50, y:80, backgroundColor:"#000000aa", borderColor:"#121212" },
    customui: { enabled:false, css:"", name:"" },
  };

  const MOD_META = [
    ["zoom","Zoom","utilities"],
    ["crosshair","Crosshair","visuals"],
    ["keystrokes","Keystrokes","hud"],
    ["directionhud","Direction HUD","hud"],
    ["autogg","Auto GG","utilities"],
    ["textures","Texture Pack","visuals"],
    ["hidearm","Hide Arm","visuals"],
    ["fps","FPS","hud"],
    ["cps","CPS","hud"],
    ["clearscreen","Clear Screen","visuals"],
    ["translator","Chat Translator","utilities"],
    ["kdrindicator","KDR Indicator","hud"],
    ["damagevignette","Damage Color","visuals"],
    ["armorhud","Armor HUD","hud"],
    ["blockoutline","Block Outline","visuals"],
    ["nofog","Hide Fog","visuals"],
    ["hidenametag","Hide Nametags","visuals"],
    ["hurtcam","Hurt Cam","visuals"],
    ["togglecrouch","Toggle Crouch","utilities"],
    ["hideparticles","Hide Particles","visuals"],
    ["hideclouds","Hide Clouds","visuals"],
    ["bedwarsnotif","Bedwars Notifications","utilities"],
    ["armoffset","Arm Position","visuals"],
    ["scoreboard","Scoreboard","hud"],
    ["chatemojis","Chat Emojis","utilities"],
    ["guiscale","GUI Scale","hud"],
    ["actionbar","Action Bar","hud"],
    ["customui","Custom UI","hud"]
  ];

  const clone = (v) => {
    if (Array.isArray(v)) return v.map(clone);
    if (v && typeof v === "object") {
      const o={}; for(const k of Object.keys(v)) o[k]=clone(v[k]); return o;
    }
    return v;
  };

  function loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      const merged = clone(DEFAULTS);
      for (const key of Object.keys(merged)) {
        if (saved[key] && typeof saved[key] === "object") {
          merged[key] = { ...merged[key], ...saved[key] };
        }
      }
      return merged;
    } catch (_) {
      return clone(DEFAULTS);
    }
  }

  let config = loadConfig();
  const listeners = new Set();

  function save() {
    localStorage.setItem(STORAGE, JSON.stringify(config));
  }

  function get(path) {
    const parts=path.split(".");
    let cur=config;
    for(const p of parts) cur=cur?.[p];
    return cur;
  }

  function set(path,value) {
    const parts=path.split(".");
    let cur=config;
    for(let i=0;i<parts.length-1;i++) cur=cur[parts[i]];
    cur[parts.at(-1)]=value;
    save();
    for(const fn of listeners) { try { fn(path,value); } catch(_) {} }
    applyAll();
  }

  const api = {
    version: VERSION,
    get config(){ return clone(config); },
    get,
    set,
    reset(){
      config=clone(DEFAULTS); save(); applyAll();
      for(const fn of listeners) { try { fn("*",null); } catch(_) {} }
    },
    onChange(fn){ listeners.add(fn); return ()=>listeners.delete(fn); },
    listMods(){ return MOD_META.map(([id,name,category])=>({id,name,category})); }
  };

  window.MatrixCelestarSuite = api;

  const UTIL = {
    qs(s,r=document){return r.querySelector(s)},
    qsa(s,r=document){return [...r.querySelectorAll(s)]},
    clamp(n,a,b){return Math.max(a,Math.min(b,n))},
    esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))},
    style(id,css){
      let e=document.getElementById(id);
      if(!e){e=document.createElement("style");e.id=id;document.head.appendChild(e)}
      e.textContent=css; return e;
    },
    isGame(){
      return !!document.querySelector("canvas") && !document.querySelector(".home");
    },
    notify(title,text){
      let box=document.getElementById("__matrix_celestar_toast");
      if(!box){box=document.createElement("div");box.id="__matrix_celestar_toast";box.style.cssText="position:fixed;right:18px;bottom:18px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;pointer-events:none;font:12px Inter,Arial,sans-serif";document.body.appendChild(box)}
      const el=document.createElement("div");
      el.style.cssText="min-width:210px;max-width:320px;padding:10px 12px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:rgba(12,14,18,.94);color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.35)";
      el.innerHTML=`<b>${UTIL.esc(title)}</b><div style="opacity:.72;margin-top:3px">${UTIL.esc(text)}</div>`;
      box.appendChild(el); setTimeout(()=>el.remove(),2600);
    },
    setHTML(id,html){const e=document.getElementById(id); if(e)e.innerHTML=html},
  };

  function ensureLayer(id,z=2147483000){
    let el=document.getElementById(id);
    if(!el){
      el=document.createElement("div"); el.id=id;
      el.style.cssText=`position:fixed;inset:0;pointer-events:none;z-index:${z}`;
      document.body.appendChild(el);
    }
    return el;
  }

  // ---------- Zoom ----------
  let zoomHeld=false, zoomTarget=1, zoomCurrent=1, originalCanvasTransform="";
  function applyZoom(){
    const canvas=document.querySelector("canvas#game, canvas.game, canvas");
    if(!canvas){return}
    const level=get("zoom.enabled") && zoomHeld ? get("zoom.level") : 1;
    zoomTarget=1/UTIL.clamp(level,1,6);
    const smooth=!!get("zoom.smooth");
    zoomCurrent=smooth ? zoomCurrent+(zoomTarget-zoomCurrent)*0.18 : zoomTarget;
    if(Math.abs(zoomCurrent-zoomTarget)<0.0005) zoomCurrent=zoomTarget;
    canvas.style.transformOrigin="center center";
    canvas.style.transform=zoomCurrent===1?originalCanvasTransform:`scale(${zoomCurrent})`;
  }
  function initZoom(){
    document.addEventListener("keydown",e=>{
      if(e.code===get("zoom.keybind") && !e.repeat){zoomHeld=true}
    },true);
    document.addEventListener("keyup",e=>{
      if(e.code===get("zoom.keybind")) zoomHeld=false;
    },true);
    document.addEventListener("wheel",e=>{
      if(!get("zoom.enabled")||!get("zoom.scrollable")||!zoomHeld)return;
      e.preventDefault();
      set("zoom.level",UTIL.clamp((+get("zoom.level")||3)+(e.deltaY<0?.25:-.25),1,6));
    },{passive:false,capture:true});
  }

  // ---------- Crosshair ----------
  function renderCrosshair(){
    const c=ensureLayer("__matrix_crosshair_layer");
    if(!get("crosshair.enabled")||get("clearscreen.enabled")){c.innerHTML="";return}
    let img="";
    const url=String(get("crosshair.url")||"");
    if(url) img=`<img src="${UTIL.esc(url)}" style="width:${+get("crosshair.size")}px;height:${+get("crosshair.size")}px;object-fit:contain;opacity:${+get("crosshair.opacity")};image-rendering:auto">`;
    else {
      const s=+get("crosshair.size")||32;
      img=`<div style="width:${s}px;height:${s}px;position:relative;opacity:${+get("crosshair.opacity")}"><i style="position:absolute;left:50%;top:20%;bottom:20%;width:2px;background:#fff;transform:translateX(-50%);box-shadow:0 0 1px #000"></i><i style="position:absolute;top:50%;left:20%;right:20%;height:2px;background:#fff;transform:translateY(-50%);box-shadow:0 0 1px #000"></i></div>`;
    }
    c.style.display="flex";c.style.alignItems="center";c.style.justifyContent="center";c.innerHTML=img;
  }

  // ---------- Keystrokes / CPS ----------
  const keysDown=new Set(), leftClicks=[], rightClicks=[];
  let ksEl=null, fpsEl=null, cpsEl=null, fpsFrames=0, fpsLast=performance.now(), fpsValue=0;
  function buildKeystrokes(){
    if(ksEl) ksEl.remove();
    ksEl=document.createElement("div");ksEl.id="__matrix_keystrokes";
    ksEl.style.cssText="position:fixed;z-index:2147483000;pointer-events:none;display:grid;grid-template-columns:repeat(3,44px);gap:4px;user-select:none";
    const defs=[["A","KeyA"],["W","KeyW"],["D","KeyD"],["S","KeyS"],["SHIFT","ShiftLeft"],["SPACE","Space"],["LMB","MouseLeft"],["RMB","MouseRight"]];
    for(const [label,code] of defs){
      const el=document.createElement("div");el.dataset.code=code;el.dataset.label=label;
      el.style.cssText="height:40px;border-radius:4px;display:flex;align-items:center;justify-content:center;font:600 11px Inter,Arial,sans-serif;box-sizing:border-box";
      el.textContent=label; ksEl.appendChild(el);
    }
    document.body.appendChild(ksEl);
  }
  function updateKeystrokes(){
    if(!ksEl)buildKeystrokes();
    const c=get("keystrokes");
    ksEl.style.left=`${c.x}px`;ksEl.style.top=`${c.y}px`;ksEl.style.transform=`scale(${c.scale})`;
    ksEl.style.display=(!c.enabled || (c.onlyInGame&&!UTIL.isGame()) || get("clearscreen.enabled"))?"none":"grid";
    [...ksEl.children].forEach((el,i)=>{
      const code=el.dataset.code, pressed=keysDown.has(code)||((code==="MouseLeft")&&keysDown.has("__lmb"))||((code==="MouseRight")&&keysDown.has("__rmb"));
      const bg=pressed?(c.rainbow?`hsl(${(performance.now()/5+i*45)%360} 100% 60%)`:c.pressedColor):c.keyColor;
      el.style.background=bg;
      el.style.color=pressed?c.pressedTextColor:c.textColor;
      el.style.border=c.border?`${c.borderWidth}px solid ${c.borderColor}`:"none";
      el.style.borderRadius=`${c.borderRadius}px`;
      el.style.boxShadow=c.shadow?"0 3px 8px rgba(0,0,0,.3)":"none";
      el.style.transform=c.pressAnimation&&pressed?"scale(.92)":"scale(1)";
    });
    requestAnimationFrame(updateKeystrokes);
  }
  function prune(arr){const n=Date.now(); while(arr[0]&&n-arr[0]>1000)arr.shift()}
  function buildFpsCps(){
    if(fpsEl)fpsEl.remove();if(cpsEl)cpsEl.remove();
    fpsEl=document.createElement("div");fpsEl.id="__matrix_fps";
    cpsEl=document.createElement("div");cpsEl.id="__matrix_cps";
    [fpsEl,cpsEl].forEach(e=>{e.style.cssText="position:fixed;z-index:2147483000;padding:5px 8px;border-radius:6px;font:600 11px Inter,Arial,sans-serif;pointer-events:none"});
    document.body.append(fpsEl,cpsEl);
  }
  function updateFpsCps(){
    if(!fpsEl||!cpsEl)buildFpsCps();
    fpsFrames++;
    const now=performance.now();
    if(now-fpsLast>=500){fpsValue=Math.round(fpsFrames*1000/(now-fpsLast));fpsFrames=0;fpsLast=now}
    prune(leftClicks);prune(rightClicks);
    const f=get("fps"),c=get("cps");
    fpsEl.style.display=f.enabled&&!get("clearscreen.enabled")?"block":"none";
    fpsEl.style.left=f.x+"px";fpsEl.style.top=f.y+"px";fpsEl.style.transform=`scale(${f.scale})`;
    fpsEl.style.background=f.backgroundColor;fpsEl.style.border=f.border?`${f.borderWidth}px solid ${f.borderColor}`:"none";fpsEl.style.boxShadow=f.shadow?"0 3px 10px rgba(0,0,0,.35)":"none";
    const fc=fpsValue>=90?f.highColor:(fpsValue>=45?f.mediumColor:f.lowColor);
    fpsEl.innerHTML=`<span style="color:${UTIL.esc(f.labelColor)}">FPS</span> <span style="color:${UTIL.esc(fc)}">${fpsValue}</span>`;
    cpsEl.style.display=c.enabled&&!get("clearscreen.enabled")?"block":"none";
    cpsEl.style.left=c.x+"px";cpsEl.style.top=c.y+"px";cpsEl.style.transform=`scale(${c.scale})`;
    cpsEl.style.background=c.backgroundColor;cpsEl.style.border=c.border?`${c.borderWidth}px solid ${c.borderColor}`:"none";cpsEl.style.boxShadow=c.shadow?"0 3px 10px rgba(0,0,0,.35)":"none";
    cpsEl.innerHTML=`<span style="color:${UTIL.esc(c.labelColor)}">CPS</span> <span style="color:${UTIL.esc(c.numberColor)}">${leftClicks.length}${c.showBothMouses?` / ${rightClicks.length}`:""}</span>`;
    requestAnimationFrame(updateFpsCps);
  }

  // ---------- Direction ----------
  function directionFromYaw(yaw){
    const dirs=["N","NE","E","SE","S","SW","W","NW"];
    return dirs[Math.round(((yaw%360)+360)%360/45)%8]
  }
  function renderDirection(){
    const l=ensureLayer("__matrix_directionhud");
    const c=get("directionhud");
    if(!c.enabled||get("clearscreen.enabled")){l.innerHTML="";return}
    l.style.display="flex";l.style.alignItems="flex-start";l.style.justifyContent="center";
    l.innerHTML=`<div style="margin-top:18px;transform:scale(${c.size});font:800 14px Inter,Arial,sans-serif;color:#fff;background:#0008;border:1px solid #fff2;padding:6px 10px;border-radius:8px;text-shadow:0 1px 4px #000">N&nbsp;&nbsp; NE&nbsp;&nbsp; E&nbsp;&nbsp; SE&nbsp;&nbsp; S&nbsp;&nbsp; SW&nbsp;&nbsp; W&nbsp;&nbsp; NW</div>`;
  }

  // ---------- Generic visual mods ----------
  function applyVisualCSS(){
    const hideFog=get("nofog.enabled");
    const hideTags=get("hidenametag.enabled");
    const hideClouds=get("hideclouds.enabled");
    const hideArm=get("hidearm.enabled");
    const hideParticles=get("hideparticles.enabled");
    const arm=get("armoffset");
    let css="";
    if(hideFog)css+="canvas{filter:contrast(1.02)!important}body{--matrix-hide-fog:1}";
    if(hideTags)css+="[class*='nametag'],[class*='name-tag'],[class*='nameTag'],[data-name-tag]{visibility:hidden!important}";
    if(hideClouds)css+="[class*='cloud'],[class*='Cloud']{visibility:hidden!important}";
    if(hideArm)css+="[class*='hand'],[class*='arm'],[class*='viewmodel']{visibility:hidden!important}";
    if(hideParticles)css+="[class*='particle'],[class*='Particle']{display:none!important}";
    if(arm.enabled)css+="canvas{transform:translateY("+arm.y+"px)!important}";
    UTIL.style("__matrix_visual_suite",css);
  }

  function renderDamage(){
    const l=ensureLayer("__matrix_damage");const c=get("damagevignette");
    if(!c.enabled||get("clearscreen.enabled")){l.style.boxShadow="none";return}
    l.style.boxShadow=`inset 0 0 120px 40px ${c.color}44`;l.style.pointerEvents="none";
  }

  function renderArmor(){
    const l=ensureLayer("__matrix_armorhud");const c=get("armorhud");
    if(!c.enabled||get("clearscreen.enabled")){l.innerHTML="";return}
    l.style.display="block";
    l.innerHTML=`<div style="position:absolute;left:50%;bottom:76px;transform:translateX(-50%);padding:5px 9px;border:1px solid #fff2;border-radius:7px;background:#0008;color:#fff;font:700 11px Inter,Arial,sans-serif">ARMOR HUD</div>`;
  }

  function renderScoreboard(){
    const l=ensureLayer("__matrix_scoreboard");const c=get("scoreboard");
    const native=UTIL.qs(".scoreboard,[class*='scoreboard'],[class*='Scoreboard']");
    if(!c.enabled){l.innerHTML="";if(native)native.style.removeProperty("filter");return}
    l.style.display="block";
    if(native)native.style.cssText+=`!important;`;
    l.innerHTML=`<div style="position:absolute;left:${c.x}px;top:${c.y}px;background:${c.backgroundColor};border:1px solid ${c.borderColor};border-radius:7px;color:#fff;padding:8px 10px;font:600 11px Inter,Arial,sans-serif">SCOREBOARD</div>`;
  }

  function renderActionbar(){
    const l=ensureLayer("__matrix_actionbar");const c=get("actionbar");
    if(!c.enabled){l.innerHTML="";return}
    l.innerHTML=`<div style="position:absolute;left:${c.x}%;top:${c.y}%;transform:translate(-50%,-50%);background:${c.backgroundColor};border:1px solid ${c.borderColor};border-radius:7px;padding:7px 12px;color:#fff;font:600 11px Inter,Arial,sans-serif">ACTION BAR</div>`;
  }

  function applyGuiScale(){
    const c=get("guiscale");let css="";
    if(c.enabled){css=`.hotbar,[class*="hotbar"],[class*="inventory"],[class*="Inventory"]{transform:scale(var(--matrix-gui-scale,1));transform-origin:center!important}`;document.documentElement.style.setProperty("--matrix-gui-scale",c.hotbar/100)}
    UTIL.style("__matrix_gui_scale",c.enabled?css:"");
  }

  function applyCustomUI(){
    const c=get("customui");
    let e=document.getElementById("__matrix_custom_ui_style");
    if(!e){e=document.createElement("style");e.id="__matrix_custom_ui_style";document.head.appendChild(e)}
    e.textContent=c.enabled?String(c.css||""):"";
  }

  function applyClearScreen(){
    let e=document.getElementById("__matrix_clear_screen_style");
    if(!e){e=document.createElement("style");e.id="__matrix_clear_screen_style";document.head.appendChild(e)}
    e.textContent=get("clearscreen.enabled")?".matrix-client-overlay,[id*='hud'],[class*='hud'],[class*='Hud']{visibility:hidden!important}":"";
  }

  // ---------- Crouch / emojis / notifications ----------
  let crouched=false;
  function initInput(){
    document.addEventListener("keydown",e=>{
      if(e.code===get("togglecrouch.keybind")&&!e.repeat&&get("togglecrouch.enabled")){
        crouched=!crouched;
        document.body.dataset.matrixCrouched=crouched?"1":"0";
        UTIL.notify("Matrix Crouch",crouched?"Enabled":"Disabled");
      }
      if(e.code===get("clearscreen.keybind")&&!e.repeat){
        set("clearscreen.enabled",!get("clearscreen.enabled"));
      }
    },true);
    document.addEventListener("keyup",e=>keysDown.delete(e.code),true);
    document.addEventListener("keydown",e=>keysDown.add(e.code),true);
    document.addEventListener("mousedown",e=>{
      if(e.button===0){keysDown.add("__lmb");leftClicks.push(Date.now())}
      if(e.button===2){keysDown.add("__rmb");rightClicks.push(Date.now())}
    },true);
    document.addEventListener("mouseup",e=>{
      if(e.button===0)keysDown.delete("__lmb");
      if(e.button===2)keysDown.delete("__rmb");
    },true);
  }

  // ---------- Texture override API ----------
  window.MatrixTextureOverride = {
    set(name,url){const p={...get("textures.pack"),[name]:url};set("textures.pack",p)},
    remove(name){const p={...get("textures.pack")};delete p[name];set("textures.pack",p)},
    clear(){set("textures.pack",{})}
  };
  function initTextureOverrides(){
    const desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,"src");
    if(!desc||!desc.set)return;
    if(desc.set.__matrixPatched)return;
    const patched=function(v){
      try{
        if(get("textures.enabled")&&typeof v==="string"){
          for(const [key,url] of Object.entries(get("textures.pack")||{})){
            if(v.includes(key)){v=url;break}
          }
        }
      }catch(_){}
      return desc.set.call(this,v)
    };
    patched.__matrixPatched=true;
    Object.defineProperty(HTMLImageElement.prototype,"src",{...desc,set:patched});
  }

  // ---------- Translator ----------
  async function translateText(text,lang){
    try{
      const u="https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl="+encodeURIComponent(lang)+"&dt=t&q="+encodeURIComponent(text);
      const r=await fetch(u); const d=await r.json();
      return d?.[0]?.map(x=>x?.[0]||"").join("")||null;
    }catch(_){return null}
  }
  async function translateChat(){
    if(!get("translator.enabled"))return;
    const nodes=UTIL.qsa("[class*='chat'] [class*='message'],[class*='chat'] .message,[class*='Chat'] .message");
    for(const n of nodes){
      if(n.dataset.matrixTranslated==="1")continue;
      const raw=n.textContent.trim();
      if(raw.length<2)continue;
      const t=await translateText(raw,get("translator.language"));
      if(t&&t!==raw){
        const span=document.createElement("div");
        span.dataset.matrixTranslated="1";span.textContent=t;
        span.style.cssText="margin-top:2px;font-size:.9em;opacity:.78;color:#9ed8ff";
        n.appendChild(span);n.dataset.matrixTranslated="1";
      }
    }
  }

  // ---------- Auto GG ----------
  function initAutoGG(){
    if(window.__matrixAutoGGBound)return;window.__matrixAutoGGBound=true;
    const obs=new MutationObserver(()=>{
      if(!get("autogg.enabled"))return;
      const body=document.body.innerText||"";
      if(/game\s*(over|ended)|victory|you\s*win|defeat|eliminated/i.test(body)){
        const input=UTIL.qs("input[class*='chat'],textarea[class*='chat'],input[placeholder*='chat' i],textarea[placeholder*='chat' i]");
        if(input&&!input.dataset.matrixGG){
          input.dataset.matrixGG="1";input.value="GG";input.dispatchEvent(new Event("input",{bubbles:true}));
          input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true}));
          setTimeout(()=>delete input.dataset.matrixGG,5000);
        }
      }
    });
    obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  }

  // ---------- Bedwars notifications ----------
  function initNotifications(){
    if(window.__matrixNotifBound)return;window.__matrixNotifBound=true;
    const obs=new MutationObserver(()=>{
      if(!get("bedwarsnotif.enabled"))return;
      const text=(document.body.innerText||"").trim();
      if(get("bedwarsnotif.bedDestroy")&&/bed.*destroyed|bed was destroyed/i.test(text))UTIL.notify("BedWars","Bed destroyed");
      if(get("bedwarsnotif.teamEliminated")&&/team.*eliminated|team eliminated/i.test(text))UTIL.notify("BedWars","Team eliminated");
    });
    obs.observe(document.body,{subtree:true,childList:true});
  }

  // ---------- Chat emojis ----------
  function initChatEmoji(){
    if(window.__matrixEmojiBound)return;window.__matrixEmojiBound=true;
    const map={":heart:":"❤️",":fire:":"🔥",":gg:":"GG",":skull:":"💀",":check:":"✅",":star:":"⭐"};
    const obs=new MutationObserver(()=>{
      if(!get("chatemojis.enabled"))return;
      UTIL.qsa("[class*='chat'] *").forEach(n=>{
        if(n.children.length||n.dataset.matrixEmoji)return;
        let s=n.textContent;
        for(const [a,b] of Object.entries(map))s=s.replaceAll(a,b);
        if(s!==n.textContent){n.textContent=s;n.dataset.matrixEmoji="1"}
      })
    });
    obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  }

  // ---------- KDR ----------
  function renderKDR(){
    const l=ensureLayer("__matrix_kdrhud");
    if(!get("kdrindicator.enabled")||get("clearscreen.enabled")){l.innerHTML="";return}
    const txt=document.body.innerText||"";
    const kills=(txt.match(/\bkills?\s*[:\-]?\s*(\d+)/i)||[])[1]||"0";
    const deaths=(txt.match(/\bdeaths?\s*[:\-]?\s*(\d+)/i)||[])[1]||"0";
    const k=+kills,d=+deaths,kdr=d?k/d:k;
    l.innerHTML=`<div style="position:absolute;right:18px;bottom:18px;background:#000b;border:1px solid #fff2;border-radius:8px;color:#fff;padding:7px 10px;font:700 11px Inter,Arial,sans-serif">KDR ${kdr.toFixed(2)}</div>`;
  }

  // ---------- Render loop ----------
  function applyAll(){
    applyVisualCSS();
    applyGuiScale();
    applyCustomUI();
    applyClearScreen();
    renderCrosshair();
    renderDamage();
    renderArmor();
    renderScoreboard();
    renderActionbar();
    renderDirection();
    renderKDR();
    applyZoom();
  }

  function start(){
    initInput();
    initZoom();
    initTextureOverrides();
    buildKeystrokes();buildFpsCps();
    initAutoGG();initNotifications();initChatEmoji();
    let lastTranslate=0,lastUI=0;
    const loop=()=>{
      try{
        applyZoom();
        updateKeystrokes();
        updateFpsCps();
        if(performance.now()-lastUI>250){
          lastUI=performance.now();
          renderDirection();renderDamage();renderArmor();renderScoreboard();renderActionbar();renderKDR();
          applyVisualCSS();applyGuiScale();
        }
        if(performance.now()-lastTranslate>1200){
          lastTranslate=performance.now();translateChat();
        }
      }catch(_){}
      requestAnimationFrame(loop);
    };
    applyAll();
    requestAnimationFrame(loop);
    window.MatrixCelestarSuite.started=true;
    console.info("[Matrix] Expanded Mod Suite loaded:", MOD_META.length, "mods");
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
