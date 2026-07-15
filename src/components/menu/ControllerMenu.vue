<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import SidebarMenu from '@/components/layout/SidebarMenu.vue';

const items = ref([
  {
    key: 'dashboard',
    label: 'Dashboard',
    url: '/dash',
    icon: 'heroicons:squares-2x2',
  },
  {
    key: 'training-menu',
    label: 'Training',
    icon: 'heroicons:academic-cap',
    items: [
      {
        label: 'Training Sessions',
        url: '/dash/training',
        icon: 'heroicons:document-text',
      },
      {
        label: 'Training Waitlist',
        url: '/dash/training/waitlist',
        icon: 'heroicons:queue-list',
      },
      {
        label: 'Exam Center',
        url: '/dash/training/exams',
        icon: 'heroicons:clipboard-document-check',
      },
    ],
  },
  {
    key: 'feedback',
    label: 'Feedback',
    url: '/dash/feedback',
    icon: 'heroicons:star',
  },
  {
    key: 'oi',
    label: 'Available Operating Initials',
    url: '/dash/available-operating-initials',
    icon: 'heroicons:cube-transparent',
  },
  {
    key: 'split',
    label: 'Split Map',
    url: '/dash/split-map',
    icon: 'mdi:call-split',
    requiredRating: 5,
  },
]);

const userStore = useUserStore();

const filteredItems = computed(() => {
  const filterMenu = (menuList: MenuItem[]): MenuItem[] => {
    return menuList
      .filter((item: MenuItem) => userStore.hasRating(item.requiredRating))
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
