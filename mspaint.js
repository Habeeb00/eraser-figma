const fs = require('fs');
const filepath = 'src/ui.html';
const content = fs.readFileSync(filepath, 'utf8');

const newCss = `
/* ─── MS Paint / Win95 Design Tokens ──────────────────── */
:root {
    --bg: #c0c0c0;
    --bg-surface: #ffffff;
    --bg-elevated: #c0c0c0;
    --border-light: #dfdfdf;
    --border-white: #ffffff;
    --border-dark: #808080;
    --border-black: #000000;
    --text: #000000;
    --text-dim: #808080;
    --text-inverse: #ffffff;
    --accent: #000080; /* Windows title blue */
    --accent-hover: #1084d0;
    --danger: #ff0000;
    --danger-hover: #cc0000;
    --success: #008000;
    --font: 'MS Sans Serif', 'Tahoma', 'Pixelated', sans-serif;
}

* { padding: 0; margin: 0; box-sizing: border-box; }
body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    user-select: none;
    -webkit-font-smoothing: none;
    font-size: 11px;
}

/* ─── UI Framework ────────────────────────────────────────── */
.win95-outset {
    border-top: 1px solid var(--border-white) !important;
    border-left: 1px solid var(--border-white) !important;
    border-right: 1px solid var(--border-black) !important;
    border-bottom: 1px solid var(--border-black) !important;
    box-shadow: inset -1px -1px 0 var(--border-dark), inset 1px 1px 0 var(--border-light) !important;
    background: var(--bg) !important;
}

.win95-inset {
    border-top: 1px solid var(--border-dark) !important;
    border-left: 1px solid var(--border-dark) !important;
    border-right: 1px solid var(--border-white) !important;
    border-bottom: 1px solid var(--border-white) !important;
    box-shadow: inset 1px 1px 0 var(--border-black), inset -1px -1px 0 var(--border-light) !important;
    background: var(--bg-surface) !important;
}

/* ─── Layout ────────────────────────────────────────── */
.plugin-container {
    display: flex; flex-direction: column; height: 100vh; padding: 4px; gap: 4px;
    background: var(--bg);
}

/* ─── Header ────────────────────────────────────────── */
.header {
    background: var(--accent);
    color: var(--text-inverse);
    display: flex; align-items: center; justify-content: space-between;
    padding: 2px 4px;
    font-weight: bold;
    letter-spacing: 0.5px;
}
.header-title { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.header-title svg { stroke: var(--text-inverse); }
.header-badge {
    background: #c0c0c0;
    color: #000;
    padding: 0 4px;
    border-top: 1px solid #fff; border-left: 1px solid #fff; border-right: 1px solid #808080; border-bottom: 1px solid #808080;
    font-size: 11px; font-weight: bold;
}

/* ─── Canvas Area ───────────────────────────────────── */
.canvas-area {
    flex: 1; position: relative; min-height: 0;
    margin: 4px 6px;
    display: flex;
    flex-direction: row;
}

/* ─── Left Win95 Toolbar (MS Paint Tools) ────────────────────────────────────────── */
.left-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    width: 60px;
    gap: 0;
    padding: 2px;
    background: var(--bg);
}

.win95-tool-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border-top: 2px solid var(--border-white);
    border-left: 2px solid var(--border-white);
    border-right: 2px solid var(--border-dark);
    border-bottom: 2px solid var(--border-dark);
    cursor: pointer;
    box-sizing: border-box;
}

.win95-tool-btn svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: var(--text);
    stroke-width: 1.5;
}

.win95-tool-btn:active, .win95-tool-btn.active {
    border-top: 2px solid var(--border-dark);
    border-left: 2px solid var(--border-dark);
    border-right: 2px solid var(--border-white);
    border-bottom: 2px solid var(--border-white);
    background: url("data:image/svg+xml;utf8,<svg width='2' height='2' xmlns='http://www.w3.org/2000/svg'><rect width='1' height='1' fill='%23ffffff'/><rect x='1' y='1' width='1' height='1' fill='%23c0c0c0'/></svg>");
    padding-top: 2px;
    padding-left: 2px;
}

.win95-tool-btn.disabled {
    opacity: 0.5;
    pointer-events: none;
}

/* The settings section (stroke size) shown at the bottom of left toolbar */
.tool-settings {
    margin-top: 4px;
    width: 48px;
    height: 60px;
    border-top: 1px solid var(--border-dark);
    border-left: 1px solid var(--border-dark);
    border-right: 1px solid var(--border-white);
    border-bottom: 1px solid var(--border-white);
    background: var(--bg-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
}

.stroke-preview {
    background: var(--text);
    border-radius: 50%;
}

.stroke-1 { width: 3px; height: 3px; }
.stroke-2 { width: 6px; height: 6px; }
.stroke-3 { width: 10px; height: 10px; }

.canvas-wrapper {
    position: relative;
    flex: 1;
    border-top: 2px solid var(--border-dark);
    border-left: 2px solid var(--border-dark);
    border-right: 2px solid var(--border-white);
    border-bottom: 2px solid var(--border-white);
    background: var(--bg-surface);
    overflow: hidden;
    touch-action: none;
}

.canvas-inner { position: absolute; transform-origin: 0 0; }
.canvas-inner canvas { position: absolute; top: 0; left: 0; image-rendering: pixelated; }
#checkerboard { z-index: 1; opacity: 0.5; }
#image-canvas { z-index: 2; }
#mask-canvas { z-index: 3; opacity: 0; }
#brush-canvas { z-index: 4; cursor: none; }

/* Zoom indicator */
.zoom-badge {
    position: absolute; bottom: 8px; right: 8px; font-size: 11px;
    padding: 2px 4px; background: var(--bg); color: var(--text);
    border-top: 1px solid var(--border-white); border-left: 1px solid var(--border-white);
    border-right: 1px solid var(--border-black); border-bottom: 1px solid var(--border-black);
    z-index: 50; pointer-events: none;
}
.zoom-controls { position: absolute; bottom: 8px; left: 8px; display: flex; gap: 4px; z-index: 50; }
.zoom-btn {
    width: 20px; height: 20px; font-size: 12px; font-weight: bold;
    background: var(--bg); border: none; cursor: pointer; color: var(--text);
    border-top: 1px solid var(--border-white); border-left: 1px solid var(--border-white);
    border-right: 1px solid var(--border-black); border-bottom: 1px solid var(--border-black);
    box-shadow: inset -1px -1px 0 var(--border-dark), inset 1px 1px 0 var(--border-light);
}
.zoom-btn:active {
    border-top: 1px solid var(--border-black); border-left: 1px solid var(--border-black);
    border-right: 1px solid var(--border-white); border-bottom: 1px solid var(--border-white);
    box-shadow: inset 1px 1px 0 var(--border-dark);
    padding-top: 1px; padding-left: 1px;
}

/* Cursor overlay */
.cursor-ring {
    position: fixed; pointer-events: none;
    border: 1px dashed #000;
    border-radius: 50%; z-index: 9999; transform: translate(-50%, -50%);
    box-shadow: inset 0 0 0 1px #fff;
    mix-blend-mode: difference;
}

/* ─── Empty State ───────────────────────────────────── */
.empty-state { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px; text-align: center; }
.empty-state-icon { font-size: 48px; }
.empty-state-icon svg { width: 32px; height: 32px; fill: none; stroke: var(--border-dark); }
.empty-state-title { font-size: 14px; font-weight: bold; color: var(--text); }
.empty-state-desc { font-size: 11px; color: var(--text); }

/* ─── Bottom Palette/Slider ───────────────────────────────────────── */
.bottom-area {
    display: flex; align-items: center; gap: 4px; padding: 4px 6px;
    background: var(--bg);
}

/* ─── Sliders ───────────────────────────────────────── */
.sliders-row { flex: 1; display: flex; gap: 10px; }
.slider-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.slider-label { display: flex; justify-content: space-between; font-size: 11px; }
input[type="range"] {
    -webkit-appearance: none; width: 100%; height: 4px;
    background: var(--border-dark); border-bottom: 1px solid var(--border-white); border-right: 1px solid var(--border-white); outline: none;
    box-shadow: inset 1px 1px 0 var(--border-black);
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 10px; height: 18px;
    background: var(--bg);
    border-top: 1px solid var(--border-white); border-left: 1px solid var(--border-white);
    border-right: 1px solid var(--border-black); border-bottom: 1px solid var(--border-black);
    box-shadow: inset -1px -1px 0 var(--border-dark), inset 1px 1px 0 var(--border-light);
    cursor: pointer;
}

/* ─── Action Buttons ────────────────────────────────── */
.actions-row { display: flex; gap: 8px; }
.btn {
    padding: 4px 14px; font-size: 11px; font-weight: normal;
    background: var(--bg); border: none; cursor: pointer; color: var(--text);
    border-top: 1px solid var(--border-white); border-left: 1px solid var(--border-white);
    border-right: 1px solid var(--border-black); border-bottom: 1px solid var(--border-black);
    box-shadow: inset -1px -1px 0 var(--border-dark), inset 1px 1px 0 var(--border-light);
    text-align: center;
}
.btn:active:not(:disabled) {
    border-top: 1px solid var(--border-black); border-left: 1px solid var(--border-black);
    border-right: 1px solid var(--border-white); border-bottom: 1px solid var(--border-white);
    box-shadow: inset 1px 1px 0 var(--border-dark);
    padding-top: 5px; padding-bottom: 3px;
}
.btn:disabled { color: var(--border-dark); text-shadow: 1px 1px 0 var(--border-white); }
.btn-primary { font-weight: bold; }

/* ─── Status bar ────────────────────────────────────── */
.status-bar {
    font-size: 11px; padding: 2px 4px; margin: 0 4px;
    border-top: 1px solid var(--border-dark); border-left: 1px solid var(--border-dark);
    border-right: 1px solid var(--border-white); border-bottom: 1px solid var(--border-white);
    box-shadow: inset 1px 1px 0 var(--border-black);
    color: var(--text); height: 20px;
    display: flex; align-items: center; background: var(--bg);
}

/* ─── Loading State ─────────────────────────────────── */
.loading-overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--bg); z-index: 100; gap: 12px;
}
.spinner {
    width: 32px; height: 32px;
    border: 4px solid var(--border-white);
    border-top: 4px solid var(--border-dark);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 11px; font-weight: bold; }

/* ─── Toast (Win95 Dialog) ────────────────────────────────────────── */
.toast {
    position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%) translateY(20px);
    padding: 8px 16px; font-size: 11px; z-index: 200; opacity: 0; pointer-events: none;
    background: var(--bg); border: none;
    border-top: 1px solid var(--border-white); border-left: 1px solid var(--border-white);
    border-right: 1px solid var(--border-black); border-bottom: 1px solid var(--border-black);
    box-shadow: inset -1px -1px 0 var(--border-dark), inset 1px 1px 0 var(--border-light);
    color: var(--text); font-weight: bold;
}
.toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
`;
const newContentHtml = `<div class="plugin-container">
        <div class="header">
            <span class="header-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
                    <path d="M20 20H7L3 16c0 0 0-2 0-2.8L14.6 1.6c0 0 2 0 2.8 0L21.4 5.6c0 0 0 2 0 2.8L10 20" />
                </svg>
                Eraser
            </span>
            <span class="header-badge">v1.1</span>
        </div>

        <!-- Canvas Area -->
        <div class="canvas-area">
            <!-- MS Paint Toolbar Left -->
            <div class="left-toolbar" id="leftToolbar" style="display:none">
                <!-- Lasso -->
                <button class="win95-tool-btn" id="btnLasso" title="Lasso Tool (L)">
                    <svg viewBox="0 0 24 24"><path d="M7 22a5 5 0 0 1-2-4"/><path d="M7 16.93c.96.43 1.96.74 2.99.91"/><path d="M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8-4.48 8-10 8a12 12 0 0 1-3-.38"/><path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
                </button>
                <!-- Erase -->
                <button class="win95-tool-btn" id="btnErase" title="Erase Tool (E)">
                    <svg viewBox="0 0 24 24"><path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.6 1.6c-.8-.8 2-.8 2.8 0L21.4 5.6c.8.8.8 2 0 2.8L10 20"/></svg>
                </button>
                <!-- Brush -->
                <button class="win95-tool-btn active" id="btnBrush" title="Brush Tool (B)">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <!-- Undo -->
                <button class="win95-tool-btn disabled" id="btnUndo" title="Undo (Ctrl+Z)">
                    <svg viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                </button>
                <!-- Redo -->
                <button class="win95-tool-btn disabled" id="btnRedo" title="Redo (Ctrl+Shift+Z)">
                    <svg viewBox="0 0 24 24"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
                </button>

                <!-- Tool settings box (brush size quick picks) -->
                <div class="tool-settings" id="toolSettings">
                    <div class="stroke-preview stroke-1" data-size="10"></div>
                    <div class="stroke-preview stroke-2" data-size="20"></div>
                    <div class="stroke-preview stroke-3" data-size="40"></div>
                </div>
            </div>

            <div class="canvas-wrapper" id="canvasWrapper">
                <!-- Empty State -->
                <div class="empty-state" id="emptyState">
                    <div class="empty-state-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24">
                            <rect width="18" height="18" x="3" y="3" rx="0" ry="0" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                    </div>
                    <div class="empty-state-title">Select an Image</div>
                    <div class="empty-state-desc">Select a node with an image fill on the Figma canvas to start removing its background.</div>
                </div>

                <div class="loading-overlay" id="loadingOverlay" style="display:none">
                    <div class="spinner"></div>
                    <div class="loading-text">Loading image…</div>
                </div>

                <!-- Canvas container (zoom/pan transforms applied here) -->
                <div class="canvas-inner" id="canvasInner" style="display:none">
                    <canvas id="checkerboard"></canvas>
                    <canvas id="image-canvas"></canvas>
                    <canvas id="mask-canvas"></canvas>
                    <canvas id="brush-canvas"></canvas>
                </div>
                
                <!-- Zoom UI (Relative to .canvas-area) -->
                <div class="zoom-badge" id="zoomBadge" style="display:none">100%</div>
                <div class="zoom-controls" id="zoomControls" style="display:none">
                    <button class="zoom-btn" id="btnZoomOut" title="Zoom Out (-)">−</button>
                    <button class="zoom-btn" id="btnZoomReset" title="Fit (0)">⊡</button>
                    <button class="zoom-btn" id="btnZoomIn" title="Zoom In (+)">+</button>
                </div>
            </div>

        </div>

        <!-- Bottom Area (Sliders & Actions) -->
        <div class="bottom-area" id="bottomArea" style="display:none">
            <!-- Sliders -->
            <div class="sliders-row" id="slidersSection">
                <div class="slider-group">
                    <div class="slider-label">
                        <span>Brush Size</span>
                        <span class="slider-value" id="sizeValue">20</span>
                    </div>
                    <input type="range" id="brushSize" min="2" max="100" value="20" />
                </div>
                <div class="slider-group">
                    <div class="slider-label">
                        <span>Hardness</span>
                        <span class="slider-value" id="hardValue">80%</span>
                    </div>
                    <input type="range" id="brushHardness" min="0" max="100" value="80" />
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="actions-row" id="actionsSection">
                <button class="btn" id="btnClear">Clear All</button>
                <button class="btn btn-primary" id="btnApply" disabled>Erase</button>
            </div>
        </div>

        <div class="status-bar" id="statusBar">Select an image to begin</div>
    </div>`;

const newContent = content.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${newCss}\n    </style>`).replace(/<div class="plugin-container">[\s\S]*?<div class="cursor-ring" id="cursorRing" style="display:none"><\/div>/, newContentHtml + '\n\n    <div class="cursor-ring" id="cursorRing" style="display:none"></div>');

let finalContent = newContent
    .replace('const toolbarSection = document.getElementById("toolbarSection");', 'const leftToolbar = document.getElementById("leftToolbar");\n            const bottomArea = document.getElementById("bottomArea");')
    .replace('const slidersSection = document.getElementById("slidersSection");', '')
    .replace('toolbarSection.style.display = d;', 'leftToolbar.style.display = d;')
    .replace('slidersSection.style.display = d;', 'bottomArea.style.display = d;')
    .replace('btnLasso.classList.remove("active-lasso");', 'btnLasso.classList.remove("active");')
    .replace('btnLasso.classList.add("active-lasso");', 'btnLasso.classList.add("active");')
    .replace('btnUndo.disabled = historyIndex <= 0;', 'btnUndo.classList.toggle("disabled", historyIndex <= 0);')
    .replace('btnRedo.disabled = historyIndex >= history.length - 1;', 'btnRedo.classList.toggle("disabled", historyIndex >= history.length - 1);')

fs.writeFileSync(filepath, finalContent, 'utf8');
console.log('updated content');
