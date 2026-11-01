# Timeline

All times at `speed: 1`. `speed` divides every value.

| Moment | Time | What happens |
| --- | --- | --- |
| Field | 0 | Grid, guides, corner handles and the size label with its build clock appear. Parts are hidden. |
| Halftone | 0 → 760ms | Accent dots sweep through the frame in marbled bands and thin out. |
| First trace | 560ms | Part 1 starts tracing. Each next part starts `stagger` later. |
| Stagger | `min(80ms, 1500ms / parts)` | So any number of parts fits in about 1.5s. |
| Trace → skeleton | +380ms per part | The rule becomes `#` marks; the box fades back and names itself. |
| Skeleton → set | +240ms per part | The real part replaces it: `steps(3)` opacity, `steps(6)` wipe for text. |
| Surface | 720ms | The element's own background, border and shadow come in (`steps(4)`). |
| Clear | as parts land | Grid, guides, handles and outline fade out in quarter steps with the share of parts set. |
| Hand over | last set + 900ms | Classes and the layer are removed; `finished` resolves. |

A card with 13 parts runs about 2.9s. A screen with 50 parts about 3.2s.

## Why it looks the way it does

- **Hard steps, not fades.** Everything in the construction layer moves in quarter steps and every reveal uses `steps()`. It reads as a machine setting type, not a soft UI transition.
- **Measured, not drawn.** The blueprint is the element's real geometry, so the hand-over has no jump.
- **One signal colour.** The halftone, in-progress bars and `APPLYING` use the accent. Everything else is the text colour at different strengths.

## Tuning

- **Faster or slower:** `speed` only. Below `0.7` it drags; above `1.4` the trace gets too short to read.
- **Busy UI:** mark fewer parts rather than speeding up.
- **Staggered grid:** `delay: index * 260`.
