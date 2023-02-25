import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import FlatPickr from 'vue-flatpickr-component';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

import M from '@materializecss/materialize'; // Temporary fix until I figure out why I can't import a (custom) minified file directly
import '@materializecss/materialize/sass/materialize.scss';

import dates from './helpers/dates.js';
import toasts from './helpers/toasts.js';

import Spinner from './components/Spinner.vue';

import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
import { Vue as VueIntegration } from '@sentry/integrations';

const app = createApp(App)
	.use(store)
	.use(router)
	.mixin({
		methods: {
			...dates,
			...toasts
		}
	})

	app.component('flat-pickr', FlatPickr)

	.mixin({
		created() {
			const { title } = this.$options;
			if(title) {
				document.title = `${(typeof title === 'function') ? title.call(this) : title} | Chicago ARTCC`;
			}
		},
		methods: {
			setTitle(title) {
				document.title = `${(typeof title === 'function') ? title.call(this) : title} | Chicago ARTCC`;
			}
		}
	})
	.mixin({
		data() {
			return {
				footerTime: null
			};
		},
		created() {
			setInterval(() => {
				this.footerTime = `${this.dtFull(new Date())}z`;
			}, 1000);
		}
	})
	.component('Spinner', Spinner);


app.mount('#app');