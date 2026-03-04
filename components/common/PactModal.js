"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "PactModal",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isAgreed: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      countdown: 20,
      timer: null,
      isDarkMode: false
    };
  },
  watch: {
    visible: {
      immediate: true,
      handler(newVal) {
        console.log("[PactModal] visible 变化:", newVal);
        if (newVal) {
          this.checkDarkMode();
          if (!this.isAgreed) {
            this.startCountdown();
          }
        } else {
          this.clearTimer();
        }
      }
    }
  },
  methods: {
    checkDarkMode() {
      const followSystem = common_vendor.index.getStorageSync("followSystem") !== "false";
      if (followSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        this.isDarkMode = systemInfo.theme === "dark";
      } else {
        this.isDarkMode = common_vendor.index.getStorageSync("darkMode") === "true";
      }
      console.log("[PactModal] isDarkMode:", this.isDarkMode);
    },
    startCountdown() {
      this.countdown = 20;
      this.clearTimer();
      this.timer = setInterval(() => {
        console.log("[PactModal] 倒计时:", this.countdown);
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          this.clearTimer();
        }
      }, 1e3);
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    handleReject() {
      console.log("[PactModal] 用户点击拒绝");
      this.$emit("reject");
    },
    handleAccept() {
      console.log("[PactModal] 用户点击接受，countdown:", this.countdown);
      if (this.countdown > 0) {
        return;
      }
      this.clearTimer();
      console.log("[PactModal] 发射 agree 事件");
      this.$emit("agree");
    }
  },
  beforeDestroy() {
    this.clearTimer();
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.visible
  }, $props.visible ? common_vendor.e({
    b: !$props.isAgreed
  }, !$props.isAgreed ? {} : {}, {
    c: !$props.isAgreed
  }, !$props.isAgreed ? {} : {}, {
    d: !$props.isAgreed
  }, !$props.isAgreed ? {
    e: common_vendor.o((...args) => $options.handleReject && $options.handleReject(...args))
  } : {}, {
    f: common_vendor.t($data.countdown > 0 ? `接受（${$data.countdown}）` : "接受"),
    g: $data.countdown > 0 ? 1 : "",
    h: common_vendor.o((...args) => $options.handleAccept && $options.handleAccept(...args)),
    i: $data.isDarkMode ? 1 : ""
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dcedfdba"]]);
wx.createComponent(Component);
