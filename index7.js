"use strict";
const common_vendor = require("./common/vendor.js");
const i18n_index = require("./i18n/index.js");
const utils_system = require("./utils/system.js");
const utils_i18n = require("./utils/i18n.js");
const utils_config = require("./utils/config.js");
const utils_version = require("./utils/version.js");
const UpdateModal = () => "./components/common/UpdateModal.js";
const RocIconPlus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  components: {
    RocIconPlus,
    UpdateModal
  },
  data() {
    return {
      currentTime: "9:41",
      statusBarHeight: utils_system.getStatusBarHeight(),
      // 弹窗显示状态
      showLanguagePopup: false,
      showSleepTimerPopup: false,
      showServerModalFlag: false,
      showResourceCachePopup: false,
      showMetaCachePopup: false,
      showAboutPopup: false,
      showUserAgreementPopup: false,
      // 更新弹窗
      showUpdatePopup: false,
      updateInfo: null,
      pactAgreed: false,
      // 服务器地址
      serverAddress: "",
      testingConnection: false,
      connectionTestResult: null,
      // 个性化设置
      celadonTheme: true,
      darkMode: false,
      followSystem: true,
      showDebugLog: false,
      // 播放设置 - 评论弹幕
      showCommentDanmaku: true,
      showMiniPlayerDanmaku: false,
      // 播放设置 - 定时停止播放
      sleepTimerRemaining: 0,
      // 剩余秒数（从 App.vue 同步）
      sleepTimerPickerValue: [0, 0],
      // picker-view 选中值 [小时索引, 分钟索引]
      tempSelectedHour: 0,
      // 临时选中的小时
      tempSelectedMinute: 0,
      // 临时选中的分钟
      // 缓存管理
      resourceCacheSize: "点击查看",
      appCacheSize: "0KB",
      musicUrlCacheSize: "0KB",
      musicUrlCacheCount: 0,
      metaCacheSize: "点击查看",
      otherSourceCacheCount: 0,
      otherSourceCacheSize: "0KB",
      lyricCacheCount: 0,
      lyricCacheSize: "0KB",
      cleaningResourceCache: false,
      cleaningOtherSource: false,
      cleaningLyric: false,
      // 音频文件缓存
      audioFileCacheSize: "0MB",
      // 应用信息
      appVersion: "v1.0.0",
      // 语言设置
      currentLanguage: "",
      supportedLanguages: [],
      tempLanguage: "",
      // 电池优化相关（仅Android）
      isAndroid: false,
      isIgnoringBatteryOptimization: true,
      // 本地检测的平板模式状态（用于独立页面时）
      localIsTablet: false
      // 注意：isTablet 通过 computed 属性合并 inject 和本地检测的值
    };
  },
  inject: {
    // 从父组件（main/index.vue）接收平板模式状态
    injectedIsTablet: {
      from: "isTablet",
      default: () => false
    }
  },
  computed: {
    // 合并注入的平板模式状态和本地检测状态
    isTablet() {
      if (this.injectedIsTablet !== false && this.injectedIsTablet !== void 0) {
        console.log("[Settings] 使用父组件注入的平板模式状态:", this.injectedIsTablet);
        return this.injectedIsTablet;
      }
      console.log("[Settings] 使用本地检测的平板模式状态:", this.localIsTablet);
      return this.localIsTablet;
    },
    navbarStyle() {
      return {
        paddingTop: `${this.statusBarHeight}px`
      };
    },
    // 平板模式弹窗顶部安全距离
    tabletModalSafeTop() {
      if (!this.isTablet)
        return "0px";
      return `${utils_system.getNavbarHeight()}px`;
    },
    // 协议同意时间
    pactAgreedTime() {
      const time = common_vendor.index.getStorageSync("pactAgreedTime");
      if (time) {
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
      const installTime = common_vendor.index.getStorageSync("appInstallTime");
      if (installTime) {
        const date = new Date(installTime);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
      return "未知时间";
    },
    // 小时选项 0-99
    hourOptions() {
      const hours = [];
      for (let i = 0; i <= 99; i++) {
        hours.push(i < 10 ? `0${i}` : `${i}`);
      }
      return hours;
    },
    // 分钟选项 0-59
    minuteOptions() {
      const minutes = [];
      for (let i = 0; i <= 59; i++) {
        minutes.push(i < 10 ? `0${i}` : `${i}`);
      }
      return minutes;
    },
    // 格式化剩余时间显示
    formatSleepTimerRemaining() {
      const remaining = this.sleepTimerRemaining;
      if (typeof remaining !== "number" || isNaN(remaining) || remaining <= 0) {
        return "";
      }
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor(remaining % 3600 / 60);
      const seconds = remaining % 60;
      if (hours > 0) {
        return `${hours}时${minutes}分${seconds}秒`;
      } else if (minutes > 0) {
        return `${minutes}分${seconds}秒`;
      } else {
        return `${seconds}秒`;
      }
    }
  },
  created() {
    this.initSettings();
    this.startClock();
    this.initLanguageSettings();
    this.checkIsTablet();
    common_vendor.index.$on("systemThemeChange", this.handleSystemThemeChange);
    common_vendor.index.$on("themeChanged", this.handleThemeChanged);
    console.log("[Settings] created: 已注册主题变化监听");
  },
  beforeUnmount() {
    common_vendor.index.$off("systemThemeChange", this.handleSystemThemeChange);
    common_vendor.index.$off("themeChanged", this.handleThemeChanged);
    console.log("[Settings] beforeUnmount: 已移除主题变化监听");
  },
  async onShow() {
    console.log("[Settings] onShow: 页面显示");
    common_vendor.index.$on("sleepTimerUpdate", this.handleSleepTimerUpdate);
    common_vendor.index.onWindowResize(() => {
      console.log("[Settings] 窗口大小变化，重新检测平板模式");
      this.checkIsTablet();
    });
    console.log("[Settings] 已注册窗口大小变化监听");
    if (this.followSystem) {
      console.log("[Settings] onShow: 跟随系统模式，同步系统主题");
      await this.syncSystemTheme();
    }
    const app = getApp();
    if (app && app.getSleepTimerRemaining) {
      const remaining = app.getSleepTimerRemaining();
      this.sleepTimerRemaining = typeof remaining === "number" && !isNaN(remaining) ? remaining : 0;
    }
  },
  onHide() {
    console.log("[Settings] onHide: 页面隐藏");
    common_vendor.index.$off("sleepTimerUpdate", this.handleSleepTimerUpdate);
  },
  methods: {
    // 检测是否为平板模式（用于独立页面时）
    checkIsTablet() {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const width = systemInfo.windowWidth || systemInfo.screenWidth || 0;
        const height = systemInfo.windowHeight || systemInfo.screenHeight || 0;
        const TABLET_ASPECT_RATIO = 0.85;
        const TABLET_MIN_WIDTH = 400;
        this.localIsTablet = width / height >= TABLET_ASPECT_RATIO && width >= TABLET_MIN_WIDTH;
        console.log("[Settings] 本地检测 - 容器:", width, "x", height, "宽高比:", (width / height).toFixed(2), "平板模式:", this.localIsTablet);
      } catch (e) {
        this.localIsTablet = false;
        console.log("[Settings] 检测平板模式失败:", e);
      }
    },
    // 处理定时器更新
    handleSleepTimerUpdate(data) {
      const remaining = data.remaining;
      this.sleepTimerRemaining = typeof remaining === "number" && !isNaN(remaining) ? remaining : 0;
    },
    // 国际化方法
    $t(key) {
      return utils_i18n.t(key);
    },
    // 初始化设置
    initSettings() {
      this.celadonTheme = common_vendor.index.getStorageSync("celadonTheme") !== "false";
      this.darkMode = common_vendor.index.getStorageSync("darkMode") === "true";
      const followSystem = common_vendor.index.getStorageSync("followSystem");
      this.followSystem = followSystem !== "false" && followSystem !== false;
      console.log("[Settings] initSettings - followSystem:", followSystem, "类型:", typeof followSystem, "this.followSystem:", this.followSystem);
      this.showDebugLog = common_vendor.index.getStorageSync("showDebugLog") === "true";
      const storedDanmaku = common_vendor.index.getStorageSync("showCommentDanmaku");
      this.showCommentDanmaku = storedDanmaku === "" || storedDanmaku === null ? true : storedDanmaku === "true";
      const storedMiniDanmaku = common_vendor.index.getStorageSync("showMiniPlayerDanmaku");
      this.showMiniPlayerDanmaku = storedMiniDanmaku === "true";
      const versionInfo = utils_system.getAppVersion();
      this.appVersion = "v" + versionInfo.version;
    },
    // 启动时钟
    startClock() {
      const updateTime = () => {
        const now = /* @__PURE__ */ new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        this.currentTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
      };
      updateTime();
      setInterval(updateTime, 6e4);
    },
    // 返回上一页
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 跳转到音源管理页面
    goToMusicSources() {
      const url = "/pages/music-sources/index";
      if (this.isTablet) {
        common_vendor.index.$emit("settings-navigate", { url });
      } else {
        common_vendor.index.navigateTo({ url });
      }
    },
    // 切换青釉主题
    toggleCeladonTheme(e) {
      this.celadonTheme = e.detail.value;
      common_vendor.index.setStorageSync("celadonTheme", this.celadonTheme.toString());
      this.applyTheme();
    },
    // 切换夜间模式
    toggleDarkMode(e) {
      if (this.followSystem) {
        this.followSystem = false;
        common_vendor.index.setStorageSync("followSystem", "false");
        console.log("[Settings] 用户手动切换模式，关闭跟随系统");
      }
      this.darkMode = e.detail.value;
      common_vendor.index.setStorageSync("darkMode", this.darkMode.toString());
      this.applyTheme();
    },
    // 切换调试日志显示
    toggleDebugLog(e) {
      this.showDebugLog = e.detail.value;
      common_vendor.index.setStorageSync("showDebugLog", this.showDebugLog.toString());
      console.log("[Settings] 调试日志显示状态:", this.showDebugLog);
      common_vendor.index.$emit("debugLogStatusChanged", { show: this.showDebugLog });
    },
    // 获取真实系统主题（不读取缓存）
    async getRealSystemTheme() {
      try {
        const systemInfo = await common_vendor.index.getSystemInfo();
        console.log("[Settings] 系统信息:", systemInfo);
        console.log("[Settings] theme字段:", systemInfo.theme);
        if (systemInfo.theme) {
          console.log("[Settings] 微信小程序系统主题:", systemInfo.theme);
          return systemInfo.theme;
        } else {
          console.log("[Settings] 微信小程序未获取到theme，检查darkmode配置");
        }
      } catch (error) {
        console.error("[Settings] 获取系统信息失败:", error);
      }
      console.log("[Settings] 无法获取系统主题，默认返回 light");
      return "light";
    },
    // 处理主题变化事件（来自 main 的广播）
    handleThemeChanged(data) {
      console.log("[Settings] 收到 themeChanged 事件:", data);
      if (data && typeof data.isDark === "boolean") {
        this.darkMode = data.isDark;
        console.log("[Settings] 已更新 darkMode:", this.darkMode);
        common_vendor.index.$emit("themeLogAdded", { log: `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [Settings] 收到主题变化: ${JSON.stringify(data)}` });
      }
    },
    // 处理系统主题变化事件（来自App.vue）
    handleSystemThemeChange(data) {
      console.log("[Settings] 收到系统主题变化事件:", data);
      if (this.followSystem) {
        console.log("[Settings] 当前处于跟随系统模式，更新主题");
        this.darkMode = data.isDark;
        common_vendor.index.setStorageSync("darkMode", this.darkMode.toString());
        console.log("[Settings] 已更新 darkMode:", this.darkMode);
        common_vendor.index.$emit("themeLogAdded", { log: `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [Settings] 收到系统主题变化: ${JSON.stringify(data)}` });
        common_vendor.index.$emit("themeLogAdded", { log: `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [Settings] 已更新 darkMode: ${this.darkMode}` });
        this.applyTheme();
      } else {
        console.log("[Settings] 当前不处于跟随系统模式，忽略主题变化");
        common_vendor.index.$emit("themeLogAdded", { log: `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [Settings] 不跟随系统，忽略主题变化` });
      }
    },
    // 同步系统主题（从 Storage 读取最新的 darkMode 值）
    async syncSystemTheme() {
      try {
        console.log("[Settings] syncSystemTheme: 开始同步");
        const storedDarkMode = common_vendor.index.getStorageSync("darkMode");
        console.log("[Settings] syncSystemTheme: Storage 中的 darkMode:", storedDarkMode);
        const shouldBeDark = storedDarkMode === "true";
        if (this.darkMode !== shouldBeDark) {
          console.log("[Settings] syncSystemTheme: 更新 darkMode", this.darkMode, "->", shouldBeDark);
          this.darkMode = shouldBeDark;
          common_vendor.index.setStorageSync("darkMode", shouldBeDark.toString());
          this.applyTheme();
        } else {
          console.log("[Settings] syncSystemTheme: 值相同，无需更新");
        }
      } catch (error) {
        console.error("[Settings] syncSystemTheme 失败:", error);
      }
    },
    // 切换跟随系统
    async toggleFollowSystem(e) {
      console.log("[Settings] 切换跟随系统:", e.detail.value);
      this.followSystem = e.detail.value;
      common_vendor.index.setStorageSync("followSystem", this.followSystem.toString());
      if (this.followSystem) {
        const systemTheme = await this.getRealSystemTheme();
        console.log("[Settings] 开启跟随系统，当前系统主题:", systemTheme);
        this.darkMode = systemTheme === "dark";
        console.log("[Settings] 设置 darkMode:", this.darkMode);
        common_vendor.index.setStorageSync("darkMode", this.darkMode.toString());
      }
      this.applyTheme();
    },
    // 应用主题
    async applyTheme() {
      console.log("[Settings] 应用主题, followSystem:", this.followSystem, "darkMode:", this.darkMode);
      let theme = "light";
      if (this.followSystem) {
        theme = await this.getRealSystemTheme();
        console.log("[Settings] 跟随系统模式，系统主题:", theme);
        const shouldBeDark = theme === "dark";
        if (this.darkMode !== shouldBeDark) {
          console.log("[Settings] 更新 darkMode:", this.darkMode, "->", shouldBeDark);
          this.darkMode = shouldBeDark;
          common_vendor.index.setStorageSync("darkMode", this.darkMode.toString());
        }
      } else if (this.darkMode) {
        theme = "dark";
        console.log("[Settings] 手动深色模式");
      }
      console.log("[Settings] 最终主题:", theme);
      utils_system.setAppTheme(theme);
    },
    // 获取定时停止播放显示文本
    getSleepTimerDisplay() {
      const remaining = this.sleepTimerRemaining;
      if (typeof remaining !== "number" || isNaN(remaining) || remaining <= 0) {
        return "已关闭";
      }
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor(remaining % 3600 / 60);
      const seconds = remaining % 60;
      if (hours > 0) {
        return `${hours}时${minutes}分${seconds}秒后停止`;
      } else if (minutes > 0) {
        return `${minutes}分${seconds}秒后停止`;
      } else {
        return `${seconds}秒后停止`;
      }
    },
    // 获取定时停止播放值
    getSleepTimerValue() {
      const remaining = this.sleepTimerRemaining;
      if (typeof remaining !== "number" || isNaN(remaining) || remaining <= 0) {
        return "关闭";
      }
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor(remaining % 3600 / 60);
      if (hours > 0) {
        return `${hours}时${minutes}分`;
      } else {
        return `${minutes}分`;
      }
    },
    // 显示定时停止播放选择器
    showSleepTimerSelector() {
      this.sleepTimerPickerValue = [0, 0];
      this.tempSelectedHour = 0;
      this.tempSelectedMinute = 0;
      this.showSleepTimerPopup = true;
    },
    // 关闭定时停止播放选择器
    closeSleepTimerPopup() {
      this.showSleepTimerPopup = false;
    },
    // picker-view 值改变事件
    onSleepTimerPickerChange(e) {
      const value = e.detail.value;
      this.sleepTimerPickerValue = value;
      this.tempSelectedHour = value[0];
      this.tempSelectedMinute = value[1];
    },
    // 取消定时器
    cancelSleepTimer() {
      common_vendor.index.$emit("sleepTimerCancel");
    },
    // 确认定时停止播放选择
    confirmSleepTimerSelection() {
      const hours = this.tempSelectedHour;
      const minutes = this.tempSelectedMinute;
      const totalSeconds = hours * 3600 + minutes * 60;
      if (totalSeconds <= 0) {
        common_vendor.index.showToast({
          title: "请选择有效的时间",
          icon: "none"
        });
        return;
      }
      common_vendor.index.$emit("sleepTimerSet", { totalSeconds });
      const displayText = hours > 0 ? `${hours}时${minutes}分后停止播放` : `${minutes}分钟后停止播放`;
      common_vendor.index.showToast({
        title: displayText,
        icon: "success"
      });
      this.closeSleepTimerPopup();
    },
    // 获取缓存大小
    getCacheSize() {
      let allKeys = [];
      try {
        const res = common_vendor.index.getStorageInfoSync();
        allKeys = res.keys || [];
      } catch (error) {
        console.error("[缓存管理] 获取存储键失败:", error);
        this.resourceCacheSize = "获取失败";
        this.metaCacheSize = "0KB";
        return;
      }
      setTimeout(() => {
        this.getResourceCacheSize(allKeys);
      }, 0);
      setTimeout(() => {
        this.getMetaCacheInfo(allKeys);
      }, 100);
    },
    // 获取资源缓存大小
    getResourceCacheSize(allKeys) {
      console.log("[缓存管理] 开始获取资源缓存大小");
      try {
        common_vendor.index.getStorageInfo({
          success: (res) => {
            const totalSizeKB = res.currentSize;
            const totalSizeMB = (totalSizeKB / 1024).toFixed(2);
            const keys = allKeys || res.keys || [];
            const musicUrlKeys = keys.filter((key) => key.startsWith("music_url_") || key.startsWith("@music_url__"));
            let musicUrlSize = 0;
            musicUrlKeys.forEach((key) => {
              try {
                const data = common_vendor.index.getStorageSync(key);
                if (data) {
                  musicUrlSize += JSON.stringify(data).length;
                }
              } catch (e) {
              }
            });
            const musicUrlSizeKB = (musicUrlSize / 1024).toFixed(2);
            this.musicUrlCacheCount = musicUrlKeys.length;
            const lyricKeys = keys.filter((key) => key.startsWith("lyric_cache_"));
            let lyricSize = 0;
            lyricKeys.forEach((key) => {
              try {
                const data = common_vendor.index.getStorageSync(key);
                if (data) {
                  lyricSize += JSON.stringify(data).length;
                }
              } catch (e) {
              }
            });
            const lyricSizeKB = (lyricSize / 1024).toFixed(2);
            const picKeys = keys.filter((key) => key.startsWith("pic_url_"));
            let picSize = 0;
            picKeys.forEach((key) => {
              try {
                const data = common_vendor.index.getStorageSync(key);
                if (data) {
                  picSize += JSON.stringify(data).length;
                }
              } catch (e) {
              }
            });
            const picSizeKB = (picSize / 1024).toFixed(2);
            this.getAudioFileCacheSize().then((audioFileSizeMB) => {
              this.audioFileCacheSize = audioFileSizeMB + "MB";
              const otherSizeKB = parseFloat(musicUrlSizeKB) + parseFloat(lyricSizeKB) + parseFloat(picSizeKB);
              const appCacheSizeKB = Math.max(0, totalSizeKB - otherSizeKB);
              this.appCacheSize = appCacheSizeKB.toFixed(2) + "KB";
              this.musicUrlCacheSize = musicUrlSizeKB + "KB";
              this.resourceCacheSize = (parseFloat(totalSizeMB) + parseFloat(audioFileSizeMB || 0)).toFixed(2) + "MB";
              console.log("[缓存管理] 资源缓存统计完成:", this.resourceCacheSize);
            }).catch(() => {
              const otherSizeKB = parseFloat(musicUrlSizeKB) + parseFloat(lyricSizeKB) + parseFloat(picSizeKB);
              const appCacheSizeKB = Math.max(0, totalSizeKB - otherSizeKB);
              this.appCacheSize = appCacheSizeKB.toFixed(2) + "KB";
              this.musicUrlCacheSize = musicUrlSizeKB + "KB";
              this.resourceCacheSize = totalSizeMB + "MB";
              this.audioFileCacheSize = "0MB";
              console.log("[缓存管理] 资源缓存统计完成:", this.resourceCacheSize);
            });
          },
          fail: () => {
            this.resourceCacheSize = "获取失败";
            this.appCacheSize = "0KB";
            this.musicUrlCacheSize = "0KB";
          }
        });
      } catch (error) {
        console.error("[缓存管理] 获取资源缓存大小失败:", error);
        this.resourceCacheSize = "获取失败";
        this.appCacheSize = "0KB";
        this.musicUrlCacheSize = "0KB";
      }
    },
    // 获取音频文件缓存大小
    getAudioFileCacheSize() {
      return new Promise((resolve, reject) => {
        try {
          common_vendor.index.getSavedFileList({
            success: (res) => {
              if (!res.fileList || res.fileList.length === 0) {
                console.log("[缓存管理] 微信小程序没有保存的音频文件");
                resolve("0");
                return;
              }
              let totalSize = 0;
              let audioFileCount = 0;
              console.log("[缓存管理] 微信小程序保存的文件数量:", res.fileList.length);
              res.fileList.forEach((file) => {
                const isAudioFile = file.filePath.includes(".mp3") || file.filePath.includes(".m4a") || file.filePath.includes(".aac") || file.filePath.includes("audio") || file.filePath.includes("music");
                if (isAudioFile) {
                  totalSize += file.size;
                  audioFileCount++;
                  console.log("[缓存管理] 微信小程序音频文件:", file.filePath, "大小:", (file.size / (1024 * 1024)).toFixed(2), "MB");
                }
              });
              const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
              console.log("[缓存管理] 微信小程序音频文件数量:", audioFileCount);
              console.log("[缓存管理] 微信小程序音频文件缓存总大小:", totalSizeMB, "MB");
              resolve(totalSizeMB);
            },
            fail: (error) => {
              console.error("[缓存管理] 微信小程序获取保存文件列表失败:", error);
              resolve("0");
            }
          });
        } catch (error) {
          console.error("[缓存管理] 微信小程序获取音频文件缓存异常:", error);
          resolve("0");
        }
      });
    },
    // 清理音频文件缓存
    cleanAudioFileCache() {
      console.log("[缓存管理] 开始清理音频文件缓存");
      return new Promise((resolve, reject) => {
        try {
          common_vendor.index.getSavedFileList({
            success: (res) => {
              if (!res.fileList || res.fileList.length === 0) {
                console.log("[缓存管理] 微信小程序没有音频文件需要清理");
                resolve();
                return;
              }
              let deleted = 0;
              let failed = 0;
              const audioFiles = [];
              res.fileList.forEach((file) => {
                const isAudioFile = file.filePath.includes(".mp3") || file.filePath.includes(".m4a") || file.filePath.includes(".aac") || file.filePath.includes("audio") || file.filePath.includes("music");
                if (isAudioFile) {
                  audioFiles.push(file);
                }
              });
              if (audioFiles.length === 0) {
                console.log("[缓存管理] 微信小程序没有音频文件需要清理");
                resolve();
                return;
              }
              console.log("[缓存管理] 微信小程序开始清理音频文件，共", audioFiles.length, "个");
              let completed = 0;
              audioFiles.forEach((file) => {
                common_vendor.index.removeSavedFile({
                  filePath: file.filePath,
                  success: () => {
                    console.log("[缓存管理] 微信小程序删除音频文件:", file.filePath);
                    deleted++;
                    completed++;
                    if (completed === audioFiles.length) {
                      console.log("[缓存管理] 微信小程序音频文件清理完成，成功删除", deleted, "个，失败", failed, "个");
                      this.audioFileCacheSize = "0MB";
                      resolve();
                    }
                  },
                  fail: (error) => {
                    console.error("[缓存管理] 微信小程序删除音频文件失败:", file.filePath, error);
                    failed++;
                    completed++;
                    if (completed === audioFiles.length) {
                      console.log("[缓存管理] 微信小程序音频文件清理完成，成功删除", deleted, "个，失败", failed, "个");
                      this.audioFileCacheSize = "0MB";
                      resolve();
                    }
                  }
                });
              });
            },
            fail: (error) => {
              console.error("[缓存管理] 微信小程序获取保存文件列表失败:", error);
              resolve();
            }
          });
        } catch (error) {
          console.error("[缓存管理] 微信小程序清理音频文件缓存异常:", error);
          resolve();
        }
        resolve();
      });
    },
    // 获取元数据缓存信息
    getMetaCacheInfo(allKeys) {
      try {
        let keys = allKeys;
        if (!keys) {
          try {
            const res = common_vendor.index.getStorageInfoSync();
            keys = res.keys || [];
          } catch (e) {
            keys = [];
          }
        }
        const otherSourceKeys = keys.filter((key) => key.startsWith("musicOtherSource_"));
        const lyricKeys = keys.filter((key) => key.startsWith("lyric_cache_"));
        let otherSourceSize = 0;
        otherSourceKeys.forEach((key) => {
          try {
            const data = common_vendor.index.getStorageSync(key);
            if (data) {
              otherSourceSize += JSON.stringify(data).length;
            }
          } catch (e) {
          }
        });
        const otherSourceSizeKB = (otherSourceSize / 1024).toFixed(2);
        this.otherSourceCacheSize = otherSourceSizeKB + "KB";
        let lyricSize = 0;
        lyricKeys.forEach((key) => {
          try {
            const data = common_vendor.index.getStorageSync(key);
            if (data) {
              lyricSize += JSON.stringify(data).length;
            }
          } catch (e) {
          }
        });
        const lyricSizeKB = (lyricSize / 1024).toFixed(2);
        this.lyricCacheSize = lyricSizeKB + "KB";
        const totalSizeKB = parseFloat(otherSourceSizeKB) + parseFloat(lyricSizeKB);
        this.metaCacheSize = totalSizeKB.toFixed(2) + "KB";
        this.otherSourceCacheCount = otherSourceKeys.length;
        this.lyricCacheCount = lyricKeys.length;
        console.log("[缓存管理] 元数据缓存统计完成:", this.metaCacheSize);
      } catch (error) {
        console.error("[缓存管理] 获取元数据缓存信息失败:", error);
        this.otherSourceCacheCount = 0;
        this.otherSourceCacheSize = "0KB";
        this.lyricCacheCount = 0;
        this.lyricCacheSize = "0KB";
        this.metaCacheSize = "0KB";
      }
    },
    // 根据前缀获取存储键
    getStorageKeysByPrefix(prefix) {
      try {
        const res = common_vendor.index.getStorageInfoSync();
        return res.keys.filter((key) => key.startsWith(prefix));
      } catch (error) {
        console.error("获取存储键失败:", error);
        return [];
      }
    },
    // 显示资源缓存管理
    showResourceCache() {
      this.resourceCacheSize = "计算中...";
      this.audioFileCacheSize = "计算中...";
      this.showResourceCachePopup = true;
      setTimeout(() => {
        this.getResourceCacheSize();
      }, 100);
    },
    // 关闭资源缓存管理
    closeResourceCachePopup() {
      this.showResourceCachePopup = false;
    },
    // 清理资源缓存
    cleanResourceCache() {
      common_vendor.index.showModal({
        title: "确认清理",
        content: "确定要清理所有资源缓存吗？这将清除应用缓存、歌曲URL缓存和音频文件缓存。",
        success: (res) => {
          if (res.confirm) {
            this.cleaningResourceCache = true;
            const musicUrlKeys1 = this.getStorageKeysByPrefix("music_url_");
            const musicUrlKeys2 = this.getStorageKeysByPrefix("@music_url__");
            const musicUrlKeys = [...musicUrlKeys1, ...musicUrlKeys2];
            musicUrlKeys.forEach((key) => {
              try {
                common_vendor.index.removeStorageSync(key);
                console.log("[缓存管理] 已删除歌曲URL缓存:", key);
              } catch (e) {
                console.error("[缓存管理] 删除歌曲URL缓存失败:", key, e);
              }
            });
            this.cleanAudioFileCache().then(() => {
              this.getResourceCacheSize();
              this.cleaningResourceCache = false;
              common_vendor.index.showToast({
                title: "缓存已清理",
                icon: "success"
              });
            }).catch((error) => {
              console.error("[缓存管理] 清理音频文件缓存失败:", error);
              this.cleaningResourceCache = false;
              common_vendor.index.showToast({
                title: "清理失败",
                icon: "none"
              });
            });
          }
        }
      });
    },
    // 显示其他缓存管理
    showMetaCache() {
      this.metaCacheSize = "计算中...";
      this.showMetaCachePopup = true;
      setTimeout(() => {
        this.getMetaCacheInfo();
      }, 100);
    },
    // 关闭其他缓存管理
    closeMetaCachePopup() {
      this.showMetaCachePopup = false;
    },
    // 清理换源歌曲缓存
    cleanOtherSourceCache() {
      common_vendor.index.showModal({
        title: "确认清理",
        content: "确定要清理换源歌曲缓存吗？",
        success: (res) => {
          if (res.confirm) {
            this.cleaningOtherSource = true;
            const otherSourceKeys = this.getStorageKeysByPrefix("musicOtherSource_");
            otherSourceKeys.forEach((key) => {
              try {
                common_vendor.index.removeStorageSync(key);
                console.log("[缓存管理] 已删除换源歌曲缓存:", key);
              } catch (e) {
                console.error("[缓存管理] 删除换源歌曲缓存失败:", key, e);
              }
            });
            this.getMetaCacheInfo();
            this.cleaningOtherSource = false;
            common_vendor.index.showToast({
              title: "换源歌曲缓存已清理",
              icon: "success"
            });
          }
        }
      });
    },
    // 清理歌词缓存
    cleanLyricCache() {
      common_vendor.index.showModal({
        title: "确认清理",
        content: "确定要清理歌词缓存吗？",
        success: (res) => {
          if (res.confirm) {
            this.cleaningLyric = true;
            const lyricKeys = this.getStorageKeysByPrefix("lyric_cache_");
            lyricKeys.forEach((key) => {
              try {
                common_vendor.index.removeStorageSync(key);
                console.log("[缓存管理] 已删除歌词缓存:", key);
              } catch (e) {
                console.error("[缓存管理] 删除歌词缓存失败:", key, e);
              }
            });
            this.getMetaCacheInfo();
            this.cleaningLyric = false;
            common_vendor.index.showToast({
              title: "歌词缓存已清理",
              icon: "success"
            });
          }
        }
      });
    },
    // 初始化语言设置
    initLanguageSettings() {
      this.currentLanguage = i18n_index.getCurrentLanguage();
      this.supportedLanguages = i18n_index.getSupportedLanguages();
    },
    // 显示语言选择器
    showLanguageSelector() {
      this.tempLanguage = this.currentLanguage;
      this.showLanguagePopup = true;
    },
    // 关闭语言选择器
    closeLanguagePopup() {
      this.showLanguagePopup = false;
    },
    // 选择语言
    selectLanguage(langCode) {
      this.tempLanguage = langCode;
    },
    // 确认语言选择
    confirmLanguageSelection() {
      if (this.tempLanguage !== this.currentLanguage) {
        this.currentLanguage = this.tempLanguage;
        i18n_index.setLanguage(this.currentLanguage);
        common_vendor.index.showToast({
          title: "语言已切换",
          icon: "success"
        });
      }
      this.closeLanguagePopup();
    },
    // 获取当前语言名称
    getCurrentLanguageName() {
      const lang = this.supportedLanguages.find((l) => l.code === this.currentLanguage);
      return lang ? lang.name : "简体中文";
    },
    // 显示服务器地址弹窗
    showServerModal() {
      this.serverAddress = utils_config.getServerUrl();
      this.showServerModalFlag = true;
      this.$nextTick(() => {
        setTimeout(() => {
          const input = this.$el.querySelector(".modal-dialog__input");
          if (input)
            input.focus();
        }, 350);
      });
    },
    // 关闭服务器地址弹窗
    closeServerModal() {
      this.showServerModalFlag = false;
      this.connectionTestResult = null;
    },
    // 测试服务器连通性
    async testServerConnection() {
      const url = this.serverAddress.trim();
      if (!url) {
        common_vendor.index.showToast({
          title: "请输入服务器地址",
          icon: "none"
        });
        return;
      }
      const urlPattern = /^(http|https):\/\/[^\s]+$/;
      if (!urlPattern.test(url)) {
        common_vendor.index.showToast({
          title: "请输入有效的URL地址",
          icon: "none"
        });
        return;
      }
      this.testingConnection = true;
      this.connectionTestResult = null;
      try {
        const response = await common_vendor.index.request({
          url: `${url}/api/scripts/loaded`,
          method: "GET",
          timeout: 1e4
        });
        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          const sourceCount = (response.data.data || []).length;
          this.connectionTestResult = {
            success: true,
            message: `连接成功，发现 ${sourceCount} 个音源`
          };
        } else if (response.statusCode === 404) {
          this.connectionTestResult = {
            success: false,
            message: "接口不存在，请确认服务器地址正确"
          };
        } else if (response.statusCode === 500) {
          this.connectionTestResult = {
            success: false,
            message: "服务器内部错误，请稍后重试"
          };
        } else if (response.statusCode === 401 || response.statusCode === 403) {
          this.connectionTestResult = {
            success: false,
            message: "无权限访问该服务器"
          };
        } else {
          this.connectionTestResult = {
            success: false,
            message: `服务器响应异常（状态码: ${response.statusCode || "未知"}）`
          };
        }
      } catch (error) {
        console.error("[设置] 测试服务器连通性失败:", error);
        let errorMessage = "连接失败，请检查网络";
        if (error.errMsg) {
          if (error.errMsg.includes("timeout")) {
            errorMessage = "连接超时，请检查服务器是否运行";
          } else if (error.errMsg.includes("fail") || error.errMsg.includes("error")) {
            errorMessage = "无法连接到服务器，请检查地址是否正确";
          } else if (error.errMsg.includes("network")) {
            errorMessage = "网络异常，请检查网络连接";
          }
        }
        this.connectionTestResult = {
          success: false,
          message: errorMessage
        };
      } finally {
        this.testingConnection = false;
      }
    },
    // 确认服务器地址
    confirmServerAddress() {
      const url = this.serverAddress.trim();
      if (!url) {
        common_vendor.index.showToast({
          title: "请输入服务器地址",
          icon: "none"
        });
        return;
      }
      const urlPattern = /^(http|https):\/\/[^\s]+$/;
      if (!urlPattern.test(url)) {
        common_vendor.index.showToast({
          title: "请输入有效的URL地址",
          icon: "none"
        });
        return;
      }
      const success = utils_config.setServerUrl(url);
      if (success) {
        common_vendor.index.showToast({
          title: "服务器地址已保存",
          icon: "success"
        });
        this.closeServerModal();
      } else {
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    },
    // 打开关于页面
    openAboutPage() {
      this.showAboutPopup = true;
    },
    // 关闭关于弹窗
    closeAboutPopup() {
      this.showAboutPopup = false;
    },
    // 打开更新弹窗
    openUpdatePopup(updateInfo) {
      this.updateInfo = updateInfo;
      this.showUpdatePopup = true;
    },
    // 关闭更新弹窗
    closeUpdatePopup() {
      this.showUpdatePopup = false;
      this.updateInfo = null;
    },
    // 忽略此版本
    ignoreUpdateVersion() {
      if (this.updateInfo && this.updateInfo.versionInfo) {
        utils_version.ignoreVersion(this.updateInfo.versionInfo.version);
        common_vendor.index.showToast({
          title: "已忽略此版本",
          icon: "success"
        });
      }
      this.closeUpdatePopup();
    },
    // 打开用户协议
    openUserAgreement() {
      this.pactAgreed = common_vendor.index.getStorageSync("isAgreePact") === "true";
      this.showUserAgreementPopup = true;
    },
    // 关闭用户协议弹窗
    closeUserAgreementPopup() {
      this.showUserAgreementPopup = false;
    },
    // 打开帮助与反馈
    openHelpAndFeedback() {
      common_vendor.index.showToast({
        title: "帮助与反馈开发中",
        icon: "none"
      });
    },
    // 检查更新
    async checkForUpdates() {
      console.log("[Settings] 检查更新...");
      common_vendor.index.showLoading({ title: "检查中..." });
      try {
        const result = await utils_version.checkUpdate(true);
        common_vendor.index.hideLoading();
        if (result.hasUpdate && result.versionInfo) {
          this.updateInfo = result;
          this.showUpdatePopup = true;
        } else {
          if (result.ignored) {
            common_vendor.index.showToast({
              title: "已是最新版本（已忽略）",
              icon: "success"
            });
          } else if (result.error) {
            common_vendor.index.showToast({
              title: result.error,
              icon: "none"
            });
          } else {
            common_vendor.index.showToast({
              title: "已是最新版本",
              icon: "success"
            });
          }
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        console.error("[Settings] 检查更新失败:", error);
        common_vendor.index.showToast({
          title: "检查更新失败",
          icon: "none"
        });
      }
    },
    // 切换评论弹幕
    toggleCommentDanmaku(e) {
      console.log("[Settings] 切换评论弹幕:", e.detail.value);
      this.showCommentDanmaku = e.detail.value;
      common_vendor.index.setStorageSync("showCommentDanmaku", this.showCommentDanmaku.toString());
      common_vendor.index.$emit("commentDanmakuChanged", this.showCommentDanmaku);
    },
    // 切换迷你播放器弹幕
    toggleMiniPlayerDanmaku(e) {
      console.log("[Settings] 切换迷你播放器弹幕:", e.detail.value);
      this.showMiniPlayerDanmaku = e.detail.value;
      common_vendor.index.setStorageSync("showMiniPlayerDanmaku", this.showMiniPlayerDanmaku.toString());
      common_vendor.index.$emit("miniPlayerDanmakuChanged", this.showMiniPlayerDanmaku);
    }
  }
};
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  const _component_UpdateModal = common_vendor.resolveComponent("UpdateModal");
  (_easycom_roc_icon_plus2 + _component_UpdateModal)();
}
const _easycom_roc_icon_plus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  _easycom_roc_icon_plus();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$options.isTablet
  }, !$options.isTablet ? {
    b: common_vendor.p({
      type: "fas",
      name: "chevron-left",
      size: "20",
      color: "#4b5563"
    }),
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args), "16")
  } : {}, {
    d: common_vendor.t($options.$t("settings.settings")),
    e: $options.isTablet ? 1 : "",
    f: $data.darkMode ? 1 : "",
    g: $options.isTablet ? 1 : "",
    h: common_vendor.s($options.navbarStyle),
    i: common_vendor.t($options.$t("settings.personalization")),
    j: common_vendor.p({
      type: "fas",
      name: "moon",
      size: "16",
      color: "#00d7cd"
    }),
    k: common_vendor.t($options.$t("settings.darkMode")),
    l: $data.darkMode,
    m: common_vendor.o((...args) => $options.toggleDarkMode && $options.toggleDarkMode(...args), "70"),
    n: common_vendor.p({
      type: "fas",
      name: "sync-alt",
      size: "16",
      color: "#00d7cd"
    }),
    o: common_vendor.t($options.$t("settings.followSystem")),
    p: $data.followSystem,
    q: common_vendor.o((...args) => $options.toggleFollowSystem && $options.toggleFollowSystem(...args), "6a"),
    r: common_vendor.p({
      type: "fas",
      name: "language",
      size: "16",
      color: "#00d7cd"
    }),
    s: common_vendor.t($options.$t("settings.language")),
    t: common_vendor.t($options.getCurrentLanguageName()),
    v: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    w: common_vendor.o((...args) => $options.showLanguageSelector && $options.showLanguageSelector(...args), "c7"),
    x: common_vendor.t($options.$t("settings.playbackSettings")),
    y: common_vendor.p({
      type: "fas",
      name: "comments",
      size: "16",
      color: "#00d7cd"
    }),
    z: $data.showCommentDanmaku,
    A: common_vendor.o((...args) => $options.toggleCommentDanmaku && $options.toggleCommentDanmaku(...args), "5b"),
    B: common_vendor.p({
      type: "fas",
      name: "desktop",
      size: "16",
      color: "#00d7cd"
    }),
    C: $data.showMiniPlayerDanmaku,
    D: common_vendor.o((...args) => $options.toggleMiniPlayerDanmaku && $options.toggleMiniPlayerDanmaku(...args), "0a"),
    E: common_vendor.p({
      type: "fas",
      name: "clock",
      size: "16",
      color: "#00d7cd"
    }),
    F: common_vendor.t($options.$t("settings.sleepTimer")),
    G: common_vendor.t($options.getSleepTimerDisplay()),
    H: common_vendor.t($options.getSleepTimerValue()),
    I: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    J: common_vendor.o((...args) => $options.showSleepTimerSelector && $options.showSleepTimerSelector(...args), "c3"),
    K: common_vendor.p({
      type: "fas",
      name: "database",
      size: "16",
      color: "#00d7cd"
    }),
    L: common_vendor.t($data.resourceCacheSize),
    M: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    N: common_vendor.o((...args) => $options.showResourceCache && $options.showResourceCache(...args), "1a"),
    O: common_vendor.p({
      type: "fas",
      name: "file-code",
      size: "16",
      color: "#00d7cd"
    }),
    P: common_vendor.t($data.metaCacheSize),
    Q: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    R: common_vendor.o((...args) => $options.showMetaCache && $options.showMetaCache(...args), "00"),
    S: common_vendor.t($options.$t("settings.sourceManagement")),
    T: common_vendor.p({
      type: "fas",
      name: "music",
      size: "16",
      color: "#00d7cd"
    }),
    U: common_vendor.t($options.$t("settings.sourceManagement")),
    V: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    W: common_vendor.o((...args) => $options.goToMusicSources && $options.goToMusicSources(...args), "18"),
    X: common_vendor.p({
      type: "fas",
      name: "server",
      size: "16",
      color: "#00d7cd"
    }),
    Y: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    Z: common_vendor.o((...args) => $options.showServerModal && $options.showServerModal(...args), "8c"),
    aa: common_vendor.p({
      type: "fas",
      name: "bug",
      size: "16",
      color: "#00d7cd"
    }),
    ab: $data.showDebugLog,
    ac: common_vendor.o((...args) => $options.toggleDebugLog && $options.toggleDebugLog(...args), "be"),
    ad: common_vendor.t($options.$t("settings.about")),
    ae: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#00d7cd"
    }),
    af: common_vendor.t($options.$t("settings.aboutCeladonMusic")),
    ag: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ah: common_vendor.o((...args) => $options.openAboutPage && $options.openAboutPage(...args), "42"),
    ai: common_vendor.p({
      type: "fas",
      name: "file-alt",
      size: "16",
      color: "#00d7cd"
    }),
    aj: common_vendor.t($options.$t("settings.userAgreement")),
    ak: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    al: common_vendor.o((...args) => $options.openUserAgreement && $options.openUserAgreement(...args), "b8"),
    am: common_vendor.p({
      type: "fas",
      name: "question-circle",
      size: "16",
      color: "#00d7cd"
    }),
    an: common_vendor.t($options.$t("settings.helpAndFeedback")),
    ao: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ap: common_vendor.o((...args) => $options.openHelpAndFeedback && $options.openHelpAndFeedback(...args), "ff"),
    aq: common_vendor.p({
      type: "fas",
      name: "sync",
      size: "16",
      color: "#00d7cd"
    }),
    ar: common_vendor.t($options.$t("settings.checkForUpdates")),
    as: common_vendor.t($data.appVersion),
    at: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    av: common_vendor.o((...args) => $options.checkForUpdates && $options.checkForUpdates(...args), "2e"),
    aw: common_vendor.t($options.$t("app.name")),
    ax: common_vendor.t($options.$t("app.slogan")),
    ay: $data.showLanguagePopup
  }, $data.showLanguagePopup ? {
    az: common_vendor.t($options.$t("settings.selectLanguage")),
    aA: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    aB: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args), "c5"),
    aC: common_vendor.f($data.supportedLanguages, (lang, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(lang.name),
        b: $data.currentLanguage === lang.code
      }, $data.currentLanguage === lang.code ? {
        c: "45854c89-27-" + i0,
        d: common_vendor.p({
          type: "fas",
          name: "check",
          size: "16",
          color: "#00d7cd"
        })
      } : {}, {
        e: lang.code,
        f: $data.currentLanguage === lang.code ? 1 : "",
        g: common_vendor.o(($event) => $options.selectLanguage(lang.code), lang.code)
      });
    }),
    aD: common_vendor.t($options.$t("common.confirm")),
    aE: common_vendor.o((...args) => $options.confirmLanguageSelection && $options.confirmLanguageSelection(...args), "88"),
    aF: $options.isTablet ? $options.tabletModalSafeTop : "",
    aG: common_vendor.o(() => {
    }, "19"),
    aH: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args), "67")
  } : {}, {
    aI: $data.showSleepTimerPopup
  }, $data.showSleepTimerPopup ? common_vendor.e({
    aJ: common_vendor.t($options.$t("settings.sleepTimer")),
    aK: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    aL: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "9e"),
    aM: $data.sleepTimerRemaining > 0
  }, $data.sleepTimerRemaining > 0 ? {
    aN: common_vendor.t($options.formatSleepTimerRemaining),
    aO: common_vendor.o((...args) => $options.cancelSleepTimer && $options.cancelSleepTimer(...args), "68")
  } : {}, {
    aP: common_vendor.f($options.hourOptions, (hour, index, i0) => {
      return {
        a: common_vendor.t(hour),
        b: index
      };
    }),
    aQ: common_vendor.f($options.minuteOptions, (minute, index, i0) => {
      return {
        a: common_vendor.t(minute),
        b: index
      };
    }),
    aR: $data.sleepTimerPickerValue,
    aS: common_vendor.o((...args) => $options.onSleepTimerPickerChange && $options.onSleepTimerPickerChange(...args), "b2"),
    aT: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "25"),
    aU: common_vendor.o((...args) => $options.confirmSleepTimerSelection && $options.confirmSleepTimerSelection(...args), "6e"),
    aV: $options.isTablet ? $options.tabletModalSafeTop : "",
    aW: common_vendor.o(() => {
    }, "82"),
    aX: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "45")
  }) : {}, {
    aY: $data.showServerModalFlag
  }, $data.showServerModalFlag ? common_vendor.e({
    aZ: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    ba: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "81"),
    bb: $data.serverAddress,
    bc: common_vendor.o(($event) => $data.serverAddress = $event.detail.value, "f6"),
    bd: $data.connectionTestResult
  }, $data.connectionTestResult ? {
    be: common_vendor.p({
      type: "fas",
      name: $data.connectionTestResult.success ? "check-circle" : "times-circle",
      size: "16",
      color: $data.connectionTestResult.success ? "#10b981" : "#ef4444"
    }),
    bf: common_vendor.n($data.connectionTestResult.success ? "success" : "error"),
    bg: common_vendor.t($data.connectionTestResult.message),
    bh: common_vendor.n($data.connectionTestResult.success ? "success" : "error")
  } : {}, {
    bi: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "c2"),
    bj: $data.testingConnection
  }, $data.testingConnection ? {
    bk: common_vendor.p({
      type: "fas",
      name: "spinner",
      size: "14",
      color: "#6b7280"
    })
  } : {}, {
    bl: common_vendor.t($data.testingConnection ? "测试中..." : "测试"),
    bm: $data.testingConnection || !$data.serverAddress.trim() ? 1 : "",
    bn: common_vendor.o((...args) => $options.testServerConnection && $options.testServerConnection(...args), "6c"),
    bo: common_vendor.o((...args) => $options.confirmServerAddress && $options.confirmServerAddress(...args), "f6"),
    bp: $options.isTablet ? $options.tabletModalSafeTop : "",
    bq: common_vendor.o(() => {
    }, "72"),
    br: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "ae")
  }) : {}, {
    bs: $data.showResourceCachePopup
  }, $data.showResourceCachePopup ? {
    bt: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    bv: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args), "92"),
    bw: common_vendor.t($data.resourceCacheSize),
    bx: common_vendor.t($data.appCacheSize),
    by: common_vendor.t($data.musicUrlCacheSize),
    bz: common_vendor.t($data.musicUrlCacheCount),
    bA: common_vendor.t($data.audioFileCacheSize),
    bB: common_vendor.t($data.cleaningResourceCache ? "清理中..." : "清理缓存"),
    bC: $data.cleaningResourceCache ? 1 : "",
    bD: common_vendor.o((...args) => $options.cleanResourceCache && $options.cleanResourceCache(...args), "b7"),
    bE: $options.isTablet ? $options.tabletModalSafeTop : "",
    bF: common_vendor.o(() => {
    }, "e6"),
    bG: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args), "bc")
  } : {}, {
    bH: $data.showMetaCachePopup
  }, $data.showMetaCachePopup ? {
    bI: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    bJ: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args), "57"),
    bK: common_vendor.t($data.metaCacheSize),
    bL: common_vendor.t($data.otherSourceCacheSize),
    bM: common_vendor.t($data.lyricCacheSize),
    bN: common_vendor.t($data.cleaningOtherSource ? "清理中..." : "清理换源歌曲缓存"),
    bO: $data.cleaningOtherSource ? 1 : "",
    bP: common_vendor.o((...args) => $options.cleanOtherSourceCache && $options.cleanOtherSourceCache(...args), "7e"),
    bQ: common_vendor.t($data.cleaningLyric ? "清理中..." : "清理歌词缓存"),
    bR: $data.cleaningLyric ? 1 : "",
    bS: common_vendor.o((...args) => $options.cleanLyricCache && $options.cleanLyricCache(...args), "cd"),
    bT: $options.isTablet ? $options.tabletModalSafeTop : "",
    bU: common_vendor.o(() => {
    }, "0a"),
    bV: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args), "d1")
  } : {}, {
    bW: $data.showAboutPopup
  }, $data.showAboutPopup ? {
    bX: common_vendor.p({
      type: "fas",
      name: "wave-square",
      size: "20",
      color: "#ffffff"
    }),
    bY: common_vendor.t($data.appVersion),
    bZ: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args), "ca"),
    ca: common_vendor.o(() => {
    }, "ab"),
    cb: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args), "2a")
  } : {}, {
    cc: $data.showUserAgreementPopup
  }, $data.showUserAgreementPopup ? common_vendor.e({
    cd: $data.pactAgreed
  }, $data.pactAgreed ? {
    ce: common_vendor.p({
      type: "fas",
      name: "check-circle",
      size: "14",
      color: "#10b981"
    })
  } : {}, {
    cf: $data.pactAgreed
  }, $data.pactAgreed ? {
    cg: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#00d7cd"
    }),
    ch: common_vendor.t($options.pactAgreedTime)
  } : {}, {
    ci: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args), "0b"),
    cj: common_vendor.o(() => {
    }, "7f"),
    ck: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args), "e9")
  }) : {}, {
    cl: common_vendor.o($options.closeUpdatePopup, "e5"),
    cm: common_vendor.p({
      visible: $data.showUpdatePopup,
      ["update-info"]: $data.updateInfo,
      ["dark-mode"]: $data.darkMode
    }),
    cn: $data.darkMode ? 1 : "",
    co: $options.isTablet ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
exports.MiniProgramPage = MiniProgramPage;
