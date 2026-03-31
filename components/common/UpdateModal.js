"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_version = require("../../utils/version.js");
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  name: "UpdateModal",
  components: {
    RocIconPlus
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    updateInfo: {
      type: Object,
      default: null
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      downloading: false,
      downloadProgress: 0,
      downloadProgressText: ""
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.checkExistingDownload();
        this.registerProgressCallback();
      }
    }
  },
  methods: {
    // 检查是否有正在进行的下载
    checkExistingDownload() {
    },
    // 注册全局进度回调
    registerProgressCallback() {
    },
    handleClose() {
      this.$emit("close");
    },
    handleOverlayClick() {
      if (this.downloading) {
        common_vendor.index.showModal({
          title: "提示",
          content: "是否开启后台下载？",
          confirmText: "后台下载",
          cancelText: "取消下载",
          success: (res) => {
            if (res.confirm) {
              utils_version.setBackgroundDownload(true);
              this.$emit("close");
              common_vendor.index.showToast({
                title: "正在后台下载...",
                icon: "none"
              });
            } else {
              this.resetDownloadState();
              this.$emit("close");
            }
          }
        });
      } else {
        this.$emit("close");
      }
    },
    startBackgroundDownload() {
      if (!this.downloading)
        return;
      utils_version.setBackgroundDownload(true);
      this.$emit("close");
      common_vendor.index.showToast({
        title: "正在后台下载...",
        icon: "none"
      });
    },
    cancelDownloadConfirm() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要取消下载吗？",
        success: (res) => {
          if (res.confirm) {
            this.resetDownloadState();
            this.$emit("close");
            common_vendor.index.showToast({
              title: "已取消下载",
              icon: "none"
            });
          }
        }
      });
    },
    handleUpdateButtonClick() {
      this.$emit("close");
    },
    ignoreUpdateVersion() {
      if (this.updateInfo && this.updateInfo.versionInfo) {
        utils_version.ignoreVersion(this.updateInfo.versionInfo.version);
        common_vendor.index.showToast({
          title: "已忽略此版本",
          icon: "success"
        });
      }
      this.$emit("close");
    },
    openProjectUrl() {
      if (this.updateInfo && this.updateInfo.versionInfo) {
        const url = this.updateInfo.versionInfo.projectUrl || "https://github.com/erikjamesgz/phg-music";
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
      this.$emit("close");
    },
    resetDownloadState() {
      this.downloading = false;
      this.downloadProgress = 0;
      this.downloadProgressText = "";
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
  return common_vendor.e({
    a: $props.visible
  }, $props.visible ? common_vendor.e({
    b: common_vendor.p({
      type: "fas",
      name: "wave-square",
      size: "20",
      color: "#ffffff"
    }),
    c: common_vendor.t($props.updateInfo ? $props.updateInfo.versionInfo.version : ""),
    d: common_vendor.t($props.updateInfo ? $props.updateInfo.currentVersion : ""),
    e: common_vendor.t($props.updateInfo ? $props.updateInfo.versionInfo.version : ""),
    f: common_vendor.t($props.updateInfo ? $props.updateInfo.versionInfo.desc : ""),
    g: $data.downloading
  }, $data.downloading ? {
    h: $data.downloadProgress + "%",
    i: common_vendor.t($data.downloadProgressText)
  } : {}, {
    j: common_vendor.o((...args) => $options.handleClose && $options.handleClose(...args), "1c"),
    k: common_vendor.o((...args) => $options.openProjectUrl && $options.openProjectUrl(...args), "39"),
    l: common_vendor.o((...args) => $options.ignoreUpdateVersion && $options.ignoreUpdateVersion(...args), "c5"),
    m: $props.darkMode ? 1 : "",
    n: common_vendor.o(() => {
    }, "59"),
    o: common_vendor.o((...args) => $options.handleOverlayClick && $options.handleOverlayClick(...args), "d5")
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c94912fa"]]);
wx.createComponent(Component);
