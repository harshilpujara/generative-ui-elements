# Generative UI Elements

A skill that makes any element or screen **build itself like an AI agent is generating it**. A dotted blueprint is traced from the UI's own parts, filled in as a skeleton, then the real UI is set in its place, with the agent log and motion code written beside it.

## Use it

1. Add the skill:

   ```
   npx skills add harshilpujara/generative-ui-elements
   ```

   Or copy [`skills/generative-ui-elements`](./skills/generative-ui-elements) into your project's `.claude/skills/` folder.

2. In your agent, type `/generative-ui-elements` and say:

   > Give me the generative UI effect on the pricing card.

That's it. It works with HTML, React, Next.js, Vue and Svelte, with no dependencies.

## Preview

```
git clone https://github.com/harshilpujara/generative-ui-elements
cd generative-ui-elements/skills/generative-ui-elements
npx serve .
```

Open `demo.html`.

MIT licensed.
