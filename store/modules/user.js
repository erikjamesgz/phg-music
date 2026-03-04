"use strict";
const common_vendor = require("../../common/vendor.js");
const state = {
  // 用户信息
  userInfo: null,
  // 是否已登录
  isLoggedIn: false,
  // 用户统计数据
  stats: {
    listenCount: 0,
    // 累计听歌数量
    favoriteCount: 0,
    // 收藏歌曲总量
    downloadCount: 0,
    // 下载数量
    createPlaylistCount: 0,
    // 创建歌单数量
    listenTime: 0,
    // 今日听歌时长(分钟)
    totalListenTime: 0,
    // 累计听歌时长(分钟)
    favoriteSinger: "",
    // 最爱歌手
    singerPlayCount: {},
    // 歌手播放次数统计
    todayListenCount: 0,
    // 今日听歌数量
    weeklyListenCount: 0,
    // 本周听歌数量
    consecutiveDays: 0,
    // 连续听歌天数
    lastListenDate: ""
    // 最后听歌日期
  },
  // 用户设置
  settings: {
    theme: "light",
    // 主题: light, dark, auto
    language: "zh-CN",
    // 语言
    cacheStrategy: "wifi",
    // 缓存策略: always, wifi, never
    audioQuality: "standard",
    // 音质: low, standard, high, lossless
    downloadQuality: "standard",
    // 下载音质
    autoPlay: true,
    // 自动播放
    backgroundPlay: true,
    // 后台播放
    showLyrics: true,
    // 显示歌词
    notification: true
    // 通知
  }
};
const userStore = {
  // 获取状态
  getState() {
    return state;
  },
  // 设置状态
  setState(newState) {
    Object.assign(state, newState);
  },
  // 用户昵称
  get nickname() {
    return state.userInfo ? state.userInfo.nickname : "未登录";
  },
  // 用户头像
  get avatar() {
    return state.userInfo ? state.userInfo.avatar : "/static/images/default_avatar.png";
  },
  // 是否是会员
  get isVip() {
    return state.userInfo ? state.userInfo.isVip : false;
  },
  // 会员到期时间
  get vipExpireDate() {
    return state.userInfo ? state.userInfo.vipExpireDate : null;
  },
  // 设置用户信息
  setUserInfo(userInfo) {
    state.userInfo = userInfo;
    state.isLoggedIn = !!userInfo;
    if (userInfo) {
      common_vendor.index.setStorageSync("userInfo", userInfo);
    } else {
      common_vendor.index.removeStorageSync("userInfo");
    }
  },
  // 登录
  login(username, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === "demo" && password === "demo") {
          const userInfo = {
            id: "1",
            nickname: "青釉用户",
            avatar: "/static/images/default_avatar.png",
            isVip: true,
            vipExpireDate: "2023-12-31"
          };
          this.setUserInfo(userInfo);
          resolve(userInfo);
        } else {
          reject(new Error("用户名或密码错误"));
        }
      }, 1e3);
    });
  },
  // 登出
  logout() {
    this.setUserInfo(null);
    state.stats = {
      listenCount: 0,
      favoriteCount: 0,
      downloadCount: 0,
      createPlaylistCount: 0,
      listenTime: 0,
      totalListenTime: 0,
      favoriteSinger: "",
      singerPlayCount: {},
      todayListenCount: 0,
      weeklyListenCount: 0,
      consecutiveDays: 0,
      lastListenDate: ""
    };
  },
  // 更新用户统计数据
  updateStats(stats) {
    state.stats = { ...state.stats, ...stats };
    common_vendor.index.setStorageSync("userStats", state.stats);
  },
  // 增加听歌数量
  increaseListenCount(singerName = "") {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    state.stats.listenCount++;
    if (state.stats.lastListenDate === today) {
      state.stats.todayListenCount++;
    } else {
      const yesterday = /* @__PURE__ */ new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (state.stats.lastListenDate === yesterdayStr) {
        state.stats.consecutiveDays++;
      } else {
        state.stats.consecutiveDays = 1;
      }
      state.stats.todayListenCount = 1;
    }
    state.stats.lastListenDate = today;
    if (singerName && singerName !== "未知歌手") {
      const singerKey = singerName.trim();
      if (!state.stats.singerPlayCount) {
        state.stats.singerPlayCount = {};
      }
      if (!state.stats.singerPlayCount[singerKey]) {
        state.stats.singerPlayCount[singerKey] = 0;
      }
      state.stats.singerPlayCount[singerKey]++;
      this.updateFavoriteSinger();
    }
    common_vendor.index.setStorageSync("userStats", state.stats);
  },
  // 更新最爱歌手
  updateFavoriteSinger() {
    const singerCount = state.stats.singerPlayCount;
    let maxCount = 0;
    let favoriteSinger = "";
    for (const [singer, count] of Object.entries(singerCount)) {
      if (singer === "未知歌手" || !singer || !singer.trim()) {
        continue;
      }
      if (count > maxCount) {
        maxCount = count;
        favoriteSinger = singer;
      }
    }
    state.stats.favoriteSinger = favoriteSinger;
    state.stats.favoriteSingerCount = maxCount;
    console.log("[userStore] 更新最爱歌手:", favoriteSinger, "播放次数:", maxCount);
  },
  // 增加听歌时长（分钟）
  increaseListenTime(minutes) {
    state.stats.listenTime += minutes;
    state.stats.totalListenTime += minutes;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const lastResetDate = common_vendor.index.getStorageSync("listenTimeResetDate") || "";
    if (lastResetDate !== today) {
      state.stats.listenTime = minutes;
      common_vendor.index.setStorageSync("listenTimeResetDate", today);
    }
    common_vendor.index.setStorageSync("userStats", state.stats);
  },
  // 重置今日听歌时长
  resetTodayListenTime() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const lastResetDate = common_vendor.index.getStorageSync("listenTimeResetDate") || "";
    if (lastResetDate !== today) {
      state.stats.listenTime = 0;
      common_vendor.index.setStorageSync("listenTimeResetDate", today);
      common_vendor.index.setStorageSync("userStats", state.stats);
    }
  },
  // 增加收藏数量
  increaseFavoriteCount() {
    state.stats.favoriteCount++;
    common_vendor.index.setStorageSync("userStats", state.stats);
  },
  // 获取收藏歌曲总量（从playlistStore获取）
  getFavoriteSongCount() {
    return state.stats.favoriteCount;
  },
  // 增加下载数量
  increaseDownloadCount() {
    state.stats.downloadCount++;
    common_vendor.index.setStorageSync("userStats", state.stats);
  },
  // 增加创建歌单数量
  increaseCreatePlaylistCount() {
    state.stats.createPlaylistCount++;
    common_vendor.index.setStorageSync("userStats", state.stats);
  },
  // 更新用户设置
  updateSettings(settings) {
    state.settings = { ...state.settings, ...settings };
    common_vendor.index.setStorageSync("userSettings", state.settings);
    if (settings.theme) {
      this.applyTheme(settings.theme);
    }
  },
  // 应用主题
  applyTheme(theme) {
    common_vendor.index.setStorageSync("theme", theme);
  },
  // 从本地存储恢复状态
  restoreState() {
    const userInfo = common_vendor.index.getStorageSync("userInfo");
    if (userInfo) {
      state.userInfo = userInfo;
      state.isLoggedIn = true;
    }
    const userStats = common_vendor.index.getStorageSync("userStats");
    if (userStats) {
      if (userStats.singerPlayCount) {
        delete userStats.singerPlayCount["未知歌手"];
        delete userStats.singerPlayCount[""];
        for (const key of Object.keys(userStats.singerPlayCount)) {
          if (!key || !key.trim()) {
            delete userStats.singerPlayCount[key];
          }
        }
      }
      state.stats = userStats;
    }
    const userSettings = common_vendor.index.getStorageSync("userSettings");
    if (userSettings) {
      state.settings = userSettings;
    }
  }
};
exports.userStore = userStore;
