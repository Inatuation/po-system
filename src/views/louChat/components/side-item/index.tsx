import type { connectUser } from '@/types/louChat';
import { defineComponent } from 'vue';
import './index.scss';

export default defineComponent({
	props: {
		userData: {
			type: Object as () => connectUser,
			default: () => ({}),
		},
		idx: {
			type: Number,
			default: 0,
		},
		showFlag: {
			type: Boolean,
			default: false,
		},
		currentId: {
			type: Number,
			default: 0,
		},
	},
	setup(props) {
		return () => (
			<div class={{ side_item: true, desabledCopy: true, activeCur: props.userData.userId === props.currentId }} data-idx={props.idx}>
				<div class="side_item_box">
					<div class="side_item_avatar">
						<img class="desabled-drag" src={new URL('@/assets/louChat/default_avatar.jpg', import.meta.url).href} />
						{props.showFlag && props.userData.unReadCount && <span class="un_read_flag">{props.userData.unReadCount}</span>}
					</div>
					<div class="side_item_info">
						<div class="item_top">
							<div class="item_name ellipsis">{props.userData.name}</div>
							<div class="item_timer">2023/12/07</div>
						</div>
						<div class="item_bottom ellipsis">
							<span>====================================</span>
						</div>
					</div>
				</div>
			</div>
		);
	},
});
