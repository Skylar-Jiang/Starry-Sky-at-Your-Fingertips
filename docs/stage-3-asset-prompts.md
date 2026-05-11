# 第三阶段资产生成记录

所有项目内素材保存到 `public/assets/`。本轮重点是恢复纸张原始版本、补齐恢复互动透明素材，并新增星空主题环境场景变体。

## 恢复互动素材

目录：`public/assets/recovery/`

- `raindrop_wronged.png`：委屈雨滴，使用 imagegen 生成后做透明处理。
- `raindrop_light_dust.png`：雨滴消散后的星尘。
- `ember_angry.png`：生气火星。
- `ember_cooling.png`：火星冷却后的柔光灰烬。
- `anxiety_bubble.png`：焦虑泡泡。
- `bubble_stardust_pop.png`：泡泡破裂后的星尘。
- `lake_light_very_sad.png`：非常难过的泪湖微光。
- `happy_glow_seed.png`：开心光点。
- `calm_soft_mote.png`：平静柔光粒子。

## 星空环境场景

目录：`public/assets/environment/scenes/`

每个核心情绪提供四种星空主题变体：

- `wronged_rain.png`
- `wronged_campfire.png`
- `wronged_waves.png`
- `wronged_lullaby.png`
- `angry_rain.png`
- `angry_campfire.png`
- `angry_waves.png`
- `angry_lullaby.png`
- `anxious_rain.png`
- `anxious_campfire.png`
- `anxious_waves.png`
- `anxious_lullaby.png`
- `calm_rain.png`
- `calm_campfire.png`
- `calm_waves.png`
- `calm_lullaby.png`

生成策略：

- 使用 imagegen 生成四张 2x2 母版，分别对应委屈、生气、焦虑、平静。
- 每张母版保持星空为主场景，人物、狐狸、玫瑰和光色做轻量变化。
- 裁切为 640x360 缩略图，避开母版分割线。
- 用 vision 检查确认：无文字、无水印、主体清晰、星空主题一致、缩略图可读。

## 保留与回退

- `public/assets/objects/paper_flat.png`：已恢复为项目原始信纸素材。
- `public/assets/objects/paper_ball.png`：已恢复为项目原始纸团素材。
- `public/assets/character/traveler_wronged.png`
- `public/assets/character/traveler_angry.png`
- `public/assets/character/traveler_anxious.png`

三张情绪角色图保留统一后的柔和 3D 童话风版本。背景图 `bg_calm.png`、`bg_happy.png`、`bg_sad.png` 保留压缩后的版本。
