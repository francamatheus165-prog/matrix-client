// ==UserScript==
// @name         Matrix Hub V1.0 - Neon Matrix Controls
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Bàn phím RGB tối giản, Rừng rậm & Quỷ Satan, Tiếng gõ Clack Clack, Thiết kế siêu nhỏ gọn không rung lắc.
// @author       Matrix Client
// @match        *://*.minefun.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. ÂM THANH BÀN PHÍM CƠ (CLACK CLACK)
    // ==========================================
    const clackUrl = 'https://actions.google.com/sounds/v1/foley/mechanical_keyboard_keystroke.ogg';
    const playClack = () => {
        let snd = new Audio(clackUrl);
        snd.volume = 1.0;
        snd.play().catch(e => console.log("Click chuột vào game để kích hoạt âm thanh."));
    };

    // ==========================================
    // 2. TỪ ĐIỂN NGÔN NGỮ & CẤU HÌNH VĨNH VIỄN
    // ==========================================
    const langDict = {
        VN: {
            title: "🌌 MATRIX HUB",
            btnLang: "VN ⇆ EN", btnSet: "⚙️ CÀI ĐẶT",
            xhTitle: "🎯 Tâm Nhắm (Thường & VIP)", colorTitle: "🎨 Màu Sắc",
            xhEffTitle: "✨ Hiệu Ứng Tâm", kbEffTitle: "⌨️ Nhấp Nháy Only Phím",
            btnRgb: "🌈 TẮT/BẬT NHÁY RGB (CÀI ĐẶT)",
            eff1: "Tĩnh ⏹️", eff2: "Xoay 🔄", eff3: "Nhịp tim 💓", eff4: "Cầu vồng 🌈", eff5: "Đứng Yên 🛑", eff6: "Sáng 🌟", eff7: "Nháy ⚡", eff8: "Lật 🔂", eff9: "Thu Phóng 🔍", eff10: "Nhiễu Sóng 📺", eff11: "Đổi Màu 💎", eff12: "Ảo Ảnh 👻", eff13: "Quỹ Đạo 🪐", eff14: "Tốc Biến ⚡", eff15: "Góc 3D 🧊", eff16: "Nhập Nhô 🌊", eff17: "Ma Trận 🤖", eff18: "Bùng Nổ 💥",
            kb1: "Sáng Viền 🔲", kb2: "Chớp Tinh Vân 💨", kb3: "Viền Hồng 🌸", kb4: "Nổi Lên 👆", kb5: "V.Cầu vồng 🌈", kb6: "T.Phản 🌗", kb7: "Sóng Vũ Trụ 🌌", kb8: "Neon Chạy 🚨", kb9: "Cực Quang 🎇", kb10: "Quét Cyber 🧬", kb11: "Sao Đêm ✨", kb12: "Hào Quang Lửa 🔥", kb13: "Ánh Vàng 👑", kb14: "Siêu Tân Tinh 🌠", kb15: "Hố Đen 🌪️", kb16: "Đa Vũ Trụ 🌀"
        },
        EN: {
            title: "🌌 MATRIX HUB",
            btnLang: "EN ⇆ VN", btnSet: "⚙️ SETTINGS",
            xhTitle: "🎯 Crosshairs", colorTitle: "🎨 Colors",
            xhEffTitle: "✨ XH Effects", kbEffTitle: "⌨️ Blink Only Keyboard",
            btnRgb: "🌈 TOGGLE RGB (SETTINGS)",
            eff1: "Static ⏹️", eff2: "Spin 🔄", eff3: "Pulse 💓", eff4: "Rainbow 🌈", eff5: "Static 🛑", eff6: "Glow 🌟", eff7: "Blink ⚡", eff8: "Flip 🔂", eff9: "Zoom 🔍", eff10: "Glitch 📺", eff11: "Cycle 💎", eff12: "Ghost 👻", eff13: "Orbit 🪐", eff14: "Flash ⚡", eff15: "3D View 🧊", eff16: "Wave 🌊", eff17: "Matrix 🤖", eff18: "Burst 💥",
            kb1: "Glow Box 🔲", kb2: "Nebula Flash 💨", kb3: "Pink Box 🌸", kb4: "Pop-up 👆", kb5: "RGB Box 🌈", kb6: "Contrast 🌗", kb7: "Cosmic Wave 🌌", kb8: "Neon Trail 🚨", kb9: "Aurora 🎇", kb10: "Cyber Scan 🧬", kb11: "Starry ✨", kb12: "Fire Glow 🔥", kb13: "Gold Shine 👑", kb14: "Supernova 🌠", kb15: "Blackhole 🌪️", kb16: "Multiverse 🌀"
        }
    };

    let cfg = JSON.parse(localStorage.getItem('minefun_hub_cfg')) || {
        lang: 'VN', x: 20, y: 20, xh: '꧁༺❂༻꧂', xhColor: '#00FF00', xhEff: 10, kbEff: 12, setOpen: false, rgbSet: false
    };
    const saveCfg = () => { localStorage.setItem('minefun_hub_cfg', JSON.stringify(cfg)); };

    // ==========================================
    // 3. CSS TỐI GIẢN - KHÔNG RUNG LẮC
    // ==========================================
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@500;700&display=swap');
        .allow-click { pointer-events: auto; }

        /* Khung container siêu nhỏ gọn */
        #hub-container {
            position: fixed; 
            background: rgba(10, 5, 20, 0.95);
            border: 2px solid #3c096c; border-radius: 8px; padding: 8px; width: 235px; z-index: 10000;
            user-select: none; font-family: 'Roboto', sans-serif; cursor: grab;
        }
        #hub-container:active { cursor: grabbing; }

        #hub-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #5a189a; padding-bottom: 4px; margin-bottom: 8px; }
        .hub-title { color: #e0aaff; font-size: 10px; font-weight: bold; text-shadow: 0 0 5px #ff0044; }
        .head-btn { background: #240046; border: 1px solid #9d4edd; color: #e0aaff; font-size: 8px; padding: 2px 4px; border-radius: 3px; cursor: pointer; margin-left: 2px;}
        .head-btn:hover { background: #5a189a; color: #fff; }
        .close-btn { background: #ff0044 !important; color: #fff !important; border: 1px solid #ff99aa !important; font-weight: bold; padding: 2px 4px; }

        /* KHU VỰC BÀN PHÍM CO GIÃN NHỎ GỌN */
        #chaos-keyboard-wrapper {
            position: relative;
            padding: 8px 4px;
            border-radius: 6px;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.4), inset 0 0 10px rgba(0, 255, 0, 0.2);
            border: 1.5px solid #00ff00;
            animation: chaosRgbGlow 3s infinite; /* Chỉ đổi nền, ĐÃ BỎ RUNG LẮC GLITCH */
        }

        @keyframes chaosRgbGlow {
            0%   { background: rgba(255, 0, 0, 0.15); }
            25%  { background: rgba(0, 255, 0, 0.15); }
            50%  { background: rgba(0, 150, 255, 0.15); }
            75%  { background: rgba(150, 0, 255, 0.15); }
            100% { background: rgba(255, 255, 0, 0.15); }
        }

        /* Yếu tố trang trí Mini */
        .nature-vines { position: absolute; top: -6px; left: 2px; font-size: 10px; pointer-events: none; letter-spacing: 4px; z-index: 2; text-shadow: 0 0 5px #00ff00; }
        .lava-pit { position: absolute; bottom: -8px; left: 0; width: 100%; text-align: center; font-size: 10px; pointer-events: none; letter-spacing: 2px; z-index: 2; text-shadow: 0 -2px 8px #ff0000; }

        /* Quỷ mini tuần tra */
        #satan-walker {
            position: absolute; font-size: 14px; pointer-events: none; z-index: 10;
            filter: drop-shadow(0 0 5px #ff0000);
            animation: satanPatrol 10s linear infinite;
        }
        @keyframes satanPatrol {
            0%   { top: -10px; left: -10px; transform: scaleX(1); }
            24%  { top: -10px; left: calc(100% - 10px); transform: scaleX(1); }
            25%  { transform: scaleX(-1); }
            49%  { top: calc(100% - 10px); left: calc(100% - 10px); transform: scaleX(-1); }
            50%  { transform: scaleX(-1); }
            74%  { top: calc(100% - 10px); left: -10px; transform: scaleX(-1); }
            75%  { transform: scaleX(1); }
            100% { top: -10px; left: -10px; transform: scaleX(1); }
        }

        /* Phím bấm kích thước siêu nhỏ (Compact size) */
        .vk-row { display: flex; justify-content: center; gap: 2px; margin-bottom: 2px; position: relative; z-index: 5;}
        .vk-key { 
            background: rgba(10, 0, 20, 0.9); color: #00ff00; font-size: 8px; font-weight: bold; 
            width: 18px; height: 18px; display: flex; justify-content: center; align-items: center; 
            border-radius: 3px; border: 1px solid #ff0044; transition: 0.05s; 
            box-shadow: 0 1px 3px rgba(255,0,0,0.4);
            text-shadow: 0 0 2px #00ff00;
        }
        .vk-key.wide { width: 32px; }
        .vk-key.active { 
            background: #ff0000 !important; color: #fff !important; 
            transform: scale(0.9) translateY(1px); 
            box-shadow: 0 0 10px #ff0000, inset 0 0 5px #ffff00 !important; 
            border-color: #ffff00 !important; 
        }

        /* KHU VỰC CÀI ĐẶT */
        #settings-area { 
            display: ${cfg.setOpen ? 'block' : 'none'}; 
            margin-top: 8px; border-top: 1.5px dashed #7b2cbf; padding: 6px 2px 2px 2px; 
            max-height: 160px; overflow-y: auto; border-radius: 4px;
            background: rgba(0,0,0,0.7);
        }
        #settings-area::-webkit-scrollbar { width: 3px; } #settings-area::-webkit-scrollbar-thumb { background: #ff0044; border-radius: 2px; }

        .set-group { margin-bottom: 6px; }
        .set-title { font-size: 8px; color: #00f5d4; margin-bottom: 3px; font-weight: bold; text-transform: uppercase;}
        
        .flex-xh { display: flex; flex-wrap: wrap; gap: 2px; }
        .grid-color { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; }
        .grid-eff { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
        
        .grid-btn { background: rgba(30, 0, 20, 0.8); border: 1px solid #ff0044; color: #b5e2fa; font-size: 8px; padding: 3px; border-radius: 2px; cursor: pointer; text-align: center; flex: 1 1 auto; }
        .grid-btn:hover { background: #ff0044; color: #fff; box-shadow: 0 0 5px #ff0044;}
        .grid-btn.active-btn { background: #00ff00; color: #000; border-color: #fff; font-weight: bold; box-shadow: 0 0 5px #00ff00;}

        #custom-crosshair { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; pointer-events: none; z-index: 9999; text-shadow: 0 0 4px #000; white-space: nowrap; }

        /* ĐÃ LOẠI BỎ TOÀN BỘ RUNG LẮC Ở CÁC HIỆU ỨNG TÂM NHẮM VÀ KHUNG */
        .xh-eff-1 { } .xh-eff-2 { animation: xhSpin 2s linear infinite; } .xh-eff-3 { animation: xhPulse 1s infinite; } .xh-eff-4 { animation: xhRainbow 3s linear infinite; } .xh-eff-5 { } .xh-eff-6 { text-shadow: 0 0 10px currentColor; } .xh-eff-7 { animation: xhBlink 0.5s step-end infinite; } .xh-eff-8 { animation: xhFlip 2s infinite; } .xh-eff-9 { animation: xhZoomBounce 1.2s ease-in-out infinite; } .xh-eff-10 { animation: xhGlitch 0.4s linear infinite; } .xh-eff-11 { animation: xhColorCycle 4s linear infinite; } .xh-eff-12 { animation: xhGhost 1.5s infinite; } .xh-eff-13 { animation: xhOrbit 2.5s linear infinite; } .xh-eff-14 { animation: xhFlash 0.8s ease-in-out infinite; } .xh-eff-15 { animation: xhRotate3D 3s linear infinite; } .xh-eff-16 { animation: xhWaveY 1s ease-in-out infinite; } .xh-eff-17 { animation: xhMatrixFlicker 0.7s infinite; } .xh-eff-18 { animation: xhExplode 1.8s infinite; }
        @keyframes xhZoomBounce { 0%, 100% { transform: translate(-50%, -50%) scale(0.9); } 50% { transform: translate(-50%, -50%) scale(1.2); } } @keyframes xhGlitch { 0% { text-shadow: 1px 0 #f0f, -1px 0 #0ff; } 50% { text-shadow: -1px 0 #f0f, 1px 0 #0ff; } 100% { text-shadow: 1px 1px #f0f; } } @keyframes xhColorCycle { 0% { color: #ff0055; } 33% { color: #00ffcc; } 66% { color: #ffcc00; } 100% { color: #ff0055; } } @keyframes xhGhost { 0%, 100% { text-shadow: 0 0 0px transparent; } 50% { text-shadow: 3px 3px 6px currentColor, -3px -3px 6px currentColor; } } @keyframes xhOrbit { 0% { transform: translate(-50%, -50%) rotate(0deg) translateX(2px) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg) translateX(2px) rotate(-360deg); } } @keyframes xhFlash { 0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.95); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); } } @keyframes xhRotate3D { 100% { transform: translate(-50%, -50%) rotateX(360deg) rotateY(360deg); } } @keyframes xhWaveY { 0%, 100% { margin-top: -2px; } 50% { margin-top: 2px; } } @keyframes xhMatrixFlicker { 0%, 90%, 100% { opacity: 1; color: #00ff00; } 95% { opacity: 0.3; } } @keyframes xhExplode { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } } @keyframes xhSpin { 100% { transform: translate(-50%, -50%) rotate(360deg); } } @keyframes xhPulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.2); } } @keyframes xhRainbow { 100% { filter: hue-rotate(360deg); } } @keyframes xhBlink { 50% { opacity: 0; } } @keyframes xhFlip { 50% { transform: translate(-50%, -50%) rotateY(180deg); } }
        
        .kb-eff-1 { box-shadow: 0 0 8px #00f5d4; } .kb-eff-2 { animation: kbBreathe 1.5s infinite; } .kb-eff-3 { border-color: #ff69b4; box-shadow: 0 0 5px #ff69b4; } .kb-eff-4 .vk-key { box-shadow: 0 1px 0 #9d4edd; } .kb-eff-4 .vk-key.active { transform: translateY(1px); box-shadow: none; } .kb-eff-5 { animation: kbRainbowBorder 3s linear infinite; } .kb-eff-6 { filter: contrast(1.3); } .kb-eff-7 { animation: kbCosmicWave 4s linear infinite; } .kb-eff-8 { animation: kbNeonTrail 2s linear infinite; } .kb-eff-9 { animation: kbAurora 4s ease infinite; } .kb-eff-10 { border-image: linear-gradient(to bottom, #00f5d4, transparent) 1; } .kb-eff-11 { animation: kbStarry 1s infinite; } .kb-eff-12 { box-shadow: 0 0 10px #ff5500; border-color: #ff0000; } .kb-eff-13 { background: radial-gradient(circle, #2c2100 0%, #000 100%) !important; border-color: #ffd700; box-shadow: 0 0 6px #ffd700; } .kb-eff-14 { animation: kbSupernova 1.5s ease-in-out infinite; } .kb-eff-15 { animation: kbVortex 3s linear infinite; } .kb-eff-16 { filter: hue-rotate(90deg) saturate(1.3); }
        @keyframes kbBreathe { 0%, 100% { box-shadow: 0 0 2px rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 10px #9d4edd; } } @keyframes kbRainbowBorder { 100% { filter: hue-rotate(360deg); } } @keyframes kbCosmicWave { 0% { opacity: 0.9; } 50% { opacity: 1; box-shadow: 0 0 8px #3c096c; } 100% { opacity: 0.9; } } @keyframes kbNeonTrail { 0% { border-color: #ff0055; box-shadow: 0 0 6px #ff0055; } 50% { border-color: #00ffcc; box-shadow: 0 0 6px #00ffcc; } 100% { border-color: #ff0055; box-shadow: 0 0 6px #ff0055; } } @keyframes kbAurora { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.1) hue-rotate(20deg); } } @keyframes kbStarry { 0%, 100% { opacity: 1; box-shadow: 0 0 3px #fff; } 50% { opacity: 0.8; border-color: #e0aaff; } } @keyframes kbSupernova { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.01); box-shadow: 0 0 12px rgba(157, 78, 221, 0.5); } } @keyframes kbVortex { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 4. KHỞI TẠO PANEL BẢNG ĐIỀU KHIỂN MINI
    // ==========================================
    const keysRow1 = ['1','2','3','4','5','6','7','8','9']; 
    const keysRow2 = ['W','Q','R','T','P','A','S','D','X','C','M','Shf']; 
    const keysRow3 = ['Ent','Bsp','!','@','#','$','%','^','&','*','(',')','_','+'];

    const crosshairs = [
        '+','x','o','O','•','✛','✜','✚','✙','⌖','❖','⊕','🖕',
        '✧༺❂༻✧', '╭─❖─╮', '꧁༺❂༻꧂', '❂⌖❂', '༺❂༻', '☠✪☠', '𓆩☬𓆪' 
    ];
    const colors = ['#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF','#FFFFFF','#000000','#FF8C00','#8A2BE2','#00FF7F','#FF1493','#1E90FF','#FFD700','#32CD32','#8B008B'];

    const renderRow = (arr) => `<div class="vk-row">` + arr.map(k => {
        let finalKey = k;
        if(k === 'Shf') finalKey = 'SHIFT';
        if(k === 'Ent') finalKey = 'ENTER';
        if(k === 'Bsp') finalKey = 'BACKSPACE';
        return `<div class="vk-key allow-click ${(k.length>1)?'wide':''}" data-key="${finalKey.toUpperCase()}">${k}</div>`;
    }).join('') + `</div>`;

    document.body.insertAdjacentHTML('beforeend', `
        <div id="hub-container" class="allow-click" style="left:${cfg.x}px; top:${cfg.y}px;">
            <div id="hub-header">
                <div class="hub-title" id="t-title">🌌 MATRIX HUB</div>
                <div>
                    <button class="head-btn" id="btn-lang">VN ⇆ EN</button>
                    <button class="head-btn" id="btn-toggle-set">⚙️ CÀI ĐẶT</button>
                </div>
            </div>
            
            <div id="chaos-keyboard-wrapper">
                <div class="nature-vines"></div> 
                <div class="lava-pit"></div>       
                <div id="satan-walker">╭∩╮</div>           
                <div id="keyboard-area">
                    ${renderRow(keysRow1)}
                    ${renderRow(keysRow2)}
                    ${renderRow(keysRow3)}
                </div>
            </div>

            <div id="settings-area">
                <div style="display:flex; justify-content:flex-end; margin-bottom:6px; border-bottom:1px solid #ff0044; padding-bottom:4px;">
                    <button class="head-btn close-btn" id="btn-close-set">❌ ĐÓNG</button>
                </div>

                <div class="set-group">
                    <div class="set-title" id="t-xh">🎯 Tâm Nhắm</div>
                    <div class="flex-xh">
                        ${crosshairs.map(c => `<div class="grid-btn allow-click xh-btn" data-val="${c}">${c}</div>`).join('')}
                    </div>
                </div>
                <div class="set-group">
                    <div class="set-title" id="t-color">🎨 Màu Sắc</div>
                    <div class="grid-color">
                        ${colors.map(c => `<div class="grid-btn allow-click color-btn" style="background:${c}; height:10px; padding:0;" data-val="${c}"></div>`).join('')}
                    </div>
                </div>
                <div class="set-group">
                    <div class="set-title" id="t-xh-eff">✨ Hiệu Ứng Tâm</div>
                    <div class="grid-eff" id="xh-eff-list"></div>
                </div>
                <div class="set-group">
                    <div class="set-title" id="t-kb-eff">⌨️ Nhấp Nháy Phím</div>
                    <div class="grid-eff" id="kb-eff-list"></div>
                </div>
            </div>
        </div>
        <div id="custom-crosshair">${cfg.xh}</div>
    `);

    const hub = document.getElementById('hub-container');
    const xhEl = document.getElementById('custom-crosshair');
    const setArea = document.getElementById('settings-area');

    // ==========================================
    // 5. KÉO THẢ & LOGIC ĐIỀU KHIỂN
    // ==========================================
    let isDragging = false, offX, offY;
    hub.addEventListener('mousedown', (e) => {
        if (e.target.closest('.vk-key') || e.target.closest('.head-btn') || e.target.closest('.grid-btn') || e.target.closest('#settings-area')) return;
        isDragging = true; offX = e.clientX - hub.offsetLeft; offY = e.clientY - hub.offsetTop;
    });
    document.addEventListener('mousemove', (e) => { if (isDragging) { hub.style.left = (e.clientX - offX) + 'px'; hub.style.top = (e.clientY - offY) + 'px'; }});
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; cfg.x = parseInt(hub.style.left); cfg.y = parseInt(hub.style.top); saveCfg(); }});

    const renderLang = () => {
        const t = langDict[cfg.lang];
        document.getElementById('t-title').innerText = t.title; document.getElementById('btn-lang').innerText = t.btnLang;
        document.getElementById('btn-toggle-set').innerText = t.btnSet; document.getElementById('t-xh').innerText = t.xhTitle;
        document.getElementById('t-color').innerText = t.colorTitle; document.getElementById('t-xh-eff').innerText = t.xhEffTitle;
        document.getElementById('t-kb-eff').innerText = t.kbEffTitle;
        
        document.getElementById('xh-eff-list').innerHTML = Array.from({length: 18}, (_, i) => i + 1).map(i => `<div class="grid-btn allow-click xhe-btn ${cfg.xhEff===i?'active-btn':''}" data-val="${i}">${t['eff'+i]}</div>`).join('');
        document.getElementById('kb-eff-list').innerHTML = Array.from({length: 16}, (_, i) => i + 1).map(i => `<div class="grid-btn allow-click kbe-btn ${cfg.kbEff===i?'active-btn':''}" data-val="${i}">${t['kb'+i]}</div>`).join('');
        bindEffectEvents();
    };

    document.getElementById('btn-lang').addEventListener('click', () => { cfg.lang = cfg.lang === 'VN' ? 'EN' : 'VN'; saveCfg(); renderLang(); });
    document.getElementById('btn-toggle-set').addEventListener('click', () => { cfg.setOpen = !cfg.setOpen; setArea.style.display = cfg.setOpen ? 'block' : 'none'; saveCfg(); });
    document.getElementById('btn-close-set').addEventListener('click', () => { cfg.setOpen = false; setArea.style.display = 'none'; saveCfg(); });

    const applyAllCfg = () => { xhEl.innerText = cfg.xh; xhEl.style.color = cfg.xhColor; xhEl.className = `xh-eff-${cfg.xhEff}`; hub.className = `allow-click kb-eff-${cfg.kbEff}`; };

    document.querySelectorAll('.xh-btn').forEach(btn => { btn.addEventListener('click', (e) => { cfg.xh = e.target.getAttribute('data-val'); saveCfg(); applyAllCfg(); }); });
    document.querySelectorAll('.color-btn').forEach(btn => { btn.addEventListener('click', (e) => { cfg.xhColor = e.target.getAttribute('data-val'); saveCfg(); applyAllCfg(); }); });

    function bindEffectEvents() {
        document.querySelectorAll('.xhe-btn').forEach(btn => { btn.addEventListener('click', (e) => { cfg.xhEff = parseInt(e.target.getAttribute('data-val')); saveCfg(); applyAllCfg(); renderLang(); }); });
        document.querySelectorAll('.kbe-btn').forEach(btn => { btn.addEventListener('click', (e) => { cfg.kbEff = parseInt(e.target.getAttribute('data-val')); saveCfg(); applyAllCfg(); renderLang(); }); });
    }
    renderLang(); applyAllCfg();

    // ==========================================
    // 6. NHẬN DIỆN PHÍM THẬT & ĐỒNG BỘ ẢO
    // ==========================================
    const allVkKeys = document.querySelectorAll('.vk-key');
    
    document.addEventListener('keydown', (e) => { 
        if (e.repeat) return;
        let keyName = e.key.toUpperCase(); 
        allVkKeys.forEach(vk => { 
            if (vk.getAttribute('data-key') === keyName || (e.code === 'Space' && vk.getAttribute('data-key') === 'SPACE')) { 
                vk.classList.add('active'); 
                playClack();
            } 
        }); 
    });
    
    document.addEventListener('keyup', (e) => { 
        let keyName = e.key.toUpperCase(); 
        allVkKeys.forEach(vk => { if (vk.getAttribute('data-key') === keyName) { vk.classList.remove('active'); } }); 
    });

    allVkKeys.forEach(vk => {
        vk.addEventListener('mousedown', () => { playClack(); vk.classList.add('active'); });
        vk.addEventListener('mouseup', () => { vk.classList.remove('active'); });
        vk.addEventListener('mouseleave', () => { vk.classList.remove('active'); });
    });

})();