(function () {
  "use strict";

  const TAGS = {
    "マテウス": {
      image: () => window.__matrixCustomTagAssets?.matheus,
      text: "",
      className: "matrix-tag-matheus"
    },
    "thetalkingcat": {
      image: () => window.__matrixCustomTagAssets?.coconut,
      text: "SHIT",
      className: "matrix-tag-talkingcat"
    },
    "GlitchHunter": {
      image: () => window.__matrixBadgeAssets?.glitchhunter || window.__matrixCustomTagAssets?.coconut,
      text: "",
      className: "matrix-tag-glitchhunter"
    },
    "GlithHunter": {
      image: () => window.__matrixBadgeAssets?.glitchhunter || window.__matrixCustomTagAssets?.coconut,
      text: "",
      className: "matrix-tag-glitchhunter"
    },
    "Zephron": {
      image: () => window.__matrixBadgeAssets?.zephron,
      text: "",
      className: "matrix-tag-zephron"
    }
  };

  const ROOT_CLASS = "matrix-custom-tag-node";
  const cache = new Map();
  const seenByContext = new WeakMap();
  let frameId = 0;

  const STYLE = `
    .${ROOT_CLASS}{display:inline-flex!important;align-items:center!important;vertical-align:middle!important;align-self:center!important;gap:4px!important;margin-left:5px!important;height:20px!important;min-height:20px!important;line-height:1!important;position:relative!important;top:0!important;pointer-events:none!important;user-select:none!important;white-space:nowrap!important}
    .${ROOT_CLASS} img{width:20px!important;height:20px!important;object-fit:contain!important;display:inline-block!important;flex:0 0 20px!important;vertical-align:middle!important;border-radius:3px!important}
    .matrix-tag-talkingcat img{border-radius:50%!important}
    .${ROOT_CLASS} .matrix-tag-label{font:700 11px/1 Arial,sans-serif!important;color:#fff!important;text-shadow:0 1px 2px #000,0 0 3px #000!important;letter-spacing:.2px!important}
  `;

  function installStyle(){
    if(document.getElementById("__matrix_custom_tags_style")) return;
    const s=document.createElement("style");s.id="__matrix_custom_tags_style";s.textContent=STYLE;(document.head||document.documentElement).appendChild(s);
  }
  function normalize(v){return String(v||"").replace(/\u200B/g,"").trim()}
  function defFor(name){return TAGS[normalize(name)]||null}
  function loadImage(name){
    if(cache.has(name)) return cache.get(name);
    const def=defFor(name); if(!def) return null;
    let src=null; try{src=def.image()}catch(_){}
    if(!src) return null;
    const img=new Image(); img.decoding="async"; img.src=src; img.onload=()=>{try{scanDom()}catch(_){}}; cache.set(name,img); return img;
  }
  function makeTag(name){
    const def=defFor(name); if(!def) return null;
    const wrap=document.createElement("span"); wrap.className=ROOT_CLASS+" "+def.className; wrap.setAttribute("aria-hidden","true");
    const img=document.createElement("img"); img.src=(def.image()||""); img.alt=""; wrap.appendChild(img);
    if(def.text){const t=document.createElement("span");t.className="matrix-tag-label";t.textContent=def.text;wrap.appendChild(t)}
    return wrap;
  }
  function skip(el){
    if(!el||!(el instanceof Element)) return true;
    if(el.closest("."+ROOT_CLASS)) return true;
    if(el.closest("input,textarea,select,button,[contenteditable='true']")) return true;
    const id=String(el.id||"").toLowerCase(), cls=String(el.className||"").toLowerCase();
    if(id.includes("chat")||id.includes("input")||id.includes("menu")) return true;
    if(cls.includes("chat")||cls.includes("message-input")) return true;
    return false;
  }
  function add(el,name){
    if(skip(el)||!defFor(name)) return;
    if(el.querySelector&&el.querySelector("."+ROOT_CLASS)) return;
    if(el.dataset&&el.dataset.matrixCustomTag) return;
    const tag=makeTag(name); if(!tag) return;
    el.dataset.matrixCustomTag=name; el.appendChild(tag);
  }
  function scanDom(){
    if(!document.body) return;
    for(const el of document.body.querySelectorAll("span,div,p,label")){
      if(skip(el)||el.children.length>3) continue;
      const text=normalize(el.childNodes.length===1?el.textContent:"");
      if(defFor(text)) add(el,text);
    }
  }
  function seen(ctx){let m=seenByContext.get(ctx);if(!m){m=new Map();seenByContext.set(ctx,m)}return m}
  function draw(ctx,name,x,y){
    const def=defFor(name); if(!def) return;
    const img=loadImage(name); if(!img||!img.complete||!img.naturalWidth) return;
    const key=name+"@"+Math.round(x)+","+Math.round(y), m=seen(ctx); if(m.get(key)===frameId)return; m.set(key,frameId);
    const measured=ctx.measureText(name), fm=String(ctx.font||"").match(/(\d+(?:\.\d+)?)px/), fs=fm?parseFloat(fm[1]):16;
    const size=Math.max(18,Math.min(23,Math.round(fs*1.08))), gap=Math.max(3,Math.round(size*.16));
    const tw=measured.width||name.length*fs*.55, iconX=x+tw+gap, iconY=y-size+Math.round(fs*.12);
    ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.imageSmoothingEnabled=true;
    ctx.drawImage(img,iconX,iconY,size,size);
    if(def.text){ctx.font="700 "+Math.max(8,Math.round(fs*.62))+"px Arial";ctx.fillStyle="#fff";ctx.textAlign="left";ctx.textBaseline="middle";ctx.shadowColor="rgba(0,0,0,.85)";ctx.shadowBlur=3;ctx.fillText(def.text,iconX+size+gap,y-fs*.35)}
    ctx.restore();
  }
  function patchCanvas(){
    if(!window.CanvasRenderingContext2D||window.__matrixCustomTagsCanvasPatched)return;
    window.__matrixCustomTagsCanvasPatched=true;const p=CanvasRenderingContext2D.prototype,fill=p.fillText,stroke=p.strokeText;
    const maybe=(ctx,text,x,y)=>{const n=normalize(text);if(defFor(n)&&Number.isFinite(x)&&Number.isFinite(y)){try{draw(ctx,n,Number(x),Number(y))}catch(_){}}};
    p.fillText=function(text,x,y,mw){const r=arguments.length>=4?fill.call(this,text,x,y,mw):fill.call(this,text,x,y);maybe(this,text,x,y);return r};
    if(typeof stroke==="function")p.strokeText=function(text,x,y,mw){const r=arguments.length>=4?stroke.call(this,text,x,y,mw):stroke.call(this,text,x,y);maybe(this,text,x,y);return r};
  }
  function boot(){installStyle();patchCanvas();new MutationObserver(scanDom).observe(document.documentElement,{childList:true,subtree:true,characterData:true});scanDom();setInterval(scanDom,700);(function loop(){frameId++;requestAnimationFrame(loop)})();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else setTimeout(boot,0);
  window.__matrixCustomTags={enabled:true,definitions:TAGS,rescan:scanDom};
})();
