"use strict";
const common_vendor = require("../common/vendor.js");
const CACHE_KEY_PREFIX = "@music_url__";
const preloadState = {
  isLoading: false,
  info: null
};
function getCacheKey(songId, quality, source = "kg") {
  return `${CACHE_KEY_PREFIX}${songId}_${quality}_${source}`;
}
async function getCachedMusicUrl(songId, quality = "128k", source = "kg") {
  try {
    const key = getCacheKey(songId, quality, source);
    const cached = common_vendor.index.getStorageSync(key);
    if (cached) {
      console.log("[MusicUrlCache] 命中缓存:", key);
      return cached;
    }
    return null;
  } catch (e) {
    console.error("[MusicUrlCache] 读取缓存失败:", e);
  }
}
async function setCachedMusicUrl(songId, quality = "128k", url, source = "kg") {
  try {
    const key = getCacheKey(songId, quality, source);
    common_vendor.index.setStorageSync(key, url);
    console.log("[MusicUrlCache] 保存缓存:", key);
  } catch (e) {
    console.error("[MusicUrlCache] 保存缓存失败:", e);
  }
}
async function isMusicUrlCached(songId, quality = "128k", source = "kg") {
  try {
    const key = getCacheKey(songId, quality, source);
    const cached = common_vendor.index.getStorageSync(key);
    return !!cached;
  } catch (e) {
    console.error("[MusicUrlCache] 检查缓存失败:", e);
    return false;
  }
}
async function preloadNextMusic(nextSong, getMusicUrlFn, quality = "128k") {
  if (!nextSong || !nextSong.id)
    return;
  if (preloadState.isLoading)
    return;
  const isCached = await isMusicUrlCached(nextSong.id, quality);
  if (isCached) {
    console.log("[MusicUrlCache] 下一首已有缓存，无需预加载:", nextSong.name);
    return;
  }
  preloadState.isLoading = true;
  preloadState.info = nextSong;
  console.log("[MusicUrlCache] 开始预加载下一首:", nextSong.name);
  try {
    const result = await getMusicUrlFn(nextSong, quality);
    if (result && result.url) {
      await setCachedMusicUrl(nextSong.id, quality, result.url);
      console.log("[MusicUrlCache] 预加载成功:", nextSong.name);
    }
  } catch (error) {
    console.error("[MusicUrlCache] 预加载失败:", error.message);
  } finally {
    preloadState.isLoading = false;
    preloadState.info = null;
  }
}
exports.getCachedMusicUrl = getCachedMusicUrl;
exports.isMusicUrlCached = isMusicUrlCached;
exports.preloadNextMusic = preloadNextMusic;
exports.setCachedMusicUrl = setCachedMusicUrl;
