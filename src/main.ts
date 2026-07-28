import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import KeyFilter from 'primevue/keyfilter';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';

const MyPreset = definePreset(Aura, {
  primitive: {
    core: {
      red: '#e4002b', // Secondary brand color
      blue: '#41b6e6', // Primary brand color
    },
    sec: {
      blue: {
        100: '#e1f3f8',
        300: '#a4d5ee',
        500: '#0092d1',
        700: '#0075bb',
        900: '#005899',
      },
      gray: { 100: '#f1f1f1', 300: '#d9d9d9', 600: '#b3b3b3', 900: '#4d4d4d' },
      red: { 100: '#fbd9df', 300: '#e59393', 600: '#cc393e', 900: '#981b1e' },
      green: { 100: '#e7f4e4', 300: '#94bfa2', 600: '#4aa564', 900: '#2e8540' },
      gold: { 100: '#fff1d2', 300: '#fad980', 600: '#f9c642', 900: '#fdb81e' },
    },
    bg: {
      1: '#dce4ef',
      2: '#e4e2e0',
      3: '#d6d7d9',
      4: '#aeb0b5',
      5: '#5b616b',
      6: '#494440',
      7: '#323a45',
      8: '#112e51',
    },
  },
  semantic: {
    primary: {
      50: '{primitive.sec.blue.100}',
      100: '{primitive.sec.blue.100}',
      200: '{primitive.sec.blue.300}',
      300: '{primitive.sec.blue.300}',
      400: '{primitive.core.blue}',
      500: '{primitive.core.blue}',
      600: '{primitive.sec.blue.500}',
      700: '{primitive.sec.blue.700}',
      800: '{primitive.sec.blue.700}',
      900: '{primitive.sec.blue.900}',
      950: '{primitive.sec.blue.900}',
    },
  },
});

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue, components, utilities',
      },
    },
  },
});

app.use(createPinia());

app.use(router);

app.directive('tooltip', Tooltip);
app.use(ToastService);

app.directive('keyfilter', KeyFilter);

app.mount('#app');
