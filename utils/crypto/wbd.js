"use strict";
const common_vendor = require("../../common/vendor.js");
const wbdCrypto = {
  aesKey: "cFcnPcf6Kb85RC1y3V6M5A==",
  aesIv: "",
  appId: "y67sprxhhpws",
  decodeData(base64Result) {
    const key = common_vendor.CryptoJS.enc.Base64.parse(this.aesKey);
    const decrypted = common_vendor.CryptoJS.AES.decrypt(decodeURIComponent(base64Result), key, {
      mode: common_vendor.CryptoJS.mode.ECB,
      padding: common_vendor.CryptoJS.pad.Pkcs7
    });
    const decryptedStr = decrypted.toString(common_vendor.CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  },
  createSign(data, time) {
    const str = `${this.appId}${data}${time}`;
    return common_vendor.CryptoJS.MD5(str).toString().toUpperCase();
  },
  buildParam(jsonData) {
    const jsonStr = JSON.stringify(jsonData);
    const key = common_vendor.CryptoJS.enc.Base64.parse(this.aesKey);
    const time = Date.now();
    const encrypted = common_vendor.CryptoJS.AES.encrypt(jsonStr, key, {
      mode: common_vendor.CryptoJS.mode.ECB,
      padding: common_vendor.CryptoJS.pad.Pkcs7
    });
    const encodeData = encrypted.ciphertext.toString(common_vendor.CryptoJS.enc.Base64);
    const sign = this.createSign(encodeData, time);
    return `data=${encodeURIComponent(encodeData)}&time=${time}&appId=${this.appId}&sign=${sign}`;
  }
};
exports.wbdCrypto = wbdCrypto;
