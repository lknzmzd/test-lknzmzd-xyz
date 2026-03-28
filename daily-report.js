import { renderDailyReport, copyDailyReportText } from "./stats.js";
import { clearCurrentShiftStats } from "./storage.js";

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

function refreshDailyReport() {
  if (!reportEl) return;
  renderDailyReport(reportEl);
}

function closeResetModal() {
  if (!resetModal) return;
  resetModal.classList.add("hidden");
  if (resetPasswordInput) resetPasswordInput.value = "";
  if (resetMessage) resetMessage.textContent = "";
}

function openResetModal() {
  if (!resetModal) return;
  resetModal.classList.remove("hidden");
  if (resetPasswordInput) resetPasswordInput.value = "";
  if (resetMessage) resetMessage.textContent = "";
}

reportDate.textContent = new Date().toISOString().slice(0, 10);
refreshDailyReport();

copyBtn?.addEventListener("click", async () => {
  const ok = await copyDailyReportText();
  reportStatus.textContent = ok ? "Daily report copied." : "Nothing to copy yet.";
});

resetReportBtn?.addEventListener("click", () => {
  openResetModal();
});

cancelResetBtn?.addEventListener("click", () => {
  closeResetModal();
});

saveReportBtn?.addEventListener("click", async () => {
  reportStatus.textContent = "Refreshing daily report...";
  refreshDailyReport();
  reportStatus.textContent = "Daily report updated.";
});

confirmResetBtn?.addEventListener("click", async () => {
  const password = (resetPasswordInput?.value || "").trim();

  if (!password) {
    resetMessage.textContent = "Password is required.";
    return;
  }

  resetMessage.textContent = "Checking password...";

  try {
    const response = await fetch("http://localhost:3000/api/daily-report/reset", {
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

    clearCurrentShiftStats();
    refreshDailyReport();

    resetMessage.textContent = "Reset successful.";
    reportStatus.textContent = "Current shift daily report was reset.";

    setTimeout(() => {
      closeResetModal();
    }, 700);
  } catch (err) {
    resetMessage.textContent = "Server error. Could not verify password.";
    console.error(err);
  }
});