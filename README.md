# 指尖星空

一个 React + Vite 的情绪记录 Demo。当前主线收口为一条适合录屏演示的温柔闭环：

写下情绪 -> 折成纸团 -> 投向星空 -> 场景回应 -> 点击恢复物件 -> 星空平复 -> 观测星空回看。

## 当前演示重点

- 六类情绪记录：开心、平静、委屈、生气、非常难过、焦虑。
- 投掷后生成可回看的星星，保留原文、情绪、日期、星座名、收藏和删除。
- 委屈 / 生气 / 焦虑有专属恢复互动：雨滴、火星、泡泡会缩小、发光、化成光尘。
- 恢复未完成前只显示进度，点够数量后才出现“这颗星星已经被你安放好了。”
- 同一种情绪的星星会优先按星座模板落点，三颗后在主星空出现淡线和一句治愈提示。
- 观测星空支持筛选、统计、星座连线和详情回看。
- 改变环境仍保持星空主题，提供同一情绪下的四种星空陪伴场景：雨夜、炉边、海浪、摇篮。
- 环境音只保留雨声、篝火、海浪、摇篮曲，必须用户点击后才播放。
- 手势实验是可选增强入口，摄像头默认关闭，不影响鼠标主流程。

## 本地运行

```bash
npm install
npm run dev
```

验证命令：

```bash
npm test
npm run build
```

## 演示数据

主界面顶部有一个低可见度的隐藏 `demo` 按钮，点击后会注入一组本地演示星星，方便录屏前快速准备观测星空数据。

## 关键目录

```text
src/components/MainScene.jsx
src/components/RecoveryInteractionLayer.jsx
src/config/recoveryInteractionConfig.js
src/config/sceneAssetConfig.js
src/config/constellationTemplates.js
src/components/EnvironmentPanel.jsx
public/assets/recovery/
public/assets/environment/scenes/
public/assets/character/
public/assets/objects/
docs/stage-3-demo-script.md
docs/stage-3-asset-prompts.md
```

## 资产说明

恢复素材位于 `public/assets/recovery/`。环境星空场景位于 `public/assets/environment/scenes/`，由 imagegen 生成母版后裁切为项目内缩略图，并用视觉检查确认风格统一。

`paper_flat.png` 和 `paper_ball.png` 已按要求恢复为项目原始版本，不再使用新生成纸张素材。委屈、生气、焦虑三张角色图仍保留统一后的柔和 3D 童话风版本。
