// Brush Background Remover — Figma Plugin Backend
// Approach: composite mask onto image pixels → replace fill with transparent PNG
// Non-destructive: original imageHash stored in plugin data for restoration

figma.showUI(__html__, { width: 520, height: 620, themeColors: true });

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

        const imageBytes = await (node as any).exportAsync({ format: "PNG" });
        const base64 = figma.base64Encode(imageBytes);
        activeNodeId = node.id;

        const hasRestorationData = !!(
            (node as any).getPluginData("originalFills") ||
            (node as any).getPluginData("originalImageHash") ||
            (node as any).getPluginData("originalNodeId")
        );

        figma.ui.postMessage({
            type: "image-loaded",
            data: base64,
            nodeId: node.id,
            width: Math.round(node.width),
            height: Math.round(node.height),
            hasRestorationData
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

        // 1. Store original state for restoration (only if it doesn't exist)
        const sceneNode = node as SceneNode;
        if (hasFills(sceneNode)) {
            const currentFills = (sceneNode as any).fills;
            const existingFills = (sceneNode as any).getPluginData("originalFills");
            const existingHash = (sceneNode as any).getPluginData("originalImageHash");

            if (!existingFills && !existingHash && currentFills !== figma.mixed) {
                (sceneNode as any).setPluginData("originalFills", JSON.stringify(currentFills));
            }
        } else {
            const existingHidden = (sceneNode as any).getPluginData("wasHidden");
            const existingReplacement = (sceneNode as any).getPluginData("replacementId");
            if (!existingHidden && !existingReplacement) {
                (sceneNode as any).setPluginData("wasHidden", "true");
            }
        }

        // 2. Decode the composited PNG from UI
        const imageBytes = figma.base64Decode(base64ImageData);

        // 3. Create a new Figma image from the bytes
        const newImage = figma.createImage(imageBytes);

        let actualTarget: SceneNode & MinimalFillsMixin;

        const isSimpleImageRect = sceneNode.type === "RECTANGLE" &&
            hasFills(sceneNode) &&
            Array.isArray((sceneNode as any).fills) &&
            (sceneNode as any).fills.some((f: any) => f.type === "IMAGE");

        const isReplacementNode = (sceneNode as any).getPluginData("originalNodeId");

        if (isSimpleImageRect || isReplacementNode) {
            actualTarget = sceneNode as RectangleNode;
        } else {
            // Create a replacement rectangle for vectors/groups/frames
            const rect = figma.createRectangle();
            rect.name = (sceneNode as any).name + " (Eraser)";
            rect.resize((sceneNode as any).width, (sceneNode as any).height);
            rect.x = (sceneNode as any).x;
            rect.y = (sceneNode as any).y;
            rect.rotation = (sceneNode as any).rotation;

            // Add to same parent
            if ((sceneNode as any).parent) {
                const index = (sceneNode as any).parent.children.indexOf(sceneNode);
                (sceneNode as any).parent.insertChild(index + 1, rect);
            }

            // Hide original
            (sceneNode as any).visible = false;
            // Only set replacementId if it's not already set (for continuous erasure)
            if (!(sceneNode as any).getPluginData("replacementId")) {
                (sceneNode as any).setPluginData("replacementId", rect.id);
            }
            // Only set originalNodeId if it's not already set
            if (!(rect as any).getPluginData("originalNodeId")) {
                (rect as any).setPluginData("originalNodeId", sceneNode.id);
            }
            actualTarget = rect;
        }

        // 4. Replace the fill
        actualTarget.fills = [{
            type: "IMAGE",
            imageHash: newImage.hash,
            scaleMode: "FILL",
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

    // Case 1: Was a hidden original (Group/Frame)
    const replacementId = (node as any).getPluginData("replacementId");
    if (replacementId) {
        const replacement = figma.getNodeById(replacementId);
        if (replacement) replacement.remove();
        (node as SceneNode).visible = true;
        (node as any).setPluginData("replacementId", "");
        figma.notify("✅ Original restored!");
        figma.ui.postMessage({ type: "restored" });
        return;
    }

    // Case 2: Was a replacement node
    const originalNodeId = (node as any).getPluginData("originalNodeId");
    if (originalNodeId) {
        const original = figma.getNodeById(originalNodeId) as SceneNode;
        if (original) {
            original.visible = true;
            (original as any).setPluginData("replacementId", "");
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

// Listen for selection changes — blocked while editing
figma.on("selectionchange", () => {
    if (!isEditing) {
        handleSelection();
    }
});
