"use strict";
const common_vendor = require("./common/vendor.js");
const common_assets = require("./common/assets.js");
require("./store/modules/list.js");
const store_modules_player = require("./store/modules/player.js");
const services_api = require("./services/api.js");
const utils_storage = require("./utils/storage.js");
const utils_system = require("./utils/system.js");
const utils_imageProxy = require("./utils/imageProxy.js");
const utils_playSong = require("./utils/playSong.js");
const composables_usePageLifecycle = require("./composables/usePageLifecycle.js");
const composables_useBottomHeight = require("./composables/useBottomHeight.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = /* @__PURE__ */ Object.assign({
  components: {
    RocIconPlus
  }
}, {
  __name: "index",
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  setup(__props) {
    const props = __props;
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const shouldFocus = common_vendor.ref(false);
    common_vendor.ref(false);
    const currentPage = common_vendor.ref(1);
    const searchKeyword = common_vendor.ref("");
    const hasSearched = common_vendor.ref(false);
    const isLoading = common_vendor.ref(false);
    const isRefreshing = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const currentType = common_vendor.ref("songs");
    common_vendor.ref("");
    const searchHistory = common_vendor.ref([]);
    const hotSearches = common_vendor.ref([]);
    const searchSuggestions = common_vendor.ref([]);
    const darkMode = common_vendor.ref(false);
    const { bottomPaddingStyle, totalBottomHeight } = composables_useBottomHeight.useBottomHeight();
    const safeBottomStyle = common_vendor.computed(() => {
      return {
        height: `${totalBottomHeight.value}px`
      };
    });
    const searchResult = common_vendor.reactive({
      songs: [],
      playlists: []
    });
    const searchError = common_vendor.ref(null);
    composables_usePageLifecycle.usePageLifecycle(
      () => props.isActive,
      {
        onInit: () => {
          console.log("[Search] 页面初始化");
          loadSearchHistory();
          getHotSearches();
        },
        onActivated: () => {
          console.log("[Search] 页面激活");
          darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
          console.log("[Search] 暗黑模式:", darkMode.value);
          setTimeout(() => {
            try {
              common_vendor.wx$1.setNavigationBarColor({
                frontColor: darkMode.value ? "#ffffff" : "#000000",
                backgroundColor: darkMode.value ? "#1f2937" : "#ffffff",
                animation: {
                  duration: 300,
                  timingFunc: "easeIn"
                },
                success: () => {
                  console.log("[Search] 状态栏颜色设置成功");
                },
                fail: (err) => {
                  console.error("[Search] 状态栏颜色设置失败:", err);
                }
              });
            } catch (e) {
              console.error("[Search] 设置状态栏颜色异常:", e);
            }
          }, 100);
          const isFromSearchBar = common_vendor.index.getStorageSync("fromSearchBar");
          console.log("[Search] isFromSearchBar:", isFromSearchBar);
          if (isFromSearchBar) {
            shouldFocus.value = true;
            common_vendor.index.removeStorageSync("fromSearchBar");
          }
          const keywordFromIndex = common_vendor.index.getStorageSync("searchKeywordFromIndex");
          if (keywordFromIndex) {
            console.log("[Search] 从首页热门歌手跳转，搜索关键词:", keywordFromIndex);
            common_vendor.index.removeStorageSync("searchKeywordFromIndex");
            searchKeyword.value = keywordFromIndex;
            searchSuggestions.value = [];
            onSearch();
          }
        },
        onDeactivated: () => {
          console.log("[Search] 页面停用");
          if (!hasSearched.value && !searchKeyword.value) {
            shouldFocus.value = false;
          }
        }
      }
    );
    const handleThemeChanged = (data) => {
      console.log("[Search] 收到主题变化事件:", data);
      darkMode.value = data.isDark;
      setTimeout(() => {
        try {
          common_vendor.wx$1.setNavigationBarColor({
            frontColor: data.isDark ? "#ffffff" : "#000000",
            backgroundColor: data.isDark ? "#1f2937" : "#ffffff",
            animation: { duration: 300, timingFunc: "easeIn" }
          });
        } catch (e) {
        }
      }, 100);
    };
    common_vendor.onMounted(() => {
      common_vendor.index.$on("themeChanged", handleThemeChanged);
      console.log("[Search] 已注册主题变化监听");
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("themeChanged", handleThemeChanged);
      console.log("[Search] 已移除主题变化监听");
    });
    const searchBarStyle = common_vendor.computed(() => {
      const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
      const paddingTop = ((menuButtonInfo == null ? void 0 : menuButtonInfo.top) || 0) + ((menuButtonInfo == null ? void 0 : menuButtonInfo.height) || 32);
      return { paddingTop: `${paddingTop}px` };
    });
    common_vendor.computed(() => common_vendor.index.getSystemInfoSync().platform === "ios");
    const searchTypes = [
      { label: "歌曲", value: "songs" },
      { label: "歌单", value: "playlists" }
    ];
    common_vendor.watch(currentType, (newType) => {
      if (searchKeyword.value && hasSearched.value) {
        search(searchKeyword.value);
      }
    });
    const isEmpty = common_vendor.computed(() => {
      if (currentType.value === "songs") {
        return searchResult.songs.length === 0;
      } else if (currentType.value === "playlists") {
        return searchResult.playlists.length === 0;
      }
      return true;
    });
    common_vendor.computed(() => {
      var _a;
      return (_a = store_modules_player.playerStore.state.currentSong) == null ? void 0 : _a.id;
    });
    common_vendor.watch(searchKeyword, (newVal) => {
      if (!newVal || newVal.trim() === "") {
        searchSuggestions.value = [];
        hasSearched.value = false;
      }
    });
    const loadSearchHistory = () => {
      try {
        const historyList = utils_storage.getStorage("searchHistory") || [];
        if (historyList.length > 0 && typeof historyList[0] === "string") {
          searchHistory.value = historyList.map((keyword, index) => ({
            id: index + 1,
            keyword,
            timestamp: Date.now() - index * 6e4
            // 模拟时间戳，越新的记录时间越近
          }));
          utils_storage.setStorage("searchHistory", searchHistory.value);
        } else {
          searchHistory.value = historyList;
        }
      } catch (error) {
        console.error("加载搜索历史失败:", error);
        searchHistory.value = [];
      }
    };
    const saveSearchHistory = (keyword) => {
      if (!keyword)
        return;
      const index = searchHistory.value.findIndex((item) => item.keyword === keyword);
      if (index !== -1) {
        searchHistory.value.splice(index, 1);
      }
      searchHistory.value.unshift({
        id: Date.now(),
        // 使用时间戳作为唯一ID
        keyword,
        timestamp: Date.now()
      });
      if (searchHistory.value.length > 10) {
        searchHistory.value = searchHistory.value.slice(0, 10);
      }
      utils_storage.setStorage("searchHistory", searchHistory.value);
    };
    const removeHistoryById = (id) => {
      const index = searchHistory.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        searchHistory.value.splice(index, 1);
        utils_storage.setStorage("searchHistory", searchHistory.value);
      }
    };
    const clearHistory = () => {
      searchHistory.value = [];
      utils_storage.setStorage("searchHistory", []);
    };
    const getHotSearches = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      try {
        common_vendor.index.showLoading({
          title: "加载中..."
        });
        const sourceNames = {
          wy: "网易云音乐",
          tx: "QQ音乐",
          kg: "酷狗音乐",
          kw: "酷我音乐",
          mg: "咪咕音乐",
          bd: "百度音乐"
        };
        const results = await Promise.allSettled([
          services_api.searchApi.getWyHotSearch(),
          services_api.searchApi.getTxHotSearch(),
          services_api.searchApi.getKgHotSearch(),
          services_api.searchApi.getKwHotSearch(),
          services_api.searchApi.getMgHotSearch()
        ]);
        const hotSearchList = [];
        let id = 1;
        if (results[0].status === "fulfilled" && ((_b = (_a = results[0].value) == null ? void 0 : _a.data) == null ? void 0 : _b.itemList)) {
          const wyList = results[0].value.data.itemList.slice(0, 10);
          wyList.forEach((item) => {
            hotSearchList.push({
              id: id++,
              searchWord: item.searchWord,
              score: item.score ? `${Math.floor(item.score / 1e4)}万+` : "热门",
              content: item.content || "",
              source: sourceNames.wy
            });
          });
        }
        if (results[1].status === "fulfilled" && ((_e = (_d = (_c = results[1].value) == null ? void 0 : _c.hotkey) == null ? void 0 : _d.data) == null ? void 0 : _e.vec_hotkey)) {
          const txList = results[1].value.hotkey.data.vec_hotkey.slice(0, 10);
          txList.forEach((item) => {
            hotSearchList.push({
              id: id++,
              searchWord: item.query,
              score: item.score ? `${Math.floor(item.score / 1e4)}万+` : "热门",
              content: item.description || "",
              source: sourceNames.tx
            });
          });
        }
        if (results[2].status === "fulfilled" && ((_g = (_f = results[2].value) == null ? void 0 : _f.data) == null ? void 0 : _g.info)) {
          const kgList = results[2].value.data.info.slice(0, 10);
          kgList.forEach((item) => {
            const songInfo = item.filename.split(" - ");
            const artistName = songInfo[0] || "";
            const songName = songInfo[1] || item.filename;
            let hotScore = "热门";
            if (item.filesize && item.filesize > 0) {
              hotScore = `${Math.floor(item.filesize / 1e5)}万+`;
            } else if (item.rank_count && item.rank_count > 0) {
              hotScore = `${item.rank_count}万+`;
            } else if (item.sort) {
              hotScore = `Top ${item.sort}`;
            }
            hotSearchList.push({
              id: id++,
              searchWord: songName,
              score: hotScore,
              content: artistName || "",
              source: sourceNames.kg
            });
          });
        }
        if (results[3].status === "fulfilled" && ((_h = results[3].value) == null ? void 0 : _h.tagvalue)) {
          const kwList = results[3].value.tagvalue.slice(0, 10);
          kwList.forEach((item, index) => {
            const hotScore = item.num ? `${Math.floor(item.num / 1e4)}万+` : `Top ${index + 1}`;
            hotSearchList.push({
              id: id++,
              searchWord: item.key,
              score: hotScore,
              content: "",
              source: sourceNames.kw
            });
          });
        }
        if (results[4].status === "fulfilled" && ((_l = (_k = (_j = (_i = results[4].value) == null ? void 0 : _i.data) == null ? void 0 : _j.hotwords) == null ? void 0 : _k[0]) == null ? void 0 : _l.hotwordList)) {
          const mgList = results[4].value.data.hotwords[0].hotwordList.filter((item) => item.resourceType === "song").slice(0, 10);
          mgList.forEach((item, index) => {
            const hotScore = item.searchCount ? `${Math.floor(item.searchCount / 1e4)}万+` : `Top ${index + 1}`;
            hotSearchList.push({
              id: id++,
              searchWord: item.word,
              score: hotScore,
              content: "",
              source: sourceNames.mg
            });
          });
        }
        if (hotSearchList.length === 0) {
          hotSearchList.push(
            { id: 1, searchWord: "周杰伦", score: "1200万+", content: "新歌《倒影》发布", source: "热搜榜" },
            { id: 2, searchWord: "林俊杰", score: "980万+", content: "演唱会门票开售", source: "热搜榜" },
            { id: 3, searchWord: "薛之谦", score: "870万+", content: "新专辑《渡》", source: "热搜榜" },
            { id: 4, searchWord: "华晨宇", score: "750万+", content: "火星演唱会", source: "热搜榜" },
            { id: 5, searchWord: "邓紫棋", score: "680万+", content: "新歌《超能力》", source: "热搜榜" },
            { id: 6, searchWord: "五月天", score: "590万+", content: "好好好想见到你演唱会", source: "热搜榜" }
          );
        }
        hotSearchList.sort(() => Math.random() - 0.5);
        hotSearches.value = hotSearchList.slice(0, 20);
        common_vendor.index.hideLoading();
      } catch (error) {
        console.error("获取热搜榜失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "获取热搜榜失败",
          icon: "none"
        });
      }
    };
    const getSuggestions = async (keyword) => {
      if (!keyword)
        return;
      try {
        const suggestions = await services_api.searchApi.getSuggestions(keyword);
        if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
          searchSuggestions.value = suggestions;
        } else {
          searchSuggestions.value = [
            `${keyword}的歌`,
            `${keyword}的专辑`,
            `${keyword}的MV`,
            `关于${keyword}的歌单`
          ];
        }
      } catch (error) {
        console.error("获取搜索建议失败:", error);
        searchSuggestions.value = [
          `${keyword}的歌`,
          `${keyword}的专辑`,
          `${keyword}的MV`,
          `关于${keyword}的歌单`
        ];
      }
    };
    const search = async (keyword) => {
      console.log("[SearchPage] ========== search函数被调用 ==========");
      console.log("[SearchPage] 搜索关键词:", keyword);
      console.log("[SearchPage] 当前搜索类型:", currentType.value);
      if (!keyword)
        return;
      hasSearched.value = true;
      isLoading.value = true;
      currentPage.value = 1;
      hasMore.value = true;
      searchError.value = null;
      searchResult.songs = [];
      searchResult.playlists = [];
      saveSearchHistory(keyword);
      try {
        console.log("[SearchPage] 开始搜索，关键词:", keyword, "搜索类型:", currentType.value);
        switch (currentType.value) {
          case "songs":
            const sources = ["kw", "kg", "tx", "wy", "mg"];
            const sourceNames = {
              kw: "酷我",
              kg: "酷狗",
              tx: "QQ",
              wy: "网易",
              mg: "咪咕"
            };
            const searchPromises = sources.map((source) => {
              return services_api.searchApi.searchSongs(keyword, source, currentPage.value, 20).catch((err) => {
                console.error(`${sourceNames[source]}搜索失败:`, err);
                return { source, list: [] };
              });
            });
            const results = await Promise.all(searchPromises);
            let allSongs = [];
            for (const result of results) {
              if (result && result.list && result.list.length > 0) {
                const songsWithSource = result.list.map((song) => {
                  let cleanedSong = { ...song };
                  if (result.source === "kg") {
                    if (cleanedSong.name) {
                      cleanedSong.name = cleanedSong.name.replace(/<[^>]*>?/gm, "");
                    }
                    if (cleanedSong.artists && Array.isArray(cleanedSong.artists)) {
                      cleanedSong.artists = cleanedSong.artists.map((artist) => ({
                        ...artist,
                        name: artist.name ? artist.name.replace(/<[^>]*>?/gm, "") : ""
                      }));
                    } else if (cleanedSong.singer) {
                      cleanedSong.singer = cleanedSong.singer.replace(/<[^>]*>?/gm, "");
                    }
                  }
                  return {
                    ...cleanedSong,
                    sourceId: result.source,
                    source: sourceNames[result.source] || result.source
                  };
                });
                allSongs = [...allSongs, ...songsWithSource];
              }
            }
            const songsBySource = {};
            for (const song of allSongs) {
              const source = song.source;
              if (!songsBySource[source]) {
                songsBySource[source] = [];
              }
              songsBySource[source].push(song);
            }
            const interleavedSongs = [];
            let hasMoreSongs = true;
            while (hasMoreSongs) {
              hasMoreSongs = false;
              for (const source in songsBySource) {
                if (songsBySource[source].length > 0) {
                  interleavedSongs.push(songsBySource[source].shift());
                  if (songsBySource[source].length > 0) {
                    interleavedSongs.push(songsBySource[source].shift());
                  }
                  hasMoreSongs = hasMoreSongs || songsBySource[source].length > 0;
                }
              }
            }
            searchResult.songs = interleavedSongs;
            if (searchResult.songs.length === 0) {
              hasMore.value = false;
            } else {
              let maxAllPage = 1;
              for (const result of results) {
                if (result && result.allPage) {
                  maxAllPage = Math.max(maxAllPage, result.allPage);
                }
              }
              hasMore.value = currentPage.value < maxAllPage;
              console.log("[SearchPage] 各平台allPage:", results.map((r) => ({ source: r.source, allPage: r.allPage })));
              console.log("[SearchPage] 最大allPage:", maxAllPage, "当前页码:", currentPage.value, "hasMore:", hasMore.value);
            }
            break;
          case "playlists":
            console.log("[SearchPage] 进入歌单搜索分支");
            const playlistResults = await services_api.searchApi.searchPlaylists(keyword, "all", currentPage.value, 25).catch((err) => {
              console.error("歌单搜索失败:", err);
              return { list: [] };
            });
            searchResult.playlists = playlistResults.list || [];
            console.log("[SearchPage] 歌单搜索结果列表:", searchResult.playlists);
            console.log("[SearchPage] 歌单数量:", searchResult.playlists.length);
            console.log("[SearchPage] API返回的allPage:", playlistResults.allPage);
            hasMore.value = currentPage.value < (playlistResults.allPage || 1);
            console.log("[SearchPage] hasMore:", hasMore.value, "原因:", currentPage.value, "<", playlistResults.allPage || 1);
            break;
        }
      } catch (error) {
        console.error("搜索失败:", error);
        searchError.value = "搜索失败，请稍后重试";
      } finally {
        isLoading.value = false;
      }
    };
    const searchWithKeyword = (keyword) => {
      searchKeyword.value = keyword;
      searchSuggestions.value = [];
      onSearch();
    };
    const switchSearchType = (type) => {
      if (currentType.value === type)
        return;
      currentType.value;
      currentType.value = type;
      currentPage.value = 1;
      if (searchKeyword.value) {
        isLoading.value = true;
        search(searchKeyword.value);
      }
      if (type !== "comprehensive") {
        common_vendor.index.pageScrollTo({
          scrollTop: 0,
          duration: 300
        });
      }
    };
    const onSearch = () => {
      console.log("[SearchPage] ========== onSearch函数被调用 ==========");
      console.log("[SearchPage] 搜索关键词:", searchKeyword.value);
      console.log("[SearchPage] 当前搜索类型:", currentType.value);
      common_vendor.index.showToast({
        title: `onSearch被调用`,
        icon: "none",
        duration: 1500
      });
      if (searchKeyword.value) {
        searchSuggestions.value = [];
        search(searchKeyword.value);
      }
    };
    const loadMore = async () => {
      if (!hasMore.value || isLoading.value || !searchKeyword.value)
        return;
      isLoading.value = true;
      currentPage.value += 1;
      try {
        switch (currentType.value) {
          case "songs":
            const sources = ["kw", "kg", "tx", "wy", "mg"];
            const sourceNames = {
              kw: "酷我",
              kg: "酷狗",
              tx: "QQ",
              wy: "网易",
              mg: "咪咕"
            };
            const searchPromises = sources.map((source) => {
              return services_api.searchApi.searchSongs(searchKeyword.value, source, currentPage.value, 20).catch((err) => {
                console.error(`${sourceNames[source]}搜索失败:`, err);
                return { source, list: [] };
              });
            });
            const results = await Promise.all(searchPromises);
            let allSongs = [];
            for (const result of results) {
              if (result && result.list && result.list.length > 0) {
                const songsWithSource = result.list.map((song) => ({
                  ...song,
                  sourceId: result.source,
                  source: sourceNames[result.source] || result.source
                }));
                allSongs = [...allSongs, ...songsWithSource];
              }
            }
            const songsBySource = {};
            for (const song of allSongs) {
              const source = song.source;
              if (!songsBySource[source]) {
                songsBySource[source] = [];
              }
              songsBySource[source].push(song);
            }
            const interleavedSongs = [];
            let hasMoreSongs = true;
            while (hasMoreSongs) {
              hasMoreSongs = false;
              for (const source in songsBySource) {
                if (songsBySource[source].length > 0) {
                  interleavedSongs.push(songsBySource[source].shift());
                  if (songsBySource[source].length > 0) {
                    interleavedSongs.push(songsBySource[source].shift());
                  }
                  hasMoreSongs = hasMoreSongs || songsBySource[source].length > 0;
                }
              }
            }
            const songMap = /* @__PURE__ */ new Map();
            for (const song of interleavedSongs) {
              const key = `${song.name}-${song.artists ? song.artists.map((a) => a.name).join("/") : song.singer}`;
              if (!songMap.has(key) || song.quality && song.quality.includes("HQ")) {
                songMap.set(key, song);
              }
            }
            const newSongs = Array.from(songMap.values());
            searchResult.songs = [...searchResult.songs, ...newSongs];
            console.log("[SearchPage] 加载更多单曲结果列表:", searchResult.songs);
            console.log("[SearchPage] 新增单曲数量:", newSongs.length);
            console.log("[SearchPage] 总单曲数量:", searchResult.songs.length);
            let maxAllPage = 1;
            for (const result of results) {
              if (result && result.allPage) {
                maxAllPage = Math.max(maxAllPage, result.allPage);
              }
            }
            hasMore.value = currentPage.value < maxAllPage;
            console.log("[SearchPage] 各平台allPage:", results.map((r) => ({ source: r.source, allPage: r.allPage })));
            console.log("[SearchPage] 最大allPage:", maxAllPage, "当前页码:", currentPage.value, "hasMore:", hasMore.value);
            break;
          case "playlists":
            console.log("[SearchPage] 加载更多：进入歌单搜索分支");
            const playlistResults = await services_api.searchApi.searchPlaylists(searchKeyword.value, "all", currentPage.value, 25).catch((err) => {
              console.error("歌单搜索失败:", err);
              return { list: [] };
            });
            const newPlaylists = playlistResults.list || [];
            searchResult.playlists = [...searchResult.playlists, ...newPlaylists];
            console.log("[SearchPage] 加载更多歌单结果列表:", searchResult.playlists);
            console.log("[SearchPage] 新增歌单数量:", newPlaylists.length);
            console.log("[SearchPage] 总歌单数量:", searchResult.playlists.length);
            console.log("[SearchPage] API返回的allPage:", playlistResults.allPage);
            console.log("[SearchPage] 当前页码:", currentPage.value);
            hasMore.value = currentPage.value < (playlistResults.allPage || 1);
            console.log("[SearchPage] hasMore设置为:", hasMore.value, "原因:", currentPage.value, "<", playlistResults.allPage || 1);
            break;
        }
      } catch (error) {
        console.error("加载更多失败:", error);
        common_vendor.index.showToast({
          title: "加载更多失败",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
      }
    };
    const onRefresh = async () => {
      isRefreshing.value = true;
      searchError.value = null;
      try {
        if (searchKeyword.value) {
          currentPage.value = 1;
          await search(searchKeyword.value);
        }
      } catch (error) {
        console.error("刷新失败:", error);
        searchError.value = "刷新失败，请稍后重试";
      } finally {
        setTimeout(() => {
          isRefreshing.value = false;
        }, 500);
      }
    };
    const clearSearch = () => {
      console.log("clearSearch");
      if (!searchKeyword.value)
        return;
      searchKeyword.value = "";
      hasSearched.value = false;
    };
    const onInput = () => {
      if (hasSearched.value) {
        hasSearched.value = false;
      }
      if (searchKeyword.value && searchKeyword.value.trim().length > 0) {
        clearTimeout(window.suggestTimer);
        window.suggestTimer = setTimeout(() => {
          getSuggestions(searchKeyword.value);
        }, 300);
      } else {
        searchSuggestions.value = [];
      }
    };
    const handleFocus = () => {
      console.log("搜索框获取焦点");
      shouldFocus.value = true;
    };
    const handleBlur = () => {
      console.log("搜索框失去焦点");
      if (!searchKeyword.value) {
        shouldFocus.value = false;
      }
    };
    const playSong = async (song) => {
      console.log("[Search] 播放歌曲:", song.name);
      if (!song || !song.id) {
        console.error("[Search] 歌曲对象无效:", song);
        common_vendor.index.showToast({
          title: "歌曲信息无效",
          icon: "none"
        });
        return;
      }
      const sourceId = song.sourceId || song.source || "tx";
      const sourceMap = {
        "酷我": "kw",
        "酷狗": "kg",
        "网易云": "wy",
        "QQ": "tx",
        "咪咕": "mg"
      };
      const actualSource = sourceMap[sourceId] || sourceId;
      await utils_playSong.playSongCommon(song, {
        addToDefaultList: true,
        source: actualSource
      });
    };
    const showSongOptions = (song) => {
      common_vendor.index.showActionSheet({
        itemList: ["播放", "添加到播放列表", "下一首播放", "收藏到歌单", "下载", "分享", "歌手：" + formatArtists(song.artists), "专辑：" + song.album.name],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              playSong(song);
              break;
            case 1:
              store_modules_player.playerStore.addToPlaylist(song);
              common_vendor.index.showToast({
                title: "已添加到播放列表",
                icon: "none"
              });
              break;
            case 2:
              store_modules_player.playerStore.addToPlaylistAsNext(song);
              common_vendor.index.showToast({
                title: "已添加到下一首播放",
                icon: "none"
              });
              break;
            case 3:
              navigateTo(`/pages/select-playlist/index?songId=${song.id}`);
              break;
            case 4:
              common_vendor.index.showToast({
                title: "开始下载",
                icon: "success"
              });
              break;
            case 5:
              common_vendor.index.share({
                provider: "weixin",
                scene: "WXSceneSession",
                type: 0,
                title: song.name,
                summary: formatArtists(song.artists),
                imageUrl: song.album.picUrl,
                success: function(res2) {
                  console.log("分享成功：" + JSON.stringify(res2));
                },
                fail: function(err) {
                  console.log("分享失败：" + JSON.stringify(err));
                }
              });
              break;
            case 6:
              if (song.artists && song.artists.length > 0) {
                goToArtistDetail(song.artists[0]);
              }
              break;
            case 7:
              if (song.album) {
                goToAlbumDetail(song.album);
              }
              break;
          }
        }
      });
    };
    const formatPlayCount = (count) => {
      if (!count && count !== 0)
        return "0";
      if (count < 1e4) {
        return count.toString();
      } else if (count < 1e8) {
        return (count / 1e4).toFixed(1).replace(/\.0$/, "") + "万";
      } else {
        return (count / 1e8).toFixed(1).replace(/\.0$/, "") + "亿";
      }
    };
    const getSourceName = (source) => {
      const sourceMap = {
        "wy": "网易云音乐",
        "tx": "QQ音乐",
        "kg": "酷狗音乐",
        "kw": "酷我音乐",
        "mg": "咪咕音乐"
      };
      return sourceMap[source] || source;
    };
    const formatArtists = (artists) => {
      if (!artists || !artists.length)
        return "未知歌手";
      if (typeof artists === "string")
        return artists;
      if (Array.isArray(artists)) {
        return artists.map((artist) => {
          if (typeof artist === "string")
            return artist;
          return artist.name || "";
        }).filter(Boolean).join(" / ");
      }
      return "未知歌手";
    };
    const formatDate = (timestamp) => {
      if (!timestamp)
        return "未知时间";
      let date;
      if (typeof timestamp === "string") {
        const iosCompatibleFormat = timestamp.replace(/-/g, "/");
        date = new Date(iosCompatibleFormat);
      } else if (typeof timestamp === "number") {
        date = new Date(timestamp);
      } else {
        return "未知时间";
      }
      if (isNaN(date.getTime()))
        return "未知时间";
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
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
    const getRandomRankColor = (index) => {
      if (index === 0)
        return "#ff4d4f";
      if (index === 1)
        return "#ff7a45";
      if (index === 2)
        return "#ffa940";
      const colors = ["#52c41a", "#1677ff", "#722ed1", "#eb2f96", "#faad14", "#13c2c2"];
      return colors[index % colors.length];
    };
    const navigateTo = (url) => {
      common_vendor.index.navigateTo({ url });
    };
    const goToPlaylistDetail = (playlist) => {
      let link = "";
      let playlistId = playlist.id;
      switch (playlist.source) {
        case "kw":
          link = `https://www.kuwo.cn/playlist_detail/${playlist.id}`;
          break;
        case "kg":
          link = `https://www.kugou.com/yy/special/single/${playlist.id}.html`;
          playlistId = `id_${playlist.id}`;
          break;
        case "tx":
          link = `https://y.qq.com/n/ryqq/playlist/${playlist.id}`;
          break;
        case "wy":
          link = `https://music.163.com/playlist?id=${playlist.id}`;
          break;
        case "mg":
          link = `https://music.migu.cn/v3/music/playlist/${playlist.id}`;
          break;
        default:
          link = playlist.id;
      }
      common_vendor.index.navigateTo({
        url: `/pages/sharelist/index?source=${playlist.source}&link=${encodeURIComponent(link)}&id=${playlistId}&picUrl=${encodeURIComponent(playlist.coverImgUrl)}&name=${encodeURIComponent(playlist.name || "")}&author=${encodeURIComponent(playlist.creator || playlist.author || "")}&playCount=${playlist.playCount || 0}&fromName=search`
      });
    };
    const handleSearchImageError = (event, playlist) => {
      if (!playlist || !playlist.coverImgUrl)
        return;
      let currentProxyIndex = 0;
      if (playlist.coverImgUrl.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (playlist.coverImgUrl.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (playlist.coverImgUrl.includes("jina.ai"))
        currentProxyIndex = 3;
      const nextUrl = utils_imageProxy.handleImageError(event, playlist.coverImgUrl, currentProxyIndex);
      if (nextUrl) {
        playlist.coverImgUrl = nextUrl;
      }
    };
    const goToAlbumDetail = (album) => {
      common_vendor.index.showToast({ title: "专辑详情功能暂未开放", icon: "none" });
    };
    const goToArtistDetail = (artist) => {
      common_vendor.index.showToast({ title: "歌手详情功能暂未开放", icon: "none" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: statusBarHeight.value + "px",
        b: darkMode.value ? "#1f2937" : "#ffffff",
        c: common_vendor.p({
          type: "fas",
          name: "search",
          size: "16",
          color: "#9ca3af"
        }),
        d: common_vendor.o(onSearch),
        e: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, onInput]),
        f: shouldFocus.value,
        g: common_vendor.o(handleFocus),
        h: common_vendor.o(handleBlur),
        i: searchKeyword.value,
        j: searchKeyword.value
      }, searchKeyword.value ? {
        k: common_vendor.o(clearSearch),
        l: common_vendor.p({
          type: "fas",
          name: "times-circle",
          size: "16",
          color: "#9ca3af"
        })
      } : {}, {
        m: searchKeyword.value ? 1 : "",
        n: searchKeyword.value
      }, searchKeyword.value ? {
        o: common_vendor.o(onSearch)
      } : {}, {
        p: common_vendor.s(searchBarStyle.value)
      }, {
        q: common_vendor.f(searchTypes, (type, k0, i0) => {
          return {
            a: common_vendor.t(type.label),
            b: type.value,
            c: currentType.value === type.value ? 1 : "",
            d: common_vendor.o(($event) => switchSearchType(type.value), type.value)
          };
        })
      }, {
        r: searchKeyword.value && !hasSearched.value && searchSuggestions.value.length > 0
      }, searchKeyword.value && !hasSearched.value && searchSuggestions.value.length > 0 ? {
        s: common_vendor.f(searchSuggestions.value, (suggestion, index, i0) => {
          return {
            a: "1e4f5a8e-2-" + i0,
            b: common_vendor.t(suggestion),
            c: index,
            d: common_vendor.o(($event) => searchWithKeyword(suggestion), index)
          };
        }),
        t: common_vendor.p({
          type: "fas",
          name: "search",
          size: "16",
          color: "#9ca3af"
        })
      } : {}, {
        v: !hasSearched.value && !searchKeyword.value && searchHistory.value.length > 0
      }, !hasSearched.value && !searchKeyword.value && searchHistory.value.length > 0 ? {
        w: common_vendor.p({
          type: "fas",
          name: "trash",
          size: "14",
          color: "#999999"
        }),
        x: common_vendor.o(clearHistory),
        y: common_vendor.f(searchHistory.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.keyword),
            b: common_vendor.o(($event) => removeHistoryById(item.id), item.id),
            c: item.id,
            d: common_vendor.o(($event) => searchWithKeyword(item.keyword), item.id)
          };
        })
      } : {}, {
        z: !hasSearched.value && !searchKeyword.value
      }, !hasSearched.value && !searchKeyword.value ? {
        A: common_vendor.o(getHotSearches),
        B: common_vendor.f(hotSearches.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: getRandomRankColor(index),
            c: common_vendor.t(item.searchWord),
            d: common_vendor.t(item.content),
            e: common_vendor.t(item.score),
            f: item.source
          }, item.source ? {
            g: common_vendor.t(item.source)
          } : {}, {
            h: item.id,
            i: common_vendor.o(($event) => searchWithKeyword(item.searchWord), item.id)
          });
        })
      } : {}, {
        C: hasSearched.value
      }, hasSearched.value ? common_vendor.e({
        D: isLoading.value && currentPage.value === 1 && !isRefreshing.value
      }, isLoading.value && currentPage.value === 1 && !isRefreshing.value ? {} : {}, {
        E: searchError.value
      }, searchError.value ? {
        F: common_assets._imports_0,
        G: common_vendor.t(searchError.value),
        H: common_vendor.o(onSearch)
      } : {}, {
        I: hasSearched.value && !isLoading.value && isEmpty.value
      }, hasSearched.value && !isLoading.value && isEmpty.value ? {
        J: common_vendor.p({
          type: "fas",
          name: "frown",
          size: "80",
          color: "#9ca3af"
        }),
        K: common_vendor.t(searchKeyword.value)
      } : currentType.value === "songs" ? {
        M: common_vendor.f(searchResult.songs, (song, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(song.name),
            b: common_vendor.t(formatArtists(song.artists)),
            c: common_vendor.t(song.album.name),
            d: song.quality
          }, song.quality ? {
            e: common_vendor.t(song.quality)
          } : {}, {
            f: song.source
          }, song.source ? {
            g: common_vendor.t(song.source)
          } : {}, {
            h: common_vendor.t(formatDuration(song.duration)),
            i: common_vendor.o(($event) => showSongOptions(song), song.id),
            j: "1e4f5a8e-5-" + i0,
            k: song.id,
            l: common_vendor.o(($event) => playSong(song), song.id)
          });
        }),
        N: common_vendor.p({
          type: "fas",
          name: "ellipsis-v",
          size: "18",
          color: "#999999"
        })
      } : currentType.value === "playlists" ? {
        P: common_vendor.f(searchResult.playlists, (playlist, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlist.coverImgUrl),
            b: common_vendor.o(($event) => handleSearchImageError($event, playlist), playlist.id),
            c: playlist.source
          }, playlist.source ? {
            d: common_vendor.t(getSourceName(playlist.source))
          } : {}, {
            e: playlist.playCount
          }, playlist.playCount ? {
            f: "1e4f5a8e-6-" + i0,
            g: common_vendor.p({
              name: "play",
              size: "10",
              color: "#fff"
            }),
            h: common_vendor.t(formatPlayCount(playlist.playCount))
          } : {}, {
            i: playlist.trackCount
          }, playlist.trackCount ? {
            j: "1e4f5a8e-7-" + i0,
            k: common_vendor.p({
              name: "music",
              size: "10",
              color: "#fff"
            }),
            l: common_vendor.t(playlist.trackCount)
          } : {}, {
            m: common_vendor.t(playlist.name),
            n: playlist.time
          }, playlist.time ? {
            o: common_vendor.t(formatDate(playlist.time))
          } : {}, {
            p: playlist.creator || playlist.author
          }, playlist.creator || playlist.author ? common_vendor.e({
            q: playlist.creator
          }, playlist.creator ? {
            r: common_vendor.t(playlist.creator)
          } : playlist.author ? {
            t: common_vendor.t(playlist.author)
          } : {}, {
            s: playlist.author
          }) : {}, {
            v: playlist.id,
            w: common_vendor.o(($event) => goToPlaylistDetail(playlist), playlist.id)
          });
        })
      } : {}, {
        L: currentType.value === "songs",
        O: currentType.value === "playlists",
        Q: hasMore.value && !isLoading.value && !isEmpty.value
      }, hasMore.value && !isLoading.value && !isEmpty.value ? {
        R: common_vendor.o(loadMore)
      } : isLoading.value && currentPage.value > 1 ? {} : !hasMore.value && !isEmpty.value ? {} : {}, {
        S: isLoading.value && currentPage.value > 1,
        T: !hasMore.value && !isEmpty.value
      }) : {}, {
        U: common_vendor.s(safeBottomStyle.value),
        V: common_vendor.o(loadMore),
        W: common_vendor.o(onRefresh),
        X: hasSearched.value,
        Y: isRefreshing.value,
        Z: darkMode.value ? 1 : ""
      });
    };
  }
});
exports._sfc_main = _sfc_main;
