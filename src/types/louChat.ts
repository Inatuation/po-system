// socket事件名称
export enum SocketEventType {
	CLIENT_BEHAVIOR = 'clientBehavior', // 客户端行为
	SERVER_BEHAVIOR = 'serverBehavior', // 服务端行为
}

// side显示模式
export enum SideShowMode {
	CONNECT = 'connect', // 在线用户
	CHAT = 'chat', // 聊天
}

// 消息类型
export interface Message {
	type: MessageType; // 消息类型
	origin: MessageOrigin; // 消息来源
	data: string; // 消息内容
	time?: number; // 时间
}

export enum MessageType {
	TEXT = 'text',
}

export enum MessageOrigin {
	ME = 'me',
	OTHER = 'other',
}

// 客户端行为
export interface ClientBehavior {
	type: BehaviorType;
	[key: string]: any;
}

// 客户端行为-私聊
export interface ClientBehaviorPrivateChat {
	type: BehaviorType.LAUNCHPRIVATECHAT;
	originUserId: number; // 来源用户id
	targetUserId: number; // 目标用户id
	data: Message;
}

// 服务端行为
export interface ServerBehavior {
	type: BehaviorType; //  行为类型
	data: any; // 数据
}

// 客户端行为类型
export enum BehaviorType {
	LOGIN = 'login', // 用户登陆
	LAUNCHPRIVATECHAT = 'launch_private_chat', // 私聊
	LANUCHGROUPCHAT = 'launch_group_chat', // 群聊
	USERLISTUPDATE = 'user_list_update', // 在线用户列表更新
}

// 连接用户表
export interface connectUser {
	userId: number; // 用户id
	name?: string; // 用户名称
	socketId?: string; // socketId
	create_time?: string; // 创建时间
	last_login_time?: string; // 最后登陆时间
	unReadCount?: number; // 未读消息
}

// 客户端登陆行为
export interface ClientBehaviorLogin {
	type: BehaviorType.LOGIN;
	userId: number; // 用户id
}
