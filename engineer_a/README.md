# 指尖星空 第一阶段 Demo

## 技术栈统一确认

- 统一使用 React + Vite。
- 包管理与脚本以 `package.json` 为准：`npm install`、`npm run dev`、`npm test`、`npm run build`。
- 技术 A/B 共用 `src/config/emotionConfig.js` 管理情绪标签、背景、颜色和特效配置。
- 第一阶段只实现稳定演示闭环，不接 Gemini、手势识别、录音、照片导入、3D 星盘、云端账号。

## 运行方式

```bash
npm install
npm run dev
```

## 技术 A 完成功能

- 主界面基础流程。
- 记录情绪弹窗。
- 文字输入。
- 平静 / 开心 / 难过 三种情绪选择。
- 完整 `record` 数据结构生成。
- `pendingRecord` 对接技术 B。
- `onThrowComplete({ recordId, star })` 接收星星坐标并回写。
- 星星详情弹窗。
- localStorage 本地保存与刷新恢复。
- 开发阶段清空测试数据。

## A/B 接口说明

更完整的对接说明见 [AB_INTERFACE.md](./AB_INTERFACE.md)。

技术 A 传给技术 B：

```js
pendingRecord: EmotionRecord | null
```

技术 B 投掷完成后调用：

```js
onThrowComplete({
  recordId,
  star: { id, x, y }
});
```

技术 B 的星星点击后调用：

```js
onSelectStar(record);
```

## record 数据结构

`record` 包含：

```js
{
  id,
  text,
  emotion,
  createdAt,
  star,
  title,
  aiSuggestedEmotion,
  aiFeedback,
  favorite,
  deleted,
  audioUrl,
  imageUrl,
  diaryBookId,
  gestureCreated
}
```

新建时 `star` 固定为 `null`，投掷完成后由技术 B 回传坐标。

## 素材说明

技术侧当前不把策划案截图当正式素材使用。页面使用占位框标注美工任务书中的预定素材名，例如：

- `assets/background/bg_calm.png`
- `assets/background/planet_ground.png`
- `assets/character/traveler_calm.png`
- `assets/objects/paper_flat.png`
- `assets/objects/paper_ball.png`
- `assets/objects/star_sad.png`
- `assets/effects/rain_drop.png`

美工后续只需要把同名文件放到 `public/assets` 对应目录，技术代码无需改文件名。
