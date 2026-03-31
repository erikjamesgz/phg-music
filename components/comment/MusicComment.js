"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api_comment = require("../../utils/api/comment.js");
if (!Math) {
  (RocIconPlus + CommentFloor)();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const CommentFloor = () => "./CommentFloor.js";
const _sfc_main = {
  __name: "MusicComment",
  props: {
    show: {
      type: Boolean,
      default: false
    },
    musicInfo: {
      type: Object,
      required: true
    }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const darkMode = common_vendor.ref(false);
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[MusicComment] 初始化暗黑模式:", darkMode.value);
    };
    const refreshDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[MusicComment] 刷新暗黑模式:", darkMode.value);
    };
    common_vendor.onMounted(() => {
      initDarkMode();
      common_vendor.index.$on("darkModeChanged", refreshDarkMode);
    });
    const available = common_vendor.ref(false);
    const currentMusicInfo = common_vendor.ref({
      name: "",
      singer: "",
      source: "",
      songmid: "",
      hash: "",
      copyrightId: ""
    });
    const tabActiveId = common_vendor.ref("hot");
    const scrollTop = common_vendor.ref(0);
    const newComment = common_vendor.ref({
      isLoading: false,
      isLoadError: false,
      page: 1,
      total: 0,
      maxPage: 1,
      limit: 20,
      list: []
    });
    const hotComment = common_vendor.ref({
      isLoading: false,
      isLoadError: false,
      page: 1,
      total: 0,
      maxPage: 1,
      limit: 20,
      list: []
    });
    const handleClose = () => {
      emit("close");
    };
    const handleRefresh = () => {
      hotComment.value.page = 1;
      hotComment.value.total = 0;
      hotComment.value.maxPage = 1;
      hotComment.value.list = [];
      newComment.value.page = 1;
      newComment.value.total = 0;
      newComment.value.maxPage = 1;
      newComment.value.list = [];
      handleGetHotComment(1, hotComment.value.limit);
      handleGetNewComment(1, newComment.value.limit);
    };
    const handleGetHotComment = async (page, limit) => {
      hotComment.value.isLoadError = false;
      hotComment.value.isLoading = true;
      try {
        const result = await utils_api_comment.getHotComment({
          id: currentMusicInfo.value.id,
          name: currentMusicInfo.value.name,
          singer: currentMusicInfo.value.singer,
          source: currentMusicInfo.value.source,
          songmid: currentMusicInfo.value.songmid,
          hash: currentMusicInfo.value.hash,
          copyrightId: currentMusicInfo.value.copyrightId,
          page,
          limit
        });
        hotComment.value.isLoading = false;
        hotComment.value.total = result.total;
        hotComment.value.maxPage = result.maxPage;
        hotComment.value.page = page;
        if (page === 1) {
          hotComment.value.list = result.comments;
        } else {
          hotComment.value.list = [...hotComment.value.list, ...result.comments];
        }
        scrollTop.value = 0;
      } catch (err) {
        console.error("[MusicComment] 获取热门评论失败:", err);
        hotComment.value.isLoadError = true;
        hotComment.value.isLoading = false;
      }
    };
    const handleGetNewComment = async (page, limit) => {
      newComment.value.isLoadError = false;
      newComment.value.isLoading = true;
      try {
        const result = await utils_api_comment.getNewComment({
          id: currentMusicInfo.value.id,
          name: currentMusicInfo.value.name,
          singer: currentMusicInfo.value.singer,
          source: currentMusicInfo.value.source,
          songmid: currentMusicInfo.value.songmid,
          hash: currentMusicInfo.value.hash,
          copyrightId: currentMusicInfo.value.copyrightId,
          page,
          limit
        });
        newComment.value.isLoading = false;
        newComment.value.total = result.total;
        newComment.value.maxPage = result.maxPage;
        newComment.value.page = page;
        if (page === 1) {
          newComment.value.list = result.comments;
        } else {
          newComment.value.list = [...newComment.value.list, ...result.comments];
        }
        scrollTop.value = 0;
      } catch (err) {
        console.error("[MusicComment] 获取最新评论失败:", err);
        newComment.value.isLoadError = true;
        newComment.value.isLoading = false;
      }
    };
    const handleShowComment = () => {
      currentMusicInfo.value = props.musicInfo;
      if (!currentMusicInfo.value) {
        console.log("[MusicComment] musicInfo为空，无法显示评论");
        available.value = false;
        return;
      }
      if (currentMusicInfo.value.source === "local") {
        available.value = false;
        return;
      }
      available.value = true;
      hotComment.value.page = 1;
      hotComment.value.total = 0;
      hotComment.value.maxPage = 1;
      hotComment.value.list = [];
      newComment.value.page = 1;
      newComment.value.total = 0;
      newComment.value.maxPage = 1;
      newComment.value.list = [];
      handleGetHotComment(1, hotComment.value.limit);
      handleGetNewComment(1, newComment.value.limit);
    };
    const handleToggleTab = (id) => {
      if (!available.value || tabActiveId.value === id)
        return;
      tabActiveId.value = id;
      scrollTop.value = 0;
    };
    const handleLoadMore = () => {
      if (tabActiveId.value === "hot") {
        if (hotComment.value.page < hotComment.value.maxPage && !hotComment.value.isLoading) {
          handleGetHotComment(hotComment.value.page + 1, hotComment.value.limit);
        }
      } else {
        if (newComment.value.page < newComment.value.maxPage && !newComment.value.isLoading) {
          handleGetNewComment(newComment.value.page + 1, newComment.value.limit);
        }
      }
    };
    common_vendor.watch(() => props.show, (newVal) => {
      if (newVal) {
        handleShowComment();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.show
      }, __props.show ? common_vendor.e({
        b: common_vendor.t(currentMusicInfo.value.name),
        c: common_vendor.p({
          type: "fas",
          name: "rotate-right",
          size: "16",
          color: "#00d7cd"
        }),
        d: common_vendor.o(handleRefresh, "82"),
        e: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "16",
          color: "#999"
        }),
        f: common_vendor.o(handleClose, "0c"),
        g: available.value
      }, available.value ? common_vendor.e({
        h: common_vendor.t(hotComment.value.total),
        i: tabActiveId.value === "hot" ? 1 : "",
        j: common_vendor.o(($event) => handleToggleTab("hot"), "18"),
        k: newComment.value.total > 0
      }, newComment.value.total > 0 ? {
        l: common_vendor.t(newComment.value.total)
      } : {}, {
        m: tabActiveId.value === "new" ? 1 : "",
        n: common_vendor.o(($event) => handleToggleTab("new"), "ee"),
        o: tabActiveId.value === "hot"
      }, tabActiveId.value === "hot" ? common_vendor.e({
        p: hotComment.value.isLoadError
      }, hotComment.value.isLoadError ? {
        q: common_vendor.o(($event) => handleGetHotComment(hotComment.value.page, hotComment.value.limit), "e1")
      } : hotComment.value.isLoading && hotComment.value.list.length === 0 ? {} : hotComment.value.list.length > 0 ? {
        t: common_vendor.p({
          comments: hotComment.value.list
        })
      } : {}, {
        r: hotComment.value.isLoading && hotComment.value.list.length === 0,
        s: hotComment.value.list.length > 0,
        v: hotComment.value.list.length > 0 && hotComment.value.page < hotComment.value.maxPage
      }, hotComment.value.list.length > 0 && hotComment.value.page < hotComment.value.maxPage ? {
        w: common_vendor.t(hotComment.value.isLoading ? "加载中..." : "上拉加载更多")
      } : {}) : {}, {
        x: tabActiveId.value === "new"
      }, tabActiveId.value === "new" ? common_vendor.e({
        y: newComment.value.isLoadError
      }, newComment.value.isLoadError ? {
        z: common_vendor.o(($event) => handleGetNewComment(newComment.value.page, newComment.value.limit), "32")
      } : newComment.value.isLoading && newComment.value.list.length === 0 ? {} : newComment.value.list.length > 0 ? {
        C: common_vendor.p({
          comments: newComment.value.list
        })
      } : {}, {
        A: newComment.value.isLoading && newComment.value.list.length === 0,
        B: newComment.value.list.length > 0,
        D: newComment.value.list.length > 0 && newComment.value.page < newComment.value.maxPage
      }, newComment.value.list.length > 0 && newComment.value.page < newComment.value.maxPage ? {
        E: common_vendor.t(newComment.value.isLoading ? "加载中..." : "上拉加载更多")
      } : {}) : {}, {
        F: scrollTop.value,
        G: common_vendor.o(handleLoadMore, "53")
      }) : {}, {
        H: darkMode.value ? 1 : "",
        I: common_vendor.o(() => {
        }, "8f"),
        J: common_vendor.o(handleClose, "36")
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-99fdfd2b"]]);
wx.createComponent(Component);
