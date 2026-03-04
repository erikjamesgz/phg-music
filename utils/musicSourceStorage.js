"use strict";
const utils_storage = require("./storage.js");
const STORAGE_KEY = "musicSources";
const STORAGE_ACTIVITIES_KEY = "musicSourceActivities";
function getMusicSources() {
  return utils_storage.getStorage(STORAGE_KEY, []);
}
function saveMusicSources(sources) {
  utils_storage.setStorage(STORAGE_KEY, sources);
}
function getActivities() {
  return utils_storage.getStorage(STORAGE_ACTIVITIES_KEY, []);
}
function saveActivities(activities) {
  if (activities.length > 50) {
    activities = activities.slice(0, 50);
  }
  utils_storage.setStorage(STORAGE_ACTIVITIES_KEY, activities);
}
function addActivity(activity) {
  const activities = getActivities();
  activities.unshift(activity);
  saveActivities(activities);
}
exports.addActivity = addActivity;
exports.getActivities = getActivities;
exports.getMusicSources = getMusicSources;
exports.saveMusicSources = saveMusicSources;
