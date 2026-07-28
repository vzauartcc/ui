<script setup lang="ts">
import { userService } from '@/services/user/user.service';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import { toastError } from '@/utils/toast';
import { HTTPError } from 'ky';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('Processing Login. . .');

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);

onMounted(async () => {
  const code = route.query.code;

  if (!code || Array.isArray(code)) {
    console.error('invalid or missing auth code');

    toastError('Error logging in!', 'Invalid or missing auth code.');
    router.push('/');

    return;
  }

  try {
    await userService.processLogin(code);

    await userStore.getUser(true);

    const redirectTo = localStorage.getItem('redirect') || '/';

    localStorage.removeItem('redirect');

    router.push(redirectTo);
  } catch (e) {
    if (e instanceof HTTPError && e.response) {
      const data = await e.response.json();
      if (
        e.response.status === 400 &&
        data.message.includes('[Authorize Data]')
      ) {
        toastError(
          'Authorization Failure!',
          'Unable to process login, please authorize all requested VATSIM data.',
        );
      } else {
        toastError(
          'Error Logging In!',
          data.message || 'Something went wrong, please try again later',
        );
      }
    } else {
      loading.value = false;
      console.error('error logging in', e);
      toastError(
        'Error Logging In!',
        'Something went wrong, please try again later.',
      );
    }
  }
});
</script>

<template>
  <Card>
    <template #title>Processing login, please wait. . . .</template>
    <template #content>
      <ProgressSpinner v-if="loading" />
      <p v-else>
        An error has occurred logging you in. Please try again later.
      </p>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
