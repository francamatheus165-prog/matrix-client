Matrix Client — MathPRIME

An advanced MineFun.io client focused on customization, visual mods, textures, badges, translation, and an integrated client interface.

🚀 About the Project

Matrix Client — MathPRIME Edition is an Electron-based client for MineFun.io.

The project is designed around a single GitHub repository containing the complete client source code, mods, textures, badges, assets, and configuration.

Official Repository:
https://github.com/francamatheus165-prog/matrix-client

📥 Download & Installation

Download the latest official version directly from GitHub:

Latest Release:
https://github.com/francamatheus165-prog/matrix-client/releases/latest

Installation
Open the latest release.
Download Matrix-Client-MathPRIME-Setup.exe.
Run the installer.
Follow the installation steps.
Launch Matrix Client.

The Windows installer is generated automatically through GitHub Actions.

✨ Features
🎮 MineFun.io
Direct access to MineFun.io.
Support for the normal MineFun environment.
Support for MineFun Sandbox.
Custom Matrix Client interface.
Integrated client controls and features.
🧩 Advanced Mods

An integrated advanced-mod system that allows supported features to be enabled directly from the Matrix Client menu.

🎨 Textures
Built-in texture packs.
Custom texture-pack support.
Texture-pack importing.
Minecraft-style texture support for MineFun.
🏷️ Custom Tags & Badges

The client supports custom player visual elements, including:

Custom tags.
Custom badges.
Player-specific images.
Built-in graphical assets.
🌐 Translation

An integrated translation system for supported Matrix Client and MineFun elements.

🖱️ Visual Mods

The project includes visual and interface features such as:

Custom crosshair.
Keystrokes.
FPS counter.
Mouse trail.
Stopwatch.
Display enhancer.
Visual keyboard.
Clean screen.
Smooth camera.
Cinematic effects.
🎬 Custom Openings

Matrix Client supports custom startup openings.

The client can use an included opening video or an imported custom opening.

The main client interface can wait until the startup animation has completely finished before becoming visible.

🔄 Automatic Updates

GitHub is the single source of truth for the project.

The update workflow is:

Edit files on GitHub
        ↓
Commit to main
        ↓
GitHub Actions
        ↓
Automatic Windows build
        ↓
New Matrix Client installer
        ↓
matrix-auto Release
        ↓
Installed client checks GitHub
        ↓
New build detected
        ↓
Automatic update

No manual build process is required for normal GitHub-based updates.

🏗️ GitHub Actions

The workflow is located at:

.github/workflows/build.yml

It automatically runs when changes are pushed to:

main

or:

master

It can also be started manually through GitHub Actions.

Build Process

The workflow:

Checks out the repository.
Installs dependencies.
Creates build information.
Verifies required Matrix Client assets.
Builds the Windows version.
Creates the Windows installer.
Publishes the installer to the automatic GitHub Release.
📦 Windows Build

The project uses:

Electron
Electron Builder
Windows x64
NSIS

The official installer is:

Matrix-Client-MathPRIME-Setup.exe

The internal Electron files are packaged inside the installer.

🖼️ Assets

Matrix Client assets are stored directly inside the GitHub repository.

Examples:

src/assets/

and:

src/assets/badges/

The application includes the necessary Matrix Client assets in the final Windows build.

📁 Project Structure
matrix-client/
│
├── .github/
│   └── workflows/
│       └── build.yml
│
├── src/
│   ├── assets/
│   ├── features/
│   ├── menu/
│   ├── splash/
│   ├── utils/
│   ├── main.js
│   └── preload.js
│
├── vendor/
│
├── openings.json
├── package.json
├── package-lock.json
└── README.md
🛠️ Development

The main source code is located in:

src/

The recommended workflow is to work directly through the GitHub repository.

Typical workflow:

Edit a file
     ↓
Commit changes
     ↓
GitHub Actions
     ↓
Automatic build
📝 Modifying the Client

For example, the Electron main process is located at:

src/main.js

Other Matrix Client functionality is organized in:

src/features/
src/menu/
src/splash/
src/utils/
🔐 Update Source

Automatic updates are connected to the official GitHub repository:

francamatheus165-prog/matrix-client

The automatic release channel is:

matrix-auto
📌 Current Version
1.3.4

Product Name:

Matrix Client

Edition:

MathPRIME

Author:

MathPRIME
💻 Technologies
Electron
Electron Builder
Node.js
JavaScript
HTML
CSS
GitHub Actions
📜 License

Check the repository's license before redistributing or modifying the project.

👑 MathPRIME

Matrix Client — MathPRIME Edition

A continuously evolving MineFun.io client built around GitHub, with its source code, features, assets, builds, and updates centralized in one repository.

🔗 Links

GitHub Repository:
https://github.com/francamatheus165-prog/matrix-client

Latest Download:
https://github.com/francamatheus165-prog/matrix-client/releases/latest

Releases:
https://github.com/francamatheus165-prog/matrix-client/releases
