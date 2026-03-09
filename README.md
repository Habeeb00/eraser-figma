# 🖌️ Eraser — Figma Background Remover

A fast, manual, brush-based background remover that works **fully inside Figma** using native vector masking.

**No AI. No external servers. Fully Figma-native.**

## Features

- **Brush Erase Mode** — Paint over areas to remove background
- **Brush Restore Mode** — Paint to bring back accidentally erased areas
- **Adjustable Brush Size** — 2px–100px, also `[` / `]` keyboard shortcuts
- **Adjustable Brush Hardness** — Soft edge simulation via radial gradients
- **Undo/Redo** — 30-step history, `Ctrl+Z` / `Ctrl+Shift+Z`
- **Live Preview** — Checkerboard transparency grid shows result in real-time
- **Non-destructive** — Creates a Figma mask group, original image preserved
- **Restore** — Select the mask group and restore the original with one click
- **Retro Interface** — Classic MS Paint / Windows 95 design aesthetic

## How to Load

1. Open **Figma Desktop App**
2. Go to **Menu → Plugins → Development → Import plugin from manifest**
3. Browse to `manifest.json` in this folder
4. Plugin appears under **Plugins → Development → Brush Background Remover**

## How to Use

1. Select a node with an image fill on your Figma canvas
2. Run the plugin from the Plugins menu
3. Paint over areas you want to remove (erase mode)
4. Switch to restore mode to undo specific brush strokes
5. Click **Apply Mask** to create the Figma mask group
6. To undo later: select the `BG-Removed` group → run plugin → click **Restore**

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Switch to Erase mode |
| `R` | Switch to Restore mode |
| `[` | Decrease brush size |
| `]` | Increase brush size |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

## Project Structure

```
eraser-figma/
├── manifest.json       # Figma plugin manifest
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── plan.md             # Project plan
├── src/
│   ├── code.ts         # Plugin backend (Figma API)
│   └── ui.html         # Plugin UI (canvas + controls)
└── dist/
    └── code.js         # Compiled backend
```

## Development

```bash
npm install           # Install dependencies
npm run build         # Compile TypeScript
npm run watch         # Watch mode for development
```

## Publishing Assets

- **Logo**: Use `logo.svg` directly for the plugin icon in Figma community. It is pre-styled with the Figma blue accent and dark-themed iOS/macOS aesthetic border glow. You can rasterize this in Figma as a 128x128 PNG if needed for the community portal.

## Technical Architecture

1. **Selection Detection** — Validates any node with an IMAGE fill
2. **Image Export** — `node.exportAsync({ format: "PNG" })` → base64
3. **Canvas Rendering** — HTML Canvas with checkerboard transparency preview
4. **Brush System** — Interpolated pointer events, radial gradient soft edges
5. **Mask Generation** — Scanline SVG path from mask bitmap
6. **Vector Creation** — `figma.createNodeFromSvg()` → clone → position
7. **Mask Group** — `isMask = true`, grouped with original image
