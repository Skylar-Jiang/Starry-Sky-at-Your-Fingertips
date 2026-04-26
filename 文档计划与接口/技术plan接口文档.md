《指尖星空》第一阶段技术开发 Plan
0. 第一阶段统一目标

第一阶段只需要跑通这个流程：

打开 Demo
↓
看到星空小星球主界面
↓
点击“记录情绪”
↓
输入一段文字
↓
选择情绪：平静 / 开心 / 难过
↓
点击完成
↓
出现纸张
↓
点击“折成纸团”
↓
纸张变成纸团
↓
点击或拖拽投掷纸团
↓
纸团飞向天空
↓
变成对应情绪颜色/样式的星星
↓
场景根据情绪变化
↓
点击星星
↓
回看刚才写下的文字

第一阶段不做：

1. Gemini 自动判断情绪
2. 手势识别
3. 录音
4. 照片导入
5. 3D 星盘
6. 多日记本完整管理
7. 账号系统
8. 云端存储
9. 复杂星座生成
10. 小王子手部实时同步

第一阶段可以预留字段和接口，但不真正实现这些大功能。

1. 技术分工总览
技术 A：数据闭环负责人

技术 A 负责：

主界面
记录入口
文字输入
情绪选择
生成 record 数据
本地保存
星星详情回看
和技术 B 的数据对接

一句话：
技术 A 保证“用户写下来的东西能被保存，并且之后能点星星回看”。

技术 B：视觉转化闭环负责人

技术 B 负责：

emotionConfig.js
纸张展示
折纸团动画
纸团投掷
生成星星
星星样式
场景情绪反馈
雨滴 / 光点等简单特效

一句话：
技术 B 保证“情绪记录能被视觉化，变成纸团，投向天空，成为星星”。

2. 推荐项目结构
demo_project/
  public/
    assets/
      background/
        bg_calm.png
        bg_happy.png
        bg_sad.png
        planet_ground.png

      character/
        traveler_calm.png
        traveler_happy.png
        traveler_sad.png

      fox/
        fox_calm.png
        fox_comfort.png

      rose/
        rose_normal.png
        rose_bloom.png
        rose_wilt.png

      objects/
        paper_flat.png
        paper_ball.png
        star_calm.png
        star_happy.png
        star_sad.png

      effects/
        rain_drop.png
        glow_particle.png

      ui/
        notebook_closed.png
        notebook_open.png
        feather_pen.png
        button_base.png
        popup_base.png

      audio/
        audio_calm.mp3
        audio_happy.mp3
        audio_rain.mp3
        sfx_fold.mp3
        sfx_star.mp3

  src/
    App.jsx

    config/
      emotionConfig.js

    components/
      MainScene.jsx
      DiaryModal.jsx
      EmotionSelector.jsx

      PaperNote.jsx
      PaperBall.jsx
      StarLayer.jsx
      StarItem.jsx
      StarDetailModal.jsx
      SceneEffects.jsx

    utils/
      storage.js
      id.js
      time.js
      audio.js

  README.md
  asset_checklist.md

第一阶段为了减少合并风险，建议不要拆太碎。
如果你们时间很紧，可以不做 NotebookShelf，直接用 DiaryModal 作为记录弹窗。

3. 核心数据结构
3.1 EmotionKey
type EmotionKey = "calm" | "happy" | "sad";

对应中文：

const emotionLabelMap = {
  calm: "平静",
  happy: "开心",
  sad: "难过"
};
3.2 Star 数据结构
type Star = {
  id: string;
  x: number;
  y: number;
};

字段说明：

字段	类型	说明
id	string	星星唯一 ID
x	number	星星在天空区域的横坐标
y	number	星星在天空区域的纵坐标
3.3 Record 数据结构
type EmotionRecord = {
  id: string;
  text: string;
  emotion: "calm" | "happy" | "sad";
  createdAt: string;

  star: {
    id: string;
    x: number;
    y: number;
  } | null;

  title: string;
  aiSuggestedEmotion: string;
  aiFeedback: string;
  favorite: boolean;
  deleted: boolean;

  audioUrl: string;
  imageUrl: string;
  diaryBookId: string;
  gestureCreated: boolean;
};

第一阶段创建时建议这样：

{
  id: "record_001",
  text: "今天有点累，但我想把它交给星空。",
  emotion: "sad",
  createdAt: "2026-04-25 21:00:00",

  star: null,

  title: "",
  aiSuggestedEmotion: "",
  aiFeedback: "这颗星星已经替你收下了今天的心情。",
  favorite: false,
  deleted: false,

  audioUrl: "",
  imageUrl: "",
  diaryBookId: "default",
  gestureCreated: false
}

注意：
刚写完记录时，star 可以先是 null。
等技术 B 完成投掷后，再把星星坐标回传给技术 A。

4. 技术 A 详细 Plan
4.1 技术 A 总目标

技术 A 要完成：

1. 页面能打开
2. 能点击记录情绪
3. 能输入文字
4. 能选择平静 / 开心 / 难过
5. 能生成完整 record
6. 能把 pendingRecord 传给技术 B
7. 能接收技术 B 回传的 star
8. 能保存 records
9. 点击星星能回看文字
4.2 技术 A 负责文件
src/App.jsx
src/components/MainScene.jsx
src/components/DiaryModal.jsx
src/components/EmotionSelector.jsx
src/components/StarDetailModal.jsx
src/utils/storage.js
src/utils/id.js
src/utils/time.js

技术 A 可以先写一个最基础版 StarLayer.jsx，但最终星星样式和情绪效果建议交给技术 B。

4.3 技术 A 开发阶段
Day 1：项目框架 + 主界面 + 输入弹窗

任务：

1. 搭建 React + Vite 项目
2. 创建基础目录
3. 实现 App.jsx
4. 实现 MainScene.jsx
5. 实现“记录情绪”按钮
6. 实现 DiaryModal.jsx
7. 实现 EmotionSelector.jsx

验收：

1. 页面能打开
2. 能看到主界面
3. 点击“记录情绪”能打开弹窗
4. 能输入文字
5. 能选择平静 / 开心 / 难过
Day 2：生成 record + 数据保存

任务：

1. 点击完成后生成 record
2. record 包含完整字段
3. 创建 utils/id.js
4. 创建 utils/time.js
5. 创建 utils/storage.js
6. records 进入 App 全局状态
7. pendingRecord 传给技术 B

验收：

1. 输入文字后点击完成，控制台能看到完整 record
2. records 数组中新增一条数据
3. pendingRecord 能传给技术 B 的纸张组件
4. 空文本不能提交
Day 3：星星详情回看

任务：

1. 实现 StarDetailModal.jsx
2. 点击星星后显示原文
3. 显示情绪中文名
4. 显示创建时间
5. 显示固定温柔反馈语

验收：

1. 点击星星能打开详情
2. 详情内容和原记录一致
3. 能关闭详情弹窗
Day 4：localStorage + 和 B 合并

任务：

1. 实现 localStorage 保存 records
2. 页面刷新后恢复 records
3. 接入技术 B 的 onThrowComplete
4. 投掷完成后更新 record.star
5. 保存更新后的 records

验收：

1. 投掷后星星出现
2. 刷新后星星仍存在
3. 点击星星仍能回看文字
Day 5：修 bug + 演示稳定

任务：

1. 清理控制台报错
2. 优化弹窗样式
3. 加一个开发用清空数据按钮
4. 加 1 条预置演示数据，可选
5. 和技术 B 完整跑通演示流程

验收：

打开页面
↓
记录情绪
↓
输入文字
↓
选择难过
↓
完成
↓
纸张出现
↓
折成纸团
↓
投掷
↓
生成星星
↓
点击星星
↓
看到刚才输入的文字
4.4 技术 A 组件说明
4.4.1 App.jsx

职责：

全局状态管理
主流程控制
A/B 接口承接
localStorage 初始化和保存

建议状态：

const [records, setRecords] = useState([]);
const [currentEmotion, setCurrentEmotion] = useState("calm");
const [isDiaryOpen, setIsDiaryOpen] = useState(false);
const [pendingRecord, setPendingRecord] = useState(null);
const [selectedRecord, setSelectedRecord] = useState(null);

建议方法：

function handleOpenDiary() {}

function handleCloseDiary() {}

function handleCreateRecord(record) {}

function handleThrowComplete(payload) {}

function handleSelectStar(record) {}

function handleCloseStarDetail() {}

function handleClearRecords() {}
4.4.2 MainScene.jsx

职责：

显示主界面
显示记录按钮
承载星星层
承载场景背景

Props：

type MainSceneProps = {
  records: EmotionRecord[];
  currentEmotion: EmotionKey;
  onOpenDiary: () => void;
  onSelectStar: (record: EmotionRecord) => void;
};
4.4.3 DiaryModal.jsx

职责：

输入文字
选择情绪
点击完成生成 record

Props：

type DiaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    text: string;
    emotion: EmotionKey;
  }) => void;
};

提交规则：

1. text.trim() 不能为空
2. emotion 必须是 calm / happy / sad
3. 提交后清空输入框
4. 提交后关闭弹窗
4.4.4 EmotionSelector.jsx

职责：

渲染 3 个情绪按钮

Props：

type EmotionSelectorProps = {
  value: EmotionKey;
  onChange: (emotion: EmotionKey) => void;
};

按钮：

平静 calm
开心 happy
难过 sad
4.4.5 StarDetailModal.jsx

职责：

点击星星后回看记录

Props：

type StarDetailModalProps = {
  record: EmotionRecord | null;
  onClose: () => void;
};

展示内容：

1. 原文 text
2. 情绪 label
3. 创建时间 createdAt
4. 固定反馈 aiFeedback
4.5 技术 A 工具函数
utils/id.js
export function createRecordId() {
  return `record_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createStarId() {
  return `star_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
utils/time.js
export function getCurrentTimeText() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
utils/storage.js
const STORAGE_KEY = "fingertip_starry_sky_records";

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error("loadRecords failed:", error);
    return [];
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("saveRecords failed:", error);
  }
}

export function clearRecords() {
  localStorage.removeItem(STORAGE_KEY);
}
5. 技术 B 详细 Plan
5.1 技术 B 总目标

技术 B 要完成：

1. 接收技术 A 传来的 pendingRecord
2. 显示纸张
3. 点击折成纸团
4. 纸张变纸团
5. 点击或拖拽投掷
6. 纸团飞向天空
7. 投掷结束生成星星坐标
8. 把 star 坐标回传给技术 A
9. 根据情绪显示不同星星和场景
10. 点击星星时触发技术 A 的回看弹窗
5.2 技术 B 负责文件
src/config/emotionConfig.js
src/components/PaperNote.jsx
src/components/PaperBall.jsx
src/components/StarLayer.jsx
src/components/StarItem.jsx
src/components/SceneEffects.jsx
src/utils/audio.js
5.3 技术 B 开发阶段
Day 1：emotionConfig + 基础占位

任务：

1. 创建 emotionConfig.js
2. 配置 calm / happy / sad
3. 配置背景、角色、狐狸、玫瑰、星星、特效、音频路径
4. 创建 PaperNote.jsx 占位
5. 创建 StarLayer.jsx 占位

验收：

1. emotionConfig 能被其他组件读取
2. 三种情绪 label 正确
3. 素材路径不散落在组件里
Day 2：纸张 + 折纸团

任务：

1. A 提交记录后显示 PaperNote
2. PaperNote 展示文字摘要
3. 点击“折成纸团”
4. 播放折纸团动画
5. 动画结束后显示 PaperBall

验收：

1. 用户写完后能看到纸张
2. 点击按钮后纸张有缩小/旋转/淡出效果
3. 纸团出现
Day 3：投掷 + 生成星星

任务：

1. PaperBall 支持点击投掷
2. 优先保证点击投掷稳定
3. 有时间再做拖拽投掷
4. 投掷后纸团飞向天空
5. 动画结束后生成 star 坐标
6. 调用 onThrowComplete

验收：

1. 点击纸团能飞向天空
2. 投掷结束后纸团消失
3. 星星出现
4. A 能拿到 star 坐标并保存
Day 4：场景反馈 + 特效

任务：

1. 根据 currentEmotion 切换背景
2. 根据 currentEmotion 切换角色/狐狸/玫瑰
3. sad 显示雨滴
4. happy 显示光点
5. calm 显示安静星空
6. 星星轻微闪烁

验收：

1. 选开心后场景变明亮/有光点
2. 选难过后场景变暗/有雨滴
3. 选平静后回到默认状态
4. 特效不影响点击按钮和星星
Day 5：合并 + 降级方案 + 演示稳定

任务：

1. 和技术 A 合并
2. 检查完整流程
3. 如果拖拽不稳，保留点击投掷
4. 如果雨滴卡顿，减少雨滴数量
5. 如果素材缺失，用 CSS 占位
6. 修复样式穿透、层级遮挡问题

验收：

1. 完整流程可连续演示 3 次不崩
2. 星星可点击
3. 场景能切换
4. localStorage 不受动画影响
5.4 技术 B 组件说明
5.4.1 emotionConfig.js

职责：

统一管理情绪对应的素材、颜色、特效、音频、文案

示例：

export const emotionConfig = {
  calm: {
    label: "平静",
    background: "/assets/background/bg_calm.png",
    character: "/assets/character/traveler_calm.png",
    fox: "/assets/fox/fox_calm.png",
    rose: "/assets/rose/rose_normal.png",
    star: "/assets/objects/star_calm.png",
    starColor: "#BFDFFF",
    effects: [],
    audio: "/assets/audio/audio_calm.mp3",
    feedbackText: "这颗星星安静地落在了夜空里。"
  },

  happy: {
    label: "开心",
    background: "/assets/background/bg_happy.png",
    character: "/assets/character/traveler_happy.png",
    fox: "/assets/fox/fox_calm.png",
    rose: "/assets/rose/rose_bloom.png",
    star: "/assets/objects/star_happy.png",
    starColor: "#FFD66B",
    effects: ["glow"],
    audio: "/assets/audio/audio_happy.mp3",
    feedbackText: "这份开心正在夜空里闪闪发光。"
  },

  sad: {
    label: "难过",
    background: "/assets/background/bg_sad.png",
    character: "/assets/character/traveler_sad.png",
    fox: "/assets/fox/fox_comfort.png",
    rose: "/assets/rose/rose_wilt.png",
    star: "/assets/objects/star_sad.png",
    starColor: "#8FB7FF",
    effects: ["rain"],
    audio: "/assets/audio/audio_rain.mp3",
    feedbackText: "这颗星星会替你暂时收藏这份难过。"
  }
};

硬性要求：

1. 组件里不要到处写素材路径
2. 第二阶段新增情绪时，只改 emotionConfig
3. 不要在多个组件里重复写 emotion 判断逻辑
5.4.2 PaperNote.jsx

Props：

type PaperNoteProps = {
  record: EmotionRecord | null;
  onFoldComplete: () => void;
};

功能：

1. record 不存在时不显示
2. 显示纸张
3. 显示用户文字摘要
4. 点击“折成纸团”
5. 播放折叠动画
6. 动画结束后调用 onFoldComplete
5.4.3 PaperBall.jsx

Props：

type PaperBallProps = {
  record: EmotionRecord | null;
  onThrowComplete: (payload: ThrowCompletePayload) => void;
};

功能：

1. 显示纸团
2. 支持点击投掷
3. 支持拖拽投掷，可选
4. 计算最终星星位置
5. 投掷动画结束后调用 onThrowComplete
5.4.4 StarLayer.jsx

Props：

type StarLayerProps = {
  records: EmotionRecord[];
  onSelectStar: (record: EmotionRecord) => void;
};

功能：

1. 遍历 records
2. 过滤 deleted === true 的记录
3. 过滤 star === null 的记录
4. 渲染 StarItem
5. 点击星星时回传 record
5.4.5 StarItem.jsx

Props：

type StarItemProps = {
  record: EmotionRecord;
  onClick: (record: EmotionRecord) => void;
};

功能：

1. 根据 record.emotion 读取 emotionConfig
2. 显示对应星星素材
3. 设置 left = record.star.x
4. 设置 top = record.star.y
5. 点击时调用 onClick(record)
5.4.6 SceneEffects.jsx

Props：

type SceneEffectsProps = {
  emotion: EmotionKey;
};

功能：

1. 读取 emotionConfig[emotion].effects
2. 包含 rain 时显示雨滴
3. 包含 glow 时显示光点
4. calm 时不显示强特效

注意：

特效层必须 pointer-events: none;
否则会挡住按钮和星星点击。
6. A / B 接口文档
6.1 数据流总览
A：用户输入文字 + 选择情绪
↓
A：创建 record，star 暂时为 null
↓
A：把 record 设置为 pendingRecord
↓
B：读取 pendingRecord，显示纸张
↓
B：折纸团
↓
B：投掷纸团
↓
B：生成 star 坐标
↓
B：调用 onThrowComplete(payload)
↓
A：根据 recordId 找到 record，写入 star
↓
A：保存 records
↓
B：StarLayer 显示星星
↓
用户点击星星
↓
B：调用 onSelectStar(record)
↓
A：打开 StarDetailModal
6.2 A 给 B 的数据：pendingRecord
type PendingRecord = EmotionRecord;

示例：

{
  id: "record_001",
  text: "今天有点累，但我想把它交给星空。",
  emotion: "sad",
  createdAt: "2026-04-25 21:00:00",

  star: null,

  title: "",
  aiSuggestedEmotion: "",
  aiFeedback: "这颗星星已经替你收下了今天的心情。",
  favorite: false,
  deleted: false,

  audioUrl: "",
  imageUrl: "",
  diaryBookId: "default",
  gestureCreated: false
}
6.3 B 给 A 的数据：ThrowCompletePayload
type ThrowCompletePayload = {
  recordId: string;
  star: {
    id: string;
    x: number;
    y: number;
  };
};

示例：

{
  recordId: "record_001",
  star: {
    id: "star_001",
    x: 620,
    y: 160
  }
}
6.4 统一回调接口
onCreateRecord

由 A 内部使用。

onCreateRecord(data: {
  text: string;
  emotion: EmotionKey;
}) => void;

作用：

DiaryModal 提交后，生成完整 record。
onFoldComplete

由 B 内部使用，也可以不暴露给 A。

onFoldComplete() => void;

作用：

纸张折叠动画结束后，显示纸团。
onThrowComplete

B 调用，A 实现。

onThrowComplete(payload: {
  recordId: string;
  star: {
    id: string;
    x: number;
    y: number;
  };
}) => void;

作用：

投掷结束后，B 把星星坐标传给 A。

A 的处理逻辑：

function handleThrowComplete(payload) {
  const nextRecords = records.map((record) => {
    if (record.id !== payload.recordId) return record;

    return {
      ...record,
      star: payload.star
    };
  });

  setRecords(nextRecords);
  saveRecords(nextRecords);
  setPendingRecord(null);
  setCurrentEmotion(
    nextRecords.find((item) => item.id === payload.recordId)?.emotion || "calm"
  );
}
onSelectStar

B 调用，A 实现。

onSelectStar(record: EmotionRecord) => void;

作用：

用户点击星星后，A 打开详情弹窗。

A 的处理逻辑：

function handleSelectStar(record) {
  setSelectedRecord(record);
}
6.5 坐标约定

星星坐标使用页面中的天空区域坐标。

建议 B 生成坐标时限制范围：

const star = {
  id: createStarId(),
  x: randomBetween(120, window.innerWidth - 120),
  y: randomBetween(80, 280)
};

不要让星星生成在：

1. 记录按钮上
2. 日记本弹窗上
3. 小王子脸上
4. 页面最边缘
5. 纸团初始位置
6.6 层级约定

建议 z-index：

.background-layer {
  z-index: 0;
}

.scene-object-layer {
  z-index: 10;
}

.star-layer {
  z-index: 20;
}

.effects-layer {
  z-index: 30;
  pointer-events: none;
}

.paper-layer {
  z-index: 40;
}

.modal-layer {
  z-index: 100;
}

注意：
effects-layer 必须加：

pointer-events: none;

否则雨滴或光点会挡住按钮点击。

7. 合并规则
7.1 分支建议
main
feature/tech-a-core-flow
feature/tech-b-visual-flow

技术 A 在：

feature/tech-a-core-flow

技术 B 在：

feature/tech-b-visual-flow

每天合并一次到 main 或 dev。

7.2 每天合并检查

每次合并前跑：

1. npm install
2. npm run dev
3. 页面是否能打开
4. 控制台是否有红色报错
5. 记录弹窗是否能打开
6. 是否能创建 record
7. 是否能折纸团
8. 是否能投掷
9. 是否能点击星星回看
7.3 冲突避免

A 尽量不要改：

PaperNote.jsx
PaperBall.jsx
SceneEffects.jsx
emotionConfig.js

B 尽量不要改：

DiaryModal.jsx
EmotionSelector.jsx
StarDetailModal.jsx
storage.js

双方都会改的文件：

App.jsx
MainScene.jsx
StarLayer.jsx

这几个文件需要提前约定接口，避免互相覆盖。

8. 降级方案

为了保证第一阶段一定能交付，必须接受降级。

功能	理想版	降级版
日记本	有关闭/打开动画	直接弹出记录面板
折纸团	复杂折叠动画	缩小 + 旋转 + 淡出
投掷	鼠标拖拽甩出	点击纸团自动飞出
星星生成	粒子爆裂	星星淡入
场景反馈	背景、角色、狐狸、玫瑰全切换	先切背景和星星颜色
sad 效果	雨滴 + 暗色 + 音效	只做雨滴或暗色
happy 效果	金色光点 + 轻快音效	只做光点
localStorage	完整保存所有数据	至少保存 records

第一阶段最重要的是完整流程，不是动画精细度。

9. 最终交付物
技术 A 交付物
1. App.jsx
2. MainScene.jsx
3. DiaryModal.jsx
4. EmotionSelector.jsx
5. StarDetailModal.jsx
6. utils/storage.js
7. utils/id.js
8. utils/time.js
9. record 数据结构说明
10. A/B 接口说明
技术 B 交付物
1. config/emotionConfig.js
2. PaperNote.jsx
3. PaperBall.jsx
4. StarLayer.jsx
5. StarItem.jsx
6. SceneEffects.jsx
7. utils/audio.js
8. 折纸团动画样式
9. 投掷动画样式
10. 雨滴 / 光点特效样式
项目整体交付物
1. 可运行 demo_project
2. README.md
3. asset_checklist.md
4. 第一阶段功能说明
5. 未实现功能说明
6. 演示流程说明
10. README.md 建议模板
# 指尖星空 第一阶段 Demo

## 运行方式

npm install
npm run dev

## 第一阶段目标

跑通：
记录情绪 → 折成纸团 → 投向星空 → 变成星星 → 点击星星回看。

## 已实现功能

- 星空主界面
- 情绪记录输入
- 平静 / 开心 / 难过 三种情绪
- 折纸团
- 点击或拖拽投掷
- 生成星星
- 情绪场景反馈
- 点击星星回看文字
- localStorage 本地保存

## 技术分工

技术 A：
- 主界面
- 记录弹窗
- 情绪选择
- 数据保存
- 星星详情回看

技术 B：
- emotionConfig
- 折纸团动画
- 纸团投掷
- 星星生成
- 场景切换
- 雨滴 / 光点效果

## 暂未实现

- Gemini 自动判断情绪
- 手势识别
- 录音
- 照片导入
- 3D 星盘
- 多日记本完整管理
- 云端账号系统

## 数据结构

record 包含：
id、text、emotion、createdAt、star、title、aiSuggestedEmotion、aiFeedback、favorite、deleted、audioUrl、imageUrl、diaryBookId、gestureCreated。
11. 最终验收标准
技术 A 验收
1. 页面能打开
2. 点击“记录情绪”能打开输入界面
3. 能输入文字
4. 能选择 calm / happy / sad
5. 点击完成能生成 record
6. record 字段完整
7. 能把 pendingRecord 交给 B
8. 能接收 B 的 star 坐标
9. records 能保存
10. 点击星星能看到原文、情绪、时间
11. localStorage 刷新后不丢数据，建议完成
技术 B 验收
1. 能读取 pendingRecord
2. 能显示纸张
3. 能点击折成纸团
4. 纸张能变成纸团
5. 纸团能点击或拖拽投掷
6. 投掷后能生成 star 坐标
7. 能调用 onThrowComplete
8. 星星按情绪显示不同样式
9. 场景按情绪切换
10. happy 有光点或明亮反馈
11. sad 有雨滴或暗色反馈
12. 星星点击能触发 onSelectStar
13. 特效不挡按钮和星星
12. 可以直接发给技术 A 的版本
你负责第一阶段 Demo 的“数据闭环”。

请完成：
1. React + Vite 项目基础结构。
2. 主界面 MainScene。
3. 点击“记录情绪”后打开记录弹窗。
4. 支持输入文字。
5. 支持选择 calm / happy / sad 三个情绪。
6. 点击完成后生成完整 record。
7. record 必须包含：
   id、text、emotion、createdAt、star、title、aiSuggestedEmotion、aiFeedback、favorite、deleted、audioUrl、imageUrl、diaryBookId、gestureCreated。
8. 新创建的 record 的 star 先设为 null。
9. 把新创建的 record 设置为 pendingRecord，交给技术 B 展示纸张和投掷。
10. 实现 onThrowComplete，接收技术 B 回传的 recordId 和 star 坐标。
11. 根据 recordId 找到对应 record，把 star 写入 record。
12. 保存 records。
13. 实现点击星星后打开 StarDetailModal。
14. StarDetailModal 显示原文、情绪、时间和固定反馈语。
15. 实现 localStorage，刷新后记录和星星不丢。
16. 代码要拆组件，不要全部写在 App.jsx。

第一阶段不做 Gemini、手势、录音、照片导入、3D 星盘、多日记本完整管理。
13. 可以直接发给技术 B 的版本
你负责第一阶段 Demo 的“视觉转化闭环”。

请完成：
1. 创建 emotionConfig.js。
2. emotionConfig 中配置 calm / happy / sad 三种情绪。
3. 每种情绪配置：
   label、background、character、fox、rose、star、starColor、effects、audio、feedbackText。
4. 所有素材路径必须从 emotionConfig 读取，不要散落在组件里。
5. 接收技术 A 传来的 pendingRecord。
6. pendingRecord 存在时显示 PaperNote。
7. PaperNote 展示用户文字摘要和“折成纸团”按钮。
8. 点击“折成纸团”后，纸张缩小、旋转、淡出。
9. 折叠结束后显示 PaperBall。
10. PaperBall 支持点击投掷。
11. 如果时间允许，再做鼠标拖拽投掷。
12. 投掷后纸团飞向天空。
13. 投掷动画结束后生成 star 坐标。
14. 调用 onThrowComplete({ recordId, star })，把 star 坐标传回技术 A。
15. 实现 StarLayer 和 StarItem。
16. StarItem 根据 record.emotion 显示不同星星样式。
17. 点击星星时调用 onSelectStar(record)。
18. 根据 currentEmotion 切换场景：
    calm：安静星空；
    happy：更亮背景、金色星星、光点；
    sad：暗色背景、雨滴、狐狸安慰、玫瑰低垂。
19. SceneEffects 的特效层必须 pointer-events: none，不能挡点击。
20. 如果拖拽投掷不稳定，优先保证点击投掷稳定。

第一阶段不做手势识别、不做 3D 星盘、不做复杂星座、不做 Gemini。
14. 最重要的执行建议

你们第一阶段不要追求“完整产品感”，要追求稳定演示闭环。

优先顺序是：

第一优先：能写、能选情绪、能保存
第二优先：能折纸团、能投掷、能变星星
第三优先：能点击星星回看
第四优先：场景按情绪变化
第五优先：雨滴、光点、音效、美化

技术 A 先把数据跑通，技术 B 先把视觉跑通。
只要最后能稳定演示：

我写下一段难过
↓
把它折成纸团
↓
投向星空
↓
它变成一颗蓝色星星
↓
我点击星星能看到刚才的话