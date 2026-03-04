"use strict";
const common_vendor = require("../common/vendor.js");
const composables_useGlobalBottomHeight = require("./useGlobalBottomHeight.js");
function useBottomHeight() {
  const {
    tabBarHeight,
    miniPlayerHeight,
    safeAreaBottom,
    isMiniPlayerVisible,
    totalBottomHeight,
    initHeights,
    checkMiniPlayerStatus,
    initGlobalListeners
  } = composables_useGlobalBottomHeight.globalBottomHeight;
  const bottomPaddingStyle = common_vendor.computed(() => {
    const paddingBottom = totalBottomHeight.value;
    console.log("[useBottomHeight] 生成 paddingBottom:", paddingBottom + "px");
    return {
      paddingBottom: `${paddingBottom}px`
    };
  });
  const bottomMarginStyle = common_vendor.computed(() => {
    const marginBottom = totalBottomHeight.value;
    console.log("[useBottomHeight] 生成 marginBottom:", marginBottom + "px");
    return {
      marginBottom: `${marginBottom}px`
    };
  });
  common_vendor.onMounted(() => {
    console.log("[useBottomHeight] onMounted - 组件挂载");
    initGlobalListeners();
  });
  common_vendor.onUnmounted(() => {
    console.log("[useBottomHeight] onUnmounted - 组件卸载");
  });
  return {
    tabBarHeight,
    miniPlayerHeight,
    safeAreaBottom,
    isMiniPlayerVisible,
    totalBottomHeight,
    bottomPaddingStyle,
    bottomMarginStyle,
    initHeights,
    checkMiniPlayerStatus
  };
}
exports.useBottomHeight = useBottomHeight;
