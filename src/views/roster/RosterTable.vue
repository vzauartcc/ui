<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue';
import RosterTable from '@/components/roster/RosterTable.vue';
import { controllerService } from '@/services/controller/controller.service';
import type { IController } from '@/services/controller/controller.types';
import { useUserStore } from '@/stores/user.js';
import { useTitle } from '@/utils/title';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Roster');

const homeControllers = ref<IController[] | null>(null);
const visitingControllers = ref<IController[] | null>(null);

const userStore = useUserStore();
const { isLoggedIn } = storeToRefs(userStore);

onMounted(async () => {
  try {
    if (!isLoggedIn.value) {
      return;
    }

    const controllers = await controllerService.getControllers();

    homeControllers.value = controllers.home.sort((a, b) => {
      return (
        a.lname.localeCompare(b.lname) ||
        a.fname.localeCompare(b.fname) ||
        a.rating - b.rating
      );
    });
    visitingControllers.value = controllers.visiting.sort((a, b) => {
      return (
        a.lname.localeCompare(b.lname) ||
        a.fname.localeCompare(b.fname) ||
        a.rating - b.rating
      );
    });
  } catch (e) {
    console.error('error getting roster', e);
  }
});
</script>

<template>
  <Card v-if="!isLoggedIn">
    <template #title>Please Log In</template>
    <template #content>
      <p>To view the roster, please log in with your VATSIM account</p>
      <LoginButton />
    </template>
  </Card>
  <template v-else>
    <Card>
      <template #title>Home Controllers</template>
      <template #content>
        <ProgressSpinner v-if="!homeControllers" />
        <RosterTable v-else :controllers="homeControllers" />
      </template>
    </Card>
    <br />
    <Card>
      <template #title>Visiting Controllers</template>
      <template #content>
        <ProgressSpinner v-if="!visitingControllers" />
        <RosterTable v-else :controllers="visitingControllers" />
      </template>
    </Card>
  </template>
</template>

<style lang="css" scoped></style>
