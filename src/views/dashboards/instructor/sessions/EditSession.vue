<script setup lang="ts">
import SessionEditor from '@/components/session/SessionEditor.vue';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { trainingService } from '@/services/training/training.service';
import type {
  ITrainingMilestone,
  ITrainingSession,
} from '@/services/training/training.types';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('Edit Session Details');

const route = useRoute();
const router = useRouter();

const session = ref<ITrainingSession | null>(null);
const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

const milestones = ref<ITrainingMilestone[]>([]);
const controllers = ref<IFeedbackController[]>([]);

onMounted(async () => {
  if (!id) return;
  try {
    const data = await trainingService.getMilestones();

    milestones.value = data.milestones.filter((m) => m.type === 'session');
  } catch (e) {
    console.error('error getting milestones', e);
  }

  try {
    const data = await trainingService.getSession(id);

    session.value = data;

    // Create a dummy IFeedbackController so the Select field is
    // populated correctly.
    controllers.value = [
      {
        fname: data.student.fname,
        lname: data.student.lname,
        rating: 0,
        vis: false,
        name: compileUsersName(data.student),
        cid: data.student.cid,
      },
    ];
  } catch (e) {
    console.error('error getting session details', e);
  }
});

const persistSession = async (
  type: 'save' | 'submit',
  data: Partial<ITrainingSession>,
) => {
  if (type === 'submit') {
    try {
      await trainingService.submitSessionEdit(session.value!._id, data);

      router.push('/ins/sessions');
      toastSuccess(
        'Session Submitted!',
        'Successfully submitted session to VATUSA.',
      );
    } catch (err) {
      console.error('error submitting form', err);
    }
  } else if (type === 'save') {
    try {
      await trainingService.saveSessionEdit(session.value!._id, data);

      router.push('/ins/sessions');
      toastSuccess('Session Saved!', 'Successfully saved session notes.');
    } catch (e) {
      console.error('error saving session', e);
    }
  }
};
</script>

<template>
  <ProgressSpinner v-if="!session" />
  <Card v-else>
    <template #title>Edit Session</template>
    <template #content>
      <SessionEditor
        :controllers="controllers"
        :milestones="milestones"
        :edit="session"
        @finishSession="persistSession" />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
