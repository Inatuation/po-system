import AppPogram from '@/components/appProgram';
import footerTools from '@/components/footerTools';
import { doubleClick, exportFiles } from '@/utils';
import { defineComponent, reactive, ref } from 'vue';
import './index.scss';

export default defineComponent({
	components: { footerTools },
	setup() {
		const files = exportFiles();
		const activeIconName = ref('');
		let filesList: Array<string> = reactive([]);
		if (files.length) {
			filesList = files.map((file) => file.name);
		}
		function open(data: any) {
			const { item } = data.target.dataset;
			activeIconName.value = item;
			doubleClick(() => {
				AppPogram.openProgram(item);
			});
		}
		return () => (
			<div class="desktop">
				<div class="desktop_content" onClick={open}>
					{filesList.map((name) => (
						<div class={{ desktop_icon: true, desabledCopy: true, activeIcon: activeIconName.value === name }}>
							<img src={new URL('@/assets/desktop/markdown.png', import.meta.url).href} data-item={name} />
							<span class="program_name_span" data-item={name}>
								{name}
							</span>
						</div>
					))}
				</div>
				<div class="desktop_footer">
					<footerTools />
				</div>
			</div>
		);
	},
});
