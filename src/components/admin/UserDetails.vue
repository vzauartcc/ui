<script setup lang="ts">
import type { IController } from '@/services/controller/controller.types';
import type { IUser } from '@/services/user/user.types';
import { dateAsMMDD } from '@/utils/date';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Timeline from 'primevue/timeline';
import { computed } from 'vue';

const props = defineProps<{
  user: IController | IUser | null;
  visible: boolean;
}>();
const emit = defineEmits(['update:visible']);

const isVisible = computed({
  get() {
    return props.visible;
  },
  set(newVal) {
    emit('update:visible', newVal);
  },
});

interface IHistory {
  date: Date;
  reason: string;
  isStart: boolean;
}
const history = computed(() => {
  if (!props.user || !props.user.history) return [];

  if (props.user.history.length === 0) {
    return [
      {
        date: new Date(props.user.joinDate),
        reason: 'Transferred into facility',
        isStart: true,
      },
    ];
  }

  const sorted = [...props.user.history].sort(
    (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime(),
  );

  const tmp: IHistory[] = [];

  sorted.forEach((h) => {
    tmp.push({
      date: new Date(h.end),
      reason: h.reason,
      isStart: false,
    });

    tmp.push({
      date: new Date(h.start),
      reason: 'Transferred into facility',
      isStart: true,
    });
  });

  return tmp;
});
</script>

<template>
  <Dialog
    modal
    v-if="user"
    v-model:visible="isVisible"
    header="User Details"
    class="w-1/2">
    <div class="grid grid-cols-2 gap-5 mb-5">
      <FloatLabel variant="on">
        <InputText disabled :modelValue="user.fname" id="fname" />
        <label for="fname">First Name</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText disabled :modelValue="user.lname" id="lname" />
        <label for="lname">Last Name</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputNumber
          disabled
          :modelValue="user.cid"
          :useGrouping="false"
          id="cid" />
        <label for="cid">Certificate ID</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText disabled :modelValue="user.email" id="email" />
        <label for="email">E-Mail Address</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText disabled :modelValue="user.ratingShort" id="rating" />
        <label for="rating">Controller Rating</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText disabled :modelValue="user.oi" id="oi" />
        <label for="oi">Operating Initials</label>
      </FloatLabel>
    </div>

    <Divider />

    <p class="text-center text-lg">Facility History</p>

    <Timeline
      v-if="history.length > 0"
      :value="history"
      class="overflow-y-auto">
      <template #opposite="{ item }">
        <span
          v-if="!item.isStart"
          class="text-surface-500 dark:text-surface-400">
          {{ dateAsMMDD(item.date) }}
        </span>
        <span v-else>
          {{ item.reason }}
        </span>
      </template>
      <template #content="{ item }">
        <span
          v-if="item.isStart"
          class="text-surface-500 dark:text-surface-400">
          {{ dateAsMMDD(item.date) }}
        </span>
        <span v-else>
          {{ item.reason }}
        </span>
      </template>
    </Timeline>
    <template #footer>
      <Button outlines label="Close" @click="isVisible = false" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
