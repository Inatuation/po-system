import louChatStore from '@/stores/louChat';
import { SideShowMode } from '@/types/louChat';
import { dragDirective } from '@/utils/directives';
import { defineComponent, ref } from 'vue';
import './index.scss';

export default defineComponent({
	directives: {
		dragDirective,
	},
	setup() {
		const toolsList = ref([
			{
				iconfont: 'icon-dangqianhuihua',
				value: SideShowMode.CHAT,
			},
			{
				iconfont: 'icon-zuidapaiduishu',
				value: SideShowMode.CONNECT,
			},
		]);
		const sotre = louChatStore();
		// 点击tools
		function clickTools(item: any) {
			sotre.changeSideModel(item.value);
		}
		return () => (
			<div class="chat_tools" data-move={true} v-dragDirective={true}>
				<div class="tools_my_avatar">
					<img class="desabled-drag" src={new URL('@/assets/louChat/default_avatar.jpg', import.meta.url).href} />
				</div>
				<div class="tools_list">
					{toolsList.value.map((item) => {
						return (
							<div class="list_item">
								<span
									class={{ iconfont: true, [item.iconfont]: true, activeIcon: sotre.sideModel === item.value }}
									onClick={() => clickTools(item)}
								></span>
							</div>
						);
					})}
				</div>
			</div>
		);
	},
});
