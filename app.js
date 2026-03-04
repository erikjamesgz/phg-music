"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_index = require("./store/index.js");
const store_modules_player = require("./store/modules/player.js");
const store_modules_user = require("./store/modules/user.js");
if (!Math) {
  "./pages/main/index.js";
  "./pages/index/index.js";
  "./pages/playlist/index.js";
  "./pages/search/index.js";
  "./pages/music-sources/index.js";
  "./pages/player/index.js";
  "./pages/rank/index.js";
  "./pages/my/index.js";
  "./pages/settings/index.js";
  "./pages/sharelist/index.js";
  "./pages/songlist-list/index.js";
}
const _sfc_main = {
  name: "App",
  data() {
    return {
      isAppEnvironment: typeof plus !== "undefined",
      isMpWeixin: false,
      playStartTime: 0,
      // 定时停止播放相关
      sleepTimerRemaining: 0,
      sleepTimerEndTime: null,
      sleepTimerInterval: null
    };
  },
  onLaunch: async function() {
    console.log("======================");
    console.log("[App] 应用启动");
    console.log("[App] 时间:", (/* @__PURE__ */ new Date()).toISOString());
    console.log("[App] 运行环境:", "mp-weixin");
    console.log("[App] isAppEnvironment:", this.isAppEnvironment);
    const installTime = common_vendor.index.getStorageSync("appInstallTime");
    if (!installTime) {
      const now = Date.now();
      common_vendor.index.setStorageSync("appInstallTime", now);
      console.log("[App] 首次安装时间已保存:", new Date(now).toLocaleString());
    }
    console.log("[App] 开始初始化状态管理...");
    try {
      await store_index.initializeStores();
      console.log("[App] 状态管理初始化完成");
    } catch (error) {
      console.error("[App] 状态管理初始化失败:", error);
    }
    this.isMpWeixin = true;
    console.log("[App] 检测到微信小程序环境");
    this.initBackgroundAudioManager();
    this.initThemeChangeListener();
    this.checkSystemThemeOnLaunch();
    common_vendor.index.$on("songChanging", () => {
      console.log("[App] 收到切歌事件，统计播放时长");
      this.recordPlayTime();
    });
    common_vendor.index.$on("sleepTimerStop", () => {
      console.log("[App] 收到定时停止播放事件，停止播放");
      store_modules_player.playerStore.pause();
      common_vendor.index.showToast({
        title: "定时停止播放已生效",
        icon: "none"
      });
    });
    common_vendor.index.$on("sleepTimerSet", (data) => {
      console.log("[App] 收到设置定时器事件:", data);
      this.startSleepTimer(data.totalSeconds);
    });
    common_vendor.index.$on("sleepTimerCancel", () => {
      console.log("[App] 收到取消定时器事件");
      this.cancelSleepTimer();
    });
    console.log("[App] isMpWeixin:", this.isMpWeixin);
    console.log("======================");
  },
  // 官方推荐的监听系统主题变化方式
  onThemeChange(res) {
    console.log("[App] onThemeChange 生命周期触发:", res);
    const followSystem = common_vendor.index.getStorageSync("followSystem");
    console.log("[App] onThemeChange - followSystem:", followSystem);
    if (followSystem !== "false") {
      const isDark = res.theme === "dark";
      console.log("[App] onThemeChange - 系统主题:", res.theme, "isDark:", isDark);
      common_vendor.index.setStorageSync("darkMode", isDark.toString());
      console.log("[App] onThemeChange - darkMode 已更新:", common_vendor.index.getStorageSync("darkMode"));
      common_vendor.index.$emit("systemThemeChange", { theme: res.theme, isDark });
      console.log("[App] onThemeChange - 已发送主题变化事件");
    } else {
      console.log("[App] onThemeChange - 跟随系统未开启，跳过更新");
    }
  },
  onShow: function() {
    console.log("[App] 应用显示");
    this.syncBackgroundAudioState();
    this.checkSystemTheme();
  },
  onHide: function() {
    console.log("[App] 应用隐藏");
  },
  methods: {
    // 初始化背景音频管理器
    initBackgroundAudioManager() {
      console.log("[App] 初始化背景音频管理器");
      const audioManager = common_vendor.index.getBackgroundAudioManager();
      if (audioManager) {
        audioManager.onPlay(() => {
          console.log("[BackgroundAudio] onPlay");
          const state = store_modules_player.playerStore.getState();
          if (state)
            state.playing = true;
          store_modules_player.playerStore.clearLoadTimeout();
          store_modules_player.playerStore.clearQuickCheckTimeout();
          store_modules_player.playerStore.clearStatusText();
          const state2 = store_modules_player.playerStore.getState();
          if (state2)
            state2.playNextRetryCount = 0;
          if (state2)
            state2.isUsingCachedUrl = false;
          this.playStartTime = Date.now();
        });
        audioManager.onPause(() => {
          console.log("[BackgroundAudio] onPause");
          const state = store_modules_player.playerStore.getState();
          if (state)
            state.playing = false;
          this.recordPlayTime();
        });
        audioManager.onStop(() => {
          console.log("[BackgroundAudio] onStop");
          const state = store_modules_player.playerStore.getState();
          if (state) {
            state.playing = false;
            state.currentTime = 0;
          }
          this.recordPlayTime();
        });
        audioManager.onEnded(() => {
          console.log("[BackgroundAudio] onEnded");
          this.recordPlayTime();
          console.log("[App] 调用 playerStore.handlePlayEnded");
          void store_modules_player.playerStore.handlePlayEnded();
        });
        audioManager.onTimeUpdate(() => {
          const state = store_modules_player.playerStore.getState();
          if (state) {
            state.currentTime = audioManager.currentTime;
            state.duration = audioManager.duration;
          }
        });
        audioManager.onPrev(() => {
          console.log("[BackgroundAudio] onPrev");
          store_modules_player.playerStore.playPrev();
        });
        audioManager.onNext(() => {
          console.log("[BackgroundAudio] onNext");
          store_modules_player.playerStore.playNext();
        });
        audioManager.onError((err) => {
          console.error("[BackgroundAudio] onError:", err);
          const state = store_modules_player.playerStore.getState();
          if (state) {
            state.playing = false;
            state.error = err.errMsg || "播放错误";
          }
          this.recordPlayTime();
          console.log("[BackgroundAudio] onError - 准备刷新URL");
          void store_modules_player.playerStore.refreshMusicUrl();
        });
        console.log("[App] 背景音频管理器初始化完成");
      }
    },
    // 同步背景音频播放状态
    syncBackgroundAudioState() {
      const audioManager = common_vendor.index.getBackgroundAudioManager();
      if (audioManager) {
        console.log("[App] 同步背景音频状态:", {
          paused: audioManager.paused,
          duration: audioManager.duration,
          currentTime: audioManager.currentTime,
          src: audioManager.src
        });
        const state = store_modules_player.playerStore.getState();
        if (state) {
          state.playing = !audioManager.paused;
          state.currentTime = audioManager.currentTime || 0;
          state.duration = audioManager.duration || 0;
        }
      }
    },
    // 统计播放时长（在暂停、停止、切歌、结束时调用）
    recordPlayTime() {
      if (!this.playStartTime)
        return;
      const endTime = Date.now();
      const playDuration = (endTime - this.playStartTime) / 1e3 / 60;
      this.playStartTime = 0;
      if (playDuration > 5 / 60) {
        store_modules_user.userStore.increaseListenTime(playDuration);
        console.log("[App] 播放时长统计: +" + playDuration.toFixed(2) + "分钟, 当前总时长:", store_modules_user.userStore.getState().stats.listenTime.toFixed(2), "分钟");
      }
    },
    // 启动定时停止播放
    startSleepTimer(totalSeconds) {
      if (this.sleepTimerInterval) {
        clearInterval(this.sleepTimerInterval);
      }
      this.sleepTimerRemaining = totalSeconds;
      this.sleepTimerEndTime = Date.now() + totalSeconds * 1e3;
      this.sleepTimerInterval = setInterval(() => {
        const remaining = Math.floor((this.sleepTimerEndTime - Date.now()) / 1e3);
        if (remaining <= 0) {
          clearInterval(this.sleepTimerInterval);
          this.sleepTimerInterval = null;
          this.sleepTimerRemaining = 0;
          this.sleepTimerEndTime = null;
          common_vendor.index.$emit("sleepTimerStop");
        } else {
          this.sleepTimerRemaining = remaining;
          common_vendor.index.$emit("sleepTimerUpdate", { remaining: this.sleepTimerRemaining });
        }
      }, 1e3);
      common_vendor.index.$emit("sleepTimerUpdate", { remaining: this.sleepTimerRemaining });
    },
    // 取消定时停止播放
    cancelSleepTimer() {
      if (this.sleepTimerInterval) {
        clearInterval(this.sleepTimerInterval);
        this.sleepTimerInterval = null;
      }
      this.sleepTimerRemaining = 0;
      this.sleepTimerEndTime = null;
      common_vendor.index.$emit("sleepTimerUpdate", { remaining: 0 });
      common_vendor.index.showToast({
        title: "已取消定时停止播放",
        icon: "success"
      });
    },
    // 获取定时器剩余时间
    getSleepTimerRemaining() {
      return this.sleepTimerRemaining;
    },
    // 初始化系统主题变化监听
    initThemeChangeListener() {
      console.log("[App] 初始化系统主题变化监听");
      if (typeof common_vendor.index.onThemeChange !== "function") {
        console.log("[App] uni.onThemeChange 不可用，跳过监听");
        return;
      }
      common_vendor.index.onThemeChange((res) => {
        console.log("[App] uni.onThemeChange 回调触发:", JSON.stringify(res));
        console.log("[App] res.theme:", res.theme);
        if (!res || !res.theme) {
          console.log("[App] 主题变化回调数据无效");
          return;
        }
        const followSystem = common_vendor.index.getStorageSync("followSystem");
        console.log("[App] followSystem 当前值:", followSystem);
        if (followSystem !== "false") {
          const isDark = res.theme === "dark";
          const oldDarkMode = common_vendor.index.getStorageSync("darkMode");
          console.log("[App] darkMode 旧值:", oldDarkMode, "-> 新值:", isDark.toString());
          common_vendor.index.setStorageSync("darkMode", isDark.toString());
          console.log("[App] darkMode 已更新:", common_vendor.index.getStorageSync("darkMode"));
          common_vendor.index.$emit("systemThemeChange", { theme: res.theme, isDark });
          console.log("[App] 已发送主题变化事件");
        } else {
          console.log("[App] 跟随系统未开启，跳过更新");
        }
      });
      console.log("[App] 系统主题变化监听初始化完成");
    },
    // 检查系统主题并更新 darkMode（小程序重启时调用）
    async checkSystemTheme() {
      try {
        console.log("[App] 检查系统主题...");
        const followSystem = common_vendor.index.getStorageSync("followSystem");
        console.log("[App] checkSystemTheme - followSystem:", followSystem);
        if (followSystem !== "false") {
          const systemInfo = await common_vendor.index.getSystemInfo();
          console.log("[App] checkSystemTheme - systemInfo.theme:", systemInfo.theme);
          if (systemInfo.theme) {
            const isDark = systemInfo.theme === "dark";
            const currentDarkMode = common_vendor.index.getStorageSync("darkMode");
            const shouldBeDark = isDark.toString();
            console.log("[App] checkSystemTheme - 当前 darkMode:", currentDarkMode, "应该更新为:", shouldBeDark);
            if (currentDarkMode !== shouldBeDark) {
              common_vendor.index.setStorageSync("darkMode", shouldBeDark);
              console.log("[App] checkSystemTheme - 已更新 darkMode");
              common_vendor.index.$emit("systemThemeChange", {
                theme: systemInfo.theme,
                isDark
              });
              console.log("[App] checkSystemTheme - 已发送主题变化事件");
            } else {
              console.log("[App] checkSystemTheme - 值相同，无需更新");
            }
          }
        } else {
          console.log("[App] checkSystemTheme - 跟随系统未开启");
        }
      } catch (error) {
        console.error("[App] checkSystemTheme 失败:", error);
      }
    },
    // App 启动时检查系统主题（更可靠的方案）
    async checkSystemThemeOnLaunch() {
      try {
        console.log("[App] checkSystemThemeOnLaunch - 开始检查系统主题");
        const followSystem = common_vendor.index.getStorageSync("followSystem");
        console.log("[App] checkSystemThemeOnLaunch - followSystem:", followSystem);
        if (followSystem !== "false") {
          const systemInfo = common_vendor.index.getSystemInfoSync();
          console.log("[App] checkSystemThemeOnLaunch - systemInfo:", JSON.stringify(systemInfo));
          console.log("[App] checkSystemThemeOnLaunch - systemInfo.theme:", systemInfo.theme);
          if (systemInfo.theme) {
            const isDark = systemInfo.theme === "dark";
            const shouldBeDark = isDark.toString();
            common_vendor.index.setStorageSync("darkMode", shouldBeDark);
            console.log("[App] checkSystemThemeOnLaunch - darkMode 已更新为:", shouldBeDark);
            common_vendor.index.$emit("systemThemeChange", {
              theme: systemInfo.theme,
              isDark
            });
            console.log("[App] checkSystemThemeOnLaunch - 已发送主题变化事件");
          } else {
            console.log("[App] checkSystemThemeOnLaunch - systemInfo.theme 为空，无法获取系统主题");
          }
        } else {
          console.log("[App] checkSystemThemeOnLaunch - 跟随系统未开启");
        }
      } catch (error) {
        console.error("[App] checkSystemThemeOnLaunch 失败:", error);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
