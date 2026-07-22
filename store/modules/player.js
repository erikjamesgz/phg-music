"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api_music = require("../../utils/api/music.js");
const utils_musicUrlCache = require("../../utils/musicUrlCache.js");
const utils_playInfoStorage = require("../../utils/playInfoStorage.js");
const utils_musicSwitchSourceStorage = require("../../utils/musicSwitchSourceStorage.js");
const utils_musicParams = require("../../utils/musicParams.js");
const store_modules_list = require("./list.js");
const store_modules_user = require("./user.js");
const utils_lyricCache = require("../../utils/lyricCache.js");
const utils_musicPic = require("../../utils/musicPic.js");
const utils_aiSongSearch = require("../../utils/aiSongSearch.js");
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
  // 不喜欢列表（用于AI推荐的负反馈）
  dislikeList: [],
  // 最近播放歌单历史（记录用户播放过的歌单）
  playListHistory: [],
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
  // 是否已因连续失败而强制停止播放（防止停止后继续处理错误）
  isPlaybackStopped: false,
  // 当前失败歌曲的ID（用于同一首歌多次error事件去重）
  currentFailingSongId: null,
  // 用户主动操作标志（用户点击上一首/下一首时设为true，自动切歌时为false）
  isUserManualSwitch: false,
  // 正在恢复播放中（防止竞态条件导致多次调用）
  isRecoveringPlayback: false,
  // NativeAudio是否正在处理协议切换恢复（防止与InnerAudio onError冲突）
  isNativeAudioRecovering: false,
  // 当前歌曲的协议切换次数（同一首歌最多尝试1次）
  protocolSwitchCount: 0,
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
  // 当前播放是否使用了缓存URL（用于错误处理时判断，不会被onPlay重置）
  usedCachedUrlForCurrentPlay: false,
  // 是否正在获取播放URL
  isGettingUrl: false,
  // 🔑 当前 currentSong 的播放URL是否已成功加载到 audioContext.src
  // 用于区分"currentSong已设置但URL未加载"的不一致状态
  // 在 playSong 开始时设为 false，audio.src 设置成功后设为 true
  // isSameSong 判断时检查此标志，避免URL加载失败后误判为"同一首歌继续播放"
  currentSongUrlLoaded: false,
  // 待播放的歌曲（用于处理快速切换）
  pendingSong: null,
  // 是否显示换源提示（全局状态）
  showSourceSwitchHint: false,
  // 用户是否正在拖动进度条或点击歌词快进（用于禁用通知栏切歌误判）
  isUserSeeking: false,
  // 待恢复播放进度的歌曲ID（用于校验是否是同一首歌）
  _pendingSeekSongId: null,
  // 用户快进操作的防抖定时器
  seekingDebounceTimer: null,
  // 是否已检查过电池优化（App端）
  hasCheckedBatteryOptimization: false,
  // 当前歌曲的音源提供者名称（如 [独家音源]）
  currentScriptName: "",
  // 当前歌曲的公共服务器分享者名称（仅公共服务器模式有值）
  currentMeshContributor: "",
  // 当前歌曲的换源信息（播放时使用新source获取URL，但不修改显示信息）
  currentSongSwitchInfo: null,
  // URL获取开始时间戳（用于检测iOS后台卡死）
  urlFetchStartTime: 0
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
  // 🔑 检测iOS后台卡死的URL获取（App返回前台时调用）
  // iOS微信小程序在后台时JS执行暂停，setTimeout和uni.request回调不触发
  // 导致锁屏切歌时getMusicUrl的Promise永远pending，播放器卡死
  checkStuckUrlFetch() {
    if (!state.urlFetchStartTime)
      return false;
    const elapsed = Date.now() - state.urlFetchStartTime;
    if (elapsed > 1e4) {
      console.log("[playerStore] 检测到卡死的URL获取，已耗时", Math.round(elapsed / 1e3) + "s，尝试恢复");
      state.urlFetchStartTime = 0;
      state.isLoading = false;
      state.isGettingUrl = false;
      this.clearLoadTimeout();
      this.clearQuickCheckTimeout();
      this.clearStatusText();
      console.log("[playerStore] 恢复：自动切到下一首");
      this.playNext();
      return true;
    }
    return false;
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
  // 判断是否发生了换源（当前歌曲与原始歌曲不同）
  get hasSwitchedSource() {
    if (!state.currentSong || !state.originalSong)
      return false;
    if (state.currentSongSwitchInfo && state.currentSongSwitchInfo.newSource) {
      return state.currentSongSwitchInfo.newSource !== state.currentSongSwitchInfo.originalSource || state.currentSongSwitchInfo.newSongId !== state.originalSong.id;
    }
    return state.currentSong.id !== state.originalSong.id || state.currentSong.source !== state.originalSong.source;
  },
  // 显示换源提示
  showSourceSwitchHintMessage() {
    state.showSourceSwitchHint = true;
    console.log("[playerStore] 显示换源提示");
    setTimeout(() => {
      state.showSourceSwitchHint = false;
      console.log("[playerStore] 自动隐藏换源提示");
    }, 1e4);
  },
  // 隐藏换源提示
  hideSourceSwitchHintMessage() {
    state.showSourceSwitchHint = false;
    console.log("[playerStore] 隐藏换源提示");
  },
  syncElectronMedia(songOverride) {
    var _a, _b;
    if (typeof window === "undefined" || !window.electronAPI || !window.electronAPI.updatePlayerInfo)
      return;
    const song = songOverride || state.currentSong;
    const source = (song == null ? void 0 : song.sourceId) || (song == null ? void 0 : song.source);
    let coverUrl = "";
    try {
      coverUrl = utils_musicPic.getSongPicUrl(song, source);
    } catch (e) {
    }
    window.electronAPI.updatePlayerInfo({
      title: (song == null ? void 0 : song.name) || "",
      artist: this.formatArtists(song),
      album: ((_a = song == null ? void 0 : song.al) == null ? void 0 : _a.name) || ((_b = song == null ? void 0 : song.album) == null ? void 0 : _b.name) || "",
      coverUrl,
      playing: state.playing,
      duration: state.duration || 0,
      currentTime: state.currentTime || 0
    });
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
      var _a;
      console.log("[BackgroundAudio] onPlay");
      state.playing = true;
      this.clearLoadTimeout();
      this.clearQuickCheckTimeout();
      this.clearStatusText();
      state.isUsingCachedUrl = false;
      if (state.currentScriptName) {
        setTimeout(() => {
          if (state.playing && state.currentScriptName) {
            this.setStatusText(`此歌曲音乐服务由 ${state.currentScriptName} 提供`, 5e3);
            console.log("[BackgroundAudio] 显示音源提供者信息:", state.currentScriptName);
          }
        }, 1e4);
      }
      if (state.currentMeshContributor) {
        setTimeout(() => {
          if (state.playing && state.currentMeshContributor) {
            this.setStatusText(`由 ${state.currentMeshContributor} 提供算力支持`, 5e3);
            console.log("[BackgroundAudio] 显示公共服务器分享者信息:", state.currentMeshContributor);
          }
        }, 15e3);
      }
      if (state._pendingSeekTime > 0 && state.duration > 0) {
        const currentSongId = (_a = state.currentSong) == null ? void 0 : _a.id;
        const pendingSongId = state._pendingSeekSongId;
        if (pendingSongId && currentSongId && pendingSongId === currentSongId) {
          console.log("[BackgroundAudio] onPlay - 恢复播放进度:", state._pendingSeekTime, "歌曲ID匹配:", currentSongId);
          const seekTime = Math.min(state._pendingSeekTime, state.duration - 1);
          if (seekTime > 0) {
            setTimeout(() => {
              console.log("[BackgroundAudio] onPlay - 执行 seek 到:", seekTime);
              audio.seek(seekTime);
              state.currentTime = seekTime;
            }, 500);
          }
        } else {
          console.log("[BackgroundAudio] onPlay - 跳过恢复播放进度，歌曲不匹配或无待恢复进度", {
            currentSongId,
            pendingSongId,
            pendingSeekTime: state._pendingSeekTime
          });
        }
        state._pendingSeekTime = 0;
        state._pendingSeekDuration = 0;
        state._pendingSeekSongId = null;
      }
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
      if (!state.lastElectronMediaUpdateTime || now - state.lastElectronMediaUpdateTime > 1e3) {
        state.lastElectronMediaUpdateTime = now;
        this.syncElectronMedia();
      }
      if (!state.lastSaveTime || now - state.lastSaveTime > 5e3) {
        state.lastSaveTime = now;
        if (state.currentSong && state.currentSong.id && state.currentSong.id !== 0) {
          let playerListId = store_modules_list.listStore.state.playInfo.playerListId || store_modules_list.LIST_IDS.TEMP;
          let playIndex = store_modules_list.listStore.state.playInfo.playerPlayIndex ?? 0;
          if (playerListId === store_modules_list.LIST_IDS.TEMP && ((_a = store_modules_list.listStore.state.tempList.meta) == null ? void 0 : _a.id)) {
            playerListId = store_modules_list.listStore.state.tempList.meta.id;
          }
          const playlist = store_modules_list.listStore.getList(playerListId);
          if (playlist && playlist.length > 0) {
            utils_playInfoStorage.savePlayState({
              time: Math.floor(state.currentTime),
              maxTime: Math.floor(state.duration),
              listId: playerListId,
              index: playIndex,
              currentSong: state.currentSong,
              originalSong: state.originalSong,
              playlist,
              playing: state.playing
            });
          }
        }
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
      var _a, _b;
      console.error("[BackgroundAudio] onError:", err);
      state.error = err.errMsg || "播放错误";
      state.isLoading = false;
      state.playing = false;
      this.setStatusText("播放出错，正在重试...", 0);
      this.clearLoadTimeout();
      this.clearQuickCheckTimeout();
      const errorCode = err.errCode;
      console.log("[BackgroundAudio] onError - 错误码:", errorCode, "重试次数:", state.retryNum);
      console.log("[BackgroundAudio] onError - usedCachedUrlForCurrentPlay:", state.usedCachedUrlForCurrentPlay);
      if (!state.usedCachedUrlForCurrentPlay) {
        console.warn("[BackgroundAudio] onError - ❌ 非缓存URL播放失败，直接切换下一首");
        this.handlePlayErrorFallback();
        return;
      }
      console.log("[BackgroundAudio] onError - 🔄 检测到缓存URL播放失败，准备刷新...");
      if (state.retryNum === 0) {
        state.isUsingCachedUrl = false;
        state.usedCachedUrlForCurrentPlay = false;
        const currentSongId = (_a = state.currentSong) == null ? void 0 : _a.id;
        const currentSongSource = ((_b = state.currentSong) == null ? void 0 : _b.source) || "tx";
        if (currentSongId) {
          const qualities = ["128k", "320k", "flac"];
          for (const quality of qualities) {
            utils_musicUrlCache.removeCachedMusicUrl(currentSongId, quality, currentSongSource).catch((e) => {
              console.error("[BackgroundAudio] onError - 清除缓存失败:", quality, e);
            });
          }
          console.log("[BackgroundAudio] onError - ✅ 已发起缓存清除:", currentSongId);
        }
        if (errorCode !== 1 && state.retryNum < 1) {
          console.log("[BackgroundAudio] onError - 刷新URL (retry:", state.retryNum, "/1)");
          this.refreshMusicUrl();
        } else {
          this.handlePlayErrorFallback();
        }
      } else {
        console.log("[BackgroundAudio] onError - 重试次数用完，切换下一首");
        this.handlePlayErrorFallback();
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
  /**
   * 🔑 关键功能：同步AI推荐歌曲信息到临时列表
   * 问题：播放成功后，虽然更新了 recommendations 数组，但临时列表中的歌曲对象还是旧的
   * 导致再次播放同一首歌时，从临时列表获取的还是AI临时ID和错误的音源
   * 
   * @param {Object} song 当前播放的歌曲对象（包含 _isAiSong, _isSearched, _realId 等字段）
   * @param {string} realId 真实的歌曲ID（用于请求播放链接的ID）
   * @param {string} realSource 真实的音源（tx/kg/kw/wy/mg）
   */
  updateSongInTempList(oldId, newId, newSource) {
    try {
      const state2 = this.state;
      console.log("[updateSongInTempList] 🔄 更新临时列表中的歌曲ID...");
      console.log("[updateSongInTempList]", oldId, "→", newId, "[", newSource, "]");
      if (state2.playerListId !== store_modules_list.LIST_IDS.TEMP) {
        console.log("[updateSongInTempList] ℹ️ 当前不是临时列表，跳过");
        return;
      }
      const tempList = store_modules_list.listStore.state.lists[store_modules_list.LIST_IDS.TEMP];
      if (!tempList || !tempList.list) {
        console.log("[updateSongInTempList] ⚠️ 临时列表不存在");
        return;
      }
      const targetIndex = tempList.list.findIndex((item) => item.id === oldId);
      if (targetIndex === -1) {
        console.log("[updateSongInTempList] ⚠️ 未找到ID为", oldId, "的歌曲");
        return;
      }
      tempList.list[targetIndex].id = newId;
      tempList.list[targetIndex].source = newSource;
      tempList.list[targetIndex].sourceId = newSource;
      console.log("[updateSongInTempList] ✅ 更新完成！临时列表中的歌曲已更新为真实ID:", newId);
    } catch (error) {
      console.error("[updateSongInTempList] ❌ 更新失败:", error);
    }
  },
  // 播放指定歌曲
  async playSong(song) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H;
    console.log("[playSong] ========== playSong 被调用 ==========");
    if (!song) {
      console.error("[playSong] song is null or undefined");
      return;
    }
    if (state.isGettingUrl) {
      console.log("[playSong] ⚠️ 检测到 isGettingUrl=true，立即重置为 false");
      state.isGettingUrl = false;
    }
    if (state.isRefreshingUrl) {
      console.log("[playSong] ⚠️ 检测到 isRefreshingUrl=true，立即重置为 false");
      state.isRefreshingUrl = false;
    }
    if (state.pendingSong && state.pendingSong.id !== song.id) {
      console.log("[playSong] 发现待播放歌曲，使用待播放歌曲:", state.pendingSong.name);
      song = state.pendingSong;
      state.pendingSong = null;
    }
    console.log("[playSong] ========== 开始播放歌曲 ==========");
    console.log("[playSong] 歌曲ID:", song.id);
    console.log("[playSong] 歌曲名称:", song.name);
    if (song.url || song.playUrl) {
      console.log("[playSong] ⚠️ 检测到旧URL属性，立即清除");
      console.log("[playSong] - url:", song.url ? song.url.substring(0, 60) + "..." : "无");
      console.log("[playSong] - playUrl:", song.playUrl ? song.playUrl.substring(0, 60) + "..." : "无");
      delete song.url;
      delete song.playUrl;
      console.log("[playSong] ✅ 已清除旧URL，将强制从API获取新URL");
    }
    const currentPlayerListId = store_modules_list.listStore.state.playInfo.playerListId;
    const tempListMeta = store_modules_list.listStore.state.tempList.meta;
    console.log("[playSong] 当前播放列表ID:", currentPlayerListId, "LIST_IDS.TEMP:", store_modules_list.LIST_IDS.TEMP, "是否相等:", currentPlayerListId === store_modules_list.LIST_IDS.TEMP);
    console.log("[playSong] 临时列表元数据:", tempListMeta);
    let isLocalPlaylist = false;
    if (tempListMeta && tempListMeta.id) {
      if (tempListMeta.id.startsWith("userlist_") || tempListMeta.id.startsWith("custom_") || tempListMeta.id.startsWith("local_") || tempListMeta.source === "local" || tempListMeta.source === "user") {
        isLocalPlaylist = true;
        console.log("[playSong] 是用户创建的歌单");
      }
      if (!isLocalPlaylist) {
        try {
          const importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
          const isImported = importedPlaylists.some((p) => p.id === tempListMeta.id);
          if (isImported) {
            isLocalPlaylist = true;
            console.log("[playSong] 是导入的歌单，ID:", tempListMeta.id);
          }
        } catch (e) {
          console.error("[playSong] 检查导入歌单失败:", e);
        }
      }
    }
    console.log("[playSong] 是否是本地歌单:", isLocalPlaylist);
    if (currentPlayerListId === store_modules_list.LIST_IDS.TEMP && !isLocalPlaylist) {
      console.log("[playSong] 当前播放列表是临时列表且不是本地歌单，自动添加到试听列表");
      let albumName = "";
      if (typeof song.album === "string") {
        albumName = song.album;
      } else if (song.album && typeof song.album === "object") {
        albumName = song.album.name || "";
      } else if (song.albumName) {
        albumName = song.albumName;
      } else if (song.al && song.al.name) {
        albumName = song.al.name;
      }
      let singerStr = "";
      let singerArr = [];
      if (song.singer && typeof song.singer === "string") {
        singerStr = song.singer;
        singerArr = song.singer.split(/[/、]/).map((name) => ({ name: name.trim() }));
      } else if (song.ar && Array.isArray(song.ar)) {
        singerArr = song.ar;
        singerStr = song.ar.map((a) => a.name).join("/");
      } else if (song.artists && Array.isArray(song.artists)) {
        singerArr = song.artists;
        singerStr = song.artists.map((a) => a.name).join("/");
      }
      const songToAdd = {
        id: song.id,
        name: song.name,
        singer: singerStr,
        ar: singerArr,
        album: albumName,
        al: song.al || (song.album && typeof song.album === "object" ? song.album : null),
        duration: song.dt || song.interval || song.duration,
        source: song.source || "tx",
        songmid: song.songmid,
        hash: song.hash,
        copyrightId: song.copyrightId,
        img: song.img || song.albumPic || ((_a = song.al) == null ? void 0 : _a.picUrl) || ((_b = song.album) == null ? void 0 : _b.picUrl) || ""
      };
      const defaultList = store_modules_list.listStore.state.defaultList.list;
      const existingIds = new Set(defaultList.map((s) => s.id));
      if (!existingIds.has(songToAdd.id)) {
        store_modules_list.listStore.addListMusics(store_modules_list.LIST_IDS.DEFAULT, [songToAdd], "top");
        console.log("[playSong] 已自动添加歌曲到试听列表:", songToAdd.name, "专辑:", songToAdd.album);
      } else {
        console.log("[playSong] 歌曲已在试听列表中:", songToAdd.name);
      }
      console.log("[playSong] 保持 playerListId 为 TEMP（预览列表），不切换到试听列表");
    }
    if (!state.originalSong || state.originalSong.id !== song.id) {
      state.originalSong = { ...song };
      console.log("[playSong] 保存原始歌曲信息:", song.name, "source:", song.source);
    }
    if (state.currentSong && state.currentSong.id !== song.id) {
      common_vendor.index.$emit("songChanging");
    }
    this.initAudioContext();
    console.log("[playSong] 检查是否同一首歌:");
    console.log("[playSong] state.currentSong?.id:", (_c = state.currentSong) == null ? void 0 : _c.id);
    console.log("[playSong] song.id:", song.id);
    console.log("[playSong] song.url:", song.url ? "有" : "无");
    const isSameSong = state.currentSong && state.currentSong.id === song.id && !song.url && !song.playUrl && state.currentSongUrlLoaded;
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
    state.protocolSwitchCount = 0;
    state.isUsingCachedUrl = false;
    state.currentSongUrlLoaded = false;
    state.usedCachedUrlForCurrentPlay = false;
    state.currentFailingSongId = null;
    state.isUserManualSwitch = false;
    this.clearLoadTimeout();
    this.clearQuickCheckTimeout();
    console.log("[playSong] state.currentSong.id:", (_d = state.currentSong) == null ? void 0 : _d.id);
    console.log("[playSong] state.currentSong.img:", (_e = state.currentSong) == null ? void 0 : _e.img);
    console.log("[playSong] state.currentSong.picUrl:", (_f = state.currentSong) == null ? void 0 : _f.picUrl);
    console.log("[playSong] state.currentSong.al?.picUrl:", (_h = (_g = state.currentSong) == null ? void 0 : _g.al) == null ? void 0 : _h.picUrl);
    state.lyric = song.lyric || "";
    state.tlyric = song.tlyric || "";
    state.rlyric = song.rlyric || "";
    state.lxlyric = song.lxlyric || "";
    console.log("[playSong] 保存歌词信息到state:", {
      lyricLength: (_i = state.lyric) == null ? void 0 : _i.length,
      tlyricLength: (_j = state.tlyric) == null ? void 0 : _j.length,
      rlyricLength: (_k = state.rlyric) == null ? void 0 : _k.length,
      lxlyricLength: (_l = state.lxlyric) == null ? void 0 : _l.length
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
        state.currentSongSwitchInfo = {
          originalSource: song.source,
          newSource: switchInfo.newSource,
          newSongId: switchInfo.newSongId || null,
          newSongName: switchInfo.newSongName || null,
          newSongSinger: switchInfo.newSongSinger || null,
          newSongData: null
          // 从存储恢复的换源信息没有完整newSong数据，用switchInfo字段构建
        };
        const sourceNameMap = {
          "tx": "QQ音乐",
          "wy": "网易云音乐",
          "kg": "酷狗音乐",
          "kw": "酷我音乐",
          "mg": "咪咕音乐"
        };
        const newSourceName = sourceNameMap[switchInfo.newSource] || switchInfo.newSource;
        this.setStatusText(`已恢复换源: ${newSourceName}`, 3e3);
      } else {
        state.currentSongSwitchInfo = null;
      }
      if (!playUrl && (song.url || song.playUrl)) {
        playUrl = song.url || song.playUrl;
        console.log("[playSong] 使用歌曲自带的URL:", playUrl);
        await utils_musicUrlCache.setCachedMusicUrl(song.id, actualQuality, playUrl, song.source);
        console.log("[playSong] 已将URL保存到缓存");
        state.isUsingCachedUrl = true;
        state.usedCachedUrlForCurrentPlay = true;
      }
      if (!playUrl) {
        let cacheLookupId = song.id;
        let cacheLookupSource = song.source;
        if (switchInfo && switchInfo.newSource) {
          cacheLookupId = switchInfo.newSongId || song.id;
          cacheLookupSource = switchInfo.newSource;
          console.log("[playSong] 换源场景，使用新source/id查找URL缓存:", cacheLookupId, cacheLookupSource);
        }
        const cachedUrl = await utils_musicUrlCache.getCachedMusicUrl(cacheLookupId, actualQuality, cacheLookupSource);
        if (cachedUrl) {
          console.log("[playSong] 使用缓存的播放URL:", cachedUrl);
          playUrl = cachedUrl;
          state.isUsingCachedUrl = true;
          state.usedCachedUrlForCurrentPlay = true;
        }
      }
      if (playUrl) {
        console.log("[playSong] 最终使用播放URL:", playUrl);
        if (!playUrl.startsWith("file://") && this.isUnsupportedAudioFormat(playUrl)) {
          const formatMatch = playUrl.match(/\.(\w+)(?:\?|$)/);
          const formatExt = formatMatch ? "." + formatMatch[1] : "未知格式";
          console.warn(`[playSong] ❌ 检测到不支持的音频格式: ${formatExt}，跳过播放`);
          const clearSongId = song.id;
          const clearSource = song.source || "tx";
          const qualities = ["128k", "320k", "flac"];
          for (const q of qualities) {
            utils_musicUrlCache.removeCachedMusicUrl(clearSongId, q, clearSource).catch((e) => {
              console.error("[playSong] 清除缓存失败:", q, e);
            });
          }
          common_vendor.index.showToast({
            title: `不支持${formatExt}格式，切换下一首`,
            icon: "none",
            duration: 2e3
          });
          this.handlePlayErrorFallback();
          return;
        }
        this.setStatusText("尝试播放歌曲...", 0);
        const secureUrl = playUrl;
        let coverImgUrl = ((_m = song.al) == null ? void 0 : _m.picUrl) || ((_n = song.album) == null ? void 0 : _n.picUrl) || song.img || "";
        if (coverImgUrl) {
          coverImgUrl = coverImgUrl.replace(/^http:/, "https:");
        }
        console.log("[playSong] 设置背景音频属性:", {
          title: song.name || "未知歌曲",
          singer: this.formatArtists(song),
          coverImgUrl,
          epname: ((_o = song.al) == null ? void 0 : _o.name) || ((_p = song.album) == null ? void 0 : _p.name) || "未知专辑",
          src: secureUrl
        });
        state.audioContext.title = song.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(song);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_q = song.al) == null ? void 0 : _q.name) || ((_r = song.album) == null ? void 0 : _r.name) || "未知专辑";
        state.audioContext.src = secureUrl;
        state.currentSongUrlLoaded = true;
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
        const isAiTempId = String(song.id || "").startsWith("ai_recommend_");
        console.log("[playSong] 🔍 检查是否需要搜索:", {
          name: song.name,
          id: song.id,
          source: song.source,
          isAiTempId
        });
        if (isAiTempId) {
          console.log("[playSong] 🎵 检测到AI临时ID，开始搜索真实音源...");
          state.isLoading = true;
          this.setStatusText(`🔍 正在搜索：${song.name} - ${song.singer}`);
          try {
            const searchedSong = await utils_aiSongSearch.searchAiSongSource(song, (text) => this.setStatusText(text));
            console.log("[playSong] ✅ 搜索成功:", searchedSong.name, "[真实ID:", searchedSong.id, ", 音源:", searchedSong.source, "]");
            const oldId = song.id;
            const oldSource = song.source;
            song.id = searchedSong.id;
            song.source = searchedSong.source;
            song.songmid = searchedSong.songmid || song.songmid;
            song.hash = searchedSong.hash || song.hash;
            state.currentSong = song;
            this.setStatusText("");
            console.log("[playSong] 📝 ID已更新:", oldId, "→", song.id);
            console.log("[playSong] 📝 音源已更新:", oldSource, "→", song.source);
            this.updateSongInTempList(oldId, song.id, song.source);
          } catch (searchError) {
            console.error("[playSong] ❌ AI歌曲搜索失败:", searchError);
            state.isLoading = false;
            state.isGettingUrl = false;
            this.setStatusText(`❌ 搜索失败：${searchError.message || "无法找到歌曲音源"}`);
            setTimeout(() => {
              this.clearStatusText();
              console.log("[playSong] AI歌曲搜索失败，自动切换到下一首...");
              this.playNext();
            }, 2e3);
            return;
          }
        }
        console.log("[playSong] 歌曲没有已有URL，调用API获取");
        console.log("[playSong] 用户选择的音质:", state.audioQuality);
        console.log("[playSong] 实际使用的音质:", actualQuality);
        this.setStatusText("正在获取播放链接...", 0);
        state.urlFetchStartTime = Date.now();
        const currentSongIdForUrlFetch = song.id;
        let songForUrl = song;
        if (state.currentSongSwitchInfo && state.currentSongSwitchInfo.newSource) {
          if (state.currentSongSwitchInfo.newSongData) {
            songForUrl = { ...state.currentSongSwitchInfo.newSongData };
            songForUrl.source = state.currentSongSwitchInfo.newSource;
            console.log("[playSong] 使用换源newSongData获取URL, 显示原歌曲:", song.name, "获取URL用source:", songForUrl.source);
          } else if (state.currentSongSwitchInfo.newSongId) {
            songForUrl = { ...song };
            songForUrl.source = state.currentSongSwitchInfo.newSource;
            songForUrl.id = state.currentSongSwitchInfo.newSongId;
            if (state.currentSongSwitchInfo.originalSource !== state.currentSongSwitchInfo.newSource) {
              songForUrl.songmid = "";
              songForUrl.hash = "";
              songForUrl.copyrightId = "";
            }
            console.log("[playSong] 使用换源信息获取URL(无newSongData), 显示原歌曲:", song.name, "获取URL用source:", songForUrl.source, "id:", songForUrl.id);
          } else {
            console.warn("[playSong] 换源信息不完整（无 newSongData 且无 newSongId），使用原始source");
            state.currentSongSwitchInfo = null;
          }
        }
        const result = await utils_api_music.getMusicUrl(songForUrl, actualQuality);
        state.urlFetchStartTime = 0;
        if (((_s = state.currentSong) == null ? void 0 : _s.id) !== currentSongIdForUrlFetch) {
          console.log("[playSong] URL获取期间歌曲已变更（iOS后台恢复或用户切换），放弃当前结果");
          return;
        }
        if (result && result.needImportScripts) {
          console.log("[playSong] 服务器未导入任何音源脚本(410)，停止播放");
          state.isLoading = false;
          state.isGettingUrl = false;
          state.playing = false;
          state.playNextRetryCount = 0;
          state.currentFailingSongId = null;
          this.clearLoadTimeout();
          this.clearQuickCheckTimeout();
          common_vendor.index.$emit("needImportScripts");
          return;
        }
        if (result && result.error && !result.url) {
          console.log("[playSong] 获取URL失败:", result.errorMsg, "statusCode:", result.errorStatusCode);
          state.isLoading = false;
          state.isGettingUrl = false;
          state.playing = false;
          state.playNextRetryCount = 0;
          state.currentFailingSongId = null;
          this.clearLoadTimeout();
          this.clearQuickCheckTimeout();
          common_vendor.index.showToast({
            title: result.errorMsg || "获取播放链接失败",
            icon: "none",
            duration: 3e3
          });
          return;
        }
        console.log("[playSong] API获取成功");
        console.log("[playSong] URL:", result.url);
        console.log("[playSong] 音质:", result.type);
        console.log("[playSong] 返回的歌词信息:", {
          hasLyric: !!result.lyric,
          hasTlyric: !!result.tlyric,
          hasRlyric: !!result.rlyric,
          hasLxlyric: !!result.lxlyric,
          lyricLength: (_t = result.lyric) == null ? void 0 : _t.length
        });
        this.clearStatusText();
        state.isGettingUrl = false;
        if (result.scriptName) {
          state.currentScriptName = result.scriptName;
          console.log("[playSong] 保存音源提供者名称:", result.scriptName);
        } else {
          state.currentScriptName = "";
        }
        if (result.meshContributor) {
          state.currentMeshContributor = result.meshContributor;
          console.log("[playSong] 保存公共服务器分享者名称:", result.meshContributor);
        } else {
          state.currentMeshContributor = "";
        }
        if (result.lyric || result.tlyric || result.rlyric || result.lxlyric) {
          this.setLyrics({
            lyric: result.lyric || "",
            tlyric: result.tlyric || "",
            rlyric: result.rlyric || "",
            lxlyric: result.lxlyric || ""
          });
          console.log("[playSong] 已从API返回数据更新歌词到state");
        }
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
          const fallbackMatchedSong = result.fallback.matchedSong;
          const hasValidMatchedSong = fallbackMatchedSong && fallbackMatchedSong.id;
          state.currentSongSwitchInfo = {
            originalSource: result.fallback.originalSource,
            newSource: result.fallback.newSource,
            newSongId: (fallbackMatchedSong == null ? void 0 : fallbackMatchedSong.id) || null,
            newSongName: (fallbackMatchedSong == null ? void 0 : fallbackMatchedSong.name) || null,
            newSongSinger: (fallbackMatchedSong == null ? void 0 : fallbackMatchedSong.singer) || null,
            // 保存完整的换源后歌曲数据，供 refreshMusicUrl 使用（避免 id/source 不匹配）
            newSongData: hasValidMatchedSong ? {
              id: fallbackMatchedSong.id,
              name: fallbackMatchedSong.name || song.name,
              singer: fallbackMatchedSong.singer || song.singer,
              source: result.fallback.newSource,
              songmid: fallbackMatchedSong.songmid || "",
              hash: fallbackMatchedSong.hash || "",
              copyrightId: fallbackMatchedSong.copyrightId || "",
              interval: fallbackMatchedSong.interval || song.interval,
              duration: fallbackMatchedSong.duration || song.duration,
              dt: fallbackMatchedSong.dt || song.dt,
              album: fallbackMatchedSong.album || song.album,
              albumName: fallbackMatchedSong.albumName || song.albumName,
              al: fallbackMatchedSong.al || song.al
            } : null
          };
          if (state.currentSong) {
            state.currentSong._toggleMusicInfo = {
              originalSource: result.fallback.originalSource,
              newSource: result.fallback.newSource,
              matchedSong: fallbackMatchedSong,
              toggleTime: Date.now()
            };
          }
          console.log("[playSong] 已记录换源信息（不修改显示信息）");
          this.showSourceSwitchHintMessage();
          if (hasValidMatchedSong) {
            const originalSongId = String(song.id).replace(/^(tx|wy|kg|kw|mg)_/, "") || song.id;
            const switchInfo2 = {
              originalSource: result.fallback.originalSource,
              newSource: result.fallback.newSource,
              newSongId: fallbackMatchedSong.id,
              newSongName: fallbackMatchedSong.name || song.name,
              newSongSinger: fallbackMatchedSong.singer || song.singer,
              quality: actualQuality
            };
            utils_musicSwitchSourceStorage.saveMusicSwitchSource(originalSongId, switchInfo2);
            console.log("[playSong] 已保存换源信息到本地存储:", result.fallback.originalSource, "->", result.fallback.newSource);
          } else {
            console.warn("[playSong] matchedSong 不完整，跳过保存换源信息到本地存储");
          }
        }
        const cacheSongId = ((_v = (_u = result.fallback) == null ? void 0 : _u.matchedSong) == null ? void 0 : _v.id) || song.id;
        const cacheSource = ((_x = (_w = result.fallback) == null ? void 0 : _w.matchedSong) == null ? void 0 : _x.source) || song.source;
        await utils_musicUrlCache.setCachedMusicUrl(cacheSongId, actualQuality, result.url, cacheSource);
        if (song._isAiSong && song._isSearched) {
          this.syncAiSongInfoToTempList(song, cacheSongId, cacheSource);
        }
        if (this.isUnsupportedAudioFormat(result.url)) {
          const formatMatch = result.url.match(/\.(\w+)(?:\?|$)/);
          const formatExt = formatMatch ? "." + formatMatch[1] : "未知格式";
          console.warn(`[playSong] ❌ API返回的URL格式不支持: ${formatExt}，切换下一首`);
          const clearSongId = ((_z = (_y = result.fallback) == null ? void 0 : _y.matchedSong) == null ? void 0 : _z.id) || song.id;
          const clearSource = ((_B = (_A = result.fallback) == null ? void 0 : _A.matchedSong) == null ? void 0 : _B.source) || song.source;
          const qualities = ["128k", "320k", "flac"];
          for (const q of qualities) {
            utils_musicUrlCache.removeCachedMusicUrl(clearSongId, q, clearSource).catch((e) => {
              console.error("[playSong] 清除缓存失败:", q, e);
            });
          }
          state.isLoading = false;
          state.isGettingUrl = false;
          common_vendor.index.showToast({
            title: `不支持${formatExt}格式，切换下一首`,
            icon: "none",
            duration: 2e3
          });
          this.handlePlayErrorFallback();
          return;
        }
        state.currentSong = {
          ...state.currentSong,
          url: result.url,
          playUrl: result.url
        };
        console.log("[playSong] 已更新当前歌曲URL到state.currentSong");
        const secureUrl = result.url;
        let coverImgUrl = ((_C = song.al) == null ? void 0 : _C.picUrl) || ((_D = song.album) == null ? void 0 : _D.picUrl) || song.img || "";
        if (coverImgUrl) {
          coverImgUrl = coverImgUrl.replace(/^http:/, "https:");
        }
        console.log("[playSong] 设置背景音频属性:", {
          title: song.name || "未知歌曲",
          singer: this.formatArtists(song),
          coverImgUrl,
          epname: ((_E = song.al) == null ? void 0 : _E.name) || ((_F = song.album) == null ? void 0 : _F.name) || "未知专辑",
          src: secureUrl
        });
        state.audioContext.title = song.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(song);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_G = song.al) == null ? void 0 : _G.name) || ((_H = song.album) == null ? void 0 : _H.name) || "未知专辑";
        state.audioContext.src = secureUrl;
        state.currentSongUrlLoaded = true;
        this.startLoadTimeout();
        console.log("[playSong] 背景音频src已设置，开始播放");
      }
      this.addToHistory(song);
      const singerName = this.formatArtists(song);
      store_modules_user.userStore.increaseListenCount(singerName);
      this.syncElectronMedia(song);
      state.showMiniPlayer = true;
      state.isLoading = false;
      const currentPlayerListId2 = store_modules_list.listStore.state.playInfo.playerListId || store_modules_list.LIST_IDS.DEFAULT;
      let playIndex = store_modules_list.listStore.state.playInfo.playIndex ?? 0;
      let saveListId = currentPlayerListId2;
      let playlist = null;
      if (currentPlayerListId2 === store_modules_list.LIST_IDS.TEMP) {
        const tempListMeta2 = store_modules_list.listStore.state.tempList.meta;
        if (tempListMeta2 && tempListMeta2.id) {
          saveListId = tempListMeta2.id;
          console.log("[playSong] 临时列表的真实歌单ID:", saveListId);
        }
        playlist = store_modules_list.listStore.state.tempList.list;
      } else {
        playlist = store_modules_list.listStore.getList(currentPlayerListId2);
      }
      const savedTime = state._pendingSeekTime || 0;
      const savedMaxTime = state._pendingSeekDuration || 0;
      if (playlist && playlist.length > 0) {
        console.log("[playSong] 保存播放状态, saveListId:", saveListId, "playlist长度:", playlist.length, "savedTime:", savedTime);
        utils_playInfoStorage.savePlayState({
          time: savedTime,
          maxTime: savedMaxTime,
          listId: saveListId,
          index: playIndex,
          currentSong: state.currentSong,
          originalSong: state.originalSong,
          playlist,
          playing: state.playing
        });
      }
      this.loadLyricsForSong(song);
    } catch (error) {
      console.error("[playSong] 播放歌曲失败:", error);
      console.error("[playSong] 错误信息:", error.message);
      state.isLoading = false;
      state.error = error.message || "播放失败";
      state.urlFetchStartTime = 0;
      state.isGettingUrl = false;
      this.clearLoadTimeout();
      this.clearQuickCheckTimeout();
      const configErrors = ["请先选择服务器模式", "请先设置服务器地址", "请先导入音源插件"];
      if (configErrors.includes(error.message)) {
        console.log("[playSong] 配置类错误，不自动切歌，直接停止");
        state.playing = false;
        state.playNextRetryCount = 0;
        state.currentFailingSongId = null;
        return;
      }
      console.log("[playSong] 播放失败，调用 handlePlayErrorFallback 进行失败处理");
      this.handlePlayErrorFallback();
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
    this.syncElectronMedia();
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
    var _a, _b, _c, _d;
    console.log("[resume] 继续播放, 当前 playing 状态:", state.playing);
    console.log("[resume] 当前歌曲:", (_a = state.currentSong) == null ? void 0 : _a.name, "ID:", (_b = state.currentSong) == null ? void 0 : _b.id);
    console.log("[resume] audioContext:", state.audioContext ? "存在" : "不存在");
    console.log("[resume] audioContext.src:", (_c = state.audioContext) == null ? void 0 : _c.src);
    if (!state.currentSong || !state.currentSong.id) {
      console.log("[resume] 没有当前歌曲，无法播放");
      return;
    }
    if (!state.audioContext) {
      console.log("[resume] audioContext 不存在，初始化...");
      this.initAudioContext();
    }
    if (!state.audioContext) {
      console.log("[resume] audioContext 初始化失败，无法播放");
      return;
    }
    if (!state.audioContext.src) {
      console.log("[resume] 音频源未加载，重新加载歌曲");
      const savedTime = state.currentTime || 0;
      const savedDuration = state.duration || 0;
      state._pendingSeekTime = savedTime;
      state._pendingSeekDuration = savedDuration;
      state._pendingSeekSongId = ((_d = state.currentSong) == null ? void 0 : _d.id) || null;
      const songForReload = { ...state.currentSong };
      delete songForReload.url;
      delete songForReload.playUrl;
      this.playSong(songForReload).then(() => {
        console.log("[resume] 歌曲重新加载完成");
      }).catch((err) => {
        console.error("[resume] 歌曲重新加载失败:", err);
      });
      return;
    }
    if (!state.playing) {
      state.audioContext.play();
      state.playing = true;
      this.syncElectronMedia();
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
  async playNext() {
    var _a, _b, _c;
    console.log("[playNext] ========== 播放下一首 ==========");
    console.log("[playNext] 播放列表长度:", state.playlist.length);
    console.log("[playNext] 当前歌曲:", (_a = state.currentSong) == null ? void 0 : _a.name, "ID:", (_b = state.currentSong) == null ? void 0 : _b.id);
    console.log("[playNext] 👆 用户主动操作，重置失败计数");
    state.isUserManualSwitch = true;
    state.playNextRetryCount = 0;
    state.isPlaybackStopped = false;
    state.currentFailingSongId = null;
    const togglePlayMethod = state.playMode === store_modules_list.PLAY_MODE.random ? "random" : state.playMode === store_modules_list.PLAY_MODE.singleLoop ? "singleLoop" : "listLoop";
    if (state.playlist.length === 0) {
      console.log("[playNext] state.playlist 为空，尝试从 listStore 获取下一首");
      const nextSongInfo = store_modules_list.listStore.getNextSong(togglePlayMethod, false);
      if (nextSongInfo && nextSongInfo.musicInfo) {
        console.log("[playNext] 从 listStore 获取到下一首:", nextSongInfo.musicInfo.name);
        store_modules_list.listStore.setPlayMusicInfo(nextSongInfo.listId, nextSongInfo.musicInfo, nextSongInfo.isTempPlay);
        await this.playSong(nextSongInfo.musicInfo);
        return;
      } else {
        console.log("[playNext] listStore 也无法获取下一首，无法切换");
        return;
      }
    }
    if (state.playlist.length === 1) {
      console.log("[playNext] 只有一首歌，重播当前歌曲");
      this.playSong(state.playlist[0]);
      return;
    }
    let nextIndex = 0;
    const currentIndex = state.playlist.findIndex((song) => {
      var _a2;
      return song.id === ((_a2 = state.currentSong) == null ? void 0 : _a2.id);
    });
    console.log("[playNext] 当前索引:", currentIndex);
    if (currentIndex === -1) {
      console.log("[playNext] 当前歌曲不在 state.playlist 中（可能正在播放临时列表），使用 listStore 获取下一首");
      const nextSongInfo = store_modules_list.listStore.getNextSong(togglePlayMethod, false);
      if (nextSongInfo && nextSongInfo.musicInfo) {
        console.log("[playNext] 从 listStore 获取到下一首:", nextSongInfo.musicInfo.name);
        store_modules_list.listStore.setPlayMusicInfo(nextSongInfo.listId, nextSongInfo.musicInfo, nextSongInfo.isTempPlay);
        await this.playSong(nextSongInfo.musicInfo);
        return;
      } else {
        console.log("[playNext] listStore 也无法获取下一首，从头开始");
        nextIndex = 0;
      }
    } else if (state.playMode === store_modules_list.PLAY_MODE.random) {
      nextIndex = Math.floor(Math.random() * state.playlist.length);
      console.log("[playNext] 随机模式，下一首索引:", nextIndex);
    } else {
      if (currentIndex === -1) {
        nextIndex = 0;
      } else {
        nextIndex = (currentIndex + 1) % state.playlist.length;
      }
      console.log("[playNext] 顺序模式，下一首索引:", nextIndex);
    }
    console.log("[playNext] 即将播放:", (_c = state.playlist[nextIndex]) == null ? void 0 : _c.name);
    this.playSong(state.playlist[nextIndex]);
  },
  // 播放上一首
  async playPrev() {
    var _a, _b, _c;
    console.log("[playPrev] ========== 播放上一首 ==========");
    console.log("[playPrev] 播放列表长度:", state.playlist.length);
    console.log("[playPrev] 当前歌曲:", (_a = state.currentSong) == null ? void 0 : _a.name, "ID:", (_b = state.currentSong) == null ? void 0 : _b.id);
    console.log("[playPrev] 👆 用户主动操作，重置失败计数");
    state.isUserManualSwitch = true;
    state.playNextRetryCount = 0;
    state.isPlaybackStopped = false;
    state.currentFailingSongId = null;
    const togglePlayMethod = state.playMode === store_modules_list.PLAY_MODE.random ? "random" : "listLoop";
    if (state.playlist.length === 0) {
      console.log("[playPrev] state.playlist 为空，尝试从 listStore 获取上一首");
      const prevSongInfo = store_modules_list.listStore.getPrevSong(togglePlayMethod);
      if (prevSongInfo && prevSongInfo.musicInfo) {
        console.log("[playPrev] 从 listStore 获取到上一首:", prevSongInfo.musicInfo.name);
        store_modules_list.listStore.setPlayMusicInfo(prevSongInfo.listId, prevSongInfo.musicInfo, prevSongInfo.isTempPlay);
        await this.playSong(prevSongInfo.musicInfo);
        return;
      } else {
        console.log("[playPrev] listStore 也无法获取上一首，无法切换");
        return;
      }
    }
    if (state.playlist.length === 1) {
      console.log("[playPrev] 只有一首歌，重播当前歌曲");
      this.playSong(state.playlist[0]);
      return;
    }
    let prevIndex = 0;
    const currentIndex = state.playlist.findIndex((song) => {
      var _a2;
      return song.id === ((_a2 = state.currentSong) == null ? void 0 : _a2.id);
    });
    console.log("[playPrev] 当前索引:", currentIndex);
    if (currentIndex === -1) {
      console.log("[playPrev] 当前歌曲不在 state.playlist 中（可能正在播放临时列表），使用 listStore 获取上一首");
      const prevSongInfo = store_modules_list.listStore.getPrevSong(togglePlayMethod);
      if (prevSongInfo && prevSongInfo.musicInfo) {
        console.log("[playPrev] 从 listStore 获取到上一首:", prevSongInfo.musicInfo.name);
        store_modules_list.listStore.setPlayMusicInfo(prevSongInfo.listId, prevSongInfo.musicInfo, prevSongInfo.isTempPlay);
        await this.playSong(prevSongInfo.musicInfo);
        return;
      } else {
        console.log("[playPrev] listStore 也无法获取上一首，从头开始");
        prevIndex = 0;
      }
    } else if (state.playMode === store_modules_list.PLAY_MODE.random) {
      prevIndex = Math.floor(Math.random() * state.playlist.length);
      console.log("[playPrev] 随机模式，上一首索引:", prevIndex);
    } else {
      if (currentIndex === -1) {
        prevIndex = 0;
      } else {
        prevIndex = (currentIndex - 1 + state.playlist.length) % state.playlist.length;
      }
      console.log("[playPrev] 顺序模式，上一首索引:", prevIndex);
    }
    console.log("[playPrev] 即将播放:", (_c = state.playlist[prevIndex]) == null ? void 0 : _c.name);
    this.playSong(state.playlist[prevIndex]);
  },
  // 处理播放结束 - 支持 5 种播放模式
  async handlePlayEnded() {
    var _a, _b, _c;
    console.log("[playerStore] ========== 播放结束处理开始 ==========");
    console.log("[playerStore] 当前模式:", state.playMode);
    if (state.currentSong && state.currentSong.id) {
      this.recordPlayCompletion(state.currentSong);
    }
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
        if (nextSongInfo.listId && ((_c = nextSongInfo.musicInfo) == null ? void 0 : _c.id)) {
          store_modules_list.listStore.updatePlayIndexByListId(nextSongInfo.listId, nextSongInfo.musicInfo.id);
          console.log("[playerStore] ✅ 已更新 playIndex 到歌曲:", nextSongInfo.musicInfo.name, "ID:", nextSongInfo.musicInfo.id);
        }
        this.playSong(nextSongInfo.musicInfo);
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
    var _a;
    if (state.isRecoveringPlayback) {
      console.log("[playerStore] 正在恢复播放中，跳过此次调用");
      return;
    }
    if (state.isPlaybackStopped) {
      console.warn("[playerStore] ⚠️ 已因连续失败停止播放，忽略此次调用");
      return;
    }
    state.isRecoveringPlayback = true;
    console.log("[playerStore] 切换下一首，当前全局失败次数:", state.playNextRetryCount);
    const nextSong = store_modules_list.listStore.getNextSong();
    if (nextSong && nextSong.musicInfo) {
      console.log("[playerStore] 播放下一首:", nextSong.musicInfo.name, `(全局失败次数: ${state.playNextRetryCount}/5)`);
      if (nextSong.listId && ((_a = nextSong.musicInfo) == null ? void 0 : _a.id)) {
        store_modules_list.listStore.updatePlayIndexByListId(nextSong.listId, nextSong.musicInfo.id);
        console.log("[playerStore] ✅ 已更新 playIndex 到歌曲:", nextSong.musicInfo.name, "ID:", nextSong.musicInfo.id);
      }
      playerStore.playSong(nextSong.musicInfo);
    } else {
      console.log("[playerStore] 没有下一首歌曲，停止播放");
      playerStore.pause();
    }
    setTimeout(() => {
      state.isRecoveringPlayback = false;
    }, 1e3);
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
    let albumName = "";
    if (typeof song.album === "string") {
      albumName = song.album;
    } else if (song.album && typeof song.album === "object") {
      albumName = song.album.name || "";
    }
    const cleanSong = {
      id: song.id,
      name: song.name,
      singer: song.singer || "",
      ar: song.ar || [],
      album: albumName,
      al: song.al || null,
      duration: song.duration || 0,
      source: song.source || "",
      img: song.img || "",
      picUrl: song.picUrl || "",
      songmid: song.songmid || "",
      hash: song.hash || "",
      copyrightId: song.copyrightId || ""
    };
    const existsIndex = state.playHistory.findIndex((item) => item.id === song.id);
    if (existsIndex !== -1) {
      state.playHistory.splice(existsIndex, 1);
    }
    state.playHistory.unshift(cleanSong);
    if (state.playHistory.length > 2e3) {
      state.playHistory.pop();
    }
    common_vendor.index.setStorageSync("playHistory", state.playHistory);
    console.log("[playerStore] 播放历史已更新，当前数量:", state.playHistory.length);
  },
  // 添加到最近播放歌单历史
  addToListHistory(playlistInfo) {
    console.log("[playerStore] 添加到最近播放歌单:", playlistInfo);
    if (!playlistInfo || !playlistInfo.id || !playlistInfo.source) {
      console.log("[playerStore] 歌单信息不完整，跳过记录");
      return;
    }
    if (playlistInfo.source === "local" || playlistInfo.source === "user" || playlistInfo.id.startsWith("userlist_")) {
      console.log("[playerStore] 本地歌单，不记录到最近播放歌单");
      return;
    }
    const listInfo = {
      id: playlistInfo.id,
      name: playlistInfo.name || "未知歌单",
      source: playlistInfo.source,
      coverUrl: playlistInfo.coverUrl || playlistInfo.img || "",
      playCount: playlistInfo.playCount || 0,
      trackCount: playlistInfo.trackCount || 0,
      addPlayTime: Date.now(),
      link: playlistInfo.link || ""
    };
    const existsIndex = state.playListHistory.findIndex(
      (item) => item.id === listInfo.id && item.source === listInfo.source
    );
    if (existsIndex !== -1) {
      state.playListHistory.splice(existsIndex, 1);
    }
    state.playListHistory.unshift(listInfo);
    if (state.playListHistory.length > 100) {
      state.playListHistory.pop();
    }
    common_vendor.index.setStorageSync("playListHistory", state.playListHistory);
    console.log("[playerStore] 最近播放歌单已更新，当前数量:", state.playListHistory.length);
  },
  // ========== 不喜欢列表管理（用于AI推荐负反馈）==========
  // 添加歌曲到不喜欢列表
  addToDislikeList(song) {
    var _a, _b;
    if (!song || !song.id) {
      console.warn("[playerStore] addToDislikeList - 无效的歌曲信息");
      return false;
    }
    const songId = String(song.id);
    const existsIndex = state.dislikeList.findIndex((item) => item.id === songId);
    if (existsIndex !== -1) {
      console.log("[playerStore] 歌曲已在不喜欢列表中:", song.name);
      return false;
    }
    const dislikeRecord = {
      id: songId,
      name: song.name,
      singer: this.formatSingerName(song.singer || song.ar || song.artists),
      album: ((_a = song.album) == null ? void 0 : _a.name) || ((_b = song.al) == null ? void 0 : _b.name) || "",
      source: song.source || "",
      duration: song.duration || 0,
      addTime: Date.now(),
      reason: "manual",
      // manual(手动点击) / auto_skip(快速跳过)
      playedDuration: state.currentTime || 0,
      // 播放了多久就切换了
      totalDuration: state.duration || 0
    };
    state.dislikeList.unshift(dislikeRecord);
    if (state.dislikeList.length > 500) {
      state.dislikeList.pop();
    }
    common_vendor.index.setStorageSync("dislikeList", state.dislikeList);
    console.log("[playerStore] ✅ 已添加到不喜欢列表:", song.name, "当前数量:", state.dislikeList.length);
    return true;
  },
  // 从不喜欢列表移除
  removeFromDislikeList(songId) {
    if (!songId)
      return false;
    const index = state.dislikeList.findIndex((item) => item.id === String(songId));
    if (index === -1) {
      console.log("[playerStore] 歌曲不在不喜欢列表中");
      return false;
    }
    const removed = state.dislikeList.splice(index, 1)[0];
    common_vendor.index.setStorageSync("dislikeList", state.dislikeList);
    console.log("[playerStore] ✅ 已从不喜欢列表移除:", removed.name);
    return true;
  },
  // 检查歌曲是否在不喜欢列表中
  isDisliked(songId) {
    if (!songId)
      return false;
    return state.dislikeList.some((item) => item.id === String(songId));
  },
  // 获取不喜欢列表
  getDislikeList() {
    return state.dislikeList;
  },
  // 清空不喜欢列表
  clearDislikeList() {
    state.dislikeList = [];
    common_vendor.index.removeStorageSync("dislikeList");
    console.log("[playerStore] ✅ 已清空不喜欢列表");
  },
  // 格式化歌手名称（兼容多种数据结构）
  formatSingerName(singerData) {
    if (!singerData)
      return "未知歌手";
    if (typeof singerData === "string")
      return singerData;
    if (Array.isArray(singerData)) {
      return singerData.map((s) => typeof s === "string" ? s : s.name).join("、");
    }
    return singerData.name || "未知歌手";
  },
  // ========== 完播率记录（用于AI推荐）==========
  // 记录播放完成信息（包含完播率）
  recordPlayCompletion(song) {
    if (!song || !song.id)
      return;
    const songId = String(song.id);
    const completionRate = state.duration > 0 ? state.currentTime / state.duration : 0;
    let playRecord = common_vendor.index.getStorageSync(`playRecord_${songId}`);
    if (!playRecord) {
      playRecord = {
        id: songId,
        name: song.name,
        singer: this.formatSingerName(song.singer || song.ar || song.artists),
        source: song.source || "",
        firstPlayTime: Date.now(),
        lastPlayTime: Date.now(),
        playCount: 0,
        fullPlayCount: 0,
        totalPlayedDuration: 0,
        completions: []
        // 历史完播率记录
      };
    }
    playRecord.lastPlayTime = Date.now();
    playRecord.playCount++;
    playRecord.totalPlayedDuration += state.currentTime || 0;
    playRecord.completions.push({
      time: Date.now(),
      rate: completionRate,
      duration: state.currentTime || 0,
      totalDuration: state.duration || 0
    });
    if (completionRate >= 0.8) {
      playRecord.fullPlayCount++;
    }
    if (playRecord.completions.length > 50) {
      playRecord.completions = playRecord.completions.slice(-50);
    }
    common_vendor.index.setStorageSync(`playRecord_${songId}`, playRecord);
    console.log("[playerStore] 📊 记录播放完成:", song.name, {
      完播率: `${(completionRate * 100).toFixed(1)}%`,
      总播放次数: playRecord.playCount,
      完整播放次数: playRecord.fullPlayCount
    });
  },
  // 清除音乐URL缓存
  async clearMusicUrlCache(song) {
    if (!song || !song.id) {
      console.warn("[clearMusicUrlCache] 无效的歌曲信息");
      return;
    }
    console.log("[clearMusicUrlCache] 开始清除URL缓存:", song.id, song.name);
    try {
      const qualities = ["128k", "320k", "flac"];
      for (const quality of qualities) {
        await utils_musicUrlCache.removeCachedMusicUrl(song.id, quality, song.source);
        console.log(`[clearMusicUrlCache] 已清除 ${quality} 缓存`);
      }
      console.log("[clearMusicUrlCache] ✅ URL缓存已全部清除");
    } catch (error) {
      console.error("[clearMusicUrlCache] ❌ 清除缓存失败:", error);
      throw error;
    }
  },
  // 处理播放错误的降级方案（2026-04-30重构）
  // 核心逻辑：
  //   - 连续5首不同的歌曲自动切换失败 → 强制停止
  //   - 同一首歌多次error事件（InnerAudio + NativeAudio）→ 只计1次
  //   - 用户主动切换歌曲 → 重置计数
  //   - 播放成功（onTimeUpdate > 3秒）→ 重置计数
  //   - 强制停止后 → 不再处理任何错误，等待用户手动操作
  handlePlayErrorFallback() {
    var _a, _b, _c;
    console.log("[handlePlayErrorFallback] ════════════════════════════");
    console.log("[handlePlayErrorFallback] 播放失败处理开始");
    console.log("[handlePlayErrorFallback] 当前歌曲ID:", (_a = state.currentSong) == null ? void 0 : _a.id);
    console.log("[handlePlayErrorFallback] 当前歌曲名:", (_b = state.currentSong) == null ? void 0 : _b.name);
    console.log("[handlePlayErrorFallback] 当前全局连续失败次数:", state.playNextRetryCount);
    console.log("[handlePlayErrorFallback] 是否已停止:", state.isPlaybackStopped);
    console.log("[handlePlayErrorFallback] 当前失败歌曲ID:", state.currentFailingSongId);
    console.log("[handlePlayErrorFallback] 是否用户主动切换:", state.isUserManualSwitch);
    if (state.isPlaybackStopped) {
      console.warn("[handlePlayErrorFallback] ⚠️ 已因连续失败停止播放，忽略此错误");
      console.log("[handlePlayErrorFallback] ════════════════════════════");
      return;
    }
    const currentSongId = (_c = state.currentSong) == null ? void 0 : _c.id;
    if (state.currentFailingSongId === currentSongId) {
      console.warn("[handlePlayErrorFallback] ⚠️ 同一首歌的重复error事件，跳过计数");
      console.log("[handlePlayErrorFallback] ════════════════════════════");
      return;
    }
    state.currentFailingSongId = currentSongId;
    if (state.isUserManualSwitch) {
      console.log("[handlePlayErrorFallback] ℹ️ 用户主动切换，不计入连续失败");
      console.log("[handlePlayErrorFallback] ════════════════════════════");
      setTimeout(() => {
        this.handlePlayEndedWithRetry();
      }, 500);
      return;
    }
    state.playNextRetryCount = (state.playNextRetryCount || 0) + 1;
    console.log("[handlePlayErrorFallback] 📊 连续失败次数:", state.playNextRetryCount, "/5");
    if (state.playNextRetryCount >= 5) {
      console.error("[handlePlayErrorFallback] ⛔ 全局连续失败已达5次，强制停止！");
      state.isPlaybackStopped = true;
      state.playNextRetryCount = 0;
      state.currentFailingSongId = null;
      state.playing = false;
      state.isLoading = false;
      state.isGettingUrl = false;
      if (state.audioContext) {
        try {
          state.audioContext.stop();
        } catch (e) {
          console.error("[handlePlayErrorFallback] 停止音频失败:", e);
        }
      }
      common_vendor.index.showToast({
        title: "连续5首播放失败，已停止",
        icon: "none",
        duration: 3e3
      });
      console.log("[handlePlayErrorFallback] ════════════════════════════");
      return;
    }
    common_vendor.index.showToast({
      title: `播放失败 (${state.playNextRetryCount}/5)，切换下一首`,
      icon: "none",
      duration: 1500
    });
    console.log("[handlePlayErrorFallback] 1.5秒后自动切换下一首...");
    console.log("[handlePlayErrorFallback] ════════════════════════════");
    setTimeout(() => {
      this.handlePlayEndedWithRetry();
    }, 1500);
  },
  // 刷新播放URL（参考洛雪音乐桌面版实现）
  // 当播放出错或超时时，尝试重新获取播放链接
  async refreshMusicUrl() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    let song = state.currentSong;
    if (!song || !song.id) {
      console.log("[refreshMusicUrl] 没有当前播放的歌曲");
      return;
    }
    if (state.isRefreshingUrl) {
      console.log("[refreshMusicUrl] 正在刷新URL，跳过");
      return;
    }
    if (state.retryNum >= 1) {
      console.log("[refreshMusicUrl] 重试次数已达上限（1次），切换到下一首");
      state.isRefreshingUrl = false;
      state.retryNum = 0;
      this.handlePlayErrorFallback();
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
      this.clearQuickCheckTimeout();
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
        const matchedSong = song._toggleMusicInfo.matchedSong;
        if (matchedSong && matchedSong.id) {
          songToRefresh = {
            ...song,
            source: song._toggleMusicInfo.newSource,
            id: matchedSong.id,
            songmid: matchedSong.songmid || "",
            hash: matchedSong.hash || "",
            copyrightId: matchedSong.copyrightId || ""
          };
        } else {
          console.warn("[refreshMusicUrl] _toggleMusicInfo.matchedSong 不完整，使用原始source刷新");
          songToRefresh = { ...song };
        }
      } else if (state.currentSongSwitchInfo && state.currentSongSwitchInfo.newSource) {
        console.log("[refreshMusicUrl] 使用 state.currentSongSwitchInfo 换源信息:", {
          originalSource: state.currentSongSwitchInfo.originalSource,
          newSource: state.currentSongSwitchInfo.newSource
        });
        if (state.currentSongSwitchInfo.newSongData) {
          songToRefresh = { ...state.currentSongSwitchInfo.newSongData };
          songToRefresh.source = state.currentSongSwitchInfo.newSource;
        } else {
          songToRefresh = { ...song };
          songToRefresh.source = state.currentSongSwitchInfo.newSource;
          if (state.currentSongSwitchInfo.newSongId) {
            songToRefresh.id = state.currentSongSwitchInfo.newSongId;
          }
          if (state.currentSongSwitchInfo.originalSource !== state.currentSongSwitchInfo.newSource) {
            songToRefresh.songmid = "";
            songToRefresh.hash = "";
            songToRefresh.copyrightId = "";
          }
        }
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
      console.log("[refreshMusicUrl] 返回的歌词信息:", {
        hasLyric: !!result.lyric,
        hasTlyric: !!result.tlyric,
        hasRlyric: !!result.rlyric,
        hasLxlyric: !!result.lxlyric,
        lyricLength: (_a = result.lyric) == null ? void 0 : _a.length
      });
      if (result.lyric || result.tlyric || result.rlyric || result.lxlyric) {
        this.setLyrics({
          lyric: result.lyric || "",
          tlyric: result.tlyric || "",
          rlyric: result.rlyric || "",
          lxlyric: result.lxlyric || ""
        });
        console.log("[refreshMusicUrl] 已从API返回数据更新歌词到state");
      }
      this.setStatusText("尝试播放歌曲...", 0);
      if (result.fallback && result.fallback.toggled) {
        console.log("[refreshMusicUrl] 检测到换源:", {
          originalSource: result.fallback.originalSource,
          newSource: result.fallback.newSource
        });
        const refreshMatchedSong = result.fallback.matchedSong;
        const refreshHasValidMatchedSong = refreshMatchedSong && refreshMatchedSong.id;
        state.currentSongSwitchInfo = {
          originalSource: result.fallback.originalSource,
          newSource: result.fallback.newSource,
          newSongId: (refreshMatchedSong == null ? void 0 : refreshMatchedSong.id) || null,
          newSongName: (refreshMatchedSong == null ? void 0 : refreshMatchedSong.name) || null,
          newSongSinger: (refreshMatchedSong == null ? void 0 : refreshMatchedSong.singer) || null,
          newSongData: refreshHasValidMatchedSong ? {
            id: refreshMatchedSong.id,
            name: refreshMatchedSong.name || song.name,
            singer: refreshMatchedSong.singer || song.singer,
            source: result.fallback.newSource,
            songmid: refreshMatchedSong.songmid || "",
            hash: refreshMatchedSong.hash || "",
            copyrightId: refreshMatchedSong.copyrightId || "",
            interval: refreshMatchedSong.interval || song.interval,
            duration: refreshMatchedSong.duration || song.duration,
            dt: refreshMatchedSong.dt || song.dt,
            album: refreshMatchedSong.album || song.album,
            albumName: refreshMatchedSong.albumName || song.albumName,
            al: refreshMatchedSong.al || song.al
          } : null
        };
        if (state.currentSong) {
          state.currentSong._toggleMusicInfo = {
            originalSource: result.fallback.originalSource,
            newSource: result.fallback.newSource,
            matchedSong: refreshMatchedSong,
            toggleTime: Date.now()
          };
        }
        console.log("[refreshMusicUrl] 已记录换源信息（不修改显示信息）");
        this.showSourceSwitchHintMessage();
        if (refreshHasValidMatchedSong) {
          const originalSongId = String(song.id).replace(/^(tx|wy|kg|kw|mg)_/, "") || song.id;
          const switchInfo = {
            originalSource: result.fallback.originalSource,
            newSource: result.fallback.newSource,
            newSongId: refreshMatchedSong.id,
            newSongName: refreshMatchedSong.name || song.name,
            newSongSinger: refreshMatchedSong.singer || song.singer,
            quality: state.audioQuality
          };
          utils_musicSwitchSourceStorage.saveMusicSwitchSource(originalSongId, switchInfo);
          console.log("[refreshMusicUrl] 已保存换源信息到本地存储:", result.fallback.originalSource, "->", result.fallback.newSource);
        } else {
          console.warn("[refreshMusicUrl] matchedSong 不完整，跳过保存换源信息到本地存储");
        }
      }
      const cacheSongId = ((_c = (_b = result.fallback) == null ? void 0 : _b.matchedSong) == null ? void 0 : _c.id) || song.id;
      const cacheSource = ((_e = (_d = result.fallback) == null ? void 0 : _d.matchedSong) == null ? void 0 : _e.source) || song.source;
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
      if (this.isUnsupportedAudioFormat(result.url)) {
        const formatMatch = result.url.match(/\.(\w+)(?:\?|$)/);
        const formatExt = formatMatch ? "." + formatMatch[1] : "未知格式";
        console.warn(`[refreshMusicUrl] ❌ 刷新后的URL格式不支持: ${formatExt}，切换下一首`);
        const clearSongId = ((_g = (_f = result.fallback) == null ? void 0 : _f.matchedSong) == null ? void 0 : _g.id) || song.id;
        const clearSource = ((_i = (_h = result.fallback) == null ? void 0 : _h.matchedSong) == null ? void 0 : _i.source) || song.source;
        const qualities2 = ["128k", "320k", "flac"];
        for (const q of qualities2) {
          utils_musicUrlCache.removeCachedMusicUrl(clearSongId, q, clearSource).catch((e) => {
            console.error("[refreshMusicUrl] 清除缓存失败:", q, e);
          });
        }
        state.isRefreshingUrl = false;
        common_vendor.index.showToast({
          title: `不支持${formatExt}格式，切换下一首`,
          icon: "none",
          duration: 2e3
        });
        this.handlePlayErrorFallback();
        return;
      }
      const secureUrl = result.url;
      if (state.audioContext) {
        const coverImgUrl = ((_j = song.al) == null ? void 0 : _j.picUrl) || ((_k = song.album) == null ? void 0 : _k.picUrl) || song.img || "/static/images/default-cover.png";
        state.audioContext.title = song.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(song);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_l = song.al) == null ? void 0 : _l.name) || ((_m = song.album) == null ? void 0 : _m.name) || "未知专辑";
        state.audioContext.src = secureUrl;
        state.currentSongUrlLoaded = true;
        console.log("[refreshMusicUrl] 已更新背景音频src，等待自动播放");
      }
      console.log("[refreshMusicUrl] 刷新URL成功，当前重试次数:", state.retryNum);
      this.setStatusText("播放链接已刷新", 2e3);
    } catch (error) {
      console.error("[refreshMusicUrl] 刷新URL失败:", error);
      state.isRefreshingUrl = false;
      console.log("[refreshMusicUrl] 刷新URL失败，切换下一首");
      common_vendor.index.showToast({
        title: "播放失败，切换下一首",
        icon: "none"
      });
      this.handlePlayErrorFallback();
    }
  },
  // 🔑 手动换源专用方法（从换源弹窗确认后调用）
  // 保持 state.currentSong 显示为原歌曲信息，使用 newSong 的完整数据获取播放URL
  async switchToSource(originalSong, newSong) {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log("[switchToSource] 手动换源:", {
      originalName: originalSong.name,
      originalSource: originalSong.source,
      newName: newSong.name,
      newSource: newSong.source
    });
    if (!newSong || !newSong.source) {
      console.error("[switchToSource] 新歌曲信息无效");
      common_vendor.index.showToast({ title: "换源失败：歌曲信息无效", icon: "none" });
      return;
    }
    state.isRefreshingUrl = false;
    state.retryNum = 0;
    state.lastRefreshSongId = newSong.id;
    state.currentSongSwitchInfo = {
      originalSource: originalSong.source,
      newSource: newSong.source,
      newSongId: newSong.id || null,
      newSongName: newSong.name || null,
      newSongSinger: newSong.singer || null,
      // 保存完整的newSong数据，用于获取URL（包含songmid/hash/copyrightId等）
      newSongData: { ...newSong }
    };
    if (state.currentSong) {
      state.currentSong._toggleMusicInfo = {
        originalSource: originalSong.source,
        newSource: newSong.source,
        matchedSong: newSong,
        toggleTime: Date.now()
      };
    }
    this.showSourceSwitchHintMessage();
    this.setStatusText("正在切换音源...", 0);
    try {
      const qualityMap = {
        "standard": "320k",
        "high": "flac",
        "lossless": "flac24bit",
        "low": "128k"
      };
      const actualQuality = qualityMap[state.audioQuality] || "320k";
      if (originalSong.id) {
        await this.clearMusicUrlCache(originalSong.id, actualQuality, originalSong.source);
      }
      const songForUrl = {
        ...newSong,
        source: newSong.source || newSong.sourceId
      };
      console.log("[switchToSource] 使用新歌曲信息获取URL:", {
        id: songForUrl.id,
        source: songForUrl.source,
        songmid: songForUrl.songmid,
        hash: songForUrl.hash
      });
      let playUrl = newSong.url || newSong.playUrl;
      let result = null;
      if (!playUrl) {
        const requestData = utils_musicParams.buildMusicRequestParams(songForUrl, actualQuality);
        if (!requestData) {
          throw new Error("构建请求参数失败");
        }
        result = await utils_api_music.getMusicUrl(requestData);
        playUrl = result.url;
        console.log("[switchToSource] 获取到URL:", playUrl);
        if (result.lyric || result.tlyric || result.rlyric || result.lxlyric) {
          this.setLyrics({
            lyric: result.lyric || "",
            tlyric: result.tlyric || "",
            rlyric: result.rlyric || "",
            lxlyric: result.lxlyric || ""
          });
        }
      }
      if (!playUrl) {
        throw new Error("未获取到播放URL");
      }
      const cacheSongId = newSong.id || originalSong.id;
      const cacheSource = newSong.source || newSong.sourceId;
      const qualities = ["128k", "320k", "flac"];
      for (const q of qualities) {
        await utils_musicUrlCache.setCachedMusicUrl(cacheSongId, q, playUrl, cacheSource);
      }
      if (state.currentSong.id !== originalSong.id) {
        console.log("[switchToSource] 歌曲已更换，不更新播放");
        return;
      }
      const displaySong = { ...newSong };
      if (((_a = originalSong.al) == null ? void 0 : _a.picUrl) && !((_b = displaySong.al) == null ? void 0 : _b.picUrl)) {
        displaySong.al = { ...displaySong.al, picUrl: originalSong.al.picUrl };
      }
      if (originalSong.img && !displaySong.img) {
        displaySong.img = originalSong.img;
      }
      state.currentSong = displaySong;
      console.log("[switchToSource] 已更新 state.currentSong 为换源后的歌曲（用于显示）");
      if (state.audioContext) {
        const coverImgUrl = ((_c = displaySong.al) == null ? void 0 : _c.picUrl) || ((_d = displaySong.album) == null ? void 0 : _d.picUrl) || displaySong.img || ((_e = originalSong.al) == null ? void 0 : _e.picUrl) || originalSong.img || "/static/images/default-cover.png";
        state.audioContext.title = displaySong.name || "未知歌曲";
        state.audioContext.singer = this.formatArtists(displaySong);
        state.audioContext.coverImgUrl = coverImgUrl;
        state.audioContext.epname = ((_f = displaySong.al) == null ? void 0 : _f.name) || ((_g = displaySong.album) == null ? void 0 : _g.name) || "未知专辑";
        state.audioContext.src = playUrl;
        state.currentSongUrlLoaded = true;
        console.log("[switchToSource] 已更新背景音频src，使用换源后歌曲显示信息");
      }
      this.clearStatusText();
      console.log("[switchToSource] 换源成功");
    } catch (error) {
      console.error("[switchToSource] 换源失败:", error);
      state.isRefreshingUrl = false;
      this.clearStatusText();
      common_vendor.index.showToast({
        title: "换源失败：" + (error.message || "未知错误"),
        icon: "none"
      });
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
      console.log("[startLoadTimeout] 加载超时，刷新URL");
      this.clearQuickCheckTimeout();
      this.setStatusText("播放加载超时，正在重试...", 0);
      if (state.retryNum < 1) {
        this.refreshMusicUrl();
      } else {
        console.log("[startLoadTimeout] 重试次数用完，切换下一首");
        this.handlePlayErrorFallback();
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
  // 开始快速检测超时定时器（3秒，仅用于缓存URL）
  startQuickCheckTimeout() {
    if (state.quickCheckTimeout) {
      clearTimeout(state.quickCheckTimeout);
    }
    state.quickCheckTimeout = setTimeout(() => {
      if (!state.playing && state.isUsingCachedUrl) {
        console.log("[startQuickCheckTimeout] 缓存URL快速检测超时，链接可能过期");
        this.clearLoadTimeout();
        this.setStatusText("正在检查链接...", 0);
        state.isUsingCachedUrl = false;
        if (state.retryNum < 2) {
          console.log("[startQuickCheckTimeout] 尝试刷新URL");
          this.refreshMusicUrl();
        } else {
          console.log("[startQuickCheckTimeout] 重试次数用完，切换下一首");
          common_vendor.index.showToast({
            title: "缓存链接已过期，切换下一首",
            icon: "none"
          });
          this.handlePlayEndedWithRetry();
        }
      }
    }, 3e3);
    console.log("[startQuickCheckTimeout] 已启动快速检测超时定时器（3秒）");
  },
  // 清除快速检测超时定时器
  clearQuickCheckTimeout() {
    if (state.quickCheckTimeout) {
      clearTimeout(state.quickCheckTimeout);
      state.quickCheckTimeout = null;
      console.log("[clearQuickCheckTimeout] 已清除快速检测超时定时器");
    }
  },
  // 检查URL是否为当前平台不支持的音频格式
  // 各平台音频格式支持情况：
  //   H5(浏览器):    mp3✅ m4a/aac✅ wav✅ ogg✅ flac✅ opus✅  | wma❌ mmp4❌
  //   微信小程序:     mp3✅ m4a/aac✅ wav✅ ogg❌ flac❌ opus❌  | wma❌ mmp4❌
  //   Android(App):  mp3✅ m4a/aac✅ wav✅ ogg✅ flac✅ opus✅  | wma❌ mmp4❌
  //   iOS(App):      mp3✅ m4a/aac✅ wav✅ ogg❌ flac✅ opus❌  | wma❌ mmp4❌
  isUnsupportedAudioFormat(url) {
    if (!url || typeof url !== "string")
      return false;
    if (url.startsWith("file://"))
      return false;
    const lowerUrl = url.toLowerCase();
    const universallyUnsupported = [".wma", ".mmp4"];
    if (universallyUnsupported.some((fmt) => lowerUrl.includes(fmt)))
      return true;
    const mpUnsupported = [".ogg", ".flac", ".opus"];
    return mpUnsupported.some((fmt) => lowerUrl.includes(fmt));
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
      const seekingDebounceTimer = state.seekingDebounceTimer;
      if (seekingDebounceTimer) {
        clearTimeout(seekingDebounceTimer);
      }
      state.seekingDebounceTimer = setTimeout(() => {
        console.log("[playerStore] seek 后自动重置 isUserSeeking");
        state.isUserSeeking = false;
        state.seekingDebounceTimer = null;
      }, 3e3);
    }
  },
  // 设置用户是否正在快进（用于禁用通知栏切歌误判）
  setUserSeeking(isSeeking) {
    console.log("[playerStore] setUserSeeking:", isSeeking);
    state.isUserSeeking = isSeeking;
    if (isSeeking) {
      if (state.seekingDebounceTimer) {
        clearTimeout(state.seekingDebounceTimer);
      }
      state.seekingDebounceTimer = setTimeout(() => {
        console.log("[playerStore] 自动重置 isUserSeeking");
        state.isUserSeeking = false;
        state.seekingDebounceTimer = null;
      }, 5e3);
    } else {
      if (state.seekingDebounceTimer) {
        clearTimeout(state.seekingDebounceTimer);
        state.seekingDebounceTimer = null;
      }
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
    const dislikeList = common_vendor.index.getStorageSync("dislikeList");
    if (dislikeList)
      state.dislikeList = dislikeList;
    console.log("[playerStore] restoreState - 不喜欢列表数量:", state.dislikeList.length);
    const playListHistory = common_vendor.index.getStorageSync("playListHistory");
    if (playListHistory)
      state.playListHistory = playListHistory;
    console.log("[playerStore] restoreState - 最近播放歌单数量:", state.playListHistory.length);
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
      const possibleSources = [];
      if (song._toggleMusicInfo && song._toggleMusicInfo.newSource) {
        possibleSources.push(song._toggleMusicInfo.newSource);
      }
      if (!possibleSources.includes(song.source)) {
        possibleSources.push(song.source);
      }
      if (!possibleSources.includes("tx")) {
        possibleSources.push("tx");
      }
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
  },
  // 恢复播放状态（APP启动时调用）
  async restorePlayState() {
    var _a, _b, _c;
    console.log("[playerStore] ========== restorePlayState 开始 ==========");
    try {
      const playState = await utils_playInfoStorage.getPlayState();
      if (!playState) {
        console.log("[playerStore] 没有保存的播放状态，无需恢复");
        return null;
      }
      if (!playState.currentSong || !playState.currentSong.id || playState.currentSong.id === 0) {
        console.log("[playerStore] 保存的播放状态无效（无有效歌曲），跳过恢复");
        return null;
      }
      console.log("[playerStore] 恢复播放状态:", {
        playing: playState.playing,
        currentSong: (_a = playState.currentSong) == null ? void 0 : _a.name,
        playlistLength: (_b = playState.playlist) == null ? void 0 : _b.length,
        time: playState.time,
        listId: playState.listId,
        index: playState.index
      });
      if (playState.currentSong) {
        state.currentSong = playState.currentSong;
        if (state.currentSong.url) {
          console.log("[playerStore] 恢复状态时清除旧URL");
          delete state.currentSong.url;
        }
        if (state.currentSong.playUrl) {
          console.log("[playerStore] 恢复状态时清除旧playUrl");
          delete state.currentSong.playUrl;
        }
        console.log("[playerStore] 已恢复当前歌曲:", state.currentSong.name, "ID:", state.currentSong.id);
      }
      if (playState.originalSong) {
        state.originalSong = playState.originalSong;
        console.log("[playerStore] 已恢复原始歌曲:", state.originalSong.name);
      }
      if (playState.playlist && playState.playlist.length > 0) {
        state.playlist = playState.playlist;
        console.log("[playerStore] 已恢复播放列表，长度:", state.playlist.length);
      }
      if (playState.time > 0) {
        state.currentTime = playState.time;
        state._pendingSeekTime = playState.time;
        state._pendingSeekSongId = ((_c = playState.currentSong) == null ? void 0 : _c.id) || null;
        console.log("[playerStore] 已设置待恢复播放进度:", state.currentTime, "歌曲ID:", state._pendingSeekSongId);
      }
      if (playState.maxTime > 0) {
        state.duration = playState.maxTime;
        state._pendingSeekDuration = playState.maxTime;
        console.log("[playerStore] 已恢复歌曲时长:", state.duration);
      }
      state.playing = false;
      console.log("[playerStore] 播放状态设置为暂停（等待用户操作）");
      console.log("[playerStore] ========== restorePlayState 恢复完成 ==========");
      return playState;
    } catch (error) {
      console.error("[playerStore] 恢复播放状态失败:", error);
      return null;
    }
  }
};
exports.playerStore = playerStore;
