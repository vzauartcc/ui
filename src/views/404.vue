<script setup lang="ts">
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';

useTitle('404 - Page not found');
</script>

<template>
  <Card>
    <template #title>404 - Page Not Found</template>
    <template #content>
      <p>
        We're sorry, but the content you requested could not be found, If you
        believe that you are receiving this message in error, please
        <a class="underline" href="mailto:wm@zauartcc.org">email the web team</a
        >. In the meantime, here is an image of an F14 to ease your sorrows.
      </p>
      <img
        src="@/assets/images/f14.webp"
        alt="F14 taking off from an aircraft carrier" />
    </template>
  </Card>
</template>

<style scoped></style>
