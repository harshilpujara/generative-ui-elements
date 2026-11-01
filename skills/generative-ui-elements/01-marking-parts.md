# Marking parts

The formation builds whatever it finds in the element, in document order. You can let it detect the parts, or mark them yourself. Marks win: as soon as one `data-part` exists inside the element, only marked elements are built.

## Marked (recommended)

```html
<div class="card">
  <span data-part="text">Thu 14 · 2:00 PM</span>
  <h3 data-part="text">Launch review</h3>
  <div data-part="frame" data-name="map"><!-- canvas, image, chart --></div>
  <svg data-part="svg" data-name="pin">…</svg>
  <button data-part="button">Join</button>
</div>
```

| `data-part` | Traced as | Skeleton | Set |
| --- | --- | --- | --- |
| `text` | a dotted rule through the line, end points | `######` sized to the line | wipes in left to right |
| `frame` | a dashed box with its size | faint box named `<frame>` | steps in |
| `button` | a dashed box with its size | faint box named `<button>` | steps in |
| `svg` | a dashed circle | the circle fades back | steps in |

- `data-name` sets the name shown in AGENT.LOG (otherwise the first 14 characters of the text).
- Mark **leaves and meaningful blocks**, not every wrapper. 8–30 parts reads best on a card, 40–60 on a screen.
- Order is document order. Put the most important part (title, primary chart) early.
- Mark the element that holds the visible thing, not a zero-size wrapper. Parts under 2px are skipped.

## Detected (zero setup)

Without marks the runtime walks the DOM and takes:

- elements whose only content is text → `text`
- `button`, `input`, `select`, `textarea`, `[role=button]` → `button`
- inline `svg` → `svg`
- `img`, `video`, `canvas`, and any element with a background, background image or border (smaller than 60% of the element) → `frame`

Add `data-gu-skip` to leave a subtree out (a decorative layer, a live video).

Detection is good for trying it on existing UI. For something you'll ship or film, mark the parts: you choose the order and the names that show in the log.

## The surface

The element itself (the card) is treated as the surface: its background, border and shadow are hidden until the structure is in (`720ms`), then come in. You don't mark it.

## With components (React, Vue…)

Spread a `data-part` prop onto the DOM node that renders the thing:

```jsx
function Chart(props) {
  return <div data-part={props["data-part"]} data-name={props["data-name"]}>…</div>;
}
```

If a part animates its own `opacity` inline (framer-motion `animate={{ opacity }}`), wrap it: the mark goes on a plain wrapper, the animation inside.
