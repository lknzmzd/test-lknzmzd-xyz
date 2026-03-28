import { cleanLabelSentence } from "../utils.js";
import { normalizePreviewRow, applyDuplicateWarnings } from "../parser.js";

export const TEMPLATE_SUGGESTIONS = {
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

export function createCorrectionEngine({ state, defaultMinutesProvider }) {
  function normalizeSuggestionText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[.。,，;:!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function rawIssueTextFromLine(line) {
    return String(line || "")
      .replace(/^\s*[^.]+\.\s*/, "")
      .replace(/\s*\d{1,2}:\d{2}\s*$/, "")
      .trim();
  }

  function buildStandardIssueTextFromItem(item) {
    return [
      cleanLabelSentence(item.issueDesc || ""),
      cleanLabelSentence(item.recovery || "")
    ].filter(Boolean).join(" ").trim();
  }

  function buildStandardIssueTextFromRow(row) {
    return [
      cleanLabelSentence(row.issueDesc || ""),
      cleanLabelSentence(row.recovery || "")
    ].filter(Boolean).join(" ").trim();
  }

  function isExactKnownTemplateText(rawIssueText) {
    const rawNorm = normalizeSuggestionText(rawIssueText);
    if (!rawNorm) return false;

    for (const items of Object.values(TEMPLATE_SUGGESTIONS)) {
      for (const item of items) {
        const stdNorm = normalizeSuggestionText(buildStandardIssueTextFromItem(item));
        if (rawNorm === stdNorm) return true;
      }
    }
    return false;
  }

  function isRowAlreadyUsingStandardTemplate(row) {
    const rawIssue = normalizeSuggestionText(rawIssueTextFromLine(row.rawLine || ""));
    const rowStd = normalizeSuggestionText(buildStandardIssueTextFromRow(row));

    if (!rawIssue) return false;
    if (isExactKnownTemplateText(rawIssue)) return true;
    if (rowStd && rawIssue === rowStd) return true;

    return false;
  }

  function getRowOverrideKey(row) {
    return [
        String(row.recIdx ?? ""),
        String(row.deviceNo ?? "").trim().toUpperCase(),
        String(row.startTime ?? "").trim(),
        String(row.rawLine ?? "").trim()
    ].join("||");
  }

  function findTemplateById(templateId) {
    for (const group of Object.values(TEMPLATE_SUGGESTIONS)) {
      for (const item of group) {
        if (item.id === templateId) return item;
      }
    }
    return null;
  }

  function applyManualOverrideToRow(row) {
    const key = getRowOverrideKey(row);
    const override = state.manualOverrides[key];
    if (!override) return row;

    const merged = {
      ...row,
      issueType: override.issueType,
      quick: override.quick,
      subType: override.subType,
      issueDesc: override.issueDesc,
      recovery: override.recovery,
      minutes: override.minutes,
      confidence: "manual-template",
      ruleId: override.ruleId || "manual_override",
      ruleLabel: override.ruleLabel || "Manual override",
      matchedKeywords: ["manual selection"],
      wasNotMatched: override.wasNotMatched ?? false
    };

    return normalizePreviewRow(merged, defaultMinutesProvider());
  }

  function addSuggestions(out, groupId) {
    const items = TEMPLATE_SUGGESTIONS[groupId] || [];
    items.forEach(item => out.push({ ...item, groupId }));
  }

  function getTemplateSuggestionsForRow(row) {
    const rawIssue = normalizeSuggestionText(rawIssueTextFromLine(row.rawLine || ""));
    if (isExactKnownTemplateText(rawIssue)) return [];

    const out = [];

    if (rawIssue.includes("charging failure")) addSuggestions(out, "charging_failure_family");
    if (rawIssue.includes("failed to take")) addSuggestions(out, "failed_take_family");
    if (rawIssue.includes("failed to place")) addSuggestions(out, "failed_place_family");
    if (rawIssue.includes("unable to drive")) addSuggestions(out, "unable_drive_family");
    if (rawIssue.includes("collision of 2 robots") || rawIssue.includes("robots collided")) addSuggestions(out, "collision_family");
    if (rawIssue.includes("box stuck")) addSuggestions(out, "box_stuck_family");
    if (rawIssue.includes("emergency stop")) addSuggestions(out, "safety_family");
    if (rawIssue.includes("battery") || rawIssue.includes("uncharged")) addSuggestions(out, "power_family");

    const seen = new Set();
    return out.filter(item => {
      const key = `${item.label}||${item.issueDesc}||${item.recovery}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function shouldShowSuggestionsForRow(row, suggestions) {
    if (!suggestions.length) return false;
    if (isRowAlreadyUsingStandardTemplate(row)) return false;

    const warnings = row.warnings || [];
    if (row.ruleId === "fallback_default") return true;
    if (row.wasNotMatched === true) return true;
    if (warnings.includes("Not matched classification")) return true;
    if (row.confidence === "low") return true;
    if (row.confidence === "medium") return true;

    return false;
  }

  function applySuggestedTemplateById(rowIndex, templateId) {
    const row = state.previewRows[rowIndex];
    if (!row) return false;

    const template = findTemplateById(templateId);
    if (!template) return false;

    const override = {
      issueType: template.issueType,
      quick: template.quick,
      subType: template.subType,
      issueDesc: template.issueDesc,
      recovery: template.recovery,
      minutes: template.minutes,
      confidence: "manual-template",
      ruleId: `manual_${template.id}`,
      ruleLabel: `Manual template: ${template.label}`,
      matchedKeywords: ["manual selection"],
      wasNotMatched: row.wasNotMatched ?? false
    };

    const key = getRowOverrideKey(row);
    state.manualOverrides[key] = override;

    state.previewRows[rowIndex] = applyManualOverrideToRow({
      ...row,
      ...override,
      warnings: [...(row.warnings || []).filter(w => w !== "Possible duplicate row")],
      criticalErrors: []
    });

    applyDuplicateWarnings(state.previewRows);
    return true;
  }

  return {
    getRowOverrideKey,
    applyManualOverrideToRow,
    getTemplateSuggestionsForRow,
    shouldShowSuggestionsForRow,
    applySuggestedTemplateById
  };
}