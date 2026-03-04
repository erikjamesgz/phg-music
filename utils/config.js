"use strict";
const common_vendor = require("../common/vendor.js");
const STORAGE_KEY = "serverAddress";
const DEFAULT_SERVER_URL = "http://192.168.101.63:8080";
function getServerUrl() {
  try {
    const savedUrl = common_vendor.index.getStorageSync(STORAGE_KEY);
    return savedUrl || DEFAULT_SERVER_URL;
  } catch (error) {
    console.error("[config] 获取服务器地址失败:", error);
    return DEFAULT_SERVER_URL;
  }
}
function setServerUrl(url) {
  try {
    if (!url || typeof url !== "string") {
      console.error("[config] 无效的服务器地址:", url);
      return false;
    }
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      console.error("[config] 服务器地址为空");
      return false;
    }
    common_vendor.index.setStorageSync(STORAGE_KEY, trimmedUrl);
    console.log("[config] 服务器地址已保存:", trimmedUrl);
    return true;
  } catch (error) {
    console.error("[config] 保存服务器地址失败:", error);
    return false;
  }
}
exports.getServerUrl = getServerUrl;
exports.setServerUrl = setServerUrl;
