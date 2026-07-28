<script setup lang="ts">
import SessionEditor from '@/components/session/SessionEditor.vue';
import { useTitle } from '@/utils/title';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { trainingService } from '@/services/training/training.service';
import type {
  ITrainingMilestone,
  ITrainingSession,
} from '@/services/training/training.types';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('New Session Notes');

const router = useRouter();

const controllers = ref<IFeedbackController[] | null>(null);
const milestones = ref<ITrainingMilestone[] | null>(null);

onMounted(async () => {
  try {
    const data = await feedbackService.getControllerList();

    controllers.value = data;
  } catch (e) {
    console.error('error getting controller list', e);
  }

  try {
    const data = await trainingService.getMilestones();

    milestones.value = data.milestones.filter((m) => m.type === 'session');
  } catch (e) {
    console.error('error getting training milestones', e);
  }
});

const sendFeedback = async (
  type: 'save' | 'submit',
  data: Partial<ITrainingSession>,
) => {
  if (type === 'submit') {
    try {
      await trainingService.submitSession(data);
      router.push('/ins/sessions');
    } catch (err) {
      console.error('error submitting form', err);
    }
  } else if (type === 'save') {
    try {
      await trainingService.saveSession(data);

      router.push('/ins/sessions');
    } catch (e) {
      console.error('error saving session', e);
    }
  }
};
</script>

<template>
  <ProgressSpinner v-if="!controllers || !milestones" />
  <Card v-else>
    <template #title>New Training Session</template>
    <template #content>
      <SessionEditor
        :controllers="controllers"
        :milestones="milestones"
        :edit="null"
        @finishSession="sendFeedback" />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
