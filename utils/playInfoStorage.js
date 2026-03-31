"use strict";
const utils_storage = require("./storage.js");
const PLAY_INFO_KEY = "last_play_info";
let saveTimer = null;
const SAVE_INTERVAL = 2e3;
async function savePlayState(playState, immediate = false) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const doSave = async () => {
    var _a;
    try {
      const data = {
        // 播放进度
        time: playState.time || 0,
        maxTime: playState.maxTime || 0,
        // 播放列表信息
        listId: playState.listId || "",
        index: playState.index ?? -1,
        // 当前歌曲完整信息（用于恢复播放）
        currentSong: playState.currentSong || null,
        originalSong: playState.originalSong || null,
        // 播放列表（用于恢复播放列表）
        playlist: playState.playlist || [],
        // 播放状态
        playing: playState.playing || false,
        // 时间戳
        timestamp: Date.now()
      };
      await utils_storage.setStorage(PLAY_INFO_KEY, data);
      console.log("[playInfoStorage] 完整播放状态已保存, playing:", data.playing, "currentSong:", (_a = data.currentSong) == null ? void 0 : _a.name);
    } catch (error) {
      console.error("[playInfoStorage] 保存播放状态失败:", error);
    }
  };
  if (immediate) {
    await doSave();
  } else {
    saveTimer = setTimeout(async () => {
      await doSave();
      saveTimer = null;
    }, SAVE_INTERVAL);
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
async function getPlayState() {
  var _a, _b;
  try {
    const data = await utils_storage.getStorage(PLAY_INFO_KEY);
    if (!data) {
      console.log("[playInfoStorage] 没有保存的播放状态");
      return null;
    }
    console.log("[playInfoStorage] 获取到完整播放状态:", {
      playing: data.playing,
      currentSong: (_a = data.currentSong) == null ? void 0 : _a.name,
      playlistLength: (_b = data.playlist) == null ? void 0 : _b.length,
      time: data.time
    });
    return data;
  } catch (error) {
    console.error("[playInfoStorage] 获取播放状态失败:", error);
    return null;
  }
}
exports.getPlayInfo = getPlayInfo;
exports.getPlayState = getPlayState;
exports.savePlayState = savePlayState;
