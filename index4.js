"use strict";
const common_vendor = require("./common/vendor.js");
const store_modules_user = require("./store/modules/user.js");
const store_modules_playlist = require("./store/modules/playlist.js");
const store_modules_player = require("./store/modules/player.js");
const store_modules_list = require("./store/modules/list.js");
const utils_system = require("./utils/system.js");
const utils_imageProxy = require("./utils/imageProxy.js");
const utils_playSong = require("./utils/playSong.js");
const composables_usePageLifecycle = require("./composables/usePageLifecycle.js");
const composables_useBottomHeight = require("./composables/useBottomHeight.js");
const utils_musicPic = require("./utils/musicPic.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
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
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const darkMode = common_vendor.ref(common_vendor.index.getStorageSync("darkMode") === "true");
    const { bottomPaddingStyle, totalBottomHeight, checkMiniPlayerStatus: checkMiniPlayerStatusFromComposable } = composables_useBottomHeight.useBottomHeight();
    const currentTempListId = common_vendor.computed(() => {
      const playInfo = store_modules_list.listStore.state.playInfo;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      const playerListId = playInfo == null ? void 0 : playInfo.playerListId;
      if ((playerListId === "temp" || playerListId === "default") && (tempListMeta == null ? void 0 : tempListMeta.id)) {
        return tempListMeta.id;
      }
      if (playerListId === "default") {
        return "default";
      }
      return "";
    });
    const currentTempListLink = common_vendor.computed(() => {
      const playInfo = store_modules_list.listStore.state.playInfo;
      const tempListMeta = store_modules_list.listStore.state.tempList.meta;
      const playerListId = playInfo == null ? void 0 : playInfo.playerListId;
      if ((playerListId === "temp" || playerListId === "default") && (tempListMeta == null ? void 0 : tempListMeta.link)) {
        return tempListMeta.link;
      }
      return "";
    });
    const statusBarStyle = common_vendor.computed(() => ({
      height: `${statusBarHeight.value}px`,
      width: "100%",
      backgroundColor: darkMode.value ? "#1f2937" : "#f9fafb"
    }));
    const scrollContainerStyle = common_vendor.computed(() => {
      console.log("[My] scrollContainerStyle 计算:", { totalBottomHeight: totalBottomHeight.value });
      return {};
    });
    const safeBottomStyle = common_vendor.computed(() => {
      return {
        height: `${totalBottomHeight.value}px`
      };
    });
    common_vendor.computed(() => store_modules_user.userStore.getState().userInfo || {
      nickname: "未登录",
      avatar: "/static/images/default_avatar.png",
      isVip: false
    });
    const stats = common_vendor.ref(store_modules_user.userStore.getState().stats || {
      listenCount: 0,
      listenTime: 0,
      favoriteSinger: ""
    });
    const myPlaylists = common_vendor.ref([]);
    const safeParse = (data, defaultValue = []) => {
      if (!data) {
        return defaultValue;
      }
      const dataType = typeof data;
      if (dataType === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.data)) {
            return parsed.data;
          }
          if (Array.isArray(parsed))
            return parsed;
          return defaultValue;
        } catch (e) {
          return defaultValue;
        }
      }
      if (Array.isArray(data))
        return data;
      if (dataType === "object" && Array.isArray(data.data)) {
        return data.data;
      }
      if (dataType === "object")
        return data;
      return defaultValue;
    };
    const getMyPlaylists = () => {
      var _a;
      const playlists = [];
      try {
        const defaultListRaw = common_vendor.index.getStorageSync("@list_default");
        console.log("[My] 试听列表原始数据:", defaultListRaw);
        const defaultList = safeParse(defaultListRaw, []);
        console.log("[My] 试听列表解析后:", defaultList.length);
        if (Array.isArray(defaultList) && defaultList.length > 0) {
          playlists.push({
            id: "default",
            name: "试听列表",
            coverUrl: "",
            songCount: defaultList.length,
            isDefault: false,
            source: "default"
          });
        }
        const loveListRaw = common_vendor.index.getStorageSync("@list_love");
        console.log("[My] 收藏列表原始数据:", loveListRaw);
        const loveList = safeParse(loveListRaw, []);
        console.log("[My] 收藏列表解析后:", loveList.length);
        if (Array.isArray(loveList) && loveList.length > 0) {
          playlists.push({
            id: "love",
            name: "我的收藏",
            coverUrl: "",
            songCount: loveList.length,
            isDefault: true,
            source: "love"
          });
        }
        const importedRaw = common_vendor.index.getStorageSync("imported_playlists");
        console.log("[My] 导入歌单原始数据:", importedRaw);
        const importedPlaylists = safeParse(importedRaw, []);
        console.log("[My] 导入歌单解析后:", importedPlaylists.length);
        if (Array.isArray(importedPlaylists)) {
          for (const playlist of importedPlaylists) {
            let link = "";
            if (playlist.id && playlist.id.includes("__")) {
              link = playlist.id.split("__")[1] || "";
            } else if (playlist.sourceListId) {
              link = playlist.sourceListId;
            }
            playlists.push({
              id: playlist.id,
              name: playlist.name,
              coverUrl: playlist.coverImgUrl || "",
              songCount: playlist.trackCount || ((_a = playlist.songs) == null ? void 0 : _a.length) || 0,
              isDefault: false,
              source: "imported",
              platform: playlist.platform,
              link
            });
          }
        }
        const userListsRaw = common_vendor.index.getStorageSync("@user_lists");
        console.log("[My] 用户列表原始数据:", userListsRaw);
        const userLists = safeParse(userListsRaw, []);
        console.log("[My] 用户列表解析后:", userLists.length);
        if (Array.isArray(userLists)) {
          for (const list of userLists) {
            playlists.push({
              id: list.id,
              name: list.name,
              coverUrl: list.coverImgUrl || "",
              songCount: list.list ? list.list.length : 0,
              isDefault: false,
              source: "user"
            });
          }
        }
      } catch (e) {
        console.error("[My] 获取歌单列表失败:", e);
      }
      console.log("[My] 最终歌单列表:", playlists.length);
      myPlaylists.value = playlists;
    };
    const defaultPlaylist = common_vendor.computed(() => myPlaylists.value.find((p) => p.source === "default") || null);
    const favoritePlaylist = common_vendor.computed(() => myPlaylists.value.find((p) => p.isDefault) || null);
    const otherPlaylists = common_vendor.computed(() => {
      return myPlaylists.value.filter((p) => p.source !== "default" && !p.isDefault);
    });
    const sortedAllPlaylists = common_vendor.computed(() => {
      const playingListId = currentPlayingListId.value;
      const tempListId = currentTempListId.value;
      const tempListLink = currentTempListLink.value;
      const allPlaylists = [];
      if (defaultPlaylist.value) {
        allPlaylists.push({ ...defaultPlaylist.value, playlistType: "default" });
      }
      if (favoritePlaylist.value) {
        allPlaylists.push({ ...favoritePlaylist.value, playlistType: "favorite" });
      }
      otherPlaylists.value.forEach((p) => {
        allPlaylists.push({ ...p, playlistType: "other" });
      });
      console.log("[sortedAllPlaylists] 所有歌单数量:", allPlaylists.length, "当前播放ID:", playingListId, "tempListId:", tempListId, "link:", tempListLink);
      if (!playingListId) {
        return allPlaylists;
      }
      let playingIndex = -1;
      allPlaylists.forEach((p, index) => {
        const playlistId = p.id;
        const playlistLink = p.link || "";
        if (p.playlistType === "default") {
          if (playingListId === "temp" || playingListId === "default") {
            if (tempListId === "default" || tempListId === "trial") {
              playingIndex = index;
              console.log("[sortedAllPlaylists] 找到正在播放的试听列表（temp/default模式）");
              return;
            }
          } else {
            if (playingListId === "default" || playingListId === "trial") {
              playingIndex = index;
              console.log("[sortedAllPlaylists] 找到正在播放的试听列表");
              return;
            }
          }
        }
        if (p.playlistType === "favorite") {
          if (playingListId === "temp" || playingListId === "default") {
            if (tempListId === "love") {
              playingIndex = index;
              console.log("[sortedAllPlaylists] 找到正在播放的我的收藏（temp/default模式）");
              return;
            }
          } else {
            if (playingListId === "love") {
              playingIndex = index;
              console.log("[sortedAllPlaylists] 找到正在播放的我的收藏");
              return;
            }
          }
        }
        let matched = false;
        if (playingListId === "temp" || playingListId === "default") {
          matched = tempListId === playlistId || tempListLink && (tempListLink === playlistLink || tempListLink === playlistId);
        } else {
          matched = playingListId === playlistId;
        }
        if (matched && playingIndex === -1) {
          playingIndex = index;
          console.log("[sortedAllPlaylists] 找到正在播放的歌单:", p.name);
        }
      });
      if (playingIndex > 0) {
        console.log("[sortedAllPlaylists] 将歌单移到首位:", allPlaylists[playingIndex].name);
        const playingPlaylist = allPlaylists.splice(playingIndex, 1)[0];
        allPlaylists.unshift(playingPlaylist);
      }
      return allPlaylists;
    });
    const currentPlayingSong = common_vendor.computed(() => {
      return store_modules_player.playerStore.getState().currentSong || null;
    });
    const currentPlayingListId = common_vendor.computed(() => {
      const playInfo = store_modules_list.listStore.getState().playInfo;
      return (playInfo == null ? void 0 : playInfo.playerListId) || "";
    });
    const currentPlayingSongId = common_vendor.computed(() => {
      var _a;
      return ((_a = currentPlayingSong.value) == null ? void 0 : _a.id) || null;
    });
    const isPlaylistPlaying = (playlist) => {
      if (!playlist)
        return false;
      const currentId = currentPlayingListId.value;
      if (!currentId)
        return false;
      const playlistId = playlist.id;
      const playlistLink = playlist.link || "";
      const tempListId = currentTempListId.value;
      const tempListLink = currentTempListLink.value;
      if (currentId === "temp" || currentId === "default") {
        if (playlist.playlistType === "default" || playlist.source === "default") {
          return tempListId === "default" || tempListId === "trial";
        }
        if (playlist.playlistType === "favorite" || playlist.source === "love") {
          return tempListId === "love";
        }
        if (playlist.source === "user") {
          return tempListId === playlistId;
        }
        return tempListId === playlistId || tempListLink && (tempListLink === playlistLink || tempListLink === playlistId);
      }
      if (playlist.playlistType === "default" || playlist.source === "default") {
        return currentId === "default" || currentId === "trial";
      }
      if (playlist.playlistType === "favorite" || playlist.source === "love") {
        return currentId === "love";
      }
      if (playlist.source === "user") {
        return currentId === playlistId;
      }
      return currentId === playlistId;
    };
    const isRecentPlaylistPlaying = (playlist) => {
      var _a, _b, _c, _d, _e;
      if (!playlist)
        return false;
      const playingListId = currentPlayingListId.value;
      if (!playingListId)
        return false;
      const playlistId = playlist.id;
      const playlistLink = playlist.link || "";
      const tempListId = currentTempListId.value;
      const tempListLink = currentTempListLink.value;
      let extractedIdFromLink = "";
      if (tempListLink) {
        if (tempListLink.includes("kuwo.cn/playlist_detail/")) {
          extractedIdFromLink = ((_a = tempListLink.split("playlist_detail/")[1]) == null ? void 0 : _a.split("?")[0]) || "";
        } else if (tempListLink.includes("y.qq.com/n/ryqq/playlist/")) {
          extractedIdFromLink = ((_b = tempListLink.split("playlist/")[1]) == null ? void 0 : _b.split("?")[0]) || "";
        } else if (tempListLink.includes("kugou.com/yy/special/single/")) {
          extractedIdFromLink = ((_c = tempListLink.split("single/")[1]) == null ? void 0 : _c.split(".")[0]) || "";
        } else if (tempListLink.includes("music.163.com/playlist?id=")) {
          extractedIdFromLink = ((_d = tempListLink.split("id=")[1]) == null ? void 0 : _d.split("&")[0]) || "";
        } else if (tempListLink.includes("music.migu.cn/v3/music/playlist/")) {
          extractedIdFromLink = ((_e = tempListLink.split("playlist/")[1]) == null ? void 0 : _e.split("?")[0]) || "";
        }
      }
      if (playingListId === "temp" || playingListId === "default") {
        return tempListId === playlistId || tempListLink && (tempListLink === playlistLink || tempListLink === playlistId) || extractedIdFromLink && extractedIdFromLink === playlistId;
      }
      return playingListId === playlistId;
    };
    const isSongPlaying = (song) => {
      if (!song || !currentPlayingSongId.value)
        return false;
      return song.id === currentPlayingSongId.value;
    };
    const recentSongsCount = common_vendor.computed(() => {
      const playHistory = store_modules_player.playerStore.getState().playHistory || [];
      return playHistory.length;
    });
    const recentSongs = common_vendor.computed(() => {
      var _a, _b;
      const playHistory = store_modules_player.playerStore.getState().playHistory || [];
      if (playHistory.length > 0) {
        console.log("[recentSongs] 第一首歌数据:", JSON.stringify(playHistory[0]).substring(0, 300));
        console.log("[recentSongs] 图片字段 - al.picUrl:", (_a = playHistory[0].al) == null ? void 0 : _a.picUrl);
        console.log("[recentSongs] 图片字段 - album.picUrl:", (_b = playHistory[0].album) == null ? void 0 : _b.picUrl);
        console.log("[recentSongs] 图片字段 - picUrl:", playHistory[0].picUrl);
        console.log("[recentSongs] 图片字段 - img:", playHistory[0].img);
      }
      return playHistory.slice(0, 5);
    });
    const recentPlaylistHistoryCount = common_vendor.computed(() => {
      const listHistory = store_modules_player.playerStore.getState().playListHistory || [];
      return listHistory.length;
    });
    const recentPlaylistHistory = common_vendor.computed(() => {
      const listHistory = store_modules_player.playerStore.getState().playListHistory || [];
      console.log("[recentPlaylistHistory] 歌单历史数据数量:", listHistory.length);
      return listHistory.slice(0, 5);
    });
    const deletedSongsCount = common_vendor.computed(() => {
      const deletedList = safeParse(common_vendor.index.getStorageSync("deleted_songs"), []);
      return deletedList.length;
    });
    const deletedSongs = common_vendor.computed(() => {
      var _a, _b;
      const deletedList = safeParse(common_vendor.index.getStorageSync("deleted_songs"), []);
      if (deletedList.length > 0) {
        console.log("[deletedSongs] 第一首歌数据:", JSON.stringify(deletedList[0]).substring(0, 300));
        console.log("[deletedSongs] 图片字段 - al.picUrl:", (_a = deletedList[0].al) == null ? void 0 : _a.picUrl);
        console.log("[deletedSongs] 图片字段 - album.picUrl:", (_b = deletedList[0].album) == null ? void 0 : _b.picUrl);
        console.log("[deletedSongs] 图片字段 - picUrl:", deletedList[0].picUrl);
        console.log("[deletedSongs] 图片字段 - img:", deletedList[0].img);
      }
      return deletedList.slice(0, 5);
    });
    common_vendor.computed(() => store_modules_player.playerStore.getState().showMiniPlayer);
    const allSongCount = common_vendor.ref(0);
    const refreshAllSongCount = () => {
      try {
        if (store_modules_playlist.playlistStore && typeof store_modules_playlist.playlistStore.getAllSongCount === "function") {
          const count = store_modules_playlist.playlistStore.getAllSongCount.call(store_modules_playlist.playlistStore);
          allSongCount.value = typeof count === "number" ? count : 0;
          console.log("[My] 刷新歌曲总数:", allSongCount.value);
        } else {
          console.warn("[My] playlistStore.getAllSongCount 不可用");
          allSongCount.value = 0;
        }
      } catch (e) {
        console.error("[My] 刷新歌曲总数失败:", e);
        allSongCount.value = 0;
      }
    };
    const formatAllSongs = common_vendor.computed(() => {
      return (allSongCount.value || 0).toString();
    });
    const formatListenTime = common_vendor.computed(() => {
      const minutes = stats.value.listenTime || 0;
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
      return `${Math.round(minutes)}m`;
    });
    const favoriteSingerText = common_vendor.computed(() => {
      const singer = stats.value.favoriteSinger;
      if (singer && singer.trim()) {
        if (singer.length > 4) {
          return singer.substring(0, 4) + "...";
        }
        return singer;
      }
      return "暂无";
    });
    const formatNumber = (num) => {
      const n = Number(num) || 0;
      if (n >= 1e4) {
        return (n / 1e4).toFixed(1) + "万";
      }
      return n.toString();
    };
    const formatArtists = (song) => {
      if (!song)
        return "未知歌手";
      if (song.ar && Array.isArray(song.ar)) {
        return song.ar.map((a) => a.name).join("、");
      } else if (song.artists && Array.isArray(song.artists)) {
        return song.artists.map((a) => a.name).join("、");
      } else if (song.singer && typeof song.singer === "string") {
        return song.singer;
      } else if (song.ar && typeof song.ar === "string") {
        return song.ar;
      } else if (song.artists && typeof song.artists === "string") {
        return song.artists;
      }
      return "未知歌手";
    };
    const formatAlbumName = (song) => {
      var _a;
      if (!song)
        return "未知专辑";
      if (song.al && typeof song.al === "object" && song.al.name) {
        return song.al.name;
      }
      if (typeof song.album === "string") {
        return song.album;
      } else if (song.album && typeof song.album === "object" && song.album.name) {
        return song.album.name;
      }
      if (song.albumName)
        return song.albumName;
      if ((_a = song.al) == null ? void 0 : _a.name)
        return song.al.name;
      return "未知专辑";
    };
    const getPlaylistSourceName = (playlist) => {
      if (!playlist)
        return "";
      if (playlist.source === "default") {
        return "本地";
      }
      if (playlist.source === "love") {
        return "本地";
      }
      if (playlist.source === "user") {
        return "本地";
      }
      if (playlist.source === "imported" && playlist.platform) {
        const platformMap = {
          "kw": "酷我",
          "kg": "酷狗",
          "tx": "QQ",
          "mg": "咪咕",
          "wy": "网易",
          "local": "本地"
        };
        return platformMap[playlist.platform] || playlist.platform;
      }
      return "本地";
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
    const songCoverUrlCache = /* @__PURE__ */ new Map();
    const getSongCover = (song) => {
      var _a, _b, _c, _d;
      if (!song) {
        console.log("[getSongCover] 歌曲为空");
        return "";
      }
      const songId = song.id;
      if (songId && songCoverUrlCache.has(songId)) {
        return songCoverUrlCache.get(songId);
      }
      console.log("[getSongCover] 歌曲信息:", {
        id: song.id,
        name: song.name,
        source: song.source,
        picUrl: song.picUrl,
        "al.picUrl": (_a = song.al) == null ? void 0 : _a.picUrl,
        "album.picUrl": (_b = song.album) == null ? void 0 : _b.picUrl,
        img: song.img
      });
      const source = song.source || song.sourceId;
      const cachedUrl = utils_musicPic.getSongPicUrl(song, source);
      if (cachedUrl) {
        console.log("[getSongCover] 从缓存获取到图片:", cachedUrl);
        if (songId) {
          songCoverUrlCache.set(songId, cachedUrl);
        }
        return cachedUrl;
      }
      const coverUrl = song.picUrl || ((_c = song.al) == null ? void 0 : _c.picUrl) || ((_d = song.album) == null ? void 0 : _d.picUrl) || song.img || song.pic || song.cover || song.coverUrl;
      if (!coverUrl) {
        console.log("[getSongCover] 未找到图片字段，歌曲数据:", JSON.stringify(song).substring(0, 300));
      } else {
        console.log("[getSongCover] 找到图片字段:", coverUrl);
        if (songId) {
          songCoverUrlCache.set(songId, coverUrl);
        }
      }
      if (!coverUrl)
        return "";
      return coverUrl;
    };
    const handleRecentSongImageError = (event, song) => {
      var _a;
      if (!song || !song.id)
        return;
      const songId = song.id;
      let currentUrl = songCoverUrlCache.get(songId);
      if (!currentUrl) {
        const source = song.source || song.sourceId;
        currentUrl = utils_musicPic.getSongPicUrl(song, source) || song.picUrl || ((_a = song.al) == null ? void 0 : _a.picUrl) || song.img;
        if (!currentUrl) {
          console.log("[handleRecentSongImageError] 无法获取图片 URL");
          return;
        }
      }
      let currentProxyIndex = 0;
      if (currentUrl.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (currentUrl.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (currentUrl.includes("jina.ai"))
        currentProxyIndex = 3;
      console.log("[handleRecentSongImageError] 图片加载失败，当前代理索引:", currentProxyIndex, "URL:", currentUrl);
      const nextUrl = utils_imageProxy.handleImageError(event, currentUrl, currentProxyIndex);
      if (nextUrl) {
        songCoverUrlCache.set(songId, nextUrl);
        console.log("[handleRecentSongImageError] 切换到下一个代理:", nextUrl);
      }
    };
    const goToSettings = () => {
      common_vendor.index.navigateTo({
        url: "/pages/settings/index"
      });
    };
    const handleMyImageError = (event, item, field) => {
      if (!item || !item[field])
        return;
      const originalUrl = item[field];
      let currentProxyIndex = 0;
      if (originalUrl.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (originalUrl.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (originalUrl.includes("jina.ai"))
        currentProxyIndex = 3;
      const nextUrl = utils_imageProxy.handleImageError(event, originalUrl, currentProxyIndex);
      if (nextUrl) {
        item[field] = nextUrl;
      }
    };
    const viewAllPlaylists = () => {
      common_vendor.index.navigateTo({
        url: "/pages/playlist/list"
      });
    };
    const viewAllRecentPlayed = () => {
      const playHistory = store_modules_player.playerStore.getState().playHistory || [];
      if (playHistory.length === 0) {
        common_vendor.index.showToast({
          title: "暂无播放记录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.setStorageSync("recent_play_list", playHistory);
      common_vendor.index.navigateTo({
        url: "/pages/sharelist/index?mode=recent&fromMyMusic=true"
      });
    };
    const viewAllDeleted = () => {
      const deletedList = safeParse(common_vendor.index.getStorageSync("deleted_songs"), []);
      if (deletedList.length === 0) {
        common_vendor.index.showToast({
          title: "暂无删除记录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.setStorageSync("deleted_play_list", deletedList);
      common_vendor.index.navigateTo({
        url: "/pages/sharelist/index?mode=deleted&fromMyMusic=true"
      });
    };
    const openRecentPlaylist = (playlist) => {
      if (!playlist)
        return;
      console.log("[My] 打开最近播放歌单:", playlist);
      const source = playlist.source || "";
      const id = playlist.id || "";
      let link = playlist.link || "";
      if (!link) {
        let cleanId = id;
        if (id.includes("kw_digest-")) {
          cleanId = id.replace("kw_", "");
        } else if (source === "tx" && id.includes("_")) {
          cleanId = id.split("_")[1] || id;
        }
        switch (source) {
          case "kw":
            if (cleanId.includes("digest-")) {
              link = cleanId;
            } else {
              link = `https://www.kuwo.cn/playlist_detail/${cleanId}`;
            }
            break;
          case "kg":
            link = `https://www.kugou.com/yy/special/single/${cleanId}.html`;
            break;
          case "tx":
            link = `https://y.qq.com/n/ryqq/playlist/${cleanId}`;
            break;
          case "wy":
            link = `https://music.163.com/playlist?id=${cleanId}`;
            break;
          case "mg":
            link = `https://music.migu.cn/v3/music/playlist/${cleanId}`;
            break;
          default:
            link = cleanId;
        }
      }
      console.log("[My] 最终跳转 link:", link);
      common_vendor.index.navigateTo({
        url: `/pages/sharelist/index?source=${source}&link=${encodeURIComponent(link)}&id=${encodeURIComponent(id)}&picUrl=${encodeURIComponent(playlist.coverUrl || "")}&name=${encodeURIComponent(playlist.name || "")}&fromName=my`
      });
    };
    const openPlaylist = (playlist) => {
      if (!playlist)
        return;
      if (playlist.source === "default") {
        common_vendor.index.navigateTo({
          url: `/pages/sharelist/index?mode=default&fromMyMusic=true`
        });
        return;
      }
      if (playlist.source === "love") {
        common_vendor.index.navigateTo({
          url: `/pages/sharelist/index?mode=love&fromMyMusic=true`
        });
        return;
      }
      if (playlist.source === "user") {
        common_vendor.index.navigateTo({
          url: `/pages/sharelist/index?mode=user&fromMyMusic=true&playlistId=${encodeURIComponent(playlist.id)}&playlistName=${encodeURIComponent(playlist.name)}`
        });
        return;
      }
      if (playlist.source === "imported") {
        const idParts = playlist.id.split("__");
        const platform = idParts[0] || "tx";
        const playlistId = idParts[1] || playlist.id;
        const platformNames = {
          "wy": "网易云音乐",
          "tx": "QQ音乐",
          "kg": "酷狗音乐",
          "kw": "酷我音乐",
          "mg": "咪咕音乐"
        };
        common_vendor.index.navigateTo({
          url: `/pages/sharelist/index?source=${platform}&link=${encodeURIComponent(playlistId)}&platform=${encodeURIComponent(platformNames[platform] || platform)}&preview=true&fromMyMusic=true&playlistId=${encodeURIComponent(playlist.id)}&coverUrl=${encodeURIComponent(playlist.coverUrl)}&playlistName=${encodeURIComponent(playlist.name)}`
        });
      }
    };
    const playSong = async (song) => {
      if (!song)
        return;
      await utils_playSong.playSongCommon(song, {
        addToDefaultList: true,
        source: song.source || "tx"
      });
    };
    const createPlaylist = () => {
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
            const newList = store_modules_list.listStore.createUserList(name);
            if (newList) {
              getMyPlaylists();
              common_vendor.index.showToast({ title: "创建成功", icon: "success" });
            } else {
              common_vendor.index.showToast({ title: "创建失败", icon: "none" });
            }
          }
        }
      });
    };
    const platforms = [
      { name: "网易云音乐", source: "wy" },
      { name: "QQ音乐", source: "tx" },
      { name: "酷狗音乐", source: "kg" },
      { name: "酷我音乐", source: "kw" },
      { name: "咪咕音乐", source: "mg" }
    ];
    const showImportModal = common_vendor.ref(false);
    const importModalTitle = common_vendor.ref("");
    const importLink = common_vendor.ref("");
    const currentImportSource = common_vendor.ref("");
    const currentImportPlatform = common_vendor.ref("");
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
    composables_usePageLifecycle.usePageLifecycle(
      () => props.isActive,
      {
        onInit: () => {
          console.log("[My] 页面初始化");
          const storedStats = common_vendor.index.getStorageSync("userStats") || {};
          stats.value = storedStats;
          getMyPlaylists();
          refreshAllSongCount();
        },
        onActivated: () => {
          console.log("[My] 页面激活，重新加载数据");
          if (checkMiniPlayerStatusFromComposable) {
            checkMiniPlayerStatusFromComposable();
          }
          console.log("[My] 底部高度:", totalBottomHeight.value);
          const storedStats = common_vendor.index.getStorageSync("userStats") || {};
          stats.value = storedStats;
          console.log("[My] 从Storage读取今日时长:", stats.value.listenTime);
          console.log("[My] 从Storage读取最爱歌手:", stats.value.favoriteSinger);
          darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
          utils_system.setStatusBarTextColor(darkMode.value ? "light" : "dark");
          getMyPlaylists();
          refreshAllSongCount();
          const playHistory = store_modules_player.playerStore.getState().playHistory || [];
          console.log("[My] 最近播放数据数量:", playHistory.length);
          const deletedList = safeParse(common_vendor.index.getStorageSync("deleted_songs"), []);
          console.log("[My] 最近删除数据数量:", deletedList.length);
          setTimeout(() => {
            myPlaylists.value = [...myPlaylists.value];
          }, 100);
          console.log("[My] 页面激活完成 - 底部高度:", totalBottomHeight.value);
        },
        onDeactivated: () => {
          console.log("[My] 页面停用");
        }
      }
    );
    const handleThemeChanged = (data) => {
      console.log("[My] 收到主题变化事件:", data);
      darkMode.value = data.isDark;
      utils_system.setStatusBarTextColor(data.isDark ? "light" : "dark");
    };
    common_vendor.onMounted(() => {
      common_vendor.index.$on("themeChanged", handleThemeChanged);
      console.log("[My] 已注册主题变化监听");
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("themeChanged", handleThemeChanged);
      console.log("[My] 已移除主题变化监听");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.s(statusBarStyle.value),
        b: common_vendor.p({
          name: "gear",
          size: "20",
          color: "#6b7280"
        }),
        c: common_vendor.o(goToSettings, "19"),
        d: common_vendor.t(formatAllSongs.value),
        e: common_vendor.o(viewAllPlaylists, "2b"),
        f: common_vendor.t(formatNumber(stats.value.listenCount)),
        g: common_vendor.t(formatListenTime.value),
        h: common_vendor.t(favoriteSingerText.value),
        i: common_vendor.t(myPlaylists.value.length || 0),
        j: common_vendor.p({
          name: "plus",
          size: "16",
          color: "#6b7280"
        }),
        k: common_vendor.o(createPlaylist, "f9"),
        l: common_vendor.p({
          name: "link",
          size: "16",
          color: "#6b7280"
        }),
        m: common_vendor.o(importPlaylist, "7f"),
        n: common_vendor.f(sortedAllPlaylists.value, (playlist, index, i0) => {
          return common_vendor.e({
            a: playlist.playlistType === "default"
          }, playlist.playlistType === "default" ? {
            b: "b8b638b4-3-" + i0,
            c: common_vendor.p({
              name: "headphones",
              size: "32",
              color: "#ffffff"
            }),
            d: generateGradientBackground("试听列表", "playlist")
          } : playlist.playlistType === "favorite" ? common_vendor.e({
            f: playlist.coverUrl && playlist.coverUrl !== "/static/logo.png"
          }, playlist.coverUrl && playlist.coverUrl !== "/static/logo.png" ? {
            g: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlist.coverUrl),
            h: common_vendor.o(($event) => handleMyImageError($event, playlist, "coverUrl"), playlist.id + "-" + playlist.playlistType)
          } : {
            i: "b8b638b4-4-" + i0,
            j: common_vendor.p({
              name: "heart",
              size: "32",
              color: "#ffffff"
            }),
            k: generateGradientBackground(playlist.name || "我的收藏", "playlist")
          }) : common_vendor.e({
            l: playlist.coverUrl && playlist.coverUrl !== "/static/logo.png"
          }, playlist.coverUrl && playlist.coverUrl !== "/static/logo.png" ? {
            m: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlist.coverUrl),
            n: common_vendor.o(($event) => handleMyImageError($event, playlist, "coverUrl"), playlist.id + "-" + playlist.playlistType)
          } : {
            o: "b8b638b4-5-" + i0,
            p: common_vendor.p({
              name: "music",
              size: "32",
              color: "#ffffff"
            }),
            q: generateGradientBackground(playlist.name, "playlist")
          }, {
            r: getPlaylistSourceName(playlist)
          }, getPlaylistSourceName(playlist) ? {
            s: common_vendor.t(getPlaylistSourceName(playlist))
          } : {}), {
            e: playlist.playlistType === "favorite",
            t: isPlaylistPlaying(playlist)
          }, isPlaylistPlaying(playlist) ? {} : {}, {
            v: common_vendor.t(playlist.playlistType === "default" ? "试听列表" : playlist.name || "我的收藏"),
            w: common_vendor.t(playlist.songCount || 0),
            x: playlist.playlistType === "favorite"
          }, playlist.playlistType === "favorite" ? {
            y: "b8b638b4-6-" + i0,
            z: common_vendor.p({
              name: "heart",
              size: "12",
              color: "#ff6687"
            })
          } : {}, {
            A: playlist.id + "-" + playlist.playlistType,
            B: isPlaylistPlaying(playlist) ? 1 : "",
            C: playlist.playlistType === "favorite" ? 1 : "",
            D: common_vendor.o(($event) => openPlaylist(playlist), playlist.id + "-" + playlist.playlistType)
          });
        }),
        o: common_vendor.t(recentSongsCount.value),
        p: common_vendor.f(recentSongs.value, (song, index, i0) => {
          return common_vendor.e({
            a: getSongCover(song)
          }, getSongCover(song) ? {
            b: getSongCover(song),
            c: common_vendor.o(($event) => handleRecentSongImageError($event, song), song.id)
          } : {
            d: "b8b638b4-7-" + i0,
            e: common_vendor.p({
              name: "music",
              size: "24",
              color: "#ffffff"
            }),
            f: generateGradientBackground(song.name, "song")
          }, {
            g: isSongPlaying(song)
          }, isSongPlaying(song) ? {} : {
            h: "b8b638b4-8-" + i0,
            i: common_vendor.p({
              name: "play",
              size: "16",
              color: "#ffffff"
            })
          }, {
            j: common_vendor.t(song.name),
            k: common_vendor.t(formatArtists(song)),
            l: common_vendor.t(formatAlbumName(song)),
            m: song.id,
            n: isSongPlaying(song) ? 1 : "",
            o: common_vendor.o(($event) => playSong(song), song.id)
          });
        }),
        q: common_vendor.p({
          name: "chevron-right",
          size: "12",
          color: "#8a8a8a"
        }),
        r: common_vendor.o(viewAllRecentPlayed, "6f"),
        s: recentPlaylistHistory.value.length > 0
      }, recentPlaylistHistory.value.length > 0 ? {
        t: common_vendor.t(recentPlaylistHistoryCount.value),
        v: common_vendor.f(recentPlaylistHistory.value, (playlist, index, i0) => {
          return common_vendor.e({
            a: playlist.coverUrl && playlist.coverUrl !== "/static/logo.png"
          }, playlist.coverUrl && playlist.coverUrl !== "/static/logo.png" ? {
            b: common_vendor.unref(utils_imageProxy.proxyImageUrl)(playlist.coverUrl)
          } : {
            c: "b8b638b4-10-" + i0,
            d: common_vendor.p({
              name: "music",
              size: "32",
              color: "#ffffff"
            }),
            e: generateGradientBackground(playlist.name, "playlist")
          }, {
            f: isRecentPlaylistPlaying(playlist)
          }, isRecentPlaylistPlaying(playlist) ? {} : {}, {
            g: common_vendor.t(playlist.name),
            h: common_vendor.t(playlist.trackCount || 0),
            i: playlist.id + "_" + playlist.source,
            j: isRecentPlaylistPlaying(playlist) ? 1 : "",
            k: common_vendor.o(($event) => openRecentPlaylist(playlist), playlist.id + "_" + playlist.source)
          });
        })
      } : {}, {
        w: common_vendor.t(deletedSongsCount.value),
        x: common_vendor.f(deletedSongs.value, (song, index, i0) => {
          return common_vendor.e({
            a: getSongCover(song)
          }, getSongCover(song) ? {
            b: getSongCover(song)
          } : {
            c: "b8b638b4-11-" + i0,
            d: common_vendor.p({
              name: "music",
              size: "24",
              color: "#ffffff"
            }),
            e: generateGradientBackground(song.name, "song")
          }, {
            f: "b8b638b4-12-" + i0,
            g: common_vendor.t(song.name),
            h: common_vendor.t(song.type || "歌曲"),
            i: common_vendor.t(formatArtists(song)),
            j: song.id,
            k: common_vendor.o(($event) => playSong(song), song.id)
          });
        }),
        y: common_vendor.p({
          name: "play",
          size: "16",
          color: "#ffffff"
        }),
        z: common_vendor.p({
          name: "chevron-right",
          size: "12",
          color: "#8a8a8a"
        }),
        A: common_vendor.o(viewAllDeleted, "d7"),
        B: common_vendor.s(safeBottomStyle.value),
        C: common_vendor.s(scrollContainerStyle.value),
        D: showImportModal.value
      }, showImportModal.value ? {
        E: common_vendor.t(importModalTitle.value),
        F: common_vendor.p({
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        G: common_vendor.o(closeImportModal, "fd"),
        H: importLink.value,
        I: common_vendor.o(($event) => importLink.value = $event.detail.value, "8d"),
        J: common_vendor.o(closeImportModal, "92"),
        K: common_vendor.o(confirmImport, "11"),
        L: common_vendor.o(() => {
        }, "51"),
        M: common_vendor.o(closeImportModal, "62")
      } : {}, {
        N: darkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b8b638b4"]]);
exports.MiniProgramPage = MiniProgramPage;
