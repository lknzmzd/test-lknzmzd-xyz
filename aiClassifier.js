import {
  DEFAULTS,
  ISSUE_TYPE,
  QUICK,
  SUB,
  cleanSentence
} from "./utils.js";

const VALID_ISSUE_TYPES = new Set(Object.values(ISSUE_TYPE));
const VALID_QUICK = new Set(Object.values(QUICK));
const VALID_SUB = new Set(Object.values(SUB));

const IS_LOCAL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE = IS_LOCAL
  ? "http://localhost:3002"
  : "https://lknzmzd-daily-report.onrender.com";

const AI_CLASSIFY_API = `${API_BASE}/api/classify`;

function validateAIResult(data, defaults = {}) {
  if (!data || typeof data !== "object") return null;

  const issueType = VALID_ISSUE_TYPES.has(data.issueType)
    ? data.issueType
    : ISSUE_TYPE.Equipment;

  const quick = VALID_QUICK.has(data.quick)
    ? data.quick
    : QUICK.UnableDrive;

  const subType = VALID_SUB.has(data.subType)
    ? data.subType
    : SUB.CannotLocate;

  const issueDesc = cleanSentence(data.issueDesc || "");
  if (!issueDesc) return null;

  const recovery = cleanSentence(
    data.recovery || defaults.defaultRecovery || DEFAULTS.recovery
  );

  const minutesNum = Number(data.minutes);
  const safeMinutes =
    Number.isFinite(minutesNum) && minutesNum > 0
      ? minutesNum
      : (Number(defaults.defaultMin) || DEFAULTS.minutes);

  return {
    issueType,
    quick,
    subType,
    issueDesc,
    recovery,
    minutes: safeMinutes,
    confidence: "medium"
  };
}

export async function classifyWithAI(line, defaults = {}) {
  const payload = {
    line: String(line || "").trim(),
    defaultRecovery: defaults.defaultRecovery || DEFAULTS.recovery,
    defaultMin: Number(defaults.defaultMin) || DEFAULTS.minutes,
    baseResult: defaults.baseResult || null
  };

  if (!payload.line) {
    return null;
  }

  const response = await fetch(AI_CLASSIFY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store",
    body: JSON.stringify(payload)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("AI classify API returned invalid JSON");
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `AI classify request failed: HTTP ${response.status}`
    );
  }

  const normalized = validateAIResult(data, defaults);

  if (!normalized) {
    throw new Error("AI classify API returned invalid classification data");
  }

  return normalized;
}