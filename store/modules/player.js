"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api_music = require("../../utils/api/music.js");
const utils_musicUrlCache = require("../../utils/musicUrlCache.js");
const utils_playInfoStorage = require("../../utils/playInfoStorage.js");
const utils_musicSwitchSourceStorage = require("../../utils/musicSwitchSourceStorage.js");
const utils_musicParams = require("../../utils/musicParams.js");
const store_modules_list = require("./list.js");
const store_modules_user = require("./user.js");
const store_modules_system = require("./system.js");
const utils_lyricCache = require("../../utils/lyricCache.js");
const PLAY_MODE_ICONS = {
  [store_modules_list.PLAY_MODE.listLoop]: "repeat",
  // 列表循环 - repeat 图标
  [store_modules_list.PLAY_MODE.random]: "shuffle",
  // 随机播放 - shuffle 图标
  [store_modules_list.PLAY_MODE.list]: "arrow-right-arrow-left",
  // 顺序播放 - 双向箭头图标
  [store_modules_list.PLAY_MODE.singleLoop]: "rotate-right",
  // 单曲循环 - 旋转箭头图标
  [store_modules_list.PLAY_MODE.none]: "ban"
  // 禁用 - 禁止图标
};
const state = common_vendor.reactive({
  // 当前播放歌曲信息
  currentSong: {
    id: 0,
    name: "暂无播放歌曲",
    ar: [{ name: "未知歌手" }],
    al: { picUrl: "/static/images/default-cover.png" },
    // 添加更多字段以兼容不同数据结构
    album: { picUrl: "/static/images/default-cover.png", name: "未知专辑" },
    img: "/static/images/default-cover.png",
    pic: "/static/images/default-cover.png",
    source: "",
    sourceId: ""
  },
  // 原始歌曲信息（用于评论功能，避免换源后无法获取原始歌曲的评论）
  originalSong: null,
  // 播放列表
  playlist: [],
  // 播放历史
  playHistory: [],
  // 播放模式 - 默认列表循环，与洛雪音乐移动版一致
  playMode: store_modules_list.PLAY_MODE.listLoop,
  // 播放状态
  playing: false,
  // 当前播放时间(秒)
  currentTime: 0,
  // 歌曲总时长(秒)
  duration: 0,
  // 音频上下文
  audioContext: null,
  // 音质选择
  audioQuality: "standard",
  // 显示迷你播放器
  showMiniPlayer: true,
  // 显示全屏播放器
  showFullPlayer: false,
  // 加载状态
  isLoading: false,
  // 错误信息
  error: null,
  // 歌词信息 - 从API获取后保存在这里，player页面直接使用
  lyric: "",
  tlyric: "",
  rlyric: "",
  lxlyric: "",
  // 播放结束回调 - 用于外部处理自动下一首
  onPlayEndedCallback: null,
  // 上次保存播放信息的时间（用于节流）
  lastSaveTime: 0,
  // 预加载状态
  isPreloading: false,
  // 缓存大小设置（MB）
  cacheSize: 512,
  // 是否启用预加载
  enablePreload: true,
  // 上次统计时间（用于播放时长统计）
  lastStatsTime: 0,
  // URL刷新重试次数
  retryNum: 0,
  // 播放下一首重试次数（用于自动跳过失败歌曲）
  playNextRetryCount: 0,
  // 加载超时定时器
  loadTimeout: null,
  // 快速检测超时定时器（5秒，用于缓存URL的快速检测）
  quickCheckTimeout: null,
  // 是否正在刷新URL
  isRefreshingUrl: false,
  // 上一次刷新URL时使用的歌曲ID
  lastRefreshSongId: null,
  // 状态文本（用于MiniPlayer显示歌词或状态信息）
  statusText: "",
  // 是否使用缓存的URL播放
  isUsingCachedUrl: false,
  // 是否正在获取播放URL
  isGettingUrl: false,
  // 待播放的歌曲（用于处理快速切换）
  pendingSong: null
});
function formatTime(time) {
  time = Math.floor(time);
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
const playerStore = {
  // 获取响应式状态 - 用于在Vue组件中使用
  get state() {
    return common_vendor.readonly(state);
  },
  // 获取状态 - 兼容旧代码
  getState() {
    return state;
  },
  // 设置状态
  setState(newState) {
    Object.assign(state, newState);
  },
  // 设置状态文本（用于MiniPlayer显示歌词或状态信息）
  setStatusText(text, duration = 3e3) {
    state.statusText = text;
    if (duration > 0) {
      setTimeout(() => {
        if (state.statusText === text) {
          state.statusText = "";
        }
      }, duration);
    }
  },
  // 清除状态文本
  clearStatusText() {
    state.statusText = "";
  },
  // 更新待播放的歌曲（用于处理快速切换）
  updatePendingSong(song) {
    state.pendingSong = song;
    console.log("[playerStore] 更新待播放歌曲:", song == null ? void 0 : song.name);
  },
  // 设置正在获取URL状态
  setGettingUrl(isGetting) {
    state.isGettingUrl = isGetting;
    console.log("[playerStore] 设置isGettingUrl:", isGetting);
  },
  // 播放进度百分比
  get progressPercent() {
    return state.duration ? Math.floor(state.currentTime / state.duration * 100) : 0;
  },
  // 格式化当前播放时间
  get formattedCurrentTime() {
    return formatTime(state.currentTime);
  },
  // 格式化总时长
  get formattedDuration() {
    return formatTime(state.duration);
  },
  // 是否有上一首
  get hasPrev() {
    return state.playlist.length > 1;
  },
  // 是否有下一首
  get hasNext() {
    return state.playlist.length > 1;
  },
  // 初始化音频上下文
  initAudioContext() {
    if (!state.audioContext) {
      state.audioContext = common_vendor.index.getBackgroundAudioManager();
      console.log("[initAudioContext] 使用 BackgroundAudioManager");
    }
  },
  // 设置音频事件监听
  setupAudioEventListeners() {
    const audio = state.audioContext;
    if (!audio)
      return;
    audio.onPlay(() => {
      console.log("[BackgroundAudio] onPlay");
      state.playing = true;
      this.clearLoadTimeout();
      this.clearQuickCheckTimeout();
      this.clearStatusText();
      state.playNextRetryCount = 0;
      state.isUsingCachedUrl = false;
    });
    audio.onPause(() => {
      console.log("[BackgroundAudio] onPause");
      state.playing = false;
    });
    audio.onStop(() => {
      console.log("[BackgroundAudio] onStop");
      state.playing = false;
      state.currentTime = 0;
    });
    audio.onEnded(() => {
      console.log("[BackgroundAudio] onEnded");
      console.log("[playerStore] this.handlePlayEnded 类型:", typeof this.handlePlayEnded);
      if (typeof this.handlePlayEnded === "function") {
        void this.handlePlayEnded();
      } else {
        console.error("[playerStore] handlePlayEnded 不是函数!");
      }
    });
    audio.onTimeUpdate(() => {
      var _a;
      state.currentTime = audio.currentTime;
      state.duration = audio.duration;
      const now = Date.now();
      if (!state.lastSaveTime || now - state.lastSaveTime > 5e3) {
        state.lastSaveTime = now;
        let playerListId = store_modules_list.listStore.state.playInfo.playerListId || store_modules_list.LIST_IDS.DEFAULT;
        let playIndex = store_modules_list.listStore.state.playInfo.playIndex ?? 0;
        if (playerListId === store_modules_list.LIST_IDS.TEMP && ((_a = store_modules_list.listStore.state.tempList.meta) == null ? void 0 : _a.id)) {
          playerListId = store_modules_list.listStore.state.tempList.meta.id;
        }
        utils_playInfoStorage.savePlayInfo({
          time: Math.floor(state.currentTime),
          maxTime: Math.floor(state.duration),
          listId: playerListId,
          index: playIndex
        });
      }
      if (state.enablePreload && state.duration > 10) {
        const remainingTime = state.duration - state.currentTime;
        if (remainingTime < 10 && remainingTime > 5 && !state.isPreloading) {
          void this.preloadNextSong();
        }
      }
      const currentTime = Date.now();
      if (!state.lastStatsTime || currentTime - state.lastStatsTime > 3e4) {
        state.lastStatsTime = currentTime;
        store_modules_user.userStore.increaseListenTime(0.5);
      }
    });
    audio.onPrev(() => {
      console.log("[BackgroundAudio] onPrev");
      this.playPrev();
    });
    audio.onNext(() => {
      console.log("[BackgroundAudio] onNext");
      this.playNext();
    });
    audio.onError((err) => {
      console.error("[BackgroundAudio] onError:", err);
      state.error = err.errMsg || "播放错误";
      state.isLoading = false;
      state.playing = false;
      this.setStatusText("播放出错，正在重试...", 0);
      this.clearLoadTimeout();
      console.log("[BackgroundAudio] onError - 错误码:", err.errCode);
      if (err.errCode !== 1 && state.retryNum < 2) {
        console.log("[BackgroundAudio] onError - 准备刷新URL");
        this.refreshMusicUrl();
      } else {
        common_vendor.index.showToast({
          title: "播放失败，正在切换下一首...",
          icon: "none"
        });
        setTimeout(() => {
          this.handlePlayEndedDefault();
        }, 1500);
      }
    });
  },
  // 设置当前歌曲信息（不播放，用于立即更新UI显示）
  // showLoading: 是否显示"正在获取播放链接..."状态，默认true
  setCurrentSong(song, showLoading = true) {
    if (!song)
      return;
    console.log("[setCurrentSong] 设置歌曲:", song.name, "ID:", song.id, "showLoading:", showLoading);
    state.currentSong = song;
    state.isLoading = showLoading;
    state.error = null;
    state.playing = false;
  },
  // 播放指定歌曲
  async playSong(song) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D;
    if (!song) {
      console.error("[playSong] song is null or undefined");
      return;
    }
    if (state.pendingSong && state.pendingSong.id !== song.id) {
      console.log("[playSong] 发现待播放歌曲，使用待播放歌曲:", state.pendingSong.name);
      song = state.pendingSong;
      state.pendingSong = null;
    }
    console.log("[playSong] ========== 开始播放歌曲 ==========");
    console.log("[playSong] 歌曲ID:", song.id);
    console.log("[playSong] 歌曲名称:", song.name);
    if (!state.originalSong || state.originalSong.id !== song.id) {
      state.originalSong = { ...song };
      console.log("[playSong] 保存原始歌曲信息:", song.name, "source:", song.source);
    }
    if (state.currentSong && state.currentSong.id !== song.id) {
      common_vendor.index.$emit("songChanging");
    }
    this.initAudioContext();
    console.log("[playSong] 检查是否同一首歌:");
    console.log("[playSong] state.currentSong?.id:", (_a = state.currentSong) == null ? void 0 : _a.id);
    console.log("[playSong] song.id:", song.id);
    console.log("[playSong] song.url:", song.url ? "有" : "无");
    const isSameSong = state.currentSong && state.currentSong.id === song.id && !song.url && !song.playUrl;
    console.log("[playSong] isSameSong:", isSameSong);
    if (isSameSong) {
      console.log("[playSong] 是同一首歌，检查是否需要继续播放");
      if (state.playing) {
        console.log("[playSong] 当前正在播放同一首歌，不做任何操作");
        return;
      }
      if (state.audioContext && state.audioContext.src) {
        console.log("[playSong] 当前暂停中，继续播放");
        state.audioContext.play();
        return;
      }
    }
    if (state.audioContext && (state.playing || state.audioContext.src)) {
      console.log("[playSong] 停止当前播放的歌曲");
      try {
        state.audioContext.stop();
      } catch (e) {
        console.log("[playSong] 停止当前播放的歌曲失败（可能已停止）:", e.message);
      }
    }
    state.currentSong = song;
    state.isLoading = true;
    state.error = null;
    state.retryNum = 0;
    state.lastRefreshSongId = song.id;
    state.isUsingCachedUrl = false;
    this.clearLoadTimeout();
    this.clearQuickCheckTimeout();
    console.log("[playSong] state.currentSong.id:", (_b = state.currentSong) == null ? void 0 : _b.id);
    console.log("[playSong] state.currentSong.img:", (_c = state.currentSong) == null ? void 0 : _c.img);
    console.log("[playSong] state.currentSong.picUrl:", (_d = state.currentSong) == null ? void 0 : _d.picUrl);
    console.log("[playSong] state.currentSong.al?.picUrl:", (_f = (_e = state.currentSong) == null ? void 0 : _e.al) == null ? void 0 : _f.picUrl);
    state.lyric = song.lyric || "";
    state.tlyric = song.tlyric || "";
    state.rlyric = song.rlyric || "";
    state.lxlyric = song.lxlyric || "";
    console.log("[playSong] 保存歌词信息到state:", {
      lyricLength: (_g = state.lyric) == null ? void 0 : _g.length,
      tlyricLength: (_h = state.tlyric) == null ? void 0 : _h.length,
      rlyricLength: (_i = state.rlyric) == null ? void 0 : _i.length,
      lxlyricLength: (_j = state.lxlyric) == null ? void 0 : _j.length
    });
    try {
      let playUrl = null;
      const qualityMap = {
        "standard": "320k",
        "high": "flac",
        "lossless": "flac24bit",
        "low": "128k"
      };
      const actualQuality = qualityMap[state.audioQuality] || "320k";
      const songKey = String(song.id).replace(/^(tx|wy|kg|kw|mg)_/, "") || song.id;
      const switchInfo = utils_musicSwitchSourceStorage.getMusicSwitchSourceById(songKey);
      if (switchInfo && switchInfo.newSource) {
        console.log("[playSong] 发现保存的换源信息, 原source:", song.source, "换源后:", switchInfo.newSource);
        song.source = switchInfo.newSource;
        if (switchInfo.newSongId) {
          song.id = switchInfo.newSongId;
        }
        if (switchInfo.newSongName) {
          song.name = switchInfo.newSongName;
        }
        if (switchInfo.newSongSinger) {
          song.singer = switchInfo.newSongSinger;
        }
        const sourceNameMap = {
          "tx": "QQ音乐",
          "wy": "网易云音乐",
          "kg": "酷狗音乐",
          "kw": "酷我音乐",
          "mg": "咪咕音乐"
        };
        const newSourceName = sourceNameMap[switchInfo.newSource] || switchInfo.newSource;
        this.setStatusText(`已恢复换源: ${newSourceName}`, 3e3);
      }
      if (!playUrl && (song.url || song.playUrl)) {
        playUrl = song.url || song.playUrl;
        console.log("[playSong] 使用歌曲自带的URL:", playUrl);
        await utils_musicUrlCache.setCachedMusicUrl(song.id, actualQuality, playUrl, song.source);
        console.log("[playSong] 已将URL保存到缓存");
        state.isUsingCachedUrl = true;
      }
      if (!playUrl) {
        const cachedUrl = await utils_musicUrlCache.getCachedMusicUrl(song.id, actualQuality, song.source);
        if (cachedUrl) {
          console.log("[playSong] 使用缓存的播放URL:", cachedUrl);
          playUrl = cachedUrl;
          state.isUsingCachedUrl = true;
        }
      }
      if (playUrl) {
        console.log("[playSong] 最终使用播放URL:", playUrl);
        this.setStatusText("尝试播放歌曲...", 0);
        const secureUrl = playUrl;
        let coverImgUrl = ((_k = song.al) == null ? void 0 : _k.picUrl) || ((_l = song.album) == null ? void 0 : _l.picUrl) || song.img || "";
        if (coverImgUrl) {
          coverImgUrl = coverImgUrl.replace(/^http:/, "https:");
        }
        console.log("[playSong] 设置背景音频属性:", {
          title: song.name || "未知歌曲",
          singer: this.formatArtists(song),
          coverImgUrl,
          epname: ((_m = song.al) == null ? void 0 : _m.name) || ((_n = song.album) == null ? void 0 : _n.name) || "未知专辑",
          src: secureUrl
        });
        state.audioContext.title = song.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(song);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_o = song.al) == null ? void 0 : _o.name) || ((_p = song.album) == null ? void 0 : _p.name) || "未知专辑";
        state.audioContext.src = secureUrl;
        this.startLoadTimeout();
        if (state.isUsingCachedUrl) {
          this.startQuickCheckTimeout();
        }
        console.log("[playSong] 背景音频src已设置，开始播放");
        state.currentSong = {
          ...state.currentSong,
          url: playUrl,
          playUrl
        };
        console.log("[playSong] 已更新当前歌曲URL到state.currentSong（使用缓存URL）");
        state.showMiniPlayer = true;
        state.isLoading = false;
        state.isGettingUrl = false;
      } else {
        console.log("[playSong] 歌曲没有已有URL，调用API获取");
        console.log("[playSong] 用户选择的音质:", state.audioQuality);
        console.log("[playSong] 实际使用的音质:", actualQuality);
        this.setStatusText("正在获取播放链接...", 0);
        const result = await utils_api_music.getMusicUrl(song, actualQuality);
        console.log("[playSong] API获取成功");
        console.log("[playSong] URL:", result.url);
        console.log("[playSong] 音质:", result.type);
        this.clearStatusText();
        state.isGettingUrl = false;
        if (result.fallback && result.fallback.toggled) {
          const sourceNameMap = {
            "tx": "QQ音乐",
            "wy": "网易云音乐",
            "kg": "酷狗音乐",
            "kw": "酷我音乐",
            "mg": "咪咕音乐"
          };
          const originalName = sourceNameMap[result.fallback.originalSource] || result.fallback.originalSource;
          const newName = sourceNameMap[result.fallback.newSource] || result.fallback.newSource;
          this.setStatusText(`已从${originalName}换源到${newName}`, 3e3);
          const updatedSong = {
            ...song,
            source: result.fallback.newSource,
            _toggleMusicInfo: {
              originalSource: result.fallback.originalSource,
              newSource: result.fallback.newSource,
              matchedSong: result.fallback.matchedSong,
              toggleTime: Date.now()
            }
          };
          if (result.fallback.matchedSong) {
            updatedSong.songmid = result.fallback.matchedSong.songmid || song.songmid;
            updatedSong.hash = result.fallback.matchedSong.hash || song.hash;
            updatedSong.copyrightId = result.fallback.matchedSong.copyrightId || song.copyrightId;
            updatedSong.id = result.fallback.matchedSong.id || song.id;
          }
          state.currentSong = updatedSong;
          console.log("[playSong] 已更新歌曲换源信息");
          const originalSongId = String(song.id).replace(/^(tx|wy|kg|kw|mg)_/, "") || song.id;
          const switchInfo2 = {
            originalSource: result.fallback.originalSource,
            newSource: result.fallback.newSource,
            newSongId: ((_q = result.fallback.matchedSong) == null ? void 0 : _q.id) || song.id,
            newSongName: ((_r = result.fallback.matchedSong) == null ? void 0 : _r.name) || song.name,
            newSongSinger: ((_s = result.fallback.matchedSong) == null ? void 0 : _s.singer) || song.singer,
            quality: actualQuality
          };
          utils_musicSwitchSourceStorage.saveMusicSwitchSource(originalSongId, switchInfo2);
          console.log("[playSong] 已保存换源信息到本地存储:", result.fallback.originalSource, "->", result.fallback.newSource);
        }
        const cacheSongId = ((_u = (_t = result.fallback) == null ? void 0 : _t.matchedSong) == null ? void 0 : _u.id) || song.id;
        const cacheSource = ((_w = (_v = result.fallback) == null ? void 0 : _v.matchedSong) == null ? void 0 : _w.source) || song.source;
        await utils_musicUrlCache.setCachedMusicUrl(cacheSongId, actualQuality, result.url, cacheSource);
        state.currentSong = {
          ...state.currentSong,
          url: result.url,
          playUrl: result.url
        };
        console.log("[playSong] 已更新当前歌曲URL到state.currentSong");
        const secureUrl = result.url;
        let coverImgUrl = ((_x = song.al) == null ? void 0 : _x.picUrl) || ((_y = song.album) == null ? void 0 : _y.picUrl) || song.img || "";
        if (coverImgUrl) {
          coverImgUrl = coverImgUrl.replace(/^http:/, "https:");
        }
        console.log("[playSong] 设置背景音频属性:", {
          title: song.name || "未知歌曲",
          singer: this.formatArtists(song),
          coverImgUrl,
          epname: ((_z = song.al) == null ? void 0 : _z.name) || ((_A = song.album) == null ? void 0 : _A.name) || "未知专辑",
          src: secureUrl
        });
        state.audioContext.title = song.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(song);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_B = song.al) == null ? void 0 : _B.name) || ((_C = song.album) == null ? void 0 : _C.name) || "未知专辑";
        state.audioContext.src = secureUrl;
        this.startLoadTimeout();
        console.log("[playSong] 背景音频src已设置，开始播放");
      }
      this.addToHistory(song);
      const singerName = this.formatArtists(song);
      store_modules_user.userStore.increaseListenCount(singerName);
      state.showMiniPlayer = true;
      state.isLoading = false;
      let playerListId = store_modules_list.listStore.state.playInfo.playerListId || store_modules_list.LIST_IDS.DEFAULT;
      let playIndex = store_modules_list.listStore.state.playInfo.playIndex ?? 0;
      if (playerListId === store_modules_list.LIST_IDS.TEMP && ((_D = store_modules_list.listStore.state.tempList.meta) == null ? void 0 : _D.id)) {
        playerListId = store_modules_list.listStore.state.tempList.meta.id;
      }
      utils_playInfoStorage.savePlayInfo({
        time: 0,
        maxTime: 0,
        listId: playerListId,
        index: playIndex
      });
      this.loadLyricsForSong(song);
    } catch (error) {
      console.error("[playSong] 播放歌曲失败:", error);
      console.error("[playSong] 错误信息:", error.message);
      state.isLoading = false;
      state.error = error.message || "播放失败";
      state.isGettingUrl = false;
      this.clearLoadTimeout();
      this.clearQuickCheckTimeout();
      console.log("[playSong] 播放失败，自动切换下一首");
      this.handlePlayEnded();
    }
  },
  // 暂停播放
  pause() {
    console.log("[pause] 暂停播放");
    if (state.audioContext) {
      state.audioContext.pause();
    }
    state.playing = false;
    state.isPlaying = false;
  },
  // 停止播放
  stop() {
    console.log("[stop] 停止播放");
    if (state.audioContext) {
      try {
        state.audioContext.stop();
      } catch (e) {
        console.log("[stop] 停止失败:", e.message);
      }
    }
    state.playing = false;
    state.currentTime = 0;
  },
  // 继续播放
  resume() {
    console.log("[resume] 继续播放, 当前 playing 状态:", state.playing);
    if (state.audioContext && !state.playing) {
      state.audioContext.play();
      state.playing = true;
    }
  },
  // 切换播放/暂停
  togglePlay() {
    if (state.playing) {
      this.pause();
    } else {
      this.resume();
    }
  },
  // 切换播放模式 - 与洛雪音乐移动版一致
  togglePlayMode() {
    console.log("[playerStore] 切换播放模式");
    const currentIndex = store_modules_list.PLAY_MODE_LIST.indexOf(state.playMode);
    const nextIndex = (currentIndex + 1) % store_modules_list.PLAY_MODE_LIST.length;
    state.playMode = store_modules_list.PLAY_MODE_LIST[nextIndex];
    console.log("[playerStore] 新播放模式:", state.playMode);
    return state.playMode;
  },
  // 获取播放模式图标
  getPlayModeIcon() {
    return PLAY_MODE_ICONS[state.playMode] || PLAY_MODE_ICONS[store_modules_list.PLAY_MODE.listLoop];
  },
  // 播放下一首
  playNext() {
    if (state.playlist.length <= 1)
      return;
    let nextIndex = 0;
    const currentIndex = state.playlist.findIndex((song) => song.id === state.currentSong.id);
    if (state.playMode === store_modules_list.PLAY_MODE.random) {
      nextIndex = Math.floor(Math.random() * state.playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % state.playlist.length;
    }
    this.playSong(state.playlist[nextIndex]);
  },
  // 播放上一首
  playPrev() {
    if (state.playlist.length <= 1)
      return;
    let prevIndex = 0;
    const currentIndex = state.playlist.findIndex((song) => song.id === state.currentSong.id);
    if (state.playMode === store_modules_list.PLAY_MODE.random) {
      prevIndex = Math.floor(Math.random() * state.playlist.length);
    } else {
      prevIndex = (currentIndex - 1 + state.playlist.length) % state.playlist.length;
    }
    this.playSong(state.playlist[prevIndex]);
  },
  // 处理播放结束 - 支持 5 种播放模式
  async handlePlayEnded() {
    var _a, _b, _c;
    console.log("[playerStore] ========== 播放结束处理开始 ==========");
    console.log("[playerStore] 当前模式:", state.playMode);
    console.log("[playerStore] PLAY_MODE.singleLoop:", store_modules_list.PLAY_MODE.singleLoop);
    console.log("[playerStore] 模式是否匹配 singleLoop:", state.playMode === store_modules_list.PLAY_MODE.singleLoop);
    console.log("[playerStore] 当前歌曲:", (_a = state.currentSong) == null ? void 0 : _a.name, "ID:", (_b = state.currentSong) == null ? void 0 : _b.id);
    console.log("[playerStore] 是否有外部回调:", !!state.onPlayEndedCallback);
    if (state.onPlayEndedCallback) {
      console.log("[playerStore] 调用外部播放结束回调，传入模式:", state.playMode);
      state.onPlayEndedCallback(state.playMode);
      return;
    }
    if (state.playMode === store_modules_list.PLAY_MODE.none) {
      console.log("[playerStore] 禁用模式，不自动播放下一首");
      return;
    }
    try {
      console.log("[playerStore] 使用 listStore 处理下一首...");
      console.log("[playerStore] LIST_IDS:", store_modules_list.LIST_IDS);
      console.log("[playerStore] defaultList 长度:", store_modules_list.listStore.state.defaultList.list.length);
      console.log("[playerStore] loveList 长度:", store_modules_list.listStore.state.loveList.list.length);
      console.log("[playerStore] tempList 长度:", store_modules_list.listStore.state.tempList.list.length);
      console.log("[playerStore] playInfo:", JSON.stringify(store_modules_list.listStore.state.playInfo));
      if (state.playMode === store_modules_list.PLAY_MODE.singleLoop) {
        console.log("[playerStore] 单曲循环，重新播放当前歌曲");
        if (state.audioContext) {
          state.audioContext.seek(0);
          state.audioContext.play();
        }
        return;
      }
      if (state.playMode === store_modules_list.PLAY_MODE.list) {
        console.log("[playerStore] 顺序播放模式，检查是否最后一首");
        const currentListId = store_modules_list.listStore.state.playInfo.playerListId;
        console.log("[playerStore] 当前列表ID:", currentListId);
        if (!currentListId) {
          console.log("[playerStore] 没有当前列表ID，停止播放");
          return;
        }
        const currentList = currentListId === store_modules_list.LIST_IDS.DEFAULT ? store_modules_list.listStore.state.defaultList.list : currentListId === store_modules_list.LIST_IDS.LOVE ? store_modules_list.listStore.state.loveList.list : store_modules_list.listStore.state.tempList.list;
        const currentIndex = store_modules_list.listStore.state.playInfo.playerPlayIndex;
        console.log("[playerStore] 当前列表长度:", currentList.length, "当前索引:", currentIndex);
        if (currentIndex >= currentList.length - 1) {
          console.log("[playerStore] 已是最后一首，停止播放");
          state.playing = false;
          state.isPlaying = false;
          state.statusText = "";
          this.clearLoadTimeout();
          this.clearQuickCheckTimeout();
          return;
        }
      }
      const togglePlayMethod = state.playMode === store_modules_list.PLAY_MODE.random ? "random" : "listLoop";
      console.log("[playerStore] 切换模式:", togglePlayMethod);
      console.log("[playerStore] 调用 listStore.getNextSong...");
      const nextSongInfo = store_modules_list.listStore.getNextSong(togglePlayMethod, true);
      console.log("[playerStore] getNextSong 返回:", nextSongInfo ? "有数据" : "无数据");
      if (nextSongInfo && nextSongInfo.musicInfo) {
        console.log("[playerStore] 自动播放下一首:", nextSongInfo.musicInfo.name, "ID:", nextSongInfo.musicInfo.id);
        console.log("[playerStore] 下一首列表ID:", nextSongInfo.listId, "是否临时:", nextSongInfo.isTempPlay);
        const quality = store_modules_system.systemStore.getState().audioQuality || "128k";
        const cachedUrl = await utils_musicUrlCache.getCachedMusicUrl(nextSongInfo.musicInfo.id, quality, nextSongInfo.musicInfo.source);
        let playUrl = cachedUrl;
        let lyricData = null;
        if (!cachedUrl) {
          const requestSource = nextSongInfo.musicInfo.source || "tx";
          const isTx = requestSource === "tx";
          const songId = isTx && nextSongInfo.musicInfo.songmid ? nextSongInfo.musicInfo.songmid : nextSongInfo.musicInfo.id;
          console.log("[playerStore] handlePlayEnded 构建请求参数:");
          console.log("[playerStore] musicInfo.source:", nextSongInfo.musicInfo.source);
          console.log("[playerStore] musicInfo.id:", nextSongInfo.musicInfo.id);
          console.log("[playerStore] musicInfo.songmid:", nextSongInfo.musicInfo.songmid);
          console.log("[playerStore] 使用的 songId:", songId);
          const requestData = {
            source: requestSource,
            musicInfo: {
              id: songId,
              name: nextSongInfo.musicInfo.name,
              singer: nextSongInfo.musicInfo.singer || (nextSongInfo.musicInfo.ar ? nextSongInfo.musicInfo.ar.map((a) => a.name).join("/") : ""),
              source: requestSource,
              interval: utils_musicParams.formatDuration(nextSongInfo.musicInfo.dt || nextSongInfo.musicInfo.duration || nextSongInfo.musicInfo.interval),
              meta: {
                songId,
                albumName: ((_c = nextSongInfo.musicInfo.al) == null ? void 0 : _c.name) || nextSongInfo.musicInfo.albumName || ""
              }
            },
            quality
          };
          if (requestSource === "kg") {
            requestData.musicInfo.meta.hash = nextSongInfo.musicInfo.hash || nextSongInfo.musicInfo.id;
          }
          console.log("[playerStore] requestData:", JSON.stringify(requestData));
          const musicUrlData = await utils_api_music.getMusicUrl(requestData);
          playUrl = musicUrlData.url;
          await utils_musicUrlCache.setCachedMusicUrl(nextSongInfo.musicInfo.id, quality, playUrl, nextSongInfo.musicInfo.source);
          lyricData = {
            lyric: musicUrlData.lyric || "",
            tlyric: musicUrlData.tlyric || "",
            rlyric: musicUrlData.rlyric || "",
            lxlyric: musicUrlData.lxlyric || ""
          };
        } else {
          const lyricSource = nextSongInfo.musicInfo.source || "tx";
          const cachedLyric = await utils_lyricCache.getCachedLyric(nextSongInfo.musicInfo.id, lyricSource);
          lyricData = cachedLyric || {};
        }
        const updatedSong = {
          ...nextSongInfo.musicInfo,
          url: playUrl,
          playUrl,
          quality,
          lyric: lyricData.lyric || "",
          tlyric: lyricData.tlyric || "",
          rlyric: lyricData.rlyric || "",
          lxlyric: lyricData.lxlyric || ""
        };
        store_modules_list.listStore.setPlayMusicInfo(nextSongInfo.listId, updatedSong, nextSongInfo.isTempPlay);
        store_modules_list.listStore.addPlayedList({
          listId: nextSongInfo.listId,
          musicInfo: updatedSong,
          isTempPlay: nextSongInfo.isTempPlay
        });
        this.playSong(updatedSong);
      } else {
        console.log("[playerStore] 没有下一首歌曲可播放");
      }
    } catch (error) {
      console.error("[playerStore] 播放下一首失败:", error);
      this.handlePlayEndedWithRetry();
    }
  },
  // 带重试次数限制的播放结束处理
  async handlePlayEndedWithRetry() {
    state.playNextRetryCount = (state.playNextRetryCount || 0) + 1;
    console.log("[playerStore] 播放下一首重试次数:", state.playNextRetryCount);
    if (state.playNextRetryCount >= 5) {
      console.log("[playerStore] 重试次数已达上限，停止播放");
      state.playNextRetryCount = 0;
      state.playing = false;
      return;
    }
    switch (state.playMode) {
      case "singleLoop":
        if (state.audioContext) {
          state.audioContext.seek(0);
          state.audioContext.play();
        }
        break;
      case "random":
        await this.handlePlayEnded();
        break;
      default:
        await this.handlePlayEnded();
    }
  },
  // 默认播放结束处理（备用）
  handlePlayEndedDefault() {
    switch (state.playMode) {
      case "single":
        if (state.audioContext) {
          state.audioContext.seek(0);
          state.audioContext.play();
        }
        break;
      case "loop":
        this.playNext();
        break;
      case "random":
        this.playRandom();
        break;
      default:
        this.playNext();
    }
  },
  // 设置播放结束回调
  setOnPlayEndedCallback(callback) {
    state.onPlayEndedCallback = callback;
  },
  // 随机播放
  playRandom() {
    if (state.playlist.length === 0)
      return;
    const randomIndex = Math.floor(Math.random() * state.playlist.length);
    this.playSong(state.playlist[randomIndex]);
  },
  // 添加到播放历史
  addToHistory(song) {
    console.log("[playerStore] 添加到播放历史:", song.name);
    const exists = state.playHistory.some((item) => item.id === song.id);
    if (!exists) {
      state.playHistory.unshift(song);
      if (state.playHistory.length > 200) {
        state.playHistory.pop();
      }
      common_vendor.index.setStorageSync("playHistory", state.playHistory);
      console.log("[playerStore] 播放历史已更新，当前数量:", state.playHistory.length);
    }
  },
  // 刷新播放URL（参考洛雪音乐桌面版实现）
  // 当播放出错或超时时，尝试重新获取播放链接
  async refreshMusicUrl() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    let song = state.currentSong;
    if (!song || !song.id) {
      console.log("[refreshMusicUrl] 没有当前播放的歌曲");
      return;
    }
    if (state.isRefreshingUrl) {
      console.log("[refreshMusicUrl] 正在刷新URL，跳过");
      return;
    }
    if (state.retryNum >= 2) {
      console.log("[refreshMusicUrl] 重试次数已达上限（2次），切换到下一首");
      state.isRefreshingUrl = false;
      state.retryNum = 0;
      const nextSong = store_modules_list.listStore.getNextSong();
      if (nextSong && nextSong.musicInfo) {
        console.log("[refreshMusicUrl] 播放下一首:", nextSong.musicInfo.name);
        playerStore.playSong(nextSong.musicInfo);
      } else {
        console.log("[refreshMusicUrl] 没有下一首歌曲，停止播放");
        playerStore.pause();
      }
      return;
    }
    if (state.lastRefreshSongId !== song.id) {
      console.log("[refreshMusicUrl] 歌曲已更换，重置重试次数");
      state.retryNum = 0;
      state.lastRefreshSongId = song.id;
    }
    console.log("[refreshMusicUrl] 开始刷新URL，当前重试次数:", state.retryNum);
    state.isRefreshingUrl = true;
    state.retryNum++;
    try {
      if (state.loadTimeout) {
        clearTimeout(state.loadTimeout);
        state.loadTimeout = null;
      }
      const qualityMap = {
        "standard": "320k",
        "high": "flac",
        "lossless": "flac24bit",
        "low": "128k"
      };
      const actualQuality = qualityMap[state.audioQuality] || "320k";
      await this.clearMusicUrlCache(song.id, actualQuality, song.source);
      console.log("[refreshMusicUrl] 已清除URL缓存");
      this.setStatusText("正在刷新播放链接...", 0);
      let songToRefresh = song;
      if (song._toggleMusicInfo && song._toggleMusicInfo.newSource) {
        console.log("[refreshMusicUrl] 使用换源后的歌曲信息:", {
          originalSource: song._toggleMusicInfo.originalSource,
          newSource: song._toggleMusicInfo.newSource
        });
        songToRefresh = {
          ...song,
          source: song._toggleMusicInfo.newSource,
          songmid: ((_a = song._toggleMusicInfo.matchedSong) == null ? void 0 : _a.songmid) || song.songmid,
          hash: ((_b = song._toggleMusicInfo.matchedSong) == null ? void 0 : _b.hash) || song.hash,
          copyrightId: ((_c = song._toggleMusicInfo.matchedSong) == null ? void 0 : _c.copyrightId) || song.copyrightId
        };
      }
      console.log("[refreshMusicUrl] 歌曲信息:", {
        id: songToRefresh.id,
        songmid: songToRefresh.songmid,
        hash: songToRefresh.hash,
        copyrightId: songToRefresh.copyrightId,
        source: songToRefresh.source
      });
      const requestData = utils_musicParams.buildMusicRequestParams(songToRefresh, actualQuality);
      if (!requestData) {
        throw new Error("构建请求参数失败");
      }
      console.log("[refreshMusicUrl] 请求参数:", JSON.stringify(requestData));
      const result = await utils_api_music.getMusicUrl(requestData);
      console.log("[refreshMusicUrl] 获取新URL成功");
      this.setStatusText("尝试播放歌曲...", 0);
      if (result.fallback && result.fallback.toggled) {
        console.log("[refreshMusicUrl] 检测到换源:", {
          originalSource: result.fallback.originalSource,
          newSource: result.fallback.newSource
        });
        const updatedSong = {
          ...song,
          source: result.fallback.newSource,
          _toggleMusicInfo: {
            originalSource: result.fallback.originalSource,
            newSource: result.fallback.newSource,
            matchedSong: result.fallback.matchedSong,
            toggleTime: Date.now()
          }
        };
        if (result.fallback.matchedSong) {
          updatedSong.songmid = result.fallback.matchedSong.songmid || song.songmid;
          updatedSong.hash = result.fallback.matchedSong.hash || song.hash;
          updatedSong.copyrightId = result.fallback.matchedSong.copyrightId || song.copyrightId;
          updatedSong.id = result.fallback.matchedSong.id || song.id;
        }
        state.currentSong = updatedSong;
        console.log("[refreshMusicUrl] 已更新歌曲换源信息");
        const originalSongId = String(song.id).replace(/^(tx|wy|kg|kw|mg)_/, "") || song.id;
        const switchInfo = {
          originalSource: result.fallback.originalSource,
          newSource: result.fallback.newSource,
          newSongId: ((_d = result.fallback.matchedSong) == null ? void 0 : _d.id) || song.id,
          newSongName: ((_e = result.fallback.matchedSong) == null ? void 0 : _e.name) || song.name,
          newSongSinger: ((_f = result.fallback.matchedSong) == null ? void 0 : _f.singer) || song.singer,
          quality: state.audioQuality
        };
        utils_musicSwitchSourceStorage.saveMusicSwitchSource(originalSongId, switchInfo);
        console.log("[refreshMusicUrl] 已保存换源信息到本地存储:", result.fallback.originalSource, "->", result.fallback.newSource);
        song = updatedSong;
        store_modules_list.listStore.updateSongInList(updatedSong);
      }
      const cacheSongId = ((_h = (_g = result.fallback) == null ? void 0 : _g.matchedSong) == null ? void 0 : _h.id) || song.id;
      const cacheSource = ((_j = (_i = result.fallback) == null ? void 0 : _i.matchedSong) == null ? void 0 : _j.source) || song.source;
      const qualities = ["128k", "320k", "flac"];
      for (const q of qualities) {
        await utils_musicUrlCache.setCachedMusicUrl(cacheSongId, q, result.url, cacheSource);
      }
      console.log("[refreshMusicUrl] 已更新所有音质缓存");
      state.isRefreshingUrl = false;
      if (state.currentSong.id !== song.id) {
        console.log("[refreshMusicUrl] 歌曲已更换，不更新播放");
        return;
      }
      const secureUrl = result.url;
      if (state.audioContext) {
        const coverImgUrl = ((_k = song.al) == null ? void 0 : _k.picUrl) || ((_l = song.album) == null ? void 0 : _l.picUrl) || song.img || "/static/images/default-cover.png";
        state.audioContext.title = song.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(song);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_m = song.al) == null ? void 0 : _m.name) || ((_n = song.album) == null ? void 0 : _n.name) || "未知专辑";
        state.audioContext.src = secureUrl;
        console.log("[refreshMusicUrl] 已更新背景音频src，等待自动播放");
      }
      console.log("[refreshMusicUrl] 刷新URL成功，当前重试次数:", state.retryNum);
      this.setStatusText("播放链接已刷新", 2e3);
    } catch (error) {
      console.error("[refreshMusicUrl] 刷新URL失败:", error);
      state.isRefreshingUrl = false;
      if (state.retryNum < 2) {
        console.log("[refreshMusicUrl] 准备再次尝试刷新URL");
        setTimeout(() => {
          this.refreshMusicUrl();
        }, 1e3);
      } else {
        console.log("[refreshMusicUrl] 重试次数用完，自动切换下一首");
        common_vendor.index.showToast({
          title: "播放失败，切换下一首",
          icon: "none"
        });
        this.handlePlayEndedWithRetry();
      }
    }
  },
  // 清除音乐URL缓存
  async clearMusicUrlCache(songId, quality, source = "kg") {
    try {
      const qualities = ["128k", "320k", "flac"];
      for (const q of qualities) {
        const cacheKey = `${songId}_${q}_${source}`;
        common_vendor.index.removeStorageSync(`music_url_${cacheKey}`);
        console.log("[clearMusicUrlCache] 已清除缓存:", cacheKey);
      }
    } catch (error) {
      console.error("[clearMusicUrlCache] 清除缓存失败:", error);
    }
  },
  // 开始加载超时定时器（10秒超时）
  startLoadTimeout() {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
    }
    state.loadTimeout = setTimeout(() => {
      console.log("[startLoadTimeout] 加载超时，准备刷新URL");
      this.setStatusText("播放加载超时，正在重试...", 0);
      if (state.retryNum < 2) {
        this.refreshMusicUrl();
      } else {
        console.log("[startLoadTimeout] 重试次数用完，切到下一首");
        this.handlePlayEndedWithRetry();
      }
    }, 1e4);
    console.log("[startLoadTimeout] 已启动加载超时定时器（10秒）");
  },
  // 清除加载超时定时器
  clearLoadTimeout() {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
      state.loadTimeout = null;
      console.log("[clearLoadTimeout] 已清除加载超时定时器");
    }
  },
  // 开始快速检测超时定时器（5秒，仅用于缓存URL）
  startQuickCheckTimeout() {
    if (state.quickCheckTimeout) {
      clearTimeout(state.quickCheckTimeout);
    }
    state.quickCheckTimeout = setTimeout(() => {
      if (!state.playing && state.isUsingCachedUrl) {
        console.log("[startQuickCheckTimeout] 缓存URL快速检测超时，链接可能过期");
        this.setStatusText("正在检查链接...", 0);
        state.isUsingCachedUrl = false;
        if (state.retryNum < 2) {
          console.log("[startQuickCheckTimeout] 尝试刷新URL");
          this.refreshMusicUrl();
        }
      }
    }, 5e3);
    console.log("[startQuickCheckTimeout] 已启动快速检测超时定时器（5秒）");
  },
  // 清除快速检测超时定时器
  clearQuickCheckTimeout() {
    if (state.quickCheckTimeout) {
      clearTimeout(state.quickCheckTimeout);
      state.quickCheckTimeout = null;
      console.log("[clearQuickCheckTimeout] 已清除快速检测超时定时器");
    }
  },
  // 格式化歌手名称
  formatArtists(song) {
    var _a;
    if (!song)
      return "未知歌手";
    if (song.ar && Array.isArray(song.ar) && song.ar.length > 0) {
      return song.ar.map((a) => a.name).join("/");
    }
    if (song.artists && Array.isArray(song.artists) && song.artists.length > 0) {
      return song.artists.map((a) => a.name).join("/");
    }
    if (song.singer)
      return song.singer;
    if ((_a = song.ar) == null ? void 0 : _a.name)
      return song.ar.name;
    return "未知歌手";
  },
  // 设置播放模式 - 支持 5 种播放模式
  setPlayMode(mode) {
    const validModes = [
      store_modules_list.PLAY_MODE.listLoop,
      store_modules_list.PLAY_MODE.random,
      store_modules_list.PLAY_MODE.list,
      store_modules_list.PLAY_MODE.singleLoop,
      store_modules_list.PLAY_MODE.none
    ];
    if (validModes.includes(mode)) {
      state.playMode = mode;
      common_vendor.index.setStorageSync("playMode", mode);
      console.log("[playerStore] 播放模式切换为:", mode);
      const modeText = {
        [store_modules_list.PLAY_MODE.listLoop]: "列表循环",
        [store_modules_list.PLAY_MODE.random]: "随机播放",
        [store_modules_list.PLAY_MODE.list]: "顺序播放",
        [store_modules_list.PLAY_MODE.singleLoop]: "单曲循环",
        [store_modules_list.PLAY_MODE.none]: "播放已禁用"
      };
      this.setStatusText(modeText[mode] || "已切换播放模式", 2e3);
    } else {
      console.warn("[playerStore] 无效的播放模式:", mode);
    }
  },
  // 调整播放进度
  seek(position) {
    if (state.audioContext && state.duration) {
      const seekTime = position / 100 * state.duration;
      state.audioContext.seek(seekTime);
    }
  },
  // 切换全屏播放器显示
  toggleFullPlayer() {
    state.showFullPlayer = !state.showFullPlayer;
  },
  // 播放整个歌单
  playPlaylist(songs) {
    if (!songs || songs.length === 0)
      return;
    state.playlist = [...songs];
    this.playSong(songs[0]);
  },
  // 添加歌曲到播放列表
  addToPlaylist(songs) {
    if (!songs || songs.length === 0)
      return;
    state.playlist = [...state.playlist, ...songs];
    if (!state.currentSong) {
      this.playSong(songs[0]);
    }
  },
  // 添加歌曲作为下一首播放
  addToPlaylistAsNext(song) {
    if (!song)
      return;
    const currentIndex = state.playlist.findIndex((item) => {
      var _a;
      return item.id === ((_a = state.currentSong) == null ? void 0 : _a.id);
    });
    const newPlaylist = [...state.playlist];
    if (currentIndex !== -1) {
      newPlaylist.splice(currentIndex + 1, 0, song);
    } else {
      newPlaylist.unshift(song);
    }
    state.playlist = newPlaylist;
  },
  // 从本地存储恢复状态
  restoreState() {
    const playMode = common_vendor.index.getStorageSync("playMode");
    console.log("[playerStore] restoreState - 从本地存储读取的 playMode:", playMode, typeof playMode);
    const playHistory = common_vendor.index.getStorageSync("playHistory");
    const audioQuality = common_vendor.index.getStorageSync("audioQuality");
    const cacheSize = common_vendor.index.getStorageSync("playerCacheSize");
    const enablePreload = common_vendor.index.getStorageSync("playerEnablePreload");
    const legacyModeMap = {
      "loop": store_modules_list.PLAY_MODE.listLoop,
      "sequence": store_modules_list.PLAY_MODE.list,
      "single": store_modules_list.PLAY_MODE.singleLoop
    };
    if (playMode) {
      console.log("[playerStore] restoreState - playMode 存在，尝试恢复");
      if (legacyModeMap[playMode]) {
        state.playMode = legacyModeMap[playMode];
        console.log("[playerStore] 恢复旧版播放模式:", playMode, "->", state.playMode);
      } else if (Object.values(store_modules_list.PLAY_MODE).includes(playMode)) {
        state.playMode = playMode;
        console.log("[playerStore] 恢复播放模式:", state.playMode);
      } else {
        console.warn("[playerStore] 未知的播放模式:", playMode, "使用默认值");
        state.playMode = store_modules_list.PLAY_MODE.listLoop;
      }
    } else {
      console.log("[playerStore] restoreState - playMode 为空，使用默认值:", store_modules_list.PLAY_MODE.listLoop);
    }
    if (playHistory)
      state.playHistory = playHistory;
    if (audioQuality)
      state.audioQuality = audioQuality;
    if (cacheSize)
      state.cacheSize = cacheSize;
    if (enablePreload !== null && enablePreload !== void 0)
      state.enablePreload = enablePreload;
  },
  // 预加载下一首歌曲（参考洛雪音乐移动版实现）
  async preloadNextSong() {
    if (!state.enablePreload || state.isPreloading)
      return;
    const currentIndex = state.playlist.findIndex((song) => {
      var _a;
      return song.id === ((_a = state.currentSong) == null ? void 0 : _a.id);
    });
    if (currentIndex === -1 || currentIndex >= state.playlist.length - 1)
      return;
    const nextSong = state.playlist[currentIndex + 1];
    if (!nextSong || !nextSong.id)
      return;
    const qualityMap = {
      "standard": "320k",
      "high": "flac",
      "lossless": "flac24bit",
      "low": "128k"
    };
    const actualQuality = qualityMap[state.audioQuality] || "320k";
    const isCached = await utils_musicUrlCache.isMusicUrlCached(nextSong.id, actualQuality);
    if (isCached) {
      console.log("[preloadNextSong] 下一首已有缓存，跳过:", nextSong.name);
      return;
    }
    state.isPreloading = true;
    console.log("[preloadNextSong] 开始预加载下一首:", nextSong.name);
    try {
      await utils_musicUrlCache.preloadNextMusic(nextSong, utils_api_music.getMusicUrl, actualQuality);
      console.log("[preloadNextSong] 预加载完成:", nextSong.name);
    } catch (error) {
      console.error("[preloadNextSong] 预加载失败:", error.message);
    } finally {
      state.isPreloading = false;
    }
  },
  // 设置缓存大小
  setCacheSize(size) {
    if (typeof size === "number" && size > 0) {
      state.cacheSize = size;
      common_vendor.index.setStorageSync("playerCacheSize", size);
      console.log("[playerStore] 缓存大小设置为:", size, "MB");
    }
  },
  // 设置是否启用预加载
  setEnablePreload(enable) {
    state.enablePreload = !!enable;
    common_vendor.index.setStorageSync("playerEnablePreload", state.enablePreload);
    console.log("[playerStore] 预加载设置为:", state.enablePreload);
  },
  // 检查歌曲是否已缓存（用于判断是否可以离线播放）
  async isSongCached(songId, quality) {
    const qualityMap = {
      "standard": "320k",
      "high": "flac",
      "lossless": "flac24bit",
      "low": "128k"
    };
    const actualQuality = quality || qualityMap[state.audioQuality] || "320k";
    return await utils_musicUrlCache.isMusicUrlCached(songId, actualQuality);
  },
  // 设置是否使用缓存URL标记
  setUsingCachedUrl(isUsing) {
    state.isUsingCachedUrl = isUsing;
    console.log("[playerStore] 设置使用缓存URL标记:", isUsing);
  },
  // 更新当前播放的歌曲信息（用于歌曲换源）
  updateCurrentSong(song) {
    if (!song || !song.id) {
      console.error("[updateCurrentSong] 歌曲信息无效");
      return;
    }
    console.log("[updateCurrentSong] 更新当前歌曲:", song.name, "ID:", song.id);
    state.currentSong = {
      ...state.currentSong,
      ...song,
      // 保留当前播放进度
      currentTime: state.currentTime
    };
    state.lyric = song.lyric || "";
    state.tlyric = song.tlyric || "";
    state.rlyric = song.rlyric || "";
    state.lxlyric = song.lxlyric || "";
    console.log("[updateCurrentSong] 歌曲信息已更新");
  },
  // 设置歌词（用于通知栏显示歌词）
  setLyrics(lyricInfo) {
    var _a, _b, _c, _d;
    if (!lyricInfo) {
      console.log("[playerStore] 歌词信息为空，跳过设置");
      return;
    }
    console.log("[playerStore] 设置歌词:", {
      lyricLength: (_a = lyricInfo.lyric) == null ? void 0 : _a.length,
      tlyricLength: (_b = lyricInfo.tlyric) == null ? void 0 : _b.length,
      rlyricLength: (_c = lyricInfo.rlyric) == null ? void 0 : _c.length,
      lxlyricLength: (_d = lyricInfo.lxlyric) == null ? void 0 : _d.length
    });
    state.lyric = lyricInfo.lyric || "";
    state.tlyric = lyricInfo.tlyric || "";
    state.rlyric = lyricInfo.rlyric || "";
    state.lxlyric = lyricInfo.lxlyric || "";
    console.log("[playerStore] 歌词设置完成");
  },
  // 加载歌曲歌词（用于播放成功后加载歌词）
  async loadLyricsForSong(song) {
    if (!song || !song.id) {
      console.log("[playerStore] 歌曲信息无效，无法加载歌词");
      return;
    }
    console.log("[playerStore] 开始加载歌词:", {
      id: song.id,
      name: song.name,
      source: song.source
    });
    try {
      const possibleSources = [song.source, "tx"];
      let cachedLyric = null;
      for (const source of possibleSources) {
        try {
          console.log("[playerStore] 尝试获取歌词缓存，source:", source);
          cachedLyric = await utils_lyricCache.getCachedLyric(song.id, source);
          if (cachedLyric) {
            console.log("[playerStore] 从缓存获取到歌词，source:", source);
            break;
          }
        } catch (e) {
          console.error("[playerStore] 获取歌词缓存失败:", e);
        }
      }
      if (cachedLyric) {
        this.setLyrics({
          lyric: cachedLyric.lyric || "",
          tlyric: cachedLyric.tlyric || "",
          rlyric: cachedLyric.rlyric || "",
          lxlyric: cachedLyric.lxlyric || ""
        });
        console.log("[playerStore] 歌词加载完成并设置到 store");
      } else {
        console.log("[playerStore] 未找到歌词缓存");
        this.setLyrics({
          lyric: "",
          tlyric: "",
          rlyric: "",
          lxlyric: ""
        });
      }
    } catch (error) {
      console.error("[playerStore] 加载歌词失败:", error);
    }
  }
};
exports.playerStore = playerStore;
