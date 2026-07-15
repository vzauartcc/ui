<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Card from 'primevue/card';
import type { MenuItem } from 'primevue/menuitem';
import PanelMenu from 'primevue/panelmenu';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  filteredItems: MenuItem[];
}>();

const route = useRoute();
const expandedKeys = ref<Record<string, boolean>>({});

watchEffect(() => {
  const currentPath = route.path;
  const newExpandedKeys: Record<string, boolean> = {};

  const findActiveParent = (menuItems: MenuItem[]): boolean => {
    for (const item of menuItems) {
      if (item.items) {
        // If a child underneath this parent matches the URL
        const hasMatchingChild = item.items.some(
          (child) => child.url === currentPath,
        );

        if (hasMatchingChild && item.key) {
          newExpandedKeys[item.key] = true;
          return true;
        }
      }
    }
    return false;
  };

  findActiveParent(props.filteredItems);
  expandedKeys.value = newExpandedKeys;
});
</script>

<template>
  <Card>
    <template #content>
      <PanelMenu
        :model="props.filteredItems"
        v-model:expandedKeys="expandedKeys">
        <template #item="{ item, active }">
          <router-link v-if="item.url" :to="item.url">
            <div class="my-2 flex rounded-md" :class="{ border: active }">
              <Icon v-if="item.icon" :icon="item.icon" class="mx-2 my-auto!" />
              <span class="">{{ item.label }}</span>
            </div>
          </router-link>

          <div
            v-else
            class="cursor-pointer my-2 flex items-center justify-between w-full select-none">
            <div class="flex items-center">
              <Icon v-if="item.icon" :icon="item.icon" class="mx-2 my-auto!" />
              <span class="">{{ item.label }}</span>
            </div>
            <Icon
              v-if="item.items"
              :icon="active ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
              class="mx-2 my-auto!" />
          </div>
        </template>
      </PanelMenu>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
