# 指尖星空第三阶段体验完善计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在第二阶段已有六情绪、狐狸/玫瑰伴随物、环境面板和泪湖座雏形的基础上，把 Demo 推进成可演示的第三阶段版本：观测星空更完整，环境互动可操作，白噪音可用，部分手势作为实验入口存在。

**Architecture:** 继续保持 `App.jsx` 统一管理记录数据和持久化，展示层通过配置表驱动。第三阶段新增功能优先拆到小组件和配置文件中，避免把观测、环境、音频、实验手势都塞进 `MainScene.jsx`。

**Tech Stack:** React 19、Vite、Vitest、Testing Library、lucide-react、CSS 动效、Web Audio API、可选 MediaPipe/浏览器摄像头实验。

---

## 当前状态判断

第二阶段已经基本完成：

- 已有六类情绪：`happy`、`calm`、`wronged`、`angry`、`verySad`、`anxious`。
- 已有 `CompanionLayer.jsx` 显示狐狸和玫瑰。
- 已有 `sceneAssetConfig.js` 管理狐狸/玫瑰素材。
- 已有 `ConstellationView.jsx` 和 `constellationConfig.js`，泪湖座已经能作为难过类星座出现。
- 已有 `EnvironmentPanel.jsx`，但白噪音仍是占位开关。
- 当前 `node_modules/` 不在工作区里，恢复验证环境需要先运行 `npm install`。

第三阶段不建议优先继续堆静态图。推荐重点是：

1. 让“观测星空”成为真正的回溯视图。
2. 让“改变环境”成为真正的交互面板。
3. 让白噪音和情绪场景反馈可用。
4. 只做 2 个低风险手势实验，不影响键鼠主流程。
5. 用自生成新图补齐第二阶段缺口，保持风格统一。

---

## 第三阶段范围

### 必做

- 观测星空升级：情绪筛选、日期分组、星座连线、星星列表、回看入口。
- 环境面板升级：白噪音开关、音量控制、环境预设、伴随物状态预览。
- 情绪恢复小互动：焦虑泡泡、生气火星、委屈雨滴/光尘等至少 3 个可点击反馈。
- 统一生成并接入缺失资产：生气、焦虑、委屈的独立角色图；六情绪星座图标或星座装饰图。
- 演示稳定性：README 更新、测试覆盖、可录屏演示脚本。

### 可做

- 浏览器摄像头手势实验：OK 点击、五指合拢折纸团。
- 星星收藏/删除。
- 录音记录和星星回放。

### 暂不做

- 真实 3D 星盘。
- 复杂全身动作捕捉。
- AI 自动心理判断。
- 无键鼠兜底的手势主流程。
- 医疗或确定性疗愈承诺。

---

## 新图生成计划

用户已同意由 Codex 自行生成新图。所有项目内使用的新图必须保存到 `public/assets/`，不能只留在生成工具默认目录。

### 资产风格统一要求

- 主题：原创星球少年、守夜狐狸、星尘玫瑰、温柔星空、情绪实体化。
- 风格：童话感、柔和 3D 插画、水彩质感、低饱和暖光、透明背景素材。
- 禁止：直接出现“小王子”文字、高度复刻经典小王子造型、带水印、带文字、强烈商业 UI 截图感。
- 透明素材生成方式：先生成纯色 chroma-key 背景，再本地去背并检查 alpha。

### 需要生成的项目图

角色图：

```text
public/assets/character/traveler_wronged.png
public/assets/character/traveler_angry.png
public/assets/character/traveler_anxious.png
```

情绪星座装饰图：

```text
public/assets/constellations/constellation_bloom.png
public/assets/constellations/constellation_quiet_orbit.png
public/assets/constellations/constellation_drizzle_arc.png
public/assets/constellations/constellation_ember_ring.png
public/assets/constellations/constellation_tear_lake.png
public/assets/constellations/constellation_dust_spiral.png
```

环境图标或预设封面：

```text
public/assets/environment/env_rain.png
public/assets/environment/env_campfire.png
public/assets/environment/env_waves.png
public/assets/environment/env_lullaby.png
```

### 生成提示词基准

角色图基准：

```text
Create an original star traveler child character, not The Little Prince, in a soft storybook 3D watercolor style, full body, transparent cutout asset, gentle proportions, blue-gold scarf, star-dust cloak, warm expressive face, no text, no watermark. Emotion: <emotion>. Pose: <pose>. Perfectly flat #00ff00 chroma-key background, no shadow, generous padding.
```

星座图基准：

```text
Create a transparent decorative constellation emblem for a calming emotional journaling app, soft luminous stars connected by delicate dotted lines, subtle watercolor glow, no text, no zodiac symbols copied from real brands. Theme: <theme>. Perfectly flat #00ff00 chroma-key background, no shadow, generous padding.
```

环境图基准：

```text
Create a small transparent environment preset illustration for a gentle starry emotional journaling app, soft 3D watercolor storybook style, no text, no watermark. Subject: <rain/campfire/waves/lullaby>. Perfectly flat #00ff00 chroma-key background, no shadow, generous padding.
```

---

## 文件结构规划

新增文件：

```text
src/components/ObservationPanel.jsx
src/components/EmotionConstellationMap.jsx
src/components/EnvironmentAudioControls.jsx
src/components/RecoveryInteractionLayer.jsx
src/config/audioConfig.js
src/config/recoveryInteractionConfig.js
src/hooks/useAmbientAudio.js
src/hooks/useGestureExperiment.js
src/utils/recordFilters.js
src/utils/constellationGroups.js
docs/stage-3-demo-script.md
docs/stage-3-asset-prompts.md
```

修改文件：

```text
src/App.jsx
src/components/MainScene.jsx
src/components/ConstellationView.jsx
src/components/EnvironmentPanel.jsx
src/components/SceneEffects.jsx
src/components/StarDetailModal.jsx
src/config/emotionConfig.js
src/config/constellationConfig.js
src/config/sceneAssetConfig.js
src/__tests__/app-flow.test.jsx
src/__tests__/utils.test.js
src/styles.css
README.md
```

---

## Milestone 0：恢复验证环境

目标：先确认本地能跑测试和构建。

- [ ] 运行依赖安装。

```bash
npm install
```

预期：生成 `node_modules/`，不修改业务代码。

- [ ] 运行测试。

```bash
npm test
```

预期：现有测试通过。如果失败，先修当前第二阶段回归，不开始第三阶段功能。

- [ ] 运行构建。

```bash
npm run build
```

预期：Vite 构建成功。

---

## Milestone 1：第三阶段资产生成与接入准备

目标：补齐六情绪体验所需的新图，先生成、检查、命名，再接入。

- [ ] 生成 `traveler_wronged.png`：抱膝低头但不绝望，适合委屈场景。
- [ ] 生成 `traveler_angry.png`：轻微叉腰或跺脚，偏可爱，不做攻击性表情。
- [ ] 生成 `traveler_anxious.png`：手放胸前或来回踱步姿态，避免夸张恐慌。
- [ ] 生成 6 张星座装饰图，命名与六情绪一一对应。
- [ ] 生成 4 张环境预设图：雨声、篝火、海浪、摇篮曲。
- [ ] 检查所有新图：
  - PNG 有 alpha 通道。
  - 四角透明。
  - 无文字、无水印。
  - 主体没有明显绿色描边。
  - 大小适合 Web 使用，单图尽量低于 800KB。

接入准备：

- [ ] 更新 `src/config/emotionConfig.js`，把 `wronged`、`angry`、`anxious` 的 `character` 指向独立角色图。
- [ ] 更新 `src/config/constellationConfig.js`，增加 6 个星座配置。
- [ ] 更新 `src/config/sceneAssetConfig.js`，必要时增加环境图路径。
- [ ] 为资产生成记录写入 `docs/stage-3-asset-prompts.md`，记录每张图的最终提示词和用途。

验收：

- 每类情绪都有独立视觉身份。
- 不再用 `traveler_sad.png` 同时代表委屈、生气、非常难过。
- 不再用 `traveler_calm.png` 代表焦虑。

---

## Milestone 2：观测星空升级

目标：把“观测星空”从切换视图升级为可回溯、可筛选、可讲故事的二级体验。

### Task 2.1：记录分组工具

文件：

```text
src/utils/recordFilters.js
src/utils/constellationGroups.js
src/__tests__/utils.test.js
```

功能：

- 按情绪筛选星星记录。
- 按日期聚合星星记录。
- 判断某个情绪是否满足形成星座的最小数量。
- 为每个情绪生成星座线点位。

验收：

- 给定混合情绪记录，能正确返回某一情绪的记录。
- 给定同一天多条记录，能归入同一日期组。
- 少于 3 颗星时不显示完整星座，只显示散星。

### Task 2.2：观测控制面板

文件：

```text
src/components/ObservationPanel.jsx
src/components/MainScene.jsx
src/styles.css
src/__tests__/app-flow.test.jsx
```

功能：

- 观测模式顶部或侧边显示筛选控件。
- 支持情绪筛选：全部、开心、平静、委屈、生气、非常难过、焦虑。
- 支持日期筛选：全部、今天、最近 7 天。
- 显示统计：总星星数、当前筛选星星数、已形成星座数。

验收：

- 点击观测星空后出现筛选面板。
- 选择“非常难过”只显示对应记录。
- 点击筛选后的星星仍能打开回看弹窗。

### Task 2.3：六情绪星座图层

文件：

```text
src/components/EmotionConstellationMap.jsx
src/components/ConstellationView.jsx
src/config/constellationConfig.js
src/styles.css
```

功能：

- 每个情绪 3 颗以上星星时显示对应星座装饰图。
- 同情绪星星用 SVG `polyline` 连接。
- 不同情绪使用不同颜色线条。
- 泪湖座继续用于 `wronged`、`verySad`、`sad` 中最强的难过类表现，但不覆盖全部情绪星座。

验收：

- 混合 6 类情绪记录时，能看到多个情绪星座。
- 不同星座互不遮挡主要星星点击区域。
- 移动端星座装饰降低透明度或缩小，不挡操作。

---

## Milestone 3：环境面板升级

目标：让“改变环境”从预览面板变成真实可操作的环境控制中心。

### Task 3.1：音频配置与 Web Audio

文件：

```text
src/config/audioConfig.js
src/hooks/useAmbientAudio.js
src/components/EnvironmentAudioControls.jsx
src/components/EnvironmentPanel.jsx
src/__tests__/app-flow.test.jsx
```

功能：

- 使用 Web Audio API 生成无版权风险的本地环境音。
- 支持四类白噪音：
  - `rain`：噪声 + 低通滤波。
  - `campfire`：短促噪声包络模拟噼啪。
  - `waves`：缓慢起伏噪声。
  - `lullaby`：轻柔振荡器音型，默认音量很低。
- 支持播放/暂停。
- 支持音量滑杆。
- 切换环境音时自动停止上一种。

验收：

- 点击白噪音开关后，面板状态变为播放中。
- 调整音量滑杆会更新显示值。
- 关闭面板不强制停止音频，除非用户点击暂停。
- 测试中 mock `AudioContext`，不依赖真实浏览器音频输出。

### Task 3.2：环境预设

文件：

```text
src/components/EnvironmentPanel.jsx
src/config/audioConfig.js
src/styles.css
```

功能：

- 面板显示四个环境预设按钮：雨声、篝火、海浪、摇篮曲。
- 每个按钮使用 `public/assets/environment/*.png`。
- 当前选中项有明显视觉状态。
- 情绪默认推荐：
  - 委屈、非常难过：雨声。
  - 生气：篝火。
  - 焦虑：海浪。
  - 平静、开心：摇篮曲或无。

验收：

- 用户能选择一种环境音。
- 切换情绪后，面板能显示推荐项，但不强制改掉用户选择。

---

## Milestone 4：情绪恢复小互动

目标：让投掷后的场景反馈不只是看图，而是用户能做一点轻量互动。

新增配置：

```text
src/config/recoveryInteractionConfig.js
```

配置内容：

```text
wronged: 点击雨滴，雨滴变成光尘
angry: 点击火星，火星熄灭
verySad: 点击泪湖光点，水面变亮
anxious: 点击沙尘泡泡，泡泡消散
happy: 点击光点，短暂绽放
calm: 点击柔光，轻微扩散
```

新增组件：

```text
src/components/RecoveryInteractionLayer.jsx
```

接入方式：

- 放在 `MainScene` 的视觉层里。
- 只在当前情绪投掷完成后出现。
- 每类互动最多 6-10 个点，避免屏幕混乱。
- 全部点被点击后显示一个短暂的“场景恢复平静”视觉状态。

验收：

- 焦虑情绪投掷后出现可点击泡泡。
- 点击泡泡会减少数量。
- 全部清完后出现恢复状态。
- 不点击也不阻塞继续记录情绪。

---

## Milestone 5：星星详情增强

目标：让回看从“显示文字”变成“情绪记录卡片”。

文件：

```text
src/components/StarDetailModal.jsx
src/styles.css
src/__tests__/app-flow.test.jsx
```

功能：

- 显示情绪星座名称。
- 显示“这颗星来自哪一天”。
- 增加收藏按钮，更新 `favorite` 字段。
- 增加删除按钮，软删除记录，更新 `deleted` 字段。
- 如果未来有 `audioUrl`，显示播放入口；当前无录音时不显示空按钮。

验收：

- 点击收藏后记录持久化到 `localStorage`。
- 删除后星星从星空消失，但历史数据保留 `deleted: true`。
- 回看弹窗关闭后主流程不受影响。

---

## Milestone 6：手势实验入口

目标：开始第三阶段实验，但不让手势破坏主流程。

建议只做两个手势：

```text
OK/捏合：等价于点击当前高亮按钮
五指合拢：等价于折成纸团
```

新增：

```text
src/hooks/useGestureExperiment.js
src/components/GestureExperimentPanel.jsx
```

功能：

- 默认关闭摄像头。
- 用户主动打开“手势实验”。
- 明确提示“实验功能，失败时请使用鼠标”。
- 摄像头权限失败时显示键鼠兜底提示。
- 如果浏览器不支持所需能力，隐藏实验入口或显示不可用状态。

验收：

- 不打开手势实验时，主流程完全不变。
- 权限拒绝不会报错崩溃。
- 手势识别失败不会阻塞记录、折纸团、投掷。

技术建议：

- 第一版可以先不引入 MediaPipe，使用面板模拟事件验证流程。
- 如果要接真实识别，再单独评估依赖大小和浏览器兼容性。

---

## Milestone 7：演示脚本和交付包装

目标：第三阶段不是只给自己看，要能录屏展示。

新增：

```text
docs/stage-3-demo-script.md
```

演示路线：

1. 打开主界面，展示平静场景。
2. 记录一条“委屈”情绪。
3. 折纸团，投掷成星星。
4. 展示狐狸靠近、玫瑰低垂、细雨效果。
5. 点击雨滴互动，让雨滴变成光尘。
6. 进入观测星空，筛选难过类星星，展示泪湖座。
7. 点击星星回看文字。
8. 打开环境面板，选择雨声并调节音量。
9. 切换到焦虑记录，展示沙尘泡泡互动。
10. 说明手势实验入口是可选增强，不影响键鼠流程。

README 更新：

- 当前功能。
- 如何运行。
- 第三阶段已完成内容。
- 哪些是实验功能。
- 生成图片来源说明：由 Codex 按统一风格生成，项目内使用。

验收：

- 新同学按 README 能跑起来。
- 演示脚本能在 2-3 分钟内录完。
- 不把未实现功能写成已完成。

---

## 推荐执行顺序

1. Milestone 0：恢复验证环境。
2. Milestone 1：生成新图并接入配置。
3. Milestone 2：升级观测星空。
4. Milestone 3：升级环境面板和白噪音。
5. Milestone 4：做情绪恢复小互动。
6. Milestone 5：增强星星详情。
7. Milestone 7：写演示脚本和 README。
8. Milestone 6：最后做手势实验入口。

手势实验放最后，是因为它最容易拖慢进度，也最不稳定。第三阶段的展示价值主要来自观测、环境、音效和互动反馈。

---

## 测试计划

每个功能完成后至少运行：

```bash
npm test
npm run build
```

新增测试重点：

- 观测星空筛选不会丢失星星回看能力。
- 六情绪都能形成自己的星座配置。
- 环境面板可以选择白噪音和音量。
- 互动点点击后数量减少，清完后出现恢复状态。
- 收藏/删除能正确写入 `localStorage`。
- 手势实验权限失败时不会崩溃。

视觉检查：

- 桌面宽屏：1366x768。
- 桌面高屏：1440x900。
- 移动端：390x844。
- 检查文字不重叠、按钮不溢出、星座图不挡星星点击。

---

## 第三阶段完成定义

第三阶段可以算完成，当以下条件都满足：

- 六情绪有独立角色或明确视觉差异。
- 观测星空支持筛选、星座连线和回看。
- 环境面板支持真实白噪音播放和音量控制。
- 至少 3 类情绪有可点击恢复互动。
- 星星详情支持收藏或删除至少一个管理动作。
- README 和演示脚本同步更新。
- `npm test` 和 `npm run build` 通过。
- 手势实验入口即使未完成，也明确标注为实验功能，并且不影响键鼠主流程。
