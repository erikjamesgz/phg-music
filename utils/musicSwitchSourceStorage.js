"use strict";
const utils_storage = require("./storage.js");
const MUSIC_SWITCH_SOURCE_KEY = "musicSwitchSource";
function getMusicSwitchSource() {
  return utils_storage.getStorage(MUSIC_SWITCH_SOURCE_KEY, {});
}
function saveMusicSwitchSource(songId, switchInfo) {
  const switchSources = getMusicSwitchSource();
  const songIdStr = String(songId || "");
  const pureSongId = songIdStr.replace(/^(tx|wy|kg|kw|mg)_/, "");
  switchSources[pureSongId] = {
    ...switchInfo,
    switchTime: Date.now()
  };
  utils_storage.setStorage(MUSIC_SWITCH_SOURCE_KEY, switchSources);
  console.log("[MusicSwitchSource] 已保存换源信息, 原始歌曲ID:", pureSongId, switchInfo);
}
function getMusicSwitchSourceById(songId) {
  const switchSources = getMusicSwitchSource();
  const songIdStr = String(songId || "");
  const pureSongId = songIdStr.replace(/^(tx|wy|kg|kw|mg)_/, "");
  let result = switchSources[pureSongId] || null;
  if (!result) {
    result = switchSources[songIdStr] || null;
  }
  if (result) {
    console.log("[MusicSwitchSource] 找到换源信息, 歌曲ID:", pureSongId, "换源后:", result.newSource);
  }
  return result;
}
exports.getMusicSwitchSourceById = getMusicSwitchSourceById;
exports.saveMusicSwitchSource = saveMusicSwitchSource;
