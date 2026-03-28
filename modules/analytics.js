import { setDot } from "../utils.js";

export function renderValidationSummary(element, validation) {
  const totalWarnings = validation.warnings.length;
  const totalErrors = validation.errors.length;

  if (!totalWarnings && !totalErrors) {
    element.style.display = "none";
    element.innerHTML = "";
    return;
  }

  element.style.display = "block";
  element.className = `issueBox ${totalErrors ? "errBox" : "warnBox"}`;
  element.innerHTML = `
    <div><b>Validation summary</b></div>
    <div style="margin-top:6px;">
      <span class="pill ${totalErrors ? "bad" : "low"}">Errors: ${totalErrors}</span>
      <span class="pill ${totalWarnings ? "medium" : "low"}" style="margin-left:8px;">Warnings: ${totalWarnings}</span>
    </div>
    <div style="margin-top:8px;">
      ${validation.errors.slice(0, 5).map(x => `<div>🔴 Line ${x.line}: ${x.msg}</div>`).join("")}
      ${validation.warnings.slice(0, 5).map(x => `<div>🟡 Line ${x.line}: ${x.msg}</div>`).join("")}
    </div>
  `;
}

export function updateRawValidationUI({ rawElement, warnTextElement, validationSummaryElement, validation }) {
  renderValidationSummary(validationSummaryElement, validation);

  const fmt = (arr, icon) =>
    arr.slice(0, 3).map(x => `${icon} L${x.line}: ${x.msg}`).join(" | ") +
    (arr.length > 3 ? ` | +${arr.length - 3} more…` : "");

  if (validation.errors.length) {
    warnTextElement.textContent = fmt(validation.errors, "🔴");
    setDot("rawDot", "err");
    rawElement.classList.add("inputError");
    rawElement.classList.remove("inputWarning");
  } else if (validation.warnings.length) {
    warnTextElement.textContent = fmt(validation.warnings, "🟡");
    setDot("rawDot", "warn");
    rawElement.classList.add("inputWarning");
    rawElement.classList.remove("inputError");
  } else {
    warnTextElement.textContent = "🟢 Valid";
    setDot("rawDot", "ok");
    rawElement.classList.remove("inputWarning", "inputError");
  }

  if (!(rawElement.value || "").trim()) {
    setDot("rawDot", "");
    warnTextElement.textContent = "";
    rawElement.classList.remove("inputWarning", "inputError");
    validationSummaryElement.style.display = "none";
  }
}

export function renderRowCount(element, { rawText, previewRows, outText }) {
  const rawLines = rawText.split(/\r?\n/).map(x => x.trim()).filter(Boolean).length;
  const previewLines = previewRows.length;
  const outLines = outText.split(/\n/).filter(Boolean).length;
  element.textContent = `Raw: ${rawLines} · Preview: ${previewLines} · Output: ${outLines}`;
}

export function updateOutputDot(outText) {
  if (!outText.trim()) setDot("outDot", "");
  else setDot("outDot", "ok");
}