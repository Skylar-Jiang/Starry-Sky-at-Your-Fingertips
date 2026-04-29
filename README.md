# 指尖星空 第一阶段 Demo

这是一个 React + Vite 的第一阶段可运行演示版本。当前目标是跑通“记录情绪 -> 折成纸团 -> 投向星空 -> 生成星星 -> 点击回看”的完整闭环。

## 运行方式

```bash
npm install
npm run dev
```

常用验证：

```bash
npm test
npm run build
```

## 当前完成内容

- 技术 A 数据闭环：创建完整 `record`、保存 localStorage、刷新后恢复。
- 技术 B 演示流：信纸展示、纸团折叠、投掷动画、星星落点。
- 星星回看：点击星星打开详情，显示原文、情绪、时间和反馈。
- 情绪场景：背景统一使用 `sky-finger (3).zip` 中的星空底图，开心/难过通过星星、角色和特效区分。
- 场景特效：开心使用光点漂浮，难过使用代码雨效；雨不烘焙在背景里。
- 新 zip 的 UI 效果已融合到现有闭环：新版背景、透明信纸、纸团、星星和投掷/特效动画。

## 目录说明

```text
src/
  App.jsx                         全局状态与主流程
  components/                     页面、弹窗、纸团、星星、特效组件
  config/emotionConfig.js         情绪标签、颜色、素材路径、反馈文案
  utils/                          record、storage、时间、星星落点工具
  __tests__/                      第一阶段闭环测试

public/assets/
  background/                     运行中的场景背景
  character/                      运行中的小王子透明角色图
  objects/                        信纸、纸团、星星
  ui/                             新增按钮/弹窗原图，暂未直接叠加使用
  needs-manual-cutout/            有白底或整张图集，需手动抠图后再接入
  needs-manual-review/            背景/图集烘焙了不适合直接叠加的内容
```

## A/B 接口约定

`App.jsx` 把待投掷记录传给纸团流程：

```jsx
<PaperNote
  record={pendingRecord}
  records={records}
  onThrowComplete={handleThrowComplete}
/>
```

纸团投掷完成后必须回传：

```js
onThrowComplete({
  recordId,
  star: { id, x, y }
});
```

点击星星时调用：

```js
onSelectStar(record);
```

技术 B 不直接写 localStorage，不直接修改 `records`；保存和回写统一由 `App.jsx` 处理。

## record 数据结构

新建记录会保留后续阶段字段：

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

新建时 `star` 为 `null`，投掷完成后回写 `{ id, x, y }`。

## 素材处理记录

- 已接入：`sky-finger (3).zip` 中的背景底图，作为 `bg_calm.png`、`bg_happy.png`、`bg_sad.png` 统一运行背景；`paper_flat.png`、`paper_ball.png`、`star_calm.png`、`star_happy.png`、`star_sad.png`、小王子三态透明角色图。
- 未直接接入：狐狸、玫瑰、泪湖座图集等没有真实透明背景，已放入 `public/assets/needs-manual-cutout/`。
- 未直接接入：整张纸团流程图集等会干扰程序特效或不是单体透明素材，已放入 `public/assets/needs-manual-review/`。
- `public/assets/ui/` 中的新按钮和弹窗图保留为 UI 原图；当前页面继续使用可响应的按钮组件，避免图片文字和真实按钮文字重复。
