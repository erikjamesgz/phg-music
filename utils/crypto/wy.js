"use strict";
const common_vendor = require("../../common/vendor.js");
const iv = "0102030405060708";
const presetKey = "0CoJUm6Qyw8W8jud";
const secretKey = "a8LWv2uAtXjzSfkQ";
const encSecKey = "2d48fd9fb8e58bc9c1f14a7bda1b8e49a3520a67a2300a1f73766caee29f2411c5350bceb15ed196ca963d6a6d0b61f3734f0a0f4a172ad853f16dd06018bc5ca8fb640eaa8decd1cd41f66e166cea7a3023bd63960e656ec97751cfc7ce08d943928e9db9b35400ff3d138bda1ab511a06fbee75585191cabe0e6e63f7350d6";
const aesEncrypt = (text, mode, key, ivStr) => {
  const encrypted = common_vendor.CryptoJS.AES.encrypt(
    common_vendor.CryptoJS.enc.Utf8.parse(text),
    common_vendor.CryptoJS.enc.Utf8.parse(key),
    {
      iv: ivStr ? common_vendor.CryptoJS.enc.Utf8.parse(ivStr) : void 0,
      mode: mode === "cbc" ? common_vendor.CryptoJS.mode.CBC : common_vendor.CryptoJS.mode.ECB,
      padding: common_vendor.CryptoJS.pad.Pkcs7
    }
  );
  return encrypted.toString();
};
const weapi = (object) => {
  const text = JSON.stringify(object);
  const firstEncrypt = aesEncrypt(text, "cbc", presetKey, iv);
  const params = aesEncrypt(firstEncrypt, "cbc", secretKey, iv);
  return {
    params,
    encSecKey
  };
};
exports.weapi = weapi;
