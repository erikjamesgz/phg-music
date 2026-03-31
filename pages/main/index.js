"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_version = require("../../utils/version.js");
const utils_system = require("../../utils/system.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  (PactModal + UpdateModal + _easycom_roc_icon_plus + IndexPage + SearchPage + PlaylistPage + MyPage + MiniPlayer + CustomTabBar)();
}
const IndexPage = () => "../index/index2.js";
const SearchPage = () => "../search/index2.js";
const PlaylistPage = () => "../playlist/index2.js";
const MyPage = () => "../my/index2.js";
const MiniPlayer = () => "../../components/player/MiniPlayer.js";
const CustomTabBar = () => "../../components/common/CustomTabBar.js";
const PactModal = () => "../../components/common/PactModal.js";
const UpdateModal = () => "../../components/common/UpdateModal.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const currentTab = common_vendor.ref(0);
    const loadedTabs = common_vendor.ref([0]);
    const darkMode = common_vendor.ref(false);
    const showPactModal = common_vendor.ref(false);
    const showUpdatePopup = common_vendor.ref(false);
    const updateInfo = common_vendor.ref(null);
    const pactAgreed = common_vendor.ref(false);
    const showDebugModal = common_vendor.ref(false);
    const showIgnoreConfirmModal = common_vendor.ref(false);
    const capsuleButton = common_vendor.ref({
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });
    const showDebugLog = common_vendor.ref(false);
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
    const addThemeLog = (log) => {
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      themeLogs.value.unshift(`[${time}] ${log}`);
      if (themeLogs.value.length > 200) {
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
      addThemeLog("刷新调试信息");
    };
    const toggleDebugPanel = () => {
      debugPanelExpanded.value = !debugPanelExpanded.value;
      if (debugPanelExpanded.value) {
        refreshDebugInfo();
      }
    };
    const clearThemeLogs = () => {
      themeLogs.value = [];
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
    const initDarkMode = () => {
      console.log("[Main] ========== initDarkMode 开始 ==========");
      addThemeLog("initDarkMode 开始");
      let followSystem = common_vendor.index.getStorageSync("followSystem");
      console.log("[Main] initDarkMode - followSystem 原始值:", followSystem, "类型:", typeof followSystem);
      addThemeLog(`followSystem: ${followSystem}, 类型: ${typeof followSystem}`);
      if (followSystem === "" || followSystem === null || followSystem === void 0) {
        followSystem = true;
        common_vendor.index.setStorageSync("followSystem", "true");
        console.log("[Main] initDarkMode - 首次安装，默认设置 followSystem 为 true");
        addThemeLog("首次安装，默认 followSystem: true");
      }
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      console.log("[Main] initDarkMode - isFollowSystem:", isFollowSystem);
      addThemeLog(`isFollowSystem: ${isFollowSystem}`);
      if (isFollowSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const isDark = systemInfo.theme === "dark";
        darkMode.value = isDark;
        const currentDarkMode = common_vendor.index.getStorageSync("darkMode");
        if (currentDarkMode === "" || currentDarkMode === null || currentDarkMode === void 0) {
          common_vendor.index.setStorageSync("darkMode", isDark.toString());
          console.log("[Main] initDarkMode - 首次安装，同步 darkMode 存储为:", isDark);
          addThemeLog(`首次安装，同步 darkMode: ${isDark}`);
        }
        console.log("[Main] initDarkMode - 跟随系统，systemInfo.theme:", systemInfo.theme, "darkMode:", darkMode.value);
        addThemeLog(`跟随系统, theme: ${systemInfo.theme}, darkMode: ${darkMode.value}`);
      } else {
        darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
        console.log("[Main] initDarkMode - 不跟随系统，darkMode:", darkMode.value);
        addThemeLog(`不跟随系统, darkMode: ${darkMode.value}`);
      }
      console.log("[Main] ========== initDarkMode 结束 ==========");
      addThemeLog("initDarkMode 结束");
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
      common_vendor.index.showModal({
        title: "提示",
        content: "您需要同意许可协议才能使用本应用。",
        showCancel: false
      });
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
    const handleThemeChange = (data) => {
      console.log("[Main] ========== handleThemeChange 开始 ==========");
      console.log("[Main] 收到主题变化事件:", data);
      addThemeLog(`收到主题变化事件: isDark=${data.isDark}, from=${data.from || "unknown"}`);
      console.log("[Main] handleThemeChange - 当前 darkMode.value:", darkMode.value, "新值:", data.isDark);
      if (darkMode.value !== data.isDark) {
        console.log("[Main] handleThemeChange - 值不同，更新 darkMode");
        addThemeLog(`值不同，更新 darkMode: ${darkMode.value} -> ${data.isDark}`);
        darkMode.value = data.isDark;
        addThemeLog(`更新 darkMode: ${data.isDark}`);
        common_vendor.index.$emit("themeChanged", {
          isDark: data.isDark,
          from: "systemThemeChange"
        });
        addThemeLog("已广播 themeChanged 事件");
      } else {
        console.log("[Main] handleThemeChange - 值相同，跳过更新");
        addThemeLog("值相同，跳过更新");
      }
      console.log("[Main] ========== handleThemeChange 结束 ==========");
    };
    const checkAndBroadcastTheme = () => {
      console.log("[Main] ========== checkAndBroadcastTheme 开始 ==========");
      addThemeLog("checkAndBroadcastTheme 开始");
      let followSystem = common_vendor.index.getStorageSync("followSystem");
      console.log("[Main] checkAndBroadcastTheme - followSystem 原始值:", followSystem, "类型:", typeof followSystem);
      addThemeLog(`followSystem: ${followSystem}, 类型: ${typeof followSystem}`);
      if (followSystem === "" || followSystem === null || followSystem === void 0) {
        followSystem = true;
        common_vendor.index.setStorageSync("followSystem", "true");
        console.log("[Main] checkAndBroadcastTheme - 首次安装，默认设置 followSystem 为 true");
        addThemeLog("首次安装，默认 followSystem: true");
      }
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      console.log("[Main] checkAndBroadcastTheme - isFollowSystem:", isFollowSystem);
      addThemeLog(`isFollowSystem: ${isFollowSystem}`);
      let isDark = false;
      if (isFollowSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        isDark = systemInfo.theme === "dark";
        const currentDarkMode = common_vendor.index.getStorageSync("darkMode");
        if (currentDarkMode === "" || currentDarkMode === null || currentDarkMode === void 0) {
          common_vendor.index.setStorageSync("darkMode", isDark.toString());
          console.log("[Main] checkAndBroadcastTheme - 首次安装，同步 darkMode 存储为:", isDark);
          addThemeLog(`首次安装，同步 darkMode: ${isDark}`);
        }
        console.log("[Main] checkAndBroadcastTheme - 跟随系统，systemInfo.theme:", systemInfo.theme, "isDark:", isDark);
        addThemeLog(`跟随系统, theme: ${systemInfo.theme}, isDark: ${isDark}`);
      } else {
        isDark = common_vendor.index.getStorageSync("darkMode") === "true";
        console.log("[Main] checkAndBroadcastTheme - 不跟随系统，darkMode:", isDark);
        addThemeLog(`不跟随系统, darkMode: ${isDark}`);
      }
      console.log("[Main] checkAndBroadcastTheme - 最终 isDark:", isDark, "当前 darkMode:", darkMode.value);
      addThemeLog(`最终 isDark: ${isDark}, 当前: ${darkMode.value}`);
      if (darkMode.value !== isDark) {
        console.log("[Main] checkAndBroadcastTheme - 值不同，更新 darkMode");
        addThemeLog(`值不同，更新: ${darkMode.value} -> ${isDark}`);
        darkMode.value = isDark;
        common_vendor.index.$emit("themeChanged", {
          isDark,
          from: "onShow"
        });
        addThemeLog("已广播 themeChanged 事件");
      } else {
        console.log("[Main] checkAndBroadcastTheme - 值相同，跳过更新");
        addThemeLog("值相同，跳过更新");
      }
      console.log("[Main] ========== checkAndBroadcastTheme 结束 ==========");
      addThemeLog("checkAndBroadcastTheme 结束");
    };
    common_vendor.onShow(() => {
      console.log("[Main] 页面显示");
      checkAndBroadcastTheme();
      setTimeout(() => {
        console.log("[Main] 开始设置状态栏文字颜色为黑色");
        utils_system.setStatusBarTextColor("black");
      }, 300);
    });
    common_vendor.onMounted(() => {
      console.log("[Main] 主页面初始化");
      showDebugLog.value = common_vendor.index.getStorageSync("showDebugLog") === "true";
      console.log("[Main] 调试日志显示状态:", showDebugLog.value);
      initDarkMode();
      checkPactAgreement();
      checkHttpAccess();
      setTimeout(() => {
        checkAppUpdate();
      }, 1e3);
      common_vendor.index.$on("main-switch-tab", handleGlobalSwitchTab);
      console.log("[Main] 已注册全局事件监听: main-switch-tab");
      common_vendor.index.$on("systemThemeChange", handleThemeChange);
      console.log("[Main] 已注册主题变化监听: systemThemeChange");
      common_vendor.index.$on("showUpdatePopup", handleShowUpdatePopup);
      console.log("[Main] 已注册更新弹窗监听: showUpdatePopup");
      common_vendor.index.$on("debugLogStatusChanged", handleDebugLogStatusChanged);
      console.log("[Main] 已注册调试日志状态变化监听: debugLogStatusChanged");
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
      common_vendor.index.$off("systemThemeChange", handleThemeChange);
      common_vendor.index.$off("showUpdatePopup", handleShowUpdatePopup);
      common_vendor.index.$off("debugLogStatusChanged", handleDebugLogStatusChanged);
      console.log("[Main] 已移除全局事件监听");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handlePactAgree, "a9"),
        b: common_vendor.o(handlePactReject, "88"),
        c: common_vendor.p({
          visible: showPactModal.value,
          isAgreed: pactAgreed.value
        }),
        d: common_vendor.o(closeUpdatePopup, "33"),
        e: common_vendor.p({
          visible: showUpdatePopup.value,
          ["update-info"]: updateInfo.value,
          ["dark-mode"]: darkMode.value
        }),
        f: showDebugModal.value
      }, showDebugModal.value ? {
        g: common_vendor.p({
          type: "fas",
          name: "arrow-up",
          size: 40,
          color: "#ffffff"
        }),
        h: capsuleButton.value.left + capsuleButton.value.width / 2 - 20 + "px",
        i: capsuleButton.value.top + capsuleButton.value.height + 8 + "px",
        j: darkMode.value ? 1 : "",
        k: darkMode.value ? 1 : "",
        l: darkMode.value ? 1 : "",
        m: darkMode.value ? 1 : "",
        n: common_vendor.o(handleIgnoreForever, "bf"),
        o: common_vendor.o(closeDebugModal, "8b"),
        p: darkMode.value ? 1 : "",
        q: common_vendor.o(() => {
        }, "34"),
        r: common_vendor.o(closeDebugModal, "21")
      } : {}, {
        s: showIgnoreConfirmModal.value
      }, showIgnoreConfirmModal.value ? {
        t: darkMode.value ? 1 : "",
        v: darkMode.value ? 1 : "",
        w: common_vendor.o(closeIgnoreConfirmModal, "c1"),
        x: common_vendor.o(confirmIgnoreForever, "48"),
        y: darkMode.value ? 1 : "",
        z: common_vendor.o(() => {
        }, "1d"),
        A: common_vendor.o(closeIgnoreConfirmModal, "8d")
      } : {}, {
        B: loadedTabs.value.includes(0)
      }, loadedTabs.value.includes(0) ? {
        C: common_vendor.p({
          ["is-active"]: currentTab.value === 0
        })
      } : {}, {
        D: loadedTabs.value.includes(1)
      }, loadedTabs.value.includes(1) ? {
        E: common_vendor.p({
          ["is-active"]: currentTab.value === 1
        })
      } : {}, {
        F: loadedTabs.value.includes(2)
      }, loadedTabs.value.includes(2) ? {
        G: common_vendor.p({
          ["is-active"]: currentTab.value === 2
        })
      } : {}, {
        H: loadedTabs.value.includes(3)
      }, loadedTabs.value.includes(3) ? {
        I: common_vendor.p({
          ["is-active"]: currentTab.value === 3
        })
      } : {}, {
        J: currentTab.value,
        K: common_vendor.o(onSwiperChange, "81"),
        L: common_vendor.o(switchTab, "ef"),
        M: common_vendor.p({
          ["current-index"]: currentTab.value
        }),
        N: showDebugLog.value
      }, showDebugLog.value ? common_vendor.e({
        O: common_vendor.p({
          type: "fas",
          name: debugPanelExpanded.value ? "chevron-down" : "chevron-up",
          size: "14",
          color: darkMode.value ? "#9ca3af" : "#6b7280"
        }),
        P: debugPanelExpanded.value
      }, debugPanelExpanded.value ? {
        Q: common_vendor.t(debugInfo.value.followSystem),
        R: common_vendor.t(debugInfo.value.followSystemType),
        S: common_vendor.t(debugInfo.value.isFollowSystem),
        T: common_vendor.n(debugInfo.value.isFollowSystem ? "success" : "warning"),
        U: common_vendor.t(debugInfo.value.darkModeStorage),
        V: common_vendor.t(debugInfo.value.systemTheme),
        W: common_vendor.t(darkMode.value),
        X: common_vendor.n(darkMode.value ? "dark" : "light"),
        Y: common_vendor.t(debugInfo.value.platform),
        Z: common_vendor.t(debugInfo.value.appTheme),
        aa: common_vendor.t(debugInfo.value.isFirstInstall),
        ab: common_vendor.n(debugInfo.value.isFirstInstall ? "success" : ""),
        ac: common_vendor.t(debugInfo.value.appLaunchTime),
        ad: common_vendor.t(themeLogs.value.length),
        ae: common_vendor.f(themeLogs.value, (log, index, i0) => {
          return {
            a: common_vendor.t(log),
            b: index
          };
        }),
        af: common_vendor.o(refreshDebugInfo, "70"),
        ag: common_vendor.o(clearThemeLogs, "45"),
        ah: common_vendor.o(() => {
        }, "31")
      } : {}, {
        ai: darkMode.value ? 1 : "",
        aj: debugPanelExpanded.value ? 1 : "",
        ak: common_vendor.o(toggleDebugPanel, "5a")
      }) : {}, {
        al: darkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9631e604"]]);
wx.createPage(MiniProgramPage);
