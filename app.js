import {
  DEFAULTS,
  toast,
  isValidDateInput
} from "./utils.js";

import { validateRawInputDetailed } from "./parser.js";
import { initTemplatesUI } from "./templates.js";
import { renderAdvanced, copyAdvancedText, updateShiftStatsFromPreviewRows } from "./stats.js";
import {
  addRowsToShift,
  resetShiftRows,
  getShiftTotal,
  markShiftExportIfNew,
  clearCurrentShiftStats
} from "./storage.js";

import { createCorrectionEngine } from "./modules/correctionEngine.js";
import {
  rebuildOutputFromPreviewRows,
  copyTSV as copyTSVText,
  downloadTSV,
  buildSemanticSignature
} from "./modules/exporter.js";
import {
  updateRawValidationUI,
  renderRowCount,
  updateOutputDot
} from "./modules/analytics.js";
import { createHistoryModule } from "./modules/history.js";
import { buildRelayPayload } from "./modules/relay.js";
import { buildPreviewRecords } from "./modules/inputParser.js";
import {
  finalizePreviewRows,
  getCriticalRows
} from "./modules/validator.js";

import { getDOMElements } from "./ui/dom.js";
import { renderIssuesPanel } from "./ui/issuesPanel.js";
import {
  openEditPanel,
  closeEditPanel,
  refreshEditOperatorSentence,
  applyEdit
} from "./ui/editPanel.js";

const state = {
  previewRows: [],
  currentEditIndex: -1,
  manualOverrides: {}
};

const els = getDOMElements();

const correctionEngine = createCorrectionEngine({
  state,
  defaultMinutesProvider: () => els.defaultMin.value
});

const historyModule = createHistoryModule();

const IS_LOCAL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const DAILY_REPORT_API = IS_LOCAL
  ? "http://localhost:3002/api/daily-report/update"
  : "https://lknzmzd-daily-report.onrender.com/api/daily-report/update";

async function pushDailyReportUpdate(previewRows) {
  console.log("POSTING TO DAILY REPORT API:", DAILY_REPORT_API);
  console.log("Preview rows being sent:", previewRows);

  const response = await fetch(DAILY_REPORT_API, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ previewRows })
  });

  const rawText = await response.text();
  let result = null;

  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch (err) {
    console.error("Daily report API returned non-JSON:", rawText);
    throw new Error("Daily report API returned invalid JSON.");
  }

  console.log("Daily report API response status:", response.status);
  console.log("Daily report API response body:", result);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || `Could not update shared daily report. HTTP ${response.status}`);
  }

  return result;
}

function updateShiftLabel() {
  const info = getShiftTotal();
  els.shiftLabel.textContent = info.shift.label;
  els.shiftTotal.textContent = String(info.total);
}

function validateRawInput() {
  const validation = validateRawInputDetailed(els.raw.value || "");
  updateRawValidationUI({
    rawElement: els.raw,
    warnTextElement: els.warnText,
    validationSummaryElement: els.validationSummary,
    validation
  });
  return validation;
}

function buildPreviewRecordsLocal() {
  const rows = buildPreviewRecords({
    rawText: els.raw.value || "",
    date: els.date.value.trim(),
    fallbackDeviceType: els.deviceType.value.trim() || DEFAULTS.deviceType,
    status: els.status.value.trim() || DEFAULTS.status,
    tempMeasuresDefault: els.tempMeasures.value.trim() || DEFAULTS.recovery,
    defaultMin: els.defaultMin.value,
    correctionEngine
  });

  return finalizePreviewRows(rows);
}

function rerenderPreview() {
  renderIssuesPanel({
    rows: state.previewRows,
    els,
    correctionEngine,
    onEdit: index => openEditPanel({ index, state, els }),
    onApplySuggestion: (rowIndex, templateId) => {
      const ok = correctionEngine.applySuggestedTemplateById(rowIndex, templateId);
      if (ok) {
        state.previewRows = state.previewRows.map(row =>
          correctionEngine.applyManualOverrideToRow(row)
        );
        state.previewRows = finalizePreviewRows(state.previewRows);
        rerenderPreview();
        updateUIStates();
        toast("Template applied ✅");
      }
    }
  });
}

function previewOnly() {
  const rawText = (els.raw.value || "").trim();
  if (!rawText) {
    toast("Raw input is empty");
    els.raw.focus();
    return;
  }

  state.previewRows = buildPreviewRecordsLocal();
  rerenderPreview();
  updateUIStates();
  toast("Preview ready ✅");
}

async function generate() {
  const rawText = (els.raw.value || "").trim();
  if (!rawText) {
    toast("Raw input is empty");
    els.raw.focus();
    return;
  }

  if (!isValidDateInput(els.date.value.trim())) {
    toast("Date must be YYYY/MM/DD");
    els.date.focus();
    return;
  }

  state.previewRows = buildPreviewRecordsLocal();

  state.previewRows = state.previewRows.map(row =>
    correctionEngine.applyManualOverrideToRow(row)
  );
  state.previewRows = finalizePreviewRows(state.previewRows);

  rerenderPreview();

  const criticalRows = getCriticalRows(state.previewRows);
  if (criticalRows.length) {
    console.warn("CRITICAL ROWS BLOCKED:", criticalRows);
    toast(`Blocked: ${criticalRows.length} row(s) have critical errors`);
    return;
  }

  rebuildOutputFromPreviewRows({
    rows: state.previewRows,
    date: els.date.value.trim(),
    outElement: els.out
  });

  const finalText = els.out.value;
  const semanticSignature = buildSemanticSignature(state.previewRows, els.date.value.trim());
  const isNewExport = markShiftExportIfNew(finalText, semanticSignature);

  if (isNewExport) {
    addRowsToShift(state.previewRows.length);
    updateShiftStatsFromPreviewRows(state.previewRows);

    historyModule.saveSession({
      date: els.date.value.trim(),
      totalRows: state.previewRows.length,
      rawInput: els.raw.value,
      output: finalText,
      relay: buildRelayPayload(state.previewRows, {
        date: els.date.value.trim(),
        source: "manual-ui"
      })
    });
  }

  try {
    console.log("ABOUT TO SYNC DAILY REPORT");
    await pushDailyReportUpdate(state.previewRows);
    console.log("Daily report synced to server ✅");
  } catch (err) {
    console.error("Failed to sync daily report:", err);
    toast("Generated ✅ but shared Daily Report sync failed");
  }

  updateShiftLabel();
  renderAdvanced(els.advBox);
  updateUIStates();
  toast(isNewExport ? "Generated ✅" : "Generated ✅ (stats not re-counted)");
}

function updateUIStates() {
  validateRawInput();

  renderRowCount(els.rowCount, {
    rawText: els.raw.value || "",
    previewRows: state.previewRows,
    outText: els.out.value || ""
  });

  updateOutputDot(els.out.value || "");
}

function loadExample() {
  els.raw.value = `Ilkin Azimzade
1840. Unable to drive. Missing DM code. Recovery key and set to DM code. 06:44
Mykyta Kyrylov
CS11/988. Charging failure. Parameter configuration error. Changed mode to Auto. 6:53
Rostyslav Mykhavko
209/2145. Collision of 2 robots. Robots collided while Kiva tried to take a case. Change of position and recovery. 06:53
Andrii
H123/2145. charging failure. 12:04
`;
  updateUIStates();
  previewOnly();
}

async function handleCopyTSV() {
  const text = els.out.value;
  if (!text) {
    toast("Output is empty");
    return;
  }

  const ok = await copyTSVText(text);
  toast(ok ? "Copied ✅" : "Ctrl+C (clipboard blocked)");
}

function handleDownloadTSV() {
  downloadTSV(els.out.value || "", els.date.value || "export");
}

function handleApplyEdit() {
  const ok = applyEdit({ state, els, toast });
  if (!ok) return;

  state.previewRows = state.previewRows.map(row =>
    correctionEngine.applyManualOverrideToRow(row)
  );
  state.previewRows = finalizePreviewRows(state.previewRows);
  rerenderPreview();
  updateUIStates();
}

function bindEvents() {
  document.getElementById("previewBtn")?.addEventListener("click", previewOnly);
  document.getElementById("gen")?.addEventListener("click", generate);
  document.getElementById("copy")?.addEventListener("click", handleCopyTSV);
  document.getElementById("download")?.addEventListener("click", handleDownloadTSV);
  document.getElementById("loadExample")?.addEventListener("click", loadExample);

  document.getElementById("applyEdit")?.addEventListener("click", handleApplyEdit);
  document.getElementById("cancelEdit")?.addEventListener("click", () => closeEditPanel({ state, els }));

  ["editDeviceNo", "editIssueDesc", "editRecovery", "editStartTime", "editMinutes"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => refreshEditOperatorSentence({ els }));
  });

  document.getElementById("clear")?.addEventListener("click", () => {
    els.raw.value = "";
    els.out.value = "";
    state.previewRows = [];
    state.manualOverrides = {};
    rerenderPreview();
    updateUIStates();
    renderAdvanced(els.advBox);
    closeEditPanel({ state, els });
  });

  document.getElementById("resetRows")?.addEventListener("click", () => {
    resetShiftRows();
    updateShiftLabel();
    toast("Shift rows reset ✅");
  });

  document.getElementById("refreshAdvanced")?.addEventListener("click", () => renderAdvanced(els.advBox));

  document.getElementById("copyAdvanced")?.addEventListener("click", async () => {
    const ok = await copyAdvancedText();
    toast(ok ? "Advanced copied ✅" : "No shift stats yet");
  });

  document.getElementById("clearShiftStats")?.addEventListener("click", () => {
    clearCurrentShiftStats();
    renderAdvanced(els.advBox);
    toast("Shift stats cleared ✅");
  });

  els.raw?.addEventListener("input", updateUIStates);
  els.out?.addEventListener("input", updateUIStates);

  els.raw?.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      generate();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!els.date.value.trim()) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    els.date.value = `${yyyy}/${mm}/${dd}`;
  }

  console.log("Robot Incident Processing System loaded ✅");
  console.log("Environment:", IS_LOCAL ? "LOCAL" : "PRODUCTION");
  console.log("Daily report update API:", DAILY_REPORT_API);

  bindEvents();
  updateShiftLabel();
  updateUIStates();
  initTemplatesUI();
  renderAdvanced(els.advBox);
  rerenderPreview();
});