import { getProgramName } from '@/utils';
import PopWindow from './popWindow';
import processes from '@/stores/processes';

export default class AppPogram {
	private fileName: string;
	constructor(private programName: string) {
		this.fileName = getProgramName(programName);
	}
	static openProgram(programName: string) {
		// 判断是否已打开该应用程序
		const store = processes();
		const programIndex = store.findProgramIndex(programName);
		if (programIndex === undefined) {
			const popWindow = new PopWindow(programName);
			popWindow.open(); // 打开弹窗
		} else {
			// 切换应用
			store.toggleProgram(programName);
		}
	}
}
