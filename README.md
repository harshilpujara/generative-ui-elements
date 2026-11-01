# Generative UI elements

Make any card, panel or full screen **build itself on the page like an AI agent is generating it**. A dotted blueprint is traced from the UI's own parts, filled in as a skeleton, then the real UI is set in its place in hard steps. Optionally, a live agent log and the motion code are typed beside it. You can export the whole formation as an MP4 for your posts.

No dependencies. Works with plain HTML, React, Next.js, Vue and Svelte.

## Install the skill

```
npx skills add harshilpujara/generative-ui-elements
```

Or download this repo and copy [`skills/generative-ui-elements`](./skills/generative-ui-elements) into your project's skills folder (for Claude Code: `.claude/skills/`).

Then ask your agent:

> gen ui the result card

> gen ui texts on the hero card

> gen ui export: give me a 16:9 video of this card forming

## See it first

```
git clone https://github.com/harshilpujara/generative-ui-elements
cd generative-ui-elements/skills/generative-ui-elements
npx serve .
```

Open `demo.html`: Build, Build + texts, Light/Dark, Export 16:9.

## Use it without an agent

Copy `generative-ui.js` and `generative-ui.css` (plus `generative-ui-record.js` for video) into your project:

```js
import { form } from "./generative-ui.js";
await form(document.querySelector(".card"), { mode: "texts" }).finished;
```

Full docs: [SKILL.md](./skills/generative-ui-elements/SKILL.md).

## What's inside

| | |
| --- | --- |
| [`SKILL.md`](./skills/generative-ui-elements/SKILL.md) | Modes, decision rules, commands, install, wiring, API |
| [`01-marking-parts.md`](./skills/generative-ui-elements/01-marking-parts.md) | Telling it which parts to build, and in what order |
| [`02-timeline.md`](./skills/generative-ui-elements/02-timeline.md) | Every phase and timing |
| [`03-generation-texts.md`](./skills/generative-ui-elements/03-generation-texts.md) | The AGENT.LOG and MOTION.CSS panels |
| [`04-recipes.md`](./skills/generative-ui-elements/04-recipes.md) | Making the code on screen the code your UI runs |
| [`05-export.md`](./skills/generative-ui-elements/05-export.md) | Recording the formation as a video |
| [`06-design.md`](./skills/generative-ui-elements/06-design.md) | The visual language behind it |

MIT licensed.
