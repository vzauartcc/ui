<script setup lang="ts">
import { discordService } from '@/services/discord/discord.service';
import type {
  IBotConfig,
  IDiscordChannel,
  IDiscordMessage,
} from '@/services/discord/discord.types';
import { truncateText } from '@/utils/text';
import { Icon } from '@iconify/vue';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import Select from 'primevue/select';
import { computed, onMounted, ref } from 'vue';

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

const channelMessages = ref<Map<string, IDiscordMessage[]>>(new Map());
const messageContent = ref<Map<string, IDiscordMessage>>(new Map());

onMounted(() => {
  Object.keys(localConfig.value.cleanupChannels).forEach((channelId) => {
    getMessageContent(channelId, localConfig.value.cleanupChannels[channelId]!);
    getChannelMessages(channelId);
  });
});

const getMessageContent = async (channelId: string, messageId: string) => {
  try {
    const data = await discordService.getMessageContent(channelId, messageId);

    messageContent.value.set(messageId, data);
  } catch (e) {
    console.error(
      'error getting message content for',
      messageId,
      'in',
      channelId,
      e,
    );
  }
};

const cleanupChannels = computed(() => {
  return Object.entries(localConfig.value.cleanupChannels).map(
    ([key, value]) => ({
      channelId: key,
      messageId: value,
    }),
  );
});

const editCleanupChannelVisible = ref(false);
const editCleanupChannelData = ref({
  edit: false,
  channelId: '',
  messageId: '',
});
const loadEditCleanupChannel = (data: {
  channelId: string;
  messageId: string;
}) => {
  editCleanupChannelData.value = {
    edit: true,
    channelId: data.channelId,
    messageId: data.messageId,
  };

  editCleanupChannelVisible.value = true;
};
const closeEditCleanupChannel = () => {
  editCleanupChannelVisible.value = false;
  editCleanupChannelData.value = { edit: false, channelId: '', messageId: '' };
};
const saveCleanupChannel = () => {
  if (
    editCleanupChannelData.value.channelId === '' ||
    editCleanupChannelData.value.messageId === ''
  )
    return;

  const updatedObj = { ...localConfig.value };
  updatedObj.cleanupChannels[editCleanupChannelData.value.channelId] =
    editCleanupChannelData.value.messageId;

  localConfig.value = updatedObj;

  messageContent.value.set(
    editCleanupChannelData.value.messageId,
    channelMessages.value
      .get(editCleanupChannelData.value.channelId)!
      .find((m) => m.id === editCleanupChannelData.value.messageId) ?? {
      id: '',
      content: '',
    },
  );

  closeEditCleanupChannel();
};
const deleteCleanupChannel = (channelId: string) => {
  const updatedObj = { ...localConfig.value };
  delete updatedObj.cleanupChannels[channelId];
  localConfig.value = updatedObj;
};

const fetchingChannelMessages = ref(false);
const getChannelMessages = async (id: string) => {
  try {
    fetchingChannelMessages.value = true;
    const data = await discordService.getChannelMessages(id);

    channelMessages.value.set(id, data);
  } catch (e) {
    console.error('error getting messages for channel', id, e);
  } finally {
    fetchingChannelMessages.value = false;
  }
};

const getChannelFromId = (id: string) => {
  return props.allChannels.find((c) => c.id === id)?.name ?? '';
};
</script>

<template>
  <AccordionPanel value="2">
    <AccordionHeader>
      <span class="flex justify-between gap-5 items-center">
        <Icon icon="heroicons:trash" />
        Cleanup Channels ({{ cleanupChannels.length }})
      </span></AccordionHeader
    >
    <AccordionContent>
      <p>
        These channels will be cleaned up nightly, deleting all messages except
        the designated message to keep.
      </p>
      <DataTable :value="cleanupChannels" stripedRows size="small">
        <template #empty
          ><p>There are no cleanup channels configured.</p></template
        >
        <template #header
          ><div class="flex justify-end">
            <Button
              label="Add Cleanup Channel"
              @click="editCleanupChannelVisible = true" /></div
        ></template>
        <Column field="channelId" header="Channel">
          <template #body="{ data }">
            #{{ getChannelFromId(data.channelId) }}
          </template>
        </Column>
        <Column field="messageId" header="Message to Keep">
          <template #body="{ data }">
            <span v-tooltip="messageContent.get(data.messageId)?.content">{{
              truncateText(messageContent.get(data.messageId)?.content, 30)
            }}</span>
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span
              v-tooltip.top="'Edit Cleanup Channel'"
              @click="loadEditCleanupChannel(data)">
              <Icon icon="heroicons:pencil" />
            </span>
            <span
              v-tooltip.top="'Delete Cleanup Channel'"
              @click="deleteCleanupChannel(data.channelId)">
              <Icon icon="heroicons:trash" class="text-red-500" />
            </span>
          </template>
        </Column>
      </DataTable>
    </AccordionContent>
  </AccordionPanel>

  <Dialog
    modal
    v-model:visible="editCleanupChannelVisible"
    :header="
      editCleanupChannelData.edit
        ? 'Edit Cleanup Channel'
        : 'Create Cleanup Channel'
    "
    @hide="closeEditCleanupChannel"
    class="w-1/2">
    <div class="grid grid-cols-2">
      <FloatLabel variant="on">
        <Select
          name="channelId"
          :options="props.allChannels"
          optionLabel="name"
          optionValue="id"
          v-model="editCleanupChannelData.channelId"
          class="w-full"
          :disabled="editCleanupChannelData.edit"
          filter
          :filterFields="['id', 'name']"
          @change="($event) => getChannelMessages($event.value)" />
        <label for="channelId">Channel</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          name="messageId"
          :options="channelMessages.get(editCleanupChannelData.channelId)"
          optionLabel="content"
          optionValue="id"
          v-model="editCleanupChannelData.messageId"
          class="w-full"
          :loading="fetchingChannelMessages"
          filter
          :filterFields="['id', 'content']" />
        <label for="messageId">Message to Keep</label>
      </FloatLabel>
    </div>
    <template #footer>
      <Button
        v-if="!editCleanupChannelData.edit"
        label="Add!"
        @click="saveCleanupChannel" />
      <Button v-else label="Save!" @click="saveCleanupChannel" />
      <Button outlined label="Cancel" @click="closeEditCleanupChannel" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
