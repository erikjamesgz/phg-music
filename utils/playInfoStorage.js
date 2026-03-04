"use strict";
const utils_storage = require("./storage.js");
const PLAY_INFO_KEY = "last_play_info";
let saveTimer = null;
const SAVE_INTERVAL = 2e3;
async function savePlayInfo(playInfo, immediate = false) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (immediate) {
    await doSavePlayInfo(playInfo);
  } else {
    saveTimer = setTimeout(async () => {
      await doSavePlayInfo(playInfo);
      saveTimer = null;
    }, SAVE_INTERVAL);
  }
}
async function doSavePlayInfo(playInfo) {
  try {
    const data = {
      time: playInfo.time || 0,
      maxTime: playInfo.maxTime || 0,
      listId: playInfo.listId || "",
      index: playInfo.index ?? -1,
      timestamp: Date.now()
    };
    await utils_storage.setStorage(PLAY_INFO_KEY, data);
    console.log("[playInfoStorage] 播放信息已保存:", data);
  } catch (error) {
    console.error("[playInfoStorage] 保存播放信息失败:", error);
  }
}
async function getPlayInfo() {
  try {
    const data = await utils_storage.getStorage(PLAY_INFO_KEY);
    if (!data)
      return null;
    console.log("[playInfoStorage] 获取到保存的播放信息:", data);
    return data;
  } catch (error) {
    console.error("[playInfoStorage] 获取播放信息失败:", error);
    return null;
  }
}
exports.getPlayInfo = getPlayInfo;
exports.savePlayInfo = savePlayInfo;
