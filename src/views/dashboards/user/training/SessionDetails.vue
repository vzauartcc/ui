<script setup lang="ts">
import SessionDetails from '@/components/training/SessionDetails.vue';
import { trainingService } from '@/services/training/training.service';
import type { ITrainingSession } from '@/services/training/training.types';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const session = ref<ITrainingSession | null>(null);

const route = useRoute();
const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

onMounted(async () => {
  if (!id) return;

  try {
    const data = await trainingService.getSession(id);

    session.value = data;
  } catch (e) {
    console.error('error getting session data', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!session" />
  <Card v-else>
    <template #title>Training Session Details</template>
    <template #content>
      <SessionDetails :session="session" />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
