import { createApp } from 'vue';
import FlatPickr from 'vue-flatpickr-component';
import App from './App.vue';
import router from './router';
import store from './store';

import M from 'materialize-css';
import 'materialize-css/sass/materialize.scss';

import dates from './helpers/dates.js';
import toasts from './helpers/toasts.js';

import SmallSpinner from './components/SmallSpinner.vue';
import Spinner from './components/Spinner.vue';

const app = createApp(App)
	.use(store)
	.use(router)
	.mixin({
		methods: {
			...dates,
			...toasts,
		},
	});

app
	.component('flat-pickr', FlatPickr)

	.mixin({
		created() {
			const { title } = this.$options;
			if (title) {
				document.title = `${typeof title === 'function' ? title.call(this) : title} | Chicago ARTCC`;
			}
		},
		methods: {
			setTitle(title) {
				document.title = `${typeof title === 'function' ? title.call(this) : title} | Chicago ARTCC`;
			},
		},
	})
	.mixin({
		data() {
			return {
				footerTime: null,
			};
		},
		created() {
			setInterval(() => {
				this.footerTime = `${this.dtFull(new Date())}`;
			}, 1000);
		},
	})
	.component('Spinner', Spinner)
	.component('SmallSpinner', SmallSpinner);

app.config.globalProperties.$M = M;

app.mount('#app');
