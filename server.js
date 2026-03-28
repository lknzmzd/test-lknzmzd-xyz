import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

console.log("DAILY REPORT SERVER ACTIVE ✅");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
  ✅ IMPORTANT CHANGE
  Store data OUTSIDE project folder → prevents Live Server refresh
*/
const dataDir = path.join(process.env.LOCALAPPDATA || __dirname, "lknzmzd");
fs.mkdirSync(dataDir, { recursive: true });

const DATA_FILE = path.join(dataDir, "daily-report-data.json");

const RESET_PASSWORD = process.env.RESET_PASSWORD || "";

function createEmptyStore() {
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
    updatedAt: null,
    resetAt: null
  };
}

function parseMaybeStringifiedJson(value) {
  let current = value;

  for (let i = 0; i < 10; i++) {
    if (typeof current !== "string") break;

    try {
      current = JSON.parse(current);
    } catch {
      return createEmptyStore();
    }
  }

  if (!current || typeof current !== "object" || Array.isArray(current)) {
    return createEmptyStore();
  }

  return current;
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function loadStoreFromDisk() {
  if (!fs.existsSync(DATA_FILE)) {
    const empty = createEmptyStore();
    writeStore(empty);
    return empty;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = parseMaybeStringifiedJson(raw);
    writeStore(parsed);
    return parsed;
  } catch {
    const empty = createEmptyStore();
    writeStore(empty);
    return empty;
  }
}

function incMap(map, key, by = 1) {
  const k = String(key || "").trim();
  if (!k) return;
  map[k] = (map[k] || 0) + by;
}

function extractRobotNosForStats(raw) {
  return String(raw || "")
    .split(/[,+/&]| and | AND /g)
    .map(x => x.trim())
    .filter(Boolean);
}

/* In-memory store */
let store = loadStoreFromDisk();

/* ---------- ROUTES ---------- */

app.get("/", (req, res) => {
  res.send("ROOT OK");
});

app.get("/api/daily-report", (req, res) => {
  console.log("GET /api/daily-report HIT ✅");

  res.setHeader("Cache-Control", "no-store");

  res.json({
    ok: true,
    data: store
  });
});

app.post("/api/daily-report/update", (req, res) => {
  console.log("POST /api/daily-report/update HIT ✅");

  const { previewRows } = req.body || {};

  if (!Array.isArray(previewRows)) {
    console.log("❌ previewRows invalid");
    return res.status(400).json({
      ok: false,
      message: "previewRows must be an array."
    });
  }

  console.log("Preview rows count:", previewRows.length);

  for (const row of previewRows) {
    incMap(store.byIssueDesc, row.issueDesc || "(blank)");
    incMap(store.byQuick, row.quick || "(blank)");
    incMap(store.byIssueType, row.issueType || "(blank)");
    incMap(store.byDeviceType, row.deviceType || "(blank)");
    incMap(store.byRuleId, row.ruleId || "(blank)");
    incMap(store.byRuleLabel, row.ruleLabel || "(blank)");
    incMap(store.byConfidence, row.confidence || "(blank)");

    const robots = extractRobotNosForStats(row.deviceNo);
    for (const robot of robots) {
      incMap(store.byDeviceNo, robot);
    }

    store.totalErrors += 1;
  }

  store.reportDate = new Date().toISOString().slice(0, 10);
  store.updatedAt = new Date().toISOString();

  writeStore(store);

  console.log("✅ Store updated. Total errors:", store.totalErrors);

  return res.json({
    ok: true,
    message: "Updated",
    data: store
  });
});

app.post("/api/daily-report/reset", (req, res) => {
  console.log("POST /api/daily-report/reset HIT ✅");

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({
      ok: false,
      message: "Password is required."
    });
  }

  if (password !== RESET_PASSWORD) {
    console.log("❌ Wrong password");
    return res.status(401).json({
      ok: false,
      message: "Wrong password"
    });
  }

  store = createEmptyStore();
  store.resetAt = new Date().toISOString();

  writeStore(store);

  console.log("✅ Store reset");

  return res.json({
    ok: true,
    message: "Reset successful",
    data: store
  });
});

/* ---------- START SERVER ---------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data stored at: ${DATA_FILE}`);
});