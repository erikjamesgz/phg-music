"use strict";
const common_vendor = require("../common/vendor.js");
function fetchJsonFromUrl(url, options = {}) {
  const timeout = options.timeout || 1e4;
  const method = options.method || "GET";
  console.log("[MultiSource] 请求:", url);
  return new Promise((resolve) => {
    common_vendor.index.request({
      url,
      method,
      timeout,
      data: options.data || void 0,
      header: options.header || { "Content-Type": "application/json" },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          console.log("[MultiSource] 请求成功:", url);
          resolve(res.data);
        } else {
          console.log("[MultiSource] 状态码异常:", url, res.statusCode);
          resolve(null);
        }
      },
      fail: (err) => {
        console.log("[MultiSource] 请求失败:", url, err.errMsg);
        resolve(null);
      }
    });
  });
}
async function fetchFromMultiSource(urls, options = {}) {
  for (const url of urls) {
    try {
      const data = await fetchJsonFromUrl(url, options);
      if (data) {
        console.log("[MultiSource] 成功获取数据:", url);
        return data;
      }
    } catch (e) {
      console.log("[MultiSource] 异常:", url, e.message || e);
    }
  }
  console.log("[MultiSource] 所有源均失败");
  return null;
}
exports.fetchFromMultiSource = fetchFromMultiSource;
