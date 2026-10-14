<script setup lang="ts">
import type { IController } from '@/services/controller/controller.types';
import type { IUser } from '@/services/user/user.types';
import { dateAsMMDD } from '@/utils/date';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Fieldset from 'primevue/fieldset';
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
    dismissableMask
    v-if="user"
    v-model:visible="isVisible"
    header="User Details"
    class="w-1/2">
    <div class="grid grid-cols-2 gap-5 mb-5">
      <Fieldset legend="First Name">
        <span>{{ user.fname }}</span>
      </Fieldset>

      <Fieldset legend="Last Name">
        <span>{{ user.lname }}</span>
      </Fieldset>

      <Fieldset legend="Certificate ID">
        <span>{{ user.cid }}</span>
      </Fieldset>

      <Fieldset legend="E-Mail Address">
        <span>{{ user.email }}</span>
      </Fieldset>

      <Fieldset legend="Controller Rating">
        <span>{{ user.ratingShort }}</span>
      </Fieldset>

      <Fieldset legend="Operating Initials">
        <span>{{ user.oi }}</span>
      </Fieldset>
    </div>

    <Divider />

    <Accordion>
      <AccordionPanel value="0">
        <AccordionHeader>Facility History</AccordionHeader>
        <AccordionContent>
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
              <span v-else class="whitespace-pre-line break-words">
                {{ item.reason }}
              </span>
            </template>
            <template #content="{ item }">
              <span
                v-if="item.isStart"
                class="text-surface-500 dark:text-surface-400">
                {{ dateAsMMDD(item.date) }}
              </span>
              <span v-else class="whitespace-pre-line break-words">
                {{ item.reason }}
              </span>
            </template>
          </Timeline>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
    <template #footer>
      <Button outlines label="Close" @click="isVisible = false" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
