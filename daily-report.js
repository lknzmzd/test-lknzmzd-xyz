const reportDate = document.getElementById("reportDate");
const saveReportBtn = document.getElementById("saveReportBtn");
const resetReportBtn = document.getElementById("resetReportBtn");
const reportStatus = document.getElementById("reportStatus");

const resetModal = document.getElementById("resetModal");
const resetUsernameInput = document.getElementById("resetUsernameInput");
const resetPasswordInput = document.getElementById("resetPasswordInput");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");
const resetMessage = document.getElementById("resetMessage");

const reportEl = document.getElementById("dailyReportContainer");
const copyBtn = document.getElementById("copyDailyReportBtn");

const lastAddedByEl = document.getElementById("lastAddedBy");
const lastAddedAtEl = document.getElementById("lastAddedAt");
const lastResetByEl = document.getElementById("lastResetBy");
const lastResetAtEl = document.getElementById("lastResetAt");
const lastResetIpEl = document.getElementById("lastResetIp");
const addHistoryListEl = document.getElementById("addHistoryList");
const resetHistoryListEl = document.getElementById("resetHistoryList");

const systemStatusValueEl = document.getElementById("systemStatusValue");
const statusLastUpdateEl = document.getElementById("statusLastUpdate");
const statusCurrentTotalEl = document.getElementById("statusCurrentTotal");
const statusLastAddedByEl = document.getElementById("statusLastAddedBy");

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
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("sv-SE").replace("T", " ");
}

function renderList(title, entries) {
  const items = entries.length
    ? entries.map(([k, v]) => `<li><code>${escapeHtml(k)}</code> → <b>${v}</b></li>`).join("")
    : `<li class="empty-item">—</li>`;

  return `
    <div style="margin-top:10px;"><b>${escapeHtml(title)}</b></div>
    <ul class="advList">${items}</ul>
  `;
}

function renderHistoryList(container, items, mode) {
  if (!container) return;

  if (!Array.isArray(items) || !items.length) {
    container.className = "history-box empty-state";
    container.innerHTML = mode === "add"
      ? `<div class="empty-title">No add history yet</div><div class="empty-subtitle">New add actions will appear here.</div>`
      : `<div class="empty-title">No reset history yet</div><div class="empty-subtitle">Reset actions will appear here after the first authorized reset.</div>`;
    return;
  }

  container.className = "history-box";

  container.innerHTML = `
    <ul class="advList">
      ${items.slice().reverse().map(item => {
        if (mode === "add") {
          return `
            <li>
              <b>${escapeHtml(item.name || item.username || "—")}</b>
              (${escapeHtml(item.username || "—")})
              → added <b>${escapeHtml(item.addedRows ?? 0)}</b> rows
              → ${escapeHtml(formatDateTime(item.at))}
              ${item.ip ? `<span style="opacity:.75;">(IP: ${escapeHtml(item.ip)})</span>` : ""}
            </li>
          `;
        }

        return `
          <li>
            <b>${escapeHtml(item.name || item.username || "—")}</b>
            (${escapeHtml(item.username || "—")})
            → reset at <b>${escapeHtml(formatDateTime(item.at))}</b>
            ${item.ip ? `<span style="opacity:.75;">(IP: ${escapeHtml(item.ip)})</span>` : ""}
          </li>
        `;
      }).join("")}
    </ul>
  `;
}

function closeResetModal() {
  resetModal?.classList.add("hidden");
  if (resetUsernameInput) resetUsernameInput.value = "";
  if (resetPasswordInput) resetPasswordInput.value = "";
  if (resetMessage) resetMessage.textContent = "";
}

function openResetModal() {
  resetModal?.classList.remove("hidden");
  if (resetUsernameInput) resetUsernameInput.value = "";
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

    lastAddedBy: data.lastAddedBy || null,
    lastAddedName: data.lastAddedName || null,
    lastAddedAt: data.lastAddedAt || null,
    addHistory: Array.isArray(data.addHistory) ? data.addHistory : [],

    resetAt: data.resetAt || null,
    lastResetBy: data.lastResetBy || null,
    lastResetName: data.lastResetName || null,
    lastResetIp: data.lastResetIp || null,
    resetHistory: Array.isArray(data.resetHistory) ? data.resetHistory : []
  };
}

function buildCopyText(data) {
  const fmtTop = (title, obj, limit = 5) => {
    const items = topN(obj, limit);
    const lines = items.length ? items.map(([k, v]) => `- ${k} → ${v}`) : ["- —"];
    return `${title}\n${lines.join("\n")}`;
  };

  const firstAdded = formatDateTime(data.firstAddedAt);
  const updated = formatDateTime(data.updatedAt);
  const lastAddedBy = data.lastAddedName
    ? `${data.lastAddedName} (${data.lastAddedBy || "—"})`
    : (data.lastAddedBy || "—");
  const lastResetBy = data.lastResetName
    ? `${data.lastResetName} (${data.lastResetBy || "—"})`
    : (data.lastResetBy || "—");

  return [
    "Daily report",
    `Date: ${data.reportDate || "—"}`,
    `Total errors: ${data.totalErrors || 0}`,
    `First data added: ${firstAdded}`,
    `Last update: ${updated}`,
    `Last added by: ${lastAddedBy}`,
    `Last added at: ${formatDateTime(data.lastAddedAt)}`,
    `Last reset by: ${lastResetBy}`,
    `Last reset at: ${formatDateTime(data.resetAt)}`,
    `Last reset IP: ${data.lastResetIp || "—"}`,
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

function renderTopStatus(data) {
  const currentTotal = Number(data.totalErrors || 0);
  const lastUpdate = formatDateTime(data.updatedAt);
  const lastAddedBy = data.lastAddedName
    ? `${data.lastAddedName} (${data.lastAddedBy || "—"})`
    : (data.lastAddedBy || "—");

  statusCurrentTotalEl.textContent = String(currentTotal);
  statusLastUpdateEl.textContent = lastUpdate;
  statusLastAddedByEl.textContent = lastAddedBy;

  if (currentTotal > 0) {
    systemStatusValueEl.textContent = "Active";
    systemStatusValueEl.className = "status-value status-live";
  } else {
    systemStatusValueEl.textContent = "Standby";
    systemStatusValueEl.className = "status-value status-idle";
  }
}

function renderDailyReport(data) {
  const firstAdded = formatDateTime(data.firstAddedAt);
  const updated = formatDateTime(data.updatedAt);

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

  renderTopStatus(data);

  if (lastAddedByEl) {
    lastAddedByEl.textContent = data.lastAddedName
      ? `${data.lastAddedName} (${data.lastAddedBy || "—"})`
      : (data.lastAddedBy || "—");
  }

  if (lastAddedAtEl) lastAddedAtEl.textContent = formatDateTime(data.lastAddedAt);

  if (lastResetByEl) {
    lastResetByEl.textContent = data.lastResetName
      ? `${data.lastResetName} (${data.lastResetBy || "—"})`
      : (data.lastResetBy || "—");
  }

  if (lastResetAtEl) lastResetAtEl.textContent = formatDateTime(data.resetAt);
  if (lastResetIpEl) lastResetIpEl.textContent = data.lastResetIp || "—";

  renderHistoryList(addHistoryListEl, data.addHistory || [], "add");
  renderHistoryList(resetHistoryListEl, data.resetHistory || [], "reset");

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(data));
      reportStatus.textContent = "Daily report copied.";
    } catch (err) {
      console.error("Copy error:", err);
      reportStatus.textContent = "Clipboard blocked. Copy manually.";
    }
  };
}

async function loadDailyReport() {
  reportStatus.textContent = "Loading daily report...";

  try {
    const response = await fetch(API_BASE, { cache: "no-store" });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      reportStatus.textContent = result.error || result.message || "Could not load daily report.";
      reportEl.innerHTML = "";
      return;
    }

    const data = parseReportData(result.data);
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
  const username = (resetUsernameInput?.value || "").trim();
  const password = (resetPasswordInput?.value || "").trim();

  if (!username || !password) {
    resetMessage.textContent = "Username and password are required.";
    return;
  }

  resetMessage.textContent = "Checking authorization...";

  try {
    const response = await fetch(`${API_BASE}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      resetMessage.textContent =
        result.error ||
        result.message ||
        "Reset failed.";
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