"use strict";
const common_vendor = require("../common/vendor.js");
const memoryCache = {
  musicUrl: /* @__PURE__ */ new Map(),
  picUrl: /* @__PURE__ */ new Map()
};
const getPicUrlKey = (songId, source) => `${source}_${songId}`;
function getCachedPicUrl(songId, source) {
  const key = getPicUrlKey(songId, source);
  const cached = memoryCache.picUrl.get(key);
  if (cached) {
    console.log("[Cache] 命中图片URL缓存:", key);
    return cached;
  }
  try {
    const storageKey = `pic_url_${key}`;
    const storageData = common_vendor.index.getStorageSync(storageKey);
    if (storageData) {
      console.log("[Cache] 从本地存储获取图片URL:", key);
      memoryCache.picUrl.set(key, storageData);
      return storageData;
    }
  } catch (e) {
    console.error("[Cache] 读取本地存储失败:", e);
  }
  return null;
}
function setCachedPicUrl(songId, source, url) {
  const key = getPicUrlKey(songId, source);
  memoryCache.picUrl.set(key, url);
  try {
    const storageKey = `pic_url_${key}`;
    common_vendor.index.setStorageSync(storageKey, url);
    console.log("[Cache] 保存图片URL到缓存:", key);
  } catch (e) {
    console.error("[Cache] 保存到本地存储失败:", e);
  }
}
exports.getCachedPicUrl = getCachedPicUrl;
exports.setCachedPicUrl = setCachedPicUrl;
