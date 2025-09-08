import React, { useState } from "react";
import { TextField, Grid, Paper, Button, Typography } from "@mui/material";
import { logClient } from "../../logging-middleware-frontend/index.js";

const BACKEND = "http://localhost:5000/api";

function Row({ index, value, onChange }) {
  return (
    <Paper style={{ padding: 16, marginBottom: 12 }}>
      <Typography variant="subtitle1">URL #{index + 1}</Typography>
      <Grid container spacing={2} style={{ marginTop: 8 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Long URL"
            name="url"
            value={value.url}
            onChange={onChange(index)}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Validity (min)"
            name="validity"
            value={value.validity}
            onChange={onChange(index)}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Preferred Shortcode"
            name="shortcode"
            value={value.shortcode}
            onChange={onChange(index)}
          />
        </Grid>
      </Grid>
      {value.result && (
        <Typography style={{ marginTop: 8 }}>
          Short Link:{" "}
          <a href={value.result.shortLink} target="_blank" rel="noreferrer">
            {value.result.shortLink}
          </a>
          <br />
          Expiry: {value.result.expiry}
        </Typography>
      )}
      {value.error && (
        <Typography style={{ color: "red", marginTop: 8 }}>
          {value.error}
        </Typography>
      )}
    </Paper>
  );
}

export default function ShortenerPage() {
  const [rows, setRows] = useState(
    Array.from({ length: 5 }, () => ({
      url: "",
      validity: "",
      shortcode: "",
      result: null,
      error: "",
    }))
  );

  const handleChange = (idx) => (e) => {
    const { name, value } = e.target;
    setRows((r) => {
      const copy = [...r];
      copy[idx] = { ...copy[idx], [name]: value };
      return copy;
    });
  };

  async function shortenOne(i) {
    const item = rows[i];

    // Client-side validation
    try {
      new URL(item.url);
    } catch (_) {
      throw new Error("Invalid URL");
    }

    if (item.validity && (!/^\d+$/.test(item.validity) || parseInt(item.validity, 10) <= 0)) {
      throw new Error("Validity must be a positive number");
    }

    if (item.shortcode && !/^[a-zA-Z0-9_-]{3,20}$/.test(item.shortcode)) {
      throw new Error("Shortcode must be alphanumeric (3–20 chars)");
    }

    const body = {
      url: item.url,
      validity: item.validity ? parseInt(item.validity, 10) : undefined,
      shortcode: item.shortcode || undefined,
    };

    const res = await fetch(`${BACKEND}/shorturls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "failed" }));
      throw new Error(err.error || "Failed to create");
    }

    return res.json();
  }

  async function handleSubmit() {
    const updates = await Promise.all(
      rows.map(async (_, i) => {
        if (!rows[i].url) return rows[i];
        try {
          const data = await shortenOne(i);
          logClient({
            level: "info",
            pkg: "page",
            message: `created ${data.shortLink}`,
          });

          const updated = { ...rows[i], result: data, error: "" };
          const list = JSON.parse(localStorage.getItem("createdLinks") || "[]");
          list.push(data.shortLink);
          localStorage.setItem("createdLinks", JSON.stringify(list));
          return updated;
        } catch (e) {
          logClient({ level: "error", pkg: "page", message: e.message });
          return { ...rows[i], error: e.message, result: null };
        }
      })
    );
    setRows(updates);
  }

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Shorten up to 5 URLs
      </Typography>
      
      {rows.map((row, i) => (
        <Row key={i} index={i} value={row} onChange={handleChange} />
      ))}
      <Button variant="contained" onClick={handleSubmit}>
        Create Short Links
      </Button>
    </div>
  );
}
