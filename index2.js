"use strict";
const common_vendor = require("./common/vendor.js");
const utils_system = require("./utils/system.js");
const store_modules_list = require("./store/modules/list.js");
const store_modules_player = require("./store/modules/player.js");
const utils_playInfoStorage = require("./utils/playInfoStorage.js");
const utils_api_music = require("./utils/api/music.js");
const utils_api_songlist = require("./utils/api/songlist.js");
const utils_api_songlistDirect = require("./utils/api/songlist-direct.js");
const utils_musicUrlCache = require("./utils/musicUrlCache.js");
const utils_musicSwitchSourceStorage = require("./utils/musicSwitchSourceStorage.js");
const utils_musicParams = require("./utils/musicParams.js");
const utils_imageProxy = require("./utils/imageProxy.js");
const composables_usePageLifecycle = require("./composables/usePageLifecycle.js");
const composables_useBottomHeight = require("./composables/useBottomHeight.js");
if (!Math) {
  (RocIconPlus + VirtualList + MusicToggleModal + AutoUpdateToast + LoadingToast)();
}
const RocIconPlus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const MusicToggleModal = () => "./components/player/MusicToggleModal.js";
const AutoUpdateToast = () => "./components/common/AutoUpdateToast.js";
const LoadingToast = () => "./components/common/LoadingToast.js";
const VirtualList = () => "./components/common/VirtualList.js";
const LIST_PREV_SELECT_ID_KEY = "listPrevSelectId";
const _sfc_main = {
  __name: "index",
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  setup(__props) {
    const props = __props;
    const showSidebar = common_vendor.ref(false);
    common_vendor.computed(() => utils_system.getSafeAreaStyle());
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    common_vendor.ref(utils_system.getNavbarHeight());
    const headerStyle = common_vendor.computed(() => ({
      paddingTop: `${statusBarHeight.value}px`
    }));
    const sidebarStyle = common_vendor.computed(() => {
      var _a;
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const rpxToPx = systemInfo.windowWidth / 750;
      const tabBarHeight = 140 * rpxToPx;
      const safeAreaBottom = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
      const bottomHeight = tabBarHeight + safeAreaBottom;
      return {
        paddingTop: `${statusBarHeight.value}px`,
        paddingBottom: `${bottomHeight}px`
      };
    });
    const trialListCount = common_vendor.computed(() => store_modules_list.listStore.state.defaultList.list.length);
    const favoriteListCount = common_vendor.computed(() => store_modules_list.listStore.state.loveList.list.length);
    const showImportModal = common_vendor.ref(false);
    const importModalTitle = common_vendor.ref("");
    const importLink = common_vendor.ref("");
    const currentImportSource = common_vendor.ref("");
    const currentImportPlatform = common_vendor.ref("");
    const showSongMenuFlag = common_vendor.ref(false);
    const selectedSong = common_vendor.ref(null);
    const selectedSongIndex = common_vendor.ref(-1);
    const showPlaylistMenu = common_vendor.ref(false);
    const menuPlaylistInfo = common_vendor.ref(null);
    const menuPlaylistIndex = common_vendor.ref(-1);
    const menuPlaylistType = common_vendor.ref("custom");
    const showMusicToggleModal = common_vendor.ref(false);
    const toggleOriginalSong = common_vendor.ref(null);
    const showAutoUpdateToast = common_vendor.ref(false);
    const autoUpdatePlaylistName = common_vendor.ref("");
    const showLoadingToast = common_vendor.ref(false);
    const loadingToastTitle = common_vendor.ref("加载中");
    const loadingToastSubtitle = common_vendor.ref("");
    const isPlaylistLoading = common_vendor.ref(false);
    const importedPlaylists = common_vendor.ref([]);
    const listSource = common_vendor.ref("");
    const customPlaylists = common_vendor.ref([]);
    const autoUpdatedPlaylists = common_vendor.ref(/* @__PURE__ */ new Set());
    const darkMode = common_vendor.ref(false);
    const isDataLoaded = common_vendor.ref(false);
    const saveListPrevSelectId = (id) => {
      try {
        common_vendor.index.setStorageSync(LIST_PREV_SELECT_ID_KEY, id);
        console.log("[Playlist] 保存上次选择的歌单ID:", id);
      } catch (error) {
        console.error("[Playlist] 保存歌单ID失败:", error);
      }
    };
    const getListPrevSelectId = () => {
      try {
        const id = common_vendor.index.getStorageSync(LIST_PREV_SELECT_ID_KEY);
        console.log("[Playlist] 获取上次选择的歌单ID:", id);
        return id || null;
      } catch (error) {
        console.error("[Playlist] 获取歌单ID失败:", error);
        return null;
      }
    };
    const { bottomPaddingStyle, totalBottomHeight } = composables_useBottomHeight.useBottomHeight();
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[Playlist] 初始化暗黑模式:", darkMode.value);
    };
    const refreshCustomPlaylists = () => {
      customPlaylists.value = store_modules_list.listStore.state.userLists.map((l) => ({
        id: l.id,
        name: l.name,
        coverImgUrl: l.coverImgUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`,
        trackCount: l.list ? l.list.length : 0
      }));
    };
    common_vendor.watch(() => store_modules_list.listStore.state.userLists, () => {
      refreshCustomPlaylists();
    }, { deep: true });
    composables_usePageLifecycle.usePageLifecycle(
      () => props.isActive,
      {
        onInit: () => {
          console.log("[Playlist] 页面初始化");
          initDarkMode();
          refreshCustomPlaylists();
          if (typeof requestAnimationFrame !== "undefined") {
            requestAnimationFrame(() => {
              setTimeout(() => {
                loadPlaylistData();
              }, 100);
            });
          } else {
            setTimeout(() => {
              loadPlaylistData();
            }, 200);
          }
        },
        onActivated: () => {
          console.log("[Playlist] 页面激活");
          utils_system.setStatusBarTextColor("black");
          initDarkMode();
          refreshCustomPlaylists();
          console.log("[Playlist] 刷新自定义歌单:", customPlaylists.value.length, "个");
          if (isDataLoaded.value) {
            const importedList = common_vendor.index.getStorageSync("imported_playlists") || [];
            importedPlaylists.value = importedList;
            console.log("[Playlist] 刷新已导入歌单:", importedList.length, "个");
            console.log("[Playlist] 当前 currentPlaylistId:", currentPlaylistId.value);
            refreshCurrentPlaylist();
          }
        },
        onDeactivated: () => {
          console.log("[Playlist] 页面停用");
        }
      }
    );
    const handleThemeChanged = (data) => {
      console.log("[Playlist] 收到主题变化事件:", data);
      darkMode.value = data.isDark;
      utils_system.setStatusBarTextColor(data.isDark ? "light" : "black");
    };
    common_vendor.onMounted(() => {
      common_vendor.index.$on("themeChanged", handleThemeChanged);
      console.log("[Playlist] 已注册主题变化监听");
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("themeChanged", handleThemeChanged);
      console.log("[Playlist] 已移除主题变化监听");
    });
    const currentPlaylistId = common_vendor.ref("trial");
    const currentPlaylist = common_vendor.reactive({
      id: "trial",
      name: "试听列表",
      coverImgUrl: "",
      creator: {
        nickname: "拼好歌官方",
        avatarUrl: ""
      },
      description: "试听列表，存放您最近试听的歌曲",
      trackCount: 0,
      playCount: 0
    });
    const songs = common_vendor.ref([]);
    const isLoading = common_vendor.ref(false);
    const setSongList = (allSongs) => {
      if (!Array.isArray(allSongs)) {
        console.warn("[Playlist] setSongList: allSongs 不是数组", typeof allSongs, allSongs);
        songs.value = [];
        showLoadingToast.value = false;
        return;
      }
      const totalSongs = allSongs.length;
      console.log("[Playlist] setSongList: 准备加载", totalSongs, "首歌曲");
      if (totalSongs > 100) {
        showLoadingToast.value = true;
        loadingToastTitle.value = "正在加载";
        loadingToastSubtitle.value = `${totalSongs}首歌曲`;
        common_vendor.nextTick$1(() => {
          songs.value = allSongs;
          setTimeout(() => {
            showLoadingToast.value = false;
          }, 300);
        });
      } else {
        songs.value = allSongs;
      }
      console.log(`[Playlist] 已设置歌曲列表，共 ${totalSongs} 首`);
    };
    const isPlaying = common_vendor.computed(() => store_modules_player.playerStore.state.isPlaying);
    const isPlayerPlaying = common_vendor.computed(() => store_modules_player.playerStore.state.isPlaying);
    const currentSongIndex = common_vendor.computed(() => {
      const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      const isPlayingImportedList = playerListId === store_modules_list.LIST_IDS.TEMP && tempListMeta.id === currentPlaylistId.value;
      const currentListId = currentPlaylistId.value === "trial" || currentPlaylistId.value === store_modules_list.LIST_IDS.DEFAULT ? store_modules_list.LIST_IDS.DEFAULT : currentPlaylistId.value === "favorite" || currentPlaylistId.value === store_modules_list.LIST_IDS.LOVE ? store_modules_list.LIST_IDS.LOVE : currentPlaylistId.value;
      if (playerListId !== currentListId && !isPlayingImportedList) {
        return -1;
      }
      const playIndex = store_modules_list.listStore.state.playInfo.playIndex;
      if (playIndex >= 0 && playIndex < songs.value.length) {
        return playIndex;
      }
      return -1;
    });
    common_vendor.computed(() => {
      if (currentSongIndex.value >= 0 && songs.value.length > currentSongIndex.value) {
        return songs.value[currentSongIndex.value];
      }
      return null;
    });
    const scrollTop = common_vendor.ref(0);
    const scrollIntoViewId = common_vendor.ref("");
    const virtualListRef = common_vendor.ref(null);
    const virtualListHeight = common_vendor.computed(() => {
      var _a;
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const windowHeight = systemInfo.windowHeight || 667;
      const statusBar = statusBarHeight.value;
      const headerHeight = 44;
      const rpxToPx = systemInfo.windowWidth / 750;
      const tabBarHeight = 140 * rpxToPx;
      const safeAreaBottom = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
      const bottomHeight = tabBarHeight + safeAreaBottom;
      console.log("[Playlist] scrollContainerHeight 计算:", { windowHeight, statusBar, headerHeight, bottomHeight });
      const height = windowHeight - statusBar - headerHeight - bottomHeight;
      return `${Math.max(height, 300)}px`;
    });
    const onScrollHandler = (e) => {
    };
    const onVirtualItemClick = ({ index, item }) => {
      console.log("[VirtualList] 点击歌曲:", index, item.name);
      playSong(index);
    };
    const onVirtualMoreClick = ({ index, item }) => {
      console.log("[VirtualList] 点击更多:", index, item.name);
      showSongMenu(item, index);
    };
    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value;
      if (showSidebar.value) {
        console.log("========== [Sidebar] 侧边栏打开 ==========");
        console.log("[Sidebar] 当前选中歌单 currentPlaylistId:", currentPlaylistId.value);
        console.log("[Sidebar] 已导入歌单数量:", importedPlaylists.value.length);
        importedPlaylists.value.forEach((p, i) => {
          console.log(`[Sidebar] [${i}] id="${p.id}" name="${p.name}" platform="${p.platform}" active=${currentPlaylistId.value === p.id}`);
        });
        console.log("==========================================");
      }
    };
    const closeSidebar = () => {
      showSidebar.value = false;
    };
    const handlePlaylistImageError = (event, playlist, type) => {
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
    const saveImportedPlaylist = () => {
      console.log("[saveImportedPlaylist] 开始保存，歌单ID:", currentPlaylistId.value);
      const index = importedPlaylists.value.findIndex((p) => p.id === currentPlaylistId.value);
      if (index > -1) {
        console.log("[saveImportedPlaylist] 找到歌单，索引:", index);
        importedPlaylists.value[index].songs = [...songs.value];
        importedPlaylists.value[index].trackCount = songs.value.length;
        console.log("[saveImportedPlaylist] 更新后的歌曲数量:", importedPlaylists.value[index].trackCount);
        common_vendor.index.setStorageSync("imported_playlists", importedPlaylists.value);
        console.log("[saveImportedPlaylist] 本地存储已保存");
        const newPlaylists = [...importedPlaylists.value];
        importedPlaylists.value = newPlaylists;
        console.log("[saveImportedPlaylist] 已触发响应式更新");
      } else {
        console.warn("[saveImportedPlaylist] 未找到要保存的歌单，歌单ID:", currentPlaylistId.value);
      }
    };
    const selectPlaylist = (playlistId, forceReload = false) => {
      if (isPlaylistLoading.value) {
        console.log("[Playlist] 歌单正在加载中，阻止切换");
        return;
      }
      console.log("========== [Playlist] selectPlaylist 被调用 ==========");
      console.log("[Playlist] 传入的 playlistId:", playlistId, "forceReload:", forceReload);
      console.log("[Playlist] 当前 currentPlaylistId:", currentPlaylistId.value);
      if (currentPlaylistId.value === playlistId && !forceReload) {
        console.log("[Playlist] 歌单已选中，关闭侧边栏");
        showSidebar.value = false;
        return;
      }
      currentPlaylistId.value = playlistId;
      showSidebar.value = false;
      saveListPrevSelectId(playlistId);
      if (playlistId === "trial" || playlistId === store_modules_list.LIST_IDS.DEFAULT) {
        currentPlaylist.id = store_modules_list.LIST_IDS.DEFAULT;
        currentPlaylist.name = "试听列表";
        currentPlaylist.description = "试听列表，存放您最近试听的歌曲";
        listSource.value = "";
      } else if (playlistId === "favorite" || playlistId === store_modules_list.LIST_IDS.LOVE) {
        currentPlaylist.id = store_modules_list.LIST_IDS.LOVE;
        currentPlaylist.name = "我的收藏";
        currentPlaylist.description = "您收藏的歌曲";
        listSource.value = "";
      } else if (playlistId.startsWith("custom_") || playlistId.startsWith("userlist_")) {
        const userList = store_modules_list.listStore.state.userLists.find((l) => l.id === playlistId);
        if (userList) {
          console.log("[Playlist] 选择自定义歌单:", userList.name);
          currentPlaylist.id = userList.id;
          currentPlaylist.name = userList.name;
          currentPlaylist.coverImgUrl = userList.coverImgUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`;
          currentPlaylist.description = "自定义歌单";
          listSource.value = "custom";
          const playlistSongs = userList.list || [];
          setSongList(playlistSongs);
          scrollTop.value = 0;
          console.log("[Playlist] 自定义歌单歌曲数:", playlistSongs.length);
          return;
        }
      }
      songs.value = [];
      fetchSongs();
    };
    const selectImportedPlaylist = (playlist) => {
      if (isPlaylistLoading.value) {
        console.log("[Playlist] 歌单正在加载中，阻止切换");
        return;
      }
      console.log("========== [Playlist] selectImportedPlaylist 被调用 ==========");
      console.log("[Playlist] 传入的歌单:", JSON.stringify({ id: playlist.id, name: playlist.name }));
      console.log("[Playlist] 当前 currentPlaylistId:", currentPlaylistId.value);
      if (currentPlaylistId.value === playlist.id) {
        console.log("[Playlist] 歌单已选中，关闭侧边栏");
        showSidebar.value = false;
        return;
      }
      currentPlaylistId.value = playlist.id;
      showSidebar.value = false;
      saveListPrevSelectId(playlist.id);
      currentPlaylist.id = playlist.id;
      currentPlaylist.name = playlist.name;
      currentPlaylist.coverImgUrl = playlist.coverImgUrl;
      currentPlaylist.description = `从${playlist.platform}导入的歌单`;
      listSource.value = playlist.source || "";
      const playlistSongs = playlist.songs || [];
      setSongList(playlistSongs);
      scrollTop.value = 0;
      console.log("[Playlist] 选择已导入歌单:", playlist.name, "歌曲数量:", playlistSongs.length);
      console.log("========== [Playlist] selectImportedPlaylist 完成 ==========");
    };
    const platforms = [
      { name: "网易云音乐", source: "wy" },
      { name: "QQ音乐", source: "tx" },
      { name: "酷狗音乐", source: "kg" },
      { name: "酷我音乐", source: "kw" },
      { name: "咪咕音乐", source: "mg" }
    ];
    const createNewPlaylist = () => {
      common_vendor.index.showModal({
        title: "新建歌单",
        editable: true,
        placeholderText: "你想起啥名...",
        success: (res) => {
          if (res.confirm && res.content) {
            const name = res.content.trim();
            if (!name) {
              common_vendor.index.showToast({ title: "歌单名称不能为空", icon: "none" });
              return;
            }
            const exists = store_modules_list.listStore.state.userLists.some((l) => l.name === name);
            if (exists) {
              common_vendor.index.showModal({
                title: "提示",
                content: "已存在同名歌单，是否继续创建？",
                success: (confirmRes) => {
                  if (confirmRes.confirm) {
                    doCreatePlaylist(name);
                  }
                }
              });
              return;
            }
            doCreatePlaylist(name);
          }
        }
      });
    };
    const doCreatePlaylist = (name) => {
      const newList = store_modules_list.listStore.createUserList(name);
      if (newList) {
        refreshCustomPlaylists();
        showSidebar.value = true;
        common_vendor.index.showToast({ title: "创建成功", icon: "success" });
        console.log("[createNewPlaylist] 新建歌单成功:", newList.name, "ID:", newList.id);
      }
    };
    const importPlaylist = () => {
      common_vendor.index.showActionSheet({
        itemList: platforms.map((p) => p.name),
        success: (res) => {
          const platform = platforms[res.tapIndex];
          currentImportSource.value = platform.source;
          currentImportPlatform.value = platform.name;
          importModalTitle.value = `从${platform.name}导入`;
          importLink.value = "";
          showImportModal.value = true;
        }
      });
    };
    const fetchSongs = async () => {
      var _a;
      if (isLoading.value)
        return;
      isLoading.value = true;
      try {
        if (currentPlaylistId.value === "trial" || currentPlaylistId.value === store_modules_list.LIST_IDS.DEFAULT) {
          console.log("[fetchSongs] 从试听列表获取歌曲，数量:", store_modules_list.listStore.state.defaultList.list.length);
          songs.value = [...store_modules_list.listStore.state.defaultList.list];
        } else if (currentPlaylistId.value === "favorite" || currentPlaylistId.value === store_modules_list.LIST_IDS.LOVE) {
          console.log("[fetchSongs] 从收藏列表获取歌曲，数量:", store_modules_list.listStore.state.loveList.list.length);
          songs.value = [...store_modules_list.listStore.state.loveList.list];
        } else if (currentPlaylistId.value.startsWith("custom_") || currentPlaylistId.value.startsWith("userlist_")) {
          const userList = store_modules_list.listStore.state.userLists.find((l) => l.id === currentPlaylistId.value);
          console.log("[fetchSongs] 从自定义歌单获取歌曲，歌单ID:", currentPlaylistId.value, "歌曲数量:", ((_a = userList == null ? void 0 : userList.list) == null ? void 0 : _a.length) || 0);
          if (userList && userList.list) {
            songs.value = [...userList.list];
          } else {
            songs.value = [];
          }
        } else {
          const importedList = common_vendor.index.getStorageSync("imported_playlists") || [];
          const currentPlaylistData = importedList.find((p) => p.id === currentPlaylistId.value);
          if (currentPlaylistData && currentPlaylistData.songs) {
            console.log("[fetchSongs] 从导入的歌单获取歌曲，歌单ID:", currentPlaylistId.value, "歌曲数量:", currentPlaylistData.songs.length);
            const songsWithAr = currentPlaylistData.songs.map((song) => ({
              ...song,
              ar: song.ar || (song.singer ? song.singer.split("/").map((name) => ({ name })) : [])
            }));
            songs.value = songsWithAr;
          } else {
            console.log("[fetchSongs] 未找到导入歌单数据");
            songs.value = [];
          }
        }
        console.log("[fetchSongs] 加载完成，共:", songs.value.length, "首");
      } catch (error) {
        console.error("[fetchSongs] 获取歌曲列表失败:", error);
      } finally {
        isLoading.value = false;
      }
    };
    const onScrollToLower = () => {
      console.log("[Playlist] onScrollToLower 触发，已加载全部", songs.value.length, "首歌曲");
    };
    const playSongWithIndex = async (index) => {
      var _a, _b;
      const song = songs.value[index];
      if (!song)
        return;
      console.log("[Playlist] ========== 开始播放歌曲 ==========");
      console.log("[Playlist] 歌曲索引:", index);
      console.log("[Playlist] 歌曲名称:", song.name);
      try {
        if (songs.value.length > 0) {
          console.log("[Playlist] 播放歌曲，设置临时列表");
          store_modules_list.listStore.setTempList(
            store_modules_list.LIST_IDS.TEMP,
            songs.value,
            {
              id: currentPlaylist.id,
              source: listSource.value || "",
              name: currentPlaylist.name
            }
          );
          store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
          store_modules_list.listStore.updatePlayIndexByListId(store_modules_list.LIST_IDS.TEMP, song.id);
          console.log("[Playlist] 列表ID:", store_modules_list.LIST_IDS.TEMP, "播放索引:", index);
        }
        const musicInfo = {
          id: song.id,
          name: song.name,
          singer: song.ar ? song.ar.map((a) => a.name).join("/") : song.singer || "",
          ar: song.ar || (song.singer ? song.singer.split("/").map((name) => ({ name })) : []),
          album: ((_a = song.al) == null ? void 0 : _a.name) || song.albumName || song.album || "",
          duration: song.dt || song.interval || song.duration,
          source: song.source || "tx",
          songmid: song.songmid,
          hash: song.hash,
          copyrightId: song.copyrightId,
          img: ((_b = song.al) == null ? void 0 : _b.picUrl) || song.img || song.albumPic || "",
          // 不设置url和playUrl，让playerStore.playSong自己处理缓存和URL获取
          url: "",
          playUrl: "",
          lyric: song.lyric || "",
          tlyric: song.tlyric || "",
          rlyric: song.rlyric || "",
          lxlyric: song.lxlyric || ""
        };
        store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.TEMP, musicInfo, false);
        console.log("[Playlist] 调用 playerStore.playSong");
        store_modules_player.playerStore.playSong(musicInfo);
        console.log("[Playlist] 播放完成");
      } catch (error) {
        console.error("[Playlist] 播放失败:", error);
        store_modules_player.playerStore.clearStatusText();
        common_vendor.index.showToast({ title: "播放失败", icon: "none" });
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
      const listId = currentPlaylistId.value === "trial" || currentPlaylistId.value === store_modules_list.LIST_IDS.DEFAULT ? store_modules_list.LIST_IDS.DEFAULT : currentPlaylistId.value === "favorite" || currentPlaylistId.value === store_modules_list.LIST_IDS.LOVE ? store_modules_list.LIST_IDS.LOVE : currentPlaylistId.value;
      store_modules_list.listStore.setPlayerListId(listId);
      playSongWithIndex(index);
    };
    const locateCurrentSong = async () => {
      var _a;
      console.log("[locateCurrentSong] ========== 开始定位当前歌曲 ==========");
      const playIndex = store_modules_list.listStore.state.playInfo.playIndex;
      const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      console.log("[locateCurrentSong] 播放索引:", playIndex, "列表ID:", playerListId);
      console.log("[locateCurrentSong] 当前列表歌曲数:", songs.value.length);
      const currentListId = currentPlaylistId.value === "trial" || currentPlaylistId.value === store_modules_list.LIST_IDS.DEFAULT ? store_modules_list.LIST_IDS.DEFAULT : currentPlaylistId.value === "favorite" || currentPlaylistId.value === store_modules_list.LIST_IDS.LOVE ? store_modules_list.LIST_IDS.LOVE : currentPlaylistId.value;
      const isPlayingImportedList = playerListId === store_modules_list.LIST_IDS.TEMP && tempListMeta.id === currentPlaylistId.value;
      if (playerListId !== currentListId && !isPlayingImportedList) {
        console.warn("[locateCurrentSong] 当前没有播放本列表的歌曲");
        common_vendor.index.showToast({ title: "当前没有播放本列表的歌曲", icon: "none" });
        return;
      }
      if (playIndex < 0 || playIndex >= songs.value.length) {
        console.warn("[locateCurrentSong] 播放索引无效:", playIndex, "列表长度:", songs.value.length);
        common_vendor.index.showToast({ title: "无法定位当前歌曲", icon: "none" });
        return;
      }
      console.log("[locateCurrentSong] 目标歌曲索引:", playIndex, "名称:", (_a = songs.value[playIndex]) == null ? void 0 : _a.name);
      if (virtualListRef.value) {
        console.log("[locateCurrentSong] 使用虚拟列表 scrollToIndex:", playIndex);
        virtualListRef.value.scrollToIndex(playIndex, true);
      } else {
        const targetId = `virtual-item-${playIndex}`;
        scrollIntoViewId.value = "";
        await common_vendor.nextTick$1();
        scrollIntoViewId.value = targetId;
        console.log("[locateCurrentSong] 降级使用 scrollIntoViewId:", targetId);
      }
      common_vendor.index.showToast({
        title: `已定位到第${playIndex + 1}首`,
        icon: "none",
        duration: 1500
      });
      console.log("[locateCurrentSong] ========== 定位完成 ==========");
    };
    const showSongMenu = (song, index) => {
      selectedSong.value = song;
      selectedSongIndex.value = index;
      showSongMenuFlag.value = true;
    };
    const closeSongMenu = (clearSelection = true) => {
      showSongMenuFlag.value = false;
      if (clearSelection) {
        selectedSong.value = null;
        selectedSongIndex.value = -1;
      }
    };
    const showPlaylistContextMenu = (playlist, index, type = "custom") => {
      console.log("[showPlaylistContextMenu] 显示歌单菜单，歌单:", playlist.name, "ID:", playlist.id, "类型:", type);
      console.log("[showPlaylistContextMenu] 歌单完整信息:", JSON.stringify(playlist));
      console.log("[showPlaylistContextMenu] canAutoUpdate:", playlist.canAutoUpdate, "isFromImport:", playlist.isFromImport);
      menuPlaylistInfo.value = playlist;
      menuPlaylistIndex.value = index;
      menuPlaylistType.value = type;
      showPlaylistMenu.value = true;
    };
    const closePlaylistMenu = () => {
      showPlaylistMenu.value = false;
      menuPlaylistInfo.value = null;
      menuPlaylistIndex.value = -1;
      menuPlaylistType.value = "custom";
    };
    const renamePlaylist = () => {
      if (!menuPlaylistInfo.value)
        return;
      const currentInfo = menuPlaylistInfo.value;
      const currentType = menuPlaylistType.value;
      const currentName = currentInfo.name;
      const currentId = currentInfo.id;
      const currentCoverImgUrl = currentInfo.coverImgUrl || "";
      closePlaylistMenu();
      common_vendor.index.showModal({
        title: "重命名歌单",
        editable: true,
        placeholderText: "请输入新名称",
        success: (editRes) => {
          if (editRes.confirm && editRes.content) {
            const newName = editRes.content.trim();
            if (!newName) {
              common_vendor.index.showToast({ title: "名称不能为空", icon: "none" });
              return;
            }
            if (newName.length > 100) {
              common_vendor.index.showToast({ title: "名称不能超过100个字符", icon: "none" });
              return;
            }
            if (newName === currentName) {
              common_vendor.index.showToast({ title: "名称未改变", icon: "none" });
              return;
            }
            console.log("[renamePlaylist] 重命名歌单:", currentName, "->", newName, "类型:", currentType);
            if (currentType === "imported") {
              const index = importedPlaylists.value.findIndex((p) => p.id === currentId);
              if (index > -1) {
                importedPlaylists.value[index] = {
                  ...importedPlaylists.value[index],
                  name: newName
                };
                common_vendor.index.setStorageSync("imported_playlists", importedPlaylists.value);
                console.log("[renamePlaylist] 导入歌单已重命名并保存");
                importedPlaylists.value = [...importedPlaylists.value];
              }
            } else {
              store_modules_list.listStore.updateUserList([{
                id: currentId,
                name: newName,
                coverImgUrl: currentCoverImgUrl
              }]);
              refreshCustomPlaylists();
            }
            common_vendor.index.showToast({ title: "重命名成功", icon: "success" });
          }
        }
      });
    };
    const removePlaylist = () => {
      if (!menuPlaylistInfo.value)
        return;
      const isImported = menuPlaylistType.value === "imported";
      common_vendor.index.showModal({
        title: "提示",
        content: `确定删除歌单"${menuPlaylistInfo.value.name}"吗？${isImported ? "将从导入列表中移除，歌曲不会删除。" : "删除后无法恢复。"}`,
        confirmText: "删除",
        confirmColor: "#ff4d4f",
        success: (res) => {
          if (res.confirm) {
            console.log("[removePlaylist] 开始移除歌单:", menuPlaylistInfo.value.name, "ID:", menuPlaylistInfo.value.id, "类型:", menuPlaylistType.value);
            const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
            const isPlayingThisPlaylist = playerListId === menuPlaylistInfo.value.id;
            if (currentPlaylistId.value === menuPlaylistInfo.value.id) {
              console.log("[removePlaylist] 当前正在查看该歌单，清空列表并切换到试听列表");
              songs.value = [];
              currentPlaylistId.value = "";
              selectPlaylist("trial");
            }
            if (isPlayingThisPlaylist) {
              console.log("[removePlaylist] 播放器正在播放该歌单，更新播放列表");
              store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.DEFAULT);
              const trialList = store_modules_list.listStore.state.defaultList.list;
              if (trialList.length > 0) {
                store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.DEFAULT, trialList[0], false);
              } else {
                store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.DEFAULT, null, false);
              }
            }
            if (isImported) {
              console.log("[removePlaylist] 从导入歌单中移除");
              const index = importedPlaylists.value.findIndex((p) => p.id === menuPlaylistInfo.value.id);
              if (index > -1) {
                importedPlaylists.value.splice(index, 1);
                common_vendor.index.setStorageSync("imported_playlists", importedPlaylists.value);
                console.log("[removePlaylist] 已从导入列表移除并保存，本地存储剩余:", importedPlaylists.value.length, "个");
                importedPlaylists.value = [...importedPlaylists.value];
              }
            } else {
              console.log("[removePlaylist] 从自定义歌单中移除");
              store_modules_list.listStore.removeUserList([menuPlaylistInfo.value.id]);
              refreshCustomPlaylists();
            }
            closePlaylistMenu();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          }
        }
      });
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
          ar: song.ar || (song.singer ? song.singer.split("/").map((name) => ({ name })) : []),
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
    const syncPlaylist = () => {
      if (!menuPlaylistInfo.value || menuPlaylistType.value !== "imported")
        return;
      const currentPlaylist2 = menuPlaylistInfo.value;
      if (!currentPlaylist2.link) {
        common_vendor.index.showToast({
          title: "该歌单没有链接信息，无法同步",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "同步歌单",
        content: `确定要同步歌单"${currentPlaylist2.name}"吗？

同步操作将会：
• 重新从源头获取最新歌单内容
• 完全覆盖当前歌单
• 清除所有播放进度和收藏状态

请确保您当前的网络连接正常。`,
        confirmText: "确定同步",
        cancelText: "取消",
        success: async (res) => {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          if (res.confirm) {
            console.log("[syncPlaylist] 开始同步歌单:", currentPlaylist2.name, "链接:", currentPlaylist2.link, "平台:", currentPlaylist2.source);
            try {
              common_vendor.index.showLoading({ title: "正在同步..." });
              let result;
              const shouldUseBackend = currentPlaylist2.source === "tx";
              if (shouldUseBackend) {
                console.log("[syncPlaylist] QQ音乐使用后端接口");
                result = await utils_api_songlist.getListDetail(currentPlaylist2.source, currentPlaylist2.link, 1);
              } else {
                console.log("[syncPlaylist] 使用前端直接API:", currentPlaylist2.source);
                let targetPlaylistId = currentPlaylist2.link;
                if (/^https?:\/\//.test(currentPlaylist2.link)) {
                  let match = currentPlaylist2.link.match(/[?&]id=(\d+)/);
                  if (match) {
                    targetPlaylistId = match[1];
                    console.log("[syncPlaylist] 从URL查询参数解析出ID:", targetPlaylistId);
                  } else {
                    match = currentPlaylist2.link.match(/\/playlist(?:_detail)?\/(\d+)/);
                    if (match) {
                      targetPlaylistId = match[1];
                      console.log("[syncPlaylist] 从URL路径解析出ID:", targetPlaylistId);
                    } else if (currentPlaylist2.source === "mg" && currentPlaylist2.link.includes("c.migu.cn")) {
                      console.log("[syncPlaylist] 检测到咪咕短链接，尝试获取真实URL...");
                      try {
                        const res2 = await common_vendor.index.request({
                          url: currentPlaylist2.link,
                          method: "HEAD",
                          header: {
                            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15"
                          }
                        });
                        const location = ((_a = res2.header) == null ? void 0 : _a.Location) || ((_b = res2.header) == null ? void 0 : _b.location);
                        if (location) {
                          console.log("[syncPlaylist] 咪咕短链接重定向到:", location);
                          const idMatch = location.match(/[?&]id=(\d+)/);
                          if (idMatch) {
                            targetPlaylistId = idMatch[1];
                            console.log("[syncPlaylist] 从咪咕重定向URL解析出ID:", targetPlaylistId);
                          }
                        }
                      } catch (err) {
                        console.error("[syncPlaylist] 获取咪咕短链接失败:", err);
                      }
                    }
                  }
                } else {
                  console.log("[syncPlaylist] 直接使用作为ID:", targetPlaylistId);
                }
                result = await utils_api_songlistDirect.getListDetailDirect(currentPlaylist2.source, targetPlaylistId, 1);
              }
              const updatedSongs = result.list || [];
              if (updatedSongs.length === 0) {
                throw new Error("获取到0首歌曲，可能歌单已删除或无权限访问");
              }
              const playlistIndex = importedPlaylists.value.findIndex((p) => p.id === currentPlaylist2.id);
              if (playlistIndex > -1) {
                const simplifiedSongs = simplifySongs(updatedSongs);
                importedPlaylists.value[playlistIndex].songs = simplifiedSongs;
                importedPlaylists.value[playlistIndex].trackCount = updatedSongs.length;
                importedPlaylists.value[playlistIndex].coverImgUrl = ((_c = result.info) == null ? void 0 : _c.img) || result.coverImgUrl || currentPlaylist2.coverImgUrl;
                importedPlaylists.value[playlistIndex].name = ((_d = result.info) == null ? void 0 : _d.name) || result.name || currentPlaylist2.name;
                if (((_e = result.info) == null ? void 0 : _e.desc) || result.desc) {
                  importedPlaylists.value[playlistIndex].desc = ((_f = result.info) == null ? void 0 : _f.desc) || result.desc;
                }
                common_vendor.index.setStorageSync("imported_playlists", importedPlaylists.value);
                console.log("[syncPlaylist] 歌单已更新并保存，歌曲数:", updatedSongs.length);
                importedPlaylists.value = [...importedPlaylists.value];
                if (currentPlaylistId.value === currentPlaylist2.id) {
                  songs.value = [...updatedSongs];
                  currentPlaylist2.name = ((_g = result.info) == null ? void 0 : _g.name) || result.name || currentPlaylist2.name;
                  currentPlaylist2.coverImgUrl = ((_h = result.info) == null ? void 0 : _h.img) || result.coverImgUrl || currentPlaylist2.coverImgUrl;
                  currentPlaylist2.trackCount = updatedSongs.length;
                  console.log("[syncPlaylist] 当前歌单已更新，歌曲数:", updatedSongs.length);
                }
              }
              closePlaylistMenu();
              common_vendor.index.showToast({
                title: `同步成功（${updatedSongs.length}首）`,
                icon: "success"
              });
            } catch (error) {
              console.error("[syncPlaylist] 同步失败:", error);
              let errorMessage = "同步失败";
              if (error.message) {
                if (error.message.includes("404") || error.message.includes("not found")) {
                  errorMessage = "歌单不存在或已删除";
                } else if (error.message.includes("403") || error.message.includes("forbidden")) {
                  errorMessage = "没有权限访问该歌单";
                } else if (error.message.includes("network") || error.message.includes("网络")) {
                  errorMessage = "网络连接失败";
                } else {
                  errorMessage = `同步失败: ${error.message}`;
                }
              }
              common_vendor.index.showToast({
                title: errorMessage,
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const toggleAutoUpdate = () => {
      if (!menuPlaylistInfo.value || menuPlaylistType.value !== "imported")
        return;
      const currentPlaylist2 = menuPlaylistInfo.value;
      const newAutoUpdateState = !currentPlaylist2.autoUpdate;
      const playlistIndex = importedPlaylists.value.findIndex((p) => p.id === currentPlaylist2.id);
      if (playlistIndex > -1) {
        importedPlaylists.value[playlistIndex].autoUpdate = newAutoUpdateState;
        common_vendor.index.setStorageSync("imported_playlists", importedPlaylists.value);
        console.log("[toggleAutoUpdate] 自动更新状态已更新:", newAutoUpdateState);
        importedPlaylists.value = [...importedPlaylists.value];
        menuPlaylistInfo.value.autoUpdate = newAutoUpdateState;
        common_vendor.index.showToast({
          title: newAutoUpdateState ? "已开启自动更新" : "已关闭自动更新",
          icon: "success"
        });
      }
    };
    const batchAutoUpdatePlaylists = async () => {
      console.log("[batchAutoUpdatePlaylists] 开始批量自动更新检查");
      const importedList = importedPlaylists.value;
      const autoUpdatePlaylists = importedList.filter((p) => p.autoUpdate && p.canAutoUpdate);
      console.log("[batchAutoUpdatePlaylists] 开启自动更新的歌单数量:", autoUpdatePlaylists.length);
      if (autoUpdatePlaylists.length === 0) {
        console.log("[batchAutoUpdatePlaylists] 没有开启自动更新的歌单，跳过");
        return;
      }
      for (const playlist of autoUpdatePlaylists) {
        if (autoUpdatedPlaylists.value.has(playlist.id)) {
          console.log("[batchAutoUpdatePlaylists] 歌单已更新过，跳过:", playlist.name);
          continue;
        }
        console.log("[batchAutoUpdatePlaylists] 开始自动更新歌单:", playlist.name);
        showAutoUpdateToast.value = true;
        autoUpdatePlaylistName.value = playlist.name;
        try {
          autoUpdatedPlaylists.value.add(playlist.id);
          await autoUpdatePlaylist(playlist, false);
          console.log("[batchAutoUpdatePlaylists] 歌单自动更新成功:", playlist.name);
        } catch (error) {
          console.error("[batchAutoUpdatePlaylists] 歌单自动更新失败:", playlist.name, error);
          autoUpdatedPlaylists.value.delete(playlist.id);
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      console.log("[batchAutoUpdatePlaylists] 批量自动更新完成");
      showAutoUpdateToast.value = false;
      autoUpdatePlaylistName.value = "";
    };
    const autoUpdatePlaylist = async (playlistData, showToast = true) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      console.log("[autoUpdatePlaylist] 开始自动更新歌单:", playlistData.name, "链接:", playlistData.link, "平台:", playlistData.source);
      try {
        let result;
        const shouldUseBackend = playlistData.source === "tx";
        if (shouldUseBackend) {
          console.log("[autoUpdatePlaylist] QQ音乐使用后端接口");
          result = await utils_api_songlist.getListDetail(playlistData.source, playlistData.link, 1);
        } else {
          console.log("[autoUpdatePlaylist] 使用前端直接API:", playlistData.source);
          let targetPlaylistId = playlistData.link;
          if (/^https?:\/\//.test(playlistData.link)) {
            let match = playlistData.link.match(/[?&]id=(\d+)/);
            if (match) {
              targetPlaylistId = match[1];
              console.log("[autoUpdatePlaylist] 从URL查询参数解析出ID:", targetPlaylistId);
            } else {
              match = playlistData.link.match(/\/playlist(?:_detail)?\/(\d+)/);
              if (match) {
                targetPlaylistId = match[1];
                console.log("[autoUpdatePlaylist] 从URL路径解析出ID:", targetPlaylistId);
              } else if (playlistData.source === "mg" && playlistData.link.includes("c.migu.cn")) {
                console.log("[autoUpdatePlaylist] 检测到咪咕短链接，尝试获取真实URL...");
                try {
                  const res = await common_vendor.index.request({
                    url: playlistData.link,
                    method: "HEAD",
                    header: {
                      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15"
                    }
                  });
                  const location = ((_a = res.header) == null ? void 0 : _a.Location) || ((_b = res.header) == null ? void 0 : _b.location);
                  if (location) {
                    console.log("[autoUpdatePlaylist] 咪咕短链接重定向到:", location);
                    const idMatch = location.match(/[?&]id=(\d+)/);
                    if (idMatch) {
                      targetPlaylistId = idMatch[1];
                      console.log("[autoUpdatePlaylist] 从咪咕重定向URL解析出ID:", targetPlaylistId);
                    }
                  }
                } catch (err) {
                  console.error("[autoUpdatePlaylist] 获取咪咕短链接失败:", err);
                }
              }
            }
          } else {
            console.log("[autoUpdatePlaylist] 直接使用作为ID:", targetPlaylistId);
          }
          result = await utils_api_songlistDirect.getListDetailDirect(playlistData.source, targetPlaylistId, 1);
        }
        const updatedSongs = result.list || [];
        if (updatedSongs.length === 0) {
          throw new Error("获取到0首歌曲，可能歌单已删除或无权限访问");
        }
        const playlistIndex = importedPlaylists.value.findIndex((p) => p.id === playlistData.id);
        if (playlistIndex > -1) {
          const simplifiedSongs = simplifySongs(updatedSongs);
          importedPlaylists.value[playlistIndex].songs = simplifiedSongs;
          importedPlaylists.value[playlistIndex].trackCount = updatedSongs.length;
          importedPlaylists.value[playlistIndex].coverImgUrl = ((_c = result.info) == null ? void 0 : _c.img) || result.coverImgUrl || playlistData.coverImgUrl;
          importedPlaylists.value[playlistIndex].name = ((_d = result.info) == null ? void 0 : _d.name) || result.name || playlistData.name;
          if (((_e = result.info) == null ? void 0 : _e.desc) || result.desc) {
            importedPlaylists.value[playlistIndex].desc = ((_f = result.info) == null ? void 0 : _f.desc) || result.desc;
          }
          common_vendor.index.setStorageSync("imported_playlists", importedPlaylists.value);
          console.log("[autoUpdatePlaylist] 歌单已自动更新并保存，歌曲数:", updatedSongs.length);
          importedPlaylists.value = [...importedPlaylists.value];
          if (currentPlaylistId.value === playlistData.id) {
            songs.value = [...simplifiedSongs];
            currentPlaylist.name = ((_g = result.info) == null ? void 0 : _g.name) || result.name || playlistData.name;
            currentPlaylist.coverImgUrl = ((_h = result.info) == null ? void 0 : _h.img) || result.coverImgUrl || playlistData.coverImgUrl;
            currentPlaylist.trackCount = updatedSongs.length;
            console.log("[autoUpdatePlaylist] 当前歌单已自动更新，歌曲数:", updatedSongs.length);
          } else {
            console.log("[autoUpdatePlaylist] 歌单在后台更新完成，当前显示的是其他歌单，不更新页面");
          }
          if (showToast) {
            common_vendor.index.showToast({
              title: `自动更新成功（${updatedSongs.length}首）`,
              icon: "success"
            });
          }
          return updatedSongs;
        }
      } catch (error) {
        console.error("[autoUpdatePlaylist] 自动更新失败:", error);
        const playlistSongs = playlistData.songs || [];
        songs.value = [...playlistSongs];
        currentPlaylist.name = playlistData.name;
        currentPlaylist.coverImgUrl = playlistData.coverImgUrl;
        currentPlaylist.trackCount = playlistSongs.length;
        return playlistSongs;
      } finally {
        showAutoUpdateToast.value = false;
      }
    };
    const removeSongFromList = () => {
      if (!selectedSong.value)
        return;
      common_vendor.index.showModal({
        title: "提示",
        content: "确定从当前列表移除这首歌曲吗？",
        success: (res) => {
          if (res.confirm) {
            console.log("[removeSongFromList] 开始移除歌曲，歌单ID:", currentPlaylistId.value, "歌曲ID:", selectedSong.value.id);
            if (currentPlaylistId.value === "trial" || currentPlaylistId.value === store_modules_list.LIST_IDS.DEFAULT) {
              console.log("[removeSongFromList] 从试听列表移除");
              store_modules_list.listStore.removeFromDefaultList(selectedSong.value.id);
            } else if (currentPlaylistId.value === "favorite" || currentPlaylistId.value === store_modules_list.LIST_IDS.LOVE) {
              console.log("[removeSongFromList] 从收藏列表移除（取消收藏）");
              store_modules_list.listStore.removeFromLoveList(selectedSong.value.id);
            } else if (currentPlaylistId.value.startsWith("custom_") || currentPlaylistId.value.startsWith("userlist_")) {
              console.log("[removeSongFromList] 从自定义歌单移除");
              const userList = store_modules_list.listStore.state.userLists.find((l) => l.id === currentPlaylistId.value);
              if (userList) {
                const index = userList.list.findIndex((s) => s.id === selectedSong.value.id);
                if (index > -1) {
                  userList.list.splice(index, 1);
                  console.log("[removeSongFromList] 自定义歌单移除成功，保存数据");
                  store_modules_list.listStore.saveUserLists();
                }
              }
            } else {
              console.log("[removeSongFromList] 从导入的歌单移除，歌单ID:", currentPlaylistId.value);
              const index = songs.value.findIndex((s) => s.id === selectedSong.value.id);
              if (index > -1) {
                songs.value.splice(index, 1);
                console.log("[removeSongFromList] 导入歌单移除成功，剩余歌曲:", songs.value.length);
                saveImportedPlaylist();
              }
            }
            try {
              const deletedSongs = common_vendor.index.getStorageSync("deleted_songs") || [];
              const existingIndex = deletedSongs.findIndex((s) => s.id === selectedSong.value.id);
              if (existingIndex === -1) {
                deletedSongs.unshift(selectedSong.value);
                if (deletedSongs.length > 200) {
                  deletedSongs.pop();
                }
                common_vendor.index.setStorageSync("deleted_songs", deletedSongs);
                console.log("[removeSongFromList] 已记录删除的歌曲，当前删除记录数:", deletedSongs.length);
              }
            } catch (e) {
              console.error("[removeSongFromList] 记录删除歌曲失败:", e);
            }
            fetchSongs();
            common_vendor.index.showToast({
              title: "已移除",
              icon: "success"
            });
          }
          closeSongMenu();
        }
      });
    };
    const formatSingerName = (singers, nameKey = "name", join = "、") => {
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
    const toggleMusicSource = () => {
      var _a;
      if (!selectedSong.value)
        return;
      console.log("[toggleMusicSource] 打开歌曲换源弹窗，歌曲:", selectedSong.value.name);
      console.log("[toggleMusicSource] 歌曲数据:", JSON.stringify(selectedSong.value));
      const songData = { ...selectedSong.value };
      toggleOriginalSong.value = songData;
      console.log("[toggleMusicSource] toggleOriginalSong已设置:", (_a = toggleOriginalSong.value) == null ? void 0 : _a.name);
      closeSongMenu(false);
      showMusicToggleModal.value = true;
    };
    const closeMusicToggleModal = () => {
      showMusicToggleModal.value = false;
      toggleOriginalSong.value = null;
    };
    const handleToggleConfirm = (data) => {
      const { originalSong, newSong, listId } = data;
      console.log("[handleToggleConfirm] 确认换源:", {
        from: originalSong.name,
        to: newSong.name,
        listId
      });
      const songIndex = songs.value.findIndex((s) => s.id === originalSong.id);
      if (songIndex === -1) {
        console.error("[handleToggleConfirm] 未找到原歌曲");
        common_vendor.index.showToast({
          title: "换源失败：未找到原歌曲",
          icon: "none"
        });
        return;
      }
      const songIdStr = String(originalSong.id || "");
      const songKey = songIdStr.replace(/^(tx|wy|kg|kw|mg)_/, "") || songIdStr;
      console.log("[handleToggleConfirm] 保存换源信息, 原始歌曲ID:", songKey, "原始source:", originalSong.source, "新source:", newSong.source);
      utils_musicSwitchSourceStorage.saveMusicSwitchSource(songKey, {
        originalSource: originalSong.source,
        newSource: newSong.source,
        newSongId: newSong.id,
        newSongName: newSong.name,
        newSongSinger: newSong.singer,
        url: newSong.url || newSong.playUrl || "",
        quality: newSong.quality || "standard"
      });
      console.log("[handleToggleConfirm] 已保存换源信息到本地存储, 新歌曲ID:", newSong.id);
      const playerListId = store_modules_list.listStore.state.playInfo.playerListId;
      const playIndex = store_modules_list.listStore.state.playInfo.playIndex;
      if (playIndex === songIndex && playerListId === listId) {
        console.log("[handleToggleConfirm] 更新播放器中的歌曲信息");
        store_modules_player.playerStore.updateCurrentSong(newSong);
      }
      common_vendor.index.showToast({
        title: "换源成功",
        icon: "success"
      });
    };
    const handleTogglePreview = async (song) => {
      var _a;
      console.log("[handleTogglePreview] 预览歌曲:", song.name);
      console.log("[handleTogglePreview] 歌曲信息:", JSON.stringify(song));
      showLoadingToast.value = true;
      loadingToastTitle.value = "加载中";
      loadingToastSubtitle.value = "获取播放链接";
      try {
        const source = song.sourceId || song.source || "tx";
        console.log("[handleTogglePreview] 音源:", source);
        const songForRequest = {
          ...song,
          source
        };
        const requestData = utils_musicParams.buildMusicRequestParams(songForRequest, "320k");
        if (!requestData) {
          throw new Error("构建请求参数失败");
        }
        console.log("[handleTogglePreview] 请求参数:", requestData);
        const musicUrlData = await utils_api_music.getMusicUrl(requestData);
        console.log("[handleTogglePreview] 获取到URL:", musicUrlData.url);
        const updatedSong = {
          ...song,
          url: musicUrlData.url,
          playUrl: musicUrlData.url,
          lyric: musicUrlData.lyric || "",
          tlyric: musicUrlData.tlyric || "",
          rlyric: musicUrlData.rlyric || "",
          lxlyric: musicUrlData.lxlyric || ""
        };
        if (musicUrlData.fallback && musicUrlData.fallback.toggled) {
          updatedSong.source = musicUrlData.fallback.newSource;
          updatedSong._toggleMusicInfo = {
            originalSource: musicUrlData.fallback.originalSource,
            newSource: musicUrlData.fallback.newSource,
            matchedSong: musicUrlData.fallback.matchedSong,
            toggleTime: Date.now()
          };
          if (musicUrlData.fallback.matchedSong) {
            updatedSong.songmid = musicUrlData.fallback.matchedSong.songmid || song.songmid;
            updatedSong.hash = musicUrlData.fallback.matchedSong.hash || song.hash;
            updatedSong.copyrightId = musicUrlData.fallback.matchedSong.copyrightId || song.copyrightId;
          }
        }
        const cacheSource = ((_a = musicUrlData.fallback) == null ? void 0 : _a.newSource) || source;
        await utils_musicUrlCache.setCachedMusicUrl(song.id, "320k", musicUrlData.url, cacheSource);
        console.log("[handleTogglePreview] 播放URL已缓存:", song.id, "source:", cacheSource);
        store_modules_player.playerStore.playSong(updatedSong);
        showLoadingToast.value = false;
        common_vendor.index.showToast({
          title: `正在播放: ${song.name}`,
          icon: "none",
          duration: 2e3
        });
      } catch (error) {
        console.error("[handleTogglePreview] 播放失败:", error);
        showLoadingToast.value = false;
        common_vendor.index.showToast({
          title: "播放失败: " + (error.message || "未知错误"),
          icon: "none",
          duration: 2e3
        });
      }
    };
    const closeImportModal = () => {
      showImportModal.value = false;
      importLink.value = "";
    };
    const confirmImport = () => {
      const link = importLink.value.trim();
      if (!link) {
        common_vendor.index.showToast({
          title: "请输入歌单链接",
          icon: "none"
        });
        return;
      }
      showImportModal.value = false;
      common_vendor.index.navigateTo({
        url: `/pages/sharelist/index?source=${currentImportSource.value}&link=${encodeURIComponent(link)}&platform=${encodeURIComponent(currentImportPlatform.value)}&preview=true&from=import`
      });
    };
    const loadPlaylistData = async () => {
      console.log("[Playlist] ====== loadPlaylistData 开始 ======");
      isDataLoaded.value = true;
      const importedList = common_vendor.index.getStorageSync("imported_playlists") || [];
      importedPlaylists.value = importedList;
      console.log("[Playlist] 已导入歌单数量:", importedList.length);
      const prevSelectId = getListPrevSelectId();
      console.log("[Playlist] 上次选择的歌单ID:", prevSelectId);
      let restoredFromPrevSelect = false;
      if (prevSelectId) {
        console.log("[Playlist] 尝试恢复上次选择的歌单:", prevSelectId);
        if (prevSelectId === "trial" || prevSelectId === store_modules_list.LIST_IDS.DEFAULT) {
          console.log("[Playlist] 恢复为试听列表");
          currentPlaylistId.value = "trial";
          currentPlaylist.id = store_modules_list.LIST_IDS.DEFAULT;
          currentPlaylist.name = "试听列表";
          currentPlaylist.description = "试听列表，存放您最近试听的歌曲";
          listSource.value = "";
          songs.value = [...store_modules_list.listStore.state.defaultList.list];
          restoredFromPrevSelect = true;
        } else if (prevSelectId === "favorite" || prevSelectId === store_modules_list.LIST_IDS.LOVE) {
          console.log("[Playlist] 恢复为我的收藏");
          currentPlaylistId.value = "favorite";
          currentPlaylist.id = store_modules_list.LIST_IDS.LOVE;
          currentPlaylist.name = "我的收藏";
          currentPlaylist.description = "您收藏的歌曲";
          listSource.value = "";
          songs.value = [...store_modules_list.listStore.state.loveList.list];
          restoredFromPrevSelect = true;
        } else if (prevSelectId.startsWith("custom_") || prevSelectId.startsWith("userlist_")) {
          const userList = store_modules_list.listStore.state.userLists.find((l) => l.id === prevSelectId);
          if (userList) {
            console.log("[Playlist] 恢复自定义歌单:", userList.name);
            currentPlaylistId.value = userList.id;
            currentPlaylist.id = userList.id;
            currentPlaylist.name = userList.name;
            currentPlaylist.coverImgUrl = userList.coverImgUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`;
            currentPlaylist.description = "自定义歌单";
            listSource.value = "custom";
            songs.value = [...userList.list || []];
            restoredFromPrevSelect = true;
          }
        } else {
          const importedPlaylist = importedList.find((p) => p.id === prevSelectId);
          if (importedPlaylist) {
            console.log("[Playlist] 恢复导入歌单:", importedPlaylist.name);
            currentPlaylistId.value = importedPlaylist.id;
            currentPlaylist.id = importedPlaylist.id;
            currentPlaylist.name = importedPlaylist.name;
            currentPlaylist.coverImgUrl = importedPlaylist.coverImgUrl;
            currentPlaylist.description = `从${importedPlaylist.platform}导入的歌单`;
            listSource.value = importedPlaylist.source || "";
            if (importedPlaylist.autoUpdate && importedPlaylist.link && !autoUpdatedPlaylists.value.has(importedPlaylist.id)) {
              console.log("[Playlist] 检测到自动更新已开启，开始自动同步歌单:", importedPlaylist.name);
              autoUpdatedPlaylists.value.add(importedPlaylist.id);
              const oldSongs = importedPlaylist.songs || [];
              if (oldSongs.length > 600) {
                showLoadingToast.value = true;
                loadingToastTitle.value = "正在加载";
                loadingToastSubtitle.value = `${oldSongs.length}首歌曲`;
              }
              autoUpdatePlaylist(importedPlaylist, false).then((updatedSongs) => {
                console.log("[Playlist] 自动更新完成，更新歌曲列表");
                isPlaylistLoading.value = false;
                if (updatedSongs && updatedSongs.length > 0) {
                  setSongList(updatedSongs);
                  showLoadingToast.value = false;
                } else {
                  showLoadingToast.value = false;
                }
                batchAutoUpdatePlaylists();
              });
              songs.value = [...oldSongs];
              restoredFromPrevSelect = true;
              if (oldSongs.length > 600) {
                isPlaylistLoading.value = true;
              }
            } else {
              const playlistSongs = importedPlaylist.songs || [];
              setSongList(playlistSongs);
              restoredFromPrevSelect = true;
              isPlaylistLoading.value = false;
              batchAutoUpdatePlaylists();
            }
          }
        }
      }
      if (isPlaylistLoading.value) {
        console.log("[Playlist] 歌单正在加载中，等待加载完成");
        return;
      }
      if (restoredFromPrevSelect) {
        console.log("[Playlist] 从上次选择的歌单恢复成功，currentPlaylistId:", currentPlaylistId.value);
        console.log("[Playlist] ====== loadPlaylistData 结束 ======");
        batchAutoUpdatePlaylists();
        return;
      }
      try {
        const playInfo = await utils_playInfoStorage.getPlayInfo();
        console.log("[Playlist] 获取到 playInfo:", playInfo);
        let restoredFromPlayInfo = false;
        if (playInfo && playInfo.listId && playInfo.index >= 0) {
          console.log("[Playlist] 尝试恢复上次播放状态 - listId:", playInfo.listId, "index:", playInfo.index);
          if (playInfo.listId === store_modules_list.LIST_IDS.DEFAULT || playInfo.listId === "trial") {
            console.log("[Playlist] 恢复为试听列表");
            currentPlaylistId.value = "trial";
            currentPlaylist.id = store_modules_list.LIST_IDS.DEFAULT;
            currentPlaylist.name = "试听列表";
            currentPlaylist.description = "试听列表，存放您最近试听的歌曲";
            listSource.value = "";
            songs.value = [...store_modules_list.listStore.state.defaultList.list];
            restoredFromPlayInfo = true;
          } else if (playInfo.listId === store_modules_list.LIST_IDS.LOVE || playInfo.listId === "favorite") {
            console.log("[Playlist] 恢复为我的收藏");
            currentPlaylistId.value = "favorite";
            currentPlaylist.id = store_modules_list.LIST_IDS.LOVE;
            currentPlaylist.name = "我的收藏";
            currentPlaylist.description = "您收藏的歌曲";
            listSource.value = "";
            songs.value = [...store_modules_list.listStore.state.loveList.list];
            restoredFromPlayInfo = true;
          } else if (playInfo.listId === store_modules_list.LIST_IDS.TEMP) {
            console.log("[Playlist] 尝试恢复临时列表，playInfo.meta:", JSON.stringify(playInfo.meta));
            if (playInfo.meta && playInfo.meta.id) {
              const importedPlaylist = importedList.find((p) => p.id === playInfo.meta.id);
              if (importedPlaylist) {
                console.log("[Playlist] 从导入歌单中找到临时列表对应的歌单:", importedPlaylist.name);
                currentPlaylistId.value = importedPlaylist.id;
                currentPlaylist.id = importedPlaylist.id;
                currentPlaylist.name = importedPlaylist.name;
                currentPlaylist.coverImgUrl = importedPlaylist.coverImgUrl;
                currentPlaylist.description = `从${importedPlaylist.platform}导入的歌单`;
                listSource.value = importedPlaylist.source || "";
                if (importedPlaylist.autoUpdate && importedPlaylist.link && !autoUpdatedPlaylists.value.has(importedPlaylist.id)) {
                  console.log("[Playlist] 检测到自动更新已开启，开始自动同步歌单:", importedPlaylist.name);
                  autoUpdatedPlaylists.value.add(importedPlaylist.id);
                  autoUpdatePlaylist(importedPlaylist, false);
                  return;
                }
                const playlistSongs = importedPlaylist.songs || [];
                setSongList(playlistSongs);
                restoredFromPlayInfo = true;
              }
            }
          } else {
            console.log("[Playlist] 尝试恢复歌单，listId:", playInfo.listId);
            const importedPlaylist = importedList.find((p) => p.id === playInfo.listId);
            console.log("[Playlist] 在已导入歌单中查找:", playInfo.listId, "结果:", importedPlaylist ? "找到" : "未找到");
            if (importedPlaylist) {
              console.log("[Playlist] 找到匹配的导入歌单:", importedPlaylist.name);
              currentPlaylistId.value = importedPlaylist.id;
              currentPlaylist.id = importedPlaylist.id;
              currentPlaylist.name = importedPlaylist.name;
              currentPlaylist.coverImgUrl = importedPlaylist.coverImgUrl;
              currentPlaylist.description = `从${importedPlaylist.platform}导入的歌单`;
              listSource.value = importedPlaylist.source || "";
              if (importedPlaylist.autoUpdate && importedPlaylist.link && !autoUpdatedPlaylists.value.has(importedPlaylist.id)) {
                console.log("[Playlist] 检测到自动更新已开启，开始自动同步歌单:", importedPlaylist.name);
                autoUpdatedPlaylists.value.add(importedPlaylist.id);
                autoUpdatePlaylist(importedPlaylist, false);
                return;
              }
              const playlistSongs = importedPlaylist.songs || [];
              setSongList(playlistSongs);
              restoredFromPlayInfo = true;
            } else {
              const customPlaylist = store_modules_list.listStore.state.userLists.find((l) => l.id === playInfo.listId);
              if (customPlaylist) {
                console.log("[Playlist] 找到匹配的自定义歌单:", customPlaylist.name);
                currentPlaylistId.value = customPlaylist.id;
                currentPlaylist.id = customPlaylist.id;
                currentPlaylist.name = customPlaylist.name;
                currentPlaylist.coverImgUrl = customPlaylist.coverImgUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`;
                currentPlaylist.description = "自定义歌单";
                listSource.value = "custom";
                const playlistSongs = customPlaylist.list || [];
                setSongList(playlistSongs);
                restoredFromPlayInfo = true;
              }
            }
          }
        }
        if (!restoredFromPlayInfo) {
          console.log("[Playlist] 未找到有效的播放记录，使用默认逻辑");
          if (importedList.length > 0) {
            const firstPlaylist = importedList[0];
            console.log("[Playlist] 自动选择第一个导入的歌单:", firstPlaylist.name);
            currentPlaylistId.value = firstPlaylist.id;
            currentPlaylist.id = firstPlaylist.id;
            currentPlaylist.name = firstPlaylist.name;
            currentPlaylist.coverImgUrl = firstPlaylist.coverImgUrl;
            currentPlaylist.description = `从${firstPlaylist.platform || "未知平台"}导入的歌单`;
            listSource.value = firstPlaylist.source || "";
            if (firstPlaylist.autoUpdate && firstPlaylist.link && !autoUpdatedPlaylists.value.has(firstPlaylist.id)) {
              console.log("[Playlist] 检测到自动更新已开启，开始自动同步歌单:", firstPlaylist.name);
              autoUpdatedPlaylists.value.add(firstPlaylist.id);
              autoUpdatePlaylist(firstPlaylist, false);
              return;
            }
            const playlistSongs = firstPlaylist.songs || [];
            songs.value = [...playlistSongs];
            console.log("[Playlist] 已加载歌曲:", songs.value.length, "首");
          } else if (store_modules_list.listStore.state.userLists.length > 0) {
            const firstCustomList = store_modules_list.listStore.state.userLists[0];
            console.log("[Playlist] 自动选择第一个自定义歌单:", firstCustomList.name);
            currentPlaylistId.value = firstCustomList.id;
            currentPlaylist.id = firstCustomList.id;
            currentPlaylist.name = firstCustomList.name;
            currentPlaylist.coverImgUrl = firstCustomList.coverImgUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`;
            currentPlaylist.description = "自定义歌单";
            listSource.value = "custom";
            const playlistSongs = firstCustomList.list || [];
            setSongList(playlistSongs);
          } else {
            console.log("[Playlist] 使用默认列表");
            fetchSongs();
          }
        }
        console.log("[Playlist] 最终 currentPlaylistId:", currentPlaylistId.value);
        console.log("[Playlist] ====== loadPlaylistData 结束 ======");
        batchAutoUpdatePlaylists();
      } catch (error) {
        console.error("[Playlist] 恢复播放状态失败:", error);
        if (importedList.length > 0) {
          const firstPlaylist = importedList[0];
          currentPlaylistId.value = firstPlaylist.id;
          currentPlaylist.id = firstPlaylist.id;
          currentPlaylist.name = firstPlaylist.name;
          currentPlaylist.coverImgUrl = firstPlaylist.coverImgUrl;
          currentPlaylist.description = `从${firstPlaylist.platform || "未知平台"}导入的歌单`;
          listSource.value = firstPlaylist.source || "";
          const playlistSongs = firstPlaylist.songs || [];
          setSongList(playlistSongs);
        } else {
          fetchSongs();
        }
      }
    };
    const refreshCurrentPlaylist = () => {
      console.log("[Playlist] refreshCurrentPlaylist 当前歌单ID:", currentPlaylistId.value);
      if (currentPlaylistId.value === "trial" || currentPlaylistId.value === store_modules_list.LIST_IDS.DEFAULT) {
        const trialSongs = store_modules_list.listStore.state.defaultList.list || [];
        songs.value = [...trialSongs];
        currentPlaylist.id = "trial";
        currentPlaylist.name = "试听列表";
        currentPlaylist.trackCount = trialSongs.length;
        console.log("[Playlist] 刷新试听列表，歌曲数:", trialSongs.length);
        return;
      }
      if (currentPlaylistId.value === "favorite" || currentPlaylistId.value === store_modules_list.LIST_IDS.LOVE) {
        const favoriteSongs = store_modules_list.listStore.state.loveList.list || [];
        songs.value = [...favoriteSongs];
        currentPlaylist.id = "favorite";
        currentPlaylist.name = "我的收藏";
        currentPlaylist.trackCount = favoriteSongs.length;
        console.log("[Playlist] 刷新我的收藏，歌曲数:", favoriteSongs.length);
        return;
      }
      if (currentPlaylistId.value && (currentPlaylistId.value.startsWith("custom_") || currentPlaylistId.value.startsWith("userlist_"))) {
        const userList = store_modules_list.listStore.state.userLists.find((l) => l.id === currentPlaylistId.value);
        if (userList) {
          const playlistSongs = userList.list || [];
          songs.value = [...playlistSongs];
          currentPlaylist.id = userList.id;
          currentPlaylist.name = userList.name;
          currentPlaylist.trackCount = playlistSongs.length;
          console.log("[Playlist] 刷新自定义歌单:", userList.name, "歌曲数:", playlistSongs.length);
        } else {
          currentPlaylistId.value = "trial";
          songs.value = [...store_modules_list.listStore.state.defaultList.list];
          currentPlaylist.name = "试听列表";
          console.log("[Playlist] 自定义歌单不存在，切换到试听列表");
        }
        return;
      }
      const importedList = common_vendor.index.getStorageSync("imported_playlists") || [];
      const currentPlaylistData = importedList.find((p) => p.id === currentPlaylistId.value);
      if (currentPlaylistData) {
        const playlistSongs = currentPlaylistData.songs || [];
        songs.value = [...playlistSongs];
        currentPlaylist.id = currentPlaylistData.id;
        currentPlaylist.name = currentPlaylistData.name;
        currentPlaylist.trackCount = playlistSongs.length;
        console.log("[Playlist] 刷新导入歌单:", currentPlaylistData.name, "歌曲数:", playlistSongs.length);
      } else {
        currentPlaylistId.value = "trial";
        songs.value = [...store_modules_list.listStore.state.defaultList.list];
        currentPlaylist.name = "试听列表";
        console.log("[Playlist] 导入歌单不存在，切换到试听列表");
      }
    };
    common_vendor.onReachBottom(() => {
      console.log("[Playlist] onReachBottom 触发");
      loadMoreSongs();
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      return common_vendor.e({
        a: common_vendor.t(currentPlaylist.name),
        b: common_vendor.p({
          name: "chevron-down",
          size: "16",
          color: darkMode.value ? "#fff" : "#666"
        }),
        c: common_vendor.o(toggleSidebar),
        d: common_vendor.s(headerStyle.value),
        e: showSidebar.value
      }, showSidebar.value ? {
        f: common_vendor.o(closeSidebar)
      } : {}, {
        g: common_vendor.p({
          name: "music",
          size: "20",
          color: "#00d7cd"
        }),
        h: common_vendor.t(trialListCount.value),
        i: currentPlaylistId.value === "trial" ? 1 : "",
        j: common_vendor.o(($event) => selectPlaylist("trial")),
        k: common_vendor.p({
          name: "heart",
          size: "20",
          color: "#ff6b6b"
        }),
        l: common_vendor.t(favoriteListCount.value),
        m: currentPlaylistId.value === "favorite" ? 1 : "",
        n: common_vendor.o(($event) => selectPlaylist("favorite")),
        o: importedPlaylists.value.length > 0
      }, importedPlaylists.value.length > 0 ? {
        p: common_vendor.f(importedPlaylists.value, (playlist, index, i0) => {
          return {
            a: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlist.coverImgUrl),
            b: common_vendor.o(($event) => handlePlaylistImageError($event, playlist), playlist.id),
            c: common_vendor.t(playlist.name),
            d: common_vendor.t(playlist.trackCount || 0),
            e: common_vendor.t(playlist.platform),
            f: "6b85e9a1-3-" + i0,
            g: common_vendor.o(($event) => showPlaylistContextMenu(playlist, index, "imported"), playlist.id),
            h: playlist.id,
            i: currentPlaylistId.value === playlist.id ? 1 : "",
            j: common_vendor.o(($event) => selectImportedPlaylist(playlist), playlist.id)
          };
        }),
        q: common_vendor.p({
          name: "ellipsis-vertical",
          size: "18"
        })
      } : {}, {
        r: customPlaylists.value.length > 0
      }, customPlaylists.value.length > 0 ? {
        s: common_vendor.f(customPlaylists.value, (playlist, index, i0) => {
          return {
            a: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlist.coverImgUrl),
            b: common_vendor.o(($event) => handlePlaylistImageError($event, playlist), playlist.id),
            c: common_vendor.t(playlist.name),
            d: common_vendor.t(playlist.trackCount || 0),
            e: "6b85e9a1-4-" + i0,
            f: common_vendor.o(($event) => showPlaylistContextMenu(playlist, index, "custom"), playlist.id),
            g: playlist.id,
            h: currentPlaylistId.value === playlist.id ? 1 : "",
            i: common_vendor.o(($event) => selectPlaylist(playlist.id), playlist.id)
          };
        }),
        t: common_vendor.p({
          name: "ellipsis-vertical",
          size: "18"
        })
      } : {}, {
        v: common_vendor.o(createNewPlaylist),
        w: common_vendor.o(importPlaylist),
        x: showSidebar.value ? 1 : "",
        y: common_vendor.s(sidebarStyle.value),
        z: common_vendor.p({
          name: "location-crosshairs",
          size: "18",
          color: "#fff"
        }),
        A: common_vendor.o(locateCurrentSong),
        B: common_vendor.sr(virtualListRef, "6b85e9a1-6", {
          "k": "virtualListRef"
        }),
        C: common_vendor.o(onScrollToLower),
        D: common_vendor.o(onScrollHandler),
        E: common_vendor.o(onVirtualItemClick),
        F: common_vendor.o(onVirtualMoreClick),
        G: common_vendor.p({
          items: songs.value,
          ["item-height"]: 60,
          height: virtualListHeight.value,
          ["buffer-size"]: 10,
          loading: isLoading.value,
          ["current-play-index"]: currentSongIndex.value,
          ["is-playing"]: isPlayerPlaying.value,
          ["dark-mode"]: darkMode.value,
          ["bottom-safe-height"]: common_vendor.unref(totalBottomHeight)
        }),
        H: showImportModal.value
      }, showImportModal.value ? {
        I: common_vendor.t(importModalTitle.value),
        J: common_vendor.p({
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        K: common_vendor.o(closeImportModal),
        L: importLink.value,
        M: common_vendor.o(($event) => importLink.value = $event.detail.value),
        N: common_vendor.o(closeImportModal),
        O: common_vendor.o(confirmImport),
        P: common_vendor.o(() => {
        }),
        Q: common_vendor.o(closeImportModal)
      } : {}, {
        R: showSongMenuFlag.value
      }, showSongMenuFlag.value ? common_vendor.e({
        S: selectedSong.value
      }, selectedSong.value ? {
        T: common_vendor.t(selectedSong.value.name),
        U: common_vendor.t(formatSingerName(selectedSong.value.ar || selectedSong.value.singer))
      } : {}, {
        V: common_vendor.p({
          type: "fas",
          name: "rotate",
          size: "20",
          color: "#3b82f6"
        }),
        W: common_vendor.o(toggleMusicSource),
        X: common_vendor.p({
          type: "fas",
          name: "trash",
          size: "20",
          color: "#ef4444"
        }),
        Y: common_vendor.t(currentPlaylistId.value.value === "favorite" || currentPlaylistId.value.value === common_vendor.unref(store_modules_list.LIST_IDS).LOVE ? "取消收藏并移除" : "从列表中移除"),
        Z: common_vendor.o(removeSongFromList),
        aa: common_vendor.o(() => {
        }),
        ab: common_vendor.o(closeSongMenu)
      }) : {}, {
        ac: showPlaylistMenu.value
      }, showPlaylistMenu.value ? common_vendor.e({
        ad: menuPlaylistInfo.value
      }, menuPlaylistInfo.value ? {
        ae: common_vendor.t(menuPlaylistInfo.value.name),
        af: common_vendor.t(menuPlaylistType.value === "imported" ? `从${menuPlaylistInfo.value.platform || ""}导入` : "自定义歌单")
      } : {}, {
        ag: common_vendor.p({
          type: "fas",
          name: "pen",
          size: "20",
          color: "#3b82f6"
        }),
        ah: common_vendor.o(renamePlaylist),
        ai: menuPlaylistType.value === "imported" && ((_a = menuPlaylistInfo.value) == null ? void 0 : _a.canAutoUpdate) && ((_b = menuPlaylistInfo.value) == null ? void 0 : _b.isFromImport)
      }, menuPlaylistType.value === "imported" && ((_c = menuPlaylistInfo.value) == null ? void 0 : _c.canAutoUpdate) && ((_d = menuPlaylistInfo.value) == null ? void 0 : _d.isFromImport) ? {
        aj: common_vendor.p({
          type: "fas",
          name: ((_e = menuPlaylistInfo.value) == null ? void 0 : _e.autoUpdate) ? "check-circle" : "clock-rotate-left",
          size: "20",
          color: ((_f = menuPlaylistInfo.value) == null ? void 0 : _f.autoUpdate) ? "#10b981" : "#999"
        }),
        ak: common_vendor.t(((_g = menuPlaylistInfo.value) == null ? void 0 : _g.autoUpdate) ? "已开启自动更新" : "开启自动更新"),
        al: ((_h = menuPlaylistInfo.value) == null ? void 0 : _h.autoUpdate) ? "#10b981" : "#999",
        am: common_vendor.o(toggleAutoUpdate)
      } : {}, {
        an: menuPlaylistType.value === "imported" && ((_i = menuPlaylistInfo.value) == null ? void 0 : _i.canAutoUpdate) && ((_j = menuPlaylistInfo.value) == null ? void 0 : _j.isFromImport)
      }, menuPlaylistType.value === "imported" && ((_k = menuPlaylistInfo.value) == null ? void 0 : _k.canAutoUpdate) && ((_l = menuPlaylistInfo.value) == null ? void 0 : _l.isFromImport) ? {
        ao: common_vendor.p({
          type: "fas",
          name: "rotate",
          size: "20",
          color: "#10b981"
        }),
        ap: common_vendor.o(syncPlaylist)
      } : {}, {
        aq: common_vendor.p({
          type: "fas",
          name: "trash",
          size: "20",
          color: "#ef4444"
        }),
        ar: common_vendor.o(removePlaylist),
        as: common_vendor.o(() => {
        }),
        at: common_vendor.o(closePlaylistMenu)
      }) : {}, {
        av: common_vendor.o(closeMusicToggleModal),
        aw: common_vendor.o(handleToggleConfirm),
        ax: common_vendor.o(handleTogglePreview),
        ay: common_vendor.p({
          visible: showMusicToggleModal.value,
          ["original-song"]: toggleOriginalSong.value,
          ["list-id"]: currentPlaylistId.value,
          ["dark-mode"]: darkMode.value
        }),
        az: common_vendor.p({
          visible: showAutoUpdateToast.value,
          ["playlist-name"]: autoUpdatePlaylistName.value
        }),
        aA: common_vendor.p({
          visible: showLoadingToast.value,
          title: loadingToastTitle.value,
          subtitle: loadingToastSubtitle.value
        }),
        aB: darkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6b85e9a1"]]);
exports.MiniProgramPage = MiniProgramPage;
