import { DEFAULTS, cleanLabelSentence, makeOperatorSentence } from "../utils.js";
import { normalizePreviewRow, applyDuplicateWarnings } from "../parser.js";

export function openEditPanel({ index, state, els }) {
  const row = state.previewRows[index];
  if (!row) return;

  state.currentEditIndex = index;
  els.editPanel.style.display = "block";
  els.editMeta.textContent = `Row ${index + 1}`;

  els.editDeviceType.value = row.deviceType || "";
  els.editDeviceNo.value = row.deviceNo || "";
  els.editMinutes.value = String(row.minutes || "");
  els.editStartTime.value = row.startTime || "";
  els.editIssueType.value = row.issueType || "";
  els.editQuick.value = row.quick || "";
  els.editSubType.value = row.subType || "";
  els.editConfidence.value = row.confidence || "";
  els.editIssueDesc.value = cleanLabelSentence(row.issueDesc || "");
  els.editRecovery.value = cleanLabelSentence(row.recovery || "");
  els.editRawLine.textContent = row.rawLine || "";
  els.editRuleLabel.textContent = row.ruleLabel || "—";
  els.editMatchedKeywords.textContent = (row.matchedKeywords || []).join(", ") || "—";
  els.editOperatorSentence.textContent = row.operatorSentence || makeOperatorSentence(row);
}

export function closeEditPanel({ state, els }) {
  state.currentEditIndex = -1;
  els.editPanel.style.display = "none";
}

export function refreshEditOperatorSentence({ els }) {
  const tempRow = normalizePreviewRow({
    deviceNo: els.editDeviceNo.value.trim(),
    issueDesc: els.editIssueDesc.value.trim(),
    recovery: els.editRecovery.value.trim(),
    startTime: els.editStartTime.value.trim(),
    minutes: Number(els.editMinutes.value) || Number(els.defaultMin.value) || DEFAULTS.minutes
  }, els.defaultMin.value);

  els.editOperatorSentence.textContent = tempRow.operatorSentence || makeOperatorSentence(tempRow);
}

export function applyEdit({ state, els, toast }) {
  if (state.currentEditIndex < 0 || !state.previewRows[state.currentEditIndex]) return false;

  const row = state.previewRows[state.currentEditIndex];

  const override = {
    deviceType: els.editDeviceType.value.trim(),
    deviceNo: els.editDeviceNo.value.trim(),
    minutes: Number(els.editMinutes.value) || Number(els.defaultMin.value) || DEFAULTS.minutes,
    startTime: els.editStartTime.value.trim(),
    issueType: els.editIssueType.value.trim(),
    quick: els.editQuick.value.trim(),
    subType: els.editSubType.value.trim(),
    confidence: els.editConfidence.value.trim() || row.confidence || "manual-template",
    issueDesc: els.editIssueDesc.value.trim(),
    recovery: els.editRecovery.value.trim(),
    matchedKeywords: ["manual edit"],
    wasNotMatched: row.wasNotMatched === true
  };

  const key = String(row.recIdx);
  state.manualOverrides[key] = {
    ...(state.manualOverrides[key] || {}),
    ...override
  };

  const updated = {
    ...row,
    ...override,
    criticalErrors: []
  };

  if (!updated.deviceNo) {
    updated.criticalErrors.push("Device number unresolved");
  }

  updated.warnings = (updated.warnings || []).filter(w => w !== "Possible duplicate row");
  if (!updated.startTime) {
    updated.warnings = [...new Set([...(updated.warnings || []), "Missing time"])];
  }

  state.previewRows[state.currentEditIndex] = normalizePreviewRow(updated, els.defaultMin.value);
  applyDuplicateWarnings(state.previewRows);

  toast("Row updated ✅");
  return true;
}