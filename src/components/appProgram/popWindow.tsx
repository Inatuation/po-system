/**全局封装组件的一些步骤 */
import { __POWERED_BY_WUJIE__, wujieAppList } from '@/config';
import axios from '@/plugin/service';
import processes from '@/stores/processes';
import type { FilesResultType } from '@/types/popWindow';
import { exportFiles, getProgramName } from '@/utils';
import { computed, createApp, h, reactive, ref, resolveComponent, withModifiers } from 'vue';
import WujieVue from 'wujie-vue3';
import './popWindow.scss';

function loadComponents(programName: string) {
	const files: Array<FilesResultType> = exportFiles();
	let result: Array<FilesResultType> = [];
	if (files && files.length) {
		result = files.filter((filesObj: FilesResultType) => filesObj.name === programName);
	}
	return result[0].renderer;
}

export default class PopWindow {
	public fileName: string;
	public mouseDown(payload: MouseEvent) {}
	public mouseMove(payload: MouseEvent) {}
	public mouseUp(payload: MouseEvent) {}
	constructor(public programName: string) {
		this.fileName = getProgramName(programName);
	}
	static openWindow(programName: string) {
		const popWindow = new PopWindow(programName);
		popWindow.open();
	}
	open() {
		const div = document.createElement('div');
		div.className = `__app_program_${this.fileName}`;
		document.body.appendChild(div);
		const app = createApp(this.renderer(this.fileName), {
			msg: this.fileName,
		});
		if (__POWERED_BY_WUJIE__ && wujieAppList[this.fileName]) {
			app.use(WujieVue);
		}
		app.config.globalProperties.$axios = axios;
		app.mount(div);
	}
	private close() {
		// 卸载节点即可
		const target = document.body.querySelectorAll(`.__app_program_${this.fileName}`);
		if (target && target.length) {
			document.body.removeChild(target[0]);
		}
	}
	private renderer(fileName: string) {
		const that = this;
		const store = processes();
		let rendererComponents: any;
		if (!__POWERED_BY_WUJIE__ ) {
			rendererComponents = loadComponents(that.programName);
		}
		const styleWidth = computed(() => {
			if (__POWERED_BY_WUJIE__ && wujieAppList[fileName]) {
				return wujieAppList[fileName].defaultWidth;
			} else {
				return rendererComponents.windowWidth || '500';
			}
		});
		const styleHeight = computed(() => {
			if (__POWERED_BY_WUJIE__ && wujieAppList[fileName]) {
				return wujieAppList[fileName].defaultHeight;
			} else {
				return rendererComponents.windowHeight || '500';
			}
		});
		const customHeader = computed(() => {
			if (__POWERED_BY_WUJIE__ && wujieAppList[fileName]) {
				return wujieAppList[fileName].customHeader;
			} else {
				return rendererComponents.customHeader ? rendererComponents.customHeader : false;
			}
		});
		store.trackProgram(that); // 将程序推入进程
		function closeFn() {
			try {
				store.triggerProgram(that); // 将程序移除栈
				that.close();
			} catch (error) {
				console.log(error);
			}
		}
		const isMove = ref(false);
		const transfer = reactive({
			clientX: window.innerWidth / 2 - styleWidth.value / 2,
			clientY: window.innerHeight / 2 - styleHeight.value / 2,
			offsetX: 0,
			offsetY: 0,
		});
		function mouseDown(e: any) {
			if (e.target.dataset?.move) {
				if (e.target.tagName === 'IMG') return;
				store.trackProgram(that); // 将程序推入进程
				isMove.value = true;
				const { clientX, clientY, layerX, layerY } = e;
				transfer.clientX = clientX;
				transfer.clientY = clientY;
				transfer.offsetX = layerX;
				transfer.offsetY = layerY;
			}
		}
		function mouseMove(e: any) {
			if (isMove.value) {
				const { clientX, clientY } = e;
				transfer.clientX = clientX;
				transfer.clientY = clientY;
			}
		}
		function mouseUp() {
			isMove.value = false;
		}
		const positionLeft = computed(() => {
			return `${transfer.clientX - transfer.offsetX}px`;
		});
		const positionTop = computed(() => {
			return `${transfer.clientY - transfer.offsetY}px`;
		});
		const isActive = computed(() => {
			// 如果应用名一样，则认为是一样
			if (store.activeProgram) {
				return that.programName === store.activeProgram.programName;
			}
			return false;
		});
		if (customHeader) {
			// 将拖拽方法放置全局
			this.mouseDown = mouseDown;
			this.mouseMove = mouseMove;
			this.mouseUp = mouseUp;
		}
		return {
			setup() {
				const wujie = resolveComponent('WujieVue');
				// 是否启用wujie
				if (__POWERED_BY_WUJIE__ && wujieAppList[fileName]) {
					// 判断wujieAppList中是否存在该程序
					const { setupApp } = WujieVue;
					setupApp({ name: wujieAppList[fileName].name, url: wujieAppList[fileName].url, exec: true });
					rendererComponents = h(wujie, {
						props: {
							appProgramStore: store,
						},
						width: `${wujieAppList[fileName].defaultWidth}px`,
						height: `${wujieAppList[fileName].defaultHeight}px`,
						alive: wujieAppList[fileName].alive,
						sync: wujieAppList[fileName].sync,
						name: wujieAppList[fileName].name,
						url: wujieAppList[fileName].url,
					});
				}
			},
			render: (ctx: any) => {
				return (
					<div
						class={{ pop_window: true, pop_window_active: isActive.value, window_border: !customHeader.value }}
						style={{ left: positionLeft.value, top: positionTop.value, width: `${styleWidth.value}px`, height: `${styleHeight.value}px` }}
						onMouseup={!customHeader.value ? mouseUp : () => {}}
						onMousedown={withModifiers(mouseDown, ['left'])}
						onMousemove={mouseMove}
					>
						{!customHeader.value && (
							<div class={{ pop_window_tools: true, active_program: isActive.value }}>
								<span class="pop_window_tools_left desabled-copy" data-move={true}>
									{fileName}
								</span>
								<div class="pop_window_tools_right">
									<img class="desabled-drag" src={new URL('@/assets/close.png', import.meta.url).href} onClick={closeFn} />
								</div>
							</div>
						)}
						<div class="pop_window_content">
							<rendererComponents></rendererComponents>
						</div>
					</div>
				);
			},
		};
	}
}
