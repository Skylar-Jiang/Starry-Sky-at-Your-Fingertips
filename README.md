# 指尖星空

一个基于 React + Vite 的情绪记录互动 Demo。用户把当天的心情写成一张信纸，折成纸团投向星空；星星会保留记录，场景、角色、狐狸和玫瑰会随着情绪变化，再通过星空里的微光慢慢回到平静。

## 项目玩法

1. 点击「记录情绪」，写下想交给星空的话，并选择一种情绪。
2. 点击「完成」后，文字会变成一张信纸。
3. 点击「折成纸团」，再点击纸团把它投向星空。
4. 投掷完成后，星空会生成一颗可回看的星星，主场景切换到对应情绪。
5. 点击星空里的星座微光，场景会恢复到平静状态。
6. 点击「观测星空」可以筛选、回看、收藏或软删除历史星星。

## 手势实验

「手势实验」是一个不阻塞主流程的悬浮调试小窗。它不会铺满屏幕，也不会挡住记录、折纸、投掷、观测等鼠标操作。

- 摄像头预览：开启摄像头后，小窗里显示实时画面，预览左右镜像，更接近自拍体验。
- 模拟按钮：不依赖摄像头权限，可直接触发主流程。
- OK/捏合：执行当前阶段的主动作，例如打开记录弹窗、完成纸条、投向星空、点亮恢复微光。
- 五指合拢：当信纸已经生成时，把信纸捏成纸团。
- 真实识别：已接入 `@mediapipe/tasks-vision` 的 Hand Landmarker；第一版用关键点几何距离判断捏合和五指合拢，并设置 900ms 冷却，避免连续误触。

## 流程阶段

主流程状态机集中在 `App.jsx` 和 `MainScene.jsx`：

- `idle`：初始状态，OK/捏合会打开记录弹窗。
- `writing`：正在写纸条，OK/捏合等价于点击「完成」。
- `paperReady`：信纸已生成，五指合拢会折成纸团。
- `paperFolded`：纸团已准备，OK/捏合会投向星空。
- `throwing`：纸团飞行动画中。
- `recoveryPrompt`：投掷完成，等待点击星空微光恢复。
- `calm`：场景已经恢复平静。

## 功能概览

- 情绪记录：支持开心、平静、委屈、生气、非常难过、焦虑六类情绪。
- 折纸投掷：记录生成信纸，折成纸团后投向星空并写入星星位置。
- 星空回看：支持星星详情、原文、日期、情绪、星座名、收藏和软删除。
- 观测模式：支持情绪筛选、日期筛选、统计、日期分组和情绪星座连线。
- 情绪场景：背景、角色、狐狸、玫瑰、特效会跟随当前情绪变化。
- 恢复互动：投掷后只出现一个星空星座微光，点击后真正把当前情绪切回平静。
- 环境音：提供雨声、篝火、海浪、摇篮曲等 Web Audio 白噪音和音量控制。
- 本地持久化：记录保存到 `localStorage`，刷新后可恢复。

## 项目结构

```text
src/
  App.jsx                         全局状态、流程状态机、记录持久化、弹窗控制
  components/
    MainScene.jsx                 主场景、舞台操作、投掷、观测和手势小窗入口
    DiaryModal.jsx                受控记录弹窗，鼠标和手势共用提交逻辑
    GestureExperimentPanel.jsx    悬浮手势调试小窗、摄像头预览、模拟按钮
    RecoveryConstellationCue.jsx  星空恢复微光
    PaperNote.jsx                 信纸和纸团表现
    StarLayer.jsx                 主星空星星层
    ConstellationView.jsx         观测模式星座连线
    ObservationPanel.jsx          筛选和统计面板
    EnvironmentPanel.jsx          环境音面板
  config/
    emotionConfig.js              六类情绪的文案、颜色、角色和场景资源
    constellationConfig.js        情绪星座配置
    ambientAudioConfig.js         环境音配置
  hooks/
    useGestureExperiment.js       摄像头权限、预览流生命周期
    useHandGestureRecognition.js  MediaPipe 手部关键点识别和几何手势判断
    useAmbientAudio.js            Web Audio 环境音
  utils/
    gestureActions.js             真实识别和模拟按钮共用的动作分发器
    record.js                     记录生成
    starPlacement.js              星星落点
    storage.js                    localStorage 读写
    recordFilters.js              观测筛选
  __tests__/
    app-flow.test.jsx             端到端交互流程测试
    utils.test.js                 工具函数和手势几何测试

public/assets/
  background/                     情绪背景
  character/                      小王子状态图
  companions/                     狐狸和玫瑰状态图
  constellations/                 情绪星座装饰
  environment/                    环境预设图
  objects/                        信纸、纸团、星星等对象
```

## 本地运行

环境要求：

- Node.js 20 或更高版本
- npm

```bash
npm install
npm run dev
```

常用验证：

```bash
npm test
npm run build
```

## 技术说明

- 前端框架：React 19 + Vite 7
- 图标：lucide-react
- 测试：Vitest + Testing Library + jsdom
- 手部关键点：`@mediapipe/tasks-vision`
- 摄像头 API：`navigator.mediaDevices.getUserMedia`
- 数据存储：浏览器 `localStorage`

MediaPipe Web 版 Hand Landmarker 参考 Google 官方文档：`https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js`

## 当前状态

第三阶段重点已经从“权限探测页”调整为可见、可测试、不中断主流程的调试面板。后续可以继续优化真实手势阈值、增加收起小窗、做更细的手势稳定性提示，或把星空恢复微光扩展为更完整的情绪叙事。
