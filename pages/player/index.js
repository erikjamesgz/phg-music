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
if (!Math) {
  (RocIconPlus + DanmakuView + MusicComment + MusicToggleModal)();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const DanmakuView = () => "../../components/danmaku/DanmakuView.js";
const MusicComment = () => "../../components/comment/MusicComment.js";
const MusicToggleModal = () => "../../components/player/MusicToggleModal.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    common_vendor.useCssVars((_ctx) => ({
      "06472861": lyricsContainerHeight.value + "rpx"
    }));
    const instance = common_vendor.getCurrentInstance();
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const statusBarStyle = common_vendor.computed(() => ({
      height: `${statusBarHeight.value}px`,
      width: "100%",
      backgroundColor: "transparent"
    }));
    const navbarStyle = common_vendor.computed(() => ({
      paddingTop: `${statusBarHeight.value}px`
    }));
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
    const currentTime = common_vendor.computed(() => store_modules_player.playerStore.state.currentTime);
    const duration = common_vendor.computed(() => store_modules_player.playerStore.state.duration);
    const isDragging = common_vendor.ref(false);
    const dragPercent = common_vendor.ref(0);
    const currentSlide = common_vendor.ref(0);
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
    common_vendor.ref("");
    let lastScrollIndex = -1;
    let isScrollToActive = false;
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
    });
    common_vendor.onShow(() => {
      console.log("[player] onShow 调用");
      utils_system.setStatusBarTextColor("black");
      refreshDarkMode();
      setupPlayEndedCallback();
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
      clearTimeout(sourceSwitchHintTimer);
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
      console.log("[player] goBack 调用 - 用户点击返回，销毁页面");
      common_vendor.index.navigateBack();
    };
    const togglePlay = () => {
      store_modules_player.playerStore.togglePlay();
    };
    const playNext = async () => {
      console.log("[Player] 播放下一首");
      const togglePlayMethod = playMode.value === "random" ? "random" : "listLoop";
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
      console.log("[Player] 播放上一首");
      if (store_modules_player.playerStore.getState().isGettingUrl) {
        console.log("[Player] 正在获取播放链接，只更新待播放歌曲");
        const togglePlayMethod2 = playMode.value === "random" ? "random" : "listLoop";
        const prevSongInfo2 = store_modules_list.listStore.getPrevSong(togglePlayMethod2);
        if (prevSongInfo2 && prevSongInfo2.musicInfo) {
          console.log("[Player] 更新待播放歌曲:", prevSongInfo2.musicInfo.name);
          store_modules_player.playerStore.updatePendingSong(prevSongInfo2.musicInfo);
        }
        return;
      }
      store_modules_player.playerStore.setGettingUrl(true);
      const togglePlayMethod = playMode.value === "random" ? "random" : "listLoop";
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
      if (currentLyricIndex.value === lastScrollIndex && isScrollToActive) {
        return;
      }
      lastScrollIndex = currentLyricIndex.value;
      isScrollToActive = true;
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
            console.log(
              "[scrollToCurrentLyric] 当前索引:",
              currentLyricIndex.value,
              "容器高度:",
              containerRect.height,
              "歌词高度:",
              lineRect.height,
              "歌词位置:",
              lineTop,
              "滚动位置:",
              scrollTop
            );
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
      if (currentSlide.value === 1) {
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
        to: newSong.name
      });
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
    const getListIcon = (type) => {
      const iconMap = {
        "default": "music",
        "love": "heart",
        "user": "list-ul",
        "custom": "folder",
        "imported": "download"
      };
      return iconMap[type] || "list-ul";
    };
    const getListColor = (type, disabled = false) => {
      const colorMap = {
        "default": "#00d7cd",
        "love": "#ff6b6b",
        "user": "#6b7280",
        "custom": "#f59e0b",
        "imported": "#3b82f6"
      };
      const disabledColorMap = {
        "default": "rgba(0, 215, 205, 0.4)",
        "love": "rgba(255, 107, 107, 0.4)",
        "user": "rgba(107, 114, 128, 0.4)",
        "custom": "rgba(245, 158, 11, 0.4)",
        "imported": "rgba(59, 130, 246, 0.4)"
      };
      if (disabled) {
        return disabledColorMap[type] || "rgba(107, 114, 128, 0.4)";
      }
      return colorMap[type] || "#6b7280";
    };
    const isSongInList = (listId) => {
      if (!currentSong.value)
        return false;
      return store_modules_list.listStore.checkSongInList(listId, currentSong.value.id);
    };
    const getListCount = (listId) => {
      return store_modules_list.listStore.getListCount(listId);
    };
    const addToList = (listId) => {
      var _a, _b;
      if (!currentSong.value)
        return;
      const isInList = store_modules_list.listStore.checkSongInList(listId, currentSong.value.id);
      if (isInList) {
        store_modules_list.listStore.removeListMusics(listId, currentSong.value.id);
        const listName = ((_a = availableLists.value.find((l) => l.id === listId)) == null ? void 0 : _a.name) || "列表";
        common_vendor.index.showToast({
          title: `已从${listName}移除`,
          icon: "none"
        });
      } else {
        const success = store_modules_list.listStore.addMusicToAnyList(listId, currentSong.value, "top");
        if (success) {
          const listName = ((_b = availableLists.value.find((l) => l.id === listId)) == null ? void 0 : _b.name) || "列表";
          common_vendor.index.showToast({
            title: `已添加到${listName}`,
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: "操作失败",
            icon: "none"
          });
        }
      }
      closeAddToModal();
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
        a: common_vendor.s(statusBarStyle.value),
        b: common_vendor.p({
          type: "fas",
          name: "chevron-down",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        c: common_vendor.o(goBack),
        d: common_vendor.t(formatAlbum(currentSong.value)),
        e: navbarMarqueeScroll.value
      }, navbarMarqueeScroll.value ? {} : {}, {
        f: navbarMarqueeScroll.value
      }, navbarMarqueeScroll.value ? {
        g: common_vendor.t(formatAlbum(currentSong.value))
      } : {}, {
        h: navbarMarqueeScroll.value ? 1 : "",
        i: currentSlide.value === 0 ? 1 : "",
        j: currentSlide.value === 1 ? 1 : "",
        k: common_vendor.s(navbarStyle.value),
        l: !showDefaultCover.value && songPicCache.value
      }, !showDefaultCover.value && songPicCache.value ? {
        m: common_vendor.unref(utils_imageProxy.proxyImageUrl)(songPicCache.value),
        n: common_vendor.o(handlePlayerImageError)
      } : {
        o: common_vendor.p({
          type: "fas",
          name: "music",
          size: "80",
          color: "rgba(0, 215, 205, 0.4)"
        })
      }, {
        p: !showDefaultCover.value && songPicCache.value ? 1 : "",
        q: playing.value ? 1 : "",
        r: playing.value ? 1 : "",
        s: common_vendor.t(currentSong.value.name),
        t: statusText.value
      }, statusText.value ? common_vendor.e({
        v: common_vendor.t(statusText.value),
        w: statusMarqueeScroll.value
      }, statusMarqueeScroll.value ? {} : {}, {
        x: statusMarqueeScroll.value
      }, statusMarqueeScroll.value ? {
        y: common_vendor.t(statusText.value)
      } : {}, {
        z: statusMarqueeScroll.value ? 1 : ""
      }) : {}, {
        A: !playing.value ? 1 : "",
        B: showDanmaku.value && danmakuList.value.length > 0
      }, showDanmaku.value && danmakuList.value.length > 0 ? {
        C: common_vendor.o(handleDanmakuLoadMore),
        D: common_vendor.p({
          ["danmaku-list"]: danmakuList.value,
          ["dark-mode"]: darkMode.value,
          visible: true,
          playing: playing.value,
          ["song-info"]: originalSong.value
        })
      } : {}, {
        E: lyrics.value.length > 0
      }, lyrics.value.length > 0 ? {
        F: common_vendor.f(lyrics.value, (line, index, i0) => {
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
        G: lyricScrollTop.value,
        H: common_vendor.o(onLyricScroll),
        I: common_vendor.o(onLyricScrollTap)
      } : {}, {
        J: currentSlide.value,
        K: common_vendor.o(onSwiperChange),
        L: currentSlide.value === 1
      }, currentSlide.value === 1 ? {
        M: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        N: common_vendor.o(switchToAlbum)
      } : {}, {
        O: currentSlide.value === 0
      }, currentSlide.value === 0 ? {
        P: common_vendor.p({
          type: "fas",
          name: "chevron-right",
          size: "16",
          color: darkMode.value ? "#ffffff" : "#4b5563"
        }),
        Q: common_vendor.o(switchToLyrics)
      } : {}, {
        R: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        S: isDragging.value ? dragPercent.value + "%" : progressPercent.value + "%",
        T: common_vendor.o(onProgressTouchStart),
        U: common_vendor.o(onProgressTouchMove),
        V: common_vendor.o(onProgressTouchEnd),
        W: common_vendor.t(formatTime(currentTime.value)),
        X: common_vendor.t(formatTime(duration.value)),
        Y: common_vendor.p({
          type: "fas",
          name: playModeIcon.value,
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        Z: common_vendor.o(togglePlayMode),
        aa: common_vendor.p({
          type: "fas",
          name: "backward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        ab: common_vendor.o(playPrev),
        ac: common_vendor.p({
          type: "fas",
          name: playing.value ? "pause" : "play",
          size: "28",
          color: "#ffffff"
        }),
        ad: common_vendor.o(togglePlay),
        ae: common_vendor.p({
          type: "fas",
          name: "forward-step",
          size: "28",
          color: darkMode.value ? "#ffffff" : "#374151"
        }),
        af: common_vendor.o(playNext),
        ag: common_vendor.p({
          type: "fas",
          name: "comment",
          size: "20",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        ah: commentTotalCount.value > 0
      }, commentTotalCount.value > 0 ? {
        ai: common_vendor.t(commentTotalCount.value > 999 ? "999+" : commentTotalCount.value)
      } : {}, {
        aj: common_vendor.o(showComment),
        ak: common_vendor.p({
          type: "fas",
          name: "clock",
          size: "18",
          color: sleepTimerRemaining.value > 0 ? "#00d7cd" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        al: sleepTimerRemaining.value > 0
      }, sleepTimerRemaining.value > 0 ? {
        am: common_vendor.t(formatSleepTimerShort.value)
      } : {}, {
        an: sleepTimerRemaining.value > 0 ? 1 : "",
        ao: common_vendor.o(showSleepTimerPopup),
        ap: showFavoriteHint.value
      }, showFavoriteHint.value ? {
        aq: common_vendor.t(currentFavoriteHintText.value),
        ar: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "10",
          color: "rgba(255,255,255,0.7)"
        }),
        as: common_vendor.o(($event) => showFavoriteHint.value = false),
        at: common_vendor.o(handleFavorite)
      } : {}, {
        av: common_vendor.p({
          type: "fas",
          name: isCurrentSongFavorite.value ? "heart" : "heart",
          size: 18,
          color: isCurrentSongFavorite.value ? "#ff6b6b" : darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aw: isCurrentSongFavorite.value ? 1 : "",
        ax: common_vendor.o(handleFavorite),
        ay: common_vendor.p({
          type: "fas",
          name: "plus",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        az: common_vendor.o(createNewList),
        aA: common_vendor.p({
          type: "fas",
          name: "clone",
          size: "18",
          color: darkMode.value ? "#ffffff" : "#6b7280"
        }),
        aB: hasSwitchedSource.value && showSourceSwitchHint.value
      }, hasSwitchedSource.value && showSourceSwitchHint.value ? {} : {}, {
        aC: hasSwitchedSource.value && showSourceSwitchHint.value ? 1 : "",
        aD: common_vendor.o(showMusicToggle),
        aE: showAddToModalFlag.value
      }, showAddToModalFlag.value ? {
        aF: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        aG: common_vendor.o(closeAddToModal),
        aH: common_vendor.p({
          type: "fas",
          name: "plus",
          size: "18",
          color: "#00d7cd"
        }),
        aI: common_vendor.o(createNewList),
        aJ: common_vendor.f(availableLists.value, (list, k0, i0) => {
          return {
            a: "54811c87-17-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: getListIcon(list.type),
              size: "18",
              color: isSongInList(list.id) ? getListColor(list.type, true) : getListColor(list.type, false)
            }),
            c: common_vendor.t(list.name),
            d: isSongInList(list.id) ? 1 : "",
            e: common_vendor.t(isSongInList(list.id) ? "已添加" : getListCount(list.id) + "首"),
            f: isSongInList(list.id) ? 1 : "",
            g: isSongInList(list.id) ? 1 : "",
            h: list.id,
            i: common_vendor.o(($event) => addToList(list.id), list.id)
          };
        }),
        aK: common_vendor.o(() => {
        }),
        aL: common_vendor.o(closeAddToModal)
      } : {}, {
        aM: showSleepTimerPopupFlag.value
      }, showSleepTimerPopupFlag.value ? common_vendor.e({
        aN: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "16",
          color: "#6b7280"
        }),
        aO: common_vendor.o(closeSleepTimerPopup),
        aP: sleepTimerRemaining.value > 0
      }, sleepTimerRemaining.value > 0 ? {
        aQ: common_vendor.t(formatSleepTimerRemaining.value),
        aR: common_vendor.o(cancelSleepTimer)
      } : {}, {
        aS: common_vendor.f(hourOptions.value, (hour, index, i0) => {
          return {
            a: common_vendor.t(hour),
            b: index
          };
        }),
        aT: common_vendor.f(minuteOptions.value, (minute, index, i0) => {
          return {
            a: common_vendor.t(minute),
            b: index
          };
        }),
        aU: sleepTimerPickerValue.value,
        aV: common_vendor.o(onSleepTimerPickerChange),
        aW: common_vendor.o(closeSleepTimerPopup),
        aX: common_vendor.o(confirmSleepTimerSelection),
        aY: common_vendor.o(() => {
        }),
        aZ: common_vendor.o(closeSleepTimerPopup)
      }) : {}, {
        ba: common_vendor.o(closeComment),
        bb: common_vendor.p({
          show: showCommentFlag.value,
          ["music-info"]: originalSong.value
        }),
        bc: common_vendor.o(closeMusicToggleModal),
        bd: common_vendor.o(handleToggleConfirm),
        be: common_vendor.o(handleTogglePreview),
        bf: common_vendor.p({
          visible: showMusicToggleModal.value,
          ["original-song"]: toggleOriginalSong.value,
          ["list-id"]: null,
          ["dark-mode"]: darkMode.value
        }),
        bg: darkMode.value ? 1 : "",
        bh: common_vendor.s(_ctx.__cssVars())
      });
    };
  }
};
wx.createPage(_sfc_main);
