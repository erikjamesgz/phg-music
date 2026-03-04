"use strict";
const common_vendor = require("./common/vendor.js");
const store_modules_list = require("./store/modules/list.js");
const store_modules_player = require("./store/modules/player.js");
const store_modules_system = require("./store/modules/system.js");
const utils_api_songlistDirect = require("./utils/api/songlist-direct.js");
const utils_api_music = require("./utils/api/music.js");
const utils_musicUrlCache = require("./utils/musicUrlCache.js");
const utils_lyricCache = require("./utils/lyricCache.js");
const utils_musicParams = require("./utils/musicParams.js");
const utils_i18n = require("./utils/i18n.js");
const utils_system = require("./utils/system.js");
const utils_imageProxy = require("./utils/imageProxy.js");
const utils_playSong = require("./utils/playSong.js");
const composables_usePageLifecycle = require("./composables/usePageLifecycle.js");
const composables_useBottomHeight = require("./composables/useBottomHeight.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  _easycom_roc_icon_plus();
}
const DOUBLE_CLICK_DELAY = 300;
const _sfc_main = {
  __name: "index",
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const statusBarStyle = common_vendor.computed(() => ({
      height: `${statusBarHeight.value}px`,
      width: "100%",
      backgroundColor: isDarkMode.value ? "#1f2937" : "transparent"
    }));
    const currentBannerIndex = common_vendor.ref(0);
    const isLoadingMore = common_vendor.ref(false);
    const isDarkMode = common_vendor.ref(false);
    const isRefreshing = common_vendor.ref(false);
    const APP_NAMES = ["拼好歌", "青釉音乐"];
    const currentAppNameIndex = common_vendor.ref(0);
    const appName = common_vendor.computed(() => APP_NAMES[currentAppNameIndex.value]);
    let lastClickTime = 0;
    const showMiniPlayer = common_vendor.computed(() => store_modules_player.playerStore.getState().showMiniPlayer);
    const { bottomPaddingStyle, bottomMarginStyle, totalBottomHeight, isMiniPlayerVisible, checkMiniPlayerStatus: checkMiniPlayerStatusFromComposable } = composables_useBottomHeight.useBottomHeight();
    const scrollViewStyle = common_vendor.computed(() => {
      console.log("[Index] scrollViewStyle 计算:", { totalBottomHeight: totalBottomHeight.value, isMiniPlayerVisible: isMiniPlayerVisible.value });
      return {};
    });
    const safeBottomStyle = common_vendor.computed(() => {
      return {
        height: `${totalBottomHeight.value}px`
      };
    });
    const banners = common_vendor.ref([]);
    const recommendPlaylists = common_vendor.ref([]);
    const newSongs = common_vendor.ref([]);
    const newAlbums = common_vendor.ref([]);
    const topArtists = common_vendor.ref([]);
    const decodeName = (str) => {
      if (!str)
        return "";
      return str.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").replace(/&#32;/g, " ");
    };
    const checkDarkMode = () => {
      const darkMode = common_vendor.index.getStorageSync("darkMode") === "true";
      const followSystem = common_vendor.index.getStorageSync("followSystem") !== "false";
      if (followSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        isDarkMode.value = systemInfo.theme === "dark";
      } else {
        isDarkMode.value = darkMode;
      }
      const theme = isDarkMode.value ? "dark" : "light";
      utils_system.setAppTheme(theme);
      console.log("[Index] checkDarkMode - 暗黑模式:", isDarkMode.value);
    };
    const checkMiniPlayerStatus = () => {
      console.log("[Index] checkMiniPlayerStatus - 开始检查");
      if (checkMiniPlayerStatusFromComposable) {
        checkMiniPlayerStatusFromComposable();
      }
      const currentSong = store_modules_player.playerStore.getState().currentSong;
      console.log("[Index] checkMiniPlayerStatus - 当前歌曲:", (currentSong == null ? void 0 : currentSong.name) || "无");
      console.log("[Index] checkMiniPlayerStatus - 当前底部高度:", {
        totalBottomHeight: totalBottomHeight.value,
        isMiniPlayerVisible: isMiniPlayerVisible.value
      });
    };
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchBanners(),
          fetchRecommendPlaylists(),
          fetchNewSongs(),
          fetchNewAlbums(),
          fetchTopArtists()
        ]);
      } catch (error) {
        console.error("获取首页数据失败:", error);
        common_vendor.index.showToast({
          title: "获取数据失败，请重试",
          icon: "none"
        });
      }
    };
    composables_usePageLifecycle.usePageLifecycle(
      () => props.isActive,
      {
        onInit: () => {
          console.log("[Index] 页面初始化");
          fetchData();
        },
        onActivated: () => {
          console.log("[Index] 页面激活");
          utils_system.setStatusBarTextColor("black");
          checkDarkMode();
          checkMiniPlayerStatus();
          console.log("[Index] 页面激活完成 - 底部高度:", totalBottomHeight.value);
        },
        onDeactivated: () => {
          console.log("[Index] 页面停用");
        }
      }
    );
    common_vendor.onMounted(() => {
      initAppName();
      common_vendor.index.$on("themeChanged", handleThemeChanged);
      console.log("[Index] 已注册主题变化监听");
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("themeChanged", handleThemeChanged);
      console.log("[Index] 已移除主题变化监听");
    });
    const handleThemeChanged = (data) => {
      console.log("[Index] 收到主题变化事件:", data);
      isDarkMode.value = data.isDark;
      utils_system.setAppTheme(data.isDark ? "dark" : "light");
    };
    const fetchBanners = async () => {
      try {
        const savedMaxPage = common_vendor.index.getStorageSync("kw_banner_max_page");
        let targetPage = 1;
        const rn = 10;
        if (savedMaxPage && savedMaxPage > 0) {
          targetPage = Math.floor(Math.random() * savedMaxPage) + 1;
          console.log("[Banner] 使用保存的页码范围:", savedMaxPage, "随机选择页码:", targetPage);
        } else {
          console.log("[Banner] 首次打开，使用第1页");
        }
        const url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${targetPage}&rn=${rn}&order=hot`;
        const res = await common_vendor.index.request({
          url,
          method: "GET",
          header: {
            "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
          }
        });
        if (res.statusCode !== 200 || res.data.code !== 200) {
          throw new Error("获取歌单数据失败");
        }
        const total = res.data.data.total || 0;
        const list = res.data.data.data || [];
        const maxPage = Math.ceil(total / rn) || 1;
        common_vendor.index.setStorageSync("kw_banner_max_page", maxPage);
        console.log("[Banner] 酷我推荐歌单总数:", total, "计算总页数:", maxPage, "本次获取:", list.length, "当前页码:", targetPage);
        const bannerList = [];
        const usedIndices = [];
        while (bannerList.length < 5 && usedIndices.length < list.length) {
          const randomIndex = Math.floor(Math.random() * list.length);
          if (!usedIndices.includes(randomIndex)) {
            usedIndices.push(randomIndex);
            const item = list[randomIndex];
            let imgUrl = item.img ? item.img.trim().replace(/`/g, "") : "";
            if (imgUrl && !imgUrl.endsWith(".jpg") && !imgUrl.endsWith(".png") && !imgUrl.endsWith(".webp")) {
              imgUrl = imgUrl + ".jpg";
            }
            imgUrl = utils_imageProxy.proxyImageUrl(imgUrl);
            bannerList.push({
              imageUrl: imgUrl,
              targetType: 1,
              targetId: `digest-${item.digest}__${item.id}`,
              titleColor: "red",
              typeTitle: decodeName(item.name),
              subtitle: decodeName(item.desc) || "精选歌单推荐",
              url: "",
              source: "kw",
              playCount: item.listencnt,
              total: item.total
            });
          }
        }
        if (bannerList.length < 5) {
          const fallbackBanners = [
            {
              imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470&auto=format&fit=crop",
              targetType: 1,
              targetId: "digest-8__2886046289",
              titleColor: "red",
              typeTitle: "夏日特辑",
              subtitle: "清凉一夏，畅享音乐",
              url: "",
              source: "kw"
            },
            {
              imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1470&auto=format&fit=crop",
              targetType: 1,
              targetId: "digest-8__2847251561",
              titleColor: "blue",
              typeTitle: "古典新声",
              subtitle: "感受古典音乐的魅力",
              url: "",
              source: "kw"
            },
            {
              imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop",
              targetType: 1,
              targetId: "digest-8__2736267853",
              titleColor: "red",
              typeTitle: "电音节拍",
              subtitle: "夏夜狂欢，尽情舞动",
              url: "",
              source: "kw"
            },
            {
              imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1470&auto=format&fit=crop",
              targetType: 1,
              targetId: "digest-8__2829883282",
              titleColor: "blue",
              typeTitle: "轻音乐精选",
              subtitle: "放松身心，享受宁静",
              url: "",
              source: "kw"
            },
            {
              imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1474&auto=format&fit=crop",
              targetType: 1,
              targetId: "digest-8__2829816742",
              titleColor: "red",
              typeTitle: "流行热歌",
              subtitle: "当下最热门的流行音乐",
              url: "",
              source: "kw"
            }
          ];
          while (bannerList.length < 5) {
            bannerList.push(fallbackBanners[bannerList.length]);
          }
        }
        banners.value = bannerList;
        console.log("[Banner] 轮播图数据:", bannerList);
      } catch (error) {
        console.error("[Banner] 获取轮播图失败:", error);
        common_vendor.index.removeStorageSync("kw_banner_max_page");
        console.log("[Banner] 请求失败，已清除保存的页码，下次将使用第1页");
        banners.value = [
          {
            imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470&auto=format&fit=crop",
            targetType: 1,
            targetId: "digest-8__2886046289",
            titleColor: "red",
            typeTitle: "夏日特辑",
            subtitle: "清凉一夏，畅享音乐",
            url: "",
            source: "kw"
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1470&auto=format&fit=crop",
            targetType: 1,
            targetId: "digest-8__2847251561",
            titleColor: "blue",
            typeTitle: "古典新声",
            subtitle: "感受古典音乐的魅力",
            url: "",
            source: "kw"
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop",
            targetType: 1,
            targetId: "digest-8__2736267853",
            titleColor: "red",
            typeTitle: "电音节拍",
            subtitle: "夏夜狂欢，尽情舞动",
            url: "",
            source: "kw"
          }
        ];
      }
    };
    const fetchRecommendPlaylists = async () => {
      var _a, _b;
      try {
        const savedMaxPage = common_vendor.index.getStorageSync("kw_recommend_max_page");
        let targetPage = 1;
        const rn = 6;
        if (savedMaxPage && savedMaxPage > 0) {
          targetPage = Math.floor(Math.random() * savedMaxPage) + 1;
          console.log("[Recommend] 使用保存的页码范围:", savedMaxPage, "随机选择页码:", targetPage);
        } else {
          console.log("[Recommend] 首次打开，使用第1页");
        }
        const res = await common_vendor.index.request({
          url: "http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList",
          method: "GET",
          data: {
            loginUid: 0,
            loginSid: 0,
            appUid: 76039576,
            pn: targetPage,
            rn,
            order: "hot"
          },
          header: {
            "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
          }
        });
        if (res.statusCode !== 200 || res.data.code !== 200) {
          throw new Error("获取推荐歌单失败");
        }
        const total = ((_a = res.data.data) == null ? void 0 : _a.total) || 0;
        const list = ((_b = res.data.data) == null ? void 0 : _b.data) || [];
        const maxPage = Math.ceil(total / rn) || 1;
        common_vendor.index.setStorageSync("kw_recommend_max_page", maxPage);
        console.log("[Recommend] 酷我推荐歌单总数:", total, "计算总页数:", maxPage, "本次获取:", list.length, "当前页码:", targetPage);
        recommendPlaylists.value = list.map((item) => ({
          id: item.id,
          name: decodeName(item.name),
          coverImgUrl: utils_imageProxy.proxyImageUrl(item.img),
          playCount: item.listencnt,
          source: "kw",
          author: "",
          digest: item.digest
        }));
        console.log("[Index] 推荐歌单数量:", recommendPlaylists.value.length);
      } catch (error) {
        console.error("[Index] 获取推荐歌单失败:", error);
        common_vendor.index.removeStorageSync("kw_recommend_max_page");
        console.log("[Recommend] 请求失败，已清除保存的页码，下次将使用第1页");
        recommendPlaylists.value = [];
      }
    };
    const fetchNewSongs = async () => {
      var _a, _b, _c;
      try {
        const res = await common_vendor.index.request({
          url: "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do",
          method: "GET",
          data: {
            columnId: "27553319",
            needAll: 0
          },
          header: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
            "Referer": "https://app.c.nf.migu.cn/",
            "channel": "0146921"
          }
        });
        if (res.statusCode !== 200 || ((_a = res.data) == null ? void 0 : _a.code) !== "000000") {
          console.error("[Index] 咪咕新歌接口返回:", res.data);
          throw new Error("获取咪咕新歌失败");
        }
        const contents = (_c = (_b = res.data) == null ? void 0 : _b.columnInfo) == null ? void 0 : _c.contents;
        if (!contents || !Array.isArray(contents)) {
          throw new Error("咪咕新歌无数据");
        }
        newSongs.value = contents.slice(0, 6).map((item) => {
          var _a2, _b2;
          const info = item.objectInfo || item;
          return {
            id: info.songId || info.id,
            name: decodeName(info.songName || info.name),
            singer: decodeName(info.singerName || info.singer),
            album: decodeName(info.albumName || info.album),
            img: ((_b2 = (_a2 = info.albumImgs) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.img) || info.landscapImg || "",
            source: "mg"
          };
        });
        console.log("[Index] 新歌数量:", newSongs.value.length);
      } catch (error) {
        console.error("[Index] 获取新歌失败:", error);
        newSongs.value = [];
      }
    };
    const fetchNewAlbums = async () => {
      try {
        newAlbums.value = [];
        console.log("[Index] 新碟上架功能暂未实现");
      } catch (error) {
        console.error("[Index] 获取新碟上架失败:", error);
        newAlbums.value = [];
      }
    };
    const fetchTopArtists = async () => {
      var _a, _b, _c;
      try {
        const res = await common_vendor.index.request({
          url: "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do",
          method: "GET",
          data: {
            columnId: "27186466",
            needAll: 0
          },
          header: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
            "Referer": "https://app.c.nf.migu.cn/",
            "channel": "0146921"
          }
        });
        if (res.statusCode !== 200 || ((_a = res.data) == null ? void 0 : _a.code) !== "000000") {
          console.error("[Index] 咪咕热歌榜接口返回:", res.data);
          throw new Error("获取咪咕热歌榜失败");
        }
        const contents = (_c = (_b = res.data) == null ? void 0 : _b.columnInfo) == null ? void 0 : _c.contents;
        if (!contents || !Array.isArray(contents)) {
          throw new Error("咪咕热歌榜无数据");
        }
        console.log("[TopArtists] 咪咕热歌榜歌曲数量:", contents.length);
        const artistMap = /* @__PURE__ */ new Map();
        for (const item of contents) {
          const info = item.objectInfo || item;
          let singerName = info.singerName || info.singer || "";
          if (!singerName)
            continue;
          singerName = singerName.split(/[,，/&]/)[0].trim();
          const singerId = info.singerId || "";
          let imgUrl = "";
          if (info.landscapImg) {
            imgUrl = info.landscapImg;
          } else if (info.albumImgs && info.albumImgs.length > 0) {
            imgUrl = info.albumImgs[0].img || "";
          }
          if (!artistMap.has(singerName)) {
            artistMap.set(singerName, {
              id: singerId || singerName,
              name: singerName,
              picUrl: imgUrl || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1470&auto=format&fit=crop"
            });
          }
          if (artistMap.size >= 10) {
            break;
          }
        }
        const artistList = Array.from(artistMap.values());
        console.log("[TopArtists] 提取的热门歌手数量:", artistList.length);
        if (artistList.length < 10) {
          const fallbackArtists = [
            { id: "1", name: "薛之谦", picUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1470&auto=format&fit=crop" },
            { id: "2", name: "周杰伦", picUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1474&auto=format&fit=crop" },
            { id: "3", name: "林俊杰", picUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop" },
            { id: "4", name: "邓紫棋", picUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1470&auto=format&fit=crop" },
            { id: "5", name: "张学友", picUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470&auto=format&fit=crop" },
            { id: "6", name: "刘德华", picUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1470&auto=format&fit=crop" },
            { id: "7", name: "陈奕迅", picUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1470&auto=format&fit=crop" },
            { id: "8", name: "五月天", picUrl: "https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop" },
            { id: "9", name: "毛不易", picUrl: "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?q=80&w=1476&auto=format&fit=crop" },
            { id: "10", name: "李荣浩", picUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1470&auto=format&fit=crop" }
          ];
          while (artistList.length < 10) {
            const fallback = fallbackArtists[artistList.length];
            if (!artistMap.has(fallback.name)) {
              artistList.push(fallback);
            } else {
              break;
            }
          }
        }
        topArtists.value = artistList;
      } catch (error) {
        console.error("[TopArtists] 获取热门歌手失败:", error);
        topArtists.value = [
          { id: "1", name: "薛之谦", picUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1470&auto=format&fit=crop" },
          { id: "2", name: "周杰伦", picUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1474&auto=format&fit=crop" },
          { id: "3", name: "林俊杰", picUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop" },
          { id: "4", name: "邓紫棋", picUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1470&auto=format&fit=crop" },
          { id: "5", name: "张学友", picUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470&auto=format&fit=crop" },
          { id: "6", name: "刘德华", picUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1470&auto=format&fit=crop" },
          { id: "7", name: "陈奕迅", picUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1470&auto=format&fit=crop" },
          { id: "8", name: "五月天", picUrl: "https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop" },
          { id: "9", name: "毛不易", picUrl: "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?q=80&w=1476&auto=format&fit=crop" },
          { id: "10", name: "李荣浩", picUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1470&auto=format&fit=crop" }
        ];
      }
    };
    const initAppName = () => {
      const savedIndex = common_vendor.index.getStorageSync("appNameIndex");
      if (savedIndex !== "" && savedIndex !== null && savedIndex !== void 0) {
        currentAppNameIndex.value = parseInt(savedIndex, 10) || 0;
      } else {
        currentAppNameIndex.value = 0;
      }
      console.log("[Index] 初始化APP名称:", appName.value, "索引:", currentAppNameIndex.value);
    };
    const handleAppLogoClick = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastClickTime;
      console.log("[Index] APP Logo被点击，时间差:", timeDiff);
      if (timeDiff > 0 && timeDiff < DOUBLE_CLICK_DELAY) {
        console.log("[Index] 检测到双击，准备切换APP名称");
        const newIndex = (currentAppNameIndex.value + 1) % APP_NAMES.length;
        currentAppNameIndex.value = newIndex;
        common_vendor.index.setStorageSync("appNameIndex", newIndex);
        console.log("[Index] 切换APP名称成功:", appName.value);
        common_vendor.index.showToast({
          title: `已切换为"${appName.value}"`,
          icon: "none",
          duration: 1500
        });
        lastClickTime = 0;
      } else {
        lastClickTime = currentTime;
        console.log("[Index] 检测到单击，记录时间:", lastClickTime);
      }
    };
    const onRefresh = async () => {
      console.log("[Index] 下拉刷新开始");
      if (isRefreshing.value)
        return;
      isRefreshing.value = true;
      try {
        banners.value = [];
        recommendPlaylists.value = [];
        newSongs.value = [];
        newAlbums.value = [];
        topArtists.value = [];
        await fetchData();
        common_vendor.index.showToast({
          title: "刷新成功",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        console.error("[Index] 下拉刷新失败:", error);
        common_vendor.index.showToast({
          title: "刷新失败",
          icon: "none",
          duration: 1500
        });
      } finally {
        isRefreshing.value = false;
        console.log("[Index] 下拉刷新结束");
      }
    };
    const formatPlayCount = (count) => {
      if (count < 1e4) {
        return count.toString();
      } else if (count < 1e8) {
        return Math.floor(count / 1e4) + "万";
      } else {
        return Math.floor(count / 1e8) + "亿";
      }
    };
    const formatArtists = (artists) => {
      return artists.map((artist) => artist.name).join(" / ");
    };
    const playSong = (song) => {
      const songWithoutUrl = {
        ...song,
        url: "",
        playUrl: ""
      };
      store_modules_player.playerStore.playSong(songWithoutUrl);
    };
    const showSongOptions = (song) => {
      common_vendor.index.showActionSheet({
        itemList: ["添加到播放列表", "下一首播放", "收藏到歌单", "分享", "歌手：" + formatArtists(song.artists), "专辑：" + song.album.name],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              store_modules_player.playerStore.addToPlaylist(song);
              common_vendor.index.showToast({
                title: "已添加到播放列表",
                icon: "none"
              });
              break;
            case 1:
              store_modules_player.playerStore.addToPlaylistAsNext(song);
              common_vendor.index.showToast({
                title: "已添加到下一首播放",
                icon: "none"
              });
              break;
            case 2:
              common_vendor.index.showToast({
                title: "收藏功能开发中",
                icon: "none"
              });
              break;
            case 3:
              common_vendor.index.share({
                provider: "weixin",
                scene: "WXSceneSession",
                type: 0,
                title: song.name,
                summary: formatArtists(song.artists),
                imageUrl: song.album.picUrl,
                success: function(res2) {
                  console.log("分享成功：" + JSON.stringify(res2));
                },
                fail: function(err) {
                  console.log("分享失败：" + JSON.stringify(err));
                }
              });
              break;
            case 4:
              common_vendor.index.showToast({ title: "歌手详情功能暂未开放", icon: "none" });
              break;
            case 5:
              common_vendor.index.showToast({ title: "专辑详情功能暂未开放", icon: "none" });
              break;
          }
        }
      });
    };
    const playNewSong = async (song, index) => {
      console.log("[Index] 播放新歌:", song.name, "索引:", index);
      if (!song || !song.id) {
        console.error("[Index] 歌曲对象无效:", song);
        common_vendor.index.showToast({
          title: "歌曲信息无效",
          icon: "none"
        });
        return;
      }
      await utils_playSong.playSongCommon(song, {
        addToDefaultList: true,
        source: song.source || "mg"
      });
    };
    const formatDuration = (duration) => {
      if (!duration || duration <= 0)
        return "00:00";
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };
    const handleBannerClick = (banner) => {
      console.log("[Banner] 点击轮播图:", banner);
      if (banner.source === "kw" && banner.targetId) {
        const queryParams = [
          `id=${banner.targetId}`,
          `source=kw`,
          `fromName=index`,
          `name=${encodeURIComponent(banner.typeTitle || "")}`,
          `picUrl=${encodeURIComponent(banner.imageUrl || "")}`,
          `playCount=${banner.playCount || ""}`,
          `link=${encodeURIComponent(banner.targetId)}`
        ].join("&");
        navigateTo(`/pages/sharelist/index?${queryParams}`);
        return;
      }
      switch (banner.targetType) {
        case 1:
          common_vendor.index.showToast({
            title: "播放歌曲ID: " + banner.targetId,
            icon: "none"
          });
          break;
        case 10:
          common_vendor.index.showToast({ title: "专辑详情功能暂未开放", icon: "none" });
          break;
        case 1e3:
          common_vendor.index.showToast({ title: "歌单详情功能暂未开放", icon: "none" });
          break;
        case 1004:
          common_vendor.index.showToast({ title: "MV功能暂未开放", icon: "none" });
          break;
        case 3e3:
          if (banner.url) {
            common_vendor.index.showToast({
              title: "外链暂不支持",
              icon: "none"
            });
          }
          break;
        default:
          if (banner.targetId) {
            const queryParams = [
              `id=${banner.targetId}`,
              `source=kw`,
              `fromName=index`,
              `name=${encodeURIComponent(banner.typeTitle || "")}`,
              `picUrl=${encodeURIComponent(banner.imageUrl || "")}`,
              `playCount=${banner.playCount || ""}`,
              `link=${encodeURIComponent(banner.targetId)}`
            ].join("&");
            navigateTo(`/pages/sharelist/index?${queryParams}`);
          } else {
            common_vendor.index.showToast({
              title: "未知类型",
              icon: "none"
            });
          }
      }
    };
    const playBanner = async (banner) => {
      var _a;
      console.log("[Banner] 播放按钮点击:", banner);
      if (banner.source === "kw" && banner.targetId) {
        common_vendor.index.showLoading({
          title: "加载歌单中...",
          mask: true
        });
        try {
          const playlistDetail = await utils_api_songlistDirect.getListDetailDirect("kw", banner.targetId, 1);
          console.log("[Banner] 获取到歌单详情，歌曲数量:", (_a = playlistDetail.list) == null ? void 0 : _a.length);
          if (!playlistDetail.list || playlistDetail.list.length === 0) {
            throw new Error("歌单为空");
          }
          store_modules_list.listStore.clearTempList();
          const playlistId = `banner_${Date.now()}`;
          store_modules_list.listStore.setTempList(
            playlistId,
            playlistDetail.list,
            {
              id: playlistId,
              source: "kw",
              name: banner.typeTitle || "歌单推荐"
            }
          );
          store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
          const firstSong = playlistDetail.list[0];
          const quality = store_modules_system.systemStore.getState().audioQuality || "128k";
          const songSource = firstSong.source || "kw";
          let playUrl = await utils_musicUrlCache.getCachedMusicUrl(firstSong.id, quality, songSource);
          let lyricData = null;
          if (!playUrl) {
            const requestData = utils_musicParams.buildMusicRequestParams({
              ...firstSong,
              source: "kw"
            }, quality);
            if (!requestData) {
              throw new Error("构建请求参数失败");
            }
            const musicUrlData = await utils_api_music.getMusicUrl(requestData);
            playUrl = musicUrlData == null ? void 0 : musicUrlData.url;
            if (playUrl) {
              await utils_musicUrlCache.setCachedMusicUrl(firstSong.id, quality, playUrl, songSource);
              lyricData = {
                lyric: musicUrlData.lyric || "",
                tlyric: musicUrlData.tlyric || "",
                rlyric: musicUrlData.rlyric || "",
                lxlyric: musicUrlData.lxlyric || ""
              };
            }
          } else {
            store_modules_player.playerStore.setUsingCachedUrl(true);
            const cachedLyric = await utils_lyricCache.getCachedLyric(firstSong.id, "kw");
            if (cachedLyric) {
              lyricData = {
                lyric: cachedLyric.lyric || "",
                tlyric: cachedLyric.tlyric || "",
                rlyric: cachedLyric.rlyric || "",
                lxlyric: cachedLyric.lxlyric || ""
              };
            }
          }
          if (!playUrl) {
            throw new Error("无法获取播放链接");
          }
          const musicInfo = {
            ...firstSong,
            url: playUrl,
            playUrl,
            lyric: (lyricData == null ? void 0 : lyricData.lyric) || "",
            tlyric: (lyricData == null ? void 0 : lyricData.tlyric) || "",
            rlyric: (lyricData == null ? void 0 : lyricData.rlyric) || "",
            lxlyric: (lyricData == null ? void 0 : lyricData.lxlyric) || ""
          };
          store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.TEMP, musicInfo, false);
          store_modules_player.playerStore.playSong(musicInfo);
          common_vendor.index.showToast({
            title: `正在播放: ${banner.typeTitle}`,
            icon: "none",
            duration: 2e3
          });
        } catch (error) {
          console.error("[Banner] 播放失败:", error);
          common_vendor.index.showToast({
            title: error.message || "播放失败",
            icon: "none",
            duration: 2e3
          });
        } finally {
          common_vendor.index.hideLoading();
        }
      } else {
        common_vendor.index.showToast({
          title: "暂不支持该类型",
          icon: "none"
        });
      }
    };
    const collectBanner = (banner) => {
      console.log("[Banner] 收藏按钮点击:", banner);
      common_vendor.index.showToast({
        title: "收藏功能开发中",
        icon: "none"
      });
    };
    const navigateTo = (url) => {
      common_vendor.index.navigateTo({ url });
    };
    const goToPlaylistDetail = (playlist) => {
      let link = "";
      const source = playlist.source || "tx";
      switch (source) {
        case "kw":
          link = `https://www.kuwo.cn/playlist_detail/${playlist.id}`;
          break;
        case "kg":
          link = `https://www.kugou.com/yy/special/single/${playlist.id}.html`;
          break;
        case "tx":
          link = `https://y.qq.com/n/ryqq/playlist/${playlist.id}`;
          break;
        case "wy":
          link = `https://music.163.com/playlist?id=${playlist.id}`;
          break;
        case "mg":
          link = `https://music.migu.cn/v3/music/playlist/${playlist.id}`;
          break;
        default:
          link = playlist.id;
      }
      common_vendor.index.navigateTo({
        url: `/pages/sharelist/index?source=${source}&link=${encodeURIComponent(link)}&id=${playlist.id}&picUrl=${encodeURIComponent(playlist.coverImgUrl || "")}&name=${encodeURIComponent(playlist.name || "")}&author=${encodeURIComponent(playlist.author || "")}&playCount=${playlist.playCount || 0}&fromName=index`
      });
    };
    const goToSearch = () => {
      common_vendor.index.setStorageSync("fromSearchBar", true);
      common_vendor.index.$emit("main-switch-tab", { index: 1 });
    };
    const goToSearchWithArtist = (artistName) => {
      common_vendor.index.setStorageSync("searchKeywordFromIndex", artistName);
      common_vendor.index.$emit("main-switch-tab", { index: 1 });
    };
    const goToHotSongs = () => {
      common_vendor.index.setStorageSync("rank_temp_source", "mg");
      common_vendor.index.setStorageSync("rank_temp_boardId", "mg__27186466");
      common_vendor.index.navigateTo({
        url: "/pages/rank/index"
      });
    };
    const goToNewSongRank = () => {
      common_vendor.index.setStorageSync("rank_temp_source", "mg");
      common_vendor.index.setStorageSync("rank_temp_boardId", "mg__27553319");
      common_vendor.index.navigateTo({
        url: "/pages/rank/index"
      });
    };
    const goToDailyRecommend = async () => {
      var _a, _b, _c;
      common_vendor.index.showLoading({
        title: "获取推荐中...",
        mask: true
      });
      try {
        const res = await common_vendor.index.request({
          url: "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do",
          method: "GET",
          data: {
            columnId: "15245552",
            count: 20
          },
          header: {
            "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
          }
        });
        if (res.statusCode !== 200 || ((_a = res.data) == null ? void 0 : _a.code) !== "000000") {
          throw new Error("获取推荐失败");
        }
        const contents = (_c = (_b = res.data) == null ? void 0 : _b.columnInfo) == null ? void 0 : _c.contents;
        if (!contents || !Array.isArray(contents)) {
          throw new Error("无推荐数据");
        }
        const songs = contents.map((item) => {
          var _a2, _b2;
          const info = item.objectInfo || item;
          return {
            id: info.songId || info.id,
            name: decodeName(info.songName || info.name),
            singer: decodeName(info.singerName || info.singer),
            album: decodeName(info.albumName || info.album),
            img: ((_b2 = (_a2 = info.albumImgs) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.img) || info.landscapImg || "",
            source: "mg"
          };
        });
        store_modules_list.listStore.clearTempList();
        const playlistId = `daily_${Date.now()}`;
        store_modules_list.listStore.setTempList(
          playlistId,
          songs,
          {
            id: playlistId,
            source: "mg",
            name: "每日推荐"
          }
        );
        store_modules_list.listStore.setPlayerListId(store_modules_list.LIST_IDS.TEMP);
        const firstSong = songs[0];
        const quality = store_modules_system.systemStore.getState().audioQuality || "128k";
        const songSource = firstSong.source || "mg";
        let playUrl = await utils_musicUrlCache.getCachedMusicUrl(firstSong.id, quality, songSource);
        let lyricData = null;
        if (!playUrl) {
          const requestData = utils_musicParams.buildMusicRequestParams({
            ...firstSong,
            source: "mg"
          }, quality);
          if (!requestData) {
            throw new Error("构建请求参数失败");
          }
          const musicUrlData = await utils_api_music.getMusicUrl(requestData);
          playUrl = musicUrlData == null ? void 0 : musicUrlData.url;
          if (playUrl) {
            await utils_musicUrlCache.setCachedMusicUrl(firstSong.id, quality, playUrl, songSource);
            lyricData = {
              lyric: musicUrlData.lyric || "",
              tlyric: musicUrlData.tlyric || "",
              rlyric: musicUrlData.rlyric || "",
              lxlyric: musicUrlData.lxlyric || ""
            };
          }
        } else {
          store_modules_player.playerStore.setUsingCachedUrl(true);
          const cachedLyric = await utils_lyricCache.getCachedLyric(firstSong.id, "mg");
          if (cachedLyric) {
            lyricData = {
              lyric: cachedLyric.lyric || "",
              tlyric: cachedLyric.tlyric || "",
              rlyric: cachedLyric.rlyric || "",
              lxlyric: cachedLyric.lxlyric || ""
            };
          }
        }
        if (!playUrl) {
          throw new Error("无法获取播放链接");
        }
        const initialMusicInfo = {
          ...firstSong,
          source: "mg"
        };
        const musicInfo = {
          ...initialMusicInfo,
          url: playUrl,
          playUrl,
          lyric: (lyricData == null ? void 0 : lyricData.lyric) || "",
          tlyric: (lyricData == null ? void 0 : lyricData.tlyric) || "",
          rlyric: (lyricData == null ? void 0 : lyricData.rlyric) || "",
          lxlyric: (lyricData == null ? void 0 : lyricData.lxlyric) || ""
        };
        store_modules_list.listStore.setPlayMusicInfo(store_modules_list.LIST_IDS.TEMP, musicInfo, false);
        store_modules_player.playerStore.playSong(musicInfo);
        common_vendor.index.showToast({
          title: `正在播放: 每日推荐`,
          icon: "none",
          duration: 2e3
        });
      } catch (error) {
        console.error("[Index] 每日推荐获取失败:", error);
        store_modules_player.playerStore.clearStatusText();
        common_vendor.index.showToast({
          title: error.message || "获取推荐失败",
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const searchBarStyle = common_vendor.computed(() => utils_system.getSafeAreaStyle());
    const onBannerChange = (e) => {
      currentBannerIndex.value = e.detail.current;
    };
    const handleBannerImageError = (event, banner) => {
      if (!banner || !banner.imageUrl)
        return;
      let currentProxyIndex = 0;
      if (banner.imageUrl.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (banner.imageUrl.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (banner.imageUrl.includes("jina.ai"))
        currentProxyIndex = 3;
      const nextUrl = utils_imageProxy.handleImageError(event, banner.imageUrl, currentProxyIndex);
      if (nextUrl) {
        banner.imageUrl = nextUrl;
      }
    };
    const handlePlaylistImageError = (event, playlist) => {
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
    __expose({
      t: utils_i18n.t,
      banners,
      recommendPlaylists,
      newSongs,
      newAlbums,
      topArtists,
      currentBannerIndex,
      isLoadingMore,
      showMiniPlayer,
      searchBarStyle,
      formatPlayCount,
      formatArtists,
      playSong,
      showSongOptions,
      playNewSong,
      formatDuration,
      handleBannerClick,
      playBanner,
      collectBanner,
      navigateTo,
      goToPlaylistDetail,
      goToSearch,
      goToSearchWithArtist,
      goToHotSongs,
      goToDailyRecommend,
      onBannerChange,
      handleBannerImageError,
      handlePlaylistImageError
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.s(statusBarStyle.value),
        b: common_vendor.p({
          name: "leaf",
          size: "20",
          color: "#ffffff"
        }),
        c: common_vendor.t(appName.value),
        d: common_vendor.o(handleAppLogoClick),
        e: common_vendor.p({
          name: "magnifying-glass",
          size: "20",
          color: "#999999"
        }),
        f: common_vendor.o(goToSearch),
        g: common_vendor.s(searchBarStyle.value),
        h: common_vendor.f(banners.value, (banner, index, i0) => {
          return {
            a: banner.imageUrl,
            b: common_vendor.o(($event) => handleBannerImageError($event, banner), index),
            c: common_vendor.t(banner.typeTitle),
            d: common_vendor.t(banner.subtitle || "精选音乐，为你推荐"),
            e: "31670c42-2-" + i0,
            f: common_vendor.o(($event) => playBanner(banner), index),
            g: "31670c42-3-" + i0,
            h: common_vendor.o(($event) => collectBanner(banner), index),
            i: index,
            j: common_vendor.o(($event) => handleBannerClick(banner), index),
            k: index === currentBannerIndex.value ? 1 : ""
          };
        }),
        i: common_vendor.p({
          name: "play",
          size: "18",
          color: "#ffffff"
        }),
        j: common_vendor.p({
          name: "heart",
          size: "18",
          color: "#ffffff"
        }),
        k: common_vendor.o(onBannerChange),
        l: common_vendor.f(banners.value, (item, index, i0) => {
          return {
            a: index,
            b: common_vendor.n({
              "indicator-dot-active": index === currentBannerIndex.value
            })
          };
        }),
        m: common_vendor.p({
          name: "heart",
          size: "22",
          color: "#ffffff"
        }),
        n: common_vendor.o(goToDailyRecommend),
        o: common_vendor.p({
          name: "ranking-star",
          size: "22",
          color: "#ffffff"
        }),
        p: common_vendor.o(($event) => navigateTo("/pages/rank/index")),
        q: common_vendor.p({
          name: "fire",
          size: "20",
          color: "#ffffff"
        }),
        r: common_vendor.o(goToHotSongs),
        s: common_vendor.p({
          name: "list",
          size: "20",
          color: "#ffffff"
        }),
        t: common_vendor.o(($event) => navigateTo("/pages/songlist-list/index")),
        v: common_vendor.p({
          name: "chevron-right",
          size: "12",
          color: "#999999"
        }),
        w: common_vendor.o(($event) => navigateTo("/pages/songlist-list/index")),
        x: common_vendor.f(recommendPlaylists.value, (playlist, index, i0) => {
          return {
            a: playlist.coverImgUrl,
            b: common_vendor.o(($event) => handlePlaylistImageError($event, playlist), playlist.id),
            c: "31670c42-9-" + i0,
            d: common_vendor.t(playlist.name),
            e: playlist.id,
            f: common_vendor.o(($event) => goToPlaylistDetail(playlist), playlist.id)
          };
        }),
        y: common_vendor.p({
          name: "play",
          size: "12",
          color: "#ffffff"
        }),
        z: common_vendor.p({
          name: "chevron-right",
          size: "12",
          color: "#999999"
        }),
        A: common_vendor.o(goToNewSongRank),
        B: common_vendor.f(newSongs.value, (song, index, i0) => {
          return {
            a: song.img,
            b: common_vendor.t(song.name),
            c: common_vendor.t(song.singer),
            d: common_vendor.t(song.album),
            e: song.id,
            f: common_vendor.o(($event) => playNewSong(song, index), song.id)
          };
        }),
        C: common_vendor.f(topArtists.value, (artist, index, i0) => {
          return {
            a: artist.picUrl,
            b: common_vendor.t(artist.name),
            c: artist.id,
            d: common_vendor.o(($event) => goToSearchWithArtist(artist.name), artist.id)
          };
        }),
        D: common_vendor.s(safeBottomStyle.value),
        E: common_vendor.s(scrollViewStyle.value),
        F: isRefreshing.value,
        G: common_vendor.o(onRefresh),
        H: isDarkMode.value ? 1 : ""
      };
    };
  }
};
exports._sfc_main = _sfc_main;
