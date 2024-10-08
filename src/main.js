import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import FlatPickr from 'vue-flatpickr-component';

import M from '@materializecss/materialize'; // Temporary fix until I figure out why I can't import a (custom) minified file directly
import '@materializecss/materialize/sass/materialize.scss';

import dates from './helpers/dates.js';
import toasts from './helpers/toasts.js';

import Spinner from './components/Spinner.vue';

import * as Sentry from '@sentry/browser';
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

	if (process.env.NODE_ENV === 'production') {
		Sentry.init({
			dsn: "https://5477b015c06e440ab91805dd9dad31f7@o885721.ingest.sentry.io/5837739",
			integrations: [
				new VueIntegration({ Vue: app }), // Vue integration remains similar
				new Sentry.BrowserTracing() // The Tracing integration remains, but its configuration may be more flexible in v8.
			],
			// Note: tracingOptions has been replaced by other configurations in v8.
			// For example, trackComponents now needs to be configured in a different way.
			tracesSampleRate: 0.5, // Adjust tracing sample rate as needed
			// You might also want to add other performance monitoring settings here.
		});
	}

app.mount('#app');