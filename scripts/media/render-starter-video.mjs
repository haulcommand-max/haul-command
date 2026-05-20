#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const DEFAULT_PACKET_FILE = "docs/media/video-packets/starter-set.json";
const DEFAULT_OUT_DIR = "docs/media/renders";
const DEFAULT_TMP_DIR = ".tmp/media-render";

function parseArgs(argv) {
  const args = {
    id: "what-is-a-pilot-car",
    packetFile: DEFAULT_PACKET_FILE,
    outDir: DEFAULT_OUT_DIR,
    tmpDir: DEFAULT_TMP_DIR,
    width: 1280,
    height: 720,
    fps: 12,
    format: "webm",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--id" && next) { args.id = next; i++; }
    else if (arg === "--packet-file" && next) { args.packetFile = next; i++; }
    else if (arg === "--out-dir" && next) { args.outDir = next; i++; }
    else if (arg === "--tmp-dir" && next) { args.tmpDir = next; i++; }
    else if (arg === "--width" && next) { args.width = Number(next); i++; }
    else if (arg === "--height" && next) { args.height = Number(next); i++; }
    else if (arg === "--fps" && next) { args.fps = Number(next); i++; }
    else if (arg === "--format" && next) { args.format = next; i++; }
  }

  return args;
}

export function loadPacket(packetFile, id) {
  const raw = JSON.parse(readFileSync(packetFile, "utf8"));
  const packet = raw.packets.find((item) => item.id === id);
  if (!packet) throw new Error(`Video packet not found: ${id}`);
  return packet;
}

export function buildStarterRenderPlan(packet) {
  const scenes = [
    {
      kind: "intro",
      duration: 4,
      title: packet.title,
      kicker: "Haul Command field guide",
      text: packet.hook,
    },
    ...packet.script.map((line, index) => ({
      kind: "script",
      duration: 5,
      title: packet.captions[index % packet.captions.length] ?? packet.title,
      text: line,
      index: index + 1,
    })),
    {
      kind: "cta",
      duration: 5,
      title: packet.cta,
      kicker: packet.watch_page,
      text: "Find support, check requirements, or claim your profile before the next move is already late.",
    },
  ];

  let cursor = 0;
  const timedScenes = scenes.map((scene) => {
    const timed = { ...scene, start: cursor, end: cursor + scene.duration };
    cursor += scene.duration;
    return timed;
  });

  return {
    id: packet.id,
    title: packet.title,
    fps: 12,
    durationSeconds: cursor,
    scenes: timedScenes,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCompositionHtml(packet, plan) {
  const sceneData = JSON.stringify(plan.scenes);
  const packetData = JSON.stringify({
    title: packet.title,
    sourcePage: packet.source_page,
    watchPage: packet.watch_page,
    cta: packet.cta,
    captions: packet.captions,
    visuals: packet.visuals,
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(packet.title)}</title>
  <style>
    :root {
      --ink: #071014;
      --panel: #0e1b20;
      --steel: #1b343d;
      --line: #315661;
      --white: #f6fbfd;
      --muted: #a8bcc4;
      --gold: #f5b642;
      --orange: #f26b2f;
      --cyan: #61d7ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--ink);
      color: var(--white);
      font-family: Inter, Arial, Helvetica, sans-serif;
    }
    #frame {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background:
        linear-gradient(90deg, rgba(7,16,20,.96), rgba(7,16,20,.78)),
        repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 36px),
        radial-gradient(circle at 82% 26%, rgba(97,215,255,.16), transparent 34%),
        #071014;
    }
    .road {
      position: absolute;
      inset: auto -8vw 8vh -8vw;
      height: 24vh;
      background: linear-gradient(180deg, #20343a, #0f1e23);
      transform: skewY(-4deg);
      border-top: 2px solid rgba(245,182,66,.7);
      box-shadow: 0 -18px 90px rgba(242,107,47,.16);
    }
    .stripe {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 18vh;
      height: 4px;
      background: repeating-linear-gradient(90deg, var(--gold) 0 72px, transparent 72px 132px);
      opacity: .8;
      transform: skewY(-4deg);
    }
    .truck, .escort {
      position: absolute;
      bottom: 11vh;
      border-radius: 10px;
      transform: translateX(var(--move, 0px));
      transition: transform .1s linear;
    }
    .truck {
      right: 9vw;
      width: 28vw;
      height: 10vh;
      background: linear-gradient(90deg, #dce8ec, #8ca6af);
      border: 3px solid #eaf7fb;
      box-shadow: 0 18px 40px rgba(0,0,0,.35);
    }
    .truck::before {
      content: "";
      position: absolute;
      left: -7vw;
      top: 1vh;
      width: 7vw;
      height: 8vh;
      background: linear-gradient(90deg, var(--orange), #bd421b);
      border-radius: 12px 0 0 12px;
    }
    .truck::after, .escort::after {
      content: "";
      position: absolute;
      left: 10%;
      right: 10%;
      bottom: -2.2vh;
      height: 2.8vh;
      background: radial-gradient(circle at 20% 50%, #0b0e10 0 1.2vh, transparent 1.3vh),
                  radial-gradient(circle at 80% 50%, #0b0e10 0 1.2vh, transparent 1.3vh);
    }
    .escort {
      left: 10vw;
      width: 11vw;
      height: 5.5vh;
      background: linear-gradient(90deg, var(--gold), #d88620);
      border: 2px solid #ffe0a1;
      box-shadow: 0 12px 30px rgba(0,0,0,.35);
    }
    .escort::before {
      content: "";
      position: absolute;
      top: -1.4vh;
      left: 4.7vw;
      width: 1.5vw;
      height: 1vh;
      background: var(--cyan);
      border-radius: 999px;
      box-shadow: 0 0 18px var(--cyan);
    }
    .content {
      position: absolute;
      inset: 6.5vh 7vw 28vh 7vw;
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(320px, .75fr);
      gap: 5vw;
      align-items: center;
    }
    .kicker {
      color: var(--cyan);
      font-size: clamp(15px, 1.6vw, 24px);
      font-weight: 800;
      text-transform: uppercase;
    }
    h1 {
      margin: 2vh 0;
      max-width: 820px;
      font-size: clamp(42px, 6.6vw, 90px);
      line-height: .94;
      letter-spacing: 0;
    }
    .body {
      max-width: 760px;
      color: #d9e7eb;
      font-size: clamp(24px, 3.1vw, 42px);
      line-height: 1.14;
      font-weight: 650;
    }
    .side {
      padding: 30px;
      border: 1px solid rgba(168,188,196,.3);
      background: rgba(14,27,32,.82);
      border-radius: 8px;
      box-shadow: 0 24px 90px rgba(0,0,0,.28);
    }
    .number {
      color: var(--gold);
      font-size: clamp(54px, 7vw, 110px);
      line-height: 1;
      font-weight: 900;
    }
    .label {
      color: var(--muted);
      margin-top: 12px;
      font-size: clamp(18px, 2vw, 26px);
      line-height: 1.2;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
    }
    .tag {
      padding: 9px 12px;
      border-radius: 6px;
      border: 1px solid rgba(97,215,255,.28);
      color: #dff8ff;
      background: rgba(97,215,255,.08);
      font-size: 16px;
      font-weight: 700;
    }
    .footer {
      position: absolute;
      left: 7vw;
      right: 7vw;
      bottom: 4vh;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--muted);
      font-size: 18px;
      font-weight: 700;
    }
    .brand {
      color: var(--white);
      font-weight: 900;
    }
    .progress {
      width: 32vw;
      height: 8px;
      background: rgba(255,255,255,.12);
      border-radius: 999px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--orange), var(--gold), var(--cyan));
    }
  </style>
</head>
<body>
  <div id="frame">
    <div class="road"></div>
    <div class="stripe"></div>
    <div class="escort"></div>
    <div class="truck"></div>
    <main class="content">
      <section>
        <div class="kicker" id="kicker"></div>
        <h1 id="title"></h1>
        <div class="body" id="body"></div>
      </section>
      <aside class="side">
        <div class="number" id="number"></div>
        <div class="label" id="label"></div>
        <div class="tags" id="tags"></div>
      </aside>
    </main>
    <footer class="footer">
      <div><span class="brand">HAUL COMMAND</span> | ${escapeHtml(packet.source_page)}</div>
      <div class="progress"><div class="bar" id="bar"></div></div>
    </footer>
  </div>
  <script>
    const scenes = ${sceneData};
    const packet = ${packetData};
    const duration = ${plan.durationSeconds};

    function easeOutCubic(x) {
      return 1 - Math.pow(1 - x, 3);
    }

    window.__setFrame = function(time) {
      const scene = scenes.find((item) => time >= item.start && time < item.end) || scenes[scenes.length - 1];
      const local = Math.max(0, Math.min(1, (time - scene.start) / scene.duration));
      const eased = easeOutCubic(local);
      const overall = Math.max(0, Math.min(1, time / duration));

      document.getElementById("kicker").textContent = scene.kicker || packet.title;
      document.getElementById("title").textContent = scene.title;
      document.getElementById("body").textContent = scene.text;
      document.getElementById("number").textContent = scene.kind === "cta" ? "NEXT" : String(scene.index || "01").padStart(2, "0");
      document.getElementById("label").textContent = scene.kind === "cta" ? packet.watchPage : packet.visuals[(scene.index || 0) % packet.visuals.length];
      document.getElementById("bar").style.width = (overall * 100).toFixed(2) + "%";

      const tags = document.getElementById("tags");
      tags.innerHTML = "";
      packet.captions.forEach((caption, index) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = caption;
        tag.style.opacity = index <= ((scene.index || 1) - 1) % packet.captions.length ? "1" : ".42";
        tags.appendChild(tag);
      });

      document.querySelector(".truck").style.setProperty("--move", ((eased - .5) * -28) + "px");
      document.querySelector(".escort").style.setProperty("--move", ((eased - .5) * 26) + "px");
      document.querySelector(".content").style.opacity = String(Math.min(1, .35 + eased));
      document.querySelector(".content").style.transform = "translateY(" + ((1 - eased) * 18) + "px)";
    };

    window.__setFrame(0);
  </script>
</body>
</html>`;
}

function findFfmpeg() {
  const explicit = process.env.FFMPEG_PATH;
  if (explicit && existsSync(explicit)) return explicit;

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const playwrightPath = join(localAppData, "ms-playwright", "ffmpeg-1011", "ffmpeg-win64.exe");
    if (existsSync(playwrightPath)) return playwrightPath;
  }

  return "ffmpeg";
}

function assertInsideWorkspace(targetPath) {
  const cwd = resolve(process.cwd());
  const resolved = resolve(targetPath);
  if (!resolved.startsWith(cwd)) {
    throw new Error(`Refusing to write outside workspace: ${resolved}`);
  }
  return resolved;
}

async function render(args) {
  const packet = loadPacket(args.packetFile, args.id);
  const plan = buildStarterRenderPlan(packet);
  const html = buildCompositionHtml(packet, plan);
  const outDir = assertInsideWorkspace(args.outDir);
  const tmpRoot = assertInsideWorkspace(args.tmpDir);
  const frameDir = join(tmpRoot, args.id);
  const outputPath = join(outDir, `${args.id}.${args.format}`);
  const thumbnailPath = join(outDir, `${args.id}.png`);

  mkdirSync(outDir, { recursive: true });
  if (existsSync(frameDir)) rmSync(frameDir, { recursive: true, force: true });
  mkdirSync(frameDir, { recursive: true });

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: args.width, height: args.height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });

  const totalFrames = Math.ceil(plan.durationSeconds * args.fps);
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / args.fps;
    await page.evaluate((value) => window.__setFrame(value), time);
    await page.screenshot({
      path: join(frameDir, `frame-${String(frame).padStart(5, "0")}.jpg`),
      type: "jpeg",
      quality: 92,
    });
  }

  await page.evaluate((value) => window.__setFrame(value), 2.5);
  await page.screenshot({ path: thumbnailPath, type: "png" });
  await browser.close();

  const ffmpeg = findFfmpeg();
  const ffmpegArgs = args.format === "mp4"
    ? [
      "-y",
      "-f", "image2pipe",
      "-framerate", String(args.fps),
      "-c:v", "mjpeg",
      "-i", "pipe:0",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    ]
    : [
      "-y",
      "-f", "image2pipe",
      "-framerate", String(args.fps),
      "-c:v", "mjpeg",
      "-i", "pipe:0",
      "-c:v", "libvpx",
      "-b:v", "2500k",
      outputPath,
    ];

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(ffmpeg, ffmpegArgs, { stdio: ["pipe", "inherit", "inherit"] });
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      rejectPromise(error);
    };
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`FFmpeg failed with status ${code}`));
    });
    child.stdin.on("error", rejectOnce);

    for (let frame = 0; frame < totalFrames; frame++) {
      if (child.stdin.destroyed) break;
      const framePath = join(frameDir, `frame-${String(frame).padStart(5, "0")}.jpg`);
      child.stdin.write(readFileSync(framePath));
    }
    if (!child.stdin.destroyed) child.stdin.end();
  });

  return {
    id: packet.id,
    outputPath,
    thumbnailPath,
    durationSeconds: plan.durationSeconds,
    fps: args.fps,
    frames: totalFrames,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await render(args);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
