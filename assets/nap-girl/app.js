import { createChromaVideoRenderer } from "./lib/chroma-video-renderer.js";

const IDLE_LOOK_BACK_MS = 2500; // 鼠标停住多久后低头回到电脑
const IDLE_SLEEP_MS = 12000; // 鼠标多久不动后重新睡着

// 素材路径相对 app.js 自身解析：整个文件夹放进网站任意目录都能用
const asset = (path) => new URL(path, import.meta.url).href;

const stage = document.querySelector(".motion-stage");
const hint = document.querySelector(".motion-hint") ?? { textContent: "" }; // 提示文字可选
const sleepCanvas = stage.querySelector(".canvas-sleepwake");
const gazeCanvas = stage.querySelector(".canvas-gaze");
const fallback = stage.querySelector(".motion-fallback");

// 倒放视频画在叠在上面的第二块画布上，和正放画布同一套样式
const gazeRevCanvas = gazeCanvas.cloneNode();
gazeCanvas.after(gazeRevCanvas);
gazeRevCanvas.style.opacity = "0";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const manifest = await fetch(asset("motion.json")).then((r) => r.json());
const { fps, keying, sleepwake, gaze } = manifest;
const [loopStart, loopEnd] = sleepwake.sleepLoop;
const [wakeStart, wakeEnd] = sleepwake.wake;

const showFallback = (which) => {
  fallback.src = asset(manifest.posters[which]);
  stage.dataset.mode = "fallback";
};

if (reducedMotion) {
  showFallback("awake");
  hint.textContent = "已开启减少动态效果";
  throw new Error("reduced motion: static poster only");
}

// 整段下载成 Blob 再交给 <video>：不支持 Range 请求的静态服务器上也能逐帧 seek
const loadBlobUrl = async (src) => URL.createObjectURL(await (await fetch(src)).blob());

const makeVideo = (src) => {
  const video = document.createElement("video");
  video.className = "motion-source";
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  stage.append(video);
  return video;
};

let sleepRenderer;
let gazeRenderer;
let gazeRevRenderer;
let sleepSrc;
let gazeSrc;
let gazeRevSrc;
try {
  [sleepSrc, gazeSrc, gazeRevSrc] = await Promise.all([
    loadBlobUrl(asset(sleepwake.src)),
    loadBlobUrl(asset(gaze.src)),
    loadBlobUrl(asset(gaze.reverseSrc)),
  ]);
} catch (error) {
  showFallback("sleep");
  throw error;
}
const gazeVideo = makeVideo(gazeSrc);
const gazeRevVideo = makeVideo(gazeRevSrc);
try {
  sleepRenderer = createChromaVideoRenderer({
    video: makeVideo(sleepSrc),
    canvas: sleepCanvas,
    frameCount: sleepwake.frameCount,
    fps,
    keying,
  });
  gazeRenderer = createChromaVideoRenderer({
    video: gazeVideo,
    canvas: gazeCanvas,
    frameCount: gaze.frameCount,
    fps,
    keying,
  });
  gazeRevRenderer = createChromaVideoRenderer({
    video: gazeRevVideo,
    canvas: gazeRevCanvas,
    frameCount: gaze.frameCount,
    fps,
    keying,
  });
} catch (error) {
  showFallback("sleep");
  throw error;
}
stage.querySelectorAll("video").forEach((video) =>
  video.addEventListener("error", () => showFallback("awake"), { once: true }),
);

// ---- 视线：指针角度 -> 环形帧 ----
const N = gaze.frameCount;
const keys = gaze.angleKeys; // [ringFrame, angleDeg]，角度随帧单调递减，跨度 360°
const lowAngle = keys[keys.length - 1][1];
const angleToFrame = (deg) => {
  let a = deg;
  while (a <= lowAngle) a += 360;
  while (a > lowAngle + 360) a -= 360;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [f0, a0] = keys[i];
    const [f1, a1] = keys[i + 1];
    if (a <= a0 && a >= a1) return (f0 + ((a0 - a) / (a0 - a1 || 1)) * (f1 - f0)) % N;
  }
  return gaze.restFrame;
};

// 环上从 from 到 to 的最短帧差，范围 (-N/2, N/2]
const ringDelta = (from, to) => {
  let d = (((to - from) % N) + N) % N;
  if (d > N / 2) d -= N;
  return d;
};

// ---- 转头：用视频原生播放驱动 ----
// 逐帧 seek 在浏览器里要 17–50ms，跟不上 60Hz 刷新，画面会停顿和跳帧。
// 现在往"帧号增大"方向转就正放 gaze.mp4，往反方向转就正放倒放版 gaze-rev.mp4
// （倒放第 j 帧 = 正放第 N-1-j 帧），用 playbackRate 控制快慢，到位就暂停。
// 只有换方向时才 seek 一次。
const GAZE_DEAD_ZONE_PX = 70; // 鼠标离头部太近时角度会乱跳，这个半径内不更新目标
const dist = gaze.distance; // 每帧头部累计移动距离，用来让不同段的转速看起来一致
const avgStep = dist[dist.length - 1] / N;

const gazeTracks = {
  1: { video: gazeVideo, canvas: gazeCanvas, renderer: gazeRenderer },
  [-1]: { video: gazeRevVideo, canvas: gazeRevCanvas, renderer: gazeRevRenderer },
};
let gazeDir = 1; // 当前显示的是正放(1)还是倒放(-1)
let gazeTarget = gaze.restFrame;
let switchingDir = false;
let gazeRaf = 0;

const toRing = (dir, videoFrame) => (dir === 1 ? videoFrame : N - 1 - videoFrame);
const currentRingFrame = () => toRing(gazeDir, gazeTracks[gazeDir].video.currentTime * fps);

const showTrack = (dir) => {
  gazeTracks[1].canvas.style.opacity = dir === 1 ? "1" : "0";
  gazeTracks[-1].canvas.style.opacity = dir === -1 ? "1" : "0";
};

const pauseGaze = () => {
  gazeTracks[1].video.pause();
  gazeTracks[-1].video.pause();
};

// 头停下时，把另一条轨道悄悄对齐到同一姿势，之后反向转头就不用等 seek
const presyncOther = () => {
  const other = gazeTracks[-gazeDir].video;
  const ringFrame = Math.round(currentRingFrame()) % N;
  const t = toRing(-gazeDir, ringFrame) / fps;
  if (!other.seeking && Math.abs(other.currentTime - t) > 0.5 / fps) other.currentTime = t;
};

const switchDirection = (dir) => {
  const from = gazeTracks[gazeDir].video;
  const to = gazeTracks[dir].video;
  const ringFrame = Math.round(currentRingFrame()) % N;
  from.pause();
  const t = toRing(dir, ringFrame) / fps;
  if (!to.seeking && Math.abs(to.currentTime - t) <= 0.5 / fps) {
    // 已经提前对齐好了：直接换轨
    gazeDir = dir;
    showTrack(dir);
    return;
  }
  switchingDir = true;
  to.addEventListener(
    "seeked",
    () => {
      gazeDir = dir;
      showTrack(dir);
      switchingDir = false;
    },
    { once: true },
  );
  to.currentTime = t;
};

const gazeTick = () => {
  gazeRaf = requestAnimationFrame(gazeTick);
  if (switchingDir) return;
  const video = gazeTracks[gazeDir].video;
  const f = currentRingFrame();
  const d = ringDelta(f, gazeTarget);
  if (Math.abs(d) < 0.5) {
    if (!video.paused) {
      video.pause();
      presyncOther();
    }
    return;
  }
  const want = d > 0 ? 1 : -1;
  if (want !== gazeDir) {
    switchDirection(want);
    return;
  }
  // 离目标越远转得越快；动作幅度大的那几段相应放慢，看起来匀速
  const i = Math.floor(((f % N) + N) % N);
  const step = Math.max(0.3, dist[i + 1] - dist[i]);
  const evenness = Math.min(1.4, Math.max(0.7, avgStep / step));
  // 离目标稍远就接近全速，快到时最低也保持 0.8 倍速，不拖尾巴；
  // 上限 2.5 倍速：实测浏览器解码这段视频每秒最多 45–50 帧，再快只会丢帧、不会更快
  const rate = Math.min(2.5, Math.max(0.8, (Math.abs(d) / 2.5) * evenness));
  if (Math.abs(video.playbackRate - rate) > 0.03) video.playbackRate = rate;
  if (video.paused) video.play().catch(() => {});
};

const startGaze = () => {
  if (!gazeRaf) gazeRaf = requestAnimationFrame(gazeTick);
};
const stopGaze = () => {
  cancelAnimationFrame(gazeRaf);
  gazeRaf = 0;
  pauseGaze();
};

// 两条轨道都在视频出新帧时实时重画
gazeRenderer.startLive();
gazeRevRenderer.startLive();
gazeVideo.loop = true;
gazeRevVideo.loop = true;

// ---- 睡觉 / 醒来：按 24fps 时钟逐帧推进 ----
let mode = "sleep"; // sleep | waking | awake | dozing
let frame = loopStart;
let clockRaf = 0;
let lastTick = 0;
const frameMs = 1000 / fps;

const setLayer = (layer) => {
  stage.dataset.layer = layer;
};

const tick = (now) => {
  clockRaf = requestAnimationFrame(tick);
  if (now - lastTick < frameMs - 1) return;
  lastTick = now;
  if (mode === "sleep") {
    frame = frame >= loopEnd ? loopStart : frame + 1;
  } else if (mode === "waking") {
    if (frame >= wakeEnd) return enterAwake();
    frame += 1;
  } else if (mode === "dozing") {
    if (frame <= wakeStart) {
      mode = "sleep";
      frame = loopStart;
      stage.dataset.state = "sleep";
      hint.textContent = "我就眯一会，不会被发现吧";
    } else {
      frame -= 1;
    }
  } else {
    return;
  }
  sleepRenderer.render(frame);
};

const runClock = () => {
  if (!clockRaf) clockRaf = requestAnimationFrame(tick);
};
const stopClock = () => {
  cancelAnimationFrame(clockRaf);
  clockRaf = 0;
};

let lookBackTimer = 0;
let sleepTimer = 0;
const armIdleTimers = () => {
  clearTimeout(lookBackTimer);
  clearTimeout(sleepTimer);
  lookBackTimer = setTimeout(() => {
    gazeTarget = gaze.restFrame;
  }, IDLE_LOOK_BACK_MS);
  sleepTimer = setTimeout(startDozing, IDLE_SLEEP_MS);
};

function enterAwake() {
  mode = "awake";
  stopClock();
  // 醒来时从正放轨道的"看电脑"帧开始
  pauseGaze();
  gazeDir = 1;
  switchingDir = false;
  showTrack(1);
  gazeTarget = gaze.restFrame;
  gazeRenderer.render(gaze.restFrame);
  setLayer("gaze");
  stage.dataset.state = "awake";
  hint.textContent = "嘿！我在盯着你哦！";
  startGaze();
  armIdleTimers();
}

function startWaking() {
  if (mode === "awake" || mode === "waking") return;
  if (mode === "sleep") frame = wakeStart;
  mode = "waking"; // dozing 中再次点击：从当前帧直接正放回去
  stage.dataset.state = "waking";
  hint.textContent = "嘿！我在盯着你哦！";
  runClock();
}

function startDozing() {
  if (mode !== "awake") return;
  clearTimeout(lookBackTimer);
  gazeTarget = gaze.restFrame;
  // 等视线回到电脑后再换层，避免从任意角度硬切到醒来片段的尾帧
  const waitForRest = () => {
    if (mode !== "awake") return;
    if (switchingDir || Math.abs(ringDelta(currentRingFrame(), gaze.restFrame)) > 0.6) {
      return requestAnimationFrame(waitForRest);
    }
    stopGaze();
    mode = "dozing";
    frame = wakeEnd;
    sleepRenderer.render(frame);
    setLayer("sleepwake");
    stage.dataset.state = "dozing";
    hint.textContent = "好困，人果然不适合工作！";
    runClock();
  };
  waitForRest();
}

stage.addEventListener("click", startWaking);
stage.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    startWaking();
  }
});

let pointer = null;
let pointerRaf = 0;
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY };
  if (mode !== "awake" || pointerRaf) return;
  pointerRaf = requestAnimationFrame(() => {
    pointerRaf = 0;
    if (mode !== "awake" || !pointer) return;
    const rect = gazeCanvas.getBoundingClientRect();
    const hx = rect.left + rect.width * gaze.head[0];
    const hy = rect.top + rect.height * gaze.head[1];
    armIdleTimers();
    if (Math.hypot(pointer.x - hx, pointer.y - hy) < GAZE_DEAD_ZONE_PX) return;
    const deg = (Math.atan2(hy - pointer.y, pointer.x - hx) * 180) / Math.PI;
    gazeTarget = angleToFrame(deg);
  });
});
document.documentElement.addEventListener("pointerleave", () => {
  if (mode === "awake") gazeTarget = gaze.restFrame;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopClock();
    if (mode === "awake") stopGaze();
  } else if (mode === "awake") {
    startGaze();
  } else {
    runClock();
  }
});

setLayer("sleepwake");
stage.dataset.state = "sleep";
sleepRenderer.render(loopStart);
gazeRenderer.render(gaze.restFrame);
await Promise.all(
  [...stage.querySelectorAll("video")].map((video) =>
    video.readyState >= video.HAVE_CURRENT_DATA
      ? null
      : new Promise((resolve) => video.addEventListener("loadeddata", resolve, { once: true })),
  ),
);
delete stage.dataset.mode; // 视频就绪：从静态海报切到实时画面
runClock();
