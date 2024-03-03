import processes from '@/stores/processes';
import { getProgramName } from '@/utils';
import { defineComponent, computed } from 'vue';
import './index.scss';

export default defineComponent({
	setup() {
		const store = processes();
		const activeProgram = computed(() => {
			return store.activeProgram?.programName || '';
		});
		function clickBar(e: any) {
			store.toggleProgram(e.target.dataset.programname);
		}
		return () => (
			<div class="footer_tools">
				<div class="footer_tools_start_button desabled-copy">
					<img src={new URL('@/assets/windows.png', import.meta.url).href} />
					<span>开始</span>
				</div>
				<div class="footer_tools_task_bar desabled-copy" onClick={clickBar}>
					{() => {
						const elements: any = [];
						store.processesMap.forEach((program) => {
							elements.push(
								<div
									data-programname={program.programName}
									class={{ tools_bar_item: true, tools_bar_active_item: activeProgram.value === program.programName }}
								>
									{getProgramName(program.programName)}
								</div>
							);
						});
						return elements;
					}}
				</div>
			</div>
		);
	},
});
