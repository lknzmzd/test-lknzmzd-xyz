const reportDate = document.getElementById("reportDate");
const saveReportBtn = document.getElementById("saveReportBtn");
const resetReportBtn = document.getElementById("resetReportBtn");
const reportStatus = document.getElementById("reportStatus");

const resetModal = document.getElementById("resetModal");
const resetPasswordInput = document.getElementById("resetPasswordInput");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");
const resetMessage = document.getElementById("resetMessage");

const reportEl = document.getElementById("dailyReportContainer");
const copyBtn = document.getElementById("copyDailyReportBtn");

const IS_LOCAL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE = IS_LOCAL
  ? "http://localhost:3002/api/daily-report"
  : "https://lknzmzd-daily-report.onrender.com/api/daily-report";

function topN(obj, n = 5) {
  return Object.entries(obj || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderList(title, entries) {
  const items = entries.length
    ? entries.map(([k, v]) => `<li><code>${escapeHtml(k)}</code> → <b>${v}</b></li>`).join("")
    : "<li>—</li>";

  return `
    <div style="margin-top:10px;"><b>${escapeHtml(title)}</b></div>
    <ul class="advList">${items}</ul>
  `;
}

function closeResetModal() {
  resetModal?.classList.add("hidden");
  if (resetPasswordInput) resetPasswordInput.value = "";
  if (resetMessage) resetMessage.textContent = "";
}

function openResetModal() {
  resetModal?.classList.remove("hidden");
  if (resetPasswordInput) resetPasswordInput.value = "";
  if (resetMessage) resetMessage.textContent = "";
}

function parseReportData(rawData) {
  let data = rawData;

  for (let i = 0; i < 10; i++) {
    if (typeof data !== "string") break;
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
      break;
    }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return {
    reportDate: data.reportDate || new Date().toISOString().slice(0, 10),
    totalErrors: Number.isFinite(Number(data.totalErrors)) ? Number(data.totalErrors) : 0,
    byIssueDesc: data.byIssueDesc && typeof data.byIssueDesc === "object" ? data.byIssueDesc : {},
    byDeviceNo: data.byDeviceNo && typeof data.byDeviceNo === "object" ? data.byDeviceNo : {},
    byQuick: data.byQuick && typeof data.byQuick === "object" ? data.byQuick : {},
    byIssueType: data.byIssueType && typeof data.byIssueType === "object" ? data.byIssueType : {},
    byDeviceType: data.byDeviceType && typeof data.byDeviceType === "object" ? data.byDeviceType : {},
    byRuleId: data.byRuleId && typeof data.byRuleId === "object" ? data.byRuleId : {},
    byRuleLabel: data.byRuleLabel && typeof data.byRuleLabel === "object" ? data.byRuleLabel : {},
    byConfidence: data.byConfidence && typeof data.byConfidence === "object" ? data.byConfidence : {},
    firstAddedAt: data.firstAddedAt || null,
    updatedAt: data.updatedAt || null,
    resetAt: data.resetAt || null
  };
}

function buildCopyText(data) {
  const fmtTop = (title, obj, limit = 5) => {
    const items = topN(obj, limit);
    const lines = items.length ? items.map(([k, v]) => `- ${k} → ${v}`) : ["- —"];
    return `${title}\n${lines.join("\n")}`;
  };

  const firstAdded = data.firstAddedAt
    ? new Date(data.firstAddedAt).toLocaleString("sv-SE").replace("T", " ")
    : "—";

  const updated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString("sv-SE").replace("T", " ")
    : "—";

  return [
    "Daily report",
    `Date: ${data.reportDate || "—"}`,
    `Total errors: ${data.totalErrors || 0}`,
    `First data added: ${firstAdded}`,
    `Last update: ${updated}`,
    "",
    fmtTop("Top 5 Issue Description", data.byIssueDesc, 5),
    fmtTop("Top 10 Device No", data.byDeviceNo, 10),
    fmtTop("Top 5 Device Type", data.byDeviceType, 5),
    fmtTop("Top 5 Quick Classification", data.byQuick, 5),
    fmtTop("Top 5 Issue Type", data.byIssueType, 5),
    fmtTop("Top 5 Rule IDs", data.byRuleId, 5),
    fmtTop("Top 5 Rule Labels", data.byRuleLabel, 5),
    fmtTop("Confidence distribution", data.byConfidence, 5)
  ].join("\n");
}

function renderDailyReport(data) {
  const firstAdded = data.firstAddedAt
    ? new Date(data.firstAddedAt).toLocaleString("sv-SE").replace("T", " ")
    : "—";

  const updated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString("sv-SE").replace("T", " ")
    : "—";

  reportDate.textContent = data.reportDate || new Date().toISOString().slice(0, 10);

  reportEl.innerHTML = `
    <div class="small" style="opacity:.85; margin-bottom:8px;">
      <div><b>Date:</b> ${escapeHtml(data.reportDate || "—")}</div>
      <div><b>Total errors:</b> ${data.totalErrors || 0}</div>
      <div><b>First data added:</b> ${escapeHtml(firstAdded)}</div>
      <div><b>Last update:</b> ${escapeHtml(updated)}</div>
    </div>
    ${renderList("Top 5 Issue Description", topN(data.byIssueDesc || {}, 5))}
    ${renderList("Top 10 Device No", topN(data.byDeviceNo || {}, 10))}
    ${renderList("Top 5 Quick Classification", topN(data.byQuick || {}, 5))}
    ${renderList("Top 5 Issue Type", topN(data.byIssueType || {}, 5))}
    ${renderList("Top 5 Device Type", topN(data.byDeviceType || {}, 5))}
    ${renderList("Top 5 Rule IDs", topN(data.byRuleId || {}, 5))}
    ${renderList("Top 5 Rule Labels", topN(data.byRuleLabel || {}, 5))}
    ${renderList("Confidence distribution", topN(data.byConfidence || {}, 5))}
  `;

  copyBtn.onclick = async () => {
    await navigator.clipboard.writeText(buildCopyText(data));
    reportStatus.textContent = "Daily report copied.";
  };
}

async function loadDailyReport() {
  reportStatus.textContent = "Loading daily report...";

  try {
    const response = await fetch(API_BASE, { cache: "no-store" });
    const result = await response.json();

    console.log("API result:", result);

    if (!response.ok || !result.ok) {
      reportStatus.textContent = result.message || "Could not load daily report.";
      reportEl.innerHTML = "";
      return;
    }

    const data = parseReportData(result.data);
    console.log("Parsed data:", data);

    renderDailyReport(data);
    reportStatus.textContent = `Daily report loaded. Total errors: ${data.totalErrors || 0}`;
  } catch (err) {
    console.error("Daily report load error:", err);
    reportStatus.textContent = "Server error while loading daily report.";
    reportEl.innerHTML = "";
  }
}

saveReportBtn?.addEventListener("click", async () => {
  await loadDailyReport();
});

resetReportBtn?.addEventListener("click", () => {
  openResetModal();
});

cancelResetBtn?.addEventListener("click", () => {
  closeResetModal();
});

confirmResetBtn?.addEventListener("click", async () => {
  const password = (resetPasswordInput?.value || "").trim();

  if (!password) {
    resetMessage.textContent = "Password is required.";
    return;
  }

  resetMessage.textContent = "Checking password...";

  try {
    const response = await fetch(`${API_BASE}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      resetMessage.textContent = result.message || "Reset failed.";
      return;
    }

    resetMessage.textContent = "Reset successful.";
    reportStatus.textContent = "Shared daily report was reset.";

    setTimeout(async () => {
      closeResetModal();
      await loadDailyReport();
    }, 700);
  } catch (err) {
    console.error("Daily report reset error:", err);
    resetMessage.textContent = "Server error. Could not reset.";
  }
});

closeResetModal();
loadDailyReport();