"use strict";
const common_vendor = require("../common/vendor.js");
const locale_index = require("../locale/index.js");
const getDefaultLang = () => {
  const savedLang = common_vendor.index.getStorageSync("userLanguage");
  if (savedLang) {
    return savedLang;
  }
  return "zh-CN";
};
try {
  const savedLang = common_vendor.index.getStorageSync("userLanguage");
  if (savedLang && !locale_index.messages[savedLang]) {
    common_vendor.index.removeStorageSync("userLanguage");
  }
} catch (e) {
}
let currentLocale = getDefaultLang();
console.log("[i18n] 初始化语言:", currentLocale);
console.log("[i18n] 支持的语言:", Object.keys(locale_index.messages));
const setLanguage = (lang) => {
  if (locale_index.messages[lang]) {
    currentLocale = lang;
    common_vendor.index.setStorageSync("userLanguage", lang);
    return true;
  }
  return false;
};
const getCurrentLanguage = () => {
  return currentLocale;
};
const getSupportedLanguages = () => {
  return [
    {
      code: "zh-CN",
      name: "简体中文"
    }
  ];
};
exports.getCurrentLanguage = getCurrentLanguage;
exports.getSupportedLanguages = getSupportedLanguages;
exports.setLanguage = setLanguage;
