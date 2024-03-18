import processes from '@/stores/processes';
import { WindowType } from '@/types/popWindow';

// 拖拽指令
export const dragDirective = {
	mounted(el: HTMLElement) {
		const store = processes();
		const mouseDown = store.activeProgram.mouseDown; // 获取拖拽方法
		const mouseMove = store.activeProgram.mouseMove; // 获取拖拽方法
		const mouseUp = store.activeProgram.mouseUp; // 获取拖拽方法
		el.onmousedown = (e: MouseEvent) => {
			mouseDown(e);
		};
		el.onmousemove = (e: MouseEvent) => {
			mouseMove(e);
		};
		el.onmouseup = (e: MouseEvent) => {
			mouseUp(e);
		};
	},
};

// 应用打开指令
export const programDirective = {
	mounted(el: HTMLElement) {
		const store = processes();
		const { defaultWidth, defaultHeight } = store.activeProgram.__style__;
		el.style.width = `${defaultWidth}px`;
		el.style.height = `${defaultHeight}px`;
		el.style.scale = '1';
		store.activeProgram.transitionInstance = new CreateTransition(el);
	},
	updated(el: HTMLElement, binding: any) {
		if (binding.oldValue !== binding.value) {
			const { value } = binding;
			const store = processes();
			// 状态更新了
			if (value === WindowType.MINIMIZE) {
				// 窗口最小化
				store.activeProgram.transitionInstance.init();
			} else if (value === WindowType.DEFAULT) {
				// 恢复窗口
				store.activeProgram.transitionInstance.recoverData();
			} else if (value === WindowType.MAXIMIZE) {
				// 窗口最大化
				store.activeProgram.transitionInstance.max();
			}
		}
	},
};

// 创建过渡过程
export class CreateTransition {
	public originWidth: string = '';
	public originHeight: string = '';
	public originTop: string = '';
	public originLeft: string = '';
	constructor(public target: HTMLElement) {
		// 创建过渡过程
		this.cache();
	}
	// 缓存当前属性
	cache() {
		this.originWidth = this.target.style.width;
		this.originHeight = this.target.style.height;
		this.originTop = this.target.style.top;
		this.originLeft = this.target.style.left;
	}
	// 重置
	init() {
		this.cache();
		this.target.style.transition = 'all 0.5s';
		this.target.style.width = '0px';
		this.target.style.height = '0px';
		this.target.style.scale = '0';
		this.target.style.top = `${window.innerHeight - 130}px`;
		this.target.style.left = `${window.innerWidth / 2}px`;
		this.target.style.opacity = '0';
	}
	// 恢复
	recoverData() {
		this.target.style.transition = 'all 0.5s';
		this.target.style.width = this.originWidth;
		this.target.style.height = this.originHeight;
		this.target.style.scale = '1';
		this.target.style.top = this.originTop;
		this.target.style.left = this.originLeft;
		this.target.style.opacity = '1';
	}
	max() {
		this.cache();
		this.target.style.transition = 'all 0.5s';
		this.target.style.top = '0px';
		this.target.style.left = '0px';
		this.target.style.width = `${window.innerWidth}px`;
		this.target.style.height = `${window.innerHeight - 130}px`;
		setTimeout(() => {
			this.target.style.transition = '';
		}, 500);
	}
}
