const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const { loggingMiddleware, pushLog } = require("../../logging-middleware-backend");

const app = express();
const port = process.env.PORT || 5000;

const db = {}; // In-memory store

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware); // Logging middleware before routes

// POST: Create short URL
app.post("/api/shorturls", (req, res) => {
  const { url, expiry, shortcode } = req.body;
  if (!url) {
    pushLog({ stack: "backend", level: "error", pkg: "shorten", message: "Missing URL in request body" });
    return res.status(400).json({ error: "URL is required" });
  }

  const shortId = shortcode || nanoid(8);
  if (shortcode && db[shortcode]) {
    pushLog({
      stack: "backend",
      level: "warn",
      pkg: "shorten",
      message: `Shortcode conflict: ${shortcode}`
    });
    return res.status(409).json({ error: "Shortcode already exists" });
  }

  db[shortId] = {
    url,
    createdAt: Date.now(),
    expiry: expiry ? new Date(expiry).getTime() : Date.now() + 10 * 60 * 1000,
    clicks: []
  };

  pushLog({ stack: "backend", level: "info", pkg: "shorten", message: `Created shortcode ${shortId} for ${url}` });

  res.json({
    shortLink: `${req.protocol}://${req.get("host")}/${shortId}`,
    expiry: new Date(db[shortId].expiry).toLocaleString()
  });
});

// GET: Redirect
app.get("/:shortId", (req, res) => {
  const entry = db[req.params.shortId];
  if (!entry) {
    pushLog({
      stack: "backend",
      level: "warn",
      pkg: "redirect",
      message: `Shortcode ${req.params.shortId} not found`
    });
    return res.status(404).send("Not found");
  }

  if (Date.now() > entry.expiry) {
    pushLog({
      stack: "backend",
      level: "warn",
      pkg: "redirect",
      message: `Attempted expired redirect for ${req.params.shortId}`
    });
    return res.status(410).send("Link expired");
  }

  entry.clicks.push({
    timestamp: new Date().toISOString(),
    source: req.get("referer") || "Direct"
  });

  pushLog({
    stack: "backend",
    level: "info",
    pkg: "redirect",
    message: `Redirected ${req.params.shortId} to ${entry.url}`
  });

  res.redirect(302, entry.url);
});

// GET: Stats
app.get("/api/shorturls/:shortId", (req, res) => {
  const entry = db[req.params.shortId];
  if (!entry) {
    pushLog({
      stack: "backend",
      level: "error",
      pkg: "stats",
      message: `Stats fetch failed — shortcode ${req.params.shortId} not found`
    });
    return res.status(404).json({ error: "Shortcode not found" });
  }

  res.json({
    shortcode: req.params.shortId,
    url: entry.url,
    createdAt: new Date(entry.createdAt).toLocaleString(),
    expiry: new Date(entry.expiry).toLocaleString(),
    clicks: entry.clicks.length,
    clickDetails: entry.clicks.map(c => ({
      timestamp: new Date(c.timestamp).toLocaleString(),
      source: c.source
    }))
  });
});

// DELETE: Clear Stats
app.delete("/api/shorturls/:shortId/stats", (req, res) => {
  const entry = db[req.params.shortId];
  if (!entry) {
    pushLog({
      stack: "backend",
      level: "error",
      pkg: "stats",
      message: `Clear stats failed — shortcode ${req.params.shortId} not found`
    });
    return res.status(404).json({ error: "Shortcode not found" });
  }

  entry.clicks = [];

  pushLog({
    stack: "backend",
    level: "info",
    pkg: "stats",
    message: `Cleared stats for ${req.params.shortId}`
  });

  res.json({ message: "Stats cleared successfully" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
