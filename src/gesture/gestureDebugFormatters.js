const labels = {
  searching: "寻找手的位置",
  tracking: "已跟踪手部",
  ok: "OK 手势",
  fist: "五指合拢",
  pinching: "捏合中",
  throwing: "准备投掷",
  wish: "V 手势许愿",
  prayer: "许愿准备",
  drawing: "星轨绘制"
};

const eventLabels = {
  ok_open_letter: "识别到 OK，正在打开信纸",
  pinch_start: "捏合开始",
  pinch_move: "捏合移动",
  pinch_end: "捏合结束",
  fist_hold_start: "五指合拢",
  fist_knead: "正在揉开乱云",
  fist_knead_complete: "乱云已经揉开",
  wish_prayer_complete: "许愿模式已打开",
  wish_pose_complete: "V 手势已识别，许愿模式已打开",
  wish_trail_start: "开始画星轨",
  wish_trail_draw: "正在画星轨",
  wish_trail_end: "星轨已完成",
  star_throw_charge: "已抓住纸团，手可以放稳",
  star_throw_release: "挥得很好，星星飞出去了",
  gesture_cancel: "这次手势没有完成"
};

export function formatGestureLabel(status = "searching") {
  return labels[status] || labels.searching;
}

export function formatGestureEventLabel(eventType) {
  return eventLabels[eventType] || "手势实验已就绪";
}

export function formatFailureReason(event) {
  if (event?.debug?.reason === "throwTooSlow") return "再向上挥得轻快一点。";
  if (event?.debug?.reason === "oneHandVictory") return "请用单指继续画星轨。";
  if (event?.debug?.prayer?.reason === "tooFar") return "这个实验入口不稳定，请改用 V 手势或按钮开启星轨许愿。";
  if (event?.debug?.prayer?.reason === "needTwoHands") return "请改用 V 手势或按钮开启星轨许愿。";
  return "";
}
