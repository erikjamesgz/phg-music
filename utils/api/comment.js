"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_crypto_wy = require("../crypto/wy.js");
const utils_crypto_kg = require("../crypto/kg.js");
const emojis = [
  ["大笑", "😃"],
  ["可爱", "😊"],
  ["憨笑", "☺️"],
  ["色", "😍"],
  ["亲亲", "😙"],
  ["惊恐", "😱"],
  ["流泪", "😭"],
  ["亲", "😚"],
  ["呆", "😳"],
  ["哀伤", "😔"],
  ["呲牙", "😁"],
  ["吐舌", "😝"],
  ["撇嘴", "😒"],
  ["怒", "😡"],
  ["奸笑", "😏"],
  ["汗", "😓"],
  ["痛苦", "😖"],
  ["惶恐", "😰"],
  ["生病", "😨"],
  ["口罩", "😷"],
  ["大哭", "😂"],
  ["晕", "😵"],
  ["发怒", "👿"],
  ["开心", "😄"],
  ["鬼脸", "😜"],
  ["皱眉", "😞"],
  ["流感", "😢"],
  ["爱心", "❤️"],
  ["心碎", "💔"],
  ["钟情", "💘"],
  ["星星", "⭐️"],
  ["生气", "💢"],
  ["便便", "💩"],
  ["强", "👍"],
  ["弱", "👎"],
  ["拜", "🙏"],
  ["牵手", "👫"],
  ["跳舞", "👯‍♀️"],
  ["禁止", "🙅‍♀️"],
  ["这边", "💁‍♀️"],
  ["爱意", "💏"],
  ["示爱", "👩‍❤️‍👨"],
  ["嘴唇", "👄"],
  ["狗", "🐶"],
  ["猫", "🐱"],
  ["猪", "🐷"],
  ["兔子", "🐰"],
  ["小鸡", "🐤"],
  ["公鸡", "🐔"],
  ["幽灵", "👻"],
  ["圣诞", "🎅"],
  ["外星", "👽"],
  ["钻石", "💎"],
  ["礼物", "🎁"],
  ["男孩", "👦"],
  ["女孩", "👧"],
  ["蛋糕", "🎂"],
  ["18", "🔞"],
  ["圈", "⭕"],
  ["叉", "❌"]
];
const applyEmoji = (text) => {
  for (const e of emojis) {
    text = text.replaceAll(`[${e[0]}]`, e[1]);
  }
  return text;
};
const formatTime = (timestamp) => {
  if (!timestamp)
    return "";
  const now = Date.now();
  const diff = now - timestamp;
  const oneDay = 24 * 60 * 60 * 1e3;
  if (diff < oneDay && diff > 0) {
    const hours = Math.floor(diff / (60 * 60 * 1e3));
    if (hours > 0) {
      return `${hours}小时前`;
    }
    const minutes = Math.floor(diff / (60 * 1e3));
    if (minutes > 0) {
      return `${minutes}分钟前`;
    }
    return "刚刚";
  }
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
};
const formatTimeTx = (time) => {
  if (!time)
    return null;
  return String(time).length < 10 ? null : parseInt(time + "000");
};
const filterWyComment = (rawList) => {
  return rawList.map((item) => {
    var _a, _b;
    let data = {
      id: item.commentId,
      text: item.content ? applyEmoji(item.content) : "",
      time: item.time ? item.time : "",
      timeStr: item.time ? formatTime(item.time) : "",
      location: ((_a = item.ipLocation) == null ? void 0 : _a.location) || "",
      userName: item.user.nickname,
      avatar: item.user.avatarUrl,
      userId: item.user.userId,
      likedCount: item.likedCount,
      reply: []
    };
    let replyData = item.beReplied && item.beReplied[0];
    if (replyData) {
      data.reply = [{
        id: replyData.beRepliedCommentId,
        text: replyData.content ? applyEmoji(replyData.content) : "",
        time: "",
        timeStr: "",
        location: ((_b = replyData.ipLocation) == null ? void 0 : _b.location) || "",
        userName: replyData.user.nickname,
        avatar: replyData.user.avatarUrl,
        userId: replyData.user.userId,
        likedCount: null
      }];
    }
    return data;
  });
};
const filterTxComment = (rawList, isHot = false) => {
  const txEmojis = {
    e400846: "😘",
    e400874: "😴",
    e400825: "😃",
    e400847: "😙",
    e400835: "😍",
    e400873: "😳",
    e400836: "😎",
    e400867: "😭",
    e400832: "😊",
    e400837: "😏",
    e400875: "😫",
    e400831: "😉",
    e400855: "😡",
    e400823: "😄",
    e400862: "😨",
    e400844: "😖",
    e400841: "😓",
    e400830: "😈",
    e400828: "😆",
    e400833: "😋",
    e400822: "😀",
    e400843: "😕",
    e400829: "😇",
    e400824: "😂",
    e400834: "😌",
    e400877: "😷",
    e400132: "🍉",
    e400181: "🍺",
    e401067: "☕️",
    e400186: "🥧",
    e400343: "🐷",
    e400116: "🌹",
    e400126: "🍃",
    e400613: "💋",
    e401236: "❤️",
    e400622: "💔",
    e400637: "💣",
    e400643: "💩",
    e400773: "🔪",
    e400102: "🌛",
    e401328: "🌞",
    e400420: "👏",
    e400914: "🙌",
    e400408: "👍",
    e400414: "👎",
    e401121: "✋",
    e400396: "👋",
    e400384: "👉",
    e401115: "✊",
    e400402: "👌",
    e400905: "🙈",
    e400906: "🙉",
    e400907: "🙊",
    e400562: "👻",
    e400932: "🙏",
    e400644: "💪",
    e400611: "💉",
    e400185: "🎁",
    e400655: "💰",
    e400325: "🐥",
    e400612: "💊",
    e400198: "🎉",
    e401685: "⚡️",
    e400631: "💝",
    e400768: "🔥",
    e400432: "👑"
  };
  const replaceTxEmoji = (msg) => {
    let rxp = /^\[em\](e\d+)\[\/em\]$/;
    let result = msg.match(/\[em\]e\d+\[\/em\]/g);
    if (!result)
      return msg;
    result = Array.from(new Set(result));
    for (const item of result) {
      let code = item.replace(rxp, "$1");
      msg = msg.replace(new RegExp(item.replace("[em]", "\\[em\\]").replace("[/em]", "\\[\\/em\\]"), "g"), txEmojis[code] || "");
    }
    return msg;
  };
  const cleanUserName = (name) => {
    if (!name)
      return "";
    return name.replace(/^@/, "");
  };
  return rawList.map((item) => {
    let time = isHot ? item.PubTime ? formatTimeTx(item.PubTime) : null : item.time ? formatTimeTx(item.time) : null;
    let timeStr = time ? formatTime(time) : null;
    let content = isHot ? item.Content : item.rootcommentcontent;
    let nick = isHot ? item.Nick : item.rootcommentnick;
    return {
      id: isHot ? `${item.SeqNo}_${item.CmId}` : `${item.rootcommentid}_${item.commentid}`,
      rootId: isHot ? item.SeqNo : item.rootcommentid,
      text: content ? replaceTxEmoji(content).replace(/\\n/g, "\n") : "",
      time: (isHot ? item.rootcommentid == item.commentid : item.rootcommentid == item.commentid) ? time : null,
      timeStr: (isHot ? item.rootcommentid == item.commentid : item.rootcommentid == item.commentid) ? timeStr : null,
      userName: cleanUserName(nick),
      avatar: item.avatarurl || item.Avatar || "",
      userId: isHot ? item.EncryptUin : item.encrypt_rootcommentuin,
      likedCount: item.praisenum || item.PraiseNum || 0,
      images: item.Pic ? [item.Pic] : [],
      location: item.Location || ""
    };
  });
};
const filterKgComment = (rawList) => {
  return rawList.map((item) => {
    var _a;
    let data = {
      id: item.id,
      text: item.content || "",
      images: item.images ? item.images.map((i) => i.url) : [],
      location: item.location || "",
      time: item.addtime,
      timeStr: formatTime(new Date(item.addtime).getTime()),
      userName: item.user_name,
      avatar: item.user_pic,
      userId: item.user_id,
      likedCount: ((_a = item.like) == null ? void 0 : _a.likenum) || 0,
      replyNum: item.reply_num || 0,
      reply: []
    };
    if (item.pcontent) {
      data.reply = [{
        id: `reply_${item.id}`,
        text: item.pcontent,
        time: null,
        timeStr: "",
        userName: item.puser,
        avatar: "",
        userId: item.puser_id,
        likedCount: null,
        replyNum: null,
        location: ""
      }];
    }
    return data;
  });
};
const filterKwComment = (rawList) => {
  if (!rawList)
    return [];
  return rawList.map((item) => {
    return {
      id: item.id,
      text: item.msg,
      time: item.time,
      timeStr: formatTime(Number(item.time) * 1e3),
      userName: item.u_name,
      avatar: item.u_pic,
      userId: item.u_id,
      likedCount: item.like_num,
      location: "",
      images: item.mpic ? [decodeURIComponent(item.mpic)] : [],
      reply: item.child_comments ? item.child_comments.map((i) => {
        return {
          id: i.id,
          text: i.msg,
          time: i.time,
          timeStr: formatTime(Number(i.time) * 1e3),
          userName: i.u_name,
          avatar: i.u_pic,
          userId: i.u_id,
          likedCount: i.like_num,
          location: "",
          images: i.mpic ? [i.mpic] : []
        };
      }) : []
    };
  });
};
const filterMgComment = (rawList) => {
  if (!rawList)
    return [];
  return rawList.map((item) => ({
    id: item.commentId,
    text: item.commentInfo,
    time: item.commentTime,
    timeStr: formatTime(new Date(item.commentTime).getTime()),
    userName: item.user.nickName,
    avatar: item.user.middleIcon || item.user.bigIcon || item.user.smallIcon,
    userId: item.user.userId,
    likedCount: item.opNumItem.thumbNum,
    replyNum: item.replyTotalCount,
    location: "",
    reply: item.replyComments && item.replyComments.length > 0 ? item.replyComments.map((c) => ({
      id: c.replyId,
      text: c.replyInfo,
      time: c.replyTime,
      timeStr: formatTime(new Date(c.replyTime).getTime()),
      userName: c.user.nickName,
      avatar: c.user.middleIcon || c.user.bigIcon || c.user.smallIcon,
      userId: c.user.userId,
      likedCount: null,
      replyNum: null,
      location: ""
    })) : []
  }));
};
const getWyComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getWyComment] 获取网易云音乐评论:", musicInfo);
  const id = "R_SO_4_" + musicInfo.songmid;
  const params = utils_crypto_wy.weapi({
    cursor: Date.now(),
    offset: (page - 1) * limit,
    orderType: 1,
    pageNo: page,
    pageSize: limit,
    rid: id,
    threadId: id
  });
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: "https://music.163.com/weapi/comment/resource/comments/get",
      method: "POST",
      header: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
        "origin": "https://music.163.com",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: `params=${encodeURIComponent(params.params)}&encSecKey=${params.encSecKey}`,
      success: (res) => {
        var _a, _b;
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 200) {
            reject(new Error(data.message || "获取评论失败"));
            return;
          }
          const total = ((_a = data.data) == null ? void 0 : _a.totalCount) || data.total || 0;
          const comments = filterWyComment(((_b = data.data) == null ? void 0 : _b.comments) || data.comments || []);
          console.log("[getWyComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "wy",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getWyComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getWyHotComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getWyHotComment] 获取网易云音乐热门评论:", musicInfo);
  const id = "R_SO_4_" + musicInfo.songmid;
  const params = utils_crypto_wy.weapi({
    rid: id,
    limit,
    offset: limit * (page - 1),
    beforeTime: Date.now().toString()
  });
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: "https://music.163.com/weapi/v1/resource/hotcomments/" + id,
      method: "POST",
      header: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
        "origin": "https://music.163.com",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: `params=${encodeURIComponent(params.params)}&encSecKey=${params.encSecKey}`,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 200) {
            reject(new Error(data.message || "获取评论失败"));
            return;
          }
          const total = data.total || 0;
          const comments = filterWyComment(data.hotComments || []);
          console.log("[getWyHotComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "wy",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getWyHotComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getTxMusicInfo = async (songmid) => {
  console.log("[getTxMusicInfo] 获取QQ音乐歌曲信息:", songmid);
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: "https://u.y.qq.com/cgi-bin/musicu.fcg",
      method: "POST",
      header: {
        "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)",
        "Content-Type": "application/json"
      },
      data: {
        comm: {
          ct: "19",
          cv: "1859",
          uin: "0"
        },
        req: {
          module: "music.pf_song_detail_svr",
          method: "get_song_detail_yqq",
          param: {
            song_type: 0,
            song_mid: songmid
          }
        }
      },
      success: (res) => {
        var _a;
        console.log("[getTxMusicInfo] 响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 0 || data.req.code !== 0) {
            reject(new Error("获取歌曲信息失败"));
            return;
          }
          const item = data.req.data.track_info;
          resolve({
            songId: item.id,
            songmid: item.mid,
            name: item.title,
            singer: ((_a = item.singer) == null ? void 0 : _a.map((s) => s.name).join("、")) || ""
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getTxMusicInfo] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getTxComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getTxComment] 获取QQ音乐评论:", musicInfo);
  try {
    let songId = musicInfo.id;
    if (!songId || isNaN(Number(songId))) {
      console.log("[getTxComment] id不存在或非数字，调用getTxMusicInfo获取");
      const songInfo = await getTxMusicInfo(musicInfo.songmid);
      songId = songInfo.songId;
    }
    console.log("[getTxComment] 使用songId:", songId);
    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: "http://c.y.qq.com/base/fcgi-bin/fcg_global_comment_h5.fcg",
        method: "POST",
        header: {
          "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)",
          "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: `uin=0&format=json&cid=205360772&reqtype=2&biztype=1&topid=${songId}&cmd=8&needmusiccrit=1&pagenum=${page - 1}&pagesize=${limit}`,
        success: (res) => {
          var _a, _b;
          if (res.statusCode === 200 && res.data) {
            const data = res.data;
            if (data.code !== 0) {
              reject(new Error(data.msg || "获取评论失败"));
              return;
            }
            const total = ((_a = data.comment) == null ? void 0 : _a.commenttotal) || 0;
            const comments = filterTxComment(((_b = data.comment) == null ? void 0 : _b.commentlist) || [], false);
            console.log("[getTxComment] 评论总数:", total, "获取:", comments.length);
            resolve({
              source: "tx",
              comments,
              total,
              page,
              limit,
              maxPage: Math.ceil(total / limit) || 1
            });
          } else {
            reject(new Error("请求失败"));
          }
        },
        fail: (err) => {
          console.error("[getTxComment] 请求失败:", err);
          reject(new Error("网络请求失败"));
        }
      });
    });
  } catch (error) {
    console.error("[getTxComment] 获取歌曲信息失败:", error);
    throw error;
  }
};
const getTxHotComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getTxHotComment] 获取QQ音乐热门评论:", musicInfo);
  try {
    let songId = musicInfo.id;
    if (!songId || isNaN(Number(songId))) {
      console.log("[getTxHotComment] id不存在或非数字，调用getTxMusicInfo获取");
      const songInfo = await getTxMusicInfo(musicInfo.songmid);
      songId = songInfo.songId;
    }
    console.log("[getTxHotComment] 使用songId:", songId);
    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: "https://u.y.qq.com/cgi-bin/musicu.fcg",
        method: "POST",
        header: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.0.0",
          "Referer": "https://y.qq.com/",
          "Origin": "https://y.qq.com",
          "Content-Type": "application/json"
        },
        data: {
          comm: {
            cv: 4747474,
            ct: 24,
            format: "json",
            inCharset: "utf-8",
            outCharset: "utf-8",
            notice: 0,
            platform: "yqq.json",
            needNewCode: 1,
            uin: 0
          },
          req: {
            module: "music.globalComment.CommentRead",
            method: "GetHotCommentList",
            param: {
              BizType: 1,
              BizId: String(songId),
              LastCommentSeqNo: "",
              PageSize: limit,
              PageNum: page - 1,
              HotType: 1,
              WithAirborne: 0,
              PicEnable: 1
            }
          }
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            const data = res.data;
            if (data.code !== 0 || data.req.code !== 0) {
              reject(new Error("获取热门评论失败"));
              return;
            }
            const comment = data.req.data.CommentList;
            const total = comment.Total || 0;
            const comments = filterTxComment(comment.Comments || [], true);
            console.log("[getTxHotComment] 评论总数:", total, "获取:", comments.length);
            resolve({
              source: "tx",
              comments,
              total,
              page,
              limit,
              maxPage: Math.ceil(total / limit) || 1
            });
          } else {
            reject(new Error("请求失败"));
          }
        },
        fail: (err) => {
          console.error("[getTxHotComment] 请求失败:", err);
          reject(new Error("网络请求失败"));
        }
      });
    });
  } catch (error) {
    console.error("[getTxHotComment] 获取歌曲信息失败:", error);
    throw error;
  }
};
const getKgComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getKgComment] 获取酷狗音乐评论:", musicInfo);
  const timestamp = Date.now();
  const params = `dfid=0&mid=16249512204336365674023395779019&clienttime=${timestamp}&uuid=0&extdata=${musicInfo.hash}&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&schash=${musicInfo.hash}&clientver=11409&p=${page}&clienttoken=&pagesize=${limit}&ver=10&kugouid=0`;
  const signature = utils_crypto_kg.signatureParams(params, "android");
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `http://m.comment.service.kugou.com/r/v1/rank/newest?${params}&signature=${signature}`,
      method: "GET",
      header: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.status !== 1 || data.err_code !== 0) {
            reject(new Error(data.msg || "获取评论失败"));
            return;
          }
          const total = data.count || 0;
          const comments = filterKgComment(data.list || []);
          console.log("[getKgComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "kg",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getKgComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getKgHotComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getKgHotComment] 获取酷狗音乐热门评论:", musicInfo);
  const timestamp = Date.now();
  const params = `dfid=0&mid=16249512204336365674023395779019&clienttime=${timestamp}&uuid=0&extdata=${musicInfo.hash}&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&schash=${musicInfo.hash}&clientver=11409&p=${page}&clienttoken=&pagesize=${limit}&ver=10&kugouid=0`;
  const signature = utils_crypto_kg.signatureParams(params, "android");
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `http://m.comment.service.kugou.com/r/v1/rank/topliked?${params}&signature=${signature}`,
      method: "GET",
      header: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.status !== 1 || data.err_code !== 0) {
            reject(new Error(data.msg || "获取评论失败"));
            return;
          }
          const total = data.count || 0;
          const comments = filterKgComment(data.list || []);
          console.log("[getKgHotComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "kg",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getKgHotComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getKwComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getKwComment] 获取酷我音乐评论:", musicInfo);
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `http://ncomment.kuwo.cn/com.s?f=web&type=get_comment&aapiver=1&prod=kwplayer_ar_10.5.2.0&digest=15&sid=${musicInfo.songmid}&start=${limit * (page - 1)}&msgflag=1&count=${limit}&newver=3&uid=0`,
      method: "GET",
      header: {
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9;)",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== "200") {
            reject(new Error("获取评论失败"));
            return;
          }
          const total = data.comments_counts || 0;
          const comments = filterKwComment(data.comments || []);
          console.log("[getKwComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "kw",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getKwComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getKwHotComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getKwHotComment] 获取酷我音乐热门评论:", musicInfo);
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `http://ncomment.kuwo.cn/com.s?f=web&type=get_rec_comment&aapiver=1&prod=kwplayer_ar_10.5.2.0&digest=15&sid=${musicInfo.songmid}&start=${limit * (page - 1)}&msgflag=1&count=${limit}&newver=3&uid=0`,
      method: "GET",
      header: {
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9;)",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== "200") {
            reject(new Error("获取热门评论失败"));
            return;
          }
          const total = data.hot_comments_counts || 0;
          const comments = filterKwComment(data.hot_comments || []);
          console.log("[getKwHotComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "kw",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getKwHotComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getMgComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getMgComment] 获取咪咕音乐评论:", musicInfo);
  let songId = musicInfo.songmid;
  if (musicInfo.songmid === musicInfo.copyrightId && musicInfo.copyrightId) {
    try {
      const infoRes = await new Promise((resolve, reject) => {
        common_vendor.index.request({
          url: "https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2",
          method: "POST",
          header: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: `resourceId=${musicInfo.copyrightId}`,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });
      if (infoRes.statusCode === 200 && infoRes.data && infoRes.data.resource && infoRes.data.resource.length > 0) {
        songId = infoRes.data.resource[0].songId;
        console.log("[getMgComment] 获取到 songId:", songId);
      }
    } catch (e) {
      console.log("[getMgComment] 获取 songId 失败:", e);
    }
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `https://app.c.nf.migu.cn/MIGUM3.0/user/comment/stack/v1.0?pageSize=${limit}&queryType=1&resourceId=${songId}&resourceType=2&commentId=`,
      method: "GET",
      header: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== "000000") {
            reject(new Error("获取评论失败"));
            return;
          }
          const total = parseInt(data.data.commentNums) || 0;
          const comments = filterMgComment(data.data.comments || []);
          console.log("[getMgComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "mg",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getMgComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getMgHotComment = async (musicInfo, page = 1, limit = 20) => {
  console.log("[getMgHotComment] 获取咪咕音乐热门评论:", musicInfo);
  let songId = musicInfo.songmid;
  if (musicInfo.songmid === musicInfo.copyrightId && musicInfo.copyrightId) {
    try {
      const infoRes = await new Promise((resolve, reject) => {
        common_vendor.index.request({
          url: "https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2",
          method: "POST",
          header: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: `resourceId=${musicInfo.copyrightId}`,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });
      if (infoRes.statusCode === 200 && infoRes.data && infoRes.data.resource && infoRes.data.resource.length > 0) {
        songId = infoRes.data.resource[0].songId;
        console.log("[getMgHotComment] 获取到 songId:", songId);
      }
    } catch (e) {
      console.log("[getMgHotComment] 获取 songId 失败:", e);
    }
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `https://app.c.nf.migu.cn/MIGUM3.0/user/comment/stack/v1.0?pageSize=${limit}&queryType=2&resourceId=${songId}&resourceType=2&hotCommentStart=${(page - 1) * limit}`,
      method: "GET",
      header: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
        "Referer": "https://servicewechat.com/wx2d02f54a4e4c4027/devtools/page-frame.html"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== "000000") {
            reject(new Error("获取热门评论失败"));
            return;
          }
          const total = parseInt(data.data.cfgHotCount) || 0;
          const comments = filterMgComment(data.data.hotComments || []);
          console.log("[getMgHotComment] 评论总数:", total, "获取:", comments.length);
          resolve({
            source: "mg",
            comments,
            total,
            page,
            limit,
            maxPage: Math.ceil(total / limit) || 1
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[getMgHotComment] 请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
};
const getMusicComment = async (params) => {
  try {
    const musicInfo = {
      id: params.id,
      name: params.name,
      singer: params.singer,
      source: params.source,
      songmid: params.songmid,
      hash: params.hash,
      copyrightId: params.copyrightId
    };
    let result;
    switch (musicInfo.source) {
      case "wy":
        result = await getWyComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "tx":
        result = await getTxComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "kg":
        result = await getKgComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "kw":
        result = await getKwComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "mg":
        result = await getMgComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      default:
        throw new Error("不支持的音乐源");
    }
    return result;
  } catch (error) {
    console.error("[getMusicComment] 获取评论失败:", error);
    throw error;
  }
};
const getHotComment = async (params) => {
  try {
    const musicInfo = {
      id: params.id,
      name: params.name,
      singer: params.singer,
      source: params.source,
      songmid: params.songmid,
      hash: params.hash,
      copyrightId: params.copyrightId
    };
    let result;
    switch (musicInfo.source) {
      case "wy":
        result = await getWyHotComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "tx":
        result = await getTxHotComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "kg":
        result = await getKgHotComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "kw":
        result = await getKwHotComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      case "mg":
        result = await getMgHotComment(musicInfo, params.page || 1, params.limit || 20);
        break;
      default:
        throw new Error("不支持的音乐源");
    }
    return result;
  } catch (error) {
    console.error("[getHotComment] 获取评论失败:", error);
    throw error;
  }
};
const getNewComment = async (params) => {
  return getMusicComment(params);
};
exports.getHotComment = getHotComment;
exports.getNewComment = getNewComment;
