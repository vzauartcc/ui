<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import SidebarMenu from '@/components/layout/SidebarMenu.vue';

const userStore = useUserStore();

const items = ref<MenuItem[]>([
  {
    key: 'dashboard',
    label: 'Dashboard',
    url: '/admin',
    icon: 'heroicons:squares-2x2',
  },
  {
    key: 'controller-menu',
    label: 'Controllers',
    icon: 'heroicons:user-circle',
    items: [
      { label: 'Roster', url: '/admin/controllers', icon: 'heroicons:users' },
      {
        label: 'Controller Activity',
        url: '/admin/controllers/activity',
        icon: 'heroicons:chart-bar-square',
      },
    ],
  },
  {
    key: 'file-menu',
    label: 'Files',
    icon: 'heroicons:document-duplicate',
    items: [
      {
        label: 'Documents',
        url: '/admin/files/documents',
        icon: 'heroicons:document-text',
      },
      {
        label: 'Downloads',
        url: '/admin/files/downloads',
        icon: 'heroicons:arrow-down-tray',
      },
    ],
  },
  {
    key: 'news',
    label: 'News',
    url: '/admin/news',
    icon: 'heroicons:newspaper',
  },
  {
    key: 'events-menu',
    label: 'Events Team',
    icon: 'heroicons:calendar',
    requiredRoles: 'ec',
    items: [
      {
        label: 'Events',
        url: '/admin/events',
        icon: 'heroicons:calendar-days',
      },
      {
        label: 'Split Map',
        url: '/admin/events/split',
        icon: 'mdi:call-split',
      },
    ],
  },
  {
    key: 'management-menu',
    label: 'Management Team',
    icon: 'heroicons:briefcase',
    requiredRoles: 'ta',
    items: [
      {
        label: 'Feedback',
        url: '/admin/feedback',
        icon: 'heroicons:star',
      },
      {
        label: 'Visitor Applications',
        url: '/admin/visitors',
        icon: 'heroicons:user-plus',
      },
      {
        label: 'Action Log',
        url: '/admin/action-log',
        icon: 'heroicons:document-magnifying-glass',
      },
      {
        label: 'Users',
        url: '/admin/users',
        icon: 'heroicons:user-group',
        requiredRoles: 'datm',
      },
      {
        label: 'Discord Bot',
        url: '/admin/discord-bot',
        icon: 'heroicons:identification',
        requiredRoles: 'ta',
      },
    ],
  },
]);

const filteredItems = computed(() => {
  const filterMenu = (menuList: MenuItem[]): MenuItem[] => {
    return menuList
      .filter((item: MenuItem) => userStore.hasRoles(item.requiredRoles))
      .map((item: MenuItem) => {
        if (item.items) {
          return {
            ...item,
            items: filterMenu(item.items),
          };
        }
        return item;
      });
  };

  return filterMenu(items.value);
});
</script>

<template>
  <SidebarMenu :filteredItems="filteredItems" />
</template>

<style lang="css" scoped></style>
