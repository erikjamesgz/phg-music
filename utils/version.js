"use strict";
const common_vendor = require("../common/vendor.js");
const utils_system = require("./system.js");
const VERSION_URLS = [
  `https://raw.githubusercontent.com/erikjamesgz/phg-music/main/doc/version/version.json`,
  `https://cdn.jsdelivr.net/gh/erikjamesgz/phg-music/doc/version/version.json`,
  `https://fastly.jsdelivr.net/gh/erikjamesgz/phg-music/doc/version/version.json`
];
const VERSION_KEY = "ignore_version";
const LAST_CHECK_KEY = "last_check_time";
const CHECK_INTERVAL = 12 * 60 * 60 * 1e3;
const getCurrentVersion = () => {
  const appInfo = utils_system.getAppVersion();
  return {
    version: appInfo.version || "1.0.0",
    versionCode: parseInt(appInfo.versionCode) || 100
  };
};
const hasNewVersion = (currentCode, latestCode) => {
  return latestCode > currentCode;
};
const fetchVersionInfo = (url) => {
  return new Promise((resolve) => {
    console.log("[Version] 开始请求:", url);
    common_vendor.index.request({
      url,
      method: "GET",
      timeout: 1e4,
      dataType: "json",
      success: (res) => {
        console.log("[Version] 请求成功, url:", url, "statusCode:", res.statusCode, "data:", res.data, "dataType:", typeof res.data);
        if (res.statusCode === 200 && res.data) {
          let data = res.data;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (e) {
              console.log("[Version] JSON解析失败:", e);
              resolve(null);
              return;
            }
          }
          console.log("[Version] 解析后的版本信息:", data);
          resolve(data);
        } else {
          console.log("[Version] 状态码或数据为空, statusCode:", res.statusCode);
          resolve(null);
        }
      },
      fail: (err) => {
        console.log("[Version] 请求失败, url:", url, "error:", err);
        resolve(null);
      }
    });
  });
};
const fetchVersionFromUrls = async () => {
  for (const url of VERSION_URLS) {
    try {
      const info = await fetchVersionInfo(url);
      console.log("[Version] fetchVersionFromUrls 获取结果:", url, info);
      if (info && info.versionCode) {
        console.log("[Version] 从以下地址获取版本信息成功:", url);
        return info;
      }
    } catch (e) {
      console.log("[Version] 从以下地址获取版本信息失败:", url, e);
    }
  }
  return null;
};
const checkUpdate = async (force = false) => {
  const currentVersion = getCurrentVersion();
  console.log("[Version] 当前版本:", currentVersion);
  const lastCheck = common_vendor.index.getStorageSync(LAST_CHECK_KEY);
  const now = Date.now();
  if (!force && lastCheck && now - lastCheck < CHECK_INTERVAL) {
    console.log("[Version] 距离上次检查不足12小时，跳过检查");
    return { hasUpdate: false, isCache: true };
  }
  const versionInfo = await fetchVersionFromUrls();
  if (!versionInfo || !versionInfo.versionCode) {
    console.log("[Version] 获取版本信息失败");
    common_vendor.index.setStorageSync(LAST_CHECK_KEY, now);
    return { hasUpdate: false, error: "获取版本信息失败" };
  }
  common_vendor.index.setStorageSync(LAST_CHECK_KEY, now);
  const updateAvailable = hasNewVersion(currentVersion.versionCode, versionInfo.versionCode);
  console.log("[Version] 最新版本:", versionInfo.versionCode, "有更新:", updateAvailable);
  if (updateAvailable) {
    const ignoredVersion = common_vendor.index.getStorageSync(VERSION_KEY);
    if (ignoredVersion === versionInfo.version) {
      console.log("[Version] 用户已忽略此版本:", versionInfo.version);
      return { hasUpdate: false, ignored: true };
    }
    return {
      hasUpdate: true,
      versionInfo: {
        version: versionInfo.version,
        versionCode: versionInfo.versionCode,
        desc: versionInfo.desc || "",
        downloadUrl: versionInfo.downloadUrl || "",
        releaseUrl: versionInfo.releaseUrl || "",
        projectUrl: versionInfo.projectUrl || ""
      },
      currentVersion: currentVersion.version
    };
  }
  return { hasUpdate: false };
};
const ignoreVersion = (version) => {
  common_vendor.index.setStorageSync(VERSION_KEY, version);
  console.log("[Version] 已忽略版本:", version);
};
const checkUpdateAndShow = async (force = false) => {
  const result = await checkUpdate(force);
  if (result.hasUpdate && result.versionInfo) {
    common_vendor.index.$emit("showUpdatePopup", result);
    return result;
  }
  if (result.error) {
    common_vendor.index.showToast({
      title: result.error,
      icon: "none"
    });
  }
  return result;
};
exports.checkUpdate = checkUpdate;
exports.checkUpdateAndShow = checkUpdateAndShow;
exports.ignoreVersion = ignoreVersion;
