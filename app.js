import {
  $,
  DEFAULTS,
  setDot,
  toast,
  esc,
  copyText,
  isValidDateInput,
  cleanLabelSentence,
  makeOperatorSentence
} from "./utils.js";

import {
  preprocessLine,
  extractTime,
  extractDeviceNos,
  splitIntoRecords,
  validateRawInputDetailed,
  inferDeviceTypeFromNo,
  normalizeDeviceNoForColumn,
  normalizePreviewRow,
  applyDuplicateWarnings
} from "./parser.js";

import { classify } from "./classifier.js";
import { initTemplatesUI } from "./templates.js";
import { renderAdvanced, copyAdvancedText, updateShiftStatsFromPreviewRows } from "./stats.js";
import {
  addRowsToShift,
  resetShiftRows,
  getShiftTotal,
  markShiftExportIfNew,
  clearCurrentShiftStats
} from "./storage.js";

/* ---------------- CONTROLLED TEMPLATE SUGGESTIONS ---------------- */

const TEMPLATE_SUGGESTIONS = {
  charging_failure_family: [
    {
      id: "charging_auto",
      label: "Charging → Parameter config → Auto",
      issueType: "设备Equipment",
      quick: "充电异常Abnormal charging",
      subType: "参数配置错误 Parameter configuration error",
      issueDesc: "Charging failure. Parameter configuration error.",
      recovery: "Changed mode to Auto.",
      minutes: 2
    },
    {
      id: "charging_dynamic",
      label: "Charging → Parameter config → Dynamic",
      issueType: "设备Equipment",
      quick: "充电异常Abnormal charging",
      subType: "参数配置错误 Parameter configuration error",
      issueDesc: "Charging failure. Parameter configuration error.",
      recovery: "Changed mode to Dynamic.",
      minutes: 2
    },
    {
      id: "charging_dm_pos_dev",
      label: "Charging → DM code position deviation",
      issueType: "设备Equipment",
      quick: "充电异常Abnormal charging",
      subType: "地脚定位偏差 Ground positioning deviation",
      issueDesc: "Charging failure. DM code position deviation.",
      recovery: "Move closer.",
      minutes: 2
    }
  ],

  failed_take_family: [
    {
      id: "failed_take_wrong_box_position",
      label: "Failed to take → Wrong box position",
      issueType: "设备Equipment",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "取放箱位置错误 Wrong pick and place box position",
      issueDesc: "Failed to take a case. Wrong box position.",
      recovery: "Recovery.",
      minutes: 3
    },
    {
      id: "failed_take_hit_workstation",
      label: "Failed to take → Hit workstation",
      issueType: "设备Equipment",
      quick: "撞货架Collision with Shelf",
      subType: "取放箱位置错误 Wrong pick and place box position",
      issueDesc: "Failed to take the box. Hit the workstation.",
      recovery: "Change of position and recovery.",
      minutes: 4
    },
    {
      id: "failed_take_robot_already_with_box",
      label: "Failed to take → Robot already with box",
      issueType: "系统System",
      quick: "货叉检测无容器Forklift detection without container",
      subType: "程序逻辑BUG Program logic bug",
      issueDesc: "Failed to take the box. Robot already with box.",
      recovery: "Put box back.",
      minutes: 3
    },
    {
      id: "failed_take_back_support",
      label: "Failed to take → Back support mechanism",
      issueType: "设备Equipment",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "背撑机构异常 Abnormality of back support mechanism",
      issueDesc: "Failed to take a case. Abnormal back support mechanism.",
      recovery: "Recovery.",
      minutes: 4
    },
    {
      id: "failed_take_unknown",
      label: "Failed to take → Unknown reason",
      issueType: "设备Equipment",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Failed to take a case. Unknown reason.",
      recovery: "Recovery.",
      minutes: 4
    }
  ],

  failed_place_family: [
    {
      id: "failed_place_material_high",
      label: "Failed to place → Material box too high",
      issueType: "设备Equipment",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "物料超高 Material super high",
      issueDesc: "Failed to place a case. Material box too high.",
      recovery: "Recovery.",
      minutes: 4
    },
    {
      id: "failed_place_cross_beam",
      label: "Failed to place → Cross beam damaged",
      issueType: "施工Construction",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "跨梁凸起 Cross beam",
      issueDesc: "Failed to place a case. Cross beam damaged.",
      recovery: "Recovery.",
      minutes: 4
    },
    {
      id: "failed_place_dropped_case",
      label: "Failed to place → Dropped case",
      issueType: "设备Equipment",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "取放箱位置错误 Wrong pick and place box position",
      issueDesc: "Abnormal box delivery. Failed to place a case, dropped case.",
      recovery: "Recovery.",
      minutes: 3
    },
    {
      id: "failed_place_tote_misaligned",
      label: "Failed to place → Tote misaligned",
      issueType: "设备Equipment",
      quick: "卡箱异常Box stuck",
      subType: "取放箱位置错误 Wrong pick and place box position",
      issueDesc: "Kiva failed to place a case. Tote misaligned during transfer, left hanging diagonally in rack.",
      recovery: "Recovery.",
      minutes: 5
    },
    {
      id: "failed_place_unknown",
      label: "Failed to place → Unknown reason",
      issueType: "设备Equipment",
      quick: "取放货异常Abnormal pick-up and delivery",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Failed to place a case. Unknown reason.",
      recovery: "Recovery.",
      minutes: 4
    }
  ],

  unable_drive_family: [
    {
      id: "unable_drive_dirty_dm",
      label: "Unable to drive → Dirty DM code",
      issueType: "环境Environment",
      quick: "行走异常Unable to drive",
      subType: "地面码脏污 Ground code dirty",
      issueDesc: "Unable to drive. Dirty DM code.",
      recovery: "DM was cleaned, recovery key.",
      minutes: 2
    },
    {
      id: "unable_drive_missing_dm",
      label: "Unable to drive → Missing DM code",
      issueType: "设备Equipment",
      quick: "行走异常Unable to drive",
      subType: "底盘相机故障 Chassis camera malfunction",
      issueDesc: "Unable to drive. Missing DM code.",
      recovery: "Recovery key and set to DM code.",
      minutes: 3
    },
    {
      id: "unable_drive_uneven_ground",
      label: "Unable to drive → Uneven ground",
      issueType: "环境Environment",
      quick: "行走异常Unable to drive",
      subType: "地面不平 Uneven ground",
      issueDesc: "Unable to drive. Uneven ground.",
      recovery: "Recovery.",
      minutes: 2
    },
    {
      id: "unable_drive_ground_seam",
      label: "Unable to drive → Ground seam effect",
      issueType: "环境Environment",
      quick: "行走异常Unable to drive",
      subType: "地缝影响 Ground seam effect",
      issueDesc: "Unable to drive. Ground seam effect.",
      recovery: "Recovery.",
      minutes: 2
    },
    {
      id: "unable_drive_foreign_object",
      label: "Unable to drive → Foreign object",
      issueType: "客户Customer",
      quick: "行走异常Unable to drive",
      subType: "地面异物Foreign objects on the ground",
      issueDesc: "Unable to drive. Foreign object on the floor.",
      recovery: "DM was cleaned, recovery key.",
      minutes: 2
    },
    {
      id: "unable_drive_lost_track_tally",
      label: "Unable to drive → Lost track in tally station",
      issueType: "设备Equipment",
      quick: "行走异常Unable to drive",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Unable to drive. Lost track in tally station.",
      recovery: "Recovery.",
      minutes: 2
    },
    {
      id: "lost_track_no_sound",
      label: "Lost track → No sound",
      issueType: "设备Equipment",
      quick: "行走异常Unable to drive",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Lost track. No sound.",
      recovery: "Recovery.",
      minutes: 2
    },
    {
      id: "moving_abnormal",
      label: "Moving abnormal",
      issueType: "设备Equipment",
      quick: "行走异常Unable to drive",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Moving abnormal.",
      recovery: "Recovery.",
      minutes: 3
    },
    {
      id: "unable_drive_unknown",
      label: "Unable to drive → Unknown reason",
      issueType: "设备Equipment",
      quick: "行走异常Unable to drive",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Unable to drive. Unknown reason.",
      recovery: "Recovery.",
      minutes: 2
    }
  ],

  collision_family: [
    {
      id: "collision_generic",
      label: "Collision → Generic",
      issueType: "设备Equipment",
      quick: "机器人相互碰撞 Two robots collide",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Collision of 2 robots.",
      recovery: "Change of position and recovery.",
      minutes: 2
    },
    {
      id: "collision_kiva_take_case",
      label: "Collision → Kiva tried to take a case",
      issueType: "设备Equipment",
      quick: "机器人相互碰撞 Two robots collide",
      subType: "取放箱位置错误 Wrong pick and place box position",
      issueDesc: "Robots collided while Kiva tried to take a case.",
      recovery: "Change of position and recovery.",
      minutes: 4
    },
    {
      id: "collision_kubot_take_case",
      label: "Collision → Kubot tried to take a case",
      issueType: "设备Equipment",
      quick: "机器人相互碰撞 Two robots collide",
      subType: "取放箱位置错误 Wrong pick and place box position",
      issueDesc: "Robots collided while Kubot tried to take a case.",
      recovery: "Change of position and recovery.",
      minutes: 4
    }
  ],

  box_stuck_family: [
    {
      id: "box_stuck_scanner_problem",
      label: "Box stuck → Scanner problem",
      issueType: "客户Customer",
      quick: "卡箱异常Box stuck",
      subType: "硬件损坏 Hardware damage",
      issueDesc: "Scanner problem on putaway convertline.",
      recovery: "Remove the box.",
      minutes: 3
    },
    {
      id: "box_stuck_unknown",
      label: "Box stuck → Unknown reason",
      issueType: "未知Unknown",
      quick: "卡箱异常Box stuck",
      subType: "操作不规范 Irregular operation",
      issueDesc: "Box stuck on putaway convertline. Unknown reason.",
      recovery: "Remove the box.",
      minutes: 3
    }
  ],

  safety_family: [
    {
      id: "emergency_stop_front",
      label: "Emergency stop → Front button damaged",
      issueType: "设备Equipment",
      quick: "机器人安全装置触发Robot safety device triggered",
      subType: "急停按钮损坏 Emergency stop button is damaged",
      issueDesc: "Emergency stop trigger released. Front emergency stop button damaged.",
      recovery: "Recovery.",
      minutes: 5
    },
    {
      id: "emergency_stop_rear",
      label: "Emergency stop → Rear button damaged",
      issueType: "设备Equipment",
      quick: "机器人安全装置触发Robot safety device triggered",
      subType: "急停按钮损坏 Emergency stop button is damaged",
      issueDesc: "Emergency stop trigger released. Rear emergency stop button damaged.",
      recovery: "Recovery.",
      minutes: 5
    }
  ],

  power_family: [
    {
      id: "robot_totally_uncharged",
      label: "Robot totally uncharged",
      issueType: "设备Equipment",
      quick: "电源模块异常Power module is abnormal",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Robot totally uncharged.",
      recovery: "Moved to charging station.",
      minutes: 4
    },
    {
      id: "battery_communication_failure",
      label: "Battery communication failure",
      issueType: "设备Equipment",
      quick: "电源模块异常Power module is abnormal",
      subType: "无法定义异常 Problem Cannot located",
      issueDesc: "Battery communication failure. Unknown reason.",
      recovery: "Recovery.",
      minutes: 3
    }
  ]
};

/* ------------------------------------------------------------------- */

const state = {
  previewRows: [],
  currentEditIndex: -1,
  manualOverrides: {}
};

const els = {
  date: $("date"),
  deviceType: $("deviceType"),
  status: $("status"),
  tempMeasures: $("tempMeasures"),
  raw: $("raw"),
  out: $("out"),
  defaultMin: $("defaultMin"),
  rowCount: $("rowCount"),
  warnText: $("warnText"),
  validationSummary: $("validationSummary"),
  issuesPanel: $("issuesPanel"),
  issuesCount: $("issuesCount"),
  issuesSummary: $("issuesSummary"),
  issuesList: $("issuesList"),
  templateSuggestionHint: $("templateSuggestionHint"),
  advBox: $("advBox"),
  shiftLabel: $("shiftLabel"),
  shiftTotal: $("shiftTotal"),
  editPanel: $("editPanel"),
  editMeta: $("editMeta"),
  editDeviceType: $("editDeviceType"),
  editDeviceNo: $("editDeviceNo"),
  editMinutes: $("editMinutes"),
  editStartTime: $("editStartTime"),
  editIssueType: $("editIssueType"),
  editQuick: $("editQuick"),
  editSubType: $("editSubType"),
  editConfidence: $("editConfidence"),
  editIssueDesc: $("editIssueDesc"),
  editRecovery: $("editRecovery"),
  editRawLine: $("editRawLine"),
  editRuleLabel: $("editRuleLabel"),
  editMatchedKeywords: $("editMatchedKeywords"),
  editOperatorSentence: $("editOperatorSentence")
};

function normalizeSuggestionText(text){
  return String(text || "")
    .toLowerCase()
    .replace(/[.。,，;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rawIssueTextFromLine(line){
  return String(line || "")
    .replace(/^\s*[^.]+\.\s*/, "")
    .replace(/\s*\d{1,2}:\d{2}\s*$/, "")
    .trim();
}

function buildStandardIssueTextFromItem(item){
  return [
    cleanLabelSentence(item.issueDesc || ""),
    cleanLabelSentence(item.recovery || "")
  ].filter(Boolean).join(" ").trim();
}

function buildStandardIssueTextFromRow(row){
  return [
    cleanLabelSentence(row.issueDesc || ""),
    cleanLabelSentence(row.recovery || "")
  ].filter(Boolean).join(" ").trim();
}

function isExactKnownTemplateText(rawIssueText){
  const rawNorm = normalizeSuggestionText(rawIssueText);
  if(!rawNorm) return false;

  for (const items of Object.values(TEMPLATE_SUGGESTIONS)) {
    for (const item of items) {
      const stdNorm = normalizeSuggestionText(buildStandardIssueTextFromItem(item));
      if (rawNorm === stdNorm) return true;
    }
  }
  return false;
}

function isRowAlreadyUsingStandardTemplate(row){
  const rawIssue = normalizeSuggestionText(rawIssueTextFromLine(row.rawLine || ""));
  const rowStd = normalizeSuggestionText(buildStandardIssueTextFromRow(row));

  if (!rawIssue) return false;
  if (isExactKnownTemplateText(rawIssue)) return true;
  if (rowStd && rawIssue === rowStd) return true;

  return false;
}

function getRowOverrideKey(row){
  return String(row.recIdx);
}

function applyManualOverrideToRow(row){
  const key = getRowOverrideKey(row);
  const override = state.manualOverrides[key];
  if(!override) return row;

  const merged = {
    ...row,
    ...override,
    confidence: override.confidence || row.confidence || "manual-template",
    ruleId: override.ruleId || row.ruleId,
    ruleLabel: override.ruleLabel || row.ruleLabel,
    matchedKeywords: override.matchedKeywords || row.matchedKeywords || ["manual selection"],
    wasNotMatched: override.wasNotMatched ?? row.wasNotMatched ?? false
  };

  return normalizePreviewRow(merged, els.defaultMin.value);
}

function rebuildOutputFromPreviewRows(){
  const cleaned = previewRowsToTSV(state.previewRows)
    .map(x => String(x).trim())
    .filter(Boolean);

  els.out.value = cleaned.join("\n");
}

function addSuggestions(out, groupId){
  const items = TEMPLATE_SUGGESTIONS[groupId] || [];
  items.forEach(item => out.push({ ...item, groupId }));
}

function getTemplateSuggestionsForRow(row){
  const rawIssue = normalizeSuggestionText(rawIssueTextFromLine(row.rawLine || ""));

  // If operator already used a full standard template sentence, do not suggest anything.
  if (isExactKnownTemplateText(rawIssue)) return [];

  const out = [];

  if (rawIssue.includes("charging failure")) {
    addSuggestions(out, "charging_failure_family");
  }

  if (rawIssue.includes("failed to take")) {
    addSuggestions(out, "failed_take_family");
  }

  if (rawIssue.includes("failed to place")) {
    addSuggestions(out, "failed_place_family");
  }

  if (rawIssue.includes("unable to drive")) {
    addSuggestions(out, "unable_drive_family");
  }

  if (rawIssue.includes("collision of 2 robots") || rawIssue.includes("robots collided")) {
    addSuggestions(out, "collision_family");
  }

  if (rawIssue.includes("box stuck")) {
    addSuggestions(out, "box_stuck_family");
  }

  if (rawIssue.includes("emergency stop")) {
    addSuggestions(out, "safety_family");
  }

  if (rawIssue.includes("battery") || rawIssue.includes("uncharged")) {
    addSuggestions(out, "power_family");
  }

  const seen = new Set();
  return out.filter(item => {
    const key = `${item.label}||${item.issueDesc}||${item.recovery}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shouldShowSuggestionsForRow(row, suggestions){
  if(!suggestions.length) return false;

  // Already a proper full template sentence -> no suggestions
  if(isRowAlreadyUsingStandardTemplate(row)) return false;

  const warnings = row.warnings || [];

  if(row.ruleId === "fallback_default") return true;
  if(row.wasNotMatched === true) return true;
  if(warnings.includes("Not matched classification")) return true;
  if(row.confidence === "low") return true;
  if(row.confidence === "medium") return true;

  return false;
}

function renderSuggestionButtons(row, rowIndex){
  const suggestions = getTemplateSuggestionsForRow(row);

  if(!shouldShowSuggestionsForRow(row, suggestions)){
    return "";
  }

  return `
    <div class="issueBox">
      <div><b>Suggested templates:</b></div>
      <div class="templateSuggestionList" data-suggestion-row="${rowIndex}">
        ${suggestions.map((item, suggestionIndex) => `
          <button
            type="button"
            class="suggestionBtn"
            data-row-index="${rowIndex}"
            data-suggestion-group="${esc(item.groupId)}"
            data-suggestion-index="${suggestionIndex}"
          >
            <span class="suggestionTitle">${esc(item.label)}</span>
            <span class="suggestionMeta">${esc(item.issueDesc)} ${esc(item.recovery)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function applySuggestedTemplate(rowIndex, suggestionGroupId, suggestionIndex){
  const row = state.previewRows[rowIndex];
  if(!row) return;

  const suggestions = getTemplateSuggestionsForRow(row);
  const template = suggestions[suggestionIndex];
  if(!template) return;

  const wasNotMatched =
    row.ruleId === "fallback_default" ||
    (row.warnings || []).includes("Not matched classification") ||
    row.wasNotMatched === true;

  const override = {
    issueType: template.issueType,
    quick: template.quick,
    subType: template.subType,
    issueDesc: template.issueDesc,
    recovery: template.recovery,
    minutes: template.minutes,
    confidence: "manual-template",
    ruleId: `manual_template_${template.id}`,
    ruleLabel: `Manual template: ${template.label}`,
    matchedKeywords: ["manual selection"],
    wasNotMatched
  };

  const key = getRowOverrideKey(row);
  state.manualOverrides[key] = override;

  state.previewRows[rowIndex] = applyManualOverrideToRow({
    ...row,
    ...override,
    wasNotMatched,
    warnings: row.warnings || [],
    criticalErrors: row.criticalErrors || []
  });

  applyDuplicateWarnings(state.previewRows);
  renderIssuesPanel(state.previewRows);
  updateUIStates();
  toast("Template applied ✅");
}

function updateShiftLabel(){
  const info = getShiftTotal();
  els.shiftLabel.textContent = info.shift.label;
  els.shiftTotal.textContent = String(info.total);
}

function renderValidationSummary(v){
  const totalWarnings = v.warnings.length;
  const totalErrors = v.errors.length;

  if(!totalWarnings && !totalErrors){
    els.validationSummary.style.display = "none";
    els.validationSummary.innerHTML = "";
    return;
  }

  els.validationSummary.style.display = "block";
  els.validationSummary.className = `issueBox ${totalErrors ? "errBox" : "warnBox"}`;
  els.validationSummary.innerHTML = `
    <div><b>Validation summary</b></div>
    <div style="margin-top:6px;">
      <span class="pill ${totalErrors ? "bad" : "low"}">Errors: ${totalErrors}</span>
      <span class="pill ${totalWarnings ? "medium" : "low"}" style="margin-left:8px;">Warnings: ${totalWarnings}</span>
    </div>
    <div style="margin-top:8px;">
      ${v.errors.slice(0,5).map(x => `<div>🔴 Line ${x.line}: ${esc(x.msg)}</div>`).join("")}
      ${v.warnings.slice(0,5).map(x => `<div>🟡 Line ${x.line}: ${esc(x.msg)}</div>`).join("")}
    </div>
  `;
}

function validateRawInput(){
  const v = validateRawInputDetailed(els.raw.value || "");
  renderValidationSummary(v);

  const fmt = (arr, icon) =>
    arr.slice(0, 3).map(x => `${icon} L${x.line}: ${x.msg}`).join(" | ") +
    (arr.length > 3 ? ` | +${arr.length - 3} more…` : "");

  if(v.errors.length){
    els.warnText.textContent = fmt(v.errors, "🔴");
    setDot("rawDot", "err");
    els.raw.classList.add("inputError");
    els.raw.classList.remove("inputWarning");
  } else if(v.warnings.length){
    els.warnText.textContent = fmt(v.warnings, "🟡");
    setDot("rawDot", "warn");
    els.raw.classList.add("inputWarning");
    els.raw.classList.remove("inputError");
  } else {
    els.warnText.textContent = "🟢 Valid";
    setDot("rawDot", "ok");
    els.raw.classList.remove("inputWarning", "inputError");
  }

  if(!(els.raw.value || "").trim()){
    setDot("rawDot", "");
    els.warnText.textContent = "";
    els.raw.classList.remove("inputWarning", "inputError");
    els.validationSummary.style.display = "none";
  }

  return v;
}

function buildPreviewRecords(){
  const rawText = (els.raw.value || "").trim();
  if(!rawText) return [];

  const recs = splitIntoRecords(rawText);
  const fallbackDeviceType = els.deviceType.value.trim() || DEFAULTS.deviceType;
  const status = els.status.value.trim() || DEFAULTS.status;
  const tempMeasuresDefault = els.tempMeasures.value.trim() || DEFAULTS.recovery;
  const preview = [];
  const date = els.date.value.trim();

  recs.forEach((rec, recIdx) => {
    const processed = preprocessLine(rec.line);
    const startTime = extractTime(processed);
    const c = classify(processed, {
      defaultRecovery: tempMeasuresDefault,
      defaultMin: els.defaultMin.value
    });

    const deviceNosRaw = extractDeviceNos(processed);
    const discoverer = rec.name ? `@${rec.name}` : "@";

    if(!deviceNosRaw.length){
      preview.push(normalizePreviewRow({
        recIdx,
        date,
        name: rec.name,
        rawLine: rec.line,
        normalizedLine: c.txt,
        deviceType: fallbackDeviceType,
        deviceNo: "",
        issueType: c.issueType,
        quick: c.quick,
        subType: c.subType,
        issueDesc: c.issueDesc,
        recovery: c.recovery,
        status,
        discoverer,
        startTime,
        minutes: c.minutes,
        ruleId: c.ruleId,
        ruleLabel: c.ruleLabel,
        matchedKeywords: c.matchedKeywords,
        confidence: c.confidence,
        wasNotMatched: c.ruleId === "fallback_default",
        warnings: ["No device number parsed"],
        criticalErrors: ["Device number unresolved"]
      }, els.defaultMin.value));
      return;
    }

    deviceNosRaw.forEach(raw => {
      const deviceNo = normalizeDeviceNoForColumn(raw);
      const deviceType = inferDeviceTypeFromNo(raw, fallbackDeviceType);

      const warnings = [];
      const criticalErrors = [];

      if(!startTime) warnings.push("Missing time");
      if(c.ruleId === "fallback_default") warnings.push("Not matched classification");
      if(!deviceNo){
        warnings.push("Device number unresolved");
        criticalErrors.push("Device number unresolved");
      }

      preview.push(normalizePreviewRow({
        recIdx,
        date,
        name: rec.name,
        rawLine: rec.line,
        normalizedLine: c.txt,
        deviceType,
        deviceNo,
        issueType: c.issueType,
        quick: c.quick,
        subType: c.subType,
        issueDesc: c.issueDesc,
        recovery: c.recovery,
        status,
        discoverer,
        startTime,
        minutes: c.minutes,
        ruleId: c.ruleId,
        ruleLabel: c.ruleLabel,
        matchedKeywords: c.matchedKeywords,
        confidence: c.confidence,
        wasNotMatched: c.ruleId === "fallback_default",
        warnings,
        criticalErrors
      }, els.defaultMin.value));
    });
  });

  const previewWithOverrides = preview.map(applyManualOverrideToRow);
  applyDuplicateWarnings(previewWithOverrides);
  return previewWithOverrides;
}

function previewRowsToTSV(rows){
  return rows.map(r => [
    els.date.value.trim(),
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

function renderIssuesPanel(rows){
  if(!rows.length){
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
    btn.addEventListener("click", () => openEditPanel(Number(btn.getAttribute("data-edit-index"))));
  });

  const anySuggestions = rows.some(r => {
    const suggestions = getTemplateSuggestionsForRow(r);
    return shouldShowSuggestionsForRow(r, suggestions);
  });

  if (els.templateSuggestionHint) {
    els.templateSuggestionHint.style.display = anySuggestions ? "block" : "none";
  }

  els.issuesList.querySelectorAll("[data-suggestion-row]").forEach(container => {
    const rowIndex = Number(container.getAttribute("data-suggestion-row"));

    container.querySelectorAll(".suggestionBtn").forEach((btn, suggestionIndex) => {
      btn.addEventListener("click", () => {
        const suggestionGroupId = btn.getAttribute("data-suggestion-group");
        applySuggestedTemplate(rowIndex, suggestionGroupId, suggestionIndex);
      });
    });
  });
}

function previewOnly(){
  const rawText = (els.raw.value || "").trim();
  if(!rawText){
    toast("Raw input is empty");
    els.raw.focus();
    return;
  }

  state.previewRows = buildPreviewRecords();
  renderIssuesPanel(state.previewRows);
  updateUIStates();
  toast("Preview ready ✅");
}

function generate(){
  const rawText = (els.raw.value || "").trim();
  if(!rawText){
    toast("Raw input is empty");
    els.raw.focus();
    return;
  }

  if(!isValidDateInput(els.date.value.trim())){
    toast("Date must be YYYY/MM/DD");
    els.date.focus();
    return;
  }

  state.previewRows = buildPreviewRecords();
  renderIssuesPanel(state.previewRows);

  const criticalRows = state.previewRows.filter(r => (r.criticalErrors || []).length > 0);
  if(criticalRows.length){
    toast(`Blocked: ${criticalRows.length} row(s) have critical errors`);
    return;
  }

  rebuildOutputFromPreviewRows();

  const finalText = els.out.value;

  const semanticSignature = JSON.stringify(
    state.previewRows.map(r => [
      els.date.value.trim(),
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

  const isNewExport = markShiftExportIfNew(finalText, semanticSignature);

  if(isNewExport){
    addRowsToShift(state.previewRows.length);
    updateShiftStatsFromPreviewRows(state.previewRows);
  }

  updateShiftLabel();
  renderAdvanced(els.advBox);
  updateUIStates();
  toast(isNewExport ? "Generated ✅" : "Generated ✅ (stats not re-counted)");
}

function updateUIStates(){
  const raw = els.raw.value || "";
  const out = els.out.value || "";
  validateRawInput();

  const rawLines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean).length;
  const previewLines = state.previewRows.length;
  const outLines = out.split(/\n/).filter(Boolean).length;
  els.rowCount.textContent = `Raw: ${rawLines} · Preview: ${previewLines} · Output: ${outLines}`;

  if(!out.trim()) setDot("outDot", "");
  else setDot("outDot", "ok");
}

function openEditPanel(index){
  const row = state.previewRows[index];
  if(!row) return;

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

function closeEditPanel(){
  state.currentEditIndex = -1;
  if (els.editPanel) els.editPanel.style.display = "none";
}

function refreshEditOperatorSentence(){
  const tempRow = normalizePreviewRow({
    deviceNo: els.editDeviceNo.value.trim(),
    issueDesc: els.editIssueDesc.value.trim(),
    recovery: els.editRecovery.value.trim(),
    startTime: els.editStartTime.value.trim(),
    minutes: Number(els.editMinutes.value) || Number(els.defaultMin.value) || DEFAULTS.minutes
  }, els.defaultMin.value);

  els.editOperatorSentence.textContent = tempRow.operatorSentence || makeOperatorSentence(tempRow);
}

function applyEdit(){
  if(state.currentEditIndex < 0 || !state.previewRows[state.currentEditIndex]) return;

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

  const key = getRowOverrideKey(row);
  state.manualOverrides[key] = {
    ...(state.manualOverrides[key] || {}),
    ...override
  };

  const updated = {
    ...row,
    ...override,
    criticalErrors: []
  };

  if(!updated.deviceNo){
    updated.criticalErrors.push("Device number unresolved");
  }

  updated.warnings = (updated.warnings || []).filter(w => w !== "Possible duplicate row");
  if(!updated.startTime){
    updated.warnings = [...new Set([...(updated.warnings || []), "Missing time"])];
  }

  state.previewRows[state.currentEditIndex] = normalizePreviewRow(updated, els.defaultMin.value);
  applyDuplicateWarnings(state.previewRows);

  renderIssuesPanel(state.previewRows);
  updateUIStates();
  toast("Row updated ✅");
}

function loadExample(){
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

async function copyTSV(){
  const text = els.out.value;
  if(!text){
    toast("Output is empty");
    return;
  }
  const ok = await copyText(text);
  toast(ok ? "Copied ✅" : "Ctrl+C (clipboard blocked)");
}

function downloadTSV(){
  const text = els.out.value || "";
  const blob = new Blob([text], { type:"text/tab-separated-values;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `issue_list_${(els.date.value || "export").replaceAll("/","-")}.tsv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded", () => {
  if(!els.date.value.trim()){
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    els.date.value = `${yyyy}/${mm}/${dd}`;
  }

  $("previewBtn")?.addEventListener("click", previewOnly);
  $("gen")?.addEventListener("click", generate);
  $("copy")?.addEventListener("click", copyTSV);
  $("download")?.addEventListener("click", downloadTSV);
  $("loadExample")?.addEventListener("click", loadExample);

  $("applyEdit")?.addEventListener("click", applyEdit);
  $("cancelEdit")?.addEventListener("click", closeEditPanel);

  ["editDeviceNo", "editIssueDesc", "editRecovery", "editStartTime", "editMinutes"].forEach(id => {
    $(id)?.addEventListener("input", refreshEditOperatorSentence);
  });

  $("clear")?.addEventListener("click", () => {
    els.raw.value = "";
    els.out.value = "";
    state.previewRows = [];
    state.manualOverrides = {};
    renderIssuesPanel([]);
    updateUIStates();
    renderAdvanced(els.advBox);
    closeEditPanel();
  });

  $("resetRows")?.addEventListener("click", () => {
    resetShiftRows();
    updateShiftLabel();
    toast("Shift rows reset ✅");
  });

  $("refreshAdvanced")?.addEventListener("click", () => renderAdvanced(els.advBox));
  $("copyAdvanced")?.addEventListener("click", async () => {
    const ok = await copyAdvancedText();
    toast(ok ? "Advanced copied ✅" : "No shift stats yet");
  });

  $("clearShiftStats")?.addEventListener("click", () => {
    clearCurrentShiftStats();
    renderAdvanced(els.advBox);
    toast("Shift stats cleared ✅");
  });

  els.raw?.addEventListener("input", updateUIStates);
  els.out?.addEventListener("input", updateUIStates);

  els.raw?.addEventListener("keydown", (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      generate();
    }
  });

  updateShiftLabel();
  updateUIStates();
  initTemplatesUI();
  renderAdvanced(els.advBox);

  console.log("Issue Log Fixer loaded ✅");
});