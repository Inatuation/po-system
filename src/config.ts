export const __POWERED_BY_WUJIE__ = true; // 是否启用无界

export const logoUrl: any = {
	music: new URL('@/assets/desktop/music.png', import.meta.url).href,
};

export const serverConfig = {
	host: 'http://192.168.0.124',
	port: 8112,
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
		logo: logoUrl['music'],
	},
	chat: {
		alive: true,
		sync: true,
		name: 'chat',
		url: 'http://112.74.49.183:5716',
		defaultWidth: 1000,
		defaultHeight: 800,
		customHeader: true,
	},
};
