import {
  validateRawInputDetailed,
  applyDuplicateWarnings
} from "../parser.js";

export function validateRawText(rawText) {
  return validateRawInputDetailed(rawText || "");
}

export function finalizePreviewRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  applyDuplicateWarnings(safeRows);
  return safeRows;
}

export function getCriticalRows(rows) {
  return (rows || []).filter(r => (r.criticalErrors || []).length > 0);
}

export function getValidationStats(rows) {
  const safeRows = rows || [];

  return {
    total: safeRows.length,
    warnings: safeRows.filter(r => (r.warnings || []).length > 0).length,
    errors: safeRows.filter(r => (r.criticalErrors || []).length > 0).length,
    notMatched: safeRows.filter(r =>
      r.ruleId === "fallback_default" ||
      (r.warnings || []).includes("Not matched classification") ||
      r.wasNotMatched === true
    ).length,
    duplicates: safeRows.filter(r =>
      (r.warnings || []).includes("Possible duplicate row")
    ).length,
    highConfidence: safeRows.filter(r => r.confidence === "high").length,
    mediumConfidence: safeRows.filter(r => r.confidence === "medium").length,
    manualTemplate: safeRows.filter(r => r.confidence === "manual-template").length
  };
}