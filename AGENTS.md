# Repository Guide

This is a React + Vite single-page app for the "Fingertip Starry Sky" emotion-recording experience.

Common commands:
- `npm install`
- `npm test`
- `npm run build`
- `npm run dev`

Protect these core flows:
- emotion input
- paper note creation
- paper ball folding
- paper throw into the sky
- recovery interaction
- constellation lighting
- sky observation and star detail review

Implementation notes:
- Keep new interactions componentized and configuration-driven.
- Do not add heavy animation or physics libraries for small visual effects.
- New motion must support `prefers-reduced-motion`.
- Mobile at `390x844` must remain usable without blocking core buttons.
- Decorative particles, meteors, stardust, and visual overlays should use `pointer-events: none`.
- Interactive additions need clear `aria-label` text.
- Run tests and build before delivery.
