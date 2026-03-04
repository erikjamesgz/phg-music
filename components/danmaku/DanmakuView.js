"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "DanmakuView",
  props: {
    danmakuList: {
      type: Array,
      default: () => []
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    visible: {
      type: Boolean,
      default: true
    },
    songInfo: {
      type: Object,
      default: null
    },
    playing: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      localDanmakuList: [],
      activeDanmaku: [],
      danmakuTimer: null,
      maxDanmaku: 3,
      danmakuDuration: 12,
      danmakuInterval: 4e3,
      maxTextLength: 35,
      isLoadingMore: false,
      positionIndex: 0,
      shownIds: /* @__PURE__ */ new Set(),
      allCommentIds: /* @__PURE__ */ new Set(),
      lastSongId: null,
      requestCount: 0,
      isPaused: false,
      rowStatus: {}
      // 跟踪每一行是否有弹幕 { '10': true, '30': false, ... }
    };
  },
  watch: {
    danmakuList: {
      handler(newList, oldList) {
        if (newList && newList.length > 0) {
          const isNewSong = !oldList || oldList.length === 0 || newList[0] && oldList[0] && newList[0].id !== oldList[0].id;
          if (isNewSong) {
            this.localDanmakuList = [...newList];
            this.reset();
            if (!this.isPaused) {
              this.startDanmaku();
            }
          }
        }
      },
      immediate: true
    },
    visible: {
      handler(newVal) {
        if (newVal) {
          if (!this.isPaused) {
            this.startDanmaku();
          }
        } else {
          this.stopDanmaku();
        }
      }
    },
    playing: {
      handler(newVal, oldVal) {
        console.log("[Danmaku] playing watcher 触发:", { newVal, oldVal, isPaused: this.isPaused });
        if (newVal) {
          console.log("[Danmaku] 恢复播放");
          this.isPaused = false;
          this.resumeDanmaku();
        } else {
          console.log("[Danmaku] 暂停播放");
          this.isPaused = true;
          this.pauseDanmaku();
        }
      },
      immediate: true
    },
    songInfo: {
      handler(newInfo) {
        if (newInfo && newInfo.id !== this.lastSongId) {
          this.lastSongId = newInfo.id;
          this.reset();
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.danmakuList.length > 0) {
      this.localDanmakuList = [...this.danmakuList];
      if (!this.isPaused) {
        this.startDanmaku();
      }
    }
  },
  beforeDestroy() {
    this.stopDanmaku();
  },
  methods: {
    getNextPosition() {
      const positions = [8, 42, 85];
      const availablePositions = positions.filter((pos2) => !this.rowStatus[pos2]);
      if (availablePositions.length === 0) {
        return null;
      }
      const pos = availablePositions[0];
      return pos;
    },
    // 标记某行有弹幕
    markRowOccupied(position) {
      this.rowStatus[position] = true;
    },
    // 标记某行弹幕已消失
    markRowFree(position) {
      this.rowStatus[position] = false;
    },
    formatText(text, maxLength) {
      if (!text)
        return "";
      let formatted = text.replace(/[\r\n]+/g, " ");
      formatted = formatted.replace(/\s+/g, " ").trim();
      if (formatted.length <= maxLength)
        return formatted;
      return formatted.substring(0, maxLength) + "...";
    },
    getUnshownItem() {
      const unshownIndexes = [];
      for (let i = 0; i < this.localDanmakuList.length; i++) {
        if (!this.shownIds.has(this.localDanmakuList[i].id)) {
          unshownIndexes.push(i);
        }
      }
      if (unshownIndexes.length === 0)
        return null;
      const randomIndex = unshownIndexes[Math.floor(Math.random() * unshownIndexes.length)];
      return { index: randomIndex, item: this.localDanmakuList[randomIndex] };
    },
    reset() {
      this.stopDanmaku();
      this.positionIndex = 0;
      this.shownIds = /* @__PURE__ */ new Set();
      this.allCommentIds = /* @__PURE__ */ new Set();
      this.requestCount = 0;
      this.rowStatus = {};
      this.localDanmakuList.forEach((item) => {
        this.allCommentIds.add(item.id);
      });
    },
    clearAllTimers() {
      if (this.danmakuTimer) {
        clearTimeout(this.danmakuTimer);
        this.danmakuTimer = null;
      }
    },
    startDanmaku() {
      if (this.danmakuTimer)
        return;
      if (!this.localDanmakuList || this.localDanmakuList.length === 0)
        return;
      if (this.isPaused) {
        console.log("[Danmaku] 弹幕已暂停，不启动");
        return;
      }
      console.log("[Danmaku] 开始弹幕, 总数:", this.localDanmakuList.length, "已显示:", this.shownIds.size);
      this.activeDanmaku = [];
      this.positionIndex = 0;
      this.clearAllTimers();
      this.showNextDanmaku();
    },
    stopDanmaku() {
      this.clearAllTimers();
      this.activeDanmaku = [];
    },
    pauseDanmaku() {
      console.log("[Danmaku] 暂停弹幕");
      this.isPaused = true;
      if (this.danmakuTimer) {
        clearTimeout(this.danmakuTimer);
        this.danmakuTimer = null;
      }
    },
    resumeDanmaku() {
      console.log("[Danmaku] 恢复弹幕");
      this.isPaused = false;
      if (this.activeDanmaku.length === 0) {
        this.showNextDanmaku();
      } else {
        this.danmakuTimer = setTimeout(() => {
          if (!this.isPaused) {
            this.showNextDanmaku();
          }
        }, this.danmakuInterval);
      }
    },
    async showNextDanmaku() {
      if (this.isPaused) {
        return;
      }
      if (!this.localDanmakuList || this.localDanmakuList.length === 0)
        return;
      let unshown = this.getUnshownItem();
      if (!unshown && !this.isLoadingMore) {
        console.log("[Danmaku] 所有弹幕已显示完，尝试加载更多");
        const newComments = await this.loadMoreComments();
        if (this.isPaused)
          return;
        if (newComments && newComments.length > 0) {
          let addedCount = 0;
          for (const comment of newComments) {
            if (!this.allCommentIds.has(comment.id)) {
              this.localDanmakuList.push(comment);
              this.allCommentIds.add(comment.id);
              addedCount++;
            }
          }
          console.log("[Danmaku] 处理新评论 - 新增:", addedCount);
          unshown = this.getUnshownItem();
        }
        if (!unshown) {
          console.log("[Danmaku] 没有更多评论了，重置重新显示");
          this.shownIds = /* @__PURE__ */ new Set();
          unshown = this.getUnshownItem();
        }
      }
      if (!unshown) {
        console.log("[Danmaku] 没有弹幕可显示");
        return;
      }
      if (this.isPaused)
        return;
      const position = this.getNextPosition();
      if (position === null) {
        this.danmakuTimer = setTimeout(() => {
          if (!this.isPaused) {
            this.showNextDanmaku();
          }
        }, 1e3);
        return;
      }
      const item = unshown.item;
      this.shownIds.add(item.id);
      const uniqueId = "danmaku_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      const formattedText = this.formatText(item.text || item.content || "", this.maxTextLength);
      const danmakuItem = {
        uniqueId,
        id: item.id,
        userName: this.removeAtSymbol(item.userName || item.nick || "用户"),
        text: formattedText,
        position,
        duration: this.danmakuDuration
      };
      this.markRowOccupied(position);
      this.activeDanmaku = [...this.activeDanmaku, danmakuItem];
      if (this.activeDanmaku.length > this.maxDanmaku * 2) {
        this.activeDanmaku.shift();
      }
      this.danmakuTimer = setTimeout(() => {
        if (!this.isPaused) {
          this.showNextDanmaku();
        }
      }, this.danmakuInterval);
    },
    // 弹幕动画结束时移除
    onDanmakuEnd(uniqueId) {
      const idx = this.activeDanmaku.findIndex((d) => d.uniqueId === uniqueId);
      if (idx !== -1) {
        const item = this.activeDanmaku[idx];
        this.markRowFree(item.position);
        this.activeDanmaku.splice(idx, 1);
      }
    },
    async loadMoreComments() {
      if (this.isLoadingMore)
        return null;
      if (this.isPaused)
        return null;
      this.isLoadingMore = true;
      this.requestCount++;
      console.log("[Danmaku] 请求加载更多评论, 次数:", this.requestCount);
      return new Promise((resolve) => {
        this.$emit("loadMore", {
          requestIndex: this.requestCount,
          callback: (result) => {
            if (this.isPaused) {
              console.log("[Danmaku] 已暂停，忽略加载结果");
              this.isLoadingMore = false;
              resolve(null);
              return;
            }
            if (result && result.alreadyLoaded) {
              this.isLoadingMore = false;
              resolve(result.allComments);
            } else if (result && result.length > 0) {
              this.isLoadingMore = false;
              resolve(result);
            } else {
              this.isLoadingMore = false;
              resolve(null);
            }
          }
        });
      });
    },
    removeAtSymbol(name) {
      if (!name)
        return "";
      return name.replace(/^@/, "");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.visible && $data.localDanmakuList.length > 0
  }, $props.visible && $data.localDanmakuList.length > 0 ? {
    b: common_vendor.f($data.activeDanmaku, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.userName || "用户"),
        b: common_vendor.t(item.text),
        c: item.uniqueId,
        d: item.position + "%",
        e: item.duration + "s",
        f: common_vendor.o(($event) => $options.onDanmakuEnd(item.uniqueId), item.uniqueId)
      };
    }),
    c: $props.darkMode ? 1 : "",
    d: $data.isPaused ? 1 : ""
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-79ac768a"]]);
wx.createComponent(Component);
