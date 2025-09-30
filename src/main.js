import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import FlatPickr from 'vue-flatpickr-component';

import 'materialize-css/sass/materialize.scss';
/* eslint 'no-unused-vars': 'off' */
import M from 'materialize-css';

import dates from './helpers/dates.js';
import toasts from './helpers/toasts.js';

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
				this.footerTime = `${this.dtFull(new Date())}z`;
			}, 1000);
		},
	})
	.component('Spinner', Spinner);

app.mount('#app');
