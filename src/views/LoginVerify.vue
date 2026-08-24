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
    let errorMessage = 'Something went wrong, please try again later.';

    if (e instanceof HTTPError) {
      try {
        const data = await e.response.json();
        if (data && typeof data.message === 'string') {
          errorMessage = data.message;
        }
      } catch {
        // Non-JSON error body (e.g., nginx 502/504 HTML page)
        errorMessage = `Server error (${e.response.status}). Please try again later.`;
      }

      if (
        e.response.status === 400 &&
        errorMessage.includes('[Authorize Data]')
      ) {
        toastError(
          'Authorization Failure!',
          'Unable to process login, please authorize all requested VATSIM data.',
        );
      } else {
        toastError('Error Logging In!', errorMessage);
      }
    } else {
      console.error('error logging in', e);
      toastError('Error Logging In!', errorMessage);
    }
  } finally {
    loading.value = false;
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
