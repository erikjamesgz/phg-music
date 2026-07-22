"use strict";
const common_vendor = require("./common/vendor.js");
const utils_system = require("./utils/system.js");
const utils_format = require("./utils/format.js");
const utils_api_tags = require("./utils/api/tags.js");
const utils_imageProxy = require("./utils/imageProxy.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  (_easycom_roc_icon_plus + MiniPlayer)();
}
const MiniPlayer = () => "./components/player/MiniPlayer.js";
const STORAGE_KEY_SOURCE = "songlist_last_source";
const STORAGE_KEY_TAG = "songlist_last_tag";
const STORAGE_KEY_SORT = "songlist_last_sort";
const STORAGE_KEY_MAX_PAGE_PREFIX = "songlist_max_page_";
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
    const statusBarHeight = utils_system.getStatusBarHeight();
    common_vendor.computed(() => ({
      height: `${statusBarHeight}px`
    }));
    const headerStyle = common_vendor.computed(() => ({
      paddingTop: `${statusBarHeight}px`
    }));
    const darkMode = common_vendor.ref(false);
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
    common_vendor.ref(null);
    const itemsPerRow = common_vendor.ref(3);
    const getItemHeightClass = (index) => {
      if (!isTablet.value)
        return "";
      const perRow = itemsPerRow.value || 3;
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const isHigh = row % 2 === 0 ? col % 2 === 0 : col % 2 === 1;
      return isHigh ? "item-high" : "item-low";
    };
    const calculateItemsPerRow = () => {
      if (!isTablet.value)
        return;
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const screenWidth = systemInfo.windowWidth || systemInfo.screenWidth || 0;
        const availableWidth = screenWidth - 32 - 16;
        const minItemWidth = 180;
        const gap = 16;
        const count = Math.floor((availableWidth + gap) / (minItemWidth + gap));
        itemsPerRow.value = Math.max(2, Math.min(count, 7));
        console.log("[SonglistList] 屏幕宽度:", screenWidth, "可用宽度:", availableWidth, "每行item数:", itemsPerRow.value);
      } catch (e) {
        console.error("[SonglistList] 计算失败:", e);
        itemsPerRow.value = 3;
      }
    };
    const emit = __emit;
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[SonglistList] 初始化暗黑模式:", darkMode.value);
    };
    const sourceList = [
      { id: "kw", name: "酷我音乐" },
      { id: "kg", name: "酷狗音乐" },
      { id: "tx", name: "QQ音乐" },
      { id: "mg", name: "咪咕音乐" },
      { id: "wy", name: "网易云音乐" }
    ];
    const sourceTagsMap = common_vendor.ref({
      kw: [{ id: "", name: "推荐" }],
      kg: [{ id: "", name: "推荐" }],
      tx: [{ id: "", name: "推荐" }],
      mg: [{ id: "", name: "推荐" }],
      wy: [{ id: "", name: "推荐" }]
    });
    const isLoadingTags = common_vendor.ref(false);
    const loadTags = async (source) => {
      console.log("[SonglistList] 加载标签:", source);
      if (isLoadingTags.value) {
        console.log("[SonglistList] 标签正在加载中，跳过");
        return;
      }
      isLoadingTags.value = true;
      try {
        const tags = await utils_api_tags.getTagsBySource(source);
        console.log("[SonglistList] 获取到标签分组:", tags.length);
        const flatTags = utils_api_tags.flattenTags(tags);
        console.log("[SonglistList] 扁平化后标签数量:", flatTags.length);
        sourceTagsMap.value[source] = flatTags;
        const currentTagExists = flatTags.some((tag) => tag.id === currentTagId.value);
        if (!currentTagExists) {
          currentTagId.value = "";
        }
      } catch (error) {
        console.error("[SonglistList] 加载标签失败:", error);
      } finally {
        isLoadingTags.value = false;
        checkTagScrollStatus();
      }
    };
    const sourceSortMap = {
      kw: [
        { id: "hot", name: "最热" },
        { id: "new", name: "最新" }
      ],
      kg: [
        { id: "6", name: "最热" },
        { id: "5", name: "最新" }
      ],
      tx: [
        { id: "5", name: "最热" },
        { id: "2", name: "最新" }
      ],
      mg: [],
      wy: [
        { id: "hot", name: "最热" },
        { id: "new", name: "最新" }
      ]
    };
    const getLastSource = () => {
      try {
        return common_vendor.index.getStorageSync(STORAGE_KEY_SOURCE) || "tx";
      } catch (e) {
        return "tx";
      }
    };
    const getLastTag = () => {
      try {
        return common_vendor.index.getStorageSync(STORAGE_KEY_TAG) || "";
      } catch (e) {
        return "";
      }
    };
    const getLastSort = () => {
      try {
        return common_vendor.index.getStorageSync(STORAGE_KEY_SORT) || "hot";
      } catch (e) {
        return "hot";
      }
    };
    const saveSource = (source) => {
      try {
        common_vendor.index.setStorageSync(STORAGE_KEY_SOURCE, source);
      } catch (e) {
        console.error("[SonglistList] 保存平台失败:", e);
      }
    };
    const saveTag = (tag) => {
      try {
        common_vendor.index.setStorageSync(STORAGE_KEY_TAG, tag);
      } catch (e) {
        console.error("[SonglistList] 保存标签失败:", e);
      }
    };
    const saveSort = (sort) => {
      try {
        common_vendor.index.setStorageSync(STORAGE_KEY_SORT, sort);
      } catch (e) {
        console.error("[SonglistList] 保存排序失败:", e);
      }
    };
    const currentSource = common_vendor.ref(getLastSource());
    const currentTagId = common_vendor.ref(getLastTag());
    const currentSortId = common_vendor.ref(getLastSort());
    const songlist = common_vendor.ref([]);
    const currentPage = common_vendor.ref(1);
    const isLoading = common_vendor.ref(false);
    const isLoadingMore = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const loadError = common_vendor.ref("");
    const showSourcePicker = common_vendor.ref(false);
    const tagScrollLeft = common_vendor.ref(0);
    const canScrollTagLeft = common_vendor.ref(false);
    const canScrollTagRight = common_vendor.ref(false);
    common_vendor.ref(null);
    const currentSourceName = common_vendor.computed(() => {
      const source = sourceList.find((s) => s.id === currentSource.value);
      return source ? source.name : "酷我音乐";
    });
    const tagList = common_vendor.computed(() => {
      return sourceTagsMap.value[currentSource.value] || [{ id: "", name: "推荐" }];
    });
    const sortList = common_vendor.computed(() => {
      return sourceSortMap[currentSource.value] || [];
    });
    const handleSonglistImageError = (event, item) => {
      if (!item || !item.img)
        return;
      let currentProxyIndex = 0;
      if (item.img.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (item.img.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (item.img.includes("jina.ai"))
        currentProxyIndex = 3;
      const nextUrl = utils_imageProxy.handleImageError(event, item.img, currentProxyIndex);
      if (nextUrl) {
        item.img = nextUrl;
      }
    };
    const goBack = () => {
      if (isTablet.value) {
        emit("close");
        return;
      }
      common_vendor.index.navigateBack();
    };
    const selectSource = (sourceId) => {
      console.log("[SonglistList] 切换平台:", sourceId);
      currentSource.value = sourceId;
      currentTagId.value = "";
      currentSortId.value = "hot";
      currentPage.value = 1;
      songlist.value = [];
      hasMore.value = true;
      showSourcePicker.value = false;
      saveSource(sourceId);
      saveTag("");
      saveSort("hot");
      loadTags(sourceId);
      fetchSonglist();
      setTimeout(() => {
        checkTagScrollStatus();
      }, 200);
    };
    const checkTagScrollStatus = () => {
      setTimeout(() => {
        canScrollTagRight.value = tagList.value.length > 5;
        console.log("[SonglistList] 检测标签滚动状态 - 是否有更多:", canScrollTagRight.value, "标签数量:", tagList.value.length);
      }, 100);
    };
    let tagClientWidth = 0;
    const onTagScroll = (e) => {
      const scrollLeft = e.detail.scrollLeft;
      const scrollWidth = e.detail.scrollWidth;
      const clientWidth = e.detail.clientWidth || tagClientWidth;
      console.log("[SonglistList-Tag] onScroll 触发 - scrollLeft:", scrollLeft, "scrollWidth:", scrollWidth, "clientWidth:", clientWidth);
      if (e.detail.clientWidth)
        tagClientWidth = e.detail.clientWidth;
      updateTagButtonState(scrollLeft, scrollWidth, clientWidth);
    };
    const updateTagButtonState = (scrollLeft, scrollWidth, clientWidth) => {
      if (!scrollWidth || !clientWidth || clientWidth <= 0) {
        console.log("[SonglistList-Tag] 尺寸信息不完整 - scrollWidth:", scrollWidth, "clientWidth:", clientWidth);
        return;
      }
      const canLeft = scrollLeft > 1;
      const canRight = scrollLeft < scrollWidth - clientWidth - 1;
      console.log(
        "[SonglistList-Tag] 更新按钮状态 - canLeft:",
        canLeft,
        "canRight:",
        canRight,
        "当前scrollLeft:",
        scrollLeft,
        "最大可滚动:",
        scrollWidth - clientWidth
      );
      canScrollTagLeft.value = canLeft;
      canScrollTagRight.value = canRight;
    };
    const selectTag = (tagId) => {
      currentTagId.value = tagId;
      currentPage.value = 1;
      songlist.value = [];
      hasMore.value = true;
      saveTag(tagId);
      fetchSonglist();
      setTimeout(() => {
        checkTagScrollStatus();
      }, 100);
    };
    const selectSort = (sortId) => {
      currentSortId.value = sortId;
      currentPage.value = 1;
      songlist.value = [];
      hasMore.value = true;
      saveSort(sortId);
      fetchSonglist();
    };
    const fetchSonglist = async () => {
      if (isLoading.value)
        return;
      if (currentPage.value === 1) {
        isLoading.value = true;
      }
      loadError.value = "";
      try {
        const source = currentSource.value;
        const tagId = currentTagId.value;
        const sortId = currentSortId.value;
        const storageKey = `${STORAGE_KEY_MAX_PAGE_PREFIX}${source}_${tagId || "all"}_${sortId}`;
        let targetPage = currentPage.value;
        const rn = 30;
        if (currentPage.value === 1) {
          const savedMaxPage = common_vendor.index.getStorageSync(storageKey);
          if (savedMaxPage && savedMaxPage > 0) {
            targetPage = Math.floor(Math.random() * savedMaxPage) + 1;
            console.log("[SonglistList] 使用保存的页码范围:", savedMaxPage, "随机选择页码:", targetPage);
          } else {
            console.log("[SonglistList] 首次打开，使用第1页");
            targetPage = 1;
          }
        }
        let url = "";
        switch (source) {
          case "kw": {
            const kwOrder = sortId === "new" ? "new" : "hot";
            if (tagId) {
              const [kwId, kwType] = tagId.split("-");
              if (kwType === "10000") {
                url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${targetPage}&id=${kwId}&rn=${rn}`;
              } else if (kwType === "43") {
                url = `http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${kwId}&prod=pc`;
              } else {
                url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${targetPage}&id=${kwId}&rn=${rn}`;
              }
            } else {
              url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${targetPage}&rn=${rn}&order=${kwOrder}`;
            }
            console.log("酷我音乐请求URL:", url);
            break;
          }
          case "kg": {
            const kgSortId = sortId || "6";
            url = `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${kgSortId}&c=${tagId || ""}&p=${targetPage}`;
            console.log("酷狗音乐请求URL:", url);
            break;
          }
          case "tx": {
            const txOrder = sortId === "2" ? 2 : 5;
            const txData = {
              comm: { cv: 1602, ct: 20 },
              playlist: {
                method: tagId ? "get_category_content" : "get_playlist_by_tag",
                param: tagId ? { titleid: parseInt(tagId), caller: "0", category_id: parseInt(tagId), size: rn, page: targetPage - 1, use_page: 1 } : { id: 1e7, sin: rn * (targetPage - 1), size: rn, order: txOrder, cur_page: targetPage },
                module: tagId ? "playlist.PlayListCategoryServer" : "playlist.PlayListPlazaServer"
              }
            };
            url = `https://u.y.qq.com/cgi-bin/musicu.fcg?loginUin=0&hostUin=0&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=wk_v15.json&needNewCode=0&data=${encodeURIComponent(JSON.stringify(txData))}`;
            console.log("QQ音乐请求URL:", url);
            break;
          }
          case "mg": {
            if (tagId) {
              url = `https://app.c.nf.migu.cn/pc/v1.0/template/musiclistplaza-listbytag/release?pageNumber=${targetPage}&templateVersion=2&tagId=${tagId}`;
            } else {
              url = `https://app.c.nf.migu.cn/pc/bmw/page-data/playlist-square-recommend/v1.0?templateVersion=2&pageNo=${targetPage}`;
            }
            console.log("咪咕音乐请求URL:", url);
            break;
          }
          case "wy": {
            const wyOrder = sortId === "new" ? "new" : "hot";
            const wyCat = tagId || "全部";
            url = `https://music.163.com/api/playlist/list?cat=${encodeURIComponent(wyCat)}&order=${wyOrder}&limit=${rn}&offset=${(targetPage - 1) * rn}`;
            console.log("网易云音乐请求URL:", url);
            break;
          }
          default: {
            url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${targetPage}&rn=${rn}&order=hot`;
            console.log("默认请求URL:", url);
          }
        }
        const res = await common_vendor.index.request({
          url,
          method: "GET"
        });
        if (res.statusCode === 200) {
          const result = parseSonglistData(res.data, source);
          console.log("=== fetchSonglist 完成 ===");
          console.log("result.list.length:", result.list.length);
          console.log("targetPage:", targetPage);
          console.log("result.total:", result.total);
          if (currentPage.value === 1 && result.total > 0) {
            const maxPage = Math.ceil(result.total / rn) || 1;
            common_vendor.index.setStorageSync(storageKey, maxPage);
            console.log("[SonglistList] 保存最大页码:", maxPage, "存储键:", storageKey);
          }
          if (currentPage.value === 1) {
            songlist.value = result.list;
          } else {
            songlist.value = [...songlist.value, ...result.list];
          }
          if (isTablet.value) {
            setTimeout(() => {
              calculateItemsPerRow();
            }, 300);
          }
          hasMore.value = result.list.length >= 30;
          console.log("hasMore 更新为:", hasMore.value);
          if (result.list.length === 0 && currentPage.value === 1) {
            loadError.value = "暂无歌单数据";
          }
        } else if (res.statusCode === 403) {
          loadError.value = "请求被拒绝，请检查网络设置";
        } else if (res.statusCode === 404) {
          loadError.value = "接口不存在";
        } else if (res.statusCode >= 500) {
          loadError.value = "服务器错误，请稍后重试";
        } else {
          throw new Error(`请求失败 (${res.statusCode})`);
        }
      } catch (error) {
        console.error("获取歌单列表失败:", error);
        loadError.value = error.message || "加载失败，请重试";
      } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    };
    const parseSonglistData = (data, source) => {
      const list = [];
      let total = 0;
      console.log("解析数据:", source, JSON.stringify(data).substring(0, 500));
      try {
        switch (source) {
          case "kw":
            if (Array.isArray(data)) {
              data.forEach((group) => {
                if (group.list && Array.isArray(group.list)) {
                  group.list.forEach((item) => {
                    var _a;
                    let imgUrl = item.img ? item.img.trim().replace(/`/g, "") : "";
                    if (imgUrl && !imgUrl.endsWith(".jpg") && !imgUrl.endsWith(".png") && !imgUrl.endsWith(".webp")) {
                      imgUrl = imgUrl + ".jpg";
                    }
                    list.push({
                      id: `digest-${item.digest}__${item.id}`,
                      name: decodeName(item.name),
                      author: decodeName(((_a = group.label) == null ? void 0 : _a.replace("分类", "")) || ""),
                      img: imgUrl,
                      play_count: 0,
                      total: 0,
                      desc: decodeName(item.desc),
                      source: "kw"
                    });
                  });
                }
              });
              total = list.length;
            } else if (data.code === 200 && data.data && data.data.data) {
              total = data.data.total || 0;
              data.data.data.forEach((item) => {
                let imgUrl = item.img ? item.img.trim().replace(/`/g, "") : "";
                if (imgUrl && !imgUrl.endsWith(".jpg") && !imgUrl.endsWith(".png") && !imgUrl.endsWith(".webp")) {
                  imgUrl = imgUrl + ".jpg";
                }
                list.push({
                  id: `digest-${item.digest}__${item.id}`,
                  name: decodeName(item.name),
                  author: decodeName(item.uname),
                  img: imgUrl,
                  play_count: item.listencnt,
                  total: item.total,
                  desc: decodeName(item.desc),
                  source: "kw"
                });
              });
            }
            break;
          case "kg":
            if (data.status === 1 && data.special_db) {
              total = data.special_db.length || 0;
              data.special_db.forEach((item) => {
                list.push({
                  id: "id_" + item.specialid,
                  name: item.specialname,
                  author: item.nickname,
                  img: item.img || "",
                  play_count: item.play_count || item.total_play_count,
                  total: item.songcount,
                  time: item.publishtime || item.publish_time,
                  desc: item.intro,
                  source: "kg"
                });
              });
            }
            break;
          case "tx":
            if (data.code === 0 && data.playlist && data.playlist.data) {
              const playlistData = data.playlist.data;
              if (playlistData.v_playlist && Array.isArray(playlistData.v_playlist)) {
                total = playlistData.total || 0;
                playlistData.v_playlist.forEach((item) => {
                  list.push({
                    id: String(item.tid),
                    name: item.title,
                    author: item.creator_info ? item.creator_info.nick : "未知",
                    img: item.cover_url_big || item.cover_url_medium || item.cover_url_small || "",
                    play_count: item.access_num,
                    total: item.song_ids ? item.song_ids.length : 0,
                    time: item.modify_time ? item.modify_time * 1e3 : null,
                    desc: item.desc || "",
                    source: "tx"
                  });
                });
              }
              if (playlistData.content && playlistData.content.v_item && Array.isArray(playlistData.content.v_item)) {
                total = playlistData.content.total_cnt || 0;
                playlistData.content.v_item.forEach(({ basic }) => {
                  if (!basic)
                    return;
                  list.push({
                    id: String(basic.tid),
                    name: basic.title,
                    author: basic.creator ? basic.creator.nick : "未知",
                    img: basic.cover && (basic.cover.big_url || basic.cover.medium_url || basic.cover.default_url) || "",
                    play_count: basic.play_cnt,
                    total: basic.song_cnt || 0,
                    desc: basic.desc || "",
                    source: "tx"
                  });
                });
              }
            }
            break;
          case "mg":
            if (data.code === "000000" && data.data) {
              if (data.data.contents) {
                const ids = /* @__PURE__ */ new Set();
                const parseContents = (contents) => {
                  var _a, _b;
                  for (const item of contents) {
                    if (item.contents) {
                      parseContents(item.contents);
                    } else if (item.resType == "2021" && !ids.has(item.resId)) {
                      ids.add(item.resId);
                      list.push({
                        id: String(item.resId),
                        author: "",
                        name: item.txt,
                        img: item.img,
                        play_count: ((_b = (_a = item.barList) == null ? void 0 : _a[0]) == null ? void 0 : _b.title) || void 0,
                        desc: item.txt2 || "",
                        source: "mg"
                      });
                    }
                  }
                };
                parseContents(data.data.contents);
                total = ids.size;
              } else if (data.data.contentItemList && data.data.contentItemList[1] && data.data.contentItemList[1].itemList) {
                total = data.data.contentItemList[1].itemList.length || 0;
                data.data.contentItemList[1].itemList.forEach((item) => {
                  var _a, _b;
                  list.push({
                    id: String(item.logEvent.contentId),
                    author: "",
                    name: item.title,
                    img: item.imageUrl,
                    play_count: ((_b = (_a = item.barList) == null ? void 0 : _a[0]) == null ? void 0 : _b.title) || void 0,
                    desc: "",
                    source: "mg"
                  });
                });
              }
            }
            break;
          case "wy":
            if (data.playlists && Array.isArray(data.playlists)) {
              total = data.total || 0;
              data.playlists.forEach((item) => {
                list.push({
                  id: String(item.id),
                  name: item.name,
                  author: "",
                  img: item.coverImgUrl,
                  play_count: item.playCount,
                  total: item.trackCount,
                  time: item.createTime,
                  desc: item.description || "",
                  source: "wy"
                });
              });
            }
            break;
        }
      } catch (error) {
        console.error("解析歌单数据失败:", error);
      }
      return { list, total };
    };
    const decodeName = (str) => {
      if (!str)
        return "";
      return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/<br>/g, "\n");
    };
    const loadMore = () => {
      console.log("=== loadMore 触发 ===");
      console.log("hasMore:", hasMore.value);
      console.log("isLoadingMore:", isLoadingMore.value);
      console.log("currentPage:", currentPage.value);
      if (!hasMore.value || isLoadingMore.value || isLoading.value) {
        console.log("loadMore 被拦截");
        return;
      }
      console.log("loadMore 执行：准备加载下一页");
      currentPage.value++;
      isLoadingMore.value = true;
      fetchSonglist();
    };
    const goToDetail = (item) => {
      let link = "";
      switch (item.source) {
        case "kw":
          link = `https://www.kuwo.cn/playlist_detail/${item.id}`;
          break;
        case "kg":
          link = `https://www.kugou.com/yy/special/single/${item.id}.html`;
          break;
        case "tx":
          link = `https://y.qq.com/n/ryqq/playlist/${item.id}`;
          break;
        case "wy":
          link = `https://music.163.com/playlist?id=${item.id}`;
          break;
        case "mg":
          link = `https://music.migu.cn/v3/music/playlist/${item.id}`;
          break;
        default:
          link = item.id;
      }
      const params = `/pages/sharelist/index?source=${item.source}&link=${encodeURIComponent(link)}&id=${item.id}&picUrl=${encodeURIComponent(item.img)}&name=${encodeURIComponent(item.name || "")}&author=${encodeURIComponent(item.author || "")}&playCount=${item.play_count || 0}&fromName=songlist-list`;
      if (isTablet.value) {
        common_vendor.index.$emit("playlist-navigate", { url: params });
        return;
      }
      common_vendor.index.navigateTo({
        url: params
      });
    };
    let scrollTimer = null;
    let lastScrollTop = 0;
    const onScroll = (e) => {
      const query = common_vendor.index.createSelectorQuery();
      query.select(".list-wrapper").boundingClientRect();
      query.select(".list-wrapper").scrollOffset();
      query.exec((res) => {
        if (!res[0] || !res[1])
          return;
        const rect = res[0];
        const scrollInfo = res[1];
        const scrollTop = scrollInfo.scrollTop;
        const scrollHeight = scrollInfo.scrollHeight;
        const clientHeight = rect.height;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        if (Math.abs(scrollTop - lastScrollTop) > 100) {
          console.log("=== onScroll ===");
          console.log("scrollTop:", scrollTop);
          console.log("scrollHeight:", scrollHeight);
          console.log("clientHeight:", clientHeight);
          console.log("scrollBottom:", scrollBottom);
          console.log("hasMore:", hasMore.value);
          console.log("isLoadingMore:", isLoadingMore.value);
          lastScrollTop = scrollTop;
        }
        if (scrollBottom < 100 && hasMore.value && !isLoadingMore.value && !isLoading.value) {
          console.log("触发自动加载更多");
          if (scrollTimer)
            clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            loadMore();
          }, 200);
        }
      });
    };
    const onTouchMove = () => {
      onScroll();
    };
    let miniPlayerHeightChangeHandler = null;
    common_vendor.onMounted(() => {
      initDarkMode();
      checkIsTablet();
      console.log("[SonglistList] onMounted - isTablet:", isTablet.value);
      utils_system.setStatusBarTextColor(darkMode.value ? "white" : "dark");
      calculateItemsPerRow();
      setTimeout(() => {
        console.log("[SonglistList] 延迟计算 - isTablet:", isTablet.value);
        calculateItemsPerRow();
      }, 500);
      common_vendor.index.onWindowResize(() => {
        setTimeout(() => {
          checkIsTablet();
          calculateItemsPerRow();
        }, 100);
      });
      miniPlayerHeightChangeHandler = ({ height, isShowing }) => {
        console.log("[SonglistList] MiniPlayer 高度变化:", height, "是否显示:", isShowing);
      };
      common_vendor.index.$on("miniPlayerHeightChange", miniPlayerHeightChangeHandler);
      const lastSource = getLastSource();
      const lastTag = getLastTag();
      const lastSort = getLastSort();
      console.log("[SonglistList] 读取上次选择:", { source: lastSource, tag: lastTag, sort: lastSort });
      currentSource.value = lastSource;
      currentTagId.value = lastTag;
      currentSortId.value = lastSort;
      loadTags(currentSource.value).then(() => {
        const currentTags = sourceTagsMap.value[currentSource.value] || [];
        const tagExists = currentTags.some((tag) => tag.id === currentTagId.value);
        if (!tagExists && currentTagId.value !== "") {
          console.log("[SonglistList] 保存的标签不存在，重置为推荐");
          currentTagId.value = "";
        }
        fetchSonglist();
      });
    });
    common_vendor.onShow(() => {
      initDarkMode();
      utils_system.setStatusBarTextColor(darkMode.value ? "white" : "dark");
    });
    common_vendor.watch(currentSource, (newSource) => {
      console.log("[SonglistList] watch 平台变化:", newSource);
      currentTagId.value = "";
      currentSortId.value = "hot";
      loadTags(newSource);
    });
    common_vendor.watch(currentTagId, () => {
      lastScrollTop = 0;
    });
    common_vendor.onUnmounted(() => {
      if (miniPlayerHeightChangeHandler) {
        common_vendor.index.$off("miniPlayerHeightChange", miniPlayerHeightChangeHandler);
        console.log("[SonglistList] 已清理 MiniPlayer 监听器");
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "chevron-left",
          size: "24",
          color: darkMode.value ? "#f3f4f6" : "#333"
        }),
        b: common_vendor.o(goBack, "35"),
        c: common_vendor.t(currentSourceName.value),
        d: common_vendor.p({
          name: "chevron-down",
          size: "14",
          color: darkMode.value ? "#f3f4f6" : "#333"
        }),
        e: common_vendor.o(($event) => showSourcePicker.value = true, "90"),
        f: common_vendor.f(tagList.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id,
            c: currentTagId.value === tag.id ? 1 : "",
            d: common_vendor.o(($event) => selectTag(tag.id), tag.id)
          };
        }),
        g: tagScrollLeft.value,
        h: common_vendor.o(onTagScroll, "2e"),
        i: sortList.value.length > 0
      }, sortList.value.length > 0 ? {
        j: common_vendor.f(sortList.value, (sort, k0, i0) => {
          return {
            a: common_vendor.t(sort.name),
            b: sort.id,
            c: currentSortId.value === sort.id ? 1 : "",
            d: common_vendor.o(($event) => selectSort(sort.id), sort.id)
          };
        })
      } : {}, {
        k: common_vendor.s(headerStyle.value),
        l: isLoading.value && songlist.value.length === 0
      }, isLoading.value && songlist.value.length === 0 ? {} : {}, {
        m: loadError.value && !isLoading.value
      }, loadError.value && !isLoading.value ? {
        n: common_vendor.t(loadError.value)
      } : {}, {
        o: songlist.value.length > 0
      }, songlist.value.length > 0 ? {
        p: common_vendor.f(songlist.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_imageProxy.proxyImageUrl)(item.img),
            b: common_vendor.o(($event) => handleSonglistImageError($event, item), item.id + index),
            c: item.play_count
          }, item.play_count ? {
            d: "a531cdfa-2-" + i0,
            e: common_vendor.p({
              name: "play",
              size: "10",
              color: "#fff"
            }),
            f: common_vendor.t(common_vendor.unref(utils_format.formatPlayCount)(item.play_count))
          } : {}, {
            g: item.total
          }, item.total ? {
            h: "a531cdfa-3-" + i0,
            i: common_vendor.p({
              name: "music",
              size: "10",
              color: "#fff"
            }),
            j: common_vendor.t(item.total)
          } : {}, {
            k: common_vendor.t(item.name),
            l: item.author || item.time
          }, item.author || item.time ? common_vendor.e({
            m: item.author
          }, item.author ? {
            n: common_vendor.t(item.author)
          } : {}, {
            o: item.author && item.time
          }, item.author && item.time ? {} : {}, {
            p: item.time
          }, item.time ? {
            q: common_vendor.t(common_vendor.unref(utils_format.formatDate)(item.time))
          } : {}) : {}, {
            r: item.desc
          }, item.desc ? {
            s: common_vendor.t(item.desc)
          } : {}, {
            t: item.id + index,
            v: common_vendor.n(getItemHeightClass(index)),
            w: common_vendor.o(($event) => goToDetail(item), item.id + index)
          });
        })
      } : {}, {
        q: songlist.value.length > 0
      }, songlist.value.length > 0 ? common_vendor.e({
        r: isLoadingMore.value
      }, isLoadingMore.value ? {} : !hasMore.value ? {} : {}, {
        s: !hasMore.value
      }) : {}, {
        t: !isLoading.value && !loadError.value && songlist.value.length === 0
      }, !isLoading.value && !loadError.value && songlist.value.length === 0 ? {
        v: common_vendor.p({
          name: "inbox",
          size: "64",
          color: "#ccc"
        })
      } : {}, {
        w: common_vendor.o(onScroll, "43"),
        x: common_vendor.o(onTouchMove, "5d"),
        y: showSourcePicker.value
      }, showSourcePicker.value ? common_vendor.e({
        z: isTablet.value
      }, isTablet.value ? {} : {}, {
        A: common_vendor.p({
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        B: common_vendor.o(($event) => showSourcePicker.value = false, "93"),
        C: common_vendor.f(sourceList, (source, k0, i0) => {
          return {
            a: common_vendor.t(source.name),
            b: source.id,
            c: currentSource.value === source.id ? 1 : "",
            d: common_vendor.o(($event) => selectSource(source.id), source.id)
          };
        }),
        D: common_vendor.o(() => {
        }, "fc"),
        E: common_vendor.o(($event) => showSourcePicker.value = false, "81")
      }) : {}, {
        F: !isTablet.value
      }, !isTablet.value ? {} : {}, {
        G: darkMode.value ? 1 : "",
        H: isTablet.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a531cdfa"]]);
exports.MiniProgramPage = MiniProgramPage;
