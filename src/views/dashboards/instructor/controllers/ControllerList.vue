<script setup lang="ts">
import ControllerList from '@/components/ControllerList.vue';
import { useTitle } from '@/utils/title';
import { controllerService } from '@/services/controller/controller.service';
import type { IController } from '@/services/controller/controller.types';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Controllers');

const controllers = ref<IController[] | null>(null);

onMounted(async () => {
  getControllers();
});

const getControllers = async () => {
  try {
    const data = await controllerService.getControllers();

    controllers.value = [...data.home, ...data.visiting];
  } catch (e) {
    console.error('error getting controllers', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!controllers" />
  <Card v-else>
    <template #title>Controllers</template>
    <template #content>
      <ControllerList
        :controllers="controllers"
        @getControllers="getControllers" />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
