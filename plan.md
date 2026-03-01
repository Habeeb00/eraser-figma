PLUGIN NAME: Brush Background Remover for Figma

FILE TYPE: PROJECT PLAN (TXT)

1. PROBLEM STATEMENT

Figma does not provide a brush-based background removal tool.

Designers currently must:

Use manual vector masking (slow)

Use pen tool (time-consuming)

Export to Photoshop or other tools

Use external background removal websites

There is no:

Natural “paint to remove background” workflow inside Figma.

Opportunity:
Build a native masking-based brush remover that works directly on images inside Figma.

2. CORE OBJECTIVE

Build a Figma plugin that allows users to:

Paint over parts of an image to remove background

Convert brush strokes into vector masks

Apply transparent masking to the image

Restore erased areas

Keep everything non-destructive

No AI.
No reconstruction.
Pure masking.

3. TARGET USERS

E-commerce designers removing product backgrounds

Social media designers cleaning images

UI designers cleaning screenshots

Agencies editing quick assets

Students who don’t want to learn Photoshop

4. KEY FEATURES (MVP)
4.1 Brush Erase Mode

Paint over image inside plugin canvas

Adjustable brush size

Adjustable brush hardness (simulated)

Erase mode (remove area)

Restore mode (unmask area)

Undo/Redo inside plugin UI

4.2 Mask Application

Convert all brush strokes into a single compound vector path

Create a Figma mask group

Apply mask to selected image

Preserve original image as hidden backup

Structure after apply:

Mask Group
 ├─ Mask Vector (generated from brush strokes)
 └─ Original Image
4.3 Restore Mode

Remove mask group

Reveal original hidden image

OR edit existing mask vector

4.4 UI Components

Canvas preview

Brush size slider

Hardness slider

Erase / Restore toggle

Apply button

Cancel button

Loading state

5. HOW IT WORKS (TECHNICAL FLOW)
Step 1 – Selection Detection

User selects a PNG or JPG image node

Plugin verifies valid node

Step 2 – Image Export

Use:

node.exportAsync({ format: "PNG" })

Load image into HTML Canvas in plugin UI.

Step 3 – Brush Stroke Recording

Inside HTML Canvas:

Record pointer coordinates

Smooth path using spline interpolation

Store as stroke data

On Apply:

Merge strokes into one path

Convert path to SVG

Step 4 – Convert SVG to Figma Vector

Use:

figma.createNodeFromSvg(svgString)

Result:
Brush shape becomes real Figma vector.

Step 5 – Mask Group Creation

Duplicate original image

Insert vector mask

Set mask vector as mask

Group them

maskNode.isMask = true
figma.group([maskNode, imageNode], parent)
Step 6 – Final Structure
Group
 ├─ Mask Vector (isMask = true)
 └─ Image

User sees transparent background where painted.

6. ADVANCED FEATURES (V1+)
6.1 Soft Edge Simulation

Simulate feather using:

Blur effect on mask

OR slightly expanded path with reduced opacity

6.2 Live Preview Mode

Before Apply:

Overlay simulated transparency grid

Show what will be erased

6.3 Mask Editing Mode

Allow:

Reopen plugin

Load existing mask vector

Continue editing

6.4 Stroke Optimization

Merge overlapping strokes

Reduce path complexity

Simplify vector points

6.5 Smart Selection Assist (Non-AI)

Magic wand style color threshold selection

Flood-fill background detection (optional future feature)

7. DEVELOPMENT ROADMAP
PHASE 1 – Core Setup (Week 1)

Plugin structure

Node detection

Image export

Canvas load

PHASE 2 – Brush System (Week 2)

Stroke capture

Smoothing algorithm

Brush size control

Undo stack

PHASE 3 – Mask Conversion (Week 3)

SVG generation

Vector creation

Mask grouping logic

Restore system

PHASE 4 – UX Polish (Week 4)

Clean UI

Performance optimization

Stroke merging

Error handling

PHASE 5 – Pro Enhancements (Week 5+)

Feather simulation

Mask editing mode

Vector simplification

Marketplace optimization

8. TESTING CHECKLIST

High-resolution images don’t crash

Mask group structure is correct

Undo/Redo stable

Restore works

Multiple strokes merge correctly

Performance acceptable on mid-range laptops

9. MONETIZATION STRATEGY

FREE:

Basic brush

Low-res images

No feather

PRO:

High-res support

Soft edge simulation

Editable masks

Stroke optimization

Batch processing

10. RISKS & MITIGATION
Risk: Performance slowdown

Mitigation:

Merge strokes before mask

Limit real-time operations

Apply only on button click

Risk: Complex paths become heavy

Mitigation:

Simplify SVG before import

Reduce anchor points

Risk: Users expect AI removal

Mitigation:

Clear positioning:
“Manual Brush Background Cutter”
Not “AI Object Removal”

11. POSITIONING

This is NOT:

Photoshop replacement

AI object remover

This IS:

A fast, manual, brush-based background remover fully inside Figma.

12. PROJECT GOAL

Deliver the first true brush-based background masking tool inside Figma,
using native vector masking, stable performance, and clean UX.

No AI.
No external servers.
Fully Figma-native.