const { app, BrowserWindow, ipcMain, screen, session } = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
const { spawn } = require("child_process");

const {
    copyProjectToRender,
    analyzeMediaQueries,
    transformAllCSS,
    appendScriptToAllHTMLFilesInRender,
} = require("./render");

let newWin1 = null;
let originalWidth = null;
let originalHeight = null;
let watchInterval = null;
let phpProcess = null;

const server = express();
const PORT = 3000;
server.use(express.static(app.getAppPath()));
server.listen(PORT, "127.0.0.1", () => {
    console.log(`Localhost running on http://127.0.0.1:${PORT}`);
});
function startPhpServer() {
    const phpPort = 8000;
    const documentRoot = app.getAppPath();

    console.log(`Starting built-in PHP server on http://127.0.0.1:${phpPort}`);
    phpProcess = spawn("php", [
        "-S",
        `127.0.0.1:${phpPort}`,
        "-t",
        documentRoot,
    ]);

    phpProcess.stdout.on("data", (data) => {
        console.log(`PHP STDOUT: ${data}`);
    });

    phpProcess.stderr.on("data", (data) => {
        console.error(`PHP STDERR: ${data}`);
    });

    phpProcess.on("close", (code) => {
        console.log(`PHP process exited with code: ${code}`);
    });
}

function centerWindow(width, height) {
    if (!newWin1) return;
    const { width: screenWidth, height: screenHeight } =
        screen.getPrimaryDisplay().workAreaSize;
    const x = Math.floor((screenWidth - width) / 2);
    const y = Math.floor((screenHeight - height) / 2);
    newWin1.setBounds({ x, y, width, height });
}

ipcMain.on("app-quit", () => app.quit());

ipcMain.on("close-current-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.on("close-newWin1", () => {
    if (newWin1 && !newWin1.isDestroyed()) {
        newWin1.close();
    }
});

ipcMain.handle("copy-project-files", async () => {
    try {
        return copyProjectToRender();
    } catch (err) {
        console.error("Failed to copy project:", err);
        return false;
    }
});

ipcMain.handle("analyze-media-queries", async () => {
    try {
        await analyzeMediaQueries();
        return true;
    } catch (err) {
        console.error("Failed to analyze media queries:", err);
        return false;
    }
});

ipcMain.handle("transform-css", async () => {
    try {
        await transformAllCSS();
        return true;
    } catch (err) {
        console.error("Failed to transform CSS:", err);
        return false;
    }
});

ipcMain.handle("append-script-to-html", async () => {
    try {
        await appendScriptToAllHTMLFilesInRender();
        return true;
    } catch (e) {
        console.error("Failed to append script:", e);
        return false;
    }
});

const jsonPath = path.join(__dirname, "emulator/panel.json");
ipcMain.handle("save-json", async (_event, updates) => {
    try {
        const fileContent = fs.readFileSync(jsonPath, "utf8");
        const json = JSON.parse(fileContent);
        const updated = { ...json, ...updates };
        fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error("Failed to save data in JSON file:", err);
        return false;
    }
});

const cssFilePath = path.join(
    __dirname,
    "emulator",
    "environment-variables.css",
);

let cssVariables = {
    "--emulator-safe-area-inset-left": "0",
    "--emulator-safe-area-inset-right": "0",
    "--emulator-safe-area-inset-top": "0",
    "--emulator-safe-area-inset-bottom": "0",
    "--emulator-titlebar-area-width": "0",
    "--emulator-titlebar-area-height": "0",
    "--emulator-titlebar-area-x": "0",
    "--emulator-titlebar-area-y": "0",
};

function saveVariablesToFile(vars) {
    const lines = [":root {"];
    for (const [key, value] of Object.entries(vars)) {
        lines.push(`  ${key}: ${value};`);
    }
    lines.push("}");
    const cssContent = lines.join("\n");
    try {
        fs.writeFileSync(cssFilePath, cssContent, "utf8");
        console.log(`CSS variables saved to ${cssFilePath}`);
    } catch (err) {
        console.error("CSS file save error:", err);
    }
}

ipcMain.handle("set-css-variable", (event, key, value) => {
    if (value === null) {
        delete cssVariables[key];
    } else {
        cssVariables[key] = value;
    }
    saveVariablesToFile(cssVariables);
    return true;
});

ipcMain.handle("add-css-variable", (event, key, value) => {
    cssVariables[key] = value;
    saveVariablesToFile(cssVariables);
    return true;
});

ipcMain.handle("get-css-variables", () => {
    return cssVariables;
});

app.whenReady().then(() => {
    session.defaultSession.clearCache();

    startPhpServer();

    const mainWindow = new BrowserWindow({
        width: 600,
        height: 350,
        frame: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: false,
        },
    });
    mainWindow.loadURL(`http://127.0.0.1:${PORT}/emulator/index.html`);

    ipcMain.handle("open-bend-window", async (event, options) => {
        session.defaultSession.clearCache();
        const { width, height, bend, mod } = options;
        newWin1 = new BrowserWindow({
            width,
            height,
            frame: false,
            resizable: false,
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                contextIsolation: true,
                nodeIntegration: false,
                additionalArguments: [
                    `--bend=${bend}`,
                    `--width=${width}`,
                    `--height=${height}`,
                    `--mod=${mod}`,
                ],
            },
        });
        newWin1.loadURL(`http://127.0.0.1:${PORT}/emulator/screen.html`);
        originalWidth = newWin1.getBounds().width;
        originalHeight = newWin1.getBounds().height;
    });
    ipcMain.handle("get-skins", async () => {
        const fs = require("fs");
        const path = require("path");
        const dir = path.join(__dirname, "skins");
        const files = fs.readdirSync(dir);
        return files.filter((file) => {
            return [".png", ".webp", ".gif", ".avif", ".tiff", ".svg"].includes(
                path.extname(file).toLowerCase(),
            );
        });
    });
    ipcMain.handle("get-presets", async () => {
        const fs = require("fs");
        const path = require("path");
        const dir = path.join(__dirname, "presets");
        const files = fs.readdirSync(dir);
        return files.filter((file) => {
            return [".json"].includes(path.extname(file).toLowerCase());
        });
    });
    ipcMain.handle("rotate-screen-window", () => {
        if (!newWin1) return;
        const [w, h] = newWin1.getSize();
        newWin1.setSize(h, w);
        centerWindow(h, w);
    });
});
app.on("will-quit", () => {
    if (phpProcess) {
        console.log("Closing PHP server...");
        phpProcess.kill();
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
