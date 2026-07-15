<script setup lang="ts">
import {
  sessionLocation,
  sessionProgress,
  type ITrainingSession,
} from '@/services/training/training.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import Fieldset from 'primevue/fieldset';
import Message from 'primevue/message';

const userStore = useUserStore();

const props = defineProps<{ session: ITrainingSession }>();
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <Fieldset legend="Student">
      <span>{{ compileUsersName(props.session.student) }}</span>
    </Fieldset>
    <Fieldset legend="Instructor">
      <span>{{ compileUsersName(props.session.instructor) }}</span>
    </Fieldset>

    <Fieldset legend="Start Time">
      <span>{{ dateAsMMDDHHMM(props.session.startTime) }}</span>
    </Fieldset>
    <Fieldset legend="End Time">
      <span>{{ dateAsMMDDHHMM(props.session.endTime) }}</span>
    </Fieldset>

    <Fieldset legend="Milestone">
      <span>{{ props.session.milestone.name }}</span>
    </Fieldset>

    <Fieldset legend="Position">
      <span>{{ props.session.position }}</span>
    </Fieldset>
  </div>

  <div class="grid md:grid-cols-3 md:gap-4">
    <Fieldset legend="Movements">
      <span>{{ props.session.movements }}</span>
    </Fieldset>
    <Fieldset legend="Location">
      <span>{{ sessionLocation[props.session.location] }}</span>
    </Fieldset>
    <Fieldset legend="Progress">
      <span>{{ sessionProgress[props.session.progress] }}</span>
    </Fieldset>
  </div>

  <Fieldset
    legend="VATUSA"
    v-if="
      (userStore.isTrainingStaff || userStore.isSeniorStaff) &&
      !userStore.isSelf(props.session.studentCid)
    ">
    <Message severity="success" v-if="props.session.vatusaId > 0">
      Training Session is synchronized with VATUSA.
    </Message>
    <Message severity="error" v-else>
      Training Session is <b>not</b> synchronized with VATUSA.
    </Message>
  </Fieldset>

  <Fieldset legend="Student Notes">
    <div
      v-html="props.session.studentNotes"
      class="prose max-w-none dark:prose-invert" />
  </Fieldset>

  <Fieldset
    legend="Instructor Notes"
    v-if="
      userStore.isTrainingStaff &&
      !userStore.isSelf(props.session.studentCid) &&
      props.session.insNotes
    ">
    <span>{{ props.session.insNotes }}</span>
  </Fieldset>
</template>

<style lang="css" scoped></style>
