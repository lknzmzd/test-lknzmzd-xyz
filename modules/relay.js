export function buildRelayPayload(rows, meta = {}) {
  return {
    system: "Robot Incident Processing System",
    exportedAt: new Date().toISOString(),
    meta,
    totalRows: rows.length,
    rows: rows.map(row => ({
      recIdx: row.recIdx,
      date: row.date,
      deviceType: row.deviceType,
      deviceNo: row.deviceNo,
      issueType: row.issueType,
      quick: row.quick,
      subType: row.subType,
      issueDesc: row.issueDesc,
      recovery: row.recovery,
      status: row.status,
      discoverer: row.discoverer,
      startTime: row.startTime,
      endTime: row.endTime,
      abnormal: row.abnormal,
      confidence: row.confidence,
      ruleId: row.ruleId,
      ruleLabel: row.ruleLabel,
      matchedKeywords: row.matchedKeywords,
      warnings: row.warnings,
      criticalErrors: row.criticalErrors
    }))
  };
}