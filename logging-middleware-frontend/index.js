export async function logClient({ level="info", pkg="component", message="" }) {
  const base = window.__EVAL_BASE_URL__ || process.env.REACT_APP_EVAL_BASE_URL || "";
  const token = window.__EVAL_TOKEN__ || process.env.REACT_APP_EVAL_TOKEN || "";
  const app = "url-shortener-frontend";
  const stack = "frontend";

  const payload = { stack, level, package: pkg, message: `[${app}] ${message}` };

  if (!base || !token) {
    return;
  }
  try {
    await fetch(`${base}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (_) {}
}
