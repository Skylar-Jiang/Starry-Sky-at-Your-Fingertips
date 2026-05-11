# Starry Demo Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore original paper assets, make environment changes remain starry-scene variants, make constellations form visibly after repeated same-emotion records, and soften recovery UI feedback.

**Architecture:** Keep the existing React/Vite flow. Add small config utilities for environment scene variants and constellation templates, then wire those configs into existing `MainScene`, `EnvironmentPanel`, and star-placement code. Use tests to pin behavior before implementation.

**Tech Stack:** React, Vite, Vitest, Testing Library, CSS, project PNG assets, built-in image generation plus visual inspection.

---

### Task 1: Regression Tests

**Files:**
- Modify: `src/__tests__/app-flow.test.jsx`
- Test: `src/__tests__/app-flow.test.jsx`

- [ ] **Step 1: Write failing tests**

Add tests that assert:
- environment panel shows four starry scene choices for the current emotion;
- choosing a scene changes the selected environment variant but does not start audio playback;
- repeated same-emotion stars use constellation-like placement instead of random-only placement;
- the main scene shows a faint constellation hint after three same-emotion stars;
- recovery progress does not show the completion sentence before enough objects are clicked.

- [ ] **Step 2: Verify red**

Run: `npm test -- src/__tests__/app-flow.test.jsx`

Expected: FAIL because environment scene choices, template placement, constellation hint, or recovery progress copy do not exist yet.

### Task 2: Restore Paper Assets

**Files:**
- Restore: `public/assets/objects/paper_flat.png`
- Restore: `public/assets/objects/paper_ball.png`
- Modify: `README.md`
- Modify: `docs/stage-3-asset-prompts.md`

- [ ] **Step 1: Restore original tracked assets**

Run: `git checkout -- public/assets/objects/paper_flat.png public/assets/objects/paper_ball.png`

- [ ] **Step 2: Update docs**

Remove wording that says the paper or paper ball were newly generated; state that the original paper assets are intentionally retained.

### Task 3: Environment Scene Variants

**Files:**
- Create: `public/assets/environment/scenes/*.png`
- Modify: `src/config/sceneAssetConfig.js`
- Modify: `src/components/EnvironmentPanel.jsx`
- Modify: `src/components/EnvironmentAudioControls.jsx` if selection copy needs to reference the selected scene
- Modify: `src/components/MainScene.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add config**

Create a mapping for `wronged`, `angry`, `anxious`, and `calm`, each with `rain`, `campfire`, `waves`, and `lullaby` scene entries. Each entry exposes `key`, `label`, `audioPreset`, `image`, and `description`.

- [ ] **Step 2: Add state**

Store selected environment scene in `MainScene`, defaulting to the recommended audio preset for the current emotion. Selecting a scene changes the scene image/card state and audio preset but does not call `audio.play()`.

- [ ] **Step 3: Generate images**

Use image generation for starry-scene PNGs: same soft 3D fairytale style, starry sky still dominant, different traveler/fox/rose variants per preset. Save under `public/assets/environment/scenes/`.

- [ ] **Step 4: Check visuals**

Use vision/browser screenshots to check style consistency, thumbnail readability, no text/watermark, and that variants do not overpower the main starry UI.

### Task 4: Constellation Template Placement

**Files:**
- Create: `src/config/constellationTemplates.js`
- Modify: `src/utils/starPlacement.js`
- Modify: `src/App.jsx`
- Modify: `src/components/MainScene.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add templates**

Define normalized point arrays for the six emotions. Use 5-7 points per emotion within the existing safe star area.

- [ ] **Step 2: Use templates for new stars**

Pass the selected emotion into `createStarPlacement`. For the next same-emotion star, choose the corresponding template point plus small jitter, while still respecting safe bounds.

- [ ] **Step 3: Show main-scene hint**

When any emotion has at least three starred records, show a faint constellation hint line in the main star layer and a short healing sentence. At four stars, make it slightly more visible.

### Task 5: Recovery Layer Polish

**Files:**
- Modify: `src/components/RecoveryInteractionLayer.jsx`
- Modify: `src/config/recoveryInteractionConfig.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Progress copy**

Before completion, show progress text such as `轻轻点亮雨滴 2/5`. Show `这颗星星已经被你安放好了。` only after `requiredCount` is reached.

- [ ] **Step 2: Visual softness**

Reduce object size/brightness, move positions away from title/buttons/characters, soften the overlay, and make resolved particles drift toward the new star.

### Task 6: Verification

**Files:**
- All changed files

- [ ] **Step 1: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: Vite production build exits 0.

- [ ] **Step 3: Browser and vision check**

Open the local app, run through one recovery flow, inspect environment panel, and check screenshots visually before final response.
