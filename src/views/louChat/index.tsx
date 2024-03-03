import louChatStore from '@/stores/louChat';
import { BehaviorType, SocketEventType, type ClientBehaviorLogin, type ServerBehavior, type connectUser } from '@/types/louChat';
import { defineComponent, getCurrentInstance, ref } from 'vue';
import chatMain from './components/chat-main/index';
import login from './components/login/index';
import side from './components/side/index';
import tools from './components/tools/index';
import './index.scss';
import { initSocket, socket } from './socket';

export default defineComponent({
	windowWidth: 1000,
	windowHeight: 800,
	customHeader: true, // 开启自定义头部
	components: { side, tools, login, chatMain },
	setup() {
		const { proxy } = getCurrentInstance() as any;
		const isLogin = ref<boolean>(false); // 是否已登陆
		const store = louChatStore();
		const connectUserList = ref<connectUser[]>([]); // 在线用户列表
		// 初始化
		async function init() {
			initSocket();
			socket.on('connect', () => {
				console.log('连接成功', socket.id);
				// 连接socket成功，修改用户信息里的socketId
				store.userInfo.socketId = socket.id;
				receiveServerBehavior();
				// 发送用户行为,告诉服务器已经连接成功
				socket.emit(SocketEventType.CLIENT_BEHAVIOR, {
					type: BehaviorType.LOGIN,
					userId: store.userInfo.userId,
				} as ClientBehaviorLogin);
			});
		}
		// 监听服务器行为
		function receiveServerBehavior() {
			socket.on(SocketEventType.SERVER_BEHAVIOR, (behavior: ServerBehavior) => {
				switch (behavior.type) {
					case BehaviorType.USERLISTUPDATE:
						// 更新在线用户列表
						console.log(behavior);
						connectUserList.value = behavior.data;
						break;
					default:
						break;
				}
			});
		}
		// 登陆成功
		function loginSuccess(data: connectUser) {
			store.userInfo.userId = data.userId;
			store.userInfo.name = data.name;
			store.userInfo.create_time = data.create_time;
			store.userInfo.last_login_time = data.last_login_time;
			isLogin.value = !isLogin.value;
			init();
		}
		return () => {
			if (!isLogin.value) {
				return <login onLoginSuccess={loginSuccess} />;
			} else {
				return (
					<div class="lou_chat_program">
						<div class="lou_chat_tools">
							<tools></tools>
						</div>
						<div class="lou_chat_side">
							<side connectUserList={connectUserList.value}></side>
						</div>
						<div class="lou_chat_main">
							<chat-main connectUserList={connectUserList.value} />
						</div>
					</div>
				);
			}
		};
	},
});
