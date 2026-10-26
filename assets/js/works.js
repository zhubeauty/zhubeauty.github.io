// 代表作品数据：以后加作品、补封面、改播放量，只改这个文件。
//
// 作品分类（页面按这个顺序分区显示）
//   ratio     封面比例；cols  每行几张
//   platform  分区标题旁显示的平台标识（douyin / xhs），没有就不写
//   groups    分区内再分小组时用，作品用 group 字段对应
export const CATEGORIES = [
  { id: "viral", name: "爆款流量作品", en: "Viral Hits", ratio: "3 / 4", cols: 4, platform: "douyin" },
  {
    id: "private",
    name: "私域引流展示",
    en: "Private Traffic",
    platform: "xhs",
    groups: [
      { id: "video", name: "原视频", ratio: "3 / 4", cols: 4 },
      { id: "shot", name: "后台数据截图", ratio: "auto", cols: 3 },
      { id: "lead", name: "引流数据", ratio: "auto", cols: 5 },
    ],
  },
  { id: "promo", name: "宣传片", en: "Promo Films", ratio: "16 / 9", cols: 2 },
  { id: "comic", name: "条漫 · 公众号", en: "Comics & Articles", ratio: "3 / 4", cols: 4 },
  { id: "h5", name: "活动 H5 & 海报", en: "H5 & Posters", ratio: "auto", cols: 1 },
];

// 字段说明
//   category  所属分类，对应上面 CATEGORIES 的 id
//   title     原始作品标题（未补充时留空，页面显示"标题待补充"）
//   platform  所属平台；不是平台作品时留空，页面不显示平台标签
//   tags      内容主题标签
//   plays     已核实的播放量，例如 "1500w+"；没有时留 null
//   likes     已核实的点赞数（可选），例如 "36.8w"；没有就不写
//   cover     原始封面路径，例如 "assets/covers/01.jpg"；没有时留 null，页面显示占位
//   url       原作品链接；没有时留 null
//   video     本地视频文件，例如 "assets/videos/xhs-01.mp4"；有它时卡片里可以直接播放
//   image     截图类作品的图片路径（group 为 shot 时用）
//   group     分区内的小组，对应 CATEGORIES 里 groups 的 id
//   audience  目标人群（可选），例如 "高净值人群"；单独用金色标签显示
//
// 规则：封面只用原始封面，数据只填核实过的数字，不要编。

const slots = (category, n, extra = {}) =>
  Array.from({ length: n }, () => ({
    category,
    title: "",
    platform: "",
    tags: [],
    plays: null,
    cover: null,
    url: null,
    ...extra,
  }));
export const WORKS = [
  {
    title: "老公变得越来越沉默了，聪明的女人如何拯救婚姻？",
    platform: "抖音",
    tags: ["婚姻关系", "中年夫妻"],
    plays: "1534.1w",
    likes: "36.8w",
    cover: "assets/covers/01.jpg",
    url: "https://v.douyin.com/_owHbuQPqcY/",
    category: "viral",
  },
  {
    title: "被孤立又如何呢，人要拥有被讨厌的勇气！",
    platform: "抖音",
    tags: ["家庭教育", "人际关系"],
    plays: "1153w",
    likes: "24.1w",
    cover: "assets/covers/02.jpg",
    url: "https://v.douyin.com/_NsDfeiLCc4/",
    category: "viral",
  },
  {
    title: "学校和家长的一次冲突，葬送了12岁孩子的生命！",
    platform: "抖音",
    tags: ["学校教育", "亲子沟通"],
    plays: "1021.3w",
    likes: "13.1w",
    cover: "assets/covers/03.jpg",
    url: "https://v.douyin.com/WggLnV-SirQ/",
    category: "viral",
  },
  {
    title: "一个教育界公认的秘密，学霸都是\"套路\"出来的！",
    platform: "抖音",
    tags: ["学习习惯", "内驱力"],
    plays: "568.7w",
    likes: "12.9w",
    cover: "assets/covers/04.jpg",
    url: "https://v.douyin.com/wDwvkXQZRxg/",
    category: "viral",
  },
  {
    title: "警惕二次元里的畸形圈子，很多家长压根没意识到危险！",
    platform: "抖音",
    tags: ["二次元", "家庭教育"],
    plays: "833.6w",
    likes: "12.8w",
    cover: "assets/covers/05.jpg",
    url: "https://v.douyin.com/lRVbZ6QwAnA/",
    category: "viral",
  },
  {
    title: "孩子在该学习的年纪逃避吃苦，会后悔一生！",
    platform: "抖音",
    tags: ["学习习惯", "家长必读"],
    plays: "361.5w",
    likes: "7.5w",
    cover: "assets/covers/06.jpg",
    url: "https://v.douyin.com/1AyuNZD2Z7Q/",
    category: "viral",
  },
  {
    title: "16岁男孩睡梦中被室友捅死，警惕孩子身边的伥鬼朋友！",
    platform: "抖音",
    tags: ["学校教育", "人际关系"],
    plays: "337.7w",
    likes: "7.6w",
    cover: "assets/covers/07.jpg",
    url: "https://v.douyin.com/_3bSn5KBbI0/",
    category: "viral",
  },
  {
    title: "小学不培养学习习惯，中高考会遭到\"反噬\"！",
    platform: "抖音",
    tags: ["学习习惯", "小学教育"],
    plays: "543.5w",
    likes: "6.6w",
    cover: "assets/covers/08.jpg",
    url: "https://v.douyin.com/av4bakhctyo/",
    category: "viral",
  },

  // ---- 精选第三行 ----
  {
    title: "耗时300小时制作，一口气带你了解跨境电商如何从0做到1.3亿！",
    platform: "抖音",
    tags: ["商业思维", "创业"],
    plays: "853.6w",
    likes: "16.4w",
    cover: "assets/covers/09.jpg",
    url: "https://v.douyin.com/Pca25OwwAZc/",
    category: "viral",
  },
  {
    title: "超硬核！12分钟深度拆解：2人起盘，如何把穿戴甲在海外卖到1600万？",
    platform: "抖音",
    tags: ["商业思维", "创业干货"],
    plays: "153.2w",
    likes: "2.3w",
    cover: "assets/covers/10.jpg",
    url: "https://v.douyin.com/qnZ08GEGH4c/",
    category: "viral",
  },
  {
    title: "80后是犯了天条了，好事一件没碰上…",
    platform: "抖音",
    tags: ["80后", "高考"],
    plays: "436.5w",
    likes: "6.1w",
    cover: "assets/covers/11.jpg",
    url: "https://v.douyin.com/mgDDpS1DDro/",
    category: "viral",
  },
  {
    title: "父亲为我下跪借钱，成为我一生的指路人…",
    platform: "抖音",
    tags: ["父爱", "家庭教育"],
    plays: "245.1w",
    likes: "3.2w",
    cover: "assets/covers/12.jpg",
    url: "https://v.douyin.com/waTqhAhl6UU/",
    category: "viral",
  },

  // ---- 其他分类：待填位置 ----
  // 小红书原视频：账号已注销，视频文件放在网站里直接播放；标题取自成片文件名
  ...[
    { n: 1, title: "人口大量流失的香港，还有可能重现辉煌吗？" },
    { n: 2, title: "中产集体返贫，该如何避免？" },
    { n: 3, title: "存够288万，原地退休" },
    { n: 4, title: "打破养老神话：年金险的坑在哪？" },
  ].map(({ n, title }) => ({
    category: "private",
    group: "video",
    platform: "小红书",
    title,
    tags: ["财经", "保险"],
    audience: "高净值人群",
    plays: null,
    cover: `assets/videos/xhs-0${n}.jpg`,
    video: `assets/videos/xhs-0${n}.mp4`,
    url: null,
  })),
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    category: "private",
    group: "shot",
    title: "",
    image: `assets/shots/xhs-0${n}.png`,
  })),
  ...[1, 2, 3, 4, 5].map((n) => ({
    category: "private",
    group: "lead",
    title: "",
    image: `assets/shots/lead-0${n}.jpg`,
  })),
  // 宣传片：本地视频，页面里直接播放
  ...[
    { n: 1, title: "声希AI课宣传片" },
    { n: 2, title: "七田真启蒙宣传片" },
  ].map(({ n, title }) => ({
    category: "promo",
    title,
    platform: "",
    tags: [],
    plays: null,
    cover: `assets/videos/promo-0${n}.jpg`,
    video: `assets/videos/promo-0${n}.mp4`,
    url: null,
  })),
  {
    category: "comic",
    title: "一个活动，多组投票，TA能做到！",
    platform: "公众号",
    tags: ["条漫"],
    plays: null,
    cover: "assets/covers/comic-01.jpg",
    url: "https://mp.weixin.qq.com/s?__biz=MzAwODIyOTg2Mw==&mid=2650714508&idx=2&sn=f142f6603e6711fce327c3f13b310484&chksm=83781704b40f9e1233f1ccca01939ee3a6ccdc2bac433201a166ca5cbeb6d3a7054bf6cb269a&token=1380404564&lang=zh_CN#rd",
  },
  {
    category: "comic",
    title: "如何利用LBS大数据进行精准用户营销？",
    platform: "公众号",
    tags: ["条漫"],
    plays: null,
    cover: "assets/covers/comic-02.jpg",
    url: "https://mp.weixin.qq.com/s?__biz=MzAwODIyOTg2Mw==&mid=2650712839&idx=1&sn=9e20eafe18600e997e613e682768a9dd&chksm=83780d8fb40f8499f52690b20bb2521415303e9457184946f71f29728e572e96a417888eb0cf&token=1380404564&lang=zh_CN#rd",
  },
  {
    category: "comic",
    title: "这个功能，只有专业的\"运营人\"才知道有多重要！",
    platform: "公众号",
    tags: ["条漫"],
    plays: null,
    cover: "assets/covers/comic-03.jpg",
    url: "https://mp.weixin.qq.com/s?__biz=MzAwODIyOTg2Mw==&mid=2650712340&idx=1&sn=ebaffe49d2b7c1318604b1d377cf3c31&chksm=83780f9cb40f868afc060a1a6adfff603a2b4abb371acfb8fe93a318b246042c3a1618d4e1db&token=1380404564&lang=zh_CN#rd",
  },
  {
    category: "comic",
    title: "2020用户年度大数据报告 | 声希AI课",
    platform: "公众号",
    tags: ["长图", "年度报告"],
    plays: null,
    cover: "assets/covers/comic-04.jpg",
    url: "https://mp.weixin.qq.com/s?__biz=Mzg4NjAzNzU5NA==&mid=2247490563&idx=1&sn=8ef998c20396db9f3e8b6def2026b1d5&chksm=cf9e9136f8e918202ae80a267a32f873bbd8563b0f641e28a65ad2b912b749dc996b421429b5&token=1984403145&lang=zh_CN#rd",
  },
  // 活动长图海报：整张按原比例显示
  {
    category: "h5",
    group: "shot",
    title: "兔展专业定制 · 活动长图海报",
    image: "assets/shots/h5-01.jpg",
  },
];