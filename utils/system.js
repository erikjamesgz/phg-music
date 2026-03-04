"use strict";
const common_vendor = require("../common/vendor.js");
let cachedSystemInfo = null;
const getSystemInfo = () => {
  if (cachedSystemInfo) {
    return cachedSystemInfo;
  }
  try {
    cachedSystemInfo = common_vendor.index.getSystemInfoSync();
    return cachedSystemInfo;
  } catch (e) {
    console.error("[getSystemInfo] 获取系统信息失败:", e);
    return {
      statusBarHeight: 20,
      platform: "ios",
      screenWidth: 375,
      windowWidth: 375
    };
  }
};
const getMenuButtonInfo = () => {
  try {
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    return menuButtonInfo || {
      width: 87,
      height: 32,
      top: 26,
      bottom: 58,
      left: 278,
      right: 365
    };
  } catch (e) {
    console.error("[getMenuButtonInfo] 获取胶囊按钮信息失败:", e);
  }
  return {
    width: 87,
    height: 32,
    top: 26,
    bottom: 58,
    left: 278,
    right: 365
  };
};
const getStatusBarHeight = () => {
  const systemInfo = getSystemInfo();
  return systemInfo.statusBarHeight || 20;
};
const getNavbarHeight = () => {
  const statusBarHeight = getStatusBarHeight();
  const menuButtonInfo = getMenuButtonInfo();
  const navbarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
  return statusBarHeight + navbarHeight;
};
const getSafeAreaStyle = () => {
  const statusBarHeight = getStatusBarHeight();
  return { paddingTop: `${statusBarHeight}px` };
};
const setAppTheme = (theme) => {
  common_vendor.index.setStorageSync("userTheme", theme);
};
const getDeviceInfo = () => {
  const systemInfo = common_vendor.index.getSystemInfoSync();
  return {
    platform: systemInfo.platform,
    // 客户端平台
    brand: systemInfo.brand,
    // 设备品牌
    model: systemInfo.model,
    // 设备型号
    system: systemInfo.system,
    // 操作系统版本
    deviceId: systemInfo.deviceId || "",
    // 设备 ID
    deviceOrientation: systemInfo.deviceOrientation,
    // 设备方向
    devicePixelRatio: systemInfo.devicePixelRatio,
    // 设备像素比
    windowWidth: systemInfo.windowWidth,
    // 窗口宽度
    windowHeight: systemInfo.windowHeight,
    // 窗口高度
    screenWidth: systemInfo.screenWidth,
    // 屏幕宽度
    screenHeight: systemInfo.screenHeight,
    // 屏幕高度
    language: systemInfo.language,
    // 语言
    version: systemInfo.version,
    // 应用版本号
    statusBarHeight: systemInfo.statusBarHeight,
    // 状态栏高度
    safeArea: systemInfo.safeArea,
    // 安全区域
    isIOS: systemInfo.platform === "ios",
    // 是否 iOS 设备
    isAndroid: systemInfo.platform === "android"
    // 是否 Android 设备
  };
};
const getAppVersion = () => {
  try {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    console.log("[getAppVersion] 系统信息:", systemInfo);
    return {
      name: "拼好歌",
      version: systemInfo.appVersion || "1.0.0",
      versionCode: systemInfo.appVersionCode || 100
    };
  } catch (e) {
    console.error("[getAppVersion] 获取版本信息失败:", e);
    return {
      name: "拼好歌",
      version: "1.0.0",
      versionCode: 100
    };
  }
};
const setStatusBarTextColor = (color = "black") => {
  try {
    common_vendor.index.setNavigationBarColor({
      frontColor: color === "white" ? "#ffffff" : "#000000",
      backgroundColor: color === "white" ? "#000000" : "#ffffff"
    });
  } catch (e) {
    console.error("[setStatusBarTextColor] 设置状态栏颜色失败:", e);
  }
};
exports.getAppVersion = getAppVersion;
exports.getDeviceInfo = getDeviceInfo;
exports.getNavbarHeight = getNavbarHeight;
exports.getSafeAreaStyle = getSafeAreaStyle;
exports.getStatusBarHeight = getStatusBarHeight;
exports.setAppTheme = setAppTheme;
exports.setStatusBarTextColor = setStatusBarTextColor;
