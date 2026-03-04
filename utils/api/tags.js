"use strict";
const common_vendor = require("../../common/vendor.js");
async function getKuwoTags() {
  console.log("[Tags] 获取酷我音乐标签");
  return new Promise((resolve, reject) => {
    const url = "http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576";
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        console.log("[Tags] 酷我音乐响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 200) {
            console.log("[Tags] 酷我音乐返回码错误:", data.code);
            reject(new Error("获取标签失败"));
            return;
          }
          const tags = data.data || [];
          const result = [];
          tags.forEach((type) => {
            const typeData = type.data || [];
            result.push({
              name: type.name || "分类",
              list: typeData.map((item) => ({
                id: `${item.id}-${item.digest}`,
                name: item.name,
                source: "kw"
              }))
            });
          });
          console.log("[Tags] 酷我音乐标签数量:", result.length);
          resolve(result);
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[Tags] 酷我音乐请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
}
async function getKugouTags() {
  console.log("[Tags] 获取酷狗音乐标签");
  return new Promise((resolve, reject) => {
    const url = "http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&";
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        var _a;
        console.log("[Tags] 酷狗音乐响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.status !== 1) {
            console.log("[Tags] 酷狗音乐返回码错误:", data.status);
            reject(new Error("获取标签失败"));
            return;
          }
          const tagids = ((_a = data.data) == null ? void 0 : _a.tagids) || {};
          const result = [];
          for (const name of Object.keys(tagids)) {
            const tagList = tagids[name].data || [];
            result.push({
              name,
              list: tagList.map((item) => ({
                id: String(item.id),
                name: item.name,
                source: "kg"
              }))
            });
          }
          console.log("[Tags] 酷狗音乐标签数量:", result.length);
          resolve(result);
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[Tags] 酷狗音乐请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
}
async function getQQTags() {
  console.log("[Tags] 获取QQ音乐标签");
  return new Promise((resolve, reject) => {
    const url = "https://u.y.qq.com/cgi-bin/musicu.fcg?loginUin=0&hostUin=0&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=wk_v15.json&needNewCode=0&data=%7B%22tags%22%3A%7B%22method%22%3A%22get_all_categories%22%2C%22param%22%3A%7B%22qq%22%3A%22%22%7D%2C%22module%22%3A%22playlist.PlaylistAllCategoriesServer%22%7D%7D";
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        var _a, _b;
        console.log("[Tags] QQ音乐响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 0) {
            console.log("[Tags] QQ音乐返回码错误:", data.code);
            reject(new Error("获取标签失败"));
            return;
          }
          const vGroup = ((_b = (_a = data.tags) == null ? void 0 : _a.data) == null ? void 0 : _b.v_group) || [];
          const result = [];
          vGroup.forEach((group) => {
            const items = group.v_item || [];
            result.push({
              name: group.group_name,
              list: items.map((item) => ({
                id: String(item.id),
                name: item.name,
                source: "tx"
              }))
            });
          });
          console.log("[Tags] QQ音乐标签数量:", result.length);
          resolve(result);
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[Tags] QQ音乐请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
}
async function getNeteaseTags() {
  console.log("[Tags] 获取网易云音乐标签");
  return new Promise((resolve, reject) => {
    const url = "https://music.163.com/api/playlist/catalogue";
    common_vendor.index.request({
      url,
      method: "GET",
      header: {
        "Referer": "https://music.163.com/"
      },
      success: (res) => {
        console.log("[Tags] 网易云音乐响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 200) {
            console.log("[Tags] 网易云音乐返回码错误:", data.code);
            reject(new Error("获取标签失败"));
            return;
          }
          const categories = data.categories || {};
          const sub = data.sub || [];
          const result = [];
          const subList = {};
          for (const item of sub) {
            if (!subList[item.category]) {
              subList[item.category] = [];
            }
            subList[item.category].push({
              id: item.name,
              name: item.name,
              source: "wy"
            });
          }
          for (const key of Object.keys(categories)) {
            result.push({
              name: categories[key],
              list: subList[key] || []
            });
          }
          console.log("[Tags] 网易云音乐标签数量:", result.length);
          resolve(result);
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[Tags] 网易云音乐请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
}
async function getMiguTags() {
  console.log("[Tags] 获取咪咕音乐标签");
  return new Promise((resolve, reject) => {
    const url = "https://app.c.nf.migu.cn/pc/v1.0/template/musiclistplaza-taglist/release";
    const defaultHeaders = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
      "Referer": "https://m.music.migu.cn/"
    };
    common_vendor.index.request({
      url,
      method: "GET",
      header: defaultHeaders,
      dataType: "json",
      success: (res) => {
        console.log("[Tags] 咪咕音乐响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          console.log("[Tags] 咪咕音乐返回数据code:", data.code);
          console.log("[Tags] 咪咕音乐返回数据data类型:", typeof data.data);
          console.log("[Tags] 咪咕音乐返回数据data是否为数组:", Array.isArray(data.data));
          if (data.code !== "000000") {
            console.log("[Tags] 咪咕音乐返回码错误:", data.code);
            reject(new Error("获取标签失败"));
            return;
          }
          const rawList = data.data || [];
          console.log("[Tags] 咪咕音乐原始数据长度:", rawList.length);
          console.log("[Tags] 咪咕音乐原始数据前500字符:", JSON.stringify(rawList).substring(0, 500));
          if (!Array.isArray(rawList)) {
            console.log("[Tags] data.data不是数组，尝试其他路径");
            console.log("[Tags] data keys:", Object.keys(data));
          }
          if (rawList.length === 0) {
            resolve([]);
            return;
          }
          const result = [];
          rawList.forEach((item, index) => {
            var _a, _b;
            console.log(`[Tags] 处理第${index}个分组:`, ((_a = item.header) == null ? void 0 : _a.title) || "无标题");
            if (!item.content || !Array.isArray(item.content)) {
              console.log(`[Tags] 第${index}个分组无content或content不是数组`);
              return;
            }
            const tagList = item.content.map(({ texts }) => {
              if (!texts || texts.length < 2) {
                console.log("[Tags] texts格式不正确:", texts);
                return null;
              }
              return {
                id: String(texts[1]),
                name: texts[0],
                source: "mg"
              };
            }).filter((item2) => item2 !== null);
            console.log(`[Tags] 第${index}个分组标签数量:`, tagList.length);
            if (tagList.length > 0) {
              result.push({
                name: ((_b = item.header) == null ? void 0 : _b.title) || (index === 0 ? "热门" : "分类"),
                list: tagList
              });
            }
          });
          console.log("[Tags] 咪咕音乐标签分组数量:", result.length);
          resolve(result);
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        console.error("[Tags] 咪咕音乐请求失败:", err);
        reject(new Error("网络请求失败"));
      }
    });
  });
}
async function getTagsBySource(source) {
  console.log("[Tags] 获取标签:", source);
  switch (source) {
    case "kw":
      return getKuwoTags();
    case "kg":
      return getKugouTags();
    case "tx":
      return getQQTags();
    case "wy":
      return getNeteaseTags();
    case "mg":
      return getMiguTags();
    default:
      throw new Error(`不支持的音源: ${source}`);
  }
}
function flattenTags(tags) {
  if (!tags || tags.length === 0) {
    return [{ id: "", name: "推荐" }];
  }
  const result = [{ id: "", name: "推荐" }];
  tags.forEach((group) => {
    if (group.list && group.list.length > 0) {
      result.push(...group.list);
    }
  });
  return result;
}
exports.flattenTags = flattenTags;
exports.getTagsBySource = getTagsBySource;
