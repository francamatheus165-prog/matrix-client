const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    clipboard,
    nativeImage
} = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling,MediaSessionService");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=256");

const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");

const UPDATE_INFO_FILE = path.join(__dirname, "update-info.json");
const THE_TALKING_CAT_AVATAR_URL = "https://avatars.githubusercontent.com/u/266412468?s=60&v=4";

const GITHUB_AUTO_UPDATE = {
    owner: "francamatheus165-prog",
    repo: "matrix-client",
    tag: "matrix-auto",
    packageAsset: "Matrix-Client-MathPRIME-Setup.exe",
    downloadUrl: "https://github.com/francamatheus165-prog/matrix-client/releases/download/matrix-auto/Matrix-Client-MathPRIME-Setup.exe",
};

function getLocalUpdateInfo() {
    try {
        return JSON.parse(require("fs").readFileSync(UPDATE_INFO_FILE, "utf8"));
    } catch (_) {
        return { version: app.getVersion(), buildId: "unknown", channel: "github-auto" };
    }
}

function githubRawJson(url, timeoutMs = 10000) {
    const https = require("https");
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (err, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (err) reject(err); else resolve(value);
        };

        const cacheBust = (url.includes("?") ? "&" : "?") + "matrix_client=" + Date.now();
        const request = https.get(url + cacheBust, {
            headers: {
                "Accept": "application/json,text/plain,*/*",
                "User-Agent": "Matrix-Client-MathPRIME"
            }
        }, response => {
            if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
                response.resume();
                return githubRawJson(response.headers.location, timeoutMs).then(v => finish(null, v), e => finish(e));
            }
            if (response.statusCode !== 200) {
                response.resume();
                return finish(new Error("GitHub update-info HTTP " + response.statusCode));
            }
            const chunks = [];
            response.on("data", c => chunks.push(c));
            response.on("end", () => {
                try {
                    finish(null, JSON.parse(Buffer.concat(chunks).toString("utf8")));
                } catch (_) {
                    finish(new Error("Invalid GitHub update-info response."));
                }
            });
            response.on("error", finish);
        });
        request.on("error", finish);
        const timer = setTimeout(() => {
            request.destroy();
            finish(new Error("GitHub update-info request timed out."));
        }, timeoutMs);
    });
}

function fetchImageDataUrl(url, timeoutMs = 12000) {
    const https = require("https");
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (err, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (err) reject(err); else resolve(value);
        };

        const request = https.get(url, {
            headers: {
                "User-Agent": "Matrix-Client-MathPRIME",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/png,image/*,*/*;q=0.8"
            }
        }, response => {
            if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
                response.resume();
                return fetchImageDataUrl(response.headers.location, timeoutMs).then(v => finish(null, v), e => finish(e));
            }

            if (response.statusCode !== 200) {
                response.resume();
                return finish(new Error("Image download failed with HTTP " + response.statusCode));
            }

            const chunks = [];
            response.on("data", chunk => chunks.push(chunk));
            response.on("end", () => {
                const buffer = Buffer.concat(chunks);
                const contentType = String(response.headers["content-type"] || "image/png").split(";")[0];
                finish(null, "data:" + contentType + ";base64," + buffer.toString("base64"));
            });
            response.on("error", finish);
        });

        request.on("error", finish);
        const timer = setTimeout(() => {
            request.destroy();
            finish(new Error("Image download timed out."));
        }, timeoutMs);
    });
}

const UPDATE_INFO_RAW_URL =
    "https://raw.githubusercontent.com/francamatheus165-prog/matrix-client/main/src/update-info.json";

function githubAutoUpdateInfo() {
    return githubRawJson(UPDATE_INFO_RAW_URL);
}

function downloadToFile(url, destination) {
    const https = require("https");
    const fs = require("fs");
    return new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: { "User-Agent": "Matrix-Client-MathPRIME", "Accept": "application/octet-stream" }
        }, response => {
            if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
                response.resume();
                return downloadToFile(response.headers.location, destination).then(resolve, reject);
            }
            if (response.statusCode !== 200) {
                response.resume();
                return reject(new Error("Download failed with HTTP " + response.statusCode));
            }
            const file = fs.createWriteStream(destination);
            response.pipe(file);
            file.on("finish", () => file.close(resolve));
            file.on("error", err => { try { fs.unlinkSync(destination); } catch (_) {} reject(err); });
        });
        request.on("error", reject);
    });
}

async function installGithubUpdate(remote) {
    const fs = require("fs");
    const os = require("os");
    const crypto = require("crypto");
    const { spawn } = require("child_process");

    const updateDir = path.join(os.tmpdir(), "matrix-client-github-update");
    fs.rmSync(updateDir, { recursive: true, force: true });
    fs.mkdirSync(updateDir, { recursive: true });

    const installerPath = path.join(updateDir, GITHUB_AUTO_UPDATE.packageAsset);
    await downloadToFile(remote.downloadUrl, installerPath);

    const expected = String(remote.sha256 || "").toLowerCase();
    if (expected) {
        const actual = crypto
            .createHash("sha256")
            .update(fs.readFileSync(installerPath))
            .digest("hex")
            .toLowerCase();

        if (actual !== expected) {
            throw new Error("GitHub update SHA-256 verification failed.");
        }
    }

    const scriptPath = path.join(updateDir, "apply-update.ps1");
    const escaped = value => String(value).replace(/'/g, "''");

    const script = `
$ErrorActionPreference = 'Stop'
$installer = '${escaped(installerPath)}'
$appExe = '${escaped(app.getPath("exe"))}'
Start-Sleep -Seconds 2
if (-not (Test-Path $installer)) { throw 'Matrix Client installer not found.' }
Start-Process -FilePath $installer -ArgumentList '/S' -Wait
Remove-Item '${escaped(updateDir)}' -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path $appExe) { Start-Process -FilePath $appExe }
`;

    fs.writeFileSync(scriptPath, script, "utf8");

    spawn(
        "powershell.exe",
        [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-WindowStyle",
            "Hidden",
            "-File",
            scriptPath
        ],
        {
            detached: true,
            stdio: "ignore",
            windowsHide: true
        }
    ).unref();

    app.quit();
    return true;
}

let updateCheckInProgress = false;

async function checkGithubAutoUpdate({ install = true } = {}) {
    const settings = loadSettings();
    if (settings["updates.auto"] === false && install) return false;
    if (updateCheckInProgress) return false;

    updateCheckInProgress = true;
    try {
        const local = getLocalUpdateInfo();
        const remote = await githubAutoUpdateInfo();
        const remoteBuild = String(remote.buildId || remote.commit || "");
        const localBuild = String(local.buildId || "");

        if (!remoteBuild || remoteBuild === "unknown" || remoteBuild === localBuild) {
            return false;
        }

        const downloadUrl = String(remote.downloadUrl || GITHUB_AUTO_UPDATE.downloadUrl);
        if (!downloadUrl) throw new Error("GitHub update installer URL is missing.");

        const normalizedRemote = {
            buildId: remoteBuild,
            sha256: String(remote.sha256 || ""),
            downloadUrl,
            packageAsset: GITHUB_AUTO_UPDATE.packageAsset,
            info: remote
        };

        console.log("[Matrix] GitHub update available:", remoteBuild);

        if (install) {
            await installGithubUpdate(normalizedRemote);
            return true;
        }

        return normalizedRemote;
    } catch (e) {
        console.log("[Matrix] GitHub auto-update check failed:", e.message);
        return false;
    } finally {
        updateCheckInProgress = false;
    }
}

const DEFAULT_SETTINGS = {
    // zoom
    "zoom.enabled": false,
    "zoom.level": 0.35,
    "zoom.keybind": "KeyV",
    // adblocker
    "adblocker.enabled": true,
    // rpc
    "rpc.enabled": true,
    "rpc.hideroom": false,
    // custom crosshair
    "crosshair.enabled": false,
    "crosshair.url": "",
    "crosshair.size": 32,
    "crosshair.opacity": 1.0,
    // texture pack
    "textures.enabled": false,
    "minecraft-pack.enabled": false,
    "textures.pack": {},
    "textures.selected": "none",
    "advanced-mods.enabled": false,
    // keystrokes
    "keystrokes.enabled": false,
    "keystrokes.showCPS": true,
    "keystrokes.shadow": true,
    "keystrokes.border": false,
    "keystrokes.borderWidth": 1,
    "keystrokes.borderColor": "#ffffff",
    "keystrokes.scale": 1.0,
    "keystrokes.x": 20,
    "keystrokes.y": 40,
    "keystrokes.bgColor": "#00000088",
    "keystrokes.bgPressColor": "#ffffff",
    "keystrokes.textColor": "#ffffff",
    "keystrokes.textPressColor": "#000000",
    // client settings
    "client.keybind": "KeyG",
    "client.sandbox": false,
    "client.autofullscreen": true,
    // startup splash
    "startup.custom.enabled": false,
    "startup.custom.path": "",
    "startup.custom.preset": "matrix",
    "startup.remote.enabled": false,
    "startup.remote.id": "",
    "updates.auto": true,
    "updates.checkMinutes": 0.5, // 30 seconds; kept for backwards compatibility with older settings
    // Matrix integrations
    "translation.enabled": false,
    "translation.lang": "pt",
    "hub.enabled": false,
    "clean-screen.enabled": false,
    "smooth-camera.enabled": false,
    "cinematic-fx.enabled": false,
    // Community mods integrated into Matrix menu (no external shortcuts)
    "mouse-trail.enabled": false,
    "mouse-trail.mode": "fade",
    "mouse-trail.shape": "circle",
    "mouse-trail.length": 15,
    "mouse-trail.size": 6,
    "mouse-trail.fade": 0.95,
    "mouse-trail.color": "#00ffff",
    "mouse-trail.rainbow": false,
    "mouse-trail.gradient": false,
    "mouse-trail.gradient1": "#00ffff",
    "mouse-trail.gradient2": "#ff00ff",
    "mouse-trail.glow": true,
    "mouse-trail.emoji": false,
    "mouse-trail.emojiChoice": "✨",
    "mouse-trail.clickEffect": "ripple",
    "mouse-trail.clickSize": 80,
    "mouse-trail.clickDuration": 600,
    "mouse-trail.clickColor": "#00ffff",
    "stopwatch.enabled": false,
    "stopwatch.x": 120,
    "stopwatch.y": 80,
    "stopwatch.scale": 1,
    "display-enhancer.enabled": false,
    "display-enhancer.brightness": 100,
    "display-enhancer.contrast": 100,
    "display-enhancer.saturation": 100,
    "display-enhancer.hue": 0,
    "display-enhancer.blur": 0,
    "display-enhancer.sepia": 0,
    "display-enhancer.invert": 0,
    "display-enhancer.gamma": 100,
    "display-enhancer.temperature": 0,
    "display-enhancer.vignette": 0,
    "display-enhancer.scanlines": 0,
    "visual-keyboard.enabled": false,
    "visual-keyboard.scale": 0.6,
    "visual-keyboard.x": 100,
    "visual-keyboard.y": 100,
    "visual-keyboard.opacity": 0.9,
    "visual-keyboard.bg": "#111111",
    "visual-keyboard.active": "#00ffff",
    "visual-keyboard.text": "#e0e0ff",
    "visual-keyboard.glow": true,
    "fps-counter.enabled": false,
    "fps-counter.x": 20,
    "fps-counter.y": 20,
    "fps-counter.scale": 1,
    "fps-counter.opacity": 0.95,
    "fps-counter.graph": true,
    "fps-counter.bar": true,
    "fps-counter.minmax": true,
    "fps-counter.maxTarget": 240,
    "fps-counter.good": "#00ffff",
    "fps-counter.medium": "#ffaa44",
    "fps-counter.low": "#ff4444",
    "fps-counter.text": "#e0e0ff",
    "fps-counter.border": "#00ffff",
};

let gameWin = null;
let splashWin = null;
let splashVideoMode = false;
let openingFinished = false;
let gameReady = false;
let rpcModule = null;

let _settingsCache = null;
let _settingsCacheTime = 0;

function loadSettings() {
    const now = Date.now();
    if (_settingsCache && now - _settingsCacheTime < 1000) {
        return _settingsCache;
    }
    try {
        const fs = require("fs");
        if (!fs.existsSync(SETTINGS_FILE)) {
            _settingsCache = {
                ...DEFAULT_SETTINGS
            };
        } else {
            _settingsCache = {
                ...DEFAULT_SETTINGS,
                ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"))
            };
        }
    } catch (e) {
        _settingsCache = {
            ...DEFAULT_SETTINGS
        };
    }
    _settingsCacheTime = now;
    return _settingsCache;
}

function saveSettings(settings) {
    _settingsCache = {
        ...settings
    };
    _settingsCacheTime = Date.now();
    require("fs").writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function splashStatus(msg) {
    if (splashWin && !splashWin.isDestroyed()) {
        splashWin.webContents.send("splash-status", msg);
    }
}

function splashProgress(pct) {
    if (splashWin && !splashWin.isDestroyed()) {
        splashWin.webContents.send("splash-progress", pct);
    }
}

function initRPC() {
    const settings = loadSettings();
    if (!settings["rpc.enabled"]) return;
    if (rpcModule) return;
    try {
        rpcModule = require("./utils/rpc");
    } catch (e) {
        console.log("[Matrix] RPC failed:", e.message);
    }
}

function createSplash() {
    const settings = loadSettings();
    splashVideoMode = false;
    openingFinished = false;
    gameReady = false;
    splashWin = new BrowserWindow({
        width: 420,
        height: 240,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        icon: path.join(__dirname, "assets/icon.png"),
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    const customEnabled = !!settings["startup.custom.enabled"];
    let customPath = settings["startup.custom.path"] || "";
    const query = {};
    if (customEnabled && settings["startup.custom.preset"] === "matrix") {
        customPath = path.join(__dirname, "assets", "matrix-custom-opening.webm");
    }
    if (customEnabled && settings["startup.custom.preset"] === "remote" && settings["startup.remote.enabled"] && settings["startup.remote.id"]) {
        query.remoteCatalog = "1";
        query.remoteId = settings["startup.remote.id"];
    } else if (customEnabled && customPath && require("fs").existsSync(customPath)) {
        query.customVideo = pathToFileURL(customPath).href;
    }
    splashWin.loadFile("src/splash/splash.html", { query });
}

function closeSplashWhenReady() {
    if (!gameReady || !openingFinished) return;

    if (splashWin && !splashWin.isDestroyed()) {
        splashWin.close();
        splashWin = null;
    }

    if (gameWin && !gameWin.isDestroyed() && !gameWin.isVisible()) {
        gameWin.show();

        const settings = loadSettings();
        if (settings["client.autofullscreen"]) {
            gameWin.setFullScreen(true);
        }
    }
}


async function getOnlineOpenings() {
    const url = "https://raw.githubusercontent.com/francamatheus165-prog/matrix-client/main/openings.json";
    try {
        const response = await fetch(url, { headers: { "User-Agent": "Matrix-Client-MathPRIME" }, cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        return await response.json();
    } catch (e) {
        console.log("[Matrix] GitHub openings unavailable:", e.message);
        return { openings: [] };
    }
}


async function launchUpdater() {
    return !!(await checkGithubAutoUpdate({ install: true }));
}

function createGame() {
    gameWin = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        title: "Matrix Client",
        icon: path.join(__dirname, "assets/icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: false,
            nodeIntegration: false,
            backgroundThrottling: false,
            devTools: true,
            spellcheck: false,
            enableWebSQL: false,
            autoplayPolicy: "no-user-gesture-required",
        }
    });

    gameWin.webContents.session.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    gameWin.webContents.session.webRequest.onBeforeRequest({
            urls: ["*://*/*"]
        },
        function(details, callback) {
            const url = details.url || "";
            const settings = loadSettings();
            if (settings["adblocker.enabled"] && isAdURL(url)) {
                callback({
                    cancel: true
                });
            } else {
                callback({
                    cancel: false
                });
            }
        }
    );

    gameWin.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const headers = details.responseHeaders;
        delete headers["content-security-policy"];
        delete headers["content-security-policy-report-only"];
        delete headers["require-trusted-types-for"];
        callback({
            responseHeaders: headers
        });
    });

    const settings = loadSettings();
    const startURL = settings["client.sandbox"] ?
        "https://sandbox.minefun.io" :
        "https://minefun.io";

    gameWin.loadURL(startURL);

    gameWin.webContents.on("did-finish-load", () => {
        gameReady = true;

        // The splash/opening owns visibility. The game window is shown only
        // after the opening has completely finished.
        closeSplashWhenReady();

        // Load Matrix features after MineFun has finished loading.
        setTimeout(() => {
            inject(gameWin.webContents).catch(e =>
                console.error("[Matrix] Deferred injection failed:", e.message)
            );
        }, 250);
    });

    gameWin.on("page-title-updated", e => e.preventDefault());
    gameWin.on("close", () => gameWin.destroy());

    gameWin.webContents.on("before-input-event", async (event, input) => {
        if (input.type !== "keyDown") return;
        if (input.control && input.shift && input.key.toUpperCase() === "U") {
            event.preventDefault();
            launchUpdater();
            return;
        }

        // Matrix menu hotkey: handle G at Electron level so MineFun
        // cannot consume the key before the Matrix renderer sees it.
        const clientKeybind = loadSettings()["client.keybind"] || "KeyG";
        if (input.code === clientKeybind && !input.control && !input.alt && !input.meta) {
            event.preventDefault();
            try {
                gameWin.webContents.executeJavaScript(
                    'window.__matrixMenuToggle && window.__matrixMenuToggle();',
                    true
                ).catch(() => {});
            } catch (_) {}
            return;
        }

        if (input.key === "F12") {
            gameWin.webContents.toggleDevTools();
            event.preventDefault();
            return;
        }
        if (input.key === "F5") {
            gameWin.webContents.reload();
            event.preventDefault();
            return;
        }
        if (input.key === "F4") {
            const s = loadSettings();
            const url = s["client.sandbox"] ?
                "https://sandbox.minefun.io" :
                "https://minefun.io";
            gameWin.loadURL(url);
            event.preventDefault();
            return;
        }
        if (input.key === "F11") {
            gameWin.setFullScreen(!gameWin.isFullScreen());
            event.preventDefault();
            return;
        }
        if (input.key === "F6") {
            const text = clipboard.readText().trim();
            let url = text;
            if (url.startsWith("minefun.io/")) url = "https://" + url;
            if (url.startsWith("https://minefun.io/") || url.startsWith("https://sandbox.minefun.io/")) {
                gameWin.loadURL(url);
            }
            event.preventDefault();
            return;
        }
        if (input.key === "F7") {
            try {
                const url = await gameWin.webContents.executeJavaScript("location.href");
                clipboard.writeText(url);
            } catch (e) {}
            event.preventDefault();
            return;
        }
        if (input.key === "F2") {
            gameWin.webContents.capturePage().then(image => {
                clipboard.writeImage(image);
            }).catch(err => {
                console.error("[Matrix] Screenshot failed:", err);
            });
            event.preventDefault();
            return;
        }
    });
}

function checkForUpdates() {
    splashStatus("Ready");
    splashProgress(100);
    return checkGithubAutoUpdate();
}

async function inject(wc) {
    const fs = require("fs");
    const settings = loadSettings();

    await wc.executeJavaScript(`
        window.__mfSettings.zoom             = ${JSON.stringify(!!settings["zoom.enabled"])};
        window.__mfSettings.zoomLevel        = ${JSON.stringify(settings["zoom.level"]        ?? 0.35)};
        window.__mfSettings.zoomKeybind      = ${JSON.stringify(settings["zoom.keybind"]      ?? "KeyV")};
        window.__mfSettings.adblocker        = ${JSON.stringify(!!settings["adblocker.enabled"])};
        window.__mfSettings.crosshair        = ${JSON.stringify(!!settings["crosshair.enabled"])};
        window.__mfSettings.crosshairURL     = ${JSON.stringify(settings["crosshair.url"]     ?? "")};
        window.__mfSettings.crosshairSize    = ${JSON.stringify(settings["crosshair.size"]    ?? 32)};
        window.__mfSettings.crosshairOpacity = ${JSON.stringify(settings["crosshair.opacity"] ?? 1.0)};
        window.__mfSettings.textures     = ${JSON.stringify(!!settings["textures.enabled"])};
window.__mfSettings.texturesPack = ${JSON.stringify(settings["textures.pack"] ?? {})};
window.__mfSettings.translation        = ${JSON.stringify(!!settings["translation.enabled"])};
window.__mfSettings.translationLang    = ${JSON.stringify(settings["translation.lang"] ?? "pt")};
window.__mfSettings.hub                = ${JSON.stringify(!!settings["hub.enabled"])};
window.__mfSettings.keystrokes          = ${JSON.stringify(!!settings["keystrokes.enabled"])};
window.__mfSettings.keystrokesShowCPS   = ${JSON.stringify(!!settings["keystrokes.showCPS"])};
window.__mfSettings.keystrokesShadow    = ${JSON.stringify(!!settings["keystrokes.shadow"])};
window.__mfSettings.keystrokesBorder    = ${JSON.stringify(!!settings["keystrokes.border"])};
window.__mfSettings.keystrokesBorderWidth = ${JSON.stringify(settings["keystrokes.borderWidth"] ?? 1)};
window.__mfSettings.keystrokesBorderColor = ${JSON.stringify(settings["keystrokes.borderColor"] ?? "#ffffff")};
window.__mfSettings.keystrokesScale     = ${JSON.stringify(settings["keystrokes.scale"] ?? 1.0)};
window.__mfSettings.keystrokesX         = ${JSON.stringify(settings["keystrokes.x"] ?? 20)};
window.__mfSettings.keystrokesY         = ${JSON.stringify(settings["keystrokes.y"] ?? 40)};
window.__mfSettings.keystrokesBg        = ${JSON.stringify(settings["keystrokes.bgColor"] ?? "#00000088")};
window.__mfSettings.keystrokesBgPress   = ${JSON.stringify(settings["keystrokes.bgPressColor"] ?? "#ffffff")};
window.__mfSettings.keystrokesText      = ${JSON.stringify(settings["keystrokes.textColor"] ?? "#ffffff")};
window.__mfSettings.keystrokesTextPress = ${JSON.stringify(settings["keystrokes.textPressColor"] ?? "#000000")};
    `);

    const css = fs.readFileSync(path.join(__dirname, "menu/menu.css"), "utf8");
    await wc.executeJavaScript(`
        (function(){
            var el = document.getElementById("__matrix_style");
            if (el) el.remove();
            var s = document.createElement("style");
            s.id = "__matrix_style";
            s.textContent = ${JSON.stringify(css)};
            document.head.appendChild(s);
        })();
    `);

    const html = fs.readFileSync(path.join(__dirname, "menu/menu.html"), "utf8");
    await wc.executeJavaScript(`
        (function(){
            var el = document.getElementById("__matrix_root");
            if (el) el.remove();
            var wrap = document.createElement("div");
            wrap.id = "__matrix_root";
            wrap.innerHTML = ${JSON.stringify(html)};
            document.body.appendChild(wrap);
        })();
    `);

    const js = fs.readFileSync(path.join(__dirname, "menu/menu.js"), "utf8");
    const translatorJs = fs.readFileSync(path.join(__dirname, "features/translation.js"), "utf8");
    const visualModsJs = fs.readFileSync(path.join(__dirname, "features/matrix-visual-mods.js"), "utf8");
    const customTagsJs = fs.readFileSync(path.join(__dirname, "features/custom-tags.js"), "utf8");
    const extraModsJs = fs.readFileSync(path.join(__dirname, "features/extra-mods.js"), "utf8");
    const communityModsJs = fs.readFileSync(path.join(__dirname, "features/community-mods.js"), "utf8");
    const minecraftTexturesJs = fs.readFileSync(path.join(__dirname, "../vendor/Minecraft Texture Pack for Minefun.js"), "utf8");
    const customTagMatheusPath = path.join(__dirname, "assets/customtag-matheus.png");
    const customTagCoconutPath = path.join(__dirname, "assets/customtag-coconut.png");
    const customTagAlexPrimePath = path.join(__dirname, "assets/customtag-alex-prime.png");
    const glitchHunterBadgePath = path.join(__dirname, "assets/badges/glitchhunter.webp");
    const zephronBadgePath = path.join(__dirname, "assets/badges/zephron.webp");
    let customTagMatheusDataUrl = "";
    let customTagCoconutDataUrl = "";
    let customTagAlexPrimeDataUrl = "";
    let talkingCatAvatarDataUrl = "";
    let glitchHunterBadgeDataUrl = "";
    let zephronBadgeDataUrl = "";
    try {
        customTagMatheusDataUrl = "data:image/png;base64," + fs.readFileSync(customTagMatheusPath).toString("base64");
        customTagCoconutDataUrl = "data:image/png;base64," + fs.readFileSync(customTagCoconutPath).toString("base64");
        if (fs.existsSync(customTagAlexPrimePath)) customTagAlexPrimeDataUrl = "data:image/png;base64," + fs.readFileSync(customTagAlexPrimePath).toString("base64");
        if (fs.existsSync(glitchHunterBadgePath)) glitchHunterBadgeDataUrl = "data:image/webp;base64," + fs.readFileSync(glitchHunterBadgePath).toString("base64");
        if (fs.existsSync(zephronBadgePath)) zephronBadgeDataUrl = "data:image/webp;base64," + fs.readFileSync(zephronBadgePath).toString("base64");
    } catch (e) {
        console.error("[Matrix] Custom tag asset load failed:", e.message);
    }
    try {
        talkingCatAvatarDataUrl = await fetchImageDataUrl(THE_TALKING_CAT_AVATAR_URL);
    } catch (e) {
        console.log("[Matrix] thetalkingcat avatar unavailable:", e.message);
        talkingCatAvatarDataUrl = THE_TALKING_CAT_AVATAR_URL;
    }

    const fontPath = path.join(__dirname, "assets/LoveDays.ttf");
    let loveDaysDataUrl = "";
    try {
        loveDaysDataUrl = "data:font/ttf;base64," + fs.readFileSync(fontPath).toString("base64");
    } catch (e) {
        console.error("[Matrix] Local font asset load failed:", e.message);
    }
    await wc.executeJavaScript(`
        window.__matrixAssets = {
            loveDaysFont: ${JSON.stringify(loveDaysDataUrl)},
            matheusTag: ${JSON.stringify(customTagMatheusDataUrl)},
            coconutTag: ${JSON.stringify(customTagCoconutDataUrl)},
            alexPrimeTag: ${JSON.stringify(customTagAlexPrimeDataUrl)},
            talkingCatTag: ${JSON.stringify(talkingCatAvatarDataUrl)},
            glitchHunterBadge: ${JSON.stringify(glitchHunterBadgeDataUrl)},
            zephronBadge: ${JSON.stringify(zephronBadgeDataUrl)}
        };
    `);
    // Load feature APIs before the menu so menu cards can bind immediately.
    await wc.executeJavaScript(translatorJs);
    await wc.executeJavaScript(visualModsJs);
    await wc.executeJavaScript(`
        window.__matrixCustomTagAssets = {
            matheus: ${JSON.stringify(customTagMatheusDataUrl)},
            coconut: ${JSON.stringify(customTagCoconutDataUrl)},
            alexPrime: ${JSON.stringify(customTagAlexPrimeDataUrl)},
            talkingcat: ${JSON.stringify(talkingCatAvatarDataUrl)}
        };
    `);
    await wc.executeJavaScript(`window.__matrixCustomTagAssets={matheus:${JSON.stringify(customTagMatheusDataUrl)},coconut:${JSON.stringify(customTagCoconutDataUrl)},alexPrime:${JSON.stringify(customTagAlexPrimeDataUrl)},talkingcat:${JSON.stringify(talkingCatAvatarDataUrl)}};window.__matrixBadgeAssets={glitchhunter:${JSON.stringify(glitchHunterBadgeDataUrl)},zephron:${JSON.stringify(zephronBadgeDataUrl)}};`);
    await wc.executeJavaScript(customTagsJs);
    const advancedModsJs = fs.readFileSync(path.join(__dirname, "features/advanced-mods.js"), "utf8");
    await wc.executeJavaScript(advancedModsJs);
    await wc.executeJavaScript(extraModsJs);
    await wc.executeJavaScript(communityModsJs);
    await wc.executeJavaScript(js);
    await wc.executeJavaScript(`
        if (window.__matrixSetTranslation) window.__matrixSetTranslation(${JSON.stringify(!!settings["translation.enabled"])}, ${JSON.stringify(settings["translation.lang"] ?? "pt")});
        if (window.__matrixExtraMods) { window.__matrixExtraMods.setCleanScreen(${JSON.stringify(!!settings["clean-screen.enabled"])}); window.__matrixExtraMods.setSmoothCamera(${JSON.stringify(!!settings["smooth-camera.enabled"])}); window.__matrixExtraMods.setCinematic(${JSON.stringify(!!settings["cinematic-fx.enabled"])}); }
        if (window.__matrixCommunityMods) window.__matrixCommunityMods.sync(${JSON.stringify(settings)});
        if (${JSON.stringify(!!settings["advanced-mods.enabled"])}) { if (window.__matrixAdvancedMods) window.__matrixAdvancedMods.enable(); }
        if (${JSON.stringify(!!settings["minecraft-pack.enabled"])}) {
            try { ${minecraftTexturesJs} } catch (e) { console.error('[Matrix] Minecraft texture pack failed:', e); }
        }
    `);

    console.log("[Matrix] Injected");
}

const AD_DOMAINS = [
    "doubleclick.net", "googlesyndication.com", "googletagmanager.com",
    "googletagservices.com", "poki-cdn.com", "poki.io", "poki.com",
    "amazon-adsystem.com", "imasdk.googleapis.com",
    "securepubads.g.doubleclick.net", "pagead2.googlesyndication.com",
    "adservice.google.com", "apstag.js", "ima3.js", "prebid",
];

function isAdURL(url) {
    if (url.includes("googletagmanager.com/gtag")) return false;
    return AD_DOMAINS.some(d => url.includes(d));
}


ipcMain.on("splash-opening-mode", (event, mode) => {
    splashVideoMode = mode === "video";
});

ipcMain.on("splash-opening-finished", () => {
    splashVideoMode = false;
    openingFinished = true;
    closeSplashWhenReady();
});

ipcMain.handle("restart-client", () => {
    app.relaunch();
    app.exit(0);
    return true;
});

ipcMain.handle("launch-updater", async () => await launchUpdater());

ipcMain.handle("get-settings", () => loadSettings());

ipcMain.handle("set-setting", (e, key, value) => {
    const settings = loadSettings();
    settings[key] = value;
    saveSettings(settings);

    if (key === "rpc.enabled") {
        if (!value && rpcModule) {
            try {
                if (rpcModule.rpc?.user) {
                    rpcModule.rpc.clearActivity().catch(() => {});
                    setTimeout(() => {
                        rpcModule = null;
                    }, 500);
                } else {
                    rpcModule = null;
                }
            } catch (e) {
                rpcModule = null;
            }
        } else if (value && !rpcModule) {
            initRPC();
        }
    }

    if (gameWin && !gameWin.isDestroyed()) {
        gameWin.webContents.send("setting-changed", key, value);
    }
    return true;
});

ipcMain.handle("toggle-advanced-mods", async () => {
    const settings = loadSettings();
    const next = !settings["advanced-mods.enabled"];
    settings["advanced-mods.enabled"] = next;
    saveSettings(settings);
    if (!gameWin || gameWin.isDestroyed()) return { ok: true, enabled: next };
    if (next) {
        try {
            const result = await gameWin.webContents.executeJavaScript(`window.__matrixAdvancedMods ? window.__matrixAdvancedMods.enable() : {ok:false,error:"Loader not ready"}`);
            return result || { ok: true, enabled: true };
        } catch (e) {
            return { ok: false, enabled: false, error: e.message };
        }
    }
    try { await gameWin.webContents.executeJavaScript(`window.__matrixAdvancedMods ? window.__matrixAdvancedMods.disable() : location.reload()`); } catch (_) {}
    return { ok: true, enabled: false };
});

ipcMain.handle("switch-site", (e, sandbox) => {
    const settings = loadSettings();
    settings["client.sandbox"] = sandbox;
    saveSettings(settings);
    const url = sandbox ? "https://sandbox.minefun.io" : "https://minefun.io";
    if (gameWin && !gameWin.isDestroyed()) gameWin.loadURL(url);
    return true;
});

ipcMain.handle("get-current-url", async () => {
    if (!gameWin || gameWin.isDestroyed()) return "";
    try {
        return await gameWin.webContents.executeJavaScript("location.href");
    } catch (e) {
        return "";
    }
});

ipcMain.handle("toggle-minecraft-pack", async () => {
    const fs = require("fs");
    const settings = loadSettings();
    const next = !settings["minecraft-pack.enabled"];
    settings["minecraft-pack.enabled"] = next;
    saveSettings(settings);

    if (gameWin && !gameWin.isDestroyed()) {
        if (next) {
            try {
                const script = fs.readFileSync(path.join(__dirname, "../vendor/Minecraft Texture Pack for Minefun.js"), "utf8");
                await gameWin.webContents.executeJavaScript(`(function(){ try { ${script} } catch (e) { console.error('[Matrix] Texture Pack activation failed:', e); } })();`);
            } catch (e) {
                settings["minecraft-pack.enabled"] = false;
                saveSettings(settings);
                return { ok: false, enabled: false, error: e.message };
            }
        } else {
            // The original pack patches prototypes; the safest clean disable is a reload.
            gameWin.webContents.reload();
        }
    }
    return { ok: true, enabled: next };
});

function parseTexturePackFile(filePath) {
    const fs = require("fs");
    const text = fs.readFileSync(filePath, "utf8");
    const pack = {};
    let loaded = 0;
    for (const line of text.split("\n")) {
        const idx = line.indexOf(">");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key && val) { pack[key] = val; loaded++; }
    }
    return { pack, loaded };
}

function getBuiltinTexturePacks() {
    const fs = require("fs");
    const file = path.join(__dirname, "texturepacks.json");
    let items = [];
    try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) {}
    return items.map(item => {
        let preview = "";
        try {
            const p = path.join(__dirname, item.preview.replace(/^assets:\/\//, "assets/"));
            if (fs.existsSync(p)) preview = "data:image/png;base64," + fs.readFileSync(p).toString("base64");
        } catch (_) {}
        return { ...item, previewDataUrl: preview };
    });
}

ipcMain.handle("get-builtin-texture-packs", () => getBuiltinTexturePacks());

ipcMain.handle("load-builtin-texture-pack", async (e, id) => {
    const fs = require("fs");
    const items = getBuiltinTexturePacks();
    const item = items.find(x => x.id === id);
    if (!item) return { ok: false, error: "Texture pack not found" };
    const filePath = path.join(__dirname, item.file);
    if (!fs.existsSync(filePath)) return { ok: false, error: "Texture pack file missing" };
    const parsed = parseTexturePackFile(filePath);
    if (!parsed.loaded) return { ok: false, error: "No valid entries found" };
    const settings = loadSettings();
    settings["textures.pack"] = parsed.pack;
    settings["textures.enabled"] = true;
    settings["textures.selected"] = item.id;
    settings["minecraft-pack.enabled"] = false;
    saveSettings(settings);
    if (gameWin && !gameWin.isDestroyed()) gameWin.webContents.reload();
    return { ok: true, count: parsed.loaded, id: item.id, name: item.name, preview: item.previewDataUrl || "" };
});

ipcMain.handle("load-texture-pack", async (e, filePath) => {
    const parsed = parseTexturePackFile(filePath);
    if (parsed.loaded === 0) return { ok: false, error: "No valid entries found" };
    const settings = loadSettings();
    settings["textures.pack"] = parsed.pack;
    settings["textures.enabled"] = true;
    settings["textures.selected"] = "custom";
    settings["minecraft-pack.enabled"] = false;
    saveSettings(settings);
    if (gameWin && !gameWin.isDestroyed()) gameWin.webContents.reload();
    return { ok: true, count: parsed.loaded };
});

ipcMain.handle("reset-texture-pack", () => {
    const settings = loadSettings();
    settings["textures.pack"] = {};
    settings["textures.enabled"] = false;
    settings["textures.selected"] = "none";
    settings["minecraft-pack.enabled"] = false;
    saveSettings(settings);
    if (gameWin && !gameWin.isDestroyed()) gameWin.webContents.reload();
    return true;
});

ipcMain.handle("open-file-dialog", async () => {
    const {
        dialog
    } = require("electron");
    const result = await dialog.showOpenDialog(gameWin, {
        title: "Select Texture Pack",
        filters: [{
            name: "Texture Pack",
            extensions: ["txt"]
        }],
        properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.handle("import-startup-video", async () => {
    const { dialog } = require("electron");
    const fs = require("fs");
    const result = await dialog.showOpenDialog(gameWin, {
        title: "Choose a custom Matrix Client opening",
        filters: [{
            name: "Video",
            extensions: ["webm", "mp4", "mkv", "mov", "avi"]
        }],
        properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };

    const source = result.filePaths[0];
    const ext = path.extname(source).toLowerCase() || ".webm";
    const customDir = path.join(app.getPath("userData"), "startup");
    fs.mkdirSync(customDir, { recursive: true });
    const target = path.join(customDir, "custom-opening" + ext);

    try {
        fs.copyFileSync(source, target);
        const settings = loadSettings();
        settings["startup.custom.enabled"] = true;
        settings["startup.custom.path"] = target;
        settings["startup.custom.preset"] = "imported";
        saveSettings(settings);
        return { ok: true, path: target, name: path.basename(source) };
    } catch (e) {
        return { ok: false, error: e.message };
    }
});

ipcMain.handle("get-online-openings", () => getOnlineOpenings());

ipcMain.handle("reset-startup-video", async () => {
    const fs = require("fs");
    const settings = loadSettings();
    const oldPath = settings["startup.custom.path"];
    settings["startup.custom.enabled"] = false;
    settings["startup.custom.path"] = "";
    settings["startup.custom.preset"] = "matrix";
    saveSettings(settings);
    if (oldPath) {
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_) {}
    }
    return true;
});


app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Discord RPC is optional; load it after the UI starts.
    setTimeout(() => {
        try { initRPC(); } catch (e) {
            console.error("[Matrix] Deferred RPC init failed:", e.message);
        }
    }, 1000);

    setTimeout(() => {
        checkForUpdates().catch(() => {});
    }, 7000);

    setInterval(() => {
        if (gameWin && !gameWin.isDestroyed()) {
            checkForUpdates().catch(() => {});
        }
    }, 30 * 1000);

    createSplash();

    splashWin.webContents.on("did-finish-load", () => {
        splashStatus("Launching…");
        splashProgress(100);
        // Keep splash time minimal; the game itself controls when it is ready.
        setTimeout(createGame, 150);
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

setInterval(async () => {
    if (!gameWin || gameWin.isDestroyed()) return;
    if (!gameWin.isFocused() && !gameWin.isVisible()) return;

    const settings = loadSettings();

    if (!settings["rpc.enabled"]) {
        if (rpcModule?.rpc?.user) {
            try {
                await rpcModule.rpc.clearActivity();
            } catch (e) {}
        }
        rpcModule = null;
        return;
    }

    if (!rpcModule) {
        initRPC();
        return;
    }
    if (!rpcModule.rpc.user) return;

    const hideRoom = !!settings["rpc.hideroom"];

    try {
        const href = await gameWin.webContents.executeJavaScript("location.href");
        const url = new URL(href);
        const pathname = url.pathname;
        const isSandbox = url.hostname.includes("sandbox");

        if (pathname.startsWith("/match/")) {
            const mode = pathname.split("/")[2];
            const roomId = url.searchParams.get("roomId") || null;
            rpcModule.updatePresence(mode, roomId, hideRoom, isSandbox);
            return;
        }

        const PAGE_MAP = {
            "/custom-games": "custom-games",
            "/pets": "pets",
            "/shop": "shop",
            "/rules": "rules",
            "/news": "news",
            "/profile": "profile",
        };

        rpcModule.updatePresence(PAGE_MAP[pathname] || "lobby", null, hideRoom, isSandbox);
    } catch (err) {
        console.error("[RPC]", err.message);
    }
}, 5000);
