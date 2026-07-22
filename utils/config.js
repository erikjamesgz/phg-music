"use strict";
const common_vendor = require("../common/vendor.js");
const STORAGE_KEY = "serverAddress";
const MESH_MODE_KEY = "mesh_mode";
const LOCAL_SCRIPTS_KEY = "mesh_local_scripts";
function getServerUrl() {
  try {
    const savedUrl = common_vendor.index.getStorageSync(STORAGE_KEY);
    return savedUrl || "";
  } catch (error) {
    console.error("[config] 获取服务器地址失败:", error);
    return "";
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
function getApiUrl(path) {
  const serverUrl = getServerUrl();
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  const normalizedServerUrl = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  return normalizedServerUrl + normalizedPath;
}
function getMeshMode() {
  try {
    return common_vendor.index.getStorageSync(MESH_MODE_KEY) || null;
  } catch (e) {
    console.error("[config] 获取 Mesh 模式失败:", e);
    return null;
  }
}
function setMeshMode(mode) {
  try {
    common_vendor.index.setStorageSync(MESH_MODE_KEY, mode);
    console.log("[config] Mesh 模式已设置为:", mode);
  } catch (e) {
    console.error("[config] 设置 Mesh 模式失败:", e);
  }
}
function hasOwnServer() {
  const origin = getServerOrigin();
  const apiKey = getApiKey();
  return !!(origin && apiKey);
}
function getLocalScripts() {
  try {
    const scripts = common_vendor.index.getStorageSync(LOCAL_SCRIPTS_KEY);
    if (Array.isArray(scripts))
      return scripts;
  } catch (e) {
    console.error("[config] 获取本地脚本失败:", e);
  }
  return [];
}
function setLocalScripts(scripts) {
  try {
    common_vendor.index.setStorageSync(LOCAL_SCRIPTS_KEY, scripts);
  } catch (e) {
    console.error("[config] 保存本地脚本失败:", e);
  }
}
function hasLocalScripts() {
  return getLocalScripts().length > 0;
}
function addLocalScript(script) {
  const scripts = getLocalScripts();
  if (script.isDefault) {
    scripts.forEach((s) => {
      s.isDefault = false;
    });
  }
  scripts.push(script);
  setLocalScripts(scripts);
}
function removeLocalScript(id) {
  const scripts = getLocalScripts().filter((s) => s.id !== id);
  setLocalScripts(scripts);
}
function setDefaultLocalScript(id) {
  const scripts = getLocalScripts();
  scripts.forEach((s) => {
    s.isDefault = s.id === id;
  });
  setLocalScripts(scripts);
}
function getServerOrigin() {
  const url = getServerUrl();
  return parseOrigin(url);
}
function getApiKey() {
  const url = getServerUrl();
  return parseApiKey(url);
}
function parseOrigin(url) {
  if (!url)
    return "";
  const trimmed = url.trim().replace(/\/+$/, "");
  const match = trimmed.match(/^(https?:\/\/[^/]+)/i);
  if (match)
    return match[1];
  return trimmed.split("/")[0];
}
function parseApiKey(url) {
  if (!url)
    return "";
  const trimmed = url.trim().replace(/\/+$/, "");
  const origin = parseOrigin(trimmed);
  const pathPart = trimmed.substring(origin.length).replace(/^\/+/, "");
  if (!pathPart)
    return "";
  const firstSegment = pathPart.split("/")[0];
  return firstSegment || "";
}
const MIN_SERVER_VERSION_CODE = 10010;
const MIN_SERVER_VERSION = "1.0.10";
function checkServerCompat(statusData, fallbackReason) {
  if (!statusData)
    return;
  console.log("[checkServerCompat] 开始检查, statusData:", JSON.stringify(statusData), "fallback:", fallbackReason);
  let clientVersionCode = 100;
  let clientVersion = "1.0.01";
  try {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    clientVersion = systemInfo.appVersion || systemInfo.version || "1.0.01";
    clientVersionCode = parseInt(systemInfo.appVersionCode) || 100;
  } catch (e) {
    console.error("[config] 读取客户端版本失败:", e);
  }
  const serverVersionCode = statusData.serverVersionCode || 0;
  const serverVersion = statusData.serverVersion;
  const minClientVersionCode = statusData.minClientVersionCode || 0;
  const minClientVersion = statusData.minClientVersion;
  let result = null;
  if (serverVersionCode < MIN_SERVER_VERSION_CODE) {
    let content;
    if (serverVersion && serverVersion !== "旧版" && serverVersion !== "未知") {
      content = `当前服务器版本 v${serverVersion}，部分功能可能异常，建议升级服务端到 v${MIN_SERVER_VERSION} 以上`;
    } else {
      content = `服务器版本过低，部分功能可能异常，建议升级服务端到 v${MIN_SERVER_VERSION} 以上`;
    }
    result = { type: "server_too_old", title: "服务器版本过低", content };
    console.log("[checkServerCompat] 触发弹窗: 服务器版本过低");
  }
  if (!result && minClientVersionCode > clientVersionCode) {
    let content;
    if (minClientVersion && minClientVersion !== "未知") {
      content = `服务器要求客户端版本 ≥ v${minClientVersion}，当前 v${clientVersion}，建议更新客户端`;
    } else {
      content = `服务器要求更高的客户端版本，当前 v${clientVersion}，建议更新客户端`;
    }
    result = { type: "client_too_old", title: "客户端版本过低", content };
    console.log("[checkServerCompat] 触发弹窗: 客户端版本过低");
  }
  if (result) {
    console.log("[checkServerCompat] 发送全局事件 showCompatModal:", result);
    common_vendor.index.$emit("showCompatModal", result);
  } else {
    console.log("[checkServerCompat] 版本兼容，无需弹窗");
  }
}
exports.MIN_SERVER_VERSION = MIN_SERVER_VERSION;
exports.MIN_SERVER_VERSION_CODE = MIN_SERVER_VERSION_CODE;
exports.addLocalScript = addLocalScript;
exports.checkServerCompat = checkServerCompat;
exports.getApiKey = getApiKey;
exports.getApiUrl = getApiUrl;
exports.getLocalScripts = getLocalScripts;
exports.getMeshMode = getMeshMode;
exports.getServerOrigin = getServerOrigin;
exports.getServerUrl = getServerUrl;
exports.hasLocalScripts = hasLocalScripts;
exports.hasOwnServer = hasOwnServer;
exports.removeLocalScript = removeLocalScript;
exports.setDefaultLocalScript = setDefaultLocalScript;
exports.setMeshMode = setMeshMode;
exports.setServerUrl = setServerUrl;
