<script setup lang="ts">
import NotificationsPanel from '@/components/NotificationsPanel.vue';
import { useAuth } from '@/composables/useAuth';
import { notificationService } from '@/services/notification/notification.service';
import type { INotificationResponse } from '@/services/notification/notification.types';
import { useUserStore } from '@/stores/user';
import { getS3Url } from '@/utils/uriHelper';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Badge from 'primevue/badge';
import Menu from 'primevue/menu';
import Menubar from 'primevue/menubar';
import Popover from 'primevue/popover';
import {
  computed,
  onMounted,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from 'vue';
import { useRoute } from 'vue-router';

const s3Url = getS3Url();

const route = useRoute();
const isDark = ref(false);
const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);
const notificationPopover = useTemplateRef<
  InstanceType<typeof Popover> & ComponentPublicInstance
>('notificationPopover');
const notifications = ref<INotificationResponse | null>(null);
const { loginWithVatsim } = useAuth();

const items = [
  {
    label: 'HOME',
    route: '/',
  },
  {
    label: 'CONTROLLERS',
    items: [
      {
        label: 'Roster',
        route: '/controllers',
      },
      {
        label: 'ARTCC Staff',
        route: '/controllers/staff',
      },
      {
        label: 'Documents',
        route: '/files/documents',
      },
      {
        label: 'Downloads',
        route: '/files/downloads',
      },
      {
        label: 'News',
        route: '/news',
      },
      {
        label: 'vNAS (Controller Client)',
        url: 'https://vnas.vatsim.net',
      },
    ],
  },
  {
    label: 'EVENTS',
    route: '/events',
  },
  {
    label: 'PILOTS',
    items: [
      {
        label: 'Leave Feedback',
        route: '/feedback',
      },
      {
        label: 'Request Staffing',
        route: '/staffingrequest',
      },
      {
        label: 'ZAU Charts',
        url: 'https://charts.zauartcc.org',
      },
      {
        label: 'SkyVector',
        url: 'https://skyvector.com',
      },
      // {
      //   label: 'FlightAware',
      //   url: 'https://flightaware.com',
      // },
      // {
      //   label: 'AirNav',
      //   url: 'https://airnav.com',
      // },
      {
        label: 'D-ATIS',
        url: 'https://atis.info',
      },
    ],
  },
  {
    label: 'SPLIT MAP',
    route: '/split',
  },
];

const userItems = computed(() => [
  {
    label: 'Controller Dashboard',
    route: '/dash',
  },
  {
    label: 'Instructor Dashboard',
    route: '/ins',
    visible: userStore.isTrainingStaff,
  },
  {
    label: 'Admin Dashboard',
    route: '/admin',
    visible: userStore.isStaff,
  },
  {
    label: 'Webmail',
    url: 'https://zm.zoho.com/',
    visible: userStore.isStaff,
  },
  {
    label: 'Logout',
    command: async () => {
      await userStore.logout();
    },
  },
]);

onMounted(async () => {
  const cookies = document.cookie.split(';');
  const themeCookie = cookies.find((c) => c.trim().startsWith('theme'));

  if (themeCookie) {
    const parts = themeCookie.split('=');
    if (parts[1] === 'dark') {
      document.documentElement.classList.add('app-dark');
      isDark.value = true;
    }
  }

  getNotifications();
});

const toggleTheme = () => {
  const element = document.documentElement;
  element.classList.toggle('app-dark');
  const darkMode = element.classList.contains('app-dark');
  const themeValue = darkMode ? 'dark' : 'light';

  document.cookie = `theme=${themeValue}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

  isDark.value = darkMode;
};

const showNotifications = (event: MouseEvent) => {
  if (!notificationPopover.value) return;

  notificationPopover.value.toggle(event);
};

const getNotifications = async () => {
  try {
    if (!isLoggedIn.value) return;

    const data = await notificationService.getNotifications();

    const read = data.notif.filter((n) => n.read === true);
    const unread = data.notif.filter((n) => n.read === false);

    notifications.value = { ...data, notif: [...unread, ...read] };
  } catch (e) {
    console.error('error getting notifications', e);
  }
};

const userMenu = useTemplateRef<InstanceType<typeof Menu>>('userMenu');

const toggleUserMenu = (event: MouseEvent) => {
  userMenu.value?.toggle(event);
};

const login = () => {
  loginWithVatsim(route.path);
};
</script>

<template>
  <header ref="popoverref" class="w-full">
    <Menubar
      :model="items"
      class="bg-primary md:w-10/12 mx-auto rounded-full shadow-lg py-2 px-5">
      <template #start>
        <router-link to="/">
          <img
            :src="`${s3Url}/site-logo/Footer-Logo.png`"
            alt="Virtual Chicago ARTCC Logo"
            draggable="false"
            style="height: 2em" />
        </router-link>
      </template>
      <template #item="{ item, props, hasSubmenu }">
        <router-link
          v-if="item.route"
          v-slot="{ href, navigate }"
          :to="item.route"
          custom>
          <a
            class="p-menuitem-link"
            :href="href"
            v-bind="props.action"
            @click="navigate">
            <span>{{ item.label }}</span>
          </a>
        </router-link>
        <a
          class="cursor-pointer"
          v-else
          :href="item.url"
          target="_blank"
          noopener
          noreferrer
          rel="noopener noreferrer"
          v-bind="props.action">
          <span
            >{{ item.label }}
            <Icon
              v-if="item.url"
              class="text-base!"
              icon="heroicons:arrow-top-right-on-square"
          /></span>
          <Icon
            v-if="hasSubmenu"
            icon="heroicons:chevron-down-solid"
            class="submenu-icon -ml-1" />
        </a>
      </template>
      <template #end>
        <span
          v-tooltip.bottom="'Toggle theme'"
          class="text-lg! inline-flex mr-2 gap-2 align-text-bottom">
          <Icon
            :icon="isDark ? 'heroicons:sun-solid' : 'heroicons:moon-solid'"
            @click.prevent="toggleTheme" />
        </span>
        <span
          v-if="isLoggedIn"
          v-tooltip.bottom="
            notifications && notifications.unread > 0
              ? `${notifications.unread} Unread Notifications`
              : 'Show Notifications'
          "
          class="text-lg! inline-flex mr-5 gap-2 align-text-bottom relative"
          @click.prevent="showNotifications">
          <span
            v-if="notifications && notifications.unread > 0"
            class="inline-flex">
            <Icon icon="heroicons:bell-alert-solid" />
            <Badge
              severity="danger"
              size="small"
              :value="notifications.unread"
              class="absolute top-0 left-3 cursor-pointer" />
          </span>
          <Icon icon="heroicons:bell-solid" v-else />
        </span>
        <a href="#" @click.prevent="login" v-if="!isLoggedIn">LOGIN</a>
        <template v-else>
          <a href="#" @click.prevent="toggleUserMenu"
            ><span>{{ user?.name }}</span>
            <Icon
              icon="heroicons:chevron-down-solid"
              class="submenu-icon inline-flex mx-1" />
          </a>
          <Menu :model="userItems" popup ref="userMenu">
            <template #item="{ item, props }">
              <router-link
                v-if="item.route"
                v-slot="{ href, navigate }"
                :to="item.route"
                custom>
                <a
                  class="p-menuitem-link"
                  :href="href"
                  v-bind="props.action"
                  @click="navigate">
                  <span>{{ item.label }}</span>
                </a>
              </router-link>
              <a
                class="cursor-pointer"
                v-else
                :href="item.url"
                target="_blank"
                noopener
                noreferrer
                rel="noreferrer noopener"
                v-bind="props.action">
                <span>{{ item.label }}</span>
              </a>
            </template>
          </Menu>
        </template>
      </template>
    </Menubar>
  </header>
  <Popover
    v-if="notifications"
    ref="notificationPopover"
    class="mt-2 ml-2"
    style="width: 25rem; right: 0">
    <NotificationsPanel
      :notifications="notifications"
      @updateNotifications="getNotifications" />
  </Popover>
</template>

<style lang="css" scoped>
header {
  width: 100vw;
}
</style>
