<script setup lang="ts">
import SidebarMenu from '@/components/layout/SidebarMenu.vue';
import { useUserStore } from '@/stores/user';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';

const userStore = useUserStore();

const items = ref<MenuItem[]>([
  {
    key: 'dashboard',
    label: 'Dashboard',
    url: '/ins',
    icon: 'heroicons:squares-2x2',
  },
  {
    key: 'downloads',
    label: 'Instructor Downloads',
    url: '/ins/downloads',
    icon: 'heroicons:arrow-down-tray',
  },
  {
    key: 'controllers',
    label: 'Controllers',
    url: '/ins/controllers',
    icon: 'heroicons:users',
  },
  {
    key: 'exam',
    label: 'Exam Center',
    url: '/ins/exams',
    icon: 'heroicons:academic-cap',
  },
  {
    key: 'milestone',
    label: 'Training Milestones',
    url: '/ins/milestones',
    icon: 'heroicons:arrow-trending-up',
    requiredRoles: 'ta',
  },
  {
    key: 'solo',
    label: 'Solo Endorsements',
    url: '/ins/solo',
    icon: 'heroicons:user-circle',
  },
  {
    key: 'waitlist',
    label: 'Training Waitlist',
    url: '/ins/waitlist',
    icon: 'heroicons:queue-list',
  },
  {
    key: 'sessions',
    label: 'Training Sessions',
    url: '/ins/sessions',
    icon: 'heroicons:square-3-stack-3d',
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
