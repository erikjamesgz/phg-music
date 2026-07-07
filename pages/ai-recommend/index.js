"use strict";
const common_vendor = require("../../common/vendor.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
const services_api = require("../../services/api.js");
const utils_system = require("../../utils/system.js");
const composables_useBottomHeight = require("../../composables/useBottomHeight.js");
const utils_lyric = require("../../utils/lyric.js");
const utils_lyricCache = require("../../utils/lyricCache.js");
const utils_kgLyricDecoder = require("../../utils/kgLyricDecoder.js");
const utils_config = require("../../utils/config.js");
const utils_storage = require("../../utils/storage.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const TABLET_ASPECT_RATIO = 0.85;
const TABLET_MIN_WIDTH = 400;
const customPromptPlaceholder = "描述你想听什么样的音乐，例如：\n• 我今天心情不太好，想听一些温暖治愈的歌\n• 最近迷上了80年代的City Pop\n• 推荐一些适合雨天听的爵士乐\n• 想要节奏感强、适合跑步时听的音乐";
const PREF_STORAGE_KEY = "aiRecommendPreferences";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const instance = common_vendor.getCurrentInstance();
    const menuButtonInfo = common_vendor.ref(utils_system.getMenuButtonInfo());
    const isMiniProgram = common_vendor.ref(false);
    isMiniProgram.value = true;
    const rightSafeDistance = common_vendor.computed(() => {
      if (!isMiniProgram.value || !menuButtonInfo.value)
        return "24rpx";
      const screenWidth2 = common_vendor.index.getSystemInfoSync().screenWidth;
      const menuRight = menuButtonInfo.value.right;
      const distanceFromRight = screenWidth2 - menuRight;
      const safeDistance = Math.max(distanceFromRight + 10, 20);
      return `${safeDistance}px`;
    });
    const showAIApiModal = common_vendor.ref(false);
    const showGuideToSettings = common_vendor.ref(false);
    const guideMessage = common_vendor.ref("");
    const activePlatform = common_vendor.ref("backend");
    const apiConfig = common_vendor.ref({
      provider: "backend",
      apiKey: "",
      baseURL: "",
      model: ""
    });
    const currentApiUrl = common_vendor.ref("");
    const currentApiKey = common_vendor.ref("");
    const currentModelName = common_vendor.ref("");
    const showApiKey = common_vendor.ref(false);
    const platformPresets = {
      backend: {
        label: "默认后端",
        icon: "🌐",
        defaultBaseURL: "/api/ai/chat",
        defaultModel: "",
        desc: "使用应用内置AI接口，无需配置"
      },
      deepseek: {
        label: "DeepSeek",
        icon: "🧠",
        defaultBaseURL: "https://api.deepseek.com",
        defaultModel: "deepseek-chat",
        desc: "高性价比，适合中文场景"
      },
      openai: {
        label: "OpenAI",
        icon: "🤖",
        defaultBaseURL: "https://api.openai.com/v1",
        defaultModel: "gpt-4o-mini",
        desc: "业界标杆，功能强大"
      },
      siliconflow: {
        label: "硅基流动",
        icon: "⚡",
        defaultBaseURL: "https://api.siliconflow.cn/v1",
        defaultModel: "deepseek-ai/DeepSeek-V3",
        desc: "国产平台，免费额度多"
      },
      custom: {
        label: "自定义",
        icon: "⚙️",
        defaultBaseURL: "",
        defaultModel: "",
        desc: "支持任意兼容OpenAI的API"
      }
    };
    const loadAIApiConfig = () => {
      try {
        const savedConfig = common_vendor.index.getStorageSync("aiApiConfig");
        if (savedConfig) {
          apiConfig.value = savedConfig;
          activePlatform.value = savedConfig.provider || "backend";
          console.log("[AIRecommend] ✅ 已加载AI API配置:", {
            provider: savedConfig.provider,
            hasApiKey: !!savedConfig.apiKey,
            baseURL: savedConfig.baseURL ? savedConfig.baseURL.substring(0, 30) + "..." : ""
          });
        }
        updateCurrentInputFields();
      } catch (e) {
        console.error("[AIRecommend] ❌ 加载AI API配置失败:", e);
      }
    };
    const updateCurrentInputFields = () => {
      const preset = platformPresets[activePlatform.value];
      if (preset) {
        currentApiUrl.value = apiConfig.value.baseURL || preset.defaultBaseURL || "";
        currentApiKey.value = apiConfig.value.apiKey || "";
        currentModelName.value = apiConfig.value.model || preset.defaultModel || "";
      }
    };
    const getApiUrlPlaceholder = () => {
      const preset = platformPresets[activePlatform.value];
      return preset ? `例如: ${preset.defaultBaseURL || "https://api.example.com/v1"}` : "请输入API地址";
    };
    const getModelPlaceholder = () => {
      const preset = platformPresets[activePlatform.value];
      return preset && preset.defaultModel ? `默认: ${preset.defaultModel}` : "请输入模型名称";
    };
    const selectPlatform = (platform) => {
      console.log("[AIRecommend] 选择平台:", platform);
      activePlatform.value = platform;
      updateCurrentInputFields();
    };
    const closeAIApiModal = () => {
      showAIApiModal.value = false;
      showApiKey.value = false;
    };
    const saveAIApiConfig = () => {
      const newConfig = {
        provider: activePlatform.value,
        apiKey: activePlatform.value === "backend" ? "" : currentApiKey.value.trim(),
        baseURL: activePlatform.value === "backend" ? "/api/ai/chat" : currentApiUrl.value.trim(),
        model: activePlatform.value === "backend" ? "" : currentModelName.value.trim()
      };
      if (activePlatform.value !== "backend") {
        if (!newConfig.apiKey) {
          common_vendor.index.showToast({ title: "请输入API密钥", icon: "none" });
          return;
        }
        if (!newConfig.baseURL) {
          common_vendor.index.showToast({ title: "请输入API地址", icon: "none" });
          return;
        }
      }
      try {
        common_vendor.index.setStorageSync("aiApiConfig", newConfig);
        apiConfig.value = newConfig;
        console.log("[AIRecommend] ✅ AI API配置已保存:", {
          provider: newConfig.provider,
          hasApiKey: !!newConfig.apiKey,
          baseURL: newConfig.baseURL ? newConfig.baseURL.substring(0, 30) + "..." : ""
        });
        common_vendor.index.showToast({ title: "配置已保存", icon: "success" });
        closeAIApiModal();
      } catch (e) {
        console.error("[AIRecommend] ❌ 保存AI API配置失败:", e);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      }
    };
    const closeGuideModal = () => {
      showGuideToSettings.value = false;
    };
    const goToSettingsForAI = () => {
      closeGuideModal();
      closeAIApiModal();
      common_vendor.index.navigateTo({
        url: "/pages/settings/index?showAiConfig=true"
      });
    };
    const useDefaultBackend = () => {
      const newConfig = {
        provider: "backend",
        apiKey: "",
        baseURL: "/api/ai/chat",
        model: ""
      };
      try {
        common_vendor.index.setStorageSync("aiApiConfig", newConfig);
        apiConfig.value = newConfig;
        activePlatform.value = "backend";
        console.log("[AIRecommend] ✅ 已切换到默认后端模式");
        common_vendor.index.showToast({ title: "已切换到默认后端", icon: "success" });
        closeGuideModal();
      } catch (e) {
        console.error("[AIRecommend] ❌ 切换到默认后端失败:", e);
        common_vendor.index.showToast({ title: "切换失败", icon: "none" });
      }
    };
    const showGuideToSettingsModal = (message = "需要配置AI接口才能使用智能推荐功能") => {
      guideMessage.value = message;
      showGuideToSettings.value = true;
    };
    common_vendor.ref(480);
    common_vendor.ref(1);
    const actualTurntableSize = common_vendor.ref(240);
    let isCalculating = false;
    const albumCoverWrapperStyle = common_vendor.computed(() => ({}));
    const turntableSizeStyle = common_vendor.computed(() => ({
      width: `${actualTurntableSize.value}px`,
      height: `${actualTurntableSize.value}px`
    }));
    const turntableShadowStyle = common_vendor.computed(() => ({
      width: `${actualTurntableSize.value * 0.8}px`,
      // 阴影宽度是转盘的80%
      height: `${actualTurntableSize.value * 0.15}px`
      // 阴影高度
    }));
    common_vendor.computed(() => Math.round(actualTurntableSize.value * 0.167));
    const visualStageStyle = common_vendor.computed(() => ({
      width: `${actualTurntableSize.value}px`,
      height: `${actualTurntableSize.value}px`
    }));
    const calculateTurntableActualSize = (containerHeight, containerMaxWidth) => {
      const SAFETY_MARGIN = showPreferencePanel.value ? 40 : 25;
      const safeHeight = Math.max(0, containerHeight - SAFETY_MARGIN);
      const safeWidth = Math.max(0, containerMaxWidth - SAFETY_MARGIN);
      const sizeBasedOnHeight = safeHeight * 0.8;
      const finalSize = Math.min(sizeBasedOnHeight, safeWidth);
      const MIN_SIZE = 120;
      const MAX_SIZE = 320;
      actualTurntableSize.value = Math.max(MIN_SIZE, Math.min(finalSize, MAX_SIZE));
      console.log("[Turntable-Calc] 🎯 尺寸计算:");
      console.log(`   容器高度: ${Math.round(containerHeight)}px`);
      console.log(`   容器最大宽度: ${Math.round(containerMaxWidth)}px`);
      console.log(`   安全边距: ${SAFETY_MARGIN}px (偏好面板${showPreferencePanel.value ? "已展开" : "收起"})`);
      console.log(`   高度×80%: ${Math.round(sizeBasedOnHeight)}px`);
      console.log(`   最终转盘尺寸: ${actualTurntableSize.value}px`);
      console.log(`   内圈尺寸(66.7%): ${Math.round(actualTurntableSize.value * 0.667)}px`);
      return actualTurntableSize.value;
    };
    const calculateTurntableSize = () => {
      if (isCalculating) {
        console.log("[AIRecommend-Turntable] ⏳ 正在计算中，跳过本次调用");
        return;
      }
      isCalculating = true;
      try {
        setTimeout(() => {
          const query = common_vendor.index.createSelectorQuery();
          query.select(".slide-indicator").boundingClientRect();
          query.select(".album-cover-wrapper").boundingClientRect();
          query.select(".song-info-wrapper").boundingClientRect();
          query.select(".album-view").boundingClientRect();
          query.exec((results) => {
            try {
              const indicatorRect = results[0];
              const containerRect = results[1];
              const songInfoRect = results[2];
              const albumViewRect = results[3];
              if (!containerRect || !indicatorRect || !songInfoRect) {
                console.warn("[AIRecommend-Turntable] ⚠️ 标准查询失败，使用容器自适应尺寸");
                const sysInfo = common_vendor.index.getSystemInfoSync();
                const screenWidth2 = sysInfo.windowWidth || 375;
                const screenHeight = sysInfo.windowHeight || 669;
                const viewWidth = albumViewRect ? albumViewRect.width : containerRect ? containerRect.width : screenWidth2;
                const viewHeight = albumViewRect ? albumViewRect.height : 0;
                const wrapperHeight = containerRect ? containerRect.height : 0;
                const wrapperWidth = containerRect ? containerRect.width : viewWidth;
                console.log(`[AIRecommend-Turntable] 📐 备用: albumView=${Math.round(viewWidth)}x${Math.round(viewHeight)} wrapper=${Math.round(wrapperWidth)}x${Math.round(wrapperHeight)} 屏幕=${screenWidth2}x${screenHeight}`);
                const SAFETY_MARGIN = showPreferencePanel.value ? 40 : 25;
                let availableSize;
                if (wrapperHeight > 0 && wrapperWidth > 0) {
                  const usableHeight = wrapperHeight - 15;
                  availableSize = Math.min((usableHeight - SAFETY_MARGIN) * 0.85, (wrapperWidth - SAFETY_MARGIN) * 0.88);
                } else if (wrapperWidth > 0) {
                  const estBottomRatio = showPreferencePanel.value ? 0.62 : 0.46;
                  const estBottom = screenHeight * estBottomRatio;
                  availableSize = Math.min(screenHeight - estBottom - SAFETY_MARGIN, (wrapperWidth - SAFETY_MARGIN) * 0.85);
                } else {
                  availableSize = Math.min((screenWidth2 - SAFETY_MARGIN) * 0.8, (screenHeight - SAFETY_MARGIN) * 0.38);
                }
                actualTurntableSize.value = Math.max(140, Math.min(availableSize, 300));
                console.log(`[AIRecommend-Turntable] ✅ 最终尺寸: ${actualTurntableSize.value}px (安全边距:${SAFETY_MARGIN}px)`);
                isCalculating = false;
                return;
              }
              const availableContainerHeight = songInfoRect.top - indicatorRect.bottom;
              const containerMaxWidth = containerRect ? containerRect.width : albumViewRect ? albumViewRect.width : screenWidth;
              console.log("[AIRecommend-Turntable] 📐 布局信息:");
              console.log(`   指示器底部: ${Math.round(indicatorRect.bottom)}px`);
              console.log(`   歌名顶部: ${Math.round(songInfoRect.top)}px`);
              console.log(`   可用容器高度: ${Math.round(availableContainerHeight)}px`);
              console.log(`   容器最大宽度: ${Math.round(containerMaxWidth)}px`);
              calculateTurntableActualSize(availableContainerHeight, containerMaxWidth);
              setTimeout(() => {
                verifyActualRenderedSizes();
              }, 150);
            } catch (innerError) {
              console.error("[AIRecommend-Turntable] ❌ 计算错误:", innerError);
            } finally {
              isCalculating = false;
            }
          });
        }, 50);
      } catch (e) {
        console.error("[AIRecommend-Turntable] ❌ 查询失败:", e);
        isCalculating = false;
      }
    };
    const verifyActualRenderedSizes = () => {
      try {
        const query = common_vendor.index.createSelectorQuery();
        query.select(".turntable").boundingClientRect();
        query.select(".turntable-cover").boundingClientRect();
        query.exec((results) => {
          if (results && results[0] && results[1]) {
            const outer = results[0];
            const inner = results[1];
            console.log("[Turntable-Verify] ✓ 实际渲染:");
            console.log(`   外圈: ${Math.round(outer.width)}×${Math.round(outer.height)}px`);
            console.log(`   内圈: ${Math.round(inner.width)}×${Math.round(inner.height)}px`);
            console.log(`   比例: ${(inner.width / outer.width * 100).toFixed(1)}%`);
          }
        });
      } catch (e) {
        console.error("[Turntable-Verify] ❌ 验证失败:", e);
      }
    };
    const delayedCalculateTurntableSize = () => {
      setTimeout(() => {
        calculateTurntableSize();
      }, 300);
    };
    const darkMode = common_vendor.ref(common_vendor.index.getStorageSync("darkMode") === "true");
    const isTablet = common_vendor.ref(false);
    const checkTabletMode = () => {
      try {
        const { windowWidth, windowHeight } = common_vendor.index.getSystemInfoSync();
        const aspectRatio = windowWidth / windowHeight;
        isTablet.value = aspectRatio >= TABLET_ASPECT_RATIO && windowWidth >= TABLET_MIN_WIDTH;
        console.log("[AIRecommend] 屏幕:", windowWidth, "x", windowHeight, "宽高比:", aspectRatio.toFixed(2), "平板模式:", isTablet.value);
      } catch (e) {
        console.error("[AIRecommend] 检测平板模式失败:", e);
        isTablet.value = false;
      }
    };
    common_vendor.index.onWindowResize(() => {
      checkTabletMode();
      delayedCalculateTurntableSize();
    });
    checkTabletMode();
    const navbarStyle = common_vendor.computed(() => ({
      paddingTop: `${statusBarHeight.value}px`,
      paddingLeft: rightSafeDistance.value,
      paddingRight: rightSafeDistance.value
    }));
    const { bottomPaddingStyle, bottomMarginStyle, totalBottomHeight, isMiniPlayerVisible } = composables_useBottomHeight.useBottomHeight();
    const aiApiModalTabletStyle = common_vendor.computed(() => {
      if (!isTablet.value)
        return {};
      const bottomHeight = totalBottomHeight.value || 0;
      return {
        paddingBottom: `${bottomHeight}px`
      };
    });
    common_vendor.computed(() => ({}));
    const isLoading = common_vendor.ref(true);
    const hasError = common_vendor.ref(false);
    const errorMessage = common_vendor.ref("");
    const isRefreshing = common_vendor.ref(false);
    const loadingText = common_vendor.ref("AI 正在分析你的听歌习惯...");
    const loadingSubtext = common_vendor.ref("这可能需要几秒钟时间");
    const aiStatusText = common_vendor.ref("正在基于听歌画像构建协同特征");
    const getRecommendGlobalLock = () => {
      const app = getApp();
      if (!app.globalData)
        app.globalData = {};
      return app.globalData;
    };
    const isAIRecommendRunning = () => {
      try {
        return !!getRecommendGlobalLock().aiRecommendRunning;
      } catch (e) {
        return false;
      }
    };
    const setAIRecommendRunning = (running) => {
      try {
        getRecommendGlobalLock().aiRecommendRunning = !!running;
      } catch (e) {
      }
    };
    let recommendRunningCheckTimer = null;
    const recommendations = common_vendor.ref([]);
    const generateTime = common_vendor.ref(null);
    const backupRecommendations = common_vendor.ref([]);
    const currentLoadingIndex = common_vendor.ref(-1);
    const playlistInfo = common_vendor.ref({
      title: "",
      subtitle: "",
      reason: "",
      songCount: 0,
      id: "",
      createTime: null
    });
    common_vendor.computed(() => {
      const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
      ];
      const hash = playlistInfo.value.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return gradients[Math.abs(hash) % gradients.length];
    });
    const userProfileData = common_vendor.ref(null);
    const isAnalyzingProfile = common_vendor.ref(false);
    const profileUpdateTime = common_vendor.ref("");
    const sceneOptions = [
      { label: "开车提神", icon: "car-side", hint: "节奏明快防瞌睡" },
      { label: "深夜助眠", icon: "moon", hint: "舒缓安静助睡眠" },
      { label: "运动健身", icon: "dumbbell", hint: "高能量燃向" },
      { label: "工作学习", icon: "book-open", hint: "不抢注意力" },
      { label: "聚会派对", icon: "champagne-glasses", hint: "DJ舞曲气氛热" },
      { label: "独处放空", icon: "mug-hot", hint: "氛围感慢节奏" },
      { label: "情绪低落", icon: "hand-holding-heart", hint: "治愈系温暖" },
      { label: "兴奋High", icon: "bolt-lightning", hint: "电子摇滚爆发力" }
    ];
    const selectedScene = common_vendor.ref(-1);
    const exploreOptions = [
      { label: "符合口味", value: "strict" },
      { label: "适度拓展", value: "moderate" },
      { label: "惊喜发现", value: "surprise" }
    ];
    const selectedExplore = common_vendor.ref(-1);
    const eraOptions = [
      { label: "不限年代", value: "any" },
      { label: "经典怀旧", value: "classic" },
      { label: "千禧金曲", value: "millennium" },
      { label: "2010s热单", value: "2010s" },
      { label: "最新潮流", value: "latest" }
    ];
    const selectedEra = common_vendor.ref(-1);
    const langOptions = [
      { label: "不限语言", value: "any" },
      { label: "华语为主", value: "chinese" },
      { label: "欧美为主", value: "western" },
      { label: "日韩", value: "japanese_korean" },
      { label: "多语混合", value: "mixed" }
    ];
    const selectedLang = common_vendor.ref(-1);
    const showPreferencePanel = common_vendor.ref(false);
    const prefMode = common_vendor.ref("fixed");
    const customPromptText = common_vendor.ref("");
    const loadPreferencesFromStorage = () => {
      try {
        const saved = common_vendor.index.getStorageSync(PREF_STORAGE_KEY);
        if (saved && typeof saved === "object") {
          selectedScene.value = typeof saved.selectedScene === "number" ? saved.selectedScene : -1;
          selectedExplore.value = typeof saved.selectedExplore === "number" ? saved.selectedExplore : -1;
          selectedEra.value = typeof saved.selectedEra === "number" ? saved.selectedEra : -1;
          selectedLang.value = typeof saved.selectedLang === "number" ? saved.selectedLang : -1;
          if (saved.prefMode === "fixed" || saved.prefMode === "custom") {
            prefMode.value = saved.prefMode;
          }
          if (typeof saved.customPromptText === "string") {
            customPromptText.value = saved.customPromptText;
          }
          console.log("[AIRecommend] 已恢复偏好选择:", saved);
        }
      } catch (e) {
        console.warn("[AIRecommend] 读取偏好存储失败:", e);
      }
    };
    const savePreferencesToStorage = () => {
      try {
        const data = {
          selectedScene: selectedScene.value,
          selectedExplore: selectedExplore.value,
          selectedEra: selectedEra.value,
          selectedLang: selectedLang.value,
          prefMode: prefMode.value,
          customPromptText: customPromptText.value
        };
        common_vendor.index.setStorageSync(PREF_STORAGE_KEY, data);
      } catch (e) {
        console.warn("[AIRecommend] 保存偏好存储失败:", e);
      }
    };
    loadPreferencesFromStorage();
    const selectScene = (idx) => {
      selectedScene.value = selectedScene.value === idx ? -1 : idx;
      savePreferencesToStorage();
    };
    const selectExplore = (idx) => {
      selectedExplore.value = selectedExplore.value === idx ? -1 : idx;
      savePreferencesToStorage();
    };
    const selectEra = (idx) => {
      selectedEra.value = selectedEra.value === idx ? -1 : idx;
      savePreferencesToStorage();
    };
    const selectLang = (idx) => {
      selectedLang.value = selectedLang.value === idx ? -1 : idx;
      savePreferencesToStorage();
    };
    const togglePreferencePanel = () => {
      showPreferencePanel.value = !showPreferencePanel.value;
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          calculateTurntableSize();
        }, 350);
      });
    };
    const handleBackToAdjustPreferences = () => {
      console.log("[AIRecommend] 🔄 用户点击调整偏好，返回状态一");
      if (recommendations.value.length > 0) {
        backupRecommendations.value = [...recommendations.value];
      }
      recommendations.value = [];
      showPreferencePanel.value = true;
      resultPage.value = 0;
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          calculateTurntableSize();
        }, 350);
      });
    };
    const handleBackToPlaylist = () => {
      if (backupRecommendations.value.length === 0) {
        console.warn("[AIRecommend] ⚠️ 无备份的推荐列表可恢复");
        return;
      }
      console.log(`[AIRecommend] ↩️ 返回推荐列表，恢复 ${backupRecommendations.value.length} 首歌曲`);
      recommendations.value = [...backupRecommendations.value];
      backupRecommendations.value = [];
      showPreferencePanel.value = false;
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          calculateTurntableSize();
        }, 350);
      });
    };
    const hasActivePreferences = common_vendor.computed(
      () => (
        // 固定场景模式：有任一选项被选中
        prefMode.value === "fixed" && (selectedScene.value >= 0 || selectedExplore.value >= 0 || selectedEra.value >= 0 || selectedLang.value >= 0) || // 自定义模式：有输入内容
        prefMode.value === "custom" && customPromptText.value.trim().length > 0
      )
    );
    const resultPage = common_vendor.ref(0);
    common_vendor.computed(() => {
      if (!currentSongForLab.value)
        return "--";
      const idx = recommendations.value.findIndex((s) => {
        var _a, _b;
        return s.name === ((_a = currentSongForLab.value) == null ? void 0 : _a.name) && s.singer === ((_b = currentSongForLab.value) == null ? void 0 : _b.singer);
      });
      if (idx < 0)
        return Math.floor(85 + Math.random() * 14);
      return Math.floor(Math.max(75, 98 - idx * 0.5));
    });
    const handleSaveAllToFavorite = () => {
      const favoriteStore = useFavoriteStore();
      let addedCount = 0;
      recommendations.value.forEach((song) => {
        if (!favoriteStore.isFavorite(song.name, song.singer)) {
          favoriteStore.addFavorite({
            name: song.name,
            singer: song.singer,
            source: song.source || "kw",
            ...song
          });
          addedCount++;
        }
      });
      common_vendor.index.showToast({ title: `已保存 ${addedCount} 首`, icon: "success" });
    };
    const calculateAvgCompletionRate = (playRecord) => {
      if (!playRecord || !playRecord.completions || playRecord.completions.length === 0)
        return 0;
      const total = playRecord.completions.reduce((sum, c) => sum + (c.rate || 0), 0);
      return (total / playRecord.completions.length * 100).toFixed(1);
    };
    common_vendor.computed(() => store_modules_player.playerStore.getState().showMiniPlayer);
    const currentSongId = common_vendor.computed(() => {
      var _a;
      return (_a = store_modules_player.playerStore.getState().currentSong) == null ? void 0 : _a.id;
    });
    common_vendor.computed(() => store_modules_player.playerStore.getState().playing);
    const loadingMessages = [
      { text: "AI 正在分析你的听歌习惯...", sub: "这可能需要几秒钟时间" },
      { text: "正在识别你喜欢的音乐风格...", sub: "已分析历史播放记录" },
      { text: "正在匹配适合你的歌曲...", sub: "参考收藏列表和偏好" },
      { text: "正在过滤不合适的内容...", sub: "排除不喜欢的内容" },
      { text: "即将完成推荐...", sub: "请稍候" }
    ];
    let loadingMessageIndex = 0;
    let loadingMessageTimer = null;
    common_vendor.onShow(() => {
      console.log("[AIRecommend] 页面显示，加载基础数据");
      loadAIApiConfig();
      if (isAIRecommendRunning()) {
        console.log("[AIRecommend] ⚠️ 检测到已有AI推荐在后台运行，恢复loading状态");
        isRefreshing.value = true;
        isLoading.value = true;
        if (recommendRunningCheckTimer)
          clearTimeout(recommendRunningCheckTimer);
        const checkRecommendDone = () => {
          if (!isAIRecommendRunning()) {
            console.log("[AIRecommend] ✅ 后台AI推荐已完成，加载缓存结果");
            isRefreshing.value = false;
            isLoading.value = false;
            loadCachedDataOnly();
            return;
          }
          recommendRunningCheckTimer = setTimeout(checkRecommendDone, 1e3);
        };
        recommendRunningCheckTimer = setTimeout(checkRecommendDone, 1e3);
      } else {
        loadCachedDataOnly();
      }
      delayedCalculateTurntableSize();
    });
    const loadCachedDataOnly = async () => {
      try {
        console.log("[AIRecommend] 📦 仅加载缓存数据...");
        const cachedPlaylist = common_vendor.index.getStorageSync("aiRecommendPlaylist");
        if (cachedPlaylist && cachedPlaylist.songs && cachedPlaylist.songs.length > 0) {
          console.log(`[AIRecommend] ✅ 加载缓存歌单: ${cachedPlaylist.songs.length} 首`);
          recommendations.value = cachedPlaylist.songs;
          generateTime.value = cachedPlaylist.generateTime;
          playlistInfo.value = cachedPlaylist.playlistInfo;
        } else {
          console.log("[AIRecommend] ℹ️ 无缓存歌单");
          recommendations.value = [];
        }
        const aiCache = common_vendor.index.getStorageSync("aiUserProfileCache");
        const basicCache = common_vendor.index.getStorageSync("aiUserProfileData");
        if (aiCache && aiCache.data) {
          console.log("[AIRecommend] ✅ 加载AI画像缓存");
          userProfileData.value = aiCache.data;
          profileUpdateTime.value = `今日 ${new Date(aiCache.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 分析`;
        } else if (basicCache) {
          console.log("[AIRecommend] ✅ 加载基础画像缓存");
          userProfileData.value = basicCache.profileData;
          profileUpdateTime.value = getProfileUpdateTime(basicCache.analyzeTime);
        } else {
          console.log("[AIRecommend] ℹ️ 无画像缓存");
          userProfileData.value = null;
        }
        isLoading.value = false;
        hasError.value = false;
      } catch (error) {
        console.error("[AIRecommend] ❌ 加载缓存失败:", error);
      }
    };
    common_vendor.onUnmounted(() => {
      if (loadingMessageTimer) {
        clearInterval(loadingMessageTimer);
      }
      if (recommendRunningCheckTimer) {
        clearTimeout(recommendRunningCheckTimer);
        recommendRunningCheckTimer = null;
      }
    });
    const loadRecommendData = async (forceRefresh = false, skipProfileRefresh = false) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      try {
        console.log("[AIRecommend] 🚀 开始加载数据...", forceRefresh ? "（强制刷新模式）" : "", skipProfileRefresh ? "（保留用户画像）" : "");
        const now = /* @__PURE__ */ new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const FIXED_PLAYLIST_ID = `ai_playlist_${year}${month}${day}_${hour}`;
        console.log(`[AIRecommend] 📋 当前固定歌单ID: ${FIXED_PLAYLIST_ID}`);
        console.log(`[AIRecommend] ⏰ 当前时间: ${year}-${month}-${day} ${hour}:00`);
        if (!forceRefresh) {
          const cachedPlaylist = common_vendor.index.getStorageSync("aiRecommendPlaylist");
          const playerState = store_modules_player.playerStore.getState();
          const currentSong = playerState.currentSong;
          console.log("[AIRecommend] 检查缓存:", {
            有缓存: !!cachedPlaylist,
            缓存歌曲数: ((_a = cachedPlaylist == null ? void 0 : cachedPlaylist.songs) == null ? void 0 : _a.length) || 0,
            缓存歌单ID: ((_b = cachedPlaylist == null ? void 0 : cachedPlaylist.playlistInfo) == null ? void 0 : _b.id) || "无",
            固定歌单ID: FIXED_PLAYLIST_ID,
            当前播放歌曲: currentSong == null ? void 0 : currentSong.name,
            是否AI歌曲: currentSong == null ? void 0 : currentSong._isAiSong,
            当前歌单ID: store_modules_list.listStore.state.playInfo.playerListId,
            临时列表ID: (_d = (_c = store_modules_list.listStore.state.tempList) == null ? void 0 : _c.meta) == null ? void 0 : _d.id
          });
          let canReuseCache = false;
          let reuseReason = "";
          if (cachedPlaylist && cachedPlaylist.songs && cachedPlaylist.songs.length > 0 && cachedPlaylist.playlistInfo) {
            if (cachedPlaylist.playlistInfo.id === FIXED_PLAYLIST_ID) {
              canReuseCache = true;
              reuseReason = `歌单ID完全匹配 (${FIXED_PLAYLIST_ID})`;
              console.log(`[AIRecommend] ✅✅✅ 条件1命中：缓存ID与固定ID一致`);
            }
            if (!canReuseCache && (currentSong == null ? void 0 : currentSong._isAiSong)) {
              const currentSongInCache = cachedPlaylist.songs.some(
                (s) => s._aiId === currentSong.id || s.name === currentSong.name
              );
              if (currentSongInCache) {
                canReuseCache = true;
                reuseReason = "当前正在播放该歌单中的歌曲";
                console.log(`[AIRecommend] ✅✅ 条件2命中：正在播放缓存中的歌曲`);
              }
            }
            if (!canReuseCache && ((_e = cachedPlaylist.playlistInfo) == null ? void 0 : _e.id)) {
              const tempListMetaId = (_g = (_f = store_modules_list.listStore.state.tempList) == null ? void 0 : _f.meta) == null ? void 0 : _g.id;
              const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
              if (tempListMetaId === cachedPlaylist.playlistInfo.id || playerListId === cachedPlaylist.playlistInfo.id) {
                canReuseCache = true;
                reuseReason = "当前歌单列表匹配";
                console.log(`[AIRecommend] ✅✅ 条件3命中：歌单列表ID匹配`);
              }
            }
            if (!canReuseCache && isToday(cachedPlaylist.generateTime)) {
              const lastGenerateTime = new Date(cachedPlaylist.generateTime).getTime();
              const hoursSinceLastGenerate = (now.getTime() - lastGenerateTime) / (1e3 * 60 * 60);
              if (hoursSinceLastGenerate < 2) {
                canReuseCache = true;
                reuseReason = `距上次生成仅${Math.round(hoursSinceLastGenerate * 60)}分钟，自动复用`;
                console.log(`[AIRecommend] ✅✅ 条件4命中：时间在2小时内`);
              }
            }
          }
          if (canReuseCache) {
            console.log(`[AIRecommend] ✅ 复用缓存数据（原因：${reuseReason}）`);
            recommendations.value = cachedPlaylist.songs;
            generateTime.value = cachedPlaylist.generateTime;
            playlistInfo.value = cachedPlaylist.playlistInfo;
            isLoading.value = false;
            hasError.value = false;
            console.log("[AIRecommend] 🔄 复用缓存歌单，但重新计算用户画像...");
            let cachedUserData = common_vendor.index.getStorageSync("aiRecommendUserData") || {};
            let favoriteSongs2 = [];
            try {
              const loveList2 = utils_storage.getStorage("@list_love", []) || [];
              if (Array.isArray(loveList2) && loveList2.length > 0) {
                favoriteSongs2 = loveList2;
              }
            } catch (e) {
            }
            if (favoriteSongs2.length === 0) {
              try {
                const importedRaw = common_vendor.index.getStorageSync("imported_playlists");
                const importedPlaylists = typeof importedRaw === "string" ? JSON.parse(importedRaw) : Array.isArray(importedRaw) ? importedRaw : [];
                if (Array.isArray(importedPlaylists)) {
                  for (const playlist of importedPlaylists) {
                    if (playlist.songs && Array.isArray(playlist.songs)) {
                      favoriteSongs2 = [...favoriteSongs2, ...playlist.songs];
                    }
                  }
                }
              } catch (e) {
              }
            }
            if (favoriteSongs2.length === 0) {
              try {
                const userLists = utils_storage.getStorage("@user_lists", []) || [];
                if (Array.isArray(userLists)) {
                  for (const list of userLists) {
                    if (list.list && Array.isArray(list.list)) {
                      favoriteSongs2 = [...favoriteSongs2, ...list.list];
                    }
                  }
                }
              } catch (e) {
              }
            }
            cachedUserData.totalFavoriteCount = favoriteSongs2.length;
            cachedUserData.favoriteSongs = favoriteSongs2.slice(0, 50).map((song) => {
              var _a2, _b2;
              return {
                name: song.name,
                singer: song.singer || (Array.isArray(song.ar) ? song.ar.map((a) => a.name).join("、") : ""),
                album: song.albumName || ((_a2 = song.album) == null ? void 0 : _a2.name) || ((_b2 = song.al) == null ? void 0 : _b2.name) || "",
                source: song.source || "",
                addTime: song.addTime || Date.now()
              };
            }).filter((song) => song.name);
            console.log("[AIRecommend] 🔄 复用缓存 - 重新计算收藏:", favoriteSongs2.length, "首");
            try {
              const rawPlayHistory = common_vendor.index.getStorageSync("playHistory");
              let playHistoryArr = [];
              if (typeof rawPlayHistory === "string") {
                try {
                  playHistoryArr = JSON.parse(rawPlayHistory) || [];
                } catch (e) {
                  playHistoryArr = [];
                }
              } else if (Array.isArray(rawPlayHistory)) {
                playHistoryArr = rawPlayHistory;
              }
              if (playHistoryArr.length > 0) {
                cachedUserData.playHistory = playHistoryArr.slice(0, 200).map((song) => {
                  const songId = String(song.id || "");
                  const playRecord = songId ? common_vendor.index.getStorageSync(`playRecord_${songId}`) : null;
                  return {
                    name: song.name,
                    singer: song.singer || (Array.isArray(song.ar) ? song.ar.map((a) => a.name).join("、") : ""),
                    album: song.albumName || song.album && song.album.name || song.al && song.al.name || "",
                    source: song.source || "",
                    playTime: song.playTime || 0,
                    playRecord: playRecord ? {
                      playCount: playRecord.playCount || 0,
                      fullPlayCount: playRecord.fullPlayCount || 0,
                      avgCompletionRate: calculateAvgCompletionRate(playRecord),
                      lastPlayTime: playRecord.lastPlayTime || 0
                    } : null
                  };
                }).filter((song) => song.name);
                cachedUserData.totalPlayHistoryCount = playHistoryArr.length;
                console.log("[AIRecommend] 🔄 复用缓存 - 重新计算历史播放:", playHistoryArr.length, "首");
              } else {
                if (!cachedUserData.playHistory)
                  cachedUserData.playHistory = [];
                cachedUserData.totalPlayHistoryCount = 0;
              }
            } catch (e) {
              console.warn("[AIRecommend] 复用缓存 - 历史播放数据收集失败:", e.message);
            }
            const cachedAIProfile = common_vendor.index.getStorageSync("aiUserProfileCache");
            if (cachedAIProfile && cachedAIProfile.data) {
              console.log("[AIRecommend] ✅ 使用缓存的AI画像数据");
              userProfileData.value = cachedAIProfile.data;
              profileUpdateTime.value = `今日 ${new Date(cachedAIProfile.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 分析`;
            } else {
              const refreshedProfile = generateBasicUserProfile(cachedUserData);
              userProfileData.value = refreshedProfile;
              profileUpdateTime.value = getProfileUpdateTime(cachedPlaylist.generateTime);
            }
            console.log(`[AIRecommend] ✅ 已加载缓存歌单，共 ${cachedPlaylist.songs.length} 首歌曲，画像已刷新`);
            return;
          } else {
            console.log("[AIRecommend] 📝 缓存不可用或需要重新生成");
          }
        }
        let userData = common_vendor.index.getStorageSync("aiRecommendUserData");
        if (!userData) {
          userData = {};
        }
        let favoriteSongs = [];
        console.log("[AIRecommend] 🎯 开始读取收藏列表...");
        const loveList = utils_storage.getStorage("@list_love", []) || [];
        console.log("[AIRecommend] 📦 @list_love 解析结果: 是否数组:", Array.isArray(loveList), "数量:", Array.isArray(loveList) ? loveList.length : "N/A");
        if (Array.isArray(loveList) && loveList.length > 0) {
          favoriteSongs = loveList;
          console.log("[AIRecommend] ❤️ 从@list_love获取收藏:", favoriteSongs.length, "首");
        } else {
          console.log("[AIRecommend] ⚠️ @list_love 为空，尝试其他方式...");
          try {
            const loveListFromStore = store_modules_list.listStore.getList(store_modules_list.LIST_IDS.LOVE);
            if (loveListFromStore && Array.isArray(loveListFromStore) && loveListFromStore.length > 0) {
              favoriteSongs = loveListFromStore;
              console.log("[AIRecommend] ✅ 从listStore获取到:", favoriteSongs.length, "首");
            }
          } catch (e) {
            console.warn("[AIRecommend] listStore读取失败:", e.message);
          }
          if (favoriteSongs.length === 0) {
            try {
              const importedRaw = common_vendor.index.getStorageSync("imported_playlists");
              const importedPlaylists = typeof importedRaw === "string" ? JSON.parse(importedRaw) : Array.isArray(importedRaw) ? importedRaw : [];
              if (Array.isArray(importedPlaylists) && importedPlaylists.length > 0) {
                for (const playlist of importedPlaylists) {
                  if (playlist.songs && playlist.songs.length > 0) {
                    favoriteSongs = [...favoriteSongs, ...playlist.songs];
                  }
                }
                console.log("[AIRecommend] ✅ 从导入歌单收集到:", favoriteSongs.length, "首");
              }
            } catch (e) {
              console.error("[AIRecommend] 导入歌单读取失败:", e);
            }
          }
        }
        if (favoriteSongs.length > 0) {
          userData.totalFavoriteCount = favoriteSongs.length;
          userData.favoriteSongs = favoriteSongs.slice(0, 500).map((song, index) => {
            var _a2, _b2;
            const playRecord = common_vendor.index.getStorageSync(`playRecord_${song.id}`);
            if (index < 10) {
              console.log(
                `[AIRecommend] 🔍 收藏歌曲#${index + 1}: 《${song.name}》- id=${song.id}, playRecord=`,
                playRecord ? {
                  playCount: playRecord.playCount,
                  avgCompletionRate: calculateAvgCompletionRate(playRecord)
                } : "null/无播放记录"
              );
            }
            return {
              name: song.name,
              singer: song.singer || (Array.isArray(song.ar) ? song.ar.map((a) => a.name).join("、") : ""),
              album: song.albumName || ((_a2 = song.album) == null ? void 0 : _a2.name) || ((_b2 = song.al) == null ? void 0 : _b2.name) || "",
              source: song.source || "",
              addTime: song.addTime || Date.now(),
              // 加入完播率数据（收藏歌曲的播放行为更能反映真实喜好）
              playRecord: playRecord ? {
                playCount: playRecord.playCount || 0,
                fullPlayCount: playRecord.fullPlayCount || 0,
                avgCompletionRate: calculateAvgCompletionRate(playRecord),
                lastPlayTime: playRecord.lastPlayTime || 0
              } : null
            };
          }).filter((song) => song.name);
          console.log("[AIRecommend] ❤️ 真实收藏总数:", userData.totalFavoriteCount, "首，传给AI:", userData.favoriteSongs.length, "首");
        } else {
          userData.favoriteSongs = [];
          userData.totalFavoriteCount = 0;
          console.log("[AIRecommend] ⚠️ 未找到任何收藏歌曲");
        }
        try {
          console.log("[AIRecommend] 🎵 开始收集历史播放数据...");
          const rawPlayHistory = common_vendor.index.getStorageSync("playHistory");
          let playHistoryArr = [];
          if (typeof rawPlayHistory === "string") {
            try {
              playHistoryArr = JSON.parse(rawPlayHistory) || [];
            } catch (e) {
              playHistoryArr = [];
            }
          } else if (Array.isArray(rawPlayHistory)) {
            playHistoryArr = rawPlayHistory;
          }
          if (playHistoryArr.length > 0) {
            userData.playHistory = playHistoryArr.slice(0, 200).map((song) => {
              const songId = String(song.id || "");
              const playRecord = songId ? common_vendor.index.getStorageSync(`playRecord_${songId}`) : null;
              return {
                name: song.name,
                singer: song.singer || (Array.isArray(song.ar) ? song.ar.map((a) => a.name).join("、") : ""),
                album: song.albumName || song.album && song.album.name || song.al && song.al.name || "",
                source: song.source || "",
                playTime: song.playTime || 0,
                playRecord: playRecord ? {
                  playCount: playRecord.playCount || 0,
                  fullPlayCount: playRecord.fullPlayCount || 0,
                  avgCompletionRate: calculateAvgCompletionRate(playRecord),
                  lastPlayTime: playRecord.lastPlayTime || 0
                } : null
              };
            }).filter((song) => song.name);
            userData.totalPlayHistoryCount = playHistoryArr.length;
            console.log("[AIRecommend] 🎵 历史播放总数:", userData.totalPlayHistoryCount, "首，传给AI:", userData.playHistory.length, "首");
          } else {
            if (!userData.playHistory)
              userData.playHistory = [];
            userData.totalPlayHistoryCount = 0;
            console.log("[AIRecommend] ℹ️ 无历史播放数据");
          }
        } catch (e) {
          console.warn("[AIRecommend] 历史播放数据收集失败:", e.message);
          if (!userData.playHistory)
            userData.playHistory = [];
        }
        try {
          const historyStorageKey = "aiRecommendedSongsHistory";
          let historyData = common_vendor.index.getStorageSync(historyStorageKey);
          console.log("[AIRecommend] 📋 开始读取AI推荐历史记录...");
          if (historyData && Array.isArray(historyData) && historyData.length > 0) {
            userData.historyRecommendedSongs = historyData;
            console.log("[AIRecommend] ✅ 成功读取历史AI推荐歌曲:", historyData.length, "首");
            console.log("[AIRecommend] 📋 历史AI推荐歌曲列表（前10首）:");
            historyData.slice(0, 10).forEach((song, index) => {
              console.log(`  ${index + 1}. 《${song.name}》- ${song.singer} (来自:${song.playlistName || "未知"})`);
            });
            if (historyData.length > 10) {
              console.log(`  ... 还有${historyData.length - 10}首`);
            }
            const recentCount = historyData.filter((song) => {
              if (!song.recommendTime)
                return false;
              try {
                const recommendDate = new Date(song.recommendTime);
                const now2 = /* @__PURE__ */ new Date();
                const diffDays = (now2 - recommendDate) / (1e3 * 60 * 60 * 24);
                return diffDays <= 7;
              } catch (e) {
                return false;
              }
            }).length;
            console.log(`[AIRecommend] 📊 其中近7天推荐: ${recentCount}首`);
          } else {
            userData.historyRecommendedSongs = [];
            console.log("[AIRecommend] ℹ️ 暂无历史AI推荐记录（这是正常的，首次使用或刚清除缓存）");
            console.log("[AIRecommend] 💡 提示：本次生成的50首推荐歌曲将被记录，下次刷新时自动排除");
          }
        } catch (error) {
          console.error("[AIRecommend] ❌ 读取历史AI推荐记录失败:", error);
          userData.historyRecommendedSongs = [];
        }
        const hasValidUserData = userData && (userData.playHistory && userData.playHistory.length > 0 || userData.favoriteSongs && userData.favoriteSongs.length > 0 || userData.dislikeList && userData.dislikeList.length > 0 || userData.topArtists && userData.topArtists.length > 0 || userData.historyRecommendedSongs && userData.historyRecommendedSongs.length > 0);
        if (!hasValidUserData) {
          console.log("[AIRecommend] ⚠️ 用户数据不足，将使用热门数据进行推荐");
          userData = await getHotSearchDataForAI();
          if (!userData || !userData.hotSearchData || Object.keys(userData.hotSearchData).length === 0) {
            throw new Error("无法获取用户数据和热门数据，请检查网络连接或稍后重试");
          }
        }
        console.log("[AIRecommend] 数据概要:", {
          历史播放数: ((_h = userData.playHistory) == null ? void 0 : _h.length) || 0,
          收藏歌曲数: ((_i = userData.favoriteSongs) == null ? void 0 : _i.length) || 0,
          不喜欢数: ((_j = userData.dislikeList) == null ? void 0 : _j.length) || 0,
          热搜数据: Object.keys(userData.hotSearchData || {}).length > 0 ? "有" : "无"
        });
        const aiCache = common_vendor.index.getStorageSync("aiUserProfileCache");
        const basicCache = common_vendor.index.getStorageSync("aiUserProfileData");
        const hasAICache = aiCache && aiCache.data;
        const hasBasicCache = basicCache && isToday(basicCache.analyzeTime);
        if (hasAICache || hasBasicCache && !forceRefresh) {
          if (hasAICache) {
            console.log("[AIRecommend] 使用AI分析的画像缓存");
            userProfileData.value = aiCache.data;
            profileUpdateTime.value = `今日 ${new Date(aiCache.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 分析`;
          } else {
            console.log("[AIRecommend] 使用基础画像缓存");
            userProfileData.value = basicCache.profileData;
            profileUpdateTime.value = getProfileUpdateTime(basicCache.analyzeTime);
          }
        } else {
          if (forceRefresh && !skipProfileRefresh) {
            console.log("[AIRecommend] 🔄 强制刷新模式，跳过缓存，重新生成画像");
            common_vendor.index.removeStorageSync("aiUserProfileData");
            common_vendor.index.removeStorageSync("aiUserProfileCache");
          }
          if (skipProfileRefresh) {
            console.log("[AIRecommend] ℹ️ 跳过主动刷新画像：复用现有画像或缓存");
            if (userProfileData.value) {
              console.log("[AIRecommend] ✅ 当前用户画像已存在，继续使用");
            } else {
              console.log("[AIRecommend] ⚠️ 当前无用户画像，尝试加载缓存...");
              const fallbackCache = common_vendor.index.getStorageSync("aiUserProfileCache");
              if (fallbackCache == null ? void 0 : fallbackCache.data) {
                userProfileData.value = fallbackCache.data;
                profileUpdateTime.value = `今日 ${new Date(fallbackCache.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 分析`;
                console.log("[AIRecommend] ✅ 从AI画像缓存加载成功");
              } else {
                console.log("[AIRecommend] 🔄 无缓存且未分析，开始分析用户画像...");
                await loadOrAnalyzeUserProfile(userData, false);
              }
            }
          } else {
            console.log("[AIRecommend] 开始分析用户画像...");
            await loadOrAnalyzeUserProfile(userData, forceRefresh);
          }
        }
        startLoadingAnimation();
        const aiResult = await callAIAPIForRecommend(userData);
        if (aiResult && aiResult.length >= 2) {
          if (aiResult.length < 10) {
            console.warn(`[AIRecommend] ⚠️ 推荐数量偏少(${aiResult.length}首)，后端可能返回了大量重复歌曲`);
            common_vendor.index.showToast({
              title: `获得${aiResult.length}首新歌`,
              icon: "none",
              duration: 2e3
            });
          }
          stopLoadingAnimation();
          let processedSongs = aiResult.map((song, index) => ({
            ...song,
            _aiId: `ai_recommend_${Date.now()}_${index}`,
            _originalIndex: index
          }));
          try {
            console.log("[AIRecommend] 📊 开始检测推荐结果重复率...");
            const excludedSongsSet = /* @__PURE__ */ new Set();
            if (userData.playHistory && Array.isArray(userData.playHistory)) {
              userData.playHistory.forEach((song) => {
                if (song && song.name && song.singer) {
                  excludedSongsSet.add(`${song.name}-${song.singer}`.toLowerCase());
                }
              });
            }
            if (userData.favoriteSongs && Array.isArray(userData.favoriteSongs)) {
              userData.favoriteSongs.forEach((song) => {
                if (song && song.name && song.singer) {
                  excludedSongsSet.add(`${song.name}-${song.singer}`.toLowerCase());
                }
              });
            }
            if (userData.historyRecommendedSongs && Array.isArray(userData.historyRecommendedSongs)) {
              userData.historyRecommendedSongs.forEach((song) => {
                if (song && song.name && song.singer) {
                  excludedSongsSet.add(`${song.name}-${song.singer}`.toLowerCase());
                }
              });
            }
            const totalCount = processedSongs.length;
            let duplicateCount = 0;
            const duplicateSongs = [];
            processedSongs.forEach((song) => {
              if (song && song.name && song.singer) {
                const songKey = `${song.name}-${song.singer}`.toLowerCase();
                if (excludedSongsSet.has(songKey)) {
                  duplicateCount++;
                  if (duplicateSongs.length < 10) {
                    duplicateSongs.push(`《${song.name}》- ${song.singer}`);
                  }
                }
              }
            });
            const duplicateRate = duplicateCount / totalCount * 100;
            console.log(`[AIRecommend] 📊 重复率检测结果：`);
            console.log(`  ├─ 总歌曲数: ${totalCount}首`);
            console.log(`  ├─ 重复数量: ${duplicateCount}首`);
            console.log(`  └─ 重复率: ${duplicateRate.toFixed(1)}%`);
            if (duplicateSongs.length > 0) {
              console.log(`[AIRecommend] 📋 重复歌曲示例（前10首）:`);
              duplicateSongs.forEach((song, index) => {
                console.log(`  ${index + 1}. ${song}`);
              });
            }
            if (duplicateRate > 60) {
              console.warn(`[AIRecommend] ⚠️ 重复率${duplicateRate.toFixed(1)}%超过60%阈值，准备刷新推荐...`);
              const maxRetries = 3;
              const currentRetry = loadRecommendData._retryCount || 0;
              if (currentRetry < maxRetries) {
                loadRecommendData._retryCount = currentRetry + 1;
                console.warn(`[AIRecommend] 🔄 第${currentRetry + 1}次刷新推荐（最多${maxRetries}次）...`);
                await new Promise((resolve) => setTimeout(resolve, 500));
                return await loadRecommendData(forceRefresh, skipProfileRefresh);
              } else {
                console.error(`[AIRecommend] ❌ 已达到最大重试次数(${maxRetries}次)，使用当前结果`);
                console.error("[AIRecommend] 💡 建议：可能需要优化提示词或更换AI模型");
                loadRecommendData._retryCount = 0;
              }
            } else {
              console.log(`[AIRecommend] ✅ 重复率${duplicateRate.toFixed(1)}%在可接受范围内（<=60%）`);
              loadRecommendData._retryCount = 0;
            }
          } catch (detectError) {
            console.error("[AIRecommend] ❌ 重复率检测失败:", detectError);
            console.error("[AIRecommend] ⚠️ 将使用原始结果继续");
          }
          recommendations.value = processedSongs;
          generateTime.value = (/* @__PURE__ */ new Date()).toLocaleString();
          isLoading.value = false;
          hasError.value = false;
          const playlistMeta = generatePlaylistMetadata(userData, aiResult, now);
          playlistInfo.value = {
            title: playlistMeta.title,
            subtitle: playlistMeta.subtitle,
            reason: playlistMeta.reason,
            songCount: aiResult.length,
            id: FIXED_PLAYLIST_ID,
            // ✅ 使用固定ID，确保同一小时内一致
            createTime: now.toISOString(),
            generateTime: now.toLocaleString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
              month: "long",
              day: "numeric"
            })
          };
          console.log(`[AIRecommend] 📝 歌单ID已设置为固定值: ${FIXED_PLAYLIST_ID}`);
          console.log(`[AIRecommend] ✅ AI推荐歌单生成成功，共 ${aiResult.length} 首歌曲`);
          common_vendor.index.setStorageSync("aiRecommendPlaylist", {
            songs: processedSongs,
            playlistInfo: playlistInfo.value,
            generateTime: generateTime.value,
            userProfile: userProfileData.value
          });
          try {
            const historyStorageKey = "aiRecommendedSongsHistory";
            let historyData = common_vendor.index.getStorageSync(historyStorageKey);
            if (!historyData || !Array.isArray(historyData)) {
              historyData = [];
            }
            const newSongsCount = processedSongs.length;
            let addedCount = 0;
            processedSongs.forEach((song) => {
              var _a2;
              if (song && song.name && song.singer) {
                const songKey = `${song.name}-${song.singer}`.toLowerCase();
                const exists = historyData.some(
                  (item) => item && `${item.name}-${item.singer}`.toLowerCase() === songKey
                );
                if (!exists) {
                  historyData.push({
                    name: song.name,
                    singer: song.singer,
                    album: song.album || "",
                    playlistName: ((_a2 = playlistInfo.value) == null ? void 0 : _a2.name) || `AI推荐歌单`,
                    recommendTime: (/* @__PURE__ */ new Date()).toISOString(),
                    playlistId: FIXED_PLAYLIST_ID
                  });
                  addedCount++;
                }
              }
            });
            common_vendor.index.setStorageSync(historyStorageKey, historyData);
            console.log(`[AIRecommend] 📝 已将${newSongsCount}首新推荐歌曲追加到历史记录，新增${addedCount}首，总计${historyData.length}首`);
          } catch (historyError) {
            console.error("[AIRecommend] ⚠️ 保存AI推荐历史记录失败:", historyError);
          }
        } else {
          throw new Error("AI未能生成有效的推荐结果");
        }
      } catch (error) {
        console.error("[AIRecommend] ❌ 加载推荐数据失败:", error);
        stopLoadingAnimation();
        isLoading.value = false;
        hasError.value = true;
        errorMessage.value = error.message || "加载失败";
      }
    };
    const isToday = (dateString) => {
      if (!dateString)
        return false;
      try {
        const date = new Date(dateString);
        const today = /* @__PURE__ */ new Date();
        return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
      } catch (e) {
        return false;
      }
    };
    const getProfileUpdateTime = (dateString) => {
      if (!dateString)
        return "";
      try {
        const date = new Date(dateString);
        const now = /* @__PURE__ */ new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 6e4);
        if (diffMins < 1)
          return "刚刚更新";
        if (diffMins < 60)
          return `${diffMins}分钟前更新`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24)
          return `${diffHours}小时前更新`;
        return `${Math.floor(diffHours / 24)}天前更新`;
      } catch (e) {
        return "";
      }
    };
    const generatePlaylistMetadata = (userData, songs, now) => {
      const hour = now.getHours();
      let timeTitle = "";
      let timeSubtitle = "";
      if (hour >= 5 && hour < 8) {
        timeTitle = "晨间唤醒";
        timeSubtitle = "清晨的第一缕旋律";
      } else if (hour >= 8 && hour < 12) {
        timeTitle = "上午能量";
        timeSubtitle = "开启活力满满的一天";
      } else if (hour >= 12 && hour < 14) {
        timeTitle = "午间小憩";
        timeSubtitle = "忙碌中的音乐陪伴";
      } else if (hour >= 14 && hour < 17) {
        timeTitle = "下午茶时光";
        timeSubtitle = "工作间隙的轻松时刻";
      } else if (hour >= 17 && hour < 19) {
        timeTitle = "傍晚归途";
        timeSubtitle = "下班路上的温暖陪伴";
      } else if (hour >= 19 && hour < 22) {
        timeTitle = "夜晚治愈";
        timeSubtitle = "卸下疲惫的温柔时刻";
      } else {
        timeTitle = "深夜共鸣";
        timeSubtitle = "属于你的独处时间";
      }
      const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
      const timeStr = `${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const chineseSongs = songs.filter((s) => /[\u4e00-\u9fa5]/.test(s.name));
      songs.filter((s) => !/[\u4e00-\u9fa5]/.test(s.name));
      const artists = [...new Set(songs.map((s) => s.singer))];
      const topArtists = artists.slice(0, 3);
      const hasLoveSongs = songs.some(
        (s) => /爱|恋|情|心|想你|喜欢|告白|甜蜜/.test(s.name)
      );
      const hasSadSongs = songs.some(
        (s) => /伤|痛|哭|泪|离别|遗憾|失去|孤单/.test(s.name)
      );
      const hasUpbeatSongs = songs.some(
        (s) => /快乐|阳光|奔跑|自由|梦想|青春|活力/.test(s.name)
      );
      let styleDescription = "";
      if (hasUpbeatSongs && !hasSadSongs) {
        styleDescription = "以积极向上的旋律为主，充满正能量";
      } else if (hasSadSongs && !hasUpbeatSongs) {
        styleDescription = "包含深情的抒情歌曲，适合情感宣泄";
      } else if (hasLoveSongs) {
        styleDescription = "融合了甜蜜情歌与动人旋律";
      } else {
        styleDescription = "精选多元风格的优质作品";
      }
      let userPreferenceInsights = [];
      if (userData.playHistory && userData.playHistory.length > 20) {
        userPreferenceInsights.push("你是一位深度音乐爱好者");
      }
      if (userData.favoriteSongs && userData.favoriteSongs.length > 10) {
        userPreferenceInsights.push("有明确的收藏品味");
      }
      if (chineseSongs.length > songs.length * 0.7) {
        userPreferenceInsights.push("偏爱华语音乐");
      }
      let reasonParts = [];
      reasonParts.push(`🎵 **歌曲特色**：本次为你精心挑选了 ${songs.length} 首歌曲，${styleDescription}。
其中华语歌曲占 ${Math.round(chineseSongs.length / songs.length * 100)}%，主要来自 ${topArtists.join("、")} 等实力歌手的代表作。`);
      if (userPreferenceInsights.length > 0) {
        reasonParts.push(`👤 **你的画像**：分析发现你${userPreferenceInsights.join("，")}，因此特别筛选了符合你口味的热门金曲和小众佳作。`);
      }
      let recommendationLogic = "";
      if (userData.playHistory && userData.playHistory.length > 5) {
        const mostPlayed = userData.playHistory[0];
        recommendationLogic += `参考了你最近高频播放的《${mostPlayed.name}》，`;
      }
      if (userData.favoriteSongs && userData.favoriteSongs.length > 3) {
        recommendationLogic += `结合你收藏的${userData.favoriteSongs.length}首挚爱歌曲的风格走向，`;
      }
      recommendationLogic += `在保持你熟悉感的同时，融入了约30%的新鲜探索曲目，帮你发现可能错过的好歌。`;
      reasonParts.push(`🎯 **推荐策略**：${recommendationLogic}`);
      let expectedEffect = "";
      if (hour >= 19 || hour < 6) {
        expectedEffect = "希望这些歌曲能陪伴你度过一个放松的夜晚/清晨，让音乐成为你情感的寄托。";
      } else if (hour >= 8 && hour < 18) {
        expectedEffect = "希望这些歌曲能为你的一天注入活力，无论是工作还是学习都能保持好心情。";
      } else {
        expectedEffect = "希望这些歌曲能为你的通勤或休息时间增添一份惬意。";
      }
      reasonParts.push(`✨ **期待体验**：${expectedEffect}`);
      const fullReason = reasonParts.join("\n\n");
      return {
        title: `${timeTitle} · ${dateStr} ${timeStr}`,
        subtitle: timeSubtitle,
        reason: fullReason,
        // 额外的元数据（供其他地方使用）
        metadata: {
          timeOfDay: timeTitle,
          songCount: songs.length,
          chineseRatio: Math.round(chineseSongs.length / songs.length * 100),
          mainArtists: topArtists,
          styleTag: hasUpbeatSongs ? "积极" : hasSadSongs ? "抒情" : "多元"
        }
      };
    };
    const isCurrentSong = (song, index) => {
      if (!currentSongId.value)
        return false;
      const currentPlayerListId = store_modules_list.listStore.state.playInfo.playerListId;
      if (currentPlayerListId !== store_modules_list.LIST_IDS.TEMP)
        return false;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      if ((tempListMeta == null ? void 0 : tempListMeta.id) !== playlistInfo.value.id)
        return false;
      const playIndex = store_modules_list.listStore.state.playInfo.playIndex;
      return playIndex === index;
    };
    const isFavorite = (song) => {
      if (!song || !song.name)
        return false;
      const loveList = store_modules_list.listStore.getList(store_modules_list.LIST_IDS.LOVE) || [];
      return loveList.some((m) => m.name === song.name && m.singer === song.singer);
    };
    const playSongAtIndex = async (index) => {
      var _a, _b, _c;
      if (index < 0 || index >= recommendations.value.length)
        return;
      const song = recommendations.value[index];
      console.log(`[AIRecommend] 🎵 开始播放第 ${index + 1} 首:`, song.name, "-", song.singer);
      try {
        currentLoadingIndex.value = index;
        if (song._isSearched && song._realId && song._realSource) {
          console.log("[AIRecommend] ✅✅✅ 发现已缓存的搜索结果，跳过搜索流程！");
          console.log("[AIRecommend] 📦 缓存信息:", {
            id: song._realId,
            source: song._realSource,
            name: song.name,
            singer: song.singer,
            searchedAt: new Date(song._searchedAt).toLocaleString("zh-CN")
          });
          store_modules_player.playerStore.setStatusText(`正在播放：${song.name} - ${song.singer}`);
          const cachedSong = {
            id: song._realId || song.id,
            name: song.name,
            singer: song.singer,
            ar: song.ar || [{ name: song.singer }],
            al: song.al || { name: getAlbumName(song.album) || "" },
            album: { name: getAlbumName(song.album) || "" },
            source: song._realSource || song.source,
            // 🔑 关键：duration 需要转换为数值用于播放（缓存中存的是格式化字符串）
            duration: song._durationNum || parseDuration(song.duration),
            interval: song.interval || (song._durationNum ? song._durationNum * 1e3 : parseDuration(song.duration) * 1e3),
            songmid: song.songmid,
            hash: song.hash,
            copyrightId: song.copyrightId,
            picUrl: song.picUrl || song.img,
            img: song.img || song.picUrl,
            _aiOriginalSong: song._aiOriginalSong || song,
            _aiIndex: index,
            _isAiSong: true,
            _isSearched: true,
            _realId: song._realId,
            _realSource: song._realSource
          };
          console.log("[AIRecommend] 🚀 使用缓存直接播放，无需搜索");
          const playlistSongs2 = recommendations.value.map((s, i) => {
            if (i === index) {
              return cachedSong;
            }
            return {
              id: s._aiId || s.id || `ai_${i}_${Date.now()}`,
              name: s.name,
              singer: s.singer,
              ar: s.ar || [{ name: s.singer }],
              al: s.al || { name: getAlbumName(s.album) || "" },
              album: { name: getAlbumName(s.album) || "" },
              source: s._realSource || s.source || "ai_pending",
              duration: s._durationNum || parseDuration(s.duration),
              _isAiSong: true,
              _isSearched: s._isSearched || false,
              _realId: s._realId,
              _realSource: s._realSource,
              _aiOriginalSong: s._aiOriginalSong || s,
              _aiIndex: i
            };
          });
          store_modules_list.listStore.setTempList(store_modules_list.LIST_IDS.TEMP, [], {});
          store_modules_list.listStore.setTempList(
            store_modules_list.LIST_IDS.TEMP,
            playlistSongs2,
            {
              id: playlistInfo.value.id,
              source: "ai_recommend",
              name: playlistInfo.value.title,
              link: `ai_playlist_${playlistInfo.value.id}`
            }
          );
          store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
          const musicInfo2 = {
            id: cachedSong.id,
            name: cachedSong.name,
            singer: cachedSong.singer,
            ar: cachedSong.ar,
            album: cachedSong.album,
            al: cachedSong.al,
            duration: cachedSong.duration,
            source: cachedSong.source,
            songmid: cachedSong.songmid,
            picUrl: cachedSong.picUrl,
            img: cachedSong.img,
            _aiOriginalSong: cachedSong._aiOriginalSong,
            _aiIndex: index,
            _isAiSong: true,
            // 🔑 关键：必须包含这些字段，否则player.js会再次触发搜索
            _isSearched: true,
            _realId: cachedSong._realId || cachedSong.id,
            _realSource: cachedSong._realSource || cachedSong.source,
            url: "",
            playUrl: "",
            lyric: "",
            tlyric: "",
            rlyric: "",
            lxlyric: ""
          };
          store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.TEMP, musicInfo2, false);
          store_modules_player.playerStore.playSong({ ...musicInfo2 });
          store_modules_player.playerStore.addToHistory(cachedSong);
          store_modules_player.playerStore.addToListHistory({
            id: playlistInfo.value.id,
            name: playlistInfo.value.title,
            source: "ai_recommend",
            coverUrl: "",
            trackCount: recommendations.value.length,
            link: `ai_playlist_${playlistInfo.value.id}`
          });
          store_modules_player.playerStore.clearStatusText();
          currentLoadingIndex.value = -1;
          console.log(`[AIRecommend] ▶️ 已使用缓存播放: 《${cachedSong.name}》- ${cachedSong.singer}`);
          common_vendor.index.showToast({
            title: `正在播放: ${cachedSong.name}`,
            icon: "none",
            duration: 1500
          });
          return;
        }
        store_modules_player.playerStore.setStatusText(`正在搜索：${song.name} - ${song.singer}`);
        const keyword = `${song.name} ${song.singer}`.trim();
        console.log("[AIRecommend] 🔍 搜索关键词:", keyword);
        console.log("[AIRecommend] 📋 目标歌曲信息:", {
          name: song.name,
          singer: song.singer,
          album: song.album || "未知",
          duration: song.duration || "未知"
        });
        console.log("\n[AIRecommend] ===== 第一阶段搜索：主要平台（tx + kg）=====\n");
        const primarySources = ["tx", "kg"];
        let allResults = [];
        let foundPerfectMatch = false;
        for (const source of primarySources) {
          try {
            console.log(`[AIRecommend] 🔍 正在搜索 [${source}] 音源...`);
            const startTime = Date.now();
            const result = await services_api.searchApi.searchSongs(keyword, source, 1, 20);
            const searchTime = Date.now() - startTime;
            if (result && result.list && result.list.length > 0) {
              console.log(`[AIRecommend] ✅ [${source}] 搜索完成，找到 ${result.list.length} 首歌曲，耗时 ${searchTime}ms`);
              const scoredSongs = result.list.map((s, idx) => {
                const score = calculateMatchScore(song, s);
                const singerName = formatSinger(s.singer || s.artists);
                console.log(`[AIRecommend]   [${source}] #${idx + 1}: 《${s.name}》- ${singerName}`);
                console.log(`[AIRecommend]      相似度得分: ${score} 分`);
                return {
                  ...s,
                  matchScore: score,
                  source,
                  searchIndex: idx
                };
              });
              scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
              const bestInSource = scoredSongs[0];
              console.log(`
[AIRecommend] 🏆 [${source}] 最佳匹配: 《${bestInSource.name}》-${formatSinger(bestInSource.singer || bestInSource.artists)} (${bestInSource.matchScore}分)
`);
              allResults.push(...scoredSongs);
              if (bestInSource.matchScore >= 80) {
                console.log(`[AIRecommend] 🎯 发现高匹配！（${bestInSource.matchScore} >= 80），停止搜索其他平台`);
                foundPerfectMatch = true;
                break;
              }
            } else {
              console.log(`[AIRecommend] ⚠️ [${source}] 未找到结果，耗时 ${searchTime}ms`);
            }
          } catch (error) {
            console.error(`[AIRecommend] ❌ [${source}] 搜索失败:`, error.message);
          }
        }
        if (!foundPerfectMatch) {
          console.log("\n[AIRecommend] ===== 第二阶段搜索：补充平台（kw + mg）=====\n");
          console.log("[AIRecommend] ℹ️ 第一阶段未找到高匹配，继续搜索其他平台...\n");
          const secondarySources = ["kw", "mg"];
          for (const source of secondarySources) {
            try {
              console.log(`[AIRecommend] 🔍 正在搜索 [${source}] 音源...`);
              const startTime = Date.now();
              const result = await services_api.searchApi.searchSongs(keyword, source, 1, 20);
              const searchTime = Date.now() - startTime;
              if (result && result.list && result.list.length > 0) {
                console.log(`[AIRecommend] ✅ [${source}] 搜索完成，找到 ${result.list.length} 首歌曲，耗时 ${searchTime}ms`);
                const scoredSongs = result.list.map((s, idx) => {
                  const score = calculateMatchScore(song, s);
                  const singerName = formatSinger(s.singer || s.artists);
                  console.log(`[AIRecommend]   [${source}] #${idx + 1}: 《${s.name}》- ${singerName}`);
                  console.log(`[AIRecommend]      相似度得分: ${score} 分`);
                  return {
                    ...s,
                    matchScore: score,
                    source,
                    searchIndex: idx
                  };
                });
                scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
                const bestInSource = scoredSongs[0];
                console.log(`
[AIRecommend] 🏆 [${source}] 最佳匹配: 《${bestInSource.name}》-${formatSinger(bestInSource.singer || bestInSource.artists)} (${bestInSource.matchScore}分)
`);
                allResults.push(...scoredSongs);
                if (bestInSource.matchScore >= 80) {
                  console.log(`[AIRecommend] 🎯 发现高匹配！（${bestInSource.matchScore} >= 80），停止搜索`);
                  foundPerfectMatch = true;
                  break;
                }
              } else {
                console.log(`[AIRecommend] ⚠️ [${source}] 未找到结果，耗时 ${searchTime}ms`);
              }
            } catch (error) {
              console.error(`[AIRecommend] ❌ [${source}] 搜索失败:`, error.message);
            }
          }
        }
        if (!foundPerfectMatch) {
          console.log("\n[AIRecommend] ===== 第三阶段搜索：最后平台（wy）=====\n");
          const tertiarySource = "wy";
          try {
            console.log(`[AIRecommend] 🔍 正在搜索 [${tertiarySource}] 音源...`);
            const startTime = Date.now();
            const result = await services_api.searchApi.searchSongs(keyword, tertiarySource, 1, 20);
            const searchTime = Date.now() - startTime;
            if (result && result.list && result.list.length > 0) {
              console.log(`[AIRecommend] ✅ [${tertiarySource}] 搜索完成，找到 ${result.list.length} 首歌曲，耗时 ${searchTime}ms`);
              const scoredSongs = result.list.map((s, idx) => {
                const score = calculateMatchScore(song, s);
                const singerName = formatSinger(s.singer || s.artists);
                console.log(`[AIRecommend]   [${tertiarySource}] #${idx + 1}: 《${s.name}》- ${singerName}`);
                console.log(`[AIRecommend]      相似度得分: ${score} 分`);
                return {
                  ...s,
                  matchScore: score,
                  source: tertiarySource,
                  searchIndex: idx
                };
              });
              scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
              const bestInSource = scoredSongs[0];
              console.log(`
[AIRecommend] 🏆 [${tertiarySource}] 最佳匹配: 《${bestInSource.name}》-${formatSinger(bestInSource.singer || bestInSource.artists)} (${bestInSource.matchScore}分)
`);
              allResults.push(...scoredSongs);
            } else {
              console.log(`[AIRecommend] ⚠️ [${tertiarySource}] 未找到结果，耗时 ${searchTime}ms`);
            }
          } catch (error) {
            console.error(`[AIRecommend] ❌ [${tertiarySource}] 搜索失败:`, error.message);
          }
        }
        console.log("\n[AIRecommend] ===== 最终选择 =====");
        console.log(`[AIRecommend] 📊 总共搜索到 ${allResults.length} 首候选歌曲`);
        if (allResults.length === 0) {
          throw new Error(`未找到"${song.name}"的可用音源`);
        }
        allResults.sort((a, b) => b.matchScore - a.matchScore);
        const bestMatch = allResults[0];
        console.log(`[AIRecommend] 🎯 最终选择: 《${bestMatch.name}》- ${formatSinger(bestMatch.singer || bestMatch.artists)}`);
        console.log(`[AIRecommend]    音源: ${bestMatch.source}`);
        console.log(`[AIRecommend]    相似度: ${bestMatch.matchScore} 分`);
        const finalSong = {
          id: bestMatch.id || bestMatch.mid || song._aiId,
          name: bestMatch.name,
          singer: formatSinger(bestMatch.singer || bestMatch.artists),
          ar: typeof bestMatch.singer === "string" ? [{ name: bestMatch.singer }] : bestMatch.artists || [],
          al: { name: bestMatch.albumName || ((_a = bestMatch.album) == null ? void 0 : _a.name) || song.album || "" },
          album: { name: bestMatch.albumName || ((_b = bestMatch.album) == null ? void 0 : _b.name) || song.album || "" },
          source: bestMatch.source,
          duration: bestMatch.interval || bestMatch.duration || parseDuration(song.duration),
          picUrl: bestMatch.pic || bestMatch.image || "",
          mid: bestMatch.mid,
          _aiOriginalSong: song,
          // 保存原始AI推荐歌曲信息
          _aiIndex: index
          // 保存在歌单中的索引
        };
        const playlistSongs = recommendations.value.map((s, i) => {
          if (i === index) {
            return {
              id: finalSong.id,
              name: finalSong.name,
              singer: finalSong.singer,
              ar: finalSong.ar,
              al: finalSong.al,
              album: finalSong.album,
              source: finalSong.source,
              duration: finalSong.duration,
              picUrl: finalSong.picUrl,
              mid: finalSong.mid,
              _isAiSong: true,
              _aiOriginalSong: s,
              _aiIndex: i
            };
          }
          return {
            id: s._aiId || `ai_${i}_${Date.now()}`,
            name: s.name,
            singer: s.singer,
            ar: [{ name: s.singer }],
            al: { name: s.album || "" },
            album: { name: s.album || "" },
            source: "ai_pending",
            // 标记待搜索
            duration: parseDuration(s.duration),
            _isAiSong: true,
            _aiOriginalSong: s,
            _aiIndex: i
          };
        });
        console.log("[AIRecommend] 📋 准备设置临时列表，歌曲数量:", playlistSongs.length);
        console.log("[AIRecommend] 📋 当前播放索引:", index);
        console.log("[AIRecommend] 📋 歌单ID:", playlistInfo.value.id);
        store_modules_list.listStore.setTempList(store_modules_list.LIST_IDS.TEMP, [], {});
        store_modules_list.listStore.setTempList(
          store_modules_list.LIST_IDS.TEMP,
          playlistSongs,
          {
            id: playlistInfo.value.id,
            source: "ai_recommend",
            name: playlistInfo.value.title,
            link: `ai_playlist_${playlistInfo.value.id}`
          }
        );
        store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
        const musicInfo = {
          id: finalSong.id,
          name: finalSong.name,
          singer: finalSong.singer,
          ar: finalSong.ar,
          album: finalSong.album,
          al: finalSong.al,
          duration: finalSong.duration,
          source: finalSong.source,
          songmid: finalSong.mid,
          picUrl: finalSong.picUrl,
          img: finalSong.picUrl,
          _aiOriginalSong: finalSong._aiOriginalSong,
          _aiIndex: index,
          _isAiSong: true,
          // 不设置url和playUrl，让playerStore.playSong自己处理缓存和URL获取
          url: "",
          playUrl: "",
          lyric: "",
          tlyric: "",
          rlyric: "",
          lxlyric: ""
        };
        console.log("[AIRecommend] 🎯 调用 setPlayMusicInfo，让系统自动计算播放索引...");
        store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.TEMP, musicInfo, false);
        console.log("[AIRecommend] ▶️ 调用 playerStore.playSong 开始播放...");
        store_modules_player.playerStore.playSong({ ...musicInfo });
        console.log("[AIRecommend] 💾 保存搜索到的真实歌曲信息，避免下次重复搜索...");
        if (recommendations.value[index]) {
          const originalSong = recommendations.value[index];
          recommendations.value[index] = {
            ...originalSong,
            // 保留原始AI推荐信息（name、singer、album、reason等）
            // 🔑 关键：用搜索到的真实ID和信息覆盖
            id: finalSong.id,
            // 真实歌曲ID（如：002FIeVB0dC7qZ）
            _realId: finalSong.id,
            // 额外标记真实ID
            source: finalSong.source,
            // 真实音源（如：tx、kg、wy）
            _realSource: finalSong.source,
            // 额外标记真实音源
            songmid: finalSong.mid || finalSong.songmid,
            // QQ音乐songmid
            hash: finalSong.hash,
            // 酷狗hash
            copyrightId: finalSong.copyrightId,
            // 版权ID
            picUrl: finalSong.picUrl || finalSong.img,
            // 封面URL
            img: finalSong.img || finalSong.picUrl,
            // 🔑 关键修复：保留原始显示格式，同时保存标准化数值用于播放
            duration: formatDurationDisplay(finalSong.duration) || originalSong.duration,
            // 显示用：格式化字符串 "04:16"
            _durationNum: finalSong.duration,
            // 播放用：原始数值（毫秒或秒）
            interval: finalSong.duration * 1e3,
            // 毫秒格式（兼容性）
            ar: finalSong.ar,
            // 标准化艺术家数组
            al: finalSong.al,
            // 标准化专辑对象
            album: typeof finalSong.album === "object" ? (_c = finalSong.album) == null ? void 0 : _c.name : finalSong.album || originalSong.album,
            // 显示用：字符串
            _albumObj: finalSong.album,
            // 原始对象（如果需要）
            _searchedAt: Date.now(),
            // 搜索时间戳
            _isSearched: true
            // 标记已搜索过
          };
          console.log("[AIRecommend] ✅ 已更新第", index + 1, "首歌曲的真实信息:", {
            id: finalSong.id,
            source: finalSong.source,
            name: finalSong.name,
            singer: finalSong.singer
          });
          try {
            common_vendor.index.setStorageSync("aiRecommendPlaylist", {
              songs: recommendations.value,
              // 包含已更新的真实ID
              playlistInfo: playlistInfo.value,
              generateTime: generateTime.value,
              userProfile: userProfileData.value,
              lastUpdated: Date.now()
              // 记录最后更新时间
            });
            console.log("[AIRecommend] ✅✅✅ 已将包含真实ID的歌单保存到缓存");
            console.log(
              "[AIRecommend] 📊 缓存统计 - 已搜索歌曲数:",
              recommendations.value.filter((s) => s._isSearched).length,
              "/",
              recommendations.value.length
            );
          } catch (cacheError) {
            console.error("[AIRecommend] ❌ 保存缓存失败:", cacheError);
          }
        }
        store_modules_player.playerStore.addToHistory(finalSong);
        store_modules_player.playerStore.addToListHistory({
          id: playlistInfo.value.id,
          name: playlistInfo.value.title,
          source: "ai_recommend",
          coverUrl: "",
          trackCount: recommendations.value.length,
          link: `ai_playlist_${playlistInfo.value.id}`
        });
        store_modules_player.playerStore.clearStatusText();
        currentLoadingIndex.value = -1;
        console.log(`[AIRecommend] ▶️ 已开始播放: 《${finalSong.name}》- ${finalSong.singer}`);
        common_vendor.index.showToast({
          title: `正在播放: ${finalSong.name}`,
          icon: "none",
          duration: 1500
        });
      } catch (error) {
        console.error("[AIRecommend] ❌ 播放失败:", error);
        currentLoadingIndex.value = -1;
        store_modules_player.playerStore.clearStatusText();
        common_vendor.index.showToast({
          title: error.message || "播放失败",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const formatSinger = (singer) => {
      if (!singer)
        return "";
      if (typeof singer === "string")
        return singer;
      if (Array.isArray(singer)) {
        return singer.map((s) => s.name || s).join("、");
      }
      return String(singer);
    };
    const parseDuration = (durationStr) => {
      if (!durationStr)
        return 0;
      if (typeof durationStr === "number")
        return durationStr;
      const parts = durationStr.toString().split(":");
      if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return 0;
    };
    const formatDurationDisplay = (duration2) => {
      if (!duration2)
        return "";
      let seconds = 0;
      if (typeof duration2 === "string") {
        if (duration2.includes(":")) {
          return duration2;
        }
        seconds = parseInt(duration2);
      } else if (typeof duration2 === "number") {
        seconds = duration2 > 1e3 ? Math.floor(duration2 / 1e3) : duration2;
      }
      if (seconds <= 0)
        return "";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    const getAlbumName = (album) => {
      if (!album)
        return "";
      if (typeof album === "string")
        return album;
      if (typeof album === "object" && album.name)
        return album.name;
      return String(album);
    };
    const calculateMatchScore = (targetSong, candidate) => {
      var _a;
      let score = 0;
      const filterStr = (str) => {
        if (typeof str !== "string")
          return String(str || "");
        return str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[!！/g, "").toLowerCase();
      };
      const targetName = filterStr(targetSong.name);
      const targetSinger = filterStr(targetSong.singer);
      const targetAlbum = filterStr(targetSong.album);
      const candidateName = filterStr(candidate.name);
      const candidateSinger = filterStr(formatSinger(candidate.singer || candidate.artists));
      const candidateAlbum = filterStr(candidate.albumName || ((_a = candidate.album) == null ? void 0 : _a.name) || "");
      if (candidateName === targetName)
        score += 50;
      else if (candidateName.includes(targetName) || targetName.includes(candidateName))
        score += 25;
      if (candidateSinger === targetSinger)
        score += 30;
      else if (candidateSinger.includes(targetSinger) || targetSinger.includes(candidateSinger))
        score += 15;
      if (targetAlbum && candidateAlbum) {
        if (candidateAlbum === targetAlbum)
          score += 20;
        else if (candidateAlbum.includes(targetAlbum) || targetAlbum.includes(candidateAlbum))
          score += 10;
      }
      return score;
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const handleStartRecommend = async () => {
      if (isRefreshing.value || isAIRecommendRunning()) {
        console.log("[AIRecommend] ⚠️ 已有AI推荐正在进行，忽略重复点击");
        return;
      }
      console.log('[AIRecommend] 🚀 用户点击"启动AI引擎"按钮...');
      setAIRecommendRunning(true);
      isRefreshing.value = true;
      isLoading.value = true;
      hasError.value = false;
      recommendations.value = [];
      currentSlide.value = 0;
      resultPage.value = 0;
      aiStatusText.value = "正在基于听歌画像构建协同特征";
      try {
        await loadRecommendData(true, true);
      } catch (error) {
        console.error("[AIRecommend] ❌ 启动AI推荐失败:", error);
        hasError.value = true;
        errorMessage.value = error.message || "推荐失败";
      } finally {
        setAIRecommendRunning(false);
        isRefreshing.value = false;
        isLoading.value = false;
      }
      if (recommendations.value.length > 0) {
        setTimeout(() => {
          playSongAtIndex(0);
        }, 500);
      }
    };
    const handleRefreshRecommend = handleStartRecommend;
    const handleRefreshProfile = async () => {
      if (isAnalyzingProfile.value) {
        console.log("[AIRecommend] ⚠️ 上次分析未完成，强制重新开始");
      }
      isAnalyzingProfile.value = true;
      console.log("[AIRecommend] 🔄 用户点击刷新画像，重新计算所有数据...");
      try {
        let userData = common_vendor.index.getStorageSync("aiRecommendUserData") || {};
        let favoriteSongs = [];
        try {
          const loveList = utils_storage.getStorage("@list_love", []) || [];
          if (Array.isArray(loveList) && loveList.length > 0) {
            favoriteSongs = loveList;
            console.log("[AIRecommend] 🔄 刷新画像 - 从@list_love获取:", favoriteSongs.length, "首");
          }
        } catch (e) {
          console.warn("[AIRecommend] 刷新画像 - @list_love读取失败");
        }
        if (favoriteSongs.length === 0) {
          try {
            const importedRaw = common_vendor.index.getStorageSync("imported_playlists");
            const importedPlaylists = typeof importedRaw === "string" ? JSON.parse(importedRaw) : Array.isArray(importedRaw) ? importedRaw : [];
            if (Array.isArray(importedPlaylists)) {
              for (const playlist of importedPlaylists) {
                if (playlist.songs && Array.isArray(playlist.songs)) {
                  favoriteSongs = [...favoriteSongs, ...playlist.songs];
                }
              }
              console.log("[AIRecommend] 🔄 刷新画像 - 从导入歌单获取:", favoriteSongs.length, "首");
            }
          } catch (e) {
            console.warn("[AIRecommend] 刷新画像 - 导入歌单读取失败");
          }
        }
        if (favoriteSongs.length === 0) {
          try {
            const userLists = utils_storage.getStorage("@user_lists", []) || [];
            if (Array.isArray(userLists)) {
              for (const list of userLists) {
                if (list.list && Array.isArray(list.list)) {
                  favoriteSongs = [...favoriteSongs, ...list.list];
                }
              }
              console.log("[AIRecommend] 🔄 刷新画像 - 从用户列表获取:", favoriteSongs.length, "首");
            }
          } catch (e) {
            console.warn("[AIRecommend] 刷新画像 - 用户列表读取失败");
          }
        }
        const totalFavoriteCount = favoriteSongs.length;
        console.log("[AIRecommend] 🔎 开始扫描playRecord存储键...");
        try {
          const playHistorySample = (userData.playHistory || []).slice(0, 5);
          if (playHistorySample.length > 0) {
            console.log("[AIRecommend] 📋 历史播放列表的ID格式样本:");
            playHistorySample.forEach((song, idx) => {
              const histId = String(song.id || "");
              const histRecord = common_vendor.index.getStorageSync(`playRecord_${histId}`);
              console.log(`[AIRecommend]   历史#${idx + 1}: 《${song.name}》- id=${histId} (类型:${typeof song.id}), 有记录=${!!histRecord}`);
            });
          }
          if (favoriteSongs.length > 0) {
            console.log("[AIRecommend] 📋 收藏列表的ID格式样本:");
            favoriteSongs.slice(0, 5).forEach((song, idx) => {
              const favId = String(song.id || "");
              const favRecord = common_vendor.index.getStorageSync(`playRecord_${favId}`);
              console.log(`[AIRecommend]   收藏#${idx + 1}: 《${song.name}》- id=${favId} (类型:${typeof song.id}), 有记录=${!!favRecord}`);
            });
          }
        } catch (e) {
          console.warn("[AIRecommend] ⚠️ 扫描playRecord失败:", e.message);
        }
        userData.favoriteSongs = favoriteSongs.slice(0, 500).map((song, index) => {
          var _a, _b;
          const songId = String(song.id || "");
          const playRecord = common_vendor.index.getStorageSync(`playRecord_${songId}`);
          if (index < 10) {
            console.log(
              `[AIRecommend] 🔍 收藏#${index + 1}: 《${song.name}》- id=${songId} (类型:${typeof song.id}), playRecord=`,
              playRecord ? `✅ 有记录(播放${playRecord.playCount}次)` : "❌ null"
            );
          }
          return {
            name: song.name,
            singer: song.singer || (Array.isArray(song.ar) ? song.ar.map((a) => a.name).join("、") : ""),
            album: song.albumName || ((_a = song.album) == null ? void 0 : _a.name) || ((_b = song.al) == null ? void 0 : _b.name) || "",
            source: song.source || "",
            addTime: song.addTime || Date.now(),
            // 加入完播率数据（收藏歌曲的播放行为更能反映真实喜好）
            playRecord: playRecord ? {
              playCount: playRecord.playCount || 0,
              fullPlayCount: playRecord.fullPlayCount || 0,
              avgCompletionRate: calculateAvgCompletionRate(playRecord),
              lastPlayTime: playRecord.lastPlayTime || 0
            } : null
          };
        }).filter((song) => song.name);
        userData.totalFavoriteCount = totalFavoriteCount;
        console.log("[AIRecommend] 🔄 刷新画像 - 真实收藏总数:", totalFavoriteCount, "首，传给AI:", userData.favoriteSongs.length, "首");
        try {
          console.log("[AIRecommend] 🔄 刷新画像 - 开始收集历史播放数据...");
          const rawPlayHistory = common_vendor.index.getStorageSync("playHistory");
          let playHistoryArr = [];
          if (typeof rawPlayHistory === "string") {
            try {
              playHistoryArr = JSON.parse(rawPlayHistory) || [];
            } catch (e) {
              playHistoryArr = [];
            }
          } else if (Array.isArray(rawPlayHistory)) {
            playHistoryArr = rawPlayHistory;
          }
          if (playHistoryArr.length > 0) {
            userData.playHistory = playHistoryArr.slice(0, 200).map((song) => {
              const songId = String(song.id || "");
              const playRecord = songId ? common_vendor.index.getStorageSync(`playRecord_${songId}`) : null;
              return {
                name: song.name,
                singer: song.singer || (Array.isArray(song.ar) ? song.ar.map((a) => a.name).join("、") : ""),
                album: song.albumName || song.album && song.album.name || song.al && song.al.name || "",
                source: song.source || "",
                playTime: song.playTime || 0,
                playRecord: playRecord ? {
                  playCount: playRecord.playCount || 0,
                  fullPlayCount: playRecord.fullPlayCount || 0,
                  avgCompletionRate: calculateAvgCompletionRate(playRecord),
                  lastPlayTime: playRecord.lastPlayTime || 0
                } : null
              };
            }).filter((song) => song.name);
            userData.totalPlayHistoryCount = playHistoryArr.length;
            console.log("[AIRecommend] 🔄 刷新画像 - 历史播放总数:", userData.totalPlayHistoryCount, "首，传给AI:", userData.playHistory.length, "首");
          } else {
            if (!userData.playHistory)
              userData.playHistory = [];
            userData.totalPlayHistoryCount = 0;
            console.log("[AIRecommend] 🔄 刷新画像 - 无历史播放数据");
          }
        } catch (e) {
          console.warn("[AIRecommend] 刷新画像 - 历史播放数据收集失败:", e.message);
          if (!userData.playHistory)
            userData.playHistory = [];
        }
        common_vendor.index.removeStorageSync("aiUserProfileData");
        common_vendor.index.removeStorageSync("aiUserProfileCache");
        const basicProfile = generateBasicUserProfile(userData);
        try {
          await analyzeUserProfileWithAI(userData);
          common_vendor.index.showToast({ title: "画像已更新", icon: "success", duration: 1500 });
        } catch (aiError) {
          console.warn("[AIRecommend] ⚠️ AI画像分析失败，使用基础画像兜底:", aiError.message);
          userProfileData.value = basicProfile;
          profileUpdateTime.value = "刚刚";
          common_vendor.index.showToast({ title: "AI分析失败，已使用基础画像", icon: "none", duration: 2e3 });
        }
      } catch (error) {
        console.error("[AIRecommend] ❌ 刷新用户画像失败:", error);
        common_vendor.index.showToast({ title: "刷新失败: " + (error.message || "未知错误"), icon: "none", duration: 2e3 });
      } finally {
        isAnalyzingProfile.value = false;
      }
    };
    const startLoadingAnimation = () => {
      loadingMessageIndex = 0;
      updateLoadingMessage();
      loadingMessageTimer = setInterval(updateLoadingMessage, 3e3);
    };
    const updateLoadingMessage = () => {
      if (loadingMessageIndex < loadingMessages.length) {
        const msg = loadingMessages[loadingMessageIndex];
        loadingText.value = msg.text;
        loadingSubtext.value = msg.sub;
        loadingMessageIndex++;
      }
    };
    const stopLoadingAnimation = () => {
      if (loadingMessageTimer) {
        clearInterval(loadingMessageTimer);
        loadingMessageTimer = null;
      }
    };
    const isLongProfileValue = (value) => String(value || "").length > 7;
    const loadOrAnalyzeUserProfile = async (userData, forceRefresh = false) => {
      console.log("[AIRecommend] 👤 开始加载用户画像...", forceRefresh ? "（强制刷新模式）" : "");
      try {
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const cachedProfile = common_vendor.index.getStorageSync("aiUserProfileCache");
        if (!forceRefresh && cachedProfile && cachedProfile.date === today && cachedProfile.data) {
          console.log("[AIRecommend] ✅ 使用缓存的用户画像");
          userProfileData.value = cachedProfile.data;
          profileUpdateTime.value = `今日 ${new Date(cachedProfile.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 分析`;
          return;
        }
        if (forceRefresh) {
          console.log("[AIRecommend] 🔄 强制刷新：跳过画像缓存，重新生成...");
          common_vendor.index.removeStorageSync("aiUserProfileCache");
          common_vendor.index.removeStorageSync("aiUserProfileData");
        }
        console.log("[AIRecommend] 📊 生成基础用户画像...");
        const basicProfile = generateBasicUserProfile(userData);
        userProfileData.value = basicProfile;
        profileUpdateTime.value = "刚刚";
        try {
          await analyzeUserProfileWithAI(userData);
        } catch (err) {
          console.warn("[AIRecommend] ⚠️ 后台AI画像分析失败:", err.message);
        }
      } catch (error) {
        console.error("[AIRecommend] ❌ 加载用户画像失败:", error);
      }
    };
    const generateBasicUserProfile = (userData) => {
      var _a, _b, _c, _d, _e, _f;
      const profile = {
        musicStyles: [],
        // 偏好流派
        languagePreference: "",
        // 语言偏好
        emotionTone: "",
        // 情绪基调
        rhythmPreference: "",
        // 节奏偏好
        voicePreference: "",
        // 声音偏好
        eraPreference: "",
        // 年代偏好
        profileName: "",
        profileDesc: "",
        matchPercent: null,
        // 基于真实数据计算，不再随机生成
        stats: null
      };
      try {
        const styleMap = {};
        const allSongs = [...userData.playHistory || [], ...userData.favoriteSongs || []];
        allSongs.forEach((song) => {
          if (song.tags && Array.isArray(song.tags)) {
            song.tags.forEach((tag) => {
              styleMap[tag] = (styleMap[tag] || 0) + 1;
            });
          }
          if (song.genre)
            styleMap[song.genre] = (styleMap[song.genre] || 0) + 1;
        });
        profile.musicStyles = Object.entries(styleMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([style]) => style);
        let chineseCount = 0;
        let totalCount = allSongs.length;
        allSongs.forEach((song) => {
          if (/[\u4e00-\u9fa5]/.test(song.name || ""))
            chineseCount++;
        });
        if (totalCount > 0) {
          const ratio = chineseCount / totalCount;
          if (ratio >= 0.8)
            profile.languagePreference = `华语 ${Math.round(ratio * 100)}%`;
          else if (ratio >= 0.5)
            profile.languagePreference = `华语为主 ${Math.round(ratio * 100)}%`;
          else if (ratio >= 0.3)
            profile.languagePreference = `中英混合`;
          else
            profile.languagePreference = `欧美为主 ${Math.round((1 - ratio) * 100)}%`;
        } else {
          profile.languagePreference = "混合";
        }
        const emotionKeywords = {
          "治愈舒缓": ["治愈", "轻音乐", "纯音乐", "钢琴", "民谣", "田馥甄", "苏打绿", "陈绮贞", "李健", "毛不易"],
          "热血燃向": ["摇滚", "说唱", "rap", "摇滚", "五月天", "GAI", "华晨宇", "邓紫棋"],
          "忧郁深沉": ["悲伤", "伤感", "薛之谦", "陈奕迅", "林宥嘉", "杨宗纬"],
          "轻快明朗": ["流行", "快乐", "活泼", "王心凌", "蔡依林", "BLACKPINK", "TWICE"]
        };
        const emotionScores = {};
        allSongs.forEach((song) => {
          const text = `${song.name} ${song.singer || ""} ${(song.tags || []).join(" ")}`.toLowerCase();
          for (const [emo, keywords] of Object.entries(emotionKeywords)) {
            if (keywords.some((kw) => text.includes(kw))) {
              emotionScores[emo] = (emotionScores[emo] || 0) + 1;
            }
          }
        });
        const sortedEmotions = Object.entries(emotionScores).sort((a, b) => b[1] - a[1]);
        profile.emotionTone = sortedEmotions.length > 0 ? sortedEmotions[0][0] : "多元探索";
        const rhythmKeywords = {
          "慢节奏": ["慢歌", "抒情", "民谣", "纯音乐", "钢琴曲", "李健", "毛不易", "田馥甄"],
          "中速律动": ["流行", "R&B", "爵士", "周杰伦", "林俊杰", "方大同", "陶喆"],
          "高能量": ["电子", "舞曲", "摇滚", "说唱", "EDM", "BLACKPINK", "邓紫棋", "华晨宇"]
        };
        const rhythmScores = {};
        allSongs.forEach((song) => {
          const text = `${song.name} ${song.singer || ""} ${(song.tags || []).join(" ")}`;
          for (const [rhy, keywords] of Object.entries(rhythmKeywords)) {
            if (keywords.some((kw) => text.includes(kw))) {
              rhythmScores[rhy] = (rhythmScores[rhy] || 0) + 1;
            }
          }
        });
        const sortedRhythms = Object.entries(rhythmScores).sort((a, b) => b[1] - a[1]);
        profile.rhythmPreference = sortedRhythms.length > 0 ? sortedRhythms[0][0] : "中速律动";
        const femaleArtists = ["邓紫棋", "田馥甄", "刘若英", "梁静茹", "孙燕姿", "G.E.M.", "王心琳", "蔡依林", "张靓颖"];
        const maleArtists = ["周杰伦", "薛之谦", "林俊杰", "陈奕迅", "李荣浩", "赵雷", "朴树", "胡夏", "毛不易", "李健"];
        const bandArtists = ["五月天", "苏打绿", "草东没有派对", "告五人", "Beyond", "BEYOND"];
        let femaleCount = 0, maleCount = 0, bandCount = 0;
        const artistNames = /* @__PURE__ */ new Set();
        allSongs.forEach((song) => {
          if (!song.singer || artistNames.has(song.singer))
            return;
          artistNames.add(song.singer);
          if (femaleArtists.some((a) => song.singer.includes(a)))
            femaleCount++;
          else if (maleArtists.some((a) => song.singer.includes(a)))
            maleCount++;
          else if (bandArtists.some((a) => song.singer.includes(a)))
            bandCount++;
        });
        if (femaleCount > maleCount && femaleCount > bandCount)
          profile.voicePreference = "女声为主";
        else if (maleCount > femaleCount && maleCount > bandCount)
          profile.voicePreference = "男声为主";
        else if (bandCount > 0 && bandCount >= Math.max(femaleCount, maleCount))
          profile.voicePreference = "乐队组合";
        else
          profile.voicePreference = "男女均衡";
        const eraKeywords = {
          "经典怀旧": ["经典", "老歌", "张学友", "刘德华", "王菲", "Beyond", "邓丽君", "罗大佑"],
          "千禧金曲": ["周杰伦", "林俊杰", "孙燕姿", "梁静茹", "王力宏", "SHE", "S.H.E", "蔡依林"],
          "2010s热单": ["薛之谦", "邓紫棋", "李荣浩", "华晨宇", "毛不易", "陈粒"],
          "最新潮流": ["2024", "2023", "2025", "新歌", "热门"]
        };
        const eraScores = {};
        allSongs.forEach((song) => {
          const text = `${song.name} ${song.singer || ""}`;
          for (const [era, keywords] of Object.entries(eraKeywords)) {
            if (keywords.some((kw) => text.includes(kw))) {
              eraScores[era] = (eraScores[era] || 0) + 1;
            }
          }
        });
        const sortedEras = Object.entries(eraScores).sort((a, b) => b[1] - a[1]);
        profile.eraPreference = sortedEras.length > 0 ? sortedEras[0][0] : "2010s";
        const topStyle = profile.musicStyles[0] || "流行";
        const emotion = profile.emotionTone;
        const lang = profile.languagePreference.includes("华语") ? "华语" : profile.languagePreference.includes("欧美") ? "欧美" : "多语种";
        const nameParts = [];
        if (emotion === "治愈舒缓")
          nameParts.push("治愈系");
        else if (emotion === "热血燃向")
          nameParts.push("热血系");
        else if (emotion === "忧郁深沉")
          nameParts.push("感性系");
        else
          nameParts.push("乐享派");
        nameParts.push(`${lang}${topStyle}爱好者`);
        profile.profileName = nameParts.join("");
        const descParts = [];
        descParts.push(`偏爱${topStyle}与${profile.musicStyles[1] || lang}`);
        descParts.push(`${emotion}风格`);
        if (profile.rhythmPreference !== "中速律动")
          descParts.push(profile.rhythmPreference);
        if (profile.voicePreference !== "男女均衡")
          descParts.push(profile.voicePreference);
        profile.profileDesc = `基于${allSongs.length}首听歌记录，${descParts.join("，")}的个性化画像`;
        profile.stats = {
          totalHistorySongs: ((_a = userData.playHistory) == null ? void 0 : _a.length) || 0,
          totalFavoriteSongs: userData.totalFavoriteCount || ((_b = userData.favoriteSongs) == null ? void 0 : _b.length) || 0,
          topArtistCount: ((_c = userData.topArtists) == null ? void 0 : _c.length) || 0,
          totalPlaylists: ((_d = userData.playlists) == null ? void 0 : _d.length) || 0
        };
        const historyScore = Math.min((((_e = userData.playHistory) == null ? void 0 : _e.length) || 0) / 20, 1) * 30;
        const favoriteScore = Math.min((userData.totalFavoriteCount || 0) / 50, 1) * 35;
        const artistScore = Math.min((((_f = userData.topArtists) == null ? void 0 : _f.length) || 0) / 5, 1) * 20;
        const styleScore = profile.musicStyles.length > 0 ? 10 : 3;
        const baseScore = 60 + historyScore + favoriteScore + artistScore + styleScore;
        profile.matchPercent = Math.min(Math.round(baseScore), 99);
      } catch (error) {
        console.error("[AIRecommend] 生成基础画像出错:", error);
      }
      return profile;
    };
    const analyzeUserProfileWithAI = async (userData) => {
      console.log("[AIRecommend] 🤖 开始调用AI深度分析用户画像...");
      isAnalyzingProfile.value = true;
      try {
        const prompt = buildUserProfileAnalysisPrompt(userData);
        const customConfig = common_vendor.index.getStorageSync("aiApiConfig");
        if (customConfig && customConfig.apiKey) {
          console.log("[AIRecommend] 🤖 使用自定义API分析画像...");
          await callCustomAPIForProfile(prompt, customConfig);
          return;
        }
        console.log("[AIRecommend] 🤖 未配置自定义API，使用默认后端分析画像...");
        await callBackendAPIForProfile(prompt);
      } finally {
        isAnalyzingProfile.value = false;
      }
    };
    const callCustomAPIForProfile = async (prompt, config) => {
      var _a, _b, _c;
      let baseURL = config.baseURL || "";
      baseURL = baseURL.replace(/\/+$/, "");
      let apiUrl;
      if (baseURL.includes("/chat/completions")) {
        apiUrl = baseURL;
      } else if (baseURL.endsWith("/v1") || baseURL.endsWith("/v1/")) {
        apiUrl = `${baseURL.replace(/\/+$/, "")}/chat/completions`;
      } else {
        apiUrl = `${baseURL}/chat/completions`;
      }
      const requestBody = {
        model: config.model || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "你是一个专业的音乐画像分析师，根据用户的听歌记录和收藏数据，分析用户的6维音乐偏好特征。请严格返回JSON格式。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2048
      };
      console.log("[AIRecommend] 🤖 自定义API - 画像分析请求:", { URL: apiUrl, 模型: requestBody.model });
      const response = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("请求超时")), 3e4);
        common_vendor.index.request({
          url: apiUrl,
          method: "POST",
          timeout: 3e4,
          header: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
          data: requestBody,
          success: (res) => {
            clearTimeout(timer);
            resolve(res);
          },
          fail: (err) => {
            clearTimeout(timer);
            reject(new Error(err.errMsg));
          }
        });
      });
      if (!response.ok && response.statusCode >= 400)
        throw new Error(`API请求失败: ${response.statusCode}`);
      const data = typeof response.json === "function" ? await response.json() : response.data;
      const content = (_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
      if (!content)
        throw new Error("AI返回内容为空");
      console.log("[AIRecommend] 📥 自定义API - 画像响应:", typeof content === "string" ? content.substring(0, 200) : JSON.stringify(content).substring(0, 200));
      applyAIProfileResult(content);
    };
    const callBackendAPIForProfile = async (prompt) => {
      const apiUrl = utils_config.getApiUrl("/api/ai/chat");
      const requestBody = {
        messages: [
          { role: "system", content: "你是一个专业的音乐画像分析师，根据用户的听歌记录和收藏数据，分析用户的6维音乐偏好特征。请严格返回JSON格式。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2048
      };
      console.log("[AIRecommend] 🌐 默认后端 - 画像分析请求:", { URL: apiUrl, 提示词长度: prompt.length });
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("请求超时")), 6e4);
        common_vendor.index.request({
          url: apiUrl,
          method: "POST",
          timeout: 6e4,
          header: { "Content-Type": "application/json" },
          data: requestBody,
          success: (res) => {
            var _a, _b, _c;
            clearTimeout(timer);
            console.log("[AIRecommend] 📦 后端画像响应:", JSON.stringify(res.data).substring(0, 300));
            if (res.statusCode >= 200 && res.statusCode < 300) {
              let content = null;
              if ((_b = (_a = res.data) == null ? void 0 : _a.data) == null ? void 0 : _b.response) {
                content = res.data.data.response;
              } else if (typeof res.data === "string") {
                content = res.data;
              } else if ((_c = res.data) == null ? void 0 : _c.response) {
                content = res.data.response;
              } else {
                content = res.data;
              }
              if (!content)
                return reject(new Error("后端返回内容为空"));
              if (typeof content !== "string") {
                console.log("[AIRecommend] 📥 后端画像提取内容(对象):", JSON.stringify(content).substring(0, 200));
              } else {
                console.log("[AIRecommend] 📥 后端画像提取内容(字符串):", content.substring(0, 200));
              }
              applyAIProfileResult(content);
              resolve();
            } else {
              reject(new Error(`后端请求失败(${res.statusCode})`));
            }
          },
          fail: (err) => {
            clearTimeout(timer);
            reject(new Error(err.errMsg));
          }
        });
      });
    };
    const applyAIProfileResult = (content) => {
      const aiProfile = parseUserProfileResponse(content);
      if (aiProfile) {
        userProfileData.value = { ...userProfileData.value, ...aiProfile };
        const today = (/* @__PURE__ */ new Date()).toDateString();
        common_vendor.index.setStorageSync("aiUserProfileCache", {
          date: today,
          data: userProfileData.value,
          timestamp: Date.now()
        });
        profileUpdateTime.value = `今日 ${(/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 分析`;
        console.log("[AIRecommend] ✅ AI用户画像分析完成:", aiProfile);
      }
    };
    const buildUserProfileAnalysisPrompt = (userData) => {
      var _a, _b, _c, _d;
      let prompt = `请根据以下用户的听歌数据，深入分析用户的基本信息和音乐偏好。

[用户数据概览]
- 历史播放记录：${((_a = userData.playHistory) == null ? void 0 : _a.length) || 0} 首
- 收藏歌曲数量：${((_b = userData.favoriteSongs) == null ? void 0 : _b.length) || 0} 首
- 不喜欢歌手：${((_c = userData.dislikeList) == null ? void 0 : _c.length) || 0} 位
- 常听歌手：${((_d = userData.topArtists) == null ? void 0 : _d.length) || 0} 位

`;
      if (userData.playHistory && userData.playHistory.length > 0) {
        const highCompletionSongs = userData.playHistory.filter((song) => {
          const rate = song.playRecord ? Number(song.playRecord.avgCompletionRate) || 0 : 0;
          return rate >= 70;
        }).slice(0, 10).map((song) => `${song.name}-${song.singer}`);
        prompt += `[高完播率(>=70%)歌曲 - 用户最爱，共${highCompletionSongs.length}首]
`;
        prompt += highCompletionSongs.length > 0 ? highCompletionSongs.join(", ") + "\n" : "（暂无）\n";
        const recentSongs = userData.playHistory.slice(0, 10).map((song) => `${song.name}-${song.singer}`);
        prompt += `
[最近播放 - 共${userData.playHistory.length}首，展示前${recentSongs.length}首]
`;
        prompt += recentSongs.join(", ") + "\n";
      }
      if (userData.favoriteSongs && userData.favoriteSongs.length > 0) {
        prompt += `
[收藏歌单 - ${userData.favoriteSongs.length}首（最重要的品味指标，用户主动收藏=真实喜好）]
`;
        prompt += `请重点分析：音乐风格、语言偏好、情感类型、歌手偏好

`;
        const highCompletionFavorites = userData.favoriteSongs.filter((s) => {
          if (!s.playRecord || !s.playRecord.avgCompletionRate)
            return false;
          return parseFloat(s.playRecord.avgCompletionRate) >= 70;
        });
        const multiPlayFavorites = userData.favoriteSongs.filter((s) => {
          if (!s.playRecord)
            return false;
          const rate = parseFloat(s.playRecord.avgCompletionRate) || 0;
          const fullPlayCount = s.playRecord.fullPlayCount || 0;
          const playCount = s.playRecord.playCount || 0;
          return rate >= 50 && rate < 70 && (fullPlayCount >= 3 || playCount >= 5);
        });
        const trueLoveSet = /* @__PURE__ */ new Set();
        [...highCompletionFavorites, ...multiPlayFavorites].forEach((song) => {
          trueLoveSet.add(`${song.name}-${song.singer}`);
        });
        console.log(`[AIRecommend] 收藏分类: 真爱${trueLoveSet.size}首(高完播${highCompletionFavorites.length}+多次${multiPlayFavorites.length}) / 普通${userData.favoriteSongs.length - trueLoveSet.size}首`);
        if (trueLoveSet.size > 0) {
          const trueLoveList = Array.from(trueLoveSet).slice(0, 15);
          prompt += `[真爱收藏 - ${trueLoveSet.size}首（收藏+经常完播=真正最爱）]
`;
          prompt += trueLoveList.join(", ");
          if (trueLoveSet.size > 15)
            prompt += `
... 等${trueLoveSet.size}首`;
          prompt += `

`;
        }
        const normalFavorites = userData.favoriteSongs.filter((s) => !trueLoveSet.has(`${s.name}-${s.singer}`)).slice(0, 30).map((s) => `${s.name}-${s.singer}`);
        if (normalFavorites.length > 0) {
          prompt += `[普通收藏 - 展示前${normalFavorites.length}首]
`;
          prompt += normalFavorites.join(", ") + "\n\n";
        }
        const favoriteArtists = {};
        userData.favoriteSongs.forEach((song) => {
          if (song.singer) {
            const weight = song.playRecord && song.playRecord.avgCompletionRate >= 70 ? 3 : 1;
            favoriteArtists[song.singer] = (favoriteArtists[song.singer] || 0) + weight;
          }
        });
        const topFavoriteArtists = Object.entries(favoriteArtists).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([artist]) => artist);
        if (topFavoriteArtists.length > 0) {
          prompt += `[收藏歌手Top5（加权：真爱x3+普通x1）] ${topFavoriteArtists.join(", ")}
`;
        }
      } else {
        prompt += `
[未找到收藏歌曲数据]
`;
      }
      if (userData.dislikeList && userData.dislikeList.length > 0) {
        prompt += `
[不喜欢的歌手] ${userData.dislikeList.join(", ")}
`;
        prompt += `分析时避免推荐这些歌手的风格
`;
      }
      if (userData.topArtists && userData.topArtists.length > 0) {
        const topArtistsList = userData.topArtists.slice(0, 5).map(
          (artist) => typeof artist === "string" ? artist : artist.name || artist
        );
        if (topArtistsList.length > 0) {
          prompt += `
[常听歌手Top5 - 风格参考] ${topArtistsList.join(", ")}
`;
        }
      } else if (userData.playHistory && userData.playHistory.length > 0) {
        const artistCount = {};
        userData.playHistory.forEach((song) => {
          if (song.singer) {
            artistCount[song.singer] = (artistCount[song.singer] || 0) + 1;
          }
        });
        const topArtistsFromHistory = Object.entries(artistCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([artist]) => artist);
        if (topArtistsFromHistory.length > 0) {
          prompt += `
[常听歌手Top5 - 从历史播放统计] ${topArtistsFromHistory.join(", ")}
`;
        }
      }
      prompt += `
[返回格式要求]

请以JSON格式返回6维音乐画像分析结果：
{
  "musicStyles": ["偏好流派1", "流派2", "流派3"],
  "languagePreference": "语言偏好描述（如：华语70%、欧美30%）",
  "emotionTone": "情绪基调（治愈舒缓 / 热血燃向 / 忧郁深沉 / 轻快明朗 / 多元探索）",
  "rhythmPreference": "节奏偏好（慢节奏 / 中速律动 / 高能量）",
  "voicePreference": "声音偏好（女声为主 / 男声为主 / 乐队组合 / 男女均衡）",
  "eraPreference": "年代偏好（经典怀旧 / 千禧金曲 / 2010s热单 / 最新潮流）",
  "profileName": "画像名称（如：治愈系华语流行爱好者，2-8个字）",
  "profileDesc": "画像描述（一句话概括用户音乐品味特征）",
  "matchPercent": 匹配度百分比整数(0-99)，基于以下规则计算：数据量充足且画像特征明显时给85-99，有部分数据但特征不够明确时给60-84，数据很少或画像模糊时给30-59
}

[分析要求]
1. 基于实际听歌记录和收藏数据分析，不要猜测
2. 重点参考收藏歌单（用户主动收藏=真实喜好）
3. 结合历史播放记录看近期兴趣变化
4. 考虑不喜欢列表避免推荐相关风格
5. profileName要简洁有辨识度（情绪+语言+流派组合）
6. profileDesc要具体有洞察力
7. matchPercent必须基于实际数据量客观评估，不要随意给高分`;
      return prompt;
    };
    const parseUserProfileResponse = (content) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      try {
        let profile;
        if (typeof content === "object" && content !== null) {
          profile = content;
          console.log("[AIRecommend] 📊 画像内容已是对象，直接使用");
        } else {
          let jsonStr = String(content).trim();
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
          }
          profile = JSON.parse(jsonStr);
        }
        console.log("[AIRecommend] 📊 AI画像分析结果:", {
          流派: profile.musicStyles,
          语言: profile.languagePreference,
          情绪: profile.emotionTone,
          节奏: profile.rhythmPreference,
          声音: profile.voicePreference,
          年代: profile.eraPreference,
          名称: profile.profileName,
          描述: profile.profileDesc
        });
        return {
          musicStyles: profile.musicStyles || ((_a = userProfileData.value) == null ? void 0 : _a.musicStyles) || [],
          languagePreference: profile.languagePreference || ((_b = userProfileData.value) == null ? void 0 : _b.languagePreference) || "",
          emotionTone: profile.emotionTone || ((_c = userProfileData.value) == null ? void 0 : _c.emotionTone) || "",
          rhythmPreference: profile.rhythmPreference || ((_d = userProfileData.value) == null ? void 0 : _d.rhythmPreference) || "",
          voicePreference: profile.voicePreference || ((_e = userProfileData.value) == null ? void 0 : _e.voicePreference) || "",
          eraPreference: profile.eraPreference || ((_f = userProfileData.value) == null ? void 0 : _f.eraPreference) || "",
          profileName: profile.profileName || ((_g = userProfileData.value) == null ? void 0 : _g.profileName) || "音乐探索者",
          profileDesc: profile.profileDesc || ((_h = userProfileData.value) == null ? void 0 : _h.profileDesc) || "",
          matchPercent: profile.matchPercent || null
        };
      } catch (error) {
        console.error("[AIRecommend] 解析用户画像失败:", error);
        return null;
      }
    };
    const getHotSearchDataForAI = async () => {
      try {
        common_vendor.index.showLoading({ title: "正在获取热门数据..." });
        const results = await Promise.allSettled([
          services_api.searchApi.getWyHotSearch(),
          services_api.searchApi.getTxHotSearch(),
          services_api.searchApi.getKgHotSearch(),
          services_api.searchApi.getKwHotSearch(),
          services_api.searchApi.getMgHotSearch()
        ]);
        const hotSearchData = {};
        const sourceNames = {
          wy: "网易云音乐",
          tx: "QQ音乐",
          kg: "酷狗音乐",
          kw: "酷我音乐",
          mg: "咪咕音乐"
        };
        results.forEach((result, index) => {
          const sources = ["wy", "tx", "kg", "kw", "mg"];
          const source = sources[index];
          if (result.status === "fulfilled" && result.value) {
            hotSearchData[source] = {
              name: sourceNames[source],
              data: result.value
            };
          }
        });
        common_vendor.index.hideLoading();
        if (Object.keys(hotSearchData).length > 0) {
          return { hotSearchData };
        }
        return null;
      } catch (error) {
        console.error("[AIRecommend] 获取热搜数据失败:", error);
        common_vendor.index.hideLoading();
        return null;
      }
    };
    const callAIAPIForRecommend = async (userData) => {
      const config = common_vendor.index.getStorageSync("aiApiConfig") || apiConfig.value;
      if (!config) {
        console.log("[AIRecommend] ⚠️ 未找到AI API配置");
        showGuideToSettingsModal("检测到未配置AI接口，请选择一种方式继续使用智能推荐功能");
        throw new Error("未找到AI API配置");
      }
      const isBackendMode = config.provider === "backend";
      const REQUEST_COUNT = 60;
      const FINAL_COUNT = 50;
      const MAX_RETRIES = 3;
      console.log("[AIRecommend] 🚀 调用AI API:", {
        模式: isBackendMode ? "默认后端(60取50，跨轮合并)" : "自定义API",
        平台: config.provider || "custom",
        最大重试次数: MAX_RETRIES
      });
      if (isBackendMode) {
        const excludedData = buildLayeredExcludedData(userData);
        const excludedKeys = buildExcludedSongKeys(userData);
        const STOP_THRESHOLD = 40;
        const mergedValidSongs = [];
        const mergedKeys = /* @__PURE__ */ new Set();
        let previousDuplicatedSongs = [];
        let previousViolationSongs = [];
        for (let round = 0; round < MAX_RETRIES; round++) {
          const prompt2 = buildAIPromptForAI(userData, {
            retryRound: round,
            previousDuplicatedSongs,
            previousViolationSongs,
            requestCount: REQUEST_COUNT
          });
          console.log(`[AIRecommend] 🚀 第${round + 1}/${MAX_RETRIES}次请求, 提示词长度:`, prompt2.length);
          if (round === 0) {
            aiStatusText.value = "正在等待AI接口返回数据...";
          } else {
            aiStatusText.value = `检测到重复率过高，正在进行第${round + 1}次获取...`;
          }
          let result;
          try {
            result = await callBackendAIAPISingle(prompt2, userData, REQUEST_COUNT);
          } catch (e) {
            console.warn(`[AIRecommend] ⚠️ 第${round + 1}次请求失败:`, e.message);
            continue;
          }
          aiStatusText.value = `正在分析第${round + 1}次推荐结果...`;
          const analyzed = analyzeRepeatRate(result, excludedData);
          console.log(`[AIRecommend] 📊 第${round + 1}轮分析：返回${result.length}首，与严格排除重复${analyzed.duplicatedSongs.length}首，重复率${(analyzed.repeatRate * 100).toFixed(1)}%`);
          const filteredSongs = parseAndValidateSongs(result, excludedKeys, REQUEST_COUNT, REQUEST_COUNT);
          if (!filteredSongs || filteredSongs.length === 0) {
            console.warn(`[AIRecommend] ⚠️ 第${round + 1}轮过滤后无有效歌曲`);
            previousDuplicatedSongs = analyzed.duplicatedSongs;
            previousViolationSongs = analyzed.violationSongs;
            continue;
          }
          let addedCount = 0;
          filteredSongs.forEach((song) => {
            const key = `${song.name}-${song.singer}`.toLowerCase();
            if (!mergedKeys.has(key)) {
              mergedKeys.add(key);
              mergedValidSongs.push(song);
              addedCount++;
            }
          });
          console.log(`[AIRecommend] ✅ 第${round + 1}轮合并：新增${addedCount}首，累计有效${mergedValidSongs.length}首`);
          if (mergedValidSongs.length >= STOP_THRESHOLD) {
            console.log(`[AIRecommend] ✅ 累计有效歌曲达到${STOP_THRESHOLD}首，停止请求`);
            break;
          }
          previousDuplicatedSongs = analyzed.duplicatedSongs;
          previousViolationSongs = analyzed.violationSongs;
          if (round < MAX_RETRIES - 1) {
            console.log(`[AIRecommend] 🔄 累计有效歌曲不足${STOP_THRESHOLD}首，进入第${round + 2}次请求...`);
            aiStatusText.value = `已获取${mergedValidSongs.length}首有效歌曲，准备第${round + 2}次获取...`;
          }
        }
        if (mergedValidSongs.length > 0) {
          const aSongs = mergedValidSongs.filter((s) => s.category === "A");
          const bSongs = mergedValidSongs.filter((s) => s.category !== "A");
          const finalSongs = [...aSongs, ...bSongs].slice(0, FINAL_COUNT);
          console.log(`[AIRecommend] ✅ 最终返回 ${finalSongs.length} 首合并后的歌曲（A类${aSongs.slice(0, FINAL_COUNT).length}首）`);
          return finalSongs;
        }
        throw new Error("AI推荐未能返回有效结果");
      }
      const prompt = buildAIPromptForAI(userData, { requestCount: REQUEST_COUNT });
      console.log("[AIRecommend] 🚀 自定义API单次请求, 提示词长度:", prompt.length);
      const customResult = await callCustomAIAPI(prompt, config, userData);
      return (customResult || []).slice(0, FINAL_COUNT);
    };
    const callBackendAIAPISingle = async (prompt, userData, requestCount = 60) => {
      const apiUrl = utils_config.getApiUrl("/api/ai/chat");
      const estimatedTokens = Math.min(Math.max(requestCount * 300, 6e3), 2e4);
      const requestBody = {
        messages: [
          { role: "system", content: "你是专业音乐推荐助手。直接输出JSON数组，不要做任何推理分析。严格遵守排除规则，已推荐过的歌曲绝对不能再推荐。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        // 降低温度提高稳定性，减少AI违反排除规则的概率
        max_tokens: estimatedTokens
      };
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("请求超时"));
        }, 3e5);
        common_vendor.index.request({
          url: apiUrl,
          method: "POST",
          timeout: 3e5,
          header: { "Content-Type": "application/json" },
          data: requestBody,
          success: (res) => {
            clearTimeout(timer);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const result = parseAIResponse(res.data, /* @__PURE__ */ new Set(), requestCount, requestCount);
                resolve(result || []);
              } catch (e) {
                reject(new Error("解析AI响应失败: " + e.message));
              }
            } else if (res.statusCode === 404 || res.statusCode === 501) {
              showGuideToSettingsModal("当前后端暂不支持AI接口，请前往设置页面配置第三方AI服务或稍后再试");
              reject(new Error("后端AI接口不可用"));
            } else {
              reject(new Error(`后端请求失败(${res.statusCode})`));
            }
          },
          fail: (err) => {
            clearTimeout(timer);
            reject(new Error(err.errMsg || "网络请求失败"));
          }
        });
      });
    };
    const callCustomAIAPI = async (prompt, config, userData, requestCount = 60) => {
      if (!config.apiKey) {
        showGuideToSettingsModal("当前选择的AI服务商需要API密钥，请前往设置页面配置");
        throw new Error("未配置API密钥");
      }
      let baseURL = config.baseURL || "";
      baseURL = baseURL.replace(/\/+$/, "");
      let apiUrl;
      if (baseURL.includes("/chat/completions")) {
        apiUrl = baseURL;
      } else if (baseURL.endsWith("/v1") || baseURL.endsWith("/v1/")) {
        apiUrl = `${baseURL.replace(/\/+$/, "")}/chat/completions`;
      } else {
        apiUrl = `${baseURL}/chat/completions`;
      }
      const apiKey = config.apiKey;
      const modelName = config.model || "gpt-3.5-turbo";
      const estimatedTokens = Math.min(Math.max(requestCount * 300, 6e3), 2e4);
      const requestBody = {
        model: modelName,
        messages: [
          { role: "system", content: "你是专业音乐推荐助手。直接输出JSON数组，不要做任何推理分析。严格遵守排除规则，已推荐过的歌曲绝对不能再推荐。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: estimatedTokens
      };
      console.log("[AIRecommend] 🔗 调用自定义AI API:", {
        平台: config.provider || "custom",
        模型: modelName,
        完整URL: apiUrl,
        API密钥: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "未配置",
        请求参数: JSON.stringify(requestBody, null, 2).substring(0, 500) + "..."
      });
      const requestWithTimeoutAI = (url, options, timeout = 3e5) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error("请求超时"));
          }, timeout);
          common_vendor.index.request({
            url,
            method: (options.method || "GET").toUpperCase(),
            timeout,
            // ⚠️ 关键：uni.request自身timeout必须与外层setTimeout一致，否则默认60s先触发
            header: options.headers || {},
            data: typeof options.body === "string" ? JSON.parse(options.body) : options.body,
            success: (res) => {
              clearTimeout(timer);
              const mockResponse = {
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                statusCode: res.statusCode,
                headers: res.header,
                json: () => Promise.resolve(res.data),
                text: () => Promise.resolve(typeof res.data === "string" ? res.data : JSON.stringify(res.data))
              };
              resolve(mockResponse);
            },
            fail: (err) => {
              clearTimeout(timer);
              reject(new Error(err.errMsg || "网络请求失败"));
            }
          });
        });
      };
      try {
        const headers = { "Content-Type": "application/json" };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }
        const response = await requestWithTimeoutAI(apiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody)
        }, 3e5);
        if (!response.ok) {
          let errorMessage2 = `API请求失败: ${response.status}`;
          if (response.status === 404) {
            errorMessage2 = `API地址不存在(404)，请检查API地址配置是否正确`;
          } else if (response.status === 401 || response.status === 403) {
            errorMessage2 = "API密钥无效或已过期";
            showGuideToSettingsModal("API密钥无效，请检查设置中的配置");
          } else if (response.status === 429) {
            errorMessage2 = "API调用频率超限";
          } else if (response.status >= 500) {
            errorMessage2 = `服务器内部错误(${response.status})`;
          }
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
              errorMessage2 += `
详情: ${errorData.error.message}`;
            }
          } catch (e) {
          }
          throw new Error(errorMessage2);
        }
        const data = await response.json();
        console.log("[AIRecommend] AI原始响应:", JSON.stringify(data).substring(0, 200));
        const excludedKeys = buildExcludedSongKeys(userData);
        return parseAIResponse(data, excludedKeys, requestCount, 50);
      } catch (error) {
        throw error;
      }
    };
    const getUserHistoryLevel = (userData) => {
      const historyCount = (userData.playHistory || []).length + (userData.favoriteSongs || []).length;
      if (historyCount < 20)
        return "new";
      if (historyCount > 100)
        return "veteran";
      return "medium";
    };
    const buildLayeredExcludedData = (userData) => {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1e3;
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1e3;
      const strictSet = /* @__PURE__ */ new Set();
      const moderateSet = /* @__PURE__ */ new Set();
      const looseSet = /* @__PURE__ */ new Set();
      const allSet = /* @__PURE__ */ new Set();
      const addKey = (set, song) => {
        if (song && song.name && song.singer) {
          const key = `${String(song.name).trim()} - ${String(song.singer).trim()}`;
          set.add(key);
          allSet.add(key);
        }
      };
      (userData.favoriteSongs || []).forEach((s) => addKey(strictSet, s));
      (userData.playlists || []).forEach((list) => {
        (list.songs || []).forEach((s) => addKey(strictSet, s));
      });
      (userData.playHistory || []).forEach((s) => addKey(strictSet, s));
      (userData.historyRecommendedSongs || []).forEach((s) => {
        const ts = s.timestamp || s.addedAt || s.recommendTime || s.createTime || 0;
        if (ts >= sevenDaysAgo || ts === 0) {
          addKey(strictSet, s);
        } else if (ts >= thirtyDaysAgo) {
          addKey(moderateSet, s);
        } else {
          addKey(looseSet, s);
        }
      });
      return { strictSet, moderateSet, looseSet, allSet };
    };
    const analyzeRepeatRate = (songs, excludedData) => {
      if (!songs || songs.length === 0) {
        return { repeatRate: 1, duplicatedSongs: [], violationSongs: [], validSongs: [] };
      }
      const duplicatedSongs = [];
      const violationSongs = [];
      const validSongs = [];
      songs.forEach((song) => {
        const key = song.name && song.singer ? `${String(song.name).trim()} - ${String(song.singer).trim()}` : "";
        if (key && excludedData.strictSet.has(key)) {
          duplicatedSongs.push(song);
          violationSongs.push(song);
        } else {
          validSongs.push(song);
        }
      });
      const repeatRate = duplicatedSongs.length / songs.length;
      return { repeatRate, duplicatedSongs, violationSongs, validSongs };
    };
    const buildAIPromptForAI = (userData, options = {}) => {
      const {
        retryRound = 0,
        previousDuplicatedSongs = [],
        previousViolationSongs = [],
        requestCount = 60
      } = options;
      const A_COUNT = 35;
      const B_COUNT = requestCount - A_COUNT;
      const historyLevel = getUserHistoryLevel(userData);
      const layered = buildLayeredExcludedData(userData);
      let chineseSongRatio = 0;
      let totalSongs = 0;
      if (userData.playHistory) {
        userData.playHistory.forEach((song) => {
          totalSongs++;
          if (/[\u4e00-\u9fa5]/.test(song.name))
            chineseSongRatio++;
        });
      }
      if (userData.favoriteSongs) {
        userData.favoriteSongs.forEach((song) => {
          totalSongs++;
          if (/[\u4e00-\u9fa5]/.test(song.name))
            chineseSongRatio++;
        });
      }
      const isChineseUser = totalSongs > 0 && chineseSongRatio / totalSongs >= 0.7;
      const primaryLanguage = isChineseUser ? "中文" : chineseSongRatio / totalSongs >= 0.5 ? "中英混合" : "英文/外文";
      const primaryLanguageRatio = totalSongs > 0 ? Math.round(chineseSongRatio / totalSongs * 100) : 50;
      const artistSongCount = /* @__PURE__ */ new Map();
      const collectArtist = (songs) => {
        if (!songs)
          return;
        songs.forEach((song) => {
          if (song && song.singer) {
            const artist = song.singer.trim();
            artistSongCount.set(artist, (artistSongCount.get(artist) || 0) + 1);
          }
        });
      };
      collectArtist(userData.playHistory);
      collectArtist(userData.favoriteSongs);
      if (userData.playlists) {
        userData.playlists.forEach((list) => collectArtist(list.songs));
      }
      const sortedArtists = [...artistSongCount.entries()].sort((a, b) => b[1] - a[1]);
      const frequentArtists = sortedArtists.filter(([_, count]) => count >= 1).map(([artist]) => artist).slice(0, 10);
      const defaultArtists = [
        "林俊杰",
        "陈奕迅",
        "王力宏",
        "陶喆",
        "方大同",
        "薛之谦",
        "李荣浩",
        "毛不易",
        "华晨宇",
        "邓紫棋",
        "五月天",
        "田馥甄",
        "萧敬腾",
        "林宥嘉",
        "蔡依林",
        "孙燕姿",
        "潘玮柏",
        "周汤豪",
        "杨宗纬",
        "戴佩妮",
        "Adele",
        "Ed Sheeran",
        "Taylor Swift",
        "Bruno Mars",
        "Coldplay",
        "Maroon 5",
        "OneRepublic",
        "Imagine Dragons",
        "The Weeknd",
        "Billie Eilish",
        "Dua Lipa",
        "Harry Styles",
        "Sam Smith",
        "Lady Gaga",
        "Rihanna",
        "Jay-Z",
        "Katy Perry",
        "Ariana Grande",
        "Justin Bieber",
        "Shawn Mendes"
      ];
      const candidateArtists = [.../* @__PURE__ */ new Set([...frequentArtists, ...defaultArtists])].slice(0, 35);
      const strictList = Array.from(layered.strictSet).slice(0, 80);
      const moderateList = Array.from(layered.moderateSet).slice(0, 40);
      const looseList = Array.from(layered.looseSet).slice(0, 20);
      let prompt = `你是音乐推荐助手。请严格按以下要求为用户推荐${requestCount}首歌曲。

【核心要求 - 违反则任务失败】
1. 必须返回恰好${requestCount}首歌曲，一首不多一首不少。
2. 列表内不允许有任何重复歌曲（以"歌名-歌手"组合为唯一标识）。
3. 歌曲必须分为 A、B 两类：A类${A_COUNT}首，B类${B_COUNT}首；每首歌必须带 category 字段，值为 "A" 或 "B"。
4. A类要求：严格匹配用户画像，必须避开[严格排除]和[中度排除]中的所有歌曲。
5. B类要求：同风格探索，必须避开[严格排除]，尽量选择用户没听过的新歌/专辑，可少量参考[中度排除]中的风格但不得直接推荐其中歌曲。
6. 下列排除列表中的歌曲绝对不允许出现在输出中。
7. 推荐理由15-30字，说明为什么符合用户偏好。
8. 如果你不确定某首歌是否在排除列表中，请选择另一首你确定不在列表中的歌曲。
9. 每首歌必须包含 duration 字段，格式为 "mm:ss"（如 "3:45"），表示歌曲时长，请尽量给出准确时长。

【用户历史数据等级】
${historyLevel === "new" ? "新用户：可适度推荐热门经典和代表作，优先保证歌曲质量。" : historyLevel === "veteran" ? "老用户：用户已听过大量歌曲，请重点探索同风格但用户未接触过的作品，避免推荐近期热门单曲，优先推荐该歌手的中期专辑曲目或同风格冷门佳作。" : "中度用户：以用户画像匹配为主，允许约30%的歌曲进行同风格探索。"}

【语言偏好】
用户主要听${primaryLanguage}歌曲（${primaryLanguageRatio}%），请保持类似语言比例。
`;
      if (retryRound > 0 && previousDuplicatedSongs.length > 0) {
        prompt += `
【上轮问题反馈 - 本次绝对避免】
这是第${retryRound + 1}次推荐。上轮推荐的歌曲中，以下 ${previousDuplicatedSongs.length} 首与用户历史重复或在排除列表中，本次绝对不能再推荐，并避免推荐这些歌手的近期热门歌曲：
`;
        previousDuplicatedSongs.slice(0, 20).forEach((s, i) => {
          prompt += `${i + 1}. ${s.name} - ${s.singer}
`;
        });
        if (previousDuplicatedSongs.length >= 10) {
          prompt += `以上问题说明热门歌/近期单曲重复率过高，本次请优先选择冷门专辑曲目、B-sides、同风格非热门歌手。
`;
        }
      }
      prompt += `
【严格排除 - 绝对禁止】（已收藏/已听过/最近7天AI推荐/历史喜欢的歌）
${strictList.length > 0 ? strictList.map((s, i) => `${i + 1}. ${s}`).join("\n") : "（暂无）"}

【中度排除 - A类禁止，B类建议避免】（7-30天AI推荐）
${moderateList.length > 0 ? moderateList.map((s, i) => `${i + 1}. ${s}`).join("\n") : "（暂无）"}

【宽松排除 - 仅作参考】（30天前AI推荐，尽量不要直接重复）
${looseList.length > 0 ? looseList.map((s, i) => `${i + 1}. ${s}`).join("\n") : "（暂无）"}

【推荐歌手配额】
从以下歌手中选择推荐，每位歌手推荐1-3首（不要推荐该歌手已听过的歌曲）：
${candidateArtists.map((a, i) => `${i + 1}. ${a}`).join("\n")}

【用户偏好】
`;
      if (hasActivePreferences.value) {
        if (prefMode.value === "custom" && customPromptText.value.trim().length > 0) {
          const userInput = customPromptText.value.trim();
          prompt += `[自定义推荐需求]
用户具体需求：${userInput}

`;
          prompt += `[AI约束]
1. 以上是用户本次的个性化需求，请**优先满足此需求**
2. 推荐理由必须明确说明为什么这首歌符合用户的需求"${userInput}"
3. 排除列表规则仍然有效：已听过的歌绝对不能推荐
`;
        } else {
          if (selectedScene.value >= 0) {
            const scene = sceneOptions[selectedScene.value];
            const sceneHints = {
              "开车提神": "节奏明快(BPM 120+)、有律动感、避免过于舒缓的慢歌、可包含摇滚/电子/流行",
              "深夜助眠": "极缓节奏(BPM<70)、纯音乐或轻音乐为主、无歌词或极简人声、安静氛围感",
              "运动健身": "高能量(BPM>130)、律动强、燃向、可包含电子/DJ/摇滚/嘻哈",
              "工作学习": "不抢注意力、中速或轻柔、无歌词或极简人声、背景音乐风格、Lo-fi/古典/轻爵士",
              "聚会派对": "DJ舞曲/电子/House、高BPM(120-140)、气氛热烈",
              "独处放空": "氛围感强、民谣/爵士/独立音乐、中等节奏、情感细腻",
              "情绪低落": "治愈系、温暖歌词、共情感强、舒缓但不压抑",
              "兴奋High": "电子/DJ/摇滚/金属、爆发力强、高能量快节奏"
            };
            prompt += `[使用场景] ${scene.label}
[AI约束] ${sceneHints[scene.label] || scene.hint}

`;
          }
          if (selectedExplore.value >= 0) {
            const explore = exploreOptions[selectedExplore.value];
            const exploreHints = {
              "strict": "严格匹配用户画像，每首歌必须与画像高度吻合",
              "moderate": "以画像为基础，允许约20%的歌曲跨出画像边界进行适度探索",
              "surprise": "画像仅作参考，AI自由发挥，大胆推荐用户可能未接触过的风格"
            };
            prompt += `[探索程度] ${explore.label}
[AI约束] ${exploreHints[explore.value]}

`;
          }
          if (selectedEra.value >= 0) {
            const era = eraOptions[selectedEra.value];
            const eraHints = {
              "any": "年代不限",
              "classic": "优先推荐1990年及以前的经典歌曲",
              "millennium": "优先推荐2000-2010年间的千禧金曲",
              "2010s": "优先推荐2010-2020年间的流行热单",
              "latest": "优先推荐近3年内发布的最新潮流歌曲"
            };
            prompt += `[年代侧重] ${era.label}
[AI约束] ${eraHints[era.value]}

`;
          }
          if (selectedLang.value >= 0) {
            const lang = langOptions[selectedLang.value];
            const langHints = {
              "any": "语言不限",
              "chinese": "华语歌曲占比≥60%",
              "western": "欧美歌曲占比≥60%",
              "japanese_korean": "日韩歌曲占比≥40%",
              "mixed": "多语混合，大致均衡分配"
            };
            prompt += `[语言侧重] ${lang.label}
[AI约束] ${langHints[lang.value]}

`;
          }
        }
      }
      const tasteParts = [];
      if (userData.playHistory && userData.playHistory.length > 0) {
        const highCompletionSongs = userData.playHistory.filter((song) => {
          const rate = song.playRecord ? Number(song.playRecord.avgCompletionRate) || 0 : 0;
          return rate >= 70;
        }).sort((a, b) => {
          const rateA = a.playRecord ? Number(a.playRecord.avgCompletionRate) || 0 : 0;
          const rateB = b.playRecord ? Number(b.playRecord.avgCompletionRate) || 0 : 0;
          return rateB - rateA;
        }).slice(0, 5).map((song) => `${song.name}-${song.singer}`);
        if (highCompletionSongs.length > 0) {
          tasteParts.push(`[高完播率(>=70%)歌曲] ${highCompletionSongs.join(", ")}`);
        }
        const recentSongs = userData.playHistory.slice(0, 8).map((song) => `${song.name}-${song.singer}`);
        if (recentSongs.length > 0) {
          tasteParts.push(`[最近播放] ${recentSongs.join(", ")}`);
        }
        const artistPlayCount = /* @__PURE__ */ new Map();
        userData.playHistory.forEach((song) => {
          if (song.singer) {
            const artist = song.singer.trim();
            const playCount = song.playRecord ? song.playRecord.playCount : 1;
            artistPlayCount.set(artist, (artistPlayCount.get(artist) || 0) + playCount);
          }
        });
        const topArtists = [...artistPlayCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([artist]) => artist);
        if (topArtists.length > 0) {
          tasteParts.push(`[常听歌手] ${topArtists.join(", ")}`);
        }
      }
      if (userData.favoriteSongs && userData.favoriteSongs.length > 0) {
        const favoriteArtists = {};
        userData.favoriteSongs.forEach((song) => {
          if (song.singer) {
            favoriteArtists[song.singer] = (favoriteArtists[song.singer] || 0) + 1;
          }
        });
        const topFavoriteArtists = Object.entries(favoriteArtists).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([artist]) => artist);
        if (topFavoriteArtists.length > 0) {
          tasteParts.push(`[收藏歌手] ${topFavoriteArtists.join(", ")}`);
        }
      }
      if (userData.dislikeList && userData.dislikeList.length > 0) {
        tasteParts.push(`[不喜欢歌手] ${userData.dislikeList.join(", ")}`);
      }
      if (tasteParts.length > 0) {
        prompt += `
【用户品味参考 - 用于推断偏好，不要推荐这里的具体歌曲】
${tasteParts.join("\n")}
`;
      }
      prompt += `
【输出前必须自查】
生成${requestCount}首歌曲后，请按顺序逐首检查：
1. 是否有"歌名-歌手"完全相同的重复项？如果有，移除重复并补充新歌曲。
2. 是否有任何一首在[严格排除]或[中度排除]列表中？如果有，移除并补充新歌曲。
3. 是否有任何一首是你曾经向该用户推荐过的歌曲？如果有，移除并补充新歌曲。
4. A类是否恰好${A_COUNT}首、B类是否恰好${B_COUNT}首？数量不对则调整。
5. 总数量是否恰好为${requestCount}首？如果不足，继续补充直到${requestCount}首；如果超过，删除多余项。
6. 每首歌曲是否都包含 name、singer、album、duration、reason、category 六个字段？
7. duration 字段必须是歌曲时长，格式为 "mm:ss"（如 "3:45"、"4:20"），请尽量给出准确时长。
8. 你只能输出 JSON 数组，不要有任何解释、说明或 markdown 代码块。

【输出格式】
直接输出 JSON 数组（恰好${requestCount}首，无重复，不含排除歌曲）：
[
  {"name":"歌名","singer":"歌手","album":"专辑","duration":"3:45","reason":"推荐理由","category":"A"},
  ...
]`;
      return prompt;
    };
    const buildExcludedSongKeys = (userData) => {
      const { allSet } = buildLayeredExcludedData(userData);
      const excludedKeys = /* @__PURE__ */ new Set();
      allSet.forEach((key) => {
        const parts = key.split(" - ");
        if (parts.length >= 2) {
          const name = parts.slice(0, -1).join(" - ").toLowerCase().trim();
          const singer = parts[parts.length - 1].toLowerCase().trim();
          excludedKeys.add(`${name}-${singer}`);
        }
      });
      console.log(`[AIRecommend] 🚫 构建排除列表完成，共 ${excludedKeys.size} 首歌曲`);
      return excludedKeys;
    };
    const parseAIResponse = (data, excludedSongKeys = /* @__PURE__ */ new Set(), requestCount = 60, finalCount = 50) => {
      try {
        console.log("[AIRecommend] 📦 开始解析AI响应...");
        console.log("[AIRecommend] 📦 原始响应数据类型:", typeof data);
        console.log("[AIRecommend] 📦 排除列表大小:", excludedSongKeys.size);
        console.log("[AIRecommend] 📦 响应数据keys:", data ? Object.keys(data).join(",") : "null/undefined");
        let content = null;
        if (data.choices && data.choices[0] && data.choices[0].message) {
          if (data.choices[0].message.content) {
            content = data.choices[0].message.content;
            console.log("[AIRecommend] ✅ 检测到OpenAI标准格式 (content)");
          } else if (data.choices[0].message.reasoning_content) {
            content = data.choices[0].message.reasoning_content;
            console.log("[AIRecommend] ⚠️ 使用reasoning_content作为备选");
          }
        }
        if (!content && data.data && data.data.response) {
          content = data.data.response;
          console.log("[AIRecommend] ✅ 检测到后端包装格式 (data.response)");
        }
        if (!content && data.response) {
          content = data.response;
          console.log("[AIRecommend] ✅ 检测到简单包装格式 (response)");
        }
        if (!content && typeof data === "string") {
          content = data;
          console.log("[AIRecommend] ✅ 检测到字符串格式");
        }
        if (!content && Array.isArray(data)) {
          content = JSON.stringify(data);
          console.log("[AIRecommend] ✅ 检测到数组格式");
        }
        console.log("[AIRecommend] 📦 提取到的content类型:", typeof content);
        console.log("[AIRecommend] 📦 提取到的content长度:", content ? content.length : "null");
        if (typeof content !== "string") {
          console.log("[AIRecommend] 📦 content为非字符串类型，尝试直接使用或序列化");
          if (Array.isArray(content) && content.length > 0 && content[0].name) {
            console.log("[AIRecommend] ✅ content已是歌曲数组，直接使用");
            return parseAndValidateSongs(JSON.stringify(content), excludedSongKeys, requestCount, finalCount);
          }
          content = typeof content === "object" ? JSON.stringify(content) : String(content);
          console.log("[AIRecommend] 📦 序列化后content类型:", typeof content);
        }
        if (!content || typeof content === "string" && content.trim().length === 0) {
          throw new Error("AI返回内容为空");
        }
        console.log("[AIRecommend] AI返回的原始内容:", content.substring(0, 200));
        console.log("[AIRecommend] AI响应总长度:", content.length);
        let jsonStr = content.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
        }
        try {
          const result = parseAndValidateSongs(jsonStr, excludedSongKeys, requestCount, finalCount);
          if (result && result.length > 0) {
            return result;
          }
        } catch (parseError) {
          console.warn("[AIRecommend] ⚠️ 直接解析失败，尝试修复截断的JSON...");
        }
        console.log("[AIRecommend] 🔧 尝试修复截断的JSON...");
        const fixedJson = fixTruncatedJson(jsonStr);
        if (fixedJson !== jsonStr) {
          console.log("[AIRecommend] ✅ JSON已修复");
          try {
            const result = parseAndValidateSongs(fixedJson, excludedSongKeys, requestCount, finalCount);
            if (result && result.length > 0) {
              console.log(`[AIRecommend] ✅ 修复后成功解析 ${result.length} 首歌曲`);
              return result;
            }
          } catch (fixError) {
            console.warn("[AIRecommend] ⚠️ 修复后仍无法解析，尝试逐条提取...");
          }
        }
        console.log("[AIRecommend] 🔍 逐个提取完整的歌曲对象...");
        const extractedSongs = extractValidSongObjects(jsonStr);
        if (extractedSongs.length > 0) {
          console.log(`[AIRecommend] ✅ 成功提取 ${extractedSongs.length} 首完整歌曲`);
          return extractedSongs;
        }
        throw new Error("无法从AI响应中提取有效的歌曲数据");
      } catch (error) {
        console.error("[AIRecommend] ❌ 解析AI响应失败:", error);
        throw new Error(`解析推荐结果失败: ${error.message}`);
      }
    };
    const parseAndValidateSongs = (input, excludedSongKeys = /* @__PURE__ */ new Set(), requestCount = 60, finalCount = 50) => {
      const songs = typeof input === "string" ? JSON.parse(input) : input;
      if (!Array.isArray(songs) || songs.length === 0) {
        return null;
      }
      let validSongs = songs.filter(
        (song) => song && song.name && typeof song.name === "string" && song.name.trim() && song.singer && typeof song.singer === "string" && song.singer.trim()
      );
      console.log(`[AIRecommend] 📊 解析到 ${validSongs.length} 首有效歌曲`);
      if (validSongs.length !== requestCount) {
        console.warn(`[AIRecommend] ⚠️ AI返回数量不是${requestCount}首: ${validSongs.length}首，提示词约束可能未完全遵守`);
      }
      if (excludedSongKeys.size > 0) {
        const beforeFilter = validSongs.length;
        const violationDetails = [];
        validSongs = validSongs.filter((song) => {
          const songKey = `${song.name.toLowerCase().trim()}-${song.singer.toLowerCase().trim()}`;
          const isExcluded = excludedSongKeys.has(songKey);
          if (isExcluded && violationDetails.length < 5) {
            violationDetails.push(`${song.name} - ${song.singer}`);
          }
          return !isExcluded;
        });
        if (validSongs.length < beforeFilter) {
          console.warn(`[AIRecommend] 🛡️ 安全网过滤掉 ${beforeFilter - validSongs.length} 首违规歌曲，剩余 ${validSongs.length} 首。建议继续优化提示词`);
          if (violationDetails.length > 0) {
            console.warn(`[AIRecommend] 🛡️ 违规示例: ${violationDetails.join(" | ")}`);
          }
        }
      }
      const beforeDedup = validSongs.length;
      const seen = /* @__PURE__ */ new Set();
      const duplicates = [];
      validSongs = validSongs.filter((song) => {
        const key = `${song.name}-${song.singer}`.toLowerCase();
        if (seen.has(key)) {
          duplicates.push(`${song.name} - ${song.singer}`);
          return false;
        }
        seen.add(key);
        return true;
      });
      if (duplicates.length > 0) {
        console.warn(`[AIRecommend] 🛡️ 安全网去重: ${beforeDedup} → ${validSongs.length} 首，移除 ${duplicates.length} 首。建议继续优化提示词`);
      }
      const aSongs = validSongs.filter((song) => String(song.category || "").toUpperCase() === "A");
      const bSongs = validSongs.filter((song) => String(song.category || "").toUpperCase() !== "A");
      validSongs = [...aSongs, ...bSongs].slice(0, finalCount);
      if (validSongs.length < finalCount) {
        console.warn(`[AIRecommend] ⚠️ 有效歌曲不足${finalCount}首，实际返回 ${validSongs.length} 首`);
      }
      if (validSongs.length === 0) {
        return null;
      }
      console.log(`[AIRecommend] ✅ 最终返回 ${validSongs.length} 首合格歌曲（A类${aSongs.slice(0, finalCount).filter((s) => String(s.category || "").toUpperCase() === "A").length}首）`);
      return validSongs.map((song) => ({
        name: String(song.name).trim(),
        singer: String(song.singer).trim(),
        album: song.album ? String(song.album).trim() : "",
        duration: song.duration || "",
        reason: song.reason ? String(song.reason).trim() : "",
        category: String(song.category || "").toUpperCase()
      }));
    };
    const fixTruncatedJson = (jsonStr) => {
      let fixed = jsonStr.trim();
      fixed = fixed.replace(/[^}\]\w\s,"'\-:]$/, "");
      let openBrackets = { "{": 0, "[": 0 };
      let inString = false;
      let stringChar = "";
      let i = 0;
      while (i < fixed.length) {
        const char = fixed[i];
        if (inString) {
          if (char === "\\") {
            i += 2;
            continue;
          } else if (char === stringChar) {
            inString = false;
          }
        } else {
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
          } else if (char === "{") {
            openBrackets["{"]++;
          } else if (char === "}") {
            openBrackets["{"]--;
          } else if (char === "[") {
            openBrackets["["]++;
          } else if (char === "]") {
            openBrackets["["]--;
          }
        }
        i++;
      }
      if (inString) {
        fixed += stringChar;
      }
      while (openBrackets["{"] > openBrackets["["]) {
        fixed = fixed.replace(/,\s*"[^"]*"\s*:\s*[^}]*$/, "");
        fixed += "}";
        openBrackets["{"]--;
      }
      while (openBrackets["["] > 0) {
        fixed = fixed.replace(/,\s*\{[^}]*$/s, "");
        fixed = fixed.replace(/,\s*[^,\]]*$/s, "");
        fixed += "]";
        openBrackets["["]--;
      }
      return fixed;
    };
    const extractValidSongObjects = (text) => {
      const songs = [];
      const standardRegex = /\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"singer"\s*:\s*"[^"]+"(?:\s*,\s*"[^"]+"\s*:\s*"[^"]*")*\s*\}/g;
      let match;
      while ((match = standardRegex.exec(text)) !== null) {
        try {
          const songObj = JSON.parse(match[0]);
          if (songObj.name && songObj.singer) {
            songs.push({
              name: String(songObj.name).trim(),
              singer: String(songObj.singer).trim(),
              album: songObj.album ? String(songObj.album).trim() : "",
              duration: songObj.duration || "",
              reason: songObj.reason ? String(songObj.reason).trim() : "",
              category: songObj.category ? String(songObj.category).toUpperCase() : ""
            });
            console.log(`[AIRecommend] 🎵 提取歌曲: ${songObj.name} - ${songObj.singer}`);
          }
        } catch (e) {
          console.warn("[AIRecommend] ⚠️ 提取单首歌曲时解析失败:", match[0].substring(0, 50));
        }
      }
      if (songs.length === 0) {
        const looseRegex = /\{[^}]*"name"\s*:\s*"([^"]+)"[^}]*"singer"\s*:\s*"([^"]+)"[^}]*\}/g;
        while ((match = looseRegex.exec(text)) !== null) {
          try {
            const startIdx = match.index;
            let braceCount = 0;
            let endIdx = startIdx;
            let inStr = false;
            for (let i = startIdx; i < text.length; i++) {
              const char = text[i];
              if (inStr) {
                if (char === "\\") {
                  i++;
                  continue;
                }
                if (char === '"') {
                  inStr = false;
                }
              } else {
                if (char === '"') {
                  inStr = true;
                } else if (char === "{") {
                  braceCount++;
                } else if (char === "}") {
                  braceCount--;
                  if (braceCount === 0) {
                    endIdx = i + 1;
                    break;
                  }
                }
              }
            }
            if (endIdx > startIdx) {
              const jsonStr = text.substring(startIdx, endIdx);
              const songObj = JSON.parse(jsonStr);
              if (songObj.name && songObj.singer) {
                songs.push({
                  name: String(songObj.name).trim(),
                  singer: String(songObj.singer).trim(),
                  album: songObj.album ? String(songObj.album).trim() : "",
                  duration: songObj.duration || "",
                  reason: songObj.reason ? String(songObj.reason).trim() : "",
                  category: songObj.category ? String(songObj.category).toUpperCase() : ""
                });
                console.log(`[AIRecommend] 🎵 提取歌曲(宽松): ${songObj.name} - ${songObj.singer}`);
              }
            }
          } catch (e) {
          }
        }
      }
      return songs;
    };
    const currentSlide = common_vendor.ref(0);
    const tabletRightView = common_vendor.ref(0);
    const noop = () => {
    };
    const onSwiperChange = (e) => {
      if (isRefreshing.value) {
        if (e.detail.current !== 0) {
          currentSlide.value = 0;
          common_vendor.nextTick$1(() => {
            currentSlide.value = 0;
          });
        }
        return;
      }
      currentSlide.value = e.detail.current;
      console.log("[AIRecommend] Swiper切换到视图:", currentSlide.value);
    };
    const switchToAlbum = () => {
      currentSlide.value = 0;
      console.log("[AIRecommend] 切换到专辑视图");
    };
    const switchToLyrics = () => {
      currentSlide.value = 1;
      console.log("[AIRecommend] 切换到歌词视图");
    };
    const switchToPlaylist = () => {
      currentSlide.value = 2;
      console.log("[AIRecommend] 切换到歌单视图");
    };
    const switchTabletRight = (view) => {
      tabletRightView.value = view;
      console.log("[AIRecommend] 平板右侧切换到:", view === 0 ? "歌单" : "歌词");
    };
    const currentSongForLab = common_vendor.computed(() => store_modules_player.playerStore.getState().currentSong);
    const currentSongCover = common_vendor.computed(() => {
      var _a;
      const song = currentSongForLab.value;
      if (!song)
        return "";
      return song.picUrl || song.img || ((_a = song.al) == null ? void 0 : _a.picUrl) || "";
    });
    const statusText = common_vendor.computed(() => {
      var _a;
      if (isRefreshing.value)
        return "AI引擎启动中...";
      if (recommendations.value.length > 0 && !currentSongForLab.value)
        return "准备就绪 - 点击播放";
      if (recommendations.value.length > 0 && currentSongForLab.value) {
        const reason = (_a = recommendations.value.find((s) => s.name === currentSongForLab.value.name)) == null ? void 0 : _a.reason;
        return reason || `AI推荐 · ${playlistInfo.value.title || "音乐探索"}`;
      }
      return "点击下方按钮开始探索";
    });
    common_vendor.computed(() => {
      const text = statusText.value;
      return text && text.length > 20;
    });
    const handleFavorite = () => {
      if (!currentSongForLab.value) {
        common_vendor.index.showToast({ title: "没有正在播放的歌曲", icon: "none" });
        return;
      }
      const song = currentSongForLab.value;
      const loveList = store_modules_list.listStore.getList(store_modules_list.LIST_IDS.LOVE) || [];
      const lovedSong = loveList.find((m) => m.name === song.name && m.singer === song.singer);
      if (lovedSong) {
        store_modules_list.listStore.removeFromLoveList(lovedSong.id);
        common_vendor.index.showToast({ title: "已取消喜欢", icon: "none" });
      } else {
        store_modules_list.listStore.addListMusics(store_modules_list.LIST_IDS.LOVE, song, "top");
        common_vendor.index.showToast({ title: "已添加到我喜欢的音乐", icon: "success" });
      }
    };
    const isCurrentSongFavorite = common_vendor.computed(() => {
      if (!currentSongForLab.value)
        return false;
      const song = currentSongForLab.value;
      const loveList = store_modules_list.listStore.getList(store_modules_list.LIST_IDS.LOVE) || [];
      return loveList.some((m) => m.name === song.name && m.singer === song.singer);
    });
    const isCurrentSongDisliked = common_vendor.computed(() => {
      if (!currentSongForLab.value)
        return false;
      return store_modules_player.playerStore.isDisliked(currentSongForLab.value.id);
    });
    const handleDislike = () => {
      if (!currentSongForLab.value) {
        common_vendor.index.showToast({ title: "没有正在播放的歌曲", icon: "none" });
        return;
      }
      const song = currentSongForLab.value;
      if (store_modules_player.playerStore.isDisliked(song.id)) {
        common_vendor.index.showModal({
          title: "提示",
          content: `「${song.name}」已在不喜欢列表中，是否移除？`,
          confirmText: "移除",
          success: (res) => {
            if (res.confirm) {
              store_modules_player.playerStore.removeFromDislikeList(song.id);
              common_vendor.index.showToast({ title: "已移除", icon: "success" });
            }
          }
        });
        return;
      }
      const success = store_modules_player.playerStore.addToDislikeList(song);
      if (success) {
        common_vendor.index.showToast({
          title: "已加入不喜欢列表",
          icon: "none",
          duration: 1500
        });
        setTimeout(() => {
          playNext();
        }, 500);
      } else {
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      }
    };
    const handlePlaylistFavorite = (song) => {
      if (!song || !song.name && !song.singer) {
        common_vendor.index.showToast({ title: "歌曲信息不完整", icon: "none" });
        return;
      }
      const loveList = store_modules_list.listStore.getList(store_modules_list.LIST_IDS.LOVE) || [];
      const lovedSong = loveList.find((m) => m.name === song.name && m.singer === song.singer);
      if (lovedSong) {
        store_modules_list.listStore.removeFromLoveList(lovedSong.id);
        common_vendor.index.showToast({ title: "已取消喜欢", icon: "none" });
      } else {
        store_modules_list.listStore.addListMusics(store_modules_list.LIST_IDS.LOVE, song, "top");
        common_vendor.index.showToast({ title: "已添加到我喜欢的音乐", icon: "success" });
      }
    };
    const togglePlay = () => {
      if (playing.value) {
        store_modules_player.playerStore.pause();
      } else {
        store_modules_player.playerStore.resume();
      }
    };
    const playNext = () => {
      const currentIndex = store_modules_list.listStore.state.playInfo.playIndex;
      const nextIndex = (currentIndex + 1) % recommendations.value.length;
      playSongAtIndex(nextIndex);
    };
    const playPrev = () => {
      const currentIndex = store_modules_list.listStore.state.playInfo.playIndex;
      const prevIndex = currentIndex <= 0 ? recommendations.value.length - 1 : currentIndex - 1;
      playSongAtIndex(prevIndex);
    };
    const currentTime = common_vendor.computed(() => store_modules_player.playerStore.state.currentTime || 0);
    const duration = common_vendor.computed(() => store_modules_player.playerStore.state.duration || 0);
    const playing = common_vendor.computed(() => store_modules_player.playerStore.state.playing || false);
    const playMode = common_vendor.computed(() => store_modules_player.playerStore.state.playMode || "listLoop");
    common_vendor.computed(() => {
      const modeIcons = {
        "listLoop": "repeat",
        "random": "shuffle",
        "list": "arrow-right-arrow-left",
        "singleLoop": "rotate-right",
        "none": "ban"
      };
      return modeIcons[playMode.value] || "repeat";
    });
    const progressPercent = common_vendor.computed(() => {
      if (!duration.value || duration.value === 0)
        return 0;
      return Math.min(currentTime.value / duration.value * 100, 100);
    });
    const isDragging = common_vendor.ref(false);
    const dragPercent = common_vendor.ref(0);
    const formatTime = (time) => {
      if (!time || time <= 0)
        return "00:00";
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    const onProgressTouchStart = (e) => {
      isDragging.value = true;
      store_modules_player.playerStore.setUserSeeking(true);
      updateDragPercent(e);
    };
    const onProgressTouchMove = (e) => {
      if (!isDragging.value)
        return;
      updateDragPercent(e);
    };
    const onProgressTouchEnd = () => {
      if (!isDragging.value)
        return;
      isDragging.value = false;
      store_modules_player.playerStore.seek(dragPercent.value);
    };
    const updateDragPercent = (e) => {
      const touch = e.touches[0];
      const query = common_vendor.index.createSelectorQuery();
      query.select(".progress-bar-wrapper").boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          const rect = res[0];
          const offsetX = touch.clientX - rect.left;
          const percent = Math.min(Math.max(offsetX / rect.width * 100, 0), 100);
          dragPercent.value = percent;
        }
      });
    };
    const lyrics = common_vendor.ref([]);
    const currentLyricIndex = common_vendor.ref(0);
    const isLoadingLyrics = common_vendor.ref(false);
    const lyricScrollTop = common_vendor.ref(0);
    common_vendor.ref("");
    const playerStatusText = common_vendor.ref("");
    const playerStatusMarqueeScroll = common_vendor.ref(false);
    const isShowingStatusText = common_vendor.ref(false);
    const cachedParsedLyricsForStatus = common_vendor.ref([]);
    const wasPlayingForStatus = common_vendor.ref(false);
    const hasCheckedLyricsForStatus = common_vendor.ref(false);
    const updateCachedLyricsForStatus = () => {
      const store = store_modules_player.playerStore.state;
      const lyricInfo = {
        lyric: store.lyric || "",
        tlyric: store.tlyric || "",
        rlyric: store.rlyric || "",
        lxlyric: store.lxlyric || ""
      };
      const { lyric, tlyric, rlyric, lxlyric } = utils_lyric.extractLyricsFromMusicData(lyricInfo);
      let lyricText = lyric || "";
      let lxlyricText = lxlyric || "";
      if (utils_kgLyricDecoder.isKgCompressedLyric(lyricText)) {
        try {
          const decoded = utils_kgLyricDecoder.tryDecodeKgLyric(lyricText);
          lyricText = decoded.lyric || lyricText;
        } catch (e) {
        }
      }
      if (utils_kgLyricDecoder.isKgCompressedLyric(lxlyricText)) {
        try {
          const decoded = utils_kgLyricDecoder.tryDecodeKgLyric(lxlyricText);
          lxlyricText = decoded.lyric || lxlyricText;
        } catch (e) {
        }
      }
      const parsed = utils_lyric.parseLyric(lyricText);
      if (parsed && parsed.length > 0) {
        let merged = parsed;
        if (tlyric) {
          const translations = utils_lyric.parseTranslation(tlyric);
          merged = utils_lyric.mergeLyrics(parsed, translations);
        }
        cachedParsedLyricsForStatus.value = merged;
      } else {
        cachedParsedLyricsForStatus.value = [];
      }
    };
    const updateCurrentLyricTextForStatus = () => {
      const store = store_modules_player.playerStore.state;
      if (store.statusText) {
        playerStatusText.value = store.statusText;
        isShowingStatusText.value = true;
        hasCheckedLyricsForStatus.value = false;
        return;
      }
      isShowingStatusText.value = false;
      if (store.playing && !wasPlayingForStatus.value) {
        wasPlayingForStatus.value = true;
        hasCheckedLyricsForStatus.value = true;
      }
      if (store.playing && !hasCheckedLyricsForStatus.value) {
        hasCheckedLyricsForStatus.value = true;
      }
      if (hasCheckedLyricsForStatus.value) {
        const hasLyrics = cachedParsedLyricsForStatus.value.length > 0;
        if (!hasLyrics) {
          playerStatusText.value = "暂无歌词";
          return;
        }
      }
      const currentTime2 = store.currentTime;
      if (currentTime2 && cachedParsedLyricsForStatus.value.length > 0) {
        const index = utils_lyric.getCurrentLyricIndex(cachedParsedLyricsForStatus.value, currentTime2);
        if (index >= 0 && index < cachedParsedLyricsForStatus.value.length) {
          playerStatusText.value = cachedParsedLyricsForStatus.value[index].text || "";
          return;
        }
      }
      playerStatusText.value = "";
    };
    const checkPlayerStatusMarquee = () => {
      if (!playerStatusText.value)
        return;
      try {
        const query = common_vendor.index.createSelectorQuery().in(instance);
        query.select(".song-detail-status__marquee").boundingClientRect();
        query.select(".song-detail-status__content").boundingClientRect();
        query.exec((rects) => {
          if (!rects || !rects[0] || !rects[1])
            return;
          const marqueeRect = rects[0];
          const contentRect = rects[1];
          const singleContentWidth = playerStatusMarqueeScroll.value ? contentRect.width / 2 : contentRect.width;
          playerStatusMarqueeScroll.value = singleContentWidth > marqueeRect.width + 5;
        });
      } catch (e) {
      }
    };
    let lastScrollIndex = -1;
    let isScrollToActive = false;
    let isUserScrolling = false;
    let userScrollTimer = null;
    const loadLyrics = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
      const song = currentSongForLab.value;
      if (!song) {
        console.log("[AIRecommend] 当前无播放歌曲，跳过歌词加载");
        lyrics.value = [];
        return;
      }
      if (isLoadingLyrics.value) {
        console.log("[AIRecommend] 歌词正在加载中，跳过重复请求");
        return;
      }
      const currentSongId2 = song.id || song.songId || song.hash || song.name;
      if (lyrics.value.length > 0 && ((_a = lyrics.value[0]) == null ? void 0 : _a.songId) === currentSongId2) {
        console.log("[AIRecommend] 已有当前歌曲的歌词，跳过加载", {
          歌曲ID: currentSongId2,
          歌词行数: lyrics.value.length
        });
        return;
      }
      isLoadingLyrics.value = true;
      console.log("[AIRecommend] ========== 开始加载歌词 ==========");
      console.log("[AIRecommend] 📱 当前模式:", isTablet.value ? "平板" : "竖屏");
      console.log("[AIRecommend] 📝 当前歌曲完整信息:", {
        name: song == null ? void 0 : song.name,
        id: song == null ? void 0 : song.id,
        songId: song == null ? void 0 : song.songId,
        songmid: song == null ? void 0 : song.songmid,
        source: song == null ? void 0 : song.source,
        sourceId: song == null ? void 0 : song.sourceId,
        hasLyric: !!(song == null ? void 0 : song.lyric),
        lyricLength: (_b = song == null ? void 0 : song.lyric) == null ? void 0 : _b.length,
        hasTlyric: !!(song == null ? void 0 : song.tlyric),
        tlyricLength: (_c = song == null ? void 0 : song.tlyric) == null ? void 0 : _c.length,
        hasLxlyric: !!(song == null ? void 0 : song.lxlyric),
        lxlyricLength: (_d = song == null ? void 0 : song.lxlyric) == null ? void 0 : _d.length,
        keys: Object.keys(song || {})
      });
      try {
        let lyricInfo = {
          lyric: song.lyric || "",
          tlyric: song.tlyric || "",
          rlyric: song.rlyric || "",
          lxlyric: song.lxlyric || ""
        };
        console.log("[AIRecommend] 从歌曲对象获取歌词:", {
          lyricLength: (_e = lyricInfo.lyric) == null ? void 0 : _e.length,
          tlyricLength: (_f = lyricInfo.tlyric) == null ? void 0 : _f.length,
          rlyricLength: (_g = lyricInfo.rlyric) == null ? void 0 : _g.length,
          lxlyricLength: (_h = lyricInfo.lxlyric) == null ? void 0 : _h.length
        });
        if (!lyricInfo.lyric && !lyricInfo.tlyric && !lyricInfo.rlyric && !lyricInfo.lxlyric) {
          console.log("[AIRecommend] 歌曲对象无歌词，尝试从playerStore获取");
          const playerState = store_modules_player.playerStore.state;
          lyricInfo = {
            lyric: playerState.lyric || "",
            tlyric: playerState.tlyric || "",
            rlyric: playerState.rlyric || "",
            lxlyric: playerState.lxlyric || ""
          };
          console.log("[AIRecommend] 从playerStore.state获取歌词:", {
            lyricLength: (_i = lyricInfo.lyric) == null ? void 0 : _i.length,
            tlyricLength: (_j = lyricInfo.tlyric) == null ? void 0 : _j.length,
            rlyricLength: (_k = lyricInfo.rlyric) == null ? void 0 : _k.length,
            lxlyricLength: (_l = lyricInfo.lxlyric) == null ? void 0 : _l.length
          });
        }
        if (!lyricInfo.lyric && !lyricInfo.tlyric && !lyricInfo.rlyric && !lyricInfo.lxlyric) {
          console.log("[AIRecommend] playerStore中无歌词，尝试从缓存获取");
          const songId = song.id || song.songId || song.songmid || song.hash || song.media_id;
          const songSource = song.source || song.sourceId || "tx";
          console.log("[AIRecommend] 获取歌词缓存 - 歌曲ID:", songId, "音源:", songSource, "原始ID字段:", {
            id: song.id,
            songId: song.songId,
            songmid: song.songmid,
            hash: song.hash,
            media_id: song.media_id
          });
          if (!songId || songId === 0) {
            console.warn("[AIRecommend] ⚠️ 歌曲ID无效或为0，无法从缓存获取歌词");
          } else {
            const possibleSources = [];
            if (song._toggleMusicInfo && song._toggleMusicInfo.newSource) {
              possibleSources.push(song._toggleMusicInfo.newSource);
              console.log("[AIRecommend] 优先从换源后source查找:", song._toggleMusicInfo.newSource);
            }
            if (!possibleSources.includes(songSource)) {
              possibleSources.push(songSource);
            }
            if (song.source && song.sourceId && song.source !== song.sourceId) {
              if (!possibleSources.includes(song.sourceId)) {
                possibleSources.push(song.sourceId);
              }
            }
            if (songSource !== "tx" && !possibleSources.includes("tx")) {
              possibleSources.push("tx");
            }
            let cachedLyric = null;
            for (const source2 of possibleSources) {
              console.log("[AIRecommend] 尝试获取歌词缓存，source:", source2, "songId:", songId);
              cachedLyric = await utils_lyricCache.getCachedLyric(songId, source2);
              if (cachedLyric) {
                console.log("[AIRecommend] ✅ 从缓存获取到歌词，source:", source2);
                break;
              }
            }
            if (cachedLyric) {
              lyricInfo = {
                lyric: cachedLyric.lyric || "",
                tlyric: cachedLyric.tlyric || "",
                rlyric: cachedLyric.rlyric || "",
                lxlyric: cachedLyric.lxlyric || ""
              };
            } else {
              console.log("[AIRecommend] 缓存中也没有歌词，已尝试的source:", possibleSources);
            }
          }
        }
        const source = song.source || song.sourceId;
        if (source === "酷狗" || source === "kg") {
          console.log("[AIRecommend] 检测到酷狗音源，检查歌词格式");
          if (utils_kgLyricDecoder.isKgCompressedLyric(lyricInfo.lyric)) {
            console.log("[AIRecommend] 检测到酷狗压缩歌词，开始解码");
            const decodedLyrics = await utils_kgLyricDecoder.tryDecodeKgLyric(lyricInfo.lyric);
            console.log("[AIRecommend] 酷狗歌词解码结果:", {
              lyricLength: (_m = decodedLyrics.lyric) == null ? void 0 : _m.length,
              tlyricLength: (_n = decodedLyrics.tlyric) == null ? void 0 : _n.length,
              rlyricLength: (_o = decodedLyrics.rlyric) == null ? void 0 : _o.length,
              lxlyricLength: (_p = decodedLyrics.lxlyric) == null ? void 0 : _p.length
            });
            lyricInfo = {
              lyric: decodedLyrics.lyric || lyricInfo.lyric,
              tlyric: decodedLyrics.tlyric || lyricInfo.tlyric,
              rlyric: decodedLyrics.rlyric || lyricInfo.rlyric,
              lxlyric: decodedLyrics.lxlyric || lyricInfo.lxlyric
            };
          }
          if (utils_kgLyricDecoder.isKgCompressedLyric(lyricInfo.lxlyric)) {
            console.log("[AIRecommend] 检测到酷狗压缩lxlyric，开始解码");
            const decodedLxLyrics = await utils_kgLyricDecoder.tryDecodeKgLyric(lyricInfo.lxlyric);
            lyricInfo.lxlyric = decodedLxLyrics.lxlyric || lyricInfo.lxlyric;
            if (!lyricInfo.lyric && decodedLxLyrics.lyric) {
              lyricInfo.lyric = decodedLxLyrics.lyric;
            }
          }
        }
        const { lyric, tlyric, rlyric, lxlyric } = utils_lyric.extractLyricsFromMusicData(lyricInfo);
        console.log("[AIRecommend] extractLyricsFromMusicData 提取结果:", {
          lyricLength: lyric == null ? void 0 : lyric.length,
          tlyricLength: tlyric == null ? void 0 : tlyric.length
        });
        const parsedLyrics = utils_lyric.parseLyric(lyric);
        const parsedTranslations = utils_lyric.parseTranslation(tlyric);
        const mergedLyrics = utils_lyric.mergeLyrics(parsedLyrics, parsedTranslations);
        lyrics.value = mergedLyrics.map((line) => ({
          ...line,
          songId: currentSongId2
          // 添加歌曲ID用于后续判断
        }));
        currentLyricIndex.value = 0;
        tabletLyricScrollTop.value = 0;
        console.log(`[AIRecommend] ✅ 歌词加载完成，共${lyrics.value.length}行`);
        console.log("[AIRecommend] 📊 歌词数据详情:", {
          总行数: lyrics.value.length,
          第一行歌词: (_q = lyrics.value[0]) == null ? void 0 : _q.text,
          最后行歌词: (_r = lyrics.value[lyrics.value.length - 1]) == null ? void 0 : _r.text,
          关联歌曲ID: currentSongId2,
          当前模式: isTablet.value ? "平板" : "竖屏"
        });
        if (lyrics.value.length > 0) {
          console.log("[AIRecommend] 前3行歌词:", lyrics.value.slice(0, 3).map((l) => ({ text: l.text, time: l.time })));
          common_vendor.nextTick$1(() => {
            setTimeout(() => {
              updateCurrentLyricIndex();
            }, 50);
          });
          if (isTablet.value) {
            setTimeout(() => {
              console.log("[AIRecommend] 🔄 平板模式：强制刷新歌词DOM");
              lyrics.value = [...lyrics.value];
            }, 50);
          }
        } else {
          console.warn("[AIRecommend] ⚠️ 歌词解析结果为空！");
        }
      } catch (error) {
        console.error("[AIRecommend] ❌ 歌词加载失败:", error);
        lyrics.value = [];
      } finally {
        isLoadingLyrics.value = false;
      }
    };
    const updateCurrentLyricIndex = () => {
      if (lyrics.value.length === 0)
        return;
      const index = utils_lyric.getCurrentLyricIndex(lyrics.value, currentTime.value);
      if (index !== currentLyricIndex.value) {
        currentLyricIndex.value = index;
        scrollToCurrentLyric();
      }
    };
    const scrollToCurrentLyric = () => {
      if (currentLyricIndex.value < 0 || lyrics.value.length === 0)
        return;
      if (isUserScrolling)
        return;
      if (currentLyricIndex.value === lastScrollIndex && isScrollToActive) {
        return;
      }
      lastScrollIndex = currentLyricIndex.value;
      isScrollToActive = true;
      if (isTablet.value) {
        common_vendor.nextTick$1(() => {
          try {
            const query = common_vendor.index.createSelectorQuery().in(instance);
            query.select(".tablet-lyrics-container").boundingClientRect();
            query.select(`#tablet-lyric-line-${currentLyricIndex.value}`).boundingClientRect();
            query.select(".tablet-lyrics-list").boundingClientRect();
            query.exec((res) => {
              if (!res || res.length < 3) {
                isScrollToActive = false;
                return;
              }
              const containerRect = res[0];
              const lineRect = res[1];
              const listRect = res[2];
              if (!containerRect || !lineRect || !listRect) {
                isScrollToActive = false;
                return;
              }
              const containerCenter = containerRect.height / 2;
              const lineHeight = lineRect.height;
              const lineTopInList = lineRect.top - listRect.top;
              const scrollTop = lineTopInList - containerCenter + lineHeight / 2;
              tabletLyricScrollTop.value = Math.max(0, scrollTop);
              setTimeout(() => {
                isScrollToActive = false;
              }, 300);
            });
          } catch (e) {
            console.error("[AIRecommend] 平板模式歌词自动滚动失败:", e);
            isScrollToActive = false;
          }
        });
        return;
      } else {
        common_vendor.nextTick$1(() => {
          try {
            const query = common_vendor.index.createSelectorQuery().in(instance);
            query.select(".lyrics-scroll-wrapper").boundingClientRect();
            query.select("#lyric-line-" + currentLyricIndex.value).boundingClientRect();
            query.select(".lyrics-scroll-view").scrollOffset();
            query.exec((res) => {
              if (!res || res.length < 3) {
                isScrollToActive = false;
                return;
              }
              const containerRect = res[0];
              const lineRect = res[1];
              const scrollInfo = res[2];
              if (!containerRect || !lineRect) {
                isScrollToActive = false;
                return;
              }
              const containerCenter = containerRect.height / 2;
              const lineTop = lineRect.top - containerRect.top;
              const scrollTop = scrollInfo.scrollTop + lineTop - containerCenter + lineRect.height / 2;
              lyricScrollTop.value = Math.max(0, scrollTop);
              setTimeout(() => {
                isScrollToActive = false;
              }, 300);
            });
          } catch (e) {
            console.error("[AIRecommend] 竖屏模式歌词自动滚动失败:", e);
            isScrollToActive = false;
          }
        });
      }
    };
    const onLyricScroll = (e) => {
    };
    const onLyricLineTap = (index) => {
      if (index < 0 || index >= lyrics.value.length)
        return;
      const targetTime = lyrics.value[index].time;
      store_modules_player.playerStore.seek(targetTime);
      currentLyricIndex.value = index;
    };
    const onLyricScrollTap = () => {
      if (playing.value) {
        togglePlay();
      }
    };
    const previewCoverImage = () => {
      const coverUrl = currentSongCover.value;
      if (!coverUrl)
        return;
      common_vendor.index.previewImage({
        urls: [coverUrl],
        current: coverUrl
      });
    };
    let touchStartY = 0;
    const onTouchStart = (e) => {
      e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      return;
    };
    const tabletLyricScrollTop = common_vendor.ref(0);
    const onTabletLyricWheel = (e) => {
      e.preventDefault();
      isUserScrolling = true;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
      }
      tabletLyricScrollTop.value += e.deltaY;
      setTimeout(() => {
        try {
          const query = common_vendor.index.createSelectorQuery();
          query.select(".tablet-lyrics-container").boundingClientRect();
          query.select(".tablet-lyrics-list").boundingClientRect();
          query.exec((res) => {
            if (res && res[0] && res[1]) {
              const containerHeight = res[0].height;
              const listHeight = res[1].height;
              const maxScroll = Math.max(0, listHeight - containerHeight);
              if (tabletLyricScrollTop.value < 0) {
                tabletLyricScrollTop.value = 0;
              } else if (tabletLyricScrollTop.value > maxScroll) {
                tabletLyricScrollTop.value = maxScroll;
              }
            }
          });
        } catch (error) {
          console.error("[AIRecommend] 平板歌词滚动计算失败:", error);
        }
      }, 0);
      userScrollTimer = setTimeout(() => {
        isUserScrolling = false;
      }, 3e3);
    };
    const onTabletLyricTouchStart = (e) => {
      isUserScrolling = true;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
      }
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTabletLyricTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        touchStartY = touchY;
        let newScrollTop = tabletLyricScrollTop.value + deltaY;
        setTimeout(() => {
          try {
            const query = common_vendor.index.createSelectorQuery();
            query.select(".tablet-lyrics-container").boundingClientRect();
            query.select(".tablet-lyrics-list").boundingClientRect();
            query.exec((res) => {
              if (res && res[0] && res[1]) {
                const containerHeight = res[0].height;
                const listHeight = res[1].height;
                const maxScroll = Math.max(0, listHeight - containerHeight);
                if (newScrollTop < 0) {
                  newScrollTop = 0;
                } else if (newScrollTop > maxScroll) {
                  newScrollTop = maxScroll;
                }
                tabletLyricScrollTop.value = newScrollTop;
              }
            });
          } catch (error) {
            console.error("[AIRecommend] 平板歌词触摸滚动失败:", error);
          }
        }, 0);
      }
    };
    const onTabletLyricTouchEnd = () => {
      userScrollTimer = setTimeout(() => {
        isUserScrolling = false;
      }, 3e3);
    };
    const onTabletLyricMouseDown = (e) => {
      isUserScrolling = true;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
      }
      touchStartY = e.clientY;
    };
    common_vendor.watch(prefMode, () => {
      savePreferencesToStorage();
    });
    common_vendor.watch(customPromptText, () => {
      savePreferencesToStorage();
    });
    common_vendor.watch(() => currentTime.value, () => {
      if (isTablet.value || !isTablet.value && currentSlide.value === 1) {
        updateCurrentLyricIndex();
      }
    });
    common_vendor.watch(currentSlide, (newSlide) => {
      if (!isTablet.value && newSlide === 1 && lyrics.value.length > 0) {
        lastScrollIndex = -1;
        updateCurrentLyricIndex();
      }
    });
    common_vendor.watch(currentSongForLab, (newSong, oldSong) => {
      console.log("[AIRecommend] 🎵 歌曲发生变化，准备加载歌词");
      const newSongId = (newSong == null ? void 0 : newSong.id) || (newSong == null ? void 0 : newSong.songId) || (newSong == null ? void 0 : newSong.hash);
      const oldSongId = (oldSong == null ? void 0 : oldSong.id) || (oldSong == null ? void 0 : oldSong.songId) || (oldSong == null ? void 0 : oldSong.hash);
      const isSameSong = newSongId && oldSongId && newSongId === oldSongId;
      if (!isSameSong) {
        console.log("[AIRecommend] 🔄 检测到新歌曲，清除旧歌词并重新加载", {
          新歌: newSong == null ? void 0 : newSong.name,
          旧歌: oldSong == null ? void 0 : oldSong.name,
          新ID: newSongId,
          旧ID: oldSongId
        });
        lyrics.value = [];
        currentLyricIndex.value = 0;
        isLoadingLyrics.value = false;
        setTimeout(() => {
          loadLyrics();
        }, 100);
      } else {
        console.log("[AIRecommend] 同一首歌，跳过歌词重载");
      }
    }, { immediate: true });
    common_vendor.watch(() => store_modules_player.playerStore.state.lyric, (newLyric) => {
      var _a;
      const song = currentSongForLab.value;
      if (!song || !newLyric)
        return;
      const currentSongId2 = song.id || song.songId || song.hash || song.name;
      const hasCurrentSongLyrics = lyrics.value.length > 0 && ((_a = lyrics.value[0]) == null ? void 0 : _a.songId) === currentSongId2;
      if (newLyric && newLyric.length > 0 && !hasCurrentSongLyrics) {
        console.log("[AIRecommend] 🎧 检测到playerStore歌词更新，重新加载", {
          新歌词长度: newLyric.length,
          当前歌曲: song == null ? void 0 : song.name,
          模式: isTablet.value ? "平板" : "竖屏"
        });
        lyrics.value = [];
        currentLyricIndex.value = 0;
        isLoadingLyrics.value = false;
        setTimeout(() => {
          loadLyrics();
        }, 50);
      }
    });
    common_vendor.watch(() => store_modules_player.playerStore.state.lyric, updateCachedLyricsForStatus);
    common_vendor.watch(() => store_modules_player.playerStore.state.lxlyric, updateCachedLyricsForStatus);
    common_vendor.watch(() => store_modules_player.playerStore.state.tlyric, updateCachedLyricsForStatus);
    common_vendor.watch(() => store_modules_player.playerStore.state.currentTime, updateCurrentLyricTextForStatus);
    common_vendor.watch(() => store_modules_player.playerStore.state.statusText, () => {
      updateCurrentLyricTextForStatus();
    }, { immediate: true });
    common_vendor.watch(playerStatusText, () => {
      common_vendor.nextTick$1(() => {
        checkPlayerStatusMarquee();
      });
    });
    common_vendor.watch(currentSongForLab, (newSong, oldSong) => {
      if ((newSong == null ? void 0 : newSong.id) !== (oldSong == null ? void 0 : oldSong.id)) {
        wasPlayingForStatus.value = false;
        hasCheckedLyricsForStatus.value = false;
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca;
      return common_vendor.e({
        a: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        b: common_vendor.o(goBack, "25"),
        c: isTablet.value ? 1 : "",
        d: common_vendor.s(navbarStyle.value),
        e: !isTablet.value
      }, !isTablet.value ? common_vendor.e({
        f: recommendations.value.length > 0 && currentSongForLab.value && !isRefreshing.value
      }, recommendations.value.length > 0 && currentSongForLab.value && !isRefreshing.value ? {
        g: currentSlide.value === 0 ? 1 : "",
        h: currentSlide.value === 1 ? 1 : "",
        i: currentSlide.value === 2 ? 1 : ""
      } : {}, {
        j: recommendations.value.length === 0 || !currentSongForLab.value
      }, recommendations.value.length === 0 || !currentSongForLab.value ? common_vendor.e({
        k: isRefreshing.value ? 1 : "",
        l: isRefreshing.value ? 1 : 0,
        m: isRefreshing.value ? 1 : "",
        n: isRefreshing.value ? 1 : "",
        o: isRefreshing.value ? 1 : "",
        p: common_vendor.s(visualStageStyle.value),
        q: isRefreshing.value
      }, isRefreshing.value ? {
        r: common_vendor.t(aiStatusText.value)
      } : {}) : common_vendor.e({
        s: common_vendor.s(turntableShadowStyle.value),
        t: currentSongCover.value
      }, currentSongCover.value ? {
        v: currentSongCover.value,
        w: common_vendor.o((...args) => _ctx.handleCoverError && _ctx.handleCoverError(...args), "1d")
      } : {}, {
        x: !!currentSongCover.value ? 1 : "",
        y: !currentSongCover.value ? 1 : "",
        z: common_vendor.o(previewCoverImage, "1c"),
        A: playing.value ? 1 : "",
        B: playing.value ? 1 : "",
        C: playing.value ? 1 : "",
        D: common_vendor.s(turntableSizeStyle.value)
      }), {
        E: common_vendor.s(albumCoverWrapperStyle.value),
        F: !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value)
      }, !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value) ? common_vendor.e({
        G: common_vendor.p({
          type: "fas",
          name: "face-6",
          size: "18",
          color: "#475569"
        }),
        H: isAnalyzingProfile.value
      }, isAnalyzingProfile.value ? {
        I: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "12",
          color: "#00d7cd"
        })
      } : {}, {
        J: common_vendor.t(isAnalyzingProfile.value ? "分析中" : "刷新"),
        K: isAnalyzingProfile.value ? 1 : "",
        L: common_vendor.o(handleRefreshProfile, "74"),
        M: common_vendor.t(((_b = (_a = userProfileData.value) == null ? void 0 : _a.musicStyles) == null ? void 0 : _b[0]) || "-"),
        N: isLongProfileValue(((_d = (_c = userProfileData.value) == null ? void 0 : _c.musicStyles) == null ? void 0 : _d[0]) || "-") ? 1 : "",
        O: ((_f = (_e = userProfileData.value) == null ? void 0 : _e.musicStyles) == null ? void 0 : _f[0]) || "-",
        P: common_vendor.t(((_g = userProfileData.value) == null ? void 0 : _g.languagePreference) || "混合"),
        Q: isLongProfileValue(((_h = userProfileData.value) == null ? void 0 : _h.languagePreference) || "混合") ? 1 : "",
        R: ((_i = userProfileData.value) == null ? void 0 : _i.languagePreference) || "混合",
        S: common_vendor.t(((_j = userProfileData.value) == null ? void 0 : _j.emotionTone) || "-"),
        T: isLongProfileValue(((_k = userProfileData.value) == null ? void 0 : _k.emotionTone) || "-") ? 1 : "",
        U: ((_l = userProfileData.value) == null ? void 0 : _l.emotionTone) || "-",
        V: common_vendor.t(((_m = userProfileData.value) == null ? void 0 : _m.rhythmPreference) || "-"),
        W: isLongProfileValue(((_n = userProfileData.value) == null ? void 0 : _n.rhythmPreference) || "-") ? 1 : "",
        X: ((_o = userProfileData.value) == null ? void 0 : _o.rhythmPreference) || "-",
        Y: common_vendor.t(((_p = userProfileData.value) == null ? void 0 : _p.voicePreference) || "-"),
        Z: isLongProfileValue(((_q = userProfileData.value) == null ? void 0 : _q.voicePreference) || "-") ? 1 : "",
        aa: ((_r = userProfileData.value) == null ? void 0 : _r.voicePreference) || "-",
        ab: common_vendor.t(((_s = userProfileData.value) == null ? void 0 : _s.eraPreference) || "-"),
        ac: isLongProfileValue(((_t = userProfileData.value) == null ? void 0 : _t.eraPreference) || "-") ? 1 : "",
        ad: ((_u = userProfileData.value) == null ? void 0 : _u.eraPreference) || "-",
        ae: common_vendor.t(((_v = userProfileData.value) == null ? void 0 : _v.profileName) || "音乐探索者"),
        af: common_vendor.t(((_w = userProfileData.value) == null ? void 0 : _w.profileDesc) || "基于您的听歌习惯生成的个性化画像"),
        ag: (((_x = userProfileData.value) == null ? void 0 : _x.matchPercent) || 0) / 100,
        ah: common_vendor.t(((_y = userProfileData.value) == null ? void 0 : _y.matchPercent) ? userProfileData.value.matchPercent + "%" : "-"),
        ai: common_vendor.t(showPreferencePanel.value ? "收起推荐偏好" : "设置推荐偏好"),
        aj: common_vendor.p({
          type: "fas",
          name: showPreferencePanel.value ? "chevron-up" : "chevron-down",
          size: "12",
          color: "#94a3b8"
        }),
        ak: common_vendor.o(togglePreferencePanel, "d1"),
        al: prefMode.value === "fixed" ? 1 : "",
        am: common_vendor.o(($event) => prefMode.value = "fixed", "fb"),
        an: prefMode.value === "custom" ? 1 : "",
        ao: common_vendor.o(($event) => prefMode.value = "custom", "3c"),
        ap: prefMode.value === "fixed"
      }, prefMode.value === "fixed" ? {
        aq: common_vendor.f(sceneOptions, (scene, idx, i0) => {
          return {
            a: "1e479a0b-4-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: scene.icon,
              size: "16",
              color: selectedScene.value === idx ? "#00d7cd" : "#6b7280"
            }),
            c: common_vendor.t(scene.label),
            d: selectedScene.value === idx ? 1 : "",
            e: idx,
            f: selectedScene.value === idx ? 1 : "",
            g: common_vendor.o(($event) => selectScene(idx), idx)
          };
        }),
        ar: common_vendor.f(exploreOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "explore-" + idx,
            c: selectedExplore.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectExplore(idx), "explore-" + idx)
          };
        }),
        as: common_vendor.f(eraOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "era-" + idx,
            c: selectedEra.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectEra(idx), "era-" + idx)
          };
        }),
        at: common_vendor.f(langOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "lang-" + idx,
            c: selectedLang.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectLang(idx), "lang-" + idx)
          };
        })
      } : {
        av: customPromptPlaceholder,
        aw: customPromptText.value,
        ax: common_vendor.o(($event) => customPromptText.value = $event.detail.value, "15"),
        ay: common_vendor.t(customPromptText.value.length)
      }, {
        az: showPreferencePanel.value,
        aA: common_vendor.p({
          type: "fas",
          name: "wand-magic-sparkles",
          size: "22",
          color: "#ffffff"
        }),
        aB: common_vendor.t(isRefreshing.value ? "AI引擎启动中..." : "开启 AI 探索"),
        aC: common_vendor.o(handleStartRecommend, "09"),
        aD: isRefreshing.value ? 1 : "",
        aE: backupRecommendations.value.length > 0
      }, backupRecommendations.value.length > 0 ? {
        aF: common_vendor.o(handleBackToPlaylist, "76")
      } : {}) : !isRefreshing.value && recommendations.value.length > 0 && currentSongForLab.value ? common_vendor.e({
        aH: common_vendor.t((_z = currentSongForLab.value) == null ? void 0 : _z.name),
        aI: common_vendor.t(((_A = currentSongForLab.value) == null ? void 0 : _A.singer) ? " - " + currentSongForLab.value.singer : ""),
        aJ: playerStatusText.value
      }, playerStatusText.value ? common_vendor.e({
        aK: common_vendor.t(playerStatusText.value),
        aL: playerStatusMarqueeScroll.value
      }, playerStatusMarqueeScroll.value ? {} : {}, {
        aM: playerStatusMarqueeScroll.value
      }, playerStatusMarqueeScroll.value ? {
        aN: common_vendor.t(playerStatusText.value)
      } : {}, {
        aO: playerStatusMarqueeScroll.value ? 1 : ""
      }) : {}, {
        aP: (_B = currentSongForLab.value) == null ? void 0 : _B.reason
      }, ((_C = currentSongForLab.value) == null ? void 0 : _C.reason) ? {
        aQ: common_vendor.t(currentSongForLab.value.reason)
      } : {}, {
        aR: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        aS: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        aT: common_vendor.o(onProgressTouchStart, "8b"),
        aU: common_vendor.o(onProgressTouchMove, "66"),
        aV: common_vendor.o(onProgressTouchEnd, "fe"),
        aW: common_vendor.t(formatTime(currentTime.value)),
        aX: common_vendor.t(formatTime(duration.value)),
        aY: common_vendor.p({
          type: "fas",
          name: "backward-step",
          size: "32",
          color: darkMode.value ? "#94a3b8" : "#374151"
        }),
        aZ: common_vendor.o(playPrev, "53"),
        ba: common_vendor.p({
          type: "fas",
          name: playing.value ? "pause" : "play",
          size: "36",
          color: "#ffffff"
        }),
        bb: common_vendor.o(togglePlay, "b8"),
        bc: common_vendor.p({
          type: "fas",
          name: "forward-step",
          size: "32",
          color: darkMode.value ? "#94a3b8" : "#374151"
        }),
        bd: common_vendor.o(playNext, "0c"),
        be: common_vendor.p({
          type: "fas",
          name: "sliders",
          size: "20",
          color: darkMode.value ? "#94a3b8" : "#6b7280"
        }),
        bf: common_vendor.o(handleBackToAdjustPreferences, "75"),
        bg: common_vendor.p({
          type: "fas",
          name: "heart",
          size: "20",
          color: isCurrentSongFavorite.value ? "#ff6b6b" : darkMode.value ? "#94a3b8" : "#6b7280"
        }),
        bh: common_vendor.o(handleFavorite, "6e"),
        bi: common_vendor.p({
          type: "fas",
          name: "heart-crack",
          size: "20",
          color: isCurrentSongDisliked.value ? "#ff4444" : darkMode.value ? "#94a3b8" : "#6b7280"
        }),
        bj: common_vendor.o(handleDislike, "c5"),
        bk: common_vendor.p({
          type: "fas",
          name: "rotate-right",
          size: "20",
          color: darkMode.value ? "#94a3b8" : "#6b7280"
        }),
        bl: common_vendor.o((...args) => common_vendor.unref(handleRefreshRecommend) && common_vendor.unref(handleRefreshRecommend)(...args), "93"),
        bm: common_vendor.t(recommendations.value.length),
        bn: common_vendor.o(handleSaveAllToFavorite, "b5"),
        bo: recommendations.value.length > 0
      }, recommendations.value.length > 0 ? {
        bp: common_vendor.f(recommendations.value, (song, index, i0) => {
          return common_vendor.e({
            a: "1e479a0b-13-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: "blur-on",
              size: "18",
              color: isCurrentSong(song, index) ? "#00d7cd" : "#9ca3af"
            }),
            c: common_vendor.t(song.name),
            d: song.reason
          }, song.reason ? {
            e: common_vendor.t(song.reason.slice(0, 30))
          } : {}, {
            f: "1e479a0b-14-" + i0,
            g: common_vendor.p({
              type: "fas",
              name: "play-circle",
              size: "22",
              color: isCurrentSong(song, index) ? "#00d7cd" : "#cbd5e1"
            }),
            h: "proto_" + index + "_" + (song.id || song.name),
            i: isCurrentSong(song, index) ? 1 : "",
            j: common_vendor.o(($event) => playSongAtIndex(index), "proto_" + index + "_" + (song.id || song.name))
          });
        })
      } : {}, {
        bq: `translateX(-${resultPage.value * 100}%)`
      }) : {}, {
        aG: !isRefreshing.value && recommendations.value.length > 0 && currentSongForLab.value,
        br: lyrics.value.length > 0
      }, lyrics.value.length > 0 ? {
        bs: common_vendor.f(lyrics.value, (line, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(line.text),
            b: line.translation
          }, line.translation ? {
            c: common_vendor.t(line.translation)
          } : {}, {
            d: currentLyricIndex.value === index ? 1 : "",
            e: index,
            f: "lyric-line-" + index,
            g: common_vendor.o(($event) => onLyricLineTap(index), index)
          });
        }),
        bt: lyricScrollTop.value,
        bv: common_vendor.o(onLyricScroll, "40"),
        bw: common_vendor.o(onLyricScrollTap, "7d")
      } : {}, {
        bx: recommendations.value.length > 0
      }, recommendations.value.length > 0 ? {
        by: common_vendor.f(recommendations.value, (song, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.t(song.name),
            c: common_vendor.t(song.singer),
            d: common_vendor.t(song.album ? " - " + song.album : ""),
            e: song.reason
          }, song.reason ? {
            f: common_vendor.t(song.reason)
          } : {}, {
            g: "1e479a0b-15-" + i0,
            h: common_vendor.p({
              type: "fas",
              name: "heart",
              size: "14",
              color: isFavorite(song) ? "#ff6b6b" : "#9ca3af"
            }),
            i: common_vendor.o(($event) => handlePlaylistFavorite(song), "playlist_" + index + "_" + (song.id || song.name)),
            j: "playlist_" + index + "_" + (song.id || song.name),
            k: isCurrentSong(song, index) ? 1 : "",
            l: common_vendor.o(($event) => playSongAtIndex(index), "playlist_" + index + "_" + (song.id || song.name))
          });
        })
      } : {
        bz: common_vendor.p({
          type: "fas",
          name: "flask",
          size: "48",
          color: "#d1d5db"
        })
      }, {
        bA: currentSlide.value,
        bB: common_vendor.o(onSwiperChange, "be"),
        bC: isRefreshing.value,
        bD: !isRefreshing.value,
        bE: isRefreshing.value
      }, isRefreshing.value ? {
        bF: common_vendor.o(noop, "0d"),
        bG: common_vendor.o(noop, "40")
      } : {}, {
        bH: isRefreshing.value ? 1 : "",
        bI: currentSlide.value === 1 && recommendations.value.length > 0 && currentSongForLab.value
      }, currentSlide.value === 1 && recommendations.value.length > 0 && currentSongForLab.value ? {
        bJ: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        bK: common_vendor.o(switchToAlbum, "ce")
      } : {}, {
        bL: currentSlide.value === 2 && recommendations.value.length > 0 && currentSongForLab.value
      }, currentSlide.value === 2 && recommendations.value.length > 0 && currentSongForLab.value ? {
        bM: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        bN: common_vendor.o(switchToLyrics, "f4")
      } : {}, {
        bO: currentSlide.value === 0 && recommendations.value.length > 0 && currentSongForLab.value
      }, currentSlide.value === 0 && recommendations.value.length > 0 && currentSongForLab.value ? {
        bP: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        bQ: common_vendor.o(switchToLyrics, "b3")
      } : {}, {
        bR: currentSlide.value === 1 && recommendations.value.length > 0 && currentSongForLab.value
      }, currentSlide.value === 1 && recommendations.value.length > 0 && currentSongForLab.value ? {
        bS: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        bT: common_vendor.o(switchToPlaylist, "61")
      } : {}) : {}, {
        bU: isTablet.value
      }, isTablet.value ? common_vendor.e({
        bV: recommendations.value.length === 0 || !currentSongForLab.value
      }, recommendations.value.length === 0 || !currentSongForLab.value ? common_vendor.e({
        bW: isRefreshing.value ? 1 : "",
        bX: isRefreshing.value ? 1 : 0,
        bY: isRefreshing.value ? 1 : "",
        bZ: isRefreshing.value ? 1 : "",
        ca: isRefreshing.value ? 1 : "",
        cb: common_vendor.s(visualStageStyle.value),
        cc: isRefreshing.value
      }, isRefreshing.value ? {
        cd: common_vendor.t(aiStatusText.value)
      } : {}) : common_vendor.e({
        ce: common_vendor.s(turntableShadowStyle.value),
        cf: currentSongCover.value
      }, currentSongCover.value ? {
        cg: currentSongCover.value,
        ch: common_vendor.o((...args) => _ctx.handleCoverError && _ctx.handleCoverError(...args), "6e")
      } : {}, {
        ci: !!currentSongCover.value ? 1 : "",
        cj: !currentSongCover.value ? 1 : "",
        ck: common_vendor.o(previewCoverImage, "b4"),
        cl: playing.value ? 1 : "",
        cm: playing.value ? 1 : "",
        cn: playing.value ? 1 : "",
        co: common_vendor.s(turntableSizeStyle.value)
      }), {
        cp: common_vendor.s(albumCoverWrapperStyle.value),
        cq: !isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value)
      }, !isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value) ? common_vendor.e({
        cr: common_vendor.p({
          type: "fas",
          name: "face-6",
          size: "18",
          color: "#475569"
        }),
        cs: isAnalyzingProfile.value
      }, isAnalyzingProfile.value ? {
        ct: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "12",
          color: "#00d7cd"
        })
      } : {}, {
        cv: common_vendor.t(isAnalyzingProfile.value ? "分析中" : "刷新"),
        cw: isAnalyzingProfile.value ? 1 : "",
        cx: common_vendor.o(handleRefreshProfile, "6a"),
        cy: common_vendor.t(((_E = (_D = userProfileData.value) == null ? void 0 : _D.musicStyles) == null ? void 0 : _E[0]) || "-"),
        cz: isLongProfileValue(((_G = (_F = userProfileData.value) == null ? void 0 : _F.musicStyles) == null ? void 0 : _G[0]) || "-") ? 1 : "",
        cA: ((_I = (_H = userProfileData.value) == null ? void 0 : _H.musicStyles) == null ? void 0 : _I[0]) || "-",
        cB: common_vendor.t(((_J = userProfileData.value) == null ? void 0 : _J.languagePreference) || "混合"),
        cC: isLongProfileValue(((_K = userProfileData.value) == null ? void 0 : _K.languagePreference) || "混合") ? 1 : "",
        cD: ((_L = userProfileData.value) == null ? void 0 : _L.languagePreference) || "混合",
        cE: common_vendor.t(((_M = userProfileData.value) == null ? void 0 : _M.emotionTone) || "-"),
        cF: isLongProfileValue(((_N = userProfileData.value) == null ? void 0 : _N.emotionTone) || "-") ? 1 : "",
        cG: ((_O = userProfileData.value) == null ? void 0 : _O.emotionTone) || "-",
        cH: common_vendor.t(((_P = userProfileData.value) == null ? void 0 : _P.rhythmPreference) || "-"),
        cI: isLongProfileValue(((_Q = userProfileData.value) == null ? void 0 : _Q.rhythmPreference) || "-") ? 1 : "",
        cJ: ((_R = userProfileData.value) == null ? void 0 : _R.rhythmPreference) || "-",
        cK: common_vendor.t(((_S = userProfileData.value) == null ? void 0 : _S.voicePreference) || "-"),
        cL: isLongProfileValue(((_T = userProfileData.value) == null ? void 0 : _T.voicePreference) || "-") ? 1 : "",
        cM: ((_U = userProfileData.value) == null ? void 0 : _U.voicePreference) || "-",
        cN: common_vendor.t(((_V = userProfileData.value) == null ? void 0 : _V.eraPreference) || "-"),
        cO: isLongProfileValue(((_W = userProfileData.value) == null ? void 0 : _W.eraPreference) || "-") ? 1 : "",
        cP: ((_X = userProfileData.value) == null ? void 0 : _X.eraPreference) || "-",
        cQ: common_vendor.t(((_Y = userProfileData.value) == null ? void 0 : _Y.profileName) || "音乐探索者"),
        cR: common_vendor.t(((_Z = userProfileData.value) == null ? void 0 : _Z.profileDesc) || "基于您的听歌习惯生成的个性化画像"),
        cS: (((__ = userProfileData.value) == null ? void 0 : __.matchPercent) || 0) / 100,
        cT: common_vendor.t(((_$ = userProfileData.value) == null ? void 0 : _$.matchPercent) ? userProfileData.value.matchPercent + "%" : "-"),
        cU: common_vendor.t(showPreferencePanel.value ? "收起推荐偏好" : "设置推荐偏好"),
        cV: common_vendor.p({
          type: "fas",
          name: showPreferencePanel.value ? "chevron-up" : "chevron-down",
          size: "12",
          color: "#94a3b8"
        }),
        cW: common_vendor.o(togglePreferencePanel, "ac"),
        cX: prefMode.value === "fixed" ? 1 : "",
        cY: common_vendor.o(($event) => prefMode.value = "fixed", "29"),
        cZ: prefMode.value === "custom" ? 1 : "",
        da: common_vendor.o(($event) => prefMode.value = "custom", "19"),
        db: prefMode.value === "fixed"
      }, prefMode.value === "fixed" ? {
        dc: common_vendor.f(sceneOptions, (scene, idx, i0) => {
          return {
            a: "1e479a0b-24-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: scene.icon,
              size: "16",
              color: selectedScene.value === idx ? "#00d7cd" : "#6b7280"
            }),
            c: common_vendor.t(scene.label),
            d: selectedScene.value === idx ? 1 : "",
            e: idx,
            f: selectedScene.value === idx ? 1 : "",
            g: common_vendor.o(($event) => selectScene(idx), idx)
          };
        }),
        dd: common_vendor.f(exploreOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "explore2-" + idx,
            c: selectedExplore.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectExplore(idx), "explore2-" + idx)
          };
        }),
        de: common_vendor.f(eraOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "era2-" + idx,
            c: selectedEra.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectEra(idx), "era2-" + idx)
          };
        }),
        df: common_vendor.f(langOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "lang2-" + idx,
            c: selectedLang.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectLang(idx), "lang2-" + idx)
          };
        })
      } : {
        dg: customPromptPlaceholder,
        dh: customPromptText.value,
        di: common_vendor.o(($event) => customPromptText.value = $event.detail.value, "ab"),
        dj: common_vendor.t(customPromptText.value.length)
      }, {
        dk: showPreferencePanel.value,
        dl: common_vendor.p({
          type: "fas",
          name: "wand-magic-sparkles",
          size: "22",
          color: "#ffffff"
        }),
        dm: common_vendor.t(isRefreshing.value ? "AI引擎启动中..." : "开启 AI 探索"),
        dn: common_vendor.o(handleStartRecommend, "34"),
        dp: isRefreshing.value ? 1 : ""
      }) : !isRefreshing.value && recommendations.value.length > 0 && currentSongForLab.value ? common_vendor.e({
        dr: common_vendor.t((_aa = currentSongForLab.value) == null ? void 0 : _aa.name),
        ds: common_vendor.t(((_ba = currentSongForLab.value) == null ? void 0 : _ba.singer) ? " - " + currentSongForLab.value.singer : ""),
        dt: playerStatusText.value
      }, playerStatusText.value ? common_vendor.e({
        dv: common_vendor.t(playerStatusText.value),
        dw: playerStatusMarqueeScroll.value
      }, playerStatusMarqueeScroll.value ? {} : {}, {
        dx: playerStatusMarqueeScroll.value
      }, playerStatusMarqueeScroll.value ? {
        dy: common_vendor.t(playerStatusText.value)
      } : {}, {
        dz: playerStatusMarqueeScroll.value ? 1 : ""
      }) : {}, {
        dA: (_ca = currentSongForLab.value) == null ? void 0 : _ca.reason
      }, ((_da = currentSongForLab.value) == null ? void 0 : _da.reason) ? {
        dB: common_vendor.t(currentSongForLab.value.reason)
      } : {}, {
        dC: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        dD: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        dE: common_vendor.o(onProgressTouchStart, "d0"),
        dF: common_vendor.o(onProgressTouchMove, "47"),
        dG: common_vendor.o(onProgressTouchEnd, "8c"),
        dH: common_vendor.o((...args) => _ctx.onProgressMouseDown && _ctx.onProgressMouseDown(...args), "cf"),
        dI: common_vendor.o(() => {
        }, "60"),
        dJ: common_vendor.t(formatTime(currentTime.value)),
        dK: common_vendor.t(formatTime(duration.value)),
        dL: common_vendor.p({
          type: "fas",
          name: "backward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        dM: common_vendor.o(playPrev, "8d"),
        dN: common_vendor.p({
          type: "fas",
          name: playing.value ? "pause" : "play",
          size: "28",
          color: "#ffffff"
        }),
        dO: common_vendor.o(togglePlay, "9d"),
        dP: common_vendor.p({
          type: "fas",
          name: "forward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        dQ: common_vendor.o(playNext, "46"),
        dR: common_vendor.p({
          type: "fas",
          name: "sliders",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        dS: common_vendor.o(handleBackToAdjustPreferences, "ef"),
        dT: common_vendor.p({
          type: "fas",
          name: "heart",
          size: 18,
          color: isCurrentSongFavorite.value ? "#ff6b6b" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        dU: isCurrentSongFavorite.value ? 1 : "",
        dV: common_vendor.o(handleFavorite, "1a"),
        dW: common_vendor.p({
          type: "fas",
          name: "heart-crack",
          size: 18,
          color: isCurrentSongDisliked.value ? "#ff4444" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        dX: isCurrentSongDisliked.value ? 1 : "",
        dY: common_vendor.o(handleDislike, "a1"),
        dZ: common_vendor.p({
          type: "fas",
          name: "rotate-right",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        ea: common_vendor.o((...args) => common_vendor.unref(handleRefreshRecommend) && common_vendor.unref(handleRefreshRecommend)(...args), "9b")
      }) : {}, {
        dq: !isRefreshing.value && recommendations.value.length > 0 && currentSongForLab.value,
        eb: isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value)
      }, isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value) ? common_vendor.e({
        ec: common_vendor.p({
          type: "fas",
          name: "face-6",
          size: "18",
          color: "#475569"
        }),
        ed: isAnalyzingProfile.value
      }, isAnalyzingProfile.value ? {
        ee: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "12",
          color: "#00d7cd"
        })
      } : {}, {
        ef: common_vendor.t(isAnalyzingProfile.value ? "分析中" : "刷新"),
        eg: isAnalyzingProfile.value ? 1 : "",
        eh: common_vendor.o(handleRefreshProfile, "37"),
        ei: common_vendor.t(((_fa = (_ea = userProfileData.value) == null ? void 0 : _ea.musicStyles) == null ? void 0 : _fa[0]) || "-"),
        ej: isLongProfileValue(((_ha = (_ga = userProfileData.value) == null ? void 0 : _ga.musicStyles) == null ? void 0 : _ha[0]) || "-") ? 1 : "",
        ek: ((_ja = (_ia = userProfileData.value) == null ? void 0 : _ia.musicStyles) == null ? void 0 : _ja[0]) || "-",
        el: common_vendor.t(((_ka = userProfileData.value) == null ? void 0 : _ka.languagePreference) || "混合"),
        em: isLongProfileValue(((_la = userProfileData.value) == null ? void 0 : _la.languagePreference) || "混合") ? 1 : "",
        en: ((_ma = userProfileData.value) == null ? void 0 : _ma.languagePreference) || "混合",
        eo: common_vendor.t(((_na = userProfileData.value) == null ? void 0 : _na.emotionTone) || "-"),
        ep: isLongProfileValue(((_oa = userProfileData.value) == null ? void 0 : _oa.emotionTone) || "-") ? 1 : "",
        eq: ((_pa = userProfileData.value) == null ? void 0 : _pa.emotionTone) || "-",
        er: common_vendor.t(((_qa = userProfileData.value) == null ? void 0 : _qa.rhythmPreference) || "-"),
        es: isLongProfileValue(((_ra = userProfileData.value) == null ? void 0 : _ra.rhythmPreference) || "-") ? 1 : "",
        et: ((_sa = userProfileData.value) == null ? void 0 : _sa.rhythmPreference) || "-",
        ev: common_vendor.t(((_ta = userProfileData.value) == null ? void 0 : _ta.voicePreference) || "-"),
        ew: isLongProfileValue(((_ua = userProfileData.value) == null ? void 0 : _ua.voicePreference) || "-") ? 1 : "",
        ex: ((_va = userProfileData.value) == null ? void 0 : _va.voicePreference) || "-",
        ey: common_vendor.t(((_wa = userProfileData.value) == null ? void 0 : _wa.eraPreference) || "-"),
        ez: isLongProfileValue(((_xa = userProfileData.value) == null ? void 0 : _xa.eraPreference) || "-") ? 1 : "",
        eA: ((_ya = userProfileData.value) == null ? void 0 : _ya.eraPreference) || "-",
        eB: common_vendor.t(((_za = userProfileData.value) == null ? void 0 : _za.profileName) || "音乐探索者"),
        eC: common_vendor.t(((_Aa = userProfileData.value) == null ? void 0 : _Aa.profileDesc) || "基于您的听歌习惯生成的个性化画像"),
        eD: (((_Ba = userProfileData.value) == null ? void 0 : _Ba.matchPercent) || 0) / 100,
        eE: common_vendor.t(((_Ca = userProfileData.value) == null ? void 0 : _Ca.matchPercent) ? userProfileData.value.matchPercent + "%" : "-"),
        eF: common_vendor.t(showPreferencePanel.value ? "收起推荐偏好" : "设置推荐偏好"),
        eG: common_vendor.p({
          type: "fas",
          name: showPreferencePanel.value ? "chevron-up" : "chevron-down",
          size: "12",
          color: "#94a3b8"
        }),
        eH: common_vendor.o(togglePreferencePanel, "e2"),
        eI: showPreferencePanel.value ? 1 : "",
        eJ: showPreferencePanel.value
      }, showPreferencePanel.value ? common_vendor.e({
        eK: prefMode.value === "fixed" ? 1 : "",
        eL: common_vendor.o(($event) => prefMode.value = "fixed", "01"),
        eM: prefMode.value === "custom" ? 1 : "",
        eN: common_vendor.o(($event) => prefMode.value = "custom", "dc"),
        eO: prefMode.value === "fixed"
      }, prefMode.value === "fixed" ? {
        eP: common_vendor.f(sceneOptions, (scene, idx, i0) => {
          return {
            a: "1e479a0b-36-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: scene.icon,
              size: "16",
              color: selectedScene.value === idx ? "#00d7cd" : "#6b7280"
            }),
            c: common_vendor.t(scene.label),
            d: selectedScene.value === idx ? 1 : "",
            e: idx,
            f: selectedScene.value === idx ? 1 : "",
            g: common_vendor.o(($event) => selectScene(idx), idx)
          };
        }),
        eQ: common_vendor.f(exploreOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "explore3-" + idx,
            c: selectedExplore.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectExplore(idx), "explore3-" + idx)
          };
        }),
        eR: common_vendor.f(eraOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "era3-" + idx,
            c: selectedEra.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectEra(idx), "era3-" + idx)
          };
        }),
        eS: common_vendor.f(langOptions, (opt, idx, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: "lang3-" + idx,
            c: selectedLang.value === idx ? 1 : "",
            d: common_vendor.o(($event) => selectLang(idx), "lang3-" + idx)
          };
        })
      } : {
        eT: customPromptPlaceholder,
        eU: customPromptText.value,
        eV: common_vendor.o(($event) => customPromptText.value = $event.detail.value, "bf"),
        eW: common_vendor.t(customPromptText.value.length)
      }) : {}, {
        eX: showPreferencePanel.value ? 1 : ""
      }) : {}, {
        eY: isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value)
      }, isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value) ? common_vendor.e({
        eZ: common_vendor.p({
          type: "fas",
          name: "wand-magic-sparkles",
          size: "22",
          color: "#ffffff"
        }),
        fa: common_vendor.t(isRefreshing.value ? "AI引擎启动中..." : "开启 AI 探索"),
        fb: common_vendor.o(handleStartRecommend, "92"),
        fc: isRefreshing.value ? 1 : "",
        fd: backupRecommendations.value.length > 0
      }, backupRecommendations.value.length > 0 ? {
        fe: common_vendor.o(handleBackToPlaylist, "b9")
      } : {}) : {}, {
        ff: !isTablet.value || isRefreshing.value || recommendations.value.length > 0 && currentSongForLab.value
      }, !isTablet.value || isRefreshing.value || recommendations.value.length > 0 && currentSongForLab.value ? common_vendor.e({
        fg: tabletRightView.value === 0 ? 1 : "",
        fh: common_vendor.o(($event) => switchTabletRight(0), "f2"),
        fi: tabletRightView.value === 1 ? 1 : "",
        fj: common_vendor.o(($event) => switchTabletRight(1), "dd"),
        fk: recommendations.value.length > 0
      }, recommendations.value.length > 0 ? {
        fl: common_vendor.f(recommendations.value, (song, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.t(song.name),
            c: common_vendor.t(song.singer),
            d: common_vendor.t(song.album ? " - " + song.album : ""),
            e: song.reason
          }, song.reason ? {
            f: common_vendor.t(song.reason)
          } : {}, {
            g: "1e479a0b-38-" + i0,
            h: common_vendor.p({
              type: "fas",
              name: "heart",
              size: "14",
              color: isFavorite(song) ? "#ff6b6b" : "#9ca3af"
            }),
            i: common_vendor.o(($event) => handlePlaylistFavorite(song), "ai_tablet_" + index + "_" + (song.id || song.name)),
            j: "ai_tablet_" + index + "_" + (song.id || song.name),
            k: isCurrentSong(song, index) ? 1 : "",
            l: common_vendor.o(($event) => playSongAtIndex(index), "ai_tablet_" + index + "_" + (song.id || song.name))
          });
        })
      } : {
        fm: common_vendor.p({
          type: "fas",
          name: "flask",
          size: "48",
          color: "#d1d5db"
        })
      }, {
        fn: lyrics.value.length > 0
      }, lyrics.value.length > 0 ? {
        fo: common_vendor.f(lyrics.value, (line, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(line.text),
            b: line.translation
          }, line.translation ? {
            c: common_vendor.t(line.translation)
          } : {}, {
            d: currentLyricIndex.value === index ? 1 : "",
            e: "tablet_lyric_" + index,
            f: "tablet-lyric-line-" + index,
            g: index,
            h: common_vendor.o(($event) => onLyricLineTap(index), "tablet_lyric_" + index)
          });
        }),
        fp: `translateY(-${tabletLyricScrollTop.value}px)`
      } : {}, {
        fq: common_vendor.o(onTabletLyricWheel, "21"),
        fr: common_vendor.o(onTabletLyricTouchStart, "0c"),
        fs: common_vendor.o(onTabletLyricTouchMove, "d1"),
        ft: common_vendor.o(onTabletLyricTouchEnd, "38"),
        fv: common_vendor.o(onTabletLyricMouseDown, "70"),
        fw: tabletRightView.value,
        fx: common_vendor.o((e) => switchTabletRight(e.detail.current), "59")
      }) : {}, {
        fy: isRefreshing.value ? 1 : "",
        fz: isTablet.value && !isRefreshing.value && (recommendations.value.length === 0 || !currentSongForLab.value) ? 1 : ""
      }) : {}, {
        fA: showAIApiModal.value
      }, showAIApiModal.value ? common_vendor.e({
        fB: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        fC: common_vendor.o(closeAIApiModal, "8c"),
        fD: common_vendor.p({
          type: "fas",
          name: "info-circle",
          size: "14",
          color: "#6b7280"
        }),
        fE: apiConfig.value.provider === "backend"
      }, apiConfig.value.provider === "backend" ? {} : {}, {
        fF: activePlatform.value === "backend" ? 1 : "",
        fG: common_vendor.o(($event) => selectPlatform("backend"), "b5"),
        fH: apiConfig.value.provider === "deepseek" && apiConfig.value.apiKey
      }, apiConfig.value.provider === "deepseek" && apiConfig.value.apiKey ? {} : {}, {
        fI: activePlatform.value === "deepseek" ? 1 : "",
        fJ: common_vendor.o(($event) => selectPlatform("deepseek"), "9c"),
        fK: apiConfig.value.provider === "openai" && apiConfig.value.apiKey
      }, apiConfig.value.provider === "openai" && apiConfig.value.apiKey ? {} : {}, {
        fL: activePlatform.value === "openai" ? 1 : "",
        fM: common_vendor.o(($event) => selectPlatform("openai"), "6f"),
        fN: apiConfig.value.provider === "siliconflow" && apiConfig.value.apiKey
      }, apiConfig.value.provider === "siliconflow" && apiConfig.value.apiKey ? {} : {}, {
        fO: activePlatform.value === "siliconflow" ? 1 : "",
        fP: common_vendor.o(($event) => selectPlatform("siliconflow"), "0c"),
        fQ: apiConfig.value.provider === "custom" && apiConfig.value.apiKey
      }, apiConfig.value.provider === "custom" && apiConfig.value.apiKey ? {} : {}, {
        fR: activePlatform.value === "custom" ? 1 : "",
        fS: common_vendor.o(($event) => selectPlatform("custom"), "4a"),
        fT: activePlatform.value && activePlatform.value !== "backend"
      }, activePlatform.value && activePlatform.value !== "backend" ? {
        fU: getApiUrlPlaceholder(),
        fV: currentApiUrl.value,
        fW: common_vendor.o(($event) => currentApiUrl.value = $event.detail.value, "a0"),
        fX: showApiKey.value ? "text" : "password",
        fY: currentApiKey.value,
        fZ: common_vendor.o(($event) => currentApiKey.value = $event.detail.value, "41"),
        ga: common_vendor.p({
          type: "fas",
          name: showApiKey.value ? "eye-slash" : "eye",
          size: "16",
          color: "#9ca3af"
        }),
        gb: common_vendor.o(($event) => showApiKey.value = !showApiKey.value, "17"),
        gc: getModelPlaceholder(),
        gd: currentModelName.value,
        ge: common_vendor.o(($event) => currentModelName.value = $event.detail.value, "9d")
      } : {}, {
        gf: activePlatform.value === "backend"
      }, activePlatform.value === "backend" ? {
        gg: common_vendor.p({
          type: "fas",
          name: "check-circle",
          size: "16",
          color: "#4CAF50"
        })
      } : {}, {
        gh: common_vendor.o(closeAIApiModal, "fc"),
        gi: common_vendor.o(saveAIApiConfig, "61"),
        gj: darkMode.value ? 1 : "",
        gk: isTablet.value ? 1 : "",
        gl: common_vendor.s(aiApiModalTabletStyle.value),
        gm: common_vendor.o(() => {
        }, "20"),
        gn: common_vendor.o(closeAIApiModal, "6b")
      }) : {}, {
        go: showGuideToSettings.value
      }, showGuideToSettings.value ? common_vendor.e({
        gp: common_vendor.p({
          type: "fas",
          name: "robot",
          size: "40",
          color: "#6b7280"
        }),
        gq: common_vendor.t(guideMessage.value),
        gr: common_vendor.p({
          type: "fas",
          name: "gear",
          size: "20",
          color: "#e2e8f0"
        }),
        gs: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "16",
          color: "#9ca3af"
        }),
        gt: common_vendor.o(goToSettingsForAI, "62"),
        gv: common_vendor.p({
          type: "fas",
          name: "server",
          size: "20",
          color: "#e2e8f0"
        }),
        gw: apiConfig.value.provider === "backend"
      }, apiConfig.value.provider === "backend" ? {
        gx: common_vendor.p({
          type: "fas",
          name: "check",
          size: "16",
          color: "#6b7280"
        })
      } : {}, {
        gy: common_vendor.o(useDefaultBackend, "47"),
        gz: common_vendor.o(closeGuideModal, "56"),
        gA: darkMode.value ? 1 : "",
        gB: isTablet.value ? 1 : "",
        gC: common_vendor.o(() => {
        }, "ac"),
        gD: common_vendor.o(closeGuideModal, "ca")
      }) : {}, {
        gE: darkMode.value ? 1 : "",
        gF: isTablet.value ? 1 : "",
        gG: common_vendor.o(onTouchStart, "f6"),
        gH: common_vendor.o(onTouchEnd, "a0")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1e479a0b"]]);
wx.createPage(MiniProgramPage);
