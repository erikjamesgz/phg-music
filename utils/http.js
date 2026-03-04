"use strict";
const common_vendor = require("../common/vendor.js");
const utils_storage = require("./storage.js");
const config = {
  // 基础URL
  baseUrl: "https://api.celadonmusic.com",
  // 请求超时时间（毫秒）
  timeout: 3e4,
  // 请求头
  header: {
    "Content-Type": "application/json"
  },
  // 是否显示加载提示
  loading: true,
  // 加载提示文本
  loadingText: "加载中...",
  // 是否显示错误提示
  showError: true
};
let requestQueue = {};
function generateRequestKey(options) {
  return `${options.method}_${options.url}_${JSON.stringify(options.data || {})}`;
}
function showLoading(title) {
  common_vendor.index.showLoading({
    title,
    mask: true
  });
}
function hideLoading() {
  common_vendor.index.hideLoading();
}
function showError(message) {
  common_vendor.index.showToast({
    title: message || "请求失败",
    icon: "none",
    duration: 2e3
  });
}
function handleResponse(response, options, resolve, reject) {
  var _a;
  delete requestQueue[generateRequestKey(options)];
  if (options.loading) {
    hideLoading();
  }
  if (response.statusCode >= 200 && response.statusCode < 300) {
    resolve(response.data);
  } else if (response.statusCode === 401) {
    handleUnauthorized(options, reject);
  } else {
    const errorMsg = ((_a = response.data) == null ? void 0 : _a.message) || `请求失败: ${response.statusCode}`;
    handleRequestError(errorMsg, options, reject);
  }
}
function handleRequestError(message, options, reject) {
  if (options.loading) {
    hideLoading();
  }
  if (options.showError) {
    showError(message);
  }
  reject(new Error(message));
}
function handleUnauthorized(options, reject) {
  common_vendor.index.removeStorageSync("token");
  common_vendor.index.removeStorageSync("userInfo");
  if (options.loading) {
    hideLoading();
  }
  if (options.showError) {
    showError("登录已过期，请重新登录");
  }
  reject(new Error("未授权，请重新登录"));
}
function request(options) {
  options = {
    ...config,
    ...options,
    header: { ...config.header, ...options.header }
  };
  options.url = options.url.startsWith("http") ? options.url : config.baseUrl + options.url;
  const requestKey = generateRequestKey(options);
  if (requestQueue[requestKey]) {
    return requestQueue[requestKey];
  }
  const token = utils_storage.getStorage("token");
  if (token) {
    options.header["Authorization"] = `Bearer ${token}`;
  }
  if (options.isNetease) {
    options.header["Content-Type"] = "application/x-www-form-urlencoded";
  }
  if (options.loading) {
    showLoading(options.loadingText);
  }
  const requestPromise = new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: options.url,
      data: options.data,
      method: options.method,
      header: options.header,
      timeout: options.timeout,
      success: (res) => {
        handleResponse(res, options, resolve, reject);
      },
      fail: (err) => {
        delete requestQueue[requestKey];
        if (options.loading) {
          hideLoading();
        }
        const errorMsg = err.errMsg || "网络请求失败";
        handleRequestError(errorMsg, options, reject);
      }
    });
  });
  requestQueue[requestKey] = requestPromise;
  return requestPromise;
}
function get(url, data, options = {}) {
  return request({
    url,
    data: data === null || data === void 0 ? {} : data,
    method: "GET",
    ...options
  });
}
function post(url, data = {}, options = {}) {
  return request({
    url,
    data,
    method: "POST",
    ...options
  });
}
function put(url, data = {}, options = {}) {
  return request({
    url,
    data,
    method: "PUT",
    ...options
  });
}
function del(url, data = {}, options = {}) {
  return request({
    url,
    data,
    method: "DELETE",
    ...options
  });
}
function upload(url, filePath, name = "file", formData = {}, options = {}) {
  options = {
    ...config,
    ...options,
    header: { ...config.header, ...options.header }
  };
  url = url.startsWith("http") ? url : config.baseUrl + url;
  const token = utils_storage.getStorage("token");
  if (token) {
    options.header["Authorization"] = `Bearer ${token}`;
  }
  if (options.loading) {
    showLoading(options.loadingText || "上传中...");
  }
  return new Promise((resolve, reject) => {
    const uploadTask = common_vendor.index.uploadFile({
      url,
      filePath,
      name,
      formData,
      header: options.header,
      success: (res) => {
        if (options.loading) {
          hideLoading();
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let data;
          try {
            data = JSON.parse(res.data);
          } catch (e) {
            data = res.data;
          }
          resolve(data);
        } else if (res.statusCode === 401) {
          handleUnauthorized(options, reject);
        } else {
          const errorMsg = `上传失败: ${res.statusCode}`;
          handleRequestError(errorMsg, options, reject);
        }
      },
      fail: (err) => {
        if (options.loading) {
          hideLoading();
        }
        const errorMsg = err.errMsg || "上传失败";
        handleRequestError(errorMsg, options, reject);
      }
    });
    if (options.onProgress) {
      uploadTask.onProgressUpdate((res) => {
        options.onProgress(res.progress);
      });
    }
  });
}
function download(url, options = {}) {
  options = {
    ...config,
    ...options,
    header: { ...config.header, ...options.header }
  };
  url = url.startsWith("http") ? url : config.baseUrl + url;
  const token = utils_storage.getStorage("token");
  if (token) {
    options.header["Authorization"] = `Bearer ${token}`;
  }
  if (options.loading) {
    showLoading(options.loadingText || "下载中...");
  }
  return new Promise((resolve, reject) => {
    const downloadTask = common_vendor.index.downloadFile({
      url,
      header: options.header,
      success: (res) => {
        if (options.loading) {
          hideLoading();
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.tempFilePath);
        } else if (res.statusCode === 401) {
          handleUnauthorized(options, reject);
        } else {
          const errorMsg = `下载失败: ${res.statusCode}`;
          handleRequestError(errorMsg, options, reject);
        }
      },
      fail: (err) => {
        if (options.loading) {
          hideLoading();
        }
        const errorMsg = err.errMsg || "下载失败";
        handleRequestError(errorMsg, options, reject);
      }
    });
    if (options.onProgress) {
      downloadTask.onProgressUpdate((res) => {
        options.onProgress(res.progress);
      });
    }
  });
}
const http = {
  request,
  get,
  post,
  put,
  delete: del,
  upload,
  download,
  config
};
exports.http = http;
