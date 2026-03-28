import { esc, makeOperatorSentence } from "../utils.js";

export function renderIssuesPanel({
  rows,
  els,
  correctionEngine,
  onEdit,
  onApplySuggestion
}) {
  if (!rows.length) {
    els.issuesPanel.style.display = "none";
    els.issuesList.innerHTML = "";
    els.issuesCount.textContent = "0 item(s)";
    els.issuesSummary.style.display = "none";
    els.issuesSummary.innerHTML = "";
    if (els.templateSuggestionHint) els.templateSuggestionHint.style.display = "none";
    return;
  }

  els.issuesPanel.style.display = "block";
  els.issuesCount.textContent = `${rows.length} item(s)`;

  const notMatchedCount = rows.filter(r =>
    r.ruleId === "fallback_default" ||
    (r.warnings || []).includes("Not matched classification") ||
    String(r.ruleLabel || "").toLowerCase().includes("not matched")
  ).length;

  const warnCount = rows.filter(r => (r.warnings || []).length > 0).length;
  const errorCount = rows.filter(r => (r.criticalErrors || []).length > 0).length;
  const highCount = rows.filter(r => r.confidence === "high").length;
  const mediumCount = rows.filter(r => r.confidence === "medium").length;
  const manualCount = rows.filter(r => r.confidence === "manual-template").length;
  const dupCount = rows.filter(r => (r.warnings || []).includes("Possible duplicate row")).length;

  els.issuesSummary.style.display = "block";
  els.issuesSummary.innerHTML = `
    <span class="pill high">High: ${highCount}</span>
    <span class="pill medium" style="margin-left:8px;">Medium: ${mediumCount}</span>
    <span class="pill high" style="margin-left:8px;">Manual: ${manualCount}</span>
    <span class="pill medium" style="margin-left:8px;">Warnings: ${warnCount}</span>
    <span class="pill bad" style="margin-left:8px;">Errors: ${errorCount}</span>
    <span class="pill bad" style="margin-left:8px;">Not matched: ${notMatchedCount}</span>
    <span class="pill bad" style="margin-left:8px;">Duplicates: ${dupCount}</span>
  `;

  const renderSuggestionButtons = (row, rowIndex) => {
    const suggestions = correctionEngine.getTemplateSuggestionsForRow(row);

    if (!correctionEngine.shouldShowSuggestionsForRow(row, suggestions)) {
      return "";
    }

    return `
      <div class="issueBox">
        <div><b>Suggested templates:</b></div>
        <div class="templateSuggestionList" data-suggestion-row="${rowIndex}">
          ${suggestions.map(item => `
            <button
              type="button"
              class="suggestionBtn"
              data-row-index="${rowIndex}"
              data-template-id="${esc(item.id)}"
            >
              <span class="suggestionTitle">${esc(item.label)}</span>
              <span class="suggestionMeta">${esc(item.issueDesc)} ${esc(item.recovery)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  };

  const rowsHtml = rows.map((r, idx) => {
    const confidenceClass =
      r.confidence === "high" ? "high" :
      r.confidence === "medium" ? "medium" :
      r.confidence === "manual-template" ? "high" :
      "high";

    const warningHtml = (r.warnings || []).length
      ? `<div class="issueBox warnBox"><b>Warnings:</b> ${(r.warnings || []).map(esc).join(" · ")}</div>`
      : "";

    const errorHtml = (r.criticalErrors || []).length
      ? `<div class="issueBox errBox"><b>Critical errors:</b> ${(r.criticalErrors || []).map(esc).join(" · ")}</div>`
      : "";

    const suggestionHtml = renderSuggestionButtons(r, idx);

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><code>${esc(r.deviceNo || "—")}</code></td>
        <td>${esc(r.deviceType || "—")}</td>
        <td><span class="pill ${confidenceClass}">${esc(r.confidence)}</span></td>
        <td><code>${esc(r.ruleId)}</code></td>
        <td>${esc(r.ruleLabel || "—")}</td>
        <td>${esc(r.issueDesc)}</td>
        <td>${esc(r.recovery)}</td>
        <td>${esc(String(r.minutes))}</td>
        <td>${esc(r.startTime || "—")}</td>
        <td>${esc(r.endTime || "—")}</td>
        <td><button type="button" data-edit-index="${idx}">Edit</button></td>
      </tr>
      <tr>
        <td></td>
        <td colspan="11">
          <div class="issueBox">
            <div><b>Raw:</b> ${esc(r.rawLine)}</div>
            <div style="margin-top:6px;"><b>Normalized:</b> ${esc(r.normalizedLine)}</div>
            <div style="margin-top:6px;"><b>Issue Type:</b> ${esc(r.issueType)}</div>
            <div style="margin-top:6px;"><b>Quick Class:</b> ${esc(r.quick)}</div>
            <div style="margin-top:6px;"><b>Subtype:</b> ${esc(r.subType)}</div>
            <div style="margin-top:6px;"><b>Matched keywords:</b> ${esc((r.matchedKeywords || []).join(", ") || "—")}</div>
            <div style="margin-top:6px;"><b>Operator-ready:</b> <code>${esc(r.operatorSentence || makeOperatorSentence(r))}</code></div>
          </div>
          ${warningHtml}
          ${errorHtml}
          ${suggestionHtml}
        </td>
      </tr>
    `;
  }).join("");

  els.issuesList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Device No</th>
          <th>Device Type</th>
          <th>Confidence</th>
          <th>Rule</th>
          <th>Rule Label</th>
          <th>Issue</th>
          <th>Recovery</th>
          <th>Min</th>
          <th>Start</th>
          <th>End</th>
          <th>Edit</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  els.issuesList.querySelectorAll("[data-edit-index]").forEach(btn => {
    btn.addEventListener("click", () => onEdit(Number(btn.getAttribute("data-edit-index"))));
  });

  const anySuggestions = rows.some(r => {
    const suggestions = correctionEngine.getTemplateSuggestionsForRow(r);
    return correctionEngine.shouldShowSuggestionsForRow(r, suggestions);
  });

  if (els.templateSuggestionHint) {
    els.templateSuggestionHint.style.display = anySuggestions ? "block" : "none";
  }

  els.issuesList.querySelectorAll(".suggestionBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const rowIndex = Number(btn.getAttribute("data-row-index"));
      const templateId = btn.getAttribute("data-template-id");
      onApplySuggestion(rowIndex, templateId);
    });
  });
}