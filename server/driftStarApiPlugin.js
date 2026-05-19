import {
  fetchRandomDriftingStars,
  publishDriftingStar,
  pickupDriftingStar,
  removeDriftingStar,
  generateDriftingStarReply
} from "./driftStarService.js";

export function driftStarApiPlugin(env = process.env) {
  return {
    name: "drift-star-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url || "/", `http://${req.headers.host}`);
        const pathname = urlObj.pathname;

        if (!pathname.startsWith("/api/drifting-stars")) {
          next();
          return;
        }

        if (pathname === "/api/drifting-stars" && req.method === "GET") {
          await handleGetDriftingStars(urlObj, res, env);
          return;
        }

        const replyMatch = pathname.match(/^\/api\/drifting-stars\/([^/]+)\/reply$/);
        if (replyMatch && req.method === "POST") {
          await handleGenerateDriftingStarReply(req, res, env);
          return;
        }

        if (pathname === "/api/drifting-stars" && req.method === "POST") {
          await handlePostDriftingStar(req, res, env);
          return;
        }

        const pickupMatch = pathname.match(/^\/api\/drifting-stars\/([^/]+)\/pickup$/);
        if (pickupMatch && req.method === "PATCH") {
          await handlePickupDriftingStar(pickupMatch[1], res, env);
          return;
        }

        const deleteMatch = pathname.match(/^\/api\/drifting-stars\/([^/]+)$/);
        if (deleteMatch && req.method === "DELETE") {
          await handleDeleteDriftingStar(deleteMatch[1], req, res, env);
          return;
        }

        sendJson(res, 405, { status: "error", message: "方法不允许" });
      });
    }
  };
}

async function handleGetDriftingStars(urlObj, res, env) {
  try {
    const limit = parseInt(urlObj.searchParams.get("limit") || "5", 10) || 5;
    const result = await fetchRandomDriftingStars(limit, env);
    sendJson(res, result.status === "error" ? 500 : 200, result);
  } catch (error) {
    console.error("[drift-star-api] GET error:", error);
    sendJson(res, 500, { status: "error", stars: [], message: "服务器内部错误" });
  }
}

async function handlePostDriftingStar(req, res, env) {
  try {
    const body = await readJsonBody(req);
    const result = await publishDriftingStar(body, env);
    sendJson(res, result.status === "ok" ? 201 : 400, result);
  } catch (error) {
    console.error("[drift-star-api] POST error:", error);
    sendJson(res, 500, { status: "error", star: null, message: "发布失败，请稍后再试" });
  }
}

async function handleGenerateDriftingStarReply(req, res, env) {
  try {
    const body = await readJsonBody(req);
    const result = await generateDriftingStarReply(body, env);
    sendJson(res, result.status === "ok" ? 200 : 400, result);
  } catch (error) {
    console.error("[drift-star-api] REPLY error:", error);
    sendJson(res, 500, { status: "error", reply: "", message: "回信失败，请稍后再试" });
  }
}

async function handlePickupDriftingStar(starId, res, env) {
  try {
    const result = await pickupDriftingStar(starId, env);
    sendJson(res, result.status === "ok" ? 200 : 400, result);
  } catch (error) {
    console.error("[drift-star-api] PICKUP error:", error);
    sendJson(res, 500, { status: "error", message: "操作失败，请稍后再试" });
  }
}

async function handleDeleteDriftingStar(starId, req, res, env) {
  try {
    const body = await readJsonBody(req);
    const result = await removeDriftingStar(starId, body?.authorId, env);
    sendJson(res, result.status === "ok" ? 200 : 403, result);
  } catch (error) {
    console.error("[drift-star-api] DELETE error:", error);
    sendJson(res, 500, { status: "error", message: "删除失败，请稍后再试" });
  }
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
