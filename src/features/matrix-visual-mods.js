(function () {
  'use strict';
  if (window.__matrixVisualModsLoaded) return;
  window.__matrixVisualModsLoaded = true;

  const KEY = 'matrix-visual-mods-v2-g-menu';
  const defaults = {
    menuOpen: false,
    shader: 'none',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    hueRotate: 0,
    invert: 0,
    blur: 0,
    darkLevel: 0,
    fullBright: false,
    brightLevel: 135,
    ultraNight: false,
    screenEffects: false,
    vignette: false,
    flashlight: false,
    galaxy: false,
    galaxyDensity: 55,
    galaxyIntensity: 0.55,
    rain: false,
    lava: false,
    lightning: false,
    particles: 'none',
    particleDensity: 60,
    particleSpeed: 1,
    crosshair: false,
    crosshairType: 'dot',
    crosshairSize: 10,
    crosshairRGB: true,
    showHUD: false,
    hudPosition: 'top-left',
    hudFontSize: 14,
    hudFont: 'Arial',
    hudWeight: '800',
    hudRGB: true,
    font: 'Arial',
    fontScope: 'matrix',
    fontEnabled: false
  };

  let cfg = { ...defaults };
  try { cfg = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {} };

  const fonts = [
    ['Arial', 'Arial, sans-serif'],
    ['Verdana', 'Verdana, sans-serif'],
    ['Trebuchet MS', 'Trebuchet MS, sans-serif'],
    ['Tahoma', 'Tahoma, sans-serif'],
    ['Georgia', 'Georgia, serif'],
    ['Times New Roman', 'Times New Roman, serif'],
    ['Courier New', 'Courier New, monospace'],
    ['Lucida Console', 'Lucida Console, monospace'],
    ['Impact', 'Impact, fantasy'],
    ['Palatino', 'Palatino Linotype, Book Antiqua, serif'],
    ['Comic Sans MS', 'Comic Sans MS, cursive'],
    ['Love Days', 'LoveDays, serif']
  ];

  const shaderMap = {
    none: '',
    'realistic-low': 'brightness(1.05) contrast(1.05) saturate(1.05)',
    'realistic-high': 'brightness(1.12) contrast(1.15) saturate(1.25) sepia(0.12)',
    'realistic-ultra': 'brightness(1.20) contrast(1.20) saturate(1.40) sepia(0.20)',
    bloom: 'brightness(1.10) contrast(1.15)',
    vibrant: 'saturate(1.60) contrast(1.10)',
    cinematic: 'contrast(1.25) brightness(0.90) saturate(0.80)',
    noir: 'grayscale(1) contrast(1.50) brightness(0.90)',
    thermal: 'hue-rotate(180deg) saturate(2.50) brightness(1.20)',
    retro: 'saturate(1.30) contrast(1.20) sepia(0.30)',
    acid: 'hue-rotate(90deg) saturate(2) contrast(1.50)',
    cyberpunk: 'hue-rotate(270deg) saturate(1.80) contrast(1.40) brightness(1.10)',
    neon: 'saturate(2) contrast(1.30) brightness(1.15)',
    dreamscape: 'saturate(1.50) hue-rotate(15deg) brightness(1.05) contrast(1.10)',
    matrix: 'saturate(2) hue-rotate(120deg) contrast(1.25)',
    underwater: 'hue-rotate(200deg) saturate(1.40) brightness(0.90)',
    sunset: 'hue-rotate(15deg) saturate(1.80) brightness(1.10) contrast(1.15)',
    frost: 'hue-rotate(200deg) saturate(0.50) brightness(1.20) contrast(1.10)',
    vintage: 'sepia(0.40) saturate(0.70) contrast(1.10) brightness(0.95)'
  };

  const root = document.createElement('div');
  root.id = 'matrix-visual-root';
  document.documentElement.appendChild(root);

  const style = document.createElement('style');
  style.id = 'matrix-visual-style';
  const localFont = window.__matrixAssets && window.__matrixAssets.loveDaysFont ? `@font-face{font-family:'LoveDays';src:url(${window.__matrixAssets.loveDaysFont}) format('truetype');font-display:swap;}` : '';
  style.textContent = localFont + `
    #matrix-visual-root{font-family:Arial,sans-serif}
    #mvm-menu{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(820px,95vw);max-height:88vh;overflow:auto;display:none;z-index:2147483600;color:#eef6ff;background:rgba(7,12,22,.97);border:1px solid rgba(92,170,255,.42);border-radius:16px;box-shadow:0 18px 80px rgba(0,0,0,.55),0 0 40px rgba(20,125,255,.12);backdrop-filter:blur(18px)}
    #mvm-menu.open{display:block}
    #mvm-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:rgba(7,12,22,.97);z-index:2}
    #mvm-head b{font-size:17px}.mvm-close{border:0;background:transparent;color:#9db4ca;font-size:20px;cursor:pointer}
    .mvm-tabs{display:flex;gap:4px;padding:8px;background:rgba(0,0,0,.22);overflow:auto}.mvm-tab{padding:8px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.07);cursor:pointer;color:#9fb2c5;white-space:nowrap;font-size:11px}.mvm-tab.active{color:#fff;background:#123251;border-color:#357db7}
    .mvm-body{padding:14px}.mvm-pane{display:none}.mvm-pane.active{display:block}.mvm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mvm-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:12px}.mvm-card h4{margin:0 0 8px;font-size:13px}.mvm-row{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:8px 0;font-size:12px}.mvm-row select,.mvm-row input[type=range]{width:62%}.mvm-row button,.mvm-btn{border:1px solid rgba(92,170,255,.35);background:#101d2d;color:#eaf4ff;border-radius:8px;padding:7px 10px;cursor:pointer;transition:.16s ease}.mvm-row button:hover,.mvm-btn:hover{border-color:rgba(92,170,255,.65);transform:translateY(-1px)}.mvm-row button.mod-active,.mvm-btn.mod-active{background:linear-gradient(180deg,#0d6b37,#084f2a);border-color:#22e676;color:#fff;box-shadow:0 0 0 1px rgba(34,230,118,.15),0 0 16px rgba(34,230,118,.18)}.mvm-row button.mod-active:hover,.mvm-btn.mod-active:hover{background:linear-gradient(180deg,#118a48,#0a6434);border-color:#38f08a}.mvm-note{font-size:10px;color:#7e94aa;line-height:1.4}.mvm-value{font-size:10px;color:#77d8ff}.mvm-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mvm-font{padding:10px;border-radius:8px;background:#0d1622;border:1px solid rgba(255,255,255,.06);cursor:pointer}.mvm-font.active{border-color:#51b9ff;background:#112a40}
    #mvm-hud{position:fixed;inset:0;pointer-events:none;z-index:2147483400}.mvm-cross{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:none;text-shadow:0 0 8px rgba(0,0,0,.9)}
    #mvm-stats{position:absolute;right:14px;top:14px;display:none;gap:4px;flex-direction:column;align-items:flex-end;color:#eaf5ff;font:600 12px/1.2 Arial,sans-serif;text-shadow:0 1px 4px #000}
    #mvm-keys{position:absolute;left:16px;bottom:16px;display:none;gap:4px;flex-direction:column}.mvm-keyrow{display:flex;justify-content:center;gap:4px}.mvm-key{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:rgba(7,11,18,.72);border:1px solid rgba(255,255,255,.18);color:#fff;font:700 13px/1 Arial,sans-serif}.mvm-key.active{background:rgba(50,150,255,.75);border-color:#a9dcff;transform:translateY(1px)}
    .mvm-overlay{position:fixed;inset:0;pointer-events:none}.mvm-shader{z-index:2147483300;display:none}.mvm-dark{z-index:2147483200;display:none;background:#000}.mvm-bright{z-index:2147483190;display:none;background:#fff;mix-blend-mode:screen}.mvm-night{z-index:2147483180;display:none;background:rgba(0,0,15,.55)}.mvm-flash{z-index:2147483170;display:none;background:radial-gradient(circle at 50% 50%,rgba(255,248,220,.36) 0,rgba(255,248,220,.20) 26%,rgba(0,0,0,.08) 42%,rgba(0,0,0,.88) 72%)}.mvm-vignette{z-index:2147483160;display:none;background:radial-gradient(circle,transparent 45%,rgba(0,0,0,.55) 100%)}.mvm-sun{z-index:2147483150;display:none;background:radial-gradient(circle at center,rgba(255,220,140,.25),rgba(255,180,80,.08),transparent 70%)}.mvm-weather{z-index:2147483140}.on{display:block!important}.mvm-screen{filter:none}
    #mvm-galaxy{position:fixed;inset:0;z-index:2147483100;display:none;pointer-events:none;mix-blend-mode:screen}.mvm-status{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:rgba(0,0,0,.72);color:#9ff5e8;padding:8px 14px;border-radius:18px;font:700 12px Arial,sans-serif;z-index:2147483500;pointer-events:none;opacity:0;transition:opacity .2s}.mvm-status.show{opacity:1}
    @media(max-width:700px){.mvm-grid{grid-template-columns:1fr}.mvm-grid-3{grid-template-columns:repeat(2,1fr)}}
  `;
  root.appendChild(style);

  const hud = document.createElement('div'); hud.id='mvm-hud'; hud.innerHTML=`
    <div class="mvm-cross" id="mvm-cross"></div>
    <div id="mvm-stats"><span id="mvm-fps">FPS: --</span><span id="mvm-cps">CPS: 0</span><span id="mvm-ping">PING: --</span></div>
    <div id="mvm-keys"><div class="mvm-keyrow"><div class="mvm-key" data-k="KeyW">W</div></div><div class="mvm-keyrow"><div class="mvm-key" data-k="KeyA">A</div><div class="mvm-key" data-k="KeyS">S</div><div class="mvm-key" data-k="KeyD">D</div></div></div>`;
  root.appendChild(hud);

  const overlay = (cls) => { const el=document.createElement('div'); el.className='mvm-overlay '+cls; root.appendChild(el); return el; };
  const shaderLayer=overlay('mvm-shader'), darkLayer=overlay('mvm-dark'), brightLayer=overlay('mvm-bright'), nightLayer=overlay('mvm-night'), flashLayer=overlay('mvm-flash'), vignetteLayer=overlay('mvm-vignette'), sunLayer=overlay('mvm-sun');

  const weatherCanvas=document.createElement('canvas'); weatherCanvas.id='mvm-weather'; weatherCanvas.className='mvm-overlay mvm-weather'; root.appendChild(weatherCanvas); const wctx=weatherCanvas.getContext('2d');
  const galaxyCanvas=document.createElement('canvas'); galaxyCanvas.id='mvm-galaxy'; root.appendChild(galaxyCanvas); const gctx=galaxyCanvas.getContext('2d');
  const status=document.createElement('div'); status.className='mvm-status'; root.appendChild(status);
  let statusTimer=null;
  function notify(text){ status.textContent=text; status.classList.add('show'); clearTimeout(statusTimer); statusTimer=setTimeout(()=>status.classList.remove('show'),1500); }

  function gameCanvas(){
    const all=Array.from(document.querySelectorAll('canvas')).filter(c=>{
      if(c===weatherCanvas||c===galaxyCanvas) return false;
      if(root.contains(c)) return false;
      const r=c.getBoundingClientRect();
      return r.width>100 && r.height>100 && getComputedStyle(c).display!=='none' && getComputedStyle(c).visibility!=='hidden';
    });
    if(!all.length) return null;
    const preferred=document.querySelector('canvas#game, canvas#game-canvas, canvas[data-engine], canvas[class*="game"]');
    if(preferred && !root.contains(preferred)) return preferred;
    return all.reduce((best,c)=>(c.clientWidth*c.clientHeight)>(best.clientWidth*best.clientHeight)?c:best);
  }

  function applyFont(){
    let st=document.getElementById('mvm-font-style');
    if(!cfg.fontEnabled){
      if(st) st.remove();
      return;
    }
    const item=fonts.find(f=>f[0]===cfg.font)||fonts[0];
    const selector=cfg.fontScope==='page'?'body, body button, body input, body textarea, body select, body label, body span, body p':'#mvm-menu, #mvm-menu button, #mvm-menu select, #mvm-menu input, #mvm-menu label, #mvm-menu span, #mvm-menu p, #mvm-menu h4';
    if(!st){st=document.createElement('style');st.id='mvm-font-style';document.head.appendChild(st);}
    st.textContent=`${selector}{font-family:${item[1]} !important}`;
  }

  function applyGameFilter(){
    const c=gameCanvas();
    if(!c){ setTimeout(applyGameFilter,350); return; }
    const parts=[];
    if(cfg.brightness!==100) parts.push(`brightness(${cfg.brightness}%)`);
    if(cfg.contrast!==100) parts.push(`contrast(${cfg.contrast}%)`);
    if(cfg.saturation!==100) parts.push(`saturate(${cfg.saturation}%)`);
    if(cfg.sepia!==0) parts.push(`sepia(${cfg.sepia}%)`);
    if(cfg.hueRotate!==0) parts.push(`hue-rotate(${cfg.hueRotate}deg)`);
    if(cfg.invert!==0) parts.push(`invert(${cfg.invert}%)`);
    if(cfg.blur!==0) parts.push(`blur(${cfg.blur}px)`);
    if(shaderMap[cfg.shader]) parts.push(shaderMap[cfg.shader]);
    if(cfg.fullBright) parts.push(`brightness(${Math.max(1.05,cfg.brightLevel/100)})`);
    if(cfg.ultraNight) parts.push('contrast(1.25) saturate(1.35) brightness(.88)');
    if(cfg.screenEffects) parts.push('blur(2px) contrast(1.2) saturate(1.5)');
    c.style.filter=parts.join(' ') || 'none';
    c.style.transform='translateZ(0)';
  }

  function applyOverlays(){
    darkLayer.style.opacity=Math.min(.85,Math.max(0,cfg.darkLevel/100)); darkLayer.classList.toggle('on',cfg.darkLevel>0);
    brightLayer.style.opacity=Math.min(.65,Math.max(0,(cfg.brightLevel-100)/55)); brightLayer.classList.toggle('on',!!cfg.fullBright);
    nightLayer.style.opacity=cfg.ultraNight?.7:0; nightLayer.classList.toggle('on',!!cfg.ultraNight);
    flashLayer.classList.toggle('on',!!cfg.flashlight);
    vignetteLayer.classList.toggle('on',!!(cfg.screenEffects&&cfg.vignette));
    sunLayer.classList.toggle('on',cfg.shader==='realistic-low'||cfg.shader==='realistic-high'||cfg.shader==='realistic-ultra');
    updateCrosshair(); updateHud();
  }

  const crossStyles={
    dot:'<div style="width:6px;height:6px;border-radius:50%;background:currentColor"></div>',
    cross:'<div style="position:absolute;width:1px;height:12px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%)"></div><div style="position:absolute;width:12px;height:1px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%)"></div>',
    plus:'<div style="position:absolute;width:2px;height:16px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%)"></div><div style="position:absolute;width:16px;height:2px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%)"></div>',
    x:'<div style="position:absolute;width:2px;height:14px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%) rotate(45deg)"></div><div style="position:absolute;width:2px;height:14px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-45deg)"></div>',
    triangle:'<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:12px solid currentColor"></div>',
    diamond:'<div style="width:10px;height:10px;background:currentColor;transform:rotate(45deg)"></div>',
    circle:'<div style="width:12px;height:12px;border:2px solid currentColor;border-radius:50%"></div>',
    brackets:'<div style="position:absolute;inset:1px;border-top:2px solid currentColor;border-left:2px solid currentColor;width:8px;height:8px"></div><div style="position:absolute;inset:1px auto auto auto;right:1px;border-top:2px solid currentColor;border-right:2px solid currentColor;width:8px;height:8px"></div><div style="position:absolute;left:1px;bottom:1px;border-bottom:2px solid currentColor;border-left:2px solid currentColor;width:8px;height:8px"></div><div style="position:absolute;right:1px;bottom:1px;border-bottom:2px solid currentColor;border-right:2px solid currentColor;width:8px;height:8px"></div>',
    star:'★',heart:'♥',
    arrow:'➤',target:'◎',square:'■',hex:'⬢',spark:'✦',ring:'⊙',diamond2:'◇',chevron:'⌄',asterisk:'✱'
  };
  let crossColorHue=0;
  function updateCrosshair(){
    const el=document.getElementById('mvm-cross'); if(!el) return;
    el.style.display=cfg.crosshair?'block':'none'; if(!cfg.crosshair)return;
    el.innerHTML=crossStyles[cfg.crosshairType]||crossStyles.dot; el.style.fontSize=cfg.crosshairSize+'px';
    el.style.color=cfg.crosshairRGB?`hsl(${crossColorHue},100%,50%)`:'#fff';
  }

  let fps=0,lastFps=performance.now(),frames=0,cps=0,ping='--'; const clicks=[];
  window.addEventListener('pointerdown',e=>{if(e.isTrusted){const t=performance.now();clicks.push(t);}} ,true);
  function updateHud(){
    const stats=document.getElementById('mvm-stats'), keys=document.getElementById('mvm-keys'); stats.style.display=cfg.showHUD?'flex':'none'; keys.style.display=cfg.showHUD?'flex':'none';
    stats.style.top=cfg.hudPosition.includes('top')?'14px':'auto'; stats.style.bottom=cfg.hudPosition.includes('bottom')?'14px':'auto'; stats.style.left=cfg.hudPosition.includes('left')?'14px':'auto'; stats.style.right=cfg.hudPosition.includes('right')?'14px':'auto'; stats.style.alignItems=cfg.hudPosition.includes('left')?'flex-start':'flex-end';
    stats.style.fontFamily=(fonts.find(f=>f[0]===cfg.hudFont)||fonts[0])[1]; stats.style.fontSize=cfg.hudFontSize+'px'; stats.style.fontWeight=cfg.hudWeight; stats.style.color=cfg.hudRGB?`hsl(${crossColorHue},100%,70%)`:'#fff';
  }

  const weather={rain:[],lava:[],bolts:[]};
  function resizeCanvas(c){c.width=innerWidth;c.height=innerHeight;}
  function initWeather(){resizeCanvas(weatherCanvas); resizeCanvas(galaxyCanvas); weather.rain=Array.from({length:450},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,speed:16+Math.random()*8})); weather.lava=Array.from({length:90},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:2+Math.random()*4,speed:.6+Math.random()*1.2,a:.2+Math.random()*.4})); rebuildGalaxy();}
  let stars=[];
  function rebuildGalaxy(){stars=Array.from({length:Math.max(18,Math.round(cfg.galaxyDensity*innerWidth*innerHeight/130000))},()=>({x:Math.random()*galaxyCanvas.width,y:Math.random()*galaxyCanvas.height,r:Math.random()*1.8+.25,a:Math.random()*.8+.2,v:Math.random()*.22+.03,h:Math.random()*75+185}));}
  addEventListener('resize',initWeather);
  function createBolt(){let x=Math.random()*weatherCanvas.width,y=0,pts=[{x,y}];while(y<weatherCanvas.height*.9){x+=(Math.random()-.5)*45;y+=Math.random()*40;pts.push({x,y});}weather.bolts.push({pts,a:1});}
  function weatherFrame(){
    wctx.clearRect(0,0,weatherCanvas.width,weatherCanvas.height);
    if(cfg.rain){wctx.strokeStyle='rgba(180,200,255,.78)';wctx.lineWidth=1.4;for(const r of weather.rain){wctx.beginPath();wctx.moveTo(r.x,r.y);wctx.lineTo(r.x-3,r.y+18);wctx.stroke();r.y+=r.speed;if(r.y>weatherCanvas.height){r.y=-20;r.x=Math.random()*weatherCanvas.width;}}}
    if(cfg.lava){for(const l of weather.lava){wctx.beginPath();wctx.fillStyle=`rgba(255,${80+Math.random()*120},0,${l.a})`;wctx.shadowBlur=12;wctx.shadowColor='orange';wctx.arc(l.x,l.y,l.r,0,Math.PI*2);wctx.fill();wctx.shadowBlur=0;l.y+=l.speed;if(l.y>weatherCanvas.height){l.y=-10;l.x=Math.random()*weatherCanvas.width;}}}
    for(let i=weather.bolts.length-1;i>=0;i--){const b=weather.bolts[i];wctx.beginPath();wctx.strokeStyle=`rgba(255,255,255,${b.a})`;wctx.shadowBlur=18;wctx.shadowColor='white';wctx.lineWidth=3;wctx.moveTo(b.pts[0].x,b.pts[0].y);for(let j=1;j<b.pts.length;j++)wctx.lineTo(b.pts[j].x,b.pts[j].y);wctx.stroke();wctx.shadowBlur=0;b.a-=.08;if(b.a<=0)weather.bolts.splice(i,1);}
    weatherCanvas.style.display=(cfg.rain||cfg.lava||weather.bolts.length)?'block':'none';
    requestAnimationFrame(weatherFrame);
  }
  function galaxyFrame(){gctx.clearRect(0,0,galaxyCanvas.width,galaxyCanvas.height);if(cfg.galaxy){galaxyCanvas.style.display='block';for(const s of stars){s.y+=s.v;if(s.y>galaxyCanvas.height)s.y=-2;gctx.fillStyle=`hsla(${s.h},100%,80%,${s.a*cfg.galaxyIntensity})`;gctx.fillRect(s.x,s.y,s.r,s.r);}}else galaxyCanvas.style.display='none';requestAnimationFrame(galaxyFrame);}

  let rainAudio=null,thunderAudio=null;
  try{
    rainAudio=new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8d1d6d95f.mp3?filename=rain-ambient-110397.mp3'); rainAudio.loop=true; rainAudio.volume=.25;
    thunderAudio=new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_4d7f4e3130.mp3?filename=thunder-103602.mp3'); thunderAudio.volume=.45;
  }catch(_){ }
  let audioUnlocked=false;
  addEventListener('click',()=>{if(audioUnlocked)return;audioUnlocked=true;if(rainAudio)rainAudio.play().then(()=>rainAudio.pause()).catch(()=>{});},{once:true});
  setInterval(()=>{if(cfg.lightning){createBolt();if(thunderAudio){thunderAudio.currentTime=0;thunderAudio.play().catch(()=>{});}}},1500);

  const menu=document.createElement('div'); menu.id='mvm-menu';
  menu.innerHTML=`
    <div id="mvm-head"><b>Matrix Visual Lab</b><button class="mvm-close" id="mvm-close">×</button></div>
    <div class="mvm-tabs">
      <button class="mvm-tab active" data-pane="appearance">🎨 Appearance</button>
      <button class="mvm-tab" data-pane="shaders">✨ Shaders</button>
      <button class="mvm-tab" data-pane="effects">🌧 Effects</button>
      <button class="mvm-tab" data-pane="hud">🎯 HUD</button>
      <button class="mvm-tab" data-pane="fonts">🔤 Fonts</button>
      <button class="mvm-tab" data-pane="performance">⚡ Performance</button>
    </div>
    <div class="mvm-body">
      <section class="mvm-pane active" id="pane-appearance"><div class="mvm-grid">
        <div class="mvm-card"><h4>Brightness / Dark</h4><div class="mvm-row"><span>Dark level</span><input id="m-dark" type="range" min="0" max="85" step="1"><span class="mvm-value" id="mv-dark"></span></div><div class="mvm-row"><button id="m-bright">Toggle Full Bright</button><span class="mvm-value" id="mv-bright"></span></div><div class="mvm-row"><span>Bright level</span><input id="m-bright-level" type="range" min="100" max="180" step="5"><span class="mvm-value" id="mv-bright-level"></span></div><div class="mvm-row"><button id="m-ultra">Ultra Dark Night</button><span class="mvm-value" id="mv-ultra"></span></div></div>
        <div class="mvm-card"><h4>Image controls</h4><div class="mvm-row"><span>Brightness</span><input id="m-bri" type="range" min="30" max="200" step="5"><span class="mvm-value" id="mv-bri"></span></div><div class="mvm-row"><span>Contrast</span><input id="m-con" type="range" min="30" max="200" step="5"><span class="mvm-value" id="mv-con"></span></div><div class="mvm-row"><span>Saturation</span><input id="m-sat" type="range" min="0" max="300" step="10"><span class="mvm-value" id="mv-sat"></span></div><div class="mvm-row"><span>Sepia</span><input id="m-sep" type="range" min="0" max="100" step="5"><span class="mvm-value" id="mv-sep"></span></div></div>
      </div></section>
      <section class="mvm-pane" id="pane-shaders"><div class="mvm-card"><h4>Shaders</h4><div class="mvm-row"><span>Preset</span><select id="m-shader"><option value="none">None</option><option value="realistic-low">Realistic Low</option><option value="realistic-high">Realistic High</option><option value="realistic-ultra">Realistic Ultra</option><option value="bloom">Bloom</option><option value="vibrant">Vibrant</option><option value="cinematic">Cinematic</option><option value="noir">Noir</option><option value="thermal">Thermal</option><option value="retro">Retro</option><option value="acid">Acid</option><option value="cyberpunk">Cyberpunk</option><option value="neon">Neon</option><option value="dreamscape">Dreamscape</option><option value="matrix">Matrix</option><option value="underwater">Underwater</option><option value="sunset">Sunset</option><option value="frost">Frost</option><option value="vintage">Vintage</option></select></div><div class="mvm-note">The Low / High / Ultra shader presets are mapped directly to the game canvas so they do not overwrite the entire UI.</div></div></section>
      <section class="mvm-pane" id="pane-effects"><div class="mvm-grid"><div class="mvm-card"><h4>Galaxy / Weather</h4><div class="mvm-row"><button id="m-galaxy">Galaxy Mode</button><span class="mvm-value" id="mv-galaxy"></span></div><div class="mvm-row"><button id="m-rain">🌧 Rain</button><span class="mvm-value" id="mv-rain"></span></div><div class="mvm-row"><button id="m-lava">🔥 Lava Sky</button><span class="mvm-value" id="mv-lava"></span></div><div class="mvm-row"><button id="m-lightning">⚡ Lightning</button><span class="mvm-value" id="mv-lightning"></span></div></div><div class="mvm-card"><h4>Screen Effects / Flashlight</h4><div class="mvm-row"><button id="m-screen">Screen Effects</button><span class="mvm-value" id="mv-screen"></span></div><div class="mvm-row"><button id="m-vignette">Vignette</button><span class="mvm-value" id="mv-vignette"></span></div><div class="mvm-row"><button id="m-flash">🔦 Flashlight (L)</button><span class="mvm-value" id="mv-flash"></span></div><div class="mvm-note">Flashlight uses the same L hotkey behavior from the provided script.</div></div></div></section>
      <section class="mvm-pane" id="pane-hud"><div class="mvm-grid"><div class="mvm-card"><h4>Crosshair</h4><div class="mvm-row"><button id="m-cross">Toggle Crosshair</button><span class="mvm-value" id="mv-cross"></span></div><div class="mvm-row"><span>Type</span><select id="m-cross-type"><option value="dot">Dot</option><option value="cross">Cross</option><option value="plus">Plus</option><option value="x">X</option><option value="triangle">Triangle</option><option value="diamond">Diamond</option><option value="circle">Circle</option><option value="brackets">Brackets</option><option value="star">Star</option><option value="heart">Heart</option></select></div><div class="mvm-row"><span>Size</span><input id="m-cross-size" type="range" min="5" max="40" step="1"><span class="mvm-value" id="mv-cross-size"></span></div><div class="mvm-row"><button id="m-cross-rgb">RGB Crosshair</button><span class="mvm-value" id="mv-cross-rgb"></span></div></div><div class="mvm-card"><h4>HUD</h4><div class="mvm-row"><button id="m-hud">Show HUD</button><span class="mvm-value" id="mv-hud"></span></div><div class="mvm-row"><span>Font</span><select id="m-hud-font"></select></div><div class="mvm-row"><span>Size</span><input id="m-hud-size" type="range" min="10" max="24" step="1"><span class="mvm-value" id="mv-hud-size"></span></div><div class="mvm-row"><span>Weight</span><select id="m-hud-weight"><option>400</option><option>600</option><option>700</option><option>800</option></select></div></div></div></section>
      <section class="mvm-pane" id="pane-fonts"><div class="mvm-card"><h4>Font Manager — 12 options</h4><div class="mvm-row"><span>Enable custom font</span><button id="m-font-enable">Disabled</button><span class="mvm-value" id="mv-font-enable"></span></div><div class="mvm-row"><span>Scope</span><select id="m-font-scope"><option value="matrix">Matrix UI only</option><option value="page">Game page UI</option></select></div><div class="mvm-grid-3" id="font-grid"></div><div class="mvm-font-preview" id="font-preview">Matrix Client — Preview 123</div></div></section>
      <section class="mvm-pane" id="pane-performance"><div class="mvm-grid"><div class="mvm-card"><h4>Provided script performance options</h4><div class="mvm-row"><span>FPS/WebGL boost</span><button id="m-perf">Toggle</button></div><div class="mvm-row"><span>Disable anti-aliasing</span><button id="m-aa">Toggle</button></div><div class="mvm-row"><span>Low latency</span><button id="m-latency">Toggle</button></div><div class="mvm-note">These options are applied conservatively by the Matrix client. The original aggressive visibility overrides are intentionally not copied because they can interfere with MineFun's renderer.</div></div><div class="mvm-card"><h4>Menu</h4><div class="mvm-row"><span>Open key</span><button id="m-open-key">G</button></div><div class="mvm-note">Press G to open/close the Matrix mod menu. Mods start OFF and are enabled manually from here.</div></div></div></section>
    </div>`;
  // The Visual Lab is now controlled by the main Matrix G menu.
  menu.style.display = 'none';
  root.appendChild(menu);

  const perfState={boost:true,aa:true,latency:true};
  function buttonState(id,on,label){const b=document.getElementById(id),v=document.getElementById('mv-'+label);if(b){b.classList.toggle('mod-active',!!on);b.setAttribute('aria-pressed',on?'true':'false');}if(v)v.textContent=on?'ON':'OFF';}
  function syncUI(){
    const ids=['dark','bright-level','bri','con','sat','sep','cross-size','hud-size']; const vals={dark:cfg.darkLevel+'%', 'bright-level':cfg.brightLevel+'%', bri:cfg.brightness+'%',con:cfg.contrast+'%',sat:cfg.saturation+'%',sep:cfg.sepia+'%', 'cross-size':cfg.crosshairSize+'px','hud-size':cfg.hudFontSize+'px'};
    for(const k of ids){const el=document.getElementById('m-'+k);if(el)el.value=String(k==='bright-level'?cfg.brightLevel:k==='bri'?cfg.brightness:k==='con'?cfg.contrast:k==='sat'?cfg.saturation:k==='sep'?cfg.sepia:k==='cross-size'?cfg.crosshairSize:k==='hud-size'?cfg.hudFontSize:cfg.darkLevel);const v=document.getElementById('mv-'+k);if(v)v.textContent=vals[k];}
    document.getElementById('m-shader').value=cfg.shader; document.getElementById('m-cross-type').value=cfg.crosshairType; document.getElementById('m-cross-size').value=cfg.crosshairSize; document.getElementById('m-hud-font').value=cfg.hudFont; document.getElementById('m-hud-weight').value=cfg.hudWeight; document.getElementById('m-hud-size').value=cfg.hudFontSize; document.getElementById('m-font-scope').value=cfg.fontScope;
    buttonState(cfg.fullBright,'bright','bright'); buttonState(cfg.ultraNight,'ultra','ultra'); buttonState(cfg.galaxy,'galaxy','galaxy'); buttonState(cfg.rain,'rain','rain');buttonState(cfg.lava,'lava','lava');buttonState(cfg.lightning,'lightning','lightning');buttonState(cfg.screenEffects,'screen','screen');buttonState(cfg.vignette,'vignette','vignette');buttonState(cfg.flashlight,'flash','flash');buttonState(cfg.crosshair,'cross','cross');buttonState(cfg.crosshairRGB,'cross-rgb','cross-rgb');buttonState(cfg.showHUD,'hud','hud');
    const fe=document.getElementById('m-font-enable'); if(fe) fe.textContent=cfg.fontEnabled?'Enabled':'Disabled'; const fev=document.getElementById('mv-font-enable'); if(fev) fev.textContent=cfg.fontEnabled?'ON':'OFF';
    document.getElementById('font-preview').textContent=`${cfg.font} — Matrix Client — Preview 123`;
    document.getElementById('font-preview').style.fontFamily=(fonts.find(f=>f[0]===cfg.font)||fonts[0])[1];
  }

  function bind(){
    document.querySelectorAll('.mvm-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.mvm-tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.mvm-pane').forEach(p=>p.classList.remove('active'));tab.classList.add('active');document.getElementById('pane-'+tab.dataset.pane).classList.add('active');}));
    document.getElementById('mvm-close').onclick=()=>{cfg.menuOpen=false;menu.classList.remove('open');save();};
    const toggles=[['m-bright','fullBright'],['m-ultra','ultraNight'],['m-galaxy','galaxy'],['m-rain','rain'],['m-lava','lava'],['m-lightning','lightning'],['m-screen','screenEffects'],['m-vignette','vignette'],['m-flash','flashlight'],['m-cross','crosshair'],['m-cross-rgb','crosshairRGB'],['m-hud','showHUD']];
    for(const [id,key] of toggles)document.getElementById(id).onclick=()=>{cfg[key]=!cfg[key];save();applyOverlays();syncUI();if(key==='rain'&&rainAudio){if(cfg.rain)rainAudio.play().catch(()=>{});else rainAudio.pause();}if(key==='flashlight')notify(cfg.flashlight?'🔦 Flashlight: ON':'🌑 Flashlight: OFF');};
    const range=[['m-dark','darkLevel'],['m-bright-level','brightLevel'],['m-bri','brightness'],['m-con','contrast'],['m-sat','saturation'],['m-sep','sepia'],['m-cross-size','crosshairSize'],['m-hud-size','hudFontSize']];
    for(const [id,key] of range)document.getElementById(id).oninput=e=>{cfg[key]=Number(e.target.value);save();applyGameFilter();applyOverlays();syncUI();};
    document.getElementById('m-shader').onchange=e=>{cfg.shader=e.target.value;save();applyGameFilter();applyOverlays();};
    document.getElementById('m-cross-type').onchange=e=>{cfg.crosshairType=e.target.value;save();updateCrosshair();};
    document.getElementById('m-hud-font').onchange=e=>{cfg.hudFont=e.target.value;save();updateHud();};
    document.getElementById('m-hud-weight').onchange=e=>{cfg.hudWeight=e.target.value;save();updateHud();};
    const fontEnable=document.getElementById('m-font-enable'); if(fontEnable) fontEnable.onclick=()=>{cfg.fontEnabled=!cfg.fontEnabled;save();applyFont();syncUI();};
    document.getElementById('m-font-scope').onchange=e=>{cfg.fontScope=e.target.value;save();applyFont();};
    document.getElementById('m-perf').onclick=()=>{perfState.boost=!perfState.boost; notify('FPS/WebGL boost '+(perfState.boost?'ON':'OFF'));};
    document.getElementById('m-aa').onclick=()=>{perfState.aa=!perfState.aa; notify('Anti-alias '+(perfState.aa?'ON':'OFF'));};
    document.getElementById('m-latency').onclick=()=>{perfState.latency=!perfState.latency; notify('Low latency '+(perfState.latency?'ON':'OFF'));};
    document.getElementById('m-open-key').onclick=()=>notify('Matrix menu key: G');
    const grid=document.getElementById('font-grid'), hudFont=document.getElementById('m-hud-font');
    for(const [name,family] of fonts){const b=document.createElement('button');b.className='mvm-font';b.textContent=name;b.style.fontFamily=family;b.onclick=()=>{cfg.font=name;cfg.fontEnabled=true;save();applyFont();syncUI();};grid.appendChild(b);const o=document.createElement('option');o.value=name;o.textContent=name;hudFont.appendChild(o);}
  }
  bind();

  function updateHud(){
    const stats=document.getElementById('mvm-stats'),keys=document.getElementById('mvm-keys'); stats.style.display=cfg.showHUD?'flex':'none';keys.style.display=cfg.showHUD?'flex':'none';
    stats.style.fontFamily=(fonts.find(f=>f[0]===cfg.hudFont)||fonts[0])[1];stats.style.fontSize=cfg.hudFontSize+'px';stats.style.fontWeight=cfg.hudWeight;stats.style.color=cfg.hudRGB?`hsl(${crossColorHue},100%,70%)`:'#fff';
  }

  addEventListener('keydown',e=>{
    if(e.code==='Period'&&!cfg.menuOpen&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){cfg.darkLevel=cfg.darkLevel>=80?0:cfg.darkLevel+20;save();applyOverlays();syncUI();}
    if(e.code==='KeyL'&&!cfg.menuOpen&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){cfg.flashlight=!cfg.flashlight;save();applyOverlays();syncUI();notify(cfg.flashlight?'🔦 Flashlight: ON':'🌑 Flashlight: OFF');}
    const key=document.querySelector(`.mvm-key[data-k="${e.code}"]`);if(key)key.classList.add('active');
  },true);
  addEventListener('keyup',e=>{const key=document.querySelector(`.mvm-key[data-k="${e.code}"]`);if(key)key.classList.remove('active');},true);

  function frame(){
    frames++;const t=performance.now();if(t-lastFps>=1000){fps=frames;frames=0;lastFps=t;document.getElementById('mvm-fps').textContent='FPS: '+fps;} clicks.splice(0,clicks.length,...clicks.filter(s=>t-s<1000));cps=clicks.length;document.getElementById('mvm-cps').textContent='CPS: '+cps;if(cfg.crosshairRGB){crossColorHue=(crossColorHue+2)%360;updateCrosshair();} requestAnimationFrame(frame);
  }
  setInterval(()=>{const t=performance.now();fetch(location.origin,{method:'GET',mode:'no-cors',cache:'no-store'}).then(()=>{ping=Math.round(performance.now()-t)}).catch(()=>{});document.getElementById('mvm-ping').textContent='PING: '+ping+'ms';},2500);

  const launch=()=>{
    initWeather(); applyFont(); syncUI(); applyGameFilter(); applyOverlays(); weatherFrame(); galaxyFrame(); frame();
    setInterval(applyGameFilter,1200);
  };
  if(document.readyState==='complete') setTimeout(launch,900); else addEventListener('load',()=>setTimeout(launch,900),{once:true});

  const visualKeys = ['fullBright','ultraNight','galaxy','rain','lava','lightning','screenEffects','vignette','flashlight','crosshair','crosshairRGB','showHUD'];
  function setMod(key, value){
    if(!visualKeys.includes(key)) return false;
    cfg[key]=!!value;
    save();
    applyGameFilter(); applyOverlays();
    if(key==='rain' && rainAudio){ if(cfg.rain) rainAudio.play().catch(()=>{}); else rainAudio.pause(); }
    syncUI();
    return true;
  }
  function toggleMod(key){ return setMod(key, !cfg[key]); }
  function setShaderMode(mode){ if(!(mode in shaderMap)) return false; cfg.shader=mode; save(); applyGameFilter(); applyOverlays(); syncUI(); return true; }
  function setDarkMode(on, level){ cfg.darkLevel=on ? (Number(level)||60) : 0; save(); applyOverlays(); syncUI(); return true; }
  function setFont(name, scope){ if(!fonts.some(f=>f[0]===name)) return false; cfg.font=name; cfg.fontEnabled=true; if(scope) cfg.fontScope=scope; save(); applyFont(); updateHud(); syncUI(); return true; }
  function setConfigValue(key, value){
    const allowed = ['crosshairType','crosshairSize','crosshairRGB','hudPosition','hudFontSize','hudFont','hudWeight','hudRGB','galaxyDensity','galaxyIntensity','brightLevel','brightness','contrast','saturation','sepia'];
    if(!allowed.includes(key)) return false;
    cfg[key] = value; save(); applyGameFilter(); applyOverlays(); syncUI();
    if(key==='galaxyDensity'||key==='galaxyIntensity') rebuildGalaxy();
    if(key==='crosshairRGB') updateCrosshair();
    if(key==='hudRGB') updateHud();
    return true;
  }
  function setHudVisible(on){ return setMod('showHUD', on); }
  window.__matrixVisualMods={
    getConfig:()=>({...cfg}),
    setMenu:()=>{},
    setMod,
    toggleMod,
    setShaderMode,
    setDarkMode,
    setFont,
    setHudVisible,
    setConfigValue,
    getFonts:()=>fonts.map(f=>({name:f[0],family:f[1]})),
    getShaders:()=>Object.keys(shaderMap)
  };
  window.dispatchEvent(new CustomEvent('matrix-visual-ready'));
})();
