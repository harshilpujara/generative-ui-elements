# Generation texts

`mode: "texts"` adds two panels to the formation. They run on the same clock as the blueprint, so the log and the code finish exactly when the UI does.

## AGENT.LOG (left)

```
AGENT.LOG // PARTS 05/13
0x0535  frame       000,000  300×259  [  ok  ]
0x05f1  san fra…    020,020  91×21    [  ok  ]
0x430a  svg         240,020  40×40    [####..]
```

One row per part as it starts tracing: a stable pseudo address, the part (its name for text, its type otherwise), its x,y in the element, its size, and a 6-step progress bar that turns `[  ok  ]` when the part is set. Only the newest rows are shown (as many as fit the element's height).

## MOTION.CSS (right)

```
MOTION.CSS // 01 RECIPES · 5/10 TOKENS
/* weather / motion */
/* recipe / temperature roll */
.temperature {
  --digit-dur: 560ms;
  --digit-ease: cubic-bezier(0.34, 1.3, 0.64, 1);
}
158 TOK/S · 11 LN · 3 RECIPES · WRITING
```

The recipes are typed character by character with a blinking caret, between 250ms and the end of the build. The status line reads `READING` → `WRITING` → `APPLYING`. Values are coloured with `--gu-code`, comments are faint.

Pass `recipes` so these are the values your UI really uses ([04-recipes.md](./04-recipes.md)). Without them the panel types the formation's own timings, which is still true, just less interesting.

## Placement

| `texts` | Log | Code |
| --- | --- | --- |
| `"side"` | 56px left of the element, 300px wide | 56px right, 330px wide |
| `"right"` | – | 56px right |
| `"below"` | – | 28px below, trimmed to the newest rows |
| `"auto"` | side if there's ~390px free on both sides of the viewport, else right, else below | |

Keep both panels visible for **cards and screens alike**: scale a screen down so 390px is free on each side rather than dropping the panels or pushing the code below. Consistency between the two is what makes the effect read as one system.

After the build the panels fade with the blueprint. Pass `keepTexts: true` to leave them up.
