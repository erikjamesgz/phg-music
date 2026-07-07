"use strict";
const common_vendor = require("./common/vendor.js");
const i18n_index = require("./i18n/index.js");
const utils_system = require("./utils/system.js");
const utils_i18n = require("./utils/i18n.js");
const utils_config = require("./utils/config.js");
const utils_version = require("./utils/version.js");
const composables_useBottomHeight = require("./composables/useBottomHeight.js");
const composables_useGlobalBottomHeight = require("./composables/useGlobalBottomHeight.js");
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
      showBackButton: false,
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
      // ========== AI API配置 ==========
      showAIApiModal: false,
      activePlatform: "backend",
      // 当前选中的平台：backend / deepseek / openai / siliconflow / custom
      apiConfig: {
        provider: "backend",
        // 当前使用的平台
        apiKey: "",
        // API密钥
        baseURL: "",
        // API地址
        model: ""
        // 模型名称
      },
      // 平台预设配置
      platformPresets: {
        backend: {
          label: "默认后端",
          iconName: "server",
          defaultBaseURL: "/api/ai/chat",
          defaultModel: "",
          desc: "使用您配置的服务器AI接口，无需额外配置"
        },
        deepseek: {
          label: "DeepSeek",
          iconName: "brain",
          defaultBaseURL: "https://api.deepseek.com",
          defaultModel: "deepseek-chat",
          desc: "高性价比，适合中文场景"
        },
        openai: {
          label: "OpenAI",
          iconName: "microchip",
          defaultBaseURL: "https://api.openai.com/v1",
          defaultModel: "gpt-4o-mini",
          desc: "业界标杆，功能强大"
        },
        siliconflow: {
          label: "硅基流动",
          iconName: "bolt",
          defaultBaseURL: "https://api.siliconflow.cn/v1",
          defaultModel: "deepseek-ai/DeepSeek-V3",
          desc: "国产平台，免费额度多"
        },
        custom: {
          label: "自定义",
          iconName: "gear",
          defaultBaseURL: "",
          defaultModel: "",
          desc: "支持任意兼容OpenAI的API"
        }
      },
      currentApiUrl: "",
      currentApiKey: "",
      currentModelName: "",
      showApiKey: false,
      // 是否显示明文密钥
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
      localIsTablet: false,
      // 底部安全高度（用于平板模式下避免被miniplayer遮挡）
      totalBottomHeight: 0,
      isMiniPlayerVisible: false
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
    // 是否已配置API密钥
    hasConfiguredApiKeys() {
      return !!(this.apiConfig && this.apiConfig.apiKey);
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
    this.initBottomHeight();
    common_vendor.index.$on("systemThemeChange", this.handleSystemThemeChange);
    common_vendor.index.$on("themeChanged", this.handleThemeChanged);
    console.log("[Settings] created: 已注册主题变化监听");
  },
  // onLoad 接收页面参数，比 getCurrentPages().options 更可靠（兼容老旧设备）
  onLoad(options) {
    if (options && options.showAiConfig === "true") {
      console.log("[Settings] onLoad: 检测到showAiConfig参数");
      this.showBackButton = true;
      this._needOpenAIApiConfig = true;
    }
  },
  beforeUnmount() {
    common_vendor.index.$off("systemThemeChange", this.handleSystemThemeChange);
    common_vendor.index.$off("themeChanged", this.handleThemeChanged);
    if (this._bottomHeightUnwatch) {
      this._bottomHeightUnwatch();
    }
    console.log("[Settings] beforeUnmount: 已移除监听");
  },
  async onShow() {
    console.log("[Settings] onShow: 页面显示");
    let needOpenAIApiConfig = this._needOpenAIApiConfig;
    if (!needOpenAIApiConfig) {
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.options && currentPage.options.showAiConfig === "true") {
          needOpenAIApiConfig = true;
          this.showBackButton = true;
        }
      } catch (e) {
        console.log("[Settings] getCurrentPages 兜底获取参数失败", e);
      }
    }
    if (needOpenAIApiConfig) {
      console.log("[Settings] 检测到showAiConfig参数，自动打开AI配置弹窗");
      this._needOpenAIApiConfig = false;
      setTimeout(() => {
        this.showAIApiConfig();
      }, 500);
    }
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
    this.loadAIApiConfig();
  },
  onHide() {
    console.log("[Settings] onHide: 页面隐藏");
    common_vendor.index.$off("sleepTimerUpdate", this.handleSleepTimerUpdate);
  },
  methods: {
    // ========== 底部安全高度相关方法 ==========
    // 初始化底部安全高度
    initBottomHeight() {
      try {
        const { totalBottomHeight, isMiniPlayerVisible } = composables_useBottomHeight.useBottomHeight();
        this.totalBottomHeight = totalBottomHeight.value || 0;
        this.isMiniPlayerVisible = isMiniPlayerVisible.value || false;
        if (this._bottomHeightUnwatch) {
          this._bottomHeightUnwatch();
        }
        this._bottomHeightUnwatch = common_vendor.watch(composables_useGlobalBottomHeight.globalBottomHeight.totalBottomHeight, (val) => {
          this.totalBottomHeight = val || 0;
        });
        console.log("[Settings] 初始化底部安全高度:", {
          totalBottomHeight: this.totalBottomHeight,
          isMiniPlayerVisible: this.isMiniPlayerVisible
        });
      } catch (e) {
        console.error("[Settings] 初始化底部安全高度失败:", e);
        this.totalBottomHeight = 0;
        this.isMiniPlayerVisible = false;
      }
    },
    // 获取平板模式弹窗的完整样式（参考MusicToggleModal：弹窗延伸到屏幕底部，footer通过padding-bottom避让MiniPlayer）
    getTabletModalStyle() {
      if (!this.isTablet)
        return { paddingTop: "0px" };
      return {
        paddingTop: this.tabletModalSafeTop,
        height: "100vh",
        maxHeight: "100vh"
      };
    },
    // 获取弹窗body高度（scroll-view需要显式高度才能滚动）
    getModalBodyStyle() {
      if (this.isTablet) {
        return {
          height: "100%"
        };
      }
      return {
        height: "calc(85vh - 180px)",
        maxHeight: "calc(85vh - 180px)"
      };
    },
    // 获取平板模式弹窗footer样式（通过padding-bottom避让MiniPlayer，参考MusicToggleModal的confirm-btn margin-bottom）
    getModalFooterStyle() {
      if (!this.isTablet)
        return {};
      const bottomHeight = this.totalBottomHeight || 0;
      return {
        paddingBottom: `${12 + bottomHeight}px`
      };
    },
    // ========== AI API配置相关方法 ==========
    // 加载已保存的AI API配置
    loadAIApiConfig() {
      try {
        const savedConfig = common_vendor.index.getStorageSync("aiApiConfig");
        if (savedConfig) {
          this.apiConfig = {
            provider: savedConfig.provider || "deepseek",
            apiKey: savedConfig.apiKey || "",
            baseURL: savedConfig.baseURL || "",
            model: savedConfig.model || ""
          };
          this.activePlatform = this.apiConfig.provider;
          console.log("[Settings] ✅ 已加载AI API配置:", {
            平台: this.apiConfig.provider,
            已配置密钥: !!this.apiConfig.apiKey
          });
        }
      } catch (e) {
        console.error("[Settings] ❌ 加载AI API配置失败:", e);
      }
    },
    // 显示AI API配置弹窗
    // 处理智能推荐点击
    showAIApiConfig() {
      console.log("[Settings] 打开AI API配置弹窗");
      this.showAIApiModal = true;
      this.activePlatform = this.apiConfig.provider || "backend";
      this.updateCurrentInputFields();
    },
    // 关闭AI API配置弹窗
    closeAIApiModal() {
      this.showAIApiModal = false;
      this.showApiKey = false;
    },
    // 选择平台
    selectPlatform(platform) {
      console.log("[Settings] 选择平台:", platform);
      this.activePlatform = platform;
      this.updateCurrentInputFields();
    },
    // 更新当前输入框的内容
    updateCurrentInputFields() {
      const preset = this.platformPresets[this.activePlatform];
      if (preset) {
        if (this.activePlatform === this.apiConfig.provider) {
          this.currentApiUrl = this.apiConfig.baseURL || preset.defaultBaseURL || "";
          this.currentApiKey = this.apiConfig.apiKey || "";
          this.currentModelName = this.apiConfig.model || preset.defaultModel || "";
        } else {
          this.currentApiUrl = preset.defaultBaseURL || "";
          this.currentApiKey = "";
          this.currentModelName = preset.defaultModel || "";
        }
      }
    },
    // 获取当前平台的标签
    getActivePlatformLabel() {
      const preset = this.platformPresets[this.activePlatform];
      return preset ? preset.label : "API";
    },
    // 获取API地址占位符
    getApiUrlPlaceholder() {
      const preset = this.platformPresets[this.activePlatform];
      if (this.activePlatform === "custom") {
        return "请输入API地址（如：https://api.example.com/v1）";
      }
      return preset ? preset.defaultBaseURL || "请输入API地址" : "请输入API地址";
    },
    // 获取模型名称占位符
    getModelPlaceholder() {
      const preset = this.platformPresets[this.activePlatform];
      if (this.activePlatform === "custom") {
        return "如：gpt-4、claude-3等";
      }
      return preset ? preset.defaultModel || "请选择模型" : "请选择模型";
    },
    // 保存当前平台的配置
    saveCurrentApiConfig() {
      var _a;
      if (!this.activePlatform) {
        common_vendor.index.showToast({ title: "请先选择平台", icon: "none" });
        return;
      }
      const isBackendMode = this.activePlatform === "backend";
      if (!isBackendMode) {
        if (!this.currentApiUrl.trim()) {
          common_vendor.index.showToast({ title: "请输入API地址", icon: "none" });
          return;
        }
        if (!this.currentApiKey.trim()) {
          common_vendor.index.showToast({ title: "请输入API密钥", icon: "none" });
          return;
        }
        if (!this.currentModelName.trim()) {
          common_vendor.index.showToast({ title: "请输入模型名称", icon: "none" });
          return;
        }
      }
      try {
        const newConfig = {
          provider: this.activePlatform,
          baseURL: isBackendMode ? "/api/ai/chat" : this.currentApiUrl.trim(),
          apiKey: isBackendMode ? "" : this.currentApiKey.trim(),
          model: isBackendMode ? "" : this.currentModelName.trim() || ((_a = this.platformPresets[this.activePlatform]) == null ? void 0 : _a.defaultModel) || ""
        };
        common_vendor.index.setStorageSync("aiApiConfig", newConfig);
        this.apiConfig = newConfig;
        console.log("[Settings] ✅ AI API配置已保存:", {
          平台: newConfig.provider,
          地址: newConfig.baseURL,
          模型: newConfig.model
        });
        this.closeAIApiModal();
        common_vendor.index.showToast({
          title: "配置已保存",
          icon: "success",
          duration: 1500
        });
      } catch (e) {
        console.error("[Settings] ❌ 保存AI API配置失败:", e);
        common_vendor.index.showToast({ title: "保存失败，请重试", icon: "error" });
      }
    },
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
    a: !$options.isTablet || $data.showBackButton
  }, !$options.isTablet || $data.showBackButton ? {
    b: common_vendor.p({
      type: "fas",
      name: "chevron-left",
      size: "20",
      color: "#4b5563"
    }),
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args), "0a")
  } : {}, {
    d: common_vendor.t($options.$t("settings.settings")),
    e: $options.isTablet && !$data.showBackButton ? 1 : "",
    f: $data.darkMode ? 1 : "",
    g: $options.isTablet ? 1 : "",
    h: common_vendor.s($options.navbarStyle),
    i: common_vendor.t($options.$t("settings.personalization")),
    j: common_vendor.p({
      type: "fas",
      name: "moon",
      size: "16",
      color: "#e2e8f0"
    }),
    k: common_vendor.t($options.$t("settings.darkMode")),
    l: $data.darkMode,
    m: common_vendor.o((...args) => $options.toggleDarkMode && $options.toggleDarkMode(...args), "0e"),
    n: common_vendor.p({
      type: "fas",
      name: "sync-alt",
      size: "16",
      color: "#e2e8f0"
    }),
    o: common_vendor.t($options.$t("settings.followSystem")),
    p: $data.followSystem,
    q: common_vendor.o((...args) => $options.toggleFollowSystem && $options.toggleFollowSystem(...args), "8c"),
    r: common_vendor.p({
      type: "fas",
      name: "language",
      size: "16",
      color: "#e2e8f0"
    }),
    s: common_vendor.t($options.$t("settings.language")),
    t: common_vendor.t($options.getCurrentLanguageName()),
    v: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    w: common_vendor.o((...args) => $options.showLanguageSelector && $options.showLanguageSelector(...args), "88"),
    x: common_vendor.t($options.$t("settings.playbackSettings")),
    y: common_vendor.p({
      type: "fas",
      name: "comments",
      size: "16",
      color: "#e2e8f0"
    }),
    z: $data.showCommentDanmaku,
    A: common_vendor.o((...args) => $options.toggleCommentDanmaku && $options.toggleCommentDanmaku(...args), "c8"),
    B: common_vendor.p({
      type: "fas",
      name: "desktop",
      size: "16",
      color: "#e2e8f0"
    }),
    C: $data.showMiniPlayerDanmaku,
    D: common_vendor.o((...args) => $options.toggleMiniPlayerDanmaku && $options.toggleMiniPlayerDanmaku(...args), "f6"),
    E: common_vendor.p({
      type: "fas",
      name: "clock",
      size: "16",
      color: "#e2e8f0"
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
    J: common_vendor.o((...args) => $options.showSleepTimerSelector && $options.showSleepTimerSelector(...args), "be"),
    K: common_vendor.p({
      type: "fas",
      name: "database",
      size: "16",
      color: "#e2e8f0"
    }),
    L: common_vendor.t($data.resourceCacheSize),
    M: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    N: common_vendor.o((...args) => $options.showResourceCache && $options.showResourceCache(...args), "34"),
    O: common_vendor.p({
      type: "fas",
      name: "file-code",
      size: "16",
      color: "#e2e8f0"
    }),
    P: common_vendor.t($data.metaCacheSize),
    Q: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    R: common_vendor.o((...args) => $options.showMetaCache && $options.showMetaCache(...args), "8b"),
    S: common_vendor.t($options.$t("settings.sourceManagement")),
    T: common_vendor.p({
      type: "fas",
      name: "music",
      size: "16",
      color: "#e2e8f0"
    }),
    U: common_vendor.t($options.$t("settings.sourceManagement")),
    V: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    W: common_vendor.o((...args) => $options.goToMusicSources && $options.goToMusicSources(...args), "71"),
    X: common_vendor.p({
      type: "fas",
      name: "server",
      size: "16",
      color: "#e2e8f0"
    }),
    Y: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    Z: common_vendor.o((...args) => $options.showServerModal && $options.showServerModal(...args), "e8"),
    aa: common_vendor.p({
      type: "fas",
      name: "robot",
      size: "16",
      color: "#e2e8f0"
    }),
    ab: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ac: common_vendor.o((...args) => $options.showAIApiConfig && $options.showAIApiConfig(...args), "72"),
    ad: common_vendor.p({
      type: "fas",
      name: "bug",
      size: "16",
      color: "#e2e8f0"
    }),
    ae: $data.showDebugLog,
    af: common_vendor.o((...args) => $options.toggleDebugLog && $options.toggleDebugLog(...args), "b6"),
    ag: common_vendor.t($options.$t("settings.about")),
    ah: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#e2e8f0"
    }),
    ai: common_vendor.t($options.$t("settings.aboutCeladonMusic")),
    aj: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ak: common_vendor.o((...args) => $options.openAboutPage && $options.openAboutPage(...args), "a5"),
    al: common_vendor.p({
      type: "fas",
      name: "file-alt",
      size: "16",
      color: "#e2e8f0"
    }),
    am: common_vendor.t($options.$t("settings.userAgreement")),
    an: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ao: common_vendor.o((...args) => $options.openUserAgreement && $options.openUserAgreement(...args), "84"),
    ap: common_vendor.p({
      type: "fas",
      name: "question-circle",
      size: "16",
      color: "#e2e8f0"
    }),
    aq: common_vendor.t($options.$t("settings.helpAndFeedback")),
    ar: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    as: common_vendor.o((...args) => $options.openHelpAndFeedback && $options.openHelpAndFeedback(...args), "03"),
    at: common_vendor.p({
      type: "fas",
      name: "sync",
      size: "16",
      color: "#e2e8f0"
    }),
    av: common_vendor.t($options.$t("settings.checkForUpdates")),
    aw: common_vendor.t($data.appVersion),
    ax: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ay: common_vendor.o((...args) => $options.checkForUpdates && $options.checkForUpdates(...args), "b6"),
    az: common_vendor.t($options.$t("app.name")),
    aA: common_vendor.t($options.$t("app.slogan")),
    aB: !$data.showAIApiModal,
    aC: !$data.showAIApiModal,
    aD: $data.showLanguagePopup
  }, $data.showLanguagePopup ? {
    aE: common_vendor.t($options.$t("settings.selectLanguage")),
    aF: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    aG: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args), "db"),
    aH: common_vendor.f($data.supportedLanguages, (lang, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(lang.name),
        b: $data.currentLanguage === lang.code
      }, $data.currentLanguage === lang.code ? {
        c: "45854c89-29-" + i0,
        d: common_vendor.p({
          type: "fas",
          name: "check",
          size: "16",
          color: "#e2e8f0"
        })
      } : {}, {
        e: lang.code,
        f: $data.currentLanguage === lang.code ? 1 : "",
        g: common_vendor.o(($event) => $options.selectLanguage(lang.code), lang.code)
      });
    }),
    aI: common_vendor.t($options.$t("common.confirm")),
    aJ: common_vendor.o((...args) => $options.confirmLanguageSelection && $options.confirmLanguageSelection(...args), "c1"),
    aK: $options.isTablet ? $options.tabletModalSafeTop : "",
    aL: common_vendor.o(() => {
    }, "55"),
    aM: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args), "3b")
  } : {}, {
    aN: $data.showSleepTimerPopup
  }, $data.showSleepTimerPopup ? common_vendor.e({
    aO: common_vendor.t($options.$t("settings.sleepTimer")),
    aP: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    aQ: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "8f"),
    aR: $data.sleepTimerRemaining > 0
  }, $data.sleepTimerRemaining > 0 ? {
    aS: common_vendor.t($options.formatSleepTimerRemaining),
    aT: common_vendor.o((...args) => $options.cancelSleepTimer && $options.cancelSleepTimer(...args), "9e")
  } : {}, {
    aU: common_vendor.f($options.hourOptions, (hour, index, i0) => {
      return {
        a: common_vendor.t(hour),
        b: index
      };
    }),
    aV: common_vendor.f($options.minuteOptions, (minute, index, i0) => {
      return {
        a: common_vendor.t(minute),
        b: index
      };
    }),
    aW: $data.sleepTimerPickerValue,
    aX: common_vendor.o((...args) => $options.onSleepTimerPickerChange && $options.onSleepTimerPickerChange(...args), "ae"),
    aY: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "a1"),
    aZ: common_vendor.o((...args) => $options.confirmSleepTimerSelection && $options.confirmSleepTimerSelection(...args), "df"),
    ba: $options.isTablet ? $options.tabletModalSafeTop : "",
    bb: common_vendor.o(() => {
    }, "2b"),
    bc: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "8b")
  }) : {}, {
    bd: $data.showServerModalFlag
  }, $data.showServerModalFlag ? common_vendor.e({
    be: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    bf: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "90"),
    bg: $data.serverAddress,
    bh: common_vendor.o(($event) => $data.serverAddress = $event.detail.value, "e2"),
    bi: $data.connectionTestResult
  }, $data.connectionTestResult ? {
    bj: common_vendor.p({
      type: "fas",
      name: $data.connectionTestResult.success ? "check-circle" : "times-circle",
      size: "16",
      color: $data.connectionTestResult.success ? "#10b981" : "#ef4444"
    }),
    bk: common_vendor.n($data.connectionTestResult.success ? "success" : "error"),
    bl: common_vendor.t($data.connectionTestResult.message),
    bm: common_vendor.n($data.connectionTestResult.success ? "success" : "error")
  } : {}, {
    bn: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "13"),
    bo: $data.testingConnection
  }, $data.testingConnection ? {
    bp: common_vendor.p({
      type: "fas",
      name: "spinner",
      size: "14",
      color: "#e2e8f0"
    })
  } : {}, {
    bq: common_vendor.t($data.testingConnection ? "测试中..." : "测试"),
    br: $data.testingConnection || !$data.serverAddress.trim() ? 1 : "",
    bs: common_vendor.o((...args) => $options.testServerConnection && $options.testServerConnection(...args), "55"),
    bt: common_vendor.o((...args) => $options.confirmServerAddress && $options.confirmServerAddress(...args), "54"),
    bv: $options.isTablet ? $options.tabletModalSafeTop : "",
    bw: common_vendor.o(() => {
    }, "5b"),
    bx: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "25")
  }) : {}, {
    by: $data.showResourceCachePopup
  }, $data.showResourceCachePopup ? {
    bz: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    bA: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args), "46"),
    bB: common_vendor.t($data.resourceCacheSize),
    bC: common_vendor.t($data.appCacheSize),
    bD: common_vendor.t($data.musicUrlCacheSize),
    bE: common_vendor.t($data.musicUrlCacheCount),
    bF: common_vendor.t($data.audioFileCacheSize),
    bG: common_vendor.t($data.cleaningResourceCache ? "清理中..." : "清理缓存"),
    bH: $data.cleaningResourceCache ? 1 : "",
    bI: common_vendor.o((...args) => $options.cleanResourceCache && $options.cleanResourceCache(...args), "c2"),
    bJ: $options.isTablet ? $options.tabletModalSafeTop : "",
    bK: common_vendor.o(() => {
    }, "b5"),
    bL: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args), "eb")
  } : {}, {
    bM: $data.showMetaCachePopup
  }, $data.showMetaCachePopup ? {
    bN: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    bO: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args), "a4"),
    bP: common_vendor.t($data.metaCacheSize),
    bQ: common_vendor.t($data.otherSourceCacheSize),
    bR: common_vendor.t($data.lyricCacheSize),
    bS: common_vendor.t($data.cleaningOtherSource ? "清理中..." : "清理换源歌曲缓存"),
    bT: $data.cleaningOtherSource ? 1 : "",
    bU: common_vendor.o((...args) => $options.cleanOtherSourceCache && $options.cleanOtherSourceCache(...args), "b0"),
    bV: common_vendor.t($data.cleaningLyric ? "清理中..." : "清理歌词缓存"),
    bW: $data.cleaningLyric ? 1 : "",
    bX: common_vendor.o((...args) => $options.cleanLyricCache && $options.cleanLyricCache(...args), "c0"),
    bY: $options.isTablet ? $options.tabletModalSafeTop : "",
    bZ: common_vendor.o(() => {
    }, "23"),
    ca: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args), "58")
  } : {}, {
    cb: $data.showAIApiModal
  }, $data.showAIApiModal ? common_vendor.e({
    cc: common_vendor.p({
      type: "fas",
      name: "xmark",
      size: "20",
      color: "#999"
    }),
    cd: common_vendor.o((...args) => $options.closeAIApiModal && $options.closeAIApiModal(...args), "b9"),
    ce: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "14",
      color: "#e2e8f0"
    }),
    cf: common_vendor.p({
      type: "fas",
      name: "server",
      size: "16",
      color: "#e2e8f0"
    }),
    cg: common_vendor.t($data.platformPresets.backend.label),
    ch: common_vendor.t($data.platformPresets.backend.desc),
    ci: $data.apiConfig.provider === "backend"
  }, $data.apiConfig.provider === "backend" ? {} : {}, {
    cj: $data.activePlatform === "backend" ? 1 : "",
    ck: common_vendor.o(($event) => $options.selectPlatform("backend"), "e2"),
    cl: common_vendor.p({
      type: "fas",
      name: "brain",
      size: "16",
      color: "#e2e8f0"
    }),
    cm: common_vendor.t($data.platformPresets.deepseek.label),
    cn: common_vendor.t($data.platformPresets.deepseek.desc),
    co: $data.apiConfig.provider === "deepseek" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "deepseek" && $data.apiConfig.apiKey ? {} : {}, {
    cp: $data.activePlatform === "deepseek" ? 1 : "",
    cq: common_vendor.o(($event) => $options.selectPlatform("deepseek"), "26"),
    cr: common_vendor.p({
      type: "fas",
      name: "microchip",
      size: "16",
      color: "#e2e8f0"
    }),
    cs: common_vendor.t($data.platformPresets.openai.label),
    ct: common_vendor.t($data.platformPresets.openai.desc),
    cv: $data.apiConfig.provider === "openai" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "openai" && $data.apiConfig.apiKey ? {} : {}, {
    cw: $data.activePlatform === "openai" ? 1 : "",
    cx: common_vendor.o(($event) => $options.selectPlatform("openai"), "39"),
    cy: common_vendor.p({
      type: "fas",
      name: "bolt",
      size: "16",
      color: "#e2e8f0"
    }),
    cz: common_vendor.t($data.platformPresets.siliconflow.label),
    cA: common_vendor.t($data.platformPresets.siliconflow.desc),
    cB: $data.apiConfig.provider === "siliconflow" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "siliconflow" && $data.apiConfig.apiKey ? {} : {}, {
    cC: $data.activePlatform === "siliconflow" ? 1 : "",
    cD: common_vendor.o(($event) => $options.selectPlatform("siliconflow"), "43"),
    cE: common_vendor.p({
      type: "fas",
      name: "gear",
      size: "16",
      color: "#e2e8f0"
    }),
    cF: common_vendor.t($data.platformPresets.custom.label),
    cG: common_vendor.t($data.platformPresets.custom.desc),
    cH: $data.apiConfig.provider === "custom" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "custom" && $data.apiConfig.apiKey ? {} : {}, {
    cI: $data.activePlatform === "custom" ? 1 : "",
    cJ: common_vendor.o(($event) => $options.selectPlatform("custom"), "5a"),
    cK: $data.activePlatform && $data.activePlatform !== "backend"
  }, $data.activePlatform && $data.activePlatform !== "backend" ? {
    cL: $options.getApiUrlPlaceholder(),
    cM: $data.currentApiUrl,
    cN: common_vendor.o(($event) => $data.currentApiUrl = $event.detail.value, "66"),
    cO: $data.showApiKey ? "text" : "password",
    cP: $data.currentApiKey,
    cQ: common_vendor.o(($event) => $data.currentApiKey = $event.detail.value, "f3"),
    cR: common_vendor.p({
      type: "fas",
      name: $data.showApiKey ? "eye-slash" : "eye",
      size: "16",
      color: "#9ca3af"
    }),
    cS: common_vendor.o(($event) => $data.showApiKey = !$data.showApiKey, "ca"),
    cT: $options.getModelPlaceholder(),
    cU: $data.currentModelName,
    cV: common_vendor.o(($event) => $data.currentModelName = $event.detail.value, "82")
  } : {}, {
    cW: common_vendor.s($options.getModalBodyStyle()),
    cX: common_vendor.t($data.activePlatform === "backend" ? "使用默认后端" : "保存配置"),
    cY: common_vendor.o((...args) => $options.saveCurrentApiConfig && $options.saveCurrentApiConfig(...args), "24"),
    cZ: common_vendor.s($options.getModalFooterStyle()),
    da: common_vendor.s($options.getTabletModalStyle()),
    db: common_vendor.o(() => {
    }, "73"),
    dc: $data.darkMode ? 1 : "",
    dd: $options.isTablet ? 1 : "",
    de: common_vendor.o((...args) => $options.closeAIApiModal && $options.closeAIApiModal(...args), "e1")
  }) : {}, {
    df: $data.showAboutPopup
  }, $data.showAboutPopup ? {
    dg: common_vendor.p({
      type: "fas",
      name: "wave-square",
      size: "20",
      color: "#ffffff"
    }),
    dh: common_vendor.t($data.appVersion),
    di: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args), "d9"),
    dj: common_vendor.o(() => {
    }, "5a"),
    dk: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args), "31")
  } : {}, {
    dl: $data.showUserAgreementPopup
  }, $data.showUserAgreementPopup ? common_vendor.e({
    dm: $data.pactAgreed
  }, $data.pactAgreed ? {
    dn: common_vendor.p({
      type: "fas",
      name: "check-circle",
      size: "14",
      color: "#10b981"
    })
  } : {}, {
    dp: $data.pactAgreed
  }, $data.pactAgreed ? {
    dq: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#e2e8f0"
    }),
    dr: common_vendor.t($options.pactAgreedTime)
  } : {}, {
    ds: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args), "d1"),
    dt: common_vendor.o(() => {
    }, "cd"),
    dv: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args), "16")
  }) : {}, {
    dw: common_vendor.o($options.closeUpdatePopup, "87"),
    dx: common_vendor.p({
      visible: $data.showUpdatePopup,
      ["update-info"]: $data.updateInfo,
      ["dark-mode"]: $data.darkMode
    }),
    dy: $data.darkMode ? 1 : "",
    dz: $options.isTablet ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
exports.MiniProgramPage = MiniProgramPage;
