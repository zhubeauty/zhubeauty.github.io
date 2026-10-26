// 关于玩家：换装 / 视角切换 / 六维图。
// 加装扮或补视角图，只改 OUTFITS；某个视角没有图就写 null，页面会显示"暂未解锁"，不会借用别的装扮。

const VIEWS = [
  { id: "front", name: "正面" },
  { id: "side", name: "侧面" },
  { id: "back", name: "背面" },
  { id: "desk", name: "工作", scene: true }, // 带场景的整幅插画，用相框样式显示
];

const OUTFITS = [
  {
    id: "daily",
    name: "日常玩家",
    desc: "灰色针织衫 · 黑色阔腿裤",
    tag: "默认",
    views: {
      front: "assets/img/outfits/daily-front.webp",
      side: "assets/img/outfits/daily-side.webp",
      back: "assets/img/outfits/daily-back.webp",
      desk: "assets/img/outfits/daily-desk.webp",
    },
  },
  {
    id: "street",
    name: "街头玩家",
    desc: "黑色鸭舌帽 · 黑色 T 恤",
    views: {
      front: "assets/img/outfits/street-front.webp",
      side: "assets/img/outfits/street-side.webp",
      back: "assets/img/outfits/street-back.webp",
      desk: "assets/img/outfits/street-desk.webp",
    },
  },
  {
    id: "dress",
    name: "优雅白裙",
    desc: "白色露肩长裙",
    views: {
      front: "assets/img/outfits/dress-front.webp",
      side: "assets/img/outfits/dress-side.webp",
      back: "assets/img/outfits/dress-back.webp",
      desk: "assets/img/outfits/dress-desk.webp",
    },
  },
  {
    id: "queen",
    name: "女王时刻",
    desc: "皇冠 · 毛领斗篷",
    tag: "稀有",
    views: {
      front: "assets/img/outfits/queen-front.webp",
      side: "assets/img/outfits/queen-side.webp",
      back: "assets/img/outfits/queen-back.webp",
      desk: "assets/img/outfits/queen-desk.webp",
    },
  },
];

// 六维图：顺序即绘制顺序（从正上方顺时针），分值只用来画形状，页面不显示数字
const STATS = [
  { name: "内容创作", value: 8 },
  { name: "逻辑思考", value: 7 },
  { name: "审美表达", value: 6 },
  { name: "学习能力", value: 9 },
  { name: "共情理解", value: 8 },
  { name: "执行落地", value: 6 },
];
const STAT_MAX = 10;

const root = document.querySelector("[data-profile]");
const $ = (sel) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const state = { outfit: OUTFITS[0], view: "front" };

// ---- 换装列表 ----
const outfitList = $("[data-outfit-list]");
outfitList.innerHTML = OUTFITS.map((o) => {
  const thumb = o.views.front
    ? `<img src="${esc(o.views.front)}" alt="" loading="lazy">`
    : `<span class="pf-outfit-missing">?</span>`;
  return `<button class="pf-outfit" type="button" role="radio" data-outfit="${o.id}">
      <span class="pf-outfit-thumb">${thumb}</span>
      <span class="pf-outfit-text">
        <strong>${esc(o.name)}</strong>
        <small>${esc(o.desc)}</small>
      </span>
      ${o.tag ? `<span class="pf-outfit-tag">${esc(o.tag)}</span>` : ""}
    </button>`;
}).join("");

// ---- 视角缩略图 ----
const viewList = $("[data-view-list]");
const renderViews = () => {
  viewList.innerHTML = VIEWS.map((v) => {
    const src = state.outfit.views[v.id];
    const inner = src
      ? `<img src="${esc(src)}" alt="" loading="lazy">`
      : `<span class="pf-view-missing">暂未解锁</span>`;
    return `<button class="pf-view${src ? "" : " is-missing"}${v.scene ? " is-scene" : ""}" type="button" role="tab" data-view="${v.id}"${src ? "" : " disabled"}>
        <span class="pf-view-thumb">${inner}</span>
        <span class="pf-view-name">${v.name}</span>
      </button>`;
  }).join("");
};

// ---- 主图：淡出 → 换图（等图片解码）→ 淡入 ----
const stageImg = $("[data-stage-img]");
const stageMissing = $("[data-stage-missing]");
let swapToken = 0;

const showStage = () => {
  const { outfit, view } = state;
  const viewDef = VIEWS.find((v) => v.id === view);
  const viewName = viewDef.name;
  const src = outfit.views[view];
  $("[data-stage-outfit]").textContent = outfit.name;
  $("[data-stage-view]").textContent = viewName;

  const token = ++swapToken;
  stageImg.classList.add("is-fading");
  setTimeout(async () => {
    if (token !== swapToken) return;
    if (src) {
      const next = new Image();
      next.src = src;
      // 最多等 400ms：解码失败或后台标签页不解码时也照常换上
      await Promise.race([next.decode().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
      if (token !== swapToken) return;
      stageImg.src = src;
      stageImg.alt = `${outfit.name} · ${viewName}`;
    }
    stageImg.closest(".pf-figure").classList.toggle("is-scene", !!viewDef.scene);
    stageImg.hidden = !src;
    stageMissing.hidden = !!src;
    stageImg.classList.remove("is-fading");
  }, 160);

  outfitList.querySelectorAll("[data-outfit]").forEach((b) => {
    const on = b.dataset.outfit === outfit.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
  });
  viewList.querySelectorAll("[data-view]").forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
};

// 可用视角（有图的），左右按钮在其中循环
const availableViews = () => VIEWS.filter((v) => state.outfit.views[v.id]).map((v) => v.id);

const stepView = (dir) => {
  const list = availableViews();
  if (list.length < 2) return;
  const i = list.indexOf(state.view);
  state.view = list[(i + dir + list.length) % list.length];
  showStage();
};

outfitList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-outfit]");
  if (!btn || btn.dataset.outfit === state.outfit.id) return;
  state.outfit = OUTFITS.find((o) => o.id === btn.dataset.outfit);
  // 换装后保持当前视角；新装扮没有这个视角时回到它第一个有图的视角
  if (!state.outfit.views[state.view]) state.view = availableViews()[0] || "front";
  renderViews();
  showStage();
});

viewList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view]");
  if (!btn || btn.disabled || btn.dataset.view === state.view) return;
  state.view = btn.dataset.view;
  showStage();
});

$("[data-view-prev]").addEventListener("click", () => stepView(-1));
$("[data-view-next]").addEventListener("click", () => stepView(1));
$(".pf-stage-main").addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") stepView(-1);
  if (e.key === "ArrowRight") stepView(1);
});

renderViews();
showStage();

// 预加载所有视角图，切换时不闪
OUTFITS.forEach((o) => Object.values(o.views).forEach((src) => { if (src) new Image().src = src; }));

// ---- 六维图 ----
const radar = $("[data-radar]");
const CX = 160, CY = 142, R = 92;
const point = (i, r) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / STATS.length;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const poly = (r) => STATS.map((_, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

const rings = [0.25, 0.5, 0.75, 1]
  .map((k, n) => `<polygon points="${poly(R * k)}" class="pf-radar-ring${n === 3 ? " is-outer" : ""}"/>`)
  .join("");
const axes = STATS.map((_, i) => {
  const [x, y] = point(i, R);
  return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="pf-radar-axis"/>`;
}).join("");
const shape = STATS.map((s, i) => point(i, (R * s.value) / STAT_MAX).map((n) => n.toFixed(1)).join(",")).join(" ");
const dots = STATS.map((s, i) => {
  const [x, y] = point(i, (R * s.value) / STAT_MAX);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="pf-radar-dot"/>`;
}).join("");
const labels = STATS.map((s, i) => {
  const [x, y] = point(i, R + 22);
  const anchor = Math.abs(x - CX) < 4 ? "middle" : x > CX ? "start" : "end";
  return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="${anchor}" class="pf-radar-label">${esc(s.name)}</text>`;
}).join("");

radar.innerHTML = `${rings}${axes}<polygon points="${shape}" class="pf-radar-shape"/>${dots}${labels}`;

// ---- 技能图鉴：属性面板 ----
// 加技能或改等级只改这里；lv 最高 5
const SKILL_MAX = 5;
const SKILL_BOOK = [
  {
    name: "认知与思维",
    skills: [
      { icon: "⚔️", name: "谋略", lv: 3, status: "运筹帷幄中" },
      { icon: "🐱", name: "逻辑", lv: 4, status: "逻辑清晰" },
      { icon: "🧠", name: "智慧", lv: 4, status: "持续进化中" },
      { icon: "💫", name: "思维", lv: 4, status: "拒绝停止思考" },
      { icon: "📚", name: "博闻", lv: 3, status: "知识收集中" },
    ],
  },
  {
    name: "情感与社交",
    skills: [
      { icon: "❤️", name: "情感", lv: 4, status: "持续理解人类" },
      { icon: "💬", name: "谈吐", lv: 3, status: "表达训练中" },
      { icon: "🕵️", name: "观察力", lv: 5, status: "细节捕捉者" },
      { icon: "🧠", name: "心理学", lv: 3, status: "人类观察中" },
    ],
  },
  {
    name: "创造与职业",
    skills: [
      { icon: "🎬", name: "内容创作", lv: 5, status: "爆款猎人" },
      { icon: "✨", name: "AI 制作", lv: 3, status: "视觉炼金术士" },
      { icon: "🏺", name: "历史研究", lv: 2, status: "时空考古员" },
      { icon: "🖼️", name: "绘画", lv: 1, status: "菜鸡" },
    ],
  },
  {
    name: "生活与身体",
    skills: [
      { icon: "🌸", name: "美貌", lv: 3, status: "持续打理中" },
      { icon: "💪", name: "体质", lv: 3, status: "状态维护中" },
      { icon: "🛡️", name: "武力", lv: 1, status: "和平主义倾向" },
      { icon: "🍳", name: "烹饪", lv: 1, status: "新手厨房" },
      { icon: "🏊", name: "游泳", lv: 1, status: "新手入门" },
      { icon: "🏹", name: "射箭", lv: 1, status: "肩不能提" },
      { icon: "🚗", name: "驾驶", lv: 1, status: "有证不会开" },
    ],
  },
  {
    name: "兴趣与探索",
    skills: [
      { icon: "🔮", name: "星盘", lv: 3, status: "巫师学徒" },
      { icon: "🎼", name: "声乐", lv: 1, status: "嘎嘎嘶嘶" },
      { icon: "🔤", name: "英语", lv: 2, status: "哑巴英语" },
    ],
  },
];

const attrTabs = document.querySelector("[data-attr-tabs]");
const attrList = document.querySelector("[data-attr-list]");

attrTabs.innerHTML = SKILL_BOOK.map(
  (c, i) => `<button class="attr-tab" type="button" role="tab" data-attr-tab="${i}">
      <span>${esc(c.name)}</span><b>${c.skills.length}</b>
    </button>`
).join("");

const showSkills = (i) => {
  attrList.innerHTML = SKILL_BOOK[i].skills
    .map((s) => {
      const pips = Array.from({ length: SKILL_MAX }, (_, n) => `<i${n < s.lv ? ' class="is-on"' : ""}></i>`).join("");
      return `<li class="attr-row${s.lv >= SKILL_MAX ? " is-max" : ""}">
          <span class="attr-icon">${s.icon}</span>
          <strong class="attr-name">${esc(s.name)}</strong>
          <span class="attr-lv">Lv.${s.lv}</span>
          <span class="attr-pips" aria-label="等级 ${s.lv} / ${SKILL_MAX}">${pips}</span>
          <span class="attr-status">${esc(s.status)}</span>
        </li>`;
    })
    .join("");
  attrTabs.querySelectorAll("[data-attr-tab]").forEach((b) => {
    const on = Number(b.dataset.attrTab) === i;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
};

attrTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-attr-tab]");
  if (btn) showSkills(Number(btn.dataset.attrTab));
});

showSkills(0);

// ---- 多人联机：组队大厅 → 扫码发送好友申请 → 申请已送达 ----
// 按钮上的 data-lobby-go 写要切到哪一步
const lobby = document.querySelector("[data-lobby]");
lobby.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-lobby-go]");
  if (!btn) return;
  lobby.querySelectorAll("[data-lobby-step]").forEach((el) => { el.hidden = el.dataset.lobbyStep !== btn.dataset.lobbyGo; });
});

// 二维码图片还没放进来时，显示占位，不显示破图
const qr = lobby.querySelector("[data-lobby-qr]");
const qrMissing = () => { qr.hidden = true; lobby.querySelector(".lobby-qr-missing").hidden = false; };
if (qr.complete && !qr.naturalWidth) qrMissing();
else qr.addEventListener("error", qrMissing);
