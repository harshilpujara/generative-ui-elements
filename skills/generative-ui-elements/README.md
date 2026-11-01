# Generative UI Elements

Make any card or screen build itself on the page like an agent is generating it: a dotted blueprint traced from the UI's own parts, a skeleton, then the real UI set in hard steps, with an optional live agent log and the motion code typed beside it. Export the whole formation as an MP4.

## Install

**One command** (Claude Code, Cursor, Codex and other agents that read skills):

```
npx skills add harshilpujara/generative-ui-elements
```

**Or copy it:** put this folder in your project's skills directory (for Claude Code: `.claude/skills/generative-ui-elements/`), then ask:

> gen ui the result card

**Without an agent:** copy `generative-ui.js`, `generative-ui.css` (and `generative-ui-record.js` for video) into your project and follow `SKILL.md` → Wiring.

## Try it

```
cd generative-ui-elements
npx serve .        # or: python3 -m http.server
```

Open `demo.html`: Build, Build + texts, Light/Dark, Export 16:9.

## Files

| File | |
| --- | --- |
| `SKILL.md` | The skill: modes, decision rules, commands, install, wiring, API |
| `01-marking-parts.md` … `06-design.md` | References: parts, timeline, generation texts, recipes, video export, design language |
| `generative-ui.js` / `.css` | The runtime, no dependencies |
| `generative-ui-record.js` | Video export (tab capture → MP4/WebM) |
| `demo.html` | Working demo |

MIT licensed.
