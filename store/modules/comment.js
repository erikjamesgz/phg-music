"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api_comment = require("../../utils/api/comment.js");
const state = {
  commentCache: {},
  hotComments: [],
  latestComments: [],
  isLoading: false,
  totalCount: 0,
  showDanmaku: true,
  currentSongId: null,
  currentSource: null,
  currentSongInfo: null,
  hotCommentPage: 1,
  latestCommentPage: 1,
  hasMoreHot: true,
  hasMoreLatest: true,
  // 记录已加载的热门评论页码
  loadedHotPages: /* @__PURE__ */ new Set([1]),
  // 记录已加载的最新评论页码
  loadedLatestPages: /* @__PURE__ */ new Set(),
  // 最大页码
  hotMaxPage: 1,
  latestMaxPage: 1,
  // 全局已完成的加载更多次数
  loadMoreCount: 0
};
const commentStore = {
  get state() {
    return state;
  },
  getState() {
    return state;
  },
  getHotComments() {
    return state.hotComments;
  },
  getLatestComments() {
    return state.latestComments;
  },
  getShowDanmaku() {
    return state.showDanmaku;
  },
  getTotalCount() {
    return state.totalCount;
  },
  initDanmaku() {
    const stored = common_vendor.index.getStorageSync("showCommentDanmaku");
    state.showDanmaku = stored !== "false";
    console.log("[CommentStore] 初始化弹幕设置:", state.showDanmaku);
    common_vendor.index.$on("commentDanmakuChanged", (show) => {
      state.showDanmaku = show;
      console.log("[CommentStore] 弹幕设置变化:", show);
    });
  },
  async fetchComments(songInfo, forceRefresh = false) {
    if (!songInfo || !songInfo.source || !songInfo.id) {
      console.log("[CommentStore] 歌曲信息不完整");
      return null;
    }
    const cacheKey = `${songInfo.source}_${songInfo.id}`;
    if (state.isLoading && state.currentSongId === songInfo.id && state.currentSource === songInfo.source) {
      console.log("[CommentStore] 正在加载同一首歌曲的评论，等待完成");
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!state.isLoading) {
            clearInterval(checkInterval);
            if (state.commentCache[cacheKey]) {
              resolve(state.commentCache[cacheKey]);
            } else {
              resolve(null);
            }
          }
        }, 100);
      });
    }
    if (!forceRefresh && state.commentCache[cacheKey]) {
      console.log("[CommentStore] 使用缓存数据:", cacheKey);
      const cachedData = state.commentCache[cacheKey];
      state.hotComments = cachedData.hotComments || [];
      state.latestComments = cachedData.latestComments || [];
      state.totalCount = cachedData.totalCount || 0;
      state.hotMaxPage = cachedData.hotMaxPage || 1;
      state.latestMaxPage = cachedData.latestMaxPage || 1;
      state.loadedHotPages = /* @__PURE__ */ new Set([1]);
      state.loadedLatestPages = /* @__PURE__ */ new Set();
      state.loadMoreCount = 0;
      return cachedData;
    }
    state.isLoading = true;
    state.currentSongId = songInfo.id;
    state.currentSource = songInfo.source;
    state.currentSongInfo = songInfo;
    state.hotCommentPage = 1;
    state.latestCommentPage = 1;
    state.hasMoreHot = true;
    state.hasMoreLatest = true;
    state.loadedHotPages = /* @__PURE__ */ new Set();
    state.loadedLatestPages = /* @__PURE__ */ new Set();
    state.hotMaxPage = 1;
    state.latestMaxPage = 1;
    state.loadMoreCount = 0;
    try {
      let hotComments = [];
      let latestComments = [];
      let totalCount = 0;
      const apiParams = {
        id: songInfo.id,
        name: songInfo.name,
        singer: songInfo.singer,
        source: songInfo.source,
        songmid: songInfo.songmid,
        hash: songInfo.hash,
        copyrightId: songInfo.copyrightId
      };
      console.log("[CommentStore] 获取评论参数:", apiParams);
      let hotData = null;
      try {
        hotData = await utils_api_comment.getHotComment(apiParams);
      } catch (e) {
        console.log("[CommentStore] 获取热门评论失败:", e);
      }
      if (hotData && hotData.comments && hotData.comments.length > 0) {
        hotComments = hotData.comments;
        totalCount = hotData.total || hotData.comments.length;
        state.hotCommentPage = 1;
        state.hasMoreHot = hotComments.length >= 20;
        state.hotMaxPage = hotData.maxPage || 1;
        console.log("[CommentStore] 热门评论获取成功:", hotComments.length, "hasMore:", state.hasMoreHot, "maxPage:", state.hotMaxPage);
      } else {
        state.hasMoreHot = false;
      }
      if (hotComments.length < 10) {
        console.log("[CommentStore] 热门评论少于10条，尝试获取最新评论补充");
        try {
          const newData = await utils_api_comment.getNewComment({
            ...apiParams,
            page: 1
          });
          if (newData && newData.comments && newData.comments.length > 0) {
            latestComments = newData.comments;
            state.latestCommentPage = 1;
            state.hasMoreLatest = latestComments.length >= 20;
            state.latestMaxPage = newData.maxPage || 1;
            if (totalCount === 0) {
              totalCount = newData.total || newData.comments.length;
            }
            console.log("[CommentStore] 最新评论获取成功:", latestComments.length, "hasMore:", state.hasMoreLatest, "maxPage:", state.latestMaxPage);
          } else {
            state.hasMoreLatest = false;
          }
        } catch (e) {
          console.log("[CommentStore] 获取最新评论失败:", e);
          state.hasMoreLatest = false;
        }
      }
      const result = {
        hotComments,
        latestComments,
        totalCount,
        hotMaxPage: state.hotMaxPage,
        latestMaxPage: state.latestMaxPage
      };
      state.commentCache[cacheKey] = result;
      state.hotComments = hotComments;
      state.latestComments = latestComments;
      state.totalCount = totalCount;
      console.log("[CommentStore] 评论获取完成:", {
        hotCount: hotComments.length,
        latestCount: latestComments.length,
        totalCount
      });
      if (hotComments.length > 0) {
        state.loadedHotPages.add(1);
      }
      state.isLoading = false;
      return result;
    } catch (error) {
      console.log("[CommentStore] 获取评论失败:", error);
      state.isLoading = false;
      return null;
    }
  },
  // 随机获取评论
  // requestIndex: 组件当前的请求次数（从1开始）
  async fetchMoreComments(requestIndex = 1) {
    if (!state.currentSongInfo) {
      console.log("[CommentStore] 没有当前歌曲信息");
      return null;
    }
    if (state.isLoading) {
      console.log("[CommentStore] 正在加载中，返回loading状态");
      return "loading";
    }
    if (!state.hasMoreHot && !state.hasMoreLatest) {
      console.log("[CommentStore] 没有更多评论了");
      return null;
    }
    if (requestIndex <= state.loadMoreCount) {
      console.log("[CommentStore] 请求次数", requestIndex, "<= 全局次数", state.loadMoreCount, "返回已加载的数据");
      return {
        allComments: [...state.hotComments, ...state.latestComments],
        alreadyLoaded: true
      };
    }
    const getRandomUnloadedPage = (loadedPages, maxPage) => {
      if (maxPage <= 1)
        return null;
      const unloadedPages = [];
      for (let p = 1; p <= maxPage; p++) {
        if (!loadedPages.has(p)) {
          unloadedPages.push(p);
        }
      }
      if (unloadedPages.length === 0)
        return null;
      const randomIdx = Math.floor(Math.random() * unloadedPages.length);
      return unloadedPages[randomIdx];
    };
    let pageToLoad = null;
    if (state.hasMoreHot) {
      pageToLoad = getRandomUnloadedPage(state.loadedHotPages, state.hotMaxPage);
      if (pageToLoad === null) {
        console.log("[CommentStore] 热门评论页已全部加载，切换到最新评论");
        state.hasMoreHot = false;
      }
    }
    if ((!state.hasMoreHot || pageToLoad === null) && state.hasMoreLatest) {
      const latestPageToLoad = getRandomUnloadedPage(state.loadedLatestPages, state.latestMaxPage);
      if (latestPageToLoad !== null) {
        pageToLoad = latestPageToLoad;
      } else {
        console.log("[CommentStore] 最新评论页已全部加载");
        state.hasMoreLatest = false;
      }
    }
    if (pageToLoad === null) {
      console.log("[CommentStore] 没有可加载的页码了");
      state.hasMoreHot = false;
      state.hasMoreLatest = false;
      return null;
    }
    const isHotComment = state.hasMoreHot && pageToLoad <= state.hotMaxPage && !state.loadedHotPages.has(pageToLoad);
    state.isLoading = true;
    const apiParams = {
      id: state.currentSongInfo.id,
      name: state.currentSongInfo.name,
      singer: state.currentSongInfo.singer,
      source: state.currentSongInfo.source,
      songmid: state.currentSongInfo.songmid,
      hash: state.currentSongInfo.hash,
      copyrightId: state.currentSongInfo.copyrightId
    };
    let newComments = [];
    if (isHotComment) {
      try {
        console.log("[CommentStore] 获取热门评论页:", pageToLoad);
        const hotData = await utils_api_comment.getHotComment({
          ...apiParams,
          page: pageToLoad
        });
        if (hotData && hotData.comments && hotData.comments.length > 0) {
          newComments = hotData.comments;
          state.hotCommentPage = pageToLoad;
          state.loadedHotPages.add(pageToLoad);
          if (hotData.maxPage) {
            state.hotMaxPage = hotData.maxPage;
          }
          const totalLoaded = state.hotComments.length + state.latestComments.length;
          const hasMoreByCount = state.totalCount > 0 && totalLoaded >= state.totalCount;
          const hasUnloadedPage = getRandomUnloadedPage(state.loadedHotPages, state.hotMaxPage) !== null;
          state.hasMoreHot = hasUnloadedPage && !hasMoreByCount;
          state.hotComments = [...state.hotComments, ...newComments];
          console.log("[CommentStore] 热门评论获取成功:", newComments.length, "hasMoreHot:", state.hasMoreHot, "maxPage:", state.hotMaxPage);
        } else {
          state.hasMoreHot = false;
        }
      } catch (e) {
        console.log("[CommentStore] 获取热门评论失败:", e);
        state.hasMoreHot = false;
      }
    } else if (state.hasMoreLatest) {
      try {
        console.log("[CommentStore] 获取最新评论页:", pageToLoad);
        const newData = await utils_api_comment.getNewComment({
          ...apiParams,
          page: pageToLoad
        });
        if (newData && newData.comments && newData.comments.length > 0) {
          newComments = newData.comments;
          state.latestCommentPage = pageToLoad;
          state.loadedLatestPages.add(pageToLoad);
          if (newData.maxPage) {
            state.latestMaxPage = newData.maxPage;
          }
          const totalLoaded = state.hotComments.length + state.latestComments.length;
          const hasMoreByCount = state.totalCount > 0 && totalLoaded >= state.totalCount;
          const hasUnloadedPage = getRandomUnloadedPage(state.loadedLatestPages, state.latestMaxPage) !== null;
          state.hasMoreLatest = hasUnloadedPage && !hasMoreByCount;
          state.latestComments = [...state.latestComments, ...newComments];
          console.log("[CommentStore] 最新评论获取成功:", newComments.length, "hasMoreLatest:", state.hasMoreLatest, "maxPage:", state.latestMaxPage);
        } else {
          state.hasMoreLatest = false;
        }
      } catch (e) {
        console.log("[CommentStore] 获取最新评论失败:", e);
        state.hasMoreLatest = false;
      }
    }
    const cacheKey = `${state.currentSource}_${state.currentSongId}`;
    if (state.commentCache[cacheKey]) {
      state.commentCache[cacheKey].hotComments = state.hotComments;
      state.commentCache[cacheKey].latestComments = state.latestComments;
    }
    state.isLoading = false;
    if (newComments.length > 0) {
      state.loadMoreCount++;
    }
    console.log(
      "[CommentStore] 加载更多完成, 新增:",
      newComments.length,
      "hasMoreHot:",
      state.hasMoreHot,
      "hasMoreLatest:",
      state.hasMoreLatest,
      "loadMoreCount:",
      state.loadMoreCount
    );
    return newComments.length > 0 ? newComments : null;
  },
  hasMoreComments() {
    return state.hasMoreHot || state.hasMoreLatest;
  },
  clearComments() {
    state.hotComments = [];
    state.latestComments = [];
    state.totalCount = 0;
    state.currentSongId = null;
    state.currentSource = null;
    state.currentSongInfo = null;
    state.hotCommentPage = 1;
    state.latestCommentPage = 1;
    state.hasMoreHot = true;
    state.hasMoreLatest = true;
  },
  getCommentCache(songId, source) {
    if (!songId || !source)
      return null;
    const cacheKey = `${source}_${songId}`;
    return state.commentCache[cacheKey] || null;
  },
  clearCommentCache(songId, source) {
    if (!songId || !source)
      return;
    const cacheKey = `${source}_${songId}`;
    if (state.commentCache[cacheKey]) {
      delete state.commentCache[cacheKey];
      console.log("[CommentStore] 清除评论缓存:", cacheKey);
    }
  },
  setShowDanmaku(show) {
    state.showDanmaku = show;
  }
};
exports.commentStore = commentStore;
