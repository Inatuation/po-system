import { MessageOrigin, type Message } from '@/types/louChat';
import { defineComponent } from 'vue';
import './index.scss';

export default defineComponent({
	props: {
		messageList: {
			type: Object as () => Message[],
			default: () => {
				return [];
			},
		},
	},
	setup(props) {
		return () => {
			const leftTemplate = (item: Message) => (
				<div class="bubble_item">
					<div class="float float_left">
						<img class="bubble_avatar" src={new URL('@/assets/louChat/default_avatar.jpg', import.meta.url).href} />
						<div class="bubble_content">{item.data}</div>
					</div>
				</div>
			);
			const rightTemplate = (item: Message) => (
				<div class="bubble_item">
					<div class="float float_right">
						<div class="bubble_content">{item.data}</div>
						<img class="bubble_avatar" src={new URL('@/assets/louChat/default_avatar.jpg', import.meta.url).href} />
					</div>
				</div>
			);
			return (
				<div class="message_block">
					{props.messageList?.map((item: Message) => {
						return item.origin === MessageOrigin.ME ? rightTemplate(item) : leftTemplate(item);
					})}
				</div>
			);
		};
	},
});
