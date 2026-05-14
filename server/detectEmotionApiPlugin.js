import { handleDetectEmotionApiRequest } from "./detectEmotion.js";

export function detectEmotionApiPlugin(env = process.env) {
  return {
    name: "detect-emotion-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (pathname !== "/api/detect-emotion") {
          next();
          return;
        }

        if (req.method !== "POST") {
          sendJson(res, 405, {
            status: "error",
            emotion: null,
            message: "小伙伴现在有点听不清，稍后再试一次吧。"
          });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const result = await handleDetectEmotionApiRequest(body, env);
          sendJson(res, result.status === "error" ? 500 : 200, result);
        } catch (error) {
          console.error("[detect-emotion-api]", error);
          sendJson(res, 500, {
            status: "error",
            emotion: null,
            message: "小伙伴现在有点听不清，稍后再试一次吧。"
          });
        }
      });
    }
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
