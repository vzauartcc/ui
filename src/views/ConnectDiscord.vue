<script setup lang="ts">
import { discordService } from '@/services/discord/discord.service';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('Processing data. . . .');

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { execute } = useAsyncSubmit();

const errorCode = ref('');
const errorDescription = ref('');

onMounted(async () => {
  errorCode.value =
    (Array.isArray(route.query.error)
      ? route.query.error[0]
      : route.query.error) || '';

  const rawDescription =
    (Array.isArray(route.query.error_description)
      ? route.query.error_description[0]
      : route.query.error_description) || '';

  errorDescription.value =
    typeof rawDescription === 'string'
      ? rawDescription.replace(/\+/g, ' ')
      : '';

  if (errorCode.value) {
    toastError(
      'Error Linking Discord!',
      `Failed to link Discord: ${errorDescription.value || 'Unknown error'}.`,
    );
    return redirect();
  }

  const discordCode =
    (Array.isArray(route.query.code)
      ? route.query.code[0]
      : route.query.code) || '';

  if (!discordCode) {
    toastError(
      'Error Linking Discord!',
      'Failed to link Discord: Invalid code.',
    );
    return redirect();
  }

  await execute(async () => {
    await discordService.linkDiscord(discordCode);

    toastSuccess(
      'Discord Account Linked!',
      'Successfully linked your Discord account. Role syncing in progress.',
    );
  });

  redirect();
});

const redirect = async () => {
  await userStore.getUser(true);

  router.push('/dash');
};
</script>

<template>
  <Card>
    <template #content>
      <ProgressSpinner />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
