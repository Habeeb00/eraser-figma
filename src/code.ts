// Brush Background Remover — Figma Plugin Backend
// Approach: composite mask onto image pixels → replace fill with transparent PNG
// Non-destructive: original imageHash stored in plugin data for restoration

figma.showUI(__html__, { width: 520, height: 620, themeColors: true });

// ─── State ─────────────────────────────────────────────────

let isEditing = false;
let activeNodeId: string | null = null;

// ─── Helpers ───────────────────────────────────────────────

function hasImageFill(node: SceneNode): boolean {
    if (!("fills" in node)) return false;
    const fills = (node as any).fills;
    if (fills === figma.mixed || !Array.isArray(fills)) return false;
    return fills.some((f: Paint) => f.type === "IMAGE");
}

function canExport(node: SceneNode): node is SceneNode & ExportMixin {
    return "exportAsync" in node;
}

function hasPluginData(node: SceneNode): node is SceneNode & PluginDataMixin {
    return "getPluginData" in node;
}

// ─── Selection handling ────────────────────────────────────

async function handleSelection() {
    const sel = figma.currentPage.selection;

    if (sel.length === 0) {
        figma.ui.postMessage({ type: "no-selection" });
        return;
    }

    if (sel.length > 1) {
        figma.ui.postMessage({ type: "multiple-selection" });
        return;
    }

    const node = sel[0];

    // Check if this node was already processed (has stored original)
    if (hasPluginData(node)) {
        const originalHash = node.getPluginData("originalImageHash");
        if (originalHash) {
            figma.ui.postMessage({
                type: "already-processed",
                id: node.id,
                name: node.name,
            });
            return;
        }
    }

    if (!hasImageFill(node)) {
        figma.ui.postMessage({ type: "invalid-selection" });
        return;
    }

    if (!canExport(node)) {
        figma.ui.postMessage({ type: "error", message: "Node cannot be exported." });
        return;
    }

    try {
        figma.ui.postMessage({ type: "loading" });

        const imageBytes = await node.exportAsync({ format: "PNG" });
        const base64 = figma.base64Encode(imageBytes);

        activeNodeId = node.id;

        figma.ui.postMessage({
            type: "image-loaded",
            data: base64,
            nodeId: node.id,
            width: Math.round(node.width),
            height: Math.round(node.height),
        });
    } catch (err: any) {
        console.error("Export error:", err);
        figma.ui.postMessage({ type: "error", message: err.message || "Failed to export image" });
    }
}

// ─── Apply mask (image-based approach) ─────────────────────

async function applyMask(base64ImageData: string, nodeId: string) {
    // Find the target node
    let node = figma.getNodeById(nodeId) as SceneNode | null;
    if (!node && activeNodeId) {
        node = figma.getNodeById(activeNodeId) as SceneNode | null;
    }
    if (!node || !("fills" in node)) {
        figma.ui.postMessage({ type: "error", message: "Target node not found: " + nodeId });
        return;
    }

    try {
        const targetNode = node as SceneNode & MinimalFillsMixin;

        // 1. Store original image hash for later restoration
        if (hasPluginData(node)) {
            const currentFills = targetNode.fills as readonly Paint[];
            const imageFill = currentFills.find((f: Paint) => f.type === "IMAGE") as ImagePaint | undefined;
            if (imageFill && imageFill.imageHash) {
                (node as SceneNode & PluginDataMixin).setPluginData("originalImageHash", imageFill.imageHash);
                (node as SceneNode & PluginDataMixin).setPluginData("originalScaleMode", imageFill.scaleMode || "FILL");
            }
        }

        // 2. Decode the composited PNG from UI
        const imageBytes = figma.base64Decode(base64ImageData);

        // 3. Create a new Figma image from the bytes
        const newImage = figma.createImage(imageBytes);

        // 4. Replace the fill with the new transparent image
        targetNode.fills = [{
            type: "IMAGE",
            imageHash: newImage.hash,
            scaleMode: "FILL",
            visible: true,
            opacity: 1,
        }];

        isEditing = false;
        activeNodeId = null;

        figma.ui.postMessage({ type: "mask-applied" });
        figma.notify("✅ Background removed!");

    } catch (err: any) {
        console.error("Apply mask error:", err);
        figma.ui.postMessage({ type: "error", message: err.message || "Failed to apply mask" });
    }
}

// ─── Restore original ─────────────────────────────────────

function restoreOriginal() {
    const sel = figma.currentPage.selection;

    if (sel.length !== 1) {
        figma.notify("⚠️ Select a single processed image to restore.");
        return;
    }

    const node = sel[0];

    if (!hasPluginData(node) || !("fills" in node)) {
        figma.notify("⚠️ This node doesn't support restoration.");
        return;
    }

    const originalHash = node.getPluginData("originalImageHash");
    if (!originalHash) {
        figma.notify("⚠️ No original image data found on this node.");
        return;
    }

    const scaleMode = node.getPluginData("originalScaleMode") || "FILL";

    (node as SceneNode & MinimalFillsMixin).fills = [{
        type: "IMAGE",
        imageHash: originalHash,
        scaleMode: scaleMode as ImagePaint["scaleMode"],
        visible: true,
        opacity: 1,
    }];

    // Clear the stored data
    node.setPluginData("originalImageHash", "");
    node.setPluginData("originalScaleMode", "");

    figma.currentPage.selection = [node];
    figma.notify("✅ Original image restored!");
    figma.ui.postMessage({ type: "restored" });
}

// ─── Message handler ───────────────────────────────────────

figma.ui.onmessage = async (msg: any) => {
    switch (msg.type) {
        case "check-selection":
            await handleSelection();
            break;

        case "editing-started":
            isEditing = true;
            break;

        case "editing-stopped":
            isEditing = false;
            activeNodeId = null;
            break;

        case "apply-mask":
            await applyMask(msg.imageData, msg.nodeId);
            break;

        case "restore-original":
            restoreOriginal();
            break;

        case "cancel":
            figma.closePlugin();
            break;
    }
};

// Run on startup
handleSelection();

// Listen for selection changes — blocked while editing
figma.on("selectionchange", () => {
    if (!isEditing) {
        handleSelection();
    }
});
