# 指尖星空项目海报

这是一个独立的 HTML/SVG/CSS 海报交付目录，不依赖也不修改主 React/Vite 应用逻辑。

## 文件

- `poster.html`：竖版主海报，1080 x 1600。
- `poster-wide.html`：横版海报，1920 x 1080。
- `styles.css`：共享版式、排版、SVG 叠层和导出样式。
- `assets/hero-starry-sky.png`：无文字主视觉背景。
- `assets/wish-trail.png`：无文字愿望星轨素材。
- `assets/paper-star.png`：去底后的纸团星星素材。
- `export/poster.png`：竖版 PNG 导出。
- `export/poster.pdf`：竖版 PDF 导出。
- `export/poster-wide.png`：横版 PNG 导出。

## 预览

直接用浏览器打开：

```text
poster/poster.html
poster/poster-wide.html
```

## 导出

已用 Playwright/Chromium 以固定视口导出。后续如需重新导出，可使用本目录中的 HTML 文件作为源，确保视口分别为：

- 竖版：1080 x 1600
- 横版：1920 x 1080

所有中文文案都在 HTML 中，可直接编辑；AI 生成素材不包含中文文字。
