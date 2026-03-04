"use strict";
const common_vendor = require("../common/vendor.js");
function usePageLifecycle(isActive, callbacks = {}) {
  const {
    onActivated = () => {
    },
    onDeactivated = () => {
    },
    onInit = () => {
    }
  } = callbacks;
  let isInitialized = false;
  common_vendor.watch(isActive, (active, wasActive) => {
    if (active && !wasActive) {
      if (!isInitialized) {
        common_vendor.nextTick$1(() => {
          if (!isInitialized) {
            onInit();
            isInitialized = true;
          }
        });
      }
      common_vendor.nextTick$1(() => {
        onActivated();
      });
    } else if (!active && wasActive) {
      onDeactivated();
    }
  }, { immediate: true });
  common_vendor.onMounted(() => {
    if (isActive() && !isInitialized) {
      common_vendor.nextTick$1(() => {
        if (!isInitialized) {
          onInit();
          isInitialized = true;
        }
      });
    }
  });
}
exports.usePageLifecycle = usePageLifecycle;
