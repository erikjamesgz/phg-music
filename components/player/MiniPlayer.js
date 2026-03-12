"use strict";
const common_vendor = require("../../common/vendor.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
const store_modules_comment = require("../../store/modules/comment.js");
const utils_system = require("../../utils/system.js");
const utils_lyric = require("../../utils/lyric.js");
const utils_kgLyricDecoder = require("../../utils/kgLyricDecoder.js");
const utils_musicPic = require("../../utils/musicPic.js");
const utils_imageProxy = require("../../utils/imageProxy.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const maxTextLength = 30;
const _sfc_main = {
  __name: "MiniPlayer",
  setup(__props) {
    common_vendor.useCssVars((_ctx) => ({
      "6db3aebe": miniPlayerBottom.value
    }));
    let instance = null;
    try {
      instance = common_vendor.getCurrentInstance();
    } catch (e) {
      console.log("[MiniPlayer] getCurrentInstance failed:", e);
    }
    const getInstance = () => instance;
    const currentSong = common_vendor.computed(() => store_modules_player.playerStore.getState().currentSong);
    const originalSong = common_vendor.computed(() => store_modules_player.playerStore.getState().originalSong);
    const playing = common_vendor.computed(() => store_modules_player.playerStore.getState().playing);
    const playMode = common_vendor.computed(() => store_modules_player.playerStore.getState().playMode);
    const playlist = common_vendor.computed(() => store_modules_player.playerStore.getState().playlist);
    const currentTime = common_vendor.computed(() => store_modules_player.playerStore.getState().currentTime);
    const duration = common_vendor.computed(() => store_modules_player.playerStore.getState().duration);
    const tabBarBottom = common_vendor.ref(0);
    const tabBarHeight = common_vendor.ref(0);
    const darkMode = common_vendor.ref(false);
    common_vendor.ref(null);
    const marqueeScroll = common_vendor.ref(false);
    common_vendor.ref(null);
    const statusMarqueeScroll = common_vendor.ref(false);
    const songPicCache = common_vendor.ref("");
    const cachedParsedLyrics = common_vendor.ref([]);
    const lastLyricText = common_vendor.ref("");
    common_vendor.ref("");
    const wasPlaying = common_vendor.ref(false);
    const hasCheckedLyrics = common_vendor.ref(false);
    const playerStatusText = common_vendor.ref("");
    const isShowingStatusText = common_vendor.ref(false);
    const showDanmaku = common_vendor.ref(false);
    const danmakuList = common_vendor.ref([]);
    const activeDanmaku = common_vendor.ref([]);
    const checkMarquee = () => {
      try {
        const query = common_vendor.index.createSelectorQuery().in(getInstance());
        query.select(".mini-player__marquee").boundingClientRect();
        query.select(".mini-player__marquee-content").boundingClientRect();
        query.exec((rects) => {
          if (!rects || !rects[0] || !rects[1])
            return;
          const marqueeRect = rects[0];
          const contentRect = rects[1];
          let singleContentWidth = contentRect.width;
          if (marqueeScroll.value) {
            singleContentWidth = contentRect.width / 2;
          }
          marqueeScroll.value = singleContentWidth > marqueeRect.width + 5;
        });
      } catch (e) {
      }
    };
    const checkStatusMarquee = () => {
      try {
        const query = common_vendor.index.createSelectorQuery().in(getInstance());
        query.select(".mini-player__status-marquee").boundingClientRect();
        query.select(".mini-player__status-content").boundingClientRect();
        query.exec((rects) => {
          if (!rects || !rects[0] || !rects[1])
            return;
          const marqueeRect = rects[0];
          const contentRect = rects[1];
          let singleContentWidth = contentRect.width;
          if (statusMarqueeScroll.value) {
            singleContentWidth = contentRect.width / 2;
          }
          statusMarqueeScroll.value = singleContentWidth > marqueeRect.width + 5;
        });
      } catch (e) {
      }
    };
    const updateSongPicCache = async (song) => {
      if (!song) {
        songPicCache.value = "";
        return;
      }
      const source = song.sourceId || song.source;
      let picUrl = utils_musicPic.getSongPicUrl(song, source);
      if (picUrl) {
        songPicCache.value = picUrl;
      } else {
        songPicCache.value = "";
        picUrl = await utils_musicPic.fetchSongPicUrl(song, source);
        if (picUrl) {
          songPicCache.value = picUrl;
        }
      }
    };
    common_vendor.watch(() => {
      var _a;
      return (_a = currentSong.value) == null ? void 0 : _a.id;
    }, async (newId, oldId) => {
      marqueeScroll.value = false;
      setTimeout(checkMarquee, 200);
      wasPlaying.value = false;
      hasCheckedLyrics.value = false;
      if (newId !== oldId) {
        await updateSongPicCache(currentSong.value);
      }
      stopDanmaku();
      danmakuList.value = [];
      activeDanmaku.value = [];
      shownIds = /* @__PURE__ */ new Set();
      lastPlayedSongId = null;
      danmakuLoadedForSong = null;
      if (oldId && oldId !== newId) {
        const oldSong = store_modules_player.playerStore.getState().originalSong;
        if (oldSong && oldSong.source) {
          store_modules_comment.commentStore.clearCommentCache(oldId, oldSong.source);
        }
      }
    }, { immediate: true });
    common_vendor.watch(() => currentSong.value, async (newSong) => {
      if (newSong && newSong.id && !songPicCache.value) {
        await updateSongPicCache(newSong);
      }
    }, { immediate: true });
    common_vendor.watch(() => playerStatusText.value, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        statusMarqueeScroll.value = false;
        setTimeout(checkStatusMarquee, 300);
      }
    });
    const checkDarkMode = () => {
      const followSystem = common_vendor.index.getStorageSync("followSystem") !== "false";
      if (followSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        darkMode.value = systemInfo.theme === "dark";
      } else {
        darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      }
    };
    const initDanmaku = () => {
      const storedDanmaku = common_vendor.index.getStorageSync("showMiniPlayerDanmaku");
      showDanmaku.value = storedDanmaku === "true";
      console.log("[MiniPlayer] 初始化弹幕设置:", showDanmaku.value, "storage:", storedDanmaku);
      common_vendor.index.$on("miniPlayerDanmakuChanged", (show) => {
        showDanmaku.value = show;
        if (!show) {
          danmakuList.value = [];
          activeDanmaku.value = [];
          if (danmakuTimer) {
            clearInterval(danmakuTimer);
            danmakuTimer = null;
          }
        }
        console.log("[MiniPlayer] 弹幕设置变化:", show);
      });
    };
    const fetchDanmakuComments = async () => {
      console.log("[MiniPlayer] fetchDanmakuComments 开始, showDanmaku:", showDanmaku.value);
      if (!showDanmaku.value) {
        console.log("[MiniPlayer] 弹幕开关关闭，不获取评论");
        return;
      }
      const song = originalSong.value || currentSong.value;
      console.log("[MiniPlayer] fetchDanmakuComments 歌曲信息:", song == null ? void 0 : song.id, song == null ? void 0 : song.source);
      if (!song || !song.id || !song.source) {
        console.log("[MiniPlayer] 歌曲信息不完整，不获取评论");
        return;
      }
      stopDanmaku();
      danmakuList.value = [];
      activeDanmaku.value = [];
      shownIds = /* @__PURE__ */ new Set();
      try {
        const storeState = store_modules_comment.commentStore.getState();
        const storeSongId = storeState.currentSongId;
        const storeSource = storeState.currentSource;
        if (storeSongId !== song.id || storeSource !== song.source) {
          console.log("[MiniPlayer] store歌曲不一致，清除缓存:", storeSongId, "!=", song.id);
          store_modules_comment.commentStore.clearCommentCache(storeSongId, storeSource);
        }
        const result = await store_modules_comment.commentStore.fetchComments({
          id: song.id,
          name: song.name,
          singer: song.singer,
          source: song.source,
          songmid: song.songmid,
          hash: song.hash,
          copyrightId: song.copyrightId
        });
        if (result) {
          const hot = result.hotComments || [];
          const latest = result.latestComments || [];
          const hotIds = new Set(hot.map((c) => c.id));
          const allComments = [...hot];
          for (const comment of latest) {
            if (!hotIds.has(comment.id)) {
              allComments.push(comment);
            }
          }
          danmakuList.value = allComments.slice(0, 30);
          console.log("[MiniPlayer] 请求新评论:", allComments.length);
        }
        console.log("[MiniPlayer] 弹幕评论获取成功:", danmakuList.value.length);
        if (danmakuList.value.length > 0) {
          startDanmaku();
        } else {
          stopDanmaku();
        }
      } catch (e) {
        console.log("[MiniPlayer] 获取弹幕评论失败:", e);
        danmakuList.value = [];
        activeDanmaku.value = [];
      }
    };
    const getUnshownItem = () => {
      const unshownIndexes = [];
      for (let i = 0; i < danmakuList.value.length; i++) {
        if (!shownIds.has(danmakuList.value[i].id)) {
          unshownIndexes.push(i);
        }
      }
      if (unshownIndexes.length === 0)
        return null;
      const randomIndex = unshownIndexes[Math.floor(Math.random() * unshownIndexes.length)];
      return { index: randomIndex, item: danmakuList.value[randomIndex] };
    };
    const checkFirstDanmakuVisible = () => {
      return new Promise((resolve) => {
        if (activeDanmaku.value.length === 0) {
          resolve(true);
          return;
        }
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const screenWidth = systemInfo.windowWidth;
        const currentInstance = getInstance();
        if (!currentInstance) {
          resolve(true);
          return;
        }
        const query = common_vendor.index.createSelectorQuery().in(currentInstance);
        query.select(".mini-player__danmaku-item").boundingClientRect((rect) => {
          if (!rect) {
            resolve(true);
            return;
          }
          const isVisible = rect.right < screenWidth;
          resolve(isVisible);
        }).exec();
      });
    };
    const startDanmaku = () => {
      console.log("[MiniPlayer] startDanmaku 开始, danmakuTimer:", !!danmakuTimer, "danmakuList长度:", danmakuList.value.length);
      if (danmakuTimer || danmakuList.value.length === 0) {
        console.log("[MiniPlayer] startDanmaku 返回, 已有定时器或无数据");
        return;
      }
      activeDanmaku.value = [];
      shownIds = /* @__PURE__ */ new Set();
      isLoadingMore = false;
      requestCount = 0;
      isPaused = false;
      console.log("[MiniPlayer] startDanmaku 调用 showNextDanmaku");
      showNextDanmaku();
    };
    const stopDanmaku = () => {
      if (danmakuTimer) {
        clearTimeout(danmakuTimer);
        danmakuTimer = null;
      }
      activeDanmaku.value = [];
      shownIds = /* @__PURE__ */ new Set();
      isLoadingMore = false;
      requestCount = 0;
      isPaused = false;
    };
    const pauseDanmaku = () => {
      console.log("[MiniPlayer] 暂停弹幕");
      isPaused = true;
      if (danmakuTimer) {
        clearTimeout(danmakuTimer);
        danmakuTimer = null;
      }
    };
    const resumeDanmaku = () => {
      if (isPaused) {
        console.log("[MiniPlayer] 恢复弹幕，继续向前滑动");
        isPaused = false;
        if (danmakuList.value.length > 0) {
          showNextDanmaku();
        }
      }
    };
    const waitForDanmakuVisibleOrDisappear = (uniqueId) => {
      return new Promise((resolve) => {
        let checkCount = 0;
        const maxChecks = 4;
        const checkInterval = setInterval(async () => {
          if (isPaused) {
            clearInterval(checkInterval);
            resolve("paused");
            return;
          }
          checkCount++;
          const index = activeDanmaku.value.findIndex((item) => item.uniqueId === uniqueId);
          if (index === -1) {
            clearInterval(checkInterval);
            console.log("[MiniPlayer] 弹幕已消失，可以添加下一条");
            resolve("disappeared");
            return;
          }
          const isVisible = await checkFirstDanmakuVisible();
          if (isVisible) {
            clearInterval(checkInterval);
            console.log("[MiniPlayer] 弹幕已完整显示，可以添加下一条");
            resolve("visible");
            return;
          }
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            console.log("[MiniPlayer] 检查超时，强制允许添加下一条");
            resolve("timeout");
          }
        }, 3e3);
      });
    };
    const showNextDanmaku = async () => {
      if (isPaused) {
        return;
      }
      if (danmakuList.value.length === 0) {
        return;
      }
      if (activeDanmaku.value.length >= 2) {
        danmakuTimer = setTimeout(() => {
          if (!isPaused)
            showNextDanmaku();
        }, 1e3);
        return;
      }
      if (activeDanmaku.value.length === 1) {
        const firstDanmakuId = activeDanmaku.value[0].uniqueId;
        const waitResult = await new Promise((resolve) => {
          danmakuTimer = setTimeout(() => {
            if (isPaused) {
              resolve("paused");
              return;
            }
            resolve("continue");
          }, 4e3);
        });
        if (isPaused || waitResult === "paused")
          return;
        const firstDanmakuStillExists = activeDanmaku.value.some((item2) => item2.uniqueId === firstDanmakuId);
        if (!firstDanmakuStillExists) {
          console.log("[MiniPlayer] 第一条弹幕已消失，直接添加新弹幕");
        } else {
          const canAddSecond = await checkFirstDanmakuVisible();
          if (canAddSecond)
            ;
          else {
            const result = await waitForDanmakuVisibleOrDisappear(firstDanmakuId);
            if (result === "paused") {
              return;
            }
          }
        }
      }
      if (isPaused)
        return;
      let unshown = getUnshownItem();
      if (!unshown && !isLoadingMore) {
        if (store_modules_comment.commentStore.getState().isLoading) {
          return;
        }
        isLoadingMore = true;
        requestCount++;
        console.log("[MiniPlayer] 请求加载更多评论, 次数:", requestCount);
        const result = await store_modules_comment.commentStore.fetchMoreComments(requestCount);
        if (isPaused) {
          isLoadingMore = false;
          return;
        }
        if (result === "loading") {
          isLoadingMore = false;
          return;
        }
        isLoadingMore = false;
        let commentsToAdd = [];
        if (result && result.alreadyLoaded) {
          commentsToAdd = result.allComments;
        } else if (result && result.length > 0) {
          commentsToAdd = result;
        }
        if (commentsToAdd.length > 0) {
          let addedCount = 0;
          for (const comment of commentsToAdd) {
            const exists = danmakuList.value.some((c) => c.id === comment.id);
            if (!exists) {
              danmakuList.value.push(comment);
              addedCount++;
            }
          }
          if (addedCount > 0) {
            console.log("[MiniPlayer] 加载更多评论成功:", addedCount);
            unshown = getUnshownItem();
          }
        }
        if (!unshown) {
          console.log("[MiniPlayer] 没有更多弹幕了，重置重新显示");
          shownIds = /* @__PURE__ */ new Set();
          unshown = getUnshownItem();
        }
      }
      if (!unshown) {
        console.log("[MiniPlayer] 没有弹幕可显示");
        return;
      }
      if (isPaused) {
        console.log("[MiniPlayer] showNextDanmaku 返回, 添加前已暂停");
        return;
      }
      const item = unshown.item;
      shownIds.add(item.id);
      const danmakuItem = {
        uniqueId: "danmaku_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        id: item.id || "danmaku_" + Date.now(),
        userName: removeAtSymbol(item.userName || item.nick || "用户"),
        text: formatText(item.text || item.content || "", maxTextLength)
      };
      activeDanmaku.value = [...activeDanmaku.value, danmakuItem];
      danmakuTimer = setTimeout(() => {
        if (!isPaused)
          showNextDanmaku();
      }, 1e3);
    };
    const onDanmakuEnd = (event) => {
      let uniqueId = null;
      if (event.currentTarget && event.currentTarget.dataset) {
        uniqueId = event.currentTarget.dataset.uniqueId;
      } else if (event.target && event.target.dataset) {
        uniqueId = event.target.dataset.uniqueId;
      } else if (event.detail && event.detail.uniqueId) {
        uniqueId = event.detail.uniqueId;
      }
      if (!uniqueId)
        return;
      const index = activeDanmaku.value.findIndex((item) => item.uniqueId === uniqueId);
      if (index !== -1) {
        activeDanmaku.value.splice(index, 1);
      }
    };
    const formatText = (text, maxLength) => {
      if (!text)
        return "";
      let formatted = text.replace(/[\r\n]+/g, " ");
      formatted = formatted.replace(/\s+/g, " ").trim();
      if (formatted.length <= maxLength)
        return formatted;
      return formatted.substring(0, maxLength) + "...";
    };
    const removeAtSymbol = (name) => {
      if (!name)
        return "";
      return name.replace(/^@/, "");
    };
    const isDragging = common_vendor.ref(false);
    const dragPercent = common_vendor.ref(0);
    const progress = common_vendor.computed(() => {
      if (!duration.value || duration.value <= 0)
        return 0;
      return currentTime.value / duration.value * 100;
    });
    const progressPercent = common_vendor.computed(() => {
      if (isDragging.value) {
        return dragPercent.value;
      }
      return duration.value > 0 ? currentTime.value / duration.value * 100 : 0;
    });
    common_vendor.computed(() => playlist.value.length);
    common_vendor.computed(() => ({ width: `${progress.value}%` }));
    const coverUrl = common_vendor.computed(() => {
      return songPicCache.value || "";
    });
    const handleCoverImageError = (event) => {
      if (!songPicCache.value) {
        console.log("[MiniPlayer] songPicCache 为空，无法处理图片错误");
        return;
      }
      let currentProxyIndex = 0;
      if (songPicCache.value.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (songPicCache.value.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (songPicCache.value.includes("jina.ai"))
        currentProxyIndex = 3;
      console.log("[MiniPlayer] 图片加载失败，当前代理索引:", currentProxyIndex);
      const nextUrl = utils_imageProxy.handleImageError(event, songPicCache.value, currentProxyIndex);
      if (nextUrl) {
        songPicCache.value = nextUrl;
        console.log("[MiniPlayer] 切换到下一个代理:", nextUrl);
      } else {
        console.log("[MiniPlayer] 所有代理都失败，保持当前图片");
      }
    };
    const showMiniPlayer = common_vendor.computed(() => {
      var _a;
      return !!((_a = currentSong.value) == null ? void 0 : _a.id);
    });
    let danmakuLoadedForSong = null;
    const checkAndLoadDanmaku = () => {
      var _a;
      const store = store_modules_player.playerStore.getState();
      const currentSongId = (_a = store.currentSong) == null ? void 0 : _a.id;
      if (store.playing && currentSongId && danmakuLoadedForSong !== currentSongId) {
        danmakuLoadedForSong = currentSongId;
        lastPlayedSongId = currentSongId;
        fetchDanmakuComments();
      }
    };
    const updateCachedLyrics = () => {
      var _a;
      const store = store_modules_player.playerStore.getState();
      const lyricInfo = {
        lyric: store.lyric || "",
        tlyric: store.tlyric || "",
        rlyric: store.rlyric || "",
        lxlyric: store.lxlyric || ""
      };
      const { lyric, tlyric, rlyric, lxlyric } = utils_lyric.extractLyricsFromMusicData(lyricInfo);
      let lyricText = lyric || "";
      let lxlyricText = lxlyric || "";
      if (utils_kgLyricDecoder.isKgCompressedLyric(lyricText)) {
        try {
          const decoded = utils_kgLyricDecoder.tryDecodeKgLyric(lyricText);
          lyricText = decoded.lyric || lyricText;
        } catch (e) {
        }
      }
      if (utils_kgLyricDecoder.isKgCompressedLyric(lxlyricText)) {
        try {
          const decoded = utils_kgLyricDecoder.tryDecodeKgLyric(lxlyricText);
          lxlyricText = decoded.lxlyric || lxlyricText;
          if (!lyricText && decoded.lyric) {
            lyricText = decoded.lyric;
          }
        } catch (e) {
        }
      }
      const finalLyric = lxlyricText || lyricText;
      if (finalLyric !== lastLyricText.value) {
        lastLyricText.value = finalLyric;
        if (finalLyric) {
          cachedParsedLyrics.value = utils_lyric.parseLyric(finalLyric);
          hasCheckedLyrics.value = true;
          common_vendor.nextTick$1(() => {
            updateCurrentLyricText();
          });
          const currentSongId = (_a = store.currentSong) == null ? void 0 : _a.id;
          if (currentSongId) {
            checkAndLoadDanmaku();
          }
        } else {
          cachedParsedLyrics.value = [];
          console.log("[MiniPlayer] 歌词为空，清空缓存");
          hasCheckedLyrics.value = true;
          common_vendor.nextTick$1(() => {
            updateCurrentLyricText();
          });
        }
      }
    };
    let danmakuTimer = null;
    let shownIds = /* @__PURE__ */ new Set();
    let isPaused = false;
    let isLoadingMore = false;
    let requestCount = 0;
    let lastPlayedSongId = null;
    const updateCurrentLyricText = () => {
      const store = store_modules_player.playerStore.getState();
      if (store.statusText) {
        playerStatusText.value = store.statusText;
        isShowingStatusText.value = true;
        hasCheckedLyrics.value = false;
        return;
      }
      isShowingStatusText.value = false;
      if (store.playing && !wasPlaying.value) {
        wasPlaying.value = true;
        hasCheckedLyrics.value = true;
      }
      if (store.playing && !hasCheckedLyrics.value) {
        hasCheckedLyrics.value = true;
      }
      if (hasCheckedLyrics.value) {
        const hasLyrics = cachedParsedLyrics.value.length > 0;
        if (!hasLyrics) {
          playerStatusText.value = "暂无歌词";
          return;
        }
      }
      const currentTime2 = store.currentTime;
      if (currentTime2 && cachedParsedLyrics.value.length > 0) {
        const index = utils_lyric.getCurrentLyricIndex(cachedParsedLyrics.value, currentTime2);
        if (index >= 0 && index < cachedParsedLyrics.value.length) {
          playerStatusText.value = cachedParsedLyrics.value[index].text || "";
          return;
        }
      }
      playerStatusText.value = "";
    };
    const statusText = common_vendor.computed(() => playerStatusText.value);
    common_vendor.watch(() => store_modules_player.playerStore.getState().lyric, updateCachedLyrics, { immediate: true });
    common_vendor.watch(() => store_modules_player.playerStore.getState().lxlyric, updateCachedLyrics);
    common_vendor.watch(() => store_modules_player.playerStore.getState().currentTime, updateCurrentLyricText);
    common_vendor.watch(() => store_modules_player.playerStore.getState().statusText, (newVal, oldVal) => {
      updateCurrentLyricText();
    }, { immediate: true });
    const isTabPage = common_vendor.computed(() => {
      var _a;
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (!currentPage)
          return false;
        const route = currentPage.route || ((_a = currentPage.$page) == null ? void 0 : _a.route) || "";
        const tabPages = [
          "pages/index/index",
          "pages/search/index",
          "pages/playlist/index",
          "pages/my/index"
        ];
        return tabPages.some((tab) => route.includes(tab));
      } catch (e) {
        return false;
      }
    });
    const miniPlayerBottom = common_vendor.ref("0px");
    const updateMiniPlayerBottom = () => {
      var _a;
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const route = (currentPage == null ? void 0 : currentPage.route) || ((_a = currentPage == null ? void 0 : currentPage.$page) == null ? void 0 : _a.route) || "";
        console.log("[MiniPlayer] updateMiniPlayerBottom 当前页面路由:", route);
        const tabPages = [
          "pages/main/index",
          "pages/index/index",
          "pages/search/index",
          "pages/playlist/index",
          "pages/my/index"
        ];
        const isTab = tabPages.some((tab) => route.includes(tab));
        console.log("[MiniPlayer] isTab:", isTab, "tabBarHeight:", tabBarHeight.value);
        if (isTab) {
          miniPlayerBottom.value = `${tabBarHeight.value}px`;
        } else {
          miniPlayerBottom.value = "20px";
        }
      } catch (e) {
        console.error("[MiniPlayer] updateMiniPlayerBottom error:", e);
        miniPlayerBottom.value = "20px";
      }
    };
    const getSystemInfo = () => {
      try {
        const deviceInfo = utils_system.getDeviceInfo();
        if (deviceInfo.safeArea) {
          const { bottom, height } = deviceInfo.safeArea;
          tabBarBottom.value = deviceInfo.screenHeight - bottom;
        }
        const rpxToPx = 140 * (deviceInfo.windowWidth / 750);
        tabBarHeight.value = rpxToPx;
      } catch (error) {
        console.error("获取系统信息失败:", error);
      }
    };
    const togglePlay = () => {
      store_modules_player.playerStore.togglePlay();
    };
    const playNext = async () => {
      if (store_modules_player.playerStore.getState().isGettingUrl) {
        console.log("[MiniPlayer] 正在获取播放链接，只更新待播放歌曲");
        const togglePlayMethod2 = playMode.value === "random" ? "random" : playMode.value === "singleLoop" ? "singleLoop" : "listLoop";
        if (playMode.value === "singleLoop") {
          store_modules_player.playerStore.setPlayMode("listLoop");
        }
        const nextSongInfo2 = store_modules_list.listStore.getNextSong(togglePlayMethod2, false);
        if (nextSongInfo2 && nextSongInfo2.musicInfo) {
          console.log("[MiniPlayer] 更新待播放歌曲:", nextSongInfo2.musicInfo.name);
          store_modules_player.playerStore.updatePendingSong(nextSongInfo2.musicInfo);
        }
        return;
      }
      store_modules_player.playerStore.setGettingUrl(true);
      const togglePlayMethod = playMode.value === "random" ? "random" : playMode.value === "singleLoop" ? "singleLoop" : "listLoop";
      if (playMode.value === "singleLoop") {
        store_modules_player.playerStore.setPlayMode("listLoop");
      }
      const nextSongInfo = store_modules_list.listStore.getNextSong(togglePlayMethod, false);
      if (!nextSongInfo || !nextSongInfo.musicInfo) {
        console.log("[MiniPlayer] 没有下一首歌曲");
        store_modules_player.playerStore.setGettingUrl(false);
        common_vendor.index.showToast({
          title: "已经是最后一首了",
          icon: "none"
        });
        return;
      }
      await playSongFromList(nextSongInfo);
    };
    const playSongFromList = async (playMusicInfo) => {
      const song = playMusicInfo.musicInfo;
      const listId = playMusicInfo.listId;
      const isTempPlay = playMusicInfo.isTempPlay;
      try {
        store_modules_list.listStore.setPlayMusicInfo(listId, song, isTempPlay);
        store_modules_list.listStore.addPlayedList({
          listId,
          musicInfo: song,
          isTempPlay
        });
        await store_modules_player.playerStore.playSong(song);
      } catch (error) {
        console.error("[MiniPlayer] 播放失败:", error);
        store_modules_player.playerStore.setGettingUrl(false);
        common_vendor.index.showToast({
          title: "播放失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
    };
    const openFullPlayer = () => {
      common_vendor.index.navigateTo({
        url: "/pages/player/index"
      });
    };
    const onProgressTouchStart = (e) => {
      isDragging.value = true;
      store_modules_player.playerStore.setUserSeeking(true);
      updateDragPercent(e);
    };
    const onProgressTouchMove = (e) => {
      if (!isDragging.value)
        return;
      updateDragPercent(e);
    };
    const onProgressTouchEnd = () => {
      if (!isDragging.value)
        return;
      isDragging.value = false;
      store_modules_player.playerStore.seek(dragPercent.value);
    };
    const updateDragPercent = (e) => {
      const touch = e.touches[0];
      const query = common_vendor.index.createSelectorQuery().in(getInstance());
      query.select(".mini-player__progress").boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          const rect = res[0];
          const offsetX = touch.clientX - rect.left;
          const percent = Math.min(Math.max(offsetX / rect.width * 100, 0), 100);
          dragPercent.value = percent;
        }
      });
    };
    common_vendor.watch(() => showMiniPlayer.value, (isShowing) => {
      let height = 0;
      if (isShowing) {
        const rpxToPx = common_vendor.index.getSystemInfoSync().windowWidth / 750;
        const miniPlayerHeight = 140 * rpxToPx;
        if (isTabPage.value) {
          height = miniPlayerHeight;
        } else {
          height = miniPlayerHeight + 20;
        }
      }
      common_vendor.index.$emit("miniPlayerHeightChange", { height, isShowing });
    }, { immediate: true });
    common_vendor.watch(() => playing.value, (isPlaying, oldIsPlaying) => {
      var _a;
      const currentSongId = (_a = currentSong.value) == null ? void 0 : _a.id;
      console.log("[MiniPlayer] 播放状态变化:", isPlaying, "歌曲ID:", currentSongId, "lastPlayedSongId:", lastPlayedSongId, "danmakuLoadedForSong:", danmakuLoadedForSong);
      if (isPlaying) {
        const isSameSongResume = currentSongId && lastPlayedSongId && lastPlayedSongId === currentSongId && danmakuLoadedForSong === currentSongId;
        if (isSameSongResume) {
          console.log("[MiniPlayer] 同一首歌暂停恢复，继续弹幕");
          resumeDanmaku();
        } else {
          console.log("[MiniPlayer] 播放状态变为true，尝试触发弹幕加载");
          checkAndLoadDanmaku();
        }
      } else {
        pauseDanmaku();
      }
    });
    const notifyHeightChange = () => {
      var _a;
      const isShowing = showMiniPlayer.value;
      let height = 0;
      if (isShowing) {
        const rpxToPx = common_vendor.index.getSystemInfoSync().windowWidth / 750;
        const miniPlayerHeight = 140 * rpxToPx;
        let isTab = false;
        try {
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1];
          const route = (currentPage == null ? void 0 : currentPage.route) || ((_a = currentPage == null ? void 0 : currentPage.$page) == null ? void 0 : _a.route) || "";
          const tabPages = [
            "pages/index/index",
            "pages/search/index",
            "pages/playlist/index",
            "pages/my/index"
          ];
          isTab = tabPages.some((tab) => route.includes(tab));
        } catch (e) {
        }
        if (isTab) {
          height = miniPlayerHeight;
        } else {
          height = miniPlayerHeight + 20;
        }
        updateMiniPlayerBottom();
      }
      common_vendor.index.$emit("miniPlayerHeightChange", { height, isShowing });
    };
    common_vendor.onMounted(() => {
      var _a;
      getSystemInfo();
      checkDarkMode();
      initDanmaku();
      updateMiniPlayerBottom();
      setTimeout(checkMarquee, 300);
      setTimeout(checkStatusMarquee, 350);
      if (playing.value && ((_a = currentSong.value) == null ? void 0 : _a.id) && showDanmaku.value) {
        console.log("[MiniPlayer] 组件挂载时恢复弹幕, 歌曲ID:", currentSong.value.id);
        setTimeout(() => {
          fetchDanmakuComments();
        }, 100);
      }
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage) {
        const originalOnShow = currentPage.onShow;
        currentPage.onShow = () => {
          var _a2;
          checkDarkMode();
          updateMiniPlayerBottom();
          notifyHeightChange();
          if (playing.value && ((_a2 = currentSong.value) == null ? void 0 : _a2.id) && showDanmaku.value) {
            console.log("[MiniPlayer] 页面显示时尝试触发弹幕加载");
            checkAndLoadDanmaku();
          }
          if (originalOnShow)
            originalOnShow.call(currentPage);
        };
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: showMiniPlayer.value
      }, showMiniPlayer.value ? common_vendor.e({
        b: coverUrl.value,
        c: common_vendor.o(handleCoverImageError),
        d: common_vendor.t(((_a = currentSong.value) == null ? void 0 : _a.name) || "夏日微风"),
        e: common_vendor.t(((_b = currentSong.value) == null ? void 0 : _b.ar) ? currentSong.value.ar.map((a) => a.name).join("/") : ((_c = currentSong.value) == null ? void 0 : _c.artists) ? currentSong.value.artists.map((a) => a.name).join("/") : "海洋之声"),
        f: marqueeScroll.value
      }, marqueeScroll.value ? {} : {}, {
        g: marqueeScroll.value
      }, marqueeScroll.value ? {
        h: common_vendor.t(((_d = currentSong.value) == null ? void 0 : _d.name) || "夏日微风")
      } : {}, {
        i: marqueeScroll.value
      }, marqueeScroll.value ? {} : {}, {
        j: marqueeScroll.value
      }, marqueeScroll.value ? {
        k: common_vendor.t(((_e = currentSong.value) == null ? void 0 : _e.ar) ? currentSong.value.ar.map((a) => a.name).join("/") : ((_f = currentSong.value) == null ? void 0 : _f.artists) ? currentSong.value.artists.map((a) => a.name).join("/") : "海洋之声")
      } : {}, {
        l: marqueeScroll.value ? 1 : "",
        m: statusText.value
      }, statusText.value ? common_vendor.e({
        n: common_vendor.t(statusText.value),
        o: statusMarqueeScroll.value
      }, statusMarqueeScroll.value ? {} : {}, {
        p: statusMarqueeScroll.value
      }, statusMarqueeScroll.value ? {
        q: common_vendor.t(statusText.value)
      } : {}, {
        r: statusMarqueeScroll.value ? 1 : ""
      }) : {}, {
        s: common_vendor.p({
          name: playing.value ? "pause" : "play",
          size: "16",
          color: "#ffffff"
        }),
        t: common_vendor.o(togglePlay),
        v: common_vendor.p({
          name: "forward-step",
          size: "16",
          color: "#999999"
        }),
        w: common_vendor.o(playNext),
        x: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        y: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        z: common_vendor.o(onProgressTouchStart),
        A: common_vendor.o(onProgressTouchMove),
        B: common_vendor.o(onProgressTouchEnd),
        C: common_vendor.o(() => {
        }),
        D: darkMode.value ? 1 : "",
        E: common_vendor.o(openFullPlayer),
        F: showDanmaku.value && activeDanmaku.value.length > 0
      }, showDanmaku.value && activeDanmaku.value.length > 0 ? {
        G: common_vendor.f(activeDanmaku.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.userName),
            b: common_vendor.t(item.text),
            c: item.uniqueId,
            d: item.uniqueId,
            e: common_vendor.o(($event) => onDanmakuEnd($event), item.uniqueId)
          };
        }),
        H: darkMode.value ? 1 : "",
        I: !playing.value ? 1 : ""
      } : {}, {
        J: common_vendor.s(_ctx.__cssVars())
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6d13b8ba"]]);
wx.createComponent(Component);
