# 🎨 Block Fit - Professional UI/UX & Design Specification

This document details the core UI/UX overhaul, design tokens, styling rules, and pointer interaction snapping mechanics that make Block Fit a premium, tactile, and addictive puzzle experience.

---

## 🌟 1. Design Philosophy

The visual design is built around three pillars:
1. **Grid Snapping Satisfaction**: When a block hovers over a valid placement, the snappy ghost outline assures the player of a perfect fit before they release it.
2. **2.5D Tactile Beveling**: Every block block has raised bevels and soft shadows, making pieces look like tangible physical tokens.
3. **High-Contrast Dark Mode Focus**: Replacing stark blacks/whites with a deep slate/midnight theme reduces eye strain and makes the vibrant colors of the blocks pop like glowing gems.

---

## 🎨 2. The Color System & Token Palette

The color tokens are selected for high contrast, colorblind accessibility, and visual harmony:

| Element | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **App Background** | Deep Midnight | `#0F172A` | Primary backdrop to keep full focus on the board. |
| **Board Base** | Slate Gray | `#1E293B` | The grid frame container holding the cells. |
| **Empty Grid Cell** | Gunmetal | `#334155` | Recessed slot representing empty board cells. |
| **Block 1 (Cyan)** | Neon Blue | `#06B6D4` | Mapped to I-blocks/Teal (vibrant aquamarine). |
| **Block 2 (Yellow)** | Sunny Gold | `#EAB308` | Mapped to O-blocks/Mustard (rich marigold). |
| **Block 3 (Purple)** | Electric Violet | `#A855F7` | Mapped to T-blocks/Lavender (slate purple). |
| **Block 4 (Green)** | Poison Apple | `#22C55E` | Mapped to S-blocks/Sage (moss green). |
| **Block 5 (Red)** | Cherry Pop | `#EF4444` | Mapped to Z-blocks/Coral (terracotta red). |
| **Block 6 (Orange)** | Tangelo | `#F97316` | Mapped to L-blocks/Orange (vibrant orange). |

---

## ✨ 3. 2.5D Tactile Styling (CSS Class)

The tactile snapped feel is achieved through dual-inset beveling shadows. This styling is declared in `src/index.css` and applied to active, placed, and tray block cells:

```css
.block-tactile {
  border-radius: 6px;
  box-shadow: 
    /* 1. Top/Left Highlight Bevel (simulate light reflection) */
    inset 2px 2px 4px rgba(255, 255, 255, 0.4),
    /* 2. Bottom/Right Shadow Bevel (simulate 3D depth) */
    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
    /* 3. Soft Drop Shadow (separate block from recessed cells) */
    0 2px 4px rgba(0, 0, 0, 0.2);
}
```

---

## 👆 4. Finger-Offset Pointer Snapping Mechanics

To prevent **finger obscurity** on mobile touchscreens (where the player's thumb blocks the view of the piece they are placing), we employ a coordinate offset lift:

### The Interaction Flow:
1. **Pointer Down**: When a player grabs a block, the floating clone is rendered with a **-45px vertical offset** relative to their touch point:
   $$\text{Visual Top} = \text{Touch } Y - \text{Offset } Y - 45\text{px}$$
2. **Pointer Move**: During dragging, we compensate the snapping grid calculation by the same **-45px**:
   $$\text{Snapping Grid } Y = \text{Math.round}\left(\frac{\text{Pointer } Y - 45\text{px} - \text{Board Top} - \text{Offset } Y}{\text{Cell Height}}\right)$$
3. **Pointer Up**: Snaps the block exactly onto the calculated coordinate slots.

This mathematical symmetry ensures the block visually snaps *above* the thumb while remaining perfectly aligned with the grid coordinates underneath.

---

## 🎭 5. Dynamic Theme Adaptability

The board container (`getBoardClass`) and cells (`getCellBgClass`) morph automatically depending on the selected theme profile:

- **Light Mode**: Off-white cards (`#F5F2EF`) inside a soft sand board (`#EBE7E2`).
- **Dark Mode**: Gunmetal cells (`#334155`) inside a slate gray tray (`#1E293B`) with Deep Midnight (`#0F172A`) backdrop.
- **Neon Mode**: Deep navy base with neon pink borders, glowing outer cells, and neon-pink glowing empty slots.
- **Sunset Mode**: Warm obsidian background, glowing golden cell dots, and amber grid outlines.
- **Retro Mode**: Classic green scanline console theme, cyber green borders, and high-frequency glowing console dots.
