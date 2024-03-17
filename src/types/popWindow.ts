export interface FilesResultType {
	programName: string;
	WUJIEAPP?: boolean;
	renderer?: any;
	logo?: string;
}

// 窗口状态
export enum WindowType {
	MINIMIZE = 'MIXINIZE', // 最小化
	DEFAULT = 'DEFAULT', // 默认
	MAXIMIZE = 'MAXIMIZE', // 全屏
}

export const FILESTORAGE = 'FILESTORAGE';
