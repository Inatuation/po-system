import axios from 'axios';
import { serverConfig } from '../config';

const axiosInstance = axios.create({
	baseURL: `${serverConfig.host}:${serverConfig.port}`,
	timeout: 5000,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
	withCredentials: true,
});

// 请求拦截
axiosInstance.interceptors.request.use(
	(config) => {
		const timestamp = Math.floor(Date.now() / 1000);
		config.params = {
			...config.params,
			timestamp,
		};
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// 相应拦截
axiosInstance.interceptors.response.use(
	(response) => {
		if (response.data.code === 401) {
			console.log('重新登陆');
			return Promise.reject(response);
		}
		if (response.data.code === 200) {
			const result = response.data?.result || response.data?.data || response.data;
			console.log('接口返回值', result);
			return result;
		}
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default axiosInstance;
