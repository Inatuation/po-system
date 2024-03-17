import PopWindow from '@/components/appProgram/popWindow';
import { __CACHE__PROGRAM } from '@/config';
import { setSessionStorage } from '@/utils';
import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';

const processes = defineStore('processes', () => {
	const processesStack = reactive<Array<PopWindow>>([]); // 进程实例栈，先进后出先出后进
	const processesMap = reactive<Map<string, PopWindow>>(new Map());

	if (__CACHE__PROGRAM) {
		watch(processesStack, (newValue: any) => {
			// pinia数据持久化
			const data = newValue.map((item: any) => ({ fileName: item.fileName, programName: item.programName, logo: item.logo || '' }));
			setSessionStorage('processes', JSON.stringify(data));
		});
	}
	const activeProgram = computed(() => {
		return processesStack[processesStack.length - 1];
	});
	function toggleProgram(programName: string) {
		const stackIndex = findProgramIndex(programName);
		let copy;
		if (stackIndex !== undefined) {
			copy = processesStack[stackIndex];
			processesStack.splice(stackIndex, 1);
		}
		if (copy) {
			processesStack.push(copy);
			return true;
		}
		return false;
	}
	function trackProgram(program: PopWindow) {
		// 节省性能，判断进程中最后一项是否当前项，是的话无需变更
		if (processesStack[processesStack.length - 1]?.programName === program.programName) {
			return;
		}

		const flag = toggleProgram(program.programName);
		if (!flag) {
			// 将应用程序推入栈
			processesMap.set(program.programName, program);
			processesStack.push(program);
		}
	}
	function triggerProgram(program: PopWindow) {
		// 将程序从栈中移除
		// 获取程序programName匹配栈
		const stackIndex = findProgramIndex(program.programName);
		if (stackIndex === undefined) {
			throw new Error('程序错误，进程中未找到该程序');
		}
		processesMap.delete(program.programName);
		processesStack.splice(stackIndex, 1);
	}
	function findProgramIndex(programName: string) {
		for (let i = 0; i < processesStack.length; i++) {
			if (processesStack[i].programName === programName) {
				return i;
			}
		}
	}
	return { activeProgram: activeProgram, trackProgram, triggerProgram, processesStack, processesMap, toggleProgram, findProgramIndex };
});

export default processes;
