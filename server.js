import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { USERS } from "./users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

console.log("DAILY REPORT SERVER ACTIVE ✅");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.RENDER
  ? "/data"
  : path.join(process.env.LOCALAPPDATA || __dirname, "lknzmzd");

fs.mkdirSync(dataDir, { recursive: true });

const DATA_FILE = path.join(dataDir, "daily-report-data.json");

const sessions = new Map();

function createEmptyStore(previous = {}) {
  return {
    reportDate: new Date().toISOString().slice(0, 10),
    totalErrors: 0,
    byIssueDesc: {},
    byDeviceNo: {},
    byQuick: {},
    byIssueType: {},
    byDeviceType: {},
    byRuleId: {},
    byRuleLabel: {},
    byConfidence: {},
    firstAddedAt: null,
    updatedAt: null,

    lastAddedBy: previous.lastAddedBy || null,
    lastAddedName: previous.lastAddedName || null,
    lastAddedAt: previous.lastAddedAt || null,
    addHistory: Array.isArray(previous.addHistory) ? previous.addHistory : [],

    resetAt: previous.resetAt || null,
    lastResetBy: previous.lastResetBy || null,
    lastResetName: previous.lastResetName || null,
    lastResetIp: previous.lastResetIp || null,
    resetHistory: Array.isArray(previous.resetHistory) ? previous.resetHistory : []
  };
}

function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = createEmptyStore();
      writeStore(initial);
      return initial;
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      ...createEmptyStore(parsed),
      ...parsed,
      addHistory: Array.isArray(parsed.addHistory) ? parsed.addHistory : [],
      resetHistory: Array.isArray(parsed.resetHistory) ? parsed.resetHistory : []
    };
  } catch (err) {
    console.error("READ STORE ERROR:", err);
    const fallback = createEmptyStore();
    writeStore(fallback);
    return fallback;
  }
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function incrementMap(mapObj, key, amount = 1) {
  if (!key) return;
  mapObj[key] = (mapObj[key] || 0) + amount;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

function authenticate(username, password) {
  return USERS.find(
    (u) => u.username === username && u.password === password
  ) || null;
}

function makeSessionToken() {
  return crypto.randomBytes(24).toString("hex");
}

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

function getSessionUser(req) {
  const token = getAuthToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return session.user;
}

app.get("/", (_req, res) => {
  res.send("Daily Report API active ✅");
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = authenticate(username, password);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid username or password"
      });
    }

    const token = makeSessionToken();

    sessions.set(token, {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      createdAt: new Date().toISOString()
    });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Login failed"
    });
  }
});

app.post("/api/auth/logout", (req, res) => {
  try {
    const token = getAuthToken(req);
    if (token) sessions.delete(token);

    res.json({ ok: true });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Logout failed"
    });
  }
});

app.get("/api/auth/me", (req, res) => {
  try {
    const user = getSessionUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Not authenticated"
      });
    }

    res.json({
      ok: true,
      user
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch current user"
    });
  }
});

app.get("/api/daily-report", (_req, res) => {
  const store = readStore();
  res.json({ ok: true, data: store });
});

app.post("/api/daily-report/update", (req, res) => {
  try {
    const user = getSessionUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Authentication required"
      });
    }

    const { previewRows } = req.body || {};

    if (!Array.isArray(previewRows) || previewRows.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "previewRows must be a non-empty array"
      });
    }

    const store = readStore();
    const now = new Date().toISOString();
    const ip = getClientIp(req);

    if (!store.firstAddedAt) {
      store.firstAddedAt = now;
    }

    store.updatedAt = now;
    store.lastAddedBy = user.username;
    store.lastAddedName = user.name;
    store.lastAddedAt = now;

    for (const row of previewRows) {
      store.totalErrors += 1;

      incrementMap(store.byIssueDesc, row.issueDesc || "Unknown");
      incrementMap(store.byDeviceNo, row.deviceNo || "Unknown");
      incrementMap(store.byQuick, row.quick || "Unknown");
      incrementMap(store.byIssueType, row.issueType || "Unknown");
      incrementMap(store.byDeviceType, row.deviceType || "Unknown");
      incrementMap(store.byRuleId, row.ruleId || "Unknown");
      incrementMap(store.byRuleLabel, row.ruleLabel || "Unknown");
      incrementMap(store.byConfidence, row.confidence || "Unknown");
    }

    store.addHistory.push({
      username: user.username,
      name: user.name,
      role: user.role,
      at: now,
      ip,
      addedRows: previewRows.length
    });

    writeStore(store);

    res.json({
      ok: true,
      message: "Daily report updated",
      data: store
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to update daily report"
    });
  }
});

app.post("/api/daily-report/reset", (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = authenticate(username, password);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid username or password"
      });
    }

    if (user.role !== "leader") {
      return res.status(403).json({
        ok: false,
        error: "Only leader accounts can reset the daily report"
      });
    }

    const oldStore = readStore();
    const now = new Date().toISOString();
    const ip = getClientIp(req);

    const resetStore = createEmptyStore({
      resetAt: now,
      lastResetBy: user.username,
      lastResetName: user.name,
      lastResetIp: ip,
      resetHistory: [
        ...oldStore.resetHistory,
        {
          username: user.username,
          name: user.name,
          role: user.role,
          at: now,
          ip
        }
      ]
    });

    writeStore(resetStore);

    res.json({
      ok: true,
      message: "Daily report reset successfully",
      data: resetStore
    });
  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to reset daily report"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});