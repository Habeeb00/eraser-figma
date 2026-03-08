// Brush Background Remover — Figma Plugin Backend
// Approach: composite mask onto image pixels → replace fill with transparent PNG
// Non-destructive: original imageHash stored in plugin data for restoration

figma.showUI(__html__, { width: 520, height: 650, themeColors: true });

// ─── State ─────────────────────────────────────────────────

let isEditing = false;
let activeNodeId: string | null = null;

// ─── Helpers ───────────────────────────────────────────────

function isProcessableNode(node: SceneNode): boolean {
    return "exportAsync" in node;
}

function hasFills(node: SceneNode): node is (SceneNode & MinimalFillsMixin) {
    return "fills" in node;
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

    // Don't reload if the user is actively painting on the same node
    if (isEditing && activeNodeId === node.id) {
        return;
    }

    // New selection detected, stop editing previous session
    if (activeNodeId && activeNodeId !== node.id) {
        isEditing = false;
        activeNodeId = null;
    }

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

    if (!isProcessableNode(node)) {
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
            // width/height are derived by the UI from the actual image pixels,
            // NOT from node.width/node.height (which are layout units, not export pixels)
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
    if (!node) {
        figma.ui.postMessage({ type: "error", message: "Target node not found: " + nodeId });
        return;
    }

    try {
        const sceneNode = node as SceneNode;

        // Decode the composited PNG from the UI
        const imageBytes = figma.base64Decode(base64ImageData);
        const newImage = figma.createImage(imageBytes);

        const isImageRect = sceneNode.type === "RECTANGLE" &&
            "fills" in sceneNode &&
            Array.isArray((sceneNode as any).fills) &&
            (sceneNode as any).fills.some((f: any) => f.type === "IMAGE");

        if (isImageRect) {
            // ─── In-place update for simple image rectangles ───
            // Store original ONCE
            if (!(sceneNode as any).getPluginData("originalFills")) {
                (sceneNode as any).setPluginData("originalFills", JSON.stringify((sceneNode as any).fills));
            }
            (sceneNode as any).fills = [{ type: "IMAGE", imageHash: newImage.hash, scaleMode: "FILL" }];

        } else {
            // ─── For vectors / groups / frames ──────────────────
            // Reuse an existing eraser rect if we've applied before, otherwise create one
            const existingRectId = (sceneNode as any).getPluginData("eraserRectId");
            let rect: RectangleNode | null = existingRectId
                ? figma.getNodeById(existingRectId) as RectangleNode | null
                : null;

            if (!rect) {
                // First time: store original state, create rect
                (sceneNode as any).setPluginData("wasHidden", "true");
                rect = figma.createRectangle();
                rect.name = (sceneNode as any).name + " (Erased)";
                rect.resize((sceneNode as any).width, (sceneNode as any).height);
                rect.x = (sceneNode as any).x;
                rect.y = (sceneNode as any).y;
                if ((sceneNode as any).parent) {
                    const idx = (sceneNode as any).parent.children.indexOf(sceneNode);
                    (sceneNode as any).parent.insertChild(idx + 1, rect);
                }
                (sceneNode as any).setPluginData("eraserRectId", rect.id);
                (rect as any).setPluginData("originalNodeId", sceneNode.id);
                // Hide the original node
                (sceneNode as any).visible = false;
            }

            // Update (or set) the fill on the rect
            (rect as any).fills = [{ type: "IMAGE", imageHash: newImage.hash, scaleMode: "FILL" }];

            // Select the rect so subsequent handleSelection exports the correct node
            figma.currentPage.selection = [rect];
        }

        isEditing = false;
        activeNodeId = null;

        // Echo the composited image back to the UI so it can continue editing
        // without needing a Figma re-export roundtrip (which can be unreliable)
        figma.ui.postMessage({
            type: "mask-applied",
            continuationImage: base64ImageData,
            nodeId: sceneNode.type === "RECTANGLE" ? sceneNode.id : figma.currentPage.selection[0]?.id ?? sceneNode.id,
        });
        figma.notify("✅ Erased!");

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

    // Case 1: Was a hidden original (Group/Frame/Vector) with an eraserRectId or replacementId
    const eraserRectId = (node as any).getPluginData("eraserRectId") || (node as any).getPluginData("replacementId");
    if (eraserRectId) {
        const rect = figma.getNodeById(eraserRectId);
        if (rect) rect.remove();
        (node as SceneNode).visible = true;
        (node as any).setPluginData("eraserRectId", "");
        (node as any).setPluginData("replacementId", "");
        (node as any).setPluginData("wasHidden", "");
        figma.notify("✅ Original restored!");
        figma.ui.postMessage({ type: "restored" });
        return;
    }

    // Case 2: Was a replacement/eraser rect — find original and restore it
    const originalNodeId = (node as any).getPluginData("originalNodeId");
    if (originalNodeId) {
        const original = figma.getNodeById(originalNodeId) as SceneNode;
        if (original) {
            (original as any).visible = true;
            (original as any).setPluginData("eraserRectId", "");
            (original as any).setPluginData("replacementId", "");
            (original as any).setPluginData("wasHidden", "");
            node.remove();
            figma.currentPage.selection = [original];
            figma.notify("✅ Original restored!");
            figma.ui.postMessage({ type: "restored" });
        }
        return;
    }

    // Case 3: In-place fill replacement (Vector/Image)
    const originalFillsJson = node.getPluginData("originalFills");
    if (originalFillsJson && hasFills(node)) {
        try {
            node.fills = JSON.parse(originalFillsJson);
            node.setPluginData("originalFills", "");
            figma.notify("✅ Original restored!");
            figma.ui.postMessage({ type: "restored" });
        } catch (e) {
            figma.notify("❌ Failed to restore fills.");
        }
        return;
    }

    // Legacy support (hash based)
    const originalHash = node.getPluginData("originalImageHash");
    if (originalHash && hasFills(node)) {
        const scaleMode = node.getPluginData("originalScaleMode") || "FILL";
        node.fills = [{
            type: "IMAGE",
            imageHash: originalHash,
            scaleMode: scaleMode as ImagePaint["scaleMode"],
        }];
        node.setPluginData("originalImageHash", "");
        figma.notify("✅ Original restored!");
        figma.ui.postMessage({ type: "restored" });
        return;
    }

    figma.notify("⚠️ No restoration data found.");
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

// Listen for selection changes — always update unless it's the same node
figma.on("selectionchange", () => {
    handleSelection();
});
