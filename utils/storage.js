"use strict";
const common_vendor = require("../common/vendor.js");
function setStorage(key, data, expires = 0) {
  try {
    const storageData = {
      data,
      expires: expires > 0 ? Date.now() + expires * 1e3 : 0
    };
    common_vendor.index.setStorageSync(key, JSON.stringify(storageData));
    return true;
  } catch (e) {
    console.error("存储数据失败", e);
    return false;
  }
}
function getStorage(key, defaultValue = null) {
  try {
    const storageData = common_vendor.index.getStorageSync(key);
    if (!storageData)
      return defaultValue;
    const parsedData = JSON.parse(storageData);
    if (parsedData.expires > 0 && parsedData.expires < Date.now()) {
      removeStorage(key);
      return defaultValue;
    }
    return parsedData.data;
  } catch (e) {
    console.error("获取存储数据失败", e);
    return defaultValue;
  }
}
function removeStorage(key) {
  try {
    common_vendor.index.removeStorageSync(key);
    return true;
  } catch (e) {
    console.error("移除存储数据失败", e);
    return false;
  }
}
exports.getStorage = getStorage;
exports.removeStorage = removeStorage;
exports.setStorage = setStorage;
