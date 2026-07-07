"use strict";
const common_vendor = require("./common/vendor.js");
const utils_system = require("./utils/system.js");
const utils_api_songlist = require("./utils/api/songlist.js");
const utils_api_songlistDirect = require("./utils/api/songlist-direct.js");
const store_modules_list = require("./store/modules/list.js");
const store_modules_player = require("./store/modules/player.js");
const utils_imageProxy = require("./utils/imageProxy.js");
const composables_useBottomHeight = require("./composables/useBottomHeight.js");
if (!Array) {
  const _component_custom_tabbar = common_vendor.resolveComponent("custom-tabbar");
  _component_custom_tabbar();
}
if (!Math) {
  (RocIconPlus + VirtualList + MiniPlayer)();
}
const RocIconPlus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const MiniPlayer = () => "./components/player/MiniPlayer.js";
const VirtualList = () => "./components/common/VirtualList.js";
const _sfc_main = {
  __name: "index",
  props: {
    urlParams: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const pageLink = common_vendor.ref("");
    const pageSource = common_vendor.ref("");
    const pagePlatform = common_vendor.ref("");
    const isPreviewMode = common_vendor.ref(false);
    const showActionBar = common_vendor.ref(false);
    const loadError = common_vendor.ref("");
    const listSource = common_vendor.ref("");
    const listId = common_vendor.ref("");
    const fromPage = common_vendor.ref("");
    const pageOptions = common_vendor.ref({});
    const isTablet = common_vendor.ref(false);
    const checkIsTablet = () => {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const width = systemInfo.windowWidth || systemInfo.screenWidth || 0;
        const height = systemInfo.windowHeight || systemInfo.screenHeight || 0;
        const TABLET_ASPECT_RATIO = 0.85;
        const TABLET_MIN_WIDTH = 400;
        const aspectRatio = width / height;
        isTablet.value = aspectRatio >= TABLET_ASPECT_RATIO && width >= TABLET_MIN_WIDTH;
      } catch (e) {
        isTablet.value = false;
      }
    };
    checkIsTablet();
    const props = __props;
    const emit = __emit;
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const statusBarStyle = common_vendor.computed(() => ({
      height: `${statusBarHeight.value}px`,
      width: "100%"
    }));
    const playlistId = common_vendor.ref("");
    const playlistName = common_vendor.ref("");
    const playlistCover = common_vendor.ref("");
    const playlistAuthor = common_vendor.ref("");
    const playlistDesc = common_vendor.ref("");
    const playlistTrackCount = common_vendor.ref(0);
    const playlistPlayCount = common_vendor.ref("");
    const songs = common_vendor.ref([]);
    const playlistHistoryList = common_vendor.ref([]);
    const isLoading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(false);
    const currentSongIndex = common_vendor.computed(() => {
      var _a;
      triggerRefresh.value;
      const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      const playIndex = store_modules_list.listStore.state.playInfo.playIndex;
      console.log("[Sharelist] currentSongIndex 计算:", {
        playerListId,
        tempListMetaId: tempListMeta == null ? void 0 : tempListMeta.id,
        currentListId: currentListId.value,
        playIndex,
        songsLength: songs.value.length
      });
      const currentPlayingSongId = (_a = store_modules_player.playerStore.state.currentSong) == null ? void 0 : _a.id;
      console.log("[Sharelist] 当前播放歌曲ID:", currentPlayingSongId);
      if (playerListId === store_modules_list.LIST_IDS.TEMP) {
        const tempId = tempListMeta == null ? void 0 : tempListMeta.id;
        let isMatch = false;
        if (tempId === currentListId.value) {
          isMatch = true;
        } else if (tempId === "trial" && currentListId.value === store_modules_list.LIST_IDS.DEFAULT) {
          isMatch = true;
        }
        if (isMatch) {
          if (playIndex >= 0 && playIndex < songs.value.length) {
            console.log("[Sharelist] 临时列表匹配，使用 playIndex:", playIndex);
            return playIndex;
          }
          if (currentPlayingSongId) {
            const indexInSongs = songs.value.findIndex((song) => song.id === currentPlayingSongId);
            console.log("[Sharelist] 临时列表匹配，在songs中查找索引:", currentPlayingSongId, "结果:", indexInSongs);
            return indexInSongs;
          }
        }
        console.log("[Sharelist] 临时列表不匹配当前列表，返回 -1");
        return -1;
      }
      if (playerListId === currentListId.value) {
        if (playIndex >= 0 && playIndex < songs.value.length) {
          console.log("[Sharelist] 当前页面歌单播放，使用 playIndex:", playIndex);
          return playIndex;
        }
        if (currentPlayingSongId) {
          const indexInSongs = songs.value.findIndex((song) => song.id === currentPlayingSongId);
          console.log("[Sharelist] 在songs中查找索引:", currentPlayingSongId, "结果:", indexInSongs);
          return indexInSongs;
        }
        console.log("[Sharelist] 当前页面歌单播放，但未找到歌曲，返回 -1");
        return -1;
      }
      if (playerListId === store_modules_list.LIST_IDS.DEFAULT && currentPlayingSongId) {
        const indexInSongs = songs.value.findIndex((song) => song.id === currentPlayingSongId);
        console.log("[Sharelist] 在songs中查找索引:", currentPlayingSongId, "结果:", indexInSongs);
        return indexInSongs;
      }
      console.log("[Sharelist] 不在播放当前列表，返回 -1");
      return -1;
    });
    common_vendor.computed(() => {
      if (currentSongIndex.value >= 0 && songs.value.length > currentSongIndex.value) {
        return songs.value[currentSongIndex.value];
      }
      return null;
    });
    const isPlaying = common_vendor.computed(() => store_modules_player.playerStore.state.isPlaying);
    const triggerRefresh = common_vendor.ref(0);
    common_vendor.watch(() => store_modules_player.playerStore.state.currentSong, (newSong, oldSong) => {
      console.log("[Sharelist] playerStore.currentSong 变化:", newSong == null ? void 0 : newSong.name, "ID:", newSong == null ? void 0 : newSong.id);
      triggerRefresh.value++;
    }, { deep: true });
    common_vendor.watch(() => [store_modules_list.listStore.state.playInfo.playerListId, store_modules_list.listStore.state.playInfo.playIndex], (newVal, oldVal) => {
      console.log("[Sharelist] playInfo 变化:", newVal);
      triggerRefresh.value++;
    }, { deep: true });
    const darkMode = common_vendor.ref(false);
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[Sharelist] 初始化暗黑模式:", darkMode.value);
    };
    const miniPlayerBottomHeight = common_vendor.ref(0);
    const handleMiniPlayerHeightChange = ({ height, isShowing }) => {
      console.log("[Sharelist] MiniPlayer 高度变化:", height, "是否显示:", isShowing);
      miniPlayerBottomHeight.value = isShowing ? height : 0;
    };
    common_vendor.ref(0);
    const virtualListRef = common_vendor.ref(null);
    const { bottomPaddingStyle, totalBottomHeight } = composables_useBottomHeight.useBottomHeight();
    const isPlayerPlaying = common_vendor.computed(() => store_modules_player.playerStore.state.isPlaying);
    const formatPlayCount = (count) => {
      if (!count)
        return "0";
      return utils_api_songlist.formatPlayCount(count);
    };
    const currentListId = common_vendor.ref("");
    const isLocalPlaylist = common_vendor.ref(false);
    const generateImportedPlaylistId = () => {
      if (!currentListId.value) {
        currentListId.value = `${listSource.value}_${Date.now()}`;
      }
      return currentListId.value;
    };
    const generateGradientBackground = (name, type = "playlist") => {
      const gradients = [
        ["#667eea", "#764ba2"],
        // 紫色渐变
        ["#f093fb", "#f5576c"],
        // 粉色渐变
        ["#4facfe", "#00f2fe"],
        // 蓝色渐变
        ["#43e97b", "#38f9d7"],
        // 绿色渐变
        ["#fa709a", "#fee140"],
        // 橙粉渐变
        ["#a18cd1", "#fbc2eb"],
        // 淡紫渐变
        ["#ff9a9e", "#fecfef"],
        // 粉红渐变
        ["#ffecd2", "#fcb69f"],
        // 橙黄渐变
        ["#a1c4fd", "#c2e9fb"],
        // 淡蓝渐变
        ["#d299c2", "#fef9d7"],
        // 粉黄渐变
        ["#89f7fe", "#66a6ff"],
        // 青蓝渐变
        ["#cd9cf2", "#f6f3ff"]
        // 淡紫白渐变
      ];
      let hash = 0;
      if (name) {
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
      }
      const index = Math.abs(hash) % gradients.length;
      const [color1, color2] = gradients[index];
      return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
    };
    const getPlatformName = (source) => {
      const platformMap = {
        "wy": "网易云音乐",
        "tx": "QQ音乐",
        "kg": "酷狗音乐",
        "kw": "酷我音乐",
        "mg": "咪咕音乐",
        "local": "本地音乐"
      };
      return platformMap[source] || source || "未知平台";
    };
    const goBack = () => {
      if (isTablet.value) {
        emit("close");
        return;
      }
      common_vendor.index.navigateBack();
    };
    const handleSharelistImageError = (event, type) => {
      if (!playlistCover.value)
        return;
      let currentProxyIndex = 0;
      if (playlistCover.value.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (playlistCover.value.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (playlistCover.value.includes("jina.ai"))
        currentProxyIndex = 3;
      const nextUrl = utils_imageProxy.handleImageError(event, playlistCover.value, currentProxyIndex);
      if (nextUrl) {
        playlistCover.value = nextUrl;
      }
    };
    const previewCoverImage = () => {
      if (!playlistCover.value) {
        console.log("[Sharelist] 没有封面图片，无法预览");
        return;
      }
      console.log("[Sharelist] 预览封面图片:", playlistCover.value);
      common_vendor.index.previewImage({
        current: utils_imageProxy.proxyImageUrl(playlistCover.value),
        urls: [utils_imageProxy.proxyImageUrl(playlistCover.value)]
      });
    };
    const playAll = async () => {
      if (songs.value.length === 0)
        return;
      console.log("[Sharelist] 播放全部");
      console.log("[Sharelist] 是否是本地歌单:", isLocalPlaylist.value);
      if (isLocalPlaylist.value) {
        console.log("[Sharelist] 本地歌单，直接切换到对应列表播放");
        store_modules_list.listStore.setPlayerListId(currentListId.value);
        await playSongWithIndex(0, false);
        return;
      }
      console.log("[Sharelist] 在线歌单，使用临时列表播放，添加到试听列表");
      const importedId = generateImportedPlaylistId();
      store_modules_list.listStore.setTempList(store_modules_list.LIST_IDS.TEMP, [], {});
      store_modules_list.listStore.setTempList(
        store_modules_list.LIST_IDS.TEMP,
        songs.value,
        {
          id: importedId,
          source: listSource.value,
          name: playlistName.value,
          link: pageLink.value || ""
        }
      );
      store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
      await playSongWithIndex(0, true);
    };
    const playSongWithIndex = async (index, addToDefaultList = true) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const song = songs.value[index];
      if (!song)
        return;
      console.log("[Sharelist] ========== 播放歌曲开始 ==========");
      console.log("[Sharelist] 歌曲索引:", index);
      console.log("[Sharelist] 是否添加到试听列表:", addToDefaultList);
      console.log("[Sharelist] 是否是本地歌单:", isLocalPlaylist.value);
      try {
        const qualityMap = {
          "standard": "320k",
          "high": "flac",
          "lossless": "flac24bit",
          "low": "128k"
        };
        const playerQuality = store_modules_player.playerStore.getState().audioQuality || "standard";
        const quality = qualityMap[playerQuality] || "320k";
        console.log(`[Sharelist] 使用音质 ${quality} 获取歌曲播放URL`);
        let targetListId;
        if (isLocalPlaylist.value) {
          console.log("[Sharelist] 本地歌单，使用临时列表播放，不添加到试听列表");
          store_modules_list.listStore.setTempList(store_modules_list.LIST_IDS.TEMP, [], {});
          store_modules_list.listStore.setTempList(
            store_modules_list.LIST_IDS.TEMP,
            songs.value,
            {
              id: currentListId.value,
              source: listSource.value,
              name: playlistName.value
            }
          );
          store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
          targetListId = store_modules_list.LIST_IDS.TEMP;
          addToDefaultList = false;
        } else {
          console.log("[Sharelist] 在线歌单，使用临时列表播放，添加到试听列表");
          const importedId = generateImportedPlaylistId();
          store_modules_list.listStore.setTempList(store_modules_list.LIST_IDS.TEMP, [], {});
          store_modules_list.listStore.setTempList(
            store_modules_list.LIST_IDS.TEMP,
            songs.value,
            {
              id: importedId,
              source: listSource.value,
              name: playlistName.value,
              link: pageLink.value || ""
            }
          );
          store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
          targetListId = store_modules_list.LIST_IDS.TEMP;
          addToDefaultList = true;
        }
        if (addToDefaultList) {
          const songToAdd = {
            id: song.id,
            name: song.name,
            singer: song.singer,
            ar: song.ar || (song.singer ? song.singer.split("、").map((name) => ({ name })) : []),
            album: song.album || song.albumName,
            duration: song.dt || song.interval || song.duration,
            source: song.source || listSource.value,
            songmid: song.songmid,
            hash: song.hash,
            copyrightId: song.copyrightId,
            img: song.img || song.albumPic || ((_a = song.al) == null ? void 0 : _a.picUrl) || ""
          };
          const defaultList = store_modules_list.listStore.state.defaultList.list;
          console.log("[Sharelist] 试听列表当前歌曲数:", defaultList.length);
          const existingIds = new Set(defaultList.map((s) => s.id));
          if (!existingIds.has(songToAdd.id)) {
            store_modules_list.listStore.addListMusics(store_modules_list.LIST_IDS.DEFAULT, [songToAdd], "top");
            console.log("[Sharelist] 已添加 1 首歌曲到试听列表:", songToAdd.name);
          } else {
            console.log("[Sharelist] 歌曲已在试听列表中:", songToAdd.name);
          }
        }
        const previousSongId = (_b = store_modules_player.playerStore.state.currentSong) == null ? void 0 : _b.id;
        console.log("[Sharelist] 之前播放的歌曲ID:", previousSongId, "即将播放的歌曲ID:", song.id);
        const musicInfo = {
          id: song.id,
          name: song.name,
          singer: song.singer,
          ar: song.ar || (song.singer ? song.singer.split("、").map((name) => ({ name })) : []),
          album: song.album || song.albumName,
          duration: song.dt || song.interval || song.duration,
          source: song.source || listSource.value,
          songmid: song.songmid,
          hash: song.hash,
          copyrightId: song.copyrightId,
          img: song.img || song.albumPic || ((_c = song.al) == null ? void 0 : _c.picUrl) || "",
          // 不设置url和playUrl，让playerStore.playSong自己处理缓存和URL获取
          url: "",
          playUrl: "",
          lyric: "",
          tlyric: "",
          rlyric: "",
          lxlyric: ""
        };
        store_modules_list.listStore.setPlayMusicInfo(targetListId, musicInfo, false);
        const isSameSong = previousSongId === musicInfo.id;
        console.log("[Sharelist] 是否是同一首歌:", isSameSong, "previousSongId:", previousSongId, "currentId:", musicInfo.id);
        if (isSameSong) {
          console.log("[Sharelist] 同一首歌，切换播放/暂停状态");
          if (store_modules_player.playerStore.state.isPlaying) {
            store_modules_player.playerStore.pause();
          } else {
            store_modules_player.playerStore.resume();
          }
          return;
        }
        store_modules_player.playerStore.updatePendingSong(null);
        console.log("[Sharelist] 👆 用户主动操作（播放歌曲），重置失败计数");
        store_modules_player.playerStore.setState({
          isUserManualSwitch: true,
          playNextRetryCount: 0,
          isPlaybackStopped: false,
          currentFailingSongId: null
        });
        console.log("[Sharelist] 调用 playerStore.playSong");
        store_modules_player.playerStore.playSong(musicInfo);
        if (!isLocalPlaylist.value && listSource.value !== "default" && currentListId.value !== "recent_deleted") {
          const playlistLink = pageLink.value || "";
          let playlistId2 = "";
          if (playlistLink) {
            const link = playlistLink;
            if (link.includes("y.qq.com/n/ryqq/playlist/")) {
              playlistId2 = ((_d = link.split("playlist/")[1]) == null ? void 0 : _d.split("?")[0]) || link;
            } else if (link.includes("kuwo.cn/playlist_detail/")) {
              playlistId2 = ((_e = link.split("playlist_detail/")[1]) == null ? void 0 : _e.split("?")[0]) || link;
            } else if (link.includes("digest-")) {
              playlistId2 = link;
            } else if (link.includes("kugou.com/yy/special/single/")) {
              playlistId2 = ((_f = link.split("single/")[1]) == null ? void 0 : _f.split(".")[0]) || link;
            } else if (link.includes("music.163.com/playlist?id=")) {
              playlistId2 = ((_g = link.split("id=")[1]) == null ? void 0 : _g.split("&")[0]) || link;
            } else if (link.includes("music.migu.cn/v3/music/playlist/")) {
              playlistId2 = ((_h = link.split("playlist/")[1]) == null ? void 0 : _h.split("?")[0]) || link;
            } else {
              playlistId2 = link;
            }
          }
          console.log("[Sharelist] 记录歌单历史 - link:", playlistLink, "id:", playlistId2);
          store_modules_player.playerStore.addToListHistory({
            id: playlistId2 || listSource.value + "_" + Date.now(),
            name: playlistName.value || "未知歌单",
            source: listSource.value || "unknown",
            coverUrl: playlistCover.value || "",
            trackCount: playlistTrackCount.value || 0,
            link: playlistLink
          });
        }
        console.log("[Sharelist] 播放完成");
      } catch (error) {
        console.error("[Sharelist] 播放失败:", error);
        common_vendor.index.showToast({
          title: "播放失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
    };
    const playSong = (index) => {
      if (currentSongIndex.value === index) {
        if (isPlaying.value) {
          store_modules_player.playerStore.pause();
        } else {
          store_modules_player.playerStore.resume();
        }
        return;
      }
      playSongWithIndex(index);
    };
    const onVirtualItemClick = ({ index, item }) => {
      console.log("[VirtualList] 点击歌曲:", index, item.name);
      playSong(index);
    };
    const onScrollHandler = (e) => {
    };
    const locateCurrentSong = async () => {
      var _a;
      console.log("[locateCurrentSong] ========== 开始定位当前歌曲 ==========");
      const playIndex = store_modules_list.listStore.state.playInfo.playIndex;
      const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      console.log("[locateCurrentSong] 播放索引:", playIndex, "列表ID:", playerListId);
      console.log("[locateCurrentSong] 当前列表歌曲数:", songs.value.length);
      console.log("[locateCurrentSong] tempListMeta?.id:", tempListMeta == null ? void 0 : tempListMeta.id, "currentListId:", currentListId.value);
      const tempId = tempListMeta == null ? void 0 : tempListMeta.id;
      let isPlayingCurrentList = false;
      if (playerListId === store_modules_list.LIST_IDS.TEMP && tempId) {
        if (tempId === currentListId.value) {
          isPlayingCurrentList = true;
          console.log("[locateCurrentSong] 匹配成功：临时列表ID直接等于当前列表ID");
        } else if (tempId === "trial" && currentListId.value === store_modules_list.LIST_IDS.DEFAULT) {
          isPlayingCurrentList = true;
          console.log("[locateCurrentSong] 匹配成功：试听列表特殊匹配");
        } else {
          console.log("[locateCurrentSong] 未匹配：tempId=", tempId, "currentListId=", currentListId.value);
        }
      }
      const isPlayingDirectly = playerListId === currentListId.value;
      console.log("[locateCurrentSong] isPlayingCurrentList:", isPlayingCurrentList, "isPlayingDirectly:", isPlayingDirectly);
      if (!isPlayingCurrentList && !isPlayingDirectly) {
        console.warn("[locateCurrentSong] 当前没有播放本列表的歌曲");
        common_vendor.index.showToast({ title: "当前没有播放本列表的歌曲", icon: "none" });
        return;
      }
      if (playIndex < 0 || playIndex >= songs.value.length) {
        console.warn("[locateCurrentSong] 播放索引无效:", playIndex);
        common_vendor.index.showToast({ title: "无法定位当前歌曲", icon: "none" });
        return;
      }
      console.log("[locateCurrentSong] 目标歌曲索引:", playIndex, "名称:", (_a = songs.value[playIndex]) == null ? void 0 : _a.name);
      if (virtualListRef.value) {
        console.log("[locateCurrentSong] 使用虚拟列表 scrollToIndex:", playIndex);
        virtualListRef.value.scrollToIndex(playIndex, true);
      }
      common_vendor.index.showToast({
        title: `已定位到第${playIndex + 1}首`,
        icon: "none",
        duration: 1500
      });
      console.log("[locateCurrentSong] ========== 定位完成 ==========");
    };
    const retryLoad = () => {
      loadPreviewList();
    };
    const loadRecentPlaylistBySource = async (playlist) => {
      var _a, _b;
      if (!playlist) {
        isLoading.value = false;
        loadError.value = "歌单信息不完整";
        return;
      }
      console.log("[Sharelist] 加载最近播放歌单, source:", playlist.source, "id:", playlist.id);
      const source = playlist.source;
      const id = playlist.id;
      isLoading.value = true;
      loadError.value = "";
      try {
        let result;
        if (source === "kw" && id.includes("digest-")) {
          result = await utils_api_songlistDirect.getListDetailDirect("kw", id, 1);
        } else if (source === "mg") {
          result = await utils_api_songlistDirect.getListDetailDirect("mg", id, 1);
        } else {
          result = await utils_api_songlist.getListDetail(source, id, 1);
        }
        console.log("[Sharelist] 获取歌单详情结果:", result);
        if (result && result.list && result.list.length > 0) {
          songs.value = result.list;
          playlistTrackCount.value = result.list.length;
          playlistPlayCount.value = ((_a = result.info) == null ? void 0 : _a.play_count) || ((_b = result.info) == null ? void 0 : _b.playCount) || "";
          listSource.value = source;
          isLocalPlaylist.value = false;
          currentListId.value = id;
        } else {
          loadError.value = "歌单内容为空";
        }
      } catch (e) {
        console.error("[Sharelist] 加载歌单失败:", e);
        loadError.value = "加载失败: " + (e.message || "未知错误");
      } finally {
        isLoading.value = false;
      }
    };
    const simplifySongs = (songs2) => {
      if (!songs2 || !Array.isArray(songs2))
        return [];
      return songs2.map((song) => {
        var _a, _b;
        const simplified = {
          id: song.id,
          name: song.name,
          singer: song.singer || (song.ar ? song.ar.map((a) => a.name).join("/") : ""),
          ar: song.ar || (song.singer ? song.singer.split("、").map((name) => ({ name })) : []),
          // 保留 ar 字段
          album: song.album || song.albumName || (song.al ? song.al.name : ""),
          duration: song.duration || song.dt || song.interval,
          dt: song.dt || song.duration || song.interval,
          // 兼容 SongListItem 组件
          interval: song.interval || song.dt || song.duration,
          // 兼容播放器
          source: song.source
        };
        if (song.songmid)
          simplified.songmid = song.songmid;
        if (song.hash)
          simplified.hash = song.hash;
        if (song.copyrightId)
          simplified.copyrightId = song.copyrightId;
        if (song.img || song.albumPic || ((_a = song.al) == null ? void 0 : _a.picUrl)) {
          simplified.img = song.img || song.albumPic || ((_b = song.al) == null ? void 0 : _b.picUrl);
        }
        return simplified;
      });
    };
    const handleCollect = async () => {
      if (!playlistName.value)
        return;
      const sourceListId = `${listSource.value}__${listId.value}`;
      let importedList = common_vendor.index.getStorageSync("imported_playlists") || [];
      const existsIndex = importedList.findIndex((p) => p.sourceListId === sourceListId);
      if (existsIndex !== -1) {
        common_vendor.index.showModal({
          title: "提示",
          content: `歌单「${importedList[existsIndex].name}」已存在，是否同步更新？`,
          confirmText: "更新",
          cancelText: "取消",
          success: async (res) => {
            if (res.confirm) {
              common_vendor.index.showLoading({ title: "更新中..." });
              try {
                console.log("[Sharelist] 使用已加载的歌曲数据更新...");
                const fullSongList = songs.value || [];
                const simplifiedSongs = simplifySongs(fullSongList);
                importedList[existsIndex].songs = simplifiedSongs;
                importedList[existsIndex].trackCount = fullSongList.length;
                importedList[existsIndex].coverImgUrl = playlistCover.value;
                common_vendor.index.setStorageSync("imported_playlists", importedList);
                common_vendor.index.$emit("imported-playlists-changed");
                console.log("[Sharelist] 已发送 imported-playlists-changed 事件（更新）");
                common_vendor.index.showToast({ title: "更新成功", icon: "success" });
              } catch (error) {
                console.error("[Sharelist] 更新失败:", error);
                common_vendor.index.showToast({ title: "更新失败", icon: "none" });
              } finally {
                common_vendor.index.hideLoading();
              }
            }
          }
        });
        return;
      }
      common_vendor.index.showModal({
        title: "导入歌单",
        content: `是否将「${playlistName.value}」导入到我的歌单？`,
        confirmText: "导入",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "获取数据中..." });
            try {
              console.log("[Sharelist] 使用已加载的歌曲数据...");
              const fullSongList = songs.value || [];
              console.log("[Sharelist] 已加载歌曲数量:", fullSongList.length, "首");
              if (fullSongList.length === 0) {
                common_vendor.index.showToast({
                  title: "歌单为空，无法导入",
                  icon: "none"
                });
                common_vendor.index.hideLoading();
                return;
              }
              const importedId = sourceListId;
              console.log("[Sharelist] 导入歌单使用的ID:", importedId);
              const simplifiedSongs = simplifySongs(fullSongList);
              console.log("[Sharelist] 精简后歌曲数量:", simplifiedSongs.length, "首");
              const importedPlaylist = {
                id: importedId,
                name: playlistName.value,
                coverImgUrl: playlistCover.value,
                trackCount: fullSongList.length,
                source: listSource.value,
                sourceListId,
                link: pageLink.value,
                platform: getPlatformName(listSource.value),
                songs: simplifiedSongs,
                // 自动更新相关标志
                canAutoUpdate: true,
                // 支持自动更新
                isFromImport: fromPage.value === "import",
                // 只有从导入功能进入才标记为 true
                autoUpdate: false
                // 默认关闭自动更新
              };
              importedList.push(importedPlaylist);
              common_vendor.index.setStorageSync("imported_playlists", importedList);
              common_vendor.index.showToast({
                title: `导入成功（${fullSongList.length}首）`,
                icon: "success"
              });
              common_vendor.index.$emit("imported-playlists-changed");
              console.log("[Sharelist] 已发送 imported-playlists-changed 事件");
              console.log("[Sharelist] handleCollect - fromPage.value:", fromPage.value);
              if (fromPage.value === "import") {
                setTimeout(() => {
                  common_vendor.index.showModal({
                    title: "自动更新",
                    content: `「${playlistName.value}」导入成功！是否开启自动更新？`,
                    confirmText: "开启",
                    cancelText: "暂不开启",
                    success: (res2) => {
                      if (res2.confirm) {
                        const updatedList = common_vendor.index.getStorageSync("imported_playlists") || [];
                        const updateIndex = updatedList.findIndex((p) => p.id === importedId);
                        if (updateIndex !== -1) {
                          updatedList[updateIndex].autoUpdate = true;
                          common_vendor.index.setStorageSync("imported_playlists", updatedList);
                          common_vendor.index.showToast({
                            title: "已开启自动更新",
                            icon: "success"
                          });
                        }
                      }
                      if (isTablet.value) {
                        emit("close");
                      } else {
                        common_vendor.index.navigateBack();
                      }
                    }
                  });
                }, 1500);
              } else {
                setTimeout(() => {
                  if (isTablet.value) {
                    emit("close");
                  } else {
                    common_vendor.index.navigateBack();
                  }
                }, 1500);
              }
            } catch (error) {
              console.error("导入失败:", error);
              common_vendor.index.showToast({
                title: "导入失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const loadPreviewList = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      console.log("[Sharelist] loadPreviewList 开始执行");
      if (isLoading.value) {
        console.log("[Sharelist] 正在加载中，跳过");
        return;
      }
      isLoading.value = true;
      loadError.value = "";
      try {
        let result;
        const options = pageOptions.value && Object.keys(pageOptions.value).length > 0 ? pageOptions.value : ((_b = (_a = getCurrentPages()[getCurrentPages().length - 1]) == null ? void 0 : _a.$page) == null ? void 0 : _b.options) || {};
        let targetPlaylistId = options.id;
        if (!targetPlaylistId && pageLink.value) {
          let link = decodeURIComponent(pageLink.value);
          if (/^https?:\/\//.test(link)) {
            let match = link.match(/[?&]id=(\d+)/);
            if (match) {
              targetPlaylistId = match[1];
              console.log("[Sharelist] 从URL查询参数解析出ID:", targetPlaylistId);
            } else {
              match = link.match(/\/playlist(?:_detail)?\/(\d+)/);
              if (match) {
                targetPlaylistId = match[1];
                console.log("[Sharelist] 从URL路径解析出ID:", targetPlaylistId);
              } else if (pageSource.value === "mg" && link.includes("c.migu.cn")) {
                console.log("[Sharelist] 检测到咪咕短链接，尝试获取真实URL...");
                try {
                  const res = await common_vendor.index.request({
                    url: link,
                    method: "HEAD",
                    header: {
                      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15"
                    }
                  });
                  const location = ((_c = res.header) == null ? void 0 : _c.Location) || ((_d = res.header) == null ? void 0 : _d.location);
                  if (location) {
                    console.log("[Sharelist] 咪咕短链接重定向到:", location);
                    const idMatch = location.match(/[?&]id=(\d+)/);
                    if (idMatch) {
                      targetPlaylistId = idMatch[1];
                      console.log("[Sharelist] 从咪咕重定向URL解析出ID:", targetPlaylistId);
                    }
                  }
                } catch (err) {
                  console.error("[Sharelist] 获取咪咕短链接失败:", err);
                }
              }
            }
          } else {
            targetPlaylistId = link;
            console.log("[Sharelist] 直接使用作为ID:", targetPlaylistId);
          }
        }
        const shouldUseBackend = pageSource.value === "tx";
        if (shouldUseBackend) {
          console.log("[Sharelist] QQ音乐使用后端接口:", pageSource.value);
          console.log("[Sharelist] 调用 getListDetail:", pageSource.value, pageLink.value);
          result = await utils_api_songlist.getListDetail(pageSource.value, pageLink.value, 1);
        } else {
          console.log("[Sharelist] 使用前端直接API:", pageSource.value);
          console.log("[Sharelist] 调用 getListDetailDirect:", pageSource.value, targetPlaylistId);
          result = await utils_api_songlistDirect.getListDetailDirect(pageSource.value, targetPlaylistId, 1);
        }
        console.log("[Sharelist] ========== 返回数据开始 ==========");
        console.log("[Sharelist] result.info:", JSON.stringify(result.info));
        console.log("[Sharelist] result.list类型:", typeof result.list, "是否是数组:", Array.isArray(result.list));
        console.log("[Sharelist] result.list长度:", (_e = result.list) == null ? void 0 : _e.length);
        console.log("[Sharelist] result.list前3项:", JSON.stringify((_f = result.list) == null ? void 0 : _f.slice(0, 3)));
        console.log("[Sharelist] ========== 返回数据结束 ==========");
        listSource.value = result.source;
        listId.value = result.id || options.id || "";
        currentListId.value = pageLink.value || result.id || options.id || "";
        console.log("[Sharelist] 设置 currentListId:", currentListId.value);
        console.log("[Sharelist] 开始更新歌单信息...");
        playlistId.value = result.id || options.id || "";
        playlistName.value = ((_g = result.info) == null ? void 0 : _g.name) || "未知歌单";
        playlistCover.value = ((_h = result.info) == null ? void 0 : _h.img) || "";
        playlistAuthor.value = ((_i = result.info) == null ? void 0 : _i.author) || "";
        playlistDesc.value = ((_j = result.info) == null ? void 0 : _j.desc) || "";
        playlistTrackCount.value = result.total || 0;
        playlistPlayCount.value = ((_k = result.info) == null ? void 0 : _k.play_count) || "";
        console.log("[Sharelist] 歌单信息已更新:", {
          name: playlistName.value,
          author: playlistAuthor.value,
          playCount: playlistPlayCount.value,
          trackCount: playlistTrackCount.value
        });
        console.log("[Sharelist] 开始更新歌曲列表...");
        songs.value = result.list || [];
        console.log("[Sharelist] 总歌曲数量:", (_l = songs.value) == null ? void 0 : _l.length);
        console.log("[Sharelist] result.total:", result.total);
        console.log("[Sharelist] result.limit:", result.limit);
        hasMore.value = false;
        console.log("[Sharelist] 已禁用分页加载，显示所有歌曲");
        if (songs.value.length === 0) {
          console.log("[Sharelist] 歌单为空，可能原因：");
          console.log("[Sharelist] 1. 歌单ID无效或歌单不存在");
          console.log("[Sharelist] 2. 歌单是私有的");
          console.log("[Sharelist] 3. 歌单已被删除");
          console.log("[Sharelist] 4. 网络请求失败");
          loadError.value = "歌单为空，可能原因：\n1. 歌单不存在或已被删除\n2. 歌单是私有的\n3. 网络请求失败\n\n请尝试其他歌单";
        }
      } catch (error) {
        console.error("[Sharelist] 加载歌单失败:", error);
        loadError.value = error.message || "加载失败，请检查链接是否正确";
        common_vendor.index.showToast({
          title: loadError.value,
          icon: "none",
          duration: 3e3
        });
      } finally {
        isLoading.value = false;
        showActionBar.value = true;
        console.log("[Sharelist] loadPreviewList 执行完成, isLoading:", isLoading.value, "songs.length:", songs.value.length);
        setTimeout(() => {
          console.log("[Sharelist] 强制刷新后的 songs.length:", songs.value.length);
        }, 100);
      }
    };
    common_vendor.onMounted(() => {
      var _a;
      console.log("[Sharelist] onMounted 开始执行");
      initDarkMode();
      checkIsTablet();
      common_vendor.index.$on("miniPlayerHeightChange", handleMiniPlayerHeightChange);
      let options = {};
      if (isTablet.value && props.urlParams && Object.keys(props.urlParams).length > 0) {
        options = { ...props.urlParams };
        console.log("[Sharelist] 平板模式，使用 props.urlParams:", JSON.stringify(options));
      } else {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        options = ((_a = currentPage.$page) == null ? void 0 : _a.options) || currentPage.options || {};
        console.log("[Sharelist] 普通模式，使用页面参数:", JSON.stringify(options));
      }
      pageOptions.value = options;
      console.log("[Sharelist] 页面参数:", JSON.stringify(options));
      console.log("[Sharelist] link:", options.link);
      console.log("[Sharelist] source:", options.source);
      console.log("[Sharelist] platform:", options.platform);
      console.log("[Sharelist] id:", options.id);
      console.log("[Sharelist] fromName:", options.fromName);
      console.log("[Sharelist] from:", options.from);
      fromPage.value = options.from || "";
      console.log("[Sharelist] fromPage.value:", fromPage.value);
      if (options.fromMyMusic === "true" && options.playlistId) {
        console.log("[Sharelist] 从我的音乐页面进入，尝试加载本地数据");
        console.log("[Sharelist] playlistId:", options.playlistId);
        isLoading.value = true;
        setTimeout(() => {
          const isUserList = options.playlistId && options.playlistId.startsWith("userlist_");
          if (isUserList) {
            console.log("[Sharelist] 用户自建歌单模式");
            isLocalPlaylist.value = true;
            const userLists = store_modules_list.listStore.state.userLists || [];
            const targetList = userLists.find((l) => l.id === options.playlistId);
            console.log("[Sharelist] 查找到的用户歌单:", targetList ? targetList.name : "未找到");
            if (targetList && targetList.list && targetList.list.length > 0) {
              console.log("[Sharelist] 使用用户自建歌单数据，数量:", targetList.list.length);
              const songsWithAr = targetList.list.map((song) => ({
                ...song,
                ar: song.ar || (song.singer ? song.singer.split("、").map((name) => ({ name })) : [])
              }));
              const decodedName = options.playlistName ? decodeURIComponent(options.playlistName) : "";
              playlistName.value = decodedName || targetList.name || "未知歌单";
              playlistCover.value = targetList.coverImgUrl || "/static/logo.png";
              playlistAuthor.value = targetList.author || "";
              playlistDesc.value = targetList.desc || "";
              playlistTrackCount.value = targetList.list.length;
              playlistPlayCount.value = "";
              songs.value = songsWithAr;
              hasMore.value = false;
              isLoading.value = false;
              isPreviewMode.value = false;
              showActionBar.value = true;
              currentListId.value = targetList.id;
              listSource.value = "local";
              console.log("[Sharelist] 用户自建歌单数据加载完成");
            } else {
              console.log("[Sharelist] 用户自建歌单未找到数据");
              isLoading.value = false;
              loadError.value = "歌单数据不存在";
            }
          } else {
            console.log("[Sharelist] 导入歌单模式");
            isLocalPlaylist.value = true;
            let importedList = [];
            try {
              const rawData = common_vendor.index.getStorageSync("imported_playlists");
              if (rawData) {
                if (typeof rawData === "string") {
                  importedList = JSON.parse(rawData);
                } else if (Array.isArray(rawData)) {
                  importedList = rawData;
                }
              }
            } catch (e) {
              console.error("[Sharelist] 解析导入歌单失败:", e);
            }
            const targetPlaylist = importedList.find((p) => p.id === options.playlistId || p.sourceListId === options.playlistId);
            console.log("[Sharelist] 查找到的导入歌单:", targetPlaylist ? targetPlaylist.name : "未找到");
            if (targetPlaylist && targetPlaylist.songs && targetPlaylist.songs.length > 0) {
              console.log("[Sharelist] 使用导入歌单数据，数量:", targetPlaylist.songs.length);
              const songsWithAr = targetPlaylist.songs.map((song) => ({
                ...song,
                ar: song.ar || (song.singer ? song.singer.split("、").map((name) => ({ name })) : [])
              }));
              playlistName.value = targetPlaylist.name || "未知歌单";
              playlistCover.value = targetPlaylist.coverImgUrl || "/static/logo.png";
              playlistAuthor.value = targetPlaylist.author || "";
              playlistDesc.value = targetPlaylist.desc || "";
              playlistTrackCount.value = targetPlaylist.songs.length;
              playlistPlayCount.value = targetPlaylist.playCount ? formatPlayCount(targetPlaylist.playCount) : "";
              songs.value = songsWithAr;
              hasMore.value = false;
              isLoading.value = false;
              isPreviewMode.value = false;
              showActionBar.value = true;
              currentListId.value = targetPlaylist.id || targetPlaylist.sourceListId;
              listSource.value = targetPlaylist.platform || options.source || "";
              console.log("[Sharelist] 导入歌单数据加载完成");
            } else {
              console.log("[Sharelist] 导入歌单未找到数据");
              isLoading.value = false;
              loadError.value = "歌单数据不存在";
            }
          }
        }, 100);
        return;
      }
      if (options.mode === "ai_playlist") {
        console.log("[Sharelist] 🎵 进入AI推荐歌单模式");
        console.log("[Sharelist] AI歌单ID:", options.id);
        console.log("[Sharelist] AI歌单名称:", options.name);
        isPreviewMode.value = false;
        showActionBar.value = true;
        isLocalPlaylist.value = true;
        isLoading.value = true;
        setTimeout(() => {
          try {
            const aiPlaylistData = common_vendor.index.getStorageSync("tempAiPlaylist");
            if (!aiPlaylistData || !aiPlaylistData.songs || aiPlaylistData.songs.length === 0) {
              console.error("[Sharelist] ❌ 未找到AI歌单数据");
              isLoading.value = false;
              loadError.value = "AI歌单数据不存在";
              return;
            }
            console.log("[Sharelist] ✅ 找到AI歌单数据，歌曲数量:", aiPlaylistData.songs.length);
            const playlistInfo = aiPlaylistData.playlistInfo || {};
            playlistName.value = decodeURIComponent(options.name) || playlistInfo.title || "AI推荐歌单";
            playlistCover.value = "";
            playlistAuthor.value = "AI 智能推荐";
            playlistDesc.value = playlistInfo.reason || "基于你的听歌习惯智能生成";
            playlistTrackCount.value = aiPlaylistData.songs.length;
            playlistPlayCount.value = "";
            const processedSongs = aiPlaylistData.songs.map((song, index) => ({
              ...song,
              id: song._aiId || `ai_song_${Date.now()}_${index}`,
              singer: song.singer,
              ar: song.ar || (song.singer ? [{ name: song.singer }] : []),
              al: song.al || { name: song.album || "" },
              album: song.album || { name: song.album || "" },
              source: "ai_pending",
              // 标记待搜索
              _isAiSong: true,
              // 标记是AI歌曲
              _aiIndex: index
              // 保存在歌单中的索引
            }));
            songs.value = processedSongs;
            hasMore.value = false;
            isLoading.value = false;
            currentListId.value = options.id || aiPlaylistData.id || `ai_playlist_${Date.now()}`;
            listSource.value = "ai_recommend";
            console.log("[Sharelist] ✅ AI推荐歌单数据加载完成");
            console.log("[Sharelist] 📋 歌单信息:", {
              名称: playlistName.value,
              歌曲数: songs.length,
              列表ID: currentListId.value
            });
          } catch (error) {
            console.error("[Sharelist] ❌ 加载AI歌单失败:", error);
            isLoading.value = false;
            loadError.value = "加载AI歌单失败: " + (error.message || "未知错误");
          }
        }, 100);
        return;
      }
      if (options.link && options.source) {
        console.log("[Sharelist] 进入预览模式");
        isPreviewMode.value = true;
        pageLink.value = decodeURIComponent(options.link);
        pageSource.value = options.source;
        pagePlatform.value = decodeURIComponent(options.platform || "");
        console.log("[Sharelist] pageLink:", pageLink.value);
        console.log("[Sharelist] pageSource:", pageSource.value);
        console.log("[Sharelist] pagePlatform:", pagePlatform.value);
        if (options.name) {
          playlistName.value = decodeURIComponent(options.name);
        }
        if (options.picUrl) {
          playlistCover.value = decodeURIComponent(options.picUrl);
        }
        if (options.author) {
          playlistAuthor.value = decodeURIComponent(options.author);
        }
        if (options.playCount) {
          playlistPlayCount.value = formatPlayCount(options.playCount);
        }
        if (options.id) {
          playlistId.value = options.id;
        }
        loadPreviewList();
      } else if (options.mode === "user" && options.fromMyMusic === "true") {
        console.log("[Sharelist] 进入用户自建歌单模式");
        console.log("[Sharelist] playlistId:", options.playlistId);
        isPreviewMode.value = false;
        showActionBar.value = true;
        isLoading.value = true;
        setTimeout(() => {
          const userLists = store_modules_list.listStore.state.userLists || [];
          const targetList = userLists.find((l) => l.id === options.playlistId);
          console.log("[Sharelist] 查找到的歌单:", targetList ? targetList.name : "未找到");
          if (targetList && targetList.list && targetList.list.length > 0) {
            songs.value = targetList.list;
            const decodedName = options.playlistName ? decodeURIComponent(options.playlistName) : "";
            playlistName.value = decodedName || targetList.name || "未知歌单";
            playlistCover.value = targetList.coverImgUrl || "/static/logo.png";
            playlistTrackCount.value = targetList.list.length;
            hasMore.value = false;
            isLoading.value = false;
            currentListId.value = targetList.id;
          } else {
            isLoading.value = false;
            loadError.value = "歌单暂无歌曲";
          }
        }, 100);
      } else if (options.mode === "default" && options.fromMyMusic === "true") {
        console.log("[Sharelist] 进入试听列表模式");
        isPreviewMode.value = false;
        showActionBar.value = true;
        isLoading.value = true;
        setTimeout(() => {
          const defaultList = store_modules_list.listStore.state.defaultList.list || [];
          console.log("[Sharelist] 试听列表数量:", defaultList.length);
          if (defaultList.length > 0) {
            songs.value = defaultList;
            playlistName.value = "试听列表";
            playlistCover.value = "/static/logo.png";
            playlistTrackCount.value = defaultList.length;
            hasMore.value = false;
            isLoading.value = false;
            currentListId.value = store_modules_list.LIST_IDS.DEFAULT;
            listSource.value = "default";
          } else {
            isLoading.value = false;
            loadError.value = "暂无试听歌曲";
          }
        }, 100);
      } else if (options.mode === "love" && options.fromMyMusic === "true") {
        console.log("[Sharelist] 进入我喜欢的音乐模式");
        isPreviewMode.value = false;
        showActionBar.value = true;
        isLoading.value = true;
        setTimeout(() => {
          const loveList = store_modules_list.listStore.state.loveList.list || [];
          console.log("[Sharelist] 喜欢列表数量:", loveList.length);
          if (loveList.length > 0) {
            songs.value = loveList;
            playlistName.value = "我喜欢的音乐";
            playlistCover.value = "/static/logo.png";
            playlistTrackCount.value = loveList.length;
            hasMore.value = false;
            isLoading.value = false;
            currentListId.value = store_modules_list.LIST_IDS.LOVE;
          } else {
            isLoading.value = false;
            loadError.value = "暂无喜欢的音乐";
          }
        }, 100);
      } else if (options.mode === "recent" && options.fromMyMusic === "true") {
        console.log("[Sharelist] 进入最近播放模式");
        isPreviewMode.value = false;
        showActionBar.value = false;
        isLoading.value = true;
        setTimeout(() => {
          const playHistory = store_modules_player.playerStore.getState().playHistory || [];
          console.log("[Sharelist] 播放历史数量:", playHistory.length);
          if (playHistory.length > 0) {
            songs.value = playHistory;
            playlistName.value = "最近播放";
            playlistCover.value = "/static/logo.png";
            playlistTrackCount.value = playHistory.length;
            hasMore.value = false;
            isLoading.value = false;
            currentListId.value = "recent_play_history";
          } else {
            isLoading.value = false;
            loadError.value = "暂无播放记录";
          }
        }, 100);
      } else if (options.mode === "deleted" && options.fromMyMusic === "true") {
        console.log("[Sharelist] 进入最近删除模式");
        isPreviewMode.value = false;
        showActionBar.value = false;
        isLoading.value = true;
        setTimeout(() => {
          let deletedList = [];
          try {
            const rawData = common_vendor.index.getStorageSync("deleted_songs");
            if (rawData) {
              if (typeof rawData === "string") {
                deletedList = JSON.parse(rawData);
              } else if (Array.isArray(rawData)) {
                deletedList = rawData;
              } else if (rawData.data && Array.isArray(rawData.data)) {
                deletedList = rawData.data;
              }
            }
          } catch (e) {
            console.error("[Sharelist] 解析删除列表失败:", e);
          }
          console.log("[Sharelist] 删除列表数量:", deletedList.length);
          if (deletedList.length > 0) {
            songs.value = deletedList;
            playlistName.value = "最近删除";
            playlistCover.value = "/static/logo.png";
            playlistTrackCount.value = deletedList.length;
            hasMore.value = false;
            isLoading.value = false;
            currentListId.value = "recent_deleted";
          } else {
            isLoading.value = false;
            loadError.value = "暂无删除记录";
          }
        }, 100);
      } else if (options.mode === "recentPlaylistHistory" && options.fromMyMusic === "true") {
        console.log("[Sharelist] 进入最近播放歌单历史模式");
        isPreviewMode.value = false;
        showActionBar.value = false;
        isLoading.value = true;
        setTimeout(() => {
          let playlistHistory = [];
          try {
            const rawData = common_vendor.index.getStorageSync("recent_playlist_history");
            if (rawData) {
              if (typeof rawData === "string") {
                playlistHistory = JSON.parse(rawData);
              } else if (Array.isArray(rawData)) {
                playlistHistory = rawData;
              } else if (rawData.data && Array.isArray(rawData.data)) {
                playlistHistory = rawData.data;
              }
            }
          } catch (e) {
            console.error("[Sharelist] 解析歌单历史失败:", e);
          }
          console.log("[Sharelist] 歌单历史数量:", playlistHistory.length);
          if (playlistHistory.length > 0) {
            songs.value = [];
            playlistName.value = "最近播放歌单";
            playlistCover.value = playlistHistory[0].coverUrl || "/static/logo.png";
            playlistTrackCount.value = playlistHistory.length;
            hasMore.value = false;
            playlistHistoryList.value = playlistHistory;
            if (options.playlistId) {
              const targetPlaylist = playlistHistory.find((p) => p.id === options.playlistId);
              if (targetPlaylist) {
                playlistCover.value = targetPlaylist.coverUrl || "/static/logo.png";
                playlistName.value = targetPlaylist.name || "最近播放歌单";
                currentListId.value = targetPlaylist.id;
                loadRecentPlaylistBySource(targetPlaylist);
                return;
              }
            }
            isLoading.value = false;
          } else {
            isLoading.value = false;
            loadError.value = "暂无歌单播放记录";
          }
        }, 100);
      } else {
        console.log("[Sharelist] 缺少必要参数，无法加载");
        loadError.value = "缺少必要参数：link或source";
      }
    });
    common_vendor.onShow(() => {
      utils_system.setStatusBarTextColor("white");
      initDarkMode();
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("miniPlayerHeightChange", handleMiniPlayerHeightChange);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: playlistCover.value && playlistCover.value !== "/static/logo.png"
      }, playlistCover.value && playlistCover.value !== "/static/logo.png" ? {
        b: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlistCover.value),
        c: common_vendor.o(($event) => handleSharelistImageError($event), "bf")
      } : {}, {
        d: !playlistCover.value || playlistCover.value === "/static/logo.png"
      }, !playlistCover.value || playlistCover.value === "/static/logo.png" ? {
        e: generateGradientBackground(playlistName.value || "歌单", "playlist")
      } : {}, {
        f: common_vendor.s(statusBarStyle.value),
        g: common_vendor.p({
          name: "chevron-left",
          size: "24",
          color: "#fff"
        }),
        h: common_vendor.o(goBack, "4a"),
        i: common_vendor.t(isPreviewMode.value ? "歌单预览" : "歌单详情"),
        j: playlistCover.value && playlistCover.value !== "/static/logo.png"
      }, playlistCover.value && playlistCover.value !== "/static/logo.png" ? common_vendor.e({
        k: playlistPlayCount.value
      }, playlistPlayCount.value ? {
        l: common_vendor.p({
          name: "play",
          size: "10",
          color: "#fff"
        }),
        m: common_vendor.t(playlistPlayCount.value)
      } : {}, {
        n: "url(" + common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlistCover.value) + ")",
        o: common_vendor.o(previewCoverImage, "b4")
      }) : common_vendor.e({
        p: common_vendor.p({
          name: "music",
          size: "32",
          color: "#ffffff"
        }),
        q: playlistPlayCount.value
      }, playlistPlayCount.value ? {
        r: common_vendor.p({
          name: "play",
          size: "10",
          color: "#fff"
        }),
        s: common_vendor.t(playlistPlayCount.value)
      } : {}, {
        t: generateGradientBackground(playlistName.value || "歌单", "playlist")
      }), {
        v: common_vendor.t(playlistName.value || "加载中..."),
        w: playlistAuthor.value
      }, playlistAuthor.value ? {
        x: common_vendor.t(playlistAuthor.value)
      } : {}, {
        y: playlistDesc.value
      }, playlistDesc.value ? {
        z: common_vendor.t(playlistDesc.value)
      } : {}, {
        A: common_vendor.t(playlistTrackCount.value),
        B: playlistPlayCount.value
      }, playlistPlayCount.value ? {} : {}, {
        C: playlistPlayCount.value
      }, playlistPlayCount.value ? {
        D: common_vendor.t(playlistPlayCount.value)
      } : {}, {
        E: showActionBar.value
      }, showActionBar.value ? common_vendor.e({
        F: isPreviewMode.value
      }, isPreviewMode.value ? {
        G: common_vendor.p({
          name: "heart",
          size: "14",
          color: "#fff"
        }),
        H: common_vendor.t(fromPage.value === "import" ? "导入歌单" : "收藏歌单"),
        I: common_vendor.o(handleCollect, "48")
      } : {}, {
        J: common_vendor.p({
          type: "fas",
          name: "play-circle",
          size: "14",
          color: "#fff"
        }),
        K: common_vendor.o(playAll, "9b")
      }) : {}, {
        L: common_vendor.p({
          type: "fas",
          name: "location-crosshairs",
          size: "18",
          color: "#ffffff"
        }),
        M: common_vendor.o(locateCurrentSong, "eb"),
        N: isLoading.value && songs.value.length === 0
      }, isLoading.value && songs.value.length === 0 ? {} : {}, {
        O: loadError.value && !isLoading.value
      }, loadError.value && !isLoading.value ? {
        P: common_vendor.p({
          name: "exclamation-circle",
          size: "48",
          color: "#999"
        }),
        Q: common_vendor.t(loadError.value),
        R: common_vendor.o(retryLoad, "c6")
      } : {}, {
        S: songs.value.length > 0
      }, songs.value.length > 0 ? {
        T: common_vendor.sr(virtualListRef, "cab5a59c-8", {
          "k": "virtualListRef"
        }),
        U: common_vendor.o(onScrollHandler, "1f"),
        V: common_vendor.o(onVirtualItemClick, "46"),
        W: common_vendor.p({
          items: songs.value,
          ["item-height"]: 60,
          height: "100%",
          ["buffer-size"]: 10,
          loading: isLoading.value,
          ["current-play-index"]: currentSongIndex.value,
          ["is-playing"]: isPlayerPlaying.value,
          ["dark-mode"]: darkMode.value,
          ["bottom-safe-height"]: common_vendor.unref(totalBottomHeight),
          ["show-more-button"]: false,
          ["show-top-radius"]: !isTablet.value
        })
      } : {}, {
        X: !isLoading.value && !loadError.value && songs.value.length === 0
      }, !isLoading.value && !loadError.value && songs.value.length === 0 ? {
        Y: common_vendor.p({
          name: "ban",
          size: "64",
          color: "#ccc"
        })
      } : {}, {
        Z: !isPreviewMode.value && !isTablet.value
      }, !isPreviewMode.value && !isTablet.value ? {
        aa: common_vendor.p({
          ["current-index"]: 2
        })
      } : {}, {
        ab: !isTablet.value
      }, !isTablet.value ? {} : {}, {
        ac: darkMode.value ? 1 : "",
        ad: isTablet.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cab5a59c"]]);
exports.MiniProgramPage = MiniProgramPage;
