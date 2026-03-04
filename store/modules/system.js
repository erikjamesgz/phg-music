"use strict";
const common_vendor = require("../../common/vendor.js");
const state = {
  theme: "light",
  language: "zh-CN",
  searchHistory: []
};
const systemStore = {
  // 获取状态
  getState() {
    return state;
  },
  // 设置状态
  setState(newState) {
    Object.assign(state, newState);
    common_vendor.index.setStorageSync("system", JSON.stringify(state));
  },
  // 设置主题
  setTheme(theme) {
    state.theme = theme;
    common_vendor.index.setStorageSync("system", JSON.stringify(state));
  },
  // 设置语言
  setLanguage(language) {
    state.language = language;
    common_vendor.index.setStorageSync("system", JSON.stringify(state));
  },
  // 添加搜索历史
  addSearchHistory(keyword) {
    if (!state.searchHistory.includes(keyword)) {
      state.searchHistory.unshift(keyword);
      if (state.searchHistory.length > 10) {
        state.searchHistory.pop();
      }
      common_vendor.index.setStorageSync("system", JSON.stringify(state));
    }
  },
  // 清空搜索历史
  clearSearchHistory() {
    state.searchHistory = [];
    common_vendor.index.setStorageSync("system", JSON.stringify(state));
  },
  // 从本地存储恢复状态
  restoreState() {
    const savedState = common_vendor.index.getStorageSync("system");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        Object.assign(state, parsedState);
      } catch (e) {
        console.error("恢复系统状态失败:", e);
      }
    }
  }
};
exports.systemStore = systemStore;
