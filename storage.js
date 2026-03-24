import { pad2, simpleHash } from "./utils.js";

export const KEYS = {
  SHIFT_COUNT: "issue_log_shift_counts_v4",
  SHIFT_STATS: "issue_log_shift_stats_v4",
  SHIFT_EXPORTS: "issue_log_shift_exports_v2"
};

function ymd(d){
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getCurrentShiftInfo(now = new Date()){
  const minutes = now.getHours() * 60 + now.getMinutes();

  if(minutes >= 360 && minutes < 1080){
    const dateKey = ymd(now);
    return { key: `${dateKey}_DAY`, label: `${dateKey} 06:00–18:00 (Day)` };
  }

  const startDate = new Date(now);
  if(minutes < 360) startDate.setDate(startDate.getDate() - 1);
  const dateKey = ymd(startDate);
  return { key: `${dateKey}_NIGHT`, label: `${dateKey} 18:00–06:00 (Night)` };
}

function loadJson(key, fallback = {}){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function saveJson(key, obj){
  localStorage.setItem(key, JSON.stringify(obj));
}

export function loadShiftCounts(){ return loadJson(KEYS.SHIFT_COUNT, {}); }
export function saveShiftCounts(obj){ saveJson(KEYS.SHIFT_COUNT, obj); }

export function addRowsToShift(n){
  const shift = getCurrentShiftInfo();
  const store = loadShiftCounts();
  store[shift.key] = store[shift.key] || { label: shift.label, total: 0 };
  store[shift.key].total += n;
  saveShiftCounts(store);
  return { shift, total: store[shift.key].total };
}

export function resetShiftRows(){
  const shift = getCurrentShiftInfo();
  const store = loadShiftCounts();
  store[shift.key] = store[shift.key] || { label: shift.label, total: 0 };
  store[shift.key].total = 0;
  saveShiftCounts(store);
  return { shift, total: 0 };
}

export function getShiftTotal(){
  const shift = getCurrentShiftInfo();
  const store = loadShiftCounts();
  const total = store[shift.key]?.total || 0;
  return { shift, total };
}

export function loadShiftStats(){ return loadJson(KEYS.SHIFT_STATS, {}); }
export function saveShiftStats(obj){ saveJson(KEYS.SHIFT_STATS, obj); }

export function loadShiftExports(){ return loadJson(KEYS.SHIFT_EXPORTS, {}); }
export function saveShiftExports(obj){ saveJson(KEYS.SHIFT_EXPORTS, obj); }

export function markShiftExportIfNew(text, rowSignatureKey = text){
  const shift = getCurrentShiftInfo();
  const store = loadShiftExports();
  store[shift.key] = store[shift.key] || {};
  const hash = simpleHash(rowSignatureKey);

  if(store[shift.key][hash]) return false;

  store[shift.key][hash] = {
    createdAt: Date.now(),
    rows: text.split(/\n/).filter(Boolean).length
  };

  saveShiftExports(store);
  return true;
}

export function clearCurrentShiftStats(){
  const shift = getCurrentShiftInfo();
  const stats = loadShiftStats();
  delete stats[shift.key];
  saveShiftStats(stats);

  const exportsStore = loadShiftExports();
  delete exportsStore[shift.key];
  saveShiftExports(exportsStore);
}