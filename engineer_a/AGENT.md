技术 A 第一阶段开发 Plan & 接口文档
1. 技术 A 职责范围

技术 A 负责第一阶段 Demo 的数据闭环和基础交互流程。

技术 A 要完成：

用户打开页面
↓
点击“记录情绪”
↓
输入文字
↓
选择情绪：平静 / 开心 / 难过
↓
点击完成
↓
生成一条 record 数据
↓
把 record 交给技术 B 做纸张/纸团/投掷
↓
接收技术 B 回传的星星坐标
↓
保存完整记录
↓
点击星星后回看原文字

技术 A 不负责：

1. 折纸团动画
2. 纸团拖拽 / 投掷动画
3. 雨滴 / 光点 / 粒子特效
4. 星星视觉样式
5. 情绪场景切换细节
6. 手势识别
7. Gemini 自动判断情绪
8. 录音 / 照片导入
9. 3D 星盘
2. 技术 A 文件负责范围

技术 A 主要负责这些文件：

src/
  App.jsx

  components/
    MainScene.jsx
    DiaryModal.jsx
    EmotionSelector.jsx
    StarDetailModal.jsx

  utils/
    storage.js
    id.js
    time.js

技术 A 需要配合技术 B 使用这些组件，但不一定主写：

src/
  components/
    PaperNote.jsx
    PaperBall.jsx
    StarLayer.jsx
    StarItem.jsx
    SceneEffects.jsx

  config/
    emotionConfig.js

emotionConfig.js 主要由技术 B 负责，但技术 A 的 EmotionSelector 和 StarDetailModal 需要读取里面的情绪中文名。

3. 技术 A 开发时间计划
Day 1：项目结构 + 主界面 + 记录弹窗
目标

先让页面能打开，用户能点击“记录情绪”，弹出输入框，并能选择三个情绪。

任务清单
1. 搭建 React + Vite 项目。
2. 创建基础目录结构。
3. 实现 App.jsx 的基础状态。
4. 实现 MainScene.jsx。
5. MainScene 中显示：
   - 星空背景占位
   - 小星球占位
   - 小王子 / 狐狸 / 玫瑰占位
   - “记录情绪”按钮
6. 实现 DiaryModal.jsx。
7. 实现 EmotionSelector.jsx。
8. 点击“记录情绪”后打开 DiaryModal。
9. DiaryModal 支持输入文字。
10. EmotionSelector 支持 calm / happy / sad 三种情绪。
Day 1 验收标准
1. npm run dev 能正常启动。
2. 页面无红色报错。
3. 点击“记录情绪”能打开弹窗。
4. 输入框可以输入文字。
5. 平静 / 开心 / 难过三个按钮可以点击。
6. 被选中的情绪有明显状态。
Day 2：生成 record 数据 + 交给技术 B
目标

用户点击完成后，生成完整 record 数据，并把它设置成 pendingRecord，让技术 B 可以开始展示纸张。

任务清单
1. 创建 utils/id.js。
2. 创建 utils/time.js。
3. 在 DiaryModal 中点击完成后提交 text 和 emotion。
4. 在 App.jsx 中根据 text 和 emotion 生成完整 record。
5. record.star 初始值设为 null。
6. record 必须包含第二、三阶段预留字段。
7. 把新 record 添加进 records。
8. 把新 record 设置为 pendingRecord。
9. 关闭 DiaryModal。
10. 把 pendingRecord 通过 props 传给技术 B 的 PaperNote / PaperFlow 组件。
Day 2 验收标准
1. 输入文字后点击完成，能生成 record。
2. record 中包含 id、text、emotion、createdAt、star 等字段。
3. star 初始为 null。
4. records 数组中新增一条记录。
5. pendingRecord 不为空。
6. 技术 B 能拿到 pendingRecord。
Day 3：接收技术 B 回传星星坐标
目标

技术 B 投掷纸团完成后，会回传 recordId 和 star。技术 A 需要把星星坐标写回对应 record。

任务清单
1. 在 App.jsx 中实现 handleThrowComplete。
2. handleThrowComplete 接收 payload。
3. 根据 payload.recordId 找到对应 record。
4. 把 payload.star 写入 record.star。
5. 清空 pendingRecord。
6. 更新 currentEmotion 为该 record 的 emotion。
7. 更新 records 状态。
8. 为后续 localStorage 保存做准备。
Day 3 验收标准
1. 技术 B 调用 onThrowComplete 后，record.star 不再是 null。
2. records 中对应 record 被正确更新。
3. pendingRecord 被清空。
4. currentEmotion 更新成刚刚投掷的情绪。
5. StarLayer 能根据 records 显示星星。
Day 4：星星详情回看 + localStorage
目标

用户点击星星后，能看到刚才写下的文字。页面刷新后，记录和星星最好还在。

任务清单
1. 实现 StarDetailModal.jsx。
2. 实现 handleSelectStar(record)。
3. 点击星星后设置 selectedRecord。
4. StarDetailModal 显示：
   - 原文 text
   - 情绪中文 label
   - 创建时间 createdAt
   - 固定反馈 aiFeedback
5. 创建 utils/storage.js。
6. 初始化页面时从 localStorage 读取 records。
7. records 变化后保存到 localStorage。
8. 增加开发用清空数据函数。
Day 4 验收标准
1. 点击星星能打开详情弹窗。
2. 弹窗显示原文、情绪、时间。
3. 弹窗可以关闭。
4. 刷新页面后，已生成的星星仍然存在。
5. 刷新后点击星星仍能回看文字。
Day 5：联调、修 bug、准备演示
目标

保证完整流程稳定演示。

任务清单
1. 和技术 B 完整合并。
2. 检查完整流程是否能跑通。
3. 修复弹窗层级、按钮遮挡、星星点击失效等问题。
4. 加入 1 条预置演示数据，可选。
5. 加入清空测试数据按钮，可选。
6. 清理 console 报错。
7. 整理 README 中技术 A 部分说明。
Day 5 最终验收流程
打开页面
↓
点击记录情绪
↓
输入：今天有点累，但我想把它交给星空
↓
选择：难过
↓
点击完成
↓
技术 B 显示纸张
↓
技术 B 折成纸团并投掷
↓
技术 A 接收 star 坐标
↓
页面生成星星
↓
点击星星
↓
弹窗显示刚才输入的文字
↓
刷新页面
↓
星星仍然存在
↓
再次点击还能回看
4. 技术 A 状态设计
4.1 App.jsx 全局状态
const [records, setRecords] = useState([]);
const [currentEmotion, setCurrentEmotion] = useState("calm");
const [isDiaryOpen, setIsDiaryOpen] = useState(false);
const [pendingRecord, setPendingRecord] = useState(null);
const [selectedRecord, setSelectedRecord] = useState(null);
4.2 状态说明
状态名	类型	说明
records	EmotionRecord[]	所有情绪记录
currentEmotion	"calm" | "happy" | "sad"	当前场景情绪
isDiaryOpen	boolean	是否打开记录弹窗
pendingRecord	EmotionRecord | null	已写完但还没投掷成星星的记录
selectedRecord	EmotionRecord | null	当前点击查看的星星记录
5. 核心数据结构文档
5.1 EmotionKey
type EmotionKey = "calm" | "happy" | "sad";

对应关系：

const emotionLabelMap = {
  calm: "平静",
  happy: "开心",
  sad: "难过"
};
5.2 Star
type Star = {
  id: string;
  x: number;
  y: number;
};

说明：

字段	类型	说明
id	string	星星唯一 ID
x	number	星星横坐标
y	number	星星纵坐标
5.3 EmotionRecord
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
5.4 新建 record 示例

技术 A 在用户点击完成时生成：

{
  id: "record_1714032000000_x8f2ka",
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

1. star 初始必须是 null。
2. 投掷完成后，由技术 B 回传 star。
3. 技术 A 再把 star 写回 record。
6. 技术 A 组件接口文档
6.1 App.jsx
职责
1. 管理 records。
2. 管理 pendingRecord。
3. 管理 currentEmotion。
4. 管理弹窗开关。
5. 接收技术 B 的 onThrowComplete。
6. 处理点击星星回看。
7. 处理 localStorage。
需要实现的方法
function handleOpenDiary() {}

function handleCloseDiary() {}

function handleCreateRecord(data) {}

function handleThrowComplete(payload) {}

function handleSelectStar(record) {}

function handleCloseStarDetail() {}

function handleClearRecords() {}
6.2 MainScene.jsx
职责

主界面骨架，由技术 A 实现基础结构。

Props
type MainSceneProps = {
  records: EmotionRecord[];
  currentEmotion: EmotionKey;
  pendingRecord: EmotionRecord | null;

  onOpenDiary: () => void;
  onThrowComplete: (payload: ThrowCompletePayload) => void;
  onSelectStar: (record: EmotionRecord) => void;
};
显示内容
1. 星空背景区域。
2. 小星球区域。
3. 小王子 / 狐狸 / 玫瑰占位。
4. “记录情绪”按钮。
5. 技术 B 的 PaperNote / PaperBall 流程。
6. 技术 B 的 StarLayer。
注意

MainScene 不要直接处理 record 创建逻辑。
record 创建由 App.jsx 和 DiaryModal.jsx 完成。

6.3 DiaryModal.jsx
职责

负责记录输入弹窗。

Props
type DiaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecordInput) => void;
};
CreateRecordInput
type CreateRecordInput = {
  text: string;
  emotion: EmotionKey;
};
内部状态
const [text, setText] = useState("");
const [emotion, setEmotion] = useState("calm");
const [error, setError] = useState("");
提交规则
1. text.trim() 不能为空。
2. emotion 必须是 calm / happy / sad。
3. 提交时调用 onSubmit({ text, emotion })。
4. 提交成功后清空 text。
5. 提交成功后重置 emotion 为 calm。
6. 提交成功后关闭弹窗。
错误提示

如果用户没写文字：

请先写下一点想交给星空的话。
6.4 EmotionSelector.jsx
职责

显示三个情绪按钮。

Props
type EmotionSelectorProps = {
  value: EmotionKey;
  onChange: (emotion: EmotionKey) => void;
};
支持情绪
const emotions = [
  { key: "calm", label: "平静" },
  { key: "happy", label: "开心" },
  { key: "sad", label: "难过" }
];
验收要求
1. 三个按钮都可点击。
2. 选中状态明显。
3. 点击后调用 onChange。
4. 不要在这里写复杂场景逻辑。
6.5 StarDetailModal.jsx
职责

点击星星后展示记录详情。

Props
type StarDetailModalProps = {
  record: EmotionRecord | null;
  onClose: () => void;
};
展示内容
1. text：用户原文。
2. emotion：情绪中文名。
3. createdAt：创建时间。
4. aiFeedback：固定温柔反馈语。
展示示例
情绪：难过
时间：2026-04-25 21:00:00

今天有点累，但我想把它交给星空。

这颗星星已经替你收下了今天的心情。
行为
1. record 为 null 时不显示。
2. 点击关闭按钮调用 onClose。
3. 不修改 record 数据。
7. 技术 A 工具函数接口文档
7.1 utils/id.js
职责

生成唯一 ID。

接口
export function createRecordId() {
  return `record_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createStarId() {
  return `star_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
技术 A 使用

技术 A 主要使用：

createRecordId()

createStarId() 主要给技术 B 使用，如果 B 不自己写，可以从这里导入。

7.2 utils/time.js
职责

生成统一格式的时间字符串。

接口
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
返回示例
2026-04-25 21:00:00
7.3 utils/storage.js
职责

封装 localStorage，不要在组件里到处直接操作 localStorage。

Storage Key
const STORAGE_KEY = "fingertip_starry_sky_records";
接口
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
使用要求
1. 页面初始化时调用 loadRecords。
2. records 更新后调用 saveRecords。
3. 开发阶段可用 clearRecords 清空测试数据。
4. localStorage 解析失败时不能让页面崩溃。
8. A 与 B 的接口文档
8.1 总数据流
A：用户输入文字 + 选择情绪
↓
A：创建 record，star = null
↓
A：setPendingRecord(record)
↓
B：接收 pendingRecord，显示纸张
↓
B：折成纸团
↓
B：投掷纸团
↓
B：生成 star 坐标
↓
B：调用 onThrowComplete({ recordId, star })
↓
A：把 star 写回对应 record
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
8.2 A 给 B 的数据：pendingRecord
类型
type PendingRecord = EmotionRecord | null;
示例
{
  id: "record_1714032000000_x8f2ka",
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
B 的使用方式
1. pendingRecord 为 null：不显示纸张。
2. pendingRecord 不为 null：显示 PaperNote。
3. B 不直接修改 pendingRecord。
4. 投掷完成后通过 onThrowComplete 通知 A。
8.3 B 给 A 的数据：ThrowCompletePayload
类型
type ThrowCompletePayload = {
  recordId: string;
  star: {
    id: string;
    x: number;
    y: number;
  };
};
示例
{
  recordId: "record_1714032000000_x8f2ka",
  star: {
    id: "star_1714032003000_p9sk2z",
    x: 620,
    y: 160
  }
}
8.4 A 实现的 onThrowComplete
接口
onThrowComplete(payload: ThrowCompletePayload) => void;
A 的实现逻辑
function handleThrowComplete(payload) {
  const targetRecord = records.find((record) => record.id === payload.recordId);

  if (!targetRecord) {
    console.warn("record not found:", payload.recordId);
    return;
  }

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
  setCurrentEmotion(targetRecord.emotion);
}
注意
1. 如果找不到 recordId，不要让页面崩溃。
2. 更新 record.star 后再保存 localStorage。
3. 投掷完成后清空 pendingRecord。
4. currentEmotion 更新为该记录的 emotion。
8.5 B 调用 A 的 onSelectStar
接口
onSelectStar(record: EmotionRecord) => void;
A 的实现
function handleSelectStar(record) {
  setSelectedRecord(record);
}
使用场景
用户点击星星
↓
StarItem 调用 onClick(record)
↓
StarLayer 调用 onSelectStar(record)
↓
App 设置 selectedRecord
↓
StarDetailModal 打开
9. App.jsx 推荐伪代码
import { useEffect, useState } from "react";
import MainScene from "./components/MainScene";
import DiaryModal from "./components/DiaryModal";
import StarDetailModal from "./components/StarDetailModal";

import { createRecordId } from "./utils/id";
import { getCurrentTimeText } from "./utils/time";
import { loadRecords, saveRecords, clearRecords } from "./utils/storage";

export default function App() {
  const [records, setRecords] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState("calm");
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [pendingRecord, setPendingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const savedRecords = loadRecords();
    setRecords(savedRecords);
  }, []);

  function handleOpenDiary() {
    setIsDiaryOpen(true);
  }

  function handleCloseDiary() {
    setIsDiaryOpen(false);
  }

  function handleCreateRecord(data) {
    const record = {
      id: createRecordId(),
      text: data.text,
      emotion: data.emotion,
      createdAt: getCurrentTimeText(),

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
    };

    const nextRecords = [...records, record];

    setRecords(nextRecords);
    saveRecords(nextRecords);
    setPendingRecord(record);
    setIsDiaryOpen(false);
  }

  function handleThrowComplete(payload) {
    const targetRecord = records.find((record) => record.id === payload.recordId);

    if (!targetRecord) {
      console.warn("record not found:", payload.recordId);
      return;
    }

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
    setCurrentEmotion(targetRecord.emotion);
  }

  function handleSelectStar(record) {
    setSelectedRecord(record);
  }

  function handleCloseStarDetail() {
    setSelectedRecord(null);
  }

  function handleClearRecords() {
    clearRecords();
    setRecords([]);
    setPendingRecord(null);
    setSelectedRecord(null);
    setCurrentEmotion("calm");
  }

  return (
    <>
      <MainScene
        records={records}
        currentEmotion={currentEmotion}
        pendingRecord={pendingRecord}
        onOpenDiary={handleOpenDiary}
        onThrowComplete={handleThrowComplete}
        onSelectStar={handleSelectStar}
      />

      <DiaryModal
        isOpen={isDiaryOpen}
        onClose={handleCloseDiary}
        onSubmit={handleCreateRecord}
      />

      <StarDetailModal
        record={selectedRecord}
        onClose={handleCloseStarDetail}
      />

      {/* 开发阶段可保留，最终演示可隐藏 */}
      <button onClick={handleClearRecords}>
        清空测试数据
      </button>
    </>
  );
}
10. 技术 A 的验收标准
P0 必须完成
1. 页面能正常打开。
2. 点击“记录情绪”能打开弹窗。
3. 能输入文字。
4. 能选择 calm / happy / sad。
5. 点击完成能生成 record。
6. record 字段完整。
7. record.star 初始为 null。
8. 新 record 能设置为 pendingRecord。
9. 技术 B 能拿到 pendingRecord。
10. 技术 B 投掷完成后，A 能接收 star。
11. A 能把 star 写回对应 record。
12. 点击星星能打开详情弹窗。
13. 详情弹窗能显示原文、情绪、时间。
14. 代码拆分清楚，不全部写在 App.jsx。
P1 建议完成
1. localStorage 保存 records。
2. 页面刷新后星星还在。
3. 页面刷新后点击星星仍能回看文字。
4. 清空测试数据按钮。
5. 预置 1 条演示数据。
11. 技术 A 交付物

技术 A 最终需要交付：

1. App.jsx
2. MainScene.jsx
3. DiaryModal.jsx
4. EmotionSelector.jsx
5. StarDetailModal.jsx
6. utils/id.js
7. utils/time.js
8. utils/storage.js
9. record 数据结构说明
10. A/B 接口说明
11. README 中技术 A 功能说明

README 里技术 A 部分可以写：

## 技术 A 完成功能

- 主界面基础流程
- 记录情绪弹窗
- 文字输入
- 平静 / 开心 / 难过 三种情绪选择
- record 数据结构生成
- pendingRecord 对接技术 B
- onThrowComplete 接收星星坐标
- 星星详情弹窗
- localStorage 本地保存
12. 直接发给技术 A 的任务说明
你负责《指尖星空》第一阶段 Demo 的技术 A 部分，也就是“数据闭环”。

你的目标是：
用户能点击记录情绪，输入文字，选择平静/开心/难过，生成一条完整 record；技术 B 完成投掷后，你接收星星坐标并保存；用户点击星星后，能回看刚才写下的文字。

请完成以下文件：
1. App.jsx
2. MainScene.jsx
3. DiaryModal.jsx
4. EmotionSelector.jsx
5. StarDetailModal.jsx
6. utils/id.js
7. utils/time.js
8. utils/storage.js

record 数据结构必须包含：
id、text、emotion、createdAt、star、title、aiSuggestedEmotion、aiFeedback、favorite、deleted、audioUrl、imageUrl、diaryBookId、gestureCreated。

新建 record 时：
1. star 先设为 null。
2. diaryBookId 固定为 "default"。
3. aiFeedback 可以先写固定句子：
   “这颗星星已经替你收下了今天的心情。”
4. gestureCreated 固定为 false。

需要实现的接口：
1. onSubmit({ text, emotion })
2. onThrowComplete({ recordId, star })
3. onSelectStar(record)

和技术 B 对接方式：
1. 你把 pendingRecord 传给技术 B。
2. 技术 B 投掷完成后调用 onThrowComplete。
3. 你根据 recordId 把 star 写回对应 record。
4. 你负责保存 records。
5. 技术 B 的 StarItem 被点击后调用 onSelectStar(record)，你打开 StarDetailModal。

第一阶段不做：
Gemini、手势识别、录音、照片导入、3D 星盘、多日记本完整管理、云端账号系统。

验收标准：
1. 页面能打开。
2. 能输入文字。
3. 能选择三个情绪。
4. 能生成完整 record。
5. 能和技术 B 对接投掷完成结果。
6. 能点击星星回看文字。
7. localStorage 刷新后不丢数据，尽量完成。
13. 技术 A 最重要的注意事项
1. 不要把所有逻辑写在 App.jsx。
2. 不要在组件里到处直接操作 localStorage。
3. 不要把 star 一开始就写死，star 要等技术 B 投掷完成后回传。
4. 不要做超出第一阶段的功能。
5. 不要接 Gemini。
6. 不要做录音。
7. 不要做多日记本完整管理。
8. 不要影响技术 B 的动画组件。
9. record 字段一定要预留完整。
10. 第一阶段最重要的是流程稳定，不是功能复杂。

技术 A 的一句话目标就是：

把用户写下来的情绪安全地存起来，并保证它变成星星后还能被点开回看。