"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "roc-icon-plus",
  data() {
    return {};
  },
  computed: {
    faType() {
      return `${this.type}`;
    },
    faName() {
      return `fa-${this.name}`;
    },
    faRotate() {
      return `fa-rotate-${this.rotate}`;
    },
    faAnimationType() {
      return `fa-${this.animationType}`;
    }
  },
  props: {
    type: {
      type: String,
      default: "fas"
    },
    name: {
      type: String,
      default: "",
      required: true
    },
    size: {
      type: [Number, String],
      default: 16
    },
    color: {
      type: String,
      default: "#606266"
    },
    rotate: {
      type: [Number, String],
      default: 0
    },
    animationType: {
      type: String,
      default: ""
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.n($options.faType),
    b: common_vendor.n($options.faName),
    c: common_vendor.n($options.faRotate),
    d: common_vendor.n($options.faAnimationType),
    e: String($props.size).includes("px") ? $props.size : `${$props.size}px`,
    f: $props.color
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-facc1cd6"]]);
wx.createComponent(Component);
