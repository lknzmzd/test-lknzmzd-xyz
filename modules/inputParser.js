import { DEFAULTS } from "../utils.js";
import {
  preprocessLine,
  extractTime,
  extractDeviceNos,
  splitIntoRecords,
  inferDeviceTypeFromNo,
  normalizeDeviceNoForColumn,
  normalizePreviewRow
} from "../parser.js";
import { classifyWithFallback } from "../classifier.js";

function buildRowKey({ recIdx, deviceNo, startTime, rawLine }) {
  return [
    String(recIdx ?? ""),
    String(deviceNo ?? "").trim().toUpperCase(),
    String(startTime ?? "").trim(),
    String(rawLine ?? "").trim()
  ].join("||");
}

export async function buildPreviewRecords({
  rawText,
  date,
  fallbackDeviceType,
  status,
  tempMeasuresDefault,
  defaultMin,
  correctionEngine
}) {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) return [];

  const recs = splitIntoRecords(trimmed);
  const preview = [];

  for (const [recIdx, rec] of recs.entries()) {
    const processed = preprocessLine(rec.line);
    const startTime = extractTime(processed);

    const c = await classifyWithFallback(processed, {
      defaultRecovery: tempMeasuresDefault,
      defaultMin
    });

    const deviceNosRaw = extractDeviceNos(processed);
    const discoverer = rec.name ? `@${rec.name}` : "@";

    if (!deviceNosRaw.length) {
      const row = normalizePreviewRow({
        recIdx,
        rowKey: buildRowKey({
          recIdx,
          deviceNo: "",
          startTime,
          rawLine: rec.line
        }),
        date,
        name: rec.name,
        rawLine: rec.line,
        normalizedLine: c.txt,
        deviceType: fallbackDeviceType || DEFAULTS.deviceType,
        deviceNo: "",
        issueType: c.issueType,
        quick: c.quick,
        subType: c.subType,
        issueDesc: c.issueDesc,
        recovery: c.recovery,
        status,
        discoverer,
        startTime,
        minutes: c.minutes,
        ruleId: c.ruleId,
        ruleLabel: c.ruleLabel,
        matchedKeywords: c.matchedKeywords,
        confidence: c.confidence,
        wasNotMatched: c.ruleId === "fallback_default",
        warnings: ["No device number parsed"],
        criticalErrors: ["Device number unresolved"]
      }, defaultMin);

      preview.push(row);
      continue;
    }

    for (const raw of deviceNosRaw) {
      const deviceNo = normalizeDeviceNoForColumn(raw);
      const deviceType = inferDeviceTypeFromNo(raw, fallbackDeviceType);

      const warnings = [];
      const criticalErrors = [];

      if (!startTime) warnings.push("Missing time");

      if (c.ruleId === "fallback_default") {
        warnings.push("Not matched classification");
      }

      if (c.ruleId === "ai_fallback") {
        warnings.push("AI fallback classification");
      }

      if (!deviceNo) {
        warnings.push("Device number unresolved");
        criticalErrors.push("Device number unresolved");
      }

      const row = normalizePreviewRow({
        recIdx,
        rowKey: buildRowKey({
          recIdx,
          deviceNo,
          startTime,
          rawLine: rec.line
        }),
        date,
        name: rec.name,
        rawLine: rec.line,
        normalizedLine: c.txt,
        deviceType,
        deviceNo,
        issueType: c.issueType,
        quick: c.quick,
        subType: c.subType,
        issueDesc: c.issueDesc,
        recovery: c.recovery,
        status,
        discoverer,
        startTime,
        minutes: c.minutes,
        ruleId: c.ruleId,
        ruleLabel: c.ruleLabel,
        matchedKeywords: c.matchedKeywords,
        confidence: c.confidence,
        wasNotMatched: c.ruleId === "fallback_default",
        warnings,
        criticalErrors
      }, defaultMin);

      preview.push(row);
    }
  }

  const previewWithOverrides = preview.map(row =>
    correctionEngine.applyManualOverrideToRow(row)
  );

  return previewWithOverrides;
}