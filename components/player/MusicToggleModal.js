"use strict";
const common_vendor = require("../../common/vendor.js");
const services_api = require("../../services/api.js");
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
    }
  },
  emits: ["close", "confirm", "preview"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
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
      emit("preview", song);
    };
    const showSongDetail = (song) => {
      var _a;
      console.log("[MusicToggleModal] 显示歌曲详情:", song);
      common_vendor.index.showModal({
        title: "歌曲详情",
        content: `歌名: ${song.name}
歌手: ${formatSinger(song.singer || song.artists)}
专辑: ${song.albumName || ((_a = song.album) == null ? void 0 : _a.name) || "未知"}
音源: ${getSourceName(song.source)}
时长: ${song.interval || formatDuration(song.duration)}`,
        showCancel: false
      });
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
        b: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        c: common_vendor.o(closeModal),
        d: !loading.value && sourceList.value.length > 0
      }, !loading.value && sourceList.value.length > 0 ? {
        e: common_vendor.f(sourceList.value, (source, k0, i0) => {
          return {
            a: common_vendor.t(source.name),
            b: source.id,
            c: currentSource.value === source.id ? 1 : "",
            d: common_vendor.o(($event) => switchSource(source.id), source.id)
          };
        })
      } : {}, {
        f: loading.value
      }, loading.value ? {} : error.value ? {
        h: common_vendor.o(retrySearch)
      } : !loading.value && searchResults.value.length > 0 ? {
        j: common_vendor.f(searchResults.value, (song, index, i0) => {
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
            g: "4b5696e1-1-" + i0,
            h: common_vendor.o(($event) => previewSong(song), song.id || index),
            i: "4b5696e1-2-" + i0,
            j: common_vendor.o(($event) => showSongDetail(song), song.id || index),
            k: song.id || index,
            l: selectedSong.value && selectedSong.value.id === song.id ? 1 : "",
            m: common_vendor.o(($event) => selectSong(song), song.id || index)
          });
        }),
        k: common_vendor.p({
          type: "fas",
          name: "play",
          size: "16",
          color: "#666"
        }),
        l: common_vendor.p({
          type: "fas",
          name: "circle-info",
          size: "16",
          color: "#666"
        })
      } : !loading.value && !error.value && searchResults.value.length === 0 ? {} : {}, {
        g: error.value,
        i: !loading.value && searchResults.value.length > 0,
        m: !loading.value && !error.value && searchResults.value.length === 0,
        n: __props.originalSong
      }, __props.originalSong ? common_vendor.e({
        o: common_vendor.t(__props.originalSong.name),
        p: common_vendor.t(getSourceName(__props.originalSong.source)),
        q: common_vendor.t(__props.originalSong.interval || formatDuration(__props.originalSong.duration)),
        r: common_vendor.t(formatSinger(__props.originalSong.singer || __props.originalSong.artists)),
        s: selectedSong.value
      }, selectedSong.value ? {
        t: common_vendor.t(selectedSong.value.name),
        v: common_vendor.t(getSourceName(selectedSong.value.source)),
        w: common_vendor.t(selectedSong.value.interval || formatDuration(selectedSong.value.duration)),
        x: common_vendor.t(formatSinger(selectedSong.value.singer || selectedSong.value.artists))
      } : {}, {
        y: !selectedSong.value || selectedSong.value.id === __props.originalSong.id ? 1 : "",
        z: common_vendor.o(confirmToggle)
      }) : {}, {
        A: __props.darkMode ? 1 : "",
        B: common_vendor.o(() => {
        }),
        C: common_vendor.o(closeModal)
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4b5696e1"]]);
wx.createComponent(Component);
