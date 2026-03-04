"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_system = require("../../utils/system.js");
const utils_api_songlist = require("../../utils/api/songlist.js");
const utils_api_songlistDirect = require("../../utils/api/songlist-direct.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
const utils_imageProxy = require("../../utils/imageProxy.js");
if (!Array) {
  const _component_custom_tabbar = common_vendor.resolveComponent("custom-tabbar");
  _component_custom_tabbar();
}
if (!Math) {
  (RocIconPlus + MiniPlayer)();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const MiniPlayer = () => "../../components/player/MiniPlayer.js";
const PAGE_SIZE = 50;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const pageLink = common_vendor.ref("");
    const pageSource = common_vendor.ref("");
    const pagePlatform = common_vendor.ref("");
    const isPreviewMode = common_vendor.ref(false);
    const showActionBar = common_vendor.ref(false);
    const loadError = common_vendor.ref("");
    const listSource = common_vendor.ref("");
    const listId = common_vendor.ref("");
    const fromPage = common_vendor.ref("");
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
    const isLoading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const page = common_vendor.ref(1);
    const allSongs = common_vendor.ref([]);
    const currentPage = common_vendor.ref(1);
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
        const isLocalTempList = tempId && (tempId === currentListId.value || tempId.startsWith("local_"));
        if (isLocalTempList || tempId === currentListId.value) {
          if (playIndex >= 0 && playIndex < songs.value.length) {
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
    const scrollTop = common_vendor.ref(0);
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
    const formatDuration = (duration) => {
      return utils_api_songlist.formatDuration(duration);
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
    const hasHighQuality = (song) => {
      if (song.types) {
        return song.types.some((t) => t.type === "flac" || t.type === "flac24bit" || t.type === "SQ");
      }
      if (song.quality === "SQ")
        return true;
      return false;
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
          name: playlistName.value
        }
      );
      store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
      await playSongWithIndex(0, true);
    };
    const playSongWithIndex = async (index, addToDefaultList = true) => {
      var _a, _b, _c;
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
          const tempId = `local_${currentListId.value}`;
          store_modules_list.listStore.setTempList(store_modules_list.LIST_IDS.TEMP, [], {});
          store_modules_list.listStore.setTempList(
            store_modules_list.LIST_IDS.TEMP,
            songs.value,
            {
              id: tempId,
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
              name: playlistName.value
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
        console.log("[Sharelist] 调用 playerStore.playSong");
        store_modules_player.playerStore.playSong(musicInfo);
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
    const loadMoreSongs = () => {
      console.log("[Sharelist] loadMoreSongs 被触发");
      console.log("[Sharelist] hasMore:", hasMore.value, "isLoading:", isLoading.value, "isPreviewMode:", isPreviewMode.value, "allSongs.length:", allSongs.value.length);
      if (!hasMore.value) {
        console.log("[Sharelist] 没有更多数据，跳过加载");
        return;
      }
      if (isLoading.value) {
        console.log("[Sharelist] 正在加载中，跳过");
        return;
      }
      if (!isPreviewMode.value) {
        console.log("[Sharelist] 非预览模式，跳过分页加载");
        return;
      }
      console.log("[Sharelist] 开始加载更多歌曲...");
      const nextPage = currentPage.value + 1;
      const start = (nextPage - 1) * PAGE_SIZE;
      const end = nextPage * PAGE_SIZE;
      console.log("[Sharelist] 加载第", nextPage, "页, 范围:", start, "-", end);
      const newSongs = allSongs.value.slice(start, end);
      if (newSongs.length > 0) {
        songs.value = [...songs.value, ...newSongs];
        currentPage.value = nextPage;
        console.log("[Sharelist] 已加载", newSongs.length, "首, 当前共", songs.value.length, "首");
        hasMore.value = songs.value.length < allSongs.value.length;
        console.log("[Sharelist] 是否还有更多:", hasMore.value);
      } else {
        hasMore.value = false;
        console.log("[Sharelist] 没有更多歌曲了");
      }
    };
    common_vendor.onReachBottom(() => {
      console.log("[Sharelist] onReachBottom 触发");
      loadMoreSongs();
    });
    const retryLoad = () => {
      loadPreviewList();
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
                const fullSongList = allSongs.value || [];
                const simplifiedSongs = simplifySongs(fullSongList);
                importedList[existsIndex].songs = simplifiedSongs;
                importedList[existsIndex].trackCount = fullSongList.length;
                importedList[existsIndex].coverImgUrl = playlistCover.value;
                common_vendor.index.setStorageSync("imported_playlists", importedList);
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
              const fullSongList = allSongs.value || [];
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
                      common_vendor.index.navigateBack();
                    }
                  });
                }, 1500);
              } else {
                setTimeout(() => {
                  common_vendor.index.navigateBack();
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
        const pages = getCurrentPages();
        const currentPage2 = pages[pages.length - 1];
        const options = ((_a = currentPage2.$page) == null ? void 0 : _a.options) || currentPage2.options || {};
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
                  const location = ((_b = res.header) == null ? void 0 : _b.Location) || ((_c = res.header) == null ? void 0 : _c.location);
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
          result = await utils_api_songlist.getListDetail(pageSource.value, pageLink.value, page.value);
        } else {
          console.log("[Sharelist] 使用前端直接API:", pageSource.value);
          console.log("[Sharelist] 调用 getListDetailDirect:", pageSource.value, targetPlaylistId);
          result = await utils_api_songlistDirect.getListDetailDirect(pageSource.value, targetPlaylistId, 1);
        }
        console.log("[Sharelist] ========== 返回数据开始 ==========");
        console.log("[Sharelist] result.info:", JSON.stringify(result.info));
        console.log("[Sharelist] result.list类型:", typeof result.list, "是否是数组:", Array.isArray(result.list));
        console.log("[Sharelist] result.list长度:", (_d = result.list) == null ? void 0 : _d.length);
        console.log("[Sharelist] result.list前3项:", JSON.stringify((_e = result.list) == null ? void 0 : _e.slice(0, 3)));
        console.log("[Sharelist] ========== 返回数据结束 ==========");
        listSource.value = result.source;
        listId.value = result.id || options.id || "";
        console.log("[Sharelist] 开始更新歌单信息...");
        playlistId.value = result.id || options.id || "";
        playlistName.value = ((_f = result.info) == null ? void 0 : _f.name) || "未知歌单";
        playlistCover.value = ((_g = result.info) == null ? void 0 : _g.img) || "";
        playlistAuthor.value = ((_h = result.info) == null ? void 0 : _h.author) || "";
        playlistDesc.value = ((_i = result.info) == null ? void 0 : _i.desc) || "";
        playlistTrackCount.value = result.total || 0;
        playlistPlayCount.value = ((_j = result.info) == null ? void 0 : _j.play_count) || "";
        console.log("[Sharelist] 歌单信息已更新:", {
          name: playlistName.value,
          author: playlistAuthor.value,
          playCount: playlistPlayCount.value,
          trackCount: playlistTrackCount.value
        });
        console.log("[Sharelist] 开始更新歌曲列表...");
        allSongs.value = result.list || [];
        console.log("[Sharelist] 总歌曲数量:", (_k = allSongs.value) == null ? void 0 : _k.length);
        console.log("[Sharelist] result.total:", result.total);
        console.log("[Sharelist] result.limit:", result.limit);
        currentPage2.value = 1;
        const start = 0;
        const end = Math.min(PAGE_SIZE, allSongs.value.length);
        songs.value = allSongs.value.slice(start, end);
        console.log("[Sharelist] 当前显示:", (_l = songs.value) == null ? void 0 : _l.length, "首");
        console.log("[Sharelist] 第1页范围:", start, "-", end);
        hasMore.value = allSongs.value.length > songs.value.length;
        console.log("[Sharelist] 是否还有更多:", hasMore.value);
        if (allSongs.value.length === 0) {
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
      common_vendor.index.$on("miniPlayerHeightChange", handleMiniPlayerHeightChange);
      const pages = getCurrentPages();
      const currentPage2 = pages[pages.length - 1];
      const options = ((_a = currentPage2.$page) == null ? void 0 : _a.options) || currentPage2.options || {};
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
              allSongs.value = songsWithAr;
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
              allSongs.value = songsWithAr;
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
            allSongs.value = targetList.list;
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
            allSongs.value = loveList;
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
        a: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlistCover.value),
        b: common_vendor.o(($event) => handleSharelistImageError($event)),
        c: common_vendor.s(statusBarStyle.value),
        d: common_vendor.p({
          name: "chevron-left",
          size: "24",
          color: "#fff"
        }),
        e: common_vendor.o(goBack),
        f: common_vendor.t(isPreviewMode.value ? "歌单预览" : "歌单详情"),
        g: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlistCover.value),
        h: common_vendor.o(($event) => handleSharelistImageError($event)),
        i: playlistPlayCount.value
      }, playlistPlayCount.value ? {
        j: common_vendor.p({
          name: "play",
          size: "10",
          color: "#fff"
        }),
        k: common_vendor.t(playlistPlayCount.value)
      } : {}, {
        l: common_vendor.t(playlistName.value || "加载中..."),
        m: playlistAuthor.value
      }, playlistAuthor.value ? {
        n: common_vendor.t(playlistAuthor.value)
      } : {}, {
        o: playlistDesc.value
      }, playlistDesc.value ? {
        p: common_vendor.t(playlistDesc.value)
      } : {}, {
        q: common_vendor.t(playlistTrackCount.value),
        r: playlistPlayCount.value
      }, playlistPlayCount.value ? {} : {}, {
        s: playlistPlayCount.value
      }, playlistPlayCount.value ? {
        t: common_vendor.t(playlistPlayCount.value)
      } : {}, {
        v: showActionBar.value
      }, showActionBar.value ? common_vendor.e({
        w: isPreviewMode.value
      }, isPreviewMode.value ? {
        x: common_vendor.p({
          name: "heart",
          size: "14",
          color: "#fff"
        }),
        y: common_vendor.t(fromPage.value === "import" ? "导入歌单" : "收藏歌单"),
        z: common_vendor.o(handleCollect)
      } : {}, {
        A: common_vendor.p({
          name: "play",
          size: "14",
          color: "#fff"
        }),
        B: common_vendor.o(playAll)
      }) : {}, {
        C: isLoading.value && songs.value.length === 0
      }, isLoading.value && songs.value.length === 0 ? {} : {}, {
        D: loadError.value && !isLoading.value
      }, loadError.value && !isLoading.value ? {
        E: common_vendor.p({
          name: "exclamation-circle",
          size: "48",
          color: "#999"
        }),
        F: common_vendor.t(loadError.value),
        G: common_vendor.o(retryLoad)
      } : {}, {
        H: songs.value.length > 0
      }, songs.value.length > 0 ? common_vendor.e({
        I: common_vendor.f(songs.value, (song, index, i0) => {
          var _a, _b, _c;
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.t(song.name),
            c: hasHighQuality(song)
          }, hasHighQuality(song) ? {} : {}, {
            d: common_vendor.t(formatSingerName(song.ar || song.singer)),
            e: ((_a = song.al) == null ? void 0 : _a.name) || song.album || song.albumName
          }, ((_b = song.al) == null ? void 0 : _b.name) || song.album || song.albumName ? {
            f: common_vendor.t(((_c = song.al) == null ? void 0 : _c.name) || song.album || song.albumName)
          } : {}, {
            g: currentSongIndex.value === index && isPlaying.value
          }, currentSongIndex.value === index && isPlaying.value ? {
            h: "864f0795-5-" + i0,
            i: common_vendor.p({
              name: "play",
              size: "18"
            })
          } : currentSongIndex.value === index && !isPlaying.value ? {
            k: "864f0795-6-" + i0,
            l: common_vendor.p({
              name: "pause",
              size: "18"
            })
          } : {}, {
            j: currentSongIndex.value === index && !isPlaying.value,
            m: common_vendor.t(formatDuration(song.dt || song.interval || song.duration)),
            n: song.id || index,
            o: currentSongIndex.value === index ? 1 : "",
            p: common_vendor.o(($event) => playSong(index), song.id || index)
          });
        }),
        J: isLoading.value && songs.value.length > 0
      }, isLoading.value && songs.value.length > 0 ? {} : {}, {
        K: !hasMore.value && songs.value.length > 0 && !isLoading.value
      }, !hasMore.value && songs.value.length > 0 && !isLoading.value ? {} : {}, {
        L: miniPlayerBottomHeight.value + "px"
      }) : {}, {
        M: !isLoading.value && !loadError.value && songs.value.length === 0
      }, !isLoading.value && !loadError.value && songs.value.length === 0 ? {
        N: common_vendor.p({
          name: "ban",
          size: "64",
          color: "#ccc"
        })
      } : {}, {
        O: scrollTop.value,
        P: common_vendor.o(loadMoreSongs),
        Q: !isPreviewMode.value
      }, !isPreviewMode.value ? {
        R: common_vendor.p({
          ["current-index"]: 2
        })
      } : {}, {
        S: darkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-864f0795"]]);
wx.createPage(MiniProgramPage);
