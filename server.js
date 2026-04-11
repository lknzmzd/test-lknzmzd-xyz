import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { USERS } from "./users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

console.log("DAILY REPORT SERVER ACTIVE ✅");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

function safeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function safePositiveNumber(value, fallback = 15) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const VALID_ISSUE_TYPES = new Set([
  "Equipment",
  "Operation",
  "Infrastructure",
  "Safety",
  "Unknown"
]);

const VALID_QUICK = new Set([
  "Unable to drive",
  "Charging failure",
  "Collision",
  "Take failed",
  "Place failed",
  "Safety event",
  "Power issue",
  "Unknown"
]);

const VALID_SUB = new Set([
  "Cannot locate",
  "Parameter error",
  "Obstacle",
  "Battery issue",
  "Navigation issue",
  "Sensor issue",
  "Unknown"
]);

function validateClassificationShape(data, defaults = {}) {
  if (!data || typeof data !== "object") return null;

  const issueDesc = safeString(data.issueDesc);
  if (!issueDesc) return null;

  const issueType = VALID_ISSUE_TYPES.has(data.issueType)
    ? data.issueType
    : (defaults.baseResult?.issueType || "Equipment");

  const quick = VALID_QUICK.has(data.quick)
    ? data.quick
    : (defaults.baseResult?.quick || "Unable to drive");

  const subType = VALID_SUB.has(data.subType)
    ? data.subType
    : (defaults.baseResult?.subType || "Cannot locate");

  const recovery = safeString(
    data.recovery,
    defaults.defaultRecovery || "Checked issue and recovered equipment"
  );

  const minutes = safePositiveNumber(
    data.minutes,
    safePositiveNumber(defaults.defaultMin, 15)
  );

  return {
    issueType,
    quick,
    subType,
    issueDesc,
    recovery,
    minutes
  };
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") return null;

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const raw = text.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function classifyIncidentWithAI({
  line,
  defaultRecovery,
  defaultMin,
  baseResult
}) {
  const systemPrompt = `
You are a warehouse robotics incident classifier.

Return ONLY valid JSON.
Do not add markdown.
Do not add explanation.
Do not add extra text.

Use this exact JSON schema:
{
  "issueType": string,
  "quick": string,
  "subType": string,
  "issueDesc": string,
  "recovery": string,
  "minutes": number
}

Allowed issueType values:
- Equipment
- Operation
- Infrastructure
- Safety
- Unknown

Allowed quick values:
- Unable to drive
- Charging failure
- Collision
- Take failed
- Place failed
- Safety event
- Power issue
- Unknown

Allowed subType values:
- Cannot locate
- Parameter error
- Obstacle
- Battery issue
- Navigation issue
- Sensor issue
- Unknown

Rules:
- Keep issueDesc concise and operator-friendly
- recovery must be short and practical
- minutes must be a positive integer
- Prefer the closest allowed category
- If uncertain, use the provided baseResult categories
`;

  const userPrompt = `
Raw line:
${line}

Default recovery:
${defaultRecovery || "Checked issue and recovered equipment"}

Default minutes:
${safePositiveNumber(defaultMin, 15)}

Base result:
${JSON.stringify(baseResult || {}, null, 2)}

Return JSON only.
`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ]
  });

  const outputText =
    response.output_text ||
    response.output?.map(part => part?.content?.map(c => c?.text || "").join("")).join("") ||
    "";

  const parsed = extractJsonObject(outputText);

  return validateClassificationShape(parsed, {
    defaultRecovery,
    defaultMin,
    baseResult
  });
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

app.post("/api/classify", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing on server"
      });
    }

    const { line, defaultRecovery, defaultMin, baseResult } = req.body || {};

    const safeLine = safeString(line);
    if (!safeLine) {
      return res.status(400).json({
        error: "line is required"
      });
    }

    const classification = await classifyIncidentWithAI({
      line: safeLine,
      defaultRecovery: safeString(defaultRecovery, "Checked issue and recovered equipment"),
      defaultMin: safePositiveNumber(defaultMin, 15),
      baseResult: baseResult && typeof baseResult === "object" ? baseResult : null
    });

    if (!classification) {
      return res.status(422).json({
        error: "Could not produce valid classification"
      });
    }

    res.json(classification);
  } catch (err) {
    console.error("AI CLASSIFY ERROR:", err);
    res.status(500).json({
      error: "AI classification failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});