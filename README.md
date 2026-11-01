# Generative UI elements

Make any card, panel or full screen **build itself on the page like an AI agent is generating it**. A dotted blueprint is traced from the UI's own parts, filled in as a skeleton, then the real UI is set in its place in hard steps. Optionally, a live agent log and the motion code are typed beside it. You can export the whole formation as an MP4 for your posts.

No dependencies. Works with plain HTML, React, Next.js, Vue and Svelte.

## Install the skill

```
npx skills add harshilpujara/generative-ui-elements
```

Or download this repo and copy [`skills/tween-ui-formation`](./skills/tween-ui-formation) into your project's skills folder (for Claude Code: `.claude/skills/`).

Then ask your agent:

> tween form the result card

> tween form texts on the hero card

> tween form export: give me a 16:9 video of this card forming

## See it first

```
git clone https://github.com/harshilpujara/generative-ui-elements
cd generative-ui-elements/skills/tween-ui-formation
npx serve .
```

Open `demo.html`: Build, Build + texts, Light/Dark, Export 16:9.

## Use it without an agent

Copy `tween-form.js` and `tween-form.css` (plus `tween-record.js` for video) into your project:

```js
import { form } from "./tween-form.js";
await form(document.querySelector(".card"), { mode: "texts" }).finished;
```

Full docs: [SKILL.md](./skills/tween-ui-formation/SKILL.md).

## What's inside

| | |
| --- | --- |
| [`SKILL.md`](./skills/tween-ui-formation/SKILL.md) | Modes, decision rules, commands, install, wiring, API |
| [`01-marking-parts.md`](./skills/tween-ui-formation/01-marking-parts.md) | Telling it which parts to build, and in what order |
| [`02-timeline.md`](./skills/tween-ui-formation/02-timeline.md) | Every phase and timing |
| [`03-generation-texts.md`](./skills/tween-ui-formation/03-generation-texts.md) | The AGENT.LOG and MOTION.CSS panels |
| [`04-recipes.md`](./skills/tween-ui-formation/04-recipes.md) | Making the code on screen the code your UI runs |
| [`05-export.md`](./skills/tween-ui-formation/05-export.md) | Recording the formation as a video |
| [`06-design.md`](./skills/tween-ui-formation/06-design.md) | The visual language behind it |

MIT licensed.
