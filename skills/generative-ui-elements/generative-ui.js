/**
 * generative-ui.js: plays a "UI forming from its blueprint" animation over any
 * element, then hands over to the real UI. No dependencies, any framework.
 *
 *   import { generateUI } from "./generative-ui.js";
 *   await generateUI(card).finished;
 *
 * The drawing is measured from the element itself: every part is traced
 * where the real one will appear, then the real one is set in its place.
 */

/* Timings (ms at speed 1). Tuned together: change `speed`, not these. */
const START = 560; // first part starts tracing
const TO_FILL = 380; // trace → skeleton
const TO_REVEAL = 240; // skeleton → real element
const SURFACE_AT = 720; // the element's own background comes in
const DITHER_MS = 760; // halftone sweep before the structure
const TAIL = 900; // hold after the last part, then hand over
const MAX_STEP = 80; // stagger between parts, at most
const SPREAD = 1500; // the whole stagger fits in this

const PART_TYPES = ["text", "frame", "button", "svg"];
const rand = (s) => {
  const x = Math.sin(s * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
const pad = (n, k) => String(Math.max(0, Math.round(n))).padStart(k, "0");
const clamp = (x) => Math.min(1, Math.max(0, x));
// The construction layer fades in hard steps, never smoothly.
const step = (v) => Math.round(clamp(v) * 4) / 4;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const el = (cls, parent, tag = "div") => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  parent?.appendChild(n);
  return n;
};

/* ------------------------------------------------------------------ parts */

/**
 * Finds the parts to build. Elements marked `data-part="text|frame|button|svg"`
 * win; without any marks, parts are detected from the DOM: text lines,
 * boxes with a fill or border, controls and inline icons.
 */
function findParts(root) {
  const marked = [...root.querySelectorAll("[data-part]")];
  if (marked.length) return marked.map((n) => ({ n, type: PART_TYPES.includes(n.dataset.part) ? n.dataset.part : "frame" }));

  const rb = root.getBoundingClientRect();
  const big = rb.width * rb.height * 0.6;
  const out = [];
  const walk = (n) => {
    for (const c of n.children) {
      if (c.closest("[data-gu-skip]") || c.classList.contains("gu-layer")) continue;
      const r = c.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const tag = c.tagName.toLowerCase();
      if (tag === "svg") {
        out.push({ n: c, type: "svg" });
        continue;
      }
      if (["button", "input", "select", "textarea"].includes(tag) || c.getAttribute("role") === "button") {
        out.push({ n: c, type: "button" });
        continue;
      }
      if (["img", "video", "canvas"].includes(tag)) {
        out.push({ n: c, type: "frame" });
        continue;
      }
      const cs = getComputedStyle(c);
      const ownText = [...c.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim());
      const boxy = (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || cs.backgroundImage !== "none" || parseFloat(cs.borderTopWidth) > 0;
      if (ownText && !c.children.length) {
        out.push({ n: c, type: "text" });
        continue;
      }
      if (boxy && r.width * r.height < big) out.push({ n: c, type: "frame" });
      walk(c);
    }
  };
  walk(root);
  return out;
}

function measure(root) {
  const box = root.getBoundingClientRect();
  // The element may sit under a scale transform; measure in its own coordinates.
  const sx = box.width / root.offsetWidth || 1;
  const sy = box.height / root.offsetHeight || 1;
  const parts = [];
  for (const { n, type } of findParts(root)) {
    const r = n.getBoundingClientRect();
    const p = {
      n,
      type,
      name: n.dataset.name ?? (n.textContent ?? "").trim().toLowerCase().slice(0, 14),
      x: (r.left - box.left) / sx,
      y: (r.top - box.top) / sy,
      w: r.width / sx,
      h: r.height / sy,
    };
    if (p.w >= 2 && p.h >= 2) parts.push(p);
  }
  return { w: root.offsetWidth, h: root.offsetHeight, parts };
}

/* ---------------------------------------------------------------- recipes */

/**
 * The motion code typed beside the build. Pass your own recipes so the panel
 * shows the values your UI actually runs; otherwise it shows the formation's own.
 */
function recipeLines(recipes, title, timing) {
  const list = recipes?.length
    ? recipes
    : [
        { comment: "formation / scan", selector: "[data-part]", vars: { "--scan-stagger": `${Math.round(timing.step)}ms`, "--scan-to-fill": `${timing.fill}ms`, "--fill-to-reveal": `${timing.reveal}ms` } },
        { comment: "formation / reveal", selector: "[data-part].on", vars: { "--reveal-steps": "steps(6, end)", "--surface-at": `${timing.surface}ms` } },
      ];
  const lines = [`/* ${String(title || "ui").toLowerCase()} / motion */`];
  for (const r of list) {
    lines.push(`/* recipe / ${r.comment} */`, `${r.selector} {`);
    for (const [k, v] of Object.entries(r.vars)) lines.push(`  ${k}: ${v};`);
    lines.push("}");
  }
  return lines;
}

const codeLine = (l) => {
  if (l.startsWith("/*")) return `<div class="gu-c-note">${esc(l)}</div>`;
  const i = l.indexOf(":");
  if (i > 0 && l.startsWith("  ")) return `<div>${esc(l.slice(0, i + 1))}<span class="gu-c-val">${esc(l.slice(i + 1))}</span></div>`;
  return `<div>${esc(l)}</div>`;
};

/* ------------------------------------------------------------ generateUI */

// Effects started and not yet finished. The log and code only fit around one
// element, so they show only when a single effect is playing.
let playing = 0;

/**
 * Plays the generative UI effect over `target`: the blueprint, the skeleton,
 * then the real UI. When there is room beside the element, the agent log and
 * the motion code are written alongside it.
 *
 * options (all optional):
 *   code     true (default): show the log and code where they fit; false: never
 *   recipes  [{ comment, selector, vars: { "--name": "value" } }] typed as the motion code
 *   title    name in the motion code header
 *   speed    1 = default; 0.75 slower, 1.25 faster
 *   delay    ms before starting (the element stays hidden meanwhile)
 *   labels   size labels on boxes (default true; false for whole screens)
 *
 * Returns { finished: Promise, skip(), cancel() }.
 */
export function generateUI(target, options = {}) {
  const o = { code: true, speed: 1, delay: 0, labels: true, ...options };
  const k = 1 / (o.speed || 1);
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let resolve;
  const finished = new Promise((r) => (resolve = r));
  let raf = 0;
  let timer = 0;
  let t0 = 0;
  let layer = null;
  let ended = false;
  const prevPos = target.style.position;

  playing++;
  // Hide straight away, even during the delay, so the page never flashes the finished UI.
  target.classList.add("gu-root", "gu-building");

  const cleanup = () => {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    target.classList.remove("gu-building", "gu-surfaced", "gu-root");
    target.querySelectorAll("[data-gu-part]").forEach((n) => {
      n.classList.remove("gu-on");
      delete n.dataset.guPart;
    });
  };
  const finish = () => {
    if (ended) return;
    ended = true;
    playing--;
    cleanup();
    if (layer) {
      const l = layer;
      l.style.opacity = "0";
      setTimeout(() => {
        l.remove();
        target.style.position = prevPos;
      }, 220);
    } else if (!layer) target.style.position = prevPos;
    resolve();
  };

  const start = () => {
    if (ended) return;
    if (reduced) {
      target.classList.remove("gu-building");
      target.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return finish();
    }
    const m = measure(target);
    const n = m.parts.length;
    m.parts.forEach((p) => (p.n.dataset.guPart = p.type));
    const stagger = Math.min(MAX_STEP, SPREAD / Math.max(1, n)) * k;
    const times = m.parts.map((_, i) => {
      const scan = START * k + i * stagger;
      return { scan, fill: scan + TO_FILL * k, reveal: scan + (TO_FILL + TO_REVEAL) * k };
    });
    const total = n ? times[n - 1].reveal + TAIL * k : 1200 * k;

    /* The layer sits beside the element, at its exact box, so guides can run past its edges. */
    layer = el("gu-layer");
    layer.setAttribute("aria-hidden", "true");
    Object.assign(layer.style, { left: `${target.offsetLeft}px`, top: `${target.offsetTop}px`, width: `${m.w}px`, height: `${m.h}px` });
    // The parent must contain an absolutely positioned layer at the element's offsets.
    target.after(layer);
    const op = target.offsetParent;
    if (!op || op !== layer.offsetParent || op === document.body || getComputedStyle(op).position === "static") {
      // The element itself is the positioning parent fallback.
      if (getComputedStyle(target).position === "static") target.style.position = "relative";
      Object.assign(layer.style, { left: "0px", top: "0px" });
      target.appendChild(layer);
    }
    const cs = getComputedStyle(target);
    const radius = cs.borderTopLeftRadius || "0px";
    // Handles sit on the page background colour.
    layer.style.setProperty("--gu-handle-bg", getComputedStyle(document.body).backgroundColor || "Canvas");

    const guides = [0, m.h].map((y) => Object.assign(el("gu-guide-h", layer).style, { top: `${y}px` }));
    guides.push(...[0, m.w].map((x) => Object.assign(el("gu-guide-v", layer).style, { left: `${x}px` })));
    const grid = el("gu-grid", layer);
    grid.style.borderRadius = radius;
    const dither = el("gu-abs", layer, "canvas");
    dither.width = Math.round(m.w);
    dither.height = Math.round(m.h);
    Object.assign(dither.style, { left: "0", top: "0", width: `${m.w}px`, height: `${m.h}px` });
    const dctx = dither.getContext("2d");
    const accent = getComputedStyle(layer).getPropertyValue("--gu-accent").trim() || "#ff5a1f";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", m.w);
    svg.setAttribute("height", m.h);
    Object.assign(svg.style, { position: "absolute", inset: "0", overflow: "visible" });
    svg.innerHTML = `<rect x="0.5" y="0.5" width="${m.w - 1}" height="${m.h - 1}" rx="${parseFloat(radius) || 0}" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-dasharray="2 4"/>`;
    layer.appendChild(svg);
    const handles = [
      [0, 0],
      [m.w, 0],
      [0, m.h],
      [m.w, m.h],
    ].map(([x, y]) => Object.assign(el("gu-handle", layer).style, { left: `${x}px`, top: `${y}px` }));
    const size = el("gu-size", layer);

    /* One pair of nodes per part: the trace, then the skeleton. */
    const contains = (a, c) => a !== c && c.type !== "text" && c.x >= a.x - 1 && c.y >= a.y - 1 && c.x + c.w <= a.x + a.w + 1 && c.y + c.h <= a.y + a.h + 1;
    const nodes = m.parts.map((p) => {
      if (p.type === "text") {
        const rule = el("gu-rule", layer);
        Object.assign(rule.style, { left: `${p.x}px`, top: `${p.y + p.h / 2 - 1}px`, width: `${p.w}px`, display: "none" });
        const fs = Math.max(8, Math.min(14, p.h * 0.62));
        const hash = el("gu-hash", layer);
        hash.textContent = "#".repeat(Math.max(2, Math.floor(p.w / (fs * 0.62))));
        Object.assign(hash.style, { left: `${p.x}px`, top: `${p.y + (p.h - fs) / 2}px`, width: `${p.w}px`, fontSize: `${fs}px`, display: "none" });
        return { a: rule, b: hash };
      }
      const box = el(`gu-box${p.type === "svg" ? " gu-round" : ""}`, layer);
      Object.assign(box.style, { left: `${p.x - 2}px`, top: `${p.y - 2}px`, width: `${p.w + 4}px`, height: `${p.h + 4}px`, display: "none" });
      if (o.labels && p.type !== "svg" && p.w > 44 && !m.parts.some((q) => contains(p, q))) el("", box, "b").textContent = `${Math.round(p.w)} × ${Math.round(p.h)}`;
      const slot = p.h > 18 && p.w > 40 ? el("", null, "em") : null;
      if (slot) slot.textContent = `<${p.type}>`;
      return { a: box, b: box, slot };
    });

    /* Generation texts. */
    let log = null;
    let code = null;
    let lines = [];
    const rows = Math.max(6, Math.floor(m.h / 24) - 2);
    // The log goes left and the code right, only where the page has room for them.
    const r = target.getBoundingClientRect();
    const where = !o.code || playing > 1 ? null : innerWidth - r.right >= 400 && r.left >= 370 ? "side" : innerWidth - r.right >= 400 ? "right" : null;
    if (where) {
      if (where === "side") {
        log = el("gu-panel gu-log", layer);
        log.style.right = "calc(100% + 56px)";
      }
      code = el("gu-panel gu-css", layer);
      code.style.left = "calc(100% + 56px)";
      lines = recipeLines(o.recipes, o.title, { step: stagger, fill: Math.round(TO_FILL * k), reveal: Math.round(TO_REVEAL * k), surface: Math.round(SURFACE_AT * k) });
    }
    const chars = lines.reduce((a, l) => a + l.length + 1, 0);
    let lastTyped = -1;

    const on = new Set();
    t0 = performance.now();

    const frame = (now) => {
      const t = now - t0;
      if (t >= SURFACE_AT * k) target.classList.add("gu-surfaced");
      let revealed = 0;
      times.forEach((tm, i) => {
        if (t >= tm.reveal) {
          revealed++;
          if (!on.has(i)) {
            on.add(i);
            m.parts[i].n.classList.add("gu-on");
          }
        }
        const nd = nodes[i];
        const live = t >= tm.scan && t < tm.reveal;
        const filling = t >= tm.fill;
        if (nd.a === nd.b) {
          nd.a.style.display = live ? "" : "none";
          nd.a.classList.toggle("gu-fill", filling);
          if (nd.slot && filling && !nd.slot.parentNode) nd.a.appendChild(nd.slot);
        } else {
          nd.a.style.display = live && !filling ? "" : "none";
          nd.b.style.display = live && filling ? "" : "none";
        }
      });

      const frac = n ? revealed / n : 1;
      guides.forEach((g) => (g.opacity = step(1 - frac)));
      handles.forEach((h) => (h.opacity = step(1 - frac)));
      grid.style.opacity = t < SURFACE_AT * k ? 1 : step(1 - frac * 1.2);
      svg.style.opacity = step(1 - frac * 0.85);
      size.style.opacity = step(1 - frac * 0.8);
      size.innerHTML = `${Math.round(m.w)} × ${Math.round(m.h)} <i>t+${(t / 1000).toFixed(2)}s</i>`;

      dctx.clearRect(0, 0, dither.width, dither.height);
      if (t < DITHER_MS * k) {
        const q = t / (DITHER_MS * k);
        dctx.fillStyle = accent;
        for (let y = 0; y < m.h; y += 6)
          for (let x = 0; x < m.w; x += 6) {
            // Layered sines give marbled bands; q sweeps them through and thins them out.
            const v = Math.sin(x * 0.035 + y * 0.02 + q * 7) + Math.sin(y * 0.05 - x * 0.012 + q * 4) * 0.8 + Math.sin((x + y) * 0.018 - q * 5) * 0.6;
            if (Math.abs(v) < 0.55 - q * 0.45) {
              const s = Math.abs(v) < 0.2 ? 3 : 2;
              dctx.fillRect(x + (6 - s) / 2, y + (6 - s) / 2, s, s);
            }
          }
      }

      if (log) {
        const pending = times.findIndex((x) => t < x.scan);
        const upto = pending === -1 ? n : pending;
        let html = `<div class="gu-panel-head">AGENT.LOG // PARTS ${pad(revealed, 2)}/${pad(n, 2)}</div><div class="gu-panel-rule"></div>`;
        for (let i = Math.max(0, upto - rows); i < upto; i++) {
          const p = m.parts[i];
          const pr = clamp((t - times[i].scan) / (times[i].reveal - times[i].scan));
          const bar = pr >= 1 ? "[  ok  ]" : `[${"#".repeat(Math.round(pr * 6)).padEnd(6, ".")}]`;
          html += `<div class="gu-log-row"><span class="gu-dim">0x${Math.floor(rand(i + 31) * 0xffff).toString(16).padStart(4, "0")}</span><span>${esc(p.type === "text" ? p.name || "text" : p.type)}</span><span class="gu-dim">${pad(p.x, 3)},${pad(p.y, 3)}</span><span class="gu-dim">${Math.round(p.w)}×${Math.round(p.h)}</span><span class="${pr >= 1 ? "gu-c-ok" : "gu-c-acc"}">${bar}</span></div>`;
        }
        log.innerHTML = html;
      }
      if (code) {
        const typed = Math.floor(clamp((t - 250 * k) / (total - 900 * k)) * chars);
        if (typed !== lastTyped || Math.floor(t / 180) !== Math.floor((t - 16) / 180)) {
          lastTyped = typed;
          let left = typed;
          const shown = [];
          for (const l of lines) {
            if (left <= 0) break;
            shown.push(l.slice(0, left));
            left -= l.length + 1;
          }
          const done = shown.filter((l, i) => l === "}" && lines[i] === "}").length;
          const tokens = lines.filter((l) => /^\s+--/.test(l)).length;
          const tokensDone = shown.filter((l) => /^\s+--/.test(l) && l.endsWith(";")).length;
          const status = t < 320 * k ? "READING" : revealed < n ? "WRITING" : "APPLYING";
          const tps = Math.round(140 + rand(Math.floor(t / 180)) * 40);
          code.innerHTML =
            `<div class="gu-panel-head">MOTION.CSS // ${pad(done, 2)} RECIPES · ${tokensDone}/${tokens} TOKENS</div><div class="gu-panel-rule"></div>` +
            `<pre>${shown.map(codeLine).join("")}<span class="gu-caret"></span></pre>` +
            `<div class="gu-status">${tps} TOK/S · ${shown.length} LN · ${lines.filter((l) => l === "}").length} RECIPES · <span class="${status === "APPLYING" ? "gu-c-acc" : ""}">${status}</span></div>`;
        }
      }

      if (t >= total) return finish();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };

  timer = setTimeout(start, o.delay);
  return {
    finished,
    /** Jump to the end of the build. */
    skip() {
      t0 = performance.now() - 1e6;
    },
    /** Stop now and show the real UI. */
    cancel() {
      target.style.position = prevPos;
      layer?.remove();
      layer = null;
      finish();
    },
  };
}

/**
 * Attribute API. Plays each `[data-generative-ui]` element once it scrolls into view.
 *   <div data-generative-ui data-generative-ui-delay="200">…</div>
 */
export function auto(root = document) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const d = e.target.dataset;
        generateUI(e.target, { delay: Number(d.generativeUiDelay) || 0 });
      }
    },
    { threshold: 0.35 },
  );
  root.querySelectorAll("[data-generative-ui]").forEach((n) => {
    n.classList.add("gu-root", "gu-building"); // hidden until it plays
    io.observe(n);
  });
  return () => io.disconnect();
}
