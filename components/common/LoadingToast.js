"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "LoadingToast",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: [String, Number],
      default: "加载中"
    },
    subtitle: {
      type: [String, Number],
      default: ""
    }
  },
  setup(__props) {
    const props = __props;
    const displayTitle = common_vendor.computed(() => {
      if (props.title === null || props.title === void 0) {
        return "加载中";
      }
      return String(props.title);
    });
    const displaySubtitle = common_vendor.computed(() => {
      if (props.subtitle === null || props.subtitle === void 0 || props.subtitle === "") {
        return "";
      }
      return String(props.subtitle);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: common_vendor.t(displayTitle.value),
        c: displaySubtitle.value
      }, displaySubtitle.value ? {
        d: common_vendor.t(displaySubtitle.value)
      } : {}) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0c1a7f8f"]]);
wx.createComponent(Component);
