"use strict";
const common_vendor = require("../common/vendor.js");
require("../store/modules/list.js");
const store_modules_player = require("../store/modules/player.js");
const tabBarHeight = common_vendor.ref(0);
const miniPlayerHeight = common_vendor.ref(0);
const safeAreaBottom = common_vendor.ref(0);
const isMiniPlayerVisible = common_vendor.ref(false);
let isInitialized = false;
const totalBottomHeight = common_vendor.computed(() => {
  let height = tabBarHeight.value;
  if (isMiniPlayerVisible.value) {
    height += miniPlayerHeight.value;
  }
  height += safeAreaBottom.value;
  console.log("[globalBottomHeight] 计算总底部高度:", {
    tabBarHeight: tabBarHeight.value,
    miniPlayerHeight: miniPlayerHeight.value,
    safeAreaBottom: safeAreaBottom.value,
    isMiniPlayerVisible: isMiniPlayerVisible.value,
    total: height
  });
  return height;
});
const initHeights = () => {
  var _a;
  if (isInitialized) {
    console.log("[globalBottomHeight] 已初始化，跳过");
    return;
  }
  try {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    const windowWidth = systemInfo.windowWidth;
    const rpxToPx = windowWidth / 750;
    tabBarHeight.value = 140 * rpxToPx;
    miniPlayerHeight.value = 140 * rpxToPx;
    safeAreaBottom.value = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
    console.log("[globalBottomHeight] 初始化高度:", {
      windowWidth,
      rpxToPx,
      tabBarHeight: tabBarHeight.value,
      miniPlayerHeight: miniPlayerHeight.value,
      safeAreaBottom: safeAreaBottom.value
    });
    isInitialized = true;
  } catch (error) {
    console.error("[globalBottomHeight] 初始化高度失败:", error);
    tabBarHeight.value = 70;
    miniPlayerHeight.value = 70;
    safeAreaBottom.value = 0;
    isInitialized = true;
  }
};
const checkMiniPlayerStatus = () => {
  try {
    const state = store_modules_player.playerStore.getState();
    const currentSong = state == null ? void 0 : state.currentSong;
    const wasVisible = isMiniPlayerVisible.value;
    isMiniPlayerVisible.value = !!(currentSong && currentSong.id);
    console.log("[globalBottomHeight] checkMiniPlayerStatus:", {
      hasCurrentSong: !!(currentSong && currentSong.id),
      songName: (currentSong == null ? void 0 : currentSong.name) || "无",
      wasVisible,
      nowVisible: isMiniPlayerVisible.value,
      totalBottomHeight: totalBottomHeight.value
    });
  } catch (error) {
    console.error("[globalBottomHeight] 检查 MiniPlayer 状态失败:", error);
  }
};
const onMiniPlayerVisibilityChange = (data) => {
  console.log("[globalBottomHeight] 收到 MiniPlayer 高度变化事件:", data);
  isMiniPlayerVisible.value = data.isShowing;
  if (data.height) {
    miniPlayerHeight.value = data.height;
  }
};
const initGlobalListeners = () => {
  initHeights();
  checkMiniPlayerStatus();
  common_vendor.index.$on("miniPlayerHeightChange", onMiniPlayerVisibilityChange);
  console.log("[globalBottomHeight] 已注册 miniPlayerHeightChange 监听");
};
const globalBottomHeight = {
  tabBarHeight,
  miniPlayerHeight,
  safeAreaBottom,
  isMiniPlayerVisible,
  totalBottomHeight,
  initHeights,
  checkMiniPlayerStatus,
  initGlobalListeners
};
exports.globalBottomHeight = globalBottomHeight;
