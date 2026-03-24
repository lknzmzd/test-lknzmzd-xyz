import {
  DEFAULTS,
  A42T_E2_SET,
  K50H_SET,
  parseTimeToMinutes,
  minutesToHHMM,
  abnormalFmt,
  normText,
  cleanSentence,
  cleanLabelSentence,
  makeOperatorSentence
} from "./utils.js";

export function preprocessLine(line){
  return String(line || "")
    .replace(/[，]/g, ",")
    .replace(/\s+/g, " ")
    .replace(/\bchg failure\b/ig, "charging failure")
    .replace(/\bcharging fail\b/ig, "charging failure")
    .replace(/\bfail to take\b/ig, "failed to take")
    .replace(/\bfail to place\b/ig, "failed to place")
    .replace(/\bfail to deliver\b/ig, "failed to deliver")
    .replace(/\bfailed delivered\b/ig, "failed to deliver")
    .replace(/\bfaild\b/ig, "failed")
    .replace(/\bunk\b/ig, "unknown")
    .replace(/\bunkn\b/ig, "unknown")
    .replace(/\bdm pos dev\b/ig, "dm code position deviation")
    .replace(/\bwrk st\b/ig, "workstation")
    .replace(/\bws\b/ig, "workstation")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ",")
    .trim();
}

export function extractTime(line){
  const m = String(line || "").match(/(\d{1,2}\s*:\s*\d{2})(?!.*\d{1,2}\s*:\s*\d{2})/);
  return m ? m[1].replace(/\s+/g, "") : "";
}

export function extractDeviceNos(line){
  let s = String(line || "").trim();
  if (!s) return [];

  s = s.replace(/\b\d{1,2}:\d{2}\b/g, " ");
  const tokens = [];

  while(true){
    const m = s.match(/^\s*([A-Za-z0-9\/]+(?:\s*,\s*[A-Za-z0-9\/]+)*)\s*\.\s*(.*)$/);
    if(!m) break;

    const head = m[1];
    s = m[2];

    head.split(",").forEach(t => {
      t = t.trim();
      if(t) tokens.push(t);
    });

    if(!/^\s*[A-Za-z0-9\/]+\s*\./.test(s)) break;
  }

  return tokens;
}

export function splitIntoRecords(raw){
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name = "";
  const recs = [];

  for(const line of lines){
    const isName = !/[0-9]/.test(line) && !/\./.test(line) && line.length <= 60;
    if(isName){ name = line; continue; }
    recs.push({ name, line });
  }

  return recs;
}

export function looksLikeKnownDeviceToken(token){
  const t = String(token || "").trim();
  return /^(\d+|H\d+\/?\d*|CS[\w-]+|PPPO[\w-]+|BigLoop)$/i.test(t);
}

export function normalizeLineForFixMissingDots(line){
  let t = String(line || "");
  if(!t.trim()) return t;

  if(/^\s*[A-Za-z0-9\/,\s]+\s*\./.test(t)) return t;
  if(!/\b\d{1,2}:\d{2}\b/.test(t)) return t;

  const m = t.match(/^(\s*[A-Za-z0-9\/]+(?:\s*,\s*[A-Za-z0-9\/]+)*)\s+(.+)$/);
  if(!m) return t;

  const head = m[1].split(",").map(x => x.trim()).filter(Boolean);
  if(!head.length) return t;
  if(!head.every(looksLikeKnownDeviceToken)) return t;

  return `${m[1]}. ${m[2]}`;
}

export function normalizeDeviceToken(token){
  const raw0 = String(token || "").trim();
  if(!raw0) return { raw: "", left: "", num: NaN, prefix: "", hasSlash: false, U: "" };

  const raw = raw0.replace(/^[^\w\/]+|[^\w\/]+$/g, "");
  const U = raw.toUpperCase();

  const hasSlash = U.includes("/");
  const left = hasSlash ? U.split("/")[0].trim() : U;

  let prefix = "NUM";
  if (left.startsWith("PPPO")) prefix = "PPPO";
  else if (left.startsWith("CS")) prefix = "CS";
  else if (left.startsWith("H")) prefix = "H";

  const m = left.match(/\d+/);
  const num = m ? Number(m[0]) : NaN;

  return { raw, U, left, num, prefix, hasSlash };
}

export function inferDeviceTypeFromNo(deviceNoRaw, fallback){
  const fb = (fallback && fallback.trim()) ? fallback.trim() : DEFAULTS.deviceType;
  const t = normalizeDeviceToken(deviceNoRaw);
  const U = String(deviceNoRaw || "").toUpperCase().trim();

  if(U.startsWith("BIGLOOP")) return "Conveyor Line";
  if(t.prefix === "PPPO") return "Material box";
  if(t.prefix === "CS") return "Charging station";

  if(t.prefix === "H"){
    if(/^H1\d+/.test(t.left)) return "Work Station";
    if(/^H2\d+/.test(t.left)) return "Tally station";
    return "Work Station";
  }

  if(!Number.isFinite(t.num)) return fb;
  if(K50H_SET.has(t.num)) return "K50H";
  if(A42T_E2_SET.has(t.num)) return "A42T-E2 hook";

  return fb;
}

export function normalizeDeviceNoForColumn(token){
  const t = normalizeDeviceToken(token);
  if(!t.raw) return "";

  if(t.hasSlash) return t.U.replace(/\s+/g, "");
  if(t.prefix === "PPPO") return t.raw;
  if(t.U.startsWith("BIGLOOP")) return t.raw;
  if(t.prefix === "CS") return t.raw;
  if(t.prefix === "H") return t.raw;

  return Number.isFinite(t.num) ? String(t.num) : "";
}

export function extractRobotNosForStats(token){
  const raw = String(token || "").trim().toUpperCase();
  if(!raw) return [];

  const found = [];

  const addIfRobot = (part) => {
    const p = String(part || "").trim();
    if(!/^\d+$/.test(p)) return;
    const n = Number(p);
    if(K50H_SET.has(n) || A42T_E2_SET.has(n)) found.push(String(n));
  };

  if(raw.includes("/")){
    raw.split("/").forEach(addIfRobot);
    return [...new Set(found)];
  }

  addIfRobot(raw);
  return [...new Set(found)];
}

export function validateRawInputDetailed(raw){
  const lines = raw.split(/\r?\n/);
  const warnings = [];
  const errors = [];

  const isNameLine = (line) => {
    const t = line.trim();
    return t && !/[0-9]/.test(t) && !/\./.test(t) && t.length <= 60;
  };

  lines.forEach((line, i) => {
    const t = line.trim();
    if(!t) return;
    if(isNameLine(t)) return;

    const lineNum = i + 1;

    const timeMatches = t.match(/\b\d{1,2}:\d{2}\b/g) || [];
    if(timeMatches.length === 0){
      warnings.push({ line: lineNum, msg: "Missing time (HH:MM)" });
    } else if(timeMatches.length > 1){
      warnings.push({ line: lineNum, msg: "Multiple time values detected" });
    }

    if(!/^\s*[A-Za-z0-9\/,\s]+\s*\./.test(t)){
      errors.push({ line: lineNum, msg: "Device number must be before first dot" });
    }

    if(/^\s*[A-Za-z0-9\/,\s]+\s+/.test(t) && !/^\s*[A-Za-z0-9\/,\s]+\s*\./.test(t)){
      warnings.push({ line: lineNum, msg: "Possible missing dot after device number" });
    }
  });

  return { warnings, errors };
}

export function normalizePreviewRow(row, defaultMin){
  const minutes = Math.max(0, Number(row.minutes) || Number(defaultMin) || DEFAULTS.minutes);
  const startTime = String(row.startTime || "").trim();
  const startMin = parseTimeToMinutes(startTime);
  const endTime = startMin == null ? "" : minutesToHHMM(startMin + minutes);

  const fixed = {
    ...row,
    issueDesc: cleanSentence(row.issueDesc || ""),
    recovery: cleanSentence(row.recovery || DEFAULTS.recovery),
    minutes,
    startTime,
    endTime,
    abnormal: abnormalFmt(minutes)
  };

  fixed.operatorSentence = makeOperatorSentence(fixed);
  return fixed;
}

export function applyDuplicateWarnings(rows){
  const seen = new Map();

  rows.forEach((r) => {
    const key = [
      String(r.date || "").trim(),
      String(r.deviceNo || "").trim().toUpperCase(),
      cleanLabelSentence(r.issueDesc || "").toUpperCase(),
      String(r.startTime || "").trim(),
      String(r.issueType || "").trim().toUpperCase()
    ].join("||");

    if(!seen.has(key)) seen.set(key, []);
    seen.get(key).push(r);
  });

  for(const arr of seen.values()){
    if(arr.length > 1){
      arr.forEach(r => {
        if(!r.warnings.includes("Possible duplicate row")){
          r.warnings.push("Possible duplicate row");
        }
      });
    }
  }
}