import { esc, copyText } from "./utils.js";
import { extractRobotNosForStats } from "./parser.js";
import { getCurrentShiftInfo, loadShiftStats, saveShiftStats } from "./storage.js";

function incMap(map, key, by = 1){
  if(key == null) return;
  const k = String(key).trim();
  if(!k) return;
  map[k] = (map[k] || 0) + by;
}

function ensureShiftStatsBucket(){
  const shift = getCurrentShiftInfo();
  const store = loadShiftStats();

  if(!store[shift.key]){
    store[shift.key] = {
      label: shift.label,
      totalRows: 0,
      byIssueDesc: {},
      byDeviceNo: {},
      byQuick: {},
      byIssueType: {},
      byDeviceType: {},
      byRuleId: {},
      byRuleLabel: {},
      byConfidence: {},
      fallbackRows: 0,
      updatedAt: Date.now()
    };
  }

  return { shift, store, bucket: store[shift.key] };
}

export function updateShiftStatsFromPreviewRows(previewRows){
  const { store, bucket, shift } = ensureShiftStatsBucket();

  for(const row of (previewRows || [])){
    const deviceType = String(row.deviceType || "").trim() || "(blank)";
    const deviceNoRaw = String(row.deviceNo || "").trim();
    const issueType = String(row.issueType || "").trim() || "(blank)";
    const quick = String(row.quick || "").trim() || "(blank)";
    const issueDesc = String(row.issueDesc || "").trim() || "(blank)";
    const ruleId = String(row.ruleId || "").trim() || "(blank)";
    const ruleLabel = String(row.ruleLabel || "").trim() || "(blank)";
    const confidence = String(row.confidence || "").trim() || "(blank)";

    bucket.totalRows += 1;
    incMap(bucket.byIssueDesc, issueDesc, 1);
    incMap(bucket.byQuick, quick, 1);
    incMap(bucket.byIssueType, issueType, 1);
    incMap(bucket.byDeviceType, deviceType, 1);
    incMap(bucket.byRuleId, ruleId, 1);
    incMap(bucket.byRuleLabel, ruleLabel, 1);
    incMap(bucket.byConfidence, confidence, 1);

    if(ruleId === "fallback_default") bucket.fallbackRows += 1;

    const robotNos = extractRobotNosForStats(deviceNoRaw);
    for(const robotNo of robotNos){
      incMap(bucket.byDeviceNo, robotNo, 1);
    }
  }

  bucket.updatedAt = Date.now();
  store[shift.key] = bucket;
  saveShiftStats(store);
}

export function topN(obj, n = 5){
  return Object.entries(obj || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function renderList(title, entries){
  const items = entries.length
    ? entries.map(([k, v]) => `<li><code>${esc(k)}</code> → <b>${v}</b></li>`).join("")
    : "<li>—</li>";

  return `
    <div style="margin-top:10px;"><b>${esc(title)}</b></div>
    <ul class="advList">${items}</ul>
  `;
}

function getCurrentShiftBucket(){
  const shift = getCurrentShiftInfo();
  const statsStore = loadShiftStats();
  const bucket = statsStore[shift.key] || null;
  return { shift, statsStore, bucket };
}

function getUpdatedText(updatedAt){
  return new Date(updatedAt || Date.now())
    .toLocaleString("sv-SE")
    .replace("T", " ");
}

/* ----------------------------- */
/* ADVANCED INFORMATION (OLD)    */
/* stays exactly the same        */
/* ----------------------------- */

export function renderAdvanced(targetEl){
  const { shift, bucket: b } = getCurrentShiftBucket();

  if(!b){
    targetEl.innerHTML = `<div class="small" style="opacity:.8;">No shift stats yet. Click <b>Generate TSV</b> at least once.</div>`;
    return;
  }

  const updated = getUpdatedText(b.updatedAt);

  targetEl.innerHTML = `
    <div class="small" style="opacity:.85; margin-bottom:8px;">
      <div><b>Shift:</b> ${esc(b.label || shift.label)}</div>
      <div><b>Total rows this shift:</b> ${b.totalRows || 0}</div>
      <div><b>Fallback rows this shift:</b> ${b.fallbackRows || 0}</div>
      <div><b>Last update:</b> ${esc(updated)}</div>
    </div>
    ${renderList("Top 5 Issue Description", topN(b.byIssueDesc || {}, 5))}
    ${renderList("Top 5 Device No", topN(b.byDeviceNo || {}, 5))}
    ${renderList("Top 5 Quick Classification", topN(b.byQuick || {}, 5))}
    ${renderList("Top 5 Issue Type", topN(b.byIssueType || {}, 5))}
    ${renderList("Top 5 Device Type", topN(b.byDeviceType || {}, 5))}
    ${renderList("Top 5 Rule IDs", topN(b.byRuleId || {}, 5))}
    ${renderList("Top 5 Rule Labels", topN(b.byRuleLabel || {}, 5))}
    ${renderList("Confidence distribution", topN(b.byConfidence || {}, 5))}
  `;
}

export async function copyAdvancedText(){
  const { bucket: b } = getCurrentShiftBucket();
  if(!b) return false;

  const fmtTop = (title, obj) => {
    const items = topN(obj, 5);
    const lines = items.length ? items.map(([k,v]) => `- ${k} → ${v}`) : ["- —"];
    return `${title}\n${lines.join("\n")}`;
  };

  const updated = getUpdatedText(b.updatedAt);

  const text = [
    "Advanced information",
    `Shift: ${b.label}`,
    `Total rows this shift: ${b.totalRows}`,
    `Fallback rows this shift: ${b.fallbackRows || 0}`,
    `Last update: ${updated}`,
    "",
    fmtTop("Top 5 Issue Description", b.byIssueDesc),
    fmtTop("Top 5 Device No", b.byDeviceNo),
    fmtTop("Top 5 Device Type", b.byDeviceType),
    fmtTop("Top 5 Quick Classification", b.byQuick),
    fmtTop("Top 5 Issue Type", b.byIssueType),
    fmtTop("Top 5 Rule IDs", b.byRuleId),
    fmtTop("Top 5 Rule Labels", b.byRuleLabel),
    fmtTop("Confidence distribution", b.byConfidence)
  ].join("\n");

  return copyText(text);
}

/* ----------------------------- */
/* DAILY REPORT (NEW)            */
/* same as Advanced Info,        */
/* but Top Device No = 10        */
/* ----------------------------- */

function simplifyShiftLabel(label, fallbackLabel = ""){
  const raw = String(label || fallbackLabel || "").trim();
  if(!raw) return "(unknown)";

  const match = raw.match(/(\d{2}:\d{2})[–-](\d{2}:\d{2})/);
  if(match){
    return `${match[1]}–${match[2]}`;
  }

  return raw;
}

export function renderDailyReport(targetEl){
  const { shift, bucket: b } = getCurrentShiftBucket();

  if(!b){
    targetEl.innerHTML = `<div class="small" style="opacity:.8;">No shift stats yet. Click <b>Generate TSV</b> at least once.</div>`;
    return;
  }

  const updated = getUpdatedText(b.updatedAt);
  const shiftLabel = simplifyShiftLabel(b.label, shift.label);

  targetEl.innerHTML = `
    <div class="small" style="opacity:.85; margin-bottom:8px;">
      <div><b>Shift:</b> ${esc(shiftLabel)}</div>
      <div><b>Total errors:</b> ${b.totalRows || 0}</div>
      <div><b>Last update:</b> ${esc(updated)}</div>
    </div>
    ${renderList("Top 5 Issue Description", topN(b.byIssueDesc || {}, 5))}
    ${renderList("Top 10 Device No", topN(b.byDeviceNo || {}, 10))}
    ${renderList("Top 5 Quick Classification", topN(b.byQuick || {}, 5))}
    ${renderList("Top 5 Issue Type", topN(b.byIssueType || {}, 5))}
    ${renderList("Top 5 Device Type", topN(b.byDeviceType || {}, 5))}
    ${renderList("Top 5 Rule IDs", topN(b.byRuleId || {}, 5))}
    ${renderList("Top 5 Rule Labels", topN(b.byRuleLabel || {}, 5))}
    ${renderList("Confidence distribution", topN(b.byConfidence || {}, 5))}
  `;
}

export async function copyDailyReportText(){
  const { shift, bucket: b } = getCurrentShiftBucket();
  if(!b) return false;

  const fmtTop = (title, obj, limit = 5) => {
    const items = topN(obj, limit);
    const lines = items.length ? items.map(([k,v]) => `- ${k} → ${v}`) : ["- —"];
    return `${title}\n${lines.join("\n")}`;
  };

  const updated = getUpdatedText(b.updatedAt);
  const shiftLabel = simplifyShiftLabel(b.label, shift.label);

  const text = [
    "Daily report",
    `Shift: ${shiftLabel}`,
    `Total errors: ${b.totalRows || 0}`,
    `Last update: ${updated}`,
    "",
    fmtTop("Top 5 Issue Description", b.byIssueDesc, 5),
    fmtTop("Top 10 Device No", b.byDeviceNo, 10),
    fmtTop("Top 5 Device Type", b.byDeviceType, 5),
    fmtTop("Top 5 Quick Classification", b.byQuick, 5),
    fmtTop("Top 5 Issue Type", b.byIssueType, 5),
    fmtTop("Top 5 Rule IDs", b.byRuleId, 5),
    fmtTop("Top 5 Rule Labels", b.byRuleLabel, 5),
    fmtTop("Confidence distribution", b.byConfidence, 5)
  ].join("\n");

  return copyText(text);
}