# Export: record the formation as a video

`tween-record.js` records the formation exactly as the browser renders it, cropped to a frame that holds only the UI, at a fixed output size. No screen-recording app, no editor chrome, no cursor.

## 1. Build an export frame

A dedicated layer, separate from your editor or page UI:

- **Fixed design size per ratio**, scaled to fit the window with a CSS transform. Write the file at 1.5× the design size:

  | Ratio | Design size | File |
  | --- | --- | --- |
  | 16:9 | 1280 × 720 | 1920 × 1080 |
  | 1:1 | 720 × 720 | 1080 × 1080 |
  | 4:5 | 720 × 900 | 1080 × 1350 |
  | 9:16 | 720 × 1280 | 1080 × 1920 |

- **Its own theme**, independent of the page: put `data-theme="dark"` or `"light"` on the frame and give it `background: var(--bg)`.
- **Padding** of about 6% of the short side. Fit the UI (plus 386px of room on each side when the texts are on) into what's left, scaling it up to 1.6× for small cards.
- **Only the UI inside.** While recording, hide your controls and let the frame fill the window (bigger on screen means sharper in the file).

```html
<div class="export-frame" data-theme="dark" style="width:1280px;height:720px;transform:scale(var(--k));background:var(--bg)">
  <div class="card">…</div>
</div>
```

## 2. Record

```js
import { form } from "./tween-form.js";
import { canRecord, exportVideo } from "./tween-record.js";

button.disabled = !canRecord();
button.onclick = () =>
  exportVideo({
    frame: document.querySelector(".export-frame"),
    size: { w: 1920, h: 1080 },
    play: (delay) => form(card, { mode: "texts", delay }).finished,
    lead: 500, // blank frame before the formation
    hold: 1600, // finished UI held at the end
    filename: "card-16x9-dark",
  });
```

The browser asks to share the tab: pick **This tab**. The file downloads when the hold ends: `.mp4` (H.264) where the browser can encode it, `.webm` otherwise.

Several cards: start them all inside `play` with a stagger and return `Promise.all` of their `finished`. Texts only make sense around one element, so record multi-card videos in `build` mode.

## How it works

1. `getDisplayMedia({ preferCurrentTab: true })` captures this tab.
2. `CropTarget.fromElement(frame)` + `track.cropTo()` crops to the frame (Chrome, Edge). Elsewhere the frame's rectangle is cut out of the whole tab.
3. Each frame is drawn onto a canvas at exactly `size`, and `canvas.captureStream(60)` feeds `MediaRecorder` at 16 Mbps.

## Gotchas (all hit while building this)

- **A still page sends no frames.** Tab capture only emits frames when the page repaints, so a blank frame at the start may never arrive. The recorder paints the frame's own background colour until the first real frame shows up. Keep the frame's background a solid colour.
- **Detached video elements may never play.** The capture is decoded through an off-screen `<video>` attached to the page.
- **Let the layout settle.** The "sharing this tab" bar can resize the window; the recorder waits 700ms before cropping.
- **Hide before the first recorded frame.** `form()` hides its parts the moment it's called, which is why `play` receives the lead as a `delay` instead of being called after it.
- **Checking files with ffmpeg:** `ffmpeg -ss` seeking is unreliable on MediaRecorder output and returns the first frame. Select frames by index instead: `ffmpeg -i out.mp4 -vf "select='eq(n\,60)'" -frames:v 1 f.png`.
- **Support.** Desktop Chrome and Edge (cropped, MP4), Safari (whole-tab cut, MP4), Firefox (whole-tab cut, WebM). Requires a user gesture; not available on mobile.
