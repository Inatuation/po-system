/**全局封装组件的一些步骤 */
import { __POWERED_BY_WUJIE__, wujieAppList } from '@/config';
import axios from '@/plugin/service';
import processes from '@/stores/processes';
import { WindowType, type FilesResultType } from '@/types/popWindow';
import { exportFiles, getProgramName } from '@/utils';
import { programDirective } from '@/utils/directives';
import microApp from '@micro-zoe/micro-app';
import { computed, createApp, defineComponent, h, reactive, ref, resolveComponent, withModifiers } from 'vue';
import './popWindow.scss';

function loadComponents(programName: string) {
	const files: Array<FilesResultType> = exportFiles();
	let result: Array<FilesResultType> = [];
	if (files && files.length) {
		result = files.filter((filesObj: FilesResultType) => filesObj.programName === programName);
	}
	return result[0].renderer;
}

export default class PopWindow {
	public fileName: string;
	public mouseDown(payload: MouseEvent) {}
	public mouseMove(payload: MouseEvent) {}
	public mouseUp(payload: MouseEvent) {}
	public __el__: HTMLElement;
	public windowStatus = ref<WindowType>(WindowType.DEFAULT);
	public __style__: any = {
		defaultWidth: 0, // 默认宽
		defaultHeight: 0, // 默认高
	};
	public transitionInstance: any = {};
	constructor(
		public programName: string,
		public logo: string,
		public isWujieAPP: boolean = false
	) {
		this.fileName = getProgramName(programName);
		this.__el__ = document.createElement('div');
	}
	// 打开
	open() {
		this.__el__.className = `__app_program_${this.fileName}`;
		document.body.appendChild(this.__el__);
		const app = createApp(this.renderer(this.fileName), {
			msg: this.fileName,
		});
		if (__POWERED_BY_WUJIE__ && wujieAppList[this.fileName]) {
			// app.use(WujieVue);
		}
		app.config.globalProperties.$axios = axios;
		app.mount(this.__el__);
	}
	// 关闭
	private close() {
		// 卸载节点即可
		document.body.removeChild(this.__el__);
	}
	private renderer(fileName: string) {
		const that = this;
		return defineComponent({
			directives: {
				programDirective,
			},
			setup() {
				const store = processes();
				let rendererComponents: any;
				const popWindowDom = ref<HTMLElement | null>(null);
				if (!that.isWujieAPP) {
					rendererComponents = loadComponents(that.programName);
				}

				store.trackProgram(that); // 将程序推入进程// 关闭窗口
				// 是否启用wujie
				if (that.isWujieAPP && wujieAppList[fileName]) {
					const app = resolveComponent('micro-app');
					rendererComponents = h(app, {
						name: wujieAppList[fileName].name,
						url: wujieAppList[fileName].url,
						iframe: true,
					});
					microApp.setGlobalData({
						appProgramStore: store,
						defaultWidth: wujieAppList[fileName].defaultWidth,
						defaultHeight: wujieAppList[fileName].defaultHeight,
					});
					// const wujie = resolveComponent('micro-app');
					// // 判断wujieAppList中是否存在该程序
					// const { setupApp } = WujieVue;
					// setupApp({ name: wujieAppList[fileName].name, url: wujieAppList[fileName].url, exec: true });
					// rendererComponents = h(wujie, {
					// 	props: {
					// 		appProgramStore: store,
					// 	},
					// 	width: `${wujieAppList[fileName].defaultWidth}px`,
					// 	height: `${wujieAppList[fileName].defaultHeight}px`,
					// 	alive: wujieAppList[fileName].alive,
					// 	sync: wujieAppList[fileName].sync,
					// 	name: wujieAppList[fileName].name,
					// 	url: wujieAppList[fileName].url,
					// });
				}
				initStyleWidthHeight();
				// 初始化宽高
				function initStyleWidthHeight(type: WindowType = WindowType.DEFAULT) {
					that.__style__.defaultWidth = that.isWujieAPP ? wujieAppList[fileName].defaultWidth : rendererComponents.windowWidth || '500';
					that.__style__.defaultHeight = that.isWujieAPP ? wujieAppList[fileName].defaultHeight : rendererComponents.windowHeight || '500';
				}
				const customHeader = computed(() => {
					if (__POWERED_BY_WUJIE__ && wujieAppList[fileName]) {
						return wujieAppList[fileName].customHeader;
					} else {
						return rendererComponents.customHeader ? rendererComponents.customHeader : false;
					}
				});
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
					clientX: window.innerWidth / 2 - Number(that.__style__.defaultWidth) / 2,
					clientY: window.innerHeight / 2 - Number(that.__style__.defaultHeight) / 2,
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
				if (customHeader) {
					// 将拖拽方法放置全局
					that.mouseDown = mouseDown;
					that.mouseMove = mouseMove;
					that.mouseUp = mouseUp;
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
				function clickTools(e: any) {
					const { type } = e.target.dataset;
					switch (type) {
						case '0':
							//关闭
							closeFn();
							break;
						case '1':
							// 最小化
							that.windowStatus.value = WindowType.MINIMIZE;
							break;
						case '2':
							// 放大/缩小
							that.windowStatus.value = that.windowStatus.value === WindowType.DEFAULT ? WindowType.MAXIMIZE : WindowType.DEFAULT;
							break;
					}
				}
				return () => (
					<div
						class={{ pop_window: true, pop_window_active: isActive.value, window_border: !customHeader.value }}
						style={{
							left: positionLeft.value,
							top: positionTop.value,
						}}
						v-programDirective={that.windowStatus.value}
						onMouseup={!customHeader.value ? mouseUp : () => {}}
						onMousedown={withModifiers(mouseDown, ['left'])}
						onMousemove={mouseMove}
						ref={popWindowDom}
					>
						{!customHeader.value && (
							<div class={{ pop_window_tools: true, active_program: isActive.value }}>
								<div class="pop_window_tools_left" onClick={clickTools}>
									<i class="iconfont" data-type="0"></i>
									<i class="iconfont" data-type="1"></i>
									<i class="iconfont" data-type="2"></i>
								</div>
								<span class="pop_window_tools_right desabled-copy" data-move={true}>
									{fileName}
								</span>
							</div>
						)}
						<div class={{ pop_window_content: !that.isWujieAPP }}>
							<rendererComponents></rendererComponents>
						</div>
					</div>
				);
			},
		});
	}
}
