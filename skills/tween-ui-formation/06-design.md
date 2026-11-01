# Design language

The formation is half the effect; the UI it builds is the other half. These are the choices that made tween's version work, and the ones that were tried and thrown out.

## Ink (dark, default) and paper (light)

```css
:root, [data-theme="dark"] {
  --bg: #0e0e0d; --surface: #171716; --raised: #201f1d;
  --fg: #ecebe6; --fg-2: #bdbbb3; --muted: #85837b; --faint: #55544f;
  --hair: rgba(236, 235, 230, 0.1);
  --accent: #ff5a1f;            /* one signal colour */
  --blue: #2b4bff; --blue-soft: #8e9dff;
}
[data-theme="light"] {
  --bg: #f3f2ee; --surface: #ffffff; --raised: #e9e8e2;
  --fg: #161615; --fg-2: #4a4944; --muted: #7a786f; --faint: #b3b1a9;
  --hair: rgba(22, 22, 21, 0.1);
}
```

Warm near-black, not pure black; warm off-white, not pure white. Cards are flat surfaces with a 1px inset hairline (`box-shadow: inset 0 0 0 1px var(--hair)`), radius 20px.

A theme switch flips `data-theme` on `<html>`, saved to localStorage and applied by an inline script before paint so there's no flash. Because every colour is a variable scoped to `[data-theme]`, any subtree (an export frame) can carry its own theme.

## Type

- **Instrument Serif** for display: hero titles, card titles, big numbers (`24°`, `SFO → JFK`). Italic for emphasis: *taken apart.*
- **Instrument Sans** for body and UI text.
- **DM Mono** for labels, metadata and everything in the construction layer: uppercase, `0.08em` tracking, 10.5–12px.

## Colour use

- One signal colour (orange) for the thing that matters right now: the primary action, live status, progress, the halftone.
- One cool colour (blue) used rarely, as a full-bleed card (weather) or a secondary data series.
- Everything else is the text colour at different strengths.

## Motion

- Construction moves in **hard steps**; the finished UI moves on **springs and smooth ease-outs** (`cubic-bezier(0.32, 0.72, 0, 1)`). The contrast is the point: machine while building, alive once built.
- Every card stays interactive after it forms (play, swipe ranges, check in, change days), and those interactions read their timings from the same recipes MOTION.CSS typed.

## Tried and rejected

- Glossy gradients, glass, neon/lime accents: read as generic "AI-generated" design.
- A soft fade-in of the whole card: loses the sense of construction. Parts must appear separately.
- Code panels below a screen while they sit beside cards: inconsistent, and the code gets cropped in video. Keep the code beside the UI for both.
- Random floating decoration around the stage: noise. The blueprint is the decoration.
