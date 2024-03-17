export const __POWERED_BY_WUJIE__ = true; // 是否启用无界
export const __CACHE__PROGRAM = false; // 刷新是否缓存应用

const logoUrl: any = {
	music: new URL('@/assets/desktop/music.png', import.meta.url).href,
	chat: new URL('@/assets/desktop/chat.png', import.meta.url).href,
	md: new URL('@/assets/desktop/markdown.png', import.meta.url).href,
	exe: new URL('@/assets/desktop/exe.png', import.meta.url).href,
};

export const getLogoUrl = (stringOrRegExp: string | RegExp) => {
	if (typeof stringOrRegExp === 'string') {
		return logoUrl[stringOrRegExp];
	} else if (stringOrRegExp instanceof RegExp) {
		// 使用 Object.keys 获取 logoUrl 的所有键
		const keys = Reflect.ownKeys(logoUrl);

		// 遍历所有键，尝试使用正则表达式进行匹配
		for (const key of keys) {
			if (stringOrRegExp.test(key as string)) {
				return logoUrl[key];
			}
		}
	}
	return '';
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
		logo: getLogoUrl('music'),
	},
	chat: {
		alive: true,
		sync: true,
		name: 'chat',
		url: 'http://112.74.49.183:5716',
		defaultWidth: 1000,
		defaultHeight: 800,
		customHeader: true,
		logo: getLogoUrl('chat'),
	},
};
