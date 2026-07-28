<script setup lang="ts">
import { eventService } from '@/services/events/events.service';
import type {
  IEvent,
  IPosition,
  ISignup,
} from '@/services/events/events.types';
import { toastSuccess } from '@/utils/toast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import MultiSelect from 'primevue/multiselect';
import { onMounted, ref } from 'vue';

const props = defineProps<{
  event: IEvent;
  positions: IPosition[];
  signups: ISignup[];
  cid: number;
}>();
const emit = defineEmits(['signedUp']);

// const props = defineProps(['event', 'positions', 'signups', 'cid']);
const visible = defineModel<boolean>('visible');

const availablePositions = ref<string[]>([]);
const selectedPositions = ref<string[]>([]);

onMounted(() => {
  const temp = ['Any position'];

  if (props.positions.some((p) => p.type === 'CTR')) {
    temp.push('Any Enroute position');
  }

  if (props.positions.some((p) => p.type === 'APP' || p.type === 'DEP')) {
    temp.push('Any TRACON position');
  }

  if (props.positions.some((p) => p.type === 'TWR' || p.type === 'GND')) {
    temp.push('Any Local positions');
  }

  availablePositions.value = [...temp, ...props.positions.map((p) => p.pos)];

  props.signups.forEach((s) => {
    if (s.cid === props.cid) {
      selectedPositions.value = s.requests;
    }
  });
});

const savePositions = async () => {
  try {
    await eventService.submitSignup(props.event.url, selectedPositions.value);

    toastSuccess(
      'Signup submitted!',
      'Your signup for the event has been submitted.',
    );

    emit('signedUp');
    selectedPositions.value = [];
  } catch (e) {
    console.error('Error submitting event signup', e);
  }
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="`Position Signup - ${event.name}`"
    class="max-w-xl">
    <span>
      The positions for this event will be assigned by the Events Coordinator.
      Please indicate
      <em>up to three</em> preferred positions below. If you do not have a
      preference, use the
      <pre class="inline-flex">Any position</pre>
      option.
    </span>
    <p class="">
      Be advised that requests are just that, requests. The Events Coordinator
      may place you on any (or no) position depending on multiple factors.
    </p>
    <div class="flex items-center gap-4 mb-4">
      <MultiSelect
        v-model="selectedPositions"
        :maxSelectedLabels="3"
        :selectionLimit="3"
        :options="availablePositions"
        placeholder="Select Positions"
        checkmark
        filter
        :highlightOnSelect="false"
        :showToggleAll="false"
        showClear />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          outlined
          @click="visible = false" />
        <Button type="button" label="Submit" @click="savePositions" />
      </div>
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
