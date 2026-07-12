<script setup lang="ts">
import CleanupChannelsPanel from '@/components/admin/discord_bot/CleanupChannelsPanel.vue';
import ManagedRolesPanel from '@/components/admin/discord_bot/ManagedRolesPanel.vue';
import ReminderChannelsPanel from '@/components/admin/discord_bot/ReminderChannelsPanel.vue';
import RepostChannelsPanel from '@/components/admin/discord_bot/RepostChannelsPanel.vue';
import { discordService } from '@/services/discord/discord.service';
import type {
  IBotConfig,
  IDiscordChannel,
  IDiscordRole,
  IServerList,
} from '@/services/discord/discord.types';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import Accordion from 'primevue/accordion';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import { computed, onMounted, ref } from 'vue';

useTitle('Discord Bot Configuration');

const allServers = ref<IServerList[] | null>(null);
const configLoading = ref(false);
const selectedServer = ref<string>('');

const config = ref<IBotConfig | null>(null);
const oldConfig = ref<IBotConfig | null>(null);
const allChannels = ref<IDiscordChannel[]>([]);
const allRoles = ref<IDiscordRole[]>([]);

onMounted(async () => {
  try {
    const data = await discordService.getServers();

    allServers.value = data;
  } catch (e) {
    console.error('error getting all servers', e);
  }
});

const loadBotConfig = async () => {
  if (!selectedServer.value) return;

  allRoles.value = [];
  allChannels.value = [];
  config.value = null;

  try {
    configLoading.value = true;

    const data = await discordService.getConfig(selectedServer.value);

    config.value = JSON.parse(JSON.stringify(data));
    oldConfig.value = JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error('error getting bot config', e);
  } finally {
    configLoading.value = false;
  }

  try {
    const data = await discordService.getServerChannels(selectedServer.value);

    allChannels.value = data;
  } catch (e) {
    console.error('error getting all channels', e);
  }

  try {
    const data = await discordService.getServerRoles(selectedServer.value);

    allRoles.value = data;
  } catch (e) {
    console.error('error getting all roles', e);
  }
};

const hasChanges = computed(() => {
  if (!oldConfig.value || !config.value) return false;

  return JSON.stringify(oldConfig.value) !== JSON.stringify(config.value);
});

const saveConfig = async () => {
  if (!config.value) return;

  try {
    await discordService.saveConfig(config.value);

    toastSuccess(
      'Config Saved!',
      'Discord configuration has been successfully saved!',
    );
    oldConfig.value = JSON.parse(JSON.stringify(config.value));
  } catch (e) {
    console.error('error saving config', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!allServers" />
  <Card v-else>
    <template #title>Discord Bot Configuration</template>
    <template #content>
      <Message
        v-if="hasChanges"
        severity="error"
        :closable="false"
        class="text-center justify-center mb-4"
        >UNSAVED CHANGES</Message
      >
      <Select
        :options="allServers"
        optionLabel="name"
        optionValue="id"
        v-model="selectedServer"
        @change="loadBotConfig"
        placeholder="Select a Server" />
      <Card v-if="config">
        <template #content>
          <ProgressSpinner v-if="configLoading" />
          <Accordion v-else>
            <ManagedRolesPanel v-model:config="config" :allRoles="allRoles" />
            <RepostChannelsPanel
              v-model:config="config"
              :allChannels="allChannels" />
            <CleanupChannelsPanel
              v-model:config="config"
              :allChannels="allChannels" />
            <ReminderChannelsPanel
              v-model:config="config"
              :allChannels="allChannels" />
          </Accordion>

          <div class="mt-5">
            <Message
              v-if="hasChanges"
              severity="error"
              :closable="false"
              class="text-center justify-center mb-4"
              >UNSAVED CHANGES</Message
            >
            <Button label="Save" @click="saveConfig" :disabled="!hasChanges" />
          </div>
        </template>
      </Card>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
