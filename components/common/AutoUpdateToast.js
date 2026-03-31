"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "AutoUpdateToast",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    playlistName: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? {
        b: common_vendor.t(__props.playlistName)
      } : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ae0af155"]]);
wx.createComponent(Component);
