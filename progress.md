# Progress — Brush Background Remover

## ✅ Completed

### Phase 1 — Core Setup
- [x] Plugin structure (manifest.json, package.json, tsconfig.json)
- [x] Node detection — supports ALL node types with image fills (Rectangle, Frame, Ellipse, etc.)
- [x] Image export via `exportAsync` → base64 transfer to UI
- [x] Canvas load with proper scaling and centering

### Phase 2 — Brush System
- [x] Stroke capture via pointer events
- [x] Smoothing via linear interpolation between points
- [x] Brush size control (2–100px, slider + keyboard shortcuts)
- [x] Brush hardness / soft edge via radial gradients
- [x] Undo/Redo stack (30-step history)

### Phase 3 — Mask Conversion
- [x] SVG path generation via scanline run-length encoding
- [x] Vector creation via `figma.createNodeFromSvg()` + clone
- [x] Mask grouping logic (`isMask = true` + `figma.group`)
- [x] Restore system (detect BG-Removed groups, ungroup)

### Phase 4 — UX Polish
- [x] Premium dark-themed UI with gradient accents
- [x] Custom cursor ring showing brush size
- [x] Toast notifications for feedback
- [x] Loading overlay with spinner
- [x] Empty states for different scenarios
- [x] Keyboard shortcuts (E, R, [, ], Ctrl+Z, Ctrl+Shift+Z)

### Bug Fixes (2026-03-01)
- [x] **Fixed:** Image detection broadened from RECTANGLE-only to all node types with image fills
- [x] **Fixed:** `selectionchange` was resetting UI while user was painting — added `isEditing` guard
- [x] **Fixed:** `currentNodeId` was being cleared mid-edit — now protected by editing state
- [x] **Fixed:** Added console logging for debugging message flow
- [x] **CRITICAL FIX:** Replaced broken SVG scanline approach with image-based compositing
  - Old: `maskToSVGPath()` generated thousands of tiny `M...h...v...Z` rectangles → visible grid outlines in Figma
  - New: Composite mask directly onto image pixels → export as transparent PNG → replace image fill via `figma.createImage()`
  - Result: pixel-perfect background removal, no vector artifacts
- [x] **Fixed:** Mask application now uses `figma.createImage()` + fill replacement instead of vector mask groups
- [x] **Fixed:** Original image stored in plugin data (`originalImageHash`) for non-destructive restoration
- [x] **Fixed:** PNGs with existing transparency turned black — now uses `Math.min(originalAlpha, maskAlpha)` to preserve original transparency while also applying brush erasure

### New Features (2026-03-01)
- [x] **Zoom** — Mouse wheel to zoom in/out toward cursor, +/- keys, zoom buttons in canvas area
- [x] **Pan** — Space + drag or middle-click drag to pan around zoomed image
- [x] **Fit to View** — Press `0` or click ⊡ button to reset zoom/pan
- [x] **Zoom indicator** — Shows current zoom percentage in bottom-right
- [x] **Lasso Tool** — Freeform selection tool: draw around an area to erase/restore it
  - Dashed outline preview while drawing
  - Semi-transparent fill preview showing affected area
  - Fills the enclosed region on the mask when pointer released
  - Works in both erase and restore modes
- [x] **Updated keyboard shortcuts:** B=Brush, L=Lasso, E=Erase, R=Restore, 0=Fit, +/-=Zoom
- [x] **Figma Native UI Update** — Completely refactored UI styling to use Figma's native design tokens (`--figma-color-bg`, `--figma-color-text`, etc.) for seamless integration with Figma's light/dark modes. Added professional SVG icons, improved slider aesthetics, and refined component elevations.
- [x] **UI Contrast Fix** — Fixed visibility issues in dark mode where selected buttons and version badges had white-on-white text by correctly mapping Figma's theme tokens.
- [x] **Eraser Branding** — Renamed plugin to **Eraser**, added new eraser logo, and updated all UI labels.
- [x] **Vector & Group Support** — Expanded support beyond images. You can now erase parts of Vector nodes, Groups, Frames, and Text.
  - Non-image nodes are automatically rasterized for the editor.
  - Restoration system expanded to handle complex original states (hiding/unhiding groups).

## 🔲 Not Yet Implemented (V1+ Features from plan.md)

### Phase 5 — Pro Enhancements
- [ ] Feather simulation (blur on mask)
- [ ] Mask editing mode (reopen and continue editing existing mask)
- [ ] Vector simplification (reduce anchor points)
- [ ] Marketplace optimization
- [ ] Magic wand color threshold selection
- [ ] Batch processing
