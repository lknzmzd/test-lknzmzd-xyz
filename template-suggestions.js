export const TEMPLATE_SUGGESTIONS = [
  {
    id: "charging_failure_family",
    triggerKeywords: ["charging failure"],
    items: [
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
    ]
  },

  {
    id: "failed_take_family",
    triggerKeywords: ["failed to take", "fail to take"],
    items: [
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
        id: "failed_take_unknown",
        label: "Failed to take → Unknown reason",
        issueType: "设备Equipment",
        quick: "取放货异常Abnormal pick-up and delivery",
        subType: "无法定义异常 Problem cannot be located",
        issueDesc: "Failed to take a case. Unknown reason.",
        recovery: "Recovery.",
        minutes: 4
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
      }
    ]
  },

  {
    id: "failed_place_family",
    triggerKeywords: ["failed to place", "fail to place"],
    items: [
      {
        id: "failed_place_unknown",
        label: "Failed to place → Unknown reason",
        issueType: "设备Equipment",
        quick: "取放货异常Abnormal pick-up and delivery",
        subType: "无法定义异常 Problem cannot be located",
        issueDesc: "Failed to place a case. Unknown reason.",
        recovery: "Recovery.",
        minutes: 4
      },
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
      }
    ]
  },

  {
    id: "collision_family",
    triggerKeywords: ["collision of 2 robots", "robots collided", "robot collision"],
    items: [
      {
        id: "collision_generic",
        label: "Collision → Generic",
        issueType: "设备Equipment",
        quick: "机器人相互碰撞 Two robots collide",
        subType: "无法定义异常 Problem cannot be located",
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
    ]
  },

  {
    id: "unable_drive_family",
    triggerKeywords: ["unable to drive"],
    items: [
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
        label: "Unable to drive → Foreign object on floor",
        issueType: "客户Customer",
        quick: "行走异常Unable to drive",
        subType: "地面异物 Foreign objects on the ground",
        issueDesc: "Unable to drive. Foreign object on the floor.",
        recovery: "DM was cleaned, recovery key.",
        minutes: 2
      },
      {
        id: "unable_drive_unknown",
        label: "Unable to drive → Unknown reason",
        issueType: "设备Equipment",
        quick: "行走异常Unable to drive",
        subType: "无法定义异常 Problem cannot be located",
        issueDesc: "Unable to drive. Unknown reason.",
        recovery: "Recovery.",
        minutes: 2
      }
    ]
  },

  {
    id: "box_stuck_family",
    triggerKeywords: ["box stuck"],
    items: [
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
    ]
  }
];