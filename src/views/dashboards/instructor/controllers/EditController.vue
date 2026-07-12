<script setup lang="ts">
import EditController from '@/components/EditController.vue';
import { useTitle } from '@/utils/title';
import { useRoute } from 'vue-router';

useTitle('Edit Controller');

const route = useRoute();
const cid = Array.isArray(route.params.cid)
  ? route.params.cid[0]
  : route.params.cid;
</script>

<template>
  <EditController :cid="cid!" />
</template>

<style lang="css" scoped></style>
