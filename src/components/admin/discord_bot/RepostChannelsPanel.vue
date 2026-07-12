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

const getChannelFromId = (id: string) => {
  return props.allChannels.find((c) => c.id === id)?.name ?? '';
};

const repostChannels = computed(() => {
  if (!localConfig.value.repostChannels) return [];

  return Object.entries(localConfig.value.repostChannels).map(
    ([key, value]) => ({
      channelId: key,
      channelName: value,
    }),
  );
});

const editRepostChannelVisible = ref(false);
const editRepostChannelData = ref({ edit: false, id: '', name: '' });
const loadEditRepostChannel = (data: {
  channelId: string;
  channelName: string;
}) => {
  editRepostChannelData.value = {
    id: data.channelId,
    name: data.channelName,
    edit: true,
  };

  editRepostChannelVisible.value = true;
};
const deleteRepostChannel = (channelId: string) => {
  const updatedObj = { ...localConfig.value };
  delete updatedObj.repostChannels[channelId];
  localConfig.value = updatedObj;
};
const saveRepostChannel = () => {
  const updatedObj = { ...localConfig.value };
  updatedObj.repostChannels[editRepostChannelData.value.id] =
    editRepostChannelData.value.name;
  localConfig.value = updatedObj;

  closeEditRepostChannel();
};
const closeEditRepostChannel = () => {
  editRepostChannelVisible.value = false;
  editRepostChannelData.value = { edit: false, id: '', name: '' };
};
</script>

<template>
  <AccordionPanel value="1">
    <AccordionHeader>
      <span class="flex justify-between gap-5 items-center">
        <Icon icon="heroicons:newspaper" />
        Re-post Channels ({{
          Object.keys(localConfig.repostChannels).length
        }})</span
      ></AccordionHeader
    >
    <AccordionContent>
      <p>
        Messages posted in these channels will be deleted and re-posted by the
        Discord bot as an embed.
      </p>
      <DataTable :value="repostChannels" stripedRows size="small">
        <template #empty
          ><p>There are no re-post channels configured.</p></template
        >
        <template #header
          ><div class="flex justify-end">
            <Button
              label="Add Re-post Channel"
              @click="editRepostChannelVisible = true" /></div
        ></template>
        <Column field="channelId" header="Channel">
          <template #body="{ data }">
            #{{ getChannelFromId(data.channelId) }}
          </template>
        </Column>
        <Column field="channelName" header="Embed Title" />
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span
              v-tooltip.top="'Edit Repost Channel'"
              @click="loadEditRepostChannel(data)">
              <Icon icon="heroicons:pencil" />
            </span>
            <span
              v-tooltip.top="'Delete Repost Channel'"
              @click="deleteRepostChannel(data.channelId)">
              <Icon icon="heroicons:trash" class="text-red-500" />
            </span>
          </template>
        </Column>
      </DataTable>
    </AccordionContent>
  </AccordionPanel>

  <Dialog
    modal
    v-model:visible="editRepostChannelVisible"
    :header="
      editRepostChannelData.edit
        ? 'Edit Re-post Channel'
        : 'Create Re-post Channel'
    "
    @hide="closeEditRepostChannel"
    class="w-1/2">
    <div class="grid grid-cols-2">
      <FloatLabel variant="on">
        <Select
          name="channelId"
          :options="allChannels"
          optionLabel="name"
          optionValue="id"
          v-model="editRepostChannelData.id"
          class="w-full"
          :disabled="editRepostChannelData.edit"
          filter
          :filterFields="['id', 'name']" />
        <label for="channelId">Channel</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText name="channelName" v-model="editRepostChannelData.name" />
        <label for="channelName">Embed Title</label>
      </FloatLabel>
    </div>
    <template #footer>
      <Button
        v-if="!editRepostChannelData.edit"
        label="Add!"
        @click="saveRepostChannel" />
      <Button v-else label="Save!" @click="saveRepostChannel" />
      <Button outlined label="Cancel" @click="closeEditRepostChannel" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
