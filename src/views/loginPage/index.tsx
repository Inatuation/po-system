import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import './index.scss';
export default defineComponent({
	name: 'LoginPage',
	setup() {
		const router = useRouter();
		function clickEvent() {
			console.log(router);
			router.push('/desktop');
		}
		return () => (
			<div class="loginPage">
				<img class="loginPage-bg" src={new URL('@/assets/1.png', import.meta.url).href} onClick={clickEvent} />
			</div>
		);
	},
});
