---
name: generative-ui-elements
license: MIT (see LICENSE.txt)
description: Adds the generative UI effect to any element or screen. The element builds itself on the page as if an AI agent were generating it. A dotted blueprint is measured from its own parts and traced piece by piece, filled in as a skeleton, then the real UI is set in its place. An agent log and the motion code are written beside it when there's room. One dependency-free script for any stack (HTML, React, Next.js, Vue, Svelte). Use when the user asks to "add the generative UI effect", "make this look AI-generated", "make this card/screen build itself", "blueprint reveal", "agent building the UI", or names an element and asks for this effect.
---

# Generative UI Elements

The user names an element (a card, a panel, a section, a whole screen) and you give it the generative UI effect. When it appears, it builds itself:

1. **Blueprint.** A dot grid fills the element's box, with guides past its edges, corner handles, a live size label (`320 × 412 t+0.84s`) and a quick halftone sweep in the accent colour.
2. **Trace.** Every part is traced where it really sits: text as a dotted line, boxes and buttons as dashed outlines with their size, icons as dashed circles.
3. **Skeleton.** Each traced part fills in: text becomes `######`, boxes name themselves (`<button>`).
4. **Set.** The real part replaces its skeleton in a few hard steps, then the element's own background comes in and the blueprint clears.

If the page has room beside the element, two panels run alongside it. **AGENT.LOG** on the left lists every part as it's built. **MOTION.CSS** on the right types out the motion values. With no room they are skipped, so the effect never breaks a layout.

Nothing is faked: everything is measured from the element itself, so the hand-over to the real UI has no jump. One build takes about 2.5–3.5s.

## What to do when invoked

1. **Find the element.** Use the one the user named or pointed at, or the component in the open file. If it's ambiguous, ask which one in a single short question.
2. **Copy the files.** Put `generative-ui.js` and `generative-ui.css` from this folder into the project (e.g. `src/lib/` or `public/`). Import the CSS once, globally.
3. **Mark the parts** (recommended). Add `data-part` to the meaningful pieces inside the element, in the order they should build:
   - `data-part="text"` for headings, labels and numbers
   - `data-part="frame"` for images, charts, maps and blocks
   - `data-part="button"` for buttons and inputs
   - `data-part="svg"` for icons

   Aim for 8–30 parts on a card and 40–60 on a screen. Without marks, the script detects text, filled boxes, buttons and icons by itself, which is fine for a quick try.
4. **Play it** once the element has rendered at its final size, with fonts loaded. Play on mount, when data arrives, or on scroll into view, whatever fits the request.
5. **Tell the user** in one line where it plays and how to replay it.

Keep the diff small. Don't restyle the element, and don't change the script's timings (use `speed` instead).

## Wiring

**HTML / vanilla**

```html
<link rel="stylesheet" href="/generative-ui.css" />
<script type="module">
  import { generateUI } from "/generative-ui.js";
  await document.fonts.ready;
  generateUI(document.querySelector("#card"));
</script>
```

**On scroll into view, no JS per element**

```html
<div class="card" data-generative-ui>…</div>
<script type="module">
  import { auto } from "/generative-ui.js";
  auto();
</script>
```

**React / Next.js**

```jsx
"use client";
import { useLayoutEffect, useRef } from "react";
import { generateUI } from "@/lib/generative-ui.js";

export function Card({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const run = generateUI(ref.current);
    return () => run.cancel();
  }, [data]); // plays again when new data arrives
  return (
    <div ref={ref} className="card">
      <h3 data-part="text">{data.title}</h3>
      <img data-part="frame" src={data.cover} alt="" />
      <button data-part="button">Open</button>
    </div>
  );
}
```

**Vue:** call `generateUI(el.value)` in `onMounted` and `run.cancel()` in `onBeforeUnmount`. **Svelte:** `onMount(() => generateUI(el).cancel)`.

## Options

`generateUI(element, options)` returns `{ finished, skip(), cancel() }`. Every option is optional.

| Option | Default | |
| --- | --- | --- |
| `code` | `true` | Show the agent log and motion code where they fit. `false` to never show them. |
| `recipes` | the effect's own timings | `[{ comment, selector, vars: { "--dur": "320ms" } }]`. Pass the element's real motion values so the code on screen is true. |
| `speed` | `1` | `0.75` slower, `1.25` faster. |
| `delay` | `0` | ms before starting. Use `i * 260` to stagger several elements. |
| `labels` | `true` | Size labels on boxes. Set `false` for whole screens. |

## Good to know

- **Several elements at once:** stagger them with `delay`. The side panels only fit around one element at a time, and they skip themselves when there's no room.
- **Theme:** it draws in the text colour of wherever the element sits, so it works on dark and light pages as is. Change the accent with `--gu-accent`.
- **Inline animations:** if a part animates its own `opacity` (framer-motion `animate={{ opacity }}`), put `data-part` on a plain wrapper around it instead.
- **Scaled screens** (`transform: scale()`) are measured correctly.
- **Reduced motion:** the drawing is skipped and the element simply fades in.
- **Video:** to export the effect as an MP4, `generative-ui-record.js` records an element while it builds. `exportVideo({ frame, size: { w: 1920, h: 1080 }, play: (delay) => generateUI(card, { delay }).finished })`, called from a click.

## Preview

Serve this folder (`npx serve .`) and open `demo.html`.
