"use strict";
const utils_index = require("../utils/index.js");
const utils_http = require("../utils/http.js");
const utils_crypto_index = require("../utils/crypto/index.js");
require("../common/vendor.js");
const { formatFileSize, formatTime } = utils_index.format;
const formatSingerName = (singerList) => {
  return singerList ? singerList.map((s) => s.name).join("、") : "";
};
const formatPlayTime = (time) => {
  if (!time)
    return "00:00";
  const minute = Math.floor(time / 60);
  const second = Math.floor(time % 60);
  return (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second);
};
const searchApi = {
  // 获取热搜关键词
  getHotKeywords(source = "all") {
    return utils_http.http.get("/api/search/hot", { source });
  },
  // 获取网易云热搜
  getWyHotSearch() {
    return utils_http.http.get("https://music.163.com/api/search/chart/detail", {
      id: "HOT_SEARCH_SONG#@#"
    });
  },
  // 获取QQ音乐热搜
  getTxHotSearch() {
    return utils_http.http.post("https://u.y.qq.com/cgi-bin/musicu.fcg", {
      comm: {
        ct: "19",
        cv: "1803",
        guid: "0",
        patch: "118",
        psrf_access_token_expiresAt: 0,
        psrf_qqaccess_token: "",
        psrf_qqopenid: "",
        psrf_qqunionid: "",
        tmeAppID: "qqmusic",
        tmeLoginType: 0,
        uin: "0",
        wid: "0"
      },
      hotkey: {
        method: "GetHotkeyForQQMusicPC",
        module: "tencent_musicsoso_hotkey.HotkeyService",
        param: {
          search_id: "",
          uin: 0
        }
      }
    }, {
      headers: {
        Referer: "https://y.qq.com/portal/player.html"
      }
    });
  },
  // 获取酷狗热搜
  getKgHotSearch() {
    const baseUrl = "http://mobilecdnbj.kugou.com";
    return utils_http.http.get(`${baseUrl}/api/v3/rank/song`, {
      version: "9108",
      ranktype: "2",
      plat: "0",
      pagesize: "20",
      area_code: "1",
      page: "1",
      volid: "35050",
      rankid: "6666",
      with_res_tag: "1"
    });
  },
  // 获取酷我热搜
  getKwHotSearch() {
    const baseUrl = "http://hotword.kuwo.cn";
    return utils_http.http.get(`${baseUrl}/hotword.s`, {
      prod: "kwplayer_ar_9.3.0.1",
      corp: "kuwo",
      newver: 2,
      vipver: "9.3.0.1",
      source: "kwplayer_ar_9.3.0.1_40.apk",
      p2p: 1,
      notrace: 0,
      uid: 0,
      plat: "kwplayer_ar",
      rformat: "json",
      encoding: "utf8",
      tabid: 1
    }, {
      headers: {
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9;)"
      }
    });
  },
  // 获取咪咕热搜
  getMgHotSearch() {
    const baseUrl = "http://jadeite.migu.cn:7090";
    return utils_http.http.get(`${baseUrl}/music_search/v3/search/hotword`);
  },
  // 搜索歌曲 - 酷我音乐
  searchKwSongs(keyword, page = 1, pageSize = 30) {
    const baseUrl = "http://search.kuwo.cn";
    return utils_http.http.get(`${baseUrl}/r.s`, {
      client: "kt",
      all: keyword,
      pn: page - 1,
      rn: pageSize,
      uid: "794762570",
      ver: "kwplayer_ar_9.2.2.1",
      vipver: "1",
      show_copyright_off: "1",
      newver: "1",
      ft: "music",
      cluster: "0",
      strategy: "2012",
      encoding: "utf8",
      rformat: "json",
      vermerge: "1",
      mobi: "1",
      issubtitle: "1"
    }).then((result) => {
      if (!result || !result.abslist)
        return { source: "kw", list: [] };
      const list = result.abslist.map((item) => {
        let quality = [];
        if (item.N_MINFO) {
          const infoArr = item.N_MINFO.split(";");
          const regExp = /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/;
          for (let info of infoArr) {
            const match = info.match(regExp);
            if (match) {
              const bitrate = match[2];
              switch (bitrate) {
                case "4000":
                  quality.push("flac24bit");
                  break;
                case "2000":
                  quality.push("flac");
                  break;
                case "320":
                  quality.push("320k");
                  break;
                case "128":
                  quality.push("128k");
                  break;
              }
            }
          }
        }
        return {
          id: item.MUSICRID.replace("MUSIC_", ""),
          musicrid: item.MUSICRID,
          name: item.SONGNAME,
          singer: item.ARTIST,
          album: { name: item.ALBUM || "未知专辑", picUrl: item.web_albumpic_small || "" },
          al: { picUrl: item.web_albumpic_small || "" },
          source: "kw",
          pic: item.web_albumpic_small || "",
          url: "",
          quality: quality.join(","),
          duration: item.DURATION * 1e3 || 0,
          artists: [{ name: item.ARTIST }]
        };
      });
      return {
        source: "kw",
        list,
        total: parseInt(result.TOTAL) || list.length,
        allPage: Math.ceil((parseInt(result.TOTAL) || list.length) / pageSize)
      };
    }).catch((err) => {
      console.error("酷我音乐搜索失败:", err);
      return { source: "kw", list: [] };
    });
  },
  // 搜索歌曲 - 酷狗音乐
  searchKgSongs(keyword, page = 1, pageSize = 30) {
    const baseUrl = "https://songsearch.kugou.com";
    return utils_http.http.get(`${baseUrl}/song_search_v2`, {
      keyword,
      page,
      pagesize: pageSize,
      userid: "0",
      clientver: "",
      platform: "WebFilter",
      filter: 2,
      iscorrection: 1,
      privilege_filter: 0,
      area_code: 1
    }).then((result) => {
      if (!result || !result.data || !result.data.lists)
        return { source: "kg", list: [] };
      const list = result.data.lists.map((item) => {
        const fileName = item.FileName || "";
        const parts = fileName.split(" - ");
        const singer = parts[0] || "";
        const name = parts[1] || fileName;
        let quality = "";
        if (item.SQFileSize && item.SQFileSize > 0) {
          quality = "SQ";
        } else if (item.HQFileSize && item.HQFileSize > 0) {
          quality = "HQ";
        }
        return {
          id: item.FileHash,
          name,
          singer,
          album: { name: item.AlbumName || "未知专辑", picUrl: "" },
          al: { picUrl: "" },
          source: "kg",
          pic: "",
          // 需要单独获取
          url: "",
          // 需要单独获取
          quality,
          duration: item.Duration * 1e3 || 0,
          artists: [{ name: singer }]
        };
      });
      return {
        source: "kg",
        list,
        total: result.data.total || list.length,
        allPage: Math.ceil((result.data.total || list.length) / pageSize)
      };
    }).catch((err) => {
      console.error("酷狗音乐搜索失败:", err);
      return { source: "kg", list: [] };
    });
  },
  // 搜索歌曲 - QQ音乐
  searchTxSongs(keyword, page = 1, pageSize = 30) {
    const baseUrl = "https://u.y.qq.com";
    return utils_http.http.post(`${baseUrl}/cgi-bin/musicu.fcg`, {
      comm: {
        ct: 11,
        cv: "1003006",
        v: "1003006",
        guid: "0",
        uin: "0"
      },
      req: {
        method: "DoSearchForQQMusicDesktop",
        module: "music.search.SearchCgiService",
        param: {
          query: keyword,
          page_num: page,
          num_per_page: pageSize,
          search_type: 0
          // 0: 歌曲, 2: 歌单
        }
      }
    }, {
      headers: {
        Referer: "https://y.qq.com/portal/player.html"
      }
    }).then((result) => {
      if (!result || !result.req || !result.req.data || !result.req.data.body || !result.req.data.body.song || !result.req.data.body.song.list) {
        return { source: "tx", list: [] };
      }
      const list = result.req.data.body.song.list.map((item) => {
        let quality = [];
        const file = item.file;
        if (file) {
          if (file.size_128mp3 > 0) {
            quality.push("128k");
          }
          if (file.size_320mp3 > 0) {
            quality.push("320k");
          }
          if (file.size_flac > 0) {
            quality.push("flac");
          }
          if (file.size_hires > 0) {
            quality.push("flac24bit");
          }
        }
        const singers = item.singer ? item.singer.map((s) => ({ name: s.name, id: s.mid })) : [];
        const singerName = singers.map((s) => s.name).join("/");
        return {
          id: item.mid,
          name: item.name,
          singer: singerName,
          album: { name: item.album ? item.album.name : "未知专辑", id: item.album ? item.album.mid : "", picUrl: item.album && item.album.mid ? `https://y.qq.com/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : "" },
          al: { picUrl: item.album && item.album.mid ? `https://y.qq.com/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : "" },
          source: "tx",
          pic: item.album && item.album.mid ? `https://y.qq.com/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : "",
          url: "",
          // 需要单独获取
          quality: quality.join(","),
          duration: item.interval * 1e3 || 0,
          artists: singers
        };
      });
      return {
        source: "tx",
        list,
        total: result.req.data.body.song.totalnum || list.length,
        allPage: Math.ceil((result.req.data.body.song.totalnum || list.length) / pageSize)
      };
    }).catch((err) => {
      console.error("QQ音乐搜索失败:", err);
      return { source: "tx", list: [] };
    });
  },
  // 搜索歌曲 - 网易云音乐
  searchWySongs(keyword, page = 1, pageSize = 30) {
    return utils_http.http.get("https://music.163.com/api/search/get", {
      s: keyword,
      type: "1",
      offset: (page - 1) * pageSize,
      limit: pageSize,
      csrf_token: ""
    }).then((result) => {
      if (!result || result.code !== 200) {
        console.error("网易云音乐搜索失败:", result);
        return { source: "wy", list: [] };
      }
      const rawList = result.result.songs || [];
      if (!rawList.length)
        return { source: "wy", list: [] };
      const list = rawList.map((item) => {
        const types = [];
        const _types = {};
        let size;
        if (item.privilege && item.privilege.maxBrLevel == "hires") {
          size = item.hr ? formatFileSize(item.hr.size) : null;
          types.push({ type: "flac24bit", size });
          _types.flac24bit = { size };
        }
        if (item.privilege) {
          switch (item.privilege.maxbr) {
            case 999e3:
              size = item.sq ? formatFileSize(item.sq.size) : null;
              types.push({ type: "flac", size });
              _types.flac = { size };
              break;
            case 32e4:
              size = item.h ? formatFileSize(item.h.size) : null;
              types.push({ type: "320k", size });
              _types["320k"] = { size };
              break;
            case 192e3:
            case 128e3:
              size = item.l ? formatFileSize(item.l.size) : null;
              types.push({ type: "128k", size });
              _types["128k"] = { size };
              break;
          }
        }
        types.reverse();
        const singerName = item.artists ? item.artists.map((singer) => singer.name).join("、") : "";
        return {
          id: item.id,
          name: item.name,
          singer: singerName,
          artists: item.artists ? item.artists.map((singer) => ({ id: singer.id, name: singer.name })) : [],
          album: {
            id: item.album ? item.album.id : null,
            name: item.album ? item.album.name : "未知专辑",
            picUrl: item.album ? item.album.picUrl : ""
          },
          al: {
            picUrl: item.album ? item.album.picUrl : ""
          },
          albumName: item.album ? item.album.name : "未知专辑",
          albumId: item.album ? item.album.id : null,
          source: "wy",
          interval: formatTime(item.duration / 1e3),
          duration: item.duration,
          songmid: item.id.toString(),
          img: item.album ? item.album.picUrl : "",
          lrc: null,
          types,
          _types,
          typeUrl: {},
          quality: types.length > 0 ? types[0].type : null
        };
      });
      return {
        list,
        allPage: Math.ceil((result.result.songCount || 0) / pageSize),
        limit: pageSize,
        total: result.result.songCount || 0,
        source: "wy"
      };
    }).catch((err) => {
      console.error("网易云音乐搜索失败:", err);
      return { source: "wy", list: [] };
    });
  },
  // 创建咪咕音乐搜索签名
  createMgSignature(time, str) {
    const deviceId = "963B7AA0D21511ED807EE5846EC87D20";
    const signatureMd5 = "6cdc72a439cef99a3418d2a78aa28c73";
    const sign = utils_crypto_index.md5(`${str}${signatureMd5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${time}`);
    return { sign, deviceId };
  },
  // 搜索歌曲 - 咪咕音乐
  searchMgSongs(keyword, page = 1, pageSize = 30) {
    const baseUrl = "https://jadeite.migu.cn";
    const time = Date.now().toString();
    const signData = this.createMgSignature(time, keyword);
    const searchUrl = `${baseUrl}/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D&pageSize=${pageSize}&text=${encodeURIComponent(keyword)}&pageNo=${page}&sort=0&sid=USS`;
    return utils_http.http.request({
      url: searchUrl,
      method: "GET",
      header: {
        "uiVersion": "A_music_3.6.1",
        "deviceId": signData.deviceId,
        "timestamp": time,
        "sign": signData.sign,
        "channel": "0146921",
        "User-Agent": "Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30"
      }
    }).then((result) => {
      if (!result || !result.songResultData || !result.songResultData.resultList)
        return { source: "mg", list: [] };
      const rawData = result.songResultData.resultList;
      const list = [];
      const ids = /* @__PURE__ */ new Set();
      rawData.forEach((item) => {
        item.forEach((data) => {
          if (!data.songId || !data.copyrightId || ids.has(data.copyrightId))
            return;
          ids.add(data.copyrightId);
          const types = [];
          const _types = {};
          data.audioFormats && data.audioFormats.forEach((type) => {
            let size;
            switch (type.formatType) {
              case "PQ":
                size = formatFileSize(type.asize ?? type.isize);
                types.push({ type: "128k", size });
                _types["128k"] = { size };
                break;
              case "HQ":
                size = formatFileSize(type.asize ?? type.isize);
                types.push({ type: "320k", size });
                _types["320k"] = { size };
                break;
              case "SQ":
                size = formatFileSize(type.asize ?? type.isize);
                types.push({ type: "flac", size });
                _types.flac = { size };
                break;
              case "ZQ24":
                size = formatFileSize(type.asize ?? type.isize);
                types.push({ type: "flac24bit", size });
                _types.flac24bit = { size };
                break;
            }
          });
          let img = data.img3 || data.img2 || data.img1 || null;
          if (img && !/https?:/.test(img))
            img = "http://d.musicapp.migu.cn" + img;
          list.push({
            singer: formatSingerName(data.singerList),
            name: data.name,
            albumName: data.album,
            albumId: data.albumId,
            songmid: data.songId,
            copyrightId: data.copyrightId,
            source: "mg",
            interval: formatPlayTime(data.duration),
            img,
            lrc: null,
            lrcUrl: data.lrcUrl,
            mrcUrl: data.mrcurl,
            trcUrl: data.trcUrl,
            types,
            _types,
            typeUrl: {},
            // 添加uni-app项目需要的额外字段
            id: data.copyrightId,
            album: { name: data.album || "未知专辑", picUrl: img },
            al: { picUrl: img },
            duration: data.duration * 1e3 || 0,
            artists: data.singerList ? data.singerList.map((s) => ({ name: s.name, id: s.id })) : [],
            quality: types.length > 0 ? types[0].type : null
          });
        });
      });
      return {
        source: "mg",
        list,
        total: result.songResultData.totalCount || list.length,
        allPage: Math.ceil((result.songResultData.totalCount || list.length) / pageSize)
      };
    }).catch((err) => {
      console.error("咪咕音乐搜索失败:", err);
      return { source: "mg", list: [] };
    });
  },
  // 搜索歌曲（统一接口）
  searchSongs(keyword, source = "all", page = 1, pageSize = 30) {
    switch (source) {
      case "kw":
        return this.searchKwSongs(keyword, page, pageSize);
      case "kg":
        return this.searchKgSongs(keyword, page, pageSize);
      case "tx":
        return this.searchTxSongs(keyword, page, pageSize);
      case "wy":
        return this.searchWySongs(keyword, page, pageSize);
      case "mg":
        return this.searchMgSongs(keyword, page, pageSize);
      case "all":
      default:
        return Promise.all([
          this.searchKwSongs(keyword, page, pageSize).catch(() => ({ source: "kw", list: [] })),
          this.searchKgSongs(keyword, page, pageSize).catch(() => ({ source: "kg", list: [] })),
          this.searchTxSongs(keyword, page, pageSize).catch(() => ({ source: "tx", list: [] })),
          this.searchWySongs(keyword, page, pageSize).catch(() => ({ source: "wy", list: [] })),
          this.searchMgSongs(keyword, page, pageSize).catch(() => ({ source: "mg", list: [] }))
        ]).then((results) => {
          let allList = [];
          let total = 0;
          let allPage = 1;
          for (const result of results) {
            if (result && result.list && result.list.length > 0) {
              allList = [...allList, ...result.list];
              total += result.total || 0;
              allPage = Math.max(allPage, result.allPage || 1);
            }
          }
          return {
            source: "all",
            list: allList,
            total,
            allPage
          };
        });
    }
  },
  // 网易云音乐歌单搜索
  searchWyPlaylists(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://music.163.com";
    return utils_http.http.get(`${baseUrl}/api/search/get`, {
      s: keyword,
      type: "1000",
      // 1000: 歌单
      offset: String((page - 1) * pageSize),
      limit: String(pageSize),
      csrf_token: ""
    }, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://music.163.com/"
      }
    }).then((result) => {
      if (!result || !result.result || !result.result.playlists)
        return { source: "wy", list: [] };
      const list = result.result.playlists.map((item) => {
        return {
          id: item.id,
          name: item.name,
          coverImgUrl: item.coverImgUrl,
          playCount: item.playCount,
          trackCount: item.trackCount,
          creator: item.creator ? item.creator.nickname : "",
          description: item.description,
          source: "wy"
        };
      });
      return {
        list,
        total: result.result.playlistCount || list.length,
        allPage: Math.ceil((result.result.playlistCount || list.length) / pageSize),
        source: "wy"
      };
    }).catch((err) => {
      console.error("网易云音乐歌单搜索失败:", err);
      return { source: "wy", list: [] };
    });
  },
  // QQ音乐歌单搜索
  searchTxPlaylists(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://u.y.qq.com";
    const url = `${baseUrl}/cgi-bin/musicu.fcg`;
    const params = {
      comm: {
        ct: 11,
        cv: "1003006",
        v: "1003006",
        guid: "0",
        uin: "0"
      },
      req: {
        method: "DoSearchForQQMusicDesktop",
        module: "music.search.SearchCgiService",
        param: {
          query: keyword,
          page_num: page,
          num_per_page: pageSize,
          search_type: 3
          // 0: 歌曲, 2: 专辑, 3: 歌单
        }
      }
    };
    console.log("[searchTxPlaylists] 请求URL:", url);
    console.log("[searchTxPlaylists] 请求参数:", params);
    return utils_http.http.post(url, params, {
      headers: {
        Referer: "https://y.qq.com/portal/player.html"
      }
    }).then((result) => {
      console.log("[searchTxPlaylists] 响应结果:", result);
      if (!result || !result.req || !result.req.data || !result.req.data.body || !result.req.data.body.songlist || !result.req.data.body.songlist.list) {
        console.error("[searchTxPlaylists] 响应数据格式错误:", result);
        return { source: "tx", list: [] };
      }
      const list = result.req.data.body.songlist.list.map((item) => {
        return {
          id: String(item.dissid),
          name: item.dissname,
          coverImgUrl: item.imgurl,
          playCount: item.listennum,
          trackCount: item.song_count || 0,
          creator: item.creator ? item.creator.name : "",
          time: item.createtime || null,
          description: item.desc || "",
          source: "tx"
        };
      });
      console.log("[searchTxPlaylists] 解析后列表数量:", list.length);
      return {
        list,
        total: result.req.data.body.songlist.totalnum || list.length,
        allPage: Math.ceil((result.req.data.body.songlist.totalnum || list.length) / pageSize),
        source: "tx"
      };
    }).catch((err) => {
      console.error("QQ音乐歌单搜索失败:", err);
      return { source: "tx", list: [] };
    });
  },
  // 酷狗音乐歌单搜索
  searchKgPlaylists(keyword, page = 1, pageSize = 20) {
    const baseUrl = "http://msearchretry.kugou.com";
    return utils_http.http.get(`${baseUrl}/api/v3/search/special`, {
      keyword,
      page,
      pagesize: pageSize,
      showtype: 10,
      filter: 0,
      version: 7910,
      sver: 2
    }).then((result) => {
      if (!result || !result.data || !result.data.info) {
        return { source: "kg", list: [] };
      }
      const list = result.data.info.map((item) => {
        return {
          id: item.specialid,
          name: item.specialname,
          coverImgUrl: item.imgurl,
          playCount: item.playcount || 0,
          trackCount: item.songcount || 0,
          creator: item.nickname || "",
          time: item.publishtime || item.publish_time || null,
          description: item.intro || "",
          source: "kg"
        };
      });
      return {
        list,
        total: result.data.total || list.length,
        allPage: Math.ceil((result.data.total || list.length) / pageSize),
        source: "kg"
      };
    }).catch((err) => {
      console.error("酷狗音乐歌单搜索失败:", err);
      return { source: "kg", list: [] };
    });
  },
  // 酷我音乐歌单搜索
  searchKwPlaylists(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://search.kuwo.cn";
    const url = `${baseUrl}/r.s`;
    const params = {
      all: keyword,
      pn: page - 1,
      rn: pageSize,
      rformat: "json",
      encoding: "utf8",
      ver: "mbox",
      vipver: "MUSIC_8.7.7.0_BCS37",
      plat: "pc",
      devid: "28156413",
      ft: "playlist",
      pay: 0,
      needliveshow: 0
    };
    console.log("[searchKwPlaylists] 请求URL:", url);
    console.log("[searchKwPlaylists] 请求参数:", params);
    return utils_http.http.get(url, params).then((result) => {
      console.log("[searchKwPlaylists] 响应结果类型:", typeof result);
      console.log("[searchKwPlaylists] 响应结果:", result);
      let parsedResult = result;
      if (typeof result === "string") {
        try {
          const doubleQuoteJson = result.replace(/'/g, '"');
          parsedResult = JSON.parse(doubleQuoteJson);
          console.log("[searchKwPlaylists] JSON解析成功");
        } catch (e) {
          console.error("[searchKwPlaylists] JSON解析失败:", e);
          return { source: "kw", list: [] };
        }
      }
      if (!parsedResult || !parsedResult.abslist) {
        console.error("[searchKwPlaylists] 响应数据格式错误:", parsedResult);
        return { source: "kw", list: [] };
      }
      const list = parsedResult.abslist.map((item) => {
        return {
          id: String(item.playlistid),
          name: item.name,
          coverImgUrl: item.pic,
          playCount: item.playcnt || 0,
          trackCount: item.songnum || 0,
          creator: item.nickname || "",
          description: item.intro || "",
          source: "kw"
        };
      });
      console.log("[searchKwPlaylists] 解析后列表数量:", list.length);
      return {
        list,
        total: parsedResult.total || list.length,
        allPage: Math.ceil((parsedResult.total || list.length) / pageSize),
        source: "kw"
      };
    }).catch((err) => {
      console.error("酷我音乐歌单搜索失败:", err);
      return { source: "kw", list: [] };
    });
  },
  // 咪咕音乐歌单搜索
  searchMgPlaylists(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://app.c.nf.migu.cn";
    const searchSwitch = encodeURIComponent('{"song":0,"album":0,"singer":0,"tagSong":0,"mvSong":0,"songlist":1,"bestShow":0}');
    return utils_http.http.get(`${baseUrl}/MIGUM2.0/v1.0/content/search_all.do`, {
      isCopyright: 1,
      isCorrect: 1,
      pageNo: page,
      pageSize,
      searchSwitch,
      sort: 0,
      text: keyword
    }, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
      }
    }).then((result) => {
      console.log("[searchMgPlaylists] 响应结果:", result);
      if (!result || result.code !== "000000") {
        console.error("[searchMgPlaylists] API返回错误状态码:", result == null ? void 0 : result.code);
        return { source: "mg", list: [] };
      }
      if (!result.songListResultData || !result.songListResultData.result) {
        console.error("[searchMgPlaylists] 响应数据格式错误:", result);
        return { source: "mg", list: [] };
      }
      const list = result.songListResultData.result.map((item) => {
        return {
          id: item.id,
          name: item.name,
          coverImgUrl: item.musicListPicUrl,
          playCount: parseInt(item.playNum) || 0,
          trackCount: parseInt(item.musicNum) || 0,
          creator: "",
          description: "",
          source: "mg"
        };
      });
      console.log("[searchMgPlaylists] 解析后列表数量:", list.length);
      return {
        list,
        total: parseInt(result.songListResultData.totalCount) || list.length,
        allPage: Math.ceil((parseInt(result.songListResultData.totalCount) || list.length) / pageSize),
        source: "mg"
      };
    }).catch((err) => {
      console.error("咪咕音乐歌单搜索失败:", err);
      return { source: "mg", list: [] };
    });
  },
  // 搜索歌单（支持多平台）
  searchPlaylists(keyword, source = "all", page = 1, pageSize = 20) {
    switch (source) {
      case "wy":
        return this.searchWyPlaylists(keyword, page, pageSize);
      case "tx":
        return this.searchTxPlaylists(keyword, page, pageSize);
      case "kg":
        return this.searchKgPlaylists(keyword, page, pageSize);
      case "kw":
        return this.searchKwPlaylists(keyword, page, pageSize);
      case "mg":
        return this.searchMgPlaylists(keyword, page, pageSize);
      case "all":
      default:
        const perPlatformSize = 5;
        console.log("[searchPlaylists] 开始聚合搜索，关键词:", keyword, "每平台数量:", perPlatformSize);
        return Promise.all([
          this.searchWyPlaylists(keyword, page, perPlatformSize).catch((err) => {
            console.error("[searchPlaylists] 网易云搜索失败:", err);
            return { source: "wy", list: [] };
          }),
          this.searchTxPlaylists(keyword, page, perPlatformSize).catch((err) => {
            console.error("[searchPlaylists] QQ音乐搜索失败:", err);
            return { source: "tx", list: [] };
          }),
          this.searchKgPlaylists(keyword, page, perPlatformSize).catch((err) => {
            console.error("[searchPlaylists] 酷狗搜索失败:", err);
            return { source: "kg", list: [] };
          }),
          this.searchKwPlaylists(keyword, page, perPlatformSize).catch((err) => {
            console.error("[searchPlaylists] 酷我搜索失败:", err);
            return { source: "kw", list: [] };
          }),
          this.searchMgPlaylists(keyword, page, perPlatformSize).catch((err) => {
            console.error("[searchPlaylists] 咪咕搜索失败:", err);
            return { source: "mg", list: [] };
          })
        ]).then((results) => {
          var _a;
          console.log("[searchPlaylists] 各平台搜索结果:", results.map((r) => {
            var _a2;
            return { source: r.source, count: ((_a2 = r.list) == null ? void 0 : _a2.length) || 0 };
          }));
          let allList = [];
          let total = 0;
          let allPage = 1;
          for (const result of results) {
            console.log(`[searchPlaylists] 处理 ${result.source} 平台结果，数量:`, ((_a = result.list) == null ? void 0 : _a.length) || 0);
            if (result && result.list && result.list.length > 0) {
              allList = [...allList, ...result.list];
              total += result.total || 0;
              allPage = Math.max(allPage, result.allPage || 1);
            }
          }
          console.log("[searchPlaylists] 合并后总数量:", allList.length);
          allList.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
          console.log("[searchPlaylists] 排序后前5条:", allList.slice(0, 5).map((item) => ({ name: item.name, source: item.source, playCount: item.playCount })));
          return {
            source: "all",
            list: allList,
            total,
            allPage
          };
        });
    }
  },
  // 网易云音乐专辑搜索
  searchWyAlbums(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://music.163.com";
    return utils_http.http.get(`${baseUrl}/api/search/get`, {
      s: keyword,
      type: 10,
      // 10: 专辑
      offset: (page - 1) * pageSize,
      limit: pageSize
    }).then((result) => {
      if (!result || result.code !== 200 || !result.result || !result.result.albums) {
        return { source: "wy", list: [], total: 0 };
      }
      const list = result.result.albums.map((item) => {
        return {
          id: item.id,
          name: item.name,
          artist: item.artist ? item.artist.name : "",
          artistId: item.artist ? item.artist.id : "",
          picUrl: item.picUrl,
          blurPicUrl: item.blurPicUrl,
          publishTime: item.publishTime,
          size: item.size,
          description: item.description,
          source: "wy"
        };
      });
      return {
        source: "wy",
        list,
        total: result.result.albumCount || 0
      };
    });
  },
  // 搜索专辑（统一接口）
  searchAlbums(keyword, source = "all", page = 1, pageSize = 20) {
    switch (source) {
      case "wy":
        return this.searchWyAlbums(keyword, page, pageSize);
      case "tx":
        return this.searchTxAlbums(keyword, page, pageSize);
      case "kg":
        return this.searchKgAlbums(keyword, page, pageSize);
      case "kw":
        return this.searchKwAlbums(keyword, page, pageSize);
      case "mg":
        return this.searchMgAlbums(keyword, page, pageSize);
      case "all":
      default:
        return Promise.all([
          this.searchWyAlbums(keyword, page, pageSize).catch(() => ({ source: "wy", list: [], total: 0 })),
          this.searchTxAlbums(keyword, page, pageSize).catch(() => ({ source: "tx", list: [], total: 0 })),
          this.searchKgAlbums(keyword, page, pageSize).catch(() => ({ source: "kg", list: [], total: 0 })),
          this.searchKwAlbums(keyword, page, pageSize).catch(() => ({ source: "kw", list: [], total: 0 })),
          this.searchMgAlbums(keyword, page, pageSize).catch(() => ({ source: "mg", list: [], total: 0 }))
        ]).then((results) => {
          let allList = [];
          let total = 0;
          for (const result of results) {
            if (result && result.list && result.list.length > 0) {
              allList = [...allList, ...result.list];
              total += result.total || 0;
            }
          }
          return {
            source: "all",
            list: allList,
            total
          };
        });
    }
  },
  // QQ音乐专辑搜索
  searchTxAlbums(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://u.y.qq.com";
    return utils_http.http.post(`${baseUrl}/cgi-bin/musicu.fcg`, {
      comm: {
        ct: 11,
        cv: "1003006",
        v: "1003006",
        guid: "0",
        uin: "0"
      },
      album: {
        method: "SearchAlbumMobile",
        module: "music.album.AlbumSearchCgiService",
        param: {
          query: keyword,
          page_num: page,
          num_per_page: pageSize,
          search_type: 10
        }
      }
    }, {
      headers: {
        Referer: "https://y.qq.com/portal/player.html"
      }
    }).then((result) => {
      if (!result || result.album.code !== 0 || !result.album.data || !result.album.data.list) {
        return { source: "tx", list: [], total: 0 };
      }
      const list = result.album.data.list.map((item) => {
        return {
          id: item.albumId,
          name: item.albumName,
          artist: item.singerName || "",
          artistId: item.singerId || "",
          picUrl: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albumMID}.jpg`,
          publishTime: item.publicTime,
          size: item.totalSongNum,
          description: "",
          source: "tx"
        };
      });
      return {
        source: "tx",
        list,
        total: result.album.data.total || 0
      };
    });
  },
  // 酷狗专辑搜索
  searchKgAlbums(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://songsearch.kugou.com";
    return utils_http.http.get(`${baseUrl}/album_search_v2`, {
      keyword,
      page,
      pagesize: pageSize,
      showtype: 1
    }, {
      headers: {
        Referer: "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      }
    }).then((result) => {
      if (!result || result.status !== 1 || !result.data || !result.data.lists) {
        return { source: "kg", list: [], total: 0 };
      }
      const list = result.data.lists.map((item) => {
        return {
          id: item.albumId,
          name: item.albumName,
          artist: item.artistName || "",
          artistId: "",
          picUrl: item.imgUrl || "",
          publishTime: item.publishTime || "",
          size: item.songCount || 0,
          description: item.description || "",
          source: "kg"
        };
      });
      return {
        source: "kg",
        list,
        total: result.data.total || 0
      };
    });
  },
  // 酷我专辑搜索
  searchKwAlbums(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://search.kuwo.cn";
    return utils_http.http.get(`${baseUrl}/search_album`, {
      key: keyword,
      pn: page,
      rn: pageSize
    }, {
      headers: {
        Referer: "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      }
    }).then((result) => {
      if (!result || !result.albumlist) {
        return { source: "kw", list: [], total: 0 };
      }
      const list = result.albumlist.map((item) => {
        return {
          id: item.albumid,
          name: item.albumname,
          artist: item.artistname || "",
          artistId: item.artistid || "",
          picUrl: item.img || "",
          publishTime: item.publishtime || "",
          size: item.songnum || 0,
          description: item.info || "",
          source: "kw"
        };
      });
      return {
        source: "kw",
        list,
        total: result.RES_NUM || 0
      };
    });
  },
  // 咪咕专辑搜索
  searchMgAlbums(keyword, page = 1, pageSize = 20) {
    const baseUrl = "https://migu.cn";
    return utils_http.http.get(`${baseUrl}/music_search/v3/search/searchAll`, {
      isCorrect: 1,
      isCopyright: 1,
      searchSwitch: '{"song":0,"album":1,"singer":0,"tagSong":0,"mvSong":0,"bestShow":0,"songlist":0,"lyricSong":0}',
      pageSize,
      text: keyword,
      pageNo: page,
      sort: 0
    }, {
      headers: {
        Referer: "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      }
    }).then((result) => {
      if (!result || result.code !== "000000" || !result.data || !result.data.album) {
        return { source: "mg", list: [], total: 0 };
      }
      const albumList = result.data.album || [];
      const list = albumList.map((item) => {
        return {
          id: item.id,
          name: item.name,
          artist: item.singerName || "",
          artistId: item.singerId || "",
          picUrl: item.imgItems && item.imgItems[0] ? item.imgItems[0].img : "",
          publishTime: item.publishTime || "",
          size: item.totalCount || 0,
          description: item.description || "",
          source: "mg"
        };
      });
      return {
        source: "mg",
        list,
        total: result.data.total || 0
      };
    });
  },
  // 获取搜索建议
  getSuggestions(keyword) {
    const baseUrl = "https://music.163.com";
    return utils_http.http.post(`${baseUrl}/weapi/search/suggest/web`, {
      s: keyword
    }, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
      },
      isNetease: true
    }).then((result) => {
      if (!result || !result.result || !result.result.songs)
        return [];
      return result.result.songs.map((item) => item.name);
    }).catch((err) => {
      console.error("获取搜索建议失败:", err);
      return [];
    });
  }
};
exports.searchApi = searchApi;
