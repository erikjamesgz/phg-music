"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  props: {
    currentIndex: {
      type: Number,
      required: true
    },
    isTablet: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeColor: "#00afff",
      platform: "",
      safeAreaInsetBottom: 0,
      isDarkMode: false,
      // 手机模式列表（4个tab）
      phoneList: [
        {
          pagePath: "/pages/main/index",
          text: "首页",
          icon: "house"
        },
        {
          pagePath: "/pages/main/index",
          text: "搜索",
          icon: "magnifying-glass"
        },
        {
          pagePath: "/pages/main/index",
          text: "列表",
          icon: "list-ul"
        },
        {
          pagePath: "/pages/main/index",
          text: "我的",
          icon: "user"
        }
      ],
      // 平板模式列表（5个tab，包含设置）
      tabletList: [
        {
          pagePath: "/pages/main/index",
          text: "首页",
          icon: "house"
        },
        {
          pagePath: "/pages/main/index",
          text: "搜索",
          icon: "magnifying-glass"
        },
        {
          pagePath: "/pages/main/index",
          text: "列表",
          icon: "list-ul"
        },
        {
          pagePath: "/pages/main/index",
          text: "我的",
          icon: "user"
        },
        {
          pagePath: "/pages/settings/index",
          text: "设置",
          icon: "gear"
        }
      ]
    };
  },
  computed: {
    platformClass() {
      if (this.platform === "ios" || this.platform === "devtools") {
        return "is-ios";
      }
      return "is-android";
    },
    // 根据模式显示不同的列表
    displayList() {
      return this.isTablet ? this.tabletList : this.phoneList;
    }
  },
  mounted() {
    var _a;
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.platform = systemInfo.platform || "android";
    this.safeAreaInsetBottom = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
    this.updateDarkMode();
    console.log("[CustomTabBar] 系统信息:", systemInfo);
    console.log("[CustomTabBar] 平台:", this.platform);
    console.log("[CustomTabBar] safeAreaInsets:", systemInfo.safeAreaInsets);
    console.log("[CustomTabBar] safeAreaInsetBottom:", this.safeAreaInsetBottom);
    console.log("[CustomTabBar] 深色模式:", this.isDarkMode);
    console.log("[CustomTabBar] 平板模式:", this.isTablet);
    common_vendor.index.$on("themeChanged", this.handleThemeChange);
    common_vendor.index.$on("systemThemeChange", this.handleSystemThemeChange);
    console.log("[CustomTabBar] 已注册主题变化监听");
    this.updateDarkMode();
  },
  beforeUnmount() {
    common_vendor.index.$off("themeChanged", this.handleThemeChange);
    common_vendor.index.$off("systemThemeChange", this.handleSystemThemeChange);
    console.log("[CustomTabBar] 已移除主题变化监听");
  },
  methods: {
    switchTab(index) {
      if (this.currentIndex === index)
        return;
      const item = this.displayList[index];
      console.log("[CustomTabBar] switchTab to:", index, item.text, item.pagePath);
      this.$emit("switch", index);
      common_vendor.index.$emit("main-switch-tab", { index });
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const isMainPage = (currentPage == null ? void 0 : currentPage.route) === "pages/main/index";
      console.log("[CustomTabBar] 当前页面:", currentPage == null ? void 0 : currentPage.route, "是否main页:", isMainPage);
      if (!isMainPage) {
        setTimeout(() => {
          common_vendor.index.redirectTo({ url: "/pages/main/index" });
        }, 50);
      }
    },
    getIconName(icon, index) {
      if (index === 0 && this.currentIndex === 0) {
        return "house";
      }
      return icon;
    },
    // 处理主题变化事件（来自 main/index.vue）
    handleThemeChange(data) {
      console.log("[CustomTabBar] 收到 themeChanged 事件:", data);
      this.updateDarkMode();
    },
    // 处理系统主题变化事件（来自 App.vue）
    handleSystemThemeChange(data) {
      console.log("[CustomTabBar] 收到 systemThemeChange 事件:", data);
      const followSystem = common_vendor.index.getStorageSync("followSystem");
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      if (isFollowSystem && data && typeof data.isDark === "boolean") {
        this.isDarkMode = data.isDark;
        console.log("[CustomTabBar] handleSystemThemeChange - isFollowSystem:", isFollowSystem, "isDarkMode:", this.isDarkMode);
      }
    },
    // 更新深色模式状态
    updateDarkMode() {
      const followSystem = common_vendor.index.getStorageSync("followSystem");
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      const darkMode = common_vendor.index.getStorageSync("darkMode") === "true";
      if (isFollowSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        if (systemInfo.theme) {
          this.isDarkMode = systemInfo.theme === "dark";
          console.log("[CustomTabBar] 跟随系统主题:", systemInfo.theme, "isDarkMode:", this.isDarkMode);
        } else {
          this.isDarkMode = darkMode;
          console.log("[CustomTabBar] 系统主题信息不可用，使用手动设置:", darkMode);
        }
      } else {
        this.isDarkMode = darkMode;
      }
      console.log("[CustomTabBar] 更新深色模式状态:", this.isDarkMode, "跟随系统:", followSystem);
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
  return {
    a: common_vendor.f($options.displayList, (item, index, i0) => {
      return {
        a: "1c46a54c-0-" + i0,
        b: common_vendor.p({
          name: $options.getIconName(item.icon, index),
          size: $props.currentIndex === index ? 22 : 20,
          color: $props.currentIndex === index ? $data.activeColor : $data.isDarkMode ? "#9ca3af" : "#8a8a8a"
        }),
        c: common_vendor.t(item.text),
        d: common_vendor.n({
          active: $props.currentIndex === index
        }),
        e: index,
        f: $props.currentIndex === index ? 1 : "",
        g: common_vendor.o(($event) => $options.switchTab(index), index)
      };
    }),
    b: common_vendor.n($options.platformClass),
    c: common_vendor.n({
      "dark-mode": $data.isDarkMode,
      "tablet-mode": $props.isTablet
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1c46a54c"]]);
wx.createComponent(Component);
