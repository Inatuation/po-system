import { SideShowMode, type connectUser } from '@/types/louChat';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

const louChatStore = defineStore('louChat', () => {
	const userInfo = reactive<connectUser>({
		// 用户信息
		userId: 0,
		name: '',
	});
	const sideModel = ref<SideShowMode>(SideShowMode.CHAT); // 侧边栏显示模式

	function changeSideModel(mode: SideShowMode) {
		// 修改侧边栏显示模式
		sideModel.value = mode;
	}

	const chatList = reactive<connectUser[]>([]); // 聊天列表
	// 将某个数据推到聊天列表头部
	function unshiftChatList(targetData: connectUser) {
		if (targetData) {
			const index = chatList.findIndex((item) => item.userId === targetData.userId);
			if (index > -1) {
				// 移动到最前面
				const newData = chatList.splice(index, 1);
				chatList.unshift({ ...newData[0], ...targetData });
			} else {
				chatList.unshift(targetData);
			}
			changeSideModel(SideShowMode.CHAT);
		}
	}
	// 获取某个聊天用户信息
	function getChatData(userId: number = targetChatUserId.value) {
		return chatList.find((item) => item.userId === userId);
	}

	const targetChatUserId = ref<number>(0); // 当前聊天的用户id
	function changeTargetChatUserId(userId: number) {
		// 修改当前聊天的用户id
		targetChatUserId.value = userId;
	}
	return { userInfo, sideModel, changeSideModel, chatList, unshiftChatList, getChatData, targetChatUserId, changeTargetChatUserId };
});

export default louChatStore;
