import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { detectEmotionApiPlugin } from "./server/detectEmotionApiPlugin.js";
import { driftStarApiPlugin } from "./server/driftStarApiPlugin.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [detectEmotionApiPlugin(env), driftStarApiPlugin(env), react()]
  };
});
