(function () {
  "use strict";
  if (window.__matrixCommunityModsLoaded) return;
  window.__matrixCommunityModsLoaded = true;

  const DISCORD = "https://discord.gg/sw5HCYZBy9";
  const root = () => document.body || document.documentElement;
  const css = document.createElement("style");
  css.id = "matrix-community-mods-style";
  css.textContent = `
    .matrix-community-panel{position:fixed;z-index:2147483647;font-family:Segoe UI,Arial,sans-serif;user-select:none;color:#e0e0ff;background:rgba(10,10,26,.96);border:1px solid #0ff;border-radius:12px;box-shadow:0 10px 35px rgba(0,0,0,.55),0 0 10px rgba(0,255,255,.25);backdrop-filter:blur(8px)}
    .matrix-community-panel button{font:600 11px Segoe UI,Arial,sans-serif;cursor:pointer}
    .matrix-community-drag{cursor:grab}
    .matrix-community-title{color:#0ff;font-weight:700;font-size:12px;letter-spacing:.4px}
    .matrix-community-muted{color:#8888aa;font-size:10px}
    .matrix-community-actions{display:flex;gap:7px}
    .matrix-community-actions button{background:#111;border:1px solid #0ff;color:#0ff;border-radius:7px;padding:6px 10px}
    .matrix-community-actions button:hover{filter:brightness(1.2)}
    #matrix-mouse-trail-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483646}
    #matrix-keyboard-overlay{pointer-events:none}
    .matrix-vk-row{display:flex;justify-content:center;gap:4px;margin:4px 0}
    .matrix-vk-key{min-width:26px;height:26px;padding:0 7px;border:1px solid rgba(0,255,255,.45);border-radius:6px;background:rgba(17,17,17,.9);color:#e0e0ff;font:600 11px Segoe UI,Arial,sans-serif;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
    .matrix-vk-key.active{background:#0ff;color:#000;box-shadow:0 0 9px rgba(0,255,255,.55)}
    #matrix-fps-panel{min-width:150px}
    #matrix-stopwatch-panel{min-width:220px}
    .matrix-range{width:100%;accent-color:#0ff}
    .matrix-mini-input{background:#111;border:1px solid rgba(0,255,255,.3);color:#e0e0ff;border-radius:6px;padding:5px 7px}
  `;
  (document.head || document.documentElement).appendChild(css);

  const state = {
    mouse: { enabled:false, mode:"fade", shape:"circle", length:15, size:6, fade:.95, color:"#00ffff", rainbow:false, gradient:false, gradient1:"#00ffff", gradient2:"#ff00ff", glow:true, emoji:false, emojiChoice:"✨", clickEffect:"ripple", clickSize:80, clickDuration:600, clickColor:"#00ffff" },
    stopwatch: { enabled:false, x:120, y:80, scale:1 },
    display: { enabled:false, brightness:100, contrast:100, saturation:100, hue:0, blur:0, sepia:0, invert:0, gamma:100, temperature:0, vignette:0, scanlines:0 },
    keyboard: { enabled:false, scale:.6, x:100, y:100, opacity:.9, bg:"#111111", active:"#00ffff", text:"#e0e0ff", glow:true },
    fps: { enabled:false, x:20, y:20, scale:1, opacity:.95, graph:true, bar:true, minmax:true, maxTarget:240, good:"#00ffff", medium:"#ffaa44", low:"#ff4444", text:"#e0e0ff", border:"#00ffff" }
  };

  function setSetting(key, value){ try{ window.electronAPI?.setSetting(key,value); }catch(_){} }
  function saveLocal(key, value){ try{localStorage.setItem(key, String(value));}catch(_){} }
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }

  // ---------- Mouse trail ----------
  const emojiPool = [
    "😀","😂","🤣","😊","😍","😎","🤩","🥳","😈","💀","👻","🤖","👽","🎃","🔥","💎","🌈","⭐","🌟","✨","💫","⚡","❤️","💜","💙","💚","💛","🖤","🤍","🐱","🐶","🦊","🐼","🐸","🦄","🐲","🦋","🌸","🍀","🍉","🍕","🍔","🍩","🥥","🎮","🕹️","🎵","🎧","🚀","🌌"
  ];
  let mtCanvas=null, mtCtx=null, mtRAF=0, mtPoints=[], mtClicks=[], mtHue=0, mtLast={x:null,y:null};
  function mtStart(){
    if(mtCanvas) return;
    mtCanvas=document.createElement("canvas"); mtCanvas.id="matrix-mouse-trail-canvas"; root().appendChild(mtCanvas); mtCtx=mtCanvas.getContext("2d");
    const rs=()=>{ if(mtCanvas){mtCanvas.width=innerWidth;mtCanvas.height=innerHeight;} }; window.addEventListener("resize",rs); rs(); mtCanvas.__rs=rs;
    window.addEventListener("mousemove",mtMove,true); window.addEventListener("click",mtClick,true); mtRAF=requestAnimationFrame(mtFrame);
  }
  function mtStop(){
    window.removeEventListener("mousemove",mtMove,true); window.removeEventListener("click",mtClick,true); if(mtRAF)cancelAnimationFrame(mtRAF); mtRAF=0; if(mtCanvas?.__rs)window.removeEventListener("resize",mtCanvas.__rs); mtCanvas?.remove(); mtCanvas=null; mtCtx=null; mtPoints=[]; mtClicks=[]; mtLast={x:null,y:null};
  }
  function colorLerp(a,b,t){ const A=a.replace('#',''),B=b.replace('#',''); const ar=parseInt(A.slice(0,2),16),ag=parseInt(A.slice(2,4),16),ab=parseInt(A.slice(4,6),16),br=parseInt(B.slice(0,2),16),bg=parseInt(B.slice(2,4),16),bb=parseInt(B.slice(4,6),16); return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`; }
  function mtColor(i){ if(state.mouse.rainbow)return `hsl(${(mtHue+i*15)%360},100%,60%)`; if(state.mouse.gradient)return colorLerp(state.mouse.gradient1,state.mouse.gradient2,(i%Math.max(1,state.mouse.length-1))/Math.max(1,state.mouse.length-1)); return state.mouse.color; }
  function mtAddPoint(x,y){ const s=state.mouse.size; mtPoints.push({x,y,life:1,s,emoji:state.mouse.emoji?emojiPool[Math.floor(Math.random()*emojiPool.length)]:null}); if(mtPoints.length>state.mouse.length*3)mtPoints.splice(0,mtPoints.length-state.mouse.length*3); }
  function mtMove(e){ if(!state.mouse.enabled)return; const x=e.clientX,y=e.clientY; if(mtLast.x===null){mtLast={x,y};return;} if(Math.hypot(x-mtLast.x,y-mtLast.y)>2){mtAddPoint(x,y);mtLast={x,y};} }
  function mtClick(e){ if(!state.mouse.enabled)return; mtClicks.push({x:e.clientX,y:e.clientY,age:0}); }
  function mtShape(x,y,s,shape){ const c=mtCtx; c.beginPath(); const h=s/2; switch(shape){case"square":c.rect(x-h,y-h,s,s);break;case"triangle":c.moveTo(x,y-h);c.lineTo(x+h,y+h);c.lineTo(x-h,y+h);c.closePath();break;case"diamond":c.moveTo(x,y-h);c.lineTo(x+h,y);c.lineTo(x,y+h);c.lineTo(x-h,y);c.closePath();break;case"star":for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?h:h*.45;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();break;default:c.arc(x,y,h,0,Math.PI*2);}}
  function mtFrame(){
    if(!state.mouse.enabled||!mtCtx){mtRAF=0;return;} const c=mtCtx; c.clearRect(0,0,mtCanvas.width,mtCanvas.height); mtHue=(mtHue+.8)%360;
    mtPoints.forEach((p,i)=>{p.life*=state.mouse.fade;p.s*=.985;if(p.life<.02)return;c.globalAlpha=p.life;c.fillStyle=mtColor(i);if(state.mouse.glow){c.shadowColor=c.fillStyle;c.shadowBlur=10;}else c.shadowBlur=0;if(p.emoji){c.font=`${Math.max(10,p.s*2)}px sans-serif`;c.textAlign="center";c.textBaseline="middle";c.fillText(p.emoji,p.x,p.y);}else{mtShape(p.x,p.y,p.s,state.mouse.shape);c.fill();}});
    mtPoints=mtPoints.filter(p=>p.life>.02&&p.s>.3);
    mtClicks.forEach((q)=>{q.age+=16;const life=1-q.age/state.mouse.clickDuration;if(life<=0)return;const r=state.mouse.clickSize*(1-life)+8;c.globalAlpha=life;c.strokeStyle=state.mouse.clickColor;c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.stroke();}); mtClicks=mtClicks.filter(q=>q.age<state.mouse.clickDuration);
    c.globalAlpha=1;c.shadowBlur=0;mtRAF=requestAnimationFrame(mtFrame);
  }
  function setMouse(enabled){state.mouse.enabled=!!enabled; if(enabled)mtStart();else mtStop();}

  // ---------- Stopwatch ----------
  let swPanel=null, swTimer=null, swRunning=false, swStart=0, swElapsed=0, swLaps=[];
  function swCurrent(){ return swRunning?swElapsed+(Date.now()-swStart):swElapsed; }
  function swFmt(ms){let s=Math.floor(ms/1000),m=Math.floor(s/60);s%=60;let h=Math.floor(m/60);m%=60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}.${String(s).padStart(2,'0')}`;}
  function swRender(){if(!swPanel)return;const v=swPanel.querySelector('.sw-v');if(v)v.textContent=swFmt(swCurrent());const list=swPanel.querySelector('.sw-laps');if(list)list.innerHTML=swLaps.slice().reverse().map((x,i)=>`<div style="display:flex;justify-content:space-between;color:#e0e0ff;font-size:10px;padding:3px 0"><span>Lap ${swLaps.length-i}</span><span>${swFmt(x)}</span></div>`).join('')||'<div style="color:#8888aa;font-size:10px;text-align:center">No laps</div>';}
  function swBuild(){ if(swPanel)swPanel.remove(); swPanel=document.createElement('div');swPanel.id='matrix-stopwatch-panel';swPanel.className='matrix-community-panel';Object.assign(swPanel.style,{left:state.stopwatch.x+'px',top:state.stopwatch.y+'px',transform:`scale(${state.stopwatch.scale})`,transformOrigin:'top left',display:state.stopwatch.enabled?'block':'none'});swPanel.innerHTML=`<div class="matrix-community-drag" style="padding:9px 12px;border-bottom:1px solid rgba(0,255,255,.25);display:flex;justify-content:space-between"><span class="matrix-community-title">STOPWATCH</span><button class="sw-close" style="background:none;border:0;color:#0ff;font-size:14px">✕</button></div><div style="padding:12px"><div class="sw-v" style="font:700 25px Segoe UI;color:#0ff;text-align:center">00:00.00</div><div class="sw-laps" style="margin:10px 0;max-height:120px;overflow:auto"></div><div class="matrix-community-actions"><button class="sw-start">START</button><button class="sw-lap">LAP</button><button class="sw-reset">RESET</button></div><div class="matrix-community-muted" style="margin-top:8px">Integrated community mod • <a href="${DISCORD}" target="_blank" style="color:#0ff">Discord</a></div></div>`;root().appendChild(swPanel); const drag=swPanel.querySelector('.matrix-community-drag');let d=false,ox=0,oy=0;drag.onmousedown=e=>{if(e.target.closest('button'))return;d=true;ox=e.clientX-swPanel.getBoundingClientRect().left;oy=e.clientY-swPanel.getBoundingClientRect().top;};window.addEventListener('mousemove',e=>{if(!d)return;state.stopwatch.x=e.clientX-ox;state.stopwatch.y=e.clientY-oy;swPanel.style.left=state.stopwatch.x+'px';swPanel.style.top=state.stopwatch.y+'px';});window.addEventListener('mouseup',()=>d=false);swPanel.querySelector('.sw-close').onclick=()=>setStopwatch(false);swPanel.querySelector('.sw-start').onclick=()=>{if(swRunning){swElapsed+=Date.now()-swStart;swRunning=false;if(swTimer)clearInterval(swTimer);}else{swStart=Date.now();swRunning=true;swTimer=setInterval(swRender,50);}swPanel.querySelector('.sw-start').textContent=swRunning?'PAUSE':'START';swRender();};swPanel.querySelector('.sw-lap').onclick=()=>{if(swRunning||swElapsed>0)swLaps.push(swCurrent());swRender();};swPanel.querySelector('.sw-reset').onclick=()=>{swRunning=false;swElapsed=0;swLaps=[];if(swTimer)clearInterval(swTimer);swRender();};swRender(); }
  function setStopwatch(enabled){state.stopwatch.enabled=!!enabled;if(!swPanel)swBuild();swPanel.style.display=state.stopwatch.enabled?'block':'none';}

  // ---------- Display enhancer ----------
  let displayStyle=null, displayOverlayV=null, displayOverlayS=null;
  function displayApply(){ let c=document.querySelector('canvas'); if(!c)return; const d=state.display; const sat=clamp(d.saturation+Math.abs(d.temperature)*.25,0,300), hue=d.hue+d.temperature*.2; c.style.filter=`brightness(${d.brightness*(d.gamma/100)}%) contrast(${d.contrast}%) saturate(${sat}%) hue-rotate(${hue}deg) sepia(${d.sepia}%) invert(${d.invert}%)${d.blur?` blur(${d.blur*.5}px)`:''}`; if(!displayOverlayV){displayOverlayV=document.createElement('div');displayOverlayV.id='matrix-display-vignette';Object.assign(displayOverlayV.style,{position:'fixed',inset:0,pointerEvents:'none',zIndex:2147483640});root().appendChild(displayOverlayV);}if(!displayOverlayS){displayOverlayS=document.createElement('div');displayOverlayS.id='matrix-display-scanlines';Object.assign(displayOverlayS.style,{position:'fixed',inset:0,pointerEvents:'none',zIndex:2147483639});root().appendChild(displayOverlayS);} const v=d.vignette/100;displayOverlayV.style.display=(d.enabled&&d.vignette>0)?'block':'none';displayOverlayV.style.background=`radial-gradient(circle, transparent 30%, rgba(0,0,0,${v*.8}) 95%)`;const op=d.scanlines/100;displayOverlayS.style.display=(d.enabled&&d.scanlines>0)?'block':'none';displayOverlayS.style.background=`repeating-linear-gradient(0deg,rgba(0,0,0,${op*.6}) 0 2px,transparent 2px 4px)`;if(!d.enabled)c.style.filter='';}
  function setDisplay(enabled){state.display.enabled=!!enabled;if(!enabled){const c=document.querySelector('canvas');if(c)c.style.filter='';}displayApply();}

  // ---------- Visual keyboard ----------
  const keys=[['W'],['A','S','D'],['SPACE','CTRL','SHIFT']]; let vkPanel=null; const vkPressed=new Set();
  function vkBuild(){if(vkPanel)vkPanel.remove();vkPanel=document.createElement('div');vkPanel.id='matrix-keyboard-overlay';vkPanel.className='matrix-community-panel';Object.assign(vkPanel.style,{left:state.keyboard.x+'px',top:state.keyboard.y+'px',transform:`scale(${state.keyboard.scale})`,transformOrigin:'top left',opacity:state.keyboard.opacity,display:state.keyboard.enabled?'block':'none',padding:'7px'});vkPanel.innerHTML=keys.map(row=>`<div class="matrix-vk-row">${row.map(k=>`<div class="matrix-vk-key" data-key="${k}">${k}</div>`).join('')}</div>`).join('')+`<div class="matrix-community-muted" style="text-align:center;margin-top:4px">Community mod • Itz_Krishna AKA Everlasting</div>`;root().appendChild(vkPanel);}
  function vkUpdate(code,on){let map=code; if(code==='Space')map='SPACE'; if(code==='ControlLeft'||code==='ControlRight')map='CTRL';if(code==='ShiftLeft'||code==='ShiftRight')map='SHIFT';const el=vkPanel?.querySelector(`[data-key="${map}"]`);if(el){el.classList.toggle('active',on);el.style.background=on?state.keyboard.active:state.keyboard.bg;el.style.color=on?'#000':state.keyboard.text;el.style.boxShadow=on&&state.keyboard.glow?'0 0 9px rgba(0,255,255,.55)':'none';}}
  function setKeyboard(enabled){state.keyboard.enabled=!!enabled;if(!vkPanel)vkBuild();vkPanel.style.display=state.keyboard.enabled?'block':'none';}
  document.addEventListener('keydown',e=>{if(!state.keyboard.enabled)return;vkPressed.add(e.code);vkUpdate(e.code,true);});document.addEventListener('keyup',e=>{vkPressed.delete(e.code);vkUpdate(e.code,false);});

  // ---------- FPS ----------
  let fpsPanel=null, fpsFrames=0, fpsLast=performance.now(), fps=60, fpsHist=[], fpsMin=Infinity, fpsMax=0;
  function fpsBuild(){if(fpsPanel)fpsPanel.remove();fpsPanel=document.createElement('div');fpsPanel.id='matrix-fps-panel';fpsPanel.className='matrix-community-panel';Object.assign(fpsPanel.style,{left:state.fps.x+'px',top:state.fps.y+'px',transform:`scale(${state.fps.scale})`,transformOrigin:'top left',opacity:state.fps.opacity,display:state.fps.enabled?'block':'none',padding:'9px 11px',borderColor:state.fps.border});fpsPanel.innerHTML=`<div class="matrix-community-drag" style="display:flex;justify-content:space-between;align-items:center"><span style="font:700 10px Segoe UI;color:${state.fps.text}">FPS</span><span class="fps-val" style="font:700 24px Segoe UI;color:${state.fps.good}">60</span></div>${state.fps.bar?'<div class="fps-bar-bg" style="height:3px;background:#111;border-radius:2px;overflow:hidden;margin:5px 0"><div class="fps-bar" style="height:100%;width:50%;background:${state.fps.good}"></div></div>':''}${state.fps.graph?'<canvas class="fps-graph" width="180" height="36" style="display:block;width:180px;height:36px;border-radius:3px;background:#05050f;margin-top:5px"></canvas>':''}<div class="fps-status" style="font-size:8px;color:${state.fps.good};text-align:center">EXCELLENT</div>`;root().appendChild(fpsPanel);const drag=fpsPanel.querySelector('.matrix-community-drag');let d=false,ox=0,oy=0;drag.onmousedown=e=>{d=true;ox=e.clientX-fpsPanel.getBoundingClientRect().left;oy=e.clientY-fpsPanel.getBoundingClientRect().top;};window.addEventListener('mousemove',e=>{if(!d)return;state.fps.x=e.clientX-ox;state.fps.y=e.clientY-oy;fpsPanel.style.left=state.fps.x+'px';fpsPanel.style.top=state.fps.y+'px';});window.addEventListener('mouseup',()=>d=false);}
  function fpsTick(now){fpsFrames++;if(now-fpsLast>=1000){fps=Math.round(fpsFrames*1000/(now-fpsLast));fpsFrames=0;fpsLast=now;fpsHist.push(fps);if(fpsHist.length>60)fpsHist.shift();fpsMin=Math.min(fpsMin,fps);fpsMax=Math.max(fpsMax,fps);if(fpsPanel&&state.fps.enabled){const val=fpsPanel.querySelector('.fps-val');if(val){val.textContent=fps;val.style.color=fps>=90?state.fps.good:fps>=50?state.fps.medium:state.fps.low;}const st=fpsPanel.querySelector('.fps-status');if(st)st.textContent=fps>=90?'EXCELLENT':fps>=50?'GOOD':'LOW';const bar=fpsPanel.querySelector('.fps-bar');if(bar){bar.style.width=clamp(fps/state.fps.maxTarget*100,0,100)+'%';bar.style.background=fps>=90?state.fps.good:fps>=50?state.fps.medium:state.fps.low;}const g=fpsPanel.querySelector('.fps-graph');if(g&&state.fps.graph){const c=g.getContext('2d');c.clearRect(0,0,g.width,g.height);c.strokeStyle=fps>=90?state.fps.good:fps>=50?state.fps.medium:state.fps.low;c.beginPath();fpsHist.forEach((v,i)=>{const x=i*(g.width/Math.max(1,fpsHist.length-1));const y=g.height-(Math.min(v,Math.max(1,fpsMax))/Math.max(1,fpsMax))*g.height;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();}}}requestAnimationFrame(fpsTick);}
  function setFPS(enabled){state.fps.enabled=!!enabled;if(!fpsPanel)fpsBuild();fpsPanel.style.display=state.fps.enabled?'block':'none';}

  function sync(cfg){
    Object.keys(state).forEach(group=>{const prefix=group+'.'; for(const [k,v] of Object.entries(cfg||{})){if(k.startsWith(prefix)) state[group][k.slice(prefix.length)]=v;}});
    if(state.mouse.enabled)setMouse(true);if(state.stopwatch.enabled)setStopwatch(true);if(state.display.enabled)setDisplay(true);if(state.keyboard.enabled)setKeyboard(true);if(state.fps.enabled)setFPS(true);
  }

  window.__matrixCommunityMods={
    discord:DISCORD,
    setMouseTrail:setMouse,
    setMouseTrailConfig:(key,val)=>{if(key in state.mouse){state.mouse[key]=val;if(state.mouse.enabled)mtStart();}},
    setStopwatch,
    setStopwatchConfig:(key,val)=>{if(key in state.stopwatch){state.stopwatch[key]=val;if(swPanel){swPanel.style.left=state.stopwatch.x+'px';swPanel.style.top=state.stopwatch.y+'px';swPanel.style.transform=`scale(${state.stopwatch.scale})`;}}},
    setDisplayEnhancer:setDisplay,
    setDisplayConfig:(key,val)=>{if(key in state.display){state.display[key]=val;displayApply();}},
    setVisualKeyboard:setKeyboard,
    setVisualKeyboardConfig:(key,val)=>{if(key in state.keyboard){state.keyboard[key]=val;if(vkPanel){vkPanel.style.left=state.keyboard.x+'px';vkPanel.style.top=state.keyboard.y+'px';vkPanel.style.transform=`scale(${state.keyboard.scale})`;vkPanel.style.opacity=state.keyboard.opacity;vkPanel.querySelectorAll('.matrix-vk-key').forEach(el=>{el.style.background=el.classList.contains('active')?state.keyboard.active:state.keyboard.bg;el.style.color=el.classList.contains('active')?'#000':state.keyboard.text;el.style.boxShadow=el.classList.contains('active')&&state.keyboard.glow?'0 0 9px rgba(0,255,255,.55)':'none';});}}},
    setFPSCounter:setFPS,
    setFPSConfig:(key,val)=>{if(key in state.fps){state.fps[key]=val;if(fpsPanel){fpsPanel.style.left=state.fps.x+'px';fpsPanel.style.top=state.fps.y+'px';fpsPanel.style.transform=`scale(${state.fps.scale})`;fpsPanel.style.opacity=state.fps.opacity;fpsPanel.style.borderColor=state.fps.border;}}},
    sync
  };

  try{window.electronAPI?.onSettingChanged?.((key,value)=>{if(!key.includes('.'))return;const p=key.indexOf('.');const group=key.slice(0,p),name=key.slice(p+1);if(group in state&&name in state[group]){state[group][name]=value;if(group==='mouse')setMouse(state.mouse.enabled);if(group==='stopwatch')setStopwatch(state.stopwatch.enabled);if(group==='display')setDisplay(state.display.enabled);if(group==='keyboard')setKeyboard(state.keyboard.enabled);if(group==='fps')setFPS(state.fps.enabled);}});}catch(_){}
  requestAnimationFrame(fpsTick);
  window.addEventListener('resize',()=>displayApply());
  window.dispatchEvent(new CustomEvent("matrix-community-ready"));
})();
