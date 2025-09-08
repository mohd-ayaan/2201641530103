import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Snackbar,
} from "@mui/material";
import { logClient } from "../../logging-middleware-frontend/index.js";

const BACKEND_URL = "http://localhost:5000/api";

export default function StatsPage() {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("createdLinks");
      const parsed = JSON.parse(raw || "[]");

      const codes = Array.isArray(parsed)
        ? parsed
            .filter((l) => typeof l === "string" && l.includes("/"))
            .map((l) => {
              try {
                return l.split("/").pop();
              } catch {
                return null;
              }
            })
            .filter(Boolean)
        : [];

      setItems(codes);
      logClient({ level: "info", pkg: "page", message: "Loaded shortcodes from localStorage" });
    } catch (err) {
      logClient({ level: "error", pkg: "page", message: "localStorage parse failed" });
      setItems([]);
    }
  }, []);

  async function loadDetail(code) {
    try {
      const res = await fetch(`${BACKEND_URL}/shorturls/${code}`);
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setDetail(data);
      logClient({ level: "info", pkg: "page", message: `loaded stats ${code}` });
    } catch (e) {
      logClient({ level: "error", pkg: "page", message: e.message });
    }
  }

  async function clearStats(code) {
    try {
      const res = await fetch(`${BACKEND_URL}/shorturls/${code}/stats`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear stats");
      setCleared(true);
      loadDetail(code); // refresh stats
    } catch (e) {
      logClient({ level: "error", pkg: "page", message: e.message });
    }
  }

  function formatDate(iso) {
    const date = new Date(iso);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
  }

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Short URL Statistics
      </Typography>

      <Paper style={{ padding: 16, marginBottom: 12 }}>
        <Typography variant="subtitle1">Your Shortcodes</Typography>
        {items.length > 0 ? (
          <List>
            {items.map((code) => (
              <ListItem key={code} button onClick={() => loadDetail(code)}>
                <ListItemText primary={code} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No valid shortcodes found.</Typography>
        )}
      </Paper>

      {detail && (
        <Paper style={{ padding: 16 }}>
          <Typography variant="h6">Shortcode: {detail.shortcode}</Typography>
          <Typography>Original URL: {detail.url}</Typography>
          <Typography>
            Short Link:{" "}
            <a
              href={`http://localhost:5000/${detail.shortcode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              http://localhost:5000/{detail.shortcode}
            </a>
          </Typography>

          <Button
            variant="outlined"
            size="small"
            style={{ marginTop: 8, marginRight: 8 }}
            onClick={() => {
              navigator.clipboard.writeText(`http://localhost:5000/${detail.shortcode}`);
              setCopied(true);
            }}
          >
            Copy URL
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="error"
            style={{ marginTop: 8 }}
            onClick={() => clearStats(detail.shortcode)}
          >
            Clear Stats
          </Button>

          <Typography>Created: {formatDate(detail.createdAt)}</Typography>
          <Typography>Expiry: {formatDate(detail.expiry)}</Typography>
          <Typography>Total Clicks: {detail.clicks}</Typography>

          <Divider style={{ margin: "16px 0" }} />
          <Typography variant="subtitle1">Click Details:</Typography>

          {detail.clickDetails?.length > 0 ? (
            <ul>
              {detail.clickDetails.map((c, idx) => (
                <li key={idx}>
                  {formatDate(c.timestamp)} — {c.source || "Direct"}
                </li>
              ))}
            </ul>
          ) : (
            <Typography>No clicks recorded yet.</Typography>
          )}
        </Paper>
      )}

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Short URL copied!"
      />
      <Snackbar
        open={cleared}
        autoHideDuration={2000}
        onClose={() => setCleared(false)}
        message="Stats cleared!"
      />
    </div>
  );
}
