"use strict";
const common_vendor = require("../../common/vendor.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
const utils_crypto_wy = require("../../utils/crypto/wy.js");
const utils_system = require("../../utils/system.js");
const utils_musicPic = require("../../utils/musicPic.js");
const utils_crypto_wbd = require("../../utils/crypto/wbd.js");
const utils_imageProxy = require("../../utils/imageProxy.js");
const utils_playSong = require("../../utils/playSong.js");
if (!Math) {
  (RocIconPlus + MiniPlayer)();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const MiniPlayer = () => "../../components/player/MiniPlayer.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const statusBarHeight = utils_system.getStatusBarHeight();
    const headerStyle = common_vendor.computed(() => ({
      paddingTop: `${statusBarHeight}px`
    }));
    const sourceList = [
      { id: "kw", name: "酷我音乐" },
      { id: "wy", name: "网易云音乐" },
      { id: "tx", name: "QQ音乐" },
      { id: "mg", name: "咪咕音乐" },
      { id: "kg", name: "酷狗音乐" }
    ];
    const getBoardsBySource = (source) => {
      const boardMap = {
        kw: [
          { id: "kw__93", name: "飙升榜", bangid: "93" },
          { id: "kw__17", name: "新歌榜", bangid: "17" },
          { id: "kw__16", name: "热歌榜", bangid: "16" },
          { id: "kw__158", name: "抖音热歌榜", bangid: "158" },
          { id: "kw__292", name: "铃声榜", bangid: "292" },
          { id: "kw__284", name: "热评榜", bangid: "284" },
          { id: "kw__290", name: "ACG新歌榜", bangid: "290" },
          { id: "kw__286", name: "台湾KKBOX榜", bangid: "286" },
          { id: "kw__279", name: "冬日暖心榜", bangid: "279" },
          { id: "kw__281", name: "巴士随身听榜", bangid: "281" },
          { id: "kw__255", name: "KTV点唱榜", bangid: "255" },
          { id: "kw__280", name: "家务进行曲榜", bangid: "280" },
          { id: "kw__282", name: "熬夜修仙榜", bangid: "282" },
          { id: "kw__283", name: "枕边轻音乐榜", bangid: "283" },
          { id: "kw__278", name: "古风音乐榜", bangid: "278" },
          { id: "kw__264", name: "Vlog音乐榜", bangid: "264" },
          { id: "kw__242", name: "电音榜", bangid: "242" },
          { id: "kw__187", name: "流行趋势榜", bangid: "187" },
          { id: "kw__204", name: "现场音乐榜", bangid: "204" },
          { id: "kw__186", name: "ACG神曲榜", bangid: "186" },
          { id: "kw__185", name: "最强翻唱榜", bangid: "185" },
          { id: "kw__26", name: "经典怀旧榜", bangid: "26" },
          { id: "kw__104", name: "华语榜", bangid: "104" },
          { id: "kw__182", name: "粤语榜", bangid: "182" },
          { id: "kw__22", name: "欧美榜", bangid: "22" },
          { id: "kw__184", name: "韩语榜", bangid: "184" },
          { id: "kw__183", name: "日语榜", bangid: "183" },
          { id: "kw__145", name: "会员畅听榜", bangid: "145" },
          { id: "kw__153", name: "网红新歌榜", bangid: "153" },
          { id: "kw__64", name: "影视金曲榜", bangid: "64" },
          { id: "kw__176", name: "DJ嗨歌榜", bangid: "176" },
          { id: "kw__106", name: "真声音", bangid: "106" },
          { id: "kw__12", name: "Billboard榜", bangid: "12" },
          { id: "kw__49", name: "iTunes音乐榜", bangid: "49" },
          { id: "kw__180", name: "beatport电音榜", bangid: "180" },
          { id: "kw__13", name: "英国UK榜", bangid: "13" },
          { id: "kw__164", name: "百大DJ榜", bangid: "164" },
          { id: "kw__246", name: "YouTube音乐排行榜", bangid: "246" },
          { id: "kw__265", name: "韩国Genie榜", bangid: "265" },
          { id: "kw__14", name: "韩国M-net榜", bangid: "14" },
          { id: "kw__8", name: "香港电台榜", bangid: "8" }
        ],
        wy: [
          { id: "wy__19723756", name: "飙升榜", bangid: "19723756" },
          { id: "wy__3779629", name: "新歌榜", bangid: "3779629" },
          { id: "wy__2884035", name: "原创榜", bangid: "2884035" },
          { id: "wy__3778678", name: "热歌榜", bangid: "3778678" },
          { id: "wy__991319590", name: "说唱榜", bangid: "991319590" },
          { id: "wy__71384707", name: "古典榜", bangid: "71384707" },
          { id: "wy__1978921795", name: "电音榜", bangid: "1978921795" },
          { id: "wy__5453912201", name: "黑胶VIP爱听榜", bangid: "5453912201" },
          { id: "wy__71385702", name: "ACG榜", bangid: "71385702" },
          { id: "wy__745956260", name: "韩语榜", bangid: "745956260" },
          { id: "wy__10520166", name: "国电榜", bangid: "10520166" },
          { id: "wy__180106", name: "UK排行榜周榜", bangid: "180106" },
          { id: "wy__60198", name: "美国Billboard榜", bangid: "60198" },
          { id: "wy__3812895", name: "Beatport全球电子舞曲榜", bangid: "3812895" },
          { id: "wy__21845217", name: "KTV唛榜", bangid: "21845217" },
          { id: "wy__60131", name: "日本Oricon榜", bangid: "60131" },
          { id: "wy__2809513713", name: "欧美热歌榜", bangid: "2809513713" },
          { id: "wy__2809577409", name: "欧美新歌榜", bangid: "2809577409" },
          { id: "wy__27135204", name: "法国 NRJ Vos Hits 周榜", bangid: "27135204" },
          { id: "wy__3001835560", name: "ACG动画榜", bangid: "3001835560" },
          { id: "wy__3001795926", name: "ACG游戏榜", bangid: "3001795926" },
          { id: "wy__3001890046", name: "ACG VOCALOID榜", bangid: "3001890046" },
          { id: "wy__3112516681", name: "中国新乡村音乐排行榜", bangid: "3112516681" },
          { id: "wy__5059644681", name: "日语榜", bangid: "5059644681" },
          { id: "wy__5059633707", name: "摇滚榜", bangid: "5059633707" },
          { id: "wy__5059642708", name: "国风榜", bangid: "5059642708" },
          { id: "wy__5338990334", name: "潜力爆款榜", bangid: "5338990334" },
          { id: "wy__5059661515", name: "民谣榜", bangid: "5059661515" },
          { id: "wy__6688069460", name: "听歌识曲榜", bangid: "6688069460" },
          { id: "wy__6723173524", name: "网络热歌榜", bangid: "6723173524" },
          { id: "wy__6732051320", name: "俄语榜", bangid: "6732051320" },
          { id: "wy__6732014811", name: "越南语榜", bangid: "6732014811" },
          { id: "wy__6886768100", name: "中文DJ榜", bangid: "6886768100" },
          { id: "wy__6939992364", name: "俄罗斯top hit流行音乐榜", bangid: "6939992364" },
          { id: "wy__7095271308", name: "泰语榜", bangid: "7095271308" },
          { id: "wy__7356827205", name: "BEAT排行榜", bangid: "7356827205" },
          { id: "wy__7325478166", name: "编辑推荐榜", bangid: "7325478166" },
          { id: "wy__7603212484", name: "LOOK直播歌曲榜", bangid: "7603212484" },
          { id: "wy__7775163417", name: "赏音榜", bangid: "7775163417" },
          { id: "wy__7785123708", name: "黑胶VIP新歌榜", bangid: "7785123708" },
          { id: "wy__7785066739", name: "黑胶VIP热歌榜", bangid: "7785066739" },
          { id: "wy__7785091694", name: "黑胶VIP爱搜榜", bangid: "7785091694" }
        ],
        tx: [
          { id: "tx__4", name: "流行指数榜", bangid: "4" },
          { id: "tx__26", name: "热歌榜", bangid: "26" },
          { id: "tx__27", name: "新歌榜", bangid: "27" },
          { id: "tx__62", name: "飙升榜", bangid: "62" },
          { id: "tx__58", name: "说唱榜", bangid: "58" },
          { id: "tx__57", name: "喜力电音榜", bangid: "57" },
          { id: "tx__28", name: "网络歌曲榜", bangid: "28" },
          { id: "tx__5", name: "内地榜", bangid: "5" },
          { id: "tx__3", name: "欧美榜", bangid: "3" },
          { id: "tx__59", name: "香港地区榜", bangid: "59" },
          { id: "tx__16", name: "韩国榜", bangid: "16" },
          { id: "tx__60", name: "抖快榜", bangid: "60" },
          { id: "tx__29", name: "影视金曲榜", bangid: "29" },
          { id: "tx__17", name: "日本榜", bangid: "17" },
          { id: "tx__52", name: "腾讯音乐人原创榜", bangid: "52" },
          { id: "tx__36", name: "K歌金曲榜", bangid: "36" },
          { id: "tx__61", name: "台湾地区榜", bangid: "61" },
          { id: "tx__63", name: "DJ舞曲榜", bangid: "63" },
          { id: "tx__64", name: "综艺新歌榜", bangid: "64" },
          { id: "tx__65", name: "国风热歌榜", bangid: "65" },
          { id: "tx__67", name: "听歌识曲榜", bangid: "67" },
          { id: "tx__72", name: "动漫音乐榜", bangid: "72" },
          { id: "tx__73", name: "游戏音乐榜", bangid: "73" },
          { id: "tx__75", name: "有声榜", bangid: "75" },
          { id: "tx__131", name: "校园音乐人排行榜", bangid: "131" }
        ],
        mg: [
          { id: "mg__27553319", name: "新歌榜", bangid: "27553319" },
          { id: "mg__27186466", name: "热歌榜", bangid: "27186466" },
          { id: "mg__27553408", name: "原创榜", bangid: "27553408" },
          { id: "mg__75959118", name: "音乐风向榜", bangid: "75959118" },
          { id: "mg__76557036", name: "彩铃分贝榜", bangid: "76557036" },
          { id: "mg__76557745", name: "会员臻爱榜", bangid: "76557745" },
          { id: "mg__23189800", name: "港台榜", bangid: "23189800" },
          { id: "mg__23189399", name: "内地榜", bangid: "23189399" },
          { id: "mg__19190036", name: "欧美榜", bangid: "19190036" },
          { id: "mg__83176390", name: "国风金曲榜", bangid: "83176390" }
        ],
        kg: [
          { id: "kg__6666", name: "飙升榜", bangid: "6666" },
          { id: "kg__8888", name: "TOP500", bangid: "8888" },
          { id: "kg__59703", name: "蜂鸟流行音乐榜", bangid: "59703" },
          { id: "kg__52144", name: "抖音热歌榜", bangid: "52144" },
          { id: "kg__52767", name: "快手热歌榜", bangid: "52767" },
          { id: "kg__24971", name: "DJ热歌榜", bangid: "24971" },
          { id: "kg__23784", name: "网络红歌榜", bangid: "23784" },
          { id: "kg__44412", name: "说唱先锋榜", bangid: "44412" },
          { id: "kg__31308", name: "内地榜", bangid: "31308" },
          { id: "kg__33160", name: "电音榜", bangid: "33160" },
          { id: "kg__31313", name: "香港地区榜", bangid: "31313" },
          { id: "kg__51341", name: "民谣榜", bangid: "51341" },
          { id: "kg__54848", name: "台湾地区榜", bangid: "54848" },
          { id: "kg__31310", name: "欧美榜", bangid: "31310" },
          { id: "kg__33162", name: "ACG新歌榜", bangid: "33162" },
          { id: "kg__31311", name: "韩国榜", bangid: "31311" },
          { id: "kg__31312", name: "日本榜", bangid: "31312" },
          { id: "kg__49225", name: "80后热歌榜", bangid: "49225" },
          { id: "kg__49223", name: "90后热歌榜", bangid: "49223" },
          { id: "kg__49224", name: "00后热歌榜", bangid: "49224" },
          { id: "kg__33165", name: "粤语金曲榜", bangid: "33165" },
          { id: "kg__33166", name: "欧美金曲榜", bangid: "33166" },
          { id: "kg__33163", name: "影视金曲榜", bangid: "33163" },
          { id: "kg__51340", name: "伤感榜", bangid: "51340" },
          { id: "kg__35811", name: "会员专享榜", bangid: "35811" },
          { id: "kg__37361", name: "雷达榜", bangid: "37361" },
          { id: "kg__21101", name: "分享榜", bangid: "21101" },
          { id: "kg__46910", name: "综艺新歌榜", bangid: "46910" },
          { id: "kg__30972", name: "酷狗音乐人原创榜", bangid: "30972" },
          { id: "kg__60170", name: "闽南语榜", bangid: "60170" },
          { id: "kg__65234", name: "儿歌榜", bangid: "65234" },
          { id: "kg__4681", name: "美国BillBoard榜", bangid: "4681" },
          { id: "kg__25028", name: "Beatport电子舞曲榜", bangid: "25028" },
          { id: "kg__4680", name: "英国单曲榜", bangid: "4680" },
          { id: "kg__38623", name: "韩国Melon音乐榜", bangid: "38623" },
          { id: "kg__42807", name: "joox本地热歌榜", bangid: "42807" },
          { id: "kg__36107", name: "小语种热歌榜", bangid: "36107" },
          { id: "kg__4673", name: "日本Oricon榜", bangid: "4673" },
          { id: "kg__4683", name: "台湾Hito中文榜", bangid: "4683" },
          { id: "kg__4684", name: "中国TOP排行榜", bangid: "4684" },
          { id: "kg__4682", name: "香港电台中文歌曲龙虎榜", bangid: "4682" },
          { id: "kg__4685", name: "中国嘻哈榜", bangid: "4685" },
          { id: "kg__12861", name: "酷狗top500榜", bangid: "12861" }
        ]
      };
      return boardMap[source] || boardMap["kw"];
    };
    const currentSource = common_vendor.ref("kw");
    const currentBoardId = common_vendor.ref("");
    const currentBoardName = common_vendor.ref("");
    const boardList = common_vendor.ref([]);
    const songList = common_vendor.ref([]);
    const currentPage = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    const isLoading = common_vendor.ref(false);
    const isLoadingMore = common_vendor.ref(false);
    const isRefreshing = common_vendor.ref(false);
    const loadError = common_vendor.ref("");
    const showSourcePicker = common_vendor.ref(false);
    const showMenu = common_vendor.ref(false);
    const selectedSong = common_vendor.ref(null);
    const selectedIndex = common_vendor.ref(0);
    const showMiniPlayer = common_vendor.computed(() => store_modules_player.playerStore.getState().showMiniPlayer);
    const currentSong = common_vendor.computed(() => store_modules_player.playerStore.getState().currentSong);
    const darkMode = common_vendor.ref(false);
    const initDarkMode = () => {
      darkMode.value = common_vendor.index.getStorageSync("darkMode") === "true";
      console.log("[Rank] 初始化暗黑模式:", darkMode.value);
    };
    const currentSourceName = common_vendor.computed(() => {
      const source = sourceList.find((s) => s.id === currentSource.value);
      return source ? source.name : "酷我音乐";
    });
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const selectSource = (sourceId) => {
      currentSource.value = sourceId;
      currentBoardId.value = "";
      currentPage.value = 1;
      songList.value = [];
      hasMore.value = true;
      loadError.value = "";
      showSourcePicker.value = false;
      loadBoardList();
    };
    const selectBoard = async (board) => {
      console.log("[排行榜] selectBoard 开始:", board.name, board.id);
      currentBoardId.value = board.id;
      currentBoardName.value = board.name;
      currentPage.value = 1;
      songList.value = [];
      hasMore.value = true;
      saveLeaderboardSetting({ source: currentSource.value, boardId: board.id });
      await loadSongList();
      console.log("[排行榜] selectBoard 完成后的 songList:", songList.value.length, "首");
    };
    const selectBoardWithoutSave = async (board) => {
      console.log("[排行榜] selectBoardWithoutSave 开始:", board.name, board.id);
      currentBoardId.value = board.id;
      currentBoardName.value = board.name;
      currentPage.value = 1;
      songList.value = [];
      hasMore.value = true;
      console.log("[排行榜] 临时模式：不保存设置");
      await loadSongList();
      console.log("[排行榜] selectBoardWithoutSave 完成后的 songList:", songList.value.length, "首");
    };
    const saveLeaderboardSetting = (settings) => {
      try {
        common_vendor.index.setStorageSync("leaderboardSetting", JSON.stringify(settings));
        console.log("[排行榜] 保存设置:", settings);
      } catch (e) {
        console.error("[排行榜] 保存设置失败:", e);
      }
    };
    const loadBoardList = async () => {
      console.log("[排行榜] loadBoardList 开始, 音源:", currentSource.value);
      console.log("[排行榜] loadBoardList boardList当前值:", boardList.value.length);
      isLoading.value = true;
      try {
        const boards = getBoardsBySource(currentSource.value);
        console.log("[排行榜] loadBoardList 获取到榜单数量:", boards.length);
        console.log("[排行榜] loadBoardList 榜单列表:", boards.map((b) => b.name).join(", "));
        boardList.value = boards;
        console.log("[排行榜] loadBoardList boardList已更新:", boardList.value.length);
        if (!currentBoardId.value && boards.length > 0) {
          console.log("[排行榜] 自动选中第一个榜单:", boards[0].name);
          await selectBoard(boards[0]);
        }
      } catch (error) {
        console.error("[排行榜] 加载榜单列表失败:", error);
        loadError.value = "加载榜单失败";
      } finally {
        isLoading.value = false;
        console.log("[排行榜] loadBoardList 完成");
      }
    };
    const loadSongList = async (isLoadMore = false) => {
      var _a;
      console.log("[排行榜] loadSongList 开始, isLoadMore:", isLoadMore, "boardId:", currentBoardId.value, "currentPage:", currentPage.value);
      if (!currentBoardId.value) {
        console.log("[排行榜] 没有选中的榜单，跳过加载");
        return;
      }
      if (isLoadMore) {
        isLoadingMore.value = true;
      } else {
        isLoading.value = true;
      }
      try {
        const [source, bangid] = currentBoardId.value.split("__");
        console.log("[排行榜] 解析榜单ID: source:", source, "bangid:", bangid);
        console.log("[排行榜] 开始获取歌曲列表, page:", currentPage.value);
        const result = await fetchBoardSongs(source, bangid, currentPage.value);
        console.log("[排行榜] 获取到歌曲数量:", (_a = result.list) == null ? void 0 : _a.length, "total:", result.total);
        if (isLoadMore) {
          songList.value = [...songList.value, ...result.list];
        } else {
          songList.value = result.list;
        }
        const loadedCount = songList.value.length;
        hasMore.value = result.total > 0 ? loadedCount < result.total : result.list.length >= 30;
        console.log("[排行榜] 已加载:", loadedCount, "首, 总数:", result.total, "是否还有更多:", hasMore.value);
      } catch (error) {
        console.error("[排行榜] 加载歌曲列表失败:", error);
        loadError.value = "加载歌曲失败";
      } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
        isRefreshing.value = false;
        console.log("[排行榜] loadSongList 完成, 当前列表长度:", songList.value.length);
      }
    };
    const fetchBoardSongs = async (source, bangid, page) => {
      var _a;
      console.log("[排行榜] fetchBoardSongs 开始, source:", source, "bangid:", bangid, "page:", page);
      const fetchMap = {
        kw: fetchKwBoardSongs,
        wy: fetchWyBoardSongs,
        tx: fetchTxBoardSongs,
        mg: fetchMgBoardSongs,
        kg: fetchKgBoardSongs
      };
      const fetchFn = fetchMap[source] || fetchKwBoardSongs;
      const result = await fetchFn(bangid, page);
      console.log("[排行榜] fetchBoardSongs 返回:", (_a = result.list) == null ? void 0 : _a.length, "首, total:", result.total);
      return result;
    };
    const fetchKwBoardSongs = async (bangid, page) => {
      console.log("[排行榜] fetchKwBoardSongs 开始, bangid:", bangid, "page:", page);
      try {
        const limit = 100;
        const pn = page - 1;
        const requestBody = {
          uid: "",
          devId: "",
          sFrom: "kuwo_sdk",
          user_type: "AP",
          carSource: "kwplayercar_ar_6.0.1.0_apk_keluze.apk",
          id: bangid,
          pn,
          rn: limit
        };
        console.log("[排行榜] 发起酷我榜单请求，使用 wbdCrypto 加密");
        console.log("[排行榜] 请求体:", JSON.stringify(requestBody));
        let params;
        try {
          params = utils_crypto_wbd.wbdCrypto.buildParam(requestBody);
          console.log("[排行榜] 构建的参数长度:", params == null ? void 0 : params.length);
          console.log("[排行榜] 完整URL:", `https://wbd.kuwo.cn/api/bd/bang/bang_info?${params}`);
        } catch (e) {
          console.error("[排行榜] buildParam 异常:", e);
          return [];
        }
        const requestUrl = `https://wbd.kuwo.cn/api/bd/bang/bang_info?${params}`;
        console.log("[排行榜] 最终请求URL:", requestUrl);
        const res = await common_vendor.index.request({
          url: requestUrl,
          method: "GET",
          header: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
            "Referer": "https://music.kuwo.cn/"
          }
        });
        console.log("[排行榜] 酷我榜单响应:", res.errMsg);
        console.log("[排行榜] 酷我榜单响应状态码:", res.statusCode);
        console.log("[排行榜] 酷我榜单响应数据类型:", typeof res.data);
        console.log("[排行榜] 酷我榜单响应数据:", res.data);
        if (res.errMsg !== "request:ok") {
          console.error("[排行榜] 酷我榜单请求失败:", res.errMsg);
          return [];
        }
        if (!res.data) {
          console.error("[排行榜] 酷我榜单无响应数据");
          return [];
        }
        console.log("[排行榜] 酷我榜单原始响应:", JSON.stringify(res.data).substring(0, 200));
        let rawData;
        try {
          rawData = utils_crypto_wbd.wbdCrypto.decodeData(res.data);
          console.log("[排行榜] 酷我榜单解密后数据:", JSON.stringify(rawData).substring(0, 200));
        } catch (e) {
          console.error("[排行榜] 解密失败:", e);
          console.error("[排行榜] 原始响应:", res.data);
          return [];
        }
        if (rawData.code != 200 || !rawData.data || !rawData.data.musiclist) {
          console.error("[排行榜] 酷我榜单返回错误:", rawData);
          return [];
        }
        console.log("[排行榜] 酷我榜单歌曲数量:", rawData.data.musiclist.length);
        console.log("[排行榜] 酷我榜单total:", rawData.data.total);
        const list = rawData.data.musiclist.map((item, index) => ({
          id: item.musicrid || item.id,
          name: item.name || "未知歌曲",
          singer: item.artist || "未知歌手",
          album: item.album || "",
          duration: item.duration || 0,
          source: "kw",
          musicrid: item.musicrid,
          albumid: item.albumid,
          pic: item.pic
        }));
        console.log("[排行榜] 酷我榜单解析歌曲数量:", list.length);
        return {
          list,
          total: parseInt(rawData.data.total) || list.length
        };
      } catch (error) {
        console.error("[排行榜] 酷我榜单获取失败:", error);
        return { list: [], total: 0 };
      }
    };
    const fetchWyBoardSongs = async (bangid, page) => {
      var _a;
      console.log("[排行榜] fetchWyBoardSongs 开始, bangid:", bangid, "page:", page);
      try {
        const params = utils_crypto_wy.weapi({
          id: bangid,
          n: "1000",
          s: "0"
        });
        console.log("[排行榜] 网易云榜单请求参数:", JSON.stringify(params).substring(0, 100));
        const res = await common_vendor.index.request({
          url: "https://music.163.com/weapi/v3/playlist/detail",
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://music.163.com"
          },
          data: `params=${encodeURIComponent(params.params)}&encSecKey=${encodeURIComponent(params.encSecKey)}`
        });
        console.log("[排行榜] 网易云榜单响应状态:", res.statusCode);
        if (res.data && res.data.code === 200 && res.data.playlist && res.data.playlist.tracks) {
          console.log("[排行榜] 网易云榜单歌曲数量:", res.data.playlist.tracks.length);
          console.log("[排行榜] 网易云榜单total:", (_a = res.data.playlist.trackIds) == null ? void 0 : _a.length);
          const list = res.data.playlist.tracks.map((item, index) => ({
            id: item.id,
            name: item.name || "未知歌曲",
            singer: item.ar ? item.ar.map((a) => a.name).join(" / ") : "未知歌手",
            album: item.al ? item.al.name : "",
            duration: Math.floor(item.dt / 1e3) || 0,
            source: "wy",
            al: item.al,
            ar: item.ar
          }));
          return {
            list,
            total: list.length
          };
        }
        console.error("[排行榜] 网易云榜单响应异常:", res.data);
        return { list: [], total: 0 };
      } catch (error) {
        console.error("[排行榜] 网易云榜单获取失败:", error);
        return { list: [], total: 0 };
      }
    };
    const fetchTxBoardSongs = async (bangid, page) => {
      console.log("[排行榜] fetchTxBoardSongs 开始, bangid:", bangid, "page:", page);
      try {
        const limit = 100;
        const songBegin = (page - 1) * limit;
        const res = await common_vendor.index.request({
          url: "https://u.y.qq.com/cgi-bin/musicu.fcg",
          method: "POST",
          data: {
            comm: {
              g_tk: 5381,
              uin: 0,
              format: "json",
              inCharset: "utf-8",
              outCharset: "utf-8",
              notice: 0,
              platform: "h5",
              needNewCode: 1
            },
            detail: {
              module: "musicToplist.ToplistInfoServer",
              method: "GetDetail",
              param: {
                topId: parseInt(bangid),
                offset: songBegin,
                num: limit,
                period: ""
              }
            }
          },
          header: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://y.qq.com"
          }
        });
        console.log("[排行榜] QQ音乐榜单响应状态:", res.statusCode);
        if (res.data && res.data.detail && res.data.detail.data && res.data.detail.data.songInfoList) {
          console.log("[排行榜] QQ音乐榜单歌曲数量:", res.data.detail.data.songInfoList.length);
          console.log("[排行榜] QQ音乐榜单total:", res.data.detail.data.totalNum);
          const list = res.data.detail.data.songInfoList.map((item, index) => {
            let imgUrl = "";
            if (item.album && item.album.name && item.album.name !== "" && item.album.name !== "空") {
              imgUrl = `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.album.mid}.jpg`;
            } else if (item.singer && item.singer.length > 0) {
              imgUrl = `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0].mid}.jpg`;
            }
            return {
              id: item.id || item.songId,
              name: item.name || item.title || "未知歌曲",
              singer: item.singer ? item.singer.map((s) => s.name).join(" / ") : "未知歌手",
              album: item.album ? item.album.name : "",
              duration: item.interval || 0,
              source: "tx",
              songmid: item.mid || item.songmid,
              img: imgUrl,
              albumMid: item.album ? item.album.mid : "",
              singerMid: item.singer && item.singer.length > 0 ? item.singer[0].mid : ""
            };
          });
          return {
            list,
            total: res.data.detail.data.totalNum || list.length
          };
        }
        console.error("[排行榜] QQ音乐榜单响应异常:", res.data);
        return { list: [], total: 0 };
      } catch (error) {
        console.error("[排行榜] QQ音乐榜单获取失败:", error);
        return { list: [], total: 0 };
      }
    };
    const fetchMgBoardSongs = async (bangid, page) => {
      var _a, _b, _c;
      console.log("[排行榜] fetchMgBoardSongs 开始, bangid:", bangid, "page:", page);
      try {
        const limit = 200;
        const url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do?columnId=${bangid}&needAll=0`;
        console.log("[排行榜] 咪咕榜单请求 URL:", url);
        const res = await common_vendor.index.request({
          url,
          method: "GET",
          header: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
            "Referer": "https://app.c.nf.migu.cn/",
            "channel": "0146921"
          }
        });
        console.log("[排行榜] 咪咕榜单响应状态:", res.statusCode);
        console.log("[排行榜] 咪咕榜单响应数据:", JSON.stringify(res.data).substring(0, 300));
        if (res.statusCode !== 200 || ((_a = res.data) == null ? void 0 : _a.code) !== "000000") {
          console.error("[排行榜] 咪咕榜单请求失败:", res.data);
          return [];
        }
        const contents = (_c = (_b = res.data) == null ? void 0 : _b.columnInfo) == null ? void 0 : _c.contents;
        if (!contents || !Array.isArray(contents)) {
          console.error("[排行榜] 咪咕榜单无 contents 数据:", res.data);
          return [];
        }
        console.log("[排行榜] 咪咕榜单 contents 数量:", contents.length);
        const list = contents.map((item, index) => {
          const info = item.objectInfo || item;
          if (index === 0) {
            console.log("[排行榜] 咪咕歌曲 length 字段:", info.length, "类型:", typeof info.length);
            console.log("[排行榜] 咪咕歌曲 duration 字段:", info.duration, "类型:", typeof info.duration);
          }
          let imgUrl = "";
          if (info.landscapImg) {
            imgUrl = info.landscapImg;
          } else if (info.albumImgs && info.albumImgs.length > 0) {
            imgUrl = info.albumImgs[0].img || "";
          }
          let duration = 0;
          if (info.length && typeof info.length === "string") {
            const timeMatch = info.length.match(/^(?:(\d+):)?(\d+):(\d+)$/);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1] || "0");
              const minutes = parseInt(timeMatch[2]);
              const seconds = parseInt(timeMatch[3]);
              duration = hours * 3600 + minutes * 60 + seconds;
              if (index === 0) {
                console.log("[排行榜] 咪咕歌曲时长解析:", info.length, "->", duration, "秒");
              }
            } else if (index === 0) {
              console.log("[排行榜] 咪咕歌曲时长匹配失败:", info.length);
            }
          } else if (info.duration) {
            duration = parseInt(info.duration);
            if (index === 0) {
              console.log("[排行榜] 咪咕歌曲使用 duration 字段:", duration);
            }
          }
          return {
            id: info.copyrightId || info.songId || info.id,
            name: info.songName || info.title || "未知歌曲",
            singer: info.singerName || info.singer || "未知歌手",
            album: info.album || info.albumName || "",
            duration,
            source: "mg",
            copyrightId: info.copyrightId,
            songId: info.songId,
            songmid: info.songId,
            // 咪咕音乐使用 songId 作为 songmid
            img: imgUrl,
            albumId: info.albumId,
            singerId: info.singerId
          };
        });
        console.log("[排行榜] 咪咕榜单解析歌曲数量:", list.length);
        return {
          list,
          total: list.length
        };
      } catch (error) {
        console.error("[排行榜] 咪咕榜单获取失败:", error);
        console.error("[排行榜] 错误堆栈:", error == null ? void 0 : error.stack);
        return { list: [], total: 0 };
      }
    };
    const fetchKgBoardSongs = async (bangid, page) => {
      console.log("[排行榜] fetchKgBoardSongs 开始, bangid:", bangid, "page:", page);
      try {
        const pagesize = 100;
        const pageNo = page;
        const url = `http://mobilecdnbj.kugou.com/api/v3/rank/song?version=9108&ranktype=1&plat=0&pagesize=${pagesize}&area_code=1&page=${pageNo}&rankid=${bangid}&with_res_tag=0&show_portrait_mv=1`;
        console.log("[排行榜] 酷狗榜单请求URL:", url);
        const res = await common_vendor.index.request({
          url,
          method: "GET",
          header: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
            "Referer": "https://www.kugou.com"
          }
        });
        console.log("[排行榜] 酷狗榜单响应状态:", res.statusCode);
        console.log("[排行榜] 酷狗榜单响应数据:", res.data ? "有数据" : "无数据");
        if (res.data && res.data.errcode === 0 && res.data.data && res.data.data.info) {
          console.log("[排行榜] 酷狗榜单歌曲数量:", res.data.data.info.length);
          console.log("[排行榜] 酷狗榜单total:", res.data.data.total);
          const list = res.data.data.info.map((item, index) => {
            var _a, _b;
            let imgUrl = "";
            if (item.album_sizable_cover) {
              imgUrl = item.album_sizable_cover.replace("{size}", "150");
            } else if (item.trans_param && item.trans_param.union_cover) {
              imgUrl = item.trans_param.union_cover.replace("{size}", "150");
            }
            let singerImgUrl = "";
            if (item.authors && item.authors.length > 0 && item.authors[0].sizable_avatar) {
              singerImgUrl = item.authors[0].sizable_avatar.replace("{size}", "150");
            }
            return {
              id: item.hash || item.audio_id,
              name: item.songname || item.filename && ((_a = item.filename.split("-")[1]) == null ? void 0 : _a.trim()) || "未知歌曲",
              singer: item.singername || item.filename && ((_b = item.filename.split("-")[0]) == null ? void 0 : _b.trim()) || "未知歌手",
              album: item.album_name || item.remark || "",
              duration: item.duration || 0,
              source: "kg",
              hash: item.hash,
              album_id: item.album_id,
              audio_id: item.audio_id,
              img: imgUrl,
              singerImg: singerImgUrl,
              mvhash: item.mvhash,
              sqhash: item.sqhash,
              "320hash": item["320hash"]
            };
          });
          return {
            list,
            total: res.data.data.total || list.length
          };
        }
        console.error("[排行榜] 酷狗榜单响应异常:", res.data);
        return { list: [], total: 0 };
      } catch (error) {
        console.error("[排行榜] 酷狗榜单获取失败:", error);
        console.error("[排行榜] 错误详情:", error.message || error);
        return { list: [], total: 0 };
      }
    };
    let scrollTimer = null;
    let lastScrollTop = 0;
    const onScroll = () => {
      const query = common_vendor.index.createSelectorQuery();
      query.select(".list-wrapper").boundingClientRect();
      query.select(".list-wrapper").scrollOffset();
      query.exec((res) => {
        if (!res[0] || !res[1]) {
          console.log("[排行榜] onScroll: 无法获取滚动信息");
          return;
        }
        const rect = res[0];
        const scrollInfo = res[1];
        const scrollTop = scrollInfo.scrollTop;
        const scrollHeight = scrollInfo.scrollHeight;
        const clientHeight = rect.height;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        if (Math.abs(scrollTop - lastScrollTop) > 100) {
          console.log("[排行榜] === onScroll ===");
          console.log("[排行榜] scrollTop:", scrollTop);
          console.log("[排行榜] scrollHeight:", scrollHeight);
          console.log("[排行榜] clientHeight:", clientHeight);
          console.log("[排行榜] scrollBottom:", scrollBottom);
          console.log("[排行榜] hasMore:", hasMore.value);
          console.log("[排行榜] isLoadingMore:", isLoadingMore.value);
          console.log("[排行榜] isLoading:", isLoading.value);
          lastScrollTop = scrollTop;
        }
        if (scrollBottom < 100 && hasMore.value && !isLoadingMore.value && !isLoading.value) {
          console.log("[排行榜] 触发自动加载更多, scrollBottom:", scrollBottom);
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
      loadSongList(true);
    };
    const retryLoad = () => {
      loadError.value = "";
      loadSongList();
    };
    const getSongPic = (song) => {
      return utils_musicPic.getSongPicUrl(song);
    };
    const handleRankImageError = (event, song) => {
      if (!song)
        return;
      const originalUrl = getSongPic(song);
      if (!originalUrl)
        return;
      let currentProxyIndex = 0;
      if (originalUrl.includes("wsrv.nl"))
        currentProxyIndex = 1;
      else if (originalUrl.includes("weserv.nl"))
        currentProxyIndex = 2;
      else if (originalUrl.includes("jina.ai"))
        currentProxyIndex = 3;
      utils_imageProxy.handleImageError(event, originalUrl, currentProxyIndex);
    };
    const formatArtists = (song) => {
      if (typeof song.singer === "string")
        return song.singer;
      if (song.ar && Array.isArray(song.ar)) {
        return song.ar.map((a) => a.name).join(" / ");
      }
      return "未知歌手";
    };
    const formatDuration = (duration) => {
      if (!duration || duration <= 0)
        return "00:00";
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };
    const isCurrentSong = (song) => {
      const current = currentSong.value;
      if (!current)
        return false;
      return current.id === song.id && current.source === song.source;
    };
    const playSong = async (song, index) => {
      console.log("[排行榜] 播放歌曲:", song.name, "索引:", index);
      if (!song || !song.id) {
        console.error("[排行榜] 歌曲对象无效:", song);
        common_vendor.index.showToast({
          title: "歌曲信息无效",
          icon: "none"
        });
        return;
      }
      const songData = {
        ...song,
        id: String(song.id)
      };
      await utils_playSong.playSongCommon(songData, {
        addToDefaultList: true,
        source: song.source || "kw"
      });
    };
    const showSongMenu = (song, index) => {
      selectedSong.value = song;
      selectedIndex.value = index;
      showMenu.value = true;
    };
    const closeMenu = () => {
      showMenu.value = false;
      selectedSong.value = null;
    };
    const playSelectedSong = () => {
      if (selectedSong.value) {
        playSong(selectedSong.value, selectedIndex.value);
      }
      closeMenu();
    };
    const addToNext = () => {
      if (selectedSong.value) {
        store_modules_list.listStore.addTempPlayList(selectedSong.value, store_modules_list.LIST_IDS.DEFAULT, true);
        common_vendor.index.showToast({
          title: "已添加到下一首",
          icon: "none"
        });
      }
      closeMenu();
    };
    const addToPlaylist = () => {
      if (selectedSong.value) {
        common_vendor.index.navigateTo({
          url: `/pages/playlist-select/index?songId=${selectedSong.value.id}&source=${selectedSong.value.source}`
        });
      }
      closeMenu();
    };
    const collectSong = () => {
      if (selectedSong.value) {
        store_modules_list.listStore.addToLoveList(selectedSong.value);
        common_vendor.index.showToast({
          title: "收藏成功",
          icon: "success"
        });
      }
      closeMenu();
    };
    common_vendor.onMounted(() => {
      console.log("[排行榜] onMounted 开始初始化");
      utils_system.setStatusBarTextColor("dark");
      initDarkMode();
      initPage();
    });
    common_vendor.onShow(() => {
      utils_system.setStatusBarTextColor("dark");
      initDarkMode();
    });
    const initPage = async () => {
      console.log("[排行榜] initPage 开始");
      try {
        const tempSource = common_vendor.index.getStorageSync("rank_temp_source");
        const tempBoardId = common_vendor.index.getStorageSync("rank_temp_boardId");
        common_vendor.index.removeStorageSync("rank_temp_source");
        common_vendor.index.removeStorageSync("rank_temp_boardId");
        if (tempSource && tempBoardId) {
          console.log("[排行榜] 从首页热歌榜跳转，使用临时参数:", tempSource, tempBoardId);
          currentSource.value = tempSource;
          const boards = getBoardsBySource(tempSource);
          boardList.value = boards;
          console.log("[排行榜] 临时模式加载榜单数量:", boards.length);
          const board = boards.find((b) => b.id === tempBoardId);
          if (board) {
            console.log("[排行榜] 选中热歌榜:", board.name);
            await selectBoardWithoutSave(board);
          } else if (boards.length > 0) {
            console.log("[排行榜] 未找到指定榜单，选中第一个");
            await selectBoardWithoutSave(boards[0]);
          }
          console.log("[排行榜] initPage 完成（临时模式，不保存设置）");
          return;
        }
        const settings = await getLeaderboardSetting();
        console.log("[排行榜] 获取到设置:", settings);
        const savedSettings = common_vendor.index.getStorageSync("leaderboardSetting");
        if (!savedSettings) {
          console.log("[排行榜] 首次进入，保存默认设置");
          saveLeaderboardSetting({ source: "kw", boardId: "kw__16" });
        }
        currentSource.value = settings.source;
        await loadBoardList();
        if (settings.boardId) {
          const board = boardList.value.find((b) => b.id === settings.boardId);
          if (board) {
            console.log("[排行榜] 选中保存的榜单:", board.name);
            await selectBoard(board);
          } else if (boardList.value.length > 0) {
            console.log("[排行榜] 未找到保存的榜单，选中第一个");
            await selectBoard(boardList.value[0]);
          }
        } else if (boardList.value.length > 0) {
          console.log("[排行榜] 没有保存的榜单，选中第一个");
          await selectBoard(boardList.value[0]);
        }
      } catch (error) {
        console.error("[排行榜] 初始化失败:", error);
        common_vendor.index.showToast({
          title: "初始化失败",
          icon: "none"
        });
      }
      console.log("[排行榜] initPage 完成");
    };
    const getLeaderboardSetting = () => {
      return new Promise((resolve) => {
        try {
          const rawData = common_vendor.index.getStorageSync("leaderboardSetting");
          console.log("[排行榜] 从storage读取原始数据:", rawData);
          if (rawData) {
            const settings = JSON.parse(rawData);
            console.log("[排行榜] 解析后的设置:", settings);
            resolve(settings);
          } else {
            console.log("[排行榜] storage为空，使用默认值");
            resolve({ source: "kw", boardId: "kw__16" });
          }
        } catch (e) {
          console.error("[排行榜] 读取设置失败:", e);
          resolve({ source: "kw", boardId: "kw__16" });
        }
      });
    };
    common_vendor.watch(currentSource, () => {
      console.log("[排行榜] 音源变化:", currentSource.value);
      loadBoardList();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.p({
          name: "chevron-left",
          size: "24",
          color: "#333"
        }),
        b: common_vendor.o(goBack, "69"),
        c: common_vendor.t(currentSourceName.value),
        d: common_vendor.p({
          name: "chevron-down",
          size: "14",
          color: darkMode.value ? "#f3f4f6" : "#333"
        }),
        e: common_vendor.o(($event) => showSourcePicker.value = true, "4b"),
        f: common_vendor.f(boardList.value, (board, k0, i0) => {
          return {
            a: common_vendor.t(board.name),
            b: board.id,
            c: currentBoardId.value === board.id ? 1 : "",
            d: common_vendor.o(($event) => selectBoard(board), board.id)
          };
        }),
        g: common_vendor.s(headerStyle.value),
        h: isLoading.value && songList.value.length === 0
      }, isLoading.value && songList.value.length === 0 ? {} : {}, {
        i: loadError.value && !isLoading.value
      }, loadError.value && !isLoading.value ? {
        j: common_vendor.p({
          name: "exclamation-circle",
          size: "48",
          color: "#999"
        }),
        k: common_vendor.t(loadError.value),
        l: common_vendor.o(retryLoad, "99")
      } : {}, {
        m: songList.value.length > 0
      }, songList.value.length > 0 ? {
        n: common_vendor.f(songList.value, (song, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: index < 3 ? 1 : "",
            c: common_vendor.unref(utils_imageProxy.proxyImageUrl)(getSongPic(song)),
            d: common_vendor.o(($event) => handleRankImageError($event, song), song.id || index),
            e: isCurrentSong(song)
          }, isCurrentSong(song) ? {
            f: common_vendor.f(4, (i, k1, i1) => {
              return {
                a: i,
                b: i * 0.1 + "s"
              };
            })
          } : {}, {
            g: common_vendor.t(song.name),
            h: isCurrentSong(song) ? 1 : "",
            i: common_vendor.t(formatArtists(song)),
            j: song.album
          }, song.album ? {} : {}, {
            k: song.album
          }, song.album ? {
            l: common_vendor.t(song.album)
          } : {}, {
            m: common_vendor.t(formatDuration(song.duration)),
            n: "9949ef41-3-" + i0,
            o: common_vendor.o(($event) => showSongMenu(song, index), song.id || index),
            p: song.id || index,
            q: common_vendor.o(($event) => playSong(song, index), song.id || index),
            r: common_vendor.o(($event) => showSongMenu(song, index), song.id || index)
          });
        }),
        o: common_vendor.p({
          name: "ellipsis-vertical",
          size: "18",
          color: "#999"
        })
      } : {}, {
        p: songList.value.length > 0
      }, songList.value.length > 0 ? common_vendor.e({
        q: isLoadingMore.value
      }, isLoadingMore.value ? {} : !hasMore.value ? {} : {}, {
        r: !hasMore.value
      }) : {}, {
        s: !isLoading.value && !loadError.value && songList.value.length === 0
      }, !isLoading.value && !loadError.value && songList.value.length === 0 ? {} : {}, {
        t: common_vendor.o(onScroll, "e5"),
        v: common_vendor.o(onTouchMove, "11"),
        w: showSourcePicker.value
      }, showSourcePicker.value ? {
        x: common_vendor.p({
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        y: common_vendor.o(($event) => showSourcePicker.value = false, "76"),
        z: common_vendor.f(sourceList, (source, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(source.name),
            b: currentSource.value === source.id
          }, currentSource.value === source.id ? {
            c: "9949ef41-5-" + i0,
            d: common_vendor.p({
              name: "check",
              size: "16",
              color: "#00d7cd"
            })
          } : {}, {
            e: source.id,
            f: currentSource.value === source.id ? 1 : "",
            g: common_vendor.o(($event) => selectSource(source.id), source.id)
          });
        }),
        A: common_vendor.o(() => {
        }, "b2"),
        B: common_vendor.o(($event) => showSourcePicker.value = false, "f7")
      } : {}, {
        C: showMenu.value
      }, showMenu.value ? {
        D: common_vendor.t((_a = selectedSong.value) == null ? void 0 : _a.name),
        E: common_vendor.t(formatArtists(selectedSong.value)),
        F: common_vendor.p({
          name: "play",
          size: "18",
          color: "#00d7cd"
        }),
        G: common_vendor.o(playSelectedSong, "76"),
        H: common_vendor.p({
          name: "forward",
          size: "18",
          color: "#00d7cd"
        }),
        I: common_vendor.o(addToNext, "98"),
        J: common_vendor.p({
          name: "plus",
          size: "18",
          color: "#00d7cd"
        }),
        K: common_vendor.o(addToPlaylist, "c5"),
        L: common_vendor.p({
          name: "heart",
          size: "18",
          color: "#ff6b6b"
        }),
        M: common_vendor.o(collectSong, "9c"),
        N: common_vendor.o(closeMenu, "50"),
        O: common_vendor.o(() => {
        }, "fc"),
        P: common_vendor.o(closeMenu, "4f")
      } : {}, {
        Q: showMiniPlayer.value
      }, showMiniPlayer.value ? {} : {}, {
        R: darkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9949ef41"]]);
wx.createPage(MiniProgramPage);
