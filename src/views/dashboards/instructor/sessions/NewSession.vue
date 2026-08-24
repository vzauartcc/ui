<script setup lang="ts">
import SessionEditor from '@/components/session/SessionEditor.vue';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { trainingService } from '@/services/training/training.service';
import type {
  ITrainingMilestone,
  ITrainingSession,
} from '@/services/training/training.types';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('New Session Notes');

const router = useRouter();
const { execute } = useAsyncSubmit();

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

    milestones.value = data.milestones.filter(
      (m) => m.type === 'session' && m.isActive,
    );
  } catch (e) {
    console.error('error getting training milestones', e);
  }
});

const persistSession = async (
  type: 'save' | 'submit',
  data: Partial<ITrainingSession>,
) => {
  await execute(async () => {
    if (type === 'submit') {
      await trainingService.submitSession(data);

      router.push('/ins/sessions');
      toastSuccess(
        'Session Submitted!',
        'Successfully submitted session to VATUSA.',
      );
    } else {
      await trainingService.saveSession(data);

      router.push('/ins/sessions');
      toastSuccess('Session Saved!', 'Successfully saved session notes.');
    }
  });
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
        @finishSession="persistSession" />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
