export const __POWERED_BY_WUJIE__ = false; // 是否启用无界

export const serverConfig = {
	host: 'http://192.168.0.124',
	port: 3000,
};

export const wujieAppList: any = {
	music: {
		alive: true,
		sync: true,
		name: 'childProject',
		url: 'http://localhost:8090',
		defaultWidth: 1000,
		defaultHeight: 800,
		customHeader: true,
	},
	chat: {
		alive: true,
		sync: true,
		name: 'chat',
		url: 'http://localhost:8099',
		defaultWidth: 1000,
		defaultHeight: 800,
		customHeader: true,
	},
};
