export const DEFAULTS = {
  deviceType: "K50H",
  status: "已处理Processed",
  recovery: "Recovery.",
  minutes: 2
};

export const ISSUE_TYPE = {
  Construction: "施工Construction",
  Equipment: "设备Equipment",
  System: "系统System",
  Environment: "环境Environment",
  Customer: "客户Customer",
  Interface: "接口Interface",
  Operation: "操作Operation",
  Network: "网络Network",
  Unknown: "未知Unknown",
  Design: "设计Design"
};

export const QUICK = {
  AbnormalPick: "取放货异常Abnormal pick-up and delivery",
  ObstacleAvoid: "避障Obstacle avoidance",
  ForkNoContainer: "货叉检测无容器Forklift detection without container",
  DMCodeError: "识别不到地面码DM Code Error",
  StructuralDamage: "结构件损坏Structural damage",
  UnableDrive: "行走异常Unable to drive",
  NetAbn: "网络通讯异常Network communication abnormality",
  DropBox: "掉箱子或掉落件Drop Box or items",
  BoxStuck: "卡箱异常Box stuck",
  CollisionShelf: "撞货架Collision with Shelf",
  AbnCharging: "充电异常Abnormal charging",
  AbnSound: "设备异响Equipment abnormal sound",
  DataError: "数据错误data error",
  ConveyorScanAbn: "输送线读码器扫码异常",
  RobotSafetyTriggered: "机器人安全装置触发Robot safety device triggered",
  SafetyDoorTriggered: "安全门装置触发Safety door device activated",
  TwoRobotsCollide: "机器人相互碰撞 Two robots collide",
  PersonDetectFail: "人员检测模块故障Personnel detection module failure",
  SpeedError: "速度错误Speed Error",
  MotorPwr: "Motor or Powerstage llt error",
  SafetySelfCheck: "安全自检失败safety self check failure",
  NoObjectDetected: "料箱检测无容器No object detected",
  PowerModuleAbn: "电源模块异常Power module is abnormal"
};

export const SUB = {
  GroundDirty: "地面码脏污 Ground code dirty",
  MissingDM: "地面码缺失 Ground code missing",
  GroundPosDev: "地脚定位偏差 Ground positioning deviation",
  Uneven: "地面不平 Uneven ground",
  GroundSeam: "地缝影响 Ground seam effect",
  ForeignObjects: "地面异物Foreign objects on the ground",
  CannotLocate: "无法定义异常 Problem Cannot located",
  ProgramBug: "程序逻辑BUG Program logic bug",
  LiftingHeight: "举升高度误差Lifting height error",
  WrongPickPlace: "取放箱位置错误 Wrong pick and place box position",
  IrregularOp: "操作不规范 Irregular operation",
  IrregularOperation: "操作不规范 Irregular operation",
  EmergencyStopDamaged: "急停按钮损坏 Emergency stop button is damaged",
  SecurityModuleFail: "安全模块故障Security module failure",
  ParameterConfigErr: "参数配置错误 Parameter configuration error",
  DriverComponentEx: "驱动组件异常 Driver component exception",
  ObstacleOnPath: "路径上有障碍物 Obstacle on the path",
  MainCtrlComm: "主控板通讯异常 Main control board communication anomaly",
  AbnormalLifting: "举升机构异常 Abnormal lifting mechanism",
  LostBoxPos: "取放箱位置错误 Wrong pick and place box position",
  MaterialSuperHigh: "物料超高 Material super high",
  SecurityModule: "安全模块故障Security module failure",
  HardwareDamage: "硬件损坏 Hardware damage",
  CrossBeam: "跨梁凸起 Cross beam",
  BackSupportMechanismAbnormal: "背撑机构异常 Abnormality of back support mechanism",
  ChassisCam: "底盘相机故障 Chassis camera malfunction"
};

export function $(id){ return document.getElementById(id); }

export function range(start, end){
  const arr = [];
  for(let i = start; i <= end; i++) arr.push(i);
  return arr;
}

export const A42T_E2_SET = new Set([
  ...range(163, 340),
  ...range(1301, 1475)
]);

export const K50H_SET = new Set([
  ...range(698, 1299),
  ...range(1501, 2228)
]);

export function pad2(n){ return String(n).padStart(2, "0"); }

export function parseTimeToMinutes(t){
  const m = String(t).trim().match(/^(\d{1,2})\s*:\s*(\d{2})$/);
  if(!m) return null;
  const hh = +m[1], mm = +m[2];
  if(hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

export function minutesToHHMM(total){
  total = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function abnormalFmt(mins){
  const safe = Math.max(0, Math.min(59, Math.round(Number(mins) || 0)));
  return `00:${pad2(safe)}`;
}

export function normText(s){
  return String(s)
    .replace(/\s+/g, " ")
    .replace(/[，]/g, ",")
    .trim();
}

export function low(s){ return normText(s).toLowerCase(); }

export function cleanSentence(s){
  let t = String(s || "").trim();
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\s+\./g, ".");
  t = t.replace(/\s+,/g, ",");
  t = t.replace(/,\./g, ".");
  t = t.replace(/\.\.+/g, ".");
  t = t.replace(/^,\s*/, "");
  t = t.trim();
  if(!t) return "";
  if(!/[.!?]$/.test(t)) t += ".";
  return t;
}

export function cleanLabelSentence(s){
  let t = String(s || "").trim();
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\s+\./g, ".");
  t = t.replace(/\.\.+/g, ".");
  return t.trim();
}

export function esc(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function slugifyRule(s){
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "fallback_default";
}

export function isValidDateInput(v){
  const s = String(v || "").trim();
  if(!/^\d{4}\/\d{2}\/\d{2}$/.test(s)) return false;
  const [yy, mm, dd] = s.split("/").map(Number);
  if(mm < 1 || mm > 12) return false;
  if(dd < 1 || dd > 31) return false;
  const d = new Date(yy, mm - 1, dd);
  return d.getFullYear() === yy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

export function setDot(id, state){
  const el = $(id);
  if(!el) return;
  el.className = "dot";
  if(state === "ok") el.classList.add("ok");
  if(state === "warn") el.classList.add("warn");
  if(state === "err") el.classList.add("err");
}

export function toast(msg){
  const t = $("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1500);
}

export function simpleHash(str){
  let h = 0;
  const s = String(str || "");
  for(let i = 0; i < s.length; i++){
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

export async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

export function makeOperatorSentence(row){
  const deviceNo = String(row.deviceNo || "").trim();
  const issueDesc = cleanLabelSentence(row.issueDesc || "");
  const recovery = cleanLabelSentence(row.recovery || "");
  const startTime = String(row.startTime || "").trim();

  return [deviceNo ? `${deviceNo}.` : "", issueDesc, recovery, startTime]
    .filter(Boolean)
    .join(" ");
}