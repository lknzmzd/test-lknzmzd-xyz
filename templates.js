import { $, copyText, toast } from "./utils.js";

export const ERROR_TEMPLATES = [
  ". Unable to drive. Missing DM code. Recovery key and set to DM code.",
  ". Unable to drive. Foreign object on the floor. DM was cleaned, recovery key.",
  ". Unable to drive. Uneven ground. Recovery.",
  ". Unable to drive. Ground seam effect. Recovery.",
  ". Unable to drive. Abnormal chasing. Recovery.",
  ". Unable to drive. Wrong way after picking, collision with rack. Recovery.",
  ". Unable to drive. Lost track, no sound. Recovery.",
  ". Unable to drive. System error, unknown. Recovery.",
  ". Unable to drive. Lost track in tally station. Recovery.",
  ". Unable to drive. Moving abnormal. Recovery.",
  ". Unable to drive. Obstacle on the path dropped box. Moved out.",
  ". Unable to drive. Obstacle on the path dropped item. Moved out.",
  ". Unable to drive. Unknown reason. Recovery.",
  ". Unable to rotate. Dirty DM code. DM was cleaned, recovery key.",
  ". Unable to rotate. Foreign object on the floor. DM was cleaned, recovery key.",
  ". Unable to rotate. Missing DM code. Recovery key and set to DM code.",
  ". Unable to rotate. Lifting mechanism failure. Recovery.",
  ". Unable to rotate. Unknown reason. Recovery.",
  ". All protection triggers released. Abnormal lifting mechanism. Recovery.",
  ". Abnormal box delivery. Failed to place a case, dropped case. Recovery.",
  ". Battery communication failure. Unknown reason. Recovery.",
  ". Box stuck. Scanner problem, putaway convertline. Remove the box.",
  ". Box stuck. Unknown, putaway convertline. Remove the box.",
  ". Could not find DM code on the floor. Chassis drive failure. Recovery.",
  ". Collision of 2 robots. Robots collided, problem cannot be located. Change of position and recovery.",
  ". Collision of 2 robots. Robots collided while Kiva tried to take a case. Change of position and recovery.",
  ". Collision of 2 robots. Robots collided while Kubot tried to take a case. Change of position and recovery.",
  ". Charging failure. Parameter configuration error. Changed mode to Auto.",
  ". Charging failure. Parameter configuration error. Changed mode to Dynamic.",
  ". Charging failure. DM code position deviation. Move closer.",
  ". Dropped box. Abnormal operation, system bug. Second box moved out.",
  ". External retrieval abnormal. Unknown reason. Recovery.",
  ". Emergency stop button triggered. Front emergency stop button damaged. Recovery.",
  ". Emergency stop button triggered. Rear emergency stop button damaged. Recovery.",
  ". Failed to connect to server. Network disconnected. Recovery.",
  ". Failed to take a case. Wrong box position. Recovery.",
  ". Failed to take the box. Robot already with box, system bug. Put box back.",
  ". Failed to take a case. Unknown reason. Recovery.",
  ". Failed to take a case. Abnormal back support mechanism. Recovery.",
  ". Failed to place a case. Cross beam damaged. Recovery.",
  ". Failed to place a case. Unknown reason. Recovery.",
  ". Failed to take the box. Hit the workstation. Change of position and recovery.",
  ". Failed to deliver a case. Irregular operation on tally station. Box moved out.",
  ". Failed to place a case. Material box too high. Recovery.",
  ". Front bumper triggered in tally station. Robot collision, system bug. Recovery.",
  ". Kiva failed to place a case. Tote misaligned during transfer, hanging diagonally in rack. Recovery.",
  ". Kubot totally uncharged. Changed battery.",
  ". Lost box. Unknown reason. Moved out.",
  ". No object detected after picking on lifting tray. Can't take case from station. Case placed on robot, recovery.",
  ". No object detected after picking on lifting tray. Can't take case from conveyor. Case placed on robot, recovery.",
  ". No object detected after picking on lifting tray. Lifting height error. Case placed on robot, recovery.",
  ". No task for the box. System bug. Remove the box manually.",
  ". Obstacle detection. System bug. Recovery.",
  ". Personnel detection monitor failure. Security module failure. Recovery.",
  ". Remote emergency stop triggered. System bug. Recovery.",
  ". Robot placed box incorrectly on station. Box position corrected. Recovery.",
  ". Robot totally uncharged. Moved to charging station.",
  ". Safety vest detection speed monitor failure. Vest reaction. Recovery.",
  ". Safety communication failure. System bug. Recovery.",
  ". Safety self check failure. Security module failure. Recovery.",
  ". Standing without sound. Unknown. Remote recovery.",
  ". Speed detection module failure. Safety sensors triggered. Recovery.",
  ". Speed error. Drive component exception. Recovery.",
  ". Zone speed limitation failure. Unknown. Key."
];

export function initTemplatesUI(){
  const panel = $("templatePanel");
  const btn = $("templateBtn");
  const close = $("closeTemplates");
  const list = $("templateList");
  if(!panel || !btn || !close || !list) return;

  list.innerHTML = "";

  ERROR_TEMPLATES.forEach(text => {
    const div = document.createElement("div");
    div.className = "templateItem";
    div.textContent = text;

    div.addEventListener("click", async () => {
      const ok = await copyText(text);
      toast(ok ? "Copied ✅" : "Copy failed");
    });

    list.appendChild(div);
  });

  btn.addEventListener("click", () => panel.classList.add("open"));
  close.addEventListener("click", () => panel.classList.remove("open"));

  $("copyAllTemplates")?.addEventListener("click", async (e) => {
    const ok = await copyText(ERROR_TEMPLATES.join("\n\n"));
    toast(ok ? "Copied ✅" : "Copy failed");
    if(ok){
      const oldText = e.currentTarget.textContent;
      e.currentTarget.classList.add("copySuccess");
      e.currentTarget.textContent = "Copied ✓";
      setTimeout(() => {
        e.currentTarget.classList.remove("copySuccess");
        e.currentTarget.textContent = oldText;
      }, 1500);
    }
  });

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") panel.classList.remove("open");
  });
}