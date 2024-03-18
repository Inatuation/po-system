import dock from '@/components/dock';
import footerTools from '@/components/footerTools';
import { changeTheme } from '@/utils/theme';
import { ElContainer, ElHeader, ElMain, ElSwitch } from 'element-plus';
import { Fragment, defineComponent, ref } from 'vue';
import { useAnime } from '../../utils/useAnime';
import './index.scss';

export default defineComponent({
	components: { footerTools, dock },
	setup() {
		const theme = ref<boolean>(false);
		const nameContext = ref<HTMLInputElement | null>(null);
		const topContext = ref<HTMLInputElement | null>(null);
		const bottomContext = ref<HTMLInputElement | null>(null);
		const box = ref<HTMLInputElement | null>(null);

		const switchSlots = {
			'active-action': () => <span class="custom-active-action">T</span>,
			'inactive-action': () => <span class="custom-inactive-action">F</span>,
		};
		useAnime({
			targets: box,
			rotate: {
				value: 360,
				duration: 1800,
				easing: 'easeInOutSine',
			},
			scale: {
				value: 2,
				duration: 1600,
				delay: 800,
				easing: 'easeInOutQuart',
			},
			borderRadius: ['0%', '50%'],
			easing: 'easeInOutQuad',
			delay: 250,
		});
		useAnime({
			targets: topContext,
			translateY: [-600, 0],
			duration: 1000,
			opacity: [0, 1],
			delay: 1200,
		});
		useAnime({
			targets: nameContext,
			translateX: [-600, 0],
			duration: 600,
			easing: 'easeInOutQuad',
			opacity: [0, 1],
		});
		useAnime({
			targets: bottomContext,
			delay: 600,
			opacity: [0, 1],
		});
		return () => (
			<Fragment>
				<ElContainer class="desktop">
					<ElHeader>
						<ElSwitch v-model={theme.value} v-slots={switchSlots} onChange={() => changeTheme()}></ElSwitch>
					</ElHeader>
					<ElMain>
						<div class="introduce desabled-copy">
							<img src={new URL('@/assets/desktop/logo.jpeg', import.meta.url).href} class="in_logo" ref={box} />
							<div ref={topContext} class="in_top">
								博约而进取｜厚积而薄发
							</div>
							<div ref={nameContext} class="in_content">
								破写代码的
							</div>
							<div ref={bottomContext} class="in_bottom">
								WRITE CODER “PO”
							</div>
						</div>
						<div class="desktop_footer">
							<footerTools />
						</div>
					</ElMain>
				</ElContainer>
				<dock />
			</Fragment>
		);
	},
});
