/**
 * tween-record.js: records one element of the page to a video file, so a
 * formation can be exported as MP4 (or WebM where MP4 can't be encoded).
 *
 * The tab is captured with getDisplayMedia, cropped to the element (Region
 * Capture where available, otherwise by cutting its rectangle out of the
 * whole tab), redrawn onto a canvas at the exact output size and encoded
 * with MediaRecorder. What lands in the file is the animation exactly as
 * the browser rendered it, not a re-creation.
 *
 *   import { form } from "./tween-form.js";
 *   import { exportVideo } from "./tween-record.js";
 *   await exportVideo({
 *     frame: stageEl,                       // a fixed-size frame holding only the UI (see 05-export.md)
 *     size: { w: 1920, h: 1080 },           // output pixels
 *     play: (delay) => form(cardEl, { mode: "texts", delay }).finished,
 *     filename: "card-16x9.mp4",
 *   });
 */

const TYPES = ["video/mp4;codecs=avc1.640034", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** The best container this browser can encode, or null. */
export function pickType() {
  if (typeof MediaRecorder === "undefined") return null;
  const mime = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
  return mime ? { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" } : null;
}

/** True where tab capture and encoding are both available (desktop Chrome, Edge, Safari). */
export const canRecord = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia && !!pickType();

/**
 * Asks to capture this tab and prepares a recording of `el` at out.w × out.h.
 * Returns { start(), stop(): Promise<Blob>, cancel(), type }.
 */
export async function capture(el, out, onEnded = () => {}) {
  const type = pickType();
  if (!type) throw new Error("This browser can't encode video.");
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 60, width: { ideal: 3840 }, height: { ideal: 2160 } },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  });
  const track = stream.getVideoTracks()[0];
  const end = () => stream.getTracks().forEach((t) => t.stop());
  track.addEventListener("ended", onEnded);
  const surface = track.getSettings().displaySurface;
  if (surface && surface !== "browser") {
    end();
    throw new Error("Pick “This tab” so only the frame is recorded.");
  }

  // Sharing can add a bar to the window; let the layout settle before cropping.
  await wait(700);
  let cropped = false;
  if (globalThis.CropTarget && track.cropTo) {
    try {
      await track.cropTo(await CropTarget.fromElement(el));
      cropped = true;
    } catch {
      /* fall back to cutting the rectangle out of the whole tab */
    }
  }

  // Decoded through an off-screen video element: some browsers only play attached media.
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.style.cssText = "position:fixed;left:-99999px;top:0;width:2px;height:2px";
  document.body.appendChild(video);
  video.srcObject = stream;
  video.play().catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = out.w;
  canvas.height = out.h;
  const ctx = canvas.getContext("2d", { alpha: false });
  // A tab only sends frames when it repaints, so a still, blank frame may not have sent one yet.
  // Until it does, paint the frame's own background, which is exactly what it shows.
  const bg = getComputedStyle(el).backgroundColor;
  let raf = 0;
  const draw = () => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw && vh && video.readyState >= 2) {
      if (cropped) ctx.drawImage(video, 0, 0, vw, vh, 0, 0, out.w, out.h);
      else {
        const r = el.getBoundingClientRect();
        const kx = vw / innerWidth;
        const ky = vh / innerHeight;
        ctx.drawImage(video, r.left * kx, r.top * ky, r.width * kx, r.height * ky, 0, 0, out.w, out.h);
      }
    } else {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, out.w, out.h);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();

  const rec = new MediaRecorder(canvas.captureStream(60), { mimeType: type.mime, videoBitsPerSecond: 16_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const cleanup = () => {
    cancelAnimationFrame(raf);
    track.removeEventListener("ended", onEnded);
    end();
    video.remove();
  };
  return {
    type,
    start: () => rec.start(250),
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          cleanup();
          resolve(new Blob(chunks, { type: type.mime.split(";")[0] }));
        };
        rec.stop();
      }),
    cancel() {
      if (rec.state !== "inactive") rec.stop();
      cleanup();
    },
  };
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Records `frame` while `play(lead)` runs: `lead` ms of the blank frame first,
 * the whole formation, then `hold` ms on the finished UI. `play` is called as
 * soon as recording starts and receives `lead` to pass as form()'s `delay`,
 * which hides the element at once, so the video opens on an empty frame. Downloads the file
 * when `filename` is given (the right extension is applied) and returns the Blob.
 * Call it from a click: browsers only allow capture after a user gesture.
 */
export async function exportVideo({ frame, size, play, lead = 500, hold = 1600, filename }) {
  const s = await capture(frame, size);
  try {
    s.start();
    await play(lead);
    await wait(hold);
  } catch (e) {
    s.cancel();
    throw e;
  }
  const blob = await s.stop();
  if (filename) download(blob, filename.replace(/\.(mp4|webm)$/i, "") + "." + s.type.ext);
  return blob;
}
