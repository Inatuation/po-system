import 'element-plus/theme-chalk/dark/css-vars.css';
import 'element-plus/theme-chalk/index.css'; // 引入 ElementPlus 组件样式
import './assets/main.css';

import axios from '@/plugin/service';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import '@common/iconfont/iconfont.css';
import '@common/iconfont/iconfont.js';
import microApp from '@micro-zoe/micro-app';
import App from './App';
import router from './router';

const app = createApp(App);
app.config.globalProperties.$axios = axios;
app.use(createPinia());
app.use(router);
microApp.start();

app.mount('#app');
