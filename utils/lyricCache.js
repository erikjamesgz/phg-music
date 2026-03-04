"use strict";
require("../common/vendor.js");
const utils_storage = require("./storage.js");
const LYRIC_CACHE_PREFIX = "lyric_cache_";
const LYRIC_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1e3;
function getLyricCacheKey(songId, source) {
  return `${LYRIC_CACHE_PREFIX}${source}_${songId}`;
}
async function getCachedLyric(songId, source) {
  try {
    const cacheKey = getLyricCacheKey(songId, source);
    const cached = await utils_storage.getStorage(cacheKey);
    if (!cached) {
      console.log("[lyricCache] 未找到缓存歌词:", songId, source);
      return null;
    }
    if (cached.timestamp && Date.now() - cached.timestamp > LYRIC_CACHE_EXPIRY) {
      console.log("[lyricCache] 歌词缓存已过期:", songId);
      await utils_storage.removeStorage(cacheKey);
      return null;
    }
    console.log("[lyricCache] 命中歌词缓存:", songId, source);
    return cached.data;
  } catch (error) {
    console.error("[lyricCache] 获取缓存歌词失败:", error);
    return null;
  }
}
async function setCachedLyric(songId, source, lyricInfo) {
  try {
    const cacheKey = getLyricCacheKey(songId, source);
    const cacheData = {
      timestamp: Date.now(),
      data: lyricInfo
    };
    await utils_storage.setStorage(cacheKey, cacheData);
    console.log("[lyricCache] 歌词已缓存:", songId, source);
    return true;
  } catch (error) {
    console.error("[lyricCache] 缓存歌词失败:", error);
    return false;
  }
}
exports.getCachedLyric = getCachedLyric;
exports.setCachedLyric = setCachedLyric;
