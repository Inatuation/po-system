import { BehaviorType, SideShowMode, SocketEventType, type ClientBehavior, type connectUser } from '@/types/louChat';
import { defineComponent, getCurrentInstance, onMounted } from 'vue';
import './index.scss';

import louChatStore from '@/stores/louChat';
import { doubleClick, getDatasetByTarget } from '@/utils';
import { dragDirective } from '@/utils/directives';
import { socket } from '../../socket';
import sideItem from '../side-item/index';

export default defineComponent({
	components: {
		sideItem,
	},
	directives: {
		dragDirective,
	},
	props: {
		connectUserList: {
			type: Object as () => connectUser[],
			default: () => {
				return [];
			},
		},
	},
	emits: ['createChat'],
	setup(props) {
		const { proxy } = getCurrentInstance() as any;
		const store = louChatStore();
		onMounted(() => {
			receiveServerMessage();
		});
		// 接收服务端消息
		function receiveServerMessage() {
			socket.on(SocketEventType.SERVER_BEHAVIOR, (data: ClientBehavior) => {
				if (data.type === BehaviorType.LAUNCHPRIVATECHAT) {
					// 有消息进入，将消息放置在聊天列表中，标记未读
					const targetData: connectUser = props.connectUserList.find((item) => item.userId === data.originUserId) as connectUser;
					(targetData.unReadCount = targetData.unReadCount ? targetData.unReadCount + 1 : 1), // 未读消息
						store.unshiftChatList(targetData);
				}
			});
		}
		// 点击聊天列表
		function clickListItem(event: MouseEvent) {
			const data = getDatasetByTarget(event, 'idx') as any;
			if (data && data.dataset.idx) {
				const targetData = store.chatList[data.dataset.idx];
				// 请求与xx的聊天记录
				applyChat(targetData);
			}
		}
		// 发起聊天申请
		async function applyChat(targetData: connectUser) {
			store.changeTargetChatUserId(targetData.userId || 0);
		}
		// 点击在线列表
		function clicklConnectListItem(event: MouseEvent) {
			doubleClick(() => {
				const data = getDatasetByTarget(event, 'idx') as any;
				if (data && data.dataset.idx) {
					const targetData = props.connectUserList[data.dataset.idx];
					// 切换到聊天列表，将该数据推到聊天列表头部
					store.unshiftChatList(targetData);
					applyChat(targetData);
				}
			});
		}
		return () => (
			<div class="side_block">
				<div class="side_header" data-move={true} v-dragDirective={true}></div>
				<div v-show={store.sideModel === SideShowMode.CHAT} class="side_main" onClick={clickListItem}>
					{store.chatList.length ? (
						store.chatList.map((item, index) => {
							return <side-item currentId={store.targetChatUserId} showFlag key={item.userId} userData={item} idx={index}></side-item>;
						})
					) : (
						<div>暂无消息</div>
					)}
				</div>
				<div v-show={store.sideModel === SideShowMode.CONNECT} class="side_main" onClick={clicklConnectListItem}>
					{props.connectUserList.length ? (
						props.connectUserList.map((item, index) => {
							return <side-item key={item.userId} userData={item} idx={index}></side-item>;
						})
					) : (
						<div>暂无好友</div>
					)}
				</div>
			</div>
		);
	},
});
