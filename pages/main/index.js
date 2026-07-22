"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_version = require("../../utils/version.js");
const utils_system = require("../../utils/system.js");
const utils_config = require("../../utils/config.js");
const utils_mesh_meshConfig = require("../../utils/mesh/meshConfig.js");
const store_modules_user = require("../../store/modules/user.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  (PactModal + UpdateModal + _easycom_roc_icon_plus + IndexPage + SearchPage + PlaylistPage + MyPage + SettingsPage + ShareListPage + RankPage + SonglistListPage + MusicSourcesPage + AIRecommendPage + MiniPlayer + CustomTabBar)();
}
const IndexPage = () => "../index/index2.js";
const SearchPage = () => "../search/index2.js";
const PlaylistPage = () => "../playlist/index2.js";
const MyPage = () => "../my/index2.js";
const SettingsPage = () => "../settings/index2.js";
const ShareListPage = () => "../sharelist/index2.js";
const RankPage = () => "../rank/index2.js";
const SonglistListPage = () => "../songlist-list/index2.js";
const MusicSourcesPage = () => "../music-sources/index2.js";
const AIRecommendPage = () => "../ai-recommend/index2.js";
const MiniPlayer = () => "../../components/player/MiniPlayer.js";
const CustomTabBar = () => "../../components/common/CustomTabBar.js";
const PactModal = () => "../../components/common/PactModal.js";
const UpdateModal = () => "../../components/common/UpdateModal.js";
const TABLET_ASPECT_RATIO = 0.85;
const TABLET_MIN_WIDTH = 400;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const currentTab = common_vendor.ref(0);
    const loadedTabs = common_vendor.ref([0]);
    const darkMode = common_vendor.ref(false);
    const isTablet = common_vendor.ref(false);
    const subPageStack = common_vendor.ref([]);
    const showSubPage = common_vendor.computed(() => subPageStack.value.length > 0);
    const currentSubPageUrl = common_vendor.computed(() => {
      const stack = subPageStack.value;
      return stack.length > 0 ? stack[stack.length - 1] : "";
    });
    const showPactModal = common_vendor.ref(false);
    const showUpdatePopup = common_vendor.ref(false);
    const updateInfo = common_vendor.ref(null);
    const pactAgreed = common_vendor.ref(false);
    const showPactRejectModal = common_vendor.ref(false);
    const showDebugModal = common_vendor.ref(false);
    const showIgnoreConfirmModal = common_vendor.ref(false);
    const capsuleButton = common_vendor.ref({
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });
    const showDebugLog = common_vendor.ref(false);
    const showMeshModeModal = common_vendor.ref(false);
    const isImportScriptsPrompting = common_vendor.ref(false);
    const showDonationPromptModal = common_vendor.ref(false);
    const donationStats = common_vendor.ref({
      remaining: 0,
      used: 0,
      total: 0
    });
    const showServerGuideModal = common_vendor.ref(false);
    const serverGuideSongCount = common_vendor.ref(0);
    const serverGuideHelperCount = common_vendor.ref(0);
    const debugPanelExpanded = common_vendor.ref(false);
    const debugInfo = common_vendor.ref({
      followSystem: "",
      followSystemType: "",
      isFollowSystem: false,
      darkModeStorage: "",
      systemTheme: "",
      appLaunchTime: "",
      isFirstInstall: false,
      platform: "",
      appTheme: ""
    });
    const themeLogs = common_vendor.ref([]);
    const addThemeLog = (log, source = "Main") => {
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      themeLogs.value.unshift(`[${time}] [${source}] ${log}`);
      if (themeLogs.value.length > 300) {
        themeLogs.value.pop();
      }
    };
    const refreshDebugInfo = () => {
      const followSystem = common_vendor.index.getStorageSync("followSystem");
      const darkModeStorage = common_vendor.index.getStorageSync("darkMode");
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const installTime = common_vendor.index.getStorageSync("appInstallTime");
      const userTheme = common_vendor.index.getStorageSync("userTheme");
      const now = Date.now();
      const isFirstInstall = installTime && now - parseInt(installTime) < 5 * 60 * 1e3;
      debugInfo.value = {
        followSystem: String(followSystem),
        followSystemType: typeof followSystem,
        isFollowSystem: followSystem !== "false" && followSystem !== false,
        darkModeStorage: String(darkModeStorage),
        systemTheme: systemInfo.theme || "unknown",
        appLaunchTime: installTime ? new Date(parseInt(installTime)).toLocaleString() : "unknown",
        isFirstInstall,
        platform: systemInfo.platform || "unknown",
        appTheme: userTheme || "auto"
      };
      addThemeLog("刷新调试信息", "Main");
    };
    const toggleDebugPanel = () => {
      debugPanelExpanded.value = !debugPanelExpanded.value;
      if (debugPanelExpanded.value) {
        refreshDebugInfo();
      }
    };
    const clearThemeLogs = () => {
      themeLogs.value = [];
      addThemeLog("清空日志", "Main");
    };
    const copyDebugLogs = () => {
      try {
        const logsText = themeLogs.value.join("\n");
        const infoText = Object.entries(debugInfo.value).map(([key, val]) => `${key}: ${val}`).join("\n");
        const fullText = `=== 调试信息 ===
${infoText}

=== 日志 ===
${logsText}`;
        common_vendor.index.setClipboardData({
          data: fullText,
          success: () => {
            common_vendor.index.showToast({ title: "已复制到剪贴板", icon: "success" });
            addThemeLog("日志已复制", "Main");
          }
        });
      } catch (e) {
        console.error("[Main] 复制日志失败:", e);
        common_vendor.index.showToast({ title: "复制失败", icon: "none" });
      }
    };
    const onDebugLogsWheel = (e) => {
      const scrollEl = e.target;
      if (scrollEl && scrollEl.scrollTop !== void 0) {
        return;
      }
    };
    const getCapsuleButtonRect = () => {
      try {
        const rect = common_vendor.index.getMenuButtonBoundingClientRect();
        console.log("[Main] 胶囊按钮位置:", rect);
        capsuleButton.value = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        };
      } catch (e) {
        console.log("[Main] 获取胶囊按钮位置失败:", e);
      }
    };
    const checkHttpAccess = () => {
      const ignored = common_vendor.index.getStorageSync("ignoreHttpCheck");
      if (ignored) {
        console.log("[Main] 用户已选择永久忽略HTTP检测");
        return;
      }
      console.log("[Main] 开始检测HTTP访问能力...");
      common_vendor.index.request({
        url: "http://www.baidu.com/",
        method: "GET",
        timeout: 5e3,
        success: (res) => {
          console.log("[Main] HTTP检测成功:", res.statusCode);
        },
        fail: (err) => {
          console.log("[Main] HTTP检测失败:", err.errMsg);
          getCapsuleButtonRect();
          showDebugModal.value = true;
        }
      });
    };
    const closeDebugModal = () => {
      showDebugModal.value = false;
    };
    const handleIgnoreForever = () => {
      showDebugModal.value = false;
      showIgnoreConfirmModal.value = true;
    };
    const closeIgnoreConfirmModal = () => {
      showIgnoreConfirmModal.value = false;
    };
    const confirmIgnoreForever = () => {
      common_vendor.index.setStorageSync("ignoreHttpCheck", "true");
      showIgnoreConfirmModal.value = false;
      common_vendor.index.showToast({
        title: "已永久忽略",
        icon: "none"
      });
      console.log("[Main] 用户已确认永久忽略HTTP检测");
    };
    const checkIsTablet = () => {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const width = systemInfo.windowWidth || systemInfo.screenWidth || 0;
        const height = systemInfo.windowHeight || systemInfo.screenHeight || 0;
        const newIsTablet = width / height >= TABLET_ASPECT_RATIO && width >= TABLET_MIN_WIDTH;
        if (isTablet.value !== newIsTablet) {
          isTablet.value = newIsTablet;
          console.log("[Main] 平板模式状态变化:", newIsTablet);
          common_vendor.index.$emit("tabletModeChanged", newIsTablet);
        }
        console.log("[Main] 容器:", width, "x", height, "宽高比:", (width / height).toFixed(2), "平板模式:", isTablet.value);
      } catch (e) {
        isTablet.value = false;
        console.log("[Main] 检测平板模式失败:", e);
      }
    };
    const handleWindowResize = () => {
      console.log("[Main] 窗口大小变化，重新检测平板模式");
      const wasTablet = isTablet.value;
      checkIsTablet();
      if (wasTablet && !isTablet.value) {
        console.log("[Main] 退出平板模式");
        if (subPageStack.value.length > 0) {
          console.log("[Main] 清空子页面栈");
          subPageStack.value = [];
        }
        if (currentTab.value === 4) {
          console.log("[Main] 从平板设置页退出，切换到首页");
          switchTab(0);
        }
      }
    };
    const initDarkMode = () => {
      console.log("[Main] ========== initDarkMode 开始 ==========");
      addThemeLog("initDarkMode 开始", "Main");
      let followSystem = common_vendor.index.getStorageSync("followSystem");
      console.log("[Main] initDarkMode - followSystem 原始值:", followSystem, "类型:", typeof followSystem);
      addThemeLog(`followSystem: ${followSystem}, 类型: ${typeof followSystem}`, "Main");
      if (followSystem === "" || followSystem === null || followSystem === void 0) {
        followSystem = true;
        common_vendor.index.setStorageSync("followSystem", "true");
        console.log("[Main] initDarkMode - 首次安装，默认设置 followSystem 为 true");
        addThemeLog("首次安装，默认 followSystem: true", "Main");
      }
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      console.log("[Main] initDarkMode - isFollowSystem:", isFollowSystem);
      addThemeLog(`isFollowSystem: ${isFollowSystem}`, "Main");
      if (isFollowSystem) {
        const storedDarkMode = common_vendor.index.getStorageSync("darkMode");
        const hasElectronTheme = storedDarkMode !== "" && storedDarkMode !== null && storedDarkMode !== void 0;
        if (hasElectronTheme) {
          darkMode.value = storedDarkMode === "true";
          console.log("[Main] initDarkMode - 使用 Electron 传来的主题值:", darkMode.value);
          addThemeLog(`使用 Electron 主题值: ${darkMode.value}`, "Main");
        } else {
          const systemInfo = common_vendor.index.getSystemInfoSync();
          darkMode.value = systemInfo.theme === "dark";
          console.log("[Main] initDarkMode - 跟随系统，systemInfo.theme:", systemInfo.theme, "darkMode:", darkMode.value);
          addThemeLog(`跟随系统, theme: ${systemInfo.theme}, darkMode: ${darkMode.value}`, "Main");
        }
        const currentDarkMode = common_vendor.index.getStorageSync("darkMode");
        if (currentDarkMode === "" || currentDarkMode === null || currentDarkMode === void 0) {
          common_vendor.index.setStorageSync("darkMode", darkMode.value.toString());
          console.log("[Main] initDarkMode - 首次安装，同步 darkMode 存储为:", darkMode.value);
          addThemeLog(`首次安装，同步 darkMode: ${darkMode.value}`, "Main");
        }
      } else {
        darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
        console.log("[Main] initDarkMode - 不跟随系统，darkMode:", darkMode.value);
        addThemeLog(`不跟随系统, darkMode: ${darkMode.value}`, "Main");
      }
      console.log("[Main] ========== initDarkMode 结束, 最终 darkMode:", darkMode.value, " ==========");
      addThemeLog(`initDarkMode 结束, 最终 darkMode: ${darkMode.value}`, "Main");
    };
    const checkPactAgreement = () => {
      const isAgreed = common_vendor.index.getStorageSync("isAgreePact") === "true";
      console.log("[Main] 检查许可协议:", isAgreed ? "已同意" : "未同意");
      if (!isAgreed) {
        showPactModal.value = true;
        console.log("[Main] showPactModal 已设置为 true");
      } else {
        pactAgreed.value = true;
        showPactModal.value = false;
        const agreedTime = common_vendor.index.getStorageSync("pactAgreedTime");
        if (!agreedTime) {
          const installTime = common_vendor.index.getStorageSync("appInstallTime") || Date.now();
          common_vendor.index.setStorageSync("pactAgreedTime", installTime);
          console.log("[Main] 补充保存协议同意时间:", new Date(installTime).toLocaleString());
        }
      }
    };
    const handlePactAgree = () => {
      console.log("[Main] 用户同意许可协议");
      common_vendor.index.setStorageSync("isAgreePact", "true");
      const now = Date.now();
      common_vendor.index.setStorageSync("pactAgreedTime", now);
      console.log("[Main] 协议同意时间已保存:", new Date(now).toLocaleString());
      pactAgreed.value = true;
      showPactModal.value = false;
      setTimeout(() => {
        checkAppUpdate();
      }, 500);
    };
    const handlePactReject = () => {
      console.log("[Main] 用户拒绝许可协议");
      showPactRejectModal.value = true;
    };
    const closePactRejectModal = () => {
      showPactRejectModal.value = false;
    };
    const handleShowUpdatePopup = (data) => {
      console.log("[Main] 收到更新弹窗事件:", data);
      updateInfo.value = data;
      showUpdatePopup.value = true;
    };
    const handleDebugLogStatusChanged = (data) => {
      console.log("[Main] 收到调试日志状态变化事件:", data);
      showDebugLog.value = data.show;
    };
    const closeUpdatePopup = () => {
      showUpdatePopup.value = false;
      updateInfo.value = null;
    };
    const switchTab = (index) => {
      if (currentTab.value === index) {
        console.log("[Main] switchTab 已经在当前页面，跳过:", index);
        return;
      }
      console.log("[Main] switchTab 切换到:", index, "当前:", currentTab.value);
      if (showSubPage.value) {
        console.log("[Main] 切换Tab时关闭子页面覆盖层");
        subPageStack.value = [];
      }
      if (!loadedTabs.value.includes(index)) {
        loadedTabs.value.push(index);
        console.log("[Main] 懒加载页面:", index);
      }
      currentTab.value = index;
      console.log("[Main] currentTab 已更新为:", currentTab.value);
    };
    let isPlayStateRestored = false;
    const restorePlayStateAfterTabsReady = async () => {
      var _a, _b, _c, _d, _e;
      if (isPlayStateRestored) {
        console.log("[Main] 播放状态已经恢复过，跳过");
        return;
      }
      console.log("[Main] ========== restorePlayStateAfterTabsReady 开始 ==========");
      try {
        const maxWaitTime = 1e3;
        const startTime = Date.now();
        const waitForTabsReady = () => {
          return new Promise((resolve) => {
            const check = () => {
              const homeTabReady = loadedTabs.value.includes(0);
              if (homeTabReady || Date.now() - startTime > maxWaitTime) {
                resolve(homeTabReady);
              } else {
                setTimeout(check, 50);
              }
            };
            check();
          });
        };
        const tabsReady = await waitForTabsReady();
        console.log("[Main] Tab 页面加载状态:", {
          loadedTabs: loadedTabs.value,
          tabsReady,
          waitTime: Date.now() - startTime
        });
        const playState = await store_modules_player.playerStore.restorePlayState();
        console.log("[Main] 播放器状态已恢复, playState:", playState);
        if (playState && playState.playlist && playState.playlist.length > 0) {
          console.log("[Main] 恢复播放列表到 listStore, listId:", playState.listId, "index:", playState.index);
          store_modules_player.playerStore.setState({
            playlist: playState.playlist
          });
          const currentSong = playState.currentSong;
          if (currentSong && playState.listId) {
            const isDefaultOrLove = playState.listId === "default" || playState.listId === "love";
            if (isDefaultOrLove) {
              console.log("[Main] 识别为", playState.listId === "default" ? "试听列表" : "收藏列表");
              store_modules_list.listStore.setPlayMusicInfo(playState.listId, currentSong);
              console.log("[Main] 已恢复播放信息, 歌曲:", currentSong.name);
            } else {
              console.log("[Main] 识别为临时列表或导入歌单，listId:", playState.listId);
              let extractedListId = playState.listId;
              if (playState.listId.includes("kuwo.cn/playlist_detail/")) {
                extractedListId = ((_a = playState.listId.split("playlist_detail/")[1]) == null ? void 0 : _a.split("?")[0]) || playState.listId;
                console.log("[Main] 从酷我URL提取歌单ID:", extractedListId);
              } else if (playState.listId.includes("y.qq.com/n/ryqq/playlist/")) {
                extractedListId = ((_b = playState.listId.split("playlist/")[1]) == null ? void 0 : _b.split("?")[0]) || playState.listId;
                console.log("[Main] 从QQ音乐URL提取歌单ID:", extractedListId);
              } else if (playState.listId.includes("kugou.com/yy/special/single/")) {
                extractedListId = ((_c = playState.listId.split("single/")[1]) == null ? void 0 : _c.split(".")[0]) || playState.listId;
                console.log("[Main] 从酷狗URL提取歌单ID:", extractedListId);
              } else if (playState.listId.includes("music.163.com/playlist?id=")) {
                extractedListId = ((_d = playState.listId.split("id=")[1]) == null ? void 0 : _d.split("&")[0]) || playState.listId;
                console.log("[Main] 从网易云URL提取歌单ID:", extractedListId);
              } else if (playState.listId.includes("music.migu.cn/v3/music/playlist/")) {
                extractedListId = ((_e = playState.listId.split("playlist/")[1]) == null ? void 0 : _e.split("?")[0]) || playState.listId;
                console.log("[Main] 从咪咕URL提取歌单ID:", extractedListId);
              }
              let isImportedPlaylist = false;
              let importedPlaylistInfo = null;
              try {
                const importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
                const found = importedPlaylists.find((p) => p.id === extractedListId || p.id === playState.listId);
                if (found) {
                  isImportedPlaylist = true;
                  importedPlaylistInfo = found;
                  console.log("[Main] 是导入的歌单，ID:", extractedListId);
                }
              } catch (e) {
                console.error("[Main] 检查导入歌单失败:", e);
              }
              let playlistLink = "";
              try {
                const playListHistory = store_modules_player.playerStore.getState().playListHistory || [];
                const historyItem = playListHistory.find((p) => p.id === extractedListId || p.id === playState.listId);
                if (historyItem && historyItem.link) {
                  playlistLink = historyItem.link;
                  console.log("[Main] 从最近播放歌单历史中找到 link:", playlistLink);
                }
              } catch (e) {
                console.error("[Main] 查找最近播放歌单历史失败:", e);
              }
              store_modules_list.listStore.setTempList("temp", playState.playlist, {
                id: extractedListId,
                // 使用提取的真实歌单ID
                name: (importedPlaylistInfo == null ? void 0 : importedPlaylistInfo.name) || "临时列表",
                source: isImportedPlaylist ? "imported" : "temp",
                link: playlistLink || (importedPlaylistInfo == null ? void 0 : importedPlaylistInfo.link) || playState.listId
                // 添加 link 字段用于匹配最近播放歌单
              });
              store_modules_list.listStore.setPlayMusicInfo("temp", currentSong);
              console.log("[Main] 已恢复临时列表到 listStore, meta.id:", extractedListId, "meta.link:", playlistLink || playState.listId, "歌曲:", currentSong.name);
            }
          }
        } else {
          console.log("[Main] 没有播放列表需要恢复");
        }
        isPlayStateRestored = true;
        console.log("[Main] ========== restorePlayStateAfterTabsReady 完成 ==========");
      } catch (error) {
        console.error("[Main] 恢复播放状态失败:", error);
      }
    };
    const onSwiperChange = (e) => {
      const index = e.detail.current;
      console.log("[Main] onSwiperChange 滑动到:", index);
      if (currentTab.value !== index) {
        currentTab.value = index;
        if (!loadedTabs.value.includes(index)) {
          loadedTabs.value.push(index);
          console.log("[Main] 懒加载页面:", index);
        }
      }
    };
    const handleGlobalSwitchTab = (data) => {
      console.log("[Main] 收到全局切换事件:", data);
      switchTab(data.index);
    };
    const handleIndexNavigate = (data) => {
      console.log("[Main] 收到首页导航事件:", data, "当前平板模式:", isTablet.value);
      if (!isTablet.value) {
        console.log("[Main] 非平板模式，忽略导航事件");
        return;
      }
      subPageStack.value.push(data.url);
      console.log("[Main] 子页面栈更新:", [...subPageStack.value], "当前显示URL:", data.url);
    };
    const handlePlaylistNavigate = (data) => {
      console.log("[Main] 收到播放列表导航事件:", data, "当前平板模式:", isTablet.value);
      if (!isTablet.value) {
        console.log("[Main] 非平板模式，忽略导航事件");
        return;
      }
      subPageStack.value.push(data.url);
      console.log("[Main] 子页面栈更新:", [...subPageStack.value], "当前显示URL:", data.url);
    };
    const handleMyNavigate = (data) => {
      console.log("[Main] 收到我的音乐导航事件:", data, "当前平板模式:", isTablet.value);
      if (!isTablet.value) {
        console.log("[Main] 非平板模式，忽略导航事件");
        return;
      }
      subPageStack.value.push(data.url);
      console.log("[Main] 子页面栈更新:", [...subPageStack.value], "当前显示URL:", data.url);
    };
    const handleSettingsNavigate = (data) => {
      console.log("[Main] 收到设置页导航事件:", data, "当前平板模式:", isTablet.value);
      if (!isTablet.value) {
        console.log("[Main] 非平板模式，忽略导航事件");
        return;
      }
      subPageStack.value.push(data.url);
      console.log("[Main] 子页面栈更新:", [...subPageStack.value], "当前显示URL:", data.url);
    };
    const closeSubPage = () => {
      if (subPageStack.value.length > 0) {
        subPageStack.value.pop();
        console.log("[Main] 关闭子页面，剩余栈:", [...subPageStack.value]);
      }
    };
    const getSubPageParams = () => {
      if (!currentSubPageUrl.value)
        return {};
      const params = {};
      const urlParts = currentSubPageUrl.value.split("?");
      if (urlParts.length > 1) {
        const queryString = urlParts[1];
        const pairs = queryString.split("&");
        pairs.forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key && value) {
            try {
              params[key] = decodeURIComponent(value);
            } catch (e) {
              params[key] = value;
            }
          }
        });
      }
      return params;
    };
    const handleThemeChange = (data) => {
      console.log("[Main] ========== handleThemeChange 开始 ==========");
      console.log("[Main] 收到主题变化事件:", data);
      addThemeLog(`收到主题变化: ${JSON.stringify(data)}`, "Main");
      if (data && typeof data.isDark === "boolean") {
        darkMode.value = data.isDark;
        console.log("[Main] 已更新 darkMode:", data.isDark);
        addThemeLog(`已更新 darkMode: ${data.isDark}`, "Main");
        common_vendor.index.$emit("themeChanged", { isDark: data.isDark });
        console.log("[Main] 已广播 themeChanged 给子组件");
        addThemeLog("已广播 themeChanged 给子组件", "Main");
      }
      console.log("[Main] ========== handleThemeChange 结束 ==========");
    };
    const handleThemeLogAdded = (data) => {
      if (data && data.log) {
        themeLogs.value.unshift(data.log);
        if (themeLogs.value.length > 300) {
          themeLogs.value.pop();
        }
      }
    };
    const checkAndBroadcastTheme = () => {
      console.log("[Main] ========== checkAndBroadcastTheme 开始 ==========");
      let isDark = common_vendor.index.getStorageSync("darkMode") === "true";
      darkMode.value = isDark;
      console.log("[Main] checkAndBroadcastTheme - 已更新 darkMode:", isDark);
      console.log("[Main] ========== checkAndBroadcastTheme 结束 ==========");
    };
    common_vendor.onShow(() => {
      console.log("[Main] 页面显示");
      checkAndBroadcastTheme();
      setTimeout(() => {
        console.log("[Main] 开始设置状态栏文字颜色为黑色");
        utils_system.setStatusBarTextColor("black");
      }, 300);
    });
    const promptImportScripts = () => {
      if (isImportScriptsPrompting.value)
        return;
      isImportScriptsPrompting.value = true;
      common_vendor.index.showModal({
        title: "需要导入音源插件",
        content: "播放器仅提供播放能力，不提供歌曲资源及歌曲信息，是否前往导入？",
        confirmText: "前往导入",
        cancelText: "取消",
        success: (res) => {
          isImportScriptsPrompting.value = false;
          if (res.confirm) {
            if (isTablet.value) {
              subPageStack.value.push("/pages/music-sources/index");
            } else {
              common_vendor.index.navigateTo({ url: "/pages/music-sources/index" });
            }
          }
        },
        fail: () => {
          isImportScriptsPrompting.value = false;
        }
      });
    };
    const checkMeshModeSelection = () => {
      if (showMeshModeModal.value) {
        console.log("[Main] 弹窗已显示，跳过检查");
        return;
      }
      const mode = utils_config.getMeshMode();
      if (!mode) {
        console.log("[Main] 未选择 Mesh 模式，显示选择弹窗");
        showMeshModeModal.value = true;
        return;
      }
      console.log("[Main] 已有 Mesh 模式:", mode);
      if (mode === "own") {
        if (!utils_config.hasOwnServer()) {
          console.log("[Main] own 模式但未设置服务器地址，显示选择弹窗");
          showMeshModeModal.value = true;
          return;
        }
        checkDonationPrompt();
      } else if (mode === "free") {
        if (!utils_config.hasLocalScripts()) {
          console.log("[Main] free 模式但无本地脚本，提示导入脚本");
          promptImportScripts();
        } else {
          console.log("[Main] free 模式，本地脚本已就绪");
          checkServerDeployGuide();
        }
      }
    };
    const selectMeshMode = (mode) => {
      console.log("[Main] 用户选择 Mesh 模式:", mode);
      utils_config.setMeshMode(mode);
      showMeshModeModal.value = false;
      if (mode === "own") {
        if (isTablet.value) {
          switchTab(4);
          setTimeout(() => {
            common_vendor.index.$emit("openServerModal");
          }, 500);
        } else {
          common_vendor.index.navigateTo({
            url: "/pages/settings/index",
            success: () => {
              setTimeout(() => {
                common_vendor.index.$emit("openServerModal");
              }, 500);
            }
          });
        }
      } else if (mode === "free") {
        if (!utils_config.hasLocalScripts()) {
          common_vendor.index.showModal({
            title: "需要导入音源插件",
            content: "播放器仅提供播放能力，不提供歌曲资源及歌曲信息，是否前往导入？",
            success: (res) => {
              if (res.confirm) {
                if (isTablet.value) {
                  subPageStack.value.push("/pages/music-sources/index");
                } else {
                  common_vendor.index.navigateTo({ url: "/pages/music-sources/index" });
                }
              }
            }
          });
        } else {
          if (isTablet.value) {
            switchTab(4);
            setTimeout(() => {
              common_vendor.index.$emit("openFreeNodesModal");
            }, 500);
          } else {
            common_vendor.index.navigateTo({
              url: "/pages/settings/index",
              success: () => {
                setTimeout(() => {
                  common_vendor.index.$emit("openFreeNodesModal");
                }, 500);
              }
            });
          }
        }
      }
    };
    const dismissMeshModal = () => {
      console.log("[Main] 首次选择弹窗不可关闭");
    };
    const showCopyToast = common_vendor.ref(false);
    const copyToastText = common_vendor.ref("");
    let copyToastTimer = null;
    const showCustomToast = (text) => {
      copyToastText.value = text;
      showCopyToast.value = true;
      if (copyToastTimer)
        clearTimeout(copyToastTimer);
      copyToastTimer = setTimeout(() => {
        showCopyToast.value = false;
      }, 2500);
    };
    const copyDeployTutorial = () => {
      const tutorialUrl = "https://github.com/erikjamesgz/cf_phg_music_server";
      console.log("[Main] 复制部署教程链接:", tutorialUrl);
      common_vendor.index.setClipboardData({
        data: tutorialUrl,
        showToast: false,
        success: () => {
          console.log("[Main] 链接已复制到剪贴板");
          showCustomToast("链接已复制，请在浏览器打开");
        },
        fail: (err) => {
          console.error("[Main] 复制失败:", err);
          showCustomToast("复制失败，请手动复制");
        }
      });
    };
    const checkDonationPrompt = async () => {
      try {
        const donated = common_vendor.index.getStorageSync("share_donated");
        if (donated) {
          console.log("[Main] 用户已共享，跳过引导");
          return;
        }
        const lastPrompt = common_vendor.index.getStorageSync("last_donation_prompt") || 0;
        const sevenDays = 7 * 24 * 60 * 60 * 1e3;
        if (Date.now() - lastPrompt < sevenDays) {
          console.log("[Main] 距上次弹窗不足7天，跳过");
          return;
        }
        const installTime = common_vendor.index.getStorageSync("appInstallTime");
        if (installTime && Date.now() - parseInt(installTime) < 24 * 60 * 60 * 1e3) {
          console.log("[Main] 首次安装当天，跳过共享引导");
          return;
        }
        const donationShownCount = common_vendor.index.getStorageSync("donation_prompt_shown_count") || 0;
        if (donationShownCount >= 3) {
          const lastMonthlyPrompt = common_vendor.index.getStorageSync("last_donation_monthly_prompt") || 0;
          const oneMonth = 30 * 24 * 60 * 60 * 1e3;
          if (Date.now() - lastMonthlyPrompt < oneMonth) {
            console.log("[Main] 共享引导已弹超过3次，月内不重复，跳过");
            return;
          }
        }
        const origin = utils_config.getServerOrigin();
        const apiKey = utils_config.getApiKey();
        if (!origin || !apiKey) {
          console.log("[Main] 无法解析服务器地址，跳过共享引导");
          return;
        }
        const statusUrl = `${origin}/owner/${apiKey}/status`;
        console.log("[Main] 查询服务器使用量:", statusUrl);
        common_vendor.index.request({
          url: statusUrl,
          method: "GET",
          timeout: 8e3,
          success: (res) => {
            var _a, _b;
            if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_b = res.data) == null ? void 0 : _b.data)) {
              const data = res.data.data;
              console.log("[Main] 服务器状态:", data);
              const remainingRatio = data.daily_limit > 0 ? data.remaining / data.daily_limit : 0;
              if (remainingRatio > 0.8) {
                console.log("[Main] 剩余配额较多（" + (remainingRatio * 100).toFixed(0) + "%），显示共享引导");
                donationStats.value = {
                  remaining: 1e5 - (data.current_usage || 0),
                  used: data.current_usage,
                  total: 1e5
                };
                showDonationPromptModal.value = true;
                const newCount = donationShownCount + 1;
                common_vendor.index.setStorageSync("donation_prompt_shown_count", newCount);
                if (newCount > 3) {
                  common_vendor.index.setStorageSync("last_donation_monthly_prompt", Date.now());
                }
              } else {
                console.log("[Main] 剩余配额不多，跳过共享引导");
              }
            }
          },
          fail: (err) => {
            console.log("[Main] 查询服务器状态失败:", err.errMsg);
          }
        });
      } catch (e) {
        console.error("[Main] 检查共享引导异常:", e);
      }
    };
    const dismissDonationPrompt = () => {
      showDonationPromptModal.value = false;
      common_vendor.index.setStorageSync("last_donation_prompt", Date.now());
      console.log("[Main] 用户关闭共享引导弹窗");
    };
    const goToDonationSettings = () => {
      showDonationPromptModal.value = false;
      common_vendor.index.setStorageSync("last_donation_prompt", Date.now());
      if (isTablet.value) {
        switchTab(4);
        setTimeout(() => {
          common_vendor.index.$emit("openShareManagement");
        }, 500);
      } else {
        common_vendor.index.navigateTo({
          url: "/pages/settings/index",
          success: () => {
            setTimeout(() => {
              common_vendor.index.$emit("openShareManagement");
            }, 500);
          }
        });
      }
    };
    const checkServerDeployGuide = () => {
      var _a, _b, _c, _d;
      if (utils_config.getMeshMode() !== "free")
        return;
      if (utils_config.hasOwnServer())
        return;
      let freeStartDate = common_vendor.index.getStorageSync("free_mode_start_date");
      if (!freeStartDate) {
        freeStartDate = Date.now();
        common_vendor.index.setStorageSync("free_mode_start_date", freeStartDate);
      }
      const daysUsingFree = Math.floor((Date.now() - parseInt(freeStartDate)) / (24 * 3600 * 1e3));
      if (daysUsingFree < 3) {
        console.log("[Main] free模式未满3天，跳过部署引导");
        return;
      }
      const lastDismissed = common_vendor.index.getStorageSync("server_guide_dismissed_at");
      if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 3600 * 1e3) {
        console.log("[Main] 7天内已关闭过部署引导，跳过");
        return;
      }
      const shownCount = common_vendor.index.getStorageSync("server_guide_shown_count") || 0;
      if (shownCount >= 3) {
        const lastMonthlyGuide = common_vendor.index.getStorageSync("last_server_guide_monthly_prompt") || 0;
        const oneMonth = 30 * 24 * 60 * 60 * 1e3;
        if (Date.now() - lastMonthlyGuide < oneMonth) {
          console.log("[Main] 部署引导已弹过3次，月内不重复，跳过");
          return;
        }
      }
      const listenCount = ((_d = (_c = (_b = (_a = store_modules_user.userStore) == null ? void 0 : _a.getState) == null ? void 0 : _b.call(_a)) == null ? void 0 : _c.stats) == null ? void 0 : _d.listenCount) || 0;
      serverGuideSongCount.value = listenCount;
      utils_mesh_meshConfig.getNodeList(false).then((nodes) => {
        serverGuideHelperCount.value = nodes ? nodes.length : 0;
      }).catch(() => {
        serverGuideHelperCount.value = 0;
      });
      showServerGuideModal.value = true;
      const newCount = shownCount + 1;
      common_vendor.index.setStorageSync("server_guide_shown_count", newCount);
      if (newCount > 3) {
        common_vendor.index.setStorageSync("last_server_guide_monthly_prompt", Date.now());
      }
      console.log("[Main] 显示部署服务器引导弹窗，第", newCount, "次");
    };
    const dismissServerGuide = () => {
      showServerGuideModal.value = false;
      common_vendor.index.setStorageSync("server_guide_dismissed_at", Date.now());
      console.log("[Main] 用户关闭部署引导弹窗");
    };
    const goToServerDeploy = () => {
      showServerGuideModal.value = false;
      common_vendor.index.setStorageSync("server_guide_dismissed_at", Date.now());
      if (isTablet.value) {
        switchTab(4);
        setTimeout(() => {
          common_vendor.index.$emit("openServerModal");
        }, 500);
      } else {
        common_vendor.index.navigateTo({
          url: "/pages/settings/index",
          success: () => {
            setTimeout(() => {
              common_vendor.index.$emit("openServerModal");
            }, 500);
          }
        });
      }
    };
    common_vendor.onMounted(() => {
      console.log("[Main] 主页面初始化");
      checkIsTablet();
      common_vendor.index.$emit("tabletModeChanged", isTablet.value);
      showDebugLog.value = common_vendor.index.getStorageSync("showDebugLog") === "true";
      console.log("[Main] 调试日志显示状态:", showDebugLog.value);
      initDarkMode();
      checkPactAgreement();
      checkMeshModeSelection();
      common_vendor.index.$on("checkMeshModeBeforeRequest", () => {
        const mode = utils_config.getMeshMode();
        if (!mode) {
          showMeshModeModal.value = true;
          return;
        }
        if (mode === "own") {
          if (!utils_config.hasOwnServer()) {
            showMeshModeModal.value = true;
          }
        } else if (mode === "free") {
          if (!utils_config.hasLocalScripts()) {
            promptImportScripts();
          }
        }
      });
      common_vendor.index.$on("my-open-share-management", () => {
        console.log("[Main] 收到打开分享管理请求");
        if (isTablet.value) {
          switchTab(4);
          setTimeout(() => {
            common_vendor.index.$emit("openShareManagement");
          }, 300);
        }
      });
      common_vendor.index.$on("needImportScripts", () => {
        console.log("[Main] 收到 needImportScripts 事件，提示用户导入音源插件");
        promptImportScripts();
      });
      checkHttpAccess();
      setTimeout(() => {
        checkAppUpdate();
      }, 1e3);
      common_vendor.index.$on("main-switch-tab", handleGlobalSwitchTab);
      console.log("[Main] 已注册全局事件监听: main-switch-tab");
      common_vendor.index.$on("index-navigate", handleIndexNavigate);
      console.log("[Main] 已注册首页导航监听: index-navigate");
      common_vendor.index.$on("playlist-navigate", handlePlaylistNavigate);
      console.log("[Main] 已注册播放列表导航监听: playlist-navigate");
      common_vendor.index.$on("my-navigate", handleMyNavigate);
      console.log("[Main] 已注册我的音乐导航监听: my-navigate");
      common_vendor.index.$on("settings-navigate", handleSettingsNavigate);
      console.log("[Main] 已注册设置页导航监听: settings-navigate");
      common_vendor.index.$on("systemThemeChange", handleThemeChange);
      console.log("[Main] 已注册主题变化监听: systemThemeChange");
      common_vendor.index.$on("themeLogAdded", handleThemeLogAdded);
      console.log("[Main] 已注册子组件日志监听: themeLogAdded");
      common_vendor.index.$on("showUpdatePopup", handleShowUpdatePopup);
      console.log("[Main] 已注册更新弹窗监听: showUpdatePopup");
      common_vendor.index.$on("debugLogStatusChanged", handleDebugLogStatusChanged);
      console.log("[Main] 已注册调试日志状态变化监听: debugLogStatusChanged");
      common_vendor.index.onWindowResize(handleWindowResize);
      console.log("[Main] 已注册窗口大小变化监听");
      common_vendor.index.$on("switchToSettingsTab", () => {
        console.log("[Main] 收到切换到设置tab的事件");
        if (isTablet.value) {
          switchTab(4);
        }
      });
      console.log("[Main] 已注册切换到设置tab监听: switchToSettingsTab");
      common_vendor.index.$on("navigateToAIRecommend", () => {
        console.log("[Main] 收到导航到AI推荐页面的事件");
        if (isTablet.value) {
          subPageStack.value.push("/pages/ai-recommend/index");
          showSubPage.value = true;
        } else {
          common_vendor.index.navigateTo({ url: "/pages/ai-recommend/index" });
        }
      });
      console.log("[Main] 已注册导航到AI推荐页面监听: navigateToAIRecommend");
      setTimeout(() => {
        restorePlayStateAfterTabsReady();
      }, 500);
    });
    const checkAppUpdate = async () => {
      const isAgreed = common_vendor.index.getStorageSync("isAgreePact") === "true";
      if (!isAgreed) {
        console.log("[Main] 用户未同意协议，跳过检查更新");
        return;
      }
      console.log("[Main] 开始检查应用更新...");
      try {
        const result = await utils_version.checkUpdateAndShow(true);
        if (result.hasUpdate) {
          console.log("[Main] 发现新版本:", result.versionInfo.version);
        } else {
          console.log("[Main] 当前已是最新版本");
        }
      } catch (error) {
        console.error("[Main] 检查更新失败:", error);
      }
    };
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("main-switch-tab", handleGlobalSwitchTab);
      common_vendor.index.$off("index-navigate", handleIndexNavigate);
      common_vendor.index.$off("playlist-navigate", handlePlaylistNavigate);
      common_vendor.index.$off("my-navigate", handleMyNavigate);
      common_vendor.index.$off("settings-navigate", handleSettingsNavigate);
      common_vendor.index.$off("systemThemeChange", handleThemeChange);
      common_vendor.index.$off("themeChanged", handleThemeChange);
      common_vendor.index.$off("showUpdatePopup", handleShowUpdatePopup);
      common_vendor.index.$off("debugLogStatusChanged", handleDebugLogStatusChanged);
      common_vendor.index.$off("switchToSettingsTab");
      common_vendor.index.$off("navigateToAIRecommend");
      common_vendor.index.$off("checkMeshModeBeforeRequest");
      common_vendor.index.$off("my-open-share-management");
      common_vendor.index.$off("needImportScripts");
      common_vendor.index.offWindowResize(handleWindowResize);
      console.log("[Main] 已移除全局事件监听");
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      return common_vendor.e({
        a: common_vendor.o(handlePactAgree, "ff"),
        b: common_vendor.o(handlePactReject, "ef"),
        c: common_vendor.p({
          visible: showPactModal.value,
          isAgreed: pactAgreed.value
        }),
        d: showPactRejectModal.value
      }, showPactRejectModal.value ? {
        e: darkMode.value ? 1 : "",
        f: darkMode.value ? 1 : "",
        g: common_vendor.o(closePactRejectModal, "ce"),
        h: darkMode.value ? 1 : "",
        i: common_vendor.o(() => {
        }, "c0"),
        j: common_vendor.o(closePactRejectModal, "bd")
      } : {}, {
        k: common_vendor.o(closeUpdatePopup, "d8"),
        l: common_vendor.p({
          visible: showUpdatePopup.value,
          ["update-info"]: updateInfo.value,
          ["dark-mode"]: darkMode.value
        }),
        m: showDebugModal.value
      }, showDebugModal.value ? {
        n: common_vendor.p({
          type: "fas",
          name: "arrow-up",
          size: 40,
          color: "#ffffff"
        }),
        o: capsuleButton.value.left + capsuleButton.value.width / 2 - 20 + "px",
        p: capsuleButton.value.top + capsuleButton.value.height + 8 + "px",
        q: darkMode.value ? 1 : "",
        r: darkMode.value ? 1 : "",
        s: darkMode.value ? 1 : "",
        t: common_vendor.o(handleIgnoreForever, "be"),
        v: common_vendor.o(closeDebugModal, "a0"),
        w: darkMode.value ? 1 : "",
        x: common_vendor.o(() => {
        }, "5f"),
        y: common_vendor.o(closeDebugModal, "9d")
      } : {}, {
        z: showIgnoreConfirmModal.value
      }, showIgnoreConfirmModal.value ? {
        A: darkMode.value ? 1 : "",
        B: darkMode.value ? 1 : "",
        C: common_vendor.o(closeIgnoreConfirmModal, "d9"),
        D: common_vendor.o(confirmIgnoreForever, "26"),
        E: darkMode.value ? 1 : "",
        F: common_vendor.o(() => {
        }, "7f"),
        G: common_vendor.o(closeIgnoreConfirmModal, "ae")
      } : {}, {
        H: loadedTabs.value.includes(0)
      }, loadedTabs.value.includes(0) ? {
        I: common_vendor.p({
          ["is-active"]: currentTab.value === 0
        })
      } : {}, {
        J: loadedTabs.value.includes(1)
      }, loadedTabs.value.includes(1) ? {
        K: common_vendor.p({
          ["is-active"]: currentTab.value === 1
        })
      } : {}, {
        L: loadedTabs.value.includes(2)
      }, loadedTabs.value.includes(2) ? {
        M: common_vendor.p({
          ["is-active"]: currentTab.value === 2
        })
      } : {}, {
        N: loadedTabs.value.includes(3)
      }, loadedTabs.value.includes(3) ? {
        O: common_vendor.p({
          ["is-active"]: currentTab.value === 3
        })
      } : {}, {
        P: isTablet.value
      }, isTablet.value ? common_vendor.e({
        Q: loadedTabs.value.includes(4)
      }, loadedTabs.value.includes(4) ? {
        R: common_vendor.p({
          ["is-active"]: currentTab.value === 4
        })
      } : {}) : {}, {
        S: isTablet.value ? 1 : "",
        T: currentTab.value,
        U: common_vendor.o(onSwiperChange, "f4"),
        V: isTablet.value ? 0 : 300,
        W: isTablet.value,
        X: showSubPage.value && isTablet.value
      }, showSubPage.value && isTablet.value ? common_vendor.e({
        Y: (_a = currentSubPageUrl.value) == null ? void 0 : _a.includes("/pages/sharelist/index")
      }, ((_b = currentSubPageUrl.value) == null ? void 0 : _b.includes("/pages/sharelist/index")) ? {
        Z: common_vendor.o(closeSubPage, "bc"),
        aa: common_vendor.p({
          ["url-params"]: getSubPageParams()
        })
      } : ((_c = currentSubPageUrl.value) == null ? void 0 : _c.includes("/pages/rank/index")) ? {
        ac: common_vendor.o(closeSubPage, "71"),
        ad: common_vendor.p({
          ["url-params"]: getSubPageParams()
        })
      } : ((_d = currentSubPageUrl.value) == null ? void 0 : _d.includes("/pages/songlist-list/index")) ? {
        af: common_vendor.o(closeSubPage, "26"),
        ag: common_vendor.p({
          ["url-params"]: getSubPageParams()
        })
      } : ((_e = currentSubPageUrl.value) == null ? void 0 : _e.includes("/pages/music-sources/index")) ? {
        ai: common_vendor.o(closeSubPage, "4a")
      } : ((_f = currentSubPageUrl.value) == null ? void 0 : _f.includes("/pages/ai-recommend/index")) ? {
        ak: common_vendor.o(closeSubPage, "c5")
      } : {}, {
        ab: (_g = currentSubPageUrl.value) == null ? void 0 : _g.includes("/pages/rank/index"),
        ae: (_h = currentSubPageUrl.value) == null ? void 0 : _h.includes("/pages/songlist-list/index"),
        ah: (_i = currentSubPageUrl.value) == null ? void 0 : _i.includes("/pages/music-sources/index"),
        aj: (_j = currentSubPageUrl.value) == null ? void 0 : _j.includes("/pages/ai-recommend/index"),
        al: darkMode.value ? 1 : ""
      }) : {}, {
        am: common_vendor.o(switchTab, "b3"),
        an: common_vendor.p({
          ["current-index"]: currentTab.value,
          ["is-tablet"]: isTablet.value
        }),
        ao: showDebugLog.value
      }, showDebugLog.value ? common_vendor.e({
        ap: isTablet.value
      }, isTablet.value ? {
        aq: common_vendor.p({
          type: "fas",
          name: "copy",
          size: "14",
          color: darkMode.value ? "#9ca3af" : "#6b7280"
        }),
        ar: common_vendor.o(copyDebugLogs, "68")
      } : {}, {
        as: common_vendor.p({
          type: "fas",
          name: debugPanelExpanded.value ? "chevron-down" : "chevron-up",
          size: "14",
          color: darkMode.value ? "#9ca3af" : "#6b7280"
        }),
        at: debugPanelExpanded.value
      }, debugPanelExpanded.value ? {
        av: common_vendor.t(debugInfo.value.followSystem),
        aw: common_vendor.t(debugInfo.value.followSystemType),
        ax: common_vendor.t(debugInfo.value.isFollowSystem),
        ay: common_vendor.n(debugInfo.value.isFollowSystem ? "success" : "warning"),
        az: common_vendor.t(debugInfo.value.darkModeStorage),
        aA: common_vendor.t(debugInfo.value.systemTheme),
        aB: common_vendor.t(darkMode.value),
        aC: common_vendor.n(darkMode.value ? "dark" : "light"),
        aD: common_vendor.t(debugInfo.value.platform),
        aE: common_vendor.t(debugInfo.value.appTheme),
        aF: common_vendor.t(debugInfo.value.isFirstInstall),
        aG: common_vendor.n(debugInfo.value.isFirstInstall ? "success" : ""),
        aH: common_vendor.t(debugInfo.value.appLaunchTime),
        aI: common_vendor.t(themeLogs.value.length),
        aJ: common_vendor.f(themeLogs.value, (log, index, i0) => {
          return {
            a: common_vendor.t(log),
            b: index
          };
        }),
        aK: common_vendor.o(onDebugLogsWheel, "11"),
        aL: common_vendor.o(refreshDebugInfo, "11"),
        aM: common_vendor.o(clearThemeLogs, "85"),
        aN: common_vendor.o(() => {
        }, "89")
      } : {}, {
        aO: darkMode.value ? 1 : "",
        aP: debugPanelExpanded.value ? 1 : "",
        aQ: isTablet.value ? 1 : "",
        aR: common_vendor.o(toggleDebugPanel, "d7")
      }) : {}, {
        aS: showMeshModeModal.value
      }, showMeshModeModal.value ? {
        aT: darkMode.value ? 1 : "",
        aU: darkMode.value ? 1 : "",
        aV: common_vendor.p({
          type: "fas",
          name: "server",
          size: "22",
          color: "#e2e8f0"
        }),
        aW: darkMode.value ? 1 : "",
        aX: darkMode.value ? 1 : "",
        aY: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "14",
          color: "#9ca3af"
        }),
        aZ: darkMode.value ? 1 : "",
        ba: common_vendor.o(($event) => selectMeshMode("own"), "91"),
        bb: common_vendor.p({
          type: "fas",
          name: "globe",
          size: "22",
          color: "#e2e8f0"
        }),
        bc: darkMode.value ? 1 : "",
        bd: darkMode.value ? 1 : "",
        be: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "14",
          color: "#9ca3af"
        }),
        bf: darkMode.value ? 1 : "",
        bg: common_vendor.o(($event) => selectMeshMode("free"), "d0"),
        bh: darkMode.value ? 1 : "",
        bi: darkMode.value ? 1 : "",
        bj: common_vendor.o(copyDeployTutorial, "c2"),
        bk: darkMode.value ? 1 : "",
        bl: isTablet.value ? 1 : "",
        bm: common_vendor.o(() => {
        }, "bc"),
        bn: isTablet.value ? 1 : "",
        bo: common_vendor.o(dismissMeshModal, "76")
      } : {}, {
        bp: showDonationPromptModal.value
      }, showDonationPromptModal.value ? {
        bq: common_vendor.p({
          type: "fas",
          name: "heart",
          size: "24",
          color: "#e2e8f0"
        }),
        br: darkMode.value ? 1 : "",
        bs: darkMode.value ? 1 : "",
        bt: darkMode.value ? 1 : "",
        bv: common_vendor.t(donationStats.value.remaining),
        bw: darkMode.value ? 1 : "",
        bx: darkMode.value ? 1 : "",
        by: common_vendor.t(donationStats.value.used),
        bz: common_vendor.t(donationStats.value.total),
        bA: darkMode.value ? 1 : "",
        bB: darkMode.value ? 1 : "",
        bC: darkMode.value ? 1 : "",
        bD: darkMode.value ? 1 : "",
        bE: darkMode.value ? 1 : "",
        bF: darkMode.value ? 1 : "",
        bG: darkMode.value ? 1 : "",
        bH: darkMode.value ? 1 : "",
        bI: darkMode.value ? 1 : "",
        bJ: common_vendor.o(dismissDonationPrompt, "17"),
        bK: common_vendor.o(goToDonationSettings, "db"),
        bL: darkMode.value ? 1 : "",
        bM: common_vendor.o(() => {
        }, "8a"),
        bN: common_vendor.o(dismissDonationPrompt, "02")
      } : {}, {
        bO: showServerGuideModal.value
      }, showServerGuideModal.value ? {
        bP: common_vendor.p({
          type: "fas",
          name: "server",
          size: "24",
          color: "#e2e8f0"
        }),
        bQ: darkMode.value ? 1 : "",
        bR: darkMode.value ? 1 : "",
        bS: common_vendor.t(serverGuideSongCount.value),
        bT: common_vendor.t(serverGuideHelperCount.value),
        bU: darkMode.value ? 1 : "",
        bV: darkMode.value ? 1 : "",
        bW: darkMode.value ? 1 : "",
        bX: darkMode.value ? 1 : "",
        bY: darkMode.value ? 1 : "",
        bZ: darkMode.value ? 1 : "",
        ca: common_vendor.o(dismissServerGuide, "9d"),
        cb: common_vendor.o(goToServerDeploy, "e4"),
        cc: darkMode.value ? 1 : "",
        cd: common_vendor.o(() => {
        }, "41"),
        ce: common_vendor.o(dismissServerGuide, "e9")
      } : {}, {
        cf: showCopyToast.value
      }, showCopyToast.value ? {
        cg: common_vendor.t(copyToastText.value)
      } : {}, {
        ch: darkMode.value ? 1 : "",
        ci: isTablet.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-55921151"]]);
wx.createPage(MiniProgramPage);
