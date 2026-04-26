# 指尖星空项目交接说明

这份文档用于帮助接手的技术成员快速了解项目结构、运行方式、当前功能边界和后续修改入口。

## 1. 项目概览

- 项目名称：指尖星空 第一阶段 Demo
- 技术栈：React 19 + Vite 7 + JavaScript + 普通 CSS
- 包管理：npm
- 当前定位：第一阶段可演示闭环，不包含 Gemini、手势识别、录音、照片导入、3D 星盘、云端账号等后续能力
- 数据存储：浏览器 localStorage，本阶段没有后端服务

用户主流程：

1. 打开主界面。
2. 点击“记录情绪”。
3. 输入文字并选择情绪。
4. 生成一条 `record`，作为 `pendingRecord` 交给纸团/投掷流程。
5. 投掷完成后回传星星坐标，记录被保存并显示在星空中。
6. 点击星星可查看详情。

## 2. 运行方式

首次安装：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

运行测试：

```bash
npm test
```

构建生产版本：

```bash
npm run build
```

构建产物会生成到 `dist/`。接手开发时主要修改 `src/` 和 `public/assets/`，不要直接改 `dist/`，除非只是临时检查构建结果。

## 3. 目录说明

```text
.
├─ src/                         源码目录
│  ├─ App.jsx                   应用状态与主流程入口
│  ├─ main.jsx                  React 挂载入口
│  ├─ styles.css                全局样式与页面视觉
│  ├─ components/               页面组件
│  ├─ config/                   情绪、素材路径、颜色配置
│  ├─ utils/                    record、存储、星星位置等工具函数
│  └─ __tests__/                Vitest 测试
├─ public/assets/               项目运行时使用的静态素材
├─ sliced_little_prince_assets/ 小王子角色切片与可替换素材源文件
├─ 文档计划与接口/              策划、技术、美工、接口相关原始文档
├─ dist/                        当前构建产物，可用于预览或交付演示
├─ AB_INTERFACE.md              技术 A/B 对接约定
├─ asset_checklist.md           素材检查清单
├─ README.md                    原项目说明
├─ package.json                 依赖和脚本
└─ package-lock.json            锁定依赖版本
```

## 4. 核心代码入口

- `src/App.jsx`
  - 管理全局状态：`records`、`currentEmotion`、`pendingRecord`、弹窗状态、当前选中星星。
  - 负责创建记录、保存 localStorage、处理投掷完成后的回写。

- `src/components/MainScene.jsx`
  - 主场景页面。
  - 组合背景、星空层、角色、纸团、按钮和场景特效。

- `src/components/DiaryModal.jsx`
  - 情绪记录弹窗。
  - 提交后调用 `onSubmit` 创建 record。

- `src/components/PaperNote.jsx`
  - 纸条/纸团和投掷流程。
  - 接收 `pendingRecord`，投掷结束后调用 `onThrowComplete({ recordId, star })`。

- `src/components/StarLayer.jsx` 和 `src/components/StarItem.jsx`
  - 星空里的星星列表和单颗星星渲染。

- `src/components/StarDetailModal.jsx`
  - 点击星星后的详情弹窗。

- `src/config/emotionConfig.js`
  - 三种情绪的统一配置：`calm`、`happy`、`sad`。
  - 包含中文标签、背景图、角色图、星星图、颜色、特效和反馈文案。

- `src/utils/record.js`
  - 创建标准 `record` 数据结构。

- `src/utils/storage.js`
  - 封装 localStorage 的读取、保存和清空。

- `src/utils/starPlacement.js`
  - 生成星星位置，避免与已有星星距离太近。

## 5. 数据结构

新建情绪记录的核心结构如下：

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

说明：

- `emotion` 当前只使用 `calm`、`happy`、`sad`。
- 新建时 `star` 是 `null`。
- 投掷完成后，`star` 会被回写为 `{ id, x, y }`。
- `audioUrl`、`imageUrl`、`gestureCreated` 等字段是为后续扩展预留的。

## 6. A/B 对接约定

当前代码把“记录/数据/保存”视为技术 A，把“纸团投掷/星星落点/星空表现”视为技术 B。详细约定见 `AB_INTERFACE.md`。

技术 A 传给 B：

```jsx
<PaperNote
  record={pendingRecord}
  records={records}
  onThrowComplete={handleThrowComplete}
/>
```

技术 B 投掷完成后必须调用：

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

点击星星时调用：

```js
onSelectStar(record);
```

注意：技术 B 不直接写 localStorage，也不直接修改 `records`。保存和回写由 `App.jsx` 统一处理。

## 7. 素材约定

正式运行素材放在：

```text
public/assets/
```

当前重点路径：

```text
public/assets/background/
public/assets/character/
public/assets/objects/
public/assets/ui/
```

情绪配置中引用的素材路径集中在 `src/config/emotionConfig.js`。如果美工后续替换同名文件，代码通常不需要改。

`sliced_little_prince_assets/` 是角色切片、预览和项目可用角色素材的来源目录。当前项目已把可直接使用的角色图放进 `public/assets/character/`。

## 8. 当前可继续修改的方向

建议接手后优先看这几块：

1. 如果要改主页面布局或视觉：看 `src/components/MainScene.jsx` 和 `src/styles.css`。
2. 如果要改情绪类型、文案、背景或角色图：看 `src/config/emotionConfig.js`。
3. 如果要改纸团投掷动画：看 `src/components/PaperNote.jsx`。
4. 如果要改星星生成规则：看 `src/utils/starPlacement.js`。
5. 如果要接 AI、录音、图片、账号：保留现有 `record` 字段，先扩展数据写入和展示，再考虑后端。

## 9. 打包交接内容建议

完整交接包建议包含：

- 必须包含：`src/`、`public/`、`package.json`、`package-lock.json`、`index.html`、`vite.config.js`
- 建议包含：`README.md`、`AB_INTERFACE.md`、`asset_checklist.md`、`PROJECT_HANDOFF.md`、`文档计划与接口/`
- 素材交接：`sliced_little_prince_assets/`
- 可选包含：`dist/`，用于不装依赖时查看当前构建产物
- 不建议包含：`node_modules/`、`.git/`，体积大且可由依赖锁文件或远程仓库恢复

本次交接包按上述建议整理，保留源码、素材、文档和当前构建产物，排除 `node_modules/` 与 `.git/`。

