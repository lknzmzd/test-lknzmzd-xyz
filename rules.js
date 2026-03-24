import { ISSUE_TYPE, QUICK, SUB } from "./utils.js";

function includesAll(...needles){
  return (L) => needles.every(n => L.includes(n));
}

function includesAny(...needles){
  return (L) => needles.some(n => L.includes(n));
}

function rule({ id, label, confidence = "high", match, result, keywords = [] }){
  return { id, label, confidence, match, result, keywords };
}

export const CLASSIFICATION_RULES = [
  rule({
    id: "dirty_dm_unable_drive",
    label: "Unable to drive → Dirty DM code",
    keywords: ["unable to drive", "dirty dm code"],
    match: includesAny("dirty dm code", "ground code dirty"),
    result: {
      issueType: ISSUE_TYPE.Environment,
      quick: QUICK.UnableDrive,
      subType: SUB.GroundDirty,
      issueDesc: "Unable to drive. Dirty DM code.",
      recovery: "DM was cleaned, recovery key.",
      minutes: 2
    }
  }),

  rule({
    id: "missing_dm_unable_drive",
    label: "Unable to drive → Missing DM code",
    keywords: ["missing dm code"],
    match: includesAny("missing dm code"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ChassisCam,
      issueDesc: "Unable to drive. Missing DM code.",
      recovery: "Recovery key and set to DM code.",
      minutes: 3
    }
  }),

  rule({
    id: "cannot_find_dm",
    label: "Could not find DM code on the floor",
    keywords: ["could not find dm code", "cannot find dm code"],
    match: (L) => L.includes("could not find dm code") || L.includes("cannot find dm code"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ChassisCam,
      issueDesc: "Could not find DM code on the floor.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "uneven_ground",
    label: "Unable to drive → Uneven ground",
    keywords: ["uneven ground"],
    match: includesAll("uneven ground"),
    result: {
      issueType: ISSUE_TYPE.Environment,
      quick: QUICK.UnableDrive,
      subType: SUB.Uneven,
      issueDesc: "Unable to drive. Uneven ground.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "ground_seam",
    label: "Unable to drive → Ground seam effect",
    keywords: ["ground seam"],
    match: includesAll("ground seam"),
    result: {
      issueType: ISSUE_TYPE.Environment,
      quick: QUICK.UnableDrive,
      subType: SUB.GroundSeam,
      issueDesc: "Unable to drive. Ground seam effect.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "lifting_mechanism_failure",
    label: "Lifting mechanism failure",
    keywords: ["lifting mechanism failure"],
    match: includesAll("lifting mechanism failure"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.LiftingHeight,
      issueDesc: "Lifting mechanism failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "foreign_object_unable_drive",
    label: "Unable to drive → Foreign object on floor",
    keywords: ["foreign object", "unable to drive"],
    match: includesAll("foreign object", "unable to drive"),
    result: {
      issueType: ISSUE_TYPE.Customer,
      quick: QUICK.UnableDrive,
      subType: SUB.ForeignObjects,
      issueDesc: "Unable to drive. Foreign object on the floor.",
      recovery: "DM was cleaned, recovery key.",
      minutes: 2
    }
  }),

  rule({
    id: "foreign_object_unable_rotate",
    label: "Unable to rotate → Foreign object on floor",
    keywords: ["foreign object", "unable to rotate"],
    match: includesAll("foreign object", "unable to rotate"),
    result: {
      issueType: ISSUE_TYPE.Customer,
      quick: QUICK.UnableDrive,
      subType: SUB.ForeignObjects,
      issueDesc: "Unable to rotate. Foreign object on the floor.",
      recovery: "DM was cleaned, recovery key.",
      minutes: 2
    }
  }),

  rule({
    id: "obstacle_detection_system_bug",
    label: "Obstacle detection → System bug",
    keywords: ["obstacle detection", "system bug"],
    match: (L) => (L.includes("obstacle detection") || L.includes("obstacle detected")) && (L.includes("system bug") || L.includes("bug")),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.ObstacleAvoid,
      subType: SUB.ProgramBug,
      issueDesc: "Obstacle detection. System bug.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "lost_track_tally",
    label: "Lost track in tally station",
    keywords: ["lost track", "tally station"],
    match: includesAll("lost track", "tally station"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Unable to drive. Lost track in tally station.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "abnormal_chasing",
    label: "Abnormal chasing",
    keywords: ["chasing"],
    match: includesAll("chasing"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Abnormal chasing.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "lost_track_no_sound",
    label: "Lost track. No sound",
    keywords: ["lost his track", "no sound"],
    match: (L) => L.includes("lost his track") || L.includes("no sound"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Lost track. No sound.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "system_error_unknown",
    label: "System error → Unknown",
    keywords: ["system error"],
    match: includesAll("system error"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.UnableDrive,
      subType: SUB.ProgramBug,
      issueDesc: "System error. Unknown.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "unable_drive_unknown",
    label: "Unable to drive → Unknown reason",
    confidence: "medium",
    keywords: ["unable to drive", "unknown"],
    match: includesAll("unable to drive", "unknown"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Unable to drive. Unknown reason.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "unable_rotate_unknown",
    label: "Unable to rotate → Unknown reason",
    confidence: "medium",
    keywords: ["unable to rotate", "unknown"],
    match: includesAll("unable to rotate", "unknown"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Unable to rotate. Unknown reason.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "collision_kiva_take_case",
    label: "Collision of 2 robots while Kiva tried to take a case",
    keywords: ["collision of 2 robots", "kiva", "take a case"],
    match: includesAll("collision of 2 robots", "kiva", "take a case"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.TwoRobotsCollide,
      subType: SUB.WrongPickPlace,
      issueDesc: "Robots collided while Kiva tried to take a case.",
      recovery: "Change of position and recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "collision_kubot_take_case",
    label: "Collision of 2 robots while Kubot tried to take a case",
    keywords: ["collision of 2 robots", "kubot", "take a case"],
    match: includesAll("collision of 2 robots", "kubot", "take a case"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.TwoRobotsCollide,
      subType: SUB.WrongPickPlace,
      issueDesc: "Robots collided while Kubot tried to take a case.",
      recovery: "Change of position and recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "collision_generic",
    label: "Collision of 2 robots",
    confidence: "medium",
    keywords: ["collision of 2 robots"],
    match: (L) => L.includes("collision of 2 robots") || L.includes("robots collided") || L.includes("robot collision"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.TwoRobotsCollide,
      subType: SUB.CannotLocate,
      issueDesc: "Collision of 2 robots.",
      recovery: "Change of position and recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "no_object_station",
    label: "No object detected → Can't take case from station",
    keywords: ["no object", "lifting tray", "station"],
    match: includesAll("no object", "lifting tray", "station"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.NoObjectDetected,
      subType: SUB.LiftingHeight,
      issueDesc: "No object detected after picking on lifting tray. Can't take case from station.",
      recovery: "Case placed on robot, recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "no_object_conveyor",
    label: "No object detected → Can't take case from conveyor",
    keywords: ["no object", "lifting tray", "conveyor"],
    match: includesAll("no object", "lifting tray", "conveyor"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.NoObjectDetected,
      subType: SUB.LiftingHeight,
      issueDesc: "No object detected after picking on lifting tray. Can't take case from conveyor.",
      recovery: "Case placed on robot, recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "no_object_generic",
    label: "No object detected → Lifting height error",
    confidence: "medium",
    keywords: ["no object", "lifting tray"],
    match: includesAll("no object", "lifting tray"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.NoObjectDetected,
      subType: SUB.LiftingHeight,
      issueDesc: "No object detected after picking on lifting tray. Lifting height error.",
      recovery: "Case placed on robot, recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "abnormal_box_delivery_dropped",
    label: "Abnormal box delivery → Dropped case",
    keywords: ["abnormal box delivery"],
    match: (L) => L.includes("abnormal box delivery") || (L.includes("failed to place") && L.includes("dropped")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.LostBoxPos,
      issueDesc: "Abnormal box delivery. Failed to place a case, dropped case.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "failed_take_hit_workstation",
    label: "Failed to take box → Hit workstation",
    keywords: ["failed to take", "hit the workstation"],
    match: (L) => (L.includes("failed to take the box") || L.includes("failed to take the case")) && L.includes("hit the workstation"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.CollisionShelf,
      subType: SUB.LostBoxPos,
      issueDesc: "Failed to take the box. Hit the workstation.",
      recovery: "Change of position and recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_deliver_tally_irregular",
    label: "Failed to deliver case → Irregular operation on tally station",
    keywords: ["failed to deliver", "irregular operation", "tally"],
    match: (L) => (L.includes("failed to deliver a case") || L.includes("failed to delivered a case")) && L.includes("irregular operation") && L.includes("tally"),
    result: {
      issueType: ISSUE_TYPE.Operation,
      quick: QUICK.AbnormalPick,
      subType: SUB.IrregularOperation,
      issueDesc: "Failed to deliver a case. Irregular operation on tally station.",
      recovery: "Box moved out.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_place_material_high",
    label: "Failed to place case → Material box too high",
    keywords: ["failed to place", "too high"],
    match: (L) => L.includes("failed to place a case") && (L.includes("material box too high") || L.includes("too high")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.MaterialSuperHigh,
      issueDesc: "Failed to place a case. Material box too high.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "kiva_tote_misaligned",
    label: "Kiva failed to place case → Tote misaligned",
    keywords: ["kiva", "failed to place a case", "tote misaligned"],
    match: includesAll("kiva", "failed to place a case", "tote misaligned"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.BoxStuck,
      subType: SUB.LostBoxPos,
      issueDesc: "Kiva failed to place a case. Tote misaligned during transfer, left hanging diagonally in rack.",
      recovery: "Recovery.",
      minutes: 5
    }
  }),

  rule({
    id: "failed_take_robot_already_with_box",
    label: "Failed to take box → Robot already with box",
    keywords: ["failed to take the box", "robot already with box"],
    match: includesAll("failed to take the box", "robot already with box"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.ForkNoContainer,
      subType: SUB.ProgramBug,
      issueDesc: "Failed to take the box. Robot already with box.",
      recovery: "Put box back.",
      minutes: 3
    }
  }),

  rule({
    id: "failed_take_wrong_box_position",
    label: "Failed to take case → Wrong box position",
    keywords: ["failed to take a case", "wrong box position"],
    match: includesAll("failed to take a case", "wrong box position"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.WrongPickPlace,
      issueDesc: "Failed to take a case. Wrong box position.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "failed_place_cross_beam",
    label: "Failed to place case → Cross beam damaged",
    keywords: ["failed to place a case", "cross beam"],
    match: includesAll("failed to place a case", "cross beam"),
    result: {
      issueType: ISSUE_TYPE.Construction,
      quick: QUICK.AbnormalPick,
      subType: SUB.CrossBeam,
      issueDesc: "Failed to place a case. Cross beam damaged.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_take_unknown",
    label: "Failed to take case → Unknown reason",
    confidence: "medium",
    keywords: ["failed to take a case", "unknown reason"],
    match: includesAll("failed to take a case", "unknown reason"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.CannotLocate,
      issueDesc: "Failed to take a case. Unknown reason.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_place_unknown",
    label: "Failed to place case → Unknown reason",
    confidence: "medium",
    keywords: ["failed to place a case", "unknown reason"],
    match: includesAll("failed to place a case", "unknown reason"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.CannotLocate,
      issueDesc: "Failed to place a case. Unknown reason.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "external_retrieval_abnormal",
    label: "External retrieval abnormal",
    keywords: ["external retrieval abnormal"],
    match: includesAll("external retrieval abnormal"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.AbnormalLifting,
      issueDesc: "External retrieval abnormal.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "safety_vest_speed_monitor_failure",
    label: "Safety vest detection speed monitor failure",
    keywords: ["safety vest detection speed"],
    match: (L) => L.includes("safety vest detection speed") || (L.includes("vest") && L.includes("key")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.SpeedError,
      subType: SUB.ProgramBug,
      issueDesc: "Safety vest detection speed monitor failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "speed_detection_module_failure",
    label: "Speed detection module failure",
    keywords: ["speed detection module failure"],
    match: (L) =>
      L.includes("speed detection module failure") ||
      (L.includes("speed detection") && L.includes("module failure")) ||
      (L.includes("speed detection") && L.includes("safety sensors")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.SpeedError,
      subType: SUB.SecurityModuleFail,
      issueDesc: "Speed detection module failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "front_bumper_tally_bug",
    label: "Front bumper triggered in tally station → System bug",
    keywords: ["front bumper triggered", "tally station", "system bug"],
    match: (L) =>
      (L.includes("front bumper triggered") || (L.includes("bumper") && L.includes("triggered"))) &&
      (L.includes("tally station") || L.includes("in tally")) &&
      (L.includes("system bug") || L.includes("bug")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.TwoRobotsCollide,
      subType: SUB.ProgramBug,
      issueDesc: "Front bumper triggered in tally station. System bug.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_connect_server_network_disconnected",
    label: "Failed to connect to server → Network disconnected",
    keywords: ["failed to connect to server", "network disconnected"],
    match: (L) =>
      (L.includes("failed connect to server") || L.includes("failed to connect to server") || L.includes("cannot connect to server")) &&
      (L.includes("network disconnected") || L.includes("disconnected") || L.includes("network down")),
    result: {
      issueType: ISSUE_TYPE.Network,
      quick: QUICK.NetAbn,
      subType: SUB.ProgramBug,
      issueDesc: "Failed to connect to server. Network disconnected.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "all_protection_released_abnormal_lifting",
    label: "All protection triggers released → Abnormal lifting mechanism",
    keywords: ["all protection triggers", "abnormal lifting"],
    match: (L) => L.includes("all protection triggers") || (L.includes("abnormal lifting") && L.includes("mechanism")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.RobotSafetyTriggered,
      subType: SUB.AbnormalLifting,
      issueDesc: "All protection triggers have been released. Abnormal lifting mechanism.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "safety_self_check_failure",
    label: "Safety self check failure",
    keywords: ["safety self check failure"],
    match: includesAll("safety self check failure"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.SafetySelfCheck,
      subType: SUB.SecurityModuleFail,
      issueDesc: "Safety self check failure. Security module failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "charging_failure_dm_pos_dev",
    label: "Charging failure → DM code position deviation",
    keywords: ["charging failure", "dm code position deviation"],
    match: includesAll("charging failure", "dm code position deviation"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnCharging,
      subType: SUB.GroundPosDev,
      issueDesc: "Charging failure. DM code position deviation.",
      recovery: "Move closer.",
      minutes: 2
    }
  }),

  rule({
    id: "charging_failure_parameter_config",
    label: "Charging failure → Parameter configuration error",
    confidence: "medium",
    keywords: ["charging failure"],
    match: includesAll("charging failure"),
    result: (L) => ({
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnCharging,
      subType: SUB.ParameterConfigErr,
      issueDesc: "Charging failure. Parameter configuration error.",
      recovery: L.includes("dynamic") ? "Changed mode to Dynamic." : "Changed mode to Auto.",
      minutes: 2
    })
  }),

  rule({
    id: "kubot_totally_uncharged",
    label: "Kubot totally uncharged",
    keywords: ["kubot", "totally uncharged"],
    match: includesAll("kubot", "totally uncharged"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.PowerModuleAbn,
      subType: SUB.CannotLocate,
      issueDesc: "Kubot totally uncharged.",
      recovery: "Changed battery.",
      minutes: 4
    }
  }),

  rule({
    id: "robot_totally_uncharged",
    label: "Robot totally uncharged",
    keywords: ["robot totally uncharged"],
    match: includesAll("robot totally uncharged"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.PowerModuleAbn,
      subType: SUB.CannotLocate,
      issueDesc: "Robot totally uncharged.",
      recovery: "Moved to charging station.",
      minutes: 4
    }
  }),

  rule({
    id: "speed_error_drive_component_exception",
    label: "Speed error → Drive component exception",
    keywords: ["speed error", "drive component exception"],
    match: (L) => L.includes("speed error") || L.includes("drive component exception"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.SpeedError,
      subType: SUB.DriverComponentEx,
      issueDesc: "Speed error. Drive component exception.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "zone_speed_limitation_failure",
    label: "Zone speed limitation failure",
    keywords: ["zone speed limitation failure"],
    match: includesAll("zone speed limitation failure"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.SpeedError,
      subType: SUB.ProgramBug,
      issueDesc: "Zone speed limitation failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "customer_fault_box_already_on_position",
    label: "Customer fault → Box already on position",
    keywords: ["customer fault", "box already on position"],
    match: (L) => L.includes("customer fault") || L.includes("box already on the position") || L.includes("box already on position"),
    result: {
      issueType: ISSUE_TYPE.Customer,
      quick: QUICK.AbnormalPick,
      subType: SUB.IrregularOp,
      issueDesc: "Failed to take the box. Box already on position. Customer fault.",
      recovery: "Put box back.",
      minutes: 2
    }
  }),

  rule({
    id: "battery_communication_failure",
    label: "Battery communication failure",
    keywords: ["battery communication failure"],
    match: includesAll("battery communication failure"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.PowerModuleAbn,
      subType: SUB.CannotLocate,
      issueDesc: "Battery communication failure. Unknown reason.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "personnel_detection_monitor_failure",
    label: "Personnel detection monitor failure",
    keywords: ["personal detection monitor failure"],
    match: (L) => L.includes("personal detection monitor failure") || (L.includes("security module failure") && L.includes("personal")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.PersonDetectFail,
      subType: SUB.SecurityModule,
      issueDesc: "Personnel detection monitor failure.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "no_task_for_box",
    label: "No task for the box",
    keywords: ["no task for the box"],
    match: (L) => L.includes("no task for the box") || (L.includes("no task") && (L.includes("box") || L.includes("tote"))),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.DataError,
      subType: SUB.ProgramBug,
      issueDesc: "No task for the box. System bug.",
      recovery: "Remove the box manually.",
      minutes: 2
    }
  }),

  rule({
    id: "dropped_box_system_bug",
    label: "Dropped box → Abnormal operation → System bug",
    keywords: ["dropped box", "abnormal operation", "system bug"],
    match: (L) =>
      L.includes("dropped box") &&
      ((L.includes("abnormal operation") || (L.includes("abnormal") && L.includes("operation"))) &&
      (L.includes("system bug") || (L.includes("system") && L.includes("bug")))),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.DropBox,
      subType: SUB.ProgramBug,
      issueDesc: "Dropped box. Abnormal operation. System bug.",
      recovery: "Second box moved out.",
      minutes: 3
    }
  }),

  rule({
    id: "standing_without_sound",
    label: "Standing without sound",
    keywords: ["standing without sound"],
    match: (L) => L.includes("standing without sound") || (L.includes("standing") && L.includes("without sound")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ProgramBug,
      issueDesc: "Standing without sound.",
      recovery: "Remote recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "box_stuck_putaway_unknown",
    label: "Box stuck on putaway convertline → Unknown reason",
    keywords: ["box stuck", "putaway", "convertline", "unknown"],
    match: (L) => L.includes("box stuck") && L.includes("putaway") && L.includes("convertline") && (L.includes("unknown") || L.includes("unknown reason")),
    result: {
      issueType: ISSUE_TYPE.Unknown,
      quick: QUICK.BoxStuck,
      subType: SUB.IrregularOp,
      issueDesc: "Box stuck on putaway convertline. Unknown reason.",
      recovery: "Remove the box.",
      minutes: 3
    }
  }),

  rule({
    id: "box_stuck_scanner_problem",
    label: "Scanner problem on putaway convertline",
    keywords: ["box stuck", "scanner", "convertline"],
    match: (L) => L.includes("box stuck") && (L.includes("scanner") || L.includes("convertline")),
    result: {
      issueType: ISSUE_TYPE.Customer,
      quick: QUICK.BoxStuck,
      subType: SUB.HardwareDamage,
      issueDesc: "Scanner problem on putaway convertline.",
      recovery: "Remove the box.",
      minutes: 3
    }
  }),

  rule({
    id: "remote_emergency_stop",
    label: "Remote emergency stop is triggered",
    keywords: ["remote emergency stop"],
    match: includesAll("remote emergency stop"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.RobotSafetyTriggered,
      subType: SUB.ProgramBug,
      issueDesc: "Remote emergency stop is triggered.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "emergency_stop_front",
    label: "Front emergency stop button damaged",
    keywords: ["emergency stop", "front"],
    match: includesAll("emergency stop", "front"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.RobotSafetyTriggered,
      subType: SUB.EmergencyStopDamaged,
      issueDesc: "Emergency stop trigger released. Front emergency stop button damaged.",
      recovery: "Recovery.",
      minutes: 5
    }
  }),

  rule({
    id: "emergency_stop_rear",
    label: "Rear emergency stop button damaged",
    keywords: ["emergency stop", "rear"],
    match: includesAll("emergency stop", "rear"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.RobotSafetyTriggered,
      subType: SUB.EmergencyStopDamaged,
      issueDesc: "Emergency stop trigger released. Rear emergency stop button damaged.",
      recovery: "Recovery.",
      minutes: 5
    }
  }),

  rule({
    id: "robot_placed_box_incorrectly_station",
    label: "Robot placed box incorrectly on station",
    keywords: ["robot placed box incorrectly", "station"],
    match: includesAll("robot placed box incorrectly", "station"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.BoxStuck,
      subType: SUB.WrongPickPlace,
      issueDesc: "Robot placed box incorrectly on station.",
      recovery: "Box position corrected.",
      minutes: 3
    }
  }),

  rule({
    id: "safety_communication_failure",
    label: "Safety communication failure",
    keywords: ["safety communication failure"],
    match: includesAll("safety communication failure"),
    result: {
      issueType: ISSUE_TYPE.Network,
      quick: QUICK.NetAbn,
      subType: SUB.ProgramBug,
      issueDesc: "Safety communication failure.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "unable_drive_obstacle_dropped_box",
    label: "Unable to drive → Obstacle on path → Dropped box",
    keywords: ["unable to drive", "obstacle on the path", "dropped box"],
    match: includesAll("unable to drive", "obstacle on the path", "dropped box"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ObstacleOnPath,
      issueDesc: "Unable to drive. Obstacle on the path. Dropped box.",
      recovery: "Moved out.",
      minutes: 3
    }
  }),

  rule({
    id: "unable_drive_obstacle_dropped_item",
    label: "Unable to drive → Obstacle on path → Dropped item",
    keywords: ["unable to drive", "obstacle on the path", "dropped item"],
    match: includesAll("unable to drive", "obstacle on the path", "dropped item"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ObstacleOnPath,
      issueDesc: "Unable to drive. Obstacle on the path. Dropped item.",
      recovery: "Moved out.",
      minutes: 3
    }
  }),

  rule({
    id: "wrong_way_collision_rack",
    label: "Drives wrong way after picking and collided with rack",
    keywords: ["wrong way", "after picking", "collision with rack"],
    match: (L) =>
      (L.includes("wrong way") || L.includes("drive wrong way") || L.includes("drives wrong way")) &&
      (L.includes("after picking") || L.includes("after pick")) &&
      (L.includes("collision with rack") || L.includes("collided with rack") || L.includes("hit the rack") || L.includes("collision with the rack")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.CollisionShelf,
      subType: SUB.WrongPickPlace,
      issueDesc: "Drives wrong way after picking and collided with a rack.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "lost_box_unknown",
    label: "Lost box → Unknown reason",
    confidence: "medium",
    keywords: ["lost box", "unknown reason"],
    match: includesAll("lost box", "unknown reason"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.DropBox,
      subType: SUB.CannotLocate,
      issueDesc: "Lost box. Unknown reason.",
      recovery: "Moved out.",
      minutes: 3
    }
  }),

  rule({
    id: "failed_take_back_support",
    label: "Failed to take case → Abnormal back support mechanism",
    keywords: ["failed to take a case", "back support"],
    match: includesAll("failed to take a case", "back support"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.BackSupportMechanismAbnormal,
      issueDesc: "Failed to take a case. Abnormal back support mechanism.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "moving_abnormal",
    label: "Moving abnormal",
    confidence: "medium",
    keywords: ["moving abnormal"],
    match: includesAll("moving abnormal"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Moving abnormal.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  /* ---- added missing legacy rules below ---- */

  rule({
    id: "failed_deliver_tally_station_exact",
    label: "Failed to deliver case → Irregular operation on tally station (exact)",
    keywords: ["failed to deliver a case", "irregular operation", "tally station"],
    match: includesAll("failed to deliver a case", "irregular operation", "tally station"),
    result: {
      issueType: ISSUE_TYPE.Operation,
      quick: QUICK.AbnormalPick,
      subType: SUB.IrregularOperation,
      issueDesc: "Failed to deliver a case. Irregular operation on tally station.",
      recovery: "Box moved out.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_take_box_wrong_box_position_alt",
    label: "Failed to take a case → Wrong box position (alternate wording)",
    keywords: ["fail to take a case", "wrong box position"],
    match: (L) => (L.includes("fail to take a case") || L.includes("failed to take a case")) && L.includes("wrong box position"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.LostBoxPos,
      issueDesc: "Wrong box position.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "personal_detection_module_failure",
    label: "Personnel detection module failure",
    keywords: ["personnel detection module failure"],
    match: includesAll("personnel detection module failure"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.PersonDetectFail,
      subType: SUB.SecurityModule,
      issueDesc: "Personnel detection module failure.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "front_bumper_triggered_tally_station_system_bug_alt",
    label: "Front bumper triggered in tally station. Robot collision, system bug",
    keywords: ["front bumper triggered", "tally station", "robot collision"],
    match: (L) =>
      L.includes("front bumper triggered") &&
      L.includes("tally station") &&
      (L.includes("robot collision") || L.includes("system bug")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.TwoRobotsCollide,
      subType: SUB.ProgramBug,
      issueDesc: "Front bumper triggered in tally station. Robot collision, system bug.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "failed_place_case_dropped_case_alt",
    label: "Failed to place a case → Dropped case",
    keywords: ["failed to place a case", "dropped case"],
    match: includesAll("failed to place a case", "dropped case"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.AbnormalPick,
      subType: SUB.LostBoxPos,
      issueDesc: "Abnormal box delivery. Failed to place a case, dropped case.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "robot_collision_problem_cannot_be_located",
    label: "Collision of 2 robots → Problem cannot be located",
    keywords: ["collision of 2 robots", "problem cannot be located"],
    match: includesAll("collision of 2 robots", "problem cannot be located"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.TwoRobotsCollide,
      subType: SUB.CannotLocate,
      issueDesc: "Collision of 2 robots.",
      recovery: "Change of position and recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "remote_emergency_stop_triggered_system_bug_alt",
    label: "Remote emergency stop triggered → System bug",
    keywords: ["remote emergency stop", "system bug"],
    match: includesAll("remote emergency stop", "system bug"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.RobotSafetyTriggered,
      subType: SUB.ProgramBug,
      issueDesc: "Remote emergency stop triggered. System bug.",
      recovery: "Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "robot_placed_box_incorrectly_station_recovery",
    label: "Robot placed box incorrectly on station → Recovery",
    keywords: ["robot placed box incorrectly on station"],
    match: includesAll("robot placed box incorrectly on station"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.BoxStuck,
      subType: SUB.WrongPickPlace,
      issueDesc: "Robot placed box incorrectly on station.",
      recovery: "Box position corrected. Recovery.",
      minutes: 3
    }
  }),

  rule({
    id: "safety_vest_detection_vest_reaction",
    label: "Safety vest detection speed monitor failure → Vest reaction",
    keywords: ["safety vest detection speed monitor failure", "vest reaction"],
    match: includesAll("safety vest detection speed monitor failure", "vest reaction"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.SpeedError,
      subType: SUB.ProgramBug,
      issueDesc: "Safety vest detection speed monitor failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "speed_detection_module_failure_sensors_triggered",
    label: "Speed detection module failure → Safety sensors triggered",
    keywords: ["speed detection module failure", "safety sensors triggered"],
    match: includesAll("speed detection module failure", "safety sensors triggered"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.SpeedError,
      subType: SUB.SecurityModuleFail,
      issueDesc: "Speed detection module failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "standing_without_sound_unknown_remote_recovery",
    label: "Standing without sound → Unknown → Remote recovery",
    keywords: ["standing without sound", "unknown", "remote recovery"],
    match: includesAll("standing without sound", "remote recovery"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ProgramBug,
      issueDesc: "Standing without sound.",
      recovery: "Remote recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "zone_speed_limitation_failure_unknown_key",
    label: "Zone speed limitation failure → Unknown → Key",
    keywords: ["zone speed limitation failure", "key"],
    match: includesAll("zone speed limitation failure", "key"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.SpeedError,
      subType: SUB.ProgramBug,
      issueDesc: "Zone speed limitation failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "unable_rotate_missing_dm",
    label: "Unable to rotate → Missing DM code",
    keywords: ["unable to rotate", "missing dm code"],
    match: includesAll("unable to rotate", "missing dm code"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.ChassisCam,
      issueDesc: "Unable to rotate. Missing DM code.",
      recovery: "Recovery key and set to DM code.",
      minutes: 3
    }
  }),

  rule({
    id: "unable_rotate_lifting_mechanism_failure",
    label: "Unable to rotate → Lifting mechanism failure",
    keywords: ["unable to rotate", "lifting mechanism failure"],
    match: includesAll("unable to rotate", "lifting mechanism failure"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.LiftingHeight,
      issueDesc: "Unable to rotate. Lifting mechanism failure.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "wrong_way_after_picking_collision_with_rack_alt",
    label: "Wrong way after picking, collision with rack",
    keywords: ["wrong way", "collision with rack"],
    match: (L) =>
      (L.includes("wrong way") || L.includes("drive wrong way") || L.includes("drives wrong way")) &&
      (L.includes("collision with rack") || L.includes("collided with rack") || L.includes("hit the rack")),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.CollisionShelf,
      subType: SUB.WrongPickPlace,
      issueDesc: "Drives wrong way after picking and collided with a rack.",
      recovery: "Recovery.",
      minutes: 4
    }
  }),

  rule({
    id: "unable_drive_lost_track_no_sound_alt",
    label: "Unable to drive → Lost track, no sound",
    keywords: ["unable to drive", "lost track", "no sound"],
    match: includesAll("unable to drive", "lost track") && includesAny("no sound"),
    result: {
      issueType: ISSUE_TYPE.Equipment,
      quick: QUICK.UnableDrive,
      subType: SUB.CannotLocate,
      issueDesc: "Lost track. No sound.",
      recovery: "Recovery.",
      minutes: 2
    }
  }),

  rule({
    id: "unable_drive_system_error_unknown_alt",
    label: "Unable to drive → System error, unknown",
    keywords: ["unable to drive", "system error", "unknown"],
    match: includesAll("unable to drive", "system error"),
    result: {
      issueType: ISSUE_TYPE.System,
      quick: QUICK.UnableDrive,
      subType: SUB.ProgramBug,
      issueDesc: "System error. Unknown.",
      recovery: "Recovery.",
      minutes: 2
    }
  })
];