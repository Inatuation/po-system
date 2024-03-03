import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus';
import { defineComponent, getCurrentInstance, reactive } from 'vue';
import './index.scss';

export default defineComponent({
	name: 'login',
	components: { ElInput, ElForm, ElFormItem, ElButton },
	emits: ['loginSuccess'],
	setup(props, { emit }) {
		const { proxy } = getCurrentInstance() as any;
		const loginData = reactive({
			userName: '',
		});
		async function login() {
			try {
				const res = await proxy.$axios.post('login', {
					userName: loginData.userName,
				});
				if (res) {
					// 登陆成功
					console.log('登陆成功');
					emit('loginSuccess', res);
				}
			} catch (err) {}
		}
		return () => (
			<div class="chat_login_block">
				<el-form model={loginData} label-width="80px">
					<el-form-item label="用户名:">
						<el-input v-model={loginData.userName} />
					</el-form-item>
					<el-form-item>
						<ElButton onClick={login}>登陆</ElButton>
					</el-form-item>
				</el-form>
			</div>
		);
	},
});
