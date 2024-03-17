import processes from '@/stores/processes';
import { getProgramName } from '@/utils';
import PopWindow from './popWindow';

export default class AppPogram {
	private fileName: string;
	constructor(private programName: string) {
		this.fileName = getProgramName(programName);
	}
	static openProgram(program: any) {
		// 判断是否已打开该应用程序
		const store = processes();
		const programIndex = store.findProgramIndex(program.programName);
		if (programIndex === undefined) {
			const popWindow = new PopWindow(program.programName, program.logo || '', program.WUJIEAPP);
			popWindow.open(); // 打开弹窗
		} else {
			// 切换应用
			store.toggleProgram(program.programName);
		}
	}
}
