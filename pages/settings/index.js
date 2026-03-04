"use strict";
const common_vendor = require("../../common/vendor.js");
const i18n_index = require("../../i18n/index.js");
const utils_system = require("../../utils/system.js");
const utils_i18n = require("../../utils/i18n.js");
const utils_config = require("../../utils/config.js");
const utils_version = require("../../utils/version.js");
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  components: {
    RocIconPlus
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
      resourceCacheSize: "计算中...",
      appCacheSize: "0KB",
      musicUrlCacheSize: "0KB",
      musicUrlCacheCount: 0,
      metaCacheSize: "0KB",
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
      tempLanguage: ""
    };
  },
  computed: {
    navbarStyle() {
      return {
        paddingTop: `${this.statusBarHeight}px`
      };
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
  },
  beforeUnmount() {
  },
  async onShow() {
    utils_system.setStatusBarTextColor("black");
    common_vendor.index.$on("systemThemeChange", this.handleSystemThemeChange);
    console.log("[Settings] onShow: 已注册主题变化监听");
    common_vendor.index.$on("sleepTimerUpdate", this.handleSleepTimerUpdate);
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
    common_vendor.index.$off("systemThemeChange", this.handleSystemThemeChange);
    console.log("[Settings] onHide: 已移除主题变化监听");
    common_vendor.index.$off("sleepTimerUpdate", this.handleSleepTimerUpdate);
  },
  methods: {
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
      this.followSystem = common_vendor.index.getStorageSync("followSystem") !== "false";
      const storedDanmaku = common_vendor.index.getStorageSync("showCommentDanmaku");
      this.showCommentDanmaku = storedDanmaku === "" || storedDanmaku === null ? true : storedDanmaku === "true";
      const storedMiniDanmaku = common_vendor.index.getStorageSync("showMiniPlayerDanmaku");
      this.showMiniPlayerDanmaku = storedMiniDanmaku === "true";
      const versionInfo = utils_system.getAppVersion();
      this.appVersion = "v" + versionInfo.version;
      this.$nextTick(() => {
        setTimeout(() => {
          this.getCacheSize();
        }, 300);
      });
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
      common_vendor.index.navigateTo({
        url: "/pages/music-sources/index"
      });
    },
    // 切换青釉主题
    toggleCeladonTheme(e) {
      this.celadonTheme = e.detail.value;
      common_vendor.index.setStorageSync("celadonTheme", this.celadonTheme.toString());
      this.applyTheme();
    },
    // 切换夜间模式
    toggleDarkMode(e) {
      this.darkMode = e.detail.value;
      common_vendor.index.setStorageSync("darkMode", this.darkMode.toString());
      if (this.darkMode) {
        this.followSystem = false;
        common_vendor.index.setStorageSync("followSystem", "false");
      }
      this.applyTheme();
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
    // 处理系统主题变化事件（来自App.vue）
    handleSystemThemeChange(data) {
      console.log("[Settings] 收到系统主题变化事件:", data);
      if (this.followSystem) {
        console.log("[Settings] 当前处于跟随系统模式，更新主题");
        this.darkMode = data.isDark;
        common_vendor.index.setStorageSync("darkMode", this.darkMode.toString());
        console.log("[Settings] 已更新 darkMode:", this.darkMode);
      } else {
        console.log("[Settings] 当前不处于跟随系统模式，忽略主题变化");
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
        resolve("0");
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
      this.getResourceCacheSize();
      this.showResourceCachePopup = true;
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
      this.getMetaCacheInfo();
      this.showMetaCachePopup = true;
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
    // 复制下载链接
    copyUpdateUrl() {
      if (this.updateInfo && this.updateInfo.versionInfo) {
        const url = this.updateInfo.versionInfo.downloadUrl || this.updateInfo.versionInfo.releaseUrl || "";
        if (url) {
          common_vendor.index.setClipboardData({
            data: url,
            success: () => {
              common_vendor.index.showToast({
                title: "链接已复制",
                icon: "success"
              });
            }
          });
        }
      }
      this.closeUpdatePopup();
    },
    // 打开项目地址
    openProjectUrl() {
      if (this.updateInfo && this.updateInfo.versionInfo) {
        const url = this.updateInfo.versionInfo.projectUrl || "https://github.com/erikjamesgz/phg-music";
        common_vendor.index.setClipboardData({
          data: url,
          success: () => {
            common_vendor.index.showToast({
              title: "链接已复制，请到浏览器打开",
              icon: "none",
              duration: 3e3
            });
          }
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
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  _easycom_roc_icon_plus();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      type: "fas",
      name: "chevron-left",
      size: "20",
      color: "#4b5563"
    }),
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($options.$t("settings.settings")),
    d: $data.darkMode ? 1 : "",
    e: common_vendor.s($options.navbarStyle),
    f: common_vendor.t($options.$t("settings.personalization")),
    g: common_vendor.p({
      type: "fas",
      name: "moon",
      size: "16",
      color: "#00d7cd"
    }),
    h: common_vendor.t($options.$t("settings.darkMode")),
    i: $data.darkMode,
    j: common_vendor.o((...args) => $options.toggleDarkMode && $options.toggleDarkMode(...args)),
    k: common_vendor.p({
      type: "fas",
      name: "sync-alt",
      size: "16",
      color: "#00d7cd"
    }),
    l: common_vendor.t($options.$t("settings.followSystem")),
    m: $data.followSystem,
    n: common_vendor.o((...args) => $options.toggleFollowSystem && $options.toggleFollowSystem(...args)),
    o: common_vendor.p({
      type: "fas",
      name: "language",
      size: "16",
      color: "#00d7cd"
    }),
    p: common_vendor.t($options.$t("settings.language")),
    q: common_vendor.t($options.getCurrentLanguageName()),
    r: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    s: common_vendor.o((...args) => $options.showLanguageSelector && $options.showLanguageSelector(...args)),
    t: common_vendor.t($options.$t("settings.playbackSettings")),
    v: common_vendor.p({
      type: "fas",
      name: "comments",
      size: "16",
      color: "#00d7cd"
    }),
    w: $data.showCommentDanmaku,
    x: common_vendor.o((...args) => $options.toggleCommentDanmaku && $options.toggleCommentDanmaku(...args)),
    y: common_vendor.p({
      type: "fas",
      name: "desktop",
      size: "16",
      color: "#00d7cd"
    }),
    z: $data.showMiniPlayerDanmaku,
    A: common_vendor.o((...args) => $options.toggleMiniPlayerDanmaku && $options.toggleMiniPlayerDanmaku(...args)),
    B: common_vendor.p({
      type: "fas",
      name: "clock",
      size: "16",
      color: "#00d7cd"
    }),
    C: common_vendor.t($options.$t("settings.sleepTimer")),
    D: common_vendor.t($options.getSleepTimerDisplay()),
    E: common_vendor.t($options.getSleepTimerValue()),
    F: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    G: common_vendor.o((...args) => $options.showSleepTimerSelector && $options.showSleepTimerSelector(...args)),
    H: common_vendor.p({
      type: "fas",
      name: "database",
      size: "16",
      color: "#00d7cd"
    }),
    I: common_vendor.t($data.resourceCacheSize),
    J: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    K: common_vendor.o((...args) => $options.showResourceCache && $options.showResourceCache(...args)),
    L: common_vendor.p({
      type: "fas",
      name: "file-code",
      size: "16",
      color: "#00d7cd"
    }),
    M: common_vendor.t($data.metaCacheSize),
    N: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    O: common_vendor.o((...args) => $options.showMetaCache && $options.showMetaCache(...args)),
    P: common_vendor.t($options.$t("settings.sourceManagement")),
    Q: common_vendor.p({
      type: "fas",
      name: "music",
      size: "16",
      color: "#00d7cd"
    }),
    R: common_vendor.t($options.$t("settings.sourceManagement")),
    S: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    T: common_vendor.o((...args) => $options.goToMusicSources && $options.goToMusicSources(...args)),
    U: common_vendor.p({
      type: "fas",
      name: "server",
      size: "16",
      color: "#00d7cd"
    }),
    V: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    W: common_vendor.o((...args) => $options.showServerModal && $options.showServerModal(...args)),
    X: common_vendor.t($options.$t("settings.about")),
    Y: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#00d7cd"
    }),
    Z: common_vendor.t($options.$t("settings.aboutCeladonMusic")),
    aa: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ab: common_vendor.o((...args) => $options.openAboutPage && $options.openAboutPage(...args)),
    ac: common_vendor.p({
      type: "fas",
      name: "file-alt",
      size: "16",
      color: "#00d7cd"
    }),
    ad: common_vendor.t($options.$t("settings.userAgreement")),
    ae: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    af: common_vendor.o((...args) => $options.openUserAgreement && $options.openUserAgreement(...args)),
    ag: common_vendor.p({
      type: "fas",
      name: "question-circle",
      size: "16",
      color: "#00d7cd"
    }),
    ah: common_vendor.t($options.$t("settings.helpAndFeedback")),
    ai: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    aj: common_vendor.o((...args) => $options.openHelpAndFeedback && $options.openHelpAndFeedback(...args)),
    ak: common_vendor.p({
      type: "fas",
      name: "sync",
      size: "16",
      color: "#00d7cd"
    }),
    al: common_vendor.t($options.$t("settings.checkForUpdates")),
    am: common_vendor.t($data.appVersion),
    an: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ao: common_vendor.o((...args) => $options.checkForUpdates && $options.checkForUpdates(...args)),
    ap: common_vendor.t($options.$t("app.name")),
    aq: common_vendor.t($options.$t("app.slogan")),
    ar: $data.showLanguagePopup
  }, $data.showLanguagePopup ? {
    as: common_vendor.t($options.$t("settings.selectLanguage")),
    at: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    av: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args)),
    aw: common_vendor.f($data.supportedLanguages, (lang, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(lang.name),
        b: $data.currentLanguage === lang.code
      }, $data.currentLanguage === lang.code ? {
        c: "45854c89-26-" + i0,
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
    ax: common_vendor.t($options.$t("common.confirm")),
    ay: common_vendor.o((...args) => $options.confirmLanguageSelection && $options.confirmLanguageSelection(...args)),
    az: common_vendor.o(() => {
    }),
    aA: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args))
  } : {}, {
    aB: $data.showSleepTimerPopup
  }, $data.showSleepTimerPopup ? common_vendor.e({
    aC: common_vendor.t($options.$t("settings.sleepTimer")),
    aD: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    aE: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args)),
    aF: $data.sleepTimerRemaining > 0
  }, $data.sleepTimerRemaining > 0 ? {
    aG: common_vendor.t($options.formatSleepTimerRemaining),
    aH: common_vendor.o((...args) => $options.cancelSleepTimer && $options.cancelSleepTimer(...args))
  } : {}, {
    aI: common_vendor.f($options.hourOptions, (hour, index, i0) => {
      return {
        a: common_vendor.t(hour),
        b: index
      };
    }),
    aJ: common_vendor.f($options.minuteOptions, (minute, index, i0) => {
      return {
        a: common_vendor.t(minute),
        b: index
      };
    }),
    aK: $data.sleepTimerPickerValue,
    aL: common_vendor.o((...args) => $options.onSleepTimerPickerChange && $options.onSleepTimerPickerChange(...args)),
    aM: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args)),
    aN: common_vendor.o((...args) => $options.confirmSleepTimerSelection && $options.confirmSleepTimerSelection(...args)),
    aO: common_vendor.o(() => {
    }),
    aP: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args))
  }) : {}, {
    aQ: $data.showServerModalFlag
  }, $data.showServerModalFlag ? common_vendor.e({
    aR: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    aS: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args)),
    aT: $data.serverAddress,
    aU: common_vendor.o(($event) => $data.serverAddress = $event.detail.value),
    aV: $data.connectionTestResult
  }, $data.connectionTestResult ? {
    aW: common_vendor.p({
      type: "fas",
      name: $data.connectionTestResult.success ? "check-circle" : "times-circle",
      size: "16",
      color: $data.connectionTestResult.success ? "#10b981" : "#ef4444"
    }),
    aX: common_vendor.n($data.connectionTestResult.success ? "success" : "error"),
    aY: common_vendor.t($data.connectionTestResult.message),
    aZ: common_vendor.n($data.connectionTestResult.success ? "success" : "error")
  } : {}, {
    ba: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args)),
    bb: $data.testingConnection
  }, $data.testingConnection ? {
    bc: common_vendor.p({
      type: "fas",
      name: "spinner",
      size: "14",
      color: "#6b7280"
    })
  } : {}, {
    bd: common_vendor.t($data.testingConnection ? "测试中..." : "测试"),
    be: $data.testingConnection || !$data.serverAddress.trim() ? 1 : "",
    bf: common_vendor.o((...args) => $options.testServerConnection && $options.testServerConnection(...args)),
    bg: common_vendor.o((...args) => $options.confirmServerAddress && $options.confirmServerAddress(...args)),
    bh: common_vendor.o(() => {
    }),
    bi: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args))
  }) : {}, {
    bj: $data.showResourceCachePopup
  }, $data.showResourceCachePopup ? {
    bk: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    bl: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args)),
    bm: common_vendor.t($data.resourceCacheSize),
    bn: common_vendor.t($data.appCacheSize),
    bo: common_vendor.t($data.musicUrlCacheSize),
    bp: common_vendor.t($data.musicUrlCacheCount),
    bq: common_vendor.t($data.audioFileCacheSize),
    br: common_vendor.t($data.cleaningResourceCache ? "清理中..." : "清理缓存"),
    bs: $data.cleaningResourceCache ? 1 : "",
    bt: common_vendor.o((...args) => $options.cleanResourceCache && $options.cleanResourceCache(...args)),
    bv: common_vendor.o(() => {
    }),
    bw: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args))
  } : {}, {
    bx: $data.showMetaCachePopup
  }, $data.showMetaCachePopup ? {
    by: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#6b7280"
    }),
    bz: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args)),
    bA: common_vendor.t($data.metaCacheSize),
    bB: common_vendor.t($data.otherSourceCacheSize),
    bC: common_vendor.t($data.lyricCacheSize),
    bD: common_vendor.t($data.cleaningOtherSource ? "清理中..." : "清理换源歌曲缓存"),
    bE: $data.cleaningOtherSource ? 1 : "",
    bF: common_vendor.o((...args) => $options.cleanOtherSourceCache && $options.cleanOtherSourceCache(...args)),
    bG: common_vendor.t($data.cleaningLyric ? "清理中..." : "清理歌词缓存"),
    bH: $data.cleaningLyric ? 1 : "",
    bI: common_vendor.o((...args) => $options.cleanLyricCache && $options.cleanLyricCache(...args)),
    bJ: common_vendor.o(() => {
    }),
    bK: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args))
  } : {}, {
    bL: $data.showAboutPopup
  }, $data.showAboutPopup ? {
    bM: common_vendor.p({
      type: "fas",
      name: "leaf",
      size: "20",
      color: "#ffffff"
    }),
    bN: common_vendor.t($data.appVersion),
    bO: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args)),
    bP: common_vendor.o(() => {
    }),
    bQ: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args))
  } : {}, {
    bR: $data.showUserAgreementPopup
  }, $data.showUserAgreementPopup ? common_vendor.e({
    bS: $data.pactAgreed
  }, $data.pactAgreed ? {
    bT: common_vendor.p({
      type: "fas",
      name: "check-circle",
      size: "14",
      color: "#10b981"
    })
  } : {}, {
    bU: $data.pactAgreed
  }, $data.pactAgreed ? {
    bV: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#00d7cd"
    }),
    bW: common_vendor.t($options.pactAgreedTime)
  } : {}, {
    bX: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args)),
    bY: common_vendor.o(() => {
    }),
    bZ: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args))
  }) : {}, {
    ca: $data.showUpdatePopup
  }, $data.showUpdatePopup ? {
    cb: common_vendor.p({
      type: "fas",
      name: "leaf",
      size: "20",
      color: "#ffffff"
    }),
    cc: common_vendor.t($data.updateInfo ? $data.updateInfo.versionInfo.version : ""),
    cd: common_vendor.t($data.updateInfo ? $data.updateInfo.currentVersion : ""),
    ce: common_vendor.t($data.updateInfo ? $data.updateInfo.versionInfo.version : ""),
    cf: common_vendor.t($data.updateInfo ? $data.updateInfo.versionInfo.desc : ""),
    cg: common_vendor.o((...args) => $options.closeUpdatePopup && $options.closeUpdatePopup(...args)),
    ch: common_vendor.o((...args) => $options.openProjectUrl && $options.openProjectUrl(...args)),
    ci: common_vendor.o((...args) => $options.ignoreUpdateVersion && $options.ignoreUpdateVersion(...args)),
    cj: $data.darkMode ? 1 : ""
  } : {}, {
    ck: $data.darkMode ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
