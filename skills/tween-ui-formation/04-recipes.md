# Recipes: the code on screen is the code the UI runs

The point of MOTION.CSS is that it isn't decoration. Keep each component's motion values in one place, have the component read them, and pass the same object to `form()`.

```js
// recipes.js
export const WEATHER = {
  temperature: { comment: "temperature roll", selector: ".temperature", vars: { "--digit-dur": "560ms", "--digit-ease": "cubic-bezier(0.34, 1.3, 0.64, 1)", "--digit-stagger": "70ms" } },
  icon: { comment: "icon swap", selector: ".condition-icon", vars: { "--icon-swap-dur": "460ms" } },
};
```

```jsx
// the component reads them
const v = WEATHER.temperature.vars;
<motion.span transition={{ duration: parseFloat(v["--digit-dur"]) / 1000, delay: i * parseFloat(v["--digit-stagger"]) / 1000 }} />
```

```js
// the formation types them
form(card, { mode: "texts", title: "weather", recipes: Object.values(WEATHER) });
```

Or, with plain CSS, set them as custom properties and read them in your transitions:

```css
.temperature { --digit-dur: 560ms; transition: transform var(--digit-dur) var(--digit-ease); }
```

## Writing good recipes

- **Name what moves**, not how: `temperature roll`, `avatar fan-out`, `plane on arc`, `sparkline draw`.
- **3–5 recipes per card**, 2–5 values each. A screen can list the recipes of every card in it.
- **Real units.** `ms`, `px`, `deg`, unitless scales, and spring values (`--pill-stiffness: 520`).
- **Custom curves** as `cubic-bezier(...)`: they look great being typed.

## Shape

```ts
type Recipe = { comment: string; selector: string; vars: Record<string, string> };
```
