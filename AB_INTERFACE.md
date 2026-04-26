# 指尖星空 第一阶段 A/B 对接说明

## 技术栈

- React + Vite
- JavaScript + JSX
- 普通 CSS
- npm
- localStorage 由技术 A 封装，技术 B 不直接写 localStorage

## 情绪 key

统一只用英文 key：

- `calm`：平静
- `happy`：开心
- `sad`：难过

中文展示、素材路径、颜色、特效统一读取：

```js
src/config/emotionConfig.js
```

## A 创建的 record

技术 A 创建完整 `record`，技术 B 只读取，不直接修改。

```js
{
  id,
  text,
  emotion,
  createdAt,
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
```

## A 传给 B

```jsx
<PaperNote
  record={pendingRecord}
  records={records}
  onThrowComplete={handleThrowComplete}
/>

<StarLayer
  records={records.filter((record) => !record.deleted && record.star)}
  onSelectStar={handleSelectStar}
/>

<SceneEffects emotion={currentEmotion} />
```

## B 回传给 A

投掷完成后，技术 B 必须调用：

```js
onThrowComplete({
  recordId: record.id,
  star: {
    id: "star_xxx",
    x: 620,
    y: 160
  }
});
```

技术 A 会根据 `recordId` 找到对应 record，把 `star` 写回并保存。

## 纸团流程合并约定

本次合并技术 B 的纸团视觉后，A/B 接口形状保持不变：

- `PaperNote` 仍接收 `record={pendingRecord}`、`records={records}`、`onThrowComplete={handleThrowComplete}`。
- 技术 B 的纸团投掷动画可以在组件内部播放；动画结束后再调用 `onThrowComplete({ recordId, star })`。
- 当前动画时长约定为 `800ms`，只影响回调触发时机，不改变 payload 结构。
- `records` 只用于生成星星位置时避开已有星星；B 不直接修改 `records`，也不直接写 localStorage。
- 投掷中应避免重复触发 `onThrowComplete`，同一条 `pendingRecord` 只回传一次星星。

点击星星时，技术 B 调用：

```js
onSelectStar(record);
```

技术 A 会打开 `StarDetailModal`。

## 星星坐标约定

当前已抽成可替换工具：

```js
src/utils/starPlacement.js
```

接口：

```js
createStarPlacement({
  viewportWidth,
  viewportHeight,
  existingStars
});
```

当前策略：

- 星星在页面上方天空安全区随机生成。
- 左右边缘至少留 `120px`。
- 顶部至少留 `96px`。
- 底部不超过视口高度的 `55%`，避开底部按钮、纸团和主操作区。
- 尽量与已有星星保持至少 `86px` 距离。
- 如果后续做星图、星座、按情绪聚类，只改 `starPlacement.js`，不要散落改组件。

## 素材路径约定

技术侧目前显示文件名占位，美工交付同名文件后替换即可。

核心路径：

- `assets/background/bg_calm.png`
- `assets/background/bg_happy.png`
- `assets/background/bg_sad.png`
- `assets/background/planet_ground.png`
- `assets/character/traveler_calm.png`
- `assets/character/traveler_happy.png`
- `assets/character/traveler_sad.png`
- `assets/fox/fox_calm.png`
- `assets/fox/fox_comfort.png`
- `assets/rose/rose_normal.png`
- `assets/rose/rose_bloom.png`
- `assets/rose/rose_wilt.png`
- `assets/objects/paper_flat.png`
- `assets/objects/paper_ball.png`
- `assets/objects/star_calm.png`
- `assets/objects/star_happy.png`
- `assets/objects/star_sad.png`
- `assets/effects/rain_drop.png`
- `assets/effects/glow_particle.png`
