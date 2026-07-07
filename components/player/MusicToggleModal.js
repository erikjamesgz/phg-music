"use strict";
const common_vendor = require("../../common/vendor.js");
const services_api = require("../../services/api.js");
const utils_system = require("../../utils/system.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  __name: "MusicToggleModal",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    originalSong: {
      type: Object,
      default: null
    },
    listId: {
      type: String,
      default: ""
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    bottomSafeHeight: {
      type: Number,
      default: 0
    },
    isTablet: {
      type: Boolean,
      default: false
    },
    // 是否启用顶部安全区域适配（只在特定页面需要，如 playlist 竖屏模式）
    enableTopSafeArea: {
      type: Boolean,
      default: false
    }
  },
  emits: ["close", "confirm", "preview"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const screenWidth = common_vendor.ref(375);
    const screenHeight = common_vendor.ref(667);
    const scaleRatio = common_vendor.ref(1);
    const safeAreaTopHeight = common_vendor.computed(() => {
      console.log("[MusicToggleModal] safeAreaTopHeight 计算:", {
        enableTopSafeArea: props.enableTopSafeArea,
        isTablet: props.isTablet,
        scaleRatio: scaleRatio.value
      });
      if (!props.enableTopSafeArea) {
        console.log("[MusicToggleModal] safeAreaTopArea - 未启用，返回0");
        return 0;
      }
      const navbarH = utils_system.getNavbarHeight();
      console.log("[MusicToggleModal] safeAreaTopHeight - 已启用，导航栏高度:", navbarH);
      return navbarH;
    });
    const tabletModalSafeTop = common_vendor.computed(() => {
      if (!props.isTablet)
        return "0px";
      return `${utils_system.getNavbarHeight()}px`;
    });
    const containerStyle = common_vendor.computed(() => {
      console.log("[MusicToggleModal] containerStyle 计算:", {
        scaleRatio: scaleRatio.value,
        isTablet: props.isTablet,
        bottomSafeHeight: props.bottomSafeHeight
      });
      if (props.isTablet || scaleRatio.value < 1) {
        console.log("[MusicToggleModal] containerStyle - 平板/大屏模式，使用默认样式");
        return "";
      }
      const safeHeight = props.bottomSafeHeight || 0;
      const topPadding = props.enableTopSafeArea ? utils_system.getNavbarHeight() : 0;
      return `
    height: auto;
    max-height: none;
    padding-top: ${topPadding}px;
    padding-bottom: ${Math.max(0, safeHeight)}px;
  `;
    });
    const resultListMaxHeight = common_vendor.computed(() => {
      if (props.isTablet || scaleRatio.value < 1)
        return "none";
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const windowHeight = systemInfo.windowHeight || systemInfo.screenHeight || 667;
        const topSafe = props.enableTopSafeArea ? utils_system.getNavbarHeight() : 44;
        const headerH = 50;
        const tabsH = 45;
        const compareH = 120;
        const btnH = 55;
        const bottomSafe = props.bottomSafeHeight || 0;
        const availableHeight = windowHeight - topSafe - headerH - tabsH - compareH - btnH - bottomSafe - 40;
        const max4Items = 288;
        console.log("[MusicToggleModal] 列表最大高度:", availableHeight, "px, 限制:", max4Items, "px, 结果数:", searchResults.value.length);
        return `${Math.min(Math.max(availableHeight, 72), max4Items)}px`;
      } catch (e) {
        return "300px";
      }
    });
    common_vendor.computed(() => {
      if (scaleRatio.value === 1) {
        const safeHeight = props.bottomSafeHeight || 0;
        console.log("[MusicToggleModal] modalStyle 竖屏模式:", { bottomSafeHeight: safeHeight });
        return `max-height: calc(100vh - ${safeHeight}px); height: auto;`;
      }
      let maxHeight;
      if (scaleRatio.value <= 0.4) {
        maxHeight = 140;
      } else if (scaleRatio.value <= 0.5) {
        maxHeight = 130;
      } else if (scaleRatio.value <= 0.7) {
        maxHeight = 120;
      } else if (scaleRatio.value <= 0.85) {
        maxHeight = 105;
      } else {
        maxHeight = 100;
      }
      return `zoom: ${scaleRatio.value}; max-height: ${maxHeight}vh;`;
    });
    const compareSectionStyle = common_vendor.computed(() => {
      console.log("[MusicToggleModal] compareSectionStyle 计算:", {
        scaleRatio: scaleRatio.value,
        isTablet: props.isTablet,
        bottomSafeHeight: props.bottomSafeHeight
      });
      if (!props.isTablet && scaleRatio.value === 1) {
        console.log("[MusicToggleModal] compareSectionStyle - 竖屏模式，由 containerStyle 处理");
        return "";
      }
      let safeHeight = props.bottomSafeHeight;
      if (safeHeight > 100) {
        try {
          const systemInfo = common_vendor.index.getSystemInfoSync();
          const isIOS = systemInfo.platform === "ios";
          safeHeight -= isIOS ? 62 : 67;
        } catch (e) {
          safeHeight -= 65;
        }
      }
      const basePadding = Math.max(20, safeHeight);
      const paddingBottom = scaleRatio.value < 1 ? Math.ceil(basePadding / scaleRatio.value) : basePadding;
      console.log("[MusicToggleModal] compareSectionStyle - 大屏模式, paddingBottom:", paddingBottom);
      return `padding-bottom: ${paddingBottom}px;`;
    });
    const checkScreenSize = () => {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        screenWidth.value = systemInfo.screenWidth;
        screenHeight.value = systemInfo.screenHeight;
        const screenRatio = systemInfo.screenWidth / systemInfo.screenHeight;
        if (props.isTablet) {
          scaleRatio.value = 0.5;
        } else if (screenRatio >= 0.85) {
          scaleRatio.value = 1;
        } else if (systemInfo.screenWidth >= 1024) {
          scaleRatio.value = 0.4;
        } else if (systemInfo.screenWidth >= 768) {
          scaleRatio.value = 0.5;
        } else if (systemInfo.screenWidth >= 500) {
          scaleRatio.value = 0.7;
        } else if (systemInfo.screenWidth >= 430 && systemInfo.screenWidth <= 460 && systemInfo.screenHeight >= 700 && systemInfo.screenHeight <= 720) {
          scaleRatio.value = 0.85;
        } else {
          scaleRatio.value = 1;
        }
        console.log("[MusicToggleModal] 屏幕尺寸:", systemInfo.screenWidth, "x", systemInfo.screenHeight, "宽高比:", screenRatio.toFixed(3), "弹窗宽度比例:", scaleRatio.value, "isTablet:", props.isTablet);
      } catch (e) {
        console.error("[MusicToggleModal] 获取屏幕尺寸失败:", e);
      }
    };
    common_vendor.onMounted(() => {
      checkScreenSize();
    });
    const sourceList = common_vendor.ref([
      { id: "kw", name: "酷我" },
      { id: "kg", name: "酷狗" },
      { id: "tx", name: "QQ" },
      { id: "wy", name: "网易" },
      { id: "mg", name: "咪咕" }
    ]);
    const currentSource = common_vendor.ref("");
    const searchResults = common_vendor.ref([]);
    const allSearchResults = common_vendor.ref({});
    const loading = common_vendor.ref(false);
    const error = common_vendor.ref(false);
    const selectedSong = common_vendor.ref(null);
    const hasSearched = common_vendor.ref(false);
    common_vendor.watch([() => props.visible, () => props.originalSong], ([newVisible, newSong]) => {
      console.log("[MusicToggleModal] visible变化:", newVisible, "originalSong:", newSong == null ? void 0 : newSong.name);
      if (newVisible && newSong && !hasSearched.value) {
        console.log("[MusicToggleModal] 触发搜索");
        hasSearched.value = true;
        sourceList.value = [
          { id: "kw", name: "酷我" },
          { id: "kg", name: "酷狗" },
          { id: "tx", name: "QQ" },
          { id: "wy", name: "网易" },
          { id: "mg", name: "咪咕" }
        ];
        startSearch();
      }
    }, { immediate: true });
    common_vendor.watch(() => props.visible, (newVal) => {
      if (!newVal) {
        hasSearched.value = false;
      }
    });
    const startSearch = async () => {
      if (!props.originalSong)
        return;
      loading.value = true;
      error.value = false;
      searchResults.value = [];
      allSearchResults.value = {};
      selectedSong.value = null;
      currentSource.value = "";
      try {
        const { name, singer } = props.originalSong;
        const singerName = formatSingerForSearch(singer || props.originalSong.artists);
        const keyword = `${name} ${singerName}`.trim();
        console.log("[MusicToggleModal] 开始搜索:", keyword);
        const searchTasks = sourceList.value.map(async (source) => {
          try {
            const result = await searchSourceSongs(source.id, keyword);
            if (result && result.length > 0) {
              allSearchResults.value[source.id] = result;
              return { source: source.id, list: result };
            }
            return null;
          } catch (err) {
            console.error(`[MusicToggleModal] ${source.name}搜索失败:`, err);
            return null;
          }
        });
        const results = await Promise.all(searchTasks);
        const validResults = results.filter((r) => r !== null);
        console.log("[MusicToggleModal] 搜索结果:", validResults.length, "个音源有数据");
        if (validResults.length > 0) {
          currentSource.value = validResults[0].source;
          searchResults.value = validResults[0].list;
        }
        const availableSources = sourceList.value.filter((s) => allSearchResults.value[s.id] && allSearchResults.value[s.id].length > 0);
        console.log("[MusicToggleModal] 有结果的音源:", availableSources.map((s) => s.name));
        if (availableSources.length > 0) {
          sourceList.value = availableSources;
        }
      } catch (err) {
        console.error("[MusicToggleModal] 搜索失败:", err);
        error.value = true;
      } finally {
        loading.value = false;
      }
    };
    const searchSourceSongs = async (source, keyword) => {
      try {
        console.log(`[MusicToggleModal] 开始搜索音源: ${source}, 关键词: ${keyword}`);
        const result = await services_api.searchApi.searchSongs(keyword, source, 1, 25);
        console.log(`[MusicToggleModal] ${source} 搜索结果:`, result);
        if (result && result.list && result.list.length > 0) {
          console.log(`[MusicToggleModal] ${source} 找到 ${result.list.length} 首歌曲`);
          const sortedList = matchAndSortSongs(result.list, props.originalSong);
          console.log(`[MusicToggleModal] ${source} 排序后 ${sortedList.length} 首歌曲`);
          return sortedList;
        }
        console.log(`[MusicToggleModal] ${source} 没有搜索结果`);
        return [];
      } catch (err) {
        console.error(`[MusicToggleModal] 搜索${source}失败:`, err);
        console.error(`[MusicToggleModal] 错误详情:`, err.message);
        return [];
      }
    };
    const matchAndSortSongs = (list, originalSong) => {
      const { name, singer, albumName, interval, duration } = originalSong;
      const formatSingerForCompare = (singerData) => {
        if (!singerData)
          return "";
        if (typeof singerData === "string")
          return singerData;
        if (Array.isArray(singerData)) {
          return singerData.map((s) => typeof s === "string" ? s : s.name).join("、");
        }
        return singerData.name || "";
      };
      const originalSinger = formatSingerForCompare(singer || originalSong.artists);
      const originalAlbum = albumName || originalSong.album && originalSong.album.name || "";
      const originalInterval = interval || formatDuration(duration);
      const filterStr = (str) => {
        if (typeof str !== "string")
          return String(str || "");
        return str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[!！/g, "").toLowerCase();
      };
      const fOriginalName = filterStr(name);
      const fOriginalSinger = filterStr(originalSinger);
      const parseInterval = (intv) => {
        if (!intv)
          return 0;
        const parts = String(intv).split(":");
        let seconds = 0;
        let unit = 1;
        while (parts.length) {
          seconds += parseInt(parts.pop()) * unit;
          unit *= 60;
        }
        return seconds;
      };
      const originalIntvSeconds = parseInterval(originalInterval);
      const calculateMatchScore = (item) => {
        let score = 0;
        const itemName = filterStr(item.name);
        const itemSinger = filterStr(formatSingerForCompare(item.singer || item.artists));
        const itemAlbum = filterStr(item.albumName || item.album && item.album.name || "");
        const itemIntv = parseInterval(item.interval || formatDuration(item.duration));
        if (itemName === fOriginalName)
          score += 100;
        else if (itemName.includes(fOriginalName) || fOriginalName.includes(itemName))
          score += 50;
        if (itemSinger === fOriginalSinger)
          score += 80;
        else if (itemSinger.includes(fOriginalSinger) || fOriginalSinger.includes(itemSinger))
          score += 40;
        if (itemAlbum && originalAlbum) {
          if (itemAlbum === filterStr(originalAlbum))
            score += 30;
          else if (itemAlbum.includes(filterStr(originalAlbum)) || filterStr(originalAlbum).includes(itemAlbum))
            score += 15;
        }
        if (originalIntvSeconds > 0 && itemIntv > 0) {
          const diff = Math.abs(originalIntvSeconds - itemIntv);
          if (diff < 5)
            score += 20;
          else if (diff < 10)
            score += 10;
        }
        return score;
      };
      const scoredList = list.map((item) => ({
        ...item,
        matchScore: calculateMatchScore(item)
      }));
      scoredList.sort((a, b) => b.matchScore - a.matchScore);
      return scoredList.slice(0, 15);
    };
    const switchSource = (sourceId) => {
      currentSource.value = sourceId;
      searchResults.value = allSearchResults.value[sourceId] || [];
      console.log("[MusicToggleModal] 切换到音源:", sourceId, "结果数:", searchResults.value.length);
    };
    const selectSong = (song) => {
      selectedSong.value = song;
      console.log("[MusicToggleModal] 选中歌曲:", song.name, song.source);
    };
    const previewSong = (song) => {
      console.log("[MusicToggleModal] 预览歌曲:", song.name);
      selectedSong.value = song;
      emit("preview", song);
    };
    const confirmToggle = () => {
      if (!selectedSong.value || selectedSong.value.id === props.originalSong.id) {
        return;
      }
      console.log("[MusicToggleModal] 确认换源:", {
        from: props.originalSong,
        to: selectedSong.value
      });
      emit("confirm", {
        originalSong: props.originalSong,
        newSong: selectedSong.value,
        listId: props.listId
      });
      closeModal();
    };
    const closeModal = () => {
      emit("close");
    };
    const retrySearch = () => {
      startSearch();
    };
    const formatSinger = (singerData) => {
      if (!singerData)
        return "未知歌手";
      if (typeof singerData === "string")
        return singerData;
      if (Array.isArray(singerData)) {
        return singerData.map((s) => typeof s === "string" ? s : s.name).filter(Boolean).join(" / ");
      }
      return singerData.name || "未知歌手";
    };
    const formatSingerForSearch = (singerData) => {
      if (!singerData)
        return "";
      if (typeof singerData === "string")
        return singerData;
      if (Array.isArray(singerData)) {
        return singerData.map((s) => typeof s === "string" ? s : s.name).filter(Boolean).join(" ");
      }
      return singerData.name || "";
    };
    const formatDuration = (duration) => {
      if (!duration && duration !== 0)
        return "00:00";
      let totalSeconds = Math.floor(duration / 1e3);
      if (isNaN(totalSeconds))
        totalSeconds = 0;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };
    const getSourceName = (source) => {
      const sourceMap = {
        "kw": "酷我",
        "kg": "酷狗",
        "tx": "QQ",
        "wy": "网易",
        "mg": "咪咕"
      };
      return sourceMap[source] || source;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: !__props.isTablet && scaleRatio.value === 1 && __props.enableTopSafeArea
      }, !__props.isTablet && scaleRatio.value === 1 && __props.enableTopSafeArea ? {
        c: safeAreaTopHeight.value + "px"
      } : {}, {
        d: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        e: common_vendor.o(closeModal, "b1"),
        f: !loading.value && sourceList.value.length > 0
      }, !loading.value && sourceList.value.length > 0 ? {
        g: common_vendor.f(sourceList.value, (source, k0, i0) => {
          return {
            a: common_vendor.t(source.name),
            b: source.id,
            c: currentSource.value === source.id ? 1 : "",
            d: common_vendor.o(($event) => switchSource(source.id), source.id)
          };
        })
      } : {}, {
        h: loading.value
      }, loading.value ? {} : error.value ? {
        j: common_vendor.o(retrySearch, "0a")
      } : !loading.value && searchResults.value.length > 0 ? {
        l: common_vendor.f(searchResults.value, (song, index, i0) => {
          var _a;
          return common_vendor.e({
            a: common_vendor.t(song.name),
            b: common_vendor.t(formatSinger(song.singer || song.artists)),
            c: song.albumName || song.album && song.album.name
          }, song.albumName || song.album && song.album.name ? {
            d: common_vendor.t(song.albumName || ((_a = song.album) == null ? void 0 : _a.name))
          } : {}, {
            e: common_vendor.t(getSourceName(song.source)),
            f: common_vendor.t(song.interval || formatDuration(song.duration)),
            g: "013d7be0-1-" + i0,
            h: common_vendor.o(($event) => previewSong(song), song.id || index),
            i: song.id || index,
            j: selectedSong.value && selectedSong.value.id === song.id ? 1 : "",
            k: common_vendor.o(($event) => selectSong(song), song.id || index)
          });
        }),
        m: common_vendor.p({
          type: "fas",
          name: "headphones",
          size: "16",
          color: "#666"
        }),
        n: resultListMaxHeight.value
      } : !loading.value && !error.value && searchResults.value.length === 0 ? {} : {}, {
        i: error.value,
        k: !loading.value && searchResults.value.length > 0,
        o: !loading.value && !error.value && searchResults.value.length === 0,
        p: __props.originalSong
      }, __props.originalSong ? common_vendor.e({
        q: common_vendor.t(__props.originalSong.name),
        r: common_vendor.t(getSourceName(__props.originalSong.source)),
        s: common_vendor.t(__props.originalSong.interval || formatDuration(__props.originalSong.duration)),
        t: common_vendor.t(formatSinger(__props.originalSong.singer || __props.originalSong.artists)),
        v: selectedSong.value
      }, selectedSong.value ? {
        w: common_vendor.t(selectedSong.value.name),
        x: common_vendor.t(getSourceName(selectedSong.value.source)),
        y: common_vendor.t(selectedSong.value.interval || formatDuration(selectedSong.value.duration)),
        z: common_vendor.t(formatSinger(selectedSong.value.singer || selectedSong.value.artists))
      } : {}, {
        A: !selectedSong.value || selectedSong.value.id === __props.originalSong.id ? 1 : "",
        B: common_vendor.o(confirmToggle, "29"),
        C: common_vendor.s(compareSectionStyle.value)
      }) : {}, {
        D: __props.darkMode ? 1 : "",
        E: scaleRatio.value < 1 ? 1 : "",
        F: __props.isTablet ? 1 : "",
        G: common_vendor.s(__props.isTablet ? {
          paddingTop: tabletModalSafeTop.value
        } : containerStyle.value),
        H: common_vendor.o(() => {
        }, "c4"),
        I: __props.isTablet ? 1 : "",
        J: common_vendor.o(closeModal, "98")
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-013d7be0"]]);
wx.createComponent(Component);
