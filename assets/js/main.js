// 全站共用：导航、页脚、出现动效。导航和页脚只在这里维护一份。

const PAGES = [
  { id: "home", href: "index.html", label: "首页", icon: "🏠" },
  { id: "achievements", href: "achievements.html", label: "成就档案库", icon: "🏆" },
  { id: "side-quests", href: "side-quests.html", label: "支线任务", icon: "🗺️" },
  { id: "idea-lab", href: "idea-lab.html", label: "灵感实验室", icon: "🧪" },
  { id: "about", href: "about.html", label: "关于玩家", icon: "🎮" },
];

const current = document.body.dataset.page;

const nav = document.createElement("header");
nav.className = "site-nav";
nav.innerHTML = `
  <div class="container">
    <a class="brand" href="index.html" aria-label="回到首页">
      <img class="brand-avatar" src="assets/img/avatar.webp" alt="">
      <span class="brand-text">
        <strong>世界 Online</strong>
        <span>PLAYER REPORT · CHENYU</span>
      </span>
    </a>
    <nav aria-label="主导航">
      <ul class="nav-links">
        ${PAGES.map(
          (p) => `<li><a href="${p.href}"${p.id === current ? ' aria-current="page"' : ""}>
            <span class="nav-icon" aria-hidden="true">${p.icon}</span>${p.label}</a></li>`,
        ).join("")}
      </ul>
    </nav>
  </div>`;
document.body.prepend(nav);

const footer = document.createElement("footer");
footer.className = "site-footer";
footer.innerHTML = `
  <div class="container">
    <p class="footer-slogan">世界这么有趣，何必只做一种人？</p>
    <div class="footer-meta">
      <span>© 世界 Online 体验报告 · 地球服务器</span>
      <span class="footer-links">
        ${PAGES.map((p) => `<a href="${p.href}">${p.label}</a>`).join("")}
      </span>
    </div>
  </div>`;
document.body.append(footer);

// 区域探索记录：只存在访客自己的浏览器里，读写失败时当作没去过
const VISITED_KEY = "worldOnline.visited";
const readVisited = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const visited = readVisited();
visited.add(current);
try {
  localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
} catch {
  /* 隐私模式等情况下不记录 */
}

const zoneCards = document.querySelectorAll("[data-zone]");
if (zoneCards.length) {
  zoneCards.forEach((card) => card.classList.toggle("is-explored", visited.has(card.dataset.zone)));
  const explored = PAGES.filter((p) => visited.has(p.id)).length;
  const count = document.querySelector("[data-explore-count]");
  const bar = document.querySelector("[data-explore-bar]");
  if (count) count.textContent = `${explored}/${PAGES.length}`;
  if (bar) requestAnimationFrame(() => (bar.style.width = `${(explored / PAGES.length) * 100}%`));
}

// 卡片进入视口时轻轻浮现
const revealTargets = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-in"));
}

// 首页：玩家状态面板跟随打盹动画的状态
const stage = document.querySelector(".motion-stage");
const statusDot = document.querySelector("[data-player-status]");
if (stage && statusDot) {
  const LABELS = {
    sleep: ["暂离中 · AFK", false],
    waking: ["正在上线…", false],
    awake: ["在线 · 自由探索中", true],
    dozing: ["即将暂离…", false],
  };
  // 任务追踪：两个步骤——戳醒她、醒后动动鼠标和她对视
  const TITLES = {
    sleep: "唤醒摸鱼中的玩家",
    waking: "玩家上线中…",
    awake: "玩家已上线！",
    dozing: "玩家又睡着了",
  };
  const tracker = document.querySelector("[data-quest-tracker]");
  const pokeRow = tracker?.querySelector('[data-qt-row="poke"]');
  const lookRow = tracker?.querySelector('[data-qt-row="look"]');
  let looked = false;

  const setRow = (row, done) => {
    row.classList.toggle("is-done", done);
    row.querySelector("[data-qt-count]").textContent = done ? "1/1" : "0/1";
  };

  const sync = () => {
    const state = stage.dataset.state;
    const [text, online] = LABELS[state] ?? LABELS.sleep;
    statusDot.textContent = text;
    statusDot.classList.toggle("is-online", online);

    if (!tracker) return;
    if (state === "sleep" || state === "dozing") looked = false;
    const poked = state === "waking" || state === "awake";
    const allDone = poked && looked;
    tracker.querySelector("[data-qt-head]").textContent = allDone ? "QUEST COMPLETE" : "NEW QUEST";
    tracker.querySelector("[data-qt-title]").textContent = allDone ? "和玩家对上眼了！" : TITLES[state] ?? TITLES.sleep;
    pokeRow.querySelector("[data-qt-step]").textContent = state === "dozing" ? "再戳她一下" : "戳她一下";
    setRow(pokeRow, poked);
    setRow(lookRow, looked);
    tracker.classList.toggle("is-done", allDone);
  };

  // 醒着时第一次移动鼠标，完成第二个任务
  window.addEventListener("pointermove", () => {
    if (looked || stage.dataset.state !== "awake") return;
    looked = true;
    sync();
  });
  new MutationObserver(sync).observe(stage, { attributes: true, attributeFilter: ["data-state"] });
  sync();
}
