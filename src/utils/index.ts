import AppPogram from '@/components/appProgram';
import { __CACHE__PROGRAM, __POWERED_BY_WUJIE__, getLogoUrl, wujieAppList } from '@/config';
import { type FilesResultType } from '@/types/popWindow';

let cacheFilesList: any;

/**
 * 导出文件
 */
export function exportFiles() {
	// const cacheFilesList = LocalStorageUtil.getItem(FILESTORAGE);
	if (cacheFilesList) {
		return cacheFilesList;
	}
	const docsTemplate = import.meta.glob('../components/docsTemplate/*.vue', { eager: true }); // 导入docsTemplate模块
	const views = import.meta.glob(['!**/views/desktop/*.tsx', '!**/views/loginPage/*.tsx', '../views/*/index.tsx'], { eager: true }); // 导入views模块
	const modules = { ...docsTemplate, ...views } as any; // 合并docsTemplate和views模块
	const result: Array<FilesResultType> = []; // 初始化result数组
	if (modules && !isEmptyObject(modules)) {
		// 判断modules对象是否存在且不为空
		const reg = /docsTemplate(\S*)\.html|views(\S*)index/; // 正则表达式匹配规则
		// const reg = /views(\S*)index\.tsx/; // 正则表达式匹配规则
		Reflect.ownKeys(modules).forEach((file) => {
			// 遍历modules模块的属性
			const str = (file as string).replace(/\//g, ''); // 去除字符串中的斜杠
			const res: RegExpMatchArray | null = str.match(reg);
			const programName = res?.[1] ? `${res?.[1]}.md` : `${res?.[2]}.exe`; // 根据匹配结果生成name
			const params = {
				programName,
				renderer: modules[file].default, // 获取模块的默认导出
				logo: getLogoUrl(res?.[1] ? /md/ : /exe/),
			};
			result.push(params); // 将params对象添加到result数组中
		});
	}
	let appList: Array<FilesResultType> = [];
	if (__POWERED_BY_WUJIE__) {
		// 读取config文件应用
		appList = Reflect.ownKeys(wujieAppList).map((key: any) => {
			return {
				programName: `${key}.exe`,
				WUJIEAPP: true,
				logo: wujieAppList[key].logo || '',
			};
		});
	}
	const cache = [...result, ...appList];
	cacheFilesList = cache;
	// console.log(cache);
	// LocalStorageUtil.setItem(FILESTORAGE, cache);
	return cache; // 返回result数组
}

/**
 * 判断对象是否为空对象
 * @param data 要判断的对象
 * @returns 如果对象为空对象则返回true，否则返回false
 */
export function isEmptyObject(data: any) {
	return JSON.stringify(data) === '{}';
}

/**
 * 获取程序名称
 * @param programName 程序名称字符串
 * @returns 程序名称的首部分，如果不存在则返回空字符串
 */
export function getProgramName(programName: string) {
	return programName.split('.')[0] || '';
}
/**
 * 将毫秒转换为分钟
 * @param ms 毫秒数
 * @returns 分钟数，如果为0则返回0
 */
export function msToMinutes(ms: number) {
	const minutes = ms / 60000;
	if (minutes) {
		return minutes.toFixed(2).toString().replace('.', ':');
	}
	return minutes;
}
let clickFlag = false;

/**
 * 用于实现双击事件的函数
 * @param fn - 点击回调函数
 */
export function doubleClick(fn: () => void) {
	setTimeout(() => {
		clickFlag = false;
	}, 300);
	if (clickFlag) {
		fn();
	}
	clickFlag = true;
}
/**
 * 随机打乱给定数组的顺序
 * @param arr 需要打乱顺序的数组
 * @returns 打乱顺序后的数组
 */
export const shuffleArray = <T>(arr: T[]): T[] => {
	const copyArr = [...arr];
	for (let i = copyArr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copyArr[i], copyArr[j]] = [copyArr[j], copyArr[i]];
	}
	return copyArr;
};

// 事件委托，循环获取其父元素，直到找到父元素中带有data-为止
export function getDatasetByTarget(e: Event, datasetName: string) {
	let target = e.target as HTMLElement;
	while (target && target.parentElement && !target.dataset[datasetName]) {
		target = target.parentElement;
	}
	return target;
}

// 持久化pinia数据
export function setSessionStorage(key: string, value: any) {
	sessionStorage.setItem(key, value);
}

export function getSessionStorage(key: string) {
	return sessionStorage.getItem(key);
}

export function removeSessionStorage(key: string) {
	sessionStorage.removeItem(key);
}

export function setProcessesPiniaData() {
	// 重载pinia数据, 重新启动应用
	if (__CACHE__PROGRAM) {
		let data: any = getSessionStorage('processes');
		if (data) {
			data = JSON.parse(data) as Array<any>;
			if (data?.length) {
				console.log(data);
				data.forEach((item: any) => {
					if (item.programName) {
						AppPogram.openProgram(item);
					}
				});
			}
		}
	}
}

// localStorage封装

class LocalStorageUtil {
	static setItem(key: string, value: any): void {
		localStorage.setItem(key, JSON.stringify(value));
	}

	static getItem(key: string): any | null {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	}

	static removeItem(key: string): void {
		localStorage.removeItem(key);
	}

	static updateItem(key: string, newValue: any): void {
		const item = LocalStorageUtil.getItem(key);
		if (item) {
			LocalStorageUtil.setItem(key, { ...item, ...newValue });
		}
	}
}
