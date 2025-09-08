const axios = require("axios");


const EVAL_BASE_URL = process.env.EVAL_BASE_URL || "";
const EVAL_TOKEN = process.env.EVAL_TOKEN || "";
const APP_NAME = process.env.APP_NAME || "url-shortener-backend";

async function pushLog({ stack, level, pkg, message }) {
  const payload = {
    stack, level, package: pkg, message: `[${APP_NAME}] ${message}`
  };
  if (!EVAL_BASE_URL || !EVAL_TOKEN) {
    // Fallback: print to stderr but NOT console.log (to respect constraint)
    process.stderr.write(`(local-log) ${JSON.stringify(payload)}\n`);
    return;
  }
  try {
    await axios.post(
      `${EVAL_BASE_URL}/logs`,
      payload,
      {
        headers: { Authorization: `Bearer ${EVAL_TOKEN}` },
        timeout: 4000
      }
    );
  } catch (e) {
    process.stderr.write(`(log-failed) ${e.message}\n`);
  }
}

function loggingMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    pushLog({
      stack: "backend",
      level: "info",
      pkg: "middleware",
      message: `${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`
    });
  });
  next();
}

function logError(pkg, message) {
  return pushLog({ stack: "backend", level: "error", pkg, message });
}

module.exports = { loggingMiddleware, logError, pushLog };
