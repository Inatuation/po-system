import AppPogram from '@/components/appProgram';
import footerTools from '@/components/footerTools';
import { doubleClick, exportFiles } from '@/utils';
import { defineComponent, reactive, ref } from 'vue';
import './index.scss';
import type { FilesResultType } from '@/types/popWindow';

export default defineComponent({
	components: { footerTools },
	setup() {
		const files = exportFiles();
		const activeIconName = ref('');
		let filesList: Array<FilesResultType> = reactive([]);
		if (files.length) {
			filesList = files.map((file) => {
				return {
					name: file.name,
					logo: file.logo,
				}
			});
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
					{filesList.map((item) => (
						<div class={{ desktop_icon: true, desabledCopy: true, activeIcon: activeIconName.value === item.name }}>
							<img src={item.logo ? item.logo : new URL('@/assets/desktop/markdown.png', import.meta.url).href} data-item={item.name} />
							<span class="program_name_span" data-item={item.name}>
								{item.name}
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
