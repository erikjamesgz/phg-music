"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  __name: "VirtualList",
  props: {
    items: {
      type: Array,
      default: () => []
    },
    itemHeight: {
      type: Number,
      default: 60
    },
    height: {
      type: String,
      default: "100%"
    },
    bufferSize: {
      type: Number,
      default: 5
    },
    itemKey: {
      type: [String, Function],
      default: "id"
    },
    loading: {
      type: Boolean,
      default: false
    },
    scrollWithAnimation: {
      type: Boolean,
      default: false
    },
    lowerThreshold: {
      type: Number,
      default: 50
    },
    currentPlayIndex: {
      type: Number,
      default: -1
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    bottomSafeHeight: {
      type: Number,
      default: 0
    },
    showMoreButton: {
      type: Boolean,
      default: true
    },
    showTopRadius: {
      type: Boolean,
      default: false
    }
  },
  emits: ["scroll", "scrolltolower", "item-click", "more-click"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const instance = common_vendor.getCurrentInstance();
    const scrollTopValue = common_vendor.ref(0);
    const viewportHeight = common_vendor.ref(0);
    const scrollTop = common_vendor.ref(0);
    const forceScrollFlag = common_vendor.ref(0);
    const actualItemHeight = common_vendor.ref(props.itemHeight);
    const computedScrollTop = common_vendor.computed(() => {
      forceScrollFlag.value;
      return scrollTopValue.value;
    });
    const startIndex = common_vendor.computed(() => {
      const index = Math.floor(scrollTop.value / actualItemHeight.value) - props.bufferSize;
      return Math.max(0, index);
    });
    const endIndex = common_vendor.computed(() => {
      const visibleCount = Math.ceil(viewportHeight.value / actualItemHeight.value);
      const index = startIndex.value + visibleCount + props.bufferSize * 2;
      return Math.min(props.items.length, index);
    });
    const visibleItems = common_vendor.computed(() => {
      return props.items.slice(startIndex.value, endIndex.value);
    });
    const topPlaceholderHeight = common_vendor.computed(() => {
      return startIndex.value * actualItemHeight.value;
    });
    const bottomPlaceholderHeight = common_vendor.computed(() => {
      const remainingCount = props.items.length - endIndex.value;
      const listBottomHeight = Math.max(0, remainingCount * actualItemHeight.value);
      return listBottomHeight + props.bottomSafeHeight;
    });
    const listHeight = common_vendor.computed(() => props.height);
    const getItemKey = (item, index) => {
      if (typeof props.itemKey === "function") {
        return props.itemKey(item, index);
      }
      return item[props.itemKey] || index;
    };
    const getItemId = (index) => {
      return `virtual-item-${index}`;
    };
    const onScroll = (e) => {
      scrollTop.value = e.detail.scrollTop;
      emit("scroll", e);
    };
    const onScrollToLower = () => {
      emit("scrolltolower");
    };
    const onItemClick = (index, item) => {
      emit("item-click", { index, item });
    };
    const onMoreClick = (index, item) => {
      emit("more-click", { index, item });
    };
    const scrollToIndex = (index, animated = true) => {
      if (index < 0 || index >= props.items.length) {
        console.warn("[VirtualList] scrollToIndex: 索引超出范围", index);
        return;
      }
      console.log("[VirtualList] scrollToIndex:", index, "actualItemHeight:", actualItemHeight.value);
      const targetTop = index * actualItemHeight.value;
      console.log("[VirtualList] 计算滚动位置:", targetTop, "当前scrollTop:", scrollTop.value);
      forceScrollFlag.value++;
      scrollTopValue.value = targetTop;
      console.log("[VirtualList] 已设置 scrollTopValue:", targetTop, "forceScrollFlag:", forceScrollFlag.value);
    };
    const scrollTo = (scrollTop2, animated = true) => {
      forceScrollFlag.value++;
      scrollTopValue.value = scrollTop2;
    };
    const getVisibleRange = () => {
      return {
        start: startIndex.value,
        end: endIndex.value
      };
    };
    const isCurrentPlaying = (index) => {
      return props.currentPlayIndex === index;
    };
    const formatSinger = (singers, nameKey = "name", join = "、") => {
      if (!singers)
        return "未知歌手";
      if (Array.isArray(singers)) {
        const singer = [];
        singers.forEach((item) => {
          let name = item[nameKey];
          if (!name)
            return;
          singer.push(name);
        });
        return singer.length > 0 ? singer.join(join) : "未知歌手";
      }
      return String(singers || "未知歌手");
    };
    const formatDuration = (duration) => {
      if (!duration)
        return "00:00";
      if (typeof duration === "string" && duration.includes(":")) {
        return duration;
      }
      let dt = Number(duration);
      if (isNaN(dt))
        return "00:00";
      let seconds;
      if (dt > 3600) {
        seconds = Math.floor(dt / 1e3);
      } else {
        seconds = Math.floor(dt);
      }
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    };
    const hasHighQuality = (song) => {
      return song.quality === "SQ" || song.sq || song.h || song.hr || song.types && song.types.some((t) => t.type === "SQ");
    };
    common_vendor.watch(() => props.items.length, (newLen, oldLen) => {
      console.log("[VirtualList] 列表长度变化:", oldLen, "->", newLen);
    });
    __expose({
      scrollToIndex,
      scrollTo,
      getVisibleRange
    });
    common_vendor.onMounted(() => {
      setTimeout(() => {
        const query = common_vendor.index.createSelectorQuery().in(instance);
        query.select(".virtual-list").boundingClientRect((rect) => {
          if (rect) {
            viewportHeight.value = rect.height;
            console.log("[VirtualList] 视口高度:", viewportHeight.value);
          }
        }).exec();
        setTimeout(() => {
          const itemQuery = common_vendor.index.createSelectorQuery().in(instance);
          itemQuery.select(".song-item").boundingClientRect((itemRect) => {
            if (itemRect && itemRect.height > 0) {
              actualItemHeight.value = itemRect.height;
              console.log("[VirtualList] 实际项目高度:", itemRect.height, "px");
            } else {
              console.log("[VirtualList] 使用默认项目高度:", props.itemHeight);
            }
          }).exec();
        }, 200);
      }, 100);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: topPlaceholderHeight.value + "px",
        b: common_vendor.f(visibleItems.value, (item, i, i0) => {
          var _a, _b, _c;
          return common_vendor.e({
            a: common_vendor.t(startIndex.value + i + 1),
            b: common_vendor.t(item.name),
            c: hasHighQuality(item)
          }, hasHighQuality(item) ? {} : {}, {
            d: common_vendor.t(formatSinger(item.ar || item.singer)),
            e: ((_a = item.al) == null ? void 0 : _a.name) || item.album || item.albumName
          }, ((_b = item.al) == null ? void 0 : _b.name) || item.album || item.albumName ? {
            f: common_vendor.t(((_c = item.al) == null ? void 0 : _c.name) || item.album || item.albumName)
          } : {}, {
            g: isCurrentPlaying(startIndex.value + i) && __props.isPlaying
          }, isCurrentPlaying(startIndex.value + i) && __props.isPlaying ? {
            h: "9a1771e2-0-" + i0,
            i: common_vendor.p({
              name: "play",
              size: "18"
            })
          } : {}, {
            j: common_vendor.t(formatDuration(item.dt || item.interval || item.duration))
          }, __props.showMoreButton ? {
            k: "9a1771e2-1-" + i0,
            l: common_vendor.p({
              name: "ellipsis-vertical",
              size: "18"
            }),
            m: common_vendor.o(($event) => onMoreClick(startIndex.value + i, item), getItemKey(item, i))
          } : {}, {
            n: getItemKey(item, i),
            o: getItemId(startIndex.value + i),
            p: isCurrentPlaying(startIndex.value + i) ? 1 : "",
            q: common_vendor.o(($event) => onItemClick(startIndex.value + i, item), getItemKey(item, i))
          });
        }),
        c: __props.showMoreButton,
        d: __props.darkMode ? 1 : "",
        e: bottomPlaceholderHeight.value + "px",
        f: __props.items.length === 0 && !__props.loading
      }, __props.items.length === 0 && !__props.loading ? {
        g: common_vendor.p({
          name: "music",
          size: "48",
          color: __props.darkMode ? "#666" : "#ccc"
        }),
        h: __props.darkMode ? "#666" : "#999",
        i: __props.darkMode ? "#555" : "#ccc"
      } : {}, {
        j: __props.loading
      }, __props.loading ? {} : {}, {
        k: __props.showTopRadius ? 1 : "",
        l: __props.darkMode ? 1 : "",
        m: listHeight.value,
        n: common_vendor.o(onScroll),
        o: computedScrollTop.value,
        p: __props.scrollWithAnimation,
        q: __props.lowerThreshold,
        r: common_vendor.o(onScrollToLower)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9a1771e2"]]);
wx.createComponent(Component);
