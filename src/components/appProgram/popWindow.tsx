/**全局封装组件的一些步骤 */
import { __POWERED_BY_WUJIE__, wujieAppList } from '@/config';
import bus from '@/eventBus';
import axios from '@/plugin/service';
import processes from '@/stores/processes';
import { WindowType, type FilesResultType } from '@/types/popWindow';
import { exportFiles, getProgramName } from '@/utils';
import { computed, createApp, h, nextTick, onMounted, reactive, ref, resolveComponent, withModifiers } from 'vue';
import WujieVue from 'wujie-vue3';
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
	public windowStatus: WindowType = WindowType.DEFAULT;
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
			app.use(WujieVue);
		}
		app.config.globalProperties.$axios = axios;
		app.mount(this.__el__);
	}
	// 关闭
	private close() {
		// 卸载节点即可
		document.body.removeChild(this.__el__);
	}
	// 最小化
	minimizeWindow() {
		setTimeout(() => {
			this.__el__.style.display = 'none';
		}, 500);
		this.windowStatus = WindowType.MINIMIZE;
	}
	// 恢复正常窗口
	defaultWindow() {
		this.__el__.style.display = 'block';
		this.windowStatus = WindowType.DEFAULT;
	}
	// 全屏
	maximizeWindow() {
		this.windowStatus = WindowType.MAXIMIZE;
	}
	private renderer(fileName: string) {
		const that = this;
		return {
			setup() {
				const store = processes();
				let rendererComponents: any;
				const styleWidth = ref<string>('0');
				const styleHeight = ref<string>('0');
				const styleScale = ref<number>(1);
				const popWindowDom = ref<HTMLElement | null>(null);
				onMounted(() => {
					// 注册bus事件
					bus.on('WindowChange', (type: any) => {
						initStyleWidthHeight(type);
						nextTick(() => {
							//缩小
							initTransfer(type);
						});
						that.defaultWindow();
					});
				});
				if (!that.isWujieAPP) {
					rendererComponents = loadComponents(that.programName);
				}

				store.trackProgram(that); // 将程序推入进程// 关闭窗口
				// 是否启用wujie
				if (that.isWujieAPP && wujieAppList[fileName]) {
					const wujie = resolveComponent('WujieVue');
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
				initStyleWidthHeight();
				// 初始化宽高
				function initStyleWidthHeight(type: WindowType = WindowType.DEFAULT) {
					if (type === WindowType.DEFAULT) {
						styleWidth.value = that.isWujieAPP ? wujieAppList[fileName].defaultWidth : rendererComponents.windowWidth || '500';
						styleHeight.value = that.isWujieAPP ? wujieAppList[fileName].defaultHeight : rendererComponents.windowHeight || '500';
						styleScale.value = 1;
						return;
					} else if (type === WindowType.MAXIMIZE) {
						styleWidth.value = window.innerWidth.toString();
						styleHeight.value = (window.innerHeight - 130).toString(); // 减去底部栏
						styleScale.value = 1;
					} else if (type === WindowType.MINIMIZE) {
						styleWidth.value = '0';
						styleHeight.value = '0';
						styleScale.value = 0.5;
					}
				}
				// 初始transfer
				function initTransfer(type: WindowType) {
					if (type === WindowType.DEFAULT) {
						transfer.clientX = window.innerWidth / 2 - Number(styleWidth.value) / 2;
						transfer.clientY = window.innerHeight / 2 - Number(styleHeight.value) / 2;
						transfer.offsetX = 0;
						transfer.offsetY = 0;
					} else if (type === WindowType.MAXIMIZE) {
						transfer.clientX = 0;
						transfer.clientY = 0;
						transfer.offsetX = 0;
						transfer.offsetY = 0;
					} else if (type === WindowType.MINIMIZE) {
						transfer.clientX = window.innerWidth / 2;
						transfer.clientY = window.innerHeight;
						transfer.offsetX = 0;
						transfer.offsetY = 0;
					}
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
					clientX: window.innerWidth / 2 - Number(styleWidth.value) / 2,
					clientY: window.innerHeight / 2 - Number(styleHeight.value) / 2,
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
							initStyleWidthHeight(WindowType.MINIMIZE);
							initTransfer(WindowType.MINIMIZE);
							that.minimizeWindow();
							break;
						case '2':
							if (that.windowStatus === WindowType.DEFAULT) {
								// 放大
								initTransfer(WindowType.MAXIMIZE);
								initStyleWidthHeight(WindowType.MAXIMIZE);
								that.maximizeWindow();
							} else {
								initStyleWidthHeight(WindowType.DEFAULT);
								nextTick(() => {
									//缩小
									initTransfer(WindowType.DEFAULT);
								});
								that.defaultWindow();
							}
							break;
					}
				}
				return () => (
					<div
						class={{ pop_window: true, pop_window_active: isActive.value, window_border: !customHeader.value }}
						style={{
							left: positionLeft.value,
							top: positionTop.value,
							width: `${styleWidth.value}px`,
							height: `${styleHeight.value}px`,
							scale: styleScale.value,
						}}
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
						<div class="pop_window_content">
							<rendererComponents></rendererComponents>
						</div>
					</div>
				);
			},
		};
	}
}
