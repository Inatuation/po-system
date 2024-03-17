import dockStore from '@/stores/dockStore';
import type { FilesResultType } from '@/types/popWindow';
import { exportFiles } from '@/utils';
import { ElCol, ElRow } from 'element-plus';
import { Transition, defineComponent, reactive } from 'vue';
import AppPogram from '../appProgram';
import './index.scss';

export default defineComponent({
	setup() {
		const files = exportFiles();
		const dockStoreInstance = dockStore();
		let filesList: Array<FilesResultType> = reactive([]);
		if (files.length) {
			filesList = files.map((file: any) => {
				return {
					programName: file.programName,
					logo: file.logo,
					WUJIEAPP: file.WUJIEAPP || false,
				};
			});
		}
		function open(data: any) {
			const { item } = data.target.dataset;
			if (item) {
				const findIndex = filesList.findIndex((file) => file.programName === item);
				AppPogram.openProgram(filesList[findIndex]);
			}
			dockStoreInstance.closeDock();
		}
		return () => (
			<Transition>
				<div v-show={dockStoreInstance.show} class="dock" onClick={open}>
					<ElRow gutter={0}>
						{filesList.map((item) => (
							<ElCol span={4}>
								<div class="program_item desabled-copy">
									<img src={item.logo} data-item={item.programName} />
									<span class="program_name_span" data-item={item.programName}>
										{item.programName}
									</span>
								</div>
							</ElCol>
						))}
					</ElRow>
				</div>
			</Transition>
		);
	},
});
