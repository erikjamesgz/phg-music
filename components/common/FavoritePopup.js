"use strict";
const common_vendor = require("../../common/vendor.js");
const store_modules_list = require("../../store/modules/list.js");
const store_modules_player = require("../../store/modules/player.js");
const utils_system = require("../../utils/system.js");
if (!Math) {
  RocIconPlus();
}
const RocIconPlus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
const _sfc_main = {
  __name: "FavoritePopup",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    isTablet: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:visible", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const availableLists = common_vendor.computed(() => store_modules_list.listStore.getAllAvailableLists());
    const currentSong = common_vendor.computed(() => store_modules_player.playerStore.state.currentSong);
    const closeModal = () => {
      emit("update:visible", false);
      emit("close");
    };
    const modalSafeTop = common_vendor.computed(() => {
      if (!props.isTablet)
        return "";
      return `${utils_system.getNavbarHeight()}px`;
    });
    const getListIcon = (type) => {
      const iconMap = {
        "default": "music",
        "love": "heart",
        "user": "list-ul",
        "custom": "folder",
        "imported": "download"
      };
      return iconMap[type] || "list-ul";
    };
    const getListColor = (type, disabled = false) => {
      const colorMap = {
        "default": "#00d7cd",
        "love": "#ff6b6b",
        "user": "#6b7280",
        "custom": "#f59e0b",
        "imported": "#3b82f6"
      };
      const disabledColorMap = {
        "default": "rgba(0, 215, 205, 0.4)",
        "love": "rgba(255, 107, 107, 0.4)",
        "user": "rgba(107, 114, 128, 0.4)",
        "custom": "rgba(245, 158, 11, 0.4)",
        "imported": "rgba(59, 130, 246, 0.4)"
      };
      if (disabled) {
        return disabledColorMap[type] || "rgba(107, 114, 128, 0.4)";
      }
      return colorMap[type] || "#6b7280";
    };
    const isSongInList = (listId) => {
      if (!currentSong.value || !currentSong.value.id)
        return false;
      return store_modules_list.listStore.checkSongInList(listId, currentSong.value.id);
    };
    const getListCount = (listId) => {
      return store_modules_list.listStore.getListCount(listId);
    };
    const addToList = (listId) => {
      var _a, _b;
      if (!currentSong.value || !currentSong.value.id) {
        common_vendor.index.showToast({
          title: "没有正在播放的歌曲",
          icon: "none"
        });
        return;
      }
      const isInList = store_modules_list.listStore.checkSongInList(listId, currentSong.value.id);
      if (isInList) {
        store_modules_list.listStore.removeListMusics(listId, currentSong.value.id);
        const listName = ((_a = availableLists.value.find((l) => l.id === listId)) == null ? void 0 : _a.name) || "列表";
        common_vendor.index.showToast({
          title: `已从${listName}移除`,
          icon: "none"
        });
      } else {
        const success = store_modules_list.listStore.addMusicToAnyList(listId, currentSong.value, "top");
        if (success) {
          const listName = ((_b = availableLists.value.find((l) => l.id === listId)) == null ? void 0 : _b.name) || "列表";
          common_vendor.index.showToast({
            title: `已添加到${listName}`,
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: "操作失败",
            icon: "none"
          });
        }
      }
      closeModal();
    };
    const createNewList = () => {
      closeModal();
      setTimeout(() => {
        common_vendor.index.showModal({
          title: "新建歌单",
          editable: true,
          placeholderText: "请输入歌单名称",
          success: (res) => {
            if (res.confirm && res.content) {
              const name = res.content.trim();
              if (!name) {
                common_vendor.index.showToast({ title: "歌单名称不能为空", icon: "none" });
                return;
              }
              const newList = store_modules_list.listStore.createUserList(name);
              if (newList) {
                common_vendor.index.showToast({
                  title: "创建成功",
                  icon: "success"
                });
              }
            }
          }
        });
      }, 100);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? {
        b: common_vendor.p({
          type: "fas",
          name: "xmark",
          size: "20",
          color: "#999"
        }),
        c: common_vendor.o(closeModal, "d7"),
        d: common_vendor.p({
          type: "fas",
          name: "plus",
          size: "18",
          color: "#00d7cd"
        }),
        e: common_vendor.o(createNewList, "0c"),
        f: common_vendor.f(availableLists.value, (list, k0, i0) => {
          return {
            a: "b6bbb481-2-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: getListIcon(list.type),
              size: "18",
              color: isSongInList(list.id) ? getListColor(list.type, true) : getListColor(list.type, false)
            }),
            c: common_vendor.t(list.name),
            d: isSongInList(list.id) ? 1 : "",
            e: common_vendor.t(isSongInList(list.id) ? "已添加" : getListCount(list.id) + "首"),
            f: isSongInList(list.id) ? 1 : "",
            g: isSongInList(list.id) ? 1 : "",
            h: list.id,
            i: common_vendor.o(($event) => addToList(list.id), list.id)
          };
        }),
        g: __props.darkMode ? 1 : "",
        h: __props.isTablet ? modalSafeTop.value : "",
        i: common_vendor.o(() => {
        }, "e1"),
        j: __props.isTablet ? 1 : "",
        k: common_vendor.o(closeModal, "72")
      } : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b6bbb481"]]);
wx.createComponent(Component);
