<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import Button from 'primevue/button';
import { useRoute } from 'vue-router';

const route = useRoute();
const { loginWithVatsim } = useAuth();

const doLogin = () => {
  loginWithVatsim(route.path);
};
</script>

<template>
  <Button
    @click.prevent="doLogin"
    label="Log in with VATSIM"
    class="block w-fit mx-auto" />
</template>

<style lang="css" scoped></style>
