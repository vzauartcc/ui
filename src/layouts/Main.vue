<script setup lang="ts">
import AppFooter from '@/components/layout/Footer.vue';
import AppHeader from '@/components/layout/Header.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();

const showNotice = ref(false);

onMounted(() => {
  checkAcknowledgement();
});

const saveAcknowledgement = () => {
  try {
    localStorage.setItem('notice', 'true');

    showNotice.value = false;
  } catch (e) {
    console.error('error saving notice acknowledgement', e);
  }
};

watch(
  () => route.path,
  () => {
    checkAcknowledgement();
  },
);

const checkAcknowledgement = () => {
  try {
    const data = localStorage.getItem('notice');

    showNotice.value = data !== 'true';
  } catch (e) {
    console.error('error checking notice acknowledgement', e);
  }
};
</script>

<template>
  <Dialog v-model:visible="showNotice" modal header="Notice" class="md:w-1/2">
    <span>
      All information contained on this website is intended for flight
      simulation purposes only and
      <span class="text-red-500 font-bold"
        >should not be used for real-world navigation or flight
        information</span
      >. The Virtual Chicago ARTCC is in no way connected with the FAA, ICAO,
      NATCA, or any other governing aviation body.
    </span>
    <template #footer>
      <Button
        type="button"
        label="I understand"
        @click.prevent="saveAcknowledgement" />
      <a
        href="https://www.faa.gov/about/office_org/headquarters_offices/ato/service_units/air_traffic_services/artcc/chicago">
        <Button type="button" label="Leave site" severity="secondary" />
      </a>
    </template>
  </Dialog>

  <div id="container" class="flex h-screen flex-col">
    <AppHeader />
    <main class="mt-2 flex-1-0-auto my-5 mx-auto md:w-10/12">
      <div class="row main-content wrapper">
        <div class="main_content col s12 18 push-14">
          <router-view></router-view>
        </div>
        <div class="sidebar col s12 14 pull-18">
          <!-- <Sidebar /> -->
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<style lang="css" scoped></style>
