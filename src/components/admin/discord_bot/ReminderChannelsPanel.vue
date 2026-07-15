<script setup lang="ts">
import type {
  IBotConfig,
  IDiscordChannel,
} from '@/services/discord/discord.types';
import { Icon } from '@iconify/vue';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { computed, ref } from 'vue';

const props = defineProps<{
  config: IBotConfig;
  allChannels: IDiscordChannel[];
}>();
const emit = defineEmits(['update:config']);

const localConfig = computed({
  get() {
    return props.config;
  },
  set(newVal) {
    emit('update:config', newVal);
  },
});

const reminderChannels = computed(() => {
  if (!localConfig.value.reminderChannels) return [];

  return Object.entries(localConfig.value.reminderChannels).map(
    ([key, value]) => ({
      channelId: key,
      message: value,
    }),
  );
});

const getChannelFromId = (id: string) => {
  return props.allChannels.find((c) => c.id === id)?.name ?? '';
};

const editReminderChannelVisible = ref(false);
const editReminderChannelData = ref({
  edit: false,
  channelId: '',
  message: '',
});
const loadEditReminderChannel = (data: {
  channelId: string;
  message: string;
}) => {
  editReminderChannelData.value = {
    edit: true,
    channelId: data.channelId,
    message: data.message,
  };

  editReminderChannelVisible.value = true;
};
const closeEditReminderChannel = () => {
  editReminderChannelVisible.value = false;
  editReminderChannelData.value = { edit: false, channelId: '', message: '' };
};
const saveReminderChannel = () => {
  if (
    editReminderChannelData.value.channelId === '' ||
    editReminderChannelData.value.message === ''
  )
    return;

  const updatedObj = { ...localConfig.value };

  updatedObj.reminderChannels[editReminderChannelData.value.channelId] =
    editReminderChannelData.value.message;

  localConfig.value = updatedObj;

  closeEditReminderChannel();
};
const deleteReminderChannel = (channelId: string) => {
  const updatedObj = { ...localConfig.value };

  delete updatedObj.reminderChannels[channelId];

  localConfig.value = updatedObj;
};
</script>

<template>
  <AccordionPanel value="3">
    <AccordionHeader>
      <span class="flex justify-between gap-5 items-center">
        <Icon icon="heroicons:bell-alert" />
        Reminder Channels ({{ reminderChannels.length }})
      </span>
    </AccordionHeader>
    <AccordionContent>
      <p>
        The bot will automatically send a message in these channels anytime
        someone else sends a message in the channel.
      </p>
      <DataTable :value="reminderChannels" stripedRows size="small">
        <template #empty
          ><p>There are no reminder channels configured.</p></template
        >
        <template #header
          ><div class="flex justify-end">
            <Button
              label="Add Reminder Channel"
              @click="editReminderChannelVisible = true" /></div
        ></template>
        <Column field="channelId" header="Channel">
          <template #body="{ data }">
            #{{ getChannelFromId(data.channelId) }}
          </template>
        </Column>
        <Column field="message" header="Reminder Message" />
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span
              v-tooltip.top="'Edit Reminder Channel'"
              @click="loadEditReminderChannel(data)">
              <Icon icon="heroicons:pencil" />
            </span>
            <span
              v-tooltip.top="'Delete Reminder Channel'"
              @click="deleteReminderChannel(data.channelId)">
              <Icon icon="heroicons:trash" class="text-red-500" />
            </span>
          </template>
        </Column>
      </DataTable>
    </AccordionContent>
  </AccordionPanel>

  <Dialog
    modal
    v-model:visible="editReminderChannelVisible"
    :header="
      editReminderChannelData.edit
        ? 'Edit Cleanup Channel'
        : 'Create Cleanup Channel'
    "
    @hide="closeEditReminderChannel"
    class="w-1/2">
    <div class="grid grid-cols-2">
      <FloatLabel variant="on">
        <Select
          name="channelId"
          :options="props.allChannels"
          optionLabel="name"
          optionValue="id"
          v-model="editReminderChannelData.channelId"
          class="w-full"
          :disabled="editReminderChannelData.edit"
          filter
          :filterFields="['id', 'name']" />
        <label for="channelId">Channel</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText name="message" v-model="editReminderChannelData.message" />
        <label for="message">Message Content</label>
      </FloatLabel>
    </div>
    <template #footer>
      <Button
        v-if="!editReminderChannelData.edit"
        label="Add!"
        @click="saveReminderChannel" />
      <Button v-else label="Save!" @click="saveReminderChannel" />
      <Button outlined label="Cancel" @click="closeEditReminderChannel" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
