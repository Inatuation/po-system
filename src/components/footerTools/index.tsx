import bus from '@/eventBus';
import dockStore from '@/stores/dockStore';
import processes from '@/stores/processes';
import { WindowType } from '@/types/popWindow';
import { defineComponent } from 'vue';
import './index.scss';

export default defineComponent({
	setup() {
		const store = processes();
		const dockStoreInstance = dockStore();
		function clickMenu() {
			dockStoreInstance.openDock();
		}
		function clickProgramBar(e: any) {
			if (store.activeProgram.windowStatus === WindowType.MINIMIZE) {
				bus.emit('WindowChange', WindowType.DEFAULT);
			}
			store.toggleProgram(e.target.dataset.programname);
		}
		return () => (
			<div class="footer_tools">
				<div class="footer_tools_flex_box">
					<div class="footer_tools_menu_bar" onClick={clickMenu}>
						<img src={new URL('@/assets/desktop/menu.png', import.meta.url).href} alt="菜单" />
					</div>
					<div class="footer_tools_task_bar desabled-copy" onClick={clickProgramBar}>
						{() => {
							const elements: any = [];
							store.processesMap.forEach((program) => {
								elements.push(
									<div data-programname={program.programName} class="tools_bar_item" data-programName={program.programName}>
										<img src={new URL(program.logo, import.meta.url).href} alt={program.programName} data-programName={program.programName} />
									</div>
								);
							});
							return elements;
						}}
					</div>
				</div>
			</div>
		);
	},
});
