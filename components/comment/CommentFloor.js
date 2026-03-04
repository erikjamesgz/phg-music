"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  __name: "CommentFloor",
  props: {
    comments: {
      type: Array,
      default: () => []
    }
  },
  setup(__props) {
    const props = __props;
    const darkMode = common_vendor.ref(false);
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[CommentFloor] 初始化暗黑模式:", darkMode.value);
    };
    const refreshDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[CommentFloor] 刷新暗黑模式:", darkMode.value);
    };
    common_vendor.onMounted(() => {
      initDarkMode();
      common_vendor.index.$on("darkModeChanged", refreshDarkMode);
    });
    const defaultAvatar = common_vendor.ref("https://via.placeholder.com/40x40?text=User");
    const handleImageError = (event) => {
      event.target.src = defaultAvatar.value;
    };
    const previewImage = (url, images) => {
      common_vendor.index.previewImage({
        current: url,
        urls: images
      });
    };
    common_vendor.watch(() => props.comments, (newVal) => {
      console.log("[CommentFloor] 评论列表更新:", newVal);
      console.log("[CommentFloor] 子评论数量:", newVal.filter((c) => c.reply && c.reply.length > 0).length);
    }, { deep: true });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(__props.comments, (item, k0, i0) => {
          return common_vendor.e({
            a: item.avatar && item.avatar !== "" ? item.avatar : defaultAvatar.value,
            b: common_vendor.o(handleImageError, item.id),
            c: common_vendor.t(item.userName),
            d: item.likedCount !== null && item.likedCount !== void 0
          }, item.likedCount !== null && item.likedCount !== void 0 ? {
            e: "e12ac861-0-" + i0,
            f: common_vendor.p({
              type: "far",
              name: "heart",
              size: "12",
              color: darkMode.value ? "#ffffff" : "#999"
            }),
            g: common_vendor.t(item.likedCount)
          } : {}, {
            h: item.timeStr || item.location
          }, item.timeStr || item.location ? common_vendor.e({
            i: item.timeStr
          }, item.timeStr ? {
            j: common_vendor.t(item.timeStr)
          } : {}, {
            k: item.location
          }, item.location ? {
            l: common_vendor.t(item.location)
          } : {}) : {}, {
            m: common_vendor.t(item.text),
            n: item.images && item.images.length
          }, item.images && item.images.length ? {
            o: common_vendor.f(item.images, (url, index, i1) => {
              return {
                a: index,
                b: url,
                c: common_vendor.o(($event) => previewImage(url, item.images), index)
              };
            })
          } : {}, {
            p: item.reply && item.reply.length > 0
          }, item.reply && item.reply.length > 0 ? {
            q: common_vendor.f(item.reply, (replyItem, replyIndex, i1) => {
              return common_vendor.e({
                a: replyItem.avatar && replyItem.avatar !== "" ? replyItem.avatar : defaultAvatar.value,
                b: common_vendor.o(handleImageError, replyItem.id),
                c: common_vendor.t(replyItem.userName),
                d: replyItem.likedCount !== null && replyItem.likedCount !== void 0
              }, replyItem.likedCount !== null && replyItem.likedCount !== void 0 ? {
                e: "e12ac861-1-" + i0 + "-" + i1,
                f: common_vendor.p({
                  type: "far",
                  name: "heart",
                  size: "10",
                  color: darkMode.value ? "#ffffff" : "#999"
                }),
                g: common_vendor.t(replyItem.likedCount)
              } : {}, {
                h: replyItem.timeStr || replyItem.location
              }, replyItem.timeStr || replyItem.location ? common_vendor.e({
                i: replyItem.timeStr
              }, replyItem.timeStr ? {
                j: common_vendor.t(replyItem.timeStr)
              } : {}, {
                k: replyItem.location
              }, replyItem.location ? {
                l: common_vendor.t(replyItem.location)
              } : {}) : {}, {
                m: common_vendor.t(replyItem.text),
                n: replyItem.id
              });
            })
          } : {}, {
            r: item.id
          });
        }),
        b: darkMode.value ? 1 : ""
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e12ac861"]]);
wx.createComponent(Component);
