# 指尖星空视觉与交互重构修改文稿

日期：2026-05-11

## 目标

这次修改不应只修复“平静/柔和的星光”这一处，而要把项目里同类问题统一解决：恢复互动素材要真正融入星空；投掷后的星星要有明确的星座归属和逐步连线反馈；“改变环境”的插画要进入主星空场景，而不是只作为环境音缩略图。

最终体验应是：用户写下情绪、折成纸团、投向星空后，新星不是随机散落，而是落到当前情绪对应的星座模板点位上；恢复互动中出现的雨滴、火星、泡泡、柔光等都像星空中的自然发光物，而不是覆盖在星空上的灰色方块；用户选择“海浪星空 / 炉边星空 / 雨夜星空 / 摇篮星空”等环境后，主场景的背景、地景、物件、人物和宠物/花朵位置会随之变化，并保持星星只出现在星空区域。

## 当前问题判断

### 1. 恢复互动星光边缘突兀

截图中的“柔和的星光”不是单个星光素材突兀，而是恢复互动层整体造成了补丁感。当前 `src/components/RecoveryInteractionLayer.jsx` 使用一个覆盖整个 `sky-region` 的 `.recovery-interaction-layer`，并在 `src/styles.css` 里通过 `.recovery-interaction-layer::before` 添加大面积径向渐变。这个蒙层在深蓝星空上形成明显灰色矩形区域，边界无法和星空融合。

同时，`public/assets/recovery/calm_soft_mote.png` 和 `public/assets/recovery/happy_glow_seed.png` 的视觉结构偏“灰白圆点小团”，中心亮度和外扩光晕层级不够，放在星空里不像一颗有生命感的微光。相似风险也存在于 `raindrop_light_dust.png`、`bubble_stardust_pop.png` 和湖光素材：它们都需要以“发光体 + 极淡光晕 + 透明外缘”的标准统一检查，不能只调整 calm。

### 2. 星座功能已有雏形，但用户看不到“流星落到星座上”

当前 `src/utils/starPlacement.js` 已经引入 `src/config/constellationTemplates.js`，新星会按情绪模板点位生成，而不是纯随机。但是用户仍然感受不到这个功能，原因是反馈链不完整：

- 纸团投掷动画没有表现为“流星轨迹落向目标星座点”。
- 新星落点虽然按模板计算，但没有在投掷前展示目标星座或落点吸引。
- 主星空只在同情绪星星达到 3 颗后用 `.main-constellation-hint` 画很淡的虚线，且文案/视觉不够明确。
- 星座图标主要在“观测星空”视图里出现，主流程里缺少“正在连成某个星座”的阶段性反馈。

因此后续执行不应理解为“从零实现星座”，而是把已有落点模板、投掷动画、主星空连线、观测视图星座图统一成一个用户能看懂的闭环。

### 3. 环境图质量好，但没有成为主场景

`public/assets/environment/scenes/` 已经有 16 张环境星空图，`src/config/sceneAssetConfig.js` 也已经配置了 `environmentSceneConfig`。`src/components/EnvironmentPanel.jsx` 会展示这些图，选择时会更新 `selectedEnvironmentSceneKey` 并切换 `ambientAudio` 的 preset。

问题在于 `src/components/MainScene.jsx` 仍然只渲染 `emotionConfig[currentEmotion].background`，没有根据 `selectedEnvironmentSceneKey` 把环境场景应用到主星空。因此用户看到的是：环境图只存在于“改变环境”面板中，实际主场景只是换了声音。

更深一层的问题是：这些环境图现在是完整插画缩略图，不能直接整张铺进主场景。后续需要拆解成主场景可合成的层：星空背景层、下方地景层、特殊物件层、角色/花朵/宠物变体层、星星可落点区域遮罩。

### 4. 角色、花朵、宠物变体不足

当前 `sceneAssetConfig` 只按情绪切换狐狸和玫瑰，角色主要由 `emotionConfig` 按情绪切换。它没有表达“同一种情绪下也可以选择不同长相/性别气质的小王子、不同花朵、不同宠物”的需求。

这个需求可以分两期执行：第一期必须让环境图进入主星空；第二期增加变体选择系统。若一期同时做变体，建议先只做 2 套人物、2 套花、2 套宠物，避免资产数量失控。

## 推荐方案

推荐采用“场景合成系统”方案，而不是简单把环境图设为背景。

### 方案 A：直接把环境图设为主背景

优点是实现快。缺点是星星会缺少受控落点，容易落在海面、人物脸上、篝火上；角色和宠物会与背景图里已有角色重复；不同屏幕裁切后构图不可控。这个方案只能作为临时 demo，不适合当前目标。

### 方案 B：生成每个环境的分层素材并合成

把每个环境拆成：星空背景、地景/云/海浪、物件、角色组合、星星安全区域。主场景根据环境选择渲染不同层，星星层只覆盖安全星空区域。这个方案最符合需求，后续也能扩展人物、花朵、宠物变体。

### 方案 C：保留完整环境图，额外维护遮罩和热点

完整图继续作为背景，但通过配置标记星空区域、地景区域、人物区域和物件热点。实现比 B 快，但如果要替换人物/宠物会比较困难。

推荐执行 B，短期可以用 C 的配置作为过渡：先让环境图进入主场景，同时加天空安全区域；随后逐步替换成分层资产。

## 修改范围

### 恢复互动星光系统

涉及文件：

- `src/components/RecoveryInteractionLayer.jsx`
- `src/config/recoveryInteractionConfig.js`
- `src/styles.css`
- `public/assets/recovery/*.png`
- `src/__tests__/app-flow.test.jsx`

修改要求：

1. 移除或极弱化 `.recovery-interaction-layer::before` 的大面积矩形蒙层。恢复阶段可以有氛围变化，但必须是全屏自然渐变或局部光效，不能出现截图中那种矩形边界。
2. 所有恢复物件按同一规则重做视觉标准：
   - calm：柔和星光应是轻盈微光，不要灰白圆形花瓣感；中心稍亮，外缘透明自然消失。
   - happy：快乐光点可以更暖，但不能像按钮图标。
   - wronged：雨滴可以保留形体，点击后必须变成星尘，而不是换成一团突兀图片。
   - angry：火星亮度可高，但数量、尺寸和阴影要受控。
   - anxious：泡泡边缘应更薄，破裂后星尘不能形成硬边。
   - verySad：湖光要像水面反光，不应像单独贴纸。
3. 恢复物件大小从当前 `clamp(42px, 5.8vw, 62px)` 调整为按类型配置，例如微光 28-42px、雨滴 34-52px、火星 30-48px；不要所有素材同尺寸。
4. 恢复物件位置不再共用一个 `recoveryPointPositions`。每种情绪配置自己的点位，避开标题、主按钮、角色脸部、星座提示和屏幕边缘。
5. 点击后的动画应朝 `targetStar` 实际坐标移动。当前 CSS 使用固定 `translate(calc(-50% + 80px), calc(-50% - 86px))`，需要改为 CSS 变量或 React inline style 计算实际偏移。
6. 进度文案只在未完成时显示；完成文案只在达到 `requiredCount` 后显示。现有测试已经覆盖这条，但视觉层还要配合，不要让完成态突然覆盖画面。

验收标准：

- 截图中不再出现灰色矩形补丁。
- 所有恢复情绪都经过浏览器截图检查，不只检查 calm。
- 微光在星空中“能看见但不抢戏”：默认可见、hover/点击时稍亮，静止时不比普通星星更刺眼。

### 星座落点与流星反馈

涉及文件：

- `src/utils/starPlacement.js`
- `src/config/constellationTemplates.js`
- `src/config/constellationConfig.js`
- `src/components/PaperNote.jsx`
- `src/components/MainScene.jsx`
- `src/components/StarLayer.jsx`
- `src/components/RecoveryConstellationCue.jsx`
- `src/components/EmotionConstellationMap.jsx`
- `src/styles.css`
- `src/__tests__/utils.test.js`
- `src/__tests__/app-flow.test.jsx`

修改要求：

1. 保留当前按情绪模板落点的方向，但新增“目标星座点”概念。投掷前由 `createStarPlacement` 或新 helper 先计算目标点，纸团/流星动画朝该点飞去，落点完成后再写入 record。
2. 每个情绪星座要有稳定模板，而不是同一个模板循环后又从第一点开始。达到模板长度后，新星应在星座附近生成“外围守护星”或轻微扩展模板，避免第 6/7 颗覆盖第 1 颗。
3. 主星空显示阶段性星座反馈：
   - 1 颗：只显示新星。
   - 2 颗：显示极淡预连线或“下一颗会靠近这里”的光痕。
   - 3 颗：正式出现星座连线和星座名称。
   - 4 颗及以上：连线更稳定，局部星座图案或徽章可淡入。
4. 流星不是随机射入，而是从纸团投掷起点到目标点形成一条短暂光轨。光轨应使用当前情绪颜色，但透明度和长度要克制。
5. `MainConstellationHint` 不应只拿第一组达到 3 颗的情绪。需要选择“刚新增的星星所属情绪”优先；没有 recent 时再显示最近活跃的星座。
6. 观测星空里的 `EmotionConstellationMap` 和主星空的连线逻辑应共用同一套 group builder，避免一个地方显示星座、另一个地方只是散线。

验收标准：

- 连续投掷同一种情绪时，用户能看出星星在靠近某个形状。
- 第三颗星出现时，必须有明确的“连成星座”的视觉反馈。
- 不同情绪的星座形状不能看起来都只是折线；至少 happy、calm、wronged、angry、verySad、anxious 六种应有不同轮廓。

### 环境场景进入主星空

涉及文件：

- `src/config/sceneAssetConfig.js`
- `src/config/emotionConfig.js`
- `src/components/MainScene.jsx`
- `src/components/EnvironmentPanel.jsx`
- `src/components/SceneEffects.jsx`
- `src/components/StarLayer.jsx`
- `src/components/CharacterActor.jsx`
- `src/components/CompanionLayer.jsx`
- `src/styles.css`
- `public/assets/environment/scenes/*.png`
- 新增：`public/assets/environment/layers/`
- 新增：`src/config/environmentCompositionConfig.js`

修改要求：

1. 新建 `environmentCompositionConfig`，每个环境场景至少配置：
   - `backgroundImage`：星空/整体背景。
   - `foregroundImage`：海浪、云、地面、树影等下方/前景层，可选。
   - `objectImage`：篝火、伞、摇篮云、月亮、灯笼等关键物件，可选。
   - `starMask` 或 `skyBounds`：星星允许出现的区域。
   - `characterPlacement`：人物位置、大小、是否显示项目内角色图。
   - `companionPlacement`：宠物位置、大小、是否显示狐狸或替代宠物。
   - `flowerPlacement`：花朵位置、大小。
   - `effectPreset`：雨、海浪反光、火星、云漂浮等轻量效果。
2. `MainScene` 的背景不再只取 `emotionConfig[currentEmotion].background`。它应根据 `selectedEnvironmentSceneKey` 和当前情绪拿到 composition，并渲染：
   - base 星空层；
   - 环境地景/物件层；
   - 星星层，只覆盖 `skyBounds`；
   - 角色/宠物/花朵层；
   - UI 操作层。
3. 环境选择必须影响主场景：
   - 海浪星空：下方应有海面或浪线，星星只出现在天空，不落到海面高光上。
   - 炉边星空：篝火作为场景物件出现在中下区域，角色/宠物围绕它，不应只是背景音。
   - 雨夜星空：保留星空但有雨幕/伞/湿润地景，星星不能被雨线遮得过强。
   - 摇篮星空：云层或柔软承托物应承载角色和宠物，星星在上方天空。
4. 当前 16 张完整环境图可作为视觉母版，但后续执行需要用 vision 判断每张图内容，然后决定：
   - 能通过抠图得到前景/物件的，抠图复用。
   - 角色、宠物重复或姿态不适合主舞台的，改用项目透明角色/宠物素材。
   - 背景星空可局部复用，但要避免整张图里已有角色和主角色重复。
5. 环境面板仍保留缩略图，但缩略图应代表主场景变化；选择后关闭面板，主星空立即变化，不需要播放音频才变化。
6. 环境音应成为附加选项：选环境可以默认切换推荐声音，但不自动播放；音频控制仍由用户触发。

验收标准：

- 选择四种环境后，主星空肉眼可见变化。
- 星星不会落在海面、篝火、角色、宠物、花朵或 UI 按钮上。
- 不同情绪下同一环境保留情绪差异，但构图逻辑一致。
- 移动端和桌面端都没有角色、前景、星星、按钮互相遮挡的问题。

### 角色、花朵、宠物变体

涉及文件：

- `src/config/sceneAssetConfig.js`
- 新增：`src/config/avatarVariantConfig.js`
- `src/components/CharacterActor.jsx`
- `src/components/CompanionLayer.jsx`
- `src/components/EnvironmentPanel.jsx` 或新增 `SceneVariantPanel.jsx`
- `public/assets/character/`
- `public/assets/companions/`

修改要求：

1. 新增变体配置，不把“情绪”和“外观”硬绑死。建议数据结构：
   - `characterVariants`：classic、softFeminine、neutralTraveler 等。
   - `flowerVariants`：roseRed、roseBlue、smallPlanetFlower、glowBud 等。
   - `petVariants`：fox、cat、rabbit、smallStarPet 等。
2. 第一阶段至少保留当前默认组合，不破坏已有流程；第二阶段开放选择。
3. 同一情绪下，变体只影响外观，不改变情绪动作基调。例如“委屈”仍是被安慰/抱膝/低落，但人物长相、花朵颜色、宠物种类可以变化。
4. 环境构图要能读取变体尺寸和锚点，不同宠物不能因为宽高不同压到角色或跑出舞台。
5. 所有新资产都需要透明背景、统一 3D 童话水彩风、无文字、无水印。

验收标准：

- 默认状态和现在一致或更好。
- 选择不同人物/花/宠物后，主场景构图仍稳定。
- 变体不会让情绪表达变得混乱，例如开心宠物误用于非常难过默认场景。

## 资产生成与视觉检查流程

后续执行时，不能只 imagegen 一批图就结束。每张图都要进入以下流程：

1. 生成母版：根据情绪、环境、构图目标生成 16:9 母版。
2. Vision 检查：确认画面主体、风格、是否有文字/水印、角色是否重复、星空区域是否足够。
3. 分层处理：用抠图、透明背景、裁切或重生成得到背景层、物件层、角色/宠物/花朵层。
4. 场景合成：放入项目主舞台，用浏览器截图检查桌面和移动端。
5. 二次 Vision 检查：检查是否风格一致、是否有硬边、是否遮挡 UI、星星是否落在合理区域。
6. 压缩与命名：统一放入 `public/assets/environment/layers/<emotion>/<scene>/`。

建议命名：

```text
public/assets/environment/layers/calm/waves/background.png
public/assets/environment/layers/calm/waves/foreground_waves.png
public/assets/environment/layers/calm/waves/object_moon_reflection.png
public/assets/environment/layers/calm/campfire/object_campfire.png
public/assets/environment/layers/calm/lullaby/foreground_cloud.png
```

## 测试计划

需要新增或更新以下测试：

1. `createStarPlacement`：
   - 同情绪第 1-5 颗按模板点位生成。
   - 超过模板长度后不覆盖前面星星。
   - 点位被限制在当前环境 `skyBounds` 内。
2. `environmentCompositionConfig`：
   - 每个情绪和环境组合都有 composition。
   - 每个 composition 至少有背景和 skyBounds。
   - 配置的资源文件存在。
3. `MainScene`：
   - 选择环境后主场景背景/前景发生变化。
   - 选择环境不自动播放音频。
   - 星星层使用 skyBounds 或 mask。
4. `RecoveryInteractionLayer`：
   - 不同情绪使用自己的恢复点位和素材尺寸。
   - 点击恢复物件后朝目标星移动。
   - 未达 requiredCount 前不显示完成文案。
5. 视觉回归人工检查：
   - 桌面 1920x1080。
   - 笔记本 1366x768。
   - 移动端 390x844。
   - 至少检查 calm、wronged、angry、anxious 四种恢复层。

## 执行顺序

1. 修复恢复互动层硬边和所有恢复物件视觉标准。
2. 完善星座落点、流星轨迹和主星空阶段性连线反馈。
3. 建立环境 composition 配置，让环境选择真正改变主星空。
4. 用现有环境图做第一轮分层/抠图/重生成，保证四类环境在主场景可用。
5. 增加角色、花朵、宠物变体配置，但默认不强迫用户选择。
6. 跑测试、构建、浏览器截图和 vision 检查。

## 不应做的事

- 不要只改 calm 的柔和星光。
- 不要把环境图整张铺满主背景后就算完成。
- 不要让星星落在海面、篝火、人物、宠物、花朵或 UI 上。
- 不要让环境选择自动播放声音。
- 不要让新生成资产带文字、水印、过度写实或和现有童话 3D 水彩风不一致。
- 不要为了更多变体一次性生成大量不可控资产；先做少量稳定变体。

## 完成定义

这次后续执行完成后，用户应能明显感到三件事：

1. 星光和恢复物件像属于这片星空，而不是贴上去的图标或灰色补丁。
2. 反复投向同一种情绪时，星星真的在落向并组成一个星座。
3. 改变环境会改变主星空里的世界，而不只是改变环境音。
