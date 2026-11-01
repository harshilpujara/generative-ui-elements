---
name: generative-ui-elements
license: MIT (see LICENSE.txt)
description: Make any card, panel or full screen form on the page as if an agent were building it, then hand over to the real UI. The UI is measured from its own DOM, traced part by part over a dotted blueprint (grid, guides, corner handles, size labels, a halftone sweep, dotted rules for text, dashed boxes for frames, buttons and icons), filled in as a skeleton (# marks, <button> slots) and set for real in hard steps. Two modes, build (the blueprint only) and texts (plus a live AGENT.LOG of every part and the MOTION.CSS being typed beside it). Includes a video exporter that records the formation itself to MP4/WebM with no page chrome, for posts and launch videos. One dependency-free runtime for any framework (vanilla, React, Next.js, Vue, Svelte). Use when the user asks for a "UI formation", "blueprint reveal", "build-in animation", "UI being generated", "agent building the UI", "wireframe to UI", "skeleton that turns into the real UI", "code typing beside the UI", "agent log animation", "generative UI reveal", "export the animation as a video", or the commands gen ui, gen ui texts, gen ui export and gen ui preview.
---

# Generative UI Elements

Plays a "this UI is being built" animation over any element, then shows the real thing. Nothing is faked: every outline, text rule and slot is measured from the element, so the blueprint lands exactly where the real parts appear, and the real parts replace it one by one.

Shared at [harshilpujara/generative-ui-elements](https://github.com/harshilpujara/generative-ui-elements). This folder is the whole workflow, packaged so you can run it on your own UI.

## What one formation draws

Over about 2.5–3.5s (scales with the number of parts):

1. **Field.** A dotted grid fills the element's box, dotted guides run past its edges, square handles mark the corners, and a size label reads `300 × 277 t+0.84s` with a running build clock.
2. **Halftone sweep.** Marbled bands of accent-coloured dots sweep through the frame and thin out (0–760ms).
3. **Trace.** Each part is traced in document order: text as a dotted rule with end points, frames and buttons as dashed boxes with their size, icons as dashed circles.
4. **Skeleton.** Each traced part fills in: text slots become `######`, boxes fade back and name themselves (`<button>`, `<frame>`).
5. **Set.** The real part replaces its skeleton in a few hard steps (text wipes in left to right). The element's own background and shadow come in once the structure is there.
6. **Clear.** The blueprint fades out in steps as the last parts land, then hands over.

In **texts** mode, two panels run alongside:

- **AGENT.LOG // PARTS 05/13** (left): one row per part, `0x05f1  frame  214,020  66×22  [####..]`, turning `[  ok  ]` when the part is set.
- **MOTION.CSS // 02 RECIPES · 7/10 TOKENS** (right): the motion recipes typed out line by line with a caret, ending with a status line, `158 TOK/S · 11 LN · 3 RECIPES · APPLYING`.

## Modes

| Mode | What you get | Use for | Reference |
| --- | --- | --- | --- |
| **`build`** (default) | Blueprint, skeleton, set. | AI results arriving, empty states filling in, a grid of cards, any place without room around the element. | [02-timeline.md](./02-timeline.md) |
| **`texts`** | The same, plus AGENT.LOG and MOTION.CSS beside or below it. | Showcases, landing heroes, product videos, the "built by an agent" story. Needs empty space beside the element: about 390px on each side for both panels, 390px on the right for the code alone. | [03-generation-texts.md](./03-generation-texts.md) |

Where the texts go (`texts` option): `"auto"` (default; both sides if there's room, else right, else below), `"side"`, `"right"`, `"below"`.

## Decision rules

- **A card or panel** → `build`. **A whole screen** → `build` with `labels: false` (size labels on every box get noisy at screen scale).
- **A launch page, demo or video** → `texts`, played on scroll into view or on demand.
- **Several cards at once** → `build` on each with `delay: i * 260`. The texts only fit around one element at a time.
- **The user wants the code beside screens and cards alike** → `texts` for both, with the screen scaled so 390px is free on each side (see [05-export.md](./05-export.md) for fitting).
- **Small inline UI** (a badge, a single button, anything under ~120px) or **UI that appears often** (route changes, list rows) → don't. A formation is a moment, not a loading state.
- **Unsure** → `build`. Ask before adding the texts.

## Commands

### gen ui

Trigger phrases: `gen ui`, "make this build like an agent made it", "add the formation", "blueprint reveal on this".

1. Find the element: the one named, the component in the open file, or ask.
2. Pick the mode (default `build`) and the trigger: on mount, when data arrives, on scroll into view, or on a button.
3. Propose it in one line, e.g. "I'd play **build** on `<ResultCard>` when the response arrives, with `data-part` marks on its title, chart and buttons. OK?"
4. On confirmation: install (below), mark the parts ([01-marking-parts.md](./01-marking-parts.md)), wire it. Keep the diff small.

### gen ui texts

Same as `gen ui` with `mode: "texts"`. Pass the component's real motion values as `recipes` ([04-recipes.md](./04-recipes.md)) so the code on screen is the code the UI runs. Mention the texts need empty space beside the element.

### gen ui export

Add a video export of the formation: a fixed-size frame holding only the UI, an aspect ratio (16:9, 1:1, 4:5, 9:16), a theme, then `exportVideo()`. See [05-export.md](./05-export.md).

### gen ui preview

Serve this folder (`npx serve .` or `python3 -m http.server`) and open [`demo.html`](./demo.html): two cards (one marked with `data-part`, one detected automatically), Build, Build + texts, a light/dark switch and Export 16:9.

## Install

1. Copy [`generative-ui.js`](./generative-ui.js) and [`generative-ui.css`](./generative-ui.css) into the project (e.g. `src/lib/`). Add [`generative-ui-record.js`](./generative-ui-record.js) for video export. No dependencies.
2. Import the CSS once, globally.
3. Optional: load DM Mono for the blueprint labels (`--gu-mono` falls back to the system monospace).

Don't rewrite the timings. They're tuned together (trace → skeleton → set, the stagger, the halftone, the surface moment). Use `speed` to make it faster or slower.

## Wiring

Call `form` **after the element has rendered at its final size**, with fonts loaded. It hides the element's parts immediately (even during `delay`), so nothing flashes.

**Vanilla**

```js
import { form } from "./generative-ui.js";
await document.fonts.ready;
await form(document.querySelector("#result"), { mode: "texts" }).finished;
```

**Attribute API** (plays when scrolled into view)

```html
<section data-gu-form="texts" data-gu-delay="200">…</section>
<script type="module">
  import { auto } from "./generative-ui.js";
  auto();
</script>
```

**React / Next.js** (client component)

```jsx
"use client";
import { useLayoutEffect, useRef } from "react";
import { form } from "@/lib/generative-ui.js";

export function FormedCard({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const run = form(ref.current, { mode: "build" });
    return () => run.cancel();
  }, [data]); // forms again when new data arrives
  return (
    <div ref={ref} className="card">
      <h3 data-part="text">{data.title}</h3>
      <Chart data-part="frame" data-name="chart" />
      <button data-part="button">Open</button>
    </div>
  );
}
```

**Vue**

```js
onMounted(() => { run = form(el.value, { mode: "build" }); });
onBeforeUnmount(() => run?.cancel());
```

**Svelte**

```svelte
<script>
  import { onMount } from "svelte";
  import { form } from "$lib/generative-ui.js";
  let el;
  onMount(() => form(el).cancel);
</script>
<div bind:this={el} class="card">…</div>
```

## API

`form(element, options) → { finished, skip(), cancel() }`

| Option | Default | |
| --- | --- | --- |
| `mode` | `"build"` | `"build"` or `"texts"` |
| `texts` | `"auto"` | `"auto"`, `"side"`, `"right"`, `"below"` |
| `recipes` | the formation's own timings | `[{ comment, selector, vars: { "--name": "value" } }]`, typed in MOTION.CSS |
| `title` | `"ui"` | header comment of the motion code |
| `speed` | `1` | `0.75` slower, `1.25` faster; every phase scales together |
| `delay` | `0` | ms before starting; the element stays hidden meanwhile |
| `labels` | `true` | size labels on boxes |
| `keepTexts` | `false` | leave the blueprint layer and texts on screen after the build |

`finished` resolves when the real UI is fully in. `skip()` jumps to the end (wire it to a click on the element). `cancel()` stops and shows the real UI.

## Theming

The blueprint is drawn in the text colour of wherever the element sits, so it works on dark and light pages as is. Retune with `--gu-accent` (halftone, in-progress bars, `APPLYING`), `--gu-ok`, `--gu-code` and `--gu-mono` on any ancestor. A light/dark switch only has to flip your own tokens; see [06-design.md](./06-design.md) for the full visual language.

## Gotchas

- **framer-motion / inline opacity.** If a part animates `opacity` with framer-motion (or any inline style), that inline value beats the hiding CSS and the part shows on the empty frame. Put `data-part` on a plain wrapper around the animated element.
- **Scaled UI.** Measuring works under `transform: scale()` (screens fitted into a viewport): positions are divided by the element's own scale.
- **Positioning.** The blueprint layer is placed beside the element inside its positioned parent so guides can run past the edges. Without a positioned parent it goes inside the element instead, and `overflow: hidden` will clip the guides.
- **Reduced motion.** With `prefers-reduced-motion: reduce` the drawing is skipped and the element fades in over 200ms.
