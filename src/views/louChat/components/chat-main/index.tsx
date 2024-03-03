import louChatStore from '@/stores/louChat';
import {
	BehaviorType,
	MessageOrigin,
	MessageType,
	SocketEventType,
	type ClientBehavior,
	type ClientBehaviorPrivateChat,
	type Message,
	type connectUser,
} from '@/types/louChat';
import { dragDirective } from '@/utils/directives';
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue';
import { socket } from '../../socket';
import message from '../message/index';
import './index.scss';

export default defineComponent({
	components: {
		message,
	},
	directives: {
		dragDirective,
	},
	props: {
		connectUserList: {
			type: Array as () => connectUser[],
			default() {
				return [];
			},
		},
	},
	setup(props) {
		const inputValue = ref<string>(''); // 输入框的值
		const messageModel = reactive<Map<number, Message[]>>(new Map());
		const store = louChatStore();
		const showComponents = computed(() => {
			return store.targetChatUserId !== 0;
		}); // 是否显示组件
		const messageList = computed(() => {
			return messageModel.get(store.targetChatUserId) || [];
		});
		// 当前聊天对象数据
		const targetChatData = computed(() => {
			return store.getChatData();
		});
		// 发送消息
		function sendMessage(keyup: KeyboardEvent) {
			if (keyup.key === 'Enter') {
				const userInfo = store.userInfo;
				const data: ClientBehaviorPrivateChat = {
					type: BehaviorType.LAUNCHPRIVATECHAT,
					originUserId: userInfo.userId,
					targetUserId: store.targetChatUserId,
					data: {
						data: inputValue.value,
						type: MessageType.TEXT,
						origin: MessageOrigin.ME,
					},
				};
				socket.emit(SocketEventType.CLIENT_BEHAVIOR, data);
				inputValue.value = '';
				pushMessage(data);
			}
		}
		watch(
			() => store.chatList.length,
			() => {
				// 当聊天列表变化，需要重新映射消息模型
				initMessageModel();
			}
		);
		onMounted(() => {
			// 接收服务端消息
			receiveServerMessage();
			initMessageModel();
		});
		// 初始化消息模型
		function initMessageModel() {
			const chatList = store.chatList;
			chatList.forEach((item: connectUser) => {
				if (!messageModel.get(item.userId || 0)) {
					messageModel.set(item.userId || 0, []);
				}
			});
		}
		// 接收服务端消息
		function receiveServerMessage() {
			socket.on(SocketEventType.SERVER_BEHAVIOR, (data: ClientBehavior) => {
				if (data.type === BehaviorType.LAUNCHPRIVATECHAT) {
					// 私聊
					pushMessage(data as ClientBehaviorPrivateChat);
				}
			});
		}
		// 推入消息
		function pushMessage(data: ClientBehaviorPrivateChat) {
			const getId = data.data.origin === MessageOrigin.OTHER ? data.originUserId : data.targetUserId;
			const list = messageModel.get(getId) || [];
			if (list) {
				list.push(data.data);
			}
			messageModel.set(getId, list);
		}
		return () => {
			if (!showComponents.value) {
				return null;
			}
			return (
				<div class="chat_main">
					<div class="lou_chat_main_header" data-move={true} v-dragDirective={true}>
						<span class="chat_title desabled-copy">{targetChatData.value?.name}</span>
					</div>
					<div class="lou_chat_main_content">
						<message messageList={messageList.value}></message>
					</div>
					<div class="lou_chat_main_input">
						<input class="input_box" type="textarea" v-model={inputValue.value} onKeyup={sendMessage} />
					</div>
				</div>
			);
		};
	},
});
