import { cleanLabelSentence, copyText } from "../utils.js";

export function previewRowsToTSV(rows, date) {
  return rows.map(r => [
    date,
    r.deviceType || "",
    "",
    r.deviceNo || "",
    r.issueType || "",
    r.quick || "",
    r.subType || "",
    cleanLabelSentence(r.issueDesc || ""),
    cleanLabelSentence(r.recovery || ""),
    r.status || "",
    r.discoverer || "@",
    r.startTime || "",
    r.endTime || "",
    r.abnormal || ""
  ].join("\t"));
}

export function rebuildOutputFromPreviewRows({ rows, date, outElement }) {
  const cleaned = previewRowsToTSV(rows, date)
    .map(x => String(x).trim())
    .filter(Boolean);

  outElement.value = cleaned.join("\n");
}

export async function copyTSV(text) {
  if (!text) return false;
  return await copyText(text);
}

export function downloadTSV(text, date) {
  const blob = new Blob([text], { type: "text/tab-separated-values;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `issue_list_${(date || "export").replaceAll("/", "-")}.tsv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function buildSemanticSignature(rows, date) {
  return JSON.stringify(
    rows.map(r => [
      date,
      r.deviceType,
      r.deviceNo,
      r.issueType,
      r.quick,
      r.subType,
      cleanLabelSentence(r.issueDesc),
      cleanLabelSentence(r.recovery),
      r.startTime,
      r.endTime,
      r.abnormal
    ])
  );
}