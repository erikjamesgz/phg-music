"use strict";
const common_vendor = require("./common/vendor.js");
const i18n_index = require("./i18n/index.js");
const utils_system = require("./utils/system.js");
const utils_i18n = require("./utils/i18n.js");
const utils_config = require("./utils/config.js");
const utils_version = require("./utils/version.js");
const utils_mesh_meshConfig = require("./utils/mesh/meshConfig.js");
const utils_mesh_meshApi = require("./utils/mesh/meshApi.js");
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
      showCompatModal: false,
      compatModalData: null,
      // 更新弹窗
      showUpdatePopup: false,
      updateInfo: null,
      pactAgreed: false,
      // 服务器地址
      serverAddress: "",
      testingConnection: false,
      connectionTestResult: null,
      // 分享管理
      showShareManagementPopup: false,
      shareConfig: {
        status: 0,
        daily_limit: 8e4,
        reserved_limit: 2e4,
        contributor_name: ""
      },
      shareUsage: {
        current_usage: 0,
        remaining: 0
      },
      shareAchievement: {
        totalCalls: 0,
        sharedSince: 0,
        sharedDays: 0,
        todayCalls: 0,
        weekStats: [],
        title: "",
        titleIcon: "",
        nextTitle: "",
        daysToNext: 0
      },
      savingShareConfig: false,
      // 分享额度滑块拖拽状态
      shareSliderDragging: false,
      shareSliderPercent: 0,
      // 自定义Toast状态
      copyToastVisible: false,
      copyToastText: "",
      // 公共服务器
      showFreeNodesPopup: false,
      freeNodes: [],
      loadingFreeNodes: false,
      currentMeshMode: null,
      // 测试模式（节点故障注入）
      testModeActive: false,
      // 本地异常节点列表（批量上报用）
      abnormalNodes: [],
      // 首选节点 & 活跃节点
      preferredNodeUrl: null,
      activeNodeUrl: null,
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
    // 7天趋势最大值（用于柱状图高度计算）
    maxWeekCount() {
      if (!this.shareAchievement.weekStats || this.shareAchievement.weekStats.length === 0)
        return 1;
      return Math.max(1, ...this.shareAchievement.weekStats.map((s) => s.count || 0));
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
    common_vendor.index.$on("openShareManagement", this.showShareManagementModal);
    common_vendor.index.$on("openServerModal", this.showServerModal);
    common_vendor.index.$on("openFreeNodesModal", this.showFreeNodesModal);
    common_vendor.index.$on("showCompatModal", this.handleShowCompatModal);
    common_vendor.index.$on("meshActiveNodeChanged", this.handleActiveNodeChanged);
    common_vendor.index.$on("meshAbnormalNodesUpdated", this.refreshAbnormalNodes);
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
    common_vendor.index.$off("openShareManagement", this.showShareManagementModal);
    common_vendor.index.$off("openServerModal", this.showServerModal);
    common_vendor.index.$off("showCompatModal", this.handleShowCompatModal);
    common_vendor.index.$off("openFreeNodesModal", this.showFreeNodesModal);
    common_vendor.index.$off("meshActiveNodeChanged", this.handleActiveNodeChanged);
    common_vendor.index.$off("meshAbnormalNodesUpdated", this.refreshAbnormalNodes);
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
    // 显示版本兼容性弹窗（由 checkServerCompat 通过 uni.$emit 触发）
    handleShowCompatModal(data) {
      console.log("[Settings] 收到 showCompatModal 事件:", data);
      this.compatModalData = data;
      this.showCompatModal = true;
    },
    // 关闭版本兼容性弹窗
    closeCompatModal() {
      this.showCompatModal = false;
      this.compatModalData = null;
    },
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
    // 跳转到音源插件管理页面
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
    // 复制部署教程链接
    copyDeployTutorial() {
      console.log("[Settings] 复制部署教程链接");
      const tutorialUrl = "https://github.com/erikjamesgz/cf_phg_music_server";
      common_vendor.index.setClipboardData({
        data: tutorialUrl,
        showToast: false,
        success: () => {
          console.log("[Settings] 链接已复制到剪贴板");
          this.showCustomToast("链接已复制，请在浏览器打开");
        },
        fail: (err) => {
          console.error("[Settings] 复制失败:", err);
          this.showCustomToast("复制失败，请手动复制");
        }
      });
    },
    // 显示自定义Toast
    showCustomToast(text) {
      this.copyToastText = text;
      this.copyToastVisible = true;
      if (this._copyToastTimer)
        clearTimeout(this._copyToastTimer);
      this._copyToastTimer = setTimeout(() => {
        this.copyToastVisible = false;
      }, 2500);
    },
    // ==================== 分享管理 ====================
    // 显示分享管理弹窗
    async showShareManagementModal() {
      console.log("[Settings] 打开服务器分享弹窗");
      const origin = utils_config.getServerOrigin();
      const apiKey = utils_config.getApiKey();
      if (!origin || !apiKey) {
        console.log("[Settings] 未设置服务器地址，直接打开服务器地址弹窗");
        common_vendor.index.showToast({ title: "请先设置服务器地址", icon: "none", duration: 2e3 });
        setTimeout(() => {
          this.showServerModal();
        }, 500);
        return;
      }
      this.shareConfig = {
        status: 0,
        daily_limit: 8e4,
        reserved_limit: 2e4,
        contributor_name: ""
      };
      this.shareUsage = {
        current_usage: 0,
        remaining: 0
      };
      this.updateShareSliderPercent();
      this.showShareManagementPopup = true;
      await this.loadShareStatus();
    },
    closeShareManagementPopup() {
      this.showShareManagementPopup = false;
    },
    // 加载分享状态
    async loadShareStatus() {
      const origin = utils_config.getServerOrigin();
      const apiKey = utils_config.getApiKey();
      if (!origin || !apiKey) {
        console.log("[Settings] 无法解析服务器地址");
        common_vendor.index.showToast({ title: "请先设置服务器地址", icon: "none" });
        return;
      }
      const statusUrl = `${origin}/owner/${apiKey}/status`;
      console.log("[Settings] 加载分享状态:", statusUrl);
      common_vendor.index.request({
        url: statusUrl,
        method: "GET",
        timeout: 8e3,
        success: (res) => {
          var _a, _b;
          console.log("[Settings] status success回调, statusCode:", res.statusCode);
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_b = res.data) == null ? void 0 : _b.data)) {
            const data = res.data.data;
            console.log("[Settings] 分享状态:", data);
            let contributorName = data.contributor_name || "";
            if (!contributorName) {
              contributorName = "拼好歌用户" + Date.now();
            }
            this.shareConfig = {
              status: data.share_status || 0,
              daily_limit: data.daily_limit || 8e4,
              reserved_limit: data.reserved_limit || 2e4,
              contributor_name: contributorName
            };
            this.shareUsage = {
              current_usage: data.current_usage || 0,
              remaining: Math.max(0, (data.daily_limit || this.shareConfig.daily_limit) - (data.current_usage || 0))
            };
            const apiCallStats = data.api_call_stats || [];
            const apiCallTotal = data.api_call_total || 0;
            const sharedSince = data.shared_since || 0;
            const sharedDays = sharedSince ? Math.floor((Date.now() - sharedSince) / (24 * 3600 * 1e3)) + 1 : 0;
            const todayCalls = data.current_usage || 0;
            const weekTotal = apiCallStats.reduce((sum, s) => sum + (s.count || 0), 0);
            const titles = [
              { days: 1, icon: "🎵", name: "音乐爱好者" },
              { days: 3, icon: "🎶", name: "音乐分享者" },
              { days: 7, icon: "🛡️", name: "音乐守护者" },
              { days: 15, icon: "⭐", name: "音乐使者" },
              { days: 30, icon: "🌟", name: "音乐传教士" },
              { days: 60, icon: "💎", name: "音乐钻石" },
              { days: 100, icon: "👑", name: "音乐之王" },
              { days: 180, icon: "🔥", name: "音乐传奇" },
              { days: 365, icon: "🌈", name: "音乐之光" },
              { days: 500, icon: "🏅", name: "音乐终身成就奖" }
            ];
            let currentTitle = titles[0];
            let nextTitle = null;
            for (let i = 0; i < titles.length; i++) {
              if (sharedDays >= titles[i].days) {
                currentTitle = titles[i];
                nextTitle = titles[i + 1] || null;
              } else {
                if (!nextTitle)
                  nextTitle = titles[i];
                break;
              }
            }
            this.shareAchievement = {
              totalCalls: Math.max(apiCallTotal, weekTotal),
              sharedSince,
              sharedDays,
              todayCalls,
              weekStats: apiCallStats,
              title: currentTitle.name,
              titleIcon: currentTitle.icon,
              nextTitle: nextTitle ? nextTitle.name : "",
              daysToNext: nextTitle ? Math.max(0, nextTitle.days - sharedDays) : 0
            };
            this.updateShareSliderPercent();
            utils_config.checkServerCompat(data);
          } else if (res.statusCode === 404) {
            console.log("[Settings] status返回404，服务端是旧版");
            utils_config.checkServerCompat({ serverVersion: "旧版", serverVersionCode: 0, minClientVersion: "未知", minClientVersionCode: 0 }, "404");
          } else {
            console.log("[Settings] 获取分享状态失败:", res.statusCode);
            utils_config.checkServerCompat({ serverVersion: "旧版", serverVersionCode: 0, minClientVersion: "未知", minClientVersionCode: 0 }, "status_" + res.statusCode);
          }
        },
        fail: (err) => {
          console.log("[Settings] 获取分享状态网络错误:", err.errMsg);
          utils_config.checkServerCompat({ serverVersion: "旧版", serverVersionCode: 0, minClientVersion: "未知", minClientVersionCode: 0 }, "network_error");
        },
        complete: () => {
        }
      });
    },
    // 更新分享额度滑块百分比
    updateShareSliderPercent() {
      const min = 2e4;
      const max = 95e3;
      const val = this.shareConfig.daily_limit;
      const percent = Math.min(Math.max((val - min) / (max - min) * 100, 0), 100);
      this.shareSliderPercent = percent;
    },
    // 滑块触摸开始
    onShareSliderTouchStart(e) {
      this.shareSliderDragging = true;
      this.updateShareSliderValue(e);
    },
    // 滑块触摸移动
    onShareSliderTouchMove(e) {
      if (!this.shareSliderDragging)
        return;
      this.updateShareSliderValue(e);
    },
    // 滑块触摸结束
    onShareSliderTouchEnd(e) {
      this.shareSliderDragging = false;
    },
    // 更新滑块值（每次都查询DOM，照搬ai-recommend的实现）
    updateShareSliderValue(e) {
      const touch = e.touches && e.touches[0] ? e.touches[0] : e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null;
      if (!touch)
        return;
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".share-slider-wrapper").boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          const rect = res[0];
          const offsetX = touch.clientX - rect.left;
          let percent = Math.min(Math.max(offsetX / rect.width * 100, 0), 100);
          this.shareSliderPercent = percent;
          const min = 2e4;
          const max = 95e3;
          const value = Math.round((min + percent / 100 * (max - min)) / 1e3) * 1e3;
          this.shareConfig.daily_limit = Math.min(Math.max(value, min), max);
        }
      });
    },
    // 保存并分享服务算力（开启分享）
    saveAndShareConfig() {
      this.shareConfig.status = 1;
      this.saveShareConfig();
    },
    // 取消分享
    cancelShareConfig() {
      const totalCalls = this.shareAchievement.totalCalls || 0;
      const contentText = totalCalls > 0 ? `您已帮助社区播放了 ${totalCalls} 次音乐🎵
确定要停止分享吗？停止后他人将无法使用您的节点。` : "确定要取消分享服务器算力吗？";
      common_vendor.index.showModal({
        title: "提示",
        content: contentText,
        confirmText: "确认停止",
        cancelText: "再想想",
        success: (res) => {
          if (res.confirm) {
            this.shareConfig.status = 0;
            this.saveShareConfig();
          }
        }
      });
    },
    // 保存分享配置
    saveShareConfig() {
      const origin = utils_config.getServerOrigin();
      const apiKey = utils_config.getApiKey();
      if (!origin || !apiKey) {
        common_vendor.index.showToast({ title: "请先设置服务器地址", icon: "none" });
        return;
      }
      this.savingShareConfig = true;
      const configUrl = `${origin}/owner/${apiKey}/share/config`;
      console.log("[Settings] 保存分享配置:", configUrl, this.shareConfig);
      common_vendor.index.request({
        url: configUrl,
        method: "POST",
        header: { "Content-Type": "application/json" },
        data: {
          status: this.shareConfig.status,
          daily_limit: this.shareConfig.daily_limit,
          reserved_limit: this.shareConfig.reserved_limit,
          contributor_name: this.shareConfig.contributor_name
        },
        timeout: 1e4,
        success: async (res) => {
          var _a, _b, _c;
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200) {
            console.log("[Settings] 分享配置保存成功");
            if (this.shareConfig.status === 1) {
              common_vendor.index.showToast({ title: "保存成功，正在同步到公共网络...", icon: "none", duration: 2e3 });
              await this.syncToMeshRegistry("register");
              common_vendor.index.setStorageSync("share_donated", true);
            } else {
              common_vendor.index.showToast({ title: "保存成功，正在从公共网络注销...", icon: "none", duration: 2e3 });
              await this.syncToMeshRegistry("unregister");
            }
          } else {
            console.log("[Settings] 保存失败:", (_b = res.data) == null ? void 0 : _b.msg);
            common_vendor.index.showToast({ title: ((_c = res.data) == null ? void 0 : _c.msg) || "保存失败", icon: "none" });
          }
        },
        fail: (err) => {
          console.log("[Settings] 保存网络错误:", err.errMsg);
          common_vendor.index.showToast({ title: "网络错误", icon: "none" });
        },
        complete: () => {
          this.savingShareConfig = false;
        }
      });
    },
    // 同步分享状态到 Mesh 注册中心
    // action: 'register' = 注册/更新节点, 'unregister' = 注销节点
    async syncToMeshRegistry(action) {
      var _a, _b;
      const origin = utils_config.getServerOrigin();
      const apiKey = utils_config.getApiKey();
      if (!origin || !apiKey) {
        console.log("[Settings] 无法同步到Mesh: 缺少服务器地址");
        return;
      }
      if (action === "register") {
        console.log("[Settings] 注册/更新节点到 Mesh 注册中心");
        let latestUsage = this.shareUsage.current_usage || 0;
        try {
          const statusRes = await new Promise((resolve) => {
            common_vendor.index.request({
              url: `${origin}/owner/${apiKey}/status`,
              method: "GET",
              timeout: 8e3,
              success: (res) => resolve(res),
              fail: () => resolve(null)
            });
          });
          if (statusRes && statusRes.statusCode === 200 && ((_a = statusRes.data) == null ? void 0 : _a.code) === 200 && ((_b = statusRes.data) == null ? void 0 : _b.data)) {
            latestUsage = statusRes.data.data.current_usage || 0;
            console.log("[Settings] 注册前获取到最新调用次数:", latestUsage);
            this.shareUsage = {
              current_usage: latestUsage,
              remaining: Math.max(0, (statusRes.data.data.daily_limit || this.shareConfig.daily_limit) - latestUsage)
            };
            this._shareNodeId = statusRes.data.data.node_id || "";
          }
        } catch (e) {
          console.log("[Settings] 获取最新状态失败，使用缓存值:", e);
        }
        const result = await utils_mesh_meshConfig.registerNode({
          node_url: origin,
          owner_key: apiKey,
          contributor_name: this.shareConfig.contributor_name,
          daily_limit: this.shareConfig.daily_limit,
          current_usage: latestUsage,
          node_id: this._shareNodeId || ""
        });
        if (result.success) {
          console.log("[Settings] Mesh 注册成功:", result.data);
          common_vendor.index.showToast({ title: "已同步到公共网络", icon: "success" });
        } else {
          console.log("[Settings] Mesh 注册失败:", result.message);
          common_vendor.index.showToast({ title: "公共网络同步失败: " + result.message, icon: "none", duration: 3e3 });
        }
      } else if (action === "unregister") {
        console.log("[Settings] 从 Mesh 注册中心注销节点");
        const result = await utils_mesh_meshConfig.unregisterNode({
          node_url: origin,
          owner_key: apiKey,
          node_id: this._shareNodeId || ""
        });
        if (result.success) {
          console.log("[Settings] Mesh 注销成功");
          common_vendor.index.showToast({ title: "已从公共网络注销", icon: "success" });
        } else {
          console.log("[Settings] Mesh 注销失败:", result.message);
          common_vendor.index.showToast({ title: "公共网络注销失败: " + result.message, icon: "none", duration: 3e3 });
        }
      }
    },
    // ==================== 公共服务器 ====================
    // 显示公共服务器弹窗
    async showFreeNodesModal() {
      console.log("[Settings] 打开公共服务器弹窗");
      this.currentMeshMode = utils_config.getMeshMode();
      this.testModeActive = utils_mesh_meshConfig.isTestMode();
      this.preferredNodeUrl = utils_mesh_meshApi.getPreferredNodeUrl();
      this.activeNodeUrl = utils_mesh_meshApi.getActiveNodeUrl();
      this.showFreeNodesPopup = true;
      await this.loadFreeNodes();
      this.refreshAbnormalNodes();
    },
    closeFreeNodesPopup() {
      this.showFreeNodesPopup = false;
    },
    // 选择首选节点（点击节点列表中的节点，不可用节点也可选择，播放时会再尝试一次）
    selectPreferredNode(node) {
      if (this.preferredNodeUrl === node.node_url) {
        utils_mesh_meshApi.setPreferredNode(null);
        this.preferredNodeUrl = null;
        common_vendor.index.showToast({ title: "已取消首选节点", icon: "none" });
        return;
      }
      utils_mesh_meshApi.setPreferredNode(node.node_url);
      this.preferredNodeUrl = node.node_url;
      if (node.alive === false) {
        common_vendor.index.showToast({ title: `已设为首选(不可用)，播放时会再尝试`, icon: "none" });
      } else if ((node.current_usage || 0) >= (node.daily_limit || 0)) {
        common_vendor.index.showToast({ title: `已设为首选(额度满)，播放时会再尝试`, icon: "none" });
      } else {
        common_vendor.index.showToast({ title: `已设为首选: ${node.contributor_name || "匿名"}`, icon: "success" });
      }
    },
    // 活跃节点变更回调（播放成功后 meshApi 自动选中了新节点）
    handleActiveNodeChanged(nodeUrl) {
      console.log("[Settings] 活跃节点变更:", nodeUrl);
      this.activeNodeUrl = nodeUrl;
    },
    // 切换测试模式（注入/清除模拟异常节点）
    async toggleTestMode() {
      if (this.testModeActive) {
        utils_mesh_meshConfig.clearTestNodes();
        this.testModeActive = false;
        console.log("[Settings] 已清除测试节点，恢复原有节点列表");
        common_vendor.index.showToast({ title: "已清除测试节点", icon: "success" });
        await this.loadFreeNodes();
      } else {
        const testNodes = utils_mesh_meshConfig.injectTestNodes();
        this.testModeActive = true;
        console.log("[Settings] 已注入测试节点，共", testNodes.length, "个");
        common_vendor.index.showToast({ title: `已注入${testNodes.length}个测试节点`, icon: "success" });
        await this.loadFreeNodes();
      }
      this.refreshAbnormalNodes();
    },
    // 切换全部失败测试模式（只注入失败节点，不保留真实节点 → 触发批量上报）
    async toggleAllFailTestMode() {
      if (this.testModeActive) {
        utils_mesh_meshConfig.clearTestNodes();
        this.testModeActive = false;
        console.log("[Settings] 已清除测试节点");
        common_vendor.index.showToast({ title: "已清除测试节点", icon: "success" });
        await this.loadFreeNodes();
      } else {
        const testNodes = utils_mesh_meshConfig.injectAllFailTestNodes();
        this.testModeActive = true;
        console.log("[Settings] 已注入全部失败测试节点，共", testNodes.length, "个");
        common_vendor.index.showToast({ title: `已注入${testNodes.length}个失败节点，播放将全部失败`, icon: "none", duration: 3e3 });
        await this.loadFreeNodes();
      }
      this.refreshAbnormalNodes();
    },
    // 刷新本地异常节点列表显示
    refreshAbnormalNodes() {
      this.abnormalNodes = utils_mesh_meshConfig.getAbnormalNodes();
      console.log("[Settings] 异常节点列表:", this.abnormalNodes.length, "个");
    },
    // 加载公共服务器列表（读缓存 + ping探活，不请求Mesh）
    async loadFreeNodes() {
      this.loadingFreeNodes = true;
      console.log("[Settings] 加载公共服务器列表");
      const nodes = await utils_mesh_meshConfig.getNodeList(false);
      console.log("[Settings] 获取到节点:", nodes.length, "个");
      if (nodes.length > 0) {
        const pingedNodes = await utils_mesh_meshConfig.pingAllNodes(nodes);
        this.freeNodes = pingedNodes;
      } else {
        this.freeNodes = [];
      }
      this.loadingFreeNodes = false;
    },
    // 刷新公共服务器列表（手动刷新，1h限1次）
    async refreshFreeNodes() {
      console.log("[Settings] 刷新公共服务器列表");
      this.loadingFreeNodes = true;
      const result = await utils_mesh_meshConfig.refreshNodeList();
      console.log("[Settings] 刷新结果:", result.success, result.message);
      if (result.nodes.length > 0) {
        const pingedNodes = await utils_mesh_meshConfig.pingAllNodes(result.nodes);
        this.freeNodes = pingedNodes;
      } else {
        this.freeNodes = [];
      }
      this.loadingFreeNodes = false;
      common_vendor.index.showToast({ title: result.message, icon: "none" });
    },
    // 切换到公共服务器模式（再次点击取消）
    async switchToFreeMode() {
      if (this.currentMeshMode === "free") {
        utils_config.setMeshMode(null);
        this.currentMeshMode = null;
        common_vendor.index.showToast({ title: "已取消公共服务器模式", icon: "none" });
        return;
      }
      utils_config.setMeshMode("free");
      this.currentMeshMode = "free";
      if (!utils_config.hasLocalScripts()) {
        this.closeFreeNodesPopup();
        common_vendor.index.$emit("needImportScripts");
        return;
      }
      common_vendor.index.showToast({ title: "已切换到公共服务器模式", icon: "success" });
    },
    // 切换到自有服务器模式（再次点击取消）
    async switchToOwnMode() {
      var _a, _b, _c;
      if (this.currentMeshMode === "own") {
        utils_config.setMeshMode(null);
        this.currentMeshMode = null;
        common_vendor.index.showToast({ title: "已取消专属服务器模式", icon: "none" });
        return;
      }
      if (this.serverAddress && this.serverAddress.trim()) {
        const url = this.serverAddress.trim();
        const urlPattern = /^(http|https):\/\/[^\s]+$/;
        if (!urlPattern.test(url)) {
          common_vendor.index.showToast({ title: "请输入有效的URL地址", icon: "none" });
          return;
        }
        utils_config.setServerUrl(url);
      }
      if (!utils_config.hasOwnServer()) {
        common_vendor.index.showToast({ title: "请先设置服务器地址", icon: "none" });
        this.closeFreeNodesPopup();
        setTimeout(() => {
          this.showServerModal();
        }, 300);
        return;
      }
      const origin = utils_config.getServerOrigin();
      const apiKey = utils_config.getApiKey();
      try {
        const scriptsRes = await common_vendor.index.request({
          url: `${origin}/${apiKey}/api/scripts/loaded`,
          method: "GET",
          timeout: 1e4
        });
        if (scriptsRes.statusCode !== 200 || ((_a = scriptsRes.data) == null ? void 0 : _a.code) !== 200) {
          common_vendor.index.showToast({ title: "无法连接服务器", icon: "none" });
          return;
        }
        utils_config.setMeshMode("own");
        this.currentMeshMode = "own";
        const scripts = scriptsRes.data.data || [];
        if (scripts.length === 0) {
          this.closeFreeNodesPopup();
          common_vendor.index.$emit("needImportScripts");
          common_vendor.index.showToast({ title: "已切换到专属服务器模式", icon: "success" });
          return;
        }
        let serverVersionCode = 0;
        let serverVersion = "未知";
        try {
          const statusRes = await common_vendor.index.request({
            url: `${origin}/${apiKey}/status`,
            method: "GET",
            timeout: 8e3
          });
          if (statusRes.statusCode === 200 && ((_b = statusRes.data) == null ? void 0 : _b.code) === 200 && ((_c = statusRes.data) == null ? void 0 : _c.data)) {
            serverVersionCode = statusRes.data.data.serverVersionCode || 0;
            serverVersion = statusRes.data.data.serverVersion || "未知";
          } else if (statusRes.statusCode === 404) {
            serverVersionCode = 0;
            serverVersion = "旧版";
          }
        } catch (e) {
          console.log("[Settings] 获取 /status 失败:", e);
        }
        if (serverVersionCode < utils_config.MIN_SERVER_VERSION_CODE) {
          this.handleShowCompatModal({
            title: "服务器版本过低",
            content: serverVersion !== "未知" && serverVersion !== "旧版" ? `当前服务器版本 v${serverVersion}，部分功能可能异常，建议升级服务端到 v${utils_config.MIN_SERVER_VERSION} 以上` : `服务器版本过低，部分功能可能异常，建议升级服务端到 v${utils_config.MIN_SERVER_VERSION} 以上`
          });
          common_vendor.index.showToast({ title: "已切换到专属服务器模式（版本过低）", icon: "none" });
        } else {
          common_vendor.index.showToast({ title: "已切换到专属服务器模式", icon: "success" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "连接服务器失败", icon: "none" });
      }
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
        const scriptsRes = await common_vendor.index.request({
          url: `${url}/api/scripts/loaded`,
          method: "GET",
          timeout: 1e4
        });
        if (scriptsRes.statusCode !== 200 || !scriptsRes.data || scriptsRes.data.code !== 200) {
          if (scriptsRes.statusCode === 404) {
            this.connectionTestResult = { success: false, message: "接口不存在，请确认服务器地址正确" };
          } else if (scriptsRes.statusCode === 500) {
            this.connectionTestResult = { success: false, message: "服务器内部错误，请稍后重试" };
          } else if (scriptsRes.statusCode === 401 || scriptsRes.statusCode === 403) {
            this.connectionTestResult = { success: false, message: "无权限访问该服务器" };
          } else {
            this.connectionTestResult = { success: false, message: `服务器响应异常（状态码: ${scriptsRes.statusCode || "未知"}）` };
          }
        } else {
          let serverVersionCode = 0;
          let serverVersion = "未知";
          let statusOk = false;
          try {
            const statusRes = await common_vendor.index.request({
              url: `${url}/status`,
              method: "GET",
              timeout: 8e3
            });
            if (statusRes.statusCode === 200 && statusRes.data && statusRes.data.code === 200) {
              const serverData = statusRes.data.data || {};
              serverVersionCode = serverData.serverVersionCode || 0;
              serverVersion = serverData.serverVersion || "未知";
              statusOk = true;
            } else if (statusRes.statusCode === 404) {
              serverVersionCode = 0;
              serverVersion = "旧版";
              statusOk = false;
            }
          } catch (statusErr) {
            console.log("[设置] /status 请求失败:", statusErr);
          }
          if (statusOk && serverVersionCode >= utils_config.MIN_SERVER_VERSION_CODE) {
            this.connectionTestResult = {
              success: true,
              message: `连接成功，服务器版本 v${serverVersion}，版本兼容`
            };
          } else if (statusOk && serverVersionCode < utils_config.MIN_SERVER_VERSION_CODE) {
            this.connectionTestResult = {
              success: true,
              message: `连接成功，服务器版本 v${serverVersion}（版本过低，建议升级到 v${utils_config.MIN_SERVER_VERSION} 以上）`
            };
          } else {
            this.connectionTestResult = {
              success: true,
              message: `连接成功，但服务器版本过低，无法验证版本信息，建议升级到 v${utils_config.MIN_SERVER_VERSION} 以上`
            };
          }
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
        this.checkServerVersionCompat();
      } else {
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    },
    // 检查服务端版本兼容性（保存服务器地址后调用）
    checkServerVersionCompat() {
      const origin = utils_config.getServerOrigin();
      const apiKey = utils_config.getApiKey();
      if (!origin || !apiKey)
        return;
      common_vendor.index.request({
        url: `${origin}/${apiKey}/status`,
        method: "GET",
        timeout: 8e3,
        success: (res) => {
          var _a, _b;
          console.log("[Settings] checkServerVersionCompat success, statusCode:", res.statusCode);
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_b = res.data) == null ? void 0 : _b.data)) {
            utils_config.checkServerCompat(res.data.data);
          } else if (res.statusCode === 404) {
            utils_config.checkServerCompat({ serverVersion: "旧版", serverVersionCode: 0, minClientVersion: "未知", minClientVersionCode: 0 }, "404");
          } else {
            utils_config.checkServerCompat({ serverVersion: "旧版", serverVersionCode: 0, minClientVersion: "未知", minClientVersionCode: 0 }, "status_" + res.statusCode);
          }
        },
        fail: (err) => {
          console.log("[Settings] checkServerVersionCompat fail:", err.errMsg);
          utils_config.checkServerCompat({ serverVersion: "旧版", serverVersionCode: 0, minClientVersion: "未知", minClientVersionCode: 0 }, "network_error");
        }
      });
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
  var _a, _b;
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
    W: common_vendor.o((...args) => $options.goToMusicSources && $options.goToMusicSources(...args), "c8"),
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
    Z: common_vendor.o((...args) => $options.showServerModal && $options.showServerModal(...args), "b9"),
    aa: common_vendor.p({
      type: "fas",
      name: "share-alt",
      size: "16",
      color: "#e2e8f0"
    }),
    ab: $data.shareConfig.status === 0 && !common_vendor.index.getStorageSync("share_donated")
  }, $data.shareConfig.status === 0 && !common_vendor.index.getStorageSync("share_donated") ? {} : $data.shareConfig.status === 1 && $data.shareAchievement.title ? {
    ad: common_vendor.t($data.shareAchievement.title)
  } : $data.shareConfig.status === 2 ? {} : {}, {
    ac: $data.shareConfig.status === 1 && $data.shareAchievement.title,
    ae: $data.shareConfig.status === 2,
    af: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    ag: common_vendor.o((...args) => $options.showShareManagementModal && $options.showShareManagementModal(...args), "af"),
    ah: common_vendor.p({
      type: "fas",
      name: "globe",
      size: "16",
      color: "#e2e8f0"
    }),
    ai: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    aj: common_vendor.o((...args) => $options.showFreeNodesModal && $options.showFreeNodesModal(...args), "28"),
    ak: common_vendor.p({
      type: "fas",
      name: "robot",
      size: "16",
      color: "#e2e8f0"
    }),
    al: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    am: common_vendor.o((...args) => $options.showAIApiConfig && $options.showAIApiConfig(...args), "c1"),
    an: common_vendor.p({
      type: "fas",
      name: "bug",
      size: "16",
      color: "#e2e8f0"
    }),
    ao: $data.showDebugLog,
    ap: common_vendor.o((...args) => $options.toggleDebugLog && $options.toggleDebugLog(...args), "30"),
    aq: common_vendor.t($options.$t("settings.about")),
    ar: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#e2e8f0"
    }),
    as: common_vendor.t($options.$t("settings.aboutCeladonMusic")),
    at: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    av: common_vendor.o((...args) => $options.openAboutPage && $options.openAboutPage(...args), "f0"),
    aw: common_vendor.p({
      type: "fas",
      name: "file-alt",
      size: "16",
      color: "#e2e8f0"
    }),
    ax: common_vendor.t($options.$t("settings.userAgreement")),
    ay: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    az: common_vendor.o((...args) => $options.openUserAgreement && $options.openUserAgreement(...args), "2b"),
    aA: common_vendor.p({
      type: "fas",
      name: "question-circle",
      size: "16",
      color: "#e2e8f0"
    }),
    aB: common_vendor.t($options.$t("settings.helpAndFeedback")),
    aC: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    aD: common_vendor.o((...args) => $options.openHelpAndFeedback && $options.openHelpAndFeedback(...args), "d5"),
    aE: common_vendor.p({
      type: "fas",
      name: "sync",
      size: "16",
      color: "#e2e8f0"
    }),
    aF: common_vendor.t($options.$t("settings.checkForUpdates")),
    aG: common_vendor.t($data.appVersion),
    aH: common_vendor.p({
      type: "fas",
      name: "chevron-right",
      size: "14",
      color: "#9ca3af"
    }),
    aI: common_vendor.o((...args) => $options.checkForUpdates && $options.checkForUpdates(...args), "d4"),
    aJ: common_vendor.t($options.$t("app.name")),
    aK: common_vendor.t($options.$t("app.slogan")),
    aL: !$data.showAIApiModal,
    aM: !$data.showAIApiModal,
    aN: $data.showLanguagePopup
  }, $data.showLanguagePopup ? {
    aO: common_vendor.t($options.$t("settings.selectLanguage")),
    aP: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    aQ: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args), "85"),
    aR: common_vendor.f($data.supportedLanguages, (lang, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(lang.name),
        b: $data.currentLanguage === lang.code
      }, $data.currentLanguage === lang.code ? {
        c: "45854c89-33-" + i0,
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
    aS: common_vendor.t($options.$t("common.confirm")),
    aT: common_vendor.o((...args) => $options.confirmLanguageSelection && $options.confirmLanguageSelection(...args), "46"),
    aU: $options.isTablet ? $options.tabletModalSafeTop : "",
    aV: common_vendor.o(() => {
    }, "58"),
    aW: common_vendor.o((...args) => $options.closeLanguagePopup && $options.closeLanguagePopup(...args), "54")
  } : {}, {
    aX: $data.showSleepTimerPopup
  }, $data.showSleepTimerPopup ? common_vendor.e({
    aY: common_vendor.t($options.$t("settings.sleepTimer")),
    aZ: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    ba: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "14"),
    bb: $data.sleepTimerRemaining > 0
  }, $data.sleepTimerRemaining > 0 ? {
    bc: common_vendor.t($options.formatSleepTimerRemaining),
    bd: common_vendor.o((...args) => $options.cancelSleepTimer && $options.cancelSleepTimer(...args), "1e")
  } : {}, {
    be: common_vendor.f($options.hourOptions, (hour, index, i0) => {
      return {
        a: common_vendor.t(hour),
        b: index
      };
    }),
    bf: common_vendor.f($options.minuteOptions, (minute, index, i0) => {
      return {
        a: common_vendor.t(minute),
        b: index
      };
    }),
    bg: $data.sleepTimerPickerValue,
    bh: common_vendor.o((...args) => $options.onSleepTimerPickerChange && $options.onSleepTimerPickerChange(...args), "38"),
    bi: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "aa"),
    bj: common_vendor.o((...args) => $options.confirmSleepTimerSelection && $options.confirmSleepTimerSelection(...args), "46"),
    bk: $options.isTablet ? $options.tabletModalSafeTop : "",
    bl: common_vendor.o(() => {
    }, "c2"),
    bm: common_vendor.o((...args) => $options.closeSleepTimerPopup && $options.closeSleepTimerPopup(...args), "b2")
  }) : {}, {
    bn: $data.showServerModalFlag
  }, $data.showServerModalFlag ? common_vendor.e({
    bo: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    bp: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "5c"),
    bq: $data.serverAddress,
    br: common_vendor.o(($event) => $data.serverAddress = $event.detail.value, "0d"),
    bs: $data.connectionTestResult
  }, $data.connectionTestResult ? {
    bt: common_vendor.p({
      type: "fas",
      name: $data.connectionTestResult.success ? "check-circle" : "times-circle",
      size: "16",
      color: $data.connectionTestResult.success ? "#10b981" : "#ef4444"
    }),
    bv: common_vendor.n($data.connectionTestResult.success ? "success" : "error"),
    bw: common_vendor.t($data.connectionTestResult.message),
    bx: common_vendor.n($data.connectionTestResult.success ? "success" : "error")
  } : {}, {
    by: common_vendor.o((...args) => $options.copyDeployTutorial && $options.copyDeployTutorial(...args), "67"),
    bz: $data.testingConnection
  }, $data.testingConnection ? {
    bA: common_vendor.p({
      type: "fas",
      name: "spinner",
      size: "14",
      color: "#e2e8f0"
    })
  } : {}, {
    bB: common_vendor.t($data.testingConnection ? "测试中..." : "测试"),
    bC: $data.testingConnection || !$data.serverAddress.trim() ? 1 : "",
    bD: common_vendor.o((...args) => $options.testServerConnection && $options.testServerConnection(...args), "d3"),
    bE: common_vendor.t($data.currentMeshMode === "own" ? "停用专属服务器" : "启用专属服务器"),
    bF: common_vendor.n($data.currentMeshMode === "own" ? "modal-btn--primary" : "modal-btn--secondary"),
    bG: common_vendor.s($data.currentMeshMode === "own" ? "" : {
      background: "linear-gradient(135deg, #00d7cd 0%, #00afff 100%)",
      color: "#fff"
    }),
    bH: common_vendor.o((...args) => $options.switchToOwnMode && $options.switchToOwnMode(...args), "ab"),
    bI: $options.isTablet ? $options.tabletModalSafeTop : "",
    bJ: common_vendor.o(() => {
    }, "eb"),
    bK: common_vendor.o((...args) => $options.closeServerModal && $options.closeServerModal(...args), "4f")
  }) : {}, {
    bL: $data.showShareManagementPopup
  }, $data.showShareManagementPopup ? common_vendor.e({
    bM: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    bN: common_vendor.o((...args) => $options.closeShareManagementPopup && $options.closeShareManagementPopup(...args), "25"),
    bO: common_vendor.t($data.shareConfig.status === 1 ? "已开启" : $data.shareConfig.status === 2 ? "已被踢下线" : "已关闭"),
    bP: $data.shareConfig.status === 1 ? "#10b981" : $data.shareConfig.status === 2 ? "#f59e0b" : "#ef4444",
    bQ: $data.shareConfig.status === 1
  }, $data.shareConfig.status === 1 ? common_vendor.e({
    bR: common_vendor.t($data.shareAchievement.title),
    bS: common_vendor.t($data.shareAchievement.totalCalls.toLocaleString()),
    bT: common_vendor.t($data.shareAchievement.sharedDays),
    bU: common_vendor.t($data.shareAchievement.todayCalls),
    bV: $data.shareAchievement.weekStats.length > 0
  }, $data.shareAchievement.weekStats.length > 0 ? {
    bW: common_vendor.f($data.shareAchievement.weekStats, (stat, idx, i0) => {
      return {
        a: common_vendor.t(stat.count || 0),
        b: Math.max(3, stat.count / $options.maxWeekCount * 32) + "px",
        c: common_vendor.t(idx === $data.shareAchievement.weekStats.length - 1 ? "今天" : stat.date ? stat.date.slice(5) : ""),
        d: idx
      };
    })
  } : {}, {
    bX: $data.shareAchievement.nextTitle
  }, $data.shareAchievement.nextTitle ? {
    bY: common_vendor.t($data.shareAchievement.daysToNext),
    bZ: common_vendor.t($data.shareAchievement.nextTitle)
  } : {}) : {}, {
    ca: $data.shareConfig.status !== 1
  }, $data.shareConfig.status !== 1 ? {} : {}, {
    cb: $data.shareConfig.contributor_name,
    cc: common_vendor.o(($event) => $data.shareConfig.contributor_name = $event.detail.value, "7f"),
    cd: $data.shareConfig.status === 1
  }, $data.shareConfig.status === 1 ? {
    ce: common_vendor.t($data.shareUsage.current_usage),
    cf: common_vendor.t((1e5 - $data.shareUsage.current_usage).toLocaleString())
  } : {}, {
    cg: common_vendor.s(!$options.isTablet ? {
      height: "calc(90vh - 280px)",
      maxHeight: "calc(90vh - 280px)",
      flex: "none",
      paddingBottom: "20px"
    } : {}),
    ch: common_vendor.t($data.shareConfig.daily_limit.toLocaleString()),
    ci: $data.shareSliderPercent + "%",
    cj: $data.shareSliderPercent + "%",
    ck: common_vendor.o((...args) => $options.onShareSliderTouchStart && $options.onShareSliderTouchStart(...args), "11"),
    cl: common_vendor.o((...args) => $options.onShareSliderTouchMove && $options.onShareSliderTouchMove(...args), "65"),
    cm: common_vendor.o((...args) => $options.onShareSliderTouchEnd && $options.onShareSliderTouchEnd(...args), "0d"),
    cn: $data.darkMode ? 1 : "",
    co: $data.shareConfig.status !== 1
  }, $data.shareConfig.status !== 1 ? {
    cp: common_vendor.t($data.savingShareConfig ? "保存中..." : "保存并分享"),
    cq: $data.savingShareConfig || $data.shareConfig.status === 2 ? 1 : "",
    cr: common_vendor.o((...args) => $options.saveAndShareConfig && $options.saveAndShareConfig(...args), "b7")
  } : {
    cs: common_vendor.t($data.savingShareConfig ? "处理中..." : "取消分享"),
    ct: $data.savingShareConfig ? 1 : "",
    cv: common_vendor.o((...args) => $options.cancelShareConfig && $options.cancelShareConfig(...args), "02"),
    cw: common_vendor.t($data.savingShareConfig ? "保存中..." : "保存设置"),
    cx: $data.savingShareConfig ? 1 : "",
    cy: common_vendor.o((...args) => $options.saveShareConfig && $options.saveShareConfig(...args), "c9")
  }, {
    cz: common_vendor.s($options.isTablet ? {
      paddingTop: $options.tabletModalSafeTop,
      paddingBottom: $data.totalBottomHeight + 12 + "px"
    } : {
      paddingTop: "",
      maxHeight: "90vh"
    }),
    cA: common_vendor.o(() => {
    }, "2b"),
    cB: common_vendor.o((...args) => $options.closeShareManagementPopup && $options.closeShareManagementPopup(...args), "09")
  }) : {}, {
    cC: $data.showFreeNodesPopup
  }, $data.showFreeNodesPopup ? common_vendor.e({
    cD: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    cE: common_vendor.o((...args) => $options.closeFreeNodesPopup && $options.closeFreeNodesPopup(...args), "88"),
    cF: common_vendor.t($data.currentMeshMode === "free" ? "公共服务器" : $data.currentMeshMode === "own" ? "专属服务器" : "未选择"),
    cG: $data.currentMeshMode === "free" ? "#10b981" : $data.currentMeshMode === "own" ? "#00afff" : "#9ca3af",
    cH: common_vendor.t($data.freeNodes.length),
    cI: $data.loadingFreeNodes
  }, $data.loadingFreeNodes ? {
    cJ: common_vendor.p({
      type: "fas",
      name: "spinner",
      size: "24",
      color: "#6b7280"
    })
  } : $data.freeNodes.length === 0 ? {
    cL: common_vendor.p({
      type: "fas",
      name: "globe",
      size: "40",
      color: "#d1d5db"
    })
  } : {
    cM: common_vendor.f($data.freeNodes, (node, index, i0) => {
      return common_vendor.e({
        a: node.alive === false ? "#ef4444" : (node.current_usage || 0) >= (node.daily_limit || 0) ? "#f59e0b" : "#10b981",
        b: common_vendor.t(node.contributor_name || "匿名分享者"),
        c: node.alive === false
      }, node.alive === false ? {} : (node.current_usage || 0) >= (node.daily_limit || 0) ? {} : {
        e: common_vendor.t(node.latency > 0 ? node.latency + "ms" : "")
      }, {
        d: (node.current_usage || 0) >= (node.daily_limit || 0),
        f: common_vendor.t(node.daily_limit || 0),
        g: common_vendor.t(node.current_usage || 0),
        h: node.node_url === $data.preferredNodeUrl
      }, node.node_url === $data.preferredNodeUrl ? {} : {}, {
        i: node.node_url === $data.activeNodeUrl
      }, node.node_url === $data.activeNodeUrl ? {} : {}, {
        j: index,
        k: node.node_url === $data.preferredNodeUrl ? "2px solid #00afff" : node.node_url === $data.activeNodeUrl && node.node_url !== $data.preferredNodeUrl ? "2px solid #10b981" : "2px solid transparent",
        l: common_vendor.o(($event) => $options.selectPreferredNode(node), index)
      });
    }),
    cN: $data.darkMode ? "#f0f0f0" : "#374151"
  }, {
    cK: $data.freeNodes.length === 0
  }, {}, {
    cX: common_vendor.s(!$options.isTablet ? {
      height: "calc(70vh - 130px)",
      maxHeight: "calc(70vh - 130px)",
      flex: "none"
    } : {}),
    cY: common_vendor.o((...args) => $options.refreshFreeNodes && $options.refreshFreeNodes(...args), "7a"),
    cZ: common_vendor.t($data.currentMeshMode === "free" ? "停用公共服务器" : "启用公共服务器"),
    da: common_vendor.o((...args) => $options.switchToFreeMode && $options.switchToFreeMode(...args), "de"),
    db: common_vendor.s($options.isTablet ? {
      paddingTop: $options.tabletModalSafeTop,
      paddingBottom: $data.totalBottomHeight + 12 + "px"
    } : {
      paddingTop: ""
    }),
    dc: common_vendor.o(() => {
    }, "13"),
    dd: common_vendor.o((...args) => $options.closeFreeNodesPopup && $options.closeFreeNodesPopup(...args), "15")
  }) : {}, {
    de: $data.showResourceCachePopup
  }, $data.showResourceCachePopup ? {
    df: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    dg: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args), "53"),
    dh: common_vendor.t($data.resourceCacheSize),
    di: common_vendor.t($data.appCacheSize),
    dj: common_vendor.t($data.musicUrlCacheSize),
    dk: common_vendor.t($data.musicUrlCacheCount),
    dl: common_vendor.t($data.audioFileCacheSize),
    dm: common_vendor.t($data.cleaningResourceCache ? "清理中..." : "清理缓存"),
    dn: $data.cleaningResourceCache ? 1 : "",
    dp: common_vendor.o((...args) => $options.cleanResourceCache && $options.cleanResourceCache(...args), "ee"),
    dq: $options.isTablet ? $options.tabletModalSafeTop : "",
    dr: common_vendor.o(() => {
    }, "5a"),
    ds: common_vendor.o((...args) => $options.closeResourceCachePopup && $options.closeResourceCachePopup(...args), "48")
  } : {}, {
    dt: $data.showMetaCachePopup
  }, $data.showMetaCachePopup ? {
    dv: common_vendor.p({
      type: "fas",
      name: "times",
      size: "16",
      color: "#e2e8f0"
    }),
    dw: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args), "21"),
    dx: common_vendor.t($data.metaCacheSize),
    dy: common_vendor.t($data.otherSourceCacheSize),
    dz: common_vendor.t($data.lyricCacheSize),
    dA: common_vendor.t($data.cleaningOtherSource ? "清理中..." : "清理换源歌曲缓存"),
    dB: $data.cleaningOtherSource ? 1 : "",
    dC: common_vendor.o((...args) => $options.cleanOtherSourceCache && $options.cleanOtherSourceCache(...args), "bb"),
    dD: common_vendor.t($data.cleaningLyric ? "清理中..." : "清理歌词缓存"),
    dE: $data.cleaningLyric ? 1 : "",
    dF: common_vendor.o((...args) => $options.cleanLyricCache && $options.cleanLyricCache(...args), "76"),
    dG: $options.isTablet ? $options.tabletModalSafeTop : "",
    dH: common_vendor.o(() => {
    }, "73"),
    dI: common_vendor.o((...args) => $options.closeMetaCachePopup && $options.closeMetaCachePopup(...args), "d3")
  } : {}, {
    dJ: $data.showAIApiModal
  }, $data.showAIApiModal ? common_vendor.e({
    dK: common_vendor.p({
      type: "fas",
      name: "xmark",
      size: "20",
      color: "#999"
    }),
    dL: common_vendor.o((...args) => $options.closeAIApiModal && $options.closeAIApiModal(...args), "bc"),
    dM: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "14",
      color: "#e2e8f0"
    }),
    dN: common_vendor.p({
      type: "fas",
      name: "server",
      size: "16",
      color: "#e2e8f0"
    }),
    dO: common_vendor.t($data.platformPresets.backend.label),
    dP: common_vendor.t($data.platformPresets.backend.desc),
    dQ: $data.apiConfig.provider === "backend"
  }, $data.apiConfig.provider === "backend" ? {} : {}, {
    dR: $data.activePlatform === "backend" ? 1 : "",
    dS: common_vendor.o(($event) => $options.selectPlatform("backend"), "b8"),
    dT: common_vendor.p({
      type: "fas",
      name: "brain",
      size: "16",
      color: "#e2e8f0"
    }),
    dU: common_vendor.t($data.platformPresets.deepseek.label),
    dV: common_vendor.t($data.platformPresets.deepseek.desc),
    dW: $data.apiConfig.provider === "deepseek" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "deepseek" && $data.apiConfig.apiKey ? {} : {}, {
    dX: $data.activePlatform === "deepseek" ? 1 : "",
    dY: common_vendor.o(($event) => $options.selectPlatform("deepseek"), "07"),
    dZ: common_vendor.p({
      type: "fas",
      name: "microchip",
      size: "16",
      color: "#e2e8f0"
    }),
    ea: common_vendor.t($data.platformPresets.openai.label),
    eb: common_vendor.t($data.platformPresets.openai.desc),
    ec: $data.apiConfig.provider === "openai" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "openai" && $data.apiConfig.apiKey ? {} : {}, {
    ed: $data.activePlatform === "openai" ? 1 : "",
    ee: common_vendor.o(($event) => $options.selectPlatform("openai"), "8a"),
    ef: common_vendor.p({
      type: "fas",
      name: "bolt",
      size: "16",
      color: "#e2e8f0"
    }),
    eg: common_vendor.t($data.platformPresets.siliconflow.label),
    eh: common_vendor.t($data.platformPresets.siliconflow.desc),
    ei: $data.apiConfig.provider === "siliconflow" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "siliconflow" && $data.apiConfig.apiKey ? {} : {}, {
    ej: $data.activePlatform === "siliconflow" ? 1 : "",
    ek: common_vendor.o(($event) => $options.selectPlatform("siliconflow"), "42"),
    el: common_vendor.p({
      type: "fas",
      name: "gear",
      size: "16",
      color: "#e2e8f0"
    }),
    em: common_vendor.t($data.platformPresets.custom.label),
    en: common_vendor.t($data.platformPresets.custom.desc),
    eo: $data.apiConfig.provider === "custom" && $data.apiConfig.apiKey
  }, $data.apiConfig.provider === "custom" && $data.apiConfig.apiKey ? {} : {}, {
    ep: $data.activePlatform === "custom" ? 1 : "",
    eq: common_vendor.o(($event) => $options.selectPlatform("custom"), "f6"),
    er: $data.activePlatform && $data.activePlatform !== "backend"
  }, $data.activePlatform && $data.activePlatform !== "backend" ? {
    es: $options.getApiUrlPlaceholder(),
    et: $data.currentApiUrl,
    ev: common_vendor.o(($event) => $data.currentApiUrl = $event.detail.value, "0d"),
    ew: $data.showApiKey ? "text" : "password",
    ex: $data.currentApiKey,
    ey: common_vendor.o(($event) => $data.currentApiKey = $event.detail.value, "08"),
    ez: common_vendor.p({
      type: "fas",
      name: $data.showApiKey ? "eye-slash" : "eye",
      size: "16",
      color: "#9ca3af"
    }),
    eA: common_vendor.o(($event) => $data.showApiKey = !$data.showApiKey, "2a"),
    eB: $options.getModelPlaceholder(),
    eC: $data.currentModelName,
    eD: common_vendor.o(($event) => $data.currentModelName = $event.detail.value, "b2")
  } : {}, {
    eE: common_vendor.s($options.getModalBodyStyle()),
    eF: common_vendor.t($data.activePlatform === "backend" ? "使用默认后端" : "保存配置"),
    eG: common_vendor.o((...args) => $options.saveCurrentApiConfig && $options.saveCurrentApiConfig(...args), "e0"),
    eH: common_vendor.s($options.getModalFooterStyle()),
    eI: common_vendor.s($options.getTabletModalStyle()),
    eJ: common_vendor.o(() => {
    }, "c0"),
    eK: $data.darkMode ? 1 : "",
    eL: $options.isTablet ? 1 : "",
    eM: common_vendor.o((...args) => $options.closeAIApiModal && $options.closeAIApiModal(...args), "1f")
  }) : {}, {
    eN: $data.showAboutPopup
  }, $data.showAboutPopup ? {
    eO: common_vendor.p({
      type: "fas",
      name: "wave-square",
      size: "20",
      color: "#ffffff"
    }),
    eP: common_vendor.t($data.appVersion),
    eQ: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args), "fc"),
    eR: common_vendor.o(() => {
    }, "33"),
    eS: common_vendor.o((...args) => $options.closeAboutPopup && $options.closeAboutPopup(...args), "38")
  } : {}, {
    eT: $data.showUserAgreementPopup
  }, $data.showUserAgreementPopup ? common_vendor.e({
    eU: $data.pactAgreed
  }, $data.pactAgreed ? {
    eV: common_vendor.p({
      type: "fas",
      name: "check-circle",
      size: "14",
      color: "#10b981"
    })
  } : {}, {
    eW: $data.pactAgreed
  }, $data.pactAgreed ? {
    eX: common_vendor.p({
      type: "fas",
      name: "info-circle",
      size: "16",
      color: "#e2e8f0"
    }),
    eY: common_vendor.t($options.pactAgreedTime)
  } : {}, {
    eZ: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args), "c8"),
    fa: common_vendor.o(() => {
    }, "94"),
    fb: common_vendor.o((...args) => $options.closeUserAgreementPopup && $options.closeUserAgreementPopup(...args), "a0")
  }) : {}, {
    fc: common_vendor.o($options.closeUpdatePopup, "88"),
    fd: common_vendor.p({
      visible: $data.showUpdatePopup,
      ["update-info"]: $data.updateInfo,
      ["dark-mode"]: $data.darkMode
    }),
    fe: $data.copyToastVisible
  }, $data.copyToastVisible ? {
    ff: common_vendor.t($data.copyToastText)
  } : {}, {
    fg: $data.showCompatModal
  }, $data.showCompatModal ? {
    fh: common_vendor.t(((_a = $data.compatModalData) == null ? void 0 : _a.title) || "版本兼容性提示"),
    fi: common_vendor.t((_b = $data.compatModalData) == null ? void 0 : _b.content),
    fj: common_vendor.o((...args) => $options.closeCompatModal && $options.closeCompatModal(...args), "05"),
    fk: common_vendor.o(() => {
    }, "4b"),
    fl: common_vendor.o((...args) => $options.closeCompatModal && $options.closeCompatModal(...args), "ac")
  } : {}, {
    fm: $data.darkMode ? 1 : "",
    fn: $options.isTablet ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
exports.MiniProgramPage = MiniProgramPage;
