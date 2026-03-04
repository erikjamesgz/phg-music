"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_version = require("../../utils/version.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  (PactModal + _easycom_roc_icon_plus + IndexPage + SearchPage + PlaylistPage + MyPage + MiniPlayer + CustomTabBar)();
}
const IndexPage = () => "../index/index2.js";
const SearchPage = () => "../search/index2.js";
const PlaylistPage = () => "../playlist/index2.js";
const MyPage = () => "../my/index2.js";
const MiniPlayer = () => "../../components/player/MiniPlayer.js";
const CustomTabBar = () => "../../components/common/CustomTabBar.js";
const PactModal = () => "../../components/common/PactModal.js";
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
      const followSystem = common_vendor.index.getStorageSync("followSystem") !== "false";
      if (followSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        darkMode.value = systemInfo.theme === "dark";
      } else {
        darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      }
      console.log("[Main] initDarkMode:", darkMode.value);
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
    const closeUpdatePopup = () => {
      showUpdatePopup.value = false;
      updateInfo.value = null;
    };
    const ignoreUpdateVersion = () => {
      if (updateInfo.value && updateInfo.value.versionInfo) {
        utils_version.ignoreVersion(updateInfo.value.versionInfo.version);
        common_vendor.index.showToast({
          title: "已忽略此版本",
          icon: "success"
        });
      }
      closeUpdatePopup();
    };
    const openProjectUrl = () => {
      if (updateInfo.value && updateInfo.value.versionInfo) {
        const url = updateInfo.value.versionInfo.projectUrl || "https://github.com/erikjamesgz/phg-music";
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
      closeUpdatePopup();
    };
    const switchTab = (index) => {
      if (currentTab.value === index)
        return;
      console.log("[Main] switchTab 切换到:", index);
      currentTab.value = index;
      if (!loadedTabs.value.includes(index)) {
        loadedTabs.value.push(index);
        console.log("[Main] 懒加载页面:", index);
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
      console.log("[Main] 收到主题变化事件:", data);
      darkMode.value = data.isDark;
      common_vendor.index.$emit("themeChanged", {
        isDark: data.isDark,
        from: "systemThemeChange"
      });
    };
    const checkAndBroadcastTheme = () => {
      const followSystem = common_vendor.index.getStorageSync("followSystem") !== "false";
      let isDark = false;
      if (followSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        isDark = systemInfo.theme === "dark";
      } else {
        isDark = common_vendor.index.getStorageSync("darkMode") === "true";
      }
      console.log("[Main] checkAndBroadcastTheme:", { followSystem, isDark });
      darkMode.value = isDark;
      common_vendor.index.$emit("themeChanged", {
        isDark,
        from: "onShow"
      });
    };
    common_vendor.onShow(() => {
      console.log("[Main] 页面显示");
      checkAndBroadcastTheme();
    });
    common_vendor.onMounted(() => {
      console.log("[Main] 主页面初始化");
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
      console.log("[Main] 已移除全局事件监听");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handlePactAgree),
        b: common_vendor.o(handlePactReject),
        c: common_vendor.p({
          visible: showPactModal.value,
          isAgreed: pactAgreed.value
        }),
        d: showUpdatePopup.value
      }, showUpdatePopup.value ? {
        e: common_vendor.p({
          type: "fas",
          name: "leaf",
          size: "20",
          color: "#ffffff"
        }),
        f: common_vendor.t(updateInfo.value ? updateInfo.value.versionInfo.version : ""),
        g: common_vendor.t(updateInfo.value ? updateInfo.value.currentVersion : ""),
        h: common_vendor.t(updateInfo.value ? updateInfo.value.versionInfo.version : ""),
        i: common_vendor.t(updateInfo.value ? updateInfo.value.versionInfo.desc : ""),
        j: common_vendor.o(closeUpdatePopup),
        k: common_vendor.o(openProjectUrl),
        l: common_vendor.o(ignoreUpdateVersion),
        m: darkMode.value ? 1 : ""
      } : {}, {
        n: showDebugModal.value
      }, showDebugModal.value ? {
        o: common_vendor.p({
          type: "fas",
          name: "arrow-up",
          size: 40,
          color: "#ffffff"
        }),
        p: capsuleButton.value.left + capsuleButton.value.width / 2 - 20 + "px",
        q: capsuleButton.value.top + capsuleButton.value.height + 8 + "px",
        r: darkMode.value ? 1 : "",
        s: darkMode.value ? 1 : "",
        t: darkMode.value ? 1 : "",
        v: darkMode.value ? 1 : "",
        w: common_vendor.o(handleIgnoreForever),
        x: common_vendor.o(closeDebugModal),
        y: darkMode.value ? 1 : "",
        z: common_vendor.o(() => {
        }),
        A: common_vendor.o(closeDebugModal)
      } : {}, {
        B: showIgnoreConfirmModal.value
      }, showIgnoreConfirmModal.value ? {
        C: darkMode.value ? 1 : "",
        D: darkMode.value ? 1 : "",
        E: common_vendor.o(closeIgnoreConfirmModal),
        F: common_vendor.o(confirmIgnoreForever),
        G: darkMode.value ? 1 : "",
        H: common_vendor.o(() => {
        }),
        I: common_vendor.o(closeIgnoreConfirmModal)
      } : {}, {
        J: loadedTabs.value.includes(0)
      }, loadedTabs.value.includes(0) ? {
        K: common_vendor.p({
          ["is-active"]: currentTab.value === 0
        })
      } : {}, {
        L: loadedTabs.value.includes(1)
      }, loadedTabs.value.includes(1) ? {
        M: common_vendor.p({
          ["is-active"]: currentTab.value === 1
        })
      } : {}, {
        N: loadedTabs.value.includes(2)
      }, loadedTabs.value.includes(2) ? {
        O: common_vendor.p({
          ["is-active"]: currentTab.value === 2
        })
      } : {}, {
        P: loadedTabs.value.includes(3)
      }, loadedTabs.value.includes(3) ? {
        Q: common_vendor.p({
          ["is-active"]: currentTab.value === 3
        })
      } : {}, {
        R: currentTab.value,
        S: common_vendor.o(onSwiperChange),
        T: common_vendor.o(switchTab),
        U: common_vendor.p({
          ["current-index"]: currentTab.value
        }),
        V: darkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce1aa560"]]);
wx.createPage(MiniProgramPage);
