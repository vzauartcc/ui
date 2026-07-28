<script setup lang="ts">
import SoloEndorsementTable from '@/components/SoloEndorsementTable.vue';
import { trainingService } from '@/services/training/training.service';
import type { ISoloEndorsement } from '@/services/training/training.types';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Manage Solo Endorsements');

const activeEndorsements = ref<ISoloEndorsement[]>([]);
const expiredEndorsements = ref<ISoloEndorsement[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await trainingService.getSoloEndorsements();

    activeEndorsements.value = data.filter(
      (e) => Date.now() < new Date(e.expires).getTime(),
    );
    expiredEndorsements.value = data.filter(
      (e) => Date.now() >= new Date(e.expires).getTime(),
    );

    loading.value = false;
  } catch (e) {
    console.error('error getting solo endorsements', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="loading" />
  <template v-else>
    <Card class="mb-5">
      <template #title>Current Solo Endorsements</template>
      <template #subtitle
        >Solo Endorsements that are currently active and valid.</template
      >
      <template #content>
        <SoloEndorsementTable :endorsements="activeEndorsements" active />
      </template>
    </Card>
    <Card>
      <template #title>Past Solo Endorsements</template>
      <template #subtitle
        >Solo Endorsements that have expired or been revoked, and are no longer
        active.</template
      >
      <template #content>
        <SoloEndorsementTable :endorsements="expiredEndorsements" />
      </template>
    </Card>
  </template>
</template>

<style lang="css" scoped></style>
