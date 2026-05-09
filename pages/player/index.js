"use strict";
const common_vendor = require("../../common/vendor.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
const store_modules_comment = require("../../store/modules/comment.js");
const utils_lyricCache = require("../../utils/lyricCache.js");
const utils_musicPic = require("../../utils/musicPic.js");
const utils_lyric = require("../../utils/lyric.js");
const utils_kgLyricDecoder = require("../../utils/kgLyricDecoder.js");
const utils_system = require("../../utils/system.js");
const utils_imageProxy = require("../../utils/imageProxy.js");
const utils_musicSwitchSourceStorage = require("../../utils/musicSwitchSourceStorage.js");
if (!Math) {
  (RocIconPlus + DanmakuView + FavoritePopup + MusicComment + MusicToggleModal)();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const DanmakuView = () => "../../components/danmaku/DanmakuView.js";
const MusicComment = () => "../../components/comment/MusicComment.js";
const MusicToggleModal = () => "../../components/player/MusicToggleModal.js";
const FavoritePopup = () => "../../components/common/FavoritePopup.js";
const TABLET_ASPECT_RATIO = 0.85;
const TABLET_MIN_WIDTH = 400;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    common_vendor.useCssVars((_ctx) => ({
      "dc0b8d98": lyricsContainerHeight.value + "rpx"
    }));
    const instance = common_vendor.getCurrentInstance();
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const navbarStyle = common_vendor.computed(() => ({
      paddingTop: `${statusBarHeight.value}px`
    }));
    const tabletModalSafeTop = common_vendor.computed(() => {
      if (!isTablet.value)
        return "0px";
      return `${utils_system.getNavbarHeight()}px`;
    });
    const currentSong = common_vendor.computed(() => {
      var _a, _b;
      const song = store_modules_player.playerStore.state.currentSong;
      console.log("[player] currentSong computed:", {
        name: song == null ? void 0 : song.name,
        al: song == null ? void 0 : song.al,
        albumName: song == null ? void 0 : song.albumName,
        album: song == null ? void 0 : song.album,
        "al?.name": (_a = song == null ? void 0 : song.al) == null ? void 0 : _a.name,
        "albumName": song == null ? void 0 : song.albumName,
        "album?.name": (_b = song == null ? void 0 : song.album) == null ? void 0 : _b.name
      });
      return song;
    });
    const originalSong = common_vendor.computed(() => {
      const song = store_modules_player.playerStore.state.originalSong;
      console.log("[player] originalSong computed:", {
        name: song == null ? void 0 : song.name,
        source: song == null ? void 0 : song.source,
        id: song == null ? void 0 : song.id
      });
      return song;
    });
    const playing = common_vendor.computed(() => store_modules_player.playerStore.state.playing);
    const playMode = common_vendor.computed(() => store_modules_player.playerStore.state.playMode);
    const isLoading = common_vendor.computed(() => store_modules_player.playerStore.state.isLoading);
    const currentTime = common_vendor.computed(() => store_modules_player.playerStore.state.currentTime);
    const duration = common_vendor.computed(() => store_modules_player.playerStore.state.duration);
    const isDragging = common_vendor.ref(false);
    const dragPercent = common_vendor.ref(0);
    const currentSlide = common_vendor.ref(0);
    const isTablet = common_vendor.ref(false);
    const checkIsTablet = () => {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const width = systemInfo.windowWidth || systemInfo.screenWidth || 0;
        const height = systemInfo.windowHeight || systemInfo.screenHeight || 0;
        isTablet.value = width / height >= TABLET_ASPECT_RATIO && width >= TABLET_MIN_WIDTH;
        console.log("[player] 容器:", width, "x", height, "宽高比:", (width / height).toFixed(2), "平板模式:", isTablet.value);
      } catch (e) {
        isTablet.value = false;
      }
    };
    checkIsTablet();
    const lyricsContainerHeight = common_vendor.ref(750);
    const calculateLyricsContainerHeight = () => {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const screenHeight = systemInfo.screenHeight;
        const windowHeight = systemInfo.windowHeight;
        let height;
        if (screenHeight >= 900) {
          height = 850;
        } else if (screenHeight >= 800) {
          height = 800;
        } else if (screenHeight >= 700) {
          height = 750;
        } else {
          height = 650;
        }
        lyricsContainerHeight.value = height;
        console.log("[player] 歌词容器高度:", height, "屏幕高度:", screenHeight);
      } catch (e) {
        console.error("[player] 计算歌词容器高度失败:", e);
        lyricsContainerHeight.value = 750;
      }
    };
    const lyrics = common_vendor.ref([]);
    const currentLyricIndex = common_vendor.ref(0);
    const isLoadingLyrics = common_vendor.ref(false);
    const lyricScrollTop = common_vendor.ref(0);
    const tabletLyricScrollTop = common_vendor.ref(0);
    common_vendor.ref("");
    let lastScrollIndex = -1;
    let isScrollToActive = false;
    let isUserScrolling = false;
    let userScrollTimer = null;
    const showAddToModalFlag = common_vendor.ref(false);
    const availableLists = common_vendor.computed(() => store_modules_list.listStore.getAllAvailableLists());
    const isCurrentSongFavorite = common_vendor.computed(() => {
      if (!currentSong.value)
        return false;
      return store_modules_list.listStore.isInLoveList(currentSong.value.id);
    });
    const hasSwitchedSource = common_vendor.computed(() => store_modules_player.playerStore.hasSwitchedSource);
    const showSourceSwitchHint = common_vendor.computed(() => store_modules_player.playerStore.getState().showSourceSwitchHint);
    const showFavoriteHint = common_vendor.ref(false);
    const currentFavoriteHintText = common_vendor.ref("喜欢这首歌？点击收藏");
    let favoriteHintTimer = null;
    const songPicCache = common_vendor.ref("");
    const showDefaultCover = common_vendor.ref(true);
    common_vendor.ref(null);
    const navbarMarqueeScroll = common_vendor.ref(false);
    common_vendor.ref(null);
    const statusMarqueeScroll = common_vendor.ref(false);
    const playerStatusText = common_vendor.ref("");
    const isShowingStatusText = common_vendor.ref(false);
    const showDanmaku = common_vendor.ref(common_vendor.index.getStorageSync("showCommentDanmaku") !== "false");
    const danmakuList = common_vendor.ref([]);
    const commentTotalCount = common_vendor.ref(0);
    let danmakuLoadedForSong = null;
    let lyricsLoadedForSong = null;
    const cachedParsedLyricsForStatus = common_vendor.ref([]);
    const lastLyricTextForStatus = common_vendor.ref("");
    const wasPlayingForStatus = common_vendor.ref(false);
    const hasCheckedLyricsForStatus = common_vendor.ref(false);
    const updateCachedLyricsForStatus = () => {
      var _a, _b, _c, _d;
      const store = store_modules_player.playerStore.state;
      console.log("[player] updateCachedLyricsForStatus 调用:", {
        lyricLength: (_a = store.lyric) == null ? void 0 : _a.length,
        tlyricLength: (_b = store.tlyric) == null ? void 0 : _b.length,
        lxlyricLength: (_c = store.lxlyric) == null ? void 0 : _c.length,
        cachedLength: cachedParsedLyricsForStatus.value.length
      });
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
      console.log("[player] updateCachedLyricsForStatus finalLyric:", {
        length: finalLyric == null ? void 0 : finalLyric.length,
        lastLyricLength: (_d = lastLyricTextForStatus.value) == null ? void 0 : _d.length,
        isSame: finalLyric === lastLyricTextForStatus.value
      });
      if (finalLyric !== lastLyricTextForStatus.value) {
        lastLyricTextForStatus.value = finalLyric;
        if (finalLyric) {
          cachedParsedLyricsForStatus.value = utils_lyric.parseLyric(finalLyric);
          console.log("[player] 解析歌词成功，行数:", cachedParsedLyricsForStatus.value.length);
          hasCheckedLyricsForStatus.value = true;
          common_vendor.nextTick$1(() => {
            updateCurrentLyricTextForStatus();
          });
        } else {
          cachedParsedLyricsForStatus.value = [];
          console.log("[player] 歌词为空，清空缓存");
          hasCheckedLyricsForStatus.value = true;
          common_vendor.nextTick$1(() => {
            updateCurrentLyricTextForStatus();
          });
        }
      }
    };
    const updateCurrentLyricTextForStatus = () => {
      const store = store_modules_player.playerStore.state;
      if (store.statusText) {
        playerStatusText.value = store.statusText;
        isShowingStatusText.value = true;
        hasCheckedLyricsForStatus.value = false;
        return;
      }
      isShowingStatusText.value = false;
      if (store.playing && !wasPlayingForStatus.value) {
        wasPlayingForStatus.value = true;
        hasCheckedLyricsForStatus.value = true;
      }
      if (store.playing && !hasCheckedLyricsForStatus.value) {
        hasCheckedLyricsForStatus.value = true;
      }
      if (hasCheckedLyricsForStatus.value) {
        const hasLyrics = cachedParsedLyricsForStatus.value.length > 0;
        if (!hasLyrics) {
          playerStatusText.value = "暂无歌词";
          return;
        }
      }
      const currentTime2 = store.currentTime;
      if (currentTime2 && cachedParsedLyricsForStatus.value.length > 0) {
        const index = utils_lyric.getCurrentLyricIndex(cachedParsedLyricsForStatus.value, currentTime2);
        if (index >= 0 && index < cachedParsedLyricsForStatus.value.length) {
          playerStatusText.value = cachedParsedLyricsForStatus.value[index].text || "";
          return;
        }
      }
      playerStatusText.value = "";
    };
    const statusText = common_vendor.computed(() => playerStatusText.value);
    const tabletStatusText = common_vendor.computed(() => {
      const store = store_modules_player.playerStore.state;
      return store.statusText || "";
    });
    const showCommentFlag = common_vendor.ref(false);
    const showMusicToggleModal = common_vendor.ref(false);
    const toggleOriginalSong = common_vendor.ref(null);
    const darkMode = common_vendor.ref(false);
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[Player] 初始化暗黑模式:", darkMode.value);
      const storedDanmaku = common_vendor.index.getStorageSync("showCommentDanmaku");
      showDanmaku.value = storedDanmaku !== "false";
      console.log("[Player] 初始化弹幕设置:", showDanmaku.value, "storage:", storedDanmaku);
      common_vendor.index.$on("commentDanmakuChanged", (show) => {
        showDanmaku.value = show;
        console.log("[Player] 弹幕设置变化:", show);
      });
    };
    const refreshDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[Player] 刷新暗黑模式:", darkMode.value);
    };
    const checkAndLoadDanmaku = () => {
      var _a;
      const store = store_modules_player.playerStore.state;
      const currentSongId = (_a = store.currentSong) == null ? void 0 : _a.id;
      if (store.playing && currentSongId && danmakuLoadedForSong !== currentSongId) {
        danmakuLoadedForSong = currentSongId;
        fetchDanmakuComments();
      }
    };
    const fetchDanmakuComments = async () => {
      console.log("[Player] fetchDanmakuComments 被调用, showDanmaku:", showDanmaku.value);
      if (!showDanmaku.value) {
        console.log("[Player] 弹幕未开启");
        return;
      }
      const song = originalSong.value || currentSong.value;
      console.log("[Player] 获取弹幕评论, song:", song ? { id: song.id, source: song.source, name: song.name } : null);
      if (!song || !song.id || !song.source) {
        console.log("[Player] 歌曲信息不完整，无法获取弹幕");
        return;
      }
      try {
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
          const hotComments = result.hotComments || [];
          const latestComments = result.latestComments || [];
          commentTotalCount.value = result.totalCount || 0;
          const allComments = [...hotComments];
          const hotIds = new Set(hotComments.map((c) => c.id));
          for (const comment of latestComments) {
            if (!hotIds.has(comment.id)) {
              allComments.push(comment);
            }
          }
          danmakuList.value = allComments.slice(0, 30);
          console.log("[Player] 弹幕评论获取成功:", danmakuList.value.length, "(热门:", hotComments.length, "最新:", latestComments.length + ")");
        } else {
          console.log("[Player] 弹幕评论为空");
          danmakuList.value = [];
          commentTotalCount.value = 0;
        }
      } catch (e) {
        console.log("[Player] 获取弹幕评论失败:", e);
        danmakuList.value = [];
        commentTotalCount.value = 0;
      }
    };
    const handleDanmakuLoadMore = async ({ requestIndex, callback }) => {
      console.log("[Player] 弹幕请求加载更多评论, 次数:", requestIndex);
      try {
        const result = await store_modules_comment.commentStore.fetchMoreComments(requestIndex);
        if (result === "loading") {
          console.log("[Player] 正在加载中，稍后重试");
          callback([]);
        } else if (result && result.alreadyLoaded) {
          console.log("[Player] 其他组件已加载过");
          callback(result);
        } else if (result && result.length > 0) {
          console.log("[Player] 加载更多评论成功:", result.length);
          callback(result);
        } else {
          console.log("[Player] 没有更多评论了");
          callback([]);
        }
      } catch (e) {
        console.log("[Player] 加载更多评论失败:", e);
        callback([]);
      }
    };
    const sleepTimerRemaining = common_vendor.ref(0);
    const showSleepTimerPopupFlag = common_vendor.ref(false);
    const sleepTimerPickerValue = common_vendor.ref([0, 0]);
    const tempSelectedHour = common_vendor.ref(0);
    const tempSelectedMinute = common_vendor.ref(0);
    const hourOptions = common_vendor.computed(() => {
      const hours = [];
      for (let i = 0; i <= 99; i++) {
        hours.push(i < 10 ? `0${i}` : `${i}`);
      }
      return hours;
    });
    const minuteOptions = common_vendor.computed(() => {
      const minutes = [];
      for (let i = 0; i <= 59; i++) {
        minutes.push(i < 10 ? `0${i}` : `${i}`);
      }
      return minutes;
    });
    const formatSleepTimerRemaining = common_vendor.computed(() => {
      const hours = Math.floor(sleepTimerRemaining.value / 3600);
      const minutes = Math.floor(sleepTimerRemaining.value % 3600 / 60);
      const seconds = sleepTimerRemaining.value % 60;
      if (hours > 0) {
        return `${hours}时${minutes}分${seconds}秒`;
      } else if (minutes > 0) {
        return `${minutes}分${seconds}秒`;
      } else {
        return `${seconds}秒`;
      }
    });
    const formatSleepTimerShort = common_vendor.computed(() => {
      const hours = Math.floor(sleepTimerRemaining.value / 3600);
      const minutes = Math.floor(sleepTimerRemaining.value % 3600 / 60);
      if (hours > 0) {
        return `${hours}h${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    });
    const handleSleepTimerUpdate = (data) => {
      sleepTimerRemaining.value = data.remaining;
    };
    const showSleepTimerPopup = () => {
      sleepTimerPickerValue.value = [0, 0];
      tempSelectedHour.value = 0;
      tempSelectedMinute.value = 0;
      showSleepTimerPopupFlag.value = true;
    };
    const closeSleepTimerPopup = () => {
      showSleepTimerPopupFlag.value = false;
    };
    const onSleepTimerPickerChange = (e) => {
      const value = e.detail.value;
      sleepTimerPickerValue.value = value;
      tempSelectedHour.value = value[0];
      tempSelectedMinute.value = value[1];
    };
    const cancelSleepTimer = () => {
      common_vendor.index.$emit("sleepTimerCancel");
    };
    const confirmSleepTimerSelection = () => {
      const hours = tempSelectedHour.value;
      const minutes = tempSelectedMinute.value;
      const totalSeconds = hours * 3600 + minutes * 60;
      if (totalSeconds <= 0) {
        common_vendor.index.showToast({
          title: "请选择有效的时间",
          icon: "none"
        });
        return;
      }
      common_vendor.index.$emit("sleepTimerSet", { totalSeconds });
      const displayText = hours > 0 ? `${hours}时${minutes}分后停止播放` : `${minutes}分钟后停止播放`;
      common_vendor.index.showToast({
        title: displayText,
        icon: "success"
      });
      closeSleepTimerPopup();
    };
    common_vendor.watch(() => playing.value, (isPlaying, oldIsPlaying) => {
      console.log("[Player] 播放状态变化:", isPlaying);
      if (isPlaying) {
        console.log("[Player] 播放状态变为true，尝试触发弹幕加载");
        checkAndLoadDanmaku();
      }
    });
    let hasLoadedLyricsOnMount = false;
    let playEndedCallbackSet = false;
    const setupPlayEndedCallback = async () => {
      if (playEndedCallbackSet)
        return;
      store_modules_player.playerStore.setOnPlayEndedCallback(async (playMode2) => {
        var _a, _b, _c, _d;
        console.log("[player] 播放结束回调触发，模式:", playMode2);
        if (playMode2 === "singleLoop") {
          console.log("[player] 单曲循环，重新播放当前歌曲");
          if (currentSong.value) {
            const audioContext = store_modules_player.playerStore.state.audioContext;
            const currentSongData = currentSong.value;
            if (audioContext && currentSongData) {
              let playUrl = currentSongData.url || currentSongData.playUrl;
              if (!playUrl) {
                console.log("[player] 当前歌曲没有播放URL");
                return;
              }
              const secureUrl = playUrl.replace(/^http:/, "https:");
              console.log("[player] 微信小程序，重新设置src播放");
              audioContext.title = currentSongData.name || "未知歌曲";
              audioContext.singer = formatArtists(currentSongData);
              let coverImgUrl = ((_a = currentSongData.al) == null ? void 0 : _a.picUrl) || ((_b = currentSongData.album) == null ? void 0 : _b.picUrl) || currentSongData.img || "";
              if (coverImgUrl) {
                coverImgUrl = coverImgUrl.replace(/^http:/, "https:");
              }
              audioContext.coverImgUrl = coverImgUrl;
              audioContext.epname = ((_c = currentSongData.al) == null ? void 0 : _c.name) || ((_d = currentSongData.album) == null ? void 0 : _d.name) || "未知专辑";
              audioContext.src = secureUrl;
              audioContext.play();
              console.log("[player] 单曲循环播放已触发");
            }
          }
          return;
        }
        if (playMode2 === "list") {
          console.log("[player] 顺序播放模式，检查是否最后一首");
          const currentListId = store_modules_list.listStore.state.playInfo.playerListId;
          const currentList = currentListId === store_modules_list.LIST_IDS.DEFAULT ? store_modules_list.listStore.state.defaultList.list : currentListId === store_modules_list.LIST_IDS.LOVE ? store_modules_list.listStore.state.loveList.list : store_modules_list.listStore.state.tempList.list;
          const currentIndex = store_modules_list.listStore.state.playInfo.playerPlayIndex;
          if (currentIndex >= currentList.length - 1) {
            console.log("[player] 顺序播放模式：已是最后一首，停止播放");
            store_modules_player.playerStore.pause();
            return;
          }
          console.log("[player] 顺序播放模式：不是最后一首，切换到下一首");
          const nextSongInfo2 = store_modules_list.listStore.getNextSong("list", true);
          if (nextSongInfo2 && nextSongInfo2.musicInfo) {
            console.log("[player] 自动播放下一首:", nextSongInfo2.musicInfo.name);
            await playSongFromList(nextSongInfo2);
          } else {
            console.log("[player] 没有下一首歌曲可播放");
          }
          return;
        }
        if (playMode2 === "none") {
          console.log("[player] 禁用模式，不自动切换下一首");
          store_modules_player.playerStore.pause();
          return;
        }
        const togglePlayMethod = playMode2 === "random" ? "random" : "listLoop";
        const nextSongInfo = store_modules_list.listStore.getNextSong(togglePlayMethod, true);
        if (nextSongInfo && nextSongInfo.musicInfo) {
          console.log("[player] 自动播放下一首:", nextSongInfo.musicInfo.name);
          await playSongFromList(nextSongInfo);
        } else {
          console.log("[player] 没有下一首歌曲可播放");
        }
      });
      playEndedCallbackSet = true;
      console.log("[player] 播放结束回调已设置");
    };
    common_vendor.onMounted(() => {
      console.log("[player] onMounted 调用");
      calculateLyricsContainerHeight();
      initDarkMode();
      checkIsTablet();
      if (!hasLoadedLyricsOnMount && currentSong.value && currentSong.value.id) {
        console.log("[player] onMounted - 调用loadLyrics");
        hasLoadedLyricsOnMount = true;
        common_vendor.nextTick$1(() => {
          loadLyrics && loadLyrics();
        });
      }
      setupPlayEndedCallback();
      common_vendor.nextTick$1(() => {
        checkNavbarMarquee();
      });
      common_vendor.index.onWindowResize(() => {
        checkIsTablet();
      });
    });
    common_vendor.onShow(() => {
      console.log("[player] onShow 调用");
      utils_system.setStatusBarTextColor("black");
      refreshDarkMode();
      setupPlayEndedCallback();
      checkIsTablet();
      if (currentSong.value) {
        console.log("[player] onShow currentSong 歌手字段检查:", {
          singer: currentSong.value.singer,
          ar: currentSong.value.ar,
          artists: currentSong.value.artists,
          name: currentSong.value.name
        });
      }
      if (!hasLoadedLyricsOnMount && lyrics.value.length === 0 && currentSong.value && currentSong.value.id) {
        console.log("[player] onShow - 歌词为空，调用loadLyrics");
        hasLoadedLyricsOnMount = true;
        common_vendor.nextTick$1(() => {
          loadLyrics && loadLyrics();
        });
      }
      common_vendor.index.$on("sleepTimerUpdate", handleSleepTimerUpdate);
      const app = getApp();
      if (app && app.getSleepTimerRemaining) {
        sleepTimerRemaining.value = app.getSleepTimerRemaining();
      }
    });
    common_vendor.onHide(() => {
      console.log("[player] onHide 调用 - 页面隐藏，不做任何操作");
      common_vendor.index.$off("sleepTimerUpdate", handleSleepTimerUpdate);
    });
    common_vendor.onUnload(() => {
      console.log("[player] onUnload 调用 - 页面卸载，清理资源");
      lyrics.value = [];
      currentLyricIndex.value = 0;
      common_vendor.index.$off("sleepTimerUpdate", handleSleepTimerUpdate);
    });
    common_vendor.onUnmounted(() => {
      console.log("[player] onUnmounted 调用 - 组件卸载");
      if (favoriteHintTimer) {
        clearTimeout(favoriteHintTimer);
        favoriteHintTimer = null;
      }
    });
    common_vendor.onBackPress(() => {
      console.log("[player] onBackPress 触发 - 系统返回按钮被按下，销毁页面");
      return false;
    });
    common_vendor.watch(() => {
      var _a;
      return (_a = currentSong.value) == null ? void 0 : _a.id;
    }, async (newId, oldId) => {
      if (newId !== oldId) {
        const song = currentSong.value;
        if (song) {
          const source = song.sourceId || song.source;
          let picUrl = utils_musicPic.getSongPicUrl(song, source);
          if (picUrl) {
            songPicCache.value = picUrl;
            showDefaultCover.value = false;
          } else {
            songPicCache.value = "";
            showDefaultCover.value = true;
            picUrl = await utils_musicPic.fetchSongPicUrl(song, source);
            if (picUrl) {
              songPicCache.value = picUrl;
              showDefaultCover.value = false;
            }
          }
          console.log("[songPicCache] 更新图片缓存:", songPicCache.value, "showDefaultCover:", showDefaultCover.value, "source:", source);
        } else {
          songPicCache.value = "";
          showDefaultCover.value = true;
        }
        navbarMarqueeScroll.value = false;
        common_vendor.nextTick$1(() => {
          checkNavbarMarquee();
        });
        if (danmakuList.value.length > 0) {
          danmakuList.value = [];
        }
        if (oldId && oldId !== newId) {
          const oldSong = store_modules_player.playerStore.getState().originalSong;
          if (oldSong && oldSong.source) {
            store_modules_comment.commentStore.clearCommentCache(oldId, oldSong.source);
          }
        }
      }
    }, { immediate: true });
    common_vendor.watch(() => statusText.value, () => {
      statusMarqueeScroll.value = false;
      common_vendor.nextTick$1(() => {
        checkStatusMarquee();
      });
    });
    const progressPercent = common_vendor.computed(() => {
      if (isDragging.value) {
        return dragPercent.value;
      }
      return duration.value > 0 ? currentTime.value / duration.value * 100 : 0;
    });
    const playModeIcon = common_vendor.computed(() => {
      const modeIcons = {
        "listLoop": "repeat",
        "random": "shuffle",
        "list": "arrow-right-arrow-left",
        "singleLoop": "rotate-right",
        "none": "ban"
      };
      return modeIcons[playMode.value] || "repeat";
    });
    common_vendor.computed(() => {
      const modeNames = {
        "listLoop": "列表循环",
        "random": "随机播放",
        "list": "顺序播放",
        "singleLoop": "单曲循环",
        "none": "禁用歌曲切换"
      };
      return modeNames[playMode.value] || "列表循环";
    });
    const formatArtists = (song) => {
      if (!song)
        return "未知歌手";
      if (song.singer) {
        return song.singer;
      }
      if (song.ar && song.ar.length > 0) {
        return song.ar.map((a) => a.name).join("/");
      }
      if (song.artists && song.artists.length > 0) {
        return song.artists.map((a) => a.name).join("/");
      }
      return "未知歌手";
    };
    const formatAlbum = (song) => {
      var _a, _b;
      if (!song)
        return "未知";
      let artistName = "";
      if (song.ar && Array.isArray(song.ar) && song.ar.length > 0) {
        artistName = song.ar.map((a) => a.name).join("/");
      } else if (song.artists && Array.isArray(song.artists) && song.artists.length > 0) {
        artistName = song.artists.map((a) => a.name).join("/");
      } else if (song.singer) {
        artistName = song.singer;
      }
      let albumName = "";
      if ((_a = song.al) == null ? void 0 : _a.name) {
        albumName = song.al.name;
      } else if (song.albumName) {
        albumName = song.albumName;
      } else if ((_b = song.album) == null ? void 0 : _b.name) {
        albumName = song.album.name;
      } else if (song.album) {
        albumName = song.album;
      }
      if (artistName && albumName) {
        return `${artistName}-${albumName}`;
      } else if (artistName) {
        return artistName;
      } else if (albumName) {
        return albumName;
      }
      return "未知";
    };
    const onPicError = () => {
      console.log("[onPicError] 图片加载失败，使用默认图标");
      songPicCache.value = "";
      showDefaultCover.value = true;
    };
    const previewCoverImage = () => {
      if (!songPicCache.value) {
        console.log("[player] 没有封面图片，无法预览");
        return;
      }
      console.log("[player] 预览封面图片:", songPicCache.value);
      common_vendor.index.previewImage({
        current: utils_imageProxy.proxyImageUrl(songPicCache.value),
        urls: [utils_imageProxy.proxyImageUrl(songPicCache.value)]
      });
    };
    const handlePlayerImageError = (event) => {
      if (!songPicCache.value) {
        onPicError();
        return;
      }
      let currentProxyIndex = 0;
      if (songPicCache.value.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (songPicCache.value.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (songPicCache.value.includes("jina.ai"))
        currentProxyIndex = 3;
      const nextUrl = utils_imageProxy.handleImageError(event, songPicCache.value, currentProxyIndex);
      if (nextUrl) {
        songPicCache.value = nextUrl;
      } else {
        onPicError();
      }
    };
    const formatTime = (time) => {
      if (!time || isNaN(time))
        return "00:00";
      time = Math.floor(time);
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };
    const checkNavbarMarquee = () => {
      try {
        const query = common_vendor.index.createSelectorQuery().in(instance);
        query.select(".player-navbar__marquee").boundingClientRect();
        query.select(".player-navbar__marquee-content").boundingClientRect();
        query.exec((rects) => {
          if (!rects || !rects[0] || !rects[1])
            return;
          const marqueeRect = rects[0];
          const contentRect = rects[1];
          const singleContentWidth = navbarMarqueeScroll.value ? contentRect.width / 2 : contentRect.width;
          navbarMarqueeScroll.value = singleContentWidth > marqueeRect.width + 5;
        });
      } catch (e) {
      }
    };
    const checkStatusMarquee = () => {
      if (!statusText.value)
        return;
      try {
        const query = common_vendor.index.createSelectorQuery().in(instance);
        query.select(".song-info__status-marquee").boundingClientRect();
        query.select(".song-info__status-content").boundingClientRect();
        query.exec((rects) => {
          if (!rects || !rects[0] || !rects[1])
            return;
          const marqueeRect = rects[0];
          const contentRect = rects[1];
          const singleContentWidth = statusMarqueeScroll.value ? contentRect.width / 2 : contentRect.width;
          statusMarqueeScroll.value = singleContentWidth > marqueeRect.width + 5;
        });
      } catch (e) {
      }
    };
    const goBack = () => {
      console.log("[player] goBack 调用 - 用户点击返回");
      common_vendor.index.navigateBack();
    };
    const togglePlay = () => {
      store_modules_player.playerStore.togglePlay();
    };
    const playNext = async () => {
      console.log("[Player] 播放下一首, 当前播放模式:", playMode.value);
      console.log("[Player] 👆 用户主动操作（下一首），重置失败计数");
      store_modules_player.playerStore.setState({
        isUserManualSwitch: true,
        playNextRetryCount: 0,
        isPlaybackStopped: false,
        currentFailingSongId: null
      });
      let togglePlayMethod;
      switch (playMode.value) {
        case "random":
          togglePlayMethod = "random";
          break;
        case "singleLoop":
          togglePlayMethod = "listLoop";
          break;
        case "list":
          togglePlayMethod = "list";
          break;
        default:
          togglePlayMethod = "listLoop";
      }
      console.log("[Player] 使用的切换方法:", togglePlayMethod);
      if (store_modules_player.playerStore.getState().isGettingUrl) {
        console.log("[Player] 正在获取播放链接，只更新待播放歌曲");
        const nextSongInfo2 = store_modules_list.listStore.getNextSong(togglePlayMethod, false);
        if (nextSongInfo2 && nextSongInfo2.musicInfo) {
          console.log("[Player] 更新待播放歌曲:", nextSongInfo2.musicInfo.name);
          store_modules_player.playerStore.updatePendingSong(nextSongInfo2.musicInfo);
        }
        return;
      }
      store_modules_player.playerStore.setGettingUrl(true);
      const nextSongInfo = store_modules_list.listStore.getNextSong(togglePlayMethod, false);
      if (!nextSongInfo || !nextSongInfo.musicInfo) {
        console.log("[Player] 没有下一首歌曲");
        store_modules_player.playerStore.setGettingUrl(false);
        common_vendor.index.showToast({
          title: "已经是最后一首了",
          icon: "none"
        });
        return;
      }
      console.log("[Player] 下一首歌曲:", nextSongInfo.musicInfo.name);
      await playSongFromList(nextSongInfo);
    };
    const playPrev = async () => {
      console.log("[Player] 播放上一首, 当前播放模式:", playMode.value);
      console.log("[Player] 👆 用户主动操作（上一首），重置失败计数");
      store_modules_player.playerStore.setState({
        isUserManualSwitch: true,
        playNextRetryCount: 0,
        isPlaybackStopped: false,
        currentFailingSongId: null
      });
      let togglePlayMethod;
      switch (playMode.value) {
        case "random":
          togglePlayMethod = "random";
          break;
        case "singleLoop":
          togglePlayMethod = "listLoop";
          break;
        case "list":
          togglePlayMethod = "list";
          break;
        default:
          togglePlayMethod = "listLoop";
      }
      console.log("[Player] 使用的切换方法:", togglePlayMethod);
      if (store_modules_player.playerStore.getState().isGettingUrl) {
        console.log("[Player] 正在获取播放链接，只更新待播放歌曲");
        const prevSongInfo2 = store_modules_list.listStore.getPrevSong(togglePlayMethod);
        if (prevSongInfo2 && prevSongInfo2.musicInfo) {
          console.log("[Player] 更新待播放歌曲:", prevSongInfo2.musicInfo.name);
          store_modules_player.playerStore.updatePendingSong(prevSongInfo2.musicInfo);
        }
        return;
      }
      store_modules_player.playerStore.setGettingUrl(true);
      const prevSongInfo = store_modules_list.listStore.getPrevSong(togglePlayMethod);
      if (!prevSongInfo || !prevSongInfo.musicInfo) {
        console.log("[Player] 没有上一首歌曲");
        store_modules_player.playerStore.setGettingUrl(false);
        common_vendor.index.showToast({
          title: "已经是第一首了",
          icon: "none"
        });
        return;
      }
      console.log("[Player] 上一首歌曲:", prevSongInfo.musicInfo.name);
      await playSongFromList(prevSongInfo);
    };
    const playSongFromList = async (playMusicInfo) => {
      const song = playMusicInfo.musicInfo;
      const listId = playMusicInfo.listId;
      const isTempPlay = playMusicInfo.isTempPlay;
      try {
        const songWithoutUrl = {
          ...song,
          url: "",
          playUrl: ""
        };
        store_modules_list.listStore.setPlayMusicInfo(listId, songWithoutUrl, isTempPlay);
        store_modules_list.listStore.addPlayedList({
          listId,
          musicInfo: songWithoutUrl,
          isTempPlay
        });
        await store_modules_player.playerStore.playSong(songWithoutUrl);
        lyrics.value = [];
        currentLyricIndex.value = 0;
        isLoadingLyrics.value = false;
        hasLoadedLyricsOnMount = false;
        common_vendor.nextTick$1(() => {
          loadLyrics();
        });
      } catch (error) {
        console.error("[Player] 播放失败:", error);
        store_modules_player.playerStore.setGettingUrl(false);
        common_vendor.index.showToast({
          title: "播放失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
    };
    const togglePlayMode = () => {
      const modes = ["listLoop", "random", "list", "singleLoop", "none"];
      const currentIndex = modes.indexOf(playMode.value);
      const nextIndex = (currentIndex + 1) % modes.length;
      const nextMode = modes[nextIndex];
      store_modules_player.playerStore.setPlayMode(nextMode);
      const modeNames = {
        "listLoop": "列表循环",
        "random": "随机播放",
        "list": "顺序播放",
        "singleLoop": "单曲循环",
        "none": "禁用歌曲切换"
      };
      common_vendor.index.showToast({
        title: modeNames[nextMode],
        icon: "none"
      });
    };
    const onSwiperChange = (e) => {
      currentSlide.value = e.detail.current;
      console.log("[player] 滑动切换到:", currentSlide.value === 0 ? "专辑" : "歌词");
    };
    const switchToLyrics = () => {
      currentSlide.value = 1;
      console.log("[player] 点击左箭头，切换到歌词视图");
    };
    const switchToAlbum = () => {
      currentSlide.value = 0;
      console.log("[player] 点击右箭头，切换到专辑视图");
    };
    const processLyricData = (lyricInfo) => {
      console.log("[player] processLyricData 输入:", {
        hasLyric: !!(lyricInfo == null ? void 0 : lyricInfo.lyric),
        hasTlyric: !!(lyricInfo == null ? void 0 : lyricInfo.tlyric),
        hasRlyric: !!(lyricInfo == null ? void 0 : lyricInfo.rlyric),
        hasLxlyric: !!(lyricInfo == null ? void 0 : lyricInfo.lxlyric)
      });
      const { lyric, tlyric, rlyric, lxlyric } = utils_lyric.extractLyricsFromMusicData(lyricInfo);
      console.log("[player] extractLyricsFromMusicData 提取结果:", {
        lyricLength: lyric == null ? void 0 : lyric.length,
        tlyricLength: tlyric == null ? void 0 : tlyric.length,
        rlyricLength: rlyric == null ? void 0 : rlyric.length,
        lxlyricLength: lxlyric == null ? void 0 : lxlyric.length,
        lyricPreview: lyric == null ? void 0 : lyric.substring(0, 100)
      });
      console.log("[player] 开始解析歌词...");
      const parsedLyrics = utils_lyric.parseLyric(lyric);
      console.log("[player] parseLyric 结果:", {
        inputLength: lyric == null ? void 0 : lyric.length,
        outputLength: parsedLyrics == null ? void 0 : parsedLyrics.length,
        firstLine: parsedLyrics == null ? void 0 : parsedLyrics[0],
        lastLine: parsedLyrics == null ? void 0 : parsedLyrics[(parsedLyrics == null ? void 0 : parsedLyrics.length) - 1]
      });
      const parsedTranslations = utils_lyric.parseTranslation(tlyric);
      console.log("[player] parseTranslation 结果:", {
        inputLength: tlyric == null ? void 0 : tlyric.length,
        outputLength: parsedTranslations == null ? void 0 : parsedTranslations.length
      });
      const mergedLyrics = utils_lyric.mergeLyrics(parsedLyrics, parsedTranslations);
      console.log("[player] 歌词处理完成，共", mergedLyrics.length, "行");
      console.log("[player] 歌词数组前3行:", mergedLyrics.slice(0, 3));
      return mergedLyrics;
    };
    const loadLyrics = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      if (isLoadingLyrics.value) {
        console.log("[player] 歌词正在加载中，跳过重复请求");
        return;
      }
      if (lyrics.value.length > 0) {
        console.log("[player] 已有歌词，跳过加载");
        return;
      }
      isLoadingLyrics.value = true;
      console.log("[player] ========== 开始加载歌词 ==========");
      const songInfo = store_modules_player.playerStore.state.currentSong;
      console.log("[player] 当前歌曲信息:", {
        id: songInfo == null ? void 0 : songInfo.id,
        name: songInfo == null ? void 0 : songInfo.name,
        source: (songInfo == null ? void 0 : songInfo.source) || (songInfo == null ? void 0 : songInfo.sourceId)
      });
      try {
        let lyricInfo = {
          lyric: store_modules_player.playerStore.state.lyric || "",
          tlyric: store_modules_player.playerStore.state.tlyric || "",
          rlyric: store_modules_player.playerStore.state.rlyric || "",
          lxlyric: store_modules_player.playerStore.state.lxlyric || ""
        };
        console.log("[player] 从playerStore获取歌词:", {
          lyricLength: (_a = lyricInfo.lyric) == null ? void 0 : _a.length,
          tlyricLength: (_b = lyricInfo.tlyric) == null ? void 0 : _b.length,
          rlyricLength: (_c = lyricInfo.rlyric) == null ? void 0 : _c.length,
          lxlyricLength: (_d = lyricInfo.lxlyric) == null ? void 0 : _d.length,
          source: (songInfo == null ? void 0 : songInfo.source) || (songInfo == null ? void 0 : songInfo.sourceId)
        });
        if (!lyricInfo.lyric && !lyricInfo.tlyric && !lyricInfo.rlyric && !lyricInfo.lxlyric) {
          console.log("[player] playerStore中无歌词，尝试从缓存获取");
          const songSource = (songInfo == null ? void 0 : songInfo.source) || (songInfo == null ? void 0 : songInfo.sourceId) || "tx";
          console.log("[player] 获取歌词缓存，歌曲ID:", songInfo == null ? void 0 : songInfo.id, "音源:", songSource);
          const possibleSources = [];
          if ((songInfo == null ? void 0 : songInfo._toggleMusicInfo) && songInfo._toggleMusicInfo.newSource) {
            possibleSources.push(songInfo._toggleMusicInfo.newSource);
            console.log("[player] 优先从换源后source查找:", songInfo._toggleMusicInfo.newSource);
          }
          if (!possibleSources.includes(songSource)) {
            possibleSources.push(songSource);
          }
          if ((songInfo == null ? void 0 : songInfo.source) && (songInfo == null ? void 0 : songInfo.sourceId) && (songInfo == null ? void 0 : songInfo.source) !== (songInfo == null ? void 0 : songInfo.sourceId)) {
            if (!possibleSources.includes(songInfo == null ? void 0 : songInfo.sourceId)) {
              possibleSources.push(songInfo == null ? void 0 : songInfo.sourceId);
            }
          }
          if (songSource !== "tx" && !possibleSources.includes("tx")) {
            possibleSources.push("tx");
          }
          let cachedLyric = null;
          for (const source2 of possibleSources) {
            console.log("[player] 尝试获取歌词缓存，source:", source2);
            cachedLyric = await utils_lyricCache.getCachedLyric(songInfo == null ? void 0 : songInfo.id, source2);
            if (cachedLyric) {
              console.log("[player] 从缓存获取到歌词，source:", source2);
              break;
            }
          }
          if (cachedLyric) {
            lyricInfo = {
              lyric: cachedLyric.lyric || "",
              tlyric: cachedLyric.tlyric || "",
              rlyric: cachedLyric.rlyric || "",
              lxlyric: cachedLyric.lxlyric || ""
            };
          } else {
            console.log("[player] 缓存中也没有歌词，已尝试的source:", possibleSources);
          }
        }
        const source = (songInfo == null ? void 0 : songInfo.source) || (songInfo == null ? void 0 : songInfo.sourceId);
        if (source === "酷狗" || source === "kg") {
          console.log("[player] 检测到酷狗音源，检查歌词格式");
          if (utils_kgLyricDecoder.isKgCompressedLyric(lyricInfo.lyric)) {
            console.log("[player] 检测到酷狗压缩歌词，开始解码");
            const decodedLyrics = await utils_kgLyricDecoder.tryDecodeKgLyric(lyricInfo.lyric);
            console.log("[player] 酷狗歌词解码结果:", {
              lyricLength: (_e = decodedLyrics.lyric) == null ? void 0 : _e.length,
              tlyricLength: (_f = decodedLyrics.tlyric) == null ? void 0 : _f.length,
              rlyricLength: (_g = decodedLyrics.rlyric) == null ? void 0 : _g.length,
              lxlyricLength: (_h = decodedLyrics.lxlyric) == null ? void 0 : _h.length
            });
            lyricInfo = {
              lyric: decodedLyrics.lyric || lyricInfo.lyric,
              tlyric: decodedLyrics.tlyric || lyricInfo.tlyric,
              rlyric: decodedLyrics.rlyric || lyricInfo.rlyric,
              lxlyric: decodedLyrics.lxlyric || lyricInfo.lxlyric
            };
          }
          if (utils_kgLyricDecoder.isKgCompressedLyric(lyricInfo.lxlyric)) {
            console.log("[player] 检测到酷狗压缩lxlyric，开始解码");
            const decodedLxLyrics = await utils_kgLyricDecoder.tryDecodeKgLyric(lyricInfo.lxlyric);
            lyricInfo.lxlyric = decodedLxLyrics.lxlyric || lyricInfo.lxlyric;
            if (!lyricInfo.lyric && decodedLxLyrics.lyric) {
              lyricInfo.lyric = decodedLxLyrics.lyric;
            }
          }
        }
        lyrics.value = processLyricData(lyricInfo);
        store_modules_player.playerStore.setLyrics({
          lyric: lyricInfo.lyric,
          tlyric: lyricInfo.tlyric,
          rlyric: lyricInfo.rlyric,
          lxlyric: lyricInfo.lxlyric
        });
        const currentSongId = (_i = store_modules_player.playerStore.state.currentSong) == null ? void 0 : _i.id;
        if (currentSongId) {
          lyricsLoadedForSong = currentSongId;
          console.log("[Player] 歌词加载完成，尝试触发弹幕加载");
          checkAndLoadDanmaku();
        }
        common_vendor.nextTick$1(() => {
          setTimeout(() => {
            updateCurrentLyricIndex();
          }, 50);
        });
      } catch (error) {
        console.error("[player] 获取歌词失败:", error);
        console.error("[player] 错误详情:", error == null ? void 0 : error.message, error == null ? void 0 : error.stack);
        lyrics.value = [];
      } finally {
        isLoadingLyrics.value = false;
      }
      console.log("[player] ========== 歌词加载结束 ==========");
    };
    const updateCurrentLyricIndex = () => {
      if (lyrics.value.length === 0)
        return;
      const index = utils_lyric.getCurrentLyricIndex(lyrics.value, currentTime.value);
      if (index !== currentLyricIndex.value) {
        currentLyricIndex.value = index;
        scrollToCurrentLyric();
      }
    };
    const scrollToCurrentLyric = () => {
      if (currentLyricIndex.value < 0 || lyrics.value.length === 0)
        return;
      if (isUserScrolling)
        return;
      if (currentLyricIndex.value === lastScrollIndex && isScrollToActive) {
        return;
      }
      lastScrollIndex = currentLyricIndex.value;
      isScrollToActive = true;
      if (isTablet.value) {
        common_vendor.nextTick$1(() => {
          try {
            const query = common_vendor.index.createSelectorQuery().in(instance);
            query.select(".tablet-right").boundingClientRect();
            query.select("#tablet-lyric-line-" + currentLyricIndex.value).boundingClientRect();
            query.select(".tablet-lyrics-list").boundingClientRect();
            query.exec((res) => {
              if (!res || res.length < 3) {
                isScrollToActive = false;
                return;
              }
              const containerRect = res[0];
              const lineRect = res[1];
              const listRect = res[2];
              if (!containerRect || !lineRect || !listRect) {
                isScrollToActive = false;
                return;
              }
              const containerCenter = containerRect.height / 2;
              const lineHeight = lineRect.height;
              const lineTopInList = lineRect.top - listRect.top;
              const scrollTop = lineTopInList - containerCenter + lineHeight / 2;
              tabletLyricScrollTop.value = Math.max(0, scrollTop);
              setTimeout(() => {
                isScrollToActive = false;
              }, 300);
            });
          } catch (e) {
            console.error("[scrollToCurrentLyric] 平板滚动失败:", e);
            isScrollToActive = false;
          }
        });
        return;
      }
      common_vendor.nextTick$1(() => {
        try {
          const query = common_vendor.index.createSelectorQuery().in(instance);
          query.select(".lyrics-scroll-wrapper").boundingClientRect();
          query.select("#lyric-line-" + currentLyricIndex.value).boundingClientRect();
          query.select(".lyrics-scroll-view").scrollOffset();
          query.exec((res) => {
            if (!res || res.length < 3) {
              isScrollToActive = false;
              return;
            }
            const containerRect = res[0];
            const lineRect = res[1];
            const scrollInfo = res[2];
            if (!containerRect || !lineRect) {
              isScrollToActive = false;
              return;
            }
            const containerCenter = containerRect.height / 2;
            const lineTop = lineRect.top - containerRect.top;
            const scrollTop = scrollInfo.scrollTop + lineTop - containerCenter + lineRect.height / 2;
            lyricScrollTop.value = Math.max(0, scrollTop);
            setTimeout(() => {
              isScrollToActive = false;
            }, 300);
          });
        } catch (e) {
          console.error("[scrollToCurrentLyric] 滚动失败:", e);
          isScrollToActive = false;
        }
      });
    };
    const onLyricScroll = (e) => {
    };
    const onTabletLyricWheel = (e) => {
      isUserScrolling = true;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
      }
      userScrollTimer = setTimeout(() => {
        isUserScrolling = false;
        scrollToCurrentLyric();
      }, 5e3);
      const delta = e.deltaY;
      let newScrollTop = tabletLyricScrollTop.value + delta;
      common_vendor.nextTick$1(() => {
        try {
          const query = common_vendor.index.createSelectorQuery().in(instance);
          query.select(".tablet-right").boundingClientRect();
          query.select(".tablet-lyrics-list").boundingClientRect();
          query.exec((res) => {
            if (res && res[0] && res[1]) {
              const containerHeight = res[0].height;
              const contentHeight = res[1].height;
              const maxScroll = Math.max(0, contentHeight - containerHeight);
              newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
              tabletLyricScrollTop.value = newScrollTop;
            }
          });
        } catch (e2) {
        }
      });
    };
    let touchStartY = 0;
    const onTabletLyricTouchStart = (e) => {
      isUserScrolling = true;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
      }
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTabletLyricTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        touchStartY = touchY;
        let newScrollTop = tabletLyricScrollTop.value + deltaY;
        common_vendor.nextTick$1(() => {
          try {
            const query = common_vendor.index.createSelectorQuery().in(instance);
            query.select(".tablet-right").boundingClientRect();
            query.select(".tablet-lyrics-list").boundingClientRect();
            query.exec((res) => {
              if (res && res[0] && res[1]) {
                const containerHeight = res[0].height;
                const contentHeight = res[1].height;
                const maxScroll = Math.max(0, contentHeight - containerHeight);
                newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
                tabletLyricScrollTop.value = newScrollTop;
              }
            });
          } catch (e2) {
          }
        });
      }
    };
    const onTabletLyricTouchEnd = () => {
      userScrollTimer = setTimeout(() => {
        isUserScrolling = false;
        scrollToCurrentLyric();
      }, 5e3);
    };
    let isMouseDragging = false;
    let mouseStartY = 0;
    const onTabletLyricMouseDown = (e) => {
      if (!e)
        return;
      if (e.button && e.button !== 0)
        return;
      isMouseDragging = true;
      mouseStartY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      isUserScrolling = true;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
      }
      document.addEventListener("mousemove", onTabletLyricMouseMove);
      document.addEventListener("mouseup", onTabletLyricMouseUp);
      e.preventDefault ? e.preventDefault() : e.returnValue = false;
    };
    const onTabletLyricMouseMove = (e) => {
      if (!isMouseDragging)
        return;
      const mouseY = e.clientY || 0;
      const deltaY = mouseStartY - mouseY;
      mouseStartY = mouseY;
      let newScrollTop = tabletLyricScrollTop.value + deltaY;
      common_vendor.nextTick$1(() => {
        try {
          const query = common_vendor.index.createSelectorQuery().in(instance);
          query.select(".tablet-right").boundingClientRect();
          query.select(".tablet-lyrics-list").boundingClientRect();
          query.exec((res) => {
            if (res && res[0] && res[1]) {
              const containerHeight = res[0].height;
              const contentHeight = res[1].height;
              const maxScroll = Math.max(0, contentHeight - containerHeight);
              newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
              tabletLyricScrollTop.value = newScrollTop;
            }
          });
        } catch (err) {
        }
      });
    };
    const onTabletLyricMouseUp = () => {
      if (!isMouseDragging)
        return;
      isMouseDragging = false;
      document.removeEventListener("mousemove", onTabletLyricMouseMove);
      document.removeEventListener("mouseup", onTabletLyricMouseUp);
      userScrollTimer = setTimeout(() => {
        isUserScrolling = false;
        scrollToCurrentLyric();
      }, 5e3);
    };
    const onLyricScrollTap = () => {
      scrollToCurrentLyric();
    };
    const onLyricLineTap = (index) => {
      if (lyrics.value.length === 0 || index < 0 || index >= lyrics.value.length)
        return;
      const lyricTime = lyrics.value[index].time / 1e3;
      const seekPercent = duration.value > 0 ? lyricTime / duration.value * 100 : 0;
      store_modules_player.playerStore.setUserSeeking(true);
      currentLyricIndex.value = index;
      lastScrollIndex = -1;
      isScrollToActive = false;
      scrollToCurrentLyric();
      store_modules_player.playerStore.seek(seekPercent);
    };
    common_vendor.watch(() => currentTime.value, () => {
      if (currentSlide.value === 1 || isTablet.value) {
        updateCurrentLyricIndex();
      }
    });
    common_vendor.watch(() => store_modules_player.playerStore.state.lyric, updateCachedLyricsForStatus, { immediate: true });
    common_vendor.watch(() => store_modules_player.playerStore.state.lxlyric, updateCachedLyricsForStatus);
    common_vendor.watch(() => store_modules_player.playerStore.state.currentTime, updateCurrentLyricTextForStatus);
    common_vendor.watch(() => store_modules_player.playerStore.state.statusText, () => {
      updateCurrentLyricTextForStatus();
    }, { immediate: true });
    common_vendor.watch(() => currentSong.value, (newSong, oldSong) => {
      console.log("[player] watch currentSong 变化:", {
        newId: newSong == null ? void 0 : newSong.id,
        oldId: oldSong == null ? void 0 : oldSong.id,
        hasNewSong: !!(newSong && newSong.id)
      });
      if (newSong) {
        console.log("[player] currentSong 完整信息:", JSON.stringify(newSong, null, 2));
        console.log("[player] currentSong 歌手字段检查:", {
          singer: newSong.singer,
          ar: newSong.ar,
          artists: newSong.artists
        });
      }
      if ((newSong == null ? void 0 : newSong.id) !== (oldSong == null ? void 0 : oldSong.id)) {
        console.log("[player] 歌曲变化，清空歌词状态");
        lyrics.value = [];
        currentLyricIndex.value = 0;
        isLoadingLyrics.value = false;
        hasLoadedLyricsOnMount = false;
        wasPlayingForStatus.value = false;
        hasCheckedLyricsForStatus.value = false;
        danmakuLoadedForSong = null;
        lyricsLoadedForSong = null;
        danmakuList.value = [];
        commentTotalCount.value = 0;
        currentFavoriteHintSongId = null;
        shownHintSongs.delete(newSong == null ? void 0 : newSong.id);
        showFavoriteHint.value = false;
        if (favoriteHintTimer) {
          clearTimeout(favoriteHintTimer);
          favoriteHintTimer = null;
        }
        console.log("[player] 收藏提示跟踪已重置");
      }
      if (newSong && newSong.id && !hasLoadedLyricsOnMount) {
        console.log("[player] watch currentSong - 调用loadLyrics");
        hasLoadedLyricsOnMount = true;
        common_vendor.nextTick$1(() => {
          loadLyrics();
        });
      }
    });
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
      dragPercent.value / 100 * duration.value;
      store_modules_player.playerStore.seek(dragPercent.value);
    };
    const updateDragPercent = (e) => {
      const touch = e.touches[0];
      const query = common_vendor.index.createSelectorQuery();
      query.select(".progress-bar-wrapper").boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          const rect = res[0];
          const offsetX = touch.clientX - rect.left;
          const percent = Math.min(Math.max(offsetX / rect.width * 100, 0), 100);
          dragPercent.value = percent;
        }
      });
    };
    const showMusicToggle = () => {
      if (!currentSong.value) {
        common_vendor.index.showToast({ title: "没有正在播放的歌曲", icon: "none" });
        return;
      }
      toggleOriginalSong.value = originalSong.value || currentSong.value;
      showMusicToggleModal.value = true;
    };
    const closeMusicToggleModal = () => {
      showMusicToggleModal.value = false;
      toggleOriginalSong.value = null;
    };
    const handleToggleConfirm = (data) => {
      var _a, _b;
      const { originalSong: originalSong2, newSong } = data;
      console.log("[Player] 确认换源:", {
        from: originalSong2.name,
        to: newSong.name,
        originalId: originalSong2.id,
        newId: newSong.id
      });
      const songIdStr = String(originalSong2.id || "");
      const songKey = songIdStr.replace(/^(tx|wy|kg|kw|mg)_/, "") || songIdStr;
      console.log("[Player] 保存换源信息, 原始歌曲ID:", songKey, "原始source:", originalSong2.source, "新source:", newSong.source);
      utils_musicSwitchSourceStorage.saveMusicSwitchSource(songKey, {
        originalSource: originalSong2.source,
        newSource: newSong.source,
        newSongId: newSong.id,
        newSongName: newSong.name,
        newSongSinger: newSong.singer,
        url: newSong.url || newSong.playUrl || "",
        quality: newSong.quality || "standard"
      });
      console.log("[Player] 已保存换源信息到本地存储, 新歌曲ID:", newSong.id);
      const musicInfo = {
        ...newSong,
        id: newSong.id,
        name: newSong.name,
        singer: newSong.singer || ((_a = newSong.ar) == null ? void 0 : _a.map((a) => a.name).join(", ")) || "未知歌手",
        albumName: newSong.albumName || ((_b = newSong.al) == null ? void 0 : _b.name) || "",
        source: newSong.source,
        sourceId: newSong.sourceId
      };
      store_modules_player.playerStore.playSong(musicInfo);
      closeMusicToggleModal();
      common_vendor.index.showToast({ title: "已切换音源", icon: "success" });
    };
    const handleTogglePreview = async (song) => {
      var _a, _b;
      console.log("[Player] 预览换源:", song.name);
      try {
        const musicInfo = {
          ...song,
          id: song.id,
          name: song.name,
          singer: song.singer || ((_a = song.ar) == null ? void 0 : _a.map((a) => a.name).join(", ")) || "未知歌手",
          albumName: song.albumName || ((_b = song.al) == null ? void 0 : _b.name) || "",
          source: song.source,
          sourceId: song.sourceId
        };
        await store_modules_player.playerStore.playSong(musicInfo);
        common_vendor.index.showToast({ title: "已预览", icon: "none" });
      } catch (error) {
        console.error("[Player] 预览失败:", error);
        common_vendor.index.showToast({ title: "预览失败", icon: "none" });
      }
    };
    const showFavoriteTooltip = () => {
      if (isCurrentSongFavorite.value)
        return;
      if (showFavoriteHint.value)
        return;
      console.log("[Player] 显示收藏提示");
      currentFavoriteHintText.value = getRandomHintMessage();
      showFavoriteHint.value = true;
      if (favoriteHintTimer) {
        clearTimeout(favoriteHintTimer);
      }
      favoriteHintTimer = setTimeout(() => {
        showFavoriteHint.value = false;
        console.log("[Player] 收藏提示已自动隐藏");
      }, 5e3);
    };
    const favoriteHintMessages = [
      { text: "喜欢这首歌？点击收藏", emoji: "💚" },
      { text: "这首歌不错吧？点爱心收藏", emoji: "❤️" },
      { text: "好听的歌值得收藏", emoji: "💖" },
      { text: "这首歌唱进心里了", emoji: "💗" },
      { text: "收藏起来慢慢听", emoji: "💓" },
      { text: "这首歌是你的菜吗？", emoji: "🤍" },
      { text: "设为喜欢的歌吧", emoji: "💘" },
      { text: "音乐值得被珍藏", emoji: "💝" }
    ];
    let currentFavoriteHintSongId = null;
    const shownHintSongs = /* @__PURE__ */ new Set();
    const getRandomHintMessage = () => {
      const randomIndex = Math.floor(Math.random() * favoriteHintMessages.length);
      const msg = favoriteHintMessages[randomIndex];
      return `${msg.emoji} ${msg.text}`;
    };
    const getRandomHintTime = () => {
      const songDuration = duration.value;
      if (!songDuration || songDuration <= 60)
        return 60;
      const maxTime = Math.max(60, songDuration - 30);
      return Math.floor(Math.random() * (maxTime - 60 + 1)) + 60;
    };
    common_vendor.watch(() => currentTime.value, (newTime, oldTime) => {
      var _a;
      if (!playing.value || isCurrentSongFavorite.value)
        return;
      const songId = (_a = currentSong.value) == null ? void 0 : _a.id;
      if (!songId)
        return;
      if (currentFavoriteHintSongId !== songId) {
        currentFavoriteHintSongId = songId;
        shownHintSongs.delete(songId);
        return;
      }
      if (shownHintSongs.has(songId))
        return;
      const hintTime = getRandomHintTime();
      if (newTime >= hintTime && oldTime < hintTime) {
        console.log(`[Player] 播放时长达到${Math.floor(hintTime)}秒，显示收藏提示`);
        shownHintSongs.add(songId);
        showFavoriteTooltip();
      }
    }, { immediate: false });
    const handleFavorite = () => {
      if (!currentSong.value) {
        common_vendor.index.showToast({ title: "没有正在播放的歌曲", icon: "none" });
        return;
      }
      showFavoriteHint.value = false;
      if (favoriteHintTimer) {
        clearTimeout(favoriteHintTimer);
        favoriteHintTimer = null;
      }
      const lists = availableLists.value;
      console.log("[Player] handleFavorite - 可用列表数量:", lists.length);
      if (lists.length === 1 && lists[0].type === "love") {
        console.log("[Player] 只有一个列表，切换收藏状态");
        toggleLove();
        return;
      }
      console.log("[Player] 有多个列表，显示选择弹窗");
      showAddToModalFlag.value = true;
    };
    const toggleLove = () => {
      if (!currentSong.value)
        return;
      const isInLove = store_modules_list.listStore.isInLoveList(currentSong.value.id);
      if (isInLove) {
        store_modules_list.listStore.removeFromLoveList(currentSong.value.id);
        console.log("[Player] 取消收藏:", currentSong.value.name);
        common_vendor.index.showToast({ title: "已取消喜欢", icon: "none" });
      } else {
        store_modules_list.listStore.addListMusics(store_modules_list.LIST_IDS.LOVE, currentSong.value, "top");
        console.log("[Player] 添加到我的收藏:", currentSong.value.name);
        common_vendor.index.showToast({ title: "已添加到我喜欢的音乐", icon: "success" });
      }
    };
    const closeAddToModal = () => {
      showAddToModalFlag.value = false;
    };
    const createNewList = () => {
      common_vendor.index.showModal({
        title: "新建歌单",
        editable: true,
        placeholderText: "请输入歌单名称",
        success: (res) => {
          if (res.confirm && res.content) {
            const name = res.content.trim();
            if (!name) {
              common_vendor.index.showToast({ title: "歌单名称不能为空", icon: "none" });
              return;
            }
            const newList = store_modules_list.listStore.createUserList(name);
            if (newList) {
              common_vendor.index.showToast({
                title: "创建成功",
                icon: "success"
              });
              closeAddToModal();
            }
          }
        }
      });
    };
    const showComment = () => {
      showCommentFlag.value = true;
    };
    const closeComment = () => {
      showCommentFlag.value = false;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          type: "fas",
          name: "chevron-down",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        b: common_vendor.o(goBack, "a7"),
        c: common_vendor.t(isTablet.value ? currentSong.value.name : "正在播放"),
        d: common_vendor.t(isTablet.value && tabletStatusText.value ? tabletStatusText.value : "来自：" + formatAlbum(currentSong.value)),
        e: navbarMarqueeScroll.value
      }, navbarMarqueeScroll.value ? {} : {}, {
        f: navbarMarqueeScroll.value
      }, navbarMarqueeScroll.value ? {
        g: common_vendor.t(isTablet.value && tabletStatusText.value ? tabletStatusText.value : "来自：" + formatAlbum(currentSong.value))
      } : {}, {
        h: navbarMarqueeScroll.value ? 1 : "",
        i: common_vendor.s(navbarStyle.value),
        j: !isTablet.value
      }, !isTablet.value ? common_vendor.e({
        k: currentSlide.value === 0 ? 1 : "",
        l: currentSlide.value === 1 ? 1 : "",
        m: !showDefaultCover.value && songPicCache.value
      }, !showDefaultCover.value && songPicCache.value ? {
        n: common_vendor.unref(utils_imageProxy.proxyImageUrl)(songPicCache.value),
        o: common_vendor.o(handlePlayerImageError, "d3")
      } : {
        p: common_vendor.p({
          type: "fas",
          name: "music",
          size: "80",
          color: "rgba(0, 215, 205, 0.4)"
        })
      }, {
        q: !showDefaultCover.value && songPicCache.value ? 1 : "",
        r: common_vendor.o(previewCoverImage, "2a"),
        s: playing.value ? 1 : "",
        t: playing.value ? 1 : "",
        v: common_vendor.t(currentSong.value.name),
        w: statusText.value
      }, statusText.value ? common_vendor.e({
        x: common_vendor.t(statusText.value),
        y: statusMarqueeScroll.value
      }, statusMarqueeScroll.value ? {} : {}, {
        z: statusMarqueeScroll.value
      }, statusMarqueeScroll.value ? {
        A: common_vendor.t(statusText.value)
      } : {}, {
        B: statusMarqueeScroll.value ? 1 : ""
      }) : {}, {
        C: !isTablet.value
      }, !isTablet.value ? {
        D: !playing.value ? 1 : ""
      } : {}, {
        E: showDanmaku.value && danmakuList.value.length > 0
      }, showDanmaku.value && danmakuList.value.length > 0 ? {
        F: common_vendor.o(handleDanmakuLoadMore, "9e"),
        G: common_vendor.p({
          ["danmaku-list"]: danmakuList.value,
          ["dark-mode"]: darkMode.value,
          visible: true,
          playing: playing.value,
          ["song-info"]: originalSong.value
        })
      } : {}, {
        H: lyrics.value.length > 0
      }, lyrics.value.length > 0 ? {
        I: common_vendor.f(lyrics.value, (line, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(line.text),
            b: line.translation
          }, line.translation ? {
            c: common_vendor.t(line.translation)
          } : {}, {
            d: currentLyricIndex.value === index ? 1 : "",
            e: index,
            f: "lyric-line-" + index,
            g: index,
            h: common_vendor.o(($event) => onLyricLineTap(index), index)
          });
        }),
        J: lyricScrollTop.value,
        K: common_vendor.o(onLyricScroll, "52"),
        L: common_vendor.o(onLyricScrollTap, "e7")
      } : {}, {
        M: currentSlide.value,
        N: common_vendor.o(onSwiperChange, "5b"),
        O: currentSlide.value === 1
      }, currentSlide.value === 1 ? {
        P: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        Q: common_vendor.o(switchToAlbum, "ef")
      } : {}, {
        R: currentSlide.value === 0
      }, currentSlide.value === 0 ? {
        S: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        T: common_vendor.o(switchToLyrics, "1d")
      } : {}) : {}, {
        U: isTablet.value
      }, isTablet.value ? common_vendor.e({
        V: showDanmaku.value && danmakuList.value.length > 0
      }, showDanmaku.value && danmakuList.value.length > 0 ? {
        W: common_vendor.o(handleDanmakuLoadMore, "f0"),
        X: common_vendor.p({
          ["danmaku-list"]: danmakuList.value,
          ["dark-mode"]: darkMode.value,
          visible: true,
          playing: playing.value,
          ["song-info"]: originalSong.value,
          ["is-tablet"]: isTablet.value
        })
      } : {}, {
        Y: !showDefaultCover.value && songPicCache.value
      }, !showDefaultCover.value && songPicCache.value ? {
        Z: common_vendor.unref(utils_imageProxy.proxyImageUrl)(songPicCache.value),
        aa: common_vendor.o(handlePlayerImageError, "1e")
      } : {
        ab: common_vendor.p({
          type: "fas",
          name: "music",
          size: "80",
          color: "rgba(0, 215, 205, 0.4)"
        })
      }, {
        ac: !showDefaultCover.value && songPicCache.value ? 1 : "",
        ad: common_vendor.o(previewCoverImage, "a7"),
        ae: playing.value ? 1 : "",
        af: playing.value ? 1 : "",
        ag: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        ah: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        ai: common_vendor.o(onProgressTouchStart, "34"),
        aj: common_vendor.o(onProgressTouchMove, "48"),
        ak: common_vendor.o(onProgressTouchEnd, "b5"),
        al: common_vendor.t(formatTime(currentTime.value)),
        am: common_vendor.t(formatTime(duration.value)),
        an: playMode.value === "singleLoop"
      }, playMode.value === "singleLoop" ? {
        ao: common_vendor.p({
          type: "fas",
          name: "rotate-right",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        ap: darkMode.value ? "#ffffff" : "#6b7280"
      } : {
        aq: common_vendor.p({
          type: "fas",
          name: playModeIcon.value,
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        })
      }, {
        ar: common_vendor.o(togglePlayMode, "a3"),
        as: common_vendor.p({
          type: "fas",
          name: "backward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        at: common_vendor.o(playPrev, "8e"),
        av: isLoading.value
      }, isLoading.value ? {} : {
        aw: common_vendor.p({
          type: "fas",
          name: playing.value ? "pause" : "play",
          size: "28",
          color: "#ffffff"
        })
      }, {
        ax: isLoading.value ? 1 : "",
        ay: common_vendor.o(togglePlay, "2b"),
        az: common_vendor.p({
          type: "fas",
          name: "forward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        aA: common_vendor.o(playNext, "59"),
        aB: common_vendor.p({
          type: "fas",
          name: "comment",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aC: commentTotalCount.value > 0
      }, commentTotalCount.value > 0 ? {
        aD: common_vendor.t(commentTotalCount.value > 999 ? "999+" : commentTotalCount.value)
      } : {}, {
        aE: common_vendor.o(showComment, "bf"),
        aF: common_vendor.p({
          type: "fas",
          name: "clock",
          size: "18",
          color: sleepTimerRemaining.value > 0 ? "#00d7cd" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aG: sleepTimerRemaining.value > 0
      }, sleepTimerRemaining.value > 0 ? {
        aH: common_vendor.t(formatSleepTimerShort.value)
      } : {}, {
        aI: sleepTimerRemaining.value > 0 ? 1 : "",
        aJ: common_vendor.o(showSleepTimerPopup, "1d"),
        aK: showFavoriteHint.value
      }, showFavoriteHint.value ? {
        aL: common_vendor.t(currentFavoriteHintText.value),
        aM: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "10",
          color: "rgba(255,255,255,0.7)"
        }),
        aN: common_vendor.o(($event) => showFavoriteHint.value = false, "3f"),
        aO: common_vendor.o(handleFavorite, "ac")
      } : {}, {
        aP: common_vendor.p({
          type: "fas",
          name: "heart",
          size: 18,
          color: isCurrentSongFavorite.value ? "#ff6b6b" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aQ: isCurrentSongFavorite.value ? 1 : "",
        aR: common_vendor.o(handleFavorite, "cf"),
        aS: common_vendor.p({
          type: "fas",
          name: "plus",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aT: common_vendor.o(createNewList, "0d"),
        aU: common_vendor.p({
          type: "fas",
          name: "clone",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aV: hasSwitchedSource.value && showSourceSwitchHint.value
      }, hasSwitchedSource.value && showSourceSwitchHint.value ? {} : {}, {
        aW: hasSwitchedSource.value && showSourceSwitchHint.value ? 1 : "",
        aX: common_vendor.o(showMusicToggle, "f3"),
        aY: lyrics.value.length > 0
      }, lyrics.value.length > 0 ? {
        aZ: common_vendor.f(lyrics.value, (line, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(line.text),
            b: line.translation
          }, line.translation ? {
            c: common_vendor.t(line.translation)
          } : {}, {
            d: currentLyricIndex.value === index ? 1 : "",
            e: index,
            f: "tablet-lyric-line-" + index,
            g: index,
            h: common_vendor.o(($event) => onLyricLineTap(index), index)
          });
        }),
        ba: `translateY(-${tabletLyricScrollTop.value}px)`
      } : {}, {
        bb: common_vendor.o(onTabletLyricWheel, "5d"),
        bc: common_vendor.o(onTabletLyricTouchStart, "a8"),
        bd: common_vendor.o(onTabletLyricTouchMove, "65"),
        be: common_vendor.o(onTabletLyricTouchEnd, "ba"),
        bf: common_vendor.o(onTabletLyricMouseDown, "9a")
      }) : {}, {
        bg: !isTablet.value
      }, !isTablet.value ? common_vendor.e({
        bh: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        bi: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        bj: common_vendor.o(onProgressTouchStart, "7c"),
        bk: common_vendor.o(onProgressTouchMove, "d2"),
        bl: common_vendor.o(onProgressTouchEnd, "18"),
        bm: common_vendor.t(formatTime(currentTime.value)),
        bn: common_vendor.t(formatTime(duration.value)),
        bo: playMode.value === "singleLoop"
      }, playMode.value === "singleLoop" ? {
        bp: common_vendor.p({
          type: "fas",
          name: "rotate-right",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        bq: darkMode.value ? "#ffffff" : "#6b7280"
      } : {
        br: common_vendor.p({
          type: "fas",
          name: playModeIcon.value,
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        })
      }, {
        bs: common_vendor.o(togglePlayMode, "23"),
        bt: common_vendor.p({
          type: "fas",
          name: "backward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        bv: common_vendor.o(playPrev, "99"),
        bw: isLoading.value
      }, isLoading.value ? {} : {
        bx: common_vendor.p({
          type: "fas",
          name: playing.value ? "pause" : "play",
          size: "28",
          color: "#ffffff"
        })
      }, {
        by: isLoading.value ? 1 : "",
        bz: common_vendor.o(togglePlay, "0d"),
        bA: common_vendor.p({
          type: "fas",
          name: "forward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        bB: common_vendor.o(playNext, "55"),
        bC: common_vendor.p({
          type: "fas",
          name: "comment",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        bD: commentTotalCount.value > 0
      }, commentTotalCount.value > 0 ? {
        bE: common_vendor.t(commentTotalCount.value > 999 ? "999+" : commentTotalCount.value)
      } : {}, {
        bF: common_vendor.o(showComment, "fd"),
        bG: common_vendor.p({
          type: "fas",
          name: "clock",
          size: "18",
          color: sleepTimerRemaining.value > 0 ? "#00d7cd" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        bH: sleepTimerRemaining.value > 0
      }, sleepTimerRemaining.value > 0 ? {
        bI: common_vendor.t(formatSleepTimerShort.value)
      } : {}, {
        bJ: sleepTimerRemaining.value > 0 ? 1 : "",
        bK: common_vendor.o(showSleepTimerPopup, "bb"),
        bL: showFavoriteHint.value
      }, showFavoriteHint.value ? {
        bM: common_vendor.t(currentFavoriteHintText.value),
        bN: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "10",
          color: "rgba(255,255,255,0.7)"
        }),
        bO: common_vendor.o(($event) => showFavoriteHint.value = false, "58"),
        bP: common_vendor.o(handleFavorite, "72")
      } : {}, {
        bQ: common_vendor.p({
          type: "fas",
          name: isCurrentSongFavorite.value ? "heart" : "heart",
          size: 18,
          color: isCurrentSongFavorite.value ? "#ff6b6b" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        bR: isCurrentSongFavorite.value ? 1 : "",
        bS: common_vendor.o(handleFavorite, "54"),
        bT: common_vendor.p({
          type: "fas",
          name: "plus",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        bU: common_vendor.o(createNewList, "19"),
        bV: common_vendor.p({
          type: "fas",
          name: "clone",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        bW: hasSwitchedSource.value && showSourceSwitchHint.value
      }, hasSwitchedSource.value && showSourceSwitchHint.value ? {} : {}, {
        bX: hasSwitchedSource.value && showSourceSwitchHint.value ? 1 : "",
        bY: common_vendor.o(showMusicToggle, "02")
      }) : {}, {
        bZ: common_vendor.o(($event) => showAddToModalFlag.value = $event, "90"),
        ca: common_vendor.o(closeAddToModal, "b3"),
        cb: common_vendor.p({
          visible: showAddToModalFlag.value,
          ["dark-mode"]: darkMode.value,
          ["is-tablet"]: isTablet.value
        }),
        cc: showSleepTimerPopupFlag.value
      }, showSleepTimerPopupFlag.value ? common_vendor.e({
        cd: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "16",
          color: "#6b7280"
        }),
        ce: common_vendor.o(closeSleepTimerPopup, "e1"),
        cf: sleepTimerRemaining.value > 0
      }, sleepTimerRemaining.value > 0 ? {
        cg: common_vendor.t(formatSleepTimerRemaining.value),
        ch: common_vendor.o(cancelSleepTimer, "c6")
      } : {}, {
        ci: common_vendor.f(hourOptions.value, (hour, index, i0) => {
          return {
            a: common_vendor.t(hour),
            b: index
          };
        }),
        cj: common_vendor.f(minuteOptions.value, (minute, index, i0) => {
          return {
            a: common_vendor.t(minute),
            b: index
          };
        }),
        ck: sleepTimerPickerValue.value,
        cl: common_vendor.o(onSleepTimerPickerChange, "2e"),
        cm: common_vendor.o(closeSleepTimerPopup, "0c"),
        cn: common_vendor.o(confirmSleepTimerSelection, "dd"),
        co: isTablet.value ? tabletModalSafeTop.value : "",
        cp: common_vendor.o(() => {
        }, "f9"),
        cq: common_vendor.o(closeSleepTimerPopup, "3c")
      }) : {}, {
        cr: common_vendor.o(closeComment, "d2"),
        cs: common_vendor.p({
          show: showCommentFlag.value,
          ["music-info"]: originalSong.value,
          ["is-tablet"]: isTablet.value
        }),
        ct: common_vendor.o(closeMusicToggleModal, "5f"),
        cv: common_vendor.o(handleToggleConfirm, "d7"),
        cw: common_vendor.o(handleTogglePreview, "b5"),
        cx: common_vendor.p({
          visible: showMusicToggleModal.value,
          ["original-song"]: toggleOriginalSong.value,
          ["list-id"]: null,
          ["dark-mode"]: darkMode.value,
          ["bottom-safe-height"]: 0,
          ["is-tablet"]: isTablet.value
        }),
        cy: darkMode.value ? 1 : "",
        cz: isTablet.value ? 1 : "",
        cA: common_vendor.s(_ctx.__cssVars())
      });
    };
  }
};
wx.createPage(_sfc_main);
